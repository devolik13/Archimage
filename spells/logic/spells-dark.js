// battle/spells/spells-dark.js - Заклинания школы Тьмы

function castDarkSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`🌑 Casting dark spell: ${spellId}`);

    switch (spellId) {
        case 'dark_clot':
            castDarkClot(wizard, spellData, position, casterType);
            break;
        case 'weakness':
            castWeakness(wizard, spellData, position, casterType);
            break;
        case 'miasma':
            castMiasma(wizard, spellData, position, casterType);
            break;
        case 'shadow_realm':
            castShadowRealm(wizard, spellData, position, casterType);
            break;
        case 'fading':
            castFading(wizard, spellData, position, casterType);
            break;
        default:
            console.log(`⚠️ Заклинание тьмы ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

// --- Сгусток тьмы (Dark Clot) - Тир 1, Single Target ---
function castDarkClot(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [15, 20, 25, 30, 40][level - 1] || 15;
    const armorRemoveChance = level === 5 ? 50 : 0; // 50% на 5 уровне

    console.log(`🌑 Casting Dark Clot - Level ${level}, Damage ${baseDamage}`);

    // Находим цель (передаём wizard для проверки ослепления)
    const target = window.findTarget?.(position, casterType, wizard);
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
        spellId: 'dark_clot',
        baseDamage: baseDamage,
        spellLevel: level,

        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;

            console.log(`🌑 Создаём снаряд Сгустка тьмы: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);

            if (window.spellAnimations?.dark_clot?.play) {
                window.spellAnimations.dark_clot.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    onHit: onHit
                });
            } else {
                console.warn('⚠️ Анимация dark_clot не найдена');
                setTimeout(onHit, 300);
            }
        },

        applyEffects: (targetWizard, spellLevel, casterFaction) => {
            // На 5 уровне 50% шанс снять 5 брони (для всех)
            if (spellLevel === 5 && Math.random() * 100 < armorRemoveChance) {
                applyArmorReduction(targetWizard, 5, wizard);
            }
        },

        onComplete: (finalResult) => {
            // Применяем бонус фракции Тьмы
            applyDarkFactionBonus(wizard, [target.wizard], casterType);
        }
    });
}

// --- Слабость (Weakness) - Тир 2, Single Target Debuff ---
function castWeakness(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const damageReduction = [10, 20, 30, 40, 50][level - 1] || 10;

    console.log(`🌑 Casting Weakness - Level ${level}, Reduction ${damageReduction}%`);

    // Находим цель (передаём wizard для проверки ослепления)
    const target = window.findTarget?.(position, casterType, wizard);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌑 ${wizard.name} использует Слабость, но цель не найдена`);
        }
        return;
    }

    const targetWizard = target.wizard;

    // Применяем дебафф
    if (!targetWizard.effects) targetWizard.effects = {};

    targetWizard.effects.weakened = {
        damageReduction: damageReduction,
        casterId: wizard.id,
        casterType: casterType,
        turnsLeft: 1, // Действует 1 полный ход цели
        appliedAt: Date.now()
    };

    // Показываем визуальный эффект тёмного дымка
    const targetType = casterType === 'player' ? 'enemy' : 'player';
    if (window.spellAnimations?.weakened?.show) {
        window.spellAnimations.weakened.show(targetWizard, target.position, targetType);
    }

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌑 ${wizard.name} накладывает Слабость на ${targetWizard.name} (-${damageReduction}% урона на 1 ход)`);
    }

    // Анимация
    if (window.spellAnimations?.weakness?.play) {
        const targetCol = casterType === 'player' ? 0 : 5;
        window.spellAnimations.weakness.play({
            casterType: casterType,
            targetCol: targetCol,
            targetRow: target.position,
            level: level
        });
    }

    // Применяем бонус фракции
    applyDarkFactionBonus(wizard, [targetWizard], casterType);
}

