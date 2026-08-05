// js/challengeTracker.js

console.log('🔄 [TRACKER] Файл загружен');

class ChallengeTracker {
    constructor() {
        console.log('🔄 [TRACKER] Конструктор запущен');
        
        this.challenges = [];
        this.progress = [];
        this.totalReward = 0;
        this.isLoaded = false;
        this.userId = null;
        this.collectedColors = new Set();
        this.streak = 0;
        this.lastCombo = 0;
        this.lastFlushAmount = 0;
        this.pendingUpdates = [];
        this.isSaving = false;
        
        console.log('✅ [TRACKER] Экземпляр создан');
    }

    // ===== ЗАГРУЗКА ДАННЫХ С СЕРВЕРА =====
    async loadFromServer(userId) {
        console.log('🔄 [TRACKER] loadFromServer() вызван, userId =', userId);
        this.userId = userId;
        
        try {
            console.log('🔄 [TRACKER] Вызываем repository.loadChallenges(' + userId + ')');
            var result = await repository.loadChallenges(userId);
            
            console.log('🔄 [TRACKER] Получены данные:', result);
            
            if (result && result.challenges) {
                this.challenges = result.challenges;
                this.totalReward = result.totalReward || 0;
                this.isLoaded = true;
                console.log('✅ [TRACKER] Испытания загружены, записей =', this.challenges.length);
                
                // Обновляем UI
                if (window.renderChallenges) {
                    window.renderChallenges();
                }
                
                return true;
            }
        } catch (error) {
            console.error('❌ [TRACKER] Ошибка загрузки испытаний:', error);
            this.isLoaded = false;
            return false;
        }
    }

    // ===== ПОЛУЧИТЬ ВСЕ ИСПЫТАНИЯ С ПРОГРЕССОМ =====
    getChallenges() {
        if (!this.isLoaded || !this.challenges.length) {
            return [];
        }

        return this.challenges.map(function(ch) {
            return {
                id: ch.id,
                icon: ch.icon || '📌',
                name: ch.name,
                baseReward: ch.baseReward || 10,
                color: '#9b59b6',
                current: ch.progressInLevel || 0,
                target: ch.targetForLevel || ch.targetBase || 10,
                level: ch.level || 0,
                multiplier: (ch.level || 0) + 1,
                totalReward: ch.totalReward || 0,
                isCompleted: ch.isCompleted || false
            };
        });
    }

    // ===== ОБНОВЛЕНИЕ ПРОГРЕССА =====
async update(challengeId, delta) {
    if (!this.userId) {
        console.warn('⚠️ [TRACKER] Пользователь не авторизован');
        return false;
    }

    try {
        console.log('🔄 [TRACKER] Вызываем repository.updateChallenge(' + this.userId + ', ' + challengeId + ', ' + delta + ')');
        var result = await repository.updateChallenge(this.userId, challengeId, delta);
        
        console.log('🔄 [TRACKER] Результат:', result);
        
        if (result.success) {
            // Обновляем локальные данные
            var prog = this.progress.find(function(p) { return p.challenge_id === challengeId; });
            if (prog) {
                prog.progress = result.newProgress;
                prog.level = result.newLevel;
                prog.total_reward = result.totalReward;
            }
            
            // Если был переход уровня
            if (result.levelUp) {
                console.log('🔥 [TRACKER] Уровень повышен! Новый уровень =', result.newLevel);
                
                // Обновляем общую сумму наград
                var total = await repository.getTotalRewards(this.userId);
                this.totalReward = total || 0;
                
                // ===== ВРЕМЕННО ОТКЛЮЧАЕМ УВЕДОМЛЕНИЯ ДЛЯ ИСПЫТАНИЯ №5 =====
                if (challengeId !== 5) {
                    this.showNotification(
                        '🎉 ' + this.getChallengeName(challengeId) + ' ' + result.newLevel + ' уровень! +' + result.reward + ' 💎'
                    );
                }
                
                if (window.sound) {
                    sound.bonus();
                }
            }
            
            // Обновляем UI
            if (window.renderChallenges) {
                window.renderChallenges();
            }
            
            return true;
        }
    } catch (error) {
        console.error('❌ [TRACKER] Ошибка обновления:', error);
    }
    
    return false;
}
    // ===== ПОЛУЧИТЬ НАЗВАНИЕ ИСПЫТАНИЯ ПО ID =====
    getChallengeName(challengeId) {
        var ch = this.challenges.find(function(c) { return c.id === challengeId; });
        return ch ? ch.name : 'Испытание';
    }

    // ===== ОБЩАЯ СУММА НАГРАД =====
    getTotalRewards() {
        return this.totalReward;
    }

    // ===== ОБРАБОТКА ЛОПНУТОГО ПУЗЫРЬКА =====
    onBubblePopped(bubble, game) {
        // 1. Лопни пузырьки (challenge_id = 1)
        this.update(1, 1);
        
        // 4. Лопни пузырьки (мастер) (challenge_id = 4)
        this.update(4, 1);
        
        // По цветам
        var colorType = game.bonusManager.getColorType(bubble.hue);
        if (colorType === 'pink') {
            // Собери фиолетовые (challenge_id = 2)
            this.update(2, 1);
        } else if (colorType === 'red') {
            // Собери красные (challenge_id = 5)
            this.update(5, 1);
        }
        
        // 6. Серия без промаха (challenge_id = 6)
        this.streak++;
        if (this.streak >= 20) {
            this.update(6, 1);
            this.streak = 0;
        }
        
        // 8. Собираем все цвета (challenge_id = 8)
        if (colorType) {
            this.collectedColors.add(colorType);
            if (this.collectedColors.size >= 5) {
                this.update(8, 1);
                this.collectedColors.clear();
            }
        }
    }

    // ===== ОБРАБОТКА КОМБО =====
    onCombo(combo) {
        // Комбо ×10 (challenge_id = 3)
        if (combo >= 10 && combo % 10 === 0) {
            this.update(3, 1);
        }
        this.lastCombo = combo;
    }

    // ===== ОБРАБОТКА БОЛЬШОГО БОНУСА =====
    onBigBonus(amount) {
        // Бонус 100+ за раз (challenge_id = 7)
        if (amount >= 100) {
            this.update(7, 1);
        }
        this.lastFlushAmount = amount;
    }

    // ===== СБРОС ПРИ ПРОМАХЕ =====
    onMiss() {
        this.streak = 0;
    }

    // ===== НОВАЯ ИГРА =====
    newGame() {
        console.log('🔄 [TRACKER] Новая игра');
        this.collectedColors = new Set();
        this.streak = 0;
        this.lastCombo = 0;
    }

    // ===== УВЕДОМЛЕНИЕ =====
    showNotification(text) {
        var popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(12px);
            padding: 16px 32px;
            border-radius: 20px;
            border: 2px solid rgba(255,215,0,0.3);
            color: white;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            max-width: 90%;
        `;
        popup.textContent = text;
        document.body.appendChild(popup);
        
        setTimeout(function() {
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        setTimeout(function() {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(function() {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 300);
        }, 3000);
    }
}

console.log('🔄 [TRACKER] Создаём экземпляр...');
var challengeTracker = new ChallengeTracker();
console.log('✅ [TRACKER] Готов!');
