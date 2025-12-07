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
    
    // Начальные здания - library и time_generator
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

// Переключение на вид города с фоном
function switchToCityView(faction) {
    
    // Находим контейнер с сеткой
    const cityGrid = document.getElementById('city-grid');
    if (!cityGrid) {
        console.error('❌ Не найден элемент city-grid');
        return;
    }
    
    // Используем улучшенную проверку мобильного устройства
    const isMobile = isMobileDevice();
    console.log(`📱 Мобильное устройство: ${isMobile}`);
    
    // На мобильных делаем полноэкранный режим
    if (isMobile) {
        // Скрываем все лишние элементы
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
        
        const wizardsPanel = document.querySelector('.wizards-panel');
        if (wizardsPanel) wizardsPanel.style.display = 'none';
        
        const playerAvatar = document.getElementById('player-avatar-container');
        if (playerAvatar) playerAvatar.style.display = 'none';
        
        // Убираем все стили с контейнеров и ставим чёрный фон
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; padding: 0; margin: 0; display: block; background: #000;';
        }
        
        const cityView = document.getElementById('city-view');
        if (cityView) {
            cityView.style.cssText = 'width: 100vw; height: 100vh; padding: 0; margin: 0; background: #000;';
        }
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.cssText = 'width: 100vw; height: 100vh; padding: 0; margin: 0; border: none; background: #000;';
        }
        
        // Настраиваем сам cityGrid с чёрным фоном
        cityGrid.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; padding: 0; margin: 0; background: #000;';
    }
    
    // Очищаем содержимое
    cityGrid.innerHTML = '';
    cityGrid.className = 'city-view-container';
    
    // Создаём контейнер для города
    const cityContainer = document.createElement('div');
    cityContainer.id = 'city-background-container';
    
    // Полноэкранные размеры на мобильных...
    if (isMobile) {
        cityContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            border-radius: 0;
            overflow: visible;
            z-index: 1;
            background: #000;
        `;
        console.log('📱 Установлен полноэкранный режим');
    } else {
        // Desktop версия
        cityContainer.style.cssText = `
            position: relative;
            width: 768px;
            height: 512px;
            margin: 0 auto;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            background: #000;
        `;
        console.log('🖥️ Установлен desktop режим');
    }
    
    // Загружаем фон города
    loadCityBackgroundNew(faction, cityContainer);
    
    // Заменяем содержимое
    cityGrid.appendChild(cityContainer);
    
    // Загружаем построенные здания
    loadBuiltBuildingsNew(faction, cityContainer);
    
    // Создаём панель управления (для всех устройств)
    createBottomControlPanel();
    
    // На мобильных добавляем минимальный UI overlay
    if (isMobile) {
        createMobileUIOverlay(faction);
    }
}

// Создание минимального UI для мобильных
function createMobileUIOverlay(faction) {
    // Удаляем старый overlay если есть
    const oldOverlay = document.getElementById('mobile-ui-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'mobile-ui-overlay';
    overlay.className = 'mobile-ui-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        padding: 10px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
        pointer-events: none;
    `;
    
    // Информация о фракции
    const factionInfo = document.createElement('div');
    factionInfo.className = 'faction-info';
    factionInfo.innerHTML = `
        <div style="color: white; font-size: 16px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
            ${getFactionEmoji(faction)} ${getFactionName(faction)}
        </div>
    `;
    
    overlay.appendChild(factionInfo);
    document.body.appendChild(overlay);
    
    // Создаём нижнюю панель управления
    createBottomControlPanel();
}

