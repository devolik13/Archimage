// battle/renderer/animations/fire/burning-effect.js
console.log('✅ burning-effect.js загружен');

(function() {
    // Хранилище активных эффектов горения
    const activeBurningEffects = new Map();
    
    function showBurningEffect(wizard, position, casterType) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) return;
        
        // Определяем позицию мага
        const wizardCol = casterType === 'player' ? 5 : 0;
        const wizardCell = gridCells[wizardCol]?.[position];
        
        if (!wizardCell) return;
        
        const wizardSprite = window.wizardSprites?.[`${wizardCol}_${position}`];
        const centerX = wizardSprite?.x || (wizardCell.x + wizardCell.width / 2);
        const centerY = wizardSprite?.y || (wizardCell.y + wizardCell.height / 2);
        
        const effectKey = `${casterType}_${position}`;
        
        // Удаляем старый эффект если есть
        if (activeBurningEffects.has(effectKey)) {
            removeBurningEffect(effectKey);
        }
        
        // Контейнер для огня
        const fireContainer = new PIXI.Container();
        
        // Позиция с противоположной стороны от листка (справа для игрока, слева для врага)
        const offsetX = casterType === 'player' ? 30 : -30;
        const offsetY = -15;
        
        fireContainer.x = centerX + offsetX;
        fireContainer.y = centerY + offsetY;
        
        // Создаем несколько языков пламени
        const flames = [];
        const flameCount = 4;
        
        for (let i = 0; i < flameCount; i++) {
            const flame = new PIXI.Graphics();
            
            // Рисуем язык пламени
            const drawFlame = (color, scale) => {
                flame.clear();
                flame.beginFill(color, 0.8);
                
                // Форма пламени
                flame.moveTo(0, 0);
    		flame.quadraticCurveTo(-6.4 * scale, -8 * scale, -2.4 * scale, -16 * scale);
    		flame.quadraticCurveTo(0, -20 * scale, 0, -24 * scale);
    		flame.quadraticCurveTo(0, -20 * scale, 2.4 * scale, -16 * scale);
    		flame.quadraticCurveTo(6.4 * scale, -8 * scale, 0, 0);
    
    		flame.endFill();
	    };
            
            const flameData = {
                sprite: flame,
                phase: Math.random() * Math.PI * 2,
                speed: 0.1 + Math.random() * 0.05,
                baseScale: 0.6 + Math.random() * 0.3,
                xOffset: (Math.random() - 0.5) * 8,
                color: i % 2 === 0 ? 0xff6b35 : 0xffa500, // Чередуем оранжевый и желтый
                drawFlame: drawFlame
            };
            
            flame.x = flameData.xOffset;
            fireContainer.addChild(flame);
            flames.push(flameData);
        }
        
        effectsContainer.addChild(fireContainer);
        
        // Анимация колыхания пламени
        const animateFlames = () => {
            if (!fireContainer.parent) return;
            
            const time = Date.now() * 0.001;
            
            flames.forEach((flameData, index) => {
                const { sprite, phase, speed, baseScale, drawFlame, color } = flameData;
                
                // Колыхание
                const wave = Math.sin(time * 3 + phase) * 0.3 + 1;
                const scale = baseScale * wave;
                
                // Перерисовываем пламя с новым масштабом
                drawFlame(color, scale);
                
                // Легкое покачивание
                sprite.rotation = Math.sin(time * 2 + phase) * 0.1;
                
                // Мерцание
                sprite.alpha = 0.6 + Math.sin(time * 5 + phase) * 0.2;
                
                // Вертикальное движение
                sprite.y = Math.sin(time * 2 + phase) * 3;
            });
            
            requestAnimationFrame(animateFlames);
        };
        animateFlames();
        
        // Добавляем искры
        const sparkInterval = setInterval(() => {
            if (!fireContainer.parent) {
                clearInterval(sparkInterval);
                return;
            }
            
            const spark = new PIXI.Graphics();
            spark.beginFill(0xffff00, 1);
            spark.drawCircle(0, 0, 2);
            spark.endFill();
            
            spark.x = fireContainer.x + (Math.random() - 0.5) * 20;
            spark.y = fireContainer.y - 10;
            
            effectsContainer.addChild(spark);
            
            // Анимация искры
            const startY = spark.y;
            let progress = 0;
            const animateSpark = () => {
                progress += 0.02;
                spark.y = startY - progress * 40;
                spark.alpha = 1 - progress;
                spark.scale.set((1 - progress) * 0.5);
                
                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animateSpark);
                } else if (spark.parent) {
                    spark.parent.removeChild(spark);
                }
            };
            animateSpark();
        }, 500);
        
        // Сохраняем эффект
        activeBurningEffects.set(effectKey, {
            container: fireContainer,
            flames: flames,
            sparkInterval: sparkInterval,
            wizard: wizard
        });
    }
    
    function removeBurningEffect(key) {
        const effect = activeBurningEffects.get(key);
        if (!effect) return;
        
        const { container, sparkInterval } = effect;
        
        // Останавливаем генерацию искр
        if (sparkInterval) {
            clearInterval(sparkInterval);
        }
        
        // Плавное затухание
        const fadeOut = () => {
            if (!container || !container.parent) return;
            
            container.alpha -= 0.05;
            
            if (container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                container.parent.removeChild(container);
                container.destroy({ children: true });
                activeBurningEffects.delete(key);
            }
        };
        fadeOut();
    }
    
    function clearAllBurningEffects() {
        activeBurningEffects.forEach((effect, key) => {
            if (effect.sparkInterval) {
                clearInterval(effect.sparkInterval);
            }
            removeBurningEffect(key);
        });
        activeBurningEffects.clear();
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.burning = {
        show: showBurningEffect,
        remove: removeBurningEffect,
        clearAll: clearAllBurningEffects
    };
    
    console.log('🔥 Эффект горения зарегистрирован');
})();