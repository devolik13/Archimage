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
        battleDuration = 0,
        earlyExit = false // Флаг преждевременного выхода
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
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            background: ${bgColor};
            border-radius: 15px;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        ">
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 48px; margin-bottom: 5px;">${titleIcon}</div>
                <h2 style="
                    margin: 0;
                    font-size: 24px;
                    color: ${titleColor};
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                ">${titleText}</h2>
            </div>

            <!-- Предупреждение о преждевременном выходе -->
            ${earlyExit ? `
                <div style="
                    background: rgba(255, 165, 0, 0.2);
                    border: 2px solid #ffa500;
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    text-align: center;
                ">
                    <div style="font-size: 14px; color: #ffa500; font-weight: bold; margin-bottom: 5px;">
                        ℹ️ Досрочный выход из боя
                    </div>
                    <div style="font-size: 12px; color: #ffd699; line-height: 1.4;">
                        Бой был просчитан до конца автоматически. Результат соответствует реальному исходу сражения.
                    </div>
                </div>
            ` : ''}

            <!-- Информация о противнике -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 10px;
                border-radius: 10px;
                margin-bottom: 15px;
                text-align: center;
            ">
                <div style="font-size: 12px; color: #aaa; margin-bottom: 3px;">Противник</div>
                <div style="font-size: 16px; font-weight: bold; color: white;">${opponentName}</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 3px;">Рейтинг: ${opponentRating}</div>
            </div>

            <!-- Изменение рейтинга -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 12px;
                border-radius: 10px;
                margin-bottom: 12px;
            ">
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center;">
                    <!-- Текущий рейтинг -->
                    <div style="text-align: center;">
                        <div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">Было</div>
                        <div style="font-size: 16px; color: #7289da; font-weight: bold;">${currentRating}</div>
                    </div>

                    <!-- Изменение (по центру) -->
                    <div style="text-align: center;">
                        <div style="font-size: 20px; color: ${ratingColor}; font-weight: bold;">
                            ${ratingChangeText}
                        </div>
                    </div>

                    <!-- Новый рейтинг -->
                    <div style="text-align: center;">
                        <div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">Стало</div>
                        <div style="font-size: 16px; color: ${titleColor}; font-weight: bold;">${newRating}</div>
                    </div>
                </div>

                <!-- Лига -->
                <div style="
                    text-align: center;
                    margin-top: 10px;
                    padding: 8px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                ">
                    <div style="font-size: 12px; color: #ffa500;">${leagueInfo}</div>
                </div>
            </div>

            <!-- Награды (если есть) -->
            ${expGained > 0 ? `
                <div style="
                    background: rgba(255, 165, 0, 0.1);
                    padding: 10px;
                    border-radius: 10px;
                    margin-bottom: 12px;
                    text-align: center;
                    border: 1px solid rgba(255, 165, 0, 0.3);
                ">
                    <div style="font-size: 12px; color: #ffa500; margin-bottom: 3px;">Опыт получен</div>
                    <div style="font-size: 18px; color: #ffa500; font-weight: bold;">+${expGained} XP</div>
                </div>
            ` : ''}

            <!-- Статистика -->
            <div style="
                background: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border-radius: 10px;
                margin-bottom: 12px;
            ">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 10px;">
                    <div>
                        <div style="color: #aaa;">Побед</div>
                        <div style="color: #4CAF50; font-size: 16px; font-weight: bold;">${window.userData?.wins || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa;">Поражений</div>
                        <div style="color: #f44336; font-size: 16px; font-weight: bold;">${window.userData?.losses || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa;">Всего боёв</div>
                        <div style="color: #7289da; font-size: 16px; font-weight: bold;">${window.userData?.total_battles || 0}</div>
                    </div>
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 8px;">
                <button style="
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    background: #7289da;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
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
                    padding: 10px;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    background: transparent;
                    color: #7289da;
                    cursor: pointer;
                    font-size: 14px;
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
    console.log('🚪 Закрытие экрана результатов боя');

    const modal = document.getElementById('battle-result-modal');
    const overlay = document.getElementById('battle-result-overlay');

    if (modal) {
        modal.remove();
        console.log('✅ battle-result-modal удален');
    }
    if (overlay) {
        overlay.remove();
        console.log('✅ battle-result-overlay удален');
    }

    if (window.currentBattleResultModal) {
        window.currentBattleResultModal = null;
    }

    // ВАЖНО: Проверяем, нужна ли дополнительная очистка
    // При досрочном выходе cleanupBattleResources уже был вызван
    const needsCleanup = document.getElementById('battle-field-modal') !== null;

    if (needsCleanup) {
        console.log('🧹 Требуется очистка ресурсов боя');
        if (typeof window.cleanupBattleResources === 'function') {
            window.cleanupBattleResources();
        }
    } else {
        console.log('✅ Ресурсы боя уже очищены (досрочный выход)');
    }

    // Возвращаемся в город
    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    } else if (typeof window.closeBattleField === 'function') {
        window.closeBattleField();
    }

    console.log('✅ Экран результатов закрыт');
}

// Экспорт
window.showBattleResult = showBattleResult;
window.closeBattleResult = closeBattleResult;

console.log('💡 Система результатов боя готова!');
