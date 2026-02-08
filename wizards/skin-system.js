// wizards/skin-system.js
// Система скинов для магов

/**
 * Конфигурация доступных скинов
 *
 * Логика разблокировки:
 * - Образ текущей фракции мага всегда доступен
 * - Образы других фракций открываются за убийство соответствующих элементалей:
 *   - Огненный элементаль (уровень 10) → образ Мага Огня
 *   - Водный элементаль (уровень 20) → образ Мага Воды
 *   - Воздушный элементаль (уровень 30) → образ Мага Воздуха
 *   - Земной элементаль (уровень 40) → образ Мага Земли
 * - Природа и Яд пока без боссов (только для своей фракции)
 */
const SKINS_CONFIG = {
    fire_default: {
        id: 'fire_default',
        name: 'Маг Огня',
        description: 'Облик повелителя пламени',
        icon: '🔥',
        faction: 'fire',
        spriteConfig: 'fire',
        isDefault: true,
        // Открывается убийством Огненного Элементаля или по умолчанию для магов огня
        unlockType: 'boss',
        unlockBoss: 'fire_elemental',
        unlockLevel: 10,
        unlockText: 'Победите Огненного Элементаля (уровень 10)'
    },
    water_default: {
        id: 'water_default',
        name: 'Маг Воды',
        description: 'Облик повелителя волн',
        icon: '💧',
        faction: 'water',
        spriteConfig: 'water',
        isDefault: true,
        unlockType: 'boss',
        unlockBoss: 'water_elemental',
        unlockLevel: 20,
        unlockText: 'Победите Водного Элементаля (уровень 20)'
    },
    wind_default: {
        id: 'wind_default',
        name: 'Маг Воздуха',
        description: 'Облик повелителя ветров',
        icon: '💨',
        faction: 'wind',
        spriteConfig: 'wind',
        isDefault: true,
        unlockType: 'boss',
        unlockBoss: 'wind_elemental',
        unlockLevel: 30,
        unlockText: 'Победите Воздушного Элементаля (уровень 30)'
    },
    earth_default: {
        id: 'earth_default',
        name: 'Маг Земли',
        description: 'Облик повелителя камня',
        icon: '🪨',
        faction: 'earth',
        spriteConfig: 'earth',
        isDefault: true,
        unlockType: 'boss',
        unlockBoss: 'earth_elemental',
        unlockLevel: 40,
        unlockText: 'Победите Земного Элементаля (уровень 40)'
    },
    nature_default: {
        id: 'nature_default',
        name: 'Маг Природы',
        description: 'Облик хранителя леса',
        icon: '🌿',
        faction: 'nature',
        spriteConfig: 'nature',
        isDefault: true,
        unlockType: 'faction_only', // Пока только для своей фракции
        unlockText: 'Доступен только магам Природы'
    },
    poison_default: {
        id: 'poison_default',
        name: 'Маг Яда',
        description: 'Облик мастера отравы',
        icon: '☠️',
        faction: 'poison',
        spriteConfig: 'poison',
        isDefault: true,
        unlockType: 'faction_only', // Пока только для своей фракции
        unlockText: 'Доступен только магам Яда'
    },

    // ===== ПРЕМИУМ ОБРАЗЫ (покупаемые) =====
    lady_fire: {
        id: 'lady_fire',
        name: 'Огненная Леди',
        description: 'Элегантная воительница в доспехах пламени',
        icon: '👸',
        faction: 'fire',
        spriteConfig: 'lady_fire',
        isDefault: false,
        isPremium: true,
        unlockType: 'purchase',
        price: 165, // Stars
        priceUSD: 3.70, // 165 × $0.0224
        currency: 'dual', // Stars или TON
        unlockText: '165 ⭐ или TON'
    },
    lord_demon: {
        id: 'lord_demon',
        name: 'Повелитель Хаоса',
        description: 'Облик финального босса приключений',
        icon: '👑',
        faction: 'fire',
        spriteConfig: 'lord_demon',
        customSpritePath: 'images/enemies/lord_demon', // Спрайты в enemies, не в wizards
        isDefault: false,
        isPremium: true,
        unlockType: 'purchase',
        price: 575, // Stars (~$150 при $0.26/star)
        priceUSD: 150.00,
        currency: 'dual', // Stars или TON
        unlockText: '575 ⭐ или TON'
    }
};

