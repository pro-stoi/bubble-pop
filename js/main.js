document.addEventListener('DOMContentLoaded', function() {
    let gameStarted = false;

    // ===== ВСПОМОГАТЕЛЬНОЕ: ЖДЁМ ПОЯВЛЕНИЯ bubbleUserId =====
    function getStoredUserId() {
        const ls = localStorage.getItem('bubbleUserId');
        if (ls) {
            const n = parseInt(ls, 10);
            if (!isNaN(n)) return n;
        }
        if (typeof vk !== 'undefined' && vk.dbUserId) {
            const n = parseInt(vk.dbUserId, 10);
            if (!isNaN(n)) return n;
        }
        return null;
    }

    async function ensureUserId(maxWaitMs) {
        maxWaitMs = maxWaitMs || 15000;
        const start = Date.now();
        let triedLogin = false;

        while (Date.now() - start < maxWaitMs) {
            // 1. Уже есть?
            const existing = getStoredUserId();
            if (existing) return existing;

            // 2. Пробуем залогиниться (один раз)
            if (!triedLogin && typeof vk !== 'undefined' && vk.isReady) {
                triedLogin = true;
                try {
                    if (!vk.userId) {
                        try { await vk.getUserInfo(); } catch (e) {}
                    }
                    if (vk.userId && !vk.dbUserId) {
                        await vk.loginToServer();
                    }
                } catch (e) {
                    console.warn('⚠️ [START] Попытка логина провалилась:', e);
                }
            }

            // 3. Ещё раз проверяем после попытки
            const afterTry = getStoredUserId();
            if (afterTry) return afterTry;

            await new Promise(r => setTimeout(r, 400));
        }
        return null;
    }

    // ===== ПЛАШКА ОБ ОШИБКЕ АВТОРИЗАЦИИ (без консоли) =====
    function showAuthError() {
        if (document.getElementById('authErrorBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'authErrorBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 9999;
            background: rgba(180, 30, 30, 0.95);
            color: #fff;
            padding: 14px 18px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;

        const text = document.createElement('span');
        text.textContent = '⚠️ Не удалось авторизоваться. Проверьте интернет.';

        const retry = document.createElement('button');
        retry.textContent = 'Повторить';
        retry.style.cssText = `
            background: #fff;
            color: #b41e1e;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            touch-action: manipulation;
        `;
        retry.addEventListener('click', () => location.reload());
        retry.addEventListener('touchend', (e) => { e.preventDefault(); location.reload(); });

        banner.appendChild(text);
        banner.appendChild(retry);
        document.body.appendChild(banner);
    }

    // ===== ГЛАВНАЯ ФУНКЦИЯ СТАРТА =====
    async function startGame() {
        if (gameStarted) return;
        gameStarted = true;

        console.log('🎮 [START] Ждём userId...');
        const userIdNum = await ensureUserId(15000);

        if (!userIdNum) {
            console.error('❌ [START] userId не получен за 15 сек');
            showAuthError();
            // Всё равно запускаем игру — но без сохранения
            // (пользователь хотя бы сможет поиграть)
        } else {
            console.log('✅ [START] userId =', userIdNum);
        }

        // ===== СОЗДАЁМ ИГРУ =====
        const canvas = document.getElementById('gameCanvas');
        const game = new Game(canvas);

        // ===== ЗАГРУЖАЕМ ДАННЫЕ (если userId есть) =====
        if (userIdNum) {
            try {
                await challengeTracker.loadFromServer(userIdNum);
            } catch (e) {
                console.warn('⚠️ Испытания не загружены:', e);
            }

            try {
                await statsManager.load(userIdNum);
            } catch (e) {
                console.warn('⚠️ Статистика не загружена:', e);
            }

            // ===== СЕССИЯ =====
            if (statsManager.userId) {
                try {
                    localStorage.setItem('privacyConsent', 'true');
                    statsManager.sessions = (statsManager.sessions || 0) + 1;
                    statsManager.lastPlay = new Date().toISOString();
                    statsManager.sessionStart = Date.now();
                    await statsManager.saveSessionOnly();
                    console.log('✅ Сессия сохранена: #' + statsManager.sessions);
                } catch (e) {
                    console.warn('⚠️ Сессия не сохранена:', e);
                }
            }

            // ===== БОНУСЫ =====
            try { loadUserBonuses(userIdNum, game); } catch (e) {}
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

            const uiElements = document.querySelectorAll(
                '.game-btn, .bonus-btn, #topBar, #bonusContainer, .exit-modal, .exit-modal-content, .exit-modal-btn'
            );
            let isOnUI = false;

            uiElements.forEach(function(el) {
                const elRect = el.getBoundingClientRect();
                if (clientX >= elRect.left && clientX <= elRect.right &&
                    clientY >= elRect.top && clientY <= elRect.bottom) {
                    isOnUI = true;
                }
            });

            if (isOnUI) return;
            if (game.isPaused || game.isGameOver || game.isAdPlaying) return;

            game.handleTap(x, y);
        }

        canvas.addEventListener('click', handleTap);
        canvas.addEventListener('touchstart', handleTap, { passive: false });

        // ===== UI ЭЛЕМЕНТЫ =====
        const scoreEl = document.getElementById('score');
        const comboEl = document.getElementById('combo');
        const pendingEl = document.getElementById('pendingScore');
        const multiplierEl = document.getElementById('multiplier');

        // ===== МОДАЛКА =====
        const exitModal = document.getElementById('exitModal');
        const exitModalScore = document.getElementById('exitModalScore');
        const exitModalCombo = document.getElementById('exitModalCombo');
        const exitModalMultiplier = document.getElementById('exitModalMultiplier');
        const exitModalPopped = document.getElementById('exitModalPopped');

        function showExitModal() {
            const stats = game.getStats();
            if (exitModalScore) exitModalScore.textContent = stats.score;
            if (exitModalCombo) exitModalCombo.textContent = stats.maxCombo;
            if (exitModalMultiplier) exitModalMultiplier.textContent = '×' + stats.maxMultiplier;
            if (exitModalPopped) exitModalPopped.textContent = stats.totalPopped;

            const title = document.getElementById('exitModalTitle');
            if (title) title.textContent = '🏆 ИТОГИ ИГРЫ';
            const continueBtn = document.getElementById('exitModalContinue');
            if (continueBtn) continueBtn.style.display = 'none';

            exitModal.style.display = 'flex';
        }

        function hideExitModal() {
            exitModal.style.display = 'none';
        }

        // ===== ДОМИК =====
        document.getElementById('backMenuBtn').addEventListener('click', function() {
            game.pauseGame();
            showExitModal();
        });
        document.getElementById('backMenuBtn').addEventListener('touchend', function(e) {
            e.preventDefault();
            game.pauseGame();
            showExitModal();
        });

        // ===== ПРИГЛАСИТЬ =====
        const inviteBtn = document.getElementById('inviteFriendBtn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', function() {
                if (typeof vk !== 'undefined' && vk.inviteFriend) {
                    vk.inviteFriend();
                } else {
                    alert('👥 В локальном режиме приглашение не работает');
                }
            });
            inviteBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (typeof vk !== 'undefined' && vk.inviteFriend) {
                    vk.inviteFriend();
                } else {
                    alert('👥 В локальном режиме приглашение не работает');
                }
            });
        }

        // ===== ЗВУК =====
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            const handleSoundToggle = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (typeof window.toggleSoundGlobal === 'function') {
                    window.toggleSoundGlobal();
                }
            };
            soundToggleBtn.addEventListener('click', handleSoundToggle);
            soundToggleBtn.addEventListener('touchend', handleSoundToggle);
        }

        // ===== ПРОДОЛЖИТЬ (после game over) =====
        async function handleContinueFromGameOver() {
            hideExitModal();
            game.isAdPlaying = true;

            try {
                if (typeof vkBridge !== 'undefined') {
                    await vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'rewarded' });
                }
            } catch (e) {
                console.warn('⚠️ Реклама не показана:', e);
            }

            game.isAdPlaying = false;
            game.lives = game.maxLives;
            game.isGameOver = false;
            game.isRunning = true;
            game.combo = 0;
            game.multiplier = 1;
            game.slowFactor = 1.0;
            game.targetSlow = 1.0;
            game.isPaused = false;
            game.pauseStartedAt = 0;

            if (game.bonusManager && game.bonusManager.slowMotion) {
                game.bonusManager.slowMotion = false;
                game.bonusManager.slowMotionTimer = 0;
            }
            for (const b of game.bubbles) {
                if (b.originalSpeed !== undefined) {
                    b.speed = b.originalSpeed;
                    b.originalSpeed = undefined;
                }
            }
            game.lastPopTime = Date.now();
            game.updateLivesUI();

            const title = document.getElementById('exitModalTitle');
            if (title) title.textContent = '🏆 ИТОГИ ИГРЫ';
            const continueBtn = document.getElementById('exitModalContinue');
            if (continueBtn) continueBtn.style.display = 'none';
            const backBtn = document.getElementById('exitModalBack');
            if (backBtn) backBtn.style.display = '';
            const shareBtn = document.getElementById('exitModalShare');
            if (shareBtn) shareBtn.style.display = '';

            if (typeof sound !== 'undefined' && sound.bonusHappy) sound.bonusHappy();
        }

        document.getElementById('exitModalContinue').addEventListener('click', handleContinueFromGameOver);
        document.getElementById('exitModalContinue').addEventListener('touchend', function(e) {
            e.preventDefault();
            handleContinueFromGameOver();
        });

        // ===== ВЕРНУТЬСЯ =====
        document.getElementById('exitModalBack').addEventListener('click', function() {
            hideExitModal();
            game.resumeGame();
        });
        document.getElementById('exitModalBack').addEventListener('touchend', function(e) {
            e.preventDefault();
            hideExitModal();
            game.resumeGame();
        });

        // ===== ПОДЕЛИТЬСЯ =====
        function doShare() {
            const stats = game.getStats();
            if (typeof vk !== 'undefined' && vk.shareResult) {
                vk.shareResult(stats.score, stats.maxCombo);
            } else {
                alert('📤 Поделиться: ' + stats.score + ' очков, комбо: ' + stats.maxCombo);
            }
        }
        document.getElementById('exitModalShare').addEventListener('click', doShare);
        document.getElementById('exitModalShare').addEventListener('touchend', function(e) {
            e.preventDefault();
            doShare();
        });

        // ===== ВЫЙТИ =====
        function doExit() {
            game.saveGameResult();
            setTimeout(function() {
                hideExitModal();
                if (typeof vkBridge !== 'undefined') {
                    vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
                        .finally(function() { goTo('index.html'); });
                } else {
                    goToWithAd('index.html');
                }
            }, 500);
        }
        document.getElementById('exitModalExit').addEventListener('click', doExit);
        document.getElementById('exitModalExit').addEventListener('touchend', function(e) {
            e.preventDefault();
            doExit();
        });

        // ===== ИГРОВОЙ ЦИКЛ =====
        function gameLoop() {
            if (!game.isAdPlaying && !game.isGameOver && !game.isPaused) {
                game.update();
            }
            game.draw();
            game.updateLivesUI();

            if (pendingEl) {
                pendingEl.textContent = '+'.concat(game.pendingScore);
                const size = 20 + Math.min(game.pendingScore / 20, 16);
                pendingEl.style.fontSize = size + 'px';
                if (game.pendingScore > 500) pendingEl.style.color = '#00ff88';
                else if (game.pendingScore > 100) pendingEl.style.color = '#88ff44';
                else pendingEl.style.color = '#ffcc00';
            }

            if (multiplierEl) {
                multiplierEl.textContent = '×'.concat(game.multiplier);
                const multSize = 16 + Math.min(game.multiplier * 1.5, 24);
                multiplierEl.style.fontSize = multSize + 'px';
            }

            if (scoreEl) scoreEl.textContent = '💎 '.concat(game.score);

            if (game.combo > 1) {
                if (comboEl) {
                    comboEl.textContent = '🔥 x'.concat(game.combo);
                    comboEl.classList.add('show');
                }
            } else {
                if (comboEl) comboEl.classList.remove('show');
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

        // ===== СОХРАНЕНИЕ ПРИ ЗАКРЫТИИ =====
        window.addEventListener('beforeunload', function() {
            if (typeof statsManager !== 'undefined' && statsManager.userId) {
                try {
                    statsManager.onScore(game.score);
                    statsManager.save();
                } catch (e) {}
            }
        });

        console.log('🫧 Пузырьки запущены! Рекорд:', bestScore);
    }

    // ===== ЗАГРУЗКА БОНУСОВ =====
    async function loadUserBonuses(userId, game) {
        try {
            const isLocalEnv = window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1' ||
                              window.location.hostname.startsWith('192.168.') ||
                              window.location.protocol === 'file:';

            const apiUrl = isLocalEnv
                ? `http://170.168.10.167:8080/api/bubble/user-bonus/${userId}`
                : `https://neurodrone-arena.ru/api/bubble/user-bonus/${userId}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.success && data.availableBonuses && data.availableBonuses.length > 0) {
                if (game && game.bonusManager) {
                    game.bonusManager.addBonusesFromDB(data.availableBonuses);
                }
            }
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки бонусов:', error);
        }
    }

    // ===== ЗАПУСК =====
    function tryStart() {
        if (gameStarted) return;

        // Локальный режим — стартуем сразу (vk.dbUserId уже = 2)
        if (typeof vk !== 'undefined' && vk.isLocal && vk.dbUserId) {
            startGame();
            return;
        }

        // Реальный VK — ждём vkReady
        if (typeof vk !== 'undefined' && vk.isReady && vk.dbUserId) {
            startGame();
            return;
        }

        // Ждём событие vkReady
        document.addEventListener('vkReady', function onReady(e) {
            document.removeEventListener('vkReady', onReady);
            const uid = (e && e.detail && e.detail.userId) || getStoredUserId();
            if (uid) {
                startGame();
            } else {
                // vkReady пришёл с null — пробуем ещё раз через ensureUserId в startGame
                startGame();
            }
        });

        // Fallback: если событие не пришло за 8 сек — стартуем (startGame сам подождёт userId)
        setTimeout(function() {
            if (!gameStarted) {
                console.warn('⏱ [START] Fallback-запуск');
                startGame();
            }
        }, 8000);
    }

    tryStart();
});
