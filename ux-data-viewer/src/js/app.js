
mapboxgl.accessToken = 'pk.eyJ1IjoiamFnZ3lsdWlzIiwiYSI6ImNqcmdrdWRyNzFlenQ0M3BvODZ6ZjJwcnUifQ.T8htDIqiD0Vy8WOEE7ZssQ';

const config = {
  styles: {
    dark :'mapbox://styles/jaggyluis/cjrr3l2ic5lof2tudprimhuqd',
    darkMin : 'mapbox://styles/jaggyluis/cjrgq87564xvi2ssd9oozs5rc',
    minimo : 'mapbox://styles/jaggyluis/cjrijwv518g322spjh1cvb7t2',

  }
}

const map = new mapboxgl.Map({
    container: 'map',
    style: config.styles.dark,
    zoom: 0.1
});

const interface = document.getElementById("interface");
const left = document.getElementById("left");
const bottom = document.getElementById("bottom");
const scroll = document.getElementById("bottom-scroll-pane");

const source = {};

var down = false;
var top = left.clientHeight;

left.addEventListener("mousedown", e=> {
  down = true;
});

document.addEventListener("mousemove", e=> {
  if (down) {
    bottom.style.height = interface.clientHeight - left.clientHeight + "px";
  }
});

document.addEventListener("mouseup", e=> {
  if (down) {
    down = false;
  }
});


run();

// -------------------------------
// utils ---

// run the application drag listeners ---
function run() {

  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success!
    function handleJSONDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      var files = evt.dataTransfer.files;
        // Loop through the FileList and read
        for (var i = 0, f; f = files[i]; i++) {

          var ext = f.name.split('.').pop();

          // Only process geojson files.
          if (ext !== "geojson") {
            continue;
          }

          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onload = (function(theFile) {

            return function(e) {
              load(JSON.parse(e.target.result), theFile.name);
            };

          })(f);

          reader.readAsText(f);
        }
    }

    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // Setup the dnd listeners.
    var dropZone = document.getElementsByTagName('body')[0];
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleJSONDrop, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function createPropertyState(property, wrangled) {

  var propertyDiv = document.createElement("div");
  var propertyStops = [];
  var propertyInterval = wrangled.properties[property];
  var propertyRange = propertyInterval[1] - propertyInterval[0];
  var propertyStyle = style(property);
  var propertyStop = propertyStyle.length;

  for (var i = 0; i< propertyStop; i++) {
    propertyStops.push([propertyInterval[0] + ( i * (propertyRange / propertyStop) ), propertyStyle[i]]);
  }

  return {
    propertyDiv : propertyDiv,
    propertyStops : propertyStops,
    propertyInterval : propertyInterval,
    propertyRange : propertyRange,
    propertyStyle : propertyStyle,
    propertyStop : propertyStop
  }

}

