// battle/demo-battle.js - Кинематографическая сцена с драконом
console.log('🐉 demo-battle.js загружен');

// Конфигурация кинематографической сцены
const CINEMATIC_CONFIG = {
    spellDelay: 700,  // Задержка между заклинаниями
    waveDelay: 500,  // Задержка между волнами атак
    deathDelay: 750,  // Задержка между смертями магов
    fadeOutDuration: 2000 // Длительность затемнения
};

// Данные сцены
let cinematicData = {
    dragon: null,
    wizards: [],
    isPlaying: false
};

// Сценарий кинематографической сцены
const CINEMATIC_SCRIPT = {
    // Волна 1: Маги атакуют дракона
    wizardsAttack1: [
        { wizard: 0, spell: 'spark' },
        { wizard: 1, spell: 'icicle' },
        { wizard: 2, spell: 'gust' }
    ],
    // Волна 2: Маги атакуют снова
    wizardsAttack2: [
        { wizard: 0, spell: 'pebble' },
        { wizard: 1, spell: 'poisoned_blade' },
        { wizard: 2, spell: 'wind_blade' }
    ],
    // Контратака дракона
    dragonCounterattack: [
        { spell: 'fireball', target: 1 },      // Огненный шар по центральному магу
        { spell: 'ice_rain', targets: [1, 2, 3] }, // Ледяной дождь по всей линии магов
        { spell: 'fire_tsunami', targets: [1, 2, 3] } // Огненное цунами по всей линии
    ],
    // Порядок смерти магов
    wizardDeaths: [1, 0, 2] // Сначала маг воды, потом огня, потом ветра
};

// Запуск кинематографической сцены
async function startDemoBattle(faction) {
    console.log('🎬 Запуск кинематографической сцены');

    showCinematicOverlay();
    await initCinematicBattle();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Создаём дракона
    const dragon = await window.pixiDragon.create();
    if (!dragon) {
        console.error('❌ Не удалось создать дракона');
        closeDemoBattle();
        return;
    }

    cinematicData.dragon = dragon;

    // Скрываем HP бар дракона
    if (dragon.hpBar) {
        dragon.hpBar.visible = false;
    }

    console.log('✅ Дракон создан');

    // Создаём магов
    await createCinematicWizards();

    // Запускаем сценарий
    cinematicData.isPlaying = true;
    setTimeout(() => {
        playCinematicScript();
    }, 1000);
}

// Инициализация поля боя
async function initCinematicBattle() {
    if (!window.pixiCore) {
        console.error('❌ PIXI Core не загружен');
        return;
    }

    if (window.pixiCore.destroy) {
        window.pixiCore.destroy();
    }

    window.enemyFormation = [];
    window.playerFormation = [];

    await window.pixiCore.init();
    console.log('✅ PIXI поле боя инициализировано');
}

// Создание магов
async function createCinematicWizards() {
    const factions = ['fire', 'water', 'wind'];
    const names = ['Маг Огня', 'Маг Воды', 'Маг Ветра'];
    const positions = [1, 2, 3];

    for (let i = 0; i < 3; i++) {
        const wizardData = {
            id: `cinematic_wizard_${i}`,
            name: names[i],
            faction: factions[i],
            hp: 120,
            max_hp: 120,
            level: 1
        };

        const wizard = await window.pixiWizards.createWizard(
            wizardData,
            5, // колонка
            positions[i], // ряд
            'player'
        );

        if (wizard) {
            wizard.data = wizardData;
            wizard.position = positions[i];

            // Скрываем HP бар
            if (wizard.hpBar) {
                wizard.hpBar.visible = false;
            }

            cinematicData.wizards.push(wizard);
            console.log(`✅ ${names[i]} создан`);
        }
    }
}

// Проигрывание кинематографического сценария
async function playCinematicScript() {
    if (!cinematicData.isPlaying) return;

    console.log('🎬 Акт 1: Маги атакуют дракона (волна 1)');
    await playWizardsAttackWave(CINEMATIC_SCRIPT.wizardsAttack1);

    await delay(CINEMATIC_CONFIG.waveDelay);

    console.log('🎬 Акт 2: Маги атакуют дракона (волна 2)');
    await playWizardsAttackWave(CINEMATIC_SCRIPT.wizardsAttack2);

    await delay(CINEMATIC_CONFIG.waveDelay);

    console.log('🎬 Акт 3: Дракон контратакует!');
    await playDragonCounterattack();

    await delay(CINEMATIC_CONFIG.waveDelay);

    console.log('🎬 Финал: Падение героев');
    await playWizardsDeathSequence();

    await delay(1000);

    console.log('🎬 Затемнение...');
    endCinematic();
}

