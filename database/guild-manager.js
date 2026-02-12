// database/guild-manager.js - Менеджер гильдий

// Конфигурация гильдий
const GUILD_CONFIG = {
    MAX_LEVEL: 30,
    HP_BONUS_PER_LEVEL: 5,          // +5% HP за уровень
    DAMAGE_BONUS_PER_LEVEL: 1,      // +1% урона за уровень
    BASE_CAPACITY: 10,               // Стартовая вместимость
    CAPACITY_BONUS_LEVELS: [5, 10, 15, 20, 25, 30], // Уровни когда +5 вместимость
    CAPACITY_BONUS: 5,               // +5 человек на этих уровнях
    CAPACITY_EXP_MULTIPLIER: 0.03,   // +3% опыта за каждого доп. игрока сверх базы
    RESISTANCE_PER_POINT: 0.5,       // 0.5% сопротивления за 1 очко
    MAX_RESISTANCE_POINTS: 30,       // Макс очков на школу
    INACTIVE_DAYS_FOR_TRANSFER: 7,   // Дней неактивности для передачи лидерства
    SCHOOLS: ['fire', 'water', 'earth', 'wind', 'poison', 'light', 'dark'], // Школы для исследований (без nature - нет атакующих)
    RESEARCH_CYCLE_MULTIPLIER: 0.20  // +20% за каждое очко исследований после 30 уровня
};

// Расчет количества циклов исследований после 30 уровня
function getResearchCycles(guild) {
    if (!guild || guild.level < GUILD_CONFIG.MAX_LEVEL) return 0;

    // Общее количество потраченных очков
    const totalSpentPoints = Object.values(guild.research || {}).reduce((sum, v) => sum + v, 0);
    // Общее количество заработанных очков = потраченные + доступные
    const totalEarnedPoints = totalSpentPoints + (guild.bonus_points || 0);

    // Очки от уровней 1-30 = 30, остальное - циклы после 30
    return Math.max(0, totalEarnedPoints - GUILD_CONFIG.MAX_LEVEL);
}

