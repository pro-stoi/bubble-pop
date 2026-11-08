// js/bonus.js
const BONUS_ICONS = {
    red: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2h12M6 22h12M6 2c0 4 3 6 6 8 3-2 6-4 6-8M6 22c0-4 3-6 6-8 3 2 6 4 6 8"/>
    </svg>`,
    yellow: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 3v8a6 6 0 0 0 12 0V3M6 3h4M14 3h4M9 21h6M12 21v-4"/>
    </svg>`,
    green: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" stroke="none">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>`,
    blue: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <text x="12" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="currentColor" stroke="none">×2×</text>
    </svg>`,
    pink: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" stroke="none">
        <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2-6.2-4.5-6.2 4.5 2.4-7.2L2 9.2h7.6z"/>
    </svg>`,
};  
class BonusManager {
  constructor(game) {
    this.game = game;

    // ===== ТАЙМЕРЫ БОНУСОВ (ОБЯЗАТЕЛЬНО ДО updateUI!) =====
    this.bonusTimers = {
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        pink: 0
    };
    this.bonusTimerMax = 90;

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
        
        
        
      // ===== ТАЙМЕРЫ БОНУСОВ =====
  this.bonuses = {
    red:    { name: 'Замедление',     count: 0, maxCount: 8, color: '#ff4444', icon: BONUS_ICONS.red },
    yellow: { name: 'Магнит',         count: 0, maxCount: 8, color: '#ffcc00', icon: BONUS_ICONS.yellow },
    green:  { name: 'Цепная молния',  count: 0, maxCount: 8, color: '#44ff44', icon: BONUS_ICONS.green },
    blue:   { name: 'Умножение',      count: 0, maxCount: 8, color: '#4488ff', icon: BONUS_ICONS.blue },
    pink:   { name: 'Всё поле',       count: 0, maxCount: 8, color: '#ff44ff', icon: BONUS_ICONS.pink },
};
      
        
          // ===== ТЕСТОВЫЙ РЕЖИМ (true = реклама всегда срабатывает) =====
        
        
      /////////////////////////////////////////////////////////////////////// 
    this.testMode = false;  // ← ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ
        
     ////////////////////////////////////////////////////////////////   
        
       // ===== СЧЁТЧИК ДЛЯ ТАЙМЕРА =====
    this.timerTickCounter = 0;  
    }
    
    // ===== ДОБАВИТЬ БОНУСЫ ИЗ БД =====
addBonusesFromDB(bonuses) {
    if (!bonuses || bonuses.length === 0) return;
    
    bonuses.forEach(type => {
        if (this.bonuses[type]) {
            this.bonuses[type].count++;
        }
    });
    this.updateUI();
    
   
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
            
           this.game.scorePopups.push({
                x: this.game.width / 2,
                y: this.game.height / 2,
                text: `🎉 Бонус: ${this.bonuses[colorType].name}!`,
                subtext: `+1`,
                life: 70,
                maxLife: 70,
                hue: 0,
                big: true,
                customColor: this.bonuses[colorType].color
            });
            
            
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
                text: `🎉 Бонус: ${this.bonuses[colorType].name}!`,
                subtext: `+1 ${this.bonuses[colorType].name}`,
                life: 70,
                maxLife: 70,
                hue: 0,
                big: true,
                customColor: this.bonuses[colorType].color
            });
            
            
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
  // ===== ДОБАВИТЬ БОНУС =====
addBonus(type) {
    if (this.bonuses[type] && this.bonuses[type].count < this.bonuses[type].maxCount) {
        this.bonuses[type].count++;
        if (typeof statsManager !== 'undefined') {
            statsManager.onBonusEarned(type);
        }
        this.updateUI();
        
        // ===== ЗВУК НАКОПЛЕНИЯ БОНУСА =====
        switch(type) {
            case 'red': sound.bonusRedEarned(); break;
            case 'yellow': sound.bonusYellowEarned(); break;
            case 'green': sound.bonusGreenEarned(); break;
            case 'blue': sound.bonusBlueEarned(); break;
            case 'pink': sound.bonusPinkEarned(); break;
        }
        
         // ===== СОЗДАЁМ ЗОЛОТОЙ ШАР =====
        if (this.game) {
            this.game.spawnGoldenBubble();
        }
        return true;
    }
    return false;
}

    // ===== ИСПОЛЬЗОВАТЬ БОНУС =====
