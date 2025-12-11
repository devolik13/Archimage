// battle/systems/damage-system.js - Централизованная система урона с благословениями и Метеокинезом

/**
 * Сортировка целей AOE по % HP (слабейший первый)
 * Используется для приоритета защиты Энтом
 * @param {Array} targets - массив объектов {wizard, position, ...}
 * @returns {Array} - отсортированный массив (слабейший первый)
 */
function sortTargetsByHpPercent(targets) {
    if (!Array.isArray(targets) || targets.length <= 1) return targets;

    return [...targets].sort((a, b) => {
        const wizardA = a.wizard || a;
        const wizardB = b.wizard || b;

        const hpPercentA = (wizardA.hp || 0) / (wizardA.max_hp || 1);
        const hpPercentB = (wizardB.hp || 0) / (wizardB.max_hp || 1);

        return hpPercentA - hpPercentB; // Слабейший первый
    });
}

// Экспорт хелпера
window.sortTargetsByHpPercent = sortTargetsByHpPercent;

// Временная функция определения школы заклинания (если основная не загружена)
if (!window.getSpellSchoolFallback) {
    window.getSpellSchoolFallback = function(spellId) {
        if (!spellId) return null;
        
        // Огонь
        if (['spark', 'firebolt', 'fireball', 'fire_wall', 'fire_tsunami'].includes(spellId)) {
            return 'fire';
        }
        // Вода
        if (['icicle', 'frost_arrow', 'ice_rain', 'blizzard', 'absolute_zero'].includes(spellId)) {
            return 'water';
        }
        // Ветер
        if (['gust', 'wind_blade', 'wind_wall', 'storm_cloud', 'ball_lightning'].includes(spellId)) {
            return 'wind';
        }
        // Земля
        if (['pebble', 'stone_spike', 'earth_wall', 'stone_grotto', 'meteor_shower'].includes(spellId)) {
            return 'earth';
        }
        // Природа
        if (['call_wolf', 'bark_armor', 'leaf_canopy', 'ent', 'meteorokinesis'].includes(spellId)) {
            return 'nature';
        }
        // Яд
        if (['poisoned_blade', 'poisoned_glade', 'foul_cloud', 'plague', 'epidemic'].includes(spellId)) {
            return 'poison';
        }
        
        return null;
    };
}

