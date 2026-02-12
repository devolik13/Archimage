// events/event-boss-manager.js - Менеджер ивент босса (взаимодействие с Supabase)

class EventBossManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentBoss = null;
        this.playerStats = null;
        this.leaderboard = [];
        this.lastFetch = 0;
        this.fetchCooldown = 10000; // Минимум 10 секунд между запросами

        // === DEBUG: локальный режим без Supabase (убрать перед деплоем) ===
        this.DEBUG_LOCAL_MODE = true;
        this._checkConfigVersion(); // Сброс при смене версии конфига
        this._loadDebugState();
        // === END DEBUG ===

        // Система попыток (10/день)
        this.attempts = this.loadAttempts();
    }

    // ==========================================
    // DEBUG: локальные моки (сохраняются в localStorage)
    // ==========================================

    /**
     * Проверка версии конфига — при смене сбрасываем всё (HP, попытки, лидерборд)
     */
    _checkConfigVersion() {
        const currentVersion = window.EVENT_BOSS_CONFIG?.configVersion || 1;
        try {
            const savedVersion = parseInt(localStorage.getItem('event_boss_config_version')) || 0;
            if (savedVersion !== currentVersion) {
                console.log(`🐉 Версия конфига изменилась (${savedVersion} → ${currentVersion}), сброс всех данных`);
                localStorage.removeItem('event_boss_debug');
                localStorage.removeItem('event_boss_debug_boss');
                localStorage.removeItem('event_boss_attempts');
                localStorage.setItem('event_boss_config_version', String(currentVersion));
            }
        } catch (e) { /* ignore */ }
    }

    _loadDebugState() {
        try {
            const saved = localStorage.getItem('event_boss_debug');
            if (saved) {
                const data = JSON.parse(saved);
                this._debugPlayerStats = data.playerStats || { participated: false, total_damage: 0, attacks_count: 0, best_single_attack: 0, rank: 0 };
                this._debugLeaderboard = data.leaderboard || [];
                // НЕ фильтруем по telegram_id — userId ещё не доступен при загрузке модуля.
                // Оставляем только записи с реальным уроном.
                this._debugLeaderboard = this._debugLeaderboard.filter(e => e.total_damage > 0);
                // Пересчитываем ранги
                this._debugLeaderboard.sort((a, b) => b.total_damage - a.total_damage);
                this._debugLeaderboard.forEach((e, i) => e.rank = i + 1);
                return;
            }
        } catch (e) { /* fallback ниже */ }

        // Начальные данные — пустой лидерборд (без вымышленных игроков)
        this._debugPlayerStats = {
            participated: false,
            total_damage: 0,
            attacks_count: 0,
            best_single_attack: 0,
            rank: 0
        };
        this._debugLeaderboard = [];
    }

    _saveDebugState() {
        try {
            localStorage.setItem('event_boss_debug', JSON.stringify({
                playerStats: this._debugPlayerStats,
                leaderboard: this._debugLeaderboard
            }));
        } catch (e) { /* localStorage может быть недоступен */ }
    }

    _initDebugBoss() {
        // Восстанавливаем HP босса из localStorage
        let savedBossHp = null;
        try {
            const saved = localStorage.getItem('event_boss_debug_boss');
            if (saved) savedBossHp = JSON.parse(saved);
        } catch (e) { /* ignore */ }

        const maxHp = window.EVENT_BOSS_CONFIG?.totalHp || 5000000;
        const endsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        this.currentBoss = {
            active: true,
            id: 1,
            name: window.EVENT_BOSS_CONFIG?.name || 'Отродье Тьмы',
            max_hp: maxHp,
            current_hp: savedBossHp?.current_hp ?? maxHp,
            config: {
                faction: window.EVENT_BOSS_CONFIG?.faction || 'dark',
                spells: window.EVENT_BOSS_CONFIG?.spells || [],
                spell_levels: window.EVENT_BOSS_CONFIG?.spell_levels || {},
                resistances: window.EVENT_BOSS_CONFIG?.resistances || {},
                battleHp: window.EVENT_BOSS_CONFIG?.battleHp || 999999,
                battleArmor: window.EVENT_BOSS_CONFIG?.battleArmor || 200,
                damageMultiplier: window.EVENT_BOSS_CONFIG?.damageMultiplier || 2.0,
                poisonImmune: window.EVENT_BOSS_CONFIG?.poisonImmune || false
            },
            rewards: window.EVENT_BOSS_CONFIG?.rewards || {},
            starts_at: new Date().toISOString(),
            ends_at: endsAt,
            status: savedBossHp?.current_hp === 0 ? 'defeated' : 'active',
            defeated_at: null,
            total_participants: savedBossHp?.total_participants ?? 0,
            total_damage_dealt: savedBossHp?.total_damage_dealt ?? 0,
            finishing_blow_by: savedBossHp?.finishing_blow_by || null
        };
        this.lastFetch = Date.now();
        return this.currentBoss;
    }

    // ==========================================
    // ДАННЫЕ БОССА
    // ==========================================

    /**
     * Загрузить текущего активного ивент босса
     */
    async fetchActiveBoss(forceRefresh = false) {
        // === DEBUG ===
        if (this.DEBUG_LOCAL_MODE) {
            if (!this.currentBoss) {
                this._initDebugBoss();
            } else if (forceRefresh) {
                // При forceRefresh перечитываем HP и участников из localStorage
                try {
                    const saved = localStorage.getItem('event_boss_debug_boss');
                    if (saved) {
                        const data = JSON.parse(saved);
                        if (data.current_hp != null) this.currentBoss.current_hp = data.current_hp;
                        if (data.total_damage_dealt != null) this.currentBoss.total_damage_dealt = data.total_damage_dealt;
                        if (data.total_participants != null) this.currentBoss.total_participants = data.total_participants;
                        if (data.finishing_blow_by) this.currentBoss.finishing_blow_by = data.finishing_blow_by;
                    }
                } catch (e) { /* ignore */ }
            }
            console.log(`🐉 [DEBUG] Ивент босс: ${this.currentBoss.name} | HP: ${this.currentBoss.current_hp}/${this.currentBoss.max_hp}`);
            return this.currentBoss;
        }
        // === END DEBUG ===

        if (!this.supabase) {
            console.error('Supabase не инициализирован');
            return null;
        }

        const now = Date.now();
        if (!forceRefresh && this.currentBoss && (now - this.lastFetch) < this.fetchCooldown) {
            return this.currentBoss;
        }

        try {
            const { data, error } = await this.supabase.rpc('get_active_event_boss');

            if (error) {
                console.error('Ошибка получения ивент босса:', error);
                return null;
            }

            if (data && data.active) {
                this.currentBoss = data;
                this.lastFetch = now;
                console.log(`🐉 Ивент босс загружен: ${data.name} | HP: ${data.current_hp}/${data.max_hp}`);
            } else if (data && data.has_modifier) {
                // Босс уже завершён, но есть пост-ивент модификатор
                this.currentBoss = data;
                this.lastFetch = now;
                console.log(`🐉 Пост-ивент модификатор: босс ${data.name} (${data.status})`);
            } else {
                this.currentBoss = null;
                console.log('🐉 Нет активного ивент босса');
            }

            return this.currentBoss;
        } catch (err) {
            console.error('Ошибка запроса ивент босса:', err);
            return null;
        }
    }

    /**
     * Отправить нанесённый урон после боя
     * @param {number} hpDamage — чистый урон по HP босса
     * @param {number} ratingDamage — урон для рейтинга (HP + бонус брони)
     */
    async submitDamage(hpDamage, ratingDamage) {
        // ratingDamage по умолчанию = hpDamage (обратная совместимость)
        if (ratingDamage == null) ratingDamage = hpDamage;

        // === DEBUG ===
        if (this.DEBUG_LOCAL_MODE) {
            if (!this.currentBoss || hpDamage <= 0) return null;

            // HP босса уменьшается только на чистый HP урон
            const newHp = Math.max(0, this.currentBoss.current_hp - hpDamage);
            const isDefeated = newHp === 0;

            this.currentBoss.current_hp = newHp;
            this.currentBoss.total_damage_dealt += hpDamage;
            if (isDefeated) {
                this.currentBoss.status = 'defeated';
                this.currentBoss.defeated_at = new Date().toISOString();
                this.currentBoss.finishing_blow_by = window.userData?.username || 'Неизвестный маг';
            }

            // Обновляем мок статистику игрока (лидерборд использует ratingDamage)
            this._debugPlayerStats.participated = true;
            this._debugPlayerStats.total_damage += ratingDamage;
            this._debugPlayerStats.attacks_count++;
            this._debugPlayerStats.best_single_attack = Math.max(this._debugPlayerStats.best_single_attack, ratingDamage);

            // Обновляем лидерборд — находим свою запись по telegram_id
            const myId = parseInt(window.userId) || 1;
            const myUsername = window.userData?.username || 'Маг';
            let myEntry = this._debugLeaderboard.find(e => e.telegram_id === myId);
            if (!myEntry) {
                myEntry = { rank: 0, username: myUsername, telegram_id: myId, total_damage: 0, attacks_count: 0, best_single_attack: 0 };
                this._debugLeaderboard.push(myEntry);
            }
            myEntry.username = myUsername;
            myEntry.total_damage = this._debugPlayerStats.total_damage;
            myEntry.attacks_count = this._debugPlayerStats.attacks_count;
            myEntry.best_single_attack = this._debugPlayerStats.best_single_attack;
            // Пересортировка
            this._debugLeaderboard.sort((a, b) => b.total_damage - a.total_damage);
            this._debugLeaderboard.forEach((e, i) => e.rank = i + 1);
            this._debugPlayerStats.rank = this._debugLeaderboard.findIndex(e => e.telegram_id === myId) + 1;

            // Обновляем кол-во участников
            this.currentBoss.total_participants = this._debugLeaderboard.filter(e => e.total_damage > 0).length;

            this.useAttempt();
            this._saveDebugState();
            try {
                localStorage.setItem('event_boss_debug_boss', JSON.stringify({
                    current_hp: this.currentBoss.current_hp,
                    total_damage_dealt: this.currentBoss.total_damage_dealt,
                    total_participants: this.currentBoss.total_participants,
                    finishing_blow_by: this.currentBoss.finishing_blow_by || null
                }));
            } catch (e) { /* ignore */ }

            console.log(`🐉 [DEBUG] HP урон: ${hpDamage}, рейтинг: ${ratingDamage} | Босс HP: ${newHp}/${this.currentBoss.max_hp} | Defeated: ${isDefeated}`);
            return {
                success: true,
                damage_dealt: ratingDamage,
                boss_new_hp: newHp,
                boss_max_hp: this.currentBoss.max_hp,
                boss_defeated: isDefeated,
                finishing_blow: isDefeated,
                player_total_damage: this._debugPlayerStats.total_damage,
                player_attacks: this._debugPlayerStats.attacks_count
            };
        }
        // === END DEBUG ===

        if (!this.supabase || !this.currentBoss) {
            console.error('Supabase или босс не инициализированы');
            return null;
        }

        if (hpDamage <= 0) {
            console.warn('Урон <= 0, пропускаем отправку');
            return null;
        }

        const telegramId = window.userId ? parseInt(window.userId) : null;
        if (!telegramId) {
            console.error('Telegram ID не найден');
            return null;
        }

        try {
            const { data, error } = await this.supabase.rpc('event_boss_deal_damage', {
                p_boss_id: this.currentBoss.id,
                p_telegram_id: telegramId,
                p_damage: hpDamage,
                p_rating_damage: ratingDamage
            });

            if (error) {
                console.error('Ошибка отправки урона:', error);
                return null;
            }

            if (data && data.success) {
                console.log(`🐉 Урон записан: ${damage} | Босс HP: ${data.boss_new_hp}/${data.boss_max_hp}`);
                console.log(`   Ваш общий урон: ${data.player_total_damage} | Атак: ${data.player_attacks}`);

                // Обновляем локальный кеш
                if (this.currentBoss) {
                    this.currentBoss.current_hp = data.boss_new_hp;
                }

                // Тратим попытку
                this.useAttempt();

                return data;
            } else {
                console.warn('Ошибка от сервера:', data?.error);
                return data;
            }
        } catch (err) {
            console.error('Ошибка отправки урона:', err);
            return null;
        }
    }

    /**
     * Загрузить лидерборд ивент босса
     */
    async fetchLeaderboard(limit = 50) {
        // === DEBUG ===
        if (this.DEBUG_LOCAL_MODE) {
            return this._debugLeaderboard.slice(0, limit);
        }
        // === END DEBUG ===

        if (!this.supabase || !this.currentBoss) return [];

        try {
            const { data, error } = await this.supabase.rpc('get_event_boss_leaderboard', {
                p_boss_id: this.currentBoss.id,
                p_limit: limit
            });

            if (error) {
                console.error('Ошибка загрузки лидерборда:', error);
                return [];
            }

            this.leaderboard = data || [];
            return this.leaderboard;
        } catch (err) {
            console.error('Ошибка запроса лидерборда:', err);
            return [];
        }
    }

    /**
     * Загрузить статистику текущего игрока
     */
    async fetchPlayerStats() {
        // === DEBUG ===
        if (this.DEBUG_LOCAL_MODE) {
            // Обновляем ранг из лидерборда (userId мог быть недоступен при загрузке)
            const myId = parseInt(window.userId) || 1;
            const myEntry = this._debugLeaderboard.find(e => e.telegram_id === myId);
            if (myEntry) {
                this._debugPlayerStats.rank = myEntry.rank;
            }
            return this._debugPlayerStats;
        }
        // === END DEBUG ===

        if (!this.supabase || !this.currentBoss) return null;

        const telegramId = window.userId ? parseInt(window.userId) : null;
        if (!telegramId) return null;

        try {
            const { data, error } = await this.supabase.rpc('get_player_event_boss_stats', {
                p_boss_id: this.currentBoss.id,
                p_telegram_id: telegramId
            });

            if (error) {
                console.error('Ошибка загрузки статистики:', error);
                return null;
            }

            // Supabase RPC может вернуть массив — берём первый элемент
            const stats = Array.isArray(data) ? data[0] : data;
            this.playerStats = stats || null;
            return this.playerStats;
        } catch (err) {
            console.error('Ошибка запроса статистики:', err);
            return null;
        }
    }

    // ==========================================
    // СИСТЕМА ПОПЫТОК (10/день)
    // ==========================================

    /**
     * Загрузить данные попыток из localStorage
     */
    loadAttempts() {
        try {
            const saved = localStorage.getItem('event_boss_attempts');
            if (saved) {
                const data = JSON.parse(saved);
                // Проверяем, не новый ли день
                const today = new Date().toDateString();
                if (data.date === today) {
                    return data;
                }
            }
        } catch (e) {
            // localStorage может быть недоступен
        }

        // Новый день или нет данных — сброс попыток
        const maxAttempts = window.EVENT_BOSS_CONFIG?.maxDailyAttempts || 10;
        const freshAttempts = {
            date: new Date().toDateString(),
            remaining: maxAttempts,
            used: 0,
            purchased: 0
        };
        this.saveAttempts(freshAttempts);
        return freshAttempts;
    }

    /**
     * Сохранить данные попыток
     */
    saveAttempts(data) {
        try {
            localStorage.setItem('event_boss_attempts', JSON.stringify(data || this.attempts));
        } catch (e) {
            // localStorage может быть недоступен
        }
    }

    /**
     * Проверить, есть ли попытки
     */
    canAttack() {
        this.refreshAttempts();
        return this.attempts.remaining > 0;
    }

    /**
     * Получить оставшиеся попытки
     */
    getRemainingAttempts() {
        this.refreshAttempts();
        return this.attempts.remaining;
    }

    /**
     * Использовать попытку
     */
    useAttempt() {
        this.refreshAttempts();
        if (this.attempts.remaining > 0) {
            this.attempts.remaining--;
            this.attempts.used++;
            this.saveAttempts();
            console.log(`🐉 Попытка использована: осталось ${this.attempts.remaining}`);
        }
    }

    /**
     * Купить дополнительную попытку за Stars
     */
    async purchaseAttempt() {
        const cost = window.EVENT_BOSS_CONFIG?.extraAttemptStarsCost || 25;

        // Telegram Stars покупка
        if (window.Telegram?.WebApp?.openInvoice) {
            // TODO: Интеграция с Telegram Stars API
            // Пока простая проверка
            console.log(`🐉 Покупка попытки за ${cost} Stars`);
        }

        // Добавляем попытку
        this.attempts.remaining++;
        this.attempts.purchased++;
        this.saveAttempts();

        return true;
    }

    /**
     * Обновить попытки (проверка нового дня)
     */
    refreshAttempts() {
        const today = new Date().toDateString();
        if (this.attempts.date !== today) {
            const maxAttempts = window.EVENT_BOSS_CONFIG?.maxDailyAttempts || 10;
            this.attempts = {
                date: today,
                remaining: maxAttempts,
                used: 0,
                purchased: 0
            };
            this.saveAttempts();
            console.log(`🐉 Новый день — попытки сброшены: ${maxAttempts}`);
        }
    }

    // ==========================================
    // УТИЛИТЫ
    // ==========================================

    /**
     * Форматирование оставшегося времени
     */
    formatTimeRemaining(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return 'Завершено';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            const daysText = days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней');
            return `${days} ${daysText} ${hours}ч`;
        }
        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        }
        return `${minutes}м`;
    }

    /**
     * Форматирование урона
     */
    formatDamage(damage) {
        if (damage >= 1000000) {
            // Показываем в тысячах для точности: "5,000K", "4,995K"
            const k = Math.floor(damage / 1000);
            return k.toLocaleString('en-US') + 'K';
        }
        if (damage >= 1000) {
            return (damage / 1000).toFixed(1) + 'K';
        }
        return damage.toString();
    }

    /**
     * Процент HP босса
     */
    getHpPercent() {
        if (!this.currentBoss) return 0;
        return Math.max(0, Math.min(100,
            (this.currentBoss.current_hp / this.currentBoss.max_hp) * 100
        ));
    }
}

// Создаём глобальный экземпляр
window.eventBossManager = new EventBossManager();

console.log('🐉 Event Boss Manager загружен');
