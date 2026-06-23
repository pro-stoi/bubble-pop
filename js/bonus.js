// js/bonus.js

class BonusManager {
    constructor(game) {
        this.game = game;
        
        // Бонусы (счётчик использований)
        this.bonuses = {
            red: { name: 'Замедление', count: 0, maxCount: 5, color: '#ff4444', icon: '🐢' },
            yellow: { name: 'Магнит', count: 0, maxCount: 5, color: '#ffcc00', icon: '🧲' },
            green: { name: 'Цветной взрыв', count: 0, maxCount: 5, color: '#44ff44', icon: '🎯' },
            blue: { name: 'Умножение', count: 0, maxCount: 5, color: '#4488ff', icon: '⚡' },
            pink: { name: 'Всё поле', count: 0, maxCount: 5, color: '#ff44ff', icon: '💥' }
        };
        
        // Счётчики для накопления бонусов по цветам
        this.colorCounters = {
            pink: 0,  // розовый (маленький)
            blue: 0,  // синий
            green: 0, // зелёный
            yellow: 0,// жёлтый
            red: 0    // красный
        };
        this.colorHues = {
            pink: 320,
            blue: 200,
            green: 120,
            yellow: 45,
            red: 0
        };
        this.requiredHits = 8; // сколько нужно лопнуть для получения бонуса
        this.currentColor = null; // текущий цвет для комбо
        this.comboCount = 0;
        
        // Эффекты
        this.multiplierBonus = 1;
        this.multiplierTimer = 0;
        this.slowMotion = false;
        this.slowMotionTimer = 0;
        this.isColorSelectionMode = false;
        this.selectedBonusType = null;
    }

