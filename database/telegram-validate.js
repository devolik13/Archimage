// telegram-validate.js - Проверка подлинности Telegram WebApp

function validateTelegramWebAppData() {
    // Проверяем что есть Telegram WebApp
    if (!window.Telegram || !window.Telegram.WebApp) {
        console.warn('Telegram WebApp не найден');
        return false;
    }

    const webApp = window.Telegram.WebApp;
    const initData = webApp.initData;
    const user = webApp.initDataUnsafe?.user;

    // Проверяем что есть данные пользователя
    if (!initData || !user || !user.id) {
        console.warn('Нет данных пользователя Telegram');
        return false;
    }

    // Проверяем что ID положительный (реальный пользователь)
    if (user.id <= 0) {
        console.error('Неверный Telegram ID');
        return false;
    }

    console.log('Telegram валидация пройдена для ID:', user.id);
    return true;
}

// Проверка окружения (dev или prod)
function isDevEnvironment() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.');
}

// Экспортируем для использования
window.validateTelegramWebAppData = validateTelegramWebAppData;
window.isDevEnvironment = isDevEnvironment;
