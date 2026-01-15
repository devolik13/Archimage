// animations/light/flash.js - Анимация заклинания "Вспышка"

(function() {
    const ANIMATION_ID = 'flash';

    function play(params) {
        const { casterCol, casterRow, targetCol, targetRow, onHit, onComplete } = params;

        console.log(`✨ Flash animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

        // При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Flash');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        // Получаем необходимые объекты из ядра (как в spark.js)
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) {
            console.warn('⚠️ Не могу создать вспышку - нет контейнера или сетки');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startCell = gridCells[casterCol]?.[casterRow];
        const endCell = gridCells[targetCol]?.[targetRow];

        if (!startCell || !endCell) {
            console.warn('⚠️ Не могу создать вспышку - нет данных ячеек');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        // Начальная и целевая позиции
        const startX = startCell.x + startCell.width / 2;
        const startY = startCell.y + startCell.height / 2;
        const targetX = endCell.x + endCell.width / 2;
        const targetY = endCell.y + endCell.height / 2;

        // Создаём светящийся снаряд
        const projectile = new PIXI.Graphics();
        projectile.beginFill(0xFFFFFF, 0.9);
        projectile.drawCircle(0, 0, 5);
        projectile.endFill();

        // Добавляем золотое свечение
        projectile.beginFill(0xFFD700, 0.4);
        projectile.drawCircle(0, 0, 10);
        projectile.endFill();

        projectile.x = startX;
        projectile.y = startY;
        projectile.blendMode = PIXI.BLEND_MODES.ADD;

        effectsContainer.addChild(projectile);

        // Параметры анимации
        const duration = window.getScaledDuration ? window.getScaledDuration(350) : 350;
        const startTime = Date.now();
        let animationFrame = null;
        let isDestroyed = false;

        // Функция анимации полёта
        const animate = () => {
            if (isDestroyed || !window.pixiAnimUtils?.isValid(projectile) || !effectsContainer) {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                if (projectile && projectile.parent) {
                    try {
                        effectsContainer.removeChild(projectile);
                    } catch (e) {}
                }
                if (onHit) onHit();
                if (onComplete) onComplete();
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            try {
                // Интерполяция позиции
                projectile.x = startX + (targetX - startX) * progress;
                projectile.y = startY + (targetY - startY) * progress;

                // Пульсация
                const pulse = 1 + Math.sin(elapsed * 0.03) * 0.3;
                projectile.scale.set(pulse);

                // След от вспышки (золотистые искры)
                if (Math.random() > 0.6) {
                    createFlashTrail(projectile.x, projectile.y, effectsContainer);
                }
            } catch (e) {
                isDestroyed = true;
                if (onHit) onHit();
                if (onComplete) onComplete();
                return;
            }

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Удаляем снаряд
                if (projectile.parent && effectsContainer) {
                    try {
                        effectsContainer.removeChild(projectile);
                        projectile.destroy();
                    } catch (e) {}
                }

                // Вызываем onHit
                if (onHit) onHit();

                // Создаем эффект взрыва вспышки
                createFlashExplosion(targetX, targetY, endCell.cellScale || 1, effectsContainer, onComplete);
            }
        };

        // Создание следа
        function createFlashTrail(x, y, container) {
            const trail = new PIXI.Graphics();
            trail.beginFill(0xFFD700, 0.6);
            trail.drawCircle(0, 0, 3);
            trail.endFill();

            trail.x = x;
            trail.y = y;
            trail.blendMode = PIXI.BLEND_MODES.ADD;

            container.addChild(trail);

            const fadeStartTime = Date.now();
            const fadeDuration = 250;

            const fadeAnimate = () => {
                if (!trail || trail.destroyed || !trail.transform) {
                    return;
                }

                const elapsed = Date.now() - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);

                trail.alpha = 0.6 * (1 - progress);
                trail.scale.set(1 - progress * 0.5);

                if (progress < 1 && trail.parent) {
                    requestAnimationFrame(fadeAnimate);
                } else {
                    if (trail.parent) {
                        container.removeChild(trail);
                    }
                    if (!trail.destroyed) {
                        trail.destroy();
                    }
                }
            };

            fadeAnimate();
        }

        // Запуск анимации
        animate();
    }

    // Создание эффекта взрыва вспышки (через PIXI Graphics)
    function createFlashExplosion(x, y, scale, effectsContainer, onComplete) {
        // Яркая вспышка при ударе
        const flash = new PIXI.Graphics();
        flash.beginFill(0xFFFFFF, 0.7);
        flash.drawCircle(0, 0, 25 * scale);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        flash.blendMode = PIXI.BLEND_MODES.ADD;

        effectsContainer.addChild(flash);

        const flashStartTime = Date.now();
        const flashDuration = 200;

        const animateFlash = () => {
            if (!window.pixiAnimUtils?.isValid(flash)) return;

            const elapsed = Date.now() - flashStartTime;
            const progress = Math.min(elapsed / flashDuration, 1);

            flash.scale.set(1 + progress * 1.5);
            flash.alpha = 0.7 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateFlash);
            } else {
                if (flash.parent) {
                    effectsContainer.removeChild(flash);
                    flash.destroy();
                }
            }
        };

        animateFlash();

        // Создаем частицы света
        for (let i = 0; i < 10; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFFD700, 0.8);
            particle.drawCircle(0, 0, 4);
            particle.endFill();

            particle.x = x;
            particle.y = y;
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            effectsContainer.addChild(particle);

            const angle = (Math.PI * 2 / 10) * i;
            const speed = 3 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const particleStartTime = Date.now();
            const particleDuration = 350;

            const animateParticle = () => {
                if (!window.pixiAnimUtils?.isValid(particle)) return;

                const elapsed = Date.now() - particleStartTime;
                const progress = Math.min(elapsed / particleDuration, 1);

                particle.x += vx * (1 - progress);
                particle.y += vy * (1 - progress);
                particle.alpha = 0.8 * (1 - progress);
                particle.scale.set(1 - progress * 0.5);

                if (progress < 1 && particle.parent) {
                    requestAnimationFrame(animateParticle);
                } else {
                    if (particle.parent) {
                        effectsContainer.removeChild(particle);
                    }
                    if (!particle.destroyed) {
                        particle.destroy();
                    }
                }
            };

            animateParticle();
        }

        // Завершаем после анимации частиц
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 400);
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`✨ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
