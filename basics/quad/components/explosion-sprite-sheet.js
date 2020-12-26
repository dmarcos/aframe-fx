AFRAME.registerComponent('explosion-sprite-sheet', {
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
    }`,

  fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D uMap;
    // Sprite index in the grid.
    // 0 is the top left corner.
    // numOfFrames - 1 is the bottom right corner.
    uniform float uSpriteIndex;
    // Each sprite width and height in uv coordinates [0, 1]
    uniform float uSpriteWidth;
    uniform float uSpriteHeight;

    void main() {
      // Current sprite column in uv coordinates.
      float uMin = uSpriteIndex * uSpriteWidth;
      // We take the decimal part.
      // It represents the colum within the current row.
      uMin = uMin - floor(uMin);
      // End of current sprite column is the column coordinate + the size of one sprite.
      float uMax = uMin + uSpriteWidth;
      // Current sprite row in uv coordinates.
      // We take the integer part. We're interested in the row not the column.
      float vMin = floor(uSpriteIndex * uSpriteWidth);
      // We need to invert the y-coordinate because the uv origin (0, 0) is in the
      // bottom left and the first frame is in the top-left corner of the sprite sheet.
      vMin = 1.0 - vMin * uSpriteHeight - uSpriteHeight;
      // End of row is the row coordinate + the size of one sprite.
      float vMax = vMin + uSpriteHeight;

      vec4 color = texture2D(uMap, vUv);
      vec4 tintColor = vec4(1.0, 0.0, 0.0, 1.0);
      float tintAmount = 0.5;
      // We tint red if it's the UV coordinate falls
      // in the selected cell. We tint gray otherwise.
      if (vUv.x >= uMin && vUv.x < uMax &&
          vUv.y >= vMin && vUv.y < vMax) {
        tintColor = vec4(1.0, 0.0, 0.0, 1.0);
      } else {
        tintAmount = 0.02;
        tintColor = vec4(0.72, 0.72, 0.72, 1.0);
      }
      // Tint the texture value.
      gl_FragColor = mix(color, tintColor, tintAmount);
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