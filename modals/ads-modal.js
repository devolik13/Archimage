// ads-modal.js - Экран рекламных заданий (вынесен из airdrop-modal.js)

// Конфигурация категорий заданий
const ADS_CATEGORIES = [
    {
        id: 'crypto',
        title: '💰 Каналы о Крипте',
        color: '#22c55e',
        borderColor: 'rgba(34, 197, 94, 0.4)',
        bgColor: 'rgba(34, 197, 94, 0.08)',
    },
    {
        id: 'games',
        title: '🎮 Игры',
        color: '#60a5fa',
        borderColor: 'rgba(96, 165, 250, 0.4)',
        bgColor: 'rgba(96, 165, 250, 0.08)',
    },
    {
        id: 'adult',
        title: '🔞 Каналы 18+',
        color: '#f43f5e',
        borderColor: 'rgba(244, 63, 94, 0.4)',
        bgColor: 'rgba(244, 63, 94, 0.08)',
    },
    {
        id: 'other',
        title: '📦 Прочее',
        color: '#a78bfa',
        borderColor: 'rgba(167, 139, 250, 0.4)',
        bgColor: 'rgba(167, 139, 250, 0.08)',
    },
];

// Конфигурация заданий
const ADS_TASKS = [
    // --- Каналы о Крипте ---
    {
        id: 'cryptocyeta',
        category: 'crypto',
        icon: '📢',
        name: 'CryptoCyetaUA',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'cryptocyeta',
        action: 'window.openCryptoCyeta()',
        btnLabel: 'Подписаться',
        btnGradient: ['#22c55e', '#16a34a'],
        btnTextColor: '#fff',
    },
    {
        id: 'cryptworks',
        category: 'crypto',
        icon: '📢',
        name: 'Крипто роботяги',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'cryptworks',
        action: 'window.openCryptworks()',
        btnLabel: 'Подписаться',
        btnGradient: ['#8b5cf6', '#7c3aed'],
        btnTextColor: '#fff',
    },
    {
        id: 'cryptohud',
        category: 'crypto',
        icon: '📢',
        name: 'CryptoHud',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'cryptohud',
        action: 'window.openCryptoHud()',
        btnLabel: 'Подписаться',
        btnGradient: ['#3b82f6', '#2563eb'],
        btnTextColor: '#fff',
    },
    // --- Игры ---
    {
        id: 'creaky-tasks',
        category: 'games',
        icon: '📋',
        name: 'Creaky Tasks',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'creaky_tasks',
        action: 'window.openCreakyTasks()',
        btnLabel: 'Выполнить',
        btnGradient: ['#60a5fa', '#3b82f6'],
        btnTextColor: '#fff',
    },
    {
        id: 'money-mining',
        category: 'games',
        icon: '⛏️',
        name: 'Money Mining',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'money_mining',
        action: 'window.openMoneyMining()',
        btnLabel: 'Играть',
        btnGradient: ['#facc15', '#eab308'],
        btnTextColor: '#000',
    },
    {
        id: 'pandafit',
        category: 'games',
        icon: '🐼',
        name: 'PandaFiT',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'pandafit',
        action: 'window.openPandaFit()',
        btnLabel: 'Играть',
        btnGradient: ['#4ade80', '#22c55e'],
        btnTextColor: '#fff',
    },
    {
        id: 'quadroyal',
        category: 'games',
        icon: '🧩',
        name: 'QuadRoyal',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'quadroyal',
        action: 'window.openQuadRoyal()',
        btnLabel: 'Играть',
        btnGradient: ['#a855f7', '#7c3aed'],
        btnTextColor: '#fff',
    },
    {
        id: 'betmode-luck',
        category: 'games',
        icon: '🍀',
        name: 'Betmode Luck',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'betmode_luck',
        action: 'window.openBetmodeLuck()',
        btnLabel: 'Играть',
        btnGradient: ['#fbbf24', '#d97706'],
        btnTextColor: '#000',
    },
    {
        id: 'gift-kombat',
        category: 'games',
        icon: '🥊',
        name: 'Gift Kombat',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'gift_kombat',
        action: 'window.openGiftKombat()',
        checkAction: 'window.checkGiftKombat()',
        btnLabel: 'Начать',
        btnGradient: ['#ef4444', '#dc2626'],
        btnTextColor: '#fff',
    },
    {
        id: 'tinlake',
        category: 'games',
        icon: '📚',
        name: 'Tinlake',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'tinlake',
        action: 'window.openTinlake()',
        btnLabel: 'Начать',
        btnGradient: ['#38bdf8', '#0284c7'],
        btnTextColor: '#fff',
    },
    {
        id: 'star-industry',
        category: 'games',
        icon: '⭐',
        name: 'Star Industry',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'star_industry',
        action: 'window.openStarIndustry()',
        btnLabel: 'Играть',
        btnGradient: ['#facc15', '#ca8a04'],
        btnTextColor: '#000',
    },
    {
        id: 'diamond-dynasty',
        category: 'games',
        icon: '💎',
        name: 'Diamond Dynasty',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'diamond_dynasty',
        action: 'window.openDiamondDynasty()',
        btnLabel: 'Играть',
        btnGradient: ['#facc15', '#ca8a04'],
        btnTextColor: '#000',
    },
    // --- Каналы 18+ ---
    {
        id: 'dreamdares',
        category: 'adult',
        icon: '🔥',
        name: 'dreamdares 18+',
        reward: '+100 BPM + ⏰ 2ч',
        taskKey: 'dreamdares',
        action: 'window.openDreamdares()',
        btnLabel: 'Подписаться',
        btnGradient: ['#f43f5e', '#e11d48'],
        btnTextColor: '#fff',
    },
];

