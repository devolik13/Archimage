// battle/renderer/animations/fire/fireball.js

(function() {
    function playFireballAnimation(params) {
        const { casterType, casterPosition, targetCol, targetRow, level = 1, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Fireball');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        const PIXI_CONFIG = window.PIXI_CONFIG || { cellWidth: 60, cellHeight: 60 };
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать огненный шар - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Позиция кастера
        const casterCol = casterType === 'player' ? 5 : 0;
        const casterRow = casterPosition !== undefined ? casterPosition : 2;
        const casterCell = gridCells[casterCol]?.[casterRow];
        
        if (!casterCell) {
            if (onComplete) onComplete();
            return;
        }
        
        // Определяем центр взрыва
        let centerCol, centerRow;
        
        if (level === 5) {
            centerCol = casterType === 'player' ? 1 : 4;
            centerRow = 2;
        } else {
            centerCol = casterType === 'player' ? 1 : 4;
            centerRow = targetRow;
        }
        
        const centerCell = gridCells[centerCol]?.[centerRow];
        if (!centerCell) {
            if (onComplete) onComplete();
            return;
        }
        
        // Создаем летящий огненный шар
        createFlyingFireball();
        
        function createFlyingFireball() {
	    const projectile = new PIXI.Graphics();
    
	    // Внутреннее ядро - ярко-белое/желтое
	    projectile.beginFill(0xFFFF99, 0.9);
	    projectile.drawCircle(0, 0, 10);
	    projectile.endFill();
	    
	    // Средний слой - оранжевый
	    projectile.beginFill(0xFF6600, 0.7);
	    projectile.drawCircle(0, 0, 18);
	    projectile.endFill();
    
	    // Внешний слой - красный
	    projectile.beginFill(0xFF0000, 0.4);
	    projectile.drawCircle(0, 0, 25);
	    projectile.endFill();
            
            // Начальная позиция
            projectile.x = casterCell.x + casterCell.width / 2;
            projectile.y = casterCell.y + casterCell.height / 2;
            projectile.scale.set(0.5);
            projectile.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(projectile);
            
            // Целевая позиция
            const targetX = centerCell.x + centerCell.width / 2;
            const targetY = centerCell.y + centerCell.height / 2;
            
            // Анимация полета
            const duration = 600;
            const startTime = Date.now();
            
            const animateFlight = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!projectile || projectile.destroyed || !projectile.transform) {
                    createExplosion();
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Траектория с ускорением
                const easeProgress = 1 - Math.pow(1 - progress, 2);

                projectile.x = casterCell.x + casterCell.width / 2 +
                              (targetX - (casterCell.x + casterCell.width / 2)) * easeProgress;
                projectile.y = casterCell.y + casterCell.height / 2 +
                              (targetY - (casterCell.y + casterCell.height / 2)) * easeProgress;

                // Увеличиваем размер по мере приближения
                projectile.scale.set(0.5 + progress * 0.5);

                // Вращение
                projectile.rotation += 0.2;

                // След огня
                if (Math.random() > 0.7) {
                    createFireTrail(projectile.x, projectile.y);
                }

                if (progress < 1) {
                    requestAnimationFrame(animateFlight);
                } else {
                    // Удаляем снаряд и запускаем взрыв
                    if (projectile.parent) {
                        effectsContainer.removeChild(projectile);
                    }
                    if (!projectile.destroyed) {
                        projectile.destroy();
                    }
                    createExplosion();
                }
            };
            
            animateFlight();
        }
        
        function createFireTrail(x, y) {
            const trail = new PIXI.Graphics();
	    trail.beginFill(0xFF4400, 0.6);  // Красно-оранжевый
	    trail.drawCircle(0, 0, 5 + Math.random() * 5);
	    trail.endFill();
            
            trail.x = x + (Math.random() - 0.5) * 10;
            trail.y = y + (Math.random() - 0.5) * 10;
            trail.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(trail);
            
            // Исчезновение следа
            const fadeStart = Date.now();
            const fadeDuration = 400;
            
            const fade = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!trail || trail.destroyed || !trail.transform) {
                    return;
                }

                const progress = Math.min((Date.now() - fadeStart) / fadeDuration, 1);
                trail.alpha = 0.5 * (1 - progress);
                trail.scale.set(1 - progress * 0.5);

                if (progress < 1 && trail.parent) {
                    requestAnimationFrame(fade);
                } else {
                    if (trail.parent) {
                        effectsContainer.removeChild(trail);
                    }
                    if (!trail.destroyed) {
                        trail.destroy();
                    }
                }
            };
            fade();
        }
        
        function createExplosion() {
            // Загружаем спрайт-лист для взрыва
            const fireballTexturePath = 'images/spells/fire/fireball/fireball_sheet.webp';
            
            PIXI.Assets.load(fireballTexturePath).then(baseTexture => {
                if (!baseTexture) {
                    createFallbackExplosion();
                    return;
                }
                
                // Создаем кадры из спрайт-листа 3x3
                const frames = [];
                const frameWidth = Math.floor(baseTexture.width / 3);
                const frameHeight = Math.floor(baseTexture.height / 3);
                
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
                
                // Создаем анимированный спрайт взрыва
                const explosion = new PIXI.AnimatedSprite(frames);
                explosion.x = centerCell.x + centerCell.width / 2;
                explosion.y = centerCell.y + centerCell.height / 2;
                explosion.anchor.set(0.5);
                
                // Масштаб для покрытия нужной области
                let scale;
                if (level === 5) {
                    scale = (PIXI_CONFIG.cellWidth * 5) / frameWidth;
                } else {
                    scale = (PIXI_CONFIG.cellWidth * 3.5) / frameWidth;
                }
                scale *= centerCell.cellScale;
                
                explosion.scale.set(scale);
                explosion.animationSpeed = 0.25;
                explosion.loop = false;
                explosion.blendMode = PIXI.BLEND_MODES.SCREEN;
                explosion.alpha = 0.9;
                
                explosion.onComplete = () => {
                    effectsContainer.removeChild(explosion);
                    showDamageZone(centerCol, centerRow, level, casterType);
                    if (onComplete) onComplete();
                };
                
                effectsContainer.addChild(explosion);
                explosion.play();
                
                // Эффект вспышки
                createFlash(explosion.x, explosion.y, scale);
                
            }).catch(err => {
                createFallbackExplosion();
            });
        }
        
        function createFallbackExplosion() {
            const explosion = new PIXI.Graphics();
            
            explosion.beginFill(0xFF6600, 0.3);
            const radius = level === 5 ? PIXI_CONFIG.cellWidth * 2.5 : PIXI_CONFIG.cellWidth * 1.8;
            explosion.drawCircle(0, 0, radius);
            explosion.endFill();
            
            explosion.beginFill(0xFFAA00, 0.5);
            explosion.drawCircle(0, 0, radius * 0.7);
            explosion.endFill();
            
            explosion.beginFill(0xFFFF00, 0.8);
            explosion.drawCircle(0, 0, radius * 0.4);
            explosion.endFill();
            
            explosion.x = centerCell.x + centerCell.width / 2;
            explosion.y = centerCell.y + centerCell.height / 2;
            explosion.scale.set(0.1);
            
            effectsContainer.addChild(explosion);
            
            const startTime = Date.now();
            const duration = 600;
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(explosion)) return;

                const progress = Math.min((Date.now() - startTime) / duration, 1);

                const targetScale = level === 5 ? 2.0 : 1.5;
                explosion.scale.set(0.1 + progress * centerCell.cellScale * targetScale);
                explosion.alpha = (1 - progress * 0.5);
                explosion.rotation += 0.1;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    effectsContainer.removeChild(explosion);
                    showDamageZone(centerCol, centerRow, level, casterType);
                    if (onComplete) onComplete();
                }
            };
            animate();
        }
        
        function createFlash(x, y, scale) {
            const flash = new PIXI.Graphics();
            flash.beginFill(0xFFFFFF, 0.6);
            flash.drawCircle(0, 0, 150);
            flash.endFill();
            flash.x = x;
            flash.y = y;
            flash.scale.set(scale * 0.5);
            flash.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(flash);
            
            const startTime = Date.now();
            const duration = 150;
            
            const animateFlash = () => {
                if (!window.pixiAnimUtils.isValid(flash)) return;

                const progress = Math.min((Date.now() - startTime) / duration, 1);

                flash.scale.set(scale * 0.5 * (1 + progress));
                flash.alpha = 0.6 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animateFlash);
                } else {
                    effectsContainer.removeChild(flash);
                }
            };
            animateFlash();
        }
        
        function showDamageZone(centerCol, centerRow, level, casterType) {
            const zone = new PIXI.Graphics();
            zone.beginFill(0xFF0000, 0.2);
            
            if (level === 5) {
                const startCol = casterType === 'player' ? 0 : 3;
                const endCol = casterType === 'player' ? 2 : 5;
                
                for (let col = startCol; col <= endCol; col++) {
                    for (let row = 0; row < 5; row++) {
                        const cell = gridCells[col]?.[row];
                        if (cell) {
                            zone.drawRect(cell.x, cell.y, cell.width, cell.height);
                        }
                    }
                }
            } else {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const col = centerCol + dx;
                        const row = centerRow + dy;
                        if (col >= 0 && col < 6 && row >= 0 && row < 5) {
                            const cell = gridCells[col]?.[row];
                            if (cell) {
                                zone.drawRect(cell.x, cell.y, cell.width, cell.height);
                            }
                        }
                    }
                }
            }
            
            zone.endFill();
            effectsContainer.addChild(zone);
            
            setTimeout(() => {
                const fadeStart = Date.now();
                const fadeDuration = 1000;
                
                const fade = () => {
                    if (!window.pixiAnimUtils.isValid(zone)) return;

                    const progress = Math.min((Date.now() - fadeStart) / fadeDuration, 1);
                    zone.alpha = 0.2 * (1 - progress);

                    if (progress < 1) {
                        requestAnimationFrame(fade);
                    } else {
                        effectsContainer.removeChild(zone);
                    }
                };
                fade();
            }, 100);
        }
    }
    
    // Регистрация модуля
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.fireball = {
        play: playFireballAnimation
    };
    
    console.log('🔥 Анимация "Огненный шар" зарегистрирована');
})();