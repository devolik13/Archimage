// battle/systems/experience-system.js - Система опыта v2 (подсчёт в конце боя)


// Константы системы опыта
const EXP_CONFIG = {
    // Новая система - подсчёт в конце боя
    PARTICIPATION_XP: 15,   // Базовый XP за участие в бою
    DAMAGE_TO_EXP: 15,      // 15 урона = 1 опыт (было 10)
    HEAL_TO_EXP: 6,         // 6 исцеления = 1 опыт (было 8, хилеры получают больше)
    KILL_BONUS: 0,          // Бонус за убийство (TODO: добавить отслеживание)
    VICTORY_BONUS: 30,      // За победу в бою (было 10)
    DEFEAT_BONUS: 10,       // За поражение (ново - чтобы был прогресс)
    MAX_LEVEL: 40,          // Максимальный уровень
    BASE_EXP: 50            // Базовый опыт для 2 уровня
};

// Плавная прогрессия опыта (квадратичная, ×2 от старой)
function calculateExpToNext(level) {
    if (level >= EXP_CONFIG.MAX_LEVEL) return 0;
    return 60 + (level * level * 20); // было: 30 + (level * level * 10)
}

// Добавление опыта магу
function addExperienceToWizard(wizard, expAmount) {
    if (!wizard || wizard.level >= EXP_CONFIG.MAX_LEVEL) return;

    // Инициализируем поля опыта если их нет (для старых магов)
    if (!wizard.level) wizard.level = 1;
    if (!wizard.exp_to_next) wizard.exp_to_next = calculateExpToNext(wizard.level);
    // Базовое HP всегда 100 — если original_max_hp раздуто боевыми множителями, сбрасываем
    if (!wizard.original_max_hp || wizard.original_max_hp > 100) wizard.original_max_hp = 100;

    wizard.experience = (wizard.experience || 0) + expAmount;

    // Проверка повышения уровня
    while (wizard.experience >= wizard.exp_to_next && wizard.level < EXP_CONFIG.MAX_LEVEL) {
        wizard.experience -= wizard.exp_to_next;
        wizard.level++;
        wizard.exp_to_next = calculateExpToNext(wizard.level);

        // Применяем бонусы уровня
        applyLevelBonuses(wizard);

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⭐ ${wizard.name} достиг ${wizard.level} уровня!`);
        }
    }

    // Опыт гильдии начисляется одним вызовом в calculateAndGrantBattleExp()
    // чтобы избежать race condition при параллельных RPC
}

// Применение бонусов за уровень (линейный рост + особый бонус на 40)
function applyLevelBonuses(wizard) {
    // Базовое HP всегда 100 — если раздуто, сбрасываем
    if (wizard.original_max_hp && wizard.original_max_hp > 100) wizard.original_max_hp = 100;
    const baseHP = wizard.original_max_hp || 100;
    let hpBonus;

    if (wizard.level === 40) {
        // Уровень 40: +200% HP (×3 от базы)
        hpBonus = 3.0;
    } else if (wizard.level > 1) {
        // Уровни 2-39: +5% за каждый уровень
        hpBonus = 1 + (wizard.level - 1) * 0.05;
    } else {
        // Уровень 1: базовое значение
        hpBonus = 1.0;
    }

    wizard.max_hp = Math.floor(baseHP * hpBonus);
    wizard.hp = Math.min(wizard.hp + 5, wizard.max_hp); // Небольшое исцеление при повышении
}

// Получение множителя урона от уровня (линейный рост + особый бонус на 40)
function getDamageBonusFromLevel(wizard) {
    if (!wizard || !wizard.level) return 1.0;

    let damageBonus;

    if (wizard.level === 40) {
        // Уровень 40: +40% урона
        damageBonus = 1.40;
    } else if (wizard.level > 1) {
        // Уровни 2-39: +1% за каждый уровень
        damageBonus = 1 + (wizard.level - 1) * 0.01;
    } else {
        // Уровень 1: базовое значение
        damageBonus = 1.0;
    }

    return damageBonus;
}

// ============================================
// НОВАЯ СИСТЕМА: Накопление статистики боя
// ============================================

// Инициализация статистики боя только для магов в формации (участников боя)
function initBattleStats() {
    window.battleStats = {};

    // Используем playerFormation - массив ID магов, которые реально в бою
    if (window.playerFormation && window.playerWizards) {
        window.playerFormation.forEach(wizardId => {
            if (!wizardId) return; // Пустой слот в формации

            const wizard = window.playerWizards.find(w => w.id === wizardId);
            if (wizard) {
                window.battleStats[wizard.id] = {
                    name: wizard.name || `Маг ${wizard.id}`,
                    damageDealt: 0,
                    healingDone: 0,
                    kills: 0,
                    participated: true
                };
            }
        });
    }

    console.log('📊 [XP] Статистика боя инициализирована:', Object.keys(window.battleStats).length, 'магов в формации');
}

// Накопление урона в статистику (вызывается во время боя)
function trackBattleDamage(caster, damage) {
    if (!caster || !caster.id || !damage || damage <= 0) return;
    if (!window.battleStats) initBattleStats();

    if (window.battleStats[caster.id]) {
        window.battleStats[caster.id].damageDealt += damage;
    }
}

// Накопление лечения в статистику
function trackBattleHeal(caster, healAmount) {
    if (!caster || !caster.id || !healAmount || healAmount <= 0) return;
    if (!window.battleStats) initBattleStats();

    if (window.battleStats[caster.id]) {
        window.battleStats[caster.id].healingDone += healAmount;
    }
}

// Накопление убийств в статистику
function trackBattleKill(caster) {
    if (!caster || !caster.id) return;
    if (!window.battleStats) initBattleStats();

    if (window.battleStats[caster.id]) {
        window.battleStats[caster.id].kills += 1;
    }
}

// Расчёт XP на основе статистики боя
function calculateWizardBattleExp(stats, isVictory) {
    let exp = EXP_CONFIG.PARTICIPATION_XP; // Базовый XP за участие

    // XP за урон
    exp += Math.floor(stats.damageDealt / EXP_CONFIG.DAMAGE_TO_EXP);

    // XP за лечение
    exp += Math.floor(stats.healingDone / EXP_CONFIG.HEAL_TO_EXP);

    // XP за убийства
    exp += stats.kills * EXP_CONFIG.KILL_BONUS;

    // Бонус за результат боя
    if (isVictory) {
        exp += EXP_CONFIG.VICTORY_BONUS;
    } else {
        exp += EXP_CONFIG.DEFEAT_BONUS;
    }

    return exp;
}

// Главная функция: подсчёт и начисление XP в конце боя
function calculateAndGrantBattleExp(isVictory) {
    if (!window.battleStats || !window.playerWizards) {
        console.warn('⚠️ [XP] Нет статистики боя или магов');
        return [];
    }

    const expResults = [];

    // Выводим заголовок в боевой лог
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`\n📊 ═══ СТАТИСТИКА БОЯ ═══`);
    }

    window.playerWizards.forEach(wizard => {
        if (!wizard || !wizard.id) return;

        const stats = window.battleStats[wizard.id];
        if (!stats) return;

        const levelBefore = wizard.level || 1;
        const expBefore = wizard.experience || 0;

        // Рассчитываем XP
        const expGained = calculateWizardBattleExp(stats, isVictory);

        // Начисляем XP
        addExperienceToWizard(wizard, expGained);

        const levelGained = (wizard.level || 1) - levelBefore;

        // Сохраняем результат для отображения
        expResults.push({
            name: stats.name,
            damageDealt: stats.damageDealt,
            healingDone: stats.healingDone,
            kills: stats.kills,
            expGained: expGained,
            levelGained: levelGained,
            newLevel: wizard.level || 1
        });

        // Выводим статистику в боевой лог
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`\n🧙 ${stats.name}:`);
            window.addToBattleLog(`   ⚔️ Урон нанесён: ${stats.damageDealt}`);
            if (stats.healingDone > 0) {
                window.addToBattleLog(`   💚 Исцеление: ${stats.healingDone}`);
            }
            if (stats.kills > 0) {
                window.addToBattleLog(`   💀 Убийств: ${stats.kills}`);
            }
            window.addToBattleLog(`   ✨ Опыт получен: +${expGained} XP`);
            if (levelGained > 0) {
                window.addToBattleLog(`   ⭐ Повышение уровня! ${levelBefore} → ${wizard.level}`);
            }
        }

        console.log(`✨ [XP] ${stats.name}: +${expGained} XP (урон: ${stats.damageDealt}, лечение: ${stats.healingDone}, убийств: ${stats.kills})`);
    });

    // Выводим итог
    if (typeof window.addToBattleLog === 'function') {
        const totalDamage = expResults.reduce((sum, r) => sum + r.damageDealt, 0);
        const totalHealing = expResults.reduce((sum, r) => sum + r.healingDone, 0);
        const totalExp = expResults.reduce((sum, r) => sum + r.expGained, 0);

        window.addToBattleLog(`\n📈 ИТОГО:`);
        window.addToBattleLog(`   ⚔️ Общий урон: ${totalDamage}`);
        if (totalHealing > 0) {
            window.addToBattleLog(`   💚 Общее исцеление: ${totalHealing}`);
        }
        window.addToBattleLog(`   ✨ Общий опыт: +${totalExp} XP`);
        window.addToBattleLog(`═══════════════════════════════`);
    }

    // Добавляем суммарный опыт гильдии ОДНИМ вызовом (вместо 5 параллельных)
    const totalGuildExp = expResults.reduce((sum, r) => sum + r.expGained, 0);
    if (totalGuildExp > 0 && window.userData?.guild_id && window.guildManager?.currentGuild) {
        window.guildManager.addGuildExperience(totalGuildExp);
    }

    // Очищаем статистику
    window.battleStats = null;

    return expResults;
}

// ============================================
// Старые функции (для совместимости, теперь накапливают статистику)
// ============================================

// Теперь накапливает статистику вместо мгновенного начисления
function trackDamageExp(caster, damage) {
    trackBattleDamage(caster, damage);
}

// Теперь накапливает статистику вместо мгновенного начисления
function trackHealExp(caster, healAmount) {
    trackBattleHeal(caster, healAmount);
}

// Теперь вызывает новую систему
function grantBattleExp(wizards, isVictory = true) {
    // Эта функция теперь просто триггер для новой системы
    // Реальный подсчёт происходит в calculateAndGrantBattleExp
    return calculateAndGrantBattleExp(isVictory);
}

// Устаревшая функция для обратной совместимости
function grantVictoryExp(winners) {
    return grantBattleExp(winners, true);
}

// Инициализация уровней для новых магов
function initializeWizardLevel(wizard) {
    if (!wizard.level) wizard.level = 1;
    if (!wizard.experience) wizard.experience = 0;
    if (!wizard.exp_to_next) wizard.exp_to_next = calculateExpToNext(wizard.level);
    // Базовое HP всегда 100 — если раздуто боевыми множителями, сбрасываем
    if (!wizard.original_max_hp || wizard.original_max_hp > 100) wizard.original_max_hp = 100;
}

// Экспорт
window.EXP_CONFIG = EXP_CONFIG;
window.calculateExpToNext = calculateExpToNext;
window.addExperienceToWizard = addExperienceToWizard;
window.applyLevelBonuses = applyLevelBonuses;
window.getDamageBonusFromLevel = getDamageBonusFromLevel;
window.initializeWizardLevel = initializeWizardLevel;

// Новая система статистики боя
window.initBattleStats = initBattleStats;
window.trackBattleDamage = trackBattleDamage;
window.trackBattleHeal = trackBattleHeal;
window.trackBattleKill = trackBattleKill;
window.calculateAndGrantBattleExp = calculateAndGrantBattleExp;

// Старые функции (для совместимости)
window.trackDamageExp = trackDamageExp;
window.trackHealExp = trackHealExp;
window.grantVictoryExp = grantVictoryExp;
window.grantBattleExp = grantBattleExp;

console.log('✅ Experience System v2 загружена (подсчёт в конце боя)');