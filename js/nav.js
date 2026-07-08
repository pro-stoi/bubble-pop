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

// ===== ВЫХОД В КАТАЛОГ ИГР ВКОНТАКТЕ =====
function exitToVKGames() {
    // Просто переходим в каталог игр
    goToVKGames();
}

// ===== ПЕРЕХОД НА КАТАЛОГ ИГР =====
function goToVKGames() {
    // Определяем, мобильное устройство или нет
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Для мобильных - используем m.vk.com, для ПК - обычный vk.com
    const baseUrl = isMobile ? 'https://m.vk.com' : 'https://vk.com';
    const targetUrl = baseUrl + '/apps';
    
    try {
        window.top.location.href = targetUrl;
    } catch (e) {
        try {
            window.parent.location.href = targetUrl;
        } catch (e2) {
            window.location.href = targetUrl;
        }
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
