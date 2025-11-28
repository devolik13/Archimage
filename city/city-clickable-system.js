// city-clickable-system.js - Система кликабельных зданий с полигонами
console.log('✅ city-clickable-system.js загружен');

// Динамическая загрузка конфигурации позиций для фракции
function loadCityPositions(faction) {
    return new Promise((resolve, reject) => {
        // Проверяем, загружена ли уже конфигурация
        if (window.CITY_POSITIONS && window.CITY_POSITIONS[faction]) {
            resolve(window.CITY_POSITIONS[faction]);
            return;
        }
        
        // Загружаем файл конфигурации для фракции
        const script = document.createElement('script');
        script.src = `city/positions/${faction}-positions.js`;
        script.onload = () => {
            console.log(`✅ Загружена конфигурация позиций для ${faction}`);
            resolve(window.CITY_POSITIONS[faction]);
        };
        script.onerror = () => {
            console.error(`❌ Не удалось загрузить конфигурацию для ${faction}`);
            reject(new Error(`Failed to load positions for ${faction}`));
        };
        document.head.appendChild(script);
    });
}

// Создание кликабельных зон для зданий с адаптацией
async function createBuildingClickZones(faction, container) {
    console.log('🎯 Создание кликабельных зон для зданий');
    
    try {
        const positions = await loadCityPositions(faction);
        
        if (!positions) {
            console.error(`Нет конфигурации позиций для фракции ${faction}`);
            return;
        }
        
        // Удаляем старые SVG с зонами
        const oldSvgs = container.querySelectorAll('svg.building-zones');
        oldSvgs.forEach(svg => svg.remove());
        
        // Создаем один общий SVG контейнер
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'building-zones');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Определяем режим (мобильный или десктоп)
        const isMobile = window.isMobileDevice ? window.isMobileDevice() : false;
        
        let scaleX, scaleY, offsetX = 0;
        
        if (isMobile) {
            // Мобильная адаптация - как у изображений
            const screenHeight = window.innerHeight;
            const imageHeight = 512;
            const imageWidth = 768;
            const aspectRatio = imageWidth / imageHeight;
            
            const scaledHeight = screenHeight;
            const scaledWidth = scaledHeight * aspectRatio;
            
            // Вычисляем масштаб относительно оригинального размера
            scaleX = scaledWidth / imageWidth;
            scaleY = scaledHeight / imageHeight;
            
            // Вычисляем смещение для центрирования (как left: 50%; transform: translateX(-50%))
            const containerWidth = container.getBoundingClientRect().width;
            offsetX = (containerWidth - scaledWidth) / 2;
            
        } else {
            // Десктоп - изображения используют object-fit: contain
            const containerRect = container.getBoundingClientRect();
            const containerAspect = containerRect.width / containerRect.height;
            const imageAspect = 768 / 512;
            
            if (containerAspect > imageAspect) {
                // Ограничено по высоте
                scaleY = containerRect.height / 512;
                scaleX = scaleY;
                offsetX = (containerRect.width - 768 * scaleX) / 2;
            } else {
                // Ограничено по ширине
                scaleX = containerRect.width / 768;
                scaleY = scaleX;
            }
        }
        
        // Создаем полигон для каждой позиции
        Object.keys(positions).forEach(key => {
            const pos = positions[key];
            const buildingData = window.userData?.buildings?.[pos.buildingId];
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            
            // Масштабируем и смещаем точки
            const scaledPoints = pos.points.map(p => {
                const x = (p.x * scaleX) + offsetX;
                const y = p.y * scaleY;
                return `${x},${y}`;
            }).join(' ');
            
            polygon.setAttribute('points', scaledPoints);
            setupPolygonEvents(polygon, pos, buildingData, key);
            
            svg.appendChild(polygon);
        });
        
        container.appendChild(svg);
        
        console.log(`📐 Масштаб полигонов: ${scaleX}x${scaleY}, смещение: ${offsetX}px`);
        
    } catch (error) {
        console.error('Ошибка при создании кликабельных зон:', error);
    }
}

// Функция подсветки здания при наведении
function highlightBuilding(buildingId, highlight = true) {
    
    const buildingData = window.userData?.buildings?.[buildingId];
    if (!buildingData || buildingData.level === 0) {
        // Здание не построено - не пытаемся подсветить
        return;
    }

    let buildingImg = document.querySelector(`#building-${buildingId}`);
    if (!buildingImg) {
        // Если не нашли, пробуем другие варианты
        buildingImg = document.querySelector(`[id*="${buildingId}"]`);
    }
    
    if (buildingImg) {
        if (highlight) {
            // Используем только filter без transform чтобы не сбивать позиционирование
            buildingImg.style.filter = 'brightness(1.3) drop-shadow(0 0 15px rgba(255,255,255,0.8))';
            // НЕ используем transform чтобы не сбивать позицию
        } else {
            buildingImg.style.filter = 'none';
        }
    }
}

