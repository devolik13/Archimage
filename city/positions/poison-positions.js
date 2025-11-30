// config/city-positions/poison-positions.js
console.log('☠️ Загружена конфигурация позиций города Яда');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.poison = {
    arcane_lab: { // Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 353, y: 253},
            {x: 480, y: 259},
            {x: 450, y: 109},
            {x: 393, y: 103}
        ]
    },
    blessing_tower: { // Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 14, y: 260},
            {x: 97, y: 259},
            {x: 75, y: 112},
            {x: 26, y: 109}
        ]
    },
    guild: { // Гильдия
        buildingId: 'guild',
        points: [
            {x: 206, y: 210},
            {x: 331, y: 212},
            {x: 329, y: 138},
            {x: 206, y: 108}
        ]
    },
    library: { // Библиотека
        buildingId: 'library',
        points: [
            {x: 514, y: 263},
            {x: 622, y: 260},
            {x: 627, y: 72},
            {x: 544, y: 77}
        ]
    },
    pvp_arena: { // PvP Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 546, y: 401},
            {x: 681, y: 420},
            {x: 753, y: 115},
            {x: 678, y: 188}
        ]
    },
    time_generator: { // Генератор времени
        buildingId: 'time_generator',
        points: [
            {x: 286, y: 464},
            {x: 450, y: 464},
            {x: 431, y: 401},
            {x: 302, y: 407}
        ]
    },
    wizard_tower: { // Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 162, y: 392},
            {x: 233, y: 381},
            {x: 213, y: 250},
            {x: 114, y: 251}
        ]
    }
};

