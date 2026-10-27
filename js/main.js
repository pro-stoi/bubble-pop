document.addEventListener('DOMContentLoaded', function() {
    // ===== ПРОВЕРЯЕМ, НЕ ЗАПУЩЕНА ЛИ УЖЕ ИГРА =====
    let gameStarted = false;
    
async function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    
    const userId = localStorage.getItem('bubbleUserId');
    console.log('👤 ID пользователя:', userId);
    
    // ===== СОЗДАЁМ ИГРУ (ОДИН РАЗ!) =====
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    if (userId) {
        const userIdNum = parseInt(userId);
        
        // ===== ЗАГРУЖАЕМ ДАННЫЕ =====
        await challengeTracker.loadFromServer(userIdNum).catch(() => {
            console.warn('⚠️ Испытания не загружены');
        });
        await statsManager.load(userIdNum).catch(() => {
            console.warn('⚠️ Статистика не загружена');
        });
        
        // ===== СОХРАНЯЕМ СЕССИЮ =====
        if (statsManager.userId) {
            statsManager.sessions = (statsManager.sessions || 0) + 1;
            statsManager.lastPlay = new Date().toISOString();
            statsManager.sessionStart = Date.now();
            await statsManager.saveSessionOnly();
            console.log('✅ Сессия сохранена: #' + statsManager.sessions);
        }
        
        // ===== ЗАГРУЖАЕМ БОНУСЫ =====
        loadUserBonuses(userIdNum, game);
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

        // Не пропускаем тапы, если игра на паузе, в game over или идёт реклама
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
        exitModalMultiplier.textContent = '×' + stats.maxMultiplier;
        exitModalPopped.textContent = stats.totalPopped;

        const title = document.getElementById('exitModalTitle');
        if (title) title.textContent = '🏆 ИТОГИ ИГРЫ';
        const continueBtn = document.getElementById('exitModalContinue');
        if (continueBtn) continueBtn.style.display = 'none';

        exitModal.style.display = 'flex';
    }

    function hideExitModal() {
        exitModal.style.display = 'none';
    }

     // ===== КНОПКА "ДОМИК" =====
    document.getElementById('backMenuBtn').addEventListener('click', function() {
        game.pauseGame();
        showExitModal();
    });
    document.getElementById('backMenuBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        game.pauseGame();
        showExitModal();
    });

    // ===== КНОПКА "ПРИГЛАСИТЬ" =====
    const inviteBtn = document.getElementById('inviteFriendBtn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', function() {
            if (typeof vk !== 'undefined' && vk.inviteFriend) {
                vk.inviteFriend();
            } else {
                console.warn('⚠️ VK не инициализирован');
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

    // ===== КНОПКА "ПРОДОЛЖИТЬ" (после game over за рекламу) =====
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

        // Восстанавливаем состояние игры
        game.lives = game.maxLives;
        game.isGameOver = false;
        game.isRunning = true;
        game.combo = 0;
        game.multiplier = 1;
        game.slowFactor = 1.0;
        game.targetSlow = 1.0;

        // Жёстко снимаем паузу и восстанавливаем скорости
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

        // Точка отсчёта комбо — «сейчас», чтобы не сгорело
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

        sound.bonusHappy();
    }

    document.getElementById('exitModalContinue').addEventListener('click', handleContinueFromGameOver);
    document.getElementById('exitModalContinue').addEventListener('touchend', function(e) {
        e.preventDefault();
        handleContinueFromGameOver();
    });

     // ===== КНОПКА "ВЕРНУТЬСЯ" =====
    document.getElementById('exitModalBack').addEventListener('click', function() {
        hideExitModal();
        game.resumeGame();
    });
    document.getElementById('exitModalBack').addEventListener('touchend', function(e) {
        e.preventDefault();
        hideExitModal();
        game.resumeGame();
    });

    // ===== КНОПКА "ПОДЕЛИТЬСЯ" =====
    document.getElementById('exitModalShare').addEventListener('click', function() {
        const stats = game.getStats();
        if (typeof vk !== 'undefined' && vk.shareResult) {
            vk.shareResult(stats.score, stats.maxCombo);
        } else {
            alert('📤 Поделиться: ' + stats.score + ' очков, комбо: ' + stats.maxCombo);
        }
    });
    document.getElementById('exitModalShare').addEventListener('touchend', function(e) {
        e.preventDefault();
        const stats = game.getStats();
        if (typeof vk !== 'undefined' && vk.shareResult) {
            vk.shareResult(stats.score, stats.maxCombo);
        } else {
            alert('📤 Поделиться: ' + stats.score + ' очков, комбо: ' + stats.maxCombo);
        }
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
        if (!game.isAdPlaying && !game.isGameOver && !game.isPaused) {
            game.update();
        }
        game.draw();
        game.updateLivesUI();
        
        if (pendingEl) {
            pendingEl.textContent = '+'.concat(game.pendingScore);
            var size = 20 + Math.min(game.pendingScore / 20, 16);
            pendingEl.style.fontSize = size + 'px';
            if (game.pendingScore > 500) {
                pendingEl.style.color = '#00ff88';
            } else if (game.pendingScore > 100) {
                pendingEl.style.color = '#88ff44';
            } else {
                pendingEl.style.color = '#ffcc00';
            }
        }
        
        if (multiplierEl) {
            multiplierEl.textContent = '×'.concat(game.multiplier);
            var multSize = 16 + Math.min(game.multiplier * 1.5, 24);
            multiplierEl.style.fontSize = multSize + 'px';
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

    // ===== ЗАГРУЗКА БОНУСОВ =====
// ===== ЗАГРУЗКА БОНУСОВ =====
async function loadUserBonuses(userId, game) {
    try {
        // Определяем URL в зависимости от окружения
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.protocol === 'file:';
        
        const apiUrl = isLocal 
            ? `http://170.168.10.167:8080/api/bubble/user-bonus/${userId}`
            : `https://neurodrone-arena.ru/api/bubble/user-bonus/${userId}`;
        
        console.log('📡 Загрузка бонусов:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success && data.availableBonuses && data.availableBonuses.length > 0) {
            console.log('🎁 Загружено бонусов:', data.availableBonuses.length);
            
            if (game && game.bonusManager) {
                game.bonusManager.addBonusesFromDB(data.availableBonuses);
            }
        } else {
            console.log('📭 Нет бонусов');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки бонусов:', error);
    }
}

    function updateBonusDisplay(bonuses) {
        const container = document.getElementById('bonusDisplay');
        if (!container) return;
        
        if (!bonuses || bonuses.length === 0) {
            container.innerHTML = '🎁 Нет бонусов';
            return;
        }
        
        const emojis = {
            red: '🐢',
            yellow: '🧲',
            green: '🎯',
            blue: '⚡',
            pink: '💥'
        };
        
        let html = '🎁 Бонусы: ';
        bonuses.forEach(type => {
            html += emojis[type] || '🎁';
        });
        
        container.innerHTML = html;
    }

    // ===== ЗАПУСК ИГРЫ =====
    if (typeof vk !== 'undefined' && vk.isReady && vk.dbUserId) {
        startGame();
    } else {
        document.addEventListener('vkReady', function(e) {
            console.log('🎮 VK готов, запускаем игру!', e.detail);
            startGame();
        });
        
        setTimeout(function() {
            if (!gameStarted) {
                console.warn('⏱ VK не ответил, запускаем игру принудительно');
                startGame();
            }
        }, 5000);
    }
});
