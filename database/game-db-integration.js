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
    window.userData.faction_changed = player.faction_changed || false; // Флаг использованной бесплатной смены

    // DEBUG: Логируем faction_changed при загрузке
    console.log(`🔍 [LOAD DEBUG] player.faction_changed из БД = ${player.faction_changed}`);
    console.log(`🔍 [LOAD DEBUG] window.userData.faction_changed = ${window.userData.faction_changed}`);

    // Защита от читов: валидация значений при загрузке
    window.userData.time_currency = Math.max(0, Math.min(999999, player.time_currency || 0));
    // LAZY ACCRUAL v2: новые поля для ленивого начисления
    window.userData.time_currency_base = Math.max(0, Math.min(999999, player.time_currency_base ?? player.time_currency ?? 0));
    window.userData.time_currency_updated_at = player.time_currency_updated_at || player.last_login || new Date().toISOString();
    window.userData.level = Math.max(1, Math.min(100, player.level || 1));
    window.userData.experience = Math.max(0, player.experience || 0);
    window.userData.last_login = player.last_login;

    // Игровые данные (JSONB)
    window.userData.wizards = player.wizards || [];

    // Миграция: исправляем раздутое HP у магов (баг со стакающимися боевыми множителями)
    window.userData.wizards.forEach(wizard => {
        // Вычисляем максимально допустимое HP: база 100 × бонус уровня (макс ×3 на 40 лвл)
        const level = wizard.level || 1;
        let maxAllowedHp;
        if (level === 40) {
            maxAllowedHp = 300; // 100 × 3.0
        } else if (level > 1) {
            maxAllowedHp = Math.floor(100 * (1 + (level - 1) * 0.05));
        } else {
            maxAllowedHp = 100;
        }
        if (wizard.max_hp > maxAllowedHp) {
            console.log(`🔧 [HP-FIX] ${wizard.name}: max_hp ${wizard.max_hp} → ${maxAllowedHp}`);
            wizard.max_hp = maxAllowedHp;
            wizard.hp = Math.min(wizard.hp, maxAllowedHp);
        }
        // Чистим runtime-поля благословений если остались в БД
        // original_max_hp и blessingEffects — runtime-поля, не должны храниться
        // initBlessingSystem заново пересчитает при необходимости
        delete wizard.blessingEffects;
        delete wizard.original_max_hp;
    });

    window.userData.formation = player.formation || [null, null, null, null, null];
    window.userData.spells = player.spells || {};
    // Миграция: добавляем некромантию для существующих игроков
    if (!window.userData.spells.necromant) {
        window.userData.spells.necromant = {};
    }
    window.userData.buildings = player.buildings || {};

    // Статистика боев (с валидацией)
    window.userData.total_battles = Math.max(0, player.total_battles || 0);
    window.userData.wins = Math.max(0, player.wins || 0);
    window.userData.losses = Math.max(0, player.losses || 0);
    window.userData.rating = Math.max(0, Math.min(9999, player.rating || 0));

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

    // Инициализация энергии боев
    if (player.battle_energy) {
        window.userData.battle_energy = player.battle_energy;
    }
    if (typeof window.initBattleEnergy === 'function') {
        window.initBattleEnergy(window.userData);
    }

    // Данные гильдии
    window.userData.guild_id = player.guild_id || null;
    window.userData.guild_contribution = player.guild_contribution || 0;
    window.userData.guild_last_active = player.guild_last_active || null;

    // Данные благословения
    window.userData.active_blessing = player.active_blessing || null;
    window.userData.blessing_last_used = player.blessing_last_used || null;

    // Купленные стартовые пакеты
    window.userData.purchased_packs = player.purchased_packs || {};
    console.log('📦 [DEBUG] Загружены purchased_packs из БД:', JSON.stringify(player.purchased_packs));

    // Значки (badges) — знаки отличия у ника
    window.userData.badges = player.badges || [];


    // Airdrop данные
    window.userData.airdrop_points = Math.max(0, player.airdrop_points || 0);
    window.userData.airdrop_breakdown = player.airdrop_breakdown || {};
    window.userData.wallet_address = player.wallet_address || null;
    window.userData.wallet_connected_at = player.wallet_connected_at || null;
    console.log('🪂 [DEBUG] Загружены airdrop_points из БД:', player.airdrop_points);
    console.log('🪂 [DEBUG] Загружен airdrop_breakdown из БД:', player.airdrop_breakdown);

    // Автопересчёт airdrop_points из breakdown (исправление для старых данных)
    const breakdownSum = Object.values(window.userData.airdrop_breakdown || {})
        .reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    if (breakdownSum > window.userData.airdrop_points) {
        console.log(`🪂 [FIX] Пересчёт airdrop_points: ${window.userData.airdrop_points} → ${breakdownSum}`);
        window.userData.airdrop_points = breakdownSum;
    }

    // Миграция: объединяем старые категории "Достижение лиги: *" в одну "Достижение лиги"
    const breakdown = window.userData.airdrop_breakdown;
    if (breakdown) {
        let leagueTotal = 0;
        const keysToRemove = [];

        for (const key of Object.keys(breakdown)) {
            if (key.startsWith('Достижение лиги:')) {
                leagueTotal += parseInt(breakdown[key]) || 0;
                keysToRemove.push(key);
            }
        }

        if (keysToRemove.length > 0) {
            // Удаляем старые ключи
            keysToRemove.forEach(key => delete breakdown[key]);
            // Добавляем к общей категории
            breakdown['Достижение лиги'] = (breakdown['Достижение лиги'] || 0) + leagueTotal;
            console.log(`🪂 [FIX] Объединено ${keysToRemove.length} старых записей лиг в "Достижение лиги": +${leagueTotal}`);

            // Принудительно сохраняем исправленные данные
            setTimeout(() => {
                if (typeof window.savePlayer === 'function') {
                    window.savePlayer();
                    console.log('🪂 [FIX] Сохранено исправление категорий лиг');
                }
            }, 2000);
        }
    }

    // Данные сезона
    window.userData.current_season = player.current_season || 1;
    window.userData.season_league_rewards_claimed = player.season_league_rewards_claimed || [];
    console.log('🏆 [DEBUG] Загружен сезон:', player.current_season);
    console.log('🏆 [DEBUG] Полученные награды за лиги:', player.season_league_rewards_claimed);
    console.log('🪂 [DEBUG] window.userData.airdrop_breakdown после присвоения:', window.userData.airdrop_breakdown);

    // Система скинов
    window.userData.unlocked_skins = player.unlocked_skins || [];
    window.userData.wizard_skins = player.wizard_skins || {};
    console.log('🎨 [DEBUG] Загружены unlocked_skins:', player.unlocked_skins);

    // Прогресс тренировочного полигона
    window.userData.training_dummy_progress = player.training_dummy_progress || null;

    // Выполненные задания (airdrop)
    window.userData.completed_tasks = player.completed_tasks || {};

    // Пресеты формаций (до 3 сохранённых расстановок)
    window.userData.formation_presets = player.formation_presets || {};

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

        // Проверка награды за испытание прошлой недели
        if (typeof window.checkAndClaimTrialReward === 'function') {
            window.checkAndClaimTrialReward().then(result => {
                if (result && result.success) {
                    console.log('🏆 Награда за испытание получена:', result);
                }
            }).catch(err => {
                console.warn('⚠️ Ошибка проверки награды испытания:', err);
            });
        }

        // Инициализация UI энергии боев
        if (typeof window.initBattleEnergyUI === 'function') {
            window.initBattleEnergyUI();
        }

        // Оффлайн события отключены
        // if (typeof window.checkOfflineEvents === 'function') {
        //     await window.checkOfflineEvents(player.last_login);
        // }

        // LAZY ACCRUAL v2: last_login обновляется в initTimeCurrency()
        // Убран дублирующий update — теперь одна точка обновления

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

        // Проверка активного ивент босса
        if (typeof window.checkEventBossAvailability === 'function') {
            window.checkEventBossAvailability().catch(err => {
                console.warn('⚠️ Ошибка проверки ивент босса:', err);
            });
        }

        // Анонс ивент босса (один раз при входе)
        if (typeof window.showEventBossAnnouncement === 'function') {
            setTimeout(() => window.showEventBossAnnouncement(), 1500);
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