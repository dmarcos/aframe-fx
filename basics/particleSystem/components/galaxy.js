AFRAME.registerComponent('galaxy', {
  schema: {
    particlesNumber: {default: 14000},
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
    var a = 0.10;
    //var b = 0.025;
    var b = 0.025;

    var particlesNumber = this.data.particlesNumber;
    var layers = 28;
    var particlesPerLayer = particlesNumber / layers;

    var geometry = this.initQuadGeometry();
    var shader = this.initQuadShader();
    var mesh = this.instancedMesh = new THREE.InstancedMesh(geometry, shader, particlesNumber);
    var pivot;
    var layerRotation = -Math.PI / 3;
    var initialParticlePosition;
    var randomA;
    var randomB;
    this.particlesInfo = [];

    for (var i = 0; i < layers; i++) {
      pivot = new THREE.Object3D();
      pivot.position.set(0, 0.5, 0);
      pivot.rotation.set(0, 0, -layerRotation);
      pivot.updateMatrixWorld();
      for (var j = 0; j < particlesPerLayer; j++) {
        initialParticlePosition = 2 * Math.PI * Math.random();
        randomA = Math.random() < 0.5 ? Math.random() * 0.01 : -Math.random() * 0.01;
        randomB = Math.random() < 0.5 ? Math.random() * 0.01 : -Math.random() * 0.01;
        this.initParticle(a + randomA, b + randomB, initialParticlePosition, pivot);
      }

      layerRotation += Math.PI / 20.0;
      a += 0.01;
      b += 0.01;
    }

    this.el.setObject3D('particleInstanced', mesh);
  },

  initParticle: function(a, b, angle, pivot) {
    var mesh;
    var particleInfo = {};
    var sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;

    particleInfo.a = a;
    particleInfo.b = b;
    particleInfo.object3D = new THREE.Object3D();
    pivot.add(particleInfo.object3D);
    particleInfo.angle = angle;
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
      particleInfo.object3D.position.y = particleInfo.b * Math.cos(particleInfo.angle);
      particleInfo.object3D.position.x = particleInfo.a * Math.sin(particleInfo.angle);;
      particleInfo.angle -= 2 * Math.PI / 500;
      this.visibleAttribute.setX(i, 1.0);
      particleInfo.object3D.updateMatrixWorld(true);
      this.instancedMesh.setMatrixAt(i, particleInfo.object3D.matrixWorld);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
  },

  update: function (oldData) {
    if (oldData.src !== this.data.src) { this.loadQuadImage(); }
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