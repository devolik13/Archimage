// generate-bots-v2.cjs - Генератор ботов и гильдий для PvP
// Запустить: node database/migrations/generate-bots-v2.cjs

const fs = require('fs');

// ============ ПРАВИЛЬНЫЕ ЗАКЛИНАНИЯ ПО ШКОЛАМ ============
const SPELLS_BY_SCHOOL = {
    fire: [
        { id: 'spark', name: 'Искра', tier: 1 },
        { id: 'firebolt', name: 'Огненная стрела', tier: 2 },
        { id: 'fire_wall', name: 'Огненная стена', tier: 3 },
        { id: 'fireball', name: 'Огненный шар', tier: 4 },
        { id: 'fire_tsunami', name: 'Огненное цунами', tier: 5 }
    ],
    water: [
        { id: 'icicle', name: 'Ледышка', tier: 1 },
        { id: 'frost_arrow', name: 'Ледяная стрела', tier: 2 },
        { id: 'ice_rain', name: 'Ледяной дождь', tier: 3 },
        { id: 'blizzard', name: 'Снежная буря', tier: 4 },
        { id: 'absolute_zero', name: 'Абсолютный Ноль', tier: 5 }
    ],
    wind: [
        { id: 'gust', name: 'Порыв', tier: 1 },
        { id: 'wind_blade', name: 'Ветрорез', tier: 2 },
        { id: 'wind_wall', name: 'Ветряная стена', tier: 3 },
        { id: 'storm_cloud', name: 'Грозовая туча', tier: 4 },
        { id: 'chain_lightning', name: 'Цепная молния', tier: 5 }
    ],
    earth: [
        { id: 'pebble', name: 'Камешек', tier: 1 },
        { id: 'stone_spike', name: 'Каменный шип', tier: 2 },
        { id: 'earth_wall', name: 'Земляная стена', tier: 3 },
        { id: 'stone_grotto', name: 'Каменный грот', tier: 4 },
        { id: 'meteor_shower', name: 'Метеоритный дождь', tier: 5 }
    ],
    nature: [
        { id: 'call_wolf', name: 'Зов волка', tier: 1 },
        { id: 'bark_armor', name: 'Древесная кора', tier: 2 },
        { id: 'leaf_canopy', name: 'Покров листвы', tier: 3 },
        { id: 'ent', name: 'Энт', tier: 4 },
        { id: 'meteorokinesis', name: 'Метеокинез', tier: 5 }
    ],
    poison: [
        { id: 'poisoned_blade', name: 'Отравленный клинок', tier: 1 },
        { id: 'poisoned_glade', name: 'Ядовитая поляна', tier: 2 },
        { id: 'foul_cloud', name: 'Мерзкое облако', tier: 3 },
        { id: 'plague', name: 'Чума', tier: 4 },
        { id: 'epidemic', name: 'Эпидемия', tier: 5 }
    ]
};

// ============ КОНФИГУРАЦИЯ ЛИГ (8 лиг × 25 ботов = 200) ============
const LEAGUES = [
    { id: 'adept', name: 'Адепт', minRating: 100, maxRating: 900, count: 25,
      wizards: [1, 2], wizardLevels: [1, 2], maxTier: 1, spellLevel: [1, 2],
      buildings: { library: 1, wizard_tower: 1, blessing_tower: 1 } },

    { id: 'apprentice', name: 'Ученик', minRating: 1000, maxRating: 1400, count: 25,
      wizards: [2, 3], wizardLevels: [1, 3], maxTier: 2, spellLevel: [1, 3],
      buildings: { library: 2, wizard_tower: 2, blessing_tower: 1 } },

    { id: 'journeyman', name: 'Подмастерье', minRating: 1500, maxRating: 1900, count: 25,
      wizards: [2, 3], wizardLevels: [2, 4], maxTier: 2, spellLevel: [2, 3],
      buildings: { library: 3, wizard_tower: 3, blessing_tower: 2 } },

    { id: 'skilled', name: 'Искусный', minRating: 2000, maxRating: 2400, count: 25,
      wizards: [3, 4], wizardLevels: [3, 5], maxTier: 3, spellLevel: [2, 4],
      buildings: { library: 4, wizard_tower: 4, blessing_tower: 2 } },

    { id: 'master', name: 'Мастер', minRating: 2500, maxRating: 2900, count: 25,
      wizards: [3, 4], wizardLevels: [4, 6], maxTier: 3, spellLevel: [3, 4],
      buildings: { library: 5, wizard_tower: 5, blessing_tower: 3 } },

    { id: 'great', name: 'Великий', minRating: 3000, maxRating: 3500, count: 25,
      wizards: [4, 5], wizardLevels: [5, 7], maxTier: 4, spellLevel: [3, 5],
      buildings: { library: 6, wizard_tower: 6, blessing_tower: 4 } },

    { id: 'supreme', name: 'Верховный', minRating: 4000, maxRating: 4500, count: 25,
      wizards: [5, 5], wizardLevels: [6, 8], maxTier: 4, spellLevel: [4, 5],
      buildings: { library: 7, wizard_tower: 7, blessing_tower: 5 } },

    { id: 'archmage', name: 'Архимаг', minRating: 5000, maxRating: 6000, count: 25,
      wizards: [5, 5], wizardLevels: [8, 10], maxTier: 5, spellLevel: [5, 5],
      buildings: { library: 8, wizard_tower: 8, blessing_tower: 5 } }
];

