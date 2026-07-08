// js/challengeTracker.js

class ChallengeTracker {
    constructor() {
        this.progress = this.loadProgress();
        this.rewards = this.loadRewards();
        this.levels = this.loadLevels(); // НОВОЕ: уровни испытаний
        this.collectedColors = new Set();
        this.streak = 0;
        this.lastCombo = 0;
        this.lastFlushAmount = 0;
    }

    // ===== ЗАГРУЗКА УРОВНЕЙ =====
    loadLevels() {
        return JSON.parse(localStorage.getItem('challengeLevels') || '{}');
    }

    saveLevels() {
        localStorage.setItem('challengeLevels', JSON.stringify(this.levels));
    }

    // ===== ЗАГРУЗКА ПРОГРЕССА =====
    loadProgress() {
        return JSON.parse(localStorage.getItem('challengeProgress') || '{}');
    }

    saveProgress() {
        localStorage.setItem('challengeProgress', JSON.stringify(this.progress));
    }

    loadRewards() {
        return JSON.parse(localStorage.getItem('challengeRewards') || '[]');
    }

    saveRewards() {
        localStorage.setItem('challengeRewards', JSON.stringify(this.rewards));
    }

    // ===== ПОЛУЧИТЬ УРОВЕНЬ ИСПЫТАНИЯ =====
    getLevel(id) {
        return this.levels[id] || 0;
    }

    // ===== УВЕЛИЧИТЬ УРОВЕНЬ =====
    increaseLevel(id) {
        this.levels[id] = (this.levels[id] || 0) + 1;
        this.saveLevels();
        return this.levels[id];
    }

    // ===== ПОЛУЧИТЬ МНОЖИТЕЛЬ НАГРАДЫ =====
    getRewardMultiplier(id) {
        const level = this.getLevel(id);
        // Уровень 0 = ×1, уровень 1 = ×2, уровень 2 = ×3, и т.д.
        return level + 1;
    }

    // ===== ПОЛУЧИТЬ ЦЕЛЬ ДЛЯ ТЕКУЩЕГО УРОВНЯ =====
    getTarget(id) {
        const baseTarget = this.getBaseTarget(id);
        const level = this.getLevel(id);
        // Каждый уровень увеличивает цель на 50%
        return Math.floor(baseTarget * (1 + level * 0.5));
    }

    getBaseTarget(id) {
        const targets = {
            'daily_1': 100,
            'daily_2': 50,
            'daily_3': 10,
            'skill_1': 500,
            'skill_2': 100,
            'hard_1': 20,
            'hard_2': 100,
            'collector': 5
        };
        return targets[id] || 100;
    }

    // ===== ОБНОВЛЕНИЕ ПРОГРЕССА =====
    update(id, value = 1) {
        const challenge = this.getChallenge(id);
        if (!challenge) return false;

        const oldValue = this.progress[id] || 0;
        const newValue = oldValue + value;
        this.progress[id] = newValue;
        this.saveProgress();

        // Проверяем, выполнено ли
        const target = this.getTarget(id);
        if (oldValue < target && newValue >= target) {
            // Увеличиваем уровень
            const newLevel = this.increaseLevel(id);
            const multiplier = this.getRewardMultiplier(id);
            const reward = challenge.baseReward * multiplier;
            
            // Выдаём награду
            this.rewards.push(reward);
            this.saveRewards();
            
            // Сбрасываем прогресс для этого испытания
            this.progress[id] = 0;
            this.saveProgress();
            
            // Показываем уведомление
            this.showNotification(
                `🎉 ${challenge.name} ${newLevel} уровень! +${reward} 💎 (×${multiplier})`
            );
            
            // Звук
            if (window.sound) {
                sound.bonus();
            }
            
            // Обновляем UI
            if (window.renderChallenges) {
                window.renderChallenges();
            }
            
            return true;
        }
        
        // Обновляем UI
        if (window.renderChallenges) {
            window.renderChallenges();
        }
        
        return false;
    }

    // ===== ПОЛУЧИТЬ ДАННЫЕ ИСПЫТАНИЯ =====
    getChallenge(id) {
        const challenges = this.getChallenges();
        return challenges.find(c => c.id === id);
    }

