// battle/renderer/animations/fire/firebolt.js - ОБНОВЛЁННАЯ ВЕРСИЯ

(function() {
    function playFireboltAnimation(params) {
        const {
            casterType,
            casterPosition,
            casterCol,
            level = 1,
            arrows = [],      // НОВОЕ: массив с данными о стрелах
            onArrowHit,       // НОВОЕ: callback для каждой стрелы
            onComplete
        } = params;

        // DEBUG: Логируем полученные координаты
        console.log(`🏹 [DEBUG] Firebolt animation params: casterType=${casterType}, casterPosition=${casterPosition}, casterCol=${casterCol}, level=${level}`);
        console.log(`🏹 [DEBUG] Firebolt arrows count: ${arrows.length}`);

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Firebolt');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать огненные стрелы - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        // НОВАЯ ЛОГИКА: используем данные из массива arrows
        let arrowsToUse = arrows;

        // Если arrows не передан, создаем его из targetCol/targetRow
        if (!arrowsToUse || arrowsToUse.length === 0) {
            const { targetCol, targetRow } = params;
            if (targetCol !== undefined && targetRow !== undefined) {
                console.log('🔧 Создаем arrows из targetCol/targetRow');
                arrowsToUse = [{
                    targetCol: targetCol,
                    targetRow: targetRow
                }];
            } else {
                console.warn('⚠️ Нет данных о стрелах, используем старую логику');
                playOldFireboltAnimation(params);
                return;
            }
        }
        
        // Позиция кастера
        const casterRow = casterPosition !== undefined ? casterPosition : 2;
        const casterCell = gridCells[casterCol]?.[casterRow];
        
        if (!casterCell) {
            if (onComplete) onComplete();
            return;
        }
        
        const arrowCount = arrowsToUse.length;
        let completedArrows = 0;

        console.log(`🏹 Запуск ${arrowCount} огненных стрел с точными координатами`);
        
        // Загружаем спрайт-лист
        const fireboltTexturePath = 'images/spells/fire/firebolt/firebolt_sheet.webp';
        
        PIXI.Assets.load(fireboltTexturePath).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                console.warn('PNG не загружен, используем fallback');
                createFallbackArrows();
                return;
            }
            
            // Создаем кадры из спрайт-листа 2×3
            const frames = [];
            const frameWidth = Math.floor(baseTexture.width / 2);
            const frameHeight = Math.floor(baseTexture.height / 3);
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
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
            
            // Запускаем стрелы с задержкой
            arrowsToUse.forEach((arrowData, i) => {
                setTimeout(() => {
                    createAnimatedArrow(frames, arrowData, i);
                }, i * 200);
            });
            
        }).catch(err => {
            console.error('Ошибка загрузки PNG:', err);
            createFallbackArrows();
        });
        
        function createAnimatedArrow(frames, arrowData, index) {
            // ИСПОЛЬЗУЕМ ТОЧНЫЕ КООРДИНАТЫ из multi-layer-protection
            const targetCol = arrowData.impactCol;
            const targetRow = arrowData.impactRow;
            const targetCell = gridCells[targetCol]?.[targetRow];
            
            if (!targetCell) {
                console.warn(`⚠️ Не найдена клетка [${targetCol}, ${targetRow}]`);
                completedArrows++;
                checkComplete();
                return;
            }
            
            console.log(`🎯 Стрела ${index} летит к [${targetCol}, ${targetRow}] - ${arrowData.target.wizard.name}`);
            
            // Создаем анимированный спрайт
            const arrow = new PIXI.AnimatedSprite(frames);
            
            // Начальная позиция
            arrow.x = casterCell.x + casterCell.width / 2;
            arrow.y = casterCell.y + casterCell.height / 2;
            arrow.anchor.set(0.5, 0.5);
            
            // Масштаб стрелы
            const scale = 0.075;
            arrow.scale.set(scale);
            
            // Поворот к цели
            const dx = targetCell.x + targetCell.width / 2 - arrow.x;
            const dy = targetCell.y + targetCell.height / 2 - arrow.y;
            arrow.rotation = Math.atan2(dy, dx);
            
            // Настройки анимации спрайта
            arrow.animationSpeed = 0.4;
            arrow.loop = true;
            arrow.play();
            
            effectsContainer.addChild(arrow);
            
            // Анимация полета
            const targetX = targetCell.x + targetCell.width / 2;
            const targetY = targetCell.y + targetCell.height / 2;
            const duration = 800;
            const startTime = Date.now();
            const startX = casterCell.x + casterCell.width / 2;
            const startY = casterCell.y + casterCell.height / 2;

            const animate = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!arrow || arrow.destroyed || !arrow.transform || !arrow.parent) {
                    completedArrows++;
                    checkComplete();
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                try {
                    arrow.x = startX + (targetX - startX) * progress;
                    arrow.y = startY + (targetY - startY) * progress;
                } catch (e) {
                    completedArrows++;
                    checkComplete();
                    return;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (arrow.parent) {
                        effectsContainer.removeChild(arrow);
                    }
                    if (!arrow.destroyed) {
                        arrow.destroy();
                    }
                    createImpact(targetX, targetY);

                    // ВЫЗЫВАЕМ CALLBACK для применения урона и эффектов
                    if (onArrowHit) {
                        onArrowHit(index);
                    }

                    completedArrows++;
                    checkComplete();
                }
            };

            animate();
        }
        
        function createFallbackArrows() {
            arrowsToUse.forEach((arrowData, i) => {
                setTimeout(() => {
                    const targetCol = arrowData.impactCol;
                    const targetRow = arrowData.impactRow;
                    const targetCell = gridCells[targetCol]?.[targetRow];
                    
                    if (!targetCell) {
                        completedArrows++;
                        checkComplete();
                        return;
                    }
                    
                    const arrow = new PIXI.Graphics();
                    
                    arrow.beginFill(0xFF6600, 1);
                    arrow.drawRect(-25, -4, 50, 8);
                    arrow.endFill();
                    
                    arrow.beginFill(0xFFFF00, 1);
                    arrow.moveTo(25, 0);
                    arrow.lineTo(35, -10);
                    arrow.lineTo(35, 10);
                    arrow.closePath();
                    arrow.endFill();
                    
                    arrow.beginFill(0xFF0000, 0.7);
                    arrow.drawCircle(-25, 0, 10);
                    arrow.endFill();
                    
                    arrow.x = casterCell.x + casterCell.width / 2;
                    arrow.y = casterCell.y + casterCell.height / 2;
                    
                    const dx = targetCell.x + targetCell.width / 2 - arrow.x;
                    const dy = targetCell.y + targetCell.height / 2 - arrow.y;
                    arrow.rotation = Math.atan2(dy, dx);
                    
                    effectsContainer.addChild(arrow);
                    
                    const targetX = targetCell.x + targetCell.width / 2;
                    const targetY = targetCell.y + targetCell.height / 2;
                    const duration = 800;
                    const startTime = Date.now();
                    
                    const startX = casterCell.x + casterCell.width / 2;
                    const startY = casterCell.y + casterCell.height / 2;

                    const animate = () => {
                        // ПРОВЕРКА: если стрела уничтожена - прерываем анимацию
                        if (!arrow || arrow.destroyed || !arrow.transform || !arrow.parent) {
                            completedArrows++;
                            checkComplete();
                            return;
                        }

                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        try {
                            arrow.x = startX + (targetX - startX) * progress;
                            arrow.y = startY + (targetY - startY) * progress;
                        } catch (e) {
                            completedArrows++;
                            checkComplete();
                            return;
                        }
                	
                	if (progress < 1) {
                	    requestAnimationFrame(animate);
                	} else {
                	    // ПРОВЕРКА перед удалением
                	    if (arrow.parent) {
                	        effectsContainer.removeChild(arrow);
                	    }
                	    if (!arrow.destroyed) {
                	        arrow.destroy();
                	    }
                	    
                	    createImpact(targetX, targetY);
                	    
                	    // ВЫЗЫВАЕМ CALLBACK для применения урона и эффектов
                	    if (onArrowHit) {
                	        onArrowHit(index);
                	    }
                	    
                	    completedArrows++;
                	    checkComplete();
                	}
            	    };
                    
                    animate();
                }, i * 200);
            });
        }
        
        function createImpact(x, y) {
            const impact = new PIXI.Graphics();
            impact.beginFill(0xFFAA00, 0.8);
            impact.drawCircle(0, 0, 15);
            impact.endFill();

            impact.x = x;
            impact.y = y;
            impact.blendMode = PIXI.BLEND_MODES.ADD;

            effectsContainer.addChild(impact);

            const startTime = Date.now();
            const duration = 300;

            const animate = () => {
                // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                if (!impact || impact.destroyed || !impact.transform) {
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                impact.scale.set(1 + progress * 2);
                impact.alpha = 0.8 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (impact.parent) {
                        effectsContainer.removeChild(impact);
                    }
                    if (!impact.destroyed) {
                        impact.destroy();
                    }
                }
            };

            animate();
        }
        
        function checkComplete() {
            if (completedArrows >= arrowCount && onComplete) {
                onComplete();
            }
        }
    }
    
    // СТАРАЯ ЛОГИКА для совместимости (если нет массива arrows)
    function playOldFireboltAnimation(params) {
        const { casterType, casterPosition, level = 1, onComplete } = params;
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            if (onComplete) onComplete();
            return;
        }
        
        const casterCol = casterType === 'player' ? 5 : 0;
        const casterRow = casterPosition !== undefined ? casterPosition : 2;
        const casterCell = gridCells[casterCol]?.[casterRow];
        
        if (!casterCell) {
            if (onComplete) onComplete();
            return;
        }
        
        let arrowCount = level === 5 ? 5 : (level >= 3 ? 3 : 2);
        if (level === 5 && Math.random() < 0.2) {
            arrowCount += 3;
        }
        
        let completedArrows = 0;
        
        // Старая логика со случайными целями
        for (let i = 0; i < arrowCount; i++) {
            setTimeout(() => {
                const targetCol = casterType === 'player' ? 0 : 5;
                const randomTargetRow = Math.floor(Math.random() * 5);
                const targetCell = gridCells[targetCol]?.[randomTargetRow];
                
                if (!targetCell) {
                    completedArrows++;
                    if (completedArrows >= arrowCount && onComplete) onComplete();
                    return;
                }
                
                const arrow = new PIXI.Graphics();
                arrow.beginFill(0xFF6600, 1);
                arrow.drawRect(-25, -4, 50, 8);
                arrow.endFill();
                
                arrow.x = casterCell.x + casterCell.width / 2;
                arrow.y = casterCell.y + casterCell.height / 2;
                
                effectsContainer.addChild(arrow);
                
                const targetX = targetCell.x + targetCell.width / 2;
                const targetY = targetCell.y + targetCell.height / 2;
                const duration = 800;
                const startTime = Date.now();
                const startX = casterCell.x + casterCell.width / 2;
                const startY = casterCell.y + casterCell.height / 2;

                const animate = () => {
                    // ПРОВЕРКА: если стрела уничтожена - прерываем анимацию
                    if (!arrow || arrow.destroyed || !arrow.transform || !arrow.parent) {
                        completedArrows++;
                        if (completedArrows >= arrowCount && onComplete) onComplete();
                        return;
                    }

                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    try {
                        arrow.x = startX + (targetX - startX) * progress;
                        arrow.y = startY + (targetY - startY) * progress;
                    } catch (e) {
                        completedArrows++;
                        if (completedArrows >= arrowCount && onComplete) onComplete();
                        return;
                    }

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        effectsContainer.removeChild(arrow);
                        completedArrows++;
                        if (completedArrows >= arrowCount && onComplete) onComplete();
                    }
                };
                
                animate();
            }, i * 200);
        }
    }
    
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.firebolt = {
        play: playFireboltAnimation
    };
    
    console.log('🔥 Анимация "Огненная стрела" зарегистрирована (ОБНОВЛЁННАЯ ВЕРСИЯ)');
})();