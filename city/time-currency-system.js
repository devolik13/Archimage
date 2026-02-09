// time-currency-system.js - Система временной валюты (LAZY ACCRUAL v2)
// Баланс вычисляется: base + elapsed_time * production_rate
// БД пишется только при трате/добавлении/изменении rate

// Конфигурация временной валюты
const TIME_CURRENCY_CONFIG = {
    MINUTE_TO_HOUR: 60,
    HOUR_TO_DAY: 24,
    DAY_TO_WEEK: 7,
    WEEK_TO_MONTH: 4,

    // Генерация в минутах за уровень здания в час реального времени
    GENERATOR_BASE_RATE: 36,    // 36 минут в час на 1 уровне (14.4ч/день)
    GENERATOR_PER_LEVEL: 7.6,   // +7.6 минут за уровень (3 дня/день на 20 уровне)

    // Максимальная вместимость хранилища (офлайн лимит = добыча/день + 20%)
    STORAGE_BASE: 1037,         // 17.3ч на 1 уровне (14.4ч × 1.2)
    STORAGE_PER_LEVEL: 219      // добыча за сутки + 20% на каждый уровень
};

// Серверное время загрузки (для корректного отображения между загрузками)
let _serverLoadTime = null;   // Серверное время на момент загрузки
let _clientLoadTime = null;   // Клиентское время на момент загрузки

// Получить серверное "сейчас" (компенсация разницы клиент-сервер)
function getServerNow() {
    if (_serverLoadTime && _clientLoadTime) {
        const clientElapsed = Date.now() - _clientLoadTime;
        return new Date(_serverLoadTime.getTime() + clientElapsed);
    }
    return new Date(); // fallback на клиентское время
}

// Расчет производства в минутах в час
function calculateProduction() {
    const generatorLevel = window.userData?.buildings?.time_generator?.level || 0;
    if (generatorLevel === 0) return 0;

    return TIME_CURRENCY_CONFIG.GENERATOR_BASE_RATE +
           (generatorLevel - 1) * TIME_CURRENCY_CONFIG.GENERATOR_PER_LEVEL;
}

// Расчет максимальной вместимости (лимит накопления)
function calculateMaxStorage() {
    const generatorLevel = window.userData?.buildings?.time_generator?.level || 0;
    if (generatorLevel === 0) return 0;

    return TIME_CURRENCY_CONFIG.STORAGE_BASE +
           (generatorLevel - 1) * TIME_CURRENCY_CONFIG.STORAGE_PER_LEVEL;
}

// ГЛАВНАЯ ФУНКЦИЯ: Получить текущий баланс (вычисляется, не хранится)
function getTimeCurrency() {
    if (!window.userData) return 0;

    const base = window.userData.time_currency_base || 0;
    const updatedAt = window.userData.time_currency_updated_at;
    const production = calculateProduction();

    // Нет генератора или нет timestamp — возвращаем base
    if (production === 0 || !updatedAt) return base;

    const now = getServerNow();
    const updated = new Date(updatedAt);
    const elapsedHours = (now - updated) / (1000 * 60 * 60);

    if (elapsedHours < 0) return base; // защита от отрицательного времени

    const maxStorage = calculateMaxStorage();
    const earned = Math.min(Math.floor(elapsedHours * production), maxStorage);

    return base + earned;
}

// formatTimeCurrency используется из utilities.js - она уже доступна глобально через window

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

    // Проверяем, не активен ли portrait blocker
    if (document.getElementById('portrait-blocker-overlay')) {
        return;
    }

    // Вычисляем положение правого края города
    const cityView = document.getElementById('city-view');
    const backgroundImg = cityView?.querySelector('.city-background-img');

    let rightPosition = '10px';

    if (backgroundImg) {
        const imgRect = backgroundImg.getBoundingClientRect();
        if (imgRect.width > 0) {
            const screenWidth = window.innerWidth;
            const cityRight = imgRect.right;
            rightPosition = `${screenWidth - cityRight + 10}px`;
        }
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
        title="Лимит накопления: ${window.formatTimeCurrency(maxStorage)}">
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

    const oldCurrency = document.getElementById('time-currency-container');
    if (oldCurrency) oldCurrency.remove();

    document.body.insertAdjacentHTML('beforeend', currencyHTML);
}

// Использование времени (через серверную RPC)
async function useTimeCurrency(minutes, callback) {
    const current = getTimeCurrency();

    if (typeof window.formatTimeCurrency !== 'function') {
        console.error('❌ formatTimeCurrency не найдена');
        return false;
    }

    if (current < minutes) {
        alert(`Недостаточно времени! Нужно: ${window.formatTimeCurrency(minutes)}, есть: ${window.formatTimeCurrency(current)}`);
        return false;
    }

    // Вызываем серверную RPC для атомарной траты
    if (window.dbManager && window.dbManager.supabase) {
        try {
            const { data, error } = await window.dbManager.supabase.rpc('spend_time_currency', {
                p_telegram_id: window.dbManager.getTelegramId(),
                p_amount: Math.floor(minutes)
            });

            if (error) {
                console.error('❌ Ошибка RPC spend_time_currency:', error);
                return useTimeCurrencyLocal(minutes, callback);
            }

            if (data && data.success) {
                window.userData.time_currency_base = data.new_balance;
                window.userData.time_currency_updated_at = new Date().toISOString();
                _serverLoadTime = new Date();
                _clientLoadTime = Date.now();

                createTimeCurrencyUI();
                if (callback) callback();
                return true;
            } else {
                alert(`Недостаточно времени! Нужно: ${window.formatTimeCurrency(minutes)}, есть: ${window.formatTimeCurrency(data?.current || 0)}`);
                return false;
            }
        } catch (err) {
            console.error('❌ Ошибка при трате времени:', err);
            return useTimeCurrencyLocal(minutes, callback);
        }
    }

    return useTimeCurrencyLocal(minutes, callback);
}

