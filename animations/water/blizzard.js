// battle/renderer/animations/water/blizzard.js - Анимация заклинания "Снежная буря"

(function() {
    // Хранилище активных зон метели
    let activeBlizzardZones = [];
    
    function playBlizzardAnimation(params) {
        const { casterType, centerRow, radius, level } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Снежная буря');
            return;
        }

	activeBlizzardZones = activeBlizzardZones.filter(zone => {
            if (zone.casterType === casterType) {
            	if (zone.sprite && zone.sprite.parent) {
            	    zone.sprite.parent.removeChild(zone.sprite);
            	    zone.sprite.destroy();
            	}
            	console.log('❄️ Удалена предыдущая метель кастера');
            	return false;
            }
            return true;
    	});
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать снежную бурю - нет контейнера');
            return;
        }
        
        // Определяем колонку врага
        const targetColumn = casterType === 'player' ? 0 : 5;
        
        // Определяем затронутые ряды
        const affectedRows = [];
        if (radius === 1) {
            affectedRows.push((centerRow - 1 + 5) % 5);
            affectedRows.push(centerRow);
            affectedRows.push((centerRow + 1) % 5);
        } else {
            for (let i = 0; i < 5; i++) affectedRows.push(i);
        }
        
        // Загружаем спрайт-лист метели
        const blizzardTexturePath = 'images/spells/water/blizzard/blizzard_sprite.png';
        
        PIXI.Assets.load(blizzardTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackBlizzard();
                return;
            }
            
            // 768×768, 3 колонки × 3 ряда = 9 кадров
            const frameWidth = 768 / 3;  // 256px
            const frameHeight = 768 / 3; // 256px
            const totalFrames = 9;
            
            const blizzardTextures = [];
            for (let i = 0; i < totalFrames; i++) {
                const col = i % 3;
                const row = Math.floor(i / 3);
                
                const rect = new PIXI.Rectangle(
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                
                blizzardTextures.push(new PIXI.Texture(texture.baseTexture, rect));
            }
            
            console.log(`❄️ Загружено ${blizzardTextures.length} кадров для метели`);
            
            // Создаем метель для каждой позиции
            affectedRows.forEach(row => {
                const cellData = gridCells[targetColumn]?.[row];
                if (!cellData) return;

                // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
                const cellWidth = cellData.cellWidth || cellData.width || 60;
                const cellHeight = cellData.cellHeight || cellData.height || 60;

                // Анимированный спрайт метели
                const blizzardSprite = new PIXI.AnimatedSprite(blizzardTextures);
                blizzardSprite.x = cellData.x + cellWidth / 2;
                blizzardSprite.y = cellData.y + cellHeight / 2;
                blizzardSprite.anchor.set(0.5);

                // Масштабируем под размер клетки
                const scale = (cellWidth * 1.5) / frameWidth;
                blizzardSprite.scale.set(scale);
                
                blizzardSprite.animationSpeed = 0.15;
                blizzardSprite.loop = true;
                blizzardSprite.play();
                
                // Эффекты
                blizzardSprite.blendMode = PIXI.BLEND_MODES.SCREEN;
                blizzardSprite.alpha = 0.5;
                blizzardSprite.tint = 0xCCEEFF; // Холодный голубоватый оттенок
                
                effectsContainer.addChild(blizzardSprite);
                
                // Добавляем падающий снег
                createSnowParticles(cellData, effectsContainer);
                
                // Сохраняем зону
                activeBlizzardZones.push({
                    sprite: blizzardSprite,
                    particles: [],
                    casterType: casterType,
                    row: row,
                    column: targetColumn,
                    level: level
                });
                
                console.log(`❄️ Метель создана на позиции ${targetColumn}_${row}`);
            });
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры метели:', err);
            createFallbackBlizzard();
        });
        
        // Fallback без текстур
        function createFallbackBlizzard() {
            affectedRows.forEach(row => {
                const cellData = gridCells[targetColumn]?.[row];
                if (!cellData) return;

                // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
                const cellWidth = cellData.cellWidth || cellData.width || 60;
                const cellHeight = cellData.cellHeight || cellData.height || 60;

                // Создаем туман
                const fog = new PIXI.Graphics();
                fog.beginFill(0xDDEEFF, 0.3);
                fog.drawCircle(0, 0, cellWidth * 0.7);
                fog.endFill();
                fog.x = cellData.x + cellWidth / 2;
                fog.y = cellData.y + cellHeight / 2;
                fog.blendMode = PIXI.BLEND_MODES.ADD;
                
                effectsContainer.addChild(fog);
                
                // Анимация тумана
                const startTime = Date.now();
                const animateFog = () => {
                    if (!window.pixiAnimUtils.isValid(fog)) return;

                    const elapsed = Date.now() - startTime;
                    const pulse = Math.sin(elapsed * 0.002) * 0.2;
                    fog.scale.set(1 + pulse);
                    fog.alpha = 0.3 + pulse * 0.5;

                    if (fog.parent) {
                        requestAnimationFrame(animateFog);
                    }
                };
                animateFog();
                
                // Падающий снег
                createSnowParticles(cellData, effectsContainer);
                
                activeBlizzardZones.push({
                    sprite: fog,
                    casterType: casterType,
                    row: row,
                    column: targetColumn,
                    level: level
                });
            });
        }
    }
    
    // Создание частиц снега
    function createSnowParticles(cellData, container) {
        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
        const cellWidth = cellData.cellWidth || cellData.width || 60;
        const cellHeight = cellData.cellHeight || cellData.height || 60;
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const snowflake = new PIXI.Graphics();
                snowflake.beginFill(0xFFFFFF, 0.8);
                snowflake.drawCircle(0, 0, 2);
                snowflake.endFill();

                snowflake.x = cellData.x + Math.random() * cellWidth;
                snowflake.y = cellData.y - 20;

                container.addChild(snowflake);

                const speed = 0.5 + Math.random() * 1;
                const drift = (Math.random() - 0.5) * 0.5;

                const animateSnow = () => {
                    if (!window.pixiAnimUtils.isValid(snowflake)) {
                        if (snowflake && snowflake.parent) {
                            try {
                                container.removeChild(snowflake);
                            } catch (e) {}
                        }
                        return;
                    }

                    snowflake.y += speed;
                    snowflake.x += drift;
                    snowflake.alpha = 0.8 - (snowflake.y - cellData.y) / cellHeight;

                    if (snowflake.y < cellData.y + cellHeight) {
                        requestAnimationFrame(animateSnow);
                    } else {
                        // Достигли дна - удаляем
                        if (snowflake.parent) {
                            try {
                                container.removeChild(snowflake);
                            } catch (e) {
                                // Игнорируем ошибку
                            }
                        }
                    }
                };
                animateSnow();
            }, Math.random() * 2000);
        }
    }
    
    // Обновление зон (удаление неактивных)
    function updateBlizzardZones() {
        if (!window.activeEffectZones) return;
        
        activeBlizzardZones = activeBlizzardZones.filter(zone => {
            const gameZone = window.activeEffectZones?.find(ez => 
                ez.type === 'blizzard_zone' && 
                ez.casterType === zone.casterType &&
                ez.rows?.includes(zone.row) &&
                ez.isActive
            );
            
            if (!gameZone) {
                if (zone.sprite && zone.sprite.parent) {
                    zone.sprite.parent.removeChild(zone.sprite);
                    zone.sprite.destroy();
                }
                console.log(`❄️ Метель удалена с позиции ${zone.column}_${zone.row}`);
                return false;
            }
            
            return true;
        });
    }
    
    // Очистка всех зон
    function clearAll() {
        activeBlizzardZones.forEach(zone => {
            if (zone.sprite && zone.sprite.parent) {
                zone.sprite.parent.removeChild(zone.sprite);
                zone.sprite.destroy();
            }
        });
        activeBlizzardZones = [];
        console.log('❄️ Все метели очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.blizzard = {
        play: playBlizzardAnimation,
        update: updateBlizzardZones,
        clearAll: clearAll
    };
    
    console.log('❄️ Анимация "Снежная буря" зарегистрирована');
})();