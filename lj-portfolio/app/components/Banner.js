
class Banner {
  
  constructor(element) {
    var self = this;
    
    this.element = element;
    this.node = element.node;
  
    build();
      
    function build() {
      
      self.object = document.createElement("div");
      self.object.classList.add("banner");
      self.object.style.zIndex = self.node.index + 1 + 10;
                
      self.image = document.createElement("div");
      self.image.classList.add("image");
      self.image.style.backgroundImage = "url(" + (self.node.banner ? self.node.banner : "app/images/banner.jpg") + ")";
      
      self.label = document.createElement("div");
      self.label.classList.add("label");
                  
      self.horizontal = document.createElement("div");
      self.horizontal.classList.add("horizontal");
      
      self.vertical = document.createElement("div");
      self.vertical.classList.add("vertical");
      self.vertical.innerHTML = self.element.getName();
      
      self.horizontal.appendChild(self.vertical);      
      
      self.label.appendChild(self.horizontal);
      
      self.object.appendChild(self.image);
      self.object.appendChild(self.label);
    }
  }
  
  get() {
    return this.object;
  }
  
  fade() {
    this.object.classList.add("faded");
  }
  
  unfade() {
    this.object.classList.remove("faded");
  }
  
  hover() {
    this.image.classList.add("hovered");
    this.vertical.classList.add("hovered");
    this.horizontal.classList.add("hovered");
  }
  
  unhover() {
    this.image.classList.remove("hovered");
    this.vertical.classList.remove("hovered");
    this.horizontal.classList.remove("hovered");
  }
}