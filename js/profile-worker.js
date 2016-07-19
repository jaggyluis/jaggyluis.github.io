
importScripts('lib/numeric-1.2.6.js',
	'lib/aviation/airports.js',
	'lib/aviation/airlines.js',
	'lib/aviation/aircraft.js',
	'lib/aviation/tt.js',
	'lib/aviation/aviation.js');

///
/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
///

var FlightBuilder = function (designDay, filter) {

	this.designDay = designDay;
	this.flights = this.filterFlightsByTerminal(this.designDay, filter);
	this.flights = this.filterFlightsByDeparture(this.flights);
	this.flights = this.formatFlights(this.flights);
}
FlightBuilder.prototype = {

	filterFlightsByTerminal : function (flights, terminal) {

		if (terminal.toLowerCase().match(/int/)) terminal = 4

		return flights.filter(function(flight) {

			var t = flight['Analysis Boarding Area'];

			switch(1) {

				case 1 :

					return t === 1;

				case 2 : 

					return t === 2;

				case 2 : 

					return t === 3;

				case 4 : 

					return t === 'A' || 'G' ;

				default :

					return t !== undefined && 
						t !== null && 
						t !== 'MARS' && 
						t !== 'SWING';				
			}
		});
	},
	filterFlightsByDeparture : function (flights){

		return flights.filter(function(flight) {

			return flight['DEP'] === 1;

		});
	},
	formatFlights : function (flights)  {

		return flights.map((function(flight) {

			return this.formatFlight(flight);

		}).bind(this));
	},
	formatFlight : function (flight) {

		return {
			airline : flight['OPERATOR'],
			aircraft : flight['AIRCRAFT'],
			seats : flight['SEAT CONFIG.'],
			tt : flight['TT'],
			time : flight['D TIME'],
			di : flight['D D/I'] === 'D' ? 'domestic' : 'international',
			flight : flight['D FLIGHT #'],
			destination : flight['DEST.']
		}
	},
	getFlights : function() {

		return this.flights;
	}
}

