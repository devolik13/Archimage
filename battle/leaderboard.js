// battle/leaderboard.js - Система таблицы лидеров

/**
 * Показать таблицу лидеров
 */
async function showLeaderboard() {
    // Закрываем текущие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    // Данные игрока (0 - валидное значение для новичков)
    const playerRating = typeof window.userData?.rating === 'number' ? window.userData.rating : 0;
    const playerWins = window.userData?.wins || 0;
    const playerLosses = window.userData?.losses || 0;
    const playerTotalBattles = window.userData?.total_battles || 0;
    const playerWinRate = playerTotalBattles > 0 ? Math.round((playerWins / playerTotalBattles) * 100) : 0;

    // Лига игрока
    let playerLeagueInfo = '🔰 Адепт волшебства';
    if (typeof window.formatRating === 'function') {
        playerLeagueInfo = window.formatRating(playerRating);
    }

    // TODO: Получить топ-5 игроков из Supabase
    // Пока используем заглушку
    const topPlayers = await getTopPlayers(5);

    // Генерируем HTML для топ-5
    let topPlayersHTML = '';
    if (topPlayers.length === 0) {
        topPlayersHTML = '<p style="color: #888; text-align: center;">Пока нет других игроков</p>';
    } else {
        topPlayersHTML = topPlayers.map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const leagueInfo = typeof window.formatRating === 'function'
                ? window.formatRating(player.rating)
                : `⭐ ${player.rating}`;

            const topClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';

            return `
                <div class="leaderboard-player-card ${topClass}">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: white;">${player.username || 'Игрок'}</div>
                            <div style="font-size: 12px; color: #aaa;">${leagueInfo}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: #4CAF50;">${player.wins}W</div>
                        <div style="font-size: 12px; color: #888;">${player.losses}L</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const modalContent = `
        <div class="modal-content">
            <h3 class="modal-header">🏆 Таблица лидеров</h3>

            <div class="modal-body smooth-scroll">
                <div class="leaderboard-layout">
                    <!-- Левая колонка: Топ-5 игроков -->
                    <div class="leaderboard-top-players">
                        <h4 class="leaderboard-top-title">🥇 Лучшие маги</h4>
                        <div class="leaderboard-players-list">
                            ${topPlayersHTML}
                        </div>
                    </div>

                    <!-- Правая колонка: Статистика игрока -->
                    <div class="leaderboard-player-stats">
                        <h4 class="leaderboard-stats-title">📊 Ваша статистика</h4>
                        <div class="player-stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Рейтинг</div>
                                <div class="stat-value" style="color: #ffa500;">${playerRating}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Винрейт</div>
                                <div class="stat-value" style="color: ${playerWinRate >= 50 ? '#4CAF50' : '#ff6b6b'};">${playerWinRate}%</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Побед</div>
                                <div class="stat-value" style="color: #4CAF50;">${playerWins}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Поражений</div>
                                <div class="stat-value" style="color: #f44336;">${playerLosses}</div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; padding: 8px; background: #2c2c3d; border-radius: 6px; text-align: center;">
                            <div class="stat-label">Лига</div>
                            <div style="font-size: 13px; font-weight: bold; color: #ffa500;">${playerLeagueInfo}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="modal-button" onclick="closeLeaderboard()">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    // Создаём модалку
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'leaderboard-modal-container';
    modal.className = 'modal-container';

    const overlay = document.createElement('div');
    overlay.id = 'leaderboard-overlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = closeLeaderboard;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    window.currentLeaderboardModal = { modal, overlay };
}

/**
 * Закрыть таблицу лидеров
 */
function closeLeaderboard() {
    const modal = document.getElementById('leaderboard-modal-container');
    const overlay = document.getElementById('leaderboard-overlay');

    if (modal) modal.remove();
    if (overlay) overlay.remove();

    if (window.currentLeaderboardModal) {
        window.currentLeaderboardModal = null;
    }
}

/**
 * Получить топ игроков из базы данных
 * @param {number} limit - Количество игроков
 * @returns {Promise<Array>} - Массив игроков
 */
async function getTopPlayers(limit = 5) {
    try {
        if (!window.dbManager || !window.dbManager.supabase) {
            console.warn('⚠️ Supabase не инициализирован, используем заглушку');
            return getMockTopPlayers(limit);
        }

        const { data, error } = await window.dbManager.supabase
            .from('players')
            .select('username, rating, wins, losses, total_battles')
            .order('rating', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Ошибка загрузки топа:', error);
            return getMockTopPlayers(limit);
        }

        return data || [];

    } catch (error) {
        console.error('❌ Ошибка в getTopPlayers:', error);
        return getMockTopPlayers(limit);
    }
}

/**
 * Заглушка для топа игроков (для тестирования)
 */
function getMockTopPlayers(limit) {
    return [
        { username: 'Мерлин', rating: 3500, wins: 150, losses: 50, total_battles: 200 },
        { username: 'Гэндальф', rating: 3200, wins: 120, losses: 60, total_battles: 180 },
        { username: 'Дамблдор', rating: 2800, wins: 100, losses: 70, total_battles: 170 },
        { username: 'Саруман', rating: 2500, wins: 90, losses: 80, total_battles: 170 },
        { username: 'Гарри Поттер', rating: 2200, wins: 80, losses: 90, total_battles: 170 }
    ].slice(0, limit);
}

// Экспорт
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard;
window.getTopPlayers = getTopPlayers;

