


class MapController {

  constructor(map) {
    this.map = map;
    this.layers = {};
    this.sources = {};
    this.legend = null;
    this.keys = [];
    this.loading = false;
    this.container = map._container;

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

    var loader = document.createElement("div");
    loader.id = "overlay";
    loader.innerHTML = '<img src="img/loadloop.gif" id="loader"></img>';
    self.container.appendChild(loader);

    map.on("sourcedata", function(e) {

      self.loading = !e.isSourceLoaded;

      setTimeout(function() { // only use the loader if the loading lasts more than 0.5 sec

        if (self.loading) {
          loader.classList.remove("collapsed");
        } else {
          if (!loader.classList.contains("collapsed")) {
            loader.classList.add("collapsed");
          }
        }

      }, 500);


    });

    document.addEventListener('contextmenu', event => { // NOTE - this will disable all context menu on the page during loading - might be a bad idea

      if (self.loading) {
        event.preventDefault();
      }

    });

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

  addSource(key, data) {

    function createPropertyState(property, wrangled) {

      var propertyStops = [];
      var propertyInterval = wrangled.properties[property];
      var propertyRange = propertyInterval[1] - propertyInterval[0];
      var propertyStyle = style(property);
      var propertyStop = propertyStyle.length;

      for (var i = 0; i< propertyStop; i++) {
        propertyStops.push([propertyInterval[0] + ( i * (propertyRange / propertyStop) ), propertyStyle[i]]);
      }

      return {
        propertyStops : propertyStops,
        propertyInterval : propertyInterval,
        propertyRange : propertyRange,
        propertyStyle : propertyStyle,
        propertyStop : propertyStop
      }
    }

    var self = this;

    self.sources[key] = wrangle(data);
    self.sources[key].source = key;
    self.sources[key].states = {};
    self.sources[key].active = null;
    self.sources[key].visible = true;
    self.sources[key].brushed = [];
    self.sources[key].coords = null;
    self.sources[key].filtered = ["in", "_id"];
    self.sources[key].hidden = [];
    self.sources[key].popups = [];
    self.sources[key].selected = [];
    self.sources[key].hist = null;
    self.sources[key].filters = {
      default : () => { return false; }
    };

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
      }

      self.sources[key].states[property] = propertyState;

      if (!(property === "_id")) { // NOTE - set the baseline parcoords to just be _id ---
        self.sources[key].hidden.push(property);
      }

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

  getSourceKeyProperties(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return [];
    }

    var properties = Object.keys(source.properties);
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
    this.addBaseLayer(key);
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

    while(source.popups[0]) {
      source.popups[0].remove();
    }

    source.visible = visible;

    self.updateLegend();
  }

