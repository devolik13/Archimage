// ads-modal.js - Экран рекламных заданий (вынесен из airdrop-modal.js)

// Конфигурация категорий заданий
const ADS_CATEGORIES = [
    {
        id: 'crypto',
        title: '💰 Каналы о Крипте',
        icon: '💰',
        color: '#22c55e',
        borderColor: 'rgba(34, 197, 94, 0.5)',
        bgGradient: ['rgba(34, 197, 94, 0.25)', 'rgba(34, 197, 94, 0.05)'],
    },
    {
        id: 'games',
        title: '🎮 Игры',
        icon: '🎮',
        color: '#60a5fa',
        borderColor: 'rgba(96, 165, 250, 0.5)',
        bgGradient: ['rgba(96, 165, 250, 0.25)', 'rgba(96, 165, 250, 0.05)'],
    },
    {
        id: 'adult',
        title: '🔞 Каналы 18+',
        icon: '🔞',
        color: '#f43f5e',
        borderColor: 'rgba(244, 63, 94, 0.5)',
        bgGradient: ['rgba(244, 63, 94, 0.25)', 'rgba(244, 63, 94, 0.05)'],
    },
    {
        id: 'other',
        title: '📦 Прочее',
        icon: '📦',
        color: '#a78bfa',
        borderColor: 'rgba(167, 139, 250, 0.5)',
        bgGradient: ['rgba(167, 139, 250, 0.25)', 'rgba(167, 139, 250, 0.05)'],
    },
];

