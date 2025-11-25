// database/event-save-manager.js - Event-driven saving system
console.log('✅ event-save-manager.js загружен');

/**
 * Event-driven Save Manager
 * Handles immediate saves on critical game events instead of just periodic saves
 */
class EventSaveManager {
    constructor() {
        this.saveInProgress = false;
        this.pendingSave = false;
        this.debounceTimers = {};
        this.lastSaveTime = 0;
        this.minSaveInterval = 500; // Минимум 500ms между сохранениями
    }

    /**
     * 🔴 CRITICAL: Save immediately (battle end, building complete, etc.)
     */
    async saveImmediate(reason) {
        console.log(`💾 [IMMEDIATE] Сохранение: ${reason}`);

        if (this.saveInProgress) {
            console.log('⏳ Сохранение уже в процессе, ждём...');
            this.pendingSave = true;
            return;
        }

        // Защита от слишком частых сохранений
        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;
        if (timeSinceLastSave < this.minSaveInterval) {
            const delay = this.minSaveInterval - timeSinceLastSave;
            console.log(`⏱️ Откладываем сохранение на ${delay}ms`);
            setTimeout(() => this.saveImmediate(reason), delay);
            return;
        }

        await this._performSave(reason);
    }

    /**
     * 🟡 DEBOUNCED: Save after delay (formation changes, minor updates)
     */
    saveDebounced(reason, delay = 2000) {
        console.log(`💾 [DEBOUNCED] Планируем сохранение через ${delay}ms: ${reason}`);

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
                timeCurrency: window.userData.time_currency,
                level: window.userData.level,
                experience: window.userData.experience,
                faction: window.userData.faction,
                lastLogin: window.userData.last_login, // Для офлайн накопления
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
                daily_login: window.userData.daily_login, // НОВОЕ: Сохранение данных ежедневных наград
                battle_energy: window.userData.battle_energy // НОВОЕ: Энергия боев
            };

            const success = await window.dbManager.savePlayer(playerData);

            if (success) {
                console.log(`✅ Сохранено (причина: ${reason})`);
                window.dbManager.hasUnsavedChanges = false;
            } else {
                console.error(`❌ Ошибка сохранения (причина: ${reason})`);
            }

            this.saveInProgress = false;

            // Если было запланировано ещё одно сохранение
            if (this.pendingSave) {
                this.pendingSave = false;
                setTimeout(() => this.saveImmediate('pending_save'), 100);
            }

            return success;

        } catch (error) {
            console.error('❌ Ошибка в _performSave:', error);
            this.saveInProgress = false;
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
    console.log('🏗️ Здание построено:', buildingId);
    window.eventSaveManager.saveImmediate(`building_completed:${buildingId}`);
};

window.onBuildingUpgraded = function(buildingId, newLevel) {
    console.log('⬆️ Здание улучшено:', buildingId, 'до уровня', newLevel);
    window.eventSaveManager.saveImmediate(`building_upgraded:${buildingId}:${newLevel}`);
};

window.onBattleCompleted = async function(result, rewards, opponentLevel, ratingChange) {
    console.log('⚔️ onBattleCompleted вызвана:', result, `(рейтинг: ${ratingChange > 0 ? '+' : ''}${ratingChange})`);
    console.log('   Стек вызова:', new Error().stack);

    // ЗАЩИТА ОТ ДУБЛИРОВАНИЯ: Проверяем, не был ли этот бой уже сохранен
    const battleId = `${Date.now()}_${result}_${window.selectedOpponent?.id || 'unknown'}`;

    if (window._lastSavedBattle === battleId) {
        console.warn('⚠️ ПРЕДОТВРАЩЕНО дублирование сохранения боя!');
        console.warn('   Этот бой уже был сохранен, пропускаем');
        return;
    }

    // Дополнительная защита: если прошло меньше 1 секунды с последнего сохранения - игнорируем
    const now = Date.now();
    if (window._lastBattleSaveTime && (now - window._lastBattleSaveTime) < 1000) {
        console.warn('⚠️ ПРЕДОТВРАЩЕНО дублирование: прошло меньше 1 сек с последнего сохранения');
        return;
    }

    // Запоминаем этот бой
    window._lastSavedBattle = battleId;
    window._lastBattleSaveTime = now;

    console.log('💾 Сохранение боя:', battleId);

    // Сначала сохраняем результат боя и обновляем статистику
    if (window.dbManager) {
        await window.dbManager.saveBattleResult(result, rewards, opponentLevel, ratingChange);
    }

    // Затем сохраняем текущее состояние игрока (опыт, маги и т.д.)
    await window.eventSaveManager.saveImmediate(`battle_${result}`);

    console.log('✅ Бой успешно сохранен');
};

window.onWizardsGainedExperience = function(wizardIds, expGained) {
    console.log('⭐ Маги получили опыт:', wizardIds, '+', expGained);
    window.eventSaveManager.saveImmediate('wizards_experience');
};

window.onSpellLearned = function(spellId, level) {
    console.log('📖 Заклинание изучено:', spellId, 'уровень', level);
    window.eventSaveManager.saveImmediate(`spell_learned:${spellId}:${level}`);
};

window.onSpellUpgraded = function(spellId, newLevel) {
    console.log('📈 Заклинание улучшено:', spellId, 'до уровня', newLevel);
    window.eventSaveManager.saveImmediate(`spell_upgraded:${spellId}:${newLevel}`);
};

window.onWizardHired = function(wizardId) {
    console.log('🧙 Маг нанят:', wizardId);
    window.eventSaveManager.saveImmediate(`wizard_hired:${wizardId}`);
};

// 🟡 ОТЛОЖЕННЫЕ СОБЫТИЯ (debounced)

window.onFormationChanged = function(formation) {
    console.log('⚔️ Расстановка изменена');
    window.eventSaveManager.saveDebounced('formation_changed', 2000);
};

window.onTimeCurrencyChanged = function(amount) {
    console.log('⏰ Валюта времени изменена:', amount);
    // Не сохраняем отдельно, сохранится при следующем важном событии
    window.dbManager.markChanged();
};

console.log('💡 Event-driven saving готов!');
console.log('💡 Доступные триггеры:');
console.log('  - onBuildingCompleted(buildingId)');
console.log('  - onBuildingUpgraded(buildingId, level)');
console.log('  - onBattleCompleted(result, rewards, opponentLevel)');
console.log('  - onWizardsGainedExperience(wizardIds, exp)');
console.log('  - onSpellLearned(spellId, level)');
console.log('  - onSpellUpgraded(spellId, level)');
console.log('  - onWizardHired(wizardId)');
console.log('  - onFormationChanged(formation)');