/**
 * Показать модальное окно рекламных заданий
 */
function showAdsModal() {
    console.log('📢 Открытие окна Реклама');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Определяем фракцию игрока для фона
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('ads-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'ads-screen';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="ads-bg" src="${imagePath}" alt="Реклама">
            <div class="tower-ui-overlay" id="ads-overlay"></div>
        </div>
    `;

    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('ads-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupAdsUI();
    if (img.complete) setupAdsUI();

    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон, используем стандартное окно');
        screen.remove();
        showAdsModalFallback();
    };
}

/**
 * Сгенерировать HTML одной карточки задания
 */
function renderTaskCard(task, fontSize, smallFontSize) {
    const completed = window.userData?.completed_tasks?.[task.taskKey];

    // Специальная логика для Gift Kombat (кнопка "Проверить" если уже открывали)
    let buttonHtml;
    if (completed) {
        buttonHtml = `<div style="
            padding: 4px 10px;
            background: #333;
            border-radius: 6px;
            color: #888;
            font-size: ${smallFontSize * 0.9}px;
            text-align: center;
            white-space: nowrap;
        ">✓</div>`;
    } else if (task.checkAction) {
        let gkOpened = false;
        try { gkOpened = localStorage.getItem('gift_kombat_opened') === '1'; } catch(e) {}
        if (gkOpened) {
            buttonHtml = `<button onclick="${task.checkAction}" style="
                padding: 4px 10px;
                background: linear-gradient(135deg, #f97316, #ea580c);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: ${smallFontSize * 0.85}px;
                font-weight: bold;
                cursor: pointer;
                white-space: nowrap;
            ">Проверить</button>`;
        } else {
            buttonHtml = `<button onclick="${task.action}" style="
                padding: 4px 10px;
                background: linear-gradient(135deg, ${task.btnGradient[0]}, ${task.btnGradient[1]});
                border: none;
                border-radius: 6px;
                color: ${task.btnTextColor};
                font-size: ${smallFontSize * 0.85}px;
                font-weight: bold;
                cursor: pointer;
                white-space: nowrap;
            ">${task.btnLabel}</button>`;
        }
    } else {
        buttonHtml = `<button onclick="${task.action}" style="
            padding: 4px 10px;
            background: linear-gradient(135deg, ${task.btnGradient[0]}, ${task.btnGradient[1]});
            border: none;
            border-radius: 6px;
            color: ${task.btnTextColor};
            font-size: ${smallFontSize * 0.85}px;
            font-weight: bold;
            cursor: pointer;
            white-space: nowrap;
        ">${task.btnLabel}</button>`;
    }

    return `
        <div id="ads-${task.id}" style="
            background: rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 70px;
            ${completed ? 'opacity: 0.5;' : ''}
        ">
            <div style="margin-bottom: 6px;">
                <div style="font-size: ${fontSize * 0.9}px; color: #fff; line-height: 1.2;">
                    ${task.icon} ${task.name}
                </div>
                <div style="font-size: ${smallFontSize * 0.85}px; color: #aaa; margin-top: 3px;">
                    ${task.reward}
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                ${buttonHtml}
            </div>
        </div>
    `;
}

/**
 * Сгенерировать HTML секции категории с заданиями в сетке
 */
function renderCategorySection(category, tasks, fontSize, smallFontSize) {
    if (tasks.length === 0) return '';

    const cardsHtml = tasks.map(t => renderTaskCard(t, fontSize, smallFontSize)).join('');

    return `
        <div style="margin-bottom: 12px;">
            <div style="
                font-size: ${fontSize}px;
                font-weight: bold;
                color: ${category.color};
                text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
                margin-bottom: 6px;
                padding: 6px 10px;
                background: ${category.bgColor};
                border: 1px solid ${category.borderColor};
                border-radius: 8px;
            ">${category.title}</div>
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            ">
                ${cardsHtml}
            </div>
        </div>
    `;
}

