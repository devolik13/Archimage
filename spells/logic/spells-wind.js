// battle/spells/spells-wind.js - Заклинания школы ветра (адаптированная под новую структуру)


function castWindSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`🌪️ Casting wind spell: ${spellId}`);
    
    switch (spellId) {
        case 'gust':
            castGust(wizard, spellData, position, casterType);
            break;
        case 'wind_blade':
            castWindBlade(wizard, spellData, position, casterType);
            break;
        case 'wind_wall':
            castWindWall(wizard, spellData, position, casterType);
            break;
	case 'storm_cloud':
    	    castStormCloud(wizard, spellData, position, casterType);
    	    break;
	case 'ball_lightning':
	    castBallLightning(wizard, spellData, position, casterType);
	    break;
        default:
            console.log(`⚠️ Заклинание ветра ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Порыв ветра (Gust) - Тир 1, Single Target ---
// НОВАЯ ВЕРСИЯ с правильной визуализацией через слои защиты
function castGust(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [8, 12, 16, 20, 25][level - 1] || 8;

    console.log(`💨 Casting Gust - Level ${level}, Damage ${baseDamage}`);
    
    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }
    
    // Проверяем доступность новой системы
    if (!window.castSingleTargetSpell) {
        console.warn('⚠️ Single-target система не загружена, используем старую версию');
        return castGustOld(wizard, spellData, position, casterType, target);
    }
    
    // Рассчитываем бонусы ЗАРАНЕЕ
    let totalMultiplier = 1.0;
    let bonusMessages = [];

    // Создаём casterInfo для баббла
    const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };

    if (wizard.faction === 'wind' && window.checkFactionDoubleDamage) {
        const isFactionDouble = window.checkFactionDoubleDamage(wizard.faction, 'wind', casterInfo);
        if (isFactionDouble) {
            totalMultiplier *= 2.0;
            bonusMessages.push('💨 Двойной урон!');
        }
    }

    if (level === 5 && window.checkCriticalHit) {
        const isCritical = window.checkCriticalHit(50);
        if (isCritical) {
            totalMultiplier *= 1.5;
            bonusMessages.push('⚡ Крит!');
        }
    }

    // Логируем бонусы
    if (bonusMessages.length > 0 && typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`   ${bonusMessages.join(' ')}`);
    }
    
    const finalBaseDamage = Math.round(baseDamage * totalMultiplier);
    
    // Запускаем через новую систему
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'gust',
        baseDamage: finalBaseDamage,
        spellLevel: level,
        
        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            
            console.log(`💨 Создаём снаряд Порыва: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);
            
            if (window.spellAnimations?.gust?.play) {
                // Передаём toCol как точку столкновения
                window.spellAnimations.gust.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    onHit: onHit
                });
            } else {
                console.warn('⚠️ Анимация gust не найдена');
                setTimeout(onHit, 300);
            }
        },
        
        // Эффектов у Gust нет
        applyEffects: null,
        
        // Callback после завершения
        onComplete: (finalResult) => {
        }
    });
}

// СТАРАЯ ВЕРСИЯ для fallback
function castGustOld(wizard, spellData, position, casterType, target) {
    const level = spellData.level || 1;
    const baseDamage = [8, 12, 16, 20, 25][level - 1] || 8;

    if (!target) {
        target = window.findTarget?.(position, casterType);
    }
    if (!target) return;

    const casterCol = casterType === 'player' ? 5 : 0;
    const targetCol = casterType === 'player' ? 0 : 5;
    
    if (window.spellAnimations?.gust?.play) {
        window.spellAnimations.gust.play({
            casterCol: casterCol,
            casterRow: position,
            targetCol: targetCol,
            targetRow: target.position,
            onHit: () => {
                applyGustDamageOld(wizard, target, baseDamage, level, casterType);
            }
        });
    } else {
        applyGustDamageOld(wizard, target, baseDamage, level, casterType);
    }
}