// Настройка событий для полигона
function setupPolygonEvents(polygon, position, buildingData, key) {
    polygon.setAttribute('class', 'building-click-zone');
    polygon.dataset.buildingId = position.buildingId;
    polygon.dataset.position = key;
    
    polygon.style.cssText = `
        fill: transparent;
        stroke: transparent;
        cursor: pointer;
        pointer-events: all;
        transition: all 0.3s ease;
    `;
    
    // Режим разработки - ОТКЛЮЧАЕМ видимость зон
    
    
    if (window.DEV_MODE) {
        polygon.style.fill = 'rgba(255,255,0,0.1)';
        polygon.style.stroke = 'rgba(255,255,0,0.5)';
        polygon.style.strokeWidth = '2';
    }
    
    
    // Обработчики событий
    polygon.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleBuildingClick(position.buildingId, buildingData);
    };
    
    polygon.onmouseenter = (e) => {
        // Подсветка полигона - тоже убираем
        /*
        if (!window.DEV_MODE) {
            polygon.style.fill = 'rgba(255,255,255,0.08)';
        }
        */
        
        // ПОДСВЕТКА ЗДАНИЯ остается
        highlightBuilding(position.buildingId, true);
        showBuildingTooltip(e, position.buildingId, buildingData);
    };
    
    polygon.onmouseleave = () => {
        // Убираем подсветку полигона
        polygon.style.fill = 'transparent';
        polygon.style.stroke = 'transparent';
        
        // УБИРАЕМ ПОДСВЕТКУ ЗДАНИЯ
        highlightBuilding(position.buildingId, false);
        hideBuildingTooltip();
    };
}

