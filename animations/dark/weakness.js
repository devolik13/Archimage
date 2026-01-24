// animations/dark/weakness.js - Анимация заклинания "Слабость"

(function() {
    const ANIMATION_ID = 'weakness';

    function play(params) {
        const {
            casterType,
            targetCol,
            targetRow,
            level,
            onComplete
        } = params;

        console.log(`🌑 Weakness animation on [${targetCol},${targetRow}]`);

        // При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Weakness');
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

        const targetCell = gridCells[targetCol]?.[targetRow];
        if (!targetCell) {
            console.warn('⚠️ Target cell not found');
            if (onComplete) onComplete();
            return;
        }

        const x = targetCell.x + targetCell.width / 2;
        const y = targetCell.y + targetCell.height / 2;

        // Создаём тёмное облако над целью
        const cloud = new PIXI.Container();

        // Тёмные частицы
        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x2d0052, 0.6);
            particle.drawCircle(0, 0, 6 + Math.random() * 4);
            particle.endFill();
            particle.x = (Math.random() - 0.5) * 40;
            particle.y = (Math.random() - 0.5) * 30 - 30;
            cloud.addChild(particle);
        }

        cloud.x = x;
        cloud.y = y;
        container.addChild(cloud);

        const startTime = Date.now();
        const duration = 600;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Движение вниз к цели
            cloud.y = y - 30 + progress * 30;

            // Угасание
            cloud.alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

            // Вращение частиц
            cloud.children.forEach((particle, i) => {
                particle.x = Math.sin(elapsed * 0.003 + i) * 20;
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(cloud);
                cloud.destroy();
                if (onComplete) onComplete();
            }
        }

        animate();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`🌑 Анимация ${ANIMATION_ID} зарегистрирована`);
})();
