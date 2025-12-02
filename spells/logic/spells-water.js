// battle/spells/spells-water.js - Заклинания школы воды (адаптированная под новую структуру)


function castWaterSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`💧 Casting water spell: ${spellId}`);
    
    switch (spellId) {
        case 'icicle':
            castIcicle(wizard, spellData, position, casterType);
            break;
        case 'frost_arrow':
            castFrostArrow(wizard, spellData, position, casterType);
            break;
        case 'ice_rain':
            castIceRain(wizard, spellData, position, casterType);
            break;
	case 'blizzard':
    	    castBlizzard(wizard, spellData, position, casterType);
    	    break;
	case 'absolute_zero':
	    // ❄️ НЕ применяется в бою — уже активен с начала боя
	    console.log('❄️ Абсолютный Ноль — уже активен с начала боя');
	    break;
        default:
            console.log(`⚠️ Заклинание воды ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Ледышка (Icicle) - Тир 1, Single Target ---
// НОВАЯ ВЕРСИЯ с правильной визуализацией через слои защиты
function castIcicle(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 15, 20, 25, 30][level - 1] || 10;
    
    console.log(`💧 Casting Icicle - Level ${level}, Damage ${baseDamage}`);
    
    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }
    
    // Проверяем доступность новой системы
    if (!window.castSingleTargetSpell) {
        console.warn('⚠️ Single-target система не загружена, используем старую версию');
        return castIcicleOld(wizard, spellData, position, casterType, target);
    }
    
    // Запускаем через новую систему
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'icicle',
        baseDamage: baseDamage,
        spellLevel: level,
        
        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            
            console.log(`❄️ Создаём снаряд Ледышки: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);
            
            if (window.createIcicleProjectile) {
                // Передаём toCol как точку столкновения
                window.createIcicleProjectile(fromCol, fromRow, toCol, toRow, onHit);
            } else {
                console.warn('⚠️ createIcicleProjectile не найдена');
                setTimeout(onHit, 300);
            }
        },
        
        // Применение эффектов после урона
        applyEffects: (targetWizard, spellLevel, casterFaction) => {
            const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
            if (spellLevel === 5) {
                if (casterFaction === 'water') {
                    window.tryApplyEffect?.('freeze', targetWizard, false, casterInfo);
                    console.log(`❄️ Применён эффект заморозки к ${targetWizard.name}`);
                } else {
                    window.tryApplyEffect?.('hoarFrost', targetWizard, false, casterInfo);
                    console.log(`❄️ Применён эффект изморози к ${targetWizard.name}`);
                }
            } else {
                if (casterFaction === 'water') {
                    window.tryApplyEffect?.('chill', targetWizard, false, casterInfo);
                    console.log(`❄️ Применён эффект охлаждения к ${targetWizard.name}`);
                }
            }
        },
        
        // Callback после завершения
        onComplete: (finalResult) => {
        }
    });
}

// СТАРАЯ ВЕРСИЯ для fallback
function castIcicleOld(wizard, spellData, position, casterType, target) {
    const level = spellData.level || 1;
    const baseDamage = [10, 15, 20, 25, 30][level - 1] || 10;
    
    if (!target) {
        target = window.findTarget?.(position, casterType);
    }
    if (!target) return;
    
    const casterCol = casterType === 'player' ? 5 : 0;
    const targetCol = casterType === 'player' ? 0 : 5;
    
    if (window.createIcicleProjectile) {
        window.createIcicleProjectile(casterCol, position, targetCol, target.position, () => {
            applyIcicleDamageOld(wizard, target, baseDamage, spellData, position, casterType);
        });
    } else {
        applyIcicleDamageOld(wizard, target, baseDamage, spellData, position, casterType);
    }
}

