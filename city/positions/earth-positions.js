// config/city-positions/earth-positions.js
console.log('⛰️ Загружена конфигурация позиций города Земли');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.earth = {
    time_generator: { // Генератор времени
        buildingId: 'time_generator',
        points: [
            {x: 203, y: 383},
            {x: 204, y: 450},
            {x: 580, y: 450},
            {x: 580, y: 383}
        ]
    },
    blessing_tower: { // Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 600, y: 406},
            {x: 750, y: 406},
            {x: 750, y: 70},
            {x: 600, y: 70}
        ]
    },
    wizard_tower: { // Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 142, y: 370},
            {x: 250, y: 370},
            {x: 250, y: 50},
            {x: 142, y: 50}
        ]
    },
    arcane_lab: { // Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 10, y: 420},
            {x: 110, y: 420},
            {x: 110, y: 110},
            {x: 10, y: 110}
        ]
    },
    pvp_arena: { // PvP Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 299, y: 363},
            {x: 400, y: 363},
            {x: 410, y: 160},
            {x: 299, y: 160}
        ]
    },
    library: { // Библиотека
        buildingId: 'library',
        points: [
            {x: 410, y: 370},
            {x: 500, y: 370},
            {x: 500, y: 100},
            {x: 410, y: 100}
        ]
    }
};
