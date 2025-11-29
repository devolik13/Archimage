// battle/renderer/animations/wind/storm-cloud.js - Анимация заклинания "Грозовая туча"
console.log('✅ storm-cloud.js загружен');

(function() {
    function playStormCloudAnimation(params) {
        const { casterType, strikeCount, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Грозовая туча');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать Грозовую тучу - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Определяем территорию противника (3 колонки)
        const targetColumns = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
        
        // Загружаем спрайт-лист молний
        const lightningTexturePath = 'images/spells/wind/storm_cloud/lightning_spritesheet.png';
        
        PIXI.Assets.load(lightningTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру молний');
                createFallbackLightning(targetColumns, strikeCount, effectsContainer, gridCells, onComplete);
                return;
            }
            
            // Спрайт-лист 768x768, 5 колонок × 2 ряда = 10 кадров
            const frameWidth = 768 / 5;  // 153.6px
            const frameHeight = 768 / 2; // 384px
            const cols = 5;
            const rows = 2;
            const totalFrames = 10;
            
            // Создаем текстуры из спрайт-листа
            const lightningTextures = [];
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
                lightningTextures.push(frameTexture);
            }
            
            console.log(`⛈️ Загружено ${lightningTextures.length} кадров для молний`);
            
            // Создаем тучу над полем боя
            createStormCloud(targetColumns, effectsContainer, gridCells);
            
            // Запускаем удары молний с задержкой
            let strikesCompleted = 0;
            
            for (let i = 0; i < strikeCount; i++) {
                setTimeout(() => {
                    // Выбираем случайную клетку
                    const randomCol = targetColumns[Math.floor(Math.random() * targetColumns.length)];
                    const randomRow = Math.floor(Math.random() * 5);
                    
                    const targetCell = gridCells[randomCol]?.[randomRow];
                    if (!targetCell) return;
                    
                    // Создаем молнию
                    const lightning = new PIXI.AnimatedSprite(lightningTextures);
                    const cellWidth = targetCell.cellWidth || targetCell.width || 60;
                    const cellHeight = targetCell.cellHeight || targetCell.height || 60;
                    lightning.x = targetCell.x + cellWidth / 2;
                    lightning.y = targetCell.y - cellHeight; // Сверху
                    lightning.anchor.set(0.5, 0);

                    // Масштабируем - молния должна быть высокой и видимой
                    const targetHeight = cellHeight * 4; // Увеличено для видимости
                    const scale = Math.max(targetHeight / frameHeight, 0.6); // Минимум 0.6
                    lightning.scale.set(scale);

                    lightning.animationSpeed = 0.25; // Замедлено для видимости
                    lightning.loop = false;
                    lightning.tint = 0xCCFFFF;
                    lightning.blendMode = PIXI.BLEND_MODES.ADD;
                    
                    lightning.onComplete = () => {
                        if (lightning.parent) {
                            effectsContainer.removeChild(lightning);
                            lightning.destroy();
                        }
                        
                        strikesCompleted++;
                        if (strikesCompleted === strikeCount && onComplete) {
                            onComplete();
                        }
                    };
                    
                    effectsContainer.addChild(lightning);
                    lightning.play();
                    
                    // Вспышка при ударе
                    createLightningFlash(targetCell.x + cellWidth / 2, targetCell.y + cellHeight / 2, effectsContainer, scale);
                    
                    console.log(`⚡ Молния ${i + 1} ударила в клетку [${randomCol}][${randomRow}]`);
                    
                }, i * 200); // 200ms между ударами
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры молний:', err);
            createFallbackLightning(targetColumns, strikeCount, effectsContainer, gridCells, onComplete);
        });
    }
    
    // Создание тучи над полем
    function createStormCloud(targetColumns, container, gridCells) {
        const cloudContainer = new PIXI.Container();
        
        // Позиция тучи - над центром целевой территории
        const leftCol = targetColumns[0];
        const rightCol = targetColumns[targetColumns.length - 1];
        const topCell = gridCells[leftCol]?.[0];
        const bottomCell = gridCells[rightCol]?.[4];
        
        if (!topCell || !bottomCell) return;

        const bottomCellWidth = bottomCell.cellWidth || bottomCell.width || 60;
        const centerX = (topCell.x + bottomCell.x + bottomCellWidth) / 2;
        const centerY = topCell.y - 60; // Немного выше
        
        cloudContainer.x = centerX;
        cloudContainer.y = centerY;
        
        // Рисуем тучу (увеличенный размер)
        const cloud = new PIXI.Graphics();
        cloud.beginFill(0x333333, 0.8);

        // Несколько кругов для формы тучи - увеличенные размеры
        cloud.drawCircle(-60, 0, 40);
        cloud.drawCircle(-30, -15, 50);
        cloud.drawCircle(0, -8, 55);
        cloud.drawCircle(30, -15, 50);
        cloud.drawCircle(60, 0, 40);
        cloud.endFill();
        
        cloudContainer.addChild(cloud);
        container.addChild(cloudContainer);
        
        // Анимация тучи - покачивание
        let time = 0;
        const animate = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!cloudContainer || cloudContainer.destroyed || !cloudContainer.transform || !cloudContainer.parent) {
                return;
            }

            time += 0.05;
            cloudContainer.y = centerY + Math.sin(time) * 3;
            cloudContainer.alpha = 0.8 + Math.sin(time * 2) * 0.2; // Мерцание

            requestAnimationFrame(animate);
        };
        animate();
        
        // Удаляем тучу через 5 секунд
        setTimeout(() => {
            if (cloudContainer.parent) {
                container.removeChild(cloudContainer);
                cloudContainer.destroy({ children: true });
            }
        }, 5000);
    }
    
    // Вспышка при ударе молнии
    function createLightningFlash(x, y, container, scale) {
        const flash = new PIXI.Graphics();
        flash.beginFill(0xFFFFFF, 0.8);
        flash.drawCircle(0, 0, 30 * scale);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        flash.blendMode = PIXI.BLEND_MODES.ADD;
        
        container.addChild(flash);
        
        const startTime = Date.now();
        const duration = 150;
        
        const animate = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!flash || flash.destroyed || !flash.transform) {
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            flash.alpha = 0.8 * (1 - progress);
            flash.scale.set(1 + progress * 2);

            if (progress < 1 && flash.parent) {
                requestAnimationFrame(animate);
            } else {
                if (flash.parent) {
                    container.removeChild(flash);
                }
            }
        };
        animate();
        
        // Искры
        createElectricSparks(x, y, scale, container);
    }
    
    // Электрические искры
    function createElectricSparks(x, y, scale, container, count = 6) {
        for (let i = 0; i < count; i++) {
            const spark = new PIXI.Graphics();
            spark.lineStyle(2, 0xCCFFFF, 1);
            
            // Зигзагообразная молния
            let px = 0, py = 0;
            for (let j = 0; j < 3; j++) {
                const nx = px + (Math.random() - 0.5) * 10 * scale;
                const ny = py + (Math.random() - 0.5) * 10 * scale;
                spark.moveTo(px, py);
                spark.lineTo(nx, ny);
                px = nx;
                py = ny;
            }
            
            spark.x = x;
            spark.y = y;
            
            container.addChild(spark);
            
            const startTime = Date.now();
            const duration = 300;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                spark.alpha = 1 - progress;
                
                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animate);
                } else {
                    if (spark.parent) {
                        container.removeChild(spark);
                    }
                }
            };
            animate();
        }
    }
    
    // Fallback - простая анимация
    function createFallbackLightning(targetColumns, strikeCount, container, gridCells, onComplete) {
        let strikesCompleted = 0;
        
        for (let i = 0; i < strikeCount; i++) {
            setTimeout(() => {
                const randomCol = targetColumns[Math.floor(Math.random() * targetColumns.length)];
                const randomRow = Math.floor(Math.random() * 5);
                
                const targetCell = gridCells[randomCol]?.[randomRow];
                if (!targetCell) {
                    strikesCompleted++;
                    if (strikesCompleted === strikeCount && onComplete) onComplete();
                    return;
                }
                
                // Простая молния
                const lightning = new PIXI.Graphics();
                lightning.lineStyle(4, 0xCCFFFF, 1);
                
                const startX = targetCell.x + targetCell.width / 2;
                const startY = targetCell.y - targetCell.height;
                const endX = startX;
                const endY = targetCell.y + targetCell.height / 2;
                
                lightning.moveTo(startX, startY);
                
                // Зигзаг
                let currentY = startY;
                while (currentY < endY) {
                    const nextX = startX + (Math.random() - 0.5) * 20;
                    const nextY = currentY + 15;
                    lightning.lineTo(nextX, nextY);
                    currentY = nextY;
                }
                
                lightning.blendMode = PIXI.BLEND_MODES.ADD;
                container.addChild(lightning);
                
                setTimeout(() => {
                    if (lightning.parent) {
                        container.removeChild(lightning);
                    }
                    
                    strikesCompleted++;
                    if (strikesCompleted === strikeCount && onComplete) {
                        onComplete();
                    }
                }, 200);
                
                createLightningFlash(endX, endY, container, 1);
                
            }, i * 200);
        }
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.storm_cloud = {
        play: playStormCloudAnimation
    };
    
    console.log('⛈️ Анимация "Грозовая туча" зарегистрирована');
})();