// Исправленная обработка клика по зданию - используем правильные функции
function handleBuildingClick(buildingId, buildingData) {
    // Скрываем tooltip при клике
    hideBuildingTooltip();

    if (buildingData && buildingData.level > 0) {
        console.log(`🏢 Клик по зданию: ${buildingId}`);
        
        // Проверяем, можно ли улучшить здание
        const currentLevel = buildingData.level || 1;
        const maxLevel = window.getBuildingMaxLevel ? window.getBuildingMaxLevel(buildingId) : 1;
        
        // Если здание можно улучшить и у него нет специального окна
        if (currentLevel < maxLevel && !hasSpecialModal(buildingId)) {
            // Показываем окно улучшения
            if (window.showUpgradeModal) {
                window.showUpgradeModal(buildingId, currentLevel, maxLevel);
                return;
            }
        }
        
        switch(buildingId) {
            case 'library':
                if (window.showLibrary) {
                    window.showLibrary();
                } else {
                    console.error('Функция showLibrary не найдена');
                }
                break;
                
            case 'wizard_tower':
                if (window.showWizardTowerModalBg) {
                    window.showWizardTowerModalBg();
                } else if (window.showWizardHireModal) {
                    window.showWizardHireModal();
                } else {
                    console.error('Функция showWizardHireModal не найдена');
                }
                break;
                
            case 'pvp_arena':
                // Исправляем для арены
                if (window.showPvPArenaModal) {
                    window.showPvPArenaModal();
                } else if (window.startDemoBattle) {
                    window.startDemoBattle();
                } else {
                    showBuildingInfoModal(buildingId, buildingData);
                }
                break;
                
            case 'forge':
                // Исправляем для кузницы
                if (window.showForgeModal) {
                    window.showForgeModal();
                } else {
                    showBuildingInfoModal(buildingId, buildingData);
                }
                break;
                
            case 'blessing_tower':
                if (window.showBlessingTowerModalBg) {
                    window.showBlessingTowerModalBg();
                } else if (window.showBlessingTowerModal) {
                    window.showBlessingTowerModal();
                } else {
                    showBuildingInfoModal(buildingId, buildingData);
                }
                break;
                
            case 'time_generator':
                if (window.showTimeGeneratorModalBg) {
                    window.showTimeGeneratorModalBg();
                } else if (window.showTimeGeneratorModal) {
                    window.showTimeGeneratorModal();
                } else {
                    showBuildingInfoModal(buildingId, buildingData);
                }
                break;
                
            case 'arcane_lab':
                if (window.showArcaneLabModalBg) {
                    window.showArcaneLabModalBg();
                } else if (window.showArcaneLabModal) {
                    window.showArcaneLabModal();
                } else {
                    showBuildingInfoModal(buildingId, buildingData);
                }
                break;
                
            default:
                showBuildingInfoModal(buildingId, buildingData);
        }
    } else {
        // Слот пустой - показываем меню строительства
        showBuildingConstructionMenu(buildingId);
    }
}
function hasSpecialModal(buildingId) {
    const specialBuildings = [
        'library', 
        'wizard_tower', 
        'pvp_arena', 
        'blessing_tower',
        'time_generator',
        'arcane_lab',
        'forge',
    ];
    return specialBuildings.includes(buildingId);
}
// Показать подсказку при наведении
function showBuildingTooltip(event, buildingId, buildingData) {
    hideBuildingTooltip(); // Удаляем старую если есть
    
    const config = window.BUILDINGS_CONFIG[buildingId];
    if (!config) return;
    
    const tooltip = document.createElement('div');
    tooltip.id = 'building-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        left: ${event.clientX + 10}px;
        top: ${event.clientY - 40}px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        animation: fadeIn 0.2s ease;
    `;
    
    const level = buildingData?.level || 0;
    const status = level > 0 ? `Ур. ${level}` : 'Не построено';
    
    tooltip.innerHTML = `
        <div style="font-weight: bold;">${config.emoji} ${config.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-top: 2px;">${status}</div>
    `;
    
    document.body.appendChild(tooltip);
}

// Скрыть подсказку
function hideBuildingTooltip() {
    const tooltip = document.getElementById('building-tooltip');
    if (tooltip) tooltip.remove();
}

// Стандартное окно информации о здании
function showBuildingInfoModal(buildingId, buildingData) {
    // Скрываем tooltip
    hideBuildingTooltip();

    const config = window.BUILDINGS_CONFIG[buildingId];
    if (!config) return;

    // Закрываем предыдущие модальные окна
    closeAllModals();
    
    const modal = document.createElement('div');
    modal.id = 'building-info-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c2c3d;
        border-radius: 10px;
        padding: 25px;
        color: white;
        z-index: 2000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        min-width: 350px;
        max-width: 500px;
        animation: modalFadeIn 0.3s ease;
    `;
    
    const level = buildingData?.level || 1;
    
    modal.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 48px; margin-right: 15px;">${config.emoji}</span>
            <div>
                <h3 style="margin: 0; color: #ffa500;">${config.name}</h3>
                <div style="color: #4CAF50; font-size: 14px;">Уровень ${level}</div>
            </div>
        </div>
        
        <p style="color: #aaa; margin: 15px 0;">${config.description}</p>
        
        <div style="background: #1c1c2d; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <div style="font-size: 14px; color: #888; margin-bottom: 5px;">Функционал:</div>
            <div style="color: #fff;">${getBuildingFunctionality(buildingId)}</div>
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="closeBuildingInfoModal()" style="
                padding: 8px 16px;
                background: #444;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='#555'" 
               onmouseout="this.style.background='#444'">
                Закрыть
            </button>
            ${getActionButton(buildingId)}
        </div>
    `;
    
    // Добавляем затемнение фона
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
        animation: fadeIn 0.3s ease;
    `;
    overlay.onclick = closeBuildingInfoModal;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Получить описание функционала здания
function getBuildingFunctionality(buildingId) {
    const functionality = {
        'library': 'Изучение новых заклинаний и улучшение существующих',
        'wizard_tower': 'Найм и улучшение магов',
        'blessing_tower': 'Временные усиления для магов',
        'time_generator': 'Производство временной валюты',
        'pvp_arena': 'PvP сражения с другими игроками',
        'forge': 'Создание и улучшение снаряжения',
        'arcane_lab': 'Ускорение исследований'
    };
    return functionality[buildingId] || 'Функционал в разработке';
}

// Получить кнопку действия для здания
function getActionButton(buildingId) {
    const actions = {
        'library': '<button onclick="openLibraryModal(); closeBuildingInfoModal();" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Открыть библиотеку</button>',
        'wizard_tower': '<button onclick="openWizardTowerModal(); closeBuildingInfoModal();" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Управление магами</button>',
        'blessing_tower': '<button onclick="openBlessingTowerModal(); closeBuildingInfoModal();" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Выбрать благословение</button>',
        'time_generator': '<button onclick="showTimeGeneratorModal(); closeBuildingInfoModal();"...>Управление генератором</button>'
    };
    return actions[buildingId] || '';
}

// Функция показа меню строительства
function showBuildingConstructionMenu(buildingId) {
    console.log(`🏗️ Открытие меню строительства для ${buildingId}`);

    // КРИТИЧЕСКИ ВАЖНО: Проверяем config ДО создания overlay!
    const config = window.BUILDINGS_CONFIG[buildingId];
    if (!config) {
        console.warn(`⚠️ Нет конфигурации для здания ${buildingId}, меню не показано`);
        return;
    }

    // Получаем информацию о бонусах через систему building-descriptions
    let levelInfo = '';
    if (typeof window.getBuildingModalData === 'function') {
        const modalData = window.getBuildingModalData(buildingId, 0, 1, false);
        levelInfo = modalData.levelInfo;
    }

    // Вычисляем стоимость строительства
    const timeCost = window.CONSTRUCTION_TIME[buildingId] || 1440;
    const timeCostFormatted = typeof window.formatTimeCurrency === 'function'
        ? window.formatTimeCurrency(timeCost)
        : `${timeCost} мин`;

    // Закрываем предыдущие модальные окна
    closeAllModals();

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'construction-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c2c3d;
        border-radius: 15px;
        padding: 25px;
        color: white;
        z-index: 2000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        max-width: 450px;
        animation: modalFadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <!-- Заголовок -->
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 50px; margin-bottom: 10px;">${config.emoji}</div>
            <h2 style="margin: 0; color: #7289da; font-size: 24px;">
                ${config.name}
            </h2>
        </div>

        <!-- Описание -->
        <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <div style="font-size: 14px; color: #ccc; line-height: 1.6;">
                ${config.description}
            </div>
        </div>

        <!-- Бонусы (что даст здание) -->
        ${levelInfo ? `
        <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <div style="
                font-size: 12px;
                color: #ffa500;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
            ">
                Что даст:
            </div>
            <div style="font-size: 16px; color: #4ade80; font-weight: bold;">
                ${levelInfo}
            </div>
        </div>
        ` : ''}

        <!-- Стоимость -->
        <div style="
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
        ">
            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                Время строительства:
            </div>
            <div style="font-size: 18px; color: #ffa500; font-weight: bold;">
                ⏳ ${timeCostFormatted}
            </div>
        </div>

        <!-- Кнопки -->
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="closeConstructionModal()" style="
                padding: 12px 24px;
                background: #444;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#555'"
               onmouseout="this.style.background='#444'">
                Отмена
            </button>
            <button onclick="startBuilding('${buildingId}')" style="
                padding: 12px 24px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: background 0.2s;
            " onmouseover="this.style.background='#45a049'"
               onmouseout="this.style.background='#4CAF50'">
                ✅ Построить
            </button>
        </div>
    `;

    // Добавляем затемнение фона
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1999;
    `;
    overlay.onclick = closeConstructionModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Закрыть модальное окно строительства
function closeConstructionModal() {
    const modal = document.getElementById('construction-modal');
    if (modal) modal.remove();

    // ИСПРАВЛЕНИЕ: Удаляем ВСЕ overlay-и с id='modal-overlay', а не только первый
    const overlays = document.querySelectorAll('[id="modal-overlay"]');
    overlays.forEach(overlay => overlay.remove());
}

// Закрыть окно информации о здании
function closeBuildingInfoModal() {
    const modal = document.getElementById('building-info-modal');
    if (modal) modal.remove();

    // ИСПРАВЛЕНИЕ: Удаляем ВСЕ overlay-и с id='modal-overlay', а не только первый
    const overlays = document.querySelectorAll('[id="modal-overlay"]');
    overlays.forEach(overlay => overlay.remove());
}

// Примечание: closeAllModals теперь в core/helpers.js

// Модифицируем функцию switchToCityView чтобы добавить кликабельные зоны
const originalSwitchToCityView = window.switchToCityView;
window.switchToCityView = function(faction) {
    originalSwitchToCityView(faction);
    
    // Добавляем кликабельные зоны после загрузки города
    setTimeout(() => {
        const container = document.getElementById('city-background-container');
        if (container) {
            createBuildingClickZones(faction, container);
        }
    }, 100);
};

// Обновляем зоны при изменении размера окна с debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const container = document.getElementById('city-background-container');
        if (container && window.userData?.faction) {
            createBuildingClickZones(window.userData.faction, container);
        }
    }, 300);
});
function addConstructionVisualization(buildingId) {
    const faction = window.userData.faction;
    const container = document.getElementById('city-background-container');
    if (!container) return;
    
    loadCityPositions(faction).then(positions => {
        const buildingPos = Object.values(positions).find(pos => pos.buildingId === buildingId);
        if (!buildingPos) {
            console.error(`Не найдена позиция для здания ${buildingId}`);
            return;
        }
        
        const oldConstruction = document.getElementById(`construction-${buildingId}`);
        if (oldConstruction) oldConstruction.remove();
        
        const constructionDiv = document.createElement('div');
        constructionDiv.id = `construction-${buildingId}`;
        constructionDiv.className = 'construction-visualization';
        
        // Вычисляем центр полигона
        const centerX = buildingPos.points.reduce((sum, p) => sum + p.x, 0) / buildingPos.points.length;
        const centerY = buildingPos.points.reduce((sum, p) => sum + p.y, 0) / buildingPos.points.length;
        
        // Используем те же расчеты масштаба что и для полигонов
        const containerRect = container.getBoundingClientRect();
        const isMobile = window.isMobileDevice ? window.isMobileDevice() : false;
        let scaleX, scaleY, offsetX = 0;
        
        if (isMobile) {
            const screenHeight = window.innerHeight;
            const imageHeight = 512;
            const imageWidth = 768;
            const aspectRatio = imageWidth / imageHeight;
            
            const scaledHeight = screenHeight;
            const scaledWidth = scaledHeight * aspectRatio;
            
            scaleX = scaledWidth / imageWidth;
            scaleY = scaledHeight / imageHeight;
            
            const containerWidth = containerRect.width;
            offsetX = (containerWidth - scaledWidth) / 2;
        } else {
            const containerAspect = containerRect.width / containerRect.height;
            const imageAspect = 768 / 512;
            
            if (containerAspect > imageAspect) {
                scaleY = containerRect.height / 512;
                scaleX = scaleY;
                offsetX = (containerRect.width - 768 * scaleX) / 2;
            } else {
                scaleX = containerRect.width / 768;
                scaleY = scaleX;
            }
        }
        
        // Масштабируем координаты центра
        const scaledX = (centerX * scaleX) + offsetX;
        const scaledY = centerY * scaleY;
        
        constructionDiv.style.cssText = `
            position: absolute;
            left: ${scaledX}px;
            top: ${scaledY}px;
            transform: translate(-50%, -50%);
            z-index: 500;
            pointer-events: auto;
            cursor: pointer;
        `;
        
        constructionDiv.onclick = (e) => {
            e.stopPropagation();
            const constructions = window.userData?.constructions || [];
            const index = constructions.findIndex(c => 
                c.type === 'building' && 
                c.building_id === buildingId && 
                c.time_remaining > 0
            );
            if (index !== -1 && window.showConstructionModal) {
                window.showConstructionModal(index);
            }
        };
        
        updateConstructionTimer(buildingId, constructionDiv);
        container.appendChild(constructionDiv);
        
        console.log(`🔨 Молоток для ${buildingId} размещен: ${scaledX}px, ${scaledY}px`);
    });
}

