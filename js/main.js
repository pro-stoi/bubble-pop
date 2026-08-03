document.addEventListener('DOMContentLoaded', function() {
    // ===== ПРОВЕРЯЕМ, НЕ ЗАПУЩЕНА ЛИ УЖЕ ИГРА =====
    let gameStarted = false;
    
    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        
        // ===== ПРИНУДИТЕЛЬНЫЙ URL =====
        const userId = localStorage.getItem('bubbleUserId');
        console.log('👤 ID пользователя:', userId);
        
        // ===== СОЗДАЁМ ИГРУ =====
        const canvas = document.getElementById('gameCanvas');
        const game = new Game(canvas);

        // ===== ЗАГРУЖАЕМ БД В ФОНЕ =====
   // ===== ЗАГРУЖАЕМ ДАННЫЕ В ФОНЕ =====
if (userId) {
    const userIdNum = parseInt(userId);
    
    challengeTracker.loadFromServer(userIdNum).catch(() => {
        console.warn('⚠️ Испытания не загружены');
    });
    statsManager.load(userIdNum).catch(() => {
        console.warn('⚠️ Статистика не загружена');
    });
    
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

        // ===== КНОПКА "ПРИГЛАСИТЬ" =====
        const inviteBtn = document.getElementById('inviteFriendBtn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', function() {
                if (typeof vk !== 'undefined' && vk.inviteFriend) {
                    vk.inviteFriend();
                } else {
                    console.warn('⚠️ VK не инициализирован');
                    // Локальный режим
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
