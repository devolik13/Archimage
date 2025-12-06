// config/spells/spell-basic-data.js - Базовые данные заклинаний (названия, урон, типы)

// Названия заклинаний
const SPELL_NAMES = {
    // Огонь
    "spark": "Искра",
    "firebolt": "Огненная стрела",
    "fire_wall": "Огненная стена",
    "fireball": "Огненный шар",
    "fire_tsunami": "Огненное цунами",
    
    // Вода
    "icicle": "Ледышка",
    "frost_arrow": "Ледяная стрела",
    "ice_rain": "Ледяной дождь",
    "blizzard": "Снежная буря",
    "absolute_zero": "Абсолютный Ноль",
    
    // Ветер
    "gust": "Порыв",
    "wind_blade": "Ветрорез",
    "wind_wall": "Ветряная стена",
    "storm_cloud": "Грозовая туча",
    "ball_lightning": "Шаровая молния",
    
    // Земля
    "pebble": "Камешек",
    "stone_spike": "Каменный шип",
    "earth_wall": "Земляная стена",
    "stone_grotto": "Каменный грот",
    "meteor_shower": "Метеоритный дождь",
    
    // Природа
    "call_wolf": "Зов волка",
    "bark_armor": "Древесная кора",
    "leaf_canopy": "Покров листвы",
    "ent": "Энт",
    "meteorokinesis": "Метеокинез",
    
    // Яд
    "poisoned_blade": "Отравленный клинок",
    "poisoned_glade": "Ядовитая поляна",
    "foul_cloud": "Мерзкое облако",
    "plague": "Чума",
    "epidemic": "Эпидемия"
};

// Базовый урон заклинаний
const SPELL_BASE_DAMAGE = {
    // Tier 1 - базовый урон 10-15
    "spark": 12,
    "icicle": 10,
    "gust": 11,
    "pebble": 13,
    "call_wolf": 8,
    "poisoned_blade": 9,
    
    // Tier 2 - базовый урон 20-30
    "firebolt": 25,
    "frost_arrow": 22,
    "wind_blade": 24,
    "stone_spike": 28,
    "bark_armor": 0,  // защитное
    "poisoned_glade": 20,
    
    // Tier 3 - базовый урон 35-50
    "fire_wall": 40,
    "ice_rain": 38,
    "wind_wall": 0,   // защитное
    "earth_wall": 0,  // защитное
    "leaf_canopy": 0, // защитное
    "foul_cloud": 35,
    
    // Tier 4 - базовый урон 60-80
    "fireball": 75,
    "blizzard": 65,
    "storm_cloud": 70,
    "stone_grotto": 0,  // защитное
    "ent": 50,          // призыв
    "plague": 60,
    
    // Tier 5 - базовый урон 100-150
    "fire_tsunami": 120,
    "absolute_zero": 110,
    "ball_lightning": 115,
    "meteor_shower": 140,
    "meteorokinesis": 0,  // усиление
    "epidemic": 100
};

// Типы заклинаний
const SPELL_TYPE_CONFIG = {
    // Одиночная цель
    "spark": "single_target",
    "icicle": "single_target",
    "gust": "single_target",
    "pebble": "single_target",
    "poisoned_blade": "single_target",
    "frost_arrow": "single_target",
    
    // Множественные цели
    "firebolt": "multi_target",
    "wind_blade": "multi_target",
    "stone_spike": "multi_target",
    
    // АоЕ (по области)
    "fire_wall": "aoe",
    "ice_rain": "aoe",
    "poisoned_glade": "aoe",
    "foul_cloud": "aoe",
    "fireball": "aoe",
    "blizzard": "aoe",
    "storm_cloud": "aoe",
    "plague": "aoe",
    "fire_tsunami": "aoe",
    "absolute_zero": "aoe",
    "ball_lightning": "aoe",
    "meteor_shower": "aoe",
    "epidemic": "aoe",
    
    // Защитные/утилити
    "wind_wall": "utility",
    "earth_wall": "utility",
    "bark_armor": "buff",
    "leaf_canopy": "buff",
    "stone_grotto": "buff",
    "meteorokinesis": "buff",
    
    // Призыв
    "call_wolf": "summon",
    "ent": "summon"
};

// Вспомогательные функции для определения типа
function getSpellType(spellId) {
    return SPELL_TYPE_CONFIG[spellId] || "unknown";
}

function isAOESpell(spellId) {
    return SPELL_TYPE_CONFIG[spellId] === "aoe";
}

function isSingleTargetSpell(spellId) {
    return SPELL_TYPE_CONFIG[spellId] === "single_target";
}

function isBuffSpell(spellId) {
    return SPELL_TYPE_CONFIG[spellId] === "buff";
}

function isSummonSpell(spellId) {
    return SPELL_TYPE_CONFIG[spellId] === "summon";
}

// Экспорт в window для обратной совместимости
if (typeof window !== 'undefined') {
    window.SPELL_NAMES = SPELL_NAMES;
    window.SPELL_BASE_DAMAGE = SPELL_BASE_DAMAGE;
    window.SPELL_TYPE_CONFIG = SPELL_TYPE_CONFIG;
}