// wizard-detail-screen.js - Полноэкранное окно мага (финальная версия)

// Открыть полноэкранное окно мага
function showWizardDetailScreen(wizard) {
    console.log('🎭 Открытие полноэкранного окна мага:', wizard.name);

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Проверяем, не открыто ли уже окно мага
    const existingScreen = document.getElementById('wizard-detail-screen');
    if (existingScreen) {
        console.log('⚠️ Окно мага уже открыто, обновляем содержимое без закрытия модалок');
        const wizardIndex = userData.wizards.findIndex(w => w.id === wizard.id);
        if (wizardIndex !== -1) {
            window.currentWizardDetailIndex = wizardIndex;
            renderWizardDetailScreenWithBackground(wizardIndex);
        }
        return;
    }

    // Закрываем ВСЕ модалки через централизованную систему (только при ПЕРВОМ открытии окна мага)
    console.log('🎭 Первое открытие окна мага - закрываем все модалки');
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
            fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0, light: 0, dark: 0
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
    const levelBonus = level === 40 ? 3.0 : (1 + (Math.max(0, level - 1) * 0.05));
    const levelBonusPercent = Math.round((levelBonus - 1) * 100);

    // Бонус урона от уровня (+1% за уровень, +40% на 40)
    const levelDamageBonus = typeof window.getDamageBonusFromLevel === 'function'
        ? window.getDamageBonusFromLevel(wizardData) : 1.0;
    const levelDamageBonusPercent = Math.round((levelDamageBonus - 1) * 100);

    // Бонусы гильдии
    const guildBonuses = window.guildManager?.currentGuild ? window.guildManager.getGuildBonuses() : null;
    const guildHpBonusPercent = guildBonuses?.hpBonus || 0;
    const guildDamageBonusPercent = guildBonuses?.damageBonus || 0;
    const guildResistances = guildBonuses?.resistances || {};

    // Применяем все бонусы к HP (включая гильдию)
    const guildHpMultiplier = 1 + (guildHpBonusPercent / 100);
    const actualMaxHP = Math.floor(baseHP * levelBonus * healthMultiplier * (1 + blessingHealthBonus) * guildHpMultiplier);
    const blessingHealthPercent = Math.round(blessingHealthBonus * 100);

    // Расчет брони с учетом благословения
    const baseArmor = wizardData.original_max_armor || wizardData.max_armor || 100;
    const actualMaxArmor = baseArmor + blessingArmorBonus;

    // Расчет бонуса к урону от уровня, башни, благословения и гильдии
    const towerDamageMultiplier = window.getWizardTowerDamageBonus ? window.getWizardTowerDamageBonus() : 1.0;
    const guildDamageMultiplier = 1 + (guildDamageBonusPercent / 100);
    const totalDamageMultiplier = levelDamageBonus * towerDamageMultiplier * (1 + blessingDamageBonus) * guildDamageMultiplier;
    const towerDamageBonusPercent = Math.round((towerDamageMultiplier - 1) * 100);
    const blessingDamageBonusPercent = Math.round(blessingDamageBonus * 100);
    const totalDamageBonusPercent = Math.round((totalDamageMultiplier - 1) * 100);

    // Сохраняем данные для попапов статов
    window.currentWizardStats = {
        hp: {
            base: baseHP,
            final: actualMaxHP,
            levelBonus: levelBonusPercent,
            towerBonus: healthBonusPercent,
            guildBonus: guildHpBonusPercent,
            blessingBonus: blessingHealthPercent
        },
        armor: {
            base: baseArmor,
            final: actualMaxArmor,
            blessingBonus: blessingArmorBonus
        },
        damage: {
            final: totalDamageBonusPercent,
            levelBonus: levelDamageBonusPercent,
            towerBonus: towerDamageBonusPercent,
            guildBonus: guildDamageBonusPercent,
            blessingBonus: blessingDamageBonusPercent
        }
    };

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

                    // Используем SPELL_NAMES как источник актуальных названий
                    const spellName = window.SPELL_NAMES?.[spellId] || spellData.name || spellId;

                    spellContent = `
                        <div style="font-size: 13px; font-weight: bold; color: white; margin-bottom: 3px;">${spellName}</div>
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
                    <span id="wizard-name-display" style="font-size: 18px; font-weight: bold; color: #7289da;">
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
                            <div class="compact-stat-box" onclick="showStatBreakdown('hp')" style="cursor: pointer;">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">❤️ ЗДОРОВЬЕ</div>
                                <div style="font-size: 20px; font-weight: bold; color: #4ade80;">${actualMaxHP}</div>
                                <div style="font-size: 8px; color: #666; margin-top: 2px;">нажми для деталей</div>
                            </div>
                            <div class="compact-stat-box" onclick="showStatBreakdown('armor')" style="cursor: pointer;">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">🛡️ БРОНЯ</div>
                                <div style="font-size: 20px; font-weight: bold; color: #95ffc4;">${actualMaxArmor}</div>
                                <div style="font-size: 8px; color: #666; margin-top: 2px;">нажми для деталей</div>
                            </div>
                            <div class="compact-stat-box" onclick="showStatBreakdown('damage')" style="cursor: pointer;">
                                <div style="font-size: 9px; color: #aaa; margin-bottom: 3px;">⚔️ УРОН</div>
                                <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">+${totalDamageBonusPercent}%</div>
                                <div style="font-size: 8px; color: #666; margin-top: 2px;">нажми для деталей</div>
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
    
}

// Обновить только заклинания (без перерисовки всего окна)
function updateWizardSpellSlots() {
    if (typeof window.currentWizardDetailIndex === 'undefined') return;

    // Используем ту же функцию рендера, что и при открытии окна
    renderWizardDetailScreenWithBackground(window.currentWizardDetailIndex);
}

// Показать модалку сопротивлений
function showResistancesModal(wizardIndex) {
    const wizard = userData.wizards[wizardIndex];
    if (!wizard) return;

    const resistances = wizard.magicResistance || {};
    const getFactionEmoji = window.getFactionEmoji || ((f) => '✨');
    const getSchoolColor = window.getSchoolColor || ((s) => '#777');

    // Получаем сопротивления от гильдии
    const guildBonuses = window.guildManager?.currentGuild ? window.guildManager.getGuildBonuses() : null;
    const guildResistances = guildBonuses?.resistances || {};
    const hasGuildResistances = Object.values(guildResistances).some(v => v > 0);

    const schoolNames = {
        fire: 'Огонь', water: 'Вода', wind: 'Ветер',
        earth: 'Земля', nature: 'Природа', poison: 'Яд',
        light: 'Свет', dark: 'Тьма', necromant: 'Некромант'
    };

    const resistancesHTML = Object.entries(resistances).map(([school, value]) => {
        const guildValue = guildResistances[school] || 0;
        const totalValue = value + guildValue;
        return `
        <div style="
            padding: 6px 4px;
            background: ${getSchoolColor(school)}20;
            border-radius: 6px;
            text-align: center;
            min-width: 50px;
        ">
            <div style="font-size: 9px; color: #aaa; margin-bottom: 2px;">${getFactionEmoji(school)} ${schoolNames[school] || school}</div>
            <div style="font-size: 16px; color: white; font-weight: bold;">${totalValue}%</div>
            ${guildValue > 0 ? `<div style="font-size: 8px; color: #ffa500; margin-top: 1px;">🏰+${guildValue}%</div>` : ''}
        </div>
    `}).join('');

    // Секция гильдейских сопротивлений (компактная)
    const guildResistHTML = hasGuildResistances ? `
        <div style="margin-top: 8px; padding: 6px 10px; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 6px;">
            <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; align-items: center;">
                <span style="font-size: 9px; color: #ffa500;">🏰</span>
                ${Object.entries(guildResistances).filter(([_, v]) => v > 0).map(([school, value]) => `
                    <span style="font-size: 9px; color: #ffa500;">${getFactionEmoji(school)}+${value}%</span>
                `).join('')}
            </div>
        </div>
    ` : '';

    // Используем фон мага
    const faction = wizard.faction || 'fire';
    const imagePath = `images/wizards/${faction}/window-bg.webp`;

    // Создаём модалку с фоном как у окна мага
    const modal = document.createElement('div');
    modal.id = 'resistances-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    modal.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <img src="${imagePath}" style="
                max-width: 90vw;
                max-height: 90vh;
                width: auto;
                height: auto;
            " id="resist-modal-bg">
            <div id="resist-modal-overlay" style="
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
                color: white;
            ">
                <div style="font-size: 12px; color: #7289da; font-weight: bold; margin-bottom: 8px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">🛡️ Сопротивления</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 280px;">
                    ${resistancesHTML}
                </div>
                ${guildResistHTML}
                <button onclick="closeResistancesModal()" style="
                    padding: 8px 20px;
                    margin-top: 10px;
                    background: rgba(114, 137, 218, 0.9);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        </div>
    `;

    // Закрытие по клику на фон
    modal.onclick = (e) => {
        if (e.target === modal) closeResistancesModal();
    };

    document.body.appendChild(modal);

    // Позиционируем overlay после загрузки изображения
    const img = document.getElementById('resist-modal-bg');
    const overlay = document.getElementById('resist-modal-overlay');
    const setupOverlay = () => {
        const rect = img.getBoundingClientRect();
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
    };
    img.onload = setupOverlay;
    if (img.complete) setupOverlay();
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
                ⏳ Система снаряжения в разработке
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
        }
    });

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }

    // Перерисовываем город с небольшой задержкой для плавности
    if (window.userData && window.userData.faction) {
        requestAnimationFrame(() => {
            if (typeof window.switchToCityView === 'function') {
                window.switchToCityView(window.userData.faction);
            }
        });
    }
    
}

