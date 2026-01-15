// battle/renderer/animations/light/blinded-effect.js

(function() {
    // Хранилище активных эффектов ослепления
    const activeBlindedEffects = new Map();

    function showBlindedEffect(wizard, position, casterType) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эффект ослепления');
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) return;

        // Определяем позицию мага
        const wizardCol = casterType === 'player' ? 5 : 0;
        const wizardCell = gridCells[wizardCol]?.[position];

        if (!wizardCell) return;

        const wizardSprite = window.wizardSprites?.[`${wizardCol}_${position}`];
        const centerX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
        const centerY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);

        const effectKey = `${casterType}_${position}`;

        // Удаляем старый эффект если есть
        if (activeBlindedEffects.has(effectKey)) {
            removeBlindedEffect(effectKey);
        }

        // Контейнер для солнца
        const sunContainer = new PIXI.Container();

        // Позиция над головой мага
        const offsetX = 0;
        const offsetY = -45;

        sunContainer.x = centerX + offsetX;
        sunContainer.y = centerY + offsetY;

        // Создаем солнце
        const sun = new PIXI.Graphics();

        // Рисуем солнце с лучами
        const drawSun = (scale, glowIntensity) => {
            sun.clear();

            // Внешнее свечение
            sun.beginFill(0xffff00, 0.2 * glowIntensity);
            sun.drawCircle(0, 0, 18 * scale);
            sun.endFill();

            // Средний круг (оранжевый)
            sun.beginFill(0xffa500, 0.6);
            sun.drawCircle(0, 0, 12 * scale);
            sun.endFill();

            // Центральный круг (желтый)
            sun.beginFill(0xffff00, 0.9);
            sun.drawCircle(0, 0, 8 * scale);
            sun.endFill();

            // Лучи солнца
            const rayCount = 8;
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2;
                const innerRadius = 10 * scale;
                const outerRadius = 20 * scale;
                const rayWidth = 3 * scale;

                sun.beginFill(0xffff00, 0.8);

                // Треугольный луч
                const x1 = Math.cos(angle - 0.15) * innerRadius;
                const y1 = Math.sin(angle - 0.15) * innerRadius;
                const x2 = Math.cos(angle + 0.15) * innerRadius;
                const y2 = Math.sin(angle + 0.15) * innerRadius;
                const x3 = Math.cos(angle) * outerRadius;
                const y3 = Math.sin(angle) * outerRadius;

                sun.moveTo(x1, y1);
                sun.lineTo(x3, y3);
                sun.lineTo(x2, y2);
                sun.lineTo(x1, y1);

                sun.endFill();
            }
        };

        drawSun(1, 1);
        sunContainer.addChild(sun);

        effectsContainer.addChild(sunContainer);

        // Анимация пульсации и вращения лучей
        let animationId = null;
        const animateSun = () => {
            if (!window.pixiAnimUtils.isValid(sunContainer)) return;

            const time = Date.now() * 0.001;

            // Пульсация масштаба
            const scale = 1 + Math.sin(time * 3) * 0.15;

            // Интенсивность свечения
            const glowIntensity = 0.8 + Math.sin(time * 4) * 0.2;

            // Перерисовываем солнце
            drawSun(scale, glowIntensity);

            // Медленное вращение
            sun.rotation = time * 0.5;

            // Мерцание прозрачности
            sunContainer.alpha = 0.8 + Math.sin(time * 5) * 0.2;

            animationId = requestAnimationFrame(animateSun);
        };
        animateSun();

        // Сохраняем эффект
        activeBlindedEffects.set(effectKey, {
            container: sunContainer,
            sun: sun,
            animationId: animationId,
            wizard: wizard
        });

        console.log(`☀️ Эффект ослепления показан для ${effectKey}`);
    }

    function removeBlindedEffect(key) {
        const effect = activeBlindedEffects.get(key);
        if (!effect) return;

        const { container, animationId } = effect;

        // Останавливаем анимацию
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) {
                activeBlindedEffects.delete(key);
                return;
            }

            container.alpha -= 0.08;
            container.scale.set(container.scale.x * 0.95);

            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeBlindedEffects.delete(key);
                console.log(`☀️ Эффект ослепления удален для ${key}`);
            }
        };
        fadeOut();
    }

    function clearAllBlindedEffects() {
        activeBlindedEffects.forEach((effect, key) => {
            if (effect.animationId) {
                cancelAnimationFrame(effect.animationId);
            }
            removeBlindedEffect(key);
        });
        activeBlindedEffects.clear();
    }

    // Проверка и обновление эффектов по состоянию магов
    function updateBlindedEffects(wizards, casterType) {
        if (!wizards) return;

        wizards.forEach((wizard, position) => {
            if (!wizard || wizard.isDead) return;

            const effectKey = `${casterType}_${position}`;
            const hasEffect = activeBlindedEffects.has(effectKey);
            const isBlinded = wizard.effects?.blinded;

            if (isBlinded && !hasEffect) {
                // Нужно показать эффект
                showBlindedEffect(wizard, position, casterType);
            } else if (!isBlinded && hasEffect) {
                // Нужно убрать эффект
                removeBlindedEffect(effectKey);
            }
        });
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.blinded = {
        show: showBlindedEffect,
        remove: removeBlindedEffect,
        clearAll: clearAllBlindedEffects,
        update: updateBlindedEffects
    };

    console.log('☀️ Эффект ослепления зарегистрирован');
})();