// --- ОСНОВНАЯ ФУНКЦИЯ ПРИМЕНЕНИЯ УРОНА ---
function applyFinalDamage(caster, target, baseDamage, spellId, armorIgnorePercent = 0, isAOE = false) {
    console.log('🔍 DEBUG applyFinalDamage:', {
    	hasMeteorokinesis: !!window.activeMeteorokinesis,
    	meteorokinesisArray: window.activeMeteorokinesis,
    	hasGetSpellSchool: !!window.getSpellSchoolFallback,
    	spellId: spellId,
    	spellSchool: window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : 'NO_FUNCTION'
    });
    console.log('applyFinalDamage вызвана:', {
        caster: caster?.name,
        target: target?.name,
        baseDamage,
        spellId,
        isAOE
    });
    
    // Для AOE — сразу применяем погоду и эффекты (игнорируем многослойную защиту)
    if (isAOE) {
    	let finalDamage = baseDamage;
    
    	// СНАЧАЛА применяем Метеокинез к базовому урону
    	if (window.activeMeteorokinesis && spellId) {
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        
    	    if (['fire', 'water', 'wind', 'earth'].includes(spellSchool)) {
    	        const activeEffect = window.activeMeteorokinesis.find(m => 
    	            m.isActive && m.casterType === (caster.casterType || 'player')
    	        );
    	        
    	        if (activeEffect) {
    	            const oldDamage = finalDamage;
    	            finalDamage = Math.floor(finalDamage * (1 + activeEffect.damageBonus / 100));
    	            
    	            if (typeof window.addToBattleLog === 'function') {
    	                window.addToBattleLog(`🌿 Метеокинез усиливает заклинание: ${oldDamage} → ${finalDamage} (+${activeEffect.damageBonus}%)`);
    	            }
    	        }
    	    }
    	}
    	
    	// ПОТОМ применяем погоду, сопротивление и броню
    	finalDamage = applyDamageWithWeather(caster, target, finalDamage, spellId, armorIgnorePercent);
    	
    	// Применяем бонус урона от уровня мага
    	if (typeof window.getDamageBonusFromLevel === 'function') {
    	    const levelBonus = window.getDamageBonusFromLevel(caster);
    	    finalDamage = Math.floor(finalDamage * levelBonus);
    	}

    	// ГИЛЬДИЯ: Бонус урона от гильдии
    	if (caster.casterType === 'player' && window.guildManager?.currentGuild) {
    	    const guildBonuses = window.guildManager.getGuildBonuses();
    	    if (guildBonuses && guildBonuses.damageBonus > 0) {
    	        const guildDamageMultiplier = 1 + (guildBonuses.damageBonus / 100);
    	        finalDamage = Math.floor(finalDamage * guildDamageMultiplier);
    	    }
    	}

    	// ГИЛЬДИЯ: Сопротивление от гильдии (уменьшение входящего урона)
    	if (target.guildResistances) {
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
    	    if (spellSchool && target.guildResistances[spellSchool] > 0) {
    	        const resistMultiplier = 1 - (target.guildResistances[spellSchool] / 100);
    	        finalDamage = Math.floor(finalDamage * resistMultiplier);
    	    }
    	}

        // Начисляем опыт за урон (используем базовый урон)
        if (typeof window.trackDamageExp === 'function' && baseDamage > 0) {
            window.trackDamageExp(caster, baseDamage);
        }

        return finalDamage;
    }
    
    // Для Single Target — пробуем многослойную защиту (если функция существует)
    if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
        const result = window.applyDamageWithMultiLayerProtection(caster, target, baseDamage, spellId, caster.casterType || 'player');
        if (result) {
            // Начисляем опыт за урон
            if (typeof window.trackDamageExp === 'function' && baseDamage > 0) {
                window.trackDamageExp(caster, baseDamage);
            }
            return result.finalDamage;
        }
    }
    
    // Фоллбэк - используем стандартную систему урона
    let finalDamage = applyDamageWithWeather(caster, target, baseDamage, spellId, armorIgnorePercent);
    
    // Применяем множитель урона от Каменного грота (если есть)
    if (target && target.spellDamageMultiplier !== undefined) {
        finalDamage = Math.floor(finalDamage * target.spellDamageMultiplier);
    }
    
    // Применяем бонус Метеокинеза для стихийных заклинаний
    if (window.activeMeteorokinesis && spellId) {
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        
        if (['fire', 'water', 'wind', 'earth'].includes(spellSchool)) {
            const activeEffect = window.activeMeteorokinesis.find(m => 
                m.isActive && m.casterType === (caster.casterType || 'player')
            );
            
            if (activeEffect) {
                const oldDamage = finalDamage;
                finalDamage = Math.floor(finalDamage * (1 + activeEffect.damageBonus / 100));
                console.log(`🌿 Метеокинез усиливает ${spellId}: ${oldDamage} → ${finalDamage} (+${activeEffect.damageBonus}%)`);
                
                // Визуальный эффект усиления
                if (window.spellAnimations?.meteorokinesis?.showBoost) {
                    window.spellAnimations.meteorokinesis.showBoost(caster, target);
                }
            }
        }
    }
    
    // Применяем бонус от Башни магов
    if (typeof window.getWizardTowerDamageBonus === 'function') {
        const towerBonus = window.getWizardTowerDamageBonus();
        if (towerBonus > 1.0) {
            finalDamage = Math.floor(finalDamage * towerBonus);
            console.log(`🏰 Башня магов: урон ×${towerBonus}`);
        }
    }
    
    // Применяем бонус урона от уровня мага
    if (typeof window.getDamageBonusFromLevel === 'function') {
        const levelBonus = window.getDamageBonusFromLevel(caster);
        finalDamage = Math.floor(finalDamage * levelBonus);
        if (levelBonus > 1.0) {
            console.log(`⭐ Бонус уровня ${caster.level}: урон ×${levelBonus.toFixed(2)}`);
        }
    }

    // ГИЛЬДИЯ: Бонус урона от гильдии
    if (caster.casterType === 'player' && window.guildManager?.currentGuild) {
        const guildBonuses = window.guildManager.getGuildBonuses();
        if (guildBonuses && guildBonuses.damageBonus > 0) {
            const guildDamageMultiplier = 1 + (guildBonuses.damageBonus / 100);
            finalDamage = Math.floor(finalDamage * guildDamageMultiplier);
            console.log(`🏰 Гильдия: урон +${guildBonuses.damageBonus}%`);
        }
    }

    // ГИЛЬДИЯ: Сопротивление от гильдии (уменьшение входящего урона)
    if (target?.guildResistances) {
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        if (spellSchool && target.guildResistances[spellSchool] > 0) {
            const resistPercent = target.guildResistances[spellSchool];
            const resistMultiplier = 1 - (resistPercent / 100);
            finalDamage = Math.floor(finalDamage * resistMultiplier);
            console.log(`🛡️ Гильдия: сопротивление ${spellSchool} -${resistPercent}% урона`);
        }
    }

    // Проверка на Энта — перехват урона (теперь работает и для AOE!)
    if (target) {
        const ent = typeof window.findProtectingEnt === 'function' ?
            window.findProtectingEnt(target, caster.casterType || 'player') : null;
        if (ent && ent.isAlive) {
            // Перенаправляем урон Энту
            const absorbed = Math.min(ent.hp, finalDamage);
            ent.hp -= absorbed;

            // Обновляем HP бар Энта
            if (window.summonsManager && typeof window.summonsManager.updateHP === 'function') {
                window.summonsManager.updateHP(ent.id, ent.hp);
            }

            if (typeof window.addToBattleLog === 'function') {
                const aoeLabel = isAOE ? ' (AOE)' : '';
                window.addToBattleLog(`🌳 Энт поглощает ${absorbed} урона${aoeLabel} за ${target.name} (осталось ${ent.hp}/${ent.maxHP})`);
            }

            // Если Энт умирает
            if (ent.hp <= 0) {
                ent.isAlive = false;
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌳 Энт погибает, защищая ${target.name}`);
                }

                // Убиваем через менеджер для визуала
                if (window.summonsManager && typeof window.summonsManager.killSummon === 'function') {
                    window.summonsManager.killSummon(ent.id);
                }

                // На 5 уровне — лечим самого слабого союзного мага
                if (ent.level === 5 && typeof window.healWeakestAlly === 'function') {
                    window.healWeakestAlly(ent.casterType);
                }
            }

            // Остаток урона (если есть) → наносится цели
            const remainingDamage = finalDamage - absorbed;
            if (remainingDamage > 0) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌳 Остаток урона (${remainingDamage}) достигает ${target.name}`);
                }
                // Начисляем опыт только если урон дошел до цели
                if (typeof window.trackDamageExp === 'function' && baseDamage > 0) {
                    window.trackDamageExp(caster, baseDamage);
                }
                return remainingDamage;
            } else {
                return 0; // урон полностью поглощён
            }
        }
    }
    
    // Начисляем опыт за урон (используем базовый урон без модификаторов)
    if (typeof window.trackDamageExp === 'function' && baseDamage > 0) {
        window.trackDamageExp(caster, baseDamage);
    }
    
    console.log('applyFinalDamage возвращает:', finalDamage);
    return finalDamage;
}

