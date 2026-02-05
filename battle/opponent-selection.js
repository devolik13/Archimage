// battle/opponent-selection.js - Система выбора противника

/**
 * Получить список противников для выбора
 * @param {number} playerRating - Рейтинг игрока
 * @param {number} count - Количество противников
 * @returns {Promise<Array>} - Массив противников
 */
async function getOpponentsList(playerRating, count = 4) {
    try {
        if (!window.dbManager || !window.dbManager.supabase) {
            console.warn('⚠️ Supabase не инициализирован');
            return [];
        }

        const currentTelegramId = window.dbManager.getTelegramId();

        // Оптимизация: ищем только в диапазоне ±500 от рейтинга игрока
        // и загружаем только нужные поля (без тяжёлых JSON)
        const ratingMin = Math.max(0, playerRating - 500);
        const ratingMax = playerRating + 500;

        // Первый запрос - только лёгкие данные для списка
        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('id, telegram_id, username, rating, level, wins, losses, faction')
            .neq('telegram_id', currentTelegramId)
            .gte('rating', ratingMin)
            .lte('rating', ratingMax)
            .order('rating', { ascending: true })
            .limit(20); // Ограничиваем выборку

        if (error) {
            console.error('❌ Ошибка загрузки списка игроков:', error);
            return [];
        }

        if (!data || data.length === 0) {
            // Fallback: если в диапазоне нет игроков, берём любых
            const { data: fallbackData, error: fallbackError } = await window.dbManager.supabase
                .from('players')
                .select('id, telegram_id, username, rating, level, wins, losses, faction')
                .neq('telegram_id', currentTelegramId)
                .order('rating', { ascending: true })
                .limit(10);

            if (fallbackError || !fallbackData) {
                return [];
            }
            return fallbackData.slice(0, count);
        }

        // Находим ближайших по рейтингу
        const sorted = data.sort((a, b) => {
            const diffA = Math.abs(a.rating - playerRating);
            const diffB = Math.abs(b.rating - playerRating);
            return diffA - diffB;
        });

        return sorted.slice(0, count);

    } catch (error) {
        console.error('❌ Ошибка в getOpponentsList:', error);
        return [];
    }
}

/**
 * Показать UI выбора противника
 */
