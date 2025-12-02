// shop-modal.js - Модальное окно магазина

// Текущая вкладка магазина
let currentShopTab = 'free';

// Конфигурация товаров
const SHOP_CONFIG = {
    // Бесплатные товары (за time_currency)
    free: [
        {
            id: 'energy_1',
            name: '+1 Энергия боя',
            description: 'Восстановить 1 попытку PvP',
            icon: '⚡',
            price: 120, // 2 часа времени
            currency: 'time',
            action: 'buyEnergy',
            amount: 1
        },
        {
            id: 'energy_3',
            name: '+3 Энергии боя',
            description: 'Восстановить 3 попытки PvP',
            icon: '⚡⚡⚡',
            price: 300, // ~5 часов (скидка)
            currency: 'time',
            action: 'buyEnergy',
            amount: 3
        },
        {
            id: 'energy_full',
            name: 'Полная энергия',
            description: 'Восстановить все 12 попыток',
            icon: '🔋',
            price: 1000, // ~16 часов (большая скидка)
            currency: 'time',
            action: 'buyEnergy',
            amount: 12
        },
        {
            id: 'exp_scroll_small',
            name: 'Свиток опыта (малый)',
            description: '+50 опыта выбранному магу',
            icon: '📜',
            price: 60, // 1 час
            currency: 'time',
            action: 'buyExpScroll',
            amount: 50
        },
        {
            id: 'exp_scroll_medium',
            name: 'Свиток опыта (средний)',
            description: '+150 опыта выбранному магу',
            icon: '📜📜',
            price: 150, // 2.5 часа (скидка)
            currency: 'time',
            action: 'buyExpScroll',
            amount: 150
        },
        {
            id: 'exp_scroll_large',
            name: 'Свиток опыта (большой)',
            description: '+500 опыта выбранному магу',
            icon: '📜📜📜',
            price: 400, // ~6.5 часов (большая скидка)
            currency: 'time',
            action: 'buyExpScroll',
            amount: 500
        }
    ],

    // Premium товары (за Telegram Stars)
    premium: [
        {
            id: 'time_pack_small',
            name: 'Пакет времени (малый)',
            description: '+1 день времени',
            icon: '⏰',
            price: 50,
            currency: 'stars',
            action: 'buyTimePack',
            amount: 1440 // 1 день в минутах
        },
        {
            id: 'time_pack_medium',
            name: 'Пакет времени (средний)',
            description: '+7 дней времени',
            icon: '⏰⏰',
            price: 250,
            currency: 'stars',
            action: 'buyTimePack',
            amount: 10080 // 7 дней (бонус ~30%)
        },
        {
            id: 'time_pack_large',
            name: 'Пакет времени (большой)',
            description: '+30 дней времени',
            icon: '⏰⏰⏰',
            price: 750,
            currency: 'stars',
            action: 'buyTimePack',
            amount: 43200 // 30 дней (бонус ~50%)
        },
        {
            id: 'faction_change',
            name: 'Смена фракции',
            description: 'Изменить школу магии',
            icon: '🔄',
            price: 500,
            currency: 'stars',
            action: 'changeFaction',
            amount: 1,
            checkFree: true // Проверить бесплатную смену
        }
    ]
};

/**
 * Открыть магазин
 */
function showShopModal() {
    console.log('🛒 Открытие магазина');

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Определяем фон по фракции (используем фоны гильдии)
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/guild/guild_${faction}.webp`;

    // Удаляем старый экран
    let screen = document.getElementById('shop-screen');
    if (screen) screen.remove();

    // Создаём экран
    screen = document.createElement('div');
    screen.id = 'shop-screen';
    screen.className = 'shop-screen active';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="shop-bg-image" id="shop-bg-image" src="${imagePath}" alt="Магазин">
            <div class="shop-ui-overlay" id="shop-ui-overlay"></div>
        </div>
    `;

    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('shop-bg-image');

    // Настройка UI после загрузки изображения
    img.onload = () => setupShopUI();
    if (img.complete) setupShopUI();

    // Обработка ошибки загрузки - fallback
    img.onerror = () => {
        console.warn('⚠️ Фон магазина не найден, используем fallback');
        setupShopUIFallback(screen);
    };
}

