
define(function(require) {

  function TextMesh(text, color) {
    var canvas = document.createElement('canvas')
    canvas.height = 128
    canvas.width = 512
    var ctx = canvas.getContext('2d')
    ctx.font = "128px Arial"
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    this.constructor(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }))

    this.scale.set(36, 9, 1) // 512x128

    this.ctx = ctx
    this.color = color
    this.text = text
  }

  TextMesh.prototype = Object.create(THREE.Sprite.prototype)

  Object.defineProperties(TextMesh.prototype, {

    text: {

      set(value) {

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.fillText(value, this.ctx.canvas.width / 2, 0)
        this.material.map.needsUpdate = true

      }

    }

  })

  return TextMesh

})
