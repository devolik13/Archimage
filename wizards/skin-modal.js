// wizards/skin-modal.js
// Модальное окно выбора скинов для мага

let currentWizardForSkin = null;
let selectedSkinPreview = null;
let currentSkinCategory = 'standard'; // 'standard' или 'premium'

/**
 * Показывает модальное окно выбора категории скинов (Стандарт/Премиум)
 */
function showSkinModal(wizard) {
    if (!wizard) {
        console.error('❌ Маг не передан в showSkinModal');
        return;
    }

    currentWizardForSkin = wizard;
    currentSkinCategory = 'standard';

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
        z-index: 10010;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    // Создаём экран выбора категории
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
                <!-- Панель выбора категории -->
                <div style="
                    padding: 30px;
                    animation: scaleIn 0.3s ease-out;
                    text-align: center;
                ">
                    <!-- Заголовок -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                    ">
                        <h2 style="margin: 0; color: #ffd700; font-size: 22px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                            🎨 Выбор облика
                        </h2>
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

                    <!-- Кнопки категорий -->
                    <div style="display: flex; gap: 20px; justify-content: center;">
                        <!-- Стандартные образы -->
                        <button onclick="showSkinCategoryModal('standard')" style="
                            width: 160px;
                            padding: 20px;
                            background: linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(74, 144, 226, 0.1));
                            border: 2px solid rgba(74, 144, 226, 0.6);
                            border-radius: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            text-align: center;
                        " onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='rgba(74, 144, 226, 1)'"
                           onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(74, 144, 226, 0.6)'">
                            <div style="font-size: 40px; margin-bottom: 10px;">⚔️</div>
                            <div style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 5px;">Стандартные</div>
                            <div style="color: #aaa; font-size: 12px;">Открываются за достижения</div>
                        </button>

                        <!-- Премиум образы -->
                        <button onclick="showSkinCategoryModal('premium')" style="
                            width: 160px;
                            padding: 20px;
                            background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.1));
                            border: 2px solid rgba(255, 215, 0, 0.6);
                            border-radius: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            text-align: center;
                        " onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='rgba(255, 215, 0, 1)'"
                           onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255, 215, 0, 0.6)'">
                            <div style="font-size: 40px; margin-bottom: 10px;">👑</div>
                            <div style="color: #ffd700; font-size: 16px; font-weight: bold; margin-bottom: 5px;">Премиум</div>
                            <div style="color: #c9a961; font-size: 12px;">Эксклюзивные образы</div>
                        </button>
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

    // Закрытие по клику вне окна
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSkinModal();
        }
    });
}

/**
 * Показывает модальное окно с выбранной категорией скинов
 */
