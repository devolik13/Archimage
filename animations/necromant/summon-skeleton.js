// animations/necromant/summon-skeleton.js - Анимация призванного скелета

(function() {
    // Хранилище активных визуалов скелетов по ID
    const activeSkeletonVisuals = new Map();

    function playSummonSkeletonAnimation(params) {
        const { casterType, casterPosition, targetPosition, level = 1, wolfId: skeletonId, isNew = true, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Призыв скелета');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать скелета - нет контейнера');
            if (onComplete) onComplete();
            return;
        }

        // Если скелет уже существует (не новый), показываем эффект восстановления
        if (!isNew && skeletonId) {
            const existing = activeSkeletonVisuals.get(skeletonId);
            if (existing) {
                console.log(`💀 Скелет ${skeletonId} уже существует, показываем эффект восстановления`);
                createHealEffect(existing.x, existing.y);
                if (onComplete) onComplete();
                return;
            }
        }

        const summonCol = casterType === 'player' ? 4 : 1;
        const summonRow = casterPosition;
        const summonCell = gridCells[summonCol]?.[summonRow];

        if (!summonCell || !skeletonId) {
            if (onComplete) onComplete();
            return;
        }

        console.log(`💀 Создание нового скелета ${skeletonId}`);

        const idleTexturePath = 'images/spells/necro/sceleton/idle.webp';

        PIXI.Assets.load(idleTexturePath).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                createFallbackSkeleton();
                return;
            }

            const frames = [];
            const frameWidth = 256;  // 1280 / 5
            const frameHeight = 256;

            // Сетка 5x5 = 25 кадров
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
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

            const skeleton = new PIXI.AnimatedSprite(frames);
            skeleton.x = summonCell.x + summonCell.width / 2;
            skeleton.y = summonCell.y + summonCell.height * 0.7;
            skeleton.anchor.set(0.5, 0.5);

            const scale = summonCell.cellScale * 0.32;
            const direction = casterType === 'player' ? -1 : 1;
            skeleton.scale.set(scale * direction, scale);

            skeleton.animationSpeed = 0.08;
            skeleton.loop = true;
            skeleton.alpha = 0;

            effectsContainer.addChild(skeleton);
            createSummonEffect(skeleton.x, skeleton.y);

            // Плавное появление
            const fadeIn = () => {
                skeleton.alpha += 0.05;
                if (skeleton.alpha < 1) {
                    requestAnimationFrame(fadeIn);
                } else {
                    skeleton.play();
                    activeSkeletonVisuals.set(skeletonId, skeleton);
                    if (onComplete) onComplete();
                }
            };
            fadeIn();

        }).catch(() => {
            createFallbackSkeleton();
        });

        function createFallbackSkeleton() {
            const skeleton = new PIXI.Graphics();

            // Тело
            skeleton.beginFill(0xCCCCCC, 0.8);
            skeleton.drawRoundedRect(-8, -25, 16, 25, 3);
            skeleton.endFill();

            // Голова (череп)
            skeleton.beginFill(0xDDDDDD, 0.9);
            skeleton.drawCircle(0, -30, 8);
            skeleton.endFill();

            // Глаза
            skeleton.beginFill(0x000000, 1);
            skeleton.drawCircle(-3, -31, 2);
            skeleton.drawCircle(3, -31, 2);
            skeleton.endFill();

            skeleton.x = summonCell.x + summonCell.width / 2;
            skeleton.y = summonCell.y + summonCell.height * 0.7;

            effectsContainer.addChild(skeleton);

            const animate = () => {
                if (!window.pixiAnimUtils.isValid(skeleton)) return;
                skeleton.rotation = Math.sin(Date.now() * 0.001) * 0.05;
                if (skeleton.parent) requestAnimationFrame(animate);
            };
            animate();

            activeSkeletonVisuals.set(skeletonId, skeleton);
            if (onComplete) onComplete();
        }

        function createSummonEffect(x, y) {
            // Тёмно-зелёный круг призыва (некромантия)
            const circle = new PIXI.Graphics();
            circle.lineStyle(2, 0x708090, 0.8); // slate gray для некромантии
            circle.drawCircle(0, 0, 5);
            circle.x = x;
            circle.y = y;
            circle.alpha = 0.8;

            effectsContainer.addChild(circle);

            const startTime = Date.now();
            const duration = window.getScaledDuration ? window.getScaledDuration(500) : 500;

            const animate = () => {
                if (!window.pixiAnimUtils.isValid(circle)) return;

                const progress = Math.min((Date.now() - startTime) / duration, 1);
                circle.scale.set(1 + progress * 3);
                circle.alpha = 0.8 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (circle.parent) effectsContainer.removeChild(circle);
                }
            };
            animate();

            // Частицы костей (серо-белые искры)
            for (let i = 0; i < 8; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0xCCCCCC, 0.8);
                spark.drawCircle(0, 0, 2);
                spark.endFill();

                spark.x = x;
                spark.y = y;
                effectsContainer.addChild(spark);

                const angle = (Math.PI * 2 / 8) * i;
                const speed = 2 + Math.random();
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;

                const animateSpark = () => {
                    if (!window.pixiAnimUtils.isValid(spark)) return;

                    spark.x += vx;
                    spark.y += vy;
                    spark.alpha -= 0.02;

                    if (spark.alpha > 0 && spark.parent) {
                        requestAnimationFrame(animateSpark);
                    } else {
                        if (spark.parent) effectsContainer.removeChild(spark);
                    }
                };
                animateSpark();
            }
        }

        function createHealEffect(x, y) {
            // Серо-зелёные круги восстановления
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const heal = new PIXI.Graphics();
                    heal.lineStyle(2, 0x708090, 0.6);
                    heal.drawCircle(0, 0, 10);
                    heal.x = x;
                    heal.y = y;

                    effectsContainer.addChild(heal);

                    const startTime = Date.now();
                    const duration = window.getScaledDuration ? window.getScaledDuration(800) : 800;

                    const animate = () => {
                        if (!window.pixiAnimUtils.isValid(heal)) return;

                        const progress = Math.min((Date.now() - startTime) / duration, 1);
                        heal.scale.set(1 + progress * 2);
                        heal.alpha = 0.6 * (1 - progress);
                        heal.y -= 1;

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            if (heal.parent) effectsContainer.removeChild(heal);
                        }
                    };
                    animate();
                }, i * 150);
            }
        }
    }

    // Удаление визуала скелета по ID
    function clearSkeletonVisual(skeletonId) {
        const skeleton = activeSkeletonVisuals.get(skeletonId);
        if (!skeleton) return;

        console.log(`💀 Удаление скелета ${skeletonId}`);

        if (skeleton.stop) skeleton.stop();

        const fadeOut = () => {
            skeleton.alpha -= 0.05;
            if (skeleton.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                if (skeleton.parent) skeleton.parent.removeChild(skeleton);
                skeleton.destroy({ children: true, texture: false, baseTexture: false });
                activeSkeletonVisuals.delete(skeletonId);
            }
        };
        fadeOut();
    }

    // Очистка всех скелетов
    function clearAllSkeletons() {
        activeSkeletonVisuals.forEach((_, id) => clearSkeletonVisual(id));
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.summon_skeleton = {
        play: playSummonSkeletonAnimation,
        clear: clearSkeletonVisual,
        clearAll: clearAllSkeletons
    };

    console.log('💀 Анимация скелета зарегистрирована');
})();
