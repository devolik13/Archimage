// battle/demo-battle.js - Демонстрационный бой с драконом (PIXI.js)
console.log('🐉 demo-battle.js загружен');

// Конфигурация демо-боя
const DEMO_CONFIG = {
    dragonHP: 500,
    dragonMaxHP: 500,
    wizardHP: 120,
    wizardMaxHP: 120,
    turnDelay: 1600, // Задержка между заклинаниями (ускорено на 20%)
    fadeOutDuration: 2000 // Длительность затемнения при победе
};

// Данные демо-боя
let demoBattleData = {
    dragon: null,
    wizards: [],
    isRunning: false,
    currentTurn: 0,
    wizardPositions: [1, 2, 3], // Ряды для 3 магов
    dragonSpells: ['fireball', 'blizzard', 'fire_wall'], // Tier 5, 4, 3
    wizardSpells: [
        ['spark', 'firebolt'],      // Маг 1: Огонь
        ['icicle', 'frost_arrow'],  // Маг 2: Вода
        ['gust', 'wind_blade']      // Маг 3: Ветер
    ]
};

// Запуск демо-боя
async function startDemoBattle(faction) {
    console.log('🐉 Запуск демо-боя для фракции:', faction);

    // Показываем overlay
    showDemoBattleOverlay();

    // Инициализируем PIXI поле боя 6×5
    await initDemoPixiBattle();

    // Небольшая задержка для инициализации контейнеров
    await new Promise(resolve => setTimeout(resolve, 300));

    // Создаём дракона (3×3 клетки)
    console.log('🐉 Создаём дракона...');
    const dragon = await window.pixiDragon.create();
    if (!dragon) {
        console.error('❌ Не удалось создать дракона');
        closeDemoBattle();
        return;
    }

    demoBattleData.dragon = dragon;
    console.log('✅ Дракон создан:', dragon);

    // Создаём 3 магов
    await createDemoWizards(faction);

    // Запускаем боевой цикл
    demoBattleData.isRunning = true;
    demoBattleData.currentTurn = 0;

    setTimeout(() => {
        executeDemoBattle();
    }, 1000);
}

// Инициализация PIXI поля боя
async function initDemoPixiBattle() {
    if (!window.pixiCore) {
        console.error('❌ PIXI Core не загружен');
        return;
    }

    // Очищаем предыдущее поле если было
    if (window.pixiCore.destroy) {
        window.pixiCore.destroy();
    }

    // Создаём временные формации для PIXI Core (пустые массивы)
    window.enemyFormation = [];
    window.playerFormation = [];

    // Инициализируем новое поле 6×5
    await window.pixiCore.init();
    console.log('✅ PIXI поле боя инициализировано');
}

// Создание демо-магов
async function createDemoWizards(faction) {
    const factions = ['fire', 'water', 'wind']; // 3 разные фракции
    const names = ['Маг Огня', 'Маг Воды', 'Маг Ветра'];

    for (let i = 0; i < 3; i++) {
        const wizardData = {
            id: `demo_wizard_${i}`,
            name: names[i],
            faction: factions[i],
            hp: DEMO_CONFIG.wizardHP,
            max_hp: DEMO_CONFIG.wizardMaxHP,
            level: 1
        };

        // Создаём спрайт мага в правой колонке (col=5)
        const position = demoBattleData.wizardPositions[i];
        const wizard = await window.pixiWizards.createWizard(
            wizardData,
            5, // колонка
            position, // ряд
            'player'
        );

        if (wizard) {
            wizard.data = wizardData;
            wizard.spells = demoBattleData.wizardSpells[i];
            demoBattleData.wizards.push(wizard);
            console.log(`✅ Маг ${i + 1} создан:`, wizardData.name);
        }
    }
}

// Основной цикл боя
function executeDemoBattle() {
    if (!demoBattleData.isRunning) return;

    const turn = demoBattleData.currentTurn;

    // Проверка условий победы
    if (demoBattleData.dragon.hp <= 0) {
        endDemoBattle('wizards');
        return;
    }

    const aliveWizards = demoBattleData.wizards.filter(w => w.data.hp > 0);
    if (aliveWizards.length === 0) {
        endDemoBattle('dragon');
        return;
    }

    // Макс 15 ходов для демо
    if (turn >= 15) {
        endDemoBattle('draw');
        return;
    }

    logMessage(`🎭 Ход ${turn + 1}`);

    // Сначала ходят маги (каждый кастует 2 заклинания)
    executeWizardsTurn(() => {
        // Потом ходит дракон (3 заклинания)
        setTimeout(() => {
            executeDragonTurn(() => {
                // Следующий ход
                demoBattleData.currentTurn++;
                setTimeout(() => {
                    executeDemoBattle();
                }, DEMO_CONFIG.turnDelay);
            });
        }, DEMO_CONFIG.turnDelay);
    });
}

