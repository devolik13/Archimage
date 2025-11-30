// time-currency-system.js - Система временной валюты

// Конфигурация временной валюты
const TIME_CURRENCY_CONFIG = {
    MINUTE_TO_HOUR: 60,
    HOUR_TO_DAY: 24,
    DAY_TO_WEEK: 7,
    WEEK_TO_MONTH: 4,
    
    // Генерация в минутах за уровень здания в час реального времени
    GENERATOR_BASE_RATE: 60,  // 60 минут в час на 1 уровне
    GENERATOR_PER_LEVEL: 30,  // +30 минут за каждый уровень
    
    // Максимальная вместимость хранилища
    STORAGE_BASE: 1440,  // 24 часа (1 день) на 1 уровне
    STORAGE_PER_LEVEL: 720  // +12 часов за уровень
};

// Получить текущий баланс времени в минутах
function getTimeCurrency() {
    if (!window.userData) return 0;
    return window.userData.time_currency || 0;
}

// formatTimeCurrency используется из utilities.js - она уже доступна глобально через window

// Расчет производства в минутах в час
function calculateProduction() {
    const generatorLevel = window.userData?.buildings?.time_generator?.level || 0;
    if (generatorLevel === 0) return 0;
    
    return TIME_CURRENCY_CONFIG.GENERATOR_BASE_RATE + 
           (generatorLevel - 1) * TIME_CURRENCY_CONFIG.GENERATOR_PER_LEVEL;
}

// Расчет максимальной вместимости
function calculateMaxStorage() {
    const generatorLevel = window.userData?.buildings?.time_generator?.level || 0;
    if (generatorLevel === 0) return 0;
    
    return TIME_CURRENCY_CONFIG.STORAGE_BASE + 
           (generatorLevel - 1) * TIME_CURRENCY_CONFIG.STORAGE_PER_LEVEL;
}

// Создание UI элемента валюты
function createTimeCurrencyUI() {
    const currentTime = getTimeCurrency();
    const maxStorage = calculateMaxStorage();
    const production = calculateProduction();

    // Проверяем, что formatTimeCurrency доступна
    if (typeof window.formatTimeCurrency !== 'function') {
        console.error('❌ formatTimeCurrency не найдена. Убедитесь, что utilities.js загружен первым!');
        return;
    }

    // Вычисляем положение правого края города
    const cityView = document.getElementById('city-view');
    const backgroundImg = cityView?.querySelector('.city-background-img');

    let rightPosition = '10px'; // Дефолт

    if (backgroundImg) {
        const imgRect = backgroundImg.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const cityRight = imgRect.right;
        rightPosition = `${screenWidth - cityRight + 10}px`;
        console.log(`📍 Время привязано к городу: right = ${rightPosition}`);
    }

    const currencyHTML = `
        <div id="time-currency-container" style="
            position: fixed;
            top: 10px;
            right: ${rightPosition};
            background: rgba(0, 0, 0, 0.4);
            padding: 8px 12px;
            border-radius: 25px;
            border: 1px solid rgba(255, 165, 0, 0.5);
            color: white;
            z-index: 100;
            backdrop-filter: blur(5px);
            cursor: pointer;
            transition: all 0.3s;
        "
        onclick="if(typeof window.showTimeGeneratorModalBg === 'function') { window.showTimeGeneratorModalBg(); } else if(typeof window.showTimeGeneratorModal === 'function') { window.showTimeGeneratorModal(); }"
        onmouseover="this.style.background='rgba(0, 0, 0, 0.6)'; this.style.borderColor='rgba(255, 165, 0, 0.8)';"
        onmouseout="this.style.background='rgba(0, 0, 0, 0.4)'; this.style.borderColor='rgba(255, 165, 0, 0.5)';"
        title="Лимит офлайн: ${window.formatTimeCurrency(maxStorage)}">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">⏰</span>
                <div style="font-weight: bold; color: #ffa500; font-size: 14px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    ${window.formatTimeCurrency(currentTime)}
                </div>
                ${production > 0 ? `
                    <div style="font-size: 11px; color: #4ade80; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                        +${production}/ч
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Удаляем старый если есть
    const oldCurrency = document.getElementById('time-currency-container');
    if (oldCurrency) oldCurrency.remove();

    // Добавляем новый
    document.body.insertAdjacentHTML('beforeend', currencyHTML);
}

// Обновление валюты (вызывается каждую минуту) - БЕЗЛИМИТНОЕ онлайн накопление
function updateTimeCurrency() {
    const production = calculateProduction();
    if (production === 0) return;

    const currentTime = getTimeCurrency();
    const perMinute = production / 60;

    // Убрали maxStorage проверку - онлайн накопление безлимитное!
    const newAmount = currentTime + perMinute;

    if (window.userData) {
        window.userData.time_currency = Math.floor(newAmount);
    }

    // Обновляем отображение
    createTimeCurrencyUI();
}

// Использование времени для ускорения
function useTimeCurrency(minutes, callback) {
    const current = getTimeCurrency();
    
    // Проверяем доступность formatTimeCurrency
    if (typeof window.formatTimeCurrency !== 'function') {
        console.error('❌ formatTimeCurrency не найдена');
        alert(`Недостаточно времени! Нужно: ${minutes} мин, есть: ${current} мин`);
        return false;
    }
    
    if (current < minutes) {
        alert(`Недостаточно времени! Нужно: ${window.formatTimeCurrency(minutes)}, есть: ${window.formatTimeCurrency(current)}`);
        return false;
    }
    
    if (window.userData) {
        window.userData.time_currency -= minutes;
        createTimeCurrencyUI();

        // Сохранение происходит через event-save-manager
        if (window.eventSaveManager) {
            window.eventSaveManager.saveDebounced('time_currency_used', 2000);
        }

        if (callback) callback();
        return true;
    }
    
    return false;
}

