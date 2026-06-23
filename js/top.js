document.addEventListener('DOMContentLoaded', () => {
    let topData = JSON.parse(localStorage.getItem('bubbleTop') || '[]');
    let currentSort = 'score';
    let sortDirection = -1; // -1 = по убыванию

    // ===== ФУНКЦИЯ ФОРМАТИРОВАНИЯ =====
    function formatDate(dateStr) {
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
            return parts[0] + ' ' + parts[1];
        }
        return dateStr;
    }

    // ===== РЕНДЕРИНГ ТОПА =====
    function renderTop() {
        const container = document.getElementById('topList');
        
        if (topData.length === 0) {
            container.innerHTML = `<div class="top-empty">🎯 Сыграйте первую игру!</div>`;
            return;
        }

        // Сортировка
        let sorted = [...topData];
        if (currentSort === 'score') {
            sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (currentSort === 'combo') {
            sorted.sort((a, b) => (b.maxCombo || 0) - (a.maxCombo || 0));
        } else if (currentSort === 'bonus') {
            sorted.sort((a, b) => (b.bestBonus || 0) - (a.bestBonus || 0));
        }

        // Берем топ-10
        sorted = sorted.slice(0, 10);

        container.innerHTML = sorted.map((item, index) => {
            const place = index + 1;
            let placeClass = 'place';
            if (place === 1) placeClass += ' gold';
            else if (place === 2) placeClass += ' silver';
            else if (place === 3) placeClass += ' bronze';

            const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : place;

            return `
                <div class="top-row">
                    <span class="${placeClass}">${medal}</span>
                    <span class="date">${formatDate(item.date || '—')}</span>
                    <span class="score">${item.score || 0}</span>
                    <span class="combo">${item.maxCombo || 0}</span>
                    <span class="bonus">${item.bestBonus || 0}</span>
                </div>
            `;
        }).join('');
    }

    // ===== ФИЛЬТРЫ =====
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            renderTop();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            renderTop();
        });
    });

    // ===== НАЗАД =====
   document.getElementById('backBtnTop').addEventListener('click', () => {
    goToWithAd('index.html'); // ← ЗАМЕНИЛИ
});
  document.getElementById('backBtnTop').addEventListener('touchend', (e) => {
    e.preventDefault();
    goToWithAd('index.html'); // ← ЗАМЕНИЛИ
});

    // ===== ЗВУК =====
    document.getElementById('soundToggleTop').addEventListener('click', () => {
        toggleSound();
    });
    document.getElementById('soundToggleTop').addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleSound();
    });

    // ===== ОЧИСТКА =====
    document.getElementById('clearTopBtn').addEventListener('click', () => {
        if (confirm('Удалить все рекорды?')) {
            localStorage.removeItem('bubbleTop');
            topData = [];
            renderTop();
        }
    });

    // ===== ПЕРВЫЙ РЕНДЕР =====
    renderTop();
});
document.getElementById('shareTopBtn').addEventListener('click', () => {
    const best = topData[0] || { score: 0, maxCombo: 0 };
    vk.shareResult(best.score, best.maxCombo);
});

document.getElementById('shareTopBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    const best = topData[0] || { score: 0, maxCombo: 0 };
    vk.shareResult(best.score, best.maxCombo);
});