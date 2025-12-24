// minigames/training-dummy-battle.js - Боевая логика тренировочного полигона
/**
 * Специальный режим боя с манекеном:
 * - Враг не атакует
 * - Ограниченное число ходов
 * - Подсчёт общего урона
 */

// Состояние боя с манекеном
let dummyBattleState = {
    active: false,
    roundsRemaining: 0,
    currentRound: 0,
    totalDamage: 0,
    dummyStartHp: 0
};

/**
 * Начать бой с манекеном
 */
async function startDummyBattle() {
    // Проверяем попытки
    const remaining = window.getRemainingAttempts();
    if (remaining <= 0) {
        alert('❌ Попытки на сегодня закончились!\nПриходите завтра.');
        return;
    }

    // Проверяем формацию (используем тот же метод что и PvP)
    const formation = window.userData?.formation || [null, null, null, null, null];
    if (!formation.some(wizardId => wizardId !== null)) {
        alert('❌ Сначала выберите магов в расстановке!');
        return;
    }

    // СРАЗУ списываем попытку (как в PvP)
    deductTrialAttempt();

    // Устанавливаем флаги
    window.isTrainingDummyBattle = true;
    window.isPvEBattle = false;

    // Создаём манекена
    const dummy = window.createDummyEnemy();

    // Сохраняем начальное HP для подсчёта урона
    dummyBattleState = {
        active: true,
        roundsRemaining: window.DUMMY_CONFIG.MAX_ROUNDS,
        currentRound: 1,
        totalDamage: 0,
        dummyStartHp: dummy.hp,
        attemptDeducted: true  // Попытка уже списана
    };

    // Устанавливаем врага
    window.enemyFormation = [null, null, dummy, null, null]; // Манекен в центре
    window.enemyWizards = [dummy];

    // Инициализируем статистику боя для опыта
    if (typeof window.initBattleStats === 'function') {
        window.initBattleStats();
    }

    // Показываем поле боя
    if (typeof window.showBattleField === 'function') {
        await window.showBattleField();
    }

    // Логируем начало
    if (typeof window.addToBattleLog === 'function') {
        const config = window.getCurrentDummyConfig();
        window.addToBattleLog(`\n🎯 ═══ ТРЕНИРОВОЧНЫЙ ПОЛИГОН ═══`);
        window.addToBattleLog(`📋 Манекен: ${config.name}`);
        window.addToBattleLog(`📝 ${config.description}`);
        window.addToBattleLog(`❤️ HP: ${dummy.hp.toLocaleString()}`);
        window.addToBattleLog(`🔄 Раундов: ${dummyBattleState.roundsRemaining}`);
        window.addToBattleLog(`═══════════════════════════════\n`);

        // Показываем сопротивления
        window.addToBattleLog(`🛡️ Сопротивления:`);
        const res = config.resistances;
        if (res.fire !== 0) window.addToBattleLog(`   🔥 Огонь: ${res.fire > 0 ? '+' : ''}${res.fire}%`);
        if (res.water !== 0) window.addToBattleLog(`   💧 Вода: ${res.water > 0 ? '+' : ''}${res.water}%`);
        if (res.wind !== 0) window.addToBattleLog(`   🌪️ Ветер: ${res.wind > 0 ? '+' : ''}${res.wind}%`);
        if (res.earth !== 0) window.addToBattleLog(`   🪨 Земля: ${res.earth > 0 ? '+' : ''}${res.earth}%`);
        if (res.nature !== 0) window.addToBattleLog(`   🌿 Природа: ${res.nature > 0 ? '+' : ''}${res.nature}%`);
        if (res.poison !== 0) window.addToBattleLog(`   ☠️ Яд: ${res.poison > 0 ? '+' : ''}${res.poison}%`);
        window.addToBattleLog(``);
    }
}

/**
 * Списать попытку испытания (вызывается сразу при старте)
 */
