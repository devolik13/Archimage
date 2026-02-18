// shop-modal.js - Модальное окно магазина

// Текущая вкладка магазина
let currentShopTab = 'free';

// Кэш для оптимизации - не пересоздаём модалку каждый раз
let shopScreenCache = null;
let shopCachedFaction = null;

// Курс Stars → USD (примерно $0.013 за 1 Star)
const STAR_RATE_USD = 0.013;

// Кэш курса TON (обновляется каждые 5 минут)
let tonPriceCache = {
    priceUSD: 1.40, // Дефолтный курс TON/USD (обновлён фев 2026)
    lastUpdate: 0,
    cacheTime: 5 * 60 * 1000 // 5 минут
};

// Адрес получателя TON платежей
const TON_RECEIVER_ADDRESS = 'UQAnElrwdRQf8-U0ERo5DAGwitB_ipMOF0plhyDox_HA3bFU';

// Конфигурация стартовых пакетов (одноразовые покупки) - цены -20%
const STARTER_PACKS = {
    small: {
        id: 'starter_pack_small',
        name: '🎁 Малый пакет',
        description: '+1 маг (до 2 макс), Башня до 3 ур, 7 дней, 5000 XP',
        icon: '🎁',
        price: 2320,
        priceUSD: 30.16, // 2320 Stars × $0.013
        currency: 'dual', // Поддерживает Stars и TON
        fullPrice: 2320,
        discount: 30,
        requires: null, // Доступен всем
        rewards: {
            time: 10080, // 7 дней в минутах
            towerLevel: 3,
            wizardCount: 2,
            experience: 5000
        }
    },
    medium: {
        id: 'starter_pack_medium',
        name: '📦 Средний пакет',
        description: '+1 маг (до 3 макс), Башня до 5 ур, 30 дней, 30000 XP',
        icon: '📦',
        price: 8320,
        priceUSD: 108.16, // 8320 Stars × $0.013
        currency: 'dual',
        fullPrice: 8320,
        discount: 30,
        requires: null, // Доступен всем
        rewards: {
            time: 43200, // 30 дней в минутах
            towerLevel: 5,
            wizardCount: 3,
            experience: 30000
        }
    },
    large: {
        id: 'starter_pack_large',
        name: '💎 Крупный пакет',
        description: '+1 маг (до 4 макс), Башня до 7 ур, 90 дней, 200000 XP',
        icon: '💎',
        price: 32000,
        priceUSD: 416.00, // 32000 Stars × $0.013
        currency: 'dual',
        fullPrice: 32000,
        discount: 30,
        requires: null, // Доступен всем
        rewards: {
            time: 129600, // 90 дней в минутах
            towerLevel: 7,
            wizardCount: 4,
            experience: 200000
        }
    }
};

// Компенсации за уже имеющиеся награды (в минутах времени)
const PACK_COMPENSATIONS = {
    wizard: {
        2: 4320,  // +3 дня за уже имеющегося 2-го мага
        3: 10080, // +7 дней за 3-го
        4: 20160  // +14 дней за 4-го
    },
    tower: {
        3: 2880,  // +2 дня за башню 3+ ур
        5: 7200,  // +5 дней за башню 5+ ур
        7: 14400  // +10 дней за башню 7+ ур
    }
};

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
            description: `Восстановить все ${window.BATTLE_ENERGY?.MAX || 24} попыток`,
            icon: '🔋',
            price: 1000, // ~16 часов (большая скидка)
            currency: 'time',
            action: 'buyEnergy',
            amount: window.BATTLE_ENERGY?.MAX || 24
        },
        {
            id: 'exp_scroll_small',
            name: 'Свиток опыта (малый)',
            description: '+250 опыта выбранному магу',
            icon: '📜',
            price: 360, // 6 часов
            currency: 'time',
            action: 'buyExpScroll',
            amount: 250
        },
        {
            id: 'exp_scroll_large',
            name: 'Свиток опыта (большой)',
            description: '+1000 опыта выбранному магу',
            icon: '📜📜📜',
            price: 1440, // 1 день
            currency: 'time',
            action: 'buyExpScroll',
            amount: 1000
        },
        {
            id: 'guild_exp_small',
            name: 'Взнос в гильдию (малый)',
            description: '+250 опыта гильдии',
            icon: '🏰',
            price: 360, // 6 часов
            currency: 'time',
            action: 'buyGuildExp',
            amount: 250
        },
        {
            id: 'guild_exp_large',
            name: 'Взнос в гильдию (большой)',
            description: '+1000 опыта гильдии',
            icon: '🏰🏰🏰',
            price: 1440, // 1 день
            currency: 'time',
            action: 'buyGuildExp',
            amount: 1000
        }
    ],

    // Образы (скины) - премиум контент
    skins: [], // Заполняется динамически из SKINS_CONFIG

    // Premium товары (за Telegram Stars или TON) - цены -20%
    // Курс: 1 Star = $0.013 USD (соотношение Lord Demon), TON курс динамический из CoinGecko API
    premium: [
        {
            id: 'time_pack_1hour',
            name: '⏰ 1 час',
            description: '+1 час игрового времени',
            icon: '⏰',
            price: 8,
            priceUSD: 0.10, // 8 Stars × $0.013
            currency: 'dual',
            action: 'buyTimePack',
            amount: 60
        },
        {
            id: 'time_pack_small',
            name: 'Пакет времени (1 день)',
            description: '+1 день игрового времени',
            icon: '⏰',
            price: 134,
            priceUSD: 1.74, // 134 Stars × $0.013
            currency: 'dual',
            action: 'buyTimePack',
            amount: 1440
        },
        {
            id: 'time_pack_medium',
            name: 'Пакет времени (7 дней)',
            description: '+7 дней времени (-5%)',
            icon: '⏰⏰',
            price: 896,
            priceUSD: 11.65, // 896 Stars × $0.013
            currency: 'dual',
            action: 'buyTimePack',
            amount: 10080
        },
        {
            id: 'time_pack_large',
            name: 'Пакет времени (30 дней)',
            description: '+30 дней времени (-15%)',
            icon: '⏰⏰⏰',
            price: 3424,
            priceUSD: 44.51, // 3424 Stars × $0.013
            currency: 'dual',
            action: 'buyTimePack',
            amount: 43200
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

    // Определяем фон по фракции
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/guild/guild_${faction}.webp`;

    // ОПТИМИЗАЦИЯ: Проверяем есть ли кэшированный экран
    let screen = document.getElementById('shop-screen');

    // Если экран есть и фракция не изменилась - просто показываем
    if (screen && shopScreenCache && shopCachedFaction === faction) {
        console.log('🚀 Магазин: используем кэш (быстрое открытие)');
        screen.style.display = 'flex';
        screen.style.opacity = '1';
        // Обновляем только контент overlay
        setupShopUI();
        return;
    }

    // Если фракция изменилась - удаляем старый экран
    if (screen) {
        screen.remove();
        shopScreenCache = null;
    }

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
        transition: opacity 0.3s;
    `;

    document.body.appendChild(screen);

    // Сохраняем в кэш
    shopScreenCache = screen;
    shopCachedFaction = faction;

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
                    <div style="display: flex; align-items: center; gap: 24px;">
                        <h2 style="margin: 0; color: #ffd700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                            🛒 Магазин
                        </h2>
                        <button onclick="showChangeFactionDialog({id:'faction_change',price:1000,currency:'dual',amount:1,checkFree:true})" style="
                            background: rgba(100,150,255,0.3);
                            border: 1px solid rgba(100,150,255,0.5);
                            color: white;
                            font-size: ${baseFontSize}px;
                            cursor: pointer;
                            padding: 4px 20px;
                            border-radius: 8px;
                            transition: all 0.2s;
                            white-space: nowrap;
                        " onmouseover="this.style.background='rgba(100,150,255,0.5)'"
                           onmouseout="this.style.background='rgba(100,150,255,0.3)'">🔄 Смена фракции</button>
                    </div>
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
                <button class="shop-tab ${currentShopTab === 'packs' ? 'active' : ''}"
                        onclick="switchShopTab('packs')"
                        style="font-size: ${baseFontSize}px;">
                    🎁 Пакеты
                </button>
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
                <button class="shop-tab ${currentShopTab === 'skins' ? 'active' : ''}"
                        onclick="switchShopTab('skins')"
                        style="font-size: ${baseFontSize}px;">
                    👑 Образы
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
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);
    const timeCurrency = window.userData?.time_currency || 0;

    // Специальный рендер для стартовых пакетов
    if (tab === 'packs') {
        return renderStarterPacks(scale);
    }

    // Специальный рендер для образов
    if (tab === 'skins') {
        return renderSkinsShop(scale);
    }

    const items = SHOP_CONFIG[tab] || [];

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
                priceText = '🆓 Бесплатно';
                canBuy = true;
            }
        } else if (item.currency === 'dual') {
            // Поддержка Stars и TON
            priceText = `💎 Приобрести`;
            btnClass += ' premium';
            canBuy = true;
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
 * Рендер стартовых пакетов
 */
function renderStarterPacks(scale) {
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);
    const purchasedPacks = window.userData?.purchased_packs || {};

    let html = '';

    for (const [key, pack] of Object.entries(STARTER_PACKS)) {
        const isPurchased = purchasedPacks[pack.id];
        const canBuy = !isPurchased;

        let statusText = '';
        let statusColor = '#4ade80';
        let btnText = `💎 Приобрести`;

        if (isPurchased) {
            statusText = '✅ Куплено';
            statusColor = '#888';
            btnText = 'Получено';
        }

        // Расчёт компенсаций для текущего игрока
        const currentTowerLevel = window.userData?.buildings?.wizard_tower?.level || 1;
        const currentWizardCount = window.userData?.wizards?.length || 1;
        let compensationLines = [];
        let totalCompensation = 0;

        // Компенсация за башню
        if (currentTowerLevel >= pack.rewards.towerLevel) {
            const comp = PACK_COMPENSATIONS.tower[pack.rewards.towerLevel] || 0;
            if (comp > 0) {
                totalCompensation += comp;
                compensationLines.push(`🏯 Башня уже ${currentTowerLevel} ур → +${Math.floor(comp / 1440)} дн времени`);
            }
        }

        // Компенсация за магов
        if (currentWizardCount >= pack.rewards.wizardCount) {
            const comp = PACK_COMPENSATIONS.wizard[pack.rewards.wizardCount] || 0;
            if (comp > 0) {
                totalCompensation += comp;
                compensationLines.push(`🧙 Уже ${currentWizardCount} магов → +${Math.floor(comp / 1440)} дн времени`);
            }
        }

        const compensationHTML = compensationLines.length > 0 && !isPurchased ? `
            <div style="text-align: left; font-size: ${smallFontSize * 0.85}px; color: #ffa500; margin: 5px 0; padding: 6px 8px; background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3); border-radius: 6px;">
                <div style="font-weight: bold; margin-bottom: 3px;">💰 Ваша компенсация:</div>
                ${compensationLines.map(l => `<div>${l}</div>`).join('')}
                <div style="margin-top: 3px; color: #4ade80; font-weight: bold;">Итого: +${Math.floor(totalCompensation / 1440)} дн доп. времени</div>
            </div>
        ` : '';

        // Детали награды
        const effectiveTime = pack.rewards.time + totalCompensation;
        const rewardsHTML = `
            <div style="text-align: left; font-size: ${smallFontSize * 0.9}px; color: #ccc; margin: 10px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                <div>⏰ ${Math.floor(pack.rewards.time / 1440)} дней времени${totalCompensation > 0 && !isPurchased ? ` <span style="color: #4ade80;">(+${Math.floor(totalCompensation / 1440)} дн бонус = ${Math.floor(effectiveTime / 1440)} дн)</span>` : ''}</div>
                <div>🏯 Башня магов до ${pack.rewards.towerLevel} ур${currentTowerLevel >= pack.rewards.towerLevel && !isPurchased ? ` <span style="color: #ffa500;">(уже есть)</span>` : ''}</div>
                <div>🧙 до ${pack.rewards.wizardCount} магов (макс)${currentWizardCount >= pack.rewards.wizardCount && !isPurchased ? ` <span style="color: #ffa500;">(уже есть)</span>` : ''}</div>
                <div>✨ ${pack.rewards.experience.toLocaleString()} XP</div>
            </div>
            ${compensationHTML}
        `;

        // Полная цена (зачёркнутая)
        const fullPriceHTML = pack.price < pack.fullPrice && !isPurchased ? `
            <div style="font-size: ${smallFontSize * 0.8}px; color: #888; text-decoration: line-through;">
                ⭐ ${pack.fullPrice}
            </div>
            <div style="font-size: ${smallFontSize * 0.8}px; color: #4ade80;">
                Скидка ${pack.discount}%!
            </div>
        ` : '';

        html += `
            <div class="shop-item-card ${!canBuy ? 'disabled' : ''}"
                 onclick="${canBuy ? `buyStarterPack('${key}')` : ''}"
                 style="text-align: center; ${isPurchased ? 'opacity: 0.6;' : ''}">
                <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 5px;">
                    ${pack.icon}
                </div>
                <div style="color: #ffd700; font-size: ${baseFontSize * 1.1}px; font-weight: bold; margin-bottom: 3px;">
                    ${pack.name}
                </div>
                ${fullPriceHTML}
                ${rewardsHTML}
                ${statusText ? `<div style="color: ${statusColor}; font-size: ${smallFontSize}px; margin-bottom: 5px;">${statusText}</div>` : ''}
                <button class="shop-buy-btn premium" ${!canBuy ? 'disabled' : ''} style="font-size: ${smallFontSize}px; width: 100%;">
                    ${btnText}
                </button>
            </div>
        `;
    }

    // Скрытая кнопка для тестовой смены фракции на некроманта (правый нижний угол)
    html += `
        <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <div onclick="applyFactionChange('necromant')"
                 style="width: 32px; height: 32px; cursor: pointer; opacity: 0.03; border-radius: 4px;"
                 title="">
            </div>
        </div>
    `;

    return html;
}

