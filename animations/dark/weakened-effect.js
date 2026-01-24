// animations/dark/weakened-effect.js - Визуальный эффект дебаффа Слабость

(function() {
    // Хранилище активных эффектов слабости
    const activeWeakenedEffects = new Map();

    function showWeakenedEffect(wizard, position, casterType) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эффект слабости');
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
        if (activeWeakenedEffects.has(effectKey)) {
            removeWeakenedEffect(effectKey);
        }

        // Контейнер для эффекта
        const smokeContainer = new PIXI.Container();
        smokeContainer.x = centerX;
        smokeContainer.y = centerY;

        // Создаём частицы тёмного дыма
        const particles = [];
        const particleCount = 6;

        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();

            const particleData = {
                sprite: particle,
                angle: (i / particleCount) * Math.PI * 2,
                radius: 15 + Math.random() * 10,
                size: 8 + Math.random() * 6,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.3,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            };

            particles.push(particleData);
            smokeContainer.addChild(particle);
        }

        effectsContainer.addChild(smokeContainer);

        // Анимация дыма
        const animate = () => {
            // Проверяем, существует ли ещё эффект в карте (предотвращает утечку памяти)
            if (!activeWeakenedEffects.has(effectKey)) return;
            if (!window.pixiAnimUtils?.isValid(smokeContainer)) return;

            const time = Date.now() * 0.001;

            particles.forEach((p) => {
                const { sprite, angle, radius, size, phase, speed, rotationSpeed } = p;
                sprite.clear();

                // Движение по кругу с колебанием
                const currentAngle = angle + time * speed;
                const radiusMod = radius + Math.sin(time * 2 + phase) * 5;

                const x = Math.cos(currentAngle) * radiusMod;
                const y = Math.sin(currentAngle) * radiusMod * 0.5 - 10; // Овал, смещён вверх

                // Пульсация размера
                const sizeMod = size * (0.8 + Math.sin(time * 3 + phase) * 0.2);

                // Тёмно-фиолетовый дым
                const alpha = 0.3 + Math.sin(time * 2 + phase) * 0.15;
                sprite.beginFill(0x2a0a3a, alpha);
                sprite.drawCircle(x, y, sizeMod);
                sprite.endFill();

                // Внутренний более тёмный круг
                sprite.beginFill(0x1a0520, alpha * 0.7);
                sprite.drawCircle(x, y, sizeMod * 0.6);
                sprite.endFill();
            });

            requestAnimationFrame(animate);
        };
        animate();

        // Сохраняем эффект
        activeWeakenedEffects.set(effectKey, {
            container: smokeContainer,
            particles: particles,
            wizard: wizard
        });

        console.log(`🌑 Эффект слабости показан для ${effectKey}`);
    }

    function removeWeakenedEffect(key) {
        const effect = activeWeakenedEffects.get(key);
        if (!effect) return;

        const { container } = effect;

        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) {
                activeWeakenedEffects.delete(key);
                return;
            }

            container.alpha -= 0.08;

            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeWeakenedEffects.delete(key);
                console.log(`🌑 Эффект слабости удален для ${key}`);
            }
        };
        fadeOut();
    }

    function clearAllWeakenedEffects() {
        activeWeakenedEffects.forEach((effect, key) => {
            removeWeakenedEffect(key);
        });
        activeWeakenedEffects.clear();
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.weakened = {
        show: showWeakenedEffect,
        remove: removeWeakenedEffect,
        clearAll: clearAllWeakenedEffects
    };

    console.log('🌑 Эффект слабости зарегистрирован');
})();
