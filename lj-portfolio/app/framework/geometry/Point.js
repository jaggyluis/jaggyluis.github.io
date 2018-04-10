
class Point {
  
  constructor (x,y,z) {
    
    this._x = x;
    this._y = y;
    this._z = z;
  }
  
  toString() {
    return "Point : {" + this._x + ", " + this._y + ", " + this._z + "}";
  }
  
  getX() {
    return this._x;
  }
  
  getY() {
    return this._y;
  }
  
  getZ() {
    return this._z;
  }
  
}