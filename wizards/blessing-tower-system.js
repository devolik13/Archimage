// blessing-tower-system.js - Система благословений Башни благословений

// Флаг блокировки автоматического открытия модалки (используется при DEV-ускорении)
let blockBlessingModalReopen = false;

// Конфигурация благословений
const BLESSING_TOWER_CONFIG = {
    // Длительность благословения в минутах (3 часа)
    BLESSING_DURATION: 180,
    
    // Кулдаун между использованиями в минутах (12 часов)
    COOLDOWN_DURATION: 720,
    
    // Благословения по уровням башни
    BLESSINGS: {
        1: {
            id: 'armor_blessing',
            name: 'Благословение Защиты',
            description: 'Все маги получают +15 брони',
            icon: '🛡️',
            effect: { type: 'armor_bonus', value: 15 }
        },
        2: {
            id: 'damage_blessing', 
            name: 'Благословение Силы',
            description: 'Все маги наносят +12% урона',
            icon: '⚔️',
            effect: { type: 'damage_bonus', value: 0.12 }
        },
        3: {
            id: 'health_blessing',
            name: 'Благословение Жизни', 
            description: 'Все маги получают +20% к максимальному здоровью',
            icon: '❤️',
            effect: { type: 'health_bonus', value: 0.20 }
        },
        4: {
            id: 'regeneration_blessing',
            name: 'Благословение Восстановления',
            description: 'Все маги получают 3% регенерации здоровья каждый ход',
            icon: '💚',
            effect: { type: 'regeneration', value: 0.03 }
        },
        5: {
            id: 'divine_blessing',
            name: 'Божественное Благословение',
            description: 'Комбинирует все предыдущие благословения с уменьшенной силой',
            icon: '✨',
            effect: { 
                type: 'combined', 
                effects: [
                    { type: 'armor_bonus', value: 8 },
                    { type: 'damage_bonus', value: 0.08 },
                    { type: 'health_bonus', value: 0.12 },
                    { type: 'regeneration', value: 0.02 }
                ]
            }
        }
    }
};

// Получить текущее активное благословение
function getActiveBlessing() {
    return window.userData?.active_blessing || null;
}

// Проверить доступность использования благословения
function canUseBlessingTower() {
    const towerLevel = window.getBuildingLevel('blessing_tower');
    if (towerLevel === 0) {
        return { canUse: false, reason: 'Башня благословений не построена' };
    }
    
    const now = Date.now();
    const lastUsed = window.userData?.blessing_last_used || 0;
    const cooldownEnd = lastUsed + (BLESSING_TOWER_CONFIG.COOLDOWN_DURATION * 60 * 1000);
    
    if (now < cooldownEnd) {
        const remainingTime = Math.ceil((cooldownEnd - now) / (60 * 1000));
        return { 
            canUse: false, 
            reason: `Кулдаун: ${window.formatTimeCurrency(remainingTime)}` 
        };
    }
    
    const activeBlessing = getActiveBlessing();
    if (activeBlessing && activeBlessing.expires_at > now) {
        const remainingTime = Math.ceil((activeBlessing.expires_at - now) / (60 * 1000));
        return { 
            canUse: false, 
            reason: `Активно: ${activeBlessing.name} (${window.formatTimeCurrency(remainingTime)})` 
        };
    }
    
    return { canUse: true };
}

// Получить доступные благословения для уровня башни
function getAvailableBlessings() {
    const towerLevel = window.getBuildingLevel('blessing_tower');
    const blessings = [];
    
    for (let level = 1; level <= towerLevel; level++) {
        if (BLESSING_TOWER_CONFIG.BLESSINGS[level]) {
            blessings.push({
                level: level,
                ...BLESSING_TOWER_CONFIG.BLESSINGS[level]
            });
        }
    }
    
    return blessings;
}

