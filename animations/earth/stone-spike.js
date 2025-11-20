// battle/renderer/animations/earth/stone-spike.js - Анимация заклинания "Каменный шип"
console.log('✅ stone-spike.js загружен');

(function() {
    function playStoneSpikeAnimation(params) {
        const { casterType, casterPosition, mainTargetPosition, level, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Каменный шип');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать каменные шипы - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Определяем все позиции для шипов на основе паттерна
        const spikePositions = [];
        
        // Основная цель - всегда в колонке врага
        const enemyCol = casterType === 'player' ? 0 : 5;
        spikePositions.push({ col: enemyCol, row: mainTargetPosition, delay: 0 });
        
        if (level <= 4) {
            // Крест: вверх, вниз, вправо к призванным
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition - 1 + 5) % 5, delay: 200 });
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition + 1) % 5, delay: 200 });
            spikePositions.push({ col: casterType === 'player' ? 1 : 4, row: mainTargetPosition, delay: 200 });
        } else {
            // Уровень 5: расширенный крест
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition - 1 + 5) % 5, delay: 200 });
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition - 2 + 5) % 5, delay: 400 });
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition + 1) % 5, delay: 200 });
            spikePositions.push({ col: enemyCol, row: (mainTargetPosition + 2) % 5, delay: 400 });
            spikePositions.push({ col: casterType === 'player' ? 1 : 4, row: mainTargetPosition, delay: 200 });
            spikePositions.push({ col: casterType === 'player' ? 2 : 3, row: mainTargetPosition, delay: 400 });
        }
        
        // Загружаем спрайт-лист
        const spikeTexturePath = 'images/spells/earth/stone_spike/spike_sprite.png';
        
        PIXI.Assets.load(spikeTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackSpikes();
                return;
            }
            
            // 768×768, 3×3 = 9 кадров
            const frameWidth = 768 / 3;  // 256px
            const frameHeight = 768 / 3; // 256px
            const totalFrames = 9;
            
            const spikeTextures = [];
            for (let i = 0; i < totalFrames; i++) {
                const col = i % 3;
                const row = Math.floor(i / 3);
                
                const rect = new PIXI.Rectangle(
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                
                spikeTextures.push(new PIXI.Texture(texture.baseTexture, rect));
            }
            
            console.log(`🗿 Создаём ${spikePositions.length} шипов`);
            
            // Создаём шипы в каждой позиции
            spikePositions.forEach(pos => {
                const targetCell = gridCells[pos.col]?.[pos.row];
                if (!targetCell) {
                    console.warn(`Не найдена ячейка [${pos.col}][${pos.row}]`);
                    return;
                }
                
                setTimeout(() => {
                    // Эффект тряски земли
                    createGroundShake(targetCell, effectsContainer);
                    
                    // Шип через 200мс после тряски
                    setTimeout(() => {
                        const spike = new PIXI.AnimatedSprite(spikeTextures);
                        spike.x = targetCell.x + targetCell.width / 2;
                        spike.y = targetCell.y + targetCell.height * 0.8;
                        spike.anchor.set(0.5, 0.8);
                        
                        const scale = (targetCell.width * 0.8) / frameWidth;
                        spike.scale.set(scale * (targetCell.cellScale || 1));
                        
                        spike.animationSpeed = 0.25;
                        spike.loop = false;
                        spike.onComplete = () => {
                            setTimeout(() => {
                                if (spike.parent) {
                                    effectsContainer.removeChild(spike);
                                    spike.destroy();
                                }
                            }, 300);
                        };
                        
                        effectsContainer.addChild(spike);
                        spike.play();
                        
                        // Осколки
                        createDebris(targetCell.x + targetCell.width / 2, 
                                   targetCell.y + targetCell.height * 0.8, 
                                   targetCell.cellScale || 1);
                        
                        console.log(`🗿 Шип создан в [${pos.col}][${pos.row}]`);
                    }, 200);
                }, pos.delay);
            });
            
            if (onComplete) {
                const maxDelay = Math.max(...spikePositions.map(p => p.delay));
                setTimeout(onComplete, maxDelay + 700);
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры:', err);
            createFallbackSpikes();
        });
        
        // Fallback версия
        function createFallbackSpikes() {
            spikePositions.forEach(pos => {
                const targetCell = gridCells[pos.col]?.[pos.row];
                if (!targetCell) return;
                
                setTimeout(() => {
                    const spike = new PIXI.Graphics();
                    spike.beginFill(0x554433, 1);
                    spike.moveTo(0, -30);
                    spike.lineTo(-15, 0);
                    spike.lineTo(15, 0);
                    spike.closePath();
                    spike.endFill();
                    
                    spike.x = targetCell.x + targetCell.width / 2;
                    spike.y = targetCell.y + targetCell.height;
                    spike.scale.set(0, 0);
                    
                    effectsContainer.addChild(spike);
                    
                    const startTime = Date.now();
                    const growDuration = 300;
                    
                    const grow = () => {
                        const progress = Math.min((Date.now() - startTime) / growDuration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        
                        spike.scale.set(easeOut * 2);
                        spike.y = targetCell.y + targetCell.height - (easeOut * 30);
                        
                        if (progress < 1) {
                            requestAnimationFrame(grow);
                        } else {
                            setTimeout(() => {
                                if (spike.parent) effectsContainer.removeChild(spike);
                            }, 300);
                        }
                    };
                    grow();
                }, pos.delay);
            });
            
            if (onComplete) {
                const maxDelay = Math.max(...spikePositions.map(p => p.delay));
                setTimeout(onComplete, maxDelay + 700);
            }
        }
    }
    
    // Эффект тряски земли
    function createGroundShake(cell, container) {
        const shake = new PIXI.Graphics();
        shake.lineStyle(2, 0x664433, 0.5);
        shake.drawRect(cell.x + 5, cell.y + 5, cell.width - 10, cell.height - 10);
        container.addChild(shake);
        
        const startTime = Date.now();
        const shakeDuration = 200;
        
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(shake)) return;

            const progress = (Date.now() - startTime) / shakeDuration;
            if (progress < 1) {
                shake.x = (Math.random() - 0.5) * 4;
                shake.y = (Math.random() - 0.5) * 4;
                requestAnimationFrame(animate);
            } else {
                if (shake.parent) container.removeChild(shake);
            }
        };
        animate();
    }
    
    // Осколки
    function createDebris(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < 5; i++) {
            const debris = new PIXI.Graphics();
            debris.beginFill(0x665544, 0.8);
            debris.drawRect(-2, -2, 4, 4);
            debris.endFill();
            debris.x = x;
            debris.y = y;
            
            effectsContainer.addChild(debris);
            
            const angle = (Math.PI * 2 / 5) * i;
            const speed = 2 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 3;
            
            const startTime = Date.now();
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(debris)) return;

                const progress = Math.min((Date.now() - startTime) / 500, 1);
                debris.x += vx * (1 - progress);
                debris.y += vy * (1 - progress) + progress * 4;
                debris.alpha = 1 - progress;
                debris.rotation += 0.2;

                if (progress < 1 && debris.parent) {
                    requestAnimationFrame(animate);
                } else {
                    if (debris.parent) effectsContainer.removeChild(debris);
                }
            };
            animate();
        }
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.stone_spike = {
        play: playStoneSpikeAnimation
    };
    
    console.log('🗿 Анимация "Каменный шип" зарегистрирована');
})();