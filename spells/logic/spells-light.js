// battle/spells/spells-light.js - Заклинания школы Света

function castLightSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`✨ Casting light spell: ${spellId}`);

    switch (spellId) {
        case 'flash':
            castFlash(wizard, spellData, position, casterType);
            break;
        case 'light_beam':
            castLightBeam(wizard, spellData, position, casterType);
            break;
        case 'rainbow_shield':
            // Применяется в начале боя, не кастуется
            console.log('🌈 Радужный щит — уже активен с начала боя');
            break;
        case 'sun_radiance':
            castSunRadiance(wizard, spellData, position, casterType);
            break;
        case 'dawn':
            // Применяется в начале боя, не кастуется
            console.log('🌅 Рассвет — уже активен с начала боя');
            break;
        default:
            console.log(`⚠️ Заклинание света ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Вспышка (Flash) - Тир 1, Single Target ---
// Особенность: ×3 урон по саммонам на 5 уровне, остаточный урон пробивает к магу
function castFlash(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;

    console.log(`✨ Casting Flash - Level ${level}, Base Damage ${baseDamage}`);

    // Устанавливаем текущего кастера для отслеживания фракционных бонусов
    if (typeof window.setCurrentSpellCaster === 'function') {
        window.setCurrentSpellCaster(wizard, casterType, position);
    }

    // Находим цель (маг)
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }

    // Определяем колонки
    const casterCol = casterType === 'player' ? 5 : 0;
    const summonColumn = casterType === 'player' ? 1 : 4;
    const targetCol = casterType === 'player' ? 0 : 5;

    // Проверяем наличие саммона на пути
    let summonedCreature = typeof window.findSummonedCreatureAt === 'function' ?
        window.findSummonedCreatureAt(summonColumn, position) : null;

    // Также проверяем защищающего Энта
    const targetType = casterType === 'player' ? 'enemy' : 'player';
    if (!summonedCreature && typeof window.findProtectingEnt === 'function' && target.wizard) {
        const protectingEnt = window.findProtectingEnt(target.wizard, targetType);
        if (protectingEnt && protectingEnt.hp > 0 && protectingEnt.isAlive) {
            summonedCreature = protectingEnt;
        }
    }

    let remainingDamage = baseDamage;
    let impactCol = targetCol;
    let impactRow = position;
    let totalDamageDealt = 0;
    const protectionLayers = [];

    // === СЛОЙ 1: САММОНЫ (с бонусом ×3 на 5 уровне) ===
    if (summonedCreature && summonedCreature.hp > 0) {
        const isSummon = summonedCreature.isSummoned ||
                         summonedCreature.type === 'wolf' ||
                         summonedCreature.type === 'nature_wolf' ||
                         summonedCreature.type === 'ent' ||
                         summonedCreature.type === 'nature_ent';

        // Бонус 5 уровня: ×3 урон по саммонам
        let damageToSummon = remainingDamage;
        if (level === 5 && isSummon) {
            damageToSummon = remainingDamage * 3;
            protectionLayers.push(`✨ Вспышка наносит тройной урон призванному существу! (${remainingDamage} → ${damageToSummon})`);
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`✨ Вспышка наносит тройной урон призванному существу!`);
            }
        }

        const creatureDamage = Math.min(damageToSummon, summonedCreature.hp);
        const creatureRemainder = Math.max(0, damageToSummon - summonedCreature.hp);

        // Если саммон полностью блокирует - это точка столкновения
        if (summonedCreature.hp >= damageToSummon) {
            impactCol = summonColumn;
        }

        // Наносим урон саммону
        summonedCreature.hp -= creatureDamage;
        if (summonedCreature.hp < 0) summonedCreature.hp = 0;
        totalDamageDealt += creatureDamage;

        // Обновляем HP бар саммона
        if (window.summonsManager && typeof window.summonsManager.updateHP === 'function') {
            window.summonsManager.updateHP(summonedCreature.id, summonedCreature.hp);
        }

        // Логирование
        const creatureTypeName = summonedCreature.type === 'nature_wolf' || summonedCreature.type === 'wolf' ? '🐺 Волк' :
                                 summonedCreature.type === 'nature_ent' || summonedCreature.type === 'ent' ? '🌳 Энт' :
                                 summonedCreature.name || 'Существо';

        if (summonedCreature.hp > 0) {
            protectionLayers.push(`${creatureTypeName} получает ${creatureDamage} урона (осталось ${summonedCreature.hp} HP)`);
        } else {
            protectionLayers.push(`${creatureTypeName} получает ${creatureDamage} урона и погибает!`);

            // Удаляем существо
            if (window.summonsManager) {
                window.summonsManager.killSummon(summonedCreature.id, true);
            }

            // Лечение при смерти Энта 5 уровня
            if ((summonedCreature.type === 'nature_ent' || summonedCreature.type === 'ent') &&
                summonedCreature.level === 5 && typeof window.healWeakestAlly === 'function') {
                window.healWeakestAlly(summonedCreature.casterType);
                protectionLayers.push(`✨ Энт исцеляет союзника перед смертью!`);
            }
        }

        // Остаточный урон идёт напрямую к магу (ФИШКА заклинания - убийца саммонеров!)
        // Если ×3 урон убил саммона - весь остаток пробивает к магу
        if (creatureRemainder > 0) {
            remainingDamage = creatureRemainder;
            protectionLayers.push(`⚡ Остаточный урон: ${Math.round(remainingDamage)} пробивает к магу!`);
        } else {
            remainingDamage = 0;
        }
    }

    // === СЛОЙ 2: МАГ (если остался урон) ===
    if (remainingDamage > 0 && target.wizard && target.wizard.hp > 0) {
        // Применяем полную систему урона (броня, сопротивления, погода)
        const finalDamage = typeof window.applyDamageWithWeather === 'function' ?
            window.applyDamageWithWeather(wizard, target.wizard, remainingDamage, 'flash', 0) :
            Math.round(remainingDamage);

        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        totalDamageDealt += finalDamage;

        // Обновляем HP бар мага
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
            const wizCol = target.wizard.id && target.wizard.id.startsWith('enemy_') ? 0 : 5;
            const key = `${wizCol}_${position}`;
            window.pixiWizards.updateHP(key, target.wizard.hp, target.wizard.max_hp);
        }

        protectionLayers.push(`${target.wizard.name} получает ${finalDamage} урона (осталось ${target.wizard.hp}/${target.wizard.max_hp} HP)`);

        // Трекинг урона для опыта (только для игрока)
        if (casterType === 'player' && finalDamage > 0 && typeof window.trackBattleDamage === 'function') {
            window.trackBattleDamage(wizard, finalDamage);
        }
    }

    // Итоговый результат
    const damageResult = {
        totalDamage: baseDamage,
        finalDamage: totalDamageDealt,
        protectionLayers: protectionLayers,
        impactCol: impactCol,
        impactRow: impactRow,
        targetSurvived: target.wizard.hp > 0
    };

    // Запускаем анимацию снаряда
    if (window.spellAnimations?.flash?.play) {
        window.spellAnimations.flash.play({
            casterCol: casterCol,
            casterRow: position,
            targetCol: impactCol,
            targetRow: impactRow,
            onHit: () => {
                // Логируем результат
                protectionLayers.forEach(layer => {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`    ├─ ${layer}`);
                    }
                });

                // Применяем бонус фракции
                applyLightFactionBonus(wizard, casterType);

                // Очищаем текущего кастера
                if (typeof window.clearCurrentSpellCaster === 'function') {
                    window.clearCurrentSpellCaster();
                }
            },
            onComplete: () => {}
        });
    } else {
        console.warn('⚠️ Анимация flash не найдена');
        // Fallback - логируем сразу
        protectionLayers.forEach(layer => {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`    ├─ ${layer}`);
            }
        });
        applyLightFactionBonus(wizard, casterType);
        if (typeof window.clearCurrentSpellCaster === 'function') {
            window.clearCurrentSpellCaster();
        }
    }
}

// --- Луч света (Light Beam) - Тир 2, Канализируемый урон ---
// Механика: Луч бьёт через ВСЕ слои защиты (стена → саммон → маг) с нарастающим уроном
// Каждый луч (основной и дополнительный) имеет СОБСТВЕННЫЙ независимый разогрев
// Разогрев сбрасывается ТОЛЬКО когда: маг-цель умер ИЛИ кастер оглушён
function castLightBeam(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;

    // Параметры урона по уровням
    const baseDamage = [10, 12, 14, 16, 16][level - 1] || 10;
    const increment = [1, 2, 3, 4, 4][level - 1] || 1;
    const hasSecondBeam = level === 5;

    console.log(`✨ Casting Light Beam - Level ${level}, Base ${baseDamage}, +${increment}/ход`);

    // Инициализируем состояние лучей у кастера
    if (!wizard.lightBeams) {
        wizard.lightBeams = {};
    }

    // Проверяем прерывающие дебаффы на кастере (сбрасывают разогрев)
    // - isStunned: оглушение от Ветра (Storm Cloud, Ball Lightning 5 лв)
    // Примечание: chilled_caster (Вода) только снижает урон, НЕ прерывает луч
    // Примечание: Blizzard/Absolute Zero прерывают каст в battle/spells.js до вызова заклинания
    const isStunned = wizard.isStunned && wizard.stunTurns > 0;

    if (isStunned) {
        wizard.lightBeams = {}; // Сбрасываем все лучи
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`✨ Луч света прерван оглушением! Разогрев сброшен.`);
        }
        return;
    }

    // === ОСНОВНОЙ ЛУЧ ===
    // Всегда бьёт мага напротив (по позиции кастера)
    const mainTarget = window.findTarget?.(position, casterType);
    if (!mainTarget) {
        console.warn('⚠️ Цель не найдена');
        return;
    }

    // Ключ для основного луча - фиксированный
    const mainBeamKey = 'beam_main';

    // Проверяем, сменилась ли цель основного луча (маг умер)
    const mainBeam = wizard.lightBeams[mainBeamKey];
    if (mainBeam && mainBeam.targetId && mainTarget.wizard) {
        // Если текущая цель мертва или это другой маг - сброс
        if (mainTarget.wizard.hp <= 0 || mainBeam.targetId !== mainTarget.wizard.id) {
            delete wizard.lightBeams[mainBeamKey];
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`✨ Основной луч: цель уничтожена, разогрев сброшен`);
            }
        }
    }

    castBeamAtTarget(wizard, mainTarget, position, casterType, baseDamage, increment, mainBeamKey, 'основной');

    // === ДОПОЛНИТЕЛЬНЫЙ ЛУЧ (5 уровень) ===
    // Работает так же как основной - фиксируется на цели до её смерти
    if (hasSecondBeam) {
        setTimeout(() => {
            const secondBeamKey = 'beam_second';
            const secondBeam = wizard.lightBeams[secondBeamKey];

            let secondTarget = null;

            // Если уже есть цель - пытаемся её найти
            if (secondBeam && secondBeam.targetId) {
                secondTarget = window.findTargetById?.(secondBeam.targetId, casterType);

                // Если цель мертва - сбрасываем и выберем новую
                if (!secondTarget || secondTarget.wizard.hp <= 0) {
                    delete wizard.lightBeams[secondBeamKey];
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`✨ Дополнительный луч: цель уничтожена, разогрев сброшен`);
                    }
                    secondTarget = null;
                }
            }

            // Если цели нет - выбираем случайную
            if (!secondTarget) {
                secondTarget = window.findRandomTarget?.(casterType);
            }

            if (secondTarget) {
                castBeamAtTarget(wizard, secondTarget, position, casterType, baseDamage, increment, secondBeamKey, 'дополнительный');
            }
        }, 300);
    }

    // Применяем бонус фракции
    applyLightFactionBonus(wizard, casterType);
}

// Каст луча по цели - урон проходит через все слои multi-layer
function castBeamAtTarget(wizard, target, casterPosition, casterType, baseDamage, increment, beamKey, beamName) {
    // Инициализируем состояние луча если нет
    if (!wizard.lightBeams[beamKey]) {
        wizard.lightBeams[beamKey] = {
            currentDamage: baseDamage,
            baseDamage: baseDamage,
            increment: increment,
            targetId: target.wizard?.id || null
        };

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`✨ ${beamName === 'основной' ? 'Луч' : 'Доп. луч'} фокусируется на ${target.wizard?.name || 'цели'} (старт: ${baseDamage})`);
        }
    }

    const beam = wizard.lightBeams[beamKey];
    // Обновляем targetId на случай если цель сменилась
    beam.targetId = target.wizard?.id || null;

    const damage = beam.currentDamage;
    const casterCol = casterType === 'player' ? 5 : 0;

    // Устанавливаем текущего кастера
    if (typeof window.setCurrentSpellCaster === 'function') {
        window.setCurrentSpellCaster(wizard, casterType, casterPosition);
    }

    // Применяем урон через multi-layer protection (стена → саммон → маг)
    // Урон проходит через ВСЕ слои, разогрев НЕ сбрасывается!
    const damageResult = window.applyDamageWithMultiLayerProtection?.(
        wizard,
        target,
        damage,
        'light_beam',
        casterType
    );

    if (!damageResult) {
        return;
    }

    const { impactCol, impactRow } = damageResult;

    const beamLabel = beamName === 'основной' ? 'Луч' : 'Доп. луч';

    // Запускаем анимацию до точки столкновения
    if (window.spellAnimations?.light_beam?.play) {
        window.spellAnimations.light_beam.play({
            casterCol: casterCol,
            casterRow: casterPosition,
            targetCol: impactCol,
            targetRow: impactRow,
            onHit: () => {
                // Логируем результат
                if (window.logProtectionResult) {
                    window.logProtectionResult(wizard, target, damageResult, `${beamLabel} (${damage} урона)`);
                }

                // Увеличиваем урон для следующего хода (разогрев ПРОДОЛЖАЕТСЯ!)
                beam.currentDamage += beam.increment;

                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`    └─ ${beamLabel} разогревается: следующий урон ${beam.currentDamage} (+${beam.increment})`);
                }

                // Сбрасываем ТОЛЬКО если маг-цель умер (не стена/саммон!)
                if (target.wizard && target.wizard.hp <= 0) {
                    delete wizard.lightBeams[beamKey];
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`✨ ${beamLabel}: цель уничтожена! Готов к новой цели`);
                    }
                }

                // Очищаем текущего кастера
                if (typeof window.clearCurrentSpellCaster === 'function') {
                    window.clearCurrentSpellCaster();
                }
            },
            onComplete: () => {}
        });
    } else {
        // Fallback без анимации
        if (window.logProtectionResult) {
            window.logProtectionResult(wizard, target, damageResult, `${beamLabel} (${damage} урона)`);
        }

        beam.currentDamage += beam.increment;

        if (target.wizard && target.wizard.hp <= 0) {
            delete wizard.lightBeams[beamKey];
        }

        if (typeof window.clearCurrentSpellCaster === 'function') {
            window.clearCurrentSpellCaster();
        }
    }
}

// --- Применить эффект "Сияние" (burn DoT от Луча света) ---
function applyRadianceEffect(targetWizard, caster, burnStart, burnIncrement, casterType) {
    if (!targetWizard.effects) targetWizard.effects = {};

    // Если уже есть сияние от этого кастера - обновляем
    if (targetWizard.effects.radiance && targetWizard.effects.radiance.casterId === caster.id) {
        // Обновляем параметры
        targetWizard.effects.radiance.currentDamage = burnStart;
        targetWizard.effects.radiance.increment = burnIncrement;

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`✨ Сияние на ${targetWizard.name} обновлено (${burnStart} урона/ход)`);
        }
    } else {
        // Новое сияние
        targetWizard.effects.radiance = {
            casterId: caster.id,
            casterType: casterType,
            currentDamage: burnStart,
            increment: burnIncrement,
            appliedAt: Date.now()
        };

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`✨ ${targetWizard.name} под эффектом Сияния (${burnStart} урона/ход, +${burnIncrement}/ход)`);
        }
    }
}

// --- Обработка тиков Сияния (вызывается в начале хода кастера) ---
function processRadianceEffects(casterType) {
    // Получаем всех врагов
    const enemies = casterType === 'player' ?
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerWizards.filter(w => w.hp > 0);

    enemies.forEach(enemy => {
        if (enemy.effects && enemy.effects.radiance) {
            const radiance = enemy.effects.radiance;

            // Проверяем, жив ли кастер
            const caster = findCaster(radiance.casterId, radiance.casterType);
            if (!caster || caster.hp <= 0) {
                // Кастер мёртв - снимаем эффект
                delete enemy.effects.radiance;
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`✨ Сияние на ${enemy.name} рассеялось (кастер погиб)`);
                }
                return;
            }

            // Тик срабатывает только в ход кастера
            if (radiance.casterType !== casterType) return;

            // Наносим урон
            const damage = radiance.currentDamage;
            enemy.hp -= damage;
            if (enemy.hp < 0) enemy.hp = 0;

            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`✨ Сияние наносит ${enemy.name} ${damage} урона (HP: ${enemy.hp}/${enemy.max_hp})`);
            }

            // Увеличиваем урон для следующего тика
            radiance.currentDamage += radiance.increment;

            // Проверяем смерть
            if (enemy.hp <= 0) {
                const targetType = casterType === 'player' ? 'enemy' : 'player';
                if (window.battleLogger) {
                    window.battleLogger.logDeath(enemy, targetType, 'radiance');
                }
            }
        }
    });
}

// --- Вспомогательная функция поиска кастера ---
function findCaster(casterId, casterType) {
    if (casterType === 'player') {
        return window.playerWizards?.find(w => w.id === casterId);
    } else {
        return window.enemyFormation?.find(w => w && w.id === casterId);
    }
}

// --- Радужный щит (Rainbow Shield) - Тир 3, Бафф сопротивления ---
// Применяется в начале боя
function applyRainbowShieldAtStart(wizard, level, position, casterType) {
    const resistancePercent = [10, 15, 20, 25, 30][level - 1] || 10;

    // Определяем цели
    let targets = [wizard];

    if (level >= 3) {
        // Добавляем соседей
        const neighbors = getWizardNeighbors(wizard, casterType);
        targets = [wizard, ...neighbors];
    }

    if (level === 5) {
        // Все союзники
        targets = casterType === 'player' ?
            window.playerWizards.filter(w => w.hp > 0) :
            window.enemyFormation.filter(w => w && w.hp > 0);
    }

    // Применяем бафф
    targets.forEach(target => {
        if (!target.buffs) target.buffs = {};

        target.buffs.rainbow_shield = {
            resistancePercent: resistancePercent,
            casterId: wizard.id,
            // Работает только против стихий
            affectedSchools: ['fire', 'water', 'earth', 'wind']
        };
    });

    if (typeof window.addToBattleLog === 'function') {
        const targetDesc = level === 5 ? 'всех союзников' :
            (level >= 3 ? `${wizard.name} и соседей` : wizard.name);
        window.addToBattleLog(`🌈 Радужный щит защищает ${targetDesc} (-${resistancePercent}% урона от стихий)`);
    }

    // Анимация
    if (window.spellAnimations?.rainbow_shield?.play) {
        setTimeout(() => {
            window.spellAnimations.rainbow_shield.play({
                casterType: casterType,
                casterPosition: position,
                targets: targets,
                level: level
            });
        }, 500 + position * 100);
    }
}

// --- Получить соседей мага ---
function getWizardNeighbors(wizard, casterType) {
    let casterPosition = -1;
    if (casterType === 'player') {
        casterPosition = window.playerFormation.findIndex(id => id === wizard.id);
    } else {
        casterPosition = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
    }

    if (casterPosition === -1) return [];

    const leftPos = (casterPosition - 1 + 5) % 5;
    const rightPos = (casterPosition + 1) % 5;

    const neighbors = [];

    if (casterType === 'player') {
        const leftId = window.playerFormation[leftPos];
        if (leftId) {
            const leftWizard = window.playerWizards.find(w => w.id === leftId);
            if (leftWizard && leftWizard.hp > 0) neighbors.push(leftWizard);
        }
        const rightId = window.playerFormation[rightPos];
        if (rightId) {
            const rightWizard = window.playerWizards.find(w => w.id === rightId);
            if (rightWizard && rightWizard.hp > 0) neighbors.push(rightWizard);
        }
    } else {
        const leftWizard = window.enemyFormation[leftPos];
        if (leftWizard && leftWizard.hp > 0) neighbors.push(leftWizard);
        const rightWizard = window.enemyFormation[rightPos];
        if (rightWizard && rightWizard.hp > 0) neighbors.push(rightWizard);
    }

    return neighbors;
}

// --- Сияние солнца (Sun Radiance) - Тир 4, Ослепление всех врагов ---
function castSunRadiance(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const missChance = 10; // 10% шанс промаха для ослеплённых

    // Находим всех вражеских магов
    const enemies = casterType === 'player' ?
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerWizards.filter(w => w.hp > 0);

    if (enemies.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☀️ ${wizard.name} использует Сияние солнца, но цели не найдены`);
        }
        return;
    }

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`☀️ ${wizard.name} вызывает Сияние солнца! Все враги ослеплены!`);
    }

    // Анимация
    if (window.spellAnimations?.sun_radiance?.play) {
        window.spellAnimations.sun_radiance.play({
            casterType: casterType,
            casterPosition: position,
            level: level
        });
    }

    // Накладываем ослепление на всех врагов
    enemies.forEach(enemy => {
        applyBlindedEffect(enemy, wizard, missChance, casterType);
    });

    // Применяем бонус фракции
    applyLightFactionBonus(wizard, casterType);
}

