// js/vk.js

// ===== ОПРЕДЕЛЕНИЕ ОКРУЖЕНИЯ =====
const isLocal = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.startsWith('192.168.') ||
                window.location.protocol === 'file:';

const API_BASE_URL = isLocal
    ? 'http://170.168.10.167:8080/api/bubble'
    : 'https://neurodrone-arena.ru/api/bubble';

console.log('🌐 API_BASE_URL:', API_BASE_URL);

// ============================================

class VKManager {
    constructor() {
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

        // Защита от параллельных логинов
        this._loginInFlight = null;
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init() {
        if (typeof vkBridge === 'undefined') {
            console.warn('⚠️ VK Bridge не загружен, грузим сами');
            this.loadBridge();
            return;
        }

        this.bridge = vkBridge;
        this.isReady = true;

        // ===== ПЫТАЕМСЯ ПОЛУЧИТЬ ПРАВА, НО НЕ БЛОКИРУЕМСЯ НА ЭТОМ =====
        this.bridge.send('VKWebAppGetAuthToken', { scope: 'wall,share' })
            .catch((e) => {
                console.warn('⚠️ Права wall не получены (это не критично):', e);
            })
            .then(() => this.bridge.send('VKWebAppInit'))
            .catch((e) => {
                console.warn('⚠️ VKWebAppInit упал:', e);
            })
            .then(() => {
                // ===== ГЛАВНОЕ: получаем userId и ЛОГИНИМСЯ =====
                return this.getUserInfo();
            })
            .then(() => {
                if (this.dbUserId) {
                    console.log('✅ [VK] Готов, dbUserId =', this.dbUserId);
                    document.dispatchEvent(new CustomEvent('vkReady', {
                        detail: { userId: this.dbUserId }
                    }));
                } else {
                    console.error('❌ [VK] dbUserId не получен — vkReady с null');
                    document.dispatchEvent(new CustomEvent('vkReady', {
                        detail: { userId: null }
                    }));
                }
            })
            .catch((err) => {
                console.error('❌ [VK] Критическая ошибка init:', err);
                document.dispatchEvent(new CustomEvent('vkReady', {
                    detail: { userId: null }
                }));
            });
    }

    loadBridge() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js';
        script.onload = () => {
            if (typeof vkBridge !== 'undefined') {
                this.bridge = vkBridge;
                this.isReady = true;
                this.bridge.send('VKWebAppInit')
                    .catch((e) => console.warn('⚠️ VKWebAppInit:', e))
                    .then(() => this.getUserInfo())
                    .then(() => {
                        document.dispatchEvent(new CustomEvent('vkReady', {
                            detail: { userId: this.dbUserId }
                        }));
                    })
                    .catch((e) => {
                        console.error('❌ [VK] Ошибка загрузки bridge:', e);
                        document.dispatchEvent(new CustomEvent('vkReady', {
                            detail: { userId: null }
                        }));
                    });
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

    // ===== ПОЛУЧЕНИЕ USER ID ИЗ ВСЕХ ВОЗМОЖНЫХ ИСТОЧНИКОВ =====
    async getUserInfo() {
        if (!this.isReady || !this.bridge) return;

        // ===== 1. LAUNCH PARAMS (работает на телефоне почти всегда, на ПК иногда) =====
        try {
            const params = await this.bridge.send('VKWebAppGetLaunchParams');
            console.log('🔥 [VK] Launch params:', params);
            if (params && params.vk_user_id) {
                this.userId = String(params.vk_user_id);
                this.userName = params.vk_user_name || ('Игрок_' + this.userId);
                console.log('👤 [VK] ID из Launch Params:', this.userId, '| Имя:', this.userName);
                await this.loginToServer();
                return;
            }
        } catch (e) {
            console.warn('⚠️ [VK] Launch Params не сработали:', e);
        }

        // ===== 2. VKWebAppGetUserInfo (главный рабочий способ на ПК) =====
        try {
            const data = await this.bridge.send('VKWebAppGetUserInfo');
            if (data && data.id) {
                this.userId = String(data.id);
                this.userName = (data.first_name || '') + ' ' + (data.last_name || '');
                if (!this.userName.trim()) this.userName = 'Игрок_' + this.userId;
                console.log('👤 [VK] ID из GetUserInfo:', this.userId);
                await this.loginToServer();
                return;
            }
        } catch (e) {
            console.warn('⚠️ [VK] GetUserInfo не сработал:', e);
        }

        // ===== 3. URL (query / hash) — иногда на ПК vk_user_id есть в URL =====
        try {
            const qs = new URLSearchParams(window.location.search || '');
            const hashRaw = (window.location.hash || '').replace(/^#/, '');
            const hashQs = new URLSearchParams(hashRaw);
            const fromUrl =
                qs.get('vk_user_id') ||
                hashQs.get('vk_user_id') ||
                qs.get('viewer_id') ||
                hashQs.get('viewer_id');
            if (fromUrl) {
                this.userId = String(fromUrl);
                this.userName = 'Игрок_' + this.userId;
                console.log('👤 [VK] ID из URL:', this.userId);
                await this.loginToServer();
                return;
            }
        } catch (e) {
            console.warn('⚠️ [VK] URL fallback не сработал:', e);
        }

        // ===== 4. Финальная попытка: VKWebAppInit + GetUserInfo ещё раз =====
        try {
            await this.bridge.send('VKWebAppInit');
            const data = await this.bridge.send('VKWebAppGetUserInfo');
            if (data && data.id) {
                this.userId = String(data.id);
                this.userName = (data.first_name || '') + ' ' + (data.last_name || '');
                if (!this.userName.trim()) this.userName = 'Игрок_' + this.userId;
                console.log('👤 [VK] ID после повторного Init:', this.userId);
                await this.loginToServer();
                return;
            }
        } catch (e) {
            console.warn('⚠️ [VK] Финальная попытка провалилась:', e);
        }

        console.error('❌ [VK] Не удалось получить userId ни одним способом');
    }

    // ===== ЛОГИН НА СЕРВЕР (с защитой от параллельных вызовов) =====
    async loginToServer() {
        // Если уже залогинены — выходим
        if (this.dbUserId) return this.dbUserId;

        // Если логин уже идёт — ждём его
        if (this._loginInFlight) {
            return this._loginInFlight;
        }

        this._loginInFlight = (async () => {
            try {
                // Если userId ещё нет — пробуем получить
                if (!this.userId) {
                    try {
                        const data = await this.bridge.send('VKWebAppGetUserInfo');
                        if (data && data.id) {
                            this.userId = String(data.id);
                            this.userName = (data.first_name || '') + ' ' + (data.last_name || '');
                            if (!this.userName.trim()) this.userName = 'Игрок_' + this.userId;
                        }
                    } catch (e) {
                        console.warn('⚠️ [VK] loginToServer: не удалось получить userId:', e);
                    }
                }

                if (!this.userId) {
                    throw new Error('NO_VK_USER_ID');
                }

                const response = await fetch(`${this.serverUrl}/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vkId: this.userId,
                        userName: this.userName
                    })
                });

                if (!response.ok) {
                    throw new Error('LOGIN_HTTP_' + response.status);
                }

                const user = await response.json();
                if (!user || !user.id) {
                    throw new Error('LOGIN_NO_ID_IN_RESPONSE');
                }

                this.dbUserId = user.id;
                console.log('✅ [VK] Авторизован в Bubble, ID:', this.dbUserId);

                localStorage.setItem('bubbleUserId', String(this.dbUserId));
                localStorage.setItem('username', this.userName);

                if (typeof statsManager !== 'undefined') {
                    statsManager.userId = this.dbUserId;
                    try { await statsManager.load(this.dbUserId); } catch (e) {}
                }
                if (typeof challengeTracker !== 'undefined') {
                    try { await challengeTracker.loadFromServer(this.dbUserId); } catch (e) {}
                }

                return this.dbUserId;
            } finally {
                this._loginInFlight = null;
            }
        })();

        return this._loginInFlight;
    }

    // ===== СОХРАНЕНИЕ В ТОП =====
    async saveToGlobalTop(score, maxCombo, challengePoints, totalPopped) {
        if (!this.dbUserId) {
            try {
                await this.loginToServer();
            } catch (e) {
                console.warn('⚠️ [VK] Не удалось залогиниться для сохранения топа:', e);
            }
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
            console.error('❌ [VK] Ошибка сохранения топа:', error);
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

    // ===== ПОДЕЛИТЬСЯ =====
    async shareResult(score, combo) {
        const message = `🎯 Я набрал ${score} очков в игре "Пузырьки"!\n🔥 Комбо: ${combo}\n\nПопробуй и ты! 🫧\nhttps://vk.com/app54650664`;

        try {
            await this.bridge.send('VKWebAppShare', {
                message: message,
                link: 'https://vk.com/app54650664'
            });
            this.showNotification('✅ Готово!');
        } catch (error) {
            console.error('Ошибка:', error);
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

    // ===== ИСПЫТАНИЯ (дублируют repository, но пусть будут) =====
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
