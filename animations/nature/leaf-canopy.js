// battle/renderer/animations/nature/leaf-canopy.js
console.log('✅ leaf-canopy.js загружен');

(function() {
    // Хранилище активных эффектов листвы
    const activeCanopyEffects = new Map();
    
    function playLeafCanopyAnimation(params) {
        const { targetWizards, level = 1, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Покров листвы');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать эффект листвы - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Загружаем спрайт-лист листьев (612x408, 5 колонок, 3 ряда)
        const leafSheetPath = 'images/spells/nature/leaf_canopy/leaves_sheet.png';
        
        PIXI.Assets.load(leafSheetPath).then(leafTexture => {
            if (!leafTexture || !leafTexture.valid) {
                createFallbackCanopyEffect();
                return;
            }
            
            // Нарезаем спрайт-лист на кадры
            const frames = [];
            const frameWidth = 612 / 5; // 122.4 пикселя
            const frameHeight = 408 / 3; // 136 пикселей
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 5; col++) {
                    const frame = new PIXI.Texture(
                        leafTexture,
                        new PIXI.Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight)
                    );
                    frames.push(frame);
                }
            }
            
            // Создаем эффект для каждого целевого мага
            targetWizards.forEach((wizardData, index) => {
                setTimeout(() => {
                    createWizardCanopyEffect(wizardData, frames, level);
                }, index * 200);
            });
            
            if (onComplete) {
                setTimeout(onComplete, targetWizards.length * 200 + 500);
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки спрайт-листа:', err);
            createFallbackCanopyEffect();
        });
        
        // Создание эффекта для конкретного мага
        function createWizardCanopyEffect(wizardData, frames, level) {
            const { wizard, position, casterType } = wizardData;
            
            // Определяем позицию мага
            const wizardCol = casterType === 'player' ? 5 : 0;
            const wizardCell = gridCells[wizardCol]?.[position];
            
            if (!wizardCell) return;
            
            const wizardSprite = window.wizardSprites?.[`${wizardCol}_${position}`];
            const centerX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
            const centerY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);
            
            const effectKey = `${casterType}_${position}`;
            if (activeCanopyEffects.has(effectKey)) {
                removeCanopyEffect(effectKey);
            }
            
            // Создаем анимированный спрайт листа
            const leafSprite = new PIXI.AnimatedSprite(frames);
            leafSprite.animationSpeed = 0.08; // Медленная смена кадров
            leafSprite.anchor.set(0.5, 0.5);
            
            // Размер и позиция - за спиной мага
            const scale = wizardCell.cellScale * 0.25;
            leafSprite.scale.set(scale);
            
            // Позиция за спиной (смещение зависит от стороны)
            const offsetX = casterType === 'player' ? -30 : 30;
            const offsetY = -35; // Выше плеча
            
            leafSprite.x = centerX + offsetX;
            leafSprite.y = centerY + offsetY;
            leafSprite.alpha = 0;
            
            // Добавляем в контейнер ПЕРЕД магом (чтобы был за спиной)
            const unitsContainer = window.pixiCore?.getUnitsContainer();
            if (unitsContainer && wizardSprite?.sprite) {
                const index = unitsContainer.getChildIndex(wizardSprite.sprite);
                unitsContainer.addChildAt(leafSprite, Math.max(0, index));
            } else {
                effectsContainer.addChild(leafSprite);
            }
            
            // Запускаем анимацию спрайта
            leafSprite.play();
            
            // Плавное появление
            let fadeAlpha = 0;
            const fadeIn = () => {
                fadeAlpha += 0.05;
                leafSprite.alpha = Math.min(fadeAlpha, 0.8); // Полупрозрачный
                
                if (fadeAlpha < 0.8) {
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
            
            // Легкое покачивание
            let swayTime = 0;
            const sway = () => {
                if (!leafSprite.parent) return;
                
                swayTime += 0.02;
                leafSprite.rotation = Math.sin(swayTime) * 0.1; // Легкое покачивание
                
                requestAnimationFrame(sway);
            };
            sway();
            
            // Сохраняем для пульсации при регенерации
            activeCanopyEffects.set(effectKey, {
                sprite: leafSprite,
                originalScale: scale,
                originalX: leafSprite.x,
                originalY: leafSprite.y,
                wizard: wizard,
                level: level
            });
        }
        
        // Fallback эффект без текстур
        function createFallbackCanopyEffect() {
            targetWizards.forEach(wizardData => {
                const { wizard, position, casterType } = wizardData;
                
                const wizardCol = casterType === 'player' ? 5 : 0;
                const wizardCell = gridCells[wizardCol]?.[position];
                if (!wizardCell) return;
                
                const wizardSprite = window.wizardSprites?.[`${wizardCol}_${position}`];
                const centerX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
                const centerY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);
                
                // Создаем простой графический лист
                const leaf = new PIXI.Graphics();
                leaf.beginFill(0x4ade80, 0.6);
                leaf.moveTo(0, -15);
                leaf.quadraticCurveTo(-8, -8, -8, 0);
                leaf.quadraticCurveTo(-8, 8, 0, 20);
                leaf.quadraticCurveTo(8, 8, 8, 0);
                leaf.quadraticCurveTo(8, -8, 0, -15);
                leaf.endFill();
                
                // Прожилки
                leaf.lineStyle(1, 0x2a7f47, 0.8);
                leaf.moveTo(0, -15);
                leaf.lineTo(0, 20);
                
                const scale = wizardCell.cellScale * 1.5;
                leaf.scale.set(scale);
                
                const offsetX = casterType === 'player' ? -30 : 30;
                const offsetY = -35;
                
                leaf.x = centerX + offsetX;
                leaf.y = centerY + offsetY;
                leaf.alpha = 0.7;
                
                effectsContainer.addChild(leaf);
                
                // Легкое покачивание
                let swayTime = 0;
                const sway = () => {
                    if (!leaf.parent) return;
                    
                    swayTime += 0.02;
                    leaf.rotation = Math.sin(swayTime) * 0.1;
                    
                    requestAnimationFrame(sway);
                };
                sway();
                
                activeCanopyEffects.set(`${casterType}_${position}`, {
                    sprite: leaf,
                    originalScale: scale,
                    originalX: leaf.x,
                    originalY: leaf.y
                });
            });
            
            if (onComplete) onComplete();
        }
    }
    
    // Эффект пульсации при регенерации
    function playRegenerationPulse(wizardPosition, casterType) {
        const effectKey = `${casterType}_${wizardPosition}`;
        const effect = activeCanopyEffects.get(effectKey);
        
        if (!effect || !effect.sprite) return;
        
        const { sprite, originalScale, originalX, originalY } = effect;
        
        // Анимация увеличения и возврата
        let scaleProgress = 0;
        const pulseAnimation = () => {
            scaleProgress += 0.08;
            
            if (scaleProgress <= 1) {
                // Пульсация размера
                const scaleFactor = 1 + Math.sin(scaleProgress * Math.PI) * 0.4;
                sprite.scale.set(originalScale * scaleFactor);
                
                // Зеленое свечение
                if (scaleProgress < 0.5) {
                    sprite.tint = 0x00ff00;
                    sprite.alpha = 0.9;
                } else {
                    sprite.tint = 0xffffff;
                    sprite.alpha = 0.8;
                }
                
                requestAnimationFrame(pulseAnimation);
            } else {
                // Возвращаем исходные параметры
                sprite.scale.set(originalScale);
                sprite.tint = 0xffffff;
                sprite.alpha = 0.8;
            }
        };
        pulseAnimation();
        
        // Добавляем зеленые частицы
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (effectsContainer) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const particle = new PIXI.Graphics();
                    particle.beginFill(0x4ade80, 1);
                    particle.drawCircle(0, 0, 3);
                    particle.endFill();
                    
                    particle.x = originalX + (Math.random() - 0.5) * 30;
                    particle.y = originalY + (Math.random() - 0.5) * 20;
                    
                    effectsContainer.addChild(particle);
                    
                    // Анимация подъема и исчезновения
                    const startY = particle.y;
                    let progress = 0;
                    const animateParticle = () => {
                        if (!window.pixiAnimUtils.isValid(particle)) return;

                        progress += 0.02;
                        particle.y = startY - progress * 30;
                        particle.alpha = 1 - progress;
                        particle.scale.set(1 - progress * 0.5);

                        if (progress < 1) {
                            requestAnimationFrame(animateParticle);
                        } else {
                            if (particle.parent) {
                                particle.parent.removeChild(particle);
                            }
                        }
                    };
                    animateParticle();
                }, i * 80);
            }
        }
    }
    
    // Удаление эффекта
    function removeCanopyEffect(key) {
        const effect = activeCanopyEffects.get(key);
        if (!effect) return;
        
        const { sprite } = effect;
        
        // Останавливаем анимацию если это AnimatedSprite
        if (sprite instanceof PIXI.AnimatedSprite) {
            sprite.stop();
        }
        
        // Плавное исчезновение
        const fadeOut = () => {
            if (!sprite || !sprite.parent) return;
            
            sprite.alpha -= 0.05;
            
            if (sprite.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                sprite.parent.removeChild(sprite);
                sprite.destroy();
                activeCanopyEffects.delete(key);
            }
        };
        fadeOut();
    }
    
    // Очистка всех эффектов
    function clearAllCanopyEffects() {
        activeCanopyEffects.forEach((_, key) => removeCanopyEffect(key));
        activeCanopyEffects.clear();
    }
    
    // Регистрация анимации
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.leaf_canopy = {
        play: playLeafCanopyAnimation,
        pulse: playRegenerationPulse,
        remove: removeCanopyEffect,
        clearAll: clearAllCanopyEffects
    };
    
    console.log('🍃 Анимация Покрова листвы зарегистрирована');
})();
