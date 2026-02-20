// asset-preloader.js - Система предзагрузки ассетов

// Конфигурация ассетов для предзагрузки
const PRELOAD_ASSETS = {
    // Фоны боёв
    battleBackgrounds: [
        'images/battle/field-background-17.webp',
        'images/battle/field-background-18.webp',
        'images/battle/field-background-19.webp',
        'images/battle/field-background-20.webp',
        'images/battle/field-background-21.webp',
        'images/battle/field-background-22.webp',
        'images/battle/field-background-23.webp',
        'images/battle/field-background-24.webp',
        'images/battle/field-background-25.webp',
        'images/battle/field-background-26.webp',
        'images/battle/field-background-27.webp'
    ],

    // UI окна (для каждой фракции)
    uiWindows: [
        'assets/ui/window/tower_fire.webp',
        'assets/ui/window/tower_water.webp',
        'assets/ui/window/tower_wind.webp',
        'assets/ui/window/tower_earth.webp',
        'assets/ui/window/tower_nature.webp',
        'assets/ui/window/tower_poison.webp',
        'assets/ui/window/tower_light.webp',
        'assets/ui/window/tower_dark.webp',
        'assets/ui/window/tower_necromant.webp'
    ],

    // Арена
    arenaBackgrounds: [
        'assets/ui/arena/arena_fire.webp',
        'assets/ui/arena/arena_water.webp',
        'assets/ui/arena/arena_wind.webp',
        'assets/ui/arena/arena_earth.webp',
        'assets/ui/arena/arena_nature.webp',
        'assets/ui/arena/arena_poison.webp',
        'assets/ui/arena/arena_light.webp',
        'assets/ui/arena/arena_dark.webp',
        'assets/ui/arena/arena_necromant.webp'
    ],

    // Гильдия/Магазин
    guildBackgrounds: [
        'assets/ui/guild/guild_fire.webp',
        'assets/ui/guild/guild_water.webp',
        'assets/ui/guild/guild_wind.webp',
        'assets/ui/guild/guild_earth.webp',
        'assets/ui/guild/guild_nature.webp',
        'assets/ui/guild/guild_poison.webp',
        'assets/ui/guild/guild_light.webp',
        'assets/ui/guild/guild_dark.webp',
        'assets/ui/guild/guild_necromant.webp'
    ],

    // Библиотека заклинаний
    libraryImages: [
        'assets/ui/modals/library_template.webp',
        'assets/ui/modals/spells_fire.webp',
        'assets/ui/modals/spells_water.webp',
        'assets/ui/modals/spells_wind.webp',
        'assets/ui/modals/spells_earth.webp',
        'assets/ui/modals/spells_nature.webp',
        'assets/ui/modals/spells_poison.webp',
        'assets/ui/modals/spells_light.webp',
        'assets/ui/modals/spells_dark.webp',
        'assets/ui/modals/library_template-2.webp'
    ],

    // Подсказки (768x512 webp)
    hintImages: [
        'assets/hints/hint1.webp',
        'assets/hints/hint2.webp',
        'assets/hints/hint3.webp'
    ],

    // Выбор фракции / загрузка
    misc: [
        'assets/faction-background.png'
    ]
};

// Состояние прелоадера
let preloaderState = {
    isLoading: false,
    loaded: 0,
    total: 0,
    errors: []
};

// Создать экран загрузки
function createLoadingScreen() {
    // Удаляем старый если есть
    const existing = document.getElementById('asset-preloader-screen');
    if (existing) existing.remove();

    const screen = document.createElement('div');
    screen.id = 'asset-preloader-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    `;

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <!-- Фоновое изображение -->
            <img src="assets/faction-background.png" alt="Loading" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                opacity: 0.8;
            " onerror="this.style.display='none'">

            <!-- Оверлей с прогрессом -->
            <div style="
                position: absolute;
                bottom: 15%;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                width: 80%;
                max-width: 400px;
            ">
                <!-- Название игры -->
                <div style="
                    font-size: 28px;
                    font-weight: bold;
                    color: #ffd700;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 4px rgba(0,0,0,0.8);
                    margin-bottom: 20px;
                    letter-spacing: 2px;
                ">
                    ARCHIMAGE
                </div>

                <!-- Прогресс бар контейнер -->
                <div style="
                    background: rgba(0, 0, 0, 0.6);
                    border: 2px solid rgba(255, 215, 0, 0.5);
                    border-radius: 10px;
                    padding: 4px;
                    backdrop-filter: blur(5px);
                ">
                    <div id="preloader-progress-bar" style="
                        height: 12px;
                        background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #ffd700 100%);
                        border-radius: 6px;
                        width: 0%;
                        transition: width 0.3s ease;
                        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    "></div>
                </div>

                <!-- Процент загрузки -->
                <div id="preloader-percent" style="
                    margin-top: 10px;
                    font-size: 14px;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                ">
                    Загрузка... 0%
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);
    return screen;
}

// Обновить прогресс
function updateProgress(loaded, total) {
    const percent = Math.round((loaded / total) * 100);

    const progressBar = document.getElementById('preloader-progress-bar');
    const percentText = document.getElementById('preloader-percent');

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    if (percentText) {
        percentText.textContent = `Загрузка... ${percent}%`;
    }
}

