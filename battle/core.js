// battle/core.js - Основная логика боя (с интеграцией благословений)...

// Глобальные переменные (остаются без изменений)
let playerFormation = [];
let enemyFormation = [];
let playerWizards = [];
let enemyWizards = [];
let battleState = 'setup';
let battleLog = [];
let battleInterval = null;
let playerMageIndex = 0;
let enemyMageIndex = 0;
let isPaused = false;
let battleSpeed = 2000;
let isVeryFirstTurn = true;
let currentTurn = 'player';
let globalTurnCounter = 0;
let isPlayerAttacker = true;
let currentPhase = 0;
let currentPlayerTurn = 0;

// --- Показать поле боя ---
async function showBattleField() {

    // ✅ ЗАКРЫВАЕМ ВСЕ МОДАЛКИ ПЕРЕД БОЕМ
    if (window.Modal && window.Modal.closeAll) {
        window.Modal.closeAll();
    } else if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }



    try {
        if (window.battleInterval) {
            clearInterval(window.battleInterval);
            window.battleInterval = null;
        }
        // Сбрасываем состояние боя
        window.battleState = 'setup';
        window.currentPhase = 0;
        window.currentPlayerTurn = 0;
        window.battleLog = [];
        window.playerMageIndex = 0;
        window.enemyMageIndex = 0;
        window.isPaused = false;

        // Сброс всех боевых систем
        if (typeof window.resetProjectiles === 'function') {
            window.resetProjectiles();
        }
        if (typeof window.resetWalls === 'function') {
            window.resetWalls();
        }
        window.activeSummons = [];

        // Загружаем расстановку из window.userData
        if (!window.userData) {
            throw new Error('userData не инициализирован');
        }

        // НОВОЕ: Для PvE данные игрока уже настроены (копии) в pve-ui.js, не перезаписываем
        if (window.isPvEBattle && window.playerFormation && window.playerWizards && window.playerWizards.length > 0) {
        } else {
            window.playerFormation = window.userData.formation || [null, null, null, null, null];
            window.playerWizards = window.userData.wizards || [];
        }

        // Генерация расстановки противника
        generateEnemyFormation();

        // Создаём UI и контейнер для PixiJS
        if (typeof window.renderBattleField === 'function') {
            window.renderBattleField();
        }

        // Начало боя (используем window.startBattle для интеграции с battle-timer-manager)
        window.startBattle();
    } catch (error) {
        console.error('❌ Ошибка загрузки расстановки:', error);
        alert('Ошибка загрузки расстановки');
    }
}

function generateEnemyFormation() {

    // НОВОЕ: Для PvE враги уже настроены в pve-ui.js, не перезаписываем их
    if (window.isPvEBattle && window.enemyFormation && window.enemyWizards && window.enemyWizards.length > 0) {
        return;
    }

    // Для тренировочного манекена враг уже настроен в training-dummy-battle.js
    if (window.isTrainingDummyBattle && window.enemyFormation && window.enemyFormation.some(e => e && e.isTrainingDummy)) {
        return;
    }

    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];

    // Проверяем наличие выбранного противника из базы данных
    if (window.selectedOpponent && window.selectedOpponent.wizards && window.selectedOpponent.formation) {

        const opponentWizards = window.selectedOpponent.wizards || [];
        const opponentFormation = window.selectedOpponent.formation || [null, null, null, null, null];

        // Создаем врагов на основе расстановки противника
        const opponentSpellsData = window.selectedOpponent?.spells;
        opponentFormation.forEach((wizardId, position) => {
            if (wizardId) {
                const opponentWizard = opponentWizards.find(w => w.id === wizardId);
                if (opponentWizard) {
                    const wizardSpells = opponentWizard.spells || [];
                    window.enemyFormation[position] = {
                        ...opponentWizard,
                        id: `enemy_${opponentWizard.id}`,
                        original_id: opponentWizard.id, // Сохраняем оригинальный ID
                        spells: wizardSpells,
                        spellLevels: buildSpellLevels(wizardSpells, opponentSpellsData),
                        effects: {}
                    };
                }
            }
        });

        window.enemyWizards = window.enemyFormation.filter(w => w !== null);

    } else {
        // Противник не выбран - бой невозможен
        console.error('❌ Противник не выбран, бой невозможен');
    }
}

// --- Очистка устаревших стен ---
function cleanupOldWalls() {
    if (!window.activeWalls) return;
    window.activeWalls = window.activeWalls.filter(wall => {
        if (wall.type === 'earth_wall_hp') {
            const hasValidStructure = (wall.rows && Array.isArray(wall.rows)) || 
                                    (wall.positions && Array.isArray(wall.positions));
            if (!hasValidStructure) {
                console.warn('Удаляем стену с некорректной структурой:', wall);
                return false;
            }
        }
        return true;
    });
}

// --- Начало боя ---
function startBattle() {

    // ЭНЕРГИЯ УЖЕ СПИСАНА при выборе противника в opponent-selection.js
    // Это предотвращает эксплойт с отменой боя

    // Сбрасываем флаги результата боя для нового боя
    window.battleResultShown = false;
    window._battleCompletedHandled = false;
    window._battleSaveCompleted = false;
    window.arenaResultShown = false;

    // Сбрасываем информацию о разблокированном скине (чтобы не показывать повторно)
    window.lastUnlockedSkin = null;

    // Инициализируем статистику боя для новой системы опыта
    if (typeof window.initBattleStats === 'function') {
        window.initBattleStats();
    }

    // Сохраняем опыт магов ДО начала боя для отображения прироста
    window.wizardExpBeforeBattle = {};
    if (window.playerWizards) {
        window.playerWizards.forEach(wizard => {
            if (wizard && wizard.id) {
                window.wizardExpBeforeBattle[wizard.id] = {
                    name: wizard.name || `Маг ${wizard.id}`,
                    level: wizard.level || 1,
                    experience: wizard.experience || 0
                };
            }
        });
    }

    window.battleState = 'active';
    window.battleLog = [];
    window.playerMageIndex = 0;
    window.enemyMageIndex = 0;
    window.globalTurnCounter = 0;
    window.isVeryFirstTurn = true;
    window.currentTurn = 'player';
    window.isPaused = false;
    // НЕ сбрасываем battleSpeed и battleSpeedMode - сохраняем выбор игрока!
    // Инициализируем только если еще не установлено
    if (!window.battleSpeed) window.battleSpeed = 2000;
    if (!window.battleSpeedMode) window.battleSpeedMode = 'normal';
    window.battlePhaseRunning = false; // 🔒 Сброс блокировки

    // Защита от бесконечных боёв
    window.lastTotalHP = null;
    window.stalemateCounter = 0;
    window.STALEMATE_TURNS_LIMIT = 15; // Ничья после 15 ходов без изменения HP

    // Визуал кнопок управляется через BattleSpeedController

    // Инициализация логгера боя
    if (window.battleLogger) {
        window.battleLogger.init();
    }

    // Очистка менеджера призванных существ
    if (window.summonsManager) {
        window.summonsManager.clearAll();
    } else {
        window.activeSummons = [];
    }

    if (window.spellAnimations) {
        // Очистка эффектов природы
        if (window.spellAnimations.bark_armor?.clearAll) {
            window.spellAnimations.bark_armor.clearAll();
        }
        if (window.spellAnimations.call_wolf?.clearAll) {
            window.spellAnimations.call_wolf.clearAll();
        }
        // Здесь можно добавить очистку других анимаций по мере добавления
    }

    window.activeMeteorokinesis = [];
    window.activeTsunamis = [];
    window.activeBlizzards = [];
    window.currentPhase = 0;
    window.globalTurnCounter = 0;
    window.isPlayerAttacker = true;
    window.activeTsunamis = [];

    // БОСС-БОЙ: Автоопределение если враг один и он босс
    // Можно также установить вручную: window.isBossBattle = true
    const bossEnemy = window.enemyFormation?.find(w => w && (w.isBoss || w.isFinalBoss));
    if (bossEnemy) {
        window.isBossBattle = true;
    } else {
        window.isBossBattle = false;
    }

    // ИСПРАВЛЕНИЕ: Сбрасываем флаг тренировочного манекена для обычных боёв
    // (флаг устанавливается в training-dummy-battle.js при запуске манекена)
    if (!window.isTrainingDummyBattle) {
        // Не трогаем если манекен - это правильный бой
    } else if (!window.enemyFormation?.some(e => e && e.isTrainingDummy)) {
        // Если это НЕ бой с манекеном, сбрасываем флаг
        window.isTrainingDummyBattle = false;
        console.log('🎯 Сброс флага тренировочного манекена');
    }

    if (window.spellAnimations?.fire_tsunami?.clearAll) {
        window.spellAnimations.fire_tsunami.clearAll();
    }

    // Инициализация систем
    if (typeof window.initializeWeatherForBattle === 'function') {
        window.initializeWeatherForBattle();
    }
    if (typeof window.setWeatherDisplay === 'function') {
        (window.battleTimeout || setTimeout)(() => {
            window.setWeatherDisplay();
        }, 100);
    }
    if (typeof window.resetProjectiles === 'function') {
        window.resetProjectiles();
    }
    if (typeof window.resetWalls === 'function') {
        window.resetWalls();
    }

    cleanupOldWalls();
    initializeWizardHealth();

    if (window.battleInterval) {
        clearInterval(window.battleInterval);
    }
    //window.battleInterval = setInterval(executeBattlePhase, window.battleSpeed);
}

