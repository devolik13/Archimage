// battle/spells/spells-poison.js - Заклинания школы Яд (ИСПРАВЛЕННАЯ ВЕРСИЯ)
console.log('✅ battle/spells/spells-poison.js загружен');

function castPoisonSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`☠️ Casting poison spell: ${spellId}`);
    
    switch (spellId) {
        case 'poisoned_blade':
            castPoisonedBlade(wizard, spellData, position, casterType);
            break;
        case 'poisoned_glade':
            castPoisonedGlade(wizard, spellData, position, casterType);
            break;
        case 'foul_cloud':
            castFoulCloud(wizard, spellData, position, casterType);
            break;
        case 'plague':
            castPlague(wizard, spellData, position, casterType);
            break;
        case 'epidemic':
            castEpidemic(wizard, spellData, position, casterType);
            break;
        default:
            console.log(`⚠️ Заклинание яда ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Отравленный клинок (Poisoned Blade) - Тир 1, Single Target + Poison ---
// НОВАЯ ВЕРСИЯ с правильной визуализацией через слои защиты
function castPoisonedBlade(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [7, 8, 9, 10, 10][level - 1] || 7;
    const poisonChance = [0.20, 0.30, 0.40, 0.50, 1.00][level - 1] || 0.20;
    
    console.log(`☠️ Casting Poisoned Blade - Level ${level}, Damage ${baseDamage}, Poison Chance ${poisonChance * 100}%`);
    
    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }
    
    // Проверяем доступность новой системы
    if (!window.castSingleTargetSpell) {
        console.warn('⚠️ Single-target система не загружена, используем старую версию');
        return castPoisonedBladeOld(wizard, spellData, position, casterType, target);
    }
    
    // Запускаем через новую систему
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'poisoned_blade',
        baseDamage: baseDamage,
        spellLevel: level,
        
        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            
            console.log(`☠️ Создаём снаряд Отравленного клинка: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);
            
            if (window.spellAnimations?.poisoned_blade?.play) {
                // Передаём toCol как точку столкновения
                window.spellAnimations.poisoned_blade.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    onHit: onHit
                });
            } else {
                console.warn('⚠️ Анимация poisoned_blade не найдена');
                setTimeout(onHit, 300);
            }
        },
        
        // Применение эффекта яда после урона
        applyEffects: (targetWizard, spellLevel, casterFaction) => {
            // Проверяем шанс наложения яда
            if (Math.random() < poisonChance) {
                if (window.applyPoisonEffect) {
                    window.applyPoisonEffect(targetWizard, 1);
                    console.log(`☠️ Применён эффект яда к ${targetWizard.name}`);
                }

                if (window.applyPoisonFactionBonus) {
                    window.applyPoisonFactionBonus(targetWizard, wizard, casterType);
                    console.log(`☠️ Применён фракционный бонус яда к ${targetWizard.name}`);
                }
            } else {
                console.log(`☠️ Яд не сработал (шанс ${poisonChance * 100}%)`);
            }
        },
        
        // Callback после завершения
        onComplete: (finalResult) => {
            console.log(`✅ Отравленный клинок завершён. Финальный урон: ${finalResult.finalDamage}`);
        }
    });
}

