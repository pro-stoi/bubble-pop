// js/audioManager.js

console.log('🎵 [AUDIO] Файл загружен');

class AudioManager {
    constructor() {
        this.enabled = true;
        this.currentTrack = null;
        this.currentTrackIndex = 0;
        this.playlist = [];
        this.volume = 0.3;
        this.isPlaying = false;
        this._initialized = false;
        
        const saved = localStorage.getItem('bubbleSound');
        if (saved === 'false') {
            this.enabled = false;
        }
        
        console.log('✅ [AUDIO] Экземпляр создан, enabled =', this.enabled);
    }

    // ===== ПЛЕЙЛИСТ (ОДИН ТРЕК ДЛЯ ВСЕЙ ИГРЫ) =====
    getPlaylistForPage() {
        return ['game'];
    }

    getTrackFile(trackName) {
        return `audio/${trackName}.mp3`;
    }

    // ===== СОХРАНЕНИЕ ПРИ УХОДЕ =====
    saveState() {
        const audio = document.getElementById('bgMusic');
        if (audio && this.isPlaying) {
            sessionStorage.setItem('musicTime', audio.currentTime);
            sessionStorage.setItem('musicTrack', this.currentTrack || 'game');
            sessionStorage.setItem('musicPlaying', 'true');
        }
        sessionStorage.setItem('musicEnabled', this.enabled ? 'true' : 'false');
    }

    // ===== ВОССТАНОВЛЕНИЕ ПРИ ЗАГРУЗКЕ =====
    restoreState() {
        const audio = document.getElementById('bgMusic');
        if (!audio) {
            console.warn('⚠️ [AUDIO] audio не найден при restoreState');
            return;
        }
        
        const savedTime = parseFloat(sessionStorage.getItem('musicTime') || '0');
        const savedTrack = sessionStorage.getItem('musicTrack') || 'game';
        const wasPlaying = sessionStorage.getItem('musicPlaying') === 'true';
        const wasEnabled = sessionStorage.getItem('musicEnabled');
        
        // Восстанавливаем вкл/выкл
        if (wasEnabled === 'false') {
            this.enabled = false;
        } else if (wasEnabled === 'true') {
            this.enabled = true;
        }
        
        // Применяем muted
        audio.muted = !this.enabled;
        
        console.log('🔊 [AUDIO] restoreState: enabled =', this.enabled, ', wasPlaying =', wasPlaying, ', savedTime =', savedTime);
        
        // Если музыка играла — продолжаем с того же места
        if (wasPlaying && this.enabled) {
            audio.src = this.getTrackFile(savedTrack);
            audio.volume = this.volume;
            audio.muted = !this.enabled;
            
            audio.onloadedmetadata = () => {
                if (savedTime > 0) {
                    audio.currentTime = savedTime;
                }
                audio.play()
                    .then(() => {
                        this.isPlaying = true;
                        this.currentTrack = savedTrack;
                        console.log('🎵 [AUDIO] Продолжаем трек:', savedTrack, 'с', savedTime.toFixed(1), 'сек');
                    })
                    .catch((e) => {
                        console.warn('⚠️ [AUDIO] Не удалось продолжить:', e.message);
                    });
            };
        }
    }

    // ===== ВОСПРОИЗВЕДЕНИЕ =====
    play(trackName) {
        if (!this.enabled) return;
        
        const audio = document.getElementById('bgMusic');
        if (!audio) {
            console.warn('⚠️ [AUDIO] Элемент audio не найден');
            return;
        }
        
        const trackFile = this.getTrackFile(trackName);
        
        audio.src = trackFile;
        audio.volume = this.volume;
        audio.loop = true;
        audio.muted = !this.enabled;
        
        audio.play()
            .then(() => {
                this.isPlaying = true;
                this.currentTrack = trackName;
                console.log('🎵 [AUDIO] Играет:', trackName);
            })
            .catch((e) => {
                console.warn('⚠️ [AUDIO] Ошибка воспроизведения:', e.message);
                this.isPlaying = false;
            });
    }

    startPlaylist() {
        if (!this.enabled) return;
        
        const audio = document.getElementById('bgMusic');
        if (!audio) return;
        
        this.playlist = this.getPlaylistForPage();
        this.currentTrackIndex = 0;
        
        const trackName = this.playlist[0];
        this.play(trackName);
    }

    stop() {
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        this.isPlaying = false;
        console.log('⏹ [AUDIO] Остановлен');
    }

    pause() {
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.pause();
            this.isPlaying = false;
        }
    }

    resume() {
        if (!this.enabled) return;
        const audio = document.getElementById('bgMusic');
        if (audio && !this.isPlaying) {
            audio.play()
                .then(() => {
                    this.isPlaying = true;
                })
                .catch(() => {});
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.volume = this.volume;
        }
    }

    // ===== ВКЛ/ВЫКЛ =====
 // js/audioManager.js — замените метод toggle()

// audioManager.js — метод toggle()
toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('bubbleSound', String(this.enabled));
    sessionStorage.setItem('musicEnabled', this.enabled ? 'true' : 'false');

    // ===== СИНХРОНИЗИРУЕМ С sound.js =====
    if (typeof sound !== 'undefined' && sound) {
        sound.enabled = this.enabled;
    }

    const audio = document.getElementById('bgMusic');
    if (audio) {
        audio.muted = !this.enabled;  // ✅ muted, а не pause
    }

    if (this.enabled && audio && !this.isPlaying) {
        this.startPlaylist();
    }

    if (window.updateSoundIcon) {
        window.updateSoundIcon();
    }

    return this.enabled;
}

    // ===== ИНИЦИАЛИЗАЦИЯ =====
init() {
    if (this._initialized) return;
    this._initialized = true;

    console.log('🎵 [AUDIO] Инициализация...');

    // ===== СИНХРОНИЗИРУЕМ С sound.js (единый флаг) =====
    if (typeof sound !== 'undefined' && sound) {
        sound.enabled = this.enabled;
        console.log('🔊 [AUDIO] sound.enabled синхронизирован =', sound.enabled);
    }

    // ===== ВОССТАНАВЛИВАЕМ СОСТОЯНИЕ (может сразу запустить музыку) =====
    this.restoreState();

    // ===== СОХРАНЯЕМ ПРИ УХОДЕ =====
    window.addEventListener('beforeunload', () => this.saveState());
    window.addEventListener('pagehide', () => this.saveState());

    // ===== СТАРТ ПО ПЕРВОМУ КЛИКУ =====
    // Если restoreState() уже поднял музыку — обработчики не нужны
    if (this.isPlaying || !this.enabled) {
        console.log('✅ [AUDIO] Инициализирован (музыка уже играет или выключена)');
        return;
    }

    const startAudio = () => {
        if (this.enabled && !this.isPlaying) {
            console.log('🎵 [AUDIO] Первый клик — запускаем музыку');
            this.startPlaylist();
        }
    };

    // once: true — обработчик снимает себя сам после первого срабатывания
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true, passive: true });

    console.log('✅ [AUDIO] Инициализирован (ждём первый клик)');
}
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const audioManager = new AudioManager();

window.toggleSoundGlobal = function() {
    return audioManager.toggle();
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

document.addEventListener('DOMContentLoaded', function() {
    window.updateSoundIcon();
    audioManager.init();
});
