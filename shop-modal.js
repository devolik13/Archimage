// shop-modal.js - Модальное окно магазина

// Текущая вкладка магазина
let currentShopTab = 'free';

// Конфигурация стартовых пакетов (одноразовые покупки)
const STARTER_PACKS = {
    small: {
        id: 'starter_pack_small',
        name: '🎁 Малый пакет',
        description: '7 дней времени, Башня магов 3 ур, 2-й маг, 5000 XP',
        icon: '🎁',
        price: 0, // Для теста бесплатно, потом 2900 Stars
        currency: 'stars',
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
        price: 0, // Для теста бесплатно, потом 10400 Stars
        currency: 'stars',
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
        price: 0, // Для теста бесплатно, потом 40000 Stars
        currency: 'stars',
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

    // Premium товары (за Telegram Stars)
    // Курс: 7 Stars = 1 час = 60 минут, 168 Stars = 1 день
    premium: [
        {
            id: 'time_pack_small',
            name: 'Пакет времени (1 день)',
            description: '+1 день игрового времени',
            icon: '⏰',
            price: 168, // 7 Stars × 24 часа
            currency: 'stars',
            action: 'buyTimePack',
            amount: 1440 // 1 день в минутах
        },
        {
            id: 'time_pack_medium',
            name: 'Пакет времени (7 дней)',
            description: '+7 дней времени (-5%)',
            icon: '⏰⏰',
            price: 1120, // 168 × 7 × 0.95 ≈ 1120
            currency: 'stars',
            action: 'buyTimePack',
            amount: 10080 // 7 дней
        },
        {
            id: 'time_pack_large',
            name: 'Пакет времени (30 дней)',
            description: '+30 дней времени (-15%)',
            icon: '⏰⏰⏰',
            price: 4280, // 168 × 30 × 0.85 ≈ 4280
            currency: 'stars',
            action: 'buyTimePack',
            amount: 43200 // 30 дней
        },
        {
            id: 'faction_change',
            name: 'Смена фракции',
            description: 'Цена зависит от изученных заклинаний',
            icon: '🔄',
            price: 0, // Динамическая цена, показывается в диалоге
            currency: 'stars',
            action: 'changeFaction',
            amount: 1,
            checkFree: true, // Проверить бесплатную смену
            dynamicPrice: true // Цена рассчитывается динамически
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
        let btnText = pack.price === 0 ? '🆓 Бесплатно (тест)' : `⭐ ${pack.price}`;

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
 * Покупка стартового пакета
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

    console.log(`🎁 Покупка пакета: ${pack.name}`);

    // Применяем награды
    applyStarterPackRewards(pack);

    // Отмечаем как купленный
    if (!window.userData.purchased_packs) {
        window.userData.purchased_packs = {};
    }
    window.userData.purchased_packs[pack.id] = {
        purchased_at: new Date().toISOString(),
        rewards: pack.rewards
    };

    console.log('📦 [DEBUG] purchased_packs после покупки:', JSON.stringify(window.userData.purchased_packs));

    // Сохраняем
    if (window.eventSaveManager?.saveImmediate) {
        const saveResult = await window.eventSaveManager.saveImmediate('starter_pack_purchase');
        console.log('📦 [DEBUG] Результат сохранения:', saveResult);
    } else {
        console.warn('⚠️ eventSaveManager.saveImmediate не найден!');
    }

    // Показываем уведомление
    if (window.showNotification) {
        window.showNotification(`🎁 ${pack.name} получен!`);
    }

    // Обновляем UI магазина
    switchShopTab('packs');
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
        armor: 50,
        max_armor: 50,
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

    // Рассчитываем цену для каждой целевой фракции
    const factionPrices = {};
    factions.filter(f => f !== currentFaction).forEach(faction => {
        factionPrices[faction] = calculateFactionChangePrice(faction);
    });

    // Сохраняем цены для использования в confirmFactionChange
    window._factionChangePrices = factionPrices;

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
        .map(faction => {
            const priceInfo = factionPrices[faction];
            const priceColor = priceInfo.isMinimum ? '#4ade80' : '#ffa500';
            const timeSpentText = priceInfo.targetDays > 0
                ? `изучено ${priceInfo.targetDays} дн.`
                : 'не изучалось';

            return `
                <button onclick="confirmFactionChange('${faction}')" style="
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.6);
                    border: 1px solid rgba(255,215,0,0.3);
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    min-width: 140px;
                " onmouseover="this.style.borderColor='#ffd700'; this.style.background='rgba(0,0,0,0.8)'"
                   onmouseout="this.style.borderColor='rgba(255,215,0,0.3)'; this.style.background='rgba(0,0,0,0.6)'">
                    <div style="font-size: 16px; margin-bottom: 4px;">${factionNames[faction]}</div>
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">${timeSpentText}</div>
                    <div style="font-size: 13px; color: ${priceColor}; font-weight: bold;">
                        ${isFree ? '🆓 Бесплатно' : `⭐${priceInfo.price}`}
                    </div>
                </button>
            `;
        }).join('');

    // Заголовок с информацией
    const headerText = isFree
        ? '<span style="color: #4ade80;">Первая смена бесплатно!</span>'
        : 'Цена зависит от изученных заклинаний';

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            max-width: 400px;
            text-align: center;
        ">
            <h3 style="color: #ffd700; margin: 0 0 10px 0;">🔄 Смена фракции</h3>
            <p style="color: #aaa; font-size: 13px; margin-bottom: 10px;">
                ${headerText}
            </p>
            <p style="color: #4ade80; font-size: 11px; margin-bottom: 15px;">
                ✅ Маги, здания и заклинания сохраняются!
            </p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px;">
                ${factionButtons}
            </div>
            <button onclick="closeFactionChangeDialog()" style="
                width: 100%;
                margin-top: 10px;
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
    // Используем цену для конкретной целевой фракции
    const dynamicPrice = window._factionChangePrices?.[newFaction]?.price || 280;

    if (!isFree) {
        // Платная смена через Stars
        if (!window.Telegram?.WebApp) {
            showShopNotification('⚠️ Доступно только в Telegram', 'warning');
            closeFactionChangeDialog();
            return;
        }

        try {
            // Открываем оплату Stars с динамической ценой
            window.Telegram.WebApp.openInvoice(
                await createStarsInvoice({
                    id: 'faction_change',
                    name: 'Смена фракции',
                    description: `Изменить школу магии (⭐${dynamicPrice})`,
                    price: dynamicPrice
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
window.buyStarterPack = buyStarterPack;
window.applyExpScroll = applyExpScroll;
window.closeWizardSelectDialog = closeWizardSelectDialog;
window.confirmFactionChange = confirmFactionChange;
window.closeFactionChangeDialog = closeFactionChangeDialog;

console.log('🛒 Модуль магазина загружен');
