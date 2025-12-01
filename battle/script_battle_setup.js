// web/script_battle/script_battle_setup.js - Система расстановки войск...




// Глобальные переменные

let currentBattleFormation = [null, null, null, null, null];

let draggedWizard = null;
let selectedWizardForPlacement = null; // Для клика по магу



// --- Показать окно расстановки войск ---

async function showBattleSetup() {

    console.log('📥 showBattleSetup called');

    closeBattleSetupModal();

    

    

    try {

        console.log('📤 Загрузка расстановки из window.userData');

        

        // Берём данные из локального window.userData

        if (!window.userData) {

            throw new Error('userData не инициализирован');

        }

        

        // Загружаем текущую расстановку

        const formation = window.userData.formation || [null, null, null, null, null];


        

        currentBattleFormation = [...formation];


        

        renderBattleSetupModal();

    } catch (error) {

        console.error('❌ Ошибка загрузки расстановки:', error);

        alert('Ошибка загрузки расстановки');

    }

}



// --- Получить информацию о заклинаниях мага ---

function getWizardSpellsInfo(wizard) {

    if (!wizard.spells || wizard.spells.length === 0) {

        return '<div style="font-size: 10px; color: #777;">Нет заклинаний</div>';

    }

    

    let spellsHTML = '';

    wizard.spells.forEach((spellId, index) => {

        if (spellId && index < 2) { // Только первые 2 ячейки

            const spellData = findSpellInUserData(spellId, userData.spells);

            if (spellData) {

                spellsHTML += `<div style="font-size: 10px; color: #7289da; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${spellData.name}</div>`;

            } else {

                spellsHTML += `<div style="font-size: 10px; color: #777;">${spellId}</div>`;

            }

        }

    });

    

    return spellsHTML || '<div style="font-size: 10px; color: #777;">Нет заклинаний</div>';

}



// --- Вспомогательная функция: найти заклинание в userData.spells ---

function findSpellInUserData(spellId, userSpells) {

    if (!userSpells) return null;

    

    // Проверяем стандартные заклинания

    for (const faction in userSpells) {

        if (faction !== 'hybrid' && userSpells[faction][spellId]) {

            return userSpells[faction][spellId];

        }

    }

    

    // Проверяем гибридные заклинания

    if (userSpells.hybrid && userSpells.hybrid[spellId]) {

        return userSpells.hybrid[spellId];

    }

    

    return null;

}



// --- Отображение модального окна расстановки ---

