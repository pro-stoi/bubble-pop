// js/pop.js — универсальное лопание шариков

class PopManager {
    constructor(canvas, particles) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = particles || [];
        this.bubbles = [];
        this.isActive = true;
    }

    // Добавляем шарики для лопания
    addBubbles(bubbles) {
        this.bubbles = bubbles;
    }

    // Обработчик тапа
    handleTap(x, y) {
        if (!this.isActive) return false;
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (b.contains(x, y)) {
                // Создаём частицы
                this.spawnParticles(b.x, b.y, b.hue);
                // Удаляем шарик
                this.bubbles.splice(i, 1);
                // Создаём новый шарик на замену
                this.respawnBubble();
                
                // Звук (тихий поп)
                if (window.sound) {
                    sound.pop(500 + Math.random() * 300, 0.1, 0.15);
                }
                return true;
            }
        }
        return false;
    }

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
    }

    respawnBubble() {
        const b = new Bubble(window.innerWidth, window.innerHeight);
        b.y = Math.random() * window.innerHeight;
        b.x = Math.random() * window.innerWidth;
        b.radius = 20 + Math.random() * 50;
        b.speed = 0.1 + Math.random() * 0.3;
        b.hue = Math.random() * 360;
        this.bubbles.push(b);
    }

    // Очистка
    clear() {
        this.bubbles = [];
        this.particles = [];
    }

    // Обновление частиц
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
    }

    drawParticles(ctx) {
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
}