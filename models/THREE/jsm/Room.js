
import { Plane } from 'three/src/math/Plane'
import { Euler } from 'three/src/math/Euler'
import { Vector3 } from 'three/src/math/Vector3'
import { Vector2 } from 'three/src/math/Vector2'
import { Object3D } from 'three/src/core/Object3D'
import { Shape } from 'three/src/extras/core/Shape'
import { Mesh } from 'three/src/objects/Mesh'
import { ShapeBufferGeometry } from 'three/src/geometries/ShapeGeometry'
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial'
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial'
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial'
import { BufferGeometry } from 'three/src/core/BufferGeometry'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { Line } from 'three/src/objects/Line'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { RepeatWrapping } from 'three/src/constants'

import { SizeLine } from './SizeLine'

var SAT = require('sat')

function sizesToPoints(info) {

  var points = [new Vector3]

  var point = points[0]

  var max = [0, 0]
  var min = [0, 0]

  var fr = 0

  for(var i = 0; i < info.length - 1; i++) {

    var w = info[i]

    point = new Vector3(
      point.x - Math.cos(Math.PI/180 * fr) * w.l,
      0,
      point.z - Math.sin(Math.PI / 180 * fr) * w.l
    ).toFixed(1)

    if(point.x < min[0]) min[0] = point.x
    if(point.z < min[1]) min[1] = point.z
    if(point.x > max[0]) max[0] = point.x
    if(point.z > max[1]) max[1] = point.z

    points.push(point)

    fr += 180 - w.r

  }

  var center = {
    x: (max[0] - min[0])/2 - max[0],
    z: (max[1] - min[1])/2 - max[1],
    y: 0
  }

  points.forEach(p => p.add(center))

  return points

}

/**
 * Wall class
 */

var WALL_HEIGHT = 150
var WALL_WEIGHT = 10

function Wall(parent, point1, point2, caption = 'A') {

  this.constructor()

  this.parent = parent

  this._l = 0
  this.caption = caption

  this.limits_y = []

  this.fullMesh = new Object3D

  this.mesh = new Mesh(new BufferGeometry, new MeshStandardMaterial( { color: 0xffffff, roughness: 1, metalness: .4 } ))
  var vert = new Float32Array( [
    -.5, WALL_HEIGHT, 0,
    .5, WALL_HEIGHT, 0,
    -.5, 0, 0,
    .5, 0, 0
  ] );
  this.mesh.geometry.addAttribute('position', new BufferAttribute(vert, 3))
  
  var uv = new Float32Array( [
    0, 1,
    1, 1,
    0, 0,
    1, 0
  ] )
  this.mesh.geometry.addAttribute('uv', new BufferAttribute(uv, 2))

  var indices = new Uint32Array([
    0, 2, 1, 2, 3, 1
  ])
  this.mesh.geometry.setIndex( new BufferAttribute( indices, 1 ) );

  this.mesh.geometry.computeVertexNormals()

  this.mesh1 = new Mesh(new BufferGeometry, new MeshBasicMaterial( { color: 0xffffff } ))
  var vert = new Float32Array( [
    -.5, 0, 0,
      .5, 0, 0,
      .5, 0, -WALL_WEIGHT,
  
      .5, 0, -WALL_WEIGHT,
    -.5, 0, -WALL_WEIGHT,
    -.5, 0, 0
  ] )
  this.mesh1.geometry.addAttribute('position', new BufferAttribute(vert, 3))
  this.mesh1.visible = false

  this.line = new SizeLine({ l: this._l, w: 10 , text:'(' + caption + ')' })
  this.line.rotation.z = Math.PI / 2
  this.line.visible = false    

  // objects from this wall (from bmcontrols)
  this.objects = []

  this.SAT = new SAT.Polygon(new SAT.Vector(0,0), [
    new SAT.Vector(-1, 0),
    new SAT.Vector( 1, 0)
  ])

  if(point1 && point2) {

    this.setFromPoints(point1, point2)

  }

}

Wall.prototype = Object.create(Plane.prototype)

