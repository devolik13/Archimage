// core/utilities.js - Общие утилиты и функции для игры

// ============ РЕЖИМЫ РАЗРАБОТКИ ============
window.instantResearchMode = true;  // Мгновенное изучение для тестов
window.instantForgingMode = true;   // Мгновенная ковка для тестов

// ============ UI ФУНКЦИИ ============

// Обновить фон в зависимости от фракции
function updateBackgroundByFaction(faction) {
    const backgrounds = {
        "fire": "linear-gradient(135deg, #ff6b6b, #ffa500)",
        "water": "linear-gradient(135deg, #4d96ff, #00d4ff)",
        "wind": "linear-gradient(135deg, #95ffc4, #a0f0ff)",
        "earth": "linear-gradient(135deg, #96ceb4, #c4b496)",
        "nature": "linear-gradient(135deg, #4ade80, #22c55e)",
        "poison": "linear-gradient(135deg, #84cc16, #65a30d)",
        "hybrid": "linear-gradient(135deg, #ff6b6b, #7c3aed)"
    };

    const background = backgrounds[faction] || backgrounds["fire"];
    document.body.style.background = background;
}

// ============ ФУНКЦИИ ФОРМАТИРОВАНИЯ ============

// Форматировать временную валюту
function formatTimeCurrency(minutes) {
    if (minutes < 60) {
        return `${minutes} мин`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours < 24) {
        return mins > 0 ? `${hours}ч ${mins}м` : `${hours} час`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days < 7) {
        let result = `${days} дн`;
        if (remainingHours > 0) result += ` ${remainingHours}ч`;
        return result;
    }
    
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    return `${weeks} нед ${remainingDays > 0 ? remainingDays + ' дн' : ''}`.trim();
}

// ============ ФУНКЦИИ ЗДАНИЙ ============

// Получить уровень здания
function getBuildingLevel(buildingId) {
    if (!window.userData?.buildings?.[buildingId]) {
        return 0;
    }
    
    return window.userData.buildings[buildingId].level || 1;
}

// Получить множитель силы заклинаний от зданий
function getSpellPowerMultiplier() {
    const wizardTowerLevel = getBuildingLevel('wizard_tower');
    const arcaneLabLevel = getBuildingLevel('arcane_lab');
    
    let multiplier = 1.0;
    
    if (wizardTowerLevel > 0) {
        multiplier += wizardTowerLevel * 0.02;
    }
    
    if (arcaneLabLevel > 0) {
        multiplier += arcaneLabLevel * 0.01;
    }
    
    return multiplier;
}

// Получить бонус здоровья от Башни магов
function applyWizardTowerHealthBonus() {
    const towerLevel = getBuildingLevel('wizard_tower');
    if (towerLevel === 0) return 1.0;
    
    // +10% за каждый уровень
    return 1.0 + (towerLevel * 0.1);
}

// Получить бонус урона от Башни магов
function getWizardTowerDamageBonus() {
    const towerLevel = getBuildingLevel('wizard_tower');
    if (towerLevel === 0) return 1.0; // Возвращаем множитель 1.0 (без бонуса)
    
    // +2% за каждый уровень, возвращаем множитель
    return 1.0 + (towerLevel * 0.02);
}

// ============ ФУНКЦИИ ИССЛЕДОВАНИЙ ============

// Получить множитель скорости исследований
function getResearchSpeedMultiplier() {
    const arcaneLabLevel = getBuildingLevel('arcane_lab');
    if (arcaneLabLevel === 0) return 1;
    
    // Каждый уровень даёт +2% к скорости (максимум 30% на 15 уровне)
    const speedBonus = Math.min(arcaneLabLevel * 0.02, 0.30);
    return 1 + speedBonus;
}

// Расчёт времени исследования с учётом бонусов
function calculateResearchTime(baseTime) {
    const multiplier = getResearchSpeedMultiplier();
    const finalTime = Math.ceil(baseTime / multiplier);
    
    // В режиме разработки - мгновенно
    if (window.instantResearchMode) {
        return 0.1;
    }
    
    return finalTime;
}

// ============ ФУНКЦИИ КОВКИ (УСТАРЕЛО - кузница заменена на гильдию) ============

// Получить множитель скорости ковки (возвращает 1, т.к. кузницы больше нет)
function getForgingSpeedMultiplier() {
    return 1;
}

// Расчёт времени ковки с учётом бонусов
function calculateForgingTime(baseTime) {
    const multiplier = getForgingSpeedMultiplier();
    const finalTime = Math.ceil(baseTime / multiplier);
    
    // В режиме разработки - мгновенно
    if (window.instantForgingMode) {
        return 0.1;
    }
    
    return finalTime;
}

// ============ СОЗДАЁМ ОБЪЕКТ С УТИЛИТАМИ ============
const coreUtilities = {
    // UI функции
    updateBackgroundByFaction,
    
    // Функции форматирования
    formatTimeCurrency,
    
    // Функции зданий
    getBuildingLevel,
    getSpellPowerMultiplier,
    applyWizardTowerHealthBonus,
    getWizardTowerDamageBonus,
    
    // Функции исследований
    getResearchSpeedMultiplier,
    calculateResearchTime,
    
    // Функции ковки
    getForgingSpeedMultiplier,
    calculateForgingTime
};

// ============ ЭКСПОРТИРУЕМ В WINDOW ============
// Экспортируем все функции в window для обратной совместимости
Object.assign(window, coreUtilities);