// Инициализация здоровья магов
function initializeWizardHealth() {
    // Получаем только магов, которые в расстановке (не все маги игрока!)
    const wizardsInFormation = window.playerFormation
        .filter(id => id !== null)
        .map(id => window.playerWizards.find(w => w.id === id))
        .filter(w => w !== undefined);

    wizardsInFormation.forEach(wizard => {
        // Используем original_max_hp как истинную базу (если есть)
        // Это значение устанавливается при создании мага и не включает бонусы
        const trueBaseHp = wizard.original_max_hp || wizard.max_hp || 100;
        const trueBaseArmor = wizard.original_max_armor || wizard.max_armor || 100;

        // Сохраняем/обновляем оригинальные значения
        wizard.original_hp = trueBaseHp;
        wizard.original_max_hp = trueBaseHp;
        wizard.original_armor = trueBaseArmor;
        wizard.original_max_armor = trueBaseArmor;

        // Начинаем с базовых значений
        wizard.hp = trueBaseHp;
        wizard.max_hp = trueBaseHp;
        wizard.armor = trueBaseArmor;
        wizard.max_armor = trueBaseArmor;
        wizard.effects = {};
        wizard.buffs = {};  // Очищаем баффы (rainbow_shield, dawn и др.)
        wizard.armorBonus = 0;
        wizard.armorBonuses = {};
        wizard.spellDamageMultiplier = undefined;
        wizard.isStunned = false;
        wizard.stunTurns = 0;
        wizard.stoneGrottoBonus = undefined;

        // Инициализация уровней заклинаний из данных игрока
        wizard.spellLevels = buildSpellLevels(wizard.spells, window.userData?.spells);

        // Инициализация сопротивления магии
        if (typeof window.getWizardResistances === 'function') {
            wizard.magicResistance = window.getWizardResistances(wizard);
        }

        // СКРИПТ: инициализация уровней
        if (typeof window.initializeWizardLevel === 'function') {
            window.initializeWizardLevel(wizard);
        }

        // ПОТОМ применяем бонусы уровней к HP
        if (typeof window.applyLevelBonuses === 'function') {
            window.applyLevelBonuses(wizard);
            // ВАЖНО: После применения бонусов уровня устанавливаем hp = max_hp
            wizard.hp = wizard.max_hp;
        }

        // И ТОЛЬКО ПОТОМ применяем бонус от Башни магов
        let healthMultiplier = 1.0;
        if (typeof window.applyWizardTowerHealthBonus === 'function') {
            healthMultiplier = window.applyWizardTowerHealthBonus();
            wizard.max_hp = Math.floor(wizard.max_hp * healthMultiplier);
            wizard.hp = Math.floor(wizard.hp * healthMultiplier);
        }
        if (healthMultiplier > 1.0) {
        }

        // ГИЛЬДИЯ: Применяем бонус HP от гильдии
        // В дуэлях бонусы гильдий отключены (isDuelBattle)
        if (window.guildManager?.currentGuild && !window.isDuelBattle) {
            const guildBonuses = window.guildManager.getGuildBonuses();
            if (guildBonuses && guildBonuses.hpBonus > 0) {
                const guildHpMultiplier = 1 + (guildBonuses.hpBonus / 100);
                const hpBefore = wizard.hp;
                wizard.max_hp = Math.floor(wizard.max_hp * guildHpMultiplier);
                wizard.hp = Math.floor(wizard.hp * guildHpMultiplier);
            }
            // Сохраняем сопротивления гильдии для использования в бою
            wizard.guildResistances = guildBonuses?.resistances || {};
        }

        // НОВОЕ: Применение эффектов благословений
        // Проверяем что благословение ещё активно (не истекло)
        const activeBlessing = window.userData?.active_blessing;
        const blessingStillActive = activeBlessing && activeBlessing.expires_at > Date.now();

        if (wizard.blessingEffects && blessingStillActive) {

            // Бонус брони
            if (wizard.blessingEffects.armorBonus) {
                wizard.armorBonus = (wizard.armorBonus || 0) + wizard.blessingEffects.armorBonus;
            }

            // Множитель здоровья
            if (wizard.blessingEffects.healthMultiplier && wizard.blessingEffects.healthMultiplier > 1) {
                const oldMaxHp = wizard.max_hp;
                const oldHp = wizard.hp;
                wizard.max_hp = Math.floor(wizard.max_hp * wizard.blessingEffects.healthMultiplier);
                wizard.hp = Math.floor(wizard.hp * wizard.blessingEffects.healthMultiplier);
            }

            // Регенерация
            if (wizard.blessingEffects.regeneration) {
                if (!wizard.effects) wizard.effects = {};
                wizard.effects.blessing_regeneration = {
                    amount: Math.floor(wizard.max_hp * wizard.blessingEffects.regeneration),
                    source: 'blessing'
                };
            }
        }

        // Применение "Покрова листвы" (если есть)
        if (wizard.spells && wizard.spells.includes('leaf_canopy')) {
            const level = wizard.spellLevels?.['leaf_canopy'] || 1;
            if (level > 0) {
                applyLeafCanopyEffect(wizard, level);
            }
        }

        if (wizard.spells && wizard.spells.includes('meteorokinesis')) {
            const level = wizard.spellLevels?.['meteorokinesis'] || 1;
            if (level > 0) {
                applyMeteorokinesisEffect(wizard, level);
            }
        }

        if (wizard.spells && wizard.spells.includes('absolute_zero')) {
            const level = wizard.spellLevels?.['absolute_zero'] || 1;
            if (level > 0) {
                applyAbsoluteZeroEffect(wizard, level, 'player');
            }
        }

        if (wizard.spells && wizard.spells.includes('bark_armor')) {
            const level = wizard.spellLevels?.['bark_armor'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1) {
                    window.applyBarkArmorAtStart(wizard, level, position, 'player');
                }
            }
        }

        // Применение "Радужного щита" (Свет, Tier 3)
        if (wizard.spells && wizard.spells.includes('rainbow_shield')) {
            const level = wizard.spellLevels?.['rainbow_shield'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1 && typeof window.applyRainbowShieldAtStart === 'function') {
                    window.applyRainbowShieldAtStart(wizard, level, position, 'player');
                }
            }
        }

        // Применение "Рассвета" (Свет, Tier 5)
        if (wizard.spells && wizard.spells.includes('dawn')) {
            const level = wizard.spellLevels?.['dawn'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1 && typeof window.applyDawnAtStart === 'function') {
                    window.applyDawnAtStart(wizard, level, position, 'player');
                }
            }
        }

        // Применение "Покрова смерти" (Некромантия, Tier 3)
        if (wizard.spells && wizard.spells.includes('death_shroud')) {
            const level = wizard.spellLevels?.['death_shroud'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1 && typeof window.applyDeathShroudAtStart === 'function') {
                    window.applyDeathShroudAtStart(wizard, level, position, 'player');
                }
            }
        }

        // Призыв "Костяного Дракона" (Некромантия, Tier 5)
        if (wizard.spells && wizard.spells.includes('bone_dragon')) {
            const level = wizard.spellLevels?.['bone_dragon'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1 && typeof window.summonBoneDragonAtStart === 'function') {
                    window.summonBoneDragonAtStart(wizard, level, position, 'player');
                }
            }
        }

        // Миазма применяется ПОСЛЕ инициализации всех врагов (см. ниже)
    });

    // То же самое для врагов
    window.enemyWizards.forEach(wizard => {
        // Используем original_max_hp как истинную базу (если есть)
        const trueBaseHp = wizard.original_max_hp || wizard.max_hp || 100;
        const trueBaseArmor = wizard.original_max_armor || wizard.max_armor || 100;

        wizard.original_hp = trueBaseHp;
        wizard.original_max_hp = trueBaseHp;
        wizard.original_armor = trueBaseArmor;
        wizard.original_max_armor = trueBaseArmor;

        wizard.hp = trueBaseHp;
        wizard.max_hp = trueBaseHp;
        wizard.armor = trueBaseArmor;
        wizard.max_armor = trueBaseArmor;

        wizard.effects = {};
        wizard.buffs = {};  // Очищаем баффы (rainbow_shield, dawn и др.)
        wizard.armorBonus = 0;
        wizard.isStunned = false;
        wizard.spellDamageMultiplier = undefined;
        wizard.stunTurns = 0;
        wizard.stoneGrottoBonus = undefined;

        // Определяем тип врага (PvE или PvP)
        const isPveEnemy = wizard.isAdventureEnemy || wizard.isElemental || wizard.isBoss || wizard.isFinalBoss || wizard.isTrainingDummy || wizard.isEventBoss;

        // КРИТИЧЕСКИ ВАЖНО: Применяем бонусы уровня к HP для PvP врагов
        // Для PvE врагов (isPveEnemy) НЕ применяем - у них фиксированные характеристики
        if (!isPveEnemy && typeof window.applyLevelBonuses === 'function') {
            window.applyLevelBonuses(wizard);
            wizard.hp = wizard.max_hp;
        }

        // ПОТОМ применяем бонус от Башни магов (после бонуса уровня!)
        // НО НЕ PvE враги - у них фиксированные характеристики
        let healthMultiplier = 1.0;
        if (!isPveEnemy && typeof window.applyWizardTowerHealthBonus === 'function') {
            healthMultiplier = window.applyWizardTowerHealthBonus();
            wizard.max_hp = Math.floor(wizard.max_hp * healthMultiplier);
            wizard.hp = Math.floor(wizard.hp * healthMultiplier);
        }

        // Инициализация сопротивления магии
        if (typeof window.getWizardResistances === 'function') {
            wizard.magicResistance = window.getWizardResistances(wizard);
        }

        // Логирование параметров врага
        const enemyType = wizard.isFinalBoss ? '👹 ФИНАЛЬНЫЙ БОСС' : wizard.isBoss ? '💀 БОСС' : '⚔️ Враг';
        console.log(`${enemyType}: ${wizard.name} | HP: ${wizard.hp} | Броня: ${wizard.armor} | DMG: ${wizard.damage || 'магия'}${wizard.damageMultiplier ? ` | x${wizard.damageMultiplier} урон` : ''}`);

        // Теперь используем wizard.spellLevels (уже заполнен при создании врага)
        if (wizard.spells && wizard.spells.includes('leaf_canopy')) {
            const level = wizard.spellLevels?.['leaf_canopy'] || 1;
            applyLeafCanopyEffect(wizard, level);
        }

        if (wizard.spells && wizard.spells.includes('absolute_zero')) {
            const level = wizard.spellLevels?.['absolute_zero'] || 1;
            applyAbsoluteZeroEffect(wizard, level, 'enemy');
        }

        // Применение "Радужного щита" для врагов (Свет, Tier 3)
        if (wizard.spells && wizard.spells.includes('rainbow_shield')) {
            const level = wizard.spellLevels?.['rainbow_shield'] || 1;
            const position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
            if (position !== -1 && typeof window.applyRainbowShieldAtStart === 'function') {
                window.applyRainbowShieldAtStart(wizard, level, position, 'enemy');
            }
        }

        // Применение "Рассвета" для врагов (Свет, Tier 5)
        if (wizard.spells && wizard.spells.includes('dawn')) {
            const level = wizard.spellLevels?.['dawn'] || 1;
            const position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
            if (position !== -1 && typeof window.applyDawnAtStart === 'function') {
                window.applyDawnAtStart(wizard, level, position, 'enemy');
            }
        }

        // Применение "Покрова смерти" для врагов (Некромантия, Tier 3)
        if (wizard.spells && wizard.spells.includes('death_shroud')) {
            const level = wizard.spellLevels?.['death_shroud'] || 1;
            const position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
            if (position !== -1 && typeof window.applyDeathShroudAtStart === 'function') {
                window.applyDeathShroudAtStart(wizard, level, position, 'enemy');
            }
        }

        // Призыв "Костяного Дракона" для врагов (Некромантия, Tier 5)
        if (wizard.spells && wizard.spells.includes('bone_dragon')) {
            const level = wizard.spellLevels?.['bone_dragon'] || 1;
            const position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
            if (position !== -1 && typeof window.summonBoneDragonAtStart === 'function') {
                window.summonBoneDragonAtStart(wizard, level, position, 'enemy');
            }
        }

        // Миазма применяется ПОСЛЕ инициализации всех магов (см. ниже)
    });

    // Инициализируем эффекты для магов игрока
    if (window.playerFormation && Array.isArray(window.playerFormation)) {
        window.playerFormation.forEach((wizardId, index) => {
            if (wizardId) {
                const wizard = window.playerWizards.find(w => w.id === wizardId);
                if (wizard) wizard.effects = wizard.effects || {};
            }
        });
    }

    // Инициализируем эффекты для врагов
    if (window.enemyFormation && Array.isArray(window.enemyFormation)) {
        window.enemyFormation.forEach((wizard, index) => {
            if (wizard) wizard.effects = wizard.effects || {};
        });
    }

    // Применение Миазмы ПОСЛЕ инициализации всех магов (чтобы effects не сбросились)
    // Миазма игрока
    window.playerWizards.forEach(wizard => {
        if (wizard.spells && wizard.spells.includes('miasma')) {
            const level = wizard.spellLevels?.['miasma'] || 1;
            if (level > 0) {
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1 && typeof window.applyMiasmaAtStart === 'function') {
                    window.applyMiasmaAtStart(wizard, level, position, 'player');
                }
            }
        }
    });

    // Миазма врагов
    window.enemyWizards.forEach(wizard => {
        if (wizard.spells && wizard.spells.includes('miasma')) {
            const level = wizard.spellLevels?.['miasma'] || 1;
            const position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
            if (position !== -1 && typeof window.applyMiasmaAtStart === 'function') {
                window.applyMiasmaAtStart(wizard, level, position, 'enemy');
            }
        }
    });
}