// Локальный fallback для траты (если RPC недоступна)
function useTimeCurrencyLocal(minutes, callback) {
    const current = getTimeCurrency();
    if (current < minutes) return false;

    if (window.userData) {
        window.userData.time_currency_base = current - minutes;
        window.userData.time_currency_updated_at = new Date().toISOString();
        _serverLoadTime = new Date();
        _clientLoadTime = Date.now();

        createTimeCurrencyUI();

        if (window.eventSaveManager) {
            window.eventSaveManager.saveDebounced('time_currency_used', 2000);
        }

        if (callback) callback();
        return true;
    }

    return false;
}

// Добавление времени (награды, ежедневный вход)
async function addTimeCurrency(minutes) {
    if (window.dbManager && window.dbManager.supabase) {
        try {
            const { data, error } = await window.dbManager.supabase.rpc('add_time_currency', {
                p_telegram_id: window.dbManager.getTelegramId(),
                p_amount: Math.floor(minutes)
            });

            if (error) {
                console.error('❌ Ошибка RPC add_time_currency:', error);
                addTimeCurrencyLocal(minutes);
                return;
            }

            if (data && data.success) {
                window.userData.time_currency_base = data.new_balance;
                window.userData.time_currency_updated_at = new Date().toISOString();
                _serverLoadTime = new Date();
                _clientLoadTime = Date.now();
                createTimeCurrencyUI();
                return;
            }
        } catch (err) {
            console.error('❌ Ошибка при добавлении времени:', err);
        }
    }

    addTimeCurrencyLocal(minutes);
}

// Локальный fallback для добавления
function addTimeCurrencyLocal(minutes) {
    const current = getTimeCurrency();

    if (window.userData) {
        window.userData.time_currency_base = Math.min(current + minutes, 999999);
        window.userData.time_currency_updated_at = new Date().toISOString();
        _serverLoadTime = new Date();
        _clientLoadTime = Date.now();

        createTimeCurrencyUI();

        if (window.eventSaveManager) {
            window.eventSaveManager.saveDebounced('time_currency_added', 2000);
        }
    }
}

// Снапшот баланса (вызывается при изменении уровня генератора)
async function snapshotTimeCurrency() {
    if (window.dbManager && window.dbManager.supabase) {
        try {
            const { data, error } = await window.dbManager.supabase.rpc('snapshot_time_currency', {
                p_telegram_id: window.dbManager.getTelegramId()
            });

            if (!error && data !== null) {
                window.userData.time_currency_base = data;
                window.userData.time_currency_updated_at = new Date().toISOString();
                _serverLoadTime = new Date();
                _clientLoadTime = Date.now();
                console.log('📸 Снапшот time_currency:', data);
                return data;
            }
        } catch (err) {
            console.error('❌ Ошибка снапшота:', err);
        }
    }

    const current = getTimeCurrency();
    if (window.userData) {
        window.userData.time_currency_base = current;
        window.userData.time_currency_updated_at = new Date().toISOString();
    }
    return current;
}

