const vertexShader = `
varying vec2 vUv;

void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform float uTime;

void main() {
float len = 0.15;
float falloff = 0.1;
float p = mod(uTime * 0.25, 1.0);
float alpha = smoothstep(len, len - falloff, abs(vUv.x - p));
float width = smoothstep(len * 2.0, 0.0, abs(vUv.x - p)) * 0.5;
alpha *= smoothstep(width, width - 0.3, abs(vUv.y - 0.5));

alpha *= smoothstep(0.5, 0.3, abs(p - 0.5) * (1.0 + len));

gl_FragColor.rgb = vec3(1.0);
gl_FragColor.a = alpha;
//        gl_FragColor.a += 0.1;
}
`;

{
    let _renderer, _scene, _camera, _controls;
    let _geometry;
    let _shaders = [];

    window.onload = init;

    function init() {
        initWorld();
        initScene();
    }

    //=====// World //========================================//

    function initWorld() {
        _renderer = new THREE.WebGLRenderer();
        _renderer.setPixelRatio(2);
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.setClearColor(0x2e2f27);
        document.body.appendChild(_renderer.domElement);

        _scene = new THREE.Scene();

        _camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        _camera.position.set(0, 4, 15);
        _camera.target = new THREE.Vector3(0, 1, 0);

        _controls = new THREE.OrbitControls(_camera, document.body);
        _controls.target = _camera.target;
        _controls.enableDamping = true;
        _controls.dampingFactor = 0.1;
        _controls.rotateSpeed = 0.1;

        window.addEventListener('resize', resize, false);
        resize();
        requestAnimationFrame(render);
    }

    function resize() {
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _camera.aspect = window.innerWidth / window.innerHeight;
        _camera.updateProjectionMatrix();
    }

    function render() {
        requestAnimationFrame(render);
        if (_controls) _controls.update();
        _renderer.render(_scene, _camera);
    }

    //=====// Scene //========================================//

    function initScene() {
        initGeometry();
        for (let i = 0; i < 6; i++) initMesh();
        requestAnimationFrame(loop);
    }

    function createSpiral() {
        let points = [];
        let r = 8;
        let a = 0;
        for (let i = 0; i < 120; i++) {
            let p = (1 - i / 120);
            r -= Math.pow(p, 2) * 0.187;
            a += 0.3 - (r / 6) * 0.2;

            points.push(new THREE.Vector3(
                r * Math.sin(a),
                Math.pow(p, 2.5) * 2,
                r * Math.cos(a)
            ));
        }
        return points;
    }

    function initGeometry() {
        const points = createSpiral();

        // Create the flat geometry
        const geometry = new THREE.BufferGeometry();

        // create two times as many vertices as points, as we're going to push them in opposing directions to create a ribbon
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(points.length * 3 * 2), 3));
        geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(points.length * 2 * 2), 2));
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(points.length * 6), 1));

        points.forEach((b, i) => {
            let o = 0.1;

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

        _geometry = geometry;
    }

    function initMesh() {
        const uniforms = {
            uTime: {type: 'f', value: Math.random() * 3},
        };

        let shader = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
        });
        shader.speed = Math.random() * 0.4 + 0.8;
        _shaders.push(shader);

        let mesh = new THREE.Mesh(_geometry, shader);
        mesh.rotation.y = Math.random() * 10;
        mesh.scale.setScalar(0.5 + Math.random());
        mesh.scale.y = Math.random() * 0.2 + 0.9;
        mesh.position.y = Math.random();
        _scene.add(mesh);
    }

    let lastTime = 0;
    function loop(e) {
        requestAnimationFrame(loop);
        _scene.rotation.y += 0.02;

        let delta = e - lastTime;
        _shaders.forEach(shader => {
            shader.uniforms.uTime.value += delta * 0.001 * shader.speed;
        });
        lastTime = e;
    }
}