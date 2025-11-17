// battle/renderer/animations/water/icicle.js - Анимация заклинания "Ледышка"
console.log('✅ icicle.js загружен');

(function() {
    function playIcicleAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onComplete } = params;
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать ледышку - нет контейнера или сетки');
            if (onComplete) onComplete();
            return;
        }
        
        const startCell = gridCells[casterCol]?.[casterRow];
        const endCell = gridCells[targetCol]?.[targetRow];
        
        if (!startCell || !endCell) {
            console.warn('Не могу создать ледышку - нет данных ячеек');
            if (onComplete) onComplete();
            return;
        }
        
        // Создаем ледяной снаряд
        const projectile = new PIXI.Graphics();
        projectile.beginFill(0x00BFFF, 0.9);  // Голубой цвет
        projectile.drawPolygon([
            0, -8,    // верх
            -4, 0,    // лево
            0, 8,     // низ
            4, 0      // право
        ]);
        projectile.endFill();
        
        // Добавляем свечение
        projectile.beginFill(0xCCFFFF, 0.3);
        projectile.drawCircle(0, 0, 10);
        projectile.endFill();
        
        // Начальная позиция
        projectile.x = startCell.x + startCell.width / 2;
        projectile.y = startCell.y + startCell.height / 2;
        
        // Поворот в сторону цели
        const angle = Math.atan2(
            endCell.y + endCell.height / 2 - projectile.y,
            endCell.x + endCell.width / 2 - projectile.x
        );
        projectile.rotation = angle + Math.PI / 2;
        
        effectsContainer.addChild(projectile);
        
        // Целевая позиция
        const targetX = endCell.x + endCell.width / 2;
        const targetY = endCell.y + endCell.height / 2;
        
        // Параметры анимации
        const duration = 500;
        const startTime = Date.now();
        let animationFrame = null;
        let isDestroyed = false;
        
        // Функция анимации
        const animate = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (isDestroyed || !projectile || projectile.destroyed || !projectile.transform || !projectile.parent || !effectsContainer) {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                if (projectile && projectile.parent) {
                    try {
                        effectsContainer.removeChild(projectile);
                    } catch (e) {}
                }
                if (onComplete) onComplete();
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Интерполяция позиции
            projectile.x = startCell.x + startCell.width / 2 + 
                          (targetX - (startCell.x + startCell.width / 2)) * progress;
            projectile.y = startCell.y + startCell.height / 2 + 
                          (targetY - (startCell.y + startCell.height / 2)) * progress;
            
            // След от ледышки
            if (Math.random() > 0.8) {
                createIceTrail(projectile.x, projectile.y);
            }
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Удаляем снаряд
                if (projectile.parent && effectsContainer) {
                    try {
                        effectsContainer.removeChild(projectile);
                    } catch (e) {}
                }
                
                // Создаем взрыв льда
                createIceExplosion(targetX, targetY, endCell.cellScale);
                
                if (onComplete) onComplete();
            }
        };
        
        // Создание ледяного следа
        function createIceTrail(x, y) {
            const trail = new PIXI.Graphics();
            trail.beginFill(0x00BFFF, 0.4);
            trail.drawCircle(0, 0, 2);
            trail.endFill();
            
            trail.x = x;
            trail.y = y;
            
            effectsContainer.addChild(trail);
            
            const fadeStartTime = Date.now();
            const fadeDuration = 400;
            
            const fadeAnimate = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!trail || trail.destroyed || !trail.transform) {
                    return;
                }

                const elapsed = Date.now() - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);

                trail.alpha = 0.4 * (1 - progress);
                trail.scale.set(1 - progress * 0.5);

                if (progress < 1 && trail.parent) {
                    requestAnimationFrame(fadeAnimate);
                } else {
                    if (trail.parent) {
                        effectsContainer.removeChild(trail);
                    }
                }
            };
            
            fadeAnimate();
        }

        // Создание взрыва с использованием спрайт-листа PNG
        function createIceExplosion(x, y, scale = 1) {
            const effectsContainer = window.pixiCore?.getEffectsContainer();
            if (!effectsContainer) return;

            // Путь к спрайт-листу взрыва льда
            const explosionSheetPath = 'images/spells/water/icicle/ice_explosion_sheet.png';
            
            PIXI.Assets.load(explosionSheetPath).then(texture => {
                if (texture && texture.valid) {
                    // Спрайт-лист 768×768, 3 колонки × 3 ряда = 9 кадров
                    const cols = 3;
                    const rows = 3;
                    const frameWidth = 768 / cols;  // 256px
                    const frameHeight = 768 / rows; // 256px
                    const totalFrames = 9;
                    
                    // Создаем текстуры из спрайт-листа
                    const explosionTextures = [];
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            const rect = new PIXI.Rectangle(
                                col * frameWidth,
                                row * frameHeight,
                                frameWidth,
                                frameHeight
                            );
                            explosionTextures.push(new PIXI.Texture(texture.baseTexture, rect));
                        }
                    }
                    
                    // Создаем анимированный спрайт взрыва
                    const explosion = new PIXI.AnimatedSprite(explosionTextures);
                    explosion.x = x;
                    explosion.y = y;
                    explosion.anchor.set(0.5);
                    explosion.scale.set(scale * 0.25); // Подберите масштаб
                    explosion.animationSpeed = 0.35;   // Скорость анимации
                    explosion.loop = false;
                    explosion.tint = 0xCCFFFF;         // Голубоватый оттенок
                    
                    explosion.onComplete = () => {
                        // ПРОВЕРКА: если объект уничтожен - не обрабатываем
                        if (!explosion || explosion.destroyed || !explosion.transform) {
                            return;
                        }

                        if (explosion.parent) {
                            effectsContainer.removeChild(explosion);
                            explosion.destroy({ texture: false, baseTexture: false });
                        }
                    };
                    
                    effectsContainer.addChild(explosion);
                    explosion.play();
                    
                } else {
                    console.warn('Не удалось загрузить спрайт-лист ледяного взрыва');
                    createFallbackExplosion(x, y, scale, effectsContainer);
                }
            }).catch(err => {
                console.error('Ошибка загрузки спрайт-листа:', err);
                createFallbackExplosion(x, y, scale, effectsContainer);
            });
            
            // Вспышка при взрыве
            const flash = new PIXI.Graphics();
            flash.beginFill(0x00BFFF, 0.5);
            flash.drawCircle(0, 0, 25 * scale);
            flash.endFill();
            flash.x = x;
            flash.y = y;
            flash.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(flash);
            
            const flashStartTime = Date.now();
            const flashDuration = 200;
            
            const animateFlash = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!flash || flash.destroyed || !flash.transform) {
                    return;
                }

                const elapsed = Date.now() - flashStartTime;
                const progress = Math.min(elapsed / flashDuration, 1);

                flash.scale.set(1 + progress * 0.5);
                flash.alpha = 0.5 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animateFlash);
                } else {
                    if (flash.parent) {
                        effectsContainer.removeChild(flash);
                    }
                }
            };
            
            animateFlash();
            
            // Ледяные осколки
            createIceShards(x, y, scale, effectsContainer);
        }
        
        // Создание ледяных осколков
        function createIceShards(x, y, scale, container) {
            for (let i = 0; i < 6; i++) {
                const shard = new PIXI.Graphics();
                shard.beginFill(0x00BFFF, 0.8);
                shard.drawPolygon([
                    0, -3,
                    -2, 2,
                    2, 2
                ]);
                shard.endFill();
                
                shard.x = x;
                shard.y = y;
                
                container.addChild(shard);
                
                const angle = (Math.PI * 2 / 6) * i;
                const speed = 3 + Math.random() * 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                const shardStartTime = Date.now();
                const shardDuration = 500;
                
                const animateShard = () => {
                    // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                    if (!shard || shard.destroyed || !shard.transform) {
                        return;
                    }

                    const elapsed = Date.now() - shardStartTime;
                    const progress = Math.min(elapsed / shardDuration, 1);

                    shard.x += vx * (1 - progress);
                    shard.y += vy * (1 - progress) + progress * 3;
                    shard.rotation += 0.2;
                    shard.alpha = 0.8 * (1 - progress);

                    if (progress < 1 && shard.parent) {
                        requestAnimationFrame(animateShard);
                    } else {
                        if (shard.parent) {
                            container.removeChild(shard);
                        }
                    }
                };
                
                animateShard();
            }
        }
        
        // Fallback функция для взрыва
        function createFallbackExplosion(x, y, scale, effectsContainer) {
            // Простые частицы льда
            for (let i = 0; i < 8; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0x00BFFF, 0.7);
                particle.drawCircle(0, 0, 3);
                particle.endFill();
                
                particle.x = x;
                particle.y = y;
                
                effectsContainer.addChild(particle);
                
                const angle = (Math.PI * 2 / 8) * i;
                const speed = 2 + Math.random() * 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                const particleStartTime = Date.now();
                const particleDuration = 400;
                
                const animateParticle = () => {
                    // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                    if (!particle || particle.destroyed || !particle.transform) {
                        return;
                    }

                    const elapsed = Date.now() - particleStartTime;
                    const progress = Math.min(elapsed / particleDuration, 1);

                    particle.x += vx * (1 - progress);
                    particle.y += vy * (1 - progress) + progress * 2;
                    particle.alpha = 0.7 * (1 - progress);

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
        
        // Запуск анимации
        animate();
    }
    
    // Функция очистки
    function clearAll() {
        console.log('❄️ Очистка анимации Ледышки');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.icicle = {
        play: playIcicleAnimation,
        clearAll: clearAll
    };
    
    // Обертка для совместимости
    window.createIcicleProjectile = function(casterCol, casterRow, targetCol, targetRow, onComplete) {
        if (window.spellAnimations?.icicle?.play) {
            window.spellAnimations.icicle.play({
                casterCol: casterCol,
                casterRow: casterRow,
                targetCol: targetCol,
                targetRow: targetRow,
                onComplete: onComplete
            });
        } else {
            console.warn('⚠️ Анимация Ледышки недоступна');
            if (onComplete) onComplete();
        }
    };
    
    console.log('❄️ Анимация "Ледышка" зарегистрирована');
})();