var ProfileBuilder = function (passengers) {

	function makeFitFn (pts, order) {
		  
		var xArr = pts.map(function(pt) {

		    return pt.x;
		})
		var yArr = pts.map(function(pt) {

		    return pt.y;
		})
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

		    return y > 0 ? y : 0;
		    
		}

		return fn;
	}

	var func = makeFitFn(propensities.map(function(p) {

		return {
			x : p.buy,
			y : p.browse
		}

	}), 1);

	function TypeClass (name, pArr, length, trace) {

		var type = this._getPassengersByType(pArr);
		var dt = this._getPassengersByDT(pArr);
		var di = this._getPassengersByDI(pArr);

		this._name = name;
		this._data = this._getTypeProfile(pArr, length);
		this._pax = pArr;

		if (!trace.includes('type')) {

			var ty = trace.slice();

			ty.push('type');
			this.business = new TypeClass(this._name+'.'+'business', type.business, length, ty);
			this.leisure = new TypeClass(this._name+'.'+'leisure', type.leisure, length, ty);
			this.other = new TypeClass(this._name+'.'+'other', type.other, length, ty);
		}
		if (!trace.includes('di')) {

			var ti = trace.slice();

			ti.push('di');
			this.domestic = new TypeClass(this._name+'.'+'domestic', di.domestic, length, ti);
			this.international = new TypeClass(this._name+'.'+'international', di.international, length, ti);
		}
		if (!trace.includes('dt')) {

			var tt = trace.slice();

			tt.push('dt');
			this.departing = new TypeClass(this._name+'.'+'departing', dt.departing, length, tt);
			this.transfer = new TypeClass(this._name+'.'+'transfer', dt.transfer, length, tt);
		}
		var _types = this._filterTypes();
		if(!Object.keys(_types).includes(this._name)) this._types = _types;
	};
	TypeClass.prototype = {

		_getPaxProfile : function (timeSlice) {

			var pax = this._getPaxData(this._pax, lexicon),
				data = this._data;
				dist = {};

			for (var t in pax) {
				dist[t] = this._getArrivalDistribution(pax[t], timeSlice);
			}

			return {
				_name: this._name,
				pax : pax,
				data : data,
				dist : dist
			};

		},
		_getArrivalDistribution : function (pArr, mod) {

			var delta = [],
				dist;

			pArr.forEach(function(p) {

				var arrTime,
					depTime;

				if (AVIATION.time.isapTime(p.ARRTIME)) {
					arrTime = AVIATION.time.apTimeToDecimalDay(p.ARRTIME);
				} else if(AVIATION.time.isTime(p.ARRTIME)) {
					arrTime = AVIATION.time.timeToDecimalDay(p.ARRTIME);
				} else if (!isNaN(p.ARRTIME)) {
					arrTime = p.ARRTIME;
				}
				if (AVIATION.time.isapTime(p.DEPTIME)) {
					depTime = AVIATION.time.apTimeToDecimalDay(p.DEPTIME);
				} else if(AVIATION.time.isTime(p.DEPTIME)) {
					depTime = AVIATION.time.timeToDecimalDay(p.DEPTIME);
				} else if (!isNaN(p.DEPTIME)) {
					depTime = p.DEPTIME;
				}
				if (arrTime && depTime) {
					var near = AVIATION.math.round(AVIATION.time.decimalDayToMinutes(depTime-arrTime), mod)
					delta.push(near);
				}
			});

			dist = AVIATION.array.mapElementsToObjByPercentile(delta, true);

			return dist;
		},
		_getTypes () {

			var types = [];

			for (var type in this) {
				if (!type.match(/_/)){
					types.push(type);
				} 
			};

			return types;
		},
		_uniq : function () {

			function _permutator(inputArr) {
				/*
				 * Modified from
				 * http://stackoverflow.com/
				 * questions/9960908/permutations-in-javascript
				 *
				 */
			    var results = [];

			    function permute(arr, memo) {

			    	var cur, memo = memo || [];

			    	for (var i = 0; i < arr.length; i++) {
			      		cur = arr.splice(i, 1);
			      		if (arr.length === 0) {
			        		results.push(memo.concat(cur).join('.'));
			      		}
			      		permute(arr.slice(), memo.concat(cur));
			      		arr.splice(i, 0, cur[0]);
			    	}
			    	return results.join(' ');
			 	}
			  	return permute(inputArr);
			}

			var uniq = [],
				perm = '',
				self = this;

			this._getTypes().forEach(function(type) {

				var u = self[type]._uniq();

				perm+=' '+u[1];
				u[0].forEach(function(uArr) {

					var l = [type].concat(uArr),
						t = l.join('.');

					if (!perm.match(t)) {
						uniq.push(l);
						perm+=' '+_permutator(l);
					}
				})
			})
			if (uniq.length) {

				return [uniq, perm];

			} else {

				return [[[]], ''];
			}
		},
		_filterTypes : function() {

			var u = this._uniq(),
				types = {};

			for(var type in u[0]){

				var keys = u[0][type].slice(),
					curr = this; 

				for (var i=0; i<keys.length; i++){
					curr = curr[keys[i]];
				}
				types[curr._name] = curr;
			}

			return types;
		},
		_getPassengersByDI : function (pArr) {

			var filtered = {
				domestic : [],
				international : [],
			}
			pArr.forEach(function(p) {

				switch (p['DESTGEO'] >= 4) {

					case false:

						filtered.domestic.push(p);

						break;

					case true :

						filtered.international.push(p);

						break;

					default:

						break;
				}
			});
			return filtered;
		},
		_getPassengersByDT : function (pArr) {

			var filtered = {
				departing : [],
				transfer : []
			}

			pArr.forEach(function(p) {

				for (var i=1; i<=6; i++) {

					var dt = p['Q3GETTO'+i.toString()]
					var arrTime = p['ARRTIME'];

					if (dt === 3 || arrTime === 'N') {
						filtered.transfer.push(p);

						return;
					}
				}
				filtered.departing.push(p);

				return;
			});

			return filtered;
		},
		_getPassengersByType : function (pArr) {

			var filtered = {
				leisure : [],
				business : [],
				other : []
			};

			pArr.forEach(function(p) {
				for (var i=1; i<=3; i++) {

					var type = p['Q2PURP'+i.toString()]

					switch ( type ) {

						case 1 :

							filtered.business.push(p);

							return;

						case 2 || 3 || 4 || 5 || 6: 

							filtered.leisure.push(p);

							return;

						default :

							break;
					}
				}
				filtered.other.push(p);
				return;
			});
			return filtered;
		},
		_getTypeProfile : function (pArr, total, weighted) {
			
			var count = 0,
				weighted = weighted === undefined ? false : weighted,
				filtered = {
				bags : 0,
				brshop : null,
				shop : 0,
				brfood : null,
				food : 0,
			};
			pArr.forEach(function(p) {

				var weight = p.WEIGHT && weighted ? p.WEIGHT : 1;

				count++;
				if(p.Q4BAGS === 1) filtered.bags+=weight;
				if(p.Q4STORE === 1) filtered.shop+=weight;
				if(p.Q4FOOD === 1) filtered.food+=weight;
			});
			return Object.keys(filtered).reduce(function(a,b) {
				if ('br'+b.toString() in filtered) a['br'+b.toString()] = Math.round(func(filtered[b]/count)*100);
				a[b] = Math.round((filtered[b]/count)*100);

				return a;

			},{
				count:count, 
				weighted:weighted, 
				percentage: Math.round(count/total*100)
			});
		},
		_getPaxData : function (pArr, lexicon) {

			var flights = [];
			var passengers = pArr;
			var typeData = {};
			//console.log('total passengers: ', passengers.length);

			var destinations = AVIATION.array.mapElementsToObjByKey(passengers, 'DEST');

			Object.keys(destinations).map(function(dest) {

				var aLib = AVIATION.array.mapElementsToObjByKey(destinations[dest], 'AIRLINE');

				for (var airline in aLib) {
					flights.push({
						passengers : aLib[airline],
						flight : aLib[airline][0].FLIGHT,
						destination : lexicon.DESTINATION[dest],
						airline : lexicon.AIRLINE[airline],
						aircraft : null,
					})
				}
			})
			//console.log('total flight types: ', flights.length)
			var sorted = flights.sort(function(a,b) {

				return b.passengers.length - a.passengers.length
			});
			sorted.forEach((function(f) {

				var airport = AVIATION.get.airportByString(f.destination);
				var airline = AVIATION.get.airlineByCode(f.airline);
				
				if (airport !== undefined && airline !== undefined) {

					var matchedFlights = designDay.filter(function(flight) {

						return flight.OPERATOR == airline.IATA && 
							flight["DEST."] == airport.IATA

					});
					if (matchedFlights.length !== 0) {
						//console.log(airport.IATA, airline.IATA);
						//console.log(matchedFlights);
						var types = matchedFlights.map(function(m) {

							try {

								return AVIATION.get.aircraftByCode(m.AIRCRAFT).RFLW;

							} catch (e) {

								//console.warn('not in library: ', m.AIRCRAFT)
								return '_';
							}
						});

						var type = AVIATION.array.mode(types);

						if (type in typeData) {
							f.passengers.forEach(function(p) {
								typeData[type].push(p);
							})
						} else {
							typeData[type] = f.passengers;
						}
					} else {
						//console.warn('flight not matched');
						//console.warn(f)
					}
				}
			}).bind(this));

			return typeData;
		}
	}


	function FlightClass (name, types) {

		this._name = name;
		this._types = types;
		this._di = this._getDIDist();
		this._percs = this._getPercs();
	}
	FlightClass.prototype = {

		_getDIDist : function() {

			var dist = {
				domestic : {},
				international : {}
			};

			for (var type in this._types) {
				if (type.split('.').includes('domestic')) {
					dist.domestic[type] = this._types[type];
				} else if (type.split('.').includes('international')) {
					dist.international[type] = this._types[type];
				}
			}

			return dist;
		},
		_getPercArray : function (dist) {

			var arr = [];

			for (var d in dist) {
				for (var i=0; i<dist[d].percentage; i++) {
					arr.push(d);
				}
			}

			return arr;
		},
		_getPercs : function() {

			var perc = {};

			for (var d in this._di) {

				var count = 0

				perc[d] = {}
				for (var t in this._di[d]) {
					perc[d][t] = this._di[d][t].pax.length
					count+=this._di[d][t].pax.length
				}
				for (var p in perc[d]){
					perc[d][p] = {
						count : perc[d][p],
						percentage : Math.round(perc[d][p]/count*100),
						dist : this._types[p].dist
					}
				} 
			}
			return perc;
		}
	};

	this.flightProfiles = {};
	this.flights = [];
	this.types = [];
	this.typeClass = null;
	this.run = function (filter, timeSlice, cb) {

		function filterKey(key) {

			switch (+key) {

				case 1 : 

					// 32 gates
					return function(p) {

						return p.BAREA == 'B' || (p.GATE >= 20 && p.GATE <= 39) ||
						p.BAREA == 'C' || (p.GATE >= 40 && p.GATE <= 48);
					}

				case 2 :

					// 14 gates
					return function(p) {

						return p.BAREA == 'D' || (p.GATE >= 50 && p.GATE <= 59);
					}

				case 3 : 

					// 36 gates
					return function(p) {

						return p.BAREA == 'E' || (p.GATE >= 60 && p.GATE <= 69) ||
						p.BAREA == 'F' || (p.GATE >= 70 && p.GATE <= 90);
					}

				case 4 :

					// 28 gates
					return function(p) {

						return p.BAREA == 'A' || (p.GATE >= 1 && p.GATE <= 12) ||
							p.BAREA == 'G' || (p.GATE >= 91 && p.GATE <= 102);
					}

				default :

					return function(p) {

						return true;
					}
			}
		};

		if (filter.toLowerCase().match(/int/)) filter = 4
	
		passengers = passengers.filter(filterKey(filter));

		//
		//	Assumptions (Data cleansing) - 
		//
		//	- max time in airport - 6 hours
		//	- check-in cutoff (no bags) - 30 min
		//	- check-in cutoff (bag check) - 90 min
		//	- passengers that either do not 
		//	have a departure time or an arrival time.
		//
		//	Weighting - 
		//
		//	Samples sizes per terminal, boarding area, airline, 
		//	and time of day were weighted to reflect actual customer 
		//	traffic disbursement (SFO dataset).
		//

		
		var culled = [],
			maxThreshold = 6
			minThreshold = 0.5
		
		passengers = passengers.filter(function(p) {

			var arrTime,
				depTime;

			if (AVIATION.time.isapTime(p.ARRTIME)) {
				arrTime = AVIATION.time.apTimeToDecimalDay(p.ARRTIME);
			} else if(AVIATION.time.isTime(p.ARRTIME)) {
				arrTime = AVIATION.time.timeToDecimalDay(p.ARRTIME);
			} else if (!isNaN(p.ARRTIME)) {
				arrTime = p.ARRTIME;
			}
			if (AVIATION.time.isapTime(p.DEPTIME)) {
				depTime = AVIATION.time.apTimeToDecimalDay(p.DEPTIME);
			} else if(AVIATION.time.isTime(p.DEPTIME)) {
				depTime = AVIATION.time.timeToDecimalDay(p.DEPTIME);
			} else if (!isNaN(p.DEPTIME)) {
				depTime = p.DEPTIME;
			}
			if (arrTime && depTime) {

				var near = AVIATION.math.round(AVIATION.time.decimalDayToMinutes(depTime-arrTime), timeSlice)
				
				if (near < maxThreshold * 60 && near > minThreshold * 60 ) {

					return true;

				} else {
					culled.push(p);

					return false;
				}
			} else {
				culled.push(p);

				return false;
			}
		})

		console.warn('passengers culled : ', culled.length)
		
		filter = ['all', 't1','t2','t3','ti'][+filter];

		this.typeClass = new TypeClass( filter , 
				passengers, 
				passengers.length, 
				[]);

		for (var type in this.typeClass._types) {

			var obj = this.typeClass._types[type];
			var profile = obj._getPaxProfile(timeSlice);

			this.types.push(obj);

			for (var p in profile.pax) {
				if (!(p in this.flightProfiles)) this.flightProfiles[p] = {};
				this.flightProfiles[p][profile._name] = {
					pax : profile.pax[p],
		    		dist : profile.dist[p]
				}
			}
		}
		for (var flightType in this.flightProfiles) {
    		this.flights.push(new FlightClass(flightType, this.flightProfiles[flightType]));
		}

		return cb();
	};
	this.getProfiles = function () {
		
		return this.flights;
	};
	this.getTypes = function () {

		return this.types;
	};
}


