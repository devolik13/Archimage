// wizards/adventure/pve-chapter1-config.js

/**
 * ГЛАВА 1: "Испытание Стихий"
 * 50 уровней PvE контента
 *
 * Структура врагов:
 * - Уровни 1-9: Гоблины (обычная атака)
 * - Уровень 10: Огненный Элементаль (мини-босс)
 * - Уровни 11-19: Орки (обычная атака)
 * - Уровень 20: Водный Элементаль (мини-босс)
 * - Уровни 21-29: Тролли (обычная атака)
 * - Уровень 30: Воздушный Элементаль (мини-босс)
 * - Уровни 31-39: Огры (обычная атака)
 * - Уровень 40: Земной Элементаль (мини-босс)
 * - Уровни 41-49: Демоны (обычная атака)
 * - Уровень 50: Повелитель Хаоса (финальный босс)
 *
 * Награды: ТОЛЬКО ВРЕМЯ на уровнях 10, 20, 30, 40, 50
 */

// Базовые характеристики типов врагов
const ENEMY_TYPES = {
    goblin: {
        name: "Гоблин",
        baseHp: 30,
        baseDamage: 5,
        hpGrowth: 5,      // HP растет на 5 каждый уровень
        damageGrowth: 1,   // урон растет на 1 каждый уровень
        armor: 100,        // стандартная броня
        attackType: "physical", // физическая атака
        spriteSheet: "goblin"
    },
    orc: {
        name: "Орк",
        baseHp: 80,
        baseDamage: 15,
        hpGrowth: 8,
        damageGrowth: 2,
        armor: 70,
        attackType: "physical",
        spriteSheet: "orc"
    },
    troll: {
        name: "Тролль",
        baseHp: 150,
        baseDamage: 25,
        hpGrowth: 12,
        damageGrowth: 3,
        armor: 90,
        attackType: "physical",
        spriteSheet: "troll"
    },
    ogre: {
        name: "Огр",
        baseHp: 250,
        baseDamage: 35,
        hpGrowth: 15,
        damageGrowth: 4,
        armor: 110,
        attackType: "physical",
        spriteSheet: "ogre"
    },
    demon: {
        name: "Демон",
        baseHp: 400,
        baseDamage: 50,
        hpGrowth: 20,
        damageGrowth: 5,
        armor: 130,
        attackType: "physical",
        spriteSheet: "demon"
    }
};

// Элементали - мини-боссы
const ELEMENTALS = {
    fire: {
        name: "Огненный Элементаль",
        hp: 400,
        armor: 150,
        faction: "fire",
        spells: ['firebolt', 'fireball'],  // ID заклинаний (ИСПРАВЛЕНО: fire_arrow → firebolt)
        spell_levels: {  // Уровни заклинаний
            'firebolt': 5,  // ИСПРАВЛЕНО: fire_arrow → firebolt
            'fireball': 3
        },
        resistances: {
            fire: 75,    // 75% сопротивление огню
            water: 30,   // 30% ко всем остальным
            wind: 30,
            earth: 30,
            nature: 30,
            poison: 30
        }
    },
    water: {
        name: "Водный Элементаль",
        hp: 600,
        armor: 170,
        faction: "water",
        spells: ["icicle", "frost_arrow", "blizzard"],
        resistances: {
            fire: 30,
            water: 75,   // 75% сопротивление воде
            wind: 30,
            earth: 30,
            nature: 30,
            poison: 30
        }
    },
    wind: {
        name: "Воздушный Элементаль",
        hp: 800,
        armor: 190,
        faction: "wind",
        spells: ["gust", "wind_blade", "storm_cloud"],
        resistances: {
            fire: 30,
            water: 30,
            wind: 75,    // 75% сопротивление воздуху
            earth: 30,
            nature: 30,
            poison: 30
        }
    },
    earth: {
        name: "Земной Элементаль",
        hp: 1000,
        armor: 210,
        faction: "earth",
        spells: ["pebble", "stone_spike", "meteor_shower"],
        resistances: {
            fire: 30,
            water: 30,
            wind: 30,
            earth: 75,   // 75% сопротивление земле
            nature: 30,
            poison: 30
        }
    }
};

// Финальный босс уровня 50
const FINAL_BOSS = {
    name: "Повелитель Хаоса",
    hp: 2000,
    armor: 250,
    faction: "fire", // визуально будет огненным
    spells: ["fireball", "blizzard", "chain_lightning", "meteor_shower", "epidemic"], // все стихии
    resistances: {
        fire: 50,
        water: 50,
        wind: 50,
        earth: 50,
        nature: 50,
        poison: 50  // 50% ко всем стихиям включая яд
    }
};

// Награды временем (в днях)
const TIME_REWARDS = {
    10: 1,    // 1 день
    20: 3,    // 3 дня
    30: 5,    // 5 дней
    40: 7,    // 7 дней
    50: 10    // 10 дней
};

/**
 * Генерирует данные врага для конкретного уровня
 * @param {number} level - номер уровня (1-50)
 * @returns {Object} - данные врага
 */
