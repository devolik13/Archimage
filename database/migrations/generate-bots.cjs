// generate-bots.js - Генератор ботов для PvP
// Запустить: node database/migrations/generate-bots.js

const fs = require('fs');

// Конфигурация лиг
const LEAGUES = [
    { id: 'adept', name: 'Адепт', min: 50, max: 950, count: 40, wizards: [1, 2], levels: [1, 3], tiers: [1, 2], spellLevels: [1, 2], buildings: { wizard_tower: 1, blessing_tower: 1 } },
    { id: 'apprentice', name: 'Ученик', min: 1020, max: 1480, count: 30, wizards: [2, 3], levels: [2, 5], tiers: [1, 3], spellLevels: [1, 3], buildings: { wizard_tower: 2, blessing_tower: 1 } },
    { id: 'journeyman', name: 'Подмастерье', min: 1520, max: 1980, count: 30, wizards: [3, 4], levels: [4, 7], tiers: [2, 4], spellLevels: [2, 4], buildings: { wizard_tower: 3, blessing_tower: 2 } },
    { id: 'skilled', name: 'Искусный', min: 2020, max: 2480, count: 30, wizards: [4, 4], levels: [6, 10], tiers: [3, 5], spellLevels: [3, 5], buildings: { wizard_tower: 5, blessing_tower: 3 } },
    { id: 'master', name: 'Мастер', min: 2520, max: 2980, count: 25, wizards: [4, 5], levels: [8, 12], tiers: [4, 6], spellLevels: [4, 5], buildings: { wizard_tower: 7, blessing_tower: 4 } },
    { id: 'great', name: 'Великий', min: 3050, max: 3950, count: 20, wizards: [5, 5], levels: [10, 15], tiers: [5, 7], spellLevels: [5, 5], buildings: { wizard_tower: 9, blessing_tower: 5 } },
    { id: 'supreme', name: 'Верховный', min: 4100, max: 9800, count: 20, wizards: [5, 5], levels: [12, 18], tiers: [5, 8], spellLevels: [5, 5], buildings: { wizard_tower: 10, blessing_tower: 5 } },
    { id: 'archmage', name: 'Архимаг', min: 9999, max: 9999, count: 5, wizards: [5, 5], levels: [20, 20], tiers: [1, 8], spellLevels: [5, 5], buildings: { wizard_tower: 10, blessing_tower: 5 } }
];

const FACTIONS = ['fire', 'water', 'wind', 'earth', 'nature', 'poison'];

// Заклинания по фракциям (по тирам)
const SPELL_TIERS = {
    fire: ['spark', 'fireball', 'flame_shield', 'fire_storm', 'inferno', 'meteor_shower', 'phoenix_rebirth', 'apocalypse'],
    water: ['icicle', 'frost_armor', 'ice_wall', 'blizzard', 'frozen_heart', 'tidal_wave', 'absolute_zero', 'ocean_fury'],
    wind: ['gust', 'lightning_bolt', 'wind_barrier', 'chain_lightning', 'tornado', 'thunder_storm', 'hurricane', 'sky_wrath'],
    earth: ['stone_throw', 'earth_armor', 'stone_wall', 'earthquake', 'rock_shield', 'meteor_strike', 'mountain_rage', 'titan_wrath'],
    nature: ['thorn', 'heal', 'vine_snare', 'poison_cloud', 'regeneration', 'nature_fury', 'life_bloom', 'gaia_blessing'],
    poison: ['venom_spit', 'toxic_cloud', 'plague', 'acid_rain', 'corruption', 'death_touch', 'pestilence', 'black_death']
};

