// js/privacy.js

console.log('🔒 [PRIVACY] Файл загружен');

// ===== КЛЮЧ В LOCALSTORAGE =====
const PRIVACY_CONSENT_KEY = 'privacyConsent';

// ===== ПРОВЕРКА СОГЛАСИЯ =====
function hasPrivacyConsent() {
    return localStorage.getItem(PRIVACY_CONSENT_KEY) === 'true';
}

// ===== ПОКАЗАТЬ МОДАЛКУ =====
function showPrivacyModal() {
    const modal = document.getElementById('privacyConsentModal');
    if (!modal) {
        console.warn('⚠️ [PRIVACY] Модалка не найдена');
        return;
    }
    modal.style.display = 'flex';
}

// ===== СКРЫТЬ МОДАЛКУ =====
function hidePrivacyModal() {
    const modal = document.getElementById('privacyConsentModal');
    if (modal) modal.style.display = 'none';
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initPrivacy() {
    // Если согласие уже дано — ничего не делаем
    if (hasPrivacyConsent()) {
        console.log('🔒 [PRIVACY] Согласие уже дано');
        return;
    }
    
    // Показываем модалку
    showPrivacyModal();
    
    // ===== КНОПКА "СОГЛАСЕН" =====
    document.getElementById('privacyAcceptBtn').addEventListener('click', function() {
        localStorage.setItem(PRIVACY_CONSENT_KEY, 'true');
        hidePrivacyModal();
        console.log('✅ [PRIVACY] Согласие дано');
    });
    document.getElementById('privacyAcceptBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        localStorage.setItem(PRIVACY_CONSENT_KEY, 'true');
        hidePrivacyModal();
        console.log('✅ [PRIVACY] Согласие дано (touch)');
    });
    
    // ===== КНОПКА "НЕ СОГЛАСЕН" =====
    document.getElementById('privacyDeclineBtn').addEventListener('click', function() {
        hidePrivacyModal();
        showDeclineMessage();
    });
    document.getElementById('privacyDeclineBtn').addEventListener('touchend', function(e) {
        e.preventDefault();
        hidePrivacyModal();
        showDeclineMessage();
    });
}

// ===== СООБЩЕНИЕ ПРИ ОТКАЗЕ =====
function showDeclineMessage() {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        font-size: 14px;
        z-index: 200;
        max-width: 90%;
        text-align: center;
        border: 1px solid rgba(255,100,100,0.3);
    `;
    popup.innerHTML = `
        ❌ Без согласия игра работает<br>
        <strong>в локальном режиме</strong> — прогресс не сохранится.
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    initPrivacy();
});

// ===== ЭКСПОРТ ДЛЯ ДРУГИХ ФАЙЛОВ =====
window.hasPrivacyConsent = hasPrivacyConsent;