// ===== ИСПОЛЬЗОВАТЬ БОНУС =====
useBonus(type) {
    const bonus = this.bonuses[type];
    if (!bonus || bonus.count <= 0) return false;

    bonus.count--;
    if (typeof statsManager !== 'undefined') {
        statsManager.onBonusUsed(type);
    }
    
    this.updateUI();

    // ===== ОТПРАВЛЯЕМ НА СЕРВЕР, ЧТО БОНУС ИСПОЛЬЗОВАН =====
    const userId = localStorage.getItem('bubbleUserId');
    if (userId) {
        // Определяем URL в зависимости от окружения
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.protocol === 'file:';
        
        const apiUrl = isLocal 
            ? 'http://170.168.10.167:8080/api/bubble/user-bonus/use-bonus'
            : 'https://neurodrone-arena.ru/api/bubble/user-bonus/use-bonus';
        
        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId), bonusType: type })
        }).catch(err => console.warn('⚠️ Ошибка отметки бонуса:', err));
    }

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
   
    return true;
}
 // 🔴 КРАСНЫЙ БОНУС (замедление)
activateSlowMotion() {
    this.slowMotion = true;
    this.slowMotionTimer = 300;
    this.showEffect('🐢 ВСЕ ОСТАНОВИЛИСЬ!', '#ff4444');
    sound.slowMotion();
    
    // ===== ПРИБАВЛЯЕМ ВРЕМЯ К ТАЙМЕРУ СБРОСА МНОЖИТЕЛЯ =====
    this.game.lastPopTime = Date.now() + 5000; // +5 секунд (время работы красного бонуса)
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

// 🔵 СИНИЙ БОНУС (умножение)
activateMultiplier() {
    this.multiplierBonus *= 3;
    const MAX_MULTIPLIER = 20;
    if (this.multiplierBonus > MAX_MULTIPLIER) {
        this.multiplierBonus = MAX_MULTIPLIER;
    }
    this.multiplierTimer = 300;
    this.showEffect(`⚡ x${this.multiplierBonus}!`, '#4488ff');
    sound.bonusHappy();  // ← радостный звук
}

    // ===== 🟣 ЛОПНУТЬ ВСЁ ПОЛЕ =====
    activateFullClear() {
        const game = this.game;
        if (!game) return;

        const total = game.bubbles.length;
        if (total === 0) {
            this.showEffect('💥 0 пузырьков!', '#ff44ff');
            return;
        }

        // ===== ПОРЯДОК ЦВЕТОВ =====
        const colorOrder = ['red', 'yellow', 'green', 'blue', 'pink'];

        // ===== СОБИРАЕМ ПУЗЫРЬКИ ПО ЦВЕТАМ =====
        const byColor = { red: [], yellow: [], green: [], blue: [], pink: [] };
        for (const b of game.bubbles) {
            const ct = this.getColorType(b.hue);
            if (ct && byColor[ct]) byColor[ct].push(b);
        }

        // ===== СТАРТОВАЯ ТОЧКА — ЦЕНТР ЭКРАНА =====
        let prev = { x: game.width / 2, y: game.height / 2 };

        let index = 0;
        let colorIdx = 0;
        let poppedCount = 0;
        const stepDelay = 35;

        // ===== ПЕРЕХОД К СЛЕДУЮЩЕМУ ЦВЕТУ =====
        const nextColor = () => {
            while (colorIdx < colorOrder.length) {
                const color = colorOrder[colorIdx];
                if (byColor[color].length > 0) {
                    return byColor[color];
                }
                colorIdx++;
            }
            return null;
        };

        const popNext = () => {
            let currentColor = nextColor();

            // ===== ВСЁ ЛОПНУТО =====
            if (!currentColor) {
                this.showEffect(`💥 ${poppedCount} пузырьков!`, '#ff44ff');
                return;
            }

            // ===== БЛИЖАЙШИЙ К ПРЕДЫДУЩЕМУ В ТЕКУЩЕМ ЦВЕТЕ =====
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < currentColor.length; i++) {
                const t = currentColor[i];
                const dx = t.x - prev.x;
                const dy = t.y - prev.y;
                const d = dx * dx + dy * dy;
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }

            if (bestIdx === -1) {
                // Цвет пуст — переходим к следующему
                colorIdx++;
                setTimeout(popNext, stepDelay);
                return;
            }

            const target = currentColor.splice(bestIdx, 1)[0];

            // ===== ЛОПАЕМ =====
            game.popBubbleAt(target.x, target.y, true);
            poppedCount++;

            // ===== ЗВУК — ПИТЧ РАСТЁТ =====
            const pitch = 600 + index * 25;
            if (typeof sound !== 'undefined' && sound.pop) {
                sound.pop(Math.min(pitch, 2000), 0.06, 0.18);
            }

            prev = { x: target.x, y: target.y };
            index++;

            // ===== ЕСЛИ ТЕКУЩИЙ ЦВЕТ ЗАКОНЧИЛСЯ — ПЕРЕХОДИМ К СЛЕДУЮЩЕМУ =====
            if (currentColor.length === 0) {
                colorIdx++;
            }

            setTimeout(popNext, stepDelay);
        };

        // Запускаем через мгновение
        setTimeout(popNext, 30);
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
                    // ===== ЦЕПНАЯ РЕАКЦИЯ =====
                    this.startChainReaction(b, targetHue);
                }
                this.isColorSelectionMode = false;
                this.selectedBonusType = null;
                return true;
            }
        }
        
        this.showEffect('❌ Промах!', '#ff4444');
        return false;
    }

    // ===== ЦЕПНАЯ РЕАКЦИЯ (зелёный бонус) =====
    startChainReaction(startBubble, targetHue) {
        const game = this.game;
        if (!game) return;

        // ===== ОПРЕДЕЛЯЕМ ЦВЕТ СТАРТОВОГО ПУЗЫРЬКА =====
        const startColorType = this.getColorType(startBubble.hue);

        // ===== СОБИРАЕМ ВСЕ ПУЗЫРЬКИ ТОГО ЖЕ ЦВЕТА (СРАЗУ) =====
        // Никаких проверок .alive — просто все, кто сейчас на поле
        const targets = [];
        for (const b of game.bubbles) {
            if (b === startBubble) continue;
            if (this.getColorType(b.hue) === startColorType) {
                targets.push(b);
            }
        }

        // ===== ЛОПАЕМ СТАРТОВЫЙ СРАЗУ =====
        game.popBubbleAt(startBubble.x, startBubble.y, true);

        const totalCount = targets.length + 1;
        let index = 0;
        let prev = { x: startBubble.x, y: startBubble.y };
        const stepDelay = 60;

        const popNext = () => {
            // ===== КОНЕЦ ЦЕПОЧКИ =====
            if (targets.length === 0) {
                this.showEffect(`🎯 ${totalCount} пузырьков!`, '#44ff44');
                return;
            }

            // ===== ИЩЕМ БЛИЖАЙШИЙ К ПРЕДЫДУЩЕМУ =====
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < targets.length; i++) {
                const dx = targets[i].x - prev.x;
                const dy = targets[i].y - prev.y;
                const d = dx * dx + dy * dy;
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }

            if (bestIdx === -1) {
                this.showEffect(`🎯 ${totalCount} пузырьков!`, '#44ff44');
                return;
            }

            // ===== ЗАБИРАЕМ ИЗ МАССИВА (БОЛЬШЕ НЕ ВЕРНЁТСЯ) =====
            const target = targets.splice(bestIdx, 1)[0];

            // ===== ЛОПАЕМ =====
            game.popBubbleAt(target.x, target.y, true);

            // ===== ЗВУК =====
            const pitch = 500 + index * 40;
            if (typeof sound !== 'undefined' && sound.pop) {
                sound.pop(Math.min(pitch, 2000), 0.08, 0.2);
            }

            prev = { x: target.x, y: target.y };
            index++;
            setTimeout(popNext, stepDelay);
        };

        setTimeout(popNext, stepDelay);
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
        // Создаём, если ещё нет — и сразу показываем.
        if (!document.getElementById('bonusAdModal')) {
            this.createBonusModal();
        }
        const modal = document.getElementById('bonusAdModal');
        if (!modal) return;

        const title = document.getElementById('bonusAdModalTitle');
        const desc = document.getElementById('bonusAdModalDesc');
        if (title) title.textContent = '🎁 Получи бонус!';
        if (desc) desc.textContent = 'Посмотри рекламу и получи 1 бонус!';

        modal.dataset.bonusType = type;
        modal.style.display = 'flex';

        // Пауза, пока открыта модалка
        if (this.game) {
            this.game.pauseGame();
        }
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
        if (self.game) self.game.resumeGame();
    });
    document.getElementById('bonusAdModalCancel').addEventListener('touchend', function(e) {
        e.preventDefault();
        const m = document.getElementById('bonusAdModal');
        if (m) m.style.display = 'none';
        if (self.game) self.game.resumeGame();
    });

    document.getElementById('bonusAdModalConfirm').addEventListener('click', function() {
        const m = document.getElementById('bonusAdModal');
        if (m) {
            const type = m.dataset.bonusType;
            m.style.display = 'none';
            self.handleAdWatched(type);
        }
    });
    document.getElementById('bonusAdModalConfirm').addEventListener('touchend', function(e) {
        e.preventDefault();
        const m = document.getElementById('bonusAdModal');
        if (m) {
            const type = m.dataset.bonusType;
            m.style.display = 'none';
            self.handleAdWatched(type);
        }
    });
}