// Создание нижней панели управления
function createBottomControlPanel() {
    // Удаляем старую панель если есть
    const oldPanel = document.getElementById('bottom-control-panel');
    if (oldPanel) oldPanel.remove();
    
    const panel = document.createElement('div');
    panel.id = 'bottom-control-panel';
    
    // Проверяем: применён ли CSS rotation к контейнеру города
    const needsRotation = window.cssRotationActive === true;
    
    if (needsRotation) {
        // При вертикальной загрузке: панель ВНУТРИ повёрнутого контейнера
        panel.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 140px;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 8px;
            padding: 0 10px 10px 10px;
            box-sizing: border-box;
            z-index: 1001;
        `;
        
        // Добавляем ВНУТРЬ city-background-container
        const cityContainer = document.getElementById('city-background-container');
        if (cityContainer) {
            cityContainer.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
    } else {
        // При горизонтальной загрузке: обычное позиционирование
        console.log('➡️ Панель: обычное позиционирование');
        panel.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 140px;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 8px;
            padding: 0 10px 10px 10px;
            box-sizing: border-box;
            z-index: 1001;
        `;
        
        // Добавляем в body
        document.body.appendChild(panel);
    }
    
    // Вертикальный контейнер для гильдии (сверху) и стройки (снизу)
    const buildGuildStack = document.createElement('div');
    buildGuildStack.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
    `;

    // Определяем фракцию для иконок
    const faction = window.userData?.faction || 'fire';

    // Кнопка гильдии - иконка зависит от фракции
    const guildIconPath = `assets/icons/${faction}/${faction}_guild.webp`;
    const guildButton = createControlButton(guildIconPath, 'Гильдия', () => {
        console.log('🏰 Открыть окно гильдии');

        // Проверяем, построено ли здание гильдии
        const guildLevel = window.userData?.buildings?.guild?.level || 0;

        if (guildLevel === 0) {
            // Здание не построено - показываем модалку с предложением построить
            showBuildGuildPrompt();
            return;
        }

        if (typeof window.openGuildModal === 'function') {
            window.openGuildModal();
        } else {
            showNotification('Гильдия пока недоступна');
        }
    });

    // Кнопка строить - иконка зависит от фракции
    const buildIconPath = `assets/icons/${faction}/${faction}_build.webp`;
    const buildButton = createControlButton(buildIconPath, 'Строить', () => {
        console.log('🏗️ Открыть меню строительства');
        showBuildingSelectionMenu();
    });

    // Собираем стек: гильдия сверху, стройка снизу
    buildGuildStack.appendChild(guildButton);
    buildGuildStack.appendChild(buildButton);

    // Кнопка заклинаний - иконка зависит от фракции
    const spellsIconPath = `assets/icons/${faction}/${faction}_spells.webp`;
    const spellsButton = createControlButton(spellsIconPath, 'Заклинания', () => {
        console.log('📖 Открыть библиотеку заклинаний');
        if (window.showLibrary) {
            window.showLibrary();
        } else {
            showNotification('Библиотека пока недоступна');
        }
    });

    // Кнопка арены - иконка зависит от фракции
    const arenaIconPath = `assets/icons/${faction}/${faction}_arena.webp`;
    const arenaButton = createControlButton(arenaIconPath, 'Арена', () => {
        console.log('⚔️ Открыть арену');
        if (window.showPvPArenaModal) {
            window.showPvPArenaModal();
        } else if (window.startDemoBattle) {
            window.startDemoBattle();
        } else {
            showNotification('Арена пока недоступна');
        }
    });
    
    // Добавляем кнопки
    panel.appendChild(buildGuildStack); // Стек: гильдия сверху, стройка снизу
    panel.appendChild(spellsButton);
    panel.appendChild(arenaButton);
    
    // Добавляем разделитель
    const separator = document.createElement('div');
    separator.style.cssText = `
        width: 2px;
        height: 50px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 5px;
    `;
    panel.appendChild(separator);
    
    // Слоты для магов (5 штук)
    for (let i = 0; i < 5; i++) {
        const wizardSlot = createWizardSlot(i);
        panel.appendChild(wizardSlot);
    }
    
    // Добавляем ещё разделитель
    const separator2 = document.createElement('div');
    separator2.style.cssText = separator.style.cssText;
    panel.appendChild(separator2);

    // Вертикальный контейнер для airdrop (сверху) и магазина (снизу)
    const airdropShopStack = document.createElement('div');
    airdropShopStack.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
    `;

    // Кнопка airdrop (сверху)
    const airdropButton = createControlButton('🪂', 'Airdrop', () => {
        console.log('🪂 Открыть окно airdrop');
        if (typeof window.showAirdropModal === 'function') {
            window.showAirdropModal();
        } else {
            showNotification('Airdrop скоро будет доступен!');
        }
    });

    // Кнопка магазина (снизу)
    const shopButton = createControlButton('🛒', 'Магазин', () => {
        console.log('🛒 Открыть магазин');
        if (typeof window.showShopModal === 'function') {
            window.showShopModal();
        } else {
            showNotification('Магазин скоро откроется!');
        }
    });

    // Собираем стек: airdrop сверху, магазин снизу
    airdropShopStack.appendChild(airdropButton);
    airdropShopStack.appendChild(shopButton);

    panel.appendChild(airdropShopStack);
}

