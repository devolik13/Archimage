// battle/spells/spells-necromant.js - Заклинания школы Некромантия

function castNecromantSpell(wizard, spellId, spellData, position, casterType) {
    switch (spellId) {
        case 'summon_skeleton':
            castSummonSkeleton(wizard, spellData, position, casterType);
            break;
        case 'bone_spear':
            castBoneSpear(wizard, spellData, position, casterType);
            break;
        case 'bone_cage':
            castBoneCage(wizard, spellData, position, casterType);
            break;
        case 'death_shroud':
            // Пассивное заклинание — уже применено в начале боя
            break;
        case 'bone_dragon':
            // Дракон призван в начале боя, каждый ход атакует (по паттерну скелета)
            if (window.summonsManager) {
                for (const [id, summon] of window.summonsManager.summons) {
                    if (summon.casterId === wizard.id && summon.isAlive && summon.type === 'bone_dragon') {
                        performBoneDragonAttack(summon, wizard);
                        if (typeof window.checkBoneDragonAura === 'function') {
                            window.checkBoneDragonAura();
                        }
                        break;
                    }
                }
            }
            break;
        default:
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

function castSummonSkeleton(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;

    // Используем менеджер призванных существ
    const skeleton = window.createSkeletonSummon(wizard, casterType, position, level);

    if (!skeleton) {
        console.error('Не удалось создать/восстановить скелета');
        return;
    }

    // Скелет атакует сразу после призыва/восстановления
    performSkeletonAttack(skeleton, wizard);

    // Применяем бонус фракции некроманта
    applyNecromantFactionBonus(wizard, casterType);
}

// Атака скелета
// Скелеты НЕ подвержены ослеплению хозяина - это атаки существа
function performSkeletonAttack(skeleton, caster) {
    if (!skeleton || skeleton.hp <= 0) return;

    const target = typeof window.findTarget === 'function' ?
        window.findTarget(skeleton.position, skeleton.casterType, null, 'skeleton_attack') : null;

    if (target) {
        // Анимация атаки
        const visual = window.summonsManager?.visuals.get(skeleton.id);
        if (visual) {
            const targetSprite = window.wizardSprites?.[`${target.column || 0}_${target.position}`];
            if (targetSprite) {
                window.summonsManager.playAttackAnimation(
                    skeleton.id,
                    targetSprite.x,
                    targetSprite.y
                );
            }
        }

        // На 5 уровне: 50% шанс пробить 50% брони
        let armorIgnore = 0;
        let armorPierced = false;
        if (skeleton.level >= 5 && Math.random() < 0.5) {
            armorIgnore = 50; // 50% брони игнорируется (в процентах для applyFinalDamage)
            armorPierced = true;
        }

        // Применяем урон
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(caster, target.wizard, skeleton.damage, 'skeleton_attack', armorIgnore, false) : skeleton.damage;

        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;

        // Урон скелета для XP хозяина подсчитывается через дельту HP в core.js

        // Обновляем визуальный HP бар цели
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
            const targetCol = target.column !== undefined ? target.column : (skeleton.casterType === 'player' ? 0 : 5);
            const targetRow = target.position;
            const key = `${targetCol}_${targetRow}`;
            window.pixiWizards.updateHP(key, target.wizard.hp, target.wizard.max_hp);
        }

        // Проверка смерти и анимация
        if (target.wizard.hp <= 0) {
            if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                const targetCol = target.column !== undefined ? target.column : (skeleton.casterType === 'player' ? 0 : 5);
                const targetRow = target.position;
                const key = `${targetCol}_${targetRow}`;
                const container = window.wizardSprites?.[key];
                if (container && !container.deathAnimationStarted) {
                    container.deathAnimationStarted = true;
                    window.pixiWizards.playDeath(targetCol, targetRow);
                }
            }
            if (typeof window.trackBattleKill === 'function' && skeleton.casterType === 'player') {
                window.trackBattleKill(caster);
            }
        }

        // Логирование
        if (typeof window.logSpellHit === 'function') {
            const bonuses = [];
            if (skeleton.level) bonuses.push(`Ур.${skeleton.level}`);
            if (armorPierced) bonuses.push(`💀-50% брони`);
            if (caster.name !== skeleton.name) bonuses.push(`от ${caster.name}`);
            window.logSpellHit(skeleton, target.wizard, finalDamage, 'Удар скелета', bonuses);
        } else if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`💀 Скелет атакует ${target.wizard.name}: ${finalDamage} урона (${target.wizard.hp}/${target.wizard.max_hp} HP)`);
        }
    }
}