// СТАРАЯ ВЕРСИЯ для fallback
function castPoisonedBladeOld(wizard, spellData, position, casterType, target) {
    const level = spellData.level || 1;
    const baseDamage = [7, 8, 9, 10, 10][level - 1] || 7;
    const poisonChance = [0.20, 0.30, 0.40, 0.50, 1.00][level - 1] || 0.20;
    
    if (!target) {
        target = window.findTarget?.(position, casterType);
    }
    if (!target) return;
    
    const casterCol = casterType === 'player' ? 5 : 0;
    const targetCol = casterType === 'player' ? 0 : 5;
    
    function applyBladeDamageOld() {
        const result = window.applyDamageWithMultiLayerProtection?.(wizard, target, baseDamage, 'poisoned_blade', casterType);
        
        if (result) {
            window.logProtectionResult?.(wizard, target, result, 'Отравленный клинок');
        } else {
            const finalDamage = window.applyFinalDamage?.(wizard, target.wizard, baseDamage, 'poisoned_blade', 0, false) || baseDamage;
            target.wizard.hp -= finalDamage;
            if (target.wizard.hp < 0) target.wizard.hp = 0;
            
            window.logSpellHit?.(wizard, target.wizard, finalDamage, 'Отравленный клинок');
        }
        
        // Проверяем шанс наложения яда
        if (Math.random() < poisonChance) {
            if (window.applyPoisonEffect) {
                window.applyPoisonEffect(target.wizard, 1);
            }
            if (window.applyPoisonFactionBonus) {
                window.applyPoisonFactionBonus(target.wizard);
            }
        }
    }
    
    if (window.spellAnimations?.poisoned_blade?.play) {
        window.spellAnimations.poisoned_blade.play({
            casterCol: casterCol,
            casterRow: position,
            targetCol: targetCol,
            targetRow: target.position,
            onHit: () => {
                applyBladeDamageOld();
            }
        });
    } else {
        applyBladeDamageOld();
    }
}

