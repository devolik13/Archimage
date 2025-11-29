// battle/renderer/animations/fire/burning-ground.js
console.log('✅ burning-ground.js загружен');

(function() {
    // Хранилище активных зон горящей земли
    const activeBurningGrounds = new Map();
    
    function createBurningGround(column, row, duration = 1) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Горящая земля');
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) return;
        
        const cell = gridCells[column]?.[row];
        if (!cell) return;
        
        const groundId = `burning_${column}_${row}_${Date.now()}`;
        
        // Загружаем спрайт-лист
        const texturePath = 'images/spells/fire/fire_tsunami/burning_ground_sheet.png';
        
        PIXI.Assets.load(texturePath).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                createFallbackGround(cell, groundId);
                return;
            }
            
            // Создаем кадры из спрайт-листа 3×3
            const frames = [];
            const frameWidth = 204;  // 612 / 3
            const frameHeight = 136; // 408 / 3
            
            for (let row = 0; row < 3; row++) {
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
            
            // Создаем анимированный спрайт
            const burningGround = new PIXI.AnimatedSprite(frames);
            burningGround.x = cell.x + cell.width / 2;
            burningGround.y = cell.y + cell.height * 0.8; // Ближе к низу клетки
            burningGround.anchor.set(0.5, 0.5);
            
            // Масштаб под размер клетки
            const scale = cell.cellScale * 0.6;
            burningGround.scale.set(scale);
            
            burningGround.animationSpeed = 0.15;
            burningGround.loop = true;
            burningGround.play();
            
            burningGround.tint = 0xFF6600;
            burningGround.blendMode = PIXI.BLEND_MODES.ADD;
            burningGround.alpha = 0.7;
            
            effectsContainer.addChild(burningGround);
            
            // Сохраняем
            activeBurningGrounds.set(groundId, {
                sprite: burningGround,
                column: column,
                row: row,
                turnsLeft: duration
            });
            
            // Автоудаление через время
            setTimeout(() => {
                removeBurningGround(groundId);
            }, duration * 2000); // 2 секунды на ход
            
        }).catch(() => {
            createFallbackGround(cell, groundId);
        });
    }
    
    function createFallbackGround(cell, groundId) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        const ground = new PIXI.Graphics();
        ground.beginFill(0xFF4400, 0.4);
        ground.drawEllipse(0, 0, cell.width * 0.4, cell.height * 0.2);
        ground.endFill();
        
        ground.x = cell.x + cell.width / 2;
        ground.y = cell.y + cell.height * 0.8;
        ground.blendMode = PIXI.BLEND_MODES.ADD;
        
        effectsContainer.addChild(ground);
        
        // Пульсация
        const pulse = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!ground || ground.destroyed || !ground.transform || !ground.parent) {
                return;
            }

            ground.alpha = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
            requestAnimationFrame(pulse);
        };
        pulse();
        
        activeBurningGrounds.set(groundId, {
            sprite: ground,
            column: cell.column,
            row: cell.row,
            turnsLeft: 1
        });
        
        setTimeout(() => {
            removeBurningGround(groundId);
        }, 2000);
    }
    
    function removeBurningGround(groundId) {
        const groundData = activeBurningGrounds.get(groundId);
        if (!groundData) return;

        const fadeOut = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!groundData.sprite || groundData.sprite.destroyed || !groundData.sprite.transform) {
                activeBurningGrounds.delete(groundId);
                return;
            }

            groundData.sprite.alpha -= 0.05;
            if (groundData.sprite.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                if (groundData.sprite.parent) {
                    groundData.sprite.parent.removeChild(groundData.sprite);
                }
                if (!groundData.sprite.destroyed) {
                    groundData.sprite.destroy();
                }
                activeBurningGrounds.delete(groundId);
            }
        };
        fadeOut();
    }
    
    function clearAllBurningGrounds() {
        activeBurningGrounds.forEach((_, id) => removeBurningGround(id));
    }
    
    // Регистрация
    window.burningGround = {
        create: createBurningGround,
        remove: removeBurningGround,
        clearAll: clearAllBurningGrounds
    };
    
    console.log('🔥 Система горящей земли зарегистрирована');
})();