// Конфигурация заданий
const ADS_TASKS = [
    // --- Каналы о Крипте ---
    { id: 'cryptomax', category: 'crypto', icon: '👑', name: 'Crypto Max', reward: '+100 BPM + ⏰ 1 день', taskKey: 'cryptomax', action: 'window.openCryptoMax()', checkAction: 'window.checkCryptoMax()', btnLabel: 'Подписаться', btnGradient: ['#ffd700', '#cc9900'], btnTextColor: '#000' },
    { id: 'criptovidenie', category: 'crypto', icon: '🔮', name: 'Криптовидение', reward: '+100 BPM + ⏰ 1 день', taskKey: 'criptovidenie', action: 'window.openCriptoVidenie()', checkAction: 'window.checkCriptoVidenie()', btnLabel: 'Подписаться', btnGradient: ['#8b5cf6', '#6d28d9'], btnTextColor: '#fff' },
    { id: 'cryptobronia', category: 'crypto', icon: '📢', name: 'Crypto Bronia', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptobronia', action: 'window.openCryptoBronia()', btnLabel: 'Подписаться', btnGradient: ['#22c55e', '#16a34a'], btnTextColor: '#fff' },
    { id: 'cryptozarabotok', category: 'crypto', icon: '📢', name: 'Crypto_Zarabotok', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptozarabotok', action: 'window.openCryptoZarabotok()', btnLabel: 'Подписаться', btnGradient: ['#f59e0b', '#d97706'], btnTextColor: '#000' },
    { id: 'cryptocyeta', category: 'crypto', icon: '📢', name: 'CryptoCyetaUA', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptocyeta', action: 'window.openCryptoCyeta()', btnLabel: 'Подписаться', btnGradient: ['#22c55e', '#16a34a'], btnTextColor: '#fff' },
    { id: 'cryptworks', category: 'crypto', icon: '📢', name: 'Крипто роботяги', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptworks', action: 'window.openCryptworks()', btnLabel: 'Подписаться', btnGradient: ['#8b5cf6', '#7c3aed'], btnTextColor: '#fff' },
    { id: 'cryptohud', category: 'crypto', icon: '📢', name: 'CryptoHud', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptohud', action: 'window.openCryptoHud()', btnLabel: 'Подписаться', btnGradient: ['#3b82f6', '#2563eb'], btnTextColor: '#fff' },
    { id: 'evertrade', category: 'crypto', icon: '📢', name: 'Ever Trade', reward: '+100 BPM + ⏰ 2ч', taskKey: 'evertrade', action: 'window.openEverTrade()', btnLabel: 'Подписаться', btnGradient: ['#10b981', '#059669'], btnTextColor: '#fff' },
    { id: 'lopsamff', category: 'crypto', icon: '📢', name: 'Заработок от lopsamff', reward: '+100 BPM + ⏰ 2ч', taskKey: 'lopsamff', action: 'window.openLopsamff()', btnLabel: 'Подписаться', btnGradient: ['#f97316', '#ea580c'], btnTextColor: '#fff' },
    { id: 'absoluteton', category: 'crypto', icon: '📢', name: 'Абсолютный TON', reward: '+100 BPM + ⏰ 2ч', taskKey: 'absoluteton', action: 'window.openAbsoluteTon()', btnLabel: 'Подписаться', btnGradient: ['#0ea5e9', '#0284c7'], btnTextColor: '#fff' },
    { id: 'cryptosock', category: 'crypto', icon: '📢', name: 'CryptoSock', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptosock', action: 'window.openCryptoSock()', btnLabel: 'Подписаться', btnGradient: ['#6366f1', '#4f46e5'], btnTextColor: '#fff' },
    { id: 'cryptobudni', category: 'crypto', icon: '📢', name: 'Крипто Будни', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptobudni', action: 'window.openCryptoBudni()', btnLabel: 'Подписаться', btnGradient: ['#14b8a6', '#0d9488'], btnTextColor: '#fff' },
    { id: 'labirintkrypty', category: 'crypto', icon: '📢', name: 'Лабиринт Крипты', reward: '+100 BPM + ⏰ 2ч', taskKey: 'labirintkrypty', action: 'window.openLabirintKrypty()', btnLabel: 'Подписаться', btnGradient: ['#ec4899', '#db2777'], btnTextColor: '#fff' },
    { id: 'cryptocompas', category: 'crypto', icon: '🧭', name: 'Компас В TONe', reward: '+100 BPM + ⏰ 2ч', taskKey: 'cryptocompas', action: 'window.openCryptoCompas()', btnLabel: 'Подписаться', btnGradient: ['#0ea5e9', '#0284c7'], btnTextColor: '#fff' },
    // --- Игры ---
    { id: 'creaky-tasks', category: 'games', icon: '📋', name: 'Creaky Tasks', reward: '+100 BPM + ⏰ 2ч', taskKey: 'creaky_tasks', action: 'window.openCreakyTasks()', btnLabel: 'Выполнить', btnGradient: ['#60a5fa', '#3b82f6'], btnTextColor: '#fff' },
    { id: 'money-mining', category: 'games', icon: '⛏️', name: 'Money Mining', reward: '+100 BPM + ⏰ 2ч', taskKey: 'money_mining', action: 'window.openMoneyMining()', btnLabel: 'Играть', btnGradient: ['#facc15', '#eab308'], btnTextColor: '#000' },
    { id: 'pandafit', category: 'games', icon: '🐼', name: 'PandaFiT', reward: '+100 BPM + ⏰ 2ч', taskKey: 'pandafit', action: 'window.openPandaFit()', btnLabel: 'Играть', btnGradient: ['#4ade80', '#22c55e'], btnTextColor: '#fff' },
    { id: 'quadroyal', category: 'games', icon: '🧩', name: 'QuadRoyal', reward: '+100 BPM + ⏰ 2ч', taskKey: 'quadroyal', action: 'window.openQuadRoyal()', btnLabel: 'Играть', btnGradient: ['#a855f7', '#7c3aed'], btnTextColor: '#fff' },
    { id: 'betmode-luck', category: 'games', icon: '🍀', name: 'Betmode Luck', reward: '+100 BPM + ⏰ 2ч', taskKey: 'betmode_luck', action: 'window.openBetmodeLuck()', btnLabel: 'Играть', btnGradient: ['#fbbf24', '#d97706'], btnTextColor: '#000' },
    { id: 'gift-kombat', category: 'games', icon: '🥊', name: 'Gift Kombat', reward: '+100 BPM + ⏰ 2ч', taskKey: 'gift_kombat', action: 'window.openGiftKombat()', checkAction: 'window.checkGiftKombat()', btnLabel: 'Начать', btnGradient: ['#ef4444', '#dc2626'], btnTextColor: '#fff' },
    { id: 'tinlake', category: 'games', icon: '📚', name: 'Tinlake', reward: '+100 BPM + ⏰ 2ч', taskKey: 'tinlake', action: 'window.openTinlake()', btnLabel: 'Начать', btnGradient: ['#38bdf8', '#0284c7'], btnTextColor: '#fff' },
    { id: 'star-industry', category: 'games', icon: '⭐', name: 'Star Industry', reward: '+100 BPM + ⏰ 2ч', taskKey: 'star_industry', action: 'window.openStarIndustry()', btnLabel: 'Играть', btnGradient: ['#facc15', '#ca8a04'], btnTextColor: '#000' },
    { id: 'diamond-dynasty', category: 'games', icon: '💎', name: 'Diamond Dynasty', reward: '+100 BPM + ⏰ 2ч', taskKey: 'diamond_dynasty', action: 'window.openDiamondDynasty()', btnLabel: 'Играть', btnGradient: ['#facc15', '#ca8a04'], btnTextColor: '#000' },
    { id: 'gemifaucet', category: 'games', icon: '🪙', name: 'gemifaucet', reward: '+100 BPM + ⏰ 2ч', taskKey: 'gemifaucet', action: 'window.openGemiFaucet()', btnLabel: 'Играть', btnGradient: ['#facc15', '#ca8a04'], btnTextColor: '#000' },
    // --- Каналы 18+ ---
    { id: 'dreamdares', category: 'adult', icon: '🔥', name: 'dreamdares 18+', reward: '+100 BPM + ⏰ 2ч', taskKey: 'dreamdares', action: 'window.openDreamdares()', btnLabel: 'Подписаться', btnGradient: ['#f43f5e', '#e11d48'], btnTextColor: '#fff' },
];

/**
 * Подсчитать прогресс выполнения заданий в категории
 */
function getCategoryProgress(categoryId) {
    const tasks = ADS_TASKS.filter(t => t.category === categoryId);
    if (tasks.length === 0) return { total: 0, done: 0 };
    const done = tasks.filter(t => window.userData?.completed_tasks?.[t.taskKey]).length;
    return { total: tasks.length, done };
}

// ============================================
// ГЛАВНЫЙ ЭКРАН — сетка 2x2 из категорий
// ============================================

/**
 * Показать модальное окно рекламных заданий
 */
function showAdsModal() {
    console.log('📢 Открытие окна Реклама');

    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    const existingScreen = document.getElementById('ads-screen');
    if (existingScreen) existingScreen.remove();

    const screen = document.createElement('div');
    screen.id = 'ads-screen';
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="ads-bg" src="${imagePath}" alt="Реклама">
            <div class="tower-ui-overlay" id="ads-overlay"></div>
        </div>
    `;
    screen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.9); z-index: 9000;
        display: flex; align-items: center; justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('ads-bg');
    img.onload = () => setupAdsCategoriesUI();
    if (img.complete) setupAdsCategoriesUI();
    img.onerror = () => { screen.remove(); showAdsModalFallback(); };
}

/**
 * Настройка UI — главный экран с 4 блоками категорий
 */
function setupAdsCategoriesUI() {
    const img = document.getElementById('ads-bg');
    const overlay = document.getElementById('ads-overlay');
    if (!img || !overlay) return;

    overlay.innerHTML = '';

    const rect = img.getBoundingClientRect();
    overlay.style.cssText = `
        position: absolute; left: ${rect.left}px; top: ${rect.top}px;
        width: ${rect.width}px; height: ${rect.height}px; pointer-events: none;
    `;

    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;
    const scale = Math.min(scaleX, scaleY);

    const titleFontSize = Math.max(16, 22 * scale);
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);
    const iconSize = Math.max(28, 40 * scale);

    // Зоны
    const headerArea = { x: 115 * scaleX, y: 20 * scaleY, width: (655 - 115) * scaleX, height: 50 * scaleY };
    const contentArea = { x: 115 * scaleX, y: 75 * scaleY, width: (655 - 115) * scaleX, height: (405 - 75) * scaleY };
    const footerArea = { x: 115 * scaleX, y: 420 * scaleY, width: (655 - 115) * scaleX, height: 60 * scaleY };

    // === ЗАГОЛОВОК ===
    const header = document.createElement('div');
    header.style.cssText = `
        position: absolute; left: ${headerArea.x}px; top: ${headerArea.y}px;
        width: ${headerArea.width}px; height: ${headerArea.height}px;
        pointer-events: auto; display: flex; align-items: center; justify-content: center;
    `;
    header.innerHTML = `<div style="
        color: #ffd700; font-size: ${titleFontSize}px; font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8); text-align: center;
    ">📢 ЗАДАНИЯ</div>`;
    overlay.appendChild(header);

    // === СЕТКА КАТЕГОРИЙ 2x2 ===
    const content = document.createElement('div');
    content.style.cssText = `
        position: absolute; left: ${contentArea.x}px; top: ${contentArea.y}px;
        width: ${contentArea.width}px; height: ${contentArea.height}px;
        pointer-events: auto; display: grid; grid-template-columns: 1fr 1fr;
        gap: ${10 * scale}px; padding: ${8 * scale}px; box-sizing: border-box;
    `;

    for (const cat of ADS_CATEGORIES) {
        const progress = getCategoryProgress(cat.id);
        const hasAny = progress.total > 0;
        const allDone = progress.total > 0 && progress.done === progress.total;

        const block = document.createElement('div');
        block.style.cssText = `
            background: linear-gradient(145deg, ${cat.bgGradient[0]}, ${cat.bgGradient[1]});
            border: 2px solid ${cat.borderColor};
            border-radius: ${12 * scale}px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: ${hasAny ? 'pointer' : 'default'};
            transition: transform 0.15s, box-shadow 0.15s;
            padding: ${10 * scale}px;
            ${allDone ? 'opacity: 0.6;' : ''}
        `;

        // Прогресс-бар
        const progressBarHtml = hasAny ? `
            <div style="
                width: 80%; height: ${5 * scale}px; background: rgba(0,0,0,0.4);
                border-radius: 3px; margin-top: ${8 * scale}px; overflow: hidden;
            ">
                <div style="
                    width: ${(progress.done / progress.total) * 100}%;
                    height: 100%; background: ${cat.color}; border-radius: 3px;
                    transition: width 0.3s;
                "></div>
            </div>
            <div style="font-size: ${smallFontSize * 0.85}px; color: #aaa; margin-top: ${4 * scale}px;">
                ${progress.done}/${progress.total} выполнено
            </div>
        ` : `
            <div style="font-size: ${smallFontSize * 0.85}px; color: #666; margin-top: ${8 * scale}px;">
                Скоро
            </div>
        `;

        block.innerHTML = `
            <div style="font-size: ${iconSize}px; line-height: 1;">${cat.icon}</div>
            <div style="
                font-size: ${baseFontSize}px; font-weight: bold; color: ${cat.color};
                text-shadow: 1px 1px 3px rgba(0,0,0,0.8); margin-top: ${6 * scale}px;
                text-align: center;
            ">${cat.title.replace(cat.icon + ' ', '')}</div>
            ${progressBarHtml}
        `;

        if (hasAny) {
            block.onmouseenter = () => { block.style.transform = 'scale(1.03)'; block.style.boxShadow = `0 0 20px ${cat.borderColor}`; };
            block.onmouseleave = () => { block.style.transform = 'scale(1)'; block.style.boxShadow = 'none'; };
            block.onclick = () => openAdsCategory(cat.id);
        }

        content.appendChild(block);
    }

    overlay.appendChild(content);

    // === КНОПКА НАЗАД ===
    const footer = document.createElement('div');
    footer.style.cssText = `
        position: absolute; left: ${footerArea.x}px; top: ${footerArea.y}px;
        width: ${footerArea.width}px; height: ${footerArea.height}px;
        pointer-events: auto; display: flex; align-items: center; justify-content: center;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '← Назад';
    closeBtn.style.cssText = `
        padding: 10px 25px; background: rgba(0,0,0,0.6); border: 2px solid #ffd700;
        border-radius: 10px; color: #ffd700; font-size: ${baseFontSize}px;
        font-weight: bold; cursor: pointer; transition: all 0.3s;
    `;
    closeBtn.onclick = closeAdsModal;
    closeBtn.onmouseenter = () => { closeBtn.style.background = 'rgba(255,215,0,0.2)'; closeBtn.style.transform = 'scale(1.05)'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'rgba(0,0,0,0.6)'; closeBtn.style.transform = 'scale(1)'; };
    footer.appendChild(closeBtn);
    overlay.appendChild(footer);
}

// ============================================
// ЭКРАН КАТЕГОРИИ — список заданий
// ============================================

/**
 * Открыть экран заданий конкретной категории
 */
function openAdsCategory(categoryId) {
    const category = ADS_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const tasks = ADS_TASKS.filter(t => t.category === categoryId);
    if (tasks.length === 0) return;

    console.log(`📢 Открытие категории: ${category.title}`);

    // Переключаем overlay на экран категории
    const img = document.getElementById('ads-bg');
    const overlay = document.getElementById('ads-overlay');
    if (!img || !overlay) return;

    overlay.innerHTML = '';

    const rect = img.getBoundingClientRect();
    overlay.style.cssText = `
        position: absolute; left: ${rect.left}px; top: ${rect.top}px;
        width: ${rect.width}px; height: ${rect.height}px; pointer-events: none;
    `;

    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;
    const scale = Math.min(scaleX, scaleY);

    const titleFontSize = Math.max(16, 22 * scale);
    const baseFontSize = Math.max(12, 14 * scale);
    const smallFontSize = Math.max(10, 12 * scale);

    const headerArea = { x: 115 * scaleX, y: 20 * scaleY, width: (655 - 115) * scaleX, height: 50 * scaleY };
    const contentArea = { x: 115 * scaleX, y: 75 * scaleY, width: (655 - 115) * scaleX, height: (405 - 75) * scaleY };
    const footerArea = { x: 115 * scaleX, y: 420 * scaleY, width: (655 - 115) * scaleX, height: 60 * scaleY };

    // === ЗАГОЛОВОК КАТЕГОРИИ ===
    const header = document.createElement('div');
    header.style.cssText = `
        position: absolute; left: ${headerArea.x}px; top: ${headerArea.y}px;
        width: ${headerArea.width}px; height: ${headerArea.height}px;
        pointer-events: auto; display: flex; align-items: center; justify-content: center;
    `;
    header.innerHTML = `<div style="
        color: ${category.color}; font-size: ${titleFontSize}px; font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8); text-align: center;
    ">${category.title}</div>`;
    overlay.appendChild(header);

    // === СПИСОК ЗАДАНИЙ (сетка 2 колонки) ===
    const content = document.createElement('div');
    content.style.cssText = `
        position: absolute; left: ${contentArea.x}px; top: ${contentArea.y}px;
        width: ${contentArea.width}px; height: ${contentArea.height}px;
        pointer-events: auto; overflow-y: auto; overflow-x: hidden;
        padding: ${8 * scale}px; box-sizing: border-box;
    `;

    const cardsHtml = tasks.map(task => renderTaskCard(task, baseFontSize, smallFontSize)).join('');

    content.innerHTML = `
        <style>
            #ads-overlay .ads-cat-content::-webkit-scrollbar { width: 6px; }
            #ads-overlay .ads-cat-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 3px; }
            #ads-overlay .ads-cat-content::-webkit-scrollbar-thumb { background: ${category.color}; border-radius: 3px; }
        </style>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${6 * scale}px;">
            ${cardsHtml}
        </div>
    `;
    content.className = 'ads-cat-content';
    overlay.appendChild(content);

    // === КНОПКА НАЗАД (к категориям) ===
    const footer = document.createElement('div');
    footer.style.cssText = `
        position: absolute; left: ${footerArea.x}px; top: ${footerArea.y}px;
        width: ${footerArea.width}px; height: ${footerArea.height}px;
        pointer-events: auto; display: flex; align-items: center; justify-content: center;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = `
        padding: 10px 25px; background: rgba(0,0,0,0.6);
        border: 2px solid ${category.color}; border-radius: 10px;
        color: ${category.color}; font-size: ${baseFontSize}px;
        font-weight: bold; cursor: pointer; transition: all 0.3s;
    `;
    backBtn.onclick = () => setupAdsCategoriesUI();
    backBtn.onmouseenter = () => { backBtn.style.background = `${category.bgGradient[0]}`; backBtn.style.transform = 'scale(1.05)'; };
    backBtn.onmouseleave = () => { backBtn.style.background = 'rgba(0,0,0,0.6)'; backBtn.style.transform = 'scale(1)'; };
    footer.appendChild(backBtn);
    overlay.appendChild(footer);
}

// ============================================
// КАРТОЧКА ЗАДАНИЯ
// ============================================

/**
 * Сгенерировать HTML одной карточки задания
 */
function renderTaskCard(task, fontSize, smallFontSize) {
    const completed = window.userData?.completed_tasks?.[task.taskKey];

    let buttonHtml;
    if (completed) {
        buttonHtml = `<div style="
            padding: 4px 10px; background: #333; border-radius: 6px;
            color: #888; font-size: ${smallFontSize * 0.9}px;
            text-align: center; white-space: nowrap;
        ">✓</div>`;
    } else if (task.checkAction) {
        let taskOpened = false;
        try { taskOpened = localStorage.getItem(`${task.taskKey}_opened`) === '1'; } catch(e) {}
        if (taskOpened) {
            buttonHtml = `<div style="display: flex; gap: 4px; align-items: center;">
                <button onclick="${task.action}" style="
                    padding: 4px 8px; background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; color: #aaa;
                    font-size: ${smallFontSize * 0.75}px; cursor: pointer; white-space: nowrap;
                ">Перейти</button>
                <button onclick="${task.checkAction}" style="
                    padding: 4px 10px; background: linear-gradient(135deg, #f97316, #ea580c);
                    border: none; border-radius: 6px; color: white;
                    font-size: ${smallFontSize * 0.85}px; font-weight: bold;
                    cursor: pointer; white-space: nowrap;
                ">Проверить</button>
            </div>`;
        } else {
            buttonHtml = `<button onclick="${task.action}" style="
                padding: 4px 10px; background: linear-gradient(135deg, ${task.btnGradient[0]}, ${task.btnGradient[1]});
                border: none; border-radius: 6px; color: ${task.btnTextColor};
                font-size: ${smallFontSize * 0.85}px; font-weight: bold;
                cursor: pointer; white-space: nowrap;
            ">${task.btnLabel}</button>`;
        }
    } else {
        buttonHtml = `<button onclick="${task.action}" style="
            padding: 4px 10px; background: linear-gradient(135deg, ${task.btnGradient[0]}, ${task.btnGradient[1]});
            border: none; border-radius: 6px; color: ${task.btnTextColor};
            font-size: ${smallFontSize * 0.85}px; font-weight: bold;
            cursor: pointer; white-space: nowrap;
        ">${task.btnLabel}</button>`;
    }

    return `
        <div id="ads-${task.id}" style="
            background: rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px; padding: 8px;
            display: flex; flex-direction: column;
            justify-content: space-between; min-height: 70px;
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

// ============================================
// FALLBACK & CLOSE
// ============================================

function showAdsModalFallback() {
    const modal = document.createElement('div');
    modal.id = 'ads-modal-fallback';
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #2c2c3d; border: 2px solid #ffd700; border-radius: 15px;
        padding: 25px; z-index: 2000; max-width: 350px; color: white; text-align: center;
    `;
    modal.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 0;">📢 Задания</h3>
        <p style="color: #888; font-size: 14px;">Выполняй задания партнёров и получай BPM coin и время!</p>
        <button onclick="closeAdsModal()" style="
            width: 100%; padding: 12px; background: linear-gradient(145deg, #ffd700, #cc9900);
            border: none; border-radius: 8px; color: #000; font-weight: bold;
            cursor: pointer; margin-top: 15px;
        ">Закрыть</button>
    `;

    const bg = document.createElement('div');
    bg.id = 'ads-overlay-fallback';
    bg.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 1999;
    `;
    bg.onclick = closeAdsModal;

    document.body.appendChild(bg);
    document.body.appendChild(modal);
}

function closeAdsModal() {
    const screen = document.getElementById('ads-screen');
    if (screen) screen.remove();

    const modal = document.getElementById('ads-modal-fallback');
    if (modal) modal.remove();

    const bg = document.getElementById('ads-overlay-fallback');
    if (bg) bg.remove();

    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'flex';
}

// Экспорт функций
window.showAdsModal = showAdsModal;
window.closeAdsModal = closeAdsModal;
window.openAdsCategory = openAdsCategory;
