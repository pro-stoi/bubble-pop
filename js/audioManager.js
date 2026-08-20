// js/audioManager.js

console.log('🎵 [AUDIO] Файл загружен');

class AudioManager {
    constructor() {
        this.enabled = true;
        this.currentTrack = null;
        this.volume = 0.3;
        this.isPlaying = false;
        
        // Загружаем состояние из localStorage
        const saved = localStorage.getItem('bubbleSound');
        if (saved === 'false') {
            this.enabled = false;
        }
        
        console.log('✅ [AUDIO] Экземпляр создан');
    }

    // ===== ПЛЕЙЛИСТ =====
    getTrackForPage() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        
        const tracks = {
            'index.html': 'menu',
            'game.html': 'game',
            'top.html': 'menu',
            'challenges.html': 'menu'
        };
        
        return tracks[page] || 'menu';
    }

    getTrackFile(trackName) {
        return `audio/${trackName}.mp3`;
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
        
        // Проверяем, нужно ли менять трек
        if (audio.src && audio.src.includes(trackFile) && this.isPlaying) {
            return;
        }
        
        audio.src = trackFile;
        audio.volume = this.volume;
        audio.loop = true;
        
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

    // ===== ОСТАНОВКА =====
    stop() {
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        this.isPlaying = false;
        console.log('⏹ [AUDIO] Остановлен');
    }

    // ===== ПАУЗА =====
    pause() {
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.pause();
            this.isPlaying = false;
        }
    }

    // ===== ВОЗОБНОВЛЕНИЕ =====
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

    // ===== ГРОМКОСТЬ =====
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.volume = this.volume;
        }
    }

    // ===== ВКЛ/ВЫКЛ =====
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('bubbleSound', String(this.enabled));
        
        if (this.enabled) {
            const track = this.getTrackForPage();
            this.play(track);
        } else {
            this.stop();
        }
        
        // Обновляем иконки
        if (window.updateSoundIcon) {
            window.updateSoundIcon();
        }
        
        return this.enabled;
    }

    // ===== ЗАПУСК НА СТРАНИЦЕ =====
    init() {
        console.log('🎵 [AUDIO] Инициализация...');
        
        const track = this.getTrackForPage();
        
        // Пробуем играть после взаимодействия с пользователем
        const startAudio = () => {
            if (this.enabled && !this.isPlaying) {
                this.play(track);
            }
            // Удаляем обработчики после первого запуска
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
        
        // Если уже есть взаимодействие — запускаем сразу
        if (document.hasFocus && document.hasFocus()) {
            setTimeout(() => {
                if (this.enabled && !this.isPlaying) {
                    this.play(track);
                }
            }, 500);
        }
        
        console.log('✅ [AUDIO] Инициализирован, трек:', track);
    }
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const audioManager = new AudioManager();

// ===== ПЕРЕКЛЮЧЕНИЕ ЗВУКА =====
window.toggleSoundGlobal = function() {
    return audioManager.toggle();
};

// ===== ОБНОВЛЕНИЕ ИКОНОК =====
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