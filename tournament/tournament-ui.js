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

    document.getElementById('secret-btn-register').onclick = async () => {
        // Переходим к полному UI турнира (регистрация/статус)
        overlay.remove();
        showTournamentUI();
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

// Экспорт
window.showTournamentUI = showTournamentUI;
window.closeTournamentUI = closeTournamentUI;
window.showTournamentReplay = showTournamentReplay;
window.showTournamentAllMatches = showTournamentAllMatches;
window.showSecretTournamentEntry = showSecretTournamentEntry;
window.showTournamentRules = showTournamentRules;

console.log('🏆 Tournament UI загружен');
