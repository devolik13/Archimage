// wizards/skin-modal.js
// Модальное окно выбора скинов для мага

let currentWizardForSkin = null;
let selectedSkinPreview = null;

/**
 * Показывает модальное окно выбора скина
 */
function showSkinModal(wizard) {
    console.log('🎨 showSkinModal вызвана', wizard);
    if (!wizard) {
        console.error('❌ Маг не передан в showSkinModal');
        return;
    }

    currentWizardForSkin = wizard;
    const currentSkin = getWizardSkin(wizard.id, wizard.faction);

    // Создаём overlay
    const overlay = document.createElement('div');
    overlay.id = 'skin-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    // Получаем все скины
    const allSkinsOrdered = getAllSkinsOrdered();
    const unlockedCount = allSkinsOrdered.filter(id => isSkinUnlocked(id, wizard.faction)).length;

    // Создаём сетку скинов
    let skinsHTML = '';
    for (let i = 0; i < allSkinsOrdered.length; i++) {
        const skinId = allSkinsOrdered[i];
        const skin = SKINS_CONFIG[skinId];
        if (!skin) continue;

        const isUnlocked = isSkinUnlocked(skinId, wizard.faction);
        const isCurrent = currentSkin === skinId;

        skinsHTML += createSkinCard(skinId, skin, isUnlocked, isCurrent);

        // Перенос строки каждые 3 карточки
        if ((i + 1) % 3 === 0 && i < allSkinsOrdered.length - 1) {
            skinsHTML += '<div style="width: 100%; height: 10px;"></div>';
        }
    }

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 3px solid #4a5568;
            border-radius: 16px;
            padding: 24px;
            max-width: 90%;
            max-height: 85%;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            animation: scaleIn 0.3s ease-out;
        ">
            <!-- Заголовок -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #4a5568;
            ">
                <div>
                    <h2 style="margin: 0; color: #fff; font-size: 22px;">
                        🎨 Выбор облика мага
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #aaa; font-size: 14px;">
                        Получено скинов: ${unlockedCount} / ${allSkinsOrdered.length}
                    </p>
                </div>
                <button onclick="closeSkinModal()" style="
                    background: #4a5568;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 24px;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>

            <!-- Сетка скинов -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                justify-content: center;
            ">
                ${skinsHTML}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Закрытие по клику вне окна
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSkinModal();
        }
    });
}

/**
 * Создаёт карточку скина
 */
function createSkinCard(skinId, skin, isUnlocked, isCurrent) {
    const borderColor = isCurrent ? '#4ade80' : (isUnlocked ? '#4a5568' : '#2d3748');
    const borderWidth = isCurrent ? '3px' : '2px';

    return `
        <div style="
            width: 150px;
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
            border: ${borderWidth} solid ${borderColor};
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            cursor: ${isUnlocked ? 'pointer' : 'default'};
            transition: all 0.3s;
            position: relative;
        " onclick="${isUnlocked ? `selectSkin('${skinId}')` : ''}"
           onmouseover="this.style.transform='scale(1.05)'"
           onmouseout="this.style.transform='scale(1)'">

            <!-- Иконка/Превью -->
            <div style="
                width: 120px;
                height: 120px;
                margin: 0 auto 10px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                position: relative;
                overflow: hidden;
            ">
                ${skin.icon}
                ${!isUnlocked ? `
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 36px;
                    ">🔒</div>
                ` : ''}
                ${isCurrent ? `
                    <div style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background: #4ade80;
                        color: white;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: bold;
                    ">Текущий</div>
                ` : ''}
            </div>

            <!-- Название -->
            <div style="
                color: ${isUnlocked ? '#fff' : '#888'};
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
            ">${skin.name}</div>

            <!-- Статус/Кнопка -->
            ${isUnlocked ? `
                ${!isCurrent ? `
                    <button onclick="event.stopPropagation(); applySkin('${skinId}')" style="
                        width: 100%;
                        padding: 6px 12px;
                        background: #4ade80;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#22c55e'"
                       onmouseout="this.style.background='#4ade80'">
                        Применить
                    </button>
                ` : `
                    <div style="
                        padding: 6px 12px;
                        background: rgba(74, 222, 128, 0.2);
                        border-radius: 6px;
                        color: #4ade80;
                        font-size: 12px;
                        font-weight: bold;
                    ">✓ Используется</div>
                `}
            ` : `
                <div style="
                    font-size: 11px;
                    color: #f59e0b;
                    line-height: 1.3;
                ">${skin.unlockText || 'Заблокировано'}</div>
            `}
        </div>
    `;
}

/**
 * Выбирает скин (показывает превью)
 */
function selectSkin(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return;

    selectedSkinPreview = skinId;

    // TODO: Показать увеличенное превью с idle анимацией
    console.log(`👁️ Превью скина: ${skin.name}`);
}

/**
 * Применяет скин к магу
 */
async function applySkin(skinId) {
    if (!currentWizardForSkin) return;

    const skin = SKINS_CONFIG[skinId];
    if (!skin) return;

    // Проверяем разблокирован ли скин
    if (!isSkinUnlocked(skinId, currentWizardForSkin.faction)) {
        showNotification('⚠️ Этот скин ещё не разблокирован', 'warning');
        return;
    }

    // Устанавливаем скин
    await setWizardSkin(currentWizardForSkin.id, skinId);

    // Показываем уведомление
    showNotification(`✨ Облик "${skin.name}" применён!`, 'success');

    // Обновляем окно мага если оно открыто
    if (typeof window.refreshWizardDetail === 'function') {
        window.refreshWizardDetail(currentWizardForSkin.id);
    }

    // Закрываем модальное окно
    closeSkinModal();
}

/**
 * Закрывает модальное окно
 */
function closeSkinModal() {
    const overlay = document.getElementById('skin-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
    currentWizardForSkin = null;
    selectedSkinPreview = null;
}

/**
 * Показывает уведомление
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#4ade80',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#60a5fa'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Экспорт функций
window.showSkinModal = showSkinModal;
window.closeSkinModal = closeSkinModal;
window.selectSkin = selectSkin;
window.applySkin = applySkin;
