// Интеграция Supabase с игрой

// Инициализация при загрузке игры
async function initGameWithDatabase() {
    
    // КРИТИЧНО: Сразу скрываем ОБЕ зоны чтобы не мелькали
    const factionSelection = document.getElementById('faction-selection');
    const gameArea = document.getElementById('game-area');
    if (factionSelection) factionSelection.style.display = 'none';
    if (gameArea) gameArea.style.display = 'none';

    // Загружаем данные игрока из Supabase
    const player = await window.dbManager.loadOrCreatePlayer();
    
    if (!player) {
        console.error('❌ Не удалось загрузить игрока');
        return;
    }


    // Применяем данные к window.userData
    if (!window.userData) {
        window.userData = {};
    }

    // Базовые данные
    window.userData.user_id = player.telegram_id;
    window.userData.username = player.username;
    window.userData.faction = player.faction;

    // Защита от читов: валидация значений при загрузке
    window.userData.time_currency = Math.max(0, Math.min(999999, player.time_currency || 0));
    window.userData.level = Math.max(1, Math.min(100, player.level || 1));
    window.userData.experience = Math.max(0, player.experience || 0);
    window.userData.last_login = player.last_login;

    // Игровые данные (JSONB)
    window.userData.wizards = player.wizards || [];
    window.userData.formation = player.formation || [null, null, null, null, null];
    window.userData.spells = player.spells || {};
    window.userData.buildings = player.buildings || {};

    // Статистика боев (с валидацией)
    window.userData.total_battles = Math.max(0, player.total_battles || 0);
    window.userData.wins = Math.max(0, player.wins || 0);
    window.userData.losses = Math.max(0, player.losses || 0);
    window.userData.rating = Math.max(0, Math.min(9999, player.rating || 1000));

    // Прогресс и настройки
    window.userData.pve_progress = player.pve_progress || {};
    window.userData.settings = player.settings || { sound: true, language: 'ru', battle_speed: 'normal' };
    window.userData.welcome_shown = player.welcome_shown || false;

    // Ежедневные награды
    window.userData.daily_login = player.daily_login || {
        day: 1,
        last_login_date: null,
        last_reward_date: null,
        total_logins: 0
    };
    
    // КРИТИЧНО: Извлекаем constructions из buildings._active_constructions
    if (player.buildings && player.buildings._active_constructions) {
        window.userData.constructions = player.buildings._active_constructions;
    } else {
        window.userData.constructions = [];
    }

    // Инициализация энергии боев (если нет в БД)
    if (player.battle_energy) {
        window.userData.battle_energy = player.battle_energy;
    } else if (typeof window.initBattleEnergy === 'function') {
        window.initBattleEnergy(window.userData);
    }

    // Данные гильдии
    window.userData.guild_id = player.guild_id || null;
    window.userData.guild_contribution = player.guild_contribution || 0;
    window.userData.guild_last_active = player.guild_last_active || null;

    // Данные благословения
    window.userData.active_blessing = player.active_blessing || null;
    window.userData.blessing_last_used = player.blessing_last_used || null;

    // КРИТИЧНО: Проверяем есть ли фракция
    if (!player.faction || player.faction === null) {
        // Новый игрок - показываем выбор фракции
        if (typeof window.showFactionSelection === 'function') {
            window.showFactionSelection();
        } else {
            // Fallback если функция не загружена
            const factionSelection = document.getElementById('faction-selection');
            const gameArea = document.getElementById('game-area');
            if (factionSelection) factionSelection.style.display = 'block';
            if (gameArea) gameArea.style.display = 'none';
        }
    } else {
        // Существующий игрок - показываем игру
        
        // Показываем игровую зону
        const factionSelection = document.getElementById('faction-selection');
        const gameArea = document.getElementById('game-area');
        if (factionSelection) factionSelection.style.display = 'none';
        if (gameArea) gameArea.style.display = 'block';
        
        // Обновляем фракцию в UI
        const factionElement = document.getElementById('faction');
        if (factionElement && typeof window.getFactionName === 'function') {
            factionElement.textContent = window.getFactionName(player.faction);
        }
        
        // Инициализируем все игровые системы
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
        
        if (typeof window.createPlayerAvatarUI === 'function') {
            window.createPlayerAvatarUI();
        }
        
        if (typeof window.initTimeCurrency === 'function') {
            window.initTimeCurrency();
        }

        // Загружаем гильдию если игрок в ней состоит
        if (window.userData.guild_id && window.guildManager) {
            window.guildManager.loadPlayerGuild().then(() => {
            }).catch(err => {
                console.warn('⚠️ Не удалось загрузить гильдию:', err);
            });
        }

        // Инициализация аватара игрока
        if (typeof window.initPlayerAvatar === 'function') {
            await window.initPlayerAvatar(window.userData);
        }

        // Проверка ежедневной награды
        if (typeof window.checkDailyLoginReward === 'function') {
            window.checkDailyLoginReward();
        }

        // Инициализация UI энергии боев
        if (typeof window.initBattleEnergyUI === 'function') {
            window.initBattleEnergyUI();
        }

        // Проверяем оффлайн события ПЕРЕД обновлением last_login
        if (typeof window.checkOfflineEvents === 'function') {
            await window.checkOfflineEvents(player.last_login);
        }

        // Обновляем last_login после расчета офлайн накопления
        window.userData.last_login = new Date().toISOString();

        // ВАЖНО: Сразу сохраняем last_login в БД чтобы избежать повторного начисления при обновлении
        if (window.dbManager && window.dbManager.supabase) {
            await window.dbManager.supabase.rpc('update_player_safe', {
                p_telegram_id: window.dbManager.getTelegramId(),
                p_data: { last_login: window.userData.last_login }
            });
            console.log('✅ last_login сохранён в БД:', window.userData.last_login);
        }

        if (typeof window.initConstructionSystem === 'function') {
            window.initConstructionSystem();
        }
        
        if (typeof window.initCityView === 'function') {
            window.initCityView();
        }
        
        if (typeof window.renderCityGrid === 'function') {
            window.renderCityGrid();
        }

        // Инициализация системы благословений
        if (typeof window.initBlessingSystem === 'function') {
            window.initBlessingSystem();
        }
    }

    // Обновляем UI если есть функции
    if (typeof window.updateTimeCurrencyDisplay === 'function') {
        window.updateTimeCurrencyDisplay();
    }
    if (typeof window.updatePlayerLevel === 'function') {
        window.updatePlayerLevel();
    }

    // Запускаем автосохранение каждые 30 секунд
    window.dbManager.startAutoSave();
    window.dbManager.setupBeforeUnload();

}

