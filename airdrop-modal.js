// airdrop-modal.js - Экран Airdrop с очками и кошельком

// ==========================================
// TON CONNECT ИНТЕГРАЦИЯ
// ==========================================

/**
 * Глобальная переменная для TON Connect UI
 */
let tonConnectUI = null;

/**
 * Инициализация TON Connect
 * Вызывается один раз при загрузке страницы
 */
function initTonConnect() {
    // Проверяем, что библиотека загружена
    if (typeof TON_CONNECT_UI === 'undefined' && typeof TonConnectUI === 'undefined') {
        console.warn('⚠️ TON Connect UI библиотека не загружена');
        return null;
    }

    // Если уже инициализирован - возвращаем существующий экземпляр
    if (tonConnectUI) {
        return tonConnectUI;
    }

    try {
        // Создаём экземпляр TON Connect UI
        const TonConnectUIClass = window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI;

        tonConnectUI = new TonConnectUIClass({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            // Для Telegram Mini App используем встроенный кошелёк
            walletsListConfiguration: {
                includeWallets: [
                    {
                        appName: "tonkeeper",
                        name: "Tonkeeper",
                        imageUrl: "https://tonkeeper.com/assets/tonkeeper-logo.png",
                        aboutUrl: "https://tonkeeper.com",
                        universalLink: "https://app.tonkeeper.com/ton-connect",
                        bridgeUrl: "https://bridge.tonapi.io/bridge",
                        platforms: ["ios", "android", "chrome", "firefox", "safari"]
                    },
                    {
                        appName: "tonhub",
                        name: "Tonhub",
                        imageUrl: "https://tonhub.com/tonhub-logo.png",
                        aboutUrl: "https://tonhub.com",
                        universalLink: "https://tonhub.com/ton-connect",
                        bridgeUrl: "https://connect.tonhubapi.com/tonconnect",
                        platforms: ["ios", "android"]
                    },
                    {
                        appName: "mytonwallet",
                        name: "MyTonWallet",
                        imageUrl: "https://mytonwallet.io/icon-256.png",
                        aboutUrl: "https://mytonwallet.io",
                        universalLink: "https://connect.mytonwallet.org",
                        bridgeUrl: "https://tonconnectbridge.mytonwallet.org/bridge",
                        platforms: ["chrome", "windows", "macos", "linux", "ios", "android", "firefox"]
                    }
                ]
            }
        });

        // Подписываемся на изменения статуса подключения
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                console.log('👛 Кошелёк подключён:', wallet.account.address);
                handleWalletConnected(wallet);
            } else {
                console.log('👛 Кошелёк отключён');
                handleWalletDisconnected();
            }
        });

        // Проверяем, есть ли уже подключённый кошелёк
        const connectedWallet = tonConnectUI.wallet;
        if (connectedWallet) {
            console.log('👛 Найден ранее подключённый кошелёк');
            handleWalletConnected(connectedWallet);
        }

        console.log('✅ TON Connect UI инициализирован');
        return tonConnectUI;

    } catch (error) {
        console.error('❌ Ошибка инициализации TON Connect:', error);
        return null;
    }
}

/**
 * Обработка успешного подключения кошелька
 * @param {object} wallet - Объект кошелька от TON Connect
 */
function handleWalletConnected(wallet) {
    if (!wallet || !wallet.account) return;

    // Конвертируем raw address в user-friendly формат
    const rawAddress = wallet.account.address;
    const userFriendlyAddress = convertToUserFriendlyAddress(rawAddress);

    console.log('👛 Raw address:', rawAddress);
    console.log('👛 User-friendly address:', userFriendlyAddress);

    // Сохраняем в userData
    if (window.userData) {
        window.userData.wallet_address = userFriendlyAddress;
        window.userData.wallet_connected_at = Date.now();

        // Сохраняем в БД
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            window.dbManager.savePlayer(window.userData);
            console.log('✅ Адрес кошелька сохранён в БД');
        }
    }

    // Показываем уведомление
    if (window.showNotification) {
        window.showNotification('👛 Кошелёк успешно подключён!');
    }

    // Обновляем UI модалки если она открыта
    refreshAirdropModalUI();
}

