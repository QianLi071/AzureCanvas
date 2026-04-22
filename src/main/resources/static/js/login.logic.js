/**
 * Login logic handling form submission and authentication.
 */
(function() {
    const loginForm = document.querySelector('.login-card');
    const loginBtn = document.querySelector('.login-btn');
    const errorAudio = new Audio('../audios/login/error.ogg');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('inputcheckbox').checked;

        // Visual feedback
        loginBtn.disabled = true;
        loginBtn.style.opacity = '0.7';
        loginBtn.innerText = 'AUTHENTICATING...';

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
                window.notify.show(data.message || 'Login successful! Redirecting...', 'success');
                
                // Stop tunnel growth
                if (window.laserTunnel) {
                    window.laserTunnel.stopGrowth();
                }

                // Redirect after a short delay to show the success notification
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else {
                handleLoginError(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            handleLoginError('Connection error. Please try again later.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
            loginBtn.innerText = 'ENTER SYSTEM';
        }
    });

    function handleLoginError(message) {
        // Show error notification
        window.notify.show(message, 'error');
        
        // Play error sound
        errorAudio.currentTime = 0;
        errorAudio.play().catch(err => console.warn('Audio play failed:', err));

        // Shake effect on the card
        loginForm.classList.add('shake-anim');
        setTimeout(() => {
            loginForm.classList.remove('shake-anim');
        }, 500);
    }

    // Add CSS for shake animation if not present
    if (!document.getElementById('login-animations')) {
        const style = document.createElement('style');
        style.id = 'login-animations';
        style.innerHTML = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                75% { transform: translateX(8px); }
            }
            .shake-anim {
                animation: shake 0.2s ease-in-out 0s 2;
            }
        `;
        document.head.appendChild(style);
    }
})();