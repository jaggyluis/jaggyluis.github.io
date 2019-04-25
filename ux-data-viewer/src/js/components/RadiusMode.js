// custom mapbopx-gl-draw mode that modifies draw_line_string
// shows a center point, radius line, and circle polygon while drawing
// forces draw.create on creation of second vertex

// import MapboxDraw from 'mapbox-gl-draw';
// import numeral from 'numeral';
// import lineDistance from 'npm:@turf/line-distance';

var Constants = {
  classes: {
    CONTROL_BASE: 'mapboxgl-ctrl',
    CONTROL_PREFIX: 'mapboxgl-ctrl-',
    CONTROL_BUTTON: 'mapbox-gl-draw_ctrl-draw-btn',
    CONTROL_BUTTON_LINE: 'mapbox-gl-draw_line',
    CONTROL_BUTTON_POLYGON: 'mapbox-gl-draw_polygon',
    CONTROL_BUTTON_POINT: 'mapbox-gl-draw_point',
    CONTROL_BUTTON_TRASH: 'mapbox-gl-draw_trash',
    CONTROL_BUTTON_COMBINE_FEATURES: 'mapbox-gl-draw_combine',
    CONTROL_BUTTON_UNCOMBINE_FEATURES: 'mapbox-gl-draw_uncombine',
    CONTROL_GROUP: 'mapboxgl-ctrl-group',
    ATTRIBUTION: 'mapboxgl-ctrl-attrib',
    ACTIVE_BUTTON: 'active',
    BOX_SELECT: 'mapbox-gl-draw_boxselect'
  },
  sources: {
    HOT: 'mapbox-gl-draw-hot',
    COLD: 'mapbox-gl-draw-cold'
  },
  cursors: {
    ADD: 'add',
    MOVE: 'move',
    DRAG: 'drag',
    POINTER: 'pointer',
    NONE: 'none'
  },
  types: {
    POLYGON: 'polygon',
    LINE: 'line_string',
    POINT: 'point'
  },
  geojsonTypes: {
    FEATURE: 'Feature',
    POLYGON: 'Polygon',
    LINE_STRING: 'LineString',
    POINT: 'Point',
    FEATURE_COLLECTION: 'FeatureCollection',
    MULTI_PREFIX: 'Multi',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon'
  },
  modes: {
    DRAW_LINE_STRING: 'draw_line_string',
    DRAW_POLYGON: 'draw_polygon',
    DRAW_POINT: 'draw_point',
    SIMPLE_SELECT: 'simple_select',
    DIRECT_SELECT: 'direct_select',
    STATIC: 'static'
  },
  events: {
    CREATE: 'draw.create',
    DELETE: 'draw.delete',
    UPDATE: 'draw.update',
    SELECTION_CHANGE: 'draw.selectionchange',
    MODE_CHANGE: 'draw.modechange',
    ACTIONABLE: 'draw.actionable',
    RENDER: 'draw.render',
    COMBINE_FEATURES: 'draw.combine',
    UNCOMBINE_FEATURES: 'draw.uncombine'
  },
  updateActions: {
    MOVE: 'move',
    CHANGE_COORDINATES: 'change_coordinates'
  },
  meta: {
    FEATURE: 'feature',
    MIDPOINT: 'midpoint',
    VERTEX: 'vertex'
  },
  activeStates: {
    ACTIVE: 'true',
    INACTIVE: 'false'
  },
  interactions: [
    'scrollZoom',
    'boxZoom',
    'dragRotate',
    'dragPan',
    'keyboard',
    'doubleClickZoom',
    'touchZoomRotate'
  ],
  LAT_MIN: -90,
  LAT_RENDERED_MIN: -85,
  LAT_MAX: 90,
  LAT_RENDERED_MAX: 85,
  LNG_MIN: -270,
  LNG_MAX: 270
};