// --- Ядовитая поляна (Poisoned Glade) - Tier 2, AOE по случайным позициям ---
function castPoisonedGlade(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // Урон зависит от уровня
    const damageByLevel = [10, 12, 12, 15, 15];
    const baseDamage = damageByLevel[level - 1] || 10;
    
    // Количество атакуемых позиций по уровням
    const attackCount = level <= 2 ? 1 : (level <= 4 ? 2 : 3);
    
    // Выбираем случайные уникальные позиции (0-4) для атаки
    const allPositions = [0, 1, 2, 3, 4];
    const shuffled = [...allPositions].sort(() => 0.5 - Math.random());
    const targetPositions = shuffled.slice(0, attackCount);
    
    let hitCount = 0;
    let missCount = 0;
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☠️ ${wizard.name} использует Ядовитую поляну (${attackCount} ${attackCount === 1 ? 'позиция' : 'позиции'})`);
    }
    
    // Определяем колонку цели
    const targetCol = casterType === 'player' ? 0 : 5;
    
    // ИСПРАВЛЕНИЕ: Атакуем выбранные позиции с задержкой, ВСЕГДА показываем анимацию
    targetPositions.forEach((row, index) => {
        setTimeout(() => {
            let targetWizard = null;
            let targetObj = null;
            
            // Проверяем, есть ли маг в этой позиции
            if (casterType === 'player') {
                targetWizard = window.enemyFormation[row];
                if (targetWizard && targetWizard.hp > 0) {
                    targetObj = { wizard: targetWizard, position: row };
                }
            } else {
                const wizardId = window.playerFormation[row];
                if (wizardId) {
                    targetWizard = window.playerWizards.find(w => w.id === wizardId);
                    if (targetWizard && targetWizard.hp > 0) {
                        targetObj = { wizard: targetWizard, position: row };
                    }
                }
            }
            
            // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Всегда запускаем анимацию, независимо от наличия цели
            if (window.spellAnimations?.poisoned_glade?.play) {
                window.spellAnimations.poisoned_glade.play({
                    targetCol: targetCol,
                    targetRow: row,
                    onComplete: () => {
                        // Наносим урон ТОЛЬКО если есть цель
                        if (targetObj) {
                            const finalDamage = typeof window.applyFinalDamage === 'function' ? 
                                window.applyFinalDamage(wizard, targetObj.wizard, baseDamage, 'poisoned_glade', 0, true) : baseDamage;
                                
                            targetObj.wizard.hp -= finalDamage;
                            if (targetObj.wizard.hp < 0) targetObj.wizard.hp = 0;
                            
                            if (typeof window.addToBattleLog === 'function') {
                                window.addToBattleLog(`☠️ Ядовитая поляна поражает ${targetObj.wizard.name} на позиции ${row + 1} (${finalDamage} урона + яд)`);
                            }
                            
                            // Накладываем яд
                            applyPoisonEffect(targetObj.wizard, 1);
                            
                            // Применяем бонус фракции
                            applyPoisonFactionBonus(targetObj.wizard);
                            
                            hitCount++;
                        } else {
                            // Промах - атака в пустую позицию
                            missCount++;
                            if (typeof window.addToBattleLog === 'function') {
                                window.addToBattleLog(`☠️ Ядовитая поляна появляется на позиции ${row + 1} (пусто)`);
                            }
                        }
                    }
                });
            } else {
                // Fallback без анимации - только если есть цель
                if (targetObj) {
                    const finalDamage = typeof window.applyFinalDamage === 'function' ? 
                        window.applyFinalDamage(wizard, targetObj.wizard, baseDamage, 'poisoned_glade', 0, true) : baseDamage;
                        
                    targetObj.wizard.hp -= finalDamage;
                    if (targetObj.wizard.hp < 0) targetObj.wizard.hp = 0;
                    
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`☠️ Ядовитая поляна поражает ${targetObj.wizard.name} на позиции ${row + 1} (${finalDamage} урона + яд)`);
                    }
                    
                    applyPoisonEffect(targetObj.wizard, 1);
                    applyPoisonFactionBonus(targetObj.wizard);
                    hitCount++;
                } else {
                    missCount++;
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`☠️ Ядовитая поляна промахивается (позиция ${row + 1} пуста)`);
                    }
                }
            }
        }, index * 400); // Задержка 400ms между атаками
    });
}

// --- Мерзкое облако (Foul Cloud) - Тир 3, Mass AOE ---
function castFoulCloud(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // Урон по уровням
    const baseDamage = level === 1 ? 30 : (level === 3 ? 40 : 50);
    
    // Определяем колонки для атаки
    const columnsToAttack = [];
    if (level === 1) {
        columnsToAttack.push(casterType === 'player' ? 0 : 5); // Только колонка магов
    } else if (level === 3) {
        columnsToAttack.push(casterType === 'player' ? 0 : 5); // Колонка магов
        columnsToAttack.push(casterType === 'player' ? 1 : 4); // Колонка призванных
    } else if (level === 5) {
        columnsToAttack.push(casterType === 'player' ? 0 : 5); // Колонка магов
        columnsToAttack.push(casterType === 'player' ? 1 : 4); // Колонка призванных
        columnsToAttack.push(casterType === 'player' ? 2 : 3); // Третья колонка
    }
    
    // ИСПРАВЛЕНО: Убираем randomRow полностью
    columnsToAttack.forEach((col, index) => {
        // Задержка для последовательного появления облаков
        setTimeout(() => {
            window.spellRegistry.play('foul_cloud', {
                casterType: casterType,
                casterCol: casterType === 'player' ? 5 : 0,
                casterRow: position,
                targetCol: col,
                // НЕ передаём targetRow - облако покроет всю колонку
                damage: baseDamage,
                duration: 8000
            });
        }, index * 300); // Задержка 300мс между облаками
    });
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☠️ ${wizard.name} призывает Мерзкое облако (уровень ${level})`);
    }
    
    // Атакуем всех врагов в указанных колонках
    const targetInfo = findAllTargetsInColumns(columnsToAttack, casterType);
    
    targetInfo.forEach(targetInfo => {
        // Проверяем живой ли враг
        if (targetInfo.wizard.hp <= 0) return;
        
        // Применяем урон с учётом защиты
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(wizard, targetInfo, baseDamage, 'foul_cloud', 0, true) : baseDamage;
            
        targetInfo.wizard.hp -= finalDamage;
        if (targetInfo.wizard.hp < 0) targetInfo.wizard.hp = 0;
        
        const targetType = targetInfo.isSummoned ? 'призванное существо' : 'маг';
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ Мерзкое облако накрывает ${targetInfo.wizard.name} (${finalDamage} урона + яд)`);
        }
        
        // Накладываем яд (только на магов, не на призванных)
        if (!targetInfo.isSummoned) {
            applyPoisonEffect(targetInfo.wizard, 1);
            
            // Применяем бонус фракции
            applyPoisonFactionBonus(targetInfo.wizard);
        }
    });
}

// Вспомогательная функция поиска целей в колонках
function findAllTargetsInColumns(columns, casterType) {
    const targets = [];
    
    columns.forEach(col => {
        // Определяем массив целей в зависимости от стороны
        let targetArray;
        if (casterType === 'player') {
            if (col === 0) {
                // Колонка вражеских магов
                targetArray = window.enemyFormation || [];
            } else {
                // Колонки призванных существ  
                targetArray = window.enemySummons?.[col] || [];
            }
        } else {
            if (col === 5) {
                // Колонка магов игрока
                targetArray = window.playerFormation || [];
            } else {
                // Колонки призванных существ
                targetArray = window.playerSummons?.[col] || [];
            }
        }
        
        // Обрабатываем каждую позицию в колонке
        for (let row = 0; row < 5; row++) {
            let wizard = null;
            let isSummoned = false;
            
            if (col === 0 || col === 5) {
                // Это колонка магов
                const wizardId = targetArray[row];
                if (wizardId) {
                    if (casterType === 'player') {
                        wizard = window.enemyWizards?.find(w => w.id === wizardId) || 
                                window.enemyFormation?.[row];
                    } else {
                        wizard = window.playerWizards?.find(w => w.id === wizardId);
                    }
                }
            } else {
                // Это колонка призванных
                wizard = targetArray[row];
                isSummoned = true;
            }
            
            if (wizard && wizard.hp > 0) {
                targets.push({
                    wizard: wizard,
                    col: col,
                    row: row,
                    isSummoned: isSummoned
                });
            }
        }
    });
    
    return targets;
}

// --- Чума (Plague) - Tier 4, Дебафф - ИСПРАВЛЕННАЯ ВЕРСИЯ ---
function castPlague(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const targetCount = level; // 1-5 целей
    const healReduction = 70; // -70% к лечению
    
    // ИСПРАВЛЕНИЕ: Получаем только магов, которые РЕАЛЬНО в бою
    let allTargets = [];
    if (casterType === 'player') {
        // Враги - из enemyFormation
        allTargets = window.enemyFormation.filter(w => w && w.hp > 0);
    } else {
        // Игроки - проверяем playerFormation
        window.playerFormation.forEach(wizardId => {
            if (wizardId) {
                const wiz = window.playerWizards.find(w => w.id === wizardId);
                if (wiz && wiz.hp > 0) {
                    allTargets.push(wiz);
                }
            }
        });
    }
    
    if (allTargets.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ ${wizard.name} использует Чуму, но цели не найдены`);
        }
        return;
    }
    
    // 🔥 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Удаляем ВСЕ старые Чумы ЭТОГО кастера ПЕРЕД наложением новых
    allTargets.forEach(target => {
        if (target.effects && target.effects.plague && target.effects.plague.casterId === wizard.id) {
            console.log(`🦠 Снимаем старую Чуму с ${target.name} перед новым кастом`);
            
            // Удаляем визуальный эффект
            if (window.spellAnimations?.plague?.removePlagueEffect) {
                window.spellAnimations.plague.removePlagueEffect(target.id);
            }
            
            // Удаляем дебафф
            delete target.effects.plague;
        }
    });
    
    // Фильтруем магов, у которых НЕТ активной Чумы (теперь все свободны)
    const availableTargets = allTargets.filter(target => {
        if (!target.effects) target.effects = {};
        return !target.effects.plague;
    });
    
    // Если доступных целей меньше, чем нужно — берём всех
    const actualTargetCount = Math.min(targetCount, availableTargets.length);
    
    if (actualTargetCount === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ ${wizard.name} использует Чуму, но все цели уже заражены другими кастерами`);
        }
        return;
    }
    
    // Выбираем случайные уникальные цели
    const shuffled = [...availableTargets].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, actualTargetCount);
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☠️ ${wizard.name} распространяет Чуму на ${selectedTargets.length} ${selectedTargets.length === 1 ? 'цель' : selectedTargets.length < 5 ? 'цели' : 'целей'}`);
    }
    
    // Определяем позиции для анимации
    const casterCol = casterType === 'player' ? 5 : 0;
    const targetCol = casterType === 'player' ? 0 : 5;
    
    // Накладываем дебафф с анимацией на каждую цель с задержкой
    selectedTargets.forEach((target, index) => {
        setTimeout(() => {
            // ИСПРАВЛЕНИЕ: Находим позицию цели правильно
            let targetRow = -1;
            if (casterType === 'player') {
                // Для врагов - ищем позицию в массиве
                targetRow = window.enemyFormation.findIndex(w => w && w.id === target.id);
            } else {
                // Для игроков - ищем ID в formation
                targetRow = window.playerFormation.indexOf(target.id);
            }
            
            if (targetRow === -1) {
                console.warn(`Не найдена позиция для ${target.name}, используем 0`);
                targetRow = 0; // fallback
            }
            
            // Запускаем анимацию
            if (window.spellAnimations?.plague?.play) {
                window.spellAnimations.plague.play({
                    casterCol: casterCol,
                    casterRow: position,
                    targetCol: targetCol,
                    targetRow: targetRow,
                    targetWizardId: target.id,
                    onComplete: () => {
                        // Накладываем дебафф после завершения анимации полёта
                        if (!target.effects) target.effects = {};
                        
                        target.effects.plague = {
                            healReduction: healReduction,
                            casterId: wizard.id,
                            casterType: casterType,
                            appliedAt: Date.now(),
                            turnsLeft: 1 // Снимается через 1 ход кастера
                        };
                        
                        if (typeof window.addToBattleLog === 'function') {
                            window.addToBattleLog(`☠️ ${target.name} заражён Чумой! -${healReduction}% к лечению (1 ход)`);
                        }
                        
                        // На 5 уровне — дополнительно накладываем яд
                        if (level === 5) {
                            applyPoisonEffect(target, 1);
                            applyPoisonFactionBonus(target);
                        }
                    }
                });
            } else {
                // Fallback без анимации
                if (!target.effects) target.effects = {};
                
                target.effects.plague = {
                    healReduction: healReduction,
                    casterId: wizard.id,
                    casterType: casterType,
                    appliedAt: Date.now(),
                    turnsLeft: 1
                };
                
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`☠️ ${target.name} заражён Чумой! -${healReduction}% к лечению (1 ход)`);
                }
                
                if (level === 5) {
                    applyPoisonEffect(target, 1);
                    applyPoisonFactionBonus(target);
                }
            }
        }, index * 500); // Задержка 500ms между целями
    });
}

