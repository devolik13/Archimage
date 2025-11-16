// battle/core.js - Основная логика боя (с интеграцией благословений)...
console.log('✅ battle/core.js загружен');

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
    console.log('⚔️ showBattleField called');

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
        console.log('📦 Загрузка расстановки из userData:', window.userData.formation);
        window.playerFormation = window.userData.formation || [null, null, null, null, null];
        window.playerWizards = window.userData.wizards || [];
        console.log('⚔️ Расстановка игрока:', window.playerFormation);
        console.log('🧙 Маги игрока:', window.playerWizards.length);

        // Генерация расстановки противника
        generateEnemyFormation();

        // Создаём UI и контейнер для PixiJS
        if (typeof window.renderBattleField === 'function') {
            window.renderBattleField();
        }

        // Начало боя
        startBattle();
    } catch (error) {
        console.error('❌ Ошибка загрузки расстановки:', error);
        alert('Ошибка загрузки расстановки');
    }
}

function generateEnemyFormation() {
    console.log('🤖 Генерация расстановки противника');
    window.enemyFormation = [null, null, null, null, null];
    const playerWizardsCopy = [...window.playerWizards];
    if (playerWizardsCopy.length > 0) {
        for (let i = 0; i < Math.min(3, playerWizardsCopy.length); i++) {
            if (window.playerFormation[i]) {
                const playerWizard = playerWizardsCopy.find(w => w.id === window.playerFormation[i]);
                if (playerWizard) {
                    window.enemyFormation[i] = {
                        ...playerWizard,
                        id: `enemy_${playerWizard.id}`,
                        name: `Тень ${playerWizard.name}`,
                        spells: playerWizard.spells, // ВАЖНО: копируем заклинания
                        hp: playerWizard.hp,
                        max_hp: playerWizard.max_hp,
                        armor: playerWizard.armor,
                        max_armor: playerWizard.max_armor,
                        effects: {}
                    };
                    console.log('Враг создан:', {
                        name: window.enemyFormation[i].name,
                        spells: window.enemyFormation[i].spells
                    });
                }
            }
        }
    }
    window.enemyWizards = window.enemyFormation.filter(w => w !== null);
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
    console.log('🧱 Очистка устаревших стен завершена');
}

