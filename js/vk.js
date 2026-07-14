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
        
        // ===== АДРЕС СЕРВЕРА ДЛЯ ПУЗЫРЬКОВ =====
        this.serverUrl = 'https://neurodrone-arena.ru/api/bubble';
        // =========================================
    }

    init() {
        if (typeof vkBridge !== 'undefined') {
            this.bridge = vkBridge;
            this.isReady = true;
            
            this.bridge.send('VKWebAppInit')
                .then(() => {
                    console.log('✅ VK Bridge инициализирован');
                    this.getUserInfo();
                })
                .catch((error) => {
                    console.warn('⚠️ Ошибка инициализации VK:', error);
                    this.getUserInfo();
                });
        } else {
            console.warn('⚠️ VK Bridge не загружен');
            this.loadBridge();
        }
    }

    loadBridge() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js';
        script.onload = () => {
            if (typeof vkBridge !== 'undefined') {
                this.bridge = vkBridge;
                this.isReady = true;
                this.bridge.send('VKWebAppInit')
                    .then(() => {
                        console.log('✅ VK Bridge загружен и инициализирован');
                        this.getUserInfo();
                    })
                    .catch(console.warn);
            }
        };
        script.onerror = () => {
            console.warn('⚠️ Не удалось загрузить VK Bridge');
        };
        document.head.appendChild(script);
    }

    async getUserInfo() {
        if (!this.isReady) return;
        
        try {
            const data = await this.bridge.send('VKWebAppGetUserInfo');
            this.userId = String(data.id);
            this.userName = data.first_name + ' ' + data.last_name;
            console.log('👤 Пользователь VK:', this.userName, 'ID:', this.userId);
            
            await this.loginToServer();
            
        } catch (error) {
            console.warn('⚠️ Не удалось получить информацию о пользователе:', error);
        }
    }

    // ===== АВТОРИЗАЦИЯ НА СЕРВЕРЕ =====
async loginToServer() {
    try {
        const response = await fetch(`${this.serverUrl}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vkId: this.userId,
                userName: this.userName
            })
        });
        
        const user = await response.json();
        this.dbUserId = user.id;
        console.log('✅ Авторизован в Bubble, ID:', this.dbUserId);
        
        // ===== СОХРАНЯЕМ ID В LOCALSTORAGE =====
        localStorage.setItem('bubbleUserId', String(this.dbUserId));
        console.log('💾 Сохранено в localStorage:', localStorage.getItem('bubbleUserId'));
        // ========================================
        
        await this.ensureTopRecord();
        
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
        this.dbUserId = null;
    }
}

    // ===== НОВОЕ: ПРОВЕРКА И СОЗДАНИЕ ЗАПИСИ В ТОПЕ =====
    async ensureTopRecord() {
        try {
            const response = await fetch(`${this.serverUrl}/top/ensure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.dbUserId
                })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('✅ Запись в топе создана (или уже существует)');
            } else {
                console.warn('⚠️ Ошибка создания записи в топе:', data.message);
            }
        } catch (error) {
            console.error('❌ Ошибка при создании записи в топе:', error);
        }
    }
    // ======================================================

    async saveToGlobalTop(score, maxCombo, challengePoints) {
        if (!this.dbUserId) {
            await this.loginToServer();
            if (!this.dbUserId) {
                this.saveToLocalTop(score, maxCombo, challengePoints);
                return false;
            }
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/top/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    async getGlobalTop() {
        try {
            const response = await fetch(`${this.serverUrl}/top`);
            const top = await response.json();
            
            if (Array.isArray(top)) {
                console.log('📊 Загружено записей с сервера:', top.length);
                this.topCache = top;
                this.topCacheTime = Date.now();
                return top;
            } else {
                return this.getLocalTop();
            }
        } catch (error) {
            console.error('❌ Ошибка соединения с сервером:', error);
            return this.getLocalTop();
        }
    }

    saveToLocalTop(score, maxCombo, challengePoints) {
        let top = JSON.parse(localStorage.getItem('globalTop') || '[]');
        
        const userEntry = {
            userId: this.dbUserId || 'local',
            userName: this.userName || 'Игрок',
            score: score || 0,
            maxCombo: maxCombo || 0,
            challengePoints: challengePoints || 0
        };
        
        const existingIndex = top.findIndex(item => item.userId === userEntry.userId);
        if (existingIndex >= 0) {
            if (userEntry.score > top[existingIndex].score) {
                top[existingIndex] = userEntry;
            }
        } else {
            top.push(userEntry);
        }
        
        top.sort((a, b) => (b.score || 0) - (a.score || 0));
        if (top.length > 100) top = top.slice(0, 100);
        
        localStorage.setItem('globalTop', JSON.stringify(top));
        console.log('✅ Результат сохранён локально');
    }

    getLocalTop() {
        return JSON.parse(localStorage.getItem('globalTop') || '[]');
    }

    async shareResult(score, combo) {
        if (!this.isReady) {
            this.fallbackShare(score, combo);
            return;
        }

        const message = `🎯 Я набрал ${score} очков в игре "Пузырьки"!\n🔥 Комбо: ${combo}\n\nПопробуй и ты! 🫧`;

        try {
            await this.bridge.send('VKWebAppShare', { message: message });
            this.showNotification('🎉 Результат опубликован!');
        } catch (error) {
            this.fallbackShare(score, combo);
        }
    }

  fallbackShare(score, combo) {
    const text = `🎯 Я набрал ${score} очков в игре "Пузырьки"! Комбо: ${combo}`;
    const url = 'https://pro-stoi.github.io/bubble-pop/';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text + ' ' + url);
        this.showNotification('📋 Текст скопирован!');
    } else {
        // ВМЕСТО alert - показываем уведомление
        this.showNotification(text + '\n' + url);
    }
}

    showNotification(text) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 16px;
            font-size: 16px;
            z-index: 100;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: opacity 0.3s ease;
            opacity: 0;
            max-width: 90%;
            text-align: center;
        `;
        popup.textContent = text;
        document.body.appendChild(popup);
        
        setTimeout(() => { popup.style.opacity = '1'; }, 50);
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 400);
        }, 3000);
    }
    
// ===== РАБОТА С ИСПЫТАНИЯМИ =====

// Получить все испытания
async getChallenges() {
    try {
        const response = await fetch(`${this.serverUrl}/challenges`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки испытаний:', error);
        return [];
    }
}

// Получить прогресс пользователя
async getUserChallengeProgress(userId) {
    try {
        const response = await fetch(`${this.serverUrl}/challenges/progress/${userId}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        return [];
    }
}

// Обновить прогресс испытания
async updateChallenge(userId, challengeId, progressDelta) {
    try {
        const response = await fetch(`${this.serverUrl}/challenges/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, challengeId, progressDelta })
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка обновления прогресса:', error);
        return { success: false };
    }
}

// Получить общую сумму наград пользователя
async getUserTotalRewards(userId) {
    try {
        const response = await fetch(`${this.serverUrl}/challenges/total/${userId}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения наград:', error);
        return { totalReward: 0 };
    }
}  
    
    
}

const vk = new VKManager();

document.addEventListener('DOMContentLoaded', () => {
    vk.init();
});