// --- Применение урона с погодой ---
function applyDamageWithWeather(caster, target, baseDamage, spellId, armorIgnorePercent = 0) {
    let damage = baseDamage;
    
    // Применяем погоду (если есть) — ИГНОРИРУЕМ для фракции Природа
    if (typeof window.applyWeatherBonus === 'function' && caster && caster.faction && caster.faction !== 'nature') {
        damage = window.applyWeatherBonus(caster.faction, damage);
    }
    
    // Применяем эффекты и броню
    return applyDamageWithEffects(caster, target, damage, spellId, armorIgnorePercent);
}

// --- Применение урона с эффектами, сопротивлением и бронёй ---
function applyDamageWithEffects(caster, target, baseDamage, spellId = 'basic', armorIgnorePercent = 0) {
    let finalDamage = baseDamage;
    const damageSteps = []; // Массив для хранения шагов расчёта
    
    // 1. Учет охлаждения/заморозки на КАСТЕРЕ
    if (caster && caster.effects && caster.effects.chilled_caster && caster.effects.chilled_caster.spellsLeft > 0) {
        const oldDamage = finalDamage;
        finalDamage = Math.floor(finalDamage * (1 - caster.effects.chilled_caster.damageReduction));
        damageSteps.push(`Охлаждение кастера: ${oldDamage} → ${finalDamage}`);
        caster.effects.chilled_caster.spellsLeft--;
        if (caster.effects.chilled_caster.spellsLeft <= 0) {
            delete caster.effects.chilled_caster;

            // УДАЛЕНИЕ ВИЗУАЛЬНОГО ЭФФЕКТА СНЕЖИНКИ
            if (window.spellAnimations?.chilled?.remove) {
                let position = -1;
                let casterType = '';

                position = window.playerFormation.findIndex(id => id === caster.id);
                if (position !== -1) {
                    casterType = 'player';
                } else {
                    position = window.enemyFormation.findIndex(w => w && w.id === caster.id);
                    if (position !== -1) {
                        casterType = 'enemy';
                    }
                }

                if (position !== -1 && casterType) {
                    window.spellAnimations.chilled.remove(`${casterType}_${position}`);
                }
            }
        }
    }
    if (caster && caster.spellDamageMultiplier !== undefined && caster.spellDamageMultiplier < 1) {
        const oldDamage = finalDamage;
        finalDamage = Math.floor(finalDamage * caster.spellDamageMultiplier);
        const reduction = Math.round((1 - caster.spellDamageMultiplier) * 100);
        damageSteps.push(`Каменный грот: ${oldDamage} → ${finalDamage} (-${reduction}%)`);
    }
    
    // 2. Применение множителя урона от благословений
    if (caster && caster.blessingEffects && caster.blessingEffects.damageMultiplier) {
        const oldDamage = finalDamage;
        finalDamage = Math.floor(finalDamage * caster.blessingEffects.damageMultiplier);
        const bonusPercent = Math.round((caster.blessingEffects.damageMultiplier - 1) * 100);
        damageSteps.push(`Благословение: ${oldDamage} → ${finalDamage} (+${bonusPercent}%)`);
    }
    
    // 3. Учет магического сопротивления ЦЕЛИ
    if (typeof window.applyMagicResistance === 'function' && spellId && target) {
    	const damageBeforeResist = finalDamage;
    
    	// Получаем реальный процент сопротивления цели
    	let realResistance = 0;
    	if (typeof window.getSpellSchool === 'function' && typeof window.calculateMagicResistance === 'function') {
    	    const spellSchool = window.getSpellSchool(spellId);
    	    if (Array.isArray(spellSchool)) {
    	        // Для гибридных заклинаний
    	        let resistanceSum = 0;
    	        spellSchool.forEach(school => {
    	            resistanceSum += window.calculateMagicResistance(target, school);
    	        });
    	        realResistance = Math.round(resistanceSum / spellSchool.length);
    	    } else if (spellSchool) {
    	        // Для обычных заклинаний
    	        realResistance = Math.round(window.calculateMagicResistance(target, spellSchool));
    	    }
    	}
    
    	// Применяем сопротивление
    	finalDamage = window.applyMagicResistance(target, spellId, finalDamage);
    
    	// Показываем реальное сопротивление, а не округленный результат
    	if (damageBeforeResist !== finalDamage && realResistance > 0) {
    	    damageSteps.push(`Сопротивление магии: ${damageBeforeResist} → ${finalDamage} (-${realResistance}%)`);
    	}
    }
    
    // 4. Учет брони ЦЕЛИ
    const totalArmor = (target.armor || 0) + (target.armorBonus || 0);
    if (target && totalArmor > 0) {
        const standardArmor = 100;
        const effectiveArmor = Math.max(1, totalArmor * (1 - armorIgnorePercent / 100));
        const armorModifier = (effectiveArmor - standardArmor) / standardArmor;
        const damageBeforeArmor = finalDamage;
        finalDamage = Math.round(finalDamage * (1 - armorModifier));
        
        if (effectiveArmor !== standardArmor) {
            const armorEffect = effectiveArmor > standardArmor ? 'Броня' : 'Уязвимость';
            const percentChange = Math.abs(armorModifier * 100).toFixed(0);
            damageSteps.push(`${armorEffect} (${effectiveArmor.toFixed(0)}): ${damageBeforeArmor} → ${finalDamage} (${percentChange}%)`);
        }
    }
    
    // Сохраняем шаги расчёта для логирования
    if (!target._lastDamageSteps) target._lastDamageSteps = [];
    target._lastDamageSteps = damageSteps;
    
    console.log('applyDamageWithEffects возвращает:', finalDamage);
    return Math.max(1, finalDamage);
}
// --- Функция многослойной защиты (для совместимости) ---
function applyDamageWithMultiLayerProtection(caster, targetInfo, baseDamage, spellId, casterType) {
    if (!targetInfo || !targetInfo.wizard) {
        console.warn('⚠️ applyDamageWithMultiLayerProtection: неверные данные цели');
        return null;
    }

    const target = targetInfo.wizard;
    let finalDamage = baseDamage;
    let blocked = 0;
    let protection_layers = [];
    
    // Проверяем все виды защиты
    
    // 1. Стены (земляные, огненные, ветряные)
    const wallProtection = checkWallProtection(targetInfo.position, casterType, spellId);
    if (wallProtection.blocked > 0) {
        blocked += wallProtection.blocked;
        finalDamage = Math.max(0, finalDamage - wallProtection.blocked);
        protection_layers.push(wallProtection.type);
    }
    // Применяем ослабление от ветряной стены
    if (wallProtection.damageMultiplier < 1) {
        finalDamage = Math.floor(finalDamage * wallProtection.damageMultiplier);
        protection_layers.push(`Ослабление урона на ${Math.round((1 - wallProtection.damageMultiplier) * 100)}%`);
    }
    
    // 2. Призванные существа (только если цель не AOE)
    if (!window.isAOESpell || !window.isAOESpell(spellId)) {
        const summonProtection = checkSummonProtection(targetInfo.position, casterType);
        if (summonProtection.blocked > 0) {
            blocked += summonProtection.blocked;
            finalDamage = Math.max(0, finalDamage - summonProtection.blocked);
            protection_layers.push(summonProtection.type);
        }
    }
    
    // 3. Применяем урон через стандартную систему (с сопротивлениями и броней)
    if (finalDamage > 0) {
        finalDamage = applyDamageWithEffects(caster, target, finalDamage, spellId, 0);
    }
    
    // 4. Применяем урон к цели
    target.hp -= finalDamage;
    if (target.hp < 0) target.hp = 0;
    
    return {
        finalDamage: finalDamage,
        blocked: blocked,
        protection_layers: protection_layers,
        target: target
    };
}

