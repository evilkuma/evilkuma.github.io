
(function() {

  var SCOPE
  var ROOMS

  requirejs(['./models/main'], function(data) {

    SCOPE = data.global
    ROOMS = data.rooms

    SCOPE.gui = new dat.GUI();

    run()
  
  });

  var scene, bmcontrol, ocontrol, rmcontrol

  var box = new THREE.Box3

  function isMarked(obj) {

    box.setFromObject(obj)
    var res = box.getSize(new THREE.Vector3)
    box.max.sub(obj.position)
    box.min.sub(obj.position)
    box.min.x += -0.01
    box.min.y += 0.01
    box.min.z += -0.01
    box.max.addScalar(0.01)

    var mark = new THREE.Box3Helper( box.clone() )

    mark.visible = false
    mark.material.linewidth = 3
    obj.add(mark)

    obj.mark = function(color) {
      mark.visible = !!color
      if(color) {
        mark.material.color = new THREE.Color(color)
      }
    }

    return res

  }

  function fixedOrigin(obj) {

    box.setFromObject(obj)

    var len = box.max.clone().sub(box.min)
    var cmax = box.max.sub(len.divideScalar(2))

    var res = new THREE.Group
    res.add(obj)
    obj.position.sub(cmax)

    return res

  }

  function run() {

    scene = new THREE.DefaultScene(document.body)
    SCOPE.scene = scene.scene

    ocontrol = new THREE.OrbitControls(scene.camera, scene.renderer.domElement)
    ocontrol.target.y = 40
    scene.ocontrol = ocontrol
    

    bmcontrol = new THREE.BMControl({
      scene,
      ocontrol
    })

    rmcontrol = new THREE.RoomControls({scene, room: bmcontrol.room, ocontrol})
    
    var loadRoom = function() {
      bmcontrol.room.setWallsBySizes(this)
      scene.scene.add(bmcontrol.room)
    }

    var rooms = SCOPE.gui.addFolder('room')
    SCOPE.room_sizes = SCOPE.gui.addFolder('room sizes')
    ROOMS.forEach(r => rooms.add({ load: loadRoom.bind(r.data) }, 'load').name(r.caption))

    SCOPE.gui.add({editWalls() { rmcontrol.enable() }}, 'editWalls').name('edit walls mode enabled')

    loadRoom.bind(ROOMS[7].data)()

    // bmcontrol.events.onview = function(obj, objs) {
    //   objs.forEach(o => o.obj.mark())
    //   if(obj) obj.obj.mark('red')
    // }
    bmcontrol.events.onselected = function(obj, objs) {
      objs.forEach(o => o.mesh.mark())
      obj.mesh.mark('green')
    }
    bmcontrol.events.onunselected = function(obj, objs) {
      obj.mesh.mark()
    }

    var assets = [
      { 
        key: 'soldier', 
        title: 'soldier',
        data: {
          type: 'floor',
          position: true
        }
      },
      { 
        key: 'bed', 
        title: 'bed',
        data: {
          type: 'floor',
          position: true
        }
      },
      { 
        key: 'closet', 
        title: 'closet',
        data: {
          type: 'wall',
          position: true
        }
      },
      { 
        key: 'table', 
        title: 'table',
        data: {
          type: 'floor',
          position: true
        }
      },
    ]

    function loadMTL() {
      // TODO: cached requests
      new THREE.MTLLoader().setPath('assets/'+this.key+'/').load('OBJ.mtl', materials => {
  
        materials.preload();
  
        new THREE.OBJLoader().setMaterials(materials).setPath('assets/'+this.key+'/').load('OBJ.obj', obj => {
  
          obj = fixedOrigin(obj)
          isMarked(obj)
          obj.scale.multiplyScalar(2)
  
          scene.scene.add(obj)

          var data = Object.assign({obj}, this.data)
    
          bmcontrol.add(data)
  
        })
  
      })

    }

    var assets_gui = SCOPE.gui.addFolder('assets')

    assets.forEach(a => {

      a.load = loadMTL.bind({key: a.key, data: a.data})
      var g = assets_gui.add(a, 'load')
      g.name(a.title)
      
    })

  }

})()
