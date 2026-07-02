class Bubble {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // ===== ЗОНЫ-ОГРАНИЧИТЕЛИ =====
        // Левая зона (бонусы) — запрещённая зона
        this.forbiddenLeft = 80;   // Ширина левой запрещённой зоны
        this.forbiddenTop = 100;   // Верхняя зона (счёт + кнопки)
        this.forbiddenRight = 70;  // Правая зона (кнопки управления)
        // ==============================
        
        this.radius = 20 + Math.random() * 45;
        
        // ===== СПАВН С УЧЁТОМ ОГРАНИЧЕНИЙ =====
        let attempts = 0;
        let maxAttempts = 50;
        let validPosition = false;
        
        while (!validPosition && attempts < maxAttempts) {
            this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
            this.y = canvasHeight + this.radius + Math.random() * 100;
            
            // Проверяем, не попадает ли пузырёк в запрещённые зоны
            const isInLeftZone = this.x < this.forbiddenLeft + this.radius;
            const isInRightZone = this.x > canvasWidth - this.forbiddenRight - this.radius;
            const isInTopZone = this.y < this.forbiddenTop + this.radius;
            
            if (!isInLeftZone && !isInRightZone && !isInTopZone) {
                validPosition = true;
            }
            attempts++;
        }
        
        // Если не нашли место — ставим в безопасное место
        if (!validPosition) {
            this.x = canvasWidth / 2 + (Math.random() - 0.5) * 100;
            this.y = canvasHeight + this.radius + Math.random() * 100;
        }
        // =====================================
        
        this.speed = 0.6 + Math.random() * 1.8;
        this.hue = Math.random() * 360;
        this.saturation = 80 + Math.random() * 20;
        this.lightness = 55 + Math.random() * 25;
        this.alive = true;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.01 + Math.random() * 0.02;
        this.wobbleAmount = 0.5 + Math.random() * 1.5;
        this.popSound = null;
        this.points = 1;
    }

    // ===== ПРОВЕРКА, В БЕЗОПАСНОЙ ЛИ ЗОНЕ =====
    isInSafeZone() {
        const isInLeftZone = this.x < this.forbiddenLeft + this.radius;
        const isInRightZone = this.x > this.canvasWidth - this.forbiddenRight - this.radius;
        const isInTopZone = this.y < this.forbiddenTop + this.radius;
        return !isInLeftZone && !isInRightZone && !isInTopZone;
    }

    update() {
        this.y -= this.speed;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * this.wobbleAmount;

        // Если пузырёк залетел в запрещённую зону — убираем его
        if (!this.isInSafeZone() && this.y < this.canvasHeight * 0.6) {
            this.alive = false;
        }

        if (this.y < -this.radius * 3) {
            this.alive = false;
        }
    }

    // ===== ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ =====
    draw(ctx) {
        if (!this.alive) return;

        const r = this.radius;
        const x = this.x;
        const y = this.y;
        const hue = this.hue;

        // Тень (свечение)
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        glow.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.1)`);
        glow.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Основной шар
        const grad = ctx.createRadialGradient(
            x - r * 0.3, y - r * 0.3, 0,
            x, y, r
        );
        grad.addColorStop(0, `hsl(${hue}, ${this.saturation}%, ${this.lightness + 20}%)`);
        grad.addColorStop(0.5, `hsl(${hue}, ${this.saturation}%, ${this.lightness}%)`);
        grad.addColorStop(1, `hsl(${hue}, ${this.saturation}%, ${this.lightness - 30}%)`);

        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.3)`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Блик
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.1})`;
        ctx.fill();

        // Маленький блик
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.5, r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,0.5)`;
        ctx.fill();

        // Край
        ctx.strokeStyle = `hsla(${hue}, 100%, 90%, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r - 1, 0, Math.PI * 2);
        ctx.stroke();
    }

    contains(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return dx * dx + dy * dy < this.radius * this.radius;
    }
}
