// animations/dark/shadow-realm.js - Анимация заклинания "Мир теней"

(function() {
    const ANIMATION_ID = 'shadow_realm';

    function play(params) {
        const {
            casterType,
            casterPosition,
            targets,
            level,
            onComplete
        } = params;

        console.log(`🌑 Shadow Realm animation for ${targets?.length || 0} targets`);

        // При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Shadow Realm');
            if (onComplete) onComplete();
            return;
        }

        const container = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!container || !gridCells) {
            console.warn('⚠️ Effects container or grid not found');
            if (onComplete) onComplete();
            return;
        }

        // Создаём тёмные воронки на каждой цели
        const vortices = [];

        targets?.forEach((target, index) => {
            // Находим позицию цели
            let targetCol, targetRow;
            if (casterType === 'player') {
                targetRow = window.enemyFormation?.findIndex(w => w && w.id === target.id);
                targetCol = 0;
            } else {
                targetRow = window.playerFormation?.findIndex(id => id === target.id);
                targetCol = 5;
            }

            if (targetRow === -1) return;

            const targetCell = gridCells[targetCol]?.[targetRow];
            if (!targetCell) return;

            const targetX = targetCell.x + targetCell.width / 2;
            const targetY = targetCell.y + targetCell.height / 2;

            setTimeout(() => {
                const vortex = createVortex(targetX, targetY);
                container.addChild(vortex);
                vortices.push(vortex);
            }, index * 150);
        });

        // Удаляем все воронки после анимации
        setTimeout(() => {
            vortices.forEach(v => {
                if (v.parent) container.removeChild(v);
                v.destroy();
            });
            if (onComplete) onComplete();
        }, 800 + (targets?.length || 0) * 150);
    }

    function createVortex(x, y) {
        const vortex = new PIXI.Container();

        // Внешнее кольцо
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.lineStyle(2, 0x4a0080, 0.6 - i * 0.15);
            ring.drawCircle(0, 0, 30 + i * 10);
            vortex.addChild(ring);
        }

        // Центр
        const core = new PIXI.Graphics();
        core.beginFill(0x1a0033, 0.8);
        core.drawCircle(0, 0, 15);
        core.endFill();
        vortex.addChild(core);

        vortex.x = x;
        vortex.y = y;

        const startTime = Date.now();
        const duration = 600;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Вращение
            vortex.rotation = elapsed * 0.01;

            // Масштабирование
            const scale = progress < 0.5 ? progress * 2 : 2 - progress * 2;
            vortex.scale.set(scale);

            // Прозрачность
            vortex.alpha = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        animate();
        return vortex;
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`🌑 Анимация ${ANIMATION_ID} зарегистрирована`);
})();