function applyIcicleDamageOld(wizard, target, baseDamage, spellData, position, casterType) {
    const level = spellData.level || 1;
    const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };

    const result = window.applyDamageWithMultiLayerProtection?.(wizard, target, baseDamage, 'icicle', casterType);

    if (result) {
        window.logProtectionResult?.(wizard, target, result, 'Ледышка');
        if (result.finalDamage > 0) {
            if (level === 5) {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect?.('freeze', target.wizard, false, casterInfo);
                } else {
                    window.tryApplyEffect?.('hoarFrost', target.wizard, false, casterInfo);
                }
            } else {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect?.('chill', target.wizard, false, casterInfo);
                }
            }
        }
    } else {
        const finalDamage = window.applyFinalDamage?.(wizard, target.wizard, baseDamage, 'icicle', 0, false) || baseDamage;
        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;

        window.logSpellHit?.(wizard, target.wizard, finalDamage, 'Ледышка');
        if (finalDamage > 0) {
            if (level === 5) {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect?.('freeze', target.wizard, false, casterInfo);
                } else {
                    window.tryApplyEffect?.('hoarFrost', target.wizard, false, casterInfo);
                }
            } else {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect?.('chill', target.wizard, false, casterInfo);
                }
            }
        }
    }
}


// --- Ледяная стрела (Frost Arrow) - Тир 2, Single Target с AOE взрывом ---
function castFrostArrow(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [15, 20, 25, 30, 35][level - 1] || 15;

    const mainTarget = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    if (!mainTarget) return;

    // Определяем позиции для визуального снаряда
    const casterCol = casterType === 'player' ? 5 : 0;
    const targetCol = casterType === 'player' ? 0 : 5;
    
    // Создаем визуальный снаряд
    if (typeof window.createFrostArrowProjectile === 'function') {
        window.createFrostArrowProjectile({
            casterCol: casterCol,
            casterRow: position,
            targetCol: targetCol,
            targetRow: mainTarget.position,
            onHit: () => {
                // ======== УРОН ПОСЛЕ ПОПАДАНИЯ ========
                const targetsHit = [];
                
                // ОСНОВНАЯ ЦЕЛЬ: Single Target с отслеживанием точки столкновения
                const mainResult = typeof window.applyDamageWithMultiLayerProtection === 'function' ?
                    window.applyDamageWithMultiLayerProtection(wizard, mainTarget, baseDamage, 'frost_arrow', casterType) :
                    null;
                
                if (mainResult) {
                    if (typeof window.logProtectionResult === 'function') {
                        window.logProtectionResult(wizard, mainTarget, mainResult, 'Ледяная стрела');
                    }
                    if (mainResult.finalDamage > 0) {
                        targetsHit.push(mainTarget.wizard);
                    }
                } else {
                    const mainFinalDamage = window.applyFinalDamage ? 
                        window.applyFinalDamage(wizard, mainTarget.wizard, baseDamage, 'frost_arrow', 0, false) : baseDamage;
                        
                    mainTarget.wizard.hp -= mainFinalDamage;
                    if (mainTarget.wizard.hp < 0) mainTarget.wizard.hp = 0;
                    
                    if (typeof window.logSpellHit === 'function') {
                        window.logSpellHit(wizard, mainTarget.wizard, mainFinalDamage, 'Ледяная стрела');
                    }
                    targetsHit.push(mainTarget.wizard);
                }

                // ВЗРЫВ ОСКОЛКОВ: AOE, игнорирует защиту
                const explosionPosition = mainTarget.position;
                const splashPositions = [];
                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    if (colOffset === 0) continue;
                    splashPositions.push((explosionPosition + colOffset + 5) % 5);
                }

                const shrapnelDamage = Math.floor(baseDamage * 0.5);

                splashPositions.forEach((col) => {
                    const splashTarget = findTargetAtSimplePosition(col, casterType);
                    if (splashTarget) {
                        const splashFinalDamage = window.applyFinalDamage ? 
                            window.applyFinalDamage(wizard, splashTarget.wizard, shrapnelDamage, 'frost_arrow', 0, true) : shrapnelDamage;
                            
                        splashTarget.wizard.hp -= splashFinalDamage;
                        if (splashTarget.wizard.hp < 0) splashTarget.wizard.hp = 0;
                        
                        if (typeof window.addToBattleLog === 'function') {
                            // Многострочный лог как у Искры
                            window.addToBattleLog(`❄️ Осколок [${col}] → ${splashTarget.wizard.name} (${splashFinalDamage} урона)`);
                            const damageSteps = splashTarget.wizard._lastDamageSteps || [];
                            if (damageSteps.length > 0) {
                                damageSteps.forEach(step => {
                                    window.addToBattleLog(`    ├─ ${step}`);
                                });
                            }
                            window.addToBattleLog(`    └─ HP: ${splashTarget.wizard.hp}/${splashTarget.wizard.max_hp}`);
                            delete splashTarget.wizard._lastDamageSteps;
                        }
                        targetsHit.push(splashTarget.wizard);
                    } else {
                        if (typeof window.addToBattleLog === 'function') {
                            window.addToBattleLog(`❄️ Осколок [${col}] → пусто`);
                        }
                    }
                });

                // Применяем эффекты охлаждения ко всем пораженным целям
                const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
                targetsHit.forEach(targetWizard => {
                    if (level === 5) {
                        if (wizard.faction === 'water') {
                            window.tryApplyEffect ? window.tryApplyEffect('freeze', targetWizard, false, casterInfo) : null;
                        } else {
                            window.tryApplyEffect ? window.tryApplyEffect('hoarFrost', targetWizard, false, casterInfo) : null;
                        }
                    } else {
                        if (wizard.faction === 'water') {
                            window.tryApplyEffect ? window.tryApplyEffect('chill', targetWizard, false, casterInfo) : null;
                        }
                    }
                });
                
                // ========================================
                // ВИЗУАЛЬНЫЕ ВЗРЫВЫ 3×3 ВОКРУГ ТОЧКИ СТОЛКНОВЕНИЯ
                // ========================================
                if (mainResult && mainResult.impactCol !== undefined && typeof window.createExplosionsAround === 'function') {
                    console.log(`💥 Создание визуальных взрывов вокруг точки столкновения [${mainResult.impactCol}, ${mainResult.impactRow}]`);
                    
                    window.createExplosionsAround(
                        mainResult.impactCol, 
                        mainResult.impactRow, 
                        casterType,
                        (col, row) => {
                            if (window.spellAnimations?.frost_arrow?.createExplosionAt) {
                                window.spellAnimations.frost_arrow.createExplosionAt(col, row, casterType);
                            }
                        }
                    );
                } else {
                    // Fallback: если multi-layer не вернула координаты или функция недоступна
                    console.warn('⚠️ Не удалось получить точку столкновения, используем позицию основной цели');
                    
                    if (window.spellAnimations?.frost_arrow?.createExplosionAt) {
                        // Основной взрыв на цели
                        const explosionCol = casterType === 'player' ? 0 : 5;
                        window.spellAnimations.frost_arrow.createExplosionAt(
                            explosionCol, 
                            explosionPosition, 
                            casterType
                        );
                        
                        // Боковые взрывы
                        splashPositions.forEach((row, index) => {
                            setTimeout(() => {
                                window.spellAnimations.frost_arrow.createExplosionAt(
                                    explosionCol, 
                                    row, 
                                    casterType
                                );
                            }, 50 * (index + 1));
                        });
                    }
                }
            }
        });
    } else {
        // Если визуальная система недоступна, наносим урон сразу
        console.warn('⚠️ Анимация недоступна, урон наносится сразу');
        
        const targetsHit = [];
        
        // Основная цель
        const mainResult = typeof window.applyDamageWithMultiLayerProtection === 'function' ?
            window.applyDamageWithMultiLayerProtection(wizard, mainTarget, baseDamage, 'frost_arrow', casterType) :
            null;
        
        if (mainResult && mainResult.finalDamage > 0) {
            targetsHit.push(mainTarget.wizard);
        }
        
        // Взрыв осколков
        const explosionPosition = mainTarget.position;
        const splashPositions = [];
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (colOffset === 0) continue;
            splashPositions.push((explosionPosition + colOffset + 5) % 5);
        }
        
        const shrapnelDamage = Math.floor(baseDamage * 0.5);
        
        splashPositions.forEach((col) => {
            const splashTarget = findTargetAtSimplePosition(col, casterType);
            if (splashTarget) {
                const splashFinalDamage = window.applyFinalDamage ? 
                    window.applyFinalDamage(wizard, splashTarget.wizard, shrapnelDamage, 'frost_arrow', 0, true) : shrapnelDamage;
                    
                splashTarget.wizard.hp -= splashFinalDamage;
                if (splashTarget.wizard.hp < 0) splashTarget.wizard.hp = 0;
                
                targetsHit.push(splashTarget.wizard);
            }
        });
        
        // Эффекты
        const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
        targetsHit.forEach(targetWizard => {
            if (level === 5) {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect ? window.tryApplyEffect('freeze', targetWizard, false, casterInfo) : null;
                } else {
                    window.tryApplyEffect ? window.tryApplyEffect('hoarFrost', targetWizard, false, casterInfo) : null;
                }
            } else {
                if (wizard.faction === 'water') {
                    window.tryApplyEffect ? window.tryApplyEffect('chill', targetWizard, false, casterInfo) : null;
                }
            }
        });
    }
}

