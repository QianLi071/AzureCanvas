import { gsap } from 'gsap';
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Text } from 'troika-three-text';

(function() {
    const authForm = document.getElementById('auth-form');
    const submitBtn = document.getElementById('submit-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const formTitle = document.getElementById('form-title');
    const rememberMeContainer = document.getElementById('remember-me-container');
    const avatarDialog = document.getElementById('avatar-dialog');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUpload = document.getElementById('avatar-upload');
    const activateBtn = document.getElementById('activate-account');
    const skipBtn = document.getElementById('skip-avatar');
    
    // Audio elements
    const errorAudio = new Audio('../audios/login/error.ogg');
    const accessGrantedAudio = new Audio('../audios/login/access_granted.ogg');
    const restoreBackupAudio = new Audio('../audios/login/restoring_from_backup.ogg');
    const initializingAudio = new Audio('../audios/login/Initializing_10s.ogg');
    const initiatingSimAudio = new Audio('../audios/login/Initiating_the_simulation.ogg');
    const activatingUserAudio = new Audio('../audios/login/activating_user_40s.ogg');

    let isRegisterMode = false;
    let selectedAvatarFile = null;

    // Helper to create 3D Text
    function create3DText(text, size, color, emissiveColor) {
        const myText = new Text();
        myText.text = text;
        myText.fontSize = size;
        myText.color = color;
        myText.font = '../fonts/Aeonik-Medium.woff2';
        myText.anchorX = 'center';
        myText.anchorY = 'middle';
        
        if (emissiveColor) {
            myText.material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0
            });
        }
        
        myText.sync();
        return myText;
    }

    // Toggle between Login and Register
    toggleAuthBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        
        if (isRegisterMode) {
            authForm.classList.add('register-mode');
            formTitle.innerText = 'CREATE ACCOUNT';
            submitBtn.innerText = 'SIGN UP';
            toggleAuthBtn.innerText = 'Back to Login';
            rememberMeContainer.style.display = 'none';
            
            // Add required attributes for register fields
            document.getElementById('email').required = true;
            document.getElementById('confirm-password').required = true;
        } else {
            authForm.classList.remove('register-mode');
            formTitle.innerText = 'AZURE CANVAS';
            submitBtn.innerText = 'ENTER SYSTEM';
            toggleAuthBtn.innerText = 'Create Account';
            rememberMeContainer.style.display = 'flex';
            
            // Remove required attributes
            document.getElementById('email').required = false;
            document.getElementById('confirm-password').required = false;
        }
    });

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (isRegisterMode) {
            const email = document.getElementById('email').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                handleLoginError('Passwords do not match');
                return;
            }

            handleRegister(username, email, password);
        } else {
            const rememberMe = document.getElementById('inputcheckbox').checked;
            handleLogin(username, password, rememberMe);
        }
    });

    async function handleLogin(username, password, rememberMe) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerText = 'AUTHENTICATING...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken() 
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    remember: rememberMe
                })
            });

            const data = await response.json();

            if (data.success) {
                window.notify.show('Login successful! Accessing system...', 'success');
                startSuccessSequence();
            } else {
                handleLoginError(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            handleLoginError('Connection error. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerText = isRegisterMode ? 'SIGN UP' : 'ENTER SYSTEM';
        }
    }

    async function handleRegister(username, email, password) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerText = 'CREATING ACCOUNT...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken()
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                window.notify.show('Account created successfully!', 'success');
                showAvatarDialog(username);
            } else {
                handleLoginError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            handleLoginError('Connection error. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerText = isRegisterMode ? 'SIGN UP' : 'ENTER SYSTEM';
        }
    }

    function showAvatarDialog(username) {
        // Form "fly out" to the right
        gsap.to(authForm, {
            x: 500,
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                authForm.style.display = 'none';
                
                // Set initial avatar
                const initial = username.charAt(0).toUpperCase();
                avatarPreview.innerText = initial;
                avatarPreview.style.background = 'linear-gradient(135deg, #ff00ff, #7000ff)';
                
                // Show dialog
                avatarDialog.style.display = 'flex';
                setTimeout(() => {
                    avatarDialog.classList.add('show');
                }, 10);
            }
        });
    }

    // Avatar upload handling
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                activateBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    skipBtn.addEventListener('click', () => {
        startSuccessSequence();
    });

    activateBtn.addEventListener('click', async () => {
        if (!selectedAvatarFile) return;
        
        activateBtn.disabled = true;
        activateBtn.innerText = 'ACTIVATING...';
        
        // Here you would normally upload the avatar
        // For now, we just proceed to success sequence
        startSuccessSequence();
    });

    function startSuccessSequence() {
        // Hide dialog if visible
        if (avatarDialog.classList.contains('show')) {
            avatarDialog.classList.remove('show');
            setTimeout(() => {
                avatarDialog.style.display = 'none';
            }, 600);
        }

        // Apply 3D exit animation to the active form/dialog container
        const target = avatarDialog.style.display !== 'none' ? avatarDialog : authForm;
        target.classList.add('form-exit-anim');

        // Start 3D sequence
        runComplex3DSequence();
    }

    async function runComplex3DSequence() {
        const tunnel = window.laserTunnel;
        if (!tunnel) return;

        // Phase 1: Access Granted (3D Text)
        await accessGrantedAudio.play();
        
        // const accessText = create3DText('ACCESS GRANTED', 5, 0x00ff88, true);
        //accessText.position.set(0, 0, tunnel.camera.position.z - 15);
        //tunnel.scene.add(accessText);
        
        //gsap.to(accessText.material, { opacity: 1, duration: 0.5 });
        //gsap.from(accessText.position, { z: tunnel.camera.position.z - 10, duration: 1, ease: 'back.out(2)' });

        // Enhance tunnel effects
        tunnel.isLoginSuccessful = true;
        if (tunnel.bloomPass) {
            gsap.to(tunnel.bloomPass, { strength: 6, radius: 1.2, duration: 2.5 });
        }
        
        // Increase lasers
        if (tunnel.lasers) {
            for (let i = 0; i < 1; i++) {
                setTimeout(() => {
                    const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 8);
                    const color = Math.random() > 0.5 ? 0x00ff88 : 0xff00ff;
                    const laserGroup = new THREE.Group();
                    const core = new THREE.Mesh(laserGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
                    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 21, 8), 
                                               new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7, side: THREE.BackSide }));
                    laserGroup.add(core, glow);
                    tunnel.resetLaser(laserGroup);
                    tunnel.scene.add(laserGroup);
                    tunnel.lasers.push(laserGroup);
                }, i * 60);
            }
        }

        await new Promise(r => setTimeout(r, 2000));

        // Phase 2: Initializing Profile (3D Text)
        //gsap.to(accessText.material, { opacity: 0, duration: 0.5, onComplete: () => tunnel.scene.remove(accessText) });
        
        await restoreBackupAudio.play();
        // const initText = create3DText('INITIALIZING USER PROFILE', 2, 0xff00ff, true);
        //initText.position.set(0, 0, tunnel.camera.position.z - 20);
        //tunnel.scene.add(initText);
        //gsap.to(initText.material, { opacity: 1, duration: 1 });

        // Add pink hexagons to background
        addHexagonsToTunnel(tunnel);

        await new Promise(r => setTimeout(r, 3000));

        // Phase 3: Initializing 10s
        await initializingAudio.play();
        //gsap.to(initText.material, { opacity: 0, duration: 1, onComplete: () => tunnel.scene.remove(initText) });
        
        gsap.to(tunnel.camera, { fov: 120, duration: 9.5, onUpdate: () => tunnel.camera.updateProjectionMatrix() });
        
        // Motion blur effect via bloom and speed
        gsap.to(tunnel, {
            cameraSpeed: 30,
            duration: 9.5,
            ease: 'power2.in'
        });

        if (tunnel.bloomPass) {
            gsap.to(tunnel.bloomPass, { strength: 3, duration: 9.5 });
        }

        await new Promise(r => setTimeout(r, 9500));

        // Phase 4: Activating Screen (3D transition to white)
        await initiatingSimAudio.play();
        
        // Final burst of light before white screen
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'white';
        flash.style.zIndex = '300';
        flash.style.opacity = '0';
        document.body.appendChild(flash);
        
        gsap.to(flash, { opacity: 1, duration: 0.5 });

        // Phase 5: Activating Profile Text (3D in white screen)
        const newScene = new THREE.Scene();
        newScene.background = new THREE.Color(0xffffff);
        const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        newCamera.position.z = 10;
        
        // const activatingText = create3DText('ACTIVATING PROFILE', 0.8, 0x000000);
        ///activatingText.position.set(0, 0, 0);
        ///newScene.add(activatingText);
        
        const renderer = tunnel.renderer;
        
        const renderActivating = () => {
            if (Date.now() - startTime < 4000) {
                renderer.render(newScene, newCamera);
                requestAnimationFrame(renderActivating);
            }
        };
        const startTime = Date.now();
        renderActivating();
        
        await new Promise(r => setTimeout(r, 4000));
        
        // Phase 6: Final Portal (40s sequence)
        await activatingUserAudio.play();
        startFinalPortalTransition(tunnel);
        
        // Fade out white flash
        gsap.to(flash, { opacity: 0, duration: 1, onComplete: () => flash.remove() });
    }

    function addHexagonsToTunnel(tunnel) {
        const hexGeo = new THREE.CircleGeometry(3, 6);
        const hexMat = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff, 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < 1; i++) {
            setTimeout(() => {
                const hex = new THREE.Mesh(hexGeo, hexMat.clone());
                const angle = Math.random() * Math.PI * 2;
                const radius = 8 + Math.random() * 5;
                const zDist = 100 + Math.random() * 300;
                
                hex.position.x = Math.cos(angle) * radius;
                hex.position.y = Math.sin(angle) * radius;
                hex.position.z = tunnel.camera.position.z - zDist;
                hex.lookAt(0, 0, hex.position.z);
                hex.rotation.z = Math.random() * Math.PI;
                tunnel.scene.add(hex);
                
                gsap.to(hex.material, { opacity: 0.5, duration: 1.5 });
                // Slow rotation
                gsap.to(hex.rotation, { z: hex.rotation.z + Math.PI, duration: 5 + Math.random() * 5, repeat: -1, ease: 'none' });
            }, i * 40);
        }
    }

    function startFinalPortalTransition(tunnel) {
        import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
            const loader = new GLTFLoader();
            const newScene = new THREE.Scene();
            newScene.background = new THREE.Color(0x000205);
            
            // Post-processing setup
            const composer = tunnel.composer;
            const renderPass = new RenderPass(newScene, tunnel.camera);
            composer.passes = [renderPass, tunnel.bloomPass];

            // Complex Lighting
            const ambient = new THREE.AmbientLight(0x111111, 0.5);
            newScene.add(ambient);
            
            const lights = [];
            const colors = [0xff00ff, 0x00ffff, 0x00ff88, 0xff0088];
            for(let i = 0; i < 12; i++) {
                const p = new THREE.PointLight(colors[i % 4], 80, 250);
                newScene.add(p);
                lights.push(p);
            }

            // Background Glowing Tunnel (Reference from portal-logic.js)
            const tunnelGeo = new THREE.CylinderGeometry(40, 40, 1000, 32, 10, true);
            const tunnelMat = new THREE.MeshBasicMaterial({
                color: 0x001133,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.2,
                wireframe: true
            });
            const backTunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
            backTunnel.rotation.x = Math.PI / 2;
            newScene.add(backTunnel);

            Promise.all([
                loader.loadAsync('../models/Framework.glb'),
                loader.loadAsync('../models/PloyFramework.glb')
            ]).then(([glb1, glb2]) => {
                const group = new THREE.Group();
                newScene.add(group);
                
                const models = [];
                const layers = 8;
                const perLayer = 30;
                
                // Track points for mesh lines
                const layerPoints = [];

                for (let layer = 0; layer < layers; layer++) {
                    const points = [];
                    for (let i = 0; i < perLayer; i++) {
                        const isFramework = (i + layer) % 2 === 0;
                        const model = (isFramework ? glb1 : glb2).scene.clone();
                        
                        // Radial spiral placement - tightly woven
                        const angle = (i / perLayer) * Math.PI * 2 + (layer * 0.4);
                        const radius = 18 + layer * 8 + Math.sin(i * 0.5) * 3;
                        const z = -layer * 120 - (i * 4);
                        
                        const pos = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
                        model.position.copy(pos);
                        points.push(pos.clone());

                        model.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                        
                        const scale = 4 + layer * 1.5 + Math.random() * 2;
                        model.scale.set(scale, scale, scale);
                        
                        model.traverse(node => {
                            if (node.isMesh) {
                                node.material = new THREE.MeshStandardMaterial({
                                    color: 0x111111,
                                    emissive: colors[(i + layer) % 4],
                                    emissiveIntensity: 3.5,
                                    roughness: 0.05,
                                    metalness: 1.0,
                                    transparent: true,
                                    opacity: 0.9
                                });
                            }
                        });

                        group.add(model);
                        models.push({
                            mesh: model,
                            initialPos: pos.clone(),
                            layer: layer,
                            rotSpeed: {
                                x: (Math.random() - 0.5) * 0.04,
                                y: (Math.random() - 0.5) * 0.04,
                                z: (Math.random() - 0.5) * 0.04
                            }
                        });
                    }
                    layerPoints.push(points);
                }

                // Create Mesh Lines (connecting nodes)
                const lineMat = new THREE.LineBasicMaterial({ 
                    color: 0x00ffff, 
                    transparent: true, 
                    opacity: 0.2,
                    blending: THREE.AdditiveBlending 
                });
                
                layerPoints.forEach((points, l) => {
                    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(lineGeo, lineMat.clone());
                    group.add(line);
                    
                    // Cross-layer connections
                    if (l > 0) {
                        const crossPoints = [];
                        for(let i = 0; i < perLayer; i++) {
                            crossPoints.push(points[i], layerPoints[l-1][i]);
                        }
                        const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPoints);
                        const crossLines = new THREE.LineSegments(crossGeo, lineMat.clone());
                        group.add(crossLines);
                    }
                });
                
                // Final Entrance Sequence
                tunnel.scene = newScene;
                tunnel.camera.position.set(0, 0, 100);
                tunnel.camera.fov = 80;
                tunnel.camera.updateProjectionMatrix();
                
                let portalTime = 0;
                const startTime = Date.now();
                let cameraZ = 100;
                
                const animatePortal = () => {
                    const now = Date.now();
                    portalTime = (now - startTime) / 1000;
                    
                    // Smooth rotation of the entire structure
                    group.rotation.z += 0.0015;
                    backTunnel.rotation.y += 0.002;
                    
                    // Individual model movement and rotation
                    models.forEach((m) => {
                        m.mesh.rotation.x += m.rotSpeed.x;
                        m.mesh.rotation.y += m.rotSpeed.y;
                        m.mesh.rotation.z += m.rotSpeed.z;
                        
                        // Breathing effect on scale
                        const s = 1 + Math.sin(portalTime * 0.6 + m.layer) * 0.08;
                        m.mesh.scale.set(m.mesh.scale.x * s, m.mesh.scale.y * s, m.mesh.scale.z * s);
                    });

                    // Camera movement - gradual acceleration
                    const speed = portalTime < 13 ? 1.0 : 1.0 + (portalTime - 13) * 0.3;
                    cameraZ -= speed;
                    tunnel.camera.position.z = cameraZ;
                    backTunnel.position.z = cameraZ - 200;
                    
                    // Lights orbit camera with complexity
                    lights.forEach((l, li) => {
                        const lAngle = portalTime * 1.2 + li * (Math.PI / 6);
                        const lRadius = 30 + Math.sin(portalTime * 0.8 + li) * 15;
                        l.position.set(
                            Math.cos(lAngle) * lRadius,
                            Math.sin(lAngle) * lRadius,
                            cameraZ - 40
                        );
                        l.intensity = 80 + Math.sin(portalTime * 2.5 + li) * 40;
                    });
                    
                    // 13s Expansion Event - Dramatic change
                    if (portalTime >= 13 && portalTime < 13.2) {
                        gsap.to(group.scale, { x: 4.5, y: 4.5, duration: 5, ease: 'expo.out' });
                        gsap.to(tunnel.camera, { fov: 155, duration: 5, onUpdate: () => tunnel.camera.updateProjectionMatrix() });
                        gsap.to(tunnel.bloomPass, { strength: 20, radius: 2.5, duration: 5 });
                        gsap.to(lineMat, { opacity: 0.5, duration: 2 });
                    }
                    
                    // Final 3 seconds White Out (37s - 40s)
                    if (portalTime >= 35) {
                        const whiteVal = Math.min(1, (portalTime - 35) / 3);
                        if (!tunnel.whiteOverlay) {
                            tunnel.whiteOverlay = document.createElement('div');
                            tunnel.whiteOverlay.style.position = 'fixed';
                            tunnel.whiteOverlay.style.top = '0';
                            tunnel.whiteOverlay.style.left = '0';
                            tunnel.whiteOverlay.style.width = '100%';
                            tunnel.whiteOverlay.style.height = '100%';
                            tunnel.whiteOverlay.style.background = 'white';
                            tunnel.whiteOverlay.style.zIndex = '1000';
                            tunnel.whiteOverlay.style.opacity = '0';
                            document.body.appendChild(tunnel.whiteOverlay);
                        }
                        tunnel.whiteOverlay.style.opacity = whiteVal;
                        
                        if (portalTime >= 40) {
                            window.location.href = '../islands/index.html';
                            return;
                        }
                    }
                    
                    tunnel.composer.render();
                    requestAnimationFrame(animatePortal);
                };
                
                animatePortal();
            });
        });
    }

    function handleLoginError(message) {
        window.notify.show(message, 'error');
        errorAudio.currentTime = 0;
        errorAudio.play().catch(err => console.warn('Audio play failed:', err));

        authForm.classList.add('shake-anim');
        setTimeout(() => {
            authForm.classList.remove('shake-anim');
        }, 500);
    }

    // CSS for shake
    if (!document.getElementById('login-animations')) {
        const style = document.createElement('style');
        style.id = 'login-animations';
        style.innerHTML = `
            @keyframes shake {
                0%, 100% { transform: translate(-0%, -0%); }
                25% { transform: translate(-0%, -0%) translateX(-8px); }
                75% { transform: translate(-0%, -0%) translateX(8px); }
            }
            .shake-anim {
                animation: shake 0.2s ease-in-out 0s 2;
            }
        `;
        document.head.appendChild(style);
    }
})();