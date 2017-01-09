var app = app || {};

(function() {

	app.init = function() {

		this._view = new this.View();
		this._view.init();
		this._timeSlice = 1;
	};
	app.runPassengerProfileSimulation = function(cb) {

		var self = this,
			worker  = new Worker('js/worker.profile.js');

		worker.addEventListener('message', function(e) {

			self._flightProfiles = e.data.flightProfiles;
			self._passengerProfiles = e.data.passengerProfiles;
			self._designDay = e.data.flights;

			e.data.flightProfiles = e.data.flightProfiles.map(function(f) {
				return aviation.profiles.FlightProfile.deserialize(f.data); 
			});
			e.data.passengerProfiles = e.data.passengerProfiles.map(function(p) {
				return aviation.profiles.PassengerProfile.deserialize(p.data);
			});
	
			cb(e.data);

		}, false);

		worker.postMessage({
			"terminalFilter" : self._view.getTerminalFilter(), 
			"timeSlice" : self._timeSlice
		});
	};
	app.runPassengerTimingSimulation = function(cb) {

		var self = this,
			worker = new Worker('js/worker.timing.js');

		worker.addEventListener('message', function(e) {

			e.data.passengers = e.data.passengers.map(function(p) {
				return aviation.class.Passenger.deserialize(p.data); 
			});
			e.data.flights = e.data.flights.map(function(f) {
				return aviation.class.Flight.deserialize(f.data); 
			});

			cb(e.data);

		}, false);

		worker.postMessage({
			"designDay" : this._designDay,
			"flightProfiles" : this._flightProfiles,
			"passengerProfiles" : this._passengerProfiles,
			"loadFactor" : this._view.getLoadFactor(),
			"filter" : this._view.getFlightFilter(),
			"timeFrame" : this._view.getTimeFrame(),
			"timeSlice" : this._timeSlice
		});
	};

	app.init();

})();
