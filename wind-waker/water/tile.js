AFRAME.registerComponent('tile', {
  vertexShader:`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    uniform vec3 uColor;
    uniform sampler2D uMap;
    varying vec2 vUv;

    void main() {
      vec4 tex1 = texture2D(uMap, vUv * 1.0);
      vec4 tex2 = texture2D(uMap, vUv * 1.0 + vec2(0.2));

      gl_FragColor = vec4(uColor + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
    }`,

  init: function () {
    var unindexBufferGeometry = this.el.sceneEl.systems.water.unindexBufferGeometry;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    unindexBufferGeometry(geometry);
    this.initShader();
    this.mesh = new THREE.Mesh(geometry, this.shader);
    this.el.setObject3D('mesh', this.mesh);
    this.el.object3D.rotation.set(Math.PI / 2, 0, 0);
  },

  initShader: function () {
    var calculateBarycenters = this.el.sceneEl.systems.water.calculateBarycenters;
    var baryCenters = calculateBarycenters(this.geometry);
    var uniforms = {
      uColor: {type: 'f', value: new THREE.Color('#0051da')},
      uMap: {type: 't', value: null}
    };

    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://cinemont.com/tutorials/zelda/water.png', function (texture) {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.REPEAT_WRAPPING;
    });
  }
});