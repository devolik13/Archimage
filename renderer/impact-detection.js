// battle/utils/impact-detection.js - Определение точки столкновения снарядов

/**
 * Создаёт взрывы 3×3 вокруг точки столкновения (только на вражеской территории)
 * 
 * @param {number} impactCol - Колонка точки столкновения
 * @param {number} impactRow - Ряд точки столкновения
 * @param {string} casterType - 'player' или 'enemy'
 * @param {Function} explosionCallback - Функция создания взрыва (col, row)
 */
function createExplosionsAround(impactCol, impactRow, casterType, explosionCallback) {
    if (!explosionCallback || typeof explosionCallback !== 'function') {
        console.warn('⚠️ createExplosionsAround: explosionCallback не определён');
        return;
    }
    
    // Определяем вражескую территорию
    const enemyTerritory = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
    
    console.log(`💥 Создание взрывов 3×3 вокруг [${impactCol}, ${impactRow}]`);
    console.log(`   Территория врага: колонки ${enemyTerritory.join(', ')}`);
    
    const explosions = [];
    
    // Перебираем все клетки 3×3
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            const explosionCol = impactCol + colOffset;
            const explosionRow = (impactRow + rowOffset + 5) % 5; // Циклический перенос
            
            // Проверяем границы территории
            if (enemyTerritory.includes(explosionCol)) {
                explosions.push({ col: explosionCol, row: explosionRow });
            } else {
                console.log(`   ✗ Взрыв [${explosionCol}, ${explosionRow}] за границей территории - пропуск`);
            }
        }
    }
    
    console.log(`   ✓ Всего взрывов: ${explosions.length}`);
    
    // Создаём взрывы с задержкой
    explosions.forEach((pos, index) => {
        setTimeout(() => {
            console.log(`   💥 Взрыв [${pos.col}, ${pos.row}]`);
            explosionCallback(pos.col, pos.row);
        }, index * 50); // Каждый взрыв с задержкой 50мс
    });
}

// Экспорт
window.createExplosionsAround = createExplosionsAround;

console.log('🎯 Система определения точки столкновения готова');