// НОВОЕ: Обработка регенерации от благословений
function processBlessingRegeneration(wizard) {
    if (wizard.effects && wizard.effects.blessing_regeneration) {
        const healAmount = wizard.effects.blessing_regeneration.amount;
        const oldHp = wizard.hp;

        // Используем стандартную функцию исцеления
        let healedAmount = healAmount;
        if (typeof window.applyFinalHealing === 'function') {
            healedAmount = window.applyFinalHealing(wizard, healAmount, 'blessing');
        } else {
            // Фоллбэк - простое исцеление
            wizard.hp = Math.min(wizard.hp + healAmount, wizard.max_hp);
            healedAmount = wizard.hp - oldHp;
        }

        if (healedAmount > 0 && typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🙏 ${wizard.name} восстанавливает ${healedAmount} HP от благословения (${wizard.hp}/${wizard.max_hp})`);
        }
    }
}

async function executeBattlePhase() {
    // 🔒 БЛОКИРОВКА: Предотвращает параллельное выполнение фаз боя
    if (window.battlePhaseRunning) {
        console.log('⚠️ Фаза боя уже выполняется, пропускаем...');
        return;
    }

    if (window.battleState !== 'active' || window.isPaused) {
        return;
    }

    // Устанавливаем блокировку
    window.battlePhaseRunning = true;

    try {
    // Обработка эффектов
    if (typeof window.processEffects === 'function') {
        window.processEffects();
    }
    if (typeof window.removeDeadSummons === 'function') {
        window.removeDeadSummons();
    }
    if (typeof window.processActiveProjectiles === 'function') {
        window.processActiveProjectiles();
    }
    if (typeof window.processWalls === 'function') {
        window.processWalls();
    }
    if (typeof window.updateFireWalls === 'function') {
        window.updateFireWalls();
    }

    // БОСС-БОЙ: Особая логика ходов
    if (window.isBossBattle) {
        await executeBossBattlePhase();
        window.globalTurnCounter++;
        return; // Выходим, чтобы не выполнять обычную логику
    }

    // ТРЕНИРОВОЧНЫЙ МАНЕКЕН: Враг не атакует
    if (window.isTrainingDummyBattle && typeof window.executeDummyBattlePhase === 'function') {
        await window.executeDummyBattlePhase();
        return; // Выходим, чтобы не выполнять обычную логику
    }

    // Логика ходов зависит от того, кто атакует
    if (window.globalTurnCounter === 0) {
        // Первый ход - 1 маг атакующего
        if (window.isPlayerAttacker) {
            await executePlayerPhase(1);
        } else {
            await executeEnemyPhase(1);
        }
    } else {
        // Дальше чередуем по 2 мага
        if (window.globalTurnCounter % 2 === 1) {
            // Нечётные ходы - защищающийся
            if (window.isPlayerAttacker) {
                await executeEnemyPhase(2);  // Враг защищается
            } else {
                await executePlayerPhase(2);  // Игрок защищается
            }
        } else {
            // Чётные ходы - атакующий
            if (window.isPlayerAttacker) {
                await executePlayerPhase(2);  // Игрок атакует
            } else {
                await executeEnemyPhase(2);   // Враг атакует
            }
        }
    }

    window.globalTurnCounter++;

    // 🔄 Проверка на бесконечный бой (stalemate)
    const currentTotalHP = calculateTotalHP();
    if (window.lastTotalHP !== null && currentTotalHP === window.lastTotalHP) {
        window.stalemateCounter++;
        if (window.stalemateCounter >= window.STALEMATE_TURNS_LIMIT) {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`⚖️ НИЧЬЯ! ${window.STALEMATE_TURNS_LIMIT} ходов без изменений HP`);
            }
            window.battleState = 'stalemate';
            await endBattleAsDraw();
            return;
        }
    } else {
        window.stalemateCounter = 0; // Сбрасываем счётчик если HP изменился
    }
    window.lastTotalHP = currentTotalHP;

    await checkBattleEnd();

    if (typeof window.updateBattleField === 'function') {
        window.updateBattleField();
    }

    } finally {
        // 🔓 СНИМАЕМ БЛОКИРОВКУ в любом случае
        window.battlePhaseRunning = false;
    }
}

// Вычисление общего HP всех существ для проверки stalemate
function calculateTotalHP() {
    let total = 0;

    // HP игроков
    if (window.playerWizards) {
        window.playerWizards.forEach(w => {
            if (w && w.hp > 0) total += w.hp;
        });
    }

    // HP врагов
    if (window.enemyWizards) {
        window.enemyWizards.forEach(w => {
            if (w && w.hp > 0) total += w.hp;
        });
    } else if (window.enemyFormation) {
        window.enemyFormation.forEach(w => {
            if (w && w.hp > 0) total += w.hp;
        });
    }

    // HP призванных существ
    if (window.summonsManager) {
        for (const [id, summon] of window.summonsManager.summons) {
            if (summon.isAlive && summon.hp > 0) {
                total += summon.hp;
            }
        }
    }

    return total;
}

// Завершение боя как ничья
async function endBattleAsDraw() {
    window.battleState = 'finished';

    // Останавливаем таймер боя
    if (window.battleSpeedController) {
        window.battleSpeedController.stopBattle();
    }

    // Начисляем опыт за ничью (считается как поражение - DEFEAT_BONUS)
    // В PvE ничья = проигрыш, опыт не начисляется
    const isPvE = !!window.currentPvELevel;
    let wizardExpGained = [];
    if (typeof window.grantBattleExp === 'function' && !isPvE) {
        wizardExpGained = window.grantBattleExp([], false);
    }

    // Показываем результат как ничью (считается поражением для обеих сторон)
    const isPvEBattle = window.isPvEBattle || false;

    if (isPvEBattle) {
        // Для PvE - показываем как поражение
        (window.battleTimeout || setTimeout)(() => {
            window.isPvEBattle = false;
            window.currentPvELevel = null;
            if (typeof window.showArenaResult === 'function') {
                window.showArenaResult('loss', {
                    opponentName: 'Ничья',
                    ratingChange: 0,
                    wizardExpGained: wizardExpGained,
                    isPvE: true,
                    earlyExit: false
                });
            } else if (typeof window.returnToCity === 'function') {
                window.returnToCity();
            }
        }, 1000);
    } else {
        // Для PvP - нет изменения рейтинга
        (window.battleTimeout || setTimeout)(() => {
            if (typeof window.showArenaResult === 'function') {
                window.showArenaResult('draw', {
                    opponentName: window.selectedOpponent?.username || 'Противник',
                    ratingChange: 0,
                    wizardExpGained: wizardExpGained,
                    earlyExit: false
                });
            }
        }, 1000);
    }
}

async function executeSingleMageAttack(wizard, position, casterType) {
    // Логирование начала хода
    if (window.battleLogger) {
        window.battleLogger.logTurnStart(casterType, wizard, position);
    }

    // 📊 Сохраняем HP врагов ДО хода для подсчёта нанесённого урона
    const enemyHpBefore = {};
    const enemies = casterType === 'player' ? window.enemyWizards : window.playerWizards;
    if (enemies) {
        enemies.forEach(enemy => {
            if (enemy && enemy.id) {
                enemyHpBefore[enemy.id] = enemy.hp || 0;
            }
        });
    }

    // 💚 Сохраняем HP союзников ДО хода для подсчёта лечения
    const allyHpBefore = {};
    const allies = casterType === 'player' ? window.playerWizards : window.enemyWizards;
    if (allies) {
        allies.forEach(ally => {
            if (ally && ally.id) {
                allyHpBefore[ally.id] = ally.hp || 0;
            }
        });
    }

    // ☠️ ОБРАБОТКА УРОНА ОТ ЯДА В НАЧАЛЕ ХОДА МАГА
    if (wizard.effects && wizard.effects.poison && wizard.effects.poison.stacks > 0) {
        let poisonDamage = wizard.effects.poison.stacks * (wizard.effects.poison.damagePerStack || 5);

        // 🌑 Применяем модификатор Миазмы (защита союзников / усиление урона по врагам)
        if (typeof window.getMiasmaPoisonModifier === 'function') {
            // Проверяем бафф защиты (для союзников кастера миазмы)
            if (wizard.buffs?.miasma_protection) {
                const miasmaModifier = window.getMiasmaPoisonModifier(wizard, true, null);
                if (miasmaModifier < 1) {
                    const oldDamage = poisonDamage;
                    poisonDamage = Math.floor(poisonDamage * miasmaModifier);
                    if (typeof window.addToBattleLog === 'function' && oldDamage !== poisonDamage) {
                        window.addToBattleLog(`☣️ Миазма защищает ${wizard.name}: урон от яда ${oldDamage} → ${poisonDamage}`);
                    }
                }
            }
            // Проверяем дебафф усиления урона (для врагов кастера миазмы)
            else if (wizard.effects?.miasma_vulnerability) {
                const miasmaModifier = window.getMiasmaPoisonModifier(wizard, false, null);
                if (miasmaModifier > 1) {
                    const oldDamage = poisonDamage;
                    poisonDamage = Math.floor(poisonDamage * miasmaModifier);
                    if (typeof window.addToBattleLog === 'function' && oldDamage !== poisonDamage) {
                        window.addToBattleLog(`☣️ Миазма усиливает яд на ${wizard.name}: урон ${oldDamage} → ${poisonDamage}`);
                    }
                }
            }
        }

        wizard.hp -= poisonDamage;
        if (wizard.hp < 0) wizard.hp = 0;

        // Логирование DoT урона
        if (window.battleLogger) {
            window.battleLogger.logDotDamage(wizard, 'poison', poisonDamage, wizard.effects.poison.stacks);
        }

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ ${wizard.name} получает ${poisonDamage} урона от яда (${wizard.effects.poison.stacks} стаков) (${wizard.hp}/${wizard.max_hp})`);
        }

        if (wizard.hp <= 0) {
            if (window.battleLogger) {
                window.battleLogger.logDeath(wizard, casterType, 'poison');
            }
            return false;
        }
    }

    // ❄️ ОБРАБОТКА УРОНА ОТ АБСОЛЮТНОГО НОЛЯ В НАЧАЛЕ ХОДА МАГА
    if (typeof window.processAbsoluteZeroForWizard === 'function') {
        const azResult = window.processAbsoluteZeroForWizard(wizard, position, casterType);
        if (azResult && azResult.died) {
            return false; // Маг погиб от Абсолютного Ноля
        }
    }

    // 🌃 ОБРАБОТКА РЕГЕНЕРАЦИИ (включая благословения)
    if (wizard.effects && wizard.effects.leaf_canopy && typeof window.processRegenerationForWizard === 'function') {
        window.processRegenerationForWizard(wizard);
    }

    // НОВОЕ: Обработка регенерации от благословений
    processBlessingRegeneration(wizard);

    // Проверка на огненную землю
    if (typeof window.processFireGroundForWizard === 'function') {
        window.processFireGroundForWizard(wizard, position, casterType);
    }

    // 🔥 ОБРАБОТКА ГОРЕНИЯ
    if (typeof window.processBurningForWizard === 'function') {
        window.processBurningForWizard(wizard);
        if (wizard.hp <= 0) return false;
    }

    // Проверка на оглушение
    if (wizard.isStunned && wizard.stunTurns > 0) {
        if (typeof window.addToBattleLog === 'function') {
            const turnsText = wizard.stunTurns > 1 ? ` (ещё ${wizard.stunTurns} хода)` : '';
            window.addToBattleLog(`😵 ${wizard.name} оглушён и пропускает ход${turnsText}`);
        }
        wizard.stunTurns--;
        if (wizard.stunTurns <= 0) {
            wizard.isStunned = false;
        }
        return true;
    }

    // Призванные существа
    if (window.summonsManager) {
        for (const [id, summon] of window.summonsManager.summons) {
            // Проверяем что маг-хозяин ЖИВ
            if (summon.casterId === wizard.id && 
                summon.isAlive && 
                wizard.hp > 0) {  // ДОБАВИТЬ эту проверку
                if (summon.type === 'nature_wolf') {
                    if (typeof window.performWolfAttack === 'function') {
                        window.performWolfAttack(summon, wizard);
                        if (await checkBattleEnd()) {
                            return false;
                        }
                    }
                }
                if (summon.type === 'bone_dragon') {
                    if (typeof window.performBoneDragonAttack === 'function') {
                        window.performBoneDragonAttack(summon, wizard);
                        // Проверяем ауру после атаки (дракон мог погибнуть)
                        if (typeof window.checkBoneDragonAura === 'function') {
                            window.checkBoneDragonAura();
                        }
                        if (await checkBattleEnd()) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    // Огненные стены
    if (typeof window.processFireWallsForWizard === 'function') {
        window.processFireWallsForWizard(wizard, casterType);
        // Проверка на смерть от огненной стены
        if (wizard.hp <= 0) {
            if (window.battleLogger) {
                window.battleLogger.logDeath(wizard, casterType, 'fire_wall');
            }
            return false;
        }
    }

    // Прерывание от Абсолютного Ноля проверяется в spells.js для каждого заклинания отдельно

    // 🪤 Восстановление Костяных клеток в ход мага-некроманта
    if (typeof window.restoreBoneCages === 'function') {
        window.restoreBoneCages(wizard.id);
    }

    // ИСПОЛЬЗОВАНИЕ ЗАКЛИНАНИЙ - ждём завершения всех кастов
    // 👁️ Ослепление проверяется в findTarget для каждого боевого заклинания отдельно
    if (typeof window.useWizardSpells === 'function') {
        await window.useWizardSpells(wizard, position, casterType);
    }

    // 👁️ Снимаем эффект ослепления после хода (счётчик ходов)
    if (typeof window.processBlindedEffectAfterTurn === 'function') {
        window.processBlindedEffectAfterTurn(wizard);
    }

    // 🌑 Снимаем эффект слабости после хода (счётчик ходов)
    if (typeof window.processWeakenedEffectAfterTurn === 'function') {
        window.processWeakenedEffectAfterTurn(wizard, position, casterType);
    }

    if (window.activeMeteorokinesis && wizard && wizard.hp > 0) {
        window.activeMeteorokinesis.forEach(effect => {
            if (effect.casterId === wizard.id && effect.isActive) {
                effect.casterActionsCount++;
                // На 4 уровне после 2-го действия восстанавливаем погоду
                if (effect.level === 4 && effect.casterActionsCount >= 2 && !effect.weatherRestored) {
                    effect.weatherRestored = true;
                    // Восстанавливаем оригинальную погоду
                    if (window.originalWeather) {
                        window.currentWeather = window.originalWeather;
                        delete window.originalWeather;
                        if (typeof window.addToBattleLog === 'function') {
                            const weatherNames = {
                                'drought': 'Засуха',
                                'ice_fog': 'Ледяной туман',
                                'sandstorm': 'Песчаная буря',
                                'storm': 'Шторм'
                            };
                            window.addToBattleLog(`🌤️ Блокировка погоды от Метеокинеза истекла. Погода: ${weatherNames[window.currentWeather]}`);
                        }
                    }
                    // Визуальное ослабление эффекта
                    if (window.spellAnimations?.meteorokinesis?.weaken) {
                        window.spellAnimations.meteorokinesis.weaken();
                    }
                }
            }
        });
    }

    // Цунами
    if (typeof window.processTsunamisForCaster === 'function') {
        window.processTsunamisForCaster(wizard, casterType);
    }

    // 📊 Подсчёт нанесённого урона и начисление опыта (только для игрока)
    if (casterType === 'player' && typeof window.trackDamageExp === 'function') {
        let totalDamageDealt = 0;
        if (enemies) {
            enemies.forEach(enemy => {
                if (enemy && enemy.id && enemyHpBefore[enemy.id] !== undefined) {
                    const hpLost = enemyHpBefore[enemy.id] - (enemy.hp || 0);
                    if (hpLost > 0) {
                        totalDamageDealt += hpLost;
                    }
                }
            });
        }
        if (totalDamageDealt > 0) {
            window.trackDamageExp(wizard, totalDamageDealt);
        }

        // 💚 Подсчёт лечения союзников (XP за лечение)
        let totalHealingDone = 0;
        if (allies) {
            allies.forEach(ally => {
                if (ally && ally.id && allyHpBefore[ally.id] !== undefined) {
                    const hpGained = (ally.hp || 0) - allyHpBefore[ally.id];
                    if (hpGained > 0) {
                        totalHealingDone += hpGained;
                    }
                }
            });
        }
        if (totalHealingDone > 0) {
            window.trackHealExp(wizard, totalHealingDone);
        }
    }

    return true;
}

// --- Фаза игрока ---
async function executePlayerPhase(mageCount) {
    // Проверка на Чуму
    if (typeof window.processPlagueEffects === 'function') {
        window.processPlagueEffects('player');
    }

    let magesToAttack = [];
    let positionsChecked = 0;
    let currentPos = window.playerMageIndex;

    // Ищем нужное количество живых магов
    while (magesToAttack.length < mageCount && positionsChecked < 5) {
        const wizardId = window.playerFormation[currentPos];
        if (wizardId) {
            const wizard = window.playerWizards.find(w => w.id === wizardId);
            if (wizard && wizard.hp > 0) {
                magesToAttack.push({ wizard, position: currentPos });
            }
        }
        currentPos = (currentPos + 1) % 5;
        positionsChecked++;
    }

    // Атакуем - последовательно, ждём завершения каждого мага
    for (const mageData of magesToAttack) {
        if (mageData.wizard.hp > 0) {
            await executeSingleMageAttack(mageData.wizard, mageData.position, 'player');
        }
    }

    // Проверка на Метеокинез
    if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
        window.checkMeteorokinesisCasterAlive();
    }

    // ВАЖНО: Сохраняем позицию после последнего атаковавшего мага
    if (magesToAttack.length > 0) {
        const lastPosition = magesToAttack[magesToAttack.length - 1].position;
        window.playerMageIndex = (lastPosition + 1) % 5;
        // Пропускаем пустые слоты для следующего хода
        let skipCount = 0;
        while (window.playerFormation[window.playerMageIndex] === null && skipCount < 5) {
            window.playerMageIndex = (window.playerMageIndex + 1) % 5;
            skipCount++;
        }
    }
}

// --- Фаза противника ---
async function executeEnemyPhase(mageCount) {
    // Проверка на Чуму
    if (typeof window.processPlagueEffects === 'function') {
        window.processPlagueEffects('enemy');
    }

    let magesToAttack = [];
    let positionsChecked = 0;
    let currentPos = window.enemyMageIndex;

    // Ищем нужное количество живых магов противника
    while (magesToAttack.length < mageCount && positionsChecked < 5) {
        const wizard = window.enemyFormation[currentPos];
        if (wizard && wizard.hp > 0) {
            magesToAttack.push({ wizard, position: currentPos });
        }
        currentPos = (currentPos + 1) % 5;
        positionsChecked++;
    }

    // Атакуем - последовательно, ждём завершения каждого мага
    for (const mageData of magesToAttack) {
        if (mageData.wizard.hp > 0) {
            await executeSingleMageAttack(mageData.wizard, mageData.position, 'enemy');
        }
    }

    // Проверка на Метеокинез
    if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
        window.checkMeteorokinesisCasterAlive();
    }

    // Сохраняем позицию после последнего атаковавшего мага
    if (magesToAttack.length > 0) {
        const lastPosition = magesToAttack[magesToAttack.length - 1].position;
        window.enemyMageIndex = (lastPosition + 1) % 5;
        // Пропускаем пустые/мёртвых для следующего хода
        let skipCount = 0;
        while (skipCount < 5) {
            const nextWizard = window.enemyFormation[window.enemyMageIndex];
            if (nextWizard && nextWizard.hp > 0) {
                break; // Нашли живого мага
            }
            window.enemyMageIndex = (window.enemyMageIndex + 1) % 5;
            skipCount++;
        }
    }
}

// --- БОСС-БОЙ: Фаза боя с боссом ---
// Логика: Маг1 (2 спелла) → Маг2 (2 спелла) → ... → Маг5 (2 спелла) → Босс (все спеллы) → повтор
async function executeBossBattlePhase() {
    // Чётные ходы (0, 2, 4...) - фаза игрока (ВСЕ маги по 2 заклинания)
    // Нечётные ходы (1, 3, 5...) - фаза босса (ВСЕ заклинания)

    const isPlayerTurn = window.globalTurnCounter % 2 === 0;

    if (isPlayerTurn) {
        // ═══════════════════════════════════════════
        // ФАЗА ИГРОКА: Все живые маги атакуют по очереди (макс 2 заклинания каждый)
        // ═══════════════════════════════════════════

        // Пауза перед ходом игрока для завершения анимаций босса
        if (window.globalTurnCounter > 0) {
            // 40% от текущей скорости боя (800ms при обычной, 320ms при быстрой)
            const delay = (window.battleSpeed || 2000) * 0.4;
            await new Promise(resolve => (window.battleTimeout || setTimeout)(resolve, delay));
        }

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`━━━ Ход игрока (раунд ${Math.floor(window.globalTurnCounter / 2) + 1}) ━━━`);
        }

        // Проверка на Чуму для всех магов игрока
        if (typeof window.processPlagueEffects === 'function') {
            window.processPlagueEffects('player');
        }

        // Собираем ВСЕХ живых магов игрока
        const alivePlayers = [];
        for (let pos = 0; pos < 5; pos++) {
            const wizardId = window.playerFormation[pos];
            if (wizardId) {
                const wizard = window.playerWizards.find(w => w.id === wizardId);
                if (wizard && wizard.hp > 0) {
                    alivePlayers.push({ wizard, position: pos });
                }
            }
        }

        // Последовательно каждый маг использует 2 заклинания
        for (const mageData of alivePlayers) {
            // Проверяем что маг ещё жив (мог умереть от DoT)
            if (mageData.wizard.hp <= 0) continue;

            // Обработка эффектов перед ходом мага
            await processMagePreTurnEffects(mageData.wizard, mageData.position, 'player');
            if (mageData.wizard.hp <= 0) continue;

            // Проверка на оглушение
            if (mageData.wizard.isStunned && mageData.wizard.stunTurns > 0) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`😵 ${mageData.wizard.name} оглушён и пропускает ход`);
                }
                mageData.wizard.stunTurns--;
                if (mageData.wizard.stunTurns <= 0) mageData.wizard.isStunned = false;
                continue;
            }

            // 📊 Сохраняем HP врагов и союзников ДО хода для подсчёта опыта
            const enemyHpBefore = {};
            const allyHpBefore = {};
            if (window.enemyFormation) {
                window.enemyFormation.forEach(enemy => {
                    if (enemy && enemy.id) enemyHpBefore[enemy.id] = enemy.hp || 0;
                });
            }
            if (window.playerWizards) {
                window.playerWizards.forEach(ally => {
                    if (ally && ally.id) allyHpBefore[ally.id] = ally.hp || 0;
                });
            }

            // Маг использует 2 заклинания
            if (typeof window.useWizardSpellsForBoss === 'function') {
                await window.useWizardSpellsForBoss(mageData.wizard, mageData.position, 'player', 2);
            }

            // 📊 Подсчёт нанесённого урона для опыта
            if (typeof window.trackDamageExp === 'function') {
                let totalDamageDealt = 0;
                if (window.enemyFormation) {
                    window.enemyFormation.forEach(enemy => {
                        if (enemy && enemy.id && enemyHpBefore[enemy.id] !== undefined) {
                            const hpLost = enemyHpBefore[enemy.id] - (enemy.hp || 0);
                            if (hpLost > 0) totalDamageDealt += hpLost;
                        }
                    });
                }
                if (totalDamageDealt > 0) {
                    window.trackDamageExp(mageData.wizard, totalDamageDealt);
                }
            }

            // 💚 Подсчёт лечения для опыта
            if (typeof window.trackHealExp === 'function') {
                let totalHealingDone = 0;
                if (window.playerWizards) {
                    window.playerWizards.forEach(ally => {
                        if (ally && ally.id && allyHpBefore[ally.id] !== undefined) {
                            const hpGained = (ally.hp || 0) - allyHpBefore[ally.id];
                            if (hpGained > 0) totalHealingDone += hpGained;
                        }
                    });
                }
                if (totalHealingDone > 0) {
                    window.trackHealExp(mageData.wizard, totalHealingDone);
                }
            }

            // Проверяем смерть босса после хода мага
            if (await checkBattleEnd()) return;

            // Обновляем UI после хода каждого мага
            if (typeof window.updateBattleField === 'function') {
                window.updateBattleField();
            }

            // Пауза между магами для завершения всех анимаций
            // 25% от текущей скорости боя (500ms при обычной, 200ms при быстрой)
            const delay = (window.battleSpeed || 2000) * 0.25;
            await new Promise(resolve => (window.battleTimeout || setTimeout)(resolve, delay));
        }

        // Проверка на Метеокинез
        if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
            window.checkMeteorokinesisCasterAlive();
        }

    } else {
        // ═══════════════════════════════════════════
        // ФАЗА БОССА: Босс использует ВСЕ свои заклинания
        // ═══════════════════════════════════════════

        // Пауза перед ходом босса для завершения анимаций игрока
        // 40% от текущей скорости боя (800ms при обычной, 320ms при быстрой)
        const delay = (window.battleSpeed || 2000) * 0.4;
        await new Promise(resolve => (window.battleTimeout || setTimeout)(resolve, delay));

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`━━━ Ход босса ━━━`);
        }

        // Проверка на Чуму для босса
        if (typeof window.processPlagueEffects === 'function') {
            window.processPlagueEffects('enemy');
        }

        // Находим живого босса
        const boss = window.enemyFormation.find(w => w && w.hp > 0 && (w.isBoss || w.isFinalBoss));

        if (boss) {
            const bossPosition = window.enemyFormation.findIndex(w => w && w.id === boss.id);

            // Обработка эффектов перед ходом босса
            await processMagePreTurnEffects(boss, bossPosition, 'enemy');

            if (boss.hp > 0) {
                // Проверка на оглушение босса
                if (boss.isStunned && boss.stunTurns > 0) {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`😵 ${boss.name} оглушён и пропускает ход`);
                    }
                    boss.stunTurns--;
                    if (boss.stunTurns <= 0) boss.isStunned = false;
                } else {
                    // Босс использует ВСЕ свои заклинания (maxSpells = 99)
                    if (typeof window.useWizardSpellsForBoss === 'function') {
                        await window.useWizardSpellsForBoss(boss, bossPosition, 'enemy', 99);
                    }
                }
            }

            // Проверка на Метеокинез
            if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
                window.checkMeteorokinesisCasterAlive();
            }
        }
    }

    // 🔄 Проверка на бесконечный бой (stalemate) для босс-боя
    const currentTotalHP = calculateTotalHP();
    if (window.lastTotalHP !== null && currentTotalHP === window.lastTotalHP) {
        window.stalemateCounter++;
        if (window.stalemateCounter >= window.STALEMATE_TURNS_LIMIT) {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`⚖️ НИЧЬЯ! ${window.STALEMATE_TURNS_LIMIT} ходов без изменений HP`);
            }
            window.battleState = 'stalemate';
            await endBattleAsDraw();
            return;
        }
    } else {
        window.stalemateCounter = 0;
    }
    window.lastTotalHP = currentTotalHP;

    // Проверка окончания боя
    await checkBattleEnd();

    // Обновление поля боя
    if (typeof window.updateBattleField === 'function') {
        window.updateBattleField();
    }
}