// --- Проверка защиты стен ---
function checkWallProtection(position, casterType, spellId) {
    let blocked = 0;
    let type = '';
    let damageMultiplier = 1.0;
    
    // Проверяем земляные стены
    if (typeof window.findEarthWallAt === 'function') {
        const earthWall = window.findEarthWallAt(casterType === 'player' ? 3 : 2, position);
        if (earthWall && earthWall.hp > 0 && earthWall.casterType !== casterType) {
            blocked = Math.min(earthWall.hp, 20);
            earthWall.hp -= blocked;
            type = 'Земляная стена';
            if (earthWall.hp <= 0) {
                if (typeof window.removeEarthWall === 'function') {
                    window.removeEarthWall(earthWall.id);
                }
            }
        }
    }
    
    // Проверяем ветряные стены (ослабление урона)
    if (typeof window.findWindWallAt === 'function') {
        const windWall = window.findWindWallAt(casterType === 'player' ? 3 : 2, position);
        if (windWall && windWall.casterType !== casterType) {
            damageMultiplier = 1 - (windWall.weakenPercent / 100);
            type = type ? `${type}, Ветряная стена` : 'Ветряная стена';
        }
    }
    
    return { blocked, type, damageMultiplier };
}

// --- Проверка защиты призванных существ ---
function checkSummonProtection(position, casterType) {
    let blocked = 0;
    let type = '';
    
    if (typeof window.findSummonedCreatureAt === 'function') {
        const summon = window.findSummonedCreatureAt(casterType === 'player' ? 4 : 1, position);
        if (summon && summon.hp > 0) {
            blocked = Math.min(summon.hp, 15);
            summon.hp -= blocked;
            type = summon.name || 'Призванное существо';
            
            if (summon.hp <= 0) {
                if (typeof window.removeDeadSummons === 'function') {
                    setTimeout(() => {
                        window.removeDeadSummons();
                    }, 100);
                }
            }
        }
    }
    
    return { blocked, type };
}

