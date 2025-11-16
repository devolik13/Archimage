// battle/opponent-selection.js - Система выбора противника
console.log('✅ opponent-selection.js загружен');

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

        // Получаем всех игроков (включая ботов), отсортированных по рейтингу
        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('telegram_id, username, rating, level, wins, losses, faction')
            .order('rating', { ascending: true });

        if (error) {
            console.error('❌ Ошибка загрузки списка игроков:', error);
            return [];
        }

        // Исключаем текущего игрока
        const currentTelegramId = window.dbManager.getTelegramId();
        const allPlayers = data.filter(p => p.telegram_id !== currentTelegramId);

        // Находим индекс ближайшего по рейтингу
        let closestIndex = 0;
        let minDiff = Math.abs(allPlayers[0].rating - playerRating);

        for (let i = 1; i < allPlayers.length; i++) {
            const diff = Math.abs(allPlayers[i].rating - playerRating);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        // Берем 2 выше и 2 ниже (или сколько есть)
        const opponents = [];
        const halfCount = Math.floor(count / 2);

        // Берем нижних
        for (let i = Math.max(0, closestIndex - halfCount); i < closestIndex && opponents.length < halfCount; i++) {
            opponents.push(allPlayers[i]);
        }

        // Берем верхних
        for (let i = closestIndex; i < Math.min(allPlayers.length, closestIndex + halfCount); i++) {
            if (opponents.length >= count) break;
            opponents.push(allPlayers[i]);
        }

        // Если недостаточно, добираем откуда можем
        if (opponents.length < count) {
            for (let i = 0; i < allPlayers.length && opponents.length < count; i++) {
                if (!opponents.includes(allPlayers[i])) {
                    opponents.push(allPlayers[i]);
                }
            }
        }

        console.log(`✅ Найдено ${opponents.length} противников для рейтинга ${playerRating}`);
        return opponents.slice(0, count);

    } catch (error) {
        console.error('❌ Ошибка в getOpponentsList:', error);
        return [];
    }
}

/**
 * Показать UI выбора противника
 */
async function showOpponentSelection() {
    // Закрываем текущие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }
    if (typeof window.closePvPArenaModal === 'function') {
        window.closePvPArenaModal();
    }

    const playerRating = window.userData?.rating || 1000;
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
            <div style="
                background: #3d3d5c;
                padding: 15px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
            "
            onmouseover="this.style.borderColor='#7289da'; this.style.transform='scale(1.02)'"
            onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'"
            onclick="selectOpponent(${opponent.telegram_id}, '${opponent.username.replace(/'/g, "\\'")}', ${opponent.rating}, ${opponent.level})">
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
        <div style="padding: 20px; max-width: 500px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da; text-align: center;">⚔️ Выбор противника</h3>

            <div style="background: #1a1a2e; padding: 10px; border-radius: 6px; margin: 15px 0; text-align: center;">
                <div style="font-size: 12px; color: #aaa;">Ваш рейтинг</div>
                <div style="font-size: 18px; color: #ffa500; font-weight: bold;">${playerRating}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                ${opponentsHTML}
            </div>

            <button style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: #555; color: white; cursor: pointer; font-size: 14px;"
                    onclick="closeOpponentSelection()">
                ❌ Отмена
            </button>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'opponent-selection-modal';
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1001;';

    const overlay = document.createElement('div');
    overlay.id = 'opponent-selection-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 1000;';
    overlay.onclick = closeOpponentSelection;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    window.currentOpponentSelectionModal = { modal, overlay };
}

/**
 * Выбрать противника и начать бой
 */
function selectOpponent(telegramId, username, rating, level) {
    console.log(`⚔️ Выбран противник: ${username} (${rating})`);

    // Сохраняем данные противника
    window.selectedOpponent = {
        telegram_id: telegramId,
        username: username,
        rating: rating,
        level: level
    };

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

// Экспорт
window.getOpponentsList = getOpponentsList;
window.showOpponentSelection = showOpponentSelection;
window.selectOpponent = selectOpponent;
window.closeOpponentSelection = closeOpponentSelection;

console.log('💡 Система выбора противника готова!');
