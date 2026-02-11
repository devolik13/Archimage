// events/event-boss-config.js - Конфигурация ивент боссов

/**
 * Ивент Босс - глобальный босс для всех игроков сервера.
 * У босса общий HP бар, и все игроки наносят урон в него.
 * Время на убийство - 5 дней.
 *
 * Бой проходит как обычный PvE - игрок атакует босса своими магами.
 * После окончания боя суммарный нанесённый урон записывается в общий пул.
 */

// Конфигурация текущего ивент босса
const EVENT_BOSS_CONFIG = {
    // === БОСС: Древний Дракон Хаоса ===
    name: "Древний Дракон Хаоса",

    // Общее HP для всех игроков сервера
    // Рассчитано так, чтобы ~100 активных игроков убили за 5 дней
    totalHp: 5000000, // 5 миллионов HP

    // Характеристики босса В БОЮ (один экземпляр для каждого игрока)
    battleHp: 2000,       // HP босса в отдельном бою (игрок не убьёт за раз)
    battleArmor: 200,     // Броня

    // Фракция и внешний вид
    faction: "fire",
    spriteSheet: "lord_demon", // Используем спрайт лорда демонов

    // Множитель урона (как сильно бьёт босс)
    damageMultiplier: 2.0,

    // Заклинания босса (все стихии - мастер хаоса)
    spells: ["fireball", "blizzard", "ball_lightning", "meteor_shower", "epidemic"],
    spell_levels: {
        'fireball': 8,
        'blizzard': 8,
        'ball_lightning': 8,
        'meteor_shower': 8,
        'epidemic': 8
    },

    // Сопротивления (высокие ко всем стихиям - нужно командное усилие)
    resistances: {
        fire: 40,
        water: 40,
        wind: 40,
        earth: 40,
        nature: 40,
        poison: 40,
        light: 30,    // Чуть слабее к свету
        dark: 30      // Чуть слабее к тьме
    },

    // Длительность события (часы)
    durationHours: 120, // 5 дней

    // Не тратит энергию боя (отдельная механика)
    // У ивент босса свой кулдаун
    attackCooldownMinutes: 60, // 1 час между атаками

    // Награды
    rewards: {
        // Награды за участие (любой кто хоть раз атаковал)
        participation: {
            timeCurrency: 1440 // 1 день времени
        },
        // Награды за топ-3
        top1: { timeCurrency: 28800 }, // 20 дней
        top2: { timeCurrency: 14400 }, // 10 дней
        top3: { timeCurrency: 7200 },  // 5 дней
        // Награда за убийство (если босс побежден до таймера)
        bossKilled: {
            timeCurrency: 4320 // 3 дня каждому участнику
        }
    }
};

/**
 * Генерирует данные врага для Event Boss боя
 * Формат совместим с PvE системой (battle/core.js)
 */
function generateEventBossEnemy(bossConfig) {
    const config = bossConfig || EVENT_BOSS_CONFIG;

    return {
        id: 'event_boss_0',
        name: config.name,
        hp: config.battleHp,
        max_hp: config.battleHp,
        armor: config.battleArmor,
        max_armor: config.battleArmor,
        faction: config.faction,
        spriteSheet: config.spriteSheet,
        damageMultiplier: config.damageMultiplier,
        spells: config.spells,
        spell_levels: config.spell_levels,
        resistances: config.resistances,
        isEventBoss: true,
        isBoss: true,
        // Не является обычным PvE врагом
        isAdventureEnemy: false
    };
}

/**
 * Подсчитывает общий нанесённый урон врагу за бой
 * Вызывается после завершения боя
 */
function calculateEventBossDamage() {
    // Собираем данные о вражеских магах (у ивент босса только один)
    const enemies = window.enemyFormation.filter(e => e && e.isEventBoss);
    if (enemies.length === 0) return 0;

    let totalDamage = 0;

    for (const enemy of enemies) {
        // Урон = max_hp - текущее hp (сколько сняли)
        const maxHp = enemy.max_hp || enemy.original_max_hp || 0;
        const currentHp = Math.max(0, enemy.hp || 0);
        const damageTaken = maxHp - currentHp;

        // Также учитываем снятую броню как бонус
        const maxArmor = enemy.max_armor || enemy.original_max_armor || 0;
        const currentArmor = Math.max(0, enemy.armor || 0);
        const armorDamage = maxArmor - currentArmor;

        // Итого: урон по HP + часть урона по броне (50%)
        totalDamage += damageTaken + Math.floor(armorDamage * 0.5);
    }

    return Math.max(0, totalDamage);
}

// Экспорт
window.EVENT_BOSS_CONFIG = EVENT_BOSS_CONFIG;
window.generateEventBossEnemy = generateEventBossEnemy;
window.calculateEventBossDamage = calculateEventBossDamage;

console.log('🐉 Event Boss Config загружен');
