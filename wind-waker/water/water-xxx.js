AFRAME.registerComponent('water-v3', {
  vertexShader:`
    #define SCALE 10.0

    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    uniform float uTime;

    float calculateSurface(float x, float z) {
      float time = uTime / 1000.0;
      float y = 0.0;
      y += (sin(x * 1.0 / SCALE + time * 1.0) + sin(x * 2.3 / SCALE + time * 1.5) + sin(x * 3.3 / SCALE + time * 0.4)) / 3.0;
      y += (sin(z * 0.2 / SCALE + time * 1.8) + sin(z * 1.8 / SCALE + time * 1.8) + sin(z * 2.8 / SCALE + time * 0.8)) / 3.0;
      return y;
    }

    void main() {
      vDistanceBarycenter = barycentric;
      vec3 animatedPosition = position;

      float strength = 1.0;
      animatedPosition.y += strength * calculateSurface(position.x, position.z);
      animatedPosition.y -= strength * calculateSurface(0.0, 0.0);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
    }
  `,

  fragmentShader:`
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
    var unindexBufferGeometry = this.el.sceneEl.systems.water.unindexBufferGeometry;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(50, 50, 10, 10);
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
      uColor: {type: 'f', value: new THREE.Color('#0051da')},
      uTime: {type: 'f', value: 0}
    };
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    });
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    this.shader.uniforms.uTime.value = time - startTime;
  }
});