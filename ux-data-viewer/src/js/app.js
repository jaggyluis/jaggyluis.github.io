
// utils ---

// older browsers
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

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

// interface setup ---

const interface = document.getElementById("interface");
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
  if (!areFiltersPresent()) {
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

var hiddenProperties = [
  "_id",
  "_far",
  "_osr",
  "_dist__site",
  "org_id",
  "shape_area",
  "shape_perimeter",
  "site_intersects",
  "text",
  "subclasses",
  "linetype",
  "layer",
  "extendeden",
  "entityhand",
  "kept",
  "perimeter_",
  "site__intersects",
  "misc",
  "recreati_1",
  "source",
  "target",
  "id",
  "lat",
  "lon"
]

var schemeBase = {
  id : "base",
  data : {
    buildings :   "data/syd/190315/buildings_existing.geojson",
    openSpaces :  "data/syd/190315/public_open_spaces.geojson",
    blocks :      "data/syd/blocks.geojson",
    points :      "data/syd/points.geojson",
    ways :        "data/syd/ways.geojson"
  }
}

var scheme1m = {
  id : "1m",
  data : {
    blocks :      "data/syd/190315/blocks_pr_1mil.geojson",
    buildings :   "data/syd/190315/buildings_pr_1mil.geojson",
    parks :       "data/syd/190315/parks_pr_1mil.geojson",
    ways :        "data/syd/190315/ways_1mil_gc.geojson",
  }
}

var scheme700k = {
  id : "700k",
  data : {
    blocks :      "data/syd/190315/blocks_pr_700k.geojson",
    buildings :   "data/syd/190315/buildings_pr_700k.geojson",
    parks :       "data/syd/190315/parks_pr_700k.geojson",
    ways :        "data/syd/190315/ways_700k_gc.geojson",
  }
}

var schemes = [
  schemeBase,
  scheme1m,
  scheme700k
]

map.on("load", function() {

  mapController.setLoading(true);

  var count = 0;

  schemes.forEach(scheme => {

    Object.keys(scheme.data).forEach(key => {

      count += 1;

      d3.json(scheme.data[key], (d) => {

        console.log(key, count);

        loadDataLayer(d, key + '_' + scheme.id);

        count -= 1;

        if (count <= 0) {
          mapController.setLoading(false);
        }

      });

    });
  });

});

drop(document.getElementsByTagName('body')[0], ['geojson'], (fileData, fileName) => {

  loadDataLayer(JSON.parse(fileData), fileName.split(".")[0]);

});

function loadDataLayer(data, label, open) {

  mapController.addSource(label, data);
  mapController.addLayer(label);
  mapController.toggleLayer(label, false); // NOTE - init off

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
  boxLabel.innerHTML = " - " + label;

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
    var properties = mapController.getSourceKeyProperties(label, true, false).slice();
    properties.push("_id");

    data.sort(function(a,b) {
      return a._id - b._id;
    });

    exportObjArrayToCSV(label + "_data", data, properties);
  });

  boxHeader.appendChild(downloadButton);

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

  var boxContent = document.createElement("div");
  boxContent.classList.add("box-content");
  boxContent.id = label + "-box-content";

  box.appendChild(boxContent);

  var boxCoords = document.createElement("div");
  boxCoords.classList.add("box-item");
  boxCoords.id = label + "-coords";
  boxCoords.style.width = "100%";

  boxContent.appendChild(boxCoords);

  mapController.addFilterLayerController(label, boxCoords);

  boxLabel.addEventListener("click", e=> {

    if (boxContent.classList.contains('collapsed')) {

      boxContent.classList.remove("collapsed");
      boxLabel.innerHTML = " - " + label;

    } else {

      boxContent.classList.add("collapsed");
      boxLabel.innerHTML = " + " + label;
    }
  });

  // var boxSheet = document.createElement("div");
  // boxSheet.classList.add("box-item");
  // boxSheet.id = label + "-sheet";
  // boxContent.appendChild(boxSheet);
  //
  // mapController.addFilterLayerSheet(label, boxSheet);

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
  docLabel.innerHTML = " - " + label;

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

  var docContent = document.createElement("div");
  docContent.classList.add("document-content");
  docContent.id = label + "-document-content";

  doc.appendChild(docContent);

  lscroll.appendChild(doc);

  docLabel.addEventListener("click", e=> {

    if (docContent.classList.contains('collapsed')) {

      docContent.classList.remove("collapsed");
      docLabel.innerHTML = " - " + label;

    } else {

      docContent.classList.add("collapsed");
      docLabel.innerHTML = " + " + label;
    }
  });

  docViewButton.addEventListener("click", e => {

      if (docViewImg.classList.contains('selected')) {

        docViewButton.selected = false;

        docViewImg.classList.remove("selected");
        mapController.toggleLayer(label, false);

      } else {

        docViewButton.selected = true;

        docViewImg.classList.add("selected");
        mapController.toggleLayer(label, true); // move this to new button ---
      }
  });

  docFilterButton.addEventListener("click", e => {

      if (docFilterImg.classList.contains('selected')) {

        docFilterButton.selected = false;

        docFilterImg.classList.remove("selected");
        box.classList.add("collapsed");


      } else {

        docFilterButton.selected = true;

        docFilterImg.classList.add("selected");
        box.classList.remove("collapsed");

      }
  });

  if (open === undefined || !open) {
    docLabel.click();
  }

  var propertyCheckBoxes = [];

  mapController.getSourceKeyProperties(label).forEach((property, index) => {

    var propertyState = mapController.getSourceKeyPropertyState(label, property);

    var propertyDiv = document.createElement("div");
    propertyDiv.id = label + "-" + property;
    propertyDiv.classList.add("document-item");

    if (hiddenProperties.includes(property)) {
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
    //propertyExtrudeButton.type = "button";
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

          mapController.updateFilterLayerProperties(label, tuple[0], false);
        });

      }

      if (e.target.checked) {

        propertyLabel.classList.add("selected");
        mapController.updateFilterLayerProperties(label, property, true);

        if (propertyContent !== null) {
          propertyContent.classList.remove("collapsed");
        }

      } else {

        propertyLabel.classList.remove("selected");
        mapController.updateFilterLayerProperties(label, property, false);

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

  });



}
