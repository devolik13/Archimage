// city-view-system.js - Новая система отображения городов с фонами

// Конфигурация путей к изображениям
const CITY_IMAGES_CONFIG = {
    backgrounds: 'images/cities/backgrounds/',
    buildings: 'images/cities/buildings/'
};

// Улучшенная проверка мобильного устройства
function isMobileDevice() {
    // Проверяем по нескольким критериям
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 1024; // Увеличили порог
    const isTelegram = window.Telegram && window.Telegram.WebApp;
    
    // Считаем мобильным если любое из условий true
    const result = isMobileUA || isTouchDevice || isSmallScreen || isTelegram;
    
    console.log('📱 Проверка устройства:', {
        userAgent: isMobileUA,
        touch: isTouchDevice,
        smallScreen: isSmallScreen,
        telegram: isTelegram,
        result: result,
        width: window.innerWidth,
        height: window.innerHeight
    });
    
    return result;
}

// Модалка "Построй здание гильдии"
function showBuildGuildPrompt() {
    const faction = window.userData?.faction || 'fire';

    // Создаём оверлей
    const overlay = document.createElement('div');
    overlay.id = 'build-guild-prompt-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Модальное окно с фоном гильдии
    const modal = document.createElement('div');
    modal.style.cssText = `
        width: 90%;
        max-width: 400px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        position: relative;
    `;

    // Фон гильдии
    const bgImage = document.createElement('img');
    bgImage.src = `assets/ui/guild/guild_${faction}.webp`;
    bgImage.style.cssText = `
        width: 100%;
        height: 250px;
        object-fit: cover;
        display: block;
    `;

    // Контент поверх фона
    const content = document.createElement('div');
    content.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        padding: 20px;
        box-sizing: border-box;
    `;

    content.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">🏰</div>
        <div style="font-size: 20px; font-weight: bold; color: #FFD700; text-align: center; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
            Здание Гильдии не построено
        </div>
        <div style="font-size: 14px; color: #fff; text-align: center; margin-bottom: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
            Постройте Гильдию, чтобы нанимать магов для своей армии
        </div>
        <button id="build-guild-btn" style="
            background: linear-gradient(135deg, #4CAF50, #45a049);
            border: none;
            color: white;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            margin-bottom: 10px;
        ">🏗️ Построить</button>
        <button id="close-guild-prompt-btn" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: #aaa;
            padding: 8px 20px;
            font-size: 14px;
            border-radius: 20px;
            cursor: pointer;
        ">Закрыть</button>
    `;

    modal.appendChild(bgImage);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Обработчики
    document.getElementById('build-guild-btn').addEventListener('click', () => {
        overlay.remove();
        // Открываем меню строительства с фокусом на гильдии
        if (typeof showBuildingSelectionMenu === 'function') {
            showBuildingSelectionMenu();
        }
    });

    document.getElementById('close-guild-prompt-btn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Загрузка фона города (новая версия)
function loadCityBackgroundNew(faction, container) {
    const backgroundPath = `${CITY_IMAGES_CONFIG.backgrounds}${faction}-city.png`;
    console.log(`📷 Загрузка фона (NEW): ${backgroundPath}`);
    
    const backgroundImg = document.createElement('img');
    backgroundImg.src = backgroundPath;
    backgroundImg.className = 'city-background-img';
    
    // Для мобильных устройств используем специальную логику масштабирования
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Вычисляем масштаб по высоте экрана
        const screenHeight = window.innerHeight;
        const imageHeight = 512; // Оригинальная высота изображения
        const imageWidth = 768; // Оригинальная ширина изображения
        const aspectRatio = imageWidth / imageHeight;
        
        // Масштабируем по высоте и сохраняем пропорции
        const scaledHeight = screenHeight;
        const scaledWidth = scaledHeight * aspectRatio;
        
        backgroundImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 50% !important;
            transform: translateX(-50%);
            width: ${scaledWidth}px;
            height: ${scaledHeight}px;
            z-index: 0;
        `;
        
        console.log(`📱 Мобильный масштаб фона: ${scaledWidth}px x ${scaledHeight}px`);
    } else {
        backgroundImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 0;
        `;
        console.log(`🖥️ Desktop режим фона: contain`);
    }
    
    backgroundImg.onload = () => {
    };
    
    backgroundImg.onerror = () => {
        console.error(`❌ Не удалось загрузить фон: ${backgroundPath}`);
        container.style.background = getFactionColor(faction);
    };
    
    container.appendChild(backgroundImg);
}

// Загрузка изображения здания (новая версия)
function loadBuildingImageNew(faction, buildingId, container, zIndex) {
    const buildingPath = `${CITY_IMAGES_CONFIG.buildings}${faction}/${buildingId}.png`;
    console.log(`🏯 Загрузка здания (NEW): ${buildingPath}`);
    
    const buildingImg = document.createElement('img');
    buildingImg.src = buildingPath;
    buildingImg.id = `building-${buildingId}`;
    buildingImg.className = 'city-building';
    
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Используем ту же логику масштабирования что и для фона
        const screenHeight = window.innerHeight;
        const imageHeight = 512;
        const imageWidth = 768;
        const aspectRatio = imageWidth / imageHeight;
        
        const scaledHeight = screenHeight;
        const scaledWidth = scaledHeight * aspectRatio;
        
        buildingImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: ${scaledWidth}px;
            height: ${scaledHeight}px;
            z-index: ${zIndex + 1};
            cursor: pointer;
            transition: filter 0.3s ease;
            pointer-events: none;
        `;
        
        console.log(`📱 Мобильный масштаб здания ${buildingId}: ${scaledWidth}px x ${scaledHeight}px`);
    } else {
        buildingImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: ${zIndex + 1};
            cursor: pointer;
            transition: filter 0.3s ease;
            pointer-events: none;
        `;
        console.log(`🖥️ Desktop режим здания ${buildingId}: contain`);
    }
    
    // Добавляем обработчики событий для подсветки
    buildingImg.onmouseover = () => {
        buildingImg.style.filter = 'drop-shadow(0 0 10px rgba(114, 137, 218, 0.8)) brightness(1.2)';
    };
    
    buildingImg.onmouseout = () => {
        buildingImg.style.filter = 'none';
    };
    
    // Обработчик клика на здание
    buildingImg.onclick = (e) => {
        e.stopPropagation();
        onBuildingClick(buildingId);
    };
    
    buildingImg.onload = () => {
    };
    
    buildingImg.onerror = () => {
        console.error(`❌ Не удалось загрузить здание: ${buildingPath}`);
    };
    
    container.appendChild(buildingImg);
}

