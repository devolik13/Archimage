// config/spells/spell-functions.js - Функции для работы с заклинаниями
console.log('✅ config/spells/spell-functions.js загружен');

// ============ БАЗОВЫЕ ФУНКЦИИ ============

// Получить название заклинания по ID
function getSpellNameById(spellId) {
    return window.SPELL_NAMES?.[spellId] || spellId;
}

// Получить название фракции
function getFactionName(faction) {
    return window.FACTION_NAMES?.[faction] || faction;
}

// Получить эмодзи фракции
function getFactionEmoji(faction) {
    return window.FACTION_EMOJIS?.[faction] || '❓';
}

// Получить цвет фракции
function getFactionColor(faction) {
    return window.FACTION_COLORS?.[faction] || '#999999';
}

// ============ ФУНКЦИИ ОПРЕДЕЛЕНИЯ ТИПОВ ============

// Определение типа заклинания
function getSpellType(spellId) {
    // Проверяем в SPELL_TYPE_CONFIG
    if (window.SPELL_TYPE_CONFIG?.[spellId]) {
        const type = window.SPELL_TYPE_CONFIG[spellId];
        return typeof type === 'string' ? type : type.type;
    }
    
    // По умолчанию
    return 'single_target';
}

// Проверка типов заклинаний
function isAOESpell(spellId) {
    const type = getSpellType(spellId);
    return type === 'aoe' || type === 'aoe_fixed' || type === 'aoe_splash';
}

function isSingleTargetSpell(spellId) {
    return getSpellType(spellId) === 'single_target';
}

function isBuffSpell(spellId) {
    return getSpellType(spellId) === 'buff';
}

function isSummonSpell(spellId) {
    return getSpellType(spellId) === 'summon';
}

// ============ ФУНКЦИИ РАБОТЫ С ЗАКЛИНАНИЯМИ ============

// Определить ступень заклинания
function getSpellTierById(faction, spellId) {
    const tierIndex = window.SPELL_TIERS?.[faction]?.indexOf(spellId);
    
    if (tierIndex !== -1 && tierIndex !== undefined) {
        return tierIndex + 1;
    }
    
    console.warn(`⚠️ Не удалось определить ступень для заклинания ${spellId} школы ${faction}`);
    return 1;
}

// Расчет урона заклинания
function getSpellDamage(spellId, spellLevel = 1) {
    // Особая логика для каменного шипа
    if (spellId === 'stone_spike') {
        const spikeDamageByLevel = [4, 5, 7, 9, 13];
        const spikeCountByLevel = [4, 4, 4, 4, 7];
        
        const damagePerSpike = spikeDamageByLevel[spellLevel - 1] || 4;
        const spikeCount = spikeCountByLevel[spellLevel - 1] || 4;
        
        return damagePerSpike * spikeCount;
    }
    
    // Защитные заклинания не наносят урон
    const nonDamageSpells = ['wind_wall', 'earth_wall', 'bark_armor', 'leaf_canopy', 'stone_grotto', 'meteorokinesis', 'plague', 'ent', 'call_wolf'];
    if (nonDamageSpells.includes(spellId)) {
        return 0;
    }
    
    // Стандартная формула урона
    const baseDamage = window.SPELL_BASE_DAMAGE?.[spellId] || 10;
    const levelBonus = Math.floor(baseDamage * 0.1 * (spellLevel - 1));
    
    return baseDamage + levelBonus;
}

// Расчет урона гибридного заклинания
function getHybridSpellDamage(spellId, spellLevel = 1) {
    const baseDamage = 20;
    const levelBonus = Math.floor(baseDamage * 0.15 * (spellLevel - 1));
    return baseDamage + levelBonus;
}

// Получить школу заклинания
function getSpellSchoolFromId(spellId) {
    if (!window.SPELL_TIERS) return null;
    
    for (const [school, spells] of Object.entries(window.SPELL_TIERS)) {
        if (spells.includes(spellId)) {
            return school;
        }
    }
    return null;
}