// Скрыть экран загрузки с анимацией
function hideLoadingScreen() {
    const screen = document.getElementById('asset-preloader-screen');
    if (screen) {
        screen.style.transition = 'opacity 0.5s ease';
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.remove();
        }, 500);
    }
}

// Загрузить одно изображение
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => {
            console.warn(`⚠️ Не удалось загрузить: ${src}`);
            resolve(src); // Не блокируем загрузку из-за одной картинки
        };
        img.src = src;
    });
}

// Собрать все ассеты для предзагрузки
function getAllAssets() {
    const allAssets = [];

    Object.values(PRELOAD_ASSETS).forEach(category => {
        allAssets.push(...category);
    });

    return allAssets;
}

// Основная функция предзагрузки
async function preloadAllAssets(showScreen = true) {
    console.log('🚀 Начало предзагрузки ассетов...');

    const allAssets = getAllAssets();
    preloaderState.total = allAssets.length;
    preloaderState.loaded = 0;
    preloaderState.isLoading = true;

    if (showScreen) {
        createLoadingScreen();
    }

    const startTime = Date.now();

    // Загружаем параллельно с ограничением
    const BATCH_SIZE = 5;
    for (let i = 0; i < allAssets.length; i += BATCH_SIZE) {
        const batch = allAssets.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (src) => {
            await loadImage(src);
            preloaderState.loaded++;
            updateProgress(preloaderState.loaded, preloaderState.total);
        }));
    }

    const loadTime = Date.now() - startTime;
    console.log(`✅ Предзагрузка завершена за ${loadTime}ms (${allAssets.length} ассетов)`);

    preloaderState.isLoading = false;

    // Загружаем PIXI текстуры в фоне (не блокируя UI)
    // Это кэширует текстуры магов и фонов для быстрого старта боёв
    if (typeof PIXI !== 'undefined' && PIXI.Assets) {
        preloadPixiTextures().catch(e => console.warn('⚠️ PIXI preload error:', e));
    }

    // Небольшая задержка перед скрытием для UX
    await new Promise(resolve => setTimeout(resolve, 300));

    if (showScreen) {
        hideLoadingScreen();
    }

    return true;
}

// Предзагрузка только критичных ассетов (быстрая)
async function preloadCriticalAssets() {
    const criticalAssets = [
        'assets/faction-background.png',
        ...PRELOAD_ASSETS.misc
    ];

    await Promise.all(criticalAssets.map(loadImage));
    console.log('⚡ Критичные ассеты загружены');
}

// Предзагрузка PIXI текстур (для боёв)
// Вызывать после инициализации PIXI
async function preloadPixiTextures() {
    if (typeof PIXI === 'undefined' || !PIXI.Assets) {
        console.warn('⚠️ PIXI не загружен, пропускаем предзагрузку текстур');
        return;
    }

    console.log('🎮 Предзагрузка PIXI текстур...');
    const startTime = Date.now();

    // Критичные текстуры для боёв
    const pixiAssets = [
        // Фоны боёв (выбираем несколько для начала)
        'images/battle/field-background-17.webp',
        'images/battle/field-background-20.webp',
        // Спрайты магов (все фракции)
        'images/wizards/fire/idle.webp',
        'images/wizards/fire/cast.webp',
        'images/wizards/fire/death.webp',
        'images/wizards/water/idle.webp',
        'images/wizards/water/cast.webp',
        'images/wizards/water/death.webp',
        'images/wizards/wind/idle.webp',
        'images/wizards/wind/cast.webp',
        'images/wizards/wind/death.webp',
        'images/wizards/earth/idle.webp',
        'images/wizards/earth/cast.webp',
        'images/wizards/earth/death.webp',
        'images/wizards/nature/idle.webp',
        'images/wizards/nature/cast.webp',
        'images/wizards/nature/death.webp',
        'images/wizards/poison/idle.webp',
        'images/wizards/poison/cast.webp',
        'images/wizards/poison/death.webp',
        'images/wizards/light/idle.webp',
        'images/wizards/light/cast.webp',
        'images/wizards/light/death.webp',
        'images/wizards/dark/idle.webp',
        'images/wizards/dark/cast.webp',
        'images/wizards/dark/death.webp',
        'images/wizards/necromant/idle.webp',
        'images/wizards/necromant/cast.webp',
        'images/wizards/necromant/death.webp'
    ];

    // Загружаем параллельно через PIXI.Assets
    try {
        await Promise.all(pixiAssets.map(async (src) => {
            try {
                await PIXI.Assets.load(src);
            } catch (e) {
                // Игнорируем ошибки отдельных файлов
            }
        }));
        console.log(`✅ PIXI текстуры загружены за ${Date.now() - startTime}ms`);
    } catch (error) {
        console.warn('⚠️ Ошибка предзагрузки PIXI текстур:', error);
    }
}

// Экспортируем функции
window.preloadAllAssets = preloadAllAssets;
window.preloadCriticalAssets = preloadCriticalAssets;
window.preloadPixiTextures = preloadPixiTextures;
window.hideLoadingScreen = hideLoadingScreen;
window.PRELOAD_ASSETS = PRELOAD_ASSETS;

// Автоматическая предзагрузка при старте
// Можно вызвать вручную через window.preloadAllAssets()
console.log('📦 Asset Preloader готов. Вызовите preloadAllAssets() для предзагрузки.');
