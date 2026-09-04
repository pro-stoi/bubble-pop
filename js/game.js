class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.bubbles = [];
        this.particles = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalPopped = 0;
        
        this.pendingScore = 0;
        this.multiplier = 1;
        this.maxMultiplier = 1; 
        this.lastPopTime = 0;
        this.comboTimeout = 2000;
        this.isProcessing = false;
        this.scorePopups = [];
        
        this.spawnRate = 20;
        this.frame = 0;
        this.isRunning = true;
        this.difficulty = 1;
        
        this.flyingNumbers = [];
        
        // Бонусы
        this.bonusManager = new BonusManager(this);
        
        // Испытания
        challengeTracker.newGame();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.bonusManager.updateUI();
        
         // =====  ОТПРАВКА В ТОП ПРИ ЗАВЕРШЕНИИ =====
    // Сохраняем результат при выходе
    this._originalSaveResult = this.saveGameResult.bind(this);
    this.saveGameResult = this.saveGameResult.bind(this);
        
          if (typeof statsManager === 'undefined') {
        
    } else {
        
    }
        
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

spawnBubble() {
    const types = [
        { radius: 12, points: 10, hue: 320, weight: 15 },
        { radius: 18, points: 7, hue: 200, weight: 20 },
        { radius: 26, points: 4, hue: 120, weight: 25 },
        { radius: 36, points: 2, hue: 45, weight: 25 },
        { radius: 50, points: 1, hue: 0, weight: 15 }
    ];
    
    let totalWeight = types.reduce((s, t) => s + t.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = types[0];
    for (const t of types) {
        rand -= t.weight;
        if (rand <= 0) {
            chosen = t;
            break;
        }
    }
    
    const b = new Bubble(this.width, this.height);
    b.radius = chosen.radius + (Math.random() - 0.5) * 6;
    b.points = chosen.points;
    b.hue = chosen.hue + (Math.random() - 0.5) * 20;
    b.type = chosen;
    
    // ===== ШАРИКИ СПАВНЯТСЯ НИЖЕ ГРАНИЦЫ =====
    const topBoundary = 70;
    if (b.y < topBoundary + b.radius) {
        b.y = topBoundary + b.radius + Math.random() * 50;
    }
    // ==========================================
    
    this.bonusManager.applyEffects(b);
    return b;
}
// game.js

spawnGoldenBubble() {
    let goldenCount = 0;
    for (let i = 0; i < this.bubbles.length; i++) {
        if (this.bubbles[i].isGolden) goldenCount++;
    }
    if (goldenCount >= 3) return;
    
    const b = new Bubble(this.width, this.height);
    b.isGolden = true;
    b.radius = 25 + Math.random() * 15;
    b.x = 50 + Math.random() * (this.width - 100);
    b.y = this.height + b.radius + Math.random() * 100;
    b.speed = 1.2 + Math.random() * 1.5;  // ← БЫСТРЕЕ (было 0.5 + 0.8)
    b.hue = 45;
    b.saturation = 95;
    b.lightness = 60;
    b.points = 100;
    b.goldenChildren = 5 + Math.floor(Math.random() * 6);
    
    this.bubbles.push(b);
}
    
  // game.js

popGoldenBubble(goldenBubble) {
    // ===== 100 ОЧКОВ =====
    this.pendingScore += 100;
    this.score += 100;
    
    // ===== ВСПЛЫВАЮЩАЯ НАДПИСЬ =====
    this.scorePopups.push({
        x: goldenBubble.x,
        y: goldenBubble.y - 30,
        text: '⭐ +100',
        subtext: 'ЗОЛОТОЙ ШАР!',
        life: 70,
        maxLife: 70,
        hue: 45,
        big: true,
        customColor: '#ffd700'
    });
    
    // ===== ЧАСТИЦЫ (золотые) - ИСПРАВЛЕНО! =====
    for (let i = 0; i < 30; i++) {
        const p = new Particle(goldenBubble.x, goldenBubble.y, 45, 1);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 2;
        p.radius = 2 + Math.random() * 4;
        p.hue = 45 + (Math.random() - 0.5) * 20;
        p.life = 40 + Math.random() * 30;
        p.maxLife = 70;
        p.gravity = 0.06;
        this.particles.push(p);
    }
    
    // ===== СОЗДАЁМ 5-10 СЛУЧАЙНЫХ ШАРОВ =====
    const count = 8 + Math.floor(Math.random() * 8);
    const colors = ['red', 'yellow', 'green', 'blue', 'pink'];
    const hueMap = { 'red': 0, 'yellow': 45, 'green': 120, 'blue': 200, 'pink': 320 };
    
    for (let i = 0; i < Math.min(count, 40 - this.bubbles.length); i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const newBubble = new Bubble(this.width, this.height);
        newBubble.radius = 15 + Math.random() * 25;
        newBubble.hue = hueMap[color] + (Math.random() - 0.5) * 20;
        if (newBubble.hue < 0) newBubble.hue += 360;
        if (newBubble.hue >= 360) newBubble.hue -= 360;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 60;
        newBubble.x = goldenBubble.x + Math.cos(angle) * distance;
        newBubble.y = goldenBubble.y + Math.sin(angle) * distance;
        newBubble.speed = 0.3 + Math.random() * 0.5;
        newBubble.points = Math.floor(Math.random() * 3) + 1;
        
        if (newBubble.x < newBubble.radius) newBubble.x = newBubble.radius;
        if (newBubble.x > this.width - newBubble.radius) newBubble.x = this.width - newBubble.radius;
        if (newBubble.y < newBubble.radius) newBubble.y = newBubble.radius;
        
        this.bubbles.push(newBubble);
    }
    
    // ===== ЗВУК =====
    sound.bonusHappy();
}
    
popBubble(x, y) {
    let popped = false;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (b.contains(x, y)) {
            
           if (b.isGolden) {
    this.lastPopTime = Date.now();
    this.combo++;
    if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
    }
    
    // ===== МНОЖИТЕЛЬ РАБОТАЕТ! =====
    const bonusMultiplier = this.bonusManager.getMultiplier();
    const earned = 100 * this.multiplier * bonusMultiplier;
    this.pendingScore += earned;
    
    this.scorePopups.push({
        x: b.x,
        y: b.y - 30,
        text: `⭐ +${earned}`,
        subtext: this.multiplier > 1 ? `×${this.multiplier}` : '',
        life: 70,
        maxLife: 70,
        hue: 45,
        big: true,
        customColor: '#ffd700'
    });
    
    // Частицы (золотые)
    for (let j = 0; j < 30; j++) {
        const p = new Particle(b.x, b.y, 45, 1);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 2;
        p.radius = 2 + Math.random() * 4;
        p.hue = 45 + (Math.random() - 0.5) * 20;
        p.life = 40 + Math.random() * 30;
        p.maxLife = 70;
        p.gravity = 0.06;
        this.particles.push(p);
    }
    
    // 8-15 случайных шаров
    const count = 8 + Math.floor(Math.random() * 8);
    const colors = ['red', 'yellow', 'green', 'blue', 'pink'];
    const hueMap = { 'red': 0, 'yellow': 45, 'green': 120, 'blue': 200, 'pink': 320 };
    
    for (let j = 0; j < Math.min(count, 40 - this.bubbles.length); j++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const newBubble = new Bubble(this.width, this.height);
        newBubble.radius = 15 + Math.random() * 25;
        newBubble.hue = hueMap[color] + (Math.random() - 0.5) * 20;
        if (newBubble.hue < 0) newBubble.hue += 360;
        if (newBubble.hue >= 360) newBubble.hue -= 360;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 60;
        newBubble.x = b.x + Math.cos(angle) * distance;
        newBubble.y = b.y + Math.sin(angle) * distance;
        newBubble.speed = 0.3 + Math.random() * 0.5;
        newBubble.points = Math.floor(Math.random() * 3) + 1;
        
        if (newBubble.x < newBubble.radius) newBubble.x = newBubble.radius;
        if (newBubble.x > this.width - newBubble.radius) newBubble.x = this.width - newBubble.radius;
        if (newBubble.y < newBubble.radius) newBubble.y = newBubble.radius;
        
        this.bubbles.push(newBubble);
    }
    
    this.bubbles.splice(i, 1);
    this.totalPopped++;
    sound.bonusHappy();
    return true;
}
            
            const now = Date.now();
            const timeSinceLastPop = now - this.lastPopTime;
            
            if (timeSinceLastPop > this.comboTimeout && this.lastPopTime > 0) {
                console.log('⏰ ТАЙМАУТ! Сбрасываем серию');
                sound.comboReset();
                this.combo = 0;
                this.multiplier = 1;
                this.flushScore();
            }
            
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            if (this.combo <= 3) this.multiplier = this.combo;
            else if (this.combo <= 6) this.multiplier = 3 + Math.floor((this.combo - 3) / 2);
            else this.multiplier = 5 + Math.floor((this.combo - 6) / 3);
            this.multiplier = Math.min(this.multiplier, 20);
            
            const bonusMultiplier = this.bonusManager.getMultiplier();
            const points = b.points || 1;
            const earned = points * this.multiplier * bonusMultiplier;
            this.pendingScore += earned;
            this.lastPopTime = now;
            
            // ===== ЗВУК =====
            var colorTypeSound = this.bonusManager.getColorType(b.hue);
            
            if (this.combo > 1) {
                if (colorTypeSound) {
                    sound.popByColorWithCombo(colorTypeSound, this.combo, 0.3);
                } else {
                    var pitch = 600 + b.points * 60 + this.combo * 20;
                    sound.pop(pitch, 0.15, 0.3);
                }
            } else {
                if (colorTypeSound) {
                    sound.popByColor(colorTypeSound, 0.3);
                } else {
                    var pitch = 600 + b.points * 60;
                    sound.pop(pitch, 0.15, 0.3);
                }
            }
            
            this.scorePopups.push({
                x: b.x,
                y: b.y - 10,
                text: `+${earned}`,
                subtext: this.multiplier > 1 ? `×${this.multiplier}` : '',
                life: 60,
                maxLife: 60,
                hue: b.hue
            });
            
            const count = 8 + Math.floor(Math.random() * 12) + Math.floor(this.combo / 3);
            for (let j = 0; j < count; j++) {
                this.particles.push(new Particle(b.x, b.y, b.hue, 1 + this.combo * 0.05));
            }
            
            this.bonusManager.onBubblePopped(b);
            
            const colorType = this.bonusManager.getColorType(b.hue);
            if (colorType) {
                statsManager.onBubblePopped(colorType);
            }
            statsManager.onCombo(this.combo);
            statsManager.onScore(this.score);
            
            challengeTracker.onBubblePopped(b, this);
            
            if (this.combo >= 10 && this.combo % 10 === 0) {
                challengeTracker.onCombo(this.combo);
            }
            
            this.bubbles.splice(i, 1);
            this.totalPopped++;
            popped = true;
            
            this.splitBubble(b);
            
            break;
        }
    }
    
    if (!popped) {
        console.log('❌ ПРОМАХ!');
        sound.missSound();
        this.combo = 0;
        this.multiplier = 1;
        this.flushScore();
        this.bonusManager.resetCounters();
        this.bonusManager.currentColor = null;
        this.bonusManager.comboCount = 0;
        challengeTracker.onMiss();
    }
    
    return popped;
}
    
