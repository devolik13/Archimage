// database/guild-manager.js - Менеджер гильдий

// Конфигурация гильдий
const GUILD_CONFIG = {
    MAX_LEVEL: 30,
    HP_BONUS_PER_LEVEL: 10,         // +10% HP за уровень
    DAMAGE_BONUS_PER_LEVEL: 1,      // +1% урона за уровень
    BASE_CAPACITY: 10,               // Стартовая вместимость
    CAPACITY_BONUS_LEVELS: [5, 10, 15, 20, 25, 30], // Уровни когда +5 вместимость
    CAPACITY_BONUS: 5,               // +5 человек на этих уровнях
    CAPACITY_EXP_MULTIPLIER: 0.03,   // +3% опыта за каждого доп. игрока сверх базы
    RESISTANCE_PER_POINT: 0.5,       // 0.5% сопротивления за 1 очко
    MAX_RESISTANCE_POINTS: 30,       // Макс очков на школу
    INACTIVE_DAYS_FOR_TRANSFER: 7,   // Дней неактивности для передачи лидерства
    SCHOOLS: ['fire', 'water', 'earth', 'wind', 'poison'] // Школы для исследований
};

// Прогрессия опыта гильдии (квадратичная с учетом вместимости)
function getExpToNextLevel(level) {
    // После макс уровня - используем формулу как для уровня 31
    const calcLevel = level > GUILD_CONFIG.MAX_LEVEL ? (GUILD_CONFIG.MAX_LEVEL + 1) : level;

    // Базовая квадратичная прогрессия: (100 + level^2 * 50) * 3
    const baseExp = (100 + (calcLevel * calcLevel * 50)) * 3;

    // Множитель на основе вместимости: +3% за каждого игрока сверх базы
    const capacity = getGuildCapacity(Math.min(level, GUILD_CONFIG.MAX_LEVEL));
    const extraPlayers = capacity - GUILD_CONFIG.BASE_CAPACITY;
    const capacityMultiplier = 1 + (extraPlayers * GUILD_CONFIG.CAPACITY_EXP_MULTIPLIER);

    return Math.floor(baseExp * capacityMultiplier);
}

// Получить вместимость гильдии по уровню
function getGuildCapacity(level) {
    let capacity = GUILD_CONFIG.BASE_CAPACITY;
    for (const bonusLevel of GUILD_CONFIG.CAPACITY_BONUS_LEVELS) {
        if (level >= bonusLevel) {
            capacity += GUILD_CONFIG.CAPACITY_BONUS;
        }
    }
    return capacity;
}

// Получить бонусы гильдии по уровню
function getGuildBonuses(level, research = {}) {
    const hpBonus = level * GUILD_CONFIG.HP_BONUS_PER_LEVEL;
    const damageBonus = level * GUILD_CONFIG.DAMAGE_BONUS_PER_LEVEL;
    const capacity = getGuildCapacity(level);

    // Сопротивления
    const resistances = {};
    for (const school of GUILD_CONFIG.SCHOOLS) {
        const points = research[school] || 0;
        resistances[school] = points * GUILD_CONFIG.RESISTANCE_PER_POINT;
    }

    return {
        hpBonus,           // В процентах
        damageBonus,       // В процентах
        capacity,
        resistances        // Объект со школами и их сопротивлением в %
    };
}

class GuildManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentGuild = null;
        this.guildMembers = [];
    }

    // === СОЗДАНИЕ ГИЛЬДИИ ===
    async createGuild(name, tag) {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            console.error('Supabase или игрок не инициализированы');
            return { success: false, error: 'Не авторизован' };
        }

        const playerId = window.dbManager.currentPlayer.id;

        // Проверяем что игрок не в гильдии
        if (window.userData?.guild_id) {
            return { success: false, error: 'Вы уже состоите в гильдии' };
        }

        // Валидация
        if (!name || name.length < 3 || name.length > 50) {
            return { success: false, error: 'Название должно быть от 3 до 50 символов' };
        }
        if (!tag || tag.length < 2 || tag.length > 5) {
            return { success: false, error: 'Тег должен быть от 2 до 5 символов' };
        }

        try {
            // Создаём гильдию
            const { data: guild, error } = await this.supabase
                .from('guilds')
                .insert([{
                    name: name.trim(),
                    tag: tag.trim().toUpperCase(),
                    leader_id: playerId,
                    experience: 0,
                    level: 1,
                    bonus_points: 1,
                    research: { fire: 0, water: 0, earth: 0, wind: 0, poison: 0 },
                    join_mode: 'free',
                    join_requests: []
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    return { success: false, error: 'Гильдия с таким названием уже существует' };
                }
                throw error;
            }

            // Обновляем игрока
            const { error: playerError } = await this.supabase
                .from('players')
                .update({
                    guild_id: guild.id,
                    guild_contribution: 0,
                    guild_last_active: new Date().toISOString()
                })
                .eq('id', playerId);

            if (playerError) throw playerError;

            // Обновляем локальные данные
            window.userData.guild_id = guild.id;
            window.userData.guild_contribution = 0;
            window.userData.guild_last_active = new Date().toISOString();
            this.currentGuild = guild;

            console.log('Гильдия создана:', guild);
            return { success: true, guild };

        } catch (error) {
            console.error('Ошибка создания гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === ЗАГРУЗКА ГИЛЬДИИ ИГРОКА ===
    async loadPlayerGuild() {
        if (!window.userData?.guild_id) {
            this.currentGuild = null;
            return null;
        }

        try {
            const { data: guild, error } = await this.supabase
                .from('guilds')
                .select('*')
                .eq('id', window.userData.guild_id)
                .single();

            if (error) throw error;

            this.currentGuild = guild;
            await this.loadGuildMembers();

            return guild;

        } catch (error) {
            console.error('Ошибка загрузки гильдии:', error);
            return null;
        }
    }

    // === ЗАГРУЗКА ЧЛЕНОВ ГИЛЬДИИ ===
    async loadGuildMembers() {
        if (!this.currentGuild) return [];

        try {
            const { data: members, error } = await this.supabase
                .from('players')
                .select('id, username, level, rating, guild_contribution, guild_last_active')
                .eq('guild_id', this.currentGuild.id)
                .order('guild_contribution', { ascending: false });

            if (error) throw error;

            this.guildMembers = members;
            return members;

        } catch (error) {
            console.error('Ошибка загрузки членов гильдии:', error);
            return [];
        }
    }

    // === ВСТУПЛЕНИЕ В ГИЛЬДИЮ ===
    async joinGuild(guildId) {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            return { success: false, error: 'Не авторизован' };
        }

        const playerId = window.dbManager.currentPlayer.id;

        if (window.userData?.guild_id) {
            return { success: false, error: 'Вы уже состоите в гильдии' };
        }

        try {
            // Получаем гильдию
            const { data: guild, error: guildError } = await this.supabase
                .from('guilds')
                .select('*')
                .eq('id', guildId)
                .single();

            if (guildError) throw guildError;

            // Проверяем вместимость
            const { count } = await this.supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('guild_id', guildId);

            const capacity = getGuildCapacity(guild.level);
            if (count >= capacity) {
                return { success: false, error: 'Гильдия переполнена' };
            }

            // Проверяем режим вступления
            if (guild.join_mode === 'request') {
                // Добавляем заявку
                const requests = guild.join_requests || [];
                const existingRequest = requests.find(r => r.player_id === playerId);
                if (existingRequest) {
                    return { success: false, error: 'Заявка уже подана' };
                }

                requests.push({
                    player_id: playerId,
                    username: window.userData.username || 'Player',
                    date: new Date().toISOString()
                });

                const { error: updateError } = await this.supabase
                    .from('guilds')
                    .update({ join_requests: requests })
                    .eq('id', guildId);

                if (updateError) throw updateError;

                return { success: true, message: 'Заявка отправлена' };
            }

            // Свободное вступление
            const { error: playerError } = await this.supabase
                .from('players')
                .update({
                    guild_id: guildId,
                    guild_contribution: 0,
                    guild_last_active: new Date().toISOString()
                })
                .eq('id', playerId);

            if (playerError) throw playerError;

            window.userData.guild_id = guildId;
            window.userData.guild_contribution = 0;
            this.currentGuild = guild;

            return { success: true, message: 'Вы вступили в гильдию!' };

        } catch (error) {
            console.error('Ошибка вступления в гильдию:', error);
            return { success: false, error: error.message };
        }
    }

    // === ВЫХОД ИЗ ГИЛЬДИИ ===
    async leaveGuild() {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            return { success: false, error: 'Не авторизован' };
        }

        if (!window.userData?.guild_id) {
            return { success: false, error: 'Вы не состоите в гильдии' };
        }

        const playerId = window.dbManager.currentPlayer.id;
        const guildId = window.userData.guild_id;

        try {
            // Проверяем, является ли игрок лидером
            if (this.currentGuild?.leader_id === playerId) {
                // Передаём лидерство или удаляем гильдию
                const result = await this.transferLeadership();
                if (!result.success && result.deleteGuild) {
                    // Удаляем гильдию если нет других членов
                    await this.deleteGuild(guildId);
                }
            }

            // Выходим из гильдии
            const { error } = await this.supabase
                .from('players')
                .update({
                    guild_id: null,
                    guild_contribution: 0,
                    guild_last_active: null
                })
                .eq('id', playerId);

            if (error) throw error;

            window.userData.guild_id = null;
            window.userData.guild_contribution = 0;
            this.currentGuild = null;
            this.guildMembers = [];

            return { success: true, message: 'Вы вышли из гильдии' };

        } catch (error) {
            console.error('Ошибка выхода из гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === ПЕРЕДАЧА ЛИДЕРСТВА ===
    async transferLeadership(newLeaderId = null) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        try {
            await this.loadGuildMembers();

            // Если не указан новый лидер, выбираем самого активного
            if (!newLeaderId) {
                const playerId = window.dbManager.currentPlayer.id;
                const candidates = this.guildMembers.filter(m => m.id !== playerId);

                if (candidates.length === 0) {
                    return { success: false, deleteGuild: true, error: 'Нет других членов' };
                }

                // Сортируем по вкладу
                candidates.sort((a, b) => (b.guild_contribution || 0) - (a.guild_contribution || 0));
                newLeaderId = candidates[0].id;
            }

            // Передаём лидерство
            const { error } = await this.supabase
                .from('guilds')
                .update({ leader_id: newLeaderId })
                .eq('id', this.currentGuild.id);

            if (error) throw error;

            this.currentGuild.leader_id = newLeaderId;
            return { success: true, newLeaderId };

        } catch (error) {
            console.error('Ошибка передачи лидерства:', error);
            return { success: false, error: error.message };
        }
    }

    // === УДАЛЕНИЕ ГИЛЬДИИ ===
    async deleteGuild(guildId) {
        try {
            // Сначала убираем всех членов
            await this.supabase
                .from('players')
                .update({ guild_id: null, guild_contribution: 0 })
                .eq('guild_id', guildId);

            // Удаляем гильдию
            const { error } = await this.supabase
                .from('guilds')
                .delete()
                .eq('id', guildId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Ошибка удаления гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === ДОБАВЛЕНИЕ ОПЫТА ГИЛЬДИИ ===
    async addGuildExperience(expAmount) {
        if (!this.currentGuild || !window.userData?.guild_id) {
            return { success: false };
        }

        try {
            let { experience, level, bonus_points } = this.currentGuild;
            experience += expAmount;

            // Проверяем повышение уровня
            let leveledUp = false;
            let expToNext = getExpToNextLevel(level);

            while (experience >= expToNext) {
                experience -= expToNext;

                if (level < GUILD_CONFIG.MAX_LEVEL) {
                    level++;
                    leveledUp = true;
                }

                // На любом уровне (включая 30) даём очко
                bonus_points++;

                expToNext = getExpToNextLevel(level);
            }

            // Обновляем гильдию в БД
            const { error } = await this.supabase
                .from('guilds')
                .update({ experience, level, bonus_points })
                .eq('id', this.currentGuild.id);

            if (error) throw error;

            // Обновляем вклад игрока
            const playerId = window.dbManager.currentPlayer.id;
            const newContribution = (window.userData.guild_contribution || 0) + expAmount;

            await this.supabase
                .from('players')
                .update({
                    guild_contribution: newContribution,
                    guild_last_active: new Date().toISOString()
                })
                .eq('id', playerId);

            window.userData.guild_contribution = newContribution;

            // Обновляем локальные данные
            this.currentGuild.experience = experience;
            this.currentGuild.level = level;
            this.currentGuild.bonus_points = bonus_points;

            return { success: true, leveledUp, newLevel: level };

        } catch (error) {
            console.error('Ошибка добавления опыта гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === РАСПРЕДЕЛЕНИЕ ОЧКОВ ИССЛЕДОВАНИЙ (ТОЛЬКО ЛИДЕР) ===
    async spendResearchPoint(school) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        const playerId = window.dbManager.currentPlayer.id;
        if (this.currentGuild.leader_id !== playerId) {
            return { success: false, error: 'Только глава может распределять очки' };
        }

        if (this.currentGuild.bonus_points < 1) {
            return { success: false, error: 'Нет доступных очков' };
        }

        if (!GUILD_CONFIG.SCHOOLS.includes(school)) {
            return { success: false, error: 'Неверная школа магии' };
        }

        const research = { ...this.currentGuild.research };
        if ((research[school] || 0) >= GUILD_CONFIG.MAX_RESISTANCE_POINTS) {
            return { success: false, error: 'Достигнут максимум для этой школы (30 очков)' };
        }

        try {
            research[school] = (research[school] || 0) + 1;
            const newBonusPoints = this.currentGuild.bonus_points - 1;

            const { error } = await this.supabase
                .from('guilds')
                .update({
                    research,
                    bonus_points: newBonusPoints
                })
                .eq('id', this.currentGuild.id);

            if (error) throw error;

            this.currentGuild.research = research;
            this.currentGuild.bonus_points = newBonusPoints;

            const resistance = research[school] * GUILD_CONFIG.RESISTANCE_PER_POINT;
            return { success: true, school, points: research[school], resistance };

        } catch (error) {
            console.error('Ошибка распределения очков:', error);
            return { success: false, error: error.message };
        }
    }

    // === ИЗМЕНЕНИЕ РЕЖИМА ВСТУПЛЕНИЯ (ТОЛЬКО ЛИДЕР) ===
    async setJoinMode(mode) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        const playerId = window.dbManager.currentPlayer.id;
        if (this.currentGuild.leader_id !== playerId) {
            return { success: false, error: 'Только глава может изменять настройки' };
        }

        if (!['free', 'request'].includes(mode)) {
            return { success: false, error: 'Неверный режим' };
        }

        try {
            const { error } = await this.supabase
                .from('guilds')
                .update({ join_mode: mode })
                .eq('id', this.currentGuild.id);

            if (error) throw error;

            this.currentGuild.join_mode = mode;
            return { success: true, mode };

        } catch (error) {
            console.error('Ошибка изменения режима:', error);
            return { success: false, error: error.message };
        }
    }

    // === КИК ЧЛЕНА ГИЛЬДИИ (ТОЛЬКО ЛИДЕР) ===
    async kickMember(playerId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        const leaderId = window.dbManager.currentPlayer.id;
        if (this.currentGuild.leader_id !== leaderId) {
            return { success: false, error: 'Только глава может исключать членов' };
        }

        // Нельзя кикнуть себя
        if (playerId === leaderId) {
            return { success: false, error: 'Нельзя исключить себя из гильдии' };
        }

        try {
            // Проверяем что игрок в нашей гильдии
            const { data: player, error: playerError } = await this.supabase
                .from('players')
                .select('id, username, guild_id')
                .eq('id', playerId)
                .single();

            if (playerError) throw playerError;

            if (player.guild_id !== this.currentGuild.id) {
                return { success: false, error: 'Игрок не состоит в вашей гильдии' };
            }

            // Исключаем игрока
            const { error } = await this.supabase
                .from('players')
                .update({
                    guild_id: null,
                    guild_contribution: 0,
                    guild_last_active: null
                })
                .eq('id', playerId);

            if (error) throw error;

            // Обновляем локальный список членов
            this.guildMembers = this.guildMembers.filter(m => m.id !== playerId);

            console.log(`👢 Игрок ${player.username} исключён из гильдии`);
            return { success: true, message: `${player.username} исключён из гильдии` };

        } catch (error) {
            console.error('Ошибка исключения игрока:', error);
            return { success: false, error: error.message };
        }
    }

    // === ОДОБРЕНИЕ/ОТКЛОНЕНИЕ ЗАЯВКИ (ТОЛЬКО ЛИДЕР) ===
    async handleJoinRequest(playerId, approve) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        const leaderId = window.dbManager.currentPlayer.id;
        if (this.currentGuild.leader_id !== leaderId) {
            return { success: false, error: 'Только глава может управлять заявками' };
        }

        try {
            const requests = this.currentGuild.join_requests || [];
            const requestIndex = requests.findIndex(r => r.player_id === playerId);

            if (requestIndex === -1) {
                return { success: false, error: 'Заявка не найдена' };
            }

            // Удаляем заявку из списка
            requests.splice(requestIndex, 1);

            if (approve) {
                // Проверяем вместимость
                const { count } = await this.supabase
                    .from('players')
                    .select('*', { count: 'exact', head: true })
                    .eq('guild_id', this.currentGuild.id);

                const capacity = getGuildCapacity(this.currentGuild.level);
                if (count >= capacity) {
                    return { success: false, error: 'Гильдия переполнена' };
                }

                // Добавляем игрока
                await this.supabase
                    .from('players')
                    .update({
                        guild_id: this.currentGuild.id,
                        guild_contribution: 0,
                        guild_last_active: new Date().toISOString()
                    })
                    .eq('id', playerId);
            }

            // Обновляем список заявок
            await this.supabase
                .from('guilds')
                .update({ join_requests: requests })
                .eq('id', this.currentGuild.id);

            this.currentGuild.join_requests = requests;

            return { success: true, approved: approve };

        } catch (error) {
            console.error('Ошибка обработки заявки:', error);
            return { success: false, error: error.message };
        }
    }

    // === ПОИСК ГИЛЬДИЙ ===
    async searchGuilds(query = '', limit = 20) {
        try {
            let queryBuilder = this.supabase
                .from('guilds')
                .select('id, name, tag, level, experience')
                .order('level', { ascending: false })
                .limit(limit);

            if (query) {
                queryBuilder = queryBuilder.or(`name.ilike.%${query}%,tag.ilike.%${query}%`);
            }

            const { data: guilds, error } = await queryBuilder;

            if (error) throw error;

            // Добавляем информацию о членах
            for (const guild of guilds) {
                const { count } = await this.supabase
                    .from('players')
                    .select('*', { count: 'exact', head: true })
                    .eq('guild_id', guild.id);

                guild.memberCount = count;
                guild.capacity = getGuildCapacity(guild.level);
            }

            return guilds;

        } catch (error) {
            console.error('Ошибка поиска гильдий:', error);
            return [];
        }
    }

    // === ПРОВЕРКА НЕАКТИВНОСТИ ЛИДЕРА ===
    async checkLeaderInactivity() {
        if (!this.currentGuild) return;

        try {
            // Получаем лидера
            const { data: leader, error } = await this.supabase
                .from('players')
                .select('id, guild_last_active')
                .eq('id', this.currentGuild.leader_id)
                .single();

            if (error) throw error;

            const lastActive = new Date(leader.guild_last_active);
            const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceActive >= GUILD_CONFIG.INACTIVE_DAYS_FOR_TRANSFER) {
                console.log('Лидер неактивен более 7 дней, передаём лидерство');
                await this.transferLeadership();
            }

        } catch (error) {
            console.error('Ошибка проверки неактивности:', error);
        }
    }

    // === ПОЛУЧИТЬ БОНУСЫ ТЕКУЩЕЙ ГИЛЬДИИ ===
    getGuildBonuses() {
        if (!this.currentGuild) return null;
        return getGuildBonuses(this.currentGuild.level, this.currentGuild.research);
    }

    // === ЯВЛЯЕТСЯ ЛИ ТЕКУЩИЙ ИГРОК ЛИДЕРОМ ===
    isLeader() {
        if (!this.currentGuild || !window.dbManager?.currentPlayer) return false;
        return this.currentGuild.leader_id === window.dbManager.currentPlayer.id;
    }
}

// Создаём глобальный экземпляр
window.guildManager = new GuildManager();

// === ФОРМАТИРОВАНИЕ ИМЕНИ С ТЕГОМ ГИЛЬДИИ ===
/**
 * Форматирует имя игрока с тегом гильдии
 * @param {string} username - Имя игрока
 * @param {string|null} guildTag - Тег гильдии (опционально)
 * @returns {string} - Отформатированное имя
 */
function formatPlayerName(username, guildTag = null) {
    const name = username || 'Игрок';
    if (guildTag) {
        return `[${guildTag}] ${name}`;
    }
    return name;
}

/**
 * Получает отформатированное имя текущего игрока с тегом гильдии
 * @returns {string} - Имя с тегом гильдии или просто имя
 */
function getCurrentPlayerDisplayName() {
    const username = window.userData?.username || 'Игрок';
    const guildTag = window.guildManager?.currentGuild?.tag || null;
    return formatPlayerName(username, guildTag);
}

// Экспортируем конфиг и функции
window.GUILD_CONFIG = GUILD_CONFIG;
window.getGuildBonuses = getGuildBonuses;
window.getGuildCapacity = getGuildCapacity;
window.getExpToNextLevel = getExpToNextLevel;
window.formatPlayerName = formatPlayerName;
window.getCurrentPlayerDisplayName = getCurrentPlayerDisplayName;

