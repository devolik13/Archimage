// battle/renderer/animations/wind/wind-blade.js - Анимация заклинания "Ветрорез"

(function() {
    // Хранилище активных лезвий
    const activeBlades = new Map();
    
    function playWindBladeAnimation(params) {
        const { projectileId, casterType, targetColumn, initialPosition } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Ветрорез');
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать Ветрорез - нет контейнера');
            return;
        }
        
        // Загружаем спрайт-лист
        const bladeTexturePath = 'images/spells/wind/wind_blade/wind_blade_spritesheet.webp';
        
        PIXI.Assets.load(bladeTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру Ветрореза');
                createFallbackBlade(projectileId, targetColumn, initialPosition, effectsContainer, gridCells);
                return;
            }
            
            // Спрайт-лист 768x768, 3 колонки × 3 ряда = 9 кадров
            const frameWidth = 768 / 3;  // 256px
            const frameHeight = 768 / 3; // 256px
            const cols = 3;
            const rows = 3;
            const totalFrames = 9;
            
            // Создаем текстуры из спрайт-листа
            const bladeTextures = [];
            for (let i = 0; i < totalFrames; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                const rect = new PIXI.Rectangle(
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                
                const frameTexture = new PIXI.Texture(texture.baseTexture, rect);
                bladeTextures.push(frameTexture);
            }
            
            console.log(`🌀 Загружено ${bladeTextures.length} кадров для Ветрореза`);
            
            // Создаем анимированный спрайт лезвия
            const bladeSprite = new PIXI.AnimatedSprite(bladeTextures);
            
            // Позиционируем в начальной ячейке
            const initialCell = gridCells[targetColumn]?.[initialPosition];
            if (!initialCell) {
                console.warn('Не найдена начальная ячейка для Ветрореза');
                return;
            }
            
            bladeSprite.x = initialCell.x + initialCell.width / 2;
            bladeSprite.y = initialCell.y + initialCell.height / 2;
            bladeSprite.anchor.set(0.5);
            
            // Масштабируем
            const targetSize = initialCell.cellScale * 60;
            const scale = targetSize / frameWidth;
            bladeSprite.scale.set(scale);
            
            // Настройки анимации
            bladeSprite.animationSpeed = 0.3; // Быстрое вращение
            bladeSprite.loop = true;
            bladeSprite.play();
            
            // Эффекты
            bladeSprite.blendMode = PIXI.BLEND_MODES.ADD;
            bladeSprite.tint = 0xCCFFFF;
            bladeSprite.alpha = 0.9;
            
            effectsContainer.addChild(bladeSprite);
            
            // Сохраняем данные лезвия
            activeBlades.set(projectileId, {
                sprite: bladeSprite,
                targetColumn: targetColumn,
                currentPosition: initialPosition,
                scale: scale
            });
            
            console.log(`🌀 Ветрорез создан на позиции ${targetColumn}_${initialPosition}`);
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры Ветрореза:', err);
            createFallbackBlade(projectileId, targetColumn, initialPosition, effectsContainer, gridCells);
        });
    }
    
    // Fallback - простая графика
    function createFallbackBlade(projectileId, targetColumn, initialPosition, effectsContainer, gridCells) {
        const initialCell = gridCells[targetColumn]?.[initialPosition];
        if (!initialCell) return;
        
        const blade = new PIXI.Graphics();
        
        // Рисуем вращающееся лезвие
        blade.beginFill(0xCCFFFF, 0.8);
        blade.drawPolygon([
            0, -20,
            5, -5,
            20, 0,
            5, 5,
            0, 20,
            -5, 5,
            -20, 0,
            -5, -5
        ]);
        blade.endFill();
        
        blade.x = initialCell.x + initialCell.width / 2;
        blade.y = initialCell.y + initialCell.height / 2;
        blade.scale.set(initialCell.cellScale);
        
        effectsContainer.addChild(blade);
        
        // Анимация вращения
        let rotation = 0;
        const rotate = () => {
            if (!blade.parent) return;
            rotation += 0.1;
            blade.rotation = rotation;
            requestAnimationFrame(rotate);
        };
        rotate();
        
        activeBlades.set(projectileId, {
            sprite: blade,
            targetColumn: targetColumn,
            currentPosition: initialPosition,
            scale: initialCell.cellScale
        });
        
        console.log(`🌀 Fallback Ветрорез создан на позиции ${targetColumn}_${initialPosition}`);
    }
    
    // Обновление позиции лезвия
    function updateBladePosition(projectileId, newPosition) {
        const blade = activeBlades.get(projectileId);
        if (!blade) return;
        
        const gridCells = window.pixiCore?.getGridCells();
        if (!gridCells) return;
        
        const targetCell = gridCells[blade.targetColumn]?.[newPosition];
        if (!targetCell) return;
        
        // Плавное перемещение к новой позиции
        const startX = blade.sprite.x;
        const startY = blade.sprite.y;
        const endX = targetCell.x + targetCell.width / 2;
        const endY = targetCell.y + targetCell.height / 2;
        
        const duration = 200; // Быстрое перемещение
        const startTime = Date.now();
        
        const animate = () => {
            if (!blade.sprite || !window.pixiAnimUtils.isValid(blade.sprite)) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Плавное движение с easing
            const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
            blade.sprite.x = startX + (endX - startX) * eased;
            blade.sprite.y = startY + (endY - startY) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                blade.currentPosition = newPosition;
                
                // Эффект удара при достижении позиции
                showBladeImpact(endX, endY, blade.scale);
            }
        };
        animate();
    }
    
    // Эффект удара лезвия
    function showBladeImpact(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Искры от удара
        for (let i = 0; i < 4; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFFFFF, 0.9);
            spark.drawCircle(0, 0, 3 * scale);
            spark.endFill();
            spark.x = x;
            spark.y = y;
            
            effectsContainer.addChild(spark);
            
            const angle = (Math.PI * 2 / 4) * i;
            const speed = 2 + Math.random();
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const startTime = Date.now();
            const duration = 300;
            
            const animateSpark = () => {
                if (!window.pixiAnimUtils.isValid(spark)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                spark.x += vx;
                spark.y += vy;
                spark.alpha = 1 - progress;

                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animateSpark);
                } else {
                    if (spark.parent) {
                        effectsContainer.removeChild(spark);
                    }
                }
            };
            animateSpark();
        }
    }
    
    // Удаление лезвия
    function removeBlade(projectileId) {
        const blade = activeBlades.get(projectileId);
        if (!blade) return;
        
        // Анимация исчезновения
        const startTime = Date.now();
        const duration = 300;
        
        const fadeOut = () => {
            if (!blade.sprite || !blade.sprite.parent) {
                activeBlades.delete(projectileId);
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            blade.sprite.alpha = 0.9 * (1 - progress);
            blade.sprite.scale.set(blade.scale * (1 + progress * 0.5));
            
            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            } else {
                if (blade.sprite.parent) {
                    blade.sprite.parent.removeChild(blade.sprite);
                    blade.sprite.destroy();
                }
                activeBlades.delete(projectileId);
                console.log(`🌀 Ветрорез ${projectileId} удалён`);
            }
        };
        fadeOut();
    }
    
    // Очистка всех лезвий
    function clearAll() {
        activeBlades.forEach((blade, id) => {
            if (blade.sprite && blade.sprite.parent) {
                blade.sprite.parent.removeChild(blade.sprite);
                blade.sprite.destroy();
            }
        });
        activeBlades.clear();
        console.log('🌀 Все Ветрорезы очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.wind_blade = {
        play: playWindBladeAnimation,
        updatePosition: updateBladePosition,
        remove: removeBlade,
        clearAll: clearAll
    };
    
    console.log('🌀 Анимация "Ветрорез" зарегистрирована');
})();