// ===== НАВИГАЦИЯ =====

function goTo(page) {
    window.location.href = page;
}

// ===== ПЕРЕХОД С РЕКЛАМОЙ =====
function goToWithAd(page) {
    if (typeof vkBridge !== 'undefined') {
        try {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .then(() => {
                    goTo(page);
                })
                .catch((error) => {
                    console.warn('⚠️ Реклама не показана:', error);
                    goTo(page);
                });
            
            setTimeout(() => {
                const currentPath = window.location.pathname;
                const targetPath = '/' + page;
                if (currentPath !== targetPath) {
                    goTo(page);
                }
            }, 5000);
        } catch (e) {
            goTo(page);
        }
    } else {
        goTo(page);
    }
}

// ===== ВЫХОД ИЗ ИГРЫ (ПРАВИЛЬНЫЙ) =====
function exitToVK() {
    // Способ 1: Закрыть через VK Bridge (если есть)
    if (typeof vkBridge !== 'undefined') {
        try {
            vkBridge.send('VKWebAppClose', {})
                .then(() => {
                    console.log('✅ Приложение закрыто через VK Bridge');
                })
                .catch((error) => {
                    console.warn('⚠️ Ошибка закрытия через VK Bridge:', error);
                    // Если не получилось — пробуем другие способы
                    closeByOtherMethods();
                });
            return;
        } catch (e) {
            console.warn('⚠️ Исключение при закрытии через VK Bridge:', e);
            closeByOtherMethods();
        }
    } else {
        closeByOtherMethods();
    }
}

// ===== ЗАПАСНЫЕ СПОСОБЫ ЗАКРЫТИЯ =====
function closeByOtherMethods() {
    // Способ 2: Передать команду родительскому окну (если это iframe)
    try {
        if (window.parent && window.parent !== window) {
            // Отправляем сообщение родительскому окну
            window.parent.postMessage({ type: 'VKWebAppClose' }, '*');
            console.log('📤 Отправлена команда закрытия родительскому окну');
            
            // Запасной вариант через 2 секунды
            setTimeout(() => {
                try {
                    // Пытаемся закрыть через window.top
                    if (window.top && window.top !== window) {
                        window.top.postMessage({ type: 'VKWebAppClose' }, '*');
                    }
                } catch (e) {}
            }, 2000);
        }
    } catch (e) {
        console.warn('⚠️ Не удалось отправить сообщение родительскому окну:', e);
    }
    
    // Способ 3: Переход на пустую страницу (иногда помогает)
    try {
        // Пытаемся закрыть окно
        window.close();
    } catch (e) {}
    
    // Способ 4: Переход на VK (НО на всю страницу, не внутри iframe)
    try {
        // Это должно заменить ВСЮ страницу, а не только iframe
        window.top.location.href = 'https://vk.com/feed';
    } catch (e) {
        // Если window.top недоступен, пробуем через window.parent
        try {
            window.parent.location.href = 'https://vk.com/feed';
        } catch (e2) {
            window.location.href = 'https://vk.com/feed';
        }
    }
    
    // Если ничего не помогло — последний шанс через 2 секунды
    setTimeout(() => {
        try {
            window.top.location.href = 'https://vk.com/feed';
        } catch (e) {
            window.location.href = 'https://vk.com/feed';
        }
    }, 3000);
}

// ===== ЗВУК =====
function toggleSound() {
    if (window.toggleSoundGlobal) {
        window.toggleSoundGlobal();
    } else {
        const soundEnabled = localStorage.getItem('bubbleSound') !== 'false';
        localStorage.setItem('bubbleSound', String(!soundEnabled));
        if (window.updateSoundIcon) {
            window.updateSoundIcon();
        }
    }
}

function updateSoundIcon() {
    const icons = document.querySelectorAll('.sound-icon');
    const labels = document.querySelectorAll('.sound-label');
    const enabled = localStorage.getItem('bubbleSound') !== 'false';
    icons.forEach(el => {
        if (el) el.textContent = enabled ? '🔊' : '🔇';
    });
    labels.forEach(el => {
        if (el) el.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    });
}

window.updateSoundIcon = updateSoundIcon;

document.addEventListener('DOMContentLoaded', () => {
    updateSoundIcon();
});