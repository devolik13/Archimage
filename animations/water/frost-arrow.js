// battle/renderer/animations/water/frost-arrow.js - Анимация заклинания "Ледяная стрела"

(function() {
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (вынесены на уровень модуля) =====
    
    // Создание эффекта взрыва (теперь принимает container как параметр)
    function createFrostImpact(x, y, scale, container) {
        // Загружаем спрайт-лист взрыва
        const explosionTexturePath = 'images/spells/water/frost_arrow/frost_explosion_sprite.png';
        
        PIXI.Assets.load(explosionTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру взрыва Ледяной стрелы');
                createFallbackExplosion(x, y, scale, container);
                return;
            }
            
            // Спрайт-лист 768x768, 3 колонки × 3 ряда = 9 кадров
            const frameWidth = 768 / 3;  // 256px
            const frameHeight = 768 / 3; // 256px
            const cols = 3;
            const rows = 3;
            const totalFrames = 9;
            
            // Создаем текстуры из спрайт-листа
            const explosionTextures = [];
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
                explosionTextures.push(frameTexture);
            }
            
            console.log(`❄️ Загружено ${explosionTextures.length} кадров для взрыва`);
            
            // Создаем анимированный спрайт взрыва
            const explosion = new PIXI.AnimatedSprite(explosionTextures);
            explosion.x = x;
            explosion.y = y;
            explosion.anchor.set(0.5);
            
            // Масштабируем
            const targetSize = scale * 60; // Размер взрыва
            const spriteScale = targetSize / frameHeight;
            explosion.scale.set(spriteScale);
            
            explosion.animationSpeed = 0.4;
            explosion.loop = false;
            
            // Когда анимация закончится - удаляем
            explosion.onComplete = () => {
                if (explosion.parent) {
                    container.removeChild(explosion);
                    explosion.destroy();
                }
            };
            
            container.addChild(explosion);
            explosion.play();
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры взрыва:', err);
            createFallbackExplosion(x, y, scale, container);
        });
    }
    
    // Fallback - простая графика если текстура не загрузилась
    function createFallbackExplosion(x, y, scale, container) {
        // Создаем ледяные осколки
        for (let i = 0; i < 12; i++) {
            const shard = new PIXI.Graphics();
            shard.beginFill(0x4d96ff, 0.8); // Голубой
            shard.moveTo(0, 0);
            shard.lineTo(2, -8);
            shard.lineTo(4, 0);
            shard.lineTo(0, 0);
            shard.endFill();
            
            shard.x = x;
            shard.y = y;
            
            container.addChild(shard);
            
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const particleStartTime = Date.now();
            const particleDuration = 500;
            
            const animateShard = () => {
                if (!window.pixiAnimUtils.isValid(shard)) return;
                
                const elapsed = Date.now() - particleStartTime;
                const progress = Math.min(elapsed / particleDuration, 1);
                
                shard.x += vx * (1 - progress);
                shard.y += vy * (1 - progress) + progress * 3;
                shard.alpha = 0.8 * (1 - progress);
                shard.rotation += 0.2;
                
                if (progress < 1 && shard.parent) {
                    requestAnimationFrame(animateShard);
                } else {
                    if (shard.parent) {
                        container.removeChild(shard);
                        shard.destroy();
                    }
                }
            };
            
            animateShard();
        }
        
        // Ледяная вспышка
        const flash = new PIXI.Graphics();
        flash.beginFill(0xa8d8ff, 0.5);
        flash.drawCircle(0, 0, 35 * scale);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        flash.blendMode = PIXI.BLEND_MODES.ADD;
        
        container.addChild(flash);
        
        const flashStartTime = Date.now();
        const flashDuration = 250;
        
        const animateFlash = () => {
            if (!window.pixiAnimUtils.isValid(flash)) return;
            
            const elapsed = Date.now() - flashStartTime;
            const progress = Math.min(elapsed / flashDuration, 1);
            
            flash.scale.set(1 + progress * 0.5);
            flash.alpha = 0.5 * (1 - progress);
            
            if (progress < 1 && flash.parent) {
                requestAnimationFrame(animateFlash);
            } else {
                if (flash.parent) {
                    container.removeChild(flash);
                    flash.destroy();
                }
            }
        };
        
        animateFlash();
    }
    
    // ===== ОСНОВНАЯ АНИМАЦИЯ =====
    
    function playFrostArrowAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onHit } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации FrostArrow');
            if (onHit) onHit();
            return;
        }

        // Получаем необходимые объекты из ядра
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать ледяную стрелу - нет контейнера или сетки');
            if (onHit) onHit();
            return;
        }
        
        const startCell = gridCells[casterCol]?.[casterRow];
        const endCell = gridCells[targetCol]?.[targetRow];
        
        if (!startCell || !endCell) {
            console.warn('Не могу создать ледяную стрелу - нет данных ячеек');
            if (onHit) onHit();
            return;
        }
        
        // Загружаем спрайтшит ледяной стрелы
        const baseTexture = PIXI.BaseTexture.from('images/spells/water/frost_arrow/frost_arrow_sprite.png');
        
        // Ждем загрузки текстуры чтобы узнать реальный размер
        if (!baseTexture.valid) {
            baseTexture.on('loaded', () => {
                createArrowSprite(baseTexture);
            });
            return;
        }
        
        createArrowSprite(baseTexture);
        
        function createArrowSprite(baseTexture) {
            console.log(`❄️ Создаю Frost Arrow из текстуры: ${baseTexture.width}x${baseTexture.height}`);
            
            // Создаем текстуры для каждого кадра (5 кадров в одной колонке по вертикали)
            const frames = [];
            const frameWidth = baseTexture.width;   // Ширина = вся ширина изображения (768)
            const frameHeight = Math.floor(baseTexture.height / 5); // Высота одного кадра (768 / 5 = 153.6)
            
            console.log(`❄️ Размер одного кадра: ${frameWidth}x${frameHeight}`);
            
            for (let i = 0; i < 5; i++) {
                const rect = new PIXI.Rectangle(
                    0,                    // x - всегда 0 (одна колонка)
                    i * frameHeight,      // y - смещение вниз
                    frameWidth,           // ширина
                    frameHeight           // высота
                );
                frames.push(new PIXI.Texture(baseTexture, rect));
            }
            
            continueAnimation(frames, frameWidth, frameHeight);
        }
        
        function continueAnimation(frames, frameWidth, frameHeight) {
            // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
            const startCellWidth = startCell.cellWidth || startCell.width || 60;
            const startCellHeight = startCell.cellHeight || startCell.height || 60;
            const endCellWidth = endCell.cellWidth || endCell.width || 60;
            const endCellHeight = endCell.cellHeight || endCell.height || 60;

            // Создаем анимированный спрайт
            const arrow = new PIXI.AnimatedSprite(frames);
            arrow.animationSpeed = 0.3; // Скорость анимации кадров
            arrow.loop = true;
            arrow.play();

            // Устанавливаем якорь в центр
            arrow.anchor.set(0.5);

            // Масштабируем под размер клетки (примерно)
            const targetScale = (startCellWidth * 0.8) / frameWidth;
            arrow.scale.set(targetScale);

            // Начальная позиция
            arrow.x = startCell.x + startCellWidth / 2;
            arrow.y = startCell.y + startCellHeight / 2;

            // Рассчитываем угол поворота к цели
            const targetX = endCell.x + endCellWidth / 2;
            const targetY = endCell.y + endCellHeight / 2;
            const angle = Math.atan2(targetY - arrow.y, targetX - arrow.x);
            arrow.rotation = angle;
            
            effectsContainer.addChild(arrow);
            
            // Параметры анимации полета
            const duration = 400;
            const startTime = Date.now();
            let animationFrame = null;
            let isDestroyed = false;
            
            // Функция анимации полета
            const animate = () => {
                // Проверка что объекты еще существуют
                if (isDestroyed || !window.pixiAnimUtils.isValid(arrow) || !effectsContainer) {
                    if (animationFrame) cancelAnimationFrame(animationFrame);
                    if (arrow && arrow.parent) {
                        try {
                            effectsContainer.removeChild(arrow);
                            arrow.destroy();
                        } catch (e) {
                            // Игнорируем если уже удален
                        }
                    }
                    if (onHit) onHit();
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Интерполяция позиции
                try {
                    arrow.x = startCell.x + startCellWidth / 2 +
                             (targetX - (startCell.x + startCellWidth / 2)) * progress;
                    arrow.y = startCell.y + startCellHeight / 2 +
                             (targetY - (startCell.y + startCellHeight / 2)) * progress;
                    
                    // Ледяной след (реже чем у искры)
                    if (Math.random() > 0.8) {
                        createFrostTrail(arrow.x, arrow.y);
                    }
                } catch (e) {
                    isDestroyed = true;
                    if (onHit) onHit();
                    return;
                }
                
                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    // Удаляем стрелу
                    if (arrow.parent && effectsContainer) {
                        try {
                            effectsContainer.removeChild(arrow);
                            arrow.destroy();
                        } catch (e) {
                            // Игнорируем если уже удален
                        }
                    }
                    
                    // Создаем взрыв в точке попадания (используя вынесенную функцию)
                    createFrostImpact(targetX, targetY, endCell.cellScale, effectsContainer);
                    
                    if (onHit) onHit();
                }
            };
            
            // Создание ледяного следа
            function createFrostTrail(x, y) {
                const trail = new PIXI.Graphics();
                trail.beginFill(0xa8d8ff, 0.6); // Светло-голубой
                trail.drawCircle(0, 0, 3);
                trail.endFill();
                
                // Добавляем белое свечение
                trail.beginFill(0xffffff, 0.3);
                trail.drawCircle(0, 0, 5);
                trail.endFill();
                
                trail.x = x;
                trail.y = y;
                
                effectsContainer.addChild(trail);
                
                // Исчезновение следа
                const fadeStartTime = Date.now();
                const fadeDuration = 400;
                
                const fadeAnimate = () => {
                    // ВАЖНО: проверяем что объект ещё существует
                    if (!trail || !trail.parent || !trail.transform) {
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
                            effectsContainer.removeChild(trail);
                            trail.destroy();
                        }
                    }
                };
                
                fadeAnimate();
            }
            
            // Запуск анимации
            animate();
        }
    }
    
    // ===== ПУБЛИЧНЫЙ МЕТОД ДЛЯ ВЗРЫВОВ В КОНКРЕТНОЙ ТОЧКЕ =====
    
    function createExplosionAt(col, row, casterType) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('❄️ Не могу создать взрыв - нет контейнера');
            return;
        }
        
        const cell = gridCells[col]?.[row];
        if (!cell) {
            console.warn(`❄️ Не найдена ячейка [${col}, ${row}]`);
            return;
        }
        
        const x = cell.x + cell.width / 2;
        const y = cell.y + cell.height / 2;
        
        console.log(`❄️ Создаём взрыв в точке [${col}, ${row}]`);
        
        // Используем вынесенную функцию
        createFrostImpact(x, y, cell.cellScale || 1, effectsContainer);
    }
    
    // ===== РЕГИСТРАЦИЯ =====
    
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.frost_arrow = {
        play: playFrostArrowAnimation,
        createExplosionAt: createExplosionAt  // ДОБАВЛЕНО!
    };
    
    console.log('❄️ Анимация "Ледяная стрела" зарегистрирована');
    
    // Обертка для совместимости со старым API
    window.createFrostArrowProjectile = function(params) {
        if (window.spellAnimations?.frost_arrow?.play) {
            window.spellAnimations.frost_arrow.play(params);
        } else {
            console.warn('⚠️ Анимация Ледяной стрелы недоступна');
            if (params.onHit) params.onHit();
        }
    };
    
    console.log('❄️ createFrostArrowProjectile обертка создана');
})();