/**
 * Рендер магазина образов
 */
function renderSkinsShop(scale) {
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);

    // Получаем премиум скины из SKINS_CONFIG
    const premiumSkins = typeof window.getPremiumSkinsOrdered === 'function'
        ? window.getPremiumSkinsOrdered()
        : [];

    if (premiumSkins.length === 0) {
        return `
            <div style="
                text-align: center;
                padding: 40px 20px;
                color: #aaa;
            ">
                <div style="font-size: 50px; margin-bottom: 15px;">👑</div>
                <div style="font-size: ${baseFontSize}px; color: #ffd700;">Скоро здесь появятся эксклюзивные образы!</div>
                <div style="font-size: ${smallFontSize}px; margin-top: 10px;">Следите за обновлениями</div>
            </div>
        `;
    }

    let html = '';

    for (const skinId of premiumSkins) {
        const skin = window.SKINS_CONFIG?.[skinId];
        if (!skin || !skin.isPremium) continue;

        const isOwned = typeof window.isSkinUnlocked === 'function'
            ? window.isSkinUnlocked(skinId)
            : false;

        const canBuy = !isOwned;

        let statusText = '';
        let statusColor = '#4ade80';
        let btnText = `💎 ${skin.price} ⭐`;

        if (isOwned) {
            statusText = '✅ Куплено';
            statusColor = '#888';
            btnText = 'Получено';
        }

        html += `
            <div class="shop-item-card ${!canBuy ? 'disabled' : ''}"
                 onclick="${canBuy ? `buyShopSkin('${skinId}')` : ''}"
                 style="text-align: center; ${isOwned ? 'opacity: 0.6;' : ''}">

                <div style="
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 10px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 12px;
                    overflow: hidden;
                ">
                    <canvas id="shop-skin-preview-${skinId}" width="120" height="120" style="width: 120px; height: 120px;"></canvas>
                    ${skin.isPremium ? `
                        <div style="
                            position: absolute;
                            top: 5px;
                            left: 5px;
                            background: linear-gradient(135deg, #ffd700, #ff8c00);
                            color: #000;
                            padding: 2px 6px;
                            border-radius: 8px;
                            font-size: 9px;
                            font-weight: bold;
                        ">PREMIUM</div>
                    ` : ''}
                </div>

                <div style="color: #ffd700; font-size: ${baseFontSize * 1.1}px; font-weight: bold; margin-bottom: 3px;">
                    ${skin.name}
                </div>

                <div style="font-size: ${smallFontSize * 0.9}px; color: #ccc; margin-bottom: 8px; min-height: 30px;">
                    ${skin.description}
                </div>

                ${statusText ? `<div style="color: ${statusColor}; font-size: ${smallFontSize}px; margin-bottom: 5px;">${statusText}</div>` : ''}

                <button class="shop-buy-btn premium" ${!canBuy ? 'disabled' : ''} style="font-size: ${smallFontSize}px; width: 100%;">
                    ${btnText}
                </button>
            </div>
        `;
    }

    // Загружаем превью после рендера
    setTimeout(() => loadShopSkinPreviews(premiumSkins), 50);

    return html;
}

/**
 * Загружает превью скинов в магазине
 */
