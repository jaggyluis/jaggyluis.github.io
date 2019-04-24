import MapController from "./MapController.js";

export default class MapView {

  constructor (schema) {

    document.body.innerHTML += this.getBody();

    mapboxgl.accessToken = 'pk.eyJ1IjoiamFnZ3lsdWlzIiwiYSI6ImNqcmdrdWRyNzFlenQ0M3BvODZ6ZjJwcnUifQ.T8htDIqiD0Vy8WOEE7ZssQ';

    var self = this; // scope switch ---

    self.controller = null;
    self.schema = null;
    self.options = null;
    self.map = new mapboxgl.Map({
        container: 'map',
        style: "mapbox://styles/jaggyluis/cjt7g0t1g6gk61fqrbcrkil1i",
        zoom: 0.1,
        preserveDrawingBuffer: true
    });

    // interface ---
    self.interface = document.getElementById("interface");
    self.topDiv = document.getElementById("top");
    self.left = document.getElementById("left");
    self.leftHeader = document.getElementById("left-header");
    self.leftHeader.addEventListener("click", e => {
      if (self.controller && Object.keys(self.controller.sources).length === 0) {
        return;
      }

      self.lscroll.classList.toggle("collapsed");
    });
    self.lscroll = document.getElementById("left-scroll-pane");

    self.bottom = document.getElementById("bottom");
    self.bottomHeader = document.getElementById("bottom-header");
    self.bottomHeader.addEventListener("click", e => {
      if (!areFiltersPresent() || self.bottom.classList.contains("expanded")) {
        return;
      }
      self.bscroll.classList.toggle("collapsed");
    })
    self.bscroll = document.getElementById("bottom-scroll-pane");
    self.legend = document.getElementById("legend");

    // schema loader for if none is present ---
    dropFile(document.getElementsByTagName('body')[0], ['json'], (fileData, fileName) => {
      self.loadSchema(fileData, fileName);
    });

    // default loader for additional files ---
    dropFile(document.getElementsByTagName('body')[0], ['geojson'], (fileData, fileName) => {
      self.loadData(fileData, fileName);
    });

    if (schema) {
      self.loadSchema(schema); // loader for data from init ---
    }
  }

  getBody() {
    return '<div id="map"></div>' +
     '<div id="interface">' +
       '<div id="top">' +
         '<div id="left">' +
           '<div id="left-header">data</div>' +
           '<div id="left-scroll-pane">' +
           '</div>' +
         '</div>' +
         '<div id="right"> ' +
          '<div id="legend"></div>' +
         '</div> ' +
       '</div>' +
       '<div id="bottom">' +
         '<div id="bottom-header">filter</div>' +
         '<div id="bottom-scroll-pane">' +
         '</div>' +
       '</div>' +
     '</div>' +
     '<div id="banner">' +
       '<div id="tt">' +
         '<img src="img/loadloop.gif" id="loader" class="collapsed"></img>' +
       '</div>' +
       '<div id="wb"><img src="img/logo--woods-bagot.svg"/></div>' +
       '<div id="ss"><img src="img/SUPERSPACE Logo.png"/></div>' +
     '</div>';
  }

