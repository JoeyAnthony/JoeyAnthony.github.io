//Scene setup
		var clock = new THREE.Clock(true);
		var scene = new THREE.Scene();
		var canvas = document.querySelector("canvas");
		var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize({canvas: canvas});
		document.body.appendChild(renderer.domElement);
		var numCubes = 8;



		var shadervs = 
		`
			void main() {
            gl_Position =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        	}
		`;

		var shaderfs = 
		`
			uniform vec2 u_resolution;
			uniform float u_time;
			
			float wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave){
	        	return 	step(st.y, ((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight)); 	// upperwave
	        }

	        vec3 wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave, vec3 uppercolour, vec3 lowercolour, float time){
	        	return 	step(st.y, ((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight))	/*<- upperwave*/ * mix( ((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight) +0.616, sin(st.y)*4.008, .5)*uppercolour*1.2 /*<-upperwave colour interpolation*/ 
                    	// //step() params are just switched for a counterwave																													//added mix numbers are for: amount of black, colour intensity
	       			+	step(((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight), st.y)	/*<- lowerwave*/ *lowercolour;
	        }

	        void main() {
	        	vec2 st = gl_FragCoord.xy/1000.;//800 is a nice value so no stretch
	        	
				vec3 bg = vec3(0.785,0.441,0.289)*st.y+0.1;
                
    			vec3 w1 = wave(st, 1.3, 16.628, 15.946,-0.508,vec3(0.495,0.145,0.112), bg, u_time/1.);
    			vec3 w2 = wave(st, 1.3, 7.076, 5.874,7.508, vec3(0.530,0.100,0.120), bg, u_time/1.952);
    			vec3 w3 = wave(st, 1.3, 5.5, 1.378,5.364, vec3(0.173,0.230,0.740), bg, u_time/1.6);
    			vec3 w4 = wave(st, 1.3, 5.5, 2.25,1.276, vec3(0.535,0.654,0.680), bg, sin(u_time));
    			vec3 w5 = wave(st, 1.3, 5.5, 3.754,3.316, vec3(0.348,0.366,0.985), bg, sin(u_time-1.35));

				
                float cmix = 0.5; //mix value divided by the amount of waves
               	vec3 w = mix(w1, w2, cmix);
    			w = mix(w, w3, cmix/3.0);
    			w = mix(w, w4, cmix/4.0);
    			w = mix(w, w5, cmix/5.0);
	            gl_FragColor=vec4(w, 1.0);
	        }
		`
		;

		var cubevs = 
		`
			varying vec3 v_VertPosition;
			varying vec3 v_NormalDir;
			varying vec3 v_CamPosition;

			void main()
			{
				v_VertPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
				v_NormalDir = (modelMatrix * vec4( normal, 1.0 )).xyz;
				v_CamPosition = cameraPosition;

				gl_Position = projectionMatrix * viewMatrix * vec4(v_VertPosition, 1.0);
			}
		`;

		var cubefs = 
		`
			/*
			* Shading model from Real Time Rendering used.
			*/

			uniform vec2 u_resolution;
			uniform float u_time;
			uniform vec3 u_surface;

			varying vec3 v_VertPosition;
			varying vec3 v_NormalDir;
			varying vec3 v_CamPosition;

			vec3 lights[2];
			vec3 lightColor = 	vec3(.9, 0.6, 0.3)/2.0;

			//vec3 surface = 		vec3( .8, 0.2, 0.3);
			vec3 cool = 		vec3( .0, .0, .55);
			vec3 warm = 		vec3(0.5, 0.3, 0.0);
			vec3 highlight =	vec3(2.0, 2.0, 2.0);

			vec3 lit(vec3 l, vec3 n, vec3 v){
				vec3 r_l = reflect(-l, n);
				float s = clamp(100.0 * dot(r_l, v) - 97.0, 0.0, 1.0);
				return mix(warm, highlight, s);
			}

			vec3 unlit(){
				return  0.5 * cool;
			}
			
	        void main() {
				lights[0] = vec3(3.0, 3.0, 4.0);
				lights[1] = vec3(-3.0, -3.0, -3.2);

		        cool 	+= u_surface;
				warm 	+= u_surface;

				vec3 n = normalize(v_NormalDir);
				vec3 v = normalize(v_CamPosition - v_VertPosition);

				vec4 outputColor = vec4(unlit(), 1.0);

				for(int i = 0; i < 2; i++){
					vec3 l = normalize(lights[i] - v_VertPosition);
					float NdL = clamp(dot(n, l), 0.0, 1.0);
	        		outputColor += vec4(NdL * lightColor * lit(l, n, v), 0.0);
	        	}

	        	gl_FragColor=outputColor;
	        }
		`
		;

		    var uniforms = {
                u_time: { type: "f", value: 1.0 },
                u_resolution: { type: "v2", value: new THREE.Vector2() },
                u_mouse: { type: "v2", value: new THREE.Vector2() },
                u_surface: {type: "v3", value: new THREE.Vector3()}

            };


		    var planematerial = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                vertexShader: shadervs,
                fragmentShader: shaderfs
            } );

            var cubematerial = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                vertexShader: cubevs,
                fragmentShader: cubefs
            } );

		//geometry
		var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
		var planeGeometry = new THREE.PlaneGeometry(15, 15, 1);
		var material = new THREE.MeshBasicMaterial( {color: 0x0c6297  });
		var centerCube = new THREE.Mesh(cubeGeometry, cubematerial);
		var backgroundPlane = new THREE.Mesh(planeGeometry, planematerial);


		//camera var
		camera.position.z = 5;
		backgroundPlane.position.z = -2;

		scene.add(centerCube);
		scene.add(backgroundPlane);

		//cube list
		var cubes =  new Array(numCubes);
		for(i = 0; i < numCubes; i++){
			var lcube = new THREE.Mesh(cubeGeometry, cubematerial);
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

			uniforms.u_time.value = clock.getElapsedTime();
			uniforms.u_resolution.value = new THREE.Vector2(canvas.clientWidth, canvas.clientHeight);
			uniforms.u_surface.value = new THREE.Vector3(0.8, 0.2, 0.3);


			cubes.forEach(transform);

			//updating code
			centerCube.rotation.x += 0.01;
			centerCube.rotation.y += 0.01;
			//plane.scale.y = canvas.clientWidth/canvas.clientHeight;
			backgroundPlane.scale.x = canvas.clientWidth/canvas.clientHeight;

			//render call
			renderer.render(scene, camera);
		}
		animate();
		
		function transform(localcube, index) {
			var mag = 3;
			var scroll = document.documentElement.scrollTop / canvas.height;
			localcube.position.x = mag * Math.cos(2*Math.PI/ numCubes * index + clock.getElapsedTime());
			localcube.position.y = scroll + mag * Math.sin(2*Math.PI/ numCubes * index+ clock.getElapsedTime());
			centerCube.position.y = 0.0 + scroll;

			localcube.rotation.x = Math.cos(clock.getElapsedTime());
			localcube.rotation.y = Math.sin(clock.getElapsedTime());
		}