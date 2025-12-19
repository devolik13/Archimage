// minigames/training-dummy-config.js - Тренировочный полигон
/**
 * ТРЕНИРОВОЧНЫЙ ПОЛИГОН
 *
 * Механика:
 * - Манекен с 10,000 HP, не атакует
 * - 3 попытки в день
 * - 5 ходов на попытку
 * - Урон копится за неделю
 * - Сопротивления меняются каждую неделю
 * - В конце недели награды по урону
 */

// Конфигурации манекена на разные недели (12 вариантов - на 3 месяца)
const DUMMY_CONFIGURATIONS = [
    {
        id: 1,
        name: "Огненный Голем",
        description: "Устойчив к огню, уязвим к воде",
        resistances: { fire: 50, water: -50, wind: 0, earth: 0, nature: 0, poison: 0 }
    },
    {
        id: 2,
        name: "Ледяной Голем",
        description: "Устойчив к воде, уязвим к огню",
        resistances: { fire: -50, water: 50, wind: 0, earth: 0, nature: 0, poison: 0 }
    },
    {
        id: 3,
        name: "Каменный Голем",
        description: "Устойчив к земле, уязвим к ветру",
        resistances: { fire: 0, water: 0, wind: -50, earth: 50, nature: 0, poison: 0 }
    },
    {
        id: 4,
        name: "Воздушный Голем",
        description: "Устойчив к ветру, уязвим к земле",
        resistances: { fire: 0, water: 0, wind: 50, earth: -50, nature: 0, poison: 0 }
    },
    {
        id: 5,
        name: "Древесный Голем",
        description: "Устойчив к природе, уязвим к огню",
        resistances: { fire: -50, water: 0, wind: 0, earth: 0, nature: 50, poison: 0 }
    },
    {
        id: 6,
        name: "Токсичный Голем",
        description: "Устойчив к яду, уязвим к природе",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: -50, poison: 50 }
    },
    {
        id: 7,
        name: "Элементальный Голем",
        description: "Устойчив ко всем стихиям",
        resistances: { fire: 30, water: 30, wind: 30, earth: 30, nature: 30, poison: 30 }
    },
    {
        id: 8,
        name: "Хрупкий Голем",
        description: "Уязвим ко всем стихиям",
        resistances: { fire: -25, water: -25, wind: -25, earth: -25, nature: -25, poison: -25 }
    },
    {
        id: 9,
        name: "Штормовой Голем",
        description: "Устойчив к ветру и воде, уязвим к земле и огню",
        resistances: { fire: -30, water: 40, wind: 40, earth: -30, nature: 0, poison: 0 }
    },
    {
        id: 10,
        name: "Вулканический Голем",
        description: "Устойчив к огню и земле, уязвим к воде",
        resistances: { fire: 40, water: -50, wind: 0, earth: 40, nature: 0, poison: 0 }
    },
    {
        id: 11,
        name: "Болотный Голем",
        description: "Устойчив к воде и яду, уязвим к ветру",
        resistances: { fire: 0, water: 40, wind: -50, earth: 0, nature: 20, poison: 40 }
    },
    {
        id: 12,
        name: "Нейтральный Голем",
        description: "Нет сопротивлений - чистый тест урона",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0 }
    }
];

// Константы
const DUMMY_CONFIG = {
    HP: 10000,
    ARMOR: 100,                    // Стандартная броня
    MAX_ROUNDS: 10,                // Раундов на попытку (раунд = все маги атакуют по очереди)
    DAILY_ATTEMPTS: 3,             // Попыток в день
    WEEK_DURATION_DAYS: 7
};