/**
 * Настройка UI экрана рекламных заданий
 */
function setupAdsUI() {
    const img = document.getElementById('ads-bg');
    const overlay = document.getElementById('ads-overlay');

    if (!img || !overlay) return;

    // Очищаем overlay перед добавлением контента
    overlay.innerHTML = '';

    const rect = img.getBoundingClientRect();

    // Устанавливаем размеры overlay по размеру изображения
    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
    `;

    // Масштаб для координат (базовый размер 768x512)
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;

    // Адаптивные размеры шрифтов
    const titleFontSize = Math.max(16, 22 * Math.min(scaleX, scaleY));
    const baseFontSize = Math.max(12, 14 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(10, 12 * Math.min(scaleX, scaleY));

    // ЗОНЫ UI
    const headerArea = {
        x: 115 * scaleX,
        y: 20 * scaleY,
        width: (655 - 115) * scaleX,
        height: 50 * scaleY
    };

    const contentArea = {
        x: 115 * scaleX,
        y: 70 * scaleY,
        width: (655 - 115) * scaleX,
        height: (410 - 70) * scaleY
    };

    const footerArea = {
        x: 115 * scaleX,
        y: 420 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };

    // === ЗАГОЛОВОК ===
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        position: absolute;
        left: ${headerArea.x}px;
        top: ${headerArea.y}px;
        width: ${headerArea.width}px;
        height: ${headerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    headerContainer.innerHTML = `
        <div style="
            color: #ffd700;
            font-size: ${titleFontSize}px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            text-align: center;
        ">📢 ЗАДАНИЯ</div>
    `;
    overlay.appendChild(headerContainer);

    // === КОНТЕНТ ===
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
        box-sizing: border-box;
    `;

    // Группируем задания по категориям
    let sectionsHtml = '';
    for (const category of ADS_CATEGORIES) {
        const categoryTasks = ADS_TASKS.filter(t => t.category === category.id);
        sectionsHtml += renderCategorySection(category, categoryTasks, baseFontSize, smallFontSize);
    }

    contentContainer.innerHTML = `
        <style>
            #ads-overlay .ads-content::-webkit-scrollbar {
                width: 6px;
            }
            #ads-overlay .ads-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 3px;
            }
            #ads-overlay .ads-content::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.6);
                border-radius: 3px;
            }
        </style>
        ${sectionsHtml}
    `;
    contentContainer.className = 'ads-content';
    overlay.appendChild(contentContainer);

    // === КНОПКА ФУТЕРА ===
    const footerContainer = document.createElement('div');
    footerContainer.style.cssText = `
        position: absolute;
        left: ${footerArea.x}px;
        top: ${footerArea.y}px;
        width: ${footerArea.width}px;
        height: ${footerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `;

    // Кнопка "Назад"
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '← Назад';
    closeBtn.style.cssText = `
        padding: 10px 25px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #ffd700;
        border-radius: 10px;
        color: #ffd700;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    closeBtn.onclick = closeAdsModal;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(255, 215, 0, 0.2)';
        closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.6)';
        closeBtn.style.transform = 'scale(1)';
    };

    footerContainer.appendChild(closeBtn);
    overlay.appendChild(footerContainer);
}

/**
 * Резервное модальное окно
 */
function showAdsModalFallback() {
    const modal = document.createElement('div');
    modal.id = 'ads-modal-fallback';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c2c3d;
        border: 2px solid #ffd700;
        border-radius: 15px;
        padding: 25px;
        z-index: 2000;
        max-width: 350px;
        color: white;
        text-align: center;
    `;

    modal.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 0;">📢 Задания</h3>
        <p style="color: #888; font-size: 14px;">Выполняй задания партнёров и получай BPM coin и время!</p>
        <button onclick="closeAdsModal()" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(145deg, #ffd700, #cc9900);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
        ">Закрыть</button>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'ads-overlay-fallback';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    overlay.onclick = closeAdsModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Закрыть модальное окно рекламных заданий
 */
function closeAdsModal() {
    // Удаляем основной экран
    const screen = document.getElementById('ads-screen');
    if (screen) screen.remove();

    // Удаляем fallback
    const modal = document.getElementById('ads-modal-fallback');
    if (modal) modal.remove();

    const overlay = document.getElementById('ads-overlay-fallback');
    if (overlay) overlay.remove();

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }
}

// Экспорт функций
window.showAdsModal = showAdsModal;
window.closeAdsModal = closeAdsModal;