// Ход магов
function executeWizardsTurn(callback) {
    const aliveWizards = demoBattleData.wizards.filter(w => w.data.hp > 0);

    if (aliveWizards.length === 0) {
        if (callback) callback();
        return;
    }

    let wizardIndex = 0;

    function castNextWizard() {
        if (wizardIndex >= aliveWizards.length) {
            if (callback) callback();
            return;
        }

        const wizard = aliveWizards[wizardIndex];
        const spells = wizard.spells;

        // Каждый маг кастует 2 заклинания
        castWizardSpell(wizard, spells[0], () => {
            setTimeout(() => {
                castWizardSpell(wizard, spells[1], () => {
                    wizardIndex++;
                    setTimeout(castNextWizard, DEMO_CONFIG.turnDelay);
                });
            }, DEMO_CONFIG.turnDelay);
        });
    }

    castNextWizard();
}

// Каст заклинания магом
function castWizardSpell(wizard, spellId, callback) {
    if (!wizard || wizard.data.hp <= 0) {
        if (callback) callback();
        return;
    }

    try {
        // Анимация каста мага
        if (window.pixiWizards.playCastAnimation) {
            window.pixiWizards.playCastAnimation(wizard.sprite);
        }

        // Урон дракону
        const damage = Math.floor(8 + Math.random() * 12); // 8-20 урона
        demoBattleData.dragon.hp = Math.max(0, demoBattleData.dragon.hp - damage);

        logMessage(`🧙‍♂️ ${wizard.data.name} кастует ${getSpellName(spellId)} (${damage} урона) | Дракон: ${demoBattleData.dragon.hp}/${DEMO_CONFIG.dragonMaxHP} HP`);

        // Обновляем HP дракона
        window.pixiDragon.updateHP(demoBattleData.dragon.hp, DEMO_CONFIG.dragonMaxHP);

        // Таймаут для безопасности - если анимация не завершится, продолжаем бой
        let callbackCalled = false;
        const safeCallback = () => {
            if (!callbackCalled) {
                callbackCalled = true;
                if (callback) callback();
            }
        };

        setTimeout(safeCallback, 3000); // Максимум 3 секунды на анимацию

        // Анимация заклинания на дракона
        playSpellAnimation(spellId, wizard, 'dragon', safeCallback);
    } catch (error) {
        console.error(`❌ Ошибка при касте ${spellId}:`, error);
        if (callback) callback();
    }
}

// Ход дракона
function executeDragonTurn(callback) {
    if (demoBattleData.dragon.hp <= 0) {
        if (callback) callback();
        return;
    }

    const spells = demoBattleData.dragonSpells;
    let spellIndex = 0;

    function castNextSpell() {
        if (spellIndex >= spells.length) {
            if (callback) callback();
            return;
        }

        const spellId = spells[spellIndex];
        castDragonSpell(spellId, () => {
            spellIndex++;
            setTimeout(castNextSpell, DEMO_CONFIG.turnDelay);
        });
    }

    castNextSpell();
}

// Каст заклинания драконом
function castDragonSpell(spellId, callback) {
    try {
        // Таймаут для безопасности
        let callbackCalled = false;
        const safeCallback = () => {
            if (!callbackCalled) {
                callbackCalled = true;
                if (callback) callback();
            }
        };

        setTimeout(safeCallback, 3000);

        // Анимация атаки дракона
        window.pixiDragon.playAttack(() => {
            // Выбираем случайного живого мага
            const aliveWizards = demoBattleData.wizards.filter(w => w.data.hp > 0);

            if (aliveWizards.length === 0) {
                safeCallback();
                return;
            }

            const target = aliveWizards[Math.floor(Math.random() * aliveWizards.length)];
            const damage = Math.floor(15 + Math.random() * 20); // 15-35 урона

            target.data.hp = Math.max(0, target.data.hp - damage);

            logMessage(`🐉 Дракон использует ${getSpellName(spellId)} на ${target.data.name} (${damage} урона) | ${target.data.name}: ${target.data.hp}/${target.data.max_hp} HP`);

            // Обновляем HP мага
            if (window.pixiWizards.updateWizardHP) {
                window.pixiWizards.updateWizardHP(target, target.data.hp, target.data.max_hp);
            }

            // Проверяем смерть мага
            if (target.data.hp <= 0) {
                logMessage(`💀 ${target.data.name} повержен!`);
                if (window.pixiWizards.playDeathAnimation) {
                    window.pixiWizards.playDeathAnimation(target.sprite);
                }
            }

            // Анимация заклинания
            playSpellAnimation(spellId, null, target, safeCallback);
        });
    } catch (error) {
        console.error(`❌ Ошибка при касте дракона ${spellId}:`, error);
        if (callback) callback();
    }
}