// --- Ледяной дождь (Ice Rain) - Тир 3, AOE ---
function castIceRain(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [6, 7, 8, 9, 10][level - 1] || 6;

    const mainTarget = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    if (!mainTarget) return;

    const targetsHit = [];
    const targetCol = mainTarget.position;
    
    // Определяем пораженные позиции
    let affectedPositions = [];
    if (level === 1 || level === 2) {
        affectedPositions = [(targetCol - 1 + 5) % 5, targetCol, (targetCol + 1) % 5];
    } else if (level === 3 || level === 4) {
        for (let col = 0; col < 5; col++) affectedPositions.push(col);
    } else if (level === 5) {
        for (let col = 0; col < 5; col++) {
            affectedPositions.push(col);
            affectedPositions.push(col); // двойное добавление для двух волн
        }
    }

    // Вызываем анимацию
    if (window.spellAnimations?.ice_rain?.play) {
        window.spellAnimations.ice_rain.play({
            casterType: casterType,
            targetPositions: affectedPositions,
            level: level
        });
    }

    // Наносим урон
    const processedTargets = new Set();
    
    affectedPositions.forEach((col) => {
        const target = findTargetAtSimplePosition(col, casterType);
        if (target) {
            // На 5 уровне разрешаем повторный урон
            if (level === 5 || !processedTargets.has(target.wizard.id)) {
                if (level < 5) {
                    processedTargets.add(target.wizard.id);
                }
                
                const finalDamage = window.applyFinalDamage ?
                    window.applyFinalDamage(wizard, target.wizard, baseDamage, 'ice_rain', 0, true) : baseDamage;

                target.wizard.hp -= finalDamage;
                if (target.wizard.hp < 0) target.wizard.hp = 0;

                if (typeof window.addToBattleLog === 'function') {
                    // Многострочный лог как у Искры
                    window.addToBattleLog(`❄️ Ледяной дождь [${col}] → ${target.wizard.name} (${finalDamage} урона)`);
                    const damageSteps = target.wizard._lastDamageSteps || [];
                    if (damageSteps.length > 0) {
                        damageSteps.forEach(step => {
                            window.addToBattleLog(`    ├─ ${step}`);
                        });
                    }
                    window.addToBattleLog(`    └─ HP: ${target.wizard.hp}/${target.wizard.max_hp}`);
                    delete target.wizard._lastDamageSteps;
                }
                targetsHit.push(target.wizard);
            }
        }
    });

    // Эффекты охлаждения (50% шанс)
    const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
    targetsHit.forEach(targetWizard => {
        if (Math.random() < 0.5) {
            if (wizard.faction === 'water') {
                window.tryApplyEffect ? window.tryApplyEffect('freeze', targetWizard, false, casterInfo) : null;
            } else {
                window.tryApplyEffect ? window.tryApplyEffect('hoarFrost', targetWizard, false, casterInfo) : null;
            }
        }
    });

    // Общий лог (в начале, а не в конце - для правильного порядка)
    const areaDescription = getIceRainAreaDescription(level);
    if (typeof window.addToBattleLog === 'function' && targetsHit.length > 0) {
        window.addToBattleLog(`❄️ ${wizard.name} вызывает Ледяной дождь Ур.${level} (${areaDescription}, поражено ${targetsHit.length} целей)`);
    }
}

