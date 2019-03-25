// http://bl.ocks.org/3687826
d3.divgrid = function(source, config) {

  var __ = {
    config : config,
    source : source,
    columns : null,
    data : [],
    sort : null,
    reverse : true,
    headers : [],
    rows : [],
  }

  var dg = function(selection) {

    selection = dg.selection = d3.select(selection);

    return dg;
  };

  dg.data = function(data) {
    if (!arguments.length) return __.data;
    __.data = data.slice();
    if (__.columns === null && data.length !== 0) __.columns = d3.keys(data[0]);
    if(__.sort === null && data.length !== 0) dg.sort( __.columns[0]);

    return this;
  }

  dg.columns = function(columns) {
    if (!arguments.length) return __.columns;
    __.columns = columns;
    return this;
  };

  dg.sort = function(k) {
    if (!__.columns.includes(k)){
      return;
    }

    __.reverse = __.sort === k ? !__.reverse : true;
    __.sort = k;

    __.data.sort(function(a,b) {
      return a[__.sort] - b[__.sort];
    });

    if (__.reverse) __.data.reverse();

    dg.render();

    __.headers.forEach(other => {
      if (other[1].innerHTML === k) {
        other[2].style.visibility = "visible";

        if(__.reverse) {
          other[3].style.transform = "rotate(-90deg) ";
        } else {
          other[3].style.transform = "rotate(90deg) ";
        }

      } else {
        other[2].style.visibility = "hidden";
      }
    });

    return this;

  }

  dg.render = function() {

    var div = dg.selection[0][0];
    div.innerHTML = "";

    __.headers = [];
    __.rows = [];

    // header

    var header = document.createElement("div");
    header.classList.add("header");

    Object.keys(__.source.coords.dimensions()).forEach(c => {
    //__.columns.forEach(c => {

      var cell  = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add("col");

      var label = document.createElement("div");
      label.classList.add("cell-label");
      label.innerHTML = c;

      var reverseImg = document.createElement("img");
      reverseImg.classList.add("box-menu-img");
      reverseImg.classList.add("selected");
      reverseImg.style = " transform: rotate(-90deg); width: 10px; height: 10px; ";
      reverseImg.src = "img/right-arrow-icon.png";

      var reverseButton = document.createElement("div");
      reverseButton.classList.add("box-menu-item");
      reverseButton.style = " margin: 0; padding-left: 5px; margin: 1px";
      reverseButton.style.visibility = "hidden";
      reverseButton.appendChild(reverseImg);

      cell.appendChild(label);
      cell.appendChild(reverseButton);
      cell.addEventListener("click", e => {
        dg.sort(c);
      });

      header.appendChild(cell);

      __.headers.push([cell, label, reverseButton, reverseImg]);

    });

    div.appendChild(header);

    // data ---

    __.data.forEach((d,i) => {

      if (i > 500) {
        return;
      }

      var row = document.createElement("div");
      row.classList.add("row");

      row.addEventListener("click", e => {

        var features = __.source.data.features.filter(feature => {
          return d._id === feature.id;
        });

        var key = __.source.source;
        var types = __.source.types;

        if (types.includes("MultiPolygon")) {

          features.forEach(feature => {
              __.config.addFilterLayerFeaturePopup(key, feature, feature.geometry.coordinates[0][0][0]);
          });

        } else if (types.includes("Polygon") || types.includes("MultiLineString")) {

          features.forEach(feature => {
              __.config.addFilterLayerFeaturePopup(key, feature, feature.geometry.coordinates[0][0]);
          });

        } else if (types.includes("LineString")) {

          features.forEach(feature => {
              __.config.addFilterLayerFeaturePopup(key, feature, feature.geometry.coordinates[0]);
          });

        } else if (types.includes("Point")) {

          features.forEach(feature => {
              __.config.addFilterLayerFeaturePopup(key, feature, feature.geometry.coordinates);
          });
        }

      });

      Object.keys(__.source.coords.dimensions()).forEach(c => {
      // __.columns.forEach(c => {

        var state = __.source.states[c];
        var range = state.propertyRange;

        var cell = document.createElement("div");
        cell.classList.add("cell");

        var cellbar = document.createElement("div");
        cellbar.classList.add("cell-bar");

        var cellValue = document.createElement("div");
        cellValue.classList.add("cell-value");


        if (state.propertyType === "number") {

          cell.style.background = "rgba(204, 204, 204, 0.13)";
          cellValue.innerHTML = d[c] === undefined ? "" : parseFloat(Math.round(d[c]* 100) / 100).toFixed(2); ;
          cellbar.style.width = 100 * ((d[c] - range[0]) / (range[1] - range[0])) + "%";

          cell.appendChild(cellbar);

        } else {

          cellValue.innerHTML = d[c];
        }

        cell.appendChild(cellValue);

        row.appendChild(cell);

      });

      div.appendChild(row);

      __.rows.push([row]);

    });

    return this;
  }

  return dg;
};
