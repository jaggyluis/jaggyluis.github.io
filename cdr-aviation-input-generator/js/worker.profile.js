importScripts('lib/aviation.min.js', 'lib/numeric.js', 'lib/d3.v3.min.js');

function loadFile(filePath, done) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () { return done(this.responseText); };
    xhr.open("GET", filePath, true);
    xhr.send();
}

function wrangleDesignDayData (designDayData) {

	//
	// SFO specific turnaround time calculator
	//
	function calcTT(flight) {

		var minTurnaroundTime = 35; // min

		var tt = flight['TT'],
			nt,
			gt = [],
			st = [],
			curr = [],
			i;

		Object.keys(flight).forEach(function(key) {
			if (!isNaN(Number(key))) gt.push(Number(flight[key]));
		})
		
		for (i=0; i<gt.length; i++) {
			if (gt[i] !== 0){
				curr.push(gt[i])
			} else {
				if (gt[i-1] !== 0 && gt[i-1] !== undefined) {
					st.push(curr.slice());
					curr = [];
				}
			}
		}

		nt = st.pop();

		if (nt === undefined) {
			nt = null;
		} else {
			nt = (nt.length * 5) - 20;
			nt = nt > minTurnaroundTime //
				? aviation.core.time.minutesToDecimalDay(nt)
				: null;
		}
		if (!tt) {
			tt = null;
		}
		else {
			tt = aviation.core.time.toDecimalDay(tt);
		}

		tt = tt !== null && nt !== null
			? tt <= nt
				? tt
				: nt
			: tt !== null
				? tt
				: nt !== null
					? nt
					: null

		return tt;
	}

	return designDayData.reduce(function(arr, flight) {

		flight = aviation.core.obj.parse(flight);

		if (aviation.core.obj.isNull(flight)) return arr;

		var f = {

			'airline' : flight['OPERATOR'],
			'aircraft' : flight['AIRCRAFT'],
			'seats' : flight['SEAT CONFIG.'],
			'tt' :  calcTT(flight),
			'time' : flight['D TIME'] ? aviation.core.time.toDecimalDay(flight['D TIME']) : null,
			'di' : flight['D D/I'] === 'D' ? 'domestic' : 'international',
			'flight' : flight['D FLIGHT #'],
			'destination' : flight['DEST.'],
			'ba' : flight['Analysis Boarding Area'],
			'dep' : flight['DEP'] === 1 ? true : false

		};

		arr.push(f);

		return arr;

	}, []);
}
function wranglePassengerData (passengerData, lexicon) {

	return passengerData.reduce(function(arr, passenger) {

		passenger = aviation.core.obj.parse(passenger);

		if (aviation.core.obj.isNull(passenger)) return arr;

		var p =  {

			'airline' : lexicon['AIRLINE'][passenger['AIRLINE']],
			'destination' : lexicon['DESTINATION'][passenger['DEST']],
			'arrival' : aviation.core.time.toDecimalDay(passenger['ARRTIME']),
			'departure' : aviation.core.time.toDecimalDay(passenger['DEPTIME']),
			'am' : aviation.core.time.toDecimalDay(passenger['DEPTIME']) < 0.375 ? 
				'pre9AM' : 
				'post9AM',
			'di' : passenger['DESTGEO'] < 4
						? 'domestic'
						: 'international',
			'dt' : [passenger['Q3GETTO1'],passenger['Q3GETTO2'],passenger['Q3GETTO3']].includes(3)
						? 'transfer'
						: 'departing',
			'type' : [passenger['Q2PURP1'],passenger['Q2PURP2'],passenger['Q2PURP3']].includes(1)
						? 'business'
						: [passenger['Q2PURP1'],passenger['Q2PURP2'],passenger['Q2PURP3']].includes(2)
							? 'leisure'
							: 'other',
			'weight' : passenger['WEIGHT'] ? passenger['WEIGHT'] : 1,
			'gate' : passenger['GATE'],
			'bags' : passenger['Q4BAGS'] === 1 ? true : false,
			'shop' : passenger['Q4STORE'] === 1 ? true : false,
			'brshop' : null,
			'food' : passenger['Q4FOOD'] === 1 ? true : false,
			'brfood' : null,
		};

		arr.push(p);

		return arr;

	}, []);
}
function wranglePropensityData (propensityData) {

	var pts = propensityData.reduce(function(arr, passenger) {

		passenger = aviation.core.obj.parse(passenger);

		if (aviation.core.obj.isNull(passenger)) return arr;

		var p =  {
			x : passenger.buy,
			y : passenger.browse
		};

		arr.push(p);

		return arr;

	}, []);

	//
	// From somewhere on stackOverflow - not sure
	//
	var order = 1;
	var xArr = pts.map(function(pt) {

	    return pt.x;
	});
	var yArr = pts.map(function(pt) {

	    return pt.y;
	});
	var xMatrix = [];
	var xTemp = [];
	var yMatrix = numeric.transpose([yArr]);

	for (j=0;j<xArr.length;j++) {
	    xTemp = [];
	    for(i=0;i<=order;i++)
	    {
	        xTemp.push(1*Math.pow(xArr[j],i));
	    }
	    xMatrix.push(xTemp);
	}
	var xMatrixT = numeric.transpose(xMatrix);
	var dot1 = numeric.dot(xMatrixT,xMatrix);
	var dotInv = numeric.inv(dot1);
	var dot2 = numeric.dot(xMatrixT,yMatrix);
	var solution = numeric.dot(dotInv,dot2);

	var fn = function(x) {

	    var y = 0;

	    for (var i=0; i<solution.length; i++) {
	      y+= solution[i] * Math.pow(x, i);
	    }

	    if (y < 0) {
	    	
	    	y =  0;
	    
	    } else if (y > 1) {

	    	y = 1;
	    }

	    return y;
	    
	};

	return fn;
}

