// js/tutorial.js

console.log('🎓 [TUTORIAL] Файл загружен');

class TutorialManager {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.overlay = null;      // полупрозрачный оверлей
        this.modal = null;        // модалка с кнопкой
        this.arrow = null;        // стрелка на бонус
        this.checkInterval = null;
        this.bonusWasActive = false;
        this.waitingForBonusClick = false;
    }

    shouldShowTutorial() {
        return !localStorage.getItem('tutorialDone');
    }

    // ===== ЗАПУСК =====
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.currentStep = 0;
        this.bonusWasActive = false;

        console.log('🎓 [TUTORIAL] Старт');
        this.showWelcomeModal();
    }

    // ===== ШАГ 1: МОДАЛКА С КНОПКОЙ "ПРОДОЛЖИТЬ" =====
    showWelcomeModal() {
        const old = document.getElementById('tutorialModal');
        if (old) old.remove();

        this.modal = document.createElement('div');
        this.modal.id = 'tutorialModal';
        this.modal.className = 'exit-modal';
        this.modal.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        `;
        this.modal.innerHTML = `
            <div style="
                background: rgba(20, 20, 50, 0.95);
                border-radius: 24px;
                padding: 28px 24px;
                max-width: 340px;
                width: 90%;
                border: 1px solid rgba(255, 215, 0, 0.25);
                box-shadow: 0 0 60px rgba(255, 215, 0, 0.15);
                text-align: center;
                box-sizing: border-box;
            ">
                <div style="
                    font-size: clamp(16px, 4.5vw, 19px);
                    font-weight: 700;
                    color: #ffcc00;
                    line-height: 1.5;
                    margin-bottom: 20px;
                    letter-spacing: 0.5px;
                ">
                    🎯 Набери зелёный бонус —<br>
                    лопни 8 зелёных пузырьков подряд
                </div>
                <button id="tutorialContinueBtn" style="
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 16px;
                    font-size: clamp(14px, 4vw, 16px);
                    font-weight: 700;
                    cursor: pointer;
                    touch-action: manipulation;
                    background: linear-gradient(135deg, #ffcc00, #f0a500);
                    color: #1a1a2a;
                    box-shadow: 0 0 30px rgba(255, 200, 0, 0.3);
                ">
                    ▶ Продолжить
                </button>
            </div>
        `;
        document.body.appendChild(this.modal);

        const btn = document.getElementById('tutorialContinueBtn');
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideWelcomeModal();
            this.goToStep2();
        };
        btn.addEventListener('click', handler);
        btn.addEventListener('touchend', handler);
    }

    hideWelcomeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    // ===== ШАГ 2: ЖДЁМ, ПОКА НАБЕРЁТСЯ ЗЕЛЁНЫЙ БОНУС =====
    goToStep2() {
        this.currentStep = 2;
        console.log('🎓 [TUTORIAL] Шаг 2: ждём зелёный бонус');
        this.startWatcher();
    }

    // ===== ШАГ 3: СТРЕЛКА НА БОНУС =====
showArrowToBonus() {
    this.currentStep = 3;

    const old = document.getElementById('tutorialArrow');
    if (old) old.remove();

    this.arrow = document.createElement('div');
    this.arrow.id = 'tutorialArrow';
    this.arrow.style.cssText = `
        position: fixed;
        z-index: 1001;
        pointer-events: none;
        font-size: 40px;
        animation: arrowBounce 0.8s ease-in-out infinite;
    `;
    document.body.appendChild(this.arrow);

    this.positionArrow();
    window.addEventListener('resize', () => this.positionArrow());
}

positionArrow() {
    if (!this.arrow) return;
    const container = document.getElementById('bonusContainer');
    if (!container) {
        this.arrow.style.display = 'none';
        return;
    }

    // Ищем кнопку зелёного бонуса
    let greenBtn = null;
    for (const btn of container.querySelectorAll('.bonus-btn')) {
        if (btn.dataset.type === 'green') {
            greenBtn = btn;
            break;
        }
    }
    if (!greenBtn) {
        this.arrow.style.display = 'none';
        return;
    }

    const rect = greenBtn.getBoundingClientRect();
    this.arrow.style.display = 'block';
    // 👈 — смотрит ВЛЕВО, прямо на кнопку бонуса
    this.arrow.textContent = '👈';
    this.arrow.style.left = (rect.right + 8) + 'px';
    this.arrow.style.top = (rect.top + rect.height / 2 - 20) + 'px';
}

    hideArrow() {
        if (this.arrow) {
            this.arrow.remove();
            this.arrow = null;
        }
    }

    // ===== ШАГ 4: ЖДЁМ, ПОКА ПОЛЬЗОВАТЕЛЬ НАЖМЁТ НА БОНУС =====
waitForBonusClick() {
    this.waitingForBonusClick = true;

    // capture: true — ловим событие ДО stopPropagation() в bonus.js
    const captureHandler = (e) => {
        if (!this.waitingForBonusClick) return;
        const btn = e.target.closest('.bonus-btn');
        if (btn && btn.dataset.type === 'green') {
            this.waitingForBonusClick = false;
            document.removeEventListener('click', captureHandler, true);
            document.removeEventListener('touchend', captureHandler, true);
            this.hideArrow();
            setTimeout(() => this.goToStep5(), 100);
        }
    };
    document.addEventListener('click', captureHandler, true);
    document.addEventListener('touchend', captureHandler, true);
}

    // ===== ШАГ 5: ПОЛУПРОЗРАЧНЫЙ ОВЕРЛЕЙ "ЛОПНИ ПУЗЫРЁК" =====
    goToStep5() {
        this.currentStep = 5;
        this.hideArrow();

        // Проверяем, что бонус реально активировал режим выбора цвета
        if (typeof bonusManager === 'undefined' || !bonusManager.isSelectingColor()) {
            console.log('🎓 [TUTORIAL] Режим выбора цвета не активен — завершаем');
            this.finish();
            return;
        }

        this.createOverlay();
        this.waitForBubblePop();
    }

createOverlay() {
    const old = document.getElementById('tutorialOverlay');
    if (old) old.remove();

    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorialOverlay';
    // Только лёгкое затемнение, без текста — текст уже показывает bonus.js через showEffect
    this.overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 5;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.35);
    `;
    document.body.appendChild(this.overlay);
}

    hideOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    // ===== ЖДЁМ ЛОПАНИЯ ПУЗЫРЬКА =====
    waitForBubblePop() {
        // Слушаем на канвасе — когда пользователь лопает, game.handleTap → popBubble
        // Проще всего: интервал, который проверяет isSelectingColor
        const check = setInterval(() => {
            if (typeof bonusManager === 'undefined') return;

            // Бонус сработал → режим выбора цвета выключился
            if (!bonusManager.isSelectingColor()) {
                clearInterval(check);
                this.hideOverlay();
                this.finish();
            }
        }, 100);

        // Таймаут-предохранитель на 60 секунд
        setTimeout(() => {
            clearInterval(check);
            this.hideOverlay();
            this.finish();
        }, 60000);
    }

    // ===== НАБЛЮДАТЕЛЬ (ждём зелёный бонус) =====
    startWatcher() {
        if (this.checkInterval) clearInterval(this.checkInterval);

        this.checkInterval = setInterval(() => {
            if (!this.isActive) return;

            // Шаг 2: ждём, пока наберётся зелёный бонус
            if (this.currentStep === 2) {
                if (typeof bonusManager !== 'undefined' && bonusManager) {
                    const greenCount = bonusManager.bonuses['green'].count || 0;
                    if (greenCount > 0) {
                        clearInterval(this.checkInterval);
                        console.log('🎓 [TUTORIAL] Зелёный бонус набран!');
                        this.showArrowToBonus();
                        this.waitForBonusClick();
                    }
                }
            }
        }, 200);
    }

    // ===== ЗАВЕРШЕНИЕ =====
finish() {
    console.log('🎓 [TUTORIAL] Завершено');

    this.waitingForBonusClick = false;

    if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
    }

    this.hideWelcomeModal();
    this.hideArrow();
    this.hideOverlay();

    localStorage.setItem('tutorialDone', 'true');
    localStorage.setItem('lastVisit', String(Date.now()));

    this.isActive = false;
}
}

// ===== ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР =====
const tutorialManager = new TutorialManager();

// ===== ЗАПУСК =====
// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    localStorage.setItem('lastVisit', String(Date.now()));

    // ===== ТЕСТОВЫЙ ФЛАЖОК =====
    // true  — обучение запускается ВСЕГДА (для отладки)
    // false — обучение только если ещё не пройдено (для продакшена)
    const FORCE_TUTORIAL = true;

    if (!FORCE_TUTORIAL && !tutorialManager.shouldShowTutorial()) {
        console.log('🎓 [TUTORIAL] Обучение уже пройдено');
        return;
    }

    // При FORCE_TUTORIAL=true сбрасываем флаг, чтобы finish() потом корректно поставил его заново
    if (FORCE_TUTORIAL) {
        localStorage.removeItem('tutorialDone');
        console.log('🎓 [TUTORIAL] ТЕСТОВЫЙ РЕЖИМ: обучение запускается принудительно');
    }

    console.log('🎓 [TUTORIAL] DOM загружен, запускаем через 1.5 сек');

    setTimeout(() => {
        tutorialManager.start();
    }, 1500);
});