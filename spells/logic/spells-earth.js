// battle/spells/spells-earth.js- Заклинания школы земли (адаптированная под новую структуру)


function castEarthSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`🌿 Casting earth spell: ${spellId}`);
    
    switch (spellId) {
        case 'pebble':
            castPebble(wizard, spellData, position, casterType);
            break;
        case 'stone_spike':
            castStoneSpike(wizard, spellData, position, casterType);
            break;
        case 'earth_wall':
            castEarthWall(wizard, spellData, position, casterType);
            break;
	case 'stone_grotto':
    	    castStoneGrotto(wizard, spellData, position, casterType);
            break;
	case 'meteor_shower':
    	    castMeteorShower(wizard, spellData, position, casterType);
    	    break;
        default:
            console.log(`⚠️ Заклинание земли ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Камешек (Pebble) - Тир 1, Single Target ---
// НОВАЯ ВЕРСИЯ с правильной визуализацией через слои защиты
function castPebble(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;
    
    console.log(`🪨 Casting Pebble - Level ${level}, Damage ${baseDamage}`);
    
    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }
    
    // Запускаем через систему single-target
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'pebble',
        baseDamage: baseDamage,
        spellLevel: level,
        
        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            
            console.log(`🪨 Создаём снаряд Камешка: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);
            
            if (window.spellAnimations?.pebble?.play) {
                // Передаём toCol как точку столкновения
                window.spellAnimations.pebble.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    onHit: onHit
                });
            } else {
                console.warn('⚠️ Анимация pebble не найдена');
                setTimeout(onHit, 300);
            }
        },
        
        // Эффектов у Pebble нет
        applyEffects: null,
        
        // Callback после завершения
        onComplete: (finalResult) => {
            
            // ЭФФЕКТ 5 УРОВНЯ: 50% шанс бросить ещё один камешек
            if (level === 5 && Math.random() < 0.5) {
                console.log('🪨 УРОВЕНЬ 5: Запуск дополнительного камешка!');
                
                setTimeout(() => {
                    const additionalTarget = window.findRandomTarget?.(casterType);
                    
                    if (additionalTarget && additionalTarget.wizard !== target.wizard) {
                        castPebbleSecondary(wizard, spellData, position, casterType, additionalTarget);
                    }
                }, 400);
            }
        }
    });
}

// Вторичный камешек для 5 уровня
function castPebbleSecondary(wizard, spellData, position, casterType, target) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;
    
    console.log('🪨🪨 ВТОРИЧНЫЙ КАМЕШЕК');

    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'pebble',
        baseDamage: baseDamage,
        spellLevel: level,
        
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            if (window.spellAnimations?.pebble?.play) {
                window.spellAnimations.pebble.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    isSecond: true,
                    onHit: onHit
                });
            } else {
                setTimeout(onHit, 300);
            }
        },
        
        applyEffects: null,
        
        onComplete: () => {
        }
    });
}

