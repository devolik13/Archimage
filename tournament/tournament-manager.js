// tournament/tournament-manager.js - Менеджер чемпионатов
// Генерация сетки, расчёт боёв, управление раундами

class TournamentManager {
    constructor() {
        this.supabase = null;
        this.currentTournament = null;
    }

    init() {
        this.supabase = window.dbManager?.supabase;
        if (!this.supabase) {
            console.warn('⚠️ TournamentManager: Supabase не инициализирован');
        }
    }

    // ═══════════════════════════════════════
    // СОЗДАНИЕ ТУРНИРА
    // ═══════════════════════════════════════

    /**
     * Создать новый турнир
     * @param {string} name - Название турнира
     * @returns {Object} tournament
     */
    async createTournament(name) {
        const adminId = window.dbManager?.getTelegramId();

        const { data, error } = await this.supabase
            .from('tournaments')
            .insert({
                name: name,
                status: 'registration',
                created_by: adminId
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Ошибка создания турнира:', error);
            return null;
        }

        this.currentTournament = data;
        console.log(`🏆 Турнир создан: ${name} (${data.id})`);
        return data;
    }

    // ═══════════════════════════════════════
    // РЕГИСТРАЦИЯ УЧАСТНИКОВ
    // ═══════════════════════════════════════

    /**
     * Зарегистрировать текущего игрока в турнир
     * Фиксирует формацию, магов, заклинания
     */
    async registerCurrentPlayer(tournamentId) {
        if (!window.userData) {
            console.error('❌ Нет данных игрока');
            return null;
        }

        const playerId = window.dbManager?.getTelegramId();
        const playerName = window.userData.username || 'Игрок';

        // Проверяем что есть формация
        const formation = window.userData.formation || [];
        const filledSlots = formation.filter(id => id !== null).length;
        if (filledSlots === 0) {
            alert('Расставьте хотя бы одного мага перед регистрацией!');
            return null;
        }

        // Снапшот данных игрока
        const lockedData = {
            tournament_id: tournamentId,
            player_id: playerId,
            player_name: playerName,
            rating_at_registration: window.userData.rating || 0,
            locked_formation: JSON.parse(JSON.stringify(formation)),
            locked_wizards: JSON.parse(JSON.stringify(window.userData.wizards || [])),
            locked_spells: JSON.parse(JSON.stringify(window.userData.spells || {})),
            locked_buildings: JSON.parse(JSON.stringify(window.userData.buildings || {}))
        };

        const { data, error } = await this.supabase
            .from('tournament_participants')
            .upsert(lockedData, { onConflict: 'tournament_id,player_id' })
            .select()
            .single();

        if (error) {
            console.error('❌ Ошибка регистрации:', error);
            return null;
        }

        console.log(`✅ ${playerName} зарегистрирован в турнире`);
        return data;
    }

    /**
     * Получить список участников турнира
     */
    async getParticipants(tournamentId) {
        const { data, error } = await this.supabase
            .from('tournament_participants')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('registered_at');

        if (error) {
            console.error('❌ Ошибка загрузки участников:', error);
            return [];
        }
        return data || [];
    }

    // ═══════════════════════════════════════
    // ГЕНЕРАЦИЯ СЕТКИ
    // ═══════════════════════════════════════

    /**
     * Закрыть регистрацию и сгенерировать сетку
     * @param {string} tournamentId
     * @param {string} seedMethod - 'random' | 'rating' (по рейтингу — сильные встречаются позже)
     */
    async generateBracket(tournamentId, seedMethod = 'random') {
        const participants = await this.getParticipants(tournamentId);

        if (participants.length < 2) {
            console.error('❌ Недостаточно участников (минимум 2)');
            return null;
        }

        // Сортируем/перемешиваем
        let seeded;
        if (seedMethod === 'rating') {
            // По рейтингу — сильные далеко друг от друга
            seeded = this._seedByRating(participants);
        } else {
            // Рандомно
            seeded = this._shuffleArray([...participants]);
        }

        // Присваиваем seed (позицию в сетке)
        for (let i = 0; i < seeded.length; i++) {
            await this.supabase
                .from('tournament_participants')
                .update({ seed: i })
                .eq('id', seeded[i].id);
            seeded[i].seed = i;
        }

        // Подсчёт раундов
        const n = seeded.length;
        const totalRounds = Math.ceil(Math.log2(n));
        const bracketSize = Math.pow(2, totalRounds); // Ближайшая степень двойки
        const byeCount = bracketSize - n;

        console.log(`📊 Сетка: ${n} участников, ${totalRounds} раундов, ${byeCount} bye`);

        // Генерируем матчи первого раунда
        const matches = [];
        for (let i = 0; i < bracketSize / 2; i++) {
            const idx1 = i * 2;
            const idx2 = i * 2 + 1;

            const p1 = idx1 < seeded.length ? seeded[idx1] : null;
            const p2 = idx2 < seeded.length ? seeded[idx2] : null;

            // Если один из игроков null — это bye
            let matchStatus = 'pending';
            let winnerId = null;

            if (p1 && !p2) {
                winnerId = p1.player_id;
                matchStatus = 'calculated'; // Автоматическая победа
            } else if (!p1 && p2) {
                winnerId = p2.player_id;
                matchStatus = 'calculated';
            }

            matches.push({
                tournament_id: tournamentId,
                round: 1,
                match_number: i,
                player1_id: p1?.player_id || null,
                player2_id: p2?.player_id || null,
                player1_name: p1?.player_name || null,
                player2_name: p2?.player_name || null,
                winner_id: winnerId,
                match_status: matchStatus
            });
        }

        // Вставляем матчи в БД
        const { error: matchError } = await this.supabase
            .from('tournament_matches')
            .insert(matches);

        if (matchError) {
            console.error('❌ Ошибка создания матчей:', matchError);
            return null;
        }

        // Обновляем турнир
        await this.supabase
            .from('tournaments')
            .update({
                status: 'locked',
                total_participants: n,
                current_round: 1,
                total_rounds: totalRounds,
                started_at: new Date().toISOString()
            })
            .eq('id', tournamentId);

        console.log(`🏆 Сетка сгенерирована: ${matches.length} матчей в первом раунде`);
        return { totalRounds, bracketSize, byeCount, matchCount: matches.length };
    }

    // ═══════════════════════════════════════
    // РАСЧЁТ БОЁВ
    // ═══════════════════════════════════════

    /**
     * Рассчитать все бои текущего раунда
     * @param {string} tournamentId
     */
    async calculateCurrentRound(tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament) return null;

        const round = tournament.current_round;
        console.log(`⚔️ Расчёт раунда ${round}...`);

        // Загружаем матчи раунда
        const { data: matches, error } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round', round)
            .eq('match_status', 'pending');

        if (error || !matches) {
            console.error('❌ Ошибка загрузки матчей:', error);
            return null;
        }

        console.log(`📋 Матчей для расчёта: ${matches.length}`);

        // Загружаем участников
        const participants = await this.getParticipants(tournamentId);
        const participantMap = {};
        participants.forEach(p => { participantMap[p.player_id] = p; });

        let calculated = 0;

        for (const match of matches) {
            if (!match.player1_id || !match.player2_id) {
                // Bye — уже рассчитан при генерации
                continue;
            }

            const p1 = participantMap[match.player1_id];
            const p2 = participantMap[match.player2_id];

            if (!p1 || !p2) {
                console.warn(`⚠️ Участник не найден для матча ${match.match_number}`);
                continue;
            }

            console.log(`⚔️ Матч ${match.match_number}: ${p1.player_name} vs ${p2.player_name}`);

            // Бой 1: player1 атакует
            const fight1 = await window.runHeadlessBattle(p1, p2, p1.player_id);

            // Бой 2: player2 атакует
            const fight2 = await window.runHeadlessBattle(p1, p2, p2.player_id);

            // Определяем победителя матча
            const matchResult = this._determineMatchWinner(
                match.player1_id, match.player2_id,
                fight1, fight2
            );

            // Сохраняем результаты
            await this.supabase
                .from('tournament_matches')
                .update({
                    fight1_result: fight1.result,
                    fight1_log: fight1.log,
                    fight1_summary: fight1.summary,
                    fight2_result: fight2.result,
                    fight2_log: fight2.log,
                    fight2_summary: fight2.summary,
                    winner_id: matchResult.winnerId,
                    match_status: 'calculated',
                    calculated_at: new Date().toISOString()
                })
                .eq('id', match.id);

            // Помечаем проигравшего как выбывшего
            if (matchResult.loserId) {
                await this.supabase
                    .from('tournament_participants')
                    .update({ eliminated_in_round: round })
                    .eq('tournament_id', tournamentId)
                    .eq('player_id', matchResult.loserId);
            }

            calculated++;
            console.log(`  ✅ Победитель: ${matchResult.winnerName}`);
        }

        console.log(`⚔️ Раунд ${round} рассчитан: ${calculated} матчей`);
        return { calculated, round };
    }

