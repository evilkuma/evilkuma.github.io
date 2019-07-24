
import { Room } from './Room'
import { Rectangle } from './Rectangle'
import { SizeLine } from './SizeLine'
import * as _Math from './Math'
import { Raycaster } from 'three/src/core/Raycaster'
import { Ray } from 'three/src/math/Ray'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'
import { Plane } from 'three/src/math/Plane'
import { Euler } from 'three/src/math/Euler'
import { Line3 } from 'three/src/math/Line3'
import { Box3 } from 'three/src/math/Box3'

var raycaster = new Raycaster
var ray = new Ray
var box = new Box3

var size_lines = [ new SizeLine, new SizeLine ]

/**
 * Ищет 3д обьект для взаимодействия
 * 
 * @param {BMControl} self 
 * 
 * @returns Object - info about object | false
 */
function findObject(self) {

  raycaster.setFromCamera( self.mouse, self.scene.camera ) 
  
  var intersect = new Vector3
  var dist = false
  var res = false

  for(var info of self.objects) {
    
    var obj = info.obj

    if(raycaster.ray.intersectBox(box.setFromObject(obj), intersect)) {

      var ndist = intersect.sub(raycaster.ray.origin).length()

      if(!dist || ndist < dist) {

        res = info
        dist = ndist

      }

    }

  }

  return res

}

function getInterestWalls(self, intersect, exclude) {

  var res = []
  var rect = self.rects[self.objects.indexOf(self.obj)]

  for(var p of self.room._walls) {

    if(exclude && exclude.includes(p)) continue

    ray.set(intersect, p.rvec.clone().multiplyScalar(-1))
    var pos = ray.intersectPlane(p, new Vector3)

    if(pos) {
      if( (pos.x > p.max.x || pos.x < p.min.x) || (pos.z > p.max.z || pos.z < p.min.z) ) 
        continue
    } else {
      var angle = p.point1.angleTo(p.point2) - p.point1.angleTo(intersect) - p.point2.angleTo(intersect)
      if(+angle.toFixed(10) < 0) continue
    }

    var points = rect.getMovedLines(intersect).map(pt => pt.start)

    var isOver = false
    var over_poses = points.map(pt => {
  
      ray.set(pt, p.rvec)
      var res = ray.intersectPlane(p, new Vector3)
      if(res) isOver = true
  
      return res
  
    })

    if(!isOver) continue

    var idx, distance = 0
    for(let i = 0; i < over_poses.length; i++) {

      if(!over_poses[i]) continue

      var ndist = over_poses[i].distanceTo(points[i])
      if(ndist >= distance) {
        distance = ndist
        idx = i
      }

    }

    var mv = p.rvec.clone().multiplyScalar(.001)
    var nx = intersect.x - (points[idx].x - over_poses[idx].x) + mv.x
    var nz = intersect.z - (points[idx].z - over_poses[idx].z) + mv.z

    res.push({ 
      point: new Vector3(nx, 0, nz),
      p
    })

  }

  return res

}

function getInterestObjs(self, intersect, exclude) {

  var res = []
  var obj = self.obj.obj
  var rect = self.rects[self.objects.indexOf(self.obj)]

  for(var i in self.objects) {
    
    var obj1 = self.objects[i].obj
    var rect1 = self.rects[i]

    if(obj === obj1 || (exclude && exclude.includes(obj1))) continue

    var cross = rect.cross(rect1, intersect)
    if(!cross) continue

    res.push({
      cross,
      obj1: self.objects[i]
    })

  }

  return res

}

function setFixedWalls(walls, intersect) {

  if(!walls.length) return false
  if(walls.length === 1) {
    intersect.copy(walls[0].point)
    return walls[0].p.rvec
  }

  var vec1 = walls[0].p.rvec.clone().applyEuler(new Euler(0, Math.PI/2, 0))
  var vec2 = walls[1].p.rvec.clone().applyEuler(new Euler(0, Math.PI/2, 0))

  ray.set(walls[0].point, vec1)

  var res = ray.intersectVec2( vec2, walls[1].point, 'xz')

  intersect.copy(res)

  return walls[0].p.rvec.clone().add(walls[1].p.rvec).normalize()

}