// --- Миазма (Miasma) - Тир 3, Пассивный бафф/дебафф яда ---
// Применяется в начале боя
function applyMiasmaAtStart(wizard, level, position, casterType) {
    const percentModifier = [20, 40, 60, 80, 100][level - 1] || 20;

    console.log(`🌑 Applying Miasma at start - Level ${level}, Modifier ${percentModifier}%`);

    // Получаем всех союзников и врагов
    const allies = casterType === 'player' ?
        window.playerWizards.filter(w => w.hp > 0) :
        window.enemyFormation.filter(w => w && w.hp > 0);

    const enemies = casterType === 'player' ?
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerWizards.filter(w => w.hp > 0);

    // Накладываем бафф на союзников (защита от яда)
    allies.forEach(ally => {
        if (!ally.buffs) ally.buffs = {};

        ally.buffs.miasma_protection = {
            poisonResistance: percentModifier, // Снижение урона от стаков яда
            casterId: wizard.id
        };
    });

    // Накладываем дебафф на врагов (усиление яда)
    enemies.forEach(enemy => {
        if (!enemy.effects) enemy.effects = {};

        enemy.effects.miasma_vulnerability = {
            poisonAmplification: percentModifier, // Увеличение урона от стаков яда
            casterId: wizard.id,
            casterType: casterType
        };
    });

    if (typeof window.addToBattleLog === 'function') {
        const resistText = percentModifier === 100 ? 'иммунитет к яду' : `-${percentModifier}% урона от яда`;
        const ampText = percentModifier === 100 ? 'удвоенный урон от яда' : `+${percentModifier}% урона от яда`;
        window.addToBattleLog(`☣️ Миазма ${wizard.name} окутывает поле боя! Союзники: ${resistText}. Враги: ${ampText}`);
    }

    // Анимация заклинания
    if (window.spellAnimations?.miasma?.play) {
        setTimeout(() => {
            window.spellAnimations.miasma.play({
                casterType: casterType,
                casterPosition: position,
                level: level
            });
        }, 300);
    }

    // Показываем постоянный визуальный эффект на всех союзниках
    if (window.spellAnimations?.miasma_buff?.show) {
        allies.forEach((ally, index) => {
            let allyPos = -1;

            if (casterType === 'player') {
                allyPos = window.playerFormation?.findIndex(id => id === ally.id);
            } else {
                allyPos = window.enemyFormation?.findIndex(w => w && w.id === ally.id);
            }

            if (allyPos !== -1) {
                setTimeout(() => {
                    window.spellAnimations.miasma_buff.show(ally, allyPos, casterType);
                }, 500 + index * 100);
            }
        });
    }
}

// Старая функция castMiasma - для обратной совместимости (не используется)
function castMiasma(wizard, spellData, position, casterType) {
    // Миазма теперь пассивная, применяется в начале боя
    console.log(`⚠️ castMiasma вызвана, но Миазма теперь пассивное заклинание`);
}

// --- Мир теней (Shadow Realm) - Тир 4, % от потерянного HP ---
function castShadowRealm(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const targetCount = level; // 1-5 целей
    const percentDamage = 20; // Всегда 20% от потерянного HP

    console.log(`🌑 Casting Shadow Realm - Level ${level}, Targets: ${targetCount}`);

    // Получаем всех врагов
    let enemies = casterType === 'player' ?
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerWizards.filter(w => w.hp > 0);

    if (enemies.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌑 ${wizard.name} вызывает Мир теней, но цели не найдены`);
        }
        return;
    }

    // Сортируем по % потерянного HP (самые раненые первыми)
    enemies.sort((a, b) => {
        const aLostPercent = (a.max_hp - a.hp) / a.max_hp;
        const bLostPercent = (b.max_hp - b.hp) / b.max_hp;
        return bLostPercent - aLostPercent; // По убыванию
    });

    // Выбираем нужное количество целей
    const targets = enemies.slice(0, targetCount);

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌑 ${wizard.name} открывает Мир теней для ${targets.length} врагов!`);
    }

    // Анимация
    if (window.spellAnimations?.shadow_realm?.play) {
        window.spellAnimations.shadow_realm.play({
            casterType: casterType,
            casterPosition: position,
            targets: targets,
            level: level
        });
    }

    // Наносим урон каждой цели
    targets.forEach((target, index) => {
        setTimeout(() => {
            const lostHp = target.max_hp - target.hp;
            const damage = Math.floor(lostHp * percentDamage / 100);

            if (damage > 0) {
                // Применяем урон
                const finalDamage = typeof window.applyFinalDamage === 'function' ?
                    window.applyFinalDamage(wizard, target, damage, 'shadow_realm', 0, true) : damage;

                target.hp -= finalDamage;
                if (target.hp < 0) target.hp = 0;

                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌑 Мир теней поглощает ${finalDamage} HP у ${target.name} (${percentDamage}% от ${lostHp} потерянных)`);
                }

                // Проверяем смерть
                if (target.hp <= 0) {
                    const targetType = casterType === 'player' ? 'enemy' : 'player';
                    if (window.battleLogger) {
                        window.battleLogger.logDeath(target, targetType, 'shadow_realm');
                    }
                }
            } else {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌑 ${target.name} не потерял HP — Мир теней не наносит урона`);
                }
            }
        }, index * 200);
    });

    // Применяем бонус фракции
    setTimeout(() => {
        applyDarkFactionBonus(wizard, targets, casterType);
    }, targets.length * 200);
}

