//deck colours:

var d3_COLOURSCALE_USE = d3.scaleOrdinal()
  .domain(['CM', 'CP', 'ET', 'IN', 'MD', 'NA', 'PK', 'PS', 'RS', 'RT', 'SA', 'TL', 'TP', 'UR', 'UT', 'XX'])
  .range(['#ff0000', '#6ccaf2', '#f8b4f3', '#b87e44', '#9d81d9', '#dfdfdf', '#83d474', ' #dfdfdf', '#f5d847', '#5282fa', '#f5d847', '#f5d847', '#4c4c4c', '#dfdfdf', '#dfdfdf', '#dfdfdf']);

var COLOURSCALE_USE = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_USE(d));
	return([d3col.r, d3col.g, d3col.b])
}

var COLOURSCALE_USE_darker = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_USE(d));
	new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}

var d3_COLOURSCALE_PODIUM = d3.scaleOrdinal()
  .domain(['basement', 'tower', 'podium'])
  .range(['#c4c4c4', '#ff6a30', '#2b77f2']);

var COLOURSCALE_PODIUM = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_PODIUM(d));
	return([d3col.r, d3col.g, d3col.b])
}

var COLOURSCALE_PODIUM_darker = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_PODIUM(d));
	new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}

var COLOURSCALE_PODIUM_CUTOFFS = function(d, a) {
	var d3col = d3.rgb(d3_COLOURSCALE_PODIUM(d));
	if(d=='podium') {
		if(a>=3500) {
			return([d3col.r, d3col.g, d3col.b])
		}
	}
	if(d=='tower') {
		if(a>=1900) {
			return([d3col.r, d3col.g, d3col.b])
		}
	}
	var d3colgrey = d3.rgb('#c4c4c4');
	return([d3colgrey.r, d3colgrey.g, d3colgrey.b])
}

var COLOURSCALE_PODIUM_CUTOFFS_darker = function(d, a) {
	var d3col = d3.rgb(d3_COLOURSCALE_PODIUM(d));
	if(d=='podium') {
		if(a>=3500) {
			return([d3col.r, d3col.g, d3col.b])
		}
	}
	if(d=='tower') {
		if(a>=1900) {
			return([d3col.r, d3col.g, d3col.b])
		}
	}
	var d3colgrey = d3.rgb('#c4c4c4');
	return([d3colgrey.r, d3colgrey.g, d3colgrey.b])
}

var COLOURSCALE_SATISFIED = function(d) {
	if(d=='True') {
		return([255, 0, 0]);
	}
	var d3col = d3.rgb(COL_BUILDINGS_NO_METRIC);
	return([d3col.r, d3col.g, d3col.b]);	
}

var COLOURSCALE_SATISFIED_darker = function(d) {
	var d3col = d3.rgb(COL_BUILDINGS_NO_METRIC);
	if(d=='True') {
		d3col = d3.rgb(255,0,0);
	}
	
	var new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);	
}

var COLOURSCALE_CUTOFF = function(d, cutoff) {
	//console.log(d);
	if(d>=cutoff) {
		
		//console.log("> cutoff");
		return([255, 0, 0]);
	}
	var d3col = d3.rgb(COL_BUILDINGS_NO_METRIC);
	return([d3col.r, d3col.g, d3col.b]);
}

var COLOURSCALE_CUTOFF_darker = function(d, cutoff) {
	var d3col = d3.rgb(COL_BUILDINGS_NO_METRIC);
	if(d>=cutoff) {
		d3col = d3.rgb(255,0,0);
	}
	var new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}

//NLA - per floor
//COL_BUILDINGS_NO_METRIC = #c4c4c4
var d3_COLOURSCALE_NLA = d3.scaleThreshold()
    .domain([1000, 1500, 2000, 3000])
    .range(['#c4c4c4', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177']);

var COLOURSCALE_NLA = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_NLA(d));
	return([d3col.r, d3col.g, d3col.b])
}

var COLOURSCALE_NLA_darker = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_NLA(d));
	var new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}

//PERCENTAGES
var d3_COLOURSCALE_PERCENT2 = d3.scaleLinear()
    .domain([0, 1])
    .range(['#ffffff', '#000000']);

var d3_COLOURSCALE_PERCENT = d3.scaleThreshold()
    .domain([0.0000001, 0.20000001, 0.40000001, 0.60000001, 0.80000001, 1.00000001])
    .range(['#c4c4c4', '#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494', '#000000']);
	
var COLOURSCALE_PERCENT = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_PERCENT(d));
	return([d3col.r, d3col.g, d3col.b])
}

var COLOURSCALE_PERCENT_darker = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_PERCENT(d));
	var new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}

//EMPLOYEES
var d3_COLOURSCALE_EMPLOYEES = d3.scaleThreshold()
    .domain([0.0000001, 4.0000001, 20.0000001, 100.0000001, 200.60000001])
    .range(['#c4c4c4', '#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']);
	
var COLOURSCALE_EMPLOYEES = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_EMPLOYEES(d));
	return([d3col.r, d3col.g, d3col.b])
}

var COLOURSCALE_EMPLOYEES_darker = function(d) {
	var d3col = d3.rgb(d3_COLOURSCALE_EMPLOYEES(d));
	var new_colour = d3col.darker(2);
	return([new_colour.r, new_colour.g, new_colour.b]);
}


	  
/*
CM, #ff0000
CP, #6ccaf2
ET, #f8b4f3
IN, #b87e44
MD, #9d81d9
NA, #dfdfdf
PK, #83d474
PS, #dfdfdf
RS, #f5d847
RT, #5282fa
SA, #f5d847
TL, #f5d847
TP, #4c4c4c
UR, #dfdfdf
UT, #dfdfdf
XX, #dfdfdf
, #dfdfdf
*/
			  