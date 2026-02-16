// blessing-tower-system.js - Система благословений Башни благословений

// Флаг блокировки автоматического открытия модалки (используется при DEV-ускорении)
let blockBlessingModalReopen = false;

// Конфигурация благословений
const BLESSING_TOWER_CONFIG = {
    // Длительность благословения в минутах (3 часа)
    BLESSING_DURATION: 180,
    
    // Кулдаун между использованиями в минутах (24 часа)
    COOLDOWN_DURATION: 1440,
    
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
    const towerLevel = typeof window.getBuildingLevel === 'function' ? window.getBuildingLevel('blessing_tower') : 0;
    if (towerLevel === 0) {
        return { canUse: false, reason: 'Башня благословений не построена' };
    }

    const fmt = typeof window.formatTimeCurrency === 'function' ? window.formatTimeCurrency : (m) => m + ' мин';
    const now = Date.now();
    const lastUsed = window.userData?.blessing_last_used || 0;
    const cooldownEnd = lastUsed + (BLESSING_TOWER_CONFIG.COOLDOWN_DURATION * 60 * 1000);

    if (now < cooldownEnd) {
        const remainingTime = Math.ceil((cooldownEnd - now) / (60 * 1000));
        return {
            canUse: false,
            reason: `Кулдаун: ${fmt(remainingTime)}`
        };
    }

    const activeBlessing = getActiveBlessing();
    if (activeBlessing && activeBlessing.expires_at > now) {
        const remainingTime = Math.ceil((activeBlessing.expires_at - now) / (60 * 1000));
        return {
            canUse: false,
            reason: `Активно: ${activeBlessing.name} (${fmt(remainingTime)})`
        };
    }

    return { canUse: true };
}

