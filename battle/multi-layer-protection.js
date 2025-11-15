// Обновлённая функция applyDamageWithMultiLayerProtection с отслеживанием точки столкновения

function applyDamageWithMultiLayerProtection(caster, target, baseDamage, spellId, casterType) {
    // Проверяем, есть ли цель и маг в ней
    if (!target || !target.wizard) {
        console.warn("⚠️ Цель не определена или не содержит мага — пропускаем нанесение урона");
        return null;
    }

    console.log(`🎯 Многослойная атака: ${caster.name} → ${target.wizard.name} (ряд ${target.position}), базовый урон: ${baseDamage}`);
    
    let remainingDamage = baseDamage;
    const protectionLayers = [];
    
    // ========================================
    // ОТСЛЕЖИВАНИЕ ТОЧКИ СТОЛКНОВЕНИЯ
    // ========================================
    let impactCol = null;
    let impactRow = target.position;
    
    // Определяем колонки для проверки
    const effectColumn = casterType === 'player' ? 2 : 3;
    const summonColumn = casterType === 'player' ? 1 : 4;
    
    // === СЛОЙ 1: КОЛОНКА ЭФФЕКТОВ (ЗЕМЛЯНЫЕ СТЕНЫ) ===
    console.log(`🛡️ Проверяем слой 1 - эффекты в колонке ${effectColumn}, ряд ${target.position}`);
    
    const earthWall = typeof window.findEarthWallAt === 'function' ? 
        window.findEarthWallAt(effectColumn, target.position) : null;
    
    if (earthWall && earthWall.hp > 0) {
        if (earthWall.casterType !== casterType) {
            const wallDamage = Math.min(remainingDamage, earthWall.hp);
            const wallRemainder = Math.max(0, remainingDamage - earthWall.hp);
            
            // ✅ ЕСЛИ СТЕНА ПОЛНОСТЬЮ БЛОКИРУЕТ - ТОЧКА СТОЛКНОВЕНИЯ НАЙДЕНА
            if (earthWall.hp >= remainingDamage) {
                impactCol = effectColumn;
                console.log(`💥 СТЕНА ДЕРЖИТ УДАР! Точка столкновения: колонка ${impactCol}, ряд ${impactRow}`);
            }
            
            if (typeof window.damageEarthWall === 'function') {
                window.damageEarthWall(earthWall.id, wallDamage);
            }
            
            protectionLayers.push(`Земляная стена поглощает ${wallDamage} урона`);
            remainingDamage = wallRemainder;
            console.log(`🧱 Земляная стена: ${wallDamage} поглощено, ${remainingDamage} остается`);
        } else {
            protectionLayers.push(`Земляная стена не блокирует заклинания своих магов`);
            console.log(`🧱 Стена принадлежит ${casterType} — пропускаем`);
        }
    }
    
    // === ПРОВЕРКА ВЕТРЯНОЙ СТЕНЫ ===
    const windWall = typeof window.findWindWallAt === 'function' ? 
        window.findWindWallAt(effectColumn, target.position) : null;
        
    if (windWall && windWall.casterType !== casterType) {
        const reduction = Math.round(remainingDamage * windWall.weakenPercent / 100);
        remainingDamage = remainingDamage - reduction;
        protectionLayers.push(`Ветряная стена ослабляет урон на ${reduction} (-${windWall.weakenPercent}%)`);
        console.log(`💨 Ветряная стена: урон ослаблен на ${reduction}, остается ${remainingDamage}`);
    }
    
    // === СЛОЙ 2: КОЛОНКА ПРИЗВАННЫХ ===
    if (remainingDamage > 0) {
        console.log(`🛡️ Проверяем слой 2 - призванные в колонке ${summonColumn}, ряд ${target.position}`);
    
        // Проверяем призванных существ
        const summonedCreature = typeof window.findSummonedCreatureAt === 'function' ? 
            window.findSummonedCreatureAt(summonColumn, target.position) : null;
    
        if (summonedCreature && summonedCreature.hp > 0) {
            const creatureDamage = Math.min(remainingDamage, summonedCreature.hp);
            const creatureRemainder = Math.max(0, remainingDamage - summonedCreature.hp);
            
            // ✅ ЕСЛИ ПРИЗВАННЫЙ ПОЛНОСТЬЮ БЛОКИРУЕТ - ТОЧКА СТОЛКНОВЕНИЯ НАЙДЕНА
            if (impactCol === null && summonedCreature.hp >= remainingDamage) {
                impactCol = summonColumn;
                console.log(`💥 ПРИЗВАННЫЙ ДЕРЖИТ УДАР! Точка столкновения: колонка ${impactCol}, ряд ${impactRow}`);
            }
            
            // Наносим урон призванному существу
            summonedCreature.hp -= creatureDamage;
            if (summonedCreature.hp < 0) summonedCreature.hp = 0;
            
            // УЛУЧШЕННОЕ ЛОГИРОВАНИЕ с указанием типа существа и защищаемой цели
            let protectionMessage = '';
            if (summonedCreature.type === 'nature_wolf') {
                protectionMessage = `🐺 Волк защищает ${target.wizard.name} и получает ${creatureDamage} урона`;
            } else if (summonedCreature.type === 'nature_ent') {
                protectionMessage = `🌳 Энт защищает ${target.wizard.name} и поглощает ${creatureDamage} урона`;
            } else {
                protectionMessage = `${summonedCreature.name || 'Призванное существо'} защищает ${target.wizard.name} и получает ${creatureDamage} урона`;
            }
        
            // Добавляем информацию об оставшемся HP существа
            if (summonedCreature.hp > 0) {
                protectionMessage += ` (осталось ${summonedCreature.hp}/${summonedCreature.maxHP || summonedCreature.hp} HP)`;
            } else {
                protectionMessage += ` и погибает!`;
            }
            
            protectionLayers.push(protectionMessage);
            remainingDamage = creatureRemainder;
            
            console.log(`👹 ${summonedCreature.name || 'Существо'}: ${creatureDamage} получено, ${remainingDamage} остается`);
            
            // Проверяем уничтожение существа
            if (summonedCreature.hp <= 0) {
                // Специальное сообщение для разных типов существ
                let deathMessage = '';
                if (summonedCreature.type === 'nature_wolf') {
                    deathMessage = `💀 Волк погиб, защищая ${target.wizard.name}!`;
                } else if (summonedCreature.type === 'nature_ent') {
                    deathMessage = `💀 Энт разрушен, защищая ${target.wizard.name}!`;
                    // Если это Энт 5 уровня - лечим союзника
                    if (summonedCreature.level === 5 && typeof window.healWeakestAlly === 'function') {
                        window.healWeakestAlly(summonedCreature.casterType);
                        deathMessage += ' Энт исцеляет союзника перед смертью!';
                    }
                } else {
                    deathMessage = `💀 ${summonedCreature.name || 'Призванное существо'} уничтожено!`;
                }
                
                // Удаляем существо через менеджер если доступен
                if (window.summonsManager) {
                    window.summonsManager.killSummon(summonedCreature.id);
                } else if (window.activeSummons && summonedCreature.id) {
                    // Fallback на старую систему
                    window.activeSummons = window.activeSummons.filter(s => s.id !== summonedCreature.id);
                }
                
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(deathMessage);
                }
            }
            
            // Если урон полностью поглощен
            if (remainingDamage === 0) {
                const fullBlockMessage = summonedCreature.type === 'nature_wolf' ? 
                    `🐺 Волк полностью защитил ${target.wizard.name} от атаки!` :
                    summonedCreature.type === 'nature_ent' ?
                    `🌳 Энт полностью поглотил урон за ${target.wizard.name}!` :
                    `${summonedCreature.name} полностью защитил ${target.wizard.name}!`;
                    
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(fullBlockMessage);
                }
            }
        }
    }
    
    // === СЛОЙ 3: ЦЕЛЬ (МАГ) ===
    // ✅ ЕСЛИ ДОШЛИ ДО МАГА - ЭТО ТОЧКА СТОЛКНОВЕНИЯ
    if (impactCol === null) {
        impactCol = casterType === 'player' ? 0 : 5;
        console.log(`💥 Снаряд достиг мага! Точка столкновения: колонка ${impactCol}, ряд ${impactRow}`);
    }
    
    if (remainingDamage > 0) {
        console.log(`⚔️ Применяем финальный урон к цели: ${remainingDamage}`);

        // СНАЧАЛА проверка Метеокинеза для стихийных заклинаний
        if (window.activeMeteorokinesis && spellId) {
            const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
            
            if (['fire', 'water', 'wind', 'earth'].includes(spellSchool)) {
                const activeEffect = window.activeMeteorokinesis.find(m => 
                    m.isActive && m.casterType === casterType
                );
                
                if (activeEffect) {
                    const oldDamage = remainingDamage;
                    remainingDamage = Math.floor(remainingDamage * (1 + activeEffect.damageBonus / 100));
                    protectionLayers.push(`Метеокинез усиливает урон: ${oldDamage} → ${remainingDamage} (+${activeEffect.damageBonus}%)`);
                    console.log(`🌿 Метеокинез усиливает ${spellId}: ${oldDamage} → ${remainingDamage} (+${activeEffect.damageBonus}%)`);
                }
            }
        }
    
        // ПОТОМ применяем сопротивления и броню
        const finalDamage = typeof window.applyDamageWithEffects === 'function' ?
            window.applyDamageWithEffects(caster, target.wizard, remainingDamage, spellId, 0) : remainingDamage;

        // Применяем урон к магу
        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        
        // Обновляем HP бар
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
            // Определяем колонку по типу цели (не атакующего!)
            const targetCol = target.wizard.id && target.wizard.id.startsWith('enemy_') ? 0 : 5;
            const row = target.position;
            const key = `${targetCol}_${row}`;
            window.pixiWizards.updateHP(key, target.wizard.hp, target.wizard.max_hp);
            console.log(`💚 Обновлен HP бар для ${key}: ${target.wizard.hp}/${target.wizard.max_hp}`);
        }
    
        protectionLayers.push(`${target.wizard.name} получает ${finalDamage} финального урона`);
        console.log(`🎯 Цель получает: ${finalDamage} урона (${target.wizard.hp}/${target.wizard.max_hp})`);
        
        return {
            totalDamage: baseDamage,
            finalDamage: finalDamage,
            blocked: baseDamage - remainingDamage,
            protectionLayers: protectionLayers,
            targetSurvived: target.wizard.hp > 0,
            impactCol: impactCol,      // ✅ ДОБАВЛЕНО
            impactRow: impactRow       // ✅ ДОБАВЛЕНО
        };
    } else {
        protectionLayers.push(`${target.wizard.name} не получает урона - защита поглотила все!`);
        console.log(`🛡️ Полная защита: ${baseDamage} урона поглощено, цель не пострадала`);
        
        return {
            totalDamage: baseDamage,
            finalDamage: 0,
            blocked: baseDamage,
            protectionLayers: protectionLayers,
            targetSurvived: true,
            impactCol: impactCol,      // ✅ ДОБАВЛЕНО
            impactRow: impactRow       // ✅ ДОБАВЛЕНО
        };
    }
}

