AFRAME.registerComponent('sprite-strip', {
  vertexShader:`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,

  fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform float uSpriteIndex;

    void main() {
      vec4 color = texture2D(uMap, vUv);
      vec4 tintColor = vec4(1.0, 0.0, 0.0, 1.0);
      float tintAmount = 0.0;
      float uMin = uSpriteIndex * 1.0 / 3.0;
      float uMax = uMin + 1.0 / 3.0;
      if (vUv.x >= uMin && vUv.x <= uMax) {
        tintAmount = 0.5;
      }
      color = mix(color, tintColor, tintAmount);
      gl_FragColor = vec4(color.rgb, 1.0);
    }`,

  init: function () {
    var mesh;
    this.initGeometry();
    this.initShader();

    mesh = new THREE.Mesh(this.geometry, this.shader);
    this.el.setObject3D('mesh', mesh);
  },

  initGeometry: function () {
    var geometry = this.geometry = new THREE.BufferGeometry();
    var vertexCoordinateSize = 3; // 3 floats to represent x,y,z coordinates.
    var uvCoordinateSize = 2; // 2 float to represent u,v coordinates.
    var quadSize = 0.8;
    var quadHalfSize = quadSize / 2.0;
    var wireframeSystem = this.el.sceneEl.systems.wireframe;

    var positions = [
      -quadHalfSize, -quadHalfSize, 0.0, // bottom-left
       quadHalfSize, -quadHalfSize, 0.0, // bottom-right
      -quadHalfSize, quadHalfSize, 0.0, // top-left
       quadHalfSize, quadHalfSize, 0.0  // top-right
    ];

    var uvs = [
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ];

    // Counter-clockwise triangle winding.
    geometry.setIndex([
      3, 2, 0, // top-left triangle.
      0, 1, 3  // bottom-right triangle.
    ]);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, uvCoordinateSize));

    wireframeSystem.unindexBufferGeometry(geometry);
    wireframeSystem.calculateBarycenters(geometry);
  },

  initShader: function() {
    var uniforms = {
      uMap: {type: 't', value: null},
      uSpriteIndex: {type: 'f', value: 0}
    };
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/mario-sprite.png', function (texture) {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.REPEAT_WRAPPING;
      texture.magFilfer = THREE.NearestFilter;
    });
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    var elapsedTime = time - this.startTime;
    var spriteIndex = Math.floor((elapsedTime / 500) % 3);
    this.shader.uniforms.uSpriteIndex.value = spriteIndex;
  }
});