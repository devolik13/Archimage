// renderer/pixi-dragon.js - Система рендеринга дракона для демо-боя
console.log('✅ pixi-dragon.js загружен');

(function() {
    let dragonSprite = null;
    let dragonContainer = null;

    // Конфигурация спрайтов дракона
    const DRAGON_CONFIG = {
        frameWidth: 256,
        frameHeight: 256,
        frameCount: 8,
        animationSpeed: 0.12,
        scale: 1.2  // Дракон больше магов
    };

    // Загрузка текстур дракона
    async function loadDragonTextures() {
        console.log('🐉 Загрузка текстур дракона...');

        try {
            const idleTexture = await PIXI.Assets.load('images/dragon/idle.png');
            const castTexture = await PIXI.Assets.load('images/dragon/cast.png');
            const deathTexture = await PIXI.Assets.load('images/dragon/death.png');

            // Разбиваем спрайт-листы на кадры
            const idleFrames = [];
            const castFrames = [];
            const deathFrames = [];

            for (let i = 0; i < DRAGON_CONFIG.frameCount; i++) {
                // Idle кадры
                const idleRect = new PIXI.Rectangle(
                    0,
                    i * DRAGON_CONFIG.frameHeight,
                    DRAGON_CONFIG.frameWidth,
                    DRAGON_CONFIG.frameHeight
                );
                idleFrames.push(new PIXI.Texture(idleTexture.baseTexture, idleRect));

                // Cast кадры
                const castRect = new PIXI.Rectangle(
                    0,
                    i * DRAGON_CONFIG.frameHeight,
                    DRAGON_CONFIG.frameWidth,
                    DRAGON_CONFIG.frameHeight
                );
                castFrames.push(new PIXI.Texture(castTexture.baseTexture, castRect));

                // Death кадры
                const deathRect = new PIXI.Rectangle(
                    0,
                    i * DRAGON_CONFIG.frameHeight,
                    DRAGON_CONFIG.frameWidth,
                    DRAGON_CONFIG.frameHeight
                );
                deathFrames.push(new PIXI.Texture(deathTexture.baseTexture, deathRect));
            }

            console.log('✅ Текстуры дракона загружены:', idleFrames.length, 'кадров');
            return { idle: idleFrames, cast: castFrames, death: deathFrames };

        } catch (error) {
            console.error('❌ Ошибка загрузки текстур дракона:', error);
            return null;
        }
    }

    // Создание спрайта дракона на поле 6×5
    async function createDragonSprite() {
        console.log('🐉 Создание спрайта дракона...');

        const unitsContainer = window.pixiCore?.getUnitsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!unitsContainer || !gridCells) {
            console.error('❌ PIXI Core не инициализирован');
            return null;
        }

        // Загружаем текстуры
        const textures = await loadDragonTextures();
        if (!textures || !textures.idle || textures.idle.length === 0) {
            console.error('❌ Не удалось загрузить текстуры дракона');
            return null;
        }

        // Создаем анимированный спрайт
        const sprite = new PIXI.AnimatedSprite(textures.idle);
        sprite.animationSpeed = DRAGON_CONFIG.animationSpeed;
        sprite.anchor.set(0.5);
        sprite.loop = true;
        sprite.play();

        // Дракон занимает 3×3 клетки (col 0-2, row 0-2)
        // Позиционируем в центре этой области
        const topLeftCell = gridCells[0]?.[0];  // Левая верхняя клетка
        const bottomRightCell = gridCells[2]?.[2];  // Правая нижняя клетка

        if (!topLeftCell || !bottomRightCell) {
            console.error('❌ Не удалось определить позицию дракона');
            return null;
        }

        // Центр области 3×3
        const centerX = (topLeftCell.x + bottomRightCell.x + bottomRightCell.width) / 2;
        const centerY = (topLeftCell.y + bottomRightCell.y + bottomRightCell.height) / 2;

        sprite.x = centerX;
        sprite.y = centerY;

        // Масштабируем дракона чтобы занимал 3×3 клетки
        const areaWidth = bottomRightCell.x + bottomRightCell.width - topLeftCell.x;
        const areaHeight = bottomRightCell.y + bottomRightCell.height - topLeftCell.y;
        const scaleToFit = Math.min(areaWidth / DRAGON_CONFIG.frameWidth, areaHeight / DRAGON_CONFIG.frameHeight);
        sprite.scale.set(scaleToFit * DRAGON_CONFIG.scale);

        // Создаем контейнер для дракона
        dragonContainer = {
            sprite: sprite,
            idleFrames: textures.idle,
            castFrames: textures.cast,
            deathFrames: textures.death,
            hp: 500,
            maxHp: 500,
            position: { col: 0, row: 0, width: 3, height: 3 }
        };

        // HP бар для дракона
        const hpBar = createDragonHPBar(sprite, centerX, centerY - areaHeight / 2 - 20);
        dragonContainer.hpBar = hpBar.container;
        dragonContainer.hpBarFill = hpBar.fill;

        unitsContainer.addChild(sprite);
        unitsContainer.addChild(hpBar.container);

        dragonSprite = sprite;

        console.log('✅ Дракон создан на позиции', centerX, centerY);
        return dragonContainer;
    }

    // Создание HP бара дракона
    function createDragonHPBar(sprite, x, y) {
        const hpBarContainer = new PIXI.Container();

        // Фон
        const hpBarBg = new PIXI.Graphics();
        hpBarBg.beginFill(0x000000, 0.7);
        hpBarBg.drawRect(-60, 0, 120, 8);
        hpBarBg.endFill();

        // Заполнение
        const hpBarFill = new PIXI.Graphics();
        hpBarFill.beginFill(0xff4444);
        hpBarFill.drawRect(-60, 0, 120, 8);
        hpBarFill.endFill();

        hpBarContainer.addChild(hpBarBg);
        hpBarContainer.addChild(hpBarFill);
        hpBarContainer.x = x;
        hpBarContainer.y = y;

        return { container: hpBarContainer, fill: hpBarFill };
    }

    // Анимация атаки дракона
    function playDragonAttackAnimation(callback) {
        if (!dragonContainer || !dragonContainer.sprite) {
            console.warn('⚠️ Дракон не найден');
            if (callback) callback();
            return;
        }

        const sprite = dragonContainer.sprite;

        if (dragonContainer.castFrames && dragonContainer.castFrames.length > 0) {
            console.log('🎬 Анимация атаки дракона');

            const originalSpeed = sprite.animationSpeed;

            sprite.stop();
            sprite.textures = dragonContainer.castFrames;
            sprite.animationSpeed = 0.15;
            sprite.loop = false;
            sprite.gotoAndPlay(0);

            sprite.onComplete = () => {
                // Возврат к idle
                sprite.stop();
                sprite.textures = dragonContainer.idleFrames;
                sprite.animationSpeed = originalSpeed;
                sprite.loop = true;
                sprite.gotoAndPlay(0);
                sprite.onComplete = null;

                if (callback) callback();
            };
        } else {
            // Fallback - простое мигание
            const originalAlpha = sprite.alpha;
            sprite.alpha = 0.5;
            setTimeout(() => {
                sprite.alpha = originalAlpha;
                if (callback) callback();
            }, 300);
        }
    }

    // Анимация смерти дракона
    function playDragonDeathAnimation(callback) {
        if (!dragonContainer || !dragonContainer.sprite) {
            if (callback) callback();
            return;
        }

        const sprite = dragonContainer.sprite;

        if (dragonContainer.deathFrames && dragonContainer.deathFrames.length > 0) {
            console.log('💀 Анимация смерти дракона');

            sprite.stop();
            sprite.textures = dragonContainer.deathFrames;
            sprite.animationSpeed = 0.15;
            sprite.loop = false;
            sprite.gotoAndPlay(0);

            sprite.onComplete = () => {
                // Остаемся на последнем кадре
                sprite.gotoAndStop(sprite.textures.length - 1);

                // Скрываем HP бар
                if (dragonContainer.hpBar) {
                    dragonContainer.hpBar.visible = false;
                }

                if (callback) callback();
            };
        } else {
            // Fallback - затемнение
            let alpha = 1;
            const fadeInterval = setInterval(() => {
                alpha -= 0.05;
                sprite.alpha = Math.max(0.3, alpha);

                if (alpha <= 0.3) {
                    clearInterval(fadeInterval);
                    if (dragonContainer.hpBar) dragonContainer.hpBar.visible = false;
                    if (callback) callback();
                }
            }, 50);
        }
    }

    // Обновление HP дракона
    function updateDragonHP(hp, maxHp) {
        if (!dragonContainer || !dragonContainer.hpBarFill) return;

        if (!window.pixiAnimUtils || !window.pixiAnimUtils.isValid(dragonContainer.hpBarFill)) {
            return;
        }

        const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
        dragonContainer.hpBarFill.clear();

        if (hp > 0) {
            const color = 0xff4444;  // Красный для дракона
            dragonContainer.hpBarFill.beginFill(color);
            dragonContainer.hpBarFill.drawRect(-60, 0, 120 * hpPercent, 8);
            dragonContainer.hpBarFill.endFill();
        }

        if (dragonContainer.hpBar && window.pixiAnimUtils.isValid(dragonContainer.hpBar)) {
            dragonContainer.hpBar.visible = hp > 0;
        }

        // Обновляем HP в контейнере
        dragonContainer.hp = hp;
    }

    // Очистка дракона
    function clearDragon() {
        if (dragonSprite) {
            if (dragonSprite.parent) {
                dragonSprite.parent.removeChild(dragonSprite);
            }
            dragonSprite.destroy({ children: true, texture: false, baseTexture: false });
            dragonSprite = null;
        }

        if (dragonContainer) {
            if (dragonContainer.hpBar && dragonContainer.hpBar.parent) {
                dragonContainer.hpBar.parent.removeChild(dragonContainer.hpBar);
                dragonContainer.hpBar.destroy({ children: true });
            }
            dragonContainer = null;
        }

        console.log('🧹 Дракон очищен');
    }

    // Получить контейнер дракона
    function getDragon() {
        return dragonContainer;
    }

    // Экспорт
    window.pixiDragon = {
        create: createDragonSprite,
        playAttack: playDragonAttackAnimation,
        playDeath: playDragonDeathAnimation,
        updateHP: updateDragonHP,
        clear: clearDragon,
        get: getDragon
    };

    console.log('🐉 pixiDragon API готов');
})();