// --- Угасание (Fading) - Тир 5, Постоянное снижение урона/брони ---
function castFading(wizard, spellData, position, casterType, isRepeat = false) {
    const level = spellData.level || 1;
    const reductionPercent = [3, 5, 7, 10, 10][level - 1] || 3;
    const repeatChance = level === 5 ? 20 : 0; // 20% на 5 уровне

    console.log(`🌑 Casting Fading - Level ${level}, Reduction ${reductionPercent}%`);

    // Получаем всех врагов
    const enemies = casterType === 'player' ?
        window.enemyFormation.filter(w => w && w.hp > 0) :
        window.playerWizards.filter(w => w.hp > 0);

    if (enemies.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌑 ${wizard.name} вызывает Угасание, но цели не найдены`);
        }
        return;
    }

    // Применяем снижение урона и брони каждому врагу
    enemies.forEach(enemy => {
        // Снижение брони
        if (enemy.armor && enemy.armor > 0) {
            const armorReduction = Math.ceil(enemy.armor * reductionPercent / 100);
            enemy.armor -= armorReduction;
            if (enemy.armor < 0) enemy.armor = 0;
        }

        // Инициализируем fadingStacks если нет
        if (!enemy.effects) enemy.effects = {};
        if (!enemy.effects.fading) {
            enemy.effects.fading = {
                damageMultiplier: 1.0,
                casterId: wizard.id,
                casterType: casterType
            };
        }

        // Уменьшаем множитель урона
        enemy.effects.fading.damageMultiplier *= (1 - reductionPercent / 100);
    });

    const currentMultiplier = enemies[0]?.effects?.fading?.damageMultiplier || 1;
    const totalReduction = Math.round((1 - currentMultiplier) * 100);

    if (typeof window.addToBattleLog === 'function') {
        const repeatText = isRepeat ? ' (повтор!)' : '';
        window.addToBattleLog(`🌑 ${wizard.name} насылает Угасание!${repeatText} Все враги: -${reductionPercent}% урона/брони (всего -${totalReduction}%)`);
    }

    // Анимация
    if (window.spellAnimations?.fading?.play) {
        window.spellAnimations.fading.play({
            casterType: casterType,
            casterPosition: position,
            level: level
        });
    }

    // Применяем бонус фракции
    applyDarkFactionBonus(wizard, enemies, casterType);

    // На 5 уровне 20% шанс повторного применения (только если это не повтор)
    if (level === 5 && !isRepeat && Math.random() * 100 < repeatChance) {
        setTimeout(() => {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌑 Угасание срабатывает повторно!`);
            }
            castFading(wizard, spellData, position, casterType, true);
        }, 500);
    }
}

