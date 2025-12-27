// config/spells/spell-tiers.js - Порядок заклинаний по школам и ступеням

// Порядок заклинаний по школам (tier 1-5)
const SPELL_TIERS = {
    "fire": [
        "spark",         // Tier 1
        "firebolt",      // Tier 2
        "fire_wall",     // Tier 3
        "fireball",      // Tier 4
        "fire_tsunami"   // Tier 5
    ],
    
    "water": [
        "icicle",        // Tier 1
        "frost_arrow",   // Tier 2
        "ice_rain",      // Tier 3
        "blizzard",      // Tier 4
        "absolute_zero"  // Tier 5
    ],
    
    "wind": [
        "gust",            // Tier 1
        "wind_blade",      // Tier 2
        "wind_wall",       // Tier 3
        "storm_cloud",     // Tier 4
        "ball_lightning"   // Tier 5
    ],
    
    "earth": [
        "pebble",         // Tier 1
        "stone_spike",    // Tier 2
        "earth_wall",     // Tier 3
        "stone_grotto",   // Tier 4
        "meteor_shower"   // Tier 5
    ],
    
    "nature": [
        "call_wolf",      // Tier 1
        "bark_armor",     // Tier 2
        "leaf_canopy",    // Tier 3
        "ent",            // Tier 4
        "meteorokinesis"  // Tier 5
    ],
    
    "poison": [
        "poisoned_blade",  // Tier 1
        "poisoned_glade",  // Tier 2
        "foul_cloud",      // Tier 3
        "plague",          // Tier 4
        "epidemic"         // Tier 5
    ],

    "light": [
        "flash",           // Tier 1 - Вспышка
        "light_beam",      // Tier 2 - Луч света
        "rainbow_shield",  // Tier 3 - Радужный щит
        "sun_radiance",    // Tier 4 - Сияние солнца
        "dawn"             // Tier 5 - Рассвет
    ],

    "dark": [
        "dark_clot",       // Tier 1 - Сгусток тьмы
        "weakness",        // Tier 2 - Слабость
        "miasma",          // Tier 3 - Миазма
        "shadow_realm",    // Tier 4 - Мир теней
        "fading"           // Tier 5 - Угасание
    ]
};

// Вспомогательные функции для работы со структурой
function getSpellTier(spellId) {
    for (const [school, spells] of Object.entries(SPELL_TIERS)) {
        const index = spells.indexOf(spellId);
        if (index !== -1) {
            return index + 1; // Tier от 1 до 5
        }
    }
    return null;
}

function getSpellSchool(spellId) {
    for (const [school, spells] of Object.entries(SPELL_TIERS)) {
        if (spells.includes(spellId)) {
            return school;
        }
    }
    return null;
}

function getSpellByTier(school, tier) {
    if (!SPELL_TIERS[school] || tier < 1 || tier > 5) {
        return null;
    }
    return SPELL_TIERS[school][tier - 1];
}

// Экспорт в window для обратной совместимости
if (typeof window !== 'undefined') {
    window.SPELL_TIERS = SPELL_TIERS;
}