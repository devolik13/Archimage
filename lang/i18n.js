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