Wall.prototype.HEIGHT = WALL_HEIGHT

Wall.prototype.setFromPoints = function(point1, point2) {

  point1.toFixed(0)
  point2.toFixed(0)

  this.point1 = point1
  this.point2 = point2

  this.update()

}

Wall.prototype.getNextWall = function() {

  var idx = this.parent._walls.indexOf(this)
  var nidx = this.parent._walls.length === idx+1 ? 0 : idx+1

  return this.parent._walls[nidx]

}

Wall.prototype.getPrevWall = function() {

  var idx = this.parent._walls.indexOf(this)
  var pidx = 0 === idx ? this.parent._walls.length-1 : idx-1

  return this.parent._walls[pidx]

}

Wall.prototype.remove = function() {

  var idx = this.parent._walls.indexOf(this)
  this.parent._walls.splice(idx, 1)

  if(this.gui) this.gui.remove()
  if(this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh)
  if(this.mesh1 && this.mesh1.parent) this.mesh1.parent.remove(this.mesh1)
  if(this.line && this.line.parent) this.line.parent.remove(this.line)

}

Wall.prototype.toLen = function(l) {

  l = +l

  var iter = 0
  var i = this.id

  var MIN_WALL_LEN = 50
  var intervals = []
  var PI = Math.PI
  var PI2 = Math.PI * 2

  if(l < MIN_WALL_LEN) l = MIN_WALL_LEN

  var diff = Math.abs(l - this.l)
  var sign = Math.sign(l - this.l)
  
  this.l = l

  var cos = Math.abs(Math.cos(this.mesh.rotation.y).toFixed(10))
  var sin = Math.abs(Math.sin(this.mesh.rotation.y).toFixed(10))

  var diffX = Math.round(cos * diff)
  var diffY = Math.round(sin * diff)

  if (this.mesh.rotation.y < PI / 2) {
    intervals.push(
      [PI2 - (PI / 2 - this.mesh.rotation.y), PI2],
      [0, this.mesh.rotation.y + PI / 2]
    )
  } else if (this.mesh.rotation.y > PI * 1.5) {
    intervals.push(
      [this.mesh.rotation.y - PI / 2, PI2],
      [0, this.mesh.rotation.y - PI * 1.5]
    )
  } else {
    intervals.push(
      [this.mesh.rotation.y - PI / 2,
      this.mesh.rotation.y + PI / 2]
    )
  }

  while (diffX || diffY) {

    iter++
    i++

    if (i >= this.parent._walls.length) i = 0

    var wall = this.parent._walls[i]

    if (wall === this) continue

    var k = 1
    for (var interval of intervals) {
      if (interval[0] <= wall.mesh.rotation.y && interval[1] >= wall.mesh.rotation.y) {
        k = -1
        break
      }
    }

    var cos1 = Math.abs(Math.cos(wall.mesh.rotation.y).toFixed(10))
    var sin1 = Math.abs(Math.sin(wall.mesh.rotation.y).toFixed(10))

    var maxDiffX = (wall.l - MIN_WALL_LEN) * cos1
    var maxDiffY = (wall.l - MIN_WALL_LEN) * sin1

    var minDiffX = sign * k > 0 ? diffX : Math.min(maxDiffX, diffX)
    var minDiffY = sign * k > 0 ? diffY : Math.min(maxDiffY, diffY)

    var toDiffX = cos1 ? Math.round(minDiffX / cos1) : 0
    var toDiffY = sin1 ? Math.round(minDiffY / sin1) : 0

    if (toDiffX) {
      wall.l += toDiffX * sign * k
      diffX -= minDiffX
      diffY += toDiffX * sin1
    }

    if (toDiffY) {
      wall.l += toDiffY * sign * k
      diffY -= minDiffY
      diffX += toDiffY * cos1
    }

    if (iter > 1000) {
      return console.error('loop')
    }

    if (iter >= this.parent._walls.length) {
      console.warn('is most iterible')
    }
  }

  var points = sizesToPoints(this.parent.getSizes())
  for(var i in this.parent._walls) {

    var p1 = points[i]
    var p2 = points[+i+1 === points.length ? 0 : +i+1]

    this.parent._walls[i].setFromPoints(p1, p2)

  }

  this.parent.updateFloor()

}

