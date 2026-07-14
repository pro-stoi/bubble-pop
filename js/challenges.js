// js/challenges.js

// ===== НОВЫЙ СПИСОК ИСПЫТАНИЙ =====
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

// ===== ФУНКЦИЯ ПОЛУЧЕНИЯ ЗНАЧЕНИЯ ПО ПУТИ =====
function getValueByPath(obj, path) {
    // ===== ЕСЛИ ЭТО JSONB ОБЪЕКТ, БЕРЁМ value =====
    if (obj && obj.type === 'jsonb' && obj.value) {
        obj = obj.value;
    }
    
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
        // Если текущее значение — JSONB объект, берём value
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

// ===== РАСЧЁТ УРОВНЯ И НАГРАДЫ =====
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
        const response = await fetch(`https://neurodrone-arena.ru/api/bubble/stats/${userId}`);
        const data = await response.json();
        
if (data.success) {
    let stats = data;
    
    // ===== ПРЕОБРАЗУЕМ ВСЕ JSONB ПОЛЯ =====
    if (stats.bonus_earned && stats.bonus_earned.value) {
        if (typeof stats.bonus_earned.value === 'string') {
            stats.bonus_earned = JSON.parse(stats.bonus_earned.value);
        } else {
            stats.bonus_earned = stats.bonus_earned.value;
        }
    }
    if (stats.bonus_used && stats.bonus_used.value) {
        if (typeof stats.bonus_used.value === 'string') {
            stats.bonus_used = JSON.parse(stats.bonus_used.value);
        } else {
            stats.bonus_used = stats.bonus_used.value;
        }
    }
    if (stats.color_pops && stats.color_pops.value) {
        if (typeof stats.color_pops.value === 'string') {
            stats.color_pops = JSON.parse(stats.color_pops.value);
        } else {
            stats.color_pops = stats.color_pops.value;
        }
    }
    if (stats.challenge_progress && stats.challenge_progress.value) {
        if (typeof stats.challenge_progress.value === 'string') {
            stats.challenge_progress = JSON.parse(stats.challenge_progress.value);
        } else {
            stats.challenge_progress = stats.challenge_progress.value;
        }
    }
    
    // ===== ПРОВЕРКА ПОСЛЕ ПРЕОБРАЗОВАНИЯ =====
  
    
    const challengesWithProgress = CHALLENGES_LIST.map(ch => {
        const progress = getValueByPath(stats, ch.field);
        const result = calculateChallenge(progress, ch.targetBase, ch.baseReward);
        
        return {
            ...ch,
            progress: progress,
            level: result.level,
            progressInLevel: result.progressInLevel,
            targetForLevel: result.targetForLevel,
            totalReward: result.totalReward
        };
    });
    
    const totalReward = challengesWithProgress.reduce((sum, ch) => sum + ch.totalReward, 0);
    renderChallenges(challengesWithProgress, totalReward);
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
    
    totalDisplay.textContent = `💎 ${totalReward || 0}`;
    
    if (!challenges || challenges.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="challenges-empty">📭 Нет испытаний</td></tr>`;
        return;
    }
    
    let html = '';
    let index = 1;
    
    for (const ch of challenges) {
        const progressInLevel = ch.progressInLevel || 0;
        const targetForLevel = ch.targetForLevel || ch.targetBase;
        const progressPercent = Math.min((progressInLevel / targetForLevel) * 100, 100);
        
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