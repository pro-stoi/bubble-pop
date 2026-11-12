// js/privacy.js

console.log('🔒 [PRIVACY] Файл загружен');

// ===== КЛЮЧ В LOCALSTORAGE =====
const PRIVACY_CONSENT_KEY = 'privacyConsent';

// ===== ПРОВЕРКА СОГЛАСИЯ (всегда true — модалка отключена) =====
function hasPrivacyConsent() {
    // VK сам берёт согласие при первом запуске мини-приложения.
    // Дублирующая модалка не нужна — она отпугивает игроков.
    return true;
}

// ===== ЗАГЛУШКИ (чтобы не было ошибок, если где-то вызываются) =====
function showPrivacyModal() {
    // Модалка отключена
    console.log('🔒 [PRIVACY] showPrivacyModal() — отключено');
}

function hidePrivacyModal() {
    // Модалка отключена
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initPrivacy() {
    // Автоматически ставим согласие в localStorage
    localStorage.setItem(PRIVACY_CONSENT_KEY, 'true');
    localStorage.setItem('privacyConsentDate', new Date().toISOString());
    console.log('✅ [PRIVACY] Согласие дано автоматически (модалка отключена)');
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    initPrivacy();
});

// ===== ЭКСПОРТ ДЛЯ ДРУГИХ ФАЙЛОВ =====
window.hasPrivacyConsent = hasPrivacyConsent;
