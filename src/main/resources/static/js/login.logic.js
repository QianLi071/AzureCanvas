import * as THREE from 'three';
import { gsap } from 'gsap';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

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

    async function startSuccessSequence() {
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

        // Play success audio
        try {
            await accessGrantedAudio.play();
        } catch (e) {}

        const tunnel = window.laserTunnel;
        if (tunnel) {
            // Trigger 1.2s camera flight to exit
            tunnel.flyToExit(1200).then(() => {
                const urlParams = new URLSearchParams(window.location.search);
                let redirect = urlParams.get('redirect');
                
                // Validate redirect path (must be relative or same origin)
                const isLocalPath = redirect && (
                    redirect.startsWith('/') || 
                    redirect.startsWith('./') || 
                    redirect.startsWith('../') ||
                    redirect.startsWith(window.location.origin)
                );
                
                if (isLocalPath) {
                    window.location.href = redirect;
                } else {
                    window.location.href = '../islands/index.html';
                }
            });
        } else {
            // Fallback if tunnel not loaded
            window.location.href = '../islands/index.html';
        }
    }

    // Removed old complex 40s sequence as requested
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