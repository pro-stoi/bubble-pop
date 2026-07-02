class Particle {
    constructor(x, y, hue, colorIntensity = 1) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1;
        this.radius = 2 + Math.random() * 6;
        this.hue = hue + (Math.random() - 0.5) * 30;
        this.life = 40 + Math.random() * 30;
        this.maxLife = this.life;
        this.gravity = 0.08;
        this.friction = 0.99;
        this.colorIntensity = colorIntensity;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life--;
        this.radius *= 0.995;
    }

    draw(ctx) {
        if (this.life <= 0 || this.radius < 0.3) return;

        const alpha = (this.life / this.maxLife) * 0.9;
        const radius = Math.max(0.5, this.radius);

        ctx.globalAlpha = alpha;
        
        // Свечение
        const glow = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, radius * 2
        );
        glow.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${0.2 * alpha})`);
        glow.addColorStop(1, `hsla(${this.hue}, 100%, 70%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Частица
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue}, 100%, ${60 + 20 * this.colorIntensity}%)`;
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0 || this.radius < 0.3;
    }
}