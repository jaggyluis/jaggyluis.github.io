
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

const interface = document.getElementById("interface");
const left = document.getElementById("left");
const leftHeader = document.getElementById("left-header");
const lscroll = document.getElementById("left-scroll-pane");
const bottom = document.getElementById("bottom");
const bscroll = document.getElementById("bottom-scroll-pane");
const legend = document.getElementById("legend");

const source = {};

var down = false;
var top = left.clientHeight;

// older browsers
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

function updateInterface(e) {
  bottom.style.height = interface.clientHeight - (left.clientHeight + 36) + "px";

  legend.style.bottom = bottom.clientHeight + 10 + "px";
  legend.style.left = left.clientWidth + 10 + "px";
  legend.style.width = interface.clientWidth - left.clientWidth  - 42 + "px";

  //left._width = null;
}

left.addEventListener("mousedown", e => {
  down = true;
});

// leftHeader.addEventListener("click", e => {
//
//   if (left._width == undefined || left._width == null) {
//
//     left._width = left.style.width;
//     left.style.width = "0px"
//
//   } else {
//
//     left.style.width = left._width;
//     left._width = null;
//   }
//
// ;
// });

document.addEventListener("mousemove", e => {
  if (down) {
    updateInterface(e);
  }
});

document.addEventListener("mouseup", e => {
  if (down) {
    down = false;
  }
});

window.addEventListener("resize", e => {
  updateInterface(e);
})

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
    buildings : "data/syd/190315/buildings_existing.geojson",
    openSpaces : "data/syd/190315/public_open_spaces.geojson",
    blocks :  "data/syd/blocks.geojson",
    points :  "data/syd/points.geojson"
  }
}

var scheme1m = {
  id : "1m",
  data : {
    blocks :      "data/syd/190315/blocks_pr_1mil.geojson",
    buildings :   "data/syd/190315/buildings_pr_1mil.geojson",
    parks :       "data/syd/190315/parks_pr_1mil.geojson",
    ways : "data/syd/190315/ways_1mil_gc.geojson",
  }
}

var scheme700k = {
  id : "700k",
  data : {
    blocks :      "data/syd/190315/blocks_pr_700k.geojson",
    buildings :   "data/syd/190315/buildings_pr_700k.geojson",
    parks :       "data/syd/190315/parks_pr_700k.geojson",
    ways : "data/syd/190315/ways_700k_gc.geojson",
  }
}

var schemes = [
  schemeBase,
  scheme1m,
  scheme700k
]

updateInterface({target : null});

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

  var box = document.createElement("div");
  box.classList.add("box");
  box.classList.add("document");
  bscroll.appendChild(box);

  var boxLabel = document.createElement("div");
  boxLabel.classList.add("box-label");
  boxLabel.id = label + "-box";
  boxLabel.innerHTML = label;
  box.appendChild(boxLabel);

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
  boxContent.classList.add("collapsed"); // build parcoords then collapse ---

  var doc = document.createElement("div");
  doc.classList.add("document");

  var docLabel = document.createElement("div");
  docLabel.classList.add("document-label");
  docLabel.id = label + "-label";
  docLabel.innerHTML = " - " + label;

  var docContent = document.createElement("div");
  docContent.classList.add("document-content");
  docContent.id = label + "-content";

  doc.appendChild(docLabel);
  doc.appendChild(docContent);
  lscroll.appendChild(doc);

  mapController.addLegend(legend);

  docLabel.addEventListener("click", e => {

      if (docContent.classList.contains('collapsed')) {

        docContent.classList.remove("collapsed");
        docLabel.innerHTML = " - " + label;
        box.classList.remove("collapsed");

        mapController.toggleLayer(label, true);

      } else {

        docContent.classList.add("collapsed");
        docLabel.innerHTML = " + " + label;
        box.classList.add("collapsed");

        mapController.toggleLayer(label, false);
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
      //console.log("hide : " + property );
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
        }
      } else {
        boxContent.classList.remove("collapsed");
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