function applyGustDamageOld(wizard, target, baseDamage, level, casterType) {
    // Собираем бонусы
    let totalMultiplier = 1.0;
    let bonusLogDetails = [];

    // Создаём casterInfo для баббла
    const casterInfo = { faction: wizard.faction, casterType: casterType, position: target.position };

    if (wizard.faction === 'wind' && window.checkFactionDoubleDamage) {
        const isFactionDouble = window.checkFactionDoubleDamage(wizard.faction, 'wind', casterInfo);
        if (isFactionDouble) {
            totalMultiplier *= 2.0;
            bonusLogDetails.push("💨 Двойной урон!");
        }
    }

    if (level === 5 && window.checkCriticalHit) {
        const isCritical = window.checkCriticalHit(50);
        if (isCritical) {
            totalMultiplier *= 1.5;
            bonusLogDetails.push("⚡ Крит!");
        }
    }

    const finalBaseDamage = Math.round(baseDamage * totalMultiplier);

    const result = window.applyDamageWithMultiLayerProtection?.(wizard, target, finalBaseDamage, 'gust', casterType);

    if (result) {
        window.logProtectionResult?.(wizard, target, result, 'Порыв ветра');
    } else {
        const finalDamage = window.applyFinalDamage?.(wizard, target.wizard, finalBaseDamage, 'gust', 0, false) || finalBaseDamage;
        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        
        window.logSpellHit?.(wizard, target.wizard, finalDamage, 'Порыв ветра');
    }

    if (bonusLogDetails.length > 0 && window.addToBattleLog) {
        window.addToBattleLog(`   ${bonusLogDetails.join(' ')}`);
    }
}

