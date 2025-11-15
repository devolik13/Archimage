// config/spells/school-config.js - Конфигурация школ магии
console.log('✅ config/spells/school-config.js загружен');

const SCHOOL_CONFIG = {
    "fire": {
        id: "fire",
        name: "Огонь",
        emoji: "🔥",
        color: "#ff6b6b",
        description: "Школа разрушительной магии огня. Специализируется на прямом уроне и поджогах.",
        strengths: ["Высокий урон", "Эффекты горения"],
        weaknesses: ["Уязвима к воде"],
        battlefieldColor: "rgba(255, 107, 107, 0.2)"
    },
    
    "water": {
        id: "water",
        name: "Вода",
        emoji: "💧",
        color: "#4d96ff",
        description: "Школа магии воды и льда. Замедляет и замораживает врагов.",
        strengths: ["Контроль", "Заморозка"],
        weaknesses: ["Низкий урон"],
        battlefieldColor: "rgba(77, 150, 255, 0.2)"
    },
    
    "wind": {
        id: "wind",
        name: "Ветер",
        emoji: "🌪️",
        color: "#95ffc4",
        description: "Школа магии воздуха и молний. Быстрые атаки и оглушение.",
        strengths: ["Скорость", "Оглушение"],
        weaknesses: ["Средний урон"],
        battlefieldColor: "rgba(149, 255, 196, 0.2)"
    },
    
    "earth": {
        id: "earth",
        name: "Земля",
        emoji: "🪨",
        color: "#8b7355",
        description: "Школа магии земли. Защита и мощные АоЕ атаки.",
        strengths: ["Защита", "Площадной урон"],
        weaknesses: ["Медленное применение"],
        battlefieldColor: "rgba(139, 115, 85, 0.2)"
    },
    
    "nature": {
        id: "nature",
        name: "Природа",
        emoji: "🌿",
        color: "#4ade80",
        description: "Школа природной магии. Призыв существ и усиление союзников.",
        strengths: ["Призыв", "Поддержка"],
        weaknesses: ["Зависит от существ"],
        battlefieldColor: "rgba(74, 222, 128, 0.2)"
    },
    
    "poison": {
        id: "poison",
        name: "Яд",
        emoji: "☠️",
        color: "#84cc16",
        description: "Школа ядовитой магии. Урон по времени и ослабление врагов.",
        strengths: ["DoT эффекты", "Дебаффы"],
        weaknesses: ["Медленный урон"],
        battlefieldColor: "rgba(132, 204, 22, 0.2)"
    },
    
    "hybrid": {
        id: "hybrid",
        name: "Гибрид",
        emoji: "🔮",
        color: "#9333ea",
        description: "Комбинация разных школ магии. Уникальные эффекты.",
        strengths: ["Универсальность", "Уникальные эффекты"],
        weaknesses: ["Сложность изучения"],
        battlefieldColor: "rgba(147, 51, 234, 0.2)"
    }
};

// Вспомогательные функции
function getSchoolName(schoolId) {
    return SCHOOL_CONFIG[schoolId]?.name || schoolId;
}

function getSchoolEmoji(schoolId) {
    return SCHOOL_CONFIG[schoolId]?.emoji || "❓";
}

function getSchoolColor(schoolId) {
    return SCHOOL_CONFIG[schoolId]?.color || "#808080";
}

// Экспорт в window для обратной совместимости
if (typeof window !== 'undefined') {
    window.SCHOOL_CONFIG = SCHOOL_CONFIG;
    window.FACTION_NAMES = {};
    window.FACTION_EMOJIS = {};
    window.FACTION_COLORS = {};
    
    // Для обратной совместимости со старым кодом
    Object.keys(SCHOOL_CONFIG).forEach(key => {
        window.FACTION_NAMES[key] = SCHOOL_CONFIG[key].name;
        window.FACTION_EMOJIS[key] = SCHOOL_CONFIG[key].emoji;
        window.FACTION_COLORS[key] = SCHOOL_CONFIG[key].color;
    });
}

// Функция определения школы заклинания
function getSpellSchoolFallback(spellId) {
    if (!spellId) return null;
    
    // Маппинг заклинаний по школам (на основе структуры проекта)
    const spellSchools = {
        // Огонь
        'spark': 'fire',
        'firebolt': 'fire',
        'fireball': 'fire',
        'fire_wall': 'fire',
        'fire_tsunami': 'fire',
        
        // Вода  
        'icicle': 'water',
        'frost_arrow': 'water',
        'ice_rain': 'water',
        'blizzard': 'water',
        'absolute_zero': 'water',
        
        // Ветер
        'gust': 'wind',
        'wind_blade': 'wind',
        'wind_wall': 'wind',
        'storm_cloud': 'wind',
        'chain_lightning': 'wind',
        
        // Земля
        'pebble': 'earth',
        'stone_spike': 'earth',
        'earth_wall': 'earth',
        'stone_grotto': 'earth',
        'meteor_shower': 'earth',
        
        // Природа
        'call_wolf': 'nature',
        'bark_armor': 'nature',
        'leaf_canopy': 'nature',
        'ent': 'nature',
        'meteorokinesis': 'nature',
        
        // Яд
        'poisoned_blade': 'poison',
        'poisoned_glade': 'poison',
        'foul_cloud': 'poison',
        'plague': 'poison',
        'epidemic': 'poison'
    };
    
    return spellSchools[spellId] || null;
}

// Экспорт
window.getSpellSchoolFallback = getSpellSchoolFallback;