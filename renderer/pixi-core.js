// battle/renderer/pixi-core.js - Ядро PIXI рендерера

// Глобальные переменные рендерера
let pixiApp = null;
let battleContainer = null;
let gridContainer = null;
let effectsContainer = null;
let unitsContainer = null;
let gridCells = [];
let updateInterval = null;

// Конфигурация
const PIXI_CONFIG = {
    cellWidth: 60,
    cellHeight: 60,
    cols: 6,
    rows: 5,
    backgroundColor: 0x1a1a2e
};

// В pixi-core.js, в функции initPixiBattle()
function initPixiBattle() {
    console.log('🎮 Инициализация PixiJS боя');
    
    if (pixiApp) {
        destroyPixiBattle();
    }
    
    // Проверяем готовность данных
    if (!window.enemyFormation || !window.playerFormation) {
        console.warn('⚠️ Формации не готовы, ждем...');
        setTimeout(() => initPixiBattle(), 200);
        return;
    }
    
    // НОВОЕ: Полноэкранный размер
    
    const isDemoBattle = document.getElementById('pixi-container') !== null;
    const bottomPanelHeight = isDemoBattle ? 0 : 60; // Для демо 0, для обычного боя 60
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight - bottomPanelHeight;
    console.log('📐 Размер canvas:', maxWidth, 'x', maxHeight);
    
    pixiApp = new PIXI.Application({
        width: maxWidth,
        height: maxHeight,
        backgroundColor: PIXI_CONFIG.backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    
    // ИСПРАВЛЕНО: Сначала проверяем pixi-container, затем pixi-battle-container
    let container = document.getElementById('pixi-container');
    if (!container) {
        container = document.getElementById('pixi-battle-container');
    }
    
    if (container) {
        container.innerHTML = ''; // Очищаем перед добавлением
        container.appendChild(pixiApp.view);

        // Добавляем обработчик клика на canvas для закрытия лога боя
        pixiApp.view.addEventListener('click', () => {
            const logPanel = document.getElementById('battle-log-panel');
            if (logPanel && logPanel.style.display !== 'none' && logPanel.style.right === '0px') {
                // Лог открыт - закрываем его
                if (typeof window.toggleBattleLog === 'function') {
                    window.toggleBattleLog();
                }
            }
        });
    } else {
        console.error('❌ Контейнер для PIXI не найден');
        return;
    }
    
    battleContainer = new PIXI.Container();
    pixiApp.stage.addChild(battleContainer);
    
    // Загружаем фон
    loadBattleFieldBackground();
    
    const gridContainer = new PIXI.Container();
    battleContainer.addChild(gridContainer);
    
    // АДАПТИВНЫЕ сдвиги
    const shiftX = maxWidth * 0.02 + 5;
    const shiftY = maxHeight * 0.03 + 5;
    
    // ВАЖНО: Уменьшаем размер клеток с учётом сдвигов
    const availableWidth = maxWidth - shiftX * 2;
    const availableHeight = maxHeight - shiftY * 2;
    
    PIXI_CONFIG.cellWidth = availableWidth / PIXI_CONFIG.cols;
    PIXI_CONFIG.cellHeight = availableHeight / PIXI_CONFIG.rows;
    
    console.log('📐 Сдвиги:', shiftX.toFixed(1), 'x', shiftY.toFixed(1));
    console.log('📐 Размер клетки:', PIXI_CONFIG.cellWidth.toFixed(1), 'x', PIXI_CONFIG.cellHeight.toFixed(1));
    
    gridContainer.x = shiftX;
    gridContainer.y = shiftY;
    
    unitsContainer = new PIXI.Container();
    battleContainer.addChild(unitsContainer);
    
    unitsContainer.x = shiftX;
    unitsContainer.y = shiftY;
    
    effectsContainer = new PIXI.Container();
    battleContainer.addChild(effectsContainer);
    
    effectsContainer.x = shiftX;
    effectsContainer.y = shiftY;
    
    console.log('📐 Адаптивные сдвиги:', shiftX.toFixed(1), 'x', shiftY.toFixed(1));

    
    updatePixiCoreAPI();
    
    // Рисуем сетку
    drawBattleGrid();
    
    // Инициализация без загрузки атласов
    loadAtlases();

    if (window.pixiWizards && typeof window.pixiWizards.init === 'function') {
        setTimeout(() => {
            console.log('🧙 Инициализация pixi-wizards...');
            if (window.pixiWizards.init()) {
                window.pixiWizards.update();
            } else {
                console.error('❌ pixi-wizards не инициализировался');
            }
        }, 100);
    }
}

function updatePixiCoreAPI() {
    window.pixiCore = {
        getApp: () => pixiApp,
        getEffectsContainer: () => effectsContainer,
        getUnitsContainer: () => unitsContainer,
        getGridCells: () => gridCells,
        init: initPixiBattle,
        destroy: destroyPixiBattle
    };
    
}

// Функция инициализации без загрузки атласов
function loadAtlases() {
    
    updatePixiCoreAPI();
    
    // Создаем магов сразу без ожидания атласов
    setTimeout(() => {
        if (window.pixiWizards) {
            window.pixiWizards.init();
            window.pixiWizards.update();
        }
        startBattleSync();
    }, 100);
}

// Рисование сетки с перспективой (как в оригинале)
function drawBattleGrid() {
    console.log('🎯 Рисуем невидимую сетку для координат');
    
    gridCells = [];
    const perspective = 0.15;
    const topPadding = 20;
    
    for (let col = 0; col < PIXI_CONFIG.cols; col++) {
        gridCells[col] = [];
        
        for (let row = 0; row < PIXI_CONFIG.rows; row++) {
            const cell = new PIXI.Graphics();

            const scale = 0.7 + (row * 0.3 / PIXI_CONFIG.rows);
            const cellWidth = PIXI_CONFIG.cellWidth * scale;
            const cellHeight = PIXI_CONFIG.cellHeight * scale;
            
            const totalWidth = PIXI_CONFIG.cellWidth * PIXI_CONFIG.cols;
            const rowWidth = totalWidth * scale;
            const xOffset = (totalWidth - rowWidth) / 2;
            
            cell.x = xOffset + col * cellWidth + 1;
            cell.y = topPadding + row * PIXI_CONFIG.cellHeight * 0.8;
            
            // Сохраняем данные ячейки (это важно!)
            cell.gridCol = col;
            cell.gridRow = row;
            cell.cellScale = scale;
            cell.width = cellWidth;
            cell.height = cellHeight;
            
            battleContainer.addChild(cell);
            gridCells[col][row] = cell;
        }
    }
    
}

// Синхронизация обновлений
function startBattleSync() {
    
    updateInterval = setInterval(() => {
        if (window.battleState === 'active') {
            // Обновляем магов
            if (window.pixiWizards) {
                window.pixiWizards.update();
            }
            
            // Обновляем активные эффекты
            if (window.spellAnimations) {
                // Обновляем огненные стены
                if (window.spellAnimations.fire_wall?.update) {
                    window.spellAnimations.fire_wall.update();
                }
                // Можно добавить обновление других эффектов
            }
        }
    }, 100);
}

// Уничтожение рендерера
function destroyPixiBattle() {
    console.log('🔥 Уничтожение PixiJS');

    // Защита от повторного вызова - если приложение уже уничтожено
    if (!pixiApp && !battleContainer) {
        console.log('⏭️ PixiJS уже уничтожен, пропускаем');
        return;
    }

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        console.log('⏸️ Интервал обновлений остановлен');
    }

    // ВАЖНО: Сначала очищаем магов
    if (window.pixiWizards?.clear) {
        try {
            window.pixiWizards.clear();
        } catch (error) {
            console.warn('⚠️ Ошибка при очистке магов:', error);
        }
    }

    // Очищаем анимации
    if (window.spellAnimations) {
        Object.keys(window.spellAnimations).forEach(key => {
            if (window.spellAnimations[key]?.clear) {
                try {
                    window.spellAnimations[key].clear();
                } catch (error) {
                    console.warn(`⚠️ Ошибка при очистке анимации ${key}:`, error);
                }
            }
        });
    }

    // Уничтожаем контейнеры
    if (battleContainer) {
        try {
            battleContainer.destroy({ children: true, texture: true, baseTexture: true });
            battleContainer = null;
        } catch (error) {
            console.warn('⚠️ Ошибка при уничтожении battleContainer:', error);
            battleContainer = null;
        }
    }

    // Уничтожаем приложение
    if (pixiApp) {
        try {
            pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
            pixiApp = null;
        } catch (error) {
            console.warn('⚠️ Ошибка при уничтожении pixiApp:', error);
            pixiApp = null;
        }
    }

    // Сбрасываем все ссылки
    gridContainer = null;
    unitsContainer = null;
    effectsContainer = null;
    gridCells = [];

    const container = document.getElementById('pixi-container');
    if (container) {
        container.innerHTML = '';
    }

}

// Экспорт API
window.pixiCore = {
    // Геттеры
    getApp: () => pixiApp,
    getEffectsContainer: () => effectsContainer,
    getUnitsContainer: () => unitsContainer,
    getGridCells: () => gridCells,
    
    // Методы
    init: initPixiBattle,
    destroy: destroyPixiBattle
};

function loadBattleFieldBackground() {

    // Массив доступных фонов (768x512 webp)
    const backgrounds = [
        'images/battle/field-background-1.webp',
        'images/battle/field-background-2.webp',
        'images/battle/field-background-3.webp',
        'images/battle/field-background-4.webp',
        'images/battle/field-background-5.webp',
        'images/battle/field-background-6.webp',
        'images/battle/field-background-7.webp',
        'images/battle/field-background-8.webp'
    ];
    
    // Выбираем случайный
    const bgPath = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    console.log('🎲 Выбран фон:', bgPath);
    
    PIXI.Assets.load(bgPath).then(texture => {
        const fieldBg = new PIXI.Sprite(texture);
        
        // Получаем размеры экрана и текстуры
        const screenWidth = pixiApp.screen.width;
        const screenHeight = pixiApp.screen.height;
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        
        console.log('📐 Размеры:', {
            screen: `${screenWidth}x${screenHeight}`,
            texture: `${textureWidth}x${textureHeight}`,
            screenRatio: (screenWidth / screenHeight).toFixed(2),
            textureRatio: (textureWidth / textureHeight).toFixed(2)
        });
        
        // Проверка мобильного устройства
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) ||
                         'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 ||
                         window.innerWidth <= 768;

        // РЕЖИМ "COVER" - изображение заполняет весь экран
        // С картинками 16:9 обрезки почти не будет
        const scaleX = screenWidth / textureWidth;
        const scaleY = screenHeight / textureHeight;
        const scale = Math.max(scaleX, scaleY); // Полный cover без уменьшения
        
        // Применяем масштаб с сохранением пропорций
        fieldBg.width = textureWidth * scale;
        fieldBg.height = textureHeight * scale;

        // Центрируем по горизонтали, прижимаем к верху
        fieldBg.x = (screenWidth - fieldBg.width) / 2;
        fieldBg.y = 0; // Прижимаем к верхнему краю
        
        // Адаптивная прозрачность в зависимости от устройства
        if (isMobile) {
            // На мобильных делаем фон светлее
            fieldBg.alpha = 0.85; // Светлее для мобильных
            console.log('📱 Мобильное устройство - фон светлее, режим cover');
        } else {
            // На десктопе стандартное затемнение
            fieldBg.alpha = 0.75; // Немного темнее для десктопа
            console.log('💻 Десктоп - стандартная прозрачность, режим cover');
        }
        
        // Добавляем как САМЫЙ ПЕРВЫЙ слой (под всем)
        battleContainer.addChildAt(fieldBg, 0);
        
        // Дополнительная адаптация для очень широких экранов (21:9)
        const aspectRatio = screenWidth / screenHeight;
        if (aspectRatio > 2.1) {
            console.log('🖥️ Ультраширокий экран detected (21:9)');
            // Можно добавить дополнительную логику для ультрашироких мониторов
        }
        
        console.log('📐 Итоговый размер:', fieldBg.width.toFixed(0), 'x', fieldBg.height.toFixed(0));
        console.log('📍 Позиция:', fieldBg.x.toFixed(0), 'x', fieldBg.y.toFixed(0));
        console.log('🔍 Масштаб:', scale.toFixed(2), `(${scale > 1 ? 'увеличение' : 'уменьшение'})`);
        
    }).catch(err => {
        console.warn('⚠️ Не удалось загрузить фон поля:', err);
        
        // Fallback - градиентный фон если изображение не загрузилось
        const fallbackBg = new PIXI.Graphics();
        const screenWidth = pixiApp.screen.width;
        const screenHeight = pixiApp.screen.height;
        
        // Создаем градиент от темно-синего к черному
        fallbackBg.beginFill(0x1a1a2e);
        fallbackBg.drawRect(0, 0, screenWidth, screenHeight);
        fallbackBg.endFill();
        
        // Добавляем текстуру-паттерн
        fallbackBg.beginFill(0x2a2a3e, 0.5);
        for (let i = 0; i < 10; i++) {
            fallbackBg.drawRect(
                Math.random() * screenWidth,
                Math.random() * screenHeight,
                Math.random() * 200 + 50,
                Math.random() * 200 + 50
            );
        }
        fallbackBg.endFill();
        
        battleContainer.addChildAt(fallbackBg, 0);
    });
}

// Добавить экспорт в конец файла где остальные экспорты
window.loadBattleFieldBackground = loadBattleFieldBackground;
window.initPixiBattle = initPixiBattle;
window.destroyPixiBattle = destroyPixiBattle;
window.effectsContainer = effectsContainer;
window.gridCells = gridCells;

console.log('🎮 Ядро рендерера готово');