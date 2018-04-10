
class Ray {
  
  constructor(originPoint, directionVector) {
    
    this._originPoint = originPoint;
    this._directionVector = directionVector;
  }
  
  toString() {
    return "Ray : {" + this._originPoint.toString() + ", " + this.directionVector.toString() + "}";
  }
  
  getOriginPoint() {
    return this._originPoint;
  }
  
  getDiretionVector() {
    return this._directionVector;
  }
  
}