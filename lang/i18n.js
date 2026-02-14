// i18n.js - Система локализации
// Поддержка русского и английского языков

/**
 * Словарь переводов
 * Ключи группируются по модулю: airdrop_, shop_, guild_, battle_ и т.д.
 * Новые строки добавляются сюда постепенно
 */
const STRINGS = {
    // === AIRDROP MODAL ===
    airdrop_title: {
        ru: '🪂 AIRDROP',
        en: '🪂 AIRDROP'
    },
    airdrop_your_bpm: {
        ru: 'Твои BPM coin 🪙',
        en: 'Your BPM coin 🪙'
    },
    airdrop_tap_details: {
        ru: '📊 Нажми для детализации',
        en: '📊 Tap for details'
    },
    airdrop_wallet_ton: {
        ru: '👛 Кошелек TON',
        en: '👛 TON Wallet'
    },
    airdrop_not_connected: {
        ru: 'Не подключен',
        en: 'Not connected'
    },
    airdrop_disconnect: {
        ru: 'Отключить',
        en: 'Disconnect'
    },
    airdrop_connect: {
        ru: 'Подключить',
        en: 'Connect'
    },
    airdrop_tasks: {
        ru: '🎯 Задания',
        en: '🎯 Tasks'
    },
    airdrop_join_group: {
        ru: '👥 Вступить в группу',
        en: '👥 Join group'
    },
    airdrop_join_reward: {
        ru: '+500 BPM + ⏰ 2 дня',
        en: '+500 BPM + ⏰ 2 days'
    },
    airdrop_join_btn: {
        ru: 'Вступить',
        en: 'Join'
    },
    airdrop_check_btn: {
        ru: 'Проверить',
        en: 'Check'
    },
    airdrop_checking: {
        ru: 'Проверка...',
        en: 'Checking...'
    },
    airdrop_claimed: {
        ru: '✓ Получено',
        en: '✓ Claimed'
    },
    airdrop_play: {
        ru: 'Играть',
        en: 'Play'
    },
    airdrop_start: {
        ru: 'Начать',
        en: 'Start'
    },
    airdrop_task_reward_100: {
        ru: '+100 BPM + ⏰ 2 часа',
        en: '+100 BPM + ⏰ 2 hours'
    },
    airdrop_referral_title: {
        ru: '👥 Реферальная программа',
        en: '👥 Referral Program'
    },
    airdrop_your_link: {
        ru: '🔗 Твоя ссылка:',
        en: '🔗 Your link:'
    },
    airdrop_copy: {
        ru: '📋 Копировать',
        en: '📋 Copy'
    },
    airdrop_share: {
        ru: '📤 Поделиться',
        en: '📤 Share'
    },
    airdrop_referral_reward: {
        ru: 'За каждого друга: +200 BPM + ⏰ 12 часов',
        en: 'Per friend: +200 BPM + ⏰ 12 hours'
    },
    airdrop_invited_count: {
        ru: 'Приглашено друзей',
        en: 'Friends invited'
    },
    airdrop_earned_from_refs: {
        ru: 'Заработано с рефералов',
        en: 'Earned from referrals'
    },
    airdrop_close: {
        ru: '✕ Закрыть',
        en: '✕ Close'
    },

    // === NOTIFICATIONS (airdrop) ===
    notif_reward_already_claimed: {
        ru: '✓ Награда уже получена',
        en: '✓ Reward already claimed'
    },
    notif_user_error: {
        ru: '❌ Ошибка: не удалось определить пользователя',
        en: '❌ Error: could not identify user'
    },
    notif_gift_kombat_done: {
        ru: '🎉 Gift Kombat задание выполнено!',
        en: '🎉 Gift Kombat task completed!'
    },
    notif_char_not_found: {
        ru: '❌ Персонаж 2 уровня не найден. Продолжай играть!',
        en: '❌ Level 2 character not found. Keep playing!'
    },
    notif_check_failed: {
        ru: '⚠️ Не удалось проверить. Попробуй позже',
        en: '⚠️ Could not verify. Try again later'
    },
    notif_reward_received: {
        ru: '🎉 Награда получена!',
        en: '🎉 Reward received!'
    },
    notif_link_copied: {
        ru: '📋 Ссылка скопирована!',
        en: '📋 Link copied!'
    },
    notif_wallet_connected: {
        ru: '👛 Кошелёк подключён!',
        en: '👛 Wallet connected!'
    },
    notif_wallet_disconnected: {
        ru: '👛 Кошелёк отключён',
        en: '👛 Wallet disconnected'
    },
    notif_wallet_error: {
        ru: '❌ Кошелёк недоступен. Попробуйте обновить страницу.',
        en: '❌ Wallet unavailable. Try refreshing the page.'
    },

    notif_join_group_first: {
        ru: '👥 Вступите в группу и нажмите "Проверить" снова',
        en: '👥 Join the group and press "Check" again'
    },
    notif_reward_received_bpm_days: {
        ru: '🎉 Награда получена!',
        en: '🎉 Reward received!'
    },
    notif_already_claimed_before: {
        ru: '✓ Награда уже получена ранее',
        en: '✓ Reward already claimed before'
    },
    notif_not_subscribed: {
        ru: '❌ Вы не подписаны на группу. Вступите и попробуйте снова.',
        en: '❌ You are not subscribed to the group. Join and try again.'
    },
    notif_check_error: {
        ru: '❌ Ошибка проверки. Попробуйте позже.',
        en: '❌ Verification error. Try again later.'
    },
    notif_network_error: {
        ru: '❌ Ошибка сети. Попробуйте позже.',
        en: '❌ Network error. Try again later.'
    },
    notif_connect_error: {
        ru: '❌ Ошибка подключения',
        en: '❌ Connection error'
    },
    notif_disconnect_error: {
        ru: '❌ Ошибка отключения кошелька',
        en: '❌ Wallet disconnect error'
    },
    notif_gift_kombat_hint: {
        ru: '🥊 Получи 2 уровень в Gift Kombat и нажми "Проверить"',
        en: '🥊 Reach level 2 in Gift Kombat and press "Check"'
    },

    // === BREAKDOWN MODAL ===
    breakdown_title: {
        ru: '📊 Детализация BPM',
        en: '📊 BPM Breakdown'
    },
    breakdown_total: {
        ru: 'Всего',
        en: 'Total'
    },
    breakdown_close: {
        ru: 'Закрыть',
        en: 'Close'
    },

    // === AIRDROP TASKS (specific) ===
    airdrop_creaky_tasks: {
        ru: '📋 Creaky Tasks | Выполнить 3 любых задания',
        en: '📋 Creaky Tasks | Complete 3 any tasks'
    },
    airdrop_creaky_btn: {
        ru: 'Выполнить',
        en: 'Complete'
    },
    airdrop_money_mining: {
        ru: '⛏️ Присоединяйся к игре Money Mining',
        en: '⛏️ Join Money Mining game'
    },
    airdrop_pandafit: {
        ru: '🐼 PandaFiT: прокачай панду до 5 lvl и забирай награду',
        en: '🐼 PandaFiT: level up panda to 5 lvl and claim reward'
    },
    airdrop_gift_kombat: {
        ru: '🥊 Gift Kombat | Получи 2ур. и начни сражение за NFT подарки',
        en: '🥊 Gift Kombat | Reach lvl 2 and fight for NFT gifts'
    },

    // === AIRDROP HOW TO EARN ===
    airdrop_how_to_earn: {
        ru: '📈 Как заработать BPM coin',
        en: '📈 How to earn BPM coin'
    },
    airdrop_earn_pvp: {
        ru: '⚔️ Победа в PvP',
        en: '⚔️ PvP Victory'
    },
    airdrop_earn_daily: {
        ru: '📅 Ежедневный вход',
        en: '📅 Daily login'
    },
    airdrop_earn_spell: {
        ru: '📚 Изучение заклинания',
        en: '📚 Learning a spell'
    },
    airdrop_earn_invite: {
        ru: '👥 Приглашение друга',
        en: '👥 Inviting a friend'
    },
    airdrop_earn_building: {
        ru: '🏰 Постройка/улучшение здания',
        en: '🏰 Build/upgrade a building'
    },
    airdrop_earn_pve: {
        ru: '🎯 Прохождение главы PvE',
        en: '🎯 Completing PvE chapter'
    },
    airdrop_earn_streak: {
        ru: '🔥 Streak 7/30/100 дней',
        en: '🔥 Streak 7/30/100 days'
    },
    airdrop_earn_stars: {
        ru: '⭐ 100 Telegram Stars',
        en: '⭐ 100 Telegram Stars'
    },
    airdrop_top_players: {
        ru: '🏆 Топ игроков',
        en: '🏆 Top Players'
    },
    airdrop_loading: {
        ru: 'Загрузка...',
        en: 'Loading...'
    },
    airdrop_back: {
        ru: '← Назад',
        en: '← Back'
    },
    airdrop_invite: {
        ru: '🎁 Пригласить',
        en: '🎁 Invite'
    },
    airdrop_news: {
        ru: '📢 Новости',
        en: '📢 News'
    },

    // === COMMON ===
    common_close: {
        ru: 'Закрыть',
        en: 'Close'
    },
    common_back: {
        ru: 'Назад',
        en: 'Back'
    },
    common_save: {
        ru: 'Сохранить',
        en: 'Save'
    },
    common_cancel: {
        ru: 'Отмена',
        en: 'Cancel'
    },
    common_yes: {
        ru: 'Да',
        en: 'Yes'
    },
    common_no: {
        ru: 'Нет',
        en: 'No'
    },
    common_hours: {
        ru: 'часов',
        en: 'hours'
    },
    common_days: {
        ru: 'дней',
        en: 'days'
    },
    common_level: {
        ru: 'Уровень',
        en: 'Level'
    },
    common_min: {
        ru: 'мин',
        en: 'min'
    },
    common_articles: {
        ru: 'статей',
        en: 'articles'
    },

    // === BUILDINGS ===
    bld_title: {
        ru: 'Управление зданиями',
        en: 'Building Management'
    },
    bld_library: {
        ru: 'Библиотека',
        en: 'Library'
    },
    bld_library_desc: {
        ru: 'Изучение заклинаний',
        en: 'Spell learning'
    },
    bld_wizard_tower: {
        ru: 'Башня мага',
        en: 'Wizard Tower'
    },
    bld_wizard_tower_desc: {
        ru: 'Найм новых магов',
        en: 'Hire new wizards'
    },
    bld_guild: {
        ru: 'Гильдия',
        en: 'Guild'
    },
    bld_guild_desc: {
        ru: 'Объединение игроков',
        en: 'Player alliance'
    },
    bld_blessing_tower: {
        ru: 'Башня благословения',
        en: 'Blessing Tower'
    },
    bld_blessing_tower_desc: {
        ru: 'Временные бонусы',
        en: 'Temporary bonuses'
    },
    bld_arcane_lab: {
        ru: 'Лаборатория',
        en: 'Laboratory'
    },
    bld_arcane_lab_desc: {
        ru: 'Ускорение изучения',
        en: 'Research boost'
    },
    bld_time_generator: {
        ru: 'Генератор времени',
        en: 'Time Generator'
    },
    bld_time_generator_desc: {
        ru: 'Производство времени',
        en: 'Time production'
    },
    bld_arena: {
        ru: 'Арена',
        en: 'Arena'
    },
    bld_building: {
        ru: 'Здание',
        en: 'Building'
    },
    bld_building_desc: {
        ru: 'Описание здания',
        en: 'Building description'
    },
    bld_not_built: {
        ru: 'Не построено',
        en: 'Not built'
    },
    bld_max_level: {
        ru: 'Макс. уровень',
        en: 'Max level'
    },
    bld_build: {
        ru: 'Построить',
        en: 'Build'
    },
    bld_upgrade: {
        ru: 'Улучшить',
        en: 'Upgrade'
    },
    bld_speed_up: {
        ru: 'Ускорить',
        en: 'Speed up'
    },
    bld_building_status: {
        ru: '🔨 Строится',
        en: '🔨 Building'
    },
    bld_upgrading_status: {
        ru: '⚙️ Улучшается',
        en: '⚙️ Upgrading'
    },
    bld_upgrade_label: {
        ru: 'Улучшение',
        en: 'Upgrade'
    },
    bld_time_build: {
        ru: 'Время строительства:',
        en: 'Build time:'
    },
    bld_time_upgrade: {
        ru: 'Время улучшения:',
        en: 'Upgrade time:'
    },
    bld_new_bonus: {
        ru: 'Новый бонус:',
        en: 'New bonus:'
    },
    bld_what_gives: {
        ru: 'Что даст:',
        en: 'Benefits:'
    },
    bld_confirm_build: {
        ru: '✅ Построить',
        en: '✅ Build'
    },
    bld_confirm_upgrade: {
        ru: '⚙️ Улучшить',
        en: '⚙️ Upgrade'
    },
    bld_built_notif: {
        ru: '✅ Здание построено!',
        en: '✅ Building constructed!'
    },
    bld_fallback_error: {
        ru: 'Не удалось загрузить интерфейс',
        en: 'Failed to load interface'
    },

    // Building click fallback descriptions
    bld_library_click_desc: {
        ru: 'Здесь можно изучать новые заклинания',
        en: 'Learn new spells here'
    },
    bld_wizard_tower_click_desc: {
        ru: 'Здесь можно нанимать новых магов',
        en: 'Hire new wizards here'
    },
    bld_arena_click_desc: {
        ru: 'Место для PvP сражений',
        en: 'PvP battle arena'
    },
    bld_guild_click_desc: {
        ru: 'Объединение игроков для бонусов',
        en: 'Player alliance for bonuses'
    },
    bld_blessing_click_desc: {
        ru: 'Временные бонусы для города',
        en: 'Temporary bonuses for the city'
    },
    bld_arcane_click_desc: {
        ru: 'Исследование новых технологий',
        en: 'Research new technologies'
    },

    // === KNOWLEDGE BOOK ===
    kb_title: {
        ru: '📖 Книга Знаний',
        en: '📖 Book of Knowledge'
    },

    // Category titles
    kb_cat_community: {
        ru: 'Сообщество',
        en: 'Community'
    },
    kb_cat_buildings: {
        ru: 'Здания',
        en: 'Buildings'
    },
    kb_cat_wizards: {
        ru: 'Маги',
        en: 'Wizards'
    },
    kb_cat_spells: {
        ru: 'Заклинания',
        en: 'Spells'
    },
    kb_cat_battle: {
        ru: 'Бой',
        en: 'Battle'
    },
    kb_cat_rewards: {
        ru: 'Награды',
        en: 'Rewards'
    },
    kb_cat_airdrop: {
        ru: 'Airdrop',
        en: 'Airdrop'
    },
    kb_cat_factions: {
        ru: 'Фракции',
        en: 'Factions'
    },
    kb_cat_faq: {
        ru: 'FAQ',
        en: 'FAQ'
    },

    // === SPELL LIBRARY ===
    lib_no_spell_data: {
        ru: 'Нет данных о заклинаниях',
        en: 'No spell data available'
    },
    lib_learning: {
        ru: '📖 Изучается...',
        en: '📖 Learning...'
    },
    lib_locked: {
        ru: '🔒 Заблокировано',
        en: '🔒 Locked'
    },
    lib_locked_req: {
        ru: 'Треб. Ур.5 предыдущего',
        en: 'Req. Lvl 5 of previous'
    },
    lib_not_learned: {
        ru: '🔒 Не изучено',
        en: '🔒 Not learned'
    },
    lib_learn: {
        ru: 'Изучить',
        en: 'Learn'
    },
    lib_upgrade_spell: {
        ru: 'Улучшить',
        en: 'Upgrade'
    },
    lib_max_level: {
        ru: '✅ Макс. Ур.5',
        en: '✅ Max Lvl 5'
    },
    lib_unavailable: {
        ru: '🔒 Недоступно',
        en: '🔒 Unavailable'
    },
    lib_description: {
        ru: '📋 Описание',
        en: '📋 Description'
    },
    lib_school: {
        ru: 'Школа',
        en: 'School'
    },
    lib_tier: {
        ru: 'Тир',
        en: 'Tier'
    },
    lib_type: {
        ru: 'Тип',
        en: 'Type'
    },
    lib_type_single: {
        ru: 'Одна цель',
        en: 'Single target'
    },
    lib_type_aoe: {
        ru: 'Область',
        en: 'Area'
    },
    lib_type_multi: {
        ru: 'Несколько целей',
        en: 'Multi target'
    },
    lib_base_damage: {
        ru: 'Базовый урон',
        en: 'Base damage'
    },
    lib_on_upgrade: {
        ru: '📈 При улучшении:',
        en: '📈 On upgrade:'
    },
    lib_damage_label: {
        ru: 'Урон',
        en: 'Damage'
    },
    lib_learn_btn: {
        ru: '📖 Изучить',
        en: '📖 Learn'
    },
    lib_upgrade_btn: {
        ru: '⬆️ Улучшить',
        en: '⬆️ Upgrade'
    },
    lib_type_single_icon: {
        ru: '🎯 Одна цель',
        en: '🎯 Single target'
    },
    lib_type_multi_icon: {
        ru: '🎯🎯 Несколько целей',
        en: '🎯🎯 Multi target'
    },
    lib_type_aoe_icon: {
        ru: '💥 Область',
        en: '💥 Area'
    },
    lib_damage_by_level: {
        ru: '⚔️ Урон по уровням:',
        en: '⚔️ Damage by level:'
    },
    lib_effects: {
        ru: '✨ Эффекты:',
        en: '✨ Effects:'
    },
    lib_learned_status: {
        ru: 'Изучено',
        en: 'Learned'
    },
    lib_not_learned_short: {
        ru: '✗ Не изучено',
        en: '✗ Not learned'
    },
    lib_lvl: {
        ru: 'Ур.',
        en: 'Lvl '
    },

    // === BATTLE UI ===
    btl_preparing: {
        ru: 'Подготовка к бою...',
        en: 'Preparing for battle...'
    },
    btl_battle_log: {
        ru: 'Лог боя',
        en: 'Battle Log'
    },
    btl_pause: {
        ru: 'Пауза',
        en: 'Pause'
    },
    btl_speed: {
        ru: 'Скорость',
        en: 'Speed'
    },
    btl_close: {
        ru: 'Закрыть',
        en: 'Close'
    },
    btl_battle_started: {
        ru: 'Бой начался...',
        en: 'Battle started...'
    },
    btl_player: {
        ru: 'Игрок',
        en: 'Player'
    },
    btl_opponent: {
        ru: 'Противник',
        en: 'Opponent'
    },
    btl_lvl: {
        ru: 'Ур.',
        en: 'Lvl '
    },
    btl_loading: {
        ru: 'Загрузка...',
        en: 'Loading...'
    },
    btl_not_set: {
        ru: 'Не установлена',
        en: 'Not set'
    },
    btl_weather_drought: {
        ru: 'Засуха',
        en: 'Drought'
    },
    btl_weather_ice_fog: {
        ru: 'Ледяной туман',
        en: 'Ice Fog'
    },
    btl_weather_sandstorm: {
        ru: 'Песчаная буря',
        en: 'Sandstorm'
    },
    btl_weather_storm: {
        ru: 'Шторм',
        en: 'Storm'
    },

    // === BATTLE RESULT ===
    btl_you_won: {
        ru: 'Вы выиграли!',
        en: 'You won!'
    },
    btl_you_lost: {
        ru: 'Вы проиграли!',
        en: 'You lost!'
    },
    btl_early_exit: {
        ru: 'Досрочный выход из боя',
        en: 'Early exit from battle'
    },
    btl_early_exit_desc: {
        ru: 'Бой был просчитан до конца автоматически. Результат соответствует реальному исходу сражения.',
        en: 'The battle was auto-simulated to the end. The result matches the actual outcome.'
    },
    btl_was: {
        ru: 'Было',
        en: 'Before'
    },
    btl_became: {
        ru: 'Стало',
        en: 'After'
    },
    btl_rating: {
        ru: 'Рейтинг',
        en: 'Rating'
    },
    btl_exp_gained: {
        ru: 'Опыт получен',
        en: 'Experience gained'
    },
    btl_wins: {
        ru: 'Побед',
        en: 'Wins'
    },
    btl_losses: {
        ru: 'Поражений',
        en: 'Losses'
    },
    btl_total_battles: {
        ru: 'Всего боёв',
        en: 'Total battles'
    },
    btl_new_fight: {
        ru: 'Новый бой',
        en: 'New fight'
    },
    btl_return: {
        ru: 'Вернуться',
        en: 'Return'
    },

    // === BATTLE SPEED ===
    btl_speed_up: {
        ru: 'Ускорить',
        en: 'Speed up'
    },
    btl_speed_down: {
        ru: 'Замедлить',
        en: 'Slow down'
    },
    btl_resume: {
        ru: 'Продолжить',
        en: 'Resume'
    },

    // === BATTLE ENERGY ===
    btl_attempts: {
        ru: 'Попытки',
        en: 'Attempts'
    },
    btl_hours: {
        ru: 'ч',
        en: 'h'
    },
    btl_minutes: {
        ru: 'м',
        en: 'm'
    },
    btl_no_energy: {
        ru: 'Недостаточно энергии для боя!',
        en: 'Not enough energy for battle!'
    },
    btl_max_fights_per_day: {
        ru: 'Вы можете провести максимум',
        en: 'You can have a maximum of'
    },
    btl_fights_per_day: {
        ru: 'боев в сутки.',
        en: 'fights per day.'
    },
    btl_next_attempt: {
        ru: 'Следующая попытка восстановится через',
        en: 'Next attempt restores in'
    },

    // === MAGIC SCHOOLS ===
    school_fire_name: { ru: 'Огонь', en: 'Fire' },
    school_fire_desc: { ru: 'Школа разрушительной магии огня. Специализируется на прямом уроне и поджогах.', en: 'School of destructive fire magic. Specializes in direct damage and burning.' },
    school_water_name: { ru: 'Вода', en: 'Water' },
    school_water_desc: { ru: 'Школа магии воды и льда. Замедляет и замораживает врагов.', en: 'School of water and ice magic. Slows and freezes enemies.' },
    school_wind_name: { ru: 'Ветер', en: 'Wind' },
    school_wind_desc: { ru: 'Школа магии воздуха и молний. Быстрые атаки и оглушение.', en: 'School of air and lightning magic. Fast attacks and stunning.' },
    school_earth_name: { ru: 'Земля', en: 'Earth' },
    school_earth_desc: { ru: 'Школа магии земли. Защита и мощные АоЕ атаки.', en: 'School of earth magic. Defense and powerful AoE attacks.' },
    school_nature_name: { ru: 'Природа', en: 'Nature' },
    school_nature_desc: { ru: 'Школа природной магии. Призыв существ и усиление союзников.', en: 'School of nature magic. Summoning creatures and buffing allies.' },
    school_poison_name: { ru: 'Яд', en: 'Poison' },
    school_poison_desc: { ru: 'Школа ядовитой магии. Урон по времени и ослабление врагов.', en: 'School of poison magic. Damage over time and weakening enemies.' },
    school_light_name: { ru: 'Свет', en: 'Light' },
    school_light_desc: { ru: 'Школа магии света. Баффы союзников, ослепление врагов и очищение.', en: 'School of light magic. Ally buffs, blinding enemies and purification.' },
    school_dark_name: { ru: 'Тьма', en: 'Dark' },
    school_dark_desc: { ru: 'Школа тёмной магии. Дебаффы врагов, снижение брони и урона.', en: 'School of dark magic. Enemy debuffs, armor and damage reduction.' },
    school_hybrid_name: { ru: 'Гибрид', en: 'Hybrid' },
    school_hybrid_desc: { ru: 'Комбинация разных школ магии. Уникальные эффекты.', en: 'Combination of different magic schools. Unique effects.' },
    school_necromant_name: { ru: 'Некромантия', en: 'Necromancy' },
    school_necromant_desc: { ru: 'Тёмное искусство поднятия мёртвых. Маги-некроманты получают на 10% меньше урона от всех школ кроме Света.', en: 'Dark art of raising the dead. Necromancers take 10% less damage from all schools except Light.' },

    // School strengths/weaknesses
    school_fire_str: { ru: 'Высокий урон, Эффекты горения', en: 'High damage, Burning effects' },
    school_fire_weak: { ru: 'Уязвима к воде', en: 'Vulnerable to water' },
    school_water_str: { ru: 'Контроль, Заморозка', en: 'Control, Freezing' },
    school_water_weak: { ru: 'Низкий урон', en: 'Low damage' },
    school_wind_str: { ru: 'Скорость, Оглушение', en: 'Speed, Stunning' },
    school_wind_weak: { ru: 'Средний урон', en: 'Medium damage' },
    school_earth_str: { ru: 'Защита, Площадной урон', en: 'Defense, Area damage' },
    school_earth_weak: { ru: 'Медленное применение', en: 'Slow casting' },
    school_nature_str: { ru: 'Призыв, Поддержка', en: 'Summoning, Support' },
    school_nature_weak: { ru: 'Зависит от существ', en: 'Depends on creatures' },
    school_poison_str: { ru: 'DoT эффекты, Дебаффы', en: 'DoT effects, Debuffs' },
    school_poison_weak: { ru: 'Медленный урон', en: 'Slow damage' },
    school_light_str: { ru: 'Баффы, Ослепление, Очищение', en: 'Buffs, Blinding, Purification' },
    school_light_weak: { ru: 'Мало прямого урона', en: 'Low direct damage' },
    school_dark_str: { ru: 'Дебаффы, Пробитие брони, Ослабление', en: 'Debuffs, Armor penetration, Weakening' },
    school_dark_weak: { ru: 'Мало прямого урона', en: 'Low direct damage' },
    school_hybrid_str: { ru: 'Универсальность, Уникальные эффекты', en: 'Versatility, Unique effects' },
    school_hybrid_weak: { ru: 'Сложность изучения', en: 'Difficult to learn' },
    school_necromant_str: { ru: 'Сопротивление урону, Призыв нежити', en: 'Damage resistance, Undead summoning' },
    school_necromant_weak: { ru: 'Уязвимость к Свету', en: 'Vulnerable to Light' },

    // === SPELLS: FIRE ===
    spell_spark_name: { ru: 'Искра', en: 'Spark' },
    spell_spark_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 10/12/15/20/30. Шанс поджечь врага. На 5 уровне: 50% шанс повторной атаки по случайной цели.',
        en: 'Deals damage to a single target. Damage by level: 10/12/15/20/30. Chance to ignite the enemy. At level 5: 50% chance of a follow-up attack on a random target.'
    },
    spell_firebolt_name: { ru: 'Огненная стрела', en: 'Firebolt' },
    spell_firebolt_desc: {
        ru: 'Выпускает несколько огненных стрел. Количество и урон: 2×7 (уровень 1), 2×9 (уровень 2), 3×8 (уровень 3), 3×10 (уровень 4), 5×8 (уровень 5). На 5 уровне: 20% шанс выпустить 3 дополнительные стрелы по 8 урона. Каждая стрела может поджечь цель.',
        en: 'Fires multiple fire arrows. Count and damage: 2×7 (level 1), 2×9 (level 2), 3×8 (level 3), 3×10 (level 4), 5×8 (level 5). At level 5: 20% chance to fire 3 additional arrows dealing 8 damage each. Each arrow can ignite the target.'
    },
    spell_fire_wall_name: { ru: 'Огненная стена', en: 'Fire Wall' },
    spell_fire_wall_desc: {
        ru: 'Создаёт стену огня, наносящую урон врагам, проходящим через неё. Урон по уровням: 10/11/12/14/15. Игнорирует препятствия и действует несколько ходов.',
        en: 'Creates a wall of fire that damages enemies passing through it. Damage by level: 10/11/12/14/15. Ignores obstacles and lasts multiple turns.'
    },
    spell_fireball_name: { ru: 'Огненный шар', en: 'Fireball' },
    spell_fireball_desc: {
        ru: 'Создаёт огненный шар, который взрывается перед целью. Урон по уровням: 20/30/40/50/50. Наносит урон по области 3×3 (уровни 1-4). На 5 уровне покрывает всю территорию врага (3 колонки × 5 рядов). Каждая цель может быть поджжена.',
        en: 'Creates a fireball that explodes near the target. Damage by level: 20/30/40/50/50. Deals area damage in 3×3 (levels 1-4). At level 5 covers the entire enemy territory (3 columns × 5 rows). Each target can be ignited.'
    },
    spell_fire_tsunami_name: { ru: 'Огненное цунами', en: 'Fire Tsunami' },
    spell_fire_tsunami_desc: {
        ru: 'Призывает волну огня, движущуюся по территории противника. Урон по уровням: 30/40/50/60/70. Наносит урон всем в текущей колонке каждый ход. На 5 уровне оставляет за собой горящую землю.',
        en: 'Summons a wave of fire moving across enemy territory. Damage by level: 30/40/50/60/70. Damages all in the current column each turn. At level 5 leaves burning ground behind.'
    },

    // === SPELLS: WATER ===
    spell_icicle_name: { ru: 'Ледышка', en: 'Icicle' },
    spell_icicle_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 10/15/20/25/30. Накладывает охлаждение (уровни 1-4) или заморозку/иней (уровень 5). Маги воды накладывают заморозку, другие — иней.',
        en: 'Deals damage to a single target. Damage by level: 10/15/20/25/30. Applies chill (levels 1-4) or freeze/frost (level 5). Water mages apply freeze, others apply frost.'
    },
    spell_frost_arrow_name: { ru: 'Ледяная стрела', en: 'Frost Arrow' },
    spell_frost_arrow_desc: {
        ru: 'Поражает основную цель и взрывается осколками. Урон основной цели: 15/20/25/30/35. Взрыв наносит 50% урона соседним позициям. Уровень 5: Заморозка/Иней. Уровни 1-4: Охлаждение (только маги воды).',
        en: 'Hits the main target and explodes into shards. Main target damage: 15/20/25/30/35. Explosion deals 50% damage to adjacent positions. Level 5: Freeze/Frost. Levels 1-4: Chill (water mages only).'
    },
    spell_ice_rain_name: { ru: 'Ледяной дождь', en: 'Ice Rain' },
    spell_ice_rain_desc: {
        ru: 'Обрушивает ледяной дождь. Урон: 6/7/8/9/10. Зона: 3 клетки (уровни 1-2), весь ряд (уровни 3-4), весь ряд дважды (уровень 5). Игнорирует препятствия. 50% шанс заморозки каждой цели.',
        en: 'Unleashes ice rain. Damage: 6/7/8/9/10. Area: 3 tiles (levels 1-2), full row (levels 3-4), full row twice (level 5). Ignores obstacles. 50% chance to freeze each target.'
    },
    spell_blizzard_name: { ru: 'Снежная буря', en: 'Blizzard' },
    spell_blizzard_desc: {
        ru: 'Создаёт зону холода на территории противника. Шанс прервать заклинание: 5%/6%/7%/8%/10% (по уровням). Радиус: 3 клетки (уровни 1-3), вся линия магов (уровни 4-5). На 5 уровне дополнительно накладывает иней или заморозку.',
        en: 'Creates a cold zone on enemy territory. Spell interrupt chance: 5%/6%/7%/8%/10% (by level). Radius: 3 tiles (levels 1-3), full mage line (levels 4-5). At level 5 also applies frost or freeze.'
    },
    spell_absolute_zero_name: { ru: 'Абсолютный Ноль', en: 'Absolute Zero' },
    spell_absolute_zero_desc: {
        ru: 'Покрывает всю территорию врага ледяным морозом с начала боя. Каждый, кто начинает ход в зоне, получает урон и шанс прерывания заклинания. Пассивное заклинание — активируется автоматически.',
        en: 'Covers the entire enemy territory with frost from the start of battle. Anyone starting a turn in the zone takes damage and has a chance of spell interruption. Passive spell — activates automatically.'
    },

    // === SPELLS: WIND ===
    spell_gust_name: { ru: 'Порыв', en: 'Gust' },
    spell_gust_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 8/12/16/20/25. На 5 уровне: 50% шанс критического удара (×1.5 урона).',
        en: 'Deals damage to a single target. Damage by level: 8/12/16/20/25. At level 5: 50% chance of critical hit (×1.5 damage).'
    },
    spell_wind_blade_name: { ru: 'Ветрорез', en: 'Wind Blade' },
    spell_wind_blade_desc: {
        ru: 'Запускает лезвие ветра, проходящее через ряд. Урон по уровням: 5/6/7/8/10. Игнорирует препятствия. На 5 уровне: делает 2 круга вместо 1.',
        en: 'Launches a wind blade that passes through a row. Damage by level: 5/6/7/8/10. Ignores obstacles. At level 5: makes 2 passes instead of 1.'
    },
    spell_wind_wall_name: { ru: 'Ветряная стена', en: 'Wind Wall' },
    spell_wind_wall_desc: {
        ru: 'Создаёт стену, ослабляющую урон проходящих через неё заклинаний. Ослабление: 10%/15%/20%/25%/30% (по уровням). Размер стены: 1 клетка (уровни 1-2), 3 клетки (уровни 3-4), 5 клеток (уровень 5).',
        en: 'Creates a wall that weakens spells passing through it. Reduction: 10%/15%/20%/25%/30% (by level). Wall size: 1 tile (levels 1-2), 3 tiles (levels 3-4), 5 tiles (level 5).'
    },
    spell_storm_cloud_name: { ru: 'Грозовая туча', en: 'Storm Cloud' },
    spell_storm_cloud_desc: {
        ru: 'Обрушивает удары молний на случайные клетки территории противника. Количество ударов: 5/6/7/8/9 (по уровням). Урон: 15/20/25/30/30. На 5 уровне: 5% шанс оглушить цель на 1 ход.',
        en: 'Strikes random tiles on enemy territory with lightning. Number of strikes: 5/6/7/8/9 (by level). Damage: 15/20/25/30/30. At level 5: 5% chance to stun target for 1 turn.'
    },
    spell_ball_lightning_name: { ru: 'Шаровая молния', en: 'Ball Lightning' },
    spell_ball_lightning_desc: {
        ru: 'Создаёт шаровую молнию, которая поражает все цели по цепочке. Урон: 30/35/40/50/50 (по уровням). Снижение урона с каждым ударом: 20% (уровни 1-4), 10% (уровень 5). На 5 уровне: 5% шанс оглушения на 1 ход.',
        en: 'Creates ball lightning that chains through all targets. Damage: 30/35/40/50/50 (by level). Damage reduction per hit: 20% (levels 1-4), 10% (level 5). At level 5: 5% chance to stun for 1 turn.'
    },

    // === SPELLS: EARTH ===
    spell_pebble_name: { ru: 'Камешек', en: 'Pebble' },
    spell_pebble_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 10/12/15/20/30. Шанс игнорировать броню. На 5 уровне: 50% шанс бросить второй камешек по случайной цели.',
        en: 'Deals damage to a single target. Damage by level: 10/12/15/20/30. Chance to ignore armor. At level 5: 50% chance to throw a second pebble at a random target.'
    },
    spell_stone_spike_name: { ru: 'Каменный шип', en: 'Stone Spike' },
    spell_stone_spike_desc: {
        ru: 'Выпускает шипы во все стороны от цели. Урон за шип: 4/5/7/9/13 (по уровням). Количество шипов: 4 (уровни 1-4), 7 (уровень 5). Может повредить стены.',
        en: 'Shoots spikes in all directions from the target. Damage per spike: 4/5/7/9/13 (by level). Number of spikes: 4 (levels 1-4), 7 (level 5). Can damage walls.'
    },
    spell_earth_wall_name: { ru: 'Земляная стена', en: 'Earth Wall' },
    spell_earth_wall_desc: {
        ru: 'Создаёт прочную стену с высоким HP. HP стены: 20/30/40/50/60 (по уровням). Размер: 1 клетка (уровни 1-2), 3 клетки (уровни 3-4), 5 клеток (уровень 5). Блокирует передвижение и заклинания.',
        en: 'Creates a sturdy wall with high HP. Wall HP: 20/30/40/50/60 (by level). Size: 1 tile (levels 1-2), 3 tiles (levels 3-4), 5 tiles (level 5). Blocks movement and spells.'
    },
    spell_stone_grotto_name: { ru: 'Каменный грот', en: 'Stone Grotto' },
    spell_stone_grotto_desc: {
        ru: 'Создаёт защитное укрытие вокруг союзных магов. Бонус брони: 10%/15%/15%/20%/20% (по уровням). Снижение исходящего урона от заклинаний: 5%/5%/10%/10%/10%. Цели: только кастер (уровни 1-2), кастер+соседи (уровни 3-4), все союзники (уровень 5).',
        en: 'Creates a protective shelter around allied mages. Armor bonus: 10%/15%/15%/20%/20% (by level). Outgoing spell damage reduction: 5%/5%/10%/10%/10%. Targets: caster only (levels 1-2), caster+neighbors (levels 3-4), all allies (level 5).'
    },
    spell_meteor_shower_name: { ru: 'Метеоритный дождь', en: 'Meteor Shower' },
    spell_meteor_shower_desc: {
        ru: 'Обрушивает метеориты на случайные цели. Количество метеоритов: 1/2/3/4/5 (по уровням). Урон метеорита: 30/40/50/60/70. На 5 уровне: игнорирует 50% брони (70% для магов земли).',
        en: 'Rains meteors on random targets. Number of meteors: 1/2/3/4/5 (by level). Meteor damage: 30/40/50/60/70. At level 5: ignores 50% armor (70% for earth mages).'
    },

    // === SPELLS: NATURE ===
    spell_call_wolf_name: { ru: 'Зов волка', en: 'Call Wolf' },
    spell_call_wolf_desc: {
        ru: 'Призывает волка для атаки врагов. Волк действует самостоятельно каждый ход. HP: 10/12/15/18/20. Урон: 10/12/14/16/16. На 5 уровне: волк наносит 80% урона соседним целям.',
        en: 'Summons a wolf to attack enemies. The wolf acts independently each turn. HP: 10/12/15/18/20. Damage: 10/12/14/16/16. At level 5: wolf deals 80% damage to adjacent targets.'
    },
    spell_bark_armor_name: { ru: 'Древесная кора', en: 'Bark Armor' },
    spell_bark_armor_desc: {
        ru: 'Покрывает кастера защитной корой. Бонус брони по уровням: 5/10/15/20/30. Можно повторно использовать для обновления бонуса.',
        en: 'Covers the caster with protective bark. Armor bonus by level: 5/10/15/20/30. Can be recast to refresh the bonus.'
    },
    spell_leaf_canopy_name: { ru: 'Покров листвы', en: 'Leaf Canopy' },
    spell_leaf_canopy_desc: {
        ru: 'Создаёт защитный купол из листьев. Ослабляет входящий магический урон. Пассивное заклинание — активируется автоматически с начала боя.',
        en: 'Creates a protective dome of leaves. Reduces incoming magical damage. Passive spell — activates automatically at the start of battle.'
    },
    spell_ent_name: { ru: 'Энт', en: 'Ent' },
    spell_ent_desc: {
        ru: 'Призывает древнего энта. Связывает жизненную силу с магами: кастер + 0/1/2/3/4 дополнительных союзников (по уровням). Энт защищает связанных магов, поглощая урон за них, и исцеляет самого слабого союзника.',
        en: 'Summons an ancient ent. Links life force with mages: caster + 0/1/2/3/4 additional allies (by level). The ent protects linked mages by absorbing damage for them, and heals the weakest ally.'
    },
    spell_meteorokinesis_name: { ru: 'Метеокинез', en: 'Meteorokinesis' },
    spell_meteorokinesis_desc: {
        ru: 'Контролирует погоду. Бонус к стихийным заклинаниям союзников природы: 5%/10%/15%/15%/15% (по уровням). Уровни 4-5: отключает погоду для врага. Длительность: 2 хода (уровень 4), до конца боя (уровень 5).',
        en: 'Controls the weather. Bonus to elemental spells for nature allies: 5%/10%/15%/15%/15% (by level). Levels 4-5: disables weather for the enemy. Duration: 2 turns (level 4), until end of battle (level 5).'
    },

    // === SPELLS: POISON ===
    spell_poisoned_blade_name: { ru: 'Отравленный клинок', en: 'Poisoned Blade' },
    spell_poisoned_blade_desc: {
        ru: 'Метает отравленное лезвие. Наносит урон (7-10) и имеет шанс отравить цель. Шанс яда растет с уровнем: 20%/30%/40%/50%/100%. На 5 уровне яд гарантирован! Яд наносит 5 урона за стак в начале хода.',
        en: 'Throws a poisoned blade. Deals damage (7-10) with a chance to poison the target. Poison chance increases with level: 20%/30%/40%/50%/100%. At level 5 poison is guaranteed! Poison deals 5 damage per stack at the start of each turn.'
    },
    spell_poisoned_glade_name: { ru: 'Ядовитая поляна', en: 'Poison Glade' },
    spell_poisoned_glade_desc: {
        ru: 'Создаёт ядовитые поляны на случайных позициях врага. Урон по уровням: 10/12/12/15/15. Количество атакуемых позиций: 1 (уровень 1-2), 2 (уровень 3-4), 3 (уровень 5). Каждая пораженная цель получает яд (1 стак).',
        en: 'Creates poison glades at random enemy positions. Damage by level: 10/12/12/15/15. Number of positions: 1 (levels 1-2), 2 (levels 3-4), 3 (level 5). Each affected target gets poisoned (1 stack).'
    },
    spell_foul_cloud_name: { ru: 'Мерзкое облако', en: 'Foul Cloud' },
    spell_foul_cloud_desc: {
        ru: 'Выпускает ядовитое облако по целым колонкам врага. Урон: 30/40/50 (на уровнях 1/3/5). Количество колонок: 1 (уровень 1-2), 2 (уровень 3-4), 3 (уровень 5). Отравляет всех магов в пораженных колонках (1 стак яда).',
        en: 'Releases a poisonous cloud across entire enemy columns. Damage: 30/40/50 (at levels 1/3/5). Number of columns: 1 (levels 1-2), 2 (levels 3-4), 3 (level 5). Poisons all mages in affected columns (1 poison stack).'
    },
    spell_plague_name: { ru: 'Чума', en: 'Plague' },
    spell_plague_desc: {
        ru: 'Заражает случайные цели смертельной болезнью. Количество целей равно уровню заклинания (1-5). Снижает эффективность лечения на 70% на 1 ход. На 5 уровне дополнительно накладывает 1 стак яда на каждую цель.',
        en: 'Infects random targets with a deadly disease. Number of targets equals spell level (1-5). Reduces healing effectiveness by 70% for 1 turn. At level 5 additionally applies 1 poison stack to each target.'
    },
    spell_epidemic_name: { ru: 'Эпидемия', en: 'Epidemic' },
    spell_epidemic_desc: {
        ru: 'Вызывает массовую эпидемию. Поражает ВСЕХ вражеских магов. Урон по уровням: 10/15/20/25/25. Каждая цель имеет 50% шанс получить 1 стак яда. На 5 уровне случайная отравленная цель получает бонусный урон (количество_стаков_яда × 10).',
        en: 'Triggers a mass epidemic. Hits ALL enemy mages. Damage by level: 10/15/20/25/25. Each target has a 50% chance to get 1 poison stack. At level 5 a random poisoned target takes bonus damage (poison_stacks × 10).'
    },

    // === SPELLS: LIGHT ===
    spell_flash_name: { ru: 'Вспышка', en: 'Flash' },
    spell_flash_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 10/12/15/20/30. Остаточный урон пробивает сквозь саммонов к магу. На 5 уровне: ×3 урон по призванным существам.',
        en: 'Deals damage to a single target. Damage by level: 10/12/15/20/30. Residual damage pierces through summons to the mage. At level 5: ×3 damage to summoned creatures.'
    },
    spell_light_beam_name: { ru: 'Луч света', en: 'Light Beam' },
    spell_light_beam_desc: {
        ru: 'Канализируемый луч, проходящий через все слои защиты (стена → саммон → маг). Базовый урон: 10/12/14/16/16. Урон нарастает каждый ход (+1/+2/+3/+4/+4). Разогрев сбрасывается только при смерти цели или оглушении кастера. На 5 уровне: второй луч по случайной цели.',
        en: 'Channeled beam that pierces all defense layers (wall → summon → mage). Base damage: 10/12/14/16/16. Damage ramps up each turn (+1/+2/+3/+4/+4). Ramp resets only on target death or caster stun. At level 5: second beam on a random target.'
    },
    spell_rainbow_shield_name: { ru: 'Радужный щит', en: 'Rainbow Shield' },
    spell_rainbow_shield_desc: {
        ru: 'Пассивное заклинание — активируется автоматически в начале боя. Снижает урон от стихий (огонь, вода, земля, ветер): 10%/15%/20%/25%/30% (по уровням). Цели: только кастер (уровни 1-2), кастер и соседи (уровни 3-4), все союзники (уровень 5).',
        en: 'Passive spell — activates automatically at the start of battle. Reduces elemental damage (fire, water, earth, wind): 10%/15%/20%/25%/30% (by level). Targets: caster only (levels 1-2), caster and neighbors (levels 3-4), all allies (level 5).'
    },
    spell_sun_radiance_name: { ru: 'Сияние солнца', en: 'Sun Radiance' },
    spell_sun_radiance_desc: {
        ru: 'Ослепляет всех вражеских магов на 1 ход. Ослеплённые маги имеют шанс промахнуться боевым заклинанием (удар по случайной клетке): 10%/12%/14%/16%/20% (по уровням). Действует на заклинания с выбором цели.',
        en: 'Blinds all enemy mages for 1 turn. Blinded mages have a chance to miss with combat spells (hitting a random tile): 10%/12%/14%/16%/20% (by level). Affects targeted spells.'
    },
    spell_dawn_name: { ru: 'Рассвет', en: 'Dawn' },
    spell_dawn_desc: {
        ru: 'Пассивное заклинание — активируется автоматически в начале боя. Усиливает всех союзников: +10%/+20%/+30%/+40%/+60% к максимальному HP и +5%/+10%/+15%/+20%/+30% к урону заклинаний (по уровням).',
        en: 'Passive spell — activates automatically at the start of battle. Empowers all allies: +10%/+20%/+30%/+40%/+60% max HP and +5%/+10%/+15%/+20%/+30% spell damage (by level).'
    },

    // === SPELLS: DARK ===
    spell_dark_clot_name: { ru: 'Сгусток тьмы', en: 'Dark Clot' },
    spell_dark_clot_desc: {
        ru: 'Наносит урон одной цели. Урон по уровням: 15/20/25/30/40. На 5 уровне: 50% шанс снять 5 брони с цели.',
        en: 'Deals damage to a single target. Damage by level: 15/20/25/30/40. At level 5: 50% chance to strip 5 armor from the target.'
    },
    spell_weakness_name: { ru: 'Слабость', en: 'Weakness' },
    spell_weakness_desc: {
        ru: 'Накладывает дебафф на цель, снижая урон её заклинаний на 1 ход. Снижение урона: 10%/15%/20%/25%/35% (по уровням). Сопротивление тьме уменьшает эффект.',
        en: 'Debuffs the target, reducing its spell damage for 1 turn. Damage reduction: 10%/15%/20%/25%/35% (by level). Dark resistance reduces the effect.'
    },
    spell_miasma_name: { ru: 'Миазма', en: 'Miasma' },
    spell_miasma_desc: {
        ru: 'Пассивное заклинание — активируется автоматически в начале боя. Союзники получают защиту от яда (-% урона от стаков), враги — усиленный урон от яда (+% урона от стаков). Модификатор: 10%/20%/30%/40%/50% (по уровням).',
        en: 'Passive spell — activates automatically at the start of battle. Allies gain poison protection (-% poison stack damage), enemies take increased poison damage (+% poison stack damage). Modifier: 10%/20%/30%/40%/50% (by level).'
    },
    spell_shadow_realm_name: { ru: 'Мир теней', en: 'Shadow Realm' },
    spell_shadow_realm_desc: {
        ru: 'Наносит урон самым раненым врагам. Урон равен 20% от потерянного HP цели (макс. 200). Количество целей равно уровню заклинания (1-5). Приоритет: враги с наибольшим % потерянного здоровья.',
        en: 'Deals damage to the most wounded enemies. Damage equals 20% of the target\'s lost HP (max 200). Number of targets equals spell level (1-5). Priority: enemies with the highest % of lost health.'
    },
    spell_fading_name: { ru: 'Угасание', en: 'Fading' },
    spell_fading_desc: {
        ru: 'Перманентно снижает урон и броню всех врагов. Снижение: 3%/5%/7%/10%/10% (по уровням). Эффект накапливается каждый ход. На 5 уровне: 20% шанс повторного срабатывания.',
        en: 'Permanently reduces damage and armor of all enemies. Reduction: 3%/5%/7%/10%/10% (by level). Effect stacks each turn. At level 5: 20% chance to trigger twice.'
    },

    // === SPELLS: NECROMANCY ===
    spell_summon_skeleton_name: { ru: 'Призыв скелета', en: 'Summon Skeleton' },
    spell_summon_skeleton_desc: {
        ru: 'Призывает скелета для атаки врагов. Скелет действует самостоятельно каждый ход. HP/Урон по уровням: 5/15, 6/18, 7/21, 8/24, 10/24. На 5 уровне: 50% шанс пробить 50% брони цели.',
        en: 'Summons a skeleton to attack enemies. The skeleton acts independently each turn. HP/Damage by level: 5/15, 6/18, 7/21, 8/24, 10/24. At level 5: 50% chance to pierce 50% of target armor.'
    },
    spell_bone_spear_name: { ru: 'Костяное копьё', en: 'Bone Spear' },
    spell_bone_spear_desc: {
        ru: 'Метает костяное копьё, пронзающее всех врагов в ряду насквозь (стены, призванных существ, магов). Урон по уровням: 10/13/16/20/24. На 5 уровне: игнорирует 50% брони.',
        en: 'Hurls a bone spear that pierces through all enemies in a row (walls, summons, mages). Damage by level: 10/13/16/20/24. At level 5: ignores 50% armor.'
    },
    spell_death_shroud_name: { ru: 'Покров смерти', en: 'Death Shroud' },
    spell_death_shroud_desc: {
        ru: 'Окутывает мага покровом нежити. Снижает урон от Тьмы и Яда на 15/20/25/30/40%. Но увеличивает урон от Света на 5/10/15/20/25%. Применяется в начале боя.',
        en: 'Wraps the mage in an undead shroud. Reduces Dark and Poison damage by 15/20/25/30/40%. But increases Light damage taken by 5/10/15/20/25%. Applied at the start of battle.'
    },
    spell_bone_cage_name: { ru: 'Костяная клетка', en: 'Bone Cage' },
    spell_bone_cage_desc: {
        ru: 'Заключает вражеского мага в костяную клетку. HP клетки: 30/35/40/45/50. Single target заклинания захваченного мага сначала бьют клетку, остаток урона летит в цель. AOE игнорирует клетку. Клетка восстанавливается каждый ход некроманта. На 5 ур: каждый каст наносит магу урон = макс HP клетки.',
        en: 'Traps an enemy mage in a bone cage. Cage HP: 30/35/40/45/50. Single target spells from the trapped mage hit the cage first, remaining damage goes to the target. AoE ignores the cage. Cage regenerates each necromancer turn. At level 5: each cast deals damage to the mage equal to cage max HP.'
    },
    spell_bone_dragon_name: { ru: 'Костяной Дракон', en: 'Bone Dragon' },
    spell_bone_dragon_desc: {
        ru: 'Призывает Костяного Дракона в начале боя. HP дракона: 50/60/70/80/100% от HP мага. Урон: 50/60/70/80/100. Дракон не восстанавливает жизни. На 5 ур: снижает броню всех врагов на 20 пока жив.',
        en: 'Summons a Bone Dragon at the start of battle. Dragon HP: 50/60/70/80/100% of mage HP. Damage: 50/60/70/80/100. Dragon does not regenerate health. At level 5: reduces all enemies\' armor by 20 while alive.'
    },

    // === GUILD MODAL ===
    guild_title: { ru: 'Гильдия', en: 'Guild' },
    guild_create_btn: { ru: 'Создать гильдию', en: 'Create Guild' },
    guild_find_btn: { ru: 'Найти гильдию', en: 'Find Guild' },
    guild_not_member: { ru: 'Вы не состоите в гильдии', en: 'You are not in a guild' },
    guild_create_or_join: { ru: 'Создайте свою или вступите в существующую', en: 'Create your own or join an existing one' },
    guild_create_form_title: { ru: 'Создание гильдии', en: 'Create Guild' },
    guild_name_label: { ru: 'Название гильдии', en: 'Guild Name' },
    guild_name_placeholder: { ru: 'Введите название...', en: 'Enter name...' },
    guild_name_hint: { ru: 'От 3 до 50 символов', en: '3 to 50 characters' },
    guild_tag_label: { ru: 'Тег гильдии', en: 'Guild Tag' },
    guild_tag_hint: { ru: 'От 2 до 5 символов (отображается как [TAG])', en: '2 to 5 characters (displayed as [TAG])' },
    guild_create_submit: { ru: 'Создать', en: 'Create' },
    guild_fill_all_fields: { ru: 'Заполните все поля', en: 'Fill in all fields' },
    guild_system_not_loaded: { ru: 'Система гильдий не загружена', en: 'Guild system not loaded' },
    guild_created: { ru: 'Гильдия создана!', en: 'Guild created!' },
    guild_search_title: { ru: 'Поиск гильдий', en: 'Search Guilds' },
    guild_search_placeholder: { ru: 'Поиск по названию или тегу...', en: 'Search by name or tag...' },
    guild_search_find: { ru: 'Найти', en: 'Find' },
    guild_search_hint: { ru: 'Введите запрос для поиска', en: 'Enter a search query' },
    guild_loading: { ru: 'Загрузка...', en: 'Loading...' },
    guild_not_found: { ru: 'Гильдии не найдены', en: 'No guilds found' },
    guild_level: { ru: 'Уровень', en: 'Level' },
    guild_members_count: { ru: 'участников', en: 'members' },
    guild_join_btn: { ru: 'Вступить', en: 'Join' },
    guild_exp: { ru: 'Опыт', en: 'Experience' },
    guild_tab_info: { ru: 'Инфо', en: 'Info' },
    guild_tab_members: { ru: 'Участники', en: 'Members' },
    guild_tab_research: { ru: 'Исслед.', en: 'Research' },
    guild_bonuses_title: { ru: 'Бонусы гильдии', en: 'Guild Bonuses' },
    guild_hp: { ru: 'Здоровье', en: 'Health' },
    guild_damage: { ru: 'Урон', en: 'Damage' },
    guild_resistances: { ru: 'Сопротивления', en: 'Resistances' },
    guild_capacity: { ru: 'Вместимость', en: 'Capacity' },
    guild_join_mode: { ru: 'Режим вступления', en: 'Join Mode' },
    guild_join_mode_free: { ru: 'Свободный', en: 'Open' },
    guild_join_mode_request: { ru: 'По заявке', en: 'By Request' },
    guild_research_points: { ru: 'Очков исследований', en: 'Research Points' },
    guild_loading_rating: { ru: 'Загрузка рейтинга...', en: 'Loading rankings...' },
    guild_top_title: { ru: '🏆 Топ гильдий', en: '🏆 Top Guilds' },
    guild_yours: { ru: 'ваша', en: 'yours' },
    guild_exp_unit: { ru: 'опыта', en: 'exp' },
    guild_your_guild: { ru: 'Ваша гильдия', en: 'Your Guild' },
    guild_rank_position: { ru: 'место', en: 'place' },
    guild_load_rating_error: { ru: '❌ Ошибка загрузки рейтинга', en: '❌ Failed to load rankings' },
    guild_members_title: { ru: 'Участники', en: 'Members' },
    guild_member_lvl: { ru: 'Ур.', en: 'Lv.' },
    guild_member_rating: { ru: 'Рейтинг', en: 'Rating' },
    guild_contribution: { ru: 'вклад', en: 'contribution' },
    guild_transfer_leadership: { ru: 'Передать лидерство', en: 'Transfer Leadership' },
    guild_kick_member: { ru: 'Исключить', en: 'Kick' },
    guild_kick_confirm: { ru: 'Исключить {name} из гильдии?', en: 'Kick {name} from the guild?' },
    guild_transfer_confirm: { ru: 'Передать лидерство {name}? Это действие нельзя отменить.', en: 'Transfer leadership to {name}? This cannot be undone.' },
    guild_leadership_transferred: { ru: 'Лидерство передано', en: 'Leadership transferred' },
    guild_leadership_transfer_error: { ru: 'Ошибка передачи лидерства', en: 'Leadership transfer failed' },
    guild_research_title: { ru: 'Исследования', en: 'Research' },
    guild_research_points_label: { ru: 'Очков', en: 'Points' },
    guild_research_desc: { ru: 'Каждое очко даёт +0.5% сопротивления к выбранной школе магии.', en: 'Each point gives +0.5% resistance to the chosen magic school.' },
    guild_research_leader_only: { ru: 'Только глава гильдии может распределять очки.', en: 'Only the guild leader can allocate points.' },
    guild_research_applied: { ru: '+0.5% сопротивления к {school}', en: '+0.5% resistance to {school}' },
    guild_settings_title: { ru: 'Настройки гильдии', en: 'Guild Settings' },
    guild_requests_title: { ru: 'Заявки', en: 'Requests' },
    guild_accept: { ru: 'Принять', en: 'Accept' },
    guild_decline: { ru: 'Отклонить', en: 'Decline' },
    guild_leave_btn: { ru: '🚪 Покинуть гильдию', en: '🚪 Leave Guild' },
    guild_mode_changed: { ru: 'Режим изменён', en: 'Mode changed' },
    guild_request_accepted: { ru: 'Игрок принят', en: 'Player accepted' },
    guild_request_declined: { ru: 'Заявка отклонена', en: 'Request declined' },
    guild_leave_leader_confirm: { ru: 'Вы глава гильдии. При выходе лидерство перейдёт к самому активному участнику. Выйти?', en: 'You are the guild leader. Leadership will transfer to the most active member. Leave?' },
    guild_leave_confirm: { ru: 'Вы уверены что хотите покинуть гильдию?', en: 'Are you sure you want to leave the guild?' },
    guild_left: { ru: 'Вы вышли из гильдии', en: 'You left the guild' },
    guild_back: { ru: '← Назад', en: '← Back' },

    // === BUILDINGS ===
    bld_arena_required: { ru: '⚠️ Постройте Арену чтобы участвовать в PvP боях!', en: '⚠️ Build the Arena to participate in PvP battles!' },
    bld_arena_title: { ru: '⚔️ PvP Арена', en: '⚔️ PvP Arena' },
    bld_arena_welcome: { ru: 'Добро пожаловать на арену! Здесь вы можете сражаться с другими магами.', en: 'Welcome to the arena! Here you can battle other mages.' },
    bld_setup_formation: { ru: '🎯 Расставить войска', en: '🎯 Set Formation' },
    bld_battle_pvp: { ru: '⚔️ В бой (PvP) 🔒', en: '⚔️ Battle (PvP) 🔒' },
    bld_leaderboard: { ru: '🏆 Рейтинг', en: '🏆 Leaderboard' },
    bld_adventure_pve: { ru: '🗺️ Приключения (PvE)', en: '🗺️ Adventures (PvE)' },
    bld_arena_required_msg: { ru: '⚠️ Постройте Арену для PvP боёв', en: '⚠️ Build the Arena for PvP battles' },
    bld_wizard_limit: { ru: 'Достигнут лимит магов!', en: 'Wizard limit reached!' },
    bld_wizard_tower_required: { ru: '⚠️ Для найма {n}-го мага требуется башня магов {req} уровня! (сейчас: {cur})', en: '⚠️ Hiring wizard #{n} requires Wizard Tower level {req}! (current: {cur})' },
    bld_hire_in_progress: { ru: '⚠️ Уже идет найм другого мага!', en: '⚠️ Another wizard is already being hired!' },
    bld_hire_started: { ru: '🧙‍♂️ Начат найм мага', en: '🧙‍♂️ Wizard hiring started' },
    bld_hire_failed: { ru: '❌ Не удалось начать найм', en: '❌ Failed to start hiring' },
    bld_hire_system_error: { ru: '❌ Ошибка системы найма', en: '❌ Hiring system error' },
    bld_cannot_build_upgrading: { ru: '⚠️ Нельзя строить пока идет улучшение!', en: '⚠️ Cannot build while upgrading!' },
    bld_one_at_time: { ru: '⚠️ Можно строить только одно здание одновременно!', en: '⚠️ Can only build one building at a time!' },
    bld_user_id_error: { ru: '❌ Ошибка: Не удалось получить ID пользователя.', en: '❌ Error: Failed to get user ID.' },
    bld_construction_started: { ru: '🔨 Начато строительство', en: '🔨 Construction started' },
    bld_network_error: { ru: '❌ Ошибка сети при попытке построить здание.', en: '❌ Network error while building.' },
    bld_upgrade_in_progress: { ru: '⚠️ Уже идет улучшение другого здания!', en: '⚠️ Another building is already being upgraded!' },
    bld_cannot_upgrade_building: { ru: '⚠️ Нельзя улучшать пока идет строительство!', en: '⚠️ Cannot upgrade while building!' },
    bld_upgrade_started: { ru: '🔨 Начато улучшение до уровня', en: '🔨 Upgrade started to level' },
    bld_level_already_reached: { ru: '❌ Уровень уже достигнут или выше!', en: '❌ Level already reached or higher!' },
    bld_upgrade_network_error: { ru: '❌ Ошибка сети при улучшении здания.', en: '❌ Network error while upgrading.' },
    bld_tower_max_level: { ru: '⚠️ Башня магов уже максимального уровня', en: '⚠️ Wizard Tower is already at max level' },
    bld_guild_loading: { ru: 'Система гильдий загружается...', en: 'Guild system is loading...' },
    bld_already_building: { ru: '⚠️ Уже идёт строительство другого здания!', en: '⚠️ Another building is already under construction!' },
    bld_setup_troops: { ru: '⚠️ Расставь войска и выбери заклинания!', en: '⚠️ Set up troops and choose spells!' },
    bld_battle_attempts: { ru: '⚡ Попытки боев', en: '⚡ Battle Attempts' },
    bld_regen_hours: { ru: 'след. через', en: 'next in' },
    bld_regen_info: { ru: 'Каждые 2 часа восстанавливается 1 попытка', en: '1 attempt regenerates every 2 hours' },
};

