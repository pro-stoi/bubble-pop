// js/vk.js

class VKManager {
    constructor() {
        this.isReady = false;
        this.userId = null;
        this.userName = 'Игрок';
        this.appId = 54650664; // ← ТВОЙ ID
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init() {
        if (typeof VK !== 'undefined') {
            this.isReady = true;
            this.getUserInfo();
        } else {
            console.warn('VK Bridge не загружен');
        }
    }

    // ===== ПОЛУЧИТЬ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ =====
    getUserInfo() {
        if (!this.isReady) return;
        
        VK.api('users.get', { fields: 'photo_50' }, (response) => {
            if (response.response && response.response.length > 0) {
                const user = response.response[0];
                this.userId = user.id;
                this.userName = user.first_name + ' ' + user.last_name;
                console.log('👤 Пользователь:', this.userName);
            }
        });
    }

    // ===== ПОКАЗАТЬ КНОПКУ "ПОДЕЛИТЬСЯ" =====
    shareResult(score, combo) {
        if (!this.isReady) {
            this.fallbackShare(score, combo);
            return;
        }

        const message = `🎯 Я набрал ${score} очков в игре "Пузырьки"!\n🔥 Комбо: ${combo}\n\nПопробуй и ты! 🫧`;

        VK.api('wall.post', {
            message: message,
            attachments: 'https://vk.com/app' + this.appId
        }, (response) => {
            if (response.error) {
                console.error('Ошибка публикации:', response.error);
                this.fallbackShare(score, combo);
            } else {
                console.log('✅ Опубликовано!');
                this.showNotification('🎉 Результат опубликован!');
            }
        });
    }

    // ===== ЗАПАСНОЙ ВАРИАНТ (если VK не работает) =====
    fallbackShare(score, combo) {
        const text = `🎯 Я набрал ${score} очков в игре "Пузырьки"! Комбо: ${combo}`;
        const url = encodeURIComponent('https://pro-stoi.github.io/bubble-pop/');
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text + ' ' + decodeURIComponent(url));
            this.showNotification('📋 Текст скопирован! Вставь в соцсети.');
        } else {
            alert(text + '\n' + decodeURIComponent(url));
        }
    }

    // ===== ПОКАЗАТЬ УВЕДОМЛЕНИЕ =====
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

// ===== СОЗДАЁМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const vk = new VKManager();

document.addEventListener('DOMContentLoaded', () => {
    vk.init();
});