// --- Костяное копьё (Bone Spear) - Tier 2, пронзает ряд ---
function castBoneSpear(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 13, 16, 20, 24][level - 1] || 10;
    const armorIgnore = level >= 5 ? 50 : 0; // Lv5: 50% игнор брони (в процентах для applyFinalDamage)

    // Определяем колонки для пронзания (от ближней к дальней)
    // Игрок атакует: стена(2) → призванные(1) → маги(0)
    // Враг атакует: стена(3) → призванные(4) → маги(5)
    const targetColumns = casterType === 'player' ? [2, 1, 0] : [3, 4, 5];

    // Определяем ряд для атаки: сначала пробуем ряд кастера,
    // если там пусто — ищем ближайший ряд с живым врагом
    let targetRow = position;

    const findTargetsInRow = (row) => {
        const rowTargets = [];
        for (const col of targetColumns) {
            // Стены (колонки 2 и 3)
            if (col === 2 || col === 3) {
                if (typeof window.findEarthWallAt === 'function') {
                    const wall = window.findEarthWallAt(col, row);
                    if (wall && wall.hp > 0) {
                        rowTargets.push({ wizard: { ...wall, type: 'earth_wall_hp' }, position: row, column: col, isWall: true });
                    }
                }
            }
            // Призванные существа (колонки 1 и 4)
            else if (col === 1 || col === 4) {
                if (typeof window.findSummonedCreatureAt === 'function') {
                    const summoned = window.findSummonedCreatureAt(col, row);
                    if (summoned && summoned.hp > 0) {
                        rowTargets.push({ wizard: summoned, position: row, column: col, isSummoned: true });
                    }
                }
            }
            // Маги (колонки 0 и 5)
            else if (col === 0) {
                const enemy = window.enemyFormation?.[row];
                if (enemy && enemy.hp > 0) {
                    rowTargets.push({ wizard: enemy, position: row, column: col });
                }
            }
            else if (col === 5) {
                const wizardId = window.playerFormation?.[row];
                if (wizardId) {
                    const target = window.playerWizards?.find(w => w.id === wizardId);
                    if (target && target.hp > 0) {
                        rowTargets.push({ wizard: target, position: row, column: col });
                    }
                }
            }
        }
        return rowTargets;
    };

    // Сначала ищем в ряду кастера
    let targets = findTargetsInRow(position);

    // Если в ряду кастера пусто — ищем ближайший ряд с целью
    if (targets.length === 0) {
        const maxRows = 5;
        for (let offset = 1; offset < maxRows; offset++) {
            // Проверяем ряды выше и ниже
            for (const row of [position - offset, position + offset]) {
                if (row >= 0 && row < maxRows) {
                    const rowTargets = findTargetsInRow(row);
                    if (rowTargets.length > 0) {
                        targets = rowTargets;
                        targetRow = row;
                        break;
                    }
                }
            }
            if (targets.length > 0) break;
        }
    }

    if (targets.length === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🦴 ${wizard.name} метает Костяное копьё, но цель не найдена`);
        }
        return;
    }

    // Лог начала
    if (typeof window.addToBattleLog === 'function') {
        const boostText = window.getAoeBoostText ? window.getAoeBoostText(wizard) : '';
        window.addToBattleLog(`🦴 ${wizard.name} метает Костяное копьё [Ур.${level}]! ${boostText}Пронзает ${targets.length} ${targets.length === 1 ? 'цель' : 'целей'}`);
    }

    if (level >= 5 && armorIgnore > 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`   💀 Копьё пронзает броню! (-50% брони)`);
        }
    }

    // Наносим урон каждой цели в ряду
    let totalDamage = 0;
    for (const target of targets) {
        let actualDamage = baseDamage;

        // Фракционный бонус некроманта (двойной урон)
        const casterInfo = { faction: wizard.faction, casterType: casterType, position: position };
        if (wizard.faction === 'necromant' && typeof window.checkFactionDoubleDamage === 'function') {
            const isDouble = window.checkFactionDoubleDamage(wizard.faction, 'necromant', casterInfo);
            if (isDouble) {
                actualDamage = baseDamage * 2;
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`   💀 Двойной урон некромантии!`);
                }
            }
        }

        // Применяем урон через систему урона (isAOE = true для пронзания)
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(wizard, target.wizard, actualDamage, 'bone_spear', armorIgnore, true) : actualDamage;

        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        totalDamage += finalDamage;

        // Обновляем визуальный HP бар
        if (typeof window.updateWizardVisualHP === 'function') {
            window.updateWizardVisualHP(target.wizard, target.column, target.position);
        }

        // Лог попадания (единый формат через logSpellHit)
        if (typeof window.logSpellHit === 'function') {
            window.logSpellHit(wizard, target.wizard, finalDamage, 'Костяное копьё');
        } else if (typeof window.addToBattleLog === 'function') {
            const targetName = target.isWall ? 'Стена' : (target.isSummoned ? target.wizard.name || 'Существо' : target.wizard.name);
            window.addToBattleLog(`🦴 → ${targetName}: ${finalDamage} урона (HP: ${target.wizard.hp}/${target.wizard.max_hp || '?'})`);
        }

        // Урон для XP подсчитывается через дельту HP в core.js

        // Проверка смерти
        if (target.wizard.hp <= 0) {
            if (typeof window.trackBattleKill === 'function' && casterType === 'player' && !target.isWall) {
                window.trackBattleKill(wizard);
            }
        }
    }

    // Запускаем анимацию
    if (window.spellAnimations?.bone_spear?.play) {
        window.spellAnimations.bone_spear.play({
            casterType: casterType,
            position: targetRow,
            targets: targets,
            level: level
        });
    }
}

// --- Покров смерти (Death Shroud) - Тир 3, Пассивный бафф ---
// Применяется в начале боя
function applyDeathShroudAtStart(wizard, level, position, casterType) {
    const darkPoisonResist = [15, 20, 25, 30, 40][level - 1] || 15;
    const lightVulnerability = [5, 10, 15, 20, 25][level - 1] || 5;

    if (!wizard.buffs) wizard.buffs = {};

    wizard.buffs.death_shroud = {
        darkPoisonResist: darkPoisonResist,
        lightVulnerability: lightVulnerability,
        level: level
    };

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🎯 Покров смерти [Ур.${level}] → ${wizard.name}`);
        window.addToBattleLog(`    ├─ 🛡️ Сопротивление Тьме/Яду: -${darkPoisonResist}%`);
        window.addToBattleLog(`    └─ ⚠️ Уязвимость к Свету: +${lightVulnerability}%`);
    }
}

