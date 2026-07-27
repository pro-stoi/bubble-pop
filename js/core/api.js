// js/core/api.js

console.log('📌 [API] Файл загружен');

class ApiClient {
    constructor() {
        console.log('📌 [API] Конструктор запущен');
        
        var isLocal = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.protocol === 'file:';
        
        console.log('📌 [API] isLocal =', isLocal);
        
        this.baseUrl = isLocal 
            ? 'http://170.168.10.167:8080/api/bubble'
            : 'https://neurodrone-arena.ru/api/bubble';
        
        console.log('📌 [API] baseUrl =', this.baseUrl);
        
        this.timeout = 10000;
        this.retries = 3;
        this.headers = {
            'Content-Type': 'application/json'
        };
        
        console.log('✅ [API] Экземпляр создан');
    }

    async request(endpoint, options) {
        console.log('📌 [API] request() вызван, endpoint =', endpoint);
        
        var url = this.baseUrl + endpoint;
        var config = {
            headers: this.headers,
            ...options,
            body: options && options.body ? JSON.stringify(options.body) : undefined
        };

        console.log('📌 [API] URL =', url);
        console.log('📌 [API] Отправка запроса...');
        
        try {
            var response = await fetch(url, config);
            console.log('📌 [API] Статус ответа =', response.status);
            
            if (!response.ok) {
                console.error('❌ [API] Ошибка HTTP', response.status);
                throw new Error('HTTP ' + response.status);
            }
            
            var data = await response.json();
            console.log('✅ [API] Данные получены, записей =', data ? data.length : 0);
            return data;
            
        } catch (error) {
            console.error('❌ [API] Ошибка запроса:', error.message);
            throw error;
        }
    }

    async getTop() {
        console.log('📌 [API] getTop() вызван');
        var result = await this.request('/top');
        console.log('✅ [API] getTop() завершён, записей =', result ? result.length : 0);
        return result;
    }

    async login(vkId, userName) {
        console.log('📌 [API] login() вызван');
        return this.request('/user/login', {
            method: 'POST',
            body: { vkId: vkId, userName: userName }
        });
    }

    async getStats(userId) {
        console.log('📌 [API] getStats() вызван, userId =', userId);
        return this.request('/stats/' + userId);
    }

    async updateStats(data) {
        console.log('📌 [API] updateStats() вызван');
        return this.request('/stats/update', {
            method: 'POST',
            body: data
        });
    }

    async saveToTop(data) {
        console.log('📌 [API] saveToTop() вызван');
        return this.request('/top/save', {
            method: 'POST',
            body: data
        });
    }

    async getChallenges(userId) {
        console.log('📌 [API] getChallenges() вызван, userId =', userId);
        return this.request('/challenges/' + userId);
    }

    async updateChallenge(data) {
        console.log('📌 [API] updateChallenge() вызван');
        return this.request('/challenges/update', {
            method: 'POST',
            body: data
        });
    }

    async getTotalRewards(userId) {
        console.log('📌 [API] getTotalRewards() вызван, userId =', userId);
        return this.request('/challenges/total/' + userId);
    }

    async getUsersCount() {
        console.log('📌 [API] getUsersCount() вызван');
        return this.request('/users/count');
    }
}

console.log('📌 [API] Создаём экземпляр...');
var api = new ApiClient();
console.log('✅ [API] Готов!');