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

    // Получить username пользователя
    getTelegramUsername() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            return user.username || user.first_name || 'Player';
        }
        return 'TestUser';
    }

    // Загрузить или создать игрока
    async loadOrCreatePlayer() {
        const telegramId = this.getTelegramId();
        
        console.log('🔍 Поиск игрока с Telegram ID:', telegramId);

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
                    time_currency: 100, // Начальная валюта
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

    // Сохранить данные игрока
    async savePlayer(playerData) {
        if (!this.currentPlayer) return false;

        try {
            // Сохраняем constructions внутри buildings
            const buildingsWithConstructions = {
                ...(playerData.buildings || {}),
                _active_constructions: playerData.constructions || []
            };
            
            const updateData = {
                time_currency: playerData.timeCurrency || playerData.time_currency || 0,
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                faction: playerData.faction || null,
                wizards: playerData.wizards || [],
                formation: playerData.formation || [null, null, null, null, null],
                spells: playerData.spells || {},
                buildings: buildingsWithConstructions,
                total_battles: playerData.total_battles || 0,
                wins: playerData.wins || 0,
                losses: playerData.losses || 0,
                rating: playerData.rating || 1000,
                pve_progress: playerData.pve_progress || {},
                settings: playerData.settings || { sound: true, language: 'ru', battle_speed: 'normal' },
                welcome_shown: playerData.welcome_shown || false,
                daily_login: playerData.daily_login || { day: 1, last_login_date: null, last_reward_date: null, total_logins: 0 }, // НОВОЕ: Ежедневные награды
                battle_energy: playerData.battle_energy || { current: 12, max: 12, last_regen: Date.now() }, // НОВОЕ: Энергия боев
                last_login: new Date().toISOString() // Обновляем время последнего входа
            };

            const { error } = await this.supabase
                .from('players')
                .update(updateData)
                .eq('id', this.currentPlayer.id);

            if (error) throw error;

            this.hasUnsavedChanges = false;
            return true;

        } catch (error) {
            console.error('❌ Ошибка сохранения игрока:', error);
            return false;
        }
    }

    // Сохранить расстановку войск
    async saveFormation(formation) {
        if (!this.currentPlayer) return false;

        try {
            const { error } = await this.supabase
                .from('players')
                .update({
                    formation: formation
                })
                .eq('id', this.currentPlayer.id);

            if (error) throw error;

            console.log('⚔️ Расстановка сохранена:', formation);
            return true;

        } catch (error) {
            console.error('❌ Ошибка сохранения расстановки:', error);
            return false;
        }
    }

    // ПРИМЕЧАНИЕ: Здания теперь сохраняются в поле buildings (JSONB) через метод savePlayer()
    // Отдельная таблица player_buildings больше не используется
    // Здания загружаются из поля buildings (JSONB) в методе loadOrCreatePlayer()

    // Сохранить результат боя и обновить статистику
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
                window.userData.rating = (window.userData.rating || 1000) + ratingChange;
                // Минимальный рейтинг - 0
                window.userData.rating = Math.max(0, window.userData.rating);
            }

            // Сохраняем в БД
            const { error } = await this.supabase
                .from('players')
                .update({
                    total_battles: window.userData.total_battles,
                    wins: window.userData.wins,
                    losses: window.userData.losses,
                    rating: window.userData.rating
                })
                .eq('id', this.currentPlayer.id);

            if (error) throw error;

            console.log(`⚔️ Результат боя сохранён: ${result} (${ratingChange > 0 ? '+' : ''}${ratingChange} рейтинга)`);
            console.log(`📊 Статистика: ${window.userData.wins}W / ${window.userData.losses}L | Рейтинг: ${window.userData.rating}`);

            // НОВОЕ: Обновляем рейтинг противника (симметрично)
            // Для всех противников (включая ботов)
            console.log('🔍 DEBUG: Проверка обновления рейтинга противника');
            console.log('   selectedOpponent:', window.selectedOpponent);
            console.log('   ratingChange:', ratingChange);

            if (window.selectedOpponent && ratingChange !== undefined) {
                const opponentId = window.selectedOpponent.id;
                console.log('   opponentId:', opponentId);

                // Проверяем что ID валиден (не undefined и не null)
                if (opponentId !== undefined && opponentId !== null) {
                    const opponentRatingChange = -ratingChange; // Противоположное изменение
                    const currentOpponentRating = window.selectedOpponent.rating || 1000;
                    const newOpponentRating = Math.max(0, currentOpponentRating + opponentRatingChange);

                    console.log(`📊 ОБНОВЛЯЕМ РЕЙТИНГ ПРОТИВНИКА:`);
                    console.log(`   Противник: ${window.selectedOpponent.username} (ID: ${opponentId})`);
                    console.log(`   Текущий рейтинг: ${currentOpponentRating}`);
                    console.log(`   Изменение: ${opponentRatingChange}`);
                    console.log(`   Новый рейтинг: ${newOpponentRating}`);

                    const { error: opponentError } = await this.supabase
                        .from('players')
                        .update({
                            rating: newOpponentRating
                        })
                        .eq('id', opponentId);

                    if (opponentError) {
                        console.error('⚠️ Ошибка обновления рейтинга противника:', opponentError);
                    } else {
                        console.log(`   ${window.selectedOpponent.username}: ${currentOpponentRating} → ${newOpponentRating} (${opponentRatingChange > 0 ? '+' : ''}${opponentRatingChange})`);
                    }
                } else {
                    console.log('⚠️ Противник не имеет валидного ID:', opponentId);
                }
            } else {
                console.log('⚠️ Не выполнены условия для обновления рейтинга противника');
                if (!window.selectedOpponent) console.log('   Причина: нет selectedOpponent');
                if (ratingChange === undefined) console.log('   Причина: ratingChange === undefined');
            }

            return true;

        } catch (error) {
            console.error('❌ Ошибка сохранения боя:', error);
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