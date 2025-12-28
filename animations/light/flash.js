// animations/light/flash.js - Анимация заклинания "Вспышка"

(function() {
    const ANIMATION_ID = 'flash';
    const SPRITE_SHEET_PATH = 'images/spells/light/flash_sprite.webp';
    const GRID_SIZE = 4; // 4x4 сетка
    const FRAME_COUNT = 16;

    function play(params) {
        const {
            casterCol,
            casterRow,
            targetCol,
            targetRow,
            onHit,
            onComplete
        } = params;

        console.log(`✨ Flash animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

        // При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Flash');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            console.warn('⚠️ Effects container not found');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        // Получаем координаты
        const startSprite = window.wizardSprites?.[`${casterCol}_${casterRow}`];
        const endSprite = window.wizardSprites?.[`${targetCol}_${targetRow}`];

        if (!startSprite || !endSprite) {
            console.warn('⚠️ Wizard sprites not found');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startX = startSprite.x;
        const startY = startSprite.y;
        const endX = endSprite.x;
        const endY = endSprite.y;

        // Создаём простой снаряд для полёта
        const projectile = new PIXI.Graphics();
        projectile.beginFill(0xFFFFFF);
        projectile.drawCircle(0, 0, 8);
        projectile.endFill();

        const glow = new PIXI.Graphics();
        glow.beginFill(0xFFD700, 0.5);
        glow.drawCircle(0, 0, 15);
        glow.endFill();

        const projectileContainer = new PIXI.Container();
        projectileContainer.addChild(glow);
        projectileContainer.addChild(projectile);
        projectileContainer.x = startX;
        projectileContainer.y = startY;
        projectileContainer.blendMode = PIXI.BLEND_MODES.ADD;
        container.addChild(projectileContainer);

        // Анимация полёта
        const flightDuration = window.getScaledDuration ? window.getScaledDuration(300) : 300;
        const startTime = Date.now();

        function animateFlight() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / flightDuration, 1);

            // Линейное перемещение
            projectileContainer.x = startX + (endX - startX) * progress;
            projectileContainer.y = startY + (endY - startY) * progress;

            // Пульсация
            const pulse = 1 + Math.sin(elapsed * 0.02) * 0.2;
            projectileContainer.scale.set(pulse);

            if (progress < 1) {
                requestAnimationFrame(animateFlight);
            } else {
                // Удаляем снаряд
                container.removeChild(projectileContainer);
                projectileContainer.destroy();

                // Вызываем onHit
                if (onHit) onHit();

                // Запускаем эффект вспышки из спрайт-листа
                createSpriteSheetEffect(endX, endY, container, onComplete);
            }
        }

        animateFlight();
    }

    function createSpriteSheetEffect(x, y, container, onComplete) {
        PIXI.Assets.load(SPRITE_SHEET_PATH).then(baseTexture => {
            if (!baseTexture) {
                console.warn('⚠️ Flash sprite sheet not loaded, using fallback');
                createFallbackEffect(x, y, container, onComplete);
                return;
            }

            // Создаем кадры из спрайт-листа 4x4
            const frames = [];
            const frameWidth = Math.floor(baseTexture.width / GRID_SIZE);
            const frameHeight = Math.floor(baseTexture.height / GRID_SIZE);

            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    const frame = new PIXI.Texture(
                        baseTexture,
                        new PIXI.Rectangle(
                            col * frameWidth,
                            row * frameHeight,
                            frameWidth,
                            frameHeight
                        )
                    );
                    frames.push(frame);
                }
            }

            // Создаем анимированный спрайт
            const flashSprite = new PIXI.AnimatedSprite(frames);
            flashSprite.x = x;
            flashSprite.y = y;
            flashSprite.anchor.set(0.5);

            // Масштаб - подбираем под размер эффекта
            const PIXI_CONFIG = window.PIXI_CONFIG || { cellWidth: 60, cellHeight: 60 };
            const scale = (PIXI_CONFIG.cellWidth * 2) / frameWidth;
            flashSprite.scale.set(scale);

            flashSprite.animationSpeed = 0.4; // Скорость анимации
            flashSprite.loop = false;
            flashSprite.blendMode = PIXI.BLEND_MODES.ADD;

            flashSprite.onComplete = () => {
                container.removeChild(flashSprite);
                flashSprite.destroy();
                if (onComplete) onComplete();
            };

            container.addChild(flashSprite);
            flashSprite.play();

            console.log('✨ Flash sprite animation started');

        }).catch(err => {
            console.warn('⚠️ Failed to load flash sprite sheet:', err);
            createFallbackEffect(x, y, container, onComplete);
        });
    }

    function createFallbackEffect(x, y, container, onComplete) {
        // Фолбэк - простой круговой эффект
        const impact = new PIXI.Graphics();
        impact.beginFill(0xFFD700, 0.8);
        impact.drawCircle(0, 0, 20);
        impact.endFill();
        impact.x = x;
        impact.y = y;
        impact.blendMode = PIXI.BLEND_MODES.ADD;
        container.addChild(impact);

        const startTime = Date.now();
        const duration = 200;

        function animateImpact() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            impact.scale.set(1 + progress * 2);
            impact.alpha = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateImpact);
            } else {
                container.removeChild(impact);
                impact.destroy();
                if (onComplete) onComplete();
            }
        }

        animateImpact();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`✨ Анимация ${ANIMATION_ID} зарегистрирована (со спрайт-листом)`);
})();