// Проигрывание анимации заклинания
function playSpellAnimation(spellId, caster, target, callback) {
    try {
        if (!window.spellAnimations || !window.spellAnimations[spellId]) {
            console.warn(`⚠️ Анимация для ${spellId} не найдена`);
            if (callback) callback();
            return;
        }

        const animation = window.spellAnimations[spellId];

        // Преобразуем параметры в формат анимаций (casterCol, casterRow, targetCol, targetRow)
        let casterCol, casterRow, targetCol, targetRow;

        if (target === 'dragon') {
            // Маг кастует на дракона
            const wizardIndex = demoBattleData.wizards.indexOf(caster);
            if (wizardIndex === -1) {
                console.error('⚠️ Маг-кастер не найден');
                if (callback) callback();
                return;
            }

            casterCol = 5; // Маги в правой колонке
            casterRow = demoBattleData.wizardPositions[wizardIndex]; // row: 1, 2 или 3
            targetCol = 1; // Дракон в центре (условно col 1)
            targetRow = 1; // Центральная позиция
        } else if (target) {
            // Дракон кастует на мага
            const wizardIndex = demoBattleData.wizards.indexOf(target);
            if (wizardIndex === -1) {
                console.error('⚠️ Маг-цель не найден');
                if (callback) callback();
                return;
            }

            casterCol = 1; // Дракон в центре
            casterRow = 1; // Центральная позиция
            targetCol = 5; // Маг в правой колонке
            targetRow = demoBattleData.wizardPositions[wizardIndex]; // row: 1, 2 или 3
        } else {
            console.error('⚠️ Нет цели для анимации');
            if (callback) callback();
            return;
        }

        console.log(`🎬 Анимация ${spellId}: [${casterCol},${casterRow}] → [${targetCol},${targetRow}]`);

        // Определяем casterType для обратной совместимости
        const casterTypeParam = (target === 'dragon') ? 'player' : 'enemy';

        // Дополнительные параметры для некоторых заклинаний
        const extraParams = {};

        // fire_wall и wind_wall требуют массив позиций
        if (spellId === 'fire_wall' || spellId === 'wind_wall') {
            extraParams.positions = [0, 1, 2, 3, 4]; // Все ряды
            extraParams.casterId = caster ? `wizard_${demoBattleData.wizards.indexOf(caster)}` : 'dragon';
            extraParams.damage = 10;
        }

        animation.play({
            // Новый API (для spark, icicle, etc)
            casterCol: casterCol,
            casterRow: casterRow,
            targetCol: targetCol,
            targetRow: targetRow,
            // Старый API для совместимости (firebolt, wind-blade)
            casterType: casterTypeParam,
            casterPosition: casterRow,
            targetColumn: targetCol,
            initialPosition: casterRow,
            level: 1,
            // Дополнительные параметры
            ...extraParams,
            onComplete: () => {
                try {
                    if (callback) callback();
                } catch (e) {
                    console.error('Ошибка в callback анимации:', e);
                }
            }
        });
    } catch (error) {
        console.error(`❌ Ошибка при проигрывании анимации ${spellId}:`, error);
        if (callback) callback();
    }
}

// Конец демо-боя
function endDemoBattle(winner) {
    demoBattleData.isRunning = false;

    if (winner === 'wizards') {
        logMessage('🎉 НЕВЕРОЯТНО! Маги одолели дракона!', '#66ff66');

        // Анимация смерти дракона
        window.pixiDragon.playDeath(() => {
            fadeToBlackAndClose();
        });
    } else if (winner === 'dragon') {
        logMessage('🐉 Дракон победил! Но вы сражались храбро...', '#ff6666');
        fadeToBlackAndClose();
    } else {
        logMessage('⚔️ Битва окончена!', '#ffaa00');
        fadeToBlackAndClose();
    }
}

