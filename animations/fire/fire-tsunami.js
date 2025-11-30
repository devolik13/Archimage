// battle/renderer/animations/fire/fire-tsunami.js - Анимация заклинания "Огненное цунами"

(function() {
    // Хранилище активных визуалов цунами по ID
    const activeTsunamiVisuals = new Map();
    
    function playFireTsunamiAnimation(params) {
        const { casterType, casterPosition, level = 1, tsunamiId } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Огненное цунами');
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать огненное цунами - нет контейнера');
            return;
        }
        
        console.log('🌊 Создание огненного цунами', { casterType, tsunamiId });
        
        // Цунами стартует на ВРАЖЕСКОЙ территории
        const startColumn = casterType === 'player' ? 0 : 5;
        
        // Загружаем спрайт-лист
        const tsunamiTexturePath = 'images/spells/fire/fire_tsunami/tsunami_sheet.png';
        
        PIXI.Assets.load(tsunamiTexturePath).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                console.warn('Спрайт-лист не загружен, используем fallback');
                createFallbackTsunami(startColumn, tsunamiId);
                return;
            }
            
            // Создаем кадры из спрайт-листа 4×2 (768x768)
            const frames = [];
            const frameWidth = 192;  // 768 / 4
            const frameHeight = 384; // 768 / 2
            
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 4; col++) {
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
            
            console.log(`📋 Создано ${frames.length} кадров для цунами`);
            createTsunamiWave(frames, startColumn, tsunamiId);
            
        }).catch(err => {
            console.error('Ошибка загрузки:', err);
            createFallbackTsunami(startColumn, tsunamiId);
        });
        
        function createTsunamiWave(frames, column, id) {
            // Удаляем старый визуал если есть
            if (id && activeTsunamiVisuals.has(id)) {
                clearTsunamiVisual(id);
            }
            
            const waveSprites = [];
            
            // Создаем волну для всех 5 рядов
            for (let row = 0; row < 5; row++) {
                const cellData = gridCells[column]?.[row];
                if (!cellData) continue;
                
                const wave = new PIXI.AnimatedSprite(frames);
                wave.x = cellData.x + cellData.width / 2;
                wave.y = cellData.y + cellData.height / 2;
                wave.anchor.set(0.5);
                
                // Масштаб - адаптивный к размеру клетки
                const scale = cellData.cellScale * 0.5;
                // Зеркалим для врага
                const direction = casterType === 'enemy' ? -1 : 1;
                wave.scale.set(scale * direction, scale);
                
                // Настройки анимации
                wave.animationSpeed = 0.15;
                wave.loop = true;
                wave.play();
                
                // Рандомизируем старт для разнообразия
                wave.gotoAndPlay(Math.floor(Math.random() * frames.length));
                
                // Эффекты
                wave.tint = 0xFF6600;
                wave.blendMode = PIXI.BLEND_MODES.ADD;
                wave.alpha = 0;
                
                effectsContainer.addChild(wave);
                
                // Плавное появление с задержкой по рядам
                const appearDelay = row * 50;
                setTimeout(() => {
                    const fadeIn = () => {
                        wave.alpha += 0.05;
                        if (wave.alpha < 0.9) {
                            requestAnimationFrame(fadeIn);
                        }
                    };
                    fadeIn();
                }, appearDelay);
                
                waveSprites.push({
                    sprite: wave,
                    row: row,
                    column: column
                });
            }
            
            // Сохраняем визуал
            if (id) {
                activeTsunamiVisuals.set(id, {
                    sprites: waveSprites,
                    casterType: casterType,
                    currentColumn: column,
                    level: level
                });
            }
            
            console.log(`🔥 Цунами создано в колонке ${column}`);
            
            // Создаем эффект горящей земли при появлении
            createBurningGroundEffect(column, level);
        }
        
        function createFallbackTsunami(column, id) {
            const waveSprites = [];
            
            for (let row = 0; row < 5; row++) {
                const cellData = gridCells[column]?.[row];
                if (!cellData) continue;
                
                const wave = new PIXI.Graphics();
                
                // Рисуем волну огня
                wave.beginFill(0xFF6600, 0.7);
                wave.moveTo(-30, 20);
                wave.quadraticCurveTo(0, -30, 30, 20);
                wave.lineTo(20, 30);
                wave.lineTo(-20, 30);
                wave.closePath();
                wave.endFill();
                
                // Добавляем языки пламени
                wave.beginFill(0xFFAA00, 0.5);
                wave.drawCircle(-10, 0, 8);
                wave.drawCircle(10, 0, 8);
                wave.drawCircle(0, -10, 10);
                wave.endFill();
                
                wave.x = cellData.x + cellData.width / 2;
                wave.y = cellData.y + cellData.height / 2;
                
                effectsContainer.addChild(wave);
                
                // Анимация покачивания
                const baseY = wave.y;
                const animate = () => {
                    if (!window.pixiAnimUtils.isValid(wave)) return;

                    wave.rotation += 0.02;
                    wave.y = baseY + Math.sin(Date.now() * 0.002) * 5;
                    if (wave.parent) requestAnimationFrame(animate);
                };
                animate();
                
                waveSprites.push({
                    sprite: wave,
                    row: row,
                    column: column
                });
            }
            
            if (id) {
                activeTsunamiVisuals.set(id, {
                    sprites: waveSprites,
                    casterType: casterType,
                    currentColumn: column,
                    level: level
                });
            }
        }
    }
    
    // Функция для движения цунами на новую колонку
    function moveTsunamiOneStep(tsunamiId, newColumn) {
        const tsunamiData = activeTsunamiVisuals.get(tsunamiId);
        if (!tsunamiData) {
            console.warn(`Цунами ${tsunamiId} не найдено`);
            return;
        }
        
        const gridCells = window.pixiCore?.getGridCells();
        if (!gridCells) return;
        
        console.log(`🌊 Движение цунами ${tsunamiId}: ${tsunamiData.currentColumn} → ${newColumn}`);
        
        // Анимируем движение каждого спрайта
        tsunamiData.sprites.forEach((waveData, index) => {
            const { sprite, row } = waveData;
            const targetCell = gridCells[newColumn]?.[row];
            
            if (!targetCell || !sprite.parent) return;
            
            const targetX = targetCell.x + targetCell.width / 2;
            const startX = sprite.x;
            const duration = 600;
            const startTime = Date.now();
            
            // Задержка для волнового эффекта
            setTimeout(() => {
                const animate = () => {
                    if (!window.pixiAnimUtils.isValid(sprite)) return;

                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Easing функция для плавности
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    sprite.x = startX + (targetX - startX) * easeProgress;

                    // Усиливаем альфу во время движения
                    sprite.alpha = Math.min(0.9, sprite.alpha + 0.01);
                    
                    // Частицы огня при движении
                    if (Math.random() > 0.85) {
                        createFireParticle(sprite.x, sprite.y);
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        waveData.column = newColumn;
                    }
                };
                animate();
            }, index * 30); // Волновой эффект
        });
        
        // Обновляем текущую колонку
        tsunamiData.currentColumn = newColumn;
        
        // Создаем эффект горящей земли в новой колонке (для 5 уровня)
        if (tsunamiData.level === 5) {
            setTimeout(() => {
                createBurningGroundEffect(newColumn, tsunamiData.level);
            }, 300);
        }
    }
    
    // Создание эффекта горящей земли
    function createBurningGroundEffect(column, level) {
    	if (level !== 5) return;
    
    	// Создаем горящую землю для каждой клетки колонки
    	for (let row = 0; row < 5; row++) {
    	    if (window.burningGround?.create) {
    	        window.burningGround.create(column, row, 1); // 1 ход
    	    }
    	}
    }
    
    // Создание частиц огня
    function createFireParticle(x, y) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        const particle = new PIXI.Graphics();
        particle.beginFill(0xFFAA00, 0.8);
        particle.drawCircle(0, 0, 2 + Math.random() * 3);
        particle.endFill();
        
        particle.x = x + (Math.random() - 0.5) * 20;
        particle.y = y + (Math.random() - 0.5) * 20;
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        
        effectsContainer.addChild(particle);
        
        const vy = -2 - Math.random() * 2;
        const vx = (Math.random() - 0.5) * 1;
        const startTime = Date.now();
        const duration = 800;
        
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(particle)) return;

            const progress = Math.min((Date.now() - startTime) / duration, 1);

            particle.y += vy;
            particle.x += vx;
            particle.alpha = 0.8 * (1 - progress);
            particle.scale.set(1 - progress * 0.5);

            if (progress < 1 && particle.parent) {
                requestAnimationFrame(animate);
            } else {
                if (particle.parent) effectsContainer.removeChild(particle);
            }
        };
        animate();
    }
    
    // Удаление визуала цунами
    function clearTsunamiVisual(tsunamiId) {
    	const visual = activeTsunamiVisuals.get(tsunamiId);
    	if (!visual) return;
    
    	const fadeOut = () => {
    	    // Проверяем, что объект все еще существует и валиден
    	    if (!visual || !visual.transform || !visual.parent) {
    	        activeTsunamiVisuals.delete(tsunamiId);
    	        return;
    	    }
        
    	    visual.alpha -= 0.05;
        
    	    if (visual.alpha > 0) {
    	        requestAnimationFrame(fadeOut);
    	    } else {
    	        if (visual.parent) {
    	            visual.parent.removeChild(visual);
    	        }
    	        activeTsunamiVisuals.delete(tsunamiId);
    	    }
    	};
    	fadeOut();
    }
    
    // Очистка всех цунами
    function clearAllTsunamis() {
        activeTsunamiVisuals.forEach((_, id) => clearTsunamiVisual(id));
    }
    
    // Регистрация модуля
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.fire_tsunami = {
        play: playFireTsunamiAnimation,
        move: moveTsunamiOneStep,
        clear: clearTsunamiVisual,
        clearAll: clearAllTsunamis
    };
    
    console.log('🔥🌊 Анимация "Огненное цунами" зарегистрирована');
})();