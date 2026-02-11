// events/event-boss-ui.js - UI для ивент босса

// ============================================
// ЭКРАН ИВЕНТ БОССА (информационная панель)
// ============================================

/**
 * Открыть экран ивент босса
 */
async function openEventBossScreen() {
    console.log('🐉 Открытие экрана ивент босса');

    // Закрываем другие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Показываем экран загрузки
    showEventBossLoading();

    // Загружаем данные
    const manager = window.eventBossManager;
    if (!manager) {
        console.error('EventBossManager не инициализирован');
        closeEventBossScreen();
        return;
    }

    const boss = await manager.fetchActiveBoss(true);

    if (!boss || !boss.active) {
        closeEventBossScreen();
        showNoBossMessage();
        return;
    }

    // Загружаем статистику и лидерборд параллельно
    const [playerStats, leaderboard] = await Promise.all([
        manager.fetchPlayerStats(),
        manager.fetchLeaderboard(20)
    ]);

    // Рендер
    renderEventBossScreen(boss, playerStats, leaderboard);
}

/**
 * Экран загрузки
 */
function showEventBossLoading() {
    let screen = document.getElementById('event-boss-screen');
    if (screen) screen.remove();

    screen = document.createElement('div');
    screen.id = 'event-boss-screen';
    screen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.95); z-index: 9000;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 18px;
    `;
    screen.innerHTML = '<div style="text-align: center;">Загрузка...</div>';
    document.body.appendChild(screen);
}

/**
 * Сообщение "нет босса"
 */
function showNoBossMessage() {
    alert('Сейчас нет активного ивент босса.\nСледите за обновлениями!');
}

/**
 * Главный рендер экрана
 */
function renderEventBossScreen(boss, playerStats, leaderboard) {
    const screen = document.getElementById('event-boss-screen');
    if (!screen) return;

    const manager = window.eventBossManager;
    const hpPercent = manager.getHpPercent();
    const timeRemaining = manager.formatTimeRemaining(boss.ends_at);
    const canAttack = manager.canAttack();
    const attemptsLeft = manager.getRemainingAttempts();
    const maxAttempts = window.EVENT_BOSS_CONFIG?.maxDailyAttempts || 10;

    // Цвет HP
    let hpColor = '#4CAF50';
    if (hpPercent < 50) hpColor = '#ff9800';
    if (hpPercent < 25) hpColor = '#f44336';

    const isDefeated = boss.status === 'defeated' || boss.current_hp <= 0;
    const statusText = isDefeated
        ? 'ПОБЕЖДЕН!'
        : `${manager.formatDamage(boss.current_hp)} / ${manager.formatDamage(boss.max_hp)}`;

    // Статистика игрока
    const pDamage = playerStats?.total_damage || 0;
    const pAttacks = playerStats?.attacks_count || 0;
    const pRank = playerStats?.rank || '-';
    const pBest = playerStats?.best_single_attack || 0;

    // Кнопка атаки (компактная для шапки)
    let attackButtonHTML;
    if (isDefeated) {
        attackButtonHTML = `
            <button disabled style="
                padding: 8px 16px; background: #555; color: #999;
                border: 2px solid #666; border-radius: 8px; font-size: 14px; font-weight: bold;
                cursor: not-allowed; white-space: nowrap;
            ">Побежден</button>
        `;
    } else if (!canAttack) {
        attackButtonHTML = `
            <button onclick="buyEventBossAttempt()" style="
                padding: 8px 14px;
                background: linear-gradient(180deg, #7B68EE, #5B4ACA);
                color: white; border: 2px solid #9B8AFF; border-radius: 8px;
                font-size: 13px; cursor: pointer; white-space: nowrap;
            ">Купить попытку</button>
        `;
    } else {
        attackButtonHTML = `
            <button onclick="startEventBossBattle()" style="
                padding: 10px 20px;
                background: linear-gradient(180deg, #dc3545, #a71d2a);
                color: white; border: 2px solid #ff6b6b; border-radius: 8px;
                font-size: 15px; font-weight: bold; cursor: pointer;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 3px 10px rgba(220,53,69,0.4);
                white-space: nowrap;
            ">Атаковать!</button>
        `;
    }

    // Лидерборд
    const telegramId = window.userId ? parseInt(window.userId) : null;
    let leaderboardHTML = '';
    if (leaderboard && leaderboard.length > 0) {
        leaderboardHTML = leaderboard.map(entry => {
            const isMe = entry.telegram_id === telegramId;
            const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
            const bgStyle = isMe
                ? 'background: rgba(114, 137, 218, 0.2); border: 1px solid rgba(114, 137, 218, 0.4);'
                : 'background: rgba(255,255,255,0.05);';
            return `
                <div style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; ${bgStyle}
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px; min-width: 30px;">${rankIcon}</span>
                        <span style="color: ${isMe ? '#7289da' : '#ddd'}; font-size: 13px; font-weight: ${isMe ? 'bold' : 'normal'};">
                            ${entry.username || 'Маг'}
                        </span>
                    </div>
                    <span style="color: #ff6b6b; font-size: 13px; font-weight: bold;">
                        ${manager.formatDamage(entry.total_damage)}
                    </span>
                </div>
            `;
        }).join('');
    } else {
        leaderboardHTML = '<div style="text-align: center; color: #666; padding: 16px; font-size: 13px;">Пока никто не атаковал</div>';
    }

    screen.innerHTML = `
        <div style="
            width: 100%; height: 100%; overflow-y: auto;
            background: linear-gradient(180deg, #0a0a1a 0%, #1a0520 30%, #0a0a1a 100%);
            padding: 16px; box-sizing: border-box;
        ">
            <!-- Босс: спрайт | инфо+кнопки | статистика (три равных блока) -->
            <div style="display: flex; gap: 10px; align-items: stretch; margin-bottom: 12px;">
                <!-- 1. Спрайт босса -->
                <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center;">
                    <div id="event-boss-preview-sprite" style="
                        width: 100%; aspect-ratio: 1; max-width: 200px;
                        background: url('assets/sprites/event_boss/idle.webp') 0% 0% / 500% 500% no-repeat;
                        image-rendering: pixelated;
                    "></div>
                </div>
                <!-- 2. Инфо и кнопки -->
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; justify-content: center;">
                    <h2 style="
                        margin: 0; color: #9B59B6; font-size: 17px;
                        text-shadow: 0 0 20px rgba(155,89,182,0.5);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    ">${boss.name}</h2>
                    <div style="font-size: 10px; color: #888;">
                        Ивент Босс — сервер бьёт вместе
                    </div>
                    <div style="font-size: 11px; color: #ff9800;">
                        Осталось: ${timeRemaining}
                    </div>
                    <div>
                        <span style="font-size: 10px; color: #aaa;">Попытки: <strong style="color: ${attemptsLeft > 0 ? '#4ade80' : '#ff6b6b'}">${attemptsLeft}/${maxAttempts}</strong></span>
                        <button onclick="buyEventBossAttempt()" style="
                            margin-left: 4px; padding: 2px 6px;
                            background: linear-gradient(180deg, #7B68EE, #5B4ACA);
                            color: white; border: 1px solid #9B8AFF; border-radius: 5px;
                            font-size: 9px; cursor: pointer; white-space: nowrap;
                        ">+ Купить</button>
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
                        <div>${attackButtonHTML}</div>
                        <button onclick="closeEventBossScreen()" style="
                            padding: 6px 12px; background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
                            color: #888; cursor: pointer; font-size: 11px;
                        ">← Назад</button>
                    </div>
                </div>
                <!-- 3. Статистика игрока (2x2) -->
                <div style="
                    flex: 1; min-width: 0;
                    padding: 8px; background: rgba(114, 137, 218, 0.1);
                    border-radius: 8px; border: 1px solid rgba(114, 137, 218, 0.3);
                    display: flex; flex-direction: column; justify-content: center;
                ">
                    <div style="font-size: 10px; color: #7289da; font-weight: bold; text-align: center; margin-bottom: 6px;">
                        Ваша статистика
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            <div style="font-size: 8px; color: #888;">Урон</div>
                            <div style="font-size: 12px; color: #ff6b6b; font-weight: bold;">${manager.formatDamage(pDamage)}</div>
                        </div>
                        <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            <div style="font-size: 8px; color: #888;">Место</div>
                            <div style="font-size: 12px; color: #ffd700; font-weight: bold;">${pRank}</div>
                        </div>
                        <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            <div style="font-size: 8px; color: #888;">Атак</div>
                            <div style="font-size: 12px; color: #ddd; font-weight: bold;">${pAttacks}</div>
                        </div>
                        <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            <div style="font-size: 8px; color: #888;">Лучший</div>
                            <div style="font-size: 12px; color: #ff9800; font-weight: bold;">${manager.formatDamage(pBest)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HP бар -->
            <div style="
                margin-bottom: 16px; padding: 12px;
                background: rgba(0,0,0,0.5); border-radius: 10px;
                border: 1px solid rgba(155,89,182,0.3);
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #aaa; font-size: 12px;">Здоровье босса</span>
                    <span style="color: ${hpColor}; font-size: 12px; font-weight: bold;">${hpPercent.toFixed(1)}%</span>
                </div>
                <div style="
                    width: 100%; height: 24px; background: #1a1a2a;
                    border-radius: 12px; overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                ">
                    <div style="
                        width: ${isDefeated ? 0 : hpPercent}%; height: 100%;
                        background: linear-gradient(90deg, ${hpColor}, ${hpColor}cc);
                        border-radius: 12px; transition: width 1s ease-out;
                        box-shadow: 0 0 10px ${hpColor}66;
                    "></div>
                </div>
                <div style="text-align: center; margin-top: 6px; font-size: 14px; color: ${isDefeated ? '#4CAF50' : '#ddd'}; font-weight: bold;">
                    ${statusText}
                </div>
                <div style="text-align: center; font-size: 11px; color: #666; margin-top: 2px;">
                    Участников: ${boss.total_participants || 0}
                </div>
            </div>

            <!-- Награды -->
            <div style="
                margin-bottom: 16px; padding: 12px;
                background: rgba(255, 215, 0, 0.05);
                border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);
            ">
                <div style="font-size: 13px; color: #ffd700; margin-bottom: 8px; font-weight: bold;">Награды</div>
                <div style="font-size: 12px; color: #aaa; line-height: 1.6;">
                    <div>🏆 1 место: <span style="color: #ffd700;">+20 дней</span></div>
                    <div>🥈 2 место: <span style="color: #c0c0c0;">+10 дней</span></div>
                    <div>🥉 3 место: <span style="color: #cd7f32;">+5 дней</span></div>
                    <div>✅ Участие: <span style="color: #4CAF50;">+1 день</span></div>
                    <div>💀 Босс убит: <span style="color: #9B59B6;">+3 дня каждому + добыча +30% на неделю</span></div>
                    <div>❌ Босс выжил: <span style="color: #ff6b6b;">добыча -50% на неделю</span></div>
                </div>
            </div>

            <!-- Лидерборд -->
            <div style="
                padding: 12px; background: rgba(0,0,0,0.3);
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
                margin-bottom: 20px;
            ">
                <div style="
                    font-size: 13px; color: #ddd; margin-bottom: 8px; font-weight: bold;
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <span>Рейтинг урона</span>
                    <button onclick="refreshEventBossLeaderboard()" style="
                        padding: 4px 10px; background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;
                        color: #aaa; cursor: pointer; font-size: 11px;
                    ">Обновить</button>
                </div>
                <div id="event-boss-leaderboard" style="max-height: 300px; overflow-y: auto;">
                    ${leaderboardHTML}
                </div>
            </div>
        </div>
    `;

    // Анимация спрайтлиста босса (5x5 сетка, 25 кадров)
    startBossPreviewAnimation();
}

/** Запуск анимации спрайта босса на превью-экране */
function startBossPreviewAnimation() {
    // Останавливаем предыдущую анимацию
    if (window._bossPreviewAnimId) {
        clearInterval(window._bossPreviewAnimId);
        window._bossPreviewAnimId = null;
    }
    const sprite = document.getElementById('event-boss-preview-sprite');
    if (!sprite) return;
    const cols = 5, rows = 5, totalFrames = 25;
    let frame = 0;
    window._bossPreviewAnimId = setInterval(() => {
        if (!document.getElementById('event-boss-preview-sprite')) {
            clearInterval(window._bossPreviewAnimId);
            window._bossPreviewAnimId = null;
            return;
        }
        const col = frame % cols;
        const row = Math.floor(frame / cols);
        sprite.style.backgroundPosition = `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`;
        frame = (frame + 1) % totalFrames;
    }, 100);
}

/**
 * Обновить лидерборд
 */
async function refreshEventBossLeaderboard() {
    const manager = window.eventBossManager;
    if (!manager || !manager.currentBoss) return;

    const container = document.getElementById('event-boss-leaderboard');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; color: #888; padding: 10px;">Загрузка...</div>';

    const leaderboard = await manager.fetchLeaderboard(20);
    const telegramId = window.userId ? parseInt(window.userId) : null;

    if (leaderboard && leaderboard.length > 0) {
        container.innerHTML = leaderboard.map(entry => {
            const isMe = entry.telegram_id === telegramId;
            const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
            const bgStyle = isMe
                ? 'background: rgba(114, 137, 218, 0.2); border: 1px solid rgba(114, 137, 218, 0.4);'
                : 'background: rgba(255,255,255,0.05);';
            return `
                <div style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; ${bgStyle}
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px; min-width: 30px;">${rankIcon}</span>
                        <span style="color: ${isMe ? '#7289da' : '#ddd'}; font-size: 13px; font-weight: ${isMe ? 'bold' : 'normal'};">
                            ${entry.username || 'Маг'}
                        </span>
                    </div>
                    <span style="color: #ff6b6b; font-size: 13px; font-weight: bold;">
                        ${manager.formatDamage(entry.total_damage)}
                    </span>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 16px; font-size: 13px;">Пока никто не атаковал</div>';
    }
}

// ============================================
// ЗАПУСК БОЯ
// ============================================

/**
 * Купить попытку за Stars
 */
async function buyEventBossAttempt() {
    const manager = window.eventBossManager;
    if (!manager) return;

    const starsCost = window.EVENT_BOSS_CONFIG?.extraAttemptStarsCost || 75;
    const priceUSD = window.EVENT_BOSS_CONFIG?.extraAttemptPriceUSD || 0.98;

    // Рассчитываем цену в TON
    let tonPrice = '...';
    if (typeof window.calculateTonPrice === 'function') {
        tonPrice = await window.calculateTonPrice(priceUSD);
    }

    // Диалог выбора способа оплаты (по паттерну shop-modal.js)
    const dialog = document.createElement('div');
    dialog.id = 'boss-attempt-payment-dialog';
    dialog.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85); z-index: 10003;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s;
    `;

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%);
            border: 2px solid #9B59B6;
            border-radius: 16px; padding: 24px; max-width: 340px; width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
            <h3 style="color: #9B59B6; margin: 0 0 6px 0; text-align: center; font-size: 18px;">
                Доп. попытка
            </h3>
            <p style="color: #888; text-align: center; margin: 0 0 20px 0; font-size: 13px;">
                Ещё одна атака на босса
            </p>

            <button id="boss-pay-stars-btn" style="
                width: 100%; padding: 14px; margin-bottom: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid #ffd700; border-radius: 12px;
                color: white; font-size: 16px; font-weight: bold;
                cursor: pointer; display: flex; align-items: center;
                justify-content: center; gap: 8px;
            ">
                <span style="font-size: 20px;">⭐</span>
                <span>${starsCost} Stars</span>
            </button>

            <button id="boss-pay-ton-btn" style="
                width: 100%; padding: 14px; margin-bottom: 16px;
                background: linear-gradient(135deg, #0088cc 0%, #0066cc 100%);
                border: 2px solid #0088cc; border-radius: 12px;
                color: white; font-size: 16px; font-weight: bold;
                cursor: pointer; display: flex; align-items: center;
                justify-content: center; gap: 8px;
            ">
                <span style="font-size: 20px;">💎</span>
                <span>${tonPrice} TON</span>
                <span style="font-size: 11px; opacity: 0.7;">(~$${priceUSD})</span>
            </button>

            <button id="boss-pay-cancel-btn" style="
                width: 100%; padding: 10px;
                background: rgba(255,255,255,0.08); border: 1px solid #555;
                border-radius: 10px; color: #888; font-size: 13px; cursor: pointer;
            ">Отмена</button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Обработчики
    document.getElementById('boss-pay-cancel-btn').onclick = () => dialog.remove();

    document.getElementById('boss-pay-stars-btn').onclick = async () => {
        dialog.remove();
        await buyBossAttemptWithStars(starsCost);
    };

    document.getElementById('boss-pay-ton-btn').onclick = async () => {
        dialog.remove();
        await buyBossAttemptWithTon(priceUSD, tonPrice);
    };
}

/** Покупка попытки за Telegram Stars */
async function buyBossAttemptWithStars(starsCost) {
    const manager = window.eventBossManager;
    if (!manager) return;

    // Telegram Stars API
    if (window.Telegram?.WebApp?.openInvoice) {
        try {
            const item = { id: 'event_boss_attempt', name: 'Попытка атаки босса', price: starsCost };
            const invoiceUrl = await window.createStarsInvoice(item, starsCost);
            window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
                if (status === 'paid') {
                    await manager.purchaseAttempt();
                    await _refreshBossScreen(manager);

                    if (typeof window.addAirdropPoints === 'function') {
                        const pts = Math.floor(starsCost / 10);
                        if (pts > 0) window.addAirdropPoints(pts, 'Покупка попытки босса');
                    }
                }
            });
            return;
        } catch (e) {
            console.error('❌ Stars invoice error:', e);
        }
    }

    // Fallback (debug / нет Telegram)
    await manager.purchaseAttempt();
    await _refreshBossScreen(manager);
}

/** Покупка попытки за TON */
async function buyBossAttemptWithTon(priceUSD, tonPrice) {
    const manager = window.eventBossManager;
    if (!manager) return;

    if (!window.tonConnectUI || !window.tonConnectUI.wallet) {
        if (typeof window.showShopNotification === 'function') {
            window.showShopNotification('Сначала подключите TON кошелёк в разделе Airdrop', 'warning');
        } else {
            alert('Сначала подключите TON кошелёк в разделе Airdrop');
        }
        return;
    }

    try {
        const TON_ADDRESS = window.TON_RECEIVER_ADDRESS || 'UQAnElrwdRQf8-U0ERo5DAGwitB_ipMOF0plhyDox_HA3bFU';
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{
                address: TON_ADDRESS,
                amount: String(Math.floor(tonPrice * 1000000000))
            }]
        };

        const result = await window.tonConnectUI.sendTransaction(transaction);
        console.log('✅ TON транзакция попытки босса:', result);

        await manager.purchaseAttempt();
        await _refreshBossScreen(manager);

        // Сохраняем платёж
        if (typeof window.saveTonPayment === 'function') {
            await window.saveTonPayment(
                { id: 'event_boss_attempt', name: 'Попытка атаки босса', priceUSD },
                tonPrice, result
            );
        }

        if (typeof window.addAirdropPoints === 'function') {
            const pts = Math.floor((priceUSD / 0.013) / 10);
            if (pts > 0) window.addAirdropPoints(pts, 'Покупка попытки босса (TON)');
        }
    } catch (e) {
        console.error('❌ TON payment error:', e);
        if (typeof window.showShopNotification === 'function') {
            window.showShopNotification('Ошибка TON платежа', 'error');
        }
    }
}

/** Перерисовать экран босса */
async function _refreshBossScreen(manager) {
    const boss = manager.currentBoss;
    if (!boss) return;
    const [playerStats, leaderboard] = await Promise.all([
        manager.fetchPlayerStats(),
        manager.fetchLeaderboard(20)
    ]);
    renderEventBossScreen(boss, playerStats, leaderboard);
}

/**
 * Запустить бой с ивент боссом
 */
function startEventBossBattle() {
    const manager = window.eventBossManager;
    if (!manager || !manager.currentBoss) {
        console.error('Нет активного ивент босса');
        return;
    }

    // Проверяем попытки
    if (!manager.canAttack()) {
        alert('Попытки закончились! Купите дополнительные за Stars или подождите до завтра.');
        return;
    }

    // Проверяем формацию
    if (!window.userData?.formation || !window.userData.formation.some(id => id)) {
        alert('Нет магов в формации! Расставьте магов перед боем.');
        return;
    }

    console.log('🐉 Запуск боя с ивент боссом');

    // Закрываем экран
    const screen = document.getElementById('event-boss-screen');
    if (screen) screen.remove();

    // Генерируем врага (добавляем name из currentBoss, т.к. config не содержит его)
    const bossConfig = {
        ...window.EVENT_BOSS_CONFIG,
        ...(manager.currentBoss.config || {}),
        name: manager.currentBoss.name || window.EVENT_BOSS_CONFIG?.name || 'Отродье Тьмы'
    };
    const bossEnemy = window.generateEventBossEnemy(bossConfig);

    // Глубокие копии данных игрока (сбрасываем эффекты, накопленный урон и т.д.)
    const originalWizards = window.userData?.wizards || [];
    const originalFormation = window.userData?.formation || [null, null, null, null, null];

    window.playerWizards = JSON.parse(JSON.stringify(originalWizards));
    window.playerFormation = [...originalFormation];

    // Формация врага — босс в центре
    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];

    bossEnemy.position = 2;
    window.enemyFormation[2] = bossEnemy;
    window.enemyWizards.push(bossEnemy);

    // Флаги боя
    window.isEventBossBattle = true;
    window.isPvEBattle = true;
    window.currentPvELevel = null;
    window.selectedOpponent = null;
    window.currentEventBossId = manager.currentBoss.id;

    console.log('🐉 Враг сформирован:', bossEnemy.name, 'HP:', bossEnemy.hp);

    // Запускаем бой
    if (typeof window.showBattleField === 'function') {
        window.showBattleField();
    } else {
        console.error('showBattleField не найдена');
    }
}

// ============================================
// РЕЗУЛЬТАТ БОЯ
// ============================================

/**
 * Показать результат боя с ивент боссом
 */
async function showEventBossResult(battleResult, damageDealt) {
    const manager = window.eventBossManager;

    // Отправляем урон на сервер
    let serverResult = null;
    if (damageDealt > 0 && manager && window.currentEventBossId) {
        serverResult = await manager.submitDamage(damageDealt);
    }

    // Обновляем данные
    if (manager) {
        await manager.fetchActiveBoss(true);
    }

    const bossDefeated = serverResult?.boss_defeated || false;
    const bossNewHp = serverResult?.boss_new_hp;
    const bossMaxHp = serverResult?.boss_max_hp;
    const playerTotalDamage = serverResult?.player_total_damage || damageDealt;
    const hpPercent = bossMaxHp ? ((bossNewHp / bossMaxHp) * 100) : 0;
    let hpColor = '#4CAF50';
    if (hpPercent < 50) hpColor = '#ff9800';
    if (hpPercent < 25) hpColor = '#f44336';

    // Опыт магов
    const wizardExp = window.lastPvEWizardExpGained || [];

    // Сохраняем логи боя до очистки
    const savedBattleLog = [...(window.battleLog || [])];

    const overlay = document.createElement('div');
    overlay.id = 'event-boss-result-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10002;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%);
            border: 3px solid #9B59B6;
            border-radius: 16px; padding: 20px 24px; text-align: center;
            color: white; width: 320px; max-width: 90vw;
            max-height: 85vh; overflow-y: auto;
            box-shadow: 0 8px 32px rgba(155,89,182,0.3);
            animation: scaleIn 0.3s ease-out;
            position: relative;
        ">
            <!-- Спрайт босса -->
            <div style="
                width: 160px; height: 160px; margin: 0 auto 8px;
                background: url('assets/sprites/event_boss/idle.webp') 0% 0% / 500% 500% no-repeat;
                image-rendering: pixelated;
            "></div>

            <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #9B59B6;">
                ${manager?.currentBoss?.name || 'Отродье Тьмы'}
            </div>

            <!-- Нанесённый урон -->
            <div style="
                background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
                border-radius: 10px; padding: 12px; margin: 12px 0;
            ">
                <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Нанесённый урон</div>
                <div style="font-size: 32px; color: #ff6b6b; font-weight: bold;">
                    ${manager ? manager.formatDamage(damageDealt) : damageDealt}
                </div>
            </div>

            ${bossDefeated ? `
                <div style="
                    background: rgba(76,175,80,0.2); border: 2px solid #4CAF50;
                    border-radius: 10px; padding: 12px; margin-bottom: 12px;
                ">
                    <div style="font-size: 24px; margin-bottom: 4px;">💀</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">БОСС ПОБЕЖДЕН!</div>
                    <div style="color: #81c784; font-size: 12px; margin-top: 4px;">
                        Добыча времени +30% на неделю!
                    </div>
                </div>
            ` : (bossNewHp != null ? `
                <div style="
                    background: rgba(0,0,0,0.3); border-radius: 8px;
                    padding: 10px; margin-bottom: 12px;
                ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: #888;">HP босса</span>
                        <span style="font-size: 11px; color: ${hpColor}; font-weight: bold;">${hpPercent.toFixed(1)}%</span>
                    </div>
                    <div style="
                        width: 100%; height: 18px; background: #1a1a2a;
                        border-radius: 9px; overflow: hidden;
                        border: 1px solid rgba(255,255,255,0.1);
                    ">
                        <div style="
                            width: ${hpPercent}%; height: 100%;
                            background: linear-gradient(90deg, ${hpColor}, ${hpColor}cc);
                            border-radius: 9px; transition: width 1s ease-out;
                        "></div>
                    </div>
                    <div style="font-size: 12px; color: #aaa; margin-top: 4px; font-weight: bold;">
                        ${manager ? manager.formatDamage(bossNewHp) : bossNewHp} / ${manager ? manager.formatDamage(bossMaxHp) : bossMaxHp}
                    </div>
                </div>
            ` : '')}

            <!-- Опыт магов -->
            ${wizardExp.length > 0 ? `
                <div style="
                    background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3);
                    border-radius: 8px; padding: 10px; margin-bottom: 12px;
                ">
                    <div style="font-size: 12px; color: #ffa500; margin-bottom: 6px;">Опыт магов</div>
                    ${wizardExp.map(w => `
                        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0;">
                            <span style="color: #ddd;">${w.name}</span>
                            <span style="color: #ffa500; font-weight: bold;">
                                +${w.expGained} XP${w.levelGained > 0 ? ` <span style="color: #4CAF50;">Ур.${w.newLevel}</span>` : ''}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Статистика -->
            <div style="
                background: rgba(0,0,0,0.2); border-radius: 8px;
                padding: 8px; margin-bottom: 12px;
            ">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                    <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        <div style="color: #888;">Общий урон</div>
                        <div style="color: #ff9800; font-size: 14px; font-weight: bold;">${manager ? manager.formatDamage(playerTotalDamage) : playerTotalDamage}</div>
                    </div>
                    <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        <div style="color: #888;">Попытки</div>
                        <div style="color: ${(manager?.getRemainingAttempts() || 0) > 0 ? '#4ade80' : '#ff6b6b'}; font-size: 14px; font-weight: bold;">
                            ${manager ? manager.getRemainingAttempts() : '?'} / ${window.EVENT_BOSS_CONFIG?.maxDailyAttempts || 10}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button onclick="closeEventBossResult(); openEventBossScreen();" style="
                    flex: 1; padding: 10px;
                    background: linear-gradient(180deg, #dc3545, #a71d2a);
                    border: 2px solid #ff6b6b; border-radius: 8px;
                    color: white; cursor: pointer; font-size: 14px; font-weight: bold;
                ">Ещё раз</button>
                <button onclick="closeEventBossResult();" style="
                    flex: 1; padding: 10px;
                    background: #4a4a6a; border: 2px solid #6a6a8a;
                    border-radius: 8px; color: white; cursor: pointer; font-size: 14px;
                ">В город</button>
            </div>
            <button id="event-boss-log-toggle" style="
                width: 100%; padding: 8px;
                background: rgba(114,137,218,0.15); border: 1px solid rgba(114,137,218,0.4);
                border-radius: 8px; color: #7289da; cursor: pointer; font-size: 13px;
            ">📜 Лог боя</button>

            <!-- Панель логов (скрыта) -->
            <div id="event-boss-log-panel" style="
                display: none; margin-top: 8px; text-align: left;
                background: rgba(0,0,0,0.4); border-radius: 8px;
                border: 1px solid rgba(114,137,218,0.3);
                max-height: 300px; overflow-y: auto; padding: 10px;
            ">
                <div style="font-size: 12px; line-height: 1.6;">
                    ${savedBattleLog.length > 0
                        ? savedBattleLog.map(log => `<div style="margin-bottom: 4px; padding: 4px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; font-family: monospace; font-size: 11px;">${log}</div>`).join('')
                        : '<div style="color: #666; text-align: center;">Нет записей</div>'}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Обработчик кнопки логов
    const logToggle = document.getElementById('event-boss-log-toggle');
    const logPanel = document.getElementById('event-boss-log-panel');
    if (logToggle && logPanel) {
        logToggle.onclick = () => {
            const isHidden = logPanel.style.display === 'none';
            logPanel.style.display = isHidden ? 'block' : 'none';
            logToggle.textContent = isHidden ? '📜 Скрыть лог' : '📜 Лог боя';
            if (isHidden) logPanel.scrollTop = logPanel.scrollHeight;
        };
    }
}

/**
 * Закрыть результат
 */
function closeEventBossResult() {
    const overlay = document.getElementById('event-boss-result-overlay');
    if (overlay) overlay.remove();

    window.isEventBossBattle = false;
    window.currentEventBossId = null;
    window.lastPvEWizardExpGained = undefined;

    // Очистка ресурсов боя (поле боя ещё открыто под оверлеем)
    if (typeof window.cleanupBattleResources === 'function') {
        window.cleanupBattleResources();
    }

    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

/**
 * Закрыть экран босса
 */
function closeEventBossScreen() {
    // Останавливаем анимацию спрайта
    if (window._bossPreviewAnimId) {
        clearInterval(window._bossPreviewAnimId);
        window._bossPreviewAnimId = null;
    }

    const screen = document.getElementById('event-boss-screen');
    if (screen) screen.remove();

    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = '';

    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

// ============================================
// ВАРП ПОРТАЛ В ГОРОДЕ
// ============================================

/**
 * Проверить наличие ивент босса при загрузке
 */
async function checkEventBossAvailability() {
    const manager = window.eventBossManager;
    if (!manager) return false;

    const boss = await manager.fetchActiveBoss();
    if (boss && boss.active) {
        console.log(`🐉 Активный ивент босс: ${boss.name} | HP: ${boss.current_hp}/${boss.max_hp}`);
        showEventBossWarpPortal(true);
        return true;
    } else {
        showEventBossWarpPortal(false);
        return false;
    }
}

/**
 * Показать/скрыть варп портал в городе
 * ОТКЛЮЧЕНО: портал скрыт, доступ через скрытую кнопку в магазине
 */
function showEventBossWarpPortal(show) {
    let portal = document.getElementById('event-boss-warp-portal');
    if (portal) portal.style.display = 'none';
    return;

    if (!portal) {
        portal = document.createElement('div');
        portal.id = 'event-boss-warp-portal';
        portal.onclick = openEventBossScreen;
        document.body.appendChild(portal);
    }

    const manager = window.eventBossManager;
    const hpPercent = manager ? manager.getHpPercent() : 100;
    const bossName = manager?.currentBoss?.name || 'Ивент Босс';
    const attemptsLeft = manager ? manager.getRemainingAttempts() : 0;

    portal.innerHTML = `
        <!-- Пульсирующее кольцо портала -->
        <div style="
            position: relative; width: 64px; height: 64px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(155,89,182,0.4) 0%, rgba(155,89,182,0) 70%);
            display: flex; align-items: center; justify-content: center;
        ">
            <!-- Внешнее кольцо -->
            <div style="
                position: absolute; width: 60px; height: 60px;
                border-radius: 50%;
                border: 2px solid rgba(155,89,182,0.6);
                animation: eventBossPortalPulse 2s ease-in-out infinite;
            "></div>
            <!-- Внутреннее кольцо -->
            <div style="
                position: absolute; width: 48px; height: 48px;
                border-radius: 50%;
                border: 2px solid rgba(155,89,182,0.8);
                animation: eventBossPortalPulse 2s ease-in-out infinite 0.5s;
            "></div>
            <!-- Иконка -->
            <div style="font-size: 24px; z-index: 1; text-shadow: 0 0 10px rgba(155,89,182,0.8);">🌑</div>
        </div>
        <!-- Инфо под порталом -->
        <div style="text-align: center; margin-top: 4px;">
            <div style="font-size: 10px; font-weight: bold; color: #9B59B6; text-shadow: 0 0 4px rgba(0,0,0,1);">
                ${bossName}
            </div>
            <div style="
                width: 60px; height: 5px; background: #1a1a2a;
                border-radius: 3px; overflow: hidden; margin: 2px auto 0;
                border: 1px solid rgba(155,89,182,0.3);
            ">
                <div style="
                    width: ${hpPercent}%; height: 100%;
                    background: ${hpPercent > 50 ? '#4CAF50' : hpPercent > 25 ? '#ff9800' : '#f44336'};
                    border-radius: 3px;
                "></div>
            </div>
            <div style="font-size: 9px; color: #aaa; margin-top: 1px;">
                ${attemptsLeft > 0 ? `⚔️ ${attemptsLeft}` : '❌ 0'}
            </div>
        </div>
    `;

    portal.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        cursor: pointer;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 8px rgba(155,89,182,0.3));
        transition: transform 0.3s;
    `;

    portal.onmouseover = () => { portal.style.transform = 'translateX(-50%) scale(1.1)'; };
    portal.onmouseout = () => { portal.style.transform = 'translateX(-50%) scale(1)'; };

    // CSS анимация для портала
    if (!document.getElementById('event-boss-portal-css')) {
        const style = document.createElement('style');
        style.id = 'event-boss-portal-css';
        style.textContent = `
            @keyframes eventBossPortalPulse {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    portal.style.display = 'flex';
}

// Экспорт
window.openEventBossScreen = openEventBossScreen;
window.closeEventBossScreen = closeEventBossScreen;
window.startEventBossBattle = startEventBossBattle;
window.showEventBossResult = showEventBossResult;
window.closeEventBossResult = closeEventBossResult;
window.checkEventBossAvailability = checkEventBossAvailability;
window.showEventBossWarpPortal = showEventBossWarpPortal;
window.refreshEventBossLeaderboard = refreshEventBossLeaderboard;
window.buyEventBossAttempt = buyEventBossAttempt;

console.log('🐉 Event Boss UI загружен');
