// animations/light/light-beam.js - Анимация заклинания "Луч света"

(function() {
    const ANIMATION_ID = 'light_beam';

    function play(params) {
        const {
            casterCol,
            casterRow,
            targetCol,
            targetRow,
            onHit,
            onComplete
        } = params;

        console.log(`✨ Light Beam animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startSprite = window.wizardSprites?.[`${casterCol}_${casterRow}`];
        const endSprite = window.wizardSprites?.[`${targetCol}_${targetRow}`];

        if (!startSprite || !endSprite) {
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startX = startSprite.x;
        const startY = startSprite.y;
        const endX = endSprite.x;
        const endY = endSprite.y;

        // Вычисляем угол луча
        const angle = Math.atan2(endY - startY, endX - startX);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Создаём контейнер луча
        const beamContainer = new PIXI.Container();
        beamContainer.x = startX;
        beamContainer.y = startY;
        beamContainer.rotation = angle;
        container.addChild(beamContainer);

        // Луч света (линия)
        const beam = new PIXI.Graphics();
        beam.lineStyle(6, 0xFFD700, 0.8);
        beam.moveTo(0, 0);
        beam.lineTo(0, 0); // Начинаем с нулевой длины
        beamContainer.addChild(beam);

        // Свечение вокруг луча
        const glow = new PIXI.Graphics();
        glow.lineStyle(12, 0xFFFFAA, 0.3);
        glow.moveTo(0, 0);
        glow.lineTo(0, 0);
        beamContainer.addChild(glow);

        // Анимация расширения луча
        const duration = 250;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Рисуем луч с текущей длиной
            const currentLength = distance * progress;

            beam.clear();
            beam.lineStyle(6, 0xFFD700, 0.8);
            beam.moveTo(0, 0);
            beam.lineTo(currentLength, 0);

            glow.clear();
            glow.lineStyle(12, 0xFFFFAA, 0.3);
            glow.moveTo(0, 0);
            glow.lineTo(currentLength, 0);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Луч достиг цели
                if (onHit) onHit();

                // Эффект свечения на цели
                createRadianceEffect(endX, endY, container);

                // Затухание луча
                fadeOutBeam(beamContainer, container, onComplete);
            }
        }

        animate();
    }

    function createRadianceEffect(x, y, container) {
        // Эффект сияния (DoT визуализация)
        const radiance = new PIXI.Container();
        radiance.x = x;
        radiance.y = y;
        container.addChild(radiance);

        // Создаём несколько лучей
        for (let i = 0; i < 8; i++) {
            const ray = new PIXI.Graphics();
            ray.lineStyle(2, 0xFFD700, 0.6);
            ray.moveTo(0, 0);
            ray.lineTo(25, 0);
            ray.rotation = (i / 8) * Math.PI * 2;
            radiance.addChild(ray);
        }

        const startTime = Date.now();
        const duration = 500;

        function animateRadiance() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            radiance.rotation = elapsed * 0.005;
            radiance.scale.set(1 + progress * 0.5);
            radiance.alpha = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateRadiance);
            } else {
                container.removeChild(radiance);
                radiance.destroy();
            }
        }

        animateRadiance();
    }

    function fadeOutBeam(beamContainer, container, onComplete) {
        const startTime = Date.now();
        const duration = 150;

        function fade() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            beamContainer.alpha = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                container.removeChild(beamContainer);
                beamContainer.destroy();
                if (onComplete) onComplete();
            }
        }

        fade();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`✨ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