// --- Снежная буря (Blizzard) - Тир 4, AOE-зона с шансом прерывания ---
function castBlizzard(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    let interruptChance, radius;
    
    switch (level) {
        case 1: case 2: case 3:
            interruptChance = [5, 6, 7][level - 1];
            radius = 1; // 3 клетки
            break;
        case 4: case 5:
            interruptChance = [8, 10][level - 4];
            radius = 2; // 5 клеток
            break;
        default:
            interruptChance = 5;
            radius = 1;
    }
    
    // Находим основную цель для центра зоны
    const target = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    const centerRow = target ? target.position : position; // если цель не найдена — используем позицию
    
    // Создаём игровую зону
    if (typeof window.createBlizzardZone === 'function') {
        window.createBlizzardZone(wizard.id, casterType, centerRow, radius, interruptChance, level);
        
        // Запускаем анимацию
        if (window.spellAnimations?.blizzard?.play) {
            window.spellAnimations.blizzard.play({
                casterType: casterType,
                centerRow: centerRow,
                radius: radius,
                level: level
            });
        }
        
        const areaDesc = radius === 1 ? '3 клетки' : 'вся линия магов';
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`❄️ ${wizard.name} вызывает Снежную бурю (${areaDesc}, шанс прерывания: ${interruptChance}%)`);
        }
    } else {
        console.error("Функция createBlizzardZone не найдена.");
    }
}

