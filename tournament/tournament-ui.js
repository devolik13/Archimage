// tournament/tournament-ui.js - Интерфейс чемпионата для игроков
// Адаптировано из окна дуэли (opponent-selection.js)

/**
 * Показать главное окно чемпионата
 * Вызывается из меню арены
 */
async function showTournamentUI() {
    // Закрываем другие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    const overlay = document.createElement('div');
    overlay.id = 'tournament-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    // Показываем загрузку
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 30px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 24px; margin-bottom: 10px;">🏆</div>
            <div style="color: #ffd700;">Загрузка чемпионата...</div>
        </div>
    `;

    document.body.appendChild(overlay);

    try {
        // Ищем активный турнир
        const tm = window.tournamentManager;
        if (!tm?.supabase) {
            tm?.init();
        }

        const tournament = await tm.getActiveTournament();

        if (!tournament) {
            // Нет активного турнира
            showTournamentNoActive(overlay);
            return;
        }

        // Получаем статус текущего игрока
        const myStatus = await tm.getMyTournamentStatus(tournament.id);

        if (tournament.status === 'registration') {
            // Фаза регистрации
            showTournamentRegistration(overlay, tournament, myStatus);
        } else {
            // Турнир идёт или завершён
            showTournamentProgress(overlay, tournament, myStatus);
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки турнира:', error);
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 25px;
                max-width: 350px;
                width: 90%;
                text-align: center;
                color: white;
            ">
                <div style="font-size: 20px; color: #ff6b6b; margin-bottom: 15px;">Ошибка загрузки</div>
                <button onclick="closeTournamentUI()" style="
                    padding: 10px 20px;
                    background: rgba(255,100,100,0.3);
                    border: 1px solid rgba(255,100,100,0.5);
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>
        `;
    }
}

/**
 * Нет активного турнира
 */
function showTournamentNoActive(overlay) {
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #555;
            border-radius: 15px;
            padding: 25px;
            max-width: 350px;
            width: 90%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 40px; margin-bottom: 10px;">🏆</div>
            <h3 style="color: #ffd700; margin: 0 0 15px 0;">Чемпионат</h3>
            <p style="color: #aaa; font-size: 13px; margin-bottom: 20px;">
                Сейчас нет активных чемпионатов.<br>
                Следите за объявлениями!
            </p>
            <button onclick="closeTournamentUI()" style="
                padding: 10px 25px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
            ">Закрыть</button>
        </div>
    `;
}

/**
 * Фаза регистрации
 */
function showTournamentRegistration(overlay, tournament, myStatus) {
    const isRegistered = myStatus?.registered;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 40px; margin-bottom: 5px;">🏆</div>
            <h3 style="color: #ffd700; margin: 0 0 5px 0;">${tournament.name}</h3>
            <div style="
                background: rgba(255,215,0,0.1);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 8px;
                padding: 8px;
                margin-bottom: 15px;
                font-size: 12px;
                color: #ffd700;
            ">
                Регистрация открыта
                ${tournament.total_participants > 0 ? ` • ${tournament.total_participants} участников` : ''}
            </div>

            ${isRegistered ? `
                <div style="
                    background: rgba(74, 222, 128, 0.15);
                    border: 1px solid rgba(74, 222, 128, 0.4);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 15px;
                ">
                    <div style="color: #4ade80; font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                        ✅ Вы зарегистрированы!
                    </div>
                    <div style="color: #aaa; font-size: 12px;">
                        Формация зафиксирована. Ожидайте начала турнира.
                    </div>
                </div>

                <button onclick="closeTournamentUI()" style="
                    padding: 10px 25px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            ` : `
                <p style="color: #aaa; font-size: 13px; margin-bottom: 15px;">
                    Зарегистрируйтесь, чтобы участвовать!<br>
                    <span style="color: #ffa500; font-size: 11px;">
                        Ваша текущая формация будет зафиксирована до конца турнира.
                    </span>
                </p>

                <div style="display: flex; gap: 10px;">
                    <button id="tournament-register-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #ffd700, #f59e0b);
                        border: none;
                        border-radius: 8px;
                        color: #1a1a2e;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                    ">🏆 Регистрация</button>
                    <button onclick="closeTournamentUI()" style="
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
            `}
        </div>
    `;

    // Обработчик регистрации
    const regBtn = document.getElementById('tournament-register-btn');
    if (regBtn) {
        regBtn.onclick = async () => {
            regBtn.disabled = true;
            regBtn.textContent = 'Регистрация...';

            const result = await window.tournamentManager.registerCurrentPlayer(tournament.id);
            if (result) {
                // Перезагружаем UI
                const newStatus = await window.tournamentManager.getMyTournamentStatus(tournament.id);
                showTournamentRegistration(overlay, tournament, newStatus);
            } else {
                regBtn.disabled = false;
                regBtn.textContent = '🏆 Регистрация';
            }
        };
    }
}

/**
 * Прогресс турнира (основной экран для игрока)
 */
