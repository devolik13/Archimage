// battle/rating-system.js - Система рейтинга для PvP боев
console.log('✅ rating-system.js загружен');

/**
 * Конфигурация рейтинговой системы
 */
const RATING_CONFIG = {
    STARTING_RATING: 1000,
    MIN_RATING: 0,
    MAX_RATING: 9999,

    // Базовые очки за победу/поражение
    BASE_WIN: 25,
    BASE_LOSS: -12,
    BASE_DRAW: 0,

    // Множители в зависимости от разницы рейтингов
    RATING_DIFF_MULTIPLIERS: [
        { minDiff: 200, maxDiff: Infinity, winMultiplier: 1.6, lossMultiplier: 0.4 },   // Победа над сильным: +40, поражение: -5
        { minDiff: 100, maxDiff: 200, winMultiplier: 1.3, lossMultiplier: 0.6 },       // +32, -7
        { minDiff: 50, maxDiff: 100, winMultiplier: 1.1, lossMultiplier: 0.8 },        // +27, -10
        { minDiff: -50, maxDiff: 50, winMultiplier: 1.0, lossMultiplier: 1.0 },        // +25, -12 (равные)
        { minDiff: -100, maxDiff: -50, winMultiplier: 0.8, lossMultiplier: 1.2 },      // +20, -14
        { minDiff: -200, maxDiff: -100, winMultiplier: 0.6, lossMultiplier: 1.4 },     // +15, -17
        { minDiff: -Infinity, maxDiff: -200, winMultiplier: 0.4, lossMultiplier: 1.8 } // Победа над слабым: +10, поражение: -22
    ]
};

/**
 * Лиги (для будущего)
 */
const LEAGUES = [
    { id: 'bronze', name: 'Бронза', minRating: 0, maxRating: 999, color: '#cd7f32', icon: '🥉' },
    { id: 'silver', name: 'Серебро', minRating: 1000, maxRating: 1499, color: '#c0c0c0', icon: '🥈' },
    { id: 'gold', name: 'Золото', minRating: 1500, maxRating: 1999, color: '#ffd700', icon: '🥇' },
    { id: 'platinum', name: 'Платина', minRating: 2000, maxRating: 2499, color: '#e5e4e2', icon: '💎' },
    { id: 'diamond', name: 'Алмаз', minRating: 2500, maxRating: 2999, color: '#b9f2ff', icon: '💠' },
    { id: 'master', name: 'Мастер', minRating: 3000, maxRating: 3999, color: '#ff1493', icon: '⭐' },
    { id: 'grandmaster', name: 'Грандмастер', minRating: 4000, maxRating: 9998, color: '#ff4500', icon: '🔥' },
    { id: 'legend', name: 'Легенда', minRating: 9999, maxRating: Infinity, color: '#9400d3', icon: '👑' }
];

/**
 * Рассчитать изменение рейтинга после боя
 * @param {number} playerRating - Рейтинг игрока
 * @param {number} opponentRating - Рейтинг противника
 * @param {string} result - 'win', 'loss' или 'draw'
 * @returns {number} - Изменение рейтинга (может быть отрицательным)
 */
function calculateRatingChange(playerRating, opponentRating, result) {
    // Разница рейтингов (положительная = противник сильнее)
    const ratingDiff = opponentRating - playerRating;

    // Находим подходящий множитель
    const multiplierConfig = RATING_CONFIG.RATING_DIFF_MULTIPLIERS.find(
        config => ratingDiff >= config.minDiff && ratingDiff < config.maxDiff
    );

    if (!multiplierConfig) {
        console.error('❌ Не найден конфиг множителя для разницы:', ratingDiff);
        return result === 'win' ? RATING_CONFIG.BASE_WIN : RATING_CONFIG.BASE_LOSS;
    }

    let change = 0;

    switch (result) {
        case 'win':
            change = Math.round(RATING_CONFIG.BASE_WIN * multiplierConfig.winMultiplier);
            break;
        case 'loss':
            change = Math.round(RATING_CONFIG.BASE_LOSS * multiplierConfig.lossMultiplier);
            break;
        case 'draw':
            change = RATING_CONFIG.BASE_DRAW;
            break;
        default:
            console.error('❌ Неизвестный результат боя:', result);
            change = 0;
    }

    console.log(`📊 Расчет рейтинга: ${playerRating} vs ${opponentRating} (разница: ${ratingDiff > 0 ? '+' : ''}${ratingDiff})`);
    console.log(`   Результат: ${result} | Изменение: ${change > 0 ? '+' : ''}${change}`);

    return change;
}

/**
 * Применить изменение рейтинга с учетом границ
 * @param {number} currentRating - Текущий рейтинг
 * @param {number} change - Изменение рейтинга
 * @returns {number} - Новый рейтинг
 */
function applyRatingChange(currentRating, change) {
    const newRating = currentRating + change;
    return Math.max(RATING_CONFIG.MIN_RATING, Math.min(RATING_CONFIG.MAX_RATING, newRating));
}

/**
 * Получить лигу по рейтингу
 * @param {number} rating - Рейтинг игрока
 * @returns {object} - Объект лиги
 */
function getLeagueByRating(rating) {
    return LEAGUES.find(league => rating >= league.minRating && rating <= league.maxRating) || LEAGUES[0];
}

/**
 * Получить прогресс в текущей лиге (0-100%)
 * @param {number} rating - Рейтинг игрока
 * @returns {number} - Процент прогресса в лиге (0-100)
 */
function getLeagueProgress(rating) {
    const league = getLeagueByRating(rating);
    if (league.maxRating === Infinity) return 100;

    const range = league.maxRating - league.minRating;
    const progress = rating - league.minRating;
    return Math.round((progress / range) * 100);
}

/**
 * Форматировать рейтинг для отображения
 * @param {number} rating - Рейтинг
 * @returns {string} - Форматированная строка
 */
function formatRating(rating) {
    const league = getLeagueByRating(rating);
    return `${league.icon} ${rating} (${league.name})`;
}

/**
 * Найти противника по рейтингу (заглушка для будущего)
 * @param {number} playerRating - Рейтинг игрока
 * @param {number} searchRange - Диапазон поиска (±)
 * @returns {Promise<object>} - Объект противника
 */
async function findOpponentByRating(playerRating, searchRange = 100) {
    // TODO: Реализовать поиск противника в Supabase
    // Пока возвращаем AI с похожим рейтингом
    const aiRating = playerRating + Math.floor(Math.random() * searchRange * 2) - searchRange;
    return {
        id: 'ai_' + Date.now(),
        username: 'AI Противник',
        rating: Math.max(0, aiRating),
        isAI: true
    };
}

// Экспорт
window.RATING_CONFIG = RATING_CONFIG;
window.LEAGUES = LEAGUES;
window.calculateRatingChange = calculateRatingChange;
window.applyRatingChange = applyRatingChange;
window.getLeagueByRating = getLeagueByRating;
window.getLeagueProgress = getLeagueProgress;
window.formatRating = formatRating;
window.findOpponentByRating = findOpponentByRating;

console.log('💡 Рейтинговая система готова!');
console.log(`   Начальный рейтинг: ${RATING_CONFIG.STARTING_RATING}`);
console.log(`   Лиги: ${LEAGUES.length} (${LEAGUES.map(l => l.name).join(', ')})`);
