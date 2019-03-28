


class MapController {

  constructor(map) {
    this.map = map;
    this.layers = {};
    this.sources = {};
    this.legend = null;
    this.keys = [];
    this.loading = false;
    this.container = map._container;
    this.envelope = [];

    var self = this;

    document.addEventListener("keydown", function(e) {
      if (!self.keys.includes(e.key)) {
        self.keys.push(e.key);
      }
    });

    document.addEventListener("keyup", function(e) {
      if (self.keys.includes(e.key)) {
        self.keys.splice(self.keys.indexOf(e.key, 1));
      }
    });

    console.log(map);

    self.loader = document.createElement("div");
    self.loader.id = "overlay";
    self.loader.classList.add("collapsed");
    self.loader.innerHTML = '<img src="img/loadloop.gif" id="loader"></img>';
    self.container.appendChild(self.loader);

    map.on("sourcedata", function(e) {

      setTimeout(() => {

        self.loading = false;

        Object.keys(self.sources).forEach(source => {

          if (!e.target.isSourceLoaded(source)) {
            self.loading = true;
          }

        });

        if (self.loading || self.loadingOverride) {

          self.loader.classList.remove("collapsed");

        } else {

          if (!self.loader.classList.contains("collapsed")) {
            self.loader.classList.add("collapsed");
          }

        }

      }, 500);

    });

    document.addEventListener('contextmenu', event => { // NOTE - this will disable all context menu on the page during loading - might be a bad idea

      if (self.loading) {
        event.preventDefault();
      }

    });

    var draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      styles : buildMapBoxDrawLayerStyle()
    });

    self.map.dragRotate.disable();
    self.draw = draw;

    //map.addControl(new mapboxgl.NavigationControl());
    //map.addControl(new mapboxgl.ScaleControl());

    var controls = new SSController();
    controls.setMapController(self);
    self.controls = controls;

    map.addControl(controls);
    map.addControl(draw);

    function update(e) {

      self.envelope = self.draw.getAll().features;

      Object.keys(self.sources).forEach(key => {

        var source = self.sources[key];
        var active = source.active;

        source.brushed = [];

        self.updateFilterLayerController(key);
        self.updateFilterLayer(key, true);
        self.updateFilterLayerPropertyStops(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectFilterLayerProperty(key, active);
        }

      });

      self.updateLegend();

    };

    map.on('draw.create', update);
    map.on('draw.delete', update);
    map.on('draw.update', update);
  }

  setLoading(loading) {

    this.loading = loading;
    this.loadingOverride = loading;

    if (loading) {

      if (!self.loader.classList.contains("collapsed")) {
        self.loader.classList.add("collapsed");
      }

    } else {
      self.loader.classList.remove("collapsed");
    }
  }

  isLoading() {
    return this.loading;
  }

  areKeysDown(keys) {
    for (var i = 0; i<keys.length; i++) {
      if (!this.keys.includes(keys[i])) {
        return false;
      }
    }

    return true;
  }

  getSourceData(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return [];
    }

    return source.coords.data();
  }

  addSource(key, data) {

    function createPropertyState(property, wrangled) {

      var propertyStops = [];
      var propertyInterval = wrangled.properties[property];
      var propertyRange = [propertyInterval[0], propertyInterval[1]];
      var propertyStyle = style(property);
      var propertyStop = propertyStyle.length;

      for (var i = 0; i< propertyStop; i++) {
        propertyStops.push([propertyInterval[0] + ( i * ((propertyRange[1]-propertyRange[0]) / propertyStop) ), propertyStyle[i]]);
      }

      return {
        propertyStops : propertyStops,
        propertyInterval : propertyInterval,
        propertyRange : propertyRange,
        propertyStyle : propertyStyle,
        propertyStop : propertyStop,
        propertyReversed : false,
      }
    }

    var self = this;

    self.sources[key] = wrangle(data);
    self.sources[key].source = key;
    self.sources[key].states = {};
    self.sources[key].active = null;
    self.sources[key].height = "height_m"; //"RoofRL";
    self.sources[key].base = ""; //"FloorRL";
    self.sources[key].visible = true;
    self.sources[key].brushed = [];
    self.sources[key].coords = null;
    self.sources[key].grid = null;
    self.sources[key].filtered = ["in", "_id"];
    self.sources[key].hoveredStateId =  null;
    self.sources[key].hidden = [];
    self.sources[key].popups = [];
    self.sources[key].selected = [];
    self.sources[key].layers = {};
    self.sources[key].filters = {
      default :   (value) => { return false; },
      envelope :  (value) => {

          if (self.envelope.length > 0) {

            if (!value.lat || !value.lon) { // NOTE - for legend or bad values ---
              return false;
            }

            var pt = turf.point([value.lon, value.lat]);
            var filter = true;

            for (var i = 0; i< self.envelope.length; i++) {
              if (turf.booleanPointInPolygon(pt, self.envelope[i])) {
                filter = false;
                break;
              }
            }

            return filter;

          }

          return false;
      }

    };

    self.sources[key].values.forEach(d => { // NOTE - adds all the geometry at the beginning ---

      var keep = true;

      Object.keys(self.sources[key].filters).forEach(filter => {

          if (self.sources[key].filters[filter](d)) {
            keep = false;
          }
      });

      if (keep) {
        self.sources[key].filtered.push(d._id);
      }

      //self.sources[key].filtered.push(d._id);
    });

    var properties = Object.keys(self.sources[key].properties);
    var propertyTypes = detectTypes(self.sources[key].values);

    properties.sort();
    properties.forEach(property => {

      var propertyState = createPropertyState(property, self.sources[key]);
      propertyState.propertyType = propertyTypes[property];

      if (propertyState.propertyType === "string") {

        var categories = [];

        self.sources[key].values.forEach(value => {

          var category = value[property];

          if (!(categories.includes(category))) {
            categories.push(category);
          }

        });

        categories.sort();

        propertyState.propertyCategories = categories;
        propertyState.propertyStyle = style("category");
        propertyState.propertyStops = [];

        for (var i = 0; i<propertyState.propertyCategories.length; i++) {
          propertyState.propertyStops.push([propertyState.propertyCategories[i], propertyState.propertyStyle[i % propertyState.propertyStyle.length]])
        }
      }

      self.sources[key].states[property] = propertyState;
      self.sources[key].hidden.push(property);

    });

    console.log(self.sources);

    if (Object.keys(self.sources).length === 1) { // NOTE - only center once ---

      var base = turf.buffer(this.sources[key].data.features[0], 10, {units: 'miles'});
      var bounds = geojsonExtent(base);

      self.map.fitBounds(bounds);
    }

    self.map.addSource(key, {
      type: 'geojson',
      data
    });
  }

  getSourceKeys() {
    return Object.keys(this.sources);
  }

  getLayerKeys() {
    return Object.keys(this.layers);
  }

  getSourceKeyProperties(key, active, hidden) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return [];
    }

    var properties = Object.keys(source.properties);

    if (active && hidden) {

    } else if (hidden) {

      properties = source.hidden;

    } else if (active) {

      var _properties = [];

      properties.forEach(property => {
        if (!source.hidden.includes(property)) {
          _properties.push(property);
        }
      });

      properties = _properties;
    }

    properties.sort();

    return properties;
  }

  getSourceKeyPropertyState(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return null;
    }

    if (source.states[property] === undefined) {
      return null;
    }

    return source.states[property];
  }

  addLayer(key) {

    this.addFilterLayer(key);
    this.addBaseLayer(key); // NOTE - swap this maybe?
  }

  toggleLayer(key, visible) {

    var self = this;
    var source = self.sources[key];
    var visibility = visible === true ? "visible" : "none";

    if (source === undefined || source === null) {
      return;
    }

    map.setLayoutProperty(key + "-base", 'visibility', visibility);
    map.setLayoutProperty(key + "-filter", 'visibility', visibility);

    source.visible = visible;

    self.updateLegend();
  }

  addBaseLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    if (source.types.length > 1) {

      var str = "Geometry layer contains more than one type : \n\n"

      source.types.forEach(type => {
        str += type + "\n";
      })

      str += "\nMap behavior may be unpredictable."

      alert(str);
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":
      case "MultiPolygon":

        var layer = buildGeoJsonPolygonBaseLayer(source);
        var id = layer.id;

        self.sources[key].layers.base = id;

        self.map.addLayer(layer , firstSymbolId );

        break;

      case "LineString":
      case "MultiLineString":

        var layer = buildGeoJeonLineStringBaseLayer(source);
        var id = layer.id;

        self.sources[key].layers.base = id;

        self.map.addLayer(layer , firstSymbolId );

        break;

      case "Point":

        var layer = buildGeoJsonPointBaseLayer(source);
        var id = layer.id;

        self.sources[key].layers.base = id;

        self.map.addLayer(layer , firstSymbolId );

        // point always on top ---
        self.map.moveLayer(id);

        break;

      default:

    }
  }

  addFilterLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    if (source.types.length > 1) {

      var str = "Geometry layer contains more than one type : \n\n"

      source.types.forEach(type => {
        str += type + "\n";
      })

      str += "\nMap behavior may be unpredictable."

      alert(str);
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":
      case "MultiPolygon":

        var layer =  buildGeoJsonPolygonFilterLayer(source, !self.controls.isExtruded());
        var id = layer.id;

        self.sources[key].layers.filter = id;

        self.map.addLayer( layer, firstSymbolId );

        break;

      case "LineString":
      case "MultiLineString":

        var layer =  buildGeoJsonLineStringFilterLayer(source);
        var id = layer.id;

        self.sources[key].layers.filter = id;

        self.map.addLayer( layer, firstSymbolId );

        break;

      case "Point":

        var layer = buildGeoJsonPointFilterLayer(source);
        var id = layer.id;

        self.sources[key].layers.filter = id;

        self.map.addLayer( layer, firstSymbolId );
        self.map.moveLayer( layer.id ); // point always on top ---

        break;

      default:

    }

    // --- highlight

    self.map.on("mousemove", key + "-filter", function(e) {

      if (e.features.length > 0) {

        var feature = e.features[0];
        var properties = feature.properties;

        self.highlightFeature(key, properties);
      }

    });

    self.map.on("mouseleave", key + "-filter", function() {

      self.unhighlightFeature(key);
    });

    // --- popup -- multiples for comparison

    self.map.on('click', key + "-filter", function(e) {

      if (e.features.length > 0) {
        self.selectFeature(key, e.features[0].properties, e.lngLat);
      }

    });
  }

  highlightFeature(key, data)  {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var highlight = source.selected.slice();

    highlight.push(data);

    if (source.hoveredStateId) {
      self.map.setFeatureState({source : key, id : source.hoveredStateId}, {hover : false } );
    }

    source.hoveredStateId = data._id;
    self.map.setFeatureState({source : key, id : source.hoveredStateId}, {hover : true } );

    if (source.coords) {
      source.coords.highlight(highlight);
    }

  }

  unhighlightFeature(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (source.hoveredStateId) {
      map.setFeatureState({source : key, id : source.hoveredStateId}, {hover : false });
    }

    source.hoveredStateId = null;

    self.updateFilterLayerControllerSelection(key);
  }

  selectFeature(key, data, location) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var types = source.types;
    var features = source.data.features.filter(feature => {
      return data._id === feature.id;
    });

    if (features.length === 0) {
      return;
    }

    features.forEach(feature => {

      if (location === undefined || location === null) {
        if (types.includes("MultiPolygon")) {
          location = feature.geometry.coordinates[0][0][0];

        } else if (types.includes("Polygon") || types.includes("MultiLineString")) {
          location = feature.geometry.coordinates[0][0];

        } else if (types.includes("LineString")) {
          location = feature.geometry.coordinates[0];

        } else if (types.includes("Point")) {
          location = feature.geometry.coordinates;
        }
      }

      source.selected.push(feature.properties);
      source.grid.select(feature.properties);

      self.addFilterLayerFeaturePopup(key, feature, location);

      self.map.setFeatureState({source : key, id : feature.id }, {selected : true });

    });

    self.updateFilterLayerControllerSelection(key);;
  }

  deselectFeature(key, data) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var features = source.data.features.filter(feature => {
      return data._id === feature.id;
    });

    if (features.length === 0) {
      return;
    }

    features.forEach(feature => {

      var index = source.selected.indexOf(feature.properties);

      if (index != -1) {
        source.selected.splice(index, 1);
      }

      source.grid.deselect(feature.properties);

      self.removeFilterLayerFeaturePopup(key, feature);

      self.map.setFeatureState({source : key, id : feature.id }, {selected : false });

    });

    self.updateFilterLayerControllerSelection(key);
  }

  removeFilterLayerFeaturePopup(key, feature) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var popups = source.popups.filter(p => {
        return p.properties._id == feature.id;
    });

    popups.forEach(p => {
      p.remove();
    });
  }

  addFilterLayerFeaturePopup(key, feature, location) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var properties = feature.properties;
    var types = source.types;
    var state = self.map.getFeatureState({source : key, id : feature.id });
    var lst = document.createElement("div");

    if (location === undefined || location === null) {
      if (types.includes("MultiPolygon")) {
        location = feature.geometry.coordinates[0][0][0];

      } else if (types.includes("Polygon") || types.includes("MultiLineString")) {
        location = feature.geometry.coordinates[0][0];

      } else if (types.includes("LineString")) {
        location = feature.geometry.coordinates[0];

      } else if (types.includes("Point")) {
        location = feature.geometry.coordinates;
      }
    }

    var header = document.createElement("div");
    header.innerHTML = key;
    header.classList.add("popup-header");
    header.id = key;
    lst.appendChild(header);

    var content = document.createElement("div");
    content.classList.add("popup-content");
    lst.appendChild(content);

    if (!state.selected) {

      var keys = document.createElement("div");
      keys.classList.add("property-keys");

      var values = document.createElement("values");
      values.classList.add("property-values");

      content.appendChild(keys);
      content.appendChild(values);

      Object.keys(properties).forEach(property => {

        if (source.hidden.includes(property)) {
          return;
        }

        var keyv = document.createElement("div");
        keyv.classList.add("popup-prop");
        keyv.innerHTML = property;

        var valv = document.createElement("div");
        valv.classList.add("popup-value");
        valv.innerHTML = properties[property];

        keys.appendChild(keyv);
        values.appendChild(valv);

      });

      var popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false
      });

      popup.setLngLat(location)
        .setHTML(lst.innerHTML)
        .addTo(self.map);

      popup.properties = properties; // NOTE - this is to find it later ---

      source.popups.push(popup);

      popup._content.addEventListener("mouseenter", function(e) {

        source.coords.highlight([properties]); // highlight only the hovered popup feature ---
        popup._content.parentNode.parentNode.appendChild(popup._content.parentNode);

      });

      popup._content.addEventListener("mouseleave", function(e) {

        self.updateFilterLayerControllerSelection(key);
      });

      var parent = d3.select(popup._content.parentNode)[0][0];
      var header = d3.select(popup._content).select(".popup-header")[0][0];

      var dstyle = parent.style.transform.split("translate");
      var dtranslate = dstyle[dstyle.length -1].replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '', "").replace(/px/g, "").split(" ");

      var dtx = +dtranslate[0];
      var dty = +dtranslate[1];

      var indicator = document.createElement("div");
      indicator.classList.add("popup-indicator");
      popup._content.parentNode.parentNode.appendChild(indicator);

      var pointer = null;

      self.map.on("move", function(e) {

        dstyle = parent.style.transform.split("translate");
        dtranslate = dstyle[dstyle.length -1].replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '', "").replace(/px/g, "").split(" ");

        dtx = +dtranslate[0];
        dty = +dtranslate[1];

        if (indicator) {
          indicator.parentNode.removeChild(indicator);
          indicator = null;
        }

        if (pointer) {
          pointer.parentNode.removeChild(pointer);
          pointer = null;
        }
      })

      header.addEventListener("mousedown", function(e) {

        parent.style["transition-timing-function"] = "ease-in-out";
        parent.style["transition-duration"] = ".01s";
        parent.style["transition-delay"] = ".01s";

        var mx = e.clientX;
        var my = e.clientY;

        var style = parent.style.transform.split("translate");
        var translate = style[style.length -1].replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '', "").replace(/px/g, "").split(" ");
        var direction = style[style.length -2];

        var tx = +translate[0];
        var ty = +translate[1];

        if (!indicator) {
          indicator = document.createElement("div");
          indicator.classList.add("popup-indicator");
          popup._content.parentNode.parentNode.appendChild(indicator);
        }

        if (!pointer) {
          pointer = document.createElement("div");
          pointer.classList.add("popup-pointer");
          pointer.classList.add("collapsed");
          popup._content.parentNode.parentNode.appendChild(pointer);

          pointer.style.top = (ty - 5) + "px";
          pointer.style.left = (tx  - 5) + "px";
        }

        var mousemove = function(e) {

          var dx = e.clientX - mx;
          var dy = e.clientY - my;
          var factor = 1;

          if(self.areKeysDown(["Control"])) {
            factor = 50;
          };

          var sdx = Math.ceil((tx + dx)/factor)*factor;
          var sdy = Math.ceil((ty + dy)/factor)*factor;

          parent.style.transform = "translate" + direction + "translate("+ sdx + "px, " + sdy + "px)";

          indicator.style.left = d3.min([sdx, dtx]) + "px";
          indicator.style.top = d3.min([sdy, dty]) + "px";
          indicator.style.width = Math.abs(sdx - dtx) + "px";
          indicator.style.height = Math.abs(sdy - dty) + "px";

          if (sdx < dtx) {
            indicator.style["border-left"] = "2px dashed black";
            indicator.style["border-right"] = "";
          } else {
            indicator.style["border-left"] = "";
            indicator.style["border-right"] =  "2px dashed black";
          }

          if (sdy < dty) {
            indicator.style["border-bottom"] = "2px dashed black";
            indicator.style["border-top"] = "";
          } else {
            indicator.style["border-bottom"] = "";
            indicator.style["border-top"] =  "2px dashed black";
          }

          if (Math.abs(sdy - dty) > 5 || Math.abs(sdx - dtx) > 5) {
            if (pointer) {
              if (pointer.classList.contains("collapsed")) {
                pointer.classList.remove("collapsed");
              }
            }
          } else {
            if (pointer) {
              if (!pointer.classList.contains("collapsed")) {
                pointer.classList.add("collapsed");
              }
            }
          }
        }

        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", function(e) {
          document.removeEventListener("mousemove", mousemove);

          parent.style["transition-duration"] = "";
          parent.style["transition-delay"] = "";
        });

      });

      popup.on('close', function() {

        source.popups.splice(source.popups.indexOf(popup), 1);

        self.deselectFeature(key, popup.properties);

        if (indicator) {
          indicator.parentNode.removeChild(indicator);
          indicator = null;
        }

        if (pointer) {
          pointer.parentNode.removeChild(pointer);
          pointer = null;
        }
      });

    }
  }

  addFilterLayerSheet(key, element) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    source.grid = d3.divgrid(source, self)(element)

    self.updateFilterLayerSheet(key);

    return source.grid;
  }

  updateFilterLayerSheet(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.grid === null) {
      return;
    }

    var properties = self.getSourceKeyProperties(key, true, false);
    //properties.splice(0,0, "_id");

    var data = source.brushed.length === 0 || source.bru ? source.coords.data() : source.brushed;

    source.grid.data(data)
      .columns(properties)
      .render();
  }

  addFilterLayerController(key, element) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var values = [];

    source.values.forEach(value => {

        var keep = true;

        Object.keys(source.filters).forEach(filter => {

            if (source.filters[filter](value)) {
              keep = false;
            }
        });

        if (keep) {
          values.push(value);
        }
    });

    source.coords = d3.parcoords()(element, key + "-pc")
        .data(values)
        .hideAxis(source.hidden)
        .color(function(d) { return "#000000"; })
        .alpha(0.05)
        //.composite("darken")
        .margin({ top: 30, left: 30, bottom: 60, right: 15})
        .mode("queue")
        .brushMode("1D-axes")
        //.reorderable()
        .on("brushend", function(d, a) {

          source.brushed = d;

          self.updateFilterLayerSheet(key);
          self.updateFilterLayer(key);
          self.updateLegend();
        })
        .render();

    function findAxes(testPt, cenPts){
    	// finds between which two axis the mouse is
    	var x = testPt[0];
    	var y = testPt[1];

    	// make sure it is inside the range of x
    	if (cenPts[0][0] > x) return false;
    	if (cenPts[cenPts.length-1][0] < x) return false;

    	// find between which segment the point is
    	for (var i=0; i<cenPts.length; i++){
    		if (cenPts[i][0] > x) return i;
    	}
    }

    function isOnLine(startPt, endPt, testPt, tol){
    	// check if test point is close enough to a line
    	// between startPt and endPt. close enough means smaller than tolerance
    	var x0 = testPt[0];
    	var	y0 = testPt[1];
    	var x1 = startPt[0];
    	var	y1 = startPt[1];
    	var x2 = endPt[0];
    	var	y2 = endPt[1];
    	var Dx = x2 - x1;
    	var Dy = y2 - y1;
    	var delta = Math.abs(Dy*x0 - Dx*y0 - x1*y2+x2*y1)/Math.sqrt(Math.pow(Dx, 2) + Math.pow(Dy, 2));
    	//console.log(delta);
    	if (delta <= tol) return true;
    	return false;
    }

      // Add highlight for every line on click
    function getCentroids(data){
    	// this function returns centroid points for data. I had to change the source
    	// for parallelcoordinates and make compute_centroids public.
    	// I assume this should be already somewhere in graph and I don't need to recalculate it
    	// but I couldn't find it so I just wrote this for now
    	var margins = source.coords.margin();
    	var graphCentPts = [];

    	data.forEach(function(d){

    		var initCenPts =  source.coords.compute_centroids(d).filter(function(d, i){return i%2==0;});

    		// move points based on margins
    		var cenPts = initCenPts.map(function(d){
    			return [d[0] + margins["left"], d[1]+ margins["top"]];
    		});

    		graphCentPts.push(cenPts);
    	});

    	return graphCentPts;
    }

    function getActiveData(){
    	// I'm pretty sure this data is already somewhere in graph
    	if (source.coords.brushed()!=false) return source.coords.brushed();
      return []; // -- need to make sure if there are no filtered elements there is no selection ---
      //return source.coords.data();
    }

    function getClickedLines(mouseClick){
        var unclicked = [];
        var clicked = [];
        var clickedCenPts = [];
        var clickedTolerance = 2;

    	// find which data is activated right now
    	var activeData = getActiveData();

    	// find centriod points
    	var graphCentPts = getCentroids(activeData);

      if (graphCentPts.length==0) return false;

  	// find between which axes the point is
      var axeNum = findAxes(mouseClick, graphCentPts[0]);
      if (!axeNum) return false;

      graphCentPts.forEach(function(d, i){
  	    if (isOnLine(d[axeNum-1], d[axeNum], mouseClick, clickedTolerance)){
  	    	clicked.push(activeData[i]);
  	    	clickedCenPts.push(graphCentPts[i]); // for tooltip
  	    } else {
          unclicked.push(activeData[i]);
        }
    	});

    	return [clicked, clickedCenPts, unclicked];
    }

    function highlightLineOnClick(mouseClick, drawTooltip){

      var clickMax = 1;
    	var clicked = [];
      var clickedCenPts = [];
    	var clickedData = getClickedLines(mouseClick);
      var unclicked = [];


    	if (clickedData && clickedData[0].length!=0){

    		clicked = clickedData[0];
      	clickedCenPts = clickedData[1];
        unclicked = clickedData[2];

  	    // highlight clicked line

        var highlight = source.selected.slice();

        clicked.forEach((element, i) => {

          if (i < clickMax) {

            highlight.push(element);
            self.map.setFeatureState({source : key, id : element._id }, {hover : true } );

          } else {

            self.map.setFeatureState({source : key, id : element._id }, {hover : false } );
          }

        });

        unclicked.forEach(element => {
          self.map.setFeatureState({source : key, id : element._id }, {hover : false } );
        });

        source.coords.highlight(highlight);
    	}
    };

    function unhighlightLine() {

      var highlight = source.selected.slice();

      source.coords.data().forEach(element => {
        self.map.setFeatureState({source : key, id : element._id }, {hover : false } );
      });

      source.coords.highlight(highlight);

    }

    //// end hover event -----

    return source.coords;
  }

  updateFilterLayerControllerSelection(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    source.coords.highlight(source.selected);
  }

  updateFilterLayer(key, clear) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var filter = ['in', '_id'];

    if (!clear /* && (source.brushed.length !== source.values.length ) */) { // NOTE - turn on for init with filter ---

      source.brushed.forEach(d => {
        filter.push(d._id);
      });

    } else {  // NOTE - turn off for init with  filter ---

      var values = [];

      source.values.forEach(value => {

          var keep = true;

          Object.keys(source.filters).forEach(filter => {

              if (source.filters[filter](value)) {
                keep = false;
              }
          });

          if (keep) {
            filter.push(value._id);
          }
      });
    }

    self.map.setFilter(key + '-base', filter); // NOTE - trying to speed it up ---
    self.map.setFilter(key + '-filter', filter);

    var selected = source.selected.slice();

    selected.forEach(data => {
      self.deselectFeature(key, data);
    });

    self.updateFilterLayerControllerSelection(key);
  }

  updateFilterLayerProperties(key, property, visible) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var index = source.hidden.indexOf(property);

    if (!visible && index == -1) {
      source.hidden.push(property);

    } else if (visible && index >= 0) {
      source.hidden.splice(index, 1);
    }

    self.updateFilterLayer(key, true);

    if (source.coords !== null) {
      source.coords.hideAxis(source.hidden).render().updateAxes();
    }

    source.active = null;
    source.brushed = [];

    source.selected.forEach(data => {
      self.deselectFeature(key, data);
    });

    self.updateFilterLayerController(key);
    self.updateFilter(key);
    self.updateLegend();
  }

  addFilters(key, filters) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var active = source.active;

    filters.forEach(f => {
      source.filters[f.filterKey] = f.filter;
    });

    self.updateFilterLayerController(key);
    self.updateFilterLayer(key, true);
    self.updateFilterLayerPropertyStops(key);
    self.updateFilter(key);

    if (active != null) {
      self.selectFilterLayerProperty(key, active);
    }

    self.updateLegend();
  }

  removeFilter(key, filterKey) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var active = source.active;

    if (source.filters[filterKey] !== undefined) {
      delete source.filters[filterKey];
    }

    self.updateFilterLayerController(key);
    self.updateFilterLayer(key, true);
    self.updateFilterLayerPropertyStops(key);
    self.updateFilter(key);

    if (active != null) {
      self.selectFilterLayerProperty(key, active);
    }

    self.updateLegend();
  }

  updateFilter(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source == null) {
      return;
    }

    var filters = Object.keys(source.filters);

    filters.forEach(filterKey => {

      var dimension = d3.selectAll(".dimension")[0]
        .filter(function(d) { return d.__data__ === filterKey; })[0];

      if (dimension == undefined) {
        return;
      }

      var background =  d3.select(dimension)
         .select(".brush")[0][0];

      background.classList.add("zoom");

    });

  }

  updateFilterLayerController(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var values = [];

    source.values.forEach(value => {

        var keep = true;

        Object.keys(source.filters).forEach(filter => {

            if (source.filters[filter](value)) {
              keep = false;
            }
        });

        if (keep) {
          values.push(value);
        }
    });

    source.coords
      .data(values)
      .color("#000000")
      .alpha(0.05)
      .render()
      .updateAxes();

    self.updateFilterLayerSheet(key);
    self.updateFilterLayerMapPaintProperties(key, null);

    source.coords.selection.selectAll(".label")[0].forEach(other => {
      other.classList.remove("selected");
    });

    source.coords.selection.selectAll("foreignObject").remove();

    source.coords.selection.selectAll(".label")[0].forEach(function(l) {

        if (l.hasEventListener) {
          return; // Note - only one listener per label ---
        }

        l.hasEventListener = true;

        l.addEventListener("click", function(e) {

          var property = l.innerHTML; // NOTE - this is the selection ---
          self.selectFilterLayerProperty(key, property);

        });
    });
  }

  selectFilterLayerProperty(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var state = source.states[property];

    if (state === undefined || state === null) {
      return;
    }

    var l = null;

    source.coords.selection.selectAll(".label")[0].forEach(label => {
       if (label.innerHTML === property) {
         l = label;
       }
     });

     if (l === null) {
       return;
     }

    source.coords.selection.selectAll("foreignObject").remove();

    var form = d3.select(l.parentNode.parentNode).append("foreignObject");
    var input = form
        .attr({
            "x": -55,
            "y": -50,
            "height": 20,
            "width": 110,
            //"style" : "border : 1px solid grey; "
        })
        .append("xhtml:div")
        .attr("class", "axis-menu")[0][0];

    var extrudeImg = document.createElement("img");
    extrudeImg.classList.add("axis-menu-img");
    extrudeImg.src = "img/cube-icon.png";

    var extrudeButton = document.createElement("div");
    extrudeButton.classList.add("axis-menu-item");
    extrudeButton.appendChild(extrudeImg);

    if ((!source.types.includes("Polygon") && !source.types.includes("MultiPolygon")) || state.propertyType !== "number") {
      extrudeImg.classList.add("disabled");
    } else {
      extrudeButton.title = "Extrude";
      extrudeButton.addEventListener("click", e => {
        console.log("extrude");
      });
    }

    var reverseImg = document.createElement("img");
    reverseImg.classList.add("axis-menu-img");
    reverseImg.src = "img/split-icon.png";
    if (state.propertyReversed) {
      reverseImg.classList.add("selected");
    } else {
      reverseImg.classList.remove("selected");
    }

    var reverseButton = document.createElement("div");
    reverseButton.classList.add("axis-menu-item");

    reverseButton.appendChild(reverseImg);

    if (state.propertyType !== "number") {
      reverseImg.classList.add("disabled");
    } else {
      reverseButton.title = "Reverse";
      reverseButton.addEventListener("click", e => {
        console.log("reverse");
        state.propertyReversed = !state.propertyReversed;

        if (state.propertyReversed) {
          reverseImg.classList.add("selected");
        } else {
          reverseImg.classList.remove("selected");
        }

        var active = source.active;

        source.brushed = [];

        self.updateFilterLayerController(key);
        self.updateFilterLayer(key, true);
        self.updateFilterLayerPropertyStops(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectFilterLayerProperty(key, active);
        }

      });
    }

    var colorImg = document.createElement("img");
    colorImg.classList.add("axis-menu-img");
    colorImg.src = "img/edit-icon.png";

    var colorButton = document.createElement("div");
    colorButton.classList.add("axis-menu-item");
    colorButton.title = "Color";
    colorButton.appendChild(colorImg);
    colorButton.addEventListener("click", e => {
      console.log("color");

      var f = 1;
      var d = 5;
      var x = Math.round((e.clientX - d)/f)*f;
      var y = Math.round((e.clientY - d)/f)*f;

      var colorBox = document.createElement("div");
      colorBox.classList.add("color-box");
      colorBox.style.top = y + "px";
      colorBox.style.left = x + "px";

      Object.keys(colorbrewer).forEach(styleKey => {

        var colorRangeKeys = Object.keys(colorbrewer[styleKey]);
        var colorRange = colorbrewer[styleKey][colorRangeKeys[colorRangeKeys.length -1]];

        var colorRangeBox = document.createElement("div");
        colorRangeBox.classList.add("color-range-box");

        colorRange.forEach(color => {

          var colorRangeBlock = document.createElement("div");
          colorRangeBlock.classList.add("color-range-block");
          colorRangeBlock.style.background = color;

          colorRangeBox.appendChild(colorRangeBlock);
        });

        colorRangeBox.addEventListener("click", e => {
          console.log(state);

          state.propertyStyle = colorRange;

          var active = source.active;

          source.brushed = [];

          self.updateFilterLayerController(key);
          self.updateFilterLayer(key, true);
          self.updateFilterLayerPropertyStops(key);
          self.updateFilter(key);

          if (active != null) {
            self.selectFilterLayerProperty(key, active);
          }

          colorBox.remove();
          e.preventDefault();
        });

        colorBox.appendChild(colorRangeBox);
      });

      colorBox.addEventListener("mouseleave", e=> {
        colorBox.remove();
      })

      document.body.appendChild(colorBox);

    });

    var zoomInImg = document.createElement("img");
    zoomInImg.classList.add("axis-menu-img");
    zoomInImg.src = "img/plus-icon.png";

    var zoomInButton = document.createElement("div");
    zoomInButton.classList.add("axis-menu-item");
    zoomInButton.appendChild(zoomInImg);

    if (state.propertyType !== "number") {
      zoomInImg.classList.add("disabled");
    } else {
      zoomInButton.title = "Zoom into";
      zoomInButton.addEventListener("click", e => {

        console.log("zoom in");

        var a = property;

        var dimensions = source.coords.selection.selectAll(".dimension")[0];
        var extent = d3.select(dimensions.filter(function(d) { return d.__data__ === a; })[0]).select(".extent");
        var bounds = source.coords.brushExtents()[a];

        if (bounds === undefined) {
          return;
        }

        var filter = {
          filterKey : a,
          filter : (value) => {
              return value[a] >= bounds[1] || value[a] <= bounds[0];
          }
        };

        state.propertyClamp = bounds;

        self.addFilters(key, [filter]);
        e.stopPropagation();

        var domain = source.coords.dimensions()[a].yscale.domain();
        var extents = source.coords.brushExtents();

        extents[a] = domain;

        source.coords.brushExtents(extents);

      });
    }

    var zoomOutImg = document.createElement("img");
    zoomOutImg.classList.add("axis-menu-img");
    zoomOutImg.src = "img/minus-icon.png";

    var zoomOutButton = document.createElement("div");
    zoomOutButton.classList.add("axis-menu-item");
    zoomOutButton.appendChild(zoomOutImg);

    if (state.propertyType !== "number") {
      zoomOutImg.classList.add("disabled");
    } else {
      zoomOutButton.title = "Zoom out";
      zoomOutButton.addEventListener("click", e => {

        if (state.propertyClamp === undefined || state.propertyClamp === null) {
          return;
        }

        console.log("zoom out");

        var a = property;

        source.brushed  = [];
        state.propertyClamp = null;

        self.removeFilter(key, a);

      });
    }

    input.appendChild(extrudeButton);
    input.appendChild(reverseButton);
    input.appendChild(colorButton);
    input.appendChild(zoomInButton);
    input.appendChild(zoomOutButton);

    var color = "#000000";
    var interval = state.propertyClamp !== undefined && state.propertyClamp !== null ? state.propertyClamp : state.propertyRange;
    var func = d3.scale.quantile().domain(interval).range(state.propertyStops.map(d => { return d[1]; }));

    if (state.propertyType === "string") {

      func = function(property) {
        for (var i = 0; i<state.propertyStops.length; i++) {
          if (state.propertyStops[i][0] === property) {
            return state.propertyStops[i][1];
          }
        }

        return "grey";
      }
    }

    source.coords.selection.selectAll(".label")[0].forEach(other => {
      if (other.innerHTML !== property) {
        other.classList.remove("selected");
      }
    });

    if (l.classList.contains("selected")) {
      l.classList.remove("selected");
      form.remove();
      source.active = null;
      property = null;

    } else {
      l.classList.add("selected");
      source.active = property;
      color = function(d) { return func(d[property]); };
    }

    source.coords
      .color(color)
      .alpha(0.05)
      .render();

    if (source.grid) {
      source.grid.render();
    }

    self.updateFilterLayerControllerSelection(key);
    self.updateFilterLayerMapPaintProperties(key, property);
    self.updateLegend();
  }

  updateFilterLayerMapPaintProperties(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var paintProperties = [];

    if (property === undefined || property === null) {

      if (source.types.includes("LineString") || source.types.includes("MultiLineString")) {

        paintProperties.push({
          id : key + "-filter",
          type : "line-color",
          paint : "#616161"
        });

      } else  if (source.types.includes("Polygon") || source.types.includes("MultiPolygon") ) {

        paintProperties.push({
          id : key + "-filter",
          type :"fill-extrusion-color",
          paint : [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#000000",
            ["boolean", ["feature-state", "selected"], false],
            "#000000",
            "#616161"
            ],
        });


      } else if (source.types.includes("Point")) {

        paintProperties.push({
          id : key + "-filter",
          type :"circle-color",
          paint : "#616161",
        });

      }

    } else {

      var state = source.states[property];
      var stops = state.propertyStops;
      var ival = state.propertyInterval;
      var min = 2;
      var max = 10;
      var paint;

      if (state.propertyType === "number") {

        paint =  {
          property : property,
          type : "interval",
          stops : stops.slice(),
        }

      } else if (state.propertyType === "string") {

        paint = [
          'match',
          ['get', property]
        ];

        for (var i = 0; i<state.propertyStops.length; i++) {
          paint.push(state.propertyStops[i][0].toString());
          paint.push(state.propertyStops[i][1]);
        }

        paint.push("grey"); // default color - TODO - find a better color ---

      } else {

        alert("uknown property type " + state.propertyType);
      }

      if (source.types.includes("LineString") || source.types.includes("MultiLineString")) {

        paintProperties.push({
          id : key + "-filter",
          type : "line-color",
          paint : paint,
        });

        // paintProperties.push({
        //   id : key + "-filter",
        //   type : 'line-width',
        //   paint : [ "+", min, [ "*", max, ["/", ["-", ['get', property], ival[0]] , ival[1] - ival[0]]]]
        // });

      } else  if (source.types.includes("Polygon") || source.types.includes("MultiPolygon") ) {

        paintProperties.push({
          id : key + "-filter",
          type :"fill-extrusion-color",
          paint : paint
        });

      } else if (source.types.includes("Point")) {

        paintProperties.push({
          id : key + "-filter",
          type :"circle-color",
          paint : paint
        });

        paintProperties.push({
          id : key + "-filter",
          type :"circle-radius",
          paint : [ "+", min, [ "*", max, ["/", ["-", ['get', property], ival[0]] , ival[1] - ival[0]]]]
        });

      }

    }

    paintProperties.forEach(paintProperty => {
      map.setPaintProperty(paintProperty.id, paintProperty.type, paintProperty.paint);
    });

  }

  updateFilterLayerPropertyStops(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    source.active = null;

    Object.keys(source.states).forEach(property => {

      var state = source.states[property];
      var style = state.propertyStyle.slice();

      if (state.propertyReversed) {
        style.reverse();
      }

      if (state.propertyType === "number") {

        if (state.propertyClamp !== undefined && state.propertyClamp !== null) {

          var nstops = [];

          for (
            var i = state.propertyClamp[0], j=0;
            j < style.length;
            i += (state.propertyClamp[1] - state.propertyClamp[0]) / style.length, j++) {

              nstops.push([i, style[j]]);
          }

          state.propertyRange = [state.propertyClamp[0], state.propertyClamp[1]];
          state.propertyStops = nstops;

        } else {

          var nstops = [];
          var nMin = null;
          var nMax = null;

          if (source.coords.data().length > 0) {
            source.coords.data().forEach(d => {
              if (nMin === null || d[property] < nMin) {
                nMin = d[property];
              }
              if (nMax === null || d[property] > nMax) {
                nMax = d[property];
              }
            })
          } else {
            nMin = state.propertyInterval[0];
            nMax = state.propertyInterval[1];
          }

          for (
            var i = nMin, j=0;
            j < style.length;
            i += (nMax - nMin) / style.length, j++) {

              nstops.push([i, style[j]]);
          }

          state.propertyRange = [nMin, nMax];
          state.propertyStops = nstops;
        }

      } else if (state.propertyType === "string") {

         var nstops = [];

        for (var i = 0; i<state.propertyCategories.length; i++) {
          nstops.push([state.propertyCategories[i], style[i % style.length]])
        }

        state.propertyStops = nstops;

      } else {

        // TODO ---
      }

    });


  }

  getBins(key) {

    var self = this;
    var source = self.sources[key];
    var bins = [];

    if (source === undefined || source === null) {
      return bins;
    }

    var property = source.active;
    var data = source.brushed;
    var state = source.states[property];

    if (property === undefined || property === null ) {
      return bins;
    }

    if (data.length === 0) {
      data = source.coords.data();
    }

    if (state.propertyType === "number") {

      state.propertyStops.forEach((s, i) => {

        bins.push({
          value : parseFloat(Math.round(s[0] * 100) / 100).toFixed(2),
          data : [],
          count : 0,
          index : i,
          min : null,
          max : null,
          perc : 0,
          valid : true
        });

      });

     // if (data.length !== source.values.length) { // NOTE - turn on for init with filter ---

        data.forEach(d => {

          var index = 0;

          for (var i = 0; i < bins.length ; i++) {

            if (bins[i].value > d[property]) {
              break;
            }

            index = i;
          }

          bins[index].count+=1;
          bins[index].perc = bins[index].count / data.length;
          bins[index].data.push(d);

          if (bins[index].min == null || bins[index].min > d[property]) {
            bins[index].min = d[property];
          }

          if (bins[index].max == null || bins[index].max < d[property]) {
            bins[index].max = d[property];
          }

        });

      //}

    } else if (state.propertyType === "string") {

      state.propertyStops.forEach((s, i) => {

        var valid = true;

        Object.keys(source.filters).forEach(filter => {

          var temp = {};
          temp[property] = s[0];

          if (source.filters[filter](temp)) {
            valid = false;
          }

        });


        bins.push({
          value : s[0].toString(),
          data : [],
          count : 0,
          index : i,
          perc : 0,
          valid : valid
        });

      });

      // if (data.length !== source.values.length) { // NOTE - turn on for init with filter ---

        data.forEach(d => {

          var index = 0;

          for (var i = 0; i < bins.length ; i++) {

            index = i;

            if (bins[i].value === d[property]) {
              break;
            }

          }

          bins[index].count+=1;
          bins[index].perc = bins[index].count / data.length;
          bins[index].data.push(d);

        });
      //}

    } else {

      // TODO ---
    }

    return bins;

  }

  addLegend(element) {
    this.legend = element;
  }

  updateLegend() {

    var self = this;
    var legend = self.legend;

    if (legend === undefined || legend === null) {
      return; // NOTE - legend has not been set ---
    }

    legend.innerHTML = "";

    Object.keys(self.sources).forEach(s => {

        var source = self.sources[s];

      //  console.log(source);

        if (source.active && source.visible) {

          var legend = self.legend;

          var div = document.createElement("div");
          div.classList.add("legend-div");

          var header = document.createElement("div");
          header.classList.add("legend-header");

          var content = document.createElement("div");
          content.classList.add("legend-content");

          var hkey = document.createElement("div");
          hkey.classList.add("legend-header-key");
          hkey.innerHTML = s;

          hkey.addEventListener("click", e => {
            content.classList.toggle("collapsed");
          })

          var hprop = document.createElement("div");
          hprop.classList.add("legend-header-property");
          hprop.innerHTML = source.active;;

          header.appendChild(hkey);
          header.appendChild(hprop);

          div.appendChild(header);
          div.appendChild(content);

          legend.appendChild(div);

          var state = source.states[source.active];
          var bins = self.getBins(s)

          var contentBars = document.createElement("div");
          contentBars.classList.add("legend-content-bars");

          var contentHist = document.createElement("div");
          contentHist.classList.add("legend-content-hist");

          content.appendChild(contentHist);
          content.appendChild(contentBars);

          for (var i = 0; i< state.propertyStops.length; i++) {

            if (bins[i].valid === false) {
              continue;
            }

            var item = document.createElement("div");
            item.classList.add("legend-item");

            var bar = document.createElement("div");
            bar.classList.add("legend-color");
            bar.style.background = state.propertyStops[i][1];
            bar.style.width = (bins[i].perc * 100) + "px";

            var color = document.createElement("div");
            color.classList.add("legend-color");
            color.style.background = state.propertyStops[i][1];

            var value = document.createElement("div");
            value.classList.add("legend-value");

            if (state.propertyType === "number") {

              var start = parseFloat(Math.round(state.propertyStops[i][0] * 100) / 100).toFixed(2);
              var end  = i == state.propertyStops.length - 1 ? null : parseFloat(Math.round(state.propertyStops[i + 1][0] * 100) / 100).toFixed(2);

              if (end !== null) {
                value.innerHTML = start + " to " + end;
              } else {
                value.innerHTML = " < " + start;
              }

            } else if (state.propertyType === "string") {

              value.innerHTML = state.propertyStops[i][0].toString();

            } else {

              value.innerHTML = state.propertyStops[i][0];
            }

            contentBars.appendChild(item);

            item.appendChild(color);
            //item.appendChild(bar);
            item.appendChild(value);
          }

          var bars = [];

          bins.forEach(bin => {
            if (bin.valid) {
              bars.push(bin);
            }
          });


          var element = document.createElement("div");
          element.classList.add("legend-hist");

          contentHist.appendChild(element);

          var margin = {top: 4, right: 30, bottom: 10, left: 40},
              width = element.clientWidth - margin.left - margin.right,
              height = element.clientHeight - margin.top - margin.bottom;

          if (height <= 0) {
            height = 200 - margin.top - margin.bottom;
          }

          if (width <= 0) {
            width = 200 - margin.left - margin.right;
          }

          var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
          var y = d3.scale.linear().range([height, 0]);

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

          var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);

          var svg = d3.select(element).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

          x.domain(bars.map(function(d) { return d.value; }));
          y.domain([0, d3.max(bars, function(d) { return d.count; })]);

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
            .selectAll("text").remove();
              // .style("text-anchor", "end")
              // .attr("dx", "-.8em")
              // .attr("dy", "-.55em")
              // .attr("transform", "rotate(-90)" );

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            // .append("text")
            //   //.attr("transform", "rotate(-90)")
            //   .attr("y", -25)
            //   //.attr("x", 10)
            //   .attr("dy", ".71em")
            //   .style("text-anchor", "end")
            //   .text("count");

          svg.selectAll("bar")
              .data(bars)
            .enter().append("rect")
              .style("fill", function(d) { return  state.propertyStops[d.index][1]; })
              .style("opacity", 0.8)
              .attr("x", function(d) { return x(d.value); })
              .attr("width", x.rangeBand())
              .attr("y", function(d) { return y(d.count); })
              .attr("height", function(d) { return height - y(d.count); });


        }

    });

  }
}