/**
 * Настройка UI магазина поверх изображения
 */
function setupShopUI() {
    const img = document.getElementById('shop-bg-image');
    const overlay = document.getElementById('shop-ui-overlay');

    if (!img || !overlay) return;

    const rect = img.getBoundingClientRect();

    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        overflow-y: auto;
        overflow-x: hidden;
    `;

    renderShopContent(overlay, rect);
}

/**
 * Fallback UI без фона
 */
function setupShopUIFallback(screen) {
    screen.innerHTML = '';
    screen.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

    const container = document.createElement('div');
    container.id = 'shop-ui-overlay';
    container.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
    `;
    screen.appendChild(container);

    renderShopContent(container, { width: window.innerWidth, height: window.innerHeight });
}

/**
 * Рендер содержимого магазина
 */
function renderShopContent(container, rect) {
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;
    const scale = Math.min(scaleX, scaleY);

    const titleFontSize = Math.max(18, 24 * scale);
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);

    // Текущий баланс времени
    const timeCurrency = window.userData?.time_currency || 0;
    const formattedTime = window.formatTimeCurrency ? window.formatTimeCurrency(timeCurrency) : `${timeCurrency} мин`;

    container.innerHTML = `
        <div style="padding: 15px; height: 100%; display: flex; flex-direction: column; pointer-events: auto;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <h2 style="margin: 0; color: #ffd700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                        🛒 Магазин
                    </h2>
                    <div style="color: #ffa500; font-size: ${baseFontSize}px; margin-top: 5px;">
                        ⏰ Баланс: ${formattedTime}
                    </div>
                </div>
                <button onclick="closeShopModal()" style="
                    background: rgba(255,100,100,0.3);
                    border: 1px solid rgba(255,100,100,0.5);
                    color: white;
                    font-size: ${titleFontSize}px;
                    cursor: pointer;
                    padding: 5px 15px;
                    border-radius: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,100,100,0.5)'"
                   onmouseout="this.style.background='rgba(255,100,100,0.3)'">✕</button>
            </div>

            <!-- Табы -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button class="shop-tab ${currentShopTab === 'free' ? 'active' : ''}"
                        onclick="switchShopTab('free')"
                        style="font-size: ${baseFontSize}px;">
                    ⏰ За время
                </button>
                <button class="shop-tab ${currentShopTab === 'premium' ? 'active' : ''}"
                        onclick="switchShopTab('premium')"
                        style="font-size: ${baseFontSize}px;">
                    💎 Premium
                </button>
            </div>

            <!-- Товары -->
            <div id="shop-items-container" style="
                flex: 1;
                overflow-y: auto;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 10px;
                padding-right: 5px;
            ">
                ${renderShopItems(currentShopTab, scale)}
            </div>
        </div>
    `;
}

/**
 * Рендер списка товаров
 */