function renderWizardDetailScreenWithBackground(wizardIndex) {
    const wizardData = userData.wizards[wizardIndex];
    if (!wizardData) return;

    // Подготовка данных о маге (расчеты остаются теми же)
    const wizardStats = calculateWizardStats(wizardData);

    // Создаем или обновляем экран
    let screen = document.getElementById('wizard-detail-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'wizard-detail-screen';
        document.body.appendChild(screen);
    }

    screen.classList.add('active', 'with-background');

    const faction = wizardData.faction || 'fire';
    const imagePath = `images/wizards/${faction}/window-bg.webp`;

    // Создаем HTML структуру по паттерну библиотеки
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="wizard-bg-image" id="wizard-bg-image" src="${imagePath}" alt="Окно мага">
            <div class="wizard-bg-overlay-container" id="wizard-ui-overlay"></div>
        </div>
    `;

    const img = document.getElementById('wizard-bg-image');

    // Настройка UI после загрузки изображения
    img.onload = () => setupWizardUI(wizardIndex, wizardStats);
    if (img.complete) setupWizardUI(wizardIndex, wizardStats);

}

// Расчет всех характеристик мага (вынесено в отдельную функцию)
// Расчет всех характеристик мага (вынесено в отдельную функцию)
function calculateWizardStats(wizardData) {
    // Рассчитываем сопротивления
    if (typeof window.getWizardResistances === 'function') {
        wizardData.magicResistance = window.getWizardResistances(wizardData);
    } else {
        wizardData.magicResistance = {
            fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0, light: 0, dark: 0
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

    // Бонусы гильдии
    const guildBonuses = window.guildManager?.currentGuild ? window.guildManager.getGuildBonuses() : null;
    const guildHpBonusPercent = guildBonuses?.hpBonus || 0;
    const guildDamageBonusPercent = guildBonuses?.damageBonus || 0;

    // Расчет характеристик
    const baseHP = wizardData.original_max_hp || 100;
    const healthMultiplier = window.applyWizardTowerHealthBonus ? window.applyWizardTowerHealthBonus() : 1.0;
    const healthBonusPercent = Math.round((healthMultiplier - 1) * 100);

    const level = wizardData.level || 1;
    const levelBonus = level === 40 ? 3.0 : (1 + (Math.max(0, level - 1) * 0.05));
    const levelBonusPercent = Math.round((levelBonus - 1) * 100);

    // Бонус урона от уровня (+1% за уровень, +40% на 40)
    const levelDamageBonus = typeof window.getDamageBonusFromLevel === 'function'
        ? window.getDamageBonusFromLevel(wizardData) : 1.0;
    const levelDamageBonusPercent = Math.round((levelDamageBonus - 1) * 100);

    // HP с учетом гильдии
    const guildHpMultiplier = 1 + (guildHpBonusPercent / 100);
    const actualMaxHP = Math.floor(baseHP * levelBonus * healthMultiplier * (1 + blessingHealthBonus) * guildHpMultiplier);
    const blessingHealthPercent = Math.round(blessingHealthBonus * 100);

    const baseArmor = wizardData.original_max_armor || wizardData.max_armor || 100;
    const actualMaxArmor = baseArmor + blessingArmorBonus;

    // Урон с учетом уровня, башни, благословения и гильдии
    const towerDamageMultiplier = window.getWizardTowerDamageBonus ? window.getWizardTowerDamageBonus() : 1.0;
    const guildDamageMultiplier = 1 + (guildDamageBonusPercent / 100);
    const totalDamageMultiplier = levelDamageBonus * towerDamageMultiplier * (1 + blessingDamageBonus) * guildDamageMultiplier;
    const towerDamageBonusPercent = Math.round((towerDamageMultiplier - 1) * 100);
    const blessingDamageBonusPercent = Math.round(blessingDamageBonus * 100);
    const totalDamageBonusPercent = Math.round((totalDamageMultiplier - 1) * 100);

    // Сохраняем данные для попапов статов
    window.currentWizardStats = {
        hp: {
            base: baseHP,
            final: actualMaxHP,
            levelBonus: levelBonusPercent,
            towerBonus: healthBonusPercent,
            guildBonus: guildHpBonusPercent,
            blessingBonus: blessingHealthPercent
        },
        armor: {
            base: baseArmor,
            final: actualMaxArmor,
            blessingBonus: blessingArmorBonus
        },
        damage: {
            final: totalDamageBonusPercent,
            levelBonus: levelDamageBonusPercent,
            towerBonus: towerDamageBonusPercent,
            guildBonus: guildDamageBonusPercent,
            blessingBonus: blessingDamageBonusPercent
        }
    };

    const exp = wizardData.experience || 0;
    const expToNext = wizardData.exp_to_next || 50;
    const expPercent = (exp / expToNext) * 100;

    return {
        level, exp, expToNext, expPercent,
        actualMaxHP, actualMaxArmor,
        healthBonusHTML: [
            levelBonusPercent > 0 ? `+${levelBonusPercent}% ур.` : '',
            healthBonusPercent > 0 ? `+${healthBonusPercent}% 🏯` : '',
            guildHpBonusPercent > 0 ? `+${guildHpBonusPercent}% 🏰` : '',
            blessingHealthPercent > 0 ? `+${blessingHealthPercent}% ✨` : ''
        ].filter(b => b).join(' '),
        armorBonusHTML: blessingArmorBonus > 0 ? `+${blessingArmorBonus} ✨` : '',
        damageBonusHTML: [
            levelDamageBonusPercent > 0 ? `+${levelDamageBonusPercent}% ур.` : '',
            towerDamageBonusPercent > 0 ? `🏯 +${towerDamageBonusPercent}%` : '',
            guildDamageBonusPercent > 0 ? `🏰 +${guildDamageBonusPercent}%` : '',
            blessingDamageBonusPercent > 0 ? `✨ +${blessingDamageBonusPercent}%` : ''
        ].filter(b => b).join(' ') || 'Базовый',
        totalDamageBonusPercent,
        totalDamageMultiplier
    };
}

// Создание UI с масштабированием (ТОЧНЫЙ паттерн из city-view-system.js и city-clickable-system.js)
function setupWizardUI(wizardIndex, wizardStats) {
    const wizardData = userData.wizards[wizardIndex];
    if (!wizardData) return;

    const img = document.getElementById('wizard-bg-image');
    const overlay = document.getElementById('wizard-ui-overlay');
    if (!img || !overlay) return;

    const container = img.parentElement;

    // Оригинальный размер фона 768x512
    const imageWidth = 768;
    const imageHeight = 512;

    // ВАЖНО: Применяем ТОЧНО ТОТ ЖЕ паттерн что и в city-view-system.js
    const isMobile = typeof isMobileDevice === 'function' ? isMobileDevice() : false;

    if (isMobile) {
        // МОБИЛЬНЫЙ: явные размеры как в city-view-system.js (строки 47-68)
        const screenHeight = window.innerHeight;
        const aspectRatio = imageWidth / imageHeight;
        const scaledHeight = screenHeight;
        const scaledWidth = scaledHeight * aspectRatio;

        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 50% !important;
            transform: translateX(-50%);
            width: ${scaledWidth}px;
            height: ${scaledHeight}px;
            z-index: 0;
        `;
    } else {
        // ДЕСКТОП: object-fit contain как в city-view-system.js (строки 69-79)
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 0;
        `;
    }

    // Расчет масштаба ТОЧНО как в city-clickable-system.js (строки 60-96)
    let scaleX, scaleY, offsetX = 0;

    if (isMobile) {
        // МОБИЛЬНЫЙ: масштаб по высоте экрана
        const screenHeight = window.innerHeight;
        const aspectRatio = imageWidth / imageHeight;

        const scaledHeight = screenHeight;
        const scaledWidth = scaledHeight * aspectRatio;

        scaleX = scaledWidth / imageWidth;
        scaleY = scaledHeight / imageHeight;

        // Смещение для центрирования
        const containerWidth = container.getBoundingClientRect().width;
        offsetX = (containerWidth - scaledWidth) / 2;
    } else {
        // ДЕСКТОП: object-fit contain
        const containerRect = container.getBoundingClientRect();
        const containerAspect = containerRect.width / containerRect.height;
        const imageAspect = imageWidth / imageHeight;

        if (containerAspect > imageAspect) {
            // Ограничено по высоте
            scaleY = containerRect.height / imageHeight;
            scaleX = scaleY;
            offsetX = (containerRect.width - imageWidth * scaleX) / 2;
        } else {
            // Ограничено по ширине
            scaleX = containerRect.width / imageWidth;
            scaleY = scaleX;
        }
    }

    // Overlay занимает ВЕСЬ контейнер (как SVG у города)
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.innerHTML = '';

    // Оригинальные координаты для 768x512 (из первой версии)
    // Применяем масштабирование ТОЧНО КАК У ГОРОДА: x = (originalX * scaleX) + offsetX, y = originalY * scaleY

    // === КНОПКА ЗАКРЫТИЯ (внизу: left: 10px, bottom area, width: 160px, height: 56px) ===
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wizard-bg-close-button';
    closeBtn.textContent = '← Назад';
    closeBtn.style.cssText = `
        left: ${(10 * scaleX) + offsetX}px;
        top: ${(512 - 66) * scaleY}px;
        width: ${160 * scaleX}px;
        height: ${56 * scaleY}px;
        font-size: ${22 * Math.min(scaleX, scaleY)}px;
    `;
    closeBtn.onclick = closeWizardDetailScreen;
    overlay.appendChild(closeBtn);

    // === ИМЯ МАГА (left: 236px, top: 134px, width: 437px, height: 41px) ===
    const nameDiv = document.createElement('div');
    nameDiv.className = 'wizard-bg-name';
    nameDiv.style.cssText = `
        left: ${(236 * scaleX) + offsetX}px;
        top: ${134 * scaleY}px;
        width: ${437 * scaleX}px;
        height: ${41 * scaleY}px;
        font-size: ${22 * Math.min(scaleX, scaleY)}px;
    `;
    nameDiv.innerHTML = `
        <span id="wizard-name-display">${wizardData.name}</span>
        <button class="wizard-bg-name-edit" onclick="startRenameWizard(${wizardIndex})" title="Переименовать" style="font-size: ${18 * Math.min(scaleX, scaleY)}px;">
            ✏️
        </button>
    `;
    overlay.appendChild(nameDiv);

    // === ЛЕВАЯ КОЛОНКА ===
    // Оригинальные координаты из первой версии
    // Уровень: left: 110px, top: 217px, width: 102px, height: 30px
    const levelDiv = document.createElement('div');
    levelDiv.className = 'wizard-bg-level';
    levelDiv.textContent = `Уровень ${wizardStats.level}`;
    levelDiv.style.cssText = `
        left: ${(110 * scaleX) + offsetX}px;
        top: ${217 * scaleY}px;
        width: ${102 * scaleX}px;
        height: ${30 * scaleY}px;
        font-size: ${16 * Math.min(scaleX, scaleY)}px;
    `;
    overlay.appendChild(levelDiv);

    // Полоса опыта: left: 110px, top: 261px, width: 178px, height: 27px
    const expBar = document.createElement('div');
    expBar.className = 'wizard-bg-exp-bar';
    expBar.style.cssText = `
        left: ${(110 * scaleX) + offsetX}px;
        top: ${261 * scaleY}px;
        width: ${178 * scaleX}px;
        height: ${27 * scaleY}px;
    `;
    expBar.innerHTML = `
        <div class="wizard-bg-exp-text" style="font-size: ${11 * Math.min(scaleX, scaleY)}px;">${wizardStats.exp} / ${wizardStats.expToNext}</div>
        <div class="wizard-bg-exp-progress">
            <div class="wizard-bg-exp-fill" style="width: ${wizardStats.expPercent}%"></div>
        </div>
    `;
    overlay.appendChild(expBar);

    // Кнопка сопротивлений: left: 110px, top: 307px, width: 178px, height: 45px
    const resistBtn = document.createElement('button');
    resistBtn.className = 'wizard-bg-button';
    resistBtn.textContent = '🛡️ Сопротивления';
    resistBtn.style.cssText = `
        left: ${(110 * scaleX) + offsetX}px;
        top: ${307 * scaleY}px;
        width: ${178 * scaleX}px;
        height: ${45 * scaleY}px;
        font-size: ${13 * Math.min(scaleX, scaleY)}px;
    `;
    resistBtn.onclick = () => showResistancesModal(wizardIndex);
    overlay.appendChild(resistBtn);

    // Кнопка выбора скина: left: 110px, top: 370px, width: 178px, height: 41px
    const skinBtn = document.createElement('button');
    skinBtn.className = 'wizard-bg-button';
    skinBtn.textContent = '🎨 Образ';
    skinBtn.style.cssText = `
        left: ${(110 * scaleX) + offsetX}px;
        top: ${370 * scaleY}px;
        width: ${178 * scaleX}px;
        height: ${41 * scaleY}px;
        font-size: ${13 * Math.min(scaleX, scaleY)}px;
    `;
    skinBtn.onclick = () => {
        const wizard = window.userData.wizards[wizardIndex];
        if (wizard && typeof window.showSkinModal === 'function') {
            window.showSkinModal(wizard);
        }
    };
    overlay.appendChild(skinBtn);

    // === СЕТКА СТАТОВ 3x2 (правая часть) ===
    // Оригинальная сетка: left: 309px, top: 191px, width: 361px, height: 199px
    // Сетка 3 колонки x 2 ряда, внутри grid с gap
    const gridStartX = 309;
    const gridStartY = 191;
    const gridTotalWidth = 361;
    const gridTotalHeight = 199;
    const gapX = 10;
    const gapY = 10;

    // Вычисляем размер ячейки: (общая ширина - (кол-во gaps)) / кол-во колонок
    const cellWidth = (gridTotalWidth - (3 - 1) * gapX) / 3;  // ~113.67px
    const cellHeight = (gridTotalHeight - (2 - 1) * gapY) / 2; // ~94.5px

    const cells = [
        // РЯД 0: Здоровье, Броня, Урон (кликабельные для деталей)
        {
            type: 'health',
            col: 0, row: 0,
            label: 'Здоровье',
            value: wizardStats.actualMaxHP,
            bonus: wizardStats.healthBonusHTML,
            onclick: () => showStatBreakdown('hp')
        },
        {
            type: 'armor',
            col: 1, row: 0,
            label: 'Броня',
            value: wizardStats.actualMaxArmor,
            bonus: wizardStats.armorBonusHTML,
            onclick: () => showStatBreakdown('armor')
        },
        {
            type: 'damage',
            col: 2, row: 0,
            label: 'Урон',
            value: `+${wizardStats.totalDamageBonusPercent}%`,
            bonus: wizardStats.damageBonusHTML,
            onclick: () => showStatBreakdown('damage')
        },
        // РЯД 1: Заклинания (3 слота)
        ...createSpellCells(wizardData, wizardIndex, wizardStats.totalDamageMultiplier, wizardStats.totalDamageBonusPercent)
    ];

    cells.forEach(cell => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `wizard-bg-cell ${cell.type}`;
        if (cell.extraClass) cellDiv.classList.add(cell.extraClass);

        const x = gridStartX + (cellWidth + gapX) * cell.col;
        const y = gridStartY + (cellHeight + gapY) * cell.row;

        cellDiv.style.cssText = `
            left: ${(x * scaleX) + offsetX}px;
            top: ${y * scaleY}px;
            width: ${cellWidth * scaleX}px;
            height: ${cellHeight * scaleY}px;
        `;

        // Создаем контент ячейки
        if (cell.label) {
            // Ячейка стата
            const fontSize = Math.max(10, 14 * Math.min(scaleX, scaleY));
            cellDiv.innerHTML = `
                <div class="wizard-bg-cell-label" style="font-size: ${fontSize * 0.65}px;">${cell.label}</div>
                <div class="wizard-bg-cell-value" style="font-size: ${fontSize * 1.4}px;">${cell.value}</div>
                ${cell.bonus ? `<div class="wizard-bg-cell-bonus" style="font-size: ${fontSize * 0.6}px;">${cell.bonus}</div>` : ''}
            `;
        } else {
            // Ячейка заклинания
            const fontSize = Math.max(10, 14 * Math.min(scaleX, scaleY));
            cellDiv.innerHTML = cell.html.replace(/class="wizard-bg-spell-name"/g, `class="wizard-bg-spell-name" style="font-size: ${fontSize * 0.8}px;"`).replace(/class="wizard-bg-spell-info"/g, `class="wizard-bg-spell-info" style="font-size: ${fontSize * 0.65}px;"`).replace(/class="wizard-bg-cell-value"/g, `class="wizard-bg-cell-value" style="font-size: ${fontSize * 2}px;"`);
        }

        if (cell.onclick) cellDiv.onclick = cell.onclick;

        overlay.appendChild(cellDiv);
    });
}

// Создание ячеек заклинаний
function createSpellCells(wizardData, wizardIndex, totalDamageMultiplier, totalDamageBonusPercent) {
    const findSpellInUserData = window.findSpellInUserData || (() => null);
    const MAX_SPELL_SLOTS = 2;
    const cells = [];

    for (let i = 0; i < 3; i++) {
        const col = i;
        const row = 1;

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

                    // Используем SPELL_NAMES как источник актуальных названий
                    const spellName = window.SPELL_NAMES?.[spellId] || spellData.name || spellId;

                    cells.push({
                        type: 'spell',
                        col, row,
                        html: `
                            <div class="wizard-bg-spell-name">${spellName}</div>
                            <div class="wizard-bg-spell-info">Ур.${spellData.level} • ${damageDisplay}</div>
                        `,
                        onclick: () => openSpellSelection(wizardIndex, i)
                    });
                } else {
                    cells.push({
                        type: 'spell',
                        col, row,
                        html: `<div class="wizard-bg-spell-name">${spellId}</div>`,
                        onclick: () => openSpellSelection(wizardIndex, i)
                    });
                }
            } else {
                cells.push({
                    type: 'spell',
                    extraClass: 'empty',
                    col, row,
                    html: `<div class="wizard-bg-spell-name">➕ Выбрать</div>`,
                    onclick: () => openSpellSelection(wizardIndex, i)
                });
            }
        } else {
            cells.push({
                type: 'spell',
                extraClass: 'locked',
                col, row,
                html: `
                    <div class="wizard-bg-cell-value">🔒</div>
                    <div class="wizard-bg-spell-info">Закрыто</div>
                `
            });
        }
    }

    return cells;
}

// Показать разбивку характеристики
function showStatBreakdown(statType) {
    const stats = window.currentWizardStats;
    if (!stats) return;

    let title = '';
    let content = '';
    let color = '';

    if (statType === 'hp') {
        title = '❤️ Здоровье';
        color = '#4ade80';
        const s = stats.hp;
        content = `
            <div class="stat-breakdown-row">
                <span>Базовое HP</span>
                <span style="color: white;">${s.base}</span>
            </div>
            ${s.levelBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>⭐ Уровень мага</span>
                <span style="color: #ffa500;">+${s.levelBonus}%</span>
            </div>` : ''}
            ${s.towerBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>🏯 Башня магов</span>
                <span style="color: #7289da;">+${s.towerBonus}%</span>
            </div>` : ''}
            ${s.guildBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>🏰 Гильдия</span>
                <span style="color: #ffa500;">+${s.guildBonus}%</span>
            </div>` : ''}
            ${s.blessingBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>✨ Благословение</span>
                <span style="color: #a855f7;">+${s.blessingBonus}%</span>
            </div>` : ''}
            <div class="stat-breakdown-total">
                <span>Итого</span>
                <span style="color: ${color}; font-size: 18px;">${s.final}</span>
            </div>
        `;
    } else if (statType === 'armor') {
        title = '🛡️ Броня';
        color = '#95ffc4';
        const s = stats.armor;
        content = `
            <div class="stat-breakdown-row">
                <span>Базовая броня</span>
                <span style="color: white;">${s.base}</span>
            </div>
            ${s.blessingBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>✨ Благословение</span>
                <span style="color: #a855f7;">+${s.blessingBonus}</span>
            </div>` : ''}
            <div class="stat-breakdown-total">
                <span>Итого</span>
                <span style="color: ${color}; font-size: 18px;">${s.final}</span>
            </div>
            <div class="stat-breakdown-note">
                Броня поглощает урон до того, как он затронет здоровье
            </div>
        `;
    } else if (statType === 'damage') {
        title = '⚔️ Бонус к урону';
        color = '#fbbf24';
        const s = stats.damage;
        content = `
            <div class="stat-breakdown-row">
                <span>Базовый урон</span>
                <span style="color: white;">100%</span>
            </div>
            ${s.levelBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>⭐ Уровень мага</span>
                <span style="color: #4ade80;">+${s.levelBonus}%</span>
            </div>` : ''}
            ${s.towerBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>🏯 Башня магов</span>
                <span style="color: #7289da;">+${s.towerBonus}%</span>
            </div>` : ''}
            ${s.guildBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>🏰 Гильдия</span>
                <span style="color: #ffa500;">+${s.guildBonus}%</span>
            </div>` : ''}
            ${s.blessingBonus > 0 ? `
            <div class="stat-breakdown-row">
                <span>✨ Благословение</span>
                <span style="color: #a855f7;">+${s.blessingBonus}%</span>
            </div>` : ''}
            <div class="stat-breakdown-total">
                <span>Множитель урона</span>
                <span style="color: ${color}; font-size: 18px;">+${s.final}%</span>
            </div>
            <div class="stat-breakdown-note">
                Увеличивает урон всех заклинаний мага
            </div>
        `;
    }

    const modalHTML = `
        <div class="stat-breakdown-modal" onclick="event.stopPropagation()">
            <div class="stat-breakdown-header" style="color: ${color};">${title}</div>
            <div class="stat-breakdown-content">
                ${content}
            </div>
            <button class="stat-breakdown-close" onclick="closeStatBreakdown()">Закрыть</button>
        </div>
    `;

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.id = 'stat-breakdown-overlay';
    overlay.className = 'stat-breakdown-overlay';
    overlay.onclick = closeStatBreakdown;
    overlay.innerHTML = modalHTML;

    document.body.appendChild(overlay);

    // Добавляем стили если их нет
    if (!document.getElementById('stat-breakdown-styles')) {
        const styles = document.createElement('style');
        styles.id = 'stat-breakdown-styles';
        styles.textContent = `
            .stat-breakdown-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .stat-breakdown-modal {
                background: linear-gradient(145deg, #2c2c3d, #1f1f2e);
                border-radius: 12px;
                padding: 20px;
                min-width: 280px;
                max-width: 320px;
                border: 2px solid #7289da;
            }
            .stat-breakdown-header {
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #444;
            }
            .stat-breakdown-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .stat-breakdown-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                color: #aaa;
                font-size: 13px;
            }
            .stat-breakdown-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 10px;
                background: rgba(114, 137, 218, 0.15);
                border-radius: 6px;
                color: white;
                font-weight: bold;
                font-size: 14px;
                margin-top: 5px;
                border: 1px solid rgba(114, 137, 218, 0.3);
            }
            .stat-breakdown-note {
                font-size: 11px;
                color: #666;
                text-align: center;
                margin-top: 10px;
                font-style: italic;
            }
            .stat-breakdown-close {
                width: 100%;
                padding: 12px;
                margin-top: 15px;
                background: #7289da;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
            }
            .stat-breakdown-close:hover {
                background: #5b6eae;
            }
        `;
        document.head.appendChild(styles);
    }
}

function closeStatBreakdown() {
    const overlay = document.getElementById('stat-breakdown-overlay');
    if (overlay) overlay.remove();
}

// Экспорт функций
window.showWizardDetailScreen = showWizardDetailScreen;
window.closeWizardDetailScreen = closeWizardDetailScreen;
window.renderWizardDetailScreenWithBackground = renderWizardDetailScreenWithBackground;
window.calculateWizardStats = calculateWizardStats;
window.setupWizardUI = setupWizardUI;
window.updateWizardSpellSlots = updateWizardSpellSlots;
window.showResistancesModal = showResistancesModal;
window.closeResistancesModal = closeResistancesModal;
window.showInventoryModalCompact = showInventoryModalCompact;
window.closeInventoryModalCompact = closeInventoryModalCompact;
window.showStatBreakdown = showStatBreakdown;
window.closeStatBreakdown = closeStatBreakdown;