// --- Обработка эффектов перед ходом мага (для босс-боя) ---
async function processMagePreTurnEffects(wizard, position, casterType) {
    // Яд
    if (wizard.effects && wizard.effects.poison && wizard.effects.poison.stacks > 0) {
        let poisonDamage = wizard.effects.poison.stacks * (wizard.effects.poison.damagePerStack || 5);

        // 🌑 Применяем модификатор Миазмы (защита союзников / усиление урона по врагам)
        if (typeof window.getMiasmaPoisonModifier === 'function') {
            // Проверяем бафф защиты (для союзников кастера миазмы)
            if (wizard.buffs?.miasma_protection) {
                const miasmaModifier = window.getMiasmaPoisonModifier(wizard, true, null);
                if (miasmaModifier < 1) {
                    const oldDamage = poisonDamage;
                    poisonDamage = Math.floor(poisonDamage * miasmaModifier);
                    if (typeof window.addToBattleLog === 'function' && oldDamage !== poisonDamage) {
                        window.addToBattleLog(`☣️ Миазма защищает ${wizard.name}: урон от яда ${oldDamage} → ${poisonDamage}`);
                    }
                }
            }
            // Проверяем дебафф усиления урона (для врагов кастера миазмы)
            else if (wizard.effects?.miasma_vulnerability) {
                const miasmaModifier = window.getMiasmaPoisonModifier(wizard, false, null);
                if (miasmaModifier > 1) {
                    const oldDamage = poisonDamage;
                    poisonDamage = Math.floor(poisonDamage * miasmaModifier);
                    if (typeof window.addToBattleLog === 'function' && oldDamage !== poisonDamage) {
                        window.addToBattleLog(`☣️ Миазма усиливает яд на ${wizard.name}: урон ${oldDamage} → ${poisonDamage}`);
                    }
                }
            }
        }

        wizard.hp -= poisonDamage;
        if (wizard.hp < 0) wizard.hp = 0;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`☠️ ${wizard.name} получает ${poisonDamage} урона от яда (${wizard.hp}/${wizard.max_hp})`);
        }
    }

    // Абсолютный Ноль
    if (typeof window.processAbsoluteZeroForWizard === 'function') {
        window.processAbsoluteZeroForWizard(wizard, position, casterType);
    }

    // Регенерация
    if (wizard.effects && wizard.effects.leaf_canopy && typeof window.processRegenerationForWizard === 'function') {
        window.processRegenerationForWizard(wizard);
    }

    // Огненная земля
    if (typeof window.processFireGroundForWizard === 'function') {
        window.processFireGroundForWizard(wizard, position, casterType);
    }

    // Горение
    if (typeof window.processBurningForWizard === 'function') {
        window.processBurningForWizard(wizard);
    }

    // Огненные стены
    if (typeof window.processFireWallsForWizard === 'function') {
        window.processFireWallsForWizard(wizard, casterType);
    }
}

