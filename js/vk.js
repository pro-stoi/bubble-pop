// js/vk.js

class VKManager {
    constructor() {
        this.isReady = false;
        this.userId = null;
        this.userName = 'Игрок';
        this.appId = 54650664;
        this.bridge = null;
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

    // ===== СОХРАНИТЬ РЕЗУЛЬТАТ В ГЛОБАЛЬНЫЙ ТОП =====
    async saveToGlobalTop(score, maxCombo, challengePoints) {
        if (!this.isReady) {
            console.warn('⚠️ VK не готов, результат сохранён локально');
            this.saveToLocalTop(score, maxCombo, challengePoints);
            return;
        }

        try {
            // Получаем текущий топ
            const data = await this.bridge.send('VKWebAppStorageGet', {
                keys: ['globalTop']
            });
            
            let top = [];
            if (data.keys && data.keys.length > 0) {
                try {
                    top = JSON.parse(data.keys[0].value) || [];
                } catch (e) {
                    top = [];
                }
            }
            
            // Добавляем текущего пользователя
            const userEntry = {
                userId: this.userId,
                userName: this.userName,
                score: score,
                maxCombo: maxCombo,
                challengePoints: challengePoints,
                totalPoints: score + challengePoints,
                date: new Date().toISOString()
            };
            
            // Проверяем, есть ли уже этот пользователь
            const existingIndex = top.findIndex(item => item.userId === this.userId);
            if (existingIndex >= 0) {
                // Обновляем, если результат лучше
                if (userEntry.totalPoints > top[existingIndex].totalPoints) {
                    top[existingIndex] = userEntry;
                }
            } else {
                top.push(userEntry);
            }
            
            // Сортируем по totalPoints (убывание)
            top.sort((a, b) => b.totalPoints - a.totalPoints);
            
            // Оставляем топ-100
            if (top.length > 100) {
                top = top.slice(0, 100);
            }
            
            // Сохраняем обратно
            await this.bridge.send('VKWebAppStorageSet', {
                key: 'globalTop',
                value: JSON.stringify(top)
            });
            
            console.log('✅ Результат сохранён в глобальный топ');
            
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения в глобальный топ:', error);
            this.saveToLocalTop(score, maxCombo, challengePoints);
        }
    }

    // ===== ЛОКАЛЬНЫЙ ТОП (ЗАПАСНОЙ ВАРИАНТ) =====
    saveToLocalTop(score, maxCombo, challengePoints) {
        let top = JSON.parse(localStorage.getItem('globalTop') || '[]');
        
        const userEntry = {
            userId: this.userId || 'local',
            userName: this.userName || 'Игрок',
            score: score,
            maxCombo: maxCombo,
            challengePoints: challengePoints,
            totalPoints: score + challengePoints,
            date: new Date().toISOString()
        };
        
        const existingIndex = top.findIndex(item => item.userId === userEntry.userId);
        if (existingIndex >= 0) {
            if (userEntry.totalPoints > top[existingIndex].totalPoints) {
                top[existingIndex] = userEntry;
            }
        } else {
            top.push(userEntry);
        }
        
        top.sort((a, b) => b.totalPoints - a.totalPoints);
        if (top.length > 100) top = top.slice(0, 100);
        
        localStorage.setItem('globalTop', JSON.stringify(top));
        console.log('✅ Результат сохранён локально');
    }

    // ===== ПОЛУЧИТЬ ГЛОБАЛЬНЫЙ ТОП =====
    async getGlobalTop() {
        if (!this.isReady) {
            return this.getLocalTop();
        }

        try {
            const data = await this.bridge.send('VKWebAppStorageGet', {
                keys: ['globalTop']
            });
            
            if (data.keys && data.keys.length > 0) {
                try {
                    return JSON.parse(data.keys[0].value) || [];
                } catch (e) {
                    return [];
                }
            }
            return [];
        } catch (error) {
            console.warn('⚠️ Ошибка получения глобального топа:', error);
            return this.getLocalTop();
        }
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
