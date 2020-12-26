AFRAME.registerComponent('quad-wireframe', {
  vertexShader:`
    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    void main() {
      vDistanceBarycenter = barycentric;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    varying vec3 vDistanceBarycenter;

    // This is like
    float aastep (float threshold, float dist) {
      float afwidth = fwidth(dist) * 0.5;
      return smoothstep(threshold - afwidth, threshold + afwidth, dist);
    }

    void main() {
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

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    wireframeSystem.calculateBarycenters(geometry);
  },

  initShader: function() {
    var shader = this.shader = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
  }
});