function processPlagueEffects(casterType) {
    // Собираем всех кастеров Чумы на этой стороне
    const plagueCasters = [];
    if (casterType === 'player') {
        window.playerWizards.forEach(wizard => {
            if (wizard.spells && wizard.spells.includes('plague')) {
                plagueCasters.push(wizard);
            }
        });
    } else {
        window.enemyWizards.forEach(wizard => {
            if (wizard.spells && wizard.spells.includes('plague')) {
                plagueCasters.push(wizard);
            }
        });
    }
    
    console.log(`🦠 Обработка эффектов Чумы для ${casterType}, кастеров: ${plagueCasters.length}`);
    
    // Для каждого кастера — снимаем Чуму, если прошёл 1 ход
    plagueCasters.forEach(caster => {
        // Получаем всех целей с Чумой от этого кастера
        const allTargets = casterType === 'player' ? 
            window.enemyWizards : 
            window.playerWizards;
        
        allTargets.forEach(target => {
            if (target.effects && target.effects.plague && target.effects.plague.casterId === caster.id) {
                console.log(`🦠 Проверка Чумы на ${target.name}, осталось ходов: ${target.effects.plague.turnsLeft}`);
                
                target.effects.plague.turnsLeft--;
                
                if (target.effects.plague.turnsLeft <= 0) {
                    console.log(`🦠 Снимаем Чуму с ${target.name} (ID: ${target.id})`);
                    
                    // ДОБАВЛЕНО: Удаляем визуальный эффект
                    if (window.spellAnimations?.plague?.removePlagueEffect) {
                        window.spellAnimations.plague.removePlagueEffect(target.id);
                    }
                    
                    delete target.effects.plague;
                    
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`💊 Чума на ${target.name} снята`);
                    }
                }
            }
        });
    });
}

