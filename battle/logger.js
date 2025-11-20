console.log('✅ battle/systems/logger.js загружен');


const MAX_LOG_ENTRIES = 3000; // Максимум записей в логе (увеличено с 1000)
const LOG_ROTATION_SIZE = 100;

// Глобальные переменные для отслеживания ходов
window.battleTurnCounter = 0;
window.currentTurnWizard = null;
window.battleRoundCounter = 1;
window.battleStartTime = null;

// --- Универсальная функция добавления записи в лог ---
function addToBattleLog(message) {
    if (Array.isArray(window.battleLog)) {
        window.battleLog.push(message);

        // Ротация лога при переполнении
        if (window.battleLog.length > MAX_LOG_ENTRIES) {
            // Сохраняем важные записи начала боя
            const importantEntries = window.battleLog.slice(0, 10); // первые 10 записей
            const recentEntries = window.battleLog.slice(-2500); // последние 2500 записей (увеличено с 800)
            window.battleLog = [...importantEntries, '... [записи удалены для экономии памяти] ...', ...recentEntries];
        }
        
        console.log(message);
    } else {
        console.log('[LOG]', message);
    }
}

// --- Улучшенная функция с отступами для действий в ходе ---
function addToBattleLogWithIndent(message, useIndent = true) {
    let formattedMessage = message;
    
    // Добавляем отступ для обычных действий внутри хода
    if (useIndent && window.currentTurnWizard && 
        !message.includes('═══') && !message.includes('---') && !message.includes('🏺')) {
        formattedMessage = `  ${message}`;
    }
    
    addToBattleLog(formattedMessage);
}

// --- Начать новый ход ---
function startWizardTurn(wizard, casterType) {
    window.battleTurnCounter++;
    window.currentTurnWizard = {
        wizard: wizard,
        type: casterType,
        turnNumber: window.battleTurnCounter,
        startTime: Date.now()
    };
    
    const casterSymbol = casterType === 'player' ? '🧙‍♂️' : '🔮';
    const wizardName = wizard.name || 'Неизвестный маг';
    
    // Логируем начало хода
    addToBattleLog(`\n═══ ХОД ${window.battleTurnCounter} ═══ ${casterSymbol} ${wizardName} (${wizard.hp}/${wizard.max_hp} HP) ═══`);
    
    // Обрабатываем урон от яда в НАЧАЛЕ хода
    if (typeof window.processPoisonDamage === 'function') {
        const poisonDamage = window.processPoisonDamage(casterType);
        if (poisonDamage > 0) {
            addToBattleLogWithIndent(`☠️ Урон от ядов в начале хода: ${poisonDamage}`);
        }
    }
    
    // Возвращаем true, если ход нужно пропустить
    return processStartOfTurnEffects(wizard, casterType);
}

// --- Закончить ход ---
function endWizardTurn() {
    if (!window.currentTurnWizard) return;
    
    const duration = Date.now() - window.currentTurnWizard.startTime;
    const wizardName = window.currentTurnWizard.wizard.name || 'Неизвестный маг';
    
    processEndOfTurnEffects(window.currentTurnWizard.wizard, window.currentTurnWizard.type);
    
    addToBattleLog(`--- Конец хода ${window.battleTurnCounter} (${wizardName}, ${duration}мс) ---\n`);
    
    window.currentTurnWizard = null;
}

// --- Обработка эффектов начала хода ---
function processStartOfTurnEffects(wizard, casterType) {
    let skipTurn = false;
    
    // Проверяем заморозку
    if (wizard.effects?.frozen) {
        addToBattleLogWithIndent(`🧊 ${wizard.name} заморожен и пропускает ход`);
        delete wizard.effects.frozen;
        skipTurn = true;
    }
    
    // Обрабатываем горение
    if (wizard.effects?.burning) {
        const burnDamage = wizard.effects.burning.damage || 5;
        wizard.hp = Math.max(0, wizard.hp - burnDamage);
        
        addToBattleLogWithIndent(`🔥 ${wizard.name} получает ${burnDamage} урона от горения (${wizard.hp}/${wizard.max_hp})`);
        
        wizard.effects.burning.turns--;
        if (wizard.effects.burning.turns <= 0) {
            delete wizard.effects.burning;
            addToBattleLogWithIndent(`💧 Горение на ${wizard.name} прекращается`);
        }
    }
    
    return skipTurn;
}

