// ===== КНОПКА "ВЫЙТИ" =====
document.getElementById('exitModalExit').addEventListener('click', function() {
    const btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Сохранение...';
    
    let isDone = false;
    
    // ===== ТАЙМАУТ: если сохранение зависло — выходим принудительно =====
    setTimeout(function() {
        if (!isDone) {
            console.warn('⏱ Таймаут сохранения! Выход принудительный.');
            btn.textContent = '⏱ Выход...';
            hideExitModal();
            if (typeof vkBridge !== 'undefined') {
                vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                    .finally(function() {
                        goTo('index.html');
                    });
            } else {
                goToWithAd('index.html');
            }
        }
    }, 5000); // 5 секунд на сохранение
    
    // ===== СОХРАНЕНИЕ =====
    game.saveGameResult(function(success) {
        isDone = true;
        if (success) {
            btn.textContent = '✅ Сохранено!';
        } else {
            btn.textContent = '❌ Ошибка!';
        }
        
        setTimeout(function() {
            hideExitModal();
            if (typeof vkBridge !== 'undefined') {
                vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                    .finally(function() {
                        goTo('index.html');
                    });
            } else {
                goToWithAd('index.html');
            }
        }, 500);
    });
});

// ===== ТАЧ-СОБЫТИЕ =====
document.getElementById('exitModalExit').addEventListener('touchend', function(e) {
    e.preventDefault();
    const btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Сохранение...';
    
    let isDone = false;
    
    // ===== ТАЙМАУТ: если сохранение зависло — выходим принудительно =====
    setTimeout(function() {
        if (!isDone) {
            console.warn('⏱ Таймаут сохранения! Выход принудительный.');
            btn.textContent = '⏱ Выход...';
            hideExitModal();
            if (typeof vkBridge !== 'undefined') {
                vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                    .finally(function() {
                        goTo('index.html');
                    });
            } else {
                goToWithAd('index.html');
            }
        }
    }, 5000);
    
    // ===== СОХРАНЕНИЕ =====
    game.saveGameResult(function(success) {
        isDone = true;
        if (success) {
            btn.textContent = '✅ Сохранено!';
        } else {
            btn.textContent = '❌ Ошибка!';
        }
        
        setTimeout(function() {
            hideExitModal();
            if (typeof vkBridge !== 'undefined') {
                vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                    .finally(function() {
                        goTo('index.html');
                    });
            } else {
                goToWithAd('index.html');
            }
        }, 500);
    });
});