    // ===== ОБРАБОТКА ЛОПАНИЯ ПУЗЫРЬКА =====
    onBubblePopped(bubble) {
        // Определяем цвет пузырька
        let colorType = this.getColorType(bubble.hue);
        if (!colorType) return false;
        
        // Проверяем, тот же ли цвет
        if (this.currentColor !== colorType) {
            // Сброс при смене цвета
            this.currentColor = colorType;
            this.comboCount = 0;
            this.resetCounters();
        }
        
        // Увеличиваем счётчик для этого цвета
        this.comboCount++;
        this.colorCounters[colorType] = (this.colorCounters[colorType] || 0) + 1;
        
        // Обновляем прогресс-бар
        this.updateProgress();
        
        // Проверяем, достигнут ли порог
        if (this.colorCounters[colorType] >= this.requiredHits) {
            // Даём бонус этого цвета
            this.addBonus(colorType);
            this.colorCounters[colorType] = 0; // сбрасываем счётчик
            this.updateProgress();
            
            // Показываем эффект получения бонуса
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
        this.updateProgress();
    }

    // ===== ДОБАВИТЬ БОНУС =====
    addBonus(type) {
        if (this.bonuses[type] && this.bonuses[type].count < this.bonuses[type].maxCount) {
            this.bonuses[type].count++;
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

    // ===== 🔴 ЗАМЕДЛЕНИЕ (полная остановка на 5 секунд) =====
    activateSlowMotion() {
        this.slowMotion = true;
        this.slowMotionTimer = 300; // 5 секунд (60 FPS * 5)
        this.showEffect('🐢 ВСЕ ОСТАНОВИЛИСЬ!', '#ff4444');
    }

    // ===== 🟡 МАГНИТ (нажать на пузырёк → взрыв вокруг) =====
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

    // ===== 🟢 ЦВЕТНОЙ ВЗРЫВ (нажать на пузырёк → лопнуть все такого цвета) =====
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

    // ===== 🔵 УМНОЖЕНИЕ x2 =====
    activateMultiplier() {
        this.multiplierBonus *= 2;
        this.multiplierTimer = 300; // 5 секунд
        this.showEffect(`⚡ x${this.multiplierBonus}!`, '#4488ff');
    }

    // ===== 🟣 ЛОПНУТЬ ВСЁ ПОЛЕ =====
    activateFullClear() {
        const count = this.game.bubbles.length;
        for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
            const b = this.game.bubbles[i];
            this.game.popBubbleAt(b.x, b.y);
        }
        this.showEffect(`💥 ${count} пузырьков!`, '#ff44ff');
    }

    // ===== ОБРАБОТКА ВЫБОРА ЦВЕТА (для магнита и взрыва) =====
    handleColorSelection(x, y) {
        if (!this.isColorSelectionMode) return false;
        
        for (const b of this.game.bubbles) {
            if (b.contains(x, y)) {
                const hint = document.getElementById('bonusHint');
                if (hint) hint.style.display = 'none';
                
                if (this.selectedBonusType === 'magnet') {
                    // Магнит: лопаем всё в радиусе 150px
                    const radius = 150;
                    let count = 0;
                    for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
                        const target = this.game.bubbles[i];
                        const dx = target.x - b.x;
                        const dy = target.y - b.y;
                        if (dx*dx + dy*dy < radius*radius) {
                            this.game.popBubbleAt(target.x, target.y);
                            count++;
                        }
                    }
                    this.showEffect(`🧲 ${count} пузырьков!`, '#ffcc00');
                    
                } else if (this.selectedBonusType === 'color_explosion') {
                    // Взрыв цвета: лопаем все того же цвета
                    const targetHue = b.hue;
                    let count = 0;
                    for (let i = this.game.bubbles.length - 1; i >= 0; i--) {
                        const target = this.game.bubbles[i];
                        if (Math.abs(target.hue - targetHue) < 20) {
                            this.game.popBubbleAt(target.x, target.y);
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

// ===== ОБНОВИТЬ UI БОНУСОВ =====
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
        const progress = Math.min(count / this.requiredHits, 1);
        
        const item = document.createElement('div');
        item.className = 'bonus-item';
        
        const btn = document.createElement('div');
        btn.className = 'bonus-btn';
        btn.style.setProperty('--bonus-color', bonus.color);
        btn.dataset.type = type;
        
        const hasBonus = bonus.count > 0;
        if (!hasBonus) {
            btn.classList.add('inactive');
        }
        
        btn.innerHTML = `
            <span class="bonus-icon">${labels[type]}</span>
            <span class="bonus-count">${bonus.count}</span>
        `;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bonus.count <= 0) {
                this.showEffect('❌ Нет бонусов!', '#ff4444');
                return;
            }
            this.useBonus(type);
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (bonus.count <= 0) {
                this.showEffect('❌ Нет бонусов!', '#ff4444');
                return;
            }
            this.useBonus(type);
        });
        
        const progressBar = document.createElement('div');
        progressBar.className = 'bonus-progress';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${progress * 100}%; background: ${bonus.color};"></div>
        `;
        
        const label = document.createElement('div');
        label.className = 'progress-label';
        label.textContent = `${count}/${this.requiredHits}`;
        
        item.appendChild(btn);
        item.appendChild(progressBar);
        item.appendChild(label);
        container.appendChild(item);
    }
}

// ===== ОБНОВИТЬ ПРОГРЕСС =====
updateProgress() {
    this.updateUI();
}


   // ===== ОБНОВИТЬ ПРОГРЕСС =====
updateProgress() {
    // Теперь прогресс обновляется вместе с UI
    this.updateUI();
}

    // ===== ОБНОВЛЯТЬ КАЖДЫЙ КАДР =====
    update() {
        // Обновление замедления (полная остановка)
        if (this.slowMotion) {
            this.slowMotionTimer--;
            if (this.slowMotionTimer <= 0) {
                this.slowMotion = false;
                this.showEffect('⏰ Время пошло!', '#ffffff');
            } else {
                // Показываем таймер
                const seconds = Math.ceil(this.slowMotionTimer / 60);
                if (seconds > 0 && seconds <= 5) {
                    // Обновляем текст на экране (можно добавить отдельный элемент)
                }
            }
        }
        
        // Обновление множителя
        if (this.multiplierTimer > 0) {
            this.multiplierTimer--;
            if (this.multiplierTimer <= 0) {
                this.multiplierBonus = 1;
                this.showEffect('⚡ Множитель сброшен', '#ffffff');
            }
        }
    }

    // ===== ПРИМЕНИТЬ ЭФФЕКТЫ К ПУЗЫРЬКАМ =====
    applyEffects(bubble) {
        if (this.slowMotion) {
            bubble.speed = 0; // Полная остановка
        }
        return bubble;
    }

    // ===== ПОЛУЧИТЬ ТЕКУЩИЙ МНОЖИТЕЛЬ =====
    getMultiplier() {
        return this.multiplierBonus;
    }

    // ===== ПРОВЕРИТЬ, АКТИВЕН ЛИ РЕЖИМ ВЫБОРА =====
    isSelectingColor() {
        return this.isColorSelectionMode;
    }
}