Wall.prototype.toPosition = function(position) {

  var points = []

  if ( (this.mesh.rotation.y - Math.PI/2) % Math.PI ) {

    var tan1 = Math.tan(this.mesh.rotation.y)
    var b1 = -position.z - tan1 * position.x

    { // prev wall

      var wall = this.getPrevWall()
      var tan2 = Math.tan(wall.mesh.rotation.y)
      var b2 = -wall.mesh.position.z - tan2 * wall.mesh.position.x

      var x = (b2 - b1) / (tan1 - tan2)
      var y = tan1 * x + b1

      var cos = Math.cos(wall.mesh.rotation.y)
      var sin = Math.sin(wall.mesh.rotation.y)

      var move = [
        x - (wall.mesh.position.x + cos * wall.l / 2),
        y + (wall.mesh.position.z - sin * wall.l / 2)
      ]

      if (move[0] < 0.001 && move[0] > -0.001) move[0] = 0
      if (move[1] < 0.001 && move[1] > -0.001) move[1] = 0

      wall.mesh.position.x += move[0] / 2
      wall.mesh.position.z -= move[1] / 2

      wall.mesh1.position.x += move[0] / 2
      wall.mesh1.position.z -= move[1] / 2

      wall.line.position.copy(wall.mesh1.position).add(wall.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))

      wall.point2.x = x
      wall.point2.z = -y

      wall.update()

      points.push([x, y])

    }
    { // next wall
      
      var wall = this.getNextWall()
      var tan2 = Math.tan(wall.mesh.rotation.y)
      var b2 = -wall.mesh.position.z - tan2 * wall.mesh.position.x

      var x = (b2 - b1) / (tan1 - tan2)
      var y = tan1 * x + b1

      var cos = Math.cos(wall.mesh.rotation.y)
      var sin = Math.sin(wall.mesh.rotation.y)

      var move = [
        +(x - (wall.mesh.position.x - cos * wall.l / 2)).toFixed(10),
        +(y + (wall.mesh.position.z + sin * wall.l / 2)).toFixed(10)
      ]

      if (move[0] < 0.001 && move[0] > -0.001) move[0] = 0
      if (move[1] < 0.001 && move[1] > -0.001) move[1] = 0

      wall.mesh.position.x += move[0] / 2
      wall.mesh.position.z -= move[1] / 2

      wall.mesh1.position.x += move[0] / 2
      wall.mesh1.position.z -= move[1] / 2

      wall.line.position.copy(wall.mesh1.position).add(wall.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))
      
      wall.point1.x = x
      wall.point1.z = -y
      
      wall.update()

      points.push([x, y])

    }

  } else {
    /*
    * обработка исключения, когда стена паралельна оси Z (Y) т.е. 90, 270 ... градусов
    * бикоз в таких случаях тангенс равен бесконечности (по сути не существует)
    * */

    { // prev wall

      var wall = this.getPrevWall()
      var tan2 = Math.tan(wall.mesh.rotation.y)
      var b2 = -wall.mesh.position.z - tan2 * wall.mesh.position.x
      
      var x = position.x
      var y = tan2 * x + b2

      var cos = Math.cos(wall.mesh.rotation.y)
      var sin = Math.sin(wall.mesh.rotation.y)

      var move = [
        x - (wall.mesh.position.x + cos * wall.l / 2),
        y + (wall.mesh.position.z - sin * wall.l / 2)
      ]

      if (move[0] < 0.001 && move[0] > -0.001) move[0] = 0
      if (move[1] < 0.001 && move[1] > -0.001) move[1] = 0

      wall.mesh.position.x += move[0] / 2
      wall.mesh.position.z -= move[1] / 2

      wall.mesh1.position.x += move[0] / 2
      wall.mesh1.position.z -= move[1] / 2

      wall.line.position.copy(wall.mesh1.position).add(wall.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))
      
      wall.point2.x = x
      wall.point2.z = -y
      
      wall.update()

      points.push([x, y])

    }
    { // next wall

      var wall = this.getNextWall()
      var tan2 = Math.tan(wall.mesh.rotation.y)
      var b2 = -wall.mesh.position.z - tan2 * wall.mesh.position.x

      var x = position.x
      var y = tan2 * x + b2

      var cos = Math.cos(wall.mesh.rotation.y)
      var sin = Math.sin(wall.mesh.rotation.y)

      var move = [
        x - (wall.mesh.position.x - cos * wall.l / 2),
        y + (wall.mesh.position.z + sin * wall.l / 2)
      ]

      if (move[0] < 0.001 && move[0] > -0.001) move[0] = 0
      if (move[1] < 0.001 && move[1] > -0.001) move[1] = 0

      wall.mesh.position.x += move[0] / 2
      wall.mesh.position.z -= move[1] / 2

      wall.mesh1.position.x += move[0] / 2
      wall.mesh1.position.z -= move[1] / 2

      wall.line.position.copy(wall.mesh1.position).add(wall.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))

      wall.point1.x = x
      wall.point1.z = -y
      
      wall.update()

      points.push([x, y])

    }

  }

  this.point1.x = points[0][0]
  this.point1.z = -points[0][1]
  this.point2.x = points[1][0]
  this.point2.z = -points[1][1]
  
  this.update()

  var x = points[1][0] + (points[0][0] - points[1][0]) / 2
  var y = points[1][1] + (points[0][1] - points[1][1]) / 2

  this.position.x = x
  this.position.z = -y
  this.mesh1.position.x = x
  this.mesh1.position.z = -y

  this.line.position.copy(this.mesh1.position).add(this.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))

  this.parent.updateFloor()

}