// --- Костяная клетка (Bone Cage) - Тир 4, Утилити ---
function castBoneCage(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const cageHP = [30, 35, 40, 45, 50][level - 1] || 30;

    // Поиск цели — стандартный single target, но только маги (не стены/существа)
    const target = typeof window.findTarget === 'function' ?
        window.findTarget(position, casterType, wizard, 'bone_cage') : null;

    if (!target || !target.wizard || target.wizard.hp <= 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🪤 ${wizard.name} пытается наложить Костяную клетку, но цель не найдена`);
        }
        return;
    }

    const targetWizard = target.wizard;

    // Инициализируем effects если нет
    if (!targetWizard.effects) targetWizard.effects = {};

    // Накладываем клетку
    targetWizard.effects.bone_cage = {
        hp: cageHP,
        maxHP: cageHP,
        level: level,
        casterId: wizard.id,
        casterType: casterType
    };

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🎯 Костяная клетка [Ур.${level}] → ${targetWizard.name} (HP клетки: ${cageHP}/${cageHP})`);
        if (level >= 5) {
            window.addToBattleLog(`    ├─ 💀 Каждый каст наносит ${cageHP} урона захваченному магу`);
        }
        window.addToBattleLog(`    └─ HP цели: ${targetWizard.hp}/${targetWizard.max_hp}`);
    }

    // Запускаем анимацию
    if (window.spellAnimations?.bone_cage?.play) {
        window.spellAnimations.bone_cage.play({
            casterType: casterType,
            position: position,
            targets: [target],
            level: level
        });
    }
}

