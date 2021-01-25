AFRAME.registerComponent('cloud', {
  schema: {startTime: {default: 0}},

  vertexShader:`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D uMapShape;
    uniform sampler2D uMapNoise;
    uniform float uTime;

    vec4 gammaCorrect(vec4 color, float gamma){
      return pow(color, vec4(1.0 / gamma));
    }

    vec4 levelRange(vec4 color, float minInput, float maxInput){
      return min(max(color - vec4(minInput), vec4(0.0)) / (vec4(maxInput) - vec4(minInput)), vec4(1.0));
    }

    vec4 levels(vec4 color, float minInput, float gamma, float maxInput){
      return gammaCorrect(levelRange(color, minInput, maxInput), gamma);
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    float mod289(float x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    float permute(float x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float taylorInvSqrt(float r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec4 grad4(float j, vec4 ip)
    {
      const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
      vec4 p,s;

      p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
      p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
      s = vec4(lessThan(p, vec4(0.0)));
      p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

      return p;
    }

    // (sqrt(5) - 1)/4 = F4, used once below
    #define F4 0.309016994374947451

    float snoise4D(vec4 v)
    {
      const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                            0.276393202250021,  // 2 * G4
                            0.414589803375032,  // 3 * G4
                           -0.447213595499958); // -1 + 4 * G4

      // First corner
      vec4 i  = floor(v + dot(v, vec4(F4)) );
      vec4 x0 = v -   i + dot(i, C.xxxx);

      // Other corners

      // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
      vec4 i0;
      vec3 isX = step( x0.yzw, x0.xxx );
      vec3 isYZ = step( x0.zww, x0.yyz );

      //  i0.x = dot( isX, vec3( 1.0 ) );
      i0.x = isX.x + isX.y + isX.z;
      i0.yzw = 1.0 - isX;

      //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
      i0.y += isYZ.x + isYZ.y;
      i0.zw += 1.0 - isYZ.xy;
      i0.z += isYZ.z;
      i0.w += 1.0 - isYZ.z;

      // i0 now contains the unique values 0,1,2,3 in each channel
      vec4 i3 = clamp( i0, 0.0, 1.0 );
      vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
      vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

      //  x0 = x0 - 0.0 + 0.0 * C.xxxx
      //  x1 = x0 - i1  + 1.0 * C.xxxx
      //  x2 = x0 - i2  + 2.0 * C.xxxx
      //  x3 = x0 - i3  + 3.0 * C.xxxx
      //  x4 = x0 - 1.0 + 4.0 * C.xxxx
      vec4 x1 = x0 - i1 + C.xxxx;
      vec4 x2 = x0 - i2 + C.yyyy;
      vec4 x3 = x0 - i3 + C.zzzz;
      vec4 x4 = x0 + C.wwww;

      // Permutations
      i = mod289(i);
      float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
      vec4 j1 = permute( permute( permute( permute (
                 i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
               + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
               + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
               + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

      // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
      // 7*7*6 = 294, which is close to the ring size 17*17 = 289.
      vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

      vec4 p0 = grad4(j0,   ip);
      vec4 p1 = grad4(j1.x, ip);
      vec4 p2 = grad4(j1.y, ip);
      vec4 p3 = grad4(j1.z, ip);
      vec4 p4 = grad4(j1.w, ip);

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      p4 *= taylorInvSqrt(dot(p4,p4));

      // Mix contributions from the five corners
      vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
      vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
      m0 = m0 * m0;
      m1 = m1 * m1;
      return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
                   + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

    }

    float snoise3D(vec3 v)
    {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //   x0 = x0 - 0.0 + 0.0 * C.xxx;
      //   x1 = x0 - i1  + 1.0 * C.xxx;
      //   x2 = x0 - i2  + 2.0 * C.xxx;
      //   x3 = x0 - 1.0 + 3.0 * C.xxx;
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

      // Permutations
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    float fbm3d(vec3 x, const in int it) {
      float v = 0.0;
      float a = 0.5;
      vec3 shift = vec3(100);

      for (int i = 0; i < 32; ++i) {
        if(i<it) {
          v += a * snoise3D(x);
          x = x * 2.0 + shift;
          a *= 0.5;
        }
      }
      return v;
    }

    void main() {
      vec2 newUv = vUv;
      float scaleFactor1 = 18.0;
      float timeFactor1 = 0.002;
      float strengthFactor1 = 0.04;

      float scaleFactor2 = 2.7;
      float timeFactor2 = 0.00015;
      float strengthFactor2 = 0.08;

      vec4 txtNoise1 = texture2D(uMapNoise, vec2(vUv.x + uTime * 0.0001, vUv.y - uTime * 0.00014)); // noise txt
      vec4 txtNoise2 = texture2D(uMapNoise, vec2(vUv.x - uTime * 0.00002, vUv.y + uTime * 0.000017 + 0.2)); // noise txt

      float noiseBig = fbm3d(vec3(vUv * scaleFactor1, uTime * timeFactor1), 4)+ 1.0 * 0.5;

      newUv += noiseBig * strengthFactor1;

      float noiseSmall = snoise3D(vec3(newUv * scaleFactor2, uTime * 1.0));
      newUv += noiseSmall * strengthFactor2;

      vec4 txtShape = texture2D(uMapShape, newUv);

      float alpha = levels((txtNoise1 + txtNoise2) * 0.6, 0.2, 0.4, 0.7).r;
      alpha *= txtShape.r;

      gl_FragColor = vec4(vec3(0.95,0.95,0.95), alpha);
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

    var positions = [
      -quadHalfSize, -quadHalfSize, 0.0, // bottom-left
       quadHalfSize, -quadHalfSize, 0.0, // bottom-right
      -quadHalfSize, quadHalfSize, 0.0, // top-left
       quadHalfSize, quadHalfSize, 0.0  // top-right
    ];

    var uvs = [
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ];

    // Counter-clockwise triangle winding.
    geometry.setIndex([
      3, 2, 0, // top-left triangle.
      0, 1, 3  // bottom-right triangle.
    ]);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, vertexCoordinateSize));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, uvCoordinateSize));

    wireframeSystem.unindexBufferGeometry(geometry);
    wireframeSystem.calculateBarycenters(geometry);
  },

  initShader: function() {
    var uniforms = {
      uMapShape: {type: 't', value: null},
      uMapNoise: {type: 't', value: null},
      uTime: {type: 'f', value: 0}
    };
    var shader = this.shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true
    });

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/cloudShape.jpg', function (texture) {
      shader.uniforms.uMapShape.value = texture;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.magFilfer = THREE.LinearFilter;
    });

    textureLoader.load('assets/cloudNoise.jpg', function (texture) {
      shader.uniforms.uMapNoise.value = texture;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.magFilfer = THREE.LinearFilter;
    });
  },

  tick: function (time) {
    this.shader.uniforms.uTime.value = this.data.startTime + time / 50000;
  }
});