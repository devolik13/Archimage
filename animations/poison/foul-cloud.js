// battle/renderer/animations/poison/foul-cloud.js - Анимация заклинания "Мерзкое облако"
console.log('✅ foul-cloud.js загружен');

(function() {
    // Хранилище активных облаков
    let activeFoulClouds = [];
    
    function playFoulCloudAnimation(params) {
    	const { casterCol, casterRow, targetCol, targetRow, damage, duration = 8000 } = params;

        console.log('☠️ playFoulCloudAnimation ВЫЗВАНА с параметрами:', params);

    	// КРИТИЧНО: При быстрой симуляции пропускаем анимацию
    	if (window.fastSimulation) {
    	    console.log('⚡ Быстрая симуляция: пропуск анимации Мерзкое облако');
    	    return;
    	}

    	const effectsContainer = window.pixiCore?.getEffectsContainer();
    	const gridCells = window.pixiCore?.getGridCells();

    	if (!effectsContainer || !gridCells) {
    	    console.warn('☠️ Не могу создать мерзкое облако - нет контейнера или сетки', { effectsContainer: !!effectsContainer, gridCells: !!gridCells });
    	    return;
    	}

        console.log('☠️ Контейнеры найдены, создаем облака для колонки', targetCol);
    
    	// ИЗМЕНЕНО: Создаём облако для всех клеток в колонке
    	for (let row = 0; row < 5; row++) {
    	    const targetCell = gridCells[targetCol]?.[row];
    	    if (!targetCell) continue;
        
    	    console.log('☠️ Создаем мерзкое облако на позиции', targetCol, row);
        
    	    // Контейнер для облака в этой клетке
    	    const cloudContainer = new PIXI.Container();
    	    cloudContainer.x = targetCell.x + targetCell.width / 2;
    	    cloudContainer.y = targetCell.y + targetCell.height / 2;
        
    	    // Загружаем спрайт и частицы
    	    loadCloudSprite(cloudContainer, targetCell.cellScale);
    	    createPoisonParticles(cloudContainer, targetCell.cellScale);
        
    	    effectsContainer.addChild(cloudContainer);
    	    
    	    // Анимация с небольшой задержкой для каждого ряда
    	    const rowDelay = row * 100; // Задержка для волнового эффекта
    	    
    	    cloudContainer.scale.set(0.3);
    	    cloudContainer.alpha = 0;
    	    
    	    const startTime = Date.now() + rowDelay;
    	    let isActive = true;
    	    
    	    const animate = () => {
    	        if (!isActive || !window.pixiAnimUtils.isValid(cloudContainer)) return;
    	        
    	        const elapsed = Date.now() - startTime;
    	        if (elapsed < 0) {
    	            requestAnimationFrame(animate);
    	            return;
    	        }
    	        
    	        // Фаза появления
    	        if (elapsed < 1000) {
    	            const progress = elapsed / 1000;
    	            cloudContainer.scale.set(0.3 + progress * 0.7);
    	            cloudContainer.alpha = progress * 0.6; // Уменьшаем прозрачность для множественных облаков
    	        }
    	        // Основная фаза
    	        else if (elapsed < duration - 1000) {
    	            const pulse = Math.sin(elapsed * 0.002) * 0.1;
    	            cloudContainer.scale.set(1 + pulse);
    	            cloudContainer.rotation += 0.001;
    	        }
    	        // Фаза исчезновения
    	        else if (elapsed < duration) {
    	            const fadeProgress = (elapsed - (duration - 1000)) / 1000;
    	            cloudContainer.alpha = 0.6 * (1 - fadeProgress);
    	            cloudContainer.scale.set(1 + fadeProgress * 0.3);
    	        }
    	        // Удаление
    	        else {
    	            isActive = false;
    	            if (cloudContainer.parent) {
    	                effectsContainer.removeChild(cloudContainer);
    	            }
    	            activeFoulClouds = activeFoulClouds.filter(c => c !== cloudContainer);
    	            return;
    	        }
    	        
    	        requestAnimationFrame(animate);
    	    };
    	    
    	    animate();
    	    activeFoulClouds.push(cloudContainer);
    	}
    	
    	// Эффект урона по всей колонке
    	createDamageArea(targetCol, null, damage, duration); // null для всей колонки
    }	
    
    // Загрузка спрайт-листа облака
    function loadCloudSprite(container, scale) {
        // Пытаемся создать анимированный спрайт из атласа
        const cloudTexturePath = 'images/spells/poison/foul_cloud/cloud.png';

        console.log('☠️ Загрузка текстуры облака:', cloudTexturePath);

        // Создаем спрайт-лист программно
        PIXI.Assets.load(cloudTexturePath).then(texture => {
            console.log('☠️ Текстура загружена:', { valid: texture?.valid, width: texture?.width, height: texture?.height });

            if (!texture || !texture.valid) {
                console.warn('☠️ Не удалось загрузить текстуру облака, используем fallback');
                createFallbackCloud(container, scale);
                return;
            }

            // Изображение 500x500, делим на сетку 3x3
            const frames = [];
            const frameWidth = Math.floor(500 / 3);  // ~166
            const frameHeight = Math.floor(500 / 3); // ~166

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const frame = new PIXI.Texture(
                        texture.baseTexture,
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

            console.log('☠️ Создано кадров:', frames.length);

            // Создаем анимированный спрайт
            const cloudSprite = new PIXI.AnimatedSprite(frames);
            cloudSprite.anchor.set(0.5);
            cloudSprite.scale.set(scale * 0.8);
            cloudSprite.animationSpeed = 0.15;
            cloudSprite.loop = true;
            cloudSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
            cloudSprite.alpha = 0.6;
            cloudSprite.tint = 0x669900;
            cloudSprite.play();

            container.addChild(cloudSprite);

            console.log('☠️ Спрайт облака загружен и анимирован');
        }).catch(err => {
            console.warn('☠️ Ошибка загрузки спрайта облака:', err);
            createFallbackCloud(container, scale);
        });
    }
    
    // Fallback - рисуем облако программно
    function createFallbackCloud(container, scale) {
        const cloud = new PIXI.Graphics();
        
        // Рисуем несколько кругов для создания облака
        cloud.beginFill(0x669900, 0.3);
        cloud.drawCircle(0, 0, 60 * scale);
        cloud.drawCircle(-30 * scale, -10 * scale, 40 * scale);
        cloud.drawCircle(30 * scale, -10 * scale, 40 * scale);
        cloud.drawCircle(-20 * scale, 20 * scale, 35 * scale);
        cloud.drawCircle(20 * scale, 20 * scale, 35 * scale);
        cloud.endFill();
        
        cloud.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        
        container.addChild(cloud);
        
        // Анимация пульсации
        const pulseAnimation = () => {
            if (!cloud.parent) return;
            
            const time = Date.now() * 0.001;
            cloud.scale.set(1 + Math.sin(time * 2) * 0.1);
            cloud.alpha = 0.3 + Math.sin(time * 3) * 0.1;
            
            requestAnimationFrame(pulseAnimation);
        };
        
        pulseAnimation();
    }
    
    // Создание частиц яда
    function createPoisonParticles(container, scale) {
        const particleContainer = new PIXI.Container();
        const particles = [];
        
        // Создаем 20-30 частиц
        const particleCount = 20 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            
            // Случайный размер и оттенок
            const size = (Math.random() * 8 + 4) * scale;
            const tint = Math.random() > 0.5 ? 0x84CC16 : 0x669900;
            
            particle.beginFill(tint, 0.4);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            // Случайное начальное положение
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 50 * scale;
            particle.x = Math.cos(angle) * radius;
            particle.y = Math.sin(angle) * radius;
            
            // Случайная скорость
            particle.vx = (Math.random() - 0.5) * 0.5;
            particle.vy = (Math.random() - 0.5) * 0.5 - 0.2; // Небольшой подъем вверх
            particle.life = Math.random();
            particle.maxLife = particle.life;
            
            particles.push(particle);
            particleContainer.addChild(particle);
        }
        
        container.addChild(particleContainer);
        
        // Анимация частиц
        const animateParticles = () => {
            if (!window.pixiAnimUtils.isValid(particleContainer)) return;
            
            particles.forEach(particle => {
                // Движение
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Затухание
                particle.life -= 0.005;
                particle.alpha = (particle.life / particle.maxLife) * 0.4;
                
                // Респавн частицы
                if (particle.life <= 0) {
                    particle.life = 1;
                    particle.maxLife = 1;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 30 * scale;
                    particle.x = Math.cos(angle) * radius;
                    particle.y = Math.sin(angle) * radius;
                    particle.vx = (Math.random() - 0.5) * 0.5;
                    particle.vy = (Math.random() - 0.5) * 0.5 - 0.2;
                }
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
    
    // Создание области урона
    function createDamageArea(col, row, damage, duration) {
        // Интеграция с игровой логикой
        if (window.activeEffectZones) {
            const zone = {
                id: `foul_cloud_${Date.now()}`,
                type: 'foul_cloud',
                col: col,
                row: row,
                damage: damage,
                duration: duration,
                createdAt: Date.now()
            };
            
            window.activeEffectZones.push(zone);
            
            // Удаляем зону после окончания
            setTimeout(() => {
                const index = window.activeEffectZones.indexOf(zone);
                if (index > -1) {
                    window.activeEffectZones.splice(index, 1);
                }
            }, duration);
        }
    }
    
    // Очистка всех облаков
    function clearFoulClouds() {
        activeFoulClouds.forEach(cloud => {
            if (cloud.parent) {
                cloud.parent.removeChild(cloud);
                cloud.destroy({ children: true });
            }
        });
        activeFoulClouds = [];
    }
    
    // Регистрация модуля
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.foul_cloud = {
        play: playFoulCloudAnimation,
        clear: clearFoulClouds
    };
    
    console.log('☠️ Анимация "Мерзкое облако" зарегистрирована');
})();