// --- Применить снижение брони ---
function applyArmorReduction(targetWizard, amount, caster) {
    if (!targetWizard.armor) targetWizard.armor = 0;

    const oldArmor = targetWizard.armor;
    targetWizard.armor -= amount;
    if (targetWizard.armor < 0) targetWizard.armor = 0;

    const actualReduction = oldArmor - targetWizard.armor;

    if (actualReduction > 0 && typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌑 Тьма снимает ${actualReduction} брони с ${targetWizard.name} (осталось: ${targetWizard.armor})`);
    }

    // Сохраняем информацию о перманентном снижении брони
    if (!targetWizard.effects) targetWizard.effects = {};
    if (!targetWizard.effects.armorReduced) {
        targetWizard.effects.armorReduced = { total: 0 };
    }
    targetWizard.effects.armorReduced.total += actualReduction;
}

// --- Бонус фракции Тьмы: 10% шанс снять 5 брони со всех целей ---
function applyDarkFactionBonus(wizard, targets, casterType) {
    // Работает ТОЛЬКО для магов фракции Тьма
    if (!wizard || wizard.faction !== 'dark') {
        return;
    }

    const chance = 0.10; // 10%

    if (Math.random() < chance) {
        // Снимаем 5 брони со всех целей
        let affectedCount = 0;

        targets.forEach(target => {
            if (target && target.hp > 0) {
                const oldArmor = target.armor || 0;
                if (oldArmor > 0) {
                    target.armor = Math.max(0, oldArmor - 5);
                    affectedCount++;
                }
            }
        });

        if (affectedCount > 0) {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌑 Тёмная аура снимает 5 брони с ${affectedCount} врагов!`);
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
                    window.showFactionSpeechBubble('dark', col, pos);
                }
            }
        }
    }
}

// --- Обработка снятия эффекта Слабости после хода ---
function processWeakenedEffectAfterTurn(wizard, position, wizardType) {
    if (wizard.effects && wizard.effects.weakened) {
        wizard.effects.weakened.turnsLeft--;

        if (wizard.effects.weakened.turnsLeft <= 0) {
            delete wizard.effects.weakened;

            // Убираем визуальный эффект
            if (window.spellAnimations?.weakened?.remove) {
                const effectKey = `${wizardType}_${position}`;
                window.spellAnimations.weakened.remove(effectKey);
            }

            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌑 Слабость на ${wizard.name} рассеялась`);
            }
        }
    }
}

// --- Получить множитель урона с учётом Слабости и Угасания ---
function getDarkDebuffDamageMultiplier(wizard) {
    let multiplier = 1.0;

    if (wizard.effects) {
        // Слабость
        if (wizard.effects.weakened) {
            multiplier *= (1 - wizard.effects.weakened.damageReduction / 100);
        }

        // Угасание
        if (wizard.effects.fading) {
            multiplier *= wizard.effects.fading.damageMultiplier;
        }
    }

    return multiplier;
}

// --- Получить модификатор урона от яда с учётом Миазмы ---
function getMiasmaPoisonModifier(wizard, isAlly, casterType) {
    // Для союзников проверяем бафф защиты
    if (isAlly && wizard.buffs && wizard.buffs.miasma_protection) {
        return 1 - wizard.buffs.miasma_protection.poisonResistance / 100;
    }

    // Для врагов проверяем дебафф усиления
    if (!isAlly && wizard.effects && wizard.effects.miasma_vulnerability) {
        return 1 + wizard.effects.miasma_vulnerability.poisonAmplification / 100;
    }

    return 1.0;
}

// Экспорт
window.castDarkSpell = castDarkSpell;
window.castDarkClot = castDarkClot;
window.castWeakness = castWeakness;
window.castMiasma = castMiasma;
window.applyMiasmaAtStart = applyMiasmaAtStart;
window.castShadowRealm = castShadowRealm;
window.castFading = castFading;
window.applyArmorReduction = applyArmorReduction;
window.applyDarkFactionBonus = applyDarkFactionBonus;
window.processWeakenedEffectAfterTurn = processWeakenedEffectAfterTurn;
window.getDarkDebuffDamageMultiplier = getDarkDebuffDamageMultiplier;
window.getMiasmaPoisonModifier = getMiasmaPoisonModifier;