splitBubble(bubble) {
    // ===== ЗОЛОТОЙ ШАР НЕ РАСПАДАЕТСЯ =====
    if (bubble.isGolden) return;
    
    var colorType = this.bonusManager.getColorType(bubble.hue);
    if (!colorType) return;
    if (this.bubbles.length >= 40) return;
    
    var options = this.getSplitOptions(colorType);
    if (!options || options.children.length === 0) return;
    
    // ===== СТАНДАРТНЫЕ РАЗМЕРЫ И ОЧКИ ДЛЯ ЦВЕТОВ =====
    var sizeMap = {
        'red': { min: 40, max: 55, points: 1 },
        'yellow': { min: 30, max: 45, points: 2 },
        'green': { min: 22, max: 35, points: 4 },
        'blue': { min: 16, max: 25, points: 7 },
        'pink': { min: 12, max: 18, points: 10 }
    };
    
    var maxNew = Math.min(options.children.length, 40 - this.bubbles.length);
    for (var s = 0; s < maxNew; s++) {
        var childColor = options.children[s];
        var newBubble = new Bubble(this.width, this.height);
        
        // ===== РАЗМЕР ПО ЦВЕТУ =====
        var size = sizeMap[childColor] || { min: 20, max: 30, points: 3 };
        newBubble.radius = size.min + Math.random() * (size.max - size.min);
        
        // ===== ОЧКИ ПО ЦВЕТУ (СВОИ!) =====
        newBubble.points = size.points;
        
        // Цвет
        var hueMap = { 'red': 0, 'yellow': 45, 'green': 120, 'blue': 200, 'pink': 320 };
        newBubble.hue = hueMap[childColor] + (Math.random() - 0.5) * 20;
        if (newBubble.hue < 0) newBubble.hue += 360;
        if (newBubble.hue >= 360) newBubble.hue -= 360;
        
        // Позиция с разлётом
        var angle = Math.random() * Math.PI * 2;
        var distance = 20 + Math.random() * 30;
        newBubble.x = bubble.x + Math.cos(angle) * distance;
        newBubble.y = bubble.y + Math.sin(angle) * distance;
        newBubble.speed = bubble.speed * (0.7 + Math.random() * 0.6);
        
        this.bubbles.push(newBubble);
    }
}

