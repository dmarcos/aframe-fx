AFRAME.registerComponent('sprite-animation', {
  schema: {
    spriteWidth: {default: 256},
    spriteHeight: {default: 256},
    duration: {default: 1000}
  },
  vertexShader:`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform float uSpriteIndex;
    uniform float uSpriteWidth;
    uniform float uSpriteHeight;

    void main() {
      float u = uSpriteIndex * uSpriteWidth;
      u = u - floor(u);
      float v = floor(uSpriteIndex * uSpriteWidth);
      v = v * uSpriteHeight;
      vec2 uv = vec2(u + vUv.x * uSpriteWidth, 1.0 - (v + uSpriteHeight - vUv.y * uSpriteHeight));

      gl_FragColor = texture2D(uMap, uv);
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
    var self = this;
    var uniforms = {
      uMap: {type: 't', value: null},
      uSpriteIndex: {type: 'f', value: 0},
      uSpriteWidth: {type: 'f', value: 0},
      uSpriteHeight: {type: 'f', value: 0}
    };
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/explosion.png', function (texture) {
      var spriteHeight = self.data.spriteHeight;
      var spriteWidth = self.data.spriteWidth;
      var imageWidth = texture.image.width;
      var imageHeight = texture.image.height;
      shader.uniforms.uSpriteWidth.value = spriteWidth / imageWidth;
      shader.uniforms.uSpriteHeight.value = spriteHeight / imageHeight;
      shader.uniforms.uMap.value = texture;

      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.magFilfer = THREE.NearestFilter;
    });
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    var elapsedTime = time - this.startTime;
    var duration = this.data.duration;
    if (elapsedTime > duration) {
      elapsedTime = 0;
      this.startTime = time;
    }
    var spriteIndex = Math.floor((elapsedTime / duration) * 64);
    this.shader.uniforms.uSpriteIndex.value = spriteIndex;
  }
});