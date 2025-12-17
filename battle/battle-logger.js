// battle/battle-logger.js - Детальное логирование боя

// Детальный лог боя
let detailedBattleLog = {
    startTime: null,
    endTime: null,
    events: [],
    finalState: null,
    result: null
};

// Инициализация нового лога боя
function initBattleLogger() {
    detailedBattleLog = {
        startTime: new Date().toISOString(),
        endTime: null,
        events: [],
        finalState: null,
        result: null,
        playerFormation: JSON.parse(JSON.stringify(window.playerFormation || [])),
        enemyFormation: JSON.parse(JSON.stringify(window.enemyFormation?.map(w => w ? {
            id: w.id,
            name: w.name,
            hp: w.hp,
            max_hp: w.max_hp,
            faction: w.faction
        } : null) || []))
    };
}

// Запись события в лог
function logBattleEvent(eventType, data) {
    const event = {
        timestamp: Date.now(),
        relativeTime: detailedBattleLog.startTime ? Date.now() - new Date(detailedBattleLog.startTime).getTime() : 0,
        type: eventType,
        data: JSON.parse(JSON.stringify(data)) // Deep copy
    };

    detailedBattleLog.events.push(event);
}

// Логирование начала хода
function logTurnStart(casterType, wizard, position) {
    logBattleEvent('TURN_START', {
        casterType: casterType,
        wizardId: wizard.id,
        wizardName: wizard.name,
        position: position,
        hp: wizard.hp,
        maxHp: wizard.max_hp,
        effects: wizard.effects || {}
    });
}

// Логирование урона
function logDamage(source, target, damage, damageType) {
    logBattleEvent('DAMAGE', {
        source: source,
        targetId: target.id,
        targetName: target.name,
        damage: damage,
        damageType: damageType,
        hpBefore: target.hp + damage,
        hpAfter: target.hp,
        isDead: target.hp <= 0
    });
}

// Логирование применения эффекта
function logEffectApplied(target, effectType, effectData) {
    logBattleEvent('EFFECT_APPLIED', {
        targetId: target.id,
        targetName: target.name,
        effectType: effectType,
        effectData: effectData
    });
}

// Логирование DoT урона
function logDotDamage(target, dotType, damage, stacks) {
    logBattleEvent('DOT_DAMAGE', {
        targetId: target.id,
        targetName: target.name,
        dotType: dotType,
        damage: damage,
        stacks: stacks,
        hpBefore: target.hp + damage,
        hpAfter: target.hp,
        isDead: target.hp <= 0
    });
}

// Логирование использования заклинания
function logSpellCast(caster, spell, targets) {
    logBattleEvent('SPELL_CAST', {
        casterId: caster.id,
        casterName: caster.name,
        casterHp: caster.hp,
        spell: spell,
        targets: Array.isArray(targets) ? targets.map(t => ({
            id: t?.id,
            name: t?.name,
            hp: t?.hp
        })) : (targets ? { id: targets.id, name: targets.name, hp: targets.hp } : null)
    });
}

// Логирование смерти
function logDeath(wizard, casterType, reason) {
    logBattleEvent('WIZARD_DEATH', {
        wizardId: wizard.id,
        wizardName: wizard.name,
        casterType: casterType,
        reason: reason,
        effects: wizard.effects || {}
    });
}

// Логирование пропуска хода
function logTurnSkipped(wizard, reason) {
    logBattleEvent('TURN_SKIPPED', {
        wizardId: wizard.id,
        wizardName: wizard.name,
        reason: reason,
        hp: wizard.hp
    });
}

// Логирование проверки конца боя
function logBattleEndCheck(playerAlive, enemyAlive, playerCount, enemyCount) {
    logBattleEvent('BATTLE_END_CHECK', {
        playerAlive: playerAlive,
        enemyAlive: enemyAlive,
        playerAliveCount: playerCount,
        enemyAliveCount: enemyCount,
        playerWizards: window.playerFormation?.map((id, index) => {
            if (!id) return null;
            const wizard = window.playerWizards?.find(w => w.id === id);
            return wizard ? {
                position: index,
                id: wizard.id,
                name: wizard.name,
                hp: wizard.hp,
                maxHp: wizard.max_hp,
                isDead: wizard.hp <= 0
            } : null;
        }).filter(w => w !== null),
        enemyWizards: window.enemyFormation?.map((wizard, index) => {
            if (!wizard) return null;
            return {
                position: index,
                id: wizard.id,
                name: wizard.name,
                hp: wizard.hp,
                maxHp: wizard.max_hp,
                isDead: wizard.hp <= 0
            };
        }).filter(w => w !== null)
    });
}

