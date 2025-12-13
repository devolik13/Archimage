// wizards/skin-modal.js
// Модальное окно выбора скинов для мага

let currentWizardForSkin = null;
let selectedSkinPreview = null;

/**
 * Показывает модальное окно выбора скина
 */
function showSkinModal(wizard) {
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
        background-image: url('assets/ui/adventure/adventure_hub.webp');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 10010;
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

    // Создаём затемняющий слой
    const darkLayer = document.createElement('div');
    darkLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        pointer-events: none;
    `;
    overlay.appendChild(darkLayer);

    // Создаём контейнер с контентом
    const contentContainer = document.createElement('div');
    contentContainer.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.85);
            border: 3px solid rgba(255, 215, 0, 0.3);
            border-radius: 16px;
            padding: 24px;
            max-width: 90%;
            max-height: 85%;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
            animation: scaleIn 0.3s ease-out;
        ">
            <!-- Заголовок -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid rgba(255, 215, 0, 0.3);
            ">
                <div>
                    <h2 style="margin: 0; color: #ffd700; font-size: 22px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                        🎨 Выбор облика мага
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #c9a961; font-size: 14px;">
                        Получено скинов: ${unlockedCount} / ${allSkinsOrdered.length}
                    </p>
                </div>
                <button onclick="closeSkinModal()" style="
                    background: rgba(0, 0, 0, 0.7);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
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

    overlay.appendChild(contentContainer);
    document.body.appendChild(overlay);

    // Закрытие по клику вне окна
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === darkLayer) {
            closeSkinModal();
        }
    });
}

/**
 * Создаёт карточку скина
 */
function createSkinCard(skinId, skin, isUnlocked, isCurrent) {
    const borderColor = isCurrent ? '#4ade80' : (isUnlocked ? 'rgba(255, 215, 0, 0.5)' : 'rgba(150, 150, 150, 0.3)');
    const borderWidth = isCurrent ? '3px' : '2px';
    const bgColor = isUnlocked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)';

    return `
        <div style="
            width: 150px;
            background: ${bgColor};
            border: ${borderWidth} solid ${borderColor};
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            cursor: ${isUnlocked ? 'pointer' : 'default'};
            transition: all 0.3s;
            position: relative;
            backdrop-filter: blur(5px);
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
                color: ${isUnlocked ? '#ffd700' : '#888'};
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
                text-shadow: ${isUnlocked ? '0 0 5px rgba(255, 215, 0, 0.3)' : 'none'};
            ">${skin.name}</div>

            <!-- Статус/Кнопка -->
            ${isUnlocked ? `
                ${!isCurrent ? `
                    <button onclick="event.stopPropagation(); applySkin('${skinId}')" style="
                        width: 100%;
                        padding: 6px 12px;
                        background: rgba(255, 215, 0, 0.8);
                        border: none;
                        border-radius: 6px;
                        color: #000;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='rgba(255, 215, 0, 1)'"
                       onmouseout="this.style.background='rgba(255, 215, 0, 0.8)'">
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

    // Создаём overlay для превью
    const previewOverlay = document.createElement('div');
    previewOverlay.id = 'skin-preview-overlay';
    previewOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10020;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
    `;

    previewOverlay.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid rgba(255, 215, 0, 0.5);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            text-align: center;
            backdrop-filter: blur(15px);
        ">
            <h3 style="
                color: #ffd700;
                font-size: 24px;
                margin: 0 0 20px 0;
                text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
            ">${skin.name}</h3>

            <div style="
                width: 300px;
                height: 300px;
                margin: 0 auto 20px;
                background: rgba(255, 215, 0, 0.05);
                border: 2px solid rgba(255, 215, 0, 0.2);
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 120px;
            ">${skin.icon}</div>

            ${skin.description ? `
                <p style="
                    color: #c9a961;
                    font-size: 16px;
                    margin: 0 0 20px 0;
                ">${skin.description}</p>
            ` : ''}

            <button onclick="closeSkinPreview()" style="
                padding: 10px 30px;
                background: rgba(255, 215, 0, 0.2);
                border: 2px solid rgba(255, 215, 0, 0.5);
                border-radius: 8px;
                color: #ffd700;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='rgba(255, 215, 0, 0.3)'"
               onmouseout="this.style.background='rgba(255, 215, 0, 0.2)'">
                Закрыть
            </button>
        </div>
    `;

    // Закрытие по клику вне окна
    previewOverlay.addEventListener('click', (e) => {
        if (e.target === previewOverlay) {
            closeSkinPreview();
        }
    });

    document.body.appendChild(previewOverlay);
}

/**
 * Закрывает превью скина
 */
function closeSkinPreview() {
    const previewOverlay = document.getElementById('skin-preview-overlay');
    if (previewOverlay) {
        previewOverlay.remove();
    }
    selectedSkinPreview = null;
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
        z-index: 10011;
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
window.closeSkinPreview = closeSkinPreview;
