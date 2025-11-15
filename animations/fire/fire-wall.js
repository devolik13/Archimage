// battle/renderer/animations/fire/fire-wall.js - Анимация заклинания "Огненная стена"
console.log('✅ fire-wall.js загружен');

(function() {
    // Хранилище активных огненных стен
    let activeFireWallZones = [];
    
    function playFireWallAnimation(params) {
        const { casterId, casterType, positions, damage, level } = params;
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать огненную стену - нет контейнера или сетки');
            return;
        }
        
        // Удаляем старые стены этого кастера
        activeFireWallZones = activeFireWallZones.filter(zone => {
            if (zone.casterId === casterId) {
                // Удаляем спрайт старой стены
                if (zone.sprite && zone.sprite.parent) {
                    zone.sprite.parent.removeChild(zone.sprite);
                    zone.sprite.destroy({ children: true });
                }
                console.log(`🔥 Удалена старая огненная стена кастера ${casterId}`);
                return false; // Удаляем из массива
            }
            return true; // Оставляем стены других кастеров
        });
        
        // Определяем колонку для стены (0 для игрока, 5 для врага)
        const targetColumn = casterType === 'player' ? 0 : 5;
        
        // Загружаем текстуру спрайт-листа
        const textureUrl = '/images/spells/fire/fire_wall/fire_wall_spritesheet.png';
        
        // Загружаем базовую текстуру
        const baseTexture = PIXI.BaseTexture.from(textureUrl);
        
        // Функция создания спрайтов стены
        const createFireWallSprites = () => {
            // Параметры спрайт-листа
            const frameWidth = 768;
            const frameHeight = 192; // 768/4 = 192 пикселей на кадр
            const frameCount = 4;
            
            // Создаем массив текстур для каждого кадра
            const fireTextures = [];
            for (let i = 0; i < frameCount; i++) {
                const frameTexture = new PIXI.Texture(
                    baseTexture,
                    new PIXI.Rectangle(0, i * frameHeight, frameWidth, frameHeight)
                );
                fireTextures.push(frameTexture);
            }
            
            console.log(`🔥 Загружено ${fireTextures.length} кадров огненной стены`);
            
            // Создаем огонь для каждой позиции
            positions.forEach(row => {
                const cellData = gridCells[targetColumn]?.[row];
                if (!cellData) {
                    console.warn(`Нет данных ячейки для позиции ${targetColumn}_${row}`);
                    return;
                }
                
                // Создаем анимированный спрайт огня
                const fireSprite = new PIXI.AnimatedSprite(fireTextures);
                fireSprite.x = cellData.x + cellData.width / 2;
                fireSprite.y = cellData.y + cellData.height / 2;
                fireSprite.anchor.set(0.5);
                
                // Масштабируем спрайт под размер ячейки
                // Используем cellScale вместо height, так как height может быть 0
                const baseScale = cellData.cellScale || 1.0;
                const scaleFactor = baseScale * 0.5; // Масштабируем относительно размера ячейки

                fireSprite.scale.set(scaleFactor * 0.4, scaleFactor); // Ширина меньше, высота больше для вертикальной стены
                
                fireSprite.animationSpeed = 0.2; // Скорость анимации (4 кадра)
                fireSprite.loop = true; // Зацикливаем анимацию
                fireSprite.play();
                
                // Эффекты свечения для огня
                fireSprite.blendMode = PIXI.BLEND_MODES.ADD; // Режим наложения для свечения
                fireSprite.tint = 0xFF6600; // Оранжевый оттенок
                fireSprite.alpha = 0.9; // Небольшая прозрачность
                
                effectsContainer.addChild(fireSprite);
                
                // Сохраняем информацию о зоне
                activeFireWallZones.push({
                    sprite: fireSprite,
                    casterId: casterId,
                    casterType: casterType,
                    row: row,
                    column: targetColumn,
                    damage: damage,
                    level: level
                });
                
                console.log(`🔥 Огненная стена создана на позиции ${targetColumn}_${row}`);
            });
        };
        
        // Если текстура еще не загружена, ждем загрузки
        if (!baseTexture.valid) {
            baseTexture.once('loaded', createFireWallSprites);
        } else {
            createFireWallSprites();
        }
    }
    
    // Fallback - простая анимация если текстура не загрузилась  
    function createFallbackFireWall(casterId, targetColumn, positions, effectsContainer, gridCells, casterType, damage, level) {
        console.warn('Используем fallback анимацию огненной стены');
        positions.forEach(row => {
            const cellData = gridCells[targetColumn]?.[row];
            if (!cellData) return;
            
            const container = new PIXI.Container();
            container.x = cellData.x + cellData.width / 2;
            container.y = cellData.y + cellData.height / 2;
            
            // Создаем пламя из частиц
            const flameCount = 8;
            const flames = [];
            
            for (let i = 0; i < flameCount; i++) {
                const flame = new PIXI.Graphics();
                flame.beginFill(0xFF4500 + i * 0x001100, 0.8);
                flame.drawEllipse(0, 0, 8, 20);
                flame.endFill();
                
                flame.x = (i - flameCount / 2) * 8;
                flame.y = 0;
                flames.push(flame);
                container.addChild(flame);
            }
            
            effectsContainer.addChild(container);
            
            // Анимация пламени
            let time = 0;
            const animate = () => {
                if (!container.parent) return;
                
                time += 0.15;
                flames.forEach((flame, i) => {
                    flame.scale.y = 1 + Math.sin(time + i * 0.5) * 0.3;
                    flame.alpha = 0.6 + Math.sin(time * 2 + i) * 0.3;
                    flame.y = Math.sin(time + i) * 5;
                });
                
                requestAnimationFrame(animate);
            };
            animate();
            
            activeFireWallZones.push({
                sprite: container,
                casterId: casterId,
                casterType: casterType,
                row: row,
                column: targetColumn,
                damage: damage,
                level: level
            });
            
            console.log(`🔥 Fallback огненная стена создана на позиции ${targetColumn}_${row}`);
        });
    }
    
    // Обновление активных стен - удаление если кастер мертв
    function updateFireWalls() {
        if (!window.activeEffectZones) return;
        
        activeFireWallZones = activeFireWallZones.filter(zone => {
            // Проверяем жив ли кастер
            const casterAlive = isCasterAlive(zone.casterId, zone.casterType);
            
            if (!casterAlive) {
                // Удаляем спрайт
                if (zone.sprite && zone.sprite.parent) {
                    zone.sprite.parent.removeChild(zone.sprite);
                    zone.sprite.destroy({ children: true });
                }
                console.log(`🔥 Огненная стена удалена - кастер ${zone.casterId} мертв`);
                return false;
            }
            
            // Проверяем есть ли еще эта стена в игровой логике
            const gameWall = window.activeEffectZones?.find(w => 
                w.type === 'fire_wall' && 
                w.casterId === zone.casterId &&
                w.positions?.includes(zone.row)
            );
            
            if (!gameWall) {
                // Удаляем спрайт
                if (zone.sprite && zone.sprite.parent) {
                    zone.sprite.parent.removeChild(zone.sprite);
                    zone.sprite.destroy({ children: true });
                }
                console.log(`🔥 Огненная стена удалена с позиции ${zone.column}_${zone.row}`);
                return false;
            }
            
            return true;
        });
    }
    
    // Вспомогательная функция проверки жив ли кастер
    function isCasterAlive(casterId, casterType) {
        if (casterType === 'player') {
            const wizard = window.playerWizards?.find(w => w.id === casterId);
            return wizard && wizard.hp > 0;
        } else {
            const wizard = window.enemyWizards?.find(w => w.id === casterId);
            return wizard && wizard.hp > 0;
        }
    }
    
    // Очистка всех стен
    function clearFireWalls() {
        activeFireWallZones.forEach(zone => {
            if (zone.sprite && zone.sprite.parent) {
                zone.sprite.parent.removeChild(zone.sprite);
                zone.sprite.destroy({ children: true });
            }
        });
        activeFireWallZones = [];
        console.log('🔥 Все огненные стены очищены');
    }
    
    // Эффект урона от огненной стены
    function showFireWallDamage(x, y, scale = 1) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Создаем искры при уроне
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFAA00, 1);
            spark.drawCircle(0, 0, 3 * scale);
            spark.endFill();
            spark.x = x;
            spark.y = y;
            
            effectsContainer.addChild(spark);
            
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.3;
            const speed = 2.5 + Math.random() * 1.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const startTime = Date.now();
            const duration = 400;
            
            const animateSpark = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                spark.x += vx * (1 - progress);
                spark.y += vy * (1 - progress) + progress * 2;
                spark.alpha = 1 - progress;
                
                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animateSpark);
                } else {
                    if (spark.parent) effectsContainer.removeChild(spark);
                }
            };
            
            animateSpark();
        }
    }
    
    // Регистрация модуля
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.fire_wall = {
        play: playFireWallAnimation,
        update: updateFireWalls,
        clear: clearFireWalls,
        showDamage: showFireWallDamage
    };
    
    // Экспорт для совместимости
    window.createFireWallVisual = function(casterType, positions, damage, level) {
        // Ищем casterId из последней созданной стены с этим casterType
        let casterId = null;
        if (window.activeEffectZones) {
            const lastWall = window.activeEffectZones
                .filter(zone => zone.type === 'fire_wall' && zone.casterType === casterType)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
            
            if (lastWall) {
                casterId = lastWall.casterId;
            }
        }
        
        playFireWallAnimation({
            casterId: casterId || `unknown_${Date.now()}`,
            casterType: casterType,
            positions: positions,
            damage: damage,
            level: level
        });
    };
    window.updateFireWalls = updateFireWalls;
    window.clearFireWalls = clearFireWalls;
    window.createFireWallDamageEffect = showFireWallDamage;
    
    console.log('🔥 Анимация "Огненная стена" зарегистрирована');
})();