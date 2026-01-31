// shop-modal.js - Модальное окно магазина

// Текущая вкладка магазина
let currentShopTab = 'free';

// Кэш для оптимизации - не пересоздаём модалку каждый раз
let shopScreenCache = null;
let shopCachedFaction = null;

// Кэш курса TON (обновляется каждые 5 минут)
let tonPriceCache = {
    priceUSD: 5.0, // Дефолтный курс TON/USD
    lastUpdate: 0,
    cacheTime: 5 * 60 * 1000 // 5 минут
};

// Адрес получателя TON платежей
const TON_RECEIVER_ADDRESS = 'UQAnElrwdRQf8-U0ERo5DAGwitB_ipMOF0plhyDox_HA3bFU';

// Конфигурация стартовых пакетов (одноразовые покупки)
const STARTER_PACKS = {
    small: {
        id: 'starter_pack_small',
        name: '🎁 Малый пакет',
        description: '7 дней времени, Башня магов 3 ур, 2-й маг, 5000 XP',
        icon: '🎁',
        price: 2900,
        priceUSD: 65, // 2900 Stars × $0.0224
        currency: 'dual', // Поддерживает Stars и TON
        fullPrice: 2900,
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
        description: '30 дней времени, Башня магов 5 ур, 3-й маг, 30000 XP',
        icon: '📦',
        price: 10400,
        priceUSD: 233, // 10400 Stars × $0.0224
        currency: 'dual',
        fullPrice: 10400,
        discount: 30,
        requires: 'starter_pack_small', // После малого пакета
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
        description: '90 дней времени, Башня магов 7 ур, 4-й маг, 200000 XP',
        icon: '💎',
        price: 40000,
        priceUSD: 896, // 40000 Stars × $0.0224
        currency: 'dual',
        fullPrice: 40000,
        discount: 30,
        requires: 'starter_pack_medium', // После среднего пакета
        rewards: {
            time: 129600, // 90 дней в минутах
            towerLevel: 7,
            wizardCount: 4,
            experience: 200000
        }
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
        }
    ],

    // Premium товары (за Telegram Stars или TON)
    // Курс: 1 Star = 1.79₽ = $0.0224 USD, TON курс динамический из CoinGecko API
    premium: [
        {
            id: 'time_pack_1hour',
            name: '⏰ 1 час',
            description: '+1 час игрового времени',
            icon: '⏰',
            price: 10,
            priceUSD: 0.22, // 10 Stars × $0.0224
            currency: 'dual',
            action: 'buyTimePack',
            amount: 60
        },
        {
            id: 'time_pack_small',
            name: 'Пакет времени (1 день)',
            description: '+1 день игрового времени',
            icon: '⏰',
            price: 168,
            priceUSD: 3.77, // 168 Stars × $0.0224
            currency: 'dual',
            action: 'buyTimePack',
            amount: 1440
        },
        {
            id: 'time_pack_medium',
            name: 'Пакет времени (7 дней)',
            description: '+7 дней времени (-5%)',
            icon: '⏰⏰',
            price: 1120,
            priceUSD: 25.1, // 1120 Stars × $0.0224
            currency: 'dual',
            action: 'buyTimePack',
            amount: 10080
        },
        {
            id: 'time_pack_large',
            name: 'Пакет времени (30 дней)',
            description: '+30 дней времени (-15%)',
            icon: '⏰⏰⏰',
            price: 4280,
            priceUSD: 95.9, // 4280 Stars × $0.0224
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
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h2 style="margin: 0; color: #ffd700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                            🛒 Магазин
                        </h2>
                        <button onclick="showChangeFactionDialog({id:'faction_change',price:280,priceUSD:6.3,currency:'dual',amount:1,checkFree:true,dynamicPrice:true})" style="
                            background: rgba(100,150,255,0.3);
                            border: 1px solid rgba(100,150,255,0.5);
                            color: white;
                            font-size: ${baseFontSize}px;
                            cursor: pointer;
                            padding: 4px 10px;
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
            } else if (item.dynamicPrice) {
                // Динамическая цена - показываем в диалоге
                priceText = 'Узнать цену';
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
        const isLocked = pack.requires && !purchasedPacks[pack.requires];
        const canBuy = !isPurchased && !isLocked;

        let statusText = '';
        let statusColor = '#4ade80';
        let btnText = `💎 Приобрести`;

        if (isPurchased) {
            statusText = '✅ Куплено';
            statusColor = '#888';
            btnText = 'Получено';
        } else if (isLocked) {
            const requiredPack = Object.values(STARTER_PACKS).find(p => p.id === pack.requires);
            statusText = `🔒 Сначала купите: ${requiredPack?.name || 'предыдущий пакет'}`;
            statusColor = '#ff6b6b';
            btnText = 'Недоступно';
        }

        // Детали награды
        const rewardsHTML = `
            <div style="text-align: left; font-size: ${smallFontSize * 0.9}px; color: #ccc; margin: 10px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                <div>⏰ ${Math.floor(pack.rewards.time / 1440)} дней времени</div>
                <div>🏯 Башня магов ${pack.rewards.towerLevel} ур</div>
                <div>🧙 ${pack.rewards.wizardCount} маг${pack.rewards.wizardCount > 1 ? 'а' : ''}</div>
                <div>✨ ${pack.rewards.experience.toLocaleString()} XP</div>
            </div>
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

    return html;
}

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

    // Проверяем требования
    if (pack.requires && !purchasedPacks[pack.requires]) {
        if (window.showNotification) {
            window.showNotification('⚠️ Сначала купите предыдущий пакет!');
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
 * Применение наград стартового пакета
 */
function applyStarterPackRewards(pack) {
    const rewards = pack.rewards;

    // 1. Добавляем время
    window.userData.time_currency = (window.userData.time_currency || 0) + rewards.time;
    console.log(`⏰ +${rewards.time} минут времени`);

    // 2. Улучшаем башню магов до нужного уровня
    if (!window.userData.buildings) {
        window.userData.buildings = {};
    }
    if (!window.userData.buildings.wizard_tower) {
        window.userData.buildings.wizard_tower = { level: 1 };
    }
    const currentTowerLevel = window.userData.buildings.wizard_tower.level || 1;
    if (rewards.towerLevel > currentTowerLevel) {
        window.userData.buildings.wizard_tower.level = rewards.towerLevel;
        console.log(`🏯 Башня магов: ${currentTowerLevel} → ${rewards.towerLevel}`);
    }

    // 3. Добавляем магов до нужного количества
    if (!window.userData.wizards) {
        window.userData.wizards = [];
    }
    const currentWizardCount = window.userData.wizards.length;
    const wizardsToAdd = rewards.wizardCount - currentWizardCount;

    if (wizardsToAdd > 0) {
        for (let i = 0; i < wizardsToAdd; i++) {
            const newWizard = createNewWizard(currentWizardCount + i + 1);
            window.userData.wizards.push(newWizard);
            console.log(`🧙 Добавлен маг: ${newWizard.name}`);
        }
    }

    // 4. Добавляем опыт первому магу (или распределяем)
    if (window.userData.wizards.length > 0 && rewards.experience > 0) {
        // Распределяем опыт поровну между всеми магами
        const expPerWizard = Math.floor(rewards.experience / window.userData.wizards.length);
        window.userData.wizards.forEach(wizard => {
            // Инициализируем поля опыта если их нет
            if (!wizard.original_max_hp) wizard.original_max_hp = 100;
            wizard.experience = (wizard.experience || 0) + expPerWizard;
            // Пересчитываем уровень
            updateWizardLevel(wizard);
        });
        console.log(`✨ +${rewards.experience} XP (${expPerWizard} на мага)`);
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
    if (!wizard.original_max_hp) wizard.original_max_hp = 100;
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
function calculateSpellTimeFromDB() {
    const spellTime = { fire: 0, water: 0, earth: 0, wind: 0, nature: 0, poison: 0 };
    const spells = window.userData?.spells || {};

    // Базовое время по тирам (в минутах)
    const tierTimes = { 1: 1440, 2: 2880, 3: 4320, 4: 7200, 5: 10080 };

    // Для каждой фракции считаем потраченное время
    Object.keys(spells).forEach(faction => {
        const factionSpells = spells[faction] || {};

        Object.values(factionSpells).forEach(spell => {
            const level = spell.level || 0;
            const tier = spell.tier || 1;

            if (level > 0) {
                // Формула: время = tierTime × L × (L+1) / 4
                // Где L = текущий уровень заклинания
                const baseTime = tierTimes[tier] || 1440;
                const totalTime = Math.floor(baseTime * level * (level + 1) / 4);
                spellTime[faction] = (spellTime[faction] || 0) + totalTime;
            }
        });
    });

    return spellTime;
}

/**
 * Расчёт динамической цены смены фракции на конкретную целевую фракцию
 * Формула: цена зависит от баланса между сэкономленным (на своей) и переплаченным (на целевой)
 * Минимум: 280⭐ (~500₽), максимум: неограничено
 */
function calculateFactionChangePrice(targetFaction) {
    const MIN_PRICE_STARS = 280; // ~500 рублей минимум
    const STARS_PER_DAY = 168;   // 7⭐ × 24ч

    const currentFaction = window.userData?.faction || 'fire';
    // Всегда считаем актуальные данные из БД
    const spellTime = calculateSpellTimeFromDB();

    // Время на текущую (свою) фракцию - игрок получил скидку 15%
    const ownTime = spellTime[currentFaction] || 0;
    // Время на целевую фракцию - игрок переплатил (не было скидки)
    const targetTime = spellTime[targetFaction] || 0;

    // Экономия от скидки 15% на своей = потраченное время × 0.176
    // Переплата на целевой = то что бы сэкономил со скидкой
    const savedMinutes = ownTime * 0.176;
    const overpaidMinutes = targetTime * 0.176;

    // Баланс: сэкономленное - переплаченное
    // Если больше сэкономил на своей → платит больше за уход
    // Если больше переплатил на целевой → платит меньше за переход
    const balanceMinutes = savedMinutes - overpaidMinutes;

    // Переводим в Stars (минуты → дни → Stars)
    const balanceDays = balanceMinutes / 1440;
    const balanceStars = Math.ceil(balanceDays * STARS_PER_DAY);

    // Итоговая цена: минимум MIN_PRICE_STARS
    const finalPrice = Math.max(MIN_PRICE_STARS, balanceStars);

    // Время в днях для отображения
    const ownDays = Math.round(ownTime / 1440 * 10) / 10;
    const targetDays = Math.round(targetTime / 1440 * 10) / 10;

    console.log(`💰 Цена ${currentFaction}→${targetFaction}: своя=${ownDays}дн, цель=${targetDays}дн, баланс=${balanceMinutes.toFixed(0)}мин, цена=${finalPrice}⭐`);

    return {
        price: finalPrice,
        ownTime,
        targetTime,
        ownDays,
        targetDays,
        savedMinutes: Math.round(savedMinutes),
        overpaidMinutes: Math.round(overpaidMinutes),
        isMinimum: balanceStars <= MIN_PRICE_STARS
    };
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
        dark: '🌑 Тьма'
    };

    // Рассчитываем цену для каждой целевой фракции
    const factionPrices = {};
    factions.filter(f => f !== currentFaction).forEach(faction => {
        factionPrices[faction] = calculateFactionChangePrice(faction);
    });

    // Сохраняем цены для использования в confirmFactionChange
    window._factionChangePrices = factionPrices;

    // Генерируем кнопки фракций
    const factionButtons = factions
        .filter(f => f !== currentFaction)
        .map(faction => {
            const priceInfo = factionPrices[faction];
            const priceColor = priceInfo.isMinimum ? '#4ade80' : '#ffa500';
            const timeSpentText = priceInfo.targetDays > 0
                ? `изучено ${priceInfo.targetDays} дн.`
                : 'не изучалось';

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
                    <div style="font-size: ${smallFontSize}px; color: #888; margin-bottom: 4px;">${timeSpentText}</div>
                    <div style="font-size: ${baseFontSize}px; color: ${priceColor}; font-weight: bold;">
                        ${isFree ? '🆓 Бесплатно' : `⭐${priceInfo.price}`}
                    </div>
                </button>
            `;
        }).join('');

    // Заголовок с информацией
    const headerText = isFree
        ? '<span style="color: #4ade80;">Первая смена бесплатно!</span>'
        : 'Цена зависит от изученных заклинаний';

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
 * Подтверждение смены фракции
 */
