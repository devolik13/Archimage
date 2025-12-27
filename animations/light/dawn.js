// animations/light/dawn.js - Анимация заклинания "Рассвет"

(function() {
    const ANIMATION_ID = 'dawn';

    function play(params) {
        const {
            casterType,
            level = 1
        } = params;

        console.log(`🌅 Dawn animation - Level ${level}`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) return;

        // Получаем всех союзников
        const allyCol = casterType === 'player' ? 5 : 0;
        const allies = casterType === 'player' ?
            window.playerWizards?.filter(w => w.hp > 0) :
            window.enemyFormation?.filter(w => w && w.hp > 0);

        if (!allies || allies.length === 0) return;

        // Создаём эффект рассвета на фоне (горизонтальная полоса света)
        const dawn = new PIXI.Graphics();
        const centerY = window.innerHeight * 0.5;

        dawn.beginFill(0xFFD700, 0);
        dawn.drawRect(0, centerY - 100, window.innerWidth, 200);
        dawn.endFill();

        container.addChild(dawn);

        // Анимация свечения рассвета
        const glowDuration = 800;
        const startTime = Date.now();

        function animateGlow() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / glowDuration, 1);

            // Пульсация яркости
            const intensity = Math.sin(progress * Math.PI) * 0.3;

            dawn.clear();
            dawn.beginFill(0xFFD700, intensity);
            dawn.drawRect(0, centerY - 100 + (1 - progress) * 50, window.innerWidth, 200);
            dawn.endFill();

            if (progress < 1) {
                requestAnimationFrame(animateGlow);
            } else {
                container.removeChild(dawn);
                dawn.destroy();
            }
        }

        animateGlow();

        // Создаём эффект усиления на каждом союзнике
        allies.forEach((ally, index) => {
            setTimeout(() => {
                let position = -1;

                if (casterType === 'player') {
                    position = window.playerFormation?.findIndex(id => id === ally.id);
                } else {
                    position = window.enemyFormation?.findIndex(w => w && w.id === ally.id);
                }

                if (position !== -1) {
                    createBuffEffect(allyCol, position, level, container);
                }
            }, index * 150);
        });
    }

    function createBuffEffect(col, row, level, container) {
        const sprite = window.wizardSprites?.[`${col}_${row}`];
        if (!sprite) return;

        const buff = new PIXI.Container();
        buff.x = sprite.x;
        buff.y = sprite.y;
        container.addChild(buff);

        // Восходящие частицы света
        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFFD700, 0.8);
            particle.drawCircle(0, 0, 3);
            particle.endFill();
            particle.x = (Math.random() - 0.5) * 40;
            particle.y = 20;
            buff.addChild(particle);

            // Анимация подъёма частицы
            animateParticle(particle, i);
        }

        // Кольцо усиления
        const ring = new PIXI.Graphics();
        ring.lineStyle(3, 0xFFD700, 0.6);
        ring.drawCircle(0, 0, 30);
        buff.addChild(ring);

        // Анимация кольца
        const startTime = Date.now();
        const duration = 800;

        function animateRing() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            ring.scale.set(1 + progress * 0.5);
            ring.alpha = 0.6 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateRing);
            } else {
                container.removeChild(buff);
                buff.destroy();
            }
        }

        animateRing();
    }

    function animateParticle(particle, index) {
        const startY = particle.y;
        const startTime = Date.now();
        const duration = 600 + index * 50;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            particle.y = startY - progress * 60;
            particle.alpha = 0.8 * (1 - progress);
            particle.scale.set(1 - progress * 0.5);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        animate();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`🌅 Анимация ${ANIMATION_ID} зарегистрирована`);
})();
