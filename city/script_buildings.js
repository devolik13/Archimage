// script_buildings.js - Работа со зданиями...
console.log('✅ script_buildings.js загружен');

// Модальное окно PvP арены
function showPvPArenaModal() {
    // Закрываем предыдущие модальные окна
    closeCurrentModal();
    // Проверяем построена ли арена
    const hasArena = window.userData?.buildings?.pvp_arena?.level > 0;
    const battleButtonOnClick = hasArena
    	? "if (!checkFormationBeforeBattle()) return; closePvPArenaModal(); window.showOpponentSelection()"
    	: "alert('⚠️ Постройте Арену чтобы участвовать в PvP боях!')";
    const modalContent = `
    	<div class="building-modal-content" style="max-width: 350px;">
    	    <h3 class="building-modal-header">⚔️ PvP Арена</h3>
    	    <div class="building-modal-body">
    	        <p style="margin: 0 0 12px 0; font-size: 12px;">Добро пожаловать на арену! Здесь вы можете сражаться с другими магами.</p>

    	        <div class="arena-buttons-grid">
    	            <button class="building-button primary"
    	                    onclick="window.showBattleSetup()">
    	                🎯 Расставить войска
    	            </button>
    	            <button class="building-button secondary"
    	                    onclick="${battleButtonOnClick}"
    	                    ${hasArena ? '' : 'disabled'}>
    	                ⚔️ В бой (PvP) ${hasArena ? '' : '🔒'}
    	            </button>
    	            <button class="building-button" style="background: #FFD700; color: #333;"
    	                    onclick="closePvPArenaModal(); window.showLeaderboard()">
    	                🏆 Рейтинг
    	            </button>
    	            <button class="building-button" style="background: #4CAF50; color: white;"
    	                    onclick="closePvPArenaModal(); window.showAdventureMenu()">
    	                🗺️ Приключения (PvE)
    	            </button>
    	        </div>

    	        ${!hasArena ? '<p class="arena-warning">⚠️ Постройте Арену для PvP боёв</p>' : ''}
    	    </div>

    	    <div class="building-modal-footer">
    	        <button class="building-button close" style="width: 100%;"
    	                onclick="closePvPArenaModal()">
    	            ❌ Закрыть
    	        </button>
    	    </div>
    	</div>
    `;
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'pvp-arena-modal-container';
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 12px; z-index: 1000; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);';
    const overlay = document.createElement('div');
    overlay.id = 'pvp-arena-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999;';
    overlay.onclick = closePvPArenaModal;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}

function closePvPArenaModal() {
    // Удаляем overlay и modal
    const modal = document.getElementById('pvp-arena-modal-container');
    const overlay = document.getElementById('pvp-arena-overlay');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    window.currentModal = null;
}

