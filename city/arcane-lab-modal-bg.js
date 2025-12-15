// arcane-lab-modal-bg.js - Полноэкранное окно Арканской лаборатории с фоном webp

// Открыть окно Арканской лаборатории
function showArcaneLabModalBg() {
    console.log('🧪 Открытие окна Арканской лаборатории с фоном');

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
    const existingScreen = document.getElementById('arcane-lab-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'arcane-lab-screen';
    screen.className = 'arcane-lab-screen active';
    
    // Создаем HTML структуру
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="lab-bg-image" id="lab-bg-image" src="${imagePath}" alt="Арканская лаборатория">
            <div class="lab-ui-overlay" id="lab-ui-overlay"></div>
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
    
    const img = document.getElementById('lab-bg-image');
    
    // Настройка UI после загрузки изображения
    img.onload = () => setupLabUI();
    if (img.complete) setupLabUI();
    
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
function setupLabUI() {
    const img = document.getElementById('lab-bg-image');
    const overlay = document.getElementById('lab-ui-overlay');
    
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
    
    // ЗОНА 2: КОНТЕНТ (поднята выше)
    const contentArea = {
        x: 115 * scaleX,
        y: 75 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 75) * scaleY
    };
    
    // ЗОНА 3: КНОПКА ЗАКРЫТЬ (самый низ фона)
    const footerArea = {
        x: 115 * scaleX,
        y: 430 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };
    
    // Получаем данные
    const labLevel = window.getBuildingLevel ? window.getBuildingLevel('arcane_lab') : 1;
    const maxLabLevel = typeof getBuildingMaxLevel === 'function' ? getBuildingMaxLevel('arcane_lab') : 15;
    const currentBonus = Math.min(labLevel * 2, 30); // максимум 30%
    const nextBonus = Math.min((labLevel + 1) * 2, 30);
    
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
                🧪 Арканская лаборатория
            </h3>
            <div style="font-size: ${baseFontSize}px; color: #7289da; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                Уровень: ${labLevel}/${maxLabLevel}
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
    `;
    
    // HTML бонуса лаборатории
    const bonusHTML = `
        <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="flex: 1; background: rgba(74, 85, 104, 0.2); backdrop-filter: blur(3px); padding: 8px; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.3); display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: ${smallFontSize}px; color: #da70d6; margin-bottom: 6px; font-weight: bold; text-align: center;">🧪 Бонус</div>
                <div style="display: flex; gap: 6px; font-size: ${smallFontSize * 0.9}px; justify-content: center; flex-wrap: wrap;">
                    <div style="background: rgba(138, 43, 226, 0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(138, 43, 226, 0.4);">-${currentBonus}% время</div>
                </div>
            </div>
        </div>
    `;
    
    // Кнопка апгрейда лаборатории
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('arcane_lab', labLevel + 1) : 144 * (labLevel + 1);
    const upgradeButton = `
        <div style="flex: 1; display: flex;">
            ${labLevel < maxLabLevel ?
                `<button style="flex: 1; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid rgba(138, 43, 226, 0.6); border-radius: 6px; background: rgba(138, 43, 226, 0.15); color: white; cursor: pointer; backdrop-filter: blur(3px); font-weight: bold;"
                    onclick="showLabUpgradeConfirm(${labLevel}, ${upgradeTime})">
                    ⬆️ Лаборатория ${labLevel}→${labLevel + 1}<br><span style="font-size: ${smallFontSize * 0.85}px;">⏱️ ${window.formatTimeCurrency(upgradeTime)}</span>
                </button>` :
                `<div style="flex: 1; text-align: center; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; color: #777;">✅ Макс. уровень</div>`
            }
        </div>
    `;
    
    // Информация о лаборатории
    const infoHTML = `
        <div style="background: rgba(61, 61, 92, 0.15); backdrop-filter: blur(3px); padding: 8px; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.3); margin-bottom: 6px;">
            <div style="font-size: ${baseFontSize}px; color: #da70d6; margin-bottom: 4px; font-weight: bold; text-align: center;">📚 О лаборатории</div>
            <div style="font-size: ${smallFontSize}px; color: #aaa; line-height: 1.4;">
                <p style="margin: 4px 0;">Ускоряет изучение заклинаний.</p>
                <p style="margin: 4px 0;">• Уровень: <span style="color: #4ade80;">-2%</span></p>
                <p style="margin: 4px 0;">• Максимум: <span style="color: #4ade80;">-30%</span></p>
            </div>
        </div>
    `;
    
    // Заполняем основной контейнер
    contentContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 40% 60%; gap: 10px; height: 100%; overflow: hidden;">
            <!-- ЛЕВАЯ: Бонус и улучшение -->
            <div style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; justify-content: space-between;">
                ${bonusHTML}
                ${upgradeButton}
            </div>
            
            <!-- ПРАВАЯ: Информация -->
            <div style="overflow-y: auto; padding-right: 4px;">
                ${infoHTML}
            </div>
        </div>
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
            onclick="closeArcaneLabModalBg()">
            ❌ Закрыть
        </button>
    `;
    
    overlay.appendChild(footerContainer);
    
    // Стили скроллбара
    const style = document.createElement('style');
    style.textContent = `
        #lab-ui-overlay *::-webkit-scrollbar {
            width: 6px;
        }
        #lab-ui-overlay *::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        #lab-ui-overlay *::-webkit-scrollbar-thumb {
            background: rgba(138, 43, 226, 0.5);
            border-radius: 3px;
        }
        #lab-ui-overlay *::-webkit-scrollbar-thumb:hover {
            background: rgba(138, 43, 226, 0.7);
        }
    `;
    document.head.appendChild(style);
}

// Показать экран подтверждения апгрейда лаборатории
function showLabUpgradeConfirm(currentLevel, upgradeTime) {
    const contentContainer = document.querySelector('#lab-ui-overlay > div:nth-child(2)');
    const overlay = document.getElementById('lab-ui-overlay');
    
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
    
    // Получаем информацию о бонусах
    const nextLevel = currentLevel + 1;
    const nextBonus = Math.min(nextLevel * 2, 30);
    const bonusInfo = `-${nextBonus}% времени на изучение`;
    
    // Контентная область (поднята выше)
    const contentArea = {
        x: 115 * scaleX,
        y: 75 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 75) * scaleY
    };

    // Создаем контейнер подтверждения
    const confirmContainer = document.createElement('div');
    confirmContainer.id = 'lab-upgrade-confirm';
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
        <div style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); padding: 15px; border-radius: 10px; border: 2px solid rgba(138, 43, 226, 0.5); text-align: center; max-width: 85%;">
            <h3 style="margin: 0 0 8px 0; color: #FFD700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                ⚠️ Подтверждение
            </h3>
            <p style="margin: 0 0 6px 0; font-size: ${baseFontSize}px; color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">
                Улучшить лабораторию<br>
                <span style="color: #7289da; font-weight: bold;">${currentLevel} → ${nextLevel} ур.</span>
            </p>
            
            <div style="background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); padding: 6px; border-radius: 6px; margin: 8px 0;">
                <div style="font-size: ${smallFontSize}px; color: #da70d6; margin-bottom: 2px;">
                    Новый бонус:
                </div>
                <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold;">
                    ${bonusInfo}
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
                    onclick="confirmLabUpgrade(${nextLevel})">
                    ✅ Да
                </button>
                <button style="padding: 8px 20px; font-size: ${baseFontSize}px; border: 2px solid rgba(255, 107, 107, 0.6); border-radius: 8px; background: rgba(255, 107, 107, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="cancelLabUpgrade()">
                    ❌ Нет
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(confirmContainer);
}

