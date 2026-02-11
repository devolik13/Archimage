// events/event-boss-ui.js - UI для ивент босса

/**
 * Открыть экран ивент босса
 */
async function openEventBossScreen() {
    console.log('🐉 Открытие экрана ивент босса');

    // Закрываем другие модалки
    if (window.Modal && window.Modal.closeAll) {
        window.Modal.closeAll();
    } else if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Показываем экран загрузки
    showEventBossLoading();

    // Загружаем данные босса
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

    // Загружаем статистику игрока и лидерборд параллельно
    const [playerStats, leaderboard] = await Promise.all([
        manager.fetchPlayerStats(),
        manager.fetchLeaderboard(20)
    ]);

    // Отрисовываем экран
    renderEventBossScreen(boss, playerStats, leaderboard);
}

/**
 * Показать экран загрузки
 */
function showEventBossLoading() {
    let screen = document.getElementById('event-boss-screen');
    if (screen) screen.remove();

    screen = document.createElement('div');
    screen.id = 'event-boss-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9000;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 18px;
    `;
    screen.innerHTML = '<div style="text-align: center;">Загрузка ивент босса...</div>';
    document.body.appendChild(screen);
}

/**
 * Показать сообщение "нет активного босса"
 */
function showNoBossMessage() {
    if (!window.Modal) return;
    window.Modal.show(`
        <div style="padding: 20px; text-align: center; color: white; background: linear-gradient(135deg, #2a2a3a, #1a1a2a); border-radius: 12px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🐉</div>
            <h3 style="color: #7289da; margin: 0 0 10px;">Ивент Босс</h3>
            <p style="color: #aaa; margin: 0 0 16px;">Сейчас нет активного ивент босса.<br>Следите за обновлениями!</p>
            <button onclick="window.Modal.close()" style="
                padding: 10px 24px; background: #7289da; color: white;
                border: none; border-radius: 8px; cursor: pointer; font-size: 14px;
            ">Понятно</button>
        </div>
    `, { closeOnOverlay: true });
}

/**
 * Рендер основного экрана ивент босса
 */
function renderEventBossScreen(boss, playerStats, leaderboard) {
    const screen = document.getElementById('event-boss-screen');
    if (!screen) return;

    const manager = window.eventBossManager;
    const hpPercent = manager.getHpPercent();
    const timeRemaining = manager.formatTimeRemaining(boss.ends_at);
    const canAttack = manager.canAttack();
    const timeToAttack = manager.getTimeToNextAttack();

    // Определяем цвет HP бара
    let hpColor = '#4CAF50'; // Зеленый
    if (hpPercent < 50) hpColor = '#ff9800'; // Оранжевый
    if (hpPercent < 25) hpColor = '#f44336'; // Красный

    // Статус босса
    const isDefeated = boss.status === 'defeated' || boss.current_hp <= 0;
    const statusText = isDefeated ? 'ПОБЕЖДЕН!' : `HP: ${manager.formatDamage(boss.current_hp)} / ${manager.formatDamage(boss.max_hp)}`;

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
        const minutesLeft = Math.ceil(timeToAttack / 60000);
        const hoursLeft = Math.floor(minutesLeft / 60);
        const minsLeft = minutesLeft % 60;
        const cooldownText = hoursLeft > 0 ? `${hoursLeft}ч ${minsLeft}м` : `${minsLeft}м`;
        attackButtonHTML = `
            <button disabled style="
                width: 100%; padding: 14px; background: #3a3a4a; color: #888;
                border: 2px solid #4a4a5a; border-radius: 10px; font-size: 16px; font-weight: bold;
                cursor: not-allowed;
            ">Перезарядка: ${cooldownText}</button>
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
                transition: all 0.3s;
            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                Атаковать босса!
            </button>
        `;
    }

    // Лидерборд HTML
    let leaderboardHTML = '';
    if (leaderboard && leaderboard.length > 0) {
        const telegramId = window.userId ? parseInt(window.userId) : null;
        leaderboardHTML = leaderboard.map(entry => {
            const isMe = entry.telegram_id === telegramId;
            const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
            const bgStyle = isMe ? 'background: rgba(114, 137, 218, 0.2); border: 1px solid rgba(114, 137, 218, 0.4);' : 'background: rgba(255,255,255,0.05);';
            return `
                <div style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 10px; border-radius: 6px; margin-bottom: 4px;
                    ${bgStyle}
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
        leaderboardHTML = '<div style="text-align: center; color: #666; padding: 16px; font-size: 13px;">Пока никто не атаковал босса</div>';
    }

    screen.innerHTML = `
        <div style="
            width: 100%; height: 100%; overflow-y: auto;
            background: linear-gradient(180deg, #0a0a1a 0%, #1a0a0a 30%, #0a0a1a 100%);
            padding: 16px; box-sizing: border-box;
        ">
            <!-- Заголовок + кнопка назад -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <button onclick="closeEventBossScreen()" style="
                    padding: 8px 14px; background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
                    color: white; cursor: pointer; font-size: 13px;
                ">← Назад</button>
                <div style="font-size: 12px; color: #ff9800;">
                    Осталось: ${timeRemaining}
                </div>
            </div>

            <!-- Имя босса -->
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 36px; margin-bottom: 4px;">🐉</div>
                <h2 style="
                    margin: 0; color: #ff4444; font-size: 22px;
                    text-shadow: 0 0 20px rgba(255,68,68,0.5);
                ">${boss.name}</h2>
                <div style="font-size: 12px; color: #888; margin-top: 4px;">
                    Глобальный ивент босс
                </div>
            </div>

            <!-- HP бар -->
            <div style="
                margin-bottom: 16px; padding: 12px;
                background: rgba(0,0,0,0.5); border-radius: 10px;
                border: 1px solid rgba(255,68,68,0.3);
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #aaa; font-size: 12px;">Здоровье босса</span>
                    <span style="color: ${hpColor}; font-size: 12px; font-weight: bold;">
                        ${hpPercent.toFixed(1)}%
                    </span>
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
            <div style="margin-bottom: 16px;">
                ${attackButtonHTML}
            </div>

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
                        <div style="font-size: 16px; color: #ff6b6b; font-weight: bold;">
                            ${manager.formatDamage(pDamage)}
                        </div>
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
                        <div style="font-size: 16px; color: #ff9800; font-weight: bold;">
                            ${manager.formatDamage(pBest)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Награды -->
            <div style="
                margin-bottom: 16px; padding: 12px;
                background: rgba(255, 215, 0, 0.05);
                border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);
            ">
                <div style="font-size: 13px; color: #ffd700; margin-bottom: 8px; font-weight: bold;">
                    Награды
                </div>
                <div style="font-size: 12px; color: #aaa; line-height: 1.6;">
                    <div>🏆 1 место: <span style="color: #ffd700;">⏰ +20 дней</span></div>
                    <div>🥈 2 место: <span style="color: #c0c0c0;">⏰ +10 дней</span></div>
                    <div>🥉 3 место: <span style="color: #cd7f32;">⏰ +5 дней</span></div>
                    <div>✅ Участие: <span style="color: #4CAF50;">⏰ +1 день</span></div>
                    <div>💀 Босс убит: <span style="color: #ff6b6b;">⏰ +3 дня каждому</span></div>
                </div>
            </div>

            <!-- Лидерборд -->
            <div style="
                padding: 12px;
                background: rgba(0,0,0,0.3);
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

    // Обновляем кулдаун каждую минуту
    if (window._eventBossCooldownTimer) clearInterval(window._eventBossCooldownTimer);
    window._eventBossCooldownTimer = setInterval(() => {
        updateEventBossAttackButton();
    }, 30000);
}

/**
 * Обновить кнопку атаки (кулдаун таймер)
 */
function updateEventBossAttackButton() {
    // Переоткрываем экран для обновления (простой подход)
    // В будущем можно обновлять только кнопку
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
            const bgStyle = isMe ? 'background: rgba(114, 137, 218, 0.2); border: 1px solid rgba(114, 137, 218, 0.4);' : 'background: rgba(255,255,255,0.05);';
            return `
                <div style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 10px; border-radius: 6px; margin-bottom: 4px;
                    ${bgStyle}
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
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 16px; font-size: 13px;">Пока никто не атаковал босса</div>';
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

    // Проверяем кулдаун
    if (!manager.canAttack()) {
        const minutesLeft = Math.ceil(manager.getTimeToNextAttack() / 60000);
        alert(`Перезарядка! Следующая атака через ${minutesLeft} минут.`);
        return;
    }

    // Проверяем что у игрока есть маги в формации
    if (!window.userData?.formation || !window.userData.formation.some(id => id)) {
        alert('Нет магов в формации! Расставьте магов перед боем.');
        return;
    }

    console.log('🐉 Запуск боя с ивент боссом');

    // Закрываем экран ивент босса
    closeEventBossScreen();

    // Генерируем врага-босса для боя
    const bossConfig = manager.currentBoss.config || window.EVENT_BOSS_CONFIG;
    const bossEnemy = window.generateEventBossEnemy(bossConfig);

    // Создаём КОПИИ данных игрока (как в PvE)
    const originalWizards = window.userData?.wizards || [];
    const originalFormation = window.userData?.formation || [null, null, null, null, null];

    window.playerWizards = originalWizards.map(wizard => ({...wizard}));
    window.playerFormation = [...originalFormation];

    // Формируем формацию врага - босс в центре (позиция 2)
    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];

    bossEnemy.position = 2;
    window.enemyFormation[2] = bossEnemy;
    window.enemyWizards.push(bossEnemy);

    // Устанавливаем флаги боя
    window.isEventBossBattle = true;
    window.isPvEBattle = true; // Используем PvE механику (не тратит рейтинг)
    window.currentPvELevel = null; // Не PvE уровень
    window.selectedOpponent = null;

    // Сохраняем ID босса для отправки урона после боя
    window.currentEventBossId = manager.currentBoss.id;

    console.log('🐉 Враг сформирован:', bossEnemy);

    // Запускаем бой
    if (typeof window.showBattleField === 'function') {
        window.showBattleField();
    } else {
        console.error('showBattleField не найдена');
    }
}

