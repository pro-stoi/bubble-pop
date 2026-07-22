// js/bonus.js

class BonusManager {
    constructor(game) {
        this.game = game;
        this.bonuses = {
            red: { name: 'Замедление', count: 0, maxCount: 8, color: '#ff4444', icon: '🐢' },
            yellow: { name: 'Магнит', count: 0, maxCount: 8, color: '#ffcc00', icon: '🧲' },
            green: { name: 'Цветной взрыв', count: 0, maxCount: 8, color: '#44ff44', icon: '🎯' },
            blue: { name: 'Умножение', count: 0, maxCount: 8, color: '#4488ff', icon: '⚡' },
            pink: { name: 'Всё поле', count: 0, maxCount: 8, color: '#ff44ff', icon: '💥' }
        };
        
        this.colorCounters = {
            pink: 0,
            blue: 0,
            green: 0,
            yellow: 0,
            red: 0
        };
        this.requiredHits = 8;
        this.currentColor = null;
        this.comboCount = 0;
        
        this.multiplierBonus = 1;
        this.multiplierTimer = 0;
        this.slowMotion = false;
        this.slowMotionTimer = 0;
        this.isColorSelectionMode = false;
        this.selectedBonusType = null;
         // ===== РЕГИСТРИРУЕМ СЕБЯ В ГЛОБАЛЬНОМ ОБЪЕКТЕ =====
    window.bonusManager = this;
        
    }

    // ===== ОБРАБОТКА ЛОПАНИЯ ПУЗЫРЬКА (ВРУЧНУЮ) =====
    onBubblePopped(bubble) {
        let colorType = this.getColorType(bubble.hue);
        if (!colorType) return false;
        
        if (this.currentColor !== colorType) {
            this.currentColor = colorType;
            this.comboCount = 0;
            this.resetCounters();
        }
        
        this.comboCount++;
        this.colorCounters[colorType] = (this.colorCounters[colorType] || 0) + 1;
        this.updateUI();
        
        // Проверяем, не достиг ли максимума (8)
        if (this.bonuses[colorType].count >= this.bonuses[colorType].maxCount) {
            this.colorCounters[colorType] = 0;
            this.updateUI();
            return false;
        }
        
        if (this.colorCounters[colorType] >= this.requiredHits) {
            this.addBonus(colorType);
            this.colorCounters[colorType] = 0;
            this.updateUI();
            
            const icon = this.bonuses[colorType].icon;
            this.game.scorePopups.push({
                x: this.game.width / 2,
                y: this.game.height / 2,
                text: `🎉 Бонус ${icon}!`,
                subtext: `+1 ${this.bonuses[colorType].name}`,
                life: 70,
                maxLife: 70,
                hue: 0,
                big: true,
                customColor: this.bonuses[colorType].color
            });
            
            sound.bonus();
            return true;
        }
        return false;
    }

    // ===== ОБРАБОТКА ЛОПАНИЯ ОТ БОНУСОВ (МАССОВО) =====
    processBonusPopped(bubble) {
        let colorType = this.getColorType(bubble.hue);
        if (!colorType) return false;
        
        if (this.currentColor !== colorType) {
            this.currentColor = colorType;
            this.comboCount = 0;
            this.resetCounters();
        }
        
        this.comboCount++;
        this.colorCounters[colorType] = (this.colorCounters[colorType] || 0) + 1;
        this.updateUI();
        
        if (this.bonuses[colorType].count >= this.bonuses[colorType].maxCount) {
            this.colorCounters[colorType] = 0;
            this.updateUI();
            return false;
        }
        
        if (this.colorCounters[colorType] >= this.requiredHits) {
            this.addBonus(colorType);
            this.colorCounters[colorType] = 0;
            this.updateUI();
            
            const icon = this.bonuses[colorType].icon;
            this.game.scorePopups.push({
                x: this.game.width / 2,
                y: this.game.height / 2,
                text: `🎉 Бонус ${icon}! (бонусная цепь!)`,
                subtext: `+1 ${this.bonuses[colorType].name}`,
                life: 70,
                maxLife: 70,
                hue: 0,
                big: true,
                customColor: this.bonuses[colorType].color
            });
            
            sound.bonus();
            return true;
        }
        return false;
    }

    // ===== ОПРЕДЕЛЕНИЕ ЦВЕТА ПО ОТТЕНКУ =====
    getColorType(hue) {
        if (hue >= 300 && hue <= 340) return 'pink';
        if (hue >= 180 && hue <= 220) return 'blue';
        if (hue >= 100 && hue <= 140) return 'green';
        if (hue >= 25 && hue <= 65) return 'yellow';
        if (hue >= 340 || hue <= 20) return 'red';
        return null;
    }

