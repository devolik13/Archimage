// battle/renderer/animations/earth/stone-grotto.js
console.log('✅ stone-grotto.js загружен');

(function() {
    // Хранилище активных каменных гротов
    const activeGrottoEffects = new Map();
    
    function playStoneGrottoAnimation(params) {
        const { casterType, casterPosition, targetWizards = [], level = 1, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Каменный грот');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать эффект грота - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // Создаем эффекты для всех целей
        targetWizards.forEach((target, index) => {
            setTimeout(() => {
                createGrottoForTarget(target, casterType, level);
            }, index * 100);
        });
        
        if (onComplete) {
            setTimeout(onComplete, targetWizards.length * 100 + 500);
        }
    }
    
    function createGrottoForTarget(targetWizard, casterType, level) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells || !targetWizard) return;
        
        // Определяем позицию мага
        const targetPosition = findWizardPosition(targetWizard, casterType);
        if (targetPosition === -1) return;
        
        const wizardCol = casterType === 'player' ? 5 : 0;
        const wizardCell = gridCells[wizardCol]?.[targetPosition];
        
        if (!wizardCell) return;
        
        // Находим спрайт мага
        const wizardSprite = window.wizardSprites?.[`${wizardCol}_${targetPosition}`];
        const targetX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
        const targetY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);
        
        // Удаляем старый эффект если есть
        const effectKey = `${casterType}_${targetPosition}`;
        if (activeGrottoEffects.has(effectKey)) {
            removeGrottoEffect(effectKey);
        }
        
        // Загружаем текстуру каменного грота
        const grottoTexturePath = 'images/spells/earth/stone_grotto/grotto_shield.png';
        
        PIXI.Assets.load(grottoTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackGrottoEffect();
                return;
            }
            
            // Создаем контейнер для эффекта
            const grottoContainer = new PIXI.Container();
            
            // Основной спрайт каменного укрытия
            const grottoShield = new PIXI.Sprite(texture);
            grottoShield.anchor.set(0.5, 0.5);
            
            // Масштабируем спрайт под размер клетки
            const targetSize = wizardCell.cellScale * 50; // Уменьшен размер укрытия (было 90)
            const scale = targetSize / 256; // Предполагаем размер текстуры 256x256
            grottoShield.scale.set(scale);
            
            // Начальное состояние
            grottoShield.alpha = 0;
            grottoShield.tint = 0xccaa88; // Каменный оттенок
            
            grottoContainer.addChild(grottoShield);
            
            // Добавляем каменные осколки для эффекта
            const stones = [];
            const stoneColors = [0x8b7355, 0x7a6248, 0x695339];
            
            for (let i = 0; i < 8; i++) {
                const stone = new PIXI.Graphics();
                const stoneColor = stoneColors[Math.floor(Math.random() * stoneColors.length)];
                
                // Рисуем каменный осколок - уменьшенный размер
                stone.beginFill(stoneColor, 0.9);
                stone.moveTo(0, -5);  // Было -8
                stone.lineTo(-4, -1); // Было -6, -2
                stone.lineTo(-3, 2);  // Было -5, 4
                stone.lineTo(0, 4);   // Было 0, 6
                stone.lineTo(3, 2);   // Было 5, 4
                stone.lineTo(4, -1);  // Было 6, -2
                stone.closePath();
                stone.endFill();
                
                const stoneScale = 0.5 + Math.random() * 0.3; // Уменьшен масштаб (было 0.6 + 0.4)
                stone.scale.set(stoneScale * scale * 1.5); // Уменьшен множитель (было * 2)
                
                // Начальная позиция по кругу
                const angle = (Math.PI * 2 / 8) * i;
                const radius = 30 * scale; // Уменьшен радиус камней (было 45)
                stone.x = Math.cos(angle) * radius;
                stone.y = Math.sin(angle) * radius;
                stone.rotation = Math.random() * Math.PI * 2;
                stone.alpha = 0;
                
                grottoContainer.addChild(stone);
                stones.push({
                    sprite: stone,
                    angle: angle,
                    radius: radius,
                    rotSpeed: (Math.random() - 0.5) * 0.05
                });
            }
            
            // Позиционируем контейнер
            grottoContainer.x = targetX;
            grottoContainer.y = targetY;
            
            effectsContainer.addChild(grottoContainer);
            
            // Анимация появления (поднятие из земли)
            const appearDuration = 1000;
            const startTime = Date.now();
            
            const animateAppear = () => {
                const progress = Math.min((Date.now() - startTime) / appearDuration, 1);
                
                // Плавное появление снизу вверх
                grottoShield.alpha = progress * 0.7;
                
                // Эффект поднятия из земли
                const liftProgress = easeOutCubic(progress);
                grottoShield.y = 20 * (1 - liftProgress);
                
                // Расширение от центра
                const scaleProgress = 0.3 + liftProgress * 0.7;
                grottoShield.scale.set(scale * scaleProgress);
                
                // Появление каменных осколков
                stones.forEach((stone, index) => {
                    const stoneProgress = Math.max(0, (progress - 0.2 - index * 0.05) / 0.8);
                    stone.sprite.alpha = stoneProgress * 0.8;
                    
                    // Движение камней вверх и наружу
                    const currentRadius = stone.radius * (0.5 + stoneProgress * 0.5);
                    stone.sprite.x = Math.cos(stone.angle) * currentRadius;
                    stone.sprite.y = Math.sin(stone.angle) * currentRadius - (1 - stoneProgress) * 15;
                });
                
                // Добавляем пыль при появлении
                if (progress < 0.5 && Math.random() < 0.3) {
                    createDustParticle(targetX, targetY + 20, effectsContainer);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateAppear);
                } else {
                    // Запускаем постоянную анимацию
                    startIdleAnimation();
                    
                    // Сохраняем эффект
                    activeGrottoEffects.set(effectKey, {
                        container: grottoContainer,
                        shield: grottoShield,
                        stones: stones,
                        level: level,
                        targetWizard: targetWizard
                    });
                }
            };
            
            animateAppear();
            
            // Постоянная анимация
            function startIdleAnimation() {
                const idleAnimate = () => {
                    if (!grottoContainer.parent) return;
                    
                    const time = Date.now() * 0.001;
                    
                    // Легкое покачивание
                    grottoShield.scale.set(
                        scale * (1 + Math.sin(time) * 0.02),
                        scale * (1 + Math.cos(time * 1.1) * 0.02)
                    );
                    
                    // Вращение камней
                    stones.forEach(stone => {
                        stone.sprite.rotation += stone.rotSpeed;
                        // Легкая левитация камней
                        const floatOffset = Math.sin(time * 2 + stone.angle * 2) * 2;
                        stone.sprite.y = Math.sin(stone.angle) * stone.radius + floatOffset;
                    });
                    
                    requestAnimationFrame(idleAnimate);
                };
                idleAnimate();
            }
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры грота:', err);
            createFallbackGrottoEffect();
        });
        
        // Fallback эффект если текстура не загрузилась
        function createFallbackGrottoEffect() {
            const grottoContainer = new PIXI.Container();
            
            // Рисуем каменное укрытие из графики
            const grotto = new PIXI.Graphics();
            
            // Основание грота (полукруг) - уменьшенный размер
            grotto.beginFill(0x8b7355, 0.5);
            grotto.arc(0, 0, 25 * wizardCell.cellScale, Math.PI, 0, false); // Было 40
            grotto.endFill();
            
            // Каменные слои
            grotto.lineStyle(2 * wizardCell.cellScale, 0x6b5341, 0.7);
            grotto.arc(0, 0, 22 * wizardCell.cellScale, Math.PI, 0, false); // Было 35
            
            grotto.lineStyle(1.5 * wizardCell.cellScale, 0x5a4232, 0.5);
            grotto.arc(0, 0, 19 * wizardCell.cellScale, Math.PI, 0, false); // Было 30
            
            grottoContainer.addChild(grotto);
            grottoContainer.x = targetX;
            grottoContainer.y = targetY;
            grottoContainer.alpha = 0;
            
            effectsContainer.addChild(grottoContainer);
            
            // Анимация появления
            const fadeIn = () => {
                grottoContainer.alpha += 0.05;
                if (grottoContainer.alpha < 0.7) {
                    requestAnimationFrame(fadeIn);
                } else {
                    grottoContainer.alpha = 0.7;
                    
                    // Пульсация
                    const pulse = () => {
                        if (!grottoContainer.parent) return;
                        const time = Date.now() * 0.001;
                        const scale = 1 + Math.sin(time * 0.8) * 0.03;
                        grottoContainer.scale.set(scale);
                        requestAnimationFrame(pulse);
                    };
                    pulse();
                    
                    activeGrottoEffects.set(effectKey, {
                        container: grottoContainer,
                        level: level
                    });
                }
            };
            fadeIn();
        }
    }
    
    // Создание частицы пыли
    function createDustParticle(x, y, container) {
        const dust = new PIXI.Graphics();
        dust.beginFill(0x8b7355, 0.6);
        dust.drawCircle(0, 0, 2 + Math.random() * 2);
        dust.endFill();
        
        dust.x = x + (Math.random() - 0.5) * 30;
        dust.y = y;
        
        container.addChild(dust);
        
        const vx = (Math.random() - 0.5) * 2;
        const vy = -Math.random() * 2 - 1;
        
        const animateDust = () => {
            dust.x += vx;
            dust.y += vy;
            dust.alpha -= 0.02;
            
            if (dust.alpha > 0) {
                requestAnimationFrame(animateDust);
            } else {
                if (dust.parent) {
                    dust.parent.removeChild(dust);
                }
            }
        };
        animateDust();
    }
    
    // Поиск позиции мага
    function findWizardPosition(wizard, casterType) {
        if (casterType === 'player') {
            return window.playerFormation?.findIndex(id => id === wizard.id) ?? -1;
        } else {
            return window.enemyFormation?.findIndex(w => w && w.id === wizard.id) ?? -1;
        }
    }
    
    // Функция плавного движения
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Удаление эффекта грота
    function removeGrottoEffect(key) {
        const effect = activeGrottoEffects.get(key);
        if (!effect) return;
        
        const { container } = effect;
        
        // Удаляем из карты
        activeGrottoEffects.delete(key);
        
        // Проверяем валидность контейнера
        if (!container || !container.parent || container.destroyed) {
            return;
        }
        
        try {
            // Анимация разрушения
            const crumbleDuration = 800;
            const startTime = Date.now();
            
            const animateCrumble = () => {
                // Проверяем существование контейнера перед каждым кадром
                if (!container || container.destroyed || !container.transform) {
                    return;
                }
                
                // Проверяем что контейнер в сцене
                if (!container.parent) {
                    return;
                }
                
                try {
                    const progress = Math.min((Date.now() - startTime) / crumbleDuration, 1);
                    
                    // Эффект разрушения
                    container.alpha = 1 - progress;
                    
                    // Падение вниз
                    container.y += progress * 2;
                    
                    // Уменьшение размера
                    const scale = (1 - progress * 0.5);
                    container.scale.set(scale);
                    
                    // Создаем осколки при разрушении
                    if (Math.random() < 0.2 && progress < 0.7) {
                        const effectsContainer = window.pixiCore?.getEffectsContainer();
                        // Проверяем что контейнер эффектов существует
                        if (effectsContainer && !effectsContainer.destroyed) {
                            createDebris(container.x, container.y, effectsContainer);
                        }
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateCrumble);
                    } else {
                        // Финальное удаление
                        if (container.parent) {
                            container.parent.removeChild(container);
                        }
                        if (!container.destroyed) {
                            container.destroy({ children: true });
                        }
                    }
                } catch (err) {
                    console.warn('Ошибка анимации разрушения:', err);
                    // Принудительное удаление при ошибке
                    try {
                        if (container && container.parent) {
                            container.parent.removeChild(container);
                        }
                        if (container && !container.destroyed) {
                            container.destroy({ children: true });
                        }
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }
            };
            animateCrumble();
        } catch (err) {
            console.warn('Ошибка при удалении эффекта грота:', err);
            // Принудительное удаление
            try {
                if (container.parent) {
                    container.parent.removeChild(container);
                }
                if (!container.destroyed) {
                    container.destroy({ children: true });
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    }
    
    // Создание осколков при разрушении
    function createDebris(x, y, container) {
        const debris = new PIXI.Graphics();
        const size = 3 + Math.random() * 4;
        
        debris.beginFill(0x7a6248, 0.8);
        debris.moveTo(0, -size);
        debris.lineTo(-size * 0.7, size * 0.5);
        debris.lineTo(size * 0.7, size * 0.5);
        debris.closePath();
        debris.endFill();
        
        debris.x = x + (Math.random() - 0.5) * 20;
        debris.y = y;
        debris.rotation = Math.random() * Math.PI * 2;
        
        container.addChild(debris);
        
        const vx = (Math.random() - 0.5) * 3;
        const vy = Math.random() * 2 + 1; // Падение вниз
        const rotSpeed = (Math.random() - 0.5) * 0.2;
        
        const animateDebris = () => {
            // Проверяем что объект еще существует и не уничтожен
            if (!debris || debris.destroyed || !debris.transform) {
                return;
            }
            
            // Проверяем что объект все еще в сцене
            if (!debris.parent) {
                return;
            }
            
            try {
                debris.x += vx;
                debris.y += vy;
                debris.rotation += rotSpeed;
                debris.alpha -= 0.015;
                
                if (debris.alpha > 0) {
                    requestAnimationFrame(animateDebris);
                } else {
                    // Безопасное удаление
                    if (debris.parent) {
                        debris.parent.removeChild(debris);
                    }
                    if (!debris.destroyed) {
                        debris.destroy();
                    }
                }
            } catch (err) {
                console.warn('Ошибка анимации осколка:', err);
                // Принудительное удаление при ошибке
                try {
                    if (debris.parent) {
                        debris.parent.removeChild(debris);
                    }
                    if (!debris.destroyed) {
                        debris.destroy();
                    }
                } catch (e) {
                    // Игнорируем ошибки при удалении
                }
            }
        };
        animateDebris();
    }
    
    // Очистка всех эффектов
    function clearAllGrottoEffects() {
        const keys = Array.from(activeGrottoEffects.keys());
        keys.forEach(key => removeGrottoEffect(key));
        activeGrottoEffects.clear();
    }
    
    // Обновление эффекта при повторном применении
    function refreshGrottoEffect(casterType, position, level) {
        const key = `${casterType}_${position}`;
        const existingEffect = activeGrottoEffects.get(key);
        
        if (!existingEffect || !existingEffect.container || existingEffect.container.destroyed) {
            if (existingEffect) {
                activeGrottoEffects.delete(key);
            }
            return;
        }
        
        const { container, stones } = existingEffect;
        
        // Эффект усиления
        const originalScale = container.scale.x;
        container.scale.set(originalScale * 1.2);
        
        setTimeout(() => {
            if (container && !container.destroyed) {
                container.scale.set(originalScale);
            }
        }, 300);
        
        // Вспышка камней
        if (stones) {
            stones.forEach(stone => {
                if (stone.sprite && !stone.sprite.destroyed) {
                    stone.sprite.alpha = 1;
                    setTimeout(() => {
                        if (stone.sprite && !stone.sprite.destroyed) {
                            stone.sprite.alpha = 0.8;
                        }
                    }, 400);
                }
            });
        }
        
        // Обновляем уровень
        existingEffect.level = level;
        
        console.log('🏔️ Эффект каменного грота обновлен');
    }
    
    // Регистрация анимации
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.stone_grotto = {
        play: playStoneGrottoAnimation,
        remove: removeGrottoEffect,
        clearAll: clearAllGrottoEffects,
        refresh: refreshGrottoEffect,
        getActive: () => activeGrottoEffects
    };
    
    console.log('🏔️ Анимация Каменного грота зарегистрирована');
})();