function load(data, label) {

  console.log(data);

  var wrangled = wrangle(data);
  var filtered = ['in', '_id'];

  var properties = Object.keys(wrangled.properties);
  var propertyStates = {};

  properties.sort();
  properties.forEach(property => {
    propertyStates[property] = createPropertyState(property, wrangled);
  });

  source[label] = {
    data : data,
    states : propertyStates
  }

  var base = turf.buffer(wrangled.data.features[0], 10, {units: 'miles'});
  var bounds = geojsonExtent(base);

  if (Object.keys(source).length === 1) {
    map.fitBounds(bounds); // NOTE - only center once ---
  }

  map.addSource(label, {
    type: 'geojson',
    data
  });

  if (wrangled.types.length > 1) {
    alert("geojson file contains multiple geometry types, which may produce unwanted results.")
  }

  if (wrangled.types.includes("LineString")) {

    map.addLayer( {

        id : label + '-base',
        source : label,
        type: 'line',
        layout : {
            'line-cap': 'round',
            'line-join': 'round',
            //'visibility': 'none', // init with layer off ---
        },
        paint: {
            'line-color' :  {
                property : "_id",
                type: 'interval',
                stops : [[0, "rgba(255,255,255, 0.05)"]],
            },
            'line-width': [
                "interpolate", ["linear"], ["zoom"],
                10, 1,
                20, 6
            ],
        }

    });

    map.addLayer( {

      id : label + '-filter',
      source : label,
      type: 'line',
      filter : filtered,
      layout : {
          'line-cap': 'round',
          'line-join': 'round',
      },
      paint: {
          'line-color' :  {
              property : "_id",
              type: 'interval',
              stops : [[0, "#ffffff"]],
          },
          'line-width': [
              "interpolate", ["linear"], ["zoom"],
              10, 1,
              20, 6
          ],
          'line-blur': 2
      }

    });

  } else if (wrangled.types.includes("Polygon")) {

    map.addLayer( {

      id : label + '-base',
      source : label,
      type: 'fill',
      paint: {
        'fill-color': "rgba(255,255,255, 0.05)",
        'fill-opacity': 1,
        'fill-outline-color' : "rgba(255,255,255, 0.1)"
      }

    });

    map.addLayer( {

      id : label + '-filter',
      source : label,
      type: 'fill-extrusion',
      filter : filtered,
      paint: {
        'fill-extrusion-color': "#ffffff",
        'fill-extrusion-height': 1,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }

    });

  } else if (wrangled.types.includes("Point")) {

    map.addLayer({
      id : label + '-base',
      source : label,
      "type": "circle",
      "minzoom": 7,
      "paint": {
          // Size circle radius by earthquake magnitude and zoom level
          "circle-radius": 1,
          // Color circle by earthquake magnitude
          "circle-color": "rgba(255,255,255, 0.1)",
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
    });

    map.addLayer({
      id : label + '-filter',
      source : label,
      "type": "heatmap",
      "paint": {
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
            0, "rgba(255,255,255,0)",
            0.2,"rgba(255,255,255,0)",
            0.4,"rgba(255,255,255,0)",
            0.6, "rgba(255,255,255,0.5)",
            0.8, "rgba(255,255,255,1)",
            1, "rgba(255,255,255,0.5)"
        ],
        // Adjust the heatmap radius by zoom level
        "heatmap-radius": 20,
        // Transition from heatmap to circle layer by zoom level
        "heatmap-opacity": 0.5
      }
    });

    // point always on top ---
    map.moveLayer( label + '-base');
    map.moveLayer( label + '-filter');

  }

  var box = document.createElement("div");
  box.classList.add("box");
  box.classList.add("document");
  scroll.appendChild(box);

  var boxLabel = document.createElement("div");
  boxLabel.classList.add("box-label");
  boxLabel.id = label + "-box";
  boxLabel.innerHTML = label;
  box.appendChild(boxLabel);

  var boxItem = document.createElement("div");
  boxItem.classList.add("box-item");
  boxItem.id = label + "-box-item";
  box.appendChild(boxItem);

  var dimensions = [];

  Object.keys(wrangled.properties).forEach(p => {

      if (!(p === "_id")) { // set the baseline parcoords to just be _id ---
        dimensions.push(p);
      }
  });

  var parcoords = d3.parcoords()(boxItem)
      .data(wrangled.values)
      .hideAxis(dimensions)
      .color(function(d) { return "#ffffff"; })
      .alpha(0.05)
      //.composite("darken")
      .margin({ top: 30, left: 50 /*200*/, bottom: 60, right: 50 })
      .mode("queue")
      .brushMode("1D-axes")
      //.reorderable()
      .on("brushend", function(d) {

        var f = ['in', '_id'];

        if (d.length !== wrangled.values.length) {
          d.forEach(e => {
            f.push(e._id);
          });
        }

        map.setFilter(label + '-filter', f);

      })
      .render();

  var doc = document.createElement("div");
  doc.classList.add("document");

  var docLabel = document.createElement("div");
  docLabel.classList.add("document-label");
  docLabel.id = label + "-label";
  docLabel.innerHTML = " - " + label;

  var docContent = document.createElement("div");
  docContent.classList.add("document-content");
  docContent.id = label + "-content";

  doc.appendChild(docLabel);
  doc.appendChild(docContent);

  left.appendChild(doc);

  docLabel.addEventListener("click", e => {

      if (docContent.classList.contains('collapsed')) {

        docContent.classList.remove("collapsed");
        docLabel.innerHTML = " - " + label;

        box.classList.remove("collapsed");

        map.setLayoutProperty(label + "-base", 'visibility', 'visible');
        map.setLayoutProperty(label + "-filter", 'visibility', 'visible');

      } else {

        docContent.classList.add("collapsed");
        docLabel.innerHTML = " + " + label;

        box.classList.add("collapsed");

        map.setLayoutProperty(label + "-base", 'visibility', 'none');
        map.setLayoutProperty(label + "-filter", 'visibility', 'none');
      }
  });

  properties.forEach(property => {

    var propertyDiv = document.createElement("div");
    propertyDiv.id = label + "-" + property;
    propertyDiv.classList.add("document-item");

    var propertyCheckBox = document.createElement("input");
    propertyCheckBox.setAttribute("type", "checkbox");

    var propertyLabel = document.createElement("div");
    propertyLabel.innerHTML = property;
    propertyLabel.classList.add("document-item-label");

    if (property === "_id") {
      propertyCheckBox.setAttribute("checked", true);
      propertyLabel.classList.add("selected");
    }

    propertyDiv.appendChild(propertyCheckBox);
    propertyDiv.appendChild(propertyLabel);
    docContent.appendChild(propertyDiv);

    propertyCheckBox.addEventListener("click", (e) => {

      if (property === "_id") { // prevent 0 dimension errors ---
        e.target.checked = true;
        return;
      }

      if (e.target.checked) {

        var index = dimensions.indexOf(property);

        if (index >= 0) {
          dimensions.splice(index, 1);
        }

        propertyLabel.classList.add("selected");

      } else {

        dimensions.push(property);
        propertyLabel.classList.remove("selected");
      }

      map.setFilter(label + '-filter', ["in", "_id"]);
      parcoords.hideAxis(dimensions).render().updateAxes();

      updateLabels();
    });
  });

  function updateLabels() {

    parcoords
      .color("#ffffff")
      .alpha(0.05)
      .render();

    d3.selectAll(".label")[0].forEach(other => {

      other.classList.remove("selected");

    });

    d3.selectAll(".label")[0].forEach(function(l) {

        if (l.hasEventListener) {
          return;
        }

        l.hasEventListener = true;

        l.addEventListener("click", function(e) {

          var property = l.innerHTML;
          var propertyState = propertyStates[property];

          console.log(property);

          var _color = "#ffffff";
          var _property = "_id";
          var _stops = [[0, "#ffffff"]];
          var _type = "line-color";
          var _func = d3.scale.quantile().domain(propertyState.propertyInterval).range(propertyState.propertyStyle);

          d3.selectAll(".label")[0].forEach(other => {

            if (other.innerHTML === property) {
              return;
            }

            other.classList.remove("selected");

          });

          if (l.classList.contains("selected")) {

            l.classList.remove("selected");

            // keep all the colors the default ---

          } else {

            l.classList.add("selected");

            _color = function(d) { return _func(d[property]); };
            _property = property;
            _stops = propertyState.propertyStops;
          }

          // geometry type switch ---
          if (wrangled.types.includes("LineString")) {
            _type = "line-color";

          } else  if (wrangled.types.includes("Polygon")) {
            _type = "fill-extrusion-color";

          } else if (wrangled.types.includes("Point")) {
            _type = null;
          }

          if (_type === null) {
            return; //TODO - make the handler for points ---
          }

          parcoords
            .color(_color)
            .alpha(0.05)
            .render();

          map.setPaintProperty(label + '-filter', _type, {
            'property' : _property,
            'type': 'interval',
            'stops' : _stops,
          });

        });
    });
  }
}
