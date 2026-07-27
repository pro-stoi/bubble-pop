// js/core/dataStore.js

console.log('📌 [STORE] Файл загружен');

class DataStore {
    constructor() {
        console.log('📌 [STORE] Конструктор запущен');
        
        this.cache = {
            user: null,
            stats: null,
            challenges: [],
            top: null,
            userId: null
        };
        
        console.log('📌 [STORE] Кеш инициализирован');
        
        this.listeners = [];
        this.lastSync = 0;
        this.syncInterval = 30000;
        
        console.log('📌 [STORE] Загружаем из localStorage');
        this.loadFromLocal();
        
        console.log('✅ [STORE] Экземпляр создан');
    }

    loadFromLocal() {
        console.log('📌 [STORE] loadFromLocal() вызван');
        
        try {
            var userId = localStorage.getItem('bubbleUserId');
            if (userId) {
                this.cache.userId = parseInt(userId);
                console.log('📌 [STORE] userId из localStorage =', this.cache.userId);
            } else {
                console.log('📌 [STORE] userId в localStorage НЕ НАЙДЕН');
            }
            
            var username = localStorage.getItem('username');
            if (username) {
                this.cache.user = { name: username };
                console.log('📌 [STORE] username из localStorage =', username);
            }
        } catch (e) {
            console.warn('⚠️ [STORE] Ошибка загрузки из localStorage:', e.message);
        }
    }

    saveToLocal() {
        console.log('📌 [STORE] saveToLocal() вызван');
        try {
            if (this.cache.userId) {
                localStorage.setItem('bubbleUserId', String(this.cache.userId));
            }
            if (this.cache.user && this.cache.user.name) {
                localStorage.setItem('username', this.cache.user.name);
            }
            console.log('✅ [STORE] saveToLocal завершён');
        } catch (e) {
            console.warn('⚠️ [STORE] Ошибка сохранения в localStorage:', e.message);
        }
    }

    getUserId() {
        console.log('📌 [STORE] getUserId() =', this.cache.userId);
        return this.cache.userId;
    }

    getUser() {
        console.log('📌 [STORE] getUser() вызван');
        return this.cache.user;
    }

    getStats() {
        console.log('📌 [STORE] getStats() вызван');
        return this.cache.stats;
    }

    getChallenges() {
        console.log('📌 [STORE] getChallenges() вызван, записей =', this.cache.challenges ? this.cache.challenges.length : 0);
        return this.cache.challenges;
    }

    getTop() {
        console.log('📌 [STORE] getTop() вызван, записей =', this.cache.top ? this.cache.top.length : 0);
        return this.cache.top;
    }

    setUserId(id) {
        console.log('📌 [STORE] setUserId() =', id);
        this.cache.userId = id;
        this.saveToLocal();
        this.notify();
    }

    setUser(user) {
        console.log('📌 [STORE] setUser() вызван');
        this.cache.user = user;
        this.saveToLocal();
        this.notify();
    }

    setStats(stats) {
        console.log('📌 [STORE] setStats() вызван');
        this.cache.stats = stats;
        this.notify();
    }

    setChallenges(challenges) {
        console.log('📌 [STORE] setChallenges() вызван, записей =', challenges ? challenges.length : 0);
        this.cache.challenges = challenges;
        this.notify();
    }

    setTop(top) {
        console.log('📌 [STORE] setTop() вызван, записей =', top ? top.length : 0);
        this.cache.top = top;
        this.notify();
    }

    notify() {
        console.log('📌 [STORE] notify() вызван, слушателей =', this.listeners.length);
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.cache);
        }
    }

    subscribe(callback) {
        console.log('📌 [STORE] subscribe() вызван');
        this.listeners.push(callback);
    }

    touch() {
        console.log('📌 [STORE] touch() вызван');
        this.lastSync = Date.now();
    }

    needsSync() {
        var result = Date.now() - this.lastSync > this.syncInterval;
        console.log('📌 [STORE] needsSync() =', result);
        return result;
    }
}

console.log('📌 [STORE] Создаём экземпляр...');
var dataStore = new DataStore();
console.log('✅ [STORE] Готов!');