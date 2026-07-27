// js/challenges.js

console.log('🏆 [CHALLENGES] Файл загружен');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 [CHALLENGES] DOM загружен');
    
    var tbody = document.getElementById('challengesBody');
    var totalDisplay = document.getElementById('totalRewardsDisplay');
    var backBtn = document.getElementById('backBtnChallenges');
    var soundBtn = document.getElementById('soundToggleChallenges');
    
    var challengesData = [];
    var totalReward = 0;

    function getUserId() {
        var id = localStorage.getItem('bubbleUserId');
        if (id) return parseInt(id);
        
        if (window.vk && window.vk.dbUserId) {
            return parseInt(window.vk.dbUserId);
        }
        
        return null;
    }

    function renderChallenges(challenges, total) {
        console.log('🏆 [CHALLENGES] Рендеринг, записей =', challenges ? challenges.length : 0);
        
        totalDisplay.textContent = '⭐ ' + (total || 0);
        
        if (!challenges || challenges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">📭 Нет испытаний</td></tr>';
            return;
        }
        
        var html = '';
        
        for (var i = 0; i < challenges.length; i++) {
            var ch = challenges[i];
            
            var progressInLevel = ch.progressInLevel || 0;
            var targetForLevel = ch.targetForLevel || ch.targetBase || 10;
            var progressPercent = Math.min((progressInLevel / targetForLevel) * 100, 100);
            
            var barColor = '#ff6b6b';
            if (ch.level >= 3) barColor = '#6bff9d';
            else if (ch.level >= 2) barColor = '#6bcfff';
            else if (ch.level >= 1) barColor = '#ffcc00';
            
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${ch.icon || '📌'}</td>
                    <td><strong>${ch.name || '—'}</strong></td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${progressPercent}%; background: ${barColor};"></div>
                            </div>
                            <span class="progress-text">${progressInLevel}/${targetForLevel}</span>
                        </div>
                    </td>
                    <td>💎 ${ch.totalReward || 0}</td>
                    <td>${ch.level || 0}</td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
        console.log('✅ [CHALLENGES] Отрисовано', challenges.length, 'испытаний');
    }

    async function loadChallenges() {
        console.log('🏆 [CHALLENGES] Загружаем данные...');
        
        tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">⏳ Загрузка...</td></tr>';
        totalDisplay.textContent = '⭐ 0';
        
        var userId = getUserId();
        console.log('🏆 [CHALLENGES] userId =', userId);
        
        if (!userId) {
            console.warn('⚠️ [CHALLENGES] Нет userId, ждём авторизацию...');
            tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">⏳ Ожидание авторизации...</td></tr>';
            
            document.addEventListener('vkReady', function(e) {
                console.log('🏆 [CHALLENGES] Событие vkReady, userId =', e.detail.userId);
                if (e.detail.userId) {
                    localStorage.setItem('bubbleUserId', String(e.detail.userId));
                    loadChallenges();
                }
            });
            
            setTimeout(function() {
                var newUserId = getUserId();
                if (newUserId) {
                    console.log('🏆 [CHALLENGES] userId найден по таймауту =', newUserId);
                    loadChallenges();
                } else {
                    console.error('❌ [CHALLENGES] userId не найден');
                    tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">❌ Ошибка авторизации</td></tr>';
                }
            }, 5000);
            
            return;
        }
        
        try {
            console.log('🏆 [CHALLENGES] Вызываем repository.loadChallenges(' + userId + ')');
            var result = await repository.loadChallenges(userId);
            
            console.log('🏆 [CHALLENGES] Получено данных, success =', result ? 'true' : 'false');
            
            if (result && result.challenges) {
                challengesData = result.challenges;
                totalReward = result.totalReward || 0;
                console.log('🏆 [CHALLENGES] Загружено', challengesData.length, 'испытаний, наград =', totalReward);
                renderChallenges(challengesData, totalReward);
            } else {
                console.warn('⚠️ [CHALLENGES] Данных нет');
                tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">📭 Нет данных</td></tr>';
            }
            
        } catch (error) {
            console.error('❌ [CHALLENGES] Ошибка:', error.message);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="challenges-empty" style="color:#ffcc00;">
                        ⚠️ Ошибка загрузки<br>
                        <span style="font-size:12px;color:rgba(255,255,255,0.3);">
                            ${error.message}
                        </span>
                    </td>
                </tr>
            `;
        }
    }

    // ===== ОБРАБОТЧИКИ =====
    backBtn.addEventListener('click', function() {
        console.log('🏆 [CHALLENGES] Переход в меню');
        window.location.href = 'index.html';
    });
    backBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log('🏆 [CHALLENGES] Переход в меню (touch)');
        window.location.href = 'index.html';
    });

    soundBtn.addEventListener('click', function() {
        if (typeof toggleSound === 'function') toggleSound();
    });
    soundBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (typeof toggleSound === 'function') toggleSound();
    });

    // ===== ЗАПУСК =====
    console.log('🏆 [CHALLENGES] Запускаем загрузку');
    loadChallenges();
});