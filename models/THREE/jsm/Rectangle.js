

/**
 * Math 
 */

import * as _Math from './Math'

import { Ray } from 'three/src/math/Ray'
import { Box3 } from 'three/src/math/Box3'
import { Line3 } from 'three/src/math/Line3'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'
import { Euler } from 'three/src/math/Euler'
import { Plane } from 'three/src/math/Plane'
import { _Math as THREE } from 'three/src/math/Math'

var ray = new Ray
var box = new Box3

function crossRectangles(rect1, rect2, mv) {

  var lines1 = rect1.getMovedLines(mv)
  var lines2 = rect2.getWorldLines()

  var crosses = [], line1, line2

  for(var i1 in lines1) {

    line1 = lines1[i1]

    for(var i2 in lines2) {

      line2 = lines2[i2]

      var isCross = _Math.lineCross2(line1, line2, 'x', 'z')

      if(isCross) {

        crosses.push({
          point: isCross,
          line1,
          line2
        })

      }

    }
    
  }

  if(!crosses.length) {

    if(rect1.isInsidePoint(rect2.position, mv) || rect2.isInsidePoint(mv))
      return { point: null }

    return false

  }

  return crosses

}

function crossRectLine(rect, line) {

  var res = []
  var lines = rect.getWorldLines()

  lines.forEach(l => {
    
    var p = new Vector3

    if(line.intersectLine(l, p) && !p.equals(l.start))
      res.push(p)

  })

  if(res.length)
    return res

  return false

}

function Rectangle(points) {

  this.lines = []
  for(var i = 0; i < 4; i++) 
    this.lines.push(new Line3(new Vector3, new Vector3))

  this.position = new Vector3

  if(points) {

    this.setFromPoints(points)

  }

}

Rectangle.prototype.rotate = function(rot) {

  var euler = new Euler(0, rot, 0)

  this.lines.forEach(line => {

    line.start.copy(line.start.clone().normalize().applyEuler(euler).toFixed().normalize().multiplyScalar(line.start.length()))
    line.end.copy(line.end.clone().normalize().applyEuler(euler).toFixed().normalize().multiplyScalar(line.end.length()))

  })

  return this

}

Rectangle.prototype.getBounding = function(rot) {
  
  if(rot === 0) return this.clone()
  // normalized from 0 ... 90 deg
  rot = THREE.Math.euclideanModulo(rot, Math.PI/2)

  var euler = new Euler(0, rot, 0)

  var vecs = this.lines.map(line => 
    line.end.clone().sub(line.start).applyEuler(euler).toFixed().normalize()
  )
    
  var ps = []

  for(var i1 = 0; i1 < vecs.length; i1++) {

    var i2 = i1 === vecs.length - 1 ? 0 : i1 + 1

    var p11 = this.lines[i1].end
    var p21 = this.lines[i2].end

    var p12 = p11.clone().add(vecs[i1].clone().multiplyScalar(100))
    var p22 = p21.clone().add(vecs[i2].clone().multiplyScalar(100))

    ps.push(_Math.linesCrossPoint2(p11, p12, p21, p22, 'x', 'z'))

  }

  return this.clone().setFromPoints(ps.map(p => [p.x, p.z]))

}

Rectangle.prototype.getBoundingByVec = function(vec) {

  var vec1 = this.lines[0].start.clone().sub(this.lines[0].end).normalize()

  return this.getBounding(
    // calc angle
    new Vector2(vec1.x, vec1.z).angle() - new Vector2(vec.x, vec.z).angle()
  )

}

Rectangle.prototype.distanceByVec = function(rect, vec) {

  var rect1 = this.getBoundingByVec(vec)
  var rect2 = rect.getBoundingByVec(vec)

  var line1 = rect1.getLineFromDirect(vec)
  var line2 = rect2.getLineFromDirect(vec.clone().multiplyScalar(-1))

  if(!line1 || !line2) return false

  line1 = rect1.localToWorld(line1)
  line2 = rect2.localToWorld(line2)

  return line1.start.multiply(vec).sub(line2.start.multiply(vec))

}

Rectangle.prototype.setFromPoints = function(points) {

  for(var i = 0; i < this.lines.length; i++) {

    var p1 = points[i]
    var p2 = points[i === 3 ? 0 : i+1]

    this.lines[i].start.set(p1[0], 0, p1[1])
    this.lines[i].end.set(p2[0], 0, p2[1])

  }

  return this

}