// Проверка и обработка клетки перед кастом мага
// Возвращает true если single target заклинание было поглощено клеткой
function processBoneCageOnCast(cagedWizard, spellId, baseDamage) {
    const cage = cagedWizard.effects?.bone_cage;
    if (!cage || cage.hp <= 0) return false;

    // Lv5: самоурон при каждом касте (до поглощения)
    if (cage.level >= 5) {
        const selfDamage = cage.maxHP;
        cagedWizard.hp -= selfDamage;
        if (cagedWizard.hp < 0) cagedWizard.hp = 0;

        const spellDisplayName = window.SPELL_NAMES?.[spellId] || spellId;
        if (typeof window.logSpellHit === 'function') {
            window.logSpellHit({ name: 'Костяная клетка' }, cagedWizard, selfDamage, `Самоурон Костяной клетки (${spellDisplayName})`);
        } else if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🪤💀 ${cagedWizard.name} получает ${selfDamage} урона от Костяной клетки при касте ${spellDisplayName}! (HP: ${cagedWizard.hp}/${cagedWizard.max_hp})`);
        }

        // Обновляем HP бар
        if (typeof window.updateWizardVisualHP === 'function') {
            const casterType = cage.casterType === 'player' ? 'enemy' : 'player';
            const col = casterType === 'player' ? 5 : 0;
            const pos = casterType === 'player' ?
                window.playerFormation?.findIndex(id => id === cagedWizard.id) :
                window.enemyFormation?.findIndex(w => w && w.id === cagedWizard.id);
            if (pos !== undefined && pos !== -1) {
                window.updateWizardVisualHP(cagedWizard, col, pos);
            }
        }
    }

    // Определяем тип заклинания
    const spellType = window.SPELL_TYPE_CONFIG?.[spellId];
    const isSingleTarget = (spellType === 'single_target');

    // Single target: урон идёт в клетку
    if (isSingleTarget && baseDamage > 0) {
        const cageDamage = Math.min(baseDamage, cage.hp);
        cage.hp -= cageDamage;
        const remaining = baseDamage - cageDamage;

        if (typeof window.addToBattleLog === 'function') {
            if (cage.hp <= 0) {
                window.addToBattleLog(`🪤 Костяная клетка разрушена! (поглотила ${cageDamage} урона, остаток: ${remaining})`);
            } else {
                window.addToBattleLog(`🪤 Костяная клетка поглотила ${cageDamage} урона (HP клетки: ${cage.hp}/${cage.maxHP})`);
            }
        }

        if (cage.hp <= 0) {
            // Клетка разрушена — убираем визуал
            if (window.spellAnimations?.bone_cage?.removeCage) {
                window.spellAnimations.bone_cage.removeCage(cagedWizard.id);
            }
            delete cagedWizard.effects.bone_cage;
            // Остаток пролетит в цель (через обычную логику)
            return { absorbed: false, remainingDamage: remaining };
        }

        // Клетка выжила — урон полностью поглощён
        return { absorbed: true, remainingDamage: 0 };
    }

    // AOE: проходит мимо клетки (но самоурон lv5 уже применён выше)
    return { absorbed: false, remainingDamage: baseDamage };
}

// Восстановление клетки в ход некроманта
function restoreBoneCages(casterId) {
    // Ищем всех магов с клеткой от этого кастера
    const allWizards = [
        ...(window.playerWizards || []),
        ...(window.enemyFormation?.filter(w => w) || [])
    ];

    for (const wizard of allWizards) {
        const cage = wizard.effects?.bone_cage;
        if (cage && cage.casterId === casterId && wizard.hp > 0) {
            cage.hp = cage.maxHP;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🪤 Костяная клетка на ${wizard.name} восстановлена (HP: ${cage.maxHP})`);
            }
        }
    }
}

