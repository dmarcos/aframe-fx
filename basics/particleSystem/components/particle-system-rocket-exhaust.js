AFRAME.registerComponent('particle-system-rocket-exhaust', {
  schema: {
    particlesNumber: {default: 100},
    particleSize: {default: 0.1},
    particleSpeed: {default: 0.005},
    particleLifeTime: {default: 1000},
    src: {type: 'map'},
    color: {default: 'white', type: 'color'},
    endColor: {default: 'white', type: 'color'},
    modulate: {default: false}
  },

  multiple: true,

  vertexShader:`
    attribute float visible;
    attribute vec4 color;

    varying vec2 vUv;
    varying float vVisible;
    varying vec4 vColor;

    void main() {
      vUv = uv;
      vVisible = visible;
      vColor = color;

      vec4 mvPosition = instanceMatrix * vec4( position, 1.0 );
      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,

  fragmentShader:`
    varying float vVisible;
    varying vec2 vUv;
    varying vec4 vColor;
    uniform sampler2D uMap;
    uniform vec3 uColor;

    void main() {
      if (vVisible == 1.0) {
        gl_FragColor = texture2D(uMap, vUv)* vec4(vColor.xyz, 0.4);
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
    for (var i = 0; i < particlesNumber; i++) {
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionX = sign * Math.random();
      sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
      positionY = sign * Math.random();
      this.addQuad(0, 1, 0);
    }

    this.el.setObject3D('particleInstanced' + this.attrName, mesh);
  },

  addQuad: function(x, y, z) {
    var mesh;
    var quad = {};

    quad.object3D = new THREE.Object3D();
    quad.object3D.position.set(x, y, z);
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
    var color = Array(this.data.particlesNumber*4).fill(0.0);

    var visibleAttribute = this.visibleAttribute = new THREE.InstancedBufferAttribute(new Float32Array(visible), 1);
    var colorAttribute = this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(color), 4);

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
    var particleSpeed = this.data.particleSpeed;

    this.lastParticleDelta = this.lastParticleDelta || 0;
    this.lastParticleDelta += delta;
    for (var i = 0; i < this.quads.length; i++) {
      quad = this.quads[i];
      quad.particleLifeTime -= delta;

      if (quad.particleLifeTime < 0) {
        quad.particleLifeTime = 0;
        this.visibleAttribute.setX(i, 0.0);
      }

      if (quad.particleLifeTime) {
        if (this.data.modulate) {
          quad.object3D.scale.x = 0.8 * (quad.particleLifeTime / this.data.particleLifeTime)  * (1 + Math.sin(2 * Math.PI * 8 * (quad.particleLifeTime / 1000)));
        } else {
          quad.lerpColor.lerp(this.endColor, 1 - (quad.particleLifeTime / this.data.particleLifeTime));
          this.colorAttribute.setX(i, quad.lerpColor.r);
          this.colorAttribute.setY(i, quad.lerpColor.g);
          this.colorAttribute.setZ(i, quad.lerpColor.b);
          quad.lerpColor = this.startColor.clone();
        }
      }

      quad.object3D.position.y -= particleSpeed;
      quad.object3D.updateMatrix();
      this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
    }

    if (this.lastParticleDelta > 40) {
      for (var i = 0; i < this.quads.length; i++) {
        quad = this.quads[i];
        if (quad.particleLifeTime) { continue; }

        this.velocityAttribute
        quad.particleLifeTime = this.data.particleLifeTime;
        quad.lerpColor = this.startColor.clone();
        quad.object3D.position.y = 1;
        quad.object3D.updateMatrix();

        this.visibleAttribute.setX(i, 1.0);

        this.colorAttribute.setX(i, this.startColor.r);
        this.colorAttribute.setY(i, this.startColor.g);
        this.colorAttribute.setZ(i, this.startColor.b);
        this.colorAttribute.needsUpdate = true;
        this.instancedMesh.setMatrixAt(i, quad.object3D.matrix);
        break;
      }
      this.lastParticleDelta = 0;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.visibleAttribute.needsUpdate = true;
  },

  update: function (oldData) {
    if (oldData.src !== this.data.src) { this.loadQuadImage(); }
    this.startColor = new THREE.Color(this.data.color);
    this.endColor = new THREE.Color(this.data.endColor);
    this.shader.uniforms.uColor.value = this.startColor;
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
      uColor: {type: 'v3', value: new THREE.Vector3()}
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