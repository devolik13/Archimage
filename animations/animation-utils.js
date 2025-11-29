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

// Экспорт в глобальную область
window.pixiAnimUtils = {
    isValid: isPixiObjectValid,
    safeAnimate: safeAnimate,
    areAllValid: areAllValid
};

console.log('🔧 PIXI Animation Utils готовы к использованию');
console.log('💡 Используйте: window.pixiAnimUtils.isValid(sprite)');