async function confirmFactionChange(newFaction) {
    const isFree = !window.userData?.faction_changed;
    // Используем цену для конкретной целевой фракции
    const dynamicPrice = window._factionChangePrices?.[newFaction]?.price || 280;

    if (!isFree) {
        // Платная смена через Stars
        if (!window.Telegram?.WebApp) {
            showShopNotification('⚠️ Доступно только в Telegram', 'warning');
            closeFactionChangeDialog();
            return;
        }

        console.log('🔄 Смена фракции на:', newFaction, `(${dynamicPrice} Stars)`);

        try {
            // Создаём invoice через Edge Function с целевой фракцией
            const invoiceUrl = await createStarsInvoice(
                { id: 'faction_change' },
                dynamicPrice,
                newFaction
            );

            // Открываем оплату Stars
            window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
                console.log('💳 Payment status:', status);

                if (status === 'paid') {
                    // Начисляем airdrop очки за покупку Stars (100 Stars = 10 очков)
                    if (typeof window.addAirdropPoints === 'function' && dynamicPrice) {
                        const airdropPoints = Math.floor(dynamicPrice / 10);
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
function applyFactionChange(newFaction) {
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
        poison: 'Яд'
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
            <p style="color: #aaa; text-align: center; margin: 0 0 25px 0; font-size: 14px;">
                ${item.description}
            </p>

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
 * Покупка стартового пакета через Stars
 */
async function buyStarterPackWithStars(packKey) {
    return buyStarterPack(packKey);
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
window.applyExpScroll = applyExpScroll;
window.closeWizardSelectDialog = closeWizardSelectDialog;
window.confirmFactionChange = confirmFactionChange;
window.closeFactionChangeDialog = closeFactionChangeDialog;
window.backToShopFromFaction = backToShopFromFaction;

console.log('🛒 Модуль магазина загружен');
