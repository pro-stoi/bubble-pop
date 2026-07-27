// js/stats.js

console.log('📊 [STATS] Файл загружен');

class StatsManager {
    constructor() {
        console.log('📊 [STATS] Конструктор запущен');
        
        this.userId = null;
        this.isLoaded = false;
        this.sessionStart = Date.now();

        var isLocal = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.protocol === 'file:';
        
        this.apiUrl = isLocal
            ? 'http://170.168.10.167:8080/api/bubble/stats'
            : 'https://neurodrone-arena.ru/api/bubble/stats';

        console.log('📊 [STATS] apiUrl =', this.apiUrl);

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

        this.sessions = 0;
        this.totalTime = 0;
        this.totalAdsWatched = 0;
        this.skins = {};
        this.activeSkin = 'default';
        this.lastPlay = null;
        
        console.log('✅ [STATS] Экземпляр создан');
    }

    async load(userId) {
        console.log('📊 [STATS] load() вызван, userId =', userId);
        this.userId = userId;

        try {
            console.log('📊 [STATS] Вызываем repository.loadStats(' + userId + ')');
            var stats = await repository.loadStats(userId);
            
            console.log('📊 [STATS] Получены данные:', stats);
            
            if (stats) {
                this.totalPopped = stats.totalPopped || 0;
                this.maxCombo = stats.maxCombo || 0;
                this.maxScore = stats.maxScore || 0;
                this.totalBonusEarned = stats.totalBonusEarned || 0;
                this.totalBonusUsed = stats.totalBonusUsed || 0;
                this.bestStreak = stats.bestStreak || 0;
                this.bigBonusCount = stats.bigBonusCount || 0;
                this.colorSetCount = stats.colorSetCount || 0;
                this.sessions = stats.sessions || 0;
                this.totalTime = stats.totalTime || 0;
                this.totalAdsWatched = stats.totalAdsWatched || 0;
                this.activeSkin = stats.activeSkin || 'default';
                this.lastPlay = stats.lastPlay || null;

                if (stats.colorPops) {
                    this.colorPops = stats.colorPops;
                }
                if (stats.bonusEarned) {
                    this.bonusEarned = stats.bonusEarned;
                }
                if (stats.bonusUsed) {
                    this.bonusUsed = stats.bonusUsed;
                }
                if (stats.skins) {
                    this.skins = stats.skins;
                }
                if (stats.challengeProgress) {
                    this.challengeProgress = stats.challengeProgress;
                }

                this.isLoaded = true;
                console.log('✅ [STATS] Данные загружены');
                return true;
            }
        } catch (error) {
            console.error('❌ [STATS] Ошибка загрузки:', error);
        }
        return false;
    }

  // stats.js - в методе save()

async save() {
    console.log('📊 [STATS] save() вызван');
    
    if (!this.userId) {
        console.warn('⚠️ [STATS] Нет userId для сохранения');
        return false;
    }

    var sessionTime = Math.floor((Date.now() - this.sessionStart) / 1000);
    this.totalTime = (this.totalTime || 0) + sessionTime;
    this.sessions = (this.sessions || 0) + 1;
    
    // ===== СОЗДАЁМ ВРЕМЯ =====
    var now = new Date();
    console.log('📊 [STATS] 1. Сырое время (new Date()):', now);
    console.log('📊 [STATS] 2. ISO формат:', now.toISOString());
    console.log('📊 [STATS] 3. Локальное время (toLocaleString):', now.toLocaleString());
    
    this.lastPlay = now.toISOString();
    console.log('📊 [STATS] 4. lastPlay для сохранения:', this.lastPlay);

    console.log('📊 [STATS] Сохраняем статистику для userId =', this.userId);
    console.log('📊 [STATS] totalPopped =', this.totalPopped);
    console.log('📊 [STATS] maxCombo =', this.maxCombo);
    console.log('📊 [STATS] maxScore =', this.maxScore);
    console.log('📊 [STATS] sessions =', this.sessions);
    console.log('📊 [STATS] totalTime =', this.totalTime);

    try {
        var payload = {
            userId: this.userId,
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
            challengeProgress: this.challengeProgress || {},
            sessions: this.sessions,
            totalTime: this.totalTime,
            totalAdsWatched: this.totalAdsWatched || 0,
            activeSkin: this.activeSkin || 'default',
            skins: this.skins || {},
            lastPlay: this.lastPlay
        };
        
        console.log('📊 [STATS] 5. payload.lastPlay перед отправкой:', payload.lastPlay);
        
        var result = await repository.saveStats(payload);
        console.log('📊 [STATS] Результат сохранения:', result);
        return result;
        
    } catch (error) {
        console.error('❌ [STATS] Ошибка сохранения:', error);
        return false;
    }
}

    onBubblePopped(colorType) {
        this.totalPopped++;
        if (colorType && this.colorPops[colorType] !== undefined) {
            this.colorPops[colorType]++;
        }
        console.log('📊 [STATS] Лопнут:', colorType, ', всего:', this.totalPopped);
    }

    onCombo(combo) {
        if (combo > this.maxCombo) {
            this.maxCombo = combo;
            console.log('📊 [STATS] Новый максимум комбо:', this.maxCombo);
        }
    }

    onScore(score) {
        if (score > this.maxScore) {
            this.maxScore = score;
            console.log('📊 [STATS] Новый максимум счёта:', this.maxScore);
        }
    }

    onBonusEarned(bonusType) {
        var bonusMap = {
            'red': 'slow',
            'yellow': 'magnet',
            'green': 'explosion',
            'blue': 'multiplier',
            'pink': 'clear'
        };
        var mappedType = bonusMap[bonusType] || bonusType;
        if (this.bonusEarned[mappedType] !== undefined) {
            this.bonusEarned[mappedType]++;
            this.totalBonusEarned++;
            console.log('📊 [STATS] Заработан бонус:', mappedType, ', всего:', this.totalBonusEarned);
        }
    }

    onBonusUsed(bonusType) {
        var bonusMap = {
            'red': 'slow',
            'yellow': 'magnet',
            'green': 'explosion',
            'blue': 'multiplier',
            'pink': 'clear'
        };
        var mappedType = bonusMap[bonusType] || bonusType;
        if (this.bonusUsed[mappedType] !== undefined) {
            this.bonusUsed[mappedType]++;
            this.totalBonusUsed++;
            console.log('📊 [STATS] Использован бонус:', mappedType, ', всего:', this.totalBonusUsed);
        }
    }

    onAdWatched() {
        this.totalAdsWatched = (this.totalAdsWatched || 0) + 1;
        console.log('📊 [STATS] Просмотр рекламы, всего:', this.totalAdsWatched);
    }

    onStreak(streak) {
        if (streak > this.bestStreak) {
            this.bestStreak = streak;
            console.log('📊 [STATS] Новая лучшая серия:', this.bestStreak);
        }
    }

    onBigBonus() {
        this.bigBonusCount++;
        console.log('📊 [STATS] Большой бонус, всего:', this.bigBonusCount);
    }

    onColorSet() {
        this.colorSetCount++;
        console.log('📊 [STATS] Собраны все цвета, всего:', this.colorSetCount);
    }

    updateChallengeProgress(challengeId, progress) {
        this.challengeProgress[challengeId] = progress;
        console.log('📊 [STATS] Прогресс испытания', challengeId, '=', progress);
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
        console.log('📊 [STATS] Сброс статистики');
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

console.log('📊 [STATS] Создаём экземпляр...');
var statsManager = new StatsManager();
console.log('✅ [STATS] Готов!');