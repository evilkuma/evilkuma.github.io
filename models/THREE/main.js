
define(function(require) {

  THREE.Vector3.prototype.toFixed = function(a = 10) {
    this.x = +this.x.toFixed(a)
    this.y = +this.y.toFixed(a)
    this.z = +this.z.toFixed(a)
    return this
  }
  THREE.Vector3.prototype.abs = function() {
    this.x = Math.abs(this.x)
    this.y = Math.abs(this.y)
    this.z = Math.abs(this.z)
    return this
  }
  THREE.Vector3.prototype.collinear = function(v) {
    if(this.x/v.x !== this.y/v.y) return false
    if(this.x/v.x !== this.z/v.z) return false
    return true
  }
  THREE.Vector3.prototype.opposite = function(v) {
    return v.clone().multiplyScalar(-1).equals(this)
  }

  THREE.DefaultScene = require('./DefaultScene')
  THREE.BMControl = require('./BMControl')
  THREE.OrbitControls = require('./OrbitControls')
  THREE.OBJLoader = require('./OBJLoader')
  THREE.MTLLoader = require('./MTLLoader')
  THREE.RoomControls = require('./RoomControls')

  var _Math = require('./../Math')

  THREE.Ray.prototype.intersectLine2 = function(line, order = 'xy', far = 100000) {

    var self_line = new THREE.Line3(
      this.origin,                          // да, костыль выдан за фичу
      this.origin.clone().add(this.direction.clone().multiplyScalar(far))
    )
    
    var cross = _Math.lineCross2(line, self_line, order[0], order[1])

    return cross

  }

  THREE.Ray.prototype.intersectsLine2 = function(line, order = 'xy', far = 100000) {

    var cross = _Math.isCrossLines2(
      line.start, line.end, 
      this.origin,                      // да, костыль выдан за фичу
      this.origin.clone().add(this.direction.clone().multiplyScalar(far)),
      order[0], order[1]
    )

    return cross

  }

  THREE.Ray.prototype.intersectVec2 = function(vec, pos = new THREE.Vector3, order = 'xy') {

    var f11 = this.origin
    var f12 = f11.clone().add(this.direction.clone().multiplyScalar(10))
    var f21 = pos.clone()
    var f22 = f21.clone().add(vec.clone().multiplyScalar(10))

    return _Math.linesCrossPoint2(f11, f12, f21, f22, order[0], order[1])

  }

})