function loadShopSkinPreviews(skinIds) {
    skinIds.forEach(skinId => {
        const skin = window.SKINS_CONFIG?.[skinId];
        if (!skin) return;

        const canvas = document.getElementById(`shop-skin-preview-${skinId}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const idleName = skin.customSpriteNames?.idle || 'idle.webp';
        const spritePath = skin.customSpritePath
            ? `${skin.customSpritePath}/${idleName}`
            : `images/wizards/${skin.faction}/${skin.spriteConfig}_idle.webp`;

        const img = new Image();
        img.onload = () => {
            const frameSize = 256;
            ctx.clearRect(0, 0, 120, 120);
            ctx.drawImage(img, 0, 0, frameSize, frameSize, 0, 0, 120, 120);
        };
        img.src = spritePath;
    });
}

/**
 * Покупка скина из магазина
 */
async function buyShopSkin(skinId) {
    const skin = window.SKINS_CONFIG?.[skinId];
    if (!skin || !skin.isPremium) {
        console.error('❌ Скин не найден или не премиум:', skinId);
        return;
    }

    // Проверяем что не куплен
    if (typeof window.isSkinUnlocked === 'function' && window.isSkinUnlocked(skinId)) {
        if (window.showNotification) {
            window.showNotification('⚠️ Этот образ уже куплен!');
        }
        return;
    }

    // Показываем диалог выбора оплаты (Stars или TON)
    showSkinPaymentDialog(skinId);
}

/**
 * Показывает диалог выбора способа оплаты для скина
 */
function showSkinPaymentDialog(skinId) {
    const skin = window.SKINS_CONFIG?.[skinId];
    if (!skin) return;

    // Закрываем магазин
    if (typeof closeShopScreen === 'function') {
        closeShopScreen();
    }

    const overlay = document.createElement('div');
    overlay.id = 'skin-payment-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10050;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid rgba(255, 215, 0, 0.5);
            border-radius: 16px;
            padding: 16px 20px;
            max-width: 340px;
            width: 90%;
            text-align: center;
            max-height: 90vh;
            overflow-y: auto;
        ">
            <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(0,0,0,0.3);
                border-radius: 12px;
                padding: 10px 12px;
                margin-bottom: 12px;
                text-align: left;
            ">
                <canvas id="payment-skin-preview" width="80" height="80" style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 8px;"></canvas>
                <div>
                    <div style="color: #ffd700; font-size: 15px; font-weight: bold;">${skin.name}</div>
                    <div style="color: #aaa; font-size: 12px; margin-top: 3px;">${skin.description}</div>
                </div>
            </div>

            <p style="color: #ccc; font-size: 13px; margin: 0 0 10px 0;">
                Выберите способ оплаты:
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button onclick="purchaseSkinWithStars('${skinId}')" style="
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #ffd700, #ff8c00);
                    border: none;
                    border-radius: 10px;
                    color: #000;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                ">
                    ⭐ ${skin.price} Telegram Stars
                </button>

                <button onclick="purchaseSkinWithTON('${skinId}')" style="
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #0098EA, #0077B6);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                ">
                    💎 ~$${skin.priceUSD?.toFixed(2) || '2.15'} в TON
                </button>

                <button onclick="closeSkinPaymentDialog()" style="
                    padding: 8px 16px;
                    background: rgba(100, 100, 100, 0.3);
                    border: 2px solid rgba(150, 150, 150, 0.5);
                    border-radius: 10px;
                    color: #aaa;
                    font-size: 13px;
                    cursor: pointer;
                ">
                    Отмена
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Загружаем превью
    setTimeout(() => {
        const canvas = document.getElementById('payment-skin-preview');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, 80, 80);
                ctx.drawImage(img, 0, 0, 256, 256, 0, 0, 80, 80);
            };
            const idleName = skin.customSpriteNames?.idle || 'idle.webp';
            img.src = skin.customSpritePath
                ? `${skin.customSpritePath}/${idleName}`
                : `images/wizards/${skin.faction}/${skin.spriteConfig}_idle.webp`;
        }
    }, 50);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSkinPaymentDialog();
        }
    });
}

/**
 * Закрывает диалог оплаты скина
 */
function closeSkinPaymentDialog() {
    const overlay = document.getElementById('skin-payment-overlay');
    if (overlay) overlay.remove();
}

/**
 * Покупка скина за Telegram Stars
 */
async function purchaseSkinWithStars(skinId) {
    const skin = window.SKINS_CONFIG?.[skinId];
    if (!skin) return;

    closeSkinPaymentDialog();

    // Проверяем Telegram WebApp
    if (!window.Telegram?.WebApp?.openInvoice) {
        if (window.showNotification) {
            window.showNotification('⚠️ Покупка доступна только в Telegram', 'warning');
        }
        return;
    }

    try {
        // Используем общую функцию createStarsInvoice (как для паков времени)
        const skinItem = {
            id: `skin_${skinId}`, // skin_lady_fire
            name: skin.name,
            price: skin.price
        };

        const invoiceUrl = await createStarsInvoice(skinItem, skin.price);

        if (!invoiceUrl) {
            throw new Error('Не получена ссылка на оплату');
        }

        // Открываем оплату
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            if (status === 'paid') {
                await completeSkinPurchase(skinId);
            } else if (status === 'cancelled') {
                if (window.showNotification) {
                    window.showNotification('Покупка отменена', 'info');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('⚠️ Ошибка оплаты', 'error');
                }
            }
        });
    } catch (error) {
        console.error('Ошибка покупки скина:', error);
        if (window.showNotification) {
            window.showNotification('⚠️ Ошибка покупки', 'error');
        }
    }
}

/**
 * Покупка скина за TON
 */
async function purchaseSkinWithTON(skinId) {
    const skin = window.SKINS_CONFIG?.[skinId];
    if (!skin) return;

    closeSkinPaymentDialog();

    // Проверяем TON Connect
    if (!window.tonConnectUI || !window.tonConnectUI.wallet) {
        if (window.showNotification) {
            window.showNotification('⚠️ Сначала подключите TON кошелёк в разделе Airdrop', 'warning');
        }
        return;
    }

    try {
        // Получаем актуальный курс TON
        const tonPrice = await getTonPrice();
        const tonAmount = skin.priceUSD / tonPrice;

        console.log('💎 Покупка скина через TON:', skin.name, tonAmount.toFixed(4), 'TON');

        // Создаём транзакцию (без payload - как в других TON покупках)
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
            messages: [{
                address: TON_RECEIVER_ADDRESS,
                amount: String(Math.floor(tonAmount * 1e9)) // в наноTON
            }]
        };

        const result = await window.tonConnectUI.sendTransaction(transaction);

        console.log('✅ TON транзакция скина отправлена:', result);

        if (result) {
            // Оптимистично применяем покупку (как для паков времени)
            await completeSkinPurchase(skinId);

            // Начисляем airdrop очки (USD эквивалент)
            if (typeof window.addAirdropPoints === 'function' && skin.priceUSD) {
                const airdropPoints = Math.floor((skin.priceUSD / 0.013) / 10);
                if (airdropPoints > 0) {
                    window.addAirdropPoints(airdropPoints, 'Покупка скина TON');
                }
            }

            // Сохраняем покупку через TON в лог
            await saveTONSkinPurchase(skinId, tonAmount, result.boc);
        }
    } catch (error) {
        console.error('Ошибка покупки за TON:', error);
        if (window.showNotification) {
            window.showNotification('⚠️ Ошибка оплаты TON', 'error');
        }
    }
}

/**
 * Сохраняет покупку скина через TON в БД
 */
async function saveTONSkinPurchase(skinId, tonAmount, txBoc) {
    try {
        if (!window.dbManager?.supabase) return;

        await window.dbManager.supabase
            .from('payments')
            .insert({
                telegram_id: window.userData?.telegram_id,
                product_id: `skin_${skinId}`,
                amount_stars: 0,
                amount_ton: tonAmount,
                status: 'completed',
                payment_method: 'ton',
                tx_hash: txBoc,
                completed_at: new Date().toISOString()
            });

        console.log('💾 TON покупка скина сохранена в БД');
    } catch (error) {
        console.error('❌ Ошибка сохранения TON покупки:', error);
    }
}

/**
 * Завершает покупку скина (разблокировка)
 */
async function completeSkinPurchase(skinId) {
    const skin = window.SKINS_CONFIG?.[skinId];
    if (!skin) return;

    // Разблокируем скин
    if (typeof window.unlockSkin === 'function') {
        await window.unlockSkin(skinId);
    }

    if (window.showNotification) {
        window.showNotification(`✨ Образ "${skin.name}" куплен!`, 'success');
    }

    // Обновляем UI магазина если открыт
    if (typeof refreshShopScreen === 'function') {
        refreshShopScreen();
    }
}

// Экспорт функций для магазина скинов
window.buyShopSkin = buyShopSkin;
window.showSkinPaymentDialog = showSkinPaymentDialog;
window.closeSkinPaymentDialog = closeSkinPaymentDialog;
window.purchaseSkinWithStars = purchaseSkinWithStars;
window.purchaseSkinWithTON = purchaseSkinWithTON;
window.completeSkinPurchase = completeSkinPurchase;

/**
 * Покупка стартового пакета (показывает диалог выбора или покупает напрямую)
 */
async function buyStarterPack(packKey) {
    const pack = STARTER_PACKS[packKey];
    if (!pack) {
        console.error('❌ Пакет не найден:', packKey);
        return;
    }

    const purchasedPacks = window.userData?.purchased_packs || {};

    // Проверяем что не куплен
    if (purchasedPacks[pack.id]) {
        if (window.showNotification) {
            window.showNotification('⚠️ Этот пакет уже куплен!');
        }
        return;
    }

    // Если пакет поддерживает dual currency - показываем диалог выбора
    if (pack.currency === 'dual') {
        showPaymentMethodDialog(pack, packKey);
        return;
    }

    // Проверяем доступность Telegram WebApp
    if (!window.Telegram?.WebApp) {
        showShopNotification('⚠️ Доступно только в Telegram', 'warning');
        return;
    }

    console.log(`🎁 Покупка пакета: ${pack.name} (${pack.price} Stars)`);

    try {
        // Создаём invoice через Edge Function
        const invoiceUrl = await createStarsInvoice({ id: pack.id }, pack.price);

        // Открываем окно оплаты Telegram
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            console.log('💳 Payment status:', status);

            if (status === 'paid') {
                // Успешная оплата - награды применятся через webhook
                // Но для моментального отображения применяем локально тоже
                applyStarterPackRewards(pack);

                // Отмечаем как купленный локально
                if (!window.userData.purchased_packs) {
                    window.userData.purchased_packs = {};
                }
                window.userData.purchased_packs[pack.id] = {
                    purchased_at: new Date().toISOString(),
                    rewards: pack.rewards
                };

                // Начисляем airdrop очки
                if (typeof window.addAirdropPoints === 'function' && pack.price) {
                    const airdropPoints = Math.floor(pack.price / 10);
                    if (airdropPoints > 0) {
                        window.addAirdropPoints(airdropPoints, 'Покупка Telegram Stars');

                        // Бонус рефереру (10% от BPM coin покупателя)
                        const buyerTelegramId = window.dbManager?.currentPlayer?.telegram_id;
                        if (buyerTelegramId && window.referralManager?.rewardReferrerForPurchase) {
                            window.referralManager.rewardReferrerForPurchase(buyerTelegramId, airdropPoints);
                        }
                    }
                }

                // Сохраняем
                if (window.eventSaveManager?.saveImmediate) {
                    await window.eventSaveManager.saveImmediate('starter_pack_purchase');
                }

                showShopNotification(`🎁 ${pack.name} получен!`, 'success');
                switchShopTab('packs');

            } else if (status === 'cancelled') {
                showShopNotification('Покупка отменена', 'info');
            } else if (status === 'failed') {
                showShopNotification('❌ Ошибка оплаты', 'error');
            }
        });

    } catch (error) {
        console.error('❌ Ошибка покупки пакета:', error);
        showShopNotification('⚠️ Платёжная система временно недоступна', 'warning');
    }
}

/**
 * Применение наград стартового пакета с компенсацией за имеющееся
 */
function applyStarterPackRewards(pack) {
    const rewards = pack.rewards;
    let totalTime = rewards.time;
    let compensationDetails = [];

    // Инициализация
    if (!window.userData.buildings) {
        window.userData.buildings = {};
    }
    if (!window.userData.buildings.wizard_tower) {
        window.userData.buildings.wizard_tower = { level: 1 };
    }
    if (!window.userData.wizards) {
        window.userData.wizards = [];
    }

    const currentTowerLevel = window.userData.buildings.wizard_tower.level || 1;
    const currentWizardCount = window.userData.wizards.length;

    // 1. Проверяем башню - компенсация если уже построена до нужного уровня
    if (currentTowerLevel >= rewards.towerLevel) {
        // Башня уже нужного уровня или выше - компенсируем временем
        const compensation = PACK_COMPENSATIONS.tower[rewards.towerLevel] || 0;
        totalTime += compensation;
        compensationDetails.push(`Башня уже ${currentTowerLevel} ур: +${Math.floor(compensation/1440)} дн`);
        console.log(`🏯 Башня уже ${currentTowerLevel} ур, компенсация: +${compensation} мин`);
    } else {
        // Если башня строится - мгновенно достраиваем до нужного уровня
        // Отменяем текущую стройку если есть
        if (window.userData.buildings.wizard_tower.building) {
            delete window.userData.buildings.wizard_tower.building;
            console.log(`🏯 Строительство башни отменено - мгновенное улучшение`);
        }
        window.userData.buildings.wizard_tower.level = rewards.towerLevel;
        console.log(`🏯 Башня магов: ${currentTowerLevel} → ${rewards.towerLevel}`);
    }

    // 2. Проверяем магов - компенсация если уже есть нужное количество
    if (currentWizardCount >= rewards.wizardCount) {
        // Маги уже есть - компенсируем временем
        const compensation = PACK_COMPENSATIONS.wizard[rewards.wizardCount] || 0;
        totalTime += compensation;
        compensationDetails.push(`Уже ${currentWizardCount} магов: +${Math.floor(compensation/1440)} дн`);
        console.log(`🧙 Уже ${currentWizardCount} магов, компенсация: +${compensation} мин`);
    } else {
        // Добавляем магов до нужного количества
        const wizardsToAdd = rewards.wizardCount - currentWizardCount;
        for (let i = 0; i < wizardsToAdd; i++) {
            const newWizard = createNewWizard(currentWizardCount + i + 1);
            window.userData.wizards.push(newWizard);
            console.log(`🧙 Добавлен маг: ${newWizard.name}`);
        }
    }

    // 3. Добавляем время (базовое + компенсации)
    window.userData.time_currency = (window.userData.time_currency || 0) + totalTime;
    console.log(`⏰ +${totalTime} минут времени (база: ${rewards.time}, компенсации: ${totalTime - rewards.time})`);

    // 4. Добавляем опыт (распределяем поровну)
    if (window.userData.wizards.length > 0 && rewards.experience > 0) {
        const expPerWizard = Math.floor(rewards.experience / window.userData.wizards.length);
        window.userData.wizards.forEach(wizard => {
            if (!wizard.original_max_hp || wizard.original_max_hp > 100) wizard.original_max_hp = 100;
            wizard.experience = (wizard.experience || 0) + expPerWizard;
            updateWizardLevel(wizard);
        });
        console.log(`✨ +${rewards.experience} XP (${expPerWizard} на мага)`);
    }

    // Показываем детали компенсации если были
    if (compensationDetails.length > 0) {
        showShopNotification(`💰 Компенсация: ${compensationDetails.join(', ')}`, 'info');
    }

    // Обновляем весь UI
    if (window.updateHeader) {
        window.updateHeader();
    }

    // Обновляем колонку магов в UI города
    if (typeof window.renderWizardColumn === 'function') {
        window.renderWizardColumn();
    }

    // Обновляем отображение времени
    if (typeof window.updateTimerDisplay === 'function') {
        window.updateTimerDisplay();
    }

    // Обновляем вид города (здания могли измениться)
    if (typeof window.initCityView === 'function') {
        setTimeout(() => {
            window.initCityView();
        }, 100);
    }

    console.log('📦 Пакет применён! Маги:', window.userData.wizards.map(w => ({
        name: w.name,
        faction: w.faction,
        level: w.level,
        exp: w.experience,
        exp_to_next: w.exp_to_next,
        hp: w.hp,
        max_hp: w.max_hp
    })));
}

/**
 * Создание нового мага для стартового пакета
 */
function createNewWizard(index) {
    const faction = window.userData?.faction || 'fire';
    const names = {
        fire: ['Пироман', 'Огневик', 'Пламенный', 'Жаровик', 'Искровик'],
        water: ['Гидромаг', 'Ледовик', 'Морозник', 'Волновик', 'Туманник'],
        earth: ['Геомант', 'Каменщик', 'Рудокоп', 'Скальник', 'Кристальщик'],
        wind: ['Аэромант', 'Ветровик', 'Штормовик', 'Вихревик', 'Облачник'],
        nature: ['Друид', 'Лесовик', 'Травник', 'Корневик', 'Листовик'],
        poison: ['Токсимаг', 'Ядовик', 'Чумовик', 'Гнилевик', 'Миазмик']
    };

    const factionNames = names[faction] || names.fire;
    const name = factionNames[index - 1] || `Маг ${index}`;

    return {
        id: `wizard_${Date.now()}_${index}`,
        name: name,
        faction: faction, // ИСПРАВЛЕНО: добавляем фракцию игрока
        level: 1,
        experience: 0,
        exp_to_next: 80, // Базовое значение для уровня 1 (60 + 1*1*20)
        original_max_hp: 100,
        hp: 100,
        max_hp: 100,
        armor: 100,
        max_armor: 100,
        damage: 10,
        isMain: index === 1
    };
}

/**
 * Обновление уровня мага по опыту (использует глобальную систему)
 */
function updateWizardLevel(wizard) {
    // Используем глобальную систему опыта из experience-system.js
    // Формула: exp_to_next = 60 + (level * level * 20)
    // MAX_LEVEL = 40

    const MAX_LEVEL = window.EXP_CONFIG?.MAX_LEVEL || 40;

    // Инициализируем поля если их нет
    if (!wizard.level) wizard.level = 1;
    if (!wizard.original_max_hp || wizard.original_max_hp > 100) wizard.original_max_hp = 100;
    if (!wizard.exp_to_next) {
        wizard.exp_to_next = 60 + (wizard.level * wizard.level * 20);
    }

    // Пересчитываем уровень исходя из накопленного опыта
    while (wizard.experience >= wizard.exp_to_next && wizard.level < MAX_LEVEL) {
        wizard.experience -= wizard.exp_to_next;
        wizard.level++;
        wizard.exp_to_next = 60 + (wizard.level * wizard.level * 20);
    }

    // Применяем бонусы уровня к HP (используем ту же формулу что в experience-system.js)
    const baseHP = wizard.original_max_hp || 100;
    let hpBonus;

    if (wizard.level === 40) {
        hpBonus = 3.0; // +200% на 40 уровне
    } else if (wizard.level > 1) {
        hpBonus = 1 + (wizard.level - 1) * 0.05; // +5% за каждый уровень
    } else {
        hpBonus = 1.0;
    }

    wizard.max_hp = Math.floor(baseHP * hpBonus);
    wizard.hp = wizard.max_hp;
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

    // Если товар поддерживает dual currency - показываем диалог выбора
    if (item.currency === 'dual' && item.action === 'buyTimePack') {
        showPaymentMethodDialog(item);
        return;
    }

    // Выполняем действие
    switch (item.action) {
        case 'buyEnergy':
            buyEnergy(item);
            break;
        case 'buyExpScroll':
            buyExpScroll(item);
            break;
        case 'buyGuildExp':
            buyGuildExp(item);
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
        const isMaxLevel = wizard.level >= (window.EXP_CONFIG?.MAX_LEVEL || 40);

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

    if (wizard.level >= (window.EXP_CONFIG?.MAX_LEVEL || 40)) {
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
 * Покупка опыта для гильдии (взнос)
 */
async function buyGuildExp(item) {
    const timeCurrency = window.userData?.time_currency || 0;

    if (timeCurrency < item.price) {
        showShopNotification('❌ Недостаточно времени!', 'error');
        return;
    }

    if (!window.userData?.guild_id || !window.guildManager?.currentGuild) {
        showShopNotification('❌ Вы не состоите в гильдии!', 'error');
        return;
    }

    // Списываем валюту
    window.userData.time_currency -= item.price;

    // Добавляем опыт гильдии через RPC (считается как взнос / guild_contribution)
    const result = await window.guildManager.addGuildExperience(item.amount);

    if (result.success) {
        let msg = `🏰 +${item.amount} опыта для гильдии!`;
        if (result.leveledUp) {
            msg += ` Новый уровень: ${result.newLevel}!`;
        }
        showShopNotification(msg, 'success');
    } else {
        // Возвращаем валюту при ошибке
        window.userData.time_currency += item.price;
        showShopNotification('❌ Ошибка: ' + (result.error || 'не удалось'), 'error');
    }

    // Сохраняем
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('shop_buy_guild_exp');
    }

    refreshShopUI();

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

    console.log('🌟 Покупка пакета времени:', item);
    console.log('🌟 Item details:', {
        id: item.id,
        name: item.name,
        price: item.price,
        amount: item.amount
    });

    try {
        // Создаём invoice через Edge Function
        console.log('🌟 Вызов createStarsInvoice для:', item.id);
        const invoiceUrl = await createStarsInvoice(item, item.price);
        console.log('🌟 Invoice URL получен:', invoiceUrl);

        // Открываем окно оплаты Telegram
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            console.log('💳 Payment status:', status);

            if (status === 'paid') {
                // Успешная оплата - время добавится через webhook
                // Но для моментального отображения добавляем локально тоже
                window.userData.time_currency = (window.userData.time_currency || 0) + item.amount;

                // Начисляем airdrop очки за покупку Stars (100 Stars = 10 очков)
                if (typeof window.addAirdropPoints === 'function' && item.price) {
                    const airdropPoints = Math.floor(item.price / 10);
                    if (airdropPoints > 0) {
                        window.addAirdropPoints(airdropPoints, 'Покупка Telegram Stars');

                        // Бонус рефереру (10% от BPM coin покупателя)
                        const buyerTelegramId = window.dbManager?.currentPlayer?.telegram_id;
                        if (buyerTelegramId && window.referralManager?.rewardReferrerForPurchase) {
                            window.referralManager.rewardReferrerForPurchase(buyerTelegramId, airdropPoints);
                        }
                    }
                }

                if (window.eventSaveManager) {
                    await window.eventSaveManager.saveImmediate('shop_stars_purchase');
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
        });
    } catch (error) {
        console.error('❌ Ошибка Stars платежа:', error);
        showShopNotification('⚠️ Платёжная система временно недоступна', 'warning');
    }
}

/**
 * Создание invoice для Telegram Stars через Supabase Edge Function
 */
async function createStarsInvoice(item, customPrice = null, targetFaction = null) {
    // Получаем URL Supabase из конфига
    const supabaseUrl = window.supabaseClient?.supabaseUrl ||
        window.SUPABASE_URL ||
        'https://your-project.supabase.co';

    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ||
        window.userData?.user_id ||
        window.dbManager?.getTelegramId();

    if (!telegramId) {
        throw new Error('Telegram user ID not found');
    }

    console.log('🌟 Creating invoice:', {
        product_id: item.id,
        telegram_id: telegramId,
        custom_price: customPrice,
        target_faction: targetFaction
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/create-invoice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.supabaseClient?.supabaseKey || ''}`
        },
        body: JSON.stringify({
            product_id: item.id,
            telegram_id: telegramId,
            custom_price: customPrice,
            target_faction: targetFaction
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Invoice creation failed!');
        console.error('❌ Response status:', response.status);
        console.error('❌ Response text:', errorText);
        try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ Error JSON:', errorJson);
            throw new Error(errorJson.error || 'Failed to create invoice');
        } catch (e) {
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
    }

    const data = await response.json();
    console.log('✅ Invoice created:', data);

    return data.invoice_url;
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
 * Рассчитывает время, потраченное на изучение заклинаний каждой фракции
 * Данные берутся напрямую из userData.spells - всегда актуальны
 */
/**
 * Фиксированная цена смены фракции: 1000⭐ (~$13 / ~1170₽)
 */
function calculateFactionChangePrice(targetFaction) {
    return { price: 1000 };
}

/**
 * Диалог смены фракции (внутри overlay магазина)
 */
function showChangeFactionDialog(item) {
    const overlay = document.getElementById('shop-ui-overlay');
    if (!overlay) {
        console.error('shop-ui-overlay не найден');
        return;
    }

    const img = document.getElementById('shop-bg-image');
    const rect = img ? img.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };

    renderFactionChangeContent(overlay, rect);
}

/**
 * Рендер содержимого смены фракции в overlay магазина
 */
function renderFactionChangeContent(container, rect) {
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;
    const scale = Math.min(scaleX, scaleY);

    const titleFontSize = Math.max(18, 24 * scale);
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);

    const isFree = !window.userData?.faction_changed;
    const factions = ['fire', 'water', 'earth', 'wind', 'nature', 'poison', 'light', 'dark'];
    const currentFaction = window.userData?.faction || 'fire';

    const factionNames = {
        fire: '🔥 Огонь',
        water: '💧 Вода',
        earth: '🪨 Земля',
        wind: '💨 Ветер',
        nature: '🌿 Природа',
        poison: '☠️ Яд',
        light: '✨ Свет',
        dark: '🌑 Тьма',
        necromant: '💀 Некромант'
    };

    const factionChangePrice = 1000;
    const necromantPrice = 1500; // Ранний доступ — всегда платный

    // Генерируем кнопки обычных фракций
    const factionButtons = factions
        .filter(f => f !== currentFaction)
        .map(faction => {
            return `
                <button onclick="confirmFactionChange('${faction}')" style="
                    padding: ${12 * scale}px ${16 * scale}px;
                    background: rgba(0,0,0,0.6);
                    border: 1px solid rgba(255,215,0,0.3);
                    border-radius: 10px;
                    color: white;
                    font-size: ${baseFontSize}px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    min-width: ${120 * scale}px;
                " onmouseover="this.style.borderColor='#ffd700'; this.style.background='rgba(0,0,0,0.8)'"
                   onmouseout="this.style.borderColor='rgba(255,215,0,0.3)'; this.style.background='rgba(0,0,0,0.6)'">
                    <div style="font-size: ${baseFontSize * 1.1}px; margin-bottom: 4px;">${factionNames[faction]}</div>
                    <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold;">
                        ${isFree ? '🆓 Бесплатно' : `⭐${factionChangePrice}`}
                    </div>
                </button>
            `;
        }).join('');

    // Кнопка некроманта (всегда платный, отдельный стиль)
    const necromantButton = currentFaction === 'necromant' ? '' : `
        <button onclick="showNecromancerConfirmDialog()" style="
            padding: ${12 * scale}px ${16 * scale}px;
            background: linear-gradient(135deg, rgba(10,10,26,0.9), rgba(26,16,40,0.9));
            border: 1px solid rgba(100, 255, 150, 0.4);
            border-radius: 10px;
            color: white;
            font-size: ${baseFontSize}px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            min-width: ${120 * scale}px;
            grid-column: 1 / -1;
            box-shadow: 0 0 15px rgba(80, 200, 120, 0.15);
        " onmouseover="this.style.borderColor='#7cffcb'; this.style.boxShadow='0 0 25px rgba(80,200,120,0.3)'"
           onmouseout="this.style.borderColor='rgba(100,255,150,0.4)'; this.style.boxShadow='0 0 15px rgba(80,200,120,0.15)'">
            <div style="font-size: ${baseFontSize * 1.2}px; margin-bottom: 4px;">
                💀 Некромант <span style="font-size: ${smallFontSize}px; color: #7cffcb;">НОВЫЙ</span>
            </div>
            <div style="font-size: ${baseFontSize}px; color: #ffd700; font-weight: bold;">
                ⭐${necromantPrice} <span style="font-size: ${smallFontSize}px; color: #aaa;">(ранний доступ)</span>
            </div>
        </button>
    `;

    // Заголовок с информацией
    const headerText = isFree
        ? '<span style="color: #4ade80;">Первая смена бесплатно!</span>'
        : `Стоимость: ${factionChangePrice} ⭐`;

    container.innerHTML = `
        <div style="padding: 15px; height: 100%; display: flex; flex-direction: column; pointer-events: auto;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <h2 style="margin: 0; color: #ffd700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                        🔄 Смена фракции
                    </h2>
                    <div style="color: #ccc; font-size: ${smallFontSize}px; margin-top: 5px;">
                        ${headerText}
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

            <!-- Информация -->
            <div style="
                background: rgba(0,100,0,0.2);
                border: 1px solid rgba(74,222,128,0.3);
                border-radius: 10px;
                padding: ${10 * scale}px;
                margin-bottom: 15px;
                text-align: center;
            ">
                <div style="color: #4ade80; font-size: ${baseFontSize}px;">
                    ✅ Маги, здания и заклинания сохраняются!
                </div>
            </div>

            <!-- Текущая фракция -->
            <div style="
                background: rgba(0,0,0,0.4);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 10px;
                padding: ${10 * scale}px;
                margin-bottom: 15px;
                text-align: center;
            ">
                <div style="color: #888; font-size: ${smallFontSize}px; margin-bottom: 5px;">Текущая фракция:</div>
                <div style="color: #ffd700; font-size: ${titleFontSize}px;">${factionNames[currentFaction]}</div>
            </div>

            <!-- Выбор новой фракции -->
            <div style="flex: 1; overflow-y: auto;">
                <div style="color: #ccc; font-size: ${baseFontSize}px; margin-bottom: 10px; text-align: center;">
                    Выберите новую фракцию:
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${10 * scale}px;">
                    ${factionButtons}
                    ${necromantButton}
                </div>
            </div>

            <!-- Кнопка назад -->
            <button onclick="backToShopFromFaction()" style="
                width: 100%;
                margin-top: 15px;
                padding: ${12 * scale}px;
                background: rgba(100,100,100,0.3);
                border: 1px solid rgba(150,150,150,0.5);
                border-radius: 8px;
                color: white;
                font-size: ${baseFontSize}px;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.background='rgba(100,100,100,0.5)'"
               onmouseout="this.style.background='rgba(100,100,100,0.3)'">
                ← Назад в магазин
            </button>
        </div>
    `;
}

/**
 * Вернуться в магазин из смены фракции
 */
function backToShopFromFaction() {
    setupShopUI();
}

/**
 * Показать диалог подтверждения смены фракции
 */
function showFactionChangeConfirmation(factionName, priceText) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'faction-confirm-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10001; pointer-events: auto;
        `;
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid rgba(255,215,0,0.5);
                border-radius: 15px; padding: 25px; max-width: 320px;
                text-align: center; color: white;
            ">
                <div style="font-size: 20px; color: #ffd700; margin-bottom: 15px;">🔄 Подтверждение</div>
                <div style="font-size: 16px; margin-bottom: 8px;">Сменить фракцию на</div>
                <div style="font-size: 22px; color: #ffd700; margin-bottom: 8px;">${factionName}</div>
                <div style="font-size: 14px; color: #aaa; margin-bottom: 20px;">Стоимость: ${priceText}</div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="faction-confirm-yes" style="
                        padding: 10px 25px; background: rgba(74,222,128,0.3);
                        border: 1px solid rgba(74,222,128,0.6); border-radius: 8px;
                        color: #4ade80; font-size: 16px; cursor: pointer;
                    ">✅ Да</button>
                    <button id="faction-confirm-no" style="
                        padding: 10px 25px; background: rgba(255,100,100,0.3);
                        border: 1px solid rgba(255,100,100,0.6); border-radius: 8px;
                        color: #ff6b6b; font-size: 16px; cursor: pointer;
                    ">❌ Нет</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('faction-confirm-yes').onclick = () => {
            overlay.remove();
            resolve(true);
        };
        document.getElementById('faction-confirm-no').onclick = () => {
            overlay.remove();
            resolve(false);
        };
    });
}

/**
 * Подтверждение смены фракции
 */
async function confirmFactionChange(newFaction) {
    const factionNames = {
        fire: '🔥 Огонь', water: '💧 Вода', earth: '🪨 Земля', wind: '💨 Ветер',
        nature: '🌿 Природа', poison: '☠️ Яд', light: '✨ Свет', dark: '🌑 Тьма',
        necromant: '💀 Некромант'
    };
    const isFree = !window.userData?.faction_changed;
    const factionChangePrice = 1000;

    const priceText = isFree ? 'Бесплатно' : `${factionChangePrice} ⭐`;
    const confirmed = await showFactionChangeConfirmation(factionNames[newFaction] || newFaction, priceText);
    if (!confirmed) return;

    if (!isFree) {
        // Платная смена через Stars
        if (!window.Telegram?.WebApp) {
            showShopNotification('⚠️ Доступно только в Telegram', 'warning');
            closeFactionChangeDialog();
            return;
        }

        console.log('🔄 Смена фракции на:', newFaction, `(${factionChangePrice} Stars)`);

        try {
            // Создаём invoice через Edge Function с целевой фракцией
            const invoiceUrl = await createStarsInvoice(
                { id: 'faction_change' },
                factionChangePrice,
                newFaction
            );

            // Открываем оплату Stars
            window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
                console.log('💳 Payment status:', status);

                if (status === 'paid') {
                    // Начисляем airdrop очки за покупку Stars (100 Stars = 10 очков)
                    if (typeof window.addAirdropPoints === 'function' && factionChangePrice) {
                        const airdropPoints = Math.floor(factionChangePrice / 10);
                        if (airdropPoints > 0) {
                            window.addAirdropPoints(airdropPoints, 'Покупка Telegram Stars');

                            // Бонус рефереру (10% от BPM coin покупателя)
                            const buyerTelegramId = window.dbManager?.currentPlayer?.telegram_id;
                            if (buyerTelegramId && window.referralManager?.rewardReferrerForPurchase) {
                                window.referralManager.rewardReferrerForPurchase(buyerTelegramId, airdropPoints);
                            }
                        }
                    }
                    applyFactionChange(newFaction);
                } else if (status === 'cancelled') {
                    showShopNotification('Покупка отменена', 'info');
                } else {
                    showShopNotification('❌ Ошибка оплаты', 'error');
                }
                closeFactionChangeDialog();
            });
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
 * Маги, здания и заклинания сохраняются - меняется только фракция
 * (это влияет на -15% бонус изучения и визуальный стиль)
 */
window.applyFactionChange = function applyFactionChange(newFaction) {
    const oldFaction = window.userData.faction;

    // Меняем фракцию игрока
    window.userData.faction = newFaction;
    window.userData.faction_changed = true;

    // Обновляем фракцию у всех магов (меняет их внешний вид)
    if (window.userData.wizards && window.userData.wizards.length > 0) {
        window.userData.wizards.forEach(wizard => {
            wizard.faction = newFaction;
        });
        console.log(`🧙 Обновлена фракция у ${window.userData.wizards.length} магов`);
    }

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
        poison: 'Яд',
        light: 'Свет',
        dark: 'Тьма',
        necromant: 'Некромант'
    };

    console.log(`🔄 Смена фракции: ${factionNames[oldFaction]} → ${factionNames[newFaction]}`);
    showShopNotification(`🔄 Фракция изменена на ${factionNames[newFaction]}!`, 'success');
    closeShopModal();

    // Перезагружаем город (обновит визуальный стиль)
    if (typeof window.initCityView === 'function') {
        window.initCityView();
    }
}

/**
 * Закрыть диалог смены фракции (возврат в магазин)
 */
function closeFactionChangeDialog() {
    // Старый диалог (если остался)
    const dialog = document.getElementById('faction-change-dialog');
    if (dialog) dialog.remove();

    // Возвращаемся в магазин
    backToShopFromFaction();
};

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
        // ОПТИМИЗАЦИЯ: Скрываем вместо удаления (для быстрого повторного открытия)
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.style.display = 'none';
        }, 300);
    }

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = '';

    console.log('🛒 Магазин закрыт');
}

// ==========================================
// TON ПЛАТЕЖИ
// ==========================================

/**
 * Получить актуальный курс TON/USD
 */
async function getTonPrice() {
    const now = Date.now();

    // Если кэш свежий - возвращаем из кэша
    if (tonPriceCache.lastUpdate && (now - tonPriceCache.lastUpdate) < tonPriceCache.cacheTime) {
        console.log('💎 Курс TON из кэша:', tonPriceCache.priceUSD);
        return tonPriceCache.priceUSD;
    }

    try {
        console.log('💎 Запрос курса TON с CoinGecko API...');
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();

        if (data && data['the-open-network'] && data['the-open-network'].usd) {
            tonPriceCache.priceUSD = data['the-open-network'].usd;
            tonPriceCache.lastUpdate = now;
            console.log('✅ Курс TON обновлён:', tonPriceCache.priceUSD, 'USD');
            return tonPriceCache.priceUSD;
        }
    } catch (error) {
        console.error('❌ Ошибка получения курса TON:', error);
    }

    // Возвращаем дефолтное значение если не удалось получить
    console.log('⚠️ Используется дефолтный курс TON:', tonPriceCache.priceUSD);
    return tonPriceCache.priceUSD;
}

/**
 * Рассчитать цену в TON на основе USD цены
 */
async function calculateTonPrice(priceUSD) {
    const tonPriceUSD = await getTonPrice();
    const tonAmount = priceUSD / tonPriceUSD;
    // Округляем до 2 знаков после запятой
    return Math.ceil(tonAmount * 100) / 100;
}

/**
 * Показать диалог выбора способа оплаты (Stars или TON)
 */
/**
 * Генерация HTML-превью компенсации для диалога покупки пакета
 */
function getCompensationPreviewHTML(pack) {
    const currentTowerLevel = window.userData?.buildings?.wizard_tower?.level || 1;
    const currentWizardCount = window.userData?.wizards?.length || 1;
    const rewards = pack.rewards;
    if (!rewards) return '';

    let lines = [];
    let totalComp = 0;

    if (currentTowerLevel >= rewards.towerLevel) {
        const comp = PACK_COMPENSATIONS.tower[rewards.towerLevel] || 0;
        if (comp > 0) {
            totalComp += comp;
            lines.push(`🏯 Башня уже ${currentTowerLevel} ур → +${Math.floor(comp / 1440)} дн`);
        }
    }

    if (currentWizardCount >= rewards.wizardCount) {
        const comp = PACK_COMPENSATIONS.wizard[rewards.wizardCount] || 0;
        if (comp > 0) {
            totalComp += comp;
            lines.push(`🧙 Уже ${currentWizardCount} магов → +${Math.floor(comp / 1440)} дн`);
        }
    }

    if (lines.length === 0) return '';

    return `
        <div style="
            text-align: left;
            font-size: 13px;
            color: #ffa500;
            margin: 0 0 15px 0;
            padding: 10px;
            background: rgba(255,165,0,0.1);
            border: 1px solid rgba(255,165,0,0.3);
            border-radius: 10px;
        ">
            <div style="font-weight: bold; margin-bottom: 5px;">💰 Ваша компенсация:</div>
            ${lines.map(l => `<div style="margin: 2px 0;">${l}</div>`).join('')}
            <div style="margin-top: 5px; color: #4ade80; font-weight: bold;">
                Итого время: ${Math.floor(rewards.time / 1440)} + ${Math.floor(totalComp / 1440)} = ${Math.floor((rewards.time + totalComp) / 1440)} дней
            </div>
        </div>
    `;
}

async function showPaymentMethodDialog(item, packKey = null) {
    console.log('💳 Показ диалога выбора способа оплаты для:', item.name);

    // Рассчитываем цену в TON
    const tonPrice = await calculateTonPrice(item.priceUSD || 0);

    const dialog = document.createElement('div');
    dialog.id = 'payment-method-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s;
    `;

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ffd700;
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
            <h2 style="color: #ffd700; margin: 0 0 10px 0; text-align: center; font-size: 24px;">
                ${item.icon} ${item.name}
            </h2>
            <p style="color: #aaa; text-align: center; margin: 0 0 15px 0; font-size: 14px;">
                ${item.description}
            </p>

            ${packKey ? getCompensationPreviewHTML(item) : ''}

            <div style="color: #fff; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                Выберите способ оплаты:
            </div>

            <button id="pay-stars-btn" style="
                width: 100%;
                padding: 15px;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid #ffd700;
                border-radius: 12px;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            ">
                <span style="font-size: 24px;">⭐</span>
                <span>${item.price} Stars</span>
            </button>

            <button id="pay-ton-btn" style="
                width: 100%;
                padding: 15px;
                margin-bottom: 20px;
                background: linear-gradient(135deg, #0088cc 0%, #0066cc 100%);
                border: 2px solid #0088cc;
                border-radius: 12px;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            ">
                <span style="font-size: 24px;">💎</span>
                <span>${tonPrice} TON</span>
                <span style="font-size: 12px; opacity: 0.8;">(~$${item.priceUSD})</span>
            </button>

            <button id="cancel-payment-btn" style="
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid #666;
                border-radius: 10px;
                color: #aaa;
                font-size: 14px;
                cursor: pointer;
            ">
                Отмена
            </button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Обработчики кнопок
    document.getElementById('pay-stars-btn').onclick = () => {
        dialog.remove();
        if (packKey) {
            buyStarterPackWithStars(packKey);
        } else {
            buyTimePackWithStars(item);
        }
    };

    document.getElementById('pay-ton-btn').onclick = () => {
        dialog.remove();
        if (packKey) {
            buyStarterPackWithTon(packKey, tonPrice);
        } else {
            buyTimePackWithTon(item, tonPrice);
        }
    };

    document.getElementById('cancel-payment-btn').onclick = () => {
        dialog.remove();
    };

    // Hover эффекты
    const starsBtn = document.getElementById('pay-stars-btn');
    const tonBtn = document.getElementById('pay-ton-btn');

    starsBtn.onmouseover = () => {
        starsBtn.style.transform = 'scale(1.05)';
        starsBtn.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.5)';
    };
    starsBtn.onmouseout = () => {
        starsBtn.style.transform = 'scale(1)';
        starsBtn.style.boxShadow = 'none';
    };

    tonBtn.onmouseover = () => {
        tonBtn.style.transform = 'scale(1.05)';
        tonBtn.style.boxShadow = '0 5px 20px rgba(0, 136, 204, 0.5)';
    };
    tonBtn.onmouseout = () => {
        tonBtn.style.transform = 'scale(1)';
        tonBtn.style.boxShadow = 'none';
    };
}

/**
 * Покупка пакета времени через Stars (старая функция переименована)
 */
async function buyTimePackWithStars(item) {
    return buyTimePack(item);
}

/**
 * Покупка пакета времени через TON
 */
async function buyTimePackWithTon(item, tonPrice) {
    console.log('💎 Покупка через TON:', item.name, tonPrice, 'TON');

    if (!window.tonConnectUI || !window.tonConnectUI.wallet) {
        showShopNotification('⚠️ Сначала подключите TON кошелёк в разделе Airdrop', 'warning');
        return;
    }

    try {
        // Формируем транзакцию (без payload - он вызывал ошибку "Invalid magic")
        // Идентификация транзакции будет по хешу, который вернётся в result
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
            messages: [
                {
                    address: TON_RECEIVER_ADDRESS,
                    amount: String(Math.floor(tonPrice * 1000000000)) // Конвертируем в nanotons
                }
            ]
        };

        console.log('💎 Отправка TON транзакции:', transaction);

        const result = await window.tonConnectUI.sendTransaction(transaction);

        console.log('✅ TON транзакция отправлена:', result);

        // Сразу добавляем время локально (оптимистичное обновление)
        window.userData.time_currency = (window.userData.time_currency || 0) + item.amount;

        // Начисляем airdrop очки (используем USD эквивалент Stars)
        if (typeof window.addAirdropPoints === 'function' && item.priceUSD) {
            const airdropPoints = Math.floor((item.priceUSD / 0.013) / 10);
            if (airdropPoints > 0) {
                window.addAirdropPoints(airdropPoints, 'Покупка TON');
            }
        }

        // Сохраняем в БД
        if (window.eventSaveManager) {
            await window.eventSaveManager.saveImmediate('shop_ton_purchase');
        }

        // Сохраняем транзакцию в БД для отслеживания
        await saveTonPayment(item, tonPrice, result);

        showShopNotification(`✅ +${formatTimePurchase(item.amount)} времени!`, 'success');
        refreshShopUI();

        if (typeof window.updateTimeCurrencyDisplay === 'function') {
            window.updateTimeCurrencyDisplay();
        }

    } catch (error) {
        console.error('❌ Ошибка TON платежа:', error);
        showShopNotification('❌ Ошибка TON платежа', 'error');
    }
}