function updateConstructionTimer(buildingId, element) {
    const constructions = window.userData?.constructions || [];
    const construction = constructions.find(c => 
        c.type === 'building' && 
        c.building_id === buildingId && 
        c.time_remaining > 0
    );
    
    if (!construction) {
        // Строительство завершено
        element.remove();
        
        // НЕ вызываем updateBuildingsGrid() - это кидает на старую сетку!
        // Просто загружаем здание на текущий фон
        const faction = window.userData.faction;
        const container = document.getElementById('city-background-container');
        if (container) {
            // Добавляем здание в данные
            if (!window.userData.buildings[buildingId]) {
                window.userData.buildings[buildingId] = {};
            }
            window.userData.buildings[buildingId].level = 1;
            window.userData.buildings[buildingId].building_id = buildingId;
            
            // Загружаем изображение
            const existingBuildings = container.querySelectorAll('.city-building');
            const newZIndex = existingBuildings.length + 1;
            window.loadBuildingImageNew(faction, buildingId, container, newZIndex);
            
            // Обновляем кликабельные зоны
            createBuildingClickZones(faction, container);
            
            // Показываем уведомление
            const config = window.BUILDINGS_CONFIG?.[buildingId];
            const buildingName = config ? config.name : buildingId;
            if (window.showNotification) {
                window.showNotification(`✅ ${buildingName} построено!`);
            }
        }
        return;
    }
    
    const config = window.BUILDINGS_CONFIG?.[buildingId];
    const buildingName = config ? config.name : buildingId;
    
    // Молоток в 3 раза меньше
    element.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ffa500;
            border-radius: 8px;
            padding: 6px;
            color: white;
            text-align: center;
            min-width: 60px;
            animation: pulse 2s infinite;
            box-shadow: 0 0 10px rgba(255,165,0,0.4);
        ">
            <div style="font-size: 20px; animation: hammer 1s infinite;">🔨</div>
            <div style="font-size: 9px; color: #fff; margin-top: 2px; white-space: nowrap;">
                ${buildingName}
            </div>
            <div style="font-size: 10px; color: #ffa500; font-weight: bold; margin-top: 2px;">
                ${window.formatTimeCurrency ? window.formatTimeCurrency(construction.time_remaining) : construction.time_remaining}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        if (document.getElementById(`construction-${buildingId}`)) {
            updateConstructionTimer(buildingId, element);
        }
    }, 10000);
}

