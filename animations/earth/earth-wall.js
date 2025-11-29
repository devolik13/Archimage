// battle/renderer/animations/earth/earth-wall.js - Анимация заклинания "Земляная стена"
console.log('✅ earth-wall.js загружен');

(function() {
    // Хранилище активных стен
    const activeWallSprites = new Map(); // wallId -> sprites[]
    
    function playEarthWallAnimation(params) {
    	const { casterType, casterPosition, wallColumn, wallRows, wallHP, level, casterId } = params;

    	// КРИТИЧНО: При быстрой симуляции пропускаем анимацию
    	if (window.fastSimulation) {
    	    console.log('⚡ Быстрая симуляция: пропуск анимации Земляная стена');
    	    return;
    	}

	console.log('🧱 playEarthWallAnimation вызван с параметрами:', params);
    
    	const effectsContainer = window.pixiCore?.getEffectsContainer();
    	const gridCells = window.pixiCore?.getGridCells();

	console.log('🧱 Контейнер эффектов:', !!effectsContainer);
    	console.log('🧱 Сетка клеток:', !!gridCells);
    
    	if (!effectsContainer || !gridCells) {
    	    console.warn('Не могу создать земляную стену - нет контейнера');
    	    return;
    	}
    
    	// Формируем правильный ID стены
    	const wallId = casterId ? 
    	    `earth_wall_hp_${casterId}_${wallColumn}` : 
    	    `earth_wall_hp_${casterType}_${wallColumn}`;
    
    	// Проверяем, есть ли уже стена
    	if (activeWallSprites.has(wallId)) {
    	    // Усиливаем существующую стену
    	    reinforceWall(wallId, wallHP);
    	    return;
    	}
        
        // Загружаем текстуру стены
        const wallTexturePath = 'images/spells/earth/earth_wall/wall_sprite.png';
        
        PIXI.Assets.load(wallTexturePath).then(texture => {
	    console.log('🧱 Текстура загружена:', texture);
            console.log('🧱 Текстура валидна:', texture?.valid);
            console.log('🧱 Размер текстуры:', texture?.width, 'x', texture?.height);
        

    	    if (!texture || !texture.valid) {
		console.warn('🧱 Текстура невалидна, используем fallback');
	        createFallbackWall();
	        return;
	    }
    
	    // 768×768, 1 колонка × 5 рядов = 5 кадров
	    const frameWidth = texture.width;  // Должно быть 768
            const frameHeight = texture.height / 5;  // Должно быть 153.6
            const totalFrames = 5;
    
	    console.log('🧱 Размер кадра:', frameWidth, 'x', frameHeight);
            console.log('🧱 Всего кадров:', totalFrames);

	    const wallTextures = [];
	    for (let i = 0; i < totalFrames; i++) {
	        const rect = new PIXI.Rectangle(
	            0,
	            i * frameHeight,
	            frameWidth,
	            frameHeight
	        );
	        wallTextures.push(new PIXI.Texture(texture.baseTexture, rect));
	    }
	    
	    const wallSprites = [];
	    
	    wallRows.forEach((row, index) => {
	        const cell = gridCells[wallColumn]?.[row];
	        if (!cell) {
                    console.warn(`🧱 Не найдена клетка [${wallColumn}][${row}]`);
                    return;
            	}

	        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
	        const cellWidth = cell.cellWidth || cell.width || 60;
	        const cellHeight = cell.cellHeight || cell.height || 60;
	        console.log(`🧱 Клетка [${wallColumn}][${row}]: размер ${cellWidth}x${cellHeight}`);

	        setTimeout(() => {
	            // Эффект поднятия земли
	            createGroundRise(cell, effectsContainer);

	            setTimeout(() => {
	                // Создаём анимированный спрайт для вибрации
	                const wallSprite = new PIXI.AnimatedSprite(wallTextures);
	                wallSprite.x = cell.x + cellWidth / 2;
	                wallSprite.y = cell.y + cellHeight / 2;
	                wallSprite.anchor.set(0.5);

			wallSprite.rotation = Math.PI / 2;

	                // Масштабируем под размер клетки
	                const baseScale = (cellHeight * 0.8) / frameWidth;
			const thickness = 3;  // Множитель толщины (1 = тонкая, 2 = средняя, 3 = толстая)
			wallSprite.scale.set(baseScale, baseScale * thickness);

	                // Настройки анимации вибрации
	                wallSprite.animationSpeed = 0.1; // Медленная вибрация
	                wallSprite.loop = true;
	                wallSprite.play();
	                
	                wallSprite.alpha = 0.85;
	                wallSprite.tint = 0xCCBBAA;
	                
	                effectsContainer.addChild(wallSprite);
			console.log('🧱 Спрайт добавлен в контейнер');
	                
	                createHPBar(wallSprite, wallHP, wallHP);
	                
	                wallSprites.push({
	                    sprite: wallSprite,
	                    row: row,
	                    maxHP: wallHP,
	                    currentHP: wallHP
	                });
	                
	            }, 200);
	        }, index * 100);
	    });
	    
	    // Сохраняем спрайты стены
	    setTimeout(() => {
	        activeWallSprites.set(wallId, wallSprites);
		console.log('🧱 Стены сохранены в activeWallSprites');
	    }, wallRows.length * 100 + 200);
	    
	}).catch(err => {
	    console.warn('Ошибка загрузки текстуры стены:', err);
	    createFallbackWall();
	});
        
        // Fallback версия
        function createFallbackWall() {
            const wallSprites = [];

            wallRows.forEach((row, index) => {
                const cell = gridCells[wallColumn]?.[row];
                if (!cell) return;

                // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
                const cellWidth = cell.cellWidth || cell.width || 60;
                const cellHeight = cell.cellHeight || cell.height || 60;

                setTimeout(() => {
                    const wall = new PIXI.Graphics();
                    wall.beginFill(0x8B7355, 0.9);
                    wall.drawRect(-cellWidth/2 + 5, -cellHeight/2 + 5,
                                  cellWidth - 10, cellHeight - 10);
                    wall.endFill();

                    wall.x = cell.x + cellWidth / 2;
                    wall.y = cell.y + cellHeight / 2;
                    wall.scale.set(1, 0);
                    
                    effectsContainer.addChild(wall);
                    
                    // Анимация роста
                    const startTime = Date.now();
                    const rise = () => {
                        const progress = Math.min((Date.now() - startTime) / 400, 1);
                        wall.scale.y = progress;
                        
                        if (progress < 1) {
                            requestAnimationFrame(rise);
                        } else {
                            createHPBar(wall, wallHP, wallHP);
                        }
                    };
                    rise();
                    
                    wallSprites.push({
                        sprite: wall,
                        row: row,
                        maxHP: wallHP,
                        currentHP: wallHP
                    });
                }, index * 100);
            });
            
            setTimeout(() => {
                activeWallSprites.set(wallId, wallSprites);
            }, wallRows.length * 100 + 200);
        }
    }
    
    // Эффект поднятия земли
    function createGroundRise(cell, container) {
        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
        const cellWidth = cell.cellWidth || cell.width || 60;
        const cellHeight = cell.cellHeight || cell.height || 60;

        const dust = new PIXI.Graphics();
        dust.beginFill(0x998877, 0.4);
        dust.drawCircle(cell.x + cellWidth/2, cell.y + cellHeight - 10, 20);
        dust.endFill();
        
        container.addChild(dust);
        
        const startTime = Date.now();
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(dust)) return;

            const progress = Math.min((Date.now() - startTime) / 300, 1);
            dust.scale.set(1 + progress * 0.5);
            dust.alpha = 0.4 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(dust);
            }
        };
        animate();
    }
    
    // HP индикатор
    function createHPBar(wallSprite, currentHP, maxHP) {
        if (wallSprite.hpBar) {
            wallSprite.hpBar.clear();
        } else {
            wallSprite.hpBar = new PIXI.Graphics();
            wallSprite.parent.addChild(wallSprite.hpBar);
        }
        
        const barWidth = 40;
        const barHeight = 4;
        
        // Фон
        wallSprite.hpBar.beginFill(0x333333, 0.7);
        wallSprite.hpBar.drawRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
        wallSprite.hpBar.endFill();
        
        // HP
        const hpPercent = currentHP / maxHP;
        const color = hpPercent > 0.5 ? 0x44AA44 : (hpPercent > 0.25 ? 0xAAAA44 : 0xAA4444);
        wallSprite.hpBar.beginFill(color, 0.9);
        wallSprite.hpBar.drawRect(-barWidth/2, -barHeight/2, barWidth * hpPercent, barHeight);
        wallSprite.hpBar.endFill();
        
        wallSprite.hpBar.x = wallSprite.x;
        wallSprite.hpBar.y = wallSprite.y - 30;
    }
    

    // Усиление существующей стены
    function reinforceWall(wallId, additionalHP) {
    	const walls = activeWallSprites.get(wallId);
    	if (!walls || walls.length === 0) return;
    
    	walls.forEach(wall => {
    	    // Проверяем, что спрайт существует и находится в контейнере
    	    if (!wall.sprite || !wall.sprite.parent) return;
        
    	    // Эффект усиления
    	    const glow = new PIXI.Graphics();
    	    glow.lineStyle(3, 0xFFFF88, 0.8);
    	    glow.drawRect(-30, -40, 60, 80);
        
    	    // Используем сохранённые координаты или получаем из transform
    	    if (wall.sprite.transform && wall.sprite.worldTransform) {
    	        glow.x = wall.sprite.worldTransform.tx || wall.sprite.x || 0;
    	        glow.y = wall.sprite.worldTransform.ty || wall.sprite.y || 0;
    	    } else {
    	        // Fallback - пропускаем эффект если не можем определить позицию
    	        console.warn('Не могу определить позицию стены для эффекта усиления');
    	        return;
    	    }
    	    
    	    wall.sprite.parent.addChild(glow);
    		    
    	    const startTime = Date.now();
    	    const animate = () => {
    	        if (!window.pixiAnimUtils.isValid(glow)) return;

    	        const progress = Math.min((Date.now() - startTime) / 500, 1);
    	        glow.scale.set(1 + progress * 0.3);
    	        glow.alpha = 0.8 * (1 - progress);

    	        if (progress < 1) {
    	            requestAnimationFrame(animate);
    	        } else {
    	            if (glow.parent) {
    	                glow.parent.removeChild(glow);
    	            }
    	        }
    	    };
    	    animate();
        
    	    // Обновляем HP
    	    wall.currentHP = Math.min(wall.currentHP + additionalHP, wall.maxHP);
    	    createHPBar(wall.sprite, wall.currentHP, wall.maxHP);
    	});
    }
    
    // Обновление HP стены
    function updateWallHP(wallId, newHP, maxHP) {
        const walls = activeWallSprites.get(wallId);
        if (!walls) return;
        
        walls.forEach(wall => {
            wall.currentHP = newHP;
            if (newHP <= 0) {
                // Разрушение стены
                destroyWall(wall.sprite);
            } else {
                createHPBar(wall.sprite, newHP, maxHP);
            }
        });
        
        if (newHP <= 0) {
            activeWallSprites.delete(wallId);
        }
    }
    
    // Эффект разрушения
    function destroyWall(wallSprite) {
        if (!wallSprite || !wallSprite.parent) return;
        
        // Анимация разрушения
        const startTime = Date.now();
        const collapse = () => {
            const progress = Math.min((Date.now() - startTime) / 400, 1);
            wallSprite.scale.y *= 0.95;
            wallSprite.alpha = 1 - progress;
            wallSprite.rotation = (Math.random() - 0.5) * 0.1 * progress;
            
            if (progress < 1) {
                requestAnimationFrame(collapse);
            } else {
                if (wallSprite.hpBar) wallSprite.parent.removeChild(wallSprite.hpBar);
                wallSprite.parent.removeChild(wallSprite);
            }
        };
        collapse();
    }
    
    // Очистка всех стен
    function clearAll() {
        activeWallSprites.forEach(walls => {
            walls.forEach(wall => {
                if (wall.sprite.parent) {
                    if (wall.sprite.hpBar) wall.sprite.parent.removeChild(wall.sprite.hpBar);
                    wall.sprite.parent.removeChild(wall.sprite);
                }
            });
        });
        activeWallSprites.clear();
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.earth_wall = {
        play: playEarthWallAnimation,
        updateHP: updateWallHP,
        clearAll: clearAll
    };
    
    console.log('🧱 Анимация "Земляная стена" зарегистрирована');
})();