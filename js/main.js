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
        game.handleTap(x, y);
    }

    canvas.addEventListener('click', handleTap);
    canvas.addEventListener('touchstart', handleTap, { passive: false });

    // ===== UI ЭЛЕМЕНТЫ =====
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const pendingEl = document.getElementById('pendingScore');
    const multiplierEl = document.getElementById('multiplier');

    // ===== КНОПКА НАЗАД =====
    document.getElementById('backMenuBtn').addEventListener('click', () => {
        game.saveGameResult();
        goTo('menu.html');
    });
    document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        game.saveGameResult();
        goTo('menu.html');
    });

    // ===== КНОПКА РЕСТАРТ =====
    document.getElementById('restartBtn').addEventListener('click', () => {
        if (confirm('Начать заново?')) {
            game.saveGameResult();
            window.location.reload();
        }
    });
    document.getElementById('restartBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        if (confirm('Начать заново?')) {
            game.saveGameResult();
            window.location.reload();
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
        
        // Обновляем UI
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

    // ===== АДАПТАЦИЯ =====
    window.addEventListener('resize', () => {
        game.resize();
    });

    // ===== СОХРАНЕНИЕ ЛУЧШЕГО РЕЗУЛЬТАТА =====
    let bestScore = parseInt(localStorage.getItem('bubbleBest') || '0');
    
    // Проверяем рекорд каждые 5 секунд
    setInterval(() => {
        if (game.score > bestScore) {
            bestScore = game.score;
            localStorage.setItem('bubbleBest', String(bestScore));
        }
    }, 5000);

    console.log('🫧 Пузырьки запущены!');
    console.log(`🏆 Рекорд: ${bestScore}`);
});