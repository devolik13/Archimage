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

    // Создаём overlay с фоновым изображением (как в adventure-hub)
    const overlay = document.createElement('div');
    overlay.id = 'skin-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
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

    // Создаём структуру с фоновым изображением (паттерн adventure-hub)
    overlay.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <!-- Фоновое изображение -->
            <img id="skin-modal-bg" src="assets/ui/adventure/adventure_hub.webp" alt="Фон" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            ">

            <!-- Контейнер для контента поверх фона -->
            <div id="skin-modal-content" style="
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <!-- Полностью прозрачная панель с контентом -->
                <div style="
                    padding: 20px;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: scaleIn 0.3s ease-out;
                ">
                    <!-- Заголовок -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    ">
                        <div>
                            <h2 style="margin: 0; color: #ffd700; font-size: 20px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                                🎨 Выбор облика мага
                            </h2>
                            <p style="margin: 5px 0 0 0; color: #c9a961; font-size: 13px;">
                                Получено скинов: ${unlockedCount} / ${allSkinsOrdered.length}
                            </p>
                        </div>
                        <button onclick="closeSkinModal()" style="
                            background: rgba(0, 0, 0, 0.5);
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 50%;
                            color: white;
                            font-size: 22px;
                            width: 36px;
                            height: 36px;
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
                        gap: 12px;
                        justify-content: center;
                    ">
                        ${skinsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Подстраиваем размер контента под фоновое изображение
    const bgImg = document.getElementById('skin-modal-bg');
    const contentContainer = document.getElementById('skin-modal-content');

    const setupContentSize = () => {
        if (bgImg && contentContainer) {
            const rect = bgImg.getBoundingClientRect();
            contentContainer.style.width = rect.width + 'px';
            contentContainer.style.height = rect.height + 'px';
        }
    };

    bgImg.onload = setupContentSize;
    if (bgImg.complete) setupContentSize();

    // Загружаем превью спрайтов
    loadSkinPreviews(allSkinsOrdered);

    // Закрытие по клику вне окна
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSkinModal();
        }
    });
}

/**
 * Загружает превью спрайтов на canvas
 */
function loadSkinPreviews(skinIds) {
    skinIds.forEach(skinId => {
        const skin = SKINS_CONFIG[skinId];
        if (!skin) return;

        const canvasId = `skin-preview-${skinId}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const spriteConfig = skin.spriteConfig;

        // Определяем путь к спрайту
        let spritePath;
        if (skin.isDefault) {
            // Стандартные скины магов
            spritePath = `images/wizards/${skin.faction}/idle.webp`;
        } else {
            // Скины элементалей
            spritePath = `images/enemies/${spriteConfig}/idle.webp`;
        }

        // Загружаем изображение
        const img = new Image();
        img.onload = () => {
            // Рисуем первый кадр (верхний левый угол сетки)
            // Предполагаем размер кадра 256x256
            const frameSize = 256;
            ctx.clearRect(0, 0, 120, 120);
            ctx.drawImage(img, 0, 0, frameSize, frameSize, 0, 0, 120, 120);
        };
        img.src = spritePath;
    });
}

/**
 * Создаёт карточку скина
 */
function createSkinCard(skinId, skin, isUnlocked, isCurrent) {
    const borderColor = isCurrent ? '#4ade80' : (isUnlocked ? 'rgba(255, 215, 0, 0.5)' : 'rgba(150, 150, 150, 0.3)');
    const borderWidth = isCurrent ? '3px' : '2px';
    const bgColor = isUnlocked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)';
    const canvasId = `skin-preview-${skinId}`;

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
                position: relative;
                overflow: hidden;
            ">
                <canvas id="${canvasId}" width="120" height="120" style="width: 120px; height: 120px;"></canvas>
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

// Конфигурация анимаций для скинов магов
const SKIN_ANIMATION_CONFIG = {
    fire: { frameCount: 25, gridColumns: 5 }, // 5×5 сетка
    water: { frameCount: 25, gridColumns: 5 },
    wind: { frameCount: 8, gridColumns: null },
    earth: { frameCount: 8, gridColumns: null },
    nature: { frameCount: 8, gridColumns: null },
    poison: { frameCount: 8, gridColumns: null }
};

// Хранилище для текущей анимации превью
let skinPreviewAnimationId = null;

/**
 * Выбирает скин (показывает превью)
 */
function selectSkin(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return;

    selectedSkinPreview = skinId;

    // Создаём overlay для превью с тем же фоном adventure_hub
    const previewOverlay = document.createElement('div');
    previewOverlay.id = 'skin-preview-overlay';
    previewOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10020;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
    `;

    const previewCanvasId = 'skin-large-preview-canvas';
    previewOverlay.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <!-- Фоновое изображение -->
            <img id="skin-preview-bg" src="assets/ui/adventure/adventure_hub.webp" alt="Фон" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            ">

            <!-- Контейнер для контента поверх фона -->
            <div id="skin-preview-content" style="
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-sizing: border-box;
            ">
                <!-- Название скина -->
                <h3 style="
                    color: #ffd700;
                    font-size: min(24px, 5vw);
                    margin: 0 0 15px 0;
                    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 215, 0, 0.6);
                    text-align: center;
                ">${skin.name}</h3>

                <!-- Превью спрайта с рамкой (адаптивный размер) -->
                <div style="
                    width: min(280px, 70vw);
                    height: min(280px, 70vw);
                    border: 3px solid #ffd700;
                    border-radius: 12px;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.3);
                ">
                    <canvas id="${previewCanvasId}" width="256" height="256" style="width: 100%; height: 100%; object-fit: contain;"></canvas>
                </div>

                ${skin.description ? `
                    <p style="
                        color: #ffd700;
                        font-size: min(16px, 3.5vw);
                        margin: 15px 0;
                        text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.9);
                        text-align: center;
                    ">${skin.description}</p>
                ` : ''}

                <!-- Кнопка закрытия -->
                <button onclick="closeSkinPreview()" style="
                    margin-top: 15px;
                    padding: 8px 25px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid rgba(255, 215, 0, 0.5);
                    border-radius: 8px;
                    color: #ffd700;
                    font-size: min(14px, 3.5vw);
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255, 215, 0, 0.3)'"
                   onmouseout="this.style.background='rgba(0, 0, 0, 0.5)'">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    // Закрытие по клику вне окна
    previewOverlay.addEventListener('click', (e) => {
        if (e.target === previewOverlay) {
            closeSkinPreview();
        }
    });

    document.body.appendChild(previewOverlay);

    // Подстраиваем размер контента под фоновое изображение
    const bgImg = document.getElementById('skin-preview-bg');
    const contentContainer = document.getElementById('skin-preview-content');

    const setupContentSize = () => {
        if (bgImg && contentContainer) {
            const rect = bgImg.getBoundingClientRect();
            contentContainer.style.width = rect.width + 'px';
            contentContainer.style.height = rect.height + 'px';
        }
    };

    bgImg.onload = setupContentSize;
    if (bgImg.complete) setupContentSize();

    // Запускаем анимированное превью
    startSkinPreviewAnimation(skin, previewCanvasId);
}