async function showOpponentSelection() {
    // ПРОВЕРКА ЭНЕРГИИ БОЕВ
    if (typeof window.checkBattleEnergyBeforeFight === 'function') {
        if (!window.checkBattleEnergyBeforeFight()) {
            console.log('⚡ Недостаточно энергии для боя');
            return; // Прерываем если нет энергии
        }
    }

    // Закрываем текущие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }
    if (typeof window.closePvPArenaModal === 'function') {
        window.closePvPArenaModal();
    }

    const playerRating = typeof window.userData?.rating === 'number' ? window.userData.rating : 0;
    const playerLevel = window.userData?.level || 1;

    // Показываем загрузку
    const loadingHTML = `
        <div style="padding: 40px; text-align: center; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="color: #7289da;">🔍 Поиск противников...</h3>
            <p style="color: #aaa;">Подбираем достойных соперников</p>
        </div>
    `;

    const loadingModal = document.createElement('div');
    loadingModal.innerHTML = loadingHTML;
    loadingModal.id = 'opponent-selection-loading';
    loadingModal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1001;';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'opponent-selection-overlay';
    loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 1000;';

    document.body.appendChild(loadingOverlay);
    document.body.appendChild(loadingModal);

    // Загружаем противников
    const opponents = await getOpponentsList(playerRating, 4);

    // Сохраняем список в глобальную переменную для доступа по индексу
    window.currentOpponentsList = opponents;

    // Убираем загрузку
    loadingModal.remove();
    loadingOverlay.remove();

    if (opponents.length === 0) {
        alert('❌ Не удалось найти противников. Попробуйте позже.');
        return;
    }

    // Генерируем HTML для противников
    const opponentsHTML = opponents.map((opponent, index) => {
        const ratingDiff = opponent.rating - playerRating;
        const ratingChange = typeof window.calculateRatingChange === 'function'
            ? window.calculateRatingChange(playerRating, opponent.rating, 'win')
            : 25;

        const diffColor = ratingDiff > 0 ? '#f44336' : ratingDiff < 0 ? '#4CAF50' : '#aaa';
        const diffText = ratingDiff > 0 ? `+${ratingDiff}` : ratingDiff;

        const leagueInfo = typeof window.formatRating === 'function'
            ? window.formatRating(opponent.rating)
            : `⭐ ${opponent.rating}`;

        return `
            <div class="opponent-card"
                 onclick="selectOpponent(${index})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; color: white; margin-bottom: 5px;">
                            ${opponent.username}
                        </div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                            ${leagueInfo}
                        </div>
                        <div style="font-size: 12px;">
                            <span style="color: #4CAF50;">${opponent.wins}W</span> /
                            <span style="color: #f44336;">${opponent.losses}L</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; color: ${diffColor}; font-weight: bold; margin-bottom: 5px;">
                            ${diffText}
                        </div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                            Уровень: ${opponent.level}
                        </div>
                        <div style="font-size: 14px; color: #ffa500; font-weight: bold;">
                            ${ratingChange > 0 ? '+' : ''}${ratingChange} 🎯
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const modalContent = `
        <div class="modal-content">
            <h3 class="modal-header">⚔️ Выбор противника</h3>

            <div class="modal-body smooth-scroll">
                <div class="opponent-layout">
                    <!-- Левая колонка: Список противников -->
                    <div>
                        <div class="opponent-list">
                            ${opponentsHTML}
                        </div>
                    </div>

                    <!-- Правая колонка: Информация и кнопки -->
                    <div class="opponent-actions">
                        <div class="opponent-rating-display">
                            <div style="font-size: 12px; color: #aaa;">Ваш рейтинг</div>
                            <div style="font-size: 20px; color: #ffa500; font-weight: bold; margin-top: 5px;">${playerRating}</div>
                        </div>

                        <div style="background: #1a1a2e; padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">💡 Подсказка</div>
                            <div style="font-size: 12px; color: #ddd; line-height: 1.4;">
                                Выберите противника из списка слева. Чем ближе рейтинг, тем честнее бой!
                            </div>
                        </div>

                        <button class="modal-button secondary" onclick="closeOpponentSelection()">
                            ❌ Отмена
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'opponent-selection-modal';
    modal.className = 'modal-container';

    const overlay = document.createElement('div');
    overlay.id = 'opponent-selection-overlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = closeOpponentSelection;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    window.currentOpponentSelectionModal = { modal, overlay };
}

/**
 * Выбрать противника и начать бой
 * @param {number} index - Индекс противника в window.currentOpponentsList
 */
async function selectOpponent(index) {
    if (!window.currentOpponentsList || !window.currentOpponentsList[index]) {
        console.error('❌ Противник не найден по индексу:', index);
        alert('❌ Ошибка выбора противника');
        return;
    }

    const opponentBasic = window.currentOpponentsList[index];
    console.log(`⚔️ Выбран противник: ${opponentBasic.username} (${opponentBasic.rating})`);

    // Дозагружаем полные данные противника (wizards, spells, formation, buildings)
    let opponent = opponentBasic;
    try {
        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('wizards, spells, formation, buildings')
            .eq('telegram_id', opponentBasic.telegram_id)
            .single();

        if (!error && data) {
            opponent = { ...opponentBasic, ...data };
        }
    } catch (e) {
        console.warn('⚠️ Не удалось дозагрузить данные противника:', e);
    }

    // КРИТИЧЕСКИ ВАЖНО: Списываем энергию СРАЗУ при выборе противника
    // Это предотвращает эксплойт с отменой боя
    if (typeof window.consumeBattleEnergy === 'function') {
        if (!window.consumeBattleEnergy()) {
            console.error('❌ Недостаточно энергии для боя');
            // Не закрываем модалку, чтобы игрок мог увидеть других противников
            return;
        }
        console.log('⚡ Энергия списана при выборе противника');
    }

    // Сохраняем ВСЕ данные противника (включая wizards, spells, formation, buildings)
    window.selectedOpponent = opponent;

    // ВАЖНО: Это PvP бой, очищаем флаги PvE
    window.isPvEBattle = false;
    window.currentPvELevel = null;

    // Закрываем модалку выбора
    closeOpponentSelection();

    // Запускаем бой
    if (typeof window.showBattleField === 'function') {
        window.showBattleField();
    } else {
        alert('❌ Функция боя не найдена');
    }
}

/**
 * Закрыть модалку выбора противника
 */
function closeOpponentSelection() {
    const modal = document.getElementById('opponent-selection-modal');
    const overlay = document.getElementById('opponent-selection-overlay');

    if (modal) modal.remove();
    if (overlay) overlay.remove();

    if (window.currentOpponentSelectionModal) {
        window.currentOpponentSelectionModal = null;
    }
}

// ==========================================
// ДУЭЛИ - бой с конкретным игроком по Telegram ID
// ==========================================

/**
 * Показать UI дуэли (ввод Telegram ID)
 */
function showDuelUI() {
    // Закрываем другие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    const overlay = document.createElement('div');
    overlay.id = 'duel-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #7289da;
            border-radius: 15px;
            padding: 25px;
            max-width: 350px;
            width: 90%;
            text-align: center;
        ">
            <h3 style="color: #ffd700; margin: 0 0 20px 0;">⚔️ Дуэль</h3>
            <p style="color: #aaa; font-size: 13px; margin-bottom: 20px;">
                Введите Telegram ID противника для тестового боя
            </p>

            <input type="number" id="duel-telegram-id-input" placeholder="Telegram ID" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #555;
                border-radius: 8px;
                background: #2a2a3e;
                color: white;
                font-size: 16px;
                text-align: center;
                margin-bottom: 15px;
                box-sizing: border-box;
            ">

            <div id="duel-player-preview" style="
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                min-height: 60px;
                display: none;
            "></div>

            <div style="display: flex; gap: 10px;">
                <button onclick="searchDuelOpponent()" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">🔍 Найти</button>
                <button onclick="closeDuelUI()" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255,100,100,0.3);
                    border: 1px solid rgba(255,100,100,0.5);
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                ">Отмена</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Фокус на инпут
    setTimeout(() => {
        document.getElementById('duel-telegram-id-input')?.focus();
    }, 100);
}

/**
 * Поиск противника для дуэли
 */
async function searchDuelOpponent() {
    const input = document.getElementById('duel-telegram-id-input');
    const preview = document.getElementById('duel-player-preview');
    const telegramId = parseInt(input?.value);

    if (!telegramId || isNaN(telegramId)) {
        alert('❌ Введите корректный Telegram ID');
        return;
    }

    // Нельзя биться с самим собой
    const myTelegramId = window.dbManager?.getTelegramId();
    if (telegramId === myTelegramId) {
        alert('❌ Нельзя вызвать на дуэль самого себя!');
        return;
    }

    preview.style.display = 'block';
    preview.innerHTML = '<div style="color: #aaa;">🔍 Поиск...</div>';

    try {
        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('telegram_id, username, rating, level, wins, losses, faction')
            .eq('telegram_id', telegramId)
            .single();

        if (error || !data) {
            preview.innerHTML = '<div style="color: #ff6b6b;">❌ Игрок не найден</div>';
            return;
        }

        // Сохраняем найденного игрока
        window.duelTargetPlayer = data;

        const leagueInfo = typeof window.formatRating === 'function'
            ? window.formatRating(data.rating)
            : `⭐ ${data.rating}`;

        const factionEmoji = {
            fire: '🔥', water: '💧', earth: '🪨', wind: '💨',
            nature: '🌿', poison: '☠️', light: '✨', dark: '🌑'
        }[data.faction] || '⭐';

        preview.innerHTML = `
            <div style="color: #4ade80; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                ✅ Найден!
            </div>
            <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                ${factionEmoji} ${data.username}
            </div>
            <div style="color: #aaa; font-size: 13px; margin-bottom: 5px;">
                ${leagueInfo} • Уровень ${data.level}
            </div>
            <div style="color: #888; font-size: 12px; margin-bottom: 15px;">
                <span style="color: #4CAF50;">${data.wins}W</span> /
                <span style="color: #f44336;">${data.losses}L</span>
            </div>
            <button onclick="startDuel()" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
            ">⚔️ Начать дуэль!</button>
        `;

    } catch (e) {
        console.error('❌ Ошибка поиска:', e);
        preview.innerHTML = '<div style="color: #ff6b6b;">❌ Ошибка поиска</div>';
    }
}

/**
 * Начать дуэль с найденным игроком
 */
async function startDuel() {
    if (!window.duelTargetPlayer) {
        alert('❌ Сначала найдите противника');
        return;
    }

    const opponentBasic = window.duelTargetPlayer;
    console.log(`⚔️ Дуэль с: ${opponentBasic.username} (${opponentBasic.telegram_id})`);

    // Дозагружаем полные данные противника
    let opponent = opponentBasic;
    try {
        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('wizards, spells, formation, buildings')
            .eq('telegram_id', opponentBasic.telegram_id)
            .single();

        if (!error && data) {
            opponent = { ...opponentBasic, ...data };
        }
    } catch (e) {
        console.warn('⚠️ Не удалось дозагрузить данные противника:', e);
    }

    // Устанавливаем противника (БЕЗ списания энергии - это тестовый бой)
    window.selectedOpponent = opponent;

    // Флаг что это дуэль (без наград/штрафов)
    window.isDuelBattle = true;
    window.isPvEBattle = false;
    window.currentPvELevel = null;

    // Закрываем UI дуэли
    closeDuelUI();

    // Запускаем бой
    if (typeof window.showBattleField === 'function') {
        window.showBattleField();
    } else {
        alert('❌ Функция боя не найдена');
    }
}

/**
 * Закрыть UI дуэли
 */
function closeDuelUI() {
    const overlay = document.getElementById('duel-overlay');
    if (overlay) overlay.remove();
    window.duelTargetPlayer = null;
}

// Экспорт
window.getOpponentsList = getOpponentsList;
window.showOpponentSelection = showOpponentSelection;
window.selectOpponent = selectOpponent;
window.closeOpponentSelection = closeOpponentSelection;
window.showDuelUI = showDuelUI;
window.searchDuelOpponent = searchDuelOpponent;
window.startDuel = startDuel;
window.closeDuelUI = closeDuelUI;

