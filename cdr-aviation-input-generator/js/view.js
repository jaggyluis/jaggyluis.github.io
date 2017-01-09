var app = app || {};

(function() {

	app.View = function() {

			this.hexColors = {

				'domestic.business.departing' 		: '#211463',
				'domestic.business.transfer' 		: '#35277D',
				'international.business.departing' 	: '#685BA9',
				'international.business.transfer' 	: '#4B3D92',
				'domestic.leisure.departing' 		: '#8F600D',
				'domestic.leisure.transfer' 		: '#B58126',
				'international.leisure.departing' 	: '#F5C673',
				'international.leisure.transfer' 	: '#D3A047',
				'domestic.other.departing' 			: '#2D8677',
				'domestic.other.transfer' 			: '#085B4D',
				'international.other.departing' 	: '#187263',
				'international.other.transfer' 		: '#499B8D',
			};

			var self = this;
			
			this.passengerProfileData,
			this.passengerTimingData,

			this.runButtons = Array.prototype.slice.call(document.getElementsByClassName('run-btn'));
			this.runButtons.forEach(function(btn) {
				btn.addEventListener('click', function() {

					btn.disabled = true;
					btn.parentNode.children[1].classList.toggle('hidden');

					if (btn.id == 'profile-btn') {
						app.runPassengerProfileSimulation(function(data) {
				
							self.clearPassengerProfilesTable();
							self.clearFlightProfilesTable();

							var bt1 = document.getElementById('show-passenger-profiles-btn'),
								bt2 = document.getElementById('show-flight-profiles-btn');

							if (bt1.innerText == 'Hide Results') {
								bt1.click();
							}
							if (bt2.innerText == 'Hide Results') {
								bt2.click();
							}

							btn.parentNode.children[1].classList.toggle('hidden');
							btn.disabled = false;

							self.passengerProfileData = data;			
							self.enableDownloads('#profile-box');
							self.enableProfileRunButton();
						});
					} else if (btn.id == 'timing-btn') {
						app.runPassengerTimingSimulation(function(data) {

							self.clearFlightsTable();
							self.clearPassengersTable();

							var bt1 = document.getElementById('show-flights-btn'),
								bt2 = document.getElementById('show-passengers-btn');

							if (bt1.innerText == 'Hide Results') {
								bt1.click();
							}
							if (bt2.innerText == 'Hide Results') {
								bt2.click();
							}
							

							btn.parentNode.children[1].classList.toggle('hidden');
							btn.disabled = false;

							var filter = new RegExp(self.getPassengerFilter());

							data.passengers = data.passengers.filter(function(passenger) {
								
								return JSON.stringify(passenger.wrangle()).match(filter);
							});

							self.passengerTimingData = data;
							self.enableDownloads('#timing-box');
						});

					}
				});
			});

			this.checkButtons = Array.prototype.slice.call(document.getElementsByClassName('chk-btn'));
			this.checkButtons.forEach(function(btn) {
				btn.addEventListener('click', function() {
					var cls ='#'+btn.parentNode.parentNode.parentNode.parentNode
						.id+' .chk-btn';
					Array.prototype.slice.call(document.querySelectorAll(cls)).forEach(function(b){
						b.checked = false;
					});
					btn.checked = true;
				});
			});

			this.saveButtons = Array.prototype.slice.call(document.getElementsByClassName('save-btn'));
			this.saveButtons.forEach(function(btn) {
				btn.addEventListener('click', function() {
					var checked = Array.prototype.slice.call(this.parentNode.children)
						.filter(function(elem) {

							return elem.children.length !== 0 &&
								elem.children[0].checked === true;
						})[0].children[0];

					self.save(btn.id, checked.classList[1]);
				});
			});

			this.showButtons = Array.prototype.slice.call(document.getElementsByClassName('show-btn'));
			this.showButtons.forEach(function(btn) {
				btn.addEventListener('click', function() {
					btn.innerText = btn.innerText === 'Hide Results' ? 
						'Show Results' : 'Hide Results';
					btn.parentNode.parentNode.parentNode
						.children[1].classList.toggle('collapsed');

					if (btn.id == 'show-passenger-profiles-btn') {
						if (btn.innerText == 'Show Results') {
							self.clearPassengerProfilesTable();
						} else {
							self.buildPassengerProfilesTable(self.passengerProfileData.passengerProfiles);
						}
						
					} else if (btn.id == 'show-flight-profiles-btn') {
						if (btn.innerText == 'Show Results') {
							self.clearFlightProfilesTable();
						} else {
							self.buildFlightProfilesTable(self.passengerProfileData.flightProfiles);
						}
					} else if (btn.id == 'show-flights-btn') {
						if (btn.innerText == 'Show Results') {
							self.clearFlightsTable();
						} else {
							self.buildFlightsTable(self.passengerTimingData.flights);
						}
					} else if (btn.id == 'show-passengers-btn') {
						if (btn.innerText == 'Show Results') {
							self.clearPassengersTable();
						} else {
							self.buildPassengersTable(self.passengerTimingData.passengers);
						}
					}
				});
			});
	};
	app.View.prototype = {

		///////////////////////////////////////////////////////////////////////////////
		//	General Functions
		/////////////////////////////////////////////////////////////////////////////////
		
		init : function() {

			this.clearPassengerProfilesTable();
			this.clearFlightProfilesTable();
		},
		enableDownloads : function(id) {

			Array.prototype.slice.call(document.querySelectorAll(id+' .show-btn')).forEach(function(b){
				b.disabled = false;
			});
		},
		enableProfileRunButton : function() {

			document.querySelectorAll("#timing-box .run-btn")[0].disabled = false;
		},
		getTerminalFilter : function() {

			return document.getElementById("filter-terminal").value;
		},
		getFlightFilter : function() {

			return document.getElementById("filter-flights").value;
		},
		getPassengerFilter : function() {

			return document.getElementById("filter-passengers").value;
		},
		getTimeFrame : function() {

			var timeFrame = document.getElementById('timeFrame')
				.value.split(" to ")
				.map(function (str) {

				return Number(str);
			});
			if (timeFrame.length == 2 && 
				!isNaN(timeFrame[0] &&
				!isNaN(timeFrame[1]))) {

				return timeFrame;

			} else {

				return [0, 24];
			}
		},
		getLoadFactor : function () {
			var loadFactor = document.getElementById("loadFactor").value;

			if (loadFactor>0 && loadFactor<=1) {

				return loadFactor;
			} else {

				return 1;
			}
		},
		getColor : function (str) {
			
			var self = this,
				color = null;

			for (var i in self.hexColors) {

				var attributes = i.split('.');

				if (attributes.every(function(attr) {

					if (str.match(new RegExp(attr))) return true;
					return false;

				})) {
					color = self.hexColors[i];
				}
			}
			return color;
		},
		save : function (id, type) {

			var self = this,
				dataType;

			switch (id) {

				case 'passengerProfiles' : 
				case 'flightProfiles' : 

					dataType = 'passengerProfileData';

					break;

				case 'passengers' :
				case 'flights' :

					dataType = 'passengerTimingData';

					break;

				default : 

					break;
			}

			var data = self[dataType][id].map(function (item) { 
				
				item = item.wrangle();
				item.color = self.getColor(JSON.stringify(item));
				
				return item;

			});
						
			switch (type) {

				case "json":

					this.downloadJSON(data, id);

					break;

				case "csv":

					var keys = Object.keys(data[0]);

					this.downloadCSV(aviation.core.csv.serialize(data, keys), id);

					break;

				default :

					break;
			}
		},
		downloadJSON : function(data, name) {
			/*
			 * modified from
			 * http://stackoverflow.com/questions/13405129/javascript-create-and-save-file
			 */
			var a = document.createElement("a");
			var file = new Blob([JSON.stringify(data)], {type:'text/plain'});

			a.href = URL.createObjectURL(file);
			a.download = name+'.json';
			a.click();
		},
		downloadTXT : function(data, name) {

			var a = document.createElement("a");
			var file = new Blob([data], {type:'text/plain'});

			a.href = URL.createObjectURL(file);
			a.download = name+'.txt';
			a.click();
		},
		downloadCSV : function(data, name) {

			var a = document.createElement("a");
			var file = new Blob([data], {type:'text/plain'});

			a.href = URL.createObjectURL(file);
			a.download = name+'.csv';
			a.click();
		},


		/////////////////////////////////////////////////////////////////////////
		//	Passenger Profile simulation view updates
		//////////////////////////////////////////////////////////////////////////

		clearPassengerProfilesTable : function () {

			document.getElementById('passenger-profile-parcoords').innerHTML = '';
			document.getElementById('passenger-profile-table').innerHTML = '';
		},
		buildPassengerProfilesTable : function (passengerProfiles) {

			var self = this,
				color = function(d) {return self.getColor(d.name); },
				divheight = passengerProfiles.length * 10;

			var div = document.getElementById('passenger-profile-parcoords');
		
			div.style.width = '1000px';
			div.style.height = divheight.toString() + 'px';

			var parcoords = d3.parcoords()('#passenger-profile-parcoords')
			    .data(passengerProfiles.map(function(d) {return d.wrangle(); }))
			    .hideAxis([])
			    .color(color)
			    .alpha(0.3)
			    .composite("darken")
			    .margin({ top: 20, left: 200, bottom: 10, right: 0 })
			    .mode("queue")
			    .render()
			    //.reorderable();
			    .brushMode("1D-axes");  // enable brushing

			var grid = d3.divgrid();

			d3.select("#passenger-profile-table")
			    .datum(passengerProfiles.slice().map(function(d) {return d.wrangle(); }))
			    .call(grid)
			    .selectAll(".row")
			    .on({
			    	"mouseover": function(d) { parcoords.highlight([d]); },
			    	"mouseout": parcoords.unhighlight
			    });

			parcoords.on("brush", function(d) {
			    d3.select("#passenger-profile-table")
			    	.datum(d.slice()) // (0,10) before
			    	.call(grid)
			    	.selectAll(".row")
			    	.on({
			        	"mouseover": function(d) { parcoords.highlight([d]); },
			        	"mouseout": parcoords.unhighlight
			      });
			  });

		},
		clearFlightProfilesTable : function () {

			document.getElementById('flight-profile-table').innerHTML = '';
		},
		buildFlightProfilesTable : function (flightProfiles) {

			var self = this,
				heightCount = 0;

			var color = function(d) {return self.getColor(d.id); };

			var wrangled = flightProfiles.map(function(p) {return p.wrangle(); });
				stratified = [{

					'id' : 'flightProfiles'
				}];

			var nestedDivGrid = document.createElement('div');

			for (var i=0; i<wrangled.length; i++) {

				var designGroup = wrangled[i].name,
					designGroupDiv = document.createElement('div');

				designGroupDiv.innerHTML = '<div class="outlined-bottom outlined-left bold">'+designGroup+'</div>';

				stratified.push({

					'id' : ['flightProfiles', designGroup].join('-')
				});

				for (var j=0; j<wrangled[i].data.length; j++) {

					var di = wrangled[i].data[j].name,
						diDiv = document.createElement('div');

					diDiv.innerHTML = '<div class="outlined-bottom outlined-left bold">'+di+'</div>';
					diDiv.classList.add('pad');
						
					stratified.push({

						'id' : ['flightProfiles', designGroup, di].join('-')

					});

					for (var k=0; k<wrangled[i].data[j].data.length; k++) {

						var am = wrangled[i].data[j].data[k].name,
							amDiv = document.createElement('div'),
							typeDiv = document.createElement('div');

						amDiv.innerHTML = '<div class="outlined-bottom outlined-left bold">'+am+'</div>';
						amDiv.classList.add('pad');

						typeDiv.classList.add('pad');

						stratified.push({

							'id' : ['flightProfiles', designGroup, di, am].join('-')
						});

						for (var l=0; l<wrangled[i].data[j].data[k].data.length; l++) {

							var type = wrangled[i].data[j].data[k].data[l].name;

							stratified.push( {

								'id' : ['flightProfiles', designGroup, di, am, type].join('-'),
								'value' : wrangled[i].data[j].data[k].data[l].percentage

							});

							heightCount++;
						}

						var grid = d3.divgrid();

						var divgrid = d3.select(typeDiv)
							.datum(wrangled[i].data[j].data[k].data)
							.call(grid);
						
						amDiv.appendChild(typeDiv);						
						diDiv.appendChild(amDiv);
					}			
					designGroupDiv.appendChild(diDiv);
				}
				nestedDivGrid.appendChild(designGroupDiv);
			}
			document.getElementById('flight-profile-table').appendChild(nestedDivGrid);

			var divheight = (heightCount * 10 ),
				padding = {top : 0, right : 0, bottom : 0 , left : 120};

			var FlightProfileDendogramDiv = d3.select('#flight-profile-dendogram')
				.append('div')
				.style('height', divheight.toString() + "px")
				.style('width', "1000px");

			var g = FlightProfileDendogramDiv.append('svg')
				.attr('width', 1000)
				.attr('height', divheight)
				.append('g')
				.attr("transform", "translate(120,0)");

			var tree = d3.layout.cluster()
				.size([divheight, 600 - padding.left - padding.right]);

			var stratify = d3.stratify()
				.parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf('-')); });

			var root = stratify(stratified)
				.sort(function (a,b) {return (a.height - b.height) || a.id.localeCompare(b.id); });

			tree(root);

			var link = g.selectAll('.link')
				.data(root.descendants().slice(1))
				.enter().append('path')
					.attr('class', 'link')
					.attr('d', function(d) {
						return 'M' + d.y + ',' + d.x
							+ 'C' + (d.parent.y + 100) + ',' + d.x
							+ ' ' + (d.parent.y + 100) + ',' + d.parent.x
							+ ' ' + d.parent.y + ',' + d.parent.x;
					});

			var node = g.selectAll('.node')
				.data(root.descendants())
				.enter().append('g')
					.attr('class', function(d) { return 'node' + (d.children ? ' node--internal' : ' node--leaf'); })
					.attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });

			node.each(function(d,i) {

				val = (d.data.value / 100 ) * 100;

				if (d.children) {
					d3.select(this)
						.append('circle')
						.attr('r', 2.5);
				} else {


					d3.select(this)
						.append("line") 
					    .attr('class', 'datum-line')
					    .attr("x1", 0)  
					    .attr("y1", 0) 
					    .attr("x2", 100)  
					    .attr("y2", 0);

					d3.select(this)
						.append('rect')
						.attr('x', 0)
						.attr('y', -2.5)
						.attr('width', val)
						.attr('height', 5)
						.attr('fill', color);
				}

			});

			node.append('text')
				.attr('dy', 3)
				.attr('x', function (d) { return d.children ? -8 : 100; })
				.style('text-anchor', function(d) {return d.children ? 'end' : 'start'; })
				.text(function(d) {	return d.id.substring(d.id.lastIndexOf('-') + 1); });

			

		},

		////////////////////////////////////////////////////////////////////////////////
		//	Passenger Timing simulation view updates
		////////////////////////////////////////////////////////////////////////////////

		clearPassengersTable : function () {

			document.getElementById("passenger-timing-parcoords").innerHTML = '';
			document.getElementById("passenger-timing-table").innerHTML = '';
		},
		buildPassengersTable : function(passengers) {

			passengers = passengers.filter(function (p) {

				var w = p.wrangle();

				if (w['delta.checkIn'] > 360) return false;
				if (w['delta.security'] > 360) return false;

				return true;

			});

			var self = this,
				color = function(d) {return self.getColor(d.passengerType); },
				tempFind = [];
				divheight = self.passengerProfileData.passengerProfiles.length * 10;

			var div = document.getElementById('passenger-timing-parcoords');
		
			div.style.width = '1000px';
			div.style.height = divheight.toString() + 'px';

			var parcoords = d3.parcoords()("#passenger-timing-parcoords")
			    .data(passengers.map(function(d) { return d.wrangle(); }))
			    .hideAxis([

			    	//'arrival',
					//'bags',
					'boarding',
					//'category',
					'checkInTime',
					'concourse',
					//'delta.arrival',
					//'delta.checkIn',
					//'delta.security',
					'departure',
					'flightID',
					'flightName',
					'gate',
					'gateInfo',
					'gender',
					'isBusiness',
					'isGateHog',
					//'isPreCheck',
					'isTransfer',
					'passengerID',
					//'passengerType',
					'security',
					'securityTime',

			    	])
			    .color(color)
			    .alpha(0.1)
			    .composite("darken")
			    .margin({ top: 20, left: 200, bottom: 10, right: 0 })
			    .mode("queue")
			    .render()
			    //.reorderable();
			    .brushMode("1D-axes");  // enable brushing

			var grid = d3.divgrid();

			d3.select("#passenger-timing-table")
			    .datum(passengers.slice(0,20).map(function(d, i) {

			    	d = d.wrangle();

			    	tempFind[i] = d;
			    	
			    	return {

			    		'name' : d.passengerType,
			    		'gender' : d.gender,
			    		'bags' : d.bags,
			    		'preCheck' : d.isPreCheck,
			    		'flightID' : d.flightID,
			    		'arrival' : aviation.core.time.decimalDayToTime(d.arrival),
			    		'security' : aviation.core.time.decimalDayToTime(d.security),
			    		'concourse' : aviation.core.time.decimalDayToTime(d.concourse),
			    		'gate' : aviation.core.time.decimalDayToTime(d.gate),
			    		'boarding' : aviation.core.time.decimalDayToTime(d.boarding),
			    		'departure' : aviation.core.time.decimalDayToTime(d.departure),
			    		
			    	};
			    }))
			    .call(grid)
			    .selectAll(".row")
			    .on({
			    	"mouseover": function(d, i) { parcoords.highlight([tempFind[i]]); },
			    	"mouseout": parcoords.unhighlight
			    });

			parcoords.on("brush", function(d) {

				tempFind = [];

			    d3.select("#passenger-timing-table")
			    	.datum(d.slice(0,20).map(function(d, i) {

			    		tempFind[i] = d;
				    	
				    	return {

				    		'name' : d.passengerType,
				    		'gender' : d.gender,
				    		'bags' : d.bags,
				    		'preCheck' : d.isPreCheck,
				    		'flightID' : d.flightID,
				    		'arrival' : aviation.core.time.decimalDayToTime(d.arrival),
				    		'security' : aviation.core.time.decimalDayToTime(d.security),
				    		'concourse' : aviation.core.time.decimalDayToTime(d.concourse),
				    		'gate' : aviation.core.time.decimalDayToTime(d.gate),
				    		'boarding' : aviation.core.time.decimalDayToTime(d.boarding),
				    		'departure' : aviation.core.time.decimalDayToTime(d.departure),
				    		
				    	};
				    }))
			    	.call(grid)
			    	.selectAll(".row")
			    	.on({
			        	"mouseover": function(d, i) { parcoords.highlight([tempFind[i]]); },
			        	"mouseout": parcoords.unhighlight
			      });
			  });
		},
		clearFlightsTable : function () {

			document.getElementById("flight-table").innerHTML = '';
			document.getElementById("flight-packing").innerHTML = '';
		},
		buildFlightsTable : function (flights) {

			function wrangleGates(flights) {
				
				var mapped = aviation.core.array.mapElementsToObjByKey(flights, 'gate'),
					gates = Object.keys(mapped);

				var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"], // alternatively colorbrewer.YlGnBu[9]
					carriers = {},
					lineValY;

				colors.reverse();

				return gates.map(function(gate) {

					return {
						'gate' : gate,
						'flights' : mapped[gate].map(function(flight) {

							var yLocation = flight.location > 300
								? ((flight.location - 300) * 20 ) + 1000
								: ((flight.location - 200) * 20 )

							if (gate.match(/[a]/)) yLocation -= 3;
							if (gate.match(/[b]/)) yLocation += 3;

							lineValY = yLocation;

							var carrier = flight.airline.IATA,
								color;

							if (!(carrier in carriers)) {
								carriers[carrier] = colors.pop();
							} 

							return {
								'name' : flight.getFlightName(),
								'lineVals' : [
									{
										'x': flight.ival.start * 1000,
										'y': yLocation
									},
									{
										'x': flight.ival.end * 1000,
										'y': yLocation
									}
								],
								'carrier' : flight.airline,
								'color' : carriers[carrier]
							}
						}),
						'lineVals' : [
							{
								'x': 0,
								'y': lineValY
							},
							{
								'x': 1000,
								'y': lineValY
							}
						],
					}
				})
			}

			var lineFunc = d3.svg.line()
				.x(function(d) { return d.x; })
				.y(function(d) { return d.y; })
				.interpolate('linear');

			var grid = d3.divgrid();

			var packsvg = d3.select("#flight-packing")
				.append("svg")
				.attr("width", 1000)
				.attr("height", 500)
				.attr("class", "vis");

			var g = packsvg.append("g");

			var gates = wrangleGates(flights);

			var gateItems = g.selectAll('.gate')
				.data(gates)
				.enter().append('g');

			gateItems.each(function(d, i) {

				d3.select(this)
					.append("path")
					.attr("d", lineFunc(d.lineVals))
					.attr("stroke", "grey")
					.attr("stroke-width", 1)
					.attr("opacity", 0.5)
					.attr("fill", "none");

				d3.select(this)
					.append("text")
					//.attr("x", d.lineVals[0].x)
					.attr("y", d.lineVals[0].y)
					.text(function(d) {
						if (!d.gate.match(/[ab]/)){
							return d.gate;
						}
						else {
							return "";
						}
					})

				for (var f in d.flights) {
					d3.select(this)
						.append("path")
						.attr("d", lineFunc(d.flights[f].lineVals))
						.attr("stroke", d.flights[f].color)
						.attr("stroke-width", 2)
						.attr("fill", "none");
				}
			});

			d3.select("#flight-table")
			    .datum(flights.slice().map(function(d) {
			    	
			    	d = d.wrangle(); 

			    	d.arrival = aviation.core.time.decimalDayToTime(d.arrival);
			    	d.departure = aviation.core.time.decimalDayToTime(d.departure);
			    	d['delta.arrival'] = aviation.core.time.decimalDayToMinutes(d['delta.arrival']);

			    	return d;

			    }))
			    .call(grid);

		}
	};

})();
