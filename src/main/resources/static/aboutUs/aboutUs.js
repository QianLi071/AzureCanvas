import * as THREE from 'three';

// --- 配置与数据 ---
const TEAM_DATA = [
    { name: "Alpha", position: "Lead Architect", bio: "Focuses on scalable cloud solutions and core engine performance optimization.", color: "#FF00FF" },
    { name: "Beta", position: "Frontend Master", bio: "Crafting immersive user experiences with cutting-edge CSS and Three.js.", color: "#00FFFF" },
    { name: "Gamma", position: "Data Scientist", bio: "Turning complex data into actionable insights through advanced ML models.", color: "#FFD700" },
    { name: "Delta", position: "Security Expert", bio: "Ensuring the integrity and safety of the AzureCanvas ecosystem.", color: "#FF6A00" },
    { name: "Epsilon", position: "Product Visionary", bio: "Bridging the gap between technology and user needs with innovative design.", color: "#00CFFF" }
];

class ImmersiveAbout {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.initLenis();
        this.initThree();
        this.addLights();
        this.createSpiral();
        this.createCards();
        this.createParticles();
        this.initEvents();
        this.animate();
    }

    initLenis() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);
    }

    createSpiral() {
        const points = [];
        for (let i = 0; i < 500; i++) {
            const angle = 0.1 * i;
            const x = (1 + angle) * Math.cos(angle) * 0.2;
            const y = -i * 0.05 + 10;
            const z = (1 + angle) * Math.sin(angle) * 0.2;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 200, 0.05, 8, false);
        
        this.spiralMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScroll: { value: 0 },
                uColorStart: { value: new THREE.Color('#FF6A00') },
                uColorEnd: { value: new THREE.Color('#00CFFF') }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vPos;
                void main() {
                    vUv = uv;
                    vPos = position.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uScroll;
                uniform vec3 uColorStart;
                uniform vec3 uColorEnd;
                varying vec2 vUv;
                varying float vPos;
                void main() {
                    float gradient = smoothstep(10.0, -15.0, vPos);
                    vec3 color = mix(uColorStart, uColorEnd, gradient);
                    float alpha = smoothstep(uScroll * -25.0 + 10.0, uScroll * -25.0 + 8.0, vPos);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        });

        this.spiral = new THREE.Mesh(geometry, this.spiralMaterial);
        this.scene.add(this.spiral);

        // 同步滚动到 Shader
        gsap.to(this.spiralMaterial.uniforms.uScroll, {
            scrollTrigger: {
                trigger: ".scroll-spacer",
                start: "top top",
                end: "bottom bottom",
                scrub: true
            },
            value: 1
        });
    }

    createCards() {
        this.cards = [];
        TEAM_DATA.forEach((data, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');

            // 绘制卡牌背景
            ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
            ctx.roundRect(0, 0, 512, 720, 40);
            ctx.fill();
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 4;
            ctx.stroke();

            // 绘制文本
            ctx.fillStyle = 'white';
            ctx.font = 'bold 60px Inter';
            ctx.fillText(data.name, 50, 450);
            ctx.fillStyle = data.color;
            ctx.font = '40px Inter';
            ctx.fillText(data.position, 50, 520);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '24px Inter';
            const words = data.bio.split(' ');
            let line = '';
            let y = 580;
            words.forEach(word => {
                if ((line + word).length > 30) {
                    ctx.fillText(line, 50, y);
                    line = word + ' ';
                    y += 35;
                } else {
                    line += word + ' ';
                }
            });
            ctx.fillText(line, 50, y);

            const texture = new THREE.CanvasTexture(canvas);
            const geometry = new THREE.PlaneGeometry(3.5, 5);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
            const card = new THREE.Mesh(geometry, material);

            // 初始位置：屏幕外
            card.position.set(i % 2 === 0 ? -15 : 15, 0, -10);
            card.rotation.set(Math.random(), Math.random(), Math.random());
            card.visible = false;

            this.scene.add(card);
            this.cards.push(card);

            // GSAP 动画：飞入、停留、飞出
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".scroll-spacer",
                    start: `${(i / 5) * 100}% top`,
                    end: `${((i + 1) / 5) * 100}% top`,
                    scrub: 1,
                    onToggle: self => card.visible = self.isActive
                }
            });

            tl.to(card.position, { x: i % 2 === 0 ? -4 : 4, y: 0, z: 0, ease: "none" })
              .to(card.rotation, { x: 0, y: i % 2 === 0 ? 0.3 : -0.3, z: 0, ease: "none" }, 0)
              .to(card.position, { x: i % 2 === 0 ? -20 : 20, y: 5, z: -10, ease: "none" }, 0.7)
              .to(card.rotation, { x: Math.random() * 2, y: Math.random() * 2, z: Math.random() * 2, ease: "none" }, 0.7);
        });
    }

    createParticles() {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

            const color = new THREE.Color(Math.random() > 0.5 ? '#FF00FF' : '#00FFFF');
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float uTime;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.5 + pos.x) * 0.5;
                    pos.x += cos(uTime * 0.5 + pos.y) * 0.5;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float d = distance(gl_PointCoord, vec2(0.5));
                    if (d > 0.5) discard;
                    gl_FragColor = vec4(vColor, 1.0 - d * 2.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 鼠标交互
        this.mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = performance.now() * 0.001;
        if (this.spiralMaterial) this.spiralMaterial.uniforms.uTime.value = time;
        if (this.particles) this.particles.material.uniforms.uTime.value = time;

        // 相机轻微跟随鼠标
        this.camera.position.x += (this.mouse.x * 2 - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// 启动
new ImmersiveAbout();