  loadSchema(schema, name) {

    var self = this;

    var t0 = performance.now();
    console.log("call load schema");

    var json = JSON.parse(schema);

    if (json.type !== "SSDataSchema" || self.schema !== null) {
      return;
    }

    self.schema = json; // singleton ---
    self.options = json.options || {}; // global ---

    if (self.controller === null) {
      self.controller = new MapController(self.map, self.options);
      self.controller.addLegend(self.legend);
    }

    function loadBoundaries(cb) {

      var boundaries = json.boundaries.length ;

      json.boundaries.forEach(boundary => {
        d3.json(boundary.url, d => {
          self.loadDataBoundary(d, boundary.id, boundary.options || {});

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
        d3.json(schema.url, d => {
          self.loadDataLayer(d, schema.id, schema.options || {});

          schemas -= 1;

          if (!schemas && cb) {
            cb();
          }

        });
      });
    }

    function loadCameras(cb) {

      json.cameras.forEach(camera => {
        self.loadDataCamera(camera, camera.id, camera.options || {});

      });
    }

    var tt = document.getElementById("tt");
    var ts = document.createElement("div");
    ts.id = "ts";
    ts.innerHTML = json.title || "";

    tt.appendChild(ts);

    if (json.options) {
      if (json.options.data === false) {
        self.left.classList.add("collapsed");
      }
      if (json.options.filter === false) {
        self.bottom.classList.add("collapsed");
      }
    }

    if (json.cameras && json.cameras.length) {
      loadCameras();
    }

    if (json.options && json.options.camera) {
      if (self.controller)  {
          self.controller.toggleCamera(json.options.camera);
      }
    }

    if (json.boundaries && json.boundaries.length) {
      loadBoundaries(() => {
        loadSchemas();
      });

    } else {
      if (json.schemas && json.schemas.length) {
        loadSchemas();
      }
    }

    var t1 = performance.now();
    console.log("call to load scheme took " + (t1 - t0) + " milliseconds.");
  }

  loadData(data, name) {

    var self = this;

    var t0 = performance.now();
    console.log("call load data");

    if (self.controller === null) {
      self.controller = new MapController(self.map, {});
      self.controller.addLegend(self.legend);
    }

    self.loadDataLayer(JSON.parse(data), name.split(".")[0], {});

    var t1 = performance.now();
    console.log("call to load data took " + (t1 - t0) + " milliseconds.");
  }

  loadDataCamera(data, label, options) {
    if (this.controller) {
      this.controller.addCamera(label, data, options);
    }
  }

  loadDataBoundary(data, label, options) {
    if (this.controller) {
      this.controller.addBoundary(label, data, options);
    }
  }

  loadDataLayer(data, label, options) {
    if (!this.controller) {
      return;
    }

    var self = this;

    self.controller.addSource(label, data, options);
    self.controller.addLayers(label);
    self.controller.toggleLayers(label, false); // NOTE - init off ---

    var hidden = (options.properties ? options.properties.hidden || [] : []).concat("_id", "lat", "lon");

    // build the box first ---

    var box = document.createElement("div");
    box.classList.add("box");
    box.classList.add("document");
    self.bscroll.appendChild(box);

    var boxHeader = document.createElement("div");
    boxHeader.classList.add("box-header");
    boxHeader.id = label + "-box-header"

    var boxSubHeader = document.createElement("div");
    boxSubHeader.classList.add("box-sub-header");
    boxSubHeader.id = label + "-box-sub-header"

    box.appendChild(boxHeader);
    box.appendChild(boxSubHeader);

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

      var data = self.controller.getSourceData(label).slice();
      var properties = self.controller.getProperties(label, true, false).slice();
      properties.push("_id");

      data.sort(function(a,b) {
        return a._id - b._id;
      });

      exportObjArrayToCSV(label + "_data", data, properties);
    });

    if (!(self.options && self.options.download === false)) {
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

    self.controller.addCoordsView(label, boxCoords);

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

    self.controller.addSheetView(label, boxSheet);

    sheetButton.addEventListener("click", e => {

      if (boxSheet.classList.contains('collapsed')) {

        boxSheet.classList.remove("collapsed");
        self.topDiv.classList.remove("collapsed");
        self.bottom.classList.remove("expanded");

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
        self.topDiv.classList.remove("collapsed");
        self.bottom.classList.remove("expanded");

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

      if (!self.topDiv.classList.contains('collapsed')) {

        self.topDiv.classList.add("collapsed");

        if (!self.bottom.classList.contains("expanded")) {
          self.bottom.classList.add("expanded");
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

        self.topDiv.classList.remove("collapsed");
        self.bottom.classList.remove("expanded");
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

      var nodes = Array.prototype.slice.call(self.lscroll.children );
      var index = nodes.indexOf(doc);

      if (index == -1 || index == 0) {
        return;
      }

      self.controller.moveSourceDown(label);

      self.lscroll.insertBefore(doc, self.lscroll.children[index -1]);

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

      var nodes = Array.prototype.slice.call(self.lscroll.children );
      var index = nodes.indexOf(doc);

      if (index == -1 || index == nodes.length -1) {
        return;
      }

      self.controller.moveSourceUp(label);

      self.lscroll.insertBefore(doc, self.lscroll.children[index + 2]);

    });

    docHeader.appendChild(docMoveUpButton);

    var docContent = document.createElement("div");
    docContent.classList.add("document-content");
    docContent.classList.add("collapsed"); // adde-d ---
    docContent.id = label + "-document-content";

    doc.appendChild(docContent);

    self.lscroll.appendChild(doc);

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
          self.controller.toggleLayers(label, false);

        } else {

          docViewButton.selected = true;

          docViewImg.classList.add("selected");
          self.controller.toggleLayers(label, true); // move this to new button ---
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

    if (self.options && self.options.active === label) {
      docFilterButton.click();
    }

    var propertyCheckBoxes = [];

    self.controller.getProperties(label).forEach((property, index) => {

      var propertyState = self.controller.getPropertyState(label, property);

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

      propertyHeader.appendChild(propertyCheckBox);
      propertyHeader.appendChild(propertyLabel);
      propertyDiv.appendChild(propertyHeader);
      docContent.appendChild(propertyDiv);

      var propertyContent = null;

      propertyCheckBoxes.push([property, propertyCheckBox, propertyLabel, propertyContent]);

      propertyCheckBox.addEventListener("click", (e) => {

        var ctrl = self.controller.areKeysDown(["Control"]);

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

            self.controller.toggleProperty(label, tuple[0], false);
          });

        }

        if (e.target.checked) {

          propertyLabel.classList.add("selected");
          self.controller.toggleProperty(label, property, true);

          if (propertyContent !== null) {
            propertyContent.classList.remove("collapsed");
          }

        } else {

          propertyLabel.classList.remove("selected");
          self.controller.toggleProperty(label, property, false);

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
        var propertyOptions = propertyState.propertyOptions;
        var propertyCategoryCheckBoxes = [];;

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

            var ctrl = self.controller.areKeysDown(["Control"]);

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

              self.controller.addFilters(label, filters);

            }

            if (e.target.checked) {

              categoryLabel.classList.add("selected");

              self.controller.removeFilter(label, category);

            } else {

              categoryLabel.classList.remove("selected");

              self.controller.addFilters(label, [{
                filterKey : category,
                filter : (value) => {
                    return value[property] === category;
                }
              }]);
            }

          });

          if (propertyOptions && propertyOptions.selected && !propertyOptions.selected.includes(category)) {
            categoryCheckBox.click();
          }

        });
      }

      if (options.properties && options.properties.selected && options.properties.selected.includes(property)) {
        propertyCheckBox.click();
      }

    });
  }
}

// ---------------------------------------
// ---------------------------------------
// ---------------------------------------
// --------------------------------------- util

function areFiltersPresent() {

  var filters = document.getElementsByClassName("document-filter-button");

  for (var i = 0; i< filters.length; i++) {
    if (filters[i].selected) {
      return true;
    }
  }

  return false;
}

function dropFile(dropZoneElement, fileExtensionFilters, cb) {

  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success!
    function handleJSONDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      var files = evt.dataTransfer.files;
        // Loop through the FileList and read
        for (var i = 0, f; f = files[i]; i++) {

          var ext = f.name.split('.').pop();

          // Only process extension files.
          if (!(fileExtensionFilters.includes(ext))) {

            console.log("file not in extensions")

            continue;
          }

          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onload = (function(theFile) {

            return function(e) {
              cb(e.target.result, theFile.name); // NOTE - this is where the event is called ---

            };

          })(f);

          reader.readAsText(f);
        }
    }

    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // Setup the dnd listeners.
    var dropZone = dropZoneElement;
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleJSONDrop, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}
