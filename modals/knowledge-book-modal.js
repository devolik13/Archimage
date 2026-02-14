// knowledge-book-modal.js - Книга Знаний (FAQ и справка по игре)

/**
 * Данные для Книги Знаний
 * Категории и их содержимое
 */
const KNOWLEDGE_BOOK_DATA = {
    categories: [
        {
            id: 'community',
            icon: '📢',
            title: 'Сообщество',
            title_en: 'Community',
            articles: [
                {
                    title: 'Официальный канал',
                    title_en: 'Official Channel',
                    content: `<b>📢 Archimage Community</b>

Присоединяйся к официальному каналу:
• 🎮 Обновления и патчноты
• 🎉 Анонсы ивентов
• 🎁 Розыгрыши и промокоды
• 🗣️ Общайся с другими магами
• ❓ Задавай вопросы и получай советы
• 🤝 Ищи союзников для гильдии

<a href="https://t.me/archimage_chat" target="_blank" style="color: #4FC3F7;">👉 Присоединиться к @archimage_chat</a>`,
                    content_en: `<b>📢 Archimage Community</b>

Join the official channel:
• 🎮 Updates and patch notes
• 🎉 Event announcements
• 🎁 Giveaways and promo codes
• 🗣️ Chat with other mages
• ❓ Ask questions and get advice
• 🤝 Find allies for your guild

<a href="https://t.me/archimage_chat" target="_blank" style="color: #4FC3F7;">👉 Join @archimage_chat</a>`
                },
                {
                    title: 'Обратная связь',
                    title_en: 'Feedback',
                    content: `<b>📝 Связь с разработчиком</b>

Нашёл баг или есть идея?
• Напиши в чат сообщества
• Или в личные сообщения бота

<b>Мы читаем все отзывы!</b>`,
                    content_en: `<b>📝 Contact the Developer</b>

Found a bug or have an idea?
• Write in the community chat
• Or send a direct message to the bot

<b>We read all feedback!</b>`
                }
            ]
        },
        {
            id: 'buildings',
            icon: '🏰',
            title: 'Здания',
            title_en: 'Buildings',
            articles: [
                {
                    title: 'Башня мага',
                    title_en: 'Wizard Tower',
                    content: `<b>Башня мага</b> — найм и управление магами.

<b>Функции:</b>
• Нанимай новых магов за Time Currency
• Каждый маг имеет уникальную стихию
• Улучшай башню чтобы нанимать больше магов

<b>Бонусы за уровень башни:</b>
• ❤️ +10% HP магов за каждый уровень
• ⚔️ +2% урона за каждый уровень

<b>Пример:</b>
Башня 5 ур. = +50% HP и +10% урона
Башня 10 ур. = +100% HP и +20% урона`,
                    content_en: `<b>Wizard Tower</b> — hire and manage wizards.

<b>Functions:</b>
• Hire new wizards for Time Currency
• Each wizard has a unique element
• Upgrade the tower to hire more wizards

<b>Tower level bonuses:</b>
• ❤️ +10% wizard HP per level
• ⚔️ +2% damage per level

<b>Example:</b>
Tower lvl 5 = +50% HP and +10% damage
Tower lvl 10 = +100% HP and +20% damage`
                },
                {
                    title: 'Библиотека',
                    title_en: 'Library',
                    content: `<b>Библиотека</b> — изучай и улучшай заклинания.

<b>Функции:</b>
• Изучай новые заклинания для боя
• Улучшай существующие заклинания
• Открывай мощные школы магии

<b>Школы магии:</b>
Каждая стихия имеет свой набор заклинаний с уникальными эффектами.`,
                    content_en: `<b>Library</b> — learn and upgrade spells.

<b>Functions:</b>
• Learn new spells for battle
• Upgrade existing spells
• Unlock powerful magic schools

<b>Magic schools:</b>
Each element has its own set of spells with unique effects.`
                },
                {
                    title: 'Арена',
                    title_en: 'Arena',
                    content: `<b>Арена</b> — сражайся с другими игроками!

<b>Функции:</b>
• PvP бои с реальными игроками
• Еженедельное испытание с манекеном
• Зарабатывай рейтинг и поднимайся в лигах

<b>Лиги:</b>
Адепт → Ученик → Подмастерье → Искусный → Мастер → Великий → Верховный → Архимаг`,
                    content_en: `<b>Arena</b> — fight other players!

<b>Functions:</b>
• PvP battles with real players
• Weekly dummy challenge
• Earn rating and climb the leagues

<b>Leagues:</b>
Adept → Apprentice → Journeyman → Skilled → Master → Grand → Supreme → Archmage`
                },
                {
                    title: 'Гильдия',
                    title_en: 'Guild',
                    content: `<b>Гильдия</b> — объединяйся с другими игроками!

<b>Бонусы за уровень гильдии:</b>
• ❤️ +10% HP за каждый уровень
• ⚔️ +1% урона за каждый уровень
• 👥 +5 вместимость на 5/10/15/20/25/30 ур.

<b>Пример на 10 ур.:</b>
+100% HP, +10% урона, 20 игроков

<b>Исследования:</b>
Очки дают +0.5% сопротивления к школе (макс 30 очков = 15%)`,
                    content_en: `<b>Guild</b> — unite with other players!

<b>Guild level bonuses:</b>
• ❤️ +10% HP per level
• ⚔️ +1% damage per level
• 👥 +5 capacity at lvl 5/10/15/20/25/30

<b>Example at lvl 10:</b>
+100% HP, +10% damage, 20 players

<b>Research:</b>
Points give +0.5% resistance to a school (max 30 points = 15%)`
                },
                {
                    title: 'Башня благословения',
                    title_en: 'Blessing Tower',
                    content: `<b>Башня благословения</b> — временные бонусы на 3 часа.

<b>Благословения по уровням:</b>
• 1 ур: 🛡️ +15 брони
• 2 ур: ⚔️ +12% урона
• 3 ур: ❤️ +20% HP
• 4 ур: 💚 +3% регенерации/ход
• 5 ур: ✨ Комбо (все бонусы слабее)

<b>Кулдаун:</b> 24 часа между использованиями`,
                    content_en: `<b>Blessing Tower</b> — temporary 3-hour bonuses.

<b>Blessings by level:</b>
• Lvl 1: 🛡️ +15 armor
• Lvl 2: ⚔️ +12% damage
• Lvl 3: ❤️ +20% HP
• Lvl 4: 💚 +3% regen/turn
• Lvl 5: ✨ Combo (all bonuses weaker)

<b>Cooldown:</b> 24 hours between uses`
                },
                {
                    title: 'Арканская лаборатория',
                    title_en: 'Arcane Laboratory',
                    content: `<b>Арканская лаборатория</b> — ускорение исследований.

<b>Бонусы за уровень:</b>
• 📖 +2% скорость изучения заклинаний
• ⚔️ +1% урон заклинаний

<b>Примеры:</b>
• 5 ур: +10% скорость, +5% урон
• 10 ур: +20% скорость, +10% урон
• 15 ур (макс): +30% скорость, +15% урон`,
                    content_en: `<b>Arcane Laboratory</b> — research acceleration.

<b>Level bonuses:</b>
• 📖 +2% spell learning speed
• ⚔️ +1% spell damage

<b>Examples:</b>
• Lvl 5: +10% speed, +5% damage
• Lvl 10: +20% speed, +10% damage
• Lvl 15 (max): +30% speed, +15% damage`
                },
                {
                    title: 'Генератор времени',
                    title_en: 'Time Generator',
                    content: `<b>Генератор времени</b> — пассивный доход.

<b>Производство TC в час:</b>
• 1 ур: 36 мин/ч (14ч/день)
• 5 ур: 66 мин/ч (26ч/день)
• 10 ур: 104 мин/ч (41ч/день)
• 15 ур: 142 мин/ч (57ч/день)

<b>Формула:</b>
36 + (уровень-1) × 7.6 мин/час

<b>Совет:</b>
Генератор копит TC даже офлайн!`,
                    content_en: `<b>Time Generator</b> — passive income.

<b>TC production per hour:</b>
• Lvl 1: 36 min/h (14h/day)
• Lvl 5: 66 min/h (26h/day)
• Lvl 10: 104 min/h (41h/day)
• Lvl 15: 142 min/h (57h/day)

<b>Formula:</b>
36 + (level-1) × 7.6 min/hour

<b>Tip:</b>
Generator accumulates TC even offline!`
                }
            ]
        },
        {
            id: 'wizards',
            icon: '🧙',
            title: 'Маги',
            title_en: 'Wizards',
            articles: [
                {
                    title: 'Основы',
                    title_en: 'Basics',
                    content: `<b>Маги</b> — твои бойцы на арене.

<b>Характеристики мага:</b>
• ❤️ HP — здоровье
• 🛡️ Броня — поглощает урон до HP
• 📊 Уровень — растёт с опытом

<b>Стихии:</b>
Каждый маг принадлежит к одной из 6 стихий, определяющей его заклинания.`,
                    content_en: `<b>Wizards</b> — your fighters in the arena.

<b>Wizard stats:</b>
• ❤️ HP — health
• 🛡️ Armor — absorbs damage before HP
• 📊 Level — grows with experience

<b>Elements:</b>
Each wizard belongs to one of 6 elements that determine their spells.`
                },
                {
                    title: 'Прокачка',
                    title_en: 'Leveling Up',
                    content: `<b>Как прокачивать магов:</b>

• Маги получают опыт за бои
• Максимальный уровень — 40

<b>Бонусы за уровень:</b>
• ❤️ +5% HP за каждый уровень
• ⚔️ +1% урона за каждый уровень

<b>Бонус 40 уровня:</b>
• ❤️ +200% HP (×3 от базы!)
• ⚔️ +40% урона`,
                    content_en: `<b>How to level up wizards:</b>

• Wizards gain experience from battles
• Maximum level — 40

<b>Level bonuses:</b>
• ❤️ +5% HP per level
• ⚔️ +1% damage per level

<b>Level 40 bonus:</b>
• ❤️ +200% HP (×3 from base!)
• ⚔️ +40% damage`
                },
                {
                    title: 'Сопротивления',
                    title_en: 'Resistances',
                    content: `<b>Сопротивление магии</b> снижает входящий урон.

<b>Как получить:</b>
Каждый уровень заклинания даёт +1.5% сопротивления к его школе.

<b>Пример:</b>
Искра 5 ур. = +7.5% к огню
Все заклинания огня = суммируются

<b>Максимум:</b> 75% сопротивления`,
                    content_en: `<b>Magic resistance</b> reduces incoming damage.

<b>How to get:</b>
Each spell level gives +1.5% resistance to its school.

<b>Example:</b>
Spark lvl 5 = +7.5% fire resistance
All fire spells = stack

<b>Maximum:</b> 75% resistance`
                },
                {
                    title: 'Формация',
                    title_en: 'Formation',
                    content: `<b>Формация</b> — расположение магов в бою.

• У тебя 5 слотов для магов
• Комбинируй магов разных стихий
• Экспериментируй с разными составами

<b>Совет:</b>
Используй магов со взаимодополняющими заклинаниями!`,
                    content_en: `<b>Formation</b> — wizard placement in battle.

• You have 5 wizard slots
• Combine wizards of different elements
• Experiment with different compositions

<b>Tip:</b>
Use wizards with complementary spells!`
                }
            ]
        },
        {
            id: 'spells',
            icon: '✨',
            title: 'Заклинания',
            title_en: 'Spells',
            articles: [
                {
                    title: 'Основы',
                    title_en: 'Basics',
                    content: `<b>Заклинания</b> — магические атаки и способности.

<b>Типы заклинаний:</b>
• 💥 Урон — наносят повреждения врагам
• 🛡️ Защита — щиты и барьеры
• 💚 Лечение — восстановление HP
• ⚡ Эффекты — яды, ослабления, усиления

<b>Изучение:</b>
Новые заклинания открываются в Библиотеке.`,
                    content_en: `<b>Spells</b> — magical attacks and abilities.

<b>Spell types:</b>
• 💥 Damage — deal damage to enemies
• 🛡️ Defense — shields and barriers
• 💚 Healing — restore HP
• ⚡ Effects — poisons, debuffs, buffs

<b>Learning:</b>
New spells are unlocked in the Library.`
                },
                {
                    title: 'Улучшение',
                    title_en: 'Upgrading',
                    content: `<b>Улучшение заклинаний:</b>

• Каждое заклинание можно улучшить до 5 уровня
• Улучшение увеличивает урон/эффект
• Требуется Time Currency

<b>Совет:</b>
Сначала улучшай часто используемые заклинания!`,
                    content_en: `<b>Upgrading spells:</b>

• Each spell can be upgraded to level 5
• Upgrading increases damage/effect
• Requires Time Currency

<b>Tip:</b>
Upgrade your most used spells first!`
                },
                {
                    title: '🔥 Огонь',
                    title_en: '🔥 Fire',
                    content: `<b>Заклинания огня:</b>

• Искра — урон по 1 цели
• Огненная стрела — несколько стрел
• Огненная стена — урон по области
• Огненный шар — взрыв 3×3
• Огненное цунами — полное покрытие

<b>Особенность:</b> шанс поджечь врага`,
                    content_en: `<b>Fire spells:</b>

• Spark — single target damage
• Fire Arrow — multiple arrows
• Fire Wall — area damage
• Fireball — 3×3 explosion
• Fire Tsunami — full coverage

<b>Special:</b> chance to ignite enemy`
                },
                {
                    title: '💧 Вода',
                    title_en: '💧 Water',
                    content: `<b>Заклинания воды:</b>

• Сосулька — урон по 1 цели
• Ледяная стрела — несколько стрел
• Ледяной дождь — урон по области
• Метель — массовый урон
• Абсолютный ноль — мощная заморозка

<b>Особенность:</b> охлаждение/заморозка врага`,
                    content_en: `<b>Water spells:</b>

• Icicle — single target damage
• Ice Arrow — multiple arrows
• Ice Rain — area damage
• Blizzard — mass damage
• Absolute Zero — powerful freeze

<b>Special:</b> chill/freeze enemy`
                },
                {
                    title: '💨 Ветер',
                    title_en: '💨 Wind',
                    content: `<b>Заклинания ветра:</b>

• Порыв — урон по 1 цели
• Лезвие ветра — быстрая атака
• Ветряная стена — защита
• Грозовое облако — урон по области
• Шаровая молния — мощный урон

<b>Особенность:</b> шанс двойного урона`,
                    content_en: `<b>Wind spells:</b>

• Gust — single target damage
• Wind Blade — quick attack
• Wind Wall — defense
• Storm Cloud — area damage
• Ball Lightning — powerful damage

<b>Special:</b> chance for double damage`
                },
                {
                    title: '🌍 Земля',
                    title_en: '🌍 Earth',
                    content: `<b>Заклинания земли:</b>

• Камешек — урон по 1 цели
• Каменный шип — урон врагу
• Каменная стена — защита
• Каменный грот — укрытие
• Метеоритный дождь — массовый урон

<b>Особенность:</b> игнорирование брони`,
                    content_en: `<b>Earth spells:</b>

• Pebble — single target damage
• Stone Spike — enemy damage
• Stone Wall — defense
• Stone Grotto — shelter
• Meteor Rain — mass damage

<b>Special:</b> armor piercing`
                },
                {
                    title: '🌿 Природа',
                    title_en: '🌿 Nature',
                    content: `<b>Заклинания природы:</b>

• Зов волка — призыв волка
• Древесная кора — броня
• Покров листвы — защита команды
• Энт — призыв энта-защитника
• Метеокинез — контроль погоды

<b>Особенность:</b> призывы и лечение`,
                    content_en: `<b>Nature spells:</b>

• Wolf Call — summon wolf
• Tree Bark — armor
• Leaf Cover — team defense
• Ent — summon ent defender
• Meteokinesis — weather control

<b>Special:</b> summons and healing`
                },
                {
                    title: '☠️ Яд',
                    title_en: '☠️ Poison',
                    content: `<b>Заклинания яда:</b>

• Отравленный клинок — яд 1 цели
• Ядовитая поляна — зона яда
• Мерзкое облако — ядовитый газ
• Чума — распространяющийся яд
• Эпидемия — массовое отравление

<b>Особенность:</b> урон по времени (DoT)`,
                    content_en: `<b>Poison spells:</b>

• Poisoned Blade — poison 1 target
• Poison Glade — poison zone
• Foul Cloud — poisonous gas
• Plague — spreading poison
• Epidemic — mass poisoning

<b>Special:</b> damage over time (DoT)`
                }
            ]
        },
        {
            id: 'battle',
            icon: '⚔️',
            title: 'Бой',
            title_en: 'Battle',
            articles: [
                {
                    title: 'Механика боя',
                    title_en: 'Battle Mechanics',
                    content: `<b>Как проходит бой:</b>

1. Ты и враг ходите по очереди
2. За ход атакуют все твои маги
3. Выбирай заклинание для каждого мага
4. Бой идёт до победы одной стороны

<b>Победа:</b>
Уничтожь всех вражеских магов!`,
                    content_en: `<b>How battle works:</b>

1. You and the enemy take turns
2. All your wizards attack per turn
3. Choose a spell for each wizard
4. Battle continues until one side wins

<b>Victory:</b>
Destroy all enemy wizards!`
                },
                {
                    title: 'Энергия',
                    title_en: 'Energy',
                    content: `<b>Энергия боя:</b>

• Максимум: 12 единиц
• 1 бой = 1 энергия
• Восстановление: 1 единица каждые 2 часа

<b>Совет:</b>
Энергия восстанавливается даже офлайн!`,
                    content_en: `<b>Battle energy:</b>

• Maximum: 12 units
• 1 battle = 1 energy
• Recovery: 1 unit every 2 hours

<b>Tip:</b>
Energy recovers even offline!`
                },
                {
                    title: 'Рейтинг',
                    title_en: 'Rating',
                    content: `<b>Рейтинговая система:</b>

• Победа = +рейтинг
• Поражение = -рейтинг
• Рейтинг определяет твою лигу

<b>Лиги:</b>
🔰 Адепт (0-999)
📘 Ученик (1000-1499)
📗 Подмастерье (1500-1999)
🔮 Искусный (2000-2499)
✨ Мастер (2500-2999)
⭐ Великий (3000-3999)
🔥 Верховный (4000+)
👑 Архимаг (9999)`,
                    content_en: `<b>Rating system:</b>

• Win = +rating
• Loss = -rating
• Rating determines your league

<b>Leagues:</b>
🔰 Adept (0-999)
📘 Apprentice (1000-1499)
📗 Journeyman (1500-1999)
🔮 Skilled (2000-2499)
✨ Master (2500-2999)
⭐ Grand (3000-3999)
🔥 Supreme (4000+)
👑 Archmage (9999)`
                },
                {
                    title: 'Испытание',
                    title_en: 'Challenge',
                    content: `<b>Еженедельное испытание</b> — покажи максимальный урон!

<b>Как работает:</b>
• Сражайся с манекеном (не атакует)
• 3 попытки в день, 10 раундов на попытку
• Урон копится всю неделю
• В конце недели — награды по результатам

<b>Манекен:</b>
Каждую неделю новый голем с разными сопротивлениями!

<b>Награды:</b>
От 1 часа (участник) до 7 дней (легенда) TC`,
                    content_en: `<b>Weekly Challenge</b> — show your maximum damage!

<b>How it works:</b>
• Fight a dummy (doesn't attack)
• 3 attempts per day, 10 rounds per attempt
• Damage accumulates all week
• End of week — rewards based on results

<b>Dummy:</b>
Each week a new golem with different resistances!

<b>Rewards:</b>
From 1 hour (participant) to 7 days (legend) TC`
                },
                {
                    title: 'Погода',
                    title_en: 'Weather',
                    content: `<b>Погода</b> — случайный бонус в бою.

<b>Типы погоды (+15% урона):</b>
• ☀️ Засуха → 🔥 Огонь
• ❄️ Ледяной туман → 💧 Вода
• 🏜️ Песчаная буря → 🌍 Земля
• 🌪️ Шторм → 💨 Ветер

<b>Совет:</b>
Используй магов с заклинаниями, подходящими под погоду!`,
                    content_en: `<b>Weather</b> — random battle bonus.

<b>Weather types (+15% damage):</b>
• ☀️ Drought → 🔥 Fire
• ❄️ Ice Fog → 💧 Water
• 🏜️ Sandstorm → 🌍 Earth
• 🌪️ Storm → 💨 Wind

<b>Tip:</b>
Use wizards with spells matching the weather!`
                },
                {
                    title: 'Метеокинез',
                    title_en: 'Meteokinesis',
                    content: `<b>Метеокинез</b> — заклинание Природы 5-го тира.

<b>Эффекты по уровням:</b>
• 1-3 ур: +5%/10%/15% урон союзникам
• 4 ур: +15% урон + отключает погоду врагу (2 хода)
• 5 ур: +15% урон + отключает погоду врагу (весь бой)

<b>Важно:</b>
Бонус действует на все стихийные заклинания команды!`,
                    content_en: `<b>Meteokinesis</b> — Nature tier 5 spell.

<b>Effects by level:</b>
• Lvl 1-3: +5%/10%/15% ally damage
• Lvl 4: +15% damage + disables enemy weather (2 turns)
• Lvl 5: +15% damage + disables enemy weather (entire battle)

<b>Important:</b>
Bonus affects all elemental spells of the team!`
                }
            ]
        },
        {
            id: 'rewards',
            icon: '🎁',
            title: 'Награды',
            title_en: 'Rewards',
            articles: [
                {
                    title: 'Ежедневный вход',
                    title_en: 'Daily Login',
                    content: `<b>Ежедневные награды:</b>

• Заходи каждый день и получай награды
• Награды растут с каждым днём
• Максимум 7 дней в цикле

<b>Streak бонус:</b>
Заходи несколько дней подряд для бонуса!`,
                    content_en: `<b>Daily rewards:</b>

• Log in every day to receive rewards
• Rewards increase each day
• Maximum 7 days per cycle

<b>Streak bonus:</b>
Log in several days in a row for a bonus!`
                },
                {
                    title: 'Time Currency',
                    title_en: 'Time Currency',
                    content: `<b>Time Currency ⏰</b> — основная валюта игры.

<b>Как получить:</b>
• Офлайн-накопление (1/мин)
• Ежедневные награды
• Победы в боях
• Награды за лиги

<b>Использование:</b>
• Найм магов
• Изучение заклинаний
• Улучшения`,
                    content_en: `<b>Time Currency ⏰</b> — the main game currency.

<b>How to get:</b>
• Offline accumulation (1/min)
• Daily rewards
• Battle victories
• League rewards

<b>Usage:</b>
• Hire wizards
• Learn spells
• Upgrades`
                },
                {
                    title: 'Лиговые награды',
                    title_en: 'League Rewards',
                    content: `<b>Награды за лиги:</b>

При достижении новой лиги ты получаешь награду (раз за сезон)!

• 🔰 Адепт — 100 TC + 50 BPM
• 📘 Ученик — 300 TC + 125 BPM
• 📗 Подмастерье — 600 TC + 250 BPM
• 🔮 Искусный — 1000 TC + 500 BPM
• ✨ Мастер — 2000 TC + 1000 BPM
• ⭐ Великий — 4000 TC + 2000 BPM
• 🔥 Верховный — 10000 TC + 5000 BPM
• 👑 Архимаг — 20000 TC + 12500 BPM`,
                    content_en: `<b>League rewards:</b>

When reaching a new league you receive a reward (once per season)!

• 🔰 Adept — 100 TC + 50 BPM
• 📘 Apprentice — 300 TC + 125 BPM
• 📗 Journeyman — 600 TC + 250 BPM
• 🔮 Skilled — 1000 TC + 500 BPM
• ✨ Master — 2000 TC + 1000 BPM
• ⭐ Grand — 4000 TC + 2000 BPM
• 🔥 Supreme — 10000 TC + 5000 BPM
• 👑 Archmage — 20000 TC + 12500 BPM`
                },
                {
                    title: 'Реферальная программа',
                    title_en: 'Referral Program',
                    content: `<b>Пригласи друга!</b>

<b>Награды за приглашение:</b>
• 🎁 Ты получаешь: 1 день TC + 200 BPM
• 🎁 Друг получает: 1 день TC + 200 BPM

<b>Бонус от покупок:</b>
💎 +10% от BPM очков друга при его покупках — навсегда!

<b>Как пригласить:</b>
Airdrop → Пригласить друга → Скопировать ссылку`,
                    content_en: `<b>Invite a friend!</b>

<b>Referral rewards:</b>
• 🎁 You get: 1 day TC + 200 BPM
• 🎁 Friend gets: 1 day TC + 200 BPM

<b>Purchase bonus:</b>
💎 +10% of friend's BPM from their purchases — forever!

<b>How to invite:</b>
Airdrop → Invite friend → Copy link`
                }
            ]
        },
        {
            id: 'airdrop',
            icon: '💎',
            title: 'Airdrop',
            title_en: 'Airdrop',
            articles: [
                {
                    title: 'Что такое Airdrop?',
                    title_en: 'What is Airdrop?',
                    content: `<b>BPM Coin Airdrop</b>

Играй и зарабатывай BPM очки, которые будут конвертированы в токены при запуске!

<b>Как заработать:</b>
• 🎮 Побеждай в боях
• 📅 Заходи каждый день
• 👛 Подключи TON кошелёк
• 👥 Приглашай друзей`,
                    content_en: `<b>BPM Coin Airdrop</b>

Play and earn BPM points that will be converted to tokens at launch!

<b>How to earn:</b>
• 🎮 Win battles
• 📅 Log in daily
• 👛 Connect TON wallet
• 👥 Invite friends`
                },
                {
                    title: 'TON Кошелёк',
                    title_en: 'TON Wallet',
                    content: `<b>Подключение кошелька:</b>

1. Открой раздел Airdrop
2. Нажми "Подключить кошелёк"
3. Выбери Tonkeeper, MyTonWallet или другой
4. Подтверди подключение

<b>Бонус:</b>
За подключение кошелька ты получишь BPM очки!`,
                    content_en: `<b>Connecting wallet:</b>

1. Open the Airdrop section
2. Press "Connect wallet"
3. Choose Tonkeeper, MyTonWallet or other
4. Confirm connection

<b>Bonus:</b>
You'll get BPM points for connecting a wallet!`
                }
            ]
        },
        {
            id: 'factions',
            icon: '⚜️',
            title: 'Фракции',
            title_en: 'Factions',
            articles: [
                {
                    title: '🔥 Огонь',
                    title_en: '🔥 Fire',
                    content: `<b>Фракция Огня</b>

<b>Бонус фракции:</b>
При огненной атаке 10% шанс поджечь врага.
Горение: 10% от макс. HP (до 100) на 3 хода.

<b>Изучение:</b>
📚 Заклинания огня изучаются на 15% быстрее`,
                    content_en: `<b>Fire Faction</b>

<b>Faction bonus:</b>
Fire attacks have 10% chance to ignite enemy.
Burn: 10% of max HP (up to 100) for 3 turns.

<b>Learning:</b>
📚 Fire spells are learned 15% faster`
                },
                {
                    title: '💧 Вода',
                    title_en: '💧 Water',
                    content: `<b>Фракция Воды</b>

<b>Бонус фракции:</b>
1-4 ур: 15% шанс охладить врага (-15% урона)
5 ур: 15% шанс заморозить (-20% урона)

<b>Изучение:</b>
📚 Заклинания воды изучаются на 15% быстрее`,
                    content_en: `<b>Water Faction</b>

<b>Faction bonus:</b>
Lvl 1-4: 15% chance to chill enemy (-15% damage)
Lvl 5: 15% chance to freeze (-20% damage)

<b>Learning:</b>
📚 Water spells are learned 15% faster`
                },
                {
                    title: '💨 Ветер',
                    title_en: '💨 Wind',
                    content: `<b>Фракция Ветра</b>

<b>Бонус фракции:</b>
При атаке ветра 5% шанс нанести двойной урон.
Удар молнии пробивает любую защиту.

<b>Изучение:</b>
📚 Заклинания ветра изучаются на 15% быстрее`,
                    content_en: `<b>Wind Faction</b>

<b>Faction bonus:</b>
Wind attacks have 5% chance for double damage.
Lightning strike pierces any defense.

<b>Learning:</b>
📚 Wind spells are learned 15% faster`
                },
                {
                    title: '🪨 Земля',
                    title_en: '🪨 Earth',
                    content: `<b>Фракция Земли</b>

<b>Бонус фракции:</b>
При атаках земли 10% шанс игнорировать 20% брони.
Удар камня пробивает защиту.

<b>Изучение:</b>
📚 Заклинания земли изучаются на 15% быстрее`,
                    content_en: `<b>Earth Faction</b>

<b>Faction bonus:</b>
Earth attacks have 10% chance to ignore 20% armor.
Stone strike pierces defense.

<b>Learning:</b>
📚 Earth spells are learned 15% faster`
                },
                {
                    title: '🌱 Природа',
                    title_en: '🌱 Nature',
                    content: `<b>Фракция Природы</b>

<b>Бонус фракции:</b>
После заклинания 5% шанс исцелить союзника на 5% HP.

<b>Изучение:</b>
📚 Заклинания природы изучаются на 15% быстрее`,
                    content_en: `<b>Nature Faction</b>

<b>Faction bonus:</b>
After casting, 5% chance to heal an ally for 5% HP.

<b>Learning:</b>
📚 Nature spells are learned 15% faster`
                },
                {
                    title: '☠️ Яд',
                    title_en: '☠️ Poison',
                    content: `<b>Фракция Яда</b>

<b>Бонус фракции:</b>
При отравлении 5% шанс наложить доп. стак яда.
Каждый стак: 5 урона в начале хода.

<b>Изучение:</b>
📚 Заклинания яда изучаются на 15% быстрее`,
                    content_en: `<b>Poison Faction</b>

<b>Faction bonus:</b>
When poisoning, 5% chance to apply extra poison stack.
Each stack: 5 damage at turn start.

<b>Learning:</b>
📚 Poison spells are learned 15% faster`
                }
            ]
        },
        {
            id: 'faq',
            icon: '❓',
            title: 'FAQ',
            title_en: 'FAQ',
            articles: [
                {
                    title: 'Мой прогресс сохраняется?',
                    title_en: 'Is my progress saved?',
                    content: `<b>Да!</b> Твой прогресс автоматически сохраняется в облаке.

• Прогресс привязан к твоему Telegram аккаунту
• Можешь играть с любого устройства
• Данные синхронизируются автоматически`,
                    content_en: `<b>Yes!</b> Your progress is automatically saved in the cloud.

• Progress is linked to your Telegram account
• You can play from any device
• Data syncs automatically`
                },
                {
                    title: 'Как сменить фракцию?',
                    title_en: 'How to change faction?',
                    content: `<b>Смена фракции:</b>

• Первая смена бесплатна
• Последующие смены стоят Stars ⭐
• Твои маги и заклинания сохраняются

<b>Как:</b>
Открой Магазин → Смена фракции`,
                    content_en: `<b>Changing faction:</b>

• First change is free
• Further changes cost Stars ⭐
• Your wizards and spells are kept

<b>How:</b>
Open Shop → Change faction`
                },
                {
                    title: 'Почему я проигрываю?',
                    title_en: 'Why am I losing?',
                    content: `<b>Советы по улучшению:</b>

• 📈 Прокачивай магов в боях
• ✨ Улучшай заклинания в Библиотеке
• 🧙 Нанимай новых магов
• ⚔️ Экспериментируй с формацией
• 🎯 Используй комбо заклинаний`,
                    content_en: `<b>Tips for improvement:</b>

• 📈 Level up wizards in battles
• ✨ Upgrade spells in the Library
• 🧙 Hire new wizards
• ⚔️ Experiment with formation
• 🎯 Use spell combos`
                },
                {
                    title: 'Игра зависла, что делать?',
                    title_en: 'Game frozen, what to do?',
                    content: `<b>Решение проблем:</b>

1. Обнови страницу (потяни вниз)
2. Закрой и открой игру заново
3. Проверь интернет-соединение

<b>Важно:</b>
Твой прогресс сохраняется автоматически, ничего не потеряется!`,
                    content_en: `<b>Troubleshooting:</b>

1. Refresh the page (pull down)
2. Close and reopen the game
3. Check your internet connection

<b>Important:</b>
Your progress is saved automatically, nothing will be lost!`
                },
                {
                    title: 'Как получить больше магов?',
                    title_en: 'How to get more wizards?',
                    content: `<b>Получение магов:</b>

• 🏛️ Нанимай в Башне мага за Time Currency
• 🎁 Стартовый маг при выборе фракции

<b>Совет:</b>
Улучшай Башню мага чтобы нанимать больше магов!`,
                    content_en: `<b>Getting wizards:</b>

• 🏛️ Hire at the Wizard Tower for Time Currency
• 🎁 Starter wizard when choosing faction

<b>Tip:</b>
Upgrade the Wizard Tower to hire more wizards!`
                }
            ]
        }
    ]
};

