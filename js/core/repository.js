// js/core/repository.js

console.log('📌 [REPO] Файл загружен');

class Repository {
    constructor() {
        console.log('📌 [REPO] Конструктор запущен');
        
        console.log('📌 [REPO] Проверяем api =', typeof api !== 'undefined' ? 'ЕСТЬ' : 'НЕТ');
        this.api = api;
        
        console.log('📌 [REPO] Проверяем dataStore =', typeof dataStore !== 'undefined' ? 'ЕСТЬ' : 'НЕТ');
        this.store = dataStore;
        
        console.log('📌 [REPO] Проверяем DataMapper =', typeof DataMapper !== 'undefined' ? 'ЕСТЬ' : 'НЕТ');
        this.mapper = DataMapper;
        
        console.log('✅ [REPO] Экземпляр создан');
    }

    async login(vkId, userName) {
        console.log('📌 [REPO] login() вызван');
        try {
            var response = await this.api.login(vkId, userName);
            if (response.success) {
                this.store.setUserId(response.id);
                this.store.setUser({ id: response.id, name: response.username });
                console.log('✅ [REPO] login успешен, userId =', response.id);
                return response;
            }
            console.warn('⚠️ [REPO] login вернул success = false');
            throw new Error(response.error || 'Ошибка авторизации');
        } catch (error) {
            console.error('❌ [REPO] Ошибка в login:', error.message);
            throw error;
        }
    }

    getUserId() {
        console.log('📌 [REPO] getUserId() вызван');
        return this.store.getUserId();
    }

    getUser() {
        console.log('📌 [REPO] getUser() вызван');
        return this.store.getUser();
    }

    async loadStats(userId) {
        console.log('📌 [REPO] loadStats() вызван, userId =', userId);
        try {
            var response = await this.api.getStats(userId);
            if (response.success) {
                var stats = this.mapper.parseStatsResponse(response);
                this.store.setStats(stats);
                console.log('✅ [REPO] loadStats успешен');
                return stats;
            }
            console.warn('⚠️ [REPO] loadStats вернул success = false');
            throw new Error(response.error || 'Ошибка загрузки статистики');
        } catch (error) {
            console.error('❌ [REPO] Ошибка в loadStats:', error.message);
            throw error;
        }
    }

// repository.js - в методе saveStats()

async saveStats(stats) {
    console.log('📌 [REPO] saveStats() вызван');
    console.log('📌 [REPO] stats.lastPlay на входе:', stats.lastPlay);
    
    try {
        var payload = this.mapper.prepareStatsForApi(stats);
        console.log('📌 [REPO] payload.lastPlay после маппера:', payload.last_play);
        
        var response = await this.api.updateStats(payload);
        console.log('📌 [REPO] Ответ от API:', response);
        
        if (response.success) {
            this.store.touch();
            console.log('✅ [REPO] saveStats успешен');
            return true;
        }
        console.warn('⚠️ [REPO] saveStats вернул success = false');
        return false;
    } catch (error) {
        console.error('❌ [REPO] Ошибка в saveStats:', error.message);
        return false;
    }
}

    async loadTop() {
        console.log('📌 [REPO] loadTop() вызван');
        
        try {
            console.log('📌 [REPO] Вызываем api.getTop()');
            var data = await this.api.getTop();
            console.log('📌 [REPO] api.getTop() вернул, записей =', data ? data.length : 0);
            
            if (data && Array.isArray(data)) {
                console.log('📌 [REPO] Сохраняем в dataStore');
                this.store.setTop(data);
                console.log('✅ [REPO] loadTop завершён, записей =', data.length);
                return data;
            } else {
                console.warn('⚠️ [REPO] Данные не массив, пробуем кеш');
                var cached = this.store.getTop();
                if (cached) {
                    console.log('📌 [REPO] Кеш найден, записей =', cached.length);
                    return cached;
                }
                console.warn('⚠️ [REPO] Кеша нет, возвращаем пустой массив');
                return [];
            }
        } catch (error) {
            console.error('❌ [REPO] Ошибка в loadTop:', error.message);
            console.log('📌 [REPO] Пробуем кеш');
            var cached = this.store.getTop();
            if (cached) {
                console.log('📌 [REPO] Кеш найден, записей =', cached.length);
                return cached;
            }
            console.warn('⚠️ [REPO] Кеша нет, возвращаем пустой массив');
            return [];
        }
    }

    async saveToTop(userId, score, maxCombo, challengePoints, totalPopped) {
        console.log('📌 [REPO] saveToTop() вызван');
        try {
            var data = this.mapper.prepareTopForApi({
                userId: userId,
                score: score,
                maxCombo: maxCombo,
                challengePoints: challengePoints,
                totalPopped: totalPopped
            });
            var response = await this.api.saveToTop(data);
            console.log('📌 [REPO] saveToTop завершён, success =', response.success);
            return response.success;
        } catch (error) {
            console.error('❌ [REPO] Ошибка в saveToTop:', error.message);
            return false;
        }
    }

    async loadChallenges(userId) {
        console.log('📌 [REPO] loadChallenges() вызван, userId =', userId);
        try {
            var response = await this.api.getChallenges(userId);
            if (response.success) {
                this.store.setChallenges(response.challenges);
                console.log('✅ [REPO] loadChallenges успешен, записей =', response.challenges ? response.challenges.length : 0);
                return {
                    challenges: response.challenges,
                    totalReward: response.totalReward || 0
                };
            }
            console.warn('⚠️ [REPO] loadChallenges вернул success = false');
            throw new Error(response.error || 'Ошибка загрузки испытаний');
        } catch (error) {
            console.error('❌ [REPO] Ошибка в loadChallenges:', error.message);
            return { challenges: [], totalReward: 0 };
        }
    }

    async updateChallenge(userId, challengeId, delta) {
        console.log('📌 [REPO] updateChallenge() вызван');
        try {
            var response = await this.api.updateChallenge({
                userId: userId,
                challengeId: challengeId,
                delta: delta
            });
            console.log('📌 [REPO] updateChallenge завершён');
            return response;
        } catch (error) {
            console.error('❌ [REPO] Ошибка в updateChallenge:', error.message);
            return { success: false };
        }
    }

    async getTotalRewards(userId) {
        console.log('📌 [REPO] getTotalRewards() вызван, userId =', userId);
        try {
            var response = await this.api.getTotalRewards(userId);
            console.log('📌 [REPO] getTotalRewards завершён, total =', response.totalReward);
            return response.totalReward || 0;
        } catch (error) {
            console.error('❌ [REPO] Ошибка в getTotalRewards:', error.message);
            return 0;
        }
    }

    async sync() {
        console.log('📌 [REPO] sync() вызван');
        var userId = this.getUserId();
        if (!userId) {
            console.warn('⚠️ [REPO] Нет userId, выходим');
            return;
        }
        
        if (this.store.needsSync()) {
            console.log('📌 [REPO] Нужна синхронизация');
            await this.loadStats(userId);
            await this.loadChallenges(userId);
            this.store.touch();
        } else {
            console.log('📌 [REPO] Синхронизация не нужна');
        }
    }
}

console.log('📌 [REPO] Создаём экземпляр...');
var repository = new Repository();
console.log('✅ [REPO] Готов!');
console.log('✅ [REPO] ВСЕ ФАЙЛЫ ЗАГРУЖЕНЫ!');