// --- Проверка окончания боя ---
async function checkBattleEnd() {
    // 🔒 Защита от множественных вызовов
    if (window.battleState === 'finished' || window.battleResultShown) {
        return true; // Бой уже завершён
    }

    // ВАЖНО: Сохраняем флаг PvE в начале, чтобы избежать race conditions
    const isPvEBattle = window.isPvEBattle || false;

    const playerAlive = window.playerFormation.some((wizardId, index) => {
        if (wizardId) {
            const wizard = window.playerWizards.find(w => w.id === wizardId);
            return wizard && wizard.hp > 0;
        }
        return false;
    });

    const enemyAlive = window.enemyFormation.some(wizard => wizard && wizard.hp > 0);

    // Подсчет живых магов
    const playerAliveCount = window.playerFormation.filter((wizardId) => {
        if (wizardId) {
            const wizard = window.playerWizards.find(w => w.id === wizardId);
            return wizard && wizard.hp > 0;
        }
        return false;
    }).length;

    const enemyAliveCount = window.enemyFormation.filter(wizard => wizard && wizard.hp > 0).length;

    // Логирование проверки конца боя
    if (window.battleLogger) {
        window.battleLogger.logBattleEndCheck(playerAlive, enemyAlive, playerAliveCount, enemyAliveCount);
    }

    if (!playerAlive || !enemyAlive) {
        window.battleState = 'finished';

        // КРИТИЧНО: Останавливаем боевой цикл сразу после окончания боя
        if (window.battleInterval) {
            clearInterval(window.battleInterval);
            window.battleInterval = null;
        }

        // Останавливаем через battle-speed-controller
        if (window.battleSpeedController) {
            window.battleSpeedController.stopBattle();
        }

        let resultLog = '';
        if (!playerAlive && !enemyAlive) {
            resultLog = '💀 Все маги погибли! Ничья!';
        } else if (!playerAlive) {
            resultLog = '💀 Все маги игрока погибли! Поражение.';
        } else {
            resultLog = '🏆 Все маги противника погибли! Победа!';
        }

        // Логирование конца боя
        if (window.battleLogger) {
            window.battleLogger.logBattleEnd(resultLog, playerAlive, enemyAlive);
        }

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(resultLog);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(resultLog);
        }

        // Начисляем опыт ВСЕМ магам игрока (не только выжившим)
        const allPlayerWizards = window.playerFormation
            .map(id => id ? window.playerWizards.find(w => w.id === id) : null)
            .filter(w => w);

        // Определяем результат боя для XP
        const isVictory = !enemyAlive && playerAlive;

        // Начисляем опыт через новую систему (подсчёт в конце боя)
        // grantBattleExp возвращает массив с детальной статистикой
        // В дуэлях опыт НЕ начисляется
        // В PvE опыт начисляется ТОЛЬКО при первом прохождении уровня И только за победу
        const isDuel = window.isDuelBattle || false;
        const isPvE = !!window.currentPvELevel;
        let isPvEFirstCompletion = true;
        if (isPvE) {
            const pveProgress = window.loadPvEProgress();
            isPvEFirstCompletion = !pveProgress.chapter1.completed?.[window.currentPvELevel];
        }

        const shouldGrantExp = !isDuel && (!isPvE || (isPvEFirstCompletion && isVictory));
        if (typeof window.grantBattleExp === 'function' && shouldGrantExp) {
            window.lastBattleExpResults = window.grantBattleExp(allPlayerWizards, isVictory);
        } else if (isDuel || (isPvE && (!isPvEFirstCompletion || !isVictory))) {
            window.lastBattleExpResults = []; // Пустой массив — опыт не начисляется
        }

        // Начисляем airdrop очки за PvP победу (если это не PvE и не дуэль)
        if (isVictory && !isPvEBattle && !isDuel && typeof window.addAirdropPoints === 'function') {
            window.addAirdropPoints(10, 'Победа в PvP');
        }

        // Если это PvE приключение и игрок победил
        if (window.currentPvELevel && !enemyAlive && playerAlive) {
            const level = window.CHAPTER_1_LEVELS?.find(l => l.id === window.currentPvELevel);
            if (level) {
                // Загружаем прогресс ДО обновления
                const progress = window.loadPvEProgress();
                if (!progress.chapter1.completed) {
                    progress.chapter1.completed = {};
                }

                // Проверяем, был ли уровень уже пройден (для награды)
                const isFirstCompletion = !progress.chapter1.completed[window.currentPvELevel];

                // Отмечаем уровень как пройденный
                progress.chapter1.completed[window.currentPvELevel] = true;

                // Открываем следующий уровень
                if (window.currentPvELevel >= progress.chapter1.maxLevel) {
                    progress.chapter1.maxLevel = window.currentPvELevel + 1;
                }

                await window.savePvEProgress(progress);

                // Обновляем UI карты если она открыта
                if (typeof window.refreshAdventureMap === 'function') {
                    window.refreshAdventureMap();
                }

                // Даём награду временем ТОЛЬКО при первом прохождении
                if (level.reward && isFirstCompletion) {
                    const timeRewardMinutes = level.reward; // в минутах
                    // addTimeCurrency принимает минуты, НЕ умножаем на 60!
                    // ВАЖНО: await чтобы base обновился ДО savePlayer ниже
                    if (typeof window.addTimeCurrency === 'function') {
                        await window.addTimeCurrency(timeRewardMinutes);
                        if (typeof window.addToBattleLog === 'function') {
                            // Определяем формат отображения
                            let rewardText;
                            if (timeRewardMinutes >= 1440) {
                                // Показываем в днях для больших наград
                                const days = Math.floor(timeRewardMinutes / 1440);
                                const daysText = days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней');
                                rewardText = `${days} ${daysText}`;
                            } else if (timeRewardMinutes >= 60) {
                                // Показываем в часах
                                const hours = Math.floor(timeRewardMinutes / 60);
                                const hoursText = hours === 1 ? 'час' : (hours < 5 ? 'часа' : 'часов');
                                rewardText = `${hours} ${hoursText}`;
                            } else {
                                // Показываем в минутах
                                const minutesText = timeRewardMinutes === 1 ? 'минуту' : (timeRewardMinutes < 5 ? 'минуты' : 'минут');
                                rewardText = `${timeRewardMinutes} ${minutesText}`;
                            }
                            window.addToBattleLog(`⏰ Получено: ${rewardText} времени!`);
                        }
                    }
                } else if (level.reward && !isFirstCompletion) {
                    // Уровень переигрывается - награда не выдаётся
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`ℹ️ Уровень уже был пройден - награда не выдаётся`);
                    }
                }

                // Логируем прохождение
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🎉 Уровень ${window.currentPvELevel} пройден!`);
                    if (window.currentPvELevel < 50) {
                        window.addToBattleLog(`✅ Открыт уровень ${window.currentPvELevel + 1}`);
                    } else {
                        window.addToBattleLog(`👑 Поздравляем! Глава 1 пройдена!`);

                        // Начисляем бонус за прохождение всей главы (только первый раз)
                        if (isFirstCompletion && typeof window.addAirdropPoints === 'function') {
                            window.addAirdropPoints(500, 'Прохождение главы PvE');
                        }
                    }
                }

                // Сохраняем isFirstCompletion для передачи в showPvEResult
                window.lastPvEWasFirstCompletion = isFirstCompletion;

                // Проверяем разблокировку скина мага (только при первом прохождении босса-элементаля)
                if (isFirstCompletion && level.type === 'miniboss' && typeof window.unlockSkin === 'function') {
                    // Убийство элементаля открывает скин мага соответствующей стихии
                    const skinMap = {
                        10: 'fire_default',     // Огненный Элементаль → Маг Огня
                        20: 'water_default',    // Водный Элементаль → Маг Воды
                        30: 'wind_default',     // Воздушный Элементаль → Маг Воздуха
                        40: 'earth_default'     // Земной Элементаль → Маг Земли
                    };

                    const skinId = skinMap[window.currentPvELevel];
                    if (skinId) {
                        // Разблокируем скин (await чтобы сохранение завершилось ДО savePlayer ниже)
                        const unlocked = await window.unlockSkin(skinId);
                        if (unlocked) {
                            const skinName = window.SKINS_CONFIG?.[skinId]?.name || 'Новый скин';
                            if (typeof window.addToBattleLog === 'function') {
                                window.addToBattleLog(`✨ Разблокирован скин: ${skinName}!`);
                            }
                            // Сохраняем информацию о разблокированном скине для показа в результате
                            window.lastUnlockedSkin = { id: skinId, name: skinName };
                        }
                    }
                }

                // 🏆 БОНУСНЫЙ ОПЫТ ЗА БОССОВ (только при первом прохождении)
                if (isFirstCompletion && (level.type === 'miniboss' || level.type === 'finalboss')) {
                    // Бонус опыта: 100 за первого босса, 200 за второго и т.д.
                    const bossExpBonus = {
                        10: 100,    // Босс 1 - Огненный Элементаль
                        20: 200,    // Босс 2 - Водный Элементаль
                        30: 300,    // Босс 3 - Воздушный Элементаль
                        40: 400,    // Босс 4 - Земной Элементаль
                        50: 500     // Босс 5 - Повелитель Хаоса
                    };

                    const bonusExp = bossExpBonus[window.currentPvELevel];
                    if (bonusExp && typeof window.addExperienceToWizard === 'function') {
                        // Даём бонусный опыт ВСЕМ магам, которые участвовали в бою
                        const participatingWizards = window.playerFormation
                            .map(id => id ? window.playerWizards.find(w => w.id === id) : null)
                            .filter(w => w); // Все маги в формации (даже мёртвые получают опыт за победу)

                        participatingWizards.forEach(wizard => {
                            window.addExperienceToWizard(wizard, bonusExp);
                        });

                        if (typeof window.addToBattleLog === 'function') {
                            window.addToBattleLog(`🏆 Бонус за победу над боссом: +${bonusExp} опыта каждому магу!`);
                        }
                    }
                }
            }
            // НЕ очищаем флаги PvE здесь - они очистятся в блоке показа результата (строки 1107-1108)
        }
        // Старая система приключений (для обратной совместимости)
        else if (window.currentAdventureLevel && !enemyAlive && playerAlive) {
            const level = window.ADVENTURE_LEVELS?.find(l => l.id === window.currentAdventureLevel);
            if (level) {
                // Даём награды
                const aliveWizards = window.playerFormation
                    .map(id => id ? window.playerWizards.find(w => w.id === id) : null)
                    .filter(w => w && w.hp > 0);
                aliveWizards.forEach(wizard => {
                    if (typeof window.addExperienceToWizard === 'function') {
                        window.addExperienceToWizard(wizard, level.reward.exp);
                    }
                });
                // Сохраняем прогресс
                const progress = window.loadAdventureProgress();
                progress[window.currentAdventureLevel] = { completed: true, date: new Date().toISOString() };
                window.saveAdventureProgress(progress);
                // Показываем награды
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🎉 Получено: ${level.reward.exp} опыта, ${level.reward.crystals} кристаллов!`);
                }
            }
            window.currentAdventureLevel = null;
        }

        // ИСПРАВЛЕНО: Сохраняем опыт магов через Supabase вместо localhost
        if (window.userData && window.playerWizards) {
            if (!isPvEBattle) {
                // Для PvP сохраняем всё
                window.userData.wizards = window.playerWizards;
            } else {
                // Для PvE сохраняем ТОЛЬКО опыт и уровень, но не HP и эффекты
                window.playerWizards.forEach(battleWizard => {
                    const originalWizard = window.userData.wizards.find(w => w.id === battleWizard.id);
                    if (originalWizard) {
                        // Обновляем только опыт и уровень (ИСПРАВЛЕНО: используем правильные поля)
                        originalWizard.experience = battleWizard.experience || 0;
                        originalWizard.level = battleWizard.level || 1;
                        originalWizard.exp_to_next = battleWizard.exp_to_next || (typeof window.calculateExpToNext === 'function' ? window.calculateExpToNext(battleWizard.level) : 50);
                    }
                });

                // КРИТИЧЕСКИ ВАЖНО: Сохраняем обновленные данные магов в базу данных
                if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
                    try {
                        await window.dbManager.savePlayer(window.userData);
                    } catch (err) {
                        console.error('❌ Ошибка сохранения опыта магов:', err);
                    }
                }
            }
        }

        // Определяем результат и награды для сохранения
        let battleResult = 'draw';
        let rewards = { exp: 0 };
        let opponentLevel = window.selectedOpponent?.level || 1;
        let ratingChange = 0;

        if (!playerAlive && !enemyAlive) {
            battleResult = 'draw';
        } else if (!playerAlive) {
            battleResult = 'loss';
        } else if (!enemyAlive) {
            battleResult = 'win';
        }

        // Рассчитываем изменение рейтинга ТОЛЬКО ДЛЯ PvP (не для дуэлей)
        const isDuelBattle = window.isDuelBattle || false;
        if (!isPvEBattle && !isDuelBattle && typeof window.calculateRatingChange === 'function') {
            const playerRating = typeof window.userData?.rating === 'number' ? window.userData.rating : 0;
            // Используем реальный рейтинг противника из selectedOpponent
            const opponentRating = typeof window.selectedOpponent?.rating === 'number' ? window.selectedOpponent.rating : 0;

            ratingChange = window.calculateRatingChange(playerRating, opponentRating, battleResult);
        }

        // Триггер события завершения боя ТОЛЬКО ДЛЯ PvP (вызовет немедленное сохранение)
        // Для дуэлей НЕ сохраняем результаты (нет изменений статистики)
        // Флаг ставим ДО await чтобы closeBattleFieldModal не вызвал дубль
        window._battleCompletedHandled = true;
        if (!isPvEBattle && !isDuelBattle && typeof window.onBattleCompleted === 'function') {
            await window.onBattleCompleted(battleResult, rewards, opponentLevel, ratingChange);
        }

        if (window.animationManager) {
            window.animationManager.clearAll();
        }

        if (window.battleInterval) {
            clearInterval(window.battleInterval);
            window.battleInterval = null;
        }

        if (typeof window.resetWeather === 'function') {
            window.resetWeather();
        }

        if (typeof window.updateBattleField === 'function') {
            window.updateBattleField();
        }

        // Показываем экран результатов боя ТОЛЬКО ДЛЯ PvP
        if (!isPvEBattle && typeof window.showBattleResult === 'function') {
            const opponent = window.selectedOpponent || {};

            // Используем результаты из новой системы XP (включает урон, лечение, убийства)
            const wizardExpGained = window.lastBattleExpResults || [];

            const battleData = {
                opponentName: opponent.username || 'Противник',
                opponentRating: typeof opponent.rating === 'number' ? opponent.rating : 0,
                ratingChange: ratingChange,
                rewards: rewards,
                battleDuration: 0, // TODO: добавить таймер боя если нужно
                earlyExit: window.battleEarlyExit || false, // Флаг досрочного выхода
                wizardExpGained: wizardExpGained, // Прирост опыта магов
                isDuel: window.isDuelBattle || false // Флаг дуэли (для показа кнопки "Дуэль" вместо "В бой")
            };

            // Показываем с небольшой задержкой для визуального эффекта (или без задержки при earlyExit)
            const delay = window.battleEarlyExit ? 0 : 1000;
            (window.battleTimeout || setTimeout)(() => {
                window.showBattleResult(battleResult, battleData);
                // Сбрасываем флаги после показа
                window.battleEarlyExit = false;
                window.isDuelBattle = false;
            }, delay);
        }

        // === ИВЕНТ БОСС: Отдельная обработка ===
        if (window.isEventBossBattle) {
            // Считаем нанесённый урон боссу (hpDamage для HP, ratingDamage для лидерборда)
            const bossDamageResult = typeof window.calculateEventBossDamage === 'function'
                ? window.calculateEventBossDamage() : { hpDamage: 0, ratingDamage: 0 };
            const eventBossHpDamage = bossDamageResult.hpDamage || 0;
            const eventBossRatingDamage = bossDamageResult.ratingDamage || 0;

            console.log(`🐉 Ивент Босс: HP урон = ${eventBossHpDamage}, рейтинг = ${eventBossRatingDamage}`);

            // Опыт магов
            const wizardExpGained = window.lastBattleExpResults || [];
            window.lastPvEWizardExpGained = wizardExpGained;

            // Сохраняем опыт магов в оригинальные данные
            if (window.userData && window.playerWizards) {
                window.playerWizards.forEach(battleWizard => {
                    const originalWizard = window.userData.wizards.find(w => w.id === battleWizard.id);
                    if (originalWizard) {
                        originalWizard.experience = battleWizard.experience || 0;
                        originalWizard.level = battleWizard.level || 1;
                        originalWizard.exp_to_next = battleWizard.exp_to_next || (typeof window.calculateExpToNext === 'function' ? window.calculateExpToNext(battleWizard.level) : 50);
                    }
                });

                if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
                    try {
                        await window.dbManager.savePlayer(window.userData);
                    } catch (err) {
                        console.error('❌ Ошибка сохранения опыта после ивент босса:', err);
                    }
                }
            }

            // Показываем результат ивент босса с задержкой
            (window.battleTimeout || setTimeout)(async () => {
                // Очищаем флаги PvE
                window.isPvEBattle = false;
                window.currentPvELevel = null;
                window.battleEarlyExit = false;

                // Показываем окно результата ивент босса
                if (typeof window.showEventBossResult === 'function') {
                    await window.showEventBossResult(battleResult, eventBossHpDamage, eventBossRatingDamage);
                } else {
                    alert(`Урон по боссу: ${eventBossRatingDamage}`);
                    if (typeof window.returnToCity === 'function') {
                        window.returnToCity();
                    }
                }
            }, 1000);

            return true;
        }

        // Для PvE показываем красивое окно результата (теперь как в PvP)
        if (isPvEBattle) {
            const currentLevel = window.currentPvELevel;
            const level = window.CHAPTER_1_LEVELS?.find(l => l.id === currentLevel);
            const levelName = level?.name || `Уровень ${currentLevel}`;

            // Используем результаты из новой системы XP (включает урон, лечение, убийства)
            const wizardExpGained = window.lastBattleExpResults || [];
            // Сохраняем для отображения
            window.lastPvEWizardExpGained = wizardExpGained;

            // PvE прогресс уже сохранён выше (строки 1552-1573) в правильном формате
            // { chapter1: { maxLevel, completed: { levelId: true } } }
            // Дублирующее сохранение удалено — оно перезаписывало прогресс в неправильном формате

            // Формируем данные для окна результата (как в PvP)
            const battleData = {
                opponentName: levelName,
                opponentRating: level?.difficulty || 0,
                ratingChange: 0, // В PvE нет рейтинга
                rewards: {},
                battleDuration: 0,
                earlyExit: window.battleEarlyExit || false,
                wizardExpGained: wizardExpGained,
                isPvE: true, // Флаг для особой обработки
                pveLevel: currentLevel,
                pveReward: level?.reward || 0,
                isFirstCompletion: window.lastPvEWasFirstCompletion ?? false
            };

            // Показываем результат с небольшой задержкой (1 сек)
            (window.battleTimeout || setTimeout)(() => {
                // Очищаем флаги PvE
                window.isPvEBattle = false;
                window.currentPvELevel = null;
                window.battleEarlyExit = false;

                // Показываем окно результата в стиле арены
                if (typeof window.showArenaResult === 'function') {
                    window.showArenaResult(battleResult, battleData);
                } else if (typeof window.showPvEResult === 'function') {
                    // Fallback на старое окно PvE
                    window.showPvEResult(battleResult, currentLevel);
                } else {
                    // Fallback на alert
                    if (battleResult === 'win') {
                        alert('🎉 Победа!');
                    } else {
                        alert('💀 Поражение!');
                    }
                    if (typeof window.returnToCity === 'function') {
                        window.returnToCity();
                    }
                }
            }, 1000);
        }

        return true;
    }
    return false;
}

