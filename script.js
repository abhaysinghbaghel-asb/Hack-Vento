// Function to show/hide password
function togglePass() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
}

// Background Particle Animation
const container = document.getElementById('particles');

function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Randomize appearance
    const size = Math.random() * 3 + 'px';
    particle.style.width = size;
    particle.style.height = size;
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    
    container.appendChild(particle);

    // Random drift movement
    const duration = Math.random() * 8000 + 5000;
    const animation = particle.animate([
        { transform: 'translate(0, 0)', opacity: 0.6 },
        { transform: `translate(${Math.random() * 100 - 50}px, -100px)`, opacity: 0 }
    ], {
        duration: duration,
        easing: 'linear'
    });

    animation.onfinish = () => particle.remove();
}

// Generate a new particle every 400ms
setInterval(createParticle, 400);