// Награды по урону за неделю (накопительные пороги)
const WEEKLY_REWARDS = [
    { minDamage: 0,      reward: 60,    description: "Участник" },        // 1 час
    { minDamage: 1000,   reward: 120,   description: "Новичок" },         // 2 часа
    { minDamage: 3000,   reward: 240,   description: "Ученик" },          // 4 часа
    { minDamage: 5000,   reward: 480,   description: "Боец" },            // 8 часов
    { minDamage: 10000,  reward: 720,   description: "Воин" },            // 12 часов
    { minDamage: 20000,  reward: 1440,  description: "Ветеран" },         // 1 день
    { minDamage: 35000,  reward: 2880,  description: "Элита" },           // 2 дня
    { minDamage: 50000,  reward: 4320,  description: "Мастер" },          // 3 дня
    { minDamage: 75000,  reward: 7200,  description: "Грандмастер" },     // 5 дней
    { minDamage: 100000, reward: 10080, description: "Легенда" }          // 7 дней
];

// Бонусы за топ места в лидерборде
const LEADERBOARD_BONUSES = [
    { place: 1, bonus: 4320, title: "🥇 Чемпион" },      // +3 дня
    { place: 2, bonus: 2880, title: "🥈 Второе место" }, // +2 дня
    { place: 3, bonus: 1440, title: "🥉 Третье место" }, // +1 день
    { place: 10, bonus: 720, title: "🏆 Топ-10" },       // +12 часов (места 4-10)
    { place: 50, bonus: 240, title: "⭐ Топ-50" }        // +4 часа (места 11-50)
];

/**
 * Получить номер текущей недели года
 */
function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000; // миллисекунд в неделе
    return Math.floor(diff / oneWeek);
}

/**
 * Получить конфигурацию манекена для текущей недели
 */
function getCurrentDummyConfig() {
    const weekNum = getWeekNumber();
    const configIndex = weekNum % DUMMY_CONFIGURATIONS.length;
    return DUMMY_CONFIGURATIONS[configIndex];
}

/**
 * Получить время до конца недели (в миллисекундах)
 */
function getTimeUntilWeekEnd() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = воскресенье
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    return nextMonday - now;
}

/**
 * Форматировать время до конца недели
 */
