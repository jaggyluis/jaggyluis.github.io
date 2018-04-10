

class GraphEdge {
  
  constructor(startVertex, endVertex) {
    
    this._startVertex = startVertex;
    this._endVertex = endVertex;  
  }
  
  toString() {
    return "Edge : {" + this._startVertex.toString() + ", " this._endVertex.toString() + "}";
  }
    
  getStartVertex() {
    return this._startVertex;
  }
  
  getEndVertex() {
    return this._endVertex;
  }
  
  getOther(v) {
    return this._startVertex === v ? this._endVertex : this._endVertex === v ? this._startVertex : null; 
  }
  
  getVertices() {
    return [this._startVertex, this._endVertex];
  }
  
}