// Волна атак магов
async function playWizardsAttackWave(attacks) {
    for (let i = 0; i < attacks.length; i++) {
        const attack = attacks[i];
        const wizard = cinematicData.wizards[attack.wizard];
        if (!wizard) continue;

        // Анимация каста
        if (window.pixiWizards.playCastAnimation) {
            window.pixiWizards.playCastAnimation(wizard.sprite);
        }

        // Запускаем анимацию заклинания БЕЗ ожидания её завершения
        playSpellAnimation(attack.spell, wizard, 'dragon');

        // Фиксированная задержка перед следующей атакой
        if (i < attacks.length - 1) {
            await delay(CINEMATIC_CONFIG.spellDelay);
        }
    }
}

// Контратака дракона
async function playDragonCounterattack() {
    const attacks = CINEMATIC_SCRIPT.dragonCounterattack;

    for (let i = 0; i < attacks.length; i++) {
        const attack = attacks[i];

        // Запускаем анимацию атаки дракона БЕЗ ожидания
        window.pixiDragon.playAttack(() => {});

        // Обработка одиночной или множественной цели - запускаем БЕЗ ожидания
        if (attack.targets) {
            // Для заклинаний с несколькими целями (ice_rain)
            playSpellAnimation(attack.spell, null, { positions: attack.targets });
        } else {
            // Для заклинаний с одной целью
            const target = cinematicData.wizards[attack.target];
            if (!target) continue;
            playSpellAnimation(attack.spell, null, target);
        }

        // Фиксированная задержка перед следующей атакой
        if (i < attacks.length - 1) {
            await delay(CINEMATIC_CONFIG.spellDelay);
        }
    }
}

// Последовательность смерти магов
async function playWizardsDeathSequence() {
    const deaths = CINEMATIC_SCRIPT.wizardDeaths;

    for (let i = 0; i < deaths.length; i++) {
        const wizardIndex = deaths[i];
        const wizard = cinematicData.wizards[wizardIndex];
        if (!wizard) continue;

        console.log(`💀 ${wizard.data.name} падает...`);

        // Анимация смерти
        await new Promise(resolve => {
            if (window.pixiWizards.playDeathAnimation) {
                window.pixiWizards.playDeathAnimation(wizard.sprite, () => resolve());
            } else {
                resolve();
            }
        });

        // Задержка только если это НЕ последний маг
        if (i < deaths.length - 1) {
            await delay(CINEMATIC_CONFIG.deathDelay);
        }
    }
}

// Проигрывание анимации заклинания
function playSpellAnimation(spellId, caster, target) {
    return new Promise((resolve) => {
        try {
            if (!window.spellAnimations || !window.spellAnimations[spellId]) {
                console.warn(`⚠️ Анимация для ${spellId} не найдена`);
                resolve();
                return;
            }

            const animation = window.spellAnimations[spellId];

            // Определяем координаты
            let casterCol, casterRow, targetCol, targetRow;

            if (target === 'dragon') {
                // Маг → Дракон (центр дракона на ряду 2)
                const wizardIndex = cinematicData.wizards.indexOf(caster);
                casterCol = 5;
                casterRow = caster.position;
                targetCol = 1;
                targetRow = 2;
            } else if (target && target.positions) {
                // Дракон → Несколько магов (для ice_rain)
                casterCol = 1;
                casterRow = 2;
                targetCol = 5;
                targetRow = target.positions[0]; // Первая позиция для базовых параметров
            } else if (target) {
                // Дракон → Один маг
                casterCol = 1;
                casterRow = 2;
                targetCol = 5;
                targetRow = target.position;
            }

            const casterTypeParam = (target === 'dragon') ? 'player' : 'enemy';

            // Таймаут на случай если анимация не вызовет callback
            const timeout = setTimeout(() => resolve(), 3000);

            // Параметры для разных типов заклинаний
            const animationParams = {
                casterCol: casterCol,
                casterRow: casterRow,
                targetCol: targetCol,
                targetRow: targetRow,
                casterType: casterTypeParam,
                casterPosition: casterRow,
                targetColumn: targetCol,
                initialPosition: casterRow,
                level: 1,
                onComplete: () => {
                    clearTimeout(timeout);
                    resolve();
                }
            };

            // Для ice_rain добавляем targetPositions (массив позиций)
            if (spellId === 'ice_rain') {
                if (target && target.positions) {
                    // Несколько целей
                    animationParams.targetPositions = target.positions;
                } else if (target && target.position !== undefined) {
                    // Одна цель
                    animationParams.targetPositions = [target.position];
                } else {
                    // Fallback
                    animationParams.targetPositions = [1];
                }
            }

            animation.play(animationParams);
        } catch (error) {
            console.error(`❌ Ошибка анимации ${spellId}:`, error);
            resolve();
        }
    });
}

// Вспомогательная функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Конец кинематографической сцены
function endCinematic() {
    cinematicData.isPlaying = false;

    const overlay = document.getElementById('demo-battle-overlay');
    if (!overlay) return;

    // Плавное затемнение
    overlay.style.transition = `background ${CINEMATIC_CONFIG.fadeOutDuration}ms`;
    overlay.style.background = 'rgba(0, 0, 0, 1)';

    setTimeout(() => {
        closeDemoBattle();

        // Показываем город
        if (typeof window.showGameArea === 'function') {
            window.showGameArea();
        }

        // Показываем приветственное сообщение для новых игроков
        if (window.userData && !window.userData.welcome_shown) {
            console.log('👋 Показываем приветственное сообщение');
            setTimeout(() => {
                showWelcomeMessage();
            }, 500);
        }
    }, CINEMATIC_CONFIG.fadeOutDuration);
}

