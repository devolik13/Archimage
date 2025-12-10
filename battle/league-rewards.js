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
        window.userData.time_currency = (window.userData.time_currency || 0) + rewards.time_currency;
        console.log(`⏰ Получено времени: +${rewards.time_currency}`);
    }

    if (rewards.airdrop_points && typeof window.addAirdropPoints === 'function') {
        window.addAirdropPoints(rewards.airdrop_points, `Достижение лиги: ${league.name}`);
    }

    // Добавляем лигу в список полученных наград
    if (!window.userData.season_league_rewards_claimed) {
        window.userData.season_league_rewards_claimed = [];
    }
    window.userData.season_league_rewards_claimed.push(leagueId);

    // Сохраняем в БД
    if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
        await window.dbManager.savePlayer(window.userData);
        console.log('✅ Прогресс наград сохранен в БД');
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
 * Показать модальное окно с наградами за лиги
 */
function showLeagueRewardsModal() {
    const allLeagues = getAllLeaguesWithStatus();
    const playerRating = window.userData?.rating || 0;
    const currentLeague = window.getLeagueByRating ? window.getLeagueByRating(playerRating) : null;

    let leaguesHTML = '';

    allLeagues.forEach(league => {
        const isCurrent = currentLeague && currentLeague.id === league.id;

        // Определяем стиль карточки
        let cardStyle = '';
        let statusBadge = '';
        let claimButton = '';

        if (league.status === 'claimed') {
            cardStyle = 'background: rgba(76, 175, 80, 0.1); border: 2px solid rgba(76, 175, 80, 0.5);';
            statusBadge = '<div style="color: #4CAF50; font-weight: bold; margin-top: 5px;">✅ Получено</div>';
        } else if (league.status === 'available') {
            cardStyle = 'background: rgba(255, 165, 0, 0.15); border: 2px solid #ffa500; box-shadow: 0 0 15px rgba(255, 165, 0, 0.3);';
            statusBadge = '<div style="color: #ffa500; font-weight: bold; margin-top: 5px;">🎁 Доступно!</div>';
            claimButton = `
                <button style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #ffa500;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                " onclick="claimLeagueRewardFromModal('${league.id}')">
                    🎁 Получить награду
                </button>
            `;
        } else {
            cardStyle = 'background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(128, 128, 128, 0.3); opacity: 0.6;';
            statusBadge = `<div style="color: #888; margin-top: 5px;">🔒 Требуется ${league.minRating} рейтинга</div>`;
        }

        leaguesHTML += `
            <div style="${cardStyle} padding: 15px; border-radius: 10px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-size: 24px; margin-bottom: 5px;">
                            ${league.icon} ${isCurrent ? '⭐' : ''}
                        </div>
                        <div style="font-weight: bold; color: ${league.color}; font-size: 16px;">
                            ${league.name}
                        </div>
                        <div style="font-size: 12px; color: #aaa; margin-top: 3px;">
                            ${league.minRating} - ${league.maxRating === Infinity ? '∞' : league.maxRating} рейтинга
                        </div>
                        ${statusBadge}
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Награды:</div>
                        ${league.rewards.time_currency ? `<div style="color: #00bfff; font-size: 13px;">⏰ ${league.rewards.time_currency}</div>` : ''}
                        ${league.rewards.airdrop_points ? `<div style="color: #4ade80; font-size: 13px;">🪙 ${league.rewards.airdrop_points} BPM</div>` : ''}
                    </div>
                </div>
                ${claimButton}
            </div>
        `;
    });

    const currentSeasonInfo = window.userData?.current_season ? `Сезон ${window.userData.current_season}` : 'Сезон 1';

    const modalContent = `
        <div class="modal-content" style="max-width: 600px;">
            <h3 class="modal-header">🏆 Награды за лиги</h3>

            <div class="modal-body smooth-scroll" style="max-height: 500px;">
                <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                    <div style="font-size: 12px; color: #aaa;">Текущий сезон</div>
                    <div style="font-size: 18px; color: #ffa500; font-weight: bold;">${currentSeasonInfo}</div>
                    <div style="font-size: 12px; color: #aaa; margin-top: 5px;">
                        Награды можно получить один раз за сезон
                    </div>
                </div>

                <div style="background: rgba(114, 137, 218, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #7289da; line-height: 1.4;">
                        💡 <strong>Как это работает:</strong><br>
                        Достигните лиги и получите награду один раз за сезон. В новом сезоне можно получить награды снова!
                    </div>
                </div>

                ${leaguesHTML}
            </div>

            <div class="modal-footer">
                <button class="modal-button" onclick="closeLeagueRewardsModal()">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'league-rewards-modal-container';
    modal.className = 'modal-container';

    const overlay = document.createElement('div');
    overlay.id = 'league-rewards-overlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = closeLeagueRewardsModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    window.currentLeagueRewardsModal = { modal, overlay };
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
    const modal = document.getElementById('league-rewards-modal-container');
    const overlay = document.getElementById('league-rewards-overlay');

    if (modal) modal.remove();
    if (overlay) overlay.remove();

    if (window.currentLeagueRewardsModal) {
        window.currentLeagueRewardsModal = null;
    }
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
