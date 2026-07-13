// js/challenges.js

document.addEventListener('DOMContentLoaded', () => {
    // ===== НАВИГАЦИЯ =====
    document.getElementById('backBtnChallenges').addEventListener('click', () => {
        goTo('index.html');
    });
    document.getElementById('backBtnChallenges').addEventListener('touchend', (e) => {
        e.preventDefault();
        goTo('index.html');
    });

    // ===== ЗВУК =====
    document.getElementById('soundToggleChallenges').addEventListener('click', () => {
        toggleSound();
    });
    document.getElementById('soundToggleChallenges').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== РЕНДЕРИНГ ТАБЛИЦЫ =====
    window.renderChallenges = function() {
        const tbody = document.getElementById('challengesBody');
        const challenges = challengeTracker.getChallenges();
        const totalRewards = challengeTracker.getTotalRewards();

        // Обновляем отображение наград в шапке
        document.getElementById('totalRewardsDisplay').textContent = '💎 ' + totalRewards;

        if (!challenges || challenges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="challenges-empty">🎯 Нет испытаний</td></tr>';
            return;
        }

        let html = '';
        challenges.forEach((ch, index) => {
            const progress = Math.min(100, (ch.current / ch.target) * 100);
            const isCompleted = ch.isCompleted || ch.current >= ch.target;
            const rowClass = isCompleted ? 'completed' : '';
            const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : (index + 1);

            // Награда
            const displayReward = ch.totalReward > 0 
                ? '<span style="color:#44ff44;">' + ch.totalReward + ' 💎</span>'
                : '0 💎';

            html += `
                <tr class="${rowClass}">
                    <td>${medal}</td>
                    <td>${ch.icon}</td>
                    <td class="challenge-name">${ch.name}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${progress}%;"></div>
                            </div>
                            <span class="progress-text">${Math.round(progress)}%</span>
                        </div>
                    </td>
                    <td>${displayReward}</td>
                    <td>${isCompleted ? '✅' : '⭐ ' + (ch.level + 1)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    };

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async function loadChallenges() {
        const userId = localStorage.getItem('bubbleUserId');
        if (!userId) {
            console.warn('⚠️ Пользователь не авторизован');
            return;
        }

        await challengeTracker.loadFromServer(parseInt(userId));
    }

    // ===== ПЕРВЫЙ РЕНДЕР =====
    loadChallenges();
});
