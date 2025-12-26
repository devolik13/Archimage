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

    // ВАЖНО: Очищаем overlay перед добавлением новых элементов
    overlay.innerHTML = '';

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

    // Конфигурация зданий (pvp_arena убрана - функционал работает без здания)
    const buildableBuildings = [
        { id: 'library', name: 'Библиотека', description: 'Изучение заклинаний', icon: '📚' },
        { id: 'wizard_tower', name: 'Башня мага', description: 'Найм новых магов', icon: '🏯' },
        { id: 'guild', name: 'Гильдия', description: 'Объединение игроков', icon: '🏰' },
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

// Для Telegram Web App - дополнительная проверка раскрытия
if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    // Убираем отступы Telegram
    document.body.style.paddingTop = '0';
    document.body.style.paddingBottom = '0';

    // Дополнительная попытка раскрытия если не раскрыто
    if (tg.viewportHeight < window.innerHeight * 0.9) {
        console.log('📱 [city-view] Дополнительное раскрытие...');
        tg.expand();
    }
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
// Экспорт building функций
window.buildNewBuilding = buildNewBuilding;
window.showBuildingSelectionMenu = showBuildingSelectionMenu;
window.closeBuildingModal = closeBuildingModal;
window.buildBuilding = buildBuilding;
window.onBuildingClick = onBuildingClick;
window.showBuildingInfo = showBuildingInfo;
window.closeBuildingInfoModal = closeBuildingInfoModal;

console.log('🏙️ City View Buildings загружен');
