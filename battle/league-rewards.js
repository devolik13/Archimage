// battle/league-rewards.js - Система наград за достижение лиг

/**
 * Проверить, может ли игрок получить награду за лигу
 * @param {string} leagueId - ID лиги (например, 'apprentice')
 * @returns {boolean} - true если награда доступна
 */
function canClaimLeagueReward(leagueId) {
    if (!window.userData) return false;

    // Получаем лигу по ID
    const league = window.LEAGUES?.find(l => l.id === leagueId);
    if (!league) {
        console.error('❌ Лига не найдена:', leagueId);
        return false;
    }

    // Проверяем, что рейтинг игрока соответствует лиге или выше
    const playerRating = window.userData.rating || 0;
    if (playerRating < league.minRating) {
        console.log(`⚠️ Рейтинг ${playerRating} недостаточен для лиги ${league.name} (требуется ${league.minRating})`);
        return false;
    }

    // Проверяем, не получал ли игрок уже награду за эту лигу в текущем сезоне
    const claimedRewards = window.userData.season_league_rewards_claimed || [];
    if (claimedRewards.includes(leagueId)) {
        console.log(`⚠️ Награда за лигу ${league.name} уже получена в этом сезоне`);
        return false;
    }

    return true;
}

/**
 * Получить все доступные награды (которые можно забрать)
 * @returns {Array} - Массив лиг с доступными наградами
 */
function getAvailableLeagueRewards() {
    if (!window.LEAGUES) return [];

    const playerRating = window.userData?.rating || 0;
    const claimedRewards = window.userData?.season_league_rewards_claimed || [];

    return window.LEAGUES.filter(league => {
        return playerRating >= league.minRating && !claimedRewards.includes(league.id);
    });
}

/**
 * Получить все лиги с их статусами (получена/доступна/заблокирована)
 * @returns {Array} - Массив объектов с информацией о статусе каждой лиги
 */
function getAllLeaguesWithStatus() {
    if (!window.LEAGUES) return [];

    const playerRating = window.userData?.rating || 0;
    const claimedRewards = window.userData?.season_league_rewards_claimed || [];

    return window.LEAGUES.map(league => {
        const isUnlocked = playerRating >= league.minRating;
        const isClaimed = claimedRewards.includes(league.id);
        const canClaim = isUnlocked && !isClaimed;

        return {
            ...league,
            isUnlocked,
            isClaimed,
            canClaim,
            status: isClaimed ? 'claimed' : (canClaim ? 'available' : 'locked')
        };
    });
}

/**
 * Получить награду за лигу
 * @param {string} leagueId - ID лиги
 * @returns {Promise<boolean>} - true если награда успешно получена
 */
async function claimLeagueReward(leagueId) {
    if (!window.userData) {
        console.error('❌ userData не инициализирован');
        return false;
    }

    // Проверяем, можно ли получить награду
    if (!canClaimLeagueReward(leagueId)) {
        console.error('❌ Награду невозможно получить');
        return false;
    }

    // Получаем лигу
    const league = window.LEAGUES.find(l => l.id === leagueId);
    if (!league || !league.rewards) {
        console.error('❌ Награды для лиги не найдены:', leagueId);
        return false;
    }

    console.log(`🎁 Получение награды за лигу: ${league.name}`);
    console.log('   Награды:', league.rewards);

    // Выдаем награды
    const rewards = league.rewards;

    if (rewards.time_currency) {
        if (typeof window.addTimeCurrency === 'function') {
            await window.addTimeCurrency(rewards.time_currency);
        } else {
            // Fallback: обновляем time_currency_base (не старое поле time_currency!)
            const current = typeof window.getTimeCurrency === 'function' ? window.getTimeCurrency() : (window.userData.time_currency_base || 0);
            window.userData.time_currency_base = current + rewards.time_currency;
            window.userData.time_currency_updated_at = new Date().toISOString();
        }
        console.log(`⏰ Получено времени: +${rewards.time_currency}`);
    }

    if (rewards.airdrop_points && typeof window.addAirdropPoints === 'function') {
        window.addAirdropPoints(rewards.airdrop_points, 'Достижение лиги');
    }

    // Добавляем лигу в список полученных наград
    if (!window.userData.season_league_rewards_claimed) {
        window.userData.season_league_rewards_claimed = [];
    }
    window.userData.season_league_rewards_claimed.push(leagueId);

    // НЕМЕДЛЕННОЕ сохранение в БД (чтобы нельзя было получить повторно при перезагрузке)
    try {
        if (window.eventSaveManager && typeof window.eventSaveManager.saveImmediate === 'function') {
            await window.eventSaveManager.saveImmediate('league_reward_claimed');
            console.log('✅ Награда за лигу сохранена немедленно');
        } else if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            await window.dbManager.savePlayer(window.userData);
            console.log('✅ Прогресс наград сохранен в БД');
        }
    } catch (saveError) {
        console.error('❌ Ошибка сохранения награды:', saveError);
        // Откатываем изменения если сохранение не удалось
        window.userData.season_league_rewards_claimed = window.userData.season_league_rewards_claimed.filter(id => id !== leagueId);
        return false;
    }

    // Показываем уведомление
    if (window.showNotification) {
        window.showNotification(`🎁 Получена награда за ${league.icon} ${league.name}!`);
    }

    // Обновляем UI если нужно
    if (typeof window.updateCurrencyDisplay === 'function') {
        window.updateCurrencyDisplay();
    }

    return true;
}