///
/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
///


var designDayFilePath = 'var/sfo/designday.json',
	designDay;

var gateLayoutFilePath = 'var/sfo/gatelayout.json',
	gateLayout;

var passengerFilePath = 'var/sfo/passengers/',
	passengerFiles = ['p12.json', 'p13.json', 'p14.json', 'p15.json'],
	passengerData = [];

var lexiconFilePath = 'var/sfo/passengers/lexicon.json',
	lexicon;

var propensityFilePath = 'var/dia/passengers/propensities.json',
	propensities;


self.addEventListener('message', function(e) {

	passengerFiles.forEach(function (file, i) {
	    loadFile(passengerFilePath+file, function (responseText) {
	        
	        passengerData = passengerData.concat(JSON.parse(responseText));

	        if (i === passengerFiles.length-1) {
		    	loadFile(lexiconFilePath, function(responseText) {

		    		lexicon = JSON.parse(responseText);

		    		loadFile(propensityFilePath, function(responseText) {

		    			propensities = JSON.parse(responseText);

		    			loadFile(designDayFilePath, function(responseText) {

			    			designDay = JSON.parse(responseText);

			    			loadFile(gateLayoutFilePath, function(responseText) {

			    				gateLayout = JSON.parse(responseText);

								var terminalFilter = e.data.terminalFilter,
									flightBuilder = new FlightBuilder(designDay, terminalFilter),
									profileBuilder = new ProfileBuilder(passengerData);

								profileBuilder.run(e.data.terminalFilter, e.data.timeSlice, function(data) {

									self.postMessage({
										"profiles" : profileBuilder.getProfiles(),
										"flights" : flightBuilder.getFlights(),
										"types" : profileBuilder.getTypes(),
										"gates" : gateLayout
									});

								});
			    			})
			    		})
		    		})
		    	});
	    	}
	    });
	});
}, false);

function loadFile(filePath, done) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () { return done(this.responseText) }
    xhr.open("GET", filePath, true);
    xhr.send();
}


