// battle/systems/experience-system.js - Обновленная система опыта


// Константы системы опыта
const EXP_CONFIG = {
    DAMAGE_TO_EXP: 10,      // 10 урона = 1 опыт
    HEAL_TO_EXP: 8,         // 8 исцеления = 1 опыт
    VICTORY_BONUS: 10,      // За победу в бою
    MAX_LEVEL: 40,          // Максимальный уровень (было 20)
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
    if (!wizard.original_max_hp) wizard.original_max_hp = wizard.max_hp || 100;

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

    // Добавляем опыт гильдии (если игрок в гильдии)
    if (window.userData?.guild_id && window.guildManager?.currentGuild) {
        window.guildManager.addGuildExperience(expAmount);
    }
}

// Применение бонусов за уровень с особым бонусом на 40 уровне
function applyLevelBonuses(wizard) {
    const baseHP = wizard.original_max_hp || 100;
    let hpBonus;

    if (wizard.level === 40) {
        // Уровень 40: +100% HP (удвоение)
        hpBonus = 2.0;
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

// Получение множителя урона от уровня с особым бонусом на 40 уровне
function getDamageBonusFromLevel(wizard) {
    if (!wizard || !wizard.level) return 1.0;

    let damageBonus;

    if (wizard.level === 40) {
        // Уровень 40: +20% урона
        damageBonus = 1.20;
    } else if (wizard.level > 1) {
        // Уровни 2-39: +1% за каждый уровень
        damageBonus = 1 + (wizard.level - 1) * 0.01;
    } else {
        // Уровень 1: базовое значение
        damageBonus = 1.0;
    }

    return damageBonus;
}

// Учет опыта за нанесенный урон
function trackDamageExp(caster, damage) {
    if (!caster || !damage || damage <= 0) return;
    
    const expGained = Math.floor(damage / EXP_CONFIG.DAMAGE_TO_EXP);
    if (expGained > 0) {
        addExperienceToWizard(caster, expGained);
    }
}

// Учет опыта за исцеление
function trackHealExp(caster, healAmount) {
    if (!caster || !healAmount || healAmount <= 0) return;
    
    const expGained = Math.floor(healAmount / EXP_CONFIG.HEAL_TO_EXP);
    if (expGained > 0) {
        addExperienceToWizard(caster, expGained);
    }
}

// Начисление опыта за победу
function grantVictoryExp(winners) {
    if (!Array.isArray(winners)) return;
    
    winners.forEach(wizard => {
        if (wizard && wizard.hp > 0) {
            addExperienceToWizard(wizard, EXP_CONFIG.VICTORY_BONUS);
        }
    });
}

// Инициализация уровней для новых магов
function initializeWizardLevel(wizard) {
    if (!wizard.level) wizard.level = 1;
    if (!wizard.experience) wizard.experience = 0;
    if (!wizard.exp_to_next) wizard.exp_to_next = calculateExpToNext(wizard.level);
    if (!wizard.original_max_hp) wizard.original_max_hp = wizard.max_hp;
}

// Экспорт
window.EXP_CONFIG = EXP_CONFIG;
window.calculateExpToNext = calculateExpToNext;
window.addExperienceToWizard = addExperienceToWizard;
window.applyLevelBonuses = applyLevelBonuses;
window.getDamageBonusFromLevel = getDamageBonusFromLevel;
window.trackDamageExp = trackDamageExp;
window.trackHealExp = trackHealExp;
window.grantVictoryExp = grantVictoryExp;
window.initializeWizardLevel = initializeWizardLevel;