// --- Обработка эффектов конца хода ---
function processEndOfTurnEffects(wizard, casterType) {
    if (!wizard.effects) return;
    
    Object.keys(wizard.effects).forEach(effectType => {
        const effect = wizard.effects[effectType];
        if (effect.turnsLeft !== undefined) {
            effect.turnsLeft--;
            if (effect.turnsLeft <= 0) {
                delete wizard.effects[effectType];
                addToBattleLogWithIndent(`✨ Эффект ${effectType} на ${wizard.name} истекает`);
            }
        }
    });
}

// --- Логирование начала и конца боя ---
function logBattleStart(playerTeam, enemyTeam) {
    addToBattleLog(`\n🏺 ═══ НАЧАЛО БОЯ ═══ 🏺`);
    addToBattleLog(`⚔️ Команда игрока: ${playerTeam.map(w => w.name).join(', ')}`);
    addToBattleLog(`🛡️ Команда противника: ${enemyTeam.map(w => w.name).join(', ')}`);
    addToBattleLog(`═══════════════════════════════\n`);
    
    // Сброс счетчиков
    window.battleTurnCounter = 0;
    window.battleRoundCounter = 1;
    window.currentTurnWizard = null;
    window.battleStartTime = Date.now();
}

function logBattleEnd(winner, totalTurns = window.battleTurnCounter, duration = Date.now() - (window.battleStartTime || 0)) {
    addToBattleLog(`\n🏆 ═══ КОНЕЦ БОЯ ═══ 🏆`);
    addToBattleLog(`👑 Победитель: ${winner}`);
    addToBattleLog(`📊 Статистика:`);
    addToBattleLog(`   • Всего ходов: ${totalTurns}`);
    addToBattleLog(`   • Раундов: ${window.battleRoundCounter}`);
    addToBattleLog(`   • Длительность: ${Math.round(duration / 1000)} сек`);
    
    if (totalTurns > 0) {
        addToBattleLog(`   • Средняя длительность хода: ${Math.round(duration / totalTurns)}мс`);
    }
    
    // Статистика эффектов
    if (typeof window.showPoisonStats === 'function') {
        window.showPoisonStats();
    }
    
    addToBattleLog(`═══════════════════════════════`);
}

// --- Логирование попадания заклинания (с отступами) ---
function logSpellHit(caster, target, damage, spellName, bonuses = []) {
    const damageDescription = `${damage} урона`;
    const bonusText = bonuses.length > 0 ? ` ${bonuses.join(' ')}` : '';
    
    const logEntry = `🎯 ${caster.name} использует ${spellName} на ${target.name} (${damageDescription}) (${target.hp}/${target.max_hp})${bonusText}`;
    addToBattleLogWithIndent(logEntry);
}

// --- Остальные функции логирования (оптимизированные) ---
function logWallBlock(wall, damage, remaining) {
    let message = `🛡️ Стена поглощает ${damage} урона`;
    if (remaining > 0) message += `, ${remaining} проходит через`;
    if (wall?.hp <= 0) message += ` (стена разрушена!)`;
    
    addToBattleLogWithIndent(message);
}

function logEffectApplied(target, effectName) {
    const effectNames = {
        'burning': 'поджигание',
        'chill': 'охлаждение', 
        'hoarFrost': 'иней',
        'freeze': 'заморозка'
    };
    
    const name = effectNames[effectName] || effectName;
    addToBattleLogWithIndent(`✨ ${target.name} подвергся эффекту: ${name}`);
}