// ---------------------------------------
// ---------------------------------------
// ---------------------------------------
// --------------------------------------- util

// functions from d3.parcoords for determining data

// a better "typeof" from this post: http://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable
function toType(v) {
  return ({}).toString.call(v).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

// try to coerce to number before returning type
function toTypeCoerceNumbers(v) {
  if ((parseFloat(v) == v) && (v != null)) {
	return "number";
}
  return toType(v);
};

// attempt to determine types of each dimension based on first row of data
function detectTypes(data) {
  var types = {};
  Object.keys(data[0])
    .forEach(function(col) {
      types[isNaN(Number(col)) ? col : parseInt(col)] = toTypeCoerceNumbers(data[0][col]);
    });
  return types;
};

// initial layer states ---


function buildGeoJsonPolygonBaseLayer(source) {
  return {

   id : source.source + '-base',
   source : source.source,
   type: 'line',
   filter : source.filtered,
   minzoom: 7,
   //maxzoom: 18,
   paint: {
     'line-opacity': [
         "interpolate", ["linear"], ["zoom"],
         7,  [
             "case",
             ["boolean", ["feature-state", "hover"], false],
             1,
             ["boolean", ["feature-state", "selected"], false],
             1,
             0
             ],
         20, 1
         ],
     'line-color' : [
                 "case",
                 ["boolean", ["feature-state", "hover"], false],
                 "#000000",
                 ["boolean", ["feature-state", "selected"], false],
                 "#000000",
                 "#ffffff"
                ],
    'line-width' :  [
        "interpolate", ["linear"], ["zoom"],
        7, 0,
        20,  [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            3,
            ["boolean", ["feature-state", "selected"], false],
            3,
            1
            ]
        ]
   }

 };
};

function buildGeoJsonPolygonFilterLayer(source, flat) {
  return {

   id : source.source + '-filter',
   source : source.source,
   type: 'fill-extrusion',
   filter : source.filtered,
   paint: {
     'fill-extrusion-color':  [
               "case",
               ["boolean", ["feature-state", "hover"], false],
               "#000000",
               ["boolean", ["feature-state", "selected"], false],
               "#000000",
               "#616161"
               ],
     'fill-extrusion-height': flat ? 0 : ["get", source.height],
     'fill-extrusion-base': flat ? 0 : ["get", source.base],
     'fill-extrusion-opacity': 0.8,
     'fill-extrusion-vertical-gradient' : true
   }

 };
};

function buildGeoJeonLineStringBaseLayer(source) {
  return  {

      id : source.source + '-base',
      source : source.source,
      type: 'line',
      minzoom: 7,
      filter : source.filtered,
      //maxzoom: 18,
      paint: {
        'line-blur': 0.5,
        'line-opacity': [
            "interpolate", ["linear"], ["zoom"],
            7, 0,
            20, 1
            ],
        'line-color' : [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    "#000000",
                    ["boolean", ["feature-state", "selected"], false],
                    "#000000",
                    "#ffffff"
                   ],
         'line-width' : [
                     "case",
                     ["boolean", ["feature-state", "hover"], false],
                     10,
                     ["boolean", ["feature-state", "selected"], false],
                     10,
                     0.5
                     ]
      }

  };
}

function buildGeoJsonLineStringFilterLayer(source) {
  return {

   id : source.source + '-filter',
   source : source.source,
   type: 'line',
   filter : source.filtered,
   paint: {
       'line-color' : "#616161",
       'line-width': [
           "interpolate", ["linear"], ["zoom"],
           10, 0.5,
           13, 2,
           20, 10,
       ],
       'line-blur': [
           "interpolate", ["linear"], ["zoom"],
           10, 0,
           20, 2
       ]
   }

 };
}


function buildGeoJsonPointBaseLayer(source) {
  return {

    id : source.source + '-base',
    source : source.source,
    type : "circle",
    minzoom : 0,
    filter : source.filtered,
    paint : {
        "circle-radius": 2,
        "circle-color": "rgba(100,100,100, 0.1)",
        "circle-stroke-width": 0,
        "circle-opacity": 1
    }

  };
}

function buildGeoJsonPointFilterLayer(source) {
  return {

    id : source.source + '-filter',
    source : source.source,
    type : "circle",
    filter : source.filtered,
    minzoom : 0,
    paint : {
        "circle-radius": 2,
        "circle-color": "#616161",
        "circle-stroke-width": 0,
        "circle-opacity": 1
    }

  };
}

function buildMapBoxDrawLayerStyle() {
  return [{
      'id': 'gl-draw-polygon-fill-inactive',
      'type': 'fill',
      'filter': ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
      ],
      'paint': {
          'fill-color': 'black', //#3bb2d0',
          'fill-outline-color': 'black', //#3bb2d0',
          'fill-opacity': 0, //0.1
      }
  },
  {
      'id': 'gl-draw-polygon-fill-active',
      'type': 'fill',
      'filter': ['all', ['==', 'active', 'true'],
          ['==', '$type', 'Polygon']
      ],
      'paint': {
          'fill-color': 'black', //'#fbb03b',
          'fill-outline-color': '#fbb03b',
          'fill-opacity': 0.1
      }
  },
  {
      'id': 'gl-draw-polygon-midpoint',
      'type': 'circle',
      'filter': ['all', ['==', '$type', 'Point'],
          ['==', 'meta', 'midpoint']
      ],
      'paint': {
          'circle-radius': 3,
          'circle-color': 'black', //'#fbb03b',
      }
  },
  {
      'id': 'gl-draw-polygon-stroke-inactive',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': 'black', //#3bb2d0',
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-polygon-stroke-active',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'true'],
          ['==', '$type', 'Polygon']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': 'black', //'#fbb03b',
          'line-dasharray': [0.2, 2],
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-line-inactive',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'false'],
          ['==', '$type', 'LineString'],
          ['!=', 'mode', 'static']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': 'black', //#3bb2d0',
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-line-active',
      'type': 'line',
      'filter': ['all', ['==', '$type', 'LineString'],
          ['==', 'active', 'true']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': 'black', //'#fbb03b',
          'line-dasharray': [0.2, 2],
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
      ],
      'paint': {
          'circle-radius': 5,
          'circle-color': '#fff'
      }
  },
  {
      'id': 'gl-draw-polygon-and-line-vertex-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
      ],
      'paint': {
          'circle-radius': 3,
          'circle-color': 'black', //'#fbb03b',
      }
  },
  {
      'id': 'gl-draw-point-point-stroke-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Point'],
          ['==', 'meta', 'feature'],
          ['!=', 'mode', 'static']
      ],
      'paint': {
          'circle-radius': 5,
          'circle-opacity': 1,
          'circle-color': '#fff'
      }
  },
  {
      'id': 'gl-draw-point-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Point'],
          ['==', 'meta', 'feature'],
          ['!=', 'mode', 'static']
      ],
      'paint': {
          'circle-radius': 3,
          'circle-color': 'black', //#3bb2d0',
      }
  },
  {
      'id': 'gl-draw-point-stroke-active',
      'type': 'circle',
      'filter': ['all', ['==', '$type', 'Point'],
          ['==', 'active', 'true'],
          ['!=', 'meta', 'midpoint']
      ],
      'paint': {
          'circle-radius': 7,
          'circle-color': '#fff'
      }
  },
  {
      'id': 'gl-draw-point-active',
      'type': 'circle',
      'filter': ['all', ['==', '$type', 'Point'],
          ['!=', 'meta', 'midpoint'],
          ['==', 'active', 'true']
      ],
      'paint': {
          'circle-radius': 5,
          'circle-color': 'black', //'#fbb03b',
      }
  },
  {
      'id': 'gl-draw-polygon-fill-static',
      'type': 'fill',
      'filter': ['all', ['==', 'mode', 'static'],
          ['==', '$type', 'Polygon']
      ],
      'paint': {
          'fill-color': '#404040',
          'fill-outline-color': '#404040',
          'fill-opacity': 0.1
      }
  },
  {
      'id': 'gl-draw-polygon-stroke-static',
      'type': 'line',
      'filter': ['all', ['==', 'mode', 'static'],
          ['==', '$type', 'Polygon']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': '#404040',
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-line-static',
      'type': 'line',
      'filter': ['all', ['==', 'mode', 'static'],
          ['==', '$type', 'LineString']
      ],
      'layout': {
          'line-cap': 'round',
          'line-join': 'round'
      },
      'paint': {
          'line-color': '#404040',
          'line-width': 2
      }
  },
  {
      'id': 'gl-draw-point-static',
      'type': 'circle',
      'filter': ['all', ['==', 'mode', 'static'],
          ['==', '$type', 'Point']
      ],
      'paint': {
          'circle-radius': 5,
          'circle-color': '#404040'
      }
  }];
}

