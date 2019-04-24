
export default class MapStyleBuilder {

  constructor() {
    //TODO - define global colors + color ranges...
  }

  buildGeoJsonPolygonInteractionLayer(source) {
    return {

     id : source.source + '-interaction',
     source : source.source,
     type: 'line',
     minzoom: 0,
     filter : source.filtered,
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

  buildGeoJsonPolygonPropertyLayer(source, flat) {
    return {

     id : source.source + '-property',
     source : source.source,
     type: 'fill-extrusion',
     minzoom: 0,
     filter : source.filtered,
     paint: {
       'fill-extrusion-color':  [
                 "case",
                 ["boolean", ["feature-state", "hover"], false],
                 "#000000",
                 ["boolean", ["feature-state", "selected"], false],
                 "#000000",
                 "#e5e5e5"
                 ],
       'fill-extrusion-height': flat ? 0 : ["get", source.height],
       'fill-extrusion-base': flat ? 0 : ["get", source.base],
       'fill-extrusion-opacity': 0.8,
       'fill-extrusion-vertical-gradient' : true
     }

   };
  };

  buildGeoJsonLineStringInteractionLayer(source) {
    return  {

        id : source.source + '-interaction',
        source : source.source,
        type: 'line',
        minzoom: 0,
        filter : source.filtered,
        paint: {
          'line-blur': 0.5,
          'line-opacity': [
                      "case",
                      ["boolean", ["feature-state", "hover"], false],
                      1,
                      ["boolean", ["feature-state", "selected"], false],
                      1,
                      0],
          'line-color' : "#000000",
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

  buildGeoJsonLineStringPropertyLayer(source) {
    return {

     id : source.source + '-property',
     source : source.source,
     type: 'line',
     minzoom: 0,
     filter : source.filtered,
     paint: {
         'line-color' : "#e5e5e5",
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

  buildGeoJsonPointInteractionLayer(source) {
    return {

      id : source.source + '-interaction',
      source : source.source,
      type : "circle",
      minzoom : 0,
      filter : source.filtered,
      paint : {
          "circle-radius": 5,
          "circle-color": "#000000",
          "circle-stroke-width": 0,
          "circle-opacity":[
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    1,
                    ["boolean", ["feature-state", "selected"], false],
                    1,
                    0
                    ],
      }

    };
  }

  buildGeoJsonPointPropertyLayer(source) {
    return {

      id : source.source + '-property',
      source : source.source,
      type : "circle",
      filter : source.filtered,
      minzoom : 0,
      paint : {
          "circle-radius": 2,
          "circle-color": "#e5e5e5",
          "circle-stroke-width": 0,
          "circle-opacity": 0.5
      }

    };
  }

  buildMapBoxDrawLayerStyle() {
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
            'fill-color': 'black', //'#404040',
            'fill-outline-color': 'black', //#404040',
            'fill-opacity': 0 // 0.1
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
            'line-color': 'black', //'#404040',
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
            'line-color': 'black', //'#404040',
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
            'circle-color': 'black', //'#404040'
        }
    }];
  }
}
