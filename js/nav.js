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
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Проверяем, в тестовом режиме или в продакшене
    var isDev = window.location.href.indexOf('dev.vk.com') !== -1;
    
    var url;
    if (isDev) {
        // В тестовом режиме — переходим в ленту
        url = isMobile ? 'https://m.vk.com/feed' : 'https://vk.com/feed';
    } else {
        // В продакшене — в каталог игр
        url = isMobile ? 'https://m.vk.com/apps' : 'https://vk.com/apps';
    }
    
    try {
        window.top.location.href = url;
    } catch (e) {
        window.location.href = url;
    }
}

// ===== ЗВУК =====
function toggleSound() {
    if (window.toggleSoundGlobal) {
        window.toggleSoundGlobal();
    } else {
        var soundEnabled = localStorage.getItem('bubbleSound') !== 'false';
        localStorage.setItem('bubbleSound', String(!soundEnabled));
        if (window.updateSoundIcon) {
            window.updateSoundIcon();
        }
    }
}

function updateSoundIcon() {
    var icons = document.querySelectorAll('.sound-icon');
    var labels = document.querySelectorAll('.sound-label');
    var enabled = localStorage.getItem('bubbleSound') !== 'false';
    icons.forEach(function(el) {
        if (el) el.textContent = enabled ? '🔊' : '🔇';
    });
    labels.forEach(function(el) {
        if (el) el.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    });
}

window.updateSoundIcon = updateSoundIcon;

document.addEventListener('DOMContentLoaded', function() {
    updateSoundIcon();
});