/**
 * Покупка стартового пакета через Stars (прямая покупка без диалога выбора)
 */
async function buyStarterPackWithStars(packKey) {
    const pack = STARTER_PACKS[packKey];
    if (!pack) {
        console.error('❌ Пакет не найден:', packKey);
        return;
    }

    // Проверяем доступность Telegram WebApp
    if (!window.Telegram?.WebApp) {
        showShopNotification('⚠️ Доступно только в Telegram', 'warning');
        return;
    }

    console.log(`🎁 Покупка пакета через Stars: ${pack.name} (${pack.price} Stars)`);

    try {
        // Создаём invoice через Edge Function
        const invoiceUrl = await createStarsInvoice({ id: pack.id }, pack.price);

        // Открываем окно оплаты Telegram
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            console.log('💳 Payment status:', status);

            if (status === 'paid') {
                // Успешная оплата - награды применятся через webhook
                // Но для моментального отображения применяем локально тоже
                applyStarterPackRewards(pack);

                // Отмечаем как купленный локально
                if (!window.userData.purchased_packs) {
                    window.userData.purchased_packs = {};
                }
                window.userData.purchased_packs[pack.id] = {
                    purchased_at: new Date().toISOString(),
                    rewards: pack.rewards,
                    payment_method: 'stars'
                };

                // Начисляем airdrop очки
                if (typeof window.addAirdropPoints === 'function' && pack.price) {
                    const airdropPoints = Math.floor(pack.price / 10);
                    if (airdropPoints > 0) {
                        window.addAirdropPoints(airdropPoints, 'Покупка Telegram Stars');

                        // Бонус рефереру (10% от BPM coin покупателя)
                        const buyerTelegramId = window.dbManager?.currentPlayer?.telegram_id;
                        if (buyerTelegramId && window.referralManager?.rewardReferrerForPurchase) {
                            window.referralManager.rewardReferrerForPurchase(buyerTelegramId, airdropPoints);
                        }
                    }
                }

                // Сохраняем
                if (window.eventSaveManager?.saveImmediate) {
                    await window.eventSaveManager.saveImmediate('starter_pack_purchase');
                }

                showShopNotification(`🎁 ${pack.name} получен!`, 'success');
                switchShopTab('packs');

            } else if (status === 'cancelled') {
                showShopNotification('Покупка отменена', 'info');
            } else if (status === 'failed') {
                showShopNotification('❌ Ошибка оплаты', 'error');
            }
        });

    } catch (error) {
        console.error('❌ Ошибка покупки пакета:', error);
        showShopNotification('⚠️ Платёжная система временно недоступна', 'warning');
    }
}

