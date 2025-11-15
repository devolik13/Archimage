// battle/demo-battle.js - Кинематографическая сцена с драконом
console.log('🐉 demo-battle.js загружен');

// Конфигурация кинематографической сцены
const CINEMATIC_CONFIG = {
    spellDelay: 600,  // Задержка между заклинаниями (ускорено на 50%)
    waveDelay: 1000,  // Задержка между волнами атак (ускорено на 50%)
    deathDelay: 750,  // Задержка между смертями магов (ускорено на 50%)
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
        { wizard: 0, spell: 'firebolt' },
        { wizard: 1, spell: 'frost_arrow' },
        { wizard: 2, spell: 'wind_blade' }
    ],
    // Контратака дракона
    dragonCounterattack: [
        { spell: 'fireball', target: 1 },      // Огненный шар по центральному магу
        { spell: 'ice_rain', target: 0 },      // Ледяной дождь на первого мага
        { spell: 'meteor', target: 2 }         // Метеор на третьего мага
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
    for (const attack of attacks) {
        const wizard = cinematicData.wizards[attack.wizard];
        if (!wizard) continue;

        // Анимация каста
        if (window.pixiWizards.playCastAnimation) {
            window.pixiWizards.playCastAnimation(wizard.sprite);
        }

        // Анимация заклинания
        await playSpellAnimation(attack.spell, wizard, 'dragon');
        await delay(CINEMATIC_CONFIG.spellDelay);
    }
}

// Контратака дракона
async function playDragonCounterattack() {
    for (const attack of CINEMATIC_SCRIPT.dragonCounterattack) {
        // Анимация атаки дракона
        await new Promise(resolve => {
            window.pixiDragon.playAttack(() => resolve());
        });

        const target = cinematicData.wizards[attack.target];
        if (!target) continue;

        // Анимация заклинания дракона
        await playSpellAnimation(attack.spell, null, target);
        await delay(CINEMATIC_CONFIG.spellDelay);
    }
}

// Последовательность смерти магов
async function playWizardsDeathSequence() {
    for (const wizardIndex of CINEMATIC_SCRIPT.wizardDeaths) {
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

        await delay(CINEMATIC_CONFIG.deathDelay);
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
                // Маг → Дракон
                const wizardIndex = cinematicData.wizards.indexOf(caster);
                casterCol = 5;
                casterRow = caster.position;
                targetCol = 1;
                targetRow = 1;
            } else if (target) {
                // Дракон → Маг
                casterCol = 1;
                casterRow = 1;
                targetCol = 5;
                targetRow = target.position;
            }

            const casterTypeParam = (target === 'dragon') ? 'player' : 'enemy';

            // Таймаут на случай если анимация не вызовет callback
            const timeout = setTimeout(() => resolve(), 3000);

            animation.play({
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
            });
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
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                max-width: 900px;
                width: 90%;
            ">
                <h2 style="color: #ff6b6b; text-align: center; margin: 0 0 20px 0; font-size: 28px; text-shadow: 0 0 10px rgba(255,107,107,0.5);">
                    ⚔️ Испытание Дракона ⚔️
                </h2>

                <!-- PIXI Canvas -->
                <div id="pixi-container" style="
                    display: flex;
                    justify-content: center;
                "></div>

                <!-- Кнопка пропустить -->
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="skipDemoBattle()" style="
                        padding: 12px 30px;
                        background: linear-gradient(145deg, #7289da, #5e7bc7);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                        box-shadow: 0 4px 15px rgba(114, 137, 218, 0.4);
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(114, 137, 218, 0.6)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(114, 137, 218, 0.4)';">
                        ⏩ Пропустить
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
}

// Пропустить сцену
function skipDemoBattle() {
    cinematicData.isPlaying = false;
    endCinematic();
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

// Экспорт функций
window.startDemoBattle = startDemoBattle;
window.skipDemoBattle = skipDemoBattle;
window.closeDemoBattle = closeDemoBattle;

// Удобная консольная команда
window.demo = function(faction = 'fire') {
    console.log('🎬 Запуск кинематографической сцены');
    window.startDemoBattle(faction);
};

console.log('✅ Кинематографическая сцена готова!');
console.log('💡 Используй команду: demo()');
