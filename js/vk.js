// js/vk.js

class VKManager {
    constructor() {
        this.isReady = false;
        this.userId = null;
        this.userName = 'Игрок';
        this.appId = 54650664;
        this.bridge = null;
        this.dbUserId = null;
        this.topCache = null;
        this.topCacheTime = 0;
        
        // ===== АДРЕС СЕРВЕРА =====
        this.serverUrl = 'https://neurodrone-arena.ru/api';
    }

    // ... остальные методы ...

    // ===== АВТОРИЗАЦИЯ =====
    async loginToServer() {
        try {
            const response = await fetch(`${this.serverUrl}/user/bubble/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vkId: this.userId,
                    userName: this.userName
                })
            });
            
            const user = await response.json();
            this.dbUserId = user.id;
            console.log('✅ Авторизован в Bubble, ID:', this.dbUserId);
            
        } catch (error) {
            console.error('❌ Ошибка авторизации:', error);
        }
    }

    // ===== СОХРАНИТЬ РЕЗУЛЬТАТ =====
    async saveToGlobalTop(score, maxCombo, challengePoints) {
        if (!this.dbUserId) {
            console.warn('⚠️ Нет ID пользователя, пробуем авторизоваться...');
            await this.loginToServer();
            if (!this.dbUserId) {
                console.warn('⚠️ Не удалось авторизоваться, сохранение локально');
                this.saveToLocalTop(score, maxCombo, challengePoints);
                return;
            }
        }
        
        console.log('💾 Сохранение на сервер:', { score, maxCombo, challengePoints });
        
        try {
            const response = await fetch(`${this.serverUrl}/top/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.dbUserId,
                    score: score || 0,
                    maxCombo: maxCombo || 0,
                    challengePoints: challengePoints || 0
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Результат сохранён на сервере');
                this.topCache = null;
                return true;
            } else {
                console.warn('⚠️ Ошибка сохранения:', data.message);
                this.saveToLocalTop(score, maxCombo, challengePoints);
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка соединения с сервером:', error);
            this.saveToLocalTop(score, maxCombo, challengePoints);
            return false;
        }
    }

    // ===== ПОЛУЧИТЬ ТОП =====
    async getGlobalTop() {
        console.log('📊 Запрос топа с сервера...');
        
        const cacheAge = Date.now() - this.topCacheTime;
        if (this.topCache && cacheAge < 30000) {
            console.log('📦 Возвращаем топ из кэша');
            return this.topCache;
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/top`);
            const top = await response.json();
            
            if (Array.isArray(top)) {
                console.log('📊 Загружено записей с сервера:', top.length);
                this.topCache = top;
                this.topCacheTime = Date.now();
                return top;
            } else {
                console.warn('⚠️ Сервер вернул некорректные данные');
                return this.getLocalTop();
            }
        } catch (error) {
            console.error('❌ Ошибка соединения с сервером:', error);
            return this.getLocalTop();
        }
    }

    // ... остальные методы ...
}
