// tournament/headless-battle.js - Headless (без рендеринга) расчёт боя
// Используется для предрассчёта турнирных боёв

/**
 * Запустить бой без визуализации (headless mode)
 * Использует существующую боевую систему, но без PIXI рендеринга
 *
 * @param {Object} player1 - Данные первого игрока (locked_wizards, locked_formation, locked_spells, locked_buildings)
 * @param {Object} player2 - Данные второго игрока
 * @param {number} attackerId - telegram_id атакующего (player1 или player2)
 * @returns {Object} { winner, log, summary }
 */
async function runHeadlessBattle(player1, player2, attackerId) {
    console.log(`🏟️ [Headless] Запуск боя: ${player1.player_name} vs ${player2.player_name} (атакует: ${attackerId})`);

    // 1. Сохраняем текущее состояние (чтобы восстановить после расчёта)
    const savedState = saveGlobalBattleState();

    // 2. Определяем кто атакует, кто защищается
    const attacker = attackerId === player1.player_id ? player1 : player2;
    const defender = attackerId === player1.player_id ? player2 : player1;

    try {
        // 3. Включаем headless mode
        window.isHeadlessBattle = true;
        window.isDuelBattle = true; // Без наград/штрафов
        window.isPvEBattle = false;
        window.currentPvELevel = null;
        window.isBossBattle = false;
        window.isTrainingDummyBattle = false;

        // 4. Мокаем функции рендеринга
        const mocks = mockRenderingFunctions();

        // 5. Настраиваем формации
        setupHeadlessFormations(attacker, defender);

        // 6. Инициализируем бой (без рендеринга)
        window.battleState = 'setup';
        window.currentPhase = 0;
        window.currentPlayerTurn = 0;
        window.battleLog = [];
        window.playerMageIndex = 0;
        window.enemyMageIndex = 0;
        window.isPaused = false;
        window.battleSpeed = 0; // Мгновенно
        window.battlePhaseRunning = false;
        window.isPlayerAttacker = true; // Атакующий = player side

        // Защита от бесконечных боёв
        window.lastTotalHP = null;
        window.stalemateCounter = 0;
        window.STALEMATE_TURNS_LIMIT = 15;

        // Инициализация логгера
        if (window.battleLogger) {
            window.battleLogger.init();
        }

        // Очистка систем
        window.activeSummons = [];
        window.activeMeteorokinesis = [];
        window.activeTsunamis = [];
        window.activeBlizzards = [];
        if (typeof window.resetProjectiles === 'function') window.resetProjectiles();
        if (typeof window.resetWalls === 'function') window.resetWalls();
        if (window.summonsManager) window.summonsManager.clearAll();

        // Инициализация погоды
        if (typeof window.initializeWeatherForBattle === 'function') {
            window.initializeWeatherForBattle();
        }

        // Сброс флагов результата
        window.battleResultShown = false;
        window._battleCompletedHandled = false;
        window._battleSaveCompleted = false;
        window.arenaResultShown = false;
        window.globalTurnCounter = 0;
        window.isVeryFirstTurn = true;
        window.currentTurn = 'player';

        // Инициализируем здоровье магов (вызывает всю логику бонусов, эффектов, заклинаний)
        if (typeof window.initializeWizardHealth === 'function') {
            window.initializeWizardHealth();
        }

        // Запуск логирования
        const playerTeam = window.playerFormation
            .map(id => id ? window.playerWizards.find(w => w.id === id) : null)
            .filter(w => w);
        const enemyTeam = window.enemyWizards.filter(w => w);
        if (typeof window.logBattleStart === 'function') {
            window.logBattleStart(playerTeam, enemyTeam);
        }

        window.battleState = 'active';

        // 7. Выполняем бой в цикле (без setInterval)
        const MAX_PHASES = 500; // Защита от бесконечного цикла
        let phaseCount = 0;

        while (window.battleState === 'active' && phaseCount < MAX_PHASES) {
            window.battlePhaseRunning = false; // Сбрасываем блокировку между фазами
            await window.executeBattlePhase();
            phaseCount++;
        }

        // Если бой не завершился за MAX_PHASES — ничья
        if (window.battleState === 'active') {
            console.warn(`⚠️ [Headless] Бой не завершился за ${MAX_PHASES} фаз, объявляем ничью`);
            window.battleState = 'finished';
        }

        // 8. Собираем результат
        const result = determineHeadlessResult(attacker, defender);

        // 9. Собираем лог и сводку
        const battleResult = {
            winner: result.winnerId, // telegram_id победителя или null (ничья)
            result: result.resultCode, // 'player1', 'player2', 'draw'
            log: [...(window.battleLog || [])],
            summary: {
                totalPhases: phaseCount,
                attackerName: attacker.player_name,
                defenderName: defender.player_name,
                playerSurvivors: countSurvivors('player'),
                enemySurvivors: countSurvivors('enemy'),
                playerTotalHp: getTotalHp('player'),
                enemyTotalHp: getTotalHp('enemy')
            }
        };

        console.log(`🏟️ [Headless] Бой завершён за ${phaseCount} фаз. Результат: ${result.resultCode}`);

        // 10. Восстанавливаем моки
        mocks.restore();

        return battleResult;

    } catch (error) {
        console.error('❌ [Headless] Ошибка в бою:', error);
        return {
            winner: null,
            result: 'error',
            log: [...(window.battleLog || [])],
            summary: { error: error.message }
        };
    } finally {
        // 11. Восстанавливаем глобальное состояние
        window.isHeadlessBattle = false;
        restoreGlobalBattleState(savedState);
    }
}

