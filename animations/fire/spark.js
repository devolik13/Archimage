// battle/renderer/animations/fire/spark.js - Анимация заклинания "Искра"
console.log('✅ spark.js загружен');

(function() {
    // Изолированный модуль для Искры
    
    function playSparkAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Spark');
            if (onComplete) onComplete();
            return;
        }

        // Получаем необходимые объекты из ядра
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать искру - нет контейнера или сетки');
            if (onComplete) onComplete();
            return;
        }
        
        const startCell = gridCells[casterCol]?.[casterRow];
        const endCell = gridCells[targetCol]?.[targetRow];
        
        if (!startCell || !endCell) {
            console.warn('Не могу создать искру - нет данных ячеек');
            if (onComplete) onComplete();
            return;
        }
        
        // Создаем красный огненный шарик
        const projectile = new PIXI.Graphics();
        projectile.beginFill(0xFF0000, 0.9);  // Красный цвет
        projectile.drawCircle(0, 0, 4);       // Меньший размер
        projectile.endFill();
        
        // Добавляем свечение
        projectile.beginFill(0xFF6600, 0.3);  // Оранжевое свечение
        projectile.drawCircle(0, 0, 7);       // Чуть меньше
        projectile.endFill();
        
        // Начальная позиция
        projectile.x = startCell.x + startCell.width / 2;
        projectile.y = startCell.y + startCell.height / 2;
        
        effectsContainer.addChild(projectile);
        
        // Целевая позиция
        const targetX = endCell.x + endCell.width / 2;
        const targetY = endCell.y + endCell.height / 2;
        
        // Параметры анимации
        const duration = 400;
        const startTime = Date.now();
        let animationFrame = null;
        let isDestroyed = false;
        
        // Функция анимации
        const animate = () => {
            // Проверка что объекты еще существуют
            if (isDestroyed || !window.pixiAnimUtils.isValid(projectile) || !effectsContainer) {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                if (projectile && projectile.parent) {
                    try {
                        effectsContainer.removeChild(projectile);
                    } catch (e) {
                        // Игнорируем если уже удален
                    }
                }
                if (onComplete) onComplete();
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Интерполяция позиции
            try {
                projectile.x = startCell.x + startCell.width / 2 + 
                              (targetX - (startCell.x + startCell.width / 2)) * progress;
                projectile.y = startCell.y + startCell.height / 2 + 
                              (targetY - (startCell.y + startCell.height / 2)) * progress;
                projectile.rotation += 0.3;
                
                // След от искры
                if (Math.random() > 0.7) {
                    createSparkTrail(projectile.x, projectile.y);
                }
            } catch (e) {
                isDestroyed = true;
                if (onComplete) onComplete();
                return;
            }
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Удаляем снаряд
                if (projectile.parent && effectsContainer) {
                    try {
                        effectsContainer.removeChild(projectile);
                    } catch (e) {
                        // Игнорируем если уже удален
                    }
                }
                
                // Создаем взрыв
                createSparkExplosion(targetX, targetY, endCell.cellScale);
                
                if (onComplete) onComplete();
            }
        };
        
        // Создание следа
        function createSparkTrail(x, y) {
            const trail = new PIXI.Graphics();
            trail.beginFill(0xFF4500, 0.5);  // Красно-оранжевый след
            trail.drawCircle(0, 0, 2);
            trail.endFill();
            
            trail.x = x;
            trail.y = y;
            
            effectsContainer.addChild(trail);
            
            // Исчезновение следа
            const fadeStartTime = Date.now();
            const fadeDuration = 300;
            
            const fadeAnimate = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!trail || trail.destroyed || !trail.transform) {
                    return;
                }

                const elapsed = Date.now() - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);

                trail.alpha = 0.5 * (1 - progress);
                trail.scale.set(1 - progress * 0.5);

                if (progress < 1 && trail.parent) {
                    requestAnimationFrame(fadeAnimate);
                } else {
                    if (trail.parent) {
                        effectsContainer.removeChild(trail);
                    }
                    if (!trail.destroyed) {
                        trail.destroy();
                    }
                }
            };
            
            fadeAnimate();
        }

        // Создание взрыва с использованием спрайт-листа PNG
        function createSparkExplosion(x, y, scale = 1) {
            const effectsContainer = window.pixiCore?.getEffectsContainer();
            if (!effectsContainer) return;

            // Путь к вашему спрайт-листу взрыва
            const explosionSheetPath = 'images/spells/fire/spark/explosion_sheet.png';
            
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
                    explosion.scale.set(scale * 0.3); // Подберите масштаб под размер клетки
                    explosion.animationSpeed = 0.4;   // Скорость анимации
                    explosion.loop = false;
                    
                    explosion.onComplete = () => {
                        if (explosion.parent) {
                            effectsContainer.removeChild(explosion);
                            explosion.destroy({ texture: false, baseTexture: false });
                        }
                    };
                    
                    effectsContainer.addChild(explosion);
                    explosion.play();
                    
                } else {
                    console.warn('Не удалось загрузить спрайт-лист взрыва');
                    createFallbackExplosion(x, y, scale, effectsContainer);
                }
            }).catch(err => {
                console.error('Ошибка загрузки спрайт-листа:', err);
                createFallbackExplosion(x, y, scale, effectsContainer);
            });
            
            // Вспышка при взрыве (опционально)
            const flash = new PIXI.Graphics();
            flash.beginFill(0xFFFF00, 0.6);
            flash.drawCircle(0, 0, 30 * scale);
            flash.endFill();
            flash.x = x;
            flash.y = y;
            flash.blendMode = PIXI.BLEND_MODES.ADD;
            
            effectsContainer.addChild(flash);
            
            const flashStartTime = Date.now();
            const flashDuration = 200;
            
            const animateFlash = () => {
                if (!window.pixiAnimUtils.isValid(flash)) return;

                const elapsed = Date.now() - flashStartTime;
                const progress = Math.min(elapsed / flashDuration, 1);

                flash.scale.set(1 + progress);
                flash.alpha = 0.6 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animateFlash);
                } else {
                    if (flash.parent) {
                        effectsContainer.removeChild(flash);
                    }
                }
            };
            
            animateFlash();
        }
        
        // Fallback функция для взрыва без спрайта
        function createFallbackExplosion(x, y, scale, effectsContainer) {
            // Простой взрыв частицами когда спрайт недоступен
            for (let i = 0; i < 8; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFF4500, 0.8);
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
                    if (!window.pixiAnimUtils.isValid(particle)) return;

                    const elapsed = Date.now() - particleStartTime;
                    const progress = Math.min(elapsed / particleDuration, 1);

                    particle.x += vx * (1 - progress);
                    particle.y += vy * (1 - progress) + progress * 2;
                    particle.alpha = 0.8 * (1 - progress);

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
        console.log('🔥 Очистка анимации Искры');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.spark = {
        play: playSparkAnimation,
        clearAll: clearAll
    };
    
    console.log('🔥 Анимация "Искра" зарегистрирована');
    
    // Обертка для совместимости со старым API
    window.createSparkProjectile = function(casterCol, casterRow, targetCol, targetRow, onComplete) {
        if (window.spellAnimations?.spark?.play) {
            window.spellAnimations.spark.play({
                casterCol: casterCol,
                casterRow: casterRow,
                targetCol: targetCol,
                targetRow: targetRow,
                onComplete: onComplete
            });
        } else {
            console.warn('⚠️ Анимация Искры недоступна');
            if (onComplete) onComplete();
        }
    };
    
    console.log('🔥 createSparkProjectile обертка создана');

})();