/**
 * Покупка стартового пакета через TON
 */
async function buyStarterPackWithTon(packKey, tonPrice) {
    const pack = STARTER_PACKS[packKey];
    if (!pack) return;

    console.log('💎 Покупка стартового пакета через TON:', pack.name, tonPrice, 'TON');

    if (!window.tonConnectUI || !window.tonConnectUI.wallet) {
        showShopNotification('⚠️ Сначала подключите TON кошелёк в разделе Airdrop', 'warning');
        return;
    }

    try {
        // Формируем транзакцию (без payload - он вызывал ошибку "Invalid magic")
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: TON_RECEIVER_ADDRESS,
                    amount: String(Math.floor(tonPrice * 1000000000))
                }
            ]
        };

        const result = await window.tonConnectUI.sendTransaction(transaction);

        console.log('✅ TON транзакция стартового пакета отправлена:', result);

        // Применяем награды локально
        applyStarterPackRewards(pack);

        // Отмечаем как купленный
        if (!window.userData.purchased_packs) {
            window.userData.purchased_packs = {};
        }
        window.userData.purchased_packs[pack.id] = {
            purchased_at: new Date().toISOString(),
            rewards: pack.rewards,
            payment_method: 'ton'
        };

        // Airdrop очки
        if (typeof window.addAirdropPoints === 'function' && pack.priceUSD) {
            const airdropPoints = Math.floor((pack.priceUSD / 0.013) / 10);
            if (airdropPoints > 0) {
                window.addAirdropPoints(airdropPoints, 'Покупка TON');
            }
        }

        if (window.eventSaveManager) {
            await window.eventSaveManager.saveImmediate('shop_ton_purchase');
        }

        await saveTonPayment(pack, tonPrice, result);

        showShopNotification(`🎁 ${pack.name} получен!`, 'success');
        refreshShopUI();

        if (typeof window.updateTimeCurrencyDisplay === 'function') {
            window.updateTimeCurrencyDisplay();
        }

    } catch (error) {
        console.error('❌ Ошибка TON платежа:', error);
        showShopNotification('❌ Ошибка TON платежа', 'error');
    }
}

