// js/challenges.js

// ===== СПИСОК ВСЕХ ИСПЫТАНИЙ (СТАТИЧНЫЙ) =====
const CHALLENGES_LIST = [
    { id: 1, name: 'Лопни пузырьки', icon: '💥', baseReward: 10, targetBase: 10, targetMultiplier: 1.5 },
    { id: 2, name: 'Собери фиолетовые', icon: '🟣', baseReward: 10, targetBase: 8, targetMultiplier: 1.5 },
    { id: 3, name: 'Комбо ×10', icon: '🔥', baseReward: 15, targetBase: 5, targetMultiplier: 1.5 },
    { id: 4, name: 'Лопни пузырьки (мастер)', icon: '💪', baseReward: 20, targetBase: 20, targetMultiplier: 1.5 },
    { id: 5, name: 'Собери красные', icon: '🔴', baseReward: 10, targetBase: 8, targetMultiplier: 1.5 },
    { id: 6, name: 'Серия без промаха', icon: '🎯', baseReward: 25, targetBase: 10, targetMultiplier: 1.5 },
    { id: 7, name: 'Бонус 100+ за раз', icon: '💎', baseReward: 30, targetBase: 5, targetMultiplier: 1.5 },
    { id: 8, name: 'Собери все цвета', icon: '🌈', baseReward: 20, targetBase: 5, targetMultiplier: 1.5 }
];

document.addEventListener('DOMContentLoaded', async function() {
    // ===== ПОЛУЧАЕМ ID ПОЛЬЗОВАТЕЛЯ =====
    let userId = localStorage.getItem('bubbleUserId');
    
    // Если нет в localStorage — пробуем из VK
    if (!userId && window.vk && window.vk.dbUserId) {
        userId = window.vk.dbUserId;
        localStorage.setItem('bubbleUserId', String(userId));
    }
    
    // Если всё равно нет — используем ID=1 (тестовый)
    if (!userId) {
        console.warn('⚠️ Пользователь не найден, используем ID=1');
        userId = 1;
        localStorage.setItem('bubbleUserId', '1');
    }
    
    console.log('👤 ID пользователя для испытаний:', userId);

    try {
        // Загружаем прогресс с сервера
        const response = await fetch(`/api/bubble/challenges/${userId}`);
        const data = await response.json();
        
        if (data.success && data.challenges) {
            const mergedChallenges = CHALLENGES_LIST.map(ch => {
                const serverCh = data.challenges.find(c => c.id === ch.id);
                return {
                    ...ch,
                    progress: serverCh ? serverCh.progress : 0,
                    level: serverCh ? serverCh.level : 0,
                    totalReward: serverCh ? serverCh.totalReward : 0,
                    isCompleted: serverCh ? serverCh.isCompleted : false
                };
            });
            renderChallenges(mergedChallenges, data.totalReward);
        } else {
            const fallbackChallenges = CHALLENGES_LIST.map(ch => ({
                ...ch,
                progress: 0,
                level: 0,
                totalReward: 0,
                isCompleted: false
            }));
            renderChallenges(fallbackChallenges, 0, '⚠️ Ошибка загрузки прогресса');
        }
    } catch (error) {
        console.warn('⚠️ Ошибка соединения с сервером:', error);
        const fallbackChallenges = CHALLENGES_LIST.map(ch => ({
            ...ch,
            progress: 0,
            level: 0,
            totalReward: 0,
            isCompleted: false
        }));
        renderChallenges(fallbackChallenges, 0, '⚠️ Нет соединения с сервером');
    }

    // ===== КНОПКИ =====
    document.getElementById('backBtnChallenges').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    document.getElementById('backBtnChallenges').addEventListener('touchend', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    document.getElementById('soundToggleChallenges').addEventListener('click', function() {
        if (typeof toggleSound === 'function') toggleSound();
    });
    document.getElementById('soundToggleChallenges').addEventListener('touchend', function(e) {
        e.preventDefault();
        if (typeof toggleSound === 'function') toggleSound();
    });
});

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderChallenges(challenges, totalReward, warning) {
    const tbody = document.getElementById('challengesBody');
    const totalDisplay = document.getElementById('totalRewardsDisplay');
    
    totalDisplay.textContent = `💎 ${totalReward || 0}`;
    
    if (!challenges || challenges.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="challenges-empty">${warning || '📭 Нет испытаний'}</td></tr>`;
        return;
    }
    
    let html = '';
    let index = 1;
    
    for (const ch of challenges) {
        const target = Math.floor(ch.targetBase * Math.pow(ch.targetMultiplier, ch.level || 0));
        const progress = ch.progress || 0;
        const progressPercent = Math.min((progress / target) * 100, 100);
        
        let barColor = '#ff6b6b';
        if (ch.level >= 3) barColor = '#6bff9d';
        else if (ch.level >= 2) barColor = '#6bcfff';
        else if (ch.level >= 1) barColor = '#ffcc00';
        
        html += `
            <tr>
                <td>${index}</td>
                <td>${ch.icon}</td>
                <td><strong>${ch.name}</strong></td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${progressPercent}%; background: ${barColor};"></div>
                        </div>
                        <span class="progress-text">${progress}/${target}</span>
                    </div>
                </td>
                <td>💎 ${ch.totalReward || 0}</td>
                <td>${ch.level || 0}</td>
            </tr>
        `;
        index++;
    }
    
    if (warning) {
        html = `<tr><td colspan="6" class="challenges-empty" style="color:#ffcc00;">${warning}</td></tr>` + html;
    }
    
    tbody.innerHTML = html;
}