// Создание кнопки управления (поддерживает emoji и путь к изображению)
function createControlButton(icon, label, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
        width: 60px;
        height: 60px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        background: linear-gradient(145deg, rgba(50, 50, 70, 0.9), rgba(30, 30, 45, 0.9));
        color: white;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        transition: all 0.3s;
        position: relative;
    `;

    // Проверяем, это путь к изображению или эмодзи
    const isImagePath = icon.includes('/') || icon.includes('.webp') || icon.includes('.png');

    if (isImagePath) {
        // Для иконок-изображений - прозрачный фон и увеличенный размер
        button.style.background = 'transparent';
        button.style.border = 'none';
        button.innerHTML = `
            <img src="${icon}" alt="${label}" style="width: 46px; height: 46px; object-fit: contain;">
            <div style="font-size: 9px; opacity: 0.8;">${label}</div>
        `;
    } else {
        button.innerHTML = `
            <div>${icon}</div>
            <div style="font-size: 9px; opacity: 0.8;">${label}</div>
        `;
    }
    
    button.onclick = onClick;

    button.onmouseover = () => {
        button.style.transform = 'scale(1.1)';
        if (!isImagePath) {
            button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        }
    };

    button.onmouseout = () => {
        button.style.transform = 'scale(1)';
        if (!isImagePath) {
            button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
    };

    return button;
}

// Создание слота для мага
function createWizardSlot(index) {
    const slot = document.createElement('div');
    slot.style.cssText = `
        width: 60px;
        height: 60px;
        border: 2px solid rgba(100, 200, 255, 0.3);
        border-radius: 10px;
        background: linear-gradient(145deg, rgba(40, 60, 90, 0.7), rgba(20, 40, 60, 0.7));
        color: white;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        position: relative;
    `;
    
    // Получаем информацию о маге если есть
    const wizards = window.userData?.wizards || [];
    const wizard = wizards[index];
    
    if (wizard) {
    	const level = wizard.level || 1;
    	const wizardFaction = wizard.faction || window.userData?.faction || 'fire';
    	slot.innerHTML = `
    	    <img src="assets/icons/${wizardFaction}/wizard.png" 
    	         style="width: 40px; height: 40px;" 
    	         onerror="this.outerHTML='<div>🧙‍♂️</div>'">
    	    <div style="font-size: 10px; position: absolute; bottom: 2px;">Ур.${level}</div>
    	`;
        
        slot.onclick = () => {
            console.log(`🧙‍♂️ Открыть окно мага ${index}`);
            // Используем существующую функцию из script_wizards.js
            if (window.showWizardDetailScreen) {
                window.showWizardDetailScreen(wizard);
            }
        };
    } else {
        slot.innerHTML = `
            <div style="opacity: 0.3;">➕</div>
            <div style="font-size: 9px; opacity: 0.5;">Пусто</div>
        `;
        slot.style.opacity = '0.6';
    }
    
    slot.onmouseover = () => {
        if (wizard) {
            slot.style.transform = 'scale(1.1)';
            slot.style.borderColor = 'rgba(100, 200, 255, 0.6)';
        }
    };
    
    slot.onmouseout = () => {
        slot.style.transform = 'scale(1)';
        slot.style.borderColor = 'rgba(100, 200, 255, 0.3)';
    };
    
    return slot;
}

// Создание пустого слота
function createEmptySlot() {
    const slot = document.createElement('div');
    slot.style.cssText = `
        width: 60px;
        height: 60px;
        border: 2px dashed rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        background: rgba(30, 30, 40, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.5;
    `;
    
    slot.innerHTML = `<div style="color: rgba(255, 255, 255, 0.3); font-size: 24px;">?</div>`;
    
    return slot;
}
// Примечание: getFactionColor, getFactionEmoji, getFactionName, showNotification
// теперь в core/helpers.js

// Показ меню выбора места для строительства с фоном башни
function showBuildingSelectionMenu() {
    console.log('🏗️ Открытие меню строительства с фоном');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Скрываем tooltip
    if (typeof hideBuildingTooltip === 'function') {
        hideBuildingTooltip();
    }

    // Определяем фракцию игрока
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('building-selection-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'building-selection-screen';
    screen.className = 'building-selection-screen active';

    // Создаем HTML структуру
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="building-selection-bg" src="${imagePath}" alt="Меню строительства">
            <div class="tower-ui-overlay" id="building-selection-overlay"></div>
        </div>
    `;

    // Стили для экрана
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('building-selection-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupBuildingSelectionUI();
    if (img.complete) setupBuildingSelectionUI();

    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон, используем стандартное окно');
        screen.remove();
        showBuildingSelectionMenuFallback();
    };
}

// Настройка UI меню строительства
function setupBuildingSelectionUI() {
    const img = document.getElementById('building-selection-bg');
    const overlay = document.getElementById('building-selection-overlay');

    if (!img || !overlay) return;

    const rect = img.getBoundingClientRect();

    // Устанавливаем размеры overlay по размеру изображения
    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
    `;

    // Масштаб для координат (базовый размер 768x512)
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;

    // ЗОНА 1: ЗАГОЛОВОК
    const headerArea = {
        x: 115 * scaleX,
        y: 20 * scaleY,
        width: (655 - 115) * scaleX,
        height: 50 * scaleY
    };

    // ЗОНА 2: КОНТЕНТ (список зданий)
    const contentArea = {
        x: 115 * scaleX,
        y: 70 * scaleY,
        width: (655 - 115) * scaleX,
        height: (410 - 70) * scaleY
    };

    // ЗОНА 3: КНОПКА ЗАКРЫТЬ
    const footerArea = {
        x: 115 * scaleX,
        y: 420 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };

    // Адаптивные размеры шрифтов
    const titleFontSize = Math.max(16, 22 * Math.min(scaleX, scaleY));
    const baseFontSize = Math.max(12, 14 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(10, 12 * Math.min(scaleX, scaleY));

    // Конфигурация зданий
    const buildableBuildings = [
        { id: 'library', name: 'Библиотека', description: 'Изучение заклинаний', icon: '📚' },
        { id: 'wizard_tower', name: 'Башня мага', description: 'Найм новых магов', icon: '🏯' },
        { id: 'guild', name: 'Гильдия', description: 'Объединение игроков', icon: '🏰' },
        { id: 'pvp_arena', name: 'Арена', description: 'PvP сражения', icon: '🏟️' },
        { id: 'blessing_tower', name: 'Башня благословения', description: 'Временные бонусы', icon: '🙏' },
        { id: 'arcane_lab', name: 'Лаборатория', description: 'Ускорение изучения', icon: '🔬' },
        { id: 'time_generator', name: 'Генератор времени', description: 'Производство времени', icon: '⏳' }
    ];

    // === ЗАГОЛОВОК ===
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        position: absolute;
        left: ${headerArea.x}px;
        top: ${headerArea.y}px;
        width: ${headerArea.width}px;
        height: ${headerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    headerContainer.innerHTML = `
        <div style="
            color: #ffd700;
            font-size: ${titleFontSize}px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            text-align: center;
        ">Управление зданиями</div>
    `;
    overlay.appendChild(headerContainer);

    // === КОНТЕНТ: СПИСОК ЗДАНИЙ ===
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 5px;
        box-sizing: border-box;
    `;

    // Стили для скроллбара и анимаций
    contentContainer.innerHTML = `
        <style>
            #building-selection-overlay .building-list::-webkit-scrollbar {
                width: 8px;
            }
            #building-selection-overlay .building-list::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
            }
            #building-selection-overlay .building-list::-webkit-scrollbar-thumb {
                background: rgba(114, 137, 218, 0.6);
                border-radius: 4px;
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.9; }
                50% { opacity: 1; box-shadow: 0 0 10px rgba(255, 165, 0, 0.3); }
            }
        </style>
    `;
    contentContainer.className = 'building-list';

    // Получаем список активных строек
    const constructions = window.userData?.constructions || [];

    // Генерируем список зданий
    buildableBuildings.forEach((building, index) => {
        const isBuilt = window.userData?.buildings?.[building.id];
        const currentLevel = isBuilt ? (window.userData.buildings[building.id].level || 1) : 0;
        const maxLevel = typeof getBuildingMaxLevel === 'function' ? getBuildingMaxLevel(building.id) : 1;
        const isMaxLevel = currentLevel >= maxLevel;

        // Проверяем активное строительство/улучшение
        const activeConstruction = constructions.find(c =>
            c.type === 'building' && c.building_id === building.id && c.time_remaining > 0
        );
        const isUnderConstruction = activeConstruction && !activeConstruction.is_upgrade;
        const isUnderUpgrade = activeConstruction && activeConstruction.is_upgrade;

        // Определяем статус и цвет
        let statusText, statusColor, buttonText, buttonColor, isClickable, constructionIdx = -1;

        if (isUnderConstruction) {
            // Здание строится
            const timeStr = window.formatTimeCurrency ? window.formatTimeCurrency(activeConstruction.time_remaining) : activeConstruction.time_remaining;
            statusText = `🔨 Строится: ${timeStr}`;
            statusColor = '#ffa500';
            buttonText = 'Ускорить';
            buttonColor = 'linear-gradient(145deg, #ffa500, #cc8400)';
            isClickable = true;
            constructionIdx = constructions.indexOf(activeConstruction);
        } else if (isUnderUpgrade) {
            // Здание улучшается
            const timeStr = window.formatTimeCurrency ? window.formatTimeCurrency(activeConstruction.time_remaining) : activeConstruction.time_remaining;
            statusText = `⚙️ Улучшается: ${timeStr}`;
            statusColor = '#4CAF50';
            buttonText = 'Ускорить';
            buttonColor = 'linear-gradient(145deg, #4CAF50, #388E3C)';
            isClickable = true;
            constructionIdx = constructions.indexOf(activeConstruction);
        } else if (!isBuilt) {
            statusText = 'Не построено';
            statusColor = '#888';
            buttonText = 'Построить';
            buttonColor = 'linear-gradient(145deg, #7289da, #5b6eae)';
            isClickable = true;
        } else if (isMaxLevel) {
            statusText = `Уровень ${currentLevel}/${maxLevel}`;
            statusColor = '#4ade80';
            buttonText = 'Макс. уровень';
            buttonColor = '#555';
            isClickable = false;
        } else {
            statusText = `Уровень ${currentLevel}/${maxLevel}`;
            statusColor = '#ffa500';
            buttonText = 'Улучшить';
            buttonColor = 'linear-gradient(145deg, #ffa500, #cc8400)';
            isClickable = true;
        }

        // Определяем стиль рамки
        let borderColor = '#555';
        if (isUnderConstruction) borderColor = '#ffa500';
        else if (isUnderUpgrade) borderColor = '#4CAF50';
        else if (isClickable) borderColor = '#7289da';

        const buildingItem = document.createElement('div');
        buildingItem.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid ${borderColor};
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            backdrop-filter: blur(5px);
            ${(isUnderConstruction || isUnderUpgrade) ? 'animation: pulse 2s infinite;' : ''}
        `;

        buildingItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span style="font-size: ${baseFontSize + 4}px;">${building.icon}</span>
                <div>
                    <div style="color: white; font-size: ${baseFontSize}px; font-weight: bold;">${building.name}</div>
                    <div style="color: ${statusColor}; font-size: ${smallFontSize}px;">${statusText}</div>
                </div>
            </div>
            <button class="building-action-btn" data-building="${building.id}" data-action="${isBuilt ? 'upgrade' : 'build'}" data-construction-idx="${constructionIdx}" style="
                padding: 6px 12px;
                background: ${buttonColor};
                border: none;
                border-radius: 6px;
                color: white;
                font-size: ${smallFontSize}px;
                font-weight: bold;
                cursor: ${isClickable ? 'pointer' : 'default'};
                opacity: ${isClickable ? '1' : '0.6'};
                white-space: nowrap;
                transition: all 0.2s;
            " ${isClickable ? '' : 'disabled'}>${buttonText}</button>
        `;

        contentContainer.appendChild(buildingItem);

        // Добавляем обработчик клика
        const btn = buildingItem.querySelector('.building-action-btn');
        if (isClickable && btn) {
            btn.onclick = () => {
                if (constructionIdx >= 0) {
                    // Открываем окно ускорения строительства
                    closeBuildingModal();
                    if (typeof window.showConstructionModal === 'function') {
                        window.showConstructionModal(constructionIdx);
                    }
                } else if (isBuilt) {
                    // Улучшение - показываем детали в том же overlay
                    showBuildingDetailsInOverlay(building.id, true);
                } else {
                    // Строительство - показываем детали в том же overlay
                    showBuildingDetailsInOverlay(building.id, false);
                }
            };
            btn.onmouseover = () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 0 10px rgba(114, 137, 218, 0.5)';
            };
            btn.onmouseout = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
            };
        }
    });

    overlay.appendChild(contentContainer);

    // === КНОПКА ЗАКРЫТЬ ===
    const footerContainer = document.createElement('div');
    footerContainer.style.cssText = `
        position: absolute;
        left: ${footerArea.x}px;
        top: ${footerArea.y}px;
        width: ${footerArea.width}px;
        height: ${footerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.cssText = `
        padding: 10px 40px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #7289da;
        border-radius: 10px;
        color: #7289da;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    closeBtn.onclick = closeBuildingModal;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(114, 137, 218, 0.3)';
        closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.6)';
        closeBtn.style.transform = 'scale(1)';
    };

    footerContainer.appendChild(closeBtn);
    overlay.appendChild(footerContainer);
}