Wall.prototype.getFullMesh = function() {

  var res = this.fullMesh

  res.add(this.mesh, this.mesh1, this.line)

  return res

}

Wall.prototype.getLimits = function() {

  var res = {

    max: this.max.clone(),
    min: this.min.clone()

  }

  res.max.y = WALL_HEIGHT

  return res

}

Wall.prototype.update = function() {

  var sub = this.point2.clone().sub(this.point1)
  this.l = +sub.length().toFixed(0)
  this.vec = sub.clone().normalize()
  this.rvec = this.vec.clone().applyEuler(new Euler(0, -Math.PI/2, 0)).toFixed()

  this.mesh.rotation.y = 2*Math.PI - new Vector2(this.vec.x, this.vec.z).angle()
  this.mesh1.rotation.y = this.mesh.rotation.y
  this.line.rotation.y = this.mesh.rotation.y

  this.position = this.mesh.position.copy(this.point2).add(this.point1).divideScalar(2)
  this.mesh1.position.copy(this.position)
  this.mesh1.position.y = 300

  this.setFromNormalAndCoplanarPoint(this.rvec, this.position)

  this.line.position.copy(this.mesh1.position).add(this.normal.clone().multiplyScalar(-(WALL_WEIGHT+5)))

  this.max = new Vector3(
    Math.max(this.point1.x, this.point2.x), 
    Math.max(this.point1.y, this.point2.y),
    Math.max(this.point1.z, this.point2.z)
  )

  this.min = new Vector3(
    Math.min(this.point1.x, this.point2.x), 
    Math.min(this.point1.y, this.point2.y),
    Math.min(this.point1.z, this.point2.z)
  )

  this.rot = Math.atan((this.point2.z - this.point1.z)/(this.point2.x - this.point1.x))

  this.limits_y.forEach(limit => {

    limit.mesh.rotation.y = this.mesh.rotation.y
    limit.mesh.position.x = this.position.x
    limit.mesh.position.z = this.position.z
    limit.mesh.scale.x = this.l

  })

  this.SAT.points[0].x = -this._l/2
  this.SAT.points[1].x = this._l/2
  // this.SAT._recalc()
  this.SAT.setAngle(-this.mesh.rotation.y)
  this.SAT.pos.x = this.position.x
  this.SAT.pos.y = this.position.z

  this.posx = new Vector2(this.position.x, this.position.z).rotateAround(new Vector2, this.mesh.rotation.y).x

  if(this.mesh.material.map) {
    // update uv
    var rx = Math.ceil(this._l / this.mesh.material.map.image.width)
    var ry = Math.ceil(WALL_HEIGHT / this.mesh.material.map.image.height)

    this.mesh.material.map.wrapS = this.mesh.material.map.wrapT = RepeatWrapping
    this.mesh.material.map.repeat.set(rx, ry)

    var max_x = this._l / (this.mesh.material.map.image.width * rx)
    var max_y = WALL_HEIGHT / (this.mesh.material.map.image.height * ry)

    var uvs = this.mesh.geometry.getAttribute('uv')
    // uv sheme (indexes)
    // 0, 1, (0, 1)
    // 1, 1, (2, 3)
    // 0, 0, (4, 5)
    // 1, 0  (6, 7)
    uvs.array[2] = uvs.array[6] = max_x
    uvs.array[1] = uvs.array[3] = max_y

    uvs.needsUpdate = true

  }
  
  return this

}

