// battle/renderer/animations/poison/poisoned_glade.js - Анимация заклинания "Ядовитая поляна"

(function() {
    // Хранилище активных полян
    const activeGlades = [];
    
    function playPoisonedGladeAnimation(params) {
        const { targetCol, targetRow, onComplete } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            if (onComplete) onComplete();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) {
            if (onComplete) onComplete();
            return;
        }

        const targetCell = gridCells[targetCol]?.[targetRow];

        if (!targetCell) {
            if (onComplete) onComplete();
            return;
        }

        const centerX = targetCell.x + targetCell.width / 2;
        const centerY = targetCell.y + targetCell.height / 2;

        // Загружаем текстуру спрайтшита
        const gladeTexturePath = 'images/spells/poison/poisoned_glade/glade_spritesheet.webp';

        PIXI.Assets.load(gladeTexturePath).then(texture => {

            if (!texture || !texture.valid) {
                createFallbackGlade();
                return;
            }

            
            // Создаём кадры из спрайтшита 3×3 (768×768)
            const frameWidth = 256; // 768 / 3
            const frameHeight = 256; // 768 / 3
            const frames = [];
            
            // Порядок: 9,8,7,6,5,4,3,2,1 (справа налево, снизу вверх)
            // Сетка:
            // [1,2,3] ← row 0
            // [4,5,6] ← row 1  
            // [7,8,9] ← row 2 (начинаем отсюда)
            
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
            const gladeSprite = new PIXI.AnimatedSprite(frames);
            gladeSprite.x = centerX;
            gladeSprite.y = centerY;
            gladeSprite.anchor.set(0.5);

            // Используем cellScale как в других эффектах (foul-cloud)
            const cellScale = targetCell.cellScale || 0.3; // Fallback на 0.3 если нет
            const scale = (cellScale * 0.8) / 2.5; // Уменьшено в 2.5 раза

            gladeSprite.scale.set(scale);

            // Настройки анимации
            gladeSprite.animationSpeed = 0.15; // ~80ms на кадр при 60 FPS
            gladeSprite.loop = false; // Один раз

            effectsContainer.addChild(gladeSprite);

            // Событие окончания анимации
            gladeSprite.onComplete = () => {
                // Оставляем последний кадр на короткое время
                setTimeout(() => {
                    if (gladeSprite.parent) {
                        effectsContainer.removeChild(gladeSprite);
                        gladeSprite.destroy();
                    }
                    if (onComplete) onComplete();
                }, 200); // Задержка перед исчезновением
            };

            gladeSprite.play();
            activeGlades.push(gladeSprite);
            
        }).catch(err => {
            createFallbackGlade();
        });
        
        // Fallback - простая графика
        function createFallbackGlade() {
            const glade = new PIXI.Graphics();
            
            // Рисуем ядовитое пятно
            glade.beginFill(0x33FF33, 0.6);
            glade.drawCircle(0, 0, targetCell.width * 0.4);
            glade.endFill();
            
            glade.beginFill(0x228822, 0.4);
            glade.drawCircle(0, 0, targetCell.width * 0.3);
            glade.endFill();
            
            glade.x = centerX;
            glade.y = centerY;
            glade.alpha = 0;
            
            effectsContainer.addChild(glade);
            
            // Анимация появления и исчезновения
            const startTime = Date.now();
            const duration = 600;
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(glade)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Появление → удержание → исчезновение
                if (progress < 0.3) {
                    glade.alpha = progress / 0.3;
                } else if (progress < 0.7) {
                    glade.alpha = 1;
                } else {
                    glade.alpha = 1 - (progress - 0.7) / 0.3;
                }
                
                // Пульсация
                const pulse = 1 + Math.sin(elapsed * 0.01) * 0.1;
                glade.scale.set(pulse);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (glade.parent) {
                        effectsContainer.removeChild(glade);
                    }
                    if (onComplete) onComplete();
                }
            };
            
            animate();
            activeGlades.push(glade);
        }
    }
    
    // Очистка всех полян
    function clearAll() {
        activeGlades.forEach(glade => {
            if (glade && glade.parent) {
                glade.parent.removeChild(glade);
                if (glade.destroy) glade.destroy();
            }
        });
        activeGlades.length = 0;
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.poisoned_glade = {
        play: playPoisonedGladeAnimation,
        clearAll: clearAll
    };
})();