/**
 * Обработка отключения кошелька
 */
function handleWalletDisconnected() {
    if (window.userData) {
        window.userData.wallet_address = null;
        window.userData.wallet_connected_at = null;

        // Сохраняем в БД
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            window.dbManager.savePlayer(window.userData);
        }
    }

    // Показываем уведомление
    if (window.showNotification) {
        window.showNotification('👛 Кошелёк отключён');
    }

    // Обновляем UI
    refreshAirdropModalUI();
}

/**
 * Конвертация raw address в user-friendly формат
 * @param {string} rawAddress - Raw адрес из TON Connect
 * @returns {string} - User-friendly адрес
 */
function convertToUserFriendlyAddress(rawAddress) {
    // TON Connect возвращает адрес в формате "0:xxx..." (raw)
    // Нам нужен user-friendly формат "EQ..." или "UQ..."
    // Для простоты пока возвращаем как есть - можно добавить конвертацию позже

    // Если адрес уже в нужном формате
    if (rawAddress.startsWith('EQ') || rawAddress.startsWith('UQ')) {
        return rawAddress;
    }

    // Для raw адреса пока возвращаем его же
    // В продакшене нужно использовать библиотеку @ton/ton для конвертации
    return rawAddress;
}

/**
 * Обновить UI модалки Airdrop
 */
function refreshAirdropModalUI() {
    const screen = document.getElementById('airdrop-screen');
    if (screen) {
        closeAirdropModal();
        setTimeout(() => showAirdropModal(), 100);
    }
}

// Инициализируем TON Connect при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initTonConnect, 500);
    });
} else {
    setTimeout(initTonConnect, 500);
}

// ==========================================
// ОСНОВНОЙ КОД МОДАЛКИ AIRDROP
// ==========================================

/**
 * Показать модальное окно Airdrop
 */
