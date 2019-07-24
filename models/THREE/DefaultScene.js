
define(function(require) {

  var SCOPE = require('./../global')

  var cam_data = [
    [180, 0], // 0 спереди
    [-90, 0], // 1 слева
    [180, 90], // 2 сверху
    [90, 0], // 3 справа
    [0, -90], // 4 снизу
    [0, 0]  // 5 сзади
  ]

  function polarToVector3(lat, lng, radius) {

    lng = Math.max(-89.99, Math.min(89.99, lng))
    
    var theta = (lat - 90) * (Math.PI / 180)
    var phi   = (90 - lng) * (Math.PI / 180)
    
    var x = radius * Math.sin(phi) * Math.cos(theta)
    var y = radius * Math.cos(phi)
    var z = radius * Math.sin(phi) * Math.sin(theta)
    
    return {x, y, z}

  }

  function DefaultScene(element) {

    var gui = SCOPE.gui.addFolder('camera')

    var cam_gui = gui.addFolder('type')
    cam_gui.add({ perspective() {
      self.setCamera('perspectivecamera')
    } }, 'perspective')
    cam_gui.add({ orthographic() {
      self.setCamera('orthographiccamera')
    } }, 'orthographic')

    var side_cam_gui = gui.addFolder('side')

    var sides = [ 'forward', 'left', 'top', 'right', 'bottom', 'back' ]
    var self = this
    for(var i in sides) 
      side_cam_gui.add({
        toggle: (function() {
          self.toggleView(this.i)
        }).bind({i: +i+1})
      }, 'toggle').name(sides[i])


    this.scene = new THREE.Scene
    this.scene.background = new THREE.Color(0x222222)

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setSize( element.clientWidth, element.clientHeight );
    element.appendChild( this.renderer.domElement );

    this.setCamera()
    this.camera.position.y = 180

    // --------------

    this.scene.add(new THREE.AmbientLight( 0x404040, 0.7 ))

    var lights = [];
    lights[ 0 ] = new THREE.PointLight( 0xffe7cc, 1, 400 );
    lights[ 1 ] = new THREE.PointLight( 0xffe7cc, 1, 400 );
    lights[ 2 ] = new THREE.PointLight( 0xffe7cc, 1, 400 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( - 100, - 200, - 100 );

    this.scene.add( ...lights );

    // --------------

    var animate = (function() {

      requestAnimationFrame( animate )

      this.renderer.render( this.scene, this.camera );

    }).bind(this)

    animate()

    window.addEventListener('resize', updateRendererSize.bind(this), false)

  }

  function updateRendererSize() {

    if(!this.renderer.domElement.parentElement) {

      console.error('cant calc size without parent dom element')
      return

    }

    if(this.camera) {

      const parentElement = this.renderer.domElement.parentElement
      const aspect = parentElement.clientWidth/parentElement.clientHeight
      const width = parentElement.clientWidth
      const height = parentElement.clientHeight

      this.renderer.setSize(width, height)
      this.camera.aspect = aspect

      if (this.camera.type === 'OrthographicCamera') {

        this.camera.left = -width
        this.camera.right = width
        this.camera.top = height
        this.camera.bottom = -height

      }

      this.camera.updateProjectionMatrix()
    }

  }

  DefaultScene.prototype.setCamera = function(type = 'perspectivecamera') {

    if(!this.renderer.domElement.parentElement) {

      console.error('cant calc size without parent dom element')
      return

    }

    if(this.camera && this.camera.type.toLowerCase() === type.toLowerCase()) 
      return

    if(this.camera && this.camera.parent)
      this.camera.parent.remove(this.camera)

    var parentElement = this.renderer.domElement.parentElement

    switch(type.toLowerCase()) {
      case 'perspectivecamera':
        this.camera = new THREE.PerspectiveCamera(75, parentElement.clientWidth/parentElement.clientHeight, 0.1, 1000000)
        this.camera.position.z = 100
        break;
      case 'orthographiccamera':
        this.camera = new THREE.OrthographicCamera(
          -parentElement.clientWidth,
          parentElement.clientWidth,
          parentElement.clientHeight,
          -parentElement.clientHeight,
          -3000, 10000
        )
        this.camera.position.z = 10
        break;
      default:
        console.error('undefined camera type')
    }

    // this.scene.add(this.camera)

    if(this.ocontrol)
      this.ocontrol.object = this.camera

  }

  DefaultScene.prototype.toggleView = function(id, r = 100, fit) {

    if (id < 1 && id > 6) {
      console.error('undefined view side')
      return
    }
  
    var size = new THREE.Vector3
    new THREE.Box3().setFromObject(this.scene).getSize(size)

    var data = cam_data[id - 1] // [h, v]
    var vec = polarToVector3(data[0], data[1], r)

    if(this.ocontrol) this.ocontrol.reset()

    this.camera.position.copy(vec)
  
    // camera zoom or position to fit room:
    switch(this.camera.type) {
      case 'OrthographicCamera':
        var ver = (Math.abs(this.camera.top) + Math.abs(this.camera.bottom)) / size.z
        var hor = (Math.abs(this.camera.left) + Math.abs(this.camera.right)) / size.x
        this.camera.zoom = Math.min(ver, hor)
        this.camera.updateProjectionMatrix()
      break
      case 'PerspectiveCamera':
        var aspect = this.camera.aspect
        var fov = this.camera.fov
        var model = []
        // [w, l, h, direction, sign]
        switch(id) {
          case 1:
            model = [size.x, size.y, size.z, 'z', +1]
          break
          case 2:
            model = [size.z, size.y, size.x, 'x', -1]
          break
          case 3:
            model = [size.x, size.z, size.y, 'y', +1]
          break
          case 4:
            model = [size.z, size.y, size.x, 'x', +1]
          break
          case 5:
            model = [size.x, size.z, size.y, 'y', -1]
          break
          case 6:
            model = [size.x, size.y, size.z, 'z', -1]
          break
        }
      
        var ver = model[0] / 2 / aspect / Math.tan(fov * Math.PI / 360)
        var hor = model[1] / 2 / Math.tan(fov * Math.PI / 360)
        var dist = Math.max(ver, hor) + model[2] / 2
        this.camera.position[model[3]] = dist * model[4]
      break
    }

    if(this.ocontrol) this.ocontrol.update()

  }

  return DefaultScene

})
