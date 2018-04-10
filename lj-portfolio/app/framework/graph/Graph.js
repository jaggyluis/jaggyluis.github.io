
class Graph {
  
  constructor() {
    
    this._vertices = [];
    this._edges = [];
  }
  
  toString() {
    return "Graph : { V[" + this._vertices.length + "], E[" + this._edges.length + "]}"; // TODO - not unique ---
  }
  
  connect(v1, v2) {
    this.addVertex(v1);
    this.addVertex(v2);
    
    var edge = new GraphEdge(v1, v2)
    
    v1.addEdge(edge);
    v2.addEdge(edge);
    
    this.addEdge(edge);
  }
    
  disconnect(v1, v2) {
      
  }
    
  addVertex(v) {
    if (!v in this._vertices) {
      this._vertices.push(v);
    }
  }
    
  removeVertex(v) {
    
  }
    
  addEdge(e) {
    if (!e in this._edges){
      this._edges.push(e);
    }
  }
    
  removeEdge(e) {
    
  }
   
}