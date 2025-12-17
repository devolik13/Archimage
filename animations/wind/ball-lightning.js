// battle/renderer/animations/wind/ball-lightning.js - Анимация заклинания "Шаровая молния"

(function() {
    function playBallLightningAnimation(params) {
        const { targets, casterType, onHitTarget } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            if (onHitTarget && targets) {
                targets.forEach((_, index) => onHitTarget(index));
            }
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        // Проверяем что gridCells реально содержит ячейки
        const hasGridCells = gridCells && gridCells.length > 0 && gridCells[0] && gridCells[0].length > 0;

        if (!effectsContainer || !hasGridCells || !targets || targets.length === 0) {
            // Всё равно применяем урон даже если нет визуала!
            if (onHitTarget && targets) {
                targets.forEach((_, index) => {
                    try {
                        onHitTarget(index);
                    } catch (e) {
                        console.error('⚡ Ошибка при применении урона:', e);
                    }
                });
            }
            return;
        }

        // Загружаем spritesheet шара молнии (с cache buster)
        const cacheBuster = `?v=${Date.now()}`;
        const ballTexturePath = 'images/spells/wind/ball_lightning/ball_spritesheet.webp' + cacheBuster;

        PIXI.Assets.load(ballTexturePath).then(texture => {

            if (!texture || !texture.valid) {
                createFallbackChain(targets, gridCells, effectsContainer, onHitTarget);
                return;
            }

            // Получаем baseTexture из загруженной текстуры
            const baseTexture = texture.baseTexture;

            // Создаем массив текстур из spritesheet (3x3 = 9 кадров)
            const frames = [];
            const frameWidth = 768 / 3;  // 256
            const frameHeight = 768 / 3; // 256

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
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

            // Контейнер для эффектов
            const lightningContainer = new PIXI.Container();
            effectsContainer.addChild(lightningContainer);

            // Запускаем цепочку ударов
            strikeChain(targets, 0, frames, gridCells, lightningContainer, onHitTarget, () => {
                // Удаляем контейнер через небольшую задержку
                setTimeout(() => {
                    if (lightningContainer.parent) {
                        effectsContainer.removeChild(lightningContainer);
                        lightningContainer.destroy({ children: true });
                    }
                }, 1000);
            });
            
        }).catch(err => {
            createFallbackChain(targets, gridCells, effectsContainer, onHitTarget);
        });
    }
    
    // Рекурсивная функция для цепочки ударов шаром
    function strikeChain(targets, currentIndex, frames, gridCells, container, onHitTarget, onComplete) {
        if (currentIndex >= targets.length) {
            if (onComplete) onComplete();
            return;
        }

        const currentTarget = targets[currentIndex];

        // Используем column и position (row) из структуры цели
        const col = currentTarget.column ?? currentTarget.col ?? 0;
        const row = currentTarget.position ?? currentTarget.row ?? 0;
        const currentCell = gridCells[col]?.[row];

        if (!currentCell) {
            // Применяем урон даже если ячейка не найдена!
            if (onHitTarget) {
                try {
                    onHitTarget(currentIndex);
                } catch (e) {
                    console.error(`⚡ Ошибка в onHitTarget(${currentIndex}):`, e);
                }
            }
            setTimeout(() => {
                strikeChain(targets, currentIndex + 1, frames, gridCells, container, onHitTarget, onComplete);
            }, 100);
            return;
        }

        // Используем cellWidth/cellHeight (PIXI getter bug: width/height = 0)
        const cellWidth = currentCell.cellWidth || currentCell.width || 60;
        const cellHeight = currentCell.cellHeight || currentCell.height || 60;

        // Определяем начальную позицию
        let startX, startY;

        if (currentIndex === 0) {
            // Первый шар - с верха экрана
            startX = currentCell.x + cellWidth / 2;
            startY = -50; // Чуть выше экрана
        } else {
            // Последующие шары - от предыдущей цели
            const prevTarget = targets[currentIndex - 1];
            const prevCol = prevTarget.column ?? prevTarget.col ?? 0;
            const prevRow = prevTarget.position ?? prevTarget.row ?? 0;
            const prevCell = gridCells[prevCol]?.[prevRow];
            if (prevCell) {
                const prevCellWidth = prevCell.cellWidth || prevCell.width || 60;
                const prevCellHeight = prevCell.cellHeight || prevCell.height || 60;
                startX = prevCell.x + prevCellWidth / 2;
                startY = prevCell.y + prevCellHeight / 2;
            } else {
                startX = currentCell.x + cellWidth / 2;
                startY = -50;
            }
        }

        const endX = currentCell.x + cellWidth / 2;
        const endY = currentCell.y + cellHeight / 2;

        // Создаем анимированный спрайт шара
        const ball = new PIXI.AnimatedSprite(frames);
        ball.anchor.set(0.5);
        ball.x = startX;
        ball.y = startY;
        ball.animationSpeed = 0.2; // Скорость анимации кадров
        ball.play();

        // Размер шара
        const ballSize = cellWidth * 0.6;
        const scale = ballSize / frames[0].width;
        ball.scale.set(scale);

        // Оригинальные цвета без тонирования
        ball.tint = 0xFFFFFF;
        ball.alpha = 0;

        // След за шаром (добавляем ПЕРЕД шаром, чтобы был позади)
        const trail = new PIXI.Graphics();
        container.addChild(trail);

        container.addChild(ball);
        
        // Анимация полёта шара
        const flyDuration = 700; // Время полёта (было 500)
        const flyStart = Date.now();
        
        const animateFly = () => {
            if (!ball.parent) return;
            
            const elapsed = Date.now() - flyStart;
            const progress = Math.min(elapsed / flyDuration, 1);
            
            // Плавное движение от start к end
            ball.x = startX + (endX - startX) * progress;
            ball.y = startY + (endY - startY) * progress;
            
            // Плавное появление и исчезновение
            if (progress < 0.2) {
                ball.alpha = progress / 0.2; // Появление
            } else if (progress > 0.8) {
                ball.alpha = (1 - progress) / 0.2; // Исчезновение
            } else {
                ball.alpha = 1;
            }
            
            // Рисуем след за шаром (начинаем с i=1 чтобы не перекрывать шар)
            trail.clear();
            trail.beginFill(0x4488FF, 0.3);
            for (let i = 1; i < 6; i++) {
                const trailProgress = Math.max(0, progress - i * 0.04);
                const tx = startX + (endX - startX) * trailProgress;
                const ty = startY + (endY - startY) * trailProgress;
                const size = (ballSize / 2) * (1 - i * 0.15);
                trail.drawCircle(tx, ty, size);
            }
            trail.endFill();
            
            if (progress < 1) {
                requestAnimationFrame(animateFly);
            } else {
                // Полёт завершён - попадание!
                ball.stop();
                if (ball.parent) {
                    container.removeChild(ball);
                    // Не уничтожаем текстуры - они используются другими шарами
                    ball.destroy({ texture: false, baseTexture: false });
                }
                if (trail.parent) {
                    container.removeChild(trail);
                    trail.destroy();
                }

                // Эффект взрыва при попадании
                createImpactExplosion(endX, endY, container, currentCell.cellScale);
                
                // Наносим урон
                if (onHitTarget) {
                    onHitTarget(currentIndex);
                }

                // Следующая цель через задержку
                setTimeout(() => {
                    strikeChain(targets, currentIndex + 1, frames, gridCells, container, onHitTarget, onComplete);
                }, 300);
            }
        };
        
        animateFly();
    }
    
    // Эффект взрыва при попадании шара
    function createImpactExplosion(x, y, container, scale) {
        // Яркая вспышка
        const flash = new PIXI.Graphics();
        flash.beginFill(0xFFFFFF, 1);
        flash.drawCircle(0, 0, 40 * scale);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        flash.blendMode = PIXI.BLEND_MODES.ADD;
        
        container.addChild(flash);
        
        // Кольцо ударной волны
        const ring = new PIXI.Graphics();
        ring.lineStyle(3 * scale, 0xCCFFFF, 1);
        ring.drawCircle(0, 0, 5 * scale);
        ring.x = x;
        ring.y = y;
        ring.blendMode = PIXI.BLEND_MODES.ADD;
        
        container.addChild(ring);
        
        const startTime = Date.now();
        const duration = 400;
        
        const animate = () => {
            // Проверяем оба объекта
            if (!window.pixiAnimUtils.isValid(flash) || !window.pixiAnimUtils.isValid(ring)) {
                if (flash && flash.parent) container.removeChild(flash);
                if (ring && ring.parent) container.removeChild(ring);
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Вспышка быстро гаснет
            flash.alpha = 1 * (1 - progress);
            flash.scale.set(1 + progress * 2);

            // Кольцо расширяется
            ring.alpha = 1 * (1 - progress);
            ring.scale.set(1 + progress * 4);

            if (progress < 1 && flash.parent) {
                requestAnimationFrame(animate);
            } else {
                if (flash.parent) container.removeChild(flash);
                if (ring.parent) container.removeChild(ring);
            }
        };
        animate();
        
        // Разлетающиеся искры
        for (let i = 0; i < 12; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xCCFFFF, 1);
            spark.drawCircle(0, 0, 3 * scale);
            spark.endFill();
            spark.x = x;
            spark.y = y;
            
            container.addChild(spark);
            
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 3 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const sparkStart = Date.now();
            const sparkDuration = 500;
            
            const animateSpark = () => {
                if (!window.pixiAnimUtils.isValid(spark)) return;

                const elapsed = Date.now() - sparkStart;
                const progress = Math.min(elapsed / sparkDuration, 1);

                spark.x += vx;
                spark.y += vy;
                spark.alpha = 1 - progress;

                if (progress < 1 && spark.parent) {
                    requestAnimationFrame(animateSpark);
                } else {
                    if (spark.parent) {
                        container.removeChild(spark);
                    }
                }
            };
            animateSpark();
        }
    }
    
    // Fallback - простые летающие шары без spritesheet
    function createFallbackChain(targets, gridCells, container, onHitTarget) {
        let currentIndex = 0;

        const strikeNext = () => {
            // Проверяем что контейнер ещё существует
            if (!container || container.destroyed) {
                return;
            }

            if (currentIndex >= targets.length) {
                return;
            }

            const target = targets[currentIndex];
            // Используем column и position (row) из структуры цели
            const col = target.column ?? target.col ?? 0;
            const row = target.position ?? target.row ?? 0;
            const cell = gridCells[col]?.[row];

            // Проверяем что ячейка существует и не уничтожена
            if (!cell || cell.destroyed) {
                // Применяем урон даже если ячейка не найдена
                if (onHitTarget) {
                    try {
                        onHitTarget(currentIndex);
                    } catch (e) {
                        console.error(`⚡ Fallback: ошибка в onHitTarget:`, e);
                    }
                }
                currentIndex++;
                setTimeout(strikeNext, 100);
                return;
            }

            // Безопасно получаем размеры и координаты ячейки
            let cellWidth, cellHeight, cellX, cellY;
            try {
                cellWidth = cell.cellWidth || cell.width || 60;
                cellHeight = cell.cellHeight || cell.height || 60;
                cellX = cell.x;
                cellY = cell.y;
            } catch (e) {
                // Ячейка уничтожена, применяем урон без анимации
                if (onHitTarget) {
                    try {
                        onHitTarget(currentIndex);
                    } catch (err) {}
                }
                currentIndex++;
                setTimeout(strikeNext, 100);
                return;
            }

            let startX, startY;

            if (currentIndex === 0) {
                startX = cellX + cellWidth / 2;
                startY = -50;
            } else {
                const prevTarget = targets[currentIndex - 1];
                const prevCol = prevTarget.column ?? prevTarget.col ?? 0;
                const prevRow = prevTarget.position ?? prevTarget.row ?? 0;
                const prevCell = gridCells[prevCol]?.[prevRow];
                if (prevCell && !prevCell.destroyed) {
                    try {
                        const prevCellWidth = prevCell.cellWidth || prevCell.width || 60;
                        const prevCellHeight = prevCell.cellHeight || prevCell.height || 60;
                        startX = prevCell.x + prevCellWidth / 2;
                        startY = prevCell.y + prevCellHeight / 2;
                    } catch (e) {
                        startX = cellX + cellWidth / 2;
                        startY = -50;
                    }
                } else {
                    startX = cellX + cellWidth / 2;
                    startY = -50;
                }
            }

            const endX = cellX + cellWidth / 2;
            const endY = cellY + cellHeight / 2;

            // Простой светящийся круг
            const ball = new PIXI.Graphics();
            ball.beginFill(0xCCFFFF, 1);
            ball.drawCircle(0, 0, cellWidth * 0.3);
            ball.endFill();
            ball.x = startX;
            ball.y = startY;
            ball.blendMode = PIXI.BLEND_MODES.ADD;
            ball.alpha = 0;
            
            container.addChild(ball);
            
            const flyDuration = 500;
            const flyStart = Date.now();
            
            const animateFly = () => {
                if (!ball.parent) return;
                
                const elapsed = Date.now() - flyStart;
                const progress = Math.min(elapsed / flyDuration, 1);
                
                ball.x = startX + (endX - startX) * progress;
                ball.y = startY + (endY - startY) * progress;
                
                if (progress < 0.2) {
                    ball.alpha = progress / 0.2;
                } else if (progress > 0.8) {
                    ball.alpha = (1 - progress) / 0.2;
                } else {
                    ball.alpha = 1;
                }
                
                // Пульсация
                const pulse = 1 + Math.sin(elapsed * 0.02) * 0.2;
                ball.scale.set(pulse);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFly);
                } else {
                    if (ball.parent) {
                        container.removeChild(ball);
                    }
                    
                    createImpactExplosion(endX, endY, container, 1);
                    
                    if (onHitTarget) {
                        onHitTarget(currentIndex);
                    }
                    
                    currentIndex++;
                    setTimeout(strikeNext, 300);
                }
            };
            
            animateFly();
        };
        
        strikeNext();
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.ball_lightning = {
        play: playBallLightningAnimation
    };
})();