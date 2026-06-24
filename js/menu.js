document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('menuCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);

    // ===== ПУЗЫРЬКИ ДЛЯ ФОНА =====
    const bgBubbles = [];
    for (let i = 0; i < 12; i++) {
        const b = new Bubble(width, height);
        b.y = Math.random() * height;
        b.speed = 0.2 + Math.random() * 0.6;
        b.radius = 15 + Math.random() * 50;
        b.hue = Math.random() * 360;
        bgBubbles.push(b);
    }

    // ===== ЧАСТИЦЫ =====
    let particles = [];

    window.spawnParticles = function(x, y, hue) {
        for (let i = 0; i < 20 + Math.random() * 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                radius: 2 + Math.random() * 5,
                hue: hue + (Math.random() - 0.5) * 30,
                life: 40 + Math.random() * 30,
                maxLife: 70,
                gravity: 0.08
            });
        }
    };

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.99;
            p.vy *= 0.99;
            p.life--;
            p.radius *= 0.995;
            if (p.life <= 0 || p.radius < 0.3) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ===== АНИМАЦИЯ =====
    function animate() {
        ctx.clearRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0a2a');
        grad.addColorStop(0.5, '#1a0a3a');
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Звёзды
        if (!animate._stars) {
            animate._stars = [];
            for (let i = 0; i < 60; i++) {
                animate._stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 0.5 + Math.random() * 1.5,
                    a: 0.2 + Math.random() * 0.5
                });
            }
        }
        for (const star of animate._stars) {
            ctx.globalAlpha = star.a;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const b of bgBubbles) {
            b.update();
            if (!b.alive) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
                b.alive = true;
                b.radius = 15 + Math.random() * 50;
                b.speed = 0.2 + Math.random() * 0.6;
                b.hue = Math.random() * 360;
            }
            b.draw(ctx);
        }

        updateParticles();
        drawParticles();

        requestAnimationFrame(animate);
    }
    animate();

    // ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ КНОПОК =====
    function setupMenuButton(btnId, targetPage, hue) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        function handleAction(e) {
            if (e) {
                e.stopPropagation();
                if (e.type === 'touchend') e.preventDefault();
            }
            
            const rect = btn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            spawnParticles(x, y, hue);
            
            setTimeout(() => {
                goToWithAd(targetPage);
            }, 300);
        }
        
        btn.addEventListener('click', handleAction);
        btn.addEventListener('touchend', handleAction);
    }

    // ===== НАСТРАИВАЕМ КНОПКИ =====
    setupMenuButton('playBtn', 'game.html', 200);
    setupMenuButton('topBtn', 'top.html', 45);

    // ===== КНОПКА ЗВУКА =====
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        function handleSound(e) {
            if (e) {
                e.stopPropagation();
                if (e.type === 'touchend') e.preventDefault();
            }
            
            const rect = soundBtn.getBoundingClientRect();
            spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 320);
            
            const icon = document.getElementById('soundIcon');
            const label = document.getElementById('soundLabel');
            const isOn = icon.textContent === '🔊';
            
            toggleSound();
            icon.textContent = isOn ? '🔇' : '🔊';
            label.textContent = isOn ? 'ВЫКЛ' : 'ВКЛ';
        }
        
        soundBtn.addEventListener('click', handleSound);
        soundBtn.addEventListener('touchend', handleSound);
    }
});