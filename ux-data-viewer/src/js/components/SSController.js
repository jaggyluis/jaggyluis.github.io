
export default class SSController {

    constructor(options) {
      this._options = options || {};
    }

    setMapController(controller) {
      this._mapController = controller;
    }

    onAdd(map) {

        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        this._snapshotButton = this.buildSnapshotButton();
        this._toggleButton = this.buildToggleButton();
        this._helpButton = this.buildHelpButton();
        this._labelsButton = this.buildLabelsButton();
        this._exportButton = this.buildExportSchemaButton();

        this._cameraButton = this.buildCameraButton();
        this._cameraLabel = this.buildCameraLabel();
        this._saveButton = this.buildSaveCameraButton();
        this._selectButton = this.buildSelectCameraButton();
        this._deleteButton = this.buildDeleteCameraButton();
        this._nextButton = this.buildNextCameraButton();

        this._iterDiv = document.createElement("div");
        this._iterDiv.classList.add("mapboxgl-ctrl-group");
        this._iterDiv.classList.add("sub-group");
        this._iterDiv.classList.add("collapsed");

        var indicator = document.createElement("div");
        indicator.classList.add("mapboxgl-popup-tip");
        indicator.classList.add("ctrl")

        this._iterDiv.appendChild(indicator);
        this._iterDiv.appendChild(this._cameraLabel);
        this._iterDiv.appendChild(this._nextButton);
        this._iterDiv.appendChild(this._saveButton);
        //this._iterDiv.appendChild(this._selectButton);
        this._iterDiv.appendChild(this._deleteButton);

        // add everything ---

        this._container.appendChild(this._snapshotButton);
        this._container.appendChild(this._iterDiv);
        this._container.appendChild(this._cameraButton);

        this._container.appendChild(this._toggleButton);
        this._container.appendChild(this._labelsButton);
        this._container.appendChild(this._helpButton);
        this._container.appendChild(this._exportButton);

        this.updateCameras();

        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }

    updateCameras() {

      var camera = this._mapController.getCamera();
      var handlers = [
        'scrollZoom',
        'boxZoom',
        'dragRotate',
        'dragPan',
        'keyboard',
        'doubleClickZoom',
        'touchZoomRotate'
      ];

      console.log(camera);

      this._cameraLabel.innerHTML = camera;

      if (!(this._mapController) || this._mapController.getCameras().length == 0) {
        if (!this._nextButton.firstChild.classList.contains("inactive")) {
          this._nextButton.firstChild.classList.add("inactive");
        }
        if (!this._nextButton.classList.contains("disabled")) {
          this._nextButton.classList.add("disabled");
        }
      } else {
        if (this._nextButton.firstChild.classList.contains("inactive")) {
          this._nextButton.firstChild.classList.remove("inactive");
        }
        if (this._nextButton.classList.contains("disabled")) {
          this._nextButton.classList.remove("disabled");
        }
      }

      if (camera === "default") {

        if (!this._deleteButton.classList.contains("collapsed")) {
          this._deleteButton.classList.add("collapsed");
        }

        this._saveButton.title = "Save new view";
        this._saveButton.firstChild.src = "img/save-icon.png";
        if (this._saveButton.classList.contains("collapsed")) {
          this._saveButton.classList.remove("collapsed");
        }

        // handlers.forEach(h => {
        //   this._map[h].enable();
        // })

      } else {

        if (this._deleteButton.classList.contains("collapsed")) {
          this._deleteButton.classList.remove("collapsed");
        }

        this._saveButton.title = "Update view";
        this._saveButton.firstChild.src = "img/reset-icon.png";
        // if (!this._saveButton.classList.contains("collapsed")) {
        //   this._saveButton.classList.add("collapsed");
        // }

        // handlers.forEach(h => {
        //   this._map[h].disable();
        // })
      }

    }

    buildCameraLabel() {

      var label = document.createElement("div");
      label.classList.add("mapbox-custom-label");

      return label;
    }

    buildCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/perspective-icon.png";
      img.classList.add("mapbox-custom-ctrl");
      img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Camera";
      button.appendChild(img);
      button.selected = false;
      button.addEventListener("click", e => {

        console.log("toggle");

        if (button.selected) {
          button.selected = false;

          if (!img.classList.contains("inactive")) {
            img.classList.add("inactive");
          }

          if (!self._iterDiv.classList.contains("collapsed")) {
            self._iterDiv.classList.add("collapsed");
          }

        } else {
          button.selected = true;
          img.classList.remove("inactive");
          self._iterDiv.classList.remove("collapsed");
        }

      });

