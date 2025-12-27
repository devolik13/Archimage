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
function castFlash(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 20, 30][level - 1] || 10;

    console.log(`✨ Casting Flash - Level ${level}, Damage ${baseDamage}`);

    // Находим цель
    const target = window.findTarget?.(position, casterType);
    if (!target) {
        console.warn('⚠️ Цель не найдена');
        return;
    }

    // Проверяем, призванное ли существо (для бонуса 5 уровня)
    const isSummoned = target.wizard.isSummoned || target.wizard.type === 'wolf' || target.wizard.type === 'ent';
    let actualDamage = baseDamage;

    // Бонус 5 уровня: ×3 урон по призванным
    if (level === 5 && isSummoned) {
        actualDamage = baseDamage * 3;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`✨ Вспышка наносит тройной урон призванному существу!`);
        }
    }

    // Запускаем через систему single-target
    window.castSingleTargetSpell({
        caster: wizard,
        target: target,
        casterPosition: position,
        casterType: casterType,
        spellId: 'flash',
        baseDamage: actualDamage,
        spellLevel: level,

        // Функция создания снаряда
        createProjectile: (params) => {
            const { fromCol, fromRow, toCol, toRow, onHit } = params;

            console.log(`✨ Создаём снаряд Вспышки: [${fromCol},${fromRow}] → [${toCol},${toRow}]`);

            if (window.spellAnimations?.flash?.play) {
                window.spellAnimations.flash.play({
                    casterCol: fromCol,
                    casterRow: fromRow,
                    targetCol: toCol,
                    targetRow: toRow,
                    onHit: onHit
                });
            } else {
                console.warn('⚠️ Анимация flash не найдена');
                setTimeout(onHit, 300);
            }
        },

        applyEffects: null,

        onComplete: (finalResult) => {
            // Применяем бонус фракции
            applyLightFactionBonus(wizard, casterType);
        }
    });
}

// --- Луч света (Light Beam) - Тир 2, Single Target + Burn DoT ---
function castLightBeam(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 12, 15, 18, 20][level - 1] || 10;
    const burnStart = [2, 3, 4, 5, 6][level - 1] || 2;
    const burnIncrement = [1, 1, 2, 2, 3][level - 1] || 1;
    const targetCount = level === 5 ? 2 : 1;

    console.log(`✨ Casting Light Beam - Level ${level}, Damage ${baseDamage}, Targets: ${targetCount}`);

    // Находим цели
    const targets = [];
    const mainTarget = window.findTarget?.(position, casterType);
    if (mainTarget) {
        targets.push(mainTarget);
    }

    // На 5 уровне ищем вторую цель
    if (level === 5 && targets.length > 0) {
        const secondTarget = window.findRandomTarget?.(casterType, [mainTarget.wizard.id]);
        if (secondTarget) {
            targets.push(secondTarget);
        }
    }

    if (targets.length === 0) {
        console.warn('⚠️ Цель не найдена');
        return;
    }

    // Атакуем каждую цель
    targets.forEach((target, index) => {
        setTimeout(() => {
            // Запускаем через систему single-target
            window.castSingleTargetSpell({
                caster: wizard,
                target: target,
                casterPosition: position,
                casterType: casterType,
                spellId: 'light_beam',
                baseDamage: baseDamage,
                spellLevel: level,

                createProjectile: (params) => {
                    const { fromCol, fromRow, toCol, toRow, onHit } = params;

                    if (window.spellAnimations?.light_beam?.play) {
                        window.spellAnimations.light_beam.play({
                            casterCol: fromCol,
                            casterRow: fromRow,
                            targetCol: toCol,
                            targetRow: toRow,
                            onHit: onHit
                        });
                    } else {
                        setTimeout(onHit, 300);
                    }
                },

                applyEffects: (targetWizard, spellLevel, casterFaction) => {
                    // Накладываем эффект "сияние" (burn DoT)
                    applyRadianceEffect(targetWizard, wizard, burnStart, burnIncrement, casterType);
                },

                onComplete: (finalResult) => {
                    if (index === 0) {
                        applyLightFactionBonus(wizard, casterType);
                    }
                }
            });
        }, index * 300);
    });
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

        // Список дебаффов которые можно снять
        const removableDebuffs = ['burning', 'poison', 'chilled', 'frozen', 'stunned', 'blinded', 'plague', 'weakened'];

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
        'chilled': 'Охлаждение',
        'frozen': 'Заморозка',
        'stunned': 'Оглушение',
        'blinded': 'Ослепление',
        'plague': 'Чума',
        'weakened': 'Слабость'
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
