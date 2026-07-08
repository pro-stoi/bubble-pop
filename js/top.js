document.addEventListener('DOMContentLoaded', function() {
    var tbody = document.getElementById('topBody');
    var myRankRow = document.getElementById('myRankRow');
    var SERVER_URL = 'https://neurodrone-arena.ru/api/bubble';
    
    var players = [];
    var sortField = 'score';
    var sortDir = 'desc';
    var myId = null;

    // ===== СООТВЕТСТВИЕ ПОЛЕЙ =====
    var fieldMap = {
        'rank': 'score',      // по умолчанию сортируем по очкам
        'name': 'user_name',
        'score': 'score',
        'combo': 'maxCombo',
        'bonus': 'challengePoints'
    };

    function getMedal(place) {
        if (place === 1) return '🥇';
        if (place === 2) return '🥈';
        if (place === 3) return '🥉';
        return place;
    }

    function findMyId(playersList) {
        var savedId = localStorage.getItem('bubbleUserId');
        if (savedId) {
            var id = parseInt(savedId);
            for (var i = 0; i < playersList.length; i++) {
                if (parseInt(playersList[i].user_id) === id) {
                    return id;
                }
            }
        }
        
        if (window.vk && window.vk.dbUserId) {
            var id = parseInt(window.vk.dbUserId);
            for (var i = 0; i < playersList.length; i++) {
                if (parseInt(playersList[i].user_id) === id) {
                    return id;
                }
            }
        }
        
        var myName = localStorage.getItem('username');
        if (myName) {
            for (var i = 0; i < playersList.length; i++) {
                if (playersList[i].user_name === myName) {
                    var id = parseInt(playersList[i].user_id);
                    localStorage.setItem('bubbleUserId', String(id));
                    return id;
                }
            }
        }
        
        for (var i = 0; i < playersList.length; i++) {
            if (playersList[i].user_name !== 'Игрок' && playersList[i].user_name !== '') {
                var id = parseInt(playersList[i].user_id);
                localStorage.setItem('bubbleUserId', String(id));
                return id;
            }
        }
        
        if (playersList.length > 0) {
            var id = parseInt(playersList[0].user_id);
            localStorage.setItem('bubbleUserId', String(id));
            return id;
        }
        
        return null;
    }

    function render() {
        if (!players || players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
            myRankRow.innerHTML = '<span class="not-in-top">🎯 Сыграйте первую игру!</span>';
            return;
        }

        // Получаем имя поля для сортировки
        var sortFieldName = fieldMap[sortField] || 'score';

        // Копируем и сортируем
        var sorted = players.slice();
        sorted.sort(function(a, b) {
            var va = a[sortFieldName];
            var vb = b[sortFieldName];
            
            // Для строк - приводим к нижнему регистру
            if (typeof va === 'string') {
                va = va.toLowerCase();
                vb = vb.toLowerCase();
            }
            
            // Для чисел
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        // Если ID ещё не определён - определяем
        if (myId === null) {
            myId = findMyId(sorted);
        }

        // Находим пользователя
        var myIndex = -1;
        if (myId) {
            for (var i = 0; i < sorted.length; i++) {
                if (parseInt(sorted[i].user_id) === parseInt(myId)) {
                    myIndex = i;
                    break;
                }
            }
        }

        // === СТРОКА ПОЛЬЗОВАТЕЛЯ ===
        if (!myId || myIndex === -1) {
            myRankRow.innerHTML = '<span class="not-in-top">🎯 Вы пока не в топе. Сыграйте несколько игр!</span>';
        } else {
            var p = sorted[myIndex];
            var place = myIndex + 1;
            var medal = getMedal(place);
            var placeColor = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '';
            myRankRow.innerHTML = 
                '<div class="rank-data">' +
                    '<span class="medal">' + medal + '</span>' +
                    '<span class="place-text ' + placeColor + '">#' + place + '</span>' +
                    '<span class="player-name">' + p.user_name + '</span>' +
                    '<span class="stat">💎 <strong>' + p.score + '</strong></span>' +
                    '<span class="stat">🔥 <strong>' + p.maxCombo + '</strong></span>' +
                    '<span class="stat">⭐ <strong>' + p.challengePoints + '</strong></span>' +
                '</div>';
        }

        // === ТАБЛИЦА ===
        var top20 = sorted.slice(0, 20);
        var html = '';

        for (var j = 0; j < top20.length; j++) {
            var p = top20[j];
            var place = j + 1;
            var medal = getMedal(place);
            var rankClass = place === 1 ? 'rank-1' : place === 2 ? 'rank-2' : place === 3 ? 'rank-3' : '';
            var isMe = myId && parseInt(p.user_id) === parseInt(myId);
            var rowClass = isMe ? 'current-user' : '';

            html += '<tr class="' + rowClass + '">' +
                '<td><span class="' + rankClass + '">' + medal + '</span></td>' +
                '<td>' + p.user_name + (isMe ? ' 👈' : '') + '</td>' +
                '<td>' + p.score + '</td>' +
                '<td>' + p.maxCombo + '</td>' +
                '<td>' + p.challengePoints + '</td>' +
            '</tr>';
        }

        // Если пользователь не в топ-20
        if (myId && myIndex >= 20) {
            var p = sorted[myIndex];
            html += '<tr class="user-outside">' +
                '<td>' + (myIndex + 1) + '</td>' +
                '<td>' + p.user_name + ' 👈</td>' +
                '<td>' + p.score + '</td>' +
                '<td>' + p.maxCombo + '</td>' +
                '<td>' + p.challengePoints + '</td>' +
            '</tr>';
        }

        tbody.innerHTML = html;

        // Подсветка активного заголовка
        var ths = document.querySelectorAll('.top-table th.sortable');
        for (var k = 0; k < ths.length; k++) {
            ths[k].classList.remove('active');
            if (ths[k].getAttribute('data-sort') === sortField) {
                ths[k].classList.add('active');
            }
        }
    }

    function loadData() {
        fetch(SERVER_URL + '/top')
            .then(function(res) {
                if (!res.ok) throw new Error('Ошибка сервера');
                return res.json();
            })
            .then(function(data) {
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
                    myRankRow.innerHTML = '<span class="not-in-top">🎯 Сыграйте первую игру!</span>';
                    return;
                }
                players = data.map(function(item) {
                    return {
                        user_id: parseInt(item.user_id || 0),
                        user_name: item.user_name || 'Игрок',
                        score: parseInt(item.score || 0),
                        maxCombo: parseInt(item.max_combo || 0),
                        challengePoints: parseInt(item.challenge_points || 0)
                    };
                });
                render();
            })
            .catch(function(err) {
                tbody.innerHTML = '<tr><td colspan="5" class="top-empty">❌ Ошибка загрузки</td></tr>';
                myRankRow.innerHTML = '<span class="not-in-top">❌ Ошибка загрузки</span>';
            });
    }

    // ===== СОРТИРОВКА =====
    var ths = document.querySelectorAll('.top-table th.sortable');
    for (var i = 0; i < ths.length; i++) {
        ths[i].addEventListener('click', function() {
            var field = this.getAttribute('data-sort');
            if (sortField === field) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDir = field === 'name' ? 'asc' : 'desc';
            }
            render();
        });
        ths[i].addEventListener('touchend', function(e) {
            e.preventDefault();
            var field = this.getAttribute('data-sort');
            if (sortField === field) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDir = field === 'name' ? 'asc' : 'desc';
            }
            render();
        });
    }

    // ===== КНОПКИ =====
    document.getElementById('backMenuBtn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    document.getElementById('backMenuBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    document.getElementById('soundToggleTop').addEventListener('click', function() {
        if (typeof toggleSound === 'function') toggleSound();
    });
    document.getElementById('soundToggleTop').addEventListener('touchend', function(e) {
        e.preventDefault();
        if (typeof toggleSound === 'function') toggleSound();
    });

    // ===== ЗАПУСК =====
    loadData();
});