function logMiss(direction, level) {
    const directionName = getDirectionNameSimple(direction, level);
    addToBattleLogWithIndent(`❌ Шип ${directionName} → пусто`);
}

// ПРИМЕЧАНИЕ: logProtectionResult перенесена в multi-layer-protection.js
// Там используется полная версия с деталями (сопротивление, броня, _lastDamageSteps)

// --- Получить статистику боя ---
function getBattleStatistics() {
    return {
        totalTurns: window.battleTurnCounter,
        currentRound: window.battleRoundCounter,
        currentTurn: window.currentTurnWizard,
        logEntries: window.battleLog?.length || 0,
        battleDuration: window.battleStartTime ? Date.now() - window.battleStartTime : 0
    };
}

// --- Вспомогательная функция направлений ---
function getDirectionNameSimple(direction, level) {
    const map = {
        'main': 'в цель',
        'up': 'вверх',
        'down': 'вниз', 
        'right': 'вправо',
        'left': 'влево',
        'up1': 'вверх 1',
        'up2': 'вверх 2',
        'down1': 'вниз 1',
        'down2': 'вниз 2',
        'right1': 'вправо 1',
        'right2': 'вправо 2',
        'left1': 'влево 1',
        'left2': 'влево 2'
    };
    return map[direction] || direction;
}
// Функция для детального логирования расчета урона
function logDamageCalculation(baseDamage, modifiers = {}) {
    if (!window.currentTurnWizard) return;
    
    let message = `📊 Расчет урона: Базовый ${baseDamage}`;
    let currentDamage = baseDamage;
    
    // Погода
    if (modifiers.weather) {
        currentDamage = modifiers.weather.value;
        message += ` → ${currentDamage} (погода +${modifiers.weather.percent}%)`;
    }
    
    // Метеокинез
    if (modifiers.meteorokinesis) {
        currentDamage = modifiers.meteorokinesis.value;
        message += ` → ${currentDamage} (Метеокинез +${modifiers.meteorokinesis.percent}%)`;
    }
    
    // Уровень мага
    if (modifiers.level) {
        currentDamage = modifiers.level.value;
        message += ` → ${currentDamage} (уровень ×${modifiers.level.multiplier})`;
    }
    
    // Башня магов
    if (modifiers.tower) {
        currentDamage = modifiers.tower.value;
        message += ` → ${currentDamage} (Башня ×${modifiers.tower.multiplier})`;
    }
    
    // Сопротивление
    if (modifiers.resistance) {
        currentDamage = modifiers.resistance.value;
        message += ` → ${currentDamage} (сопротивление -${modifiers.resistance.percent}%)`;
    }
    
    // Броня
    if (modifiers.armor) {
        currentDamage = modifiers.armor.value;
        message += ` → ${currentDamage} (броня ${modifiers.armor.reduction > 0 ? '-' : '+'}${Math.abs(modifiers.armor.reduction)}%)`;
    }
    
    message += ` = ${currentDamage} итоговый урон`;
    
    addToBattleLogWithIndent(message);
}

// Экспорт
window.logDamageCalculation = logDamageCalculation;
window.addToBattleLog = addToBattleLog;
window.addToBattleLogWithIndent = addToBattleLogWithIndent;
window.startWizardTurn = startWizardTurn;
window.endWizardTurn = endWizardTurn;
window.logBattleStart = logBattleStart;
window.logBattleEnd = logBattleEnd;
window.logSpellHit = logSpellHit;
window.logWallBlock = logWallBlock;
window.logEffectApplied = logEffectApplied;
window.logMiss = logMiss;
// window.logProtectionResult экспортируется из multi-layer-protection.js (полная версия с деталями)
window.getBattleStatistics = getBattleStatistics;
window.processStartOfTurnEffects = processStartOfTurnEffects;
window.processEndOfTurnEffects = processEndOfTurnEffects;
window.getDirectionNameSimple = getDirectionNameSimple;

console.log('🎯 Оптимизированная система логирования готова (счетчики ходов + отступы)');