function updateConstructionTimerSVG(buildingId) {
    const constructions = window.userData?.constructions || [];
    const construction = constructions.find(c => 
        c.type === 'building' && 
        c.building_id === buildingId && 
        c.time_remaining > 0
    );
    
    if (!construction) {
        // Строительство завершено - удаляем молоток
        const constructionG = document.getElementById(`construction-${buildingId}`);
        if (constructionG) constructionG.remove();
        
        // Загружаем готовое здание
        const faction = window.userData.faction;
        const container = document.getElementById('city-background-container');
        if (container) {
            window.userData.buildings[buildingId] = {
                level: 1,
                building_id: buildingId
            };
            
            const existingBuildings = container.querySelectorAll('.city-building');
            const newZIndex = existingBuildings.length + 1;
            window.loadBuildingImageNew(faction, buildingId, container, newZIndex);
            
            createBuildingClickZones(faction, container);
        }
        return;
    }
    
    // Обновляем текст таймера
    const timerText = document.getElementById(`timer-${buildingId}`);
    if (timerText) {
        timerText.textContent = window.formatTimeCurrency ? 
            window.formatTimeCurrency(construction.time_remaining) : 
            construction.time_remaining + ' мин';
    }
    
    // Обновляем каждые 10 секунд
    setTimeout(() => {
        updateConstructionTimerSVG(buildingId);
    }, 10000);
}
// Добавляем CSS анимации
if (!document.getElementById('building-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'building-animation-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* Стили для зданий - без transform! */
        .city-building {
            transition: filter 0.3s ease !important;
            /* НЕ используем transition для transform */
        }
        
        /* Фиксируем позиционирование чтобы не сбивалось */
        #city-background-container img {
            will-change: filter;
            /* НЕ используем will-change: transform */
        }
    `;
    document.head.appendChild(style);
}

if (!document.getElementById('construction-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'construction-animation-styles';
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
            100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }
        
        @keyframes hammer {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-20deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(20deg); }
            100% { transform: rotate(0deg); }
        }
        
        .construction-visualization {
            filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.5));
        }
    `;
    document.head.appendChild(style);
}