var CommonSelectors = {
  isOfMetaType: function(type) {
    return function(e) {
      const featureTarget = e.featureTarget;
      if (!featureTarget) return false;
      if (!featureTarget.properties) return false;
      return featureTarget.properties.meta === type;
    };
  },
  isShiftMousedown: function(e) {
    if (!e.originalEvent) return false;
    if (!e.originalEvent.shiftKey) return false;
    return e.originalEvent.button === 0;
  },
  isActiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isInactiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  noTarget: function(e) {
    return e.featureTarget === undefined;
  },
  isFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isVertex: function(e) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === Constants.meta.VERTEX;
  },
  isShiftDown: function(e) {
    if (!e.originalEvent) return false;
    return e.originalEvent.shiftKey === true;
  },
  isEscapeKey: function(e) {
    return e.keyCode === 27;
  },
  isEnterKey: function(e) {
    return e.keyCode === 13;
  },
  true: function() {
    return true;
  }
};

const RadiusMode = MapboxDraw.modes.draw_line_string;

var lineDistance = turf.length; // lineDistance is deprecated

function createVertex(parentId, coordinates, path, selected) {
  return {
    type: 'Feature',
    properties: {
      meta: 'vertex',
      parent: parentId,
      coord_path: path,
      active: (selected) ? 'true' : 'false',
    },
    geometry: {
      type: 'Point',
      coordinates,
    },
  };
}

// create a circle-like polygon given a center point and radius
// https://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js/39006388#39006388
function createGeoJSONCircle(center, radiusInKm, parentId, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInKm;

  const ret = [];
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta;
  let x;
  let y;
  for (let i = 0; i < points; i += 1) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
    properties: {
      parent: parentId,
      active: 'true',
    },
  };
}

function getDisplayMeasurements(feature) {
  // should log both metric and standard display strings for the current drawn feature


  // metric calculation
  const drawnLength = (lineDistance(feature) * 1000); // meters

  let metricUnits = 'm';
  let metricFormat = '0,0';
  let metricMeasurement;

  let standardUnits = 'feet';
  let standardFormat = '0,0';
  let standardMeasurement;

  metricMeasurement = drawnLength;
  if (drawnLength >= 1000) { // if over 1000 meters, upgrade metric
    metricMeasurement = drawnLength / 1000;
    metricUnits = 'km';
    metricFormat = '0.00';
  }

  standardMeasurement = drawnLength * 3.28084;
  if (standardMeasurement >= 5280) { // if over 5280 feet, upgrade standard
    standardMeasurement /= 5280;
    standardUnits = 'mi';
    standardFormat = '0.00';
  }

  const displayMeasurements = {
    metric: `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`,
    standard: `${numeral(standardMeasurement).format(standardFormat)} ${standardUnits}`,
  };

  return displayMeasurements;
}

const doubleClickZoom = {
  enable: (ctx) => {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
};

RadiusMode.onSetup = function(opts) { // taken directly from draw_line_string ---
  opts = opts || {};
  const featureId = opts.featureId;
  const centroidId = opts.centroidId;

  let circle, centroid, line, currentVertexPosition;
  let direction = 'forward';
  if (featureId) {
    circle = this.getFeature(featureId);
    centroid = this.getFeature(circle.properties.centroid);

    line = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: [centroid.coordinates]
      }
    });
    currentVertexPosition = 1;

    this.deleteFeature([featureId], { silent: true });
    this.deleteFeature([circle.properties.centroid], { silent: true });
    this.addFeature(line);

  } else if (centroidId) {
    centroid = this.getFeature(centroidId);
    circle = this.getFeature(centroid.properties.circle);

    line = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: [centroid.coordinates]
      }
    });
    currentVertexPosition = 1;

    this.deleteFeature([centroidId], { silent: true });
    this.deleteFeature([centroid.properties.circle], { silent: true });
    this.addFeature(line);

  } else {
    line = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: []
      }
    });
    currentVertexPosition = 0;
    this.addFeature(line);
  }

  this.clearSelectedFeatures();
  // doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.LINE);
  this.setActionableState({
    trash: true
  });

  this.map.getCanvas().style.cursor = 'crosshair';
  this.map.fire('draw.modechange', {
    mode : "radius",
  });

  return {
    line,
    currentVertexPosition,
    direction
  };
};

