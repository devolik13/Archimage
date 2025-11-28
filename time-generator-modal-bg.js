// time-generator-modal-bg.js - Полноэкранное окно Генератора времени с фоном webp
console.log('✅ time-generator-modal-bg.js загружен');

// Открыть окно Генератора времени
function showTimeGeneratorModalBg() {
    console.log('🧪 Открытие окна Генератора времени с фоном');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Закрываем предыдущие модальные окна
    if (typeof closeAllModals === 'function') {
        closeAllModals();
    }
    
    // Определяем фракцию игрока
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;
    
    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('time-generator-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'time-generator-screen';
    screen.className = 'time-generator-screen active';
    
    // Создаем HTML структуру
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="generator-bg-image" id="generator-bg-image" src="${imagePath}" alt="Генератор времени">
            <div class="generator-ui-overlay" id="generator-ui-overlay"></div>
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
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(screen);
    
    const img = document.getElementById('generator-bg-image');
    
    // Настройка UI после загрузки изображения
    img.onload = () => setupGeneratorUI();
    if (img.complete) setupGeneratorUI();
    
    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон лаборатории');
        screen.remove();
        if (typeof showArcaneLabModal === 'function') {
            showArcaneLabModal();
        }
    };
}

// Настройка UI лаборатории
function setupGeneratorUI() {
    const img = document.getElementById('generator-bg-image');
    const overlay = document.getElementById('generator-ui-overlay');
    
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
    
    // Масштаб для координат
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;
    
    // ЗОНА 1: ЗАГОЛОВОК (самый верх фона)
    const headerArea = {
        x: 115 * scaleX,
        y: 20 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };
    
    // ЗОНА 2: КОНТЕНТ (внутри указанной области 115-655 x 115-400)
    const contentArea = {
        x: 115 * scaleX,
        y: 115 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 115) * scaleY
    };
    
    // ЗОНА 3: КНОПКА ЗАКРЫТЬ (самый низ фона)
    const footerArea = {
        x: 115 * scaleX,
        y: 430 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };
    
    // Получаем данные генератора времени
    const generatorLevel = window.getBuildingLevel ? window.getBuildingLevel('time_generator') : 1;
    const maxGeneratorLevel = typeof getBuildingMaxLevel === 'function' ? getBuildingMaxLevel('time_generator') : 15;
    
    // Используем существующие функции вместо дублирования расчетов
    const production = window.calculateProduction ? window.calculateProduction() : 0;
    const storage = window.calculateMaxStorage ? window.calculateMaxStorage() : 0;
    
    // Рассчитываем следующий уровень
    const nextProduction = generatorLevel < maxGeneratorLevel ? 
        60 + generatorLevel * 30 : production;
    const nextStorage = generatorLevel < maxGeneratorLevel ?
        1440 + generatorLevel * 720 : storage;
    
    // Текущая валюта игрока
    const currentCurrency = window.userData?.time_currency || 0;
    
    // Время до заполнения хранилища
    const minutesToFull = storage > currentCurrency ? Math.ceil((storage - currentCurrency) / (production / 60)) : 0;
    const hoursToFull = Math.floor(minutesToFull / 60);
    const minsToFull = minutesToFull % 60;
    const timeToFullText = minutesToFull > 0 ?
        (hoursToFull > 0 ? `${hoursToFull}ч ${minsToFull}м` : `${minsToFull}м`) :
        'Заполнено';
    
    // Адаптивные размеры шрифтов (ТОЧНО как у башни магов)
    const baseFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
    const titleFontSize = Math.max(16, 24 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(10, 13 * Math.min(scaleX, scaleY));
    
    // === КОНТЕЙНЕР 1: ЗАГОЛОВОК ===
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
        <div style="text-align: center;">
            <h3 style="margin: 0 0 4px 0; color: #FFD700; font-size: ${titleFontSize}px; text-shadow: 3px 3px 6px rgba(0,0,0,0.9);">
                ⏰ Генератор времени
            </h3>
            <div style="font-size: ${baseFontSize}px; color: #7289da; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                Уровень: ${generatorLevel}/${maxGeneratorLevel}
            </div>
        </div>
    `;
    
    overlay.appendChild(headerContainer);
    
    // === КОНТЕЙНЕР 2: ОСНОВНОЙ КОНТЕНТ ===
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        gap: 8px;
    `;
    
    // 3 КАРТОЧКИ С ИНФОРМАЦИЕЙ (прозрачные)
    const cardsHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; flex: 1;">
            <!-- ПРОИЗВОДСТВО -->
            <div style="background: rgba(74, 222, 128, 0.2); border: 1px solid rgba(74, 222, 128, 0.5); backdrop-filter: blur(5px); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="text-align: center;">
                    <span style="font-size: ${titleFontSize}px;">⚡</span>
                    <h4 style="margin: 4px 0; color: #4ade80; font-size: ${smallFontSize}px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">Производство</h4>
                </div>
                <div style="font-size: ${titleFontSize * 1.2}px; color: white; text-align: center; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    +${production}
                </div>
                <div style="font-size: ${smallFontSize * 0.8}px; color: rgba(255,255,255,0.9); text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    мин/час
                </div>
                ${generatorLevel < maxGeneratorLevel ? `
                    <div style="font-size: ${smallFontSize * 0.7}px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 4px; padding: 3px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        След. ур: +${nextProduction}
                    </div>
                ` : ''}
            </div>

            <!-- ХРАНИЛИЩЕ -->
            <div style="background: rgba(0, 188, 212, 0.2); border: 1px solid rgba(0, 188, 212, 0.5); backdrop-filter: blur(5px); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="text-align: center;">
                    <span style="font-size: ${titleFontSize}px;">📦</span>
                    <h4 style="margin: 4px 0; color: #00bcd4; font-size: ${smallFontSize}px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">Хранилище</h4>
                </div>
                <div style="font-size: ${titleFontSize}px; color: white; text-align: center; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    ${window.formatTimeCurrency(storage)}
                </div>
                <div style="font-size: ${smallFontSize * 0.8}px; color: rgba(255,255,255,0.9); text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    лимит оффлайн
                </div>
                ${generatorLevel < maxGeneratorLevel ? `
                    <div style="font-size: ${smallFontSize * 0.7}px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 4px; padding: 3px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        След. ур: ${window.formatTimeCurrency(nextStorage)}
                    </div>
                ` : ''}
            </div>

            <!-- ЗАПОЛНЕНИЕ -->
            <div style="background: rgba(255, 165, 0, 0.2); border: 1px solid rgba(255, 165, 0, 0.5); backdrop-filter: blur(5px); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="text-align: center;">
                    <span style="font-size: ${titleFontSize}px;">⏰</span>
                    <h4 style="margin: 4px 0; color: #ffa500; font-size: ${smallFontSize}px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">Заполнение</h4>
                </div>
                <div style="font-size: ${titleFontSize}px; color: white; text-align: center; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    ${timeToFullText}
                </div>
                <div style="font-size: ${smallFontSize * 0.8}px; color: rgba(255,255,255,0.9); text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    до полного
                </div>
                <div style="font-size: ${smallFontSize * 0.7}px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 4px; padding: 3px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                    Валюта: ${window.formatTimeCurrency(currentCurrency)}
                </div>
            </div>
        </div>
    `;
    
    // КНОПКА УЛУЧШЕНИЯ
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('time_generator', generatorLevel + 1) : 144 * (generatorLevel + 1);
    
    const upgradeButton = generatorLevel < maxGeneratorLevel ? `
        <button style="width: 100%; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid rgba(255, 165, 0, 0.6); border-radius: 6px; background: rgba(255, 165, 0, 0.15); color: white; cursor: pointer; backdrop-filter: blur(3px); font-weight: bold;"
            onclick="showGeneratorUpgradeConfirm(${generatorLevel}, ${upgradeTime})">
            ⬆️ Улучшить до уровня ${generatorLevel + 1}<br>
            <span style="font-size: ${smallFontSize * 0.85}px;">⏱️ ${window.formatTimeCurrency(upgradeTime)}</span>
        </button>
    ` : `
        <div style="text-align: center; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); color: #4ade80;">
            ✅ Максимальный уровень достигнут!
        </div>
    `;
    
    // Заполняем основной контейнер
    contentContainer.innerHTML = `
        ${cardsHTML}
        ${upgradeButton}
    `;
    
    overlay.appendChild(contentContainer);
    
    // === КОНТЕЙНЕР 3: КНОПКА ЗАКРЫТЬ ===
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
    
    footerContainer.innerHTML = `
        <button style="padding: 12px 40px; font-size: ${baseFontSize}px; border: 2px solid rgba(255, 107, 107, 0.8); border-radius: 8px; background: transparent; color: white; cursor: pointer; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);"
            onclick="closeTimeGeneratorModalBg()">
            ❌ Закрыть
        </button>
    `;
    
    overlay.appendChild(footerContainer);
    
    // Стили скроллбара
    const style = document.createElement('style');
    style.textContent = `
        #generator-ui-overlay *::-webkit-scrollbar {
            width: 6px;
        }
        #generator-ui-overlay *::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        #generator-ui-overlay *::-webkit-scrollbar-thumb {
            background: rgba(255, 165, 0, 0.5);
            border-radius: 3px;
        }
        #generator-ui-overlay *::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 165, 0, 0.7);
        }
    `;
    document.head.appendChild(style);
}

// Показать экран подтверждения апгрейда лаборатории
function showGeneratorUpgradeConfirm(currentLevel, upgradeTime) {
    const contentContainer = document.querySelector('#generator-ui-overlay > div:nth-child(2)');
    const overlay = document.getElementById('generator-ui-overlay');
    
    if (!contentContainer || !overlay) return;
    
    // Скрываем основной контент
    contentContainer.style.display = 'none';
    
    // Получаем размеры для масштабирования
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = overlayRect.width / 768;
    const scaleY = overlayRect.height / 512;
    
    const baseFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
    const titleFontSize = Math.max(14, 20 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(11, 14 * Math.min(scaleX, scaleY));
    
    // Рассчитываем новые значения
    const nextLevel = currentLevel + 1;
    const newProduction = 60 + currentLevel * 30;
    const newStorage = 1440 + currentLevel * 720;
    
    // Контентная область
    const contentArea = {
        x: 115 * scaleX,
        y: 115 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 115) * scaleY
    };
    
    // Создаем контейнер подтверждения
    const confirmContainer = document.createElement('div');
    confirmContainer.id = 'generator-upgrade-confirm';
    confirmContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `;
    
    const timeText = typeof window.formatTimeCurrency === 'function' 
        ? window.formatTimeCurrency(upgradeTime) 
        : `${Math.floor(upgradeTime / 60)} мин`;
    
    confirmContainer.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); padding: 15px; border-radius: 10px; border: 2px solid rgba(255, 165, 0, 0.5); text-align: center; max-width: 85%;">
            <h3 style="margin: 0 0 8px 0; color: #FFD700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                ⚠️ Подтверждение
            </h3>
            <p style="margin: 0 0 6px 0; font-size: ${baseFontSize}px; color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">
                Улучшить генератор<br>
                <span style="color: #7289da; font-weight: bold;">${currentLevel} → ${nextLevel} ур.</span>
            </p>
            
            <div style="background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); padding: 6px; border-radius: 6px; margin: 8px 0;">
                <div style="font-size: ${smallFontSize}px; color: #4ade80; margin-bottom: 2px;">
                    ⚡ Новое производство:
                </div>
                <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold;">
                    +${newProduction} мин/час
                </div>
            </div>
            
            <div style="background: rgba(0, 188, 212, 0.15); border: 1px solid rgba(0, 188, 212, 0.4); padding: 6px; border-radius: 6px; margin: 8px 0;">
                <div style="font-size: ${smallFontSize}px; color: #00bcd4; margin-bottom: 2px;">
                    📦 Новое хранилище:
                </div>
                <div style="font-size: ${baseFontSize}px; color: #00bcd4; font-weight: bold;">
                    ${typeof window.formatTimeCurrency === 'function' ? window.formatTimeCurrency(newStorage) : newStorage + ' мин'}
                </div>
            </div>
            
            <div style="background: rgba(255, 165, 0, 0.15); border: 1px solid rgba(255, 165, 0, 0.4); padding: 6px; border-radius: 6px; margin-bottom: 10px;">
                <div style="font-size: ${smallFontSize}px; color: #aaa; margin-bottom: 2px;">
                    Время:
                </div>
                <div style="font-size: ${baseFontSize}px; color: #ffa500; font-weight: bold;">
                    ⏱️ ${timeText}
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button style="padding: 8px 20px; font-size: ${baseFontSize}px; border: 2px solid rgba(74, 222, 128, 0.6); border-radius: 8px; background: rgba(74, 222, 128, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="confirmGeneratorUpgrade(${nextLevel})">
                    ✅ Да
                </button>
                <button style="padding: 8px 20px; font-size: ${baseFontSize}px; border: 2px solid rgba(255, 107, 107, 0.6); border-radius: 8px; background: rgba(255, 107, 107, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="cancelGeneratorUpgrade()">
                    ❌ Нет
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(confirmContainer);
}

