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
        const saved = localStorage.getItem('bubbleSound');
        if (saved === 'false') {
            this.enabled = false;
        }
    }

    // ========================================
    // 1. ЗВУК ЛОПАНИЯ ПО ЦВЕТУ
    // ========================================
    popByColor(colorType, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;

        var freqMap = {
            'red': 200,
            'yellow': 500,
            'green': 700,
            'blue': 900,
            'pink': 1200
        };

        var frequency = freqMap[colorType] || 600;
        this._popTone(frequency, 0.12, volume);
    }

    // ========================================
    // 2. ЗВУК ЛОПАНИЯ С КОМБО
    // ========================================
    popByColorWithCombo(colorType, combo, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;

        var freqMap = {
            'red': 200,
            'yellow': 500,
            'green': 700,
            'blue': 900,
            'pink': 1200
        };

        var baseFreq = freqMap[colorType] || 600;
        var boost = 1 + (combo - 1) * 0.03;
        var frequency = Math.min(baseFreq * boost, 2000);

        this._popTone(frequency, 0.12, volume);
    }

    // ========================================
    // 3. ОБЫЧНЫЙ POP (для совместимости)
    // ========================================
    pop(frequency = 800, duration = 0.15, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        try {
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

    // ========================================
    // 4. ЗВУК ЗАМЕДЛЕНИЯ (КРАСНЫЙ БОНУС)
    // ========================================
    slowMotion() {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            // Основной звук - падение тона
            var osc1 = this.ctx.createOscillator();
            var gain1 = this.ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.5);
            gain1.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);
            osc1.start();
            osc1.stop(this.ctx.currentTime + 0.5);

            // Второй звук - "зажевывание"
            setTimeout(() => {
                var osc2 = this.ctx.createOscillator();
                var gain2 = this.ctx.createGain();
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(250, this.ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.4);
                gain2.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                osc2.start();
                osc2.stop(this.ctx.currentTime + 0.4);
            }, 100);

        } catch (e) {}
    }

    // ========================================
    // 5. ЗВУК СИНЕГО БОНУСА (РАДОСТНЫЙ)
    // ========================================
    bonusHappy() {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            // Радостная восходящая мелодия: динь-динь-динь-ДИНЬ!
            var notes = [523, 659, 784, 988];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this._popTone(freq, 0.1, 0.2 * (1 - i * 0.1));
                }, i * 80);
            });

            // Добавляем акцент в конце
            setTimeout(() => {
                this._popTone(988, 0.08, 0.15);
            }, 350);

        } catch (e) {}
    }

    // ========================================
    // 6. ЗВУК СБРОСА КОМБО (короткий)
    // ========================================
    // ===== ЗВУК ПРОМАХА (клик мимо шарика) =====
missSound() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
}
// ===== ЗВУК СБРОСА СЕРИИ (таймаут) =====
comboReset() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
}

    // ========================================
    // 7. ЗВУК КОМБО
    // ========================================
    combo(comboLevel) {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            var freq = 600 + comboLevel * 80;
            var duration = 0.1 + comboLevel * 0.02;
            var volume = Math.min(0.5, 0.2 + comboLevel * 0.03);
            this.pop(freq, duration, volume);

            if (comboLevel > 3) {
                setTimeout(() => {
                    this.pop(freq * 1.5, duration * 0.8, volume * 0.7);
                }, 50);
            }
        } catch (e) {}
    }

    // ========================================
    // 8. ВСПОМОГАТЕЛЬНЫЙ МЕТОД
    // ========================================
    _popTone(frequency, duration = 0.12, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(frequency * 0.7, this.ctx.currentTime + duration);

            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration + 0.02);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration + 0.02);
        } catch (e) {}
    }
// ========================================
// НАКОПЛЕНИЕ КРАСНОГО БОНУСА ("бум-бум")
// ========================================
bonusRedEarned() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        var notes = [200, 250];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._popTone(freq, 0.15, 0.2 * (1 - i * 0.3));
            }, i * 120);
        });
    } catch (e) {}
}

// ========================================
// НАКОПЛЕНИЕ ЖЁЛТОГО БОНУСА ("зынь-зынь")
// ========================================
bonusYellowEarned() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        var notes = [800, 1200];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._popTone(freq, 0.06, 0.15);
            }, i * 100);
        });
    } catch (e) {}
}

// ========================================
// НАКОПЛЕНИЕ ЗЕЛЁНОГО БОНУСА ("тра-та-та")
// ========================================
bonusGreenEarned() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        var notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._popTone(freq, 0.06, 0.15 * (1 - i * 0.2));
            }, i * 60);
        });
    } catch (e) {}
}

// ========================================
// НАКОПЛЕНИЕ СИНЕГО БОНУСА ("динь-динь")
// ========================================
bonusBlueEarned() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        var notes = [880, 1100, 1320];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._popTone(freq, 0.08, 0.15 * (1 - i * 0.2));
            }, i * 80);
        });
    } catch (e) {}
}

// ========================================
// НАКОПЛЕНИЕ РОЗОВОГО БОНУСА ("фьюить-бах")
// ========================================
bonusPinkEarned() {
    if (!this.enabled || !this.ctx) return;
    try {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        // Восходящий свист
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
        
        // Удар в конце
        setTimeout(() => {
            this._popTone(150, 0.08, 0.2);
        }, 180);
    } catch (e) {}
}
    // ========================================
    // 9. УПРАВЛЕНИЕ
    // ========================================
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        localStorage.setItem('bubbleSound', String(this.enabled));
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

const sound = new SoundGenerator();

window.toggleSoundGlobal = function() {
    sound.toggle();
    return sound.enabled;
};

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

document.addEventListener('touchstart', () => {
    sound.resume();
}, { once: true });

document.addEventListener('click', () => {
    sound.resume();
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    window.updateSoundIcon();
});
