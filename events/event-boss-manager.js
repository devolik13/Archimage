// events/event-boss-manager.js - Менеджер ивент босса (взаимодействие с Supabase)

class EventBossManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentBoss = null;
        this.playerStats = null;
        this.leaderboard = [];
        this.lastFetch = 0;
        this.fetchCooldown = 10000; // Минимум 10 секунд между запросами
        this.lastAttackTime = 0; // Время последней атаки (из localStorage)
    }

    /**
     * Загрузить текущего активного ивент босса
     */
    async fetchActiveBoss(forceRefresh = false) {
        if (!this.supabase) {
            console.error('Supabase не инициализирован');
            return null;
        }

        // Кеширование - не запрашиваем слишком часто
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
     */
    async submitDamage(damage) {
        if (!this.supabase || !this.currentBoss) {
            console.error('Supabase или босс не инициализированы');
            return null;
        }

        if (damage <= 0) {
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
                p_damage: damage
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

                // Сохраняем время последней атаки
                this.lastAttackTime = Date.now();
                this.saveLastAttackTime();

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

            this.playerStats = data;
            return data;
        } catch (err) {
            console.error('Ошибка запроса статистики:', err);
            return null;
        }
    }

    /**
     * Проверить, может ли игрок атаковать (кулдаун)
     */
    canAttack() {
        this.loadLastAttackTime();
        const cooldownMs = (window.EVENT_BOSS_CONFIG?.attackCooldownMinutes || 60) * 60 * 1000;
        const timeSinceLastAttack = Date.now() - this.lastAttackTime;
        return timeSinceLastAttack >= cooldownMs;
    }

    /**
     * Время до следующей атаки (мс)
     */
    getTimeToNextAttack() {
        this.loadLastAttackTime();
        const cooldownMs = (window.EVENT_BOSS_CONFIG?.attackCooldownMinutes || 60) * 60 * 1000;
        const timeSinceLastAttack = Date.now() - this.lastAttackTime;
        return Math.max(0, cooldownMs - timeSinceLastAttack);
    }

    /**
     * Сохранить время последней атаки в localStorage
     */
    saveLastAttackTime() {
        try {
            localStorage.setItem('event_boss_last_attack', this.lastAttackTime.toString());
        } catch (e) {
            // localStorage может быть недоступен
        }
    }

    /**
     * Загрузить время последней атаки из localStorage
     */
    loadLastAttackTime() {
        try {
            const saved = localStorage.getItem('event_boss_last_attack');
            if (saved) {
                this.lastAttackTime = parseInt(saved) || 0;
            }
        } catch (e) {
            // localStorage может быть недоступен
        }
    }

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
     * Форматирование урона для отображения
     */
    formatDamage(damage) {
        if (damage >= 1000000) {
            return (damage / 1000000).toFixed(1) + 'M';
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