/**
 * Настраиваем формации для headless боя
 */
function setupHeadlessFormations(attacker, defender) {
    // Игрок (атакующий) — используем locked данные
    const attackerWizards = attacker.locked_wizards || [];
    const attackerFormation = attacker.locked_formation || [null, null, null, null, null];
    const attackerSpells = attacker.locked_spells || {};

    window.playerWizards = attackerWizards.map(w => ({
        ...JSON.parse(JSON.stringify(w)), // deep copy
        effects: {},
        buffs: {}
    }));
    window.playerFormation = [...attackerFormation];

    // Враг (защищающийся) — как selectedOpponent
    const defenderWizards = defender.locked_wizards || [];
    const defenderFormation = defender.locked_formation || [null, null, null, null, null];
    const defenderSpells = defender.locked_spells || {};

    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];

    defenderFormation.forEach((wizardId, position) => {
        if (wizardId) {
            const wiz = defenderWizards.find(w => w.id === wizardId);
            if (wiz) {
                const wizardCopy = JSON.parse(JSON.stringify(wiz));
                const wizardSpells = wizardCopy.spells || [];
                window.enemyFormation[position] = {
                    ...wizardCopy,
                    id: `enemy_${wizardCopy.id}`,
                    original_id: wizardCopy.id,
                    spells: wizardSpells,
                    spellLevels: typeof window.buildSpellLevels === 'function'
                        ? window.buildSpellLevels(wizardSpells, defenderSpells)
                        : {},
                    effects: {},
                    buffs: {}
                };
            }
        }
    });

    window.enemyWizards = window.enemyFormation.filter(w => w !== null);

    // Для корректного расчёта бонусов — подменяем userData
    window.userData = {
        ...window.userData,
        formation: [...attackerFormation],
        wizards: window.playerWizards,
        spells: attackerSpells,
        buildings: attacker.locked_buildings || window.userData?.buildings || {},
        active_blessing: null // Убираем благословения для турнира (опционально)
    };
}

/**
 * Определяем результат боя
 */
function determineHeadlessResult(attacker, defender) {
    const playerAlive = window.playerFormation.some(id => {
        if (!id) return false;
        const wiz = window.playerWizards.find(w => w.id === id);
        return wiz && wiz.hp > 0;
    });

    const enemyAlive = window.enemyFormation.some(w => w && w.hp > 0);

    if (playerAlive && !enemyAlive) {
        return { winnerId: attacker.player_id, resultCode: 'player1' };
    } else if (!playerAlive && enemyAlive) {
        return { winnerId: defender.player_id, resultCode: 'player2' };
    } else {
        return { winnerId: null, resultCode: 'draw' };
    }
}

/**
 * Подсчёт выживших
 */
function countSurvivors(side) {
    if (side === 'player') {
        return window.playerFormation.filter(id => {
            if (!id) return false;
            const wiz = window.playerWizards.find(w => w.id === id);
            return wiz && wiz.hp > 0;
        }).length;
    } else {
        return window.enemyFormation.filter(w => w && w.hp > 0).length;
    }
}

/**
 * Суммарный HP стороны
 */
function getTotalHp(side) {
    if (side === 'player') {
        return window.playerFormation.reduce((sum, id) => {
            if (!id) return sum;
            const wiz = window.playerWizards.find(w => w.id === id);
            return sum + (wiz && wiz.hp > 0 ? wiz.hp : 0);
        }, 0);
    } else {
        return window.enemyFormation.reduce((sum, w) => {
            return sum + (w && w.hp > 0 ? w.hp : 0);
        }, 0);
    }
}

/**
 * Сохранить глобальное состояние боя
 */
