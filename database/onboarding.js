// auth/onboarding.js - Логика выбора фракции и регистрации
console.log('✅ auth/onboarding.js загружен');

function showFactionSelection() {
    console.log("Показ формы выбора фракции (auth/onboarding.js)");

    // Скрываем игровую зону
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'none';
    }

    // Показываем форму выбора фракции
    const factionSelection = document.getElementById('faction-selection');
    if (factionSelection) {
        factionSelection.style.display = 'block';
    }

    const factionElement = document.getElementById('faction');
    if (factionElement) {
        factionElement.textContent = 'Выбор фракции...';
    }
}

// Получить название фракции на русском
function getFactionName(faction) {
    const factionNames = {
        "fire": "🔥 Огонь",
        "water": "💧 Вода",
        "wind": "🌪 Ветер",
        "earth": "🌿 Земля",
        "nature": "🌱 Природа",
        "poison": "☣️ Яд"
    };
    return factionNames[faction] || faction;
}

// --- Выбор фракции пользователем ---
async function selectFaction(faction) {
    console.log('Выбрана фракция:', faction);
    
    // Создаём начальные данные игрока
    const initialWizards = [{
        id: 'wizard_1',
        name: 'Начальный маг',
        faction: faction,
        spells: [],
        hp: 100,
        armor: 100,
        max_hp: 100,
        max_armor: 100,
        level: 1
    }];
    
    const initialSpells = {
        "fire": { "spark": { name: "Искра", level: 1, tier: 1 } },
        "water": { "icicle": { name: "Ледышка", level: 1, tier: 1 } },
        "wind": { "gust": { name: "Порыв", level: 1, tier: 1 } },
        "earth": { "pebble": { name: "Камешек", level: 1, tier: 1 } },
        "nature": { "call_wolf": { name: "Зов волка", level: 1, tier: 1 } },
        "poison": { "poisoned_blade": { name: "Отравленный клинок", level: 1, tier: 1 } }
    };
    
    const initialAvailableSpells = ["spark", "icicle", "gust", "pebble", "call_wolf", "poisoned_blade"];
    
    // Сохраняем ВСЁ в Supabase
    if (window.dbManager && window.dbManager.currentPlayer) {
        try {
            const { error } = await window.dbManager.supabase
                .from('players')
                .update({ 
                    faction: faction,
                    wizards: initialWizards,
                    spells: initialSpells,
                    available_spells: initialAvailableSpells,
                    formation: [null, null, null, null, null],
                    buildings: {}
                })
                .eq('id', window.dbManager.currentPlayer.id);
            
            if (error) throw error;
            
            console.log('✅ Начальные данные сохранены в БД');
            
            // Обновляем локальные данные
            window.dbManager.currentPlayer.faction = faction;
            window.dbManager.currentPlayer.wizards = initialWizards;
            window.dbManager.currentPlayer.spells = initialSpells;
            window.dbManager.currentPlayer.available_spells = initialAvailableSpells;
            
            // Создаём window.userData для совместимости со старым кодом
            window.userData = {
                user_id: window.dbManager.currentPlayer.telegram_id,
                username: window.dbManager.currentPlayer.username,
                faction: faction,
                time_currency: window.dbManager.currentPlayer.time_currency,
                level: window.dbManager.currentPlayer.level,
                experience: window.dbManager.currentPlayer.experience,
                buildings: {},
                wizards: initialWizards,
                spells: initialSpells,
                available_spells: initialAvailableSpells,
                formation: [null, null, null, null, null],
                constructions: []
            };
            
            // Скрываем экран выбора фракции
            document.getElementById('faction-selection').style.display = 'none';

            const factionElement = document.getElementById('faction');
            if (factionElement) {
                factionElement.textContent = getFactionName(faction);
            }

            // Инициализируем все системы игры (нужны для демо батла)
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

            // Запускаем демо батл вместо прямого показа города
            if (typeof window.startDemoBattle === 'function') {
                console.log('🎬 Запуск демо батла для фракции:', faction);
                window.startDemoBattle(faction);
            } else {
                console.warn('⚠️ startDemoBattle не найден, показываем город напрямую');
                document.getElementById('game-area').style.display = 'block';
            }
            
        } catch (error) {
            console.error('❌ Ошибка сохранения фракции:', error);
            alert('❌ Ошибка сохранения фракции. Попробуй позже.');
        }
    } else {
        console.error('❌ dbManager или currentPlayer не найдены');
        alert('❌ Ошибка: игрок не загружен');
    }
}

// Делаем функции доступными глобально
window.selectFaction = selectFaction;
window.showFactionSelection = showFactionSelection;
window.getFactionName = getFactionName;