// wizard-tower-modal-bg.js - Башня магов с фоновым изображением

// Показать окно башни магов с фоном
function showWizardTowerModalBg() {
    console.log('🧙‍♂️ Открытие башни магов с фоном');

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
    const existingScreen = document.getElementById('wizard-tower-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'wizard-tower-screen';
    screen.className = 'wizard-tower-screen active';
    
    // Создаем HTML структуру
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="tower-bg-image" src="${imagePath}" alt="Башня магов">
            <div class="tower-ui-overlay" id="tower-ui-overlay"></div>
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
    
    const img = document.getElementById('tower-bg-image');
    
    // Настройка UI после загрузки изображения
    img.onload = () => setupTowerUI();
    if (img.complete) setupTowerUI();
    
    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон башни, используем стандартное окно');
        screen.remove();
        if (typeof showWizardHireModal === 'function') {
            showWizardHireModal();
        }
    };
}

// Настройка UI башни магов
function setupTowerUI() {
    const img = document.getElementById('tower-bg-image');
    const overlay = document.getElementById('tower-ui-overlay');
    
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
    const wizards = window.userData?.wizards || [];
    const maxWizards = 5;
    const towerLevel = window.userData?.buildings?.wizard_tower?.level || 1;
    const maxTowerLevel = typeof getBuildingMaxLevel === 'function' ? getBuildingMaxLevel('wizard_tower') : 10;
    
    // Проверяем активный найм
    const constructions = window.userData?.constructions || [];
    const activeHire = constructions.find(c => c.type === 'wizard' && c.time_remaining > 0);
    
    // Бонусы башни
    const healthBonus = window.applyWizardTowerHealthBonus ? Math.round((window.applyWizardTowerHealthBonus() - 1) * 100) : 0;
    const damageBonus = window.getWizardTowerDamageBonus ? Math.round((window.getWizardTowerDamageBonus() - 1) * 100) : 0;
    
    // Адаптивные размеры шрифтов
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
                🧙‍♂️ Башня магов (${towerLevel}/${maxTowerLevel})
            </h3>
            <div style="font-size: ${baseFontSize}px; color: #7289da; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                Маги: ${wizards.length}/${maxWizards}
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
    
    // Генерируем список магов
    let wizardsListHTML = '';
    
    if (activeHire) {
        wizardsListHTML += `
            <div style="background: rgba(85, 85, 119, 0.2); backdrop-filter: blur(3px); padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; cursor: pointer; font-size: ${smallFontSize}px; border: 1px solid rgba(114, 137, 218, 0.5);"
                 onclick="showConstructionModal(${constructions.indexOf(activeHire)})">
                <strong>🔨 Найм мага ${activeHire.wizard_index}</strong>
                <div style="font-size: ${smallFontSize * 0.9}px; color: #ffa500;">⏱️ ${window.formatTimeCurrency(activeHire.time_remaining)}</div>
            </div>
        `;
    }
    
    wizards.forEach((wizard, index) => {
        // Используем функцию из wizard-detail-screen.js для расчёта характеристик
        const stats = window.calculateWizardStats ? window.calculateWizardStats(wizard) : { actualMaxHP: wizard.max_hp || 100, actualMaxArmor: wizard.max_armor || 100 };
        
        wizardsListHTML += `
            <div style="background: rgba(61, 61, 92, 0.2); backdrop-filter: blur(3px); padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; font-size: ${smallFontSize}px; border: 1px solid rgba(114, 137, 218, 0.3); cursor: pointer; transition: background 0.2s;"
                onclick="if(window.showWizardDetailScreen && window.userData?.wizards?.[${index}]) window.showWizardDetailScreen(window.userData.wizards[${index}])"
                onmouseover="this.style.background='rgba(114, 137, 218, 0.3)'"
                onmouseout="this.style.background='rgba(61, 61, 92, 0.2)'">
                <div>
                    <strong>🧙‍♂️ ${wizard.name}</strong>
                    <div style="font-size: ${smallFontSize * 0.9}px; color: #aaa;">❤️ ${stats.actualMaxHP} | 🛡️ ${stats.actualMaxArmor}</div>
                </div>
                <div style="font-size: ${smallFontSize}px; color: #7289da;">Ур.${wizard.level || 1}</div>
            </div>
        `;
    });
    
    // Проверка требований уровня башни для найма
    const wizardIndex = wizards.length;
    const towerRequirements = { 0: 1, 1: 3, 2: 5, 3: 7, 4: 10 };
    const requiredLevel = towerRequirements[wizardIndex];
    const canHireByLevel = towerLevel >= requiredLevel;
    const canHire = wizards.length < maxWizards && !activeHire;
    const hireTime = window.WIZARD_HIRE_TIME?.getHireTime ? window.WIZARD_HIRE_TIME.getHireTime(wizards.length) : 0;
    
    // HTML бонусов башни
    const towerBonusHTML = (healthBonus > 0 || damageBonus > 0) ? `
        <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="flex: 1; background: rgba(74, 85, 104, 0.2); backdrop-filter: blur(3px); padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 165, 0, 0.3); display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: ${smallFontSize}px; color: #ffa500; margin-bottom: 6px; font-weight: bold; text-align: center;">🏰 Бонусы</div>
                <div style="display: flex; gap: 6px; font-size: ${smallFontSize * 0.9}px; justify-content: center; flex-wrap: wrap;">
                    ${healthBonus > 0 ? `<div style="background: rgba(74, 222, 128, 0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(74, 222, 128, 0.4);">❤️ +${healthBonus}%</div>` : ''}
                    ${damageBonus > 0 ? `<div style="background: rgba(255, 107, 107, 0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255, 107, 107, 0.4);">⚔️ +${damageBonus}%</div>` : ''}
                </div>
            </div>
        </div>
    ` : '';
    
    // Кнопка апгрейда башни (обернуть в flex контейнер)
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('wizard_tower', towerLevel + 1) : 144 * (towerLevel + 1);
    const upgradeButton = `
        <div style="flex: 1; display: flex;">
            ${towerLevel < maxTowerLevel ?
                `<button style="flex: 1; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid rgba(85, 85, 85, 0.6); border-radius: 6px; background: rgba(85, 85, 85, 0.15); color: white; cursor: pointer; backdrop-filter: blur(3px); font-weight: bold;"
                    onclick="showTowerUpgradeConfirm(${towerLevel}, ${upgradeTime})">
                    ⬆️ Башня ${towerLevel}→${towerLevel + 1}<br><span style="font-size: ${smallFontSize * 0.85}px;">⏱️ ${window.formatTimeCurrency(upgradeTime)}</span>
                </button>` :
                `<div style="flex: 1; text-align: center; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; color: #777;">✅ Макс. уровень</div>`
            }
        </div>
    `;
    
    // Кнопка найма (обернуть в flex контейнер)
    let hireButton;
    if (!canHire && wizards.length >= maxWizards) {
        hireButton = `<div style="flex: 1; display: flex;"><div style="flex: 1; text-align: center; color: #aaa; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center;">✅ Все маги наняты (${maxWizards}/${maxWizards})</div></div>`;
    } else if (!canHire && activeHire) {
        hireButton = `<div style="flex: 1; display: flex;"><div style="flex: 1; text-align: center; color: #ffa500; padding: 10px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center;">⏱️ Идет найм...</div></div>`;
    } else if (!canHireByLevel) {
        hireButton = `<div style="flex: 1; display: flex;"><button style="flex: 1; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid #555; border-radius: 6px; background: rgba(85, 85, 85, 0.15); color: #999; cursor: not-allowed; backdrop-filter: blur(3px);" disabled>
            🔒 ${wizardIndex + 1}-й маг<br><span style="font-size: ${smallFontSize * 0.85}px;">башня ${requiredLevel} ур</span>
        </button></div>`;
    } else {
        hireButton = `<div style="flex: 1; display: flex;"><button style="flex: 1; padding: 10px; font-size: ${smallFontSize}px; border: 1px solid rgba(114, 137, 218, 0.6); border-radius: 6px; background: rgba(114, 137, 218, 0.15); color: white; cursor: pointer; backdrop-filter: blur(3px); font-weight: bold;"
            onclick="hireNewWizard()">
            ✅ Нанять ${wizardIndex + 1}-го мага${hireTime > 0 ? `<br><span style="font-size: ${smallFontSize * 0.85}px;">⏱️ ${window.formatTimeCurrency(hireTime)}</span>` : ''}
        </button></div>`;
    }
    contentContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 40% 60%; gap: 10px; height: 100%; overflow: hidden;">
            <!-- ЛЕВАЯ: Башня (бонусы, улучшение, найм) -->
            <div style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; justify-content: space-between;">
                ${towerBonusHTML}
                ${upgradeButton}
                ${hireButton}
            </div>
            
            <!-- ПРАВАЯ: Только список магов -->
            <div style="overflow-y: auto; padding-right: 4px;">
                ${wizardsListHTML || `<div style="text-align: center; color: #aaa; padding: 15px; font-size: ${smallFontSize}px; background: rgba(0, 0, 0, 0.15); border-radius: 6px; backdrop-filter: blur(3px);">Нет магов</div>`}
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
            onclick="closeWizardTowerModalBg()">
            ❌ Закрыть
        </button>
    `;
    
    overlay.appendChild(footerContainer);
    const style = document.createElement('style');
    style.textContent = `
        #tower-ui-overlay *::-webkit-scrollbar {
            width: 6px;
        }
        #tower-ui-overlay *::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
        }
        #tower-ui-overlay *::-webkit-scrollbar-thumb {
            background: rgba(114, 137, 218, 0.5);
            border-radius: 3px;
        }
        #tower-ui-overlay *::-webkit-scrollbar-thumb:hover {
            background: rgba(114, 137, 218, 0.7);
        }
    `;
    document.head.appendChild(style);
}

// Показать экран подтверждения апгрейда башни
function showTowerUpgradeConfirm(currentLevel, upgradeTime) {
    const contentContainer = document.querySelector('#tower-ui-overlay > div:nth-child(2)');
    const overlay = document.getElementById('tower-ui-overlay');
    
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
    let bonusInfo = '';
    if (typeof window.getBuildingModalData === 'function') {
        const modalData = window.getBuildingModalData('wizard_tower', currentLevel, nextLevel, true);
        bonusInfo = modalData.levelInfo || '';
    }
    
    // Контентная область (поднята выше)
    const contentArea = {
        x: 115 * scaleX,
        y: 75 * scaleY,
        width: (655 - 115) * scaleX,
        height: (400 - 75) * scaleY
    };

    // Создаем контейнер подтверждения
    const confirmContainer = document.createElement('div');
    confirmContainer.id = 'tower-upgrade-confirm';
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
        gap: 15px;
    `;
    
    const timeText = typeof window.formatTimeCurrency === 'function' 
        ? window.formatTimeCurrency(upgradeTime) 
        : `${Math.floor(upgradeTime / 60)} мин`;
    
    confirmContainer.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); padding: 20px; border-radius: 12px; border: 2px solid rgba(255, 165, 0, 0.5); text-align: center; max-width: 85%;">
            <h3 style="margin: 0 0 12px 0; color: #FFD700; font-size: ${titleFontSize}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                ⚠️ Подтверждение улучшения
            </h3>
            <p style="margin: 0 0 8px 0; font-size: ${baseFontSize}px; color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">
                Улучшить башню магов<br>
                <span style="color: #7289da; font-weight: bold;">${currentLevel} → ${nextLevel} уровень</span>
            </p>
            
            ${bonusInfo ? `
                <div style="background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); padding: 10px; border-radius: 8px; margin: 10px 0;">
                    <div style="font-size: ${smallFontSize}px; color: #ffa500; margin-bottom: 4px; text-transform: uppercase;">
                        Новый бонус:
                    </div>
                    <div style="font-size: ${baseFontSize}px; color: #4ade80; font-weight: bold;">
                        ${bonusInfo}
                    </div>
                </div>
            ` : ''}
            
            <div style="background: rgba(255, 165, 0, 0.15); border: 1px solid rgba(255, 165, 0, 0.4); padding: 8px; border-radius: 6px; margin-bottom: 12px;">
                <div style="font-size: ${smallFontSize}px; color: #aaa; margin-bottom: 3px;">
                    Время улучшения:
                </div>
                <div style="font-size: ${baseFontSize}px; color: #ffa500; font-weight: bold;">
                    ⏱️ ${timeText}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button style="padding: 10px 25px; font-size: ${baseFontSize}px; border: 2px solid rgba(74, 222, 128, 0.6); border-radius: 8px; background: rgba(74, 222, 128, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="confirmTowerUpgrade(${nextLevel})">
                    ✅ Да
                </button>
                <button style="padding: 10px 25px; font-size: ${baseFontSize}px; border: 2px solid rgba(255, 107, 107, 0.6); border-radius: 8px; background: rgba(255, 107, 107, 0.3); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(3px);"
                    onclick="cancelTowerUpgrade()">
                    ❌ Нет
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(confirmContainer);
}