getSplitOptions(colorType) {
    var options = {
        'red': [
            { children: ['yellow', 'green'], chance: 0.25 },
            { children: ['green', 'blue', 'pink'], chance: 0.20 },
            { children: ['yellow', 'blue'], chance: 0.20 },
            { children: ['green', 'pink'], chance: 0.20 },
            { children: ['blue', 'pink'], chance: 0.10 },
            { children: [], chance: 0.05 }
        ],
        'yellow': [
            { children: ['green'], chance: 0.30 },
            { children: ['blue', 'pink'], chance: 0.25 },
            { children: ['green', 'blue'], chance: 0.20 },
            { children: ['pink'], chance: 0.15 },
            { children: [], chance: 0.10 }
        ],
        'green': [
            { children: ['blue'], chance: 0.35 },
            { children: ['pink'], chance: 0.30 },
            { children: ['blue', 'pink'], chance: 0.15 },
            { children: [], chance: 0.20 }
        ],
        'blue': [
            { children: ['pink'], chance: 0.25 },
            { children: [], chance: 0.75 }
        ],
        'pink': [
            { children: [], chance: 1.00 }
        ]
    };
    
    var colorOptions = options[colorType] || [];
    var rand = Math.random();
    var cumulative = 0;
    
    for (var i = 0; i < colorOptions.length; i++) {
        cumulative += colorOptions[i].chance;
        if (rand < cumulative) {
            return colorOptions[i];
        }
    }
    return colorOptions[colorOptions.length - 1] || { children: [], chance: 1 };
}  
    
    
popBubbleAt(x, y, isBonus = false) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (b.contains(x, y)) {
            
             // ===== ЗОЛОТОЙ ШАР НЕ ТРОГАЕМ БОНУСАМИ =====
            if (b.isGolden) {
                return false;
            }
            // ===== ОБНОВЛЯЕМ ВРЕМЯ ПОСЛЕДНЕГО ЛОПАНИЯ =====
            this.lastPopTime = Date.now();
            
            // ===== ЗВУК ПРИ ЛОПАНИИ (ДАЖЕ БОНУСНОМ) =====
            var colorTypeSound = this.bonusManager.getColorType(b.hue);
            if (colorTypeSound) {
                sound.popByColor(colorTypeSound, 0.2);
            } else {
                var pitch = 600 + b.points * 60;
                sound.pop(pitch, 0.12, 0.2);
            }
            
            const count = 8 + Math.floor(Math.random() * 12);
            for (let j = 0; j < count; j++) {
                this.particles.push(new Particle(b.x, b.y, b.hue, 1));
            }
            
            if (isBonus) {
                const points = b.points || 1;
                const bonusMultiplier = this.bonusManager.getMultiplier();
                const earned = points * this.multiplier * bonusMultiplier;
                this.pendingScore += earned;
                this.score += earned;
                
                this.combo++;
                if (this.combo > this.maxCombo) {
                    this.maxCombo = this.combo;
                }
                
                this.bonusManager.processBonusPopped(b);
                
                this.scorePopups.push({
                    x: b.x,
                    y: b.y - 10,
                    text: `+${earned}`,
                    subtext: this.multiplier > 1 ? `×${this.multiplier}` : '',
                    life: 50,
                    maxLife: 50,
                    hue: b.hue
                });
            }
            
            this.bubbles.splice(i, 1);
            this.totalPopped++;
            return true;
        }
    }
    return false;
}

    flushScore() {
        if (this.pendingScore > 0) {
            let bonus = 0;
            if (this.pendingScore > 10) {
                bonus = Math.floor(this.pendingScore * 0.1);
            }
            
            const total = this.pendingScore + bonus;
            this.score += total;
            
            // ===== ИСПЫТАНИЯ: БОЛЬШОЙ БОНУС =====
            challengeTracker.onBigBonus(total);
            
            if (total > 0) {
                
                
                this.scorePopups.push({
                    x: this.width / 2,
                    y: this.height / 2 - 60,
                    text: `💎 +${total}`,
                    subtext: bonus > 0 ? `(бонус +${bonus})` : '',
                    life: 80,
                    maxLife: 80,
                    hue: 50,
                    big: true
                });
            }
            
            this.pendingScore = 0;
        }
    }

  update() {
    this.frame++;
    this.difficulty = 1 + this.score / 80;
    
    this.bonusManager.applyToAllBubbles(this.bubbles);
    
    if (this.bubbles.length > 40) {
        this.bubbles.splice(0, 3);
    }
    
    const currentSpawnRate = Math.max(8, Math.floor(25 / this.difficulty));
    if (this.frame % currentSpawnRate === 0) {
        const b = this.spawnBubble();
        if (b && this.bubbles.length < 35) {
            this.bubbles.push(b);
        }
        if (this.difficulty > 2 && Math.random() < 0.15 && this.bubbles.length < 35) {
            const b2 = this.spawnBubble();
            if (b2) {
                this.bubbles.push(b2);
            }
        }
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
        this.bubbles[i].update();
        if (!this.bubbles[i].alive) {
            this.bubbles.splice(i, 1);
        }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].isDead()) {
            this.particles.splice(i, 1);
        }
    }

    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
        this.scorePopups[i].life--;
        this.scorePopups[i].y -= 0.8;
        if (this.scorePopups[i].life <= 0) {
            this.scorePopups.splice(i, 1);
        }
    }

    this.bonusManager.update();

    // ===== СБРОС СЕРИИ ПО ТАЙМАУТУ =====
    if (this.pendingScore > 0 && Date.now() - this.lastPopTime > this.comboTimeout) {
        console.log('⏰ ТАЙМАУТ! Сбрасываем серию в update()');
        sound.comboReset();  // ← ЗВУК СБРОСА СЕРИИ
        this.flushScore();
    }
          for (let i = this.flyingNumbers.length - 1; i >= 0; i--) {
        const fn = this.flyingNumbers[i];
        
        // Двигаем к цели
        const dx = fn.targetX - fn.x;
        const dy = fn.targetY - fn.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 5) {
            // Долетели
            fn.x = fn.targetX;
            fn.y = fn.targetY;
            fn.life--;
            if (fn.life <= 0) {
                this.flyingNumbers.splice(i, 1);
                // ===== ПУЛЬСАЦИЯ ПРИ ДОСТИЖЕНИИ =====
                this.triggerPulse(fn.isMultiplier);
            }
        } else {
            // Летим
            const speed = Math.min(fn.speed, dist);
            fn.x += (dx / dist) * speed;
            fn.y += (dy / dist) * speed;
            fn.life--;
            if (fn.life <= 0) {
                this.flyingNumbers.splice(i, 1);
            }
        }
    }
}

    drawPopups(ctx) {
        for (const popup of this.scorePopups) {
            const alpha = popup.life / popup.maxLife;
            const scale = 1 + (1 - alpha) * 0.3;
            const fontSize = popup.big ? 42 : 26;
            
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${fontSize * scale}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (popup.customColor) {
                ctx.shadowColor = popup.customColor + '66';
                ctx.fillStyle = popup.customColor;
            } else {
                ctx.shadowColor = `hsla(${popup.hue}, 100%, 50%, 0.3)`;
                ctx.fillStyle = `hsl(${popup.hue}, 100%, 70%)`;
            }
            
            ctx.shadowBlur = 30;
            ctx.fillText(popup.text, popup.x, popup.y);
            
            if (popup.subtext) {
                ctx.font = `${16 * scale}px 'Segoe UI', sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(popup.subtext, popup.x, popup.y + 30 * scale);
            }
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a2a');
        grad.addColorStop(0.5, '#1a0a3a');
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 80; i++) {
                this._stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: 0.5 + Math.random() * 1.5,
                    a: 0.2 + Math.random() * 0.5
                });
            }
        }
        for (const star of this._stars) {
            ctx.globalAlpha = star.a;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const b of this.bubbles) {
            b.draw(ctx);
        }

        for (const p of this.particles) {
            p.draw(ctx);
        }

        this.drawPopups(ctx);
        
            for (const fn of this.flyingNumbers) {
        const alpha = fn.life / fn.maxLife;
        const scale = 1 + (1 - alpha) * 0.3;
        
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${28 * scale}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = fn.color + '66';
        ctx.shadowBlur = 20;
        ctx.fillStyle = fn.color;
        ctx.fillText(fn.text, fn.x, fn.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
        
    }

    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            maxMultiplier: this.maxMultiplier,
            
            totalPopped: this.totalPopped,
            bubbles: this.bubbles.length,
            particles: this.particles.length,
            difficulty: this.difficulty,
            pendingScore: this.pendingScore,
            multiplier: this.multiplier
        };
    }

    handleTap(x, y) {
        if (this.bonusManager.isSelectingColor()) {
            if (this.bonusManager.handleColorSelection(x, y)) {
                return;
            }
            return;
        }
        
        this.popBubble(x, y);
    }
    
saveGameResult(callback) {
    console.log('💾 СОХРАНЕНИЕ РЕЗУЛЬТАТА...');
    
    // Обновляем максимальный счёт
    statsManager.onScore(this.score);
    
    // Сохраняем статистику
    statsManager.save().then((success) => {
        console.log('✅ Статистика сохранена:', success);
        
        // Сохраняем в топ через repository
        const challengePoints = challengeTracker.getTotalRewards();
        const userId = statsManager.userId || localStorage.getItem('bubbleUserId');
        
        console.log('📊 Сохраняем в топ: userId=' + userId + ', score=' + this.score + ', combo=' + this.maxCombo + ', points=' + challengePoints + ', popped=' + this.totalPopped);
        
        repository.saveToTop(
            userId,
            this.score,
            this.maxCombo,
            challengePoints,
            this.totalPopped
        ).then((result) => {
            console.log('✅ Топ сохранён:', result);
            if (callback) callback(true);
        }).catch((error) => {
            console.error('❌ Ошибка сохранения топа:', error);
            if (callback) callback(false);
        });
    }).catch((error) => {
        console.error('❌ Ошибка сохранения статистики:', error);
        if (callback) callback(false);
    });
}
    triggerPulse(isMultiplier) {
    if (isMultiplier) {
        // Пульсация множителя
        const el = document.getElementById('multiplier');
        if (el) {
            el.style.transition = 'transform 0.1s ease';
            el.style.transform = 'scale(1.5)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 150);
        }
    } else {
        // Пульсация pendingScore
        const el = document.getElementById('pendingScore');
        if (el) {
            el.style.transition = 'transform 0.1s ease';
            el.style.transform = 'scale(1.5)';
            el.style.color = '#44ff88';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
                el.style.color = '#ffcc00';
            }, 150);
        }
    }
}
}