// Проверить совместимость мага с заклинанием
function canWizardCastSpell(wizard, spellId) {
    const spellSchool = getSpellSchoolFromId(spellId);
    if (!spellSchool) return false;
    
    // Проверяем, изучено ли заклинание
    const userSpells = window.userData?.spells;
    if (!userSpells || !userSpells[spellSchool] || !userSpells[spellSchool][spellId]) {
        return false;
    }
    
    return userSpells[spellSchool][spellId].level > 0;
}

// Найти заклинание в данных пользователя
function findSpellInUserData(spellId, userSpells) {
    if (!userSpells || typeof userSpells !== 'object') {
        return null;
    }
    
    // Сначала проверяем все стандартные школы
    if (window.SPELL_TIERS) {
        for (const faction of Object.keys(window.SPELL_TIERS)) {
            if (userSpells[faction]?.[spellId]) {
                return userSpells[faction][spellId];
            }
        }
    }
    
    // Затем проверяем гибридные заклинания
    if (userSpells.hybrid?.[spellId]) {
        return userSpells.hybrid[spellId];
    }
    
    return null;
}

// ============ ФУНКЦИИ ВАЛИДАЦИИ И СТАТИСТИКИ ============

// Валидация структуры заклинаний
function validateSpellTiers() {
    const errors = [];
    
    if (!window.SPELL_TIERS || !window.SPELL_NAMES || !window.SPELL_BASE_DAMAGE) {
        console.error('❌ Не загружены основные данные заклинаний');
        return false;
    }
    
    // Проверяем каждую школу
    for (const [faction, spells] of Object.entries(window.SPELL_TIERS)) {
        if (spells.length !== 5) {
            errors.push(`Школа ${faction} имеет ${spells.length} заклинаний вместо 5`);
        }
        
        spells.forEach((spellId, index) => {
            if (!window.SPELL_NAMES[spellId]) {
                errors.push(`Заклинание ${spellId} (${faction}) не имеет названия`);
            }
            if (window.SPELL_BASE_DAMAGE[spellId] === undefined) {
                errors.push(`Заклинание ${spellId} (${faction}) не имеет базового урона`);
            }
        });
    }
    
    if (errors.length > 0) {
        console.error('❌ Ошибки в структуре заклинаний:', errors);
        return false;
    }
    
    console.log('✅ Структура всех 6 школ заклинаний валидна');
    return true;
}

// Получить статистику изученных заклинаний
function getWizardSpellStats(wizard) {
    if (!window.userData?.spells || !window.SPELL_TIERS) return null;
    
    const stats = {
        total: 0,
        bySchool: {},
        byTier: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    // Подсчитываем изученные заклинания по школам
    for (const [school, spells] of Object.entries(window.SPELL_TIERS)) {
        stats.bySchool[school] = 0;
        
        if (window.userData.spells[school]) {
            for (const [spellId, spellData] of Object.entries(window.userData.spells[school])) {
                if (spellData.level > 0) {
                    stats.total++;
                    stats.bySchool[school]++;
                    const tier = getSpellTierById(school, spellId);
                    stats.byTier[tier]++;
                }
            }
        }
    }
    
    return stats;
}


// ============ ГЛОБАЛЬНЫЙ ЭКСПОРТ ============
const spellFunctions = {
    // Основные функции
    getSpellNameById,
    getFactionName,
    getFactionEmoji,
    getFactionColor,
    getSpellTierById,
    getSpellDamage,
    getHybridSpellDamage,
    findSpellInUserData,
    
    // Функции типов
    getSpellType,
    isAOESpell,
    isSingleTargetSpell,
    isBuffSpell,
    isSummonSpell,
    
    // Функции школ
    getSpellSchoolFromId,
    canWizardCastSpell,
    getWizardSpellStats,
    validateSpellTiers,
};

// Экспортируем в window для обратной совместимости
Object.assign(window, spellFunctions);

// Инициализация с задержкой для загрузки данных
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('📊 Загружено функций заклинаний:', Object.keys(spellFunctions).length);
    }, 2000);
});

console.log(`🎯 Экспортировано функций заклинаний: ${Object.keys(spellFunctions).length}`);