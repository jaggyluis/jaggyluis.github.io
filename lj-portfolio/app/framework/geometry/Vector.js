
class Vector {
  
  constructor(dx, dy, dz) {
    
    this._dx = dx;
    this._dy = dy;
    this._dz = dz;
  }
  
  toString() {
    return "Vector : {" + this._dx + ", " + this._dy + ", " + this._dz + "}";
  }
  
  getDX() {
    return this._dx;
  }
  
  getDY() {
    return this._dy
  }
  
  getDZ() {
    return this._dz;
  }
  
}