Rectangle.prototype.setFromSizeAndAngle = function(l, h, rot) {

  var beta = Math.asin( (2*l*h)/(l*l+h*h) )
  var beta1 = Math.PI - beta

  if(l < h) {
    var tmp = beta; beta = beta1; beta1 = tmp
  }

  var a0 = beta/2 + rot
  var a1 = a0 + beta1
  var a2 = a1 + beta
  var a3 = a2 + beta1

  var R = Math.sqrt(l*l + h*h)/2

  var points = [
    [ R*Math.cos(a0), -R*Math.sin(a0) ],
    [ R*Math.cos(a1), -R*Math.sin(a1) ],
    [ R*Math.cos(a2), -R*Math.sin(a2) ],
    [ R*Math.cos(a3), -R*Math.sin(a3) ]
  ]

  this.setFromPoints(points)

  this.size = {x: l, y: h}

  return this

}

Rectangle.prototype.getPoints = function() {

  return this.lines.map(l => l.start)

}

Rectangle.prototype.getWorldPoints = function() {

  return this.lines.map(l => l.start.clone().add(this.position))

}

Rectangle.prototype.getMovedLines = function(moved) {

  return this.lines.map(l => {
    var res = l.clone()

    res.start.add(moved)
    res.end.add(moved)

    return res
  })
  
}

Rectangle.prototype.getWorldLines = function() {

  return this.getMovedLines(this.position)

}

Rectangle.prototype.getNearPoint = function(rect) {

  var mv = rect.position.clone().sub(this.position)
  var points2 = rect.getPoints().map(p => p.clone().add(mv))

  var distances = points2.map(p => p.distanceTo(new Vector3))

  return points2[distances.indexOf(Math.min(...distances))].add(this.position)

}

Rectangle.prototype.getTriangles = function() {

  var res = []
  var points = this.getPoints()

  for(var i = 0; i < 4; i++) {

    var i1 = i === 3 ? 0 : i+1
    // var i2 = i1 === 3 ? 0 : i1+1

    res.push([points[i], points[i1], new Vector3])

  }

  return res

}

Rectangle.prototype.isInsidePoint = function(point, mv = this.position) {

  var triangles = this.getTriangles()

  for(var triangle of triangles) {

    triangle = triangle.map(p => p.clone().add(mv))

    if(_Math.pointInTriangle2(point, ...triangle, 'x', 'z'))
      return true

  }

  return false

}

Rectangle.prototype.getInsidePoint = function(rect) {

  var mv = rect.position.clone().sub(this.position)
  var points2 = rect.getPoints().map(p => p.clone().add(mv))

  var triangles = this.getTriangles()
  
  var res = []

  for(var point2 of points2) {

    for(var triangle of triangles) {

      if(_Math.pointInTriangle2(point2, ...triangle, 'x', 'z')) {

        res.push(point2.add(this.position))
        break

      }

    }

  }

  return res.length === 0 ? false : res

}

Rectangle.prototype.directionFromTriangles = function(v) {

  v = v.clone().sub(this.position)
  var lines = this.lines
  var c = new Vector3

  for(var line of lines) {

    if(_Math.pointInTriangle2(v, line.start, line.end, c, 'x', 'z'))
      return line.start.clone().sub(line.end).applyEuler(new Euler(0, Math.PI/2, 0)).normalize().toFixed(10)

  }

  return false
  
}

Rectangle.prototype.cross = function(obj, mv = this.position) {

  if(obj.constructor === Rectangle) 
    return crossRectangles(this, obj, mv)

  if(obj.constructor === Plane)
    return crossRectLine(this, obj)

  return false

}

Rectangle.prototype.getLineFromDirect = function(v) {

  ray.set(new Vector3, v)

  for(var line of this.lines) {

    if(ray.intersectsLine2(line, 'xz'))
      return line

  }

  return false

}

Rectangle.prototype.localToWorld = function(obj) {

  var res

  if(obj.constructor === Line3) {

    res = obj.clone()
    res.start.add(this.position)
    res.end.add(this.position)

  } else if(obj.isVector3) {

    res = obj.clone().add(this.position)

  } else console.error('wtf')


  return res

}

Rectangle.prototype.getAreas = function() {

  var res = [[],[],[],[]]
  var points = this.lines.map(p => p.start)

  for(var line of this.lines) {

    var i1 = points.findIndex(p => p.equals(line.start))
    var i2 = points.findIndex(p => p.equals(line.end))

    var v1 = line.start.clone().sub(line.end).divideScalar(2).add(line.end).normalize()
    // var v2 = v1//.clone()//.multiplyScalar(-1)

    res[i1].push(v1)
    res[i2].push(v1)

  }

  return {
    vecs: res,
    points: points.map(p => p.clone().add(this.position))
  }

}

Rectangle.prototype.bindObject3d = function(obj, size) {

  this.position = obj.position

  if(!size || size.equals({x:0,y:0,z:0})) {

    box.setFromObject(obj)
    box.getSize(size)

  }

  return this

}

Rectangle.prototype.clone = function() {

  return new Rectangle(
    this.getPoints().map(p => [p.x, p.z]),
    this.position.clone()
  )

}

export { Rectangle }
