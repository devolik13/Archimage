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

    // Кнопка атаки
    let attackButtonHTML;
    if (isDefeated) {
        attackButtonHTML = `
            <button disabled style="
                width: 100%; padding: 14px; background: #555; color: #999;
                border: 2px solid #666; border-radius: 10px; font-size: 16px; font-weight: bold;
                cursor: not-allowed;
            ">Босс побежден</button>
        `;
    } else if (!canAttack) {
        attackButtonHTML = `
            <div style="text-align: center;">
                <button disabled style="
                    width: 100%; padding: 14px; background: #3a3a4a; color: #888;
                    border: 2px solid #4a4a5a; border-radius: 10px; font-size: 16px; font-weight: bold;
                    cursor: not-allowed;
                ">Попытки закончились</button>
                <button onclick="buyEventBossAttempt()" style="
                    margin-top: 8px; width: 100%; padding: 10px;
                    background: linear-gradient(180deg, #7B68EE, #5B4ACA);
                    color: white; border: 2px solid #9B8AFF; border-radius: 10px;
                    font-size: 14px; cursor: pointer;
                ">Купить попытку за ${window.EVENT_BOSS_CONFIG?.extraAttemptStarsCost || 25} Stars</button>
            </div>
        `;
    } else {
        attackButtonHTML = `
            <button onclick="startEventBossBattle()" style="
                width: 100%; padding: 14px;
                background: linear-gradient(180deg, #dc3545, #a71d2a);
                color: white; border: 2px solid #ff6b6b; border-radius: 10px;
                font-size: 18px; font-weight: bold; cursor: pointer;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 4px 12px rgba(220,53,69,0.4);
            ">
                Атаковать!
            </button>
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
            <!-- Шапка -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <button onclick="closeEventBossScreen()" style="
                    padding: 8px 14px; background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
                    color: white; cursor: pointer; font-size: 13px;
                ">← Назад</button>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #ff9800;">Осталось: ${timeRemaining}</div>
                    <div style="font-size: 11px; color: #aaa;">Попытки: <strong style="color: ${attemptsLeft > 0 ? '#4ade80' : '#ff6b6b'}">${attemptsLeft}/${maxAttempts}</strong></div>
                </div>
            </div>

            <!-- Имя босса -->
            <div style="text-align: center; margin-bottom: 12px;">
                <img src="assets/sprites/event_boss/idle.webp" style="width: 120px; height: 120px; object-fit: contain; image-rendering: pixelated; margin-bottom: 4px;" alt="${boss.name}">
                <h2 style="
                    margin: 0; color: #9B59B6; font-size: 22px;
                    text-shadow: 0 0 20px rgba(155,89,182,0.5);
                ">${boss.name}</h2>
                <div style="font-size: 12px; color: #888; margin-top: 4px;">
                    Ивент Босс — сервер бьёт вместе
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

            <!-- Кнопка атаки -->
            <div style="margin-bottom: 16px;">${attackButtonHTML}</div>

            <!-- Статистика игрока -->
            <div style="
                margin-bottom: 16px; padding: 12px;
                background: rgba(114, 137, 218, 0.1);
                border-radius: 10px; border: 1px solid rgba(114, 137, 218, 0.3);
            ">
                <div style="font-size: 13px; color: #7289da; margin-bottom: 8px; font-weight: bold;">
                    Ваша статистика
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="text-align: center; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 11px; color: #888;">Общий урон</div>
                        <div style="font-size: 16px; color: #ff6b6b; font-weight: bold;">${manager.formatDamage(pDamage)}</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 11px; color: #888;">Место</div>
                        <div style="font-size: 16px; color: #ffd700; font-weight: bold;">${pRank}</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 11px; color: #888;">Атак</div>
                        <div style="font-size: 16px; color: #ddd; font-weight: bold;">${pAttacks}</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 11px; color: #888;">Лучший удар</div>
                        <div style="font-size: 16px; color: #ff9800; font-weight: bold;">${manager.formatDamage(pBest)}</div>
                    </div>
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

    const cost = window.EVENT_BOSS_CONFIG?.extraAttemptStarsCost || 25;

    // TODO: Реальная интеграция с Telegram Stars
    const confirmed = confirm(`Купить попытку за ${cost} Stars?`);
    if (!confirmed) return;

    await manager.purchaseAttempt();

    // Перерисовываем экран
    const boss = manager.currentBoss;
    if (boss) {
        const [playerStats, leaderboard] = await Promise.all([
            manager.fetchPlayerStats(),
            manager.fetchLeaderboard(20)
        ]);
        renderEventBossScreen(boss, playerStats, leaderboard);
    }
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

    // Генерируем врага
    const bossConfig = manager.currentBoss.config || window.EVENT_BOSS_CONFIG;
    const bossEnemy = window.generateEventBossEnemy(bossConfig);

    // Копии данных игрока
    const originalWizards = window.userData?.wizards || [];
    const originalFormation = window.userData?.formation || [null, null, null, null, null];

    window.playerWizards = originalWizards.map(wizard => ({...wizard}));
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

    const overlay = document.createElement('div');
    overlay.id = 'event-boss-result-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10002;
        display: flex; align-items: center; justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%);
            border: 3px solid #9B59B6;
            border-radius: 16px; padding: 24px 32px; text-align: center;
            color: white; min-width: 280px; max-width: 340px;
            box-shadow: 0 8px 32px rgba(155,89,182,0.3);
        ">
            <img src="assets/sprites/event_boss/idle.webp" style="width: 96px; height: 96px; object-fit: contain; image-rendering: pixelated; margin-bottom: 8px;" alt="Босс">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #9B59B6;">
                ${manager?.currentBoss?.name || 'Отродье Тьмы'}
            </div>
            <div style="font-size: 14px; color: #aaa; margin-bottom: 16px;">
                Ваши маги пали в бою
            </div>

            <!-- Урон -->
            <div style="
                background: rgba(255,255,255,0.1); border-radius: 10px;
                padding: 12px; margin-bottom: 12px;
            ">
                <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Нанесённый урон</div>
                <div style="font-size: 28px; color: #ff6b6b; font-weight: bold;">
                    ${manager ? manager.formatDamage(damageDealt) : damageDealt}
                </div>
            </div>

            ${bossDefeated ? `
                <div style="
                    background: rgba(76,175,80,0.2); border: 2px solid #4CAF50;
                    border-radius: 10px; padding: 12px; margin-bottom: 12px;
                ">
                    <div style="font-size: 20px; margin-bottom: 4px;">💀</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">БОСС ПОБЕЖДЕН!</div>
                    <div style="color: #81c784; font-size: 12px; margin-top: 4px;">
                        Добыча времени +30% на неделю!
                    </div>
                </div>
            ` : (bossNewHp != null ? `
                <div style="
                    background: rgba(0,0,0,0.3); border-radius: 8px;
                    padding: 8px; margin-bottom: 12px;
                ">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">HP босса</div>
                    <div style="
                        width: 100%; height: 16px; background: #1a1a2a;
                        border-radius: 8px; overflow: hidden;
                    ">
                        <div style="
                            width: ${(bossNewHp / bossMaxHp) * 100}%; height: 100%;
                            background: linear-gradient(90deg, #f44336, #ff9800);
                            border-radius: 8px;
                        "></div>
                    </div>
                    <div style="font-size: 11px; color: #aaa; margin-top: 4px;">
                        ${manager ? manager.formatDamage(bossNewHp) : bossNewHp} / ${manager ? manager.formatDamage(bossMaxHp) : bossMaxHp}
                    </div>
                </div>
            ` : '')}

            <!-- Общий урон -->
            <div style="
                background: rgba(0,0,0,0.2); border-radius: 8px;
                padding: 8px; margin-bottom: 16px;
                font-size: 12px; color: #aaa;
            ">
                Ваш общий урон: <strong style="color: #ff9800;">${manager ? manager.formatDamage(playerTotalDamage) : playerTotalDamage}</strong>
                <br>
                <span style="color: #666;">Осталось попыток: ${manager ? manager.getRemainingAttempts() : '?'}</span>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="closeEventBossResult(); openEventBossScreen();" style="
                    padding: 10px 20px; background: #4a4a6a; border: none;
                    border-radius: 8px; color: white; cursor: pointer; font-size: 14px;
                ">К боссу</button>
                <button onclick="closeEventBossResult();" style="
                    padding: 10px 20px; background: #7289da; border: none;
                    border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: bold;
                ">В город</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

/**
 * Закрыть результат
 */
function closeEventBossResult() {
    const overlay = document.getElementById('event-boss-result-overlay');
    if (overlay) overlay.remove();

    window.isEventBossBattle = false;
    window.currentEventBossId = null;

    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

/**
 * Закрыть экран босса
 */
function closeEventBossScreen() {
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

    // === DEBUG: мок для локального тестирования (убрать перед деплоем) ===
    const DEBUG_FORCE_PORTAL = true;
    if (DEBUG_FORCE_PORTAL) {
        const mockBoss = {
            active: true,
            id: 1,
            name: 'Тёмный Архимаг',
            max_hp: 5000000,
            current_hp: 3250000,
            config: { faction: 'darkness' },
            rewards: { gold: 1000 },
            status: 'active',
            total_participants: 42,
            total_damage_dealt: 1750000
        };
        if (manager) {
            manager.currentBoss = mockBoss;
            manager.lastFetch = Date.now();
        }
        console.log(`🐉 [DEBUG] Мок ивент босс: ${mockBoss.name} | HP: ${mockBoss.current_hp}/${mockBoss.max_hp}`);
        showEventBossWarpPortal(true);
        return true;
    }
    // === END DEBUG ===

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
 */
function showEventBossWarpPortal(show) {
    let portal = document.getElementById('event-boss-warp-portal');

    if (!show) {
        if (portal) portal.style.display = 'none';
        return;
    }

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