// --- Каменный шип (Stone Spike) - Тир 2, AOE с точечными попаданиями ---
function castStoneSpike(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const damagePerSpike = [4, 5, 7, 9, 13][level - 1] || 4;
    const spikeCount = level === 5 ? 7 : 4;

    const mainTarget = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    if (!mainTarget) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🗿 ${wizard.name} использует Каменный шип, но основная цель не найдена`);
        }
        return;
    }

    // Используем универсальный поиск по паттерну
    const targets = typeof window.findStoneSpikeTargets === 'function' ? 
        window.findStoneSpikeTargets(position, casterType, spikeCount, level) : [];

    // Запускаем анимацию
    if (window.spellAnimations?.stone_spike?.play) {
        window.spellAnimations.stone_spike.play({
            casterType: casterType,
            casterPosition: position,
            mainTargetPosition: mainTarget.position,
            level: level,
            onComplete: () => {
                // Наносим урон после завершения анимации
                applySpikeDamage();
            }
        });
    } else {
        // Fallback - наносим урон сразу
        applySpikeDamage();
    }

    function applySpikeDamage() {
        // Сортируем цели по HP% (слабейший первый) для приоритета защиты Энтом
        const sortedTargets = window.sortTargetsByHpPercent ? window.sortTargetsByHpPercent(targets) : targets;

        sortedTargets.forEach((targetInfo, index) => {
            if (!targetInfo.target) {
                if (typeof window.logMiss === 'function') {
                    window.logMiss(targetInfo.direction, level);
                }
                return;
            }

            // Если цель — стена
            if (targetInfo.target.wizard && targetInfo.target.wizard.type === 'earth_wall_hp') {
                if (typeof window.damageEarthWall === 'function') {
                    window.damageEarthWall(targetInfo.target.wizard.id, damagePerSpike);
                }
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`⛏️ ${wizard.name} бросает каменный шип ${window.getDirectionNameSimple(targetInfo.direction, level)} → 🧱 Стена (${damagePerSpike} урона)`);
                }
                return;
            }

            // ИСПРАВЛЕНИЕ: Используем многоуровневую защиту (включая Энта)
            if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
                const result = window.applyDamageWithMultiLayerProtection(wizard, targetInfo.target, damagePerSpike, 'stone_spike', casterType);

                if (result) {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`🗿 Каменный шип (${window.getDirectionNameSimple(targetInfo.direction, level)}) → ${targetInfo.target.wizard.name} (${result.finalDamage} урона)`);
                        // Показываем защитные слои
                        if (result.protectionLayers && result.protectionLayers.length > 0) {
                            result.protectionLayers.forEach(layer => {
                                const isProtectionLayer = layer.includes('🐺') || layer.includes('🌳') || layer.includes('🧱') || layer.includes('💨') || layer.includes('защищает') || layer.includes('поглощает') || layer.includes('ослабляет');
                                const isFinalWizardMessage = layer.includes(targetInfo.target.wizard.name) && (layer.includes('получает') || layer.includes('не получает')) && !isProtectionLayer;
                                if (!isFinalWizardMessage) {
                                    window.addToBattleLog(`    ├─ ${layer}`);
                                }
                            });
                        }
                        window.addToBattleLog(`    └─ HP: ${targetInfo.target.wizard.hp}/${targetInfo.target.wizard.max_hp}`);
                    }
                }
            } else {
                // Fallback на старую систему (без защиты Энтом)
                let armorIgnorePercent = 0;
                if (wizard.faction === 'earth') {
                    // Передаём casterInfo для показа bubble
                    const casterInfo = {
                        wizard: wizard,
                        faction: wizard.faction,
                        casterType: casterType,
                        position: position
                    };
                    armorIgnorePercent = window.checkArmorIgnore ? window.checkArmorIgnore(false, casterInfo) : 0;
                }

                const finalDamage = window.applyFinalDamage ?
                    window.applyFinalDamage(wizard, targetInfo.target.wizard, damagePerSpike, 'stone_spike', armorIgnorePercent, true) : damagePerSpike;

                targetInfo.target.wizard.hp -= finalDamage;
                if (targetInfo.target.wizard.hp < 0) targetInfo.target.wizard.hp = 0;

                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🗿 Каменный шип (${window.getDirectionNameSimple(targetInfo.direction, level)}) → ${targetInfo.target.wizard.name} (${finalDamage} урона)`);
                    const damageSteps = targetInfo.target.wizard._lastDamageSteps || [];
                    if (damageSteps.length > 0) {
                        damageSteps.forEach(step => {
                            window.addToBattleLog(`    ├─ ${step}`);
                        });
                    }
                    window.addToBattleLog(`    └─ HP: ${targetInfo.target.wizard.hp}/${targetInfo.target.wizard.max_hp}`);
                    delete targetInfo.target.wizard._lastDamageSteps;
                }
            }
        });
    }
}

// --- Земляная стена (Earth Wall) - Тир 3 ---
function castEarthWall(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const wallHP = [20, 30, 40, 50, 60][level - 1] || 20;
    const wallSize = level === 5 ? 5 : (level >= 3 ? 3 : 1);

    const wallColumn = casterType === 'player' ? 3 : 2;

    const wallRows = [];
    if (wallSize === 1) {
        wallRows.push(position);
    } else if (wallSize === 3) {
        wallRows.push((position - 1 + 5) % 5);
        wallRows.push(position);
        wallRows.push((position + 1) % 5);
    } else {
        for (let i = 0; i < 5; i++) wallRows.push(i);
    }

    // Вызываем анимацию
    if (window.spellAnimations?.earth_wall?.play) {
        window.spellAnimations.earth_wall.play({
            casterType: casterType,
            casterPosition: position,
            wallColumn: wallColumn,
            wallRows: wallRows,
            wallHP: wallHP,
            level: level,
	    casterId: wizard.id
        });
    }

    // Создаём игровую стену
    if (typeof window.createOrUpdateEarthWallWithHP === 'function') {
        window.createOrUpdateEarthWallWithHP(
            wizard.id,
            casterType,
            wallColumn,
            wallRows,
            wallHP,
            level
        );
    }
}


