// animations/necromant/bone-spear.js - Анимация заклинания "Костяное копьё"
// Снаряд летит горизонтально через весь ряд, пронзая всех врагов

(function() {
    const ANIMATION_ID = 'bone_spear';

    function playBoneSpearAnimation(params) {
        const { casterType, position, targets, level, onComplete } = params;

        // При быстрой симуляции пропускаем
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

        // Определяем начальную и конечную позиции
        const startCol = casterType === 'player' ? 5 : 0;
        const endCol = casterType === 'player' ? 0 : 5;

        const startCell = gridCells[startCol]?.[position];
        const endCell = gridCells[endCol]?.[position];

        if (!startCell || !endCell) {
            if (onComplete) onComplete();
            return;
        }

        const startX = startCell.x + startCell.width / 2;
        const startY = startCell.y + startCell.height / 2;
        const endX = endCell.x + endCell.width / 2;
        const cellScale = startCell.cellScale || 1;

        // Создаём копьё (PIXI.Graphics fallback)
        const spear = new PIXI.Graphics();
        const spearLength = 30 * cellScale;
        const spearWidth = 4 * cellScale;
        const direction = casterType === 'player' ? -1 : 1;

        // Древко копья (кость)
        spear.beginFill(0xE8DCC8, 1);
        spear.drawRect(-spearLength / 2, -spearWidth / 2, spearLength, spearWidth);
        spear.endFill();

        // Наконечник (острый)
        spear.beginFill(0xCCBBAA, 1);
        const tipX = direction > 0 ? spearLength / 2 : -spearLength / 2;
        spear.moveTo(tipX, -spearWidth);
        spear.lineTo(tipX + direction * 12 * cellScale, 0);
        spear.lineTo(tipX, spearWidth);
        spear.closePath();
        spear.endFill();

        // Хвост (трещины/декор)
        spear.beginFill(0xB8A898, 0.8);
        const tailX = direction > 0 ? -spearLength / 2 : spearLength / 2;
        spear.drawCircle(tailX, 0, 3 * cellScale);
        spear.endFill();

        spear.x = startX;
        spear.y = startY;
        spear.alpha = 0.95;

        effectsContainer.addChild(spear);

        // Шлейф тёмной энергии
        const trail = new PIXI.Graphics();
        effectsContainer.addChild(trail);

        // Анимация полёта
        const duration = 500;
        const startTime = Date.now();
        let animActive = true;

        const animate = () => {
            if (!animActive || !window.pixiAnimUtils?.isValid(spear)) {
                cleanup();
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 2);

            try {
                spear.x = startX + (endX - startX) * eased;

                // Обновляем шлейф
                trail.clear();
                trail.beginFill(0x708090, 0.3 * (1 - progress));
                const trailLength = 20 * cellScale * (1 - progress * 0.5);
                const trailX = spear.x - direction * trailLength;
                trail.drawEllipse(trailX, startY, trailLength, 2 * cellScale);
                trail.endFill();

                // Вибрация копья
                spear.y = startY + Math.sin(elapsed * 0.05) * 1.5;
            } catch (err) {
                animActive = false;
                cleanup();
                return;
            }

            if (progress < 1 && animActive) {
                requestAnimationFrame(animate);
            } else {
                animActive = false;
                cleanup();
                createImpactEffects(targets, gridCells, cellScale);
                if (onComplete) onComplete();
            }
        };

        animate();

        function cleanup() {
            if (spear && spear.parent) {
                effectsContainer.removeChild(spear);
                spear.destroy();
            }
            if (trail && trail.parent) {
                effectsContainer.removeChild(trail);
                trail.destroy();
            }
        }
    }

    // Эффекты попадания по каждой цели
    function createImpactEffects(targets, gridCells, cellScale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer || !targets) return;

        targets.forEach((t, i) => {
            setTimeout(() => {
                const cell = gridCells[t.column]?.[t.position];
                if (!cell) return;

                const x = cell.x + cell.width / 2;
                const y = cell.y + cell.height / 2;

                // Вспышка попадания (тёмно-серая)
                const flash = new PIXI.Graphics();
                flash.beginFill(0x708090, 0.7);
                flash.drawCircle(0, 0, 15 * cellScale);
                flash.endFill();
                flash.x = x;
                flash.y = y;
                flash.scale.set(0.1);
                effectsContainer.addChild(flash);

                // Осколки костей
                for (let j = 0; j < 4; j++) {
                    const shard = new PIXI.Graphics();
                    shard.beginFill(0xE8DCC8, 0.9);
                    shard.drawPolygon([0, 0, 3, -1, 2, 2]);
                    shard.endFill();
                    shard.x = x;
                    shard.y = y;
                    effectsContainer.addChild(shard);

                    const angle = (Math.PI * 2 / 4) * j + Math.random() * 0.5;
                    const speed = 1.5 + Math.random() * 2;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    const shardStart = Date.now();

                    const animShard = () => {
                        if (!window.pixiAnimUtils?.isValid(shard)) return;
                        const p = Math.min((Date.now() - shardStart) / 300, 1);
                        try {
                            shard.x += vx * (1 - p);
                            shard.y += vy * (1 - p) + p * 3;
                            shard.alpha = 0.9 * (1 - p);
                            shard.rotation += 0.2;
                        } catch (e) { return; }

                        if (p < 1 && shard.parent) {
                            requestAnimationFrame(animShard);
                        } else if (shard.parent) {
                            effectsContainer.removeChild(shard);
                            shard.destroy();
                        }
                    };
                    animShard();
                }

                // Анимация вспышки
                const flashStart = Date.now();
                const animFlash = () => {
                    if (!window.pixiAnimUtils?.isValid(flash)) return;
                    const p = Math.min((Date.now() - flashStart) / 250, 1);
                    try {
                        flash.scale.set(0.1 + p * 0.9);
                        flash.alpha = 0.7 * (1 - p);
                    } catch (e) { return; }

                    if (p < 1 && flash.parent) {
                        requestAnimationFrame(animFlash);
                    } else if (flash.parent) {
                        effectsContainer.removeChild(flash);
                        flash.destroy();
                    }
                };
                animFlash();
            }, i * 80); // Задержка между попаданиями
        });
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations[ANIMATION_ID] = {
        play: playBoneSpearAnimation
    };

    console.log('🦴 Анимация "Костяное копьё" зарегистрирована');
})();
