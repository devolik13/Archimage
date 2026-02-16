// tournament/tournament-admin.js - Админские функции для управления турниром
// Вызываются из консоли браузера

/**
 * Полный цикл управления турниром (из консоли):
 *
 * 1. tournamentAdmin.create("Первый Чемпионат")     — создать турнир
 * 2. (Ждём пока игроки зарегистрируются)
 * 3. tournamentAdmin.lock()                          — закрыть регистрацию, сгенерировать сетку
 * 4. tournamentAdmin.calculateRound()                — рассчитать бои текущего раунда
 * 5. tournamentAdmin.revealRound()                   — показать результаты игрокам
 * 6. tournamentAdmin.nextRound()                     — создать матчи следующего раунда
 * 7. Повторять 4-6 до финала
 * 8. tournamentAdmin.cleanup()                       — удалить реплеи (опционально)
 *
 * Утилиты:
 * - tournamentAdmin.status()                         — текущий статус турнира
 * - tournamentAdmin.participants()                   — список участников
 * - tournamentAdmin.matches(round)                   — матчи раунда
 * - tournamentAdmin.addBots(count)                   — добавить ботов для теста
 */

const tournamentAdmin = {
    tournamentId: null,

    /**
     * Создать новый турнир
     */
    async create(name = 'Чемпионат Архимагов') {
        const tm = window.tournamentManager;
        if (!tm.supabase) tm.init();

        const tournament = await tm.createTournament(name);
        if (tournament) {
            this.tournamentId = tournament.id;
            console.log(`✅ Турнир создан: ${name}`);
            console.log(`   ID: ${tournament.id}`);
            console.log(`   Статус: registration`);
            console.log(`\n   Следующий шаг: Ждём регистрации, затем tournamentAdmin.lock()`);
        }
        return tournament;
    },

    /**
     * Закрыть регистрацию и сгенерировать сетку
     */
    async lock(seedMethod = 'random') {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        const result = await tm.generateBracket(id, seedMethod);

        if (result) {
            // Обновляем статус на in_progress
            await tm.supabase
                .from('tournaments')
                .update({ status: 'in_progress' })
                .eq('id', id);

            console.log(`✅ Сетка сгенерирована:`);
            console.log(`   Раундов: ${result.totalRounds}`);
            console.log(`   Размер сетки: ${result.bracketSize}`);
            console.log(`   Bye: ${result.byeCount}`);
            console.log(`   Матчей в 1 раунде: ${result.matchCount}`);
            console.log(`\n   Следующий шаг: tournamentAdmin.calculateRound()`);
        }
        return result;
    },

    /**
     * Рассчитать бои текущего раунда
     */
    async calculateRound() {
        const id = await this._ensureId();
        if (!id) return;

        console.log('⚔️ Начинаю расчёт боёв... (может занять время)');
        console.log('   Следите за прогрессом в консоли.\n');

        const tm = window.tournamentManager;
        const result = await tm.calculateCurrentRound(id);

        if (result) {
            console.log(`\n✅ Раунд ${result.round} рассчитан: ${result.calculated} матчей`);
            console.log(`\n   Следующий шаг: tournamentAdmin.revealRound()`);
        }
        return result;
    },

    /**
     * Показать результаты текущего раунда игрокам
     */
    async revealRound() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        await tm.revealCurrentRound(id);

        const tournament = await tm.getTournament(id);
        console.log(`✅ Раунд ${tournament.visible_round} теперь виден игрокам!`);
        console.log(`\n   Следующий шаг: tournamentAdmin.nextRound()`);
    },

    /**
     * Подготовить следующий раунд
     */
    async nextRound() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        const result = await tm.advanceToNextRound(id);

        if (result?.completed) {
            console.log(`🏆 ТУРНИР ЗАВЕРШЁН!`);
            console.log(`\n   Опционально: tournamentAdmin.cleanup() — удалить реплеи`);
        } else if (result) {
            console.log(`✅ Раунд ${result.nextRound}: ${result.matchCount} матчей`);
            console.log(`\n   Следующий шаг: tournamentAdmin.calculateRound()`);
        }
        return result;
    },

    /**
     * Текущий статус турнира
     */
    async status() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        const t = await tm.getTournament(id);

        if (t) {
            console.log('═══════════════════════════════════');
            console.log(`🏆 ${t.name}`);
            console.log(`   ID: ${t.id}`);
            console.log(`   Статус: ${t.status}`);
            console.log(`   Участники: ${t.total_participants}`);
            console.log(`   Раунд: ${t.current_round}/${t.total_rounds}`);
            console.log(`   Видимый раунд: ${t.visible_round}`);
            console.log('═══════════════════════════════════');
        }
        return t;
    },

    /**
     * Список участников
     */
    async participants() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        const list = await tm.getParticipants(id);

        console.log(`📋 Участники (${list.length}):`);
        list.forEach((p, i) => {
            const status = p.eliminated_in_round ? `❌ Выбыл (раунд ${p.eliminated_in_round})` : '✅ В игре';
            console.log(`   ${i + 1}. ${p.player_name} [${p.rating_at_registration}] - ${status}`);
        });
        return list;
    },

    /**
     * Матчи раунда
     */
    async matches(round) {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        if (!round) {
            const t = await tm.getTournament(id);
            round = t.current_round;
        }

        const { data } = await tm.supabase
            .from('tournament_matches')
            .select('*')
            .eq('tournament_id', id)
            .eq('round', round)
            .order('match_number');

        console.log(`⚔️ Матчи раунда ${round}:`);
        (data || []).forEach(m => {
            const winner = m.winner_id ? (m.winner_id === m.player1_id ? m.player1_name : m.player2_name) : '?';
            console.log(`   #${m.match_number}: ${m.player1_name || 'bye'} vs ${m.player2_name || 'bye'} → ${winner} [${m.match_status}]`);
        });
        return data;
    },

    /**
     * Добавить ботов для тестирования
     */
    async addBots(count = 10) {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        const factions = ['fire', 'water', 'wind', 'earth', 'nature', 'poison', 'light', 'dark'];
        const names = [
            'Огненный Маг', 'Водный Страж', 'Повелитель Ветра', 'Каменный Голем',
            'Друид Леса', 'Ядовитый Змей', 'Рыцарь Света', 'Тёмный Колдун',
            'Пиромант', 'Аквамаг', 'Штормовой Маг', 'Геомант',
            'Шаман Природы', 'Алхимик', 'Целитель', 'Некромант',
            'Феникс', 'Ледяной Маг', 'Молниеносец', 'Землетрясатель'
        ];

        const spellsByFaction = {
            fire: ['fireball', 'fire_wall'],
            water: ['ice_bolt', 'healing_rain'],
            wind: ['lightning', 'wind_slash'],
            earth: ['stone_spike', 'earth_wall'],
            nature: ['thorn_whip', 'healing_bloom'],
            poison: ['toxic_bolt', 'miasma'],
            light: ['holy_bolt', 'blessing'],
            dark: ['shadow_bolt', 'curse']
        };

        let added = 0;
        for (let i = 0; i < count; i++) {
            const botId = 900000000 + Math.floor(Math.random() * 99999999);
            const faction = factions[i % factions.length];
            const name = names[i % names.length] + ` #${i + 1}`;
            const rating = Math.floor(Math.random() * 2000) + 500;

            // Генерируем случайных магов (3-5 штук)
            const wizardCount = 3 + Math.floor(Math.random() * 3);
            const wizards = [];
            const formation = [null, null, null, null, null];

            for (let w = 0; w < wizardCount; w++) {
                const wizFaction = factions[Math.floor(Math.random() * factions.length)];
                const spells = spellsByFaction[wizFaction] || ['fireball'];
                const wizard = {
                    id: `bot_wiz_${botId}_${w}`,
                    name: `${names[Math.floor(Math.random() * names.length)].split(' ')[0]} ${w + 1}`,
                    faction: wizFaction,
                    level: Math.floor(Math.random() * 15) + 1,
                    original_max_hp: 100,
                    max_hp: 100,
                    hp: 100,
                    max_armor: 100,
                    armor: 100,
                    original_max_armor: 100,
                    spells: spells,
                    experience: 0
                };
                wizards.push(wizard);
                if (w < 5) formation[w] = wizard.id;
            }

            const botData = {
                tournament_id: id,
                player_id: botId,
                player_name: name,
                rating_at_registration: rating,
                locked_formation: formation,
                locked_wizards: wizards,
                locked_spells: {},
                locked_buildings: {}
            };

            const { error } = await tm.supabase
                .from('tournament_participants')
                .insert(botData);

            if (!error) {
                added++;
            } else {
                console.warn(`⚠️ Ошибка добавления бота ${name}:`, error.message);
            }
        }

        // Обновляем count
        const participants = await tm.getParticipants(id);
        await tm.supabase
            .from('tournaments')
            .update({ total_participants: participants.length })
            .eq('id', id);

        console.log(`✅ Добавлено ${added} ботов. Всего участников: ${participants.length}`);
        return added;
    },

    /**
     * Удалить реплеи после турнира
     */
    async cleanup() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        await tm.cleanupReplays(id);
        console.log('✅ Реплеи удалены');
    },

    /**
     * Полный автоматический прогон турнира (для тестирования)
     */
    async autoRun() {
        const id = await this._ensureId();
        if (!id) return;

        const tm = window.tournamentManager;
        let tournament = await tm.getTournament(id);

        if (tournament.status === 'registration') {
            console.log('📋 Закрываем регистрацию...');
            await this.lock();
        }

        tournament = await tm.getTournament(id);

        for (let round = tournament.current_round; round <= tournament.total_rounds; round++) {
            console.log(`\n═══ РАУНД ${round}/${tournament.total_rounds} ═══`);

            // Расчёт
            await this.calculateRound();

            // Показываем
            await this.revealRound();

            // Следующий раунд
            if (round < tournament.total_rounds) {
                await this.nextRound();
            }
        }

        // Завершаем
        await tm._completeTournament(id, tournament.total_rounds);
        console.log('\n🏆 Турнир полностью завершён!');

        return await this.status();
    },

    /**
     * Убедиться что есть ID турнира
     */
    async _ensureId() {
        if (this.tournamentId) return this.tournamentId;

        // Пробуем найти активный турнир
        const tm = window.tournamentManager;
        if (!tm.supabase) tm.init();

        const active = await tm.getActiveTournament();
        if (active) {
            this.tournamentId = active.id;
            return active.id;
        }

        console.error('❌ Нет активного турнира. Создайте: tournamentAdmin.create("Название")');
        return null;
    }
};

// Экспорт
window.tournamentAdmin = tournamentAdmin;

console.log('👑 Tournament Admin загружен. Используйте tournamentAdmin.create("Название") для начала.');