// Подтвердить апгрейд башни
async function confirmTowerUpgrade(targetLevel) {
    // Закрываем окно башни
    closeWizardTowerModalBg();
    
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
        window.startBuilding('wizard_tower', true); // true означает что это улучшение
        return;
    }
    
    // Альтернативный метод через систему конструкций
    if (typeof window.startConstruction === 'function') {
        const success = await window.startConstruction('wizard_tower', null, true, targetLevel);
        if (success) {
            showNotification(`🔨 Начато улучшение до уровня ${targetLevel}`);
        }
        return;
    }
    
    // Если ничего не сработало
    showNotification('❌ Ошибка системы строительства');
}

// Отменить апгрейд - вернуться к основному меню
function cancelTowerUpgrade() {
    const confirmContainer = document.getElementById('tower-upgrade-confirm');
    const contentContainer = document.querySelector('#tower-ui-overlay > div:nth-child(2)');
    
    if (confirmContainer) {
        confirmContainer.remove();
    }
    
    if (contentContainer) {
        contentContainer.style.display = 'flex';
    }
}

// Закрыть окно башни магов
function closeWizardTowerModalBg() {
    const screen = document.getElementById('wizard-tower-screen');
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
window.showWizardTowerModalBg = showWizardTowerModalBg;
window.closeWizardTowerModalBg = closeWizardTowerModalBg;
window.showTowerUpgradeConfirm = showTowerUpgradeConfirm;
window.confirmTowerUpgrade = confirmTowerUpgrade;
window.cancelTowerUpgrade = cancelTowerUpgrade;

console.log('🧙‍♂️ Башня магов с фоном готова');