// Модалка башни магов с отображением бонусов
function showWizardHireModal() {
    closeAllModals();
    const wizards = userData.wizards || [];
    const maxWizards = 5;
    const constructions = window.userData?.constructions || [];
    const activeHire = constructions.find(c => c.type === 'wizard' && c.time_remaining > 0);
    let wizardsListHTML = '';

    if (activeHire) {
        wizardsListHTML += `
            <div class="wizard-list-item hiring"
                 onclick="showConstructionModal(${constructions.indexOf(activeHire)})">
                <strong>🔨 Найм мага ${activeHire.wizard_index}</strong>
                <div style="font-size: 9px; color: #ffa500;">⏱️ ${window.formatTimeCurrency(activeHire.time_remaining)}</div>
            </div>
        `;
    }

    wizards.forEach((wizard, index) => {
        wizardsListHTML += `
            <div class="wizard-list-item">
                <div>
                    <strong>🧙‍♂️ ${wizard.name}</strong>
                    <div style="font-size: 9px; color: #aaa;">HP: ${wizard.hp}/${wizard.max_hp} | AR: ${wizard.armor}/${wizard.max_armor}</div>
                </div>
                <div style="font-size: 10px; color: #7289da;">Ур.${wizard.level || 1}</div>
            </div>
        `;
    });

    const canHire = wizards.length < maxWizards && !activeHire;
    const hireTime = window.WIZARD_HIRE_TIME?.getHireTime ? window.WIZARD_HIRE_TIME.getHireTime(wizards.length) : 0;
    const hireButton = canHire ?
        `<button class="building-button primary" style="width: 100%;"
            onclick="hireNewWizard()">
            ✅ Нанять мага ${hireTime > 0 ? `<span style="font-size: 9px;">(⏱️ ${window.formatTimeCurrency(hireTime)})</span>` : ''}
        </button>` :
        `<div style="text-align: center; color: #aaa; padding: 6px; font-size: 11px;">Лимит: ${maxWizards}</div>`;

    const towerLevel = (userData.buildings?.wizard_tower?.level || 1);
    const maxTowerLevel = getBuildingMaxLevel('wizard_tower');
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('wizard_tower', towerLevel + 1) : 144 * (towerLevel + 1);
    const upgradeButton = towerLevel < maxTowerLevel ?
        `<button class="building-button secondary" style="width: 100%;"
            onclick="upgradeWizardTower()">
            ⬆️ Башня ${towerLevel}→${towerLevel + 1} <span style="font-size: 9px;">(⏱️ ${window.formatTimeCurrency(upgradeTime)})</span>
        </button>` :
        `<div style="text-align: center; color: #777; padding: 6px; font-size: 11px;">✅ Макс. уровень</div>`;

    const healthBonus = window.applyWizardTowerHealthBonus ? Math.round((window.applyWizardTowerHealthBonus() - 1) * 100) : 0;
    const damageBonus = window.getWizardTowerDamageBonus ? Math.round((window.getWizardTowerDamageBonus() - 1) * 100) : 0;
    const towerBonusHTML = (healthBonus > 0 || damageBonus > 0) ? `
        <div class="wizard-tower-bonus-box">
            <div class="wizard-tower-bonus-title">🏰 Бонусы башни</div>
            <div class="wizard-tower-bonus-grid">
                ${healthBonus > 0 ? `<div style="background: #4ade8020; padding: 4px 8px; border-radius: 4px;">❤️ +${healthBonus}%</div>` : ''}
                ${damageBonus > 0 ? `<div style="background: #ff6b6b20; padding: 4px 8px; border-radius: 4px;">⚔️ +${damageBonus}%</div>` : ''}
            </div>
        </div>
    ` : '';

    const modalContent = `
        <div class="building-modal-content" style="max-width: 550px;">
            <h3 class="building-modal-header">🧙‍♂️ Башня магов (${towerLevel}/${maxTowerLevel})</h3>

            <div class="building-modal-body">
                <div class="building-two-column-layout">
                    <!-- ЛЕВАЯ: Башня -->
                    <div class="building-left-column">
                        ${towerBonusHTML}
                        ${upgradeButton}
                    </div>

                    <!-- ПРАВАЯ: Маги -->
                    <div class="building-right-column">
                        <p style="margin: 0 0 4px 0; font-size: 11px;">Маги (${wizards.length}/${maxWizards}):</p>
                        <div class="wizard-list-container">
                            ${wizardsListHTML || '<div style="text-align: center; color: #aaa; padding: 10px; font-size: 10px;">Нет магов</div>'}
                        </div>
                        ${hireButton}
                    </div>
                </div>
            </div>

            <div class="building-modal-footer">
                <button class="building-button close" style="width: 100%;"
                    onclick="closeCurrentModal()">❌ Закрыть</button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'wizard-hire-modal';
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
    const overlay = document.createElement('div');
    overlay.id = 'wizard-hire-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999;';
    overlay.onclick = closeCurrentModal;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}

// Найм мага - ИСПРАВЛЕННАЯ ВЕРСИЯ (полностью заменить функцию)
async function hireNewWizard() {
    const wizards = userData.wizards || [];
    const maxWizards = 5;
    if (wizards.length >= maxWizards) {
        showNotification('Достигнут лимит магов!');
        return;
    }
    // Проверяем активные стройки
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        showNotification('⚠️ Нельзя нанимать мага пока идет строительство!');
        return;
    }
    // ВСЕ наймы идут только через систему времени
    if (typeof window.startWizardHire === 'function') {
        const success = await window.startWizardHire(wizards.length);
        if (success) {
            // Найм запущен через систему конструкций
            closeAllModals();
            showNotification('🧙‍♂️ Начат найм мага');
            setTimeout(() => showWizardHireModal(), 100);
        } else {
            // Ошибка при запуске найма
            showNotification('❌ Не удалось начать найм');
        }
    } else {
        console.error('❌ startWizardHire не найдена!');
        showNotification('❌ Ошибка системы найма');
    }
}

// Начать строительство
async function selectBuildingToBuild(buildingId, cellIndex) {
    closeCurrentModal();
    // Проверяем активные конструкции ДО начала строительства
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c => 
            (c.type === 'building' || c.type === 'wizard') && 
            c.time_remaining > 0
        );
        if (activeConstruction) {
            if (activeConstruction.type === 'wizard') {
                showNotification('⚠️ Нельзя строить пока идет найм мага!');
            } else if (activeConstruction.is_upgrade) {
                showNotification('⚠️ Нельзя строить пока идет улучшение!');
            } else {
                showNotification('⚠️ Можно строить только одно здание одновременно!');
            }
        }
        return;
    }
    if (!userId) {
        showNotification('❌ Ошибка: Не удалось получить ID пользователя.');
        return;
    }
    // Запускаем строительство через систему времени
    if (typeof window.startConstruction === 'function') {
        const success = await window.startConstruction(buildingId, cellIndex, false, 1);
        if (success) {
            showNotification(`🔨 Начато строительство ${getBuildingsConfig()[buildingId].name}`);
        }
        return;
    }
    // Старый код для обратной совместимости
    try {
        const response = await fetch(`${API_BASE_URL}/api/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                building_id: buildingId,
                cell_index: cellIndex
            })
        });
        const result = await response.json();
        if (result.success) {
            userData.buildings = result.updated_buildings;
            if (typeof window.updatePlayerLevel === 'function') {
                window.updatePlayerLevel();
            }
            showNotification(result.message);
        } else {
            showNotification(`❌ Ошибка: ${result.error || "Неизвестная ошибка"}`);
        }
    } catch (error) {
        console.error('Ошибка при постройке:', error);
        showNotification('❌ Ошибка сети при попытке построить здание.');
    }
}