// Получить доступные благословения для уровня башни
function getAvailableBlessings() {
    const towerLevel = typeof window.getBuildingLevel === 'function' ? window.getBuildingLevel('blessing_tower') : 0;
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

    // Закрываем модалку — проверяем оба варианта (обычный Modal и bg-модалка)
    if (typeof window.closeBlessingTowerModalBg === 'function') {
        window.closeBlessingTowerModalBg();
    }
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
        // ВАЖНО: всегда сбрасываем старые эффекты, чтобы не накапливались
        // остатки от предыдущих благословений (могут остаться в БД)
        wizard.blessingEffects = {};

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
                    // Сохраняем базовое HP ДО модификации (для корректного снятия)
                    if (!wizard.original_max_hp) {
                        wizard.original_max_hp = wizard.max_hp;
                    }
                    // Защита: original_max_hp не может превышать base(100) * levelBonus
                    // Ловит случай когда max_hp был раздут боевыми множителями
                    const _base = 100;
                    const _level = wizard.level || 1;
                    let _levelBonus = 1.0;
                    if (_level === 40) _levelBonus = 3.0;
                    else if (_level > 1) _levelBonus = 1 + (_level - 1) * 0.05;
                    const _maxBase = Math.floor(_base * _levelBonus);
                    if (wizard.original_max_hp > _maxBase) {
                        wizard.original_max_hp = _maxBase;
                    }
                    const baseMaxHp = wizard.original_max_hp;
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

// Очистить остаточные blessingEffects с магов и нормализовать HP
// Вызывается при инициализации если благословение неактивно/истекло.
// ВАЖНО: blessingEffects стрипается при сохранении в БД, поэтому
// нельзя полагаться ТОЛЬКО на его наличие — нужно также проверять
// original_max_hp и кэпать max_hp к уровневому максимуму.
function cleanupResidualBlessingEffects() {
    if (!window.userData?.wizards) return;
    let cleaned = false;

    window.userData.wizards.forEach(wizard => {
        // Случай 1: blessingEffects ещё в памяти (не сохранялись)
        if (wizard.blessingEffects) {
            if (wizard.original_max_hp) {
                const currentRatio = wizard.max_hp > 0 ? wizard.hp / wizard.max_hp : 1;
                wizard.max_hp = wizard.original_max_hp;
                wizard.hp = Math.floor(wizard.original_max_hp * currentRatio);
            }
            delete wizard.blessingEffects;
            delete wizard.original_max_hp;
            cleaned = true;
        }
        // Случай 2: blessingEffects стрипнут при сохранении, но original_max_hp остался
        else if (wizard.original_max_hp) {
            if (wizard.max_hp > wizard.original_max_hp) {
                const currentRatio = wizard.max_hp > 0 ? wizard.hp / wizard.max_hp : 1;
                wizard.max_hp = wizard.original_max_hp;
                wizard.hp = Math.floor(wizard.original_max_hp * currentRatio);
            }
            delete wizard.original_max_hp;
            cleaned = true;
        }

        // Защитный кэп: max_hp не может быть больше base(100) * levelBonus
        // Ловит случаи когда боевые множители (башня/гильдия) утекли в сохранение
        const base = 100;
        const level = wizard.level || 1;
        let levelBonus = 1.0;
        if (level === 40) levelBonus = 3.0;
        else if (level > 1) levelBonus = 1 + (level - 1) * 0.05;
        const maxAllowed = Math.floor(base * levelBonus);

        if (wizard.max_hp !== maxAllowed) {
            const currentRatio = wizard.max_hp > 0 ? wizard.hp / wizard.max_hp : 1;
            wizard.max_hp = maxAllowed;
            wizard.hp = Math.max(1, Math.floor(maxAllowed * currentRatio));
            cleaned = true;
        }
    });

    if (cleaned) {
        console.log('🧹 Очищены остаточные blessingEffects / нормализован HP магов');
    }
}

// Снять эффекты благословения
function removeBlessingEffects() {
    if (!window.userData?.wizards) return;
    
    window.userData.wizards.forEach(wizard => {
        if (wizard.blessingEffects) {
            // Восстанавливаем здоровье если было увеличено
            if (wizard.blessingEffects.healthMultiplier && wizard.original_max_hp) {
                const currentRatio = wizard.hp / wizard.max_hp;
                wizard.max_hp = wizard.original_max_hp;
                wizard.hp = Math.floor(wizard.original_max_hp * currentRatio);
                delete wizard.original_max_hp;
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

        // Сразу сохраняем в БД чтобы при перезагрузке не загрузилось старое
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            window.dbManager.savePlayer(window.userData);
        }

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
    
    const towerLevel = typeof window.getBuildingLevel === 'function' ? window.getBuildingLevel('blessing_tower') : 0;
    if (towerLevel === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Башня благословений не построена');
        }
        return;
    }

    const fmt = typeof window.formatTimeCurrency === 'function' ? window.formatTimeCurrency : (m) => m + ' мин';
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
                            Осталось: ${fmt(remainingTime)}
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
    const maxTowerLevel = typeof window.getBuildingMaxLevel === 'function' ? window.getBuildingMaxLevel('blessing_tower') : 5;
    const upgradeTime = window.CONSTRUCTION_TIME?.getUpgradeTime ?
        window.CONSTRUCTION_TIME.getUpgradeTime('blessing_tower', towerLevel + 1) :
        144 * (towerLevel + 1);

    const upgradeButton = towerLevel < maxTowerLevel ?
        `<button style="margin: 10px 0; padding: 10px 15px; font-size: 14px; width: 100%; border: none; border-radius: 6px; background: #555; color: white; cursor: pointer;"
            onclick="upgradeBlessingTower()">
            ⬆️ Улучшить башню (ур. ${towerLevel} → ${towerLevel + 1})
            <div style="font-size: 11px; margin-top: 3px; opacity: 0.9;">
                ⏱️ ${fmt(upgradeTime)}
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
    const activeBlessing = getActiveBlessing();
    const now = Date.now();

    // ВСЕГДА сначала нормализуем HP магов — убираем любой раздутый HP
    // который мог попасть в БД из-за боевых множителей или старых багов.
    // cleanupResidualBlessingEffects также кэпает max_hp к уровневому максимуму.
    cleanupResidualBlessingEffects();

    // Если есть активное благословение которое еще не истекло - применяем эффекты
    if (activeBlessing && activeBlessing.expires_at > now) {
        console.log(`🙏 Восстановление активного благословения: ${activeBlessing.name}`);
        applyBlessingEffects(activeBlessing);
    } else {
        // Нет активного благословения или оно истекло — чистим всё
        if (activeBlessing) {
            console.log(`🕯️ Благословение истекло оффлайн: ${activeBlessing.name}`);
            window.userData.active_blessing = null;
        }

        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            window.dbManager.savePlayer(window.userData);
        }
    }

    updateBlessingStatus();
    startBlessingTimer();

}
async function upgradeBlessingTower() {
    const currentLevel = typeof window.getBuildingLevel === 'function' ? window.getBuildingLevel('blessing_tower') : 0;
    const maxLevel = typeof window.getBuildingMaxLevel === 'function' ? window.getBuildingMaxLevel('blessing_tower') : 5;
    
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

// Форматирование времени в компактный формат (2:30:00)
function formatTimeCompact(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}м`;
}

// Создание UI элемента индикатора благословения (компактный с часами)
function createBlessingIndicatorUI() {
    const activeBlessing = getActiveBlessing();
    const now = Date.now();

    // Удаляем старый индикатор если есть
    const oldIndicator = document.getElementById('blessing-indicator-container');
    if (oldIndicator) oldIndicator.remove();

    // Проверяем активное благословение
    if (activeBlessing && activeBlessing.expires_at > now) {
        const remainingTime = Math.ceil((activeBlessing.expires_at - now) / (60 * 1000));
        const timeStr = formatTimeCompact(remainingTime);

        const indicatorHTML = `
            <div id="blessing-indicator-container" style="
                position: fixed;
                top: 70px;
                right: 10px;
                background: rgba(76, 175, 80, 0.9);
                padding: 6px 10px;
                border-radius: 20px;
                border: 1px solid #4CAF50;
                color: white;
                font-size: 12px;
                z-index: 100;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
            " onclick="showBlessingTowerModal()">
                <span style="font-size: 16px;">${activeBlessing.icon}</span>
                <span style="font-weight: bold;">🕐 ${timeStr}</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', indicatorHTML);
        return;
    }

    // Проверяем кулдаун
    const lastUsed = window.userData?.blessing_last_used || 0;
    const cooldownEnd = lastUsed + (BLESSING_TOWER_CONFIG.COOLDOWN_DURATION * 60 * 1000);

    if (lastUsed > 0 && now < cooldownEnd) {
        const remainingCooldown = Math.ceil((cooldownEnd - now) / (60 * 1000));
        const timeStr = formatTimeCompact(remainingCooldown);

        const cooldownHTML = `
            <div id="blessing-indicator-container" style="
                position: fixed;
                top: 70px;
                right: 10px;
                background: rgba(80, 80, 80, 0.9);
                padding: 6px 10px;
                border-radius: 20px;
                border: 1px solid #555;
                color: #aaa;
                font-size: 12px;
                z-index: 100;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
            " onclick="showBlessingTowerModal()">
                <span style="font-size: 16px;">⏳</span>
                <span style="color: #ffa500;">🕐 ${timeStr}</span>
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