// battle/spells/spells-necromant.js - Заклинания школы Некромантия

function castNecromantSpell(wizard, spellId, spellData, position, casterType) {
    switch (spellId) {
        case 'summon_skeleton':
            castSummonSkeleton(wizard, spellData, position, casterType);
            break;
        case 'bone_spear':
            castBoneSpear(wizard, spellData, position, casterType);
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
        if (skeleton.level >= 5 && Math.random() < 0.5) {
            armorIgnore = 0.5; // 50% брони игнорируется
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`💀 Скелет пробивает броню!`);
            }
        }

        // Применяем урон
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(caster, target.wizard, skeleton.damage, 'skeleton_attack', armorIgnore, false) : skeleton.damage;

        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;

        // Учитываем урон скелета для XP хозяина
        if (typeof window.trackBattleDamage === 'function' && skeleton.casterType === 'player') {
            window.trackBattleDamage(caster, finalDamage);
        }

        // Обновляем визуальный HP бар цели
        if (typeof window.updateWizardVisualHP === 'function') {
            const targetColumn = target.column || (skeleton.casterType === 'player' ? 5 : 0);
            window.updateWizardVisualHP(target.wizard, targetColumn, target.position);
        }

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`💀 Скелет атакует ${target.wizard.name}: ${finalDamage} урона`);
        }

        // Проверяем смерть
        if (target.wizard.hp <= 0) {
            if (typeof window.trackBattleKill === 'function' && skeleton.casterType === 'player') {
                window.trackBattleKill(caster);
            }
        }
    }
}

// --- Костяное копьё (Bone Spear) - Tier 2, пронзает ряд ---
function castBoneSpear(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const baseDamage = [10, 13, 16, 20, 24][level - 1] || 10;
    const armorIgnore = level >= 5 ? 0.5 : 0; // Lv5: 50% игнор брони

    // Определяем колонки для пронзания (от ближней к дальней)
    // Игрок атакует: стена(2) → призванные(1) → маги(0)
    // Враг атакует: стена(3) → призванные(4) → маги(5)
    const targetColumns = casterType === 'player' ? [2, 1, 0] : [3, 4, 5];

    // Находим все цели в ряду (по позиции кастера)
    const targets = [];
    for (const col of targetColumns) {
        // Стены (колонки 2 и 3)
        if (col === 2 || col === 3) {
            if (typeof window.findEarthWallAt === 'function') {
                const wall = window.findEarthWallAt(col, position);
                if (wall && wall.hp > 0) {
                    targets.push({ wizard: { ...wall, type: 'earth_wall_hp' }, position: position, column: col, isWall: true });
                }
            }
        }
        // Призванные существа (колонки 1 и 4)
        else if (col === 1 || col === 4) {
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(col, position);
                if (summoned && summoned.hp > 0) {
                    targets.push({ wizard: summoned, position: position, column: col, isSummoned: true });
                }
            }
        }
        // Маги (колонки 0 и 5)
        else if (col === 0) {
            const enemy = window.enemyFormation?.[position];
            if (enemy && enemy.hp > 0) {
                targets.push({ wizard: enemy, position: position, column: col });
            }
        }
        else if (col === 5) {
            const wizardId = window.playerFormation?.[position];
            if (wizardId) {
                const target = window.playerWizards?.find(w => w.id === wizardId);
                if (target && target.hp > 0) {
                    targets.push({ wizard: target, position: position, column: col });
                }
            }
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

        // Лог попадания
        if (typeof window.addToBattleLog === 'function') {
            const targetName = target.isWall ? 'Стена' : (target.isSummoned ? target.wizard.name || 'Существо' : target.wizard.name);
            window.addToBattleLog(`   🦴 → ${targetName}: ${finalDamage} урона`);
        }

        // Учёт урона для XP
        if (typeof window.trackBattleDamage === 'function' && casterType === 'player') {
            window.trackBattleDamage(wizard, finalDamage);
        }

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
            position: position,
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
        window.addToBattleLog(`🦇 ${wizard.name} окутан Покровом смерти [Ур.${level}]: -${darkPoisonResist}% урона от Тьмы/Яда, +${lightVulnerability}% урона от Света`);
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
}