function showAirdropModal() {
    console.log('🪂 Открытие окна Airdrop');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Определяем фракцию игрока для фона
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('airdrop-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'airdrop-screen';
    screen.className = 'airdrop-screen active';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="airdrop-bg" src="${imagePath}" alt="Airdrop">
            <div class="tower-ui-overlay" id="airdrop-overlay"></div>
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

    const img = document.getElementById('airdrop-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupAirdropUI();
    if (img.complete) setupAirdropUI();

    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон, используем стандартное окно');
        screen.remove();
        showAirdropModalFallback();
    };
}

/**
 * Настройка UI экрана Airdrop
 */
function setupAirdropUI() {
    const img = document.getElementById('airdrop-bg');
    const overlay = document.getElementById('airdrop-overlay');

    if (!img || !overlay) return;

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
    const bigFontSize = Math.max(20, 28 * Math.min(scaleX, scaleY));

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

    // Получаем данные игрока
    const airdropPoints = window.userData?.airdrop_points || 0;
    const walletAddress = window.userData?.wallet_address || null;

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
        ">🪂 AIRDROP</div>
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
        padding: 10px;
        box-sizing: border-box;
    `;

    // Форматируем адрес кошелька
    const walletDisplay = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : 'Не подключен';
    const walletStatusColor = walletAddress ? '#4ade80' : '#888';

    contentContainer.innerHTML = `
        <style>
            #airdrop-overlay .airdrop-content::-webkit-scrollbar {
                width: 8px;
            }
            #airdrop-overlay .airdrop-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
            }
            #airdrop-overlay .airdrop-content::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.6);
                border-radius: 4px;
            }
        </style>

        <!-- Очки и позиция (кликабельно для детализации) -->
        <div onclick="window.showAirdropPointsBreakdown()" style="
            background: linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.1) 100%);
            border: 2px solid #ffd700;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        " onmouseover="this.style.background='linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.1) 100%)'">
            <div style="font-size: ${smallFontSize}px; color: #aaa; margin-bottom: 5px;">Твои очки 💡</div>
            <div style="font-size: ${bigFontSize}px; color: #ffd700; font-weight: bold;">${airdropPoints.toLocaleString()}</div>
            <div style="font-size: ${smallFontSize}px; color: #888; margin-top: 5px;">
                📊 Нажми для детализации
            </div>
        </div>

        <!-- Кошелек -->
        <div style="
            background: rgba(0,0,0,0.4);
            border: 1px solid ${walletStatusColor};
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 12px;
        ">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-size: ${smallFontSize}px; color: #aaa;">👛 Кошелек TON</div>
                    <div style="font-size: ${baseFontSize}px; color: ${walletStatusColor}; font-weight: bold; margin-top: 4px;">
                        ${walletDisplay}
                    </div>
                </div>
                <button id="wallet-connect-btn" style="
                    padding: 8px 16px;
                    background: ${walletAddress ? '#4a4a6a' : 'linear-gradient(145deg, #0088cc, #006699)'};
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    cursor: pointer;
                    font-weight: bold;
                ">${walletAddress ? 'Отключить' : 'Подключить'}</button>
            </div>
        </div>

        <!-- Как заработать -->
        <div style="
            background: rgba(0,0,0,0.4);
            border: 1px solid #555;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 12px;
        ">
            <div style="font-size: ${baseFontSize}px; color: #ffd700; font-weight: bold; margin-bottom: 10px;">
                📈 Как заработать очки
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">⚔️ Победа в PvP</span>
                    <span style="color: #4ade80;">+10</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">📅 Ежедневный вход</span>
                    <span style="color: #4ade80;">+20</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">📚 Изучение заклинания</span>
                    <span style="color: #4ade80;">+100</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">👥 Приглашение друга</span>
                    <span style="color: #4ade80;">+200</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">🏰 Постройка/улучшение здания</span>
                    <span style="color: #4ade80;">+100</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">🎯 Прохождение главы PvE</span>
                    <span style="color: #4ade80;">+500</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">🔥 Streak 7/30/100 дней</span>
                    <span style="color: #4ade80;">+100/500/1000</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: ${smallFontSize}px;">
                    <span style="color: #ccc;">⭐ 100 Telegram Stars</span>
                    <span style="color: #4ade80;">+10</span>
                </div>
            </div>
        </div>

        <!-- Топ игроков -->
        <div style="
            background: rgba(0,0,0,0.4);
            border: 1px solid #555;
            border-radius: 10px;
            padding: 12px;
        ">
            <div style="font-size: ${baseFontSize}px; color: #ffd700; font-weight: bold; margin-bottom: 10px;">
                🏆 Топ игроков
            </div>
            <div id="airdrop-leaderboard" style="display: flex; flex-direction: column; gap: 4px; font-size: ${smallFontSize}px; color: #888;">
                Загрузка...
            </div>
        </div>
    `;
    contentContainer.className = 'airdrop-content';
    overlay.appendChild(contentContainer);

    // === КНОПКА ЗАКРЫТЬ ===
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
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.cssText = `
        padding: 10px 40px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #ffd700;
        border-radius: 10px;
        color: #ffd700;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    closeBtn.onclick = closeAirdropModal;
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

    // Добавляем обработчик кнопки кошелька
    setTimeout(() => {
        const walletBtn = document.getElementById('wallet-connect-btn');
        if (walletBtn) {
            walletBtn.onclick = () => {
                if (walletAddress) {
                    disconnectWallet();
                } else {
                    connectWallet();
                }
            };
        }
    }, 100);

    // Загружаем лидерборд
    loadAirdropLeaderboard();
}

/**
 * Подключение кошелька через TON Connect
 */
async function connectWallet() {
    console.log('👛 Подключение кошелька...');

    // Инициализируем TON Connect если ещё не сделано
    if (!tonConnectUI) {
        initTonConnect();
    }

    if (!tonConnectUI) {
        console.error('❌ TON Connect не инициализирован');
        if (window.showNotification) {
            window.showNotification('❌ Ошибка инициализации кошелька');
        }
        return;
    }

    try {
        // Проверяем, подключён ли уже кошелёк
        if (tonConnectUI.wallet) {
            console.log('👛 Кошелёк уже подключён');
            return;
        }

        // Открываем модальное окно выбора кошелька
        await tonConnectUI.openModal();
        console.log('👛 Модальное окно TON Connect открыто');

    } catch (error) {
        console.error('❌ Ошибка подключения кошелька:', error);
        if (window.showNotification) {
            window.showNotification('❌ Ошибка подключения кошелька');
        }
    }
}