    // ===== СБРОС ВСЕХ СЧЁТЧИКОВ =====
    resetCounters() {
        for (const key in this.colorCounters) {
            this.colorCounters[key] = 0;
        }
        this.updateUI();
    }

    // ===== ДОБАВИТЬ БОНУС =====
    addBonus(type) {
        if (this.bonuses[type] && this.bonuses[type].count < this.bonuses[type].maxCount) {
            this.bonuses[type].count++;
            if (typeof statsManager !== 'undefined') {
                statsManager.onBonusEarned(type);
            }
            this.updateUI();
            return true;
        }
        return false;
    }

    // ===== ИСПОЛЬЗОВАТЬ БОНУС =====
    useBonus(type) {
        const bonus = this.bonuses[type];
        if (!bonus || bonus.count <= 0) return false;

        bonus.count--;
        if (typeof statsManager !== 'undefined') {
            statsManager.onBonusUsed(type);
        }
        this.updateUI();

        switch(type) {
            case 'red':
                this.activateSlowMotion();
                break;
            case 'yellow':
                this.activateMagnet();
                break;
            case 'green':
                this.activateColorExplosion();
                break;
            case 'blue':
                this.activateMultiplier();
                break;
            case 'pink':
                this.activateFullClear();
                break;
        }
        sound.bonus();
        return true;
    }

    // ===== 🔴 ЗАМЕДЛЕНИЕ =====
    activateSlowMotion() {
        this.slowMotion = true;
        this.slowMotionTimer = 300;
        this.showEffect('🐢 ВСЕ ОСТАНОВИЛИСЬ!', '#ff4444');
    }

    // ===== 🟡 МАГНИТ =====
    activateMagnet() {
        this.isColorSelectionMode = true;
        this.selectedBonusType = 'magnet';
        const hint = document.getElementById('bonusHint');
        if (hint) {
            hint.textContent = '🧲 Нажми на пузырёк для магнита!';
            hint.style.display = 'block';
        }
        this.showEffect('🧲 Нажми на пузырёк!', '#ffcc00');
    }

    // ===== 🟢 ЦВЕТНОЙ ВЗРЫВ =====
    activateColorExplosion() {
        this.isColorSelectionMode = true;
        this.selectedBonusType = 'color_explosion';
        const hint = document.getElementById('bonusHint');
        if (hint) {
            hint.textContent = '🎯 Нажми на пузырёк для взрыва цвета!';
            hint.style.display = 'block';
        }
        this.showEffect('🎯 Нажми на пузырёк!', '#44ff44');
    }

    // ===== 🔵 УМНОЖЕНИЕ x5 =====
    activateMultiplier() {
        this.multiplierBonus *= 3;
        const MAX_MULTIPLIER = 20;
        if (this.multiplierBonus > MAX_MULTIPLIER) {
            this.multiplierBonus = MAX_MULTIPLIER;
        }
        this.multiplierTimer = 300;
        this.showEffect(`⚡ x${this.multiplierBonus}!`, '#4488ff');
    }