    /**
     * Определить победителя матча по результатам двух боёв
     */
    _determineMatchWinner(player1Id, player2Id, fight1, fight2) {
        let p1Score = 0;
        let p2Score = 0;

        // Бой 1: p1 атакует
        if (fight1.result === 'player1') p1Score++;
        else if (fight1.result === 'player2') p2Score++;

        // Бой 2: p2 атакует
        if (fight2.result === 'player1') p1Score++;
        else if (fight2.result === 'player2') p2Score++;

        if (p1Score > p2Score) {
            return {
                winnerId: player1Id,
                loserId: player2Id,
                winnerName: fight1.summary?.attackerName || 'Player 1'
            };
        } else if (p2Score > p1Score) {
            return {
                winnerId: player2Id,
                loserId: player1Id,
                winnerName: fight1.summary?.defenderName || 'Player 2'
            };
        } else {
            // Ничья (крайне редко) — дополнительные бои
            // Пока просто побеждает player1 (у которого больше HP в итоге)
            const p1TotalHp = (fight1.summary?.playerTotalHp || 0) + (fight2.summary?.enemyTotalHp || 0);
            const p2TotalHp = (fight1.summary?.enemyTotalHp || 0) + (fight2.summary?.playerTotalHp || 0);

            if (p1TotalHp >= p2TotalHp) {
                return {
                    winnerId: player1Id,
                    loserId: player2Id,
                    winnerName: fight1.summary?.attackerName || 'Player 1'
                };
            } else {
                return {
                    winnerId: player2Id,
                    loserId: player1Id,
                    winnerName: fight1.summary?.defenderName || 'Player 2'
                };
            }
        }
    }

