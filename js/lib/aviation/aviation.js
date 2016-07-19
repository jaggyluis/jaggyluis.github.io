var AVIATION = (function (aviation) {


	aviation._flights = [];
	aviation._gates = [];
	aviation._flightProfiles = [];
	aviation._passengerProfiles = [];

	aviation.time = {

		decimalDayToTime : function (dday) {

			dday = dday >= 0 ? dday : 1 + dday;

			var hours = Number((dday * 24).toString().split('.')[0]),
				minutes = Number((dday * 24 * 60 - hours * 60).toString().split('.')[0]),
				seconds = Number((dday * 24 * 60 * 60 - hours * 60 * 60 - minutes * 60).toString().split('.')[0]);

			hours = hours > 0 ? hours.toString() : '00';
			minutes = minutes > 0 ? minutes.toString() : '00';
			seconds = seconds > 0 ? seconds.toString() : '00';
			hours = hours.length > 1 ? hours : "0"+ hours;
			minutes = minutes.length > 1 ? minutes: "0"+ minutes;
			seconds = seconds.length > 1 ? seconds: "0"+ seconds;

			return hours+':'+minutes+':'+seconds;
		},
		decimalDayToMinutes : function (dday) {

			dday = dday >= 0 ? dday : 1 + dday;

			return Number((dday*24*60).toString().split('.')[0]);
		},
		decimalDayDelta : function (fdday, tdday) {

			return tdday - fdday < 0 ? tdday - fdday + 1 : tdday - fdday;

		},
		timeToDecimalDay : function (time) {

			var splitStr = time.split(':'),
				hours = Number(splitStr[0]),
				minutes = Number(splitStr[1]),
				seconds = null;

			return this.minutesToDecimalDay(hours * 60 + minutes);
		},
		minutesToDecimalDay : function (minutes) {

			var hours = minutes/60,
				dday = hours/24;

			return dday;
		},
		secondsToDecimalDay : function (seconds) {

			return this.minutesToDecimalDay(seconds / 60);
		},
		apTimeToDecimalDay : function (str) {

			var time = str.split(/[: ]/),
				hours = time[2] === 'AM' ? time[0] : 
						time[2] === 'PM' ? (Number(time[0]) + 12).toString() :
						time[2],
				minutes = time[1];

			return this.timeToDecimalDay(hours+':'+minutes);
		},
		isTime : function(str) {

			return str.toString().match(/\d{1,2}:\d{2}(?!\D)/) !== null;
		},
		isapTime : function (str) {

			return ['AM', 'PM'].includes(str.toString().split(/ /).reverse()[0]);
		},
		romanToNumber : function (str) {

			var dict = {
				"I" : 1,
				"II" : 2,
				"III" : 3,
				"IV" : 4,
				"V" : 5,
				"VI" : 6,
			};

			if (dict[str] !== undefined) {

				return dict[str];

			} else {

				return 3; 
			}
		},
		romanToLetter : function(str) {

			var dict = {
				"I" : 'A',
				"II" : 'B',
				"III" : 'C',
				"IV" : 'D',
				"V" : 'E',
				"VI" : 'F',
			};

			if (dict[str] !== undefined) {

				return dict[str];

			} else {

				return 'C';
			}
		}
	}

	aviation.string = {

		generateUUID : function () {

			//
			//	http://stackoverflow.com/questions/
			//	105034/create-guid-uuid-in-javascript
			//

		    var d = new Date().getTime();

		    if(window.performance && typeof window.performance.now === "function"){
		        d += performance.now(); 
		    }

		    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = (d + Math.random()*16)%16 | 0;
		        d = Math.floor(d/16);

		        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		    });

		    return uuid;
		},
		serializeObj : function (obj) {

			function serialize(obj, _tabs) {

				var tabs = _tabs+"\t",
					str = "";

				if (obj instanceof Array) {
					obj.forEach((function(i) {
						str+="\r\n"+tabs+serialize(i, tabs);
					}).bind(this));
				} else if (obj instanceof Object ){
					for (var k in obj) {
						str+= "\r\n"+ tabs + k
						str+= serialize(obj[k], tabs);
					}
				} else {
					str+= "\t"+obj;
				}

				return str;
			}

			var serialized = serialize(obj, "");

			return serialized;
		},
		serializeJSON : function (json, keys) {

			return json.reduce(function(a,b) {

				return a+(keys.map(function(key) {

					return '"'+b[key]+'"';

				}).join(',')+'\n');
			}, keys.join(',')+'\n');
		},
		parseJSON : function (fileStr) {

			try {

				return JSON.parse(fileStr);

			} catch (e) {

				return null;
			}
		},
		parseCSV : function (fileStr) {

			var parsed = fileStr.split('\n'),
				re = /[^\w\:\-]/gi,
				keys = parsed[0].split(',').map(function(str) {

				return str.replace(re, "");

			});

			return parsed.slice(1).map(function(csvArray) {

				var flight = {};

				csvArray.split(',').map(function(str) {

					return str.replace(re, "");

				}).forEach(function(value, idx) {
					if (!isNaN(Number(value))) {
						flight[keys[idx]] =  Number(value);
					} else if (value.match(':')){
						flight[keys[idx]] = timeToDecimalDay(value);
					} else {
						flight[keys[idx]] = value;
					}
				});

				return flight;
			});
		}
	}

	aviation.math = {

		round : function (num, mod) {

			return Math.round(num/mod)*mod;
		},
		floor : function (num, mod) {

			return Math.floor(num/mod)*mod;
		},
		remap : function (num, fIval, tIval, bounded=false) {

			if (fIval.getLength() === 0) {

				return fIval.min;

			} else {

				var ret = (((num - fIval.min) * tIval.getRange()) / fIval.getRange()) + tIval.min;
				
				if (bounded) {

					return ret > tIval.max ? 
						tIval.max : ret < tIval.min ? 
						tIval.min : ret;
				}
			}
		},
		getRandomBinaryWithProbablity : function (p) {

			return Math.random() >= 1-p ? 1 : 0;
		},
		getRandomArbitrary : function (range) {
			
			return Math.random() * (range[1] - range[0]) + range[0];
		},
		getRandomWeibull : function (scale=0.5, shape=3) {

			return scale * Math.pow(-Math.log(Math.random()),1/shape);
		}
	}

	aviation.array = {

		filterStrict : function (Arr, str) {

			var spl = str.split(/[^\w\.]/);

			return Arr.filter(function(obj) {

				return spl.every(function(s) {

					return JSON.stringify(obj).match(s);
				});
			});
		},
		filterLoose : function (Arr, str) {

			var spl = str.split(/[^\w\.]/);

			return Arr.filter(function(obj) {

				return spl.some(function(s) {

					return JSON.stringify(obj).match(s);
				});
			});
		},
		getBestMatch : function (Arr, str) {

			var spl = str.split(/[^\w\.]/);

			if (!Arr) return Arr;

			return Arr.sort(function(a,b) {

				var ac = 0, 
					bc = 0;

				spl.forEach(function(s) {
					if (JSON.stringify(a).match(s)) ac++;
					if (JSON.stringify(b).match(s)) bc++;
				})

				return bc-ac;

			})[0];
		},
		mode : function (Arr) {

			var max = Arr[0],
				hold = {};

			for (var i=0; i<Arr.length; i++) {
				if (hold[Arr[i]]) {
					hold[Arr[i]]++;
				} else {
					hold[Arr[i]] = 1;
				}
				if (hold[Arr[i]] > hold[max]) {
					max = Arr[i];
				}
			}

			return max;
		},
		mapElementsToObjByPercentile : function (Arr, clean) {

			var len = Arr.length,
				perc = {};

			for (var i=0; i<Arr.length; i++) {
				if (perc[Arr[i]]) {
					perc[Arr[i]]++;
				} else {
					perc[Arr[i]] = 1;
				}
			}
			for (var p in perc) {
				perc[p] = Math.round((perc[p]/len)*100);
				if (perc[p] === 0 && clean) delete perc[p];
			}

			return perc;
		},
		mapElementsToObjByKey : function (Arr, k) {

			var lib = {};

			Arr.forEach(function(p) {
				if (p[k] !== null && p[k] !== undefined) {
					if (p[k] in lib) {
						lib[p[k]].push(p);
					} else {
						lib[p[k]] = [p];
					}
				}
			})

			return lib
		},
		hasAllMatchingElementsByKeys : function (Arr, k, l) {

			Arr.forEach(function(p,i) {
				pArr.forEach(function(q,j) {
					if (i!==j) {
						if (p[k]!==q[k] || 
							p[l]!==q[l]) {

							return false;
						}
					}
				})
			})

			return true;
		}
	}

	aviation.class = aviation.class || {};

	aviation.class.Pax = function(flightClass, flight, timeSlice) {
		
		return new Pax(flightClass, flight, timeSlice);
	}
	function Pax(flightClass, flight, timeSlice) {

		this.flight = flight;
		this.flightClass = flightClass;
		this.timeSlice = timeSlice;
	}
	Pax.prototype = {

		get type () {

			return this.flightClass.type;
		},
		get data () {

			return this._data;
		},
		get profile () {

			return this._dist[this.flightClass._name];
		},
		get passengerTypeDistributionPercentages () {

			return this.flightClass._percs[this.flight.getDI()];
		},

		_dist : { 										

			//
			// 	! superceded
			//	Distributions for passengers from arrival to boarding for the Perth airport.
			//	Derived from Perth by Richard Spencer - assumptions.
			//

			'C': [		// Low Cost
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,1,2,2,3,4,5,6,7,8,9,10,10,9,7,3,3,2,2,2,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,3,4,3,2,1,1,1,1,6,45,26,2,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,40,40,2,0,0]
			],

			'_C': [		// Full Service - swap if needed
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,2,2,3,3,4,5,6,7,8,9,10,10,9,7,3,3,2,1,1,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,4,3,1,1,1,1,6,45,26,2,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,40,40,2,0,0]
			],

			'D': [		// Assuming same as Full Service C
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,2,2,3,3,4,5,6,7,8,9,10,10,9,7,3,3,2,1,1,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,4,3,1,1,1,1,6,45,26,2,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,40,40,2,0,0]
			],

			'E': [  	// Full service
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,2,3,4,5,6,6,7,7,8,9,10,9,7,5,3,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,3,3,3,4,4,4,35,25,8,2,1,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,20,25,30,15,2,0,0]
			],

			'_E': [ 	// Low Cost - swap if needed
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,2,3,4,5,6,6,7,7,8,9,10,9,7,5,3,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,3,3,3,4,4,4,35,25,8,2,1,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,25,25,25,15,2,0,0]
			],

			'F': [ 		// same as E
					[6,4,4,6,9,12,12,12,10,7,4,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,1,2,3,4,5,6,6,7,7,8,9,10,9,7,5,3,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,3,3,3,4,4,4,35,25,8,2,1,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,20,25,30,15,2,0,0]
			]
		},

		_data : {

			'globals' : {
				
				//
				//	global variables for Pax object
				//
			},

			'designGroupBoardingDistribution' : { 

				//
				//	Start and end times for boarding call
				//	Derived from Perth by Richard Spencer - assumptions.
				//	29 - 50% are at gate prior to boarding.
				//

				'C' : 					[25,	20,		10],
				'D' : 					[30,	25,		10],
				'E' : 					[40,	35,		10],
				'F' : 					[50,	45,		15],
			},

			'timing' : {  

				// 
				//	Global Simulation variables in minutes, Derived from the
				//	ARCP manual fon airport planning.
				//

				'arrival' : 			[],
				'checkIn' : 			[1.0, 	5.0],	
				'security' : 			[0.3, 	0.7], 	// verify this rate 140/hr ~ 0.43
				'concourse' : 			[],
				'gate': 				[],
				'boarding': 			[],
				'departure' : 			[]
			},

			'walkTimes' : {

				//
				//	Intervals for assumed walktimes from one point in the airport to another.
				// 	Not being used, and have not been validated or set to match the current scheme.
				//

				'security' : 			[2.0, 	5.0]
			}
		},

		getTimeActual : function (minutes) {

			//
			//	Returns the decimal day time for
			//	the current flight object associated with this pax object.
			//

			var departureTime = this.flight.getTime(),
				arrivalTime = aviation.time.minutesToDecimalDay(minutes);

			return  departureTime > arrivalTime ? 
				departureTime - arrivalTime :
				1 + departureTime - arrivalTime;

		},
		getFlowDistributionMatrix : function (m, passengerProfiles) {

			//
			//	Needs to be replaced with a fit function and statistical model that
			//	estimates the arrival probability distribution (Weibull/Poisson?)
			//
			//
			//	checkInCounters can be replaced with a function of capacity (ACRP)
			//
			var self = this;

			var passengerPercentagesTotal = self.passengerTypeDistributionPercentages,
				passengerSeats = self.flight.seats,
				checkInCounters = Math.ceil(passengerSeats / 100),
				passengers = [],
				matrix = aviation.class.Matrix3d(6, 1440 / self.timeSlice, self.timeSlice);		

			//
			//	Weibull shape parameters for gate and boarding probability
			//	distribution.
			//

			var gateTimingInfo = self.data.designGroupBoardingDistribution[self.flight.getCategory()];

			//
			//	Apply all data to passenger matrix
			//

			Object.keys(passengerPercentagesTotal).map(function(type) {

				var typePercentageTotal = Math.ceil((passengerPercentagesTotal[type].percentage / 100) * passengerSeats),
					passengerProfile = passengerProfiles.find(function(profile) {
								
								return profile._name === type;

							});

				Object.keys(passengerPercentagesTotal[type].dist).map(function(arrivalTime) {

					//
					//	Convert the passenger type distribution percentages from the flightProfile
					//	into a mapped number for this particular flight
					//

					var arrivalTimePercentageTotal = passengerPercentagesTotal[type].dist[arrivalTime];
						arrivalTimePercentageMapped = arrivalTimePercentageTotal / 100 * typePercentageTotal,
						arrivalTimeActual = self.getTimeActual(arrivalTime),
						arrivalTimeRounded = aviation.math.floor(
							aviation.time.decimalDayToMinutes(arrivalTimeActual), 
							self.timeSlice),
						departureTimeRounded = aviation.math.floor(
							aviation.time.decimalDayToMinutes(self.flight.getTime()),
							self.timeSlice);

					arrivalTimePercentageMapped = arrivalTimePercentageMapped > 0 && arrivalTimePercentageMapped < 1 ?
						aviation.math.getRandomBinaryWithProbablity(arrivalTimePercentageMapped) : 
						Math.round(arrivalTimePercentageMapped);

					for (var i=0; i<arrivalTimePercentageMapped; i++) {

						//
						//	Create passengers for each mapped flight percentage.
						// 	This is also assigning default arrival times and departure times to the 
						//	passenger matrix
						//

						var passenger = aviation.class.Passenger(self.flight, passengerProfile),
							checkInTime = passenger.attributes.isTransfer ?
								0 : !passenger.attributes.bags ?
								0 : aviation.math.getRandomArbitrary(self._data.timing.checkIn),
							securityTime = passenger.attributes.isTransfer ?
								0 : passenger.attributes.isPreCheck ?
								0 : aviation.math.getRandomArbitrary(self._data.timing.security);
						
						passenger.setAttribute('checkInTime', checkInTime);
						passenger.setAttribute('securityTime', securityTime);
						passenger.setAttribute('gateInfo', gateTimingInfo);
						passengers.push(passenger);

						//
						//	In order to handle transfer passengers - they are not included in the
						//	matrix simulation up until the concourse level. 
						//

						if (passenger.attributes.isTransfer) {
							passenger.setEvent('arrival',
								aviation.time.minutesToDecimalDay(self.timeSlice * arrivalTimeRounded));
							passenger.setEvent('security', 
								aviation.time.minutesToDecimalDay(self.timeSlice * arrivalTimeRounded));
							matrix.pushItem(passenger, 2, arrivalTimeRounded / self.timeSlice);
						} else {
							matrix.pushItem(passenger, 0, arrivalTimeRounded / self.timeSlice);
						}

						matrix.pushItem(passenger, -1, departureTimeRounded / self.timeSlice);
					}
				});
			});
			
			//
			//	Add all the passengers to this flight's passenger array
			//	for later usage. 
			//

			self.flight.setPassengers(passengers);

			//
			//	Sort passengers by their checkInTime - making sure that the tansfer and 
			//	bag-less passengers remain at the bottom prior to distribution.
			//

			matrix.sortRowCols(0, function(pa, pb){
			
				if (pa.attributes.checkInTime && !pb.attributes.checkInTime) {

					return 1;

				} else if (!pa.attributes.checkInTime && pb.attributes.checkInTime) {

					return -1;

				} else {

					return 0;
				}
			});

			//
			//	Assign passenger check in queuing times
			//	Uses the callback method to pop off the end of the list if the sum of all
			//	passenger times is over the given timeslot.
			//

			matrix.distributeRowByIndex(0, 1, false, function(passengerArray, matrix, c, r) {

				if (passengerArray.length !== 0) {

					var sub = aviation.class.Matrix3d(1, checkInCounters, matrix.m),
						count = 0,
						overflow = [];

					passengerArray.sort(function(pa,pb) {

						//
						//	This makes sure that all transfer and passengers with no
						//	bags are maintained at the front of the list when the new list is inserted
						//	in front. It also makes sure they stay in the correct sorted order.
						//

						if (pa.attributes.isNull && pb.attributes.isNull) {

							return 0;
						
						} else if (pa.attributes.isNull && !pb.attributes.isNull) {

							return -1;
						
						} else if (!pa.attributes.isNull && pb.attributes.isNull) {

							return 1;
						
						} else {

							if (pa.attributes.checkInTime && !pb.attributes.checkInTime) {

								return 1;

							} else if (!pa.attributes.checkInTime && pb.attributes.checkInTime) {

								return -1;

							} else {

								return 0;
							}
						}
					});

					for (var i = 0; i<passengerArray.length; i++) {
						sub.pushItem(passengerArray[i], 0, 0)
					}

					//
					//	Calculate  the index by packing passengers within the counters
					//

					sub.distributeRowByCallBack(0, 0, false, function(passengerArray, m, c, r) {

							var sum = passengerArray.reduce(function(val, passenger, i) {

								return val+passenger.attributes.checkInTime;

							}, 0);

							if (passengerArray.length > 1 && sum > matrix.m) {
								if (c === m.d[r].length - 1) {
									count ++ ;
								}

								return true;

							} else {
								if (sum > matrix.m) {
									
									var nullPassenger = aviation.class.Passenger.null(),
										deltaTime = sum - matrix.m;

									nullPassenger.setAttribute('checkInTime', deltaTime);
									nullPassenger.setAttribute('passengerID', aviation.string.generateUUID());
									overflow.push(nullPassenger);
								}
								
								return false;
							}

					})
					/*
					for (var i=0; i<overflow.length; i++) {
						console.log(overflow[i])
						matrix.spliceItem(overflow[i], 0, r, c+1);
					}
					*/
					return passengerArray.length - count;
				}
			});

			//
			//	! superceded
			//	Assign passenger walk to security times
			//	this is an optional row that distributes walk times from the check in counter to
			//	security. removed for now, as it invalidates the simulation with regards to
			//	industry standard. It might be worth implementing this with the design scheme.
			//
			/*
			matrix.copyRowApply(1, 2, true, function(passenger, matrix, count, index, column) {

				var walkTimeToSecurity = aviation.math.getRandomArbitrary(self.data.walkTimes.security),
					indexTimeSlot = self.timeSlice * (index / count),
					deltaTimeSlot = aviation.math.round(walkTimeToSecurity + indexTimeSlot, self.timeSlice),
					deltaTimeSlotMapped = deltaTimeSlot / self.timeSlice;

				return column + deltaTimeSlotMapped;
			});
			*/

			matrix.copyRowApply(1, 1, false, function(passenger, matrix, count, i, c) {

				var val = aviation.math.round(passenger.attributes.checkInTime, matrix.m ) / matrix.m;

				if (!passenger.attributes.isNull) return c + val;
			});

			return m.merge(matrix);
		}
	}
	
	aviation.class.Matrix3d = function(numRow, numCol, mod) {
		
		return new Matrix3d(numRow, numCol, mod);
	}
	function Matrix3d (numRow, numCol, mod) {

		this.d = [];
		this.m = mod;
		this.r = numRow;
		this.c = numCol;
		this._rs = [];

		for (var r=0; r<numRow; r++) {
			var row = [];
			for (var c=0; c<numCol; c++) {
				var col = [];
				row.push(col);
			}
			this.d.push(row);
			this._rs.push([]);
		}
	};
	Matrix3d.prototype = {

		forEachItem : function (cb) {

			for (var r=0; r<this.d.length; r++) {
				for (var c=0; c<this.c; c++) {
					for (var i=0, len = this.d[r][c].length; i<len; i++) {
						cb(this.d[r][c][i], len, i, c, r);
					}
				}
			}
		},
		setItem : function (item, r, c, i) {

			this.d[r][c][i] = item;
		},
		getItem : function (r, c, i) {

			return this.d[r][c][i] || null;
		},
		pushItem : function (item, r, c) {

			if ( r === -1 || undefined ) r = this.d.length-1;
			if ( c === -1 || undefined ) c = this.d[r].length-1;
			this.d[r][c].push(item);
		},
		spliceItem : function (item, index, r, c) {

			if ( this.d[r] === undefined) return null;
			if ( this.d[r][c] === undefined) return null;
			this.d[r][c].splice(index, 0, item);

		},
		unShiftItem : function (item, r, c) {

			if ( r === -1 || undefined ) r = this.d.length-1;
			if ( c === -1 || undefined ) c = this.d[r].length-1;
			this.d[r][c].unshift(item);
		},
		getCol : function (r, c) {

			return this.d[r][c] || null;
		},
		getRow : function (r) {

			if (r === -1) r = this.d.length-1;

			return this.d[r] || null;
		},
		getRowItemCount : function(r) {

			return this.d[r].reduce(function(a,b) {

				return a + b.length;
			},0);
		},
		getRowBlank : function () {

			var row = [];

			for (var c=0; c<this.c; c++) {
				row.push([]);				
			}

			return row;
		},
		setRow : function (row, r) {

			this.d[r] = row;

		},
		copyRow : function (f, t, insert) {

			if (insert === true) {
				this.insertRow(t, this.d[f]);
			} else {
				this.d[t] = this.d[f].slice();
			}
		},
		shiftRow : function (r, shift) {

			if (shift > 0) {
				for (var i=0; i<shift; i++) {
					this.d[r].push(this.d[r].shift());
					this._rs[r].push(-shift);
				}
			} else if (shift < 0) {
				for (var i=0; i<-shift; i++) {
					this.d[r].unshift(this.d[r].pop())
					this._rs[r].push(-shift);
				}
			}
		},
		sortRow : function (r, cb) {

			this.d[r].sort(cb);
		},
		sortRowCols : function (r, cb) {

			for (var c=0; c<this.d[r].length; c++) {
				this.sortRowCol(r, c, cb);
			}
		},
		sortRowCol : function (r, c, cb) {

			this.d[r][c].sort(cb);
		},
		copyRowApply : function (f, t, insert, cb) {

			var row = this.getRowBlank();

			for (var c=0; c<this.d[f].length; c++) {
				for (var i=0; i<this.d[f][c].length; i++) {

					var item = this.d[f][c][i],
						count = this.d[f][c].length,
						index = cb(item, this, count, i, c, f);

					if (index !== undefined) {

						var col = index < this.c ? 
							row[index] : 
							row[index-this.c];
						
						col.push(item);
					}					
				}
			}
			if (insert) {
				this.insertRow(t, row);
			} else {
				this.d[t] = row;
			}

		},
		insertRowBlank : function (t) {
			
			this.insertRow(t, this.getRowBlank());
		},
		insertRow : function (t, row) {

			this.d.splice(t, 0, row.slice());
			this._rs.push([]);
			this.r++;
		},
		distributeRowByCount : function (f, t, count) {

			var count = count || Infinity;

			if (f !== t) this.concatRows(f,t);

			for (var c=0; c<this.c; c++) {
				if (this.d[t][c].length > count) {

					var len = this.d[t][c].length,
						delta = len - count;

					if(this.d[t][c+1] !== undefined) {
						this.d[t][c+1] = this.d[t][c]
							.slice(len-delta, len)
							.concat(nxt);
					} else {
						this.d[t][c+1-this.c] = this.d[t][c]
							.slice(len-delta, len)
							.concat(nxt);
					}
					this.d[t][c] = this.d[t][c]
						.slice(0,len-delta);
				}
			}
		},
		distributeRowByIndex : function(f, t, insert, cb) {

			if (f !== t) this.concatRows(f,t);

			for (var c=0; c<this.c; c++) { 

				var index = cb(this.d[t][c], this, c, t);

				if (index >= this.d[t][c].length ||
					index === undefined || index === null ) {

					continue;

				} else if (index < 0 && -index>this.d[t][c].length) {

					continue;

				} else if (index < 0 && -index<this.d[t][c].length) {
					index = this.d[t][c].length-index;
				}
				if(this.d[t][c+1] !== undefined) {
					this.d[t][c+1] = this.d[t][c]
						.slice(index-1)
						.concat(this.d[t][c+1]);
				} else {
					this.d[t][c+1-this.c] = this.d[t][c]
						.slice(index-1)
						.concat(this.d[t][c+1-this.c]);
				}
				this.d[t][c] = this.d[t][c]
					.slice(0,index-1);
			}
		},
		distributeRowByCounter : function (f, t, insert, cb) {

			if (f !== t) this.concatRows(f,t);

			for (var c=0; c<this.c; c++) {

				var total = 0;

				for (var i=0; i<this.d[t][c].length; i++) {
					total += cb(this.d[t][c][i], this, i, c, t, true);
				}
				
				if (total > this.m) {

					var count = 0,
						index = 0;

					for (var i=0; i<this.d[t][c].length; i++) {		
						count += cb(this.d[t][c][i], this, index, c, t, false);
						index ++ ;
						if (count >= this.m) break;
						
					}
					if(this.d[t][c+1] !== undefined) {
						this.d[t][c+1] = this.d[t][c]
							.slice(index-1)
							.concat(this.d[t][c+1]);
					} else {
						this.d[t][c+1-this.c] = this.d[t][c]
							.slice(index-1)
							.concat(this.d[t][c+1-this.c]);
					}
					this.d[t][c] = this.d[t][c]
						.slice(0,index-1);
				}
			}
		},
		distributeRowByCallBack : function (f, t, insert, cb) {
			
			if (f !== t) this.concatRows(f,t);

			for (var c=0; c<this.c; c++) {

				var add = [];

				while(cb(this.d[t][c], this, c, t)) {
					add.push(this.d[t][c].pop());
				}
				if(this.d[t][c+1] !== undefined) {
					this.d[t][c+1] = add.concat(this.d[t][c+1]);
				} else {
					this.d[t][c+1-this.c] = 
						add.concat(this.d[t][c+1-this.c]);
				}
			}
		},
		restore : function () {

			for (var r=0; r<this.r; r++) {
				this.shiftRow(r, this._rs.reduce(function(a,b) {

				 return a+b;

				}));
			}
		},
		concatRows : function (f, t, isMerge) {

			for (var c=0; c<this.c; c++) {

				var fcol = this.d[f][c],
					tcol = this.d[t][c],
					delta = isMerge ? 
						fcol.length : 
						fcol.length - tcol.length;

				for (var i=fcol.length-delta; i<fcol.length; i++) {
					tcol.push(fcol[i]);
				}
			}
		},
		mergeRows : function (f, t) {

			if (typeof f === 'number') {
				this.concatRows(f, t, true);
			} else {
				for (var c=0; c < this.c; c++) {
					for (var i=0; i<f[c].length; i++) {
						this.d[t][c].push(f[c][i]);
					}
				}
			}
		},
		merge : function (other) {

			this.m = this.m ? this.m : other.m ? other.m : this.m;
			this.r = this.r ? this.r : other.r ? other.r : this.r;
			this.c = this.c ? this.c : other.c ? other.c : this.c;
			this.rs = [];

			var m1, m2;

			if (this.d.length) {
				m1 = this;
				m2 = other;
			} else if (other.d.length) {
				m1 = other;
				m2 = this;
			} else {
				console.warn('empty merge');
			}

			for (var r=0; r<m2.d.length; r++) {
				for (var c=0; c<m2.d[r].length; c++) {
					for (var i=0; i<m2.d[r][c].length; i++) {
						m1.d[r][c].push(m2.d[r][c][i]);
					}
				}
			}

			return m1;
		}
	}

	aviation.class.Flight = function (flightObj, destination, airline, aircraft, loadFactor) {
		
		return new Flight(flightObj, destination, airline, aircraft, loadFactor);
	}
	function Flight (flightObj, destination, airline, aircraft, loadFactor) {

		this.flight = flightObj;
		this.destination = destination;
		this.airline = airline;
		this.aircraft = aircraft;
		this.loadFactor = loadFactor;
		this.id = aviation.string.generateUUID();
		this.gate = null;
		this.ival = null;
		this.seats = this.flight.seats !== undefined ?
			this.flight.seats*this.loadFactor :
			this.aircraft.seats !== null ?
			this.aircraft.seats*this.loadFactor :
			0;
		this.seats = Math.round(this.seats);
		this.passengers = [];

		if (this.seats === 0) console.warn('seats not available: ', this);
		if (this.aircraft.RFLW == null || this.aircraft.ARC == null){
			console.error('category not assigned: ', 
				this.aircraft);
		};
	};	
	Flight.prototype = {
		
		getTime : function () {

			return this.flight.time;
		},
		getDI : function () {
			
			return this.flight.di;
		},
		setTurnaroundTime : function (turnaroundTimes) {
			
			var tt = 0;
			var t1 = this.aircraft.IATA;
			var t2 = this.airline.IATA;

			if (this.flight.tt !== 0) {
				tt = this.flight.tt;
			} else {
				if (t1 in turnaroundTimes) {
					if (t2 in turnaroundTimes[t1]) {

						var length = turnaroundTimes[t1][t2].length;
						var sum = turnaroundTimes[t1][t2].reduce(function(a,b) {

							return a+b;
						})

						tt = sum/length;
					} else {

						var length = 0;
						var sum = Object.keys(turnaroundTimes[t1]).map((function(a){

							return turnaroundTimes[t1][a];

						}).bind(this)).reduce(function(a,b) {

							return a.concat(b);

						},[]).reduce(function(a,b) {
							length++;

							return a+b;
						});

						tt = sum/length;
					}
				} else {
					console.error('tt not assigned: ', 
						this, 
						this.getFlightName(), 
						aviation.time.decimalDayToTime(this.getTime()));
				}
			}
			tt = tt === 0 || tt === Infinity ? 0.125 : tt;

			this.ival = aviation.class.Interval(this.getTime()-tt, this.getTime())
		},
		getDesignGroup : function () {

			return aviation.time.romanToNumber(this.aircraft.ARC.split('-')[1]);
		},
		getCategory : function () {

			//
			//	Used to return this.aircraft.RFLW
			//
			
			return aviation.time.romanToLetter(this.aircraft.ARC.split('-')[1]);
		},
		setGate : function (gate) {

			this.gate = gate;
		},
		getGate : function () {

			return this.gate;
		},
		findGate : function (gates, cluster) {

			if (this.ival.getLength() === 0) {
				this.setGate('*');
				console.error('invalid ival: ', 
					this, 
					this.getFlightName(), 
					aviation.time.decimalDayToTime(this.getTime()));

				return;
			}

			if (cluster === true) {
				
				var hasCarrier = [],
					notHasCarrier = [],
					drift = [];
					sorted = [];

				for (var i=0; i<gates.length; i++) {
					if (gates[i].hasCarrier(this.airline)) {
						hasCarrier.push(gates[i]);
					} else {
						notHasCarrier.push(gates[i]);
					}
				}
				for (var i=0; i<notHasCarrier.length; i++) {

					var min = Infinity;

					if (hasCarrier.length !== 0) {
						for (var j=0; j<hasCarrier.length; j++) {

							var dist = Math.abs(hasCarrier[j].num - notHasCarrier[i].num);

							if (dist < min) min = dist;
						}
						for (var k=0; k<drift.length; k++) {
							if (min < drift[k]) {

								break;
							}
						}
					} else {
						for (var j=0; j<notHasCarrier.length; j++) {

							var dist = Math.abs(notHasCarrier[j].num - notHasCarrier[i].num),
								count = notHasCarrier[i].getFlights().length;

							if (count && dist < min) min = dist;
						}
						for (var k=0; k<drift.length; k++) {
							if (min > drift[k]) {

								break;
							}
						}					
					}
					sorted.splice(k,0, notHasCarrier[i]);
					drift.splice(k,0, min);
				}
				hasCarrier.sort(function(ga,gb) {

					var numFlightsGateA = ga.getFlightsByCarrier(this.airline).length,
						numFlightsGateB = gb.getFlightsByCarrier(this.airline).length;

					return numFlightsGateB - numFlightsGateA;
				})

				gates = hasCarrier.concat(sorted);
			}

			for (var i=0; i<gates.length; i++) {

				var gate = gates[i];

				if (gate.fit(this, (function(data, flight) {
					if (data.response) {
						this.setGate(data.gate);
						gate.setFlight(this, data.gate);

						return true;

					} else {

						return false;
					}
				}).bind(this))) {
					
					return;
				}
			}
			console.error('gate not assigned: ', 
				this, 
				this.getFlightName(), 
				aviation.time.decimalDayToTime(this.getTime()));
		},
		getFlightName : function () {

			return '%airline% to %municipality%, %plane%'
				.replace('%municipality%', this.destination.municipality)
				.replace('%airline%', this.airline.name)
				.replace('%plane%', this.aircraft.manufacturer+' '+this.aircraft.name);
		},
		setPassengers : function (passengers) {

			this.passengers = passengers;
		},
		getPassengers : function () {

			return this.passengers;
		}
	};

	aviation.class.Gate = function (gateObj) {
			
		return new Gate(gateObj);
	}
	function Gate (gateObj) {

		this.name = gateObj[0];
		this.isMARS = gateObj[1];
		this.seats = gateObj[2];
		this.padding = [
			-aviation.time.timeToDecimalDay('00:15:00'),
			aviation.time.timeToDecimalDay('00:15:00')
			];
		this.sf = {};
		this.group = {
			mars : null,
			default : null,
		};
		this.flights =  this.isMARS ?
			gateObj[7].reduce(function(obj, sub) {

				obj[sub] = [];

				return obj;

			},{}) : {
				[this.name+'a'] : [],
				[this.name+'b'] : []
			};
		this.setArea('waiting', gateObj[3]);
		this.setArea('boarding', gateObj[4]);
		this.setDesignGroup(gateObj[5]);
		if (gateObj[6] !== null) {
			this.setDesignGroup(gateObj[6], true);
		};
		this.carriers = new Set();
	};
	Gate.prototype = {

		get num () {

			var n = parseInt(this.name.split('').reduce(function(numStr, str) {

				if (isNaN(parseInt(str))) return numStr;
				
				return numStr+str;

			}, ''));

			return isNaN(n) ? 0 : n;
		},
		setArea : function (key, val) {

			this.sf[key] = val;
		},
		getArea : function (key){

			if (key === undefined ) {

				return Object.keys(this.sf).map((function(a) {

					return this.sf[a];

				}).bind(this)).reduce(function(a,b) {

					return a + b;

				})

			} else if (Object.keys(this.sf).includes(key)) {

				return this.sf[key];

			} else {

				return 0;
			};
		},
		setSeats : function(val) {
			
			this.seats = val;
		},

		getSeats : function (val) {

			return this.seats;
		},
		setDesignGroup : function (group, mars) {

			if (mars && this.isMARS) {
				this.group.mars = group;
			} else {
				this.group.default = group;
			}
		},
		getDesignGroup : function (mars) {

			if (mars && this.isMARS) {

				return this.group.mars;
				
			} else {

				return this.group.default;
			}
		},
		matchDesignGroup : function (flight, mars) {

			return this.getDesignGroup(mars) >= flight.getDesignGroup();
		},
		setFlight : function (flight, sub) {

			if (sub && sub !== this.name  && this.isMARS) { // blehhhh
				this.flights[sub].push(flight);
			} else {
				for (var key in this.flights) {
					this.flights[key].push(flight);
				}
			}
			this.carriers.add(flight.airline);
		},
		getFlights : function (sub) {

			if (sub && this.isMARS) {

				return this.flights[sub];

			} else {

				var uniq= [];
				
				Object.keys(this.flights).map((function(key) {

					return this.flights[key]

				}).bind(this)).reduce(function(a, b) {

					return a.concat(b);

				}, []).forEach(function(flight) {
					if (!uniq.includes(flight)) {
						uniq.push(flight);
					}
				});

				return uniq;
			}
		},
		getFlightsByCarrier : function (carrier) {

			return this.getFlights().filter(function(flight) {

				return flight.airline === carrier;
			});
		},
		fit : function (flight, cb) {

			var data = {
				response : null,
				gate : null
			}

			if (this.matchDesignGroup(flight)) {
				if (this.isMARS && this.matchDesignGroup(flight, this.isMARS)) {
					for (var sub in this.flights) {
						if (this.tap(flight, this.getFlights(sub))) {
							data.response = true;
							data.gate = sub;

							break;
						}
					}
				} else {
					if (this.tap(flight, this.getFlights())) {
						data.response = true;
						data.gate = this.name;
					}
				}
			}

			return cb(data, flight);
		},
		tap : function (flight, fArr) {

			return !fArr.some((function(f) {

				return f.ival.padded(this.padding[0], this.padding[1])
					.intersects(flight.ival.padded(this.padding[0], this.padding[1]));

			}).bind(this));
		},
		hasCarrier : function (airline) {

			return this.carriers.has(airline);

		},
	};

	aviation.class.Passenger = function(flight, passengerProfile) {
		
		return new Passenger(flight, passengerProfile);
	}
	function Passenger (flight, passengerProfile) {

		this.flight = flight;
		this.profile = passengerProfile;

		this._attributes = {

			'gender' : ['M', 'F'][Math.round(Math.random())],

			'bags' : [false,true][aviation.math.getRandomBinaryWithProbablity(this.profile._data.bags / 100)],

			'isPreCheck' : [false,true][aviation.math.getRandomBinaryWithProbablity(0.2)], //verify

			'isTransfer' : this.profile._name.match(/transfer/) ? true : false,

			'isBusiness' : [false,true][aviation.math.getRandomBinaryWithProbablity(0.1)], // verify

			'isGateHog' : [false,true][aviation.math.getRandomBinaryWithProbablity(0.17)], // verify

			'passengerID' : aviation.string.generateUUID(),

			'passengerType' : this.profile._name,

			'flightID' : this.flight.id,

			'flightName' : this.flight.getFlightName()
		};
		this._events = [
			{
				name : 'arrival',
				value : null
			},
			{
				name : 'security',
				value : null
			},
			{
				name : 'concourse',
				value : null
			},
			{
				name : 'gate',
				value : null
			},
			{
				name : 'boarding',
				value : null
			},
			{
				name : 'departure',
				value : null
			}
		];
	};
	Passenger.prototype = {

		get attributes () {

			return this._attributes;
		},
		setAttribute : function (name, value) {

			this._attributes[name] = value;
		},
		get events () {

			return this._events;
		},
		getEvent : function (name) {

			return this.events.find(function(event) {

				return event.name === name;
			});
		},
		setEvent : function (name, value) {

			this.getEvent(name).value = value;

		},
		get delta () {

			return {

				'arrival' : aviation.time.decimalDayDelta(this.getEvent('arrival').value, this.getEvent('departure').value),

				'checkIn': aviation.time.decimalDayDelta(this.getEvent('arrival').value, this.getEvent('security').value),

				'security': aviation.time.decimalDayDelta(this.getEvent('security').value, this.getEvent('concourse').value),

			};
		},
		getTotalTimeInAirport : function () {

			return aviation.class.Interval(this.getEvent('arrival').value, 
				this.getEvent('departure').value);
		},
		getActivityAtTime : function (dday) {

			for (var i=0, events=this.events; i<events.length; i++) {
				if (events[i].value < dday && events[i+1].value > dday){

					return events[i].name;
				}
			}
		}
	};
	aviation.class.Passenger.null = function() {

		return Object.create(Passenger.prototype, { _attributes : { value : { 'isNull' : true } } });

	};

	aviation.class.Interval = function(start, end) {
		
		return new Interval(start, end);
	}
	function Interval (start, end) {
		
		this.start = start;
		this.end = end;
	};
	Interval.prototype = {

		get min () {
			return this.start < this.end ? this.start : this.end;
		},
		get max () {
			return this.start > this.end ? this.start : this.end;
		},
		intersects : function (other) {

			return this.includes(other.start) ||
				this.includes(other.end) ||
				other.includes(this.start) ||
				other.includes(this.end);
		},
		getLength : function () {

			return this.end-this.start;
		},
		contains : function (other) {

			return this.includes(other.start) && this.includes(other.end);
		},
		includes : function (num) {

			return num >= this.start && num <= this.end;
		},
		padded : function (val1, val2) {

			if(val1 && val2) {

				return new Interval(this.start-val1, this.end+val2);

			} else if(val1) {
				
				return new Interval(this.start-val1, this.end+val1);
			}
		}
	};
	Interval.interpolateRandom = function (start, end) {

		return Math.floor(Math.random() * (end - start + 1)) + start;
	};


	aviation.get = {

		//
		//	Database methods - eventually needs to be replaced with a server sice component,
		//	along with the profileBuilder
		//

		passengers : function (filter) {

			var passengers = [];

			aviation._flights.forEach(function(flight) {
				flight.getPassengers().forEach(function(passenger) {
					if ( filter === undefined || JSON.stringify(passenger.attributes).match(filter)) {
						passengers.push(passenger);
					}
				});
			});

			return passengers;
		},
		flights : function () {

			return aviation._flights;
		},
		gates : function () {

			return aviation._gates;

		},
		turnaroundTimes : function () {

			return aviation._tt;

		},
		passengerProfiles : function () {

			return aviation._passengerProfiles;

		},
		airportByCode : function (code) {

			return aviation._airports.find(function(obj) {

				return obj.IATA == code;				
			});
		},
		airlineByCode : function (code) {

			return aviation._airlines.find(function(obj) {

				return obj.IATA == code;
			});
		},
		aircraftByCode : function (code) {

			return aviation._aircraft.find(function(obj) {

				return obj.IATA == code;
			});
		},
		airportByString : function (str) {

			var airports = aviation.array.filterStrict(aviation._airports, str);

			if (airports == undefined || airports.length === 0) {
				airports = aviation.array.filterLoose(aviation._airports, str);
			}

			return aviation.array.getBestMatch(airports, str);
		},
		profileByAircraftType : function (type) {

			return aviation._flightProfiles.find(function(p) {

				return p._name === type;

			});
		}
	};
	aviation.clear = function () {

		aviation._gates = [];
		aviation._flights = [];	
	};
	aviation.set = function(gateSchemeObjArr,
					designDayFlightObjArr, 
					flightProfiles, 
					passengerProfiles,
					loadFactor, 
					filter, 
					timeFrame,
					timeSlice) {

		function setGates (gateSchemeObjArr) {

			var gates = [];

			gateSchemeObjArr.forEach(function(gateObj) {

				var gate = aviation.class.Gate(gateObj);

				gates.push(gate);
			});

			return gates;
		};

		function setFlights (designDayFlightObjArr, loadFactor, filter, timeFrame) {

			var flights = [],
				sorted = [],
				filtered = [],
				securityCounters = [10, 12], 
				matrix = aviation.class.Matrix3d(undefined,undefined,timeSlice);

			designDayFlightObjArr.forEach(function(flightObj, index) {

				var flight = aviation.class.Flight(flightObj,
						aviation.get.airportByCode(flightObj.destination),
						aviation.get.airlineByCode(flightObj.airline),
						aviation.get.aircraftByCode(flightObj.aircraft),
						loadFactor);

				flight.setTurnaroundTime(aviation.get.turnaroundTimes());

				//
				//	Filter flights
				//

				if (aviation.time.decimalDayToTime(flightObj.time).split(':')[0] > timeFrame[0] &&
					aviation.time.decimalDayToTime(flightObj.time).split(':')[0] < timeFrame[1]) {
					if (JSON.stringify(flight).match(filter)){
						filtered.push(flight);
					}
				}

				//
				//	Sort ALL flights
				//

				if (sorted.length === 0) {
					sorted.push(flight);
				} else {

					var a = flight.ival.getLength(),
						a_bis = flight.getDesignGroup();

					for (var i=0, len=sorted.length; i<len; i++) {

						var b = sorted[i].ival.getLength(),
							b_bis = sorted[i].getDesignGroup();

						if ( a+a_bis >= b+b_bis ) {

							break;
						}
					}
					sorted.splice(i,0,flight);
				}
				flights.push(flight);
				
			});

			//
			//	Creates the Pax Objects for passenger arrival simulation,
			//	and assigns each flight to a gate using the gate packing algorithm
			//	(bin packing). Now also accounts for airline clustering, but not for initial preference.
			//

			sorted.forEach(function(flight) {

				var pax = aviation.class.Pax(aviation.get.profileByAircraftType(flight.getCategory()), flight, timeSlice);

				flight.findGate(aviation.get.gates(), true);
				matrix = pax.getFlowDistributionMatrix(matrix, aviation.get.passengerProfiles());
			});

			//
			//	Gate clustering verification
			//
			/*
			aviation.get.gates().sort(function(ga, gb) {
				
				return ga.num - gb.num;
			})
			aviation.get.gates().forEach(function(gate) {
				console.log(gate.name, gate.getFlights().map(function(flight) {
					
					return flight.airline.name;
				}))
			})
			*/

			//
			//	Sorts all the passengers in the security arrival timeSlots.
			//	All passengers that are isTransfer and isPreCheck are moved to the front of the queue
			//	and ignored during the queuing process for security
			//

			matrix.sortRowCols(1, function(pa, pb){
				
				if (pa.attributes.securityTime && !pb.attributes.securityTime) {

					return 1;

				} else if (!pa.attributes.securityTime && pb.attributes.securityTime) {

					return -1;

				} else {

					return 0;
				}
			});

			//
			//	 Splice all the transfer passengers for later
			//

			var transferPassengers = matrix.getRow(2).slice();
			matrix.setRow(matrix.getRowBlank(), 2);

			//
			//	Calculate the distributed timings for passengers in the security queue, by 
			//	returning their time spent in the queue as a function of how long they take and 
			//	how many lines are available to them. Ignored passengers are spliced back into the 
			//	front of the queue
			//

			matrix.distributeRowByCounter(1, 2, false, function(passenger, matrix, i, c, r, sort) {

				var securityTime = passenger.attributes.securityTime,
					securityLines = passenger.attributes.bags ?
						securityCounters[0] : securityCounters[1];

				if (sort && securityTime === 0) {
					matrix.d[r][c].splice(0,0,matrix.d[r][c].splice(i,1)[0])
				}
				
				return securityTime / securityLines;
			});

			//
			//	Apply passenger timing to the security times
			//

			matrix.copyRowApply(2, 2, false, function(passenger, matrix, count, i, c) {

				var val = aviation.math.round(passenger.attributes.securityTime, matrix.m ) / matrix.m;

				if (!passenger.attributes.isNull) return c + val;
			});

			//
			//	Merge Transfer passengers back into the main passenger array
			//

			matrix.mergeRows(transferPassengers, 2);

			//
			//	Calculate the passenger timing for arrival at the gate, as a function of the 
			//	weibull distribution and the gate info derived from the flight Pax object
			//

			matrix.copyRowApply(2, 3, false, function(passenger, matrix, count, i, c, r) {

				var gateInfo = passenger.attributes.gateInfo,
					flightTime = aviation.time.decimalDayToMinutes(passenger.flight.getTime());

				//
				//	These are the gate parameters - 
				//	scaleParam : the time in minutes from the 5 minutes to boading call,
				//		set so that the median passenger show up is more or less 50 %
				//		around that time, with a skew to later
				// 	shapeParam : skew the function towards 0
				//	Is is represented as a function of the middle of the boarding timeline,
				//	so that there is some overlap between arrival and boarding.
				//

				var scaleParam = (gateInfo[0] - gateInfo[2]) - ((gateInfo[1] - gateInfo[2]) / 2),
					shapeParam = 1.5,
					weibull = aviation.math.getRandomWeibull(scaleParam, shapeParam);
					delta = (weibull + ((gateInfo[1] - gateInfo[2]) / 2) + gateInfo[2]);

				var	gateTime = aviation.math.round(flightTime - delta, matrix.m) / matrix.m;

				if (passenger.attributes.isGateHog) {

					return c;

				} else {

					return c < gateTime ? gateTime : c;
				}
			});

			//
			//	Passenger timing for boarding distribution.
			//

			matrix.copyRowApply(3, 4, false, function(passenger, matrix, count, i, c, r) {

				var gateInfo = passenger.attributes.gateInfo, 
					gateTime = matrix.m * c,
					flightTime = aviation.time.decimalDayToMinutes(passenger.flight.getTime()),
					deltaFlightTime = flightTime - gateTime;

				var boardingStart = gateInfo[1] < deltaFlightTime ? gateInfo[1] : deltaFlightTime,
					boardingEnd = gateInfo[2],
					boardingTime = boardingStart - boardingEnd;

				var scaleParam = boardingTime / 2,
					shapeParam = 2,
					weibull = aviation.math.getRandomWeibull(scaleParam, shapeParam),
					deltaBoarding = weibull + boardingEnd;

				var boardingMapped = aviation.math.round(flightTime - deltaBoarding, matrix.m) / matrix.m,
					boardingStartMapped = aviation.math.round(flightTime - boardingStart, matrix.m) / matrix.m;

				return passenger.attributes.isBusiness ? boardingStartMapped : boardingMapped ;
			})

			//
			//	Final Passenger timing assignment from location within the combination matrix.
			//

			matrix.forEachItem(function(passenger, count, i, c, r) {

				var rounded = aviation.time.minutesToDecimalDay(matrix.m * c);
				
				switch (r) {

					case 0 :

						passenger.setEvent('arrival', rounded);

						break;

					case 1 :

						passenger.setEvent('security', rounded);

						break;

					case 2 :

						passenger.setEvent('concourse', rounded);

						break;

					case 3 :

						passenger.setEvent('gate', rounded);

						break;

					case 4 :

						passenger.setEvent('boarding', rounded);

						break;

					case 5 : 

						passenger.setEvent('departure', rounded);

						break;

					default:

						break;
				};
			})

			return filtered;
		};

		aviation._flightProfiles = flightProfiles;
		aviation._passengerProfiles = passengerProfiles;
		aviation._gates = setGates(gateSchemeObjArr);
		aviation._flights = setFlights(designDayFlightObjArr, loadFactor, filter, timeFrame);
	};

	return aviation;

})(AVIATION || {});