// --- Проверка критического удара ---
function checkCriticalHit(chancePercent = 5) {
    const clampedChance = Math.max(0, Math.min(100, chancePercent));
    return Math.random() < (clampedChance / 100.0);
}

// --- Проверка фракционного бонуса двойного урона ---
function checkFactionDoubleDamage(wizardFaction, spellFaction, casterInfo = null) {
    if (wizardFaction !== spellFaction) return false;
    if (wizardFaction === 'wind') {
        const isDouble = Math.random() < 0.05; // 5% шанс
        if (isDouble && typeof window.showFactionSpeechBubble === 'function') {
            // Используем переданный casterInfo или глобальный currentSpellCaster
            const info = casterInfo || window.currentSpellCaster;
            if (info) {
                const col = info.casterType === 'player' ? 5 : 0;
                window.showFactionSpeechBubble('wind', col, info.position);
                console.log('💨 БОНУС ВЕТРА СРАБОТАЛ! Двойной урон');
            }
        }
        return isDouble;
    }
    return false;
}

// --- Проверка игнорирования брони (для земли) ---
function checkArmorIgnore(isHybrid = false, casterInfo = null) {
    const chance = isHybrid ? 0.05 : 0.10; // 10% для земли
    const ignore = Math.random() < chance;
    if (ignore && typeof window.showFactionSpeechBubble === 'function') {
        // Используем переданный casterInfo или глобальный currentSpellCaster
        const info = casterInfo || window.currentSpellCaster;
        if (info && info.faction === 'earth') {
            const col = info.casterType === 'player' ? 5 : 0;
            window.showFactionSpeechBubble('earth', col, info.position);
            console.log('🪨 БОНУС ЗЕМЛИ СРАБОТАЛ! Пробивание брони');
        }
    }
    return ignore ? 10 : 0; // Возвращает 10% игнорирования
}