/**
 * Сохранить TON платёж в БД
 */
async function saveTonPayment(item, tonAmount, txResult) {
    try {
        // Используем user_id который содержит telegram_id
        const telegramId = window.userData?.user_id || window.dbManager?.getTelegramId();

        if (!telegramId) {
            console.error('❌ Не удалось получить telegram_id для сохранения платежа');
            return;
        }

        const { error } = await window.supabaseClient.supabase
            .from('payments')
            .insert({
                telegram_id: telegramId,
                product_id: item.id,
                amount_ton: tonAmount,
                payment_method: 'ton',
                status: 'completed',
                ton_transaction_hash: txResult?.boc || null,
                completed_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Ошибка сохранения TON платежа:', error);
        } else {
            console.log('✅ TON платёж сохранён в БД');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения TON платежа:', error);
    }
}

// Экспорт
window.showShopModal = showShopModal;
window.closeShopModal = closeShopModal;
window.switchShopTab = switchShopTab;
window.buyShopItem = buyShopItem;
window.showChangeFactionDialog = showChangeFactionDialog;
window.buyStarterPack = buyStarterPack;
window.createStarsInvoice = createStarsInvoice;
window.applyExpScroll = applyExpScroll;
window.closeWizardSelectDialog = closeWizardSelectDialog;
window.confirmFactionChange = confirmFactionChange;
window.closeFactionChangeDialog = closeFactionChangeDialog;
window.backToShopFromFaction = backToShopFromFaction;
window.calculateTonPrice = calculateTonPrice;
window.saveTonPayment = saveTonPayment;
window.TON_RECEIVER_ADDRESS = TON_RECEIVER_ADDRESS;

console.log('🛒 Модуль магазина загружен');