// Добавление времени (награды) - БЕЗЛИМИТНОЕ
function addTimeCurrency(minutes) {
    const current = getTimeCurrency();

    if (window.userData) {
        // Убрали maxStorage проверку - можно добавлять сколько угодно!
        window.userData.time_currency = current + minutes;
        createTimeCurrencyUI();

        // Сохранение происходит через event-save-manager
        if (window.eventSaveManager) {
            window.eventSaveManager.saveDebounced('time_currency_added', 2000);
        }
    }
}

// Расчет офлайн накопления (с лимитом хранилища)
function calculateOfflineEarnings() {
    if (!window.userData || !window.userData.last_login) {
        console.log('⏰ Первый вход - офлайн накопление не рассчитывается');
        return 0;
    }

    const now = new Date();
    const lastLogin = new Date(window.userData.last_login);
    const hoursOffline = (now - lastLogin) / (1000 * 60 * 60); // Часы

    if (hoursOffline < 0.016) { // Меньше 1 минуты
        return 0;
    }

    const production = calculateProduction(); // мин/час
    if (production === 0) {
        console.log('⏰ Генератор времени не построен');
        return 0;
    }

    const maxStorage = calculateMaxStorage(); // мин
    const potentialEarnings = Math.floor(hoursOffline * production); // мин

    // ЛИМИТ: можно накопить максимум вместимость хранилища
    const actualEarnings = Math.min(potentialEarnings, maxStorage);

    console.log(`⏰ Офлайн накопление: ${hoursOffline.toFixed(1)}ч × ${production}мин/ч = ${potentialEarnings}мин`);
    console.log(`⏰ С учетом лимита хранилища (${maxStorage}мин): ${actualEarnings}мин`);

    return actualEarnings;
}

// Показать уведомление о накоплении за офлайн
function showOfflineEarningsNotification(earnedMinutes) {
    if (earnedMinutes === 0) return;

    if (typeof window.formatTimeCurrency !== 'function') {
        console.error('❌ formatTimeCurrency не найдена');
        return;
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #2c2c3d, #1a1a2e);
        border: 3px solid #ffa500;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideDown 0.5s ease-out;
    `;

    notification.innerHTML = `
        <style>
            @keyframes slideDown {
                from { transform: translate(-50%, -70%); opacity: 0; }
                to { transform: translate(-50%, -50%); opacity: 1; }
            }
        </style>
        <div style="font-size: 48px; margin-bottom: 15px;">⏰</div>
        <div style="font-size: 20px; font-weight: bold; color: white; margin-bottom: 10px;">
            Добро пожаловать!
        </div>
        <div style="font-size: 16px; color: #aaa; margin-bottom: 20px;">
            За время вашего отсутствия накоплено:
        </div>
        <div style="font-size: 32px; font-weight: bold; color: #ffa500; margin-bottom: 25px;">
            ${window.formatTimeCurrency(earnedMinutes)}
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: #ffa500;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Отлично!
        </button>
    `;

    document.body.appendChild(notification);

    // Автоудаление через 10 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Флаг для предотвращения множественных вызовов
let timeCurrencyInitialized = false;
let offlineNotificationShown = false;

// Инициализация системы
function initTimeCurrency() {
    // КРИТИЧНО: Предотвращаем повторную инициализацию
    if (timeCurrencyInitialized) {
        console.log('⏭️ initTimeCurrency уже вызван, пропуск');
        return;
    }

    console.log('💰 Инициализация системы временной валюты...');
    timeCurrencyInitialized = true;

    // Инициализация валюты если её нет
    if (!window.userData.time_currency) {
        window.userData.time_currency = 0;
    }
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }

    // Рассчитываем и добавляем офлайн накопление
    const offlineEarnings = calculateOfflineEarnings();
    if (offlineEarnings > 0 && !offlineNotificationShown) {
        window.userData.time_currency += offlineEarnings;
        offlineNotificationShown = true; // Устанавливаем флаг ДО показа уведомления
        showOfflineEarningsNotification(offlineEarnings);

        // Сохраняем обновленное значение
        if (window.eventSaveManager) {
            window.eventSaveManager.saveImmediate('offline_earnings_added');
        }
    }

    createTimeCurrencyUI();

    // Обновляем каждую минуту (только если интервал еще не запущен)
    if (!window.timeCurrencyInterval) {
        window.timeCurrencyInterval = setInterval(updateTimeCurrency, 60000);
        console.log('⏰ Запущен интервал обновления временной валюты');
    }
}

// Экспорт функций
window.TIME_CURRENCY_CONFIG = TIME_CURRENCY_CONFIG;
window.getTimeCurrency = getTimeCurrency;
// formatTimeCurrency НЕ экспортируем - используем из utilities.js
window.calculateProduction = calculateProduction;
window.calculateMaxStorage = calculateMaxStorage;
window.createTimeCurrencyUI = createTimeCurrencyUI;
window.updateTimeCurrency = updateTimeCurrency;
window.useTimeCurrency = useTimeCurrency;
window.addTimeCurrency = addTimeCurrency;
window.calculateOfflineEarnings = calculateOfflineEarnings;
window.showOfflineEarningsNotification = showOfflineEarningsNotification;
window.initTimeCurrency = initTimeCurrency;

