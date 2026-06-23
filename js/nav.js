// ===== НАВИГАЦИЯ =====

function goTo(page) {
    window.location.href = page;
}

// ===== ЗВУК =====
function toggleSound() {
    if (window.toggleSoundGlobal) {
        window.toggleSoundGlobal();
    } else {
        // Запасной вариант
        const soundEnabled = localStorage.getItem('bubbleSound') !== 'false';
        localStorage.setItem('bubbleSound', String(!soundEnabled));
        if (window.updateSoundIcon) {
            window.updateSoundIcon();
        }
    }
}

// ===== ОБНОВЛЕНИЕ ИКОНОК ЗВУКА =====
function updateSoundIcon() {
    const icons = document.querySelectorAll('.sound-icon');
    const labels = document.querySelectorAll('.sound-label');
    const enabled = localStorage.getItem('bubbleSound') !== 'false';
    icons.forEach(el => {
        if (el) el.textContent = enabled ? '🔊' : '🔇';
    });
    labels.forEach(el => {
        if (el) el.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    });
}

// Делаем функцию доступной глобально
window.updateSoundIcon = updateSoundIcon;

// ===== ПРИ ЗАГРУЗКЕ ОБНОВЛЯЕМ ИКОНКИ =====
document.addEventListener('DOMContentLoaded', () => {
    updateSoundIcon();
});

// ===== КНОПКА НАЗАД (для всех страниц) =====
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backMenuBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goTo('index.html');
        });
        backBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            goTo('index.html');
        });
    }
});