RadiusMode.clickAnywhere = function(state, e) {
  // this ends the drawing after the user creates a second point, triggering this.onStop
  if (state.currentVertexPosition === 1) {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    return this.changeMode('simple_select', { featureIds: [state.line.id] });
  }
  this.updateUIClasses({ mouse: 'add' });
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  if (state.direction === 'forward') {
    state.currentVertexPosition += 1; // eslint-disable-line
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  } else {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
  }

  return null;
};

// creates the final geojson point feature with a radius property
// triggers draw.create
RadiusMode.onStop = function(state) {
  //doubleClickZoom.enable(this);

  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) {

    this.map.fire('draw.update', {
      features: [],
    });

    this.map.getCanvas().style.cursor = '';

    return;
  }
  // remove last added coordinate
  state.line.removeCoordinate('0');
  if (state.line.isValid()) {
    const lineGeoJson = state.line.toGeoJSON();
    // reconfigure the geojson line into a geojson point with a radius property
    // const pointWithRadius = {
    //   type: 'Feature',
    //   geometry: {
    //     type: 'Point',
    //     coordinates: lineGeoJson.geometry.coordinates[0],
    //   },
    //   properties: {
    //     radius: (lineDistance(lineGeoJson) * 1000).toFixed(1),
    //   },
    // };
    const pointWithRadius = createGeoJSONCircle(lineGeoJson.geometry.coordinates[0], (lineDistance(lineGeoJson)), null, 256);
    const centroid = this.newFeature({
      type: "Feature",
      properties: {
        meta: "centroid"
      },
      geometry: {
        type: "Point",
        coordinates: lineGeoJson.geometry.coordinates[0]
      }
    });
    const circle = this.newFeature({
      type: "Feature",
      properties: {
        isCircle: true,
        meta: "radius",
        centroid: centroid.id
      },
      geometry: {
        type: "Polygon",
        coordinates: pointWithRadius.geometry.coordinates
      }
    });

    centroid.properties.circle = circle.id;

    this.addFeature(circle);
    this.addFeature(centroid)

    this.map.fire('draw.create', {
      features: [circle, centroid],
    });

    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode('simple_select', {}, { silent: true });

    this.map.getCanvas().style.cursor = '';

  } else {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode('simple_select', {}, { silent: true });

    this.map.getCanvas().style.cursor = '';
  }
};

RadiusMode.onMouseMove = function(state, e) { // taken directly from draw_line_string ---
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({ mouse: Constants.cursors.POINTER });
  }
};

RadiusMode.toDisplayFeatures = function(state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = (isActiveLine) ? 'true' : 'false';
  if (!isActiveLine) return display(geojson);

  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return null;
  geojson.properties.meta = 'feature';

  const displayMeasurements = getDisplayMeasurements(geojson);

  geojson.properties.datum = displayMeasurements.metric;

  // displays center vertex as a point feature
  display(createVertex(
    state.line.id,
    geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
    `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
    false,
  ));

  // displays the line as it is drawn
  display(geojson);



  // create custom feature for the current pointer position
  const currentVertex = {
    type: 'Feature',
    properties: {
      meta: 'currentPosition',
      radiusMetric: displayMeasurements.metric,
      radiusStandard: displayMeasurements.standard,
      parent: state.line.id,
      active: 'true',
    },
    geometry: {
      type: 'Point',
      coordinates: geojson.geometry.coordinates[1],
    },
  };
  display(currentVertex);

  // create custom feature for radius circlemarker
  const center = geojson.geometry.coordinates[0];
  const radiusInKm = lineDistance(geojson, {units : 'kilometers' });
  const circleFeature = createGeoJSONCircle(center, radiusInKm, state.line.id);
  circleFeature.properties.meta = 'radius';

  display(circleFeature);

  return null;
};

export default RadiusMode;
