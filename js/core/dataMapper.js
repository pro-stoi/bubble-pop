// js/core/dataMapper.js

console.log('📌 [MAPPER] Файл загружен');

class DataMapper {
    constructor() {
        console.log('📌 [MAPPER] Конструктор запущен');
    }
    
    static parseJsonb(value, defaultValue) {
        console.log('📌 [MAPPER] parseJsonb() вызван');
        
        if (!value) {
            console.log('📌 [MAPPER] value пустой, возвращаем defaultValue');
            return defaultValue || {};
        }
        
        if (typeof value === 'object' && !value.type) {
            console.log('📌 [MAPPER] value уже объект');
            return value;
        }
        
        if (typeof value === 'string') {
            try {
                var parsed = JSON.parse(value);
                console.log('✅ [MAPPER] JSON распаршен');
                return parsed;
            } catch (e) {
                console.warn('⚠️ [MAPPER] Ошибка парсинга JSON:', e.message);
                return defaultValue || {};
            }
        }
        
        if (value.type === 'jsonb' && value.value) {
            try {
                var parsed = typeof value.value === 'string' ? JSON.parse(value.value) : value.value;
                console.log('✅ [MAPPER] JSONB распаршен');
                return parsed;
            } catch (e) {
                console.warn('⚠️ [MAPPER] Ошибка парсинга JSONB:', e.message);
                return defaultValue || {};
            }
        }
        
        console.log('📌 [MAPPER] Возвращаем defaultValue');
        return defaultValue || {};
    }

    static toJsonb(value) {
        console.log('📌 [MAPPER] toJsonb() вызван');
        if (!value) {
            console.log('📌 [MAPPER] value пустой, возвращаем {}');
            return '{}';
        }
        var result = typeof value === 'string' ? value : JSON.stringify(value);
        console.log('✅ [MAPPER] toJsonb завершён');
        return result;
    }

// dataMapper.js - в методе prepareStatsForApi()

static prepareStatsForApi(stats) {
    console.log('📌 [MAPPER] prepareStatsForApi() вызван');
    console.log('📌 [MAPPER] stats.lastPlay на входе:', stats.lastPlay);
    
    var payload = {
        userId: stats.userId,
        total_popped: stats.totalPopped || 0,
        max_combo: stats.maxCombo || 0,
        max_score: stats.maxScore || 0,
        total_bonus_earned: stats.totalBonusEarned || 0,
        total_bonus_used: stats.totalBonusUsed || 0,
        best_streak: stats.bestStreak || 0,
        big_bonus_count: stats.bigBonusCount || 0,
        color_set_count: stats.colorSetCount || 0,
        sessions: stats.sessions || 0,
        total_time: stats.totalTime || 0,
        total_ads_watched: stats.totalAdsWatched || 0,
        active_skin: stats.activeSkin || 'default',
    };

    // ===== ДОБАВЛЯЕМ lastPlay В PAYLOAD =====
    if (stats.lastPlay) {
        payload.last_play = stats.lastPlay;
        console.log('📌 [MAPPER] lastPlay добавлен в payload:', stats.lastPlay);
    } else {
        console.warn('📌 [MAPPER] lastPlay ОТСУТСТВУЕТ в stats!');
    }

    if (stats.colorPops) {
        payload.color_pops = this.toJsonb(stats.colorPops);
    }
    if (stats.bonusEarned) {
        payload.bonus_earned = this.toJsonb(stats.bonusEarned);
    }
    if (stats.bonusUsed) {
        payload.bonus_used = this.toJsonb(stats.bonusUsed);
    }
    if (stats.skins) {
        payload.skins = this.toJsonb(stats.skins);
    }
    if (stats.challengeProgress) {
        payload.challenge_progress = this.toJsonb(stats.challengeProgress);
    }

    console.log('📌 [MAPPER] payload.lastPlay перед отправкой:', payload.last_play);
    console.log('📌 [MAPPER] Весь payload:', payload);
    console.log('✅ [MAPPER] prepareStatsForApi завершён');
    return payload;
}

    static prepareTopForApi(data) {
        console.log('📌 [MAPPER] prepareTopForApi() вызван');
        
        var result = {
            userId: data.userId,
            score: data.score || 0,
            maxCombo: data.maxCombo || 0,
            challengePoints: data.challengePoints || 0,
            totalPopped: data.totalPopped || 0
        };
        
        console.log('✅ [MAPPER] prepareTopForApi завершён');
        return result;
    }

    static parseStatsResponse(response) {
        console.log('📌 [MAPPER] parseStatsResponse() вызван');
        
        var result = {
            totalPopped: response.total_popped || 0,
            maxCombo: response.max_combo || 0,
            maxScore: response.max_score || 0,
            totalBonusEarned: response.total_bonus_earned || 0,
            totalBonusUsed: response.total_bonus_used || 0,
            bestStreak: response.best_streak || 0,
            bigBonusCount: response.big_bonus_count || 0,
            colorSetCount: response.color_set_count || 0,
            sessions: response.sessions || 0,
            totalTime: response.total_time || 0,
            totalAdsWatched: response.total_ads_watched || 0,
            activeSkin: response.active_skin || 'default',
            colorPops: this.parseJsonb(response.color_pops, { red:0, green:0, blue:0, yellow:0, pink:0 }),
            bonusEarned: this.parseJsonb(response.bonus_earned, { slow:0, magnet:0, explosion:0, multiplier:0, clear:0 }),
            bonusUsed: this.parseJsonb(response.bonus_used, { slow:0, magnet:0, explosion:0, multiplier:0, clear:0 }),
            skins: this.parseJsonb(response.skins, {}),
            challengeProgress: this.parseJsonb(response.challenge_progress, {})
        };
        
        console.log('✅ [MAPPER] parseStatsResponse завершён');
        return result;
    }
}

console.log('✅ [MAPPER] Готов!');