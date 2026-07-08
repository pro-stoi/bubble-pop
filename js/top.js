document.addEventListener('DOMContentLoaded', function() {
    // ===== СОСТОЯНИЕ =====
    let players = [];
    let sortField = 'score';
    let sortDirection = 'desc';
    let myId = null;
    const LIMIT = 20;

    // ===== ЭЛЕМЕНТЫ =====
    const tbody = document.getElementById('topBody');
    const myRankRow = document.getElementById('myRankRow');

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    function getMedal(place) {
        if (place === 1) return '🥇';
        if (place === 2) return '🥈';
        if (place === 3) return '🥉';
        return place;
    }

    function getMyId() {
        // Пробуем из VK
        if (window.vk && window.vk.dbUserId) {
            return parseInt(window.vk.dbUserId);
        }
        if (window.vk && window.vk.userId) {
            return parseInt(window.vk.userId);
        }
        // Пробуем из localStorage
        const saved = localStorage.getItem('bubbleUserId');
        if (saved) {
            return parseInt(saved);
        }
        return null;
    }

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async function loadData() {
        try {
            let data = [];

            // Пытаемся загрузить с сервера
            if (window.vk && typeof window.vk.getGlobalTop === 'function') {
                try {
                    data = await window.vk.getGlobalTop();
                    console.log('📊 Загружено с сервера:', data ? data.length : 0);
                } catch (e) {
                    console.warn('Ошибка загрузки с сервера:', e);
                }
            }

            // Если с сервера ничего нет - берём локально
            if (!data || data.length === 0) {
                data = JSON.parse(localStorage.getItem('globalTop') || '[]');
                console.log('📊 Загружено из localStorage:', data.length);
            }

            // Нормализуем данные
            players = data.map(item => ({
                user_id: parseInt(item.user_id || item.userId || 0),
                user_name: item.user_name || item.userName || 'Игрок',
                score: parseInt(item.score || 0),
                maxCombo: parseInt(item.max_combo || item.maxCombo || 0),
                challengePoints: parseInt(item.challenge_points || item.challengePoints || 0)
            }));

            // Сортируем
            sortPlayers();

            // Рендерим
            renderTop();

        } catch (error) {
            console.error('Ошибка загрузки топа:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">❌ Ошибка загрузки</td></tr>';
        }
    }

    // ===== СОРТИРОВКА =====
    function sortPlayers() {
        players.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // ===== ПОИСК МЕНЯ =====
    function findMe() {
        myId = getMyId();
        if (!myId) return null;
        
        const index = players.findIndex(p => p.user_id === myId);
        if (index === -1) return null;
        
        return {
            place: index + 1,
            ...players[index]
        };
    }

    // ===== РЕНДЕРИНГ =====
    function renderTop() {
        // 1. Моя строка
        renderMyRank();

        // 2. Таблица (первые 20)
        const top = players.slice(0, LIMIT);
        
        if (top.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
            return;
        }

        let html = '';
        top.forEach((p, index) => {
            const place = index + 1;
            const medal = getMedal(place);
            let rankClass = '';
            if (place === 1) rankClass = 'rank-1';
            else if (place === 2) rankClass = 'rank-2';
            else if (place === 3) rankClass = 'rank-3';

            const isMe = myId && p.user_id === myId;
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

        // Если я не в топе - добавляю отдельную строку
        const me = findMe();
        if (me && me.place > LIMIT) {
            html += `
                <tr class="current-user user-outside-top">
                    <td><span>${me.place}</span></td>
                    <td>${me.user_name} 👈</td>
                    <td>${me.score}</td>
                    <td>${me.maxCombo}</td>
                    <td>${me.challengePoints}</td>
                </tr>
            `;
        }

        tbody.innerHTML = html;

        // 3. Обновляем активный заголовок
        document.querySelectorAll('.top-table th').forEach(th => {
            th.classList.remove('active');
            const field = th.dataset.sort;
            if (field === sortField) {
                th.classList.add('active');
            }
        });
    }

    // ===== МОЯ СТРОКА =====
    function renderMyRank() {
        const me = findMe();

        if (!me) {
            if (myId) {
                myRankRow.innerHTML = `
                    <div class="my-not-in-top">🎯 Вы пока не в топе. Сыграйте несколько игр!</div>
                `;
            } else {
                myRankRow.innerHTML = `
                    <div class="my-rank-loading">👤 Загрузка данных...</div>
                `;
            }
            return;
        }

        const medal = getMedal(me.place);
        let placeClass = '';
        if (me.place === 1) placeClass = 'gold';
        else if (me.place === 2) placeClass = 'silver';
        else if (me.place === 3) placeClass = 'bronze';

        myRankRow.innerHTML = `
            <div class="my-rank-content">
                <span class="place ${placeClass}">${medal}</span>
                <span class="name">${me.user_name} 👈</span>
                <span class="score">${me.score}</span>
                <span class="combo">${me.maxCombo}</span>
                <span class="bonus">${me.challengePoints}</span>
            </div>
        `;
    }

    // ===== СОРТИРОВКА ПО ЗАГОЛОВКАМ =====
    function handleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = field === 'name' ? 'asc' : 'desc';
        }
        sortPlayers();
        renderTop();
    }

    // ===== ОБРАБОТЧИКИ =====
    document.querySelectorAll('.top-table th').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.dataset.sort;
            if (field) handleSort(field);
        });
        th.addEventListener('touchend', function(e) {
            e.preventDefault();
            const field = this.dataset.sort;
            if (field) handleSort(field);
        });
    });

    // ===== НАВИГАЦИЯ =====
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
    // Ждём немного, чтобы VK успел инициализироваться
    setTimeout(() => {
        myId = getMyId();
        console.log('👤 Мой ID:', myId);
        loadData();
    }, 500);
});
