// city-view-system.js - Новая система отображения городов с фонами
console.log('✅ city-view-system.js загружен');

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
        console.log('✅ Фон города загружен (NEW)');
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
            pointer-events: auto;
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
            pointer-events: auto;
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
        console.log(`✅ Здание ${buildingId} загружено (NEW)`);
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
    const validBuildings = ['wizard_tower', 'library', 'forge', 'pvp_arena', 'blessing_tower', 'arcane_lab', 'time_generator'];
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
    
    // Начальные здания - library и wizard_tower
    const defaultBuildings = ['library', 'wizard_tower'];
    
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
    console.log(`🎨 Переключение на вид города для фракции: ${faction}`);
    
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
        console.log('🔄 Панель: внутри повёрнутого контейнера');
        panel.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 80px;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 0 10px;
            box-sizing: border-box;
            z-index: 1001;
        `;
        
        // Добавляем ВНУТРЬ city-background-container
        const cityContainer = document.getElementById('city-background-container');
        if (cityContainer) {
            cityContainer.appendChild(panel);
            console.log('✅ Панель внутри контейнера');
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
            height: 80px;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 0 10px;
            box-sizing: border-box;
            z-index: 1001;
        `;
        
        // Добавляем в body
        document.body.appendChild(panel);
    }
    
    // Кнопка строить
    const buildButton = createControlButton('🏗️', 'Строить', () => {
        console.log('🏗️ Открыть меню строительства');
        // Показываем меню выбора ячейки для строительства
        showBuildingSelectionMenu();
    });
    
    // Кнопка заклинаний
    const spellsButton = createControlButton('📖', 'Заклинания', () => {
        console.log('📖 Открыть библиотеку заклинаний');
        if (window.showLibrary) {
            window.showLibrary();
        } else {
            showNotification('Библиотека пока недоступна');
        }
    });
    
    // Кнопка арены
    const arenaButton = createControlButton('⚔️', 'Арена', () => {
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
    panel.appendChild(buildButton);
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
    
    // Пустые слоты для будущих функций (уменьшаем до 1)
    for (let i = 0; i < 1; i++) {
        const emptySlot = createEmptySlot();
        panel.appendChild(emptySlot);
    }
}

// Создание кнопки управления
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
    
    button.innerHTML = `
        <div>${icon}</div>
        <div style="font-size: 9px; opacity: 0.8;">${label}</div>
    `;
    
    button.onclick = onClick;
    
    button.onmouseover = () => {
        button.style.transform = 'scale(1.1)';
        button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    };
    
    button.onmouseout = () => {
        button.style.transform = 'scale(1)';
        button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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

// Вспомогательная функция для получения цвета фракции
function getFactionColor(faction) {
    const colors = {
        fire: 'linear-gradient(145deg, #ff6b6b, #ff5252)',
        water: 'linear-gradient(145deg, #4d96ff, #3a85f0)',
        wind: 'linear-gradient(145deg, #95ffc4, #7ae5b0)',
        earth: 'linear-gradient(145deg, #96ceb4, #82b8a0)',
        nature: 'linear-gradient(145deg, #4ade80, #22c55e)',
        poison: 'linear-gradient(145deg, #84cc16, #4ade80)'
    };
    return colors[faction] || '#333';
}

// Получение эмодзи фракции
function getFactionEmoji(faction) {
    const emojis = {
        fire: '🔥',
        water: '💧',
        wind: '🌬️',
        earth: '🌍',
        nature: '🌿',
        poison: '☠️'
    };
    return emojis[faction] || '🏯';
}

// Получение названия фракции
function getFactionName(faction) {
    const names = {
        fire: 'Огонь',
        water: 'Вода',
        wind: 'Ветер',
        earth: 'Земля',
        nature: 'Природа',
        poison: 'Яд'
    };
    return names[faction] || 'Неизвестно';
}

// Показ уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        max-width: 300px;
        text-align: center;
        animation: fadeIn 0.3s ease;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Показ меню выбора места для строительства
function showBuildingSelectionMenu() {
    // Создаём модальное окно для выбора здания
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
    
    // Получаем конфигурацию зданий
    const buildableBuildings = [
    	{ id: 'library', name: '📚 Библиотека', description: 'Изучение заклинаний' },
    	{ id: 'wizard_tower', name: '🏯 Башня мага', description: 'Найм новых магов' },
    	{ id: 'forge', name: '⚔️ Кузница', description: 'Улучшение снаряжения' },
    	{ id: 'pvp_arena', name: '⚔️ Арена', description: 'PvP сражения' },
    	{ id: 'blessing_tower', name: '🙏 Башня благословения', description: 'Временные бонусы' },
    	{ id: 'arcane_lab', name: '🔬 Лаборатория', description: 'Исследования' },
    	{ id: 'time_generator', name: '⏳ Генератор времени', description: 'Производство временной валюты' }
    ];
    
    let modalContent = `
        <h3 style="margin-top: 0; color: #7289da;">🏗️ Выберите здание для постройки</h3>
        <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    buildableBuildings.forEach(building => {
        // Проверяем, построено ли уже здание
        const isBuilt = window.userData?.buildings?.[building.id];
        
        modalContent += `
            <button style="
                width: 100%;
                margin: 10px 0;
                padding: 15px;
                background: ${isBuilt ? '#555' : 'linear-gradient(145deg, #7289da, #5b6eae)'};
                border: none;
                border-radius: 10px;
                color: white;
                text-align: left;
                cursor: ${isBuilt ? 'not-allowed' : 'pointer'};
                opacity: ${isBuilt ? '0.6' : '1'};
                transition: all 0.3s;
            " 
            onclick="${isBuilt ? '' : `buildBuilding('${building.id}')`}"
            ${isBuilt ? 'disabled' : ''}>
                <div style="font-size: 20px; margin-bottom: 5px;">${building.name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${building.description}</div>
                ${isBuilt ? '<div style="font-size: 11px; color: #ffa500; margin-top: 5px;">✅ Уже построено</div>' : ''}
            </button>
        `;
    });
    
    modalContent += `
        </div>
        <button onclick="closeBuildingModal()" style="
            width: 100%;
            margin-top: 15px;
            padding: 10px;
            background: transparent;
            border: 1px solid #7289da;
            border-radius: 10px;
            color: #7289da;
            cursor: pointer;
        ">Закрыть</button>
    `;
    
    modal.innerHTML = modalContent;
    
    // Создаём оверлей
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
    const modal = document.getElementById('building-selection-modal');
    if (modal) modal.remove();

    // ИСПРАВЛЕНИЕ: Удаляем ВСЕ overlay-и с id='modal-overlay', а не только первый
    const overlays = document.querySelectorAll('[id="modal-overlay"]');
    overlays.forEach(overlay => overlay.remove());
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
    console.log(`🏯 Клик на здание: ${buildingId}`);
    
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
            if (window.showWizardHireModal) {
                window.showWizardHireModal();
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
            
        case 'forge':
            if (window.showForgeModal) {
                window.showForgeModal();
            } else {
                showBuildingInfo(buildingId, 'Кузница', 'Улучшение снаряжения магов');
            }
            break;
            
        case 'blessing_tower':
            if (window.showBlessingTowerModal) {
                window.showBlessingTowerModal();
            } else {
                showBuildingInfo(buildingId, 'Башня благословения', 'Временные бонусы для города');
            }
            break;
            
        case 'arcane_lab':
            if (window.showArcaneLabModal) {
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
        console.log('   ✅ Модальное окно удалено');
    }
    if (overlay) {
        overlay.remove();
        console.log('   ✅ Оверлей удален');
    }

    console.log('✅ Закрытие завершено');
}

// Обработка изменения размера окна (поворот телефона)
window.addEventListener('resize', () => {
    const container = document.getElementById('city-background-container');
    if (container) {
        const isMobile = isMobileDevice();
        
        console.log('🔄 RESIZE EVENT:', {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: isMobile,
            orientation: window.orientation,
            devicePixelRatio: window.devicePixelRatio
        });
        
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