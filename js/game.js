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
        
        // Испытания
        challengeTracker.newGame();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.bonusManager.updateUI();
        
         // =====  ОТПРАВКА В ТОП ПРИ ЗАВЕРШЕНИИ =====
    // Сохраняем результат при выходе
    this._originalSaveResult = this.saveGameResult.bind(this);
    this.saveGameResult = this.saveGameResult.bind(this);
        
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
                
                // ===== БОНУСЫ =====
                this.bonusManager.onBubblePopped(b);
                
                // ===== ИСПЫТАНИЯ =====
                challengeTracker.onBubblePopped(b, this);
                
                // ===== КОМБО ДЛЯ ИСПЫТАНИЙ =====
                if (this.combo >= 10 && this.combo % 10 === 0) {
                    challengeTracker.onCombo(this.combo);
                }
                
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
            this.bonusManager.resetCounters();
            this.bonusManager.currentColor = null;
            this.bonusManager.comboCount = 0;
            
            // ===== ИСПЫТАНИЯ: ПРОМАХ =====
            challengeTracker.onMiss();
        }
        
        return popped;
    }

    popBubbleAt(x, y, isBonus = false) {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (b.contains(x, y)) {
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
        if (this.bonusManager.isSelectingColor()) {
            if (this.bonusManager.handleColorSelection(x, y)) {
                return;
            }
            return;
        }
        
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
    
    // ===== НОВОЕ: СОХРАНЕНИЕ В ЛОКАЛЬНЫЙ ТОП =====
    let top = JSON.parse(localStorage.getItem('bubbleTop') || '[]');
    top.push(result);
    top.sort((a, b) => b.score - a.score);
    if (top.length > 20) {
        top = top.slice(0, 20);
    }
    localStorage.setItem('bubbleTop', JSON.stringify(top));
    // =============================================
    
    // ===== ОТПРАВКА В ГЛОБАЛЬНЫЙ ТОП =====
    const challengePoints = challengeTracker.getTotalRewards();
    vk.saveToGlobalTop(this.score, this.maxCombo, challengePoints);
    // ============================================
}
}