// --- Применение исцеления с учётом дебаффов ---
function applyFinalHealing(target, healAmount, source = 'effect') {
    if (!target || healAmount <= 0) return 0;
    
    let finalHeal = healAmount;
    
    // Учет Чумы
    if (target.effects && target.effects.plague) {
        const reduction = target.effects.plague.healReduction || 0;
        finalHeal = Math.floor(healAmount * (1 - reduction / 100));
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ Чума уменьшает исцеление ${target.name} на ${reduction}% (${healAmount} → ${finalHeal})`);
        }
    }
    
    // Применяем исцеление
    const oldHp = target.hp;
    target.hp = Math.min(target.hp + finalHeal, target.max_hp);
    const actualHeal = target.hp - oldHp;
    
    return actualHeal;
}

// Экспорт функций
window.applyFinalDamage = applyFinalDamage;
window.applyDamageWithWeather = applyDamageWithWeather;
window.applyDamageWithEffects = applyDamageWithEffects;
window.applyDamageWithMultiLayerProtection = applyDamageWithMultiLayerProtection;
window.checkCriticalHit = checkCriticalHit;
window.checkFactionDoubleDamage = checkFactionDoubleDamage;
window.checkArmorIgnore = checkArmorIgnore;
window.applyFinalHealing = applyFinalHealing;