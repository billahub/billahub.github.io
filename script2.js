/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
*/

// MAIN

// standard global variables

var DOM_video = document.querySelector("#videoElement");
var DOM_canvas = document.getElementById('Canvas');
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var android;

// the following code is from
//    http://catchvar.com/threejs-animating-blender-models
var animOffset       = 0,   // starting frame of animation
	walking         = false,
	duration        = 1000, // milliseconds to complete animation
	keyframes       = 20,   // total number of animation frames
	interpolation   = duration / keyframes, // milliseconds per frame
	lastKeyframe    = 0,    // previous keyframe
	currentKeyframe = 0;
	

// FUNCTIONS 	


function getCameraFeed() {
	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({ video: true })
			.then(function (stream) {
				DOM_video.srcObject = stream;
			})
			.catch(function (err0r) {
				console.log("Something went wrong!");
			});
	}
}

function init(w,h) 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var VIEW_ANGLE = 45, ASPECT = w / h, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,-50,400);
	camera.lookAt(scene.position);	
	// RENDERER
	renderer = new THREE.WebGLRenderer({ canvas: DOM_canvas, antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setSize(w, h);
	// EVENTS
	//THREEx.WindowResize(renderer, camera);
	//THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	//controls = new THREE.OrbitControls( camera, renderer );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-100,200,200);
	scene.add(light);
	// FLOOR

	/*

	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/reticle_interactive_3d.png' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	
	*/

	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	// scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	
	////////////
	// CUSTOM //
	////////////
	
	var jsonLoader = new THREE.JSONLoader();
	jsonLoader.load( "models/android-animations.js", addModelToScene );
	// addModelToScene function is called back after model has loaded
	
	var ambientLight = new THREE.AmbientLight(0x111111);
	scene.add(ambientLight);
	
}

function addModelToScene( geometry, materials ) 
{
	// for preparing animation
	for (var i = 0; i < materials.length; i++)
		materials[i].morphTargets = true;
		
	var material = new THREE.MeshFaceMaterial( materials );
	android = new THREE.Mesh( geometry, material );
	android.scale.set(10,10,10);
	android.position.set(-100,-100,-100);
	scene.add( android );
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	// delta = change in time since last call (seconds)
	delta = clock.getDelta(); 
	var moveDistance = 100 * delta;
	walking = true;

	if (Gamepad.supported) 
	{
		var pads = Gamepad.getStates();
        var pad = pads[0]; // assume only 1 player.
        if (pad) 
		{
			
			// adjust for deadzone.
			if (Math.abs(pad.leftStickX + pad.rightStickX) > 0.3)
			{
				android.rotation.y -= delta * (pad.leftStickX + pad.rightStickX);
				walking = true;
			}
			if (Math.abs(pad.leftStickY + pad.rightStickY) > 0.2)
			{
				android.translateZ( -moveDistance * (pad.leftStickY + pad.rightStickY) );
				walking = true;
			}
			if ( pad.faceButton0 || pad.faceButton1 || pad.faceButton2 || pad.faceButton3 || pad.select || pad.start )
			{ 
			    android.position.set(0,0,0);
				android.rotation.set(0,0,0);
			}
			
        }
	}
	
	// move forwards / backwards
	if ( keyboard.pressed("down") )
		android.translateZ( -moveDistance );
	if ( keyboard.pressed("up") )
		android.translateZ(  moveDistance );
	// rotate left/right
	if ( keyboard.pressed("left") )
		android.rotation.y += delta;
	if ( keyboard.pressed("right") )
		android.rotation.y -= delta;
	
	
	var walkingKeys = ["up", "down", "left", "right"];
	for (var i = 0; i < walkingKeys.length; i++)
	{
		if ( keyboard.pressed(walkingKeys[i]) )
			walking = true;
	}
	
	controls.update();
	stats.update();
}

function render() 
{
	if ( android && walking ) // exists / is loaded 
	{
		// Alternate morph targets
		time = new Date().getTime() % duration;
		keyframe = Math.floor( time / interpolation ) + animOffset;
		if ( keyframe != currentKeyframe ) 
		{
			android.morphTargetInfluences[ lastKeyframe ] = 0;
			android.morphTargetInfluences[ currentKeyframe ] = 1;
			android.morphTargetInfluences[ keyframe ] = 0;
			lastKeyframe = currentKeyframe;
			currentKeyframe = keyframe;
		}
		android.morphTargetInfluences[ keyframe ] = 
			( time % interpolation ) / interpolation;
		android.morphTargetInfluences[ lastKeyframe ] = 
			1 - android.morphTargetInfluences[ keyframe ];
	}
	
	renderer.render( scene, camera );
}

function getCoordinates() {
	init(DOM_video.clientWidth, DOM_video.clientHeight);
	animate();
}

//Linking
DOM_video.addEventListener("play", getCoordinates);

//Execution
getCameraFeed();