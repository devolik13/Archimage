// battle/battle-result-screen.js - Экран результатов боя
console.log('✅ battle-result-screen.js загружен');

/**
 * Показать экран результатов боя
 * @param {string} result - 'win' или 'loss'
 * @param {object} battleData - Данные о бое
 */
function showBattleResult(result, battleData = {}) {
    console.log('🎬 showBattleResult вызвана!');
    console.log('   result:', result);
    console.log('   battleData:', battleData);
    console.log('   Стек вызова:', new Error().stack);

    const {
        opponentName = 'Противник',
        opponentRating = 1000,
        ratingChange = 0,
        rewards = {},
        battleDuration = 0,
        earlyExit = false // Флаг преждевременного выхода
    } = battleData;

    console.log('   earlyExit:', earlyExit);

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
                <button class="battle-result-new-fight" style="
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
                onmouseout="this.style.background='#7289da'">
                    ⚔️ Новый бой
                </button>

                <button class="battle-result-return" style="
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
                onmouseout="this.style.background='transparent'">
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

    console.log('🔍 Модальное окно добавлено в DOM');
    console.log('   modal.children.length:', modal.children.length);
    console.log('   modal.querySelector проверка...');

    // ВАЖНО: Навешиваем обработчики событий после добавления в DOM
    // Используем setTimeout чтобы дать браузеру время распарсить innerHTML
    setTimeout(() => {
        console.log('⏱️ setTimeout сработал, ищем кнопки...');

        const newFightBtn = modal.querySelector('.battle-result-new-fight');
        const returnBtn = modal.querySelector('.battle-result-return');
        const allButtons = modal.querySelectorAll('button');

        console.log('   Найдено кнопок всего:', allButtons.length);
        console.log('   newFightBtn:', !!newFightBtn);
        console.log('   returnBtn:', !!returnBtn);

        if (newFightBtn) {
            console.log('✅ Навешиваем обработчик на "Новый бой"');
            newFightBtn.addEventListener('click', () => {
                console.log('🎮 КЛИК по кнопке "Новый бой"');
                window.closeBattleResult();
                if (typeof window.showOpponentSelection === 'function') {
                    window.showOpponentSelection();
                }
            });
            // Тест - навешиваем еще и через onclick для надежности
            newFightBtn.onclick = () => {
                console.log('🎮 ONCLICK по кнопке "Новый бой"');
                window.closeBattleResult();
                if (typeof window.showOpponentSelection === 'function') {
                    window.showOpponentSelection();
                }
            };
        } else {
            console.error('❌ Кнопка "Новый бой" не найдена!');
        }

        if (returnBtn) {
            console.log('✅ Навешиваем обработчик на "Вернуться"');
            returnBtn.addEventListener('click', () => {
                console.log('🏠 КЛИК по кнопке "Вернуться"');
                window.closeBattleResult();
            });
            // Тест - навешиваем еще и через onclick для надежности
            returnBtn.onclick = () => {
                console.log('🏠 ONCLICK по кнопке "Вернуться"');
                window.closeBattleResult();
            };
        } else {
            console.error('❌ Кнопка "Вернуться" не найдена!');
        }

        console.log('✅ Обработчики событий навешены');
    }, 100); // Даем время на рендер

    window.currentBattleResultModal = { modal, overlay };

    console.log(`📊 Показан экран результатов: ${result}, рейтинг: ${ratingChangeText}`);
}

/**
 * Закрыть экран результатов
 */
function closeBattleResult() {
    console.log('🚪 closeBattleResult вызван');
    console.log('   Стек вызова:', new Error().stack);

    try {
        const modal = document.getElementById('battle-result-modal');
        const overlay = document.getElementById('battle-result-overlay');

        console.log('   modal найден:', !!modal);
        console.log('   overlay найден:', !!overlay);

        if (modal) {
            modal.remove();
            console.log('✅ battle-result-modal удален');
        } else {
            console.warn('⚠️ battle-result-modal не найден в DOM');
        }

        if (overlay) {
            overlay.remove();
            console.log('✅ battle-result-overlay удален');
        } else {
            console.warn('⚠️ battle-result-overlay не найден в DOM');
        }

        if (window.currentBattleResultModal) {
            window.currentBattleResultModal = null;
            console.log('✅ currentBattleResultModal очищен');
        }

        // ВАЖНО: Проверяем, нужна ли дополнительная очистка
        // При досрочном выходе cleanupBattleResources уже был вызван
        const battleFieldModal = document.getElementById('battle-field-modal');
        const needsCleanup = battleFieldModal !== null;

        console.log('   battle-field-modal существует:', !!battleFieldModal);
        console.log('   needsCleanup:', needsCleanup);

        if (needsCleanup) {
            console.log('🧹 Требуется очистка ресурсов боя');
            if (typeof window.cleanupBattleResources === 'function') {
                window.cleanupBattleResources();
            } else {
                console.error('❌ cleanupBattleResources не найдена');
            }
        } else {
            console.log('✅ Ресурсы боя уже очищены (досрочный выход)');
        }

        // Возвращаемся в город
        console.log('🏙️ Попытка вернуться в город...');
        if (typeof window.returnToCity === 'function') {
            window.returnToCity();
        } else if (typeof window.closeBattleField === 'function') {
            console.log('   Используем closeBattleField вместо returnToCity');
            window.closeBattleField();
        } else {
            console.error('❌ Ни returnToCity, ни closeBattleField не найдены!');
        }

        console.log('✅ closeBattleResult завершен успешно');
    } catch (error) {
        console.error('❌ Ошибка в closeBattleResult:', error);
        console.error('   Stack:', error.stack);
    }
}

// Экспорт
window.showBattleResult = showBattleResult;
window.closeBattleResult = closeBattleResult;

console.log('💡 Система результатов боя готова!');
