// config/city-positions/earth-positions.js
console.log('⛰️ Загружена конфигурация позиций города Земли');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.earth = {
    guild: { // Гильдия
        buildingId: 'guild',
        points: [
            {x: 27, y: 506},
            {x: 256, y: 506},
            {x: 256, y: 400},
            {x: 27, y: 400}
        ]
    },
    time_generator: { // Генератор времени
        buildingId: 'time_generator',
        points: [
            {x: 382, y: 500},
            {x: 660, y: 500},
            {x: 660, y: 370},
            {x: 382, y: 370}
        ]
    },
    blessing_tower: { // Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 640, y: 400},
            {x: 760, y: 400},
            {x: 760, y: 50},
            {x: 640, y: 50}
        ]
    },
    wizard_tower: { // Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 10, y: 350},
            {x: 180, y: 350},
            {x: 100, y: 30},
            {x: 10, y: 100}
        ]
    },
    arcane_lab: { // Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 500, y: 270},
            {x: 650, y: 270},
            {x: 650, y: 60},
            {x: 500, y: 60}
        ]
    },
    pvp_arena: { // PvP Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 180, y: 315},
            {x: 350, y: 315},
            {x: 300, y: 150},
            {x: 170, y: 150}
        ]
    },
    library: { // Библиотека
        buildingId: 'library',
        points: [
            {x: 318, y: 280},
            {x: 415, y: 280},
            {x: 415, y: 10},
            {x: 318, y: 10}
        ]
    }
};

