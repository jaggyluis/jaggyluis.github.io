var BoundaryView = function(source, config) {

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
    return this;
  }

  dg.columns = function(columns) {
    if (!arguments.length) return __.columns;
    __.columns = columns;
    return this;
  };

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

    __.columns.forEach(c => {

      var cell = document.createElement("div");
      cell.classList.add("cell");

      var cellValue = document.createElement("div");
      cellValue.classList.add("cell-value");
      cellValue.innerHTML = d[c];

      cell.appendChild(cellValue);
      row.appendChild(cell);

      cells.push({
        cell : cell,
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

    __.columns.forEach(c => {

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

    var content = document.createElement("div");
    content.classList.add("row-content");

    div.appendChild(content);

    var count = 0;

    __.data.forEach((d,i) => {

      __.indexes[d._id] = i;

      if (i >= __.max) {
        return;
      }

      if (count == __.max) {
        __.divider = document.createElement("div");
        __.divider.innerHTML = "... " + (__.data.length - count) + " more elements";
        __.divider.style = "border-bottom : 1px solid grey; margin-top : 8px; margin-bottom: 8px; font-size : 8px; ";
        content.appendChild(__.divider);
      }

      var r = dg.buildRow(d, i);

      content.appendChild(r.row);

      // r.row.addEventListener("click", e => {
      //
      //   if (__.source.selected.includes(d)) {
      //     __.config.deselectFeature(__.source.source, d);
      //
      //   } else {
      //     __.config.selectFeature(__.source.source, d, { type : "click", location : null });
      //   }
      //
      // });
      //
      // r.row.addEventListener("mouseenter", e => {
      //   __.config.highlightFeature(__.source.source, d, { type : "click", location : null });
      // });
      //
      // r.row.addEventListener("mouseleave", e=> {
      //   __.config.unhighlightFeature(__.source.source);
      // })

      __.rows.push({
        data : d,
        index : i,
        img : r.img,
        row : r.row,
        cells : r.cells
      });

      // if (__.source.selected.includes(d)) {
      //
      //   dg.select(d, { type : "click", location : null });
      //
      // } else {
      //
      //   dg.deselect(d);
      // }

      count += 1;

    });

    if (__.divider == null && count >= __.max) {
      __.divider = document.createElement("div");
      __.divider.innerHTML = "... " + (__.data.length - count) + " more elements";
      __.divider.style = "border-bottom : 1px solid grey; margin-top : 8px; margin-bottom: 8px; font-size : 8px; ";
      __.divider.style.visibility = "none";
      content.appendChild(__.divider);
    }

    content.scrollTop = 0;

    return this;
  }

  return dg;
};