function saveGlobalBattleState() {
    return {
        playerFormation: window.playerFormation ? [...window.playerFormation] : [],
        enemyFormation: window.enemyFormation ? window.enemyFormation.map(w => w ? { ...w } : null) : [],
        playerWizards: window.playerWizards ? window.playerWizards.map(w => ({ ...w })) : [],
        enemyWizards: window.enemyWizards ? window.enemyWizards.map(w => ({ ...w })) : [],
        battleState: window.battleState,
        battleLog: window.battleLog ? [...window.battleLog] : [],
        battleInterval: window.battleInterval,
        selectedOpponent: window.selectedOpponent,
        isDuelBattle: window.isDuelBattle,
        isPvEBattle: window.isPvEBattle,
        isBossBattle: window.isBossBattle,
        isTrainingDummyBattle: window.isTrainingDummyBattle,
        isPlayerAttacker: window.isPlayerAttacker,
        globalTurnCounter: window.globalTurnCounter,
        userData: window.userData ? { ...window.userData } : null,
        activeSummons: window.activeSummons ? [...window.activeSummons] : [],
        activeWalls: window.activeWalls ? [...(window.activeWalls || [])] : []
    };
}

/**
 * Восстановить глобальное состояние боя
 */
function restoreGlobalBattleState(state) {
    if (!state) return;

    window.playerFormation = state.playerFormation;
    window.enemyFormation = state.enemyFormation;
    window.playerWizards = state.playerWizards;
    window.enemyWizards = state.enemyWizards;
    window.battleState = state.battleState;
    window.battleLog = state.battleLog;
    window.battleInterval = state.battleInterval;
    window.selectedOpponent = state.selectedOpponent;
    window.isDuelBattle = state.isDuelBattle;
    window.isPvEBattle = state.isPvEBattle;
    window.isBossBattle = state.isBossBattle;
    window.isTrainingDummyBattle = state.isTrainingDummyBattle;
    window.isPlayerAttacker = state.isPlayerAttacker;
    window.globalTurnCounter = state.globalTurnCounter;
    window.userData = state.userData;
    window.activeSummons = state.activeSummons;
    window.activeWalls = state.activeWalls;
}

/**
 * Мокаем функции рендеринга (PIXI, анимации, UI)
 */
function mockRenderingFunctions() {
    const originals = {
        renderBattleField: window.renderBattleField,
        updateBattleField: window.updateBattleField,
        showBattleResult: window.showBattleResult,
        showArenaResult: window.showArenaResult,
        showDamageNumber: window.showDamageNumber,
        showHealNumber: window.showHealNumber,
        setWeatherDisplay: window.setWeatherDisplay,
        showBattleField: window.showBattleField,
        // Анимации
        animateSpell: window.animateSpell,
        playSpellAnimation: window.playSpellAnimation,
        playImpactAnimation: window.playImpactAnimation,
        showFloatingText: window.showFloatingText,
        updateHealthBars: window.updateHealthBars,
        // Призывы visual
        addSummonSprite: window.addSummonSprite,
        removeSummonSprite: window.removeSummonSprite,
        // Стены visual
        addWallSprite: window.addWallSprite,
        removeWallSprite: window.removeWallSprite,
        updateWallSprite: window.updateWallSprite,
        // Speed controller
        battleSpeedController: window.battleSpeedController
    };

    // Заменяем на пустые функции
    const noop = () => {};
    const noopAsync = async () => {};
    const noopReturn = () => ({ then: (cb) => cb?.() });

    window.renderBattleField = noop;
    window.updateBattleField = noop;
    window.showBattleResult = noop;
    window.showArenaResult = noop;
    window.showDamageNumber = noop;
    window.showHealNumber = noop;
    window.setWeatherDisplay = noop;
    window.animateSpell = noopAsync;
    window.playSpellAnimation = noopAsync;
    window.playImpactAnimation = noop;
    window.showFloatingText = noop;
    window.updateHealthBars = noop;
    window.addSummonSprite = noop;
    window.removeSummonSprite = noop;
    window.addWallSprite = noop;
    window.removeWallSprite = noop;
    window.updateWallSprite = noop;
    window.battleSpeedController = null;

    // battleTimeout — используем мгновенный setTimeout для headless
    window.battleTimeout = (fn, delay) => {
        fn();
        return 0;
    };

    return {
        restore: () => {
            Object.entries(originals).forEach(([key, value]) => {
                if (value !== undefined) {
                    window[key] = value;
                }
            });
            delete window.battleTimeout;
        }
    };
}

// Экспорт
window.runHeadlessBattle = runHeadlessBattle;

console.log('🏟️ Headless Battle Runner загружен');