function setFixedObjs(self, objs, intersect, vec) {

  if(!objs.length) return

  /**
   * calc vector mv
   */

  var rect = self.rects[self.objects.indexOf(self.obj)]
  var v = new Vector3

  objs.map((o, i) => {
    
    var rect1 = self.rects[self.objects.indexOf(o.obj1)]
    o.rect1 = rect1
    var lines = rect1.getWorldLines()
    
    var info = lines.map(line => {

      var v = line.start.clone().sub(line.end).normalize()
      var dir = v.clone().applyEuler(new Euler(0, Math.PI/2, 0)).toFixed(10)

      ray.origin.copy(intersect)
      ray.direction.copy(dir.clone().multiplyScalar(-1))

      var p1 = v.clone().multiplyScalar(1000).add(line.start)
      var p2 = v.clone().multiplyScalar(-1000).add(line.end)

      if(!ray.intersectsLine2(new Line3(p1, p2), 'xz'))
        return false

      return { v, line, dir }

    }).filter(l => !!l)

    if(info.length === 1) return info[0].dir
    if(info.length === 2) return info[0].dir.clone().add(info[1].dir).normalize()
    return rect1.directionFromTriangles(intersect)

  }).filter(v => !!v).forEach(e => v.add(e).normalize())

  if(v.equals({x:0, y:0, z:0})) v = vec ? vec : new Vector3(0, 0, 1)
  else if(vec) {
    var vecr = vec.clone().applyEuler(new Euler(0, Math.PI/2, 0))
    var a = Math.PI/2
    if(vecr.angleTo(v) > Math.PI/2) a *= -1

    v = vec.clone().applyEuler(new Euler(0, a, 0)).toFixed().normalize()

  }

  if(vec && v.angleTo(vec) > Math.PI/2) v = vec

  /**
   * calc mv val by vector
   */

  if(objs.length === 1) {
      
    var line1 = rect.getLineFromDirect(v.clone().multiplyScalar(-1)) 
    if(line1) {

      line1 = line1.clone()
      line1.start.add(intersect)
      line1.end.add(intersect)

    } else return false

    var line2 = objs[0].rect1.getLineFromDirect(v)
    if(line2) line2 = objs[0].rect1.localToWorld(line2)
      else return false

    var p

    var v1 = v.clone()
    var v2 = v.clone().multiplyScalar(-1)
    var fs = [
      [line1.start, v1, line2],
      [line1.end,   v1, line2],
      [line2.start, v2, line1],
      [line2.end,   v2, line1]
    ]

    var res = fs.map(f => {

      ray.direction.copy(f[1])
      ray.origin.copy(f[0])

      var pos = ray.intersectLine2(f[2], 'xz')
      
      if(!pos) return false

      return [pos.distanceTo(f[0]), f[1] === v1 ? pos.sub(f[0]) : f[0].clone().sub(pos)]

    }).filter(el => !!el)
    
    if(!res.length) return false

    var dist = res[0]
    for(var i = 1; i < res.length; i++)
      if(res[i][0] > dist[0]) {

        dist = res[i]

      }

    p = dist[1]

    if(!p) {

      return false
    }

    p.add(v.clone().multiplyScalar(.001))

    intersect.add(p)

    return true

  }

  if(objs.length === 2) {

    // TODO: add multy objs

  }

}

/**
 * Расчет передвижения обьекта
 * 
 * @param {BMControl} self 
 */
