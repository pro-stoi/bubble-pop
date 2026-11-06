// js/musicEngine.js
// Industrial Music Engine v6.1 — частоты +5%
console.log('🎼 [MUSIC] Industrial v6.1 загружен');

// ============================================================
// ===== ПУЛЬТ УПРАВЛЕНИЯ =====
// ============================================================
const CONFIG = {
    global: { masterVolume: 1.0, enabled: true },

    phases: {
        CALM:    { min: 1,  max: 3  },
        BUILD:   { min: 3,  max: 7  },
        TENSION: { min: 7,  max: 12 },
        ZONE:    { min: 12, max: 99 },
    },

    tempo: { CALM: 112, BUILD: 118, TENSION: 124, ZONE: 108 },

    layers: {
        foundation: { enabled: true, volume: 0.50, filterFreq: 368,  phases: ['CALM','BUILD','TENSION','ZONE'] },
        groove:     { enabled: true, volume: 0.70, filterFreq: 630,  phases: ['BUILD','TENSION','ZONE'] },
        texture:    { enabled: true, volume: 0.45, filterFreq: 3150, phases: ['BUILD','TENSION'] },
        melody:     { enabled: true, volume: 0.40, filterFreq: 4725, phases: ['TENSION','ZONE'] },
        percussion: { enabled: true, volume: 0.35, filterFreq: 6300, phases: ['TENSION','ZONE'] },
        drone:      { enabled: true, volume: 0.55, filterFreq: 1260, phases: ['ZONE'] },
    },
};

// ============================================================
// ===== МУЗЫКАЛЬНАЯ ТЕОРИЯ =====
// ============================================================
const PROGRESSION = [33, 29, 24, 31]; // Am, F, C, G
const ARPEGGIOS = [
    [45, 48, 52],
    [41, 45, 48],
    [36, 40, 43],
    [43, 47, 50],
];

const MELODIES = {
    A: [45, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0],
    B: [43, 0, 0, 45, 0, 0, 48, 0, 50, 0, 0, 48, 0, 0, 45, 0],
    C: [45, 0, 0, 0, 0, 46, 0, 0, 43, 0, 0, 0, 0, 44, 0, 0],
};
const MELODY_ORDER = ['A', 'B', 'A', 'C'];

