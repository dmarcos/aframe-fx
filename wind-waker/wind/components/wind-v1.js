AFRAME.registerComponent('wind-v1', {
  vertexShader:`
    varying vec2 vUv;

    attribute vec3 barycentric;
    varying vec3 vDistanceBarycenter;

    void main() {
      vUv = uv;
      vDistanceBarycenter = barycentric;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    uniform float uTime;

    varying vec2 vUv;
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

  createSpiral: function(pointsNumber) {
    var points = [];
    var r = 8;
    var a = 0;
    for (var i = 0; i < pointsNumber; i++) {
      var p = (1 - i / pointsNumber);
      r -= Math.pow(p, 2) * 0.187;
      a += 0.3 - (r / 6) * 0.2;

      /*points.push(new THREE.Vector3(
        r * Math.sin(a),
        Math.pow(p, 2.5) * 2,
        r * Math.cos(a)
      ));*/

      points.push(new THREE.Vector3(
        r * Math.sin(a),
        1.0,
        r * Math.cos(a)
      ));
      console.log("POINT " + r * Math.sin(a) + " " + Math.pow(p, 2.5) * 2  + " " + r * Math.cos(a));
    }
    return points;
  },

  initGeometry: function() {
    var points = this.createSpiral(120);
    // Create the flat geometry
    var geometry = this.geometry = new THREE.BufferGeometry();

    // create two times as many vertices as points, as we're going to push them in opposing directions to create a ribbon
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(points.length * 3 * 2), 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(points.length * 2 * 2), 2));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(points.length * 6), 1));

    points.forEach((b, i) => {
      var o = 0.1;

      geometry.attributes.position.setXYZ(i * 2 + 0, b.x, b.y + o, b.z);
      geometry.attributes.position.setXYZ(i * 2 + 1, b.x, b.y - o, b.z);

      geometry.attributes.uv.setXY(i * 2 + 0, i / (points.length - 1), 0);
      geometry.attributes.uv.setXY(i * 2 + 1, i / (points.length - 1), 1);

      if (i < points.length - 1) {
        geometry.index.setX(i * 6 + 0, i * 2);
        geometry.index.setX(i * 6 + 1, i * 2 + 1);
        geometry.index.setX(i * 6 + 2, i * 2 + 2);

        geometry.index.setX(i * 6 + 0 + 3, i * 2 + 1);
        geometry.index.setX(i * 6 + 1 + 3, i * 2 + 3);
        geometry.index.setX(i * 6 + 2 + 3, i * 2 + 2);
      }
    });

    var calculateBarycenters = this.el.sceneEl.systems.wireframe.calculateBarycenters;
    calculateBarycenters(this.geometry);
  },

  initShader: function() {
    var uniforms = {
      uTime: {type: 'f', value: Math.random() * 3},
    };

    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
    });
    shader.speed = Math.random() * 0.4 + 0.8;
  }
})