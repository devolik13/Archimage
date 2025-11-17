// battle/battle-result-screen.js - Экран результатов боя
console.log('✅ battle-result-screen.js загружен');

/**
 * Показать экран результатов боя
 * @param {string} result - 'win' или 'loss'
 * @param {object} battleData - Данные о бое
 */
function showBattleResult(result, battleData = {}) {
    const {
        opponentName = 'Противник',
        opponentRating = 1000,
        ratingChange = 0,
        rewards = {},
        battleDuration = 0
    } = battleData;

    const isWin = result === 'win';

    // Определяем цвета и иконки
    const bgColor = isWin ? 'linear-gradient(135deg, #1e3a20 0%, #2d5016 100%)' : 'linear-gradient(135deg, #3a1e1e 0%, #501616 100%)';
    const titleColor = isWin ? '#4CAF50' : '#f44336';
    const titleIcon = isWin ? '🏆' : '💀';
    const titleText = isWin ? 'Вы выиграли!' : 'Вы проиграли!';

    // Форматируем изменение рейтинга
    const ratingChangeText = ratingChange > 0 ? `+${ratingChange}` : ratingChange;
    const ratingColor = ratingChange > 0 ? '#4CAF50' : ratingChange < 0 ? '#f44336' : '#aaa';

    // Новый рейтинг
    const currentRating = window.userData?.rating || 1000;
    const newRating = currentRating + ratingChange;

    // Лига
    let leagueInfo = `⭐ ${newRating}`;
    if (typeof window.formatRating === 'function') {
        leagueInfo = window.formatRating(newRating);
    }

    // Опыт для магов (если есть)
    const expGained = rewards.exp || 0;

    const modalContent = `
        <div style="
            padding: 30px;
            max-width: 450px;
            background: ${bgColor};
            border-radius: 15px;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        ">
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 60px; margin-bottom: 10px;">${titleIcon}</div>
                <h2 style="
                    margin: 0;
                    font-size: 32px;
                    color: ${titleColor};
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                ">${titleText}</h2>
            </div>

            <!-- Информация о противнике -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                text-align: center;
            ">
                <div style="font-size: 14px; color: #aaa; margin-bottom: 5px;">Противник</div>
                <div style="font-size: 18px; font-weight: bold; color: white;">${opponentName}</div>
                <div style="font-size: 14px; color: #aaa; margin-top: 5px;">Рейтинг: ${opponentRating}</div>
            </div>

            <!-- Изменение рейтинга -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
            ">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <!-- Текущий рейтинг -->
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Было</div>
                        <div style="font-size: 20px; color: #7289da; font-weight: bold;">${currentRating}</div>
                    </div>

                    <!-- Новый рейтинг -->
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Стало</div>
                        <div style="font-size: 20px; color: ${titleColor}; font-weight: bold;">${newRating}</div>
                    </div>
                </div>

                <!-- Изменение -->
                <div style="
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 5px;">Изменение рейтинга</div>
                    <div style="font-size: 28px; color: ${ratingColor}; font-weight: bold;">
                        ${ratingChangeText}
                    </div>
                </div>

                <!-- Лига -->
                <div style="
                    text-align: center;
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                ">
                    <div style="font-size: 14px; color: #ffa500;">${leagueInfo}</div>
                </div>
            </div>

            <!-- Награды (если есть) -->
            ${expGained > 0 ? `
                <div style="
                    background: rgba(255, 165, 0, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: center;
                    border: 1px solid rgba(255, 165, 0, 0.3);
                ">
                    <div style="font-size: 14px; color: #ffa500; margin-bottom: 5px;">Опыт получен</div>
                    <div style="font-size: 24px; color: #ffa500; font-weight: bold;">+${expGained} XP</div>
                </div>
            ` : ''}

            <!-- Статистика -->
            <div style="
                background: rgba(0, 0, 0, 0.2);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
            ">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; font-size: 12px;">
                    <div>
                        <div style="color: #aaa;">Побед</div>
                        <div style="color: #4CAF50; font-size: 18px; font-weight: bold;">${window.userData?.wins || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa;">Поражений</div>
                        <div style="color: #f44336; font-size: 18px; font-weight: bold;">${window.userData?.losses || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa;">Всего боёв</div>
                        <div style="color: #7289da; font-size: 18px; font-weight: bold;">${window.userData?.total_battles || 0}</div>
                    </div>
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 10px;">
                <button style="
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    background: #7289da;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='#5a6ebd'"
                onmouseout="this.style.background='#7289da'"
                onclick="closeBattleResult(); window.showOpponentSelection()">
                    ⚔️ Новый бой
                </button>

                <button style="
                    flex: 1;
                    padding: 12px;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    background: transparent;
                    color: #7289da;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='rgba(114, 137, 218, 0.1)'"
                onmouseout="this.style.background='transparent'"
                onclick="closeBattleResult()">
                    🏠 Вернуться
                </button>
            </div>
        </div>
    `;

    // Создаём модалку
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.id = 'battle-result-modal';
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2001;';

    const overlay = document.createElement('div');
    overlay.id = 'battle-result-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 2000;';

    // Не закрываем по клику на оверлей - игрок должен выбрать действие

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    window.currentBattleResultModal = { modal, overlay };

    console.log(`📊 Показан экран результатов: ${result}, рейтинг: ${ratingChangeText}`);
}

/**
 * Закрыть экран результатов
 */
function closeBattleResult() {
    const modal = document.getElementById('battle-result-modal');
    const overlay = document.getElementById('battle-result-overlay');

    if (modal) modal.remove();
    if (overlay) overlay.remove();

    if (window.currentBattleResultModal) {
        window.currentBattleResultModal = null;
    }

    // Закрываем поле боя если оно открыто
    if (typeof window.closeBattleField === 'function') {
        window.closeBattleField();
    }
}

// Экспорт
window.showBattleResult = showBattleResult;
window.closeBattleResult = closeBattleResult;

console.log('💡 Система результатов боя готова!');
