
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

const center = (data) => {
  return {
    center:[151.173,  -33.877] // TODO: write this bit + zoom ---
  }

};

const left = document.getElementById("left");
const bottom = document.getElementById("bottom");

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

function load(data, label) {

  console.log(data);

  var wrangled = wrangle(data);
  var filtered = ['in', '_id'];

  map.fitBounds(geojsonExtent(data));

  map.addSource(label, {
    type: 'geojson',
    data
  });

  // map.addLayer({
  //     "id": "heat",
  //     "type": "heatmap",
  //     "source": label,
  //     //"filter" : filtered,
  //     "paint": {
  //         // Increase the heatmap weight based on frequency and property magnitude
  //         // "heatmap-weight": [
  //         //     "interpolate",
  //         //     ["linear"],
  //         //     ["get", "test"],
  //         //     0, 0,
  //         //     6, 1
  //         // ],
  //         // Increase the heatmap color weight weight by zoom level
  //         // heatmap-intensity is a multiplier on top of heatmap-weight
  //         // "heatmap-intensity": [
  //         //     "interpolate",
  //         //     ["linear"],
  //         //     ["zoom"],
  //         //     0, 1,
  //         //     9, 3
  //         // ],
  //         // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
  //         // Begin color ramp at 0-stop with a 0-transparancy color
  //         // to create a blur-like effect.
  //         "heatmap-color": [
  //             "interpolate",
  //             ["linear"],
  //             ["heatmap-density"],
  //             0, "rgba(33,102,172,0)",
  //             0.2, "rgb(103,169,207)",
  //             0.4, "rgb(209,229,240)",
  //             0.6, "rgb(253,219,199)",
  //             0.8, "rgb(239,138,98)",
  //             1, "rgb(178,24,43)"
  //         ],
  //         // Adjust the heatmap radius by zoom level
  //         "heatmap-radius": 10,
  //         // Transition from heatmap to circle layer by zoom level
  //         "heatmap-opacity": 0.5
  //     }
  // });

  if (wrangled.types.includes("LineString")) {

    // map.addLayer( {
    //
    //     id : label + '-base',
    //     source : label,
    //     type: 'line',
    //     layout : {
    //         'line-cap': 'round',
    //         'line-join': 'round',
    //         //'visibility': 'none', // init with layer off ---
    //     },
    //     paint: {
    //         'line-color' :  {
    //             property : "_id",
    //             type: 'interval',
    //             stops : [[0, "rgba(255,255,255, 0.1)"]],
    //         },
    //         'line-width': [
    //             "interpolate", ["linear"], ["zoom"],
    //             10, 1,
    //             20, 6
    //         ],
    //     }
    //
    // });

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
      }

    });

  } else if (wrangled.types.includes("Polygon")) {

    // map.addLayer( {
    //
    //   id : label + '-base',
    //   source : label,
    //   type: 'fill',
    //   paint: {
    //     'fill-color': "rgba(255,255,255, 0.1)",
    //     'fill-opacity': 1,
    //     'fill-outline-color' : "rgba(255,255,255, 0.3)"
    //   }
    //
    // });

    map.addLayer( {

      id : label + '-filter',
      source : label,
      type: 'fill-extrusion',
      filter : filtered,
      paint: {
        'fill-extrusion-color': "#ffffff",
        'fill-extrusion-height': 1,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 1
      }

    });

  }

  var box = document.createElement("div");
  box.classList.add("box");
  bottom.appendChild(box);

  var parcoords = d3.parcoords()(box)
      .data(wrangled.values)
      .hideAxis(["_id"])
      .color(function(d) { return "#ffffff"; })
      .alpha(0.05)
      //.composite("darken")
      .margin({ top: 50, left: 50 /*200*/, bottom: 60, right: 50 })
      .mode("queue")
      .brushMode("1D-axes")
      .reorderable()
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
        //map.setLayoutProperty(label + "-base", 'visibility', 'visible');
        map.setLayoutProperty(label + "-filter", 'visibility', 'visible');

      } else {

        docContent.classList.add("collapsed");
        docLabel.innerHTML = " + " + label;
        //map.setLayoutProperty(label + "-base", 'visibility', 'none');
        map.setLayoutProperty(label + "-filter", 'visibility', 'none');
      }
  });

  var properties = Object.keys(wrangled.properties);

  properties.forEach(property => {

    buildProperty(wrangled, property, properties, label, parcoords);
  });
}

// load the data and create  ---
function buildProperty(wrangled, property, properties, label, parcoords) {

  var propertyDiv = document.createElement("div");
  var propertyStop = 4;
  var propertyStops = [];
  var propertyInterval = wrangled.properties[property];
  var propertyRange = propertyInterval[1] - propertyInterval[0];
  var propertyColors = [ '#d74518', '#fdae61', '#5cb7cc', '#b7b7b7']

  for (var i = 0; i< propertyStop; i++) {
    propertyStops.push([propertyInterval[0] + ( i * (propertyRange / propertyStop) ), propertyColors[i]]);
  }

  propertyDiv.id = label + "-" + property;
  propertyDiv.classList.add("document-item");

  var propertyCheckBox = document.createElement("input");
  propertyCheckBox.setAttribute("type", "checkbox");
  propertyCheckBox.setAttribute("checked", true);

  var propertyLabel = document.createElement("div");
  propertyLabel.innerHTML = property;
  propertyLabel.classList.add("document-item-label");

  propertyDiv.appendChild(propertyLabel);

  var colorFunc = d3.scale.quantile()
  .domain(propertyInterval)
  .range(propertyColors);

  document.getElementById(label + "-content").appendChild(propertyDiv);

  propertyLabel.addEventListener("click", (e) => {

    console.log(property);

    properties.forEach(p => {

      if (p === property) {

        return;
      }

      var pDiv = document.getElementById(label + "-" + p);

      if (pDiv !== undefined) {
        pDiv.classList.remove("selected");
      }

    });

    if (propertyDiv.classList.contains("selected")) {

      parcoords
        .color(function(d) { return "#ffffff"; })
        .alpha(0.05)
        .render();

      propertyDiv.classList.remove("selected");

      if (wrangled.types.includes("LineString")) {

        map.setPaintProperty(label + '-filter', 'line-color', {
          'property' : "_id",
          'type': 'interval',
          'stops' : [[0,  "#ffffff"]],
        });

      } else  if (wrangled.types.includes("Polygon")) {

        map.setPaintProperty(label + '-filter', 'fill-extrusion-color', {
          'property' : "_id",
          'type': 'interval',
          'stops' : [[0,  "#ffffff"]],
        });

      }

    } else {

      parcoords
        .color(function(d) { return colorFunc(d[property]); })
        .alpha(0.05)
        .render();  // quantitative color scale

      propertyDiv.classList.add("selected");

      if (wrangled.types.includes("LineString")) {

        map.setPaintProperty(label + '-filter', 'line-color', {
          'property' : property,
          'type': 'interval',
          'stops' : propertyStops,
        });

      } else  if (wrangled.types.includes("Polygon")) {

        map.setPaintProperty(label + '-filter', 'fill-extrusion-color', {
          'property' : property,
          'type': 'interval',
          'stops' : propertyStops,
        });

      }
    }

  });
}