function formatTimeUntilWeekEnd() {
    const ms = getTimeUntilWeekEnd();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days}д ${hours}ч`;
    } else if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

/**
 * Получить награду по урону
 */
function getRewardForDamage(totalDamage) {
    let reward = WEEKLY_REWARDS[0];
    for (const tier of WEEKLY_REWARDS) {
        if (totalDamage >= tier.minDamage) {
            reward = tier;
        } else {
            break;
        }
    }
    return reward;
}

/**
 * Получить бонус за место в лидерборде
 */
function getLeaderboardBonus(place) {
    for (const bonus of LEADERBOARD_BONUSES) {
        if (place <= bonus.place) {
            return bonus;
        }
    }
    return null;
}

/**
 * Создать объект манекена для боя
 */
function createDummyEnemy() {
    const config = getCurrentDummyConfig();

    return {
        id: 'training_dummy',
        name: config.name,
        hp: DUMMY_CONFIG.HP,
        max_hp: DUMMY_CONFIG.HP,
        armor: DUMMY_CONFIG.ARMOR,
        max_armor: DUMMY_CONFIG.ARMOR,
        faction: 'neutral',
        spells: [], // Манекен не атакует
        isTrainingDummy: true,
        isDummy: true,
        magicResistance: config.resistances,
        description: config.description,
        spriteSheet: 'training_dummy' // Спрайт пугала
    };
}

/**
 * Проверить, есть ли попытки на сегодня
 */
function getRemainingAttempts() {
    const today = new Date().toDateString();
    const progress = loadDummyProgress();

    if (progress.lastAttemptDate !== today) {
        return DUMMY_CONFIG.DAILY_ATTEMPTS;
    }

    return Math.max(0, DUMMY_CONFIG.DAILY_ATTEMPTS - (progress.attemptsToday || 0));
}

/**
 * Загрузить прогресс игрока из базы данных
 */
function loadDummyProgress() {
    // Используем userData из базы данных
    if (window.userData && window.userData.training_dummy_progress) {
        return window.userData.training_dummy_progress;
    }

    // Дефолтные значения для нового игрока
    return {
        weekNumber: getWeekNumber(),
        totalDamage: 0,
        bestAttempt: 0,
        attemptsToday: 0,
        lastAttemptDate: null,
        lastDummyHp: null,  // Остаток HP манекена после последней попытки
        attemptResetTime: null,  // Время следующего сброса попыток
        history: []
    };
}

/**
 * Сохранить прогресс игрока в базу данных
 * @param {boolean} immediate - немедленное сохранение в БД (по умолчанию false)
 */
function saveDummyProgress(progress, immediate = false) {
    console.log('📝 saveDummyProgress вызван:', { immediate, progress: JSON.stringify(progress).substring(0, 200) });

    // Сохраняем в userData
    if (!window.userData) {
        console.error('❌ window.userData не существует!');
        return;
    }

    window.userData.training_dummy_progress = progress;
    console.log('📝 Progress сохранён в window.userData');

    // Помечаем данные как изменённые для автосохранения
    if (window.dbManager && window.dbManager.markChanged) {
        window.dbManager.markChanged();
        console.log('📝 markChanged() вызван');
    } else {
        console.warn('⚠️ dbManager.markChanged недоступен');
    }

    // Немедленное сохранение в БД (для важных моментов)
    // ВАЖНО: передаём ПОЛНЫЙ userData, иначе остальные поля сбросятся!
    if (immediate) {
        if (!window.dbManager) {
            console.error('❌ window.dbManager не существует!');
            return;
        }
        if (!window.dbManager.savePlayer) {
            console.error('❌ dbManager.savePlayer не существует!');
            return;
        }

        // Проверяем currentPlayer
        if (!window.dbManager.currentPlayer) {
            console.error('❌ dbManager.currentPlayer не существует! RPC не будет вызван.');
            return;
        }

        console.log('📝 Вызываем dbManager.savePlayer...');
        console.log('📝 telegram_id:', window.dbManager.getTelegramId ? window.dbManager.getTelegramId() : 'N/A');
        console.log('📝 training_dummy_progress:', JSON.stringify(window.userData.training_dummy_progress).substring(0, 100));

        window.dbManager.savePlayer(window.userData).then((result) => {
            if (result === true) {
                console.log('✅ Trial progress РЕАЛЬНО сохранён в DB');
            } else {
                console.warn('⚠️ savePlayer вернул false - данные НЕ сохранены!');
            }
        }).catch(err => {
            console.error('❌ Failed to save trial progress:', err);
            console.error('❌ Error details:', err.message, err.code, err.details);
        });
    }
}

/**
 * Записать результат попытки (урон)
 * ВАЖНО: Попытка уже списана в deductTrialAttempt() при старте боя!
 * @param {number} damage - нанесённый урон
 * @param {number} remainingHp - остаток HP манекена
 */
function recordAttempt(damage, remainingHp = null) {
    console.log(`🎯 recordAttempt вызван: damage=${damage}, remainingHp=${remainingHp}`);

    const progress = loadDummyProgress();
    const currentWeek = getWeekNumber();

    console.log(`🎯 Текущий прогресс до обновления:`, JSON.stringify(progress));

    // Сброс на новую неделю
    if (progress.weekNumber !== currentWeek) {
        console.log(`🎯 Новая неделя: ${progress.weekNumber} -> ${currentWeek}`);
        progress.weekNumber = currentWeek;
        progress.totalDamage = 0;
        progress.bestAttempt = 0;
        progress.history = [];
        progress.lastDummyHp = null;
    }

    // НЕ увеличиваем attemptsToday - это уже сделано в deductTrialAttempt()
    // Только записываем урон
    progress.totalDamage += damage;
    progress.bestAttempt = Math.max(progress.bestAttempt, damage);
    progress.lastDummyHp = remainingHp;
    progress.history.push({
        date: new Date().toISOString(),
        damage: damage,
        remainingHp: remainingHp
    });

    console.log(`🎯 Прогресс после обновления: totalDamage=${progress.totalDamage}, bestAttempt=${progress.bestAttempt}, attemptsToday=${progress.attemptsToday}`);

    saveDummyProgress(progress, true); // immediate save to DB

    // Сохраняем результат в Supabase для глобального рейтинга
    if (typeof window.saveTrialResultSupabase === 'function') {
        window.saveTrialResultSupabase(damage);
    }

    return progress;
}

/**
 * Форматировать время до сброса попыток
 */
function formatTimeUntilAttemptReset() {
    const progress = loadDummyProgress();

    if (!progress.attemptResetTime) {
        // Если нет сохранённого времени, вычисляем до 00:00 следующего дня
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const ms = tomorrow - new Date();
        return formatMsToTime(ms);
    }

    const resetTime = new Date(progress.attemptResetTime);
    const ms = resetTime - new Date();

    if (ms <= 0) {
        return "Готово!";
    }

    return formatMsToTime(ms);
}

/**
 * Форматировать миллисекунды в читаемое время
 */
function formatMsToTime(ms) {
    if (ms <= 0) return "0м";

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
}

/**
 * Получить информацию для отображения
 */
function getDummyInfo() {
    const config = getCurrentDummyConfig();
    const progress = loadDummyProgress();
    const currentWeek = getWeekNumber();

    // Сброс если новая неделя
    if (progress.weekNumber !== currentWeek) {
        progress.weekNumber = currentWeek;
        progress.totalDamage = 0;
        progress.bestAttempt = 0;
        progress.history = [];
        progress.lastDummyHp = null;
        saveDummyProgress(progress);
    }

    const reward = getRewardForDamage(progress.totalDamage);
    const nextReward = WEEKLY_REWARDS.find(r => r.minDamage > progress.totalDamage);

    return {
        dummy: config,
        hp: DUMMY_CONFIG.HP,
        armor: DUMMY_CONFIG.ARMOR,
        maxRounds: DUMMY_CONFIG.MAX_ROUNDS,
        remainingAttempts: getRemainingAttempts(),
        dailyAttempts: DUMMY_CONFIG.DAILY_ATTEMPTS,
        totalDamage: progress.totalDamage,
        bestAttempt: progress.bestAttempt,
        lastDummyHp: progress.lastDummyHp,  // Остаток HP манекена после последней попытки
        currentReward: reward,
        nextReward: nextReward,
        timeUntilReset: formatTimeUntilWeekEnd(),
        timeUntilAttemptReset: formatTimeUntilAttemptReset()  // Время до сброса попыток
    };
}

// Экспорт
window.DUMMY_CONFIGURATIONS = DUMMY_CONFIGURATIONS;
window.DUMMY_CONFIG = DUMMY_CONFIG;
window.WEEKLY_REWARDS = WEEKLY_REWARDS;
window.LEADERBOARD_BONUSES = LEADERBOARD_BONUSES;

window.getCurrentDummyConfig = getCurrentDummyConfig;
window.getWeekNumber = getWeekNumber;
window.getTimeUntilWeekEnd = getTimeUntilWeekEnd;
window.formatTimeUntilWeekEnd = formatTimeUntilWeekEnd;
window.getRewardForDamage = getRewardForDamage;
window.getLeaderboardBonus = getLeaderboardBonus;
window.createDummyEnemy = createDummyEnemy;
window.getRemainingAttempts = getRemainingAttempts;
window.loadDummyProgress = loadDummyProgress;
window.saveDummyProgress = saveDummyProgress;
window.recordAttempt = recordAttempt;
window.getDummyInfo = getDummyInfo;
window.formatTimeUntilAttemptReset = formatTimeUntilAttemptReset;
window.formatMsToTime = formatMsToTime;

console.log('✅ Training Dummy Config загружен');
