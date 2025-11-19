// config/spells/spell-full-data.js - Полные данные заклинаний с описаниями
console.log('✅ config/spells/spell-full-data.js загружен');

const SPELL_FULL_DATA = {
    // ============ ОГОНЬ ============
    "spark": {
        id: "spark",
        name: "Искра",
        description: "Наносит урон одной цели. Шанс поджечь врага.",
        icon: "🔥",
        school: "fire",
        tier: 1,
        type: "single_target",
        base_damage: 12,
        unlock_condition: null
    },
    "firebolt": {
        id: "firebolt",
        name: "Огненная стрела",
        description: "Выпускает несколько огненных стрел по случайным целям. Каждая стрела может поджечь цель.",
        icon: "🏹🔥",
        school: "fire",
        tier: 2,
        type: "multi_target",
        base_damage: 25,
        unlock_condition: "spark_level_5"
    },
    "fire_wall": {
        id: "fire_wall",
        name: "Огненная стена",
        description: "Создаёт стену огня, наносящую урон врагам, проходящим через неё. Игнорирует препятствия.",
        icon: "🔥🧱",
        school: "fire",
        tier: 3,
        type: "aoe",
        base_damage: 40,
        unlock_condition: "firebolt_level_5"
    },
    "fireball": {
        id: "fireball",
        name: "Огненный шар",
        description: "Создаёт огненный шар, который взрывается перед целью. Наносит урон по области 3×3. На 5 уровне покрывает всю территорию врага.",
        icon: "☄️",
        school: "fire",
        tier: 4,
        type: "aoe",
        base_damage: 75,
        unlock_condition: "fire_wall_level_5"
    },
    "fire_tsunami": {
        id: "fire_tsunami",
        name: "Огненное цунами",
        description: "Призывает волну огня, движущуюся по территории противника. Наносит урон всем в колонке. На 5 уровне оставляет за собой горящую землю.",
        icon: "🌊🔥",
        school: "fire",
        tier: 5,
        type: "aoe",
        base_damage: 120,
        unlock_condition: "fireball_level_5"
    },

    // ============ ВОДА ============
    "icicle": {
        id: "icicle",
        name: "Ледышка",
        description: "Наносит урон одной цели. Шанс охладить или заморозить.",
        icon: "❄️",
        school: "water",
        tier: 1,
        type: "single_target",
        base_damage: 10,
        unlock_condition: null
    },
    "frost_arrow": {
        id: "frost_arrow",
        name: "Ледяная стрела",
        description: "Поражает основную цель и наносит урон по области взрыва. Накладывает охлаждение.",
        icon: "🏹❄️",
        school: "water",
        tier: 2,
        type: "single_target",
        base_damage: 22,
        unlock_condition: "icicle_level_5"
    },
    "ice_rain": {
        id: "ice_rain",
        name: "Ледяной дождь",
        description: "Обрушивает ледяной дождь на 3 клетки или всю линию. Игнорирует препятствия. Шанс заморозки.",
        icon: "🌨️",
        school: "water",
        tier: 3,
        type: "aoe",
        base_damage: 38,
        unlock_condition: "frost_arrow_level_5"
    },
    "blizzard": {
        id: "blizzard",
        name: "Снежная буря",
        description: "Создаёт зону холода на территории противника. Даёт шанс прервать заклинание цели в зоне. На 5 уровне дополнительно накладывает иней или заморозку.",
        icon: "❄️🌪️",
        school: "water",
        tier: 4,
        type: "aoe",
        base_damage: 65,
        unlock_condition: "ice_rain_level_5"
    },
    "absolute_zero": {
        id: "absolute_zero",
        name: "Абсолютный Ноль",
        description: "Покрывает всю территорию врага ледяным морозом. Каждый, кто начинает ход в зоне, получает урон и шанс прерывания заклинания.",
        icon: "❄️🧊",
        school: "water",
        tier: 5,
        type: "aoe",
        base_damage: 110,
        unlock_condition: "blizzard_level_5"
    },

    // ============ ВЕТЕР ============
    "gust": {
        id: "gust",
        name: "Порыв",
        description: "Наносит урон одной цели. Шанс критического удвоенного урона.",
        icon: "💨",
        school: "wind",
        tier: 1,
        type: "single_target",
        base_damage: 11,
        unlock_condition: null
    },
    "wind_blade": {
        id: "wind_blade",
        name: "Ветрорез",
        description: "Запускает лезвие ветра, проходящее через ряд. Игнорирует препятствия.",
        icon: "🌀",
        school: "wind",
        tier: 2,
        type: "multi_target",
        base_damage: 24,
        unlock_condition: "gust_level_5"
    },
    "wind_wall": {
        id: "wind_wall",
        name: "Ветряная стена",
        description: "Создаёт стену, ослабляющую урон проходящих через неё заклинаний.",
        icon: "🌪️🛡️",
        school: "wind",
        tier: 3,
        type: "utility",
        base_damage: 0,
        unlock_condition: "wind_blade_level_5"
    },
    "storm_cloud": {
        id: "storm_cloud",
        name: "Грозовая туча",
        description: "Обрушивает удары молний на случайные клетки территории противника. На 5 уровне есть шанс оглушить цель.",
        icon: "⛈️⚡",
        school: "wind",
        tier: 4,
        type: "aoe",
        base_damage: 70,
        unlock_condition: "wind_wall_level_5"
    },
    "chain_lightning": {
        id: "chain_lightning",
        name: "Цепная молния",
        description: "Поражает все цели в колонках магов и призванных по цепочке. Урон снижается с каждым ударом.",
        icon: "⚡⛓️",
        school: "wind",
        tier: 5,
        type: "aoe",
        base_damage: 115,
        unlock_condition: "storm_cloud_level_5"
    },

    // ============ ЗЕМЛЯ ============
    "pebble": {
        id: "pebble",
        name: "Камешек",
        description: "Наносит урон одной цели. Шанс игнорировать броню.",
        icon: "🪨",
        school: "earth",
        tier: 1,
        type: "single_target",
        base_damage: 13,
        unlock_condition: null
    },
    "stone_spike": {
        id: "stone_spike",
        name: "Каменный шип",
        description: "Выпускает шипы во все стороны от цели. Может повредить стены.",
        icon: "🗿",
        school: "earth",
        tier: 2,
        type: "multi_target",
        base_damage: 28,
        unlock_condition: "pebble_level_5"
    },
    "earth_wall": {
        id: "earth_wall",
        name: "Земляная стена",
        description: "Создаёт прочную стену с высоким HP. Блокирует передвижение и заклинания.",
        icon: "🧱🪨",
        school: "earth",
        tier: 3,
        type: "utility",
        base_damage: 0,
        unlock_condition: "stone_spike_level_5"
    },
    "stone_grotto": {
        id: "stone_grotto",
        name: "Каменный грот",
        description: "Создаёт защитное укрытие вокруг союзных магов. Поглощает входящий урон.",
        icon: "🏔️🛡️",
        school: "earth",
        tier: 4,
        type: "buff",
        base_damage: 0,
        unlock_condition: "earth_wall_level_5"
    },
    "meteor_shower": {
        id: "meteor_shower",
        name: "Метеоритный дождь",
        description: "Обрушивает метеориты на всю территорию врага. Разрушительный урон по области.",
        icon: "☄️💥",
        school: "earth",
        tier: 5,
        type: "aoe",
        base_damage: 140,
        unlock_condition: "stone_grotto_level_5"
    },

    // ============ ПРИРОДА ============
    "call_wolf": {
        id: "call_wolf",
        name: "Зов волка",
        description: "Призывает волка для атаки врагов. Волк действует самостоятельно.",
        icon: "🐺",
        school: "nature",
        tier: 1,
        type: "summon",
        base_damage: 8,
        unlock_condition: null
    },
    "bark_armor": {
        id: "bark_armor",
        name: "Древесная кора",
        description: "Покрывает союзников защитной корой. Увеличивает броню.",
        icon: "🌳🛡️",
        school: "nature",
        tier: 2,
        type: "buff",
        base_damage: 0,
        unlock_condition: "call_wolf_level_5"
    },
    "leaf_canopy": {
        id: "leaf_canopy",
        name: "Покров листвы",
        description: "Создаёт защитный купол из листьев. Ослабляет входящий магический урон.",
        icon: "🍃🛡️",
        school: "nature",
        tier: 3,
        type: "buff",
        base_damage: 0,
        unlock_condition: "bark_armor_level_5"
    },
    "ent": {
        id: "ent",
        name: "Энт",
        description: "Призывает древнего энта. Связывает жизненную силу с союзными магами.",
        icon: "🌳👤",
        school: "nature",
        tier: 4,
        type: "summon",
        base_damage: 50,
        unlock_condition: "leaf_canopy_level_5"
    },
    "meteorokinesis": {
        id: "meteorokinesis",
        name: "Метеокинез",
        description: "Контролирует погоду. Усиливает стихийные заклинания союзников.",
        icon: "🌪️⛈️",
        school: "nature",
        tier: 5,
        type: "buff",
        base_damage: 0,
        unlock_condition: "ent_level_5"
    },

    // ============ ЯД ============
    "poisoned_blade": {
        id: "poisoned_blade",
        name: "Отравленный клинок",
        description: "Метает отравленное лезвие. Наносит урон (7-10) и имеет шанс отравить цель. Шанс яда растет с уровнем: 20%/30%/40%/50%/100%. На 5 уровне яд гарантирован! Яд наносит 5 урона за стак в начале хода.",
        icon: "🗡️☠️",
        school: "poison",
        tier: 1,
        type: "single_target",
        base_damage: 9,
        unlock_condition: null
    },
    "poisoned_glade": {
        id: "poisoned_glade",
        name: "Ядовитая поляна",
        description: "Создаёт зону отравленной земли. Враги в зоне получают периодический урон.",
        icon: "🌿☠️",
        school: "poison",
        tier: 2,
        type: "aoe",
        base_damage: 20,
        unlock_condition: "poisoned_blade_level_5"
    },
    "foul_cloud": {
        id: "foul_cloud",
        name: "Мерзкое облако",
        description: "Выпускает ядовитое облако. Движется по полю и отравляет всех на пути.",
        icon: "☁️☠️",
        school: "poison",
        tier: 3,
        type: "aoe",
        base_damage: 35,
        unlock_condition: "poisoned_glade_level_5"
    },
    "plague": {
        id: "plague",
        name: "Чума",
        description: "Заражает случайные цели смертельной болезнью. Снижает эффективность лечения на 70% до конца боя.",
        icon: "🦠☠️",
        school: "poison",
        tier: 4,
        type: "debuff",
        base_damage: 0,
        unlock_condition: "foul_cloud_level_5"
    },
    "epidemic": {
        id: "epidemic",
        name: "Эпидемия",
        description: "Вызывает массовую эпидемию. Все враги получают различные негативные эффекты.",
        icon: "🦠💀",
        school: "poison",
        tier: 5,
        type: "aoe",
        base_damage: 100,
        unlock_condition: "plague_level_5"
    }
};

// Функция получения полных данных заклинания
function getSpellFullData(spellId) {
    return SPELL_FULL_DATA[spellId] || null;
}

// Функция получения описания заклинания
function getSpellDescription(spellId) {
    return SPELL_FULL_DATA[spellId]?.description || "Описание недоступно";
}

// Функция получения иконки заклинания
function getSpellIcon(spellId) {
    return SPELL_FULL_DATA[spellId]?.icon || "❓";
}

// Экспорт в window для обратной совместимости
if (typeof window !== 'undefined') {
    window.SPELL_FULL_DATA = SPELL_FULL_DATA;
    window.SPELL_LIBRARY = SPELL_FULL_DATA; // Альтернативное имя для обратной совместимости
}