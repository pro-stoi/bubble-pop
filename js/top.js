document.addEventListener('DOMContentLoaded', () => {
    let topData = [];
    let currentSort = 'score';
    let isLoading = true;
    let currentUserId = null;

    function getMedal(place) {
        if (place === 1) return '🥇';
        if (place === 2) return '🥈';
        if (place === 3) return '🥉';
        return place;
    }

    function getPlaceClass(place) {
        if (place === 1) return 'place gold';
        if (place === 2) return 'place silver';
        if (place === 3) return 'place bronze';
        return 'place';
    }

    function getCurrentUserId() {
        if (vk && vk.dbUserId) {
            return vk.dbUserId;
        }
        const savedId = localStorage.getItem('bubbleUserId');
        if (savedId) {
            return parseInt(savedId);
        }
        return null;
    }

    async function loadGlobalTop() {
        isLoading = true;
        document.getElementById('topList').innerHTML = '<div class="top-empty">⏳ Загрузка...</div>';
        
        try {
            topData = await vk.getGlobalTop();
            
            topData = topData.map(item => ({
                ...item,
                user_id: item.user_id || item.userId || 0,
                user_name: item.user_name || item.userName || 'Игрок',
                score: item.score || 0,
                maxCombo: item.max_combo || item.maxCombo || 0,
                challengePoints: item.challenge_points || item.challengePoints || 0
            }));
            
            currentUserId = getCurrentUserId();
            console.log('👤 ID текущего пользователя:', currentUserId);
            
            if (topData.length === 0) {
                document.getElementById('topList').innerHTML = '<div class="top-empty">🎯 Сыграйте первую игру!</div>';
                isLoading = false;
                return;
            }
            
            sortTopData();
            renderTop();
            
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки топа:', error);
            const localTop = JSON.parse(localStorage.getItem('globalTop') || '[]');
            if (localTop.length > 0) {
                topData = localTop;
                sortTopData();
                renderTop();
            } else {
                document.getElementById('topList').innerHTML = '<div class="top-empty">🎯 Сыграйте первую игру!</div>';
            }
        }
        
        isLoading = false;
    }

    function sortTopData() {
        if (currentSort === 'score') {
            topData.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (currentSort === 'combo') {
            topData.sort((a, b) => (b.maxCombo || 0) - (a.maxCombo || 0));
        } else if (currentSort === 'bonus') {
            topData.sort((a, b) => (b.challengePoints || 0) - (a.challengePoints || 0));
        }
    }

    // ===== ПОЛУЧИТЬ МЕСТО ПОЛЬЗОВАТЕЛЯ =====
    function getUserPlace() {
        if (!currentUserId) return null;
        const index = topData.findIndex(item => item.user_id === currentUserId);
        if (index === -1) return null;
        return {
            place: index + 1,
            ...topData[index]
        };
    }

    // ===== РЕНДЕРИНГ ТОПА =====
    function renderTop() {
        const container = document.getElementById('topList');
        const top10 = topData.slice(0, 10);
        const userInfo = getUserPlace();
        
        if (top10.length === 0) {
            container.innerHTML = '<div class="top-empty">🎯 Сыграйте первую игру!</div>';
            return;
        }
        
        let html = '';
        
        // ===== ВЫДЕЛЕННАЯ СТРОКА ПОЛЬЗОВАТЕЛЯ (если он есть в топ-10 или вообще в списке) =====
        if (userInfo && userInfo.place <= 10) {
            // Пользователь в топ-10 — он уже есть в списке, но мы покажем его в выделенной строке
            // и заменим его строку в основном списке на "выделенную"
            // Для этого мы не будем дублировать, а просто добавим отдельную строку сверху
            // и уберем его из основного списка (или выделим отдельно)
            // Но проще — оставить как есть, просто добавить отдельную строку-баннер
            // + подсветить его в списке
        }
        
        // Сначала рисуем выделенную строку пользователя (если он есть в топе)
        if (userInfo) {
            const place = userInfo.place;
            const medal = getMedal(place);
            const placeClass = getPlaceClass(place);
            const userName = userInfo.user_name || 'Игрок';
            const score = userInfo.score || 0;
            const maxCombo = userInfo.maxCombo || 0;
            const challengePoints = userInfo.challengePoints || 0;
            
            html += `
                <div class="top-row current-user-highlight">
                    <div class="user-badge">
                        <span class="highlight-star">⭐</span>
                        <span>МОЁ МЕСТО</span>
                    </div>
                </div>
                <div class="top-row current-user user-highlight-row">
                    <span class="${placeClass}">${medal}</span>
                    <span class="name">${userName} 👈</span>
                    <span class="score">${score}</span>
                    <span class="combo">${maxCombo}</span>
                    <span class="bonus">${challengePoints}</span>
                </div>
            `;
        }
        
        // ===== ОСНОВНОЙ СПИСОК ТОП-10 =====
        // Если пользователь в топ-10, мы его уже показали в выделенной строке,
        // но в основном списке он тоже есть — его можно подсветить, но не дублировать
        // Чтобы избежать дублирования, мы просто пропускаем его в основном списке
        // и показываем остальных (или оставляем его с подсветкой)
        
        // Вариант: показываем топ-10 с подсветкой пользователя, но без дублирования выделенной строки
        // Если мы уже показали выделенную строку, то в основном списке пользователь будет подсвечен
        // но мы его не убираем, чтобы был виден полный список
        
        // Просто рендерим топ-10 с подсветкой пользователя
        html += top10.map((item, index) => {
            const place = index + 1;
            const medal = getMedal(place);
            const placeClass = getPlaceClass(place);
            
            const userName = item.user_name || item.userName || 'Игрок';
            const score = item.score || 0;
            const maxCombo = item.maxCombo || 0;
            const challengePoints = item.challengePoints || 0;
            
            const isCurrentUser = currentUserId && item.user_id === currentUserId;
            const rowClass = isCurrentUser ? 'top-row current-user' : 'top-row';
            
            return `
                <div class="${rowClass}">
                    <span class="${placeClass}">${medal}</span>
                    <span class="name">${userName} ${isCurrentUser ? '👈' : ''}</span>
                    <span class="score">${score}</span>
                    <span class="combo">${maxCombo}</span>
                    <span class="bonus">${challengePoints}</span>
                </div>
            `;
        }).join('');
        
        // ===== ЕСЛИ ПОЛЬЗОВАТЕЛЬ НЕ В ТОП-10, НО В ОБЩЕМ СПИСКЕ =====
        if (userInfo && userInfo.place > 10) {
            // Убираем строку "МОЁ МЕСТО" если она уже есть, и пересоздаём
            // Но проще добавить её в конце с номером места
            html += `
                <div class="top-divider">...</div>
                <div class="top-row current-user user-highlight-row user-outside-top">
                    <span class="place">${userInfo.place}</span>
                    <span class="name">${userInfo.user_name || 'Игрок'} 👈</span>
                    <span class="score">${userInfo.score || 0}</span>
                    <span class="combo">${userInfo.maxCombo || 0}</span>
                    <span class="bonus">${userInfo.challengePoints || 0}</span>
                </div>
            `;
        }
        
        // ===== ЕСЛИ ПОЛЬЗОВАТЕЛЬ НЕ НАШЁЛСЯ В ТОПЕ =====
        if (!userInfo && currentUserId) {
            html += `
                <div class="top-row not-in-top">
                    <span class="place">—</span>
                    <span class="name">Вы пока не в топе 🎯</span>
                    <span class="score">0</span>
                    <span class="combo">0</span>
                    <span class="bonus">0</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    // ===== ФИЛЬТРЫ =====
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            if (!isLoading && topData.length > 0) {
                sortTopData();
                renderTop();
            }
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            if (!isLoading && topData.length > 0) {
                sortTopData();
                renderTop();
            }
        });
    });

    // ===== КНОПКА "НАЗАД" =====
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

   
    // ===== ЗАГРУЗКА =====
    loadGlobalTop();

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