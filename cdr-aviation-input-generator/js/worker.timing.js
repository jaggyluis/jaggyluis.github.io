importScripts('lib/aviation.min.js', 'lib/d3.v3.min.js');

function wrangleGateLayoutData (gateLayoutData) {

	return gateLayoutData.reduce(function(arr, gate) {

		gate = aviation.core.obj.parse(gate);

		if (aviation.core.obj.isNull(gate)) return arr;

		var g = {

			'name' : gate['NAME'],
			'num' : gate['NUM'] ? gate['NUM'] : null,
			'ba' : gate['BA'],
			'isMARS' : gate['MARS'],
			'seats' : gate['SEATS'],
			'waiting' : gate['SFWAIT'],
			'boarding' : gate['SFBOARD'],
			'designGroup' : gate['GR'],
			'designGroupMARS' : gate['GRMARS'] ? gate['GRMARS'] : null,
			'sub' : gate['MARS'] ? [gate['SUBA'], gate['SUBB']] : null,
			'carrier' : gate['CARRIER']
		};

		arr.push(g);

		return arr;
		
	}, []);
}

var gateLayoutFilePath = '../doc/gatelayout.csv',
	gateLayout;

self.addEventListener('message', function(e) {

	d3.csv(gateLayoutFilePath, function(responseText) {

		gateLayout = wrangleGateLayoutData(responseText);

		e.data.gates = gateLayout;
		e.data.clusterType = "random"; //cluster, random

		aviation.clear();
		aviation.set(e.data, function() {

			self.postMessage({
				"passengers" : aviation.get.passengers().map(function(p) { return p.serialize(); }),
				"flights" : aviation.get.flights().map(function(f) { return f.serialize(); })
			});
		});
	});

}, false);