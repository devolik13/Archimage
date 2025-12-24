// battle/spells/spells-fire.js - Заклинания школы огня (адаптированная под новую структуру)


function castFireSpell(wizard, spellId, spellData, position, casterType) {
    switch (spellId) {
        case 'spark':
            castSpark(wizard, spellData, position, casterType);
            break;
        case 'firebolt':
            castFirebolt(wizard, spellData, position, casterType);
            break;
        case 'fire_wall':
            castFireWall(wizard, spellData, position, casterType);
            break;
	case 'fireball':
    	    castFireball(wizard, spellData, position, casterType);
    	    break;
	case 'fire_tsunami':
    	    castFireTsunami(wizard, spellData, position, casterType);
	    break;
        default:
            console.log(`⚠️ Заклинание огня ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Искра (Spark) - Тир 1, Single Target ---
// НОВАЯ ВЕРСИЯ с правильной визуализацией через слои защиты
function castSpark(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;

    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        return;
    }

    // Запускаем через новую систему
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'spark',
        baseDamage: baseDamage,
        spellLevel: level,
        
        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;

            if (window.createSparkProjectile) {
                // Передаём toCol как точку столкновения (а не колонку мага!)
                window.createSparkProjectile(fromCol, fromRow, toCol, toRow, onHit);
            } else {
                setTimeout(onHit, 300);
            }
        },

        // Применение эффектов после урона
        applyEffects: (targetWizard, spellLevel, casterFaction) => {
            if (casterFaction === 'fire' && window.tryApplyEffect) {
                const casterInfo = {
                    faction: wizard.faction,
                    casterType: casterType,
                    position: position
                };
                window.tryApplyEffect('burning', targetWizard, false, casterInfo);
            }
        },
        
        // Callback после завершения всей цепочки
        onComplete: (finalResult) => {

            // ЭФФЕКТ 5 УРОВНЯ: 50% шанс повторной атаки
            if (level === 5 && Math.random() < 0.5) {
                
                setTimeout(() => {
                    const newTarget = window.findTarget?.(position, casterType);
                    if (newTarget) {
                        castSparkSecondary(wizard, spellData, position, casterType, newTarget);
                    }
                }, 400);
            }
        }
    });
}

// Вторичная атака для 5 уровня (без рекурсии)
function castSparkSecondary(wizard, spellData, position, casterType, target) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;

    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'spark',
        baseDamage: baseDamage,
        spellLevel: level,
        
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;
            if (window.createSparkProjectile) {
                window.createSparkProjectile(fromCol, fromRow, toCol, toRow, onHit);
            } else {
                setTimeout(onHit, 300);
            }
        },
        
        applyEffects: (targetWizard, spellLevel, casterFaction) => {
            if (casterFaction === 'fire' && window.tryApplyEffect) {
                window.tryApplyEffect('burning', targetWizard, false);
            }
        },
        
        onComplete: () => {}
    });
}

// --- Огненная стрела (Firebolt) - ФИНАЛЬНАЯ ВЕРСИЯ ---
function castFirebolt(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // ШАГ 1: Определяем количество и урон стрел
    let arrowsConfig;
    switch (level) {
        case 1: arrowsConfig = [{ damage: 7, target: 'front' }, { damage: 7, target: 'random' }]; break;
        case 2: arrowsConfig = [{ damage: 9, target: 'front' }, { damage: 9, target: 'random' }]; break;
        case 3: arrowsConfig = [{ damage: 8, target: 'front' }, { damage: 8, target: 'random' }, { damage: 8, target: 'random' }]; break;
        case 4: arrowsConfig = [{ damage: 10, target: 'front' }, { damage: 10, target: 'random' }, { damage: 10, target: 'random' }]; break;
        case 5: arrowsConfig = [
            { damage: 8, target: 'front' },
            { damage: 8, target: 'random' },
            { damage: 8, target: 'random' },
            { damage: 8, target: 'random' },
            { damage: 8, target: 'random' }
        ]; break;
    }
    
    // Эффект 5 уровня: 20% шанс на 3 дополнительные стрелы
    if (level === 5 && Math.random() < 0.2) {
        arrowsConfig.push(
            { damage: 8, target: 'random' },
            { damage: 8, target: 'random' },
            { damage: 8, target: 'random' }
        );
    }
    
    // ШАГ 2: Определяем цели и вычисляем координаты столкновения
    const arrowsWithTargets = [];
    const targetCol = casterType === 'player' ? 0 : 5;
    
    for (let i = 0; i < arrowsConfig.length; i++) {
        const config = arrowsConfig[i];
        let targetRow;
        let targetWizard = null;
        
        // Определяем целевой ряд
        if (config.target === 'front') {
            // Для 'front' - ищем ближайшего мага
            const frontTarget = typeof window.findTarget === 'function' ? 
                window.findTarget(position, casterType) : null;
            
            if (frontTarget) {
                targetRow = frontTarget.position;
                targetWizard = frontTarget.wizard;
            } else {
                // Если не нашли - берем случайный ряд
                targetRow = Math.floor(Math.random() * 5);
            }
        } else {
            // Для 'random' - ВСЕГДА случайный ряд (0-4)
            targetRow = Math.floor(Math.random() * 5);
            
            // Проверяем есть ли там маг (для логов)
            if (typeof window.findWizardAt === 'function') {
                targetWizard = window.findWizardAt(targetCol, targetRow);
            }
        }
        
        // Создаем виртуальную цель для этого ряда
        const virtualTarget = {
            wizard: targetWizard || { 
                hp: 0, 
                max_hp: 0, 
                name: 'Пустота',
                id: `virtual_${targetCol}_${targetRow}`
            },
            position: targetRow
        };
        
        // Вычисляем точку столкновения через многослойную защиту
        const result = typeof window.applyDamageWithMultiLayerProtection === 'function' ?
            window.applyDamageWithMultiLayerProtection(wizard, virtualTarget, config.damage, 'firebolt', casterType) :
            null;
        
        if (result) {
            // Успешно прошли через многослойную защиту
            arrowsWithTargets.push({
                target: virtualTarget,
                damage: config.damage,
                impactCol: result.impactCol,
                impactRow: result.impactRow,
                result: result
            });
            
            // Логируем результат (только если был урон)
            if (result.finalDamage > 0) {
                if (typeof window.logProtectionResult === 'function') {
                    window.logProtectionResult(wizard, virtualTarget, result, `Огненная стрела ${i+1}`);
                }
                
                // Применяем эффект горения
                if (targetWizard && wizard.faction === 'fire') {
                    window.tryApplyEffect?.('burning', targetWizard, false);
                }
            }
        } else {
            // Fallback: если многослойная защита не работает
            // Если есть маг - наносим урон
            if (targetWizard) {
                const finalDamage = window.applyFinalDamage ? 
                    window.applyFinalDamage(wizard, targetWizard, config.damage, 'firebolt', 0, false) : config.damage;
                
                targetWizard.hp -= finalDamage;
                if (targetWizard.hp < 0) targetWizard.hp = 0;
                
                arrowsWithTargets.push({
                    target: virtualTarget,
                    damage: config.damage,
                    impactCol: targetCol,
                    impactRow: targetRow,
                    result: { finalDamage: finalDamage }
                });
                
                if (typeof window.logSpellHit === 'function') {
                    window.logSpellHit(wizard, targetWizard, finalDamage, `Огненная стрела ${i+1}`);
                }
                
                if (wizard.faction === 'fire') {
                    window.tryApplyEffect?.('burning', targetWizard, false);
                }
            } else {
                // Пустой ряд - просто добавляем координаты для визуализации
                arrowsWithTargets.push({
                    target: virtualTarget,
                    damage: 0,
                    impactCol: targetCol,
                    impactRow: targetRow,
                    result: { finalDamage: 0 }
                });
            }
        }
    }

    // ШАГ 3: Запускаем анимацию с точными координатами
    const casterCol = casterType === 'player' ? 5 : 0;
    
    if (window.spellAnimations?.firebolt?.play) {
        window.spellAnimations.firebolt.play({
            casterType: casterType,
            casterPosition: position,
            casterCol: casterCol,
            level: level,
            arrows: arrowsWithTargets  // ✅ Передаём массив с точными координатами
        });
    } else if (window.spellRegistry?.play) {
        window.spellRegistry.play('firebolt', {
            casterType: casterType,
            casterPosition: position,
            casterCol: casterCol,
            level: level,
            arrows: arrowsWithTargets
        });
    }
}

// --- Огненная стена (Fire Wall) - Тир 3, AOE/Utility ---
function castFireWall(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 11, 12, 14, 15][level - 1] || 10;

    const target = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    let centerPosition = position;
    if (target) centerPosition = target.position;

    if (typeof window.createOrUpdateFireWall === 'function') {
        window.createOrUpdateFireWall(
            wizard.id,
            casterType, 
            wizard.faction,
            centerPosition,
            baseDamage,
            level
        );
    } else {
        console.error("Функция createOrUpdateFireWall не найдена.");
        if (target) {
            const finalDamage = window.applyFinalDamage ? 
                window.applyFinalDamage(wizard, target.wizard, baseDamage, 'fire_wall', 0, true) : baseDamage;
                
            target.wizard.hp -= finalDamage;
            if (target.wizard.hp < 0) target.wizard.hp = 0;
            
            if (typeof window.logSpellHit === 'function') {
                window.logSpellHit(wizard, target.wizard, finalDamage, 'Огненная стена (фоллбэк)');
            }
        }
    }
}


// --- Огненный шар (Fireball) - Тир 4, AOE 3x3 → территория врага ---
function castFireball(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [20, 30, 40, 50, 50][level - 1] || 20;
    
    const target = typeof window.findTarget === 'function' ? window.findTarget(position, casterType) : null;
    if (!target) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🔥 ${wizard.name} использует Огненный шар, но цель не найдена`);
        }
        return;
    }
    
    // Вызов анимации ОДИН РАЗ с позицией кастера
    if (window.spellRegistry?.play) {
        window.spellRegistry.play('fireball', {
            casterType: casterType,
            casterPosition: position,  // позиция мага-кастера (0-4)
            targetCol: target.position,  
            targetRow: target.position,
            level: level
        });
    }
    // Определяем центр взрыва: одна клетка ПЕРЕД целью
    let centerCol, centerRow;
    if (casterType === 'player') {
        centerCol = 1; // перед врагом (колонка 0 → центр в 1)
        centerRow = target.position;
    } else {
        centerCol = 4; // перед игроком (колонка 5 → центр в 4)
        centerRow = target.position;
    }
    
    // Определяем зону
    let targets = [];
    if (level === 5) {
        // Вся территория врага: 3 колонки × 5 рядов
        targets = typeof window.findTargetsInArea === 'function' ?
            window.findTargetsInArea(centerCol, centerRow, 0, 0, casterType, true) : [];
    } else {
        // 3x3 зона
        targets = typeof window.findTargetsInArea === 'function' ?
            window.findTargetsInArea(centerCol, centerRow, 3, 3, casterType) : [];
    }
    
    // Сортируем цели по HP% (слабейший первый) для приоритета защиты Энтом
    const sortedTargets = window.sortTargetsByHpPercent ? window.sortTargetsByHpPercent(targets) : targets;

    // Наносим урон с многоуровневой защитой
    sortedTargets.forEach(targetInfo => {
        // ИСПРАВЛЕНИЕ: Используем многоуровневую защиту для детального логирования
        if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
            const result = window.applyDamageWithMultiLayerProtection(wizard, targetInfo, baseDamage, 'fireball', casterType);

            if (result) {
                // Детальное логирование через logProtectionResult
                if (typeof window.logProtectionResult === 'function') {
                    window.logProtectionResult(wizard, targetInfo, result, 'Огненный шар');
                }

                // Эффект горения для фракции Огонь
                if (wizard.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                    window.tryApplyEffect('burning', targetInfo.wizard, false);
                }
            }
        } else {
            // Fallback на старую систему
            const finalDamage = typeof window.applyFinalDamage === 'function' ?
                window.applyFinalDamage(wizard, targetInfo.wizard, baseDamage, 'fireball', 0, true) : baseDamage;

            targetInfo.wizard.hp -= finalDamage;
            if (targetInfo.wizard.hp < 0) targetInfo.wizard.hp = 0;

            if (typeof window.logSpellHit === 'function') {
                window.logSpellHit(wizard, targetInfo.wizard, finalDamage, 'Огненный шар');
            } else if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🔥 ${targetInfo.wizard.name} получает ${finalDamage} урона от Огненного шара (${targetInfo.wizard.hp}/${targetInfo.wizard.max_hp})`);
            }

            // Эффект горения для фракции Огонь
            if (wizard.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                window.tryApplyEffect('burning', targetInfo.wizard, false);
            }
        }
    });
    if (window.spellRegistry?.play) {
    	window.spellRegistry.play('fireball', {
    	    casterType: casterType,
    	    casterPosition: position,  // Позиция мага-кастера
    	    targetCol: target.position,  
    	    targetRow: target.position,
    	    level: level,
    	    onComplete: () => {}
    	});
    }
    // Лог общего эффекта
    if (typeof window.addToBattleLog === 'function') {
        const areaDesc = level === 5 ? 'вся территория врага' : 'зона 3×3';
        window.addToBattleLog(`🔥 ${wizard.name} выпускает Огненный шар (${areaDesc}, ${baseDamage} урона)`);
    }
}

// --- Огненное цунами (Fire Tsunami) - Тир 5, движущаяся AOE волна ---
function castFireTsunami(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [30, 40, 50, 60, 70][level - 1] || 30;
    
    if (window.activeTsunamis && window.activeTsunamis.some(ts => ts.casterId === wizard.id)) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌊 ${wizard.name} уже имеет активное Цунами`);
        }
        return;
    }
    
    const startColumn = casterType === 'player' ? 0 : 5;
    
    const tsunami = {
        id: `tsunami_${wizard.id}_${Date.now()}`,
        type: 'fire_tsunami',
        casterId: wizard.id,
        casterType: casterType,
        casterFaction: wizard.faction,
        currentColumn: startColumn,
        damage: baseDamage,
        level: level,
        isActive: true,
        justCreated: true  // ДОБАВИТЬ: флаг первого хода
    };
    
    if (!window.activeTsunamis) window.activeTsunamis = [];
    window.activeTsunamis.push(tsunami);
    
    // Анимация создания
    if (window.spellAnimations?.fire_tsunami?.play) {
        window.spellAnimations.fire_tsunami.play({
            casterType: casterType,
            casterPosition: position,
            level: level,
            tsunamiId: tsunami.id
        });
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌊 ${wizard.name} призывает Огненное цунами в колонке ${startColumn}!`);
    }
    
    // Наносим урон при создании
    if (typeof window.applyTsunamiDamage === 'function') {
        window.applyTsunamiDamage(tsunami);
    }
    
    // НЕ двигаем в первый ход!
}
// Экспорт
// НОВОЕ
window.castFireSpell = castFireSpell;
window.castSpark = castSpark;
window.castSparkSecondary = castSparkSecondary;
window.castFirebolt = castFirebolt;
window.castFireWall = castFireWall;
window.castFireball = castFireball;
window.castFireTsunami = castFireTsunami;