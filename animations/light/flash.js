// animations/light/flash.js - Анимация заклинания "Вспышка"

(function() {
    const ANIMATION_ID = 'flash';

    function play(params) {
        const {
            casterCol,
            casterRow,
            targetCol,
            targetRow,
            onHit,
            onComplete
        } = params;

        console.log(`✨ Flash animation: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

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

        // Создаём снаряд - яркий шар света
        const projectile = new PIXI.Container();

        // Внутреннее ядро
        const core = new PIXI.Graphics();
        core.beginFill(0xFFFFFF);
        core.drawCircle(0, 0, 8);
        core.endFill();
        projectile.addChild(core);

        // Внешнее свечение
        const glow = new PIXI.Graphics();
        glow.beginFill(0xFFD700, 0.5);
        glow.drawCircle(0, 0, 15);
        glow.endFill();
        projectile.addChild(glow);

        projectile.x = startX;
        projectile.y = startY;
        container.addChild(projectile);

        // Анимация полёта
        const duration = 300;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Линейное перемещение
            projectile.x = startX + (endX - startX) * progress;
            projectile.y = startY + (endY - startY) * progress;

            // Пульсация
            const pulse = 1 + Math.sin(elapsed * 0.02) * 0.2;
            projectile.scale.set(pulse);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Попадание
                container.removeChild(projectile);
                projectile.destroy();

                // Эффект вспышки на цели
                createImpactEffect(endX, endY, container);

                if (onHit) onHit();
                if (onComplete) setTimeout(onComplete, 200);
            }
        }

        animate();
    }

    function createImpactEffect(x, y, container) {
        const impact = new PIXI.Graphics();
        impact.beginFill(0xFFD700, 0.8);
        impact.drawCircle(0, 0, 20);
        impact.endFill();
        impact.x = x;
        impact.y = y;
        container.addChild(impact);

        const startTime = Date.now();
        const duration = 200;

        function animateImpact() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            impact.scale.set(1 + progress);
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

    console.log(`✨ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
