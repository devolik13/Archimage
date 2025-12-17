// minigames/training-dummy-ui.js - UI для тренировочного полигона

/**
 * Показать экран тренировочного полигона
 */
function showTrainingGroundScreen() {
    const info = window.getDummyInfo();
    const config = info.dummy;

    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.id = 'training-ground-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        overflow-y: auto;
        padding: 20px;
        box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #4a9eff;
        border-radius: 15px;
        padding: 25px;
        max-width: 450px;
        width: 100%;
        color: white;
        font-family: Arial, sans-serif;
        max-height: 90vh;
        overflow-y: auto;
    `;

    // Форматирование сопротивлений
    const resistancesHtml = formatResistances(config.resistances);

    // Прогресс-бар до следующей награды
    let progressBarHtml = '';
    if (info.nextReward) {
        const progress = (info.totalDamage / info.nextReward.minDamage) * 100;
        progressBarHtml = `
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 5px;">
                    <span>${info.totalDamage.toLocaleString()}</span>
                    <span>${info.nextReward.minDamage.toLocaleString()}</span>
                </div>
                <div style="background: #1a1a2e; border-radius: 10px; height: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #4a9eff, #4ade80); height: 100%; width: ${Math.min(100, progress)}%; transition: width 0.3s;"></div>
                </div>
                <div style="text-align: center; font-size: 12px; color: #4ade80; margin-top: 5px;">
                    До "${info.nextReward.description}": ещё ${(info.nextReward.minDamage - info.totalDamage).toLocaleString()}
                </div>
            </div>
        `;
    }

    // Таблица наград
    const rewardsHtml = generateRewardsTable(info.totalDamage);

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4a9eff;">🎯 Тренировочный полигон</h2>
            <button id="training-close-btn" style="
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
            ">✕</button>
        </div>

        <!-- Информация о манекене -->
        <div style="background: #0d1b2a; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <div style="font-size: 18px; color: #ffd700;">${config.name}</div>
                    <div style="font-size: 12px; color: #888;">${config.description}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #888;">До сброса</div>
                    <div style="font-size: 14px; color: #ff6b6b;">⏰ ${info.timeUntilReset}</div>
                </div>
            </div>

            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <div style="flex: 1; text-align: center; background: #1a2a3a; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #888;">HP</div>
                    <div style="font-size: 16px; color: #ff6b6b;">❤️ ${info.hp.toLocaleString()}</div>
                </div>
                <div style="flex: 1; text-align: center; background: #1a2a3a; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #888;">Раундов</div>
                    <div style="font-size: 16px; color: #4a9eff;">🔄 ${info.maxRounds}</div>
                </div>
                <div style="flex: 1; text-align: center; background: #1a2a3a; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #888;">Попытки</div>
                    <div style="font-size: 16px; color: ${info.remainingAttempts > 0 ? '#4ade80' : '#ff6b6b'};">
                        🎯 ${info.remainingAttempts}/${info.dailyAttempts}
                    </div>
                </div>
            </div>

            <!-- Сопротивления -->
            <div style="margin-top: 15px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 8px;">🛡️ Сопротивления:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${resistancesHtml}
                </div>
            </div>
        </div>

        <!-- Прогресс игрока -->
        <div style="background: #0a2a0a; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #2a5a2a;">
            <div style="font-size: 14px; color: #4ade80; margin-bottom: 10px;">📊 Ваш прогресс за неделю:</div>

            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 12px; color: #888;">Всего урона</div>
                    <div style="font-size: 20px; color: #ffd700;">⚔️ ${info.totalDamage.toLocaleString()}</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 12px; color: #888;">Лучшая попытка</div>
                    <div style="font-size: 20px; color: #4a9eff;">🏆 ${info.bestAttempt.toLocaleString()}</div>
                </div>
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #2a5a2a;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #888;">Текущая награда:</span>
                    <span style="color: #4ade80; font-weight: bold;">${info.currentReward.description}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    <span style="color: #888;">Получите:</span>
                    <span style="color: #ffd700;">${formatTimeReward(info.currentReward.reward)}</span>
                </div>
            </div>

            ${progressBarHtml}
        </div>

        <!-- Таблица наград -->
        <details style="background: #1a1a2e; border-radius: 10px; margin-bottom: 15px;">
            <summary style="padding: 12px; cursor: pointer; color: #4a9eff;">
                🎁 Таблица наград (нажмите чтобы раскрыть)
            </summary>
            <div style="padding: 0 12px 12px 12px;">
                ${rewardsHtml}
            </div>
        </details>

        <!-- Кнопка старта -->
        <button id="start-training-btn" style="
            width: 100%;
            background: ${info.remainingAttempts > 0
                ? 'linear-gradient(135deg, #4a9eff, #2d7dd2)'
                : 'linear-gradient(135deg, #555, #333)'};
            border: none;
            padding: 15px;
            border-radius: 10px;
            color: white;
            font-size: 18px;
            cursor: ${info.remainingAttempts > 0 ? 'pointer' : 'not-allowed'};
            font-weight: bold;
        " ${info.remainingAttempts <= 0 ? 'disabled' : ''}>
            ${info.remainingAttempts > 0 ? '⚔️ Начать тренировку' : '❌ Попытки закончились'}
        </button>

        ${info.remainingAttempts <= 0 ? `
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #888;">
                ⏱️ Новые попытки через: <span style="color: #4ade80;">${info.timeUntilAttemptReset}</span>
            </div>
        ` : ''}
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Обработчики
    document.getElementById('training-close-btn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const startBtn = document.getElementById('start-training-btn');
    if (info.remainingAttempts > 0) {
        startBtn.onclick = () => {
            modal.remove();
            window.startDummyBattle();
        };
    }
}

/**
 * Форматировать сопротивления в HTML
 */
function formatResistances(resistances) {
    const icons = {
        fire: '🔥',
        water: '💧',
        wind: '🌪️',
        earth: '🪨',
        nature: '🌿',
        poison: '☠️'
    };

    const names = {
        fire: 'Огонь',
        water: 'Вода',
        wind: 'Ветер',
        earth: 'Земля',
        nature: 'Природа',
        poison: 'Яд'
    };

    let html = '';
    for (const [key, value] of Object.entries(resistances)) {
        if (value === 0) continue;

        const color = value > 0 ? '#ff6b6b' : '#4ade80';
        const sign = value > 0 ? '+' : '';

        html += `
            <div style="
                background: ${value > 0 ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,100,0.2)'};
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                color: ${color};
            ">
                ${icons[key]} ${names[key]}: ${sign}${value}%
            </div>
        `;
    }

    if (!html) {
        html = '<div style="color: #888; font-size: 12px;">Нет особых сопротивлений</div>';
    }

    return html;
}

/**
 * Форматировать награду временем
 */
function formatTimeReward(minutes) {
    if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    } else if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    }
    return `${minutes} мин`;
}

/**
 * Генерировать таблицу наград
 */
function generateRewardsTable(currentDamage) {
    let html = '<div style="font-size: 12px;">';

    for (const tier of window.WEEKLY_REWARDS) {
        const isAchieved = currentDamage >= tier.minDamage;
        const isCurrent = isAchieved && (!window.WEEKLY_REWARDS.find(t =>
            t.minDamage > tier.minDamage && currentDamage >= t.minDamage
        ) || tier === window.WEEKLY_REWARDS[window.WEEKLY_REWARDS.length - 1]);

        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                padding: 8px;
                background: ${isCurrent ? 'rgba(74,158,255,0.2)' : isAchieved ? 'rgba(74,222,128,0.1)' : 'transparent'};
                border-radius: 5px;
                margin-bottom: 4px;
                border-left: 3px solid ${isCurrent ? '#4a9eff' : isAchieved ? '#4ade80' : 'transparent'};
            ">
                <span style="color: ${isAchieved ? '#4ade80' : '#888'};">
                    ${isAchieved ? '✓' : '○'} ${tier.description}
                </span>
                <span style="color: ${isAchieved ? '#ffd700' : '#666'};">
                    ${tier.minDamage.toLocaleString()} → ${formatTimeReward(tier.reward)}
                </span>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * Добавить кнопку в город (если нужно)
 */
function addTrainingGroundButton(container) {
    const btn = document.createElement('button');
    btn.id = 'training-ground-btn';
    btn.innerHTML = '🎯 Полигон';
    btn.style.cssText = `
        background: linear-gradient(135deg, #4a9eff, #2d7dd2);
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        margin: 5px;
    `;
    btn.onclick = showTrainingGroundScreen;

    if (container) {
        container.appendChild(btn);
    }

    return btn;
}

/**
 * Показать меню испытания внутри арены (на том же фоне)
 */
function showTrialMenuInArena() {
    const overlay = document.getElementById('pvp-arena-overlay');
    if (!overlay) {
        console.error('Arena overlay not found');
        return;
    }

    const info = window.getDummyInfo ? window.getDummyInfo() : {
        dummy: { name: 'Голем', description: 'Тренировочный манекен', resistances: {} },
        remainingAttempts: 3,
        dailyAttempts: 3,
        totalDamage: 0,
        bestAttempt: 0,
        hp: 10000,
        maxRounds: 5,
        timeUntilReset: '6д 23ч',
        timeUntilAttemptReset: '12ч'
    };
    const config = info.dummy;

    // Очищаем оверлей
    overlay.innerHTML = '';

    // Получаем масштаб
    const bgImg = document.getElementById('arena-bg-image');
    const scaleX = bgImg ? bgImg.offsetWidth / 780 : 1;
    const scaleY = bgImg ? bgImg.offsetHeight / 480 : 1;
    const scale = Math.min(scaleX, scaleY);

    // Заголовок
    const title = document.createElement('div');
    title.style.cssText = `
        position: absolute;
        top: ${50 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        color: #FFD700;
        font-size: ${Math.max(18, 26 * scale)}px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    title.innerHTML = '⚔️ Испытание';
    overlay.appendChild(title);

    // Попытки
    const attemptsDiv = document.createElement('div');
    const attemptsColor = info.remainingAttempts > 0 ? '#4CAF50' : '#f44336';
    attemptsDiv.style.cssText = `
        position: absolute;
        top: ${85 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        color: ${attemptsColor};
        font-size: ${Math.max(14, 18 * scale)}px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    attemptsDiv.innerHTML = `🎯 Попытки: ${info.remainingAttempts}/${info.dailyAttempts}`;
    if (info.remainingAttempts <= 0) {
        attemptsDiv.innerHTML += `<br><span style="font-size: ${Math.max(10, 12 * scale)}px; color: #888;">Обновление: ${info.timeUntilAttemptReset}</span>`;
    }
    overlay.appendChild(attemptsDiv);

    // Информация о манекене
    const dummyInfo = document.createElement('div');
    dummyInfo.style.cssText = `
        position: absolute;
        top: ${130 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${520 * scaleX}px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #7289da;
        border-radius: 10px;
        padding: ${12 * scaleY}px;
        color: white;
        text-align: center;
    `;

    // Сопротивления
    const resistancesList = Object.entries(config.resistances || {})
        .filter(([_, val]) => val !== 0)
        .map(([elem, val]) => {
            const elemNames = { fire: '🔥', water: '💧', wind: '💨', earth: '🪨', nature: '🌿', poison: '☠️' };
            const color = val > 0 ? '#ff6b6b' : '#4ade80';
            const sign = val > 0 ? '+' : '';
            return `<span style="color: ${color};">${elemNames[elem] || elem}: ${sign}${val}%</span>`;
        })
        .join(' &nbsp;|&nbsp; ');

    dummyInfo.innerHTML = `
        <div style="font-size: ${Math.max(16, 20 * scale)}px; color: #FFD700; margin-bottom: 8px;">
            ${config.name}
        </div>
        <div style="font-size: ${Math.max(11, 13 * scale)}px; color: #aaa; margin-bottom: 8px;">
            ${config.description}
        </div>
        <div style="font-size: ${Math.max(10, 12 * scale)}px; margin-bottom: 8px;">
            ${resistancesList || '<span style="color:#888;">Нет особых сопротивлений</span>'}
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; font-size: ${Math.max(11, 13 * scale)}px; color: #888;">
            <span>❤️ HP: ${(info.hp || 10000).toLocaleString()}</span>
            <span>🔄 Раундов: ${info.maxRounds || 5}</span>
            <span>⏰ Сброс: ${info.timeUntilReset}</span>
        </div>
    `;
    overlay.appendChild(dummyInfo);

    // Прогресс игрока
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
        position: absolute;
        top: ${270 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${520 * scaleX}px;
        background: rgba(0, 50, 0, 0.5);
        border: 1px solid #4CAF50;
        border-radius: 8px;
        padding: ${10 * scaleY}px;
        display: flex;
        justify-content: space-around;
        color: white;
        text-align: center;
    `;
    progressDiv.innerHTML = `
        <div>
            <div style="font-size: ${Math.max(10, 11 * scale)}px; color: #888;">Всего урона</div>
            <div style="font-size: ${Math.max(14, 18 * scale)}px; color: #FFD700;">⚔️ ${(info.totalDamage || 0).toLocaleString()}</div>
        </div>
        <div>
            <div style="font-size: ${Math.max(10, 11 * scale)}px; color: #888;">Лучшая попытка</div>
            <div style="font-size: ${Math.max(14, 18 * scale)}px; color: #4a9eff;">🏆 ${(info.bestAttempt || 0).toLocaleString()}</div>
        </div>
    `;
    overlay.appendChild(progressDiv);

    // Кнопки
    const btnY = 340 * scaleY;
    const btnWidth = 240 * scaleX;
    const btnHeight = 45 * scaleY;
    const gap = 20 * scaleX;

    // Кнопка рейтинга
    const ratingBtn = document.createElement('button');
    ratingBtn.style.cssText = `
        position: absolute;
        left: calc(50% - ${btnWidth + gap/2}px);
        top: ${btnY}px;
        width: ${btnWidth}px;
        height: ${btnHeight}px;
        background: rgba(255, 215, 0, 0.2);
        border: 2px solid #FFD700;
        border-radius: 8px;
        color: #FFD700;
        font-size: ${Math.max(14, 16 * scale)}px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        transition: all 0.2s;
    `;
    ratingBtn.innerHTML = '🏆 Рейтинг';
    ratingBtn.onmouseover = () => ratingBtn.style.background = 'rgba(255, 215, 0, 0.4)';
    ratingBtn.onmouseout = () => ratingBtn.style.background = 'rgba(255, 215, 0, 0.2)';
    ratingBtn.onclick = () => showTrialLeaderboardInArena();
    overlay.appendChild(ratingBtn);

    // Кнопка начать
    const canStart = info.remainingAttempts > 0;
    const startBtn = document.createElement('button');
    startBtn.style.cssText = `
        position: absolute;
        left: calc(50% + ${gap/2}px);
        top: ${btnY}px;
        width: ${btnWidth}px;
        height: ${btnHeight}px;
        background: ${canStart ? 'rgba(76, 175, 80, 0.3)' : 'rgba(100, 100, 100, 0.3)'};
        border: 2px solid ${canStart ? '#4CAF50' : '#666'};
        border-radius: 8px;
        color: ${canStart ? '#4CAF50' : '#666'};
        font-size: ${Math.max(14, 16 * scale)}px;
        font-weight: bold;
        cursor: ${canStart ? 'pointer' : 'not-allowed'};
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        transition: all 0.2s;
    `;
    startBtn.innerHTML = canStart ? '⚔️ Пройти испытание' : '❌ Нет попыток';
    if (canStart) {
        startBtn.onmouseover = () => startBtn.style.background = 'rgba(76, 175, 80, 0.5)';
        startBtn.onmouseout = () => startBtn.style.background = 'rgba(76, 175, 80, 0.3)';
        startBtn.onclick = () => {
            if (typeof closePvPArenaModalBg === 'function') {
                closePvPArenaModalBg();
            }
            if (typeof window.startDummyBattle === 'function') {
                window.startDummyBattle();
            } else {
                alert('Ошибка: система боя не загружена');
            }
        };
    }
    overlay.appendChild(startBtn);

    // Кнопка назад (правый нижний угол)
    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
        position: absolute;
        right: ${15 * scaleX}px;
        bottom: ${15 * scaleY}px;
        padding: ${10 * scaleY}px ${25 * scaleX}px;
        background: linear-gradient(180deg, #dc3545, #a71d2a);
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        color: white;
        font-size: ${Math.max(14, 16 * scale)}px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    backBtn.innerHTML = 'Назад';
    backBtn.onclick = () => {
        if (typeof showArenaMainMenu === 'function') {
            showArenaMainMenu();
        }
    };
    overlay.appendChild(backBtn);
}

/**
 * Показать рейтинг испытания внутри арены
 */
function showTrialLeaderboardInArena() {
    const overlay = document.getElementById('pvp-arena-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';

    const bgImg = document.getElementById('arena-bg-image');
    const scaleX = bgImg ? bgImg.offsetWidth / 780 : 1;
    const scaleY = bgImg ? bgImg.offsetHeight / 480 : 1;
    const scale = Math.min(scaleX, scaleY);

    // Заголовок
    const title = document.createElement('div');
    title.style.cssText = `
        position: absolute;
        top: ${45 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        color: #FFD700;
        font-size: ${Math.max(18, 24 * scale)}px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    title.innerHTML = '🏆 Рейтинг испытания';
    overlay.appendChild(title);

    // Контейнер списка
    const listContainer = document.createElement('div');
    listContainer.style.cssText = `
        position: absolute;
        top: ${90 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${560 * scaleX}px;
        height: ${290 * scaleY}px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #7289da;
        border-radius: 10px;
        overflow-y: auto;
        padding: 10px;
    `;

    // Загружаем рейтинг (заглушка - позже Supabase)
    const leaderboard = loadTrialLeaderboardLocal();

    if (leaderboard.length === 0) {
        listContainer.innerHTML = `
            <div style="color: #888; text-align: center; margin-top: 100px; font-size: ${Math.max(12, 14 * scale)}px;">
                Рейтинг пока пуст.<br>Станьте первым!
            </div>
        `;
    } else {
        let html = '';
        const playerId = window.myPlayerId || 'local';
        leaderboard.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const isMe = entry.playerId === playerId;
            html += `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: ${isMe ? 'rgba(114, 137, 218, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
                    border-radius: 5px;
                    margin-bottom: 5px;
                    color: white;
                    font-size: ${Math.max(12, 14 * scale)}px;
                ">
                    <span>${medal} ${entry.playerName}</span>
                    <span style="color: #FFD700;">${entry.damage.toLocaleString()} урона</span>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }
    overlay.appendChild(listContainer);

    // Кнопка назад (правый нижний угол)
    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
        position: absolute;
        right: ${15 * scaleX}px;
        bottom: ${15 * scaleY}px;
        padding: ${10 * scaleY}px ${25 * scaleX}px;
        background: linear-gradient(180deg, #dc3545, #a71d2a);
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        color: white;
        font-size: ${Math.max(14, 16 * scale)}px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    `;
    backBtn.innerHTML = 'Назад';
    backBtn.onclick = () => showTrialMenuInArena();
    overlay.appendChild(backBtn);
}

/**
 * Загрузить локальный рейтинг (заглушка для Supabase)
 */
function loadTrialLeaderboardLocal() {
    const saved = localStorage.getItem('trial_leaderboard');
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

/**
 * Сохранить результат в рейтинг
 */
function saveTrialResultLocal(damage) {
    const playerName = window.myUsername || 'Игрок';
    const playerId = window.myPlayerId || 'local';

    let leaderboard = loadTrialLeaderboardLocal();
    const existingIndex = leaderboard.findIndex(e => e.playerId === playerId);

    if (existingIndex >= 0) {
        if (damage > leaderboard[existingIndex].damage) {
            leaderboard[existingIndex].damage = damage;
        }
    } else {
        leaderboard.push({ playerId, playerName, damage });
    }

    leaderboard.sort((a, b) => b.damage - a.damage);
    leaderboard = leaderboard.slice(0, 100);
    localStorage.setItem('trial_leaderboard', JSON.stringify(leaderboard));

    return leaderboard;
}

// Экспорт
window.showTrainingGroundScreen = showTrainingGroundScreen;
window.addTrainingGroundButton = addTrainingGroundButton;
window.formatTimeReward = formatTimeReward;
window.showTrialMenuInArena = showTrialMenuInArena;
window.showTrialLeaderboardInArena = showTrialLeaderboardInArena;
window.saveTrialResultLocal = saveTrialResultLocal;

console.log('✅ Training Dummy UI загружен');