// Логирование конца боя
function logBattleEnd(result, playerAlive, enemyAlive) {
    detailedBattleLog.endTime = new Date().toISOString();
    detailedBattleLog.result = result;

    logBattleEvent('BATTLE_END', {
        result: result,
        playerAlive: playerAlive,
        enemyAlive: enemyAlive
    });

    // Финальное состояние
    detailedBattleLog.finalState = {
        playerWizards: window.playerFormation?.map((id, index) => {
            if (!id) return null;
            const wizard = window.playerWizards?.find(w => w.id === id);
            return wizard ? {
                position: index,
                id: wizard.id,
                name: wizard.name,
                hp: wizard.hp,
                maxHp: wizard.max_hp,
                effects: wizard.effects || {}
            } : null;
        }),
        enemyWizards: window.enemyFormation?.map((wizard, index) => {
            if (!wizard) return null;
            return {
                position: index,
                id: wizard.id,
                name: wizard.name,
                hp: wizard.hp,
                maxHp: wizard.max_hp,
                effects: wizard.effects || {}
            };
        })
    };

    // Автоматически сохраняем лог
    // saveBattleLog(); // ОТКЛЮЧЕНО - не скачиваем JSON файл автоматически
}

// Сохранение лога в файл
function saveBattleLog() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `battle-log-${timestamp}.json`;

        // Красиво форматируем JSON
        const logJson = JSON.stringify(detailedBattleLog, null, 2);

        // Создаем Blob и скачиваем
        const blob = new Blob([logJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);


        // Также сохраняем в localStorage для быстрого доступа
        try {
            localStorage.setItem('lastBattleLog', logJson);
        } catch (e) {
            console.warn('Не удалось сохранить в localStorage:', e);
        }

    } catch (error) {
        console.error('❌ Ошибка сохранения лога:', error);
    }
}

// Получить последний лог из localStorage
function getLastBattleLog() {
    try {
        const log = localStorage.getItem('lastBattleLog');
        return log ? JSON.parse(log) : null;
    } catch (e) {
        console.error('Ошибка чтения лога:', e);
        return null;
    }
}

// Анализ лога для поиска проблем
function analyzeBattleLog() {
    const log = getLastBattleLog();
    if (!log) {
        console.log('❌ Нет сохраненного лога боя');
        return;
    }

    console.log('📊 АНАЛИЗ БОЯ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Начало: ${log.startTime}`);
    console.log(`Конец: ${log.endTime}`);
    console.log(`Результат: ${log.result}`);
    console.log(`Всего событий: ${log.events.length}`);
    console.log('');

    // Группируем события по типам
    const eventTypes = {};
    log.events.forEach(event => {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    console.log('📈 События по типам:');
    Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log('');

    // Смерти
    const deaths = log.events.filter(e => e.type === 'WIZARD_DEATH');
    console.log('💀 Смерти магов:');
    deaths.forEach((death, index) => {
        console.log(`  ${index + 1}. ${death.data.wizardName} (${death.data.casterType}) - ${death.data.reason}`);
        console.log(`     Время: ${death.relativeTime}ms`);
    });
    console.log('');

    // Проверки конца боя
    const endChecks = log.events.filter(e => e.type === 'BATTLE_END_CHECK');
    console.log(`🔍 Проверок конца боя: ${endChecks.length}`);
    if (endChecks.length > 0) {
        const lastCheck = endChecks[endChecks.length - 1];
        console.log('Последняя проверка:');
        console.log(`  Player alive: ${lastCheck.data.playerAlive} (${lastCheck.data.playerAliveCount} магов)`);
        console.log(`  Enemy alive: ${lastCheck.data.enemyAlive} (${lastCheck.data.enemyAliveCount} магов)`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return log;
}

// Экспорт функций
window.battleLogger = {
    init: initBattleLogger,
    logEvent: logBattleEvent,
    logTurnStart: logTurnStart,
    logDamage: logDamage,
    logEffectApplied: logEffectApplied,
    logDotDamage: logDotDamage,
    logSpellCast: logSpellCast,
    logDeath: logDeath,
    logTurnSkipped: logTurnSkipped,
    logBattleEndCheck: logBattleEndCheck,
    logBattleEnd: logBattleEnd,
    save: saveBattleLog,
    getLast: getLastBattleLog,
    analyze: analyzeBattleLog,
    current: detailedBattleLog
};

