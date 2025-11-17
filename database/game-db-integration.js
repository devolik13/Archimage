// Интеграция Supabase с игрой

// Инициализация при загрузке игры
async function initGameWithDatabase() {
    console.log('🔄 Инициализация игры с базой данных...');
    
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

    console.log('✅ Игрок загружен из Supabase:', player);

    // Применяем данные к window.userData
    if (!window.userData) {
        window.userData = {};
    }

    // Базовые данные
    window.userData.user_id = player.telegram_id;
    window.userData.username = player.username;
    window.userData.faction = player.faction;
    window.userData.time_currency = player.time_currency || 0;
    window.userData.level = player.level || 1;
    window.userData.experience = player.experience || 0;
    window.userData.last_login = player.last_login;

    // Игровые данные (JSONB)
    window.userData.wizards = player.wizards || [];
    window.userData.formation = player.formation || [null, null, null, null, null];
    window.userData.spells = player.spells || {};
    window.userData.buildings = player.buildings || {};

    // Статистика боев
    window.userData.total_battles = player.total_battles || 0;
    window.userData.wins = player.wins || 0;
    window.userData.losses = player.losses || 0;
    window.userData.rating = player.rating || 1000;

    // Прогресс и настройки
    window.userData.pve_progress = player.pve_progress || {};
    window.userData.settings = player.settings || { sound: true, language: 'ru', battle_speed: 'normal' };
    window.userData.tutorial_completed = player.tutorial_completed || false;
    
    // КРИТИЧНО: Извлекаем constructions из buildings._active_constructions
    if (player.buildings && player.buildings._active_constructions) {
        window.userData.constructions = player.buildings._active_constructions;
        console.log('📦 Активные стройки извлечены из buildings:', window.userData.constructions);
    } else {
        window.userData.constructions = [];
        console.log('📦 Constructions инициализирована пустым массивом');
    }

    console.log('📦 Данные применены к window.userData:', {
        faction: window.userData.faction,
        wizards: window.userData.wizards.length,
        spells: Object.keys(window.userData.spells).length,
        constructions: window.userData.constructions.length,
        buildings: Object.keys(window.userData.buildings).length
    });

    // КРИТИЧНО: Проверяем есть ли фракция
    if (!player.faction || player.faction === null) {
        // Новый игрок - показываем выбор фракции
        console.log('🆕 Новый игрок - показываем onboarding');
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
        console.log('👤 Существующий игрок - загружаем игру');
        
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
        
        if (typeof window.initConstructionSystem === 'function') {
            window.initConstructionSystem();
        }
        
        if (typeof window.initCityView === 'function') {
            window.initCityView();
        }
        
        if (typeof window.renderCityGrid === 'function') {
            window.renderCityGrid();
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

    console.log('✅ Игра инициализирована с данными из Supabase');
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