// Прогрессия опыта гильдии (квадратичная с учетом вместимости и циклов после 30)
function getExpToNextLevel(level, researchCycles = 0) {
    // После макс уровня - используем формулу как для уровня 31
    const calcLevel = level > GUILD_CONFIG.MAX_LEVEL ? (GUILD_CONFIG.MAX_LEVEL + 1) : level;

    // Базовая квадратичная прогрессия: (100 + level^2 * 50) * 6 (удвоено)
    const baseExp = (100 + (calcLevel * calcLevel * 50)) * 6;

    // Множитель на основе вместимости: +3% за каждого игрока сверх базы
    const capacity = getGuildCapacity(Math.min(level, GUILD_CONFIG.MAX_LEVEL));
    const extraPlayers = capacity - GUILD_CONFIG.BASE_CAPACITY;
    const capacityMultiplier = 1 + (extraPlayers * GUILD_CONFIG.CAPACITY_EXP_MULTIPLIER);

    // Множитель для очков исследований после 30 уровня: +20% за каждый предыдущий цикл
    let researchMultiplier = 1;
    if (level >= GUILD_CONFIG.MAX_LEVEL && researchCycles > 0) {
        researchMultiplier = Math.pow(1 + GUILD_CONFIG.RESEARCH_CYCLE_MULTIPLIER, researchCycles);
    }

    return Math.floor(baseExp * capacityMultiplier * researchMultiplier);
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

    // === СОЗДАНИЕ ГИЛЬДИИ (через RPC для обновления игрока) ===
    async createGuild(name, tag) {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            console.error('Supabase или игрок не инициализированы');
            return { success: false, error: 'Не авторизован' };
        }

        const playerId = window.dbManager.currentPlayer.id;
        const telegramId = window.dbManager.getTelegramId();

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

            // Обновляем игрока через безопасную RPC
            const { error: playerError } = await this.supabase.rpc('update_player_safe', {
                p_telegram_id: telegramId,
                p_data: {
                    guild_id: guild.id,
                    guild_contribution: 0,
                    guild_last_active: new Date().toISOString()
                }
            });

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

    // === ВСТУПЛЕНИЕ В ГИЛЬДИЮ (через RPC) ===
    async joinGuild(guildId) {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            return { success: false, error: 'Не авторизован' };
        }

        const telegramId = window.dbManager.getTelegramId();

        if (window.userData?.guild_id) {
            return { success: false, error: 'Вы уже состоите в гильдии' };
        }

        try {
            // Получаем гильдию для проверки режима
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

            // Вызываем RPC для вступления
            const { data, error } = await this.supabase.rpc('guild_join_request', {
                p_guild_id: guildId,
                p_telegram_id: telegramId,
                p_username: window.userData.username || 'Player',
                p_action: guild.join_mode === 'request' ? 'request' : 'join'
            });

            if (error) throw error;

            if (!data || !data.success) {
                return { success: false, error: data?.error || 'Ошибка вступления' };
            }

            // Если это заявка
            if (data.action === 'request') {
                return { success: true, message: 'Заявка отправлена' };
            }

            // Если прямое вступление
            window.userData.guild_id = guildId;
            window.userData.guild_contribution = 0;
            this.currentGuild = guild;

            return { success: true, message: 'Вы вступили в гильдию!' };

        } catch (error) {
            console.error('Ошибка вступления в гильдию:', error);
            return { success: false, error: error.message };
        }
    }

    // === ВЫХОД ИЗ ГИЛЬДИИ (через RPC) ===
    async leaveGuild() {
        if (!this.supabase || !window.dbManager?.currentPlayer) {
            return { success: false, error: 'Не авторизован' };
        }

        if (!window.userData?.guild_id) {
            return { success: false, error: 'Вы не состоите в гильдии' };
        }

        const playerId = window.dbManager.currentPlayer.id;
        const telegramId = window.dbManager.getTelegramId();
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

            // Выходим из гильдии через специальную RPC
            const { data, error } = await this.supabase.rpc('leave_guild', {
                p_telegram_id: telegramId
            });

            if (error) throw error;

            if (!data || !data.success) {
                return { success: false, error: data?.error || 'Ошибка выхода из гильдии' };
            }

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

    // === ПЕРЕДАЧА ЛИДЕРСТВА (через RPC) ===
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

            const telegramId = window.dbManager.getTelegramId();

            // Передаём лидерство через RPC
            const { data, error } = await this.supabase.rpc('update_guild_by_leader', {
                p_guild_id: this.currentGuild.id,
                p_telegram_id: telegramId,
                p_data: { leader_id: newLeaderId }
            });

            if (error) throw error;

            if (!data) {
                return { success: false, error: 'Только глава может передавать лидерство' };
            }

            this.currentGuild.leader_id = newLeaderId;
            return { success: true, newLeaderId };

        } catch (error) {
            console.error('Ошибка передачи лидерства:', error);
            return { success: false, error: error.message };
        }
    }

    // === УДАЛЕНИЕ ГИЛЬДИИ (через RPC) ===
    async deleteGuild(guildId) {
        try {
            const telegramId = window.dbManager.getTelegramId();

            // Вызываем RPC для удаления гильдии (только лидер может удалить)
            const { data, error } = await this.supabase.rpc('guild_delete', {
                p_guild_id: guildId,
                p_leader_telegram_id: telegramId
            });

            if (error) throw error;

            if (!data || !data.success) {
                return { success: false, error: data?.error || 'Ошибка удаления гильдии' };
            }

            return { success: true };
        } catch (error) {
            console.error('Ошибка удаления гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === ДОБАВЛЕНИЕ ОПЫТА ГИЛЬДИИ (через безопасную RPC) ===
    async addGuildExperience(expAmount) {
        if (!this.currentGuild || !window.userData?.guild_id) {
            return { success: false };
        }

        try {
            const telegramId = window.dbManager.getTelegramId();

            // Вызываем безопасную RPC функцию
            const { data, error } = await this.supabase.rpc('guild_add_experience', {
                p_guild_id: this.currentGuild.id,
                p_telegram_id: telegramId,
                p_exp_amount: expAmount
            });

            if (error) throw error;

            // Обновляем локальные данные из результата RPC
            if (data) {
                this.currentGuild.experience = data.new_experience;
                this.currentGuild.level = data.new_level;
                this.currentGuild.bonus_points = data.new_bonus_points;
                window.userData.guild_contribution = data.new_contribution;
            }

            return {
                success: true,
                leveledUp: data?.leveled_up || false,
                newLevel: data?.new_level || this.currentGuild.level
            };

        } catch (error) {
            console.error('Ошибка добавления опыта гильдии:', error);
            return { success: false, error: error.message };
        }
    }

    // === РАСПРЕДЕЛЕНИЕ ОЧКОВ ИССЛЕДОВАНИЙ (ТОЛЬКО ЛИДЕР, через RPC) ===
    async spendResearchPoint(school) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        // Локальные проверки (RPC тоже проверяет)
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
            // Подготавливаем новые данные
            research[school] = (research[school] || 0) + 1;
            const newBonusPoints = this.currentGuild.bonus_points - 1;

            const telegramId = window.dbManager.getTelegramId();

            // Вызываем RPC (проверяет что caller = leader)
            const { data, error } = await this.supabase.rpc('update_guild_by_leader', {
                p_guild_id: this.currentGuild.id,
                p_telegram_id: telegramId,
                p_data: {
                    research: research,
                    bonus_points: newBonusPoints
                }
            });

            if (error) throw error;

            if (!data) {
                return { success: false, error: 'Только глава может распределять очки' };
            }

            this.currentGuild.research = research;
            this.currentGuild.bonus_points = newBonusPoints;

            const resistance = research[school] * GUILD_CONFIG.RESISTANCE_PER_POINT;
            return { success: true, school, points: research[school], resistance };

        } catch (error) {
            console.error('Ошибка распределения очков:', error);
            return { success: false, error: error.message };
        }
    }

    // === ИЗМЕНЕНИЕ РЕЖИМА ВСТУПЛЕНИЯ (ТОЛЬКО ЛИДЕР, через RPC) ===
    async setJoinMode(mode) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        if (!['free', 'request'].includes(mode)) {
            return { success: false, error: 'Неверный режим' };
        }

        try {
            const telegramId = window.dbManager.getTelegramId();

            // Вызываем RPC (проверяет что caller = leader)
            const { data, error } = await this.supabase.rpc('update_guild_by_leader', {
                p_guild_id: this.currentGuild.id,
                p_telegram_id: telegramId,
                p_data: { join_mode: mode }
            });

            if (error) throw error;

            if (!data) {
                return { success: false, error: 'Только глава может изменять настройки' };
            }

            this.currentGuild.join_mode = mode;
            return { success: true, mode };

        } catch (error) {
            console.error('Ошибка изменения режима:', error);
            return { success: false, error: error.message };
        }
    }

    // === КИК ЧЛЕНА ГИЛЬДИИ (ТОЛЬКО ЛИДЕР, через RPC) ===
    async kickMember(playerId) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        const leaderId = window.dbManager.currentPlayer.id;
        const telegramId = window.dbManager.getTelegramId();

        // Нельзя кикнуть себя (локальная проверка)
        if (playerId === leaderId) {
            return { success: false, error: 'Нельзя исключить себя из гильдии' };
        }

        try {
            // Получаем username для сообщения
            const { data: player } = await this.supabase
                .from('players')
                .select('username')
                .eq('id', playerId)
                .single();

            // Вызываем RPC для кика
            const { data, error } = await this.supabase.rpc('guild_kick_member', {
                p_guild_id: this.currentGuild.id,
                p_leader_telegram_id: telegramId,
                p_target_player_id: playerId
            });

            if (error) throw error;

            if (!data || !data.success) {
                return { success: false, error: data?.error || 'Ошибка исключения игрока' };
            }

            // Обновляем локальный список членов
            this.guildMembers = this.guildMembers.filter(m => m.id !== playerId);

            const username = player?.username || 'Игрок';
            console.log(`👢 Игрок ${username} исключён из гильдии`);
            return { success: true, message: `${username} исключён из гильдии` };

        } catch (error) {
            console.error('Ошибка исключения игрока:', error);
            return { success: false, error: error.message };
        }
    }

    // === ОДОБРЕНИЕ/ОТКЛОНЕНИЕ ЗАЯВКИ (ТОЛЬКО ЛИДЕР, через RPC) ===
    async handleJoinRequest(playerId, approve) {
        if (!this.currentGuild) {
            return { success: false, error: 'Гильдия не загружена' };
        }

        try {
            const telegramId = window.dbManager.getTelegramId();

            // Вызываем RPC для обработки заявки
            const { data, error } = await this.supabase.rpc('guild_handle_request', {
                p_guild_id: this.currentGuild.id,
                p_leader_telegram_id: telegramId,
                p_target_player_id: playerId,
                p_approve: approve
            });

            if (error) throw error;

            if (!data || !data.success) {
                return { success: false, error: data?.error || 'Ошибка обработки заявки' };
            }

            // Обновляем локальный список заявок
            if (this.currentGuild.join_requests) {
                this.currentGuild.join_requests = this.currentGuild.join_requests.filter(
                    r => r.player_id !== playerId
                );
            }

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
// ============================================
// ЗНАЧКИ (BADGES) — знаки отличия у ника
// ============================================

const PLAYER_BADGES = {
    // Ивент Босс — топ 3 по урону
    event_boss_top1: { icon: '⚔', color: '#ffd700', title: 'Убийца боссов — 1 место' },
    event_boss_top2: { icon: '⚔', color: '#c0c0c0', title: 'Убийца боссов — 2 место' },
    event_boss_top3: { icon: '⚔', color: '#cd7f32', title: 'Убийца боссов — 3 место' },
    // Контрольный удар
    event_boss_finisher: { icon: '💀', color: '#ff4500', title: 'Нанёс контрольный удар' },
};

/**
 * Рендер значков в виде HTML-спанов
 */
function formatBadges(badges) {
    if (!badges || badges.length === 0) return '';
    const rendered = badges.map(id => {
        const badge = PLAYER_BADGES[id];
        if (!badge) return '';
        return `<span style="color:${badge.color};text-shadow:0 0 4px ${badge.color}88;font-size:inherit;" title="${badge.title}">${badge.icon}</span>`;
    }).filter(Boolean).join('');
    return rendered ? rendered + ' ' : '';
}

/**
 * Форматирует имя игрока с тегом гильдии и значками
 * @param {string} username - Имя игрока
 * @param {string|null} guildTag - Тег гильдии (опционально)
 * @param {string[]|null} badges - Массив ID значков (опционально)
 * @returns {string} - Отформатированное имя
 */
function formatPlayerName(username, guildTag = null, badges = null) {
    const name = username || 'Игрок';
    const badgeStr = formatBadges(badges);
    if (guildTag) {
        return `${badgeStr}[${guildTag}] ${name}`;
    }
    return `${badgeStr}${name}`;
}

/**
 * Получает отформатированное имя текущего игрока с тегом гильдии и значками
 * @returns {string} - Имя с тегом гильдии или просто имя
 */
function getCurrentPlayerDisplayName() {
    const username = window.userData?.username || 'Игрок';
    const guildTag = window.guildManager?.currentGuild?.tag || null;
    const badges = window.userData?.badges || [];
    return formatPlayerName(username, guildTag, badges);
}

// Экспортируем конфиг и функции
window.GUILD_CONFIG = GUILD_CONFIG;
window.getGuildBonuses = getGuildBonuses;
window.getGuildCapacity = getGuildCapacity;
window.getExpToNextLevel = getExpToNextLevel;
window.getResearchCycles = getResearchCycles;
window.PLAYER_BADGES = PLAYER_BADGES;
window.formatBadges = formatBadges;
window.formatPlayerName = formatPlayerName;
window.getCurrentPlayerDisplayName = getCurrentPlayerDisplayName;

