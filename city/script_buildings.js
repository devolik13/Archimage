// script_buildings.js - Работа со зданиями...

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
    	                onclick="closePvPArenaModal(); window.showAdventureHub()">
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
            <div style="background: #555577; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; font-size: 15px;"
                 onclick="showConstructionModal(${constructions.indexOf(activeHire)})">
                <strong>🔨 Найм мага ${activeHire.wizard_index}</strong>
                <div style="font-size: 13px; color: #ffa500;">⏱️ ${window.formatTimeCurrency(activeHire.time_remaining)}</div>
            </div>
        `;
    }

    wizards.forEach((wizard, index) => {
        wizardsListHTML += `
            <div style="background: #3d3d5c; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 15px;">
                <div>
                    <strong>🧙‍♂️ ${wizard.name}</strong>
                    <div style="font-size: 13px; color: #aaa;">HP: ${wizard.hp}/${wizard.max_hp} | AR: ${wizard.armor}/${wizard.max_armor}</div>
                </div>
                <div style="font-size: 14px; color: #7289da;">Ур.${wizard.level || 1}</div>
            </div>
        `;
    });
    
    // НОВОЕ: Проверка требований уровня башни для найма
    const towerLevel = userData.buildings?.wizard_tower?.level || 1;
    const wizardIndex = wizards.length;
    const towerRequirements = { 0: 1, 1: 3, 2: 5, 3: 7, 4: 10 };
    const requiredLevel = towerRequirements[wizardIndex];
    const canHireByLevel = towerLevel >= requiredLevel;

    const canHire = wizards.length < maxWizards && !activeHire;
    const hireTime = window.WIZARD_HIRE_TIME?.getHireTime ? window.WIZARD_HIRE_TIME.getHireTime(wizards.length) : 0;

    let hireButton;
    if (!canHire && wizards.length >= maxWizards) {
        hireButton = `<div style="text-align: center; color: #aaa; padding: 12px; font-size: 15px;">✅ Все маги наняты (${maxWizards}/${maxWizards})</div>`;
    } else if (!canHire && activeHire) {
        hireButton = `<div style="text-align: center; color: #ffa500; padding: 12px; font-size: 15px;">⏱️ Идет найм...</div>`;
    } else if (!canHireByLevel) {
        hireButton = `<button style="margin: 12px 0 0 0; padding: 12px; font-size: 17px; width: 100%; border: none; border-radius: 8px; background: #555; color: #999; cursor: not-allowed;" disabled>
            🔒 ${wizardIndex + 1}-й маг (требуется башня ${requiredLevel} ур)
        </button>`;
    } else {
        hireButton = `<button style="margin: 12px 0 0 0; padding: 12px; font-size: 17px; width: 100%; border: none; border-radius: 8px; background: #7289da; color: white; cursor: pointer;"
            onclick="hireNewWizard()">
            ✅ Нанять ${wizardIndex + 1}-го мага ${hireTime > 0 ? `<span style="font-size: 13px;">(⏱️ ${window.formatTimeCurrency(hireTime)})</span>` : ''}
        </button>`;
    }

    const maxTowerLevel = getBuildingMaxLevel('wizard_tower');
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('wizard_tower', towerLevel + 1) : 144 * (towerLevel + 1);
    const upgradeButton = towerLevel < maxTowerLevel ?
        `<button style="margin: 12px 0; padding: 12px; font-size: 17px; width: 100%; border: none; border-radius: 8px; background: #555; color: white; cursor: pointer;"
            onclick="upgradeWizardTower()">
            ⬆️ Башня ${towerLevel}→${towerLevel + 1} <span style="font-size: 13px;">(⏱️ ${window.formatTimeCurrency(upgradeTime)})</span>
        </button>` :
        `<div style="text-align: center; color: #777; padding: 12px; font-size: 15px;">✅ Макс. уровень</div>`;
    
    const healthBonus = window.applyWizardTowerHealthBonus ? Math.round((window.applyWizardTowerHealthBonus() - 1) * 100) : 0;
    const damageBonus = window.getWizardTowerDamageBonus ? Math.round((window.getWizardTowerDamageBonus() - 1) * 100) : 0;
    const towerBonusHTML = (healthBonus > 0 || damageBonus > 0) ? `
        <div style="background: #4a5568; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="font-size: 15px; color: #ffa500; margin-bottom: 8px; font-weight: bold; text-align: center;">🏰 Бонусы башни</div>
            <div style="display: flex; gap: 12px; font-size: 14px; justify-content: center;">
                ${healthBonus > 0 ? `<div style="background: #4ade8020; padding: 8px 16px; border-radius: 8px;">❤️ +${healthBonus}%</div>` : ''}
                ${damageBonus > 0 ? `<div style="background: #ff6b6b20; padding: 8px 16px; border-radius: 8px;">⚔️ +${damageBonus}%</div>` : ''}
            </div>
        </div>
    ` : '';
    
    const modalContent = `
        <div style="padding: 20px; max-width: 700px; max-height: 80vh; background: #2c2c3d; border-radius: 16px; color: white; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #7289da; font-size: 20px; text-align: center;">🧙‍♂️ Башня магов (${towerLevel}/${maxTowerLevel})</h3>

            <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px; flex: 1; overflow: hidden;">
                <!-- ЛЕВАЯ: Башня -->
                <div style="display: flex; flex-direction: column;">
                    ${towerBonusHTML}
                    ${upgradeButton}
                </div>

                <!-- ПРАВАЯ: Маги -->
                <div style="display: flex; flex-direction: column;">
                    <p style="margin: 0 0 8px 0; font-size: 15px;">Маги (${wizards.length}/${maxWizards}):</p>
                    <div style="flex: 1; overflow-y: auto; margin-bottom: 12px;">
                        ${wizardsListHTML || '<div style="text-align: center; color: #aaa; padding: 20px; font-size: 14px;">Нет магов</div>'}
                    </div>
                    ${hireButton}
                </div>
            </div>

            <button style="margin-top: 16px; padding: 12px; font-size: 17px; width: 100%; border: 2px solid #7289da; border-radius: 8px; background: transparent; color: #7289da; cursor: pointer;"
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