function renderShopItems(tab, scale) {
    const items = SHOP_CONFIG[tab] || [];
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);
    const timeCurrency = window.userData?.time_currency || 0;

    return items.map(item => {
        // Проверяем доступность
        let canBuy = true;
        let priceText = '';
        let btnClass = 'shop-buy-btn';

        if (item.currency === 'time') {
            canBuy = timeCurrency >= item.price;
            priceText = window.formatTimeCurrency ? window.formatTimeCurrency(item.price) : `${item.price} мин`;
        } else if (item.currency === 'stars') {
            priceText = `⭐ ${item.price}`;
            btnClass += ' premium';

            // Проверяем бесплатную смену фракции
            if (item.checkFree && !window.userData?.faction_changed) {
                priceText = 'Бесплатно';
                canBuy = true;
            }
        }

        // Проверяем лимиты для энергии
        if (item.action === 'buyEnergy') {
            const currentEnergy = window.userData?.battle_energy?.current || 0;
            const maxEnergy = window.BATTLE_ENERGY?.MAX || 12;
            if (currentEnergy >= maxEnergy) {
                canBuy = false;
            }
        }

        return `
            <div class="shop-item-card ${!canBuy ? 'disabled' : ''}"
                 onclick="${canBuy ? `buyShopItem('${item.id}')` : ''}"
                 style="text-align: center;">
                <div style="font-size: ${baseFontSize * 2}px; margin-bottom: 8px;">
                    ${item.icon}
                </div>
                <div style="color: #ffd700; font-size: ${baseFontSize}px; font-weight: bold; margin-bottom: 5px;">
                    ${item.name}
                </div>
                <div style="color: #aaa; font-size: ${smallFontSize}px; margin-bottom: 10px;">
                    ${item.description}
                </div>
                <button class="${btnClass}" ${!canBuy ? 'disabled' : ''} style="font-size: ${smallFontSize}px;">
                    ${priceText}
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Переключение вкладки
 */
function switchShopTab(tab) {
    currentShopTab = tab;

    const overlay = document.getElementById('shop-ui-overlay');
    const img = document.getElementById('shop-bg-image');

    if (overlay) {
        const rect = img ? img.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        renderShopContent(overlay, rect);
    }
}

/**
 * Покупка товара
 */
function buyShopItem(itemId) {
    // Находим товар
    let item = null;
    for (const tab of ['free', 'premium']) {
        item = SHOP_CONFIG[tab].find(i => i.id === itemId);
        if (item) break;
    }

    if (!item) {
        console.error('❌ Товар не найден:', itemId);
        return;
    }

    console.log('🛒 Покупка:', item.name);

    // Выполняем действие
    switch (item.action) {
        case 'buyEnergy':
            buyEnergy(item);
            break;
        case 'buyExpScroll':
            buyExpScroll(item);
            break;
        case 'buyTimePack':
            buyTimePack(item);
            break;
        case 'changeFaction':
            showChangeFactionDialog(item);
            break;
        default:
            console.warn('⚠️ Неизвестное действие:', item.action);
    }
}

/**
 * Покупка энергии
 */
function buyEnergy(item) {
    const timeCurrency = window.userData?.time_currency || 0;

    if (timeCurrency < item.price) {
        showShopNotification('❌ Недостаточно времени!', 'error');
        return;
    }

    const currentEnergy = window.userData?.battle_energy?.current || 0;
    const maxEnergy = window.BATTLE_ENERGY?.MAX || 12;

    if (currentEnergy >= maxEnergy) {
        showShopNotification('⚡ Энергия уже полная!', 'warning');
        return;
    }

    // Списываем валюту
    window.userData.time_currency -= item.price;

    // Добавляем энергию (не превышая максимум)
    const newEnergy = Math.min(currentEnergy + item.amount, maxEnergy);
    const actualAdded = newEnergy - currentEnergy;
    window.userData.battle_energy.current = newEnergy;

    // Сохраняем
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('shop_buy_energy');
    }

    showShopNotification(`⚡ +${actualAdded} энергии!`, 'success');
    refreshShopUI();

    // Обновляем UI времени если есть
    if (typeof window.updateTimeCurrencyDisplay === 'function') {
        window.updateTimeCurrencyDisplay();
    }
}

/**
 * Покупка свитка опыта
 */
function buyExpScroll(item) {
    const timeCurrency = window.userData?.time_currency || 0;

    if (timeCurrency < item.price) {
        showShopNotification('❌ Недостаточно времени!', 'error');
        return;
    }

    // Показываем диалог выбора мага
    showWizardSelectDialog(item);
}

/**
 * Диалог выбора мага для свитка
 */
function showWizardSelectDialog(item) {
    const wizards = window.userData?.wizards || [];

    if (wizards.length === 0) {
        showShopNotification('❌ Нет доступных магов!', 'error');
        return;
    }

    // Создаём диалог
    const dialog = document.createElement('div');
    dialog.id = 'wizard-select-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9500;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const wizardCards = wizards.map((wizard, index) => {
        const expToNext = wizard.exp_to_next || window.calculateExpToNext?.(wizard.level) || 100;
        const currentExp = wizard.experience || 0;
        const isMaxLevel = wizard.level >= 20;

        return `
            <div onclick="${isMaxLevel ? '' : `applyExpScroll(${index}, ${item.price}, ${item.amount})`}"
                 style="
                    background: ${isMaxLevel ? 'rgba(100,100,100,0.5)' : 'rgba(0,0,0,0.6)'};
                    border: 1px solid ${isMaxLevel ? '#666' : 'rgba(255,215,0,0.3)'};
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    cursor: ${isMaxLevel ? 'not-allowed' : 'pointer'};
                    transition: all 0.2s;
                    opacity: ${isMaxLevel ? '0.5' : '1'};
                 "
                 ${isMaxLevel ? '' : 'onmouseover="this.style.borderColor=\'#ffd700\'"'}
                 ${isMaxLevel ? '' : 'onmouseout="this.style.borderColor=\'rgba(255,215,0,0.3)\'"'}>
                <div style="font-size: 24px; margin-bottom: 8px;">🧙</div>
                <div style="color: #ffd700; font-weight: bold;">${wizard.name || 'Маг ' + (index + 1)}</div>
                <div style="color: #aaa; font-size: 12px;">Уровень ${wizard.level || 1}</div>
                <div style="color: #4ade80; font-size: 11px;">
                    ${isMaxLevel ? 'MAX' : `${currentExp}/${expToNext} EXP`}
                </div>
            </div>
        `;
    }).join('');

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <h3 style="color: #ffd700; margin: 0 0 15px 0; text-align: center;">
                📜 Выберите мага (+${item.amount} EXP)
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${wizardCards}
            </div>
            <button onclick="closeWizardSelectDialog()" style="
                width: 100%;
                margin-top: 15px;
                padding: 10px;
                background: rgba(255,100,100,0.3);
                border: 1px solid rgba(255,100,100,0.5);
                border-radius: 8px;
                color: white;
                cursor: pointer;
            ">Отмена</button>
        </div>
    `;

    document.body.appendChild(dialog);
}

/**
 * Применить свиток опыта к магу
 */
function applyExpScroll(wizardIndex, price, expAmount) {
    const wizard = window.userData?.wizards?.[wizardIndex];

    if (!wizard) {
        showShopNotification('❌ Маг не найден!', 'error');
        closeWizardSelectDialog();
        return;
    }

    if (wizard.level >= 20) {
        showShopNotification('❌ Маг уже максимального уровня!', 'error');
        closeWizardSelectDialog();
        return;
    }

    // Списываем валюту
    window.userData.time_currency -= price;

    // Добавляем опыт
    if (typeof window.addExperienceToWizard === 'function') {
        window.addExperienceToWizard(wizard, expAmount);
    } else {
        wizard.experience = (wizard.experience || 0) + expAmount;
    }

    // Сохраняем
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('shop_buy_exp_scroll');
    }

    showShopNotification(`📜 +${expAmount} EXP для ${wizard.name || 'мага'}!`, 'success');
    closeWizardSelectDialog();
    refreshShopUI();

    // Обновляем UI
    if (typeof window.updateTimeCurrencyDisplay === 'function') {
        window.updateTimeCurrencyDisplay();
    }
}

