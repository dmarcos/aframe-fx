AFRAME.registerComponent('particle-system-shell', {
  schema: {
    particlesNumber: {default: 100},
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.02},
    particleLifeTime: {default: 500},
    src: {type: 'map'}
  },
  vertexShader:`
    attribute float visible;
    varying vec2 vUv;
    varying float vVisible;

    void main() {
      vUv = uv;
      vVisible = visible;
      vec4 mvPosition = instanceMatrix * vec4(position, 1.0);
      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,

  fragmentShader:`
    varying float vVisible;
    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform vec3 uColor;

    void main() {
      if (vVisible == 1.0) {
        gl_FragColor = texture2D(uMap, vUv) * vec4(1.0, 1.0, 1.0, 1.0);
      } else {
        discard;
      }

    }`,

  init: function () {
    var positionX;
    var positionY;
    var sign;
    var particlesNumber = this.data.particlesNumber;

    var geometry = this.initQuadGeometry();
    var shader = this.initQuadShader();
    var mesh = this.instancedMesh = new THREE.InstancedMesh(geometry, shader, particlesNumber);

    this.quads = [];
    for (var i = 0; i < particlesNumber; i++) { this.addQuad(); }

    this.el.setObject3D('particleShell', mesh);
  },

  addQuad: function() {
    var quad = {};
    quad.object3D = new THREE.Object3D();
    quad.object3D.position.set(0, 0, 0);
    quad.lifeTime = 0;
    this.quads.push(quad);
  },

  initQuadGeometry: function () {
    var geometry = new THREE.BufferGeometry();
    var vertexCoordinateSize = 3; // 3 floats to represent x,y,z coordinates.

    var quadSize = this.data.particleSize;
    var quadHalfSize = quadSize / 2.0;

    var uvCoordinateSize = 2; // 2 float to represent u,v coordinates.
    // No indexed
    var positions = [
      // Top left triangle
      quadHalfSize, quadHalfSize, 0.0,
      -quadHalfSize, quadHalfSize, 0.0,
      -quadHalfSize, -quadHalfSize, 0.0,
      // Bottom right triangle
      -quadHalfSize, -quadHalfSize, 0.0,
      quadHalfSize, -quadHalfSize, 0.0,
      quadHalfSize, quadHalfSize, 0.0
    ];

    var uvs = [
      1, 1,
      0, 1,
      0, 0,

      0, 0,
      1, 0,
      1, 1,
    ];

    var visible = Array(this.data.particlesNumber).fill(0.0);

    var visibleAttribute = this.visibleAttribute = new THREE.InstancedBufferAttribute(new Float32Array(visible), 1);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, uvCoordinateSize));
    geometry.setAttribute('visible', visibleAttribute);
    return geometry;
  },

  tick: function (time, delta) {
    var geometry;
    var quad;

    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];

      if (!quad.isActive) { continue; }

      quad.particleLifeTime -= delta;

      if (quad.particleLifeTime < 0) {
        quad.particleLifeTime = 0;
        quad.isActive = false;
        this.el.emit('particleended', {
          position: {
            x: quad.object3D.position.x,
            y: quad.object3D.position.y
          }
        });
        this.visibleAttribute.setX(i, 0.0);
      }

      quad.object3D.position.y += this.data.particleSpeed;
      quad.object3D.updateMatrix();
      this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
  },

  update: function (oldData) {
    var data = this.data;
    if (oldData.src !== data.src) { this.loadQuadImage(); }
  },

  startShell: function (x, y) {
    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];
      if (quad.isActive) { continue; }

      quad.isActive = true;
      quad.particleLifeTime = this.data.particleLifeTime;
      quad.object3D.position.x = x;
      quad.object3D.position.y = y;
      quad.object3D.updateMatrix();

      this.visibleAttribute.setX(i, 1.0);
      this.el.emit('particlestarted');
      this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
      break;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
  },

  loadQuadImage: function () {
    var src = this.data.src;
    var self = this;
    this.el.sceneEl.systems.material.loadTexture(src, {src: src}, function textureLoaded (texture) {
      self.el.sceneEl.renderer.initTexture(texture);
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.magFilfer = THREE.LinearFilter;
      self.shader.uniforms.uMap.value = texture;
    });
  },

  initQuadShader: function() {
    var uniforms = {
      uMap: {type: 't', value: null}
    };
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true
    });
    return shader;
  }
});