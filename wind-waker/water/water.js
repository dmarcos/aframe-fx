AFRAME.registerComponent('water', {
  vertexShader :`
      #define SCALE 10.0

      varying vec2 vUv;
      uniform float uTime;
      attribute vec3 barycentric;
      varying vec3 vbc;

      float calculateSurface(float x, float z) {
        float time = uTime / 1000.0;
        float y = 0.0;

        // y += (sin(x * 1.0 / SCALE + time * 1.0) + sin(x * 2.3 / SCALE + time * 1.5) + sin(x * 3.3 / SCALE + time * 0.4)) / 10.0;
        // y += (sin(z * 0.2 / SCALE + time * 1.8) + sin(z * 1.8 / SCALE + time * 1.8) + sin(z * 2.8 / SCALE + time * 0.8)) / 10.0;
        y += sin(z * 1.0 / SCALE + time * 1.8) + sin(z * 9.0 / SCALE + time * 1.8) + sin(z * 15.0 / SCALE + time * 0.8);
        y += sin(x * 5.0 / SCALE + time * 1.0) + sin(x * 10.3 / SCALE + time * 1.5) + sin(x * 15.3 / SCALE + time * 0.4);

        return y;
      }

      void main() {
        vUv = uv;
        vec3 pos = position;
        vbc = barycentric;
        bool animation = true;

        float strength = 1.0;
        if (animation) {
          pos.y += strength * calculateSurface(pos.x, pos.z);
          pos.y -= strength * calculateSurface(0.0, 0.0);
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }`,

      fragmentShader : `
        varying vec2 vUv;

        uniform sampler2D uMap;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vbc;

        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;

        // This is like
        float aastep (float threshold, float dist) {
          float afwidth = fwidth(dist) * 0.5;
          return smoothstep(threshold - afwidth, threshold + afwidth, dist);
        }

        void main() {
          bool antialias = true;
          bool wireframe = false;
          bool animation = true;
          float time = uTime / 5000.0;

          vec2 uv = vUv * 250.0;

          if (animation) {
            uv += vec2(time * -0.05);
            uv.y += 0.01 * (sin(uv.x * 3.5 + time * 0.35) + sin(uv.x * 4.8 + time * 1.05) + sin(uv.x * 7.3 + time * 0.45)) / 3.0;
            uv.x += 0.12 * (sin(uv.y * 4.0 + time * 0.5) + sin(uv.y * 6.8 + time * 0.75) + sin(uv.y * 11.3 + time * 0.2)) / 3.0;
            uv.y += 0.12 * (sin(uv.x * 4.2 + time * 0.64) + sin(uv.x * 6.3 + time * 1.65) + sin(uv.x * 8.2 + time * 0.45)) / 3.0;
          }

          vec4 tex1 = texture2D(uMap, uv * 1.0);
          vec4 tex2 = texture2D(uMap, uv * 1.0 + vec2(0.2));

          vec3 blue = uColor;
          float thickness = 0.0025;

          if (wireframe) {
            if (antialias) {
              // this will be our signed distance for the wireframe edge
              float d = min(min(vbc.x, vbc.y), vbc.z);
              // compute the anti-aliased stroke edge
              float edge = 1.0 - aastep(thickness, d);
              // now compute the final color of the mesh
              vec3 lineColor = vec3(1.0, 0.0, 1.0);
              vec3 fillColor = vec3(0.0, 1.0, 1.0);

              gl_FragColor = vec4(mix(fillColor, lineColor, edge), 1.0);
            } else {
              if (vbc.x < thickness || vbc.y < thickness || vbc.z < thickness) {
                gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
              } else {
                gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
              }
            }
          } else {
            float depth = gl_FragCoord.z / gl_FragCoord.w;
            float fogFactor = smoothstep(fogNear, fogFar, depth);

            gl_FragColor = vec4(blue + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
          }

        }`,


  vertexShaderXXX:`
    #define SCALE 10.0

    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    uniform float uTime;

    float calculateSurface(float x, float z) {
      float time = uTime / 1000.0;
      float y = 0.0;
      y += (sin(x * 1.0 / SCALE + time * 1.0) + sin(x * 2.3 / SCALE + time * 1.5) + sin(x * 3.3 / SCALE + time * 0.4)) / 3.0;
      y += (sin(z * 0.2 / SCALE + time * 1.8) + sin(z * 1.8 / SCALE + time * 1.8) + sin(z * 2.8 / SCALE + time * 0.8)) / 3.0;
      return y;
    }

    void main() {
      vDistanceBarycenter = barycentric;
      vec3 animatedPosition = position;

      float strength = 1.0;
      animatedPosition.y += strength * calculateSurface(position.x, position.z);
      animatedPosition.y -= strength * calculateSurface(0.0, 0.0);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
    }
  `,

  fragmentShaderXXX:`
    uniform vec3 uColor;
    varying vec3 vDistanceBarycenter;

    // This is like
    float aastep (float threshold, float dist) {
      float afwidth = fwidth(dist) * 0.5;
      return smoothstep(threshold - afwidth, threshold + afwidth, dist);
    }

    void main() {
      vec3 blue = uColor;
      float thickness = 0.015;

      // this will be our signed distance for the wireframe edge
      float d = min(min(vDistanceBarycenter.x, vDistanceBarycenter.y), vDistanceBarycenter.z);
      // compute the anti-aliased stroke edge
      float edge = 1.0 - aastep(thickness, d);
      // now compute the final color of the mesh
      vec4 lineColor = vec4(0.1, 0.1, 0.1, 1.0);
      vec4 fillColor = vec4(1.0, 1.0, 1.0, 1.0);

      gl_FragColor = vec4(mix(fillColor, lineColor, edge));
    }`,

  init: function () {
    var unindexBufferGeometry = this.el.sceneEl.systems.water.unindexBufferGeometry;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(1000, 1000, 20, 20);
    geometry.rotateX(-Math.PI / 2);
    unindexBufferGeometry(geometry);
    this.initShader();
    this.mesh = new THREE.Mesh(geometry, this.shader);
    this.el.setObject3D('mesh', this.mesh)
  },

  play: function () {
    this.startTime = undefined;
  },

  initShader: function () {
    var calculateBarycenters = this.el.sceneEl.systems.water.calculateBarycenters;
    var baryCenters = calculateBarycenters(this.geometry);
    var uniforms = {
      uMap: {type: 't', value: null},
      uTime: {type: 'f', value: 0},
      uColor: {type: 'f', value: new THREE.Color('#0065a7')},
      fogColor:    { type: "c", value: 'red' },
      fogNear:     { type: "f", value: 1 },
      fogFar:      { type: "f", value: 100 }
    };

    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      fog: false
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('water.png', function (texture) {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.REPEAT_WRAPPING;
    });
  },

  tick: function (time) {
    var scene = this.el.sceneEl.object3D;
    var target = new THREE.Vector3(0, -5, 0);
    var startTime = this.startTime = this.startTime || time;
    this.shader.uniforms.uTime.value = time - startTime;

    this.shader.uniforms.fogColor.value = scene.fog.color;
    this.shader.uniforms.fogNear.value = scene.fog.near;
    this.shader.uniforms.fogFar.value = scene.fog.far;
  }
});