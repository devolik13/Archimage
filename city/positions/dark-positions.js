// config/city-positions/dark-positions.js - Кликабельные зоны для города Тьмы
console.log('🌑 Загружена конфигурация позиций для города Тьмы');

// Инициализация глобального объекта если его нет
window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Конфигурация кликабельных зон для фракции Тьмы
window.CITY_POSITIONS.dark = {
    // Генератор времени
    time_generator: {
        buildingId: 'time_generator',
        points: [
            {x: 513, y: 316},
            {x: 505, y: 444},
            {x: 670, y: 444},
            {x: 670, y: 322}
        ]
    },

    // Библиотека
    library: {
        buildingId: 'library',
        points: [
            {x: 110, y: 30},
            {x: 110, y: 400},
            {x: 210, y: 400},
            {x: 210, y: 30}
        ]
    },

    // Башня благословений
    blessing_tower: {
        buildingId: 'blessing_tower',
        points: [
            {x: 224, y: 353},
            {x: 352, y: 357},
            {x: 352, y: 30},
            {x: 224, y: 30}
        ]
    },

    // Башня магов
    wizard_tower: {
        buildingId: 'wizard_tower',
        points: [
            {x: 626, y: 313},
            {x: 760, y: 313},
            {x: 760, y: 30},
            {x: 626, y: 30}
        ]
    },

    // Гильдия
    guild: {
        buildingId: 'guild',
        points: [
            {x: 381, y: 313},
            {x: 510, y: 313},
            {x: 510, y: 30},
            {x: 381, y: 30}
        ]
    },

    // Арканская лаборатория
    arcane_lab: {
        buildingId: 'arcane_lab',
        points: [
            {x: 555, y: 270},
            {x: 640, y: 270},
            {x: 640, y: 30},
            {x: 555, y: 30}
        ]
    },

    // PvP Арена
    pvp_arena: {
        buildingId: 'pvp_arena',
        points: [
            {x: 7, y: 250},
            {x: 100, y: 250},
            {x: 100, y: 30},
            {x: 7, y: 30}
        ]
    }
};

console.log('📍 Загружено зон:', Object.keys(window.CITY_POSITIONS.dark).length);
