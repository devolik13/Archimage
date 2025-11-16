// battle/leaderboard.js - Система таблицы лидеров
console.log('✅ leaderboard.js загружен');

/**
 * Показать таблицу лидеров
 */
async function showLeaderboard() {
    // Закрываем текущие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    // Данные игрока
    const playerRating = window.userData?.rating || 1000;
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

            return `
                <div style="
                    background: ${index < 3 ? '#3d3d5c' : '#2c2c3d'};
                    padding: 10px;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 3px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#555'};
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                        <div>
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
        <div style="padding: 20px; max-width: 500px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da; text-align: center;">🏆 Таблица лидеров</h3>

            <!-- Топ-5 игроков -->
            <div style="background: #1a1a2e; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #ffa500; text-align: center;">Лучшие маги</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${topPlayersHTML}
                </div>
            </div>

            <!-- Статистика текущего игрока -->
            <div style="background: #3d3d5c; padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #7289da;">
                <h4 style="margin-top: 0; color: #7289da; text-align: center;">Ваша статистика</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                    <div style="text-align: center;">
                        <div style="color: #aaa;">Рейтинг</div>
                        <div style="font-size: 18px; font-weight: bold; color: #ffa500;">${playerLeagueInfo}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #aaa;">Винрейт</div>
                        <div style="font-size: 18px; font-weight: bold; color: ${playerWinRate >= 50 ? '#4CAF50' : '#ff6b6b'};">${playerWinRate}%</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #aaa;">Побед</div>
                        <div style="font-size: 18px; font-weight: bold; color: #4CAF50;">${playerWins}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #aaa;">Поражений</div>
                        <div style="font-size: 18px; font-weight: bold; color: #f44336;">${playerLosses}</div>
                    </div>
                </div>
            </div>

            <button style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer; font-size: 16px;"
                    onclick="closeLeaderboard()">
                Закрыть
            </button>
        </div>
    `;

    // Создаём модалку
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'leaderboard-modal-container';
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 12px; z-index: 1000; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);';

    const overlay = document.createElement('div');
    overlay.id = 'leaderboard-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999;';
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

        console.log('✅ Топ игроков загружен:', data);
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

console.log('💡 Таблица лидеров готова!');
