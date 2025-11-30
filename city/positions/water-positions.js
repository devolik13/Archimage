// config/city-positions/water-positions.js
console.log('💧 Загружена конфигурация позиций города Воды');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.water = {
    time_generator: { // Генератор времени
        buildingId: 'time_generator',
        points: [
            {x: 485, y: 400},
            {x: 750, y: 400},
            {x: 750, y: 280},
            {x: 485, y: 280}
        ]
    },
    arcane_lab: { // Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 520, y: 260},
            {x: 630, y: 260},
            {x: 630, y: 70},
            {x: 520, y: 70}
        ]
    },
    blessing_tower: { // Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 640, y: 230},
            {x: 750, y: 230},
            {x: 750, y: 70},
            {x: 640, y: 70}
        ]
    },
    guild: { // Гильдия
        buildingId: 'guild',
        points: [
            {x: 415, y: 240},
            {x: 520, y: 240},
            {x: 550, y: 70},
            {x: 415, y: 70}
        ]
    },
    library: { // Библиотека
        buildingId: 'library',
        points: [
            {x: 15, y: 280},
            {x: 150, y: 280},
            {x: 150, y: 70},
            {x: 15, y: 70}
        ]
    },
    wizard_tower: { // Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 280, y: 260},
            {x: 400, y: 260},
            {x: 400, y: 70},
            {x: 280, y: 70}
        ]
    },
    pvp_arena: { // PvP Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 80, y: 400},
            {x: 390, y: 400},
            {x: 275, y: 240},
            {x: 200, y: 240}
        ]
    }
};

console.log('💧 Город Воды: загружено зданий -', Object.keys(window.CITY_POSITIONS.water).length);