// Затемнение и закрытие
function fadeToBlackAndClose() {
    const overlay = document.getElementById('demo-battle-overlay');
    if (!overlay) return;

    setTimeout(() => {
        // Плавное затемнение
        overlay.style.transition = `background ${DEMO_CONFIG.fadeOutDuration}ms`;
        overlay.style.background = 'rgba(0, 0, 0, 1)';

        setTimeout(() => {
            closeDemoBattle();

            // Показываем город
            if (typeof window.showGameArea === 'function') {
                window.showGameArea();
            }
        }, DEMO_CONFIG.fadeOutDuration);
    }, 2000);
}

// Показать overlay демо-боя
function showDemoBattleOverlay() {
    const overlayHTML = `
        <div id="demo-battle-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 20px;
        ">
            <div style="
                background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
                border-radius: 20px;
                padding: 20px;
                max-width: 900px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                border: 2px solid #4a4a6a;
            ">
                <h2 style="color: #ff6b6b; text-align: center; margin: 0 0 15px 0; font-size: 24px;">
                    ⚔️ Испытание Дракона ⚔️
                </h2>

                <!-- PIXI Canvas будет здесь -->
                <div id="pixi-container" style="
                    display: flex;
                    justify-content: center;
                    margin-bottom: 15px;
                "></div>

                <!-- Лог боя -->
                <div id="demo-battle-log" style="
                    background: rgba(0,0,0,0.4);
                    padding: 15px;
                    border-radius: 10px;
                    height: 120px;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    font-size: 13px;
                    color: #ddd;
                ">
                    <div>🎭 Древний дракон пробудился!</div>
                    <div>🧙‍♂️ Маги вступают в бой!</div>
                </div>

                <!-- Кнопки -->
                <div style="text-align: center;">
                    <button onclick="skipDemoBattle()" style="
                        padding: 10px 25px;
                        background: linear-gradient(145deg, #7289da, #5e7bc7);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                        margin: 0 8px;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'"
                       onmouseout="this.style.transform='scale(1)'">
                        ⏩ Пропустить
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
}

// Добавить сообщение в лог
function logMessage(text, color = '#ddd') {
    const log = document.getElementById('demo-battle-log');
    if (!log) return;

    const message = document.createElement('div');
    message.textContent = text;
    message.style.color = color;
    message.style.marginBottom = '3px';

    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
}

// Получить название заклинания
function getSpellName(spellId) {
    const names = {
        'spark': 'Искра',
        'firebolt': 'Огненный снаряд',
        'icicle': 'Ледышка',
        'frost_arrow': 'Морозная стрела',
        'gust': 'Порыв ветра',
        'wind_blade': 'Клинок ветра',
        'fireball': 'Огненный шар',
        'blizzard': 'Метель',
        'fire_wall': 'Огненная стена',
        'wind_wall': 'Стена ветра'
    };

    return names[spellId] || spellId;
}

// Пропустить демо
function skipDemoBattle() {
    demoBattleData.isRunning = false;
    closeDemoBattle();
}

// Закрыть демо
function closeDemoBattle() {
    const overlay = document.getElementById('demo-battle-overlay');
    if (overlay) {
        overlay.remove();
    }

    // Очищаем PIXI
    if (window.pixiDragon && window.pixiDragon.clear) {
        window.pixiDragon.clear();
    }

    if (window.pixiCore && window.pixiCore.destroy) {
        window.pixiCore.destroy();
    }

    // Очищаем временные формации
    window.enemyFormation = null;
    window.playerFormation = null;

    // Сброс данных
    demoBattleData = {
        dragon: null,
        wizards: [],
        isRunning: false,
        currentTurn: 0,
        wizardPositions: [1, 2, 3],
        dragonSpells: ['fireball', 'blizzard', 'fire_wall'],
        wizardSpells: [
            ['spark', 'firebolt'],
            ['icicle', 'frost_arrow'],
            ['gust', 'wind_blade']
        ]
    };

    console.log('🧹 Демо-бой очищен');
}

// Экспорт функций
window.startDemoBattle = startDemoBattle;
window.skipDemoBattle = skipDemoBattle;
window.closeDemoBattle = closeDemoBattle;

// Удобная консольная команда для тестирования
window.demo = function(faction = 'fire') {
    console.log('🐉 Запуск демо-боя с фракцией:', faction);
    window.startDemoBattle(faction);
};

console.log('✅ Демо-бой готов к запуску!');
console.log('💡 Используй команду: demo() или demo("water") для запуска');
