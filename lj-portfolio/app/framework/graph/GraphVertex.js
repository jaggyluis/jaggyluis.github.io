
class GraphVertex {
  
  constructor(data) {
    
    this._data = data;
    this._edges = [];
  }
  
  toString() {
    return "Vertex : {" + this._data.toString() + "}";
  }
  
  getData() {
    return this._data;
  }
    
  getEdges() {
    return this._edges;
  }
  
  addEdge(e) {
    if (!e in this._edges) {
      this._edges.push(e);
    }
  }
   
}
