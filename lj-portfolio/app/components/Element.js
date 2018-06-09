
class Element {

  constructor(node) {

    var self = this;

    this.node = node;
    this.data = node.data;
    this.item = new Item(this);

    this.selected = null;
    this.faded = null;
    this.enabled = null;

    build();

    function build() {

      self.object = document.createElement("div");
      self.object.id = self.getName(self.node);
      self.object.classList.add("element");
      self.object.style.zIndex = self.node.index;
      self.node.class.forEach(c => self.object.classList.add(c));

      if (self.getParent()) {
        self.banner = new Banner(self);
        self.object.appendChild(self.banner.get());
      } else {
        self.disable();
      }

      if (self.data) {
        self.content = new Content(self.data);
        self.object.appendChild(self.content.get());
      }
    }

    this.update();
  }

  update() {

    if (!this.needsUpdate()) {
      return;
    }

    this.object.style.height = this.node.dy + "px";
    this.object.style.width = this.node.dx + "px";

    this.object.style.top = this.node.y + "px";
    this.object.style.left = this.node.x + "px";
  }

  needsUpdate() {

    if (!this.node.prev) {
      return true;
    }

    console.log (this.node.dx == this.node.prev.dx || this.node.dy == this.node.prev.dy);

    return true;

  }

  getItem() {
    return this.item;
  }

  get() {
    return this.object;
  }

  color() {
    return "#000";
  }

  getNode() {
    return this.node;
  }

  onMouseLeave() {
    this.unhover();
  }

  onMouseEnter() {
    this.hover();
  }

  getParent() {
    return this.node.parent ? this.node.parent.element : null;
  }

  getNeighbors() {
    return this.getParent() ? this.getParent().getChildren().filter(n => n != this) : [];
  }

  getChildren() {
    return this.node.children ? this.node.children.map(n => n.element) : [];
  }

  getAllChildren() {
    var children = [];

    this.getChildren().forEach(child => {

      children.push(child);

      child.getAllChildren().forEach(subChild => {
        children.push(subChild);
      });
    });

    return children;
  }

  getAllChildrenNodes(node) {
    var self = this;
    var children = [];

    if (!node.children) {
      return children;
    }

    node.children.forEach(child => {

        children.push(child);

        self.getAllChildrenNodes(child).forEach(subchild => {
          children.push(subchild);
        })
    });

    return children;
  }

  getContent() {
    return this.content;
  }

  getName() {
    return this.node.name;
  }

  hover() {
    if (this.banner) {
      this.banner.hover();
    }

    if (this.getParent()) {
      this.getParent().hover();
    } else {
      this.fade();
    }
  }

  unhover() {
    if (this.banner) {
      this.banner.unhover();
    }

    if (this.getParent()) {
      this.getParent().unhover();
    } else {
      this.unfade();
    }
  }

  fade() {
    this.faded = true;

    this.object.classList.add("faded");
    if (this.getParent()) {
      this.getParent().fade();
    }
  }

  unfade() {
    this.faded = false;

    this.object.classList.remove("faded");
    if (this.getParent()) {
      this.getParent().unfade();
    }
  }

  enter() {
    if (this.banner) {
      this.banner.fade();
      this.disable();
    }

    if (this.getParent()) {
      this.getParent().enter();
    }
  }

  exit() {
    if (this.banner) {
      this.banner.unfade();
      this.enable();
    }

    if (this.getParent()) {
      this.getParent().exit();
    }
  }

  enable() {
    this.enabled = true;

    if (this.getParent()) {
      this.object.classList.remove("disabled");
    }
  }

  disable() {
    this.enabled = false;

    this.object.classList.add("disabled");
  }

  enableContent() {
    if (this.content) {
      this.content.enable();
    }
  }

  disableContent() {
    if (this.content) {
      this.content.disable();
    }
  }

  select() {
    this.selected = true;

    this.update();

    if (this.content) {

      this.content.update((function() {

        this.enter();
        this.enableContent();

      }).bind(this));

    } else {

      this.enter();
    }
  }

  deselect() {
    this.selected = false;

    if (this.content) {

      //this.content.get().scrollTop = 0;

      this.exit();
      this.disableContent();

    } else {

      this.exit();
    }

    this.update();
  }
}
