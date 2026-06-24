// ===== НАВИГАЦИЯ =====

function goTo(page) {
    window.location.href = page;
}

// ===== ПЕРЕХОД С РЕКЛАМОЙ =====
function goToWithAd(page) {
    // Проверяем, есть ли VK Bridge и реклама
    if (typeof VK !== 'undefined' && VK.bridge) {
        try {
            // Пытаемся показать рекламу
            VK.bridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .then(() => {
                    // Реклама показана, переходим
                    goTo(page);
                })
                .catch(() => {
                    // Если реклама не показалась — переходим сразу
                    goTo(page);
                });
            // ВАЖНО: таймаут на случай, если реклама не ответила
            setTimeout(() => {
                // Если через 5 секунд переход не произошёл — форсируем
                // Проверяем, что мы всё ещё на той же странице
                const currentPath = window.location.pathname;
                const targetPath = '/' + page;
                if (currentPath !== targetPath) {
                    goTo(page);
                }
            }, 5000);
        } catch (e) {
            // Если ошибка — просто переходим
            goTo(page);
        }
    } else {
        // Если VK Bridge нет — просто переходим
        goTo(page);
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