// battle/renderer/animations/water/ice-rain.js

(function() {
    
    function playIceRainAnimation(params) {
        const { casterType, targetPositions, level = 1, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Ледяной дождь');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать Ледяной дождь - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Загружаем спрайт-лист капель
        const dropTexturePath = 'images/spells/water/ice_rain/ice_drop_sprite.webp';
        
        PIXI.Assets.load(dropTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackRain();
                return;
            }
            
            // 768×768, 4 колонки × 2 ряда = 8 кадров
            const frameWidth = 768 / 4;  // 192px
            const frameHeight = 768 / 2; // 384px
            const totalFrames = 8;
            
            const dropTextures = [];
            for (let i = 0; i < totalFrames; i++) {
                const col = i % 4;
                const row = Math.floor(i / 4);
                
                const rect = new PIXI.Rectangle(
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                
                dropTextures.push(new PIXI.Texture(texture.baseTexture, rect));
            }
            
            // Создаём капли для каждой целевой позиции
            targetPositions.forEach((position, index) => {
                // Определяем колонку для атаки (колонка 0 для врагов, 5 для игрока)
                const targetCol = casterType === 'player' ? 0 : 5;
                const cell = gridCells[targetCol]?.[position];
                
                if (!cell) return;
                
                // Создаём несколько капель с разной задержкой
                const dropsCount = level >= 3 ? 5 : 3; // Больше капель на высоких уровнях
                
                for (let i = 0; i < dropsCount; i++) {
                    setTimeout(() => {
                        createIceDrop(
                            cell.x + cell.width / 2 + (Math.random() - 0.5) * cell.width * 0.6,
                            cell.y - 100 - Math.random() * 200, // Стартуют выше экрана
                            cell.y + cell.height / 2,
                            dropTextures,
                            cell.cellScale || 1
                        );
                    }, index * 100 + i * 150); // Задержка между позициями и каплями
                }
            });
            
            // Эффект замерзания земли
            setTimeout(() => {
                targetPositions.forEach(position => {
                    const targetCol = casterType === 'player' ? 0 : 5;
                    const cell = gridCells[targetCol]?.[position];
                    if (cell) {
                        createFrostGround(cell);
                    }
                });
            }, 500);
            
            if (onComplete) {
                setTimeout(onComplete, 2000);
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры:', err);
            createFallbackRain();
        });
        
        // Создание одной капли
        function createIceDrop(startX, startY, targetY, textures, scale) {
            const drop = new PIXI.AnimatedSprite(textures);
            drop.x = startX;
            drop.y = startY;
            drop.anchor.set(0.5);
            drop.scale.set(scale * 0.3);
            drop.animationSpeed = 0.3;
            drop.loop = true;
            drop.play();
            drop.rotation = Math.random() * 0.4 - 0.2; // Лёгкий наклон
            
            effectsContainer.addChild(drop);
            
            // Анимация падения
            const fallDuration = 800 + Math.random() * 400;
            const startTime = Date.now();
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(drop)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / fallDuration, 1);

                // Ускоренное падение
                const fallProgress = 1 - Math.pow(1 - progress, 2);
                drop.y = startY + (targetY - startY) * fallProgress;

                // Лёгкое покачивание
                drop.x += Math.sin(progress * Math.PI * 2) * 0.5;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Взрыв при попадании
                    createIceSplash(drop.x, targetY, scale);
                    effectsContainer.removeChild(drop);
                    drop.destroy();
                }
            };
            
            animate();
        }
        
        // Всплеск при попадании
        function createIceSplash(x, y, scale) {
            const splash = new PIXI.Graphics();
            splash.beginFill(0xaaeeff, 0.6);
            splash.drawCircle(0, 0, 15 * scale);
            splash.endFill();
            splash.x = x;
            splash.y = y;
            splash.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(splash);
            
            const startTime = Date.now();
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(splash)) return;

                const progress = Math.min((Date.now() - startTime) / 300, 1);
                splash.scale.set(1 + progress * 2);
                splash.alpha = 0.6 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    effectsContainer.removeChild(splash);
                }
            };
            animate();
        }
        
        // Эффект замерзшей земли
        function createFrostGround(cell) {
            const frost = new PIXI.Graphics();
            frost.beginFill(0x88ccff, 0.3);
            frost.drawRect(cell.x, cell.y, cell.width, cell.height);
            frost.endFill();
            
            effectsContainer.addChild(frost);
            
            // Исчезновение
            setTimeout(() => {
                const startTime = Date.now();
                const animate = () => {
                    if (!window.pixiAnimUtils.isValid(frost)) return;

                    const progress = Math.min((Date.now() - startTime) / 1000, 1);
                    frost.alpha = 0.3 * (1 - progress);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        effectsContainer.removeChild(frost);
                    }
                };
                animate();
            }, 1000);
        }
        
        // Fallback без текстур
        function createFallbackRain() {
            console.log('Используем fallback для Ледяного дождя');
            // Простые синие капли
            targetPositions.forEach((position, index) => {
                setTimeout(() => {
                    const targetCol = casterType === 'player' ? 0 : 5;
                    const cell = gridCells[targetCol]?.[position];
                    if (cell) {
                        for (let i = 0; i < 3; i++) {
                            setTimeout(() => {
                                const drop = new PIXI.Graphics();
                                drop.beginFill(0x4488ff, 0.8);
                                drop.drawCircle(0, 0, 8);
                                drop.endFill();
                                
                                drop.x = cell.x + cell.width / 2 + (Math.random() - 0.5) * 30;
                                drop.y = cell.y - 50;
                                
                                effectsContainer.addChild(drop);
                                
                                // Падение
                                const startTime = Date.now();
                                const animate = () => {
                                    if (!window.pixiAnimUtils.isValid(drop)) return;

                                    const progress = Math.min((Date.now() - startTime) / 600, 1);
                                    drop.y = cell.y - 50 + (cell.height + 50) * progress;

                                    if (progress < 1) {
                                        requestAnimationFrame(animate);
                                    } else {
                                        effectsContainer.removeChild(drop);
                                    }
                                };
                                animate();
                            }, i * 200);
                        }
                    }
                }, index * 100);
            });
            
            if (onComplete) setTimeout(onComplete, 2000);
        }
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.ice_rain = {
        play: playIceRainAnimation
    };
    
    console.log('❄️ Анимация "Ледяной дождь" зарегистрирована');
})();