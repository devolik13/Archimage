// auth/onboarding.js - Логика выбора фракции и регистрации

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
    
    // Определяем родное заклинание фракции
    const factionSpellMap = {
        "fire": "spark",
        "water": "icicle",
        "wind": "gust",
        "earth": "pebble",
        "nature": "call_wolf",
        "poison": "poisoned_blade"
    };

    const factionSpell = factionSpellMap[faction];

    // Выбираем случайное второе заклинание tier 1 (не родное)
    const allTier1Spells = ["spark", "icicle", "gust", "pebble", "call_wolf", "poisoned_blade"];
    const otherSpells = allTier1Spells.filter(spell => spell !== factionSpell);
    const randomSecondSpell = otherSpells[Math.floor(Math.random() * otherSpells.length)];

    // Создаём начальные данные игрока
    // Маг сразу с прикрепленным родным заклинанием + случайное второе заклинание tier 1
    const initialWizards = [{
        id: 'wizard_1',
        name: 'Начальный маг',
        faction: faction,
        spells: [factionSpell, randomSecondSpell], // Родное + случайное tier 1
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
    
    // Стартовые здания: Башня магов и Генератор времени
    const initialBuildings = {
        wizard_tower: { level: 1, building_id: 'wizard_tower' },
        time_generator: { level: 1, building_id: 'time_generator' }
    };

    // Сохраняем ВСЁ в Supabase
    if (window.dbManager && window.dbManager.currentPlayer) {
        try {
            // Автоматическая расстановка первого мага в первую позицию
            const initialFormation = ['wizard_1', null, null, null, null];

            const { error } = await window.dbManager.supabase
                .from('players')
                .update({
                    faction: faction,
                    wizards: initialWizards,
                    spells: initialSpells,
                    formation: initialFormation,
                    buildings: initialBuildings,
                    time_currency: 300, // 5 часов стартового времени
                    welcome_shown: false
                })
                .eq('id', window.dbManager.currentPlayer.id);

            if (error) throw error;


            // Обновляем локальные данные
            window.dbManager.currentPlayer.faction = faction;
            window.dbManager.currentPlayer.wizards = initialWizards;
            window.dbManager.currentPlayer.spells = initialSpells;
            window.dbManager.currentPlayer.buildings = initialBuildings;
            window.dbManager.currentPlayer.time_currency = 300;
            window.dbManager.currentPlayer.welcome_shown = false;

            // Создаём window.userData для совместимости со старым кодом
            window.userData = {
                user_id: window.dbManager.currentPlayer.telegram_id,
                username: window.dbManager.currentPlayer.username,
                faction: faction,
                time_currency: 300,
                level: window.dbManager.currentPlayer.level,
                experience: window.dbManager.currentPlayer.experience,
                buildings: initialBuildings,
                wizards: initialWizards,
                spells: initialSpells,
                formation: initialFormation, // Маг автоматически в первой позиции
                constructions: [],
                welcome_shown: false
            };
            
            // Скрываем экран выбора фракции
            document.getElementById('faction-selection').style.display = 'none';

            const factionElement = document.getElementById('faction');
            if (factionElement) {
                factionElement.textContent = getFactionName(faction);
            }

            // Обрабатываем реферал (если есть)
            if (window.referralManager) {
                const referralResult = await window.referralManager.processReferral(
                    window.dbManager.currentPlayer.id,
                    window.dbManager.currentPlayer.telegram_id
                );
                if (referralResult) {
                    // Обновляем UI с новым временем
                    setTimeout(() => {
                        if (typeof showInlineNotification === 'function') {
                            showInlineNotification(`🎁 Бонус за приглашение: +1 день!`);
                        }
                    }, 2000);
                }
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