AFRAME.registerComponent('particle-system-naive', {
  schema: {
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.005},
    particleLifeTime: {default: 1000},
    src: {type: 'map'}
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

    void main() {
      gl_FragColor = texture2D(uMap, vUv);
    }`,

  init: function () {
    var positionX;
    var positionY;
    var sign;
    this.quads = [];
    this.particles = [];
    this.positions = [];
    this.initQuadShader();
    for (var i = 0; i < 100; i++) {
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionX = sign * Math.random();
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionY = sign * Math.random();
      this.addQuad(positionX / 2, 1, 0);
    }
  },

  addQuad: function(x, y, z) {
    var mesh;
    var quad = {};
    var geometry = this.initQuadGeometry(x, y, quad);
    var mesh = new THREE.Mesh(geometry, this.shader);

    quad.mesh = mesh;
    quad.lifeTime = 0;

    this.quads.push(quad);
    mesh.visible = false;
    this.el.setObject3D('quad' + (this.quads.length - 1), mesh);
  },

  initQuadGeometry: function (x, y, quad) {
    var geometry = new THREE.BufferGeometry();
    var vertexCoordinateSize = 3; // 3 floats to represent x,y,z coordinates.

    var quadSize = this.data.particleSize;
    var quadHalfSize = quadSize / 2.0;

    var uvCoordinateSize = 2; // 2 float to represent u,v coordinates.
    // No indexed
    var positions = quad.positions = [
      // Top left triangle
      quadHalfSize + x, quadHalfSize + y, 0.0,
      -quadHalfSize + x, quadHalfSize + y, 0.0,
      -quadHalfSize + x, -quadHalfSize + y, 0.0,
      // Bottom right triangle
      -quadHalfSize + x, -quadHalfSize + y, 0.0,
      quadHalfSize + x, -quadHalfSize + y, 0.0,
      quadHalfSize + x, quadHalfSize + y, 0.0
    ];

    var uvs = [
      1, 1,
      0, 1,
      0, 0,

      0, 0,
      1, 0,
      1, 1,
    ];

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, uvCoordinateSize));

    return geometry;
  },

  tick: function (time, delta) {
    var geometry;
    var positions;
    var quad;
    var particleSpeed = this.data.particleSpeed;

    this.lastParticleDelta = this.lastParticleDelta || 0;
    this.lastParticleDelta += delta;
    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];
      geometry = quad.mesh.geometry;
      positions = geometry.attributes.position.array;
      if (!quad.mesh.visible) { continue; }

      positions[1] = positions[1] - particleSpeed;
      positions[4] = positions[4] - particleSpeed;
      positions[7] = positions[7] - particleSpeed;

      positions[10] = positions[10] - particleSpeed;
      positions[13] = positions[13] - particleSpeed;
      positions[16] = positions[16] - particleSpeed;

      quad.particleLifeTime -= delta;

      if (quad.particleLifeTime <= 0) { quad.mesh.visible = false }
      geometry.attributes.position.needsUpdate = true;
    }

    if (this.lastParticleDelta > 50) {
      for (var i = 0; i < this.quads.length; i++) {
        quad = this.quads[i];
        if (quad.mesh.visible) { continue; }
        quad.mesh.visible = true;
        positions = quad.mesh.geometry.attributes.position.array;
        positions[1] = quad.positions[1];
        positions[4] = quad.positions[4];
        positions[7] = quad.positions[7];

        positions[10] = quad.positions[10];
        positions[13] = quad.positions[13];
        positions[16] = quad.positions[16];
        quad.particleLifeTime = this.data.particleLifeTime;
        break;
      }
      this.lastParticleDelta = 0;
    }
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
    var uniforms = {uMap: {type: 't', value: null}};
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true
    });
  }
});