function renderBattleSetupModal() {


    const wizards = userData.wizards || [];

    console.log('🧙‍♂️ Доступные маги:', wizards);

    

    // Создаем HTML для поля расстановки (5 позиций)

    let formationHTML = '';

    for (let i = 0; i < 5; i++) {

        const wizardId = currentBattleFormation[i];

        const wizard = wizardId ? wizards.find(w => w.id === wizardId) : null;

        console.log(`Позиция ${i}:`, wizardId, wizard);

        

        formationHTML += `

            <div class="formation-slot" 

                 data-position="${i}"

                 ondragover="allowDrop(event)"

                 ondrop="dropWizard(event, ${i})"

                 onclick="clearSlot(${i})">

                ${wizard ? `

                    <div class="wizard-in-slot" draggable="true" ondragstart="dragWizard(event, '${wizard.id}')">

                        <div>🧙‍♂️</div>

                        <div style="font-size: 10px;">${wizard.name}</div>

                    </div>

                ` : `

                    <div class="empty-slot" style="color: #777; font-size: 12px;">

                        Позиция ${i + 1}

                    </div>

                `}

            </div>

        `;

    }

    

    // Создаем HTML для списка доступных магов с подробной информацией

    let availableWizardsHTML = '';

    if (wizards.length > 0) {

        wizards.forEach(wizard => {

            // Проверяем, не назначен ли маг уже в расстановку

            const isAssigned = currentBattleFormation.includes(wizard.id);

            

            availableWizardsHTML += `
                <div class="wizard-card ${isAssigned ? 'assigned' : ''}"
                     draggable="true" 
                     ondragstart="dragWizard(event, '${wizard.id}')"
                     onclick="assignWizard('${wizard.id}')"
                     data-wizard-id="${wizard.id}"
                     style="
                         background: #3d3d5c;
                         border-radius: 8px;
                         padding: 6px;
                         cursor: pointer;
                         border: 1px solid ${isAssigned ? '#555' : '#7289da'};
                         text-align: center;
                         width: 80px;
                         height: 80px;
                         box-sizing: border-box;
                         opacity: ${isAssigned ? '0.5' : '1'};
                         display: flex;
                         flex-direction: column;
                         justify-content: center;
                     ">
                    <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${wizard.name}
                    </div>
                    <div style="font-size: 9px; color: #aaa; margin-bottom: 2px;">
                        Ур.${wizard.level || 1}
                    </div>
                    <div style="font-size: 9px; color: #4ade80;">
                        HP: ${wizard.hp}
                    </div>
                    <div style="font-size: 9px; color: #7289da; margin-bottom: 2px;">
                        AR: ${wizard.armor}
                    </div>
                    <div style="font-size: 8px; color: #ffa500; line-height: 1.1;">
                        ${getWizardSpellsInfoCompact(wizard)}
                    </div>
                </div>
            `;

        });

    } else {

        availableWizardsHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">У вас нет магов</div>';

    }

    

    const modalContent = `

        <div style="padding: 15px; max-width: 800px; background: #2c2c3d; border-radius: 10px; color: white;" id="battle-setup-modal">

            <h3 style="margin-top: 0; color: #7289da; display: flex; justify-content: space-between; align-items: center;">

                <span>⚔️ Расстановка войск</span>

                <span style="font-size: 14px; color: #aaa;">Магов: ${wizards.length}/5</span>

            </h3>

            


            <!-- Layout с кнопками по бокам -->
            <div style="display: flex; gap: 10px; align-items: center;">
                
                <!-- Левая кнопка: Сохранить -->
                <button style="
                    writing-mode: vertical-rl;
                    padding: 15px 8px;
                    border: none;
                    border-radius: 6px;
                    background: #7289da;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                " onclick="saveBattleFormation()">
                    💾 Сохранить
                </button>
                
                <!-- Центральная часть: поле боя и маги -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                    
                    <!-- Ряд 1: Поле боя -->
                    <div>
                        <div class="formation-grid" style="display: flex; gap: 8px; justify-content: center;">
                            ${formationHTML}
                        </div>
                    </div>
                    
                    <!-- Ряд 2: Доступные маги -->
                    <div>
                        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                            ${availableWizardsHTML}
                        </div>
                    </div>
                    
                </div>
                
                <!-- Правая кнопка: Закрыть -->
                <button style="
                    writing-mode: vertical-rl;
                    padding: 15px 8px;
                    border: 1px solid #7289da;
                    border-radius: 6px;
                    background: transparent;
                    color: #7289da;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                " onclick="closeBattleSetupModal()">
                    ❌ Закрыть
                </button>
                
            </div>
            
        </div>

    `;

    


    

    // Удаляем предыдущее модальное окно если есть

    closeBattleSetupModal();

    

    const modal = document.createElement('div');

    modal.innerHTML = modalContent;

    modal.id = 'battle-setup-modal-container';

    modal.style.position = 'fixed';

    modal.style.top = '50%';

    modal.style.left = '50%';

    modal.style.transform = 'translate(-50%, -50%)';

    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';

    modal.style.padding = '20px';

    modal.style.borderRadius = '12px';

    modal.style.zIndex = '1000';

    modal.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.5)';

    modal.style.maxWidth = '95vw';

    modal.style.maxHeight = '95vh';

    modal.style.overflowY = 'auto';

    

    const overlay = document.createElement('div');

    overlay.id = 'battle-setup-overlay';

    overlay.style.position = 'fixed';

    overlay.style.top = '0';

    overlay.style.left = '0';

    overlay.style.width = '100%';

    overlay.style.height = '100%';

    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

    overlay.style.zIndex = '999';

    overlay.onclick = closeBattleSetupModal;

    

    document.body.appendChild(overlay);

    document.body.appendChild(modal);

    

    window.currentModal = { modal, overlay };


}



// --- Специальная функция закрытия для расстановки ---

