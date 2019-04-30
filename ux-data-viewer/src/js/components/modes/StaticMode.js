const StaticMode = {};

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


export default StaticMode;
