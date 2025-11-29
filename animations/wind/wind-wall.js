// battle/renderer/animations/wind/wind-wall.js - Анимация заклинания "Стена ветра"
console.log('✅ wind-wall.js загружен');

(function() {
    // Хранилище активных ветряных стен
    let activeWindWallZones = [];
    
    function playWindWallAnimation(params) {
        const { casterType, positions, weakenPercent, level } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Стена ветра');
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать ветряную стену - нет контейнера или сетки');
            return;
        }
        
        
        activeWindWallZones = activeWindWallZones.filter(zone => {
    	    if (zone.casterType === casterType) {
    	        // Удаляем спрайт старой стены
    	        if (zone.sprite && zone.sprite.parent) {
    	            zone.sprite.parent.removeChild(zone.sprite);
    	            zone.sprite.destroy({ children: true });
    	        }
    	        console.log(`💨 Удалена старая стена ${zone.casterType} с позиции ${zone.column}_${zone.row}`);
    	        return false; // Удаляем из массива
    	    }
    	    return true; // Оставляем стены другого casterType
    	});

    	const targetColumn = casterType === 'player' ? 3 : 2;
        
        // Загружаем текстуру спрайт-листа
        const windWallTexturePath = 'images/spells/wind/wind_wall/wind_wall_spritesheet.png';
        
        PIXI.Assets.load(windWallTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру ветряной стены');
                createFallbackWindWall(targetColumn, positions, effectsContainer, gridCells, casterType, weakenPercent, level);
                return;
            }
            
            // Спрайт-лист 768x768, 5 колонок × 2 ряда = 10 кадров
            // Размер каждого кадра: 768/5 = 153.6 (ширина), 768/2 = 384 (высота)
            const frameWidth = 768 / 5;  // 153.6
            const frameHeight = 768 / 2; // 384
            const cols = 5;
            const rows = 2;
            const totalFrames = 10;
            
            // Создаем текстуры из спрайт-листа
            const windTextures = [];
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
                windTextures.push(frameTexture);
            }
            
            console.log(`💨 Загружено ${windTextures.length} кадров для ветряной стены`);
            
            // Создаем стену для каждой позиции
            positions.forEach(row => {
                const cellData = gridCells[targetColumn]?.[row];
                if (!cellData) {
                    console.warn(`Нет данных ячейки для позиции ${targetColumn}_${row}`);
                    return;
                }
                
                // Создаем анимированный спрайт ветра
                const windSprite = new PIXI.AnimatedSprite(windTextures);
                // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
                const cellWidth = cellData.cellWidth || cellData.width || 60;
                const cellHeight = cellData.cellHeight || cellData.height || 60;
                windSprite.x = cellData.x + cellWidth / 2;
                windSprite.y = cellData.y + cellHeight / 2;
                windSprite.anchor.set(0.5);

                // Масштабируем с учетом размера ячейки
                // Высота кадра 384px, ширина 153.6px
                const targetHeight = cellHeight * 2.5; // Выше ячейки для видимости
                const scale = Math.max(targetHeight / frameHeight, 0.5);
                windSprite.scale.set(scale);

                windSprite.animationSpeed = 0.1; // Плавная анимация ветра
                windSprite.loop = true;
                windSprite.alpha = 0.7; // Полупрозрачность для ветра
                windSprite.play();
                
                // Эффект свечения для ветра
                windSprite.blendMode = PIXI.BLEND_MODES.NORMAL;
                windSprite.tint = 0xCCFFFF; // Голубоватый оттенок
                
                effectsContainer.addChild(windSprite);
                
                // Сохраняем информацию о зоне
                activeWindWallZones.push({
                    sprite: windSprite,
                    casterType: casterType,
                    row: row,
                    column: targetColumn,
                    weakenPercent: weakenPercent,
                    level: level
                });
                
                console.log(`💨 Ветряная стена создана на позиции ${targetColumn}_${row}`);
            });
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры ветряной стены:', err);
            createFallbackWindWall(targetColumn, positions, effectsContainer, gridCells, casterType, weakenPercent, level);
        });
    }
    
    // Fallback - простая анимация если текстура не загрузилась
    function createFallbackWindWall(targetColumn, positions, effectsContainer, gridCells, casterType, weakenPercent, level) {
        positions.forEach(row => {
            const cellData = gridCells[targetColumn]?.[row];
            if (!cellData) return;

            const cellWidth = cellData.cellWidth || cellData.width || 60;
            const cellHeight = cellData.cellHeight || cellData.height || 60;
            const container = new PIXI.Container();
            container.x = cellData.x + cellWidth / 2;
            container.y = cellData.y + cellHeight / 2;

            // Рисуем волнистые линии ветра
            const windLines = new PIXI.Graphics();
            const lineCount = 5;
            const lineHeight = cellHeight / lineCount;

            for (let i = 0; i < lineCount; i++) {
                windLines.lineStyle(2, 0xCCFFFF, 0.6);
                const y = -cellHeight / 2 + i * lineHeight;

                // Волнистая линия
                windLines.moveTo(-cellWidth / 2, y);
                for (let x = -cellWidth / 2; x < cellWidth / 2; x += 5) {
                    const waveY = y + Math.sin(x * 0.1) * 3;
                    windLines.lineTo(x, waveY);
                }
            }
            
            container.addChild(windLines);
            effectsContainer.addChild(container);
            
            // Анимация волн
            let time = 0;
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(windLines) || !container.parent) return;

                time += 0.1;
                windLines.clear();
                
                for (let i = 0; i < lineCount; i++) {
                    windLines.lineStyle(2, 0xCCFFFF, 0.5 + Math.sin(time + i) * 0.2);
                    const y = -cellHeight / 2 + i * lineHeight;

                    windLines.moveTo(-cellWidth / 2, y);
                    for (let x = -cellWidth / 2; x < cellWidth / 2; x += 5) {
                        const waveY = y + Math.sin(x * 0.1 + time) * 3;
                        windLines.lineTo(x, waveY);
                    }
                }
                
                requestAnimationFrame(animate);
            };
            animate();
            
            activeWindWallZones.push({
                sprite: container,
                casterType: casterType,
                row: row,
                column: targetColumn,
                weakenPercent: weakenPercent,
                level: level
            });
            
            console.log(`💨 Fallback ветряная стена создана на позиции ${targetColumn}_${row}`);
        });
    }
    
    // Обновление активных стен
    function updateWindWalls() {
        if (!window.activeWalls) return;
        
        // Удаляем визуальные стены, которых больше нет в игровой логике
        activeWindWallZones = activeWindWallZones.filter(zone => {
            // Ищем соответствующую игровую стену
            const gameWall = window.activeWalls?.find(w => 
                w.type === 'wind_wall' && 
                w.casterType === zone.casterType &&
                w.positions?.includes(zone.row)
            );
            
            if (!gameWall) {
                // Удаляем спрайт
                if (zone.sprite && zone.sprite.parent) {
                    zone.sprite.parent.removeChild(zone.sprite);
                    zone.sprite.destroy({ children: true });
                }
                console.log(`💨 Ветряная стена удалена с позиции ${zone.column}_${zone.row}`);
                return false;
            }
            
            return true;
        });
    }
    
    // Очистка всех стен
    function clearWindWalls() {
        activeWindWallZones.forEach(zone => {
            if (zone.sprite && zone.sprite.parent) {
                zone.sprite.parent.removeChild(zone.sprite);
                zone.sprite.destroy({ children: true });
            }
        });
        activeWindWallZones = [];
        console.log('💨 Все ветряные стены очищены');
    }
    
    // Показать эффект ослабления урона
    function showWindWallWeaken(targetX, targetY, scale = 1) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Создаем эффект "отражения" урона
        const deflectEffect = new PIXI.Graphics();
        deflectEffect.lineStyle(3, 0xCCFFFF, 0.8);
        deflectEffect.arc(0, 0, 20 * scale, 0, Math.PI * 2);
        deflectEffect.x = targetX;
        deflectEffect.y = targetY;
        
        effectsContainer.addChild(deflectEffect);
        
        // Анимация расширения и исчезновения
        const startTime = Date.now();
        const duration = 400;
        const initialScale = scale;
        
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(deflectEffect)) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            deflectEffect.scale.set(initialScale * (1 + progress * 2));
            deflectEffect.alpha = 1 - progress;

            if (progress < 1 && deflectEffect.parent) {
                requestAnimationFrame(animate);
            } else {
                if (deflectEffect.parent) {
                    effectsContainer.removeChild(deflectEffect);
                }
            }
        };
        animate();
        
        // Добавляем частицы ветра
        createWindParticles(targetX, targetY, scale);
    }
    
    // Создание частиц ветра
    function createWindParticles(x, y, scale, count = 6) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xCCFFFF, 0.8);
            particle.drawCircle(0, 0, 2 * scale);
            particle.endFill();
            particle.x = x;
            particle.y = y;
            
            effectsContainer.addChild(particle);
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 3 + Math.random();
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const startTime = Date.now();
            const duration = 500;
            
            const animateParticle = () => {
                if (!window.pixiAnimUtils.isValid(particle)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                particle.x += vx;
                particle.y += vy - progress; // Немного вверх
                particle.alpha = 1 - progress;
                particle.scale.set((1 - progress) * scale);

                if (progress < 1 && particle.parent) {
                    requestAnimationFrame(animateParticle);
                } else {
                    if (particle.parent) {
                        effectsContainer.removeChild(particle);
                    }
                }
            };
            animateParticle();
        }
    }
    
    // Регистрация модуля
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.wind_wall = {
        play: playWindWallAnimation,
        update: updateWindWalls,
        clear: clearWindWalls,
        showWeaken: showWindWallWeaken
    };
    
    // Экспорт для совместимости
    window.updateWindWalls = updateWindWalls;
    window.clearWindWalls = clearWindWalls;
    window.showWindWallWeaken = showWindWallWeaken;
    
    console.log('💨 Анимация "Стена ветра" зарегистрирована');
})();