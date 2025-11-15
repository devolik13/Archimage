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
            console.log('✅ Игрок загружен:', data);
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
                available_spells: playerData.available_spells || [],
                buildings: buildingsWithConstructions,
                last_save: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('players')
                .update(updateData)
                .eq('id', this.currentPlayer.id);

            if (error) throw error;

            this.hasUnsavedChanges = false;
            console.log('💾 Игрок сохранён:', {
                wizards: updateData.wizards.length,
                spells: Object.keys(updateData.spells).length,
                buildings: Object.keys(updateData.buildings).length - 1, // -1 для _active_constructions
                constructions: (updateData.buildings._active_constructions || []).length,
                time_currency: updateData.time_currency
            });
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
                    formation: formation,
                    last_save: new Date().toISOString()
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

    // Сохранить результат боя
    async saveBattleResult(result, rewards, opponentLevel) {
        if (!this.currentPlayer) return false;

        try {
            const { error } = await this.supabase
                .from('battle_history')
                .insert([{
                    player_id: this.currentPlayer.id,
                    result: result, // 'win' или 'loss'
                    rewards: rewards, // JSON объект
                    opponent_level: opponentLevel
                }]);

            if (error) throw error;

            console.log('Результат боя сохранён');
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
                console.log('💾 Автосохранение...');
                const playerData = {
                    timeCurrency: window.userData.time_currency,
                    level: window.userData.level,
                    experience: window.userData.experience,
                    faction: window.userData.faction,
                    wizards: window.userData.wizards,
                    formation: window.userData.formation,
                    spells: window.userData.spells,
                    available_spells: window.userData.available_spells,
                    constructions: window.userData.constructions,
                    buildings: window.userData.buildings
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
                    available_spells: window.userData.available_spells,
                    constructions: window.userData.constructions,
                    buildings: window.userData.buildings
                };
                await this.savePlayer(playerData);
            }
        });
    }
}

// Создаём глобальный экземпляр
window.dbManager = new DatabaseManager();