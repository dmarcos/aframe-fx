AFRAME.registerComponent('water-v1', {
  vertexShader:`
    varying vec2 vUv;

    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    void main() {
      vUv = uv;
      vDistanceBarycenter = barycentric;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    uniform vec3 uColor;
    uniform sampler2D uMap;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vDistanceBarycenter;

    // This is like
    float aastep (float threshold, float dist) {
      float afwidth = fwidth(dist) * 0.5;
      return smoothstep(threshold - afwidth, threshold + afwidth, dist);
    }

    void main() {
      vec3 blue = uColor;
      float thickness = 0.015;
      float time = uTime / 50.0;

      vec2 uv = vUv * 10.0;
      float tileIndex = floor(10.0 - uv.y) * 10.0 + floor(uv.x);
      float currentTile = mod(time, 100.0);

      vec4 tex1 = texture2D(uMap, uv * 1.0);
      vec4 tex2 = texture2D(uMap, uv * 1.0 + vec2(0.2));

      // this will be our signed distance for the wireframe edge
      float d = min(min(vDistanceBarycenter.x, vDistanceBarycenter.y), vDistanceBarycenter.z);
      // compute the anti-aliased stroke edge
      float edge = 1.0 - aastep(thickness, d);
      // now compute the final color of the mesh
      vec4 lineColor = vec4(0.1, 0.1, 0.1, 1.0);
      vec4 fillColor = vec4(1.0, 1.0, 1.0, 1.0);

      if (tileIndex > currentTile) {
        gl_FragColor = vec4(mix(fillColor, lineColor, edge));
      } else {
        gl_FragColor = vec4(blue + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
      }
    }`,

  init: function () {
    var unindexBufferGeometry = this.el.sceneEl.systems.wireframe.unindexBufferGeometry;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(1, 1, 10, 10);
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
    var calculateBarycenters = this.el.sceneEl.systems.wireframe.calculateBarycenters;
    var baryCenters = calculateBarycenters(this.geometry);
    var uniforms = {
      uMap: {type: 't', value: null},
      uTime: {type: 'f', value: 0},
      uColor: {type: 'f', value: new THREE.Color('#0051da')
    }};

    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/water.png', function (texture) {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.REPEAT_WRAPPING;
    });
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    this.shader.uniforms.uTime.value = time - startTime;
  }
});