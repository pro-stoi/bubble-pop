// js/vk.js

class VKManager {
    constructor() {
        this.isReady = false;
        this.userId = null;
        this.userName = 'Игрок';
        this.appId = 54650664;
        this.bridge = null;
        this.topCache = null;
        this.topCacheTime = 0;
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
            this.userId = data.id;
            this.userName = data.first_name + ' ' + data.last_name;
            console.log('👤 Пользователь:', this.userName);
        } catch (error) {
            console.warn('⚠️ Не удалось получить информацию о пользователе:', error);
        }
    }

    // ===== СОХРАНИТЬ РЕЗУЛЬТАТ В ГЛОБАЛЬНЫЙ ТОП (VK STORAGE) =====
    async saveToGlobalTop(score, maxCombo, challengePoints) {
        if (!this.isReady || !this.userId) {
            console.warn('⚠️ VK не готов, результат сохранён локально');
            this.saveToLocalTop(score, maxCombo, challengePoints);
            return;
        }

        try {
            // 1. Получаем текущий топ из VK Storage
            let top = await this.getTopFromStorage();
            
            // 2. Добавляем/обновляем текущего пользователя
            const userEntry = {
                userId: this.userId,
                userName: this.userName || 'Игрок',
                score: score || 0,
                maxCombo: maxCombo || 0,
                challengePoints: challengePoints || 0,
                date: new Date().toISOString()
            };
            
            const existingIndex = top.findIndex(item => item.userId === this.userId);
            if (existingIndex >= 0) {
                // Обновляем только если результат лучше
                if (userEntry.score > top[existingIndex].score) {
                    top[existingIndex] = userEntry;
                    console.log('🔄 Обновлён результат пользователя:', this.userName);
                } else {
                    console.log('ℹ️ Результат не лучше текущего, пропускаем');
                    return;
                }
            } else {
                top.push(userEntry);
                console.log('➕ Добавлен новый пользователь:', this.userName);
            }
            
            // 3. Сортируем по очкам (убывание)
            top.sort((a, b) => (b.score || 0) - (a.score || 0));
            
            // 4. Оставляем топ-100
            if (top.length > 100) {
                top = top.slice(0, 100);
            }
            
            // 5. Сохраняем в VK Storage
            await this.saveTopToStorage(top);
            console.log('✅ Глобальный топ обновлён, записей:', top.length);
            
            // 6. Обновляем кэш
            this.topCache = top;
            this.topCacheTime = Date.now();
            
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения в глобальный топ:', error);
            this.saveToLocalTop(score, maxCombo, challengePoints);
        }
    }

    // ===== ПОЛУЧИТЬ ТОП ИЗ VK STORAGE =====
    async getTopFromStorage() {
        try {
            const data = await this.bridge.send('VKWebAppStorageGet', {
                keys: ['globalTop']
            });
            
            if (data.keys && data.keys.length > 0 && data.keys[0].value) {
                try {
                    const parsed = JSON.parse(data.keys[0].value);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (e) {
                    console.warn('⚠️ Ошибка парсинга топа:', e);
                }
            }
            return [];
        } catch (error) {
            console.warn('⚠️ Ошибка получения топа из VK Storage:', error);
            return [];
        }
    }

    // ===== СОХРАНИТЬ ТОП В VK STORAGE =====
    async saveTopToStorage(top) {
        try {
            await this.bridge.send('VKWebAppStorageSet', {
                key: 'globalTop',
                value: JSON.stringify(top)
            });
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения топа в VK Storage:', error);
            throw error;
        }
    }

    // ===== ПОЛУЧИТЬ ГЛОБАЛЬНЫЙ ТОП (С КЭШИРОВАНИЕМ) =====
    async getGlobalTop(forceRefresh = false) {
        // Проверяем кэш (обновляем раз в 30 секунд)
        const cacheAge = Date.now() - this.topCacheTime;
        if (!forceRefresh && this.topCache && cacheAge < 30000) {
            console.log('📦 Возвращаем топ из кэша');
            return this.topCache;
        }

        try {
            let top = await this.getTopFromStorage();
            
            // Если в VK Storage пусто — пробуем локальный топ
            if (top.length === 0) {
                const localTop = this.getLocalTop();
                if (localTop.length > 0) {
                    // Конвертируем локальный топ в формат глобального
                    top = localTop.map(item => ({
                        userId: 'local_' + Math.random().toString(36).substring(2, 10),
                        userName: 'Игрок',
                        score: item.score || 0,
                        maxCombo: item.maxCombo || 0,
                        challengePoints: item.challengePoints || 0,
                        date: item.date || new Date().toISOString()
                    }));
                }
            }
            
            // Сортируем и обрезаем
            top.sort((a, b) => (b.score || 0) - (a.score || 0));
            if (top.length > 100) top = top.slice(0, 100);
            
            // Сохраняем кэш
            this.topCache = top;
            this.topCacheTime = Date.now();
            
            console.log('📊 Загружено записей в топе:', top.length);
            return top;
            
        } catch (error) {
            console.warn('⚠️ Ошибка получения глобального топа:', error);
            return this.getLocalTop();
        }
    }

    // ===== ЛОКАЛЬНЫЙ ТОП (ЗАПАСНОЙ ВАРИАНТ) =====
    saveToLocalTop(score, maxCombo, challengePoints) {
        let top = JSON.parse(localStorage.getItem('globalTop') || '[]');
        
        const userEntry = {
            userId: this.userId || 'local_' + Math.random().toString(36).substring(2, 10),
            userName: this.userName || 'Игрок',
            score: score || 0,
            maxCombo: maxCombo || 0,
            challengePoints: challengePoints || 0,
            date: new Date().toISOString()
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

    // ===== ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ =====
    async shareResult(score, combo) {
        if (!this.isReady) {
            this.fallbackShare(score, combo);
            return;
        }

        const message = `🎯 Я набрал ${score} очков в игре "Пузырьки"!\n🔥 Комбо: ${combo}\n\nПопробуй и ты! 🫧`;

        try {
            await this.bridge.send('VKWebAppShare', {
                message: message
            });
            console.log('✅ Опубликовано!');
            this.showNotification('🎉 Результат опубликован!');
        } catch (error) {
            console.error('Ошибка публикации:', error);
            this.fallbackShare(score, combo);
        }
    }

    fallbackShare(score, combo) {
        const text = `🎯 Я набрал ${score} очков в игре "Пузырьки"! Комбо: ${combo}`;
        const url = 'https://pro-stoi.github.io/bubble-pop/';
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text + ' ' + url);
            this.showNotification('📋 Текст скопирован! Вставь в соцсети.');
        } else {
            alert(text + '\n' + url);
        }
    }

    showNotification(text) {
        const popup = document.createElement('div');
        popup.className = 'vk-notification';
        popup.textContent = text;
        popup.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 16px;
            font-size: 16px;
            z-index: 100;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }
}

const vk = new VKManager();

document.addEventListener('DOMContentLoaded', () => {
    vk.init();
});