// ============ ГИЛЬДИИ ДЛЯ БОТОВ ============
const GUILDS = [
    { name: 'Пламя Феникса', tag: 'FIRE', level: 28, botsCount: 33 },
    { name: 'Ледяной Совет', tag: 'ICE', level: 27, botsCount: 33 },
    { name: 'Буря Небес', tag: 'WIND', level: 26, botsCount: 33 },
    { name: 'Каменный Орден', tag: 'ROCK', level: 25, botsCount: 33 },
    { name: 'Лесное Братство', tag: 'LEAF', level: 25, botsCount: 33 },
    { name: 'Тени Яда', tag: 'TOXN', level: 25, botsCount: 35 }
];

const FACTIONS = ['fire', 'water', 'wind', 'earth', 'nature', 'poison'];

// Никнеймы
const USERNAMES = [
    'МагТьмы', 'Пламенный', 'Ледокол', 'Буревестник', 'Терракот', 'Дриада',
    'Некромаг', 'Архонт', 'Инферно', 'Фростбайт', 'Электрон', 'Геомант',
    'Токсик', 'Целитель', 'Огнемаг', 'Морозко', 'Грозовой', 'Каменолом',
    'ЯдовитыйКлык', 'Лесной', 'МагОгня', 'ЛедянойВластелин', 'ПовелительБури',
    'ЗащитникЗемли', 'ХранительЛеса', 'МастерЯдов', 'Пироман', 'Криоманс',
    'Электромаг', 'Терраформер', 'Друид', 'Алхимик', 'ОгненныйДракон',
    'СнежнаяКоролева', 'ПовелительМолний', 'КаменныйГолем', 'ДревнийЛес',
    'ЧернаяВдова', 'ИнфернальныйМаг', 'Аркти', 'Зевс', 'Терра',
    'Флора', 'Венома', 'ВладыкаПламени', 'ХозяйкаЛьда', 'БогГрома',
    'ТитанЗемли', 'МатьПрироды', 'ОтравительДуш',
    'DarkMage', 'ShadowWizard', 'FireLord', 'IcyQueen', 'StormCaller',
    'EarthShaker', 'NatureMage', 'PoisonMaster', 'Pyromancer', 'Cryomancer',
    'Aeromancer', 'Geomancer', 'Druid', 'Toxicologist', 'Infernalist',
    'Glacialist', 'Tempest', 'Terraformer', 'Floramancer', 'Venomancer',
    'BlazeMage', 'FrostBite', 'ThunderStrike', 'RockSolid', 'VineWhip',
    'ToxicRain', 'FireStorm', 'IceAge', 'LightningBolt', 'Earthquake',
    'LifeBloom', 'DeathTouch', 'FlameKing', 'IcePrincess', 'StormLord',
    'MountainKing', 'ForestQueen', 'PlagueDoctor', 'Ignition', 'Permafrost',
    'Electro', 'Granite', 'Blossom', 'Venom', 'HellFire',
    'AbsoluteZero', 'Atlas', 'Gaia', 'Medusa',
    'FireMage228', 'IceWizard777', 'StormMaster666', 'EarthLord999',
    'NatureKing420', 'PoisonQueen13', 'DarkLord666', 'LightMage777',
    'ProMage2024', 'NoobSlayer', 'MagicMaster', 'DeathWizard13',
    'Азар', 'Аквилон', 'Зефир', 'Терракс', 'Сильва', 'Морбиус',
    'Эмбер', 'Кристалл', 'Вольт', 'Кварц', 'Вердант', 'Некроз',
    'Блейз', 'Глация', 'Темпест', 'Страта', 'Сепсис',
    'Инцинератор', 'Фризер', 'Шокер', 'Крушитель', 'Отравитель',
    'МагическийРыцарь', 'ТемныйВолшебник', 'СветлыйМаг', 'СерыйКардинал',
    'КраснаяВедьма', 'СинийМудрец', 'ЗеленыйДруид', 'ЧерныйНекромант',
    'МастерСтихий', 'ПовелительМагии', 'ВластелинЗаклинаний', 'ЖрецОгня',
    'ЖрицаВоды', 'ШаманВетра', 'ОракулЗемли', 'ДриадЛеса', 'КолдунЯда',
    'ВеликийМаг', 'МогучийВолшебник', 'СильныйМаг', 'ОпытныйВолшебник',
    'Феникс', 'Ледяной', 'Громовержец', 'Скала', 'Корень', 'Чума',
    'Искра', 'Метель', 'Ураган', 'Вулкан', 'Роща', 'Токсин',
    'ПовелительПламени', 'ХозяинЛьда', 'ВластелинВетра', 'ЛордЗемли',
    'СтражПрироды', 'МастерОтрав', 'Огнеборец', 'Ледоруб', 'Громобой',
    'Камнедробитель', 'Лесоруб', 'Ядовар', 'ПламяДракона', 'СердцеЗимы',
    'ДухБури', 'ДушаГор', 'ГолосЛеса', 'ТеньСмерти'
];