function style(property) {

  var styles = {

    "default" :     colorbrewer.Viridis[10],
    "catchment" :   [ '#d74518', '#fdae61', '#5cb7cc', '#b7b7b7'],
    "category" :    colorbrewer.Paired[12],

  }

  var keys = Object.keys(styles);
  var key = keys[0];

  if (property in keys) {

    key = property;

  } else {

    for (var i = 0; i< keys.length; i++) {

      if (property.toLowerCase().indexOf(keys[i]) !== -1) {
        key = keys[i];
      }
    }
  }

  return styles[key];

}

function clean(object) {

  var clean = {};

  Object.keys(object).forEach(k => {

    var _k =  k.replace(/ /g, '_').replace(/\n/, '_');

    clean[_k] = object[k];

  });

  return clean;

}

function wrangle(data) {

  var wrangled = {
    data : data,
    properties : [],
    values : [],
    types : [],
    location : {
      center : [151.173,  -33.877]
    }
  }

  if (data.type === 'FeatureCollection') {

    var features = data.features;
    var properties = {};

    features.forEach((f, i) => {

      f.properties = clean(f.properties);

      var type = f.geometry.type;

      if (!(wrangled.types.includes(type))) {
        wrangled.types.push(type);
      }

      if (!("_id" in f.properties)) {
        f.properties["_id"] = i;
      }

      f.id = f.properties["_id"]; // geojson source specification ---

      //NOTE - for unit testing on all types ---

      var lat = 0;
      var lon = 0;

      switch (type) {

        case "MultiPolygon" :

          lon = f.geometry.coordinates[0][0][0][0];
          lat = f.geometry.coordinates[0][0][0][1];

          break;

        case "MultiLineString" :

          lon = f.geometry.coordinates[0][0][0];
          lat = f.geometry.coordinates[0][0][1];

          break;

        case "Polygon":

          lon = f.geometry.coordinates[0][0][0];
          lat = f.geometry.coordinates[0][0][1];

          break;

        case "LineString":

          lon = f.geometry.coordinates[0][0];
          lat = f.geometry.coordinates[0][1];

          break;

        case "Point":

          lon = f.geometry.coordinates[0];
          lat = f.geometry.coordinates[1];

          break;

        default:
          break;

      }

      f.properties['lat'] = lat;
      f.properties['lon'] = lon;

      Object.keys(f.properties).forEach(k => {

        if (f.properties[k] === null || f.properties[k] === undefined) {
          f.properties[k] = 0;
        }

        var value = f.properties[k];

        if (k in properties) {

          if (properties[k][0] >= value) {
            properties[k][0] = value;
          }

          if (properties[k][1] <= value) {
            properties[k][1] = value;
          }

        } else {

          properties[k] = [value, value];
        }

      });

      wrangled.values.push(f.properties);
    });

    Object.keys(properties).forEach(p => {

      if (properties[p][0] === null || properties[p][0] === undefined) {
        properties[p][0] = 0;
      }

      if (properties[p][1] === null || properties[p][1] === undefined) {
        properties[p][1] = 0;
      }

      wrangled.values.forEach(v => {

        if (!(p in v)) {
          v[p] = 0;
        }

      });

      wrangled.data.features.forEach(f => {
        if (!(p in f.properties)) {
          f.properties[p] = 0;
        }
      })

    });

    wrangled.properties = properties;
  }

  return wrangled;
}