// --- Начало боя ---
function startBattle() {
    console.log('🔥 Начало боя');
    window.battleState = 'active';
    window.battleLog = [];
    window.playerMageIndex = 0;
    window.enemyMageIndex = 0;
    window.globalTurnCounter = 0;
    window.isVeryFirstTurn = true;
    window.currentTurn = 'player';
    window.isPaused = false;
    window.battleSpeed = 2000;

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

    if (window.spellAnimations?.fire_tsunami?.clearAll) {
        window.spellAnimations.fire_tsunami.clearAll();
    }

    // Инициализация систем
    if (typeof window.initializeWeatherForBattle === 'function') {
        window.initializeWeatherForBattle();
    }
    if (typeof window.setWeatherDisplay === 'function') {
        setTimeout(() => {
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
    console.log('🔄 Интервал боя запущен');
}

// Инициализация здоровья магов
function initializeWizardHealth() {
    window.playerWizards.forEach(wizard => {
        if (!wizard.original_hp) {
            wizard.original_hp = wizard.hp;
            wizard.original_max_hp = wizard.max_hp;
        }
        wizard.hp = wizard.original_hp;
        wizard.max_hp = wizard.original_max_hp;
        wizard.effects = {};
        wizard.armorBonus = 0;
        wizard.armorBonuses = {};
        wizard.spellDamageMultiplier = undefined;
        wizard.isStunned = false;
        wizard.stunTurns = 0;
        wizard.stoneGrottoBonus = undefined;

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
        }

        // И ТОЛЬКО ПОТОМ применяем бонус от Башни магов
        let healthMultiplier = 1.0;
        if (typeof window.applyWizardTowerHealthBonus === 'function') {
            healthMultiplier = window.applyWizardTowerHealthBonus();
            wizard.max_hp = Math.floor(wizard.max_hp * healthMultiplier);
            wizard.hp = Math.floor(wizard.hp * healthMultiplier);
        }
        if (healthMultiplier > 1.0) {
            console.log(`🏰 Башня магов ур.${window.getBuildingLevel('wizard_tower')}: HP ${wizard.original_hp} → ${wizard.hp}`);
        }

        // НОВОЕ: Применение эффектов благословений
        if (wizard.blessingEffects) {
            console.log(`🙏 Применение благословений к ${wizard.name}:`, wizard.blessingEffects);

            // Бонус брони
            if (wizard.blessingEffects.armorBonus) {
                wizard.armorBonus = (wizard.armorBonus || 0) + wizard.blessingEffects.armorBonus;
                console.log(`🙏 Благословение: +${wizard.blessingEffects.armorBonus} брони для ${wizard.name} (итого: ${wizard.armor + wizard.armorBonus})`);
            }

            // Множитель здоровья
            if (wizard.blessingEffects.healthMultiplier && wizard.blessingEffects.healthMultiplier > 1) {
                const oldMaxHp = wizard.max_hp;
                const oldHp = wizard.hp;
                wizard.max_hp = Math.floor(wizard.max_hp * wizard.blessingEffects.healthMultiplier);
                wizard.hp = Math.floor(wizard.hp * wizard.blessingEffects.healthMultiplier);
                console.log(`🙏 Благословение: HP ×${wizard.blessingEffects.healthMultiplier} для ${wizard.name} (${oldHp}/${oldMaxHp} → ${wizard.hp}/${wizard.max_hp})`);
            }

            // Регенерация
            if (wizard.blessingEffects.regeneration) {
                if (!wizard.effects) wizard.effects = {};
                wizard.effects.blessing_regeneration = {
                    amount: Math.floor(wizard.max_hp * wizard.blessingEffects.regeneration),
                    source: 'blessing'
                };
                console.log(`🙏 Благословение: регенерация ${wizard.effects.blessing_regeneration.amount} HP/ход для ${wizard.name}`);
            }
        }

        // Применение "Покрова листвы" (если есть)
        if (wizard.spells && wizard.spells.includes('leaf_canopy')) {
            const spellData = window.findSpellInUserData ? 
                window.findSpellInUserData('leaf_canopy', window.userData?.spells) : null;
            if (spellData && spellData.level > 0) {
                applyLeafCanopyEffect(wizard, spellData.level);
            }
        }

        if (wizard.spells && wizard.spells.includes('meteorokinesis')) {
            const spellData = window.findSpellInUserData ? 
                window.findSpellInUserData('meteorokinesis', window.userData?.spells) : null;
            if (spellData && spellData.level > 0) {
                applyMeteorokinesisEffect(wizard, spellData.level);
            }
        }

        if (wizard.spells && wizard.spells.includes('absolute_zero')) {
            const spellData = window.findSpellInUserData ? 
                window.findSpellInUserData('absolute_zero', window.userData?.spells) : null;
            if (spellData && spellData.level > 0) {
                const level = spellData.level || 1; // 🔥 ИСПРАВЛЕНО: извлекаем число
                applyAbsoluteZeroEffect(wizard, level, 'player');
            }
        }

        if (wizard.spells && wizard.spells.includes('bark_armor')) {
            const spellData = window.findSpellInUserData ? 
                window.findSpellInUserData('bark_armor', window.userData?.spells) : null;
            if (spellData && spellData.level > 0) {
                // Находим позицию мага
                const position = window.playerFormation.findIndex(id => id === wizard.id);
                if (position !== -1) {
                    window.applyBarkArmorAtStart(wizard, spellData.level, position, 'player');
                }
            }
        }
    });

    // То же самое для врагов
    window.enemyWizards.forEach(wizard => {
        if (!wizard.original_hp) {
            wizard.original_hp = wizard.hp;
            wizard.original_max_hp = wizard.max_hp;
        }
        wizard.hp = wizard.original_hp;
        wizard.max_hp = wizard.original_max_hp;

        // Враги тоже получают бонус от Башни магов (для баланса)
        let healthMultiplier = 1.0;
        if (typeof window.applyWizardTowerHealthBonus === 'function') {
            healthMultiplier = window.applyWizardTowerHealthBonus();
            wizard.max_hp = Math.floor(wizard.original_max_hp * healthMultiplier);
            wizard.hp = Math.floor(wizard.original_hp * healthMultiplier);
        }

        wizard.effects = {};
        wizard.armorBonus = 0;
        wizard.isStunned = false;
        wizard.spellDamageMultiplier = undefined;
        wizard.stunTurns = 0;
        wizard.stoneGrottoBonus = undefined;

        // Инициализация сопротивления магии
        if (typeof window.getWizardResistances === 'function') {
            wizard.magicResistance = window.getWizardResistances(wizard);
        }

        if (wizard.spells && wizard.spells.includes('leaf_canopy')) {
            // Для врагов используем уровень 1 по умолчанию или копируем с игрока
            let level = 1;
            // Попробуем найти оригинального мага игрока
            const originalId = wizard.id.replace('enemy_', '');
            const originalWizard = window.playerWizards.find(w => w.id === originalId);
            if (originalWizard && originalWizard.spells) {
                const spellData = window.findSpellInUserData ? 
                    window.findSpellInUserData('leaf_canopy', window.userData?.spells) : null;
                if (spellData) level = spellData.level;
            }
            applyLeafCanopyEffect(wizard, level);
        }

        if (wizard.spells && wizard.spells.includes('absolute_zero')) {
            let level = 1;
            const originalId = wizard.id.replace('enemy_', '');
            const originalWizard = window.playerWizards.find(w => w.id === originalId);
            if (originalWizard && originalWizard.spells) {
                const spellData = window.findSpellInUserData ? 
                    window.findSpellInUserData('absolute_zero', window.userData?.spells) : null;
                if (spellData && spellData.level) level = spellData.level;
            }
            applyAbsoluteZeroEffect(wizard, level, 'enemy');
        }
    });

    window.playerFormation.forEach((wizardId, index) => {
        if (wizardId) {
            const wizard = window.playerWizards.find(w => w.id === wizardId);
            if (wizard) wizard.effects = wizard.effects || {};
        }
    });

    window.enemyFormation.forEach((wizard, index) => {
        if (wizard) wizard.effects = wizard.effects || {};
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

function executeBattlePhase() {
    console.log('🔄 executeBattlePhase called');
    if (window.battleState !== 'active' || window.isPaused) {
        return;
    }

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

    // Логика ходов зависит от того, кто атакует
    if (window.globalTurnCounter === 0) {
        // Первый ход - 1 маг атакующего
        if (window.isPlayerAttacker) {
            console.log('🎯 Первый ход: Игрок атакует (1 маг)');
            executePlayerPhase(1);
        } else {
            console.log('🤖 Первый ход: Враг атакует (1 маг)');
            executeEnemyPhase(1);
        }
    } else {
        // Дальше чередуем по 2 мага
        if (window.globalTurnCounter % 2 === 1) {
            // Нечётные ходы - защищающийся
            if (window.isPlayerAttacker) {
                executeEnemyPhase(2);  // Враг защищается
            } else {
                executePlayerPhase(2);  // Игрок защищается
            }
        } else {
            // Чётные ходы - атакующий
            if (window.isPlayerAttacker) {
                executePlayerPhase(2);  // Игрок атакует
            } else {
                executeEnemyPhase(2);   // Враг атакует
            }
        }
    }

    window.globalTurnCounter++;
    checkBattleEnd();

    if (typeof window.updateBattleField === 'function') {
        window.updateBattleField();
    }
}

function executeSingleMageAttack(wizard, position, casterType) {
    // Логирование начала хода
    if (window.battleLogger) {
        window.battleLogger.logTurnStart(casterType, wizard, position);
    }

    // ☠️ ОБРАБОТКА УРОНА ОТ ЯДА В НАЧАЛЕ ХОДА МАГА
    if (wizard.effects && wizard.effects.poison && wizard.effects.poison.stacks > 0) {
        const poisonDamage = wizard.effects.poison.stacks * (wizard.effects.poison.damagePerStack || 5);
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
                        // Проверяем конец боя после атаки волка
                        if (checkBattleEnd()) {
                            return false; // Прерываем дальше
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

    // ИСПОЛЬЗОВАНИЕ ЗАКЛИНАНИЙ
    if (typeof window.useWizardSpells === 'function') {
        window.useWizardSpells(wizard, position, casterType);
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

    return true;
}

// --- Фаза игрока ---
function executePlayerPhase(mageCount) {
    console.log(`⚔️ Игрок использует заклинания ${mageCount} магом(ами)`);
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
                console.log(`   Добавлен ${wizard.name} с позиции ${currentPos}`);
            }
        }
        currentPos = (currentPos + 1) % 5;
        positionsChecked++;
    }

    // Атакуем
    magesToAttack.forEach((mageData, index) => {
        setTimeout(() => {
            if (mageData.wizard.hp > 0) {
                executeSingleMageAttack(mageData.wizard, mageData.position, 'player');
            }
        }, index * 1500);
    });

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
    console.log(`   Новый playerMageIndex: ${window.playerMageIndex}`);

    // Проверка на Метеокинез
    setTimeout(() => {
        if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
            window.checkMeteorokinesisCasterAlive();
        }
    }, magesToAttack.length * 500);
}

// --- Фаза противника ---
function executeEnemyPhase(mageCount) {
    console.log(`🤖 Противник использует заклинания ${mageCount} магом(ами)`);
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
            console.log(`   Добавлен ${wizard.name} с позиции ${currentPos}`);
        }
        currentPos = (currentPos + 1) % 5;
        positionsChecked++;
    }

    // Атакуем
    magesToAttack.forEach((mageData, index) => {
        setTimeout(() => {
            if (mageData.wizard.hp > 0) {
                executeSingleMageAttack(mageData.wizard, mageData.position, 'enemy');
            }
        }, index * 1500);
    });

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
    console.log(`   Новый enemyMageIndex: ${window.enemyMageIndex}`);

    // Проверка на Метеокинез
    setTimeout(() => {
        if (typeof window.checkMeteorokinesisCasterAlive === 'function') {
            window.checkMeteorokinesisCasterAlive();
        }
    }, magesToAttack.length * 500);
}

// --- Проверка окончания боя ---
function checkBattleEnd() {
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
            console.log('⏹️ Боевой интервал остановлен (бой завершён)');
        }

        // Останавливаем через battle-timer-manager если используется
        if (window.battleTimerManager && window.battleTimerManager.stopBattleLoop) {
            window.battleTimerManager.stopBattleLoop();
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
        console.log(resultLog);

        if (!playerAlive) {
            // Враги победили - даём им опыт
            if (typeof window.grantVictoryExp === 'function') {
                const aliveEnemies = window.enemyFormation.filter(w => w && w.hp > 0);
                window.grantVictoryExp(aliveEnemies);
            }
        } else if (!enemyAlive) {
            // Игрок победил - даём опыт его магам
            if (typeof window.grantVictoryExp === 'function') {
                const aliveWizards = window.playerFormation
                    .map(id => id ? window.playerWizards.find(w => w.id === id) : null)
                    .filter(w => w && w.hp > 0);
                window.grantVictoryExp(aliveWizards);
            }
        }

        // Если это приключение и игрок победил
        if (window.currentAdventureLevel && !enemyAlive && playerAlive) {
            const level = window.ADVENTURE_LEVELS.find(l => l.id === window.currentAdventureLevel);
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
            window.userData.wizards = window.playerWizards;
        }

        // Определяем результат и награды для сохранения
        let battleResult = 'draw';
        let rewards = { exp: 0 };
        let opponentLevel = 1; // TODO: получить уровень противника

        if (!playerAlive && !enemyAlive) {
            battleResult = 'draw';
        } else if (!playerAlive) {
            battleResult = 'loss';
        } else if (!enemyAlive) {
            battleResult = 'win';
            // TODO: посчитать полученный опыт и другие награды
        }

        // Триггер события завершения боя (вызовет немедленное сохранение)
        if (typeof window.onBattleCompleted === 'function') {
            window.onBattleCompleted(battleResult, rewards, opponentLevel);
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
    setTimeout(() => {
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
            console.log('🌃 Отложенный вызов анимации, контейнер:', !!window.pixiCore?.getEffectsContainer());
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
        const duration = level === 4 ? 'на 2 хода' : 'до конца боя';
        console.log(`🌦 Метеокинез ${level} уровня: установлена ясная погода ${duration}`);
    }

    setTimeout(() => {
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
        const removedCount = window.summonsManager.cleanupDead();
        if (removedCount > 0) {
            console.log(`🧹 Удалено мёртвых существ: ${removedCount}`);
        }
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

    console.log(`❄️ Применение Абсолютного Холода для ${wizard.name} (${casterType}), уровень ${level}, урон ${damage}`);

    // 🔥 ПАТТЕРН ОГНЕННОЙ СТЕНЫ: Создаём зону в walls.js с автоудалением старой
    if (typeof window.createOrUpdateAbsoluteZeroZone === 'function') {
        window.createOrUpdateAbsoluteZeroZone(wizard.id, casterType, damage, interruptChance, level);
    } else {
        console.error('❄️ Функция createOrUpdateAbsoluteZeroZone не найдена');
    }

    // 🔥 ВИЗУАЛЬНАЯ АНИМАЦИЯ - с задержкой для инициализации
    setTimeout(() => {
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

// Глобальный экспорт (в конце файла core.js)
window.showBattleField = showBattleField;
window.playerFormation = playerFormation;
window.enemyFormation = enemyFormation;
window.playerWizards = playerWizards;
window.enemyWizards = enemyWizards;
window.battleState = battleState;
window.currentPhase = currentPhase;
window.currentPlayerTurn = currentPlayerTurn;
window.battleLog = battleLog;
window.battleInterval = battleInterval;
window.playerMageIndex = playerMageIndex;
window.enemyMageIndex = enemyMageIndex;
window.isPaused = isPaused;
window.battleSpeed = battleSpeed;
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