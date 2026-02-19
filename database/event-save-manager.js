// database/event-save-manager.js - Event-driven saving system

/**
 * Event-driven Save Manager
 * Handles immediate saves on critical game events instead of just periodic saves
 */
class EventSaveManager {
    constructor() {
        this.saveInProgress = false;
        this.pendingSave = false;
        this.pendingSavePromises = []; // Массив промисов ожидающих сохранения
        this.debounceTimers = {};
        this.lastSaveTime = 0;
        this.minSaveInterval = 500; // Минимум 500ms между сохранениями
    }

    /**
     * 🔴 CRITICAL: Save immediately (battle end, building complete, etc.)
     * ВАЖНО: Теперь функция ГАРАНТИРОВАННО дожидается завершения сохранения
     */
    async saveImmediate(reason) {
        // Если сохранение уже идёт - ждём его завершения
        if (this.saveInProgress) {
            this.pendingSave = true;
            // Создаём промис который разрешится когда текущее сохранение завершится
            return new Promise((resolve) => {
                this.pendingSavePromises.push(resolve);
            });
        }

        // Защита от слишком частых сохранений
        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;
        if (timeSinceLastSave < this.minSaveInterval) {
            const delay = this.minSaveInterval - timeSinceLastSave;
            // ВАЖНО: Возвращаем промис который разрешится после отложенного сохранения
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const result = await this._performSave(reason);
                    resolve(result);
                }, delay);
            });
        }

        return await this._performSave(reason);
    }

    /**
     * 🟡 DEBOUNCED: Save after delay (formation changes, minor updates)
     */
    saveDebounced(reason, delay = 2000) {

        // Отменяем предыдущий таймер для этого типа события
        if (this.debounceTimers[reason]) {
            clearTimeout(this.debounceTimers[reason]);
        }

        this.debounceTimers[reason] = setTimeout(async () => {
            await this.saveImmediate(reason);
            delete this.debounceTimers[reason];
        }, delay);
    }

    /**
     * Выполнить сохранение
     */
    async _performSave(reason) {
        if (!window.userData || !window.dbManager) {
            console.error('❌ userData или dbManager не найдены');
            return false;
        }

        this.saveInProgress = true;
        this.lastSaveTime = Date.now();

        try {
            const playerData = {
                time_currency_base: window.userData.time_currency_base ?? Math.floor(window.userData.time_currency || 0),
                time_currency_updated_at: window.userData.time_currency_updated_at || new Date().toISOString(),
                timeCurrency: window.userData.time_currency_base ?? Math.floor(window.userData.time_currency || 0),
                level: window.userData.level,
                experience: window.userData.experience,
                faction: window.userData.faction,
                faction_changed: window.userData.faction_changed, // Флаг использованной бесплатной смены фракции
            };

            // DEBUG: Логируем faction_changed при сохранении
            console.log(`🔍 [SAVE DEBUG] faction_changed = ${window.userData.faction_changed} (причина: ${reason})`);

            Object.assign(playerData, {
                last_login: window.userData.last_login, // Для офлайн накопления (snake_case!)
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
                daily_login: window.userData.daily_login, // Данные ежедневных наград
                battle_energy: window.userData.battle_energy, // Энергия боев
                purchased_packs: window.userData.purchased_packs, // Купленные стартовые пакеты
                airdrop_points: window.userData.airdrop_points || 0, // RPC защищён от уменьшения
                airdrop_breakdown: window.userData.airdrop_breakdown || {}, // Разбивка по категориям
                wallet_address: window.userData.wallet_address || null, // TON кошелек
                wallet_connected_at: window.userData.wallet_connected_at || null, // Время подключения кошелька
                current_season: window.userData.current_season || 1, // Текущий сезон
                season_league_rewards_claimed: window.userData.season_league_rewards_claimed || [], // Полученные награды за лиги
                unlocked_skins: window.userData.unlocked_skins || [], // Разблокированные скины
                wizard_skins: window.userData.wizard_skins || {}, // Выбранные скины для магов
                training_dummy_progress: window.userData.training_dummy_progress || null, // Прогресс тренировочного полигона
                completed_tasks: window.userData.completed_tasks || {}, // Выполненные одноразовые задания
                // GUILD FIELDS
                guild_id: window.userData.guild_id ?? null, // ID гильдии
                guild_contribution: window.userData.guild_contribution || 0, // Вклад в гильдию
                guild_last_active: window.userData.guild_last_active || null // Последняя активность
            });

            const success = await window.dbManager.savePlayer(playerData);

            if (success) {
                window.dbManager.hasUnsavedChanges = false;
            } else {
                console.error(`❌ Ошибка сохранения (причина: ${reason})`);
            }

            this.saveInProgress = false;

            // Резолвим все ожидающие промисы
            const pendingPromises = this.pendingSavePromises;
            this.pendingSavePromises = [];
            pendingPromises.forEach(resolve => resolve(success));

            // Если было запланировано ещё одно сохранение
            if (this.pendingSave) {
                this.pendingSave = false;
                setTimeout(() => this.saveImmediate('pending_save'), 100);
            }

            return success;

        } catch (error) {
            console.error('❌ Ошибка в _performSave:', error);
            this.saveInProgress = false;

            // Резолвим ожидающие промисы с false при ошибке
            const pendingPromises = this.pendingSavePromises;
            this.pendingSavePromises = [];
            pendingPromises.forEach(resolve => resolve(false));

            return false;
        }
    }

    /**
     * Отменить все отложенные сохранения
     */
    cancelAllDebounced() {
        Object.keys(this.debounceTimers).forEach(key => {
            clearTimeout(this.debounceTimers[key]);
        });
        this.debounceTimers = {};
    }
}

