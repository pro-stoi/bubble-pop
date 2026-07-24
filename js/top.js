document.addEventListener('DOMContentLoaded', function() {
    var tbody = document.getElementById('topBody');
    var myRankRow = document.getElementById('myRankRow');
    var SERVER_URL = 'https://neurodrone-arena.ru/api/bubble';
    
    var players = [];
    var sortField = 'score';
    var sortDir = 'desc';
    var myId = null;

    // ===== ЗАГРУЗКА СТАТИСТИКИ =====
    const userId = localStorage.getItem('bubbleUserId');
    if (userId) {
        statsManager.load(parseInt(userId));
    }

    var fieldMap = {
        'rank': 'score',
        'name': 'user_name',
        'score': 'score',
        'combo': 'max_combo',
        'bonus': 'challenge_points'
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

        var sortFieldName = fieldMap[sortField] || 'score';

        var sorted = players.slice();
        sorted.sort(function(a, b) {
            var va = a[sortFieldName];
            var vb = b[sortFieldName];
            
            if (typeof va === 'string') {
                va = va.toLowerCase();
                vb = vb.toLowerCase();
            }
            
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        if (myId === null) {
            myId = findMyId(sorted);
        }

        var myIndex = -1;
        if (myId) {
            for (var i = 0; i < sorted.length; i++) {
                if (parseInt(sorted[i].user_id) === parseInt(myId)) {
                    myIndex = i;
                    break;
                }
            }
        }

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
                    '<span class="stat">🔥 <strong>' + p.max_combo + '</strong></span>' +
                    '<span class="stat">⭐ <strong>' + p.challenge_points + '</strong></span>' +
                '</div>';
        }

        var top100 = sorted.slice(0, 100);
        var html = '';

     for (var j = 0; j < top100.length; j++) {
    var p = top100[j];
    var place = j + 1;
    var medal = getMedal(place);
    var rankClass = place === 1 ? 'rank-1' : place === 2 ? 'rank-2' : place === 3 ? 'rank-3' : '';
    var isMe = myId && parseInt(p.user_id) === parseInt(myId);
    var rowClass = isMe ? 'current-user' : '';

    html += '<tr class="' + rowClass + '">' +
        '<td><span class="' + rankClass + '">' + medal + '</span></td>' +
        '<td>' + p.user_name + (isMe ? ' 👈' : '') + '</td>' +
        '<td>' + p.score + '</td>' +
        '<td>' + p.max_combo + '</td>' +
        '<td>' + p.challenge_points + '</td>' +
    '</tr>';
}

if (myId && myIndex >= 100) {
    var p = sorted[myIndex];
    html += '<tr class="user-outside">' +
        '<td>' + (myIndex + 1) + '</td>' +
        '<td>' + p.user_name + ' 👈</td>' +
        '<td>' + p.score + '</td>' +
        '<td>' + p.max_combo + '</td>' +
        '<td>' + p.challenge_points + '</td>' +
    '</tr>';
}

        tbody.innerHTML = html;

        var ths = document.querySelectorAll('.top-table th.sortable');
        for (var k = 0; k < ths.length; k++) {
            ths[k].classList.remove('active');
            if (ths[k].getAttribute('data-sort') === sortField) {
                ths[k].classList.add('active');
            }
        }
             try {
        localStorage.setItem('cachedTop', JSON.stringify(players));
    } catch(e) {}
    }

function loadData() {
    // ===== ПОКАЗЫВАЕМ ЗАГРУЗКУ =====
    tbody.innerHTML = '<tr><td colspan="5" class="top-empty">⏳ Загрузка...</td></tr>';
    myRankRow.innerHTML = '<span class="not-in-top">⏳ Загрузка...</span>';
    
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
                    max_combo: parseInt(item.max_combo || 0),
                    challenge_points: parseInt(item.challenge_points || 0)
                };
            });
            render();
        })
        .catch(function(err) {
            // ===== ЗАГЛУШКА ПРИ ОШИБКЕ =====
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="top-empty" style="color:#ffcc00;padding:30px 20px;">
                        ⚠️ Сервер временно недоступен<br>
                        <span style="font-size:12px;color:rgba(255,255,255,0.3);">
                            Данные будут загружены позже
                        </span>
                    </td>
                </tr>
            `;
            myRankRow.innerHTML = `
                <span class="not-in-top" style="color:#ffcc00;">
                    ⚠️ Нет соединения с сервером
                </span>
            `;
            
            // ===== ПЫТАЕМСЯ ЗАГРУЗИТЬ ИЗ КЭША =====
            try {
                const cached = localStorage.getItem('cachedTop');
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    if (cachedData && cachedData.length > 0) {
                        players = cachedData;
                        render();
                        // Показываем, что данные из кэша
                        tbody.innerHTML += `
                            <tr>
                                <td colspan="5" style="text-align:center;font-size:11px;color:rgba(255,255,255,0.2);padding:4px;">
                                    📦 Данные из кэша
                                </td>
                            </tr>
                        `;
                    }
                }
            } catch(e) {}
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
