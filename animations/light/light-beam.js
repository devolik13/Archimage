// animations/light/light-beam.js - Анимация заклинания "Луч света"
// Луч соединяет кастера с целью, толщина растёт с разогревом

(function() {
    const ANIMATION_ID = 'light_beam';

    // Базовые параметры луча
    const BASE_THICKNESS = 4;      // Начальная толщина
    const MAX_THICKNESS = 12;      // Максимальная толщина
    const GLOW_MULTIPLIER = 2.5;   // Множитель свечения
    const BEAM_COLOR = 0xFFD700;   // Золотой цвет
    const GLOW_COLOR = 0xFFFFAA;   // Светло-жёлтый

    function play(params) {
        const {
            casterCol,
            casterRow,
            targetCol,
            targetRow,
            warmupLevel = 1,   // Уровень разогрева (1 = старт, растёт каждый ход)
            isSecondBeam = false, // Дополнительный луч (для другого оттенка?)
            onHit,
            onComplete
        } = params;

        console.log(`✨ Light Beam animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}], warmup: ${warmupLevel}`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        // Получаем позиции спрайтов
        const startSprite = window.wizardSprites?.[`${casterCol}_${casterRow}`];

        // Для цели можем использовать разные источники координат
        let endX, endY;
        const endSprite = window.wizardSprites?.[`${targetCol}_${targetRow}`];

        if (endSprite) {
            endX = endSprite.x;
            endY = endSprite.y;
        } else {
            // Fallback - вычисляем по сетке
            const gridInfo = window.pixiCore?.getGridInfo?.();
            if (gridInfo) {
                endX = gridInfo.startX + targetCol * gridInfo.cellWidth + gridInfo.cellWidth / 2;
                endY = gridInfo.startY + targetRow * gridInfo.cellHeight + gridInfo.cellHeight / 2;
            }
        }

        if (!startSprite || endX === undefined) {
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startX = startSprite.x;
        const startY = startSprite.y;

        // Вычисляем угол и расстояние
        const angle = Math.atan2(endY - startY, endX - startX);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Толщина зависит от разогрева (плавно растёт)
        const warmupFactor = Math.min(warmupLevel / 10, 1); // Максимум на 10 ходах
        const thickness = BASE_THICKNESS + (MAX_THICKNESS - BASE_THICKNESS) * warmupFactor;
        const glowThickness = thickness * GLOW_MULTIPLIER;

        // Цвет может немного меняться с разогревом (к белому)
        const beamColor = lerpColor(BEAM_COLOR, 0xFFFFFF, warmupFactor * 0.3);

        // Создаём контейнер луча
        const beamContainer = new PIXI.Container();
        beamContainer.x = startX;
        beamContainer.y = startY;
        beamContainer.rotation = angle;
        container.addChild(beamContainer);

        // Внешнее свечение
        const outerGlow = new PIXI.Graphics();
        beamContainer.addChild(outerGlow);

        // Основной луч
        const beam = new PIXI.Graphics();
        beamContainer.addChild(beam);

        // Яркое ядро
        const core = new PIXI.Graphics();
        beamContainer.addChild(core);

        // Анимация расширения луча
        const extendDuration = 200; // Время выстрела
        const holdDuration = 100;   // Время удержания
        const fadeDuration = 150;   // Время затухания
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;

            // Фаза 1: Расширение луча
            if (elapsed < extendDuration) {
                const progress = elapsed / extendDuration;
                const easeProgress = easeOutQuad(progress);
                const currentLength = distance * easeProgress;

                drawBeam(currentLength, thickness, glowThickness, beamColor, 1.0);
                requestAnimationFrame(animate);
            }
            // Фаза 2: Удержание + пульсация
            else if (elapsed < extendDuration + holdDuration) {
                const pulsePhase = (elapsed - extendDuration) / holdDuration;
                const pulse = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.1;

                drawBeam(distance, thickness * pulse, glowThickness * pulse, beamColor, 1.0);

                // Вызываем onHit в середине удержания
                if (elapsed >= extendDuration + holdDuration / 2 && !beamContainer._hitCalled) {
                    beamContainer._hitCalled = true;
                    if (onHit) onHit();
                }

                requestAnimationFrame(animate);
            }
            // Фаза 3: Затухание
            else if (elapsed < extendDuration + holdDuration + fadeDuration) {
                const fadeProgress = (elapsed - extendDuration - holdDuration) / fadeDuration;
                const alpha = 1 - easeOutQuad(fadeProgress);

                drawBeam(distance, thickness, glowThickness, beamColor, alpha);
                requestAnimationFrame(animate);
            }
            // Завершение
            else {
                container.removeChild(beamContainer);
                beamContainer.destroy({ children: true });
                if (onComplete) onComplete();
            }
        }

        function drawBeam(length, thick, glowThick, color, alpha) {
            // Внешнее свечение
            outerGlow.clear();
            outerGlow.lineStyle(glowThick, GLOW_COLOR, 0.2 * alpha);
            outerGlow.moveTo(0, 0);
            outerGlow.lineTo(length, 0);

            // Основной луч
            beam.clear();
            beam.lineStyle(thick, color, 0.8 * alpha);
            beam.moveTo(0, 0);
            beam.lineTo(length, 0);

            // Яркое ядро (тонкая белая линия по центру)
            core.clear();
            core.lineStyle(thick * 0.3, 0xFFFFFF, 0.9 * alpha);
            core.moveTo(0, 0);
            core.lineTo(length, 0);
        }

        animate();
    }

    // Интерполяция цвета
    function lerpColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }

    // Easing функция
    function easeOutQuad(t) {
        return t * (2 - t);
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`✨ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
