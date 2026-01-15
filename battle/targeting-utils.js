
// --- Поиск цели для атаки ---
// Третий параметр caster опционален - используется для проверки ослепления
function findTarget(position, attackerType, caster = null) {
    // 👁️ Проверяем ослепление кастера (Сияние солнца)
    // Если ослеплён и blindedTargetPosition установлен - используем случайную позицию
    const actualCaster = caster || window.currentSpellCaster?.wizard;
    if (actualCaster && actualCaster.blindedTargetPosition !== undefined) {
        position = actualCaster.blindedTargetPosition;
    }

    if (attackerType === 'player') {
        for (let i = 0; i < 5; i++) {
            const targetPosition = (position + i) % 5;
            const targetWizard = window.enemyFormation[targetPosition];
            if (targetWizard && targetWizard.hp > 0) {
                return { wizard: targetWizard, position: targetPosition };
            }
        }
    } else {
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
    return null;
}

/// --- Поиск случайной цели (только маги) ---
function findRandomTarget(casterType) {
    const combatTarget = findRandomCombatTarget(casterType);
    if (!combatTarget) return null;
    
    // Фильтруем только магов
    if (combatTarget.type === 'wizard') {
        return { wizard: combatTarget.wizard, position: combatTarget.position };
    }
    
    // Если попался призванный — ищем заново (максимум 10 попыток)
    for (let i = 0; i < 10; i++) {
        const nextTarget = findRandomCombatTarget(casterType);
        if (nextTarget && nextTarget.type === 'wizard') {
            return { wizard: nextTarget.wizard, position: nextTarget.position };
        }
    }
    
    // Если не нашли мага — возвращаем null
    return null;
}

// --- Поиск случайной боевой цели (маги + призванные) ---
function findRandomCombatTarget(casterType) {
    const targets = [];
    
    // Добавляем магов
    if (casterType === 'player') {
        window.enemyFormation.forEach((wizard, index) => {
            if (wizard && wizard.hp > 0) {
                targets.push({ wizard, position: index, type: 'wizard' });
            }
        });
    } else {
        window.playerFormation.forEach((wizardId, index) => {
            if (wizardId) {
                const wizard = window.playerWizards.find(w => w.id === wizardId);
                if (wizard && wizard.hp > 0) {
                    targets.push({ wizard, position: index, type: 'wizard' });
                }
            }
        });
    }
    
    // Добавляем призванных
    const summonColumns = casterType === 'player' ? [1] : [4]; // колонки призванных противника
    for (const col of summonColumns) {
        for (let row = 0; row < 5; row++) {
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(col, row);
                if (summoned && summoned.hp > 0) {
                    targets.push({ wizard: summoned, position: row, type: 'summoned' });
                }
            }
        }
    }
    
    if (targets.length === 0) return null;
    
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    return randomTarget;
}

