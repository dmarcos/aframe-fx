AFRAME.registerComponent('water-v2', {
  vertexShader:`
    #define SCALE 10.0

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
    #if __VERSION__ == 100
      #extension GL_OES_standard_derivatives : enable
    #endif

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
      float time = uTime / 1000.0;

      vec2 uv = vUv * 10.0;

      uv = vUv * 10.0 + vec2(time * -0.05);

      uv.y += 0.01 * (sin(uv.x * 3.5 + time * 0.35) + sin(uv.x * 4.8 + time * 1.05) + sin(uv.x * 7.3 + time * 0.45)) / 3.0;
      uv.x += 0.12 * (sin(uv.y * 4.0 + time * 0.5) + sin(uv.y * 6.8 + time * 0.75) + sin(uv.y * 11.3 + time * 0.2)) / 3.0;
      uv.y += 0.12 * (sin(uv.x * 4.2 + time * 0.64) + sin(uv.x * 6.3 + time * 1.65) + sin(uv.x * 8.2 + time * 0.45)) / 3.0;

      vec4 tex1 = texture2D(uMap, uv * 1.0);
      vec4 tex2 = texture2D(uMap, uv * 1.0 + vec2(0.2));

      gl_FragColor = vec4(blue + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
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