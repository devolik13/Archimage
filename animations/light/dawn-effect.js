// animations/light/dawn-effect.js - Визуальный эффект баффа Рассвет

(function() {
    // Хранилище активных эффектов рассвета
    const activeDawnEffects = new Map();

    function showDawnEffect(wizard, position, casterType) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эффект рассвета');
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
        if (activeDawnEffects.has(effectKey)) {
            removeDawnEffect(effectKey);
        }

        // Контейнер для эффекта
        const dawnContainer = new PIXI.Container();
        dawnContainer.x = centerX;
        dawnContainer.y = centerY + 10; // Чуть ниже центра мага

        // Создаём золотые лучи восходящего солнца
        const rays = [];
        const rayCount = 5;
        const spreadAngle = Math.PI * 0.6; // 108 градусов веером вверх
        const startAngle = -Math.PI / 2 - spreadAngle / 2; // Центрируем вверх

        for (let i = 0; i < rayCount; i++) {
            const ray = new PIXI.Graphics();
            const angle = startAngle + (i / (rayCount - 1)) * spreadAngle;

            const rayData = {
                sprite: ray,
                angle: angle,
                baseLength: 25 + Math.random() * 10,
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 0.4
            };

            rays.push(rayData);
            dawnContainer.addChild(ray);
        }

        // Центральный полукруг (восходящее солнце)
        const sunBase = new PIXI.Graphics();
        dawnContainer.addChild(sunBase);

        // Функция отрисовки лучей
        const drawRays = (time) => {
            rays.forEach((rayData, index) => {
                const { sprite, angle, baseLength, phase, speed } = rayData;
                sprite.clear();

                // Пульсация длины
                const lengthMod = 1 + Math.sin(time * speed + phase) * 0.3;
                const length = baseLength * lengthMod;

                // Градиент от золотого к прозрачному
                const alpha = 0.5 + Math.sin(time * speed + phase) * 0.2;

                // Рисуем луч (треугольник)
                sprite.beginFill(0xFFD700, alpha);

                const tipX = Math.cos(angle) * length;
                const tipY = Math.sin(angle) * length;
                const width = 4;

                // Основание луча
                const baseLeftX = Math.cos(angle + Math.PI / 2) * width;
                const baseLeftY = Math.sin(angle + Math.PI / 2) * width;
                const baseRightX = Math.cos(angle - Math.PI / 2) * width;
                const baseRightY = Math.sin(angle - Math.PI / 2) * width;

                sprite.moveTo(baseLeftX, baseLeftY);
                sprite.lineTo(tipX, tipY);
                sprite.lineTo(baseRightX, baseRightY);
                sprite.closePath();
                sprite.endFill();
            });

            // Полукруг солнца внизу
            sunBase.clear();
            const sunPulse = 0.8 + Math.sin(time * 1.5) * 0.2;
            sunBase.beginFill(0xFFD700, 0.4 * sunPulse);
            sunBase.arc(0, 5, 12, Math.PI, 0);
            sunBase.endFill();

            // Внутренний более яркий полукруг
            sunBase.beginFill(0xFFF8DC, 0.6 * sunPulse);
            sunBase.arc(0, 5, 7, Math.PI, 0);
            sunBase.endFill();
        };

        effectsContainer.addChild(dawnContainer);

        // Анимация
        const animate = () => {
            if (!window.pixiAnimUtils?.isValid(dawnContainer)) return;

            const time = Date.now() * 0.001;
            drawRays(time);

            requestAnimationFrame(animate);
        };
        animate();

        // Сохраняем эффект
        activeDawnEffects.set(effectKey, {
            container: dawnContainer,
            rays: rays,
            wizard: wizard
        });

        console.log(`🌅 Эффект рассвета показан для ${effectKey}`);
    }

    function removeDawnEffect(key) {
        const effect = activeDawnEffects.get(key);
        if (!effect) return;

        const { container } = effect;

        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) {
                activeDawnEffects.delete(key);
                return;
            }

            container.alpha -= 0.05;

            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeDawnEffects.delete(key);
                console.log(`🌅 Эффект рассвета удален для ${key}`);
            }
        };
        fadeOut();
    }

    function clearAllDawnEffects() {
        activeDawnEffects.forEach((effect, key) => {
            removeDawnEffect(key);
        });
        activeDawnEffects.clear();
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.dawn_buff = {
        show: showDawnEffect,
        remove: removeDawnEffect,
        clearAll: clearAllDawnEffects
    };

    console.log('🌅 Эффект рассвета зарегистрирован');
})();
