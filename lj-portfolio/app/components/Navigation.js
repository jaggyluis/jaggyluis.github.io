
class Navigation {
  
  constructor(elements) {
    var self = this;
    
    this.elements = elements;
    this.items = [];
  
    build();
      
    function build() {
      
      self.object = document.createElement("div");
      self.object.classList.add("navigation");
      
      self.cover = document.createElement("div");
      self.cover.innerHTML = "|||";
      
      self.object.appendChild(self.cover);
      
      self.cover.classList.add("navigation-cover");
      
      self.elements.forEach(element => {
        
        var item = element.getItem();
        
        item.update();
        
        self.items.push(item);
        self.object.appendChild(item.get());
      });
    }
  }
  
  get() {
    return this.object;
  }
  
  coverNavigation() {
    this.cover.classList.remove("uncovered");
  }
  
  uncoverNavigation() {
    this.cover.classList.add('uncovered');
  }
  
  getItems() {
    return this.items;
  }
  
  getAllItems() {
    var items = [];
    
    this.getItems().forEach(item => {
      
      items.push(item);
      
      item.getAllChildren().forEach(child => {
        items.push(child);
        
      })
    });
    
    return items;
  }
}