    // ===== 🟣 ЛОПНУТЬ ВСЁ ПОЛЕ =====
    activateFullClear() {
        const count = this.game.bubbles.length;
        for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
            const b = this.game.bubbles[i];
            this.game.popBubbleAt(b.x, b.y, true);
        }
        this.showEffect(`💥 ${count} пузырьков!`, '#ff44ff');
    }

    // ===== ОБРАБОТКА ВЫБОРА ЦВЕТА =====
    handleColorSelection(x, y) {
        if (!this.isColorSelectionMode) return false;
        
        for (const b of this.game.bubbles) {
            if (b.contains(x, y)) {
                const hint = document.getElementById('bonusHint');
                if (hint) hint.style.display = 'none';
                
                if (this.selectedBonusType === 'magnet') {
                    const radius = 250;
                    let count = 0;
                    for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
                        const target = this.game.bubbles[i];
                        const dx = target.x - b.x;
                        const dy = target.y - b.y;
                        if (dx*dx + dy*dy < radius*radius) {
                            this.game.popBubbleAt(target.x, target.y, true);
                            count++;
                        }
                    }
                    this.showEffect(`🧲 ${count} пузырьков!`, '#ffcc00');
                    
                } else if (this.selectedBonusType === 'color_explosion') {
                    const targetHue = b.hue;
                    let count = 0;
                    for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
                        const target = this.game.bubbles[i];
                        if (Math.abs(target.hue - targetHue) < 20) {
                            this.game.popBubbleAt(target.x, target.y, true);
                            count++;
                        }
                    }
                    this.showEffect(`🎯 ${count} пузырьков!`, '#44ff44');
                }
                
                this.isColorSelectionMode = false;
                this.selectedBonusType = null;
                return true;
            }
        }
        
        this.showEffect('❌ Промах!', '#ff4444');
        return false;
    }

    // ===== ПОКАЗАТЬ ЭФФЕКТ =====
    showEffect(text, color) {
        this.game.scorePopups.push({
            x: this.game.width / 2,
            y: this.game.height / 2 - 80,
            text: text,
            subtext: '',
            life: 70,
            maxLife: 70,
            hue: 0,
            big: true,
            customColor: color
        });
    }

    // ===== МОДАЛКА ДЛЯ ПОЛУЧЕНИЯ ПЕРВОГО БОНУСА =====
    showBonusAdModal(type) {
        const modal = document.getElementById('bonusAdModal');
        if (!modal) {
            this.createBonusModal();
            return;
        }
        const title = document.getElementById('bonusAdModalTitle');
        const desc = document.getElementById('bonusAdModalDesc');
        if (title) title.textContent = '🎁 Получи бонус!';
        if (desc) desc.textContent = 'Посмотри рекламу и получи 1 бонус!';
        modal.dataset.bonusType = type;
        modal.style.display = 'flex';
    }

   createBonusModal() {
    if (document.getElementById('bonusAdModal')) return;
    const self = this;  // ← СОХРАНЯЕМ ССЫЛКУ
    
    const modal = document.createElement('div');
    modal.id = 'bonusAdModal';
    modal.className = 'exit-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="exit-modal-content" style="max-width:340px;padding:24px 28px;">
            <div class="exit-modal-title" id="bonusAdModalTitle" style="font-size:20px;">🎁 Получи бонус!</div>
            <div style="padding:12px 0;color:rgba(255,255,255,0.7);font-size:15px;line-height:1.5;" id="bonusAdModalDesc">
                Посмотри рекламу и получи 1 бонус!
            </div>
            <div class="exit-modal-buttons" style="display:flex;gap:10px;margin-top:12px;">
                <button class="exit-modal-btn exit-modal-btn-back" id="bonusAdModalCancel" style="flex:1;padding:12px;font-size:14px;">
                    ❌ Отмена
                </button>
                <button class="exit-modal-btn exit-modal-btn-exit" id="bonusAdModalConfirm" style="flex:1;padding:12px;font-size:14px;background:linear-gradient(135deg,#ffcc00,#f0a500);color:#000;border-color:rgba(255,200,0,0.3);">
                    ✅ Смотреть
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('bonusAdModalCancel').addEventListener('click', function() {
        const m = document.getElementById('bonusAdModal');
        if (m) m.style.display = 'none';
    });
    document.getElementById('bonusAdModalCancel').addEventListener('touchend', function(e) {
        e.preventDefault();
        const m = document.getElementById('bonusAdModal');
        if (m) m.style.display = 'none';
    });
    
    document.getElementById('bonusAdModalConfirm').addEventListener('click', function() {
        const m = document.getElementById('bonusAdModal');
        if (m) {
            const type = m.dataset.bonusType;
            m.style.display = 'none';
            self.handleAdWatched(type);  // ← ИСПОЛЬЗУЕМ self
        }
    });
    document.getElementById('bonusAdModalConfirm').addEventListener('touchend', function(e) {
        e.preventDefault();
        const m = document.getElementById('bonusAdModal');
        if (m) {
            const type = m.dataset.bonusType;
            m.style.display = 'none';
            self.handleAdWatched(type);  // ← ИСПОЛЬЗУЕМ self
        }
    });
}

handleAdWatched(type) {
    // Если есть VK Bridge — показываем рекламу
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'rewarded' })
            .then(() => {
                this.onAdWatched(type);
            })
            .catch((error) => {
                console.warn('⚠️ Реклама не показана:', error);
                // ВСЁ РАВНО ДАЁМ БОНУС (для теста, потом убрать)
                this.onAdWatched(type);
            });
    } else {
        // Если VK Bridge нет — даём бонус без рекламы (для теста)
        this.onAdWatched(type);
    }
}

