// config/city-positions/wind-positions.js
console.log('💨 Загружена конфигурация позиций города Воздуха');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.wind = {
    library: { // Библиотека
        buildingId: 'library',
        points: [
            {x: 105, y: 320},
            {x: 230, y: 320},
            {x: 155, y: 30},
            {x: 105, y: 30}
        ]
    },
    time_generator: { // Генератор времени
        buildingId: 'time_generator',
        points: [
            {x: 360, y: 500},
            {x: 610, y: 500},
            {x: 610, y: 360},
            {x: 360, y: 360}
        ]
    },
    guild: { // Гильдия
        buildingId: 'guild',
        points: [
            {x: 250, y: 360},
            {x: 350, y: 360},
            {x: 360, y: 150},
            {x: 250, y: 150}
        ]
    },
    arcane_lab: { // Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 340, y: 240},
            {x: 515, y: 240},
            {x: 515, y: 70},
            {x: 340, y: 70}
        ]
    },
    pvp_arena: { // PvP Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 15, y: 440},
            {x: 140, y: 440},
            {x: 140, y: 200},
            {x: 15, y: 200}
        ]
    },
    wizard_tower: { // Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 500, y: 300},
            {x: 650, y: 300},
            {x: 650, y: 70},
            {x: 500, y: 70}
        ]
    },
    blessing_tower: { // Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 650, y: 400},
            {x: 750, y: 400},
            {x: 750, y: 170},
            {x: 650, y: 170}
        ]
    }
};