// Показать overlay
function showCinematicOverlay() {
    const overlayHTML = `
        <div id="demo-battle-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div id="pixi-container" style="
                width: 100%;
                height: 100%;
            "></div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
}

// Закрыть сцену
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
    cinematicData = {
        dragon: null,
        wizards: [],
        isPlaying: false
    };

    console.log('🧹 Кинематографическая сцена завершена');
}

// Показать приветственное сообщение для новых игроков
function showWelcomeMessage() {
    console.log('👋 Показываем приветственное окно');

    // Основной контейнер (как у города и faction-selection)
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: block;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        overflow: hidden;
    `;

    // Контейнер с rotation КАК У ГОРОДА
    const bgContainer = document.createElement('div');
    bgContainer.id = 'welcome-bg-container';
    bgContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    `;

    // Проверяем CSS rotation (мобильные устройства)
    const isRotated = window.cssRotationActive === true;
    console.log('🔄 Welcome - CSS Rotation активен:', isRotated);

    // ROTATION через style (как у города!)
    if (isRotated) {
        const oldStyle = document.getElementById('welcome-rotation-style');
        if (oldStyle) {
            oldStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'welcome-rotation-style';
        style.innerHTML = `
            #welcome-bg-container {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) rotate(-90deg) !important;
                transform-origin: center center !important;
                width: 100vh !important;
                height: 100vw !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Welcome rotation style применен (-90deg)');
    }

    // Контент - ГОРИЗОНТАЛЬНЫЙ LAYOUT
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 2vh 3vw;
        box-sizing: border-box;
        gap: 20px;
    `;

    contentWrapper.innerHTML = `
        <!-- Левая часть - иконка и заголовок -->
        <div style="
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        ">
            <div style="font-size: 50px; margin-bottom: 10px;">⚔️✨</div>
            <h1 style="
                margin: 0;
                font-size: 20px;
                color: #ffd700;
                text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                font-weight: bold;
                text-align: center;
                white-space: nowrap;
            ">
                Приветствуем<br>тебя, маг!
            </h1>
        </div>

        <!-- Центр - основной текст -->
        <div style="
            flex: 1;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            text-align: center;
            color: white;
            font-size: 16px;
            line-height: 1.6;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            max-width: 450px;
        ">
            <div style="color: #ffd700; font-size: 17px; font-weight: bold; margin-bottom: 10px;">
                📜 Основы магии:
            </div>

            Строить: <strong style="color: #ffd700;">одно здание</strong><br>
            Изучать: <strong style="color: #ffd700;">одно заклинание</strong><br>
            <div style="color: #87ceeb; font-size: 15px; margin-top: 8px;">
                ⚡ Не забывай ускорять!
            </div>

            <div style="color: #ffd700; font-weight: bold; font-size: 18px; margin-top: 8px;">
                Выбирай мудро! 🔮
            </div>
        </div>

        <!-- Правая часть - кнопка -->
        <div style="
            flex: 0 0 auto;
            display: flex;
            align-items: center;
        ">
            <button onclick="closeWelcomeMessage()" style="
                padding: 20px 30px;
                border: 2px solid #ffd700;
                border-radius: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                cursor: pointer;
                font-weight: bold;
                font-size: 18px;
                transition: all 0.3s;
                box-shadow: 0 5px 20px rgba(255, 215, 0, 0.3);
                white-space: nowrap;
            "
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 30px rgba(255, 215, 0, 0.5)'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 20px rgba(255, 215, 0, 0.3)'">
                ⚔️ Начать<br>приключение!
            </button>
        </div>
    `;

    bgContainer.appendChild(contentWrapper);
    modal.appendChild(bgContainer);
    document.body.appendChild(modal);
}

function closeWelcomeMessage() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.remove();
    }

    // Удаляем rotation style
    const rotationStyle = document.getElementById('welcome-rotation-style');
    if (rotationStyle) {
        rotationStyle.remove();
    }

    // Отмечаем что сообщение показано
    if (window.userData) {
        window.userData.welcome_shown = true;
        if (window.dbManager) {
            window.dbManager.markChanged();
        }
    }
}

// Экспорт функций
window.startDemoBattle = startDemoBattle;
window.closeDemoBattle = closeDemoBattle;
window.closeWelcomeMessage = closeWelcomeMessage;

// Удобная консольная команда
window.demo = function(faction = 'fire') {
    console.log('🎬 Запуск кинематографической сцены');
    window.startDemoBattle(faction);
};

console.log('✅ Кинематографическая сцена готова!');