function closeBattleSetupModal() {

    console.log('🚪 closeBattleSetupModal called');

    

    // Метод 1: Удаляем по ID

    const modalContainer = document.getElementById('battle-setup-modal-container');

    const overlay = document.getElementById('battle-setup-overlay');

    

    if (modalContainer) {

        modalContainer.remove();


    }

    

    if (overlay) {

        overlay.remove();


    }

    

    // Метод 2: Удаляем через currentModal как резервный способ

    if (window.currentModal) {

        if (window.currentModal.modal && window.currentModal.modal.parentNode) {

            window.currentModal.modal.parentNode.removeChild(window.currentModal.modal);


        }

        if (window.currentModal.overlay && window.currentModal.overlay.parentNode) {

            window.currentModal.overlay.parentNode.removeChild(window.currentModal.overlay);


        }

        window.currentModal = null;

    }

    

    // Метод 3: Удаляем все элементы с классами/ID как дополнительная страховка

    const elementsToRemove = document.querySelectorAll('#battle-setup-modal-container, #battle-setup-overlay');

    elementsToRemove.forEach(element => {

        if (element && element.parentNode) {

            element.parentNode.removeChild(element);

            console.log('🗑️ Дополнительно удален элемент');

        }

    });

    


}



// --- Drag and Drop функции ---

function allowDrop(event) {

    event.preventDefault();

}



function dragWizard(event, wizardId) {

    console.log('🖱️ dragWizard:', wizardId);

    draggedWizard = wizardId;

    event.dataTransfer.setData("text/plain", wizardId);

}



function dropWizard(event, position) {

    event.preventDefault();

    console.log('📥 dropWizard:', draggedWizard, 'на позицию:', position);

    if (draggedWizard) {

        placeWizardInFormation(draggedWizard, position);

        draggedWizard = null;

    }

}



// --- Функции управления расстановкой ---

function assignWizard(wizardId) {
    console.log('🎯 assignWizard: выбран маг', wizardId);
    
    // Сохраняем выбранного мага
    selectedWizardForPlacement = wizardId;
    
    // Подсвечиваем выбранного мага
    document.querySelectorAll('.wizard-card').forEach(card => {
        if (card.dataset.wizardId === wizardId) {
            card.style.border = '2px solid #ffa500';
        } else {
            const isAssigned = currentBattleFormation.includes(card.dataset.wizardId);
            card.style.border = `1px solid ${isAssigned ? '#555' : '#7289da'}`;
        }
    });
    
    console.log('💡 Теперь кликните на позицию для размещения');
}



function placeWizardInFormation(wizardId, position) {

    console.log('📍 placeWizardInFormation:', wizardId, 'на позицию:', position);


    

    // Проверяем, не назначен ли маг уже в другую позицию

    const existingPosition = currentBattleFormation.indexOf(wizardId);

    if (existingPosition !== -1) {


        // Удаляем с предыдущей позиции

        currentBattleFormation[existingPosition] = null;

    }

    

    // Проверяем, есть ли маг на целевой позиции

    const occupyingWizard = currentBattleFormation[position];

    if (occupyingWizard) {


        // Удаляем мага с целевой позиции

        currentBattleFormation[position] = null;

    }

    

    // Размещаем мага

    currentBattleFormation[position] = wizardId;


    

    // Перерисовываем

    renderBattleSetupModal();

}



function clearSlot(position) {
    console.log('🎯 Клик по слоту:', position);
    
    // Если выбран маг для размещения
    if (selectedWizardForPlacement) {
        console.log('📍 Размещаем мага', selectedWizardForPlacement, 'на позицию', position);
        placeWizardInFormation(selectedWizardForPlacement, position);
        selectedWizardForPlacement = null; // Сбрасываем выбор
    } else {
        // Если маг не выбран - очищаем слот
        console.log('🧹 Очищаем слот:', position);
        currentBattleFormation[position] = null;
        renderBattleSetupModal();
    }
}



// Сохранение расстановки - ИСПРАВЛЕННАЯ ВЕРСИЯ