function deductTrialAttempt() {
    const progress = window.loadDummyProgress();
    const today = new Date().toDateString();

    // Сброс попыток на новый день
    if (progress.lastAttemptDate !== today) {
        progress.attemptsToday = 0;
        progress.lastAttemptDate = today;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        progress.attemptResetTime = tomorrow.toISOString();
    }

    // Списываем попытку
    progress.attemptsToday++;
    window.saveDummyProgress(progress, true); // immediate save to DB

    console.log(`🎯 Попытка испытания списана. Осталось: ${window.DUMMY_CONFIG.DAILY_ATTEMPTS - progress.attemptsToday}`);
}

/**
 * Специальная фаза боя для манекена
 * Раунд = все маги игрока атакуют по очереди
 */
async function executeDummyBattlePhase() {
    if (!dummyBattleState.active) return;

    // Проверка на конец боя по раундам
    if (dummyBattleState.roundsRemaining <= 0) {
        await endDummyBattle();
        return;
    }

    // Логируем раунд (пропускаем при быстрой симуляции)
    if (!window.fastSimulation && typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`\n━━━ Раунд ${dummyBattleState.currentRound}/${window.DUMMY_CONFIG.MAX_ROUNDS} ━━━`);
    }

    // Сохраняем HP манекена до раунда
    const dummy = window.enemyFormation.find(e => e && e.isTrainingDummy);
    const hpBefore = dummy ? dummy.hp : 0;

    // Все маги игрока атакуют (как в обычном бою)
    const alivePlayers = [];
    for (let pos = 0; pos < 5; pos++) {
        const wizardId = window.playerFormation[pos];
        if (wizardId) {
            const wizard = window.playerWizards.find(w => w.id === wizardId);
            if (wizard && wizard.hp > 0) {
                alivePlayers.push({ wizard, position: pos });
            }
        }
    }

    // Каждый маг использует заклинания по очереди
    for (const mageData of alivePlayers) {
        if (mageData.wizard.hp <= 0) continue;

        // Проверяем не умер ли манекен
        if (dummy && dummy.hp <= 0) break;

        // Используем заклинания - ждём завершения всех кастов
        if (typeof window.useWizardSpells === 'function') {
            await window.useWizardSpells(mageData.wizard, mageData.position, 'player');
        }
    }

    // Ждём пока все снаряды долетят (пропускаем при быстрой симуляции)
    if (!window.fastSimulation) {
        // Используем 75% от текущей скорости боя для задержки между раундами
        const delay = (window.battleSpeed || 2000) * 0.75;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Подсчитываем нанесённый урон за раунд
    const hpAfter = dummy ? Math.max(0, dummy.hp) : 0;
    const damageThisRound = Math.max(0, hpBefore - hpAfter);
    dummyBattleState.totalDamage += damageThisRound;

    // Переходим к следующему раунду
    dummyBattleState.roundsRemaining--;
    dummyBattleState.currentRound++;

    // Логируем урон за раунд (пропускаем при быстрой симуляции)
    if (!window.fastSimulation && typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`\n⚔️ Урон за раунд: ${damageThisRound.toLocaleString()}`);
        window.addToBattleLog(`📊 Всего урона: ${dummyBattleState.totalDamage.toLocaleString()}`);
        if (dummyBattleState.roundsRemaining > 0 && (!dummy || dummy.hp > 0)) {
            window.addToBattleLog(`🔄 Осталось раундов: ${dummyBattleState.roundsRemaining}`);
        }
    }

    // Обновляем поле боя (пропускаем при быстрой симуляции)
    if (!window.fastSimulation && typeof window.updateBattleField === 'function') {
        window.updateBattleField();
    }

    // Проверяем конец боя (при быстрой симуляции не вызываем endDummyBattle - это делает вызывающий код)
    if (!window.fastSimulation && (dummyBattleState.roundsRemaining <= 0 || (dummy && dummy.hp <= 0))) {
        await endDummyBattle();
    }
}

/**
 * Завершить бой с манекеном
 */