// Модалка улучшения
function showUpgradeModal(buildingId, currentLevel, maxLevel) {
    const buildingConfig = getBuildingsConfig()[buildingId];
    const nextLevel = currentLevel + 1;
    const previewImage = buildingConfig.image || buildingConfig.emoji || '🏛️';
    // Получаем время улучшения
    const upgradeTime = CONSTRUCTION_TIME.getUpgradeTime ?
        CONSTRUCTION_TIME.getUpgradeTime(buildingId, nextLevel) :
        144 * nextLevel; // Fallback
    const modalContent = `
        <div class="building-modal-content" style="max-width: 380px;">
            <h3 class="building-modal-header" style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                ${previewImage}
                🔧 Улучшение
            </h3>
            <div class="building-modal-body">
                <p style="margin: 0 0 15px 0;">Вы хотите улучшить <strong>${buildingConfig.name}</strong> до уровня ${nextLevel}?</p>
                <div class="upgrade-info-box">
                    <div class="upgrade-info-row">
                        <span>Текущий уровень:</span>
                        <span style="color: #7289da;">${currentLevel}</span>
                    </div>
                    <div class="upgrade-info-row">
                        <span>Новый уровень:</span>
                        <span style="color: #4ade80;">${nextLevel}</span>
                    </div>
                    <hr class="upgrade-divider">
                    <div class="upgrade-info-row">
                        <span>⏱️ Время улучшения:</span>
                        <span style="color: #ffa500;">${window.formatTimeCurrency(upgradeTime)}</span>
                    </div>
                </div>
            </div>
            <div class="building-modal-footer">
                <button class="building-button primary" style="width: 100%; margin-bottom: 8px;"
                    onclick="confirmUpgrade('${buildingId}', ${nextLevel})">
                    ✅ Улучшить
                </button>
                <button class="building-button close" style="width: 100%;"
                    onclick="closeCurrentModal()">
                    ❌ Отмена
                </button>
            </div>
        </div>
    `;
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 12px; z-index: 1000;';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999;';
    overlay.onclick = closeCurrentModal;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}