// Подтвердить апгрейд лаборатории
async function confirmGeneratorUpgrade(targetLevel) {
    // Закрываем окно лаборатории
    closeTimeGeneratorModalBg();
    
    // Проверяем активные конструкции
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c =>
            c.type === 'building' &&
            c.time_remaining > 0
        );
        if (activeConstruction) {
            if (activeConstruction.is_upgrade) {
                showNotification('⚠️ Уже идет улучшение другого здания!');
            } else {
                showNotification('⚠️ Нельзя улучшать пока идет строительство!');
            }
            return;
        }
    }
    
    // Запускаем улучшение через систему строительства
    if (window.startBuilding) {
        window.startBuilding('time_generator', true); // true означает что это улучшение
        return;
    }
    
    // Альтернативный метод через систему конструкций
    if (typeof window.startConstruction === 'function') {
        const success = await window.startConstruction('time_generator', null, true, targetLevel);
        if (success) {
            showNotification(`🔨 Начато улучшение до уровня ${targetLevel}`);
        }
        return;
    }
    
    // Если ничего не сработало
    showNotification('❌ Ошибка системы строительства');
}

// Отменить апгрейд - вернуться к основному меню
function cancelGeneratorUpgrade() {
    const confirmContainer = document.getElementById('generator-upgrade-confirm');
    const contentContainer = document.querySelector('#generator-ui-overlay > div:nth-child(2)');
    
    if (confirmContainer) {
        confirmContainer.remove();
    }
    
    if (contentContainer) {
        contentContainer.style.display = 'flex';
    }
}

// Закрыть окно генератора времени
function closeTimeGeneratorModalBg() {
    const screen = document.getElementById('time-generator-screen');
    if (screen) {
        screen.remove();
    }

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }
}

// Экспортируем функции
window.showTimeGeneratorModalBg = showTimeGeneratorModalBg;
window.closeTimeGeneratorModalBg = closeTimeGeneratorModalBg;
window.showGeneratorUpgradeConfirm = showGeneratorUpgradeConfirm;
window.confirmGeneratorUpgrade = confirmGeneratorUpgrade;
window.cancelGeneratorUpgrade = cancelGeneratorUpgrade;

console.log('✅ Функции окна Генератора времени экспортированы');