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

    // ===== ОБНОВЛЕНИЕ =====
    document.getElementById('refreshBtn').addEventListener('click', () => {
        renderChallenges();
    });
    document.getElementById('refreshBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        renderChallenges();
    });

    // ===== РЕНДЕРИНГ =====
    window.renderChallenges = function() {
        const container = document.getElementById('challengesContainer');
        const challenges = challengeTracker.getChallenges();
        const totalRewards = challengeTracker.getTotalRewards();
        
        container.innerHTML = challenges.map(ch => {
            const progress = Math.min(100, (ch.current / ch.target) * 100);
            const isCompleted = ch.current >= ch.target;
            const circumference = 2 * Math.PI * 14;
            const offset = circumference - (progress / 100) * circumference;
            
            // Показываем уровень и множитель
            const levelDisplay = ch.level > 0 ? `⭐ ${ch.level + 1}` : '⭐ 1';
            const rewardDisplay = ch.level > 0 ? `${ch.baseReward} × ${ch.multiplier} = ${ch.baseReward * ch.multiplier} 💎` : `${ch.baseReward} 💎`;
            
            return `
                <div class="challenge-bubble ${isCompleted ? 'completed' : ''}" 
                     style="background: radial-gradient(circle at 35% 35%, ${ch.color}cc, ${ch.color}66);">
                    <div class="icon">${ch.icon}</div>
                    <div class="name">${ch.name}</div>
                    <div class="level">${levelDisplay}</div>
                    <div class="clicks-count">${ch.current} / ${ch.target}</div>
                    <div class="progress-ring">
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle class="bg" cx="18" cy="18" r="14"/>
                            <circle class="fill" cx="18" cy="18" r="14"
                                    stroke-dasharray="${circumference}" 
                                    stroke-dashoffset="${offset}"/>
                        </svg>
                        <div class="progress-text">${Math.round(progress)}%</div>
                    </div>
                    <div class="reward">${rewardDisplay}</div>
                    ${isCompleted ? '<div class="completed-badge">⬆</div>' : ''}
                </div>
            `;
        }).join('');

        updateRewardsDisplay(totalRewards);
    };

    // ===== ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ НАГРАД =====
    function updateRewardsDisplay(total) {
        let el = document.getElementById('totalRewards');
        if (!el) {
            el = document.createElement('div');
            el.id = 'totalRewards';
            el.className = 'total-rewards';
            el.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 20;
                background: rgba(255,215,0,0.15);
                backdrop-filter: blur(12px);
                padding: 10px 24px;
                border-radius: 30px;
                border: 1px solid rgba(255,215,0,0.2);
                color: #ffcc00;
                font-size: 18px;
                font-weight: bold;
                text-shadow: 0 0 20px rgba(255,215,0,0.2);
                pointer-events: none;
            `;
            document.body.appendChild(el);
        }
        el.textContent = `💎 Наград: ${total}`;
    }

    // ===== ФОНОВЫЕ ПУЗЫРЬКИ =====
    const canvas = document.getElementById('challengesCanvas');
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
        b.speed = 0.15 + Math.random() * 0.4;
        b.radius = 15 + Math.random() * 40;
        b.hue = Math.random() * 360;
        bgBubbles.push(b);
    }

    function animateBg() {
        ctx.clearRect(0, 0, width, height);
        
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0a2a');
        grad.addColorStop(0.5, '#1a0a3a');
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (const b of bgBubbles) {
            b.update();
            if (!b.alive) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
                b.alive = true;
                b.radius = 15 + Math.random() * 40;
                b.speed = 0.15 + Math.random() * 0.4;
                b.hue = Math.random() * 360;
            }
            b.draw(ctx);
        }

        requestAnimationFrame(animateBg);
    }
    animateBg();

    // ===== ПЕРВЫЙ РЕНДЕР =====
    renderChallenges();
});