// ============ УТИЛИТЫ ============
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
    return arr[random(0, arr.length - 1)];
}

function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Генерация никнейма
function generateUsername(usedNames) {
    let name = randomElement(USERNAMES);
    let attempts = 0;
    while (usedNames.has(name) && attempts < 200) {
        name = randomElement(USERNAMES);
        if (Math.random() > 0.5 && !name.match(/\d/)) {
            name += random(1, 999);
        }
        attempts++;
    }
    if (usedNames.has(name)) {
        name = `Маг${random(1000, 9999)}`;
    }
    usedNames.add(name);
    return name;
}

// Получить заклинания для школы до определенного тира
function getSpellsForSchool(school, maxTier) {
    return SPELLS_BY_SCHOOL[school].filter(s => s.tier <= maxTier);
}

// Генерация объекта spells (изученные заклинания)
function generateLearnedSpells(wizardFactions, maxTier, spellLevelRange) {
    const spells = {};

    // Собираем уникальные школы магов
    const schools = [...new Set(wizardFactions)];

    for (const school of schools) {
        const availableSpells = getSpellsForSchool(school, maxTier);
        spells[school] = {};

        for (const spell of availableSpells) {
            const level = random(spellLevelRange[0], spellLevelRange[1]);
            spells[school][spell.id] = {
                name: spell.name,
                level: level,
                tier: spell.tier
            };
        }
    }

    return spells;
}

// Генерация магов
function generateWizards(count, levelRange, maxTier) {
    const wizards = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
        // Случайная фракция для каждого мага
        const faction = randomElement(FACTIONS);
        const level = random(levelRange[0], levelRange[1]);
        const expToNext = Math.floor(100 * Math.pow(1.5, level - 1));

        // Получаем доступные заклинания для этой школы
        const availableSpells = getSpellsForSchool(faction, maxTier);
        const shuffledSpells = shuffle(availableSpells);

        // 2 заклинания на мага
        const wizardSpells = [
            shuffledSpells[0]?.id || null,
            shuffledSpells[1]?.id || shuffledSpells[0]?.id || null
        ];

        wizards.push({
            id: `wizard_bot_${timestamp}_${i}`,
            name: `Маг ${i + 1}`,
            faction: faction,
            level: level,
            experience: random(0, expToNext - 1),
            exp_to_next: expToNext,
            hp: 100,
            armor: 100,
            max_hp: 100,
            max_armor: 100,
            spells: wizardSpells
        });
    }

    return wizards;
}