// Найм мага - ИСПРАВЛЕННАЯ ВЕРСИЯ с требованиями уровня башни
async function hireNewWizard() {
    const wizards = userData.wizards || [];
    const maxWizards = 5;

    if (wizards.length >= maxWizards) {
        showNotification('Достигнут лимит магов!');
        return;
    }

    // НОВОЕ: Проверяем уровень башни магов для найма
    const towerLevel = userData.buildings?.wizard_tower?.level || 1;
    const wizardIndex = wizards.length; // 0-based: 0=первый, 1=второй и т.д.

    // Требования для каждого мага (первый маг всегда доступен)
    const towerRequirements = {
        0: 1,   // 1-й маг: есть с начала (башня 1 ур)
        1: 3,   // 2-й маг: требует башню 3 ур
        2: 5,   // 3-й маг: требует башню 5 ур
        3: 7,   // 4-й маг: требует башню 7 ур
        4: 10   // 5-й маг: требует башню 10 ур (макс)
    };

    const requiredLevel = towerRequirements[wizardIndex];
    if (towerLevel < requiredLevel) {
        showNotification(`⚠️ Для найма ${wizardIndex + 1}-го мага требуется башня магов ${requiredLevel} уровня! (сейчас: ${towerLevel})`);
        return;
    }

    // Маги больше НЕ блокируют строительство!
    // Проверяем только что нет другого найма мага
    if (window.hasActiveConstruction && window.hasActiveConstruction('wizard')) {
        showNotification('⚠️ Уже идет найм другого мага!');
        return;
    }

// ВСЕ наймы идут только через систему времени
    if (typeof window.startWizardHire === 'function') {
        const success = await window.startWizardHire(wizards.length);
        if (success) {
            // Найм запущен через систему конструкций
            if (typeof closeWizardTowerModalBg === 'function') {
                closeWizardTowerModalBg();
            } else {
                closeAllModals();
            }
            showNotification('🧙‍♂️ Начат найм мага');
            setTimeout(() => {
                if (typeof showWizardTowerModalBg === 'function') {
                    showWizardTowerModalBg();
                } else {
                    showWizardHireModal();
                }
            }, 100);
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
    // Проверяем активные конструкции ДО начала строительства (маги больше не блокируют!)
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c =>
            c.type === 'building' &&
            c.time_remaining > 0
        );
        if (activeConstruction) {
            if (activeConstruction.is_upgrade) {
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

    // Получаем информацию о бонусах через систему building-descriptions
    let levelInfo = '';
    if (typeof window.getBuildingModalData === 'function') {
        const modalData = window.getBuildingModalData(buildingId, currentLevel, nextLevel, true);
        levelInfo = modalData.levelInfo;
    }

    // Получаем время улучшения
    const upgradeTime = CONSTRUCTION_TIME.getUpgradeTime ?
        CONSTRUCTION_TIME.getUpgradeTime(buildingId, nextLevel) :
        144 * nextLevel; // Fallback

    const modalContent = `
        <div style="padding: 20px; max-width: 450px; background: #2c2c3d; border-radius: 15px; color: white;">
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 50px; margin-bottom: 10px;">${previewImage}</div>
                <h2 style="margin: 0; color: #7289da; font-size: 24px;">
                    🔧 ${buildingConfig.name}
                </h2>
                <div style="color: #aaa; font-size: 14px; margin-top: 5px;">
                    Уровень ${currentLevel} → ${nextLevel}
                </div>
            </div>

            <!-- Описание -->
            <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="font-size: 14px; color: #ccc; line-height: 1.6;">
                    ${buildingConfig.description || 'Улучшение здания'}
                </div>
            </div>

            <!-- Новый бонус -->
            ${levelInfo ? `
            <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="
                    font-size: 12px;
                    color: #ffa500;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                ">
                    Новый бонус:
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
                    Время улучшения:
                </div>
                <div style="font-size: 18px; color: #ffa500; font-weight: bold;">
                    ⏳ ${window.formatTimeCurrency(upgradeTime)}
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button style="
                    flex: 1;
                    padding: 12px 24px;
                    background: #444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                " onclick="closeCurrentModal()"
                   onmouseover="this.style.background='#555'"
                   onmouseout="this.style.background='#444'">
                    Отмена
                </button>
                <button style="
                    flex: 1;
                    padding: 12px 24px;
                    background: #7289da;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: background 0.2s;
                " onclick="confirmUpgrade('${buildingId}', ${nextLevel})"
                   onmouseover="this.style.background='#5b6eaf'"
                   onmouseout="this.style.background='#7289da'">
                    ✅ Улучшить
                </button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';

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
    // Проверяем активные конструкции (маги больше не блокируют!)
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
    
    // Закрываем только окно башни магов (новое с фоном или старое)
    if (typeof closeWizardTowerModalBg === 'function') {
        closeWizardTowerModalBg();
    } else {
        closeAllModals();
    }

    // Показываем модальное окно с информацией о бонусах
    showUpgradeModal('wizard_tower', currentLevel, maxLevel);
}


// Модалка гильдии (основная логика в guild-modal.js)
function showGuildModal() {
    closeAllModals();
    const guildLevel = getBuildingLevel('guild');

    if (guildLevel < 1) {
        // Показываем красивую модалку на фоне гильдии
        showGuildNotBuiltModal();
        return;
    }

    // Вызываем полноценную модалку гильдии
    if (typeof window.openGuildModal === 'function') {
        window.openGuildModal();
    } else {
        showNotification('Система гильдий загружается...');
    }
}

// Модалка когда гильдия не построена - с красивым фоном
function showGuildNotBuiltModal() {
    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Определяем фон по фракции
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/guild/guild_${faction}.webp`;

    // Удаляем старый экран
    let screen = document.getElementById('guild-not-built-screen');
    if (screen) screen.remove();

    // Создаём экран
    screen = document.createElement('div');
    screen.id = 'guild-not-built-screen';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="guild-bg-image" id="guild-nb-bg-image" src="${imagePath}" alt="Гильдия" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            ">
            <div class="guild-nb-overlay" id="guild-nb-overlay"></div>
        </div>
    `;

    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('guild-nb-bg-image');

    // Настройка UI после загрузки изображения
    const setupUI = () => {
        const overlay = document.getElementById('guild-nb-overlay');
        if (!img || !overlay) return;

        const rect = img.getBoundingClientRect();

        overlay.style.cssText = `
            position: absolute;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
        `;

        // Время строительства
        const buildTime = window.CONSTRUCTION_TIME?.guild || 1440;
        const buildTimeFormatted = window.formatTimeCurrency ? window.formatTimeCurrency(buildTime) : `${buildTime} мин`;

        overlay.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                border-radius: 16px;
                padding: 30px 40px;
                text-align: center;
                max-width: 380px;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            ">
                <div style="font-size: 48px; margin-bottom: 15px;">🏰</div>
                <h3 style="color: #ffd700; margin: 0 0 12px 0; font-size: 22px;">
                    Гильдия
                </h3>
                <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Постройте здание Гильдии, чтобы объединяться с другими игроками и получать бонусы
                </p>
                <div style="
                    background: rgba(255, 165, 0, 0.1);
                    border: 1px solid rgba(255, 165, 0, 0.3);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <div style="font-size: 12px; color: #aaa;">Время строительства:</div>
                    <div style="font-size: 16px; color: #ffa500; font-weight: bold;">⏳ ${buildTimeFormatted}</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="closeGuildNotBuiltModal()" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s;
                    ">Назад</button>
                    <button onclick="startBuildingGuildFromModal()" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #4ade80, #22c55e);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.2s;
                    ">Построить</button>
                </div>
            </div>
        `;
    };

    img.onload = setupUI;
    if (img.complete) setupUI();

    // Fallback при ошибке загрузки изображения
    img.onerror = () => {
        screen.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        setupUI();
    };
}

// Закрыть модалку "гильдия не построена"
function closeGuildNotBuiltModal() {
    const screen = document.getElementById('guild-not-built-screen');
    if (screen) {
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.3s';
        setTimeout(() => screen.remove(), 300);
    }

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'flex';
}

// Начать строительство гильдии из модалки
function startBuildingGuildFromModal() {
    closeGuildNotBuiltModal();

    // Проверяем, нет ли активного строительства
    if (window.hasActiveConstruction && window.hasActiveConstruction('any_building_or_wizard')) {
        showNotification('⚠️ Уже идёт строительство другого здания!');
        return;
    }

    // Запускаем строительство
    if (typeof window.startBuilding === 'function') {
        window.startBuilding('guild', false);
    } else if (typeof window.executeBuilding === 'function') {
        const buildTime = window.CONSTRUCTION_TIME?.guild || 1440;
        window.executeBuilding('guild', false, 1, buildTime);
    }
}

// Экспортируем новые функции
window.showGuildNotBuiltModal = showGuildNotBuiltModal;
window.closeGuildNotBuiltModal = closeGuildNotBuiltModal;
window.startBuildingGuildFromModal = startBuildingGuildFromModal;

// Примечание: showNotification теперь в core/helpers.js

// Вспомогательные функции
function getBuildingMaxLevel(buildingId) {
    const maxLevels = {
        "library": 1,
        "wizard_tower": 10,
        "blessing_tower": 5,
        "time_generator": 20,
        "pvp_arena": 1,
        "guild": 1,  // Гильдия - уровень здания не влияет, только уровень самой гильдии
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
    
    // Текущая валюта игрока
    const currentCurrency = window.userData?.time_currency || 0;

    // Время до заполнения хранилища
    const minutesToFull = storage > currentCurrency ? Math.ceil((storage - currentCurrency) / (production / 60)) : 0;
    const hoursToFull = Math.floor(minutesToFull / 60);
    const minsToFull = minutesToFull % 60;
    const timeToFullText = minutesToFull > 0 ?
        (hoursToFull > 0 ? `${hoursToFull}ч ${minsToFull}м` : `${minsToFull}м`) :
        'Заполнено';

    const modalContent = `
        <div style="padding: 15px; max-width: 800px; background: #2c2c3d; border-radius: 10px; color: white;">
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0; color: #ffa500; font-size: 20px;">⏱️ Генератор Времени</h3>
                <p style="margin: 0; color: #aaa; font-size: 12px;">Уровень: ${generatorLevel}/${maxLevel}</p>
            </div>

            <!-- Горизонтальная сетка блоков -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 15px;">

                <!-- Производство -->
                <div style="background: linear-gradient(135deg, #4ade80 0%, #3d9b68 100%); padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        <span style="font-size: 24px;">⚡</span>
                    </div>
                    <h4 style="margin: 0 0 8px 0; color: white; font-size: 13px; text-align: center; font-weight: bold;">Производство</h4>
                    <div style="font-size: 28px; color: white; text-align: center; margin: 10px 0; font-weight: bold;">
                        +${production}
                    </div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.9); text-align: center;">
                        мин/час
                    </div>
                    ${generatorLevel < maxLevel ? `
                        <div style="font-size: 10px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 8px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                            След. ур: +${nextProduction} мин/час
                        </div>
                    ` : ''}
                </div>

                <!-- Хранилище -->
                <div style="background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%); padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        <span style="font-size: 24px;">📦</span>
                    </div>
                    <h4 style="margin: 0 0 8px 0; color: white; font-size: 13px; text-align: center; font-weight: bold;">Хранилище</h4>
                    <div style="font-size: 24px; color: white; text-align: center; margin: 10px 0; font-weight: bold;">
                        ${window.formatTimeCurrency(storage)}
                    </div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.9); text-align: center;">
                        лимит офлайн
                    </div>
                    ${generatorLevel < maxLevel ? `
                        <div style="font-size: 10px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 8px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                            След. ур: ${window.formatTimeCurrency(nextStorage)}
                        </div>
                    ` : ''}
                </div>

                <!-- Время до заполнения -->
                <div style="background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        <span style="font-size: 24px;">⏰</span>
                    </div>
                    <h4 style="margin: 0 0 8px 0; color: white; font-size: 13px; text-align: center; font-weight: bold;">Заполнение</h4>
                    <div style="font-size: 24px; color: white; text-align: center; margin: 10px 0; font-weight: bold;">
                        ${timeToFullText}
                    </div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.9); text-align: center;">
                        до полного
                    </div>
                    <div style="font-size: 10px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 8px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        Валюта: ${window.formatTimeCurrency(currentCurrency)}
                    </div>
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
window.showGuildModal = showGuildModal;
window.upgradeWizardTower = upgradeWizardTower;
window.showNotification = showNotification;
window.showArcaneLabModal = showArcaneLabModal;