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

// Экспорт UI функций
window.createBottomControlPanel = createBottomControlPanel;

console.log('🏙️ City View UI загружен');
