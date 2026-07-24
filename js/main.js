document.addEventListener('DOMContentLoaded', function() {
    async function startGame() {
        const userId = localStorage.getItem('bubbleUserId');
        console.log('👤 ID пользователя:', userId);
        
        // ===== СОЗДАЁМ ИГРУ СРАЗУ (НЕ ЖДЁМ БД) =====
        const canvas = document.getElementById('gameCanvas');
        const game = new Game(canvas);

        // ===== ЗАГРУЖАЕМ БД В ФОНЕ (НЕ БЛОКИРУЕМ) =====
        if (userId) {
            const userIdNum = parseInt(userId);
            
            // Фоновые загрузки — без await
            challengeTracker.loadFromServer(userIdNum).catch(() => {
                console.warn('⚠️ Испытания не загружены');
            });
            statsManager.load(userIdNum).catch(() => {
                console.warn('⚠️ Статистика не загружена');
            });
        }

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

        // ===== КНОПКА "ДОМИК" =====
        document.getElementById('backMenuBtn').addEventListener('click', function() {
            showExitModal();
        });
        document.getElementById('backMenuBtn').addEventListener('touchend', function(e) {
            e.preventDefault();
            showExitModal();
        });

        // ===== КНОПКА "ВЕРНУТЬСЯ" =====
        document.getElementById('exitModalBack').addEventListener('click', function() {
            hideExitModal();
        });
        document.getElementById('exitModalBack').addEventListener('touchend', function(e) {
            e.preventDefault();
            hideExitModal();
        });

        // ===== КНОПКА "ВЫЙТИ" =====
        document.getElementById('exitModalExit').addEventListener('click', function() {
            game.saveGameResult();
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
        document.getElementById('exitModalExit').addEventListener('touchend', function(e) {
            e.preventDefault();
            game.saveGameResult();
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
