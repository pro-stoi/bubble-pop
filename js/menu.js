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
    for (let i = 0; i < 15; i++) {
        const b = new Bubble(width, height);
        b.y = Math.random() * height;
        b.speed = 0.15 + Math.random() * 0.4;
        b.radius = 20 + Math.random() * 50;
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

    // ===== POP MANAGER ДЛЯ ЛОПАНИЯ ШАРИКОВ =====
    const popManager = {
        particles: particles,
        bubbles: bgBubbles,

        handleTap(x, y) {
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                if (b.contains(x, y)) {
                    this.spawnParticles(b.x, b.y, b.hue);
                    this.bubbles.splice(i, 1);
                    this.respawnBubble();
                    if (window.sound) {
                        sound.pop(500 + Math.random() * 300, 0.1, 0.15);
                    }
                    return true;
                }
            }
            return false;
        },

        spawnParticles(x, y, hue) {
            for (let i = 0; i < 15 + Math.random() * 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    radius: 1.5 + Math.random() * 4,
                    hue: hue + (Math.random() - 0.5) * 30,
                    life: 30 + Math.random() * 30,
                    maxLife: 50,
                    gravity: 0.06
                });
            }
        },

        respawnBubble() {
            const b = new Bubble(width, height);
            b.y = Math.random() * height;
            b.x = Math.random() * width;
            b.radius = 20 + Math.random() * 50;
            b.speed = 0.1 + Math.random() * 0.3;
            b.hue = Math.random() * 360;
            this.bubbles.push(b);
        },

        updateParticles() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.99;
                p.vy *= 0.99;
                p.life--;
                p.radius *= 0.995;
                if (p.life <= 0 || p.radius < 0.3) {
                    this.particles.splice(i, 1);
                }
            }
        },

        drawParticles() {
            for (const p of this.particles) {
                const alpha = p.life / p.maxLife;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    };

    // ===== ОБРАБОТКА ТАПА ПО КАНВАСУ =====
    function handleCanvasTap(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        popManager.handleTap(x, y);
    }

    canvas.addEventListener('click', handleCanvasTap);
    canvas.addEventListener('touchstart', handleCanvasTap, { passive: false });

    // ===== АНИМАЦИЯ ФОНА =====
    function animate() {
        ctx.clearRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0a2a');
        grad.addColorStop(0.5, '#1a0a3a');
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

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
                b.radius = 20 + Math.random() * 50;
                b.speed = 0.15 + Math.random() * 0.4;
                b.hue = Math.random() * 360;
            }
            b.draw(ctx);
        }

        popManager.updateParticles();
        popManager.drawParticles();

        requestAnimationFrame(animate);
    }
    animate();

    // ===== КНОПКА "ИГРАТЬ" БЕЗ РЕКЛАМЫ =====
    document.getElementById('playBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = document.getElementById('playBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 200);
        setTimeout(() => {
            goTo('game.html');  // ← БЕЗ РЕКЛАМЫ
        }, 300);
    });

    document.getElementById('playBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        const rect = document.getElementById('playBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 200);
        setTimeout(() => {
            goTo('game.html');  // ← БЕЗ РЕКЛАМЫ
        }, 300);
    });

    // ===== КНОПКА "ТОП" =====
    document.getElementById('topBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = document.getElementById('topBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 45);
        setTimeout(() => {
            goTo('top.html');
        }, 300);
    });

    document.getElementById('topBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        const rect = document.getElementById('topBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 45);
        setTimeout(() => {
            goTo('top.html');
        }, 300);
    });

    // ===== КНОПКА "ИСПЫТАНИЯ" =====
    document.getElementById('challengesBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = document.getElementById('challengesBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 280);
        setTimeout(() => {
            goTo('challenges.html');
        }, 300);
    });

    document.getElementById('challengesBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        const rect = document.getElementById('challengesBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 280);
        setTimeout(() => {
            goTo('challenges.html');
        }, 300);
    });

    // ===== КНОПКА ЗВУКА =====
    document.getElementById('soundBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = document.getElementById('soundBtn').getBoundingClientRect();
        const icon = document.getElementById('soundIcon');
        const label = document.getElementById('soundLabel');
        const isOn = icon.textContent === '🔊';
        icon.textContent = isOn ? '🔇' : '🔊';
        label.textContent = isOn ? 'ВЫКЛ' : 'ВКЛ';
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 320);
        toggleSound();
    });

    document.getElementById('soundBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        const rect = document.getElementById('soundBtn').getBoundingClientRect();
        const icon = document.getElementById('soundIcon');
        const label = document.getElementById('soundLabel');
        const isOn = icon.textContent === '🔊';
        icon.textContent = isOn ? '🔇' : '🔊';
        label.textContent = isOn ? 'ВЫКЛ' : 'ВКЛ';
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 320);
        toggleSound();
    });

    // ===== КНОПКА ВЫХОДА =====
    document.getElementById('exitBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = document.getElementById('exitBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 0);
        setTimeout(() => {
            exitToVK();
        }, 300);
    });

    document.getElementById('exitBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        const rect = document.getElementById('exitBtn').getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 0);
        setTimeout(() => {
            exitToVK();
        }, 300);
    });
});
