// battle/targeting.js - Система поиска целей

// --- Поиск цели для атаки ---
// caster - маг-кастер (для проверки ослепления)
function findTarget(position, attackerType, caster = null) {
    // Получаем кастера для проверки ослепления
    const actualCaster = caster || window.currentSpellCaster?.wizard;

    // 👁️ Проверка ослепления - если кастер ослеплён, бьём в случайную клетку
    if (actualCaster && actualCaster._blindedTargetPosition !== undefined) {
        const { col, row } = actualCaster._blindedTargetPosition;

        console.log(`👁️ BLINDED HIT: col=${col}, row=${row}`);

        // Колонка 0: вражеские маги
        if (col === 0) {
            const targetWizard = window.enemyFormation[row];
            if (targetWizard && targetWizard.hp > 0) {
                return { wizard: targetWizard, position: row };
            }
        }
        // Колонка 5: маги игрока
        else if (col === 5) {
            const wizardId = window.playerFormation[row];
            if (wizardId) {
                const targetWizard = window.playerWizards.find(w => w.id === wizardId);
                if (targetWizard && targetWizard.hp > 0) {
                    return { wizard: targetWizard, position: row, isFriendlyFire: attackerType === 'player' };
                }
            }
        }
        // Колонки 1 и 4: призванные существа
        else if (col === 1 || col === 4) {
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(col, row);
                if (summoned && summoned.hp > 0) {
                    const isFriendly = (attackerType === 'player' && col === 4) || (attackerType === 'enemy' && col === 1);
                    return { wizard: summoned, position: row, isSummoned: true, isFriendlyFire: isFriendly };
                }
            }
        }
        // Колонки 2 и 3: стены
        else if (col === 2 || col === 3) {
            if (typeof window.findEarthWallAt === 'function') {
                const wall = window.findEarthWallAt(col, row);
                if (wall && wall.hp > 0) {
                    return { wizard: { ...wall, type: 'earth_wall_hp' }, position: row };
                }
            }
        }

        // Клетка пуста — возвращаем виртуальную цель для анимации промаха
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`❌ Промах! Клетка [${col},${row + 1}] пуста`);
        }
        // Возвращаем виртуальную "цель" чтобы снаряд всё равно полетел
        return {
            wizard: { name: 'Промах', hp: 0, max_hp: 0 },
            position: row,
            isBlindedMiss: true,
            blindedCol: col,
            blindedRow: row
        };
    }

    // === Обычный поиск цели ===
    // attackerType: 'player' или 'enemy'
    if (attackerType === 'player') {
        // Игрок атакует противника
        // Начинаем с той же позиции
        for (let i = 0; i < 5; i++) {
            const targetPosition = (position + i) % 5;
            const targetWizard = window.enemyFormation[targetPosition];
            if (targetWizard && targetWizard.hp > 0) {
                return { wizard: targetWizard, position: targetPosition };
            }
        }
    } else {
        // Противник атакует игрока
        // Начинаем с той же позиции
        for (let i = 0; i < 5; i++) {
            const targetPosition = (position + i) % 5;
            const wizardId = window.playerFormation[targetPosition];
            if (wizardId) {
                const targetWizard = window.playerWizards.find(w => w.id === wizardId);
                if (targetWizard && targetWizard.hp > 0) {
                    return { wizard: targetWizard, position: targetPosition };
                }
            }
        }
    }
    return null; // Цель не найдена
}

// --- Поиск случайной цели ---
function findRandomTarget(casterType) {
    if (casterType === 'player') {
        // Игрок атакует противника - ищем случайного живого противника
        const aliveEnemies = window.enemyFormation
            .map((wizard, index) => ({ wizard, index }))
            .filter(item => item.wizard && item.wizard.hp > 0);
        if (aliveEnemies.length > 0) {
            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            return { wizard: randomEnemy.wizard, position: randomEnemy.index };
        }
    } else {
        // Противник атакует игрока - ищем случайного живого игрока
        const alivePlayers = window.playerFormation
            .map((wizardId, index) => {
                if (wizardId) {
                    const wizard = window.playerWizards.find(w => w.id === wizardId);
                    if (wizard && wizard.hp > 0) {
                        return { wizard, index };
                    }
                }
                return null;
            })
            .filter(item => item !== null);
        if (alivePlayers.length > 0) {
            const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            return { wizard: randomPlayer.wizard, position: randomPlayer.index };
        }
    }
    return null;
}

