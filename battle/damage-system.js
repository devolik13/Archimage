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

/**
 * Вычисляет текст усиления урона для AOE-заклинаний (уровень, башня, гильдия)
 * Возвращает строку вида "усиление +XX%, " или "" если усиления нет
 */
window.getAoeBoostText = function(caster) {
    let multiplier = 1.0;
    const isPlayerCaster = window.playerWizards?.some(w => w.id === caster?.id) || false;

    if (typeof window.getDamageBonusFromLevel === 'function') {
        const levelBonus = window.getDamageBonusFromLevel(caster);
        if (levelBonus > 1.0) multiplier *= levelBonus;
    }
    if (isPlayerCaster && typeof window.getWizardTowerDamageBonus === 'function') {
        const towerBonus = window.getWizardTowerDamageBonus();
        if (towerBonus > 1.0) multiplier *= towerBonus;
    }
    if (isPlayerCaster && window.guildManager?.currentGuild && !window.isDuelBattle) {
        const guildBonuses = window.guildManager.getGuildBonuses();
        if (guildBonuses && guildBonuses.damageBonus > 0) {
            multiplier *= (1 + guildBonuses.damageBonus / 100);
        }
    }
    const percent = Math.round((multiplier - 1) * 100);
    return percent > 0 ? `усиление +${percent}%, ` : '';
};