// --- Эпидемия (Epidemic) - Тир 5, Массовый урон + отравление ---
function castEpidemic(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 15, 20, 25, 25][level - 1] || 10;
    const poisonChance = 0.5; // 50% шанс
    
    // Получаем всех живых вражеских магов
    const enemyWizards = casterType === 'player' ? 
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerFormation.map((id, idx) => {
            if (id) {
                const wiz = window.playerWizards.find(w => w.id === id);
                return wiz && wiz.hp > 0 ? wiz : null;
            }
            return null;
        }).filter(w => w);
    
    if (enemyWizards.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ ${wizard.name} использует Эпидемию, но цели не найдены`);
        }
        return;
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☠️ ${wizard.name} вызывает Эпидемию! Все вражеские маги получают ${baseDamage} урона`);
    }
    
    // Определяем колонку целей
    const targetCol = casterType === 'player' ? 0 : 5;
    
    // Собираем позиции всех целей для анимации
    const targetPositions = [];
    const targetData = [];
    
    enemyWizards.forEach((target, idx) => {
        const targetRow = casterType === 'player' ? 
            window.enemyFormation.indexOf(target) :
            window.playerFormation.indexOf(target.id);
        
        if (targetRow !== -1) {
            targetPositions.push({
                col: targetCol,
                row: targetRow
            });
            
            targetData.push({
                wizard: target,
                position: targetRow
            });
        }
    });
    
    // Выбираем случайную отравленную цель для МЕГА-взрыва (5 уровень)
    let megaTarget = null;
    if (level === 5) {
        const poisonedTargets = targetData.filter(t => t.wizard.effects && t.wizard.effects.poison);
        if (poisonedTargets.length > 0) {
            const randomPoisoned = poisonedTargets[Math.floor(Math.random() * poisonedTargets.length)];
            megaTarget = {
                col: targetCol,
                row: randomPoisoned.position
            };
        }
    }
    
    // Запускаем массовую анимацию
    if (window.spellAnimations?.epidemic?.playMass) {
        // Добавляем callback для последней цели
        if (targetPositions.length > 0) {
            targetPositions[targetPositions.length - 1].onAllComplete = () => {
                applyEpidemicDamage();
            };
        }
        
        window.spellAnimations.epidemic.playMass(targetPositions, megaTarget);
    } else {
        // Fallback без анимации
        applyEpidemicDamage();
    }
    
    // Функция применения урона (вызывается после анимации)
    function applyEpidemicDamage() {
        // Наносим урон и накладываем яд
        targetData.forEach((targetObj) => {
            const target = targetObj.wizard;
            
            // ИСПРАВЛЕНО: Передаем полный объект
            const finalDamage = typeof window.applyFinalDamage === 'function' ? 
                window.applyFinalDamage(wizard, targetObj, baseDamage, 'epidemic', 0, true) : baseDamage;
                
            target.hp -= finalDamage;
            if (target.hp < 0) target.hp = 0;
            
            if (typeof window.logSpellHit === 'function') {
                window.logSpellHit(wizard, target, finalDamage, 'Эпидемия');
            } else if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`☠️ ${target.name} получает ${finalDamage} урона от Эпидемии (${target.hp}/${target.max_hp})`);
            }
            
            // 50% шанс наложить яд
            if (Math.random() < poisonChance) {
                applyPoisonEffect(target, 1);
            }
            
            // Бонус фракции
            applyPoisonFactionBonus(target);
        });
        
        // На 5 уровне — бонусный урон от стаков яда
        if (level === 5) {
            const poisonedTargets = targetData.filter(t => t.wizard.effects && t.wizard.effects.poison);
            if (poisonedTargets.length > 0) {
                const randomTargetObj = poisonedTargets[Math.floor(Math.random() * poisonedTargets.length)];
                const randomTarget = randomTargetObj.wizard;
                const stacks = randomTarget.effects.poison.stacks || 0;
                const bonusDamage = stacks * 10;
                
                if (bonusDamage > 0) {
                    randomTarget.hp -= bonusDamage;
                    if (randomTarget.hp < 0) randomTarget.hp = 0;
                    
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`💀 ${randomTarget.name} получает ${bonusDamage} бонусного урона от Эпидемии (стаков яда: ${stacks})`);
                    }
                }
            }
        }
    }
}

