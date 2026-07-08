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
        
        const uiElements = document.querySelectorAll('.game-btn, .bonus-btn, #topBar, #bonusContainer, .exit-modal, .exit-modal-content, .exit-modal-btn');
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
    document.getElementById('backMenuBtn').addEventListener('click', () => {
        game.saveGameResult();
        showExitModal();
    });
    
    document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        game.saveGameResult();
        showExitModal();
    });

    // ===== КНОПКА "ВЫЙТИ" В ИГРЕ =====
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        game.saveGameResult();
        showExitModal();
    });
    
    document.getElementById('exitGameBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        game.saveGameResult();
        showExitModal();
    });

    // ===== КНОПКИ В МОДАЛЬНОМ ОКНЕ =====
    // Вернуться в игру
    document.getElementById('exitModalBack').addEventListener('click', () => {
        hideExitModal();
    });
    document.getElementById('exitModalBack').addEventListener('touchend', (e) => {
        e.preventDefault();
        hideExitModal();
    });

    // Выйти в каталог игр
    document.getElementById('exitModalExit').addEventListener('click', () => {
        hideExitModal();
        exitToVKGames();
    });
    document.getElementById('exitModalExit').addEventListener('touchend', (e) => {
        e.preventDefault();
        hideExitModal();
        exitToVKGames();
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
