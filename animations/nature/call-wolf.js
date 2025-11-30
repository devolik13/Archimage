// battle/renderer/animations/nature/call-wolf.js

(function() {
    // Хранилище активных визуалов волков по ID
    const activeWolfVisuals = new Map();
    
    function playCallWolfAnimation(params) {
        const { casterType, casterPosition, targetPosition, level = 1, wolfId, isNew = true, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Призыв волка');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать волка - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Если волк уже существует (не новый), просто показываем эффект восстановления
        if (!isNew && wolfId) {
            const existingWolf = activeWolfVisuals.get(wolfId);
            if (existingWolf) {
                console.log(`🐺 Волк ${wolfId} уже существует, показываем эффект восстановления`);
                createHealEffect(existingWolf.x, existingWolf.y);
                if (onComplete) onComplete();
                return;
            }
        }
        
        const summonCol = casterType === 'player' ? 4 : 1;
        const summonRow = casterPosition;
        const summonCell = gridCells[summonCol]?.[summonRow];
        
        if (!summonCell || !wolfId) {
            if (onComplete) onComplete();
            return;
        }
        
        console.log(`🐺 Создание нового волка ${wolfId}`);
        
        const wolfTexturePath = 'images/spells/nature/call_wolf/wolf_idle_sheet.png';
        
        PIXI.Assets.load(wolfTexturePath).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                createFallbackWolf();
                return;
            }
            
            const frames = [];
            const frameWidth = 204;
            const frameHeight = 204;
            
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
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
            
            const wolf = new PIXI.AnimatedSprite(frames);
            wolf.x = summonCell.x + summonCell.width / 2;
            wolf.y = summonCell.y + summonCell.height * 0.7;
            wolf.anchor.set(0.5, 0.5);
            
            const scale = summonCell.cellScale * 0.30;
            const direction = casterType === 'player' ? -1 : 1;
            wolf.scale.set(scale * direction, scale);
            
            wolf.animationSpeed = 0.08;
            wolf.loop = true;
            wolf.alpha = 0;
            
            effectsContainer.addChild(wolf);
            createSummonEffect(wolf.x, wolf.y);
            
            // Плавное появление
            const fadeIn = () => {
                wolf.alpha += 0.05;
                if (wolf.alpha < 1) {
                    requestAnimationFrame(fadeIn);
                } else {
                    wolf.play();
                    activeWolfVisuals.set(wolfId, wolf);
                    if (onComplete) onComplete();
                }
            };
            fadeIn();
            
        }).catch(() => {
            createFallbackWolf();
        });
        
        function createFallbackWolf() {
            const wolf = new PIXI.Graphics();
            
            wolf.beginFill(0x666666, 0.8);
            wolf.drawEllipse(0, 0, 18, 12);
            wolf.endFill();
            
            wolf.beginFill(0x555555, 0.8);
            const headX = casterType === 'player' ? -10 : 10;
            wolf.drawCircle(headX, -3, 10);
            wolf.endFill();
            
            wolf.beginFill(0xFFFF00, 1);
            const eye1X = casterType === 'player' ? -13 : 13;
            const eye2X = casterType === 'player' ? -7 : 7;
            wolf.drawCircle(eye1X, -4, 2.5);
            wolf.drawCircle(eye2X, -4, 2.5);
            wolf.endFill();
            
            wolf.x = summonCell.x + summonCell.width / 2;
            wolf.y = summonCell.y + summonCell.height * 0.7;
            
            effectsContainer.addChild(wolf);
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(wolf)) return;

                wolf.rotation = Math.sin(Date.now() * 0.001) * 0.05;
                if (wolf.parent) requestAnimationFrame(animate);
            };
            animate();
            
            activeWolfVisuals.set(wolfId, wolf);
            if (onComplete) onComplete();
        }
        
        function createSummonEffect(x, y) {
            const circle = new PIXI.Graphics();
            circle.lineStyle(2, 0x00FF00, 0.8);
            circle.drawCircle(0, 0, 5);
            circle.x = x;
            circle.y = y;
            circle.alpha = 0.8;
            
            effectsContainer.addChild(circle);
            
            const startTime = Date.now();
            const duration = 500;
            
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
            
            for (let i = 0; i < 8; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0x00FF00, 0.8);
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
            // Зеленые круги исцеления
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const heal = new PIXI.Graphics();
                    heal.lineStyle(2, 0x00FF00, 0.6);
                    heal.drawCircle(0, 0, 10);
                    heal.x = x;
                    heal.y = y;
                    
                    effectsContainer.addChild(heal);
                    
                    const startTime = Date.now();
                    const duration = 800;
                    
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
    
    // Удаление визуала волка по ID
    function clearWolfVisual(wolfId) {
        const wolf = activeWolfVisuals.get(wolfId);
        if (!wolf) return;
        
        console.log(`🐺 Удаление волка ${wolfId}`);
        
        if (wolf.stop) wolf.stop();
        
        const fadeOut = () => {
            wolf.alpha -= 0.05;
            if (wolf.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                if (wolf.parent) wolf.parent.removeChild(wolf);
                wolf.destroy(true);
                activeWolfVisuals.delete(wolfId);
            }
        };
        fadeOut();
    }
    
    // Очистка всех волков
    function clearAllWolves() {
        activeWolfVisuals.forEach((_, id) => clearWolfVisual(id));
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.call_wolf = {
        play: playCallWolfAnimation,
        clear: clearWolfVisual,
        clearAll: clearAllWolves
    };
    
    console.log('🐺 Анимация волка зарегистрирована');
})();