// Подтвердить улучшение
async function confirmUpgrade(buildingId, targetLevel) {
    closeCurrentModal();
    // Проверяем активные конструкции
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c => 
            (c.type === 'building' || c.type === 'wizard') && 
            c.time_remaining > 0
        );
        if (activeConstruction) {
            if (activeConstruction.type === 'wizard') {
                showNotification('⚠️ Нельзя улучшать пока идет найм мага!');
            } else if (activeConstruction.is_upgrade) {
                showNotification('⚠️ Уже идет улучшение другого здания!');
            } else {
                showNotification('⚠️ Нельзя улучшать пока идет строительство!');
            }
        }
        return;
    }
    // Используем функцию startBuilding с флагом улучшения
    if (window.startBuilding) {
        window.startBuilding(buildingId, true); // true означает что это улучшение
        return;
    }
    // Запускаем улучшение через систему времени
    if (typeof window.startConstruction === 'function') {
        const success = await window.startConstruction(buildingId, null, true, targetLevel);
        if (success) {
            showNotification(`🔨 Начато улучшение до уровня ${targetLevel}`);
        }
        return;
    }
    // Старый код для обратной совместимости
    const currentLevel = userData.buildings?.[buildingId]?.level || 1;
    if (targetLevel <= currentLevel) {
        showNotification('❌ Уровень уже достигнут или выше!');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                building_id: buildingId,
                target_level: targetLevel
            })
        });
        const result = await response.json();
        if (result.success) {
            if (!userData.buildings[buildingId]) {
                userData.buildings[buildingId] = {
                    building_id: buildingId,
                    level: 1
                };
            }
            userData.buildings[buildingId].level = targetLevel;
            if (typeof window.updatePlayerLevel === 'function') {
                window.updatePlayerLevel();
            }
            showNotification(result.message);
        } else {
            showNotification(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при улучшении:", error);
        showNotification("❌ Ошибка сети при улучшении здания.");
    }
}

// Улучшение башни магов
async function upgradeWizardTower() {
    const currentLevel = userData.buildings?.wizard_tower?.level || 1;
    const maxLevel = getBuildingMaxLevel('wizard_tower');
    if (currentLevel >= maxLevel) {
        showNotification(`⚠️ Башня магов уже максимального уровня (${maxLevel})`);
        return;
    }
    const nextLevel = currentLevel + 1;
    closeAllModals();
    // Используем нашу функцию startBuilding с флагом улучшения
    if (window.startBuilding) {
        window.startBuilding('wizard_tower', true);
    }
}

// Модалка кузницы
function showForgeModal() {
    closeAllModals();
    const forgeLevel = getBuildingLevel('forge');
    const canCreateArmor = forgeLevel >= 1;
    let contentHTML = '';
    if (!canCreateArmor) {
        contentHTML = '<p style="color: #aaa; text-align: center;">Кузница ещё не построена</p>';
    } else {
        contentHTML = `
            <p style="margin: 0 0 15px 0;">Уровень кузницы: ${forgeLevel}</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="building-button primary"
                        onclick="showNotification('Система брони в разработке')">
                    ⚔️ Создать броню
                </button>
                <button class="building-button secondary"
                        onclick="showNotification('Система улучшения в разработке')">
                    📈 Улучшить броню
                </button>
            </div>
        `;
    }
    const modalContent = `
        <div class="building-modal-content" style="max-width: 380px;">
            <h3 class="building-modal-header">⚒️ Кузница</h3>
            <div class="building-modal-body">
                ${contentHTML}
            </div>
            <div class="building-modal-footer">
                <button class="building-button close" style="width: 100%;"
                        onclick="closeCurrentModal()">
                    ❌ Закрыть
                </button>
            </div>
        </div>
    `;
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 12px; z-index: 1000;';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999;';
    overlay.onclick = closeCurrentModal;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}

