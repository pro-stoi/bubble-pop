// js/vk.js

// ===== ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ URL =====
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '192.168.1.100' ||  // ← ТВОЙ IP
                window.location.protocol === 'file:';
const API_BASE_URL = isLocal 
    ? 'http://170.168.10.167:8080/api/bubble'
    : 'https://neurodrone-arena.ru/api/bubble';

console.log('🌐 API_BASE_URL:', API_BASE_URL);

// ============================================

class VKManager {
    constructor() {
        // ===== ФЛАГ ЛОКАЛЬНОЙ РАЗРАБОТКИ =====
        this.isLocal = isLocal;
        
        if (this.isLocal) {
            console.log('🧪 ЛОКАЛЬНЫЙ РЕЖИМ: имитация пользователя #2');
            this.isReady = true;
            this.userId = 'test_user_2';
            this.userName = 'Тестовый Игрок #2';
            this.dbUserId = 2;
            this.bridge = null;
            this.serverUrl = API_BASE_URL;
            
            localStorage.setItem('bubbleUserId', String(this.dbUserId));
            localStorage.setItem('username', this.userName);
            
            if (typeof statsManager !== 'undefined') {
                statsManager.userId = this.dbUserId;
                statsManager.load(this.dbUserId);
            }
            if (typeof challengeTracker !== 'undefined') {
                challengeTracker.loadFromServer(this.dbUserId);
            }
            return;
        }

        // ===== РЕАЛЬНЫЙ VK =====
        this.isReady = false;
        this.userId = null;
        this.userName = 'Игрок';
        this.appId = 54650664;
        this.bridge = null;
        this.dbUserId = null;
        this.topCache = null;
        this.topCacheTime = 0;
        this.serverUrl = API_BASE_URL;
    }

    init() {
        if (typeof vkBridge !== 'undefined') {
            this.bridge = vkBridge;
            this.isReady = true;
            
            this.bridge.send('VKWebAppInit')
                .then(() => {
                    console.log('✅ VK Bridge инициализирован');
                    return this.getUserInfo();
                })
                .then(() => {
                    console.log('✅ Пользователь авторизован, ID:', this.dbUserId);
                    document.dispatchEvent(new CustomEvent('vkReady', { 
                        detail: { userId: this.dbUserId } 
                    }));
                })
                .catch((error) => {
                    console.warn('⚠️ Ошибка инициализации VK:', error);
                    document.dispatchEvent(new CustomEvent('vkReady', { 
                        detail: { userId: null } 
                    }));
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
                        return this.getUserInfo();
                    })
                    .then(() => {
                        document.dispatchEvent(new CustomEvent('vkReady', { 
                            detail: { userId: this.dbUserId } 
                        }));
                    })
                    .catch(console.warn);
            }
        };
        script.onerror = () => {
            console.warn('⚠️ Не удалось загрузить VK Bridge');
            document.dispatchEvent(new CustomEvent('vkReady', { 
                detail: { userId: null } 
            }));
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

    async loginToServer() {
        if (!this.userId) {
            console.warn('⚠️ Нет userId для авторизации');
            return;
        }
        
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
            
            localStorage.setItem('bubbleUserId', String(this.dbUserId));
            localStorage.setItem('username', this.userName);
            
            if (typeof statsManager !== 'undefined') {
                statsManager.userId = this.dbUserId;
                await statsManager.load(this.dbUserId);
            }
            if (typeof challengeTracker !== 'undefined') {
                await challengeTracker.loadFromServer(this.dbUserId);
            }
            
        } catch (error) {
            console.error('❌ Ошибка авторизации:', error);
            this.dbUserId = null;
        }
    }

    async saveToGlobalTop(score, maxCombo, challengePoints, totalPopped) {
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
                    challengePoints: challengePoints || 0,
                    totalPopped: totalPopped || 0
                })
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('❌ Ошибка:', error);
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
    console.log('📤 shareResult вызван, isReady=' + this.isReady + ', bridge=' + (this.bridge ? 'есть' : 'нет'));

    const appUrl = 'https://vk.com/app54650664';
    const message = `🎯 Я набрал ${score} очков в игре "Пузырьки"!\n🔥 Комбо: ${combo}\n\nПопробуй и ты! 🫧`;

    try {
        let photoId = null;
        
        // 1. Делаем скриншот модального окна
        const modal = document.getElementById('exitModal');
        if (modal && typeof html2canvas !== 'undefined') {
            console.log('📸 Делаем скриншот...');
            const canvas = await html2canvas(modal, {
                scale: 1.5,
                backgroundColor: null,
                allowTaint: true,
                useCORS: true,
                logging: false
            });
            console.log('✅ Скриншот готов');
            
            // 2. Пробуем загрузить фото
            if (this.bridge) {
                console.log('📤 Загружаем фото в VK...');
                photoId = await this.uploadPhoto(canvas.toDataURL('image/png'));
                if (photoId) {
                    console.log('✅ Фото загружено, id=' + photoId);
                } else {
                    console.log('⚠️ Фото не загружено, публикуем без фото');
                }
            } else {
                console.log('⚠️ Нет bridge, публикуем без фото');
            }
        } else {
            console.log('📝 Публикуем без картинки (нет html2canvas или модалки)');
        }
        
        // 3. Публикуем на стену
        const wallPostParams = {
            message: message,
            type: 'owner'
        };
        
        if (photoId) {
            wallPostParams.attachments = [photoId];
        }
        
        console.log('📝 Публикуем на стену...', wallPostParams);
        await this.bridge.send('VKWebAppWallPost', wallPostParams);
        console.log('✅ Опубликовано!');
        
        this.showNotification('✅ Результат опубликован на стене!');
        
    } catch (error) {
        console.error('❌ Ошибка публикации:', error.message);
        this.fallbackShare(score, combo);
    }
}