handleAdWatched(type) {
    const game = this.game;

    // ===== СТАВИМ ПАУЗУ И ФЛАГ РЕКЛАМЫ =====
    if (game) {
        game.pauseGame();
        game.isAdPlaying = true;
    }

    const finish = () => {
        if (game) {
            game.isAdPlaying = false;
            game.resumeGame();
        }
        this.onAdWatched(type);
    };

    // ===== ТЕСТОВЫЙ РЕЖИМ =====
    if (this.testMode) {
        finish();
        return;
    }

    // ===== РЕАЛЬНЫЙ VK =====
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'rewarded' })
            .then(finish)
            .catch((error) => {
                console.warn('⚠️ Реклама не показана:', error);
                finish();
            });
    } else {
        finish();
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
        
        // ===== ЗАПУСКАЕМ ТАЙМЕР =====
        this.bonusTimers[type] = this.bonusTimerMax;
        
        this.updateUI();
        this.showEffect(`✅ +1 ${bonus.name}!`, '#44ff44');
    } else {
        this.showEffect('❌ Лимит достигнут!', '#ff4444');
    }
    statsManager.onAdWatched();
}

    // ===== ОБНОВИТЬ UI БОНУСОВ =====
updateUI() {
    const container = document.getElementById('bonusContainer');
    if (!container) return;

    
     // ===== ПРОВЕРЯЕМ, ЕСТЬ ЛИ АКТИВНЫЕ ТАЙМЕРЫ =====
    for (const type in this.bonusTimers) {
        if (this.bonusTimers[type] > 0) {
            const bonus = this.bonuses[type];
           
        }
    }
    
    
    container.innerHTML = '';
    const types = ['red', 'yellow', 'green', 'blue', 'pink'];
const labels = BONUS_ICONS;
    
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
        
        // ===== ОТОБРАЖЕНИЕ СЧЁТЧИКА / ТАЙМЕРА / ПЛЮСИКА =====
        let countDisplay = '';
        
        if (bonus.count === 0) {
            // ===== ПРОВЕРЯЕМ ТАЙМЕР =====
            const timer = this.bonusTimers[type] || 0;
            if (timer > 0) {
                // Показываем таймер (только секунды)
                countDisplay = `<span class="bonus-count" style="font-size:16px;font-weight:bold;color:#ffcc00;background:rgba(255,215,0,0.15);padding:0 8px;border-radius:10px;border:1px solid rgba(255,215,0,0.2);">
                    ⏱ ${timer}с
                </span>`;
                btn.classList.add('inactive');
            } else {
                // Показываем плюсик
                countDisplay = `<span class="bonus-count" style="font-size:20px;font-weight:bold;cursor:pointer;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:10px;border:1px dashed rgba(255,255,255,0.3);">+</span>`;
                btn.classList.add('inactive');
            }
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
        let lastTouchTime = 0;

        const handleBonusClick = (e) => {
            if (e) {
                e.stopPropagation();
            }

            // Если есть бонус — используем
            if (bonus.count > 0) {
                this.useBonus(type);
                return;
            }

            // Бонуса нет — проверяем таймер
            const timer = this.bonusTimers[type] || 0;
            if (timer > 0) {
                this.showEffect('⏱ Подождите ' + timer + 'с!', '#ffcc00');
                return;
            }

            // Бонуса нет и таймера нет → модалка рекламы
            this.showBonusAdModal(type);
        };

        btn.addEventListener('click', (e) => {
            // Если только что был touchend (в течение 500 мс) — click игнорируем,
            // это синтетический клик от браузера после тача.
            if (Date.now() - lastTouchTime < 500) {
                e.stopPropagation();
                return;
            }
            handleBonusClick(e);
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            lastTouchTime = Date.now();
            handleBonusClick(null);
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

    // ===== ПРИМЕНИТЬ ЭФФЕКТЫ КО ВСЕМ ШАРИКАМ =====
    applyToAllBubbles(bubbles) {
        if (!bubbles) return;
        const gameSlow = (this.game && this.game.slowFactor) ? this.game.slowFactor : 1;

        for (const bubble of bubbles) {
            if (bubble.originalSpeed === undefined) {
                bubble.originalSpeed = bubble.speed;
            }

            // Красный бонус — полная остановка всех (включая сердечки)
            if (this.slowMotion) {
                bubble.speed = 0;
                continue;
            }

            // Обычный режим: базовая скорость × динамическое замедление по серии
            bubble.speed = bubble.originalSpeed * gameSlow;
        }
    }

     applyEffects(bubble) {
        // Сердечко реагирует только на красный бонус (полная остановка).
        // Остальные бонусы (магнит, умножение и т.д.) на него не действуют.
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
        // ===== ОБНОВЛЯЕМ ТАЙМЕРЫ БОНУСОВ =====
    this.updateTimers();
        
    }

updateTimers() {
    // ===== УМЕНЬШАЕМ ТАЙМЕР ТОЛЬКО РАЗ В СЕКУНДУ =====
    this.timerTickCounter++;
    if (this.timerTickCounter < 60) {
        return; // Не обновляем, пока не прошла секунда
    }
    this.timerTickCounter = 0;
    
    let needUpdate = false;
    for (const type in this.bonusTimers) {
        if (this.bonusTimers[type] > 0) {
            this.bonusTimers[type]--;
            needUpdate = true;
        }
    }
    if (needUpdate) {
        this.updateUI();
    }
}
    
    
    getMultiplier() {
        return this.multiplierBonus;
    }

    isSelectingColor() {
        return this.isColorSelectionMode;
    }
}
