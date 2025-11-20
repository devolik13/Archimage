// battle/renderer/animations/water/chilled-effect.js
console.log('✅ chilled-effect.js загружен');

(function() {
    // Хранилище активных эффектов охлаждения
    const activeChilledEffects = new Map();

    function showChilledEffect(wizard, position, casterType) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эффект охлаждения');
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
        if (activeChilledEffects.has(effectKey)) {
            removeChilledEffect(effectKey);
        }

        // Контейнер для снежинки
        const snowContainer = new PIXI.Container();

        // Позиция с противоположной стороны от листка (справа для игрока, слева для врага)
        const offsetX = casterType === 'player' ? 30 : -30;
        const offsetY = -15;

        snowContainer.x = centerX + offsetX;
        snowContainer.y = centerY + offsetY;

        // Создаем снежинку
        const snowflake = new PIXI.Graphics();

        // Функция рисования снежинки
        const drawSnowflake = (scale = 1) => {
            snowflake.clear();
            snowflake.lineStyle(1.5 * scale, 0x88ccff, 1);

            // 6 лучей снежинки
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const length = 12 * scale;

                // Главный луч
                snowflake.moveTo(0, 0);
                snowflake.lineTo(
                    Math.cos(angle) * length,
                    Math.sin(angle) * length
                );

                // Боковые веточки
                const branchLength = length * 0.4;
                const branchAngle1 = angle - Math.PI / 6;
                const branchAngle2 = angle + Math.PI / 6;

                const tipX = Math.cos(angle) * length;
                const tipY = Math.sin(angle) * length;

                snowflake.moveTo(tipX, tipY);
                snowflake.lineTo(
                    tipX - Math.cos(branchAngle1) * branchLength,
                    tipY - Math.sin(branchAngle1) * branchLength
                );

                snowflake.moveTo(tipX, tipY);
                snowflake.lineTo(
                    tipX - Math.cos(branchAngle2) * branchLength,
                    tipY - Math.sin(branchAngle2) * branchLength
                );
            }

            // Центральный кристалл
            snowflake.beginFill(0xccffff, 0.8);
            snowflake.drawCircle(0, 0, 3 * scale);
            snowflake.endFill();
        };

        drawSnowflake(1);
        snowContainer.addChild(snowflake);
        effectsContainer.addChild(snowContainer);

        // Анимация снежинки
        let time = 0;
        const animateSnowflake = () => {
            if (!window.pixiAnimUtils.isValid(snowContainer)) return;

            time += 0.02;

            // Вращение снежинки
            snowflake.rotation = time * 0.5;

            // Пульсация размера
            const pulse = 1 + Math.sin(time * 2) * 0.2;
            drawSnowflake(pulse);

            // Легкое покачивание
            snowflake.x = Math.sin(time * 1.5) * 3;
            snowflake.y = Math.cos(time * 1.5) * 3;

            // Мерцание
            snowflake.alpha = 0.7 + Math.sin(time * 3) * 0.3;

            requestAnimationFrame(animateSnowflake);
        };
        animateSnowflake();

        // Добавляем ледяные искры
        const sparkInterval = setInterval(() => {
            if (!snowContainer.parent) {
                clearInterval(sparkInterval);
                return;
            }

            const spark = new PIXI.Graphics();
            spark.beginFill(0xaaddff, 1);
            spark.drawCircle(0, 0, 1.5);
            spark.endFill();

            spark.x = snowContainer.x + (Math.random() - 0.5) * 20;
            spark.y = snowContainer.y + 10;

            effectsContainer.addChild(spark);

            // Анимация искры (падает вниз)
            const startY = spark.y;
            let progress = 0;
            const animateSpark = () => {
                if (!window.pixiAnimUtils.isValid(spark)) return;

                progress += 0.015;
                spark.y = startY + progress * 30;
                spark.alpha = 1 - progress;
                spark.scale.set((1 - progress) * 0.5);

                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animateSpark);
                } else if (spark.parent) {
                    spark.parent.removeChild(spark);
                }
            };
            animateSpark();
        }, 600);

        // Сохраняем эффект
        activeChilledEffects.set(effectKey, {
            container: snowContainer,
            snowflake: snowflake,
            sparkInterval: sparkInterval,
            wizard: wizard
        });
    }

    function removeChilledEffect(key) {
        const effect = activeChilledEffects.get(key);
        if (!effect) return;

        const { container, sparkInterval } = effect;

        // Останавливаем генерацию искр
        if (sparkInterval) {
            clearInterval(sparkInterval);
        }

        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) return;

            container.alpha -= 0.05;

            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeChilledEffects.delete(key);
            }
        };
        fadeOut();
    }

    function clearAllChilledEffects() {
        activeChilledEffects.forEach((effect, key) => {
            if (effect.sparkInterval) {
                clearInterval(effect.sparkInterval);
            }
            removeChilledEffect(key);
        });
        activeChilledEffects.clear();
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.chilled = {
        show: showChilledEffect,
        remove: removeChilledEffect,
        clearAll: clearAllChilledEffects
    };

    console.log('❄️ Эффект охлаждения зарегистрирован');
})();