/**
 * Проверяет, разблокирован ли скин для игрока
 */
function isSkinUnlocked(skinId, wizardFaction = null) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return false;

    // 1. Образ своей фракции всегда доступен
    if (skin.isDefault && wizardFaction && skin.faction === wizardFaction) {
        return true;
    }

    // 2. Для faction_only скинов - только своя фракция
    if (skin.unlockType === 'faction_only') {
        return wizardFaction && skin.faction === wizardFaction;
    }

    // 3. Для покупаемых скинов - проверяем в unlocked_skins
    if (skin.unlockType === 'purchase') {
        const unlockedSkins = window.userData?.unlocked_skins || [];
        return unlockedSkins.includes(skinId);
    }

    // 4. Проверяем разблокированные скины в userData (убитые боссы)
    const unlockedSkins = window.userData?.unlocked_skins || [];
    return unlockedSkins.includes(skinId);
}

/**
 * Разблокирует скин
 */
async function unlockSkin(skinId) {
    if (!window.userData) return false;

    const unlockedSkins = window.userData.unlocked_skins || [];

    // Если уже разблокирован
    if (unlockedSkins.includes(skinId)) {
        return false;
    }

    // Добавляем скин
    unlockedSkins.push(skinId);
    window.userData.unlocked_skins = unlockedSkins;

    // Сохраняем в БД
    if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
        await window.dbManager.savePlayer(window.userData);
        console.log(`✅ Скин ${skinId} разблокирован и сохранён`);
    }

    return true;
}

/**
 * Получает текущий скин мага
 */
function getWizardSkin(wizardId, wizardFaction) {
    if (!window.userData?.wizard_skins) {
        // Возвращаем стандартный скин фракции
        return `${wizardFaction}_default`;
    }

    const skinId = window.userData.wizard_skins[wizardId];

    // Если скин не установлен, возвращаем стандартный
    if (!skinId) {
        return `${wizardFaction}_default`;
    }

    return skinId;
}

/**
 * Устанавливает скин для мага
 */
async function setWizardSkin(wizardId, skinId) {
    if (!window.userData) return false;

    // Инициализируем объект если его нет
    if (!window.userData.wizard_skins) {
        window.userData.wizard_skins = {};
    }

    // Устанавливаем скин (null = стандартный скин фракции)
    window.userData.wizard_skins[wizardId] = skinId;

    // Сохраняем в БД
    if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
        await window.dbManager.savePlayer(window.userData);
        console.log(`✅ Скин ${skinId} установлен для мага ${wizardId}`);
    }

    return true;
}

/**
 * Получает конфигурацию спрайтов для скина
 */
function getSkinSpriteConfig(skinId) {
    const skin = SKINS_CONFIG[skinId];
    return skin ? skin.spriteConfig : null;
}

/**
 * Получает все стандартные скины (порядок для UI)
 */
function getAllSkinsOrdered() {
    return [
        // Первый ряд
        'fire_default',
        'water_default',
        'wind_default',

        // Второй ряд
        'earth_default',
        'nature_default',
        'poison_default'
    ];
}

/**
 * Получает все премиум скины (покупаемые)
 */
function getPremiumSkinsOrdered() {
    return Object.keys(SKINS_CONFIG).filter(id => SKINS_CONFIG[id].isPremium);
}

/**
 * Получает информацию о скине для покупки
 */
function getSkinPurchaseInfo(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin || !skin.isPremium) return null;

    return {
        id: skin.id,
        name: skin.name,
        description: skin.description,
        icon: skin.icon,
        price: skin.price,
        priceUSD: skin.priceUSD,
        currency: skin.currency,
        faction: skin.faction
    };
}

// Экспорт функций
window.SKINS_CONFIG = SKINS_CONFIG;
window.isSkinUnlocked = isSkinUnlocked;
window.unlockSkin = unlockSkin;
window.getWizardSkin = getWizardSkin;
window.setWizardSkin = setWizardSkin;
window.getSkinSpriteConfig = getSkinSpriteConfig;
window.getAllSkinsOrdered = getAllSkinsOrdered;
window.getPremiumSkinsOrdered = getPremiumSkinsOrdered;
window.getSkinPurchaseInfo = getSkinPurchaseInfo;
