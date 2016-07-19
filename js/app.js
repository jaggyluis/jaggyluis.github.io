var app = app || {};

(function() {

	app.init = function() {

		this._view = new this.View();
		this._view.init();
		this._timeSlice = 1;
	}
	app.compute = function(cb) {

		var self = this,
			worker  = new Worker('js/profile-worker.js');

		worker.addEventListener('message', function(e) {
	
			self._profiles = e.data.profiles;
			self._types = e.data.types;
			self._designDay = e.data.flights;
			self._gates = e.data.gates;

			cb(e.data);

		}, false);

		worker.postMessage({terminalFilter : self._view.getTerminalFilter(), timeSlice : self._timeSlice});
	};
	app.run = function() {

		this.clear();

		AVIATION.set(
			this._gates,
			this._designDay,
			this._profiles,
			this._types,
			this._view.getLoadFactor(), 
			this._view.getFlightFilter(), 
			this._view.getTimeFrame(),
			this._timeSlice);

		this._view.passengers = AVIATION.get.passengers(this._view.getPassengerFilter());
		this._view.flights = AVIATION.get.flights();
	};
	app.clear = function() {
		
		this._view.clear();
		AVIATION.clear();
	};

	app.init();

})();