// Хуки для сохранения при событиях
function setupGameHooks() {
    
    // Сохранение после боя
    if (window.battleSystem) {
        const originalEndBattle = window.battleSystem.endBattle;
        window.battleSystem.endBattle = async function(result, rewards) {
            // Вызываем оригинальную функцию
            if (originalEndBattle) {
                originalEndBattle.call(this, result, rewards);
            }

            // Сохраняем результат в БД
            await window.dbManager.saveBattleResult(
                result.winner === 'player' ? 'win' : 'loss',
                rewards,
                result.opponentLevel || 1
            );

            // Сохраняем данные игрока
            if (window.gameState) {
                await window.dbManager.savePlayer(window.gameState.getPlayerData());
            }
        };
    }

    // Сохранение при постройке здания
    if (window.buildingSystem) {
        const originalBuildBuilding = window.buildingSystem.build;
        window.buildingSystem.build = async function(buildingType, x, y) {
            // Вызываем оригинальную функцию
            const result = originalBuildBuilding ? originalBuildBuilding.call(this, buildingType, x, y) : null;

            // Отмечаем изменения - здания сохранятся через автосохранение
            window.dbManager.markChanged();

            return result;
        };
    }

    // Отслеживание изменений ресурсов
    if (window.gameState && window.gameState.addTimeCurrency) {
        const originalAddCurrency = window.gameState.addTimeCurrency;
        window.gameState.addTimeCurrency = function(amount) {
            const result = originalAddCurrency.call(this, amount);
            window.dbManager.markChanged();
            return result;
        };
    }
}

// Экспортируем функции
window.initGameWithDatabase = initGameWithDatabase;
window.setupGameHooks = setupGameHooks;

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initGameWithDatabase();
            setupGameHooks();
        }, 1000);
    });
} else {
    setTimeout(() => {
        initGameWithDatabase();
        setupGameHooks();
    }, 1000);
}