// --- Каменный грот (Stone Grotto) - Тир 4, Бафф брони + снижение урона от заклинаний ---
function castStoneGrotto(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    let armorPercent, damageReduction, targets = [];
    
    switch (level) {
        case 1:
            armorPercent = 10;
            damageReduction = 5;
            targets = [wizard];
            break;
        case 2:
            armorPercent = 15;
            damageReduction = 5;
            targets = [wizard];
            break;
        case 3:
            armorPercent = 15;
            damageReduction = 10;
            targets = getWizardAndNeighbors(wizard, casterType);
            break;
        case 4:
            armorPercent = 20;
            damageReduction = 10;
            targets = getWizardAndNeighbors(wizard, casterType);
            break;
        case 5:
            armorPercent = 20;
            damageReduction = 10;
            targets = casterType === 'player' ? 
                window.playerWizards.filter(w => w.hp > 0) : 
                window.enemyWizards.filter(w => w.hp > 0);
            break;
        default:
            armorPercent = 10;
            damageReduction = 5;
            targets = [wizard];
    }
    
    if (window.spellAnimations?.stone_grotto?.play) {
    	window.spellAnimations.stone_grotto.play({
    	    casterType: casterType,
    	    casterPosition: position,
    	    targetWizards: targets,  // передаем массив всех целей
    	    level: level,
    	    onComplete: () => {
    	        console.log('🏔️ Анимация Каменного грота завершена');
    	    }
    	});
    }


    // Применяем бафф к каждому магу
    targets.forEach(target => {
        // Инициализируем объект баффа
        if (!target.stoneGrottoBonus) target.stoneGrottoBonus = {};
        
        // Рассчитываем бонус брони от БАЗОВОЙ брони
        const baseArmor = target.armor || 0;
        const bonusArmor = Math.floor(baseArmor * armorPercent / 100);
        
        // ИСПРАВЛЕНО: Добавляем как отдельный бонус, не трогая базовую броню
        if (!target.armorBonuses) target.armorBonuses = {};
	target.armorBonuses.stone_grotto = bonusArmor;

	// Пересчитываем общий бонус
	target.armorBonus = 0;
	for (const source in target.armorBonuses) {
	    target.armorBonus += target.armorBonuses[source];
	}
        
        // Оставляем как есть - снижение ИСХОДЯЩЕГО урона
        target.spellDamageMultiplier = 1 - damageReduction / 100;
        
        // Сохраняем параметры для лога и отображения
        target.stoneGrottoBonus = {
            armorPercent: armorPercent,
            damageReduction: damageReduction,
            bonusArmor: bonusArmor,
            appliedAt: Date.now()
        };
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🪨 ${target.name} получает +${bonusArmor} брони и -${damageReduction}% к исходящему урону от заклинаний от Каменного грота`);
        }
    });
    
    if (typeof window.addToBattleLog === 'function') {
        const areaDesc = level === 5 ? 'все союзники' : (level >= 3 ? 'маг и соседи' : 'только кастер');
        window.addToBattleLog(`🪨 ${wizard.name} активирует Каменный грот (${areaDesc}, +${armorPercent}% брони, -${damageReduction}% к урону от заклинаний)`);
    }
}

// --- Получить мага и его соседей по кольцу ---
function getWizardAndNeighbors(wizard, casterType) {
    // Находим позицию кастера
    let casterPosition = -1;
    if (casterType === 'player') {
        casterPosition = window.playerFormation.findIndex(id => id === wizard.id);
    } else {
        casterPosition = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
    }
    
    if (casterPosition === -1) return [wizard];
    
    // Определяем соседей по кольцу
    const leftPos = (casterPosition - 1 + 5) % 5;
    const rightPos = (casterPosition + 1) % 5;
    
    const neighbors = [wizard];
    
    // Добавляем левого соседа
    if (casterType === 'player') {
        const leftId = window.playerFormation[leftPos];
        if (leftId) {
            const leftWizard = window.playerWizards.find(w => w.id === leftId);
            if (leftWizard && leftWizard.hp > 0) neighbors.push(leftWizard);
        }
    } else {
        const leftWizard = window.enemyFormation[leftPos];
        if (leftWizard && leftWizard.hp > 0) neighbors.push(leftWizard);
    }
    
    // Добавляем правого соседа
    if (casterType === 'player') {
        const rightId = window.playerFormation[rightPos];
        if (rightId) {
            const rightWizard = window.playerWizards.find(w => w.id === rightId);
            if (rightWizard && rightWizard.hp > 0) neighbors.push(rightWizard);
        }
    } else {
        const rightWizard = window.enemyFormation[rightPos];
        if (rightWizard && rightWizard.hp > 0) neighbors.push(rightWizard);
    }
    
    return neighbors;
}
// --- Метеоритный дождь (Meteor Shower) - Тир 5, Множественный AOE по случайным целям ---
function castMeteorShower(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const strikeCount = level; // 1-5 ударов
    const baseDamage = [30, 40, 50, 60, 70][level - 1] || 30;
    
    let armorIgnorePercent = 0;
    if (level === 5) {
        armorIgnorePercent = 50;
        if (wizard.faction === 'earth') {
            armorIgnorePercent = 70;
        }
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☄️ ${wizard.name} вызывает Метеоритный дождь! ${strikeCount} метеорит${strikeCount > 1 ? 'а' : ''}, ${baseDamage} урона каждый${level === 5 ? `, игнорирует ${armorIgnorePercent}% брони` : ''}`);
    }
    
    // Наносим удары с задержкой между метеоритами
    for (let i = 0; i < strikeCount; i++) {
        setTimeout(() => {
            // Ищем случайную цель
            const target = typeof window.findRandomCombatTarget === 'function' ? 
                window.findRandomCombatTarget(casterType) : 
                (typeof window.findRandomTarget === 'function' ? window.findRandomTarget(casterType) : null);
            
            if (!target) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`☄️ Метеорит ${i + 1}: цель не найдена`);
                }
                return;
            }
            
            // Определяем колонку по типу цели
            const targetCol = target.type === 'wizard' ? 
                (casterType === 'player' ? 0 : 5) :  // маг
                (casterType === 'player' ? 1 : 4);   // призванный
            
            const targetRow = target.position;
            
            // Функция применения урона с защитой Энта
            function applyMeteorDamage() {
                // ИСПРАВЛЕНИЕ: Используем многоуровневую защиту (включая Энта)
                // Формируем объект цели в формате { wizard, position }
                const targetInfo = { wizard: target.wizard, position: target.position };

                if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
                    const result = window.applyDamageWithMultiLayerProtection(wizard, targetInfo, baseDamage, 'meteor_shower', casterType);

                    if (result) {
                        if (typeof window.addToBattleLog === 'function') {
                            window.addToBattleLog(`☄️ Метеорит ${i + 1} → ${target.wizard.name} (${result.finalDamage} урона)`);
                            // Показываем защитные слои
                            if (result.protectionLayers && result.protectionLayers.length > 0) {
                                result.protectionLayers.forEach(layer => {
                                    const isProtectionLayer = layer.includes('🐺') || layer.includes('🌳') || layer.includes('🧱') || layer.includes('💨') || layer.includes('защищает') || layer.includes('поглощает') || layer.includes('ослабляет');
                                    const isFinalWizardMessage = layer.includes(target.wizard.name) && (layer.includes('получает') || layer.includes('не получает')) && !isProtectionLayer;
                                    if (!isFinalWizardMessage) {
                                        window.addToBattleLog(`    ├─ ${layer}`);
                                    }
                                });
                            }
                            window.addToBattleLog(`    └─ HP: ${target.wizard.hp}/${target.wizard.max_hp}`);
                        }
                    }
                } else {
                    // Fallback на старую систему (без защиты Энтом)
                    const finalDamage = typeof window.applyFinalDamage === 'function' ?
                        window.applyFinalDamage(wizard, target.wizard, baseDamage, 'meteor_shower', armorIgnorePercent, true) : baseDamage;

                    target.wizard.hp -= finalDamage;
                    if (target.wizard.hp < 0) target.wizard.hp = 0;

                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`☄️ Метеорит ${i + 1} → ${target.wizard.name} (${finalDamage} урона)`);
                        const damageSteps = target.wizard._lastDamageSteps || [];
                        if (damageSteps.length > 0) {
                            damageSteps.forEach(step => {
                                window.addToBattleLog(`    ├─ ${step}`);
                            });
                        }
                        window.addToBattleLog(`    └─ HP: ${target.wizard.hp}/${target.wizard.max_hp}`);
                        delete target.wizard._lastDamageSteps;
                    }
                }
            }

            // Запускаем анимацию метеорита
            if (window.spellAnimations?.meteor?.play) {
                window.spellAnimations.meteor.play({
                    targetCol: targetCol,
                    targetRow: targetRow,
                    onHit: applyMeteorDamage
                });
            } else {
                // Fallback без анимации - наносим урон сразу
                applyMeteorDamage();
            }
            
        }, i * 800); // Задержка между метеоритами 800ms
    }
}

// Экспорт
window.castEarthSpell = castEarthSpell;
window.castPebble = castPebble;
window.castStoneSpike = castStoneSpike;
window.castEarthWall = castEarthWall;
window.castStoneGrotto = castStoneGrotto;
window.getWizardAndNeighbors = getWizardAndNeighbors;
window.castMeteorShower = castMeteorShower;
window.castPebbleSecondary = castPebbleSecondary;