  addBaseLayer(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (source.types.length > 1) {
      alert("geometry layer contains more than one type - map behavior may be unpredictable");
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":

        self.map.addLayer( buildGeoJsonPolygonBaseLayer(key) );

        break;

      case "LineString":

        self.map.addLayer( buildGeoJeonLineStringBaseLayer(key) );

        break;

      case "Point":

        self.map.addLayer( buildGeoJsonPointBaseLayer(key) );

        // point always on top ---
        self.map.moveLayer( key + '-base');

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

    if (source.types.length > 1) {
      alert("geometry layer contains more than one type - map behavior may be unpredictable");
    }

    var type = source.types[0];

    switch (type) {
      case "Polygon":

        var layer =  buildGeoJsonPolygonFilterLayer(key, self.sources[key].filtered);
        var flat = false;

        self.map.addLayer( layer );

        self.map.on("rotate", function(e) {

          if (self.map.getPitch() < 15) {

            if (!flat) {

              console.log("make flat");
              self.map.setPaintProperty(layer.id, "fill-extrusion-height", 0);

            }

            flat = true;

          } else {

            if (flat) {

              console.log("make extruded");
              self.map.setPaintProperty(layer.id, "fill-extrusion-height", ["get", "height"]);
            }

            flat = false;

          }

        });

        break;

      case "LineString":

        var layer =  buildGeoJsonLineStringFilterLayer(key, self.sources[key].filtered);

        self.map.addLayer( layer );

        break;

      case "Point":

        var layer = buildGeoJsonPointFilterLayer(key, self.sources[key].filtered);

        self.map.addLayer( layer );

        // point always on top ---
        self.map.moveLayer( layer.id );

        break;

      default:

    }

    // --- highlight

    var hoveredStateId =  null;

    self.map.on("mousemove", key + "-filter", function(e) {

      if (e.features.length > 0) {

        var feature = e.features[0];
        var properties = feature.properties;
        var highlight = source.selected.slice();

        highlight.push(properties);

        if (hoveredStateId) {
          self.map.setFeatureState({source : key, id : hoveredStateId}, {hover : false } );
        }

        hoveredStateId = feature.id;
        self.map.setFeatureState({source : key, id : hoveredStateId}, {hover : true } );

        source.coords.highlight(highlight);
      }

    });

    self.map.on("mouseleave", key + "-filter", function() {

      if (hoveredStateId) {
        map.setFeatureState({source : key, id : hoveredStateId}, {hover : false });
      }

      hoveredStateId = null;

      self.updateFilterLayerControllerSelection(key);

    });

    // --- popup -- multiples for comparison

    self.map.on('click', key + "-filter", function(e) {

      if (e.features.length > 0) {

        var feature = e.features[0];
        var properties = feature.properties;
        var state = self.map.getFeatureState({source : key, id : feature.id });
        var lst = document.createElement("div");

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

          popup.setLngLat(e.lngLat)
            .setHTML(lst.innerHTML)
            .addTo(self.map);

          source.popups.push(popup);

          self.map.setFeatureState({source : key, id : feature.id }, {selected : true });
          source.selected.push(feature.properties);

          self.updateFilterLayerControllerSelection(key);

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
                indicator.style["border-left"] = "2px dashed white";
                indicator.style["border-right"] = "";
              } else {
                indicator.style["border-left"] = "";
                indicator.style["border-right"] =  "2px dashed white";
              }

              if (sdy < dty) {
                indicator.style["border-bottom"] = "2px dashed white";
                indicator.style["border-top"] = "";
              } else {
                indicator.style["border-bottom"] = "";
                indicator.style["border-top"] =  "2px dashed white";
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
            self.map.setFeatureState({source : key, id : feature.id }, {selected : false });

            source.popups.splice(source.popups.indexOf(popup), 1);
            source.selected.splice(source.selected.indexOf(feature.properties), 1)

            self.updateFilterLayerControllerSelection(key);

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

    });
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

    source.coords = d3.parcoords()(element)
        .data(values)
        .hideAxis(source.hidden)
        .color(function(d) { return "#ffffff"; })
        .alpha(0.05)
        //.composite("darken")
        .margin({ top: 30, left: 50 /*200*/, bottom: 60, right: 50 })
        .mode("queue")
        .brushMode("1D-axes")
        //.reorderable()
        .on("brushend", function(d, a) {

          source.brushed = d;

          var state = source.states[a];

          self.updateFilterLayer(key);
          self.updateFilterLayerHistogram(key);

          var dimensions = d3.selectAll(".dimension")[0];
          var extent = d3.select(dimensions.filter(function(d) { return d.__data__ === a; })[0]).select(".extent");
          var bounds = source.coords.brushExtents()[a];

          if (bounds === undefined) {

            if (!self.areKeysDown(["Control"])) {
              return;
            }

            source.brushed  = [];
            state.propertyClamp = null;

            self.removeFilter(key, a);
          }

          var element = extent[0][0];
          var isPressed = false;

          var keyFunc =  (e) => {

            if (e.key === "Control") {

              if (e.ctrlKey) {

                if (isPressed) {
                  return;
                }

                isPressed = true;

                if (!element.classList.contains("zoom")) {
                  element.classList.add("zoom");
                }

              } else {

                if (!isPressed) {
                  return;
                }

                isPressed = false;

                if (element.classList.contains("zoom")) {
                  element.classList.remove("zoom");
                }
              }
            }
          }

          element.onmousedown = (e) => {

            if (e.ctrlKey) {

              var filter = {
                filterKey : a,
                filter : (value) => {
                    return value[a] > bounds[1] || value[a] < bounds[0];
                }
              };

              state.propertyClamp = bounds;

              self.addFilters(key, [filter]);
              e.stopPropagation();
            }

          };

          element.onfocus = (e) => {
            element.onkeydown = keyFunc;
            element.onkeyup = keyFunc;
          }

          element.onmouseover = (e) => {

            element.focus();

            if (e.ctrlKey) {
              if (!element.classList.contains("zoom")) {
                element.classList.add("zoom");
              }
            }

          };

          element.onmouseleave = (e) => {

            element.blur();

            if (element.classList.contains("zoom")) {
              element.classList.remove("zoom");
            }

          };

        })
        .render();

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

    if (!clear && (source.brushed.length !== source.values.length)) {

      source.brushed.forEach(d => {
        filter.push(d._id);
      });

    }

    self.map.setFilter(key + '-filter', filter);

    var popups = source.popups;

    while(popups[0]) {
      popups[0].remove();
    }

    source.selected.forEach(id => {
      self.map.setFeatureState({source : key, id : id }, {selected : false });
    });

    source.selected = [];

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

    self.updateFilterLayerController(key);
    self.updateFilterLayerHistogram(key);
    self.updateFilter(key);
    self.updateLegend();
  }

  addFilters(key, filters) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    filters.forEach(f => {
      source.filters[f.filterKey] = f.filter;
    });

    self.updateFilterLayerController(key);
    self.updateFilterLayer(key, true);
    self.updateFilterLayerPropertyStops(key);
    self.updateFilterLayerHistogram(key);
    self.updateFilter(key);
    self.updateLegend();
  }

  removeFilter(key, filterKey) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    if (source.filters[filterKey] !== undefined) {
      delete source.filters[filterKey];
    }

    self.updateFilterLayerController(key);
    self.updateFilterLayer(key, true);
    self.updateFilterLayerPropertyStops(key);
    self.updateFilterLayerHistogram(key);
    self.updateFilter(key);
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
      .color("#ffffff")
      .alpha(0.05)
      .render()
      .updateAxes();

    self.updateFilterLayerMapPaintProperties(key, null);

    d3.selectAll(".label")[0].forEach(other => {
      other.classList.remove("selected");
    });

    d3.selectAll(".label")[0].forEach(function(l) {

        if (l.hasEventListener) {
          return; // Note - only one listener per label ---
        }

        l.hasEventListener = true;

        l.addEventListener("click", function(e) {

          var property = l.innerHTML; // NOTE - this is the selection ---
          var state = source.states[property];
          var color = "#ffffff";
          var interval = state.propertyClamp !== undefined && state.propertyClamp !== null ? state.propertyClamp : state.propertyInterval;
          var func = d3.scale.quantile().domain(interval).range(state.propertyStyle);

          d3.selectAll(".label")[0].forEach(other => {
            if (other.innerHTML !== property) {
              other.classList.remove("selected");
            }
          });

          if (l.classList.contains("selected")) {
            l.classList.remove("selected");
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

          self.updateFilterLayerControllerSelection(key);
          self.updateFilterLayerMapPaintProperties(key, property);
          self.updateFilterLayerHistogram(key);
          self.updateLegend();

        });
    });
  }

  updateFilterLayerMapPaintProperties(key, property) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.coords === null) {
      return;
    }

