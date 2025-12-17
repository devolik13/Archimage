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

// Экспорт
window.showTrainingGroundScreen = showTrainingGroundScreen;
window.addTrainingGroundButton = addTrainingGroundButton;
window.formatTimeReward = formatTimeReward;

console.log('✅ Training Dummy UI загружен');
