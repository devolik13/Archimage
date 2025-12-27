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
        if (!container) return;

        // Получаем центр экрана
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight * 0.3;

        // Создаём солнце в центре
        const sun = new PIXI.Container();
        sun.x = centerX;
        sun.y = centerY;
        container.addChild(sun);

        // Ядро солнца
        const core = new PIXI.Graphics();
        core.beginFill(0xFFFF00);
        core.drawCircle(0, 0, 40);
        core.endFill();
        sun.addChild(core);

        // Внешнее свечение
        const glow = new PIXI.Graphics();
        glow.beginFill(0xFFD700, 0.5);
        glow.drawCircle(0, 0, 60);
        glow.endFill();
        sun.addChild(glow);

        // Лучи
        for (let i = 0; i < 12; i++) {
            const ray = new PIXI.Graphics();
            ray.beginFill(0xFFD700, 0.8);
            ray.moveTo(0, -50);
            ray.lineTo(-5, -80);
            ray.lineTo(5, -80);
            ray.closePath();
            ray.endFill();
            ray.rotation = (i / 12) * Math.PI * 2;
            sun.addChild(ray);
        }

        // Начинаем с маленького размера
        sun.scale.set(0);
        sun.alpha = 0;

        // Анимация появления солнца
        const appearDuration = 400;
        const startTime = Date.now();

        function animateAppear() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / appearDuration, 1);

            // Easing
            const eased = 1 - Math.pow(1 - progress, 2);

            sun.scale.set(eased);
            sun.alpha = eased;
            sun.rotation = elapsed * 0.002;

            if (progress < 1) {
                requestAnimationFrame(animateAppear);
            } else {
                // Создаём лучи, бьющие по врагам
                createBlindingRays(sun, casterType, container);
            }
        }

        animateAppear();
    }

    function createBlindingRays(sun, casterType, container) {
        // Получаем позиции врагов
        const enemyCol = casterType === 'player' ? 0 : 5;
        const enemies = casterType === 'player' ?
            window.enemyFormation?.filter(w => w && w.hp > 0) :
            window.playerWizards?.filter(w => w.hp > 0);

        if (!enemies || enemies.length === 0) {
            fadeOutSun(sun, container);
            return;
        }

        // Для каждого врага создаём луч
        enemies.forEach((enemy, index) => {
            setTimeout(() => {
                let position = -1;

                if (casterType === 'player') {
                    position = window.enemyFormation?.findIndex(w => w && w.id === enemy.id);
                } else {
                    position = window.playerFormation?.findIndex(id => id === enemy.id);
                }

                if (position !== -1) {
                    createBlindingRay(sun, enemyCol, position, container);
                }
            }, index * 100);
        });

        // Убираем солнце после всех лучей
        setTimeout(() => {
            fadeOutSun(sun, container);
        }, enemies.length * 100 + 500);
    }

    function createBlindingRay(sun, col, row, container) {
        const sprite = window.wizardSprites?.[`${col}_${row}`];
        if (!sprite) return;

        const ray = new PIXI.Graphics();

        const startX = sun.x;
        const startY = sun.y;
        const endX = sprite.x;
        const endY = sprite.y;

        ray.lineStyle(8, 0xFFFF00, 0.8);
        ray.moveTo(startX, startY);
        ray.lineTo(startX, startY); // Начинаем с точки

        container.addChild(ray);

        const duration = 200;
        const startTime = Date.now();

        function animateRay() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ray.clear();
            ray.lineStyle(8, 0xFFFF00, 0.8 * (1 - progress * 0.5));
            ray.moveTo(startX, startY);
            ray.lineTo(
                startX + (endX - startX) * progress,
                startY + (endY - startY) * progress
            );

            if (progress < 1) {
                requestAnimationFrame(animateRay);
            } else {
                // Эффект ослепления на враге
                createBlindEffect(endX, endY, container);

                // Затухание луча
                fadeOutRay(ray, container);
            }
        }

        animateRay();
    }

    function createBlindEffect(x, y, container) {
        const blind = new PIXI.Graphics();
        blind.beginFill(0xFFFFFF, 0.8);
        blind.drawCircle(0, 0, 25);
        blind.endFill();
        blind.x = x;
        blind.y = y;
        container.addChild(blind);

        const startTime = Date.now();
        const duration = 300;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            blind.scale.set(1 + progress);
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

    function fadeOutRay(ray, container) {
        const startTime = Date.now();
        const duration = 200;

        function fade() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            ray.alpha = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                container.removeChild(ray);
                ray.destroy();
            }
        }

        fade();
    }

    function fadeOutSun(sun, container) {
        const startTime = Date.now();
        const duration = 300;

        function fade() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            sun.alpha = 1 - progress;
            sun.scale.set(1 + progress * 0.5);

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                container.removeChild(sun);
                sun.destroy();
            }
        }

        fade();
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play };

    console.log(`☀️ Анимация ${ANIMATION_ID} зарегистрирована`);
})();
