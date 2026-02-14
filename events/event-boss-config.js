// events/event-boss-config.js - Конфигурация ивент боссов

/**
 * Ивент Босс - глобальный босс для ВСЕХ игроков сервера.
 * У босса общий HP бар, все игроки бьют его и урон суммируется.
 *
 * МЕХАНИКА БОЯ:
 * - Босс в бою имеет ОГРОМНОЕ HP (999999) — игрок НЕ может его убить.
 * - Бой заканчивается когда все маги игрока умирают.
 * - Весь нанесённый урон записывается в общий пул.
 * - HP бар в бою показывает глобальное HP босса (напр. 5M, 4.8M и т.д.)
 *
 * ПОПЫТКИ: 10 бесплатных в день, доп. покупаются за Stars.
 *
 * ВРЕМЯ ИВЕНТА: 1 неделя (168 часов).
 * Во время ивента добыча времени у всех -15% (ослаблено Архимагом Света).
 * Босс ослаблен: входящий урон +30% (incomingDamageMultiplier: 1.3).
 * Победа (босс убит) → +30% добычи следующую неделю.
 * Поражение (босс выжил) → -50% добычи следующую неделю.
 */

// === КОНФИГУРАЦИЯ ИВЕНТ БОССА ===
const EVENT_BOSS_CONFIG = {
    // Версия конфига — при смене сбрасывается HP босса и попытки всех игроков
    configVersion: 3,

    // Имя босса
    name: "Отродье Тьмы",

    // Общее HP для всех игроков сервера
    totalHp: 5000000, // 5 миллионов

    // HP босса В БОЮ (огромное — игрок не убьёт)
    battleHp: 999999,
    battleArmor: 150,

    // Фракция и внешний вид
    faction: "dark",
    spriteSheet: "spawn_of_darkness", // assets/sprites/event_boss/spawn_of_darkness.webp

    // Множитель урона босса
    damageMultiplier: 1.0,

    // Множитель ВХОДЯЩЕГО урона (ослабление босса Архимагом Света)
    // 1.3 = босс получает на 30% больше урона
    incomingDamageMultiplier: 1.3,

    // Иммунитет к стакам яда (яд не накладывается на босса)
    poisonImmune: true,

    // Заклинания: Яд + Тьма (максимальная боль)
    spells: ["epidemic", "plague", "foul_cloud", "shadow_realm", "fading"],
    spell_levels: {
        'epidemic': 8,       // Яд Tier 5 — массовый AoE + отравление
        'plague': 8,         // Яд Tier 4 — AoE
        'foul_cloud': 8,     // Яд Tier 3 — AoE ядовитое облако
        'shadow_realm': 8,   // Тьма Tier 4 — % от потерянного HP
        'fading': 8          // Тьма Tier 5 — AoE угасание
    },

    // Сопротивления:
    // - 40% ко всем стихиям
    // - 75% к Тьме и Яду (его родные школы)
    // - 0% к Свету (уязвимость!)
    resistances: {
        fire: 40,
        water: 40,
        wind: 40,
        earth: 40,
        nature: 40,
        poison: 75,   // Родная школа — высокое сопротивление
        light: 0,     // УЯЗВИМ к свету!
        dark: 75      // Родная школа — высокое сопротивление
    },

    // Время ивента (UTC)
    // Старт: 14 февраля 2026, 12:00 МСК = 09:00 UTC
    eventStartUTC: "2026-02-14T09:00:00Z",
    // Длительность события (часы) — 1 неделя
    durationHours: 168,

    // Система попыток
    maxDailyAttempts: 10,         // Бесплатных попыток в день
    extraAttemptStarsCost: 75,    // Цена доп. попытки в Stars (~100 руб)
    extraAttemptPriceUSD: 0.98,   // Цена в USD (для конвертации в TON)

    // Модификатор добычи времени
    // duringEventActive: true/false — ручное вкл/выкл штрафа добычи
    timeCurrencyModifier: {
        duringEventActive: true,   // ← переключить вручную
        duringEvent: -0.15,        // -15% во время ивента (ослаблено Архимагом Света)
        onVictory: 0.30,          // +30% если игроки победили
        onDefeat: -0.50           // -50% если игроки проиграли
    },

    // Награды
    rewards: {
        participation: {
            timeCurrency: 1440    // 1 день — каждому участнику
        },
        top1: { timeCurrency: 28800 }, // 20 дней
        top2: { timeCurrency: 14400 }, // 10 дней
        top3: { timeCurrency: 7200 },  // 5 дней
        bossKilled: {
            timeCurrency: 4320    // 3 дня каждому если босс убит
        },
        finishingBlow: {
            timeCurrency: 10080   // 7 дней (1 неделя) — контрольный удар
        }
    }
};

/**
 * Генерирует врага-босса для боя.
 * HP = 999999 (неубиваемый в бою), урон считается по факту.
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
        poisonImmune: config.poisonImmune || false,
        isEventBoss: true,
        isBoss: true,
        isAdventureEnemy: false
    };
}

/**
 * Подсчитывает нанесённый урон боссу за бой.
 * Возвращает { hpDamage } — чистый урон по HP.
 * Используется и для снятия HP босса, и для лидерборда.
 * Вызывается после завершения боя.
 */
function calculateEventBossDamage() {
    const enemies = window.enemyFormation.filter(e => e && e.isEventBoss);
    if (enemies.length === 0) return { hpDamage: 0 };

    let hpDamage = 0;

    for (const enemy of enemies) {
        const maxHp = enemy.original_max_hp || enemy.max_hp || 0;
        const currentHp = Math.max(0, enemy.hp || 0);
        hpDamage += maxHp - currentHp;
    }

    // Ослабление босса Архимагом Света — входящий урон увеличен
    const multiplier = EVENT_BOSS_CONFIG.incomingDamageMultiplier || 1.0;
    if (multiplier !== 1.0) {
        hpDamage = Math.round(hpDamage * multiplier);
    }

    return { hpDamage: Math.max(0, hpDamage) };
}

/**
 * Получить текущий модификатор добычи времени от ивент босса.
 * Возвращает число (напр. -0.15 = минус 15%, 0.30 = плюс 30%).
 * Возвращает 0 если нет активного модификатора.
 *
 * duringEvent — ручной флаг duringEventActive (true/false в конфиге).
 * onVictory/onDefeat — зависят от статуса босса (defeated/expired).
 */
function getEventBossTimeModifier() {
    const config = EVENT_BOSS_CONFIG;
    const mod = config.timeCurrencyModifier;

    // Штраф во время ивента — ручной флаг
    if (mod.duringEventActive) {
        return mod.duringEvent;
    }

    // Пост-ивент: бонус/штраф по статусу босса
    const manager = window.eventBossManager;
    const boss = manager?.currentBoss;
    if (!boss) return 0;

    if (boss.status === 'defeated') {
        const defeatedAt = new Date(boss.defeated_at || boss.ends_at);
        const bonusEndsAt = new Date(defeatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() < bonusEndsAt) {
            return mod.onVictory;
        }
    }

    if (boss.status === 'expired') {
        const expiredAt = new Date(boss.ends_at);
        const penaltyEndsAt = new Date(expiredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() < penaltyEndsAt) {
            return mod.onDefeat;
        }
    }

    return 0;
}

// Экспорт
window.EVENT_BOSS_CONFIG = EVENT_BOSS_CONFIG;
window.generateEventBossEnemy = generateEventBossEnemy;
window.calculateEventBossDamage = calculateEventBossDamage;
window.getEventBossTimeModifier = getEventBossTimeModifier;

console.log('🐉 Event Boss Config загружен');