/**
 * Показать результат боя с ивент боссом
 * Вызывается из battle/core.js после завершения боя
 */
async function showEventBossResult(battleResult, damageDealt) {
    const manager = window.eventBossManager;

    // Отправляем урон на сервер
    let serverResult = null;
    if (damageDealt > 0 && manager && window.currentEventBossId) {
        serverResult = await manager.submitDamage(damageDealt);
    }

    // Обновляем данные босса
    if (manager) {
        await manager.fetchActiveBoss(true);
    }

    const isWin = battleResult === 'win';
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
        animation: fadeIn 0.3s ease-out;
    `;

    const bgColor = isWin
        ? 'linear-gradient(135deg, #1a3a1a 0%, #2d4a1d 100%)'
        : 'linear-gradient(135deg, #3a1a1a 0%, #4a1d1d 100%)';

    overlay.innerHTML = `
        <div style="
            background: ${bgColor};
            border: 3px solid ${isWin ? '#4CAF50' : '#f44336'};
            border-radius: 16px; padding: 24px 32px; text-align: center;
            color: white; min-width: 280px; max-width: 340px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        ">
            <div style="font-size: 48px; margin-bottom: 8px;">🐉</div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #ff4444;">
                ${manager?.currentBoss?.name || 'Ивент Босс'}
            </div>
            <div style="font-size: 14px; color: #aaa; margin-bottom: 16px;">
                ${isWin ? 'Бой завершён!' : 'Вы пали в бою'}
            </div>

            <!-- Нанесённый урон -->
            <div style="
                background: rgba(255,255,255,0.1); border-radius: 10px;
                padding: 12px; margin-bottom: 12px;
            ">
                <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Нанесённый урон</div>
                <div style="font-size: 28px; color: #ff6b6b; font-weight: bold;">
                    ${manager ? manager.formatDamage(damageDealt) : damageDealt}
                </div>
            </div>

            <!-- Состояние босса -->
            ${bossDefeated ? `
                <div style="
                    background: rgba(76,175,80,0.2); border: 2px solid #4CAF50;
                    border-radius: 10px; padding: 12px; margin-bottom: 12px;
                    animation: pulse 2s ease-in-out infinite;
                ">
                    <div style="font-size: 20px; margin-bottom: 4px;">💀</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">
                        БОСС ПОБЕЖДЕН!
                    </div>
                    <div style="color: #81c784; font-size: 12px; margin-top: 4px;">
                        Все участники получат награды!
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

            <!-- Общий урон игрока -->
            <div style="
                background: rgba(0,0,0,0.2); border-radius: 8px;
                padding: 8px; margin-bottom: 16px;
                font-size: 12px; color: #aaa;
            ">
                Ваш общий урон по боссу: <strong style="color: #ff9800;">${manager ? manager.formatDamage(playerTotalDamage) : playerTotalDamage}</strong>
            </div>

            <!-- Опыт магов -->
            ${window.lastPvEWizardExpGained && window.lastPvEWizardExpGained.length > 0 ? `
                <div style="
                    background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3);
                    border-radius: 8px; padding: 8px; margin-bottom: 16px;
                ">
                    <div style="font-size: 11px; color: #ffa500; margin-bottom: 6px;">Опыт магов</div>
                    ${window.lastPvEWizardExpGained.map(w => `
                        <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0;">
                            <span style="color: #ddd;">${w.name}</span>
                            <span style="color: #ffa500; font-weight: bold;">
                                +${w.expGained} XP${w.levelGained > 0 ? ` <span style="color: #4CAF50;">Ур.${w.newLevel}</span>` : ''}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

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
 * Закрыть результат ивент босса
 */
function closeEventBossResult() {
    const overlay = document.getElementById('event-boss-result-overlay');
    if (overlay) overlay.remove();

    // Очищаем флаги
    window.isEventBossBattle = false;
    window.currentEventBossId = null;
    window.lastPvEWizardExpGained = undefined;

    // Возвращаемся в город
    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

/**
 * Закрыть экран ивент босса
 */
function closeEventBossScreen() {
    const screen = document.getElementById('event-boss-screen');
    if (screen) screen.remove();

    // Останавливаем таймер
    if (window._eventBossCooldownTimer) {
        clearInterval(window._eventBossCooldownTimer);
        window._eventBossCooldownTimer = null;
    }

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = '';

    // Возвращаемся в город
    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

/**
 * Проверить наличие ивент босса при загрузке игры
 * Вызывается из game-db-integration.js при инициализации
 */
async function checkEventBossAvailability() {
    const manager = window.eventBossManager;
    if (!manager) return false;

    const boss = await manager.fetchActiveBoss();
    if (boss && boss.active) {
        console.log(`🐉 Активный ивент босс: ${boss.name} | HP: ${boss.current_hp}/${boss.max_hp}`);
        // Показываем индикатор в городе
        showEventBossIndicator(true);
        return true;
    } else {
        showEventBossIndicator(false);
        return false;
    }
}

/**
 * Показать/скрыть индикатор ивент босса в городе
 */
function showEventBossIndicator(show) {
    let indicator = document.getElementById('event-boss-city-indicator');

    if (!show) {
        if (indicator) indicator.style.display = 'none';
        return;
    }

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'event-boss-city-indicator';
        indicator.onclick = openEventBossScreen;
        document.body.appendChild(indicator);
    }

    const manager = window.eventBossManager;
    const hpPercent = manager ? manager.getHpPercent() : 100;
    const bossName = manager?.currentBoss?.name || 'Ивент Босс';

    indicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 18px; animation: pulse 2s ease-in-out infinite;">🐉</span>
            <div>
                <div style="font-size: 11px; font-weight: bold; color: #ff4444;">${bossName}</div>
                <div style="
                    width: 80px; height: 6px; background: #1a1a2a;
                    border-radius: 3px; overflow: hidden; margin-top: 2px;
                ">
                    <div style="
                        width: ${hpPercent}%; height: 100%;
                        background: ${hpPercent > 50 ? '#4CAF50' : hpPercent > 25 ? '#ff9800' : '#f44336'};
                        border-radius: 3px;
                    "></div>
                </div>
            </div>
        </div>
    `;

    indicator.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 10, 20, 0.9);
        border: 2px solid rgba(255, 68, 68, 0.5);
        border-radius: 10px;
        padding: 8px 14px;
        cursor: pointer;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
        transition: all 0.3s;
        display: block;
    `;

    indicator.onmouseover = () => {
        indicator.style.borderColor = 'rgba(255, 68, 68, 0.8)';
        indicator.style.transform = 'translateX(-50%) scale(1.05)';
    };
    indicator.onmouseout = () => {
        indicator.style.borderColor = 'rgba(255, 68, 68, 0.5)';
        indicator.style.transform = 'translateX(-50%) scale(1)';
    };
}

// Экспорт
window.openEventBossScreen = openEventBossScreen;
window.closeEventBossScreen = closeEventBossScreen;
window.startEventBossBattle = startEventBossBattle;
window.showEventBossResult = showEventBossResult;
window.closeEventBossResult = closeEventBossResult;
window.checkEventBossAvailability = checkEventBossAvailability;
window.showEventBossIndicator = showEventBossIndicator;
window.refreshEventBossLeaderboard = refreshEventBossLeaderboard;

console.log('🐉 Event Boss UI загружен');