function showTournamentProgress(overlay, tournament, myStatus) {
    const isEliminated = myStatus?.eliminated;
    const currentMatch = myStatus?.currentMatch;
    const roundName = myStatus?.roundName || '';
    const visibleRound = tournament.visible_round || 0;

    // Определяем противника
    const playerId = window.dbManager?.getTelegramId();
    let opponentName = null;
    let opponentId = null;
    let isPlayer1 = false;

    if (currentMatch) {
        isPlayer1 = currentMatch.player1_id === playerId;
        opponentName = isPlayer1 ? currentMatch.player2_name : currentMatch.player1_name;
        opponentId = isPlayer1 ? currentMatch.player2_id : currentMatch.player1_id;
    }

    // Определяем результат матча (если виден)
    let matchResultText = '';
    let matchResultColor = '#aaa';
    if (currentMatch?.match_status === 'visible' && currentMatch?.winner_id) {
        const isWinner = currentMatch.winner_id === playerId;
        matchResultText = isWinner ? '🏆 Победа!' : '💀 Поражение';
        matchResultColor = isWinner ? '#4ade80' : '#ff6b6b';
    }

    // Реплеи текущего матча
    let replaysHTML = '';
    if (currentMatch?.match_status === 'visible' && (currentMatch.fight1_log || currentMatch.fight2_log)) {
        replaysHTML = `
            <div style="margin-top: 12px;">
                <div style="color: #aaa; font-size: 11px; margin-bottom: 6px;">Реплеи:</div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    ${currentMatch.fight1_log ? `
                        <button onclick="showTournamentReplay('${currentMatch.id}', 1)" style="
                            padding: 8px 14px;
                            background: rgba(255,165,0,0.2);
                            border: 1px solid #ffa500;
                            border-radius: 6px;
                            color: #ffa500;
                            font-size: 12px;
                            cursor: pointer;
                        ">📜 Бой 1</button>
                    ` : ''}
                    ${currentMatch.fight2_log ? `
                        <button onclick="showTournamentReplay('${currentMatch.id}', 2)" style="
                            padding: 8px 14px;
                            background: rgba(255,165,0,0.2);
                            border: 1px solid #ffa500;
                            border-radius: 6px;
                            color: #ffa500;
                            font-size: 12px;
                            cursor: pointer;
                        ">📜 Бой 2</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Список всех видимых матчей (реплеи любого боя)
    let allMatchesBtn = '';
    if (visibleRound > 0) {
        allMatchesBtn = `
            <button onclick="showTournamentAllMatches('${tournament.id}')" style="
                width: 100%;
                padding: 10px;
                background: rgba(114,137,218,0.2);
                border: 1px solid rgba(114,137,218,0.5);
                border-radius: 8px;
                color: #7289da;
                font-size: 13px;
                cursor: pointer;
                margin-top: 10px;
            ">📋 Все матчи раунда</button>
        `;
    }

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid ${isEliminated ? '#ff6b6b' : '#ffd700'};
            border-radius: 15px;
            padding: 20px;
            max-width: 420px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 30px; margin-bottom: 5px;">🏆</div>
                <h3 style="color: #ffd700; margin: 0; font-size: 18px;">${tournament.name}</h3>
                <div style="color: #888; font-size: 11px; margin-top: 3px;">
                    ${tournament.total_participants} участников • Раунд ${tournament.current_round}/${tournament.total_rounds}
                </div>
            </div>

            <!-- Статус игрока -->
            <div style="
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 12px;
                text-align: center;
            ">
                ${isEliminated ? `
                    <div style="color: #ff6b6b; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
                        Вы выбыли в раунде ${myStatus.participant.eliminated_in_round}
                    </div>
                    <div style="color: #aaa; font-size: 12px;">
                        Но вы можете смотреть реплеи всех боёв!
                    </div>
                ` : `
                    <div style="
                        color: #ffd700;
                        font-size: 22px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    ">${roundName}</div>
                    <div style="color: #aaa; font-size: 12px;">Ваш этап</div>
                `}
            </div>

            <!-- Текущий матч -->
            ${currentMatch && !isEliminated ? `
                <div style="
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,215,0,0.3);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 12px;
                ">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <div style="color: #aaa; font-size: 11px;">Ваш противник:</div>
                        <div style="color: white; font-size: 18px; font-weight: bold; margin-top: 5px;">
                            ${opponentName || 'Ожидание...'}
                        </div>
                    </div>

                    <!-- Результаты боёв -->
                    ${currentMatch.match_status === 'visible' ? `
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 8px;
                            margin-bottom: 8px;
                        ">
                            <div style="
                                background: rgba(0,0,0,0.3);
                                border-radius: 6px;
                                padding: 8px;
                                text-align: center;
                            ">
                                <div style="color: #aaa; font-size: 10px;">Бой 1 (вы атакуете)</div>
                                <div style="color: ${getFightResultColor(currentMatch.fight1_result, isPlayer1)}; font-size: 13px; font-weight: bold; margin-top: 3px;">
                                    ${getFightResultText(currentMatch.fight1_result, isPlayer1)}
                                </div>
                            </div>
                            <div style="
                                background: rgba(0,0,0,0.3);
                                border-radius: 6px;
                                padding: 8px;
                                text-align: center;
                            ">
                                <div style="color: #aaa; font-size: 10px;">Бой 2 (враг атакует)</div>
                                <div style="color: ${getFightResultColor(currentMatch.fight2_result, isPlayer1)}; font-size: 13px; font-weight: bold; margin-top: 3px;">
                                    ${getFightResultText(currentMatch.fight2_result, isPlayer1)}
                                </div>
                            </div>
                        </div>

                        <!-- Итог матча -->
                        <div style="
                            text-align: center;
                            padding: 8px;
                            background: rgba(0,0,0,0.2);
                            border-radius: 6px;
                            font-size: 16px;
                            font-weight: bold;
                            color: ${matchResultColor};
                        ">${matchResultText}</div>
                    ` : `
                        <div style="text-align: center; color: #888; font-size: 12px;">
                            ${currentMatch.match_status === 'calculated'
                                ? '⏳ Результат скоро будет объявлен...'
                                : '⏳ Бой ещё не рассчитан...'}
                        </div>
                    `}

                    ${replaysHTML}
                </div>
            ` : ''}

            <!-- Кнопки -->
            ${allMatchesBtn}

            <button onclick="closeTournamentUI()" style="
                width: 100%;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                margin-top: 10px;
            ">Закрыть</button>
        </div>
    `;
}

/**
 * Показать все матчи раунда
 */
async function showTournamentAllMatches(tournamentId) {
    const overlay = document.getElementById('tournament-overlay');
    if (!overlay) return;

    const tm = window.tournamentManager;
    const tournament = await tm.getTournament(tournamentId);
    if (!tournament) return;

    // Загружаем видимые раунды
    let allMatches = [];
    for (let r = 1; r <= tournament.visible_round; r++) {
        const matches = await tm.getVisibleMatches(tournamentId, r);
        allMatches.push({ round: r, matches });
    }

    // Генерируем HTML
    let matchesHTML = '';
    for (const roundData of allMatches) {
        const roundName = tm.getRoundName(roundData.round, tournament.total_rounds);
        matchesHTML += `
            <div style="margin-bottom: 15px;">
                <div style="color: #ffd700; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                    ${roundName}
                </div>
        `;

        for (const match of roundData.matches) {
            const winnerIsP1 = match.winner_id === match.player1_id;
            const p1Color = winnerIsP1 ? '#4ade80' : '#ff6b6b';
            const p2Color = !winnerIsP1 ? '#4ade80' : '#ff6b6b';

            matchesHTML += `
                <div style="
                    background: rgba(0,0,0,0.3);
                    border-radius: 6px;
                    padding: 8px 10px;
                    margin-bottom: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                ">
                    <span style="color: ${p1Color};">${match.player1_name || 'bye'}</span>
                    <span style="color: #555;">vs</span>
                    <span style="color: ${p2Color};">${match.player2_name || 'bye'}</span>
                    <div style="display: flex; gap: 4px;">
                        ${match.fight1_log ? `
                            <button onclick="showTournamentReplay('${match.id}', 1)" style="
                                padding: 3px 6px;
                                background: rgba(255,165,0,0.2);
                                border: 1px solid rgba(255,165,0,0.5);
                                border-radius: 4px;
                                color: #ffa500;
                                font-size: 10px;
                                cursor: pointer;
                            ">1</button>
                        ` : ''}
                        ${match.fight2_log ? `
                            <button onclick="showTournamentReplay('${match.id}', 2)" style="
                                padding: 3px 6px;
                                background: rgba(255,165,0,0.2);
                                border: 1px solid rgba(255,165,0,0.5);
                                border-radius: 4px;
                                color: #ffa500;
                                font-size: 10px;
                                cursor: pointer;
                            ">2</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        matchesHTML += '</div>';
    }

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            max-width: 450px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <h3 style="color: #ffd700; margin: 0 0 15px 0; text-align: center;">
                📋 Матчи: ${tournament.name}
            </h3>

            ${matchesHTML || '<div style="color: #888; text-align: center;">Нет видимых матчей</div>'}

            <button onclick="showTournamentUI()" style="
                width: 100%;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                margin-top: 10px;
            ">← Назад</button>
        </div>
    `;
}

/**
 * Показать реплей боя (текстовый лог)
 */
async function showTournamentReplay(matchId, fightNumber) {
    const tm = window.tournamentManager;
    const match = await tm.getMatchReplay(matchId);

    if (!match) {
        alert('Реплей недоступен');
        return;
    }

    const log = fightNumber === 1 ? match.fight1_log : match.fight2_log;
    const summary = fightNumber === 1 ? match.fight1_summary : match.fight2_summary;
    const result = fightNumber === 1 ? match.fight1_result : match.fight2_result;

    if (!log || !Array.isArray(log)) {
        alert('Лог боя пуст');
        return;
    }

    // Используем существующий showBattleLogFullscreen но с турнирным логом
    // Подменяем window.battleLog и вызываем
    const savedLog = window.battleLog;
    window.battleLog = log;

    if (typeof window.showBattleLogFullscreen === 'function') {
        window.showBattleLogFullscreen();
    }

    // Восстанавливаем
    window.battleLog = savedLog;
}

/**
 * Закрыть UI турнира
 */
function closeTournamentUI() {
    const overlay = document.getElementById('tournament-overlay');
    if (overlay) overlay.remove();
}

// ═══════════════════════════════════════
// Утилиты
// ═══════════════════════════════════════

function getFightResultText(result, isPlayer1) {
    if (!result) return '—';
    if (result === 'draw') return 'Ничья';
    if ((result === 'player1' && isPlayer1) || (result === 'player2' && !isPlayer1)) {
        return 'Победа';
    }
    return 'Поражение';
}

function getFightResultColor(result, isPlayer1) {
    if (!result) return '#888';
    if (result === 'draw') return '#ffa500';
    if ((result === 'player1' && isPlayer1) || (result === 'player2' && !isPlayer1)) {
        return '#4ade80';
    }
    return '#ff6b6b';
}

// ═══════════════════════════════════════
// Секретная кнопка — точка входа из магазина
// ═══════════════════════════════════════

/**
 * Показать окно чемпионата (вход через секретную кнопку в магазине)
 * 3 кнопки: Правила, Регистрация, Назад
 */
function showSecretTournamentEntry() {
    // Закрываем магазин если открыт
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    const overlay = document.createElement('div');
    overlay.id = 'tournament-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            max-width: 380px;
            width: 90%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 48px; margin-bottom: 8px;">🏆</div>
            <h3 style="color: #ffd700; margin: 0 0 8px 0; font-size: 20px;">Чемпионат Архимагов</h3>
            <p style="color: #aaa; font-size: 12px; margin: 0 0 20px 0;">
                Сражайтесь с лучшими магами в турнирной сетке
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Правила -->
                <button id="secret-btn-rules" style="
                    padding: 14px;
                    background: rgba(114, 137, 218, 0.25);
                    border: 1px solid rgba(114, 137, 218, 0.6);
                    border-radius: 10px;
                    color: #7289da;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                ">📜 Правила</button>

                <!-- Регистрация -->
                <button id="secret-btn-register" style="
                    padding: 14px;
                    background: linear-gradient(135deg, rgba(255,215,0,0.25), rgba(245,158,11,0.25));
                    border: 1px solid rgba(255,215,0,0.6);
                    border-radius: 10px;
                    color: #ffd700;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                ">⚔️ Регистрация</button>

                <!-- Назад -->
                <button id="secret-btn-back" style="
                    padding: 12px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 14px;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Обработчики
    document.getElementById('secret-btn-rules').onclick = () => {
        showTournamentRules(overlay);
    };

    document.getElementById('secret-btn-register').onclick = () => {
        // Шаг 1: Спросить, прочитали ли правила
        showTournamentConfirmRules(overlay);
    };

    document.getElementById('secret-btn-back').onclick = () => {
        overlay.remove();
    };
}

/**
 * Показать правила чемпионата
 */
function showTournamentRules(overlay) {
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #7289da;
            border-radius: 15px;
            padding: 22px;
            max-width: 400px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <h3 style="color: #ffd700; margin: 0 0 15px 0; text-align: center; font-size: 18px;">
                📜 Правила чемпионата
            </h3>

            <div style="font-size: 13px; line-height: 1.6; color: #ccc;">
                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">⚔️ Формат</div>
                    Олимпийская система (Single Elimination).<br>
                    Проиграл — выбываешь. Победитель идёт дальше.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">🧙 Формация</div>
                    При регистрации вы расставляете ровно <span style="color: #fff; font-weight: bold;">3 магов</span> на поле.<br>
                    Выбирайте любых из своих магов — решать вам.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">📖 Заклинания</div>
                    Доступны заклинания только <span style="color: #fff; font-weight: bold;">до 3 тира</span> включительно.<br>
                    Заклинания выше 3 тира недоступны для выбора.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">❤️ Здоровье</div>
                    У всех магов одинаковый порог ХП — <span style="color: #fff; font-weight: bold;">500</span>.<br>
                    Неважно какой уровень мага — ХП всегда 500.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">🎯 Матчи</div>
                    Каждый матч — 2 боя:<br>
                    • Бой 1 — вы атакуете противника<br>
                    • Бой 2 — противник атакует вас<br>
                    Побеждает тот, кто выиграл больше боёв.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">⚖️ Ничья 1:1</div>
                    Если каждый выиграл по одному бою — побеждает тот, кто нанёс <span style="color: #fff; font-weight: bold;">больше суммарного урона</span> за оба боя.
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">🚫 Ограничения</div>
                    • Бонусы гильдий <span style="color: #ff6b6b;">не действуют</span><br>
                    • Изменения магов в турнире изолированы — на основную игру не влияют
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">🔒 Изоляция</div>
                    Все правила боя и эффекты заклинаний работают как обычно.<br>
                    Но ХП и заклинания турнира — отдельная копия, не затрагивающая вашу основную игру.
                </div>

                <div style="
                    background: rgba(255,165,0,0.1);
                    border: 1px solid rgba(255,165,0,0.3);
                    border-radius: 8px;
                    padding: 10px;
                    font-size: 12px;
                    color: #ffa500;
                ">
                    💡 Выберите 3 лучших магов и поставьте им заклинания до 3 тира!
                </div>
            </div>

            <button onclick="showSecretTournamentEntry(); document.getElementById('tournament-overlay')?.remove();" style="
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                color: #888;
                font-size: 14px;
                cursor: pointer;
                margin-top: 15px;
            ">← Назад</button>
        </div>
    `;

    // Кнопка "Назад" — удаляем оверлей и открываем заново главное окно
    const backBtn = overlay.querySelector('button:last-child');
    backBtn.onclick = () => {
        overlay.remove();
        showSecretTournamentEntry();
    };
}

// ═══════════════════════════════════════
// Пошаговая регистрация на турнир
// ═══════════════════════════════════════

// Временные данные регистрации (сбрасываются при закрытии)
let tournamentRegData = {
    selectedMages: [],      // Индексы выбранных магов (3 шт)
    mageSpells: {}          // { wizardIndex: [spellId1, spellId2] }
};

/**
 * Шаг 1: Прочитали ли вы правила?
 */
function showTournamentConfirmRules(overlay) {
    // Сброс данных регистрации
    tournamentRegData = { selectedMages: [], mageSpells: {} };

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            max-width: 380px;
            width: 90%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 40px; margin-bottom: 10px;">📜</div>
            <h3 style="color: #ffd700; margin: 0 0 12px 0; font-size: 18px;">Подтверждение</h3>
            <p style="color: #ccc; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
                Вы ознакомились с правилами чемпионата?
            </p>

            <div style="display: flex; gap: 10px;">
                <button id="rules-confirm-yes" style="
                    flex: 1;
                    padding: 14px;
                    background: linear-gradient(135deg, rgba(74,222,128,0.25), rgba(74,222,128,0.15));
                    border: 1px solid rgba(74,222,128,0.6);
                    border-radius: 10px;
                    color: #4ade80;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                ">Да</button>
                <button id="rules-confirm-no" style="
                    flex: 1;
                    padding: 14px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 15px;
                    cursor: pointer;
                ">Нет</button>
            </div>
        </div>
    `;

    document.getElementById('rules-confirm-yes').onclick = () => {
        showTournamentSelectMages(overlay);
    };

    document.getElementById('rules-confirm-no').onclick = () => {
        overlay.remove();
        showSecretTournamentEntry();
    };
}

/**
 * Шаг 2: Выбор 3 магов
 */
function showTournamentSelectMages(overlay) {
    const wizards = window.userData?.wizards || [];

    if (wizards.length < 3) {
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 25px;
                max-width: 380px;
                width: 90%;
                text-align: center;
                color: white;
            ">
                <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                <h3 style="color: #ff6b6b; margin: 0 0 12px 0;">Недостаточно магов</h3>
                <p style="color: #aaa; font-size: 13px; margin: 0 0 20px 0;">
                    Для участия в чемпионате нужно минимум 3 мага.<br>
                    У вас сейчас: ${wizards.length}
                </p>
                <button id="mages-back-btn" style="
                    padding: 12px 25px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 14px;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        `;
        document.getElementById('mages-back-btn').onclick = () => {
            overlay.remove();
            showSecretTournamentEntry();
        };
        return;
    }

    // Рендер карточек магов
    let magesHTML = '';
    wizards.forEach((wizard, index) => {
        const factionEmoji = window.FACTION_EMOJIS?.[wizard.faction] || '🧙‍♂️';
        const factionColor = window.FACTION_COLORS?.[wizard.faction] || '#7289da';
        const level = wizard.level || 1;

        magesHTML += `
            <div class="tournament-mage-card" data-index="${index}" style="
                background: rgba(0,0,0,0.3);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 12px;
                cursor: pointer;
                transition: border-color 0.2s, background 0.2s;
                text-align: center;
            ">
                <div style="font-size: 28px; margin-bottom: 4px;">${factionEmoji}</div>
                <div style="color: #fff; font-size: 13px; font-weight: bold; margin-bottom: 2px;">
                    ${wizard.name || 'Маг ' + (index + 1)}
                </div>
                <div style="color: ${factionColor}; font-size: 11px;">
                    Ур. ${level}
                </div>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 22px;
            max-width: 420px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <h3 style="color: #ffd700; margin: 0 0 5px 0; text-align: center; font-size: 18px;">
                🧙 Выбор магов
            </h3>
            <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0 0 15px 0;">
                Выберите <span style="color: #ffd700; font-weight: bold;">3 магов</span> для турнира
            </p>

            <div id="tournament-mages-selected" style="
                text-align: center;
                color: #ffd700;
                font-size: 13px;
                margin-bottom: 10px;
            ">Выбрано: 0 / 3</div>

            <div id="tournament-mages-grid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 15px;
            ">
                ${magesHTML}
            </div>

            <div id="tournament-mages-error" style="
                color: #ff6b6b;
                font-size: 12px;
                text-align: center;
                margin-bottom: 10px;
                display: none;
            "></div>

            <div style="display: flex; gap: 10px;">
                <button id="mages-next-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(245,158,11,0.3));
                    border: 1px solid rgba(255,215,0,0.5);
                    border-radius: 10px;
                    color: #ffd700;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    opacity: 0.4;
                ">Далее →</button>
                <button id="mages-back-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 14px;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        </div>
    `;

    // Логика выбора магов
    const selected = new Set();
    const cards = overlay.querySelectorAll('.tournament-mage-card');
    const counterEl = document.getElementById('tournament-mages-selected');
    const nextBtn = document.getElementById('mages-next-btn');
    const errorEl = document.getElementById('tournament-mages-error');

    cards.forEach(card => {
        card.onclick = () => {
            const idx = parseInt(card.dataset.index);
            if (selected.has(idx)) {
                selected.delete(idx);
                card.style.borderColor = 'rgba(255,255,255,0.1)';
                card.style.background = 'rgba(0,0,0,0.3)';
            } else {
                if (selected.size >= 3) {
                    errorEl.textContent = 'Можно выбрать только 3 магов!';
                    errorEl.style.display = 'block';
                    return;
                }
                selected.add(idx);
                card.style.borderColor = '#ffd700';
                card.style.background = 'rgba(255,215,0,0.1)';
            }
            errorEl.style.display = 'none';
            counterEl.textContent = `Выбрано: ${selected.size} / 3`;
            nextBtn.style.opacity = selected.size === 3 ? '1' : '0.4';
        };
    });

    nextBtn.onclick = () => {
        if (selected.size !== 3) {
            errorEl.textContent = 'Выберите ровно 3 магов!';
            errorEl.style.display = 'block';
            return;
        }
        tournamentRegData.selectedMages = Array.from(selected);
        showTournamentSelectSpells(overlay);
    };

    document.getElementById('mages-back-btn').onclick = () => {
        overlay.remove();
        showSecretTournamentEntry();
    };
}

/**
 * Шаг 3: Выбор заклинаний для каждого мага (по 2 слота, макс тир 3)
 */
function showTournamentSelectSpells(overlay) {
    const wizards = window.userData?.wizards || [];
    const userSpells = window.userData?.spells || {};
    const selectedIndexes = tournamentRegData.selectedMages;

    // Собираем все изученные заклинания тир <= 3
    const availableSpells = [];
    const schools = ['fire', 'water', 'wind', 'earth', 'nature', 'poison', 'light', 'dark', 'necromant'];

    schools.forEach(school => {
        const schoolSpells = userSpells[school];
        if (!schoolSpells) return;
        Object.entries(schoolSpells).forEach(([spellId, spellData]) => {
            if (spellData.level > 0) {
                const tier = spellData.tier || getSpellTier(spellId) || 99;
                if (tier <= 3) {
                    availableSpells.push({
                        id: spellId,
                        name: window.SPELL_NAMES?.[spellId] || spellData.name || spellId,
                        level: spellData.level,
                        tier: tier,
                        school: school,
                        emoji: window.FACTION_EMOJIS?.[school] || '❓',
                        damage: typeof window.getSpellDamage === 'function'
                            ? window.getSpellDamage(spellId, spellData.level) : spellData.level * 10
                    });
                }
            }
        });
    });

    // Добавляем гибридные тир <= 3
    if (userSpells.hybrid) {
        Object.entries(userSpells.hybrid).forEach(([spellId, spellData]) => {
            if (spellData.level > 0) {
                const tier = spellData.tier || 99;
                if (tier <= 3) {
                    availableSpells.push({
                        id: spellId,
                        name: window.SPELL_NAMES?.[spellId] || spellData.name || spellId,
                        level: spellData.level,
                        tier: tier,
                        school: 'hybrid',
                        emoji: '🔮',
                        damage: typeof window.getHybridSpellDamage === 'function'
                            ? window.getHybridSpellDamage(spellId, spellData.level) : spellData.level * 15
                    });
                }
            }
        });
    }

    // Инициализация слотов (если ещё не выбрано)
    selectedIndexes.forEach(idx => {
        if (!tournamentRegData.mageSpells[idx]) {
            tournamentRegData.mageSpells[idx] = [null, null];
        }
    });

    // Рендер карточек магов с слотами заклинаний
    let magesHTML = '';
    selectedIndexes.forEach(idx => {
        const wizard = wizards[idx];
        const factionEmoji = window.FACTION_EMOJIS?.[wizard.faction] || '🧙‍♂️';
        const factionColor = window.FACTION_COLORS?.[wizard.faction] || '#7289da';
        const spell0 = tournamentRegData.mageSpells[idx][0];
        const spell1 = tournamentRegData.mageSpells[idx][1];
        const spell0Data = spell0 ? availableSpells.find(s => s.id === spell0) : null;
        const spell1Data = spell1 ? availableSpells.find(s => s.id === spell1) : null;

        magesHTML += `
            <div style="
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 10px;
            ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 24px;">${factionEmoji}</span>
                    <div>
                        <div style="color: #fff; font-size: 14px; font-weight: bold;">
                            ${wizard.name || 'Маг ' + (idx + 1)}
                        </div>
                        <div style="color: ${factionColor}; font-size: 11px;">Ур. ${wizard.level || 1}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="spell-slot-btn" data-wizard="${idx}" data-slot="0" style="
                        flex: 1;
                        padding: 10px 8px;
                        background: ${spell0Data ? 'rgba(114,137,218,0.2)' : 'rgba(255,255,255,0.05)'};
                        border: 1px dashed ${spell0Data ? '#7289da' : 'rgba(255,255,255,0.2)'};
                        border-radius: 8px;
                        color: ${spell0Data ? '#7289da' : '#555'};
                        font-size: 12px;
                        cursor: pointer;
                        text-align: center;
                    ">${spell0Data ? spell0Data.emoji + ' ' + spell0Data.name : '+ Заклинание 1'}</button>

                    <button class="spell-slot-btn" data-wizard="${idx}" data-slot="1" style="
                        flex: 1;
                        padding: 10px 8px;
                        background: ${spell1Data ? 'rgba(114,137,218,0.2)' : 'rgba(255,255,255,0.05)'};
                        border: 1px dashed ${spell1Data ? '#7289da' : 'rgba(255,255,255,0.2)'};
                        border-radius: 8px;
                        color: ${spell1Data ? '#7289da' : '#555'};
                        font-size: 12px;
                        cursor: pointer;
                        text-align: center;
                    ">${spell1Data ? spell1Data.emoji + ' ' + spell1Data.name : '+ Заклинание 2'}</button>
                </div>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 22px;
            max-width: 420px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <h3 style="color: #ffd700; margin: 0 0 5px 0; text-align: center; font-size: 18px;">
                📖 Заклинания
            </h3>
            <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0 0 15px 0;">
                Назначьте по 2 заклинания каждому магу (до 3 тира)
            </p>

            <div id="tournament-spell-cards">
                ${magesHTML}
            </div>

            <div id="tournament-spell-error" style="
                color: #ff6b6b;
                font-size: 12px;
                text-align: center;
                margin-bottom: 10px;
                display: none;
            "></div>

            <div style="display: flex; gap: 10px;">
                <button id="spells-next-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(245,158,11,0.3));
                    border: 1px solid rgba(255,215,0,0.5);
                    border-radius: 10px;
                    color: #ffd700;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">Далее →</button>
                <button id="spells-back-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 14px;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        </div>
    `;

    // Обработчики слотов — открывают список заклинаний
    overlay.querySelectorAll('.spell-slot-btn').forEach(btn => {
        btn.onclick = () => {
            const wizIdx = parseInt(btn.dataset.wizard);
            const slotIdx = parseInt(btn.dataset.slot);
            showTournamentSpellPicker(overlay, wizIdx, slotIdx, availableSpells);
        };
    });

    document.getElementById('spells-next-btn').onclick = () => {
        // Проверяем что все слоты заполнены
        const errorEl = document.getElementById('tournament-spell-error');
        for (const idx of selectedIndexes) {
            const spells = tournamentRegData.mageSpells[idx];
            if (!spells[0] || !spells[1]) {
                errorEl.textContent = 'Выберите заклинания для каждого мага!';
                errorEl.style.display = 'block';
                return;
            }
        }
        showTournamentFinalConfirm(overlay);
    };

    document.getElementById('spells-back-btn').onclick = () => {
        showTournamentSelectMages(overlay);
    };
}

/**
 * Пикер заклинания для конкретного слота мага
 */
function showTournamentSpellPicker(overlay, wizardIndex, slotIndex, availableSpells) {
    const otherSlot = slotIndex === 0 ? 1 : 0;
    const otherSpellInSlot = tournamentRegData.mageSpells[wizardIndex]?.[otherSlot];

    // Собираем уже назначенные заклинания у других магов
    const usedSpells = new Set();
    for (const [idx, spells] of Object.entries(tournamentRegData.mageSpells)) {
        spells.forEach((spellId, sIdx) => {
            if (spellId && !(parseInt(idx) === wizardIndex && sIdx === slotIndex)) {
                usedSpells.add(spellId);
            }
        });
    }

    // Фильтруем доступные (не занятые другими магами, не в другом слоте этого мага)
    const filtered = availableSpells.filter(s => !usedSpells.has(s.id));

    // Сортируем по тиру, потом по школе
    filtered.sort((a, b) => a.tier - b.tier || a.school.localeCompare(b.school));

    let spellsHTML = '';
    if (filtered.length === 0) {
        spellsHTML = '<div style="color: #888; text-align: center; padding: 20px;">Нет доступных заклинаний тир 1-3</div>';
    } else {
        filtered.forEach(spell => {
            const isSelected = tournamentRegData.mageSpells[wizardIndex]?.[slotIndex] === spell.id;
            spellsHTML += `
                <div class="spell-pick-item" data-spell="${spell.id}" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: ${isSelected ? 'rgba(114,137,218,0.25)' : 'rgba(0,0,0,0.2)'};
                    border: 1px solid ${isSelected ? '#7289da' : 'rgba(255,255,255,0.08)'};
                    border-radius: 8px;
                    margin-bottom: 6px;
                    cursor: pointer;
                ">
                    <span style="font-size: 20px;">${spell.emoji}</span>
                    <div style="flex: 1;">
                        <div style="color: #fff; font-size: 13px; font-weight: bold;">${spell.name}</div>
                        <div style="color: #888; font-size: 11px;">Тир ${spell.tier} • Ур.${spell.level}${spell.damage > 0 ? ' • ' + spell.damage + ' урон' : ''}</div>
                    </div>
                </div>
            `;
        });
    }

    const wizard = window.userData.wizards[wizardIndex];
    const factionEmoji = window.FACTION_EMOJIS?.[wizard.faction] || '🧙‍♂️';

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #7289da;
            border-radius: 15px;
            padding: 22px;
            max-width: 400px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <h3 style="color: #7289da; margin: 0 0 5px 0; text-align: center; font-size: 16px;">
                ${factionEmoji} ${wizard.name || 'Маг'} — Слот ${slotIndex + 1}
            </h3>
            <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0 0 12px 0;">
                Только заклинания до 3 тира
            </p>

            <div id="spell-picker-list" style="max-height: 50vh; overflow-y: auto; margin-bottom: 12px;">
                ${spellsHTML}
            </div>

            <button id="spell-picker-back" style="
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                color: #888;
                font-size: 14px;
                cursor: pointer;
            ">← Назад</button>
        </div>
    `;

    // Обработчик выбора заклинания
    overlay.querySelectorAll('.spell-pick-item').forEach(item => {
        item.onclick = () => {
            const spellId = item.dataset.spell;
            tournamentRegData.mageSpells[wizardIndex][slotIndex] = spellId;
            // Возвращаемся к экрану заклинаний
            showTournamentSelectSpells(overlay);
        };
    });

    document.getElementById('spell-picker-back').onclick = () => {
        showTournamentSelectSpells(overlay);
    };
}

/**
 * Шаг 4: Финальное подтверждение
 */
function showTournamentFinalConfirm(overlay) {
    const wizards = window.userData?.wizards || [];
    const selectedIndexes = tournamentRegData.selectedMages;

    // Рендер сводки
    let summaryHTML = '';
    selectedIndexes.forEach(idx => {
        const wizard = wizards[idx];
        const factionEmoji = window.FACTION_EMOJIS?.[wizard.faction] || '🧙‍♂️';
        const spells = tournamentRegData.mageSpells[idx];
        const spell0Name = window.SPELL_NAMES?.[spells[0]] || spells[0];
        const spell1Name = window.SPELL_NAMES?.[spells[1]] || spells[1];
        const spell0School = getSpellSchool(spells[0]);
        const spell1School = getSpellSchool(spells[1]);
        const spell0Emoji = window.FACTION_EMOJIS?.[spell0School] || '❓';
        const spell1Emoji = window.FACTION_EMOJIS?.[spell1School] || '❓';

        summaryHTML += `
            <div style="
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 8px;
            ">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="font-size: 20px;">${factionEmoji}</span>
                    <span style="color: #fff; font-size: 13px; font-weight: bold;">
                        ${wizard.name || 'Маг ' + (idx + 1)}
                    </span>
                    <span style="color: #888; font-size: 11px;">HP: 500</span>
                </div>
                <div style="display: flex; gap: 6px;">
                    <div style="
                        flex: 1;
                        padding: 6px;
                        background: rgba(114,137,218,0.15);
                        border-radius: 6px;
                        color: #7289da;
                        font-size: 11px;
                        text-align: center;
                    ">${spell0Emoji} ${spell0Name}</div>
                    <div style="
                        flex: 1;
                        padding: 6px;
                        background: rgba(114,137,218,0.15);
                        border-radius: 6px;
                        color: #7289da;
                        font-size: 11px;
                        text-align: center;
                    ">${spell1Emoji} ${spell1Name}</div>
                </div>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffa500;
            border-radius: 15px;
            padding: 22px;
            max-width: 400px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            color: white;
        ">
            <div style="font-size: 36px; text-align: center; margin-bottom: 8px;">⚠️</div>
            <h3 style="color: #ffa500; margin: 0 0 8px 0; text-align: center; font-size: 17px;">
                Подтверждение регистрации
            </h3>
            <p style="color: #ff6b6b; font-size: 12px; text-align: center; margin: 0 0 15px 0; font-weight: bold;">
                После подтверждения изменить выбор будет нельзя!
            </p>

            ${summaryHTML}

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button id="final-confirm-btn" style="
                    flex: 1;
                    padding: 14px;
                    background: linear-gradient(135deg, rgba(74,222,128,0.3), rgba(74,222,128,0.15));
                    border: 1px solid rgba(74,222,128,0.6);
                    border-radius: 10px;
                    color: #4ade80;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">Подтверждаю</button>
                <button id="final-back-btn" style="
                    flex: 1;
                    padding: 14px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #888;
                    font-size: 14px;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        </div>
    `;

    document.getElementById('final-confirm-btn').onclick = async () => {
        const btn = document.getElementById('final-confirm-btn');
        btn.disabled = true;
        btn.textContent = 'Регистрация...';
        btn.style.opacity = '0.5';

        await saveTournamentRegistration(overlay);
    };

    document.getElementById('final-back-btn').onclick = () => {
        showTournamentSelectSpells(overlay);
    };
}

/**
 * Сохранить регистрацию на турнир
 */
async function saveTournamentRegistration(overlay) {
    try {
        const tm = window.tournamentManager;
        if (!tm?.supabase) {
            tm?.init();
        }

        // Ищем активный турнир
        const tournament = await tm.getActiveTournament();
        if (!tournament) {
            showTournamentRegResult(overlay, false, 'Нет активного чемпионата');
            return;
        }

        if (tournament.status !== 'registration') {
            showTournamentRegResult(overlay, false, 'Регистрация закрыта');
            return;
        }

        const wizards = window.userData?.wizards || [];
        const playerId = window.dbManager?.getTelegramId();
        const playerName = window.userData?.username || 'Игрок';

        // Формируем турнирную формацию (3 мага с фиксированными ХП и заклинаниями)
        const lockedWizards = tournamentRegData.selectedMages.map(idx => {
            const wizard = JSON.parse(JSON.stringify(wizards[idx]));
            wizard.hp = 500;
            wizard.max_hp = 500;
            wizard.original_max_hp = 500;
            wizard.spells = [...tournamentRegData.mageSpells[idx]];
            return wizard;
        });

        // Формация — 3 позиции (позиции 0, 1, 2)
        const lockedFormation = lockedWizards.map(w => w.id);

        // Собираем спеллы с уровнями (только те что назначены)
        const lockedSpells = {};
        const userSpells = window.userData?.spells || {};
        for (const spells of Object.values(tournamentRegData.mageSpells)) {
            spells.forEach(spellId => {
                if (!spellId) return;
                for (const [school, schoolSpells] of Object.entries(userSpells)) {
                    if (schoolSpells[spellId]) {
                        if (!lockedSpells[school]) lockedSpells[school] = {};
                        lockedSpells[school][spellId] = JSON.parse(JSON.stringify(schoolSpells[spellId]));
                    }
                }
            });
        }

        const lockedData = {
            tournament_id: tournament.id,
            player_id: playerId,
            player_name: playerName,
            rating_at_registration: window.userData?.rating || 0,
            locked_formation: lockedFormation,
            locked_wizards: lockedWizards,
            locked_spells: lockedSpells,
            locked_buildings: JSON.parse(JSON.stringify(window.userData?.buildings || {}))
        };

        const { data, error } = await tm.supabase
            .from('tournament_participants')
            .upsert(lockedData, { onConflict: 'tournament_id,player_id' })
            .select()
            .single();

        if (error) {
            console.error('❌ Ошибка регистрации:', error);
            showTournamentRegResult(overlay, false, 'Ошибка сохранения: ' + error.message);
            return;
        }

        console.log(`✅ ${playerName} зарегистрирован в чемпионате`);
        showTournamentRegResult(overlay, true);

    } catch (err) {
        console.error('❌ Ошибка регистрации:', err);
        showTournamentRegResult(overlay, false, 'Произошла ошибка');
    }
}

/**
 * Результат регистрации
 */
function showTournamentRegResult(overlay, success, errorMsg) {
    if (success) {
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #4ade80;
                border-radius: 15px;
                padding: 30px;
                max-width: 380px;
                width: 90%;
                text-align: center;
                color: white;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h3 style="color: #4ade80; margin: 0 0 10px 0; font-size: 20px;">Регистрация завершена!</h3>
                <p style="color: #aaa; font-size: 13px; margin: 0 0 20px 0;">
                    Благодарим за регистрацию!<br>
                    Ваша формация зафиксирована. Ожидайте начала турнира.
                </p>
                <button id="reg-done-btn" style="
                    padding: 12px 30px;
                    background: rgba(74,222,128,0.2);
                    border: 1px solid rgba(74,222,128,0.5);
                    border-radius: 10px;
                    color: #4ade80;
                    font-size: 14px;
                    cursor: pointer;
                ">Отлично!</button>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 30px;
                max-width: 380px;
                width: 90%;
                text-align: center;
                color: white;
            ">
                <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
                <h3 style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 18px;">Ошибка регистрации</h3>
                <p style="color: #aaa; font-size: 13px; margin: 0 0 20px 0;">
                    ${errorMsg || 'Попробуйте позже'}
                </p>
                <button id="reg-done-btn" style="
                    padding: 12px 30px;
                    background: rgba(255,100,100,0.2);
                    border: 1px solid rgba(255,100,100,0.5);
                    border-radius: 10px;
                    color: #ff6b6b;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>
        `;
    }

    document.getElementById('reg-done-btn').onclick = () => {
        overlay.remove();
    };
}

// Экспорт
window.showTournamentUI = showTournamentUI;
window.closeTournamentUI = closeTournamentUI;
window.showTournamentReplay = showTournamentReplay;
window.showTournamentAllMatches = showTournamentAllMatches;
window.showSecretTournamentEntry = showSecretTournamentEntry;
window.showTournamentRules = showTournamentRules;

console.log('🏆 Tournament UI загружен');
