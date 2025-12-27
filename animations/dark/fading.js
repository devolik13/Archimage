// animations/dark/fading.js - Анимация заклинания "Угасание"

(function() {
    const ANIMATION_ID = 'fading';

    function play(params) {
        const {
            casterType,
            casterPosition,
            level,
            onComplete
        } = params;

        console.log(`🌑 Fading animation from position ${casterPosition}`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            console.warn('⚠️ Effects container not found');
            if (onComplete) onComplete();
            return;
        }

        // Создаём волну затемнения
        const wave = new PIXI.Graphics();
        wave.beginFill(0x1a0033, 0.4);
        wave.drawRect(0, 0, 800, 600);
        wave.endFill();
        wave.alpha = 0;
        container.addChild(wave);

        // Тёмные нисходящие частицы
        const particles = new PIXI.Container();
        for (let i = 0; i < 40; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x4a0080, 0.5);
            particle.drawCircle(0, 0, 3 + Math.random() * 5);
            particle.endFill();
            particle.x = Math.random() * 800;
            particle.y = -20 - Math.random() * 100;
            particle.speed = 2 + Math.random() * 3;
            particles.addChild(particle);
        }
        container.addChild(particles);

        const startTime = Date.now();
        const duration = 800;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Волна затемнения
            wave.alpha = progress < 0.5 ? progress * 0.6 : 0.3 * (1 - (progress - 0.5) / 0.5);

            // Падающие частицы
            particles.children.forEach((particle) => {
                particle.y += particle.speed;
                if (particle.y > 600) {
                    particle.y = -20;
                    particle.x = Math.random() * 800;
                }
                particle.alpha = 1 - progress;
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(wave);
                container.removeChild(particles);
                wave.destroy();
                particles.destroy();
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