// --- Логирование результата защиты ---
function logProtectionResult(caster, target, result, spellName) {
    if (!target || !target.wizard) {
        console.warn("⚠️ Невозможно залогировать результат — цель не содержит мага");
        return;
    }

    if (!window.addToBattleLog || !result) return;
    
    // Определяем уровень заклинания из названия
    const spellLevel = spellName.match(/\d+/) ? spellName.match(/\d+/)[0] : '';
    const spellDisplayName = spellLevel ? `${spellName.replace(/\d+/, '').trim()} ${spellLevel}ур` : spellName;
    
    // Основная строка
    const mainLog = `🎯 ${target.wizard.name} получает от ${caster.name} ${result.finalDamage} урона (${spellDisplayName})`;
    window.addToBattleLog(mainLog);
    
    // Детальный расчёт с отступами
    // Показываем защитные слои
    if (result.protectionLayers && result.protectionLayers.length > 0) {
        result.protectionLayers.forEach(layer => {
            // Показываем ВСЕ сообщения о защите (волки, стены, энты)
            // Пропускаем только итоговое сообщение о маге
            const isProtectionLayer = layer.includes('🐺') || layer.includes('🌳') || layer.includes('🧱') || layer.includes('💨') || layer.includes('защищает') || layer.includes('поглощает') || layer.includes('ослабляет');
            const isFinalWizardMessage = layer.includes(target.wizard.name) && (layer.includes('получает') || layer.includes('не получает')) && !isProtectionLayer;
            
            if (!isFinalWizardMessage) {
                window.addToBattleLog(`    ├─ ${layer}`);
            }
        });
    }
    
    // Показываем модификаторы урона
    if (target.wizard._lastDamageSteps && target.wizard._lastDamageSteps.length > 0) {
        target.wizard._lastDamageSteps.forEach(step => {
            window.addToBattleLog(`    ├─ ${step}`);
        });
        delete target.wizard._lastDamageSteps; // Очищаем
    }
    
    // Итоговое HP
    window.addToBattleLog(`    └─ Осталось HP: ${target.wizard.hp}/${target.wizard.max_hp}`);
}

// Экспорт
window.applyDamageWithMultiLayerProtection = applyDamageWithMultiLayerProtection;
window.logProtectionResult = logProtectionResult;