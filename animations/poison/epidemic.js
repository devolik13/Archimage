// battle/renderer/animations/poison/epidemic.js - Анимация заклинания "Эпидемия"
console.log('✅ epidemic.js загружен');

(function() {
    // Хранилище активных пузырей эпидемии
    const activeBubbles = [];
    
    function playEpidemicAnimation(params) {
        const { targetCol, targetRow, onComplete, isMegaExplosion = false } = params;

        console.log('💀 playEpidemicAnimation ВЫЗВАНА:', { targetCol, targetRow, isMegaExplosion });

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Эпидемия');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        console.log('💀 Проверка контейнеров:', { effectsContainer: !!effectsContainer, gridCells: !!gridCells });

        if (!effectsContainer || !gridCells) {
            console.warn('💀 Не могу создать эпидемию - нет контейнера');
            if (onComplete) onComplete();
            return;
        }

        const targetCell = gridCells[targetCol]?.[targetRow];

        if (!targetCell) {
            console.warn('💀 Не найдена клетка для эпидемии:', { targetCol, targetRow });
            if (onComplete) onComplete();
            return;
        }

        // Fallback размеры если клетка имеет нулевые размеры
        const cellWidth = targetCell.width || (targetCell.cellScale ? targetCell.cellScale * 100 : 80);
        const cellHeight = targetCell.height || (targetCell.cellScale ? targetCell.cellScale * 100 : 80);

        console.log('💀 Клетка найдена:', { x: targetCell.x, y: targetCell.y, width: cellWidth, height: cellHeight, cellScale: targetCell.cellScale });

        const centerX = targetCell.x + cellWidth / 2;
        // КЛЮЧЕВОЕ ОТЛИЧИЕ: пузырь появляется НАД головой (выше центра клетки)
        const centerY = targetCell.y + cellHeight * 0.2; // 20% от верха клетки

        // Загружаем текстуру спрайтшита
        const epidemicTexturePath = 'images/spells/poison/epidemic/epidemic_spritesheet.png';

        console.log('💀 Загружаем текстуру:', epidemicTexturePath);

        PIXI.Assets.load(epidemicTexturePath).then(texture => {
            console.log('💀 Текстура загружена:', { valid: texture?.valid, width: texture?.width, height: texture?.height });

            if (!texture || !texture.valid) {
                console.warn('💀 Не удалось загрузить текстуру эпидемии, используем fallback');
                createFallbackBubble();
                return;
            }
            
            // Создаём кадры из спрайтшита 3×3 (768×768)
            const frameWidth = 256; // 768 / 3
            const frameHeight = 256; // 768 / 3
            const frames = [];
            
            // Порядок кадров: слева направо, сверху вниз (1-9)
            // [1,2,3] ← row 0
            // [4,5,6] ← row 1  
            // [7,8,9] ← row 2
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const frame = new PIXI.Rectangle(
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight
                    );
                    frames.push(new PIXI.Texture(texture.baseTexture, frame));
                }
            }
            
            // Создаём анимированный спрайт
            const bubbleSprite = new PIXI.AnimatedSprite(frames);
            bubbleSprite.x = centerX;
            bubbleSprite.y = centerY;
            bubbleSprite.anchor.set(0.5);
            
            // Масштабируем пузырь
            // Обычный пузырь - 70% клетки, МЕГА взрыв (5 lvl) - 120% клетки
            const sizeMultiplier = isMegaExplosion ? 1.2 : 0.7;
            const targetSize = Math.min(cellWidth, cellHeight) * sizeMultiplier;
            const scale = targetSize / frameWidth;
            bubbleSprite.scale.set(scale);
            
            // Настройки анимации
            // МЕГА взрыв идёт медленнее для драматизма
            bubbleSprite.animationSpeed = isMegaExplosion ? 0.12 : 0.15; // ~80-100ms на кадр
            bubbleSprite.loop = false; // Один раз
            
            // Для МЕГА взрыва добавляем дополнительные визуальные эффекты
            if (isMegaExplosion) {
                // Зелёное свечение вокруг
                const glow = new PIXI.Graphics();
                glow.beginFill(0x33FF33, 0.3);
                glow.drawCircle(0, 0, targetSize * 0.8);
                glow.endFill();
                glow.x = centerX;
                glow.y = centerY;
                
                effectsContainer.addChild(glow);
                
                // Анимация пульсации свечения
                const startTime = Date.now();
                const glowAnimate = () => {
                    const elapsed = Date.now() - startTime;
                    const pulse = 1 + Math.sin(elapsed * 0.01) * 0.2;
                    glow.scale.set(pulse);
                    glow.alpha = 0.3 + Math.sin(elapsed * 0.008) * 0.15;
                    
                    if (glow.parent && bubbleSprite.parent) {
                        requestAnimationFrame(glowAnimate);
                    } else {
                        if (glow.parent) {
                            effectsContainer.removeChild(glow);
                        }
                    }
                };
                glowAnimate();
                activeBubbles.push(glow);
            }
            
            effectsContainer.addChild(bubbleSprite);

            console.log('💀 Спрайт добавлен в контейнер:', { x: bubbleSprite.x, y: bubbleSprite.y, scale: scale, frames: frames.length });

            // Событие окончания анимации
            bubbleSprite.onComplete = () => {
                console.log('💀 Анимация пузыря завершена');
                // Короткая задержка перед исчезновением
                setTimeout(() => {
                    if (bubbleSprite.parent) {
                        effectsContainer.removeChild(bubbleSprite);
                        bubbleSprite.destroy();
                    }
                    if (onComplete) onComplete();
                }, isMegaExplosion ? 300 : 150); // МЕГА взрыв держится дольше
            };

            bubbleSprite.play();
            console.log('💀 Анимация пузыря запущена');
            activeBubbles.push(bubbleSprite);
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры эпидемии:', err);
            createFallbackBubble();
        });
        
        // Fallback - простая графика пузыря
        function createFallbackBubble() {
            const bubble = new PIXI.Graphics();
            
            const bubbleRadius = targetCell.width * (isMegaExplosion ? 0.6 : 0.35);
            
            // Внешний контур пузыря
            bubble.lineStyle(3, 0x33FF33, 0.8);
            bubble.beginFill(0x44FF44, 0.3);
            bubble.drawCircle(0, 0, bubbleRadius);
            bubble.endFill();
            
            // Внутренний блик
            bubble.beginFill(0x88FF88, 0.5);
            bubble.drawCircle(-bubbleRadius * 0.3, -bubbleRadius * 0.3, bubbleRadius * 0.3);
            bubble.endFill();
            
            bubble.x = centerX;
            bubble.y = centerY;
            bubble.scale.set(0);
            
            effectsContainer.addChild(bubble);
            
            // Анимация: появление (надувание) → взрыв
            const startTime = Date.now();
            const inflateDuration = 400; // Надувание
            const holdDuration = 100; // Удержание
            const explodeDuration = 200; // Взрыв
            const totalDuration = inflateDuration + holdDuration + explodeDuration;
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(bubbleSprite)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / totalDuration, 1);

                if (elapsed < inflateDuration) {
                    // Фаза надувания (0 → 1)
                    const inflateProgress = elapsed / inflateDuration;
                    const easeInflate = 1 - Math.pow(1 - inflateProgress, 3); // ease-out cubic
                    bubble.scale.set(easeInflate);
                    bubble.alpha = 0.8;
                    
                } else if (elapsed < inflateDuration + holdDuration) {
                    // Фаза удержания
                    bubble.scale.set(1);
                    bubble.alpha = 0.9;
                    
                    // Лёгкое дрожание перед взрывом
                    const tremor = Math.sin(elapsed * 0.05) * 0.02;
                    bubble.scale.set(1 + tremor);
                    
                } else {
                    // Фаза взрыва (1 → 1.5 с исчезновением)
                    const explodeProgress = (elapsed - inflateDuration - holdDuration) / explodeDuration;
                    const explodeScale = 1 + explodeProgress * 0.5;
                    bubble.scale.set(explodeScale);
                    bubble.alpha = 0.9 * (1 - explodeProgress);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (bubble.parent) {
                        effectsContainer.removeChild(bubble);
                    }
                    if (onComplete) onComplete();
                }
            };
            
            animate();
            activeBubbles.push(bubble);
        }
    }
    
    // Массовое применение на всех врагов
    function playMassEpidemic(enemyPositions, megaExplosionTarget = null) {
        console.log('💀 playMassEpidemic ВЫЗВАНА, целей:', enemyPositions.length);

        let completedCount = 0;
        const totalTargets = enemyPositions.length;

        enemyPositions.forEach((pos, index) => {
            // Задержка между пузырями для волнового эффекта
            setTimeout(() => {
                const isMega = megaExplosionTarget && 
                               pos.col === megaExplosionTarget.col && 
                               pos.row === megaExplosionTarget.row;
                
                playEpidemicAnimation({
                    targetCol: pos.col,
                    targetRow: pos.row,
                    isMegaExplosion: isMega,
                    onComplete: () => {
                        completedCount++;
                        if (completedCount === totalTargets && pos.onAllComplete) {
                            pos.onAllComplete();
                        }
                    }
                });
            }, index * 150); // 150ms задержка между целями
        });
    }
    
    // Очистка всех пузырей
    function clearAll() {
        activeBubbles.forEach(bubble => {
            if (bubble && bubble.parent) {
                bubble.parent.removeChild(bubble);
                if (bubble.destroy) bubble.destroy();
            }
        });
        activeBubbles.length = 0;
        console.log('💀 Все пузыри эпидемии очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.epidemic = {
        play: playEpidemicAnimation,
        playMass: playMassEpidemic,
        clearAll: clearAll
    };
    
    console.log('💀 Анимация "Эпидемия" зарегистрирована');
})();