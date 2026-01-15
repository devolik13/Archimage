// animations/dark/miasma-effect.js - Визуальный эффект баффа Миазма (защита от яда)

(function() {
    // Хранилище активных эффектов миазмы
    const activeMiasmaEffects = new Map();

    function showMiasmaEffect(wizard, position, casterType) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эффект миазмы');
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
        if (activeMiasmaEffects.has(effectKey)) {
            removeMiasmaEffect(effectKey);
        }

        // Контейнер для эффекта
        const miasmaContainer = new PIXI.Container();
        miasmaContainer.x = centerX;
        miasmaContainer.y = centerY;

        // Ядовитое кольцо-свечение вокруг мага
        const glowRing = new PIXI.Graphics();
        miasmaContainer.addChild(glowRing);

        // Маленькие ядовитые частицы поднимающиеся вверх
        const particles = [];
        const particleCount = 4;

        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            particles.push({
                sprite: particle,
                angle: (i / particleCount) * Math.PI * 2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.2
            });
            miasmaContainer.addChild(particle);
        }

        effectsContainer.addChild(miasmaContainer);

        // Анимация
        const animate = () => {
            if (!window.pixiAnimUtils?.isValid(miasmaContainer)) return;

            const time = Date.now() * 0.001;

            // Пульсирующее кольцо
            glowRing.clear();
            const ringPulse = 0.6 + Math.sin(time * 2) * 0.2;
            const ringSize = 28 + Math.sin(time * 1.5) * 3;

            // Внешнее свечение
            glowRing.beginFill(0x00ff00, 0.08 * ringPulse);
            glowRing.drawCircle(0, 0, ringSize + 8);
            glowRing.endFill();

            // Основное кольцо
            glowRing.lineStyle(1.5, 0x4aff4a, 0.25 * ringPulse);
            glowRing.drawCircle(0, 0, ringSize);

            // Частицы
            particles.forEach((p, i) => {
                const { sprite, angle, phase, speed } = p;
                sprite.clear();

                const currentAngle = angle + time * speed;
                const radius = 20;
                const x = Math.cos(currentAngle) * radius;

                // Частицы поднимаются и опускаются
                const yOffset = Math.sin(time * 2 + phase) * 8;
                const y = -5 + yOffset;

                const alpha = 0.3 + Math.sin(time * 3 + phase) * 0.15;
                const size = 2 + Math.sin(time * 2 + phase) * 0.5;

                sprite.beginFill(0x7fff7f, alpha);
                sprite.drawCircle(x, y, size);
                sprite.endFill();
            });

            requestAnimationFrame(animate);
        };
        animate();

        // Сохраняем эффект
        activeMiasmaEffects.set(effectKey, {
            container: miasmaContainer,
            wizard: wizard
        });

        console.log(`☣️ Эффект миазмы показан для ${effectKey}`);
    }

    function removeMiasmaEffect(key) {
        const effect = activeMiasmaEffects.get(key);
        if (!effect) return;

        const { container } = effect;

        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) {
                activeMiasmaEffects.delete(key);
                return;
            }

            container.alpha -= 0.05;

            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeMiasmaEffects.delete(key);
                console.log(`☣️ Эффект миазмы удален для ${key}`);
            }
        };
        fadeOut();
    }

    function clearAllMiasmaEffects() {
        activeMiasmaEffects.forEach((effect, key) => {
            removeMiasmaEffect(key);
        });
        activeMiasmaEffects.clear();
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.miasma_buff = {
        show: showMiasmaEffect,
        remove: removeMiasmaEffect,
        clearAll: clearAllMiasmaEffects
    };

    console.log('☣️ Эффект миазмы зарегистрирован');
})();
