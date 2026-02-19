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
        resistances: { fire: 50, water: -50, wind: 0, earth: 0, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 2,
        name: "Ледяной Голем",
        description: "Устойчив к воде, уязвим к огню",
        resistances: { fire: -50, water: 50, wind: 0, earth: 0, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 3,
        name: "Каменный Голем",
        description: "Устойчив к земле, уязвим к ветру",
        resistances: { fire: 0, water: 0, wind: -50, earth: 50, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 4,
        name: "Воздушный Голем",
        description: "Устойчив к ветру, уязвим к земле",
        resistances: { fire: 0, water: 0, wind: 50, earth: -50, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 5,
        name: "Древесный Голем",
        description: "Устойчив к природе, уязвим к огню",
        resistances: { fire: -50, water: 0, wind: 0, earth: 0, nature: 50, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 6,
        name: "Токсичный Голем",
        description: "Устойчив к яду, уязвим к природе",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: -50, poison: 50, light: 0, dark: 0 }
    },
    {
        id: 7,
        name: "Элементальный Голем",
        description: "Устойчив ко всем стихиям",
        resistances: { fire: 30, water: 30, wind: 30, earth: 30, nature: 30, poison: 30, light: 30, dark: 30 }
    },
    {
        id: 8,
        name: "Хрупкий Голем",
        description: "Уязвим ко всем стихиям",
        resistances: { fire: -25, water: -25, wind: -25, earth: -25, nature: -25, poison: -25, light: -25, dark: -25 }
    },
    {
        id: 9,
        name: "Штормовой Голем",
        description: "Устойчив к ветру и воде, уязвим к земле и огню",
        resistances: { fire: -30, water: 40, wind: 40, earth: -30, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 10,
        name: "Вулканический Голем",
        description: "Устойчив к огню и земле, уязвим к воде",
        resistances: { fire: 40, water: -50, wind: 0, earth: 40, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 11,
        name: "Болотный Голем",
        description: "Устойчив к воде и яду, уязвим к ветру",
        resistances: { fire: 0, water: 40, wind: -50, earth: 0, nature: 20, poison: 40, light: 0, dark: 0 }
    },
    {
        id: 12,
        name: "Нейтральный Голем",
        description: "Нет сопротивлений - чистый тест урона",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0, light: 0, dark: 0 }
    },
    {
        id: 13,
        name: "Светлый Голем",
        description: "Устойчив к свету, уязвим к тьме",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0, light: 50, dark: -50 }
    },
    {
        id: 14,
        name: "Тёмный Голем",
        description: "Устойчив к тьме, уязвим к свету",
        resistances: { fire: 0, water: 0, wind: 0, earth: 0, nature: 0, poison: 0, light: -50, dark: 50 }
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
// UI показывает реальный инкремент за лигу (reward - prevReward)
const WEEKLY_REWARDS = [
    { minDamage: 0,      reward: 60,    description: "Участник" },        // +1ч
    { minDamage: 1000,   reward: 120,   description: "Новичок" },         // +1ч
    { minDamage: 3000,   reward: 240,   description: "Ученик" },          // +2ч
    { minDamage: 5000,   reward: 480,   description: "Боец" },            // +4ч
    { minDamage: 10000,  reward: 720,   description: "Воин" },            // +4ч
    { minDamage: 20000,  reward: 1440,  description: "Ветеран" },         // +12ч
    { minDamage: 35000,  reward: 2880,  description: "Элита" },           // +1д
    { minDamage: 50000,  reward: 4320,  description: "Мастер" },          // +1д
    { minDamage: 75000,  reward: 7200,  description: "Грандмастер" },     // +2д
    { minDamage: 100000, reward: 10080, description: "Легенда" }          // +2д
];

// Бонусы за топ места в лидерборде
const LEADERBOARD_BONUSES = [
    { place: 1, bonus: 4320, title: "🥇 Чемпион" },      // +3 дня
    { place: 2, bonus: 2880, title: "🥈 Второе место" }, // +2 дня
    { place: 3, bonus: 1440, title: "🥉 Третье место" }, // +1 день
    { place: 10, bonus: 720, title: "🏆 Топ-10" },       // +12 часов (места 4-10)
    { place: 50, bonus: 240, title: "⭐ Топ-50" }        // +4 часа (места 11-50)
];

// Минимальное количество участников для выдачи бонусов за места в рейтинге
const MIN_PARTICIPANTS_FOR_LEADERBOARD = 10000;

/**
 * Получить ISO номер недели (совместим с PostgreSQL IYYY-IW)
 * Возвращает строку "YYYY-WW" для совместимости с Supabase
 * В тестовом режиме добавляет offset для симуляции новой недели
 */
function getWeekNumber() {
    // Используем функцию getCurrentTime только если она уже определена
    const now = typeof getCurrentTime === 'function' ? getCurrentTime() : new Date();
    const baseWeek = getISOWeekYear(now);

    // В тестовом режиме добавляем offset для симуляции новой недели
    if (window.TEST_WEEK_OFFSET && window.TEST_WEEK_OFFSET > 0) {
        const [year, week] = baseWeek.split('-').map(Number);
        const newWeek = week + window.TEST_WEEK_OFFSET;
        // Простая логика: если неделя > 52, переносим на следующий год
        if (newWeek > 52) {
            return `${year + 1}-${String(newWeek - 52).padStart(2, '0')}`;
        }
        return `${year}-${String(newWeek).padStart(2, '0')}`;
    }

    return baseWeek;
}

/**
 * Получить ISO неделю в формате "YYYY-WW" (совместимо с PostgreSQL to_char(date, 'IYYY-IW'))
 */
function getISOWeekYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Четверг текущей недели определяет год ISO недели
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

/**
 * Получить конфигурацию манекена для текущей недели
 */
function getCurrentDummyConfig() {
    const weekYear = getWeekNumber(); // "YYYY-WW"
    const weekNum = parseInt(weekYear.split('-')[1], 10); // Извлекаем номер недели
    const configIndex = weekNum % DUMMY_CONFIGURATIONS.length;
    return DUMMY_CONFIGURATIONS[configIndex];
}

// === ТЕСТОВЫЙ РЕЖИМ ===
// Установить конкретное время окончания недели (ISO строка или null для стандартного режима)
// Пример: window.TEST_WEEK_END_TIME = '2025-12-27T10:50:00' - неделя закончится в 10:50
// PRODUCTION: Тестовый режим отключен, сброс по понедельникам в 00:00 UTC
window.TEST_WEEK_END_TIME = null;

// Счётчик тестовых недель (не используется в production)
window.TEST_WEEK_OFFSET = 0;

/**
 * Получить текущее время (серверное если доступно, иначе локальное)
 */
function getCurrentTime() {
    if (typeof window.getServerTime === 'function' && window.isServerTimeSynced?.()) {
        return window.getServerTime();
    }
    return new Date();
}

/**
 * Установить тестовое время сброса через N минут от текущего момента
 */
function setTestWeekEndIn(minutes) {
    const now = getCurrentTime();
    const testEnd = new Date(now.getTime() + minutes * 60 * 1000);
    window.TEST_WEEK_END_TIME = testEnd.toISOString();
    console.log(`⏰ Тестовый сброс установлен на: ${testEnd.toLocaleTimeString()} (через ${minutes} мин)`);
    return testEnd;
}

/**
 * Получить время до конца недели (в миллисекундах)
 */
function getTimeUntilWeekEnd() {
    const now = getCurrentTime();

    // Тестовый режим: конкретное время окончания
    if (window.TEST_WEEK_END_TIME) {
        const testEnd = new Date(window.TEST_WEEK_END_TIME);
        const remaining = testEnd - now;
        // Если время уже прошло, возвращаем 0 (неделя закончилась)
        return Math.max(0, remaining);
    }

    // Стандартный режим: до понедельника 00:00 UTC
    const dayOfWeek = now.getUTCDay(); // 0 = воскресенье (UTC)
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextWeekEnd = new Date(now);
    nextWeekEnd.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextWeekEnd.setUTCHours(0, 0, 0, 0);

    return nextWeekEnd - now;
}

/**
 * Проверить, закончилась ли тестовая неделя
 */
function isTestWeekEnded() {
    if (!window.TEST_WEEK_END_TIME) return false;
    return getCurrentTime() >= new Date(window.TEST_WEEK_END_TIME);
}

/**
 * Сбросить тестовую неделю (вызывается вручную для теста)
 * Увеличивает offset и сбрасывает локальный прогресс
 * ВАЖНО: Награды за урон уже выданы сразу при достижении уровней!
 */
function triggerTestWeekReset() {
    console.log('🔄 Принудительный сброс тестовой недели...');

    // Сохраняем старый прогресс для отображения итогов
    const oldProgress = loadDummyProgress();
    const oldTotalDamage = oldProgress.totalDamage || 0;
    const oldBestAttempt = oldProgress.bestAttempt || 0;
    const oldWeek = oldProgress.weekNumber;
    const claimedTiers = oldProgress.claimedTiers || [];

    window.TEST_WEEK_OFFSET = (window.TEST_WEEK_OFFSET || 0) + 1;
    console.log(`📅 Новый TEST_WEEK_OFFSET: ${window.TEST_WEEK_OFFSET}`);

    // Сбрасываем локальный прогресс
    const newWeek = getWeekNumber();

    console.log(`📅 Старая неделя: ${oldWeek}, новая: ${newWeek}`);

    // Показываем итоговый уровень (награда уже выдана сразу!)
    const achievedTier = getRewardForDamage(oldTotalDamage);
    console.log(`🏆 Достигнутый уровень: ${achievedTier.description}`);
    console.log(`💰 Награды уже выданы сразу при достижении уровней: ${claimedTiers.length} уровней`);

    // Показываем уведомление о завершении недели (БЕЗ награды - она уже выдана)
    if (oldTotalDamage > 0) {
        showTrialResetNotification(oldTotalDamage, oldBestAttempt, achievedTier, true);
    }

    // Принудительный сброс прогресса
    const progress = {
        weekNumber: newWeek,
        totalDamage: 0,
        bestAttempt: 0,
        history: [],
        lastDummyHp: null,
        attemptsToday: 0,
        lastAttemptDate: null,
        claimedTiers: []  // Сброс полученных наград
    };

    saveDummyProgress(progress, true);

    // Очищаем локальный рейтинг (новая неделя)
    localStorage.removeItem('trial_leaderboard');
    console.log('📊 Локальный рейтинг очищен');

    console.log('✅ Прогресс сброшен!');
    console.log(`🎯 Новый голем: ${getCurrentDummyConfig().name}`);

    // Также пробуем через Supabase для рейтинговой награды (если 10000+ участников)
    if (typeof window.checkAndClaimTrialReward === 'function') {
        window.checkAndClaimTrialReward().catch(() => {});
    }

    return {
        newWeek: newWeek,
        newGolem: getCurrentDummyConfig().name,
        achievedTier: achievedTier,
        oldDamage: oldTotalDamage
    };
}

/**
 * Показать уведомление о сбросе испытания и награде (адаптивное как ежедневная награда)
 * @param {boolean} alreadyRewarded - награда уже была выдана сразу при достижении уровней
 */
function showTrialResetNotification(totalDamage, bestAttempt, reward, alreadyRewarded = false) {
    // Удаляем старую модалку если есть
    const oldModal = document.getElementById('trial-reset-notification');
    if (oldModal) oldModal.remove();

    // Форматируем награду
    const formatTime = (minutes) => {
        if (minutes >= 1440) {
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            return hours > 0 ? `${days}д ${hours}ч` : `${days}д`;
        }
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
        }
        return `${minutes}м`;
    };

    // Фон по фракции игрока
    const faction = window.userData?.faction || 'fire';
    const backgroundPath = `assets/ui/window/tower_${faction}.webp`;

    // Создаём экран
    const screen = document.createElement('div');
    screen.id = 'trial-reset-notification';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    screen.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        </style>
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div id="trial-reward-wrapper" style="position: relative; display: inline-block;">
                <img id="trial-reward-bg" src="${backgroundPath}" alt="Фон" style="
                    max-width: 100vw;
                    max-height: 100vh;
                    object-fit: contain;
                    display: block;
                ">
                <div id="trial-reward-overlay" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                    box-sizing: border-box;
                "></div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);

    // Ждём загрузку изображения для масштабирования
    const img = document.getElementById('trial-reward-bg');
    const rewardText = formatTime(reward.reward);

    const setupUI = () => {
        const overlay = document.getElementById('trial-reward-overlay');
        if (!overlay || !img) return;

        const rect = img.getBoundingClientRect();
        const scaleX = rect.width / 768;
        const scaleY = rect.height / 512;
        const scale = Math.min(scaleX, scaleY);

        const titleSize = Math.max(18, 28 * scale);
        const subtitleSize = Math.max(14, 20 * scale);
        const textSize = Math.max(12, 16 * scale);
        const valueSize = Math.max(22, 32 * scale);
        const btnSize = Math.max(14, 18 * scale);
        const iconSize = Math.max(40, 60 * scale);

        overlay.style.animation = 'slideUp 0.5s ease';

        overlay.innerHTML = `
            <div style="font-size: ${iconSize}px; margin-bottom: ${10 * scale}px; animation: pulse 2s infinite;">🎯</div>
            <div style="font-size: ${titleSize}px; font-weight: bold; color: #ffd700; margin-bottom: ${5 * scale}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                Испытание завершено!
            </div>
            <div style="font-size: ${subtitleSize}px; color: #fff; margin-bottom: ${15 * scale}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                Новый голем появился
            </div>

            <div style="
                background: rgba(0,0,0,0.4);
                border: 2px solid rgba(74,158,255,0.6);
                border-radius: ${12 * scale}px;
                padding: ${12 * scale}px ${20 * scale}px;
                margin-bottom: ${12 * scale}px;
            ">
                <div style="font-size: ${textSize}px; color: #888; margin-bottom: ${5 * scale}px;">Ваш результат</div>
                <div style="font-size: ${valueSize}px; font-weight: bold; color: #4a9eff; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    ⚔️ ${totalDamage.toLocaleString()} урона
                </div>
                <div style="font-size: ${textSize * 0.9}px; color: #888; margin-top: ${5 * scale}px;">
                    Лучшая попытка: ${bestAttempt.toLocaleString()}
                </div>
            </div>

            <div style="
                background: rgba(0,0,0,0.4);
                border: 2px solid rgba(74,222,128,0.6);
                border-radius: ${12 * scale}px;
                padding: ${15 * scale}px ${25 * scale}px;
                margin-bottom: ${15 * scale}px;
            ">
                <div style="font-size: ${textSize}px; color: #888; margin-bottom: ${5 * scale}px;">Уровень: ${reward.description}</div>
                <div style="font-size: ${iconSize * 0.7}px; margin-bottom: ${5 * scale}px;">${alreadyRewarded ? '✅' : '⏰'}</div>
                <div style="font-size: ${valueSize * 1.1}px; font-weight: bold; color: #4ade80; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    ${alreadyRewarded ? 'Награда получена!' : '+' + rewardText}
                </div>
            </div>

            <button onclick="document.getElementById('trial-reset-notification').remove()" style="
                background: linear-gradient(145deg, #667eea, #764ba2);
                border: none;
                padding: ${12 * scale}px ${35 * scale}px;
                border-radius: ${25 * scale}px;
                color: white;
                font-size: ${btnSize}px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
                box-shadow: 0 4px 15px rgba(102,126,234,0.4);
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Отлично! 🏆
            </button>
        `;
    };

    img.onload = setupUI;
    if (img.complete) setupUI();

    // Автозакрытие через 15 секунд
    setTimeout(() => {
        const notification = document.getElementById('trial-reset-notification');
        if (notification) notification.remove();
    }, 15000);
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
 * @param {number} place - место игрока в рейтинге
 * @param {number} totalParticipants - общее количество участников за неделю
 * @returns {Object|null} - бонус или null если не достигнут порог участников
 */
function getLeaderboardBonus(place, totalParticipants = 0) {
    // Бонусы за места выдаются только если участников >= 1000
    if (totalParticipants < MIN_PARTICIPANTS_FOR_LEADERBOARD) {
        console.log(`📊 Бонус за место не выдаётся: участников ${totalParticipants} < ${MIN_PARTICIPANTS_FOR_LEADERBOARD}`);
        return null;
    }

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
    if (immediate) {
        if (!window.dbManager) {
            console.error('❌ window.dbManager не существует!');
            return;
        }

        // Используем специальную функцию для сохранения только training_dummy_progress
        // (как saveBattleResult сохраняет только wins/losses/rating)
        if (window.dbManager.saveTrainingDummyProgress) {
            console.log('📝 Используем saveTrainingDummyProgress (изолированное сохранение)');
            window.dbManager.saveTrainingDummyProgress(progress).then((result) => {
                if (result === true) {
                    console.log('✅ Trial progress сохранён через saveTrainingDummyProgress!');
                } else {
                    console.warn('⚠️ saveTrainingDummyProgress вернул false');
                }
            }).catch(err => {
                console.error('❌ Ошибка saveTrainingDummyProgress:', err);
            });
        } else {
            // Fallback на старый метод
            console.log('📝 Fallback: используем savePlayer');
            if (window.dbManager.savePlayer && window.dbManager.currentPlayer) {
                window.dbManager.savePlayer(window.userData).then((result) => {
                    if (result === true) {
                        console.log('✅ Trial progress сохранён через savePlayer');
                    } else {
                        console.warn('⚠️ savePlayer вернул false');
                    }
                }).catch(err => {
                    console.error('❌ Failed to save trial progress:', err);
                });
            }
        }
    }
}

/**
 * Записать результат попытки (урон)
 * ВАЖНО: Попытка уже списана в deductTrialAttempt() при старте боя!
 * @param {number} damage - нанесённый урон
 * @param {number} remainingHp - остаток HP манекена
 */
async function recordAttempt(damage, remainingHp = null) {
    console.log(`🎯 recordAttempt вызван: damage=${damage}, remainingHp=${remainingHp}`);

    const progress = loadDummyProgress();
    const currentWeek = getWeekNumber();

    console.log(`🎯 Текущий прогресс до обновления:`, JSON.stringify(progress));

    // Сохраняем старый урон для проверки новых уровней
    const oldTotalDamage = progress.totalDamage || 0;

    // Сброс на новую неделю
    if (progress.weekNumber !== currentWeek) {
        console.log(`🎯 Новая неделя: ${progress.weekNumber} -> ${currentWeek}`);
        progress.weekNumber = currentWeek;
        progress.totalDamage = 0;
        progress.bestAttempt = 0;
        progress.history = [];
        progress.lastDummyHp = null;
        progress.claimedTiers = [];  // Сброс полученных наград за урон
    }

    // Инициализируем claimedTiers если нет
    if (!progress.claimedTiers) {
        progress.claimedTiers = [];
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

    // Проверяем и выдаём награды за новые уровни урона
    // ВАЖНО: await чтобы addTimeCurrency завершился ДО любого savePlayer()
    const newRewards = await checkAndClaimDamageTierRewards(oldTotalDamage, progress.totalDamage, progress.claimedTiers);
    if (newRewards.length > 0) {
        // Обновляем список полученных наград
        newRewards.forEach(tier => {
            if (!progress.claimedTiers.includes(tier.minDamage)) {
                progress.claimedTiers.push(tier.minDamage);
            }
        });
    }

    saveDummyProgress(progress, true); // immediate save to DB

    // Сохраняем результат в Supabase для глобального рейтинга
    if (typeof window.saveTrialResultSupabase === 'function') {
        window.saveTrialResultSupabase(damage);
    }

    return progress;
}

/**
 * Проверить и выдать награды за достигнутые уровни урона
 * @param {number} oldDamage - урон до этой попытки
 * @param {number} newDamage - урон после этой попытки
 * @param {Array} claimedTiers - уже полученные уровни
 * @returns {Array} - список новых полученных наград
 */
async function checkAndClaimDamageTierRewards(oldDamage, newDamage, claimedTiers = []) {
    const newRewards = [];

    for (const tier of WEEKLY_REWARDS) {
        // Пропускаем уже полученные награды
        if (claimedTiers.includes(tier.minDamage)) {
            continue;
        }

        // Проверяем достигли ли мы этого уровня
        if (newDamage >= tier.minDamage) {
            // Вычисляем награду (разница с предыдущим уровнем)
            const prevTierIndex = WEEKLY_REWARDS.indexOf(tier) - 1;
            const prevReward = prevTierIndex >= 0 ? WEEKLY_REWARDS[prevTierIndex].reward : 0;
            const tierReward = tier.reward - prevReward;

            if (tierReward > 0) {
                newRewards.push({
                    ...tier,
                    actualReward: tierReward
                });

                // Начисляем награду через RPC (корректно работает с lazy time currency)
                // ВАЖНО: await чтобы time_currency_base обновился ДО следующего savePlayer()
                if (typeof window.addTimeCurrency === 'function') {
                    try {
                        await window.addTimeCurrency(tierReward);
                    } catch (err) {
                        console.error('Ошибка начисления награды за урон:', err);
                    }
                } else if (window.userData) {
                    window.userData.time_currency_base = (window.userData.time_currency_base || 0) + tierReward;
                }
                console.log(`🏆 Награда за урон: ${tier.description} +${tierReward} мин`);

                // Показываем уведомление
                showDamageTierRewardNotification(tier, tierReward);
            }
        }
    }

    return newRewards;
}

/**
 * Показать уведомление о награде за уровень урона
 */
function showDamageTierRewardNotification(tier, rewardMinutes) {
    // Форматируем награду
    const formatTime = (minutes) => {
        if (minutes >= 1440) {
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            return hours > 0 ? `${days}д ${hours}ч` : `${days}д`;
        }
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
        }
        return `${minutes}м`;
    };

    // Создаём тост-уведомление
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(145deg, rgba(74, 222, 128, 0.95), rgba(34, 197, 94, 0.95));
        border: 2px solid #4ade80;
        border-radius: 16px;
        padding: 20px 30px;
        z-index: 100001;
        text-align: center;
        animation: tierRewardPopup 0.5s ease;
        box-shadow: 0 8px 32px rgba(74, 222, 128, 0.4);
    `;

    toast.innerHTML = `
        <style>
            @keyframes tierRewardPopup {
                0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
                50% { transform: translateX(-50%) scale(1.1); }
                100% { opacity: 1; transform: translateX(-50%) scale(1); }
            }
        </style>
        <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
        <div style="font-size: 18px; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
            Новый уровень!
        </div>
        <div style="font-size: 22px; font-weight: bold; color: #ffd700; margin: 8px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
            ${tier.description}
        </div>
        <div style="font-size: 16px; color: #fff;">
            ⏰ +${formatTime(rewardMinutes)}
        </div>
    `;

    document.body.appendChild(toast);

    // Удаляем через 3 секунды
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
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

    // Вычисляем инкрементальную награду за текущий тир (не кумулятивную)
    const rewardIndex = WEEKLY_REWARDS.indexOf(reward);
    const prevReward = rewardIndex > 0 ? WEEKLY_REWARDS[rewardIndex - 1].reward : 0;
    const currentRewardActual = reward.reward - prevReward;

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
        currentRewardActual: currentRewardActual,  // Инкремент за текущий тир
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
window.MIN_PARTICIPANTS_FOR_LEADERBOARD = MIN_PARTICIPANTS_FOR_LEADERBOARD;

window.getCurrentDummyConfig = getCurrentDummyConfig;
window.getWeekNumber = getWeekNumber;
window.getISOWeekYear = getISOWeekYear;
window.getTimeUntilWeekEnd = getTimeUntilWeekEnd;
window.formatTimeUntilWeekEnd = formatTimeUntilWeekEnd;
window.getRewardForDamage = getRewardForDamage;
window.getLeaderboardBonus = getLeaderboardBonus;
window.createDummyEnemy = createDummyEnemy;
window.getRemainingAttempts = getRemainingAttempts;
window.loadDummyProgress = loadDummyProgress;
window.saveDummyProgress = saveDummyProgress;
window.recordAttempt = recordAttempt;
window.checkAndClaimDamageTierRewards = checkAndClaimDamageTierRewards;
window.showDamageTierRewardNotification = showDamageTierRewardNotification;
window.getDummyInfo = getDummyInfo;
window.formatTimeUntilAttemptReset = formatTimeUntilAttemptReset;
window.formatMsToTime = formatMsToTime;
window.isTestWeekEnded = isTestWeekEnded;
window.triggerTestWeekReset = triggerTestWeekReset;
window.setTestWeekEndIn = setTestWeekEndIn;
window.getCurrentTime = getCurrentTime;
window.showTrialResetNotification = showTrialResetNotification;

/**
 * Автоматическая проверка и сброс недели если время истекло
 * Вызывается периодически и при открытии UI испытания
 */
function checkAndTriggerWeekReset() {
    if (window.TEST_WEEK_END_TIME && isTestWeekEnded()) {
        console.log('⏰ Время испытания истекло! Автоматический сброс...');
        const result = triggerTestWeekReset();

        // Устанавливаем новое время сброса (следующий день 00:01 UTC)
        const now = getCurrentTime();
        const nextReset = new Date(now);
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        nextReset.setUTCHours(0, 1, 0, 0);
        window.TEST_WEEK_END_TIME = nextReset.toISOString();

        console.log(`📅 Следующий сброс: ${nextReset.toISOString()}`);
        return result;
    }
    return null;
}

// Экспорт функции
window.checkAndTriggerWeekReset = checkAndTriggerWeekReset;

// Проверять каждую минуту
setInterval(() => {
    checkAndTriggerWeekReset();
}, 60000);

// Первая проверка через 3 секунды после загрузки
setTimeout(() => {
    if (window.TEST_WEEK_END_TIME) {
        console.log(`🧪 ТЕСТ: Сброс испытания установлен на ${window.TEST_WEEK_END_TIME}`);
    } else {
        console.log(`📅 Испытание: сброс каждый понедельник в 00:00 UTC. До сброса: ${formatTimeUntilWeekEnd()}`);
    }
    checkAndTriggerWeekReset();
}, 3000);

console.log('✅ Training Dummy Config загружен');