async function endDummyBattle() {
    if (!dummyBattleState.active) return;

    dummyBattleState.active = false;
    window.battleState = 'finished';

    // Останавливаем боевой цикл
    if (window.battleInterval) {
        clearInterval(window.battleInterval);
        window.battleInterval = null;
    }
    if (window.battleSpeedController) {
        window.battleSpeedController.stopBattle();
    }

    // Финальный подсчёт урона (на случай если манекен убит)
    const dummy = window.enemyFormation.find(e => e && e.isTrainingDummy);
    if (dummy) {
        const actualDamage = dummyBattleState.dummyStartHp - Math.max(0, dummy.hp);
        dummyBattleState.totalDamage = Math.max(dummyBattleState.totalDamage, actualDamage);
    }

    const totalDamage = dummyBattleState.totalDamage;

    // Получаем остаток HP манекена
    const remainingHp = dummy ? Math.max(0, dummy.hp) : 0;

    // Записываем результат с остатком HP
    const progress = window.recordAttempt(totalDamage, remainingHp);

    // Рассчитываем и начисляем опыт (тренировка всегда считается победой)
    let expResults = [];
    if (typeof window.calculateAndGrantBattleExp === 'function') {
        expResults = window.calculateAndGrantBattleExp(true);

        // Сохраняем опыт в базу данных
        if (expResults.length > 0 && typeof window.onWizardsGainedExperience === 'function') {
            const wizardIds = window.playerFormation.filter(id => id !== null);
            const totalExp = expResults.reduce((sum, r) => sum + r.expGained, 0);
            window.onWizardsGainedExperience(wizardIds, totalExp);
        }
    }

    // Сохраняем результаты XP для отображения
    dummyBattleState.expResults = expResults;

    // Логируем результат
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`\n🏁 ═══ ТРЕНИРОВКА ЗАВЕРШЕНА ═══`);
        window.addToBattleLog(`⚔️ Урон за попытку: ${totalDamage.toLocaleString()}`);
        window.addToBattleLog(`📊 Лучшая попытка: ${progress.bestAttempt.toLocaleString()}`);
        window.addToBattleLog(`📈 Всего за неделю: ${progress.totalDamage.toLocaleString()}`);

        const reward = window.getRewardForDamage(progress.totalDamage);
        window.addToBattleLog(`\n🎁 Текущая награда: ${reward.description}`);

        const nextReward = window.WEEKLY_REWARDS.find(r => r.minDamage > progress.totalDamage);
        if (nextReward) {
            const needed = nextReward.minDamage - progress.totalDamage;
            window.addToBattleLog(`📌 До "${nextReward.description}": ещё ${needed.toLocaleString()} урона`);
        }

        const remaining = window.getRemainingAttempts();
        window.addToBattleLog(`\n🎯 Осталось попыток сегодня: ${remaining}`);
        window.addToBattleLog(`⏰ До конца недели: ${window.formatTimeUntilWeekEnd()}`);
        window.addToBattleLog(`═══════════════════════════════`);
    }

    // Показываем результат на фоне арены (как в PvP)
    setTimeout(() => {
        // Очищаем PIXI и UI боя
        if (window.animationManager) {
            window.animationManager.clearAll();
        }
        if (window.spellAnimations?.leaf_canopy?.clearAll) {
            window.spellAnimations.leaf_canopy.clearAll();
        }
        if (window.destroyPixiBattle) {
            window.destroyPixiBattle();
        }

        // Удаляем UI боя
        const battleModal = document.getElementById("battle-field-modal");
        if (battleModal) battleModal.remove();
        const container = document.getElementById("battle-field-fullscreen-container");
        if (container) container.remove();
        const pixiContainer = document.getElementById("pixi-battle-container");
        if (pixiContainer) pixiContainer.remove();

        // Показываем арену с фоном
        if (typeof window.showPvPArenaModalBg === 'function') {
            window.showPvPArenaModalBg();
        }

        // Показываем результат с задержкой для загрузки арены
        setTimeout(() => {
            showDummyResult(totalDamage, progress, dummyBattleState.expResults || []);
        }, 150);
    }, 1500);
}

/**
 * Показать окно результата (используем arena-ui-overlay как в PvP)
 */
