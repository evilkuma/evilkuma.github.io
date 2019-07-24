
import { Raycaster } from 'three/src/core/Raycaster'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'

var raycaster = new Raycaster

function RoomControls({ scene, room, dom = document.body, ocontrol }) {

  this.room = room
  this.ocontrol = ocontrol
  this.mouse = new Vector2
  this.obj = false
  this.scene = scene

  var events = {
    mouseMove: mouseMove.bind(this),
    mouseDown: mouseDown.bind(this),
    mouseUp: mouseUp.bind(this)
  }

  this._enabled = false
  this.enable = function(bool = !this._enabled) {

    this._enabled = bool

    this.room.showY(bool)
    this.ocontrol.enableRotate = !bool

    if(bool) {

      this.scene.setCamera('orthographiccamera')
      this.scene.toggleView(3)

    } else {
      
      this.scene.setCamera('perspectivecamera')
      this.scene.toggleView(1)

    }

    var func = bool ? 'addEventListener' : 'removeEventListener'

    dom[func]('mousemove', events.mouseMove)
    dom[func]('mousedown', events.mouseDown)
    dom[func]('mouseup', events.mouseUp)

    return this

  }

}

function findObject(controls) {

  if(!controls.room || !controls.room._walls.length) return false

  raycaster.setFromCamera( controls.mouse, controls.scene.camera ) 
  raycaster.ray.origin.y = 1000
  var intersects = raycaster.intersectObjects( controls.room._walls.map(wall => wall.mesh1), true )

  return intersects.length ? intersects[0].object : false

}

function moveObj(controls) {

  raycaster.setFromCamera( controls.mouse, controls.scene.camera )
  var intersect = new Vector3

  if(!raycaster.ray.intersectPlane( controls.room._plane, intersect )) return

  var wall = controls.room._walls.find(wall => wall.mesh1 === controls.obj)

  if(wall) wall.toPosition(intersect)

}

function mouseMove(e) {

  var dom = this.scene.renderer.domElement
  var bounds = dom.getBoundingClientRect()

  this.mouse.x = ((e.clientX - bounds.left) / dom.clientWidth) * 2 - 1
  this.mouse.y = - ((e.clientY - bounds.top) / dom.clientHeight) * 2 + 1;

  if(this.obj) {

    moveObj(this)

  }

}

function mouseDown(e) {

  this.obj = findObject(this)
  
}

function mouseUp(e) {

  this.obj = false

}

export { RoomControls }