    // ===== СПИСОК ВСЕХ ИСПЫТАНИЙ =====
    getChallenges() {
        return [
            {
                id: 'daily_1',
                icon: '⏳',
                name: 'Лопни пузырьки',
                baseReward: 10,
                color: '#9b59b6',
                current: this.progress.daily_1 || 0,
                target: this.getTarget('daily_1'),
                level: this.getLevel('daily_1'),
                multiplier: this.getRewardMultiplier('daily_1')
            },
            {
                id: 'daily_2',
                icon: '🟣',
                name: 'Собери фиолетовые',
                baseReward: 15,
                color: '#8e44ad',
                current: this.progress.daily_2 || 0,
                target: this.getTarget('daily_2'),
                level: this.getLevel('daily_2'),
                multiplier: this.getRewardMultiplier('daily_2')
            },
            {
                id: 'daily_3',
                icon: '🔥',
                name: 'Комбо ×10',
                baseReward: 20,
                color: '#e67e22',
                current: this.progress.daily_3 || 0,
                target: this.getTarget('daily_3'),
                level: this.getLevel('daily_3'),
                multiplier: this.getRewardMultiplier('daily_3')
            },
            {
                id: 'skill_1',
                icon: '📈',
                name: 'Лопни пузырьки (мастер)',
                baseReward: 25,
                color: '#3498db',
                current: this.progress.skill_1 || 0,
                target: this.getTarget('skill_1'),
                level: this.getLevel('skill_1'),
                multiplier: this.getRewardMultiplier('skill_1')
            },
            {
                id: 'skill_2',
                icon: '🔴',
                name: 'Собери красные',
                baseReward: 30,
                color: '#e74c3c',
                current: this.progress.skill_2 || 0,
                target: this.getTarget('skill_2'),
                level: this.getLevel('skill_2'),
                multiplier: this.getRewardMultiplier('skill_2')
            },
            {
                id: 'hard_1',
                icon: '🎯',
                name: '20 подряд без промаха',
                baseReward: 40,
                color: '#c0392b',
                current: this.progress.hard_1 || 0,
                target: this.getTarget('hard_1'),
                level: this.getLevel('hard_1'),
                multiplier: this.getRewardMultiplier('hard_1')
            },
            {
                id: 'hard_2',
                icon: '💎',
                name: 'Бонус 100+ за раз',
                baseReward: 50,
                color: '#f1c40f',
                current: this.progress.hard_2 || 0,
                target: this.getTarget('hard_2'),
                level: this.getLevel('hard_2'),
                multiplier: this.getRewardMultiplier('hard_2')
            },
            {
                id: 'collector',
                icon: '🌈',
                name: 'Все 5 цветов за игру',
                baseReward: 35,
                color: '#1abc9c',
                current: this.progress.collector || 0,
                target: this.getTarget('collector'),
                level: this.getLevel('collector'),
                multiplier: this.getRewardMultiplier('collector')
            }
        ];
    }

    // ===== ОБРАБОТКА ЛОПНУТОГО ПУЗЫРЬКА =====
    onBubblePopped(bubble, game) {
        // 1. Общее количество
        this.update('daily_1', 1);
        this.update('skill_1', 1);
        
        // 2. По цветам
        const colorType = game.bonusManager.getColorType(bubble.hue);
        if (colorType === 'pink') {
            this.update('daily_2', 1);
        } else if (colorType === 'red') {
            this.update('skill_2', 1);
        }
        
        // 3. Серия без промаха
        this.streak++;
        if (this.streak >= this.getTarget('hard_1')) {
            this.update('hard_1', 1);
            this.streak = 0;
        }
        
        // 4. Собираем все цвета
        if (colorType) {
            this.collectedColors.add(colorType);
            if (this.collectedColors.size >= 5) {
                this.update('collector', 1);
                this.collectedColors.clear();
            }
        }
    }

    // ===== ОБРАБОТКА КОМБО =====
    onCombo(combo) {
        if (combo >= 10 && combo % 10 === 0) {
            this.update('daily_3', 1);
        }
        this.lastCombo = combo;
    }

    // ===== ОБРАБОТКА БОЛЬШОГО БОНУСА =====
    onBigBonus(amount) {
        if (amount >= 100) {
            this.update('hard_2', 1);
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

    // ===== ПОКАЗАТЬ УВЕДОМЛЕНИЕ =====
    showNotification(text) {
        const popup = document.createElement('div');
        popup.className = 'challenge-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-title">${text}</div>
            </div>
        `;
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

    // ===== ОБЩАЯ СУММА НАГРАД =====
    getTotalRewards() {
        return this.rewards.reduce((sum, r) => sum + r, 0);
    }
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const challengeTracker = new ChallengeTracker();

// ===== ДЛЯ СОВМЕСТИМОСТИ =====
window.updateChallenge = function(id, value) {
    challengeTracker.update(id, value);
};

window.renderChallenges = function() {
    // Будет переопределено в challenges.js
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.renderChallenges) {
        window.renderChallenges();
    }
});