// wizards/skin-system.js
// Система скинов для магов

/**
 * Конфигурация доступных скинов
 */
const SKINS_CONFIG = {
    // Стандартные скины фракций (всегда доступны для своей фракции)
    fire_default: {
        id: 'fire_default',
        name: 'Маг Огня',
        description: 'Стандартный облик',
        icon: '🔥',
        faction: 'fire',
        spriteConfig: 'fire',
        unlockType: 'default',
        isDefault: true
    },
    water_default: {
        id: 'water_default',
        name: 'Маг Воды',
        description: 'Стандартный облик',
        icon: '💧',
        faction: 'water',
        spriteConfig: 'water',
        unlockType: 'default',
        isDefault: true
    },
    wind_default: {
        id: 'wind_default',
        name: 'Маг Воздуха',
        description: 'Стандартный облик',
        icon: '💨',
        faction: 'wind',
        spriteConfig: 'wind',
        unlockType: 'default',
        isDefault: true
    },
    earth_default: {
        id: 'earth_default',
        name: 'Маг Земли',
        description: 'Стандартный облик',
        icon: '🪨',
        faction: 'earth',
        spriteConfig: 'earth',
        unlockType: 'default',
        isDefault: true
    },
    nature_default: {
        id: 'nature_default',
        name: 'Маг Природы',
        description: 'Стандартный облик',
        icon: '🌿',
        faction: 'nature',
        spriteConfig: 'nature',
        unlockType: 'default',
        isDefault: true
    },
    poison_default: {
        id: 'poison_default',
        name: 'Маг Яда',
        description: 'Стандартный облик',
        icon: '☠️',
        faction: 'poison',
        spriteConfig: 'poison',
        unlockType: 'default',
        isDefault: true
    },

    // Скины элементалей (открываются за убийство боссов)
    fire_elemental: {
        id: 'fire_elemental',
        name: 'Огненный Элементаль',
        description: 'Облик повелителя огня',
        icon: '🔥✨',
        spriteConfig: 'fire_elemental',
        unlockType: 'boss',
        unlockBoss: 'fire_elemental',
        unlockLevel: 10,
        unlockText: 'Победите Огненного Элементаля (уровень 10)'
    },
    water_elemental: {
        id: 'water_elemental',
        name: 'Водный Элементаль',
        description: 'Облик повелителя воды',
        icon: '💧✨',
        spriteConfig: 'water_elemental',
        unlockType: 'boss',
        unlockBoss: 'water_elemental',
        unlockLevel: 20,
        unlockText: 'Победите Водного Элементаля (уровень 20)'
    },
    wind_elemental: {
        id: 'wind_elemental',
        name: 'Воздушный Элементаль',
        description: 'Облик повелителя воздуха',
        icon: '💨✨',
        spriteConfig: 'air_elemental', // Используем air_elemental спрайты
        unlockType: 'boss',
        unlockBoss: 'wind_elemental',
        unlockLevel: 30,
        unlockText: 'Победите Воздушного Элементаля (уровень 30)'
    },
    earth_elemental: {
        id: 'earth_elemental',
        name: 'Земной Элементаль',
        description: 'Облик повелителя земли',
        icon: '🪨✨',
        spriteConfig: 'earth_elemental',
        unlockType: 'boss',
        unlockBoss: 'earth_elemental',
        unlockLevel: 40,
        unlockText: 'Победите Земного Элементаля (уровень 40)'
    }
};

/**
 * Проверяет, разблокирован ли скин для игрока
 */
function isSkinUnlocked(skinId, wizardFaction = null) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return false;

    // Стандартные скины всегда разблокированы для своей фракции
    if (skin.isDefault && wizardFaction && skin.faction === wizardFaction) {
        return true;
    }

    // Проверяем разблокированные скины в userData
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
 * Получает все доступные скины (порядок для UI)
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

// Экспорт функций
window.SKINS_CONFIG = SKINS_CONFIG;
window.isSkinUnlocked = isSkinUnlocked;
window.unlockSkin = unlockSkin;
window.getWizardSkin = getWizardSkin;
window.setWizardSkin = setWizardSkin;
window.getSkinSpriteConfig = getSkinSpriteConfig;
window.getAllSkinsOrdered = getAllSkinsOrdered;