// Уведомления
function showNotification(message) {
    const oldNotif = document.getElementById('game-notification');
    if (oldNotif) oldNotif.remove();
    const notification = document.createElement('div');
    notification.id = 'game-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c2c3d;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        ">
            ${message}
        </div>
    `;
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Вспомогательные функции
function getBuildingMaxLevel(buildingId) {
    const maxLevels = {
        "library": 1,
        "wizard_tower": 10,
        "blessing_tower": 5,
        "time_generator": 20,
        "pvp_arena": 1,
        "forge": 10,
        "arcane_lab": 15
    };
    return maxLevels[buildingId] || 1;
}

function getBuildingName(buildingId) {
    const config = getBuildingsConfig()[buildingId];
    return config ? config.name : buildingId;
}

function getBuildingLevel(buildingId) {
    return userData?.buildings?.[buildingId]?.level || 0;
}

function showArcaneLabModal() {
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }
    const labLevel = window.getBuildingLevel('arcane_lab');
    const maxLevel = window.getBuildingMaxLevel('arcane_lab');
    const currentBonus = Math.min(labLevel * 2, 30); // максимум 30%
    const nextBonus = Math.min((labLevel + 1) * 2, 30);
    const modalContent = `
        <div class="building-modal-content" style="max-width: 420px;">
            <h3 class="building-modal-header">🧪 Арканская лаборатория</h3>
            <div class="building-modal-body">
                <p style="color: #aaa; margin: 0 0 15px 0;">Уровень: ${labLevel}/${maxLevel}</p>
                <div class="arcane-lab-bonus-box">
                    <h4 class="arcane-lab-bonus-title">Бонус к скорости изучения</h4>
                    <div class="arcane-lab-bonus-value">
                        -${currentBonus}%
                    </div>
                    <div class="arcane-lab-bonus-description">
                        времени на изучение заклинаний
                    </div>
                    ${labLevel < maxLevel && currentBonus < 30 ? `
                        <div class="arcane-lab-next-level">
                            Следующий уровень: -${nextBonus}%
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="building-modal-footer">
                ${labLevel < maxLevel ? `
                    <button class="building-button primary" style="width: 100%; margin-bottom: 8px;"
                        onclick="confirmUpgrade('arcane_lab', ${labLevel + 1})">
                        ⬆️ Улучшить до уровня ${labLevel + 1}
                    </button>
                ` : `
                    <div style="text-align: center; color: #4ade80; padding: 10px; margin-bottom: 8px;">
                        ✅ Максимальный уровень достигнут!
                    </div>
                `}
                <button class="building-button close" style="width: 100%;"
                    onclick="closeCurrentModal()">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    if (typeof window.showModal === 'function') {
        window.showModal(modalContent);
    }
}

function showTimeGeneratorModal() {
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    const generatorLevel = window.getBuildingLevel('time_generator');
    const maxLevel = window.getBuildingMaxLevel('time_generator');

    // Расчет производства и хранилища
    // Базовая формула: производство = 60 + (уровень - 1) * 30 мин/час
    // Хранилище = 1440 + (уровень - 1) * 720 минут (1 день + 12 часов за уровень)
    const production = generatorLevel > 0 ? 60 + (generatorLevel - 1) * 30 : 0;
    const storage = generatorLevel > 0 ? 1440 + (generatorLevel - 1) * 720 : 0;

    // Рассчитываем следующий уровень
    const nextProduction = generatorLevel < maxLevel ?
        60 + generatorLevel * 30 : production;
    const nextStorage = generatorLevel < maxLevel ?
        1440 + generatorLevel * 720 : storage;

    // Получаем время для следующего улучшения
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('time_generator', generatorLevel + 1) :
        144 * (generatorLevel + 1);

    const modalContent = `
        <div class="building-modal-content" style="max-width: 750px;">
            <h3 class="building-modal-header">⏱️ Генератор Времени</h3>
            <div class="building-modal-body">
                <p style="color: #aaa; margin: 0 0 15px 0;">Уровень: ${generatorLevel}/${maxLevel}</p>

                <!-- Горизонтальная сетка блоков -->
                <div class="time-generator-grid">

                    <!-- Производство -->
                    <div class="time-stat-box">
                        <h4 class="time-stat-title" style="color: #4ade80;">⚡ Производство</h4>
                        <div class="time-stat-value" style="color: #ffa500;">
                            +${production} мин/час
                        </div>
                        <div class="time-stat-description">
                            временной валюты в час
                        </div>
                        ${generatorLevel < maxLevel ? `
                            <div class="time-stat-next">
                                След. ур: +${nextProduction} мин/час
                            </div>
                        ` : ''}
                    </div>

                    <!-- Хранилище -->
                    <div class="time-stat-box">
                        <h4 class="time-stat-title" style="color: #00bcd4;">📦 Хранилище</h4>
                        <div class="time-stat-value" style="color: #00bcd4; font-size: 20px;">
                            ${window.formatTimeCurrency(storage)}
                        </div>
                        <div class="time-stat-description">
                            максимальная вместимость
                        </div>
                        ${generatorLevel < maxLevel ? `
                            <div class="time-stat-next">
                                След. ур: ${window.formatTimeCurrency(nextStorage)}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Текущий баланс -->
                    <div class="time-stat-box">
                        <h4 class="time-stat-title" style="color: #ffa500;">💰 Баланс</h4>
                        <div class="time-stat-value" style="color: #ffa500; font-size: 20px;">
                            ${window.formatTimeCurrency(window.getTimeCurrency ? window.getTimeCurrency() : 0)}
                        </div>
                        <button class="building-button success" style="width: 100%; margin-top: 8px; font-size: 11px;"
                            onclick="if(window.collectTime) { window.collectTime(); closeCurrentModal(); showTimeGeneratorModal(); }">
                            💰 Собрать
                        </button>
                    </div>

                </div>
            </div>

            <div class="building-modal-footer">
                ${generatorLevel < maxLevel ? `
                    <button class="building-button warning" style="width: 100%; margin-bottom: 8px;"
                        onclick="confirmUpgrade('time_generator', ${generatorLevel + 1})">
                        ⬆️ Улучшить до уровня ${generatorLevel + 1}
                        <div style="font-size: 11px; margin-top: 3px; opacity: 0.9;">
                            ⏱️ ${window.formatTimeCurrency(upgradeTime)}
                        </div>
                    </button>
                ` : `
                    <div style="text-align: center; color: #4ade80; padding: 10px; margin-bottom: 8px;">
                        ✅ Максимальный уровень достигнут!
                    </div>
                `}
                <button class="building-button close" style="width: 100%;"
                    onclick="closeCurrentModal()">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    if (typeof window.showModal === 'function') {
        window.showModal(modalContent);
    }
}
// Проверка расстановки перед боем
function checkFormationBeforeBattle() {
    const formation = window.userData?.formation || [null, null, null, null, null];
    const hasWizards = formation.some(wizardId => wizardId !== null);
    
    if (!hasWizards) {
        if (window.showNotification) {
            window.showNotification('⚠️ Расставь войска и выбери заклинания!', 'warning');
        } else {
            alert('⚠️ Расставь войска и выбери заклинания!');
        }
        return false;
    }
    
    return true;
}

window.checkFormationBeforeBattle = checkFormationBeforeBattle;
// Экспортируем функцию в window
window.showTimeGeneratorModal = showTimeGeneratorModal;

// Экспорт функций
window.showPvPArenaModal = showPvPArenaModal;
window.closePvPArenaModal = closePvPArenaModal;
window.selectBuildingToBuild = selectBuildingToBuild;
window.showUpgradeModal = showUpgradeModal;
window.confirmUpgrade = confirmUpgrade;
window.getBuildingMaxLevel = getBuildingMaxLevel;
window.getBuildingName = getBuildingName;
window.getBuildingLevel = getBuildingLevel;
window.showWizardHireModal = showWizardHireModal;
window.hireNewWizard = hireNewWizard;
window.showForgeModal = showForgeModal;
window.upgradeWizardTower = upgradeWizardTower;
window.showNotification = showNotification;
window.showArcaneLabModal = showArcaneLabModal;