// --- Поиск цели в конкретной позиции ---
function findTargetAtPosition(position, casterType) {
    if (casterType === 'player') {
        // Игрок атакует противника
        const targetWizard = window.enemyFormation[position];
        if (targetWizard && targetWizard.hp > 0) {
            return { wizard: targetWizard, position: position };
        }
    } else {
        // Противник атакует игрока
        const wizardId = window.playerFormation[position];
        if (wizardId) {
            const targetWizard = window.playerWizards.find(w => w.id === wizardId);
            if (targetWizard && targetWizard.hp > 0) {
                return { wizard: targetWizard, position: position };
            }
        }
    }
    return null;
}

// --- Поиск цели в следующей колонке ---
function findTargetInNextColumn(rowPosition, casterType, columnOffset) {
    // Определяем текущую колонку цели в зависимости от типа кастера
    let targetColumn;
    if (casterType === 'player') {
        // Игрок атакует противника, смотрим колонки противника
        targetColumn = 0 + columnOffset; // 0 -> 1 -> 2 (противник, призванные, эффекты)
    } else {
        // Противник атакует игрока, смотрим колонки игрока
        targetColumn = 5 - columnOffset; // 5 -> 4 -> 3 (игрок, призванные, эффекты)
    }
    
    // Пока упрощенная реализация - возвращаем null для колонок призванных/эффектов
    // В будущем здесь будет поиск призванных существ и эффектов
    console.log(`🎯 Поиск цели в колонке ${targetColumn}, ряд ${rowPosition} - пока не реализовано`);
    return null;
}

// --- Поиск целей для каменных шипов ---
function findStoneSpikeTargets(mainPosition, casterType, spikeCount, level) {
    const targets = [];
    
    // Сначала находим основную цель
    const mainTarget = findTarget(mainPosition, casterType);
    if (!mainTarget) {
        // Если основной цели нет, возвращаем пустой массив
        console.log('🗿 Каменный шип: основная цель не найдена');
        return [];
    }
    
    // Добавляем основную цель
    targets.push({ target: mainTarget, direction: 'main' });
    console.log(`🗿 Каменный шип: основная цель найдена в позиции ${mainTarget.position}`);
    
    // Определяем позицию основной цели для расчета остальных шипов
    const mainTargetPosition = mainTarget.position;
    
    if (level <= 4) {
        // Уровни 1-4: 4 шипа (1 основной + 3 дополнительных)
        
        // Шип вверх (циклично)
        const upPosition = (mainTargetPosition - 1 + 5) % 5;
        const upTarget = findTargetAtPosition(upPosition, casterType);
        targets.push({ target: upTarget, direction: 'up' });
        console.log(`🗿 Шип вверх: позиция ${upPosition}, цель: ${upTarget ? upTarget.wizard.name : 'пусто'}`);
        
        // Шип вниз
        const downPosition = (mainTargetPosition + 1) % 5;
        const downTarget = findTargetAtPosition(downPosition, casterType);
        targets.push({ target: downTarget, direction: 'down' });
        console.log(`🗿 Шип вниз: позиция ${downPosition}, цель: ${downTarget ? downTarget.wizard.name : 'пусто'}`);
        
        // Шип вправо (в следующую колонку)
        const rightTarget = findTargetInNextColumn(mainTargetPosition, casterType, 1);
        targets.push({ target: rightTarget, direction: 'right' });
        console.log(`🗿 Шип вправо: следующая колонка, цель: ${rightTarget ? 'найдена' : 'пусто'}`);
        
    } else {
        // Уровень 5: 7 шипов (1 основной + 6 дополнительных)
        
        // Шипы вверх (2 шипа)
        const up1Position = (mainTargetPosition - 1 + 5) % 5;
        const up1Target = findTargetAtPosition(up1Position, casterType);
        targets.push({ target: up1Target, direction: 'up1' });
        
        const up2Position = (mainTargetPosition - 2 + 5) % 5;
        const up2Target = findTargetAtPosition(up2Position, casterType);
        targets.push({ target: up2Target, direction: 'up2' });
        
        // Шипы вниз (2 шипа)
        const down1Position = (mainTargetPosition + 1) % 5;
        const down1Target = findTargetAtPosition(down1Position, casterType);
        targets.push({ target: down1Target, direction: 'down1' });
        
        const down2Position = (mainTargetPosition + 2) % 5;
        const down2Target = findTargetAtPosition(down2Position, casterType);
        targets.push({ target: down2Target, direction: 'down2' });
        
        // Шипы вправо (2 шипа в разные колонки)
        const right1Target = findTargetInNextColumn(mainTargetPosition, casterType, 1);
        targets.push({ target: right1Target, direction: 'right1' });
        
        const right2Target = findTargetInNextColumn(mainTargetPosition, casterType, 2);
        targets.push({ target: right2Target, direction: 'right2' });
        
        console.log(`🗿 Каменный шип 5 уровня: 7 шипов, основная цель в позиции ${mainTargetPosition}`);
    }
    
    return targets;
}