// ========================================
// 🐉 КОСТЯНОЙ ДРАКОН (Tier 5)
// ========================================

// Призыв Костяного Дракона в начале боя
function summonBoneDragonAtStart(wizard, level, position, casterType) {
    if (!window.summonsManager) return;

    const hpPercent = [50, 60, 70, 80, 100][level - 1] || 50;
    const dragonHP = Math.floor((wizard.max_hp || wizard.hp) * hpPercent / 100);
    const dragonDamage = [50, 60, 70, 80, 100][level - 1] || 50;

    const dragon = window.summonsManager.createSummon('bone_dragon', {
        casterId: wizard.id,
        casterType: casterType,
        position: position,
        level: level,
        hp: dragonHP,
        maxHP: dragonHP,
        damage: dragonDamage
    });

    if (dragon) {
        // Помечаем дракона как не подлежащего лечению
        dragon.noHeal = true;

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🎯 Костяной Дракон [Ур.${level}] призван ${wizard.name}`);
            window.addToBattleLog(`    ├─ HP: ${dragonHP}/${dragonHP}, Урон: ${dragonDamage}`);
            if (level >= 5) {
                window.addToBattleLog(`    ├─ 💀 Аура: снижение брони всех врагов на 20`);
            }
            window.addToBattleLog(`    └─ Не восстанавливает HP`);
        }

        // На 5 уровне — аура снижения брони
        if (level >= 5) {
            applyBoneDragonAura(wizard.id, casterType);
        }
    }
}

// Атака Костяного Дракона (каждый ход мага-хозяина)
function performBoneDragonAttack(dragon, caster) {
    if (!dragon || dragon.hp <= 0 || !dragon.isAlive) return;

    const target = typeof window.findTarget === 'function' ?
        window.findTarget(dragon.position, dragon.casterType, null, 'bone_dragon_attack') : null;

    if (target && target.wizard && target.wizard.hp > 0) {
        // Анимация атаки
        const visual = window.summonsManager?.visuals.get(dragon.id);
        if (visual) {
            const targetSprite = window.wizardSprites?.[`${target.column || 0}_${target.position}`];
            if (targetSprite) {
                window.summonsManager.playAttackAnimation(
                    dragon.id,
                    targetSprite.x,
                    targetSprite.y
                );
            }
        }

        // Применяем урон
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(caster, target.wizard, dragon.damage, 'bone_dragon_attack', 0, false) : dragon.damage;

        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;

        // Урон дракона для XP хозяина подсчитывается через дельту HP в core.js

        // Обновляем визуальный HP бар цели
        if (typeof window.updateWizardVisualHP === 'function') {
            const targetColumn = target.column || (dragon.casterType === 'player' ? 5 : 0);
            window.updateWizardVisualHP(target.wizard, targetColumn, target.position);
        }

        // Лог попадания (единый формат)
        if (typeof window.logSpellHit === 'function') {
            const bonuses = [];
            if (dragon.level) bonuses.push(`Ур.${dragon.level}`);
            window.logSpellHit(caster, target.wizard, finalDamage, 'Атака Костяного Дракона', bonuses);
        } else if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🐉 Костяной Дракон → ${target.wizard.name}: ${finalDamage} урона (HP: ${target.wizard.hp}/${target.wizard.max_hp})`);
        }

        // Проверка на смерть цели
        if (target.wizard.hp <= 0) {
            if (typeof window.trackBattleKill === 'function' && dragon.casterType === 'player') {
                window.trackBattleKill(caster);
            }
        }
    }
}

