// battle/renderer/animations/poison/poisoned_blade.js - Анимация заклинания "Ядовитый клинок"

(function() {
    // Хранилище активных клинков
    const activeBlades = [];
    
    function playPoisonedBladeAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onHit } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Ядовитый клинок');
            if (onHit) onHit();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать клинок - нет контейнера');
            if (onHit) onHit();
            return;
        }
        
        const casterCell = gridCells[casterCol]?.[casterRow];
        const targetCell = gridCells[targetCol]?.[targetRow];
        
        if (!casterCell || !targetCell) {
            console.warn('Не найдены ячейки для клинка');
            if (onHit) onHit();
            return;
        }
        
        const startX = casterCell.x + casterCell.width / 2;
        const startY = casterCell.y + casterCell.height / 2;
        const endX = targetCell.x + targetCell.width / 2;
        const endY = targetCell.y + targetCell.height / 2;
        
        // Загружаем текстуру клинка
        const bladeTexturePath = 'images/spells/poison/poisoned_blade/blade_sprite.webp';
        
        PIXI.Assets.load(bladeTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру клинка');
                createFallbackBlade();
                return;
            }
            
            // Создаем спрайт клинка 768×512
            const bladeSprite = new PIXI.Sprite(texture);
            bladeSprite.x = startX;
            bladeSprite.y = startY;
            bladeSprite.anchor.set(0.5);
            
            // Масштабируем клинок
            const targetSize = casterCell.cellScale * 50; // Размер клинка
            const scale = targetSize / 768; // Исходная ширина 768px
            bladeSprite.scale.set(scale);
            
            // Поворачиваем клинок в направлении цели
            const angle = Math.atan2(endY - startY, endX - startX);
	    bladeSprite.rotation = angle;


	    if (casterCol === 5) {
	    bladeSprite.scale.y = -bladeSprite.scale.y; // Переворот
	    }

            // Зеленоватый оттенок
            bladeSprite.tint = 0xAAFFAA;
            
            effectsContainer.addChild(bladeSprite);
            
            // Создаём ядовитый след
            const trail = createPoisonTrail(effectsContainer, casterCell.cellScale);
            
            // Анимация полёта
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            const duration = Math.max(300, distance * 1.2); // Быстрее камешка
            const startTime = Date.now();
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(bladeSprite)) return;
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Прямая траектория с ускорением
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                bladeSprite.x = startX + (endX - startX) * easeProgress;
                bladeSprite.y = startY + (endY - startY) * easeProgress;
                
                // Легкая вибрация клинка (без вращения)
                const vibration = Math.sin(elapsed * 0.03) * 0.05;
                bladeSprite.rotation = angle + vibration;
                
                // Обновляем след
                updatePoisonTrail(trail, bladeSprite.x, bladeSprite.y, progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Удаляем клинок
                    if (bladeSprite.parent) {
                        effectsContainer.removeChild(bladeSprite);
                        bladeSprite.destroy();
                    }
                    
                    // Очищаем след
                    clearPoisonTrail(trail, effectsContainer);
                    
                    // Эффект попадания
                    createPoisonImpact(endX, endY, casterCell.cellScale);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activeBlades.push({ sprite: bladeSprite, trail: trail });
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры клинка:', err);
            createFallbackBlade();
        });
        
        // Fallback - простая графика
        function createFallbackBlade() {
            const blade = new PIXI.Graphics();
            
            // Рисуем клинок
            blade.beginFill(0x33AA33, 1);
            blade.drawRect(-20, -3, 40, 6); // Горизонтальный клинок
            blade.endFill();
            
            // Острие
            blade.beginFill(0x33AA33, 1);
            blade.moveTo(20, -3);
            blade.lineTo(25, 0);
            blade.lineTo(20, 3);
            blade.closePath();
            blade.endFill();
            
            // Ядовитое свечение
            blade.beginFill(0x88FF88, 0.4);
            blade.drawRect(-20, -5, 40, 10);
            blade.endFill();
            
            blade.x = startX;
            blade.y = startY;
            
            // Поворот к цели
            const angle = Math.atan2(endY - startY, endX - startX);
	    blade.rotation = casterCol === 5 ? angle + Math.PI : angle;
            
            effectsContainer.addChild(blade);
            
            // Анимация
            const duration = window.getScaledDuration ? window.getScaledDuration(400) : 400;
            const startTime = Date.now();
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(blade)) return;
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Прямая траектория
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                blade.x = startX + (endX - startX) * easeProgress;
                blade.y = startY + (endY - startY) * easeProgress;
                
                // Легкая вибрация
                const vibration = Math.sin(elapsed * 0.03) * 0.05;
                blade.rotation = angle + vibration;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (blade.parent) {
                        effectsContainer.removeChild(blade);
                    }
                    
                    createPoisonImpact(endX, endY, 1);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activeBlades.push({ sprite: blade, trail: null });
        }
    }
    
    // Создание ядовитого следа
    function createPoisonTrail(container, scale) {
        const trail = [];
        const trailLength = 6;
        
        for (let i = 0; i < trailLength; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x33FF33, 0.6 - i * 0.1);
            particle.drawCircle(0, 0, (6 - i) * scale);
            particle.endFill();
            particle.visible = false;
            container.addChild(particle);
            trail.push(particle);
        }
        
        return trail;
    }
    
    // Обновление следа
    function updatePoisonTrail(trail, x, y, progress) {
        if (!trail || trail.length === 0) return;
        
        trail.forEach((particle, index) => {
            if (progress > index * 0.05) {
                particle.visible = true;
                particle.x = x - (index + 1) * 10;
                particle.y = y;
                particle.alpha = (0.6 - index * 0.1) * (1 - progress * 0.3);
            }
        });
    }
    
    // Очистка следа
    function clearPoisonTrail(trail, container) {
        if (!trail) return;
        trail.forEach(particle => {
            if (particle.parent) {
                container.removeChild(particle);
            }
        });
    }
    
    // Эффект попадания ядовитого клинка
    function createPoisonImpact(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Брызги яда
        const splash = new PIXI.Graphics();
        splash.beginFill(0x33FF33, 0.8);
        splash.drawCircle(0, 0, 25 * scale);
        splash.endFill();
        
        splash.beginFill(0x88FF88, 0.5);
        splash.drawCircle(0, 0, 15 * scale);
        splash.endFill();
        
        splash.x = x;
        splash.y = y;
        splash.scale.set(0.1);
        
        effectsContainer.addChild(splash);
        
        // Анимация брызг
        const splashStart = Date.now();
        const splashDuration = 300;
        
        const animateSplash = () => {
            if (!window.pixiAnimUtils.isValid(splash)) return;

            const progress = Math.min((Date.now() - splashStart) / splashDuration, 1);
            splash.scale.set(0.1 + progress * 1.2);
            splash.alpha = 0.8 * (1 - progress);

            if (progress < 1 && splash.parent) {
                requestAnimationFrame(animateSplash);
            } else {
                if (splash.parent) effectsContainer.removeChild(splash);
            }
        };
        animateSplash();
        
        // Ядовитые капли
        createPoisonDroplets(x, y, scale, 8);
        
        // Зеленый дым
        createPoisonSmoke(x, y, scale);
    }
    
    // Ядовитые капли
    function createPoisonDroplets(x, y, scale, count = 8) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < count; i++) {
            const droplet = new PIXI.Graphics();
            droplet.beginFill(0x33FF33, 0.9);
            droplet.drawCircle(0, 0, 3 * scale);
            droplet.endFill();
            
            droplet.x = x;
            droplet.y = y;
            
            effectsContainer.addChild(droplet);
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1;
            
            const startTime = Date.now();
            const duration = window.getScaledDuration ? window.getScaledDuration(400) : 400;
            
            const animateDroplet = () => {
                if (!window.pixiAnimUtils.isValid(droplet)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                droplet.x += vx * (1 - progress);
                droplet.y += vy * (1 - progress) + progress * 4; // Падение
                droplet.alpha = 0.9 * (1 - progress);
                
                if (progress < 1 && droplet.parent) {
                    requestAnimationFrame(animateDroplet);
                } else {
                    if (droplet.parent) effectsContainer.removeChild(droplet);
                }
            };
            animateDroplet();
        }
    }
    
    // Ядовитый дым
    function createPoisonSmoke(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < 3; i++) {
            const smoke = new PIXI.Graphics();
            smoke.beginFill(0x33AA33, 0.4);
            smoke.drawCircle(0, 0, 20 * scale);
            smoke.endFill();
            
            smoke.x = x + (Math.random() - 0.5) * 15;
            smoke.y = y + (Math.random() - 0.5) * 15;
            smoke.scale.set(0.1);
            
            effectsContainer.addChild(smoke);
            
            const startTime = Date.now();
            const duration = window.getScaledDuration ? window.getScaledDuration(500) : 500;
            const vx = (Math.random() - 0.5) * 1;
            const vy = -1 - Math.random() * 1.5;
            
            const animateSmoke = () => {
                if (!window.pixiAnimUtils.isValid(smoke)) return;

                const progress = Math.min((Date.now() - startTime) / duration, 1);

                smoke.x += vx;
                smoke.y += vy;
                smoke.scale.set(0.1 + progress * 1);
                smoke.alpha = 0.4 * (1 - progress);
                
                if (progress < 1 && smoke.parent) {
                    requestAnimationFrame(animateSmoke);
                } else {
                    if (smoke.parent) effectsContainer.removeChild(smoke);
                }
            };
            
            setTimeout(() => animateSmoke(), i * 80);
        }
    }
    
    // Очистка всех клинков
    function clearAll() {
        activeBlades.forEach(blade => {
            if (blade.sprite && blade.sprite.parent) {
                blade.sprite.parent.removeChild(blade.sprite);
                blade.sprite.destroy && blade.sprite.destroy();
            }
            
            if (blade.trail) {
                blade.trail.forEach(particle => {
                    if (particle && particle.parent) {
                        particle.parent.removeChild(particle);
                    }
                });
            }
        });
        activeBlades.length = 0;
        console.log('🗡️ Все клинки очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.poisoned_blade = {
        play: playPoisonedBladeAnimation,
        clearAll: clearAll
    };
    
    console.log('🗡️ Анимация "Ядовитый клинок" зарегистрирована');
})();