async function saveBattleFormation() {


    

    try {

        // Сохраняем КОПИЮ в window.userData (не ссылку!)
        const formationCopy = [...currentBattleFormation];
        window.userData.formation = formationCopy;



        // Сохраняем в Supabase

        if (window.dbManager) {

            const success = await window.dbManager.saveFormation(formationCopy);

            // Синхронизируем с currentPlayer для консистентности
            if (success && window.dbManager.currentPlayer) {
                window.dbManager.currentPlayer.formation = formationCopy;
            }



            if (success) {
                // Триггер для event-driven системы
                if (typeof window.onFormationChanged === 'function') {
                    window.onFormationChanged(currentBattleFormation);
                }

                alert('✅ Расстановка сохранена!');

                closeBattleSetupModal();

            } else {

                alert('❌ Ошибка сохранения расстановки');

            }

        } else {

            // Если dbManager не готов, просто сохраняем локально

            window.dbManager.markChanged();

            alert('✅ Расстановка сохранена локально!');

            closeBattleSetupModal();

        }

    } catch (error) {

        console.error('❌ Ошибка сохранения расстановки:', error);

        alert('❌ Ошибка сохранения расстановки');

    }

}



// --- CSS стили для расстановки ---

function addBattleSetupStyles() {

    if (document.getElementById('battle-setup-styles')) return;

    

    const style = document.createElement('style');

    style.id = 'battle-setup-styles';

    style.textContent = `

        .formation-grid {

            display: flex;

            gap: 10px;

            justify-content: center;

            margin: 15px 0;

        }

        

        .formation-slot {

            width: 80px;

            height: 80px;

            background: #3d3d5c;

            border-radius: 8px;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            cursor: pointer;

            transition: all 0.2s;

            border: 2px dashed #555;

        }

        

        .formation-slot:hover {

            background: #444466;

            border-color: #7289da;

        }

        

        .wizard-in-slot {

            width: 100%;

            height: 100%;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            font-size: 24px;

        }

        

        .wizard-in-slot:hover {

            opacity: 0.8;

        }

        

        .empty-slot {

            text-align: center;

        }

        

        .available-wizards-list {

            display: flex;

            flex-direction: column;

            gap: 15px;

            margin-top: 15px;

            max-height: 300px;

            overflow-y: auto;

        }

        

        .wizard-card {

            background: #3d3d5c;

            border-radius: 8px;

            padding: 15px;

            cursor: pointer;

            transition: all 0.2s;

            border: 1px solid #555;

        }

        

        .wizard-card:hover {

            background: #444466;

            transform: translateY(-2px);

            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

        }

        

        .wizard-card.assigned {

            opacity: 0.6;

            cursor: not-allowed;

        }

        

        .wizard-card.assigned:hover {

            transform: none;

            box-shadow: none;

        }

        

        @media (max-width: 768px) {

            .formation-slot {

                width: 60px;

                height: 60px;

                font-size: 18px;

            }

            

            .wizard-card {

                padding: 12px;

            }

        }

    `;

    

    document.head.appendChild(style);

}



// Добавляем стили при загрузке

document.addEventListener('DOMContentLoaded', function() {

    addBattleSetupStyles();

});



// Делаем функции доступными глобально

window.showBattleSetup = showBattleSetup;

window.renderBattleSetupModal = renderBattleSetupModal;

window.closeBattleSetupModal = closeBattleSetupModal;

window.allowDrop = allowDrop;

window.dragWizard = dragWizard;

window.dropWizard = dropWizard;

window.assignWizard = assignWizard;

window.placeWizardInFormation = placeWizardInFormation;

window.clearSlot = clearSlot;

window.saveBattleFormation = saveBattleFormation;

window.getWizardSpellsInfo = getWizardSpellsInfo;

window.findSpellInUserData = findSpellInUserData;
// Компактная версия для квадратных карточек - только 2 заклинания
function getWizardSpellsInfoCompact(wizard) {
    if (!wizard.spells || wizard.spells.length === 0) {
        return '—<br>—';
    }
    
    let spells = [];
    for (let i = 0; i < 2; i++) {
        const spellId = wizard.spells[i];
        if (spellId) {
            const spellData = findSpellInUserData(spellId, userData.spells);
            if (spellData) {
                spells.push(`${spellData.name.substring(0, 8)}⚡${spellData.level || 1}`);
            } else {
                spells.push('—');
            }
        } else {
            spells.push('—');
        }
    }
    
    return spells.join('<br>');
}