// script_wizards/script_wizards.js - Полная и исправленная версия v3.3
console.log('✅ script_wizards.js (v3.3 FIXED) загружен');
// Проверяем наличие глобальных переменных
if (typeof API_BASE_URL === 'undefined') {
    console.warn('⚠️  API_BASE_URL не определен, используем пустую строку');
    window.API_BASE_URL = '';
}
if (typeof userId === 'undefined') {
    console.warn('⚠️  userId не определен, пытаемся получить из userData');
}
// Инициализация глобальной переменной
if (typeof window.currentModal === 'undefined') {
    window.currentModal = null;
}
// Глобальные переменные для фильтрации
let allLearnedSpellsGlobal = [];
let currentWizardIndex = -1;
let currentSpellSlotIndex = -1;
// === КОНСТАНТЫ ===
const MAX_SPELL_SLOTS = 2;
const MAX_NAME_LENGTH = 20;
const FACTION_EMOJIS = {
    fire: '🔥',
    water: '💧', 
    wind: '🌬️',
    earth: '🪨',
    nature: '🌿',
    poison: '☠️'
};
// === УТИЛИТЫ ===
function getFactionEmoji(faction) {
    return FACTION_EMOJIS[faction] || '✨';
}
function getFactionName(faction) {
    const names = {
        fire: 'Огонь',
        water: 'Вода',
        wind: 'Ветер',
        earth: 'Земля',
        nature: 'Природа',
        poison: 'Яд'
    };
    return names[faction] || faction;
}
function getSchoolColor(school) {
    const colors = {
        fire: '#ff6b6b',
        water: '#4d96ff',
        wind: '#95ffc4',
        earth: '#8b7355',
        nature: '#4ade80',
        poison: '#84cc16'
    };
    return colors[school] || '#777';
}
function findSpellInUserData(spellId, userSpells) {
    if (!userSpells) return null;
    for (const faction in userSpells) {
        if (userSpells[faction]?.[spellId]) {
            return userSpells[faction][spellId];
        }
    }
    return null;
}
function getSpellDamageLocal(spellId, level) {
    // Используем глобальную функцию если она есть и это не наша локальная
    if (typeof window.getSpellDamage === 'function' && window.getSpellDamage !== getSpellDamageLocal) {
        return window.getSpellDamage(spellId, level);
    }
    // Иначе возвращаем базовое значение
    return level * 10;
}
function getHybridSpellDamageLocal(spellId, level) {
    // Используем глобальную функцию если она есть
    if (typeof window.getHybridSpellDamage === 'function') {
        return window.getHybridSpellDamage(spellId, level);
    }
    // Иначе возвращаем базовое значение
    return level * 15;
}
function getSpellNameById(spellId) {
    // Сначала проверяем в SPELL_NAMES (основной источник названий)
    if (window.SPELL_NAMES && window.SPELL_NAMES[spellId]) {
        return window.SPELL_NAMES[spellId];
    }
    // Если нет в SPELL_NAMES, ищем в userData (для кастомных названий)
    const spellData = findSpellInUserData(spellId, userData.spells);
    return spellData ? spellData.name : spellId;
}
// === ОСНОВНЫЕ ФУНКЦИИ ===
// Обновление списка магов с исправленным отображением уровней
function updateWizardsList() {
    const wizardsList = document.getElementById('wizards-list');
    if (!wizardsList) {
        console.error("#wizards-list не найден!");
        return;
    }
    wizardsList.innerHTML = '';
    const wizards = userData.wizards || [];
    if (wizards.length === 0) {
        wizardsList.innerHTML = '<div style="text-align: center; color: #777;">Нет магов</div>';
        return;
    }
    wizards.forEach((wizard, index) => {
        const wizardElement = document.createElement('div');
        wizardElement.className = 'wizard-portrait';
        const level = wizard.level || 1;
        wizardElement.title = `${wizard.name} (Ур.${level}) | HP: ${wizard.max_hp}`;
        // Исправленное отображение с правильным позиционированием
        wizardElement.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <span style="font-size: 32px; display: block;">🧙‍♂️</span>
                <div style="
                    position: absolute; 
                    bottom: -2px; 
                    right: -2px; 
                    background: #7289da; 
                    color: white; 
                    border-radius: 50%; 
                    width: 20px; 
                    height: 20px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 11px; 
                    font-weight: bold;
                    border: 2px solid #2c2c3d;
                    z-index: 1;
                ">
                    ${level}
                </div>
            </div>
        `;
        wizardElement.onclick = () => showWizardDetailScreen(wizard);
        wizardsList.appendChild(wizardElement);
    });
}

// Функция переключения сопротивлений
function toggleResistances() {
    const section = document.getElementById('resistances-section');
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

// Выбор заклинания
function openSpellSelection(wizardIndex, spellSlotIndex) {
    currentWizardIndex = wizardIndex;
    currentSpellSlotIndex = spellSlotIndex;
    const userSpells = userData.spells || {};
    allLearnedSpellsGlobal = [];
    const allAssignedSpells = new Set();
    userData.wizards.forEach(wizard => {
        wizard.spells?.forEach(spellId => {
            if (spellId) allAssignedSpells.add(spellId);
        });
    });
    const currentWizard = userData.wizards[wizardIndex];
    const currentSpellInSlot = currentWizard.spells?.[spellSlotIndex];
    ['fire', 'water', 'wind', 'earth', 'nature', 'poison'].forEach(faction => {
        const factionSpells = userSpells[faction];
        if (factionSpells) {
            Object.entries(factionSpells).forEach(([spellId, spellData]) => {
                if (spellData.level > 0 && (!allAssignedSpells.has(spellId) || spellId === currentSpellInSlot)) {
                    allLearnedSpellsGlobal.push({
                        id: spellId,
                        name: spellData.name,
                        level: spellData.level,
                        faction: faction,
                        category: 'standard',
                        damage: getSpellDamageLocal(spellId, spellData.level)
                    });
                }
            });
        }
    });
    // Добавляем гибридные заклинания
    if (userSpells.hybrid) {
        Object.entries(userSpells.hybrid).forEach(([spellId, spellData]) => {
            if (spellData.level > 0 && (!allAssignedSpells.has(spellId) || spellId === currentSpellInSlot)) {
                allLearnedSpellsGlobal.push({
                    id: spellId,
                    name: spellData.name,
                    level: spellData.level,
                    faction: 'hybrid',
                    category: 'hybrid',
                    damage: getHybridSpellDamageLocal(spellId, spellData.level)
                });
            }
        });
    }
    showSpellSelectionModal();
}
// Модальное окно выбора заклинания с фильтрацией
function showSpellSelectionModal() {
    // Подсчет заклинаний по категориям
    const standardCount = allLearnedSpellsGlobal.filter(s => s.category === 'standard').length;
    const hybridCount = allLearnedSpellsGlobal.filter(s => s.category === 'hybrid').length;
    const fireCount = allLearnedSpellsGlobal.filter(s => s.faction === 'fire').length;
    const waterCount = allLearnedSpellsGlobal.filter(s => s.faction === 'water').length;
    const windCount = allLearnedSpellsGlobal.filter(s => s.faction === 'wind').length;
    const earthCount = allLearnedSpellsGlobal.filter(s => s.faction === 'earth').length;
    const natureCount = allLearnedSpellsGlobal.filter(s => s.faction === 'nature').length;
    const poisonCount = allLearnedSpellsGlobal.filter(s => s.faction === 'poison').length;
    const spellsListHTML = renderSpellsList(allLearnedSpellsGlobal);
    const modalContent = `
        <div style="padding: 15px; width: 350px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da; font-size: 16px;">📚 Выбор заклинания</h3>
            <!-- Фильтр -->
            <div style="margin-bottom: 10px;">
                <select id="spells-filter-select" style="
                    width: 100%; 
                    padding: 6px; 
                    border-radius: 4px; 
                    border: 1px solid #555; 
                    background: #3d3d5c; 
                    color: white;
                    font-size: 12px;
                " onchange="filterSpells()">
                    <option value="all">Все заклинания (${allLearnedSpellsGlobal.length})</option>
                    ${standardCount > 0 ? `<option value="standard">⚡ Стандартные (${standardCount})</option>` : ''}
                    ${hybridCount > 0 ? `<option value="hybrid">🔮 Гибридные (${hybridCount})</option>` : ''}
                    ${fireCount > 0 ? `<option value="fire">🔥 Огонь (${fireCount})</option>` : ''}
                    ${waterCount > 0 ? `<option value="water">💧 Вода (${waterCount})</option>` : ''}
                    ${windCount > 0 ? `<option value="wind">🌬️ Ветер (${windCount})</option>` : ''}
                    ${earthCount > 0 ? `<option value="earth">🪨 Земля (${earthCount})</option>` : ''}
                    ${natureCount > 0 ? `<option value="nature">🌿 Природа (${natureCount})</option>` : ''}
                    ${poisonCount > 0 ? `<option value="poison">☠️ Яд (${poisonCount})</option>` : ''}
                </select>
            </div>
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 10px;" id="spells-filter-container">
                ${spellsListHTML}
            </div>
            <button onclick="closeCurrentModal()" style="
                width: 100%;
                padding: 8px;
                border: 1px solid #7289da;
                border-radius: 5px;
                background: transparent;
                color: #7289da;
                cursor: pointer;
                font-size: 12px;
            ">Отмена</button>
        </div>
    `;
    closeCurrentModal();
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 15px;
        border-radius: 12px;
        z-index: 10001;
    `;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
    `;
    overlay.onclick = closeCurrentModal;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}
// Функция фильтрации заклинаний
function filterSpells() {
    const filterSelect = document.getElementById('spells-filter-select');
    if (!filterSelect) return;
    const filterValue = filterSelect.value;
    const container = document.getElementById('spells-filter-container');
    if (container) {
        const filteredSpells = getFilteredSpells(filterValue);
        container.innerHTML = renderSpellsList(filteredSpells);
    }
}
// Получение отфильтрованных заклинаний
function getFilteredSpells(filter) {
    let filteredSpells = [...allLearnedSpellsGlobal];
    if (filter !== 'all') {
        if (filter === 'hybrid') {
            filteredSpells = filteredSpells.filter(spell => spell.category === 'hybrid');
        } else if (filter === 'standard') {
            filteredSpells = filteredSpells.filter(spell => spell.category === 'standard');
        } else {
            // Фильтр по фракции
            filteredSpells = filteredSpells.filter(spell => spell.faction === filter);
        }
    }
    return filteredSpells;
}
// Рендеринг списка заклинаний
function renderSpellsList(spells) {
    if (spells.length === 0) {
        return '<div style="text-align: center; color: #aaa; padding: 20px;">Нет доступных заклинаний</div>';
    }
    return spells.map(spell => `
        <button onclick="assignSpellToWizard(${currentWizardIndex}, ${currentSpellSlotIndex}, '${spell.id}')" style="
            width: 100%;
            padding: 8px;
            margin-bottom: 6px;
            background: #3d3d5c;
            border: 1px solid #555;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            font-size: 12px;
        " onmouseover="this.style.background='#4a4a6a'" onmouseout="this.style.background='#3d3d5c'">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${spell.name}</strong>
                    <div style="font-size: 10px; color: #aaa;">
                        ${getFactionEmoji(spell.faction)} ${spell.category === 'hybrid' ? 'Гибридное' : getFactionName(spell.faction)} • Ур.${spell.level} • ${spell.damage}💥
                    </div>
                </div>
            </div>
        </button>
    `).join('');
}
// Назначение заклинания магу
async function assignSpellToWizard(wizardIndex, spellSlotIndex, spellId) {
    if (!userData.wizards?.[wizardIndex]) {
        console.error("Маг не найден");
        return;
    }
    if (!userData.wizards[wizardIndex].spells) {
        userData.wizards[wizardIndex].spells = [];
    }
    userData.wizards[wizardIndex].spells[spellSlotIndex] = spellId;
    closeCurrentModal();

    // Обновляем только слоты заклинаний (без перерисовки всего окна)
    if (typeof window.updateWizardSpellSlots === 'function') {
        window.updateWizardSpellSlots();
    }

    // ВАЖНО: Сохраняем изменения в БД
    if (window.eventSaveManager) {
        await window.eventSaveManager.saveDebounced('wizard_spell_assigned', 1000);
    } else if (window.dbManager) {
        window.dbManager.markChanged();
    }
}
// Переименование мага
function startRenameWizard(wizardIndex) {
    console.log('startRenameWizard вызвана для индекса:', wizardIndex);
    const wizard = userData.wizards[wizardIndex];
    if (!wizard) {
        console.error('Маг не найден по индексу:', wizardIndex);
        return;
    }
    // Создаем кастомное модальное окно для ввода имени
    const renameModalHTML = `
        <div style="padding: 20px; background: #2c2c3d; border-radius: 10px; color: white; width: 280px;">
            <h4 style="margin-top: 0; color: #7289da;">✏️ Переименовать мага</h4>
            <p style="font-size: 12px; color: #aaa; margin: 10px 0;">Текущее имя: ${wizard.name}</p>
            <input type="text" id="new-wizard-name" value="${wizard.name}" maxlength="${MAX_NAME_LENGTH}" style="
                width: 100%;
                padding: 8px;
                border: 1px solid #555;
                background: #3d3d5c;
                color: white;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            " />
            <div style="font-size: 10px; color: #777; margin-top: 5px;">Макс. ${MAX_NAME_LENGTH} символов</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px;">
                <button id="rename-confirm" style="
                    padding: 8px;
                    border: none;
                    border-radius: 4px;
                    background: #4ade80;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                ">✓ Сохранить</button>
                <button id="rename-cancel" style="
                    padding: 8px;
                    border: 1px solid #7289da;
                    border-radius: 4px;
                    background: transparent;
                    color: #7289da;
                    cursor: pointer;
                    font-size: 12px;
                ">✗ Отмена</button>
            </div>
        </div>
    `;
    // Сохраняем текущее модальное окно
    const previousModal = window.currentModal;
    // Создаем новое модальное окно
    const renameModal = document.createElement('div');
    renameModal.innerHTML = renameModalHTML;
    renameModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 15px;
        border-radius: 12px;
        z-index: 2000;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    `;
    const renameOverlay = document.createElement('div');
    renameOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    document.body.appendChild(renameOverlay);
    document.body.appendChild(renameModal);
    // Фокус на поле ввода
    const inputField = document.getElementById('new-wizard-name');
    if (inputField) {
        inputField.focus();
        inputField.select();
    }
    // Обработчики кнопок
    document.getElementById('rename-confirm').onclick = () => {
        const newName = document.getElementById('new-wizard-name').value;
        if (newName && newName.trim() && newName !== wizard.name) {
            renameWizard(wizardIndex, newName.trim());
        }
        // Закрываем окно переименования
        renameModal.remove();
        renameOverlay.remove();
    };
    document.getElementById('rename-cancel').onclick = () => {
        renameModal.remove();
        renameOverlay.remove();
    };
    // Обработка Enter и Escape
    inputField.onkeydown = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('rename-confirm').click();
        } else if (e.key === 'Escape') {
            document.getElementById('rename-cancel').click();
        }
    };
}
async function renameWizard(wizardIndex, newName) {
    const wizard = userData.wizards[wizardIndex];
    if (!wizard) return;
    const trimmedName = newName.substring(0, MAX_NAME_LENGTH);

    try {
        // Обновляем имя локально
        userData.wizards[wizardIndex].name = trimmedName;

        // Обновляем UI
        const nameDisplay = document.getElementById('wizard-name-display');
        if (nameDisplay) {
            nameDisplay.textContent = trimmedName;
        }
        updateWizardsList();

        // Сохраняем изменения через event-save-manager
        if (window.eventSaveManager) {
            await window.eventSaveManager.saveDebounced('wizard_renamed', 1000);
        } else if (window.dbManager) {
            window.dbManager.markChanged();
        }

        showInlineNotification('✅ Переименовано!');
    } catch (error) {
        console.error('Ошибка переименования:', error);
        alert('❌ Ошибка сохранения');
    }
}
// Сохранение заклинаний мага
async function saveWizardSpells(wizardIndex) {
    const wizard = userData.wizards[wizardIndex];
    if (!wizard) return;

    try {
        // Заклинания уже обновлены в userData.wizards[wizardIndex].spells
        // Сохраняем изменения через event-save-manager
        if (window.eventSaveManager) {
            await window.eventSaveManager.saveDebounced('wizard_spells_updated', 1000);
        } else if (window.dbManager) {
            window.dbManager.markChanged();
        }

        showInlineNotification('✅ Сохранено!');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка сохранения');
    }
}
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function closeCurrentModal() {
    if (window.currentModal) {
        if (window.currentModal.modal) {
            window.currentModal.modal.remove();
        }
        if (window.currentModal.overlay) {
            window.currentModal.overlay.remove();
        }
        window.currentModal = null;
    }
}
function showInlineNotification(message) {
    const notification = document.getElementById('save-notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
            }
        }, 2000);
    }
    console.log('Уведомление:', message);
}
// ЭКСПОРТ
window.updateWizardsList = updateWizardsList;
window.openSpellSelection = openSpellSelection;
window.assignSpellToWizard = assignSpellToWizard;
window.showSpellSelectionModal = showSpellSelectionModal;
window.startRenameWizard = startRenameWizard;
window.renameWizard = renameWizard;
window.saveWizardSpells = saveWizardSpells;
window.renderSpellsList = renderSpellsList;
window.filterSpells = filterSpells;
window.getFilteredSpells = getFilteredSpells;
window.closeCurrentModal = closeCurrentModal;
window.showInlineNotification = showInlineNotification;
window.toggleResistances = toggleResistances;