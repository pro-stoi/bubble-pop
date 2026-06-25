document.addEventListener('DOMContentLoaded', () => {
    let topData = JSON.parse(localStorage.getItem('bubbleTop') || '[]');
    let currentSort = 'score';

    // ===== ФУНКЦИЯ ФОРМАТИРОВАНИЯ =====
    function formatDate(dateStr) {
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
            return parts[0] + ' ' + parts[1];
        }
        return dateStr;
    }

    // ===== РЕНДЕРИНГ ТОПА =====
    function renderTop() {
        const container = document.getElementById('topList');
        
        if (topData.length === 0) {
            container.innerHTML = `<div class="top-empty">🎯 Сыграйте первую игру!</div>`;
            return;
        }

        let sorted = [...topData];
        if (currentSort === 'score') {
            sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (currentSort === 'combo') {
            sorted.sort((a, b) => (b.maxCombo || 0) - (a.maxCombo || 0));
        } else if (currentSort === 'bonus') {
            sorted.sort((a, b) => (b.bestBonus || 0) - (a.bestBonus || 0));
        }

        sorted = sorted.slice(0, 10);

        container.innerHTML = sorted.map((item, index) => {
            const place = index + 1;
            let placeClass = 'place';
            if (place === 1) placeClass += ' gold';
            else if (place === 2) placeClass += ' silver';
            else if (place === 3) placeClass += ' bronze';

            const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : place;

            return `
                <div class="top-row">
                    <span class="${placeClass}">${medal}</span>
                    <span class="date">${formatDate(item.date || '—')}</span>
                    <span class="score">${item.score || 0}</span>
                    <span class="combo">${item.maxCombo || 0}</span>
                    <span class="bonus">${item.bestBonus || 0}</span>
                </div>
            `;
        }).join('');
    }

    // ===== ФИЛЬТРЫ =====
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            renderTop();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            renderTop();
        });
    });

    // ===== НАЗАД =====
 document.getElementById('backMenuBtn').addEventListener('click', () => {
    goTo('index.html');
});
document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    goTo('index.html');
});

    // ===== ЗВУК =====
    document.getElementById('soundToggleTop').addEventListener('click', () => {
        toggleSound();
    });
    document.getElementById('soundToggleTop').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== ОЧИСТКА =====
    document.getElementById('clearTopBtn').addEventListener('click', () => {
        if (confirm('Удалить все рекорды?')) {
            localStorage.removeItem('bubbleTop');
            topData = [];
            renderTop();
        }
    });

    // ===== ПЕРВЫЙ РЕНДЕР =====
    renderTop();

    // ============================================================
    // ===== ФОНОВЫЕ ШАРИКИ ДЛЯ ЛОПАНИЯ =====
    // ============================================================

    const canvas = document.createElement('canvas');
    canvas.id = 'topBgCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:0;pointer-events:none;';
    document.body.prepend(canvas);

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

    const bgBubbles = [];
    for (let i = 0; i < 10; i++) {
        const b = new Bubble(width, height);
        b.y = Math.random() * height;
        b.speed = 0.1 + Math.random() * 0.3;
        b.radius = 20 + Math.random() * 40;
        b.hue = Math.random() * 360;
        bgBubbles.push(b);
    }

    let particles = [];

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
            b.radius = 20 + Math.random() * 40;
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

    // Обработчик тапа по топу
    document.querySelector('.top-container').addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        popManager.handleTap(x, y);
    });

    document.querySelector('.top-container').addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        popManager.handleTap(x, y);
    }, { passive: true });

    function animateBg() {
        ctx.clearRect(0, 0, width, height);
        
        // Прозрачный фон (чтобы был виден основной контент)
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, width, height);

        for (const b of bgBubbles) {
            b.update();
            if (!b.alive) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
                b.alive = true;
                b.radius = 20 + Math.random() * 40;
                b.speed = 0.1 + Math.random() * 0.3;
                b.hue = Math.random() * 360;
            }
            b.draw(ctx);
        }

        popManager.updateParticles();
        popManager.drawParticles();

        requestAnimationFrame(animateBg);
    }
    animateBg();
});