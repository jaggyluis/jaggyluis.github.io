import MapStyleBuilder from "./MapStyleBuilder.js";
import SSController from "./SSController.js";

import RadiusMode from "./RadiusMode.js";

const { MapboxLayer } = deck;

export default class MapController {

  constructor(map, options) {
    this.map = map;
    this.layers = {};
    this.sources = {};
    this.legend = null;
    this.keys = [];
    this.loading = false;
    this.cameras = {};
    this.container = map._container;
    this.envelope = [];
    this.styleBuilder = new MapStyleBuilder();
    this.options = {
      draw : options && options.draw === false ? false : true,
      camera : "default",
    };

    // older browsers
    if (!('remove' in Element.prototype)) {
      Element.prototype.remove = function() {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      };
    }

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

    document.addEventListener("keyup", function(e) {
      if (e.key === "Tab") {
        self.nextCamera();
      }
    })

    console.log(map);

    self.loader = document.getElementById("loader");

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

    // document.addEventListener('contextmenu', event => { // NOTE - this will disable all context menu on the page during loading - might be a bad idea
    //
    //   if (self.loading) {
    //     event.preventDefault();
    //   }
    //
    // });

    var StaticMode = {};

    // When the mode starts this function will be called.
    // The `opts` argument comes from `draw.changeMode('lotsofpoints', {count:7})`.
    // The value returned should be an object and will be passed to all other lifecycle functions
    StaticMode.onSetup = function(opts) {
      // var state = {};
      // state.count = opts.count || 0;
      // return state;
      this.setActionableState(); // default actionable state is false for all actions
      return {};
    };

    // Whenever a user clicks on the map, Draw will call `onClick`
    StaticMode.onClick = function(state, e) {
      // do nothing
    };

    // Whenever a user clicks on a key while focused on the map, it will be sent here
    StaticMode.onKeyUp = function(state, e) {
      // if (e.keyCode === 27) return this.changeMode('simple_select');
      // do nothing
    };

    // This is the only required function for a mode.
    // It decides which features currently in Draw's data store will be rendered on the map.
    // All features passed to `display` will be rendered, so you can pass multiple display features per internal feature.
    // See `styling-draw` in `API.md` for advice on making display features
    StaticMode.toDisplayFeatures = function(state, geojson, display) {
      display(geojson);
    };

    var modes = MapboxDraw.modes;

    if (options && options.draw === false) { // override all draw functionality with static ---
      Object.keys(modes).forEach(mode => {
        modes[mode] = StaticMode;
      })
    }

    var draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'static',
      controls: {
        polygon: options && options.draw === false ? false : true,
        trash: options && options.draw === false ? false : true
      },
      styles : self.styleBuilder.buildMapBoxDrawLayerStyle(),
      modes: Object.assign({
        static: StaticMode,
        radius: RadiusMode,
      }, modes),
    });

    self.map.dragRotate.disable();
    self.draw = draw;

    //map.addControl(new mapboxgl.NavigationControl({  showZoom: false, }));
    //map.addControl(new mapboxgl.ScaleControl());

    var controls = new SSController(options);
    controls.setMapController(self);
    self.controls = controls;

    map.addControl(controls);
    map.addControl(draw);

    function updateDraw(e) {

      console.log(e);

      if (e.type === "draw.update") {
        var centroids = e.features.filter(f => f.geometry.type === "Point" && f.properties.meta === "centroid");

        console.log(centroids);

        if (centroids.length) {
          self.draw.changeMode("radius", {centroidId : centroids[0].id});
          return;
        }
      }


      self.envelope = self.draw.getAll().features.filter(f => f.geometry.type === "Polygon");
      self.envelope.forEach(f => {
        if (!f.properties._kd) {
          f.properties._kd = "draw";
        }
      })

      Object.keys(self.sources).forEach(key => {

        var source = self.sources[key];
        var active = source.active;

        source.brushed = [];

        self.updateCoordsView(key);
        self.updateFilteredFeatures(key);
        self.updatePropertyStates(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectProperty(key, active);
        }

      });

      self.updateLegend();

    };

    map.on('draw.create', updateDraw);
    map.on('draw.delete', updateDraw);
    map.on('draw.update', updateDraw);
    map.on('draw.modechange', (e) => {
      //console.log(e);
    });
    map.on('draw.selectionchange', (e) => {

      var features = e.features;

      e.features.forEach(f => {
        if (f.properties.meta == "radius") {
          self.draw.changeMode("radius", {featureId : f.id});
        }
      })

    })

    if (options.draw !== false) {

      var drawControl = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn")[0].parentNode;

      var selectImg = document.createElement("img");
      selectImg.src = "img/mouse-icon.png";
      selectImg.classList.add("mapbox-custom-ctrl");
      selectImg.classList.add("inactive");

      var selectControl = document.createElement("button");
      selectControl.classList.add("mapboxgl-ctrl-icon");

      selectControl.type = "button";
      selectControl.title = "Select tool (s)";
      selectControl.appendChild(selectImg);
      selectControl.addEventListener("click", e => {
        if (self.draw.getMode() !== "static") {
          self.draw.changeMode("static");
          if (!selectImg.classList.contains("inactive")) {
            selectImg.classList.add("inactive");
          }
        } else {
          self.draw.changeMode('simple_select');
          selectImg.classList.remove("inactive");
        }
      });

      var radiusImg = document.createElement("img");
      radiusImg.src = "img/mapbox/circle-icon.svg";
      radiusImg.classList.add("mapbox-custom-ctrl");

      var radiusControl = document.createElement("button");
      radiusControl.classList.add("mapboxgl-ctrl-icon");
      radiusControl.type = "button";
      radiusControl.title = "Radius tool (r)";
      radiusControl.appendChild(radiusImg);
      radiusControl.addEventListener("click", e => {
        self.draw.changeMode('radius');
      });

      drawControl.insertBefore(selectControl, drawControl.childNodes[0]);
      drawControl.insertBefore(radiusControl, drawControl.childNodes[1]);

      self.map.addLayer({
        "id": "symbols-hot",
        "type": "symbol",
        "source": "mapbox-gl-draw-hot",
        "layout": {
            "symbol-placement": "line",
            //"text-font": ["Open Sans Regular"],
            "text-field": ["get", "datum"],
            "text-allow-overlap" : true,
            "text-ignore-placement" : true,
            "text-justify": "center",
            "text-max-width" : 1000,
            //"text-size": 32,
            "text-offset": [0, 0.3],
            "text-anchor": "top"
        },
        "paint": {}
      });
    }

    console.log(self.map.style.sourceCaches);
  }

  addCamera(key, camera) {
    if (!(key in this.cameras)) {
      this.cameras[key] = camera;
      console.log("added camera : " + key );
    }

    this.controls.fire("camera");
  }

  deleteCamera(key) {
    if (key in this.cameras) {
      delete this.cameras[key];
      console.log("deleted camera : " + key);
    }

    if (key === this.options.camera) {
      //this.options.camera = "default";
      this.nextCamera();
    }

    this.controls.fire("camera");
  }

  saveCamera(key) {

    function generateUID() { // https://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
        // I generate the UID from two parts here
        // to ensure the random number provide enough bits.
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    }

    var center = [this.map.getCenter().lng, this.map.getCenter().lat];
    var zoom = this.map.getZoom();
    var bearing = this.map.getBearing();
    var pitch = this.map.getPitch();

    var camera = {
      center : center,
      zoom : zoom,
      bearing : bearing,
      pitch : pitch,
      plan : !this.controls.isExtruded()
    }

    if (key == "default" || key == undefined || key == null) {
      key = "camera_" + generateUID();
    }

    if (key in this.cameras) {
      this.cameras[key] = camera;
      console.log("updated camera : " + key );
    } else {
      this.addCamera(key, camera);
    }

    this.options.camera = key;

    this.controls.fire("camera");

    return camera;
  }

  // nextCamera() {
  //
  //   var self = this;
  //
  //   var cameras = Object.keys(self.cameras);
  //   var camera = self.options.camera;
  //   var currIndex = cameras.indexOf(camera);
  //   var nexIndex = currIndex + 1;
  //
  //   if (nexIndex >= cameras.length) {
  //     nexIndex = 0;
  //   }
  //
  //   if (self.cameras[cameras[nexIndex]]) {
  //     self.toggleCamera(cameras[nexIndex], true);
  //   }
  //
  //   this.controls.fire("camera");
  // }

  nextCamera() {

    var self = this;

    var cameras = Object.keys(self.cameras);
    var camera = self.options.camera;
    var currIndex = cameras.indexOf(camera);
    var nexIndex = currIndex + 1;

    if (nexIndex >= cameras.length) {

      self.options.camera = "default";

    } else {

      if (self.cameras[cameras[nexIndex]]) {
        self.toggleCamera(cameras[nexIndex], true);
      }
    }

    this.controls.fire("camera");
  }

  getCameras() {
    return Object.keys(this.cameras);
  }

  getCamera() {
    return this.options.camera;
  }

  toggleCamera(key, animate) {

    var self = this;

    if (key in self.cameras) {
      self.options.camera = key;

      if (self.cameras[key].plan === true) {

        if (self.controls.isExtruded()) {
          self.controls.fire("toggle");
        }

      } else if (self.cameras[key].plan === false) {

        if (!self.controls.isExtruded()) {
          self.controls.fire("toggle");
        }

      } else {

        if (!self.controls.isExtruded()) {
          self.controls.fire("toggle");
        }
      }

      self.map.flyTo(Object.assign( { animate: animate || false, }, self.cameras[key] ));
      console.log("set camera : " +  key);

    } else if (key === "default") {
      self.options.camera = key;

    } else {
      console.log("camera not found : " + key);
    }

    this.controls.fire("camera");
  }

  setLoading(loading) {

    this.loading = loading;
    this.loadingOverride = loading;

    if (loading) {

      self.loader.classList.remove("collapsed");

    } else {

      if (!self.loader.classList.contains("collapsed")) {
        self.loader.classList.add("collapsed");
      }
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

  addBoundary(key, data, options) {

    // NOTE - ignore key and options for now ---
    // NOTE - need to write some type checks for this to make sure it only uses polygons - not sure what happens otherwise

    var self = this;

    if (data.crs) {
      delete data.crs; // bad data ---
    }

    if (data.type === 'FeatureCollection') {

      data.features.forEach((f,i) => {
        f.properties._id = i;
        f.properties._kd = key;
      });

    }

    self.draw.set(data);
    self.map.fire('draw.update');
  }

  getSourceData(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return [];
    }

    return source.coords.data();
  }

  addSource(key, data, options) {

    var t0= performance.now();
    console.log("call add source");

    function createPropertyStyle(property, propertyOptions) {

      if (propertyOptions && propertyOptions.color) {
        if (colorbrewer[propertyOptions.color]) {

          var colorKeys = Object.keys(colorbrewer[propertyOptions.color]);
          var colorKey = colorKeys[colorKeys.length -1]

          return colorbrewer[propertyOptions.color][colorKey];
        }
      }

      var styles = {
        "default" :     colorbrewer.Viridis[10],
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

    function createPropertyState(property, wrangled) {

      var propertyOptions = null;

      if (options.style && options.style.length) {
        options.style.forEach(style => {
          if (style.property === property) {
            propertyOptions = style;
          }
        });
      }

      var propertyStops = [];
      var propertyInterval = wrangled.properties[property];
      var propertyRange = [propertyInterval[0], propertyInterval[1]];
      var propertyStyle = createPropertyStyle(property, propertyOptions);

      for (var i = 0; i<  propertyStyle.length; i++) {
        propertyStops.push([propertyInterval[0] + ( i * ((propertyRange[1]-propertyRange[0]) /  propertyStyle.length) ), propertyStyle[i]]);
      }

      var propertyState = {
        propertyStops : propertyStops,
        propertyInterval : propertyInterval,
        propertyRange : propertyRange,
        propertyStyle : propertyStyle,
        propertyReversed : propertyOptions ? propertyOptions.reverse || false : false,
      };

      if (propertyOptions) {
        propertyState.propertyOptions = propertyOptions;
      }

      return propertyState;
    }

    var self = this;

    self.sources[key] = wrangle(data, options);
    self.sources[key].index = Object.keys(self.sources).length -1;
    self.sources[key].source = key;
    self.sources[key].states = {};
    self.sources[key].active = self.sources[key].options.active || null;
    self.sources[key].height = self.sources[key].options.height || "";
    self.sources[key].base = self.sources[key].options.base || "";
    self.sources[key].mapped = [];
    self.sources[key].visible = true;
    self.sources[key].xor = self.sources[key].options.boundary ? self.sources[key].options.boundary.xor || false : false;
    self.sources[key].boundaries = self.sources[key].options.boundary ? self.sources[key].options.boundary.filtered || null : null;
    self.sources[key].brushed = [];
    self.sources[key].coords = null;
    self.sources[key].grid = null;
    self.sources[key].filtered = ["in", "_id"];
    self.sources[key].hovered =  null;
    self.sources[key].hidden = [];
    self.sources[key].popups = [];
    self.sources[key].selected = [];
    self.sources[key].layers = {
      property :    [],
      interaction : [],
      clusters :    [],
    };
    self.sources[key].filters = {
      _default :   (value) => { return false; },
      _envelope :  (value) => {

          if (self.envelope.length > 0) {

            if (!value.lat || !value.lon) { // NOTE - for legend or bad values ---
              return false;
            }

            var pt = turf.point([value.lon, value.lat]);
            var filter = true;

            for (var i = 0; i< self.envelope.length; i++) {

              //if (self.envelope[i].properties._kd) {
                if (self.sources[key].boundaries && self.sources[key].boundaries.length) { // NOTE - empty boundary list filters all ---
                  if (!self.sources[key].boundaries.includes(self.envelope[i].properties._kd)) {
                    continue;
                  }
                }
              //}
              if (turf.booleanPointInPolygon(pt, self.envelope[i])) {
                filter = false;
                break;
              }
            }

            if (self.sources[key].xor) {
              filter = !filter;
            }

            return filter;

          }

          return false;
      }

    };

    console.log("globalState built " + (performance.now() - t0) + " milliseconds.");

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

    console.log("filters built " + (performance.now() - t0) + " milliseconds.");

    var properties = Object.keys(self.sources[key].properties);
    var propertyTypes = detectTypes(self.sources[key].values);

    console.log("types detected " + (performance.now() - t0) + " milliseconds.");

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
        propertyState.propertyStyle = createPropertyStyle("category", propertyState.propertyOptions || {});
        propertyState.propertyStops = [];

        for (var i = 0; i<propertyState.propertyCategories.length; i++) {
          propertyState.propertyStops.push([propertyState.propertyCategories[i], propertyState.propertyStyle[i % propertyState.propertyStyle.length]])
        }

      } else if (propertyState.propertyType === "number") {

        var total = 0;
        var count = 0;

        self.sources[key].values.forEach(value => {

          var f = value[property];

          total += f;
          count += 1;

        });

        propertyState.propertyAverage = count > 0 ? total / count : 0;
        propertyState.propertyRangeAverage = propertyState.propertyAverage;
        propertyState.propertyBrushedAverage = propertyState.propertyAverage;
        propertyState.propertyBrushedInterval = propertyState.propertyInterval;
      }

      self.sources[key].states[property] = propertyState;
      self.sources[key].hidden.push(property);

    });

    console.log("propertyStates built " + (performance.now() - t0) + " milliseconds.");

    if (Object.keys(self.sources).length === 1 && self.options.camera === "default") { // NOTE - only center once , or ignore if camera is set ---

      var base = turf.buffer(this.sources[key].data.features[0], 10, {units: 'miles'});
      var bounds = geojsonExtent(base);

      self.map.fitBounds(bounds);
    }

    self.map.addSource(key, {
      type: 'geojson',
      data
    });

    self.updatePropertyStates(key);

    if (options.features && options.features.selected) {
      var features = data.features.filter(f => {
        return options.features.selected.includes(f.id);
      });

      features.forEach(f => {
        self.selectFeature(key, f.properties, { type : "map" });
      });
    }

    var t1 = performance.now();
    console.log("call to add source took " + (t1 - t0) + " milliseconds.");
  }

  moveSourceUp(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.index === Object.keys(self.sources).length -1) {  // already at the top ---
      return;
    }

    var nextSource = self.sources[Object.keys(self.sources).filter(k => self.sources[k].index === source.index +1)[0]];

    self.moveSourceDown(nextSource.source);
  }

  moveSourceDown(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.index === 0) {  // already at the bottom ---
      return;
    }

    var prevSource = self.sources[Object.keys(self.sources).filter(k => self.sources[k].index === source.index -1)[0]];
    var prevSourceLayers = [];
    Object.keys(prevSource.layers).forEach(layerType => {
      prevSource.layers[layerType].forEach(layerId => {
        prevSourceLayers.push(layerId);
      });
    });

    var sourceLayers = [];
    var sortedSourceLayers = [];
    Object.keys(source.layers).forEach(layerType => {
      source.layers[layerType].forEach(layerId => {
        sourceLayers.push(layerId);
      });
    });

    var allLayers = self.map.getStyle().layers;

    var firstPrevSourceLayerId = null;
    for (var i = 0; i < allLayers.length; i++) {
      if (firstPrevSourceLayerId == null) {
        if (prevSourceLayers.includes(allLayers[i].id)) {
          firstPrevSourceLayerId = allLayers[i].id;
        }
      }
      if (sourceLayers.includes(allLayers[i].id)) {
        sortedSourceLayers.push(allLayers[i].id);
      }
    }

    for (var i = 0; i<sortedSourceLayers.length; i++) {
      var id = sortedSourceLayers[i];
      self.map.moveLayer(id, firstPrevSourceLayerId);
    }

    prevSource.index += 1;
    source.index -= 1;

    // console.log(Object.keys(self.sources).map(s => s + " : " + self.sources[s].index));
  }

  getSourceKeys() {
    return Object.keys(this.sources);
  }

  getLayerKeys() {
    return Object.keys(this.layers);
  }

  getProperties(key, active, hidden) {

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

  getPropertyState(key, property) {

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

  addLayers(key) {

    this.addInteractionLayer(key); // NOTE - swap this maybe?
    this.addPropertyLayer(key);
    //this.addWireFrameLayer(key);
  }

  toggleLayers(key, visible) {

    var self = this;
    var source = self.sources[key];
    var visibility = visible === true ? "visible" : "none";

    if (source === undefined || source === null) {
      return;
    }

    Object.keys(source.layers).forEach(layerType => {
      source.layers[layerType].forEach(id => {
        self.map.setLayoutProperty(id, 'visibility', visibility);
      });

    });

    source.popups.forEach(p => {
      p.toggleVisibility(visible);
    });

    source.visible = visible;

    self.updateLegend();
  }

  updateWireFrameLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var layers = self.map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    var features = source.data.features.slice();
    var base = source.base;

    features.forEach(feature => {

      var coordinates = feature.geometry.coordinates;
      var h = base ? feature.properties[base] ? feature.properties[base] : 0 : 0;

      if (isNaN(coordinates[0])) {
        coordinates.forEach(a => {
          if (isNaN(a[0])) {
            a.forEach(b => {
              if (isNaN(b[0])) {
                b.forEach(c => {
                  if (isNaN(c[0])) {
                    c.forEach(d => {
                      d[2] = h;
                    });
                  } else {
                    c[2] = h;
                  }
                });
              } else {
                b[2] = h;
              }
            });
          } else {
            a[2] = h;
          }
        });
      } else {
        coordinates[2] = h;
      }

    });

    source.mapped = features;
  }

  addWireFrameLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (!(source.types.includes("Polygon") || source.types.includes("MultiPolygon"))) { // only polygons for now ---
      return;
    }

    var layers = self.map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    self.updateWireFrameLayer(key);

    const LIGHT_SETTINGS = {
      lightsPosition: [-125, 50.5, 5000, -122.8, 48.5, 8000],
      ambientRatio: 0.2,
      diffuseRatio: 0.5,
      specularRatio: 0.3,
      lightsStrength: [1.0, 0.0, 2.0, 0.0],
      numberOfLights: 2
    };

    //MAKE LAYER:
    var wireframe = new MapboxLayer({
      type: GeoJsonLayer,
      id: key + "-wireframe",
      data: self.sources[key].mapped,
      opacity: 0.6,
      stroked: true,
      filled: false,
      extruded: false,
      wireframe: false,
      fp64: false,
      lightSettings: LIGHT_SETTINGS,
      getElevation: f => 0,
      getFillColor: f => [255, 255, 255], // [50, 50, 50],
      getLineColor: f => [255, 255, 255], // [50, 50, 50],
      lineWidthMaxPixels: 1,
      lineWidthMinPixels: 0,
      pickable: false,
      onHover: f => highlightFeature(key, f.properties, { type : "map" })

    });

    //ADD LAYER:
    self.sources[key].layers.interaction.push(wireframe.id);
    self.map.addLayer(wireframe , firstSymbolId );
  }

  addInteractionLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var layers = self.map.getStyle().layers;
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

      //alert(str);
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":
      case "MultiPolygon":

        var layer = self.styleBuilder.buildGeoJsonPolygonInteractionLayer(source);
        var id = layer.id;

        self.sources[key].layers.interaction.push(id);

        self.map.addLayer(layer , firstSymbolId );

        break;

      case "LineString":
      case "MultiLineString":

        var layer = self.styleBuilder.buildGeoJsonLineStringInteractionLayer(source);
        var id = layer.id;

        self.sources[key].layers.interaction.push(id);

        self.map.addLayer(layer , firstSymbolId );

        break;

      case "Point":
      case "MultiPoint":

        var layer = self.styleBuilder.buildGeoJsonPointInteractionLayer(source);
        var id = layer.id;

        self.sources[key].layers.interaction.push(id);

        self.map.addLayer(layer , firstSymbolId );

        // point always on top ---
        self.map.moveLayer(id);

        break;

      default:

    }
  }

  addPropertyLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var layers = self.map.getStyle().layers;
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

      //alert(str);
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":
      case "MultiPolygon":

        var layer =  self.styleBuilder.buildGeoJsonPolygonPropertyLayer(source, !self.controls.isExtruded());
        var id = layer.id;

        self.sources[key].layers.property.push(id);

        self.map.addLayer( layer, firstSymbolId );

        break;

      case "LineString":
      case "MultiLineString":

        var layer =  self.styleBuilder.buildGeoJsonLineStringPropertyLayer(source);
        var id = layer.id;

        self.sources[key].layers.property.push(id);

        self.map.addLayer( layer, firstSymbolId );

        break;

      case "Point":
      case "MultiPoint":

        var layer = self.styleBuilder.buildGeoJsonPointPropertyLayer(source);
        var id = layer.id;

        self.sources[key].layers.property.push(id);

        self.map.addLayer( layer, firstSymbolId );
        self.map.moveLayer( layer.id ); // point always on top ---

        break;

      default:

    }

    // --- highlight

    if (self.sources[key].options.interactive === false) {
      return;
    }

    self.sources[key].layers.property.forEach(id => {

      self.map.on("mousemove", id, function(e) {

        if (self.draw.getMode() !== "static") { // NOTE - user is drawing or selecting ---
          return;
        }

        if (e.features.length > 0) {

          self.map.getCanvas().style.cursor = 'pointer';

          self.highlightFeature(key, e.features[0].properties, { type : "map", location : e.lngLat });
        }

      });

      self.map.on("mouseleave", id, function() {

        if (self.draw.getMode() !== "static") { // NOTE - user is drawing or selecting ---
          return;
        }

        self.map.getCanvas().style.cursor = '';

        self.unhighlightFeature(key);
      });

      // --- popup -- multiples for comparison

      self.map.on('click', id, function(e) {

        if (self.draw.getMode() !== "static") { // NOTE - user is drawing or selecting ---
          return;
        }

        if (e.features.length > 0) {

          self.selectFeature(key, e.features[0].properties, { type : "map", location : e.lngLat });
        }

      });
    });
  }

  highlightFeature(key, data, selectionType)  {

    var self = this;
    var source = self.sources[key];
    var type = selectionType == undefined || selectionType == null ? null : selectionType.type;
    var location = selectionType == undefined || selectionType == null ? null : selectionType.location;

    if (source === undefined || source === null) {
      return;
    }

    var highlight = source.selected.slice();

    highlight.push(data);

    if (source.hovered) {
      self.map.setFeatureState({source : key, id : source.hovered._id}, {hover : false } );

      if (source.grid) {
        source.grid.unhighlight(source.hovered);
      }
    }

    source.hovered = data;
    self.map.setFeatureState({source : key, id : source.hovered._id}, {hover : true } );

    if (source.coords) {
      source.coords.highlight(highlight);
    }

    if (source.grid) {
        source.grid.highlight(source.hovered);
    }
  }

  unhighlightFeature(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (source.hovered) {
      self.map.setFeatureState({source : key, id : source.hovered._id}, {hover : false });

      if (source.grid) {
        source.grid.unhighlight(source.hovered);
      }
    }

    source.hovered = null;

    self.updateCoordsViewHighlighedFeatures(key);
  }

  selectFeature(key, data, selectionType) {

    var self = this;
    var source = self.sources[key];
    var type = selectionType == undefined || selectionType == null ? null : selectionType.type;
    var location = selectionType == undefined || selectionType == null ? null : selectionType.location;

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

        } else if (types.includes("LineString") || types.includes("MultiPoint")) {
          location = feature.geometry.coordinates[0];

        } else if (types.includes("Point")) {
          location = feature.geometry.coordinates;
        }
      }

      source.selected.push(feature.properties);

      if (source.grid) {
        source.grid.select(feature.properties, selectionType);
      }

      self.addFeaturePopup(key, feature, location);

      self.map.setFeatureState({source : key, id : feature.id }, {selected : true });

    });

    self.updateCoordsViewHighlighedFeatures(key);;

    if (type === "click" && source.visible) {

      var features = source.data.features.filter(feature => {
        return data._id === feature.id;
      });

      if (features.length === 0) {
        return;
      }

      var bounds = geojsonExtent(turf.featureCollection(features));

      self.map.fitBounds(bounds, {
        padding: 20,
        maxZoom : 15,
      });
    }

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

      if (source.grid) {
        source.grid.deselect(feature.properties);
      }

      self.removeFeaturePopup(key, feature);

      self.map.setFeatureState({source : key, id : feature.id }, {selected : false });

    });

    self.updateCoordsViewHighlighedFeatures(key);
  }

  removeFeaturePopup(key, feature) {

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

  addFeaturePopup(key, feature, location) {

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

      } else if (types.includes("LineString") || types.includes("MultiPoint")) {
        location = feature.geometry.coordinates[0];

      } else if (types.includes("Point")) {
        location = feature.geometry.coordinates;
      }
    }

    if (!isNaN(location)) { // try witout MultiPolygon/MultiLineString/MultiPoint ? TODO - this is not ideal

      if (types.includes("Polygon")) {
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
        closeButton: source.options.interactive === false ? false : true,
        closeOnClick: false
      });

      popup.setLngLat(location)
        .setDOMContent(lst)
        .addTo(self.map);

      popup.properties = properties; // NOTE - this is to find it later ---

      source.popups.push(popup);

      popup._content.addEventListener("mouseenter", function(e) {

        source.coords.highlight([properties]); // highlight only the hovered popup feature ---
        popup._content.parentNode.parentNode.appendChild(popup._content.parentNode);

      });

      popup._content.addEventListener("mouseleave", function(e) {

        self.updateCoordsViewHighlighedFeatures(key);
      });

      var parent = d3.select(popup._content.parentNode)[0][0];
      var header = d3.select(popup._content).select(".popup-header")[0][0];
      var content = d3.select(popup._content).select(".popup-content")[0][0];

      var dstyle = parent.style.transform.split("translate");
      var dtranslate = dstyle[dstyle.length -1].replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '', "").replace(/px/g, "").split(" ");

      var dtx = +dtranslate[0];
      var dty = +dtranslate[1];

      var indicator = document.createElement("div");
      indicator.classList.add("popup-indicator");
      popup._content.parentNode.parentNode.appendChild(indicator);

      var pointer = null;

      popup.toggleVisibility = function(visible) {

        var container = lst.parentNode.parentNode;

        if (container) {
          if (!visible) {
            if (!container.classList.contains("collapsed")) {
              container.classList.add("collapsed")
            }
          } else {
            container.classList.remove("collapsed")
          }
        }

        if (indicator) {
          if (!visible) {
            if (!indicator.classList.contains("collapsed")) {
              indicator.classList.add("collapsed")
            }
          } else {
            indicator.classList.remove("collapsed")
          }
        }

        if (pointer) {
          if (!visible) {
            if (!pointer.classList.contains("collapsed")) {
              pointer.classList.add("collapsed")
            }
          } else {
            pointer.classList.remove("collapsed")
          }
        }
      }

      popup.toggleVisibility(source.visible);

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

      content.addEventListener("mouseenter", function(e) {

        self.highlightFeature(key, properties, { type : "map"});

      });

      content.addEventListener("mouseleave", function(e) {

        self.unhighlightFeature(key);

      });

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

  addSheetView(key, element) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    source.grid = d3.divgrid(source, self)(element)

    self.updateSheetView(key);

    return source.grid;
  }

  updateSheetView(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.grid === null) {
      return;
    }

    var properties = self.getProperties(key, true, false);
    //properties.splice(0,0, "_id");

    var data = source.brushed.length === 0 || source.bru ? source.coords.data() : source.brushed;

    source.grid.data(data)
      .columns(properties)
      .render();
  }

  addCoordsView(key, element) {

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

    source.coords = d3.parcoords(source)(element, key + "-pc")
        .data(values)
        .hideAxis(source.hidden)
        .color(function(d) { return "#000000"; })
        .alpha(0.05)
        .composite("darken")
        .margin({ top: 30, left: 30, bottom: 60, right: 15})
        .mode("queue")
        .brushMode("1D-axes")
        //.reorderable()
        .on("brushend", function(d, a) {

          source.brushed = d;

          self.updatePropertyStates(key);
          self.updateSheetView(key);
          self.updateFilteredFeatures(key);
          self.updateClusterLayer(key, a);
          self.updateLegend();
        })
        .on("rangeset", function(d, a) {
          // console.log("range set", a, d);
        })
        .on("overflow", function(d, a) {
          // console.log("overflow", a, d);

          self.remapProperty(key, a, d);
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

  updateCoordsViewHighlighedFeatures(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    source.coords.highlight(source.selected);
  }

  updateFilteredFeatures(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    var filter = ['in', '_id'];

    if (Object.keys(source.coords.brushExtents()).length) {

      source.brushed.forEach(value => {

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

    } else {

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

    source.layers.property.forEach(id => {
      self.map.setFilter(id, filter);
    });

    source.layers.interaction.forEach(id => {
      self.map.setFilter(id, filter);
    });

    var selected = source.selected.slice();

    selected.forEach(data => {

      if (!filter.includes(data._id)) {
        self.deselectFeature(key, data);
      }

    });

    self.updateCoordsViewHighlighedFeatures(key);
  }

  toggleProperty(key, property, visible) {

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

    self.updateFilteredFeatures(key);

    if (source.coords !== null) {
      source.coords.hideAxis(source.hidden).render().updateAxes();
    }

    var active = source.active;

    if (!visible && active === property) {
      source.active = active = null;
    }

    //source.active = null;

    source.height = self.sources[key].options.height || "" ;
    source.base = self.sources[key].options.base || "" ;
    source.brushed = [];

    source.selected.forEach(data => {
      self.deselectFeature(key, data);
    });

    self.updateCoordsView(key);
    self.updateFilter(key);

    if (active != null) {
      self.selectProperty(key, active);
    }

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

    self.updateCoordsView(key);
    self.updateFilteredFeatures(key);
    self.updatePropertyStates(key);
    self.updateFilter(key);

    if (active != null) {
      self.selectProperty(key, active);
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

    self.updateCoordsView(key);
    self.updateFilteredFeatures(key);
    self.updatePropertyStates(key);
    self.updateFilter(key);

    if (active != null) {
      self.selectProperty(key, active);
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

  updateCoordsView(key) {

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

    self.updateSheetView(key);
    self.updatePropertyLayer(key, null);
    self.updateClusterLayer(key, null);

    source.coords.selection.selectAll(".label")[0].forEach(other => {
      other.classList.remove("selected");
    });

    try {

      source.coords.selection.selectAll("foreignObject").remove();

    } catch {

      //console.log("form already removed");
    }


    source.coords.selection.selectAll(".label")[0].forEach(function(l) {

        if (l.hasEventListener) {
          return; // Note - only one listener per label ---
        }

        l.hasEventListener = true;

        l.addEventListener("click", function(e) {

          var property = l.innerHTML; // NOTE - this is the selection ---
          self.selectProperty(key, property);

        });
    });
  }

  restoreProperty(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var state = source.states[property];

    if (state === undefined || state === null) {
      return;
    }

    var a = property;
    var extents = source.coords.brushExtents();
    var bound = extents[a];
    var flag = false;

    if (bound) {

      if (bound[0] < state.propertyInterval[0]) {
        bound[0] = state.propertyInterval[0];
      }

      if (bound[1] > state.propertyInterval[1]) {
        bound[1] = state.propertyInterval[1];
      }

      if (bound[1] < state.propertyInterval[0] || bound[0] > state.propertyInterval[1]) {
        flag = true;
      }

      extents[a] = bound;

    } else {

      flag = true;
    }

    state.propertyClamp = null;

    self.removeFilter(key, a);

    // source.coords.scaleAxis(property, state.propertyInterval);
    source.coords.scaleAxis(property, null);

    if (!flag) {
      source.coords.brushExtents(extents);
    }
  }

  remapProperty(key, property, bounds) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var state = source.states[property];

    if (state === undefined || state === null) {
      return;
    }

    var a = property;

    state.propertyClamp = bounds;

    self.addFilters(key, [{
      filterKey : a,
      filter : (value) => {
          return value[a] >= bounds[1] || value[a] <= bounds[0];
      }
    }]);

    var extents = source.coords.brushExtents();

    extents[a] = bounds;

    source.coords.scaleAxis(property, bounds);
    source.coords.brushExtents(extents);
  }

  selectProperty(key, property) {

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

    try {

      source.coords.selection.selectAll("foreignObject").remove();

    } catch {

      //console.log("form already removed");
    }

    var form = d3.select(l.parentNode.parentNode).append("foreignObject");
    var input = form
        .attr({
            "x": -75,
            "y": -50,
            "height": 20,
            "width": 150,
            //"style" : "border : 1px solid grey; "
        })
        .append("xhtml:div")
        .attr("class", "axis-menu")[0][0];

    ///

    var baseImg = document.createElement("img");
    baseImg.classList.add("axis-menu-img");
    baseImg.src = "img/cube-icon.png";
    baseImg.style = " transform: rotate(180deg); ";
    if (source.base === property) {
      baseImg.classList.add("selected");
    }

    var baseButton = document.createElement("div");
    baseButton.classList.add("axis-menu-item");
    baseButton.appendChild(baseImg);

    if ((!source.types.includes("Polygon") && !source.types.includes("MultiPolygon")) || state.propertyType !== "number") {
      baseImg.classList.add("disabled");
    } else {
      baseButton.title = "Base";
      baseButton.addEventListener("click", e => {
        console.log("extrude");

        if (source.base === property) {

          source.base = "";

          baseImg.classList.remove("selected");

        } else {

          source.base = property;

          if (!baseImg.classList.contains("selected")) {
            baseImg.classList.add("selected");
          }
        }

        var active = source.active;
        var extents = source.coords.brushExtents();

        source.brushed = [];

        self.updatePropertyLayer(key) // this is the update ---

        self.updateCoordsView(key);
        self.updateFilteredFeatures(key);
        self.updatePropertyStates(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectProperty(key, active);
        }

        var extents = source.coords.brushExtents(extents);

      });
    }


    ///

    var heightImg = document.createElement("img");
    heightImg.classList.add("axis-menu-img");
    heightImg.src = "img/cube-icon.png";
    if (source.height === property) {
      heightImg.classList.add("selected");
    }

    var heightButton = document.createElement("div");
    heightButton.classList.add("axis-menu-item");
    heightButton.appendChild(heightImg);

    if ((!source.types.includes("Polygon") && !source.types.includes("MultiPolygon")) || state.propertyType !== "number") {
      heightImg.classList.add("disabled");
    } else {
      heightButton.title = "Height";
      heightButton.addEventListener("click", e => {
        console.log("extrude");

        if (source.height === property) {

          source.height = "";

          heightImg.classList.remove("selected");

        } else {

          source.height = property;

          if (!heightImg.classList.contains("selected")) {
            heightImg.classList.add("selected");
          }
        }

        var active = source.active;
        var extents = source.coords.brushExtents();

        source.brushed = [];

        self.updatePropertyLayer(key) // this is the update ---

        self.updateCoordsView(key);
        self.updateFilteredFeatures(key);
        self.updatePropertyStates(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectProperty(key, active);
        }

        var extents = source.coords.brushExtents(extents);

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
        var extents = source.coords.brushExtents();

        source.brushed = [];

        self.updateCoordsView(key);
        self.updateFilteredFeatures(key);
        self.updatePropertyStates(key);
        self.updateFilter(key);

        if (active != null) {
          self.selectProperty(key, active);
        }

        source.coords.brushExtents(extents);

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
      colorBox.classList.add("hover-box");
      colorBox.style.top = y + "px";
      colorBox.style.left = x + "px";

      Object.keys(colorbrewer).forEach(styleKey => {

        var colorRangeKeys = Object.keys(colorbrewer[styleKey]);
        var colorRange = colorbrewer[styleKey][colorRangeKeys[colorRangeKeys.length -1]];

        var colorRangeBox = document.createElement("div");
        colorRangeBox.classList.add("hover-box-item");
        colorRangeBox.classList.add("color");

        colorRange.forEach(color => {

          var colorRangeBlock = document.createElement("div");
          colorRangeBlock.classList.add("color-range-block");
          colorRangeBlock.style.background = color;

          colorRangeBox.appendChild(colorRangeBlock);
        });

        colorRangeBox.addEventListener("click", e => {

          state.propertyStyle = colorRange;

          var active = source.active;
          var extents = source.coords.brushExtents();

          source.brushed = [];

          self.updateCoordsView(key);
          self.updateFilteredFeatures(key);
          self.updatePropertyStates(key);
          self.updateFilter(key);

          if (active != null) {
            self.selectProperty(key, active);
          }

          source.coords.brushExtents(extents);

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

        self.remapProperty(key, property, bounds);
        e.stopPropagation();

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
         console.log("zoom out");

        if (state.propertyClamp === undefined || state.propertyClamp === null) {
          return;
        }

        self.restoreProperty(key, property);
        e.stopPropagation();

      });
    }

    if (state.propertyClamp) {

      var clOpen = document.createElement("div");
      clOpen.classList.add("axis-bracket");
      clOpen.innerHTML = "["

      input.appendChild(clOpen)
    }

    if (!source.options.base) {
      input.appendChild(baseButton);
    }

    if (!source.options.height) {
      input.appendChild(heightButton);
    }

    if (!state.propertyOptions || !state.propertyOptions.reverse) {
      input.appendChild(reverseButton);
    }

    if (!state.propertyOptions || !state.propertyOptions.color) {
      input.appendChild(colorButton);
    }

    input.appendChild(zoomInButton);
    input.appendChild(zoomOutButton);

    if (state.propertyClamp) {

      var clClose = document.createElement("div");
      clClose.classList.add("axis-bracket")
      clClose.innerHTML = "]"

      input.appendChild(clClose)
    }

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

    self.updateCoordsViewHighlighedFeatures(key);
    self.updatePropertyLayer(key, property);
    self.updateClusterLayer(key, property);
    self.updateLegend();
  }

  updateClusterLayer(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (!(source.types.includes("Point") || source.types.includes("MultiPoint"))) { // only points for now ---
      return;
    }

    //delete clusters ---

    source.layers.clusters.forEach(id => {
      self.map.removeLayer(id);
    })

    source.layers.clusters = [];

    if (property === undefined || property === null) {

    } else {

      var state = source.states[property];
      var stops = state.propertyStops;
      var ival = state.propertyInterval;
      var min = 1;
      var max = 5;
      var paint;

      if (state.propertyClamp) {
        ival = state.propertyClamp;
      }

      // new clusters ---

      var bins = self.getBins(key);
      var propertyLayerId = source.layers.property[0];

      bins.forEach((bin, i) => {

        var filter = ["in", "_id"];
        bin.data.forEach(d => {filter.push(d._id); });

        var rgb = hexToRgb(stops[bin.index][1]);

        var cluster = {

            id : source.source + '-cluster' + i,
            source : source.source,
            type : "heatmap",
            filter : filter,
            minzoom : 0,
            layout :{
              visibility : source.visible ?  "visible" : "none",
            },
            paint: {
                // Increase the heatmap weight based on frequency and property magnitude
                // "heatmap-weight": [
                //     "interpolate",
                //     ["linear"],
                //     ["get", "test"],
                //     0, 0,
                //     6, 1
                // ],
                //Increase the heatmap color weight weight by zoom level
                //heatmap-intensity is a multiplier on top of heatmap-weight
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 1,
                    9, 3
                ],
                // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                // Begin color ramp at 0-stop with a 0-transparancy color
                // to create a blur-like effect.
                "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(0,0,0,0)",
                    0.2,"rgba(0,0,0,0)",
                    0.4,"rgba(0,0,0,0)",
                    0.6, "rgba(0,0,0,0)",
                    0.8, "rgba(0,0,0,0)",
                    1, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.8 + ")"
                ],
                // Adjust the heatmap radius by zoom level
                "heatmap-radius": 10, //20,
                // Transition from heatmap to circle layer by zoom level
                "heatmap-opacity": 1
              }

          };

          source.layers.clusters.push(cluster.id);

          self.map.addLayer(cluster, propertyLayerId);
      });

    }

    function hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
  }

  updatePropertyLayer(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var paintProperties = [];

    if (property === undefined || property === null) {

      if (source.types.includes("LineString") || source.types.includes("MultiLineString")) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type : "line-color",
            paint : "#e5e5e5"
          });
        });

      } else  if (source.types.includes("Polygon") || source.types.includes("MultiPolygon") ) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type :"fill-extrusion-color",
            paint : [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#000000",
              ["boolean", ["feature-state", "selected"], false],
              "#000000",
              "#e5e5e5"
              ],
          });

          paintProperties.push({
            id : id,
            type :"fill-extrusion-height",
            paint : !self.controls.isExtruded() ? 0 : ["get", source.height],
          })

          paintProperties.push({
            id : id,
            type :"fill-extrusion-base",
            paint : !self.controls.isExtruded() ? 0 : ["get", source.base],
          })

        });

      } else if (source.types.includes("Point") || source.types.includes("MultiPoint")) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type :"circle-color",
            paint : "#e5e5e5",
          });

          // paintProperties.push({
          //   id : id,
          //   type :"circle-radius",
          //   paint : 2
          // });

        });

      }

    } else {

      var state = source.states[property];
      var stops = state.propertyStops;
      var ival = state.propertyInterval;
      var min = 1;
      var max = 5;
      var paint;

      if (state.propertyClamp) {
        ival = state.propertyClamp;
      }

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

        //alert("uknown property type " + state.propertyType);
      }

      if (source.types.includes("LineString") || source.types.includes("MultiLineString")) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type : "line-color",
            paint : paint,
          });

          // paintProperties.push({
          //   id : id,
          //   type : 'line-width',
          //   paint : [ "+", min, [ "*", max, ["/", ["-", ['get', property], ival[0]] , ival[1] - ival[0]]]]
          // });

        });

      } else  if (source.types.includes("Polygon") || source.types.includes("MultiPolygon") ) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type :"fill-extrusion-color",
            paint : paint
          });

        });

      } else if (source.types.includes("Point") || source.types.includes("MultiPoint")) {

        source.layers.property.forEach(id => {

          paintProperties.push({
            id : id,
            type :"circle-color",
            paint : paint
          });

          // paintProperties.push({
          //   id : id,
          //   type :"circle-radius",
          //   paint : [ "+", min, [ "*", max, ["/", ["-", ['get', property], ival[0]] , ival[1] - ival[0]]]]
          // });

        });

      }
    }

    paintProperties.forEach(paintProperty => {
      self.map.setPaintProperty(paintProperty.id, paintProperty.type, paintProperty.paint);
    });

  }

  updatePropertyStates(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    //source.active = null; NOTE - might need to be turned back on if this is causing errors ---

    Object.keys(source.states).forEach(property => {

      var state = source.states[property];
      var style = state.propertyStyle.slice();

      if (state.propertyReversed) {
        style.reverse();
      }

      if (state.propertyType === "number") {

        if (state.propertyClamp !== undefined && state.propertyClamp !== null) {

          var nstops = [];
          var nTot = 0;
          var nCount = 0;

          if (source.coords && source.coords.data().length > 0) {
            source.coords.data().forEach(d => {
              nTot += d[property];
              nCount += 1;
            });
          }

          for (
            var i = state.propertyClamp[0], j=0;
            j < style.length;
            i += (state.propertyClamp[1] - state.propertyClamp[0]) / style.length, j++) {

              nstops.push([i, style[j]]);
          }

          state.propertyRange = [state.propertyClamp[0], state.propertyClamp[1]];
          state.propertyRangeAverage  = nCount > 0 ? nTot / nCount : state.propertyAverage;
          state.propertyStops = nstops;

        } else {

          var nstops = [];
          var nMin = null;
          var nMax = null;
          var nTot = 0;
          var nCount = 0;

          if (source.coords && source.coords.data().length > 0) {
            source.coords.data().forEach(d => {
              if (nMin === null || d[property] < nMin) {
                nMin = d[property];
              }
              if (nMax === null || d[property] > nMax) {
                nMax = d[property];
              }
              nTot += d[property];
              nCount += 1;
            });
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
          state.propertyRangeAverage  = nCount > 0 ? nTot / nCount : state.propertyAverage;
          state.propertyStops = nstops;
        }

        if (source.brushed && source.brushed.length > 0) {

          var bMin = null;
          var bMax = null;
          var bTot = 0;
          var bCount = 0;

          source.brushed.forEach(d => {
            if (bMin === null || d[property] < bMin) {
              bMin = d[property];
            }
            if (bMax === null || d[property] > bMax) {
              bMax = d[property];
            }
            bTot += d[property];
            bCount += 1;
          });

          state.propertyBrushedInterval = [bMin, bMax];
          state.propertyBrushedAverage = bTot / bCount;

        } else {

          state.propertyBrushedInterval = state.propertyRange.slice();
          state.propertyBrushedAverage = state.propertyRangeAverage;
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


    } else {

      // TODO ---
    }

    return bins;

  }

  addLegend(element) {
    this.legend = element;
  }

  buildLegend(key, target) {

    var self = this;
    var source = self.sources[key];
    var content = target;

    if (source === undefined || source === null) {
      return ;
    }

    var state = source.states[source.active];
    var bins = self.getBins(key)

    var contentLabel = document.createElement("div");
    contentLabel.classList.add("legend-header");
    contentLabel.classList.add("legend-header-label");
    //contentLabel.classList.add("selected");

    var lkey = document.createElement("div");
    lkey.classList.add("legend-header-key");
    lkey.innerHTML = source.source;

    var lprop = document.createElement("div");
    lprop.classList.add("legend-header-property");
    lprop.innerHTML = source.active;

    var di = document.createElement("img");
    di.classList.add("box-menu-img");
    di.src = "img/camera-icon.png";
    di.style.height = "18px";
    di.style.width = "18px";

    var dl = document.createElement("div");
    dl.classList.add("box-menu-item");
    dl.title = "Snapshot Readout";
    dl.appendChild(di);
    dl.addEventListener("click", e => {
      console.log("snapshot");

      setInlineStyles(target);

      html2canvas(target).then(canvas => {
        canvas.toBlob(function (blob) {
          saveAs(blob, 'chart.png');
          console.log('saved as chart.png');

          target.style = "";
          target.innerHTML = "";
          self.buildLegend(source.source, target);

        });
      });
    });

    var ei = document.createElement("img");
    ei.classList.add("box-menu-img");
    ei.src = "img/expand-icon.png";

    var eb = document.createElement("div");
    eb.classList.add("box-menu-item");
    eb.title = "Expand Readout";
    eb.appendChild(ei);

    var contentReadouts = document.createElement("div");
    contentReadouts.classList.add("legend-content-readouts")

    var contentBars = document.createElement("div");
    contentBars.classList.add("legend-content-bars");

    var contentHist = document.createElement("div");
    contentHist.classList.add("legend-content-hist");

    content.appendChild(contentLabel);
    content.appendChild(contentReadouts);

    contentLabel.appendChild(lkey);
    contentLabel.appendChild(lprop);
    contentLabel.appendChild(dl);
    contentLabel.appendChild(eb);

    contentReadouts.appendChild(contentHist);
    contentReadouts.appendChild(contentBars);

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
          value.innerHTML = " > " + start;
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

    ////// bar chart ---

    buildBarChart(source, state, bins, contentHist);

    ////// box plot ---

    buildBoxPlot(source, state, bins, contentHist);

    ////// methods ---

    function buildBoxPlot(source, state, bins, target) {

      var element = document.createElement("div");
      element.classList.add("legend-plot");

      target.appendChild(element);

      var cell = document.createElement("div");
      cell.style["margin-left"] = 40 + "px";
      cell.style["margin-right"] = 30 + "px";
      cell.style["margin-top"] = 10 + "px";

      var cellbar = document.createElement("div");
      cellbar.classList.add("cell-bar");
      cellbar.classList.add("stats");

      var cellValue = document.createElement("div");
      cellValue.classList.add("legend-plot-avg");

      if (state.propertyType === "number") {

        var range = state.propertyClamp !== undefined && state.propertyClamp !== null ? state.propertyClamp : state.propertyRange;
        var ival = state.propertyBrushedInterval;
        //var width = state.propertyBrushedInterval[1] - state.propertyBrushedInterval[0];
        var value = state.propertyBrushedAverage;

        var margin = (ival[0] -  range[0]) / (range[1] - range[0]);
        var width = (ival[1] - ival[0]) / (range[1]  - range[0]);
        var vMargin = (value -  range[0]) / (range[1] - range[0]);

        cellValue.innerHTML = value === undefined ? "" : parseFloat(Math.round(value * 100) / 100).toFixed(2); ;
        cellbar.style["margin-left"] = (100 * margin) + "%";
        cellbar.style.width = 100 * width + "%";

        cellValue.style["margin-left"] = (100 * vMargin) + "%";

        cell.appendChild(cellbar);
        cell.appendChild(cellValue);
      }

      element.appendChild(cell);

    }

    function buildBarChart(source, state, bins, target) {

      var bars = [];

      bins.forEach(bin => {
        if (bin.valid) {
          bars.push(bin);
        }
      });


      var element = document.createElement("div");
      element.classList.add("legend-hist");

      target.appendChild(element);

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
        .tickSize(0)
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
  }

  updateLegend() {

    var self = this;
    var legend = self.legend;

    if (legend === undefined || legend === null) {
      return; // NOTE - legend has not been set ---
    }

    legend.innerHTML = "";

    var readouts = document.createElement("div");
    readouts.classList.add("legend-readouts");
    var headers = document.createElement("div");
    headers.classList.add("legend-headers");

    legend.appendChild(readouts);
    legend.appendChild(headers);

    var count = 0;

    Object.keys(self.sources).forEach(s => {

        var source = self.sources[s];

        if (source.active && source.visible) {

          var legend = self.legend;

          var readout = document.createElement("div");
          readout.classList.add("legend-div");

          var header = document.createElement("div");
          header.classList.add("legend-header");
          header.classList.add("selected");

          var content = document.createElement("div");
          content.classList.add("legend-content");

          var indicator = document.createElement("div");
          indicator.classList.add("legend-indicator");
          indicator.classList.add("mapboxgl-popup-tip");

          var hkey = document.createElement("div");
          hkey.classList.add("legend-header-key");
          hkey.innerHTML = s;
          hkey.title = "Hide Legend"

          var hsel = document.createElement("div");

          var hprop = document.createElement("div");
          hprop.classList.add("legend-header-property");
          hprop.classList.add("legend-header-option")
          hprop.title = "Active Property"
          hprop.innerHTML = source.active;
          hsel.appendChild(hprop);

          // var hprop = document.createElement("select");
          // hprop.classList.add("legend-header-option");
          // hprop.innerHTML = source.active;

          var hdrop = document.createElement("div");
          hdrop.classList.add("legend-header-dropdown");
          hdrop.classList.add("collapsed");
          hsel.appendChild(hdrop);

          var props = self.getProperties(source.source, true, false);
          props.forEach(p => {

            if (p === source.active) {
              return;
            }

            var hopt = document.createElement("div");
            hopt.classList.add("legend-header-property");
            hopt.classList.add("legend-header-option")
            hopt.innerHTML = p;
            hopt.value = p;

            hopt.addEventListener("click", () => {
              self.selectProperty(source.source, p);
            })

            hdrop.appendChild(hopt);
          });

          hprop.addEventListener("click", () => {
            //hdrop.classList.toggle("collapsed");
          })

          hsel.addEventListener("mouseenter", () => {
            hsel.enter = true;
            hdrop.classList.remove("collapsed");
          });

          hsel.addEventListener("mouseleave", () => {
            hsel.enter = false;

            setTimeout(() => {
              if (!hsel.enter) {
                if (!hdrop.classList.contains("collapsed")) {
                  hdrop.classList.add("collapsed");
                }
              }

            }, 100);

          });

          hkey.addEventListener("click", e => {
            readout.classList.toggle("collapsed");
            indicator.classList.toggle("collapsed");
            header.classList.toggle("selected");

            if (!readout.classList.contains("collapsed")) {
              readout.scrollIntoView();
              hkey.title = "Hide Legend"
            } else {
              hkey.title = "Show Legend"
            }
          })

          header.appendChild(indicator);
          header.appendChild(hkey);
          header.appendChild(hsel);

          readout.appendChild(content);

          readouts.appendChild(readout);
          headers.appendChild(header);

          self.buildLegend(s, content);

          //hkey.click();
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

function clean(object) {

  var clean = {};

  Object.keys(object).forEach(k => {

    var _k =  k.replace(/ /g, '_').replace(/\n/, '_');

    clean[_k] = object[k];

  });

  return clean;

}

function wrangle(data, options) {

  var t0 = performance.now();
  console.log("call wrangle");

  var wrangled = {
    options : options || {},
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
    var propertyTypes = {};

    // detect all types --- unfortunately we need to iterate this once to map nulls --
    features.forEach((f, i) => {

      // remove properties not in options if exists ---
      if (wrangled.options.properties && wrangled.options.properties.filtered) {

        var keys = Object.keys(f.properties).slice();

        keys.forEach(property => {
          if (!wrangled.options.properties.filtered.includes(property)) {
            delete f.properties[property];
          }
        });
      }

      f.properties = clean(f.properties); // clean all the keys here ---

      var types = detectTypes([f.properties]) // get the propertyTypes of this feature ---

      Object.keys(types).forEach(property => {

        var value = f.properties[property];

        if (property in propertyTypes) {
          if (types[property] !== null && types[property] !== "null") {
            if (types[property] !== propertyTypes[property]) {
              // type mismatch - TODO ---
            }
          } else {
            // ignore the null type ---
          }
        } else {
          if (types[property] !== null && types[property] !== "null") {
            propertyTypes[property] = types[property]; // assign the type from the first one found ---
          } else {
            // ignore the null type ---
          }
        }

      });

    });

    var dirty = [];

    // supply defaults and remove bad keys ---
    features.forEach((f, i) => {

      var defaults = wrangled.options.defaults || { // try to get defaults from options - NOTE - if this object is bad this will not work...
        "string" : "invalid data",
        "number" : -1,
        "date" : null,
        "boolean" : false
      };

      var dirtyFlag = false;

      // map missing or null values to the defaults ---
      Object.keys(propertyTypes).forEach(property => {

        var value = f.properties[property];

        if (value === undefined || value === null || value === "null" || value === "") {
          f.properties[property] = defaults[propertyTypes[property]];
          dirtyFlag = true;
        } else if (toTypeCoerceNumbers(value) !== propertyTypes[property]) {
          f.properties[property] = defaults[propertyTypes[property]];
          dirtyFlag = true;
        }

        if (propertyTypes[property] === "number") {
          f.properties[property] = +f.properties[property];
        }

      });

      if (wrangled.options.clean === true && dirtyFlag) {
        dirty.push(f);
        return;
      }

      var keys = Object.keys(f.properties);

      // remove values from the feature that are not valid propertyTypes;
      keys.forEach(k => {
        if (!(k in propertyTypes)) {
          delete f.properties[k];
        }
      });

      var type = f.geometry.type;

      if (!(wrangled.types.includes(type))) {
        wrangled.types.push(type);
      }

      if (!("_id" in f.properties)) {
        f.properties["_id"] = i;
      }

      f.id = f.properties["_id"]; // geojson source specification ---

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

        case "MultiPoint":

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

    dirty.forEach(d => { // remove the bad objects if cleaning ---
      wrangled.data.features.splice(wrangled.data.features.indexOf(d), 1);
    });

    wrangled.properties = properties;
  }

  var t1 = performance.now();
  console.log("call to wrangle took " + (t1 - t0) + " milliseconds.");

  return wrangled;
}