// ============================================================
class MusicEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.enabled = localStorage.getItem('bubbleSound') !== 'false';
        this.started = false;

        this.layers = {};
        for (const name in CONFIG.layers) {
            this.layers[name] = { gain: null, filter: null, timer: null, stepInBar: 0 };
        }

        this.gameState = {
            multiplier: 1,
            lives: 5,
            maxLives: 5,
            bonusCount: 0,
            pendingScore: 0,
        };

        this.currentPhase = 'CALM';
        this.barInProg = 0;
        this.phraseCounter = 0;
        this.barInPhrase = 0;
        this.isBreak = false;
        this.currentMelodyKey = 'A';

        console.log('🎼 [MUSIC] Экземпляр v6.1 создан');
    }

    // MIDI → ГЦ, с подъёмом на 5%
    _midiToHz(note) { return 440 * Math.pow(2, (note - 69) / 12) * 1.05; }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎼 [MUSIC] AudioContext:', this.ctx.state);

            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.masterGain.gain.value = 0;
            this.musicGain.gain.value = this.enabled ? CONFIG.global.masterVolume : 0;

            const saturator = this.ctx.createWaveShaper();
            const curve = new Float32Array(4096);
            for (let i = 0; i < 4096; i++) {
                const x = i * 2 / 4096 - 1;
                curve[i] = Math.tanh(x * 1.8);
            }
            saturator.curve = curve;

            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.value = -8;
            compressor.knee.value = 15;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(saturator);
            saturator.connect(compressor);
            compressor.connect(this.ctx.destination);

            for (const name in this.layers) {
                const g = this.ctx.createGain();
                g.gain.value = 0;
                const f = this.ctx.createBiquadFilter();
                f.type = 'lowpass';
                f.frequency.value = CONFIG.layers[name].filterFreq;
                f.Q.value = 0.7;
                g.connect(f);
                f.connect(this.musicGain);
                this.layers[name].gain = g;
                this.layers[name].filter = f;
            }

            const now = this.ctx.currentTime;
            this.masterGain.gain.setValueAtTime(0, now);
            this.masterGain.gain.linearRampToValueAtTime(1.0, now + 1.0);
            console.log('🎼 [MUSIC] init() OK');
        } catch (e) {
            console.error('🎼 [MUSIC] Ошибка init():', e);
        }
    }

    start() {
        if (this.started) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.started = true;

        for (const name in this.layers) {
            if (CONFIG.layers[name].enabled) {
                this._startLayer(name);
            }
        }
        console.log('🎼 [MUSIC] Engine Started');
    }

    stop() {
        this.started = false;
        for (const name in this.layers) {
            if (this.layers[name].timer) {
                clearTimeout(this.layers[name].timer);
                this.layers[name].timer = null;
            }
        }
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!this.musicGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.linearRampToValueAtTime(
            enabled ? CONFIG.global.masterVolume : 0, now + 0.3
        );
    }

    setIntensity(state) {
        if (typeof state.multiplier === 'number') this.gameState.multiplier = state.multiplier;
        if (typeof state.lives === 'number') this.gameState.lives = state.lives;
        if (typeof state.maxLives === 'number') this.gameState.maxLives = state.maxLives;
        if (typeof state.bonusCount === 'number') this.gameState.bonusCount = state.bonusCount;
        if (typeof state.pendingScore === 'number') this.gameState.pendingScore = state.pendingScore;

        this._updatePhase();
        this._updateVolumes();
    }

    _updatePhase() {
        const m = this.gameState.multiplier;
        let newPhase = 'CALM';
        for (const name in CONFIG.phases) {
            const p = CONFIG.phases[name];
            if (m >= p.min && m < p.max) { newPhase = name; break; }
        }
        if (newPhase !== this.currentPhase) {
            console.log('🎼 [MUSIC] Фаза:', this.currentPhase, '→', newPhase);
            this.currentPhase = newPhase;
            for (const name in this.layers) this.layers[name].stepInBar = 0;
        }
    }

    _updateVolumes() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const phase = this.currentPhase;

        for (const name in this.layers) {
            const cfg = CONFIG.layers[name];
            const layer = this.layers[name];
            if (!layer.gain) continue;

            const isActive = cfg.phases.includes(phase);
            let targetVol = 0;

            if (isActive) {
                targetVol = cfg.volume;
                if (name === 'drone') {
                    const lost = this.gameState.maxLives - this.gameState.lives;
                    const t = Math.min(lost / Math.max(1, this.gameState.maxLives - 1), 1);
                    targetVol *= (0.5 + 0.5 * t);
                }
                if (name === 'texture') {
                    const t = Math.min(this.gameState.bonusCount / 8, 1);
                    targetVol *= (0.4 + 0.6 * t);
                }
            }

            layer.gain.gain.setTargetAtTime(targetVol, now, 0.4);
        }
    }

    _startLayer(name) {
        const layer = this.layers[name];
        const loop = () => {
            if (!this.started) return;
            const tempo = CONFIG.tempo[this.currentPhase] || 112;
            const stepsPerBar = (name === 'texture' || name === 'melody') ? 8 : 16;
            const stepDur = 60 / tempo / (stepsPerBar / 4);

            this._playStep(name, this.ctx.currentTime + 0.01, { tempo, stepsPerBar });
            layer.timer = setTimeout(loop, stepDur * 1000);
        };
        loop();
    }

    _playStep(name, time, params) {
        const layer = this.layers[name];
        layer.stepInBar = (layer.stepInBar + 1) % params.stepsPerBar;
        const step = layer.stepInBar;

        if (name === 'foundation' && step === 0) {
            this.barInProg = (this.barInProg + 1) % 4;
            this.barInPhrase++;
            if (this.barInPhrase >= 4) {
                this.barInPhrase = 0;
                this.phraseCounter++;
                this.currentMelodyKey = MELODY_ORDER[this.phraseCounter % MELODY_ORDER.length];
                this.isBreak = (this.phraseCounter % 4 === 3);
            }
        }

        const chordRoot = PROGRESSION[this.barInProg];
        const arp = ARPEGGIOS[this.barInProg];

        if (name === 'foundation') {
            if (step === 0) {
                this._playSubBass(this._midiToHz(chordRoot), time, 3.0, layer.gain);
            }
            if (step === 0 || step === 8) {
                this._playCinematicPad(chordRoot, time, 3.5, layer.gain);
            }
        }

        if (name === 'groove') {
            if (!this.isBreak) {
                if (step === 0) {
                    this._playCinematicKick(time, layer.gain);
                    this._triggerSidechain(time);
                }
                if (step === 10) {
                    this._playBass(this._midiToHz(chordRoot + 12), time, 1.5, layer.gain, 0.3);
                }
            }
        }

        if (name === 'texture') {
            if (step === 0 || step === 6) {
                const note = arp[1] + 12;
                this._playNote(this._midiToHz(note), time, 2.0, layer.gain, 'sine', 0.15);
            }
        }

        if (name === 'melody') {
            const melody = MELODIES[this.currentMelodyKey];
            const note = melody[step];
            if (note > 0) {
                let dur = this.isBreak ? 1.0 : 0.6;
                this._playNote(this._midiToHz(note), time, dur, layer.gain, 'triangle', 0.20, this.currentPhase === 'ZONE');
            }
        }

        if (name === 'percussion') {
            if (step === 12) {
                this._playIndustrialHit(this._midiToHz(50), time, 1.2, 0, layer.gain);
            }
        }

        if (name === 'drone' && step === 0 && this.currentPhase === 'ZONE') {
            this._playDrone(chordRoot, time, 4.0, layer.gain);
        }
    }

    _triggerSidechain(time) {
        const g = this.layers.groove?.gain;
        if (!g || !this.ctx) return;
        const now = time;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(CONFIG.layers.groove.volume * 0.7, now + 0.05);
        g.gain.exponentialRampToValueAtTime(CONFIG.layers.groove.volume, now + 0.35);
    }

    _playNote(freq, time, duration, targetGain, type = 'triangle', volume = 0.28, vibrato = false) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        if (vibrato) {
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 4.2; // +5% от 4
            lfoGain.gain.value = freq * 0.008;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(time);
            lfo.stop(time + duration);
        }

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(targetGain);
        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    _playSubBass(freq, time, duration, targetGain) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.08);
        gain.gain.setTargetAtTime(0.001, time + duration * 0.7, duration * 0.3);
        osc.connect(gain);
        gain.connect(targetGain);
        osc.start(time);
        osc.stop(time + duration);
    }

    _playCinematicPad(chordRootMidi, time, duration, targetGain) {
        if (!this.ctx) return;
        const notes = [chordRootMidi + 12, chordRootMidi + 15, chordRootMidi + 19];
        notes.forEach((n, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = 'sine';
            osc.frequency.value = this._midiToHz(n);
            osc.detune.value = (i - 1) * 4.2; // +5%
            filter.type = 'lowpass';
            filter.frequency.value = 630; // +5% от 600
            filter.Q.value = 0.5;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(targetGain);
            osc.start(time);
            osc.stop(time + duration + 0.5);
        });
    }

    _playBass(freq, time, duration, targetGain, velocity = 0.8) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        sub.type = 'sine';
        sub.frequency.value = freq / 2;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(630, time); // +5% от 600
        filter.frequency.linearRampToValueAtTime(945, time + 0.15); // +5% от 900
        filter.frequency.exponentialRampToValueAtTime(315, time + duration); // +5% от 300
        filter.Q.value = 1;
        const peak = 0.4 * velocity;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);
        osc.start(time);
        sub.start(time);
        osc.stop(time + duration);
        sub.stop(time + duration);
    }

    _playCinematicKick(time, targetGain) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(84, time); // +5% от 80
        osc.frequency.exponentialRampToValueAtTime(26.25, time + 0.6); // +5% от 25
        filter.type = 'lowpass';
        filter.frequency.value = 126; // +5% от 120
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.9, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);
        osc.start(time);
        osc.stop(time + 0.9);
    }

    _playIndustrialHit(freq, time, duration, dissonance, targetGain) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.05), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 315; // +5% от 300
        filter.Q.value = 0.5;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);
        osc.start(time);
        noise.start(time);
        osc.stop(time + duration);
        noise.stop(time + 0.05);
    }

    _playDrone(chordRootMidi, time, duration, targetGain) {
        if (!this.ctx) return;
        const freq1 = this._midiToHz(chordRootMidi + 12);
        const freq2 = this._midiToHz(chordRootMidi + 13);
        [freq1, freq2].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = i === 0 ? 'sawtooth' : 'sine';
            osc.frequency.value = f;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 945; // +5% от 900
            filter.Q.value = 1;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(i === 0 ? 0.25 : 0.08, time + 0.8);
            gain.gain.setTargetAtTime(0.001, time + duration * 0.85, duration * 0.3);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(targetGain);
            osc.start(time);
            osc.stop(time + duration);
        });
    }
}

const musicEngine = new MusicEngine();

function startMusicOnce() {
    console.log('🎼 [MUSIC] Первый клик — start()');
    musicEngine.start();
}
document.addEventListener('click', startMusicOnce, { once: true });
document.addEventListener('touchstart', startMusicOnce, { once: true, passive: true });