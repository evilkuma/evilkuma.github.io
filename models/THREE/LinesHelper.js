define(function(require) {

  function LinesHelper() {
    this.constructor()

    this.lines = []
    this.material = new THREE.LineBasicMaterial({color:0x0000ff, linewidth: 1})
  }
  LinesHelper.prototype = Object.create(THREE.Group.prototype)

  LinesHelper.prototype.addLine = function(line) {

    var geom = new THREE.Geometry
    geom.vertices.push(line.start, line.end)

    var mesh = new THREE.Line(geom, this.material)

    this.add(mesh)

    this.lines.push([line, mesh])

  }
  LinesHelper.prototype.removeLine = function(line) {

    var is = this.lines.find(el => el[0] === line)

    if(is) {
      // this.lines.splice(is, 1)
      this.remove(is[1])
    }

  }
  LinesHelper.prototype.setLines = function(lines) {

    this.lines.forEach(line => this.removeLine(line[0]))
    this.lines = []
    lines.forEach(line => this.addLine(line))

    return this

  }

  LinesHelper.prototype.updateMatrixWorld = function ( force ) {
    /**
     * Переопределенный метод из ядра THREE. Для его работы сначала вызываем
     * 'super' метод, а потом дополняем своей логикой.
     *  */    
    this.constructor.prototype.updateMatrixWorld.call(this, [force])

    this.children.forEach(mesh => mesh.geometry.verticesNeedUpdate = true)

  }

  return LinesHelper

})