/**
 * Закрыть диалог выбора мага
 */
function closeWizardSelectDialog() {
    const dialog = document.getElementById('wizard-select-dialog');
    if (dialog) dialog.remove();
}

/**
 * Покупка пакета времени (Premium) через Telegram Stars
 */
async function buyTimePack(item) {
    // Проверяем доступность Telegram WebApp
    if (!window.Telegram?.WebApp) {
        showShopNotification('⚠️ Доступно только в Telegram', 'warning');
        return;
    }

    try {
        // Создаём invoice для Telegram Stars
        const invoiceData = {
            title: item.name,
            description: item.description,
            payload: JSON.stringify({
                item_id: item.id,
                amount: item.amount,
                user_id: window.userData?.id
            }),
            currency: 'XTR', // Telegram Stars
            prices: [{ label: item.name, amount: item.price }]
        };

        console.log('🌟 Создание платежа Stars:', invoiceData);

        // Открываем окно оплаты Telegram
        // Примечание: для реальной работы нужен бэкенд который создаёт invoice
        window.Telegram.WebApp.openInvoice(
            await createStarsInvoice(item),
            (status) => {
                if (status === 'paid') {
                    // Успешная оплата
                    window.userData.time_currency = (window.userData.time_currency || 0) + item.amount;

                    if (window.eventSaveManager) {
                        window.eventSaveManager.saveImmediate('shop_stars_purchase');
                    }

                    showShopNotification(`⏰ +${formatTimePurchase(item.amount)} времени!`, 'success');
                    refreshShopUI();

                    if (typeof window.updateTimeCurrencyDisplay === 'function') {
                        window.updateTimeCurrencyDisplay();
                    }
                } else if (status === 'cancelled') {
                    showShopNotification('Покупка отменена', 'info');
                } else if (status === 'failed') {
                    showShopNotification('❌ Ошибка оплаты', 'error');
                }
            }
        );
    } catch (error) {
        console.error('❌ Ошибка Stars платежа:', error);
        showShopNotification('⚠️ Платёжная система временно недоступна', 'warning');
    }
}