// Никнеймы в стиле игровых
const USERNAMES = [
    // Русские никнеймы
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
    // Латинские никнеймы
    'DarkMage', 'ShadowWizard', 'FireLord', 'IcyQueen', 'StormCaller',
    'EarthShaker', 'NatureMage', 'PoisonMaster', 'Pyromancer', 'Cryomancer',
    'Aeromancer', 'Geomancer', 'Druid', 'Toxicologist', 'Infernalist',
    'Glacialist', 'Tempest', 'Terraformer', 'Floramancer', 'Venomancer',
    'BlazeMage', 'FrostBite', 'ThunderStrike', 'RockSolid', 'VineWhip',
    'ToxicRain', 'FireStorm', 'IceAge', 'LightningBolt', 'Earthquake',
    'LifeBloom', 'DeathTouch', 'FlameKing', 'IcePrincess', 'StormLord',
    'MountainKing', 'ForestQueen', 'PlagueDoctor', 'Ignition', 'Permafrost',
    'Electro', 'Granite', 'Blossom', 'Venom', 'HellFire',
    'AbsoluteZero', 'Zeus', 'Atlas', 'Gaia', 'Medusa',
    // С цифрами
    'FireMage228', 'IceWizard777', 'StormMaster666', 'EarthLord999',
    'NatureKing420', 'PoisonQueen13', 'DarkLord666', 'LightMage777',
    'xXx_Merlin_xXx', 'ProMage2024', 'NoobSlayer', 'MagicMaster',
    'DeathWizard13', 'LightningKing88', 'FrostMage99', 'FireGod777',
    // Дополнительные имена
    'Азар', 'Аквилон', 'Зефир', 'Терракс', 'Сильва', 'Морбиус',
    'Эмбер', 'Кристалл', 'Вольт', 'Кварц', 'Вердант', 'Некроз',
    'Блейз', 'Глация', 'Темпест', 'Страта', 'Флора', 'Сепсис',
    'Инцинератор', 'Фризер', 'Шокер', 'Крушитель', 'Целитель', 'Отравитель',
    'МагическийРыцарь', 'ТемныйВолшебник', 'СветлыйМаг', 'СерыйКардинал',
    'КраснаяВедьма', 'СинийМудрец', 'ЗеленыйДруид', 'ЧерныйНекромант',
    'МастерСтихий', 'ПовелительМагии', 'ВластелинЗаклинаний', 'ЖрецОгня',
    'ЖрицаВоды', 'ШаманВетра', 'ОракулЗемли', 'ДриадЛеса', 'КолдунЯда',
    'ВеликийМаг', 'МогучийВолшебник', 'СильныйМаг', 'ОпытныйВолшебник'
];

// Утилиты
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
function generateUsername(index, usedNames) {
    let name = randomElement(USERNAMES);
    let attempts = 0;
    while (usedNames.has(name) && attempts < 100) {
        name = randomElement(USERNAMES);
        if (Math.random() > 0.5 && !name.match(/\d/)) {
            name += random(1, 999);
        }
        attempts++;
    }
    if (usedNames.has(name)) {
        name = `Bot${index}`;
    }
    usedNames.add(name);
    return name;
}

// Генерация магов
function generateWizards(faction, count, minLevel, maxLevel) {
    const wizards = [];
    for (let i = 0; i < count; i++) {
        const level = random(minLevel, maxLevel);
        const expToNext = Math.floor(100 * Math.pow(1.5, level - 1));
        wizards.push({
            id: `wizard_bot_${Date.now()}_${i}`,
            name: `Маг ${i + 1}`,
            faction: faction,
            level: level,
            experience: random(0, expToNext - 1),
            exp_to_next: expToNext,
            hp: 100,
            armor: 100,
            max_hp: 100,
            max_armor: 100,
            spells: []
        });
    }
    return wizards;
}

// Генерация заклинаний
function generateSpells(faction, minTier, maxTier, minLevel, maxLevel) {
    const spells = {};
    const factionSpells = SPELL_TIERS[faction];
    const numSpells = random(minTier, Math.min(maxTier, factionSpells.length));

    spells[faction] = {};

    for (let i = 0; i < numSpells; i++) {
        const spellId = factionSpells[i];
        const level = random(minLevel, maxLevel);
        spells[faction][spellId] = {
            name: spellId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            level: level,
            tier: i + 1
        };
    }

    return spells;
}

// Генерация зданий
function generateBuildings(config) {
    return {
        library: { level: 1 },
        wizard_tower: { level: config.wizard_tower },
        blessing_tower: { level: config.blessing_tower }
    };
}