// Активировать благословение
async function activateBlessing(blessingLevel) {
    const blessing = BLESSING_TOWER_CONFIG.BLESSINGS[blessingLevel];
    if (!blessing) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Неизвестное благословение');
        }
        return false;
    }
    
    const canUseCheck = canUseBlessingTower();
    if (!canUseCheck.canUse) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(canUseCheck.reason);
        }
        return false;
    }
    
    const now = Date.now();
    const expiresAt = now + (BLESSING_TOWER_CONFIG.BLESSING_DURATION * 60 * 1000);
    
    // Создаем объект активного благословения
    const activeBlessing = {
        id: blessing.id,
        name: blessing.name,
        description: blessing.description,
        icon: blessing.icon,
        level: blessingLevel,
        effect: blessing.effect,
        activated_at: now,
        expires_at: expiresAt
    };
    
    // Сохраняем в userData
    if (!window.userData) window.userData = {};
    window.userData.active_blessing = activeBlessing;
    window.userData.blessing_last_used = now;
    
    // Применяем эффекты к магам
    applyBlessingEffects(activeBlessing);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(`✨ Активировано: ${blessing.name}`);
    }
    
    // Запускаем таймер обновления
    startBlessingTimer();
    updateBlessingIndicator();

    // Сохраняем в БД
    if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
        window.dbManager.savePlayer(window.userData);
    }

    // Закрываем модалку полностью через Modal.closeAll
    if (window.Modal && window.Modal.closeAll) {
        window.Modal.closeAll();
    } else if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    return true;
}

// Применить эффекты благословения к магам
function applyBlessingEffects(blessing) {
    if (!window.userData?.wizards) return;
    
    const effects = blessing.effect.type === 'combined' ? 
        blessing.effect.effects : [blessing.effect];
    
    window.userData.wizards.forEach(wizard => {
        if (!wizard.blessingEffects) wizard.blessingEffects = {};
        
        effects.forEach(effect => {
            switch (effect.type) {
                case 'armor_bonus':
                    wizard.blessingEffects.armorBonus = effect.value;
                    break;
                case 'damage_bonus':
                    wizard.blessingEffects.damageMultiplier = 1 + effect.value;
                    break;
                case 'health_bonus':
                    wizard.blessingEffects.healthMultiplier = 1 + effect.value;
                    // Пересчитываем максимальное здоровье
                    const baseMaxHp = wizard.original_max_hp || wizard.max_hp;
                    wizard.max_hp = Math.floor(baseMaxHp * wizard.blessingEffects.healthMultiplier);
                    // Увеличиваем текущее здоровье пропорционально
                    wizard.hp = Math.min(wizard.hp + Math.floor(baseMaxHp * effect.value), wizard.max_hp);
                    break;
                case 'regeneration':
                    wizard.blessingEffects.regeneration = effect.value;
                    break;
            }
        });
    });
    
    console.log('🙏 Эффекты благословения применены к магам');
}

// Снять эффекты благословения
function removeBlessingEffects() {
    if (!window.userData?.wizards) return;
    
    window.userData.wizards.forEach(wizard => {
        if (wizard.blessingEffects) {
            // Восстанавливаем здоровье если было увеличено
            if (wizard.blessingEffects.healthMultiplier) {
                const baseMaxHp = wizard.original_max_hp || wizard.max_hp;
                const currentRatio = wizard.hp / wizard.max_hp;
                wizard.max_hp = baseMaxHp;
                wizard.hp = Math.floor(baseMaxHp * currentRatio);
            }
            
            delete wizard.blessingEffects;
        }
    });
    
    console.log('🕯️ Эффекты благословения сняты');
}

// Проверить и обновить статус благословения
function updateBlessingStatus() {
    const activeBlessing = getActiveBlessing();
    if (!activeBlessing) {
        updateBlessingIndicator(); // Покажет кулдаун если есть
        return;
    }

    const now = Date.now();
    if (now >= activeBlessing.expires_at) {
        // Благословение истекло
        removeBlessingEffects();
        window.userData.active_blessing = null;

        if (typeof window.showNotification === 'function') {
            window.showNotification(`Благословение "${activeBlessing.name}" истекло`);
        }

        updateBlessingIndicator(); // Покажет индикатор кулдауна
        updateBlessingTowerUI();
    } else {
        updateBlessingIndicator(); // Обновит таймер активного благословения
    }
}