/**
 * Текущий язык ('ru' или 'en')
 */
let currentLang = 'ru';

/**
 * Определение языка при загрузке
 * Приоритет: localStorage > Telegram language_code > 'ru'
 */
function detectLanguage() {
    // 1. Сохранённый выбор пользователя
    try {
        const saved = localStorage.getItem('game_lang');
        if (saved === 'ru' || saved === 'en') {
            return saved;
        }
    } catch (e) {}

    // 2. Язык из Telegram
    try {
        const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
        if (tgLang && !tgLang.startsWith('ru')) {
            return 'en';
        }
    } catch (e) {}

    // 3. По умолчанию — русский
    return 'ru';
}

/**
 * Инициализация системы локализации
 */
function initI18n() {
    currentLang = detectLanguage();
    window.LANG = currentLang;
    console.log(`🌐 Язык / Language: ${currentLang}`);
}

/**
 * Получить перевод по ключу
 * @param {string} key - ключ из STRINGS
 * @param {string} [fallback] - запасной текст если ключ не найден
 * @returns {string}
 */
function t(key, fallback) {
    const entry = STRINGS[key];
    if (!entry) {
        // Ключ не найден — возвращаем fallback или сам ключ
        return fallback || key;
    }
    return entry[currentLang] || entry['ru'] || fallback || key;
}