    var paintProperties = [];

    if (property === undefined || property === null) {

      if (source.types.includes("LineString")) {

        paintProperties.push({
          id : key + "-filter",
          type : "line-color",
          paint : "#ffffff"
        });

      } else  if (source.types.includes("Polygon")) {

        paintProperties.push({
          id : key + "-filter",
          type :"fill-extrusion-color",
          paint : [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#ffffff",
            ["boolean", ["feature-state", "selected"], false],
            "#ffffff",
            "grey"
            ],
        });


      } else if (source.types.includes("Point")) {

        paintProperties.push({
          id : key + "-filter",
          type :"circle-color",
          paint : "#ffffff",
        });

        paintProperties.push({
          id : key + "-filter",
          type :"circle-stroke-color",
          paint : "#ffffff"
        });
      }

    } else {

      var state = source.states[property];
      var stops = state.propertyStops;
      var min = 0.5;
      var max = 3;

      if (source.types.includes("LineString")) {

        paintProperties.push({
          id : key + "-filter",
          type : "line-color",
          paint : {
            property : property,
            type : "interval",
            stops : stops
          }
        });

      } else  if (source.types.includes("Polygon")) {

        paintProperties.push({
          id : key + "-filter",
          type :"fill-extrusion-color",
          paint :  {
            property : property,
            type : "interval",
            stops : stops
          }
        });

      } else if (source.types.includes("Point")) {

        paintProperties.push({
          id : key + "-filter",
          type :"circle-color",
          paint : {
            property : property,
            type : "interval",
            stops : stops
          }
        });

        paintProperties.push({
          id : key + "-filter",
          type :"circle-stroke-color",
          paint : {
            property : property,
            type : "interval",
            stops : stops
          }
        });
      }

    }

