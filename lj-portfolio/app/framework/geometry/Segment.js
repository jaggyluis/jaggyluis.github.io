
class Segment {
  
  constructor (startPoint, endPoint) {
    
    this._startPoint = startPoint;
    this._endPoint = endPoint
  }
  
  toString() {
    return "Segment : {" + this._startPoint.toString() + ", " + this._endPoint.toString() + "}"
  }
  
  getStartPoint() {
    return this._startPoint;
  }
  
  getEndPoint() {
    return this._getEndPoint;
  }
  
}
