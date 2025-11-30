// shared/spell-types.js - Система типов заклинаний

// Типы заклинаний
const SPELL_TYPES = {
    SINGLE_TARGET: 'single_target',    // Одна цель (spark, icicle)
    MULTI_TARGET: 'multi_target',      // Несколько отдельных целей (firebolt)
    AOE_FIXED: 'aoe_fixed',           // Фиксированная область (stone_spike)
    AOE_SPLASH: 'aoe_splash',         // Область вокруг цели (frost_arrow)
    PROJECTILE: 'projectile',         // Движущийся снаряд (wind_blade)
    CHAIN: 'chain',                   // Цепное заклинание
    SUMMON: 'summon',                 // Призыв существ
    BUFF: 'buff',                     // Бафы/дебафы
    TRANSFORM: 'transform'            // Изменение поля боя
};

// Конфигурация заклинаний с типами
const SPELL_CONFIG = {
    // Огонь
    "spark": { 
        type: SPELL_TYPES.SINGLE_TARGET,
        targeting: 'standard',
        effects: ['burn']
    },
    "firebolt": { 
        type: SPELL_TYPES.MULTI_TARGET,
        targeting: 'multi_random',
        effects: ['burn']
    },
    
    // Земля  
    "pebble": { 
        type: SPELL_TYPES.SINGLE_TARGET,
        targeting: 'standard',
        effects: []
    },
    "stone_spike": { 
        type: SPELL_TYPES.AOE_FIXED,
        targeting: 'fixed_pattern',
        pattern: 'cross',
        effects: []
    },
    
    // Вода
    "icicle": { 
        type: SPELL_TYPES.SINGLE_TARGET,
        targeting: 'standard',
        effects: ['chill']
    },
    "frost_arrow": { 
        type: SPELL_TYPES.AOE_SPLASH,
        targeting: 'main_plus_splash',
        splash_radius: 2,
        effects: ['chill', 'freeze']
    },
    
    // Воздух
    "gust": { 
        type: SPELL_TYPES.SINGLE_TARGET,
        targeting: 'standard',
        effects: []
    },
    "wind_blade": { 
        type: SPELL_TYPES.PROJECTILE,
        targeting: 'projectile_path',
        movement: 'circular',
        effects: []
    }
    
    // Добавить остальные заклинания...
};

// Функция получения конфигурации заклинания
function getSpellConfig(spellId) {
    return SPELL_CONFIG[spellId] || {
        type: SPELL_TYPES.SINGLE_TARGET,
        targeting: 'standard',
        effects: []
    };
}

// Функция проверки типа заклинания
function isAOESpell(spellId) {
    const config = getSpellConfig(spellId);
    return config.type === SPELL_TYPES.AOE_FIXED || 
           config.type === SPELL_TYPES.AOE_SPLASH ||
           config.type === SPELL_TYPES.MULTI_TARGET;
}

function isSingleTargetSpell(spellId) {
    const config = getSpellConfig(spellId);
    return config.type === SPELL_TYPES.SINGLE_TARGET;
}

function isProjectileSpell(spellId) {
    const config = getSpellConfig(spellId);
    return config.type === SPELL_TYPES.PROJECTILE;
}

// Улучшенная функция поиска целей с учетом типа заклинания
function findTargetsForSpell(spellId, casterPosition, casterType) {
    const config = getSpellConfig(spellId);
    
    switch (config.type) {
        case SPELL_TYPES.SINGLE_TARGET:
            return findSingleTarget(casterPosition, casterType);
            
        case SPELL_TYPES.AOE_FIXED:
            return findAOEFixedTargets(spellId, casterPosition, casterType);
            
        case SPELL_TYPES.AOE_SPLASH:
            return findAOESplashTargets(spellId, casterPosition, casterType);
            
        case SPELL_TYPES.MULTI_TARGET:
            return findMultiTargets(spellId, casterPosition, casterType);
            
        case SPELL_TYPES.PROJECTILE:
            return findProjectileTarget(spellId, casterPosition, casterType);
            
        default:
            return findSingleTarget(casterPosition, casterType);
    }
}

// Реализация поиска для разных типов
function findSingleTarget(position, casterType) {
    // Стандартный поиск одной цели
    return window.findTarget ? window.findTarget(position, casterType) : null;
}

function findAOEFixedTargets(spellId, position, casterType) {
    // Для stone_spike - фиксированный паттерн, НЕ ищем альтернативные цели
    if (spellId === 'stone_spike') {
        return window.findStoneSpikeTargets ? 
            window.findStoneSpikeTargets(position, casterType, 4, 1) : [];
    }
    return [];
}

function findAOESplashTargets(spellId, position, casterType) {
    // Для frost_arrow - основная цель + область вокруг
    const mainTarget = findSingleTarget(position, casterType);
    if (!mainTarget) return [];
    
    const targets = [{ target: mainTarget, type: 'main' }];
    
    // Добавляем цели в области поражения
    const config = getSpellConfig(spellId);
    const radius = config.splash_radius || 1;
    
    for (let i = 1; i <= radius; i++) {
        const leftPos = (mainTarget.position - i + 5) % 5;
        const rightPos = (mainTarget.position + i) % 5;
        
        const leftTarget = window.findTargetAtPosition ? 
            window.findTargetAtPosition(leftPos, casterType) : null;
        const rightTarget = window.findTargetAtPosition ? 
            window.findTargetAtPosition(rightPos, casterType) : null;
            
        if (leftTarget) targets.push({ target: leftTarget, type: 'splash' });
        if (rightTarget) targets.push({ target: rightTarget, type: 'splash' });
    }
    
    return targets;
}

function findMultiTargets(spellId, position, casterType) {
    // Для firebolt - множественные случайные цели
    const targets = [];
    const mainTarget = findSingleTarget(position, casterType);
    
    if (mainTarget) {
        targets.push({ target: mainTarget, type: 'main' });
    }
    
    // Добавляем случайные цели
    const randomTargets = window.findRandomTarget ? 
        [window.findRandomTarget(casterType)] : [];
        
    randomTargets.forEach(target => {
        if (target && target !== mainTarget) {
            targets.push({ target: target, type: 'random' });
        }
    });
    
    return targets;
}

function findProjectileTarget(spellId, position, casterType) {
    // Для wind_blade - начальная цель для снаряда
    return findSingleTarget(position, casterType);
}

// Экспорт
window.SPELL_TYPES = SPELL_TYPES;
window.SPELL_CONFIG = SPELL_CONFIG;
window.getSpellConfig = getSpellConfig;
window.isAOESpell = isAOESpell;
window.isSingleTargetSpell = isSingleTargetSpell;
window.isProjectileSpell = isProjectileSpell;
window.findTargetsForSpell = findTargetsForSpell;