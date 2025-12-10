// Менеджер базы данных для игры...
class DatabaseManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentPlayer = null;
        this.autoSaveInterval = null;
        this.hasUnsavedChanges = false;
    }

    // Получить Telegram ID пользователя
    getTelegramId() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            return user.id;
        }
        // Для локального теста
        console.log('⚠️ Используется тестовый Telegram ID для локальной разработки');
        return 12345678;
    }

    // Получить username пользователя с санитизацией
    getTelegramUsername() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            const rawUsername = user.username || user.first_name || 'Player';
            // Защита от XSS: убираем опасные символы и ограничиваем длину
            return rawUsername.replace(/[<>"'&]/g, '').substring(0, 50);
        }
        return 'TestUser';
    }

    // Загрузить или создать игрока
    async loadOrCreatePlayer() {
        // Валидация Telegram (в продакшене обязательна)
        if (!window.validateTelegramWebAppData || !window.validateTelegramWebAppData()) {
            if (!window.isDevEnvironment || !window.isDevEnvironment()) {
                console.error('Не прошла валидация Telegram');
                alert('Пожалуйста, запустите игру через Telegram');
                return null;
            }
            console.warn('DEV режим: используем тестовый ID');
        }

        const telegramId = this.getTelegramId();

        console.log('Поиск игрока с Telegram ID:', telegramId);

        try {
            // Ищем игрока по telegram_id
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Игрок не найден - создаём нового
                console.log('👤 Игрок не найден, создаём нового...');
                return await this.createNewPlayer(telegramId);
            }

            if (error) {
                throw error;
            }

            this.currentPlayer = data;
            return data;

        } catch (error) {
            console.error('❌ Ошибка загрузки игрока:', error);
            return null;
        }
    }

    // Создать нового игрока
    async createNewPlayer(telegramId) {
        try {
            const username = this.getTelegramUsername();
            
            const { data, error } = await this.supabase
                .from('players')
                .insert([{
                    telegram_id: telegramId,
                    username: username,
                    time_currency: 7200, // Начальная валюта: 5 дней (5 × 24 × 60 мин)
                    level: 1,
                    experience: 0
                    // last_login убрано - добавится при обновлении игрока
                }])
                .select()
                .single();

            if (error) throw error;

            this.currentPlayer = data;
            console.log('Новый игрок создан:', data);
            return data;

        } catch (error) {
            console.error('Ошибка создания игрока:', error);
            return null;
        }
    }

    // Сохранить данные игрока (через безопасную RPC функцию)
    async savePlayer(playerData) {
        if (!this.currentPlayer) return false;

        try {
            // Сохраняем constructions внутри buildings
            const buildingsWithConstructions = {
                ...(playerData.buildings || {}),
                _active_constructions: playerData.constructions || []
            };

            // Формируем данные для RPC (лимиты проверяются на стороне БД)
            const rpcData = {
                time_currency: playerData.timeCurrency || playerData.time_currency || 0,
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                faction: playerData.faction || null,
                faction_changed: playerData.faction_changed || false, // Флаг бесплатной смены фракции
                wizards: playerData.wizards || [],
                formation: playerData.formation || [null, null, null, null, null],
                spells: playerData.spells || {},
                buildings: buildingsWithConstructions,
                total_battles: playerData.total_battles || 0,
                wins: playerData.wins || 0,
                losses: playerData.losses || 0,
                rating: playerData.rating || 0,
                pve_progress: playerData.pve_progress || {},
                settings: playerData.settings || { sound: true, language: 'ru', battle_speed: 'normal' },
                welcome_shown: playerData.welcome_shown || false,
                daily_login: playerData.daily_login || { day: 1, last_login_date: null, last_reward_date: null, total_logins: 0 },
                battle_energy: playerData.battle_energy || { current: 12, max: 12, last_regen: Date.now() },
                active_blessing: playerData.active_blessing || null,
                blessing_last_used: playerData.blessing_last_used || null,
                last_login: playerData.last_login || new Date().toISOString(),
                purchased_packs: playerData.purchased_packs || {}, // Купленные стартовые пакеты
                airdrop_points: playerData.airdrop_points || 0, // Очки для airdrop
                airdrop_breakdown: playerData.airdrop_breakdown || {}, // Разбивка очков по категориям
                wallet_address: playerData.wallet_address || null, // TON кошелек
                wallet_connected_at: playerData.wallet_connected_at || null // Время подключения кошелька
            };

            // DEBUG: Логируем faction_changed перед отправкой в RPC
            console.log(`🔍 [RPC DEBUG] Отправка в update_player_safe: faction_changed = ${rpcData.faction_changed}`);
            console.log(`🪂 [RPC DEBUG] Airdrop данные в rpcData:`);
            console.log(`  - airdrop_points: ${rpcData.airdrop_points}`);
            console.log(`  - airdrop_breakdown:`, rpcData.airdrop_breakdown);
            console.log(`  - wallet_address: ${rpcData.wallet_address}`);

            // Вызываем безопасную RPC функцию (обновляет только по telegram_id)
            const { data, error } = await this.supabase.rpc('update_player_safe', {
                p_telegram_id: this.getTelegramId(),
                p_data: rpcData
            });

            if (error) {
                console.error('❌ [RPC DEBUG] Ошибка RPC:', error);
                throw error;
            }
            console.log('✅ [RPC DEBUG] RPC успешно выполнен');

            this.hasUnsavedChanges = false;
            return true;

        } catch (error) {
            console.error('Ошибка сохранения игрока:', error);
            return false;
        }
    }

    // Сохранить расстановку войск (через безопасную RPC)
    async saveFormation(formation) {
        if (!this.currentPlayer) {
            console.error('currentPlayer не существует!');
            return false;
        }

        try {
            // Используем RPC для безопасного обновления
            const { data, error } = await this.supabase.rpc('update_player_safe', {
                p_telegram_id: this.getTelegramId(),
                p_data: { formation: formation }
            });

            if (error) throw error;

            console.log('Расстановка сохранена:', formation);
            return true;

        } catch (error) {
            console.error('Ошибка сохранения расстановки:', error);
            return false;
        }
    }

    // ПРИМЕЧАНИЕ: Здания теперь сохраняются в поле buildings (JSONB) через метод savePlayer()
    // Отдельная таблица player_buildings больше не используется
    // Здания загружаются из поля buildings (JSONB) в методе loadOrCreatePlayer()

    // Сохранить результат боя и обновить статистику (через безопасную RPC)
    async saveBattleResult(result, rewards, opponentLevel, ratingChange) {
        if (!this.currentPlayer || !window.userData) return false;

        try {
            // Обновляем локальные данные
            window.userData.total_battles = (window.userData.total_battles || 0) + 1;

            if (result === 'win') {
                window.userData.wins = (window.userData.wins || 0) + 1;
            } else if (result === 'loss') {
                window.userData.losses = (window.userData.losses || 0) + 1;
            }

            // Обновляем рейтинг
            if (ratingChange !== undefined) {
                window.userData.rating = (window.userData.rating || 0) + ratingChange;
                window.userData.rating = Math.max(0, Math.min(9999, window.userData.rating));
            }

            // Сохраняем свои данные через безопасную RPC
            const { error } = await this.supabase.rpc('update_player_safe', {
                p_telegram_id: this.getTelegramId(),
                p_data: {
                    total_battles: window.userData.total_battles,
                    wins: window.userData.wins,
                    losses: window.userData.losses,
                    rating: window.userData.rating
                }
            });

            if (error) throw error;

            console.log(`Результат боя: ${result} (${ratingChange > 0 ? '+' : ''}${ratingChange} рейтинга)`);

            // Обновляем рейтинг противника через отдельную RPC
            if (window.selectedOpponent && ratingChange !== undefined) {
                const opponentTelegramId = window.selectedOpponent.telegram_id;

                if (opponentTelegramId) {
                    const opponentRatingChange = -ratingChange;
                    const currentOpponentRating = window.selectedOpponent.rating || 1000;
                    const newOpponentRating = Math.max(0, Math.min(9999, currentOpponentRating + opponentRatingChange));

                    // Обновляем рейтинг противника через RPC
                    await this.supabase.rpc('update_player_safe', {
                        p_telegram_id: opponentTelegramId,
                        p_data: { rating: newOpponentRating }
                    });
                }
            }

            return true;

        } catch (error) {
            console.error('Ошибка сохранения боя:', error);
            return false;
        }
    }

    // Отметить изменения для автосохранения
    markChanged() {
        this.hasUnsavedChanges = true;
    }

    // Запустить автосохранение (каждые 30 секунд)
    startAutoSave() {
        this.stopAutoSave(); // Останавливаем предыдущий интервал
        
        this.autoSaveInterval = setInterval(async () => {
            if (this.hasUnsavedChanges && window.userData) {
                const playerData = {
                    timeCurrency: window.userData.time_currency,
                    level: window.userData.level,
                    experience: window.userData.experience,
                    faction: window.userData.faction,
                    faction_changed: window.userData.faction_changed,
                    wizards: window.userData.wizards,
                    formation: window.userData.formation,
                    spells: window.userData.spells,
                    constructions: window.userData.constructions,
                    buildings: window.userData.buildings,
                    total_battles: window.userData.total_battles,
                    wins: window.userData.wins,
                    losses: window.userData.losses,
                    rating: window.userData.rating,
                    pve_progress: window.userData.pve_progress,
                    settings: window.userData.settings,
                    welcome_shown: window.userData.welcome_shown,
                    daily_login: window.userData.daily_login,
                    battle_energy: window.userData.battle_energy
                };
                await this.savePlayer(playerData);
            }
        }, 30000); // 30 секунд

        console.log('⏰ Автосохранение запущено (каждые 30 сек)');
    }

    // Остановить автосохранение
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Сохранить при выходе
    setupBeforeUnload() {
        window.addEventListener('beforeunload', async () => {
            if (this.hasUnsavedChanges && window.userData) {
                const playerData = {
                    timeCurrency: window.userData.time_currency,
                    level: window.userData.level,
                    experience: window.userData.experience,
                    faction: window.userData.faction,
                    faction_changed: window.userData.faction_changed,
                    wizards: window.userData.wizards,
                    formation: window.userData.formation,
                    spells: window.userData.spells,
                    constructions: window.userData.constructions,
                    buildings: window.userData.buildings,
                    total_battles: window.userData.total_battles,
                    wins: window.userData.wins,
                    losses: window.userData.losses,
                    rating: window.userData.rating,
                    pve_progress: window.userData.pve_progress,
                    settings: window.userData.settings,
                    welcome_shown: window.userData.welcome_shown,
                    daily_login: window.userData.daily_login,
                    battle_energy: window.userData.battle_energy
                };
                await this.savePlayer(playerData);
            }
        });
    }
}

// Создаём глобальный экземпляр
window.dbManager = new DatabaseManager();