/**
 * Создание invoice для Telegram Stars (заглушка - нужен бэкенд)
 */
async function createStarsInvoice(item) {
    // TODO: Реализовать на бэкенде через Telegram Bot API
    // POST /createInvoiceLink с параметрами:
    // - title, description, payload, currency: "XTR", prices

    // Пока возвращаем заглушку
    console.log('⚠️ Нужен бэкенд для создания invoice');
    throw new Error('Backend not implemented');
}

/**
 * Форматирование времени для покупки
 */
function formatTimePurchase(minutes) {
    if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    }
    return `${minutes} минут`;
}

/**
 * Диалог смены фракции
 */
function showChangeFactionDialog(item) {
    const isFree = !window.userData?.faction_changed;

    // Показываем выбор фракции
    const factions = ['fire', 'water', 'earth', 'wind', 'nature', 'poison'];
    const currentFaction = window.userData?.faction || 'fire';

    const factionNames = {
        fire: '🔥 Огонь',
        water: '💧 Вода',
        earth: '🪨 Земля',
        wind: '💨 Ветер',
        nature: '🌿 Природа',
        poison: '☠️ Яд'
    };

    const dialog = document.createElement('div');
    dialog.id = 'faction-change-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9500;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const factionButtons = factions
        .filter(f => f !== currentFaction)
        .map(faction => `
            <button onclick="confirmFactionChange('${faction}')" style="
                padding: 15px 20px;
                background: rgba(0,0,0,0.6);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 10px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='#ffd700'; this.style.background='rgba(0,0,0,0.8)'"
               onmouseout="this.style.borderColor='rgba(255,215,0,0.3)'; this.style.background='rgba(0,0,0,0.6)'">
                ${factionNames[faction]}
            </button>
        `).join('');

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            max-width: 350px;
            text-align: center;
        ">
            <h3 style="color: #ffd700; margin: 0 0 10px 0;">🔄 Смена фракции</h3>
            <p style="color: #aaa; font-size: 14px; margin-bottom: 15px;">
                ${isFree ? 'Первая смена бесплатно!' : `Стоимость: $${item.price}`}
            </p>
            <p style="color: #ff6b6b; font-size: 12px; margin-bottom: 15px;">
                ⚠️ Ваши маги будут заменены на магов новой фракции!
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${factionButtons}
            </div>
            <button onclick="closeFactionChangeDialog()" style="
                width: 100%;
                margin-top: 15px;
                padding: 10px;
                background: rgba(255,100,100,0.3);
                border: 1px solid rgba(255,100,100,0.5);
                border-radius: 8px;
                color: white;
                cursor: pointer;
            ">Отмена</button>
        </div>
    `;

    document.body.appendChild(dialog);
}

/**
 * Подтверждение смены фракции
 */
async function confirmFactionChange(newFaction) {
    const isFree = !window.userData?.faction_changed;

    if (!isFree) {
        // Платная смена через Stars
        if (!window.Telegram?.WebApp) {
            showShopNotification('⚠️ Доступно только в Telegram', 'warning');
            closeFactionChangeDialog();
            return;
        }

        try {
            // Открываем оплату Stars
            window.Telegram.WebApp.openInvoice(
                await createStarsInvoice({
                    id: 'faction_change',
                    name: 'Смена фракции',
                    description: 'Изменить школу магии',
                    price: 500
                }),
                (status) => {
                    if (status === 'paid') {
                        applyFactionChange(newFaction);
                    } else if (status === 'cancelled') {
                        showShopNotification('Покупка отменена', 'info');
                    } else {
                        showShopNotification('❌ Ошибка оплаты', 'error');
                    }
                    closeFactionChangeDialog();
                }
            );
        } catch (error) {
            console.error('❌ Ошибка Stars платежа:', error);
            showShopNotification('⚠️ Платёжная система временно недоступна', 'warning');
            closeFactionChangeDialog();
        }
        return;
    }

    // Бесплатная первая смена
    applyFactionChange(newFaction);
    closeFactionChangeDialog();
}

/**
 * Применить смену фракции
 */
function applyFactionChange(newFaction) {
    // Меняем фракцию
    window.userData.faction = newFaction;
    window.userData.faction_changed = true;

    // Сбрасываем магов (нужно создать новых для новой фракции)
    // TODO: Реализовать создание магов новой фракции
    window.userData.wizards = [];

    // Сохраняем
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('faction_changed');
    }

    const factionNames = {
        fire: 'Огонь',
        water: 'Вода',
        earth: 'Земля',
        wind: 'Ветер',
        nature: 'Природа',
        poison: 'Яд'
    };

    showShopNotification(`🔄 Фракция изменена на ${factionNames[newFaction]}!`, 'success');
    closeShopModal();

    // Перезагружаем город
    if (typeof window.initCityView === 'function') {
        window.initCityView();
    }
}

/**
 * Закрыть диалог смены фракции
 */
function closeFactionChangeDialog() {
    const dialog = document.getElementById('faction-change-dialog');
    if (dialog) dialog.remove();
}

/**
 * Обновить UI магазина
 */
function refreshShopUI() {
    const overlay = document.getElementById('shop-ui-overlay');
    const img = document.getElementById('shop-bg-image');

    if (overlay) {
        const rect = img ? img.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        renderShopContent(overlay, rect);
    }
}

/**
 * Показать уведомление
 */
function showShopNotification(message, type = 'info') {
    const colors = {
        success: '#4ade80',
        error: '#ff6b6b',
        warning: '#ffa500',
        info: '#60a5fa'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid ${colors[type]};
        border-radius: 10px;
        padding: 15px 25px;
        color: ${colors[type]};
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        animation: shopNotifFade 2s forwards;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Добавляем стиль анимации если нет
    if (!document.getElementById('shop-notif-style')) {
        const style = document.createElement('style');
        style.id = 'shop-notif-style';
        style.textContent = `
            @keyframes shopNotifFade {
                0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => notification.remove(), 2000);
}

/**
 * Закрыть магазин
 */
function closeShopModal() {
    const screen = document.getElementById('shop-screen');
    if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 300);
    }

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = '';

    console.log('🛒 Магазин закрыт');
}

// Экспорт
window.showShopModal = showShopModal;
window.closeShopModal = closeShopModal;
window.switchShopTab = switchShopTab;
window.buyShopItem = buyShopItem;
window.applyExpScroll = applyExpScroll;
window.closeWizardSelectDialog = closeWizardSelectDialog;
window.confirmFactionChange = confirmFactionChange;
window.closeFactionChangeDialog = closeFactionChangeDialog;

console.log('🛒 Модуль магазина загружен');