function generateEnemyForLevel(level, position) {
    // ========== ОРИГИНАЛЬНАЯ ЛОГИКА С ЭЛЕМЕНТАЛЯМИ ==========
    // Определяем тип врага по уровню
    let enemyType, levelInGroup;

    if (level >= 1 && level <= 9) {
        enemyType = ENEMY_TYPES.goblin;
        levelInGroup = level - 1;
    } else if (level === 10) {
        // Огненный Элементаль
        return {
            id: `elemental_fire_${position}`,
            ...ELEMENTALS.fire,
            level: level,
            isElemental: true,
            isBoss: true
        };
    } else if (level >= 11 && level <= 19) {
        enemyType = ENEMY_TYPES.orc;
        levelInGroup = level - 11;
    } else if (level === 20) {
        // Водный Элементаль
        return {
            id: `elemental_water_${position}`,
            ...ELEMENTALS.water,
            level: level,
            isElemental: true,
            isBoss: true
        };
    } else if (level >= 21 && level <= 29) {
        enemyType = ENEMY_TYPES.troll;
        levelInGroup = level - 21;
    } else if (level === 30) {
        // Воздушный Элементаль
        return {
            id: `elemental_wind_${position}`,
            ...ELEMENTALS.wind,
            level: level,
            isElemental: true,
            isBoss: true
        };
    } else if (level >= 31 && level <= 39) {
        enemyType = ENEMY_TYPES.ogre;
        levelInGroup = level - 31;
    } else if (level === 40) {
        // Земной Элементаль
        return {
            id: `elemental_earth_${position}`,
            ...ELEMENTALS.earth,
            level: level,
            isElemental: true,
            isBoss: true
        };
    } else if (level >= 41 && level <= 49) {
        enemyType = ENEMY_TYPES.demon;
        levelInGroup = level - 41;
    } else if (level === 50) {
        // Финальный босс
        return {
            id: `final_boss_${position}`,
            ...FINAL_BOSS,
            level: level,
            isFinalBoss: true,
            isBoss: true
        };
    }

    // Вычисляем характеристики с учетом роста
    const hp = enemyType.baseHp + (enemyType.hpGrowth * levelInGroup);
    const damage = enemyType.baseDamage + (enemyType.damageGrowth * levelInGroup);

    return {
        id: `enemy_${level}_${position}`,
        name: enemyType.name,
        hp: hp,
        max_hp: hp,
        armor: enemyType.armor,
        max_armor: enemyType.armor,
        damage: damage,
        attackType: enemyType.attackType,
        level: level,
        spriteSheet: enemyType.spriteSheet,
        isAdventureEnemy: true
    };
}

/**
 * Определяет количество врагов для уровня
 * @param {number} level - номер уровня
 * @returns {number} - количество врагов
 */
function getEnemyCountForLevel(level) {
    // Боссы всегда одни
    if (level === 10 || level === 20 || level === 30 || level === 40 || level === 50) {
        return 1;
    }

    // Прогрессия для обычных уровней
    const levelInGroup = (level - 1) % 10;

    if (levelInGroup === 0) return 1;      // уровень 1, 11, 21, 31, 41
    if (levelInGroup === 1) return 2;      // уровень 2, 12, 22, 32, 42
    if (levelInGroup === 2) return 2;      // уровень 3, 13, 23, 33, 43
    if (levelInGroup === 3) return 3;      // уровень 4, 14, 24, 34, 44
    if (levelInGroup === 4) return 3;      // уровень 5, 15, 25, 35, 45
    if (levelInGroup === 5) return 4;      // уровень 6, 16, 26, 36, 46
    if (levelInGroup === 6) return 4;      // уровень 7, 17, 27, 37, 47
    if (levelInGroup === 7) return 5;      // уровень 8, 18, 28, 38, 48
    if (levelInGroup === 8) return 5;      // уровень 9, 19, 29, 39, 49

    return 1;
}

/**
 * Генерирует полную конфигурацию уровня
 * @param {number} level - номер уровня (1-50)
 * @returns {Object} - конфигурация уровня
 */
function generateLevel(level) {
    const enemyCount = getEnemyCountForLevel(level);
    const enemies = [];

    // Генерируем врагов для уровня
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(generateEnemyForLevel(level, i));
    }

    // Определяем тип уровня
    let levelType = "normal";
    let levelName = `Уровень ${level}`;

    if (level === 10) {
        levelType = "miniboss";
        levelName = "Огненное испытание";
    } else if (level === 20) {
        levelType = "miniboss";
        levelName = "Ледяное испытание";
    } else if (level === 30) {
        levelType = "miniboss";
        levelName = "Воздушное испытание";
    } else if (level === 40) {
        levelType = "miniboss";
        levelName = "Земное испытание";
    } else if (level === 50) {
        levelType = "finalboss";
        levelName = "Повелитель Хаоса";
    }

    return {
        id: level,
        name: levelName,
        type: levelType,
        enemies: enemies,
        reward: TIME_REWARDS[level] || null, // награда только на 10, 20, 30, 40, 50
        unlocked: level === 1 // только первый уровень открыт изначально
    };
}

/**
 * Генерирует все 50 уровней Главы 1
 * @returns {Array} - массив всех уровней
 */
function generateChapter1() {
    const levels = [];
    for (let i = 1; i <= 50; i++) {
        levels.push(generateLevel(i));
    }
    return levels;
}

// Генерируем Главу 1
const CHAPTER_1_LEVELS = generateChapter1();

// Экспорт
window.CHAPTER_1_LEVELS = CHAPTER_1_LEVELS;
window.generateEnemyForLevel = generateEnemyForLevel;
window.getEnemyCountForLevel = getEnemyCountForLevel;
window.TIME_REWARDS = TIME_REWARDS;

