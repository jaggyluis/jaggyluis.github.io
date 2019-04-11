
// utils ---

// older browsers
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

// TODO - make this a function to redude global namespace ---
// map setup ---

mapboxgl.accessToken = 'pk.eyJ1IjoiamFnZ3lsdWlzIiwiYSI6ImNqcmdrdWRyNzFlenQ0M3BvODZ6ZjJwcnUifQ.T8htDIqiD0Vy8WOEE7ZssQ';

const config = {
  styles: {
    grey : "mapbox://styles/jaggyluis/cjt7fnuw90wzk1fr0vlse45j7",
    greyLight : "mapbox://styles/jaggyluis/cjt7g0t1g6gk61fqrbcrkil1i",
    light : 'mapbox://styles/jaggyluis/cjt7f9h3z0wm51fr0qkrbw0iv'
  }
}

const map = new mapboxgl.Map({
    container: 'map',
    style: config.styles.greyLight,
    zoom: 0.1,
    preserveDrawingBuffer: true
});

const mapController = new MapController(map);

console.log(mapController);

// interface setup ---

const interface = document.getElementById("interface");
const topDiv = document.getElementById("top");

const left = document.getElementById("left");
const leftHeader = document.getElementById("left-header");
const lscroll = document.getElementById("left-scroll-pane");

const bottom = document.getElementById("bottom");
const bottomHeader = document.getElementById("bottom-header");
const bscroll = document.getElementById("bottom-scroll-pane");

const legend = document.getElementById("legend");

mapController.addLegend(legend);

leftHeader.addEventListener("click", e => {
  if (Object.keys(mapController.sources).length === 0) {
    return;
  }

  lscroll.classList.toggle("collapsed");
});

bottomHeader.addEventListener("click", e => {
  if (!areFiltersPresent() || bottom.classList.contains("expanded")) {
    return;
  }
  bscroll.classList.toggle("collapsed");
})

function areFiltersPresent() {

  var filters = document.getElementsByClassName("document-filter-button");

  for (var i = 0; i< filters.length; i++) {
    if (filters[i].selected) {
      return true;
    }
  }

  return false;
}

// interaction setup ---

// high dpi - - https://stackoverflow.com/questions/42483449/mapbox-gl-js-export-map-to-png-or-pdf
// var dpi = 300;
// Object.defineProperty(window, 'devicePixelRatio', {
//     get: function() {return dpi / 96}
// });

var SCHEMA = null;
var OPTIONS = null;

drop(document.getElementsByTagName('body')[0], ['json'], (fileData, fileName) => {

  var json = JSON.parse(fileData);

  if (json.type !== "SSDataSchema" || SCHEMA !== null) {
    return;
  }

  SCHEMA = json; // singleton ---
  OPTIONS = json.options || null; // global ---

  function loadBoundaries(cb) {

    var boundaries = json.boundaries.length ;

    json.boundaries.forEach(boundary => {
      d3.json(boundary.url, d => {
        loadDataBoundary(d, boundary.id, boundary.options || {});

        boundaries -= 1;

        if (!boundaries && cb) {
          cb();
        }

      });
    });
  }

  function loadSchemas(cb) {

    var schemas = json.schemas.length;

    json.schemas.forEach(schema => {

      console.log(schema);

      d3.json(schema.url, d => {
        loadDataLayer(d, schema.id, schema.options || {});

        schemas -= 1;

        if (!schemas && cb) {
          cb();
        }

      });
    });
  }

  function loadCameras(cb) {

    json.cameras.forEach(camera => {
      loadDataCamera(camera, camera.id, camera.options || {});

    });
  }

  var tt = document.getElementById("tt");
  var ts = document.createElement("div");
  ts.id = "ts";
  ts.innerHTML = json.title || "";

  tt.appendChild(ts);

  if (json.options) {

    if (json.options.draw === true || json.options.draw === false) { // strict boolean check
      mapController.toggleDraw(json.options.draw);
    }

    if (json.options.data === false) {
      left.classList.add("collapsed");
    }
  }

  if (json.cameras && json.cameras.length) {
    loadCameras();
  }

  if (json.options && json.options.camera) {
    mapController.toggleCamera(json.options.camera);
  }

  if (json.boundaries && json.boundaries.length) {
    loadBoundaries(loadSchemas);

  } else {
    if (json.schemas && json.schemas.length) {
      loadSchemas();
    }
  }

});

// keep the default loader for additional files ---
drop(document.getElementsByTagName('body')[0], ['geojson'], (fileData, fileName) => {

  loadDataLayer(JSON.parse(fileData), fileName.split(".")[0], {});

});