function moveSelected(self) {

    // настраиваем кастер и пуляем луч в плэйн пола
    raycaster.setFromCamera( self.mouse, self.scene.camera )

    if(self.obj.type === 'wall' || self.obj.type === 'full') {

      // move by wall
      var isRemove, wall1

      for(wall1 of self.room._walls)
        if(isRemove = wall1.removeObj(self.obj)) break
  
      for(var wall of self.room._walls) {
  
        var pos = false
  
        if(pos = wall.ray(raycaster)) {
  
          wall.addObj(self.obj)

          if(isRemove && wall !== wall1) wall1.limits_y.forEach(limit => limit.mesh.visible = false)
  
          return moveByWall(self, wall, pos)
  
        }
  
      }

      return false

    }

    if(self.obj.type === 'floor' || self.obj.type === 'full') {

      // rotate by wall
      for(var wall of self.room._walls)
        if(wall.ray(raycaster)) {

          self.obj.obj.rotation.y = wall.mesh.rotation.y
          break

        }

      // move by floor

      var intersect = raycaster.ray.intersectPlane( self.room._plane, new Vector3 )

      // если мимо ничего не делаем (правда это анрил, но на всяк)
      if(!intersect) return false

      var info = self.getObjInfo(self.obj)
      self.obj.obj.position.y = info.size.y/2

      var walls = getInterestWalls(self, intersect)

      if(walls.length === 1) {

        var tmp = getInterestWalls(self, walls[0].point, [walls[0].p])
        if(tmp.length) walls.push(tmp[0])

      }

      var v = setFixedWalls(walls, intersect)

      var objs = getInterestObjs(self, intersect)

      if(!objs.length) {

        self.obj.obj.position.x = intersect.x
        self.obj.obj.position.z = intersect.z
        
        return true

      }

      if( setFixedObjs(self, objs, intersect, v) ) {

        walls = getInterestWalls(self, intersect)

        if(!walls.length) {

          self.obj.obj.position.x = intersect.x
          self.obj.obj.position.z = intersect.z

          return true

        }

      }

    }

}