/**
 * Показать полноэкранное окно с наградами за лиги (стиль арены)
 */
function showLeagueRewardsModal() {
    // Удаляем старое окно если есть
    const existing = document.getElementById('league-rewards-fullscreen');
    if (existing) existing.remove();

    const allLeagues = getAllLeaguesWithStatus();
    const playerRating = window.userData?.rating || 0;
    const currentLeague = window.getLeagueByRating ? window.getLeagueByRating(playerRating) : null;
    const currentSeasonInfo = window.userData?.current_season ? `Сезон ${window.userData.current_season}` : 'Сезон 1';

    let leaguesHTML = '';

    allLeagues.forEach(league => {
        const isCurrent = currentLeague && currentLeague.id === league.id;

        let cardStyle = '';
        let statusBadge = '';
        let claimButton = '';

        if (league.status === 'claimed') {
            cardStyle = 'background: rgba(76, 175, 80, 0.15); border: 2px solid rgba(76, 175, 80, 0.6);';
            statusBadge = '<div style="color: #4CAF50; font-weight: bold; margin-top: 5px;">✅ Получено</div>';
        } else if (league.status === 'available') {
            cardStyle = 'background: rgba(255, 165, 0, 0.2); border: 2px solid #ffa500; box-shadow: 0 0 20px rgba(255, 165, 0, 0.4);';
            statusBadge = '<div style="color: #ffa500; font-weight: bold; margin-top: 5px;">🎁 Доступно!</div>';
            claimButton = `
                <button style="
                    margin-top: 10px;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #ffa500, #ff8c00);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    font-size: 14px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                " onclick="claimLeagueRewardFromModal('${league.id}')">
                    🎁 Получить награду
                </button>
            `;
        } else {
            cardStyle = 'background: rgba(0, 0, 0, 0.4); border: 2px solid rgba(128, 128, 128, 0.3); opacity: 0.5;';
            statusBadge = '<div style="color: #666; margin-top: 5px;">🔒 Требуется ${league.minRating} рейтинга</div>';
        }

        leaguesHTML += `
            <div style="${cardStyle} padding: 15px; border-radius: 12px; margin-bottom: 12px; ${isCurrent ? 'box-shadow: 0 0 15px rgba(114, 137, 218, 0.5);' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-size: 28px; margin-bottom: 5px;">
                            ${league.icon} ${isCurrent ? '⭐' : ''}
                        </div>
                        <div style="font-weight: bold; color: ${league.color}; font-size: 18px;">
                            ${league.name}
                        </div>
                        <div style="font-size: 12px; color: #aaa; margin-top: 3px;">
                            ${league.minRating} - ${league.maxRating === Infinity ? '∞' : league.maxRating} рейтинга
                        </div>
                        ${statusBadge}
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 5px;">Награды:</div>
                        ${league.rewards.time_currency ? '<div style="color: #00bfff; font-size: 14px;">⏰ ' + league.rewards.time_currency + '</div>' : ''}
                        ${league.rewards.airdrop_points ? '<div style="color: #4ade80; font-size: 14px;">🪙 ' + league.rewards.airdrop_points + ' BPM</div>' : ''}
                    </div>
                </div>
                ${claimButton}
            </div>
        `;
    });

    const screen = document.createElement('div');
    screen.id = 'league-rewards-fullscreen';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    screen.innerHTML = `
        <!-- Фон арены -->
        <img src="assets/ui/arena/arena_earth.webp" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        " onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';">

        <!-- Затемнение -->
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2;
        "></div>

        <!-- Контент -->
        <div style="
            position: relative;
            z-index: 10;
            width: 90%;
            max-width: 500px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 215, 0, 0.5);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        ">
            <!-- Заголовок -->
            <div style="
                padding: 15px 20px;
                background: rgba(0, 0, 0, 0.4);
                border-bottom: 2px solid rgba(255, 215, 0, 0.3);
                text-align: center;
            ">
                <h2 style="margin: 0; color: #FFD700; font-size: 22px;">🏆 Награды за лиги</h2>
                <div style="color: #ffa500; font-size: 14px; margin-top: 5px;">${currentSeasonInfo}</div>
            </div>

            <!-- Список лиг -->
            <div style="
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            ">
                <div style="
                    background: rgba(114, 137, 218, 0.15);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(114, 137, 218, 0.3);
                ">
                    <div style="font-size: 12px; color: #7289da; line-height: 1.4; text-align: center;">
                        💡 Достигните лиги и получите награду один раз за сезон
                    </div>
                </div>

                ${leaguesHTML}
            </div>

            <!-- Кнопка закрытия -->
            <div style="
                padding: 15px;
                background: rgba(0, 0, 0, 0.4);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
            ">
                <button onclick="closeLeagueRewardsModal()" style="
                    padding: 12px 40px;
                    background: rgba(114, 137, 218, 0.3);
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                ">← Закрыть</button>
            </div>
        </div>
    `;

    document.body.appendChild(screen);
}

