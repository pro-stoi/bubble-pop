// js/stats.js

class StatsManager {
    constructor() {
        this.userId = null;
        this.isLoaded = false;
        this.apiUrl = 'https://neurodrone-arena.ru/api/bubble/stats';
        
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

    // ===== ПАРСИНГ JSONB ИЗ БД =====
    parseJsonBField(field, defaultObj) {
        if (!field) return defaultObj;
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch (e) { return defaultObj; }
        }
        if (typeof field === 'object') {
            if (field.type === 'jsonb' && field.value) {
                try { return JSON.parse(field.value); } catch (e) { return defaultObj; }
            }
            if (field.red !== undefined || field.slow !== undefined) {
                return field;
            }
        }
        return defaultObj;
    }

    async load(userId) {
        this.userId = userId;
        
        try {
            const response = await fetch(`${this.apiUrl}/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.totalPopped = data.total_popped || 0;
                this.colorPops = { red: 0, green: 0, blue: 0, yellow: 0, pink: 0 };
                this.maxCombo = data.max_combo || 0;
                this.maxScore = data.max_score || 0;
                this.totalBonusEarned = data.total_bonus_earned || 0;
                this.bonusEarned = { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
                this.totalBonusUsed = data.total_bonus_used || 0;
                this.bonusUsed = { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 };
                this.bestStreak = data.best_streak || 0;
                this.bigBonusCount = data.big_bonus_count || 0;
                this.colorSetCount = data.color_set_count || 0;
                this.challengeProgress = data.challenge_progress || {};
                
                this.isLoaded = true;
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
        }
        return false;
    }

    async save() {
        if (!this.userId) {
            console.warn('⚠️ Нет userId для сохранения');
            return false;
        }

        try {
            const payload = {
                userId: this.userId,
                total_popped: this.totalPopped,
                color_pops: JSON.stringify(this.colorPops),
                max_combo: this.maxCombo,
                max_score: this.maxScore,
                total_bonus_earned: this.totalBonusEarned,
                bonus_earned: JSON.stringify(this.bonusEarned),
                total_bonus_used: this.totalBonusUsed,
                bonus_used: JSON.stringify(this.bonusUsed),
                best_streak: this.bestStreak,
                big_bonus_count: this.bigBonusCount,
                color_set_count: this.colorSetCount,
                challenge_progress: JSON.stringify(this.challengeProgress)
            };

            const response = await fetch(`${this.apiUrl}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Статистика сохранена!');
                return true;
            } else {
                console.error('❌ Ошибка:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка соединения:', error);
            return false;
        }
    }

    // ===== ОБНОВЛЕНИЯ ВО ВРЕМЯ ИГРЫ =====

    onBubblePopped(colorType) {
        this.totalPopped++;
        if (colorType && this.colorPops[colorType] !== undefined) {
            this.colorPops[colorType]++;
        }
    }

    onCombo(combo) {
        if (combo > this.maxCombo) {
            this.maxCombo = combo;
        }
    }

    onScore(score) {
        if (score > this.maxScore) {
            this.maxScore = score;
        }
    }

    onBonusEarned(bonusType) {
        const bonusMap = {
            'red': 'slow',
            'yellow': 'magnet',
            'green': 'explosion',
            'blue': 'multiplier',
            'pink': 'clear'
        };
        
        const mappedType = bonusMap[bonusType] || bonusType;
        
        if (this.bonusEarned[mappedType] !== undefined) {
            this.bonusEarned[mappedType]++;
            this.totalBonusEarned++;
        }
    }

    onBonusUsed(bonusType) {
        const bonusMap = {
            'red': 'slow',
            'yellow': 'magnet',
            'green': 'explosion',
            'blue': 'multiplier',
            'pink': 'clear'
        };
        
        const mappedType = bonusMap[bonusType] || bonusType;
        
        if (this.bonusUsed[mappedType] !== undefined) {
            this.bonusUsed[mappedType]++;
            this.totalBonusUsed++;
        }
    }

    onStreak(streak) {
        if (streak > this.bestStreak) {
            this.bestStreak = streak;
        }
    }

    onBigBonus() {
        this.bigBonusCount++;
    }

    onColorSet() {
        this.colorSetCount++;
    }

    updateChallengeProgress(challengeId, progress) {
        this.challengeProgress[challengeId] = progress;
    }

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

    reset() {}
}

const statsManager = new StatsManager();