/**
 * Переключить язык
 * @param {string} [lang] - 'ru' или 'en'. Если не указан — переключает на другой
 */
function switchLanguage(lang) {
    if (lang) {
        currentLang = lang;
    } else {
        currentLang = currentLang === 'ru' ? 'en' : 'ru';
    }

    window.LANG = currentLang;

    try {
        localStorage.setItem('game_lang', currentLang);
    } catch (e) {}

    console.log(`🌐 Язык переключён на: ${currentLang}`);

    // Перерисовываем открытый Airdrop модал если он есть
    const airdropOverlay = document.getElementById('airdrop-overlay');
    if (airdropOverlay) {
        if (typeof setupAirdropUI === 'function') {
            setupAirdropUI();
        }
    }

    // Обновляем кнопку языка если есть
    updateLangButton();
}

/**
 * Обновить иконку на кнопке переключения языка
 */
function updateLangButton() {
    const btn = document.getElementById('lang-switch-btn');
    if (btn) {
        btn.textContent = currentLang === 'ru' ? '🇬🇧' : '🇷🇺';
        btn.title = currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский';
    }
}

/**
 * Получить текущий язык
 * @returns {string}
 */
function getLang() {
    return currentLang;
}

// Инициализируем при загрузке
initI18n();

// Экспортируем в window
window.t = t;
window.switchLanguage = switchLanguage;
window.getLang = getLang;
window.updateLangButton = updateLangButton;
window.STRINGS = STRINGS;
