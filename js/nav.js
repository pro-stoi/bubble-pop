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

// ===== ВЫХОД ИЗ VK MINI APP (ИСПРАВЛЕННЫЙ) =====
function exitToVK() {
    // Проверяем, открыто ли приложение в VK
    const isVK = window.location.href.includes('vk.com') || 
                 window.location.href.includes('vk.ru') ||
                 typeof vkBridge !== 'undefined';
    
    if (isVK && typeof vkBridge !== 'undefined') {
        try {
            // Способ 1: Закрыть приложение
            vkBridge.send('VKWebAppClose', {})
                .then(() => {
                    console.log('✅ Приложение закрыто');
                })
                .catch((error) => {
                    console.warn('⚠️ Ошибка закрытия:', error);
                    fallbackExit();
                });
            
            // Таймаут на случай, если закрытие не сработало
            setTimeout(() => {
                // Способ 2: Перейти на страницу VK (запасной)
                window.location.href = 'https://vk.com/feed';
            }, 3000);
            
        } catch (e) {
            fallbackExit();
        }
    } else {
        // Если не в VK — просто закрываем окно
        fallbackExit();
    }
}

// ===== ЗАПАСНОЙ ВАРИАНТ ВЫХОДА =====
function fallbackExit() {
    // Попытка закрыть окно
    try {
        window.close();
    } catch (e) {
        // Если не получается — переходим на VK
        window.location.href = 'https://vk.com/feed';
    }
    
    // Если окно не закрылось через 1 секунду — переходим на VK
    setTimeout(() => {
        window.location.href = 'https://vk.com/feed';
    }, 1000);
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