/**
 * Текущее состояние модалки
 */
let currentCategory = null;
let currentArticle = null;

/**
 * Получить локализованное поле из объекта (title/title_en, content/content_en)
 */
function kbLocalize(obj, field) {
    const lang = typeof getLang === 'function' ? getLang() : (window.LANG || 'ru');
    if (lang === 'en' && obj[field + '_en']) {
        return obj[field + '_en'];
    }
    return obj[field];
}

/**
 * Показать модалку Книги Знаний
 */
function showKnowledgeBookModal() {
    console.log('📖 Открытие Книги Знаний');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('knowledge-book-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем экран
    const screen = document.createElement('div');
    screen.id = 'knowledge-book-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
        z-index: 9000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;

    screen.innerHTML = `
        <div id="knowledge-book-header" style="
            padding: 15px 20px;
            background: linear-gradient(90deg, rgba(255,215,0,0.2), transparent);
            border-bottom: 2px solid rgba(255,215,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        ">
            <span id="kb-back-btn" style="
                font-size: 24px;
                cursor: pointer;
                display: none;
                padding: 5px 10px;
                background: rgba(255,215,0,0.15);
                border: 1px solid rgba(255,215,0,0.4);
                border-radius: 8px;
                color: #ffd700;
            ">←</span>
            <h2 id="kb-title" style="
                margin: 0;
                color: #ffd700;
                font-size: 20px;
                text-shadow: 0 0 10px rgba(255,215,0,0.5);
            ">${t('kb_title')}</h2>
            <button id="kb-close-btn" style="
                background: rgba(255,100,100,0.2);
                border: 1px solid rgba(255,100,100,0.5);
                color: #ff6b6b;
                font-size: 18px;
                padding: 5px 12px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">✕</button>
        </div>
        <div id="knowledge-book-content" style="
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        "></div>
    `;

    document.body.appendChild(screen);

    // Обработчики
    document.getElementById('kb-close-btn').onclick = closeKnowledgeBookModal;
    document.getElementById('kb-back-btn').onclick = handleBackButton;

    // Показываем категории
    showCategories();
}

/**
 * Показать список категорий
 */
function showCategories() {
    currentCategory = null;
    currentArticle = null;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');
    const backBtn = document.getElementById('kb-back-btn');

    title.textContent = t('kb_title');
    backBtn.style.display = 'none';

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';

    KNOWLEDGE_BOOK_DATA.categories.forEach(category => {
        const catTitle = kbLocalize(category, 'title');
        html += `
            <div class="kb-category-item" data-category="${category.id}" style="
                background: linear-gradient(145deg, rgba(50,50,80,0.8), rgba(30,30,50,0.8));
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 12px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <span style="font-size: 32px;">${category.icon}</span>
                <div>
                    <div style="color: #fff; font-size: 18px; font-weight: bold;">${catTitle}</div>
                    <div style="color: #888; font-size: 14px;">${category.articles.length} ${t('common_articles')}</div>
                </div>
                <span style="margin-left: auto; color: #ffd700; font-size: 20px;">›</span>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;

    // Добавляем обработчики клика
    content.querySelectorAll('.kb-category-item').forEach(item => {
        item.onclick = () => {
            const categoryId = item.dataset.category;
            showCategoryArticles(categoryId);
        };
        // Hover эффект
        item.onmouseenter = () => {
            item.style.background = 'linear-gradient(145deg, rgba(70,70,100,0.9), rgba(50,50,70,0.9))';
            item.style.borderColor = 'rgba(255,215,0,0.6)';
        };
        item.onmouseleave = () => {
            item.style.background = 'linear-gradient(145deg, rgba(50,50,80,0.8), rgba(30,30,50,0.8))';
            item.style.borderColor = 'rgba(255,215,0,0.3)';
        };
    });
}

/**
 * Показать статьи категории
 */
function showCategoryArticles(categoryId) {
    const category = KNOWLEDGE_BOOK_DATA.categories.find(c => c.id === categoryId);
    if (!category) return;

    currentCategory = category;
    currentArticle = null;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');
    const backBtn = document.getElementById('kb-back-btn');

    title.textContent = `${category.icon} ${kbLocalize(category, 'title')}`;
    backBtn.style.display = 'block';

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

    category.articles.forEach((article, index) => {
        const artTitle = kbLocalize(article, 'title');
        html += `
            <div class="kb-article-item" data-index="${index}" style="
                background: rgba(40,40,60,0.8);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="color: #fff; font-size: 16px;">${artTitle}</div>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;

    // Обработчики
    content.querySelectorAll('.kb-article-item').forEach(item => {
        item.onclick = () => {
            const index = parseInt(item.dataset.index);
            showArticle(category, index);
        };
        item.onmouseenter = () => {
            item.style.background = 'rgba(60,60,80,0.9)';
            item.style.borderColor = 'rgba(255,215,0,0.5)';
        };
        item.onmouseleave = () => {
            item.style.background = 'rgba(40,40,60,0.8)';
            item.style.borderColor = 'rgba(255,255,255,0.1)';
        };
    });
}

/**
 * Показать статью
 */
function showArticle(category, articleIndex) {
    const article = category.articles[articleIndex];
    if (!article) return;

    currentArticle = article;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');

    title.textContent = kbLocalize(article, 'title');

    // Форматируем контент (заменяем переносы строк на <br>)
    const formattedContent = kbLocalize(article, 'content')
        .replace(/\n/g, '<br>')
        .replace(/<b>/g, '<span style="color: #ffd700; font-weight: bold;">')
        .replace(/<\/b>/g, '</span>');

    content.innerHTML = `
        <div style="
            background: rgba(40,40,60,0.6);
            border: 1px solid rgba(255,215,0,0.2);
            border-radius: 15px;
            padding: 20px;
        ">
            <div style="
                color: #e0e0e0;
                font-size: 16px;
                line-height: 1.6;
            ">${formattedContent}</div>
        </div>
    `;
}

/**
 * Обработка кнопки "Назад"
 */
function handleBackButton() {
    if (currentArticle) {
        // Возврат к списку статей
        showCategoryArticles(currentCategory.id);
    } else if (currentCategory) {
        // Возврат к категориям
        showCategories();
    }
}

/**
 * Закрыть модалку
 */
function closeKnowledgeBookModal() {
    const screen = document.getElementById('knowledge-book-screen');
    if (screen) {
        screen.remove();
    }

    // Возвращаем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = '';
    }

    currentCategory = null;
    currentArticle = null;
}

// Экспорт в window
window.showKnowledgeBookModal = showKnowledgeBookModal;
window.closeKnowledgeBookModal = closeKnowledgeBookModal;

console.log('📖 Knowledge Book Modal загружен');
