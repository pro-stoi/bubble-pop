// js/challengeTracker.js

class ChallengeTracker {
    constructor() {
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
    }

    // ===== ЗАГРУЗКА ДАННЫХ С СЕРВЕРА =====
    async loadFromServer(userId) {
        this.userId = userId;
        
        try {
            // Загружаем список испытаний
            const challenges = await vk.getChallenges();
            this.challenges = challenges;
            
            // Загружаем прогресс пользователя
            const progress = await vk.getUserChallengeProgress(userId);
            this.progress = progress;
            
            // Загружаем общую сумму наград
            const total = await vk.getUserTotalRewards(userId);
            this.totalReward = total.totalReward || 0;
            
            this.isLoaded = true;
            console.log('✅ Испытания загружены с сервера:', this.challenges.length);
            
            // Обновляем UI
            if (window.renderChallenges) {
                window.renderChallenges();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка загрузки испытаний:', error);
            this.isLoaded = false;
            return false;
        }
    }

    // ===== ПОЛУЧИТЬ ВСЕ ИСПЫТАНИЯ С ПРОГРЕССОМ =====
    getChallenges() {
        if (!this.isLoaded || !this.challenges.length) {
            return [];
        }

        return this.challenges.map(ch => {
            // Находим прогресс для этого испытания
            const prog = this.progress.find(p => p.challenge_id === ch.id) || {};
            
            // Вычисляем цель для текущего уровня
            const target = Math.floor(ch.target_base * Math.pow(ch.target_multiplier, prog.level || 0));
            
            return {
                id: ch.id,
                icon: ch.icon || '📌',
                name: ch.name,
                baseReward: ch.base_reward || 10,
                color: this.getColorByIndex(ch.sort_order || 0),
                current: prog.progress || 0,
                target: target,
                level: prog.level || 0,
                multiplier: (prog.level || 0) + 1,
                totalReward: prog.total_reward || 0,
                isCompleted: prog.is_completed || false
            };
        });
    }

    // ===== ЦВЕТ ДЛЯ ИСПЫТАНИЯ =====
    getColorByIndex(index) {
        const colors = ['#9b59b6', '#8e44ad', '#e67e22', '#3498db', '#e74c3c', '#c0392b', '#f1c40f', '#1abc9c'];
        return colors[index % colors.length];
    }

    // ===== ОБНОВЛЕНИЕ ПРОГРЕССА =====
    async update(challengeId, delta = 1) {
        if (!this.userId) {
            console.warn('⚠️ Пользователь не авторизован');
            return false;
        }

        try {
            const result = await vk.updateChallenge(this.userId, challengeId, delta);
            
            if (result.success) {
                // Обновляем локальные данные
                const prog = this.progress.find(p => p.challenge_id === challengeId);
                if (prog) {
                    prog.progress = result.newProgress;
                    prog.level = result.newLevel;
                    prog.total_reward = result.totalReward;
                }
                
                // Если был переход уровня
                if (result.levelUp) {
                    // Обновляем общую сумму наград
                    const total = await vk.getUserTotalRewards(this.userId);
                    this.totalReward = total.totalReward || 0;
                    
                    // Показываем уведомление
                    this.showNotification(
                        `🎉 ${this.getChallengeName(challengeId)} ${result.newLevel} уровень! +${result.reward} 💎`
                    );
                    
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
            console.error('❌ Ошибка обновления:', error);
        }
        
        return false;
    }

    // ===== ПОЛУЧИТЬ НАЗВАНИЕ ИСПЫТАНИЯ ПО ID =====
    getChallengeName(challengeId) {
        const ch = this.challenges.find(c => c.id === challengeId);
        return ch ? ch.name : 'Испытание';
    }

    // ===== ПОЛУЧИТЬ ID ИСПЫТАНИЯ ПО НАЗВАНИЮ =====
    getChallengeIdByName(name) {
        const ch = this.challenges.find(c => c.name === name);
        return ch ? ch.id : null;
    }

    // ===== ОБЩАЯ СУММА НАГРАД =====
    getTotalRewards() {
        return this.totalReward;
    }

    // ===== ОБРАБОТКА ЛОПНУТОГО ПУЗЫРЬКА =====
    onBubblePopped(bubble, game) {
        // 1. Лопни пузырьки (challenge_id = 1)
        this.update(1, 1);
        
        // 2. Лопни пузырьки (мастер) (challenge_id = 4)
        this.update(4, 1);
        
        // 3. По цветам
        const colorType = game.bonusManager.getColorType(bubble.hue);
        if (colorType === 'pink') {
            // Собери фиолетовые (challenge_id = 2)
            this.update(2, 1);
        } else if (colorType === 'red') {
            // Собери красные (challenge_id = 5)
            this.update(5, 1);
        }
        
        // 4. Серия без промаха (challenge_id = 6)
        this.streak++;
        if (this.streak >= 20) {
            this.update(6, 1);
            this.streak = 0;
        }
        
        // 5. Собираем все цвета (challenge_id = 8)
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
        this.collectedColors = new Set();
        this.streak = 0;
        this.lastCombo = 0;
    }

    // ===== УВЕДОМЛЕНИЕ =====
    showNotification(text) {
        const popup = document.createElement('div');
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
        
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const challengeTracker = new ChallengeTracker();