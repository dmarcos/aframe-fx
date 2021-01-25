AFRAME.registerComponent('particle-system-explosion', {
  schema: {
    on: {default: 'click'},
    particlesNumber: {default: 1000},
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.02},
    particleLifeTime: {default: 500},
    initialRadius: {default: 0.01},
    src: {type: 'map'},
    color: {default: 'white', type: 'color'}
  },
  vertexShader:`
    attribute float visible;
    attribute vec4 color;

    varying vec2 vUv;
    varying float vVisible;
    varying vec4 vColor;

    void main() {
      vUv = uv;
      vColor = color;
      vVisible = visible;
      vec4 mvPosition = instanceMatrix * vec4(position, 1.0);
      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,

  fragmentShader:`
    varying float vVisible;
    varying vec4 vColor;
    varying vec2 vUv;

    uniform sampler2D uMap;

    void main() {
      if (vVisible == 1.0) {
        gl_FragColor = texture2D(uMap, vUv) * vec4(vColor.xyzw);
      } else {
        discard;
      }

    }`,

  init: function () {
    var positionX;
    var positionY;
    var particlesNumber = this.data.particlesNumber;

    var geometry = this.initQuadGeometry();
    var shader = this.initQuadShader();
    var mesh = this.instancedMesh = new THREE.InstancedMesh(geometry, shader, particlesNumber);

    this.on = this.on.bind(this);

    this.quads = [];
    for (var i = 0; i < particlesNumber; i++) { this.addQuad(); }

    this.el.setObject3D('particleExplosion', mesh);
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
    var colors = Array(this.data.particlesNumber * 4).fill(0.0);

    var visibleAttribute = this.visibleAttribute = new THREE.InstancedBufferAttribute(new Float32Array(visible), 1);
    var colorAttribute = this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, uvCoordinateSize));
    geometry.setAttribute('visible', visibleAttribute);
    geometry.setAttribute('color', colorAttribute);

    return geometry;
  },

  tick: function (time, delta) {
    var geometry;
    var positions;
    var quad;

    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];

      if (!quad.isActive) { continue; }

      quad.particleLifeTime -= delta;

      if (quad.particleLifeTime < 0) {
        quad.particleLifeTime = 0;
        quad.isActive = false;
        this.visibleAttribute.setX(i, 0.0);
      }
      quad.gravitySpeed += 9.8 * (delta / 1000) / 100;
      quad.object3D.position.x += quad.velocityX;
      quad.object3D.position.y += quad.velocityY - quad.gravitySpeed * (delta / 1000);
      quad.opacity = quad.opacity * 0.98;

      quad.velocityX = quad.velocityX * 0.95;
      quad.velocityY = quad.velocityY * 0.95;
      this.colorAttribute.setW(i, quad.opacity);

      quad.object3D.updateMatrix();
      this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
  },

  update: function (oldData) {
    var data = this.data;
    if (oldData.src !== data.src) { this.loadQuadImage(); }
    if (data.on !== oldData.on) { this.updateEventListener(); }
    this.shader.uniforms.uColor.value = new THREE.Color(this.data.color);
  },

  updateEventListener: function () {
    var el = this.el;
    if (!el.isPlaying) { return; }
    this.removeEventListener();
    el.addEventListener(this.data.on, this.on);
  },

  removeEventListener: function () {
    var on = this.data.on;
    if (!on) { return; }
    this.el.removeEventListener(on, this.on);
  },

  on: function (evt) {
    var position = evt.detail && evt.detail.position || {x: 0, y: 0.5};
    var layers = 5 + Math.floor(Math.random()*3);
    var self = this;
    var delay = 50;
    var particleSpeed = this.data.particleSpeed;

    for (var i = 0; i < layers; i++) {
      setTimeout((function () {
        var speed = particleSpeed;
        return function () {
          self.startExplosion(position.x, position.y, speed);
        }
      })(), delay);
      particleSpeed = Math.pow(this.data.particleSpeed, (i*0.05 + 1));
    }
  },

  play: function () {
    this.updateEventListener();
  },

  startExplosion: function (x, y, particleSpeed) {
    var numberOfStars = 10 + Math.floor(Math.random()*10);
    var particlesCreated = 0;
    var sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
    var angle = sign * Math.random() * Math.PI * 2.0;
    var radius = this.data.initialRadius;
    var color;

    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];
      if (quad.isActive) { continue; }

      quad.isActive = true;
      quad.particleLifeTime = this.data.particleLifeTime;
      quad.gravitySpeed = 0;
      quad.angle = angle;
      quad.radius = radius;
      quad.object3D.position.x = x + radius * Math.cos(angle);
      quad.velocityX = particleSpeed * Math.cos(angle);

      quad.object3D.position.y = y + radius * Math.sin(angle);
      quad.velocityY = particleSpeed * Math.sin(angle);

      angle += 2 * (Math.PI / numberOfStars);

      quad.object3D.updateMatrix();

      color = new THREE.Color(this.data.color);
      quad.opacity = sign === 1 ? 1.0 : 0.6 + Math.random() * 0.4;

      this.colorAttribute.setX(i, color.r);
      this.colorAttribute.setY(i, color.g);
      this.colorAttribute.setZ(i, color.b);
      this.colorAttribute.setW(i, quad.opacity);

      this.visibleAttribute.setX(i, 1.0);
      this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
      particlesCreated++;
      if (particlesCreated === numberOfStars) { break; }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
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
      uMap: {type: 't', value: null},
      uColor: {type: 'v4', value: null}
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