// Подтвердить апгрейд лаборатории
async function confirmLabUpgrade(targetLevel) {
    // Закрываем окно лаборатории
    closeArcaneLabModalBg();
    
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
    
    // Рассчитываем время улучшения
    const timeRequired = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('arcane_lab', targetLevel) : 144 * targetLevel;

    // Вызываем executeBuilding напрямую (пользователь уже подтвердил)
    if (window.executeBuilding) {
        window.executeBuilding('arcane_lab', true, targetLevel, timeRequired);
        return;
    }

    // Альтернативный метод через систему конструкций
    if (typeof window.startConstruction === 'function') {
        const success = await window.startConstruction('arcane_lab', null, true, targetLevel);
        if (success) {
            showNotification(`🔨 Начато улучшение до уровня ${targetLevel}`);
        }
        return;
    }

    // Если ничего не сработало
    showNotification('❌ Ошибка системы строительства');
}

// Отменить апгрейд - вернуться к основному меню
function cancelLabUpgrade() {
    const confirmContainer = document.getElementById('lab-upgrade-confirm');
    const contentContainer = document.querySelector('#lab-ui-overlay > div:nth-child(2)');
    
    if (confirmContainer) {
        confirmContainer.remove();
    }
    
    if (contentContainer) {
        contentContainer.style.display = 'flex';
    }
}

// Закрыть окно лаборатории
function closeArcaneLabModalBg() {
    const screen = document.getElementById('arcane-lab-screen');
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
window.showArcaneLabModalBg = showArcaneLabModalBg;
window.closeArcaneLabModalBg = closeArcaneLabModalBg;
window.showLabUpgradeConfirm = showLabUpgradeConfirm;
window.confirmLabUpgrade = confirmLabUpgrade;
window.cancelLabUpgrade = cancelLabUpgrade;