// Загрузка построенных зданий (новая версия)
function loadBuiltBuildingsNew(faction, container) {
    console.log('🏗️ Загрузка построенных зданий (NEW)...');
    
    // Получаем список построенных зданий
    const userBuildings = window.userData.buildings || {};
    
    // Фильтруем и упорядочиваем здания (wizard_tower первым)
    const validBuildings = ['wizard_tower', 'library', 'guild', 'pvp_arena', 'blessing_tower', 'arcane_lab', 'time_generator'];
    const buildingsToLoad = validBuildings.filter(buildingId => userBuildings[buildingId]);
    
    if (buildingsToLoad.length === 0) {
        console.log('📭 Нет построенных зданий');
        return;
    }
    
    // Загружаем каждое построенное здание в правильном порядке
    buildingsToLoad.forEach((buildingId, index) => {
        loadBuildingImageNew(faction, buildingId, container, index);
    });
}

// Инициализация системы городов
function initCityViewSystem() {
    console.log('🏛️ Инициализация системы отображения городов');
    
    if (!window.userData || !window.userData.faction) {
        console.error('❌ Нет данных о фракции пользователя');
        return;
    }
    
    // Проверяем и добавляем начальные здания
    initializeDefaultBuildings();
    
    // Переключаем с сетки на новый вид города
    switchToCityView(window.userData.faction);
}

// Инициализация начальных зданий
function initializeDefaultBuildings() {
    // Если у пользователя нет зданий, добавляем начальные
    if (!window.userData.buildings) {
        window.userData.buildings = {};
    }
    
    // Начальные здания - library и time_generator (арена без здания на карте)
    const defaultBuildings = ['library', 'time_generator'];
    
    defaultBuildings.forEach(buildingId => {
        if (!window.userData.buildings[buildingId]) {
            console.log(`🏯 Добавляем начальное здание: ${buildingId}`);
            window.userData.buildings[buildingId] = {
                level: 1,
                building_id: buildingId,
                isDefault: true // Помечаем как начальное
            };
        }
    });
}

// Экспорт core функций
window.isMobileDevice = isMobileDevice;
window.initCityViewSystem = initCityViewSystem;
window.initCityView = initCityViewSystem; // Алиас для обратной совместимости
window.loadBuildingImageNew = loadBuildingImageNew;
// Примечание: switchToCityView экспортируется в city-view-ui.js, где она определена

console.log('🏙️ City View Core загружен');
