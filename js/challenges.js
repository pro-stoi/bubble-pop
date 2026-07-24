// js/challenges.js

// ===== НОВЫЙ СПИСОК ИСПЫТАНИЙ (ЗАПАСНОЙ) =====
const CHALLENGES_LIST = [
    { id: 1, name: 'Лопни пузырьки', icon: '💥', baseReward: 10, targetBase: 10, field: 'total_popped' },
    { id: 2, name: 'Лопни подряд (комбо)', icon: '🔥', baseReward: 15, targetBase: 5, field: 'max_combo' },
    { id: 3, name: 'Лопни красные', icon: '🔴', baseReward: 10, targetBase: 8, field: 'color_pops.red' },
    { id: 4, name: 'Лопни жёлтые', icon: '🟡', baseReward: 10, targetBase: 8, field: 'color_pops.yellow' },
    { id: 5, name: 'Лопни зелёные', icon: '🟢', baseReward: 10, targetBase: 8, field: 'color_pops.green' },
    { id: 6, name: 'Лопни синие', icon: '🔵', baseReward: 10, targetBase: 8, field: 'color_pops.blue' },
    { id: 7, name: 'Лопни фиолетовые', icon: '🟣', baseReward: 10, targetBase: 8, field: 'color_pops.pink' },
    { id: 8, name: 'Собери все 5 бонусов', icon: '🌈', baseReward: 25, targetBase: 3, field: 'color_set_count' },
    { id: 9, name: 'Собери красный бонус', icon: '🐢', baseReward: 20, targetBase: 3, field: 'bonus_earned.slow' },
    { id: 10, name: 'Собери жёлтый бонус', icon: '🧲', baseReward: 20, targetBase: 3, field: 'bonus_earned.magnet' },
    { id: 11, name: 'Собери зелёный бонус', icon: '🎯', baseReward: 20, targetBase: 3, field: 'bonus_earned.explosion' },
    { id: 12, name: 'Собери синий бонус', icon: '⚡', baseReward: 20, targetBase: 3, field: 'bonus_earned.multiplier' },
    { id: 13, name: 'Собери фиолетовый бонус', icon: '💥', baseReward: 20, targetBase: 3, field: 'bonus_earned.clear' }
];

function getValueByPath(obj, path) {
    if (obj && obj.type === 'jsonb' && obj.value) {
        obj = obj.value;
    }
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
        if (value && value.type === 'jsonb' && value.value) {
            value = value.value;
        }
        if (value && typeof value === 'object' && part in value) {
            value = value[part];
        } else {
            return 0;
        }
    }
    return value || 0;
}

function calculateChallenge(progress, targetBase, baseReward) {
    let level = 0;
    let remaining = progress;
    let currentTarget = targetBase;
    let totalReward = 0;
    while (remaining >= currentTarget) {
        remaining -= currentTarget;
        level++;
        totalReward += baseReward * level;
        currentTarget += targetBase;
    }
    return {
        level: level,
        progressInLevel: remaining,
        targetForLevel: currentTarget,
        totalReward: totalReward
    };
}

document.addEventListener('DOMContentLoaded', async function() {
    let userId = localStorage.getItem('bubbleUserId');
    
    if (!userId && window.vk && window.vk.dbUserId) {
        userId = window.vk.dbUserId;
        localStorage.setItem('bubbleUserId', String(userId));
    }
    
    if (!userId) {
        userId = 2;
        localStorage.setItem('bubbleUserId', '2');
    }

    try {
        const response = await fetch(`https://neurodrone-arena.ru/api/bubble/challenges/${userId}`);
        const data = await response.json();

        if (data.success) {
            const serverChallenges = data.challenges || [];
            const totalReward = data.totalReward || 0;
            
            // ===== ОБЪЕДИНЯЕМ ЛОКАЛЬНЫЙ СПИСОК (13) С ДАННЫМИ С СЕРВЕРА =====
            const challengesWithProgress = CHALLENGES_LIST.map(localCh => {
                const serverCh = serverChallenges.find(s => s.id === localCh.id);
                return {
                    ...localCh,
                    progress: serverCh ? serverCh.progress : 0,
                    level: serverCh ? serverCh.level : 0,
                    totalReward: serverCh ? serverCh.totalReward : 0,
                    progressInLevel: serverCh ? serverCh.progress : 0,
                    targetForLevel: serverCh ? serverCh.targetBase : localCh.targetBase
                };
            });
            
            // Пересчитываем общую награду
            const total = challengesWithProgress.reduce((sum, ch) => sum + ch.totalReward, 0);
            renderChallenges(challengesWithProgress, total);
        } else {
            const fallbackChallenges = CHALLENGES_LIST.map(ch => ({
                ...ch,
                progress: 0,
                level: 0,
                targetForLevel: ch.targetBase,
                progressInLevel: 0,
                totalReward: 0
            }));
            renderChallenges(fallbackChallenges, 0);
        }
    } catch (error) {
        console.warn('⚠️ Ошибка загрузки испытаний:', error);
        const fallbackChallenges = CHALLENGES_LIST.map(ch => ({
            ...ch,
            progress: 0,
            level: 0,
            targetForLevel: ch.targetBase,
            progressInLevel: 0,
            totalReward: 0
        }));
        renderChallenges(fallbackChallenges, 0);
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

function renderChallenges(challenges, totalReward) {
    const tbody = document.getElementById('challengesBody');
    const totalDisplay = document.getElementById('totalRewardsDisplay');
    
    totalDisplay.textContent = `⭐ ${totalReward || 0}`;
    
    if (!challenges || challenges.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="challenges-empty">📭 Нет испытаний</td></tr>`;
        return;
    }
    
    let html = '';
    let index = 1;
    
    for (const ch of challenges) {
        const progressInLevel = ch.progressInLevel || 0;
        const targetForLevel = ch.targetForLevel || ch.targetBase || 10;
        const progressPercent = Math.min((progressInLevel / targetForLevel) * 100, 100);
        
        let barColor = '#ff6b6b';
        if (ch.level >= 3) barColor = '#6bff9d';
        else if (ch.level >= 2) barColor = '#6bcfff';
        else if (ch.level >= 1) barColor = '#ffcc00';
        
        html += `
            <tr>
                <td>${index}</td>
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
        index++;
    }
    
    tbody.innerHTML = html;
}