/**
 * Отключение кошелька через TON Connect
 */
async function disconnectWallet() {
    console.log('👛 Отключение кошелька...');

    try {
        if (tonConnectUI) {
            await tonConnectUI.disconnect();
            console.log('✅ Кошелёк отключён через TON Connect');
        }

        // Очищаем данные локально (на случай если TON Connect не работает)
        if (window.userData) {
            window.userData.wallet_address = null;
            window.userData.wallet_connected_at = null;

            // Сохраняем в БД
            if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
                window.dbManager.savePlayer(window.userData);
            }
        }

        // Перезагружаем модалку
        closeAirdropModal();
        setTimeout(() => showAirdropModal(), 100);

    } catch (error) {
        console.error('❌ Ошибка отключения кошелька:', error);
        if (window.showNotification) {
            window.showNotification('❌ Ошибка отключения кошелька');
        }
    }
}

/**
 * Загрузка лидерборда airdrop
 */
async function loadAirdropLeaderboard() {
    const leaderboardDiv = document.getElementById('airdrop-leaderboard');
    if (!leaderboardDiv) return;

    try {
        // Пока используем заглушку
        // TODO: Реальный запрос к БД
        const mockLeaderboard = [
            { username: 'TopMage', points: 15420 },
            { username: 'FireLord', points: 12100 },
            { username: 'IceQueen', points: 11890 },
            { username: 'StormBringer', points: 9500 },
            { username: 'EarthShaker', points: 8200 }
        ];

        leaderboardDiv.innerHTML = mockLeaderboard.map((player, index) => `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: ${index < 3 ? '#ffd700' : '#ccc'};">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} ${player.username}
                </span>
                <span style="color: #4ade80;">${player.points.toLocaleString()}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        leaderboardDiv.innerHTML = '<div style="color: #888;">Не удалось загрузить</div>';
    }
}

/**
 * Добавить очки airdrop игроку
 */
function addAirdropPoints(points, reason = '') {
    if (!window.userData) return;

    const oldPoints = window.userData.airdrop_points || 0;
    window.userData.airdrop_points = oldPoints + points;

    // Накапливаем суммы по категориям (вместо истории)
    if (!window.userData.airdrop_breakdown) {
        window.userData.airdrop_breakdown = {};
    }

    // Добавляем очки к категории
    const category = reason || 'Другое';
    window.userData.airdrop_breakdown[category] = (window.userData.airdrop_breakdown[category] || 0) + points;

    console.log(`🪂 Airdrop: +${points} очков (${reason}). Всего: ${window.userData.airdrop_points}`);
    console.log(`🪂 [DEBUG] window.userData.airdrop_points = ${window.userData.airdrop_points}`);
    console.log(`🪂 [DEBUG] window.userData.airdrop_breakdown:`, window.userData.airdrop_breakdown);

    // Сохраняем в БД
    if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
        console.log('🪂 [DEBUG] Вызов dbManager.savePlayer() для сохранения airdrop очков...');
        const saveResult = window.dbManager.savePlayer(window.userData);
        console.log('🪂 [DEBUG] savePlayer вызван, результат:', saveResult);
    } else {
        console.error('❌ [DEBUG] dbManager.savePlayer не доступен!');
    }

    // Показываем уведомление
    if (window.showNotification && points > 0) {
        window.showNotification(`🪂 +${points} очков Airdrop!`);
    }
}

/**
 * Резервное модальное окно
 */
function showAirdropModalFallback() {
    const modal = document.createElement('div');
    modal.id = 'airdrop-modal-fallback';
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

    const points = window.userData?.airdrop_points || 0;

    modal.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 0;">🪂 AIRDROP</h3>
        <div style="font-size: 32px; color: #ffd700; font-weight: bold; margin: 20px 0;">
            ${points.toLocaleString()} очков
        </div>
        <p style="color: #888; font-size: 14px;">Зарабатывай очки играя и получи токены при airdrop!</p>
        <button onclick="closeAirdropModal()" style="
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
    overlay.id = 'airdrop-overlay-fallback';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    overlay.onclick = closeAirdropModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Закрыть модальное окно Airdrop
 */
function closeAirdropModal() {
    // Удаляем основной экран
    const screen = document.getElementById('airdrop-screen');
    if (screen) screen.remove();

    // Удаляем fallback
    const modal = document.getElementById('airdrop-modal-fallback');
    if (modal) modal.remove();

    const overlay = document.getElementById('airdrop-overlay-fallback');
    if (overlay) overlay.remove();

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }
}

/**
 * Показать детализацию очков Airdrop
 */
function showAirdropPointsBreakdown() {
    const breakdown = window.userData?.airdrop_breakdown || {};
    const totalPoints = window.userData?.airdrop_points || 0;

    const categoryEmoji = {
        'Победа в PvP': '⚔️',
        'Ежедневный вход': '📅',
        'Изучение заклинания': '📚',
        'Постройка/улучшение здания': '🏰',
        'Прохождение главы PvE': '🎯',
        'Streak 7 дней': '🔥',
        'Streak 30 дней': '🔥',
        'Streak 100 дней': '🔥',
        'Приглашение друга': '👥',
    };

    // Преобразуем breakdown в массив и сортируем по очкам
    const sortedBreakdown = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.id = 'airdrop-breakdown-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #2c2c3d 0%, #1a1a2e 100%);
        border: 2px solid #ffd700;
        border-radius: 16px;
        padding: 25px;
        max-width: 450px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 10001;
        box-shadow: 0 10px 50px rgba(0,0,0,0.8);
    `;

    let breakdownHTML = '';
    if (sortedBreakdown.length > 0) {
        breakdownHTML = sortedBreakdown.map(([category, points]) => {
            const emoji = categoryEmoji[category] || '🪂';
            const percentage = totalPoints > 0 ? ((points / totalPoints) * 100).toFixed(1) : 0;
            return `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px;
                    margin: 8px 0;
                    background: rgba(255,215,0,0.1);
                    border-left: 3px solid #ffd700;
                    border-radius: 8px;
                ">
                    <div style="flex: 1;">
                        <div style="color: #ffd700; font-weight: bold; font-size: 15px;">
                            ${emoji} ${category}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #4ade80; font-weight: bold; font-size: 20px;">
                            ${points.toLocaleString()}
                        </div>
                        <div style="color: #888; font-size: 11px; margin-top: 2px;">
                            ${percentage}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        breakdownHTML = `
            <div style="text-align: center; color: #888; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div>Очки пока не начислялись</div>
                <div style="font-size: 12px; margin-top: 8px;">
                    Получайте очки за игровую активность
                </div>
            </div>
        `;
    }

    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 8px;">
                💰 Детализация очков
            </div>
            <div style="color: #aaa; font-size: 14px;">
                Всего: <span style="color: #4ade80; font-weight: bold;">${totalPoints.toLocaleString()}</span> очков
            </div>
        </div>

        <div style="margin: 20px 0;">
            ${breakdownHTML}
        </div>

        <button onclick="window.closeAirdropBreakdown()" style="
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #ffd700, #cc9900);
            border: none;
            border-radius: 10px;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 15px;
        " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            Закрыть
        </button>
    `;

    // Добавляем overlay
    const overlay = document.createElement('div');
    overlay.id = 'airdrop-breakdown-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
    `;
    overlay.onclick = () => window.closeAirdropBreakdown();

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Закрыть окно детализации
 */
function closeAirdropBreakdown() {
    const modal = document.getElementById('airdrop-breakdown-modal');
    const overlay = document.getElementById('airdrop-breakdown-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

// Экспорт функций
window.showAirdropModal = showAirdropModal;
window.closeAirdropModal = closeAirdropModal;
window.addAirdropPoints = addAirdropPoints;
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.showAirdropPointsBreakdown = showAirdropPointsBreakdown;
window.closeAirdropBreakdown = closeAirdropBreakdown;

// TON Connect функции
window.initTonConnect = initTonConnect;
window.getTonConnectUI = () => tonConnectUI;