function showSkinCategoryModal(category) {
    currentSkinCategory = category;
    const wizard = currentWizardForSkin;
    if (!wizard) return;

    const currentSkin = getWizardSkin(wizard.id, wizard.faction);

    // Получаем скины в зависимости от категории
    const skinsToShow = category === 'premium' ? getPremiumSkinsOrdered() : getAllSkinsOrdered();
    const unlockedCount = skinsToShow.filter(id => isSkinUnlocked(id, wizard.faction)).length;

    // Создаём сетку скинов
    let skinsHTML = '';
    for (let i = 0; i < skinsToShow.length; i++) {
        const skinId = skinsToShow[i];
        const skin = SKINS_CONFIG[skinId];
        if (!skin) continue;

        const isUnlocked = isSkinUnlocked(skinId, wizard.faction);
        const isCurrent = currentSkin === skinId;

        skinsHTML += createSkinCard(skinId, skin, isUnlocked, isCurrent, category === 'premium');

        // Перенос строки каждые 3 карточки
        if ((i + 1) % 3 === 0 && i < skinsToShow.length - 1) {
            skinsHTML += '<div style="width: 100%; height: 10px;"></div>';
        }
    }

    const categoryTitle = category === 'premium' ? '👑 Премиум образы' : '⚔️ Стандартные образы';
    const categoryColor = category === 'premium' ? '#ffd700' : '#4a90e2';

    // Обновляем контент
    const contentContainer = document.getElementById('skin-modal-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
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
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="showSkinModal(currentWizardForSkin)" style="
                            background: rgba(0, 0, 0, 0.5);
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 8px;
                            color: white;
                            font-size: 14px;
                            padding: 5px 10px;
                            cursor: pointer;
                        ">← Назад</button>
                        <h2 style="margin: 0; color: ${categoryColor}; font-size: 20px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                            ${categoryTitle}
                        </h2>
                    </div>
                    <p style="margin: 5px 0 0 0; color: #c9a961; font-size: 13px;">
                        ${category === 'premium' ? 'Куплено' : 'Получено'}: ${unlockedCount} / ${skinsToShow.length}
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
    `;

    // Загружаем превью спрайтов
    loadSkinPreviews(skinsToShow);
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
        if (skin.isPremium) {
            // Премиум скины - путь через spriteConfig
            // Например: lady_fire -> images/wizards/fire/lady_fire_idle.webp
            spritePath = `images/wizards/${skin.faction}/${spriteConfig}_idle.webp`;
        } else if (skin.isDefault) {
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
 * Покупка скина из модального окна
 */
async function buySkinFromModal(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin || !skin.isPremium) {
        showNotification('⚠️ Скин недоступен для покупки', 'warning');
        return;
    }

    // Закрываем модальное окно скинов
    closeSkinModal();

    // Открываем диалог покупки через магазин (с выбором Stars или TON)
    if (typeof window.showSkinPaymentDialog === 'function') {
        window.showSkinPaymentDialog(skinId);
    } else {
        // Fallback - прямая покупка через Telegram Stars
        showSkinPurchaseConfirm(skinId);
    }
}

/**
 * Показывает диалог подтверждения покупки скина
 */
function showSkinPurchaseConfirm(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return;

    const overlay = document.createElement('div');
    overlay.id = 'skin-purchase-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10030;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid rgba(255, 215, 0, 0.5);
            border-radius: 16px;
            padding: 25px;
            max-width: 350px;
            text-align: center;
            animation: scaleIn 0.3s ease-out;
        ">
            <h3 style="color: #ffd700; margin: 0 0 15px 0; font-size: 20px;">
                👑 Покупка образа
            </h3>

            <div style="
                background: rgba(0,0,0,0.3);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
            ">
                <div style="font-size: 50px; margin-bottom: 10px;">${skin.icon}</div>
                <div style="color: #fff; font-size: 18px; font-weight: bold;">${skin.name}</div>
                <div style="color: #aaa; font-size: 13px; margin-top: 5px;">${skin.description}</div>
            </div>

            <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                ${skin.price} ⭐
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="closeSkinPurchaseDialog()" style="
                    padding: 10px 25px;
                    background: rgba(100, 100, 100, 0.5);
                    border: 2px solid rgba(150, 150, 150, 0.5);
                    border-radius: 8px;
                    color: #aaa;
                    font-size: 14px;
                    cursor: pointer;
                ">Отмена</button>

                <button onclick="confirmSkinPurchase('${skinId}')" style="
                    padding: 10px 25px;
                    background: linear-gradient(135deg, #ffd700, #ff8c00);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">⭐ Купить</button>
            </div>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSkinPurchaseDialog();
        }
    });

    document.body.appendChild(overlay);
}

/**
 * Закрывает диалог покупки
 */
function closeSkinPurchaseDialog() {
    const overlay = document.getElementById('skin-purchase-overlay');
    if (overlay) overlay.remove();
}

/**
 * Подтверждает покупку скина через Telegram Stars
 */
async function confirmSkinPurchase(skinId) {
    const skin = SKINS_CONFIG[skinId];
    if (!skin) return;

    closeSkinPurchaseDialog();

    // Проверяем доступность Telegram WebApp
    if (!window.Telegram?.WebApp?.openInvoice) {
        showNotification('⚠️ Покупка доступна только в Telegram', 'warning');
        return;
    }

    try {
        // Используем общую функцию createStarsInvoice из shop-modal.js
        if (typeof window.createStarsInvoice !== 'function') {
            throw new Error('Функция createStarsInvoice не найдена');
        }

        const skinItem = {
            id: `skin_${skinId}`, // skin_lady_fire
            name: skin.name,
            price: skin.price
        };

        const invoiceUrl = await window.createStarsInvoice(skinItem, skin.price);

        if (!invoiceUrl) {
            throw new Error('Не получена ссылка на оплату');
        }

        // Открываем оплату через Telegram
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            if (status === 'paid') {
                // Разблокируем скин (webhook тоже это сделает, но для UI обновим сразу)
                await unlockSkin(skinId);
                showNotification(`✨ Образ "${skin.name}" куплен!`, 'success');

                // Переоткрываем модалку с премиум скинами
                if (currentWizardForSkin) {
                    showSkinModal(currentWizardForSkin);
                    setTimeout(() => showSkinCategoryModal('premium'), 100);
                }
            } else if (status === 'cancelled') {
                showNotification('Покупка отменена', 'info');
            } else {
                showNotification('⚠️ Ошибка оплаты', 'error');
            }
        });
    } catch (error) {
        console.error('Ошибка покупки скина:', error);
        showNotification('⚠️ Ошибка покупки', 'error');
    }
}

/**
 * Создаёт карточку скина
 */
function createSkinCard(skinId, skin, isUnlocked, isCurrent, isPremiumCategory = false) {
    const borderColor = isCurrent ? '#4ade80' : (isUnlocked ? 'rgba(255, 215, 0, 0.5)' : 'rgba(150, 150, 150, 0.3)');
    const borderWidth = isCurrent ? '3px' : '2px';
    const bgColor = isUnlocked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)';
    const canvasId = `skin-preview-${skinId}`;

    // Для премиум скинов которые не куплены - показываем кнопку покупки
    const showBuyButton = isPremiumCategory && !isUnlocked && skin.isPremium;

    // Для предпросмотра - клик открывает увеличенный вид для любого скина (разблокированного или премиум)
    const canPreview = isUnlocked || isPremiumCategory;

    return `
        <div style="
            width: 150px;
            background: ${bgColor};
            border: ${borderWidth} solid ${borderColor};
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            cursor: ${canPreview ? 'pointer' : 'default'};
            transition: all 0.3s;
            position: relative;
            backdrop-filter: blur(5px);
        " onclick="${canPreview ? `selectSkin('${skinId}')` : ''}"
           onmouseover="this.style.transform='scale(1.05)'"
           onmouseout="this.style.transform='scale(1)'">

            ${skin.isPremium ? `
                <div style="
                    position: absolute;
                    top: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #ffd700, #ff8c00);
                    color: #000;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: bold;
                ">PREMIUM</div>
            ` : ''}

            <!-- Иконка/Превью -->
            <div style="
                width: 120px;
                height: 120px;
                margin: ${skin.isPremium ? '5px' : '0'} auto 10px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            ">
                <canvas id="${canvasId}" width="120" height="120" style="width: 120px; height: 120px;"></canvas>
                ${!isUnlocked && !showBuyButton ? `
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
            ` : showBuyButton ? `
                <button onclick="event.stopPropagation(); buySkinFromModal('${skinId}')" style="
                    width: 100%;
                    padding: 6px 12px;
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9));
                    border: none;
                    border-radius: 6px;
                    color: #000;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'"
                   onmouseout="this.style.transform='scale(1)'">
                    💎 ${skin.price} ⭐
                </button>
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

// Конфигурация анимаций для скинов магов (все используют 5×5 сетку 1280×1280)
const SKIN_ANIMATION_CONFIG = {
    fire: { frameCount: 25, gridColumns: 5 },    // 5×5 сетка
    water: { frameCount: 25, gridColumns: 5 },   // 5×5 сетка
    wind: { frameCount: 25, gridColumns: 5 },    // 5×5 сетка
    earth: { frameCount: 25, gridColumns: 5 },   // 5×5 сетка
    nature: { frameCount: 25, gridColumns: 5 },  // 5×5 сетка
    poison: { frameCount: 25, gridColumns: 5 },  // 5×5 сетка
    // Премиум скины
    lady_fire: { frameCount: 25, gridColumns: 5 } // 5×5 сетка
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

    // Проверяем, разблокирован ли скин (для премиум - куплен ли)
    const isUnlocked = isSkinUnlocked(skinId, currentWizardForSkin?.faction);
    const isPremiumNotOwned = skin.isPremium && !isUnlocked;

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

    // Кнопки в зависимости от статуса скина
    const buttonsHTML = isPremiumNotOwned ? `
        <!-- Кнопки для премиум скина -->
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="closeSkinPreview()" style="
                padding: 8px 20px;
                background: rgba(100, 100, 100, 0.5);
                border: 2px solid rgba(150, 150, 150, 0.5);
                border-radius: 8px;
                color: #aaa;
                font-size: min(14px, 3.5vw);
                cursor: pointer;
            ">Закрыть</button>
            <button onclick="closeSkinPreview(); buySkinFromModal('${skinId}')" style="
                padding: 8px 20px;
                background: linear-gradient(135deg, #ffd700, #ff8c00);
                border: none;
                border-radius: 8px;
                color: #000;
                font-size: min(14px, 3.5vw);
                font-weight: bold;
                cursor: pointer;
            ">💎 Купить ${skin.price} ⭐</button>
        </div>
    ` : `
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
    `;

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
                ">${skin.name}${isPremiumNotOwned ? ' 👑' : ''}</h3>

                <!-- Превью спрайта с рамкой (адаптивный размер) -->
                <div style="
                    width: min(280px, 70vw);
                    height: min(280px, 70vw);
                    border: 3px solid ${isPremiumNotOwned ? '#ff8c00' : '#ffd700'};
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

                ${buttonsHTML}
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
 * Запускает анимацию превью скина (чередование idle → cast)
 */
function startSkinPreviewAnimation(skin, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Определяем пути к спрайтам idle и cast
    let idlePath, castPath;
    let animConfig;

    if (skin.isPremium) {
        // Премиум скины - путь через spriteConfig
        idlePath = `images/wizards/${skin.faction}/${skin.spriteConfig}_idle.webp`;
        castPath = `images/wizards/${skin.faction}/${skin.spriteConfig}_cast.webp`;
        animConfig = SKIN_ANIMATION_CONFIG[skin.spriteConfig] || { frameCount: 25, gridColumns: 5 };
    } else if (skin.isDefault) {
        idlePath = `images/wizards/${skin.faction}/idle.webp`;
        castPath = `images/wizards/${skin.faction}/cast.webp`;
        animConfig = SKIN_ANIMATION_CONFIG[skin.faction] || { frameCount: 25, gridColumns: 5 };
    } else {
        idlePath = `images/enemies/${skin.spriteConfig}/idle.webp`;
        castPath = `images/enemies/${skin.spriteConfig}/cast.webp`;
        animConfig = SKIN_ANIMATION_CONFIG[skin.spriteConfig] || { frameCount: 25, gridColumns: 5 };
    }

    const frameSize = 256;
    const { frameCount, gridColumns } = animConfig;
    let currentFrame = 0;
    let currentAnimation = 'idle'; // 'idle' или 'cast'
    let cycleCount = 0; // Счётчик циклов для переключения анимации

    // Загружаем оба изображения
    const idleImg = new Image();
    const castImg = new Image();
    let idleLoaded = false;
    let castLoaded = false;

    const startAnimation = () => {
        if (!idleLoaded || !castLoaded) return;

        // Функция отрисовки кадра
        const drawFrame = () => {
            ctx.clearRect(0, 0, 256, 256);

            const img = currentAnimation === 'idle' ? idleImg : castImg;

            let srcX, srcY;
            if (gridColumns) {
                // Сетка (5x5)
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

            currentFrame++;

            // Если закончили цикл - переключаем анимацию
            if (currentFrame >= frameCount) {
                currentFrame = 0;
                cycleCount++;

                // Переключаем между idle и cast каждый цикл
                if (currentAnimation === 'idle') {
                    currentAnimation = 'cast';
                } else {
                    currentAnimation = 'idle';
                }
            }
        };

        // Первый кадр сразу
        drawFrame();

        // Запускаем анимацию (~80ms на кадр для плавности)
        const interval = 80;
        skinPreviewAnimationId = setInterval(drawFrame, interval);
    };

    idleImg.onload = () => {
        idleLoaded = true;
        startAnimation();
    };

    castImg.onload = () => {
        castLoaded = true;
        startAnimation();
    };

    idleImg.src = idlePath;
    castImg.src = castPath;
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

// Экспорт функций и переменных
window.showSkinModal = showSkinModal;
window.closeSkinModal = closeSkinModal;
window.selectSkin = selectSkin;
window.applySkin = applySkin;
window.closeSkinPreview = closeSkinPreview;
window.showSkinCategoryModal = showSkinCategoryModal;
window.buySkinFromModal = buySkinFromModal;
window.closeSkinPurchaseDialog = closeSkinPurchaseDialog;
window.confirmSkinPurchase = confirmSkinPurchase;

// Геттер для currentWizardForSkin (для кнопки "Назад")
Object.defineProperty(window, 'currentWizardForSkin', {
    get: function() { return currentWizardForSkin; },
    set: function(val) { currentWizardForSkin = val; }
});
