//Scene setup
		var clock = new THREE.Clock(true);
		var scene = new THREE.Scene();
		var canvas = document.querySelector("canvas");
		var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize({canvas: canvas});
		document.body.appendChild(renderer.domElement);
		var numCubes = 10;

		//geometry
		var cubeGeometry = new THREE.BoxGeometry(1, 1,1 );
		var planeGeometry = new THREE.PlaneGeometry(4, 4, 1);
		var material = new THREE.MeshBasicMaterial( {color: 0x0c6297  });
		var cube = new THREE.Mesh(cubeGeometry, material);
		var plane = new THREE.Mesh(planeGeometry, material);
		scene.add(cube);
		scene.add(plane);

		// var planeMaterial;
		// var loader = new THREE.FileLoader();
		// loader.load('shaders/plane.vs',
		// 		function(data){
		// 			planeMaterial planeMaterial = new THREE.ShaderMaterial({
		// 				vertexShader: loader.text;,
		// 				fragmentShader: shaders/plane.fs
		// 			});

		// 	}
		// );
		//camera var
		camera.position.z = 5;

		//cube list
		var cubes =  new Array(numCubes);
		for(i = 0; i < numCubes; i++){
			var lcube = new THREE.Mesh(cubeGeometry, material);
			cubes.push(lcube);
			scene.add(lcube);
		}
		
		function resize(){
			var width = canvas.clientWidth;
			var height = canvas.clientHeight;

			if(width != canvas.width || height != canvas.height)
			renderer.setSize(width, height, false);
			camera.aspect = width/height;
			camera.updateProjectionMatrix();
		}

		//rendering
		function animate(){
			requestAnimationFrame(animate);
			resize();

			cubes.forEach(transform);

			//updating code
			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;

			//render call
			renderer.render(scene, camera);
		}
		animate();

		var ccolor = new THREE.Color(0xc54242); 
		function transform(localcube, index) {
			var mag = 3;
			localcube.position.x = mag * Math.cos(2*Math.PI/ numCubes * index + clock.getElapsedTime());
			localcube.position.y = mag * Math.sin(2*Math.PI/ numCubes * index+ clock.getElapsedTime());

			localcube.rotation.x = Math.cos(clock.getElapsedTime());
			localcube.rotation.y = Math.sin(clock.getElapsedTime());
			
			//ccolor =  new THREE.Color(Math.sin(clock.elapsedTime)+0.5/2, Math.sin(clock.elapsedTime)+0.2/2, Math.sin(clock.elapsedTime)+1/2);
			material.color = ccolor;
		}