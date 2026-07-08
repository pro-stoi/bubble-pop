document.addEventListener('DOMContentLoaded', () => {
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
        
        const uiElements = document.querySelectorAll('.game-btn, .bonus-btn, #topBar, #bonusContainer');
        let isOnUI = false;
        
        uiElements.forEach(el => {
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

    // ===== КНОПКА "НАЗАД" В МЕНЮ =====
    document.getElementById('backMenuBtn').addEventListener('click', () => {
        game.saveGameResult();
        if (typeof vkBridge !== 'undefined') {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .finally(() => {
                    goTo('index.html');
                });
        } else {
            goToWithAd('index.html');
        }
    });
    
    document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        game.saveGameResult();
        if (typeof vkBridge !== 'undefined') {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                .finally(() => {
                    goTo('index.html');
                });
        } else {
            goToWithAd('index.html');
        }
    });

    // ===== КНОПКА ЗВУКА =====
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
        toggleSound();
    });
    document.getElementById('soundToggleBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== ИГРОВОЙ ЦИКЛ =====
    function gameLoop() {
        game.update();
        game.draw();
        
        if (pendingEl) {
            pendingEl.textContent = `+${game.pendingScore}`;
        }
        if (multiplierEl) {
            multiplierEl.textContent = `×${game.multiplier}`;
        }
        scoreEl.textContent = `💎 ${game.score}`;
        
        if (game.combo > 1) {
            comboEl.textContent = `🔥 x${game.combo}`;
            comboEl.classList.add('show');
        } else {
            comboEl.classList.remove('show');
        }

        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    window.addEventListener('resize', () => {
        game.resize();
    });

    let bestScore = parseInt(localStorage.getItem('bubbleBest') || '0');
    
    setInterval(() => {
        if (game.score > bestScore) {
            bestScore = game.score;
            localStorage.setItem('bubbleBest', String(bestScore));
        }
    }, 5000);

    console.log('🫧 Пузырьки запущены!');
    console.log(`🏆 Рекорд: ${bestScore}`);
});