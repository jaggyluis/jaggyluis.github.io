

class App {

  constructor() {
    var self = this;

    this.canvas = document.getElementById("canvas");
    this.slider = document.getElementById("slider");
    this.corner = document.getElementById("corner");
    this.menu = document.getElementById("menu");

    this.luis = document.getElementById("luis");
    this.jaggy = document.getElementById("jaggy");

    this.home = document.getElementById("home");
    //this.back = document.getElementById("back");

    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.xScale = d3.scale.linear().range([0, this.width]);
    this.yScale = d3.scale.linear().range([0, this.height]);

    this.root;
    this.node;
    this.parent;
    this.navigation;
    this.elements;

    this.treemap = d3.layout
      .treemap()
      .ratio(1)
      .round(false)
      .size([this.width, this.height])
      .sticky(false)
      .value(function(d) {
        return self.getNodeSize(d);
      });

    d3.json("app/data/data.json", function(data) {

      self.node = self.root = data;
      self.parent = self.node;
      self.data = data;

      self.setNodeIndexes();

      self.elements = [];

      self.nodes = self.treemap.nodes(self.root);
      self.nodes.forEach(node => {

        var element = new Element(node);

        node.app = self;
        node.element = element;

        self.elements.push(element);
      });

      self.elements.forEach(element => {
        canvas.appendChild(element.get());
      });

      self.navigation = new Navigation(self.root.element.getChildren());
      self.navigation.getAllItems().forEach(item => {
        item.getNode().item = item;
      });

      self.slider.appendChild(self.navigation.get());

      // events ---

      // self.back.addEventListener("click", function(d) {
      //   self.unzoomNode();
      // });

      self.home.addEventListener("click", function(d) {
        self.zoomRoot();
      });

      self.slider.addEventListener("mouseenter", function (d) {
        self.hoverSlider();
      });

      self.slider.addEventListener("mouseleave", function (d) {
        self.unhoverSlider();
      });

      self.corner.addEventListener("mouseenter", function (d) {
        self.hoverCorner();
      });

      self.corner.addEventListener("mouseleave", function (d) {
        self.unhoverCorner();
      });

      self.elements.forEach(element => {

        element.get().addEventListener("mouseenter", function() {
          element.onMouseEnter();
        });

        element.get().addEventListener("mouseleave", function() {
          element.onMouseLeave();
        });

        element.get().addEventListener("click", function() {
          self.onElementClick(element.getNode());
        });
      });

      self.navigation.getAllItems().forEach(item => {

        item.getLabel().addEventListener("mouseenter", function() {
          item.hover();
          item.element.onMouseEnter();
        });

        item.getLabel().addEventListener("mouseleave", function() {
          item.unhover();
          item.element.onMouseLeave();
        });

        item.getLabel().addEventListener("click", function (d) {
            self.onNavClick(item.getNode());
        });
      });

      window.addEventListener("resize", function() {

        self.elements.forEach(element => {
            element.get().style.transitionDuration = "0s";
        });

        self.updateNodes();

        self.elements.forEach(element => {
            element.get().style.transitionDuration = "0.3s";
        });

      });
    });
  }

  onNavClick(node) {

    if (node.item.isExpanded()) {

      node.item.collapse();
      this.unzoomNode();

    } else {

      this.navigation.getAllItems().forEach(item => {
        item.collapse();
      });

      this.parent = node.item.getElement().getNode();
      this.zoomNode(node.item.getElement().getNode());

      node.item.expand();
    }
  }

  onElementClick(node) {

    if (this.node == node && node.element.getContent()) {

      this.unhoverSlider();

    } else {

      this.navigation.getAllItems().forEach(item => {
        item.collapse();
      });

      this.zoomNode(node);

      node.item.expand();
    }
  }

  hoverSlider() {

    if (this.canvas.classList.contains("delay")) {
    this.slider.classList.add("delay");
    }

    this.canvas.classList.add("right");
    this.slider.classList.add("hovered");

    this.navigation.uncoverNavigation();
  }

  unhoverSlider(){
    this.slider.classList.remove("delay");
    this.canvas.classList.remove("delay");
    this.canvas.classList.remove("right");
    this.slider.classList.remove("hovered");

    this.navigation.coverNavigation();
  }

  hoverCorner() {
    this.slider.classList.remove("delay");
    this.canvas.classList.remove("delay");
    this.canvas.classList.add("down");
    this.corner.classList.add("hovered");

    this.hoverName();
  }

  unhoverCorner() {
    this.canvas.classList.add("delay");
    this.canvas.classList.remove("down");
    this.corner.classList.remove("hovered");
    this.home.classList.remove("hovered");

    this.unhoverName();
  }

  hoverName() {
    this.luis.classList.add("expanded");
    this.jaggy.classList.add("expanded");
  }

  unhoverName() {
    this.luis.classList.remove("expanded");
    this.jaggy.classList.remove("expanded");
  }

  setNodeIndexes() {

    this.treemap
      .nodes(this.root)
      .filter(n => { return !n.children; })
      .forEach(n => {
        n.index = 0;
        increaseIndex(n);
      });

    function increaseIndex(n) {

      if (n.parent == undefined) return;
      if (n.parent.index == undefined) {
        n.parent.index = n.index + 1;
      } else {
        n.parent.index++;
      }

      increaseIndex(n.parent);
    }

  }

  getNodeSize(d) {
    return 1;
  }

  unzoomNode() {

    this.node.item.collapse();

    if (this.node.parent) {
      this.zoomNode(this.node);
    } else {
      this.zoomNode(this.root);
    }
  }

  zoomRoot() {

    this.zoomNode(this.root);

    this.navigation.getAllItems().forEach(item => {
      item.collapse();
    });
  }

  zoomNode(d) {

    this.canvas.scrollTop = 0;

    var self = this;
    var node = d;

    if (node.parent == undefined) {

      // do nothing : node is root ---

    } else if (self.node == node.parent){

      // do nothing : node is selected ---

    } else {

      while(node.parent != undefined && node.parent != self.node) {

        if (node == self.parent) break;
        node = node.parent;
      }
    }

    if (node == this.node) return;

    var kx = this.width / node.dx,
      ky = this.height / node.dy;

    this.xScale.domain([node.x, node.x + node.dx]);
    this.yScale.domain([node.y, node.y + node.dy]);

    this.nodes.forEach(d => {
          d.y = self.yScale(d.y);
          d.x = self.xScale(d.x);
          d.dy = ky * d.dy;
          d.dx = kx * d.dx;
    });

    this.parent = this.node;
    this.node = node;

    this.updateElements();
  }

  updateNodes() {
    var self = this;

    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.xScale = d3.scale.linear().range([0, this.width]);
    this.yScale = d3.scale.linear().range([0, this.height]);

    this.treemap = d3.layout
      .treemap()
      .ratio(1)
      .round(false)
      .size([this.width, this.height])
      .sticky(false)
      .value(function(d) {
        return self.getNodeSize(d);
      });

    var nodes = this.treemap(this.data);

    this.nodes.forEach(node => {

      nodes.forEach(other => {

        if (node.name == other.name) {

          node.x = other.x;
          node.y = other.y;
          node.dx = other.dx;
          node.dy = other.dy;
        }

      });

      node.element.update();
    });

    this.zoomRoot();
  }

  updateElements() {

    this.elements.forEach(e => {
      e.deselect();
    });

    this.node.element.select();
  }
}

var app = new App();