function loadDataCamera(data, label, options) {
  mapController.addCamera(label, data, options);
}

function loadDataBoundary(data, label, options) {
  mapController.addBoundary(label, data, options);
}

function loadDataLayer(data, label, options) {
  mapController.addSource(label, data, options);
  mapController.addLayers(label);
  mapController.toggleLayers(label, false); // NOTE - init off ---

  var hidden = (options.properties ? options.properties.hidden || [] : []).concat("_id", "lat", "lon");

  // build the box first ---

  var box = document.createElement("div");
  box.classList.add("box");
  box.classList.add("document");
  bscroll.appendChild(box);

  var boxHeader = document.createElement("div");
  boxHeader.classList.add("box-header");
  boxHeader.id = label + "-box-header"

  box.appendChild(boxHeader);

  var boxLabel = document.createElement("div");
  boxLabel.classList.add("box-label");
  boxLabel.id = label + "-box-label";
  //boxLabel.innerHTML = " - " + label; // swap for below ---
  boxLabel.innerHTML = label;

  boxHeader.appendChild(boxLabel);

  var boxStatus = document.createElement("div");
  boxStatus.classList.add("box-status");
  boxStatus.id = label + "-box-status";
  boxStatus.innerHTML = "no properties selected";

  boxHeader.appendChild(boxStatus);

  var downloadImg = document.createElement("img");
  downloadImg.classList.add("box-menu-img");
  downloadImg.src = "img/export-icon.png";

  var downloadButton = document.createElement("div");
  downloadButton.classList.add("box-menu-item");
  downloadButton.title = "Download";
  downloadButton.appendChild(downloadImg);
  downloadButton.addEventListener("click", e => {
    console.log("download");

    var data = mapController.getSourceData(label).slice();
    var properties = mapController.getProperties(label, true, false).slice();
    properties.push("_id");

    data.sort(function(a,b) {
      return a._id - b._id;
    });

    exportObjArrayToCSV(label + "_data", data, properties); //NOTE - this is off for testing ---
  });

  if (!(OPTIONS && OPTIONS.download === false)) {
    boxHeader.appendChild(downloadButton);
  }

  var sheetImg = document.createElement("img");
  sheetImg.classList.add("box-menu-img");
  sheetImg.src = "img/sheet-icon.png";

  var sheetButton = document.createElement("div");
  sheetButton.classList.add("box-menu-item");
  sheetButton.title = "Sheet";
  sheetButton.appendChild(sheetImg);

  boxHeader.appendChild(sheetButton);

  var filterImg = document.createElement("img");
  filterImg.classList.add("box-menu-img");
  filterImg.classList.add("selected");
  filterImg.style = " transform: rotate(90deg); ";
  filterImg.src = "img/options-icon.png";

  var filterButton = document.createElement("div");
  filterButton.classList.add("box-menu-item");
  filterButton.title = "Filter";
  filterButton.appendChild(filterImg);

  boxHeader.appendChild(filterButton);

  var expandImg = document.createElement("img");
  expandImg.classList.add("box-menu-img");
  expandImg.src = "img/expand-icon.png";

  var expandButton = document.createElement("div");
  expandButton.classList.add("box-menu-item");
  expandButton.title = "Expand";
  expandButton.appendChild(expandImg);

  boxHeader.appendChild(expandButton);

  var boxContent = document.createElement("div");
  boxContent.classList.add("box-content");
  boxContent.id = label + "-box-content";

  box.appendChild(boxContent);

  var boxCoords = document.createElement("div");
  boxCoords.classList.add("box-item");
  boxCoords.classList.add("box-block");
  boxCoords.id = label + "-coords";

  boxContent.appendChild(boxCoords);

  mapController.addCoordsView(label, boxCoords);

  // boxLabel.addEventListener("click", e=> { // disable ---
  //
  //   if (boxContent.classList.contains('collapsed')) {
  //
  //     boxContent.classList.remove("collapsed");
  //     boxLabel.innerHTML = " - " + label;
  //
  //   } else {
  //
  //     boxContent.classList.add("collapsed");
  //     boxLabel.innerHTML = " + " + label;
  //   }
  // });

  var boxSheet = document.createElement("div");
  boxSheet.classList.add("box-item");
  boxSheet.classList.add("box-overflow");
  boxSheet.classList.add("collapsed");
  boxSheet.id = label + "-sheet";
  boxContent.appendChild(boxSheet);

  mapController.addSheetView(label, boxSheet);

  sheetButton.addEventListener("click", e => {

    if (boxSheet.classList.contains('collapsed')) {

      boxSheet.classList.remove("collapsed");
      topDiv.classList.remove("collapsed");
      bottom.classList.remove("expanded");

      if (!boxCoords.classList.contains("collapsed")) {
        boxCoords.classList.add("collapsed");
      }

      if (!sheetImg.classList.contains("selected")) {
        sheetImg.classList.add("selected");
      }

      filterImg.classList.remove("selected");
      expandImg.classList.remove("selected");
    }
  });

  filterButton.addEventListener("click", e => {

    if (boxCoords.classList.contains('collapsed')) {

      boxCoords.classList.remove("collapsed");
      topDiv.classList.remove("collapsed");
      bottom.classList.remove("expanded");

      if (!boxSheet.classList.contains("collapsed")) {
        boxSheet.classList.add("collapsed");
      }

      if (!filterImg.classList.contains("selected")) {
        filterImg.classList.add("selected");
      }

      sheetImg.classList.remove("selected");
      expandImg.classList.remove("selected");
    }
  });

  expandButton.addEventListener("click", e => {

    console.log("expand");

    if (!topDiv.classList.contains('collapsed')) {

      topDiv.classList.add("collapsed");

      if (!bottom.classList.contains("expanded")) {
        bottom.classList.add("expanded");
      }

      if (!expandImg.classList.contains("selected")) {
        expandImg.classList.add("selected");
      }

      if (!boxContent.classList.contains("expanded")) {
        boxContent.classList.add("expanded");
      }

      boxCoords.classList.remove("collapsed");
      boxSheet.classList.remove("collapsed");

      filterImg.classList.remove("selected");
      if (!filterImg.classList.contains("disabled")) {
        filterImg.classList.add("disabled");
      }

      sheetImg.classList.remove("selected");
      if (!sheetImg.classList.contains("disabled")) {
        sheetImg.classList.add("disabled");
      }

    } else {

      topDiv.classList.remove("collapsed");
      bottom.classList.remove("expanded");
      expandImg.classList.remove("selected");
      boxContent.classList.remove("expanded");

      boxSheet.classList.add("collapsed");
      filterImg.classList.add("selected");

      filterImg.classList.remove("disabled");
      sheetImg.classList.remove("disabled");
    }
  });

  boxContent.classList.add("collapsed"); // build parcoords then collapse ---
  box.classList.add("collapsed");

  // end building the box ---

  var doc = document.createElement("div");
  doc.classList.add("document");

  var docHeader = document.createElement("div");
  docHeader.classList.add("document-header");
  docHeader.id = label + "-document-header";

  doc.appendChild(docHeader);

  var docCheckBoxImg = document.createElement("img");
  docCheckBoxImg.classList.add("document-menu-img");
  //docViewImg.classList.add("selected");
  docCheckBoxImg.src = "img/toggle-icon.png";

  var docCheckBoxButton = document.createElement("div");
  docCheckBoxButton.classList.add("document-menu-item");
  docCheckBoxButton.classList.add("document-view-button");
  docCheckBoxButton.selected = false;
  docCheckBoxButton.appendChild(docCheckBoxImg);

  //docHeader.appendChild(docCheckBoxButton);

  var docLabel = document.createElement("div");
  docLabel.classList.add("document-label");
  docLabel.id = label + "-document-label";
  //docLabel.innerHTML = " - " + label; // swap for below ---
  docLabel.innerHTML = label;

  docHeader.appendChild(docLabel);

  var docViewImg = document.createElement("img");
  docViewImg.classList.add("document-menu-img");
  //docViewImg.classList.add("selected");
  docViewImg.src = "img/view-icon.png";

  var docViewButton = document.createElement("div");
  docViewButton.classList.add("document-menu-item");
  docViewButton.classList.add("document-view-button");
  docViewButton.title = "View";
  docViewButton.selected = false;
  docViewButton.appendChild(docViewImg);

  docHeader.appendChild(docViewButton);

  var docFilterImg = document.createElement("img");
  docFilterImg.classList.add("document-menu-img");
  docFilterImg.style = " transform: rotate(90deg); ";
  docFilterImg.src = "img/options-icon.png";

  var docFilterButton = document.createElement("div");
  docFilterButton.classList.add("document-menu-item");
  docFilterButton.classList.add("document-filter-button");
  docFilterButton.title = "Filter";
  docFilterButton.selected = false;
  docFilterButton.appendChild(docFilterImg);

  docHeader.appendChild(docFilterButton);

  var docMoveDownImg = document.createElement("img");
  docMoveDownImg.classList.add("document-menu-img");
  //docViewImg.classList.add("selected");
  docMoveDownImg.style = " transform: rotate(90deg); ";
  docMoveDownImg.src = "img/left-arrow-icon.png";

  var docMoveDownButton = document.createElement("div");
  docMoveDownButton.classList.add("document-menu-item");
  docMoveDownButton.classList.add("document-order-button");
  docMoveDownButton.title = "Move Layer Down";
  docMoveDownButton.selected = false;
  docMoveDownButton.appendChild(docMoveDownImg);

  docMoveDownButton.addEventListener("click", e => {

    var nodes = Array.prototype.slice.call(lscroll.children );
    var index = nodes.indexOf(doc);

    if (index == -1 || index == 0) {
      return;
    }

    mapController.moveSourceDown(label);

    lscroll.insertBefore(doc, lscroll.children[index -1]);

  });

  docHeader.appendChild(docMoveDownButton);

  var docMoveUpImg = document.createElement("img");
  docMoveUpImg.classList.add("document-menu-img");
  //docViewImg.classList.add("selected");
  docMoveUpImg.style = " transform: rotate(90deg); ";
  docMoveUpImg.src = "img/right-arrow-icon.png";

  var docMoveUpButton = document.createElement("div");
  docMoveUpButton.classList.add("document-menu-item");
  docMoveUpButton.classList.add("document-order-button");
  docMoveUpButton.title = "Move Layer Up";
  docMoveUpButton.selected = false;
  docMoveUpButton.appendChild(docMoveUpImg);

  docMoveUpButton.addEventListener("click", e => {

    var nodes = Array.prototype.slice.call(lscroll.children );
    var index = nodes.indexOf(doc);

    if (index == -1 || index == nodes.length -1) {
      return;
    }

    mapController.moveSourceUp(label);

    lscroll.insertBefore(doc, lscroll.children[index + 2]);

  });

  docHeader.appendChild(docMoveUpButton);

  var docContent = document.createElement("div");
  docContent.classList.add("document-content");
  docContent.classList.add("collapsed"); // adde-d ---
  docContent.id = label + "-document-content";

  doc.appendChild(docContent);

  lscroll.appendChild(doc);

  // docLabel.addEventListener("click", e=> { // disable ---
  //
  //   if (docContent.classList.contains('collapsed')) {
  //
  //     docContent.classList.remove("collapsed");
  //     docLabel.innerHTML = " - " + label;
  //
  //   } else {
  //
  //     docContent.classList.add("collapsed");
  //     docLabel.innerHTML = " + " + label;
  //   }
  // });

  docViewButton.addEventListener("click", e => {

      if (docViewImg.classList.contains('selected')) {

        docViewButton.selected = false;

        docViewImg.classList.remove("selected");
        mapController.toggleLayers(label, false);

      } else {

        docViewButton.selected = true;

        docViewImg.classList.add("selected");
        mapController.toggleLayers(label, true); // move this to new button ---
      }
  });

  docFilterButton.addEventListener("click", e => {

      var filterButtons = document.getElementsByClassName("document-filter-button");

      for (var i = 0; i < filterButtons.length; i++) {
        if ( filterButtons[i].selected && filterButtons[i] !== docFilterButton) {
           filterButtons[i].click();
        }
      }

      if (docFilterImg.classList.contains('selected')) {

        docFilterButton.selected = false;

        docFilterImg.classList.remove("selected");
        box.classList.add("collapsed");

        docContent.classList.add("collapsed"); // adde-d ---


      } else {

        docFilterButton.selected = true;

        docFilterImg.classList.add("selected");
        box.classList.remove("collapsed");

        docContent.classList.remove("collapsed"); // adde-d ---

      }
  });

  if (options.visible === true) {
    docViewButton.click();
  }

  if (OPTIONS && OPTIONS.active === label) {
    docFilterButton.click();
  }

  var propertyCheckBoxes = [];

  mapController.getProperties(label).forEach((property, index) => {

    var propertyState = mapController.getPropertyState(label, property);

    var propertyDiv = document.createElement("div");
    propertyDiv.id = label + "-" + property;
    propertyDiv.classList.add("document-item");

    if (hidden.includes(property)) {
      propertyDiv.classList.add("collapsed");
    }

    var propertyHeader = document.createElement("div");
    propertyHeader.classList.add("document-item-header");

    var propertyCheckBox = document.createElement("input");
    propertyCheckBox.setAttribute("type", "checkbox");

    var propertyLabel = document.createElement("div");
    propertyLabel.innerHTML = property;
    propertyLabel.classList.add("document-item-label");

    propertyLabel.addEventListener("click", (e) => {
      propertyCheckBox.click(e);
    })

    var propertyExtrudeImg = document.createElement("img");
    propertyExtrudeImg.src = "img/cube-icon.png";
    propertyExtrudeImg.style =" width: 10px; height: 10px;  padding-right: 10px; opacity: 0.3; ";

    var propertyExtrudeButton = document.createElement("div");
    propertyExtrudeButton.title = "extrude";
    propertyExtrudeButton.appendChild(propertyExtrudeImg);
    propertyExtrudeButton.addEventListener("click", e => {

      console.log("extrude");

    });

    propertyHeader.appendChild(propertyCheckBox);
    //propertyHeader.appendChild(propertyExtrudeButton);
    propertyHeader.appendChild(propertyLabel);
    propertyDiv.appendChild(propertyHeader);
    docContent.appendChild(propertyDiv);

    var propertyContent = null;

    propertyCheckBoxes.push([property, propertyCheckBox, propertyLabel, propertyContent]);

    propertyCheckBox.addEventListener("click", (e) => {

      var ctrl = mapController.areKeysDown(["Control"]);

      if (ctrl) {

        e.target.checked = true;

        propertyCheckBoxes.forEach(tuple => {

          if (tuple[0] === property) {
            return;
          }

          tuple[1].checked = false;
          tuple[2].classList.remove("selected");

          if (tuple[3] !== null) {
            tuple[3].classList.add("collapsed");
          }

          mapController.toggleProperty(label, tuple[0], false);
        });

      }

      if (e.target.checked) {

        propertyLabel.classList.add("selected");
        mapController.toggleProperty(label, property, true);

        if (propertyContent !== null) {
          propertyContent.classList.remove("collapsed");
        }

      } else {

        propertyLabel.classList.remove("selected");
        mapController.toggleProperty(label, property, false);

        if (propertyContent !== null) {
          propertyContent.classList.add("collapsed");
        }
      }

      var allUnchecked = true;

      for (var i = 0; i< propertyCheckBoxes.length; i++) {
        if (propertyCheckBoxes[i][1].checked) {
          allUnchecked = false;
          break;
        }
      }

      if (allUnchecked) {
        if (!boxContent.classList.contains("collapsed")) {
          boxContent.classList.add("collapsed");
          boxStatus.innerHTML = "no properties selected";
        }
      } else {
        boxContent.classList.remove("collapsed");
        boxStatus.innerHTML = "";
      }

    });

    if (propertyState && propertyState.propertyType === "string") {

      propertyContent = document.createElement("div");
      propertyContent.classList.add("document-item-content");
      propertyContent.classList.add("collapsed");
      propertyDiv.appendChild(propertyContent);

      propertyCheckBoxes[index][3] = propertyContent; // update the tuple since the object reference is not in scope ---

      var propertyCategories = propertyState.propertyCategories;
      var propertyCategoryCheckBoxes = [];

      propertyCategories.forEach(category => {

        var categoryHeader = document.createElement("div");
        categoryHeader.classList.add("document-item");
        categoryHeader.classList.add("document-item-header");

        var categoryCheckBox = document.createElement("input");
        categoryCheckBox.setAttribute("type", "checkbox");
        categoryCheckBox.setAttribute("checked", true);

        var categoryLabel = document.createElement("div");
        categoryLabel.innerHTML = category;
        categoryLabel.classList.add("document-item-label");
        categoryLabel.classList.add("selected");

        categoryHeader.appendChild(categoryCheckBox);
        categoryHeader.appendChild(categoryLabel);
        propertyContent.appendChild(categoryHeader);

        propertyCategoryCheckBoxes.push([category, categoryCheckBox, categoryLabel]);

        categoryCheckBox.addEventListener("click", (e) => {

          var ctrl = mapController.areKeysDown(["Control"]);

          if (ctrl) {

            e.target.checked = true;

            var filters = [];

            propertyCategoryCheckBoxes.forEach(tuple => {

              if (tuple[0] === category) {
                return;
              }

              tuple[1].checked = false;
              tuple[2].classList.remove("selected");

              filters.push({
                filterKey : tuple[0],
                filter : (value) => {
                    return value[property] === tuple[0];
                }
              });

            });

            mapController.addFilters(label, filters);

          }

          if (e.target.checked) {

            categoryLabel.classList.add("selected");

            mapController.removeFilter(label, category);

          } else {

            categoryLabel.classList.remove("selected");

            mapController.addFilters(label, [{
              filterKey : category,
              filter : (value) => {
                  return value[property] === category;
              }
            }]);
          }

        });

      });
    }

    if (options.properties && options.properties.selected && options.properties.selected.includes(property)) {
      propertyCheckBox.click();
    }

  });



}