// --- Применить эффект "Ослепление" ---
function applyBlindedEffect(targetWizard, caster, missChance, casterType) {
    if (!targetWizard.effects) targetWizard.effects = {};

    targetWizard.effects.blinded = {
        missChance: missChance,
        casterId: caster.id,
        casterType: casterType,
        turnsLeft: 1, // Действует 1 ход цели
        appliedAt: Date.now()
    };

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`👁️ ${targetWizard.name} ослеплён! (${missChance}% шанс промаха на 1 ход)`);
    }
}

// --- Проверка ослепления перед кастом ---
function checkBlindedMiss(wizard) {
    if (!wizard.effects || !wizard.effects.blinded) {
        return false; // Не ослеплён
    }

    const blinded = wizard.effects.blinded;
    const roll = Math.random() * 100;

    if (roll < blinded.missChance) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`👁️ ${wizard.name} промахивается из-за ослепления!`);
        }
        return true; // Промах
    }

    return false; // Попадание
}

// --- Получить случайную позицию для промаха ---
function getBlindedRandomTarget(originalPosition, casterType) {
    // Выбираем случайную позицию 0-4
    const randomPos = Math.floor(Math.random() * 5);
    return randomPos;
}

// --- Обработка снятия ослепления после хода мага ---
function processBlindedEffectAfterTurn(wizard) {
    if (wizard.effects && wizard.effects.blinded) {
        wizard.effects.blinded.turnsLeft--;

        if (wizard.effects.blinded.turnsLeft <= 0) {
            delete wizard.effects.blinded;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`👁️ ${wizard.name} больше не ослеплён`);
            }
        }
    }
}