      return button;
    }

    buildSelectCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/pointer-icon.png";
      img.classList.add("mapbox-custom-ctrl");
      //img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Select View";
      button.appendChild(img);
      button.addEventListener("click", e => {

      });

      return button;

    }

    buildDeleteCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/trash-mapbox-icon.svg";
      img.classList.add("mapbox-custom-ctrl");
      //img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Delete View";
      button.appendChild(img);
      button.addEventListener("click", e => {

        if (self._mapController) {
          self._mapController.deleteCamera(self._mapController.getCamera());
        }

      });

      return button;
    }

    buildSaveCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/save-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");
      // img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Save View";
      button.appendChild(img);
      button.addEventListener("click", e => {

        if (self._mapController) {
          self._mapController.saveCamera(self._mapController.getCamera());
        }

      });

      return button;
    }

    buildNextCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/right-arrow-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");
      //img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Next Saved View [Tab]";
      button.appendChild(img);
      button.addEventListener("click", e => {

        if (self._mapController) {

          if (self._mapController.getCameras().length) {
            self._mapController.nextCamera();
          }

        }

      });

      return button;
    }

    buildExportSchemaButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/export-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");
      //img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      //button.classList.add("disabled");
      button.type = "button";
      button.title = "Export Scheme";
      button.appendChild(img);
      button.addEventListener("click", e => {

      });

      return button;
    }

    buildLabelsButton() {

      var self = this;

      var labelsImg = document.createElement("img");
      labelsImg.src = "img/label-icon.png";
      labelsImg.classList.add("mapbox-custom-ctrl");

      var labelsButton = document.createElement("button");
      labelsButton.classList.add("mapboxgl-ctrl-icon");
      labelsButton.type = "button";
      labelsButton.title = "Labels";
      labelsButton.selected = false;
      labelsButton.appendChild(labelsImg);
      labelsButton.addEventListener("click", e => {

        console.log("labels");

        var layers = self._map.getStyle().layers;

        var ids = [];
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol') {
            ids.push(layers[i].id);
          }
        }

        if (labelsButton.selected) {
          labelsButton.selected = false;
          labelsImg.classList.remove("inactive");

        } else {
          labelsButton.selected = true;
          labelsImg.classList.add("inactive");
        }

        ids.forEach(id => {
          self._map.setLayoutProperty(id, 'visibility', labelsButton.selected ? 'none' : 'visible' );
        });

      })

      return labelsButton;
    }

    buildSnapshotButton() {

      var self = this;

      var snapshotImg = document.createElement("img");
      snapshotImg.src = "img/camera-icon.png";
      snapshotImg.classList.add("mapbox-custom-ctrl");

      var snapshotButton = document.createElement("button");
      snapshotButton.classList.add("mapboxgl-ctrl-icon");
      snapshotButton.type = "button";
      snapshotButton.title = "Snapshot Map";
      snapshotButton.appendChild(snapshotImg);
      snapshotButton.addEventListener("click", e => {

        console.log("snapshot");

        self._map.getCanvas().toBlob(function (blob) {

          saveAs(blob, 'output.png');

          console.log('saved as output.png');

        });

      });

      return snapshotButton;
    }

    isExtruded() {
      return this._toggleButton.selected;
    }

    pitchControl(flat) {

      if (!this._mapController) {
        return;
      }

      var self = this;

      Object.keys(this._mapController.sources).forEach(key => {

        var source = this._mapController.sources[key];
        var propertyLayerId = source.layers.property;

        if (!propertyLayerId) {
          return;
        }

        if (source.types.includes("Polygon") || source.types.includes("MultiPolygon")) {

          if (flat) {

            console.log("make flat");
            self._map.setPaintProperty(propertyLayerId, "fill-extrusion-height", 0);
            self._map.setPaintProperty(propertyLayerId, "fill-extrusion-base", 0);

          } else {

            console.log("make extruded");
            self._map.setPaintProperty(propertyLayerId, "fill-extrusion-height", ["get", source.height]);
            self._map.setPaintProperty(propertyLayerId, "fill-extrusion-base", ["get", source.base]);
          }

        }
      });
    }

    fire(type) {
      if (type == "toggle") {
        this._toggleButton.click();
      } else if (type == "camera") {
        this.updateCameras();
      }
    }

    buildToggleButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/cube-icon.png";
      img.classList.add("mapbox-custom-ctrl");
      img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "3D View";
      button.appendChild(img);
      button.selected = false;
      button.addEventListener("click", e => {

        console.log("toggle");

        if (button.selected) {
          button.selected = false;
          //img.src = "img/cube-icon.png";
          img.classList.add("inactive");
          button.title = "3D View";;

          self._map.setPitch(0);
          self._map.setBearing(0);
          self._map.touchZoomRotate.disableRotation();
          self._map.dragRotate.disable();

        } else {
          button.selected = true;
          img.classList.remove("inactive");
          button.title = "Plan View";

          self._map.setPitch(30);

          self._map.touchZoomRotate.enableRotation();
          self._map.dragRotate.enable();
        }

        // if (e.isTrusted) {
        //   self._mapController.toggleCamera("default");
        // }

        self.pitchControl(!button.selected);

      });

      return button;
    }

    buildHelpButton() {

      var self = this;

      var helpImg = document.createElement("img");
      helpImg.src = "img/help-icon.png";
      helpImg.classList.add("mapbox-custom-ctrl");

      var helpButton = document.createElement("button");
      helpButton.classList.add("mapboxgl-ctrl-icon");
      helpButton.type = "button";
      helpButton.title = "App Info";
      helpButton.appendChild(helpImg);
      helpButton.addEventListener("click", e => {

        console.log("help");
      });

      return helpButton;
    }
}