function moveByWall(self, wall, position) {

  self.obj.obj.rotation.y = wall.mesh.rotation.y

  wall.limits_y.forEach(limit => limit.mesh.visible = true)

  var info = self.getObjInfo(self.obj)
  var all = self.getWallInfo(wall, [self.obj])

  var rect = new Rectangle().setFromSizeAndAngle(info.size.x, info.size.y, 0)
  rect.position.x = new Vector2(position.x, position.z).rotateAround({x:0, y:0}, info.obj.obj.rotation.y).x
  rect.position.z = position.y

  // find points
  var max = _Math.calcRealSize(new Vector3(info.size.x/2, info.size.y/2, 0), wall.rot, 'x', 'z')
  var min = max.clone().multiplyScalar(-1)
  max.add(position)
  min.add(position)

  /**
   * fixed by wall sizes
   */

  // TODO add multi

  // fx by len (xz)
  var vec = new Vector3(max.x - min.x, 0, max.z - min.z).normalize()
  if(new Vector3(min.x - wall.position.x, 0, min.z - wall.position.z).length() > wall.l/2) {

    position.x = wall.position.x
    position.z = wall.position.z
    position.add(vec.multiplyScalar(info.size.x/2 - wall.l/2))

  } else if(new Vector3(max.x - wall.position.x, 0, max.z - wall.position.z).length() > wall.l/2) {

    position.x = wall.position.x
    position.z = wall.position.z
    position.add(vec.multiplyScalar(wall.l/2 - info.size.x/2))

  }
  // fx by y
  if(min.y < 0) position.y = info.size.y/2
  else if(max.y > wall.HEIGHT) position.y = wall.HEIGHT - info.size.y/2

  /**
   * find crosses and fixed
   */
  var isUseLimitsByY = false

  var rect1 = new Rectangle, cross = false, info1

  for(info1 of all) {
    // fix this on slanting
    rect1.setFromSizeAndAngle(info1.size.x, info1.size.y, 0)
    rect1.position.x = new Vector2(info1.obj.obj.position.x, info1.obj.obj.position.z).rotateAround({x:0, y:0}, wall.mesh.rotation.y).x
    rect1.position.z = info1.obj.obj.position.y

    if(cross = rect.cross(rect1)) break

  }

  if(cross) {

    var v

    if(cross.length) {

      if(cross[0].line1.equals(cross[1].line1)) {

        var point = rect.isInsidePoint(cross[0].line2.start) ? cross[0].line2.start : cross[0].line2.end 

        v = point.sub( 
          cross[0].point 
        ).normalize().toFixed()

      } else if(cross[0].line2.equals(cross[1].line2)) {

        v = cross[0].point.sub( 
          rect1.isInsidePoint(cross[0].line1.start) ? cross[0].line1.start : cross[0].line1.end 
        ).normalize().toFixed()

      } else {

        var p = (cross[0].line1.start.equals(cross[1].line1.start) || cross[0].line1.start.equals(cross[1].line1.end)) ?
                  cross[0].line1.start : cross[0].line1.end

        v = cross[+( cross[0].point.distanceTo(p) > cross[1].point.distanceTo(p) )]
                    .point.clone().sub(p).normalize().toFixed()

      }

    } else {

      var triangles = rect1.getTriangles()
      var lpos = rect.position.clone().sub(rect1.position)
      v = new Vector3

      for(var triangle of triangles) {

        if(_Math.pointInTriangle2(lpos, ...triangle, 'x', 'z')) {

          triangle = triangle.filter(v => !v.equals({x:0, y:0, z:0}))
          v.copy(triangle[0]).sub(triangle[1]).divideScalar(2).add(triangle[1]).normalize().toFixed()

          break

        }

      }

    }

    if(Math.abs(v.x) < Math.abs(v.z)) {
      // mv by y
      position.y = info1.obj.obj.position.y + (info1.size.y + info.size.y) / 2 * (v.z < 0 ? -1 : 1)

    } else {
      // mv by len (xz)
      var vec = wall.vec.clone()
      if(v.x < 0) vec.multiplyScalar(-1)

      position.x = info1.obj.obj.position.x
      position.z = info1.obj.obj.position.z

      position
        .sub(wall.normal.clone().multiplyScalar(info1.size.z / 2))
        .add(vec.multiplyScalar((info1.size.x + info.size.x) / 2))

      isUseLimitsByY = true

    }

  }

  // fixed by limits_y
  if(!cross || isUseLimitsByY) {

    var h1 = position.y - info.size.y/2
    var h2 = position.y + info.size.y/2

    var limit = false

    if(limit = wall.limits_y.find( l => (h1 < l.h && h1 + LIMIT_GAP >= l.h) || (h1 > l.h && h1 - LIMIT_GAP <= l.h) )) {

      position.y = limit.h + info.size.y/2

    } else if(limit = wall.limits_y.find( l => (h2 < l.h && h2 + LIMIT_GAP >= l.h) || (h2 > l.h && h2 - LIMIT_GAP <= l.h) )) {

      position.y = limit.h - info.size.y/2

    }

  }

  /**
   * mv
   */
  var mv = wall.normal.clone().multiplyScalar(info.size.z/2)

  self.obj.obj.position.copy(position).add(mv)

}

