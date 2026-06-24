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
        this.lastPopTime = 0;
        this.comboTimeout = 2000;
        this.isProcessing = false;
        this.scorePopups = [];
        
        this.spawnRate = 20;
        this.frame = 0;
        this.isRunning = true;
        this.difficulty = 1;
        
        // Бонусы
        this.bonusManager = new BonusManager(this);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Обновляем UI бонусов
        this.bonusManager.updateUI();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    spawnBubble() {
        const types = [
            { radius: 12, points: 10, hue: 320, weight: 15 },   // Розовый
            { radius: 18, points: 7, hue: 200, weight: 20 },    // Синий
            { radius: 26, points: 4, hue: 120, weight: 25 },    // Зелёный
            { radius: 36, points: 2, hue: 45, weight: 25 },     // Золотой
            { radius: 50, points: 1, hue: 0, weight: 15 }       // Красный
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
        
        // Применяем эффекты бонусов
        this.bonusManager.applyEffects(b);
        
        return b;
    }

  popBubble(x, y) {
    let popped = false;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (b.contains(x, y)) {
            const now = Date.now();
            const timeSinceLastPop = now - this.lastPopTime;
            
            if (timeSinceLastPop > this.comboTimeout && this.lastPopTime > 0) {
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
            
            // Применяем бонусный множитель
            const bonusMultiplier = this.bonusManager.getMultiplier();
            const points = b.points || 1;
            const earned = points * this.multiplier * bonusMultiplier;
            this.pendingScore += earned;
            this.lastPopTime = now;
            
            // ===== ЗВУК =====
            if (this.combo > 1) {
                sound.combo(Math.min(this.combo, 10));
            } else {
                const pitch = 600 + b.points * 60;
                sound.pop(pitch, 0.15, 0.3);
            }
            
            // Всплывающая надпись
            this.scorePopups.push({
                x: b.x,
                y: b.y - 10,
                text: `+${earned}`,
                subtext: this.multiplier > 1 ? `×${this.multiplier}` : '',
                life: 60,
                maxLife: 60,
                hue: b.hue
            });
            
            // Частицы
            const count = 8 + Math.floor(Math.random() * 12) + Math.floor(this.combo / 3);
            for (let j = 0; j < count; j++) {
                this.particles.push(new Particle(b.x, b.y, b.hue, 1 + this.combo * 0.05));
            }
            
            // ===== НАКОПЛЕНИЕ БОНУСОВ (НОВАЯ МЕХАНИКА) =====
            // Проверяем, достиг ли игрок порога для получения бонуса
            this.bonusManager.onBubblePopped(b);
            
            this.bubbles.splice(i, 1);
            this.totalPopped++;
            popped = true;
            break;
        }
    }
    
    if (!popped) {
        sound.miss();
        this.combo = 0;
        this.multiplier = 1;
        this.flushScore();
        // Сбрасываем счётчики бонусов при промахе
        this.bonusManager.resetCounters();
        this.bonusManager.currentColor = null;
        this.bonusManager.comboCount = 0;
    }
    
    return popped;
}
    
    // Лопнуть пузырёк по координатам (для бонусов)
// ===== ЛОПНУТЬ ПУЗЫРЁК ПО КООРДИНАТАМ (ДЛЯ БОНУСОВ) =====
popBubbleAt(x, y, isBonus = false) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (b.contains(x, y)) {
            // Создаём частицы
            const count = 8 + Math.floor(Math.random() * 12);
            for (let j = 0; j < count; j++) {
                this.particles.push(new Particle(b.x, b.y, b.hue, 1));
            }
            
            if (isBonus) {
                // ===== ДАЁМ ОЧКИ =====
                const points = b.points || 1;
                const bonusMultiplier = this.bonusManager.getMultiplier();
                const earned = points * this.multiplier * bonusMultiplier;
                this.pendingScore += earned;
                this.score += earned;
                
                // ===== УВЕЛИЧИВАЕМ КОМБО =====
                this.combo++;
                if (this.combo > this.maxCombo) {
                    this.maxCombo = this.combo;
                }
                
                // ===== НАКАПЛИВАЕМ БОНУС (НОВОЕ!) =====
                this.bonusManager.processBonusPopped(b);
                
                // Всплывающая надпись
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
            
            if (total > 0) {
                sound.bonus();
                
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
        
         // ===== ПРИМЕНЯЕМ ЭФФЕКТЫ БОНУСОВ КО ВСЕМ ПУЗЫРЬКАМ =====
         this.bonusManager.applyToAllBubbles(this.bubbles);
        
        // Ограничение количества пузырьков
        if (this.bubbles.length > 40) {
            this.bubbles.splice(0, 3);
        }
        
        // Спавн
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

        // Обновление пузырьков
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            this.bubbles[i].update();
            if (!this.bubbles[i].alive) {
                this.bubbles.splice(i, 1);
            }
        }

        // Обновление частиц
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }

        // Обновление всплывающих надписей
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].life--;
            this.scorePopups[i].y -= 0.8;
            if (this.scorePopups[i].life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }

        // Обновление бонусов
        this.bonusManager.update();

        // Автоматическое зачисление очков
        if (this.pendingScore > 0 && Date.now() - this.lastPopTime > this.comboTimeout) {
            this.flushScore();
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

        // Фон
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a2a');
        grad.addColorStop(0.5, '#1a0a3a');
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Звёзды
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

        // Пузырьки
        for (const b of this.bubbles) {
            b.draw(ctx);
        }

        // Частицы
        for (const p of this.particles) {
            p.draw(ctx);
        }

        // Всплывающие надписи
        this.drawPopups(ctx);
    }

    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            totalPopped: this.totalPopped,
            bubbles: this.bubbles.length,
            particles: this.particles.length,
            difficulty: this.difficulty,
            pendingScore: this.pendingScore,
            multiplier: this.multiplier
        };
    }

    handleTap(x, y) {
        // Сначала проверяем режим выбора цвета для бонуса
        if (this.bonusManager.isSelectingColor()) {
            if (this.bonusManager.handleColorSelection(x, y)) {
                return;
            }
            return;
        }
        
        // Обычный клик
        this.popBubble(x, y);
    }
    
    saveGameResult() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU');
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        const result = {
            date: `${dateStr} ${timeStr}`,
            score: this.score,
            maxCombo: this.maxCombo,
            maxMultiplier: this.multiplier,
            totalPopped: this.totalPopped,
            bestBonus: this._bestBonus || 0
        };
        
        let top = JSON.parse(localStorage.getItem('bubbleTop') || '[]');
        top.push(result);
        top.sort((a, b) => b.score - a.score);
        if (top.length > 20) {
            top = top.slice(0, 20);
        }
        localStorage.setItem('bubbleTop', JSON.stringify(top));
    }
}