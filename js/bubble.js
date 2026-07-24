class Bubble {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // ===== ГРАНИЦА ИГРОВОЙ ЗОНЫ =====
        // Шарики исчезают, когда доходят до этой границы
        // 70px — высота верхней панели (счёт + кнопки)
        this.topBoundary = 70;
        // ==================================
        
        this.radius = 20 + Math.random() * 45;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = canvasHeight + this.radius + Math.random() * 100;
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

    update() {
        this.y -= this.speed;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * this.wobbleAmount;

        // ===== ШАРИК ИСЧЕЗАЕТ НА ГРАНИЦЕ =====
        // Шарик исчезает, когда доходит до верхней границы игровой зоны
        if (this.y < this.topBoundary - this.radius) {
            this.alive = false;
        }
        // =====================================
        
        // Запасное условие (на случай, если шарик всё же вылетел)
        if (this.y < -this.radius * 3) {
            this.alive = false;
        }
    }

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

        
        // ===== ТРЕЩИНЫ НА КРАСНЫХ ШАРАХ =====
const isRed = (hue >= 340 || hue <= 20);
if (isRed && r > 20) {
    ctx.save();
    
    // Количество трещин
    const crackCount = 3 + Math.floor(Math.random() * 3);
    const cracks = [];
    
    // Генерируем трещины
    for (let c = 0; c < crackCount; c++) {
        const startAngle = Math.random() * Math.PI * 2;
        const startDist = r * (0.2 + Math.random() * 0.4);
        const sx = x + Math.cos(startAngle) * startDist;
        const sy = y + Math.sin(startAngle) * startDist;
        
        // Длина трещины
        const length = r * (0.2 + Math.random() * 0.4);
        const segments = 3 + Math.floor(Math.random() * 4);
        
        let px = sx;
        let py = sy;
        let angle = startAngle + (Math.random() - 0.5) * 1.2;
        
        for (let s = 0; s < segments; s++) {
            const segLen = length / segments * (0.6 + Math.random() * 0.8);
            const newAngle = angle + (Math.random() - 0.5) * 0.8;
            const nx = px + Math.cos(newAngle) * segLen;
            const ny = py + Math.sin(newAngle) * segLen;
            
            cracks.push({
                x1: px, y1: py,
                x2: nx, y2: ny,
                width: (1 - s / segments) * 2 + 0.5
            });
            
            // Ответвление
            if (Math.random() > 0.5 && s > 0) {
                const branchAngle = newAngle + (Math.random() - 0.5) * 1.5;
                const branchLen = segLen * 0.4;
                const bx = px + Math.cos(branchAngle) * branchLen;
                const by = py + Math.sin(branchAngle) * branchLen;
                cracks.push({
                    x1: px, y1: py,
                    x2: bx, y2: by,
                    width: (1 - s / segments) * 1.2 + 0.3
                });
            }
            
            px = nx;
            py = ny;
            angle = newAngle;
        }
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Рисуем трещины
for (const crack of cracks) {
    ctx.beginPath();
    ctx.moveTo(crack.x1, crack.y1);
    ctx.lineTo(crack.x2, crack.y2);
    // ===== БЕЛАЯ МОЛНИЯ =====
    ctx.strokeStyle = `hsla(210, 100%, 95%, 0.8)`;
    ctx.lineWidth = crack.width;
    ctx.shadowColor = 'rgba(200, 230, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();
}

// ===== ВТОРОЙ СЛОЙ (ЯРКОЕ ЯДРО МОЛНИИ) =====
for (const crack of cracks) {
    ctx.beginPath();
    ctx.moveTo(crack.x1, crack.y1);
    ctx.lineTo(crack.x2, crack.y2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
    ctx.lineWidth = crack.width * 0.4;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();
}

ctx.restore();
}
       //////////////////////////////////////////////////////////////////////////////////////////// 
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