// --- Применить эффект яда ---
function applyPoisonEffect(targetWizard, stacks = 1) {
    if (!targetWizard.effects) targetWizard.effects = {};
    
    const oldStacks = targetWizard.effects.poison?.stacks || 0;
    
    if (targetWizard.effects.poison) {
        targetWizard.effects.poison.stacks += stacks;
    } else {
        targetWizard.effects.poison = {
            stacks: stacks,
            damagePerStack: 5 // 5 урона за стак в начале хода
        };
    }
    
    const newStacks = targetWizard.effects.poison.stacks;
    const totalDamage = newStacks * targetWizard.effects.poison.damagePerStack;
    
    if (typeof window.addToBattleLog === 'function') {
        if (oldStacks > 0) {
            window.addToBattleLog(`☠️ ${targetWizard.name} отравлен! (${oldStacks} → ${newStacks} стаков, ${totalDamage} урона в ход)`);
        } else {
            window.addToBattleLog(`☠️ ${targetWizard.name} отравлен! (${newStacks} ${newStacks === 1 ? 'стак' : newStacks < 5 ? 'стака' : 'стаков'}, ${totalDamage} урона в ход)`);
        }
    }
}

// --- Бонус фракции: Токсичный след ---
function applyPoisonFactionBonus(targetWizard, caster = null, casterType = null) {
    const chance = 0.05; // 5% шанс
    const roll = Math.random();

    if (roll < chance) {
        applyPoisonEffect(targetWizard, 1); // Дополнительный стак
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ Токсичный след СРАБОТАЛ (выпало ${Math.round(roll * 100)}% < 5%) — дополнительный стак яда на ${targetWizard.name}`);
        }

        // Речевой пузырь для бонуса яда
        if (caster && caster.faction === 'poison' && casterType && typeof window.showFactionSpeechBubble === 'function') {
            // Находим позицию кастера
            let position = -1;
            if (casterType === 'player') {
                position = window.playerFormation?.findIndex(id => id === caster.id);
            } else {
                position = window.enemyFormation?.findIndex(w => w && w.id === caster.id);
            }

            if (position !== -1) {
                const col = casterType === 'player' ? 5 : 0;
                window.showFactionSpeechBubble('poison', col, position);
                console.log('☠️ БОНУС ЯДА СРАБОТАЛ! Дополнительный стак');
            }
        }
    }
}

// Экспорт всех функций
window.castPoisonSpell = castPoisonSpell;
window.castPoisonedBlade = castPoisonedBlade;
window.castPoisonedGlade = castPoisonedGlade;
window.castFoulCloud = castFoulCloud;
window.applyPoisonEffect = applyPoisonEffect;
window.applyPoisonFactionBonus = applyPoisonFactionBonus;
window.castPlague = castPlague;
window.processPlagueEffects = processPlagueEffects;
window.castEpidemic = castEpidemic;
window.castPoisonedBladeOld = castPoisonedBladeOld;