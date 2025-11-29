// animations/animation-utils.js - Утилиты для безопасных PIXI анимаций
console.log('✅ animation-utils.js загружен');

/**
 * Проверяет валидность PIXI объекта перед обращением к его свойствам
 * Предотвращает ошибки "can't access property X, this.transform is null"
 *
 * @param {PIXI.DisplayObject} obj - PIXI объект для проверки
 * @returns {boolean} - true если объект валиден и можно обращаться к его свойствам
 */
function isPixiObjectValid(obj) {
    return obj && !obj.destroyed && obj.transform;
}

/**
 * Безопасная обертка для requestAnimationFrame анимаций
 * Автоматически проверяет валидность объекта перед каждым кадром
 *
 * @param {PIXI.DisplayObject} obj - Анимируемый PIXI объект
 * @param {Function} animationFn - Функция анимации, получает callback для следующего кадра
 *
 * @example
 * safeAnimate(sprite, (next) => {
 *     sprite.x += 1;
 *     if (sprite.x < 100) next();
 * });
 */
function safeAnimate(obj, animationFn) {
    const animate = () => {
        if (!isPixiObjectValid(obj)) {
            console.log('🛑 Анимация прервана - объект уничтожен');
            return;
        }
        animationFn(animate);
    };
    animate();
}

/**
 * Проверяет массив объектов на валидность
 * Полезно для анимаций с несколькими спрайтами
 *
 * @param {Array<PIXI.DisplayObject>} objects - Массив PIXI объектов
 * @returns {boolean} - true если ВСЕ объекты валидны
 */
function areAllValid(objects) {
    if (!Array.isArray(objects)) return false;
    return objects.every(obj => isPixiObjectValid(obj));
}

/**
 * Получает центр и размеры ячейки с fallback значениями
 * Решает проблему когда cell.width/height = 0 (PIXI.Graphics getter override)
 *
 * @param {Object} cell - Объект ячейки из gridCells
 * @returns {Object} - { x, y, width, height, centerX, centerY, scale }
 */
function getCellInfo(cell) {
    if (!cell) return null;

    const scale = cell.cellScale || 0.8;
    const baseSize = 60; // Базовый размер клетки

    // Приоритет: cellWidth/cellHeight > width/height > вычисленное из scale
    const width = cell.cellWidth || cell.width || (scale * baseSize);
    const height = cell.cellHeight || cell.height || (scale * baseSize);

    return {
        x: cell.x,
        y: cell.y,
        width: width,
        height: height,
        centerX: cell.x + width / 2,
        centerY: cell.y + height / 2,
        scale: scale
    };
}

/**
 * Получает центр ячейки (сокращённая версия)
 * @param {Object} cell - Объект ячейки из gridCells
 * @returns {Object} - { x, y } центра ячейки
 */
function getCellCenter(cell) {
    const info = getCellInfo(cell);
    return info ? { x: info.centerX, y: info.centerY } : null;
}

// Экспорт в глобальную область
window.pixiAnimUtils = {
    isValid: isPixiObjectValid,
    safeAnimate: safeAnimate,
    areAllValid: areAllValid,
    getCellInfo: getCellInfo,
    getCellCenter: getCellCenter
};

console.log('🔧 PIXI Animation Utils готовы к использованию');
console.log('💡 Используйте: window.pixiAnimUtils.isValid(sprite)');