// Создаём глобальный экземпляр
window.eventSaveManager = new EventSaveManager();

/**
 * ============================================
 * API для триггеров событий
 * ============================================
 */

// 🔴 КРИТИЧЕСКИЕ СОБЫТИЯ (сохранение немедленно)

window.onBuildingCompleted = function(buildingId) {
    window.eventSaveManager.saveImmediate(`building_completed:${buildingId}`);
};

window.onBuildingUpgraded = function(buildingId, newLevel) {
    window.eventSaveManager.saveImmediate(`building_upgraded:${buildingId}:${newLevel}`);
};

window.onBattleCompleted = async function(result, rewards, opponentLevel, ratingChange) {

    // ЗАЩИТА ОТ ДУБЛИРОВАНИЯ: простой флаг на текущий бой
    // (сбрасывается при начале нового боя)
    if (window._battleSaveCompleted) {
        console.warn('⚠️ ПРЕДОТВРАЩЕНО дублирование сохранения боя!');
        return;
    }
    window._battleSaveCompleted = true;


    // Запоминаем старый рейтинг для проверки новых наград
    const oldRating = (window.userData?.rating || 0) - ratingChange;

    // Сначала сохраняем результат боя и обновляем статистику
    let battleSaved = false;
    if (window.dbManager) {
        battleSaved = await window.dbManager.saveBattleResult(result, rewards, opponentLevel, ratingChange);
        if (!battleSaved) {
            console.error('❌ saveBattleResult вернул false — повторная попытка через saveImmediate');
        }
    }

    // Затем сохраняем текущее состояние игрока (опыт, маги и т.д.)
    const fullSaved = await window.eventSaveManager.saveImmediate(`battle_${result}`);
    if (!fullSaved) {
        console.error('❌ saveImmediate после боя не удался — данные могут быть потеряны');
        // Повторная попытка через 2 секунды
        setTimeout(() => {
            window.eventSaveManager.saveImmediate(`battle_${result}_retry`);
        }, 2000);
    }

    // Проверяем доступные награды за новые лиги
    if (typeof window.checkForNewAvailableRewards === 'function') {
        const newRating = window.userData?.rating || 0;
        window.checkForNewAvailableRewards(oldRating, newRating);
    }
};

window.onWizardsGainedExperience = function(wizardIds, expGained) {
    window.eventSaveManager.saveImmediate('wizards_experience');
};

window.onSpellLearned = function(spellId, level) {
    window.eventSaveManager.saveImmediate(`spell_learned:${spellId}:${level}`);
};

window.onSpellUpgraded = function(spellId, newLevel) {
    window.eventSaveManager.saveImmediate(`spell_upgraded:${spellId}:${newLevel}`);
};

window.onWizardHired = function(wizardId) {
    window.eventSaveManager.saveImmediate(`wizard_hired:${wizardId}`);
};

// 🟡 ОТЛОЖЕННЫЕ СОБЫТИЯ (debounced)

window.onFormationChanged = function(formation) {
    window.eventSaveManager.saveDebounced('formation_changed', 2000);
};

window.onTimeCurrencyChanged = function(amount) {
    // Не сохраняем отдельно, сохранится при следующем важном событии
    window.dbManager.markChanged();
};

console.log('  - onBattleCompleted(result, rewards, opponentLevel)');
console.log('  - onWizardsGainedExperience(wizardIds, exp)');
console.log('  - onSpellLearned(spellId, level)');
console.log('  - onSpellUpgraded(spellId, level)');
console.log('  - onWizardHired(wizardId)');
console.log('  - onFormationChanged(formation)');