AFRAME.registerComponent('particle-system-naive-wireframe', {
  schema: {
    particleRate: {default: 50},
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.005},
    particleLifeTime: {default: 1000},
  },

  vertexShader:`
    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    void main() {
      vDistanceBarycenter = barycentric;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    #if __VERSION__ == 100
      #extension GL_OES_standard_derivatives : enable
    #endif

    varying vec3 vDistanceBarycenter;

    // This is like
    float aastep (float threshold, float dist) {
      float afwidth = fwidth(dist) * 0.5;
      return smoothstep(threshold - afwidth, threshold + afwidth, dist);
    }

    void main() {
      float thickness = 0.05;
      // this will be our signed distance for the wireframe edge
      float d = min(min(vDistanceBarycenter.x, vDistanceBarycenter.y), vDistanceBarycenter.z);
      // compute the anti-aliased stroke edge
      float edge = 1.0 - aastep(thickness, d);
      // now compute the final color of the mesh
      vec4 lineColor = vec4(0.1, 0.1, 0.1, 1.0);
      vec4 fillColor = vec4(1.0, 1.0, 1.0, 1.0);
      gl_FragColor = vec4(mix(fillColor, lineColor, edge));
    }`,

  init: function () {
    var positionX;
    var positionY;
    var sign;
    this.quads = [];
    this.particles = [];
    this.positions = [];
    this.initQuadShader();
    for (var i = 0; i < 200; i++) {
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
    var wireframeSystem = this.el.sceneEl.systems.wireframe;

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

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    wireframeSystem.calculateBarycenters(geometry);

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

    // Emits a new particle.
    if (this.lastParticleDelta > this.data.particleRate) {
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

  initQuadShader: function() {
    var shader = this.shader = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
  }
});