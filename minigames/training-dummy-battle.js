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

    // Логируем раунд
    if (typeof window.addToBattleLog === 'function') {
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

        // Используем заклинания
        if (typeof window.useWizardSpells === 'function') {
            window.useWizardSpells(mageData.wizard, mageData.position, 'player');
        }

        // Пауза между магами для анимаций
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Подсчитываем нанесённый урон за раунд
    const hpAfter = dummy ? Math.max(0, dummy.hp) : 0;
    const damageThisRound = Math.max(0, hpBefore - hpAfter);
    dummyBattleState.totalDamage += damageThisRound;

    // Переходим к следующему раунду
    dummyBattleState.roundsRemaining--;
    dummyBattleState.currentRound++;

    // Логируем урон за раунд
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`\n⚔️ Урон за раунд: ${damageThisRound.toLocaleString()}`);
        window.addToBattleLog(`📊 Всего урона: ${dummyBattleState.totalDamage.toLocaleString()}`);
        if (dummyBattleState.roundsRemaining > 0 && (!dummy || dummy.hp > 0)) {
            window.addToBattleLog(`🔄 Осталось раундов: ${dummyBattleState.roundsRemaining}`);
        }
    }

    // Обновляем поле боя
    if (typeof window.updateBattleField === 'function') {
        window.updateBattleField();
    }

    // Проверяем конец боя
    if (dummyBattleState.roundsRemaining <= 0 || (dummy && dummy.hp <= 0)) {
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
    if (window.battleTimerManager && window.battleTimerManager.stopBattleLoop) {
        window.battleTimerManager.stopBattleLoop();
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

    // Показываем результат
    setTimeout(() => {
        showDummyResult(totalDamage, progress);
    }, 1500);
}

/**
 * Показать окно результата
 */
function showDummyResult(damage, progress) {
    // Сбрасываем флаг
    window.isTrainingDummyBattle = false;

    const reward = window.getRewardForDamage(progress.totalDamage);
    const nextReward = window.WEEKLY_REWARDS.find(r => r.minDamage > progress.totalDamage);
    const remaining = window.getRemainingAttempts();

    // Создаём модальное окно (полупрозрачный фон чтобы арена была видна)
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #4a9eff;
        border-radius: 15px;
        padding: 25px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: white;
        font-family: Arial, sans-serif;
    `;

    const config = window.getCurrentDummyConfig();

    content.innerHTML = `
        <h2 style="margin: 0 0 15px 0; color: #4a9eff;">🎯 Тренировка завершена!</h2>
        <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; color: #888; margin-bottom: 5px;">${config.name}</div>
        </div>

        <div style="background: #0d1b2a; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="font-size: 24px; color: #ffd700; margin-bottom: 10px;">
                ⚔️ ${damage.toLocaleString()} урона
            </div>
            <div style="font-size: 14px; color: #aaa;">
                Лучшая попытка: ${progress.bestAttempt.toLocaleString()}
            </div>
        </div>

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
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Обработчики кнопок
    const retryBtn = document.getElementById('dummy-retry-btn');
    if (retryBtn) {
        retryBtn.onclick = () => {
            modal.remove();
            startDummyBattle();
        };
    }

    document.getElementById('dummy-exit-btn').onclick = () => {
        modal.remove();
        // Закрываем поле боя
        if (typeof window.closeBattleFieldModal === 'function') {
            window.closeBattleFieldModal();
        }
        // Возвращаемся в меню испытаний
        if (typeof window.showTrialMenuInArena === 'function') {
            window.showTrialMenuInArena();
        }
    };
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