// Запустить таймер обновления благословений
function startBlessingTimer() {
    // Обновляем каждую минуту
    if (window.blessingUpdateInterval) {
        clearInterval(window.blessingUpdateInterval);
    }
    
    window.blessingUpdateInterval = setInterval(updateBlessingStatus, 60000);
}

// Показать интерфейс Башни благословений
function showBlessingTowerModal() {
    // Проверяем флаг блокировки (используется при DEV-ускорении)
    if (blockBlessingModalReopen) {
        console.log('🚫 Открытие модалки Башни благословений заблокировано');
        return;
    }
    
    if (typeof window.closeAllModals === 'function') {
        window.closeAllModals();
    }
    
    const towerLevel = window.getBuildingLevel('blessing_tower');
    if (towerLevel === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Башня благословений не построена');
        }
        return;
    }
    
    const canUseCheck = canUseBlessingTower();
    const availableBlessings = getAvailableBlessings();
    const activeBlessing = getActiveBlessing();
    
    let activeBlessingHTML = '';
    if (activeBlessing && activeBlessing.expires_at > Date.now()) {
        const remainingTime = Math.ceil((activeBlessing.expires_at - Date.now()) / (60 * 1000));
        activeBlessingHTML = `
            <div style="background: #4CAF50; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">${activeBlessing.icon}</span>
                    <div>
                        <div style="font-weight: bold;">${activeBlessing.name}</div>
                        <div style="font-size: 12px; opacity: 0.9;">
                            Осталось: ${window.formatTimeCurrency(remainingTime)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    let blessingsHTML = '';
    if (canUseCheck.canUse) {
        blessingsHTML = availableBlessings.map(blessing => `
            <button style="
                width: 100%;
                padding: 12px;
                margin-bottom: 10px;
                border: none;
                border-radius: 6px;
                background: #7289da;
                color: white;
                cursor: pointer;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            " onclick="activateBlessing(${blessing.level})">
                <span style="font-size: 20px;">${blessing.icon}</span>
                <div>
                    <div style="font-weight: bold;">${blessing.name}</div>
                    <div style="font-size: 11px; opacity: 0.9;">${blessing.description}</div>
                </div>
            </button>
        `).join('');
    } else {
        blessingsHTML = `
            <div style="text-align: center; padding: 20px; color: #aaa;">
                ${canUseCheck.reason}
            </div>
        `;
    }
    
    // Кнопка улучшения башни
    const maxTowerLevel = window.getBuildingMaxLevel('blessing_tower');
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ? 
        window.CONSTRUCTION_TIME.getUpgradeTime('blessing_tower', towerLevel + 1) : 
        144 * (towerLevel + 1);

    const upgradeButton = towerLevel < maxTowerLevel ? 
        `<button style="margin: 10px 0; padding: 10px 15px; font-size: 14px; width: 100%; border: none; border-radius: 6px; background: #555; color: white; cursor: pointer;"
            onclick="upgradeBlessingTower()">
            ⬆️ Улучшить башню (ур. ${towerLevel} → ${towerLevel + 1})
            <div style="font-size: 11px; margin-top: 3px; opacity: 0.9;">
                ⏱️ ${window.formatTimeCurrency(upgradeTime)}
            </div>
        </button>` : 
        `<div style="text-align: center; color: #777; padding: 10px; font-size: 14px;">
            ✅ Башня максимального уровня (${maxTowerLevel})
        </div>`;
    
    const modalContent = `
        <div style="padding: 15px; max-width: 700px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">🛕 Башня благословений</h3>
            <p style="margin: 5px 0; color: #aaa;">Уровень башни: ${towerLevel}/${maxTowerLevel}</p>
            <p style="font-size: 12px; color: #aaa; margin-bottom: 15px;">
                Длительность: ${BLESSING_TOWER_CONFIG.BLESSING_DURATION/60}ч | 
                Кулдаун: ${BLESSING_TOWER_CONFIG.COOLDOWN_DURATION/60}ч
            </p>
            
            ${activeBlessingHTML}
            
            <div style="margin-bottom: 15px;">
                <h4 style="color: #ffa500; margin-bottom: 10px;">Доступные благословения:</h4>
                <!-- Горизонтальная сетка благословений -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
                    ${canUseCheck.canUse ? availableBlessings.map(blessing => `
                        <button style="
                            padding: 10px 8px;
                            border: none;
                            border-radius: 6px;
                            background: #7289da;
                            color: white;
                            cursor: pointer;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 5px;
                            min-height: 80px;
                        " onclick="activateBlessing(${blessing.level})">
                            <span style="font-size: 24px;">${blessing.icon}</span>
                            <div style="font-weight: bold; font-size: 11px;">${blessing.name}</div>
                            <div style="font-size: 9px; opacity: 0.85; line-height: 1.2;">${blessing.description}</div>
                        </button>
                    `).join('') : `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #aaa;">
                            ${canUseCheck.reason}
                        </div>
                    `}
                </div>
            </div>
            
            ${upgradeButton}
            
            <button style="
                width: 100%;
                padding: 10px;
                border: 1px solid #7289da;
                border-radius: 6px;
                background: transparent;
                color: #7289da;
                cursor: pointer;
            " onclick="if(typeof Modal !== 'undefined' && Modal.closeAll) { Modal.closeAll(); } else if(typeof closeCurrentModal === 'function') { closeCurrentModal(); }">
                Закрыть
            </button>
        </div>
    `;
    
    
    // Используем новую модальную систему
    console.log('🛕 Открытие модалки башни благословений:', {
        towerLevel,
        canUse: canUseCheck.canUse,
        reason: canUseCheck.reason,
        availableBlessings: availableBlessings.length,
        activeBlessing: activeBlessing ? activeBlessing.name : 'нет'
    });
    
    // Используем новую модальную систему
    Modal.show(modalContent);
}

// Обновить UI башни благословений (если открыт)
function updateBlessingTowerUI() {
    // Проверяем, открыта ли модалка через новую систему
    if (window.currentModal || (typeof Modal !== 'undefined' && Modal.currentModal)) {
        // Просто закрываем и открываем заново
        if (typeof closeCurrentModal === 'function') {
            closeCurrentModal();
        }
        showBlessingTowerModal();
    }
}

// Инициализация системы благословений
function initBlessingSystem() {
    // Проверяем активные благословения при загрузке
    updateBlessingStatus();
    startBlessingTimer();
    
}
async function upgradeBlessingTower() {
    const currentLevel = window.getBuildingLevel('blessing_tower');
    const maxLevel = window.getBuildingMaxLevel('blessing_tower');
    
    if (currentLevel >= maxLevel) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`⚠️ Башня благословений уже максимального уровня (${maxLevel})`);
        }
        return;
    }
    
    const nextLevel = currentLevel + 1;
    
    if (typeof window.closeAllModals === 'function') {
        window.closeAllModals();
    }
    
    if (typeof window.confirmUpgrade === 'function') {
        window.confirmUpgrade('blessing_tower', nextLevel);
    }
}

// Создание UI элемента индикатора благословения
function createBlessingIndicatorUI() {
    const activeBlessing = getActiveBlessing();
    const now = Date.now();

    // Удаляем старый индикатор если есть
    const oldIndicator = document.getElementById('blessing-indicator-container');
    if (oldIndicator) oldIndicator.remove();

    // Проверяем активное благословение
    if (activeBlessing && activeBlessing.expires_at > now) {
        // Показываем активное благословение
        const remainingTime = Math.ceil((activeBlessing.expires_at - now) / (60 * 1000));
        const totalTime = Math.ceil((activeBlessing.expires_at - activeBlessing.activated_at) / (60 * 1000));
        const progressPercent = ((totalTime - remainingTime) / totalTime * 100);

        const indicatorHTML = `
            <div id="blessing-indicator-container" style="
                position: fixed;
                top: 70px;
                right: 10px;
                background: rgba(76, 175, 80, 0.95);
                padding: 10px 15px;
                border-radius: 8px;
                border: 2px solid #4CAF50;
                color: white;
                font-size: 14px;
                z-index: 100;
                min-width: 180px;
                cursor: pointer;
            " onclick="showBlessingTowerModal()">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <span style="font-size: 20px;">${activeBlessing.icon}</span>
                    <div>
                        <div style="font-weight: bold; color: white;">
                            ${activeBlessing.name}
                        </div>
                        <div style="font-size: 11px; color: #e8f5e8;">
                            Осталось: ${window.formatTimeCurrency(remainingTime)}
                        </div>
                    </div>
                </div>
                <div style="width: 100%; background: rgba(255,255,255,0.3); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="
                        width: ${progressPercent}%;
                        height: 100%;
                        background: linear-gradient(90deg, #81c784 0%, #4caf50 100%);
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', indicatorHTML);
        return;
    }

    // Проверяем кулдаун
    const lastUsed = window.userData?.blessing_last_used || 0;
    const cooldownEnd = lastUsed + (BLESSING_TOWER_CONFIG.COOLDOWN_DURATION * 60 * 1000);

    if (lastUsed > 0 && now < cooldownEnd) {
        // Показываем индикатор кулдауна
        const remainingCooldown = Math.ceil((cooldownEnd - now) / (60 * 1000));
        const totalCooldown = BLESSING_TOWER_CONFIG.COOLDOWN_DURATION;
        const cooldownProgress = ((totalCooldown - remainingCooldown) / totalCooldown * 100);

        const cooldownHTML = `
            <div id="blessing-indicator-container" style="
                position: fixed;
                top: 70px;
                right: 10px;
                background: rgba(100, 100, 100, 0.95);
                padding: 10px 15px;
                border-radius: 8px;
                border: 2px solid #666;
                color: white;
                font-size: 14px;
                z-index: 100;
                min-width: 180px;
                cursor: pointer;
            " onclick="showBlessingTowerModal()">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <span style="font-size: 20px;">⏳</span>
                    <div>
                        <div style="font-weight: bold; color: #aaa;">
                            Благословение
                        </div>
                        <div style="font-size: 11px; color: #ffa500;">
                            Кулдаун: ${window.formatTimeCurrency(remainingCooldown)}
                        </div>
                    </div>
                </div>
                <div style="width: 100%; background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="
                        width: ${cooldownProgress}%;
                        height: 100%;
                        background: linear-gradient(90deg, #666 0%, #888 100%);
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', cooldownHTML);
    }
}

// Обновление индикатора (вызывается при изменении статуса)
function updateBlessingIndicator() {
    createBlessingIndicatorUI();
}

// Экспорт функций
window.BLESSING_TOWER_CONFIG = BLESSING_TOWER_CONFIG;
window.getActiveBlessing = getActiveBlessing;
window.canUseBlessingTower = canUseBlessingTower;
window.getAvailableBlessings = getAvailableBlessings;
window.activateBlessing = activateBlessing;
window.showBlessingTowerModal = showBlessingTowerModal;
window.updateBlessingStatus = updateBlessingStatus;
window.initBlessingSystem = initBlessingSystem;
window.upgradeBlessingTower = upgradeBlessingTower;
window.createBlessingIndicatorUI = createBlessingIndicatorUI;
window.updateBlessingIndicator = updateBlessingIndicator;

// Экспортируем функции управления флагом блокировки
window.setBlockBlessingModalReopen = (value) => { blockBlessingModalReopen = value; };
window.getBlockBlessingModalReopen = () => blockBlessingModalReopen;

// Автоинициализация при загрузке userData
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.userData) {
            initBlessingSystem();
        }
    }, 1000);
});
window.openBlessingTowerModal = showBlessingTowerModal;