/**
 * Получить награду из модального окна
 */
async function claimLeagueRewardFromModal(leagueId) {
    const success = await claimLeagueReward(leagueId);

    if (success) {
        // Закрываем и переоткрываем модалку чтобы обновить статусы
        closeLeagueRewardsModal();
        setTimeout(() => showLeagueRewardsModal(), 300);
    } else {
        if (window.showNotification) {
            window.showNotification('❌ Не удалось получить награду');
        }
    }
}

/**
 * Закрыть модальное окно наград
 */
function closeLeagueRewardsModal() {
    const screen = document.getElementById('league-rewards-fullscreen');
    if (screen) screen.remove();

    // Для совместимости со старой версией
    const modal = document.getElementById('league-rewards-modal-container');
    const overlay = document.getElementById('league-rewards-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

/**
 * Проверить доступные награды при изменении рейтинга
 * Показывает уведомление если новая награда стала доступна
 */
function checkForNewAvailableRewards(oldRating, newRating) {
    if (!window.LEAGUES) return;

    const claimedRewards = window.userData?.season_league_rewards_claimed || [];

    // Находим лиги, которые стали доступны после изменения рейтинга
    const newlyUnlockedLeagues = window.LEAGUES.filter(league => {
        const wasLocked = oldRating < league.minRating;
        const isNowUnlocked = newRating >= league.minRating;
        const notClaimed = !claimedRewards.includes(league.id);

        return wasLocked && isNowUnlocked && notClaimed;
    });

    if (newlyUnlockedLeagues.length > 0 && window.showNotification) {
        newlyUnlockedLeagues.forEach(league => {
            window.showNotification(`🎁 Достигнута новая лига: ${league.icon} ${league.name}! Награда доступна!`);
        });
    }
}

// Экспорт функций
window.canClaimLeagueReward = canClaimLeagueReward;
window.getAvailableLeagueRewards = getAvailableLeagueRewards;
window.getAllLeaguesWithStatus = getAllLeaguesWithStatus;
window.claimLeagueReward = claimLeagueReward;
window.showLeagueRewardsModal = showLeagueRewardsModal;
window.closeLeagueRewardsModal = closeLeagueRewardsModal;
window.claimLeagueRewardFromModal = claimLeagueRewardFromModal;
window.checkForNewAvailableRewards = checkForNewAvailableRewards;

console.log('🎁 Система наград за лиги загружена');