Wall.prototype.ray = function(ray) {

  var pos = false

  if((pos = ray.intersectObject(this.mesh)).length) {
    
    return pos[0].point

  }

  return false

}

Wall.prototype.addObj = function(obj) {

  this.objects.push(obj)
  
  obj.setRotation(this.mesh.rotation.y)

}

Wall.prototype.removeObj = function(obj) {
  
  var i = this.objects.indexOf(obj)

  if(i === -1) return false

  this.objects.splice(i, 1)

  return true

}

Wall.prototype.addLimitY = function() {

  for(var i = 0; i < arguments.length; i++) {

    var h = arguments[i]

    var mesh = new Line(new BufferGeometry, new LineBasicMaterial({ color: 0x319ff9, linewidth: 1 }))
    mesh.geometry.addAttribute('position', new BufferAttribute( new Float32Array([ -.5, 0, 0, .5, 0, 0 ]), 3 ))
    mesh.geometry.computeVertexNormals()

    mesh.rotation.y = this.mesh.rotation.y
    mesh.scale.x = this.l
    mesh.position.copy(this.position)

    mesh.visible = false

    this.fullMesh.add(mesh)
    
    var limit = { 
      mesh, h,
      setH(h) {
        this.h = h
        mesh.position.y = h
      }
    }

    limit.setH(h)

    this.limits_y.push(limit)

  }

}

Object.defineProperties(Wall.prototype, {

  l: {

    get: function() {

      return this._l

    },

    set: function(value) {

      value = +value

      this.mesh.scale.x = value
      this.mesh1.scale.x = value
      this.line.l = value
      this.limits_y.forEach(limit => limit.mesh.scale.x = value)

      this._l = value
      
      if(this.gui) this.gui.updateDisplay()

    }

  },

  id: {
    
    get: function() {

      return this.parent._walls.indexOf(this)

    }

  }

})

/**
 * Room class
 */

var START_CHAR_CODE = 65 // A
var CURRENT_CHAR_CODE = START_CHAR_CODE

function Room(points, parent) {

  this.constructor()

  this._walls = []
  this._floor = null
  this._plane = new Plane(new Vector3(0, 1, 0))
  this.bmcontrols = parent

  if(points && points.length) {

    this.setWalls(points)

  }

}

Room.prototype = Object.create(Object3D.prototype)

Room.prototype.setWalls = function(points) {

  while(this._walls.length) this._walls[0].remove()

  CURRENT_CHAR_CODE = START_CHAR_CODE

  for(var i = 0; i < points.length; i++) {

    var point1 = points[i]
    var point2 = points[i+1 === points.length ? 0 : i+1]

    var wall = new Wall(this, point1, point2, String.fromCharCode(CURRENT_CHAR_CODE))
    wall.addLimitY(50, 100, 75)
    this._walls.push(wall)
    this.add(wall.getFullMesh())

    CURRENT_CHAR_CODE++

  }

  for(var wall of this._walls) {

    var w = wall.getNextWall()
    if(wall.vec.angleTo(w.normal) === 0) {

      wall.cantFullLen = true
      w.cantFullLen = true

      wall.update()
      w.update()

    }

  }

  this.updateFloor()

}

