
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial'
import { BufferGeometry } from 'three/src/core/BufferGeometry'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { Line } from 'three/src/objects/Line'
import { Group } from 'three/src/objects/Group'

import { TextMesh } from './TextMesh'

/**
 * childs:
 *  0 - основная линия
 *  1 - линия крайнего деления
 *  2 - косая линия крайнего деления
 *  3 - линия крайнего деления
 *  4 - косая линия крайнего деления
 *  5 - меш-число остатка
 *  6 - группа доп. делений
 *    6.* - каждый 3 меша соответствуют 1 поинту
 */

function SizeLine({ l = 1000, w = 200, text ='', material = new LineBasicMaterial({ color: 0x319ff9, linewidth: 1 }) } = {}) {

  this.constructor()

  this._l = 0
  this._w = 0
  this._points = []
  this._text

  var geom = new BufferGeometry
  geom.addAttribute('position', new BufferAttribute( new Float32Array( [ 0, -.5, 0, 0, .5, 0 ] ), 3))

  var line = new Line(geom, material)
  this.add(line)

  geom = new BufferGeometry
  geom.addAttribute('position', new BufferAttribute( new Float32Array( [ 0, 0, -.5, 0, 0, .5 ] ), 3))

  line = new Line(geom, material)
  this.add(line, line.clone(), line.clone(), line.clone())

  var g = new Group
  g.add(new TextMesh(l + text, '#319ff9'))
  this.add(g)

  this.children[3].rotation.x = -Math.PI / 4
  this.children[4].rotation.x = -Math.PI / 4
  this.children[5].rotation.y = Math.PI / 2
  this.children[5].rotation.z = -Math.PI / 2

  g = new Group
  geom = new BufferGeometry
  geom.addAttribute('position', new BufferAttribute( new Float32Array( [ 0, 0, -.5, 0, 0, .5 ] ), 3))
  line = new Line(geom, material)

  this._points.forEach(point => {

    var mesh1 = line.clone()
    var mesh2 = line.clone()
    mesh2.rotation.x = -Math.PI/4
    g.add(mesh1, mesh2, new TextMesh(point, '#319ff9'))

  })

  this.add(g)

  this.l = l
  this.w = w
  this.text = text

}

SizeLine.prototype = Object.create(THREE.Object3D.prototype)

Object.defineProperties(SizeLine.prototype, {

  material: {

    get() {

      return this.children[0].material

    },

    set(value) {

      this.children.forEach(child => child.material = value)

    }

  },

  l: {

    get() {

      return this._l

    },

    set(value) {

      if(this._l === value) return

      this._l = value
      var hl = this._l / 2
      this.children[0].scale.y = this._l
      this.children[1].position.y = hl
      this.children[2].position.y = -hl
      this.children[3].position.y = -hl
      this.children[4].position.y = hl

      this.updatePoints('l')

    }

  },

  text: {

    get() {

      return this._text

    },

    set(value) {

      if(this._text === value) return

      this._text = value

      this.updatePoints('text')

    }
    

  },

  w: {

    get() {

      return this._w

    },

    set(value) {

      if(this._w === value) return

      this._w = value
      this.children[1].scale.z = this._w
      this.children[2].scale.z = this._w
      this.children[3].scale.z = this._w
      this.children[4].scale.z = this._w

      this.updatePoints('w')

    }

  }

})

SizeLine.prototype.addPoint = function(value) {

  this._points.push(+value)

  var geom = new BufferGeometry
  geom.addAttribute('position', new BufferAttribute( new Float32Array( [ 0, 0, -.5, 0, 0, .5 ] ), 3))
  var mesh1 = new Line(geom, this.material)
  var mesh2 = mesh1.clone()
  mesh2.rotation.x = -Math.PI/4
  this.children[6].add(mesh1, mesh2, new TextMesh(value, '#319ff9'))

  this.updatePoints()

}

SizeLine.prototype.setPoint = function(i, value) {

  if(this._points[i] === value) return

  this._points[i] = value

  this.updatePoints()

}

SizeLine.prototype.updatePoints = function(id = 'full') {

  if( id === 'full' || id === 'w' ) {

    for (var i = 0; i < this._points.length * 3; i += 3) {

      this.children[6].children[i].scale.z = this._w
      this.children[6].children[i + 1].scale.z = this._w
      this.children[6].children[i + 2].position.z = -this._w / 2

    }

    this.children[5].position.z = -this._w / 2

  }

  if (id === 'full' || id === 'l' || id === 'text') {

    var hl = this._l/2
    var sum = 0

    for (var i = 0; i < this._points.length * 3; i += 3) {

      sum += this._points[i / 3]

      this.children[6].children[i].position.y = -hl + sum
      this.children[6].children[i + 1].position.y = -hl + sum
      this.children[6].children[i + 2].position.y = -hl + sum - this._points[i / 3] / 2
      this.children[6].children[i + 2].text = this._points[i / 3]
    
    }

    this.children[5].position.y = hl - (this._l - sum) / 2
    this.children[5].children[0].text = String(Number(this._l - sum))+this._text 

  }

}

SizeLine.prototype.clearPoints = function() {

  while (this.children[6].children.length) {

    this.children[6].remove(this.children[6].children[0])

  }

  this._points = []

}

export { SizeLine }