// --- Рассвет (Dawn) - Тир 5, Пассивный бафф HP и урона ---
// Применяется в начале боя
function applyDawnAtStart(wizard, level, position, casterType) {
    const hpBonus = [10, 20, 30, 40, 60][level - 1] || 10;
    const damageBonus = [5, 10, 15, 20, 30][level - 1] || 5;

    // Получаем всех союзников
    const allies = casterType === 'player' ?
        window.playerWizards.filter(w => w.hp > 0) :
        window.enemyFormation.filter(w => w && w.hp > 0);

    // Применяем бафф ко всем
    allies.forEach(ally => {
        if (!ally.buffs) ally.buffs = {};

        // Бафф HP
        const hpIncrease = Math.floor(ally.max_hp * hpBonus / 100);
        ally.max_hp += hpIncrease;
        ally.hp += hpIncrease;

        // Бафф урона
        ally.buffs.dawn = {
            damageBonus: damageBonus,
            hpBonus: hpBonus,
            casterId: wizard.id
        };

        // Для расчёта урона
        if (!ally.damageMultiplier) ally.damageMultiplier = 1.0;
        ally.damageMultiplier += damageBonus / 100;
    });

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌅 Рассвет озаряет всех союзников! (+${hpBonus}% HP, +${damageBonus}% урона)`);
    }

    // Анимация
    if (window.spellAnimations?.dawn?.play) {
        setTimeout(() => {
            window.spellAnimations.dawn.play({
                casterType: casterType,
                level: level
            });
        }, 300);
    }
}

// --- Бонус фракции Света: 5% шанс снять дебафф с союзника ---
function applyLightFactionBonus(wizard, casterType) {
    // Работает ТОЛЬКО для магов фракции Свет
    if (!wizard || wizard.faction !== 'light') {
        return;
    }

    const chance = 0.05; // 5%

    if (Math.random() < chance) {
        // Находим союзника с дебаффом
        const allies = casterType === 'player' ?
            window.playerWizards.filter(w => w.hp > 0) :
            window.enemyFormation.filter(w => w && w.hp > 0);

        // Список дебаффов которые можно снять (только существующие эффекты)
        const removableDebuffs = ['burning', 'poison', 'chilled_caster', 'blinded', 'plague', 'weakened', 'fading'];

        // Ищем союзника с любым дебаффом
        for (const ally of allies) {
            if (!ally.effects) continue;

            for (const debuff of removableDebuffs) {
                if (ally.effects[debuff]) {
                    // Снимаем дебафф
                    delete ally.effects[debuff];

                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`✨ Свет очищает ${ally.name} от эффекта ${getDebuffName(debuff)}!`);
                    }

                    // Речевой пузырь
                    if (typeof window.showFactionSpeechBubble === 'function') {
                        let pos = -1;
                        if (casterType === 'player') {
                            pos = window.playerFormation?.findIndex(id => id === wizard.id);
                        } else {
                            pos = window.enemyFormation?.findIndex(w => w && w.id === wizard.id);
                        }

                        if (pos !== -1) {
                            const col = casterType === 'player' ? 5 : 0;
                            window.showFactionSpeechBubble('light', col, pos);
                        }
                    }

                    return; // Снимаем только один дебафф за раз
                }
            }
        }
    }
}

// --- Вспомогательная функция: название дебаффа ---
function getDebuffName(debuffId) {
    const names = {
        'burning': 'Горение',
        'poison': 'Яд',
        'chilled_caster': 'Заморозка',
        'blinded': 'Ослепление',
        'plague': 'Чума',
        'weakened': 'Слабость',
        'fading': 'Угасание'
    };
    return names[debuffId] || debuffId;
}

// Экспорт
window.castLightSpell = castLightSpell;
window.castFlash = castFlash;
window.castLightBeam = castLightBeam;
window.castSunRadiance = castSunRadiance;
window.applyRadianceEffect = applyRadianceEffect;
window.processRadianceEffects = processRadianceEffects;
window.applyRainbowShieldAtStart = applyRainbowShieldAtStart;
window.applyDawnAtStart = applyDawnAtStart;
window.applyBlindedEffect = applyBlindedEffect;
window.checkBlindedMiss = checkBlindedMiss;
window.getBlindedRandomTarget = getBlindedRandomTarget;
window.processBlindedEffectAfterTurn = processBlindedEffectAfterTurn;
window.applyLightFactionBonus = applyLightFactionBonus;
