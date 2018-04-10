
class Item {

  constructor(element) {
    var self = this;
    
    this.element = element;
    this.parent;
    this.children = [];
    this.neighbors = [];
    
    this.expanded = false;

    build();
      
    function build() {
      
      self.object = document.createElement("div");
      self.object.classList.add("navigation-item");
      
      self.label = document.createElement("div");
      self.label.classList.add("navigation-label")
      
      self.tag = document.createElement("div");
      self.tag.classList.add("navigation-tag");
      self.tag.innerHTML = self.element.getName();
      
      self.back = document.createElement("div");
      self.back.classList.add("navigation-back");
      self.back.classList.add("hidden");
      self.back.innerHTML = ">>";
      
      self.sub = document.createElement("div");
      self.sub.classList.add("navigation-sub")
      self.sub.classList.add("collapsed");
      
      self.label.appendChild(self.back);
      self.label.appendChild(self.tag);
      
      self.object.appendChild(self.label);
      self.object.appendChild(self.sub);
    }
  }
  
  get() {
    return this.object;
  }
  
  isExpanded() {
    return this.expanded;
  }
  
  getLabel() {
    return this.label;
  }
  
  setSub() {
    return this.sub;
  }
  
  getElement() {
    return this.element;
  }
  
  getNode() {
    return this.element.getNode();
  }
  
  getChildren() {
    return this.children;
  }
  
  getParent() {
    return this.parent;
  }
  
  setParent(parent) {
    this.parent = parent;
  }
  
  addNeighbor(neighbor) {
    this.neighbors.push(neighbor);
  }
  
  getNeighbors() {
    return this.neighbors;
  }
  
  getAllChildren() {
    var children = [];
    
    this.getChildren().forEach(child => {
      
      children.push(child);
      child.setParent(this);
      
      child.getAllChildren().forEach(subChild => {
        children.push(subChild);
      });
    });
    
    return children;
  }
  
  update() {
    var self = this;
    
    this.children = [];
    
    this.element.getChildren().forEach(child => {
        
        child.getItem().update();
        
        self.children.push(child.getItem());
        self.sub.appendChild(child.getItem().get());    
    });
    
    this.getChildren().forEach(child => {
          
      this.getChildren().forEach(other => {
        
        if (child != other) {
          
          child.addNeighbor(other);
        }
        
      });
    });
    
    var l = (self.element.node.depth * 30);
    var v = "hsl(0, 0%, " + l + "%)"
          
    this.tag.style.backgroundColor = v;
  }
  
  onMouseClick() {
    this.sub.classList.toggle("collapsed");
  }
  
  hover() {
    this.tag.classList.add("hovered");
  }
  
  unhover() {
    this.tag.classList.remove("hovered");
  }
      
  collapse() {
    this.sub.classList.add("collapsed");
    this.tag.classList.remove("expanded");
    this.back.classList.add("hidden");
    this.tag.classList.remove("selected");
    this.label.classList.remove("selected");
    this.expanded = false;
  }
  
  expand() {
    
    if (this.element.getContent()) {
      
      this.tag.classList.add("selected");
      this.label.classList.add("selected");
      
    } else {
      
      this.sub.classList.remove("collapsed");
      this.tag.classList.add("expanded");
      this.back.classList.remove("hidden");
      
      this.expanded = true;
    }
    
    if (this.parent) {
      this.parent.expand();
    }
  }
}