function findPosition(self, obj, rect) {

  raycaster.setFromCamera( new Vector2, self.scene.camera )
  
  var wall, dist = false
  var ndist = new Vector3

  var cam_angle = new Vector2(raycaster.ray.direction.x, raycaster.ray.direction.z).normalize().multiplyScalar(-1).angle()

  for(var i = 0; i < self.room._walls.length; i++) {

    var w = self.room._walls[i]

    if(Math.abs(new Vector2(w.rvec.x, w.rvec.z).normalize().angle() - cam_angle) > Math.PI/2)
      continue

    if(raycaster.ray.intersectPlane(w, ndist)) {

      var len = ndist.sub(self.scene.camera.position).length()

      if(!dist || len < dist) {
        dist = len
        wall = w
      }

    }

  }

  obj.rotation.y = new Vector2(0, 1).angle() - new Vector2(wall.rvec.x, wall.rvec.z).angle()
  obj.position.set(wall.point1.x, obj.position.y, wall.point1.z)
    .add(wall.vec.clone().multiplyScalar(rect.size.x/2))
    .add(wall.rvec.clone().multiplyScalar(rect.size.y/2))

  var pline = new Plane(wall.normal, wall.constant - rect.size.y + .1)
  var line_points = []

  for(var r of self.rects) {

    if(r === rect) continue

    var p
    if(p = r.cross(pline))
      line_points.push(p)

  }

  var tmp = wall.rvec.clone().multiplyScalar(.1)
  line_points.forEach(p => { p[0].add(tmp); p[1].add(tmp) })

  var opoints = [ obj.position.clone(), obj.position.clone() ]
  var mv = wall.vec.clone().multiplyScalar(rect.size.x/2)
  opoints[0].sub(mv)
  opoints[1].add(mv)
  var mv1 = wall.rvec.clone().multiplyScalar(rect.size.y/2)

  for(var i = 0; i < line_points.length; i++) {

    var points = line_points[i]

    // TODO: проверять не вхождение точки в область, а пересечение областей
    var bet1 = _Math.isBetweenPoints(opoints[0], ...points, wall.vec, 'x', 'z')
    var bet2 = _Math.isBetweenPoints(opoints[1], ...points, wall.vec, 'x', 'z')
    if(bet1 || bet2) {

      var ch = opoints[1].clone().sub(opoints[0]).normalize()

      if(ch.equals(wall.vec)) {
        opoints[0] = points[1].sub(mv1)
        opoints[1] = opoints[0].clone().add(mv.clone().multiplyScalar(1.9))
      } else {
        opoints[0] = points[0].sub(mv1)
        opoints[1] = opoints[1].clone().add(mv.clone().multiplyScalar(1.9))
      }
      
      line_points.splice(i, 1)
      i = -1

    }

  }

  obj.position.copy(opoints[0].add(mv))

}

/**
 * exorted Class BMControl
 */

function BMControl({ scene, points = [], dom = document.body, ocontrol } = {}) {

  this.objects = []
  this.sizes = []
  this.rects = []

  this.room = new Room(points)
  this.events = {}
  this.obj = null
  this.move = false
  this.mouse = new Vector2
  this.scene = scene
  this.ocontrol = ocontrol

  var events = {
    mouseMove: mouseMove.bind(this),
    mouseDown: mouseDown.bind(this),
    mouseUp: mouseUp.bind(this)
  }

  this.enable = function(bool) {

    var func = bool ? 'addEventListener' : 'removeEventListener'

    dom[func]('mousemove', events.mouseMove)
    dom[func]('mousedown', events.mouseDown)
    dom[func]('mouseup', events.mouseUp)

    return this

  }

  this.enable(true)

  /**
   * если кнопка мыши была поднята в течении
   * некоторого времени, то выделяем обьект,
   * иначе работает orbit
   */
  this.moveTimeout = null

}

BMControl.prototype.add = function() {

  for ( var i = 0; i < arguments.length; i ++ ) {

    var info = arguments[i]

    var obj = info, size = new Vector3, rect

    if(obj.isObject3D) {

      obj = { obj, type: 'floor' }
      
    }

    rect = new Rectangle().bindObject3d(obj.obj, size)

    Object.defineProperty(obj.obj.rotation, 'y', {
      set: (function(value) {

        // get from THREE https://github.com/mrdoob/three.js/blob/master/src/math/Euler.js
        this.obj.rotation._y = value
        this.obj.rotation.onChangeCallback()
        // add custom
        if(this.obj.userData.rectCacheRotY !== value) {
          this.rect.setFromSizeAndAngle(
            size.x,
            size.z,
            value
          )
          this.obj.userData.rectCacheRotY = this.obj.rotation.y
        }
        
      }).bind({obj: obj.obj, rect}),
      get() {
        return this._y
      }
    })

    this.objects.push(obj)
    this.sizes.push(size)
    this.rects.push(rect)

    obj.obj.rotation.y = 0
    obj.obj.position.y = size.y/2

    // findPosition(this, obj, rect)

  }

}