onAdWatched(type) {
    const bonus = this.bonuses[type];
    if (!bonus) {
        this.showEffect('❌ Ошибка!', '#ff4444');
        return;
    }
    
    if (bonus.count < bonus.maxCount) {
        bonus.count++;
        if (typeof statsManager !== 'undefined') {
            statsManager.onBonusEarned(type);
        }
        this.updateUI();
        this.showEffect(`✅ +1 ${bonus.name}!`, '#44ff44');
    } else {
        this.showEffect('❌ Лимит достигнут!', '#ff4444');
    }
}

    // ===== ОБНОВИТЬ UI БОНУСОВ =====
    updateUI() {
        const container = document.getElementById('bonusContainer');
        if (!container) return;

        container.innerHTML = '';
        const types = ['red', 'yellow', 'green', 'blue', 'pink'];
        const labels = {
            red: '🐢',
            yellow: '🧲',
            green: '🎯',
            blue: '⚡',
            pink: '💥'
        };
        
        for (const type of types) {
            const bonus = this.bonuses[type];
            const count = this.colorCounters[type] || 0;
            const maxCount = bonus.maxCount;
            const isMax = bonus.count >= maxCount;
            const progress = Math.min(count / this.requiredHits, 1);
            
            const item = document.createElement('div');
            item.className = 'bonus-item';
            
            const btn = document.createElement('div');
            btn.className = 'bonus-btn';
            btn.style.setProperty('--bonus-color', bonus.color);
            btn.dataset.type = type;
            
            const hasBonus = bonus.count > 0;
            
            // ===== ГЛАВНОЕ: ЗАМЕНЯЕМ ЦИФРУ НА КНОПКУ =====
            let countDisplay = '';
            if (bonus.count === 0) {
                // Нет бонуса → показываем "+"
                countDisplay = `<span class="bonus-count" style="font-size:20px;font-weight:bold;cursor:pointer;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:10px;border:1px dashed rgba(255,255,255,0.3);">+</span>`;
                btn.classList.add('inactive');
            } else {
                // Есть бонус → показываем цифру
                countDisplay = `<span class="bonus-count">${bonus.count}</span>`;
                if (!hasBonus) btn.classList.add('inactive');
            }
            
            btn.innerHTML = `
                <span class="bonus-icon">${labels[type]}</span>
                ${countDisplay}
            `;
            
            // ===== КЛИК ПО БОНУСУ =====
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (bonus.count === 0) {
                    // Нет бонуса → реклама
                    this.showBonusAdModal(type);
                    return;
                }
                // Есть бонус → используем
                this.useBonus(type);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (bonus.count === 0) {
                    this.showBonusAdModal(type);
                    return;
                }
                this.useBonus(type);
            });
            
            // ===== ПРОГРЕСС-БАР =====
            const progressBar = document.createElement('div');
            progressBar.className = 'bonus-progress';
            
            if (isMax && bonus.count >= maxCount) {
                progressBar.style.position = 'relative';
                progressBar.innerHTML = `
                    <div class="progress-fill" style="width: 100%; background: ${bonus.color};"></div>
                    <div style="position:absolute;top:-8px;left:0;right:0;text-align:center;font-size:9px;font-weight:bold;color:#fff;text-shadow:0 0 6px rgba(0,0,0,0.8);letter-spacing:0.5px;">
                        МАКС
                    </div>
                `;
            } else {
                progressBar.innerHTML = `
                    <div class="progress-fill" style="width: ${progress * 100}%; background: ${bonus.color};"></div>
                `;
            }
            
            const label = document.createElement('div');
            label.className = 'progress-label';
            if (isMax && bonus.count >= maxCount) {
                label.textContent = `${bonus.count}/${maxCount}`;
            } else {
                label.textContent = `${count}/${this.requiredHits}`;
            }
            
            item.appendChild(btn);
            item.appendChild(progressBar);
            item.appendChild(label);
            container.appendChild(item);
        }
    }

    // ===== ПРИМЕНИТЬ ЭФФЕКТЫ =====
    applyToAllBubbles(bubbles) {
        if (!bubbles) return;
        for (const bubble of bubbles) {
            if (this.slowMotion) {
                if (bubble.originalSpeed === undefined) {
                    bubble.originalSpeed = bubble.speed;
                }
                bubble.speed = 0;
            } else {
                if (bubble.originalSpeed !== undefined) {
                    bubble.speed = bubble.originalSpeed;
                    bubble.originalSpeed = undefined;
                }
            }
        }
    }

    applyEffects(bubble) {
        if (this.slowMotion) {
            bubble.originalSpeed = bubble.speed;
            bubble.speed = 0;
        }
        return bubble;
    }

    update() {
        if (this.slowMotion) {
            this.slowMotionTimer--;
            if (this.slowMotionTimer <= 0) {
                this.slowMotion = false;
                this.showEffect('⏰ Время пошло!', '#ffffff');
                if (this.game && this.game.bubbles) {
                    this.applyToAllBubbles(this.game.bubbles);
                }
            }
        }
        if (this.multiplierTimer > 0) {
            this.multiplierTimer--;
            if (this.multiplierTimer <= 0) {
                this.multiplierBonus = 1;
                this.showEffect('⚡ Множитель сброшен', '#ffffff');
            }
        }
    }

    getMultiplier() {
        return this.multiplierBonus;
    }

    isSelectingColor() {
        return this.isColorSelectionMode;
    }
}
