// js/sound.js

class SoundGenerator {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio не поддерживается');
        }
        // Загружаем состояние из localStorage
        const saved = localStorage.getItem('bubbleSound');
        if (saved === 'false') {
            this.enabled = false;
        }
    }

    // ===== ОСНОВНОЙ ЗВУК ЛОПАНИЯ =====
    pop(frequency = 800, duration = 0.15, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        try {
            // Если аудио контекст приостановлен - возобновляем
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.ctx.currentTime + duration);
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    combo(comboLevel) {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const freq = 600 + comboLevel * 80;
            const duration = 0.1 + comboLevel * 0.02;
            const volume = Math.min(0.5, 0.2 + comboLevel * 0.03);
            this.pop(freq, duration, volume);
            
            if (comboLevel > 3) {
                setTimeout(() => {
                    this.pop(freq * 1.5, duration * 0.8, volume * 0.7);
                }, 50);
            }
        } catch (e) {}
    }

    bonus() {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const notes = [523, 659, 784];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this.pop(freq, 0.12, 0.15);
                }, i * 80);
            });
        } catch (e) {}
    }

    miss() {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
            
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) {}
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        localStorage.setItem('bubbleSound', String(this.enabled));
        // Обновляем иконки
        if (window.updateSoundIcon) {
            window.updateSoundIcon();
        }
        return this.enabled;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

// ===== СОЗДАЁМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const sound = new SoundGenerator();

// ===== ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ =====
window.toggleSoundGlobal = function() {
    sound.toggle();
    return sound.enabled;
};

// ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ИКОНОК =====
window.updateSoundIcon = function() {
    const icons = document.querySelectorAll('.sound-icon');
    const labels = document.querySelectorAll('.sound-label');
    const enabled = localStorage.getItem('bubbleSound') !== 'false';
    icons.forEach(el => {
        if (el) el.textContent = enabled ? '🔊' : '🔇';
    });
    labels.forEach(el => {
        if (el) el.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    });
};

// ===== ВОССТАНАВЛИВАЕМ АУДИО ПРИ ПЕРВОМ КАСАНИИ =====
document.addEventListener('touchstart', () => {
    sound.resume();
}, { once: true });

document.addEventListener('click', () => {
    sound.resume();
}, { once: true });

// ===== ПРИ ЗАГРУЗКЕ ОБНОВЛЯЕМ ИКОНКИ =====
document.addEventListener('DOMContentLoaded', () => {
    window.updateSoundIcon();
});