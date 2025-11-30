// blessing-tower-modal-bg.js - Полноэкранное окно Башни благословения с фоном webp

// Открыть окно Башни благословения
function showBlessingTowerModalBg() {
    console.log('🙏 Открытие окна Башни благословения с фоном');

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
    const existingScreen = document.getElementById('blessing-tower-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'blessing-tower-screen';
    screen.className = 'blessing-tower-screen active';
    
    // Создаем HTML структуру
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="blessing-bg-image" id="blessing-bg-image" src="${imagePath}" alt="Башня благословения">
            <div class="blessing-ui-overlay" id="blessing-ui-overlay"></div>
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
    
    const img = document.getElementById('blessing-bg-image');
    
    // Настройка UI после загрузки изображения
    img.onload = () => setupBlessingUI();
    if (img.complete) setupBlessingUI();
    
    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон башни благословенияи');
        screen.remove();
        if (typeof showArcaneLabModal === 'function') {
            showArcaneLabModal();
        }
    };
}

// Настройка UI башни благословенияи
function setupBlessingUI() {
    const img = document.getElementById('blessing-bg-image');
    const overlay = document.getElementById('blessing-ui-overlay');
    
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
    
    // Получаем данные башни благословения
    const towerLevel = window.getBuildingLevel ? window.getBuildingLevel('blessing_tower') : 1;
    const maxTowerLevel = typeof getBuildingMaxLevel === 'function' ? getBuildingMaxLevel('blessing_tower') : 5;
    
    // Получаем активное благословение и доступные
    const activeBlessing = typeof window.getActiveBlessing === 'function' ? window.getActiveBlessing() : null;
    const canUseCheck = typeof window.canUseBlessingTower === 'function' ? window.canUseBlessingTower() : { canUse: false, reason: 'Система не загружена' };
    const availableBlessings = typeof window.getAvailableBlessings === 'function' ? window.getAvailableBlessings() : [];
    
    // Информация о длительности и кулдауне
    const blessingDuration = window.BLESSING_TOWER_CONFIG?.BLESSING_DURATION || 180;
    const cooldownDuration = window.BLESSING_TOWER_CONFIG?.COOLDOWN_DURATION || 720;
    
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
                🙏 Башня благословения
            </h3>
            <div style="font-size: ${baseFontSize}px; color: #7289da; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                Уровень: ${towerLevel}/${maxTowerLevel} | ${blessingDuration/60}ч действие | ${cooldownDuration/60}ч кулдаун
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
        gap: 8px;
        overflow-y: auto;
        padding-right: 4px;
    `;
    
    // АКТИВНОЕ БЛАГОСЛОВЕНИЕ (если есть)
    let activeBlessingHTML = '';
    if (activeBlessing && activeBlessing.expires_at > Date.now()) {
        const remainingTime = Math.ceil((activeBlessing.expires_at - Date.now()) / (60 * 1000));
        const totalTime = Math.ceil((activeBlessing.expires_at - activeBlessing.activated_at) / (60 * 1000));
        const progressPercent = ((totalTime - remainingTime) / totalTime * 100);
        
        activeBlessingHTML = `
            <div style="background: linear-gradient(135deg, #4ade80 0%, #3d9b68 100%); padding: 10px; border-radius: 8px; border: 2px solid #4CAF50;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: ${titleFontSize}px;">${activeBlessing.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-size: ${smallFontSize}px; color: white; font-weight: bold;">${activeBlessing.name}</div>
                        <div style="font-size: ${smallFontSize * 0.8}px; color: rgba(255,255,255,0.9);">Осталось: ${window.formatTimeCurrency(remainingTime)}</div>
                    </div>
                </div>
                <div style="width: 100%; background: rgba(255,255,255,0.3); height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #81c784 0%, #4caf50 100%); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    } else if (!canUseCheck.canUse) {
        activeBlessingHTML = `
            <div style="background: rgba(255, 165, 0, 0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 165, 0, 0.4); text-align: center;">
                <div style="font-size: ${smallFontSize}px; color: #ffa500;">${canUseCheck.reason}</div>
            </div>
        `;
    }
    
    // СЕТКА БЛАГОСЛОВЕНИЙ
    const blessingsGridHTML = availableBlessings.length > 0 ? `
        <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="font-size: ${smallFontSize}px; color: #ffa500; margin-bottom: 6px; font-weight: bold;">Доступные благословения:</div>
            <div style="display: grid; grid-template-columns: repeat(${availableBlessings.length >= 3 ? 3 : 2}, 1fr); gap: 6px; flex: 1;">
                ${availableBlessings.map(blessing => `
                    <button style="
                        padding: 8px;
                        border: ${canUseCheck.canUse ? '1px solid rgba(114, 137, 218, 0.6)' : '1px solid rgba(100, 100, 100, 0.4)'};
                        border-radius: 6px;
                        background: ${canUseCheck.canUse ? 'rgba(114, 137, 218, 0.15)' : 'rgba(60, 60, 60, 0.15)'};
                        color: white;
                        cursor: ${canUseCheck.canUse ? 'pointer' : 'not-allowed'};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        opacity: ${canUseCheck.canUse ? '1' : '0.5'};
                    " ${canUseCheck.canUse ? `onclick="activateBlessing(${blessing.level})"` : 'disabled'}>
                        <span style="font-size: ${titleFontSize}px;">${blessing.icon}</span>
                        <div style="font-size: ${smallFontSize * 0.85}px; font-weight: bold; text-align: center; line-height: 1.2;">${blessing.name}</div>
                        <div style="font-size: ${smallFontSize * 0.7}px; opacity: 0.85; text-align: center; line-height: 1.2;">${blessing.description}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    ` : `
        <div style="text-align: center; padding: 20px; color: #aaa; font-size: ${smallFontSize}px;">
            Улучшите башню чтобы открыть благословения
        </div>
    `;
    
    // КНОПКА УЛУЧШЕНИЯ
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('blessing_tower', towerLevel + 1) : 144 * (towerLevel + 1);
    
    const upgradeButton = towerLevel < maxTowerLevel ? `
        <button style="width: 100%; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid rgba(255, 215, 0, 0.6); border-radius: 6px; background: rgba(255, 215, 0, 0.15); color: white; cursor: pointer; backdrop-filter: blur(3px); font-weight: bold;"
            onclick="showBlessingUpgradeConfirm(${towerLevel}, ${upgradeTime})">
            ⬆️ Улучшить башню ${towerLevel}→${towerLevel + 1}<br>
            <span style="font-size: ${smallFontSize * 0.85}px;">⏱️ ${window.formatTimeCurrency(upgradeTime)}</span>
        </button>
    ` : `
        <div style="text-align: center; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); color: #4ade80;">
            ✅ Максимальный уровень достигнут!
        </div>
    `;
    
    // Заполняем контейнер
    contentContainer.innerHTML = `
        ${activeBlessingHTML}
        ${blessingsGridHTML}
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
            onclick="closeBlessingTowerModalBg()">
            ❌ Закрыть
        </button>
    `;
    
    overlay.appendChild(footerContainer);
    
    // Стили скроллбара
    const style = document.createElement('style');
    style.textContent = `
        #blessing-ui-overlay *::-webkit-scrollbar {
            width: 6px;
        }
        #blessing-ui-overlay *::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        #blessing-ui-overlay *::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.5);
            border-radius: 3px;
        }
        #blessing-ui-overlay *::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.7);
        }
    `;
    document.head.appendChild(style);
}

// Показать экран подтверждения апгрейда башни благословенияи
function showBlessingUpgradeConfirm(currentLevel, upgradeTime) {
    const contentContainer = document.querySelector('#blessing-ui-overlay > div:nth-child(2)');
    const overlay = document.getElementById('blessing-ui-overlay');
    
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
    
    // Получаем информацию о новом благословении
    const nextLevel = currentLevel + 1;
    const newBlessing = window.BLESSING_TOWER_CONFIG?.BLESSINGS?.[nextLevel];
    const bonusInfo = newBlessing ? 
        `${newBlessing.icon} ${newBlessing.name}\n${newBlessing.description}` :
        `Доступ к благословениям ${nextLevel} уровня`;
    
    // Контентная область (поднята выше)
    const contentArea = {
        x: 115 * scaleX,
        y: 75 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 75) * scaleY
    };

    // Создаем контейнер подтверждения
    const confirmContainer = document.createElement('div');
    confirmContainer.id = 'blessing-upgrade-confirm';
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
                Улучшить башню благословения<br>
                <span style="color: #7289da; font-weight: bold;">${currentLevel} → ${nextLevel} ур.</span>
            </p>
            
            ${newBlessing ? `
                <div style="background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); padding: 8px; border-radius: 6px; margin: 8px 0;">
                    <div style="font-size: ${smallFontSize}px; color: #ffd700; margin-bottom: 4px;">
                        Новое благословение:
                    </div>
                    <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold; margin-bottom: 4px;">
                        ${newBlessing.icon} ${newBlessing.name}
                    </div>
                    <div style="font-size: ${smallFontSize * 0.9}px; color: #aaa;">
                        ${newBlessing.description}
                    </div>
                </div>
            ` : `
                <div style="background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); padding: 6px; border-radius: 6px; margin: 8px 0;">
                    <div style="font-size: ${smallFontSize}px; color: #ffd700; margin-bottom: 2px;">
                        Новый бонус:
                    </div>
                    <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold;">
                        ${bonusInfo}
                    </div>
                </div>
            `}
            
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
                    onclick="confirmBlessingUpgrade(${nextLevel})">
                    ✅ Да
                </button>
                <button style="padding: 8px 20px; font-size: ${baseFontSize}px; border: 2px solid rgba(255, 107, 107, 0.6); border-radius: 8px; background: rgba(255, 107, 107, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="cancelBlessingUpgrade()">
                    ❌ Нет
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(confirmContainer);
}

// Подтвердить апгрейд башни благословенияи
async function confirmBlessingUpgrade(targetLevel) {
    // Закрываем окно башни благословенияи
    closeBlessingTowerModalBg();
    
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
        window.startBuilding('blessing_tower', true); // true означает что это улучшение
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
function cancelBlessingUpgrade() {
    const confirmContainer = document.getElementById('blessing-upgrade-confirm');
    const contentContainer = document.querySelector('#blessing-ui-overlay > div:nth-child(2)');
    
    if (confirmContainer) {
        confirmContainer.remove();
    }
    
    if (contentContainer) {
        contentContainer.style.display = 'flex';
    }
}

// Закрыть окно башни благословенияи
function closeBlessingTowerModalBg() {
    const screen = document.getElementById('blessing-tower-screen');
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
window.showBlessingTowerModalBg = showBlessingTowerModalBg;
window.closeBlessingTowerModalBg = closeBlessingTowerModalBg;
window.showBlessingUpgradeConfirm = showBlessingUpgradeConfirm;
window.confirmBlessingUpgrade = confirmBlessingUpgrade;
window.cancelBlessingUpgrade = cancelBlessingUpgrade;