// Генерация статистики боев
function generateBattleStats(rating) {
    const battles = random(50, 300);
    const baseWinRate = 0.4 + (rating / 15000); // Выше рейтинг = выше винрейт
    const winRate = Math.min(0.75, baseWinRate);
    const wins = Math.floor(battles * winRate);
    const losses = battles - wins;

    return { total_battles: battles, wins, losses };
}

// Расчет уровня игрока
function calculatePlayerLevel(wizards, spells, buildings) {
    let points = 0;

    // Очки за изученные заклинания
    Object.values(spells).forEach(schoolSpells => {
        Object.values(schoolSpells).forEach(spell => {
            points += spell.level;
        });
    });

    // Очки за здания
    Object.values(buildings).forEach(building => {
        points += building.level;
    });

    // Очки за магов
    points += wizards.length * 5;
    wizards.forEach(w => points += w.level);

    return Math.max(1, Math.floor(points / 3));
}

// ============ ГЛАВНЫЕ ФУНКЦИИ ============

function generateBots() {
    const bots = [];
    const usedNames = new Set();
    let botId = -1;

    for (const league of LEAGUES) {
        console.log(`Генерация ${league.count} ботов для лиги ${league.name}...`);

        for (let i = 0; i < league.count; i++) {
            const rating = random(league.minRating, league.maxRating);
            const wizardCount = random(league.wizards[0], league.wizards[1]);
            const wizards = generateWizards(wizardCount, league.wizardLevels, league.maxTier);

            // Определяем фракцию бота по первому магу
            const faction = wizards[0].faction;

            // Генерируем изученные заклинания на основе фракций магов
            const wizardFactions = wizards.map(w => w.faction);
            const spells = generateLearnedSpells(wizardFactions, league.maxTier, league.spellLevel);

            const buildings = {
                library: { level: league.buildings.library },
                wizard_tower: { level: league.buildings.wizard_tower },
                blessing_tower: { level: league.buildings.blessing_tower }
            };

            const level = calculatePlayerLevel(wizards, spells, buildings);
            const stats = generateBattleStats(rating);
            const username = generateUsername(usedNames);

            // Формация
            const formation = wizards.map(w => w.id);
            while (formation.length < 5) {
                formation.push(null);
            }

            bots.push({
                telegram_id: botId,
                username: username,
                rating: rating,
                wins: stats.wins,
                losses: stats.losses,
                total_battles: stats.total_battles,
                faction: faction,
                level: level,
                experience: 0,
                time_currency: 0,
                wizards: wizards,
                spells: spells,
                formation: formation,
                buildings: buildings,
                pve_progress: {},
                settings: { sound: true, language: 'ru', battle_speed: 'normal' },
                welcome_shown: true,
                created_at: new Date(Date.now() - random(30, 180) * 24 * 60 * 60 * 1000).toISOString()
            });

            botId--;
        }
    }

    console.log(`✅ Сгенерировано ${bots.length} ботов`);
    return bots;
}

// Распределение ботов по гильдиям
function assignBotsToGuilds(bots) {
    // Сортируем ботов по рейтингу (от высокого к низкому)
    const sortedBots = [...bots].sort((a, b) => b.rating - a.rating);

    let botIndex = 0;
    const guildAssignments = [];

    for (let guildIndex = 0; guildIndex < GUILDS.length; guildIndex++) {
        const guild = GUILDS[guildIndex];
        const guildBots = [];

        for (let i = 0; i < guild.botsCount && botIndex < sortedBots.length; i++) {
            guildBots.push(sortedBots[botIndex]);
            botIndex++;
        }

        if (guildBots.length > 0) {
            guildAssignments.push({
                guild: guild,
                guildId: guildIndex + 1, // ID гильдии в БД
                leaderId: null, // Будет установлен после вставки ботов
                bots: guildBots
            });
        }
    }

    return guildAssignments;
}

// ============ ГЕНЕРАЦИЯ SQL ============

