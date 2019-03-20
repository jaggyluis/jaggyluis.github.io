
// Control implemented as ES6 class
class SSController {

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

        this._container.appendChild(this._snapshotButton);
        this._container.appendChild(this._toggleButton);
        this._container.appendChild(this._labelsButton);
        this._container.appendChild(this._helpButton);

        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
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
      snapshotButton.title = "Snapshot";
      snapshotButton.appendChild(snapshotImg);
      snapshotButton.addEventListener("click", e => {

        console.log("snapshot");

        html2canvas(document.body).then(canvas => {

          var img = new Image();
          img.src = canvas.toDataURL();

          var a = document.createElement('a');
          a.href = img.src;
          a.download = "output.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

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
        var filterId = source.layers.filter;

        if (!filterId) {
          return;
        }

        if (source.types.includes("Polygon") || source.types.includes("MultiPolygon")) {

          if (flat) {

            console.log("make flat");
            self._map.setPaintProperty(filterId, "fill-extrusion-height", 0);

          } else {

            console.log("make extruded");
            self._map.setPaintProperty(filterId, "fill-extrusion-height", ["get", source.height]);
          }

        }
      });
    }

    buildToggleButton() {

      var self = this;

      var toggleImg = document.createElement("img");
      toggleImg.src = "img/cube-icon.png";
      toggleImg.classList.add("mapbox-custom-ctrl");
      toggleImg.classList.add("inactive");

      var toggleButton = document.createElement("button");
      toggleButton.classList.add("mapboxgl-ctrl-icon");
      toggleButton.type = "button";
      toggleButton.title = "Perspective";
      toggleButton.appendChild(toggleImg);
      toggleButton.selected = false;
      toggleButton.pitch = 20;
      toggleButton.addEventListener("click", e => {

        console.log("toggle");

        if (toggleButton.selected) {
          toggleButton.selected = false;
          toggleImg.src = "img/cube-icon.png";
          toggleImg.classList.add("inactive");
          toggleButton.title = "Perspective Toggle";
          toggleButton.pitch = map.getPitch();

          map.setPitch(0);
          map.setBearing(0);
          map.touchZoomRotate.disableRotation();
          map.dragRotate.disable();

        } else {
          toggleButton.selected = true;
          //toggleImg.src = "img/toggle-icon.png";
          toggleImg.classList.remove("inactive");
          toggleButton.title = "Plan Toggle";

          map.setPitch(toggleButton.pitch);

          map.touchZoomRotate.enableRotation();
          map.dragRotate.enable();
        }

        self.pitchControl(!toggleButton.selected);

      });

      return toggleButton;
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