// --- Вспомогательная функция: найти заклинание в userData.spells ---
function findSpellInUserData(spellId, userSpells) {
    if (!userSpells) return null;
    for (const faction in userSpells) {
        if (faction !== 'hybrid' && userSpells[faction][spellId]) {
            return userSpells[faction][spellId];
        }
    }
    if (userSpells.hybrid && userSpells.hybrid[spellId]) {
        return userSpells.hybrid[spellId];
    }
    return null;
}

// --- Создание объекта spellLevels из списка заклинаний мага и данных spells ---
function buildSpellLevels(wizardSpells, spellsData) {
    const levels = {};
    if (!wizardSpells || !Array.isArray(wizardSpells)) return levels;

    for (const spellId of wizardSpells) {
        if (!spellId) continue;
        const spellData = findSpellInUserData(spellId, spellsData);
        levels[spellId] = spellData?.level || 1;
    }
    return levels;
}
window.buildSpellLevels = buildSpellLevels;

function applyLeafCanopyEffect(wizard, level) {
    // Определяем количество целей
    let targetCount = 1;
    if (level >= 3) targetCount = 3;
    if (level >= 5) targetCount = 'all';

    // ИСПРАВЛЕНО: Более точное определение команды
    let isPlayerWizard = window.playerWizards.some(w => w.id === wizard.id);
    let casterType = 'player';

    // Проверяем врагов по id
    if (!isPlayerWizard && wizard.id && wizard.id.startsWith('enemy_')) {
        isPlayerWizard = false;
        casterType = 'enemy';
    }

    // Получаем список союзных магов
    const allies = casterType === 'player' ? 
        (window.playerWizards || []).filter(w => w.hp > 0) :
        (window.enemyWizards || []).filter(w => w.hp > 0);

    if (allies.length === 0) return;

    // Выбираем цели
    let targets = [];
    if (targetCount === 'all') {
        targets = [...allies];
    } else {
        const shuffled = [...allies].sort(() => 0.5 - Math.random());
        targets = shuffled.slice(0, Math.min(targetCount, shuffled.length));
    }

    // Применяем регенерацию
    targets.forEach(target => {
        if (!target.effects) target.effects = {};
        if (target.effects.leaf_canopy) {
            delete target.effects.leaf_canopy;
        }
        target.effects.leaf_canopy = {
            amount: Math.floor(target.max_hp * 0.05),
            applied: true
        };
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌃 ${target.name} получает регенерацию (${target.effects.leaf_canopy.amount} HP в ход) от Покрова листвы`);
        }
    });

    // АНИМАЦИЯ - с исправленным определением casterType
    (window.battleTimeout || setTimeout)(() => {
        if (window.spellAnimations?.leaf_canopy?.play) {
            const targetWizardsData = targets.map(target => {
                const isPlayerWizard = window.playerWizards.some(w => w.id === wizard.id);
                const casterType = isPlayerWizard ? 'player' : 'enemy';
                const position = casterType === 'player' ? 
                    window.playerFormation.findIndex(id => id === target.id) :
                    window.enemyFormation.findIndex(w => w && w.id === target.id);
                return {
                    wizard: target,
                    position: position,
                    casterType: casterType
                };
            });
            window.spellAnimations.leaf_canopy.play({
                targetWizards: targetWizardsData,
                level: level
            });
        }
    }, 1000); // Задержка 1 секунда для инициализации графики
}

function applyMeteorokinesisEffect(wizard, level) {
    const damageBonus = level <= 2 ? 5 : level === 3 ? 10 : 15;
    const setsClearWeather = level >= 4; // На 4-5 уровне устанавливает ясную погоду
    const isPlayerWizard = window.playerWizards.some(w => w.id === wizard.id);
    const casterType = isPlayerWizard ? 'player' : 'enemy';

    const meteorokinesis = {
        id: `meteorokinesis_${wizard.id}`,
        casterId: wizard.id,
        casterName: wizard.name,
        casterType: casterType,
        level: level,
        damageBonus: damageBonus,
        setsClearWeather: setsClearWeather,
        isActive: true,
        casterActionsCount: 0,
        weatherRestored: false
    };

    if (!window.activeMeteorokinesis) window.activeMeteorokinesis = [];
    window.activeMeteorokinesis = window.activeMeteorokinesis.filter(m => m.casterId !== wizard.id);
    window.activeMeteorokinesis.push(meteorokinesis);

    // Устанавливаем ясную погоду на 4-5 уровне
    if (setsClearWeather && window.currentWeather) {
        window.originalWeather = window.currentWeather;
        window.currentWeather = 'clear';
    }

    (window.battleTimeout || setTimeout)(() => {
        if (window.spellAnimations?.meteorokinesis?.show) {
            window.spellAnimations.meteorokinesis.show(casterType, level, wizard);
        }
    }, 1000);

    if (typeof window.addToBattleLog === 'function') {
        const weatherEffect = setsClearWeather ? 
            (level === 4 ? ', устанавливает ясную погоду на 2 хода' : ', устанавливает ясную погоду до конца боя') : '';
        window.addToBattleLog(`🌦 ${wizard.name} активирует Метеокинез! +${damageBonus}% к стихийным заклинаниям магов Природы${weatherEffect}`);
    }
}

function removeDeadSummons() {
    // Используем новый менеджер
    if (window.summonsManager) {
        window.summonsManager.cleanupDead();
        return;
    }

    // Fallback на старую систему если менеджер не загружен
    if (!window.activeSummons) return;
    for (let i = window.activeSummons.length - 1; i >= 0; i--) {
        const summon = window.activeSummons[i];
        if (summon.hp <= 0) {
            if (summon.type === 'nature_wolf' && summon.id) {
                if (window.spellAnimations?.call_wolf?.clear) {
                    window.spellAnimations.call_wolf.clear(summon.id);
                }
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`💀 ${summon.name} погиб`);
                }
            }
            window.activeSummons.splice(i, 1);
        }
    }
}

function applyAbsoluteZeroEffect(wizard, level, casterType) {
    // Проверяем что level - это число
    if (typeof level !== 'number' || level < 1 || level > 5) {
        console.error(`❄️ Неверный уровень для Абсолютного Холода: ${level}`);
        return;
    }

    // Параметры по уровням
    const damage = [15, 25, 35, 45, 60][level - 1] || 15;
    const interruptChance = [5, 7, 9, 11, 15][level - 1] || 5;

    // Создаём зону Абсолютного Холода
    if (typeof window.createOrUpdateAbsoluteZeroZone === 'function') {
        window.createOrUpdateAbsoluteZeroZone(wizard.id, casterType, damage, interruptChance, level);
    } else {
        console.error('❄️ Функция createOrUpdateAbsoluteZeroZone не найдена');
    }

    // 🔥 ВИЗУАЛЬНАЯ АНИМАЦИЯ - с задержкой для инициализации
    (window.battleTimeout || setTimeout)(() => {
        if (window.spellAnimations?.absolute_zero?.create) {
            window.spellAnimations.absolute_zero.create({
                casterId: wizard.id,
                casterType: casterType,
                level: level
            });
        }
    }, 1500);

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`❄️ ${wizard.name} окружает территорию врага Абсолютным Холодом (${damage} урона/ход, ${interruptChance}% прерывание)`);
    }
}

// Глобальный экспорт функций (в конце файла core.js)
// ВАЖНО: Переменные состояния боя (playerFormation, enemyFormation, etc.)
// инициализируются в startBattle() и НЕ экспортируются здесь повторно,
// чтобы не перезаписать актуальные значения пустыми начальными значениями модуля
window.showBattleField = showBattleField;
window.generateEnemyFormation = generateEnemyFormation;
window.cleanupOldWalls = cleanupOldWalls;
window.startBattle = startBattle;
window.initializeWizardHealth = initializeWizardHealth;
window.executeBattlePhase = executeBattlePhase;
window.executePlayerPhase = executePlayerPhase;
window.executeEnemyPhase = executeEnemyPhase;
window.checkBattleEnd = checkBattleEnd;
window.findSpellInUserData = findSpellInUserData;
window.applyLeafCanopyEffect = applyLeafCanopyEffect;
window.executeSingleMageAttack = executeSingleMageAttack;
window.processBlessingRegeneration = processBlessingRegeneration;
window.removeDeadSummons = removeDeadSummons;
window.applyMeteorokinesisEffect = applyMeteorokinesisEffect;
window.applyAbsoluteZeroEffect = applyAbsoluteZeroEffect;
window.executeBossBattlePhase = executeBossBattlePhase;