// Расчет уровня (упрощенная версия calculatePlayerLevel)
function calculateBotLevel(wizards, spells, buildings) {
    let points = 0;

    // Очки за заклинания
    Object.values(spells).forEach(factionSpells => {
        Object.values(factionSpells).forEach(spell => {
            if (spell.level > 0) {
                points += spell.level * 1; // PLAYER_LEVEL_CONFIG.SPELL_LEARNED
            }
        });
    });

    // Очки за здания
    Object.values(buildings).forEach(building => {
        points += 1; // За само здание
        points += (building.level - 1) * 1; // За улучшения
    });

    // Очки за магов
    points += wizards.length * 10; // PLAYER_LEVEL_CONFIG.WIZARD_HIRED

    return points;
}

// Генерация статистики боев
function generateBattleStats(rating, leagueId) {
    const battles = random(20, 200);
    const winRate = 0.45 + (rating / 20000); // Выше рейтинг = выше винрейт
    const wins = Math.floor(battles * winRate);
    const losses = battles - wins;

    return { total_battles: battles, wins, losses };
}

// Назначение заклинаний магам
function assignSpellsToWizards(wizards, spells, faction) {
    const factionSpells = spells[faction];
    if (!factionSpells) return;

    const availableSpells = Object.keys(factionSpells).filter(spellId => factionSpells[spellId].level > 0);

    if (availableSpells.length === 0) return;

    wizards.forEach(wizard => {
        // Каждый маг получает 2 случайных заклинания из изученных
        const shuffled = shuffle(availableSpells);
        wizard.spells = [
            shuffled[0] || null,
            shuffled[1] || shuffled[0] || null
        ];
    });
}

// Главная функция генерации
function generateBots() {
    const bots = [];
    const usedNames = new Set();
    let botId = -1;

    for (const league of LEAGUES) {
        console.log(`Генерация ${league.count} ботов для лиги ${league.name}...`);

        for (let i = 0; i < league.count; i++) {
            const rating = league.min === league.max ? league.min : random(league.min, league.max);
            const faction = randomElement(FACTIONS);
            const wizardCount = random(league.wizards[0], league.wizards[1]);
            const wizards = generateWizards(faction, wizardCount, league.levels[0], league.levels[1]);
            const spells = generateSpells(faction, league.tiers[0], league.tiers[1], league.spellLevels[0], league.spellLevels[1]);

            // ВАЖНО: Назначаем заклинания магам после генерации
            assignSpellsToWizards(wizards, spells, faction);

            const buildings = generateBuildings(league.buildings);
            const level = calculateBotLevel(wizards, spells, buildings);
            const stats = generateBattleStats(rating, league.id);
            const username = generateUsername(botId, usedNames);

            // Формируем расстановку
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
                tutorial_completed: true,
                created_at: new Date(Date.now() - random(30, 180) * 24 * 60 * 60 * 1000).toISOString() // 1-6 месяцев назад
            });

            botId--;
        }
    }

    console.log(`✅ Сгенерировано ${bots.length} ботов`);
    return bots;
}

// Генерация SQL
function generateSQL(bots) {
    let sql = `-- Generated bots for PvP Arena\n`;
    sql += `-- Total: ${bots.length} bots\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const bot of bots) {
        sql += `INSERT INTO players (\n`;
        sql += `    telegram_id, username, rating, wins, losses, total_battles,\n`;
        sql += `    faction, level, experience, time_currency,\n`;
        sql += `    wizards, spells, formation, buildings,\n`;
        sql += `    pve_progress, settings, tutorial_completed, created_at\n`;
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
        sql += `    '${JSON.stringify(bot.wizards)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.spells)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.formation)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.buildings)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.pve_progress)}'::jsonb,\n`;
        sql += `    '${JSON.stringify(bot.settings)}'::jsonb,\n`;
        sql += `    ${bot.tutorial_completed},\n`;
        sql += `    '${bot.created_at}'\n`;
        sql += `);\n\n`;
    }

    return sql;
}

// Запуск
const bots = generateBots();
const sql = generateSQL(bots);

// Сохранение в файл
fs.writeFileSync(__dirname + '/002_insert_bots.sql', sql);

console.log(`\n💾 SQL сохранен в: database/migrations/002_insert_bots.sql`);
console.log(`📊 Статистика:`);

const statsByLeague = {};
LEAGUES.forEach(league => {
    const leagueBots = bots.filter(b => b.rating >= league.min && b.rating <= league.max);
    statsByLeague[league.name] = leagueBots.length;
});

console.log(statsByLeague);
