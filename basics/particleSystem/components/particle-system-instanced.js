AFRAME.registerComponent('particle-system-instanced', {
  schema: {
    particleRate: {default: 50},
    particlesNumber: {default: 1000},
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.005},
    particleLifeTime: {default: 1000},
    src: {type: 'map'}
  },
  vertexShader:`
    attribute float visible;
    varying vec2 vUv;
    varying float vVisible;

    void main() {
      vUv = uv;
      vVisible = visible;
      vec4 mvPosition = instanceMatrix * vec4( position, 1.0 );
      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,

  fragmentShader:`
    varying float vVisible;
    varying vec2 vUv;
    uniform sampler2D uMap;

    void main() {
      if (vVisible == 1.0) {
        gl_FragColor = texture2D(uMap, vUv);
      } else {
        discard;
      }

    }`,

  init: function () {
    var positionX;
    var positionY;
    var positionZ;
    var sign;
    var particlesNumber = this.data.particlesNumber;

    var geometry = this.initQuadGeometry();
    var shader = this.initQuadShader();
    var mesh = this.instancedMesh = new THREE.InstancedMesh(geometry, shader, particlesNumber);

    this.particlesInfo = [];
    for (var i = 0; i < particlesNumber; i++) {
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionX = sign * Math.random();
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionY = sign * Math.random();
      positionZ = 0.6 * Math.random();
      this.addParticle(positionX / 2, 1, -positionZ);
    }

    this.el.setObject3D('particleInstanced', mesh);
  },

  addParticle: function(x, y, z) {
    var mesh;
    var particleInfo = {};
    var sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;

    particleInfo.object3D = new THREE.Object3D();
    particleInfo.object3D.position.set(x, y, z);
    particleInfo.xPosition = x;
    particleInfo.xSpeed = sign * Math.random() * 0.0003;
    particleInfo.lifeTime = 0;
    this.particlesInfo.push(particleInfo);
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
    var positions;
    var particleInfo;
    var particleSpeed = this.data.particleSpeed;

    this.lastParticleDelta = this.lastParticleDelta || 0;
    this.lastParticleDelta += delta;
    for (var i = 0; i < this.particlesInfo.length; i++) {
      particleInfo = this.particlesInfo[i];
      particleInfo.particleLifeTime -= delta;

      // Reset and hide particle.
      if (particleInfo.particleLifeTime < 0) {
        particleInfo.particleLifeTime = 0;
        this.el.emit('particleended');
        this.visibleAttribute.setX(i, 0.0);
      }

      particleInfo.object3D.position.y -= particleSpeed;
      particleInfo.object3D.position.x += particleInfo.xSpeed;
      particleInfo.object3D.updateMatrix();
      this.instancedMesh.setMatrixAt(i, particleInfo.object3D.matrix);
    }

    // Emit a new particle
    if (this.lastParticleDelta > this.data.particleRate) {
      for (var i = 0; i < this.particlesInfo.length; i++) {
        particleInfo = this.particlesInfo[i];

        // Skip if the particle is in use.
        if (particleInfo.particleLifeTime) { continue; }

        particleInfo.particleLifeTime = this.data.particleLifeTime;
        particleInfo.object3D.position.y = 1;
        particleInfo.object3D.position.x = particleInfo.xPosition;
        particleInfo.object3D.updateMatrix();

        this.visibleAttribute.setX(i, 1.0);
        this.el.emit('particlestarted');
        this.instancedMesh.setMatrixAt(i, particleInfo.object3D.matrix);
        break;
      }
      this.lastParticleDelta = 0;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
  },

  update: function (oldData) {
    if (oldData.src !== this.data.src) { this.loadTextureImage(); }
  },

  loadTextureImage: function () {
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