    // ═══════════════════════════════════════
    // УПРАВЛЕНИЕ РАУНДАМИ
    // ═══════════════════════════════════════

    /**
     * Сделать текущий раунд видимым для игроков
     */
    async revealCurrentRound(tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament) return;

        const round = tournament.current_round;

        // Обновляем статус матчей
        await this.supabase
            .from('tournament_matches')
            .update({ match_status: 'visible' })
            .eq('tournament_id', tournamentId)
            .eq('round', round)
            .in('match_status', ['calculated']);

        // Обновляем visible_round
        await this.supabase
            .from('tournaments')
            .update({ visible_round: round })
            .eq('id', tournamentId);

        console.log(`👁️ Раунд ${round} теперь виден игрокам`);
    }

    /**
     * Подготовить следующий раунд (создать матчи из победителей)
     */
    async advanceToNextRound(tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament) return null;

        const currentRound = tournament.current_round;
        const nextRound = currentRound + 1;

        if (nextRound > tournament.total_rounds) {
            // Турнир завершён
            await this._completeTournament(tournamentId, currentRound);
            return { completed: true };
        }

        // Загружаем победителей текущего раунда (в порядке match_number)
        const { data: matches, error } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round', currentRound)
            .order('match_number');

        if (error || !matches) {
            console.error('❌ Ошибка загрузки матчей:', error);
            return null;
        }

        const winners = matches.map(m => m.winner_id).filter(id => id !== null);

        // Загружаем участников для имён
        const participants = await this.getParticipants(tournamentId);
        const participantMap = {};
        participants.forEach(p => { participantMap[p.player_id] = p; });

        // Генерируем матчи следующего раунда
        const nextMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
            const p1Id = winners[i];
            const p2Id = winners[i + 1] || null;

            let matchStatus = 'pending';
            let winnerId = null;

            if (p1Id && !p2Id) {
                winnerId = p1Id;
                matchStatus = 'calculated';
            }

            nextMatches.push({
                tournament_id: tournamentId,
                round: nextRound,
                match_number: Math.floor(i / 2),
                player1_id: p1Id,
                player2_id: p2Id,
                player1_name: participantMap[p1Id]?.player_name || null,
                player2_name: p2Id ? (participantMap[p2Id]?.player_name || null) : null,
                winner_id: winnerId,
                match_status: matchStatus
            });
        }

        const { error: insertError } = await this.supabase
            .from('tournament_matches')
            .insert(nextMatches);

        if (insertError) {
            console.error('❌ Ошибка создания матчей:', insertError);
            return null;
        }

        // Обновляем турнир
        await this.supabase
            .from('tournaments')
            .update({
                current_round: nextRound,
                status: 'in_progress'
            })
            .eq('id', tournamentId);

        console.log(`➡️ Следующий раунд ${nextRound}: ${nextMatches.length} матчей`);
        return { nextRound, matchCount: nextMatches.length };
    }

    /**
     * Завершить турнир
     */
    async _completeTournament(tournamentId, finalRound) {
        // Находим победителя финала
        const { data: finalMatch } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round', finalRound)
            .single();

        if (finalMatch?.winner_id) {
            // Обновляем позицию победителя
            await this.supabase
                .from('tournament_participants')
                .update({ final_position: 1 })
                .eq('tournament_id', tournamentId)
                .eq('player_id', finalMatch.winner_id);
        }

        // Обновляем турнир
        await this.supabase
            .from('tournaments')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', tournamentId);

        console.log('🏆 Турнир завершён!');
    }

    // ═══════════════════════════════════════
    // ЗАПРОСЫ ДАННЫХ
    // ═══════════════════════════════════════

    /**
     * Получить данные турнира
     */
    async getTournament(tournamentId) {
        const { data, error } = await this.supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (error) {
            console.error('❌ Ошибка загрузки турнира:', error);
            return null;
        }
        return data;
    }

    /**
     * Получить активный турнир (последний не завершённый)
     */
    async getActiveTournament() {
        const { data, error } = await this.supabase
            .from('tournaments')
            .select('*')
            .in('status', ['registration', 'locked', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data;
    }

    /**
     * Получить информацию о текущем игроке в турнире
     */
    async getMyTournamentStatus(tournamentId) {
        const playerId = window.dbManager?.getTelegramId();
        if (!playerId) return null;

        // 1. Участие
        const { data: participant } = await this.supabase
            .from('tournament_participants')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('player_id', playerId)
            .single();

        if (!participant) return { registered: false };

        // 2. Турнир
        const tournament = await this.getTournament(tournamentId);

        // 3. Мой текущий матч (в видимом раунде или предстоящий)
        const { data: myMatches } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
            .order('round', { ascending: false });

        // Находим текущий/последний матч
        let currentMatch = null;
        let allMyMatches = myMatches || [];

        // Последний видимый матч
        const visibleMatches = allMyMatches.filter(m => m.match_status === 'visible');
        const pendingMatches = allMyMatches.filter(m =>
            m.match_status === 'pending' || m.match_status === 'calculated'
        );

        currentMatch = pendingMatches[0] || visibleMatches[0] || allMyMatches[0];

        // Определяем раунд игрока в красивом формате
        const roundName = this.getRoundName(
            currentMatch?.round || participant.eliminated_in_round || 1,
            tournament?.total_rounds || 1
        );

        return {
            registered: true,
            participant,
            tournament,
            currentMatch,
            allMatches: allMyMatches,
            visibleMatches,
            roundName,
            eliminated: participant.eliminated_in_round !== null
        };
    }

    /**
     * Получить все видимые матчи раунда (для любого игрока)
     */
    async getVisibleMatches(tournamentId, round) {
        const { data, error } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round', round)
            .eq('match_status', 'visible')
            .order('match_number');

        if (error) return [];
        return data || [];
    }

    /**
     * Получить реплей (лог боя) конкретного матча
     */
    async getMatchReplay(matchId) {
        const { data, error } = await this.supabase
            .from('tournament_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (error || !data) return null;
        if (data.match_status !== 'visible') return null; // Нельзя смотреть нераскрытые

        return data;
    }

    // ═══════════════════════════════════════
    // УТИЛИТЫ
    // ═══════════════════════════════════════

    /**
     * Название раунда в красивом формате
     * Например: "1/16 финала", "1/4 финала", "Полуфинал", "Финал"
     */
    getRoundName(round, totalRounds) {
        const roundsFromEnd = totalRounds - round;

        if (roundsFromEnd === 0) return 'Финал';
        if (roundsFromEnd === 1) return 'Полуфинал';
        if (roundsFromEnd === 2) return '1/4 финала';

        const fraction = Math.pow(2, roundsFromEnd);
        return `1/${fraction} финала`;
    }

    /**
     * Рассеивание по рейтингу (сильные игроки встречаются позже)
     */
    _seedByRating(participants) {
        // Сортируем по рейтингу (от высшего к низшему)
        const sorted = [...participants].sort((a, b) =>
            (b.rating_at_registration || 0) - (a.rating_at_registration || 0)
        );

        // Стандартное рассеивание: 1 vs last, 2 vs last-1, etc.
        const n = sorted.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
        const result = new Array(bracketSize).fill(null);

        // Размещаем по схеме рассеивания
        const positions = this._generateSeededPositions(bracketSize);
        for (let i = 0; i < sorted.length; i++) {
            result[positions[i]] = sorted[i];
        }

        return result.filter(p => p !== null);
    }

    /**
     * Генерация позиций рассеивания (стандартный bracket seeding)
     */
    _generateSeededPositions(size) {
        if (size === 1) return [0];

        const positions = [0, 1];
        while (positions.length < size) {
            const newPositions = [];
            const currentSize = positions.length * 2;
            for (const pos of positions) {
                newPositions.push(pos);
                newPositions.push(currentSize - 1 - pos);
            }
            positions.length = 0;
            positions.push(...newPositions);
        }
        return positions;
    }

    /**
     * Перемешать массив (Fisher-Yates)
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // ═══════════════════════════════════════
    // УДАЛЕНИЕ ДАННЫХ ПОСЛЕ ТУРНИРА
    // ═══════════════════════════════════════

    /**
     * Удалить реплеи (логи боёв) завершённого турнира
     * Оставляет структуру, но чистит тяжёлые данные
     */
    async cleanupReplays(tournamentId) {
        const { error } = await this.supabase
            .from('tournament_matches')
            .update({
                fight1_log: null,
                fight2_log: null,
                fight1_summary: null,
                fight2_summary: null
            })
            .eq('tournament_id', tournamentId);

        if (error) {
            console.error('❌ Ошибка очистки реплеев:', error);
            return false;
        }

        console.log('🗑️ Реплеи турнира удалены');
        return true;
    }
}

// Глобальный экземпляр
window.tournamentManager = new TournamentManager();

console.log('🏆 Tournament Manager загружен');
