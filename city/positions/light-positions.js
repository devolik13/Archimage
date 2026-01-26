// config/city-positions/light-positions.js - Кликабельные зоны для города Света
console.log('✨ Загружена конфигурация позиций для города Света');

// Инициализация глобального объекта если его нет
window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Конфигурация кликабельных зон для фракции Света
window.CITY_POSITIONS.light = {
    // Арканская лаборатория
    arcane_lab: {
        buildingId: 'arcane_lab',
        points: [
            {x: 155, y: 245},
            {x: 280, y: 245},
            {x: 280, y: 50},
            {x: 155, y: 50}
        ]
    },

    // Башня благословений
    blessing_tower: {
        buildingId: 'blessing_tower',
        points: [
            {x: 675, y: 280},
            {x: 755, y: 280},
            {x: 755, y: 70},
            {x: 675, y: 70}
        ]
    },

    // Гильдия
    guild: {
        buildingId: 'guild',
        points: [
            {x: 560, y: 220},
            {x: 670, y: 220},
            {x: 670, y: 30},
            {x: 560, y: 30}
        ]
    },

    // Библиотека
    library: {
        buildingId: 'library',
        points: [
            {x: 20, y: 335},
            {x: 150, y: 325},
            {x: 150, y: 50},
            {x: 20, y: 50}
        ]
    },

    // PvP Арена
    pvp_arena: {
        buildingId: 'pvp_arena',
        points: [
            {x: 425, y: 320},
            {x: 610, y: 320},
            {x: 590, y: 225},
            {x: 425, y: 225}
        ]
    },

    // Генератор времени
    time_generator: {
        buildingId: 'time_generator',
        points: [
            {x: 550, y: 450},
            {x: 680, y: 450},
            {x: 680, y: 320},
            {x: 550, y: 320}
        ]
    },

    // Башня магов
    wizard_tower: {
        buildingId: 'wizard_tower',
        points: [
            {x: 290, y: 290},
            {x: 380, y: 290},
            {x: 380, y: 70},
            {x: 290, y: 70}
        ]
    }
};

console.log('📍 Загружено зон:', Object.keys(window.CITY_POSITIONS.light).length);
