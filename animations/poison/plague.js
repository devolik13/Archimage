// battle/renderer/animations/poison/plague.js - Анимация заклинания "Чума"
console.log('✅ plague.js загружен');

(function() {
    // Хранилище активных эффектов чумы на целях
    const activePlagueEffects = new Map(); // wizardId -> sprite
    
    function playPlagueAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, targetWizardId, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Plague');
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать эффект чумы - нет контейнера');
            if (onComplete) onComplete();
            return;
        }
        
        const casterCell = gridCells[casterCol]?.[casterRow];
        const targetCell = gridCells[targetCol]?.[targetRow];

        if (!casterCell || !targetCell) {
            console.warn('Не найдены клетки для чумы');
            if (onComplete) onComplete();
            return;
        }

        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
        const casterCellWidth = casterCell.cellWidth || casterCell.width || 60;
        const casterCellHeight = casterCell.cellHeight || casterCell.height || 60;
        const targetCellWidth = targetCell.cellWidth || targetCell.width || 60;
        const targetCellHeight = targetCell.cellHeight || targetCell.height || 60;

        const startX = casterCell.x + casterCellWidth / 2;
        const startY = casterCell.y + casterCellHeight / 2;
        const endX = targetCell.x + targetCellWidth / 2;
        const endY = targetCell.y + targetCellHeight / 2;
        
        // ФАЗА 1: Зелёный шарик летит к цели
        createFlyingOrb(startX, startY, endX, endY, () => {
            // ФАЗА 2: Анимация заражения на цели
            createPlagueEffect(targetCell, targetWizardId, onComplete);
        });
    }
    
    // Фаза 1: Летящий зелёный шарик
    function createFlyingOrb(startX, startY, endX, endY, onHit) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        
        // Создаём простой зелёный шарик
        const orb = new PIXI.Graphics();
        orb.beginFill(0x33FF33, 0.8);
        orb.drawCircle(0, 0, 12);
        orb.endFill();
        
        // Внутреннее свечение
        orb.beginFill(0x66FF66, 0.6);
        orb.drawCircle(0, 0, 8);
        orb.endFill();
        
        // Ядро
        orb.beginFill(0x99FF99, 1);
        orb.drawCircle(0, 0, 4);
        orb.endFill();
        
        orb.x = startX;
        orb.y = startY;
        
        effectsContainer.addChild(orb);
        
        // Анимация полёта
        const duration = 600; // 600ms полёт
        const startTime = Date.now();
        
        const animate = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!orb || orb.destroyed || !orb.transform) {
                if (onHit) onHit();
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Плавное движение с небольшой дугой
            orb.x = startX + (endX - startX) * progress;
            orb.y = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 30;

            // Пульсация
            const pulse = 1 + Math.sin(elapsed * 0.01) * 0.2;
            orb.scale.set(pulse);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Удаляем шарик и запускаем эффект заражения
                if (orb.parent) {
                    effectsContainer.removeChild(orb);
                }
                if (onHit) onHit();
            }
        };
        
        animate();
    }
    
    // Фаза 2: Эффект заражения на цели (длительный)
    function createPlagueEffect(targetCell, targetWizardId, onComplete) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();

        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
        const cellWidth = targetCell.cellWidth || targetCell.width || 60;
        const cellHeight = targetCell.cellHeight || targetCell.height || 60;

        const centerX = targetCell.x + cellWidth / 2;
        const centerY = targetCell.y + cellHeight / 2;
        
        // Удаляем старый эффект чумы если есть
        if (activePlagueEffects.has(targetWizardId)) {
            const oldEffect = activePlagueEffects.get(targetWizardId);
            if (oldEffect && oldEffect.parent) {
                effectsContainer.removeChild(oldEffect);
            }
            if (oldEffect && oldEffect.destroy && !oldEffect.destroyed) {
                try {
                    oldEffect.destroy({ children: true, texture: false, baseTexture: false });
                } catch (e) {
                    console.warn('Ошибка при удалении старого эффекта чумы:', e);
                }
            }
            activePlagueEffects.delete(targetWizardId);
        }
        
        // Загружаем спрайтшит
        const plagueTexturePath = 'images/spells/poison/plague/plague_spritesheet.png';
        
        PIXI.Assets.load(plagueTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру чумы');
                createFallbackPlague();
                return;
            }
            
            // Создаём кадры из спрайтшита 3×3 (768×768)
            const frameWidth = 256; // 768 / 3
            const frameHeight = 256;
            const frames = [];
            
            // Порядок: справа налево, снизу вверх
            const frameOrder = [
                {col: 2, row: 2}, // 9
                {col: 1, row: 2}, // 8
                {col: 0, row: 2}, // 7
                {col: 2, row: 1}, // 6
                {col: 1, row: 1}, // 5
                {col: 0, row: 1}, // 4
                {col: 2, row: 0}, // 3
                {col: 1, row: 0}, // 2
                {col: 0, row: 0}  // 1
            ];
            
            frameOrder.forEach(pos => {
                const frame = new PIXI.Rectangle(
                    pos.col * frameWidth,
                    pos.row * frameHeight,
                    frameWidth,
                    frameHeight
                );
                frames.push(new PIXI.Texture(texture.baseTexture, frame));
            });
            
            // Создаём анимированный спрайт
            const plagueSprite = new PIXI.AnimatedSprite(frames);
            plagueSprite.x = centerX;
            plagueSprite.y = centerY;
            plagueSprite.anchor.set(0.5);
            
            // Масштабируем до размера цели
            const targetSize = Math.min(cellWidth, cellHeight) * 1.2;
            const scale = targetSize / frameWidth;
            plagueSprite.scale.set(scale);
            
            // Настройки анимации
            plagueSprite.animationSpeed = 0.12; // Медленная зловещая анимация
            plagueSprite.loop = true; // Зацикливаем, пока эффект активен
            
            effectsContainer.addChild(plagueSprite);
            plagueSprite.play();
            
            // Сохраняем в активные эффекты
            activePlagueEffects.set(targetWizardId, {
            	sprite: plagueSprite,
            	animationFrameId: null
             });
        
            console.log(`🦠 Эффект чумы наложен на цель ${targetWizardId}`);
            
            // Вызываем callback завершения первой фазы
            if (onComplete) onComplete();
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры чумы:', err);
            createFallbackPlague();
        });
        
        // Fallback - простая графика
        function createFallbackPlague() {
            const plague = new PIXI.Graphics();

            // Зелёное мерцающее облако
            plague.beginFill(0x33CC33, 0.5);
            plague.drawCircle(0, 0, cellWidth * 0.6);
            plague.endFill();

            plague.beginFill(0x228822, 0.3);
            plague.drawCircle(0, 0, cellWidth * 0.4);
            plague.endFill();
    
	    plague.x = centerX;
	    plague.y = centerY;
    
	    effectsContainer.addChild(plague);
    
	    // Пульсирующая анимация
	    const startTime = Date.now();
	    let animationFrameId = null; // ДОБАВЛЕНО: храним ID анимации
	    
	    const animate = () => {
	        // ИЗМЕНЕНО: проверяем наличие в Map
	        if (!activePlagueEffects.has(targetWizardId)) {
	            return; // Останавливаем анимацию
	        }
	        
	        if (!plague.parent) {
	            return; // Спрайт уже удалён
	        }
	        
	        const elapsed = Date.now() - startTime;
	        
	        // Пульсация
	        const pulse = 1 + Math.sin(elapsed * 0.003) * 0.15;
	        plague.scale.set(pulse);
	        
	        // Плавное изменение прозрачности
	        plague.alpha = 0.4 + Math.sin(elapsed * 0.002) * 0.2;
	        
	        // Продолжаем анимацию
	        animationFrameId = requestAnimationFrame(animate);
	    };
	    
	    animationFrameId = requestAnimationFrame(animate);
	    
	    // ИЗМЕНЕНО: сохраняем и спрайт и ID анимации
	    activePlagueEffects.set(targetWizardId, {
	        sprite: plague,
	        animationFrameId: animationFrameId
	    });
    
	    if (onComplete) onComplete();
	}
    }
    
    function removePlagueEffect(targetWizardId) {
    	if (activePlagueEffects.has(targetWizardId)) {
    	    const effectData = activePlagueEffects.get(targetWizardId);
        
    	    // ДОБАВЛЕНО: отменяем requestAnimationFrame если есть
    	    if (effectData.animationFrameId) {
    	        cancelAnimationFrame(effectData.animationFrameId);
    	    }
        
    	    const effect = effectData.sprite || effectData; // совместимость со старым кодом
        
    	    if (effect && effect.parent) {
    	        effect.parent.removeChild(effect);
    	    }
    	    if (effect && effect.destroy && !effect.destroyed) {
    	        try {
    	            effect.destroy({ children: true, texture: false, baseTexture: false });
    	        } catch (e) {
    	            console.warn('Ошибка при удалении эффекта чумы:', e);
    	        }
    	    }
    	    activePlagueEffects.delete(targetWizardId);
    	    console.log(`🦠 Эффект чумы удалён с цели ${targetWizardId}`);
    	}
    }
    
    // Очистка всех эффектов чумы
    function clearAll() {
    	activePlagueEffects.forEach((effectData, wizardId) => {
    	    // ДОБАВЛЕНО: отменяем анимации
    	    if (effectData.animationFrameId) {
    	        cancelAnimationFrame(effectData.animationFrameId);
    	    }
    	    
    	    const effect = effectData.sprite || effectData;
    	    
    	    if (effect && effect.parent) {
    	        effect.parent.removeChild(effect);
    	    }
    	    if (effect && effect.destroy && !effect.destroyed) {
    	        try {
    	            effect.destroy({ children: true, texture: false, baseTexture: false });
    	        } catch (e) {
    	            console.warn('Ошибка при очистке эффекта чумы:', e);
    	        }
    	    }
    	});
    	activePlagueEffects.clear();
    	console.log('🦠 Все эффекты чумы очищены');
    }
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.plague = {
        play: playPlagueAnimation,
        removePlagueEffect: removePlagueEffect,
        clearAll: clearAll
    };
    
    console.log('🦠 Анимация "Чума" зарегистрирована');
})();