// --- Ветрорез (Wind Blade) - Тир 2, AOE ---
function castWindBlade(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [5, 6, 7, 8, 10][level - 1] || 5;
    const rounds = level === 5 ? 2 : 1;
    
    const target = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    if (!target) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌪️ ${wizard.name} запускает Ветрорез, но цель не найдена`);
        }
        return;
    }
    
    // Фракционный бонус
    let actualDamage = baseDamage;
    const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
    if (wizard.faction === 'wind' && typeof window.checkFactionDoubleDamage === 'function') {
        const isDouble = window.checkFactionDoubleDamage(wizard.faction, 'wind', casterInfo);
        if (isDouble) {
            actualDamage = baseDamage * 2;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`   💨 Двойной урон!`);
            }
        }
    }
    
    // Применяем урон (AOE, игнорирует стены)
    const appliedDamage = window.applyFinalDamage ? 
        window.applyFinalDamage(wizard, target.wizard, actualDamage, 'wind_blade', 0, true) : actualDamage;
        
    target.wizard.hp -= appliedDamage;
    if (target.wizard.hp < 0) target.wizard.hp = 0;
    
    if (typeof window.logSpellHit === 'function') {
        window.logSpellHit(wizard, target.wizard, appliedDamage, `Ветрорез [${rounds} круг${rounds > 1 ? 'а' : ''}]`);
    }
    
    // Создаем снаряд
    if (typeof window.createWindBladeProjectile === 'function') {
    	window.createWindBladeProjectile(wizard, target, actualDamage, rounds, casterType);
    	// Передаём ВЕСЬ объект target, а не target.wizard
    } else {
        console.warn("⚠️ Функция createWindBladeProjectile не найдена. Ветрорез не будет перемещаться между целями.");
    }
}

// --- Стена ветра (Wind Wall) - Тир 3, Utility ---
function castWindWall(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const weakenPercent = [10, 15, 20, 25, 30][level - 1] || 10;
    const wallSize = level >= 3 ? (level >= 5 ? 5 : 3) : 1;
    
    // Определяем позиции для стены
    let positions = [];
    if (wallSize === 1) {
        positions = [position];
    } else if (wallSize === 3) {
        positions = [Math.max(0, position - 1), position, Math.min(4, position + 1)];
    } else if (wallSize === 5) {
        positions = [0, 1, 2, 3, 4];
    }
    
    if (typeof window.createOrUpdateWindWall === 'function') {
        window.createOrUpdateWindWall(casterType, position, wallSize, weakenPercent, level);
        
        // ДОБАВЛЯЕМ АНИМАЦИЮ
        if (window.spellAnimations?.wind_wall?.play) {
            window.spellAnimations.wind_wall.play({
                casterType: casterType,
                positions: positions,
                weakenPercent: weakenPercent,
                level: level
            });
        }
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`💨 ${wizard.name} создает Стену ветра (${wallSize} клеток, -${weakenPercent}% урона) на позиции ${position}`);
        }
    } else {
        console.error("Функция createOrUpdateWindWall не найдена.");
    }
}

// --- Грозовая туча (Storm Cloud) - Тир 4, AOE по случайным клеткам территории противника ---
function castStormCloud(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const strikeCount = [5, 6, 7, 8, 9][level - 1] || 5;
    const baseDamage = [15, 20, 25, 30, 30][level - 1] || 15;
    
    // ДОБАВЬ ЭТО В НАЧАЛО:
    if (window.spellAnimations?.storm_cloud?.play) {
        window.spellAnimations.storm_cloud.play({
            casterType: casterType,
            strikeCount: strikeCount,
            onComplete: () => {
                console.log('⛈️ Анимация Грозовой тучи завершена');
            }
        });
    }
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`⛈️ ${wizard.name} вызывает Грозовую тучу! ${strikeCount} удар${strikeCount === 1 ? '' : strikeCount < 5 ? 'а' : 'ов'} по случайным клеткам`);
    }
    
    // Определяем колонки территории противника
    const columns = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
    
    // Собираем все занятые и пустые клетки
    const occupiedCells = [];
    const emptyCells = [];
    
    for (const col of columns) {
        for (let row = 0; row < 5; row++) {
            let hasTarget = false;
            
            // Проверяем наличие цели в клетке
            if (col === 0 && casterType === 'player') {
                const enemy = window.enemyFormation[row];
                hasTarget = enemy && enemy.hp > 0;
            } else if (col === 5 && casterType === 'enemy') {
                const wizardId = window.playerFormation[row];
                if (wizardId) {
                    const playerWizard = window.playerWizards.find(w => w.id === wizardId);
                    hasTarget = playerWizard && playerWizard.hp > 0;
                }
            } else if (col === 1 || col === 4) {
                if (typeof window.findSummonedCreatureAt === 'function') {
                    const summoned = window.findSummonedCreatureAt(col, row);
                    hasTarget = summoned && summoned.hp > 0;
                }
            } else if (col === 2 || col === 3) {
                const wall = typeof window.findEarthWallAt === 'function' ? 
                    window.findEarthWallAt(col, row) : null;
                hasTarget = wall && wall.hp > 0;
            }
            
            if (hasTarget) {
                occupiedCells.push({ col, row });
            } else {
                emptyCells.push({ col, row });
            }
        }
    }
    
    // Формируем список целевых клеток
    const targetCells = [];
    
    // Первые 3 удара - приоритетно по занятым клеткам
    for (let i = 0; i < Math.min(3, strikeCount); i++) {
        if (occupiedCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * occupiedCells.length);
            targetCells.push(occupiedCells[randomIndex]);
            // Можем попасть в ту же клетку повторно, поэтому не удаляем
        } else {
            // Если целей нет, бьём в случайную клетку
            const allCells = [...occupiedCells, ...emptyCells];
            if (allCells.length > 0) {
                targetCells.push(allCells[Math.floor(Math.random() * allCells.length)]);
            }
        }
    }
    
    // Остальные удары - полностью случайные
    for (let i = 3; i < strikeCount; i++) {
        const allCells = [...occupiedCells, ...emptyCells];
        if (allCells.length > 0) {
            targetCells.push(allCells[Math.floor(Math.random() * allCells.length)]);
        }
    }
    
    // Наносим удары
    targetCells.forEach((cell, index) => {
        if (!cell) return;
        
        const { col, row } = cell;
        let targetWizard = null;
        let targetType = null;
        let isSummoned = false;
        
        // Проверяем, есть ли в клетке цель
        if (col === 0 && casterType === 'player') {
            targetWizard = window.enemyFormation[row];
            targetType = 'enemy';
        } else if (col === 5 && casterType === 'enemy') {
            const wizardId = window.playerFormation[row];
            if (wizardId) {
                targetWizard = window.playerWizards.find(w => w.id === wizardId);
                targetType = 'player';
            }
        } else if (col === 1 || col === 4) {
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(col, row);
                if (summoned && summoned.hp > 0) {
                    targetWizard = summoned;
                    isSummoned = true;
                    targetType = 'summoned';
                }
            }
        } else if (col === 2 || col === 3) {
            const wall = typeof window.findEarthWallAt === 'function' ? 
                window.findEarthWallAt(col, row) : null;
            if (wall && wall.hp > 0) {
                targetWizard = wall;
                targetType = 'wall';
            }
        }
        
        // Применяем фракционный бонус Ветра — 5% шанс двойного урона
        let actualDamage = baseDamage;
        let bonusLog = '';
        const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
        if (wizard.faction === 'wind' && typeof window.checkFactionDoubleDamage === 'function') {
            const isDouble = window.checkFactionDoubleDamage(wizard.faction, 'wind', casterInfo);
            if (isDouble) {
                actualDamage *= 2;
                bonusLog = ' 💨 Двойной урон!';
            }
        }
        
        if (targetWizard && targetWizard.hp > 0) {
            // Применяем урон
            const finalDamage = typeof window.applyFinalDamage === 'function' ? 
                window.applyFinalDamage(wizard, targetWizard, actualDamage, 'storm_cloud', 0, true) : actualDamage;
                
            if (targetType === 'wall') {
                if (typeof window.damageEarthWall === 'function') {
                    window.damageEarthWall(targetWizard.id, finalDamage);
                }
            } else {
                targetWizard.hp -= finalDamage;
                if (targetWizard.hp < 0) targetWizard.hp = 0;
            }
            
            // Логируем попадание
            const targetName = targetType === 'wall' ? 'Стена' : targetWizard.name;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`⛈️ Грозовое облако [${row}][${col}] → ${targetName} (${finalDamage} урона)${bonusLog}`);
                const damageSteps = targetWizard._lastDamageSteps || [];
                if (damageSteps.length > 0) {
                    damageSteps.forEach(step => {
                        window.addToBattleLog(`    ├─ ${step}`);
                    });
                }
                window.addToBattleLog(`    └─ HP: ${targetWizard.hp}/${targetWizard.max_hp}`);
                delete targetWizard._lastDamageSteps;
            }
            
            // На 5 уровне — 5% шанс оглушить мага
            if (level === 5 && !isSummoned && targetType !== 'wall' && Math.random() < 0.05) {
                targetWizard.isStunned = true;
                targetWizard.stunTurns = 1;
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`⚡ ${targetName} оглушён на 1 ход!`);
                }
            }
        } else {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`⛈️ Удар ${index + 1} [${row}][${col}] → пусто`);
            }
        }
    });
}


// --- Шаровая молния (Ball Lightning) - Тир 5, Цепочечное AOE по всем целям в колонках магов и призванных ---
function castBallLightning(wizard, spellData, position, casterType) {
    console.log(`⚡ [Ball Lightning] CAST START: ${wizard.name}, level=${spellData?.level}, pos=${position}, type=${casterType}`);

    const level = spellData.level || 1;
    let baseDamage, decayPercent, stunChance = 0;

    switch (level) {
        case 1: baseDamage = 30; decayPercent = 0.20; break;
        case 2: baseDamage = 35; decayPercent = 0.20; break;
        case 3: baseDamage = 40; decayPercent = 0.20; break;
        case 4: baseDamage = 50; decayPercent = 0.20; break;
        case 5: baseDamage = 50; decayPercent = 0.10; stunChance = 0.05; break;
        default: baseDamage = 30; decayPercent = 0.20;
    }

    // Определяем колонки для поиска целей
    const columns = casterType === 'player' ? [0, 1] : [5, 4]; // маги + призванные противника

    // Собираем все живые цели в этих колонках
    const targets = typeof window.findAllTargetsInColumns === 'function' ?
        window.findAllTargetsInColumns(columns, casterType) : [];

    console.log(`⚡ [Ball Lightning] Найдено целей: ${targets.length}, columns: [${columns.join(',')}]`);

    if (targets.length === 0) {
        console.log(`⚡ [Ball Lightning] НЕТ ЦЕЛЕЙ - выход`);
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⚡ ${wizard.name} использует Шаровую молнию, но цели не найдены`);
        }
        return;
    }

    // Перемешиваем цели — случайный порядок
    const shuffledTargets = [...targets].sort(() => 0.5 - Math.random());

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`⚡ ${wizard.name} вызывает Шаровую молнию! Поражает ${shuffledTargets.length} целей, урон снижается на ${Math.round(decayPercent * 100)}%`);
    }

    // ЗАПУСКАЕМ АНИМАЦИЮ (только визуальный эффект)
    if (window.spellAnimations?.ball_lightning?.play) {
        console.log('⚡ [Ball Lightning] Запуск анимации, целей:', shuffledTargets.length);
        window.spellAnimations.ball_lightning.play({
            targets: shuffledTargets,
            casterType: casterType,
            // Callback теперь не нужен для урона - урон применяется напрямую ниже
            onHitTarget: (index) => {
                console.log(`⚡ [Ball Lightning] Анимация: попадание ${index}`);
            }
        });
    }

    // ПРИМЕНЯЕМ УРОН НАПРЯМУЮ (как в storm_cloud) - не зависим от анимации!
    console.log(`⚡ [Ball Lightning] Применяем урон к ${shuffledTargets.length} целям, baseDamage=${baseDamage}`);
    let currentDamage = baseDamage;

    shuffledTargets.forEach((targetInfo, index) => {
        const target = targetInfo.wizard;
        console.log(`⚡ [Ball Lightning] Цель ${index}: ${target.name}, HP=${target.hp}, currentDamage=${currentDamage}`);

        // Применяем фракционный бонус Ветра — 5% шанс двойного урона
        let actualDamage = currentDamage;
        let bonusLog = '';
        const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
        if (wizard.faction === 'wind' && typeof window.checkFactionDoubleDamage === 'function') {
            const isDouble = window.checkFactionDoubleDamage(wizard.faction, 'wind', casterInfo);
            if (isDouble) {
                actualDamage *= 2;
                bonusLog = ' 💨 Двойной урон!';
            }
        }

        // Применяем урон
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(wizard, target, actualDamage, 'ball_lightning', 0, true) : actualDamage;

        target.hp -= finalDamage;
        if (target.hp < 0) target.hp = 0;

        // Логируем урон
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⚡ Шаровая молния [${index + 1}] → ${target.name} (${finalDamage} урона)${bonusLog}`);
            const damageSteps = target._lastDamageSteps || [];
            if (damageSteps.length > 0) {
                damageSteps.forEach(step => {
                    window.addToBattleLog(`    ├─ ${step}`);
                });
            }
            window.addToBattleLog(`    └─ HP: ${target.hp}/${target.max_hp}`);
            delete target._lastDamageSteps;
        }

        // На 5 уровне — 5% шанс оглушить
        if (level === 5 && stunChance > 0 && Math.random() < stunChance) {
            target.isStunned = true;
            target.stunTurns = 1;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`⚡ ${target.name} оглушён на 1 ход!`);
            }
        }

        // Уменьшаем урон для следующей цели
        currentDamage = Math.floor(currentDamage * (1 - decayPercent));
        if (currentDamage < 1) currentDamage = 1;
    });
}

// Экспорт
window.castWindSpell = castWindSpell;
window.castGust = castGust;
window.castWindBlade = castWindBlade;
window.castWindWall = castWindWall;
window.castStormCloud = castStormCloud;
window.castBallLightning = castBallLightning;
window.castGustOld = castGustOld;
window.applyGustDamageOld = applyGustDamageOld;