// battle/spells/spells-necromant.js - Заклинания школы Некромантия

function castNecromantSpell(wizard, spellId, spellData, position, casterType) {
    switch (spellId) {
        case 'summon_skeleton':
            castSummonSkeleton(wizard, spellData, position, casterType);
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

// Бонус фракции Некроманта (заглушка — основной бонус в damage-system.js)
function applyNecromantFactionBonus(wizard, casterType) {
    // Основной бонус некроманта (-10% входящего урона кроме света)
    // реализован в damage-system.js
}

// Экспорт
if (typeof window !== 'undefined') {
    window.castNecromantSpell = castNecromantSpell;
    window.performSkeletonAttack = performSkeletonAttack;
}