// ===== ЗАГРУЗКА ФОТО В VK =====
async uploadPhoto(dataUrl) {
    alert('📸 uploadPhoto начат');
    console.log('📸 uploadPhoto начат');
    
    try {
        if (!this.bridge) {
            console.warn('⚠️ Нет bridge, пропускаем загрузку фото');
            return null;
        }
        console.log('✅ bridge есть');
        
        console.log('📤 Запрашиваем сервер для загрузки...');
        const uploadInfo = await this.bridge.send('VKWebAppGetUploadServer', {
            type: 'photo_wall'
        });
        console.log('📥 uploadInfo:', JSON.stringify(uploadInfo, null, 2));
        
        if (!uploadInfo || !uploadInfo.upload_url) {
            console.warn('⚠️ Не удалось получить сервер для загрузки');
            return null;
        }
        console.log('✅ Сервер получен:', uploadInfo.upload_url);
        
        console.log('📤 Конвертируем dataUrl в Blob...');
        const blob = this.dataURLToBlob(dataUrl);
        const formData = new FormData();
        formData.append('photo', blob, 'result.png');
        console.log('✅ Blob создан, размер:', blob.size);
        
        console.log('📤 Загружаем на сервер VK...');
        const response = await fetch(uploadInfo.upload_url, {
            method: 'POST',
            body: formData
        });
        console.log('📥 Статус загрузки:', response.status);
        
        const uploadResult = await response.json();
        console.log('📥 uploadResult:', JSON.stringify(uploadResult, null, 2));
        
        console.log('📤 Сохраняем фото в альбом...');
        const saveResult = await this.bridge.send('VKWebAppSavePhoto', {
            photo: uploadResult.photo,
            server: uploadResult.server,
            hash: uploadResult.hash
        });
        console.log('📥 saveResult:', JSON.stringify(saveResult, null, 2));
        
        if (!saveResult || saveResult.length === 0) {
            console.warn('⚠️ Не удалось сохранить фото');
            return null;
        }
        
        const photoId = `photo${saveResult[0].owner_id}_${saveResult[0].id}`;
        console.log('✅ Фото сохранено, id:', photoId);
        return photoId;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error);
        console.error('❌ Stack:', error.stack);
        return null;
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЙ МЕТОД =====
dataURLToBlob(dataUrl) {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

    fallbackShare(score, combo) {
        const text = `🎯 Я набрал ${score} очков в игре "Пузырьки"! Комбо: ${combo}`;
        const url = 'https://pro-stoi.github.io/bubble-pop/';
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text + ' ' + url);
            this.showNotification('📋 Текст скопирован!');
        } else {
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

    async getChallenges() {
        try {
            const response = await fetch(`${this.serverUrl}/challenges`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки испытаний:', error);
            return [];
        }
    }

    async getUserChallengeProgress(userId) {
        try {
            const response = await fetch(`${this.serverUrl}/challenges/progress/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return [];
        }
    }

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

    async getUserTotalRewards(userId) {
        try {
            const response = await fetch(`${this.serverUrl}/challenges/total/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения наград:', error);
            return { totalReward: 0 };
        }
    }
    
    // ===== ПРИГЛАСИТЬ ДРУГА =====
async inviteFriend() {
    try {
        const result = await this.bridge.send('VKWebAppShowInviteBox', {});
        
        if (result && result.result) {
            // Друг приглашён, ждём его регистрации
            this.showNotification('👥 Приглашение отправлено! Когда друг зайдёт в игру, вы получите бонус! 🎁');
        }
    } catch (error) {
        console.error('Ошибка приглашения:', error);
        this.showNotification('❌ Не удалось отправить приглашение');
    }
}
}

const vk = new VKManager();

document.addEventListener('DOMContentLoaded', () => {
    vk.init();
});