// --- Получить название направления ---
function getDirectionName(direction, level) {
    const names = {
        'main': 'в цель',
        'up': 'вверх',
        'down': 'вниз', 
        'right': 'вправо',
        'left': 'влево',
        'front': 'перед целью',
        'up1': 'вверх 1',
        'up2': 'вверх 2',
        'down1': 'вниз 1',
        'down2': 'вниз 2',
        'right1': 'вправо 1',
        'right2': 'вправо 2',
        'left1': 'влево 1',
        'left2': 'влево 2',
        'front1': 'перед целью 1',
        'front2': 'перед целью 2'
    };
    return names[direction] || direction;
}

// --- Поиск всех живых целей одной стороны ---
function findAllTargetsOfType(targetType) {
    const targets = [];
    
    if (targetType === 'enemy') {
        // Ищем всех живых противников
        window.enemyFormation.forEach((wizard, index) => {
            if (wizard && wizard.hp > 0) {
                targets.push({ wizard, position: index });
            }
        });
    } else if (targetType === 'player') {
        // Ищем всех живых игроков
        window.playerFormation.forEach((wizardId, index) => {
            if (wizardId) {
                const wizard = window.playerWizards.find(w => w.id === wizardId);
                if (wizard && wizard.hp > 0) {
                    targets.push({ wizard, position: index });
                }
            }
        });
    }
    
    return targets;
}

// --- Поиск ближайшей цели ---
function findNearestTarget(fromPosition, casterType) {
    const allTargets = casterType === 'player' ? 
        findAllTargetsOfType('enemy') : 
        findAllTargetsOfType('player');
    
    if (allTargets.length === 0) return null;
    
    // Находим ближайшую цель по расстоянию на кольце (0-4)
    let nearestTarget = null;
    let minDistance = Infinity;
    
    allTargets.forEach(targetInfo => {
        const distance = Math.min(
            Math.abs(targetInfo.position - fromPosition),
            5 - Math.abs(targetInfo.position - fromPosition)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestTarget = targetInfo;
        }
    });
    
    return nearestTarget;
}