// Открыть модальное окно здания для улучшения
function openBuildingModal(buildingId) {
    const modalFunctions = {
        'library': 'showLibrary',
        'wizard_tower': 'showWizardTowerModalBg',
        'guild': 'openGuildModal',
        'pvp_arena': 'showPvPArenaModalBg',
        'blessing_tower': 'showBlessingTowerModalBg',
        'arcane_lab': 'showArcaneLabModalBg',
        'time_generator': 'showTimeGeneratorModalBg'
    };

    const funcName = modalFunctions[buildingId];
    if (funcName && typeof window[funcName] === 'function') {
        window[funcName]();
    } else {
        console.log('⚠️ Модальное окно для', buildingId, 'не найдено');
    }
}

// Показать детали здания внутри того же overlay (перед строительством)
function showBuildingDetailsInOverlay(buildingId, isUpgrade = false) {
    const overlay = document.getElementById('building-selection-overlay');
    if (!overlay) {
        // Fallback на старое поведение
        if (window.startBuilding) window.startBuilding(buildingId, isUpgrade);
        return;
    }

    const img = document.getElementById('building-selection-bg');
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;

    // Области
    const headerArea = { x: 115 * scaleX, y: 20 * scaleY, width: (655 - 115) * scaleX, height: 50 * scaleY };
    const contentArea = { x: 115 * scaleX, y: 70 * scaleY, width: (655 - 115) * scaleX, height: (410 - 70) * scaleY };
    const footerArea = { x: 115 * scaleX, y: 420 * scaleY, width: (655 - 115) * scaleX, height: 60 * scaleY };

    const titleFontSize = Math.max(16, 22 * Math.min(scaleX, scaleY));
    const baseFontSize = Math.max(12, 14 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(10, 12 * Math.min(scaleX, scaleY));

    // Данные здания
    const buildingNames = {
        'library': { name: 'Библиотека', icon: '📚' },
        'wizard_tower': { name: 'Башня мага', icon: '🏯' },
        'guild': { name: 'Гильдия', icon: '🏰' },
        'pvp_arena': { name: 'Арена', icon: '🏟️' },
        'blessing_tower': { name: 'Башня благословения', icon: '🙏' },
        'arcane_lab': { name: 'Лаборатория', icon: '🔬' },
        'time_generator': { name: 'Генератор времени', icon: '⏳' }
    };

    const buildingInfo = buildingNames[buildingId] || { name: buildingId, icon: '🏗️' };
    const currentLevel = window.userData?.buildings?.[buildingId]?.level || 0;
    const targetLevel = isUpgrade ? currentLevel + 1 : 1;

    // Получаем время строительства
    const timeRequired = isUpgrade ?
        (window.CONSTRUCTION_TIME?.getUpgradeTime ?
            window.CONSTRUCTION_TIME.getUpgradeTime(buildingId, targetLevel) : 144 * targetLevel) :
        (window.CONSTRUCTION_TIME?.[buildingId] || 144);

    const timeFormatted = window.formatTimeCurrency ? window.formatTimeCurrency(timeRequired) : timeRequired + ' мин';

    // Получаем описание из BUILDING_DESCRIPTIONS
    let description = '';
    let levelInfo = '';
    if (window.BUILDING_DESCRIPTIONS && window.BUILDING_DESCRIPTIONS[buildingId]) {
        const config = window.BUILDING_DESCRIPTIONS[buildingId];
        description = config.baseDescription || '';
        levelInfo = config.getLevelDescription ? config.getLevelDescription(currentLevel, targetLevel) : '';
    }

    // Очищаем overlay
    overlay.innerHTML = '';

    // === ЗАГОЛОВОК ===
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        position: absolute;
        left: ${headerArea.x}px;
        top: ${headerArea.y}px;
        width: ${headerArea.width}px;
        height: ${headerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    headerContainer.innerHTML = `
        <div style="
            color: #ffd700;
            font-size: ${titleFontSize}px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            text-align: center;
        ">${buildingInfo.icon} ${buildingInfo.name}</div>
    `;
    overlay.appendChild(headerContainer);

    // === КОНТЕНТ: ДЕТАЛИ ЗДАНИЯ ===
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        overflow-y: auto;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

    contentContainer.innerHTML = `
        <!-- Уровень -->
        ${isUpgrade ? `
        <div style="
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #7289da;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        ">
            <div style="color: #aaa; font-size: ${smallFontSize}px;">Улучшение</div>
            <div style="color: #ffd700; font-size: ${baseFontSize + 4}px; font-weight: bold;">
                Уровень ${currentLevel} → ${targetLevel}
            </div>
        </div>
        ` : ''}

        <!-- Описание -->
        <div style="
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #555;
            border-radius: 8px;
            padding: 12px;
        ">
            <div style="color: #ccc; font-size: ${baseFontSize}px; line-height: 1.5;">
                ${description}
            </div>
        </div>

        <!-- Бонусы -->
        ${levelInfo ? `
        <div style="
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #4ade80;
            border-radius: 8px;
            padding: 12px;
        ">
            <div style="color: #ffa500; font-size: ${smallFontSize}px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">
                ${isUpgrade ? 'Новый бонус:' : 'Что даст:'}
            </div>
            <div style="color: #4ade80; font-size: ${baseFontSize}px; font-weight: bold;">
                ${levelInfo}
            </div>
        </div>
        ` : ''}

        <!-- Стоимость -->
        <div style="
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.5);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        ">
            <div style="color: #aaa; font-size: ${smallFontSize}px; margin-bottom: 5px;">
                Время ${isUpgrade ? 'улучшения' : 'строительства'}:
            </div>
            <div style="color: #ffa500; font-size: ${baseFontSize + 6}px; font-weight: bold;">
                ⏳ ${timeFormatted}
            </div>
        </div>
    `;

    overlay.appendChild(contentContainer);

    // === КНОПКИ ===
    const footerContainer = document.createElement('div');
    footerContainer.style.cssText = `
        position: absolute;
        left: ${footerArea.x}px;
        top: ${footerArea.y}px;
        width: ${footerArea.width}px;
        height: ${footerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    `;

    // Кнопка "Назад"
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = `
        padding: 10px 25px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #888;
        border-radius: 10px;
        color: #ccc;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    backBtn.onclick = () => setupBuildingSelectionUI();
    backBtn.onmouseover = () => { backBtn.style.background = 'rgba(100, 100, 100, 0.5)'; };
    backBtn.onmouseout = () => { backBtn.style.background = 'rgba(0, 0, 0, 0.6)'; };

    // Кнопка "Построить/Улучшить"
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = isUpgrade ? '⚙️ Улучшить' : '✅ Построить';
    confirmBtn.style.cssText = `
        padding: 10px 30px;
        background: linear-gradient(145deg, #4ade80, #22c55e);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    confirmBtn.onclick = () => {
        closeBuildingModal();
        if (window.executeBuilding) {
            window.executeBuilding(buildingId, isUpgrade, targetLevel, timeRequired);
        } else if (window.startBuilding) {
            window.startBuilding(buildingId, isUpgrade);
        }
    };
    confirmBtn.onmouseover = () => { confirmBtn.style.transform = 'scale(1.05)'; };
    confirmBtn.onmouseout = () => { confirmBtn.style.transform = 'scale(1)'; };

    footerContainer.appendChild(backBtn);
    footerContainer.appendChild(confirmBtn);
    overlay.appendChild(footerContainer);
}

window.showBuildingDetailsInOverlay = showBuildingDetailsInOverlay;

// Резервное простое меню (если изображение не загрузилось)
function showBuildingSelectionMenuFallback() {
    const modal = document.createElement('div');
    modal.id = 'building-selection-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c2c3d;
        border: 2px solid #7289da;
        border-radius: 15px;
        padding: 20px;
        z-index: 2000;
        max-width: 400px;
        color: white;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
    `;

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #7289da;">Управление зданиями</h3>
        <p style="color: #888;">Не удалось загрузить интерфейс</p>
        <button onclick="closeBuildingModal()" style="
            width: 100%;
            padding: 10px;
            background: #7289da;
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
        ">Закрыть</button>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    overlay.onclick = closeBuildingModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Закрыть модальное окно строительства
function closeBuildingModal() {
    // Удаляем новый экран с фоном
    const screen = document.getElementById('building-selection-screen');
    if (screen) screen.remove();

    // Удаляем старое модальное окно (для fallback)
    const modal = document.getElementById('building-selection-modal');
    if (modal) modal.remove();

    // ИСПРАВЛЕНИЕ: Удаляем ВСЕ overlay-и с id='modal-overlay', а не только первый
    const overlays = document.querySelectorAll('[id="modal-overlay"]');
    overlays.forEach(overlay => overlay.remove());

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }
}

// Построить здание - ОБНОВЛЁННАЯ ВЕРСИЯ
function buildBuilding(buildingId) {
    console.log(`🏗️ Строим здание: ${buildingId}`);
    
    // Закрываем модальное окно выбора
    closeBuildingModal();
    
    // Используем новую функцию startBuilding из city-clickable-system.js
    if (window.startBuilding) {
        window.startBuilding(buildingId);
    } else {
        // Фоллбэк если новая функция недоступна
        if (!window.userData.buildings) {
            window.userData.buildings = {};
        }
        
        window.userData.buildings[buildingId] = {
            level: 1,
            building_id: buildingId
        };
        
        // Загружаем изображение здания на город
        const faction = window.userData.faction;
        const container = document.getElementById('city-background-container');
        
        if (container) {
            const existingBuildings = container.querySelectorAll('.city-building');
            const newZIndex = existingBuildings.length + 1;
            loadBuildingImageNew(faction, buildingId, container, newZIndex);
        }
        
        // Показываем уведомление
        showNotification(`✅ Здание построено!`);
    }
}

// Построить новое здание (вызывается при постройке)
function buildNewBuilding(buildingId) {
    console.log(`🔨 Постройка нового здания: ${buildingId}`);
    
    const container = document.getElementById('city-background-container');
    if (!container) {
        console.error('❌ Контейнер города не найден');
        return;
    }
    
    const faction = window.userData.faction;
    
    // Определяем z-index для нового здания
    const existingBuildings = container.querySelectorAll('.city-building');
    const newZIndex = existingBuildings.length + 1;
    
    // Загружаем изображение нового здания
    loadBuildingImageNew(faction, buildingId, container, newZIndex);
}

// Обработчик клика на здание
function onBuildingClick(buildingId) {
    
    const buildingInfo = window.userData?.buildings?.[buildingId];
    
    // Определяем тип здания и открываем соответствующее окно
    switch(buildingId) {
        case 'library':
            if (window.showLibrary) {
                window.showLibrary();
            } else {
                showBuildingInfo(buildingId, 'Библиотека', 'Здесь можно изучать новые заклинания');
            }
            break;
            
        case 'wizard_tower':
            if (window.showWizardTowerModalBg) {
    		window.showWizardTowerModalBg();
            } else {
                showBuildingInfo(buildingId, 'Башня мага', 'Здесь можно нанимать новых магов');
            }
            break;
            
        case 'pvp_arena':
            if (window.showPvPArenaModal) {
                window.showPvPArenaModal();
            } else if (window.startDemoBattle) {
                window.startDemoBattle();
            } else {
                showBuildingInfo(buildingId, 'Арена', 'Место для PvP сражений');
            }
            break;
            
        case 'guild':
            if (window.openGuildModal) {
                window.openGuildModal();
            } else if (window.showGuildModal) {
                window.showGuildModal();
            } else {
                showBuildingInfo(buildingId, 'Гильдия', 'Объединение игроков для бонусов');
            }
            break;
            
        case 'blessing_tower':
            console.log("🙏 Клик по башне благословения");
            console.log("showBlessingTowerModalBg:", typeof window.showBlessingTowerModalBg);
            console.log("showBlessingTowerModal:", typeof window.showBlessingTowerModal);
            if (window.showBlessingTowerModalBg) {
                window.showBlessingTowerModalBg();
                console.log("⚠️ Вызываем старую функцию");
            } else if (window.showBlessingTowerModal) {
                window.showBlessingTowerModal();
            } else {
                showBuildingInfo(buildingId, 'Башня благословения', 'Временные бонусы для города');
            }
            break;
            
        case 'arcane_lab':
            if (window.showArcaneLabModalBg) {
                window.showArcaneLabModalBg();
            } else if (window.showArcaneLabModal) {
                window.showArcaneLabModal();
            } else {
                showBuildingInfo(buildingId, 'Арканный лаборатория', 'Исследование новых технологий');
            }
            break;
            
        default:
            showBuildingInfo(buildingId, 'Здание', 'Описание здания');
    }
}

// Показ информации о здании
function showBuildingInfo(buildingId, name, description) {
    // Проверяем, не открыто ли уже окно
    const existingModal = document.getElementById('building-info-modal');
    if (existingModal) {
        console.log('⚠️ Модальное окно уже открыто, игнорируем повторный клик');
        return;
    }

    const buildingInfo = window.userData?.buildings?.[buildingId];
    const level = buildingInfo?.level || 1;

    const modal = document.createElement('div');
    modal.id = 'building-info-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #2c2c3d, #1a1a2e);
        border: 2px solid #7289da;
        border-radius: 15px;
        padding: 25px;
        z-index: 2000;
        max-width: 350px;
        color: white;
        box-shadow: 0 0 30px rgba(114, 137, 218, 0.5);
        animation: fadeIn 0.3s ease;
        text-align: center;
    `;
    
    const modalContent = `
        <h3 style="color: #7289da; margin-top: 0;">🏯 ${name}</h3>
        <p style="color: #aaa; font-size: 14px;">${description}</p>
        <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 10px; margin: 15px 0;">
            <div style="color: #ffa500;">⭐ Уровень: ${level}</div>
        </div>
        <button onclick="closeBuildingInfoModal()" style="
            padding: 10px 20px;
            background: linear-gradient(145deg, #7289da, #5b6eae);
            border: none;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        ">Закрыть</button>
    `;
    
    modal.innerHTML = modalContent;
    
    // Создаём оверлей
    const overlay = document.createElement('div');
    overlay.id = 'building-info-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    overlay.onclick = closeBuildingInfoModal;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Закрыть окно информации о здании
function closeBuildingInfoModal() {
    console.log('🔧 Закрываем модальное окно здания...');
    const modal = document.getElementById('building-info-modal');
    const overlay = document.getElementById('building-info-overlay');

    console.log('   modal:', modal ? 'найдено' : 'НЕ НАЙДЕНО');
    console.log('   overlay:', overlay ? 'найдено' : 'НЕ НАЙДЕНО');

    if (modal) {
        modal.remove();
    }
    if (overlay) {
        overlay.remove();
    }

}

// Обработка изменения размера окна (поворот телефона)
window.addEventListener('resize', () => {
    const container = document.getElementById('city-background-container');
    if (container) {
        const isMobile = isMobileDevice();

        if (isMobile) {
            // Полноэкранный режим на мобильных...
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                margin: 0;
                padding: 0;
                border-radius: 0;
                overflow: visible;
                z-index: 1;
                background: #000;
            `;
            
            // Пересчитываем масштаб для всех изображений
            const screenHeight = window.innerHeight;
            const imageHeight = 512;
            const imageWidth = 768;
            const aspectRatio = imageWidth / imageHeight;
            
            const scaledHeight = screenHeight;
            const scaledWidth = scaledHeight * aspectRatio;
            
            const images = container.querySelectorAll('img');
            images.forEach(img => {
                const currentZIndex = img.style.zIndex || '0';
                img.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: ${scaledWidth}px;
                    height: ${scaledHeight}px;
                    z-index: ${currentZIndex};
                    cursor: pointer;
                    transition: filter 0.3s ease;
                `;
            });
            
            console.log(`📱 Мобильный режим: ${scaledWidth}px x ${scaledHeight}px`);
        } else {
            // Desktop режим
            container.style.cssText = `
                position: relative;
                width: 768px;
                height: 512px;
                margin: 0 auto;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                background: #000;
            `;
            
            // Восстанавливаем размеры для desktop
            const images = container.querySelectorAll('img');
            images.forEach(img => {
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.transform = 'none';
                img.style.left = '0';
            });
            
            console.log('🖥️ Desktop режим: стандартный размер');
        }
    }
});

// Для Telegram Web App - максимизируем область просмотра
if (window.Telegram && window.Telegram.WebApp) {
    console.log('📱 Telegram WebApp обнаружен');
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.enableClosingConfirmation();
    
    // Убираем отступы Telegram
    document.body.style.paddingTop = '0';
    document.body.style.paddingBottom = '0';
}

// Экспортируем функции в глобальную область
window.initCityViewSystem = initCityViewSystem;
window.initCityView = initCityViewSystem; // Алиас для обратной совместимости
window.switchToCityView = switchToCityView;
window.loadBuildingImageNew = loadBuildingImageNew;
window.buildNewBuilding = buildNewBuilding;
window.showBuildingSelectionMenu = showBuildingSelectionMenu;
window.closeBuildingModal = closeBuildingModal;
window.buildBuilding = buildBuilding;
window.onBuildingClick = onBuildingClick;
window.showBuildingInfo = showBuildingInfo;
window.closeBuildingInfoModal = closeBuildingInfoModal;
window.createBottomControlPanel = createBottomControlPanel;