// core/constants.js - Все игровые константы в одном месте

// ============ РЕЖИМЫ ============
// DEV_MODE - управляет видимостью отладочных элементов:
//    true = видны DEV-кнопки и кликабельные зоны
//    false = скрыты DEV-кнопки и кликабельные зоны
//
// BETA_MODE - управляет скоростью времени:
//    true = 10x быстрее (для бета-теста)
//    false = нормальная скорость (для релиза)

window.DEV_MODE = false;  // Отключено для бета-теста
window.BETA_MODE = true;  // Включено для бета-теста (10x скорость)
window.TIME_MULTIPLIER = window.BETA_MODE ? 0.1 : 1; // 10x быстрее для беты

// ============ СИСТЕМА ЭНЕРГИИ БОЕВ ============
window.BATTLE_ENERGY = {
    MAX: 12,                    // Максимум попыток
    REGEN_TIME: 120,            // Минут на 1 попытку (2 часа)
    REGEN_TIME_MS: 120 * 60000  // В миллисекундах
};

// ============ ВРЕМЯ СТРОИТЕЛЬСТВА ============
window.CONSTRUCTION_TIME = {
    // Базовое время для всех зданий (в минутах)
    library: 1440 * window.TIME_MULTIPLIER,
    wizard_tower: 1440 * window.TIME_MULTIPLIER,
    blessing_tower: 1440 * window.TIME_MULTIPLIER,
    time_generator: 1440 * window.TIME_MULTIPLIER,
    pvp_arena: 1440 * window.TIME_MULTIPLIER,
    guild: 1440 * window.TIME_MULTIPLIER,
    arcane_lab: 1440 * window.TIME_MULTIPLIER,
    
    // Время улучшения (прогрессивное)
    getUpgradeTime: function(buildingId, targetLevel) {
        const baseTime = 1440 * window.TIME_MULTIPLIER;
        return Math.floor(baseTime * targetLevel * (1 + targetLevel/10));
    }
};

// ============ ВРЕМЯ ИЗУЧЕНИЯ ЗАКЛИНАНИЙ ============
window.SPELL_LEARNING_TIME = {
    getLearnTime: function(tier, currentLevel, faction = null) {
        const tierTimes = {
            1: 144,  // 2.4 часа
            2: 288,  // 4.8 часов
            3: 432,  // 7.2 часов
            4: 576,  // 9.6 часов
            5: 720   // 12 часов
        };
        let baseTime = (tierTimes[tier] || 144) * window.TIME_MULTIPLIER;
        baseTime = Math.floor(baseTime * (currentLevel + 1) * 0.5);

        // Применяем бонус от Арканской лаборатории
        if (typeof window.getResearchSpeedMultiplier === 'function') {
            const multiplier = window.getResearchSpeedMultiplier();
            const originalTime = baseTime;
            baseTime = Math.floor(baseTime * multiplier);

            // Логирование для отладки
            const labLevel = window.getBuildingLevel ? window.getBuildingLevel('arcane_lab') : 0;
            if (labLevel > 0) {
                const reduction = Math.round((1 - multiplier) * 100);
                console.log(`🧪 Арканская лаборатория ур.${labLevel}: -${reduction}% времени изучения (${originalTime} → ${baseTime} минут)`);
            }
        }

        // Бонус фракции: -15% если учим заклинание своей фракции
        if (faction && window.userData?.faction === faction) {
            const timeBeforeFactionBonus = baseTime;
            baseTime = Math.floor(baseTime * 0.85); // -15%
            console.log(`✨ Бонус фракции ${faction}: -15% времени изучения (${timeBeforeFactionBonus} → ${baseTime} минут)`);
        }

        return Math.max(1, baseTime); // Минимум 1 минута
    }
};

// ============ ВРЕМЯ НАЙМА МАГОВ ============
window.WIZARD_HIRE_TIME = {
    getHireTime: function(wizardCount) {
        const daySchedule = [0, 5, 15, 25, 35];
        const day = daySchedule[wizardCount] || 37;
        return day * 1440 * window.TIME_MULTIPLIER;
    }
};