function checkActiveConstructions() {
    const constructions = window.userData?.constructions || [];
    constructions.forEach(construction => {
        if (construction.type === 'building' && construction.time_remaining > 0) {
            // Добавляем визуализацию для активных строек
            addConstructionVisualization(construction.building_id);
        }
    });
}
// Функция для добавления визуализации улучшения
function addUpgradeVisualization(buildingId) {
    const container = document.getElementById('city-background-container');
    if (!container) return;
    
    // Находим изображение здания
    let buildingImg = document.querySelector(`#building-${buildingId}`);
    if (!buildingImg) {
        buildingImg = document.querySelector(`[id*="${buildingId}"]`);
    }
    
    if (!buildingImg) {
        console.error(`Не найдено изображение здания ${buildingId} для улучшения`);
        return;
    }
    
    // Удаляем старый индикатор если есть
    const oldUpgrade = document.getElementById(`upgrade-${buildingId}`);
    if (oldUpgrade) oldUpgrade.remove();
    
    // Создаем индикатор улучшения
    const upgradeDiv = document.createElement('div');
    upgradeDiv.id = `upgrade-${buildingId}`;
    upgradeDiv.className = 'upgrade-visualization';
    
    // Позиционируем относительно изображения здания
    const rect = buildingImg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    upgradeDiv.style.cssText = `
        position: absolute;
        left: ${rect.left - containerRect.left + rect.width/2}px;
        top: ${rect.top - containerRect.top + rect.height/2}px;
        transform: translate(-50%, -50%);
        z-index: 600;
        pointer-events: auto;
        cursor: pointer;
    `;
    
    upgradeDiv.onclick = (e) => {
        e.stopPropagation();
        const constructions = window.userData?.constructions || [];
        const index = constructions.findIndex(c => 
            c.type === 'building' && 
            c.is_upgrade && 
            c.building_id === buildingId && 
            c.time_remaining > 0
        );
        if (index !== -1 && window.showConstructionModal) {
            window.showConstructionModal(index);
        }
    };
    
    updateUpgradeTimer(buildingId, upgradeDiv);
    container.appendChild(upgradeDiv);
}

// Функция обновления таймера улучшения
function updateUpgradeTimer(buildingId, element) {
    const constructions = window.userData?.constructions || [];
    const construction = constructions.find(c => 
        c.type === 'building' && 
        c.is_upgrade && 
        c.building_id === buildingId && 
        c.time_remaining > 0
    );
    
    if (!construction) {
        // Улучшение завершено
        element.remove();
        
        // НЕ пытаемся использовать construction.target_level так как construction = undefined
        // Просто показываем уведомление
        const config = window.BUILDINGS_CONFIG?.[buildingId];
        const buildingName = config ? config.name : buildingId;
        if (window.showNotification) {
            window.showNotification(`✅ ${buildingName} улучшено!`);
        }
        return;
    }
    
    const config = window.BUILDINGS_CONFIG?.[buildingId];
    const buildingName = config ? config.name : buildingId;
    const currentLevel = window.userData.buildings[buildingId]?.level || 1;
    
    // Отображаем индикатор улучшения
    element.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 6px;
            color: white;
            text-align: center;
            min-width: 70px;
            animation: pulse 2s infinite;
            box-shadow: 0 0 10px rgba(76,175,80,0.4);
        ">
            <div style="font-size: 20px; animation: rotate 2s linear infinite;">⚙️</div>
            <div style="font-size: 10px; margin: 2px 0;">Ур.${currentLevel}→${construction.target_level}</div>
            <div style="font-size: 11px; color: #4CAF50; font-weight: bold;">
                ${window.formatTimeCurrency ? window.formatTimeCurrency(construction.time_remaining) : construction.time_remaining}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        if (document.getElementById(`upgrade-${buildingId}`)) {
            updateUpgradeTimer(buildingId, element);
        }
    }, 10000);
}