function showDummyResult(damage, progress, expResults = []) {
    // Сбрасываем флаг
    window.isTrainingDummyBattle = false;

    const reward = window.getRewardForDamage(progress.totalDamage);
    const nextReward = window.WEEKLY_REWARDS.find(r => r.minDamage > progress.totalDamage);
    const remaining = window.getRemainingAttempts();
    const config = window.getCurrentDummyConfig();

    // Формируем блок с опытом
    const totalExp = expResults.reduce((sum, r) => sum + r.expGained, 0);
    let expHtml = '';
    if (expResults.length > 0) {
        const expLines = expResults.map(r => {
            let line = `<div style="font-size: 13px; color: #fbbf24;">${r.name}: +${r.expGained} XP</div>`;
            if (r.levelGained > 0) {
                line += `<div style="font-size: 11px; color: #4ade80;">⭐ Уровень повышен до ${r.newLevel}!</div>`;
            }
            return line;
        }).join('');

        expHtml = `
            <div style="background: rgba(251, 191, 36, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(251, 191, 36, 0.3);">
                <div style="font-size: 14px; color: #fbbf24; margin-bottom: 8px;">
                    ✨ Опыт получен: +${totalExp} XP
                </div>
                ${expLines}
            </div>
        `;
    }

    // Получаем overlay арены (как в PvP showArenaResult)
    const overlay = document.getElementById('arena-ui-overlay');

    if (overlay) {
        // Показываем в overlay арены (на фоне арены)
        overlay.innerHTML = '';

        const container = document.createElement('div');
        container.id = 'dummy-result-container';
        container.style.cssText = `
            position: absolute;
            top: 2%;
            left: 5%;
            width: 90%;
            max-height: 96%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 2px solid rgba(74, 158, 255, 0.8);
            border-radius: 12px;
            padding: 15px;
            overflow-y: auto;
            color: white;
            pointer-events: auto;
            box-shadow: 0 0 30px rgba(74, 158, 255, 0.4);
            box-sizing: border-box;
            text-align: center;
        `;

        container.innerHTML = `
            <h2 style="margin: 0 0 15px 0; color: #4a9eff; font-size: 22px;">🎯 Тренировка завершена!</h2>
            <div style="margin-bottom: 15px;">
                <div style="font-size: 14px; color: #888;">${config.name}</div>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 12px;">
                <div style="font-size: 26px; color: #ffd700; margin-bottom: 8px;">
                    ⚔️ ${damage.toLocaleString()} урона
                </div>
                <div style="font-size: 14px; color: #aaa;">
                    Лучшая попытка: ${progress.bestAttempt.toLocaleString()}
                </div>
            </div>

            ${expHtml}

            <div style="background: rgba(26, 58, 26, 0.5); padding: 15px; border-radius: 10px; margin-bottom: 12px; border: 1px solid rgba(74, 222, 128, 0.3);">
                <div style="font-size: 18px; color: #4ade80; margin-bottom: 5px;">
                    📈 За неделю: ${progress.totalDamage.toLocaleString()}
                </div>
                <div style="font-size: 14px; color: #86efac;">
                    ${reward.description} (${Math.floor(reward.reward / 60)}ч)
                </div>
                ${nextReward ? `
                    <div style="font-size: 12px; color: #888; margin-top: 8px;">
                        До "${nextReward.description}": ещё ${(nextReward.minDamage - progress.totalDamage).toLocaleString()}
                    </div>
                ` : ''}
            </div>

            <div style="font-size: 13px; color: #888; margin-bottom: 15px;">
                🎯 Попыток осталось: ${remaining}/3<br>
                ⏰ До конца недели: ${window.formatTimeUntilWeekEnd()}
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                ${remaining > 0 ? `
                    <button id="dummy-retry-btn" style="
                        background: linear-gradient(135deg, #4a9eff, #2d7dd2);
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        min-width: 120px;
                    ">🔄 Ещё раз</button>
                ` : ''}
                <button id="dummy-exit-btn" style="
                    background: linear-gradient(135deg, #555, #333);
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    min-width: 120px;
                ">⬅ Назад</button>
            </div>
        `;

        overlay.appendChild(container);
        setupDummyResultButtons(null);
    } else {
        // Fallback - создаём простую модалку если overlay не найден
        console.warn('⚠️ arena-ui-overlay не найден, используем fallback');
        const modal = document.createElement('div');
        modal.id = 'dummy-result-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #4a9eff;
                border-radius: 15px;
                padding: 25px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                color: white;
            ">
                <h2 style="margin: 0 0 15px 0; color: #4a9eff;">🎯 Тренировка завершена!</h2>
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; color: #888;">${config.name}</div>
                </div>

                <div style="background: #0d1b2a; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-size: 24px; color: #ffd700; margin-bottom: 10px;">
                        ⚔️ ${damage.toLocaleString()} урона
                    </div>
                    <div style="font-size: 14px; color: #aaa;">
                        Лучшая попытка: ${progress.bestAttempt.toLocaleString()}
                    </div>
                </div>

                ${expHtml}

                <div style="background: #1a3a1a; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-size: 18px; color: #4ade80; margin-bottom: 5px;">
                        📈 За неделю: ${progress.totalDamage.toLocaleString()}
                    </div>
                    <div style="font-size: 14px; color: #86efac;">
                        ${reward.description} (${Math.floor(reward.reward / 60)}ч)
                    </div>
                    ${nextReward ? `
                        <div style="font-size: 12px; color: #888; margin-top: 10px;">
                            До "${nextReward.description}": ещё ${(nextReward.minDamage - progress.totalDamage).toLocaleString()}
                        </div>
                    ` : ''}
                </div>

                <div style="font-size: 14px; color: #888; margin-bottom: 20px;">
                    🎯 Попыток осталось: ${remaining}/3<br>
                    ⏰ До конца недели: ${window.formatTimeUntilWeekEnd()}
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    ${remaining > 0 ? `
                        <button id="dummy-retry-btn" style="
                            background: linear-gradient(135deg, #4a9eff, #2d7dd2);
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            color: white;
                            font-size: 16px;
                            cursor: pointer;
                        ">🔄 Ещё раз</button>
                    ` : ''}
                    <button id="dummy-exit-btn" style="
                        background: linear-gradient(135deg, #555, #333);
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                    ">⬅ Назад</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setupDummyResultButtons(modal);
    }
}

/**
 * Настроить обработчики кнопок результата
 */
function setupDummyResultButtons(fallbackModal = null) {
    const retryBtn = document.getElementById('dummy-retry-btn');
    const exitBtn = document.getElementById('dummy-exit-btn');

    if (retryBtn) {
        retryBtn.onclick = () => {
            closeDummyResult(fallbackModal);
            // Начинаем новый бой (арена уже открыта)
            startDummyBattle();
        };
    }

    if (exitBtn) {
        exitBtn.onclick = () => {
            closeDummyResult(fallbackModal);
            // Просто показываем меню испытаний (арена уже открыта)
            if (typeof window.showTrialMenuInArena === 'function') {
                window.showTrialMenuInArena();
            }
        };
    }
}

/**
 * Закрыть окно результата
 */
function closeDummyResult(fallbackModal = null) {
    if (fallbackModal) {
        fallbackModal.remove();
    } else {
        // Очищаем результат из overlay
        const resultContainer = document.getElementById('dummy-result-container');
        if (resultContainer) {
            resultContainer.remove();
        }
        // Также пробуем закрыть Modal если использовался fallback
        if (window.Modal) {
            window.Modal.close();
        }
    }
}

/**
 * Проверить, это бой с манекеном?
 */
function isTrainingDummyBattle() {
    return window.isTrainingDummyBattle === true;
}

/**
 * Получить состояние боя с манекеном
 */
function getDummyBattleState() {
    return dummyBattleState;
}

// Экспорт
window.startDummyBattle = startDummyBattle;
window.executeDummyBattlePhase = executeDummyBattlePhase;
window.endDummyBattle = endDummyBattle;
window.showDummyResult = showDummyResult;
window.isTrainingDummyBattle = isTrainingDummyBattle;
window.getDummyBattleState = getDummyBattleState;

console.log('✅ Training Dummy Battle загружен');