// --- Абсолютный Ноль (Absolute Zero) - Тир 5, Пассивная AOE-зона на всей территории врага ---
function castAbsoluteZero(wizard, spellData, position, casterType) {
    // ❄️ НЕ КАСТУЕТСЯ В БОЮ - применяется автоматически в начале боя
    console.log('❄️ Абсолютный Ноль — уже активен с начала боя');
}

// Вспомогательные функции
function getIceRainAreaDescription(level) {
    switch (level) {
        case 1: case 2: return "3 клетки";
        case 3: case 4: return "весь ряд";
        case 5: return "усиленная область";
        default: return "3 клетки";
    }
}

function findTargetAtSimplePosition(col, casterType) {
    if (casterType === 'player') {
        const enemyWizard = window.enemyFormation[col];
        if (enemyWizard && enemyWizard.hp > 0) {
            return { wizard: enemyWizard, position: col };
        }
    } else {
        const wizardId = window.playerFormation[col];
        if (wizardId) {
            const playerWizard = window.playerWizards.find(w => w.id === wizardId);
            if (playerWizard && playerWizard.hp > 0) {
                return { wizard: playerWizard, position: col };
            }
        }
    }
    return null;
}

// Экспорт
window.castWaterSpell = castWaterSpell;
window.castIcicle = castIcicle;
window.castFrostArrow = castFrostArrow;
window.castIceRain = castIceRain;
window.castBlizzard = castBlizzard;
window.castAbsoluteZero = castAbsoluteZero;
window.castIcicleOld = castIcicleOld;
window.applyIcicleDamageOld = applyIcicleDamageOld;