var designDayFilePath = '../doc/designday.csv',
	designDayData;

var passengerFilePath = '../doc/passengerdata/sfo/',
	passengerFiles = ['p13.csv', 'p14.csv', 'p15.csv'],
	passengerData = [];

var lexiconFilePath = '../doc/passengerdata/sfo/lexicon.json',
	lexiconData;

var propensityFilePath = '../doc/passengerdata/dia/propensities.csv',
	propensityData,
	propensityfunc;

var typeData = ['di', 'type', 'dt', 'am', 'bags'],
	timeSlice;


self.addEventListener('message', function(e) {

	passengerFiles.forEach(function (file, i) {

	    d3.csv(passengerFilePath+file, function (responseText) {
	        
	        passengerData = passengerData.concat(responseText);

	        if (i === passengerFiles.length-1) {

		    	loadFile(lexiconFilePath, function(responseText) {

		    		lexiconData = JSON.parse(responseText);

		    		d3.csv(propensityFilePath, function(responseText) {

		    			propensityData = responseText;

		    			d3.csv(designDayFilePath, function(responseText) {

		    				passengerData = wranglePassengerData(passengerData, lexiconData);
		    				passengerData = passengerData.filter(function(passenger) {

								if (passenger.arrival && passenger.departure) {

									var t = passenger.departure - passenger.arrival;

									//
									// 	Passenger cleanup - valid passenger data for analysis is between
									//	30 min and 6 hours in the airport.
									//

									if (t < (6/24) && t > (0.5/24)) {
										
										return true;
									}
								}

								return false;

							});
			    			designDayData = wrangleDesignDayData(responseText);
			    			propensityFunc = wranglePropensityData(propensityData);
			    			timeSlice = e.data.timeSlice;
			   				profiler = aviation.profiles.Profiler(passengerData, designDayData, typeData, timeSlice, propensityFunc);
			   				profiler.buildProfiles();

			   				designDayData = designDayData.filter(function(flight) {

			   					//
			   					//	Flight cleanup - Boarding Area 1 / departing
			   					//	Delta - BAC / Other - BAB
			   					//

			    				if (flight.ba === 1 && flight.dep === true) {

			    					flight.ba = flight.airline === 'DL' ? 'C' : 'B';

			    					return true;
			    				}

			    				return false;
			    			})

							self.postMessage({
								"flights" : designDayData,
								"passengerProfiles" : profiler.passengerProfiles.map(function(p) { return p.serialize(); }),
								"flightProfiles" : profiler.flightProfiles.map(function(f) { return f.serialize(); }),
							});

							close();
			    		});
		    		});
		    	});
	    	}
	    });
	});
}, false);



