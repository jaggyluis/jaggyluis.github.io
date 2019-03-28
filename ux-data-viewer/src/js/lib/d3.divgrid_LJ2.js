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
    max : 100
  }

  var dg = function(selection) {

    selection = dg.selection = d3.select(selection);

    return dg;
  };

  dg.rows = function() {
    return __.rows;
  }

  dg.header = function() {
    return __.headers;
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

    __.data.sort(function(a,b) {
      return a[__.sort] - b[__.sort];
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

  dg.select = function(d) {

    var key = __.source.source;
    var types = __.source.types;

    var features = __.source.data.features.filter(feature => {
      return d._id === feature.id;
    });

    if (features.length === 0) {
      return;
    }

    __.rows.forEach(other => {
      if (other.data === d) {
        other.cells.forEach(cell => {
          if (!cell.bar.classList.contains("selected")) {
            cell.bar.classList.add("selected");
          }
        });
        if (!other.img.classList.contains("selected")) {
          other.img.classList.add("selected");
        }
      }
    });
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

    __.rows.forEach(other => {
      if (other.data === d) {
        other.cells.forEach(cell => {
          if (cell.bar.classList.contains("selected")) {
            cell.bar.classList.remove("selected");
          }
        });
        other.img.classList.remove("selected");
      }
    });
  }

  dg.render = function() {

    var div = dg.selection[0][0];
    div.innerHTML = "";

    __.headers = [];
    __.rows = [];

    // header

    var header = document.createElement("div");
    header.classList.add("header");

    var index = document.createElement("div");
    index.style = "width : 30px ; flex : none;" ;

    header.appendChild(index);

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
      reverseButton.style = " margin: 0; padding-left: 5px; margin: 1px; position: absolute; top: 0; right: 0;";
      reverseButton.style.visibility = "hidden";
      reverseButton.appendChild(reverseImg);

      cell.appendChild(label);
      cell.appendChild(reverseButton);
      cell.addEventListener("click", e => {
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

    // data ---

    var count = 0

    __.data.forEach((d,i) => {

      if (i >= __.max && !__.source.selected.includes(d)) {
        return;
      }

      if (count == __.max) {
        var divider = document.createElement("div");
        divider.style = "border-top : 1px solid grey";
        div.appendChild(divider);
      }

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

      row.addEventListener("click", e => {

        if (__.source.selected.includes(d)) {

          __.config.deselectFeature(__.source.source, d);

        } else {

          __.config.selectFeature(__.source.source, d);
        }

      });

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
          cellbar.style.width = 100 * ((d[c] - range[0]) / (range[1] - range[0])) + "%";

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

      div.appendChild(row);

      row.addEventListener("mouseenter", e => {
        __.config.highlightFeature(__.source.source, d);
      });

      row.addEventListener("mouseleave", e=> {
        __.config.unhighlightFeature(__.source.source);
      })

      __.rows.push({
        data : d,
        img : selectImg,
        row : row,
        cells : cells
      });

      if (__.source.selected.includes(d)) {

        dg.select(d);

      } else {

        dg.deselect(d);
      }

      count += 1;

    });

    return this;
  }

  return dg;
};
