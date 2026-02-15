// Обновлённая функция applyDamageWithMultiLayerProtection с отслеживанием точки столкновения

function applyDamageWithMultiLayerProtection(caster, target, baseDamage, spellId, casterType) {
    // Проверяем, есть ли цель и маг в ней
    if (!target || !target.wizard) {
        return null;
    }
    
    let remainingDamage = baseDamage;
    const protectionLayers = [];

    // ========================================
    // БОНУСЫ УРОНА (применяются первыми, до защит)
    // ========================================
    const isPlayerCaster = casterType === 'player';

    // Бонус урона от уровня мага (+1% за уровень, +40% на 40)
    if (typeof window.getDamageBonusFromLevel === 'function') {
        const levelBonus = window.getDamageBonusFromLevel(caster);
        if (levelBonus > 1.0) {
            remainingDamage = Math.floor(remainingDamage * levelBonus);
        }
    }

    // Бонус от Башни магов (только для игрока)
    if (isPlayerCaster && typeof window.getWizardTowerDamageBonus === 'function') {
        const towerBonus = window.getWizardTowerDamageBonus();
        if (towerBonus > 1.0) {
            remainingDamage = Math.floor(remainingDamage * towerBonus);
        }
    }

    // Бонус урона от гильдии (только для игрока, не в дуэлях)
    if (isPlayerCaster && window.guildManager?.currentGuild && !window.isDuelBattle) {
        const guildBonuses = window.guildManager.getGuildBonuses();
        if (guildBonuses && guildBonuses.damageBonus > 0) {
            const guildDamageMultiplier = 1 + (guildBonuses.damageBonus / 100);
            remainingDamage = Math.floor(remainingDamage * guildDamageMultiplier);
        }
    }

    // Общий % усиления для лога
    const boostPercent = baseDamage > 0 ? Math.round((remainingDamage / baseDamage - 1) * 100) : 0;

    // ========================================
    // ОТСЛЕЖИВАНИЕ ТОЧКИ СТОЛКНОВЕНИЯ
    // ========================================
    let impactCol = null;
    let impactRow = target.position;
    
    // Определяем колонки для проверки
    const effectColumn = casterType === 'player' ? 2 : 3;
    const summonColumn = casterType === 'player' ? 1 : 4;
    
    // === СЛОЙ 1: КОЛОНКА ЭФФЕКТОВ (ЗЕМЛЯНЫЕ СТЕНЫ) ===
    const earthWall = typeof window.findEarthWallAt === 'function' ? 
        window.findEarthWallAt(effectColumn, target.position) : null;
    
    if (earthWall && earthWall.hp > 0) {
        if (earthWall.casterType !== casterType) {
            const wallDamage = Math.min(remainingDamage, earthWall.hp);
            const wallRemainder = Math.max(0, remainingDamage - earthWall.hp);
            
            // ✅ ЕСЛИ СТЕНА ПОЛНОСТЬЮ БЛОКИРУЕТ - ТОЧКА СТОЛКНОВЕНИЯ НАЙДЕНА
            if (earthWall.hp >= remainingDamage) {
                impactCol = effectColumn;
            }
            
            if (typeof window.damageEarthWall === 'function') {
                window.damageEarthWall(earthWall.id, wallDamage);
            }
            
            protectionLayers.push(`Земляная стена поглощает ${wallDamage} урона`);
            remainingDamage = wallRemainder;
        } else {
            protectionLayers.push(`Земляная стена не блокирует заклинания своих магов`);
        }
    }
    
    // === ПРОВЕРКА ВЕТРЯНОЙ СТЕНЫ ===
    const windWall = typeof window.findWindWallAt === 'function' ? 
        window.findWindWallAt(effectColumn, target.position) : null;
        
    if (windWall && windWall.casterType !== casterType) {
        const reduction = Math.round(remainingDamage * windWall.weakenPercent / 100);
        remainingDamage = remainingDamage - reduction;
        protectionLayers.push(`Ветряная стена ослабляет урон на ${reduction} (-${windWall.weakenPercent}%)`);
    }
    
    // === СЛОЙ 2: КОЛОНКА ПРИЗВАННЫХ ===
    if (remainingDamage > 0) {
        // Проверяем призванных существ по позиции
        let summonedCreature = typeof window.findSummonedCreatureAt === 'function' ?
            window.findSummonedCreatureAt(summonColumn, target.position) : null;

        // ИСПРАВЛЕНИЕ: Для Энтов проверяем linkedWizards (защита связанных магов)
        // targetType - противоположный casterType (тот кого атакуют)
        const targetType = casterType === 'player' ? 'enemy' : 'player';
        if (!summonedCreature && typeof window.findProtectingEnt === 'function' && target.wizard) {
            const protectingEnt = window.findProtectingEnt(target.wizard, targetType);
            if (protectingEnt && protectingEnt.hp > 0 && protectingEnt.isAlive) {
                summonedCreature = protectingEnt;
            }
        }
    
        if (summonedCreature && summonedCreature.hp > 0) {
            // Определяем AOE ли заклинание
            const isAOESpell = typeof window.isAOESpell === 'function' && window.isAOESpell(spellId);

            // AOE + не-Энт: саммон получает урон, но НЕ поглощает за мага
            if (isAOESpell && !summonedCreature.isDefensive) {
                let aoeDamage = remainingDamage;
                // Фракционный бонус некроманта для призванных существ (-10% кроме Света)
                if (summonedCreature.type === 'bone_dragon' || summonedCreature.type === 'necromant_skeleton') {
                    const school = typeof window.getSpellSchool === 'function' ? window.getSpellSchool(spellId) : null;
                    if (school !== 'light') {
                        aoeDamage = Math.floor(aoeDamage * 0.9);
                    }
                }
                const actualDamage = Math.min(aoeDamage, summonedCreature.hp);
                summonedCreature.hp -= actualDamage;
                if (summonedCreature.hp < 0) summonedCreature.hp = 0;

                if (window.summonsManager && typeof window.summonsManager.updateVisualHP === 'function') {
                    window.summonsManager.updateVisualHP(summonedCreature.id, summonedCreature.hp, summonedCreature.maxHP);
                }

                protectionLayers.push(`💥 ${summonedCreature.name || 'Существо'} получает ${actualDamage} AOE урона`);

                if (summonedCreature.hp <= 0) {
                    if (window.summonsManager) {
                        window.summonsManager.killSummon(summonedCreature.id, true);
                    }
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`💀 ${summonedCreature.name || 'Существо'} уничтожено AOE!`);
                    }
                }

                // Помечаем что саммон уже получил AOE урон (для централизованной функции)
                summonedCreature._aoeDamaged = true;
                // remainingDamage НЕ уменьшается — маг получает полный урон
            } else {
                // Single target ИЛИ Энт (AOE/single) — стандартное поглощение
                // 🐉 Фракционный бонус некроманта для призванных существ (-10% кроме Света)
                if (summonedCreature.type === 'bone_dragon' || summonedCreature.type === 'necromant_skeleton') {
                    const school = typeof window.getSpellSchool === 'function' ? window.getSpellSchool(spellId) : null;
                    if (school !== 'light') {
                        remainingDamage = Math.floor(remainingDamage * 0.9);
                    }
                }

                const creatureDamage = Math.min(remainingDamage, summonedCreature.hp);
                const creatureRemainder = Math.max(0, remainingDamage - summonedCreature.hp);

                // ✅ ЕСЛИ ПРИЗВАННЫЙ ПОЛНОСТЬЮ БЛОКИРУЕТ - ТОЧКА СТОЛКНОВЕНИЯ НАЙДЕНА
                if (impactCol === null && summonedCreature.hp >= remainingDamage) {
                    impactCol = summonColumn;
                }

                // Наносим урон призванному существу
                summonedCreature.hp -= creatureDamage;
                if (summonedCreature.hp < 0) summonedCreature.hp = 0;

                // Обновляем визуальный HP бар через менеджер
                if (window.summonsManager && typeof window.summonsManager.updateHP === 'function') {
                    window.summonsManager.updateHP(summonedCreature.id, summonedCreature.hp);
                }

                // Логирование
                let protectionMessage = '';
                const defendedName = (target.wizard.name && target.wizard.name !== 'Пустота') ?
                    target.wizard.name : 'союзника';

                if (summonedCreature.type === 'nature_wolf') {
                    protectionMessage = `🐺 Волк защищает ${defendedName} и получает ${creatureDamage} урона`;
                } else if (summonedCreature.type === 'nature_ent') {
                    protectionMessage = `🌳 Энт защищает ${defendedName} и поглощает ${creatureDamage} урона`;
                } else {
                    protectionMessage = `${summonedCreature.name || 'Призванное существо'} защищает ${defendedName} и получает ${creatureDamage} урона`;
                }

                if (summonedCreature.hp > 0) {
                    protectionMessage += ` (осталось ${summonedCreature.hp}/${summonedCreature.maxHP || summonedCreature.hp} HP)`;
                }

                protectionLayers.push(protectionMessage);
                remainingDamage = creatureRemainder;

                // Проверяем уничтожение существа
                if (summonedCreature.hp <= 0) {
                    let deathMessage = '';
                    const defendedNameDeath = (target.wizard.name && target.wizard.name !== 'Пустота') ?
                        target.wizard.name : 'союзника';

                    if (summonedCreature.type === 'nature_wolf') {
                        deathMessage = `💀 Волк погиб, защищая ${defendedNameDeath}!`;
                    } else if (summonedCreature.type === 'nature_ent') {
                        deathMessage = `💀 Энт разрушен, защищая ${defendedNameDeath}!`;
                        if (summonedCreature.level === 5 && typeof window.healWeakestAlly === 'function') {
                            window.healWeakestAlly(summonedCreature.casterType);
                            deathMessage += ' Энт исцеляет союзника перед смертью!';
                        }
                    } else {
                        deathMessage = `💀 ${summonedCreature.name || 'Призванное существо'} уничтожено!`;
                    }

                    if (window.summonsManager) {
                        window.summonsManager.killSummon(summonedCreature.id, true);
                    } else if (window.activeSummons && summonedCreature.id) {
                        window.activeSummons = window.activeSummons.filter(s => s.id !== summonedCreature.id);
                    }

                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(deathMessage);
                    }
                }
            }
            
            // ИСПРАВЛЕНИЕ: Убрано дублирующее сообщение "полностью защитил"
            // Это и так видно из protectionMessage выше: "получает урон" + "осталось HP"
            // Не нужно дополнительное сообщение
        }
    }
    
    // === СЛОЙ 3: ЦЕЛЬ (МАГ) ===
    // ✅ ЕСЛИ ДОШЛИ ДО МАГА - ЭТО ТОЧКА СТОЛКНОВЕНИЯ
    if (impactCol === null) {
        impactCol = casterType === 'player' ? 0 : 5;
    }
    
    if (remainingDamage > 0) {

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
                }
            }
        }

        // ПРОВЕРКА БОНУСА ФРАКЦИИ ЗЕМЛИ (Несокрушимость) - игнорирование брони
        let armorIgnorePercent = 0;
        if (caster && caster.faction === 'earth') {
            const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

            // Бонус работает только для заклинаний школы земли
            if (spellSchool === 'earth') {
                // Формируем casterInfo для показа bubble
                // Находим позицию кастера
                let casterPosition = 0;
                if (casterType === 'player') {
                    const pos = window.playerFormation?.findIndex(id => id === caster.id);
                    casterPosition = pos !== -1 ? pos : 0;
                } else {
                    const pos = window.enemyFormation?.findIndex(w => w && w.id === caster.id);
                    casterPosition = pos !== -1 ? pos : 0;
                }

                const casterInfo = window.currentSpellCaster || {
                    wizard: caster,
                    faction: caster.faction,
                    casterType: casterType,
                    position: casterPosition
                };

                // Проверяем срабатывание бонуса (10% шанс, возвращает 10% игнорирования)
                armorIgnorePercent = typeof window.checkArmorIgnore === 'function' ?
                    window.checkArmorIgnore(false, casterInfo) : 0;

                if (armorIgnorePercent > 0) {
                    protectionLayers.push(`🪨 Несокрушимость: игнорирует ${armorIgnorePercent}% брони`);
                }
            }
        }

        // ПОТОМ применяем погоду, сопротивления и броню
        let finalDamage = typeof window.applyDamageWithWeather === 'function' ?
            window.applyDamageWithWeather(caster, target.wizard, remainingDamage, spellId, armorIgnorePercent) : remainingDamage;

        // Сопротивление от гильдии (уменьшение входящего урона, не в дуэлях)
        if (target.wizard.guildResistances && !window.isDuelBattle) {
            const spellSchoolForResist = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
            if (spellSchoolForResist && target.wizard.guildResistances[spellSchoolForResist] > 0) {
                const resistMultiplier = 1 - (target.wizard.guildResistances[spellSchoolForResist] / 100);
                finalDamage = Math.floor(finalDamage * resistMultiplier);
            }
        }

        // Некромант: -10% входящего урона (кроме магии света)
        if (target.wizard.faction === 'necromant') {
            const spellSchoolForNecro = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
            if (spellSchoolForNecro !== 'light') {
                finalDamage = Math.floor(finalDamage * 0.9);
            }
        }

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
        }
    
        protectionLayers.push(`${target.wizard.name} получает ${finalDamage} финального урона`);

        // Учитываем урон для системы опыта (только для игрока)
        if (casterType === 'player' && finalDamage > 0 && typeof window.trackBattleDamage === 'function') {
            window.trackBattleDamage(caster, finalDamage);
        }

        return {
            totalDamage: baseDamage,
            finalDamage: finalDamage,
            blocked: baseDamage - remainingDamage,
            protectionLayers: protectionLayers,
            boostPercent: boostPercent,
            targetSurvived: target.wizard.hp > 0,
            impactCol: impactCol,
            impactRow: impactRow
        };
    } else {
        protectionLayers.push(`${target.wizard.name} не получает урона - защита поглотила все!`);

        return {
            totalDamage: baseDamage,
            finalDamage: 0,
            blocked: baseDamage,
            protectionLayers: protectionLayers,
            boostPercent: boostPercent,
            targetSurvived: true,
            impactCol: impactCol,
            impactRow: impactRow
        };
    }
}

