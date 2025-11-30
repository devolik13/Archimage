// battle/renderer/animations/nature/bark-armor.js

(function() {
    // Хранилище активных эффектов коры
    const activeBarkEffects = new Map();
    
    function playBarkArmorAnimation(params) {
        const { casterType, casterPosition, targetWizard, level = 1, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Древесная кора');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать эффект коры - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Определяем позицию мага
        const wizardCol = casterType === 'player' ? 5 : 0;
        const wizardCell = gridCells[wizardCol]?.[casterPosition];
        
        if (!wizardCell) {
            if (onComplete) onComplete();
            return;
        }
        
        // Находим спрайт мага для позиционирования
        const wizardSprite = window.wizardSprites?.[`${wizardCol}_${casterPosition}`];
        const targetX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
        const targetY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);
        
        // Удаляем старый эффект если есть
        const existingEffectKey = `${casterType}_${casterPosition}`;
        if (activeBarkEffects.has(existingEffectKey)) {
            removeBarkEffect(existingEffectKey);
        }
        
        // Загружаем текстуру коры
        const barkTexturePath = 'images/spells/nature/bark_armor/bark_shield.png';
        
        PIXI.Assets.load(barkTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackBarkEffect();
                return;
            }
            
            // Создаем контейнер для эффекта
            const barkContainer = new PIXI.Container();
            
            // Основной спрайт щита из коры
            const barkShield = new PIXI.Sprite(texture);
            barkShield.anchor.set(0.5, 0.5);
            
            // Масштабируем с 768x768 до нужного размера
            const targetSize = wizardCell.cellScale * 80; // Размер щита относительно клетки
            const scale = targetSize / 768;
            barkShield.scale.set(scale);
            
            // Начальное состояние
            barkShield.alpha = 0;
            barkShield.rotation = 0;
            
            barkContainer.addChild(barkShield);
            
            // Добавляем частицы листьев для красоты
            const leaves = [];
            const leafColors = [0x4a5d23, 0x5a7033, 0x6b8142]; // Зеленые оттенки
            
            for (let i = 0; i < 6; i++) {
                const leaf = new PIXI.Graphics();
                const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
                
                // Рисуем простой листик
                leaf.beginFill(leafColor, 0.8);
                leaf.moveTo(0, -5);
                leaf.quadraticCurveTo(-3, -2, -3, 2);
                leaf.quadraticCurveTo(-3, 5, 0, 8);
                leaf.quadraticCurveTo(3, 5, 3, 2);
                leaf.quadraticCurveTo(3, -2, 0, -5);
                leaf.endFill();
                
                const leafScale = 0.5 + Math.random() * 0.5;
                leaf.scale.set(leafScale * scale * 2);
                
                // Начальная позиция по кругу
                const angle = (Math.PI * 2 / 6) * i;
                const radius = 40 * scale;
                leaf.x = Math.cos(angle) * radius;
                leaf.y = Math.sin(angle) * radius;
                leaf.rotation = angle + Math.PI / 2;
                leaf.alpha = 0;
                
                barkContainer.addChild(leaf);
                leaves.push({
                    sprite: leaf,
                    angle: angle,
                    radius: radius,
                    speed: 0.02 + Math.random() * 0.02
                });
            }
            
            // Позиционируем контейнер
            barkContainer.x = targetX;
            barkContainer.y = targetY;
            
            effectsContainer.addChild(barkContainer);
            
            // Анимация появления
            const appearDuration = 800;
            const startTime = Date.now();
            
            const animateAppear = () => {
                if (!window.pixiAnimUtils.isValid(barkShield)) return;

                const progress = Math.min((Date.now() - startTime) / appearDuration, 1);

                // Плавное появление и вращение щита
                barkShield.alpha = progress * 0.6;
                barkShield.rotation = progress * Math.PI * 2;

                // Расширение от центра
                const scaleProgress = 0.5 + progress * 0.5;
                barkShield.scale.set(scale * scaleProgress);
                
                // Появление листьев
                leaves.forEach((leaf, index) => {
                    const leafProgress = Math.max(0, (progress - 0.3) / 0.7);
                    leaf.sprite.alpha = leafProgress * 0.7;
                    
                    // Спиральное движение листьев
                    const currentAngle = leaf.angle + progress * Math.PI;
                    const currentRadius = leaf.radius * (1 + progress * 0.3);
                    leaf.sprite.x = Math.cos(currentAngle) * currentRadius;
                    leaf.sprite.y = Math.sin(currentAngle) * currentRadius;
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animateAppear);
                } else {
                    // Запускаем постоянную анимацию
                    startIdleAnimation();
                    
                    // Сохраняем эффект
                    activeBarkEffects.set(existingEffectKey, {
                        container: barkContainer,
                        shield: barkShield,
                        leaves: leaves,
                        level: level
                    });
                    
                    if (onComplete) onComplete();
                }
            };
            
            animateAppear();
            
            // Постоянная анимация покачивания
            function startIdleAnimation() {
                const idleAnimate = () => {
                    if (!barkContainer.parent) return;
                    
                    const time = Date.now() * 0.001;
                    
                    // Легкое покачивание щита
                    barkShield.rotation = Math.sin(time * 0.5) * 0.1;
                    
                    // Вращение листьев
                    leaves.forEach(leaf => {
                        leaf.angle += leaf.speed;
                        const floatOffset = Math.sin(time * 2 + leaf.angle) * 5;
                        leaf.sprite.x = Math.cos(leaf.angle) * (leaf.radius + floatOffset);
                        leaf.sprite.y = Math.sin(leaf.angle) * (leaf.radius + floatOffset);
                        leaf.sprite.rotation = leaf.angle + Math.PI / 2;
                    });
                    
                    requestAnimationFrame(idleAnimate);
                };
                idleAnimate();
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры коры:', err);
            createFallbackBarkEffect();
        });
        
        // Fallback эффект если текстура не загрузилась
        function createFallbackBarkEffect() {
            const barkContainer = new PIXI.Container();
            
            // Рисуем простой щит из графики
            const shield = new PIXI.Graphics();
            
            // Деревянная текстура (концентрические круги)
            for (let i = 5; i > 0; i--) {
                const color = i % 2 === 0 ? 0x8B4513 : 0x654321;
                shield.beginFill(color, 0.3);
                shield.drawCircle(0, 0, i * 8 * wizardCell.cellScale);
                shield.endFill();
            }
            
            // Добавляем кору по краям
            shield.lineStyle(3 * wizardCell.cellScale, 0x4a3c28, 0.8);
            shield.drawCircle(0, 0, 40 * wizardCell.cellScale);
            
            barkContainer.addChild(shield);
            barkContainer.x = targetX;
            barkContainer.y = targetY;
            barkContainer.alpha = 0;
            
            effectsContainer.addChild(barkContainer);
            
            // Анимация появления
            const fadeIn = () => {
                barkContainer.alpha += 0.05;
                if (barkContainer.alpha < 0.6) {
                    requestAnimationFrame(fadeIn);
                } else {
                    barkContainer.alpha = 0.6;
                    
                    // Пульсация
                    const pulse = () => {
                        if (!barkContainer.parent) return;
                        const time = Date.now() * 0.001;
                        barkContainer.scale.set(1 + Math.sin(time) * 0.05);
                        shield.rotation = Math.sin(time * 0.5) * 0.1;
                        requestAnimationFrame(pulse);
                    };
                    pulse();
                    
                    activeBarkEffects.set(`${casterType}_${casterPosition}`, {
                        container: barkContainer,
                        level: level
                    });
                    
                    if (onComplete) onComplete();
                }
            };
            fadeIn();
        }
    }
    
    // Удаление эффекта коры
    function removeBarkEffect(key) {
    	const effect = activeBarkEffects.get(key);
    	if (!effect) return;
    	
    	const { container } = effect;
    
    	// Сразу удаляем из карты
    	activeBarkEffects.delete(key);
    
    	// Проверяем, что контейнер существует и валиден
    	if (!container || !container.parent) {
    	    return;
    	}
    
    	// Проверяем, что объект не был уже уничтожен
    	if (container.destroyed) {
    	    return;
    	}
    
    	try {
    	    // Анимация исчезновения
    	    const fadeOut = () => {
    	        // Проверяем существование перед каждым обращением
    	        if (!container || container.destroyed || !container.transform) {
    	            return;
    	        }
    	        
    	        container.alpha -= 0.05;
            
    	        // Безопасное изменение масштаба
    	        if (container.scale) {
    	            const currentScale = container.scale.x || 1;
    	            container.scale.set(currentScale * 0.95);
    	        }
    	        
    	        if (container.alpha > 0) {
    	            requestAnimationFrame(fadeOut);
    	        } else {
    	            // Финальное удаление
    	            if (container.parent) {
    	                container.parent.removeChild(container);
    	            }
    	            if (!container.destroyed) {
    	                container.destroy({ children: true });
    	            }
    	        }
    	    };
    	    fadeOut();
    	} catch (err) {
    	    console.warn('Ошибка при удалении эффекта коры:', err);
    	    // Принудительное удаление при ошибке
    	    try {
    	        if (container.parent) {
    	            container.parent.removeChild(container);
    	        }
    	        if (!container.destroyed) {
    	            container.destroy({ children: true });
    	        }
    	    } catch (e) {
    	        // Игнорируем ошибки при принудительном удалении
    	    }
    	}
    }

    // Очистка всех эффектов
    function clearAllBarkEffects() {
    	// Создаем копию ключей для безопасного удаления
    	const keys = Array.from(activeBarkEffects.keys());
    	keys.forEach(key => removeBarkEffect(key));
    	// Очищаем карту полностью
    	activeBarkEffects.clear();
    }
    
    
    // Обновление эффекта при повторном применении
    function refreshBarkEffect(casterType, position, level) {
    	const key = `${casterType}_${position}`;
    	const existingEffect = activeBarkEffects.get(key);
    
    	// Проверяем наличие эффекта и его валидность
    	if (!existingEffect || !existingEffect.container || !existingEffect.container.parent) {
    	    console.log('🌳 Эффект коры отсутствует или был уничтожен, пропускаем обновление');
    	    // Удаляем из карты если был невалидный эффект
    	    if (existingEffect) {
    	        activeBarkEffects.delete(key);
    	    }
    	    return;
    	}
    
    	const { shield, container, leaves } = existingEffect;
    
    	// Проверяем что shield существует и не был уничтожен
    	if (!shield || !shield.transform || shield.destroyed) {
    	    console.warn('🌳 Щит коры был уничтожен, удаляем эффект');
    	    activeBarkEffects.delete(key);
    	    if (container.parent) {
    	        container.parent.removeChild(container);
    	    }
    	    return;
    	}
    
    	// Вспышка обновления
    	try {
    	    // Сохраняем оригинальные значения
    	    const originalAlpha = shield.alpha || 0.6;
    	    const originalScaleX = shield.scale.x;
    	    const originalScaleY = shield.scale.y;
    	    
    	    // Вспышка яркости
    	    shield.alpha = 1;
    	    
    	    // Увеличение
    	    shield.scale.set(originalScaleX * 1.3, originalScaleY * 1.3);
    	    
    	    // Анимация возврата
    	    setTimeout(() => {
    	        // Проверяем что объект все еще существует
    	        if (shield && shield.transform && !shield.destroyed) {
    	            shield.alpha = originalAlpha;
    	            shield.scale.set(originalScaleX, originalScaleY);
    	        }
    	    }, 300);
    	    
    	    // Анимация листьев при обновлении
    	    if (leaves && Array.isArray(leaves)) {
    	        leaves.forEach(leaf => {
    	            if (leaf.sprite && leaf.sprite.transform) {
    	                const leafOriginalScale = leaf.sprite.scale.x;
    	                leaf.sprite.scale.set(leafOriginalScale * 1.5);
    	                leaf.sprite.alpha = 1;
    	                
    	                setTimeout(() => {
    	                    if (leaf.sprite && leaf.sprite.transform) {
    	                        leaf.sprite.scale.set(leafOriginalScale);
    	                        leaf.sprite.alpha = 0.7;
    	                    }
    	                }, 400);
    	            }
    	        });
    	    }
    	    
    	    // Обновляем уровень
    	    existingEffect.level = level;
    	    
    	    // Добавляем эффект восстановления
    	    if (container.x !== undefined && container.y !== undefined) {
    	        createRefreshParticles(container.x, container.y);
    	    }
    	    
    	    console.log('🌳 Эффект коры успешно обновлен');
    	    
    	} catch (err) {
    	    console.error('Ошибка при обновлении эффекта коры:', err);
    	    // При ошибке удаляем невалидный эффект
    	    activeBarkEffects.delete(key);
    	}
    }
    
    // Частицы обновления
    function createRefreshParticles(x, y) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x4a5d23, 0.8);
            particle.drawCircle(0, 0, 2);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            
            effectsContainer.addChild(particle);
            
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 2 + Math.random();
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const animateParticle = () => {
                if (!window.pixiAnimUtils.isValid(particle)) return;

                particle.x += vx;
                particle.y += vy;
                particle.alpha -= 0.02;

                if (particle.alpha > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    if (particle.parent) {
                        particle.parent.removeChild(particle);
                    }
                }
            };
            animateParticle();
        }
    }
    
    // Регистрация анимации
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.bark_armor = {
        play: playBarkArmorAnimation,
        remove: removeBarkEffect,
        clearAll: clearAllBarkEffects,
        refresh: refreshBarkEffect,
        getActive: () => activeBarkEffects
    };
    
    console.log('🌳 Анимация Древесной коры зарегистрирована');
})();