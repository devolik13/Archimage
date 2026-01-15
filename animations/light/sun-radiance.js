// animations/light/sun-radiance.js - Анимация заклинания "Сияние солнца"

(function() {
    const ANIMATION_ID = 'sun_radiance';

    function play(params) {
        const {
            casterType,
            casterPosition,
            level = 1
        } = params;

        console.log(`☀️ Sun Radiance animation - Level ${level}`);

        const container = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        if (!container || !gridCells) return;

        // Получаем позиции врагов
        const enemyCol = casterType === 'player' ? 0 : 5;
        const enemies = casterType === 'player' ?
            window.enemyFormation?.filter(w => w && w.hp > 0) :
            window.playerWizards?.filter(w => w.hp > 0);

        if (!enemies || enemies.length === 0) return;

        // Для каждого врага создаём эффект ослепления
        enemies.forEach((enemy, index) => {
            setTimeout(() => {
                let position = -1;

                if (casterType === 'player') {
                    position = window.enemyFormation?.findIndex(w => w && w.id === enemy.id);
                } else {
                    position = window.playerFormation?.findIndex(id => id === enemy.id);
                }

                if (position !== -1) {
                    const cell = gridCells[enemyCol]?.[position];
                    if (cell) {
                        const x = cell.x + cell.width / 2;
                        const y = cell.y + cell.height / 2;
                        createBlindEffect(x, y, container);
                    }
                }
            }, index * 150);
        });
    }

    function createBlindEffect(x, y, container) {
        const blind = new PIXI.Graphics();
        blind.beginFill(0xFFFFFF, 0.8);
        blind.drawCircle(0, 0, 20);
        blind.endFill();
        blind.x = x;
        blind.y = y;
        blind.blendMode = PIXI.BLEND_MODES.ADD;
        container.addChild(blind);

        const startTime = Date.now();
        const duration = 300;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            blind.scale.set(1 + progress * 1.5);
            blind.alpha = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(blind);
                blind.destroy();
            }
        }

        animate();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`☀️ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
