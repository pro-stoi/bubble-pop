// js/stats.js

class StatsManager {
    constructor() {
        this.userId = null;
        this.isLoaded = false;
        this.apiUrl = '/api/bubble/stats';
        
        // Локальный кэш статистики
        this.totalPopped = 0;
        this.colorPops = { red: 0, green: 0, blue: 0, yellow: 0, pink: 0 };
        this.maxCombo = 0;
        this.maxScore = 0;
        this.totalBonusEarned = 0;
        this.bonusEarned = { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
        this.totalBonusUsed = 0;
        this.bonusUsed = { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
        this.bestStreak = 0;
        this.bigBonusCount = 0;
        this.colorSetCount = 0;
        this.challengeProgress = {};
    }

    // ===== ЗАГРУЗИТЬ СТАТИСТИКУ С СЕРВЕРА =====
    async load(userId) {
        this.userId = userId;
        
        try {
            const response = await fetch(`${this.apiUrl}/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                // Загружаем данные в локальный кэш
                this.totalPopped = data.total_popped || 0;
                this.colorPops = data.color_pops || { red: 0, green: 0, blue: 0, yellow: 0, pink: 0 };
                this.maxCombo = data.max_combo || 0;
                this.maxScore = data.max_score || 0;
                this.totalBonusEarned = data.total_bonus_earned || 0;
                this.bonusEarned = data.bonus_earned || { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
                this.totalBonusUsed = data.total_bonus_used || 0;
                this.bonusUsed = data.bonus_used || { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
                this.bestStreak = data.best_streak || 0;
                this.bigBonusCount = data.big_bonus_count || 0;
                this.colorSetCount = data.color_set_count || 0;
                this.challengeProgress = data.challenge_progress || {};
                
                this.isLoaded = true;
                console.log('✅ Статистика загружена');
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
        }
        return false;
    }

    // ===== СОХРАНИТЬ СТАТИСТИКУ НА СЕРВЕР =====
    async save() {
        if (!this.userId) {
            console.warn('⚠️ Нет userId для сохранения');
            return false;
        }

        try {
            const payload = {
                userId: this.userId,
                total_popped: this.totalPopped,
                color_pops: this.colorPops,
                max_combo: this.maxCombo,
                max_score: this.maxScore,
                total_bonus_earned: this.totalBonusEarned,
                bonus_earned: this.bonusEarned,
                total_bonus_used: this.totalBonusUsed,
                bonus_used: this.bonusUsed,
                best_streak: this.bestStreak,
                big_bonus_count: this.bigBonusCount,
                color_set_count: this.colorSetCount,
                challenge_progress: this.challengeProgress
            };

            const response = await fetch(`${this.apiUrl}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Статистика сохранена');
                return true;
            } else {
                console.error('❌ Ошибка сохранения:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            return false;
        }
    }

    // ===== ОБНОВЛЕНИЯ ВО ВРЕМЯ ИГРЫ =====

    // Лопнул пузырёк
    onBubblePopped(colorType) {
        this.totalPopped++;
        if (colorType && this.colorPops[colorType] !== undefined) {
            this.colorPops[colorType]++;
        }
    }

    // Обновить комбо
    onCombo(combo) {
        if (combo > this.maxCombo) {
            this.maxCombo = combo;
        }
    }

    // Обновить счёт
    onScore(score) {
        if (score > this.maxScore) {
            this.maxScore = score;
        }
    }

    // Заработан бонус
    onBonusEarned(bonusType) {
        if (this.bonusEarned[bonusType] !== undefined) {
            this.bonusEarned[bonusType]++;
            this.totalBonusEarned++;
        }
    }

    // Использован бонус
    onBonusUsed(bonusType) {
        if (this.bonusUsed[bonusType] !== undefined) {
            this.bonusUsed[bonusType]++;
            this.totalBonusUsed++;
        }
    }

    // Серия без промаха
    onStreak(streak) {
        if (streak > this.bestStreak) {
            this.bestStreak = streak;
        }
    }

    // Бонус 100+ за раз
    onBigBonus() {
        this.bigBonusCount++;
    }

    // Собраны все цвета
    onColorSet() {
        this.colorSetCount++;
    }

    // Обновить прогресс испытания
    updateChallengeProgress(challengeId, progress) {
        this.challengeProgress[challengeId] = progress;
    }

    // ===== ПОЛУЧИТЬ ДАННЫЕ =====
    getStats() {
        return {
            totalPopped: this.totalPopped,
            colorPops: this.colorPops,
            maxCombo: this.maxCombo,
            maxScore: this.maxScore,
            totalBonusEarned: this.totalBonusEarned,
            bonusEarned: this.bonusEarned,
            totalBonusUsed: this.totalBonusUsed,
            bonusUsed: this.bonusUsed,
            bestStreak: this.bestStreak,
            bigBonusCount: this.bigBonusCount,
            colorSetCount: this.colorSetCount,
            challengeProgress: this.challengeProgress
        };
    }

    // ===== СБРОС (новая игра) =====
    reset() {
        // Не сбрасываем maxScore и maxCombo — они должны сохраняться
        // Сбрасываем только временные данные
        // (ничего не делаем, так как статистика накапливается)
    }
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const statsManager = new StatsManager();