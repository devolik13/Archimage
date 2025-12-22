// battle/systems/single-target-visual-system.js - Система визуализации single-target заклинаний

// Счётчик активных снарядов (для ожидания их завершения)
if (typeof window.pendingProjectiles === 'undefined') {
    window.pendingProjectiles = 0;
}

// Функция ожидания пока все снаряды долетят
window.waitForProjectiles = function(timeout = 3000) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        function check() {
            if (window.pendingProjectiles <= 0) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                // Таймаут - сбрасываем счётчик и продолжаем
                console.warn(`⚠️ Таймаут ожидания снарядов (${window.pendingProjectiles} осталось)`);
                window.pendingProjectiles = 0;
                resolve();
            } else {
                requestAnimationFrame(check);
            }
        }

        check();
    });
};

/**
 * Универсальная система для single-target заклинаний
 * Визуализирует снаряды с учётом многослойной защиты
 * 
 * Алгоритм:
 * 1. Рассчитывает урон через multi-layer-protection
 * 2. Получает точку столкновения (impactCol, impactRow)
 * 3. Создаёт снаряд до точки столкновения
 * 4. Если преграда уничтожена - продолжает к следующему слою
 * 5. Если устояла - останавливается
 */

/**
 * Главная функция запуска single-target заклинания
 * 
 * @param {Object} params - Параметры заклинания
 * @param {Object} params.caster - Маг-кастер
 * @param {Object} params.target - Основная цель
 * @param {number} params.casterPosition - Позиция кастера (ряд 0-4)
 * @param {string} params.casterType - 'player' или 'enemy'
 * @param {string} params.spellId - ID заклинания (например 'spark')
 * @param {number} params.baseDamage - Базовый урон
 * @param {number} params.spellLevel - Уровень заклинания (1-5)
 * @param {Function} params.createProjectile - Функция создания визуального снаряда
 * @param {Function} params.onComplete - Callback после завершения (опционально)
 * @param {Function} params.applyEffects - Функция применения эффектов после урона (опционально)
 */
function castSingleTargetSpell(params) {
    const {
        caster,
        target,
        casterPosition,
        casterType,
        spellId,
        baseDamage,
        spellLevel,
        createProjectile,
        onComplete,
        applyEffects
    } = params;

    // Устанавливаем текущего кастера для отслеживания фракционных бонусов
    if (typeof window.setCurrentSpellCaster === 'function') {
        window.setCurrentSpellCaster(caster, casterType, casterPosition);
    }

    // Определяем колонки
    const casterCol = casterType === 'player' ? 5 : 0;
    
    // ШАГ 1: Рассчитываем урон через ВСЕ слои защиты
    // multi-layer-protection сама пройдёт все слои и вернёт точку остановки
    const damageResult = window.applyDamageWithMultiLayerProtection?.(
        caster,
        target,
        baseDamage,
        spellId,
        casterType
    );

    if (!damageResult) {
        return;
    }

    const { impactCol, impactRow, finalDamage } = damageResult;

    // ШАГ 2: Создаём ОДИН снаряд до точки столкновения
    if (typeof createProjectile === 'function') {
        // Увеличиваем счётчик активных снарядов
        window.pendingProjectiles++;

        createProjectile({
            fromCol: casterCol,
            fromRow: casterPosition,
            toCol: impactCol,
            toRow: impactRow,
            onHit: () => {
                // Уменьшаем счётчик - снаряд долетел
                window.pendingProjectiles--;

                // Логируем результат
                if (window.logProtectionResult) {
                    window.logProtectionResult(caster, target, damageResult, getSpellDisplayName(spellId, spellLevel));
                }

                // Применяем эффекты если нанесли урон магу
                if (applyEffects && finalDamage > 0) {
                    applyEffects(target.wizard, spellLevel, caster.faction);
                }

                // Завершение
                if (onComplete) {
                    onComplete(damageResult);
                }

                // Очищаем текущего кастера
                if (typeof window.clearCurrentSpellCaster === 'function') {
                    window.clearCurrentSpellCaster();
                }
            }
        });
    } else {

        // Fallback - сразу вызываем callbacks
        if (window.logProtectionResult) {
            window.logProtectionResult(caster, target, damageResult, getSpellDisplayName(spellId, spellLevel));
        }
        if (applyEffects && finalDamage > 0) {
            applyEffects(target.wizard, spellLevel, caster.faction);
        }
        if (onComplete) {
            onComplete(damageResult);
        }

        // Очищаем текущего кастера
        if (typeof window.clearCurrentSpellCaster === 'function') {
            window.clearCurrentSpellCaster();
        }
    }
}

/**
 * Получить отображаемое название заклинания
 */
function getSpellDisplayName(spellId, level) {
    const names = {
        'spark': 'Искра',
        'icicle': 'Ледышка',
        'pebble': 'Камешек',
        'gust': 'Порыв'
    };
    
    const name = names[spellId] || spellId;
    return `${name} ${level}ур`;
}

// Экспорт
window.castSingleTargetSpell = castSingleTargetSpell;