// --- Поиск цели в радиусе ---
function findTargetsInRadius(centerPosition, radius, casterType) {
    const targets = [];
    const allTargets = casterType === 'player' ? 
        findAllTargetsOfType('enemy') : 
        findAllTargetsOfType('player');
    
    allTargets.forEach(targetInfo => {
        const distance = Math.min(
            Math.abs(targetInfo.position - centerPosition),
            5 - Math.abs(targetInfo.position - centerPosition)
        );
        
        if (distance <= radius) {
            targets.push(targetInfo);
        }
    });
    
    return targets;
}
// --- Поиск целей в прямоугольной области ---
function findTargetsInArea(centerCol, centerRow, width, height, casterType, isEnemyTerritory = false) {
    const targets = [];
    
    // Если запрошена вся территория врага
    if (isEnemyTerritory) {
        const cols = casterType === 'player' ? [0, 1, 2] : [3, 4, 5]; // 3 колонки вражеской территории
        for (let col of cols) {
            for (let row = 0; row < 5; row++) {
                let targetWizard = null;
                let isSummoned = false;
                
                // Колонка магов
                if (col === 0 && casterType === 'player') {
                    targetWizard = window.enemyFormation[row];
                } else if (col === 5 && casterType === 'enemy') {
                    const wizardId = window.playerFormation[row];
                    if (wizardId) {
                        targetWizard = window.playerWizards.find(w => w.id === wizardId);
                    }
                }
                // Колонки призванных и стен
                else if (col === 1 || col === 4) {
                    if (typeof window.findSummonedCreatureAt === 'function') {
                        const summoned = window.findSummonedCreatureAt(col, row);
                        if (summoned && summoned.hp > 0) {
                            targetWizard = summoned;
                            isSummoned = true;
                        }
                    }
                }
                // Колонки эффектов/стен
                else if (col === 2 || col === 3) {
                    // Пока пропускаем — если захочешь бить по стенам, добавим
                    continue;
                }
                
                if (targetWizard && targetWizard.hp > 0) {
                    targets.push({
                        wizard: targetWizard,
                        position: row,
                        column: col,
                        isSummoned: isSummoned
                    });
                }
            }
        }
        return targets;
    }
    
    // Обычная прямоугольная область (например, 3x3)
    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);
    
    for (let offsetCol = -halfWidth; offsetCol <= halfWidth; offsetCol++) {
        const col = centerCol + offsetCol;
        // Ограничиваем колонки 0–5
        if (col < 0 || col > 5) continue;
        
        for (let offsetRow = -halfHeight; offsetRow <= halfHeight; offsetRow++) {
            // Циклический сдвиг по рядам (0–4)
            const row = (centerRow + offsetRow + 5) % 5;
            
            let targetWizard = null;
            let isSummoned = false;
            
            // Колонка магов
            if (col === 0 && casterType === 'player') {
                targetWizard = window.enemyFormation[row];
            } else if (col === 5 && casterType === 'enemy') {
                const wizardId = window.playerFormation[row];
                if (wizardId) {
                    targetWizard = window.playerWizards.find(w => w.id === wizardId);
                }
            }
            // Призванные
            else if (col === 1 || col === 4) {
                if (typeof window.findSummonedCreatureAt === 'function') {
                    const summoned = window.findSummonedCreatureAt(col, row);
                    if (summoned && summoned.hp > 0) {
                        targetWizard = summoned;
                        isSummoned = true;
                    }
                }
            }
            // Стены/эффекты — пока не цели
            else if (col === 2 || col === 3) {
                continue;
            }
            
            if (targetWizard && targetWizard.hp > 0) {
                targets.push({
                    wizard: targetWizard,
                    position: row,
                    column: col,
                    isSummoned: isSummoned
                });
            }
        }
    }
    
    return targets;
}

// Делаем функции доступными глобально
window.findTarget = findTarget;
window.findRandomTarget = findRandomTarget;
window.findTargetAtPosition = findTargetAtPosition;
window.findTargetInNextColumn = findTargetInNextColumn;
window.findStoneSpikeTargets = findStoneSpikeTargets;
window.getDirectionName = getDirectionName;
window.findAllTargetsOfType = findAllTargetsOfType;
window.findNearestTarget = findNearestTarget;
window.findTargetsInArea = findTargetsInArea;
window.findTargetsInRadius = findTargetsInRadius;