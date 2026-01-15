// animations/light/rainbow-shield.js - Анимация заклинания "Радужный щит"

(function() {
    const ANIMATION_ID = 'rainbow_shield';

    // Хранилище активных щитов
    const activeShields = new Map();

    function play(params) {
        const {
            casterType,
            casterPosition,
            targets,
            level = 1
        } = params;

        console.log(`🌈 Rainbow Shield animation - Level ${level}`);

        const container = window.pixiCore?.getEffectsContainer();
        if (!container) return;

        // Определяем позиции для щита
        const col = casterType === 'player' ? 5 : 0;

        // Для каждой цели создаём щит
        targets?.forEach((target, index) => {
            setTimeout(() => {
                let position = -1;

                if (casterType === 'player') {
                    position = window.playerFormation?.findIndex(id => id === target.id);
                } else {
                    position = window.enemyFormation?.findIndex(w => w && w.id === target.id);
                }

                if (position !== -1) {
                    createShieldEffect(col, position, level, container);
                }
            }, index * 100);
        });
    }

    function createShieldEffect(col, row, level, container) {
        // Используем gridCells как в других анимациях
        const gridCells = window.pixiCore?.getGridCells();
        const cell = gridCells?.[col]?.[row];

        if (!cell) return;

        const centerX = cell.x + cell.width / 2;
        const centerY = cell.y + cell.height / 2;

        const shieldKey = `${col}_${row}`;

        // Удаляем старый щит если есть
        if (activeShields.has(shieldKey)) {
            const oldShield = activeShields.get(shieldKey);
            if (oldShield.parent) container.removeChild(oldShield);
            oldShield.destroy();
            activeShields.delete(shieldKey);
        }

        // Создаём контейнер щита
        const shield = new PIXI.Container();
        shield.x = centerX;
        shield.y = centerY;
        container.addChild(shield);

        // Радужные цвета
        const colors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3];

        // Создаём несколько полупрозрачных колец
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            const color = colors[(i * 2) % colors.length];
            ring.lineStyle(2, color, 0.4);
            ring.drawCircle(0, 0, 30 + i * 5);
            shield.addChild(ring);
        }

        activeShields.set(shieldKey, shield);

        // Анимация появления
        shield.scale.set(0);
        shield.alpha = 0;

        const startTime = Date.now();
        const duration = 300;

        function animateIn() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing
            const eased = 1 - Math.pow(1 - progress, 3);

            shield.scale.set(eased);
            shield.alpha = eased * 0.6;

            if (progress < 1) {
                requestAnimationFrame(animateIn);
            } else {
                // Постоянная анимация вращения
                animateRotation(shield);
            }
        }

        animateIn();
    }

    function animateRotation(shield) {
        if (!shield || !shield.parent) return;

        shield.rotation += 0.01;

        // Пульсация альфы
        shield.alpha = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;

        requestAnimationFrame(() => animateRotation(shield));
    }

    function remove(key) {
        if (activeShields.has(key)) {
            const shield = activeShields.get(key);
            if (shield.parent) {
                shield.parent.removeChild(shield);
            }
            shield.destroy();
            activeShields.delete(key);
        }
    }

    // Регистрация
    window.spellAnimations = window.spellAnimations || {};
    window.spellAnimations[ANIMATION_ID] = { play, remove };

    console.log(`🌈 Анимация ${ANIMATION_ID} зарегистрирована`);
})();
