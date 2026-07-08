document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('topBody');
    const myRankRow = document.getElementById('myRankRow');
    const SERVER_URL = 'https://neurodrone-arena.ru/api/bubble';

    function getMedal(place) {
        if (place === 1) return '🥇';
        if (place === 2) return '🥈';
        if (place === 3) return '🥉';
        return place;
    }

    function getMyId() {
        if (window.vk && window.vk.dbUserId) {
            return parseInt(window.vk.dbUserId);
        }
        if (window.vk && window.vk.userId) {
            return parseInt(window.vk.userId);
        }
        const saved = localStorage.getItem('bubbleUserId');
        if (saved) {
            return parseInt(saved);
        }
        return null;
    }

    function renderMyRank(players, myId) {
        // Если ID нет - показываем загрузку
        if (!myId) {
            myRankRow.innerHTML = `
                <div class="rank-data">
                    <span class="not-in-top">👤 Загрузка данных пользователя...</span>
                </div>
            `;
            return;
        }

        // Ищем пользователя в списке
        const index = players.findIndex(p => parseInt(p.user_id) === myId);
        
        // Если не найден - показываем сообщение
        if (index === -1) {
            myRankRow.innerHTML = `
                <div class="rank-data">
                    <span class="not-in-top">🎯 Вы пока не в топе. Сыграйте несколько игр!</span>
                </div>
            `;
            return;
        }

        // Нашли - показываем данные
        const player = players[index];
        const place = index + 1;
        const medal = getMedal(place);

        let placeClass = '';
        if (place === 1) placeClass = 'gold';
        else if (place === 2) placeClass = 'silver';
        else if (place === 3) placeClass = 'bronze';

        myRankRow.innerHTML = `
            <div class="rank-data">
                <span class="medal">${medal}</span>
                <span class="place-text ${placeClass}">#${place}</span>
                <span class="player-name">${player.user_name}</span>
                <span class="stat">💎 <strong>${player.score}</strong></span>
                <span class="stat">🔥 <strong>${player.maxCombo}</strong></span>
                <span class="stat">⭐ <strong>${player.challengePoints}</strong></span>
            </div>
        `;
    }

    async function loadTop() {
        try {
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">⏳ Загрузка...</td></tr>';
            myRankRow.innerHTML = `
                <div class="rank-data">
                    <span class="not-in-top">⏳ Загрузка данных...</span>
                </div>
            `;

            const response = await fetch(SERVER_URL + '/top');
            
            if (!response.ok) {
                throw new Error('Ошибка сервера');
            }
            
            const data = await response.json();
            console.log('📊 Получено записей:', data ? data.length : 0);

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
                myRankRow.innerHTML = `
                    <div class="rank-data">
                        <span class="not-in-top">🎯 Сыграйте первую игру!</span>
                    </div>
                `;
                return;
            }

            const players = data.map(item => ({
                user_id: parseInt(item.user_id || 0),
                user_name: item.user_name || 'Игрок',
                score: parseInt(item.score || 0),
                maxCombo: parseInt(item.max_combo || 0),
                challengePoints: parseInt(item.challenge_points || 0)
            }));

            // Сортируем по очкам
            players.sort((a, b) => b.score - a.score);

            const myId = getMyId();
            console.log('👤 Мой ID:', myId);

            // Рендерим строку с моим местом
            renderMyRank(players, myId);

            // Рендерим таблицу (топ-20)
            const top20 = players.slice(0, 20);
            
            let html = '';
            top20.forEach((p, index) => {
                const place = index + 1;
                const medal = getMedal(place);
                let rankClass = '';
                if (place === 1) rankClass = 'rank-1';
                else if (place === 2) rankClass = 'rank-2';
                else if (place === 3) rankClass = 'rank-3';

                const isMe = myId && parseInt(p.user_id) === myId;
                const rowClass = isMe ? 'current-user' : '';

                html += `
                    <tr class="${rowClass}">
                        <td><span class="${rankClass}">${medal}</span></td>
                        <td>${p.user_name} ${isMe ? '👈' : ''}</td>
                        <td>${p.score}</td>
                        <td>${p.maxCombo}</td>
                        <td>${p.challengePoints}</td>
                    </tr>
                `;
            });

            // Если я не в топ-20 - добавляю отдельную строку
            const myIndex = players.findIndex(p => parseInt(p.user_id) === myId);
            if (myId && myIndex >= 20) {
                const p = players[myIndex];
                const place = myIndex + 1;
                html += `
                    <tr class="user-outside">
                        <td>${place}</td>
                        <td>${p.user_name} 👈</td>
                        <td>${p.score}</td>
                        <td>${p.maxCombo}</td>
                        <td>${p.challengePoints}</td>
                    </tr>
                `;
            }

            tbody.innerHTML = html;

        } catch (error) {
            console.error('Ошибка загрузки топа:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">❌ Ошибка загрузки</td></tr>';
            myRankRow.innerHTML = `
                <div class="rank-data">
                    <span class="not-in-top">❌ Ошибка загрузки</span>
                </div>
            `;
        }
    }

    // ===== КНОПКИ =====
    document.getElementById('backMenuBtn').addEventListener('click', () => goTo('index.html'));
    document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        goTo('index.html');
    });

    document.getElementById('soundToggleTop').addEventListener('click', () => toggleSound());
    document.getElementById('soundToggleTop').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== ЗАПУСК =====
    loadTop();
});