// Показать уведомление о накоплении
function showOfflineEarningsNotification(earnedMinutes) {
    if (earnedMinutes === 0) return;

    if (typeof window.formatTimeCurrency !== 'function') {
        console.error('❌ formatTimeCurrency не найдена');
        return;
    }

    const oldScreen = document.getElementById('offline-earnings-screen');
    if (oldScreen) oldScreen.remove();

    const faction = window.userData?.faction || 'fire';
    const backgroundPath = `assets/ui/window/tower_${faction}.webp`;

    const screen = document.createElement('div');
    screen.id = 'offline-earnings-screen';
    screen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.9); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    screen.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div id="offline-earnings-wrapper" style="position: relative; display: inline-block;">
                <img id="offline-earnings-bg" src="${backgroundPath}" alt="Фон" style="max-width: 100vw; max-height: 100vh; object-fit: contain; display: block;">
                <div id="offline-earnings-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; box-sizing: border-box;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('offline-earnings-bg');
    const setupUI = () => {
        const overlay = document.getElementById('offline-earnings-overlay');
        if (!overlay || !img) return;
        const rect = img.getBoundingClientRect();
        const scale = Math.min(rect.width / 768, rect.height / 512);
        overlay.style.animation = 'slideUp 0.5s ease';
        overlay.innerHTML = `
            <div style="font-size: ${Math.max(40, 64 * scale)}px; margin-bottom: ${15 * scale}px;">⏰</div>
            <div style="font-size: ${Math.max(18, 28 * scale)}px; font-weight: bold; color: #ffd700; margin-bottom: ${10 * scale}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Добро пожаловать!</div>
            <div style="font-size: ${Math.max(14, 18 * scale)}px; color: #ccc; margin-bottom: ${20 * scale}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">За время вашего отсутствия накоплено:</div>
            <div style="font-size: ${Math.max(24, 40 * scale)}px; font-weight: bold; color: #ffa500; margin-bottom: ${25 * scale}px; text-shadow: 2px 2px 6px rgba(0,0,0,0.8); background: rgba(0,0,0,0.3); padding: ${10 * scale}px ${20 * scale}px; border-radius: ${10 * scale}px; border: 2px solid rgba(255,165,0,0.5);">${window.formatTimeCurrency(earnedMinutes)}</div>
            <button onclick="document.getElementById('offline-earnings-screen').remove()" style="background: linear-gradient(145deg, #ffa500, #ff8c00); border: none; padding: ${12 * scale}px ${35 * scale}px; border-radius: ${10 * scale}px; color: white; font-size: ${Math.max(14, 18 * scale)}px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(255,165,0,0.4);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Отлично! ✨</button>
        `;
    };

    img.onload = setupUI;
    if (img.complete) setupUI();

    setTimeout(() => {
        const s = document.getElementById('offline-earnings-screen');
        if (s) s.remove();
    }, 15000);
}

// Флаг для предотвращения множественных вызовов
let timeCurrencyInitialized = false;

// Инициализация системы (LAZY ACCRUAL v2)
function initTimeCurrency() {
    if (timeCurrencyInitialized) {
        console.log('⏭️ initTimeCurrency уже вызван, пропуск');
        return;
    }

    console.log('💰 Инициализация системы временной валюты (lazy accrual v2)...');
    timeCurrencyInitialized = true;

    // Миграция со старой системы: если нет time_currency_base, берём time_currency
    if (window.userData.time_currency_base == null) {
        window.userData.time_currency_base = window.userData.time_currency || 0;
        window.userData.time_currency_updated_at = window.userData.last_login || new Date().toISOString();
        console.log('🔄 Миграция со старой системы: base =', window.userData.time_currency_base);
    }
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }

    // Вычисляем накопленное для показа уведомления
    const base = window.userData.time_currency_base || 0;
    const currentBalance = getTimeCurrency();
    const earned = currentBalance - base;

    if (earned > 60) { // Показываем если накоплено больше 1 часа
        showOfflineEarningsNotification(earned);
    }

    // Обновляем last_login
    window.userData.last_login = new Date().toISOString();

    // Сохраняем last_login
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('time_currency_init');
    }

    createTimeCurrencyUI();

    // UI обновляется каждые 5 секунд (только отображение, никаких записей в БД!)
    if (!window.timeCurrencyInterval) {
        window.timeCurrencyInterval = setInterval(() => {
            createTimeCurrencyUI();
        }, 5000);
        console.log('⏰ Запущено обновление UI времени каждые 5 сек');
    }
}

// Обновление отображения
function updateTimeCurrencyDisplay() {
    createTimeCurrencyUI();
}

// Очистка интервала
function cleanupTimeCurrency() {
    if (window.timeCurrencyInterval) {
        clearInterval(window.timeCurrencyInterval);
        window.timeCurrencyInterval = null;
    }
}

// СОВМЕСТИМОСТЬ: updateTimeCurrency для кода который вызывает её
function updateTimeCurrency() {
    createTimeCurrencyUI();
}

// Совместимость: calculateOfflineEarnings (теперь не нужна, баланс вычисляется автоматически)
function calculateOfflineEarnings() {
    // В v2 офлайн накопление встроено в getTimeCurrency()
    // Возвращаем 0 т.к. начисление происходит автоматически
    return 0;
}

window.addEventListener('beforeunload', cleanupTimeCurrency);

// Экспорт функций
window.TIME_CURRENCY_CONFIG = TIME_CURRENCY_CONFIG;
window.getTimeCurrency = getTimeCurrency;
window.calculateProduction = calculateProduction;
window.calculateMaxStorage = calculateMaxStorage;
window.createTimeCurrencyUI = createTimeCurrencyUI;
window.updateTimeCurrency = updateTimeCurrency;
window.updateTimeCurrencyDisplay = updateTimeCurrencyDisplay;
window.useTimeCurrency = useTimeCurrency;
window.addTimeCurrency = addTimeCurrency;
window.calculateOfflineEarnings = calculateOfflineEarnings;
window.showOfflineEarningsNotification = showOfflineEarningsNotification;
window.initTimeCurrency = initTimeCurrency;
window.cleanupTimeCurrency = cleanupTimeCurrency;
window.snapshotTimeCurrency = snapshotTimeCurrency;
window.setServerTime = function(serverTime) {
    _serverLoadTime = new Date(serverTime);
    _clientLoadTime = Date.now();
};
