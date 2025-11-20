// battle/renderer/animations/wind/gust.js - Анимация заклинания "Порыв ветра"
console.log('✅ gust.js загружен');

(function() {
    // Хранилище активных снарядов
    const activeGustProjectiles = [];
    
    function playGustAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onHit } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Порыв ветра');
            if (onHit) onHit();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать Порыв ветра - нет контейнера');
            if (onHit) onHit();
            return;
        }
        
        const casterCell = gridCells[casterCol]?.[casterRow];
        const targetCell = gridCells[targetCol]?.[targetRow];
        
        if (!casterCell || !targetCell) {
            console.warn('Не найдены ячейки для Порыва ветра');
            if (onHit) onHit();
            return;
        }
        
        const startX = casterCell.x + casterCell.width / 2;
        const startY = casterCell.y + casterCell.height / 2;
        const endX = targetCell.x + targetCell.width / 2;
        const endY = targetCell.y + targetCell.height / 2;
        
        // Загружаем спрайт-лист
        const gustTexturePath = 'images/spells/wind/gust/gust_spritesheet.png';
        
        PIXI.Assets.load(gustTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру Порыва ветра');
                createFallbackGust(startX, startY, endX, endY, effectsContainer, onHit);
                return;
            }
            
            // Спрайт-лист 768x768, 2 колонки × 4 ряда = 8 кадров
            const frameWidth = 768 / 2;  // 384px
            const frameHeight = 768 / 4; // 192px
            const cols = 2;
            const rows = 4;
            const totalFrames = 8;
            
            // Создаем текстуры из спрайт-листа
            const gustTextures = [];
            for (let i = 0; i < totalFrames; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                const rect = new PIXI.Rectangle(
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                
                const frameTexture = new PIXI.Texture(texture.baseTexture, rect);
                gustTextures.push(frameTexture);
            }
            
            console.log(`💨 Загружено ${gustTextures.length} кадров для Порыва ветра`);
            
            // Создаем анимированный спрайт
            const gustSprite = new PIXI.AnimatedSprite(gustTextures);
            gustSprite.x = startX;
            gustSprite.y = startY;
            gustSprite.anchor.set(0.5);
            
            // Масштабируем под размер ячейки
            const targetSize = casterCell.cellScale * 50; // Размер снаряда
            const scale = targetSize / frameHeight;
            gustSprite.scale.set(scale);
            
            // Поворачиваем в сторону цели
            const angle = Math.atan2(endY - startY, endX - startX);
            gustSprite.rotation = angle;
            
            gustSprite.animationSpeed = 0.3;
            gustSprite.loop = true;
            gustSprite.play();
            
            // Эффект для ветра
            gustSprite.blendMode = PIXI.BLEND_MODES.NORMAL;
            gustSprite.tint = 0xCCFFFF;
            gustSprite.alpha = 0.9;
            
            effectsContainer.addChild(gustSprite);
            
            // Анимация полёта
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            const duration = Math.max(300, distance * 2); // Скорость полёта
            const startTime = Date.now();
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(gustSprite)) return;
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Линейное движение
                gustSprite.x = startX + (endX - startX) * progress;
                gustSprite.y = startY + (endY - startY) * progress;
                
                // Лёгкое покачивание для эффекта ветра
                const wobble = Math.sin(progress * Math.PI * 4) * 3;
                gustSprite.y += wobble;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Попадание
                    if (gustSprite.parent) {
                        effectsContainer.removeChild(gustSprite);
                        gustSprite.destroy();
                    }
                    
                    // Эффект попадания
                    createGustImpact(endX, endY, effectsContainer, casterCell.cellScale);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            
            // Сохраняем снаряд
            activeGustProjectiles.push(gustSprite);
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры Порыва ветра:', err);
            createFallbackGust(startX, startY, endX, endY, effectsContainer, onHit);
        });
    }
    
    // Fallback - простая графика если текстура не загрузилась
    function createFallbackGust(startX, startY, endX, endY, effectsContainer, onHit) {
        const projectile = new PIXI.Graphics();
        
        // Рисуем стрелу ветра
        projectile.beginFill(0xCCFFFF, 0.8);
        projectile.drawPolygon([
            -20, -5,
            20, 0,
            -20, 5
        ]);
        projectile.endFill();
        
        projectile.x = startX;
        projectile.y = startY;
        
        // Поворот
        const angle = Math.atan2(endY - startY, endX - startX);
        projectile.rotation = angle;
        
        effectsContainer.addChild(projectile);
        
        // Анимация полёта
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const duration = Math.max(300, distance * 2);
        const startTime = Date.now();
        
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(projectile)) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            projectile.x = startX + (endX - startX) * progress;
            projectile.y = startY + (endY - startY) * progress;
            
            // Покачивание
            const wobble = Math.sin(progress * Math.PI * 4) * 3;
            projectile.y += wobble;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (projectile.parent) {
                    effectsContainer.removeChild(projectile);
                }
                
                createGustImpact(endX, endY, effectsContainer, 1);
                
                if (onHit) onHit();
            }
        };
        
        animate();
        
        activeGustProjectiles.push(projectile);
    }
    
    // Эффект попадания
    function createGustImpact(x, y, container, scale) {
        // Круговая волна
        const impactWave = new PIXI.Graphics();
        impactWave.lineStyle(3, 0xCCFFFF, 0.8);
        impactWave.drawCircle(0, 0, 5 * scale);
        impactWave.x = x;
        impactWave.y = y;
        
        container.addChild(impactWave);
        
        const startTime = Date.now();
        const duration = 400;
        
        const animateWave = () => {
            if (!window.pixiAnimUtils.isValid(impactWave)) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            impactWave.clear();
            impactWave.lineStyle(3 * (1 - progress), 0xCCFFFF, 0.8 * (1 - progress));
            impactWave.drawCircle(0, 0, (5 + progress * 30) * scale);

            if (progress < 1 && impactWave.parent) {
                requestAnimationFrame(animateWave);
            } else {
                if (impactWave.parent) {
                    container.removeChild(impactWave);
                }
            }
        };
        animateWave();
        
        // Частицы ветра
        createWindParticles(x, y, scale, container);
    }
    
    // Частицы ветра при попадании
    function createWindParticles(x, y, scale, container, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xCCFFFF, 0.9);
            particle.drawCircle(0, 0, 2 * scale);
            particle.endFill();
            particle.x = x;
            particle.y = y;
            
            container.addChild(particle);
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const startTime = Date.now();
            const duration = 500;
            
            const animateParticle = () => {
                if (!window.pixiAnimUtils.isValid(particle)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                particle.x += vx;
                particle.y += vy;
                particle.alpha = 1 - progress;

                if (progress < 1 && particle.parent) {
                    requestAnimationFrame(animateParticle);
                } else {
                    if (particle.parent) {
                        container.removeChild(particle);
                    }
                }
            };
            animateParticle();
        }
    }
    
    // Очистка всех снарядов
    function clearAll() {
        activeGustProjectiles.forEach(projectile => {
            if (projectile && projectile.parent) {
                projectile.parent.removeChild(projectile);
                projectile.destroy && projectile.destroy();
            }
        });
        activeGustProjectiles.length = 0;
        console.log('💨 Все снаряды Порыва ветра очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.gust = {
        play: playGustAnimation,
        clearAll: clearAll
    };
    
    // Экспорт для совместимости
    window.createGustProjectile = playGustAnimation;
    
    console.log('💨 Анимация "Порыв ветра" зарегистрирована');
})();