var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var light = new THREE.AmbientLight( 0x404040, 0.7 ); 
scene.add( light );
var pointLight = new THREE.PointLight( 0xffffff, 0.7, 100 );
pointLight.position.y = 5
scene.add( pointLight );

var geometry = new THREE.PlaneGeometry( 8, 8 );
var material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
var plane = new THREE.Mesh( geometry, material );
plane.rotation.x = -Math.PI/2
scene.add( plane );

camera.position.set(-3, 5, 5);
camera.lookAt(scene.position)

var animate = function () {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
};

animate();

// plane cnv material
var cnv = document.createElement('canvas');
cnv.width = 512
cnv.height = 512
var ctx = cnv.getContext('2d')
ctx.fillStyle = '#FFFFFF'
ctx.fillRect(0, 0, cnv.width, cnv.height)

var texture = new THREE.CanvasTexture(cnv)
plane.material.color = null
plane.material.map = texture
plane.material.needsUpdate = true

// raycast
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var isFixed = true
function fixed(val) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, cnv.width, cnv.height)
    texture.needsUpdate  = true
    isFixed = val
}

function onMouseDown( event ) {
    if(isFixed) return

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );

    if(intersects.length && intersects[0].object == plane) {
        ctx.fillStyle = 'red'
        ctx.beginPath();
        ctx.arc(
            cnv.width*intersects[0].uv.x,
            cnv.height-cnv.height*intersects[0].uv.y,
            10,
            0,
            Math.PI*2
        )
        ctx.fill()
        texture.needsUpdate  = true
        plane.material.needsUpdate  = true
    }
}

window.addEventListener( 'mousedown', onMouseDown, false );

function onMouseMove( event ) {
    if(!isFixed) return
    
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );

    if(intersects.length && intersects[0].object == plane) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, cnv.width, cnv.height)
        ctx.fillStyle = 'red'
        ctx.beginPath();
        ctx.arc(
            cnv.width*intersects[0].uv.x,
            cnv.height-cnv.height*intersects[0].uv.y,
            10,
            0,
            Math.PI*2
        )
        ctx.fill()
        texture.needsUpdate  = true
    }
}

window.addEventListener( 'mousemove', onMouseMove, false );
