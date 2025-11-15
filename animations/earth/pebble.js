// battle/renderer/animations/earth/pebble.js - Анимация заклинания "Камешек" с защитой от ошибок
console.log('✅ pebble.js загружен');

(function() {
    // Хранилище активных снарядов и анимаций
    const activePebbles = [];
    const activeAnimations = [];
    
    function playPebbleAnimation(params) {
        const { casterCol, casterRow, targetCol, targetRow, onHit, isSecond = false } = params;
        
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать камешек - нет контейнера');
            if (onHit) onHit();
            return;
        }
        
        const casterCell = gridCells[casterCol]?.[casterRow];
        const targetCell = gridCells[targetCol]?.[targetRow];
        
        if (!casterCell || !targetCell) {
            console.warn('Не найдены ячейки для камешка');
            if (onHit) onHit();
            return;
        }
        
        const startX = casterCell.x + casterCell.width / 2;
        const startY = casterCell.y + casterCell.height / 2;
        const endX = targetCell.x + targetCell.width / 2;
        const endY = targetCell.y + targetCell.height / 2;
        
        // Загружаем текстуру камня
        const pebbleTexturePath = 'images/spells/earth/pebble/pebble_sprite.png';
        
        PIXI.Assets.load(pebbleTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру камешка');
                createFallbackPebble();
                return;
            }
            
            // Создаем спрайт из одного кадра 768x768
            const pebbleSprite = new PIXI.Sprite(texture);
            pebbleSprite.x = startX;
            pebbleSprite.y = startY;
            pebbleSprite.anchor.set(0.5);
            
            // Масштабируем камень под размер ячейки
            const targetSize = casterCell.cellScale * 40; // Небольшой камень
            const scale = targetSize / 768; // Исходный размер 768px
            pebbleSprite.scale.set(scale);
            
            // Добавляем тень
            pebbleSprite.tint = isSecond ? 0xCCBBAA : 0xFFFFFF; // Второй камень чуть темнее
            
            effectsContainer.addChild(pebbleSprite);
            
            // Анимация полёта с вращением
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            const duration = Math.max(400, distance * 1.5);
            const startTime = Date.now();
            
            // Начальная скорость вращения
            const rotationSpeed = 0.15 + Math.random() * 0.1;
            let animationActive = true;
            
            const animate = () => {
                if (!animationActive || !window.pixiAnimUtils.isValid(pebbleSprite)) {
                    animationActive = false;
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                try {
                    // Параболическая траектория
                    const easeProgress = 1 - Math.pow(1 - progress, 2);
                    pebbleSprite.x = startX + (endX - startX) * easeProgress;
                    
                    // Добавляем дугу полёта
                    const arcHeight = -50 * casterCell.cellScale;
                    const parabola = 4 * progress * (1 - progress);
                    pebbleSprite.y = startY + (endY - startY) * easeProgress + arcHeight * parabola;
                    
                    // Вращение камня
                    pebbleSprite.rotation += rotationSpeed;
                    
                    // Уменьшение размера при приближении
                    const scaleFactor = 1 - progress * 0.2;
                    pebbleSprite.scale.set(scale * scaleFactor);
                } catch (err) {
                    console.warn('Ошибка анимации камешка:', err);
                    animationActive = false;
                    return;
                }
                
                if (progress < 1 && animationActive) {
                    requestAnimationFrame(animate);
                } else {
                    animationActive = false;
                    // Удаляем камень
                    if (pebbleSprite && pebbleSprite.parent) {
                        effectsContainer.removeChild(pebbleSprite);
                        pebbleSprite.destroy();
                    }
                    
                    // Эффект попадания
                    createImpactEffect(endX, endY, casterCell.cellScale);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activePebbles.push({ sprite: pebbleSprite, active: () => animationActive = false });
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры камешка:', err);
            createFallbackPebble();
        });
        
        // Fallback - простая графика
        function createFallbackPebble() {
            const pebble = new PIXI.Graphics();
            
            // Рисуем многоугольный камень
            pebble.beginFill(0x8B7355, 1);
            pebble.moveTo(-10, -8);
            pebble.lineTo(8, -10);
            pebble.lineTo(12, 5);
            pebble.lineTo(5, 10);
            pebble.lineTo(-8, 8);
            pebble.lineTo(-12, -3);
            pebble.closePath();
            pebble.endFill();
            
            // Добавляем блик
            pebble.beginFill(0xBBA988, 0.5);
            pebble.drawCircle(-3, -3, 4);
            pebble.endFill();
            
            pebble.x = startX;
            pebble.y = startY;
            
            effectsContainer.addChild(pebble);
            
            // Анимация
            const duration = 500;
            const startTime = Date.now();
            const rotationSpeed = 0.2;
            let animationActive = true;
            
            const animate = () => {
                if (!animationActive || !window.pixiAnimUtils.isValid(pebble)) {
                    animationActive = false;
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                try {
                    // Траектория с дугой
                    const easeProgress = 1 - Math.pow(1 - progress, 2);
                    pebble.x = startX + (endX - startX) * easeProgress;
                    
                    const arcHeight = -40;
                    const parabola = 4 * progress * (1 - progress);
                    pebble.y = startY + (endY - startY) * easeProgress + arcHeight * parabola;
                    
                    // Вращение
                    pebble.rotation += rotationSpeed;
                } catch (err) {
                    console.warn('Ошибка анимации fallback камешка:', err);
                    animationActive = false;
                    return;
                }
                
                if (progress < 1 && animationActive) {
                    requestAnimationFrame(animate);
                } else {
                    animationActive = false;
                    if (pebble && pebble.parent) {
                        effectsContainer.removeChild(pebble);
                        pebble.destroy();
                    }
                    
                    createImpactEffect(endX, endY, 1);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activePebbles.push({ sprite: pebble, active: () => animationActive = false });
        }
    }
    
    // Эффект попадания
    function createImpactEffect(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Пыль от удара
        const dust = new PIXI.Graphics();
        dust.beginFill(0x998877, 0.6);
        dust.drawCircle(0, 0, 20 * scale);
        dust.endFill();
        dust.x = x;
        dust.y = y;
        dust.scale.set(0.1);
        
        effectsContainer.addChild(dust);
        
        // Анимация пыли
        const dustStart = Date.now();
        const dustDuration = 300;
        let dustAnimationActive = true;
        
        const animateDust = () => {
            // ЗАЩИТА: Проверяем существование объекта
            if (!dustAnimationActive || !window.pixiAnimUtils.isValid(dust)) {
                dustAnimationActive = false;
                return;
            }
            
            const progress = Math.min((Date.now() - dustStart) / dustDuration, 1);
            
            try {
                dust.scale.set(0.1 + progress * 0.9);
                dust.alpha = 0.6 * (1 - progress);
            } catch (err) {
                console.warn('Ошибка анимации пыли:', err);
                dustAnimationActive = false;
                return;
            }
            
            if (progress < 1 && dust.parent && dustAnimationActive) {
                requestAnimationFrame(animateDust);
            } else {
                dustAnimationActive = false;
                if (dust && dust.parent) {
                    effectsContainer.removeChild(dust);
                    dust.destroy();
                }
            }
        };
        animateDust();
        
        // Осколки камня
        createStoneShards(x, y, scale);
    }
    
    // Осколки при попадании
    function createStoneShards(x, y, scale, count = 6) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < count; i++) {
            const shard = new PIXI.Graphics();
            shard.beginFill(0x7A6855, 0.9);
            shard.drawPolygon([0, 0, 3, -2, 2, 2]);
            shard.endFill();
            shard.x = x;
            shard.y = y;
            
            effectsContainer.addChild(shard);
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2; // Летят вверх-в стороны
            
            const startTime = Date.now();
            const duration = 400;
            let shardAnimationActive = true;
            
            const animateShard = () => {
                // ЗАЩИТА: Проверяем существование объекта
                if (!shardAnimationActive || !window.pixiAnimUtils.isValid(shard)) {
                    shardAnimationActive = false;
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                try {
                    shard.x += vx * (1 - progress);
                    shard.y += vy * (1 - progress) + progress * 5; // Падение
                    shard.alpha = 0.9 * (1 - progress);
                    shard.rotation += 0.3;
                } catch (err) {
                    console.warn('Ошибка анимации осколка:', err);
                    shardAnimationActive = false;
                    return;
                }
                
                if (progress < 1 && shard.parent && shardAnimationActive) {
                    requestAnimationFrame(animateShard);
                } else {
                    shardAnimationActive = false;
                    if (shard && shard.parent) {
                        effectsContainer.removeChild(shard);
                        shard.destroy();
                    }
                }
            };
            animateShard();
        }
    }
    
    // Очистка
    function clearAll() {
        // Останавливаем все активные анимации
        activePebbles.forEach(item => {
            if (item.active) item.active(); // Устанавливаем флаг неактивности
            if (item.sprite && item.sprite.parent) {
                try {
                    item.sprite.parent.removeChild(item.sprite);
                    item.sprite.destroy && item.sprite.destroy();
                } catch (err) {
                    console.warn('Ошибка при очистке камешка:', err);
                }
            }
        });
        activePebbles.length = 0;
        console.log('🪨 Все камешки очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.pebble = {
        play: playPebbleAnimation,
        clearAll: clearAll
    };
    
    console.log('🪨 Анимация "Камешек" зарегистрирована с защитой от ошибок');
})();