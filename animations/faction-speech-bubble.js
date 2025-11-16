// animations/faction-speech-bubble.js - Речевые пузыри для фракционных бонусов
console.log('✅ faction-speech-bubble.js загружен');

(function() {
    // Тексты для каждой фракции
    const FACTION_TEXTS = {
        fire: "Гори",
        water: "Замерзни",
        wind: "С дороги",
        earth: "Раздавлю",
        nature: "Живи",
        poison: "Отрава"
    };

    // Цвета фракций
    const FACTION_COLORS = {
        fire: 0xFF6B6B,    // Красный
        water: 0x4D96FF,   // Синий
        wind: 0x95FFC4,    // Бирюзовый
        earth: 0x8B7355,   // Коричневый
        nature: 0x4ADE80,  // Зелёный
        poison: 0x84CC16   // Ядовито-зелёный
    };

    /**
     * Показать речевой пузырь над магом
     * @param {string} faction - Фракция мага (fire, water, wind, earth, nature, poison)
     * @param {number} col - Колонка мага (0 для врага, 5 для игрока)
     * @param {number} row - Ряд мага (0-4)
     */
    function showSpeechBubble(faction, col, row) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();

        if (!effectsContainer || !gridCells) {
            console.warn('⚠️ Не могу создать речевой пузырь - нет контейнера');
            return;
        }

        const cellData = gridCells[col]?.[row];
        if (!cellData) {
            console.warn(`⚠️ Нет данных ячейки для ${col}_${row}`);
            return;
        }

        const text = FACTION_TEXTS[faction] || "!";
        const color = FACTION_COLORS[faction] || 0xFFFFFF;

        // Создаём контейнер для пузыря
        const bubbleContainer = new PIXI.Container();

        // Позиция: сбоку от мага, в сторону противника
        // Игрок (col=5) -> пузырь слева (к врагу)
        // Враг (col=0) -> пузырь справа (к игроку)
        const offsetX = col === 5 ? -60 : 60; // Смещение в сторону противника
        const offsetY = -30; // Немного выше мага

        bubbleContainer.x = cellData.x + cellData.width / 2 + offsetX;
        bubbleContainer.y = cellData.y + cellData.height / 2 + offsetY;

        // Создаём пузырь (овал + хвостик)
        const bubble = new PIXI.Graphics();

        // Определяем размеры пузыря на основе текста
        const paddingX = 15;
        const paddingY = 10;
        const textWidth = text.length * 12; // Примерная ширина
        const bubbleWidth = textWidth + paddingX * 2;
        const bubbleHeight = 30;

        // Рисуем белый овал с обводкой цвета фракции
        bubble.lineStyle(3, color, 1);
        bubble.beginFill(0xFFFFFF, 0.95);
        bubble.drawRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
        bubble.endFill();

        // Рисуем хвостик пузыря
        bubble.lineStyle(3, color, 1);
        bubble.beginFill(0xFFFFFF, 0.95);

        // Хвостик направлен к магу
        const tailDirection = col === 5 ? 1 : -1; // Вправо для игрока, влево для врага
        const tailX = tailDirection * 20;
        const tailY = bubbleHeight / 2 - 5;

        bubble.moveTo(tailX - tailDirection * 10, tailY);
        bubble.lineTo(tailX, tailY + 10);
        bubble.lineTo(tailX - tailDirection * 5, tailY);
        bubble.closePath();
        bubble.endFill();

        bubbleContainer.addChild(bubble);

        // Создаём текст
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold',
            fill: color,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        });

        const textSprite = new PIXI.Text(text, textStyle);
        textSprite.anchor.set(0.5);
        textSprite.x = 0;
        textSprite.y = 0;

        bubbleContainer.addChild(textSprite);

        // Добавляем в контейнер эффектов
        effectsContainer.addChild(bubbleContainer);

        // Анимация появления
        bubbleContainer.alpha = 0;
        bubbleContainer.scale.set(0.5);

        const startTime = Date.now();
        const fadeInDuration = 200;  // 0.2 секунды на появление
        const displayDuration = 2000; // 2 секунды показа
        const fadeOutDuration = 300;  // 0.3 секунды на исчезновение

        const animate = () => {
            const elapsed = Date.now() - startTime;

            // Фаза появления
            if (elapsed < fadeInDuration) {
                const progress = elapsed / fadeInDuration;
                bubbleContainer.alpha = progress;
                bubbleContainer.scale.set(0.5 + progress * 0.5);
            }
            // Фаза показа
            else if (elapsed < fadeInDuration + displayDuration) {
                bubbleContainer.alpha = 1;
                bubbleContainer.scale.set(1);
            }
            // Фаза исчезновения
            else if (elapsed < fadeInDuration + displayDuration + fadeOutDuration) {
                const fadeProgress = (elapsed - fadeInDuration - displayDuration) / fadeOutDuration;
                bubbleContainer.alpha = 1 - fadeProgress;
                bubbleContainer.scale.set(1 + fadeProgress * 0.2);
            }
            // Завершение
            else {
                if (bubbleContainer.parent) {
                    effectsContainer.removeChild(bubbleContainer);
                    bubbleContainer.destroy({ children: true });
                }
                return;
            }

            if (bubbleContainer.parent) {
                requestAnimationFrame(animate);
            }
        };

        animate();

        console.log(`💬 Речевой пузырь "${text}" показан для фракции ${faction} на ${col}_${row}`);
    }

    // Экспорт
    window.showFactionSpeechBubble = showSpeechBubble;

    console.log('✅ Система речевых пузырей готова');
})();
