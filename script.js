//variables

var DOM_video = document.querySelector("#videoElement");
var DOM_canvas = document.getElementById('Canvas');
var group = new THREE.Group();

var renderer;
var camera;
var scene;
var x = -10;
var y = -10;
var z = -40;

//functions
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

function buildGraphics(bG_width, bG_height) {
	renderer = new THREE.WebGLRenderer({ canvas: DOM_canvas, antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setSize(bG_width, bG_height);
	camera = new THREE.PerspectiveCamera(35, bG_width / bG_height, 0.1, 3000);
	scene = new THREE.Scene();
	var lightOne = new THREE.AmbientLight(0xffff, 0.5);
	scene.add(lightOne);
	var lightTwo = new THREE.PointLight(0xffff, 0.5);
	scene.add(lightTwo);
}

function clearThree(obj) {
	while (obj.children.length > 0) {
		clearThree(obj.children[0])
		obj.remove(obj.children[0]);
	}
	if (obj.geometry) obj.geometry.dispose()

	if (obj.material) {
		//in case of map, bumpMap, normalMap, envMap ...
		Object.keys(obj.material).forEach(prop => {
			if (!obj.material[prop])
				return
			if (typeof obj.material[prop].dispose === 'function')
				obj.material[prop].dispose()
		})
		obj.material.dispose()
	}
}

function loader(objpath, mtlpath) {
	console.log(" Original Material loaded");
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.load(mtlpath, function (materials) {
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.load(objpath, function (mesh) {
			mesh.position.set(x, y, z);
			group.add(mesh);
		});
	});
	scene.add(group);

}

function render() {
	requestAnimationFrame(render);
	var coord = definedRenderloop();
	set3Dpositions(coord[0],coord[1],z);
	renderer.render(scene, camera);
	//console.log("x and y value : ",coord[0]," and ",coord[1]);
}

function getCoordinates() {
	buildGraphics(DOM_video.clientWidth, DOM_video.clientHeight);
	loader("models/knife.obj", "models/knife.mtl");
	render();
	console.log("3D objects : ", scene.children.length);
}

function set3Dpositions(x, y, z) {
	scene.children[2].position.set(x, y, z);
	scene.children[2].rotation.z=x;
}
function definedRenderloop() {
	x = x + 0.1;
	y += 0.1;
	if (x > 10) {
		x = -2;
		y = -2;
	}
	return [x,y];
}

//Linking
DOM_video.addEventListener("play", getCoordinates);

//Execution
getCameraFeed();
