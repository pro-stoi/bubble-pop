document.addEventListener('DOMContentLoaded', () => {
    let topData = [];
    let currentSort = { field: 'score', direction: 'desc' };
    let isLoading = true;
    let currentUserId = null;
    const TOP_LIMIT = 20;

    function getMedal(place) {
        if (place === 1) return '🥇';
        if (place === 2) return '🥈';
        if (place === 3) return '🥉';
        return place;
    }

    // ===== ПОЛУЧИТЬ ID ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (улучшенная версия) =====
    function getCurrentUserId() {
        // 1. Пробуем из глобального объекта vk
        if (window.vk) {
            if (window.vk.dbUserId) {
                console.log('✅ ID из vk.dbUserId:', window.vk.dbUserId);
                return window.vk.dbUserId;
            }
            if (window.vk.userId) {
                console.log('✅ ID из vk.userId:', window.vk.userId);
                return window.vk.userId;
            }
        }
        
        // 2. Пробуем из localStorage
        const savedId = localStorage.getItem('bubbleUserId');
        if (savedId) {
            console.log('✅ ID из localStorage:', savedId);
            return parseInt(savedId);
        }
        
        console.warn('⚠️ Не удалось определить ID пользователя');
        return null;
    }

    // ===== ДОЖИДАЕМСЯ ИНИЦИАЛИЗАЦИИ VK =====
    function waitForVK(callback, attempts = 0) {
        // Если vk уже есть и есть userId или dbUserId
        if (window.vk && (window.vk.dbUserId || window.vk.userId)) {
            console.log('✅ VK готов, ID:', window.vk.dbUserId || window.vk.userId);
            callback();
            return;
        }
        
        // Если vk есть, но ещё нет ID - подписываемся на событие
        if (window.vk && typeof window.vk.onReady === 'function') {
            window.vk.onReady(callback);
            return;
        }
        
        // Если слишком много попыток - всё равно загружаем
        if (attempts > 30) {
            console.warn('⚠️ VK не инициализирован, загружаем без ID');
            callback();
            return;
        }
        
        // Ждём 200ms и пробуем снова
        setTimeout(() => {
            waitForVK(callback, attempts + 1);
        }, 200);
    }

    async function loadGlobalTop() {
        isLoading = true;
        const tbody = document.getElementById('topTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">⏳ Загрузка...</td></tr>';
        }
        
        try {
            if (window.vk && window.vk.getGlobalTop) {
                topData = await window.vk.getGlobalTop();
            } else {
                topData = JSON.parse(localStorage.getItem('globalTop') || '[]');
            }
            
            topData = topData.map(item => ({
                ...item,
                user_id: item.user_id || item.userId || 0,
                user_name: item.user_name || item.userName || 'Игрок',
                score: item.score || 0,
                maxCombo: item.max_combo || item.maxCombo || 0,
                challengePoints: item.challenge_points || item.challengePoints || 0
            }));
            
            // Получаем ID пользователя
            currentUserId = getCurrentUserId();
            console.log('👤 Текущий пользователь ID:', currentUserId);
            
            if (topData.length === 0) {
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
                }
                updateUserInfo(null);
                isLoading = false;
                return;
            }
            
            sortData();
            renderTop();
            
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки топа:', error);
            const localTop = JSON.parse(localStorage.getItem('globalTop') || '[]');
            if (localTop.length > 0) {
                topData = localTop;
                sortData();
                renderTop();
            } else {
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
                }
                updateUserInfo(null);
            }
        }
        
        isLoading = false;
    }

    function sortData() {
        const { field, direction } = currentSort;
        topData.sort((a, b) => {
            let valA = a[field];
            let valB = b[field];
            if (field === 'name') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function getUserInfo() {
        if (!currentUserId) return null;
        const index = topData.findIndex(item => {
            // Сравниваем как числа
            const itemId = parseInt(item.user_id);
            const userId = parseInt(currentUserId);
            return itemId === userId;
        });
        if (index === -1) return null;
        return {
            place: index + 1,
            ...topData[index]
        };
    }

    function updateUserInfo(userInfo) {
        const container = document.getElementById('userInfoRow');
        if (!container) return;
        
        if (!userInfo) {
            if (currentUserId) {
                container.innerHTML = `
                    <div class="user-not-in-top">🎯 Вы пока не в топе. Сыграйте несколько игр!</div>
                `;
            } else {
                container.innerHTML = `
                    <div class="user-info-placeholder">👤 Загрузка данных пользователя...</div>
                `;
            }
            return;
        }
        
        const place = userInfo.place;
        const medal = getMedal(place);
        let placeClass = '';
        if (place === 1) placeClass = 'gold';
        else if (place === 2) placeClass = 'silver';
        else if (place === 3) placeClass = 'bronze';
        
        container.innerHTML = `
            <div class="user-info-content">
                <span class="place ${placeClass}">${medal}</span>
                <span class="name">${userInfo.user_name || 'Игрок'} 👈</span>
                <span class="score">${userInfo.score || 0}</span>
                <span class="combo">${userInfo.maxCombo || 0}</span>
                <span class="bonus">${userInfo.challengePoints || 0}</span>
            </div>
        `;
    }

    function renderTop() {
        const tbody = document.getElementById('topTableBody');
        if (!tbody) return;
        
        const topList = topData.slice(0, TOP_LIMIT);
        const userInfo = getUserInfo();
        
        // Обновляем строку пользователя
        updateUserInfo(userInfo);
        
        if (topList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="top-empty">🎯 Сыграйте первую игру!</td></tr>';
            return;
        }
        
        // Обновляем активный заголовок
        document.querySelectorAll('.top-table th.sortable').forEach(th => {
            th.classList.remove('active', 'asc');
            const sortField = th.dataset.sort;
            if (sortField === currentSort.field) {
                th.classList.add('active');
                if (currentSort.direction === 'asc') {
                    th.classList.add('asc');
                }
            }
        });
        
        let html = '';
        topList.forEach((item, index) => {
            const place = index + 1;
            const medal = getMedal(place);
            let rankClass = '';
            if (place === 1) rankClass = 'rank-1';
            else if (place === 2) rankClass = 'rank-2';
            else if (place === 3) rankClass = 'rank-3';
            
            const userName = item.user_name || item.userName || 'Игрок';
            const score = item.score || 0;
            const maxCombo = item.maxCombo || 0;
            const challengePoints = item.challengePoints || 0;
            
            const isCurrentUser = currentUserId && parseInt(item.user_id) === parseInt(currentUserId);
            const rowClass = isCurrentUser ? 'current-user' : '';
            
            html += `
                <tr class="${rowClass}">
                    <td><span class="${rankClass}">${medal}</span></td>
                    <td>${userName} ${isCurrentUser ? '👈' : ''}</td>
                    <td>${score}</td>
                    <td>${maxCombo}</td>
                    <td>${challengePoints}</td>
                </tr>
            `;
        });
        
        // Если пользователь не в топ-20, показываем его отдельно внизу
        if (userInfo && userInfo.place > TOP_LIMIT) {
            const place = userInfo.place;
            const medal = getMedal(place);
            let rankClass = '';
            if (place === 1) rankClass = 'rank-1';
            else if (place === 2) rankClass = 'rank-2';
            else if (place === 3) rankClass = 'rank-3';
            
            html += `
                <tr class="current-user user-outside">
                    <td><span class="${rankClass}">${medal}</span></td>
                    <td>${userInfo.user_name || 'Игрок'} 👈</td>
                    <td>${userInfo.score || 0}</td>
                    <td>${userInfo.maxCombo || 0}</td>
                    <td>${userInfo.challengePoints || 0}</td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
    }

    // ===== СОРТИРОВКА ПО ЗАГОЛОВКАМ =====
    function sortBy(field) {
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = field === 'name' ? 'asc' : 'desc';
        }
        
        if (!isLoading && topData.length > 0) {
            sortData();
            renderTop();
        }
    }

    // ===== ОБРАБОТЧИКИ КЛИКОВ ПО ЗАГОЛОВКАМ =====
    document.querySelectorAll('.top-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (field) sortBy(field);
        });
        th.addEventListener('touchend', (e) => {
            e.preventDefault();
            const field = th.dataset.sort;
            if (field) sortBy(field);
        });
    });

    // ===== НАВИГАЦИЯ =====
    document.getElementById('backMenuBtn').addEventListener('click', () => {
        goTo('index.html');
    });
    document.getElementById('backMenuBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        goTo('index.html');
    });

    // ===== ЗВУК =====
    document.getElementById('soundToggleTop').addEventListener('click', () => {
        toggleSound();
    });
    document.getElementById('soundToggleTop').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== ЗАГРУЗКА С ОЖИДАНИЕМ VK =====
    waitForVK(() => {
        // Обновляем ID пользователя после инициализации VK
        currentUserId = getCurrentUserId();
        console.log('👤 ID после инициализации VK:', currentUserId);
        loadGlobalTop();
    });

    // ===== ФОНОВЫЕ ШАРИКИ =====
    const canvas = document.createElement('canvas');
    canvas.id = 'topBgCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:0;pointer-events:none;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);

    const bgBubbles = [];
    for (let i = 0; i < 10; i++) {
        const b = new Bubble(width, height);
        b.y = Math.random() * height;
        b.speed = 0.1 + Math.random() * 0.3;
        b.radius = 20 + Math.random() * 40;
        b.hue = Math.random() * 360;
        bgBubbles.push(b);
    }

    let particles = [];

    const popManager = {
        particles: particles,
        bubbles: bgBubbles,

        handleTap(x, y) {
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                if (b.contains(x, y)) {
                    this.spawnParticles(b.x, b.y, b.hue);
                    this.bubbles.splice(i, 1);
                    this.respawnBubble();
                    if (window.sound) {
                        sound.pop(500 + Math.random() * 300, 0.1, 0.15);
                    }
                    return true;
                }
            }
            return false;
        },

        spawnParticles(x, y, hue) {
            for (let i = 0; i < 15 + Math.random() * 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    radius: 1.5 + Math.random() * 4,
                    hue: hue + (Math.random() - 0.5) * 30,
                    life: 30 + Math.random() * 30,
                    maxLife: 50,
                    gravity: 0.06
                });
            }
        },

        respawnBubble() {
            const b = new Bubble(width, height);
            b.y = Math.random() * height;
            b.x = Math.random() * width;
            b.radius = 20 + Math.random() * 40;
            b.speed = 0.1 + Math.random() * 0.3;
            b.hue = Math.random() * 360;
            this.bubbles.push(b);
        },

        updateParticles() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.99;
                p.vy *= 0.99;
                p.life--;
                p.radius *= 0.995;
                if (p.life <= 0 || p.radius < 0.3) {
                    this.particles.splice(i, 1);
                }
            }
        },

        drawParticles() {
            for (const p of this.particles) {
                const alpha = p.life / p.maxLife;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    };

    document.querySelector('.top-container').addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        popManager.handleTap(x, y);
    });

    document.querySelector('.top-container').addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        popManager.handleTap(x, y);
    }, { passive: true });

    function animateBg() {
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, width, height);

        for (const b of bgBubbles) {
            b.update();
            if (!b.alive) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
                b.alive = true;
                b.radius = 20 + Math.random() * 40;
                b.speed = 0.1 + Math.random() * 0.3;
                b.hue = Math.random() * 360;
            }
            b.draw(ctx);
        }

        popManager.updateParticles();
        popManager.drawParticles();

        requestAnimationFrame(animateBg);
    }
    animateBg();
});
