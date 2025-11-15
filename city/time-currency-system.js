// time-currency-system.js - Система временной валюты
console.log('✅ time-currency-system.js загружен');

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
    
    const currencyHTML = `
        <div id="time-currency-container" style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(44, 44, 61, 0.95);
            padding: 10px 15px;
            border-radius: 8px;
            border: 2px solid #ffa500;
            color: white;
            font-size: 14px;
            z-index: 100;
            min-width: 150px;
        ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 20px;">⏰</span>
                <div>
                    <div style="font-weight: bold; color: #ffa500;">
                        ${window.formatTimeCurrency(currentTime)}
                    </div>
                    <div style="font-size: 11px; color: #aaa;">
                        Макс: ${window.formatTimeCurrency(maxStorage)}
                    </div>
                </div>
            </div>
            ${production > 0 ? `
                <div style="font-size: 11px; color: #4ade80; margin-top: 5px; padding-top: 5px; border-top: 1px solid #444;">
                    +${production} мин/час
                </div>
            ` : ''}
        </div>
    `;
    
    // Удаляем старый если есть
    const oldCurrency = document.getElementById('time-currency-container');
    if (oldCurrency) oldCurrency.remove();
    
    // Добавляем новый
    document.body.insertAdjacentHTML('beforeend', currencyHTML);
}

// Обновление валюты (вызывается каждую минуту)
function updateTimeCurrency() {
    const production = calculateProduction();
    if (production === 0) return;
    
    const maxStorage = calculateMaxStorage();
    const currentTime = getTimeCurrency();
    const perMinute = production / 60;
    
    const newAmount = Math.min(currentTime + perMinute, maxStorage);
    
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
        
        // Сохраняем на сервер
        saveTimeCurrency();
        
        if (callback) callback();
        return true;
    }
    
    return false;
}

// Добавление времени (награды)
function addTimeCurrency(minutes) {
    const maxStorage = calculateMaxStorage();
    const current = getTimeCurrency();
    
    if (window.userData) {
        window.userData.time_currency = Math.min(current + minutes, maxStorage);
        createTimeCurrencyUI();
        saveTimeCurrency();
    }
}

// Сохранение на сервер
async function saveTimeCurrency() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/time-currency/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: window.userId,
                time_currency: window.userData.time_currency
            })
        });
        
        if (!response.ok) {
            console.error('Ошибка сохранения валюты');
        }
    } catch (error) {
        console.error('Ошибка сети при сохранении валюты:', error);
    }
}

// Инициализация системы
function initTimeCurrency() {
    // Инициализация валюты если её нет
    if (!window.userData.time_currency) {
        window.userData.time_currency = 0;
    }
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }
    
    createTimeCurrencyUI();
    
    // Обновляем каждую минуту
    setInterval(updateTimeCurrency, 60000);
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
window.initTimeCurrency = initTimeCurrency;

console.log('💰 Система временной валюты инициализирована');