// ===== НАВИГАЦИЯ =====

function goTo(page) {
    window.location.href = page;
}

// ===== ПЕРЕХОД С РЕКЛАМОЙ =====
function goToWithAd(page) {
    if (typeof VK !== 'undefined' && VK.bridge) {
        try {
            VK.bridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .then(() => {
                    goTo(page);
                })
                .catch(() => {
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

// ===== НОВОЕ: ВЫХОД ИЗ VK MINI APP =====
function exitToVK() {
    if (typeof VK !== 'undefined' && VK.bridge) {
        try {
            VK.bridge.send('VKWebAppClose', {})
                .then(() => {
                    console.log('✅ Приложение закрыто');
                })
                .catch((error) => {
                    console.warn('⚠️ Ошибка закрытия:', error);
                    // Запасной вариант
                    fallbackExit();
                });
        } catch (e) {
            fallbackExit();
        }
    } else {
        fallbackExit();
    }
}

// ===== ЗАПАСНОЙ ВАРИАНТ ВЫХОДА =====
function fallbackExit() {
    // Если не в VK — просто показываем сообщение
    if (confirm('Выйти из приложения?')) {
        // Пытаемся закрыть окно
        window.close();
        // Если не получилось — переходим на главную VK
        window.location.href = 'https://vk.com';
    }
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