// animations/necromant/bone-cage.js - Анимация заклинания "Костяная клетка"
// Клетка из костей появляется на цели и остаётся пока не разрушена

(function() {
    const ANIMATION_ID = 'bone_cage';

    // Хранилище активных визуалов клеток: wizardId → { sprite, container }
    const activeCages = new Map();

    function playBoneCageAnimation(params) {
        const { casterType, position, targets, level, onComplete } = params;

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

        // Определяем позицию цели
        const target = targets?.[0];
        const targetCol = target?.column ?? (casterType === 'player' ? 0 : 5);
        const targetRow = target?.position ?? position;
        const targetCell = gridCells[targetCol]?.[targetRow];
        const targetWizardId = target?.wizard?.id;

        if (!targetCell) {
            if (onComplete) onComplete();
            return;
        }

        // Если уже есть клетка на этом маге — убираем старую
        if (targetWizardId && activeCages.has(targetWizardId)) {
            removeCageVisual(targetWizardId);
        }

        const targetX = targetCell.x + targetCell.width / 2;
        const targetY = targetCell.y + targetCell.height / 2;
        const cellScale = targetCell.cellScale || 1;

        // Загружаем спрайт клетки
        const cageTexturePath = 'images/spells/necro/bone%20cage/bone_cage.webp';

        PIXI.Assets.load(cageTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                createFallbackCage();
                return;
            }

            const cage = new PIXI.Sprite(texture);
            cage.anchor.set(0.5);

            // Масштаб: целевая высота ~70px * cellScale
            const targetHeight = 70 * cellScale;
            const spriteScale = targetHeight / texture.height;
            cage.scale.set(spriteScale * 0.1);

            cage.x = targetX;
            cage.y = targetY;
            cage.alpha = 0;

            effectsContainer.addChild(cage);

            // Сохраняем визуал
            if (targetWizardId) {
                activeCages.set(targetWizardId, { sprite: cage, container: effectsContainer });
            }

            // Тёмные частицы при появлении
            createBoneParticles(targetX, targetY, cellScale, effectsContainer);

            // Анимация: вырастает из земли
            animateGrowIn(cage, spriteScale, targetY, cellScale, onComplete);

        }).catch(() => {
            createFallbackCage();
        });

        function createFallbackCage() {
            const cage = new PIXI.Graphics();
            const w = 25 * cellScale;
            const h = 35 * cellScale;

            // Вертикальные прутья
            cage.lineStyle(2 * cellScale, 0xE8DCC8, 0.9);
            for (let i = -2; i <= 2; i++) {
                cage.moveTo(i * w / 4, -h / 2);
                cage.lineTo(i * w / 4, h / 2);
            }
            // Горизонтальные перекладины
            cage.moveTo(-w / 2, -h / 3);
            cage.lineTo(w / 2, -h / 3);
            cage.moveTo(-w / 2, h / 3);
            cage.lineTo(w / 2, h / 3);

            cage.x = targetX;
            cage.y = targetY;
            cage.alpha = 0;
            cage.scale.set(0.1);

            effectsContainer.addChild(cage);

            // Сохраняем визуал
            if (targetWizardId) {
                activeCages.set(targetWizardId, { sprite: cage, container: effectsContainer });
            }

            createBoneParticles(targetX, targetY, cellScale, effectsContainer);

            animateGrowIn(cage, 1.0, targetY, cellScale, onComplete);
        }
    }

    // Анимация появления: клетка вырастает из земли
    function animateGrowIn(cage, targetScale, targetY, cellScale, onComplete) {
        const startTime = Date.now();
        const growDuration = 400;

        const animate = () => {
            if (!window.pixiAnimUtils?.isValid(cage)) {
                if (onComplete) onComplete();
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / growDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

            try {
                cage.scale.set(targetScale * (0.1 + 0.9 * eased));
                cage.alpha = eased * 0.85;
                // Поднимается снизу
                cage.y = targetY + (1 - eased) * 15 * cellScale;
            } catch (e) {
                if (onComplete) onComplete();
                return;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Клетка остаётся на месте — не убираем!
                if (onComplete) onComplete();
            }
        };
        animate();
    }

    // Убрать клетку с визуальным эффектом разрушения
    function removeCageVisual(wizardId) {
        const data = activeCages.get(wizardId);
        if (!data) return;

        const { sprite, container } = data;
        activeCages.delete(wizardId);

        if (!sprite || sprite.destroyed) return;

        // Анимация разрушения: мигание + fade out
        const startTime = Date.now();
        const duration = 400;

        const animate = () => {
            if (!window.pixiAnimUtils?.isValid(sprite)) return;

            const progress = Math.min((Date.now() - startTime) / duration, 1);

            try {
                // Мигание при разрушении
                sprite.alpha = (1 - progress) * 0.85 * (Math.sin(progress * Math.PI * 6) * 0.3 + 0.7);
                sprite.scale.set(sprite.scale.x * (1 + progress * 0.01));
            } catch (e) {
                return;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (sprite.parent) container.removeChild(sprite);
                sprite.destroy();
            }
        };
        animate();

        // Частицы при разрушении
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (effectsContainer) {
            createBoneParticles(sprite.x, sprite.y, 1, effectsContainer);
        }
    }

    // Убрать все клетки (конец боя)
    function clearAllCages() {
        for (const [id, data] of activeCages) {
            const { sprite, container } = data;
            if (sprite && !sprite.destroyed) {
                if (sprite.parent) container.removeChild(sprite);
                sprite.destroy();
            }
        }
        activeCages.clear();
    }

    function createBoneParticles(x, y, cellScale, container) {
        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xCCBBAA, 0.8);
            particle.drawPolygon([0, 0, 3 * cellScale, -1, 2 * cellScale, 2 * cellScale]);
            particle.endFill();

            particle.x = x + (Math.random() - 0.5) * 20 * cellScale;
            particle.y = y + 15 * cellScale;
            container.addChild(particle);

            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const speed = 1.5 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const startTime = Date.now();

            const animateParticle = () => {
                if (!window.pixiAnimUtils?.isValid(particle)) return;
                const p = Math.min((Date.now() - startTime) / 400, 1);
                try {
                    particle.x += vx * (1 - p);
                    particle.y += vy * (1 - p);
                    particle.alpha = 0.8 * (1 - p);
                    particle.rotation += 0.15;
                } catch (e) { return; }

                if (p < 1 && particle.parent) {
                    requestAnimationFrame(animateParticle);
                } else if (particle.parent) {
                    container.removeChild(particle);
                    particle.destroy();
                }
            };
            animateParticle();
        }
    }

    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations[ANIMATION_ID] = {
        play: playBoneCageAnimation,
        removeCage: removeCageVisual,
        clearAll: clearAllCages
    };

    console.log('🪤 Анимация "Костяная клетка" зарегистрирована');
})();
