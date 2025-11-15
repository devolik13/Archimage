// config/city-positions/nature-positions.js
console.log('🌳 Загружена конфигурация позиций города Природы');

window.CITY_POSITIONS = window.CITY_POSITIONS || {};

// Координаты в пикселях для изображения 768x512
window.CITY_POSITIONS.nature = {
    forge: { // 1 - Кузница
        buildingId: 'forge',
        points: [
            {x: 1, y: 346},
            {x: 124, y: 346},
            {x: 124, y: 187},
            {x: 1, y: 187}
        ]
    },
    time_generator: { // 2 - Генератор времени  
        buildingId: 'time_generator',
        points: [
            {x: 177, y: 375},
            {x: 340, y: 375},
            {x: 340, y: 320},
            {x: 177, y: 320}
        ]
    },
    blessing_tower: { // 3 - Башня благословений
        buildingId: 'blessing_tower',
        points: [
            {x: 166, y: 272},
            {x: 265, y: 272},
            {x: 265, y: 70},
            {x: 166, y: 70}
        ]
    },
    arcane_lab: { // 4 - Арканская лаборатория
        buildingId: 'arcane_lab',
        points: [
            {x: 312, y: 176},
            {x: 376, y: 176},
            {x: 367, y: 74},
            {x: 324, y: 74}
        ]
    },
    wizard_tower: { // 5 - Башня магов
        buildingId: 'wizard_tower',
        points: [
            {x: 370, y: 284},
            {x: 480, y: 275},
            {x: 504, y: 71},
	    {x: 438, y: 65}
        ]
    },
    library: { // 6 - Библиотека
        buildingId: 'library',
        points: [
            {x: 486, y: 329},
            {x: 604, y: 329},
            {x: 574, y: 142},
            {x: 527, y: 139}
        ]
    },
    pvp_arena: { // 7 - Арена
        buildingId: 'pvp_arena',
        points: [
            {x: 647, y: 271},
            {x: 737, y: 263},
            {x: 739, y: 95},
            {x: 687, y: 94}
        ]
    }
};