// Обновим функцию startBuilding чтобы обрабатывать улучшения
function startBuilding(buildingId, isUpgrade = false) {
    console.log(`🏗️ ${isUpgrade ? 'Улучшаем' : 'Строим'} ${buildingId}`);
    
    if (!window.userData.buildings) {
        window.userData.buildings = {};
    }
    
    closeConstructionModal();
    
    if (window.userData.constructions !== undefined && window.CONSTRUCTION_TIME) {
        const constructions = window.userData.constructions || [];
        const hasActive = constructions.some(c => 
            c.type === 'building' && 
            c.time_remaining > 0
        );
        
        if (hasActive) {
            if (window.showNotification) {
                window.showNotification('⚠️ Можно строить/улучшать только одно здание одновременно!');
            }
            return;
        }
        
        if (!window.userData.constructions) {
            window.userData.constructions = [];
        }
        
        const currentLevel = window.userData.buildings[buildingId]?.level || 0;
        const targetLevel = isUpgrade ? currentLevel + 1 : 1;
        
        const timeRequired = isUpgrade ?
            (window.CONSTRUCTION_TIME?.getUpgradeTime ? 
                window.CONSTRUCTION_TIME.getUpgradeTime(buildingId, targetLevel) : 144 * targetLevel) :
            (window.CONSTRUCTION_TIME?.[buildingId] || 144);
        
        const construction = {
            type: 'building',
            building_id: buildingId,
            cell_index: null,
            is_upgrade: isUpgrade,
            target_level: targetLevel,
            time_required: timeRequired,
            time_remaining: timeRequired,
            started_at: Date.now()
        };
        
        window.userData.constructions.push(construction);
        
        if (window.updateConstructionUI) {
            window.updateConstructionUI();
        }
        
        if (window.saveConstruction) {
            window.saveConstruction();
        }

        // Добавляем визуализацию
        if (isUpgrade) {
            window.addUpgradeVisualization(buildingId);
        } else {
            addConstructionVisualization(buildingId);
        }
        
        const container = document.getElementById('city-background-container');
        if (container && window.userData?.faction) {
            createBuildingClickZones(window.userData.faction, container);
        }

        if (window.showNotification) {
            const action = isUpgrade ? 'Улучшение' : 'Строительство';
            window.showNotification(`🏗️ ${action} ${buildingId} началось!`);
        }
    }
}

