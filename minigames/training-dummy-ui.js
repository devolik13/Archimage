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
        poison: '☠️',
        light: '✨',
        dark: '🌑'
    };

    const names = {
        fire: 'Огонь',
        water: 'Вода',
        wind: 'Ветер',
        earth: 'Земля',
        nature: 'Природа',
        poison: 'Яд',
        light: 'Свет',
        dark: 'Тьма'
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
    const overlay = document.getElementById('arena-ui-overlay');
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

    // Заголовок (поднято выше)
    const title = document.createElement('div');
    title.style.cssText = `
        position: absolute;
        top: ${35 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        color: #FFD700;
        font-size: ${Math.max(18, 26 * scale)}px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    title.innerHTML = '⚔️ Испытание';
    overlay.appendChild(title);

    // Попытки (поднято выше)
    const attemptsDiv = document.createElement('div');
    const attemptsColor = info.remainingAttempts > 0 ? '#4CAF50' : '#f44336';
    attemptsDiv.style.cssText = `
        position: absolute;
        top: ${65 * scaleY}px;
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

    // Информация о манекене (поднято выше)
    const dummyInfo = document.createElement('div');
    dummyInfo.style.cssText = `
        position: absolute;
        top: ${80 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${560 * scaleX}px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #7289da;
        border-radius: 10px;
        padding: ${15 * scaleY}px;
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

    // Прогресс игрока (поднято выше)
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
        position: absolute;
        top: ${205 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${560 * scaleX}px;
        background: rgba(0, 50, 0, 0.5);
        border: 1px solid #4CAF50;
        border-radius: 8px;
        padding: ${12 * scaleY}px;
        color: white;
        text-align: center;
    `;

    // Текущая награда
    const currentReward = info.currentReward || { description: 'Участник', reward: 60 };
    const nextReward = info.nextReward;
    const rewardText = window.formatTimeReward ? window.formatTimeReward(currentReward.reward) : `${currentReward.reward} мин`;

    // Прогресс до следующей награды
    let progressBarHtml = '';
    if (nextReward) {
        const progress = Math.min(100, (info.totalDamage / nextReward.minDamage) * 100);
        const needed = nextReward.minDamage - info.totalDamage;
        progressBarHtml = `
            <div style="margin-top: 8px;">
                <div style="background: #1a1a2e; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 4px;">
                    <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; width: ${progress}%;"></div>
                </div>
                <div style="font-size: ${Math.max(9, 10 * scale)}px; color: #888;">
                    До "${nextReward.description}": ${needed.toLocaleString()} урона
                </div>
            </div>
        `;
    }

    progressDiv.innerHTML = `
        <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
            <div>
                <div style="font-size: ${Math.max(10, 11 * scale)}px; color: #888;">Всего урона</div>
                <div style="font-size: ${Math.max(14, 18 * scale)}px; color: #FFD700;">⚔️ ${(info.totalDamage || 0).toLocaleString()}</div>
            </div>
            <div>
                <div style="font-size: ${Math.max(10, 11 * scale)}px; color: #888;">Лучшая попытка</div>
                <div style="font-size: ${Math.max(14, 18 * scale)}px; color: #4a9eff;">🏆 ${(info.bestAttempt || 0).toLocaleString()}</div>
            </div>
            <div>
                <div style="font-size: ${Math.max(10, 11 * scale)}px; color: #888;">Награда</div>
                <div style="font-size: ${Math.max(12, 14 * scale)}px; color: #4ade80;">🎁 ${currentReward.description}</div>
                <div style="font-size: ${Math.max(9, 10 * scale)}px; color: #86efac;">${rewardText}</div>
            </div>
        </div>
        ${progressBarHtml}
    `;
    overlay.appendChild(progressDiv);

    // Кнопки (+20% размер, раздвинуты)
    const btnY = 330 * scaleY;
    const btnWidth = 192 * scaleX;
    const btnHeight = 42 * scaleY;
    const gap = 40 * scaleX;

    // Кнопка рейтинга (левее)
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
        font-size: ${Math.max(13, 16 * scale)}px;
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

    // Кнопка начать (правее)
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
        font-size: ${Math.max(13, 16 * scale)}px;
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

    // Кнопка назад (ниже, +20% размер)
    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: ${5 * scaleY}px;
        padding: ${10 * scaleY}px ${30 * scaleX}px;
        background: linear-gradient(180deg, #dc3545, #a71d2a);
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        color: white;
        font-size: ${Math.max(13, 16 * scale)}px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    backBtn.innerHTML = '← Назад';
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
async function showTrialLeaderboardInArena() {
    const overlay = document.getElementById('arena-ui-overlay');
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
    title.innerHTML = '🏆 Рейтинг (Общий урон)';
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

    // Показываем загрузку
    listContainer.innerHTML = `
        <div style="color: #888; text-align: center; margin-top: 100px; font-size: ${Math.max(12, 14 * scale)}px;">
            Загрузка рейтинга...
        </div>
    `;
    overlay.appendChild(listContainer);

    // Загружаем рейтинг из Supabase (с fallback на localStorage)
    const leaderboard = await loadTrialLeaderboardSupabase();

    if (leaderboard.length === 0) {
        listContainer.innerHTML = `
            <div style="color: #888; text-align: center; margin-top: 100px; font-size: ${Math.max(12, 14 * scale)}px;">
                Рейтинг пока пуст.<br>Станьте первым!
            </div>
        `;
    } else {
        let html = '';
        const playerId = window.dbManager?.currentPlayer?.telegram_id || window.userData?.user_id || 'local';
        leaderboard.forEach((entry, index) => {
            const rank = entry.rank || (index + 1);
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const isMe = entry.playerId == playerId;
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
                    <span style="color: #FFD700;">${(entry.damage || 0).toLocaleString()}</span>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }

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
 * Загрузить рейтинг из Supabase
 */
async function loadTrialLeaderboardSupabase() {
    try {
        const supabase = window.dbManager?.supabase;
        if (!supabase) {
            console.warn('Supabase не инициализирован, используем localStorage');
            return loadTrialLeaderboardLocal();
        }

        const { data, error } = await supabase
            .rpc('get_trial_leaderboard', { p_limit: 100 });

        if (error) {
            console.error('Ошибка загрузки рейтинга:', error);
            return loadTrialLeaderboardLocal();
        }

        // Преобразуем формат для совместимости с UI
        return (data || []).map(entry => ({
            playerId: entry.player_id,
            playerName: entry.player_name,
            damage: entry.total_damage,  // Показываем общий урон (по нему сортировка)
            bestDamage: entry.best_damage,
            totalDamage: entry.total_damage,
            attempts: entry.attempts_count,
            rank: entry.rank
        }));
    } catch (e) {
        console.error('Ошибка загрузки рейтинга:', e);
        return loadTrialLeaderboardLocal();
    }
}

/**
 * Загрузить локальный рейтинг (fallback)
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
 * Сохранить результат в Supabase рейтинг
 */
async function saveTrialResultSupabase(damage) {
    const playerName = window.myUsername || window.userData?.username || 'Игрок';
    const playerId = window.dbManager?.currentPlayer?.telegram_id || window.userData?.user_id;

    if (!playerId) {
        return saveTrialResultLocal(damage);
    }

    saveTrialResultLocal(damage);

    try {
        const supabase = window.dbManager?.supabase;
        if (!supabase) return;

        const { error } = await supabase
            .rpc('upsert_trial_result', {
                p_player_id: playerId,
                p_player_name: playerName,
                p_damage: damage
            });

        if (error) {
            console.error('Ошибка сохранения в Trial leaderboard:', error);
        }
    } catch (e) {
        console.error('Ошибка сохранения результата:', e);
    }
}

/**
 * Сохранить результат в локальный рейтинг (fallback)
 * Накапливает total_damage для соответствия с Supabase рейтингом
 */
function saveTrialResultLocal(damage) {
    const playerName = window.myUsername || window.userData?.username || 'Игрок';
    const playerId = window.dbManager?.currentPlayer?.telegram_id || window.userData?.user_id || 'local';
    const currentWeek = window.getWeekNumber ? window.getWeekNumber() : 'unknown';

    let leaderboard = loadTrialLeaderboardLocal();
    const existingIndex = leaderboard.findIndex(e => e.playerId === playerId);

    if (existingIndex >= 0) {
        // Проверяем неделю - если новая, сбрасываем
        if (leaderboard[existingIndex].weekYear !== currentWeek) {
            leaderboard[existingIndex].damage = damage;
            leaderboard[existingIndex].bestDamage = damage;
            leaderboard[existingIndex].weekYear = currentWeek;
        } else {
            // Накапливаем общий урон (как в Supabase)
            leaderboard[existingIndex].damage = (leaderboard[existingIndex].damage || 0) + damage;
            leaderboard[existingIndex].bestDamage = Math.max(leaderboard[existingIndex].bestDamage || 0, damage);
        }
        leaderboard[existingIndex].playerName = playerName;
    } else {
        leaderboard.push({ playerId, playerName, damage, bestDamage: damage, weekYear: currentWeek });
    }

    // Сортируем по общему урону (как в Supabase)
    leaderboard.sort((a, b) => (b.damage || 0) - (a.damage || 0));
    leaderboard = leaderboard.slice(0, 100);
    localStorage.setItem('trial_leaderboard', JSON.stringify(leaderboard));

    return leaderboard;
}

/**
 * Получить позицию игрока в рейтинге из Supabase
 */
async function getPlayerTrialRankSupabase() {
    const playerId = window.dbManager?.currentPlayer?.telegram_id || window.userData?.user_id;
    const supabase = window.dbManager?.supabase;

    if (!playerId || !supabase) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .rpc('get_player_trial_rank', { p_player_id: playerId });

        if (error) {
            console.error('Ошибка получения ранга:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (e) {
        console.error('Ошибка получения ранга:', e);
        return null;
    }
}

/**
 * Получить ISO неделю прошлой недели в формате "YYYY-WW"
 * Совместимо с PostgreSQL to_char(date, 'IYYY-IW')
 */
function getLastWeekYear() {
    const now = new Date();
    // Вычитаем 7 дней
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Используем ISO алгоритм (четверг определяет неделю)
    const d = new Date(Date.UTC(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

/**
 * Проверить и автоматически начислить награду за прошлую неделю
 * Вызывается при входе игрока в игру
 */
async function checkAndClaimTrialReward() {
    const playerId = window.dbManager?.currentPlayer?.telegram_id || window.userData?.user_id;
    const supabase = window.dbManager?.supabase;

    if (!playerId || !supabase) {
        return null;
    }

    const lastWeek = getLastWeekYear();

    try {
        const { data, error } = await supabase
            .rpc('auto_claim_trial_reward', {
                p_player_id: playerId,
                p_week_year: lastWeek
            });

        if (error) {
            console.error('Ошибка проверки награды испытания:', error);
            return null;
        }

        if (data && data.length > 0 && data[0].success) {
            const result = data[0];
            console.log('🏆 Награда за испытание начислена:', result);

            // Показываем уведомление
            showTrialRewardNotification(result);

            // Обновляем время игрока локально
            if (window.userData) {
                window.userData.time_currency = (window.userData.time_currency || 0) + result.reward_time;
            }

            return result;
        }

        return null;
    } catch (e) {
        console.error('Ошибка проверки награды:', e);
        return null;
    }
}

/**
 * Показать уведомление о награде за испытание
 */
function showTrialRewardNotification(result) {
    const modal = document.createElement('div');
    modal.className = 'trial-reward-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100000;
        animation: fadeIn 0.3s ease;
    `;

    // Определяем цвет и название тира по проценту
    let tierColor, tierName, tierEmoji;
    if (result.percent <= 1) {
        tierColor = '#FFD700'; tierName = 'Легенда'; tierEmoji = '🏆';
    } else if (result.percent <= 5) {
        tierColor = '#a855f7'; tierName = 'Эпик'; tierEmoji = '💎';
    } else if (result.percent <= 10) {
        tierColor = '#3b82f6'; tierName = 'Редкий'; tierEmoji = '💠';
    } else if (result.percent <= 25) {
        tierColor = '#22c55e'; tierName = 'Необычный'; tierEmoji = '✨';
    } else if (result.percent <= 50) {
        tierColor = '#94a3b8'; tierName = 'Обычный'; tierEmoji = '⭐';
    } else {
        tierColor = '#78716c'; tierName = 'Участник'; tierEmoji = '🎯';
    }

    // Форматируем награду
    const rewardText = formatTimeReward(result.reward_time);

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 3px solid ${tierColor};
        border-radius: 20px;
        padding: 30px;
        max-width: 420px;
        width: 90%;
        text-align: center;
        color: white;
        font-family: Arial, sans-serif;
        box-shadow: 0 0 30px ${tierColor}50;
        animation: scaleIn 0.4s ease;
    `;

    content.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px;">${tierEmoji}</div>
        <h2 style="margin: 0 0 10px 0; color: ${tierColor}; font-size: 24px;">
            Итоги испытания!
        </h2>
        <div style="color: #888; font-size: 14px; margin-bottom: 20px;">
            Результаты прошлой недели
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <div style="font-size: 14px; color: #888; margin-bottom: 5px;">Ваш лучший результат</div>
            <div style="font-size: 28px; color: #FFD700; font-weight: bold;">
                ⚔️ ${result.best_damage.toLocaleString()} урона
            </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px;">
                <div style="font-size: 12px; color: #888;">Место</div>
                <div style="font-size: 20px; color: #4a9eff; font-weight: bold;">
                    #${result.rank}
                </div>
            </div>
            <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px;">
                <div style="font-size: 12px; color: #888;">Всего игроков</div>
                <div style="font-size: 20px; color: #888;">
                    ${result.total_players}
                </div>
            </div>
            <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px;">
                <div style="font-size: 12px; color: #888;">Топ</div>
                <div style="font-size: 20px; color: ${tierColor}; font-weight: bold;">
                    ${result.percent.toFixed(1)}%
                </div>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.1)); border: 2px solid #22c55e; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 14px; color: #4ade80; margin-bottom: 5px;">
                ${tierEmoji} ${tierName} - Ваша награда:
            </div>
            <div style="font-size: 26px; color: #ffd700; font-weight: bold;">
                +${rewardText}
            </div>
        </div>

        <button id="trial-reward-close-btn" style="
            background: linear-gradient(135deg, ${tierColor}, ${tierColor}99);
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        ">Отлично!</button>
    `;

    // Добавляем стили анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Закрытие
    document.getElementById('trial-reward-close-btn').onclick = () => {
        modal.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => modal.remove(), 200);
    };

    // Закрытие по клику вне окна
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => modal.remove(), 200);
        }
    };
}

// Экспорт
window.showTrainingGroundScreen = showTrainingGroundScreen;
window.addTrainingGroundButton = addTrainingGroundButton;
window.formatTimeReward = formatTimeReward;
window.showTrialMenuInArena = showTrialMenuInArena;
window.showTrialLeaderboardInArena = showTrialLeaderboardInArena;
window.saveTrialResultLocal = saveTrialResultLocal;
window.saveTrialResultSupabase = saveTrialResultSupabase;
window.loadTrialLeaderboardSupabase = loadTrialLeaderboardSupabase;
window.getPlayerTrialRankSupabase = getPlayerTrialRankSupabase;
window.checkAndClaimTrialReward = checkAndClaimTrialReward;
window.showTrialRewardNotification = showTrialRewardNotification;

console.log('✅ Training Dummy UI загружен');