BMControl.prototype.remove = function() {

  for ( var i = 0; i < arguments.length; i ++ ) {

    var obj = arguments[i], idx
    
    if(obj.isObject3D) {

      idx = this.objects.findIndex(o => o.obj === obj)

    } else idx = this.objects.indexOf(obj)

    if(idx !== -1) {

      this.objects.splice(idx, 1)
      this.sizes.splice(idx, 1)
      this.rects.splice(idx, 1)

    }

  }

}

BMControl.prototype.selectedObject = function(obj) {

  if(this.ocontrol && this.ocontrol.enabled) {

    this.ocontrol.enabled = false
    
  }

  var wall = this.getWallByObj(obj)
  if(wall) {

    wall.limits_y.forEach(limit => limit.mesh.visible = true)

  }

  this.obj = obj

  if(this.events.onselected)
    this.events.onselected(obj, this.objects)

};

BMControl.prototype.unselectedObject = function(resetOControl) {

  if(resetOControl && this.ocontrol && this.ocontrol.setRotateStart) {
    this.ocontrol.setRotateStart(new Vector2(...resetOControl))
  }

  if(this.events.onunselected)
    this.events.onunselected(this.obj, this.objects)

  this.room._walls.forEach(wall => wall.limits_y.forEach(limit => limit.mesh.visible = false))

  this.obj = null

  if(this.ocontrol && !this.ocontrol.enabled) {

    this.ocontrol.enabled = true
    
  }

};

BMControl.prototype.getSizeObj = function(obj) {

  var idx = this.objects.indexOf(obj)

  if(idx === -1) return false

  return this.sizes[idx]

};

BMControl.prototype.getRectObj = function(obj) {

  var idx = this.objects.indexOf(obj)

  if(idx === -1) return false

  return this.rects[idx]

};

BMControl.prototype.getObjInfo = function(obj) {

  var idx = this.objects.indexOf(obj)

  if(idx === -1) return false

  return {

    rect: this.rects[idx],
    size: this.sizes[idx],
    obj

  }

};

BMControl.prototype.getWallInfo = function(wall, exclude) {

  var res = []

  for(var obj of wall.objects) {

    if(exclude && exclude.includes(obj)) continue

    res.push(this.getObjInfo(obj))

  }

  return res

};

BMControl.prototype.getWallByObj = function(obj) {

  return this.room._walls.find(wall => wall.objects.includes(obj))

};

/**
 * Event on dom
 */
function mouseMove(e) {

  this.mouse.x = (e.clientX / window.innerWidth ) * 2 - 1
  this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  if(this.obj) {

    if(!this.move) return

    moveSelected(this)

  } else {

    if(this.events.onview) {

      var obj = findObject(this)
      this.events.onview(obj, this.objects)

    }

  }

}

/**
 * Event on dom
 */
function mouseDown(e) {

  this.move = true

  var obj = findObject(this)

  if(obj) { 

    if(obj !== this.obj && this.obj) {

      this.unselectedObject([e.clientX, e.clientY])

    }

    this.moveTimeout = [
      obj,
      setTimeout((function() {

        this.moveTimeout = null
        
      }).bind(this), 200)
    ]

  } else if(this.obj) {

    this.unselectedObject([e.clientX, e.clientY])

  }

}

/**
 * Event on dom
 */
function mouseUp(e) {

  this.move = false

  if(this.moveTimeout) {
    
    clearTimeout(this.moveTimeout[1])

    this.selectedObject(this.moveTimeout[0])
    
    this.moveTimeout = null

  }

}

//export
export { BMControl }
