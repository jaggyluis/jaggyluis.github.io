
mapboxgl.accessToken = 'pk.eyJ1IjoiamFnZ3lsdWlzIiwiYSI6ImNqcmdrdWRyNzFlenQ0M3BvODZ6ZjJwcnUifQ.T8htDIqiD0Vy8WOEE7ZssQ';

const config = {
  styles: {
    dark : 'mapbox://styles/jaggyluis/cjrgq87564xvi2ssd9oozs5rc',
    minimo : 'mapbox://styles/jaggyluis/cjrijwv518g322spjh1cvb7t2'
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
  var buffered = turf.buffer(data, 10, {units: 'miles'});

  console.log(buffered);

  // setup the feature value property for extrusion and clustering ---
  data.features.forEach(feature => {
    feature.properties.ssvalue = 0;
  })

  map.fitBounds(geojsonExtent(data));

  map.addSource('gis', {
    type: 'geojson',
    data
  });

  // map.getSource('gis').setData(data); // NOTE - use this to update on the fly ---
  // map.setLayoutProperty(property, 'visibility', 'none || visible'); // NOTE - use this to toggle layout visibility ---

  map.addLayer( {

      id : 'base',
      source : 'gis',
      type: 'line',
      layout : {
          'line-cap': 'round',
          'line-join': 'round',
      },
      paint: {
          'line-color' :  {
              property : "_id",
              type: 'interval',
              stops : [[0, "rgba(255,255,255, 0.1)"]],
          },
          'line-width': [
              "interpolate", ["linear"], ["zoom"],
              10, 1,
              20, 6
          ],
      }

  });

  map.addLayer( {

      id : 'filter-lines',
      source : 'gis',
      type: 'line',
      filter : filtered,
      layout : {
          'line-cap': 'round',
          'line-join': 'round',
          //'visibility': 'none', // init with layer off ---
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

  map.addLayer( {

      id : 'filter-geom',
      source : 'gis',
      type: 'fill-extrusion',
      filter : filtered,
      paint: {
        'fill-extrusion-color': "#ffffff",
        'fill-extrusion-height': 1,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 1
      }

  });

  var box = document.createElement("div");
  box.classList.add("box");
  bottom.appendChild(box);

  var parcoords = d3.parcoords()(box)
      .data(wrangled.data)
      .hideAxis(["_id", "ssvalue"])
      .color(function (d) { return "rgba(255,255,255, 0.1)"; })
      .alpha(function (d) { return 0.1; })
      .composite("darken")
      .margin({ top: 50, left: 50 /*200*/, bottom: 60, right: 50 })
      .mode("queue")
      .brushMode("1D-axes")
      .render()
      .reorderable()
      .on("brushend", function(d) {

        var f = ['in', '_id'];

        if (d.length !== wrangled.data.length) {
          d.forEach(e => {
            f.push(e._id);
          });
        }

        map.setFilter('filter-lines', f);
        map.setFilter('filter-geom', f);

      });

  var doc = document.createElement("div");
  doc.classList.add("document");

  var docLabel = document.createElement("div");
  docLabel.classList.add("document-label");
  docLabel.id = label + "-label";
  docLabel.innerHTML = label;

  var docContent = document.createElement("div");
  docContent.classList.add("document-content");
  docContent.id = label + "-content";

  doc.appendChild(docLabel);
  doc.appendChild(docContent);

  left.appendChild(doc);

  var properties = Object.keys(wrangled.properties);

  properties.forEach(property => {

    buildLayer(data, wrangled, property, properties, label);
  });
}

// load the data and create a new layer ---
function buildLayer(data, wrangled, property, properties, label) {

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

  var propertySlider = document.createElement("div");
  $(propertySlider).slider({
    range: "min",
    value: 1,
    min: 0,
    max: 10,
    slide: function( event, ui ) {
        $( "#amount" ).val( ui.value );
        $(this).find('.ui-slider-handle').text(ui.value);
    },
    create: function(event, ui) {
        var v=$(this).slider('value');
        $(this).find('.ui-slider-handle').text(v);
    }
  });

  //propertyDiv.appendChild(propertyCheckBox);
  propertyDiv.appendChild(propertyLabel);
  propertyDiv.appendChild(propertySlider);

  document.getElementById(label + "-content").appendChild(propertyDiv);

  // map.addLayer( {
  //
  //     id : property,
  //     source : 'gis',
  //     type: 'line',
  //     // filter : ['>=', '_far', 0],
  //     layout : {
  //         'line-cap': 'round',
  //         'line-join': 'round',
  //         'visibility': 'none', // init with layer off ---
  //     },
  //     paint: {
  //         'line-color' :  {
  //             property : property,
  //             type: 'interval',
  //             stops : propertyStops,
  //         },
  //         'line-width': [
  //             "interpolate", ["linear"], ["zoom"],
  //             10, 1,
  //             20, 6
  //         ],
  //     }
  //
  // });

  propertyLabel.addEventListener("click", (e) => {

    console.log(property);

    properties.forEach(p => {

      var pDiv = document.getElementById(label + "-" + p);

      if (pDiv !== undefined) {
        pDiv.classList.remove("selected");
      }

    });

    propertyDiv.classList.add("selected");

    data.features.forEach(feature => {
        feature.properties.ssvalue = ((feature.properties[property] - propertyInterval[0] ) / propertyRange) * 1000;
    });

    map.getSource('gis').setData(data);

    map.setPaintProperty('filter-lines', 'line-color', {
      'property' : property,
      'type': 'interval',
      'stops' : propertyStops,
    });

    map.setPaintProperty('filter-geom', 'fill-extrusion-color', {
      'property' : property,
      'type': 'interval',
      'stops' : propertyStops,
    });

    map.setPaintProperty('filter-geom', 'fill-extrusion-height', {
      'property' : 'ssvalue', // property
      'type' : 'identity',
    });

  });
}
