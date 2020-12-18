AFRAME.registerComponent('water-v3', {
  vertexShader:`
    #define SCALE 0.2

    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    uniform float uTime;
    varying vec2 vUv;

    float calculateSurface(float x, float z) {
      float time = uTime / 1000.0;
      float y = 0.0;
      y += (sin(x * 1.0 / SCALE + time * 1.0) + sin(x * 2.3 / SCALE + time * 1.5) + sin(x * 3.3 / SCALE + time * 0.4)) / 150.0;
      y += (sin(z * 0.2 / SCALE + time * 1.8) + sin(z * 1.8 / SCALE + time * 1.8) + sin(z * 2.8 / SCALE + time * 0.8)) / 150.0;

      return y;
    }

    void main() {
      vDistanceBarycenter = barycentric;
      vec3 animatedPosition = position;

      float strength = 1.0;
      animatedPosition.y += strength * calculateSurface(position.x, position.z);
      animatedPosition.y -= strength * calculateSurface(0.0, 0.0);

      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
    }
  `,

  fragmentShader:`
    uniform sampler2D uMap;
    uniform float uTime;

    varying vec2 vUv;
    uniform vec3 uColor;
    varying vec3 vDistanceBarycenter;

    // This is like
    float aastep (float threshold, float dist) {
      float afwidth = fwidth(dist) * 0.5;
      return smoothstep(threshold - afwidth, threshold + afwidth, dist);
    }

    void main() {
      vec3 blue = uColor;
      float thickness = 0.015;
      float time = uTime / 50.0;
      float uvTime = uTime / 1000.0;

      vec2 uv = vUv * 10.0;

      uv.y += 0.01 * (sin(uv.x * 3.5 + uvTime * 0.35) + sin(uv.x * 4.8 + uvTime * 1.05) + sin(uv.x * 7.3 + uvTime * 0.45)) / 3.0;
      uv.x += 0.12 * (sin(uv.y * 4.0 + uvTime * 0.5) + sin(uv.y * 6.8 + uvTime * 0.75) + sin(uv.y * 11.3 + uvTime * 0.2)) / 3.0;
      uv.y += 0.12 * (sin(uv.x * 4.2 + uvTime * 0.64) + sin(uv.x * 6.3 + uvTime * 1.65) + sin(uv.x * 8.2 + uvTime * 0.45)) / 3.0;

      float tileIndex = floor(10.0 - uv.y) * 10.0 + floor(uv.x);
      float currentTile = mod(time, 100.0);

      vec4 tex1 = texture2D(uMap, uv * 1.0);
      vec4 tex2 = texture2D(uMap, uv * 1.0 + vec2(0.2));

      // this will be our signed distance for the wireframe edge
      float d = min(min(vDistanceBarycenter.x, vDistanceBarycenter.y), vDistanceBarycenter.z);
      // compute the anti-aliased stroke edge
      float edge = 1.0 - aastep(thickness, d);
      // now compute the final color of the mesh
      vec4 lineColor = vec4(0.1, 0.1, 0.1, 1.0);
      vec4 fillColor = vec4(1.0, 1.0, 1.0, 1.0);

      if (tileIndex > currentTile) {
        gl_FragColor = vec4(mix(fillColor, lineColor, edge));
      } else {
        gl_FragColor = vec4(blue + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
      }
    }`,

  init: function () {
    var unindexBufferGeometry = this.el.sceneEl.systems.water.unindexBufferGeometry;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(1, 1, 10, 10);
    geometry.rotateX(-Math.PI / 2);
    unindexBufferGeometry(geometry);
    this.initShader();
    this.mesh = new THREE.Mesh(geometry, this.shader);
    this.el.setObject3D('mesh', this.mesh)
  },

  play: function () {
    this.startTime = undefined;
  },

  initShader: function () {
    var calculateBarycenters = this.el.sceneEl.systems.water.calculateBarycenters;
    var baryCenters = calculateBarycenters(this.geometry);
    var uniforms = {
      uMap: {type: 't', value: null},
      uTime: {type: 'f', value: 0},
      uColor: {type: 'f', value: new THREE.Color('#0051da')}
    };

    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://cinemont.com/tutorials/zelda/water.png', function (texture) {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.REPEAT_WRAPPING;
    });
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    this.shader.uniforms.uTime.value = time - startTime;
  }
});