// ===== ЗВУК =====
let soundEnabled = localStorage.getItem('bubbleSound') !== 'false';

// Синхронизируем с sound.js
if (window.sound) {
    window.sound.enabled = soundEnabled;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('bubbleSound', String(soundEnabled));
    if (window.sound) {
        window.sound.enabled = soundEnabled;
    }
    updateSoundIcon();
}

function updateSoundIcon() {
    const icons = document.querySelectorAll('.sound-icon');
    const labels = document.querySelectorAll('.sound-label');
    icons.forEach(el => el.textContent = soundEnabled ? '🔊' : '🔇');
    labels.forEach(el => el.textContent = soundEnabled ? 'ВКЛ' : 'ВЫКЛ');
}

function goTo(page) {
    window.location.href = page;
}