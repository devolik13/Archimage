// animations/dark/miasma.js - Анимация заклинания "Миазма"

(function() {
    const ANIMATION_ID = 'miasma';

    function play(params) {
        const {
            casterType,
            casterPosition,
            level,
            onComplete
        } = params;

        console.log(`🌑 Miasma animation from position ${casterPosition}`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            console.warn('⚠️ Effects container not found');
            if (onComplete) onComplete();
            return;
        }

        // Создаём волну тёмного тумана по всему полю
        const fog = new PIXI.Container();

        // Тёмные частицы тумана
        for (let i = 0; i < 30; i++) {
            const particle = new PIXI.Graphics();
            const alpha = 0.3 + Math.random() * 0.3;
            particle.beginFill(0x1a0033, alpha);
            particle.drawCircle(0, 0, 15 + Math.random() * 20);
            particle.endFill();
            particle.x = Math.random() * 800;
            particle.y = Math.random() * 400 + 100;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5);
            fog.addChild(particle);
        }

        container.addChild(fog);

        const startTime = Date.now();
        const duration = 1000;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Движение частиц
            fog.children.forEach((particle) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha = (1 - progress) * 0.6;
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(fog);
                fog.destroy();
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
