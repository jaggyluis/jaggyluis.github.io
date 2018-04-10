
class PolyLine {
  
  constructor (points, closed) {
  
    this._points = points;
    this._edges = [];
    
    // NOTE - assumes points.length > 1
    
    for (var i =0; i< points.length-1; i++) {
      this._edges.push(new Segment(points[i], points[i+1]))
    }
    
    if (closed) {
      this._edges.push(new Segment(points[points.length -1], points[0]))
    }  
  }
  
  toString() {
    
    var str = "";
    
    this._points.forEach( p => {
      str += p.toString();
    });
    
    return str;
  }
}