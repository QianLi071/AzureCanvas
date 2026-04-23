import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { MeshTransmissionMaterial } from '../futurecube/MeshTransmissionMaterial.js';
import gsap from 'gsap';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

class LaserTunnel {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        this.audioLoader = new THREE.AudioLoader();
        this.listener = new THREE.AudioListener();
        this.outsideSound = new THREE.Audio(this.listener);
        
        this.params = {
            tunnelRadius: 8,
            tunnelLength: 200,
            spiralTurns: 6,
            bloomStrength: 2.0,
            bloomRadius: 0.5,
            bloomThreshold: 0.2
        };

        this.loadingManager = new THREE.LoadingManager();
        this.isLoginSuccessful = false;
        this.currentTunnelZ = 0;
        this.tunnelSegments = [];
        this.lasers = [];
        this.cameraSpeed = 15;
        
        this.init();
    }

    async init() {
        this.setupLoadingManager();
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        await this.loadEnvironment();
        await this.setupAudio();
        this.setupPostProcessing();
        
        this.createMaterials();
        this.initTunnel();
        this.createLasers();
        this.createExit();
        
        this.addEventListeners();
        this.animate();

        // Register globally for login logic access
        window.laserTunnel = this;
    }

    setupLoadingManager() {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal;
            if (window.Preloader) {
                window.Preloader.update(progress, `Loading: ${url.split('/').pop()}`);
            }
        };

        this.loadingManager.onLoad = () => {
            if (window.Preloader) {
                window.Preloader.complete();
            }
        };
    }

    async setupAudio(){
        this.audioLoader.load('../audios/login/login_loop.ogg', (buffer) => {
            this.outsideSound.setBuffer(buffer);
            this.outsideSound.setLoop(true);
            this.outsideSound.setVolume(1);
        });
        if (this.listener.context.state === 'suspended') {
            this.listener.context.resume();
        }

        if (this.outsideSound.buffer && !this.outsideSound.isPlaying) {
            this.outsideSound.play();
        }
    }

    async loadEnvironment() {
        const loader = new RGBELoader(this.loadingManager);
        const texture = await loader.loadAsync('../cube/hdr/spruit_sunrise_1k.hdr');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x020205, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.z = -50;
        this.scene.add(this.camera);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        this.cameraLight = new THREE.PointLight(0xff00ff, 15, 30);
        this.camera.add(this.cameraLight);
    }

    setupPostProcessing() {
        this.renderScene = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold
        );
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.bloomPass);
    }

    createMaterials() {
        const createMaterial = (color) => {
            const mat = new MeshTransmissionMaterial(6);
            mat.color = new THREE.Color(color);
            mat.emissive = new THREE.Color('#222222');
            mat.transmission = 0.95;
            mat.roughness = 0.05;
            mat.ior = 1.4;
            mat.thickness = 1.0;
            mat.specularIntensity = 1.5;
            mat.envMapIntensity = 2.0;
            mat.chromaticAberration = 0.1;
            mat.anisotrophicBlur = 0.1;
            mat.iridescence = 0.9;
            mat.iridescenceIOR = 0.8;
            return mat;
        };

        this.mats = [
            createMaterial('#ff33aa'),
            createMaterial('#33aaff'),
            createMaterial('#33ffff')
        ];
    }

    initTunnel() {
        this.tunnelGroup = new THREE.Group();
        this.scene.add(this.tunnelGroup);
        
        // Initial tunnel generation
        // for (let i = 0; i < 20; i++) {
        //     this.generateTunnelSegment();
        // }
    }

    generateTunnelSegment() {
        const segmentZ = this.currentTunnelZ;
        const segmentGroup = new THREE.Group();
        const pointsPerRing = 12;
        const radiusBases = [this.params.tunnelRadius, this.params.tunnelRadius * 1.4];

        radiusBases.forEach((radiusBase, layer) => {
            const t = Math.abs(segmentZ) / this.params.tunnelLength;
            const spiralAngle = t * Math.PI * 2 * this.params.spiralTurns + (layer * Math.PI);
            
            const ringPoints = [];
            for (let j = 0; j < pointsPerRing; j++) {
                const ringAngle = (j / pointsPerRing) * Math.PI * 2 + spiralAngle;
                const x = Math.cos(ringAngle) * radiusBase;
                const y = Math.sin(ringAngle) * radiusBase;
                ringPoints.push(new THREE.Vector3(x, y, segmentZ));
            }

            ringPoints.forEach((p, j) => {
                if (Math.random() > 0.4) {
                    const geometry = Math.random() > 0.5 ? 
                        new THREE.BoxGeometry(0.2, 0.2, 4) :
                        new THREE.CylinderGeometry(0.1, 0.1, 4, 4);
                    
                    const mat = this.mats[(Math.floor(Math.abs(segmentZ) / 5) + j + layer) % 3];
                    const mesh = new THREE.Mesh(geometry, mat);
                    mesh.position.copy(p);
                    mesh.lookAt(new THREE.Vector3(0, 0, segmentZ));
                    mesh.rotation.z += Math.random() * Math.PI;
                    segmentGroup.add(mesh);
                }

                if (Math.random() > 0.7) {
                    const nextP = ringPoints[(j + 1) % pointsPerRing];
                    const dist = p.distanceTo(nextP);
                    const strutGeo = new THREE.BoxGeometry(0.05, 0.05, dist);
                    const strutMat = this.mats[(j + layer) % 3];
                    const strut = new THREE.Mesh(strutGeo, strutMat);
                    strut.position.copy(p).add(nextP).multiplyScalar(0.5);
                    strut.lookAt(nextP);
                    segmentGroup.add(strut);
                }
            });
        });

        this.tunnelGroup.add(segmentGroup);
        this.tunnelSegments.push({ z: segmentZ, group: segmentGroup });
        this.currentTunnelZ -= 5; // Next segment Z
    }

    createLasers() {
        const laserGeo = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
        for (let i = 0; i < 30; i++) {
            const isPink = Math.random() > 0.5;
            const color = isPink ? 0xff00ff : 0x00ffff;
            const laserGroup = new THREE.Group();
            
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const core = new THREE.Mesh(laserGeo, coreMat);
            laserGroup.add(core);
            
            const glowGeo = new THREE.CylinderGeometry(0.15, 0.15, 11, 8);
            const glowMat = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            laserGroup.add(glow);

            this.resetLaser(laserGroup);
            this.scene.add(laserGroup);
            this.lasers.push(laserGroup);
        }
    }

    resetLaser(laser) {
        const radius = Math.random() * 6 + 2;
        const angle = Math.random() * Math.PI * 2;
        laser.position.x = Math.cos(angle) * radius;
        laser.position.y = Math.sin(angle) * radius;
        laser.position.z = this.camera.position.z - 200 - Math.random() * 200;
        laser.rotation.x = Math.PI / 2;
        laser.userData.speed = 3.0 + Math.random() * 5.0;
    }

    createExit() {
        this.exitGroup = new THREE.Group();
        const exitGeo = new THREE.CircleGeometry(20, 64);
        const exitMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        this.exit = new THREE.Mesh(exitGeo, exitMat);
        this.exitGroup.add(this.exit);
        
        for (let i = 1; i <= 3; i++) {
            const glowGeo = new THREE.CircleGeometry(20 + i * 10, 64);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3 / i,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = 0.1 * i;
            this.exitGroup.add(glow);
        }

        this.exitGroup.position.z = this.currentTunnelZ - 100;
        this.scene.add(this.exitGroup);
        
        this.exitLight = new THREE.PointLight(0xffffff, 50, 200);
        this.exitLight.position.copy(this.exitGroup.position);
        this.scene.add(this.exitLight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            gsap.to(this.camera.position, {
                x: x * 1.5,
                y: -y * 1.5,
                duration: 1.5,
                ease: 'power2.out'
            });
        });
    }

    stopGrowth() {
        this.isLoginSuccessful = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Continuous camera movement
        this.camera.position.z -= delta * this.cameraSpeed;
        this.camera.rotation.z = Math.sin(time * 0.1) * 0.05;

        // Generate new segments if not logged in
        if (!this.isLoginSuccessful) {
            if (this.currentTunnelZ > this.camera.position.z - 500) {
                this.generateTunnelSegment();
            }
            // Move exit with the tunnel
            if (this.exitGroup) {
                this.exitGroup.position.z = this.currentTunnelZ - 100;
                this.exitLight.position.z = this.currentTunnelZ - 100;
            }
        }

        // Memory Management: Remove segments behind camera
        for (let i = this.tunnelSegments.length - 1; i >= 0; i--) {
            const segment = this.tunnelSegments[i];
            if (segment.z > this.camera.position.z + 50) {
                this.tunnelGroup.remove(segment.group);
                segment.group.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                        else obj.material.dispose();
                    }
                });
                this.tunnelSegments.splice(i, 1);
            }
        }

        // Animate tunnel parts
        this.tunnelSegments.forEach((segment, i) => {
            segment.group.rotation.z = Math.sin(time * 0.2 + segment.z * 0.01) * 0.1;
            segment.group.children.forEach((mesh, j) => {
                if (mesh.material.uniforms && mesh.material.uniforms.time) {
                    mesh.material.uniforms.time.value = time;
                }
            });
        });

        // Update lasers
        this.lasers.forEach(laser => {
            laser.position.z += laser.userData.speed * 1.5;
            laser.scale.x = 1 + Math.sin(time * 15) * 0.3;
            laser.scale.z = 1 + Math.sin(time * 15) * 0.3;

            if (laser.position.z > this.camera.position.z + 50) {
                this.resetLaser(laser);
            }
        });

        this.composer.render();
    }
}

new LaserTunnel();