    paintProperties.forEach(paintProperty => {
      map.setPaintProperty(paintProperty.id, paintProperty.type, paintProperty.paint);
    });

  }

  addFilterLayerhistogram(key, element) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null) {
      return;
    }

    source.hist = element;

    self.updateFilterLayerHistogram(key);
  }

  updateFilterLayerPropertyStops(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.hist === null) {
      return;
    }

    source.active = null;

    Object.keys(source.states).forEach(property => {

      var state = source.states[property];
      var stops = state.propertyStops;

      if (state.propertyClamp !== undefined && state.propertyClamp !== null) {

        var nstops = [];

        for (
          var i = state.propertyClamp[0], j=0;
          j < state.propertyStops.length;
          i += (state.propertyClamp[1] - state.propertyClamp[0]) / state.propertyStops.length, j++) {

            nstops.push([i, stops[j][1]]);
        }

        state.propertyStops = nstops;

      } else {

        var nstops = [];

        for (
          var i = state.propertyInterval[0], j=0;
          j < state.propertyStops.length;
          i += (state.propertyInterval[1] - state.propertyInterval[0]) / state.propertyStops.length, j++) {

            nstops.push([i, stops[j][1]]);
        }

        state.propertyStops = nstops;
      }

    });


  }

  updateFilterLayerHistogram(key) {

    var self = this;
    var source = self.sources[key];

    if (source === undefined || source === null || source.hist === null) {
      return;
    }

    var property = source.active;
    var data = source.brushed;
    var state = source.states[property];
    var element = source.hist;
    var bins = [];

    element.innerHTML = "";

    if (property === undefined || property === null ) {
      return; // NOTE - this for when no label is selected ---
    }

    state.propertyStops.forEach((s, i) => {

      bins.push({
        value : parseFloat(Math.round(s[0] * 100) / 100).toFixed(2),
        data : [],
        count : 0,
        index : i,
      });

    });

    //console.log(bins);

    if (data.length !== source.values.length) {

      data.forEach(d => {

        var index = 0;

        for (var i = 0; i < bins.length ; i++) {

          if (bins[i].value > d[property]) {
            break;
          }

          index = i;
        }

        bins[index].count+=1;
        bins[index].data.push(d);

      });
    }

    var margin = {top: 30, right: 40, bottom: 60, left: 40},
      width = element.clientWidth - margin.left - margin.right,
      height = element.clientHeight - margin.top - margin.bottom;

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

    x.domain(bins.map(function(d) { return d.value; }));
    y.domain([0, d3.max(bins, function(d) { return d.count; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)" );

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        //.attr("transform", "rotate(-90)")
        .attr("y", -25)
        //.attr("x", 10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("count");

    svg.selectAll("bar")
        .data(bins)
      .enter().append("rect")
        .style("fill", function(d) { return  state.propertyStops[d.index][1]; })
        .style("opacity", 0.8)
        .attr("x", function(d) { return x(d.value); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.count); })
        .attr("height", function(d) { return height - y(d.count); });
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

          var hprop = document.createElement("div");
          hprop.classList.add("legend-header-property");
          hprop.innerHTML = source.active;;

          header.appendChild(hkey);
          header.appendChild(hprop);

          div.appendChild(header);
          div.appendChild(content);

          legend.appendChild(div);

          var state = source.states[source.active];

          for (var i = 0; i< state.propertyStops.length; i++) {

            var item = document.createElement("div");
            item.classList.add("legend-item");

            var color = document.createElement("div");
            color.classList.add("legend-color");
            color.style.background = state.propertyStops[i][1];

            var value = document.createElement("div");
            value.classList.add("legend-value");
            value.innerHTML = parseFloat(Math.round(state.propertyStops[i][0] * 100) / 100).toFixed(2) ;;

            content.appendChild(item);

            item.appendChild(color);
            item.appendChild(value);

          }


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

   id : source + '-base',
   source : source,
   type: 'line',
   minzoom: 7,
   //maxzoom: 18,
   paint: {
     'line-opacity': 1,
     'line-color' : [
                 "case",
                 ["boolean", ["feature-state", "hover"], false],
                 "#ffffff",
                 ["boolean", ["feature-state", "selected"], false],
                 "#ffffff",
                  "rgba(100,100,100, 0.05)"
                ],
      'line-width' : [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  3,
                  ["boolean", ["feature-state", "selected"], false],
                  3,
                  2
                  ]
   }

 };
};

function buildGeoJeonLineStringBaseLayer(source) {
  return  {

      id : source + '-base',
      source : source,
      type: 'line',
      minzoom: 7,
      //maxzoom: 18,
      paint: {
        'line-opacity': 1,
        'line-color' : [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    "#ffffff",
                    ["boolean", ["feature-state", "selected"], false],
                    "#ffffff",
                     "rgba(255,255,255, 0.05)"
                   ],
         'line-width' : [
                     "case",
                     ["boolean", ["feature-state", "hover"], false],
                     3,
                     ["boolean", ["feature-state", "selected"], false],
                     3,
                     2
                     ]
      }

  };
}

function buildGeoJsonPointBaseLayer(source) {
  return {

    id : source + '-base',
    source : source,
    type : "circle",
    minzoom : 10,
    paint : {
        // Size circle radius by earthquake magnitude and zoom level
        "circle-radius":  [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 1,
            18, 2
        ],
        // Color circle by earthquake magnitude
        "circle-color": "rgba(100,100,100, 0.3)",
        "circle-stroke-color": "rgba(100,100,100, 0.3)",
        "circle-stroke-width": 0,
        // Transition from heatmap to circle layer by zoom level
        "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 0,
            8, 1
        ]
    }

  };
}

