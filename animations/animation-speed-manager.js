// animations/animation-speed-manager.js - Централизованное управление скоростью анимаций

/**
 * Получить коэффициент скорости анимаций на основе battleSpeed
 * @returns {number} - коэффициент (1.0 = нормальная, 2.5 = быстрая)
 */
function getAnimationSpeedMultiplier() {
    const battleSpeed = window.battleSpeed || 2000;

    // Нормальная скорость (2000ms) → коэффициент 1.0
    // Быстрая скорость (800ms) → коэффициент 2.5
    const multiplier = 2000 / battleSpeed;

    return multiplier;
}

/**
 * Рассчитать длительность анимации с учетом текущей скорости боя
 * @param {number} baseDuration - базовая длительность в миллисекундах
 * @returns {number} - скорректированная длительность
 */
function getScaledDuration(baseDuration) {
    // При быстрой симуляции (кнопка "симулировать до конца") возвращаем минимум
    if (window.fastSimulation) {
        return 10;
    }

    const multiplier = getAnimationSpeedMultiplier();
    return Math.max(10, Math.round(baseDuration / multiplier));
}

/**
 * Рассчитать скорость анимации спрайтов (animationSpeed для PIXI.AnimatedSprite)
 * @param {number} baseSpeed - базовая скорость (обычно 0.1 - 0.3)
 * @returns {number} - скорректированная скорость
 */
function getScaledAnimationSpeed(baseSpeed) {
    if (window.fastSimulation) {
        return baseSpeed * 5; // Очень быстрая анимация при симуляции
    }

    const multiplier = getAnimationSpeedMultiplier();
    return baseSpeed * multiplier;
}

// Экспорт функций
window.getAnimationSpeedMultiplier = getAnimationSpeedMultiplier;
window.getScaledDuration = getScaledDuration;
window.getScaledAnimationSpeed = getScaledAnimationSpeed;

console.log('✅ Animation Speed Manager загружен');
