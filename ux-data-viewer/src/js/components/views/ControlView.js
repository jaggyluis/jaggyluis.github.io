export default class ControlView {

    constructor(controller) {
      this._mapController = controller;
    }

    onAdd(map) {

        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        this._snapshotButton = this.buildSnapshotButton();
        this._toggleButton = this.buildToggleButton();
        this._helpButton = this.buildHelpButton();
        this._exportButton = this.buildExportSchemaButton();

        // layers ---

        this._layersButton = this.buildLayersButton();
        this._maskButton = this.buildMaskButton();
        this._boundaryButton = this.buildBoundaryButton();
        this._labelsButton = this.buildLabelsButton();

        this._layerDiv = document.createElement("div");
        this._layerDiv.classList.add("mapboxgl-ctrl-group");
        this._layerDiv.classList.add("sub-group");
        this._layerDiv.classList.add("collapsed");

        var _layerIndicator = document.createElement("div");
        _layerIndicator.classList.add("mapboxgl-popup-tip");
        _layerIndicator.classList.add("ctrl")

        this._layerDiv.appendChild(_layerIndicator);
        this._layerDiv.appendChild(this.buildLabel("boundary"));
        this._layerDiv.appendChild(this._boundaryButton);
        this._layerDiv.appendChild(this.buildLabel("mask"));
        this._layerDiv.appendChild(this._maskButton);
        this._layerDiv.appendChild(this.buildLabel("labels"));
        this._layerDiv.appendChild(this._labelsButton);

        // camera ---

        this._cameraButton = this.buildCameraButton();
        this._cameraLabel = this.buildLabel();
        this._saveButton = this.buildSaveCameraButton();
        this._deleteButton = this.buildDeleteCameraButton();
        this._nextButton = this.buildNextCameraButton();

        this._iterDiv = document.createElement("div");
        this._iterDiv.classList.add("mapboxgl-ctrl-group");
        this._iterDiv.classList.add("sub-group");
        this._iterDiv.classList.add("collapsed");

        var _iterIndicator = document.createElement("div");
        _iterIndicator.classList.add("mapboxgl-popup-tip");
        _iterIndicator.classList.add("ctrl")

        this._iterDiv.appendChild(_iterIndicator);
        this._iterDiv.appendChild(this._cameraLabel);
        this._iterDiv.appendChild(this._nextButton);
        this._iterDiv.appendChild(this._saveButton);
        this._iterDiv.appendChild(this._deleteButton);

        // add everything ---

        this._container.appendChild(this._snapshotButton);

        this._container.appendChild(this._iterDiv);
        this._container.appendChild(this._cameraButton);

        this._container.appendChild(this._toggleButton);

        this._container.appendChild(this._layerDiv);
        this._container.appendChild(this._layersButton);

        this._container.appendChild(this._helpButton);
        this._container.appendChild(this._exportButton);

        this.updateCameras();
        this.updateLayers();
        this.updateToggle();

        return this._container;
    }

    fire(type) {
      if (type == "toggle") {
        this.updateToggle();
      } else if (type == "camera") {
        this.updateCameras();
      } else if (type == "layers") {
        this.updateLayers();
      }
    }

    onRemove() {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }


    buildLabel(text) {

      var label = document.createElement("div");
      label.classList.add("mapbox-custom-label");

      if (text) {
        label.innerHTML = text;
      }

      return label;
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

          if (self._layersButton.selected) {
            self._layersButton.click(); // only one menu open at a time ---
          }
        }

      });

      return button;
    }

    buildDeleteCameraButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/trash-mapbox-icon.svg";
      img.classList.add("mapbox-custom-ctrl");

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

    updateLayers() {

      var self = this;

      if (self._mapController.isBoundaryVisible()) {
        self._boundaryButton.firstChild.classList.remove("inactive");
      } else {
        if (!self._boundaryButton.firstChild.classList.contains("inactive")) {
          self._boundaryButton.firstChild.classList.add("inactive");
        }
      }

      if (self._mapController.isMasked()) {
        self._maskButton.firstChild.classList.remove("inactive");
      } else {
        if (!self._maskButton.firstChild.classList.contains("inactive")) {
          self._maskButton.firstChild.classList.add("inactive");
        }
      }

      if (self._mapController.areLabelsVisible()) {
       self._labelsButton.firstChild.classList.remove("inactive");
      } else {
       if (!self._labelsButton.firstChild.classList.contains("inactive")) {
         self._labelsButton.firstChild.classList.add("inactive");
       }
      }
    }

    buildLayersButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/levels-icon.png";
      img.classList.add("mapbox-custom-ctrl");
      img.classList.add("inactive");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Layers";
      button.appendChild(img);
      button.selected = false;
      button.addEventListener("click", e => {

        if (button.selected) {
          button.selected = false;

          if (!img.classList.contains("inactive")) {
            img.classList.add("inactive");
          }

          if (!self._layerDiv.classList.contains("collapsed")) {
            self._layerDiv.classList.add("collapsed");
          }

        } else {
          button.selected = true;
          img.classList.remove("inactive");
          self._layerDiv.classList.remove("collapsed");

          if (self._cameraButton.selected) {
            self._cameraButton.click(); // only one menu open at a time ---
          }
        }

      });

      return button;
    }

    buildBoundaryButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/view-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Boundaries";
      button.appendChild(img);
      button.addEventListener("click", e => {
        self._mapController.toggleBoundaryVisible(!self._mapController.isBoundaryVisible());
      });

      return button;
    }

    buildMaskButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/view-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Mask";
      button.appendChild(img);
      button.addEventListener("click", e => {
        self._mapController.toggleMask(!self._mapController.isMasked());
      });

      return button;
    }

    buildLabelsButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/view-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Labels";
      button.appendChild(img);
      button.addEventListener("click", e => {
        self._mapController.toggleLabelsVisible(!self._mapController.areLabelsVisible());
      });

      return button;
    }

    updateToggle() {

      var self = this;

      if (!self._mapController.isExtruded()) {
        self._toggleButton.title = "3D View";
        if (!self._toggleButton.firstChild.classList.contains("inactive")) {
          self._toggleButton.firstChild.classList.add("inactive");
        }
      } else {
        self._toggleButton.title = "Plan View";
        self._toggleButton.firstChild.classList.remove("inactive");
      }
    }

    buildToggleButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/cube-icon.png";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "3D View";
      button.appendChild(img);
      button.addEventListener("click", e => {
        self._mapController.toggleExtruded(!self._mapController.isExtruded());
      });

      return button;
    }

    buildHelpButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/help-icon.png";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "App Info";
      button.appendChild(img);
      button.addEventListener("click", e => {
        console.log("help");
      });

      return button;
    }

    buildSnapshotButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/camera-icon.png";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Snapshot Map";
      button.appendChild(img);
      button.addEventListener("click", e => {
        self._map.getCanvas().toBlob(function (blob) {
          saveAs(blob, 'output.png');
        });

      });

      return button;
    }

    buildExportSchemaButton() {

      var self = this;

      var img = document.createElement("img");
      img.src = "img/export-icon.png";
      img.style = "transform: scale(0.8, 0.8); ";
      img.classList.add("mapbox-custom-ctrl");

      var button = document.createElement("button");
      button.classList.add("mapboxgl-ctrl-icon");
      button.type = "button";
      button.title = "Export Scheme";
      button.appendChild(img);
      button.addEventListener("click", e => {

        var encode = function( s ) {
          var out = [];
          for ( var i = 0; i < s.length; i++ ) {
            out[i] = s.charCodeAt(i);
          }
          return new Uint8Array( out );
        }

        var obj = self._mapController.buildSchema();
        var str = JSON.stringify(obj);
        var data = encode( str );
        var blob = new Blob( [ data ], {
          type: 'application/octet-stream'
        });

        saveAs(blob, 'schema.json');
      });

      return button;
    }
}
