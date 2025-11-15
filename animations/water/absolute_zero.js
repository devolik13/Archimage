// battle/renderer/animations/water/absolute_zero.js - Анимация "Абсолютный Ноль"
console.log('✅ absolute_zero.js загружен');

(function() {
    // Хранилище активных зон Абсолютного Ноля
    const activeZones = new Map(); // key: casterId, value: zone data
    
    // Создание зоны Абсолютного Ноля
    function createAbsoluteZeroZone(params) {
        const { casterId, casterType, level } = params;
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать зону Абсолютного Ноля - нет контейнера');
            return;
        }
        
        // Определяем колонки для территории врага
        const columns = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
        
        console.log(`❄️ Создание зоны Абсолютного Ноля для ${casterType}, уровень ${level}, кастер: ${casterId}`);
        
        // Удаляем старую зону этого кастера (если есть)
        removeZone(casterId);
        
        // Создаём контейнер для всей зоны
        const zoneContainer = new PIXI.Container();
        zoneContainer.name = `absolute_zero_${casterId}`;
        // 🔥 ВАЖНО: Помечаем контейнер чтобы он не удалялся случайно
        zoneContainer.isPersistent = true;
        zoneContainer.isAbsoluteZero = true;
        effectsContainer.addChild(zoneContainer);
        
        // Определяем границы территории врага
        const leftCell = gridCells[columns[0]][0];
        const rightCell = gridCells[columns[2]][4];
        const zoneLeft = leftCell.x;
        const zoneTop = leftCell.y;
        const zoneWidth = (rightCell.x + rightCell.width) - leftCell.x;
        const zoneHeight = (rightCell.y + rightCell.height) - leftCell.y;
        
        // Создаём синий морозный оверлей (более прозрачный)
        const frostOverlay = new PIXI.Graphics();
        frostOverlay.beginFill(0x88CCFF, 0.08); // Светло-синий, очень прозрачный
        frostOverlay.drawRect(zoneLeft, zoneTop, zoneWidth, zoneHeight);
        frostOverlay.endFill();
        zoneContainer.addChild(frostOverlay);
        
        // 2. Загружаем спрайтшит снежинок
        const snowflakeTexturePath = 'images/spells/water/absolute_zero/snowflakes_spritesheet.png';
        
        PIXI.Assets.load(snowflakeTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру снежинок, используем fallback');
                createFallbackSnowflakes(zoneContainer, zoneLeft, zoneTop, zoneWidth, zoneHeight, level);
                return;
            }
            
            // Создаём кадры из спрайтшита 3×3 (768×768)
            const frameWidth = 256;
            const frameHeight = 256;
            const frames = [];
            
            // Порядок: слева направо, сверху вниз (1-9)
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
            
            // Создаём несколько слоёв снежинок
            const layerCount = level >= 3 ? 4 : 3; // Больше слоёв на высоких уровнях
            const snowflakeLayers = [];
            
            for (let layer = 0; layer < layerCount; layer++) {
                const layerContainer = new PIXI.Container();
                layerContainer.name = `snowflake_layer_${layer}`;
                zoneContainer.addChild(layerContainer);
                
                // Количество снежинок зависит от уровня
                const snowflakeCount = 8 + level * 2; // 10-18 снежинок на слой
                
                for (let i = 0; i < snowflakeCount; i++) {
                    const snowflake = new PIXI.AnimatedSprite(frames);
                    
                    // Случайная позиция в зоне
                    snowflake.x = zoneLeft + Math.random() * zoneWidth;
                    snowflake.y = zoneTop + Math.random() * zoneHeight;
                    snowflake.anchor.set(0.5);
                    
                    // Размер зависит от слоя (дальние меньше, ближние больше)
                    const baseScale = 0.15 + layer * 0.05; // 0.15 - 0.3
                    const sizeVariation = 0.5 + Math.random() * 0.5; // 0.5 - 1.0
                    snowflake.scale.set(baseScale * sizeVariation);
                    
                    // Прозрачность зависит от слоя (более прозрачные)
                    snowflake.alpha = 0.2 + layer * 0.1; // 0.2 - 0.5
                    
                    // Синий оттенок для морозного эффекта
                    snowflake.tint = 0xCCEEFF;
                    
                    // Настройки анимации
                    snowflake.animationSpeed = 0.1 + Math.random() * 0.1; // 0.1-0.2
                    snowflake.loop = true;
                    snowflake.play();
                    
                    // Сохраняем параметры для анимации падения
                    snowflake.userData = {
                        speedY: 0.3 + layer * 0.2, // Скорость падения
                        speedX: (Math.random() - 0.5) * 0.3, // Лёгкое покачивание
                        swingAmplitude: 0.5 + Math.random() * 0.5,
                        swingSpeed: 0.02 + Math.random() * 0.02,
                        swingOffset: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.02,
                        minY: zoneTop,
                        maxY: zoneTop + zoneHeight
                    };
                    
                    layerContainer.addChild(snowflake);
                }
                
                snowflakeLayers.push(layerContainer);
            }
            
            // Анимация падения снежинок
            let animationFrame = 0;
            const animateSnowflakes = () => {
                animationFrame++;
                
                // 🔥 ПРОВЕРКА: Жив ли кастер?
                const casterAlive = checkCasterAlive(casterId, casterType);
                if (!casterAlive) {
                    console.log(`❄️ Кастер ${casterId} погиб, останавливаем анимацию`);
                    removeZone(casterId);
                    return; // Останавливаем анимацию
                }
                
                snowflakeLayers.forEach(layer => {
                    layer.children.forEach(snowflake => {
                        if (!snowflake.userData) return;
                        
                        const data = snowflake.userData;
                        
                        // Падение вниз
                        snowflake.y += data.speedY;
                        
                        // Покачивание по горизонтали
                        const swing = Math.sin(animationFrame * data.swingSpeed + data.swingOffset) * data.swingAmplitude;
                        snowflake.x += data.speedX + swing * 0.1;
                        
                        // Вращение
                        snowflake.rotation += data.rotationSpeed;
                        
                        // Respawn сверху когда достигла низа
                        if (snowflake.y > data.maxY) {
                            snowflake.y = data.minY - 20;
                            snowflake.x = zoneLeft + Math.random() * zoneWidth;
                        }
                        
                        // Respawn справа/слева
                        if (snowflake.x < zoneLeft - 20) {
                            snowflake.x = zoneLeft + zoneWidth + 20;
                        } else if (snowflake.x > zoneLeft + zoneWidth + 20) {
                            snowflake.x = zoneLeft - 20;
                        }
                    });
                });
                
                // Продолжаем анимацию
                if (zoneContainer.parent) {
                    requestAnimationFrame(animateSnowflakes);
                }
            };
            
            animateSnowflakes();
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры снежинок:', err);
            createFallbackSnowflakes(zoneContainer, zoneLeft, zoneTop, zoneWidth, zoneHeight, level);
        });
        
        // Анимация пульсации оверлея (ещё более прозрачная)
        const startTime = Date.now();
        const pulsateOverlay = () => {
            // 🔥 ПРОВЕРКА: Жив ли кастер?
            const casterAlive = checkCasterAlive(casterId, casterType);
            if (!casterAlive) {
                console.log(`❄️ Кастер ${casterId} погиб, останавливаем пульсацию`);
                removeZone(casterId);
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const pulse = Math.sin(elapsed * 0.002) * 0.03 + 0.08; // 0.05 - 0.11
            frostOverlay.alpha = pulse;
            
            if (frostOverlay.parent) {
                requestAnimationFrame(pulsateOverlay);
            }
        };
        pulsateOverlay();
        
        // Сохраняем зону
        activeZones.set(casterId, {
            container: zoneContainer,
            casterType: casterType,
            level: level,
            columns: columns
        });
        
        console.log(`❄️ Зона Абсолютного Ноля создана для кастера ${casterId}`);
    }
    
    // Fallback - простая графика снежинок
    function createFallbackSnowflakes(container, left, top, width, height, level) {
        const layerCount = level >= 3 ? 4 : 3;
        
        for (let layer = 0; layer < layerCount; layer++) {
            const snowflakeCount = 8 + level * 2;
            
            for (let i = 0; i < snowflakeCount; i++) {
                const snowflake = new PIXI.Graphics();
                
                // Рисуем простую снежинку (6 лучей)
                snowflake.lineStyle(1, 0xFFFFFF, 0.8);
                const size = 3 + Math.random() * 4;
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                    snowflake.moveTo(0, 0);
                    snowflake.lineTo(
                        Math.cos(angle) * size,
                        Math.sin(angle) * size
                    );
                }
                
                snowflake.x = left + Math.random() * width;
                snowflake.y = top + Math.random() * height;
                snowflake.alpha = 0.2 + layer * 0.1; // Более прозрачные
                
                container.addChild(snowflake);
                
                // Анимация падения
                const speedY = 0.3 + layer * 0.2;
                const animate = () => {
                    snowflake.y += speedY;
                    snowflake.rotation += 0.02;
                    
                    if (snowflake.y > top + height) {
                        snowflake.y = top - 20;
                        snowflake.x = left + Math.random() * width;
                    }
                    
                    if (snowflake.parent) {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        }
    }
    
    // Проверка, жив ли кастер
    function checkCasterAlive(casterId, casterType) {
        if (casterType === 'player') {
            const wizard = window.playerWizards?.find(w => w.id === casterId);
            return wizard && wizard.hp > 0;
        } else {
            const wizard = window.enemyWizards?.find(w => w.id === casterId);
            // Для врагов также проверяем enemyFormation
            if (!wizard) {
                const formationWizard = window.enemyFormation?.find(w => w && w.id === casterId);
                return formationWizard && formationWizard.hp > 0;
            }
            return wizard && wizard.hp > 0;
        }
    }
    
    // Удаление зоны конкретного кастера
    function removeZone(casterId) {
        const zone = activeZones.get(casterId);
        if (zone) {
            if (zone.container && zone.container.parent) {
                // Останавливаем все AnimatedSprite
                zone.container.children.forEach(child => {
                    if (child.children) {
                        child.children.forEach(snowflake => {
                            if (snowflake instanceof PIXI.AnimatedSprite) {
                                snowflake.stop();
                            }
                        });
                    }
                });
                
                zone.container.parent.removeChild(zone.container);
                zone.container.destroy({ children: true, texture: false, baseTexture: false });
            }
            activeZones.delete(casterId);
            console.log(`❄️ Зона Абсолютного Ноля удалена для кастера ${casterId}`);
        }
    }
    
    // Очистка всех зон
    function clearAll() {
        activeZones.forEach((zone, casterId) => {
            removeZone(casterId);
        });
        console.log('❄️ Все зоны Абсолютного Ноля очищены');
    }
    
    // Проверка существования зоны
    function hasZone(casterId) {
        return activeZones.has(casterId);
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.absolute_zero = {
        create: createAbsoluteZeroZone,
        remove: removeZone,
        clearAll: clearAll,
        hasZone: hasZone
    };
    
    console.log('❄️ Анимация "Абсолютный Ноль" зарегистрирована');
})();