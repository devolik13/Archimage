// script_buildings.js - Работа со зданиями...
console.log('✅ script_buildings.js загружен');

// Модальное окно PvP арены
function showPvPArenaModal() {
    // Закрываем предыдущие модальные окна
    closeCurrentModal();

    // Проверяем построена ли арена
    const hasArena = window.userData?.buildings?.pvp_arena?.level > 0;

    // Получаем данные энергии боев
    let battleEnergyInfo = '';
    if (typeof window.regenerateBattleEnergy === 'function') {
        window.regenerateBattleEnergy();
    }

    if (window.userData?.battle_energy) {
        const current = window.userData.battle_energy.current;
        const max = window.userData.battle_energy.max;
        const timeToNext = typeof window.getTimeToNextRegen === 'function' ? window.getTimeToNextRegen() : 0;

        let regenText = '';
        if (current < max && timeToNext > 0 && typeof window.formatTimeCurrency === 'function') {
            const totalMinutes = Math.ceil(timeToNext / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            regenText = hours > 0 ? ` (след. через ${hours}ч ${minutes}м)` : ` (след. через ${minutes}м)`;
        }

        const color = current > 0 ? '#4ade80' : '#ff6b6b';
        battleEnergyInfo = `
            <div style="background: #3d3d5c; padding: 10px; border-radius: 6px; margin-bottom: 12px; text-align: center;">
                <div style="font-size: 14px; color: ${color}; font-weight: bold;">
                    ⚡ Попытки боев: ${current}/${max}${regenText}
                </div>
                <div style="font-size: 11px; color: #aaa; margin-top: 4px;">
                    Каждые 2 часа восстанавливается 1 попытка
                </div>
            </div>
        `;
    }

    // Стили для кнопки "В бой"
    const battleButtonStyle = hasArena
        ? "padding: 12px; border: none; border-radius: 6px; background: #555; color: white; cursor: pointer; font-size: 16px;"
        : "padding: 12px; border: none; border-radius: 6px; background: #333; color: #666; cursor: not-allowed; font-size: 16px; opacity: 0.5;";
    const battleButtonOnClick = hasArena
    	? "if (!checkFormationBeforeBattle()) return; closePvPArenaModal(); window.showOpponentSelection()"
    	: "alert('⚠️ Постройте Арену чтобы участвовать в PvP боях!')";
    const modalContent = `
    	<div style="padding: 12px; max-width: 320px; background: #2c2c3d; border-radius: 8px; color: white;">
    	    <h3 style="margin: 0 0 8px 0; color: #7289da; font-size: 18px;">⚔️ PvP Арена</h3>
    	    <p style="margin: 0 0 12px 0; font-size: 12px;">Добро пожаловать на арену! Здесь вы можете сражаться с другими магами.</p>

    	    ${battleEnergyInfo}

    	    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
    	        <button style="padding: 10px 8px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer; font-size: 14px;"
    	                onclick="window.showBattleSetup()">
    	            🎯 Расставить войска
    	        </button>
    	        <button style="${battleButtonStyle.replace('padding: 12px', 'padding: 10px 8px').replace('font-size: 16px', 'font-size: 14px')}"
    	                onclick="${battleButtonOnClick}"
    	                ${hasArena ? '' : 'disabled'}>
    	            ⚔️ В бой (PvP) ${hasArena ? '' : '🔒'}
    	        </button>
    	        <button style="padding: 10px 8px; border: none; border-radius: 6px; background: #FFD700; color: #333; cursor: pointer; font-size: 14px; font-weight: bold;"
    	                onclick="closePvPArenaModal(); window.showLeaderboard()">
    	            🏆 Рейтинг
    	        </button>
    	        <button style="padding: 10px 8px; border: none; border-radius: 6px; background: #4CAF50; color: white; cursor: pointer; font-size: 14px; font-weight: bold;"
    	                onclick="closePvPArenaModal(); window.showAdventureMenu()">
    	            🗺️ Приключения (PvE)
    	        </button>
    	    </div>

    	    ${!hasArena ? '<p style="color: #ff6b6b; font-size: 11px; text-align: center; margin: 0 0 8px 0;">⚠️ Постройте Арену для PvP боёв</p>' : ''}

    	    <button style="margin-top: 0; padding: 8px; width: 100%; border: 1px solid #7289da; border-radius: 6px; background: transparent; color: #7289da; cursor: pointer; font-size: 13px;"
    	            onclick="closePvPArenaModal()">
    	        ❌ Закрыть
    	    </button>
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
            <div style="background: #555577; padding: 4px 6px; border-radius: 4px; margin-bottom: 4px; cursor: pointer; font-size: 11px;"
                 onclick="showConstructionModal(${constructions.indexOf(activeHire)})">
                <strong>🔨 Найм мага ${activeHire.wizard_index}</strong>
                <div style="font-size: 9px; color: #ffa500;">⏱️ ${window.formatTimeCurrency(activeHire.time_remaining)}</div>
            </div>
        `;
    }
    
    wizards.forEach((wizard, index) => {
        wizardsListHTML += `
            <div style="background: #3d3d5c; padding: 4px 6px; border-radius: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; font-size: 11px;">
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
        `<button style="margin: 6px 0 0 0; padding: 6px; font-size: 12px; width: 100%; border: none; border-radius: 4px; background: #7289da; color: white; cursor: pointer;"
            onclick="hireNewWizard()">
            ✅ Нанять мага ${hireTime > 0 ? `<span style="font-size: 9px;">(⏱️ ${window.formatTimeCurrency(hireTime)})</span>` : ''}
        </button>` : 
        `<div style="text-align: center; color: #aaa; padding: 6px; font-size: 11px;">Лимит: ${maxWizards}</div>`;
    
    const towerLevel = (userData.buildings?.wizard_tower?.level || 1);
    const maxTowerLevel = getBuildingMaxLevel('wizard_tower');
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ? 
        window.CONSTRUCTION_TIME.getUpgradeTime('wizard_tower', towerLevel + 1) : 144 * (towerLevel + 1);
    const upgradeButton = towerLevel < maxTowerLevel ? 
        `<button style="margin: 6px 0; padding: 6px; font-size: 12px; width: 100%; border: none; border-radius: 4px; background: #555; color: white; cursor: pointer;"
            onclick="upgradeWizardTower()">
            ⬆️ Башня ${towerLevel}→${towerLevel + 1} <span style="font-size: 9px;">(⏱️ ${window.formatTimeCurrency(upgradeTime)})</span>
        </button>` : 
        `<div style="text-align: center; color: #777; padding: 6px; font-size: 11px;">✅ Макс. уровень</div>`;
    
    const healthBonus = window.applyWizardTowerHealthBonus ? Math.round((window.applyWizardTowerHealthBonus() - 1) * 100) : 0;
    const damageBonus = window.getWizardTowerDamageBonus ? Math.round((window.getWizardTowerDamageBonus() - 1) * 100) : 0;
    const towerBonusHTML = (healthBonus > 0 || damageBonus > 0) ? `
        <div style="background: #4a5568; padding: 6px; border-radius: 4px; margin-bottom: 6px;">
            <div style="font-size: 11px; color: #ffa500; margin-bottom: 4px; font-weight: bold; text-align: center;">🏰 Бонусы башни</div>
            <div style="display: flex; gap: 6px; font-size: 10px; justify-content: center;">
                ${healthBonus > 0 ? `<div style="background: #4ade8020; padding: 4px 8px; border-radius: 4px;">❤️ +${healthBonus}%</div>` : ''}
                ${damageBonus > 0 ? `<div style="background: #ff6b6b20; padding: 4px 8px; border-radius: 4px;">⚔️ +${damageBonus}%</div>` : ''}
            </div>
        </div>
    ` : '';
    
    const modalContent = `
        <div style="padding: 10px; max-width: 500px; max-height: 70vh; background: #2c2c3d; border-radius: 8px; color: white; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 8px 0; color: #7289da; font-size: 14px; text-align: center;">🧙‍♂️ Башня магов (${towerLevel}/${maxTowerLevel})</h3>
            
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 10px; flex: 1; overflow: hidden;">
                <!-- ЛЕВАЯ: Башня -->
                <div style="display: flex; flex-direction: column;">
                    ${towerBonusHTML}
                    ${upgradeButton}
                </div>
                
                <!-- ПРАВАЯ: Маги -->
                <div style="display: flex; flex-direction: column;">
                    <p style="margin: 0 0 4px 0; font-size: 11px;">Маги (${wizards.length}/${maxWizards}):</p>
                    <div style="flex: 1; overflow-y: auto; margin-bottom: 6px;">
                        ${wizardsListHTML || '<div style="text-align: center; color: #aaa; padding: 10px; font-size: 10px;">Нет магов</div>'}
                    </div>
                    ${hireButton}
                </div>
            </div>
            
            <button style="margin-top: 8px; padding: 6px; font-size: 12px; width: 100%; border: 1px solid #7289da; border-radius: 4px; background: transparent; color: #7289da; cursor: pointer;"
                onclick="closeCurrentModal()">❌ Закрыть</button>
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
        <div style="padding: 15px; max-width: 350px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da; display: flex; align-items: center; gap: 10px;">
                ${previewImage}
                🔧 Улучшение
            </h3>
            <p>Вы хотите улучшить <strong>${buildingConfig.name}</strong> до уровня ${nextLevel}?</p>
            <div style="
                background: #3d3d5c; 
                padding: 10px; 
                border-radius: 6px; 
                margin: 15px 0;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Текущий уровень:</span>
                    <span style="color: #7289da;">${currentLevel}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Новый уровень:</span>
                    <span style="color: #4ade80;">${nextLevel}</span>
                </div>
                <hr style="border: 1px solid #555; margin: 10px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>⏱️ Время улучшения:</span>
                    <span style="color: #ffa500;">${window.formatTimeCurrency(upgradeTime)}</span>
                </div>
            </div>
            <button style="margin: 10px 0 0 0; padding: 8px 15px; font-size: 14px; width: 100%; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer;"
                onclick="confirmUpgrade('${buildingId}', ${nextLevel})">
                ✅ Улучшить
            </button>
            <button style="margin: 5px 0 0 0; padding: 8px 15px; font-size: 14px; width: 100%; border: 1px solid #7289da; border-radius: 6px; background: transparent; color: #7289da; cursor: pointer;"
                onclick="closeCurrentModal()">
                ❌ Отмена
            </button>
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
            <p>Уровень кузницы: ${forgeLevel}</p>
            <div style="margin: 20px 0;">
                <button style="padding: 12px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer; font-size: 16px; width: 100%;"
                        onclick="showNotification('Система брони в разработке')">
                    ⚔️ Создать броню
                </button>
                <button style="padding: 12px; border: none; border-radius: 6px; background: #555; color: white; cursor: pointer; font-size: 16px; width: 100%; margin-top: 10px;"
                        onclick="showNotification('Система улучшения в разработке')">
                    📈 Улучшить броню
                </button>
            </div>
        `;
    }
    const modalContent = `
        <div style="padding: 20px; max-width: 350px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">⚒️ Кузница</h3>
            ${contentHTML}
            <button style="margin-top: 10px; padding: 8px 15px; width: 100%; border: 1px solid #7289da; border-radius: 6px; background: transparent; color: #7289da; cursor: pointer;"
                    onclick="closeCurrentModal()">
                ❌ Закрыть
            </button>
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
        <div style="padding: 20px; max-width: 400px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">🧪 Арканская лаборатория</h3>
            <p style="color: #aaa;">Уровень: ${labLevel}/${maxLevel}</p>
            <div style="background: #3d3d5c; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #ffa500;">Бонус к скорости изучения</h4>
                <div style="font-size: 32px; color: #4ade80; text-align: center; margin: 10px 0;">
                    -${currentBonus}%
                </div>
                <div style="font-size: 14px; color: #aaa; text-align: center;">
                    времени на изучение заклинаний
                </div>
                ${labLevel < maxLevel && currentBonus < 30 ? `
                    <div style="font-size: 12px; color: #7289da; text-align: center; margin-top: 10px;">
                        Следующий уровень: -${nextBonus}%
                    </div>
                ` : ''}
            </div>
            ${labLevel < maxLevel ? `
                <button style="
                    width: 100%;
                    margin-top: 15px;
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    background: #7289da;
                    color: white;
                    cursor: pointer;
                " onclick="confirmUpgrade('arcane_lab', ${labLevel + 1})">
                    ⬆️ Улучшить до уровня ${labLevel + 1}
                </button>
            ` : `
                <div style="text-align: center; color: #4ade80; padding: 10px;">
                    ✅ Максимальный уровень достигнут!
                </div>
            `}
            <button style="
                width: 100%;
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #7289da;
                border-radius: 6px;
                background: transparent;
                color: #7289da;
                cursor: pointer;
            " onclick="closeCurrentModal()">
                Закрыть
            </button>
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
    
    // Используем существующие функции вместо дублирования расчетов
    const production = window.calculateProduction ? window.calculateProduction() : 0;
    const storage = window.calculateMaxStorage ? window.calculateMaxStorage() : 0;
    
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
        <div style="padding: 15px; max-width: 700px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #ffa500;">⏱️ Генератор Времени</h3>
            <p style="color: #aaa;">Уровень: ${generatorLevel}/${maxLevel}</p>
            
            <!-- Горизонтальная сетка блоков -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 15px 0;">
                
                <!-- Производство -->
                <div style="background: #3d3d5c; padding: 12px; border-radius: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #4ade80; font-size: 14px;">⚡ Производство</h4>
                    <div style="font-size: 24px; color: #ffa500; text-align: center; margin: 8px 0;">
                        +${production} мин/час
                    </div>
                    <div style="font-size: 11px; color: #aaa; text-align: center;">
                        временной валюты в час
                    </div>
                    ${generatorLevel < maxLevel ? `
                        <div style="font-size: 10px; color: #7289da; text-align: center; margin-top: 5px;">
                            След. ур: +${nextProduction} мин/час
                        </div>
                    ` : ''}
                </div>
                
                <!-- Хранилище -->
                <div style="background: #3d3d5c; padding: 12px; border-radius: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #00bcd4; font-size: 14px;">📦 Хранилище</h4>
                    <div style="font-size: 20px; color: #00bcd4; text-align: center; margin: 8px 0;">
                        ${window.formatTimeCurrency(storage)}
                    </div>
                    <div style="font-size: 11px; color: #aaa; text-align: center;">
                        лимит офлайн накопления
                    </div>
                    ${generatorLevel < maxLevel ? `
                        <div style="font-size: 10px; color: #7289da; text-align: center; margin-top: 5px;">
                            След. ур: ${window.formatTimeCurrency(nextStorage)}
                        </div>
                    ` : ''}
                </div>

            </div>
            
            ${generatorLevel < maxLevel ? `
                <button style="
                    width: 100%;
                    margin-top: 15px;
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    background: #ffa500;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="confirmUpgrade('time_generator', ${generatorLevel + 1})">
                    ⬆️ Улучшить до уровня ${generatorLevel + 1}
                    <div style="font-size: 11px; margin-top: 3px; opacity: 0.9;">
                        ⏱️ ${window.formatTimeCurrency(upgradeTime)}
                    </div>
                </button>
            ` : `
                <div style="text-align: center; color: #4ade80; padding: 10px;">
                    ✅ Максимальный уровень достигнут!
                </div>
            `}
            
            <button style="
                width: 100%;
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #7289da;
                border-radius: 6px;
                background: transparent;
                color: #7289da;
                cursor: pointer;
            " onclick="closeCurrentModal()">
                Закрыть
            </button>
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