function buildGeoJsonPolygonFilterLayer(source, filter) {
  return {

   id : source + '-filter',
   source : source,
   type: 'fill-extrusion',
   filter : filter,
   paint: {
     'fill-extrusion-color':  [
               "case",
               ["boolean", ["feature-state", "hover"], false],
               "#ffffff",
               ["boolean", ["feature-state", "selected"], false],
               "#ffffff",
               "grey"
               ],
     'fill-extrusion-height': 0,
     'fill-extrusion-base': 0,
     'fill-extrusion-opacity': 0.8
   }

 };
};

function buildGeoJsonLineStringFilterLayer(source, filter) {
  return {

   id : source + '-filter',
   source : source,
   type: 'line',
   filter : filter,
   paint: {
       'line-color' : "#ffffff",
       'line-width': [
           "interpolate", ["linear"], ["zoom"],
           10, 1,
           20, 6
       ],
       'line-blur': 1
   }

 };
}

function buildGeoJsonPointFilterLayer(source, filter) {
  return {

    id : source + '-filter',
    source : source,
    type : "circle",
    filter : filter,
    minzoom : 10,
    paint : {
        // Size circle radius by earthquake magnitude and zoom level
        "circle-radius":  [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 0,
            18, 2
        ],
        // Color circle by earthquake magnitude
        "circle-color": "#ffffff", //"rgba(255,255,255, 0.1)",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
        // Transition from heatmap to circle layer by zoom level
        "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 0,
            8, 1
        ]
    }

  };
}

