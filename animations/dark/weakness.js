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

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            console.warn('⚠️ Effects container not found');
            if (onComplete) onComplete();
            return;
        }

        const targetSprite = window.wizardSprites?.[`${targetCol}_${targetRow}`];
        if (!targetSprite) {
            console.warn('⚠️ Target sprite not found');
            if (onComplete) onComplete();
            return;
        }

        const x = targetSprite.x;
        const y = targetSprite.y;

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