Room.prototype.setWallsBySizes = function(info) {

  this.setWalls(sizesToPoints(info))

  return this

}

Room.prototype.getSizes = function() {

  var res = []

  for(var wall1 of this._walls) {

    var wall = wall1.getNextWall()

    var vm = wall1.normal.clone().add(wall.normal).normalize()

    var v1 = wall1.vec.clone().multiplyScalar(-1)
    var v2 = wall.vec

    var r = v1.angleTo(vm) + v2.angleTo(vm)

    res.push({ 
      l: wall1.l, 
      r: r * 180/Math.PI
    })

  }

  return res

}

Room.prototype.updateFloor = function() {

  if(this._floor && this._floor.parent) this._floor.parent.remove(this._floor) 

  if(!this._walls.length) return

  var geom = new Shape

  geom.moveTo(this._walls[0].point1.x, -this._walls[0].point1.z)

  for(var wall of this._walls) {

    geom.lineTo(wall.point1.x, -wall.point1.z)

  }

  geom.lineTo(wall.point2.x, -wall.point2.z)

  var map = this._floor ? this._floor.material.map : false

  this._floor = new Mesh(
    new ShapeBufferGeometry(geom),
    new MeshStandardMaterial( { color: 0xC04000, roughness: 1, metalness: .4 } )
  )

  if(map) {

    this._floor.material.map = map
    this._floor.material.color.setHex(0xffffff)

  }

  this._floor.geometry.computeBoundingBox()

  this.updateFloorUv()

  this._floor.rotation.x = -Math.PI/2

  this.add(this._floor)
  
}

Room.prototype.updateFloorUv = function() {

  if(!this._floor.material.map) return

  var map = this._floor.material.map

  var bb = this._floor.geometry.boundingBox
  var size = bb.getSize(new Vector3)

  var rx = Math.ceil(size.x / map.image.width)
  var ry = Math.ceil(size.y / map.image.height)
  var w = map.image.width * rx
  var h = map.image.height * ry

  map.wrapS = map.wrapT = RepeatWrapping
  map.repeat.set(rx, ry)

  var positions = this._floor.geometry.getAttribute('position')
  var uvs = this._floor.geometry.getAttribute('uv')

  for(var i = 0; i < positions.count; i++) {

    var idx = i*3
    var uvidx = i*2

    var x = positions.array[idx]
    var y = positions.array[idx+1]

    var xk = x + bb.max.x
    var yk = y + bb.max.y

    uvs.array[uvidx] = xk / w
    uvs.array[uvidx+1] = yk / h

  }

  uvs.needsUpdate = true

}

Room.prototype.showY = function(is = !this._walls[0].mesh1.visible) {

  is = !!is
  
  for(var wall of this._walls) {

    wall.mesh1.visible = is
    wall.line.visible = is

  }

}

Room.prototype.setWallMap = function(map) {

  for(var wall of this._walls) {

    wall.mesh.material.map = map.clone()
    wall.mesh.material.map.needsUpdate = true

    wall.mesh.material.color.setHex(0xffffff)
    wall.mesh.material.needsUpdate = true

    wall.update()

  }

}

Room.prototype.setWallTexture = function(url) {

  if(typeof url === 'string') {

    new TextureLoader().load(url, map => this.setWallMap(map))

  }

}

Room.prototype.setFloorMap = function(map) {

  this._floor.material.map = map

  this._floor.material.color.setHex(0xffffff)
  this._floor.material.needsUpdate = true
  
  this.updateFloorUv()

}

Room.prototype.setFloorTexture = function(url) {

  if(typeof url === 'string') {

    new TextureLoader().load(url, map => this.setFloorMap(map))

  }

}

Room.prototype.clear = function() {

  this.setWalls([])

  return this

}

export { Room }