// Временная функция определения школы заклинания (если основная не загружена)
if (!window.getSpellSchoolFallback) {
    window.getSpellSchoolFallback = function(spellId) {
        if (!spellId) return null;

        // Огонь
        if (['spark', 'firebolt', 'fireball', 'fire_wall', 'fire_ground', 'fire_tsunami', 'burning'].includes(spellId)) {
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
        if (['call_wolf', 'wolf_attack', 'wolf_splash', 'bark_armor', 'leaf_canopy', 'ent', 'meteorokinesis'].includes(spellId)) {
            return 'nature';
        }
        // Яд
        if (['poisoned_blade', 'poisoned_glade', 'foul_cloud', 'plague', 'epidemic'].includes(spellId)) {
            return 'poison';
        }
        // Свет
        if (['flash', 'light_beam', 'rainbow_shield', 'sun_radiance', 'dawn'].includes(spellId)) {
            return 'light';
        }
        // Тьма
        if (['dark_clot', 'weakness', 'miasma', 'shadow_realm', 'fading'].includes(spellId)) {
            return 'dark';
        }

        // Проверяем по префиксу
        const prefixes = {
            'fire': 'fire', 'spark': 'fire', 'firebolt': 'fire', 'fireball': 'fire', 'burning': 'fire',
            'ice': 'water', 'frost': 'water', 'blizzard': 'water', 'absolute': 'water',
            'wind': 'wind', 'gust': 'wind', 'storm': 'wind', 'ball_lightning': 'wind',
            'stone': 'earth', 'earth': 'earth', 'pebble': 'earth', 'meteor': 'earth',
            'wolf': 'nature', 'bark': 'nature', 'leaf': 'nature', 'ent': 'nature', 'meteoro': 'nature',
            'poison': 'poison', 'foul': 'poison', 'plague': 'poison', 'epidemic': 'poison',
            'flash': 'light', 'light': 'light', 'rainbow': 'light', 'sun': 'light', 'dawn': 'light',
            'dark': 'dark', 'weakness': 'dark', 'miasma': 'dark', 'shadow': 'dark', 'fading': 'dark'
        };

        for (const [prefix, school] of Object.entries(prefixes)) {
            if (spellId.startsWith(prefix)) {
                return school;
            }
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

    	// Определяем тип кастера по принадлежности к массиву (а не по несуществующему свойству)
    	const isPlayerCaster = window.playerWizards?.some(w => w.id === caster?.id) || false;
    	const casterType = isPlayerCaster ? 'player' : 'enemy';

    	// ========================================
    	// БОНУСЫ УРОНА (применяются первыми, до защит)
    	// ========================================

    	// Бонус урона от уровня мага (+1% за уровень, +40% на 40)
    	if (typeof window.getDamageBonusFromLevel === 'function') {
    	    const levelBonus = window.getDamageBonusFromLevel(caster);
    	    if (levelBonus > 1.0) {
    	        finalDamage = Math.floor(finalDamage * levelBonus);
    	    }
    	}

    	// Бонус от Башни магов (только для игрока)
    	if (isPlayerCaster && typeof window.getWizardTowerDamageBonus === 'function') {
    	    const towerBonus = window.getWizardTowerDamageBonus();
    	    if (towerBonus > 1.0) {
    	        finalDamage = Math.floor(finalDamage * towerBonus);
    	    }
    	}

    	// Бонус урона от гильдии (только для игрока, не в дуэлях)
    	if (isPlayerCaster && window.guildManager?.currentGuild && !window.isDuelBattle) {
    	    const guildBonuses = window.guildManager.getGuildBonuses();
    	    if (guildBonuses && guildBonuses.damageBonus > 0) {
    	        const guildDamageMultiplier = 1 + (guildBonuses.damageBonus / 100);
    	        finalDamage = Math.floor(finalDamage * guildDamageMultiplier);
    	    }
    	}

    	// Метеокинез
    	if (window.activeMeteorokinesis && window.activeMeteorokinesis.length > 0 && spellId) {
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

    	    if (['fire', 'water', 'wind', 'earth'].includes(spellSchool)) {
    	        const activeEffect = window.activeMeteorokinesis.find(m =>
    	            m.isActive && m.casterType === casterType
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

    	// Применяем погоду, сопротивление и броню
    	finalDamage = applyDamageWithWeather(caster, target, finalDamage, spellId, armorIgnorePercent);

    	// Сопротивление от гильдии (уменьшение входящего урона, не в дуэлях)
    	if (target.guildResistances && !window.isDuelBattle) {
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
    	    if (spellSchool && target.guildResistances[spellSchool] > 0) {
    	        const resistMultiplier = 1 - (target.guildResistances[spellSchool] / 100);
    	        finalDamage = Math.floor(finalDamage * resistMultiplier);
    	    }
    	}

    	// Некромант: -10% входящего урона (кроме магии света)
    	if (target.faction === 'necromant') {
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
    	    if (spellSchool !== 'light') {
    	        finalDamage = Math.floor(finalDamage * 0.9);
    	    }
    	}

    	// Покров смерти: сопротивление Тьме/Яду, уязвимость к Свету
    	if (target.buffs && target.buffs.death_shroud) {
    	    const shroud = target.buffs.death_shroud;
    	    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
    	    if (spellSchool === 'dark' || spellSchool === 'poison') {
    	        finalDamage = Math.floor(finalDamage * (1 - shroud.darkPoisonResist / 100));
    	    } else if (spellSchool === 'light') {
    	        finalDamage = Math.floor(finalDamage * (1 + shroud.lightVulnerability / 100));
    	    }
    	}

        return finalDamage;
    }
    
    // Определяем тип кастера для Single Target (аналогично AOE)
    const isPlayerCasterST = window.playerWizards?.some(w => w.id === caster?.id) || false;
    const casterTypeST = isPlayerCasterST ? 'player' : 'enemy';

    // Для Single Target — пробуем многослойную защиту (если функция существует)
    if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
        const result = window.applyDamageWithMultiLayerProtection(caster, target, baseDamage, spellId, casterTypeST);
        if (result) {
            // Опыт начисляется централизованно в core.js
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
    if (window.activeMeteorokinesis && window.activeMeteorokinesis.length > 0 && spellId) {
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

        if (['fire', 'water', 'wind', 'earth'].includes(spellSchool)) {
            const activeEffect = window.activeMeteorokinesis.find(m =>
                m.isActive && m.casterType === casterTypeST
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

    // ГИЛЬДИЯ: Бонус урона от гильдии (только для игрока, отключено в дуэлях)
    if (isPlayerCasterST && window.guildManager?.currentGuild && !window.isDuelBattle) {
        const guildBonuses = window.guildManager.getGuildBonuses();
        if (guildBonuses && guildBonuses.damageBonus > 0) {
            const guildDamageMultiplier = 1 + (guildBonuses.damageBonus / 100);
            finalDamage = Math.floor(finalDamage * guildDamageMultiplier);
            console.log(`🏰 Гильдия: урон +${guildBonuses.damageBonus}%`);
        }
    }

    // ГИЛЬДИЯ: Сопротивление от гильдии (уменьшение входящего урона, отключено в дуэлях)
    if (target?.guildResistances && !window.isDuelBattle) {
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
        console.log(`🌳 [Damage] Проверка защиты Энта для ${target.name} (id=${target.id})`);
        const ent = typeof window.findProtectingEnt === 'function' ?
            window.findProtectingEnt(target, casterTypeST) : null;
        console.log(`🌳 [Damage] Результат поиска Энта:`, ent ? `найден (HP=${ent.hp}, id=${ent.id})` : 'не найден');
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

                // Убиваем через менеджер для визуала (skipLog = true, мы сами логируем)
                if (window.summonsManager && typeof window.summonsManager.killSummon === 'function') {
                    window.summonsManager.killSummon(ent.id, true);
                }

                // На 5 уровне — лечим самого слабого союзного мага
                if (ent.level === 5 && typeof window.healWeakestAlly === 'function') {
                    window.healWeakestAlly(ent.casterType);
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`💀 Энт разрушен, защищая ${target.name}! Энт исцеляет союзника перед смертью!`);
                    }
                } else {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`💀 Энт разрушен, защищая ${target.name}!`);
                    }
                }
            }

            // Остаток урона (если есть) → наносится цели
            const remainingDamage = finalDamage - absorbed;
            if (remainingDamage > 0) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌳 Остаток урона (${remainingDamage}) достигает ${target.name}`);
                }
                // Опыт начисляется централизованно в core.js
                return remainingDamage;
            } else {
                return 0; // урон полностью поглощён
            }
        }
    }

    // НЕКРОМАНТ: -10% входящего урона (кроме магии света)
    if (target.faction === 'necromant') {
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        if (spellSchool !== 'light') {
            finalDamage = Math.floor(finalDamage * 0.9);
        }
    }

    // Покров смерти: сопротивление Тьме/Яду, уязвимость к Свету
    if (target.buffs && target.buffs.death_shroud) {
        const shroud = target.buffs.death_shroud;
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        if (spellSchool === 'dark' || spellSchool === 'poison') {
            finalDamage = Math.floor(finalDamage * (1 - shroud.darkPoisonResist / 100));
        } else if (spellSchool === 'light') {
            finalDamage = Math.floor(finalDamage * (1 + shroud.lightVulnerability / 100));
        }
    }

    // Опыт начисляется централизованно в executeSingleMageAttack (core.js)

    console.log('applyFinalDamage возвращает:', finalDamage);
    return finalDamage;
}

// --- Применение урона с погодой ---
function applyDamageWithWeather(caster, target, baseDamage, spellId, armorIgnorePercent = 0) {
    let damage = baseDamage;
    const weatherSteps = []; // Для записи шагов погоды

    // Применяем погоду на основе ШКОЛЫ ЗАКЛИНАНИЯ, а не фракции мага
    if (typeof window.applyWeatherBonus === 'function' && spellId) {
        // Получаем школу заклинания
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
        if (spellSchool && spellSchool !== 'nature') {
            const damageBeforeWeather = damage;
            // Погода даёт бонус заклинаниям соответствующей стихии (кроме природы)
            damage = window.applyWeatherBonus(spellSchool, damage);

            // Записываем бонус погоды если он был применён
            if (damage !== damageBeforeWeather) {
                const weatherNames = {
                    'drought': 'Засуха',
                    'ice_fog': 'Лёд. туман',
                    'sandstorm': 'Песч. буря',
                    'storm': 'Шторм'
                };
                const weatherName = weatherNames[window.currentWeather] || window.currentWeather;
                weatherSteps.push(`${weatherName} (+15%): ${damageBeforeWeather} → ${damage}`);
            }
        }
    }

    // Сохраняем шаги погоды для последующего объединения с остальными шагами
    if (target && weatherSteps.length > 0) {
        target._weatherDamageSteps = weatherSteps;
    }

    // Применяем эффекты и броню
    return applyDamageWithEffects(caster, target, damage, spellId, armorIgnorePercent);
}

// --- Применение урона с эффектами, сопротивлением и бронёй ---
function applyDamageWithEffects(caster, target, baseDamage, spellId = 'basic', armorIgnorePercent = 0) {
    let finalDamage = baseDamage;
    const damageSteps = []; // Массив для хранения шагов расчёта

    // Добавляем шаги погоды из applyDamageWithWeather (если есть)
    if (target && target._weatherDamageSteps && target._weatherDamageSteps.length > 0) {
        damageSteps.push(...target._weatherDamageSteps);
        delete target._weatherDamageSteps; // Очищаем после использования
    }
    
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

    // 2.4 Применение множителя урона босса (damageMultiplier у элементалей/боссов)
    if (caster && caster.isBoss && caster.damageMultiplier > 1 && !caster.buffs?.dawn) {
        const oldDamage = finalDamage;
        finalDamage = Math.floor(finalDamage * caster.damageMultiplier);
        const bonusPercent = Math.round((caster.damageMultiplier - 1) * 100);
        damageSteps.push(`💀 Сила босса: ${oldDamage} → ${finalDamage} (+${bonusPercent}%)`);
    }

    // 2.5 Применение множителя урона от Рассвета (Dawn)
    if (caster && caster.buffs?.dawn && caster.damageMultiplier > 1) {
        const oldDamage = finalDamage;
        finalDamage = Math.floor(finalDamage * caster.damageMultiplier);
        const bonusPercent = Math.round((caster.damageMultiplier - 1) * 100);
        damageSteps.push(`🌅 Рассвет: ${oldDamage} → ${finalDamage} (+${bonusPercent}%)`);
    }

    // 2.6 Применение дебаффов тьмы на КАСТЕРЕ (Слабость и Угасание снижают урон)
    if (caster && typeof window.getDarkDebuffDamageMultiplier === 'function') {
        const darkMultiplier = window.getDarkDebuffDamageMultiplier(caster);
        if (darkMultiplier < 1) {
            const oldDamage = finalDamage;
            finalDamage = Math.floor(finalDamage * darkMultiplier);
            const reductionPercent = Math.round((1 - darkMultiplier) * 100);
            damageSteps.push(`🌑 Дебафф тьмы: ${oldDamage} → ${finalDamage} (-${reductionPercent}%)`);
        }
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

    // 3.5 Радужный щит - защита от стихийных школ (fire, water, earth, wind)
    if (target && target.buffs && target.buffs.rainbow_shield) {
        const shield = target.buffs.rainbow_shield;
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

        // Проверяем, что заклинание принадлежит стихийной школе
        if (spellSchool && shield.affectedSchools && shield.affectedSchools.includes(spellSchool)) {
            const damageBeforeShield = finalDamage;
            const resistMultiplier = 1 - (shield.resistancePercent / 100);
            finalDamage = Math.floor(finalDamage * resistMultiplier);

            if (damageBeforeShield !== finalDamage) {
                damageSteps.push(`🌈 Радужный щит: ${damageBeforeShield} → ${finalDamage} (-${shield.resistancePercent}%)`);
            }
        }
    }

    // 3.6 Покров смерти - сопротивление Тьме/Яду, уязвимость к Свету
    if (target && target.buffs && target.buffs.death_shroud) {
        const shroud = target.buffs.death_shroud;
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

        if (spellSchool === 'dark' || spellSchool === 'poison') {
            const damageBeforeShroud = finalDamage;
            finalDamage = Math.floor(finalDamage * (1 - shroud.darkPoisonResist / 100));
            if (damageBeforeShroud !== finalDamage) {
                damageSteps.push(`🦇 Покров смерти: ${damageBeforeShroud} → ${finalDamage} (-${shroud.darkPoisonResist}% от Тьмы/Яда)`);
            }
        } else if (spellSchool === 'light') {
            const damageBeforeShroud = finalDamage;
            finalDamage = Math.floor(finalDamage * (1 + shroud.lightVulnerability / 100));
            if (damageBeforeShroud !== finalDamage) {
                damageSteps.push(`🦇 Покров смерти: ${damageBeforeShroud} → ${finalDamage} (+${shroud.lightVulnerability}% от Света)`);
            }
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

    // 3. Проверяем бонус фракции Земли (Несокрушимость) - игнорирование брони
    let armorIgnorePercent = 0;
    if (caster && caster.faction === 'earth') {
        // Определяем школу заклинания
        const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

        // Бонус работает только для заклинаний школы земли
        if (spellSchool === 'earth') {
            // Формируем casterInfo для показа bubble
            const casterInfo = window.currentSpellCaster || {
                wizard: caster,
                faction: caster.faction,
                casterType: casterType,
                position: findCasterPosition(caster, casterType)
            };

            // Проверяем срабатывание бонуса (10% шанс, возвращает 10% игнорирования)
            armorIgnorePercent = checkArmorIgnore(false, casterInfo);

            if (armorIgnorePercent > 0) {
                protection_layers.push(`🪨 Несокрушимость: игнорирует ${armorIgnorePercent}% брони`);
            }
        }
    }

    // 4. Применяем урон через стандартную систему (с погодой, сопротивлениями и броней)
    if (finalDamage > 0) {
        finalDamage = applyDamageWithWeather(caster, target, finalDamage, spellId, armorIgnorePercent);
    }

    // 5. Применяем урон к цели
    target.hp -= finalDamage;
    if (target.hp < 0) target.hp = 0;

    return {
        finalDamage: finalDamage,
        blocked: blocked,
        protection_layers: protection_layers,
        target: target
    };
}

// --- Вспомогательная функция для поиска позиции кастера ---
function findCasterPosition(caster, casterType) {
    if (!caster) return 0;

    if (casterType === 'player') {
        const pos = window.playerFormation?.findIndex(id => id === caster.id);
        return pos !== -1 ? pos : 0;
    } else {
        const pos = window.enemyFormation?.findIndex(w => w && w.id === caster.id);
        return pos !== -1 ? pos : 0;
    }
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
                    (window.battleTimeout || setTimeout)(() => {
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
    const chance = isHybrid ? 0.05 : 0.10; // 10% для чистой земли, 5% для гибрида
    const ignore = Math.random() < chance;
    if (ignore && typeof window.showFactionSpeechBubble === 'function') {
        const info = casterInfo || window.currentSpellCaster;
        if (info && info.faction === 'earth') {
            const col = info.casterType === 'player' ? 5 : 0;
            window.showFactionSpeechBubble('earth', col, info.position);
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