// function buildGeoJsonPointFilterLayer(source, filter) {
//   return {
//
//     id : source + '-filter',
//     source : source,
//     type: "heatmap",
//     filter : filter,
//     "paint": {
//       // Increase the heatmap weight based on frequency and property magnitude
//       // "heatmap-weight": [
//       //     "interpolate",
//       //     ["linear"],
//       //     ["get", "test"],
//       //     0, 0,
//       //     6, 1
//       // ],
//       //Increase the heatmap color weight weight by zoom level
//       //heatmap-intensity is a multiplier on top of heatmap-weight
//       "heatmap-intensity": [
//           "interpolate",
//           ["linear"],
//           ["zoom"],
//           0, 1,
//           9, 3
//       ],
//       // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
//       // Begin color ramp at 0-stop with a 0-transparancy color
//       // to create a blur-like effect.
//       "heatmap-color": [
//           "interpolate",
//           ["linear"],
//           ["heatmap-density"],
//           0, "rgba(255,255,255,0)",
//           0.2,"rgba(255,255,255,0)",
//           0.4,"rgba(255,255,255,0)",
//           0.6, "rgba(255,255,255,0.2)",
//           0.8, "rgba(255,255,255,1)",
//           1, "rgba(255,255,255,0.1)"
//       ],
//       // Adjust the heatmap radius by zoom level
//       "heatmap-radius": [
//           "interpolate",
//           ["linear"],
//           ["zoom"],
//           0, 10,
//           9, 20
//       ]
//       // Transition from heatmap to circle layer by zoom level
//       //"heatmap-opacity": 0.5
//     }
//
//   };
//}

function style(property) {

  var styles = {

    "default" :     ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"],
    "catchment" :   [ '#d74518', '#fdae61', '#5cb7cc', '#b7b7b7'],
    "far" :         ['#fff7f3', '#fcc5c0', '#f768a1', '#ae017e', '#49006a'],
    "density" :     ['#fff7f3','#c6dbef', '#6baed6', '#2171b5', '#08306b'],
    "betweenness" : colorbrewer.BuPu[9],
    "closeness" :   colorbrewer.PuBuGn[9],
    "proximity" :   colorbrewer.BuPu[9],
    "area" :        colorbrewer.BuPu[9],
    "angle" :       colorbrewer.BuPu[9],
    "orientation" : colorbrewer.BuPu[9],
    "vis" :         colorbrewer.RdBu[9],

  }

  var keys = Object.keys(styles);
  var key = keys[0];

  if (property in keys) {

    key = property;

  } else {

    for (var i = 0; i< keys.length; i++) {

      if (property.indexOf(keys[i]) !== -1) {
        key = keys[i];
      }
    }
  }

  return styles[key];

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

      var type = f.geometry.type;

      if (!(wrangled.types.includes(type))) {
        wrangled.types.push(type);
      }

      if (!("_id" in f.properties)) {
        f.properties["_id"] = i;
      }

      f.id = f.properties["_id"]; // geojson source specification ---

      f.properties['test'] = Math.random(); // NOTE - for unit testing on all types ---

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