// Аура снижения брони (lv5) — применяется при призыве
function applyBoneDragonAura(casterId, casterType) {
    const enemies = casterType === 'player' ? window.enemyWizards : window.playerWizards;
    if (!enemies) return;

    for (const enemy of enemies) {
        if (enemy && enemy.hp > 0) {
            if (!enemy.armorBonuses) enemy.armorBonuses = {};
            enemy.armorBonuses.bone_dragon = -20;
            // Пересчитываем общий бонус брони
            enemy.armorBonus = Object.values(enemy.armorBonuses).reduce((sum, v) => sum + v, 0);

            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🐉 Аура Костяного Дракона: ${enemy.name} теряет 20 брони`);
            }
        }
    }
}

// Снятие ауры при гибели дракона
function removeBoneDragonAura(casterId, casterType) {
    const enemies = casterType === 'player' ? window.enemyWizards : window.playerWizards;
    if (!enemies) return;

    for (const enemy of enemies) {
        if (enemy && enemy.armorBonuses?.bone_dragon) {
            delete enemy.armorBonuses.bone_dragon;
            enemy.armorBonus = Object.values(enemy.armorBonuses).reduce((sum, v) => sum + v, 0);
        }
    }
}

// Проверка и снятие ауры если дракон погиб
function checkBoneDragonAura() {
    if (!window.summonsManager) return;

    // Ищем всех драконов
    const dragons = [];
    for (const [id, summon] of window.summonsManager.summons) {
        if (summon.type === 'bone_dragon') {
            dragons.push(summon);
        }
    }

    // Проверяем для каждой стороны
    for (const casterType of ['player', 'enemy']) {
        const activeDragon = dragons.find(d => d.casterType === casterType && d.isAlive && d.hp > 0 && d.level >= 5);
        if (!activeDragon) {
            // Нет живого дракона lv5 — снимаем ауру
            const enemies = casterType === 'player' ? window.enemyWizards : window.playerWizards;
            if (enemies) {
                for (const enemy of enemies) {
                    if (enemy && enemy.armorBonuses?.bone_dragon) {
                        delete enemy.armorBonuses.bone_dragon;
                        enemy.armorBonus = Object.values(enemy.armorBonuses).reduce((sum, v) => sum + v, 0);
                    }
                }
            }
        }
    }
}

// Бонус фракции Некроманта (заглушка — основной бонус в damage-system.js)
function applyNecromantFactionBonus(wizard, casterType) {
    // Основной бонус некроманта (-10% входящего урона кроме света)
    // реализован в damage-system.js
}

// Экспорт
if (typeof window !== 'undefined') {
    window.castNecromantSpell = castNecromantSpell;
    window.performSkeletonAttack = performSkeletonAttack;
    window.applyDeathShroudAtStart = applyDeathShroudAtStart;
    window.castBoneCage = castBoneCage;
    window.processBoneCageOnCast = processBoneCageOnCast;
    window.restoreBoneCages = restoreBoneCages;
    window.summonBoneDragonAtStart = summonBoneDragonAtStart;
    window.performBoneDragonAttack = performBoneDragonAttack;
    window.checkBoneDragonAura = checkBoneDragonAura;
}