// --- Поиск цели в конкретной позиции ---
function findTargetAtPosition(position, casterType) {
    if (casterType === 'player') {
        const targetWizard = window.enemyFormation[position];
        if (targetWizard && targetWizard.hp > 0) {
            return { wizard: targetWizard, position: position };
        }
    } else {
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

// --- Универсальный поиск по паттерну (для stone_spike и будущих заклинаний) ---
function findTargetsInPattern(centerPosition, casterType, pattern) {
    const targets = [];
    
    // Основная цель — всегда первая
    const mainTarget = findTarget(centerPosition, casterType);
    if (!mainTarget) return [];
    
    targets.push({ target: mainTarget, direction: 'main' });
    
    // Применяем паттерн
    pattern.forEach(({ rowOffset, colOffset, direction }) => {
        const targetRow = (mainTarget.position + rowOffset + 5) % 5;
        const targetCol = colOffset; // колонка относительно цели
        
        let target = null;
        
        // Если колонка — это колонка магов (0 или 5)
        if (targetCol === 0 || targetCol === 5) {
            target = findTargetAtPosition(targetRow, casterType);
        } 
        // Если колонка — это стена (2 или 3)
        else if (targetCol === 2 || targetCol === 3) {
            const wall = typeof window.findEarthWallAt === 'function' ? 
                window.findEarthWallAt(targetCol, targetRow) : null;
            if (wall && wall.hp > 0) {
                target = { wizard: { ...wall, type: 'earth_wall_hp' }, position: targetRow };
            }
        }
        // Если колонка — призванные (1 или 4)
        else if (targetCol === 1 || targetCol === 4) {
            const summoned = typeof window.findSummonedCreatureAt === 'function' ? 
                window.findSummonedCreatureAt(targetCol, targetRow) : null;
            if (summoned && summoned.hp > 0) {
                target = { wizard: summoned, position: targetRow };
            }
        }
        
        targets.push({ target, direction });
    });
    
    return targets;
}

// --- Специфичный хелпер для stone_spike (для обратной совместимости) ---
function findStoneSpikeTargets(mainPosition, casterType, spikeCount, level) {
    const pattern = [];
    
    if (level <= 4) {
        pattern.push({ rowOffset: -1, colOffset: 0, direction: 'up' });    // вверх
        pattern.push({ rowOffset: 1, colOffset: 0, direction: 'down' });     // вниз
        pattern.push({ rowOffset: 0, colOffset: casterType === 'player' ? 1 : 4, direction: 'right' }); // вправо
    } else {
        pattern.push({ rowOffset: -1, colOffset: 0, direction: 'up1' });    // вверх1
        pattern.push({ rowOffset: -2, colOffset: 0, direction: 'up2' });    // вверх2
        pattern.push({ rowOffset: 1, colOffset: 0, direction: 'down1' });   // вниз1
        pattern.push({ rowOffset: 2, colOffset: 0, direction: 'down2' });   // вниз2
        pattern.push({ rowOffset: 0, colOffset: casterType === 'player' ? 1 : 4, direction: 'right1' }); // вправо1
        pattern.push({ rowOffset: 0, colOffset: casterType === 'player' ? 2 : 3, direction: 'right2' }); // вправо2
    }
    
    return findTargetsInPattern(mainPosition, casterType, pattern);
}

// --- Поиск случайной клетки на территории противника ---
function findRandomCellOnEnemyTerritory(casterType) {
    const columns = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
    const allCells = [];
    
    for (const col of columns) {
        for (let row = 0; row < 5; row++) {
            allCells.push({ col, row });
        }
    }
    
    if (allCells.length === 0) return null;
    
    return allCells[Math.floor(Math.random() * allCells.length)];
}

// --- Поиск всех живых целей в указанных колонках ---
function findAllTargetsInColumns(columns, casterType) {
    const targets = [];
    
    for (const col of columns) {
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
            // Колонка призванных
            else if (col === 1 || col === 4) {
                if (typeof window.findSummonedCreatureAt === 'function') {
                    const summoned = window.findSummonedCreatureAt(col, row);
                    if (summoned && summoned.hp > 0) {
                        targetWizard = summoned;
                        isSummoned = true;
                    }
                }
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

// --- Поиск цели по ID мага ---
function findTargetById(targetId, casterType) {
    if (!targetId) return null;

    if (casterType === 'player') {
        // Игрок атакует противника - ищем среди врагов
        for (let i = 0; i < 5; i++) {
            const enemy = window.enemyFormation[i];
            if (enemy && enemy.id === targetId && enemy.hp > 0) {
                return { wizard: enemy, position: i };
            }
        }
    } else {
        // Враг атакует игрока - ищем среди игроков
        for (let i = 0; i < 5; i++) {
            const wizardId = window.playerFormation[i];
            if (wizardId) {
                const wizard = window.playerWizards.find(w => w.id === wizardId);
                if (wizard && wizard.id === targetId && wizard.hp > 0) {
                    return { wizard: wizard, position: i };
                }
            }
        }
    }

    return null;
}

// Экспорт
window.findTarget = findTarget;
window.findRandomTarget = findRandomTarget;
window.findTargetById = findTargetById;
window.findTargetAtPosition = findTargetAtPosition;
window.findTargetsInPattern = findTargetsInPattern;
window.findStoneSpikeTargets = findStoneSpikeTargets; // Для обратной совместимости
window.findRandomCombatTarget = findRandomCombatTarget;
window.findRandomCellOnEnemyTerritory = findRandomCellOnEnemyTerritory;
window.findAllTargetsInColumns = findAllTargetsInColumns;