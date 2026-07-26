// js/stats.js

class StatsManager {
    constructor() {
        this.userId = null;
        this.isLoaded = false;
        this.apiUrl = 'http://170.168.10.167:8080/api/bubble/stats';
        
        // ===== ОСНОВНЫЕ СЧЁТЧИКИ =====
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
        
        // ===== ДОПОЛНИТЕЛЬНЫЕ =====
        this.sessions = 0;
        this.totalTime = 0;
        this.totalAdsWatched = 0;
        this.skins = {};
        this.activeSkin = 'default';
        this.sessionStart = Date.now();
        this.lastPlay = null;
    }

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async load(userId) {
        this.userId = userId;
        
        try {
            const response = await fetch(`${this.apiUrl}/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                // Простые поля
                this.totalPopped = data.total_popped || 0;
                this.maxCombo = data.max_combo || 0;
                this.maxScore = data.max_score || 0;
                this.totalBonusEarned = data.total_bonus_earned || 0;
                this.totalBonusUsed = data.total_bonus_used || 0;
                this.bestStreak = data.best_streak || 0;
                this.bigBonusCount = data.big_bonus_count || 0;
                this.colorSetCount = data.color_set_count || 0;
                this.sessions = data.sessions || 0;
                this.totalTime = data.total_time || 0;
                this.totalAdsWatched = data.total_ads_watched || 0;
                this.activeSkin = data.active_skin || 'default';
                this.lastPlay = data.last_play || null;
                
                // JSONB поля (парсим)
                this.colorPops = this.parseJson(data.color_pops, { red: 0, green: 0, blue: 0, yellow: 0, pink: 0 });
                this.bonusEarned = this.parseJson(data.bonus_earned, { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 });
                this.bonusUsed = this.parseJson(data.bonus_used, { slow: 0, magnet: 0, explosion: 0, multiplier: 0, clear: 0 });
                this.skins = this.parseJson(data.skins, {});
                this.challengeProgress = this.parseJson(data.challenge_progress, {});
                
                this.isLoaded = true;
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
        }
        return false;
    }

    // ===== ПАРСИНГ JSONB =====
    parseJson(value, defaultValue) {
        if (!value) return defaultValue;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch (_) { return defaultValue; }
        }
        if (typeof value === 'object') {
            // Если это обёртка jsonb
            if (value.type === 'jsonb' && value.value) {
                try { return JSON.parse(value.value); } catch (_) { return defaultValue; }
            }
            return value;
        }
        return defaultValue;
    }

    // ===== СОХРАНЕНИЕ =====
async save() {
    if (!this.userId) {
        console.warn('⚠️ Нет userId для сохранения');
        return false;
    }

    const sessionTime = Math.floor((Date.now() - this.sessionStart) / 1000);
    this.totalTime = (this.totalTime || 0) + sessionTime;
    this.sessions = (this.sessions || 0) + 1;

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
        challenge_progress: JSON.stringify(this.challengeProgress || {}),
        sessions: this.sessions,
        total_time: this.totalTime,
        total_ads_watched: this.totalAdsWatched || 0,
        active_skin: this.activeSkin || 'default',
        skins: JSON.stringify(this.skins || {}),
        // ===== КЛЮЧЕВОЕ ИЗМЕНЕНИЕ =====
        last_play: new Date()  // ← ОБЪЕКТ DATE, НЕ СТРОКА!
    };

    console.log('📤 Отправка:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${this.apiUrl}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📥 Ответ:', result);
        return result.success;
    } catch (error) {
        console.error('❌ Ошибка:', error);
        return false;
    }
}

    // ===== ОБНОВЛЕНИЯ ВО ВРЕМЯ ИГРЫ =====
    onBubblePopped(colorType) {
        this.totalPopped++;
        if (colorType && this.colorPops[colorType] !== undefined) {
            this.colorPops[colorType]++;
        }
        console.log('📊 Лопнут: ' + colorType + ', всего: ' + this.totalPopped);
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

    onAdWatched() {
        this.totalAdsWatched = (this.totalAdsWatched || 0) + 1;
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

    reset() {
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
        this.sessionStart = Date.now();
    }
}

const statsManager = new StatsManager();