function generateSQL(bots, guildAssignments) {
    let sql = `-- Generated bots and guilds for PvP Arena\n`;
    sql += `-- Total: ${bots.length} bots, ${GUILDS.length} guilds\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    // 1. Вставляем ботов (без guild_id сначала)
    sql += `-- ============ BOTS ============\n\n`;

    for (const bot of bots) {
        sql += `INSERT INTO players (\n`;
        sql += `    telegram_id, username, rating, wins, losses, total_battles,\n`;
        sql += `    faction, level, experience, time_currency,\n`;
        sql += `    wizards, spells, formation, buildings,\n`;
        sql += `    pve_progress, settings, welcome_shown, created_at\n`;
        sql += `) VALUES (\n`;
        sql += `    ${bot.telegram_id},\n`;
        sql += `    '${bot.username.replace(/'/g, "''")}',\n`;
        sql += `    ${bot.rating},\n`;
        sql += `    ${bot.wins},\n`;
        sql += `    ${bot.losses},\n`;
        sql += `    ${bot.total_battles},\n`;
        sql += `    '${bot.faction}',\n`;
        sql += `    ${bot.level},\n`;
        sql += `    ${bot.experience},\n`;
        sql += `    ${bot.time_currency},\n`;
        sql += `    '${JSON.stringify(bot.wizards).replace(/'/g, "''")}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.spells).replace(/'/g, "''")}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.formation).replace(/'/g, "''")}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.buildings).replace(/'/g, "''")}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.pve_progress)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.settings)}'::jsonb,\n`;
        sql += `    ${bot.welcome_shown},\n`;
        sql += `    '${bot.created_at}'\n`;
        sql += `);\n\n`;
    }

    // 2. Создаём гильдии
    sql += `-- ============ GUILDS ============\n\n`;

    for (const assignment of guildAssignments) {
        const guild = assignment.guild;
        const leaderBot = assignment.bots[0]; // Первый (самый сильный) бот - лидер

        sql += `-- Гильдия: ${guild.name} [${guild.tag}]\n`;
        sql += `INSERT INTO guilds (name, tag, leader_id, experience, level, bonus_points, research, join_mode, join_requests)\n`;
        sql += `SELECT \n`;
        sql += `    '${guild.name}',\n`;
        sql += `    '${guild.tag}',\n`;
        sql += `    p.id,\n`;
        sql += `    ${random(50000, 200000)},\n`;  // experience
        sql += `    ${guild.level},\n`;
        sql += `    ${guild.level},\n`;  // bonus_points = level
        sql += `    '{"fire":${random(0, 10)},"water":${random(0, 10)},"earth":${random(0, 10)},"wind":${random(0, 10)},"poison":${random(0, 10)}}'::jsonb,\n`;
        sql += `    'request',\n`;
        sql += `    '[]'::jsonb\n`;
        sql += `FROM players p WHERE p.telegram_id = ${leaderBot.telegram_id};\n\n`;
    }

    // 3. Назначаем ботов в гильдии
    sql += `-- ============ ASSIGN BOTS TO GUILDS ============\n\n`;

    for (const assignment of guildAssignments) {
        const guild = assignment.guild;
        const botIds = assignment.bots.map(b => b.telegram_id);

        sql += `-- Добавляем ${assignment.bots.length} ботов в гильдию ${guild.name}\n`;
        sql += `UPDATE players\n`;
        sql += `SET guild_id = (SELECT id FROM guilds WHERE tag = '${guild.tag}'),\n`;
        sql += `    guild_contribution = floor(random() * 10000),\n`;
        sql += `    guild_last_active = NOW() - interval '1 day' * floor(random() * 7)\n`;
        sql += `WHERE telegram_id IN (${botIds.join(', ')});\n\n`;
    }

    return sql;
}

// ============ ЗАПУСК ============

console.log('🤖 Генерация ботов v2...\n');

const bots = generateBots();
const guildAssignments = assignBotsToGuilds(bots);

console.log('\n📊 Распределение по гильдиям:');
for (const assignment of guildAssignments) {
    console.log(`   [${assignment.guild.tag}] ${assignment.guild.name}: ${assignment.bots.length} ботов (уровень ${assignment.guild.level})`);
}

const sql = generateSQL(bots, guildAssignments);

// Сохранение в файл
fs.writeFileSync(__dirname + '/008_insert_bots_v2.sql', sql);

console.log(`\n💾 SQL сохранен в: database/migrations/008_insert_bots_v2.sql`);
console.log(`\n📊 Статистика по лигам:`);

for (const league of LEAGUES) {
    const leagueBots = bots.filter(b => b.rating >= league.minRating && b.rating <= league.maxRating);
    console.log(`   ${league.name}: ${leagueBots.length} ботов (рейтинг ${league.minRating}-${league.maxRating})`);
}

console.log(`\n✅ Готово! Всего: ${bots.length} ботов, ${GUILDS.length} гильдий`);
