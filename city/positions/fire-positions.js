// config/city-positions/fire-positions.js - Кликабельные зоны для города Огня
console.log('🔥 Загружена конфигурация позиций для города Огня');

// Инициализация глобального объекта если его нет
window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Конфигурация кликабельных зон для фракции Огня
window.CITY_POSITIONS.fire = {
    // Арканская лаборатория
    arcane_lab: {
        buildingId: 'arcane_lab',
        points: [
            {x: 281, y: 340},
            {x: 370, y: 321},
            {x: 310, y: 253},
            {x: 238, y: 262}
        ]
    },
    
    // Башня благословений
    blessing_tower: {
        buildingId: 'blessing_tower',
        points: [
            {x: 524, y: 327},
            {x: 617, y: 184},
            {x: 742, y: 174},
            {x: 735, y: 428}
        ]
    },
    
    // Кузница
    forge: {
        buildingId: 'forge',
        points: [
            {x: 160, y: 243},
            {x: 231, y: 243},
            {x: 221, y: 161},
            {x: 152, y: 166}
        ]
    },
    
    // Библиотека
    library: {
        buildingId: 'library',
        points: [
            {x: 8, y: 411},
            {x: 284, y: 376},
            {x: 136, y: 241},
            {x: 33, y: 231}
        ]
    },
    
    // PvP Арена
    pvp_arena: {
        buildingId: 'pvp_arena',
        points: [
            {x: 437, y: 240},
            {x: 588, y: 229},
            {x: 582, y: 168},
            {x: 497, y: 147}
        ]
    },
    
    // Генератор времени
    time_generator: {
        buildingId: 'time_generator',
        points: [
            {x: 348, y: 445},
            {x: 538, y: 429},
            {x: 476, y: 310},
            {x: 411, y: 307}
        ]
    },
    
    // Башня магов
    wizard_tower: {
        buildingId: 'wizard_tower',
        points: [
            {x: 319, y: 231},
            {x: 425, y: 226},
            {x: 429, y: 98},
            {x: 324, y: 107}
        ]
    }
};

console.log('📍 Загружено зон:', Object.keys(window.CITY_POSITIONS.fire).length);