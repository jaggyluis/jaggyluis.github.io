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
    stats : [],
    indexes : {},
    highlight : [],
    divider: null,
    max : 100
  }

  var dg = function(selection) {

    selection = dg.selection = d3.select(selection);

    return dg;
  };

  dg.rows = function() {
    return __.rows;
  }

  dg.headers = function() {
    return __.headers;
  }

  dg.stats = function() {
    return __.stats;
  }

  dg.max = function (max) {
    if (!arguments.length) return __.max;
    __.max = max;

    dg.render();

    return dg;
  }

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

    var type = __.source.states[k].propertyType;

    __.data.sort(function(a,b) {
      if (type === "string") {
        return ('' + a[__.sort]).localeCompare('' + b[__.sort]);
      } else {
        return a[__.sort] - b[__.sort];
      }

    });

    if (__.reverse) __.data.reverse();

    dg.render();

    __.headers.forEach(header => {
      if (header.label.innerHTML === k) {
        header.button.style.visibility = "visible";

        if(__.reverse) {
          header.img.style.transform = "rotate(-90deg) ";
        } else {
          header.img.style.transform = "rotate(90deg) ";
        }

      } else {
        header.button.style.visibility = "hidden";
      }
    });

    return this;

  }

  dg.highlight = function (d) {

    var r = dg.buildRow(d, __.indexes[d._id]);

    r.cells.forEach(cell => {
      if (!cell.bar.classList.contains("selected")) {
        cell.bar.classList.add("selected");
      }
    });
    if (!r.img.classList.contains("selected")) {
      r.img.classList.add("selected");
    }

    __.highlight[0].innerHTML = r.row.innerHTML;

  }

  dg.unhighlight = function (d) {

    __.highlight[0].innerHTML = "";
  }

  dg.select = function(d, selectionType) {

    var key = __.source.source;
    var types = __.source.types;

    var features = __.source.data.features.filter(feature => {
      return d._id === feature.id;
    });

    if (features.length === 0) {
      return;
    }

    var exists = false;

    __.rows.forEach(other => {

      if (other.data._id === d._id) {
        other.cells.forEach(cell => {
          if (!cell.bar.classList.contains("selected")) {
            cell.bar.classList.add("selected");
          }
        });
        if (!other.img.classList.contains("selected")) {
          other.img.classList.add("selected");
        }

        if (selectionType !== undefined && selectionType.type !== "click") {

          other.row.scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center'
            });
        }

        exists = true;

      }
    });

    if (!exists) {

      var div = dg.selection[0][0];
      var i =  __.indexes[d._id]
      var r = dg.buildRow(d,i);

      r.cells.forEach(cell => {
        if (!cell.bar.classList.contains("selected")) {
          cell.bar.classList.add("selected");
        }
      });
      if (!r.img.classList.contains("selected")) {
        r.img.classList.add("selected");
      }

      r.row.addEventListener("click", e => {

        if (__.source.selected.includes(d)) {
          __.config.deselectFeature(__.source.source, d);

        } else {
          __.config.selectFeature(__.source.source, d, { type : "click", location : null });
        }

      });

      __.rows.push({
        data : d,
        index : i,
        img : r.img,
        row : r.row,
        cells : r.cells
      });

      __.divider.style.visibility = "visible";

      div.appendChild(r.row);
      r.row.scrollIntoView(false);

    }
  }

  dg.deselect = function(d) {

    var key = __.source.source;
    var types = __.source.types;

    var features = __.source.data.features.filter(feature => {
      return d._id === feature.id;
    });

    if (features.length === 0) {
      return;
    }

    __.rows.forEach((other, i) => {
      if (other.data._id === d._id) {
        other.cells.forEach(cell => {
          if (cell.bar.classList.contains("selected")) {
            cell.bar.classList.remove("selected");
          }
        });
        other.img.classList.remove("selected");

        if (other.index >= __.max) {
          other.row.remove();
          __.rows.splice(i, 1);
        }
      }
    });
  }

  dg.buildRow = function(d, i) {

    var row = document.createElement("div");
    row.classList.add("row");

    var selectImg = document.createElement("img");
    selectImg.classList.add("box-menu-img");
    selectImg.src = "img/pointer-icon.png";

    var selectButton = document.createElement("div");
    selectButton.classList.add("box-menu-item");
    selectButton.style = " margin: 0; padding-left: 8px; padding-right: 0px";
    selectButton.appendChild(selectImg);

    var indexButton = document.createElement("div");
    indexButton.classList.add("box-menu-item");
    indexButton.style = " margin: 0px; padding-top: 1px; padding-left: 8px; padding-right: 0px; font-size: 9px; ";
    indexButton.innerHTML = i;

    row.appendChild(selectButton);
    row.appendChild(indexButton);

    var cells = [];

    Object.keys(__.source.coords.dimensions()).forEach(c => {
    // __.columns.forEach(c => {

      var state = __.source.states[c];
      var range = state.propertyRange;

      var cell = document.createElement("div");
      cell.classList.add("cell");

      var cellbar = document.createElement("div");
      cellbar.classList.add("cell-bar");

      var interval = state.propertyClamp !== undefined && state.propertyClamp !== null ? state.propertyClamp : state.propertyRange;
      var func = d3.scale.quantile().domain(interval).range(state.propertyStops.map(d => { return d[1]; }));

      if (__.source.active === c) {
        cellbar.style.background = func(d[c]);
        cellbar.style.opacity = 0.5;
      }

      var cellValue = document.createElement("div");
      cellValue.classList.add("cell-value");

      if (state.propertyType === "number") {

        cell.style.background = "rgba(204, 204, 204, 0.13)";
        cellValue.innerHTML = d[c] === undefined ? "" : parseFloat(Math.round(d[c]* 100) / 100).toFixed(2); ;
        cellbar.style.width = "calc(" + 100 * ((d[c] - range[0]) / (range[1] - range[0])) + "% - 4px)";

        cell.appendChild(cellbar);

      } else {

        cellValue.innerHTML = d[c];
      }

      cell.appendChild(cellValue);

      row.appendChild(cell);

      cells.push({
        cell : cell,
        bar : cellbar,
        value : cellValue
      });
    });

    return {
      row : row,
      cells : cells,
      img : selectImg,
    }
  }

  dg.render = function() {

    var div = dg.selection[0][0];
    div.innerHTML = "";

    __.headers = [];
    __.rows = [];
    __.stats = [];
    __.indexes = {};
    __.highlight = [];
    __.divider = null;

    function buildFillers() {

      var f1 = document.createElement("div");
      f1.classList.add("box-menu-item");
      f1.style = " margin: 0; padding-left: 8px; padding-right: 0px";

      var f2 = document.createElement("div");
      f2.classList.add("box-menu-item");
      f2.style = " margin: 0px; padding-top: 1px; padding-left: 8px; padding-right: 0px; font-size: 9px; ";

      return [f1, f2];
    }

    // header

    var header = document.createElement("div");
    header.classList.add("header");

    buildFillers().forEach(f => header.appendChild(f));

    Object.keys(__.source.coords.dimensions()).forEach(c => {
    //__.columns.forEach(c => {

      var state = __.source.states[c];
      var range = state.propertyRange;

      var cell  = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add("col");

      var label = document.createElement("div");
      label.classList.add("cell-label");
      label.innerHTML = c;
      label.title = c;

      var reverseImg = document.createElement("img");
      reverseImg.classList.add("box-menu-img");
      reverseImg.classList.add("selected");
      reverseImg.style = " transform: rotate(-90deg); width: 10px; height: 10px; ";
      reverseImg.src = "img/right-arrow-icon.png";

      var reverseButton = document.createElement("div");
      reverseButton.classList.add("box-menu-item");
      reverseButton.style = " padding: 0; margin: 1px; top: 0; max-width: 10px; min-width: 0px;";
      reverseButton.style.visibility = "hidden";
      reverseButton.appendChild(reverseImg);

      cell.appendChild(label);
      cell.appendChild(reverseButton);
      cell.addEventListener("click", e => {

        if (__.source.active !== c) {
          __.config.selectProperty(__.source.source, c);
        }

        dg.sort(c);
      });

      header.appendChild(cell);

      __.headers.push({
        cell : cell,
        label : label,
        button : reverseButton,
        img :  reverseImg
      });

    });

    div.appendChild(header);

    // stats ---

    var statistics = document.createElement("div");
    statistics.classList.add("row");
    statistics.classList.add("stats");

    buildFillers().forEach(f => statistics.appendChild(f));

    Object.keys(__.source.coords.dimensions()).forEach(c => {
    //__.columns.forEach(c => {

      var state = __.source.states[c];

      var cell = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add("stats");

      var cellbar = document.createElement("div");
      cellbar.classList.add("cell-bar");
      cellbar.classList.add("stats");

      var cellValue = document.createElement("div");
      cellValue.classList.add("cell-value");
      cellValue.classList.add("stats");

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

      } else {


      }

      statistics.appendChild(cell);

      __.stats.push({
        cell : cell,
        bar : cellbar,
        value : cellValue
      });

    });

    div.appendChild(statistics);

    // highlight ---

    var highlight = document.createElement("div");
    highlight.classList.add("row");
    highlight.classList.add("highlight");

    div.appendChild(highlight);

    __.highlight.push(highlight);

    // data ---

    var count = 0;

    __.data.forEach((d,i) => {

      __.indexes[d._id] = i;

      if (i >= __.max && !__.source.selected.includes(d)) {
        return;

      }

      if (count == __.max) {
        __.divider = document.createElement("div");
        __.divider.innerHTML = "... " + (__.data.length - count) + " more elements";
        __.divider.style = "border-bottom : 1px solid grey; margin-top : 8px; margin-bottom: 8px; font-size : 8px; ";
        div.appendChild(__.divider);
      }

      var r = dg.buildRow(d, i);

      div.appendChild(r.row);

      r.row.addEventListener("click", e => {

        if (__.source.selected.includes(d)) {
          __.config.deselectFeature(__.source.source, d);

        } else {
          __.config.selectFeature(__.source.source, d, { type : "click", location : null });
        }

      });

      r.row.addEventListener("mouseenter", e => {
        __.config.highlightFeature(__.source.source, d, { type : "click", location : null });
      });

      r.row.addEventListener("mouseleave", e=> {
        __.config.unhighlightFeature(__.source.source);
      })

      __.rows.push({
        data : d,
        index : i,
        img : r.img,
        row : r.row,
        cells : r.cells
      });

      if (__.source.selected.includes(d)) {

        dg.select(d, { type : "click", location : null });

      } else {

        dg.deselect(d);
      }

      count += 1;

    });

    if (__.divider == null && count >= __.max) {
      __.divider = document.createElement("div");
      __.divider.innerHTML = "... " + (__.data.length - count) + " more elements";
      __.divider.style = "border-bottom : 1px solid grey; margin-top : 8px; margin-bottom: 8px; font-size : 8px; ";
      __.divider.style.visibility = "none";
      div.appendChild(__.divider);
    }

    div.scrollTop = 0;

    return this;
  }

  return dg;
};