// Добавим CSS для анимации
if (!document.getElementById('upgrade-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'upgrade-animation-styles';
    style.textContent = `
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// При инициализации проверяем активные улучшения
function checkActiveUpgrades() {
    const constructions = window.userData?.constructions || [];
    constructions.forEach(construction => {
        if (construction.type === 'building' && construction.is_upgrade && construction.time_remaining > 0) {
            addUpgradeVisualization(construction.building_id);
        }
    });
}

// ===== ВИЗУАЛИЗАЦИЯ ИССЛЕДОВАНИЯ ЗАКЛИНАНИЙ НА БИБЛИОТЕКЕ =====
function addSpellResearchVisualization(retryCount = 0) {
    const container = document.getElementById('city-background-container');
    if (!container) return;

    // Проверяем, есть ли активное изучение заклинания
    const constructions = window.userData?.constructions || [];
    const spellConstruction = constructions.find(c =>
        c.type === 'spell' &&
        c.time_remaining > 0
    );

    if (!spellConstruction) {
        // Нет активного изучения - удаляем индикатор если есть
        const oldResearch = document.getElementById('spell-research-library');
        if (oldResearch) oldResearch.remove();
        return;
    }

    // Находим изображение библиотеки - с несколькими попытками
    let libraryImg = document.querySelector('#building-library');
    if (!libraryImg) {
        libraryImg = document.querySelector('[id*="library"]');
    }
    if (!libraryImg) {
        // Пробуем найти по классу
        const buildings = document.querySelectorAll('.city-building');
        libraryImg = Array.from(buildings).find(img =>
            img.id && img.id.includes('library')
        );
    }

    if (!libraryImg) {
        // Максимум 5 попыток с интервалом 500ms
        if (retryCount < 5) {
            console.warn(`⚠️ Изображение библиотеки не найдено, попытка ${retryCount + 1}/5 через 500ms`);
            setTimeout(() => {
                addSpellResearchVisualization(retryCount + 1);
            }, 500);
        } else {
            console.error('❌ Библиотека не найдена после 5 попыток. Возможно она не построена.');
        }
        return;
    }

    // Удаляем старый индикатор если есть
    const oldResearch = document.getElementById('spell-research-library');
    if (oldResearch) oldResearch.remove();

    // Создаем индикатор исследования
    const researchDiv = document.createElement('div');
    researchDiv.id = 'spell-research-library';
    researchDiv.className = 'research-visualization';

    // Позиционируем относительно изображения библиотеки
    const rect = libraryImg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    researchDiv.style.cssText = `
        position: absolute;
        left: ${rect.left - containerRect.left + rect.width/2}px;
        top: ${rect.top - containerRect.top + rect.height/2}px;
        transform: translate(-50%, -50%);
        z-index: 600;
        pointer-events: auto;
        cursor: pointer;
    `;

    researchDiv.onclick = (e) => {
        e.stopPropagation();
        const constructions = window.userData?.constructions || [];
        const index = constructions.findIndex(c =>
            c.type === 'spell' &&
            c.time_remaining > 0
        );
        if (index !== -1 && window.showConstructionModal) {
            window.showConstructionModal(index);
        }
    };

    updateSpellResearchTimer(researchDiv, spellConstruction);
    container.appendChild(researchDiv);
}

// Функция обновления таймера исследования заклинаний
function updateSpellResearchTimer(element, construction) {
    if (!construction || construction.time_remaining <= 0) {
        // Исследование завершено
        element.remove();
        return;
    }

    const spellName = construction.spell_name || construction.spell_id || 'Заклинание';
    const factionEmoji = window.getFactionEmoji ? window.getFactionEmoji(construction.faction) : '📖';

    // Отображаем индикатор исследования
    element.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #9333ea;
            border-radius: 8px;
            padding: 6px;
            color: white;
            text-align: center;
            min-width: 80px;
            animation: pulse 2s infinite;
            box-shadow: 0 0 10px rgba(147,51,234,0.4);
        ">
            <div style="font-size: 20px; animation: sparkle 2s infinite;">${factionEmoji}📚</div>
            <div style="font-size: 9px; margin: 2px 0; color: #c084fc;">Ур.${construction.target_level}</div>
            <div style="font-size: 11px; color: #9333ea; font-weight: bold;">
                ${window.formatTimeCurrency ? window.formatTimeCurrency(construction.time_remaining) : construction.time_remaining}
            </div>
        </div>
    `;

    setTimeout(() => {
        if (document.getElementById('spell-research-library')) {
            // Перепроверяем конструкцию
            const constructions = window.userData?.constructions || [];
            const updatedConstruction = constructions.find(c =>
                c.type === 'spell' &&
                c.time_remaining > 0
            );
            updateSpellResearchTimer(element, updatedConstruction);
        }
    }, 10000);
}

// При инициализации проверяем активные исследования заклинаний
function checkActiveSpellResearch() {
    const constructions = window.userData?.constructions || [];
    const hasSpellResearch = constructions.some(c =>
        c.type === 'spell' &&
        c.time_remaining > 0
    );

    if (hasSpellResearch) {
        addSpellResearchVisualization();
    }
}

// Добавим CSS для анимации исследования
if (!document.getElementById('research-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'research-animation-styles';
    style.textContent = `
        @keyframes sparkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
}

// Экспортируем новые функции
window.addUpgradeVisualization = addUpgradeVisualization;
window.updateUpgradeTimer = updateUpgradeTimer;
window.checkActiveUpgrades = checkActiveUpgrades;
window.addSpellResearchVisualization = addSpellResearchVisualization;
window.updateSpellResearchTimer = updateSpellResearchTimer;
window.checkActiveSpellResearch = checkActiveSpellResearch;

// Экспортируем функции
window.highlightBuilding = highlightBuilding;
window.showBuildingInfoModal = showBuildingInfoModal;
window.closeBuildingInfoModal = closeBuildingInfoModal;
window.closeAllModals = closeAllModals;
window.showBuildingTooltip = showBuildingTooltip;
window.hideBuildingTooltip = hideBuildingTooltip;
window.createBuildingClickZones = createBuildingClickZones;
window.loadCityPositions = loadCityPositions;
window.closeConstructionModal = closeConstructionModal;
window.startBuilding = startBuilding;
window.getBuildingFunctionality = getBuildingFunctionality;
window.getActionButton = getActionButton;
window.addConstructionVisualization = addConstructionVisualization;
window.updateConstructionTimer = updateConstructionTimer;
window.checkActiveConstructions = checkActiveConstructions;
window.updateConstructionTimerSVG = updateConstructionTimerSVG;