// wizard-detail-screen.js - Полноэкранное окно мага (финальная версия)
console.log('✅ wizard-detail-screen.js загружен');

// Открыть полноэкранное окно мага
function showWizardDetailScreen(wizard) {
    console.log('🎭 Открытие полноэкранного окна мага:', wizard.name);
    
    // Проверяем, не открыто ли уже окно мага
    const existingScreen = document.getElementById('wizard-detail-screen');
    if (existingScreen) {
        console.log('⚠️ Окно мага уже открыто, обновляем содержимое');
        const wizardIndex = userData.wizards.findIndex(w => w.id === wizard.id);
        if (wizardIndex !== -1) {
            window.currentWizardDetailIndex = wizardIndex;
            renderWizardDetailScreenWithBackground(wizardIndex);
        }
        return;
    }
    
    // Закрываем ВСЕ модалки через централизованную систему
    if (window.Modal && window.Modal.closeAll) {
        window.Modal.closeAll();
    } else if (typeof closeCurrentModal === 'function') {
        closeCurrentModal();
    }
    
    // Скрываем город и UI элементы
    const cityView = document.getElementById('city-view');
    if (cityView) {
        cityView.style.visibility = 'hidden';
    }
    
    const bottomPanel = document.getElementById('bottom-control-panel');
    if (bottomPanel) {
        bottomPanel.style.visibility = 'hidden';
    }
    
    const mobileOverlay = document.getElementById('mobile-ui-overlay');
    if (mobileOverlay) {
        mobileOverlay.style.visibility = 'hidden';
    }
    
    const wizardIndex = userData.wizards.findIndex(w => w.id === wizard.id);
    if (wizardIndex === -1) {
        console.error("Маг не найден в userData");
        return;
    }
    
    // Сохраняем индекс для обновлений
    window.currentWizardDetailIndex = wizardIndex;

    renderWizardDetailScreenWithBackground(wizardIndex);
}

// Рендер/обновление окна мага
function renderWizardDetailScreen(wizardIndex) {
    const wizardData = userData.wizards[wizardIndex];
    if (!wizardData) return;

    // Рассчитываем сопротивления
    if (typeof window.getWizardResistances === 'function') {
        wizardData.magicResistance = window.getWizardResistances(wizardData);
    } else {
        wizardData.magicResistance = { 
            fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0 
        };
    }

    // Получаем активное благословение
    const activeBlessing = window.getActiveBlessing ? window.getActiveBlessing() : null;
    let blessingArmorBonus = 0;
    let blessingDamageBonus = 0;
    let blessingHealthBonus = 0;
    let blessingName = '';
    
    if (activeBlessing && activeBlessing.expires_at > Date.now()) {
        blessingName = activeBlessing.name;
        
        // Парсим эффекты благословения
        if (activeBlessing.effect.type === 'combined') {
            activeBlessing.effect.effects.forEach(effect => {
                switch(effect.type) {
                    case 'armor_bonus':
                        blessingArmorBonus = effect.value;
                        break;
                    case 'damage_bonus':
                        blessingDamageBonus = effect.value;
                        break;
                    case 'health_bonus':
                        blessingHealthBonus = effect.value;
                        break;
                }
            });
        } else {
            switch(activeBlessing.effect.type) {
                case 'armor_bonus':
                    blessingArmorBonus = activeBlessing.effect.value;
                    break;
                case 'damage_bonus':
                    blessingDamageBonus = activeBlessing.effect.value;
                    break;
                case 'health_bonus':
                    blessingHealthBonus = activeBlessing.effect.value;
                    break;
            }
        }
    }

    // Расчет HP с учетом благословения
    const baseHP = wizardData.original_max_hp || 100;
    const towerLevel = window.getBuildingLevel ? window.getBuildingLevel('wizard_tower') : 1;
    const healthMultiplier = window.applyWizardTowerHealthBonus ? window.applyWizardTowerHealthBonus() : 1.0;
    const healthBonusPercent = Math.round((healthMultiplier - 1) * 100);
    
    const level = wizardData.level || 1;
    const levelBonus = level === 20 ? 2.0 : (1 + (Math.max(0, level - 1) * 0.05));
    const levelBonusPercent = Math.round((levelBonus - 1) * 100);
    
    // Применяем все бонусы к HP
    const actualMaxHP = Math.floor(baseHP * levelBonus * healthMultiplier * (1 + blessingHealthBonus));
    const blessingHealthPercent = Math.round(blessingHealthBonus * 100);
    
    // Расчет брони с учетом благословения  
    const baseArmor = wizardData.original_max_armor || wizardData.max_armor || 100;
    const actualMaxArmor = baseArmor + blessingArmorBonus;
    
    // Расчет бонуса к урону от башни и благословения
    const towerDamageMultiplier = window.getWizardTowerDamageBonus ? window.getWizardTowerDamageBonus() : 1.0;
    const totalDamageMultiplier = towerDamageMultiplier * (1 + blessingDamageBonus);
    const towerDamageBonusPercent = Math.round((towerDamageMultiplier - 1) * 100);
    const blessingDamageBonusPercent = Math.round(blessingDamageBonus * 100);
    const totalDamageBonusPercent = Math.round((totalDamageMultiplier - 1) * 100);

    // Получаем функции из script_wizards.js
    const getFactionName = window.getFactionName || ((f) => f);
    const getFactionEmoji = window.getFactionEmoji || ((f) => '✨');
    const getSchoolColor = window.getSchoolColor || ((s) => '#777');
    const findSpellInUserData = window.findSpellInUserData || (() => null);
    const MAX_SPELL_SLOTS = 2;

    // Создаем HTML для заклинаний с учетом всех бонусов
    let spellsHTML = '';
    for (let i = 0; i < 3; i++) {
        if (i < MAX_SPELL_SLOTS) {
            const spellId = wizardData.spells?.[i] || null;
            let spellContent = '';
            
            if (spellId) {
                const spellData = findSpellInUserData(spellId, userData.spells);
                if (spellData) {
                    const baseDamage = window.getSpellDamage ? window.getSpellDamage(spellId, spellData.level) : 0;
                    const finalDamage = Math.floor(baseDamage * totalDamageMultiplier);
                    
                    // Показываем базовый урон и финальный с бонусами
                    const damageDisplay = totalDamageBonusPercent > 0 ? 
                        `${baseDamage} → ${finalDamage}💥` : 
                        `${finalDamage}💥`;
                    
                    spellContent = `
                        <div style="font-size: 13px; font-weight: bold; color: white; margin-bottom: 3px;">${spellData.name}</div>
                        <div style="font-size: 11px; color: #aaa;">Ур.${spellData.level} • ${damageDisplay}</div>
                    `;
                } else {
                    spellContent = `<div style="font-size: 13px; color: white;">${spellId}</div>`;
                }
            } else {
                spellContent = '<div style="font-size: 13px; color: #7289da;">➕ Выбрать</div>';
            }
            
            spellsHTML += `
                <div class="compact-spell-slot ${spellId ? '' : 'empty'}" onclick="openSpellSelection(${wizardIndex}, ${i})">
                    ${spellContent}
                </div>
            `;
        } else {
            spellsHTML += `
                <div class="compact-spell-slot locked">
                    <div style="font-size: 13px; color: #555;">🔒 Закрыто</div>
                </div>
            `;
        }
    }

    const exp = wizardData.experience || 0;
    const expToNext = wizardData.exp_to_next || 50;
    const expPercent = (exp / expToNext) * 100;

    const screenHTML = `
        <div class="wizard-compact-wrapper">
            <!-- Шапка -->
            <div class="wizard-compact-header">
                <button class="back-button" onclick="closeWizardDetailScreen()">
                    ← Назад
                </button>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px; font-weight: bold; color: #7289da;">
                        🧙‍♂️ ${wizardData.name}
                    </span>
                    <button style="background: transparent; border: none; color: #7289da; font-size: 16px; cursor: pointer;" 
                            onclick="startRenameWizard(${wizardIndex})" title="Переименовать">
                        ✏️
                    </button>
                </div>
            </div>
            
            <!-- Основной контент -->
            <div class="wizard-compact-content">
                <!-- Левая колонка -->
                <div class="wizard-compact-left">
                    <!-- Портрет -->
                    <div class="compact-portrait">
                        <div class="compact-avatar">🧙‍♂️</div>
                        <div style="font-size: 13px; color: #aaa; margin-bottom: 8px;">
                            ${getFactionName(wizardData.faction)} ${getFactionEmoji(wizardData.faction)}
                        </div>
                        <span class="compact-level">Уровень ${level}</span>
                    </div>
                    
                    <!-- Опыт -->
                    <div class="compact-exp-bar">
                        <div style="font-size: 11px; color: #aaa; margin-bottom: 5px; display: flex; justify-content: space-between;">
                            <span>Опыт</span>
                            <span>${exp} / ${expToNext}</span>
                        </div>
                        <div class="compact-progress-bar">
                            <div class="compact-progress-fill" style="width: ${expPercent}%"></div>
                        </div>
                    </div>
                    
                    <!-- Кнопки действий -->
                    <button class="compact-button secondary" onclick="showResistancesModal(${wizardIndex})">
                        🛡️ Сопротивления
                    </button>
                    <button class="compact-button secondary" onclick="showInventoryModalCompact(${wizardIndex})">
                        🎒 Инвентарь
                    </button>
                </div>
                
                <!-- Правая колонка -->
                <div class="wizard-compact-right">
                    <!-- Характеристики -->
                    <div>
                        <div class="section-compact-title">⚔️ Характеристики</div>
                        <div class="compact-stats-grid">
                            <div class="compact-stat-box">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">ЗДОРОВЬЕ</div>
                                <div style="font-size: 18px; font-weight: bold; color: #4ade80;">${actualMaxHP}</div>
                                <div style="font-size: 8px; color: #7289da; margin-top: 2px;">
                                    ${levelBonusPercent > 0 ? `+${levelBonusPercent}% ур.` : ''}
                                    ${healthBonusPercent > 0 ? ` +${healthBonusPercent}% 🏰` : ''}
                                    ${blessingHealthPercent > 0 ? ` +${blessingHealthPercent}% ✨` : ''}
                                </div>
                            </div>
                            <div class="compact-stat-box">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">БРОНЯ</div>
                                <div style="font-size: 18px; font-weight: bold; color: #95ffc4;">${actualMaxArmor}</div>
                                <div style="font-size: 8px; color: #7289da; margin-top: 2px;">
                                    ${blessingArmorBonus > 0 ? `+${blessingArmorBonus} ✨` : 'Защита'}
                                </div>
                            </div>
                            <div class="compact-stat-box">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">УРОН</div>
                                <div style="font-size: 18px; font-weight: bold; color: #fbbf24;">+${totalDamageBonusPercent}%</div>
                                <div style="font-size: 8px; color: #7289da; margin-top: 2px;">
                                    ${towerDamageBonusPercent > 0 ? `🏰 +${towerDamageBonusPercent}%` : ''}
                                    ${blessingDamageBonusPercent > 0 ? ` ✨ +${blessingDamageBonusPercent}%` : ''}
                                    ${(towerDamageBonusPercent === 0 && blessingDamageBonusPercent === 0) ? 'Базовый' : ''}
                                </div>
                            </div>
                        </div>
                        ${blessingName ? `
                            <div style="margin-top: 10px; padding: 8px; background: rgba(114, 137, 218, 0.1); border-radius: 6px; border: 1px solid rgba(114, 137, 218, 0.3);">
                                <div style="font-size: 11px; color: #7289da; text-align: center;">
                                    ${activeBlessing.icon} ${blessingName} активно
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Заклинания -->
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div class="section-compact-title">✨ Заклинания</div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${spellsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Создаем или обновляем экран
    let screen = document.getElementById('wizard-detail-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'wizard-detail-screen';
        document.body.appendChild(screen);
    }
    
    screen.innerHTML = screenHTML;
    screen.classList.add('active');
    
    console.log('✅ Окно мага отрендерено');
}

// Обновить только заклинания (без перерисовки всего окна)
function updateWizardSpellSlots() {
    if (typeof window.currentWizardDetailIndex === 'undefined') return;
    
    // Просто перерисовываем окно
    renderWizardDetailScreen(window.currentWizardDetailIndex);
}

// Показать модалку сопротивлений
function showResistancesModal(wizardIndex) {
    const wizard = userData.wizards[wizardIndex];
    if (!wizard) return;
    
    const resistances = wizard.magicResistance || {};
    const getFactionEmoji = window.getFactionEmoji || ((f) => '✨');
    const getSchoolColor = window.getSchoolColor || ((s) => '#777');
    
    const resistancesHTML = Object.entries(resistances).map(([school, value]) => `
        <div style="
            padding: 15px;
            background: ${getSchoolColor(school)}20;
            border-radius: 8px;
            text-align: center;
        ">
            <div style="font-size: 32px; margin-bottom: 5px;">${getFactionEmoji(school)}</div>
            <div style="font-size: 14px; color: white; font-weight: bold;">${value}%</div>
            <div style="font-size: 11px; color: #aaa; text-transform: capitalize;">${school}</div>
        </div>
    `).join('');
    
    const modalContent = `
        <div style="
            max-width: 400px;
            background: linear-gradient(145deg, #2c2c3d, #1f1f2e);
            border-radius: 15px;
            padding: 20px;
            color: white;
        ">
            <h3 style="margin: 0 0 15px 0; color: #7289da; text-align: center;">🛡️ Сопротивления магии</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                ${resistancesHTML}
            </div>
            <button onclick="closeCurrentModal()" style="
                width: 100%;
                padding: 12px;
                background: #7289da;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
            ">Закрыть</button>
        </div>
    `;
    
    // Используем централизованную систему модалок
    if (window.Modal && window.Modal.show) {
        window.Modal.show(modalContent);
    } else {
        // Фолбэк на старую систему если Modal недоступен
        const modalHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1001;
            ">
                ${modalContent}
            </div>
            <div onclick="closeResistancesModal()" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            "></div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.id = 'resistances-modal';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }
}

function closeResistancesModal() {
    const modal = document.getElementById('resistances-modal');
    if (modal) {
        modal.remove();
    }
}

// Показать модалку инвентаря
function showInventoryModalCompact(wizardIndex) {
    const modalContent = `
        <div style="
            max-width: 350px;
            background: linear-gradient(145deg, #2c2c3d, #1f1f2e);
            border-radius: 15px;
            padding: 20px;
            color: white;
        ">
            <h3 style="margin: 0 0 15px 0; color: #7289da; text-align: center;">🎒 Инвентарь</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                <div style="background: #2a2a3a; height: 90px; border: 2px dashed #444; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666;">
                    <div style="font-size: 28px;">👑</div>
                    <div style="font-size: 11px;">Шлем</div>
                    <div style="font-size: 9px; color: #555;">(скоро)</div>
                </div>
                <div style="background: #2a2a3a; height: 90px; border: 2px dashed #444; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666;">
                    <div style="font-size: 28px;">👕</div>
                    <div style="font-size: 11px;">Броня</div>
                    <div style="font-size: 9px; color: #555;">(скоро)</div>
                </div>
                <div style="background: #2a2a3a; height: 90px; border: 2px dashed #444; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666;">
                    <div style="font-size: 28px;">👟</div>
                    <div style="font-size: 11px;">Обувь</div>
                    <div style="font-size: 9px; color: #555;">(скоро)</div>
                </div>
                <div style="background: #2a2a3a; height: 90px; border: 2px dashed #444; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666;">
                    <div style="font-size: 28px;">💍</div>
                    <div style="font-size: 11px;">Кольцо</div>
                    <div style="font-size: 9px; color: #555;">(скоро)</div>
                </div>
            </div>
            <p style="text-align: center; color: #aaa; font-size: 11px; margin-bottom: 15px;">
                🔨 Откроется когда построишь Кузницу
            </p>
            <button onclick="closeCurrentModal()" style="
                width: 100%;
                padding: 12px;
                background: #7289da;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
            ">Закрыть</button>
        </div>
    `;
    
    // Используем централизованную систему модалок
    if (window.Modal && window.Modal.show) {
        window.Modal.show(modalContent);
    } else {
        // Фолбэк на старую систему если Modal недоступен
        const modalHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1001;
            ">
                ${modalContent}
            </div>
            <div onclick="closeInventoryModalCompact()" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            "></div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.id = 'inventory-modal-compact';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }
}

function closeInventoryModalCompact() {
    const modal = document.getElementById('inventory-modal-compact');
    if (modal) {
        modal.remove();
    }
}

// Закрыть полноэкранное окно мага (по паттерну поля боя)
function closeWizardDetailScreen() {
    console.log('🚪 Закрытие окна мага, возврат в город');
    
    // Закрываем все модалки если они открыты
    if (window.Modal && window.Modal.closeAll) {
        window.Modal.closeAll();
    }
    
    // Удаляем все модалки связанные с окном мага
    const modalsToRemove = ['resistances-modal', 'inventory-modal-compact'];
    modalsToRemove.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    });
    
    // Удаляем окно мага
    const screen = document.getElementById('wizard-detail-screen');
    if (screen) {
        // Добавляем анимацию закрытия
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            screen.remove();
            console.log('✅ wizard-detail-screen удален');
        }, 300);
    }
    
    // Очищаем индекс
    delete window.currentWizardDetailIndex;
    
    // Очищаем currentModal
    if (window.currentModal) {
        window.currentModal = null;
    }
    
    // Восстанавливаем видимость всех элементов города
    const elementsToShow = [
        'game-area',
        'city-view', 
        'bottom-control-panel',
        'mobile-ui-overlay'
    ];
    
    elementsToShow.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            console.log(`✅ Восстановлен элемент: ${elementId}`);
        }
    });
    
    // Перерисовываем город с небольшой задержкой для плавности
    if (window.userData && window.userData.faction) {
        requestAnimationFrame(() => {
            if (typeof window.switchToCityView === 'function') {
                window.switchToCityView(window.userData.faction);
                console.log('✅ Город перерисован');
            }
        });
    }
    
    console.log('✅ Город показан, окно мага закрыто');
}

function renderWizardDetailScreenWithBackground(wizardIndex) {
    const wizardData = userData.wizards[wizardIndex];
    if (!wizardData) return;

    // Рассчитываем сопротивления
    if (typeof window.getWizardResistances === 'function') {
        wizardData.magicResistance = window.getWizardResistances(wizardData);
    } else {
        wizardData.magicResistance = {
            fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0
        };
    }

    // Получаем активное благословение
    const activeBlessing = window.getActiveBlessing ? window.getActiveBlessing() : null;
    let blessingArmorBonus = 0;
    let blessingDamageBonus = 0;
    let blessingHealthBonus = 0;

    if (activeBlessing && activeBlessing.expires_at > Date.now()) {
        if (activeBlessing.effect.type === 'combined') {
            activeBlessing.effect.effects.forEach(effect => {
                switch(effect.type) {
                    case 'armor_bonus':
                        blessingArmorBonus = effect.value;
                        break;
                    case 'damage_bonus':
                        blessingDamageBonus = effect.value;
                        break;
                    case 'health_bonus':
                        blessingHealthBonus = effect.value;
                        break;
                }
            });
        } else {
            switch(activeBlessing.effect.type) {
                case 'armor_bonus':
                    blessingArmorBonus = activeBlessing.effect.value;
                    break;
                case 'damage_bonus':
                    blessingDamageBonus = activeBlessing.effect.value;
                    break;
                case 'health_bonus':
                    blessingHealthBonus = activeBlessing.effect.value;
                    break;
            }
        }
    }

    // Расчет характеристик
    const baseHP = wizardData.original_max_hp || 100;
    const towerLevel = window.getBuildingLevel ? window.getBuildingLevel('wizard_tower') : 1;
    const healthMultiplier = window.applyWizardTowerHealthBonus ? window.applyWizardTowerHealthBonus() : 1.0;
    const healthBonusPercent = Math.round((healthMultiplier - 1) * 100);

    const level = wizardData.level || 1;
    const levelBonus = level === 20 ? 2.0 : (1 + (Math.max(0, level - 1) * 0.05));
    const levelBonusPercent = Math.round((levelBonus - 1) * 100);

    const actualMaxHP = Math.floor(baseHP * levelBonus * healthMultiplier * (1 + blessingHealthBonus));
    const blessingHealthPercent = Math.round(blessingHealthBonus * 100);

    const baseArmor = wizardData.original_max_armor || wizardData.max_armor || 100;
    const actualMaxArmor = baseArmor + blessingArmorBonus;

    const towerDamageMultiplier = window.getWizardTowerDamageBonus ? window.getWizardTowerDamageBonus() : 1.0;
    const totalDamageMultiplier = towerDamageMultiplier * (1 + blessingDamageBonus);
    const towerDamageBonusPercent = Math.round((towerDamageMultiplier - 1) * 100);
    const blessingDamageBonusPercent = Math.round(blessingDamageBonus * 100);
    const totalDamageBonusPercent = Math.round((totalDamageMultiplier - 1) * 100);

    const exp = wizardData.experience || 0;
    const expToNext = wizardData.exp_to_next || 50;
    const expPercent = (exp / expToNext) * 100;

    // Получаем функции
    const findSpellInUserData = window.findSpellInUserData || (() => null);
    const MAX_SPELL_SLOTS = 2;

    // Формируем HTML для сетки 2x3
    let gridHTML = '';

    // РЯД 0: Здоровье, Броня, Урон
    // Здоровье
    const healthBonusHTML = [
        levelBonusPercent > 0 ? `+${levelBonusPercent}% ур.` : '',
        healthBonusPercent > 0 ? `+${healthBonusPercent}% 🏰` : '',
        blessingHealthPercent > 0 ? `+${blessingHealthPercent}% ✨` : ''
    ].filter(b => b).join(' ');

    gridHTML += `
        <div class="wizard-bg-cell health">
            <div class="wizard-bg-cell-label">Здоровье</div>
            <div class="wizard-bg-cell-value">${actualMaxHP}</div>
            ${healthBonusHTML ? `<div class="wizard-bg-cell-bonus">${healthBonusHTML}</div>` : ''}
        </div>
    `;

    // Броня
    gridHTML += `
        <div class="wizard-bg-cell armor">
            <div class="wizard-bg-cell-label">Броня</div>
            <div class="wizard-bg-cell-value">${actualMaxArmor}</div>
            ${blessingArmorBonus > 0 ? `<div class="wizard-bg-cell-bonus">+${blessingArmorBonus} ✨</div>` : ''}
        </div>
    `;

    // Урон
    const damageBonusHTML = [
        towerDamageBonusPercent > 0 ? `🏰 +${towerDamageBonusPercent}%` : '',
        blessingDamageBonusPercent > 0 ? `✨ +${blessingDamageBonusPercent}%` : ''
    ].filter(b => b).join(' ') || 'Базовый';

    gridHTML += `
        <div class="wizard-bg-cell damage">
            <div class="wizard-bg-cell-label">Урон</div>
            <div class="wizard-bg-cell-value">+${totalDamageBonusPercent}%</div>
            <div class="wizard-bg-cell-bonus">${damageBonusHTML}</div>
        </div>
    `;

    // РЯД 1: Заклинания
    for (let i = 0; i < 3; i++) {
        if (i < MAX_SPELL_SLOTS) {
            const spellId = wizardData.spells?.[i] || null;

            if (spellId) {
                const spellData = findSpellInUserData(spellId, userData.spells);
                if (spellData) {
                    const baseDamage = window.getSpellDamage ? window.getSpellDamage(spellId, spellData.level) : 0;
                    const finalDamage = Math.floor(baseDamage * totalDamageMultiplier);
                    const damageDisplay = totalDamageBonusPercent > 0 ?
                        `${baseDamage} → ${finalDamage}💥` :
                        `${finalDamage}💥`;

                    gridHTML += `
                        <div class="wizard-bg-cell spell" onclick="openSpellSelection(${wizardIndex}, ${i})">
                            <div class="wizard-bg-spell-name">${spellData.name}</div>
                            <div class="wizard-bg-spell-info">Ур.${spellData.level} • ${damageDisplay}</div>
                        </div>
                    `;
                } else {
                    gridHTML += `
                        <div class="wizard-bg-cell spell" onclick="openSpellSelection(${wizardIndex}, ${i})">
                            <div class="wizard-bg-spell-name">${spellId}</div>
                        </div>
                    `;
                }
            } else {
                gridHTML += `
                    <div class="wizard-bg-cell spell empty" onclick="openSpellSelection(${wizardIndex}, ${i})">
                        <div class="wizard-bg-spell-name">➕ Выбрать</div>
                    </div>
                `;
            }
        } else {
            gridHTML += `
                <div class="wizard-bg-cell spell locked">
                    <div class="wizard-bg-cell-value">🔒</div>
                    <div class="wizard-bg-spell-info">Закрыто</div>
                </div>
            `;
        }
    }

    // Создаем контейнер с фоном
    const faction = wizardData.faction || 'fire';
    const screenHTML = `
        <div class="wizard-bg-overlay" onclick="closeWizardDetailScreen()"></div>
        <div class="wizard-bg-container ${faction}">
            <!-- Кнопка закрытия -->
            <button class="wizard-bg-close-button" onclick="closeWizardDetailScreen()">
                ← Назад
            </button>

            <!-- Имя мага -->
            <div class="wizard-bg-name">
                <span>${wizardData.name}</span>
                <button class="wizard-bg-name-edit" onclick="startRenameWizard(${wizardIndex})" title="Переименовать">
                    ✏️
                </button>
            </div>

            <!-- Уровень -->
            <div class="wizard-bg-level">
                Уровень ${level}
            </div>

            <!-- Полоса опыта -->
            <div class="wizard-bg-exp-bar">
                <div class="wizard-bg-exp-text">${exp} / ${expToNext}</div>
                <div class="wizard-bg-exp-progress">
                    <div class="wizard-bg-exp-fill" style="width: ${expPercent}%"></div>
                </div>
            </div>

            <!-- Кнопка сопротивлений -->
            <button class="wizard-bg-resistance-button" onclick="showResistancesModal(${wizardIndex})">
                🛡️ Сопротивления
            </button>

            <!-- Кнопка инвентаря -->
            <button class="wizard-bg-inventory-button" onclick="showInventoryModalCompact(${wizardIndex})">
                🎒 Инвентарь
            </button>

            <!-- Сетка 2x3 -->
            <div class="wizard-bg-stats-grid">
                ${gridHTML}
            </div>
        </div>
    `;

    // Создаем или обновляем экран
    let screen = document.getElementById('wizard-detail-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'wizard-detail-screen';
        document.body.appendChild(screen);
    }

    screen.innerHTML = screenHTML;
    screen.classList.add('active', 'with-background');

    console.log('✅ Окно мага с фоном отрендерено');
}

// Экспорт функций
window.showWizardDetailScreen = showWizardDetailScreen;
window.closeWizardDetailScreen = closeWizardDetailScreen;
window.renderWizardDetailScreenWithBackground = renderWizardDetailScreenWithBackground;
window.updateWizardSpellSlots = updateWizardSpellSlots;
window.showResistancesModal = showResistancesModal;
window.closeResistancesModal = closeResistancesModal;
window.showInventoryModalCompact = showInventoryModalCompact;
window.closeInventoryModalCompact = closeInventoryModalCompact;

console.log('✅ Функции полноэкранного окна мага экспортированы');