// animations/dark/dark-clot.js - Анимация заклинания "Сгусток тьмы"

(function() {
    const ANIMATION_ID = 'dark_clot';

    function play(params) {
        const {
            casterCol,
            casterRow,
            targetCol,
            targetRow,
            onHit,
            onComplete
        } = params;

        console.log(`🌑 Dark Clot animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) {
            console.warn('⚠️ Effects container not found');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        // Получаем координаты
        const startSprite = window.wizardSprites?.[`${casterCol}_${casterRow}`];
        const endSprite = window.wizardSprites?.[`${targetCol}_${targetRow}`];

        if (!startSprite || !endSprite) {
            console.warn('⚠️ Wizard sprites not found');
            if (onHit) onHit();
            if (onComplete) onComplete();
            return;
        }

        const startX = startSprite.x;
        const startY = startSprite.y;
        const endX = endSprite.x;
        const endY = endSprite.y;

        // Создаём снаряд - тёмный сгусток
        const projectile = new PIXI.Container();

        // Внутреннее ядро - чёрное
        const core = new PIXI.Graphics();
        core.beginFill(0x1a0033);
        core.drawCircle(0, 0, 10);
        core.endFill();
        projectile.addChild(core);

        // Внешнее свечение - фиолетовое
        const glow = new PIXI.Graphics();
        glow.beginFill(0x4a0080, 0.5);
        glow.drawCircle(0, 0, 18);
        glow.endFill();
        projectile.addChild(glow);

        // Тёмные частицы вокруг
        for (let i = 0; i < 4; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x2d0052, 0.7);
            particle.drawCircle(0, 0, 4);
            particle.endFill();
            particle.x = Math.cos(i * Math.PI / 2) * 12;
            particle.y = Math.sin(i * Math.PI / 2) * 12;
            projectile.addChild(particle);
        }

        projectile.x = startX;
        projectile.y = startY;
        container.addChild(projectile);

        // Анимация полёта
        const duration = 350;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Линейное перемещение
            projectile.x = startX + (endX - startX) * progress;
            projectile.y = startY + (endY - startY) * progress;

            // Вращение частиц
            projectile.rotation = elapsed * 0.005;

            // Пульсация
            const pulse = 1 + Math.sin(elapsed * 0.015) * 0.15;
            projectile.scale.set(pulse);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Попадание
                container.removeChild(projectile);
                projectile.destroy();

                // Эффект тёмного взрыва на цели
                createImpactEffect(endX, endY, container);

                if (onHit) onHit();
                if (onComplete) setTimeout(onComplete, 200);
            }
        }

        animate();
    }

    function createImpactEffect(x, y, container) {
        const impact = new PIXI.Graphics();
        impact.beginFill(0x4a0080, 0.8);
        impact.drawCircle(0, 0, 25);
        impact.endFill();
        impact.x = x;
        impact.y = y;
        container.addChild(impact);

        const startTime = Date.now();
        const duration = 250;

        function animateImpact() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            impact.scale.set(1 + progress * 0.5);
            impact.alpha = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateImpact);
            } else {
                container.removeChild(impact);
                impact.destroy();
            }
        }

        animateImpact();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`🌑 Анимация ${ANIMATION_ID} зарегистрирована`);
})();
