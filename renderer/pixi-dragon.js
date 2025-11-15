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

            console.log(`📐 Idle текстура: ${idleTexture.width}×${idleTexture.height}`);
            console.log(`📐 Cast текстура: ${castTexture.width}×${castTexture.height}`);
            console.log(`📐 Death текстура: ${deathTexture.width}×${deathTexture.height}`);

            // Определяем ориентацию спрайт-листа
            const isHorizontal = idleTexture.width > idleTexture.height;

            console.log(`📐 Ориентация: ${isHorizontal ? 'горизонтальная' : 'вертикальная'}`);

            // Разбиваем спрайт-листы на кадры
            const idleFrames = [];
            const castFrames = [];
            const deathFrames = [];

            for (let i = 0; i < DRAGON_CONFIG.frameCount; i++) {
                let idleRect, castRect, deathRect;

                if (isHorizontal) {
                    // Горизонтальный спрайт-лист (2048×256 = 8 кадров по 256×256)
                    idleRect = new PIXI.Rectangle(
                        i * DRAGON_CONFIG.frameWidth,
                        0,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                    castRect = new PIXI.Rectangle(
                        i * DRAGON_CONFIG.frameWidth,
                        0,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                    deathRect = new PIXI.Rectangle(
                        i * DRAGON_CONFIG.frameWidth,
                        0,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                } else {
                    // Вертикальный спрайт-лист (256×2048 = 8 кадров по 256×256)
                    idleRect = new PIXI.Rectangle(
                        0,
                        i * DRAGON_CONFIG.frameHeight,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                    castRect = new PIXI.Rectangle(
                        0,
                        i * DRAGON_CONFIG.frameHeight,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                    deathRect = new PIXI.Rectangle(
                        0,
                        i * DRAGON_CONFIG.frameHeight,
                        DRAGON_CONFIG.frameWidth,
                        DRAGON_CONFIG.frameHeight
                    );
                }

                idleFrames.push(new PIXI.Texture(idleTexture.baseTexture, idleRect));
                castFrames.push(new PIXI.Texture(castTexture.baseTexture, castRect));
                deathFrames.push(new PIXI.Texture(deathTexture.baseTexture, deathRect));
            }

            console.log('✅ Текстуры дракона загружены:', idleFrames.length, 'кадров');
            return { idle: idleFrames, cast: castFrames, death: deathFrames };

        } catch (error) {
            console.warn('⚠️ Текстуры дракона не найдены:', error.message);
            return null;
        }
    }

    // Создание placeholder дракона (заглушка)
    function createPlaceholderDragonGraphics() {
        console.log('🎨 Создание placeholder дракона...');

        const graphics = new PIXI.Graphics();

        // Тело дракона (большой овал)
        graphics.beginFill(0xff4444, 0.8);
        graphics.drawEllipse(0, 0, 100, 80);
        graphics.endFill();

        // Голова
        graphics.beginFill(0xff6666, 0.9);
        graphics.drawCircle(-70, -40, 40);
        graphics.endFill();

        // Глаза
        graphics.beginFill(0xffff00, 1);
        graphics.drawCircle(-80, -45, 8);
        graphics.drawCircle(-60, -45, 8);
        graphics.endFill();

        // Крылья
        graphics.beginFill(0xcc3333, 0.6);
        graphics.drawEllipse(50, -30, 60, 40);
        graphics.drawEllipse(50, 30, 60, 40);
        graphics.endFill();

        // Хвост
        graphics.beginFill(0xff3333, 0.7);
        graphics.moveTo(90, 0);
        graphics.lineTo(150, -20);
        graphics.lineTo(140, 0);
        graphics.lineTo(150, 20);
        graphics.lineTo(90, 0);
        graphics.endFill();

        // Текст "DRAGON"
        const text = new PIXI.Text('🐉', {
            fontSize: 80,
            fill: 0xffffff
        });
        text.anchor.set(0.5);
        graphics.addChild(text);

        return graphics;
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

        let idleSprite, castSprite;
        let isPlaceholder = false;

        // Дракон занимает 3×3 клетки (col 0-2, row 1-3)
        // Позиционируем в центре этой области
        const topLeftCell = gridCells[0]?.[1];  // Левая верхняя клетка
        const bottomRightCell = gridCells[2]?.[3];  // Правая нижняя клетка

        if (!topLeftCell || !bottomRightCell) {
            console.error('❌ Не удалось определить позицию дракона');
            return null;
        }

        // Центр области 3×3
        const centerX = (topLeftCell.x + bottomRightCell.x + bottomRightCell.width) / 2;
        const centerY = (topLeftCell.y + bottomRightCell.y + bottomRightCell.height) / 2;

        // Масштабируем дракона чтобы занимал 3×3 клетки
        const areaWidth = bottomRightCell.x + bottomRightCell.width - topLeftCell.x;
        const areaHeight = bottomRightCell.y + bottomRightCell.height - topLeftCell.y;

        if (!textures || !textures.idle || textures.idle.length === 0) {
            console.warn('⚠️ Используем placeholder для дракона (добавьте PNG в images/dragon/)');
            idleSprite = createPlaceholderDragonGraphics();
            castSprite = createPlaceholderDragonGraphics();
            isPlaceholder = true;

            const placeholderScale = Math.min(areaWidth / 300, areaHeight / 200);
            idleSprite.scale.set(placeholderScale);
            castSprite.scale.set(placeholderScale);
        } else {
            // СОЗДАЕМ ДВА ОТДЕЛЬНЫХ СПРАЙТА - для idle и cast
            idleSprite = new PIXI.AnimatedSprite(textures.idle);
            idleSprite.animationSpeed = DRAGON_CONFIG.animationSpeed;
            idleSprite.anchor.set(0.5);
            idleSprite.loop = true;
            idleSprite.play();

            const scaleToFit = Math.min(areaWidth / DRAGON_CONFIG.frameWidth, areaHeight / DRAGON_CONFIG.frameHeight);
            const finalScale = scaleToFit * DRAGON_CONFIG.scale;

            // Устанавливаем scale для idle и запоминаем размеры
            idleSprite.scale.set(finalScale);
            const targetWidth = idleSprite.width;
            const targetHeight = idleSprite.height;

            console.log(`🐉 Idle sprite: scale=${finalScale}, size=${targetWidth}×${targetHeight}`);

            // Создаем cast спрайт
            castSprite = new PIXI.AnimatedSprite(textures.cast);
            castSprite.animationSpeed = 0.15;
            castSprite.anchor.set(0.5);
            castSprite.loop = false;

            // Принудительно устанавливаем ТОЧНЫЕ размеры как у idle
            castSprite.width = targetWidth;
            castSprite.height = targetHeight;

            // Запускаем castSprite СРАЗУ
            castSprite.play();
            castSprite.stop(); // Останавливаем на первом кадре
            castSprite.visible = false; // Скрываем

            console.log(`🐉 Cast sprite: size=${castSprite.width}×${castSprite.height}, scale=${castSprite.scale.x}`);
        }

        // Позиционируем оба спрайта
        idleSprite.x = centerX;
        idleSprite.y = centerY;
        castSprite.x = centerX;
        castSprite.y = centerY;

        // Добавляем оба спрайта в контейнер
        unitsContainer.addChild(idleSprite);
        unitsContainer.addChild(castSprite);

        // Сохраняем фиксированные размеры
        const fixedWidth = idleSprite.width;
        const fixedHeight = idleSprite.height;

        // Создаем контейнер для дракона
        dragonContainer = {
            idleSprite: idleSprite,   // Спрайт для idle
            castSprite: castSprite,   // Спрайт для cast
            sprite: idleSprite,       // Для обратной совместимости
            idleFrames: textures?.idle || null,
            castFrames: textures?.cast || null,
            deathFrames: textures?.death || null,
            isPlaceholder: isPlaceholder,
            fixedWidth: fixedWidth,   // Фиксированные размеры
            fixedHeight: fixedHeight,
            hp: 500,
            maxHp: 500,
            position: { col: 0, row: 0, width: 3, height: 3 }
        };

        // HP бар для дракона
        const hpBar = createDragonHPBar(idleSprite, centerX, centerY - areaHeight / 2 - 20);
        dragonContainer.hpBar = hpBar.container;
        dragonContainer.hpBarFill = hpBar.fill;

        // Спрайты уже добавлены выше, добавляем только HP бар
        unitsContainer.addChild(hpBar.container);

        dragonSprite = idleSprite;

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
        if (!dragonContainer || !dragonContainer.idleSprite || !dragonContainer.castSprite) {
            console.warn('⚠️ Дракон не найден');
            if (callback) callback();
            return;
        }

        const idleSprite = dragonContainer.idleSprite;
        const castSprite = dragonContainer.castSprite;

        if (dragonContainer.isPlaceholder) {
            // Fallback для placeholder - простое мигание
            const originalAlpha = idleSprite.alpha;
            idleSprite.alpha = 1;

            setTimeout(() => {
                idleSprite.alpha = originalAlpha;
                if (callback) callback();
            }, 300);
        } else {
            console.log('🎬 Анимация атаки дракона - переключение спрайтов');

            // Скрываем idle
            idleSprite.visible = false;

            // ПРИНУДИТЕЛЬНО устанавливаем размеры перед показом
            castSprite.width = dragonContainer.fixedWidth;
            castSprite.height = dragonContainer.fixedHeight;

            // Показываем и запускаем cast
            castSprite.currentFrame = 0;
            castSprite.visible = true;
            castSprite.play();

            console.log(`🎬 BEFORE cast: target=${dragonContainer.fixedWidth}×${dragonContainer.fixedHeight}, actual=${castSprite.width}×${castSprite.height}`);

            // Проверяем размер через requestAnimationFrame (после рендера)
            requestAnimationFrame(() => {
                console.log(`🎬 AFTER render: cast size=${castSprite.width}×${castSprite.height}`);
                // Если размер все равно изменился - принудительно восстанавливаем
                if (Math.abs(castSprite.width - dragonContainer.fixedWidth) > 1) {
                    console.warn(`⚠️ Cast sprite size changed! Forcing back to ${dragonContainer.fixedWidth}×${dragonContainer.fixedHeight}`);
                    castSprite.width = dragonContainer.fixedWidth;
                    castSprite.height = dragonContainer.fixedHeight;
                }
            });

            // Когда cast анимация закончится
            castSprite.onComplete = () => {
                // Останавливаем и скрываем cast
                castSprite.stop();
                castSprite.visible = false;
                castSprite.onComplete = null;

                // Показываем idle
                idleSprite.visible = true;

                console.log('🎬 Возврат к idle');

                if (callback) callback();
            };
        }
    }

    // Анимация смерти дракона
    function playDragonDeathAnimation(callback) {
        if (!dragonContainer || !dragonContainer.sprite) {
            if (callback) callback();
            return;
        }

        const sprite = dragonContainer.sprite;

        if (dragonContainer.isPlaceholder || !dragonContainer.deathFrames || dragonContainer.deathFrames.length === 0) {
            // Fallback для placeholder - затемнение
            console.log('💀 Анимация смерти дракона (placeholder)');
            let alpha = 1;
            const fadeInterval = setInterval(() => {
                if (!window.pixiAnimUtils.isValid(sprite)) {
                    clearInterval(fadeInterval);
                    if (callback) callback();
                    return;
                }

                alpha -= 0.05;
                sprite.alpha = Math.max(0.3, alpha);

                if (alpha <= 0.3) {
                    clearInterval(fadeInterval);
                    if (dragonContainer.hpBar) dragonContainer.hpBar.visible = false;
                    if (callback) callback();
                }
            }, 50);
        } else {
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