/**
 * Запускает анимацию превью скина
 */
function startSkinPreviewAnimation(skin, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Определяем путь к спрайту
    let spritePath;
    let animConfig;

    if (skin.isDefault) {
        spritePath = `images/wizards/${skin.faction}/idle.webp`;
        animConfig = SKIN_ANIMATION_CONFIG[skin.faction] || { frameCount: 8, gridColumns: null };
    } else {
        spritePath = `images/enemies/${skin.spriteConfig}/idle.webp`;
        animConfig = SKIN_ANIMATION_CONFIG[skin.spriteConfig] || { frameCount: 8, gridColumns: null };
    }

    const frameSize = 256;
    const { frameCount, gridColumns } = animConfig;
    let currentFrame = 0;

    const img = new Image();
    img.onload = () => {
        // Функция отрисовки кадра
        const drawFrame = () => {
            ctx.clearRect(0, 0, 256, 256);

            let srcX, srcY;
            if (gridColumns) {
                // Сетка (например 5x5)
                const col = currentFrame % gridColumns;
                const row = Math.floor(currentFrame / gridColumns);
                srcX = col * frameSize;
                srcY = row * frameSize;
            } else {
                // Горизонтальная полоса
                srcX = currentFrame * frameSize;
                srcY = 0;
            }

            ctx.drawImage(img, srcX, srcY, frameSize, frameSize, 0, 0, 256, 256);

            currentFrame = (currentFrame + 1) % frameCount;
        };

        // Первый кадр сразу
        drawFrame();

        // Запускаем анимацию - подбираем интервал чтобы цикл длился ~1.2с
        // Для 8 кадров: 150ms, для 25 кадров: ~50ms
        const targetCycleDuration = 1200; // мс для полного цикла
        const interval = Math.max(40, Math.floor(targetCycleDuration / frameCount));
        skinPreviewAnimationId = setInterval(drawFrame, interval);
    };

    img.src = spritePath;
}

/**
 * Закрывает превью скина
 */
function closeSkinPreview() {
    // Останавливаем анимацию
    if (skinPreviewAnimationId) {
        clearInterval(skinPreviewAnimationId);
        skinPreviewAnimationId = null;
    }

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