// --- Логирование результата защиты ---
function logProtectionResult(caster, target, result, spellName) {
    if (!target || !target.wizard) {
        return;
    }

    if (!window.addToBattleLog || !result) return;

    // ИСПРАВЛЕНИЕ: Не логируем ТОЛЬКО если цель "Пустота" И НЕТ защитных слоев
    // (Если есть защитные слои - значит волк/стена защищали, нужно это показать)
    if (target.wizard.name === 'Пустота') {
        const hasProtection = result.protectionLayers && result.protectionLayers.length > 0 &&
            result.protectionLayers.some(layer =>
                layer.includes('🐺') || layer.includes('🌳') || layer.includes('🧱') || layer.includes('💨')
            );

        if (!hasProtection && result.finalDamage === 0) {
            return;
        }
    }

    // Определяем уровень заклинания из названия
    const spellLevel = spellName.match(/\d+/) ? spellName.match(/\d+/)[0] : '';
    const spellDisplayName = spellLevel ? `${spellName.replace(/\d+/, '').trim()} ${spellLevel}ур` : spellName;

    // Основная строка
    // Если цель "Пустота" но есть защита - не показываем имя, покажем только защитные слои ниже
    if (target.wizard.name !== 'Пустота') {
        const mainLog = `🎯 ${target.wizard.name} получает от ${caster.name} ${result.finalDamage} урона (${spellDisplayName})`;
        window.addToBattleLog(mainLog);
    } else {
        // Для виртуальной цели показываем кратко
        const mainLog = `🎯 ${caster.name} использует ${spellDisplayName} → ${result.finalDamage} урона`;
        window.addToBattleLog(mainLog);
    }
    
    // Детальный расчёт с отступами
    // Показываем общее усиление урона одной строкой
    if (result.boostPercent > 0) {
        window.addToBattleLog(`    ├─ ⚔️ Усиление урона: ${result.totalDamage} → ${Math.floor(result.totalDamage * (1 + result.boostPercent / 100))} (+${result.boostPercent}%)`);
    }

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