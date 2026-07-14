document.addEventListener('DOMContentLoaded', function() {
    // ===== ЗАГРУЖАЕМ ИСПЫТАНИЯ ПЕРЕД ИГРОЙ =====
async function startGame() {
    // ===== ЗАГРУЖАЕМ ИСПЫТАНИЯ ПЕРЕД ИГРОЙ =====
    const userId = localStorage.getItem('bubbleUserId');
    console.log('👤 ID пользователя для загрузки испытаний:', userId);
    
    // Если пользователь есть — загружаем испытания с сервера
    if (userId) {
        await challengeTracker.loadFromServer(parseInt(userId));
        
        // ===== ЗАГРУЖАЕМ СТАТИСТИКУ =====
        await statsManager.load(parseInt(userId));
        console.log('✅ Статистика загружена');
    } else {
        console.warn('⚠️ Пользователь не авторизован, испытания не загружены');
    }

    // ===== СОЗДАЁМ ИГРУ =====
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // ===== ОБРАБОТКА ТАПА =====
    function handleTap(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const uiElements = document.querySelectorAll('.game-btn, .bonus-btn, #topBar, #bonusContainer, .exit-modal, .exit-modal-content, .exit-modal-btn');
        let isOnUI = false;
        
        uiElements.forEach(function(el) {
            const elRect = el.getBoundingClientRect();
            if (clientX >= elRect.left && clientX <= elRect.right &&
                clientY >= elRect.top && clientY <= elRect.bottom) {
                isOnUI = true;
            }
        });
        
        if (isOnUI) return;
        
        game.handleTap(x, y);
    }

    canvas.addEventListener('click', handleTap);
    canvas.addEventListener('touchstart', handleTap, { passive: false });

    // ===== UI ЭЛЕМЕНТЫ =====
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const pendingEl = document.getElementById('pendingScore');
    const multiplierEl = document.getElementById('multiplier');

    // ===== МОДАЛЬНОЕ ОКНО =====
    const exitModal = document.getElementById('exitModal');
    const exitModalScore = document.getElementById('exitModalScore');
    const exitModalCombo = document.getElementById('exitModalCombo');
    const exitModalMultiplier = document.getElementById('exitModalMultiplier');
    const exitModalPopped = document.getElementById('exitModalPopped');

    function showExitModal() {
        const stats = game.getStats();
        exitModalScore.textContent = stats.score;
        exitModalCombo.textContent = stats.maxCombo;
        exitModalMultiplier.textContent = '×' + stats.multiplier;
        exitModalPopped.textContent = stats.totalPopped;
        exitModal.style.display = 'flex';
    }

    function hideExitModal() {
        exitModal.style.display = 'none';
    }

    // ===== КНОПКА "НАЗАД" В МЕНЮ =====
    document.getElementById('backMenuBtn').addEventListener('click', function() {
        game.saveGameResult();
        showExitModal();
    });
    
    document.getElementById('backMenuBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        game.saveGameResult();
        showExitModal();
    });

    // ===== КНОПКИ В МОДАЛЬНОМ ОКНЕ =====
    document.getElementById('exitModalBack').addEventListener('click', function() {
        hideExitModal();
    });
    document.getElementById('exitModalBack').addEventListener('touchend', function(e) {
        e.preventDefault();
        hideExitModal();
    });

    document.getElementById('exitModalExit').addEventListener('click', function() {
        hideExitModal();
        if (typeof vkBridge !== 'undefined') {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .finally(function() {
                    goTo('index.html');
                });
        } else {
            goToWithAd('index.html');
        }
    });
    document.getElementById('exitModalExit').addEventListener('touchend', function(e) {
        e.preventDefault();
        hideExitModal();
        if (typeof vkBridge !== 'undefined') {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .finally(function() {
                    goTo('index.html');
                });
        } else {
            goToWithAd('index.html');
        }
    });

    // ===== КНОПКА ЗВУКА =====
    document.getElementById('soundToggleBtn').addEventListener('click', function() {
        toggleSound();
    });
    document.getElementById('soundToggleBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        toggleSound();
    });

    // ===== ИГРОВОЙ ЦИКЛ =====
    function gameLoop() {
        game.update();
        game.draw();
        
        if (pendingEl) {
            pendingEl.textContent = '+'.concat(game.pendingScore);
        }
        if (multiplierEl) {
            multiplierEl.textContent = '×'.concat(game.multiplier);
        }
        scoreEl.textContent = '💎 '.concat(game.score);
        
        if (game.combo > 1) {
            comboEl.textContent = '🔥 x'.concat(game.combo);
            comboEl.classList.add('show');
        } else {
            comboEl.classList.remove('show');
        }

        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    window.addEventListener('resize', function() {
        game.resize();
    });

    let bestScore = parseInt(localStorage.getItem('bubbleBest') || '0');
    
    setInterval(function() {
        if (game.score > bestScore) {
            bestScore = game.score;
            localStorage.setItem('bubbleBest', String(bestScore));
        }
    }, 5000);

    console.log('🫧 Пузырьки запущены!');
    console.log('🏆 Рекорд:', bestScore);
}

    // ===== ЗАПУСК =====
    startGame();
});