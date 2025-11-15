// demo-battle.js - Демонстрационный бой с драконом после выбора фракции

console.log('🐉 demo-battle.js загружен');

// Конфигурация демо-боя
const DEMO_CONFIG = {
    dragonHP: 500,
    dragonDamage: { min: 15, max: 35 },
    wizardCount: 4,
    battleSpeed: 1500,
    maxTurns: 20
};

// Инициализация демо-боя
function startDemoBattle(faction) {
    console.log('🐉 Запуск демо-боя для фракции:', faction);

    // Создаем дракона
    const dragon = {
        id: 'dragon_boss',
        name: '🐉 Древний Дракон',
        hp: DEMO_CONFIG.dragonHP,
        max_hp: DEMO_CONFIG.dragonHP,
        position: { row: 1, col: 1 }, // Центр 3x3
        size: 3
    };

    // Создаем магов
    const demoWizards = [];
    for (let i = 0; i < DEMO_CONFIG.wizardCount; i++) {
        demoWizards.push({
            id: `demo_wizard_${i}`,
            name: `Маг ${i + 1}`,
            hp: 80 + Math.random() * 40,
            max_hp: 120,
            faction: faction,
            position: i,
            damage: { min: 8, max: 20 }
        });
    }

    // Показываем демо-окно
    showDemoBattleWindow(dragon, demoWizards, faction);

    // Вводная задержка для впечатления
    setTimeout(() => {
        // Запускаем бой
        let turnCount = 0;
        window.demoBattleDragon = dragon;
        window.demoBattleWizards = demoWizards;

        let battleInterval = setInterval(() => {
            const aliveWizards = demoWizards.filter(w => w.hp > 0);

            if (turnCount >= DEMO_CONFIG.maxTurns || dragon.hp <= 0 || aliveWizards.length === 0) {
                clearInterval(battleInterval);
                const winner = dragon.hp <= 0 ? 'wizards' : 'dragon';
                endDemoBattle(winner);
                return;
            }

            executeDemoTurn(dragon, demoWizards, turnCount);
            turnCount++;

        }, DEMO_CONFIG.battleSpeed);

        // Сохраняем интервал для возможности пропуска
        window.demoBattleInterval = battleInterval;
    }, 1500);
}

// Добавляем стили для анимаций
function injectBattleStyles() {
    const styleId = 'demo-battle-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes battle-appear {
            from {
                opacity: 0;
                transform: scale(0.8) translateY(-50px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-2deg); }
            75% { transform: translateX(5px) rotate(2deg); }
        }

        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.9); }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        @keyframes fire-breath {
            0% { opacity: 0; transform: translateX(0) scale(0.5); }
            50% { opacity: 1; transform: translateX(100px) scale(1.5); }
            100% { opacity: 0; transform: translateX(300px) scale(0.8); }
        }

        @keyframes lightning-strike {
            0% { opacity: 0; transform: translateX(0) scaleY(0); }
            20% { opacity: 1; transform: translateX(-150px) scaleY(1); }
            40% { opacity: 0.8; }
            60% { opacity: 1; }
            80% { opacity: 0.6; }
            100% { opacity: 0; transform: translateX(-300px) scaleY(1); }
        }

        @keyframes ice-shard {
            0% { opacity: 0; transform: translateX(0) rotate(0deg); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: translateX(-250px) rotate(360deg); }
        }

        @keyframes fireball {
            0% { opacity: 0; transform: translateX(0) scale(0.3); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: translateX(-280px) scale(1.2); }
        }

        @keyframes damage-number {
            0% {
                opacity: 0;
                transform: translateY(0) scale(0.5);
            }
            20% {
                opacity: 1;
                transform: translateY(-20px) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translateY(-60px) scale(0.8);
            }
        }

        @keyframes particle-burst {
            0% {
                opacity: 1;
                transform: translate(0, 0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(var(--tx), var(--ty)) scale(0);
            }
        }

        @keyframes victory-confetti {
            0% {
                opacity: 1;
                transform: translateY(0) rotate(0deg);
            }
            100% {
                opacity: 0;
                transform: translateY(500px) rotate(720deg);
            }
        }

        .battle-cell {
            transition: all 0.3s ease;
        }

        .battle-cell:hover {
            transform: scale(1.05);
        }

        .wizard-cell {
            animation: float 3s ease-in-out infinite;
        }

        .dragon-cell {
            animation: pulse-glow 2s ease-in-out infinite;
        }

        .damage-hit {
            animation: shake 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

// Показать окно демо-боя
function showDemoBattleWindow(dragon, wizards, faction) {
    injectBattleStyles();

    const demoHTML = `
        <div id="demo-battle-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, rgba(20, 0, 40, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        ">
            <div id="demo-battle-container" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border-radius: 25px;
                padding: 40px;
                max-width: 900px;
                width: 95%;
                box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9),
                            0 0 100px rgba(255, 107, 107, 0.3),
                            inset 0 0 50px rgba(255, 255, 255, 0.05);
                border: 3px solid rgba(255, 107, 107, 0.3);
                animation: battle-appear 0.6s ease-out;
                position: relative;
                overflow: hidden;
            ">
                <!-- Фоновые эффекты -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background:
                        radial-gradient(circle at 20% 30%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(107, 107, 255, 0.1) 0%, transparent 50%);
                    pointer-events: none;
                    z-index: 0;
                "></div>

                <!-- Содержимое -->
                <div style="position: relative; z-index: 1;">
                    <h2 style="
                        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ffd700 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        text-align: center;
                        margin-bottom: 25px;
                        font-size: 36px;
                        font-weight: 900;
                        text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
                        letter-spacing: 2px;
                    ">
                        ⚔️ ИСПЫТАНИЕ ДРАКОНА ⚔️
                    </h2>

                    <div id="demo-battle-field" style="
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 8px;
                        margin: 25px 0;
                        padding: 25px;
                        background: rgba(0, 0, 0, 0.4);
                        border-radius: 15px;
                        border: 2px solid rgba(255, 107, 107, 0.2);
                        box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
                        position: relative;
                    ">
                        <!-- Поле боя 6x5 будет здесь -->
                    </div>

                    <div id="demo-dragon-health" style="
                        margin: 25px 0;
                        text-align: center;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            font-size: 24px;
                            margin-bottom: 12px;
                            font-weight: 800;
                            text-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
                        ">
                            ${dragon.name}
                        </div>
                        <div style="
                            background: linear-gradient(145deg, #2a2a3a, #1a1a2a);
                            height: 35px;
                            border-radius: 20px;
                            overflow: hidden;
                            position: relative;
                            border: 2px solid rgba(255, 107, 107, 0.3);
                            box-shadow:
                                0 4px 15px rgba(0, 0, 0, 0.5),
                                inset 0 2px 10px rgba(0, 0, 0, 0.8);
                        ">
                            <div id="dragon-hp-bar" style="
                                background: linear-gradient(90deg, #ff2222 0%, #ff6666 50%, #ff4444 100%);
                                height: 100%;
                                width: 100%;
                                transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                                box-shadow:
                                    0 0 20px rgba(255, 68, 68, 0.8),
                                    inset 0 0 20px rgba(255, 255, 255, 0.2);
                                position: relative;
                                overflow: hidden;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: linear-gradient(90deg,
                                        transparent 0%,
                                        rgba(255, 255, 255, 0.3) 50%,
                                        transparent 100%);
                                    animation: shimmer 2s infinite;
                                "></div>
                            </div>
                            <span style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                color: white;
                                font-weight: 900;
                                font-size: 16px;
                                text-shadow:
                                    0 0 10px rgba(0, 0, 0, 0.8),
                                    0 2px 4px rgba(0, 0, 0, 0.5);
                            ">${dragon.hp}/${dragon.max_hp}</span>
                        </div>
                    </div>

                    <div id="demo-battle-log" style="
                        background: rgba(0, 0, 0, 0.5);
                        padding: 18px;
                        border-radius: 12px;
                        height: 180px;
                        overflow-y: auto;
                        margin-bottom: 25px;
                        font-size: 14px;
                        color: #e0e0e0;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
                        font-family: 'Courier New', monospace;
                    ">
                        <div style="color: #ffd700; font-weight: bold;">🎭 Древний дракон пробудился!</div>
                        <div style="color: #87ceeb; font-weight: bold;">🧙‍♂️ Маги ${faction} вступают в бой!</div>
                    </div>

                    <div style="text-align: center;">
                        <button onclick="skipDemoBattle()" style="
                            padding: 14px 35px;
                            background: linear-gradient(145deg, #7289da, #5e7bc7);
                            border: none;
                            border-radius: 12px;
                            color: white;
                            font-size: 17px;
                            font-weight: 700;
                            cursor: pointer;
                            margin: 0 12px;
                            transition: all 0.3s ease;
                            box-shadow:
                                0 5px 15px rgba(114, 137, 218, 0.4),
                                inset 0 -3px 0 rgba(0, 0, 0, 0.2);
                        " onmouseover="this.style.transform='scale(1.05) translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(114, 137, 218, 0.6), inset 0 -3px 0 rgba(0, 0, 0, 0.2)';"
                           onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='0 5px 15px rgba(114, 137, 218, 0.4), inset 0 -3px 0 rgba(0, 0, 0, 0.2)';">
                            ⏩ Пропустить
                        </button>
                        <button onclick="speedUpDemo()" style="
                            padding: 14px 35px;
                            background: linear-gradient(145deg, #ffa500, #ff8c00);
                            border: none;
                            border-radius: 12px;
                            color: white;
                            font-size: 17px;
                            font-weight: 700;
                            cursor: pointer;
                            margin: 0 12px;
                            transition: all 0.3s ease;
                            box-shadow:
                                0 5px 15px rgba(255, 165, 0, 0.4),
                                inset 0 -3px 0 rgba(0, 0, 0, 0.2);
                        " onmouseover="this.style.transform='scale(1.05) translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(255, 165, 0, 0.6), inset 0 -3px 0 rgba(0, 0, 0, 0.2)';"
                           onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='0 5px 15px rgba(255, 165, 0, 0.4), inset 0 -3px 0 rgba(0, 0, 0, 0.2)';">
                            ⚡ Ускорить
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', demoHTML);
    renderDemoBattleField(dragon, wizards);
}

// Отрисовка поля боя
function renderDemoBattleField(dragon, wizards) {
    const field = document.getElementById('demo-battle-field');
    if (!field) return;

    let fieldHTML = '';

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
            let cellContent = '';
            let cellClass = 'battle-cell';
            let cellStyle = `
                width: 70px;
                height: 70px;
                background: linear-gradient(145deg, #2a2a4a, #1a1a2a);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                box-shadow:
                    inset 0 2px 5px rgba(255, 255, 255, 0.1),
                    0 2px 8px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
            `;

            // Дракон занимает 3x3 в центре левой части
            if (col >= 0 && col <= 2 && row >= 1 && row <= 3) {
                if (col === 1 && row === 2) {
                    cellContent = '<div class="dragon-cell" style="font-size: 48px;">🐉</div>';
                    cellStyle += `
                        background: radial-gradient(circle, #ff6666 0%, #cc3333 70%, #aa2222 100%);
                        box-shadow:
                            0 0 30px rgba(255, 102, 102, 0.6),
                            inset 0 0 20px rgba(255, 255, 255, 0.2),
                            0 5px 15px rgba(0, 0, 0, 0.5);
                        border: 2px solid rgba(255, 200, 200, 0.5);
                    `;
                    cellClass += ' dragon-cell';
                } else {
                    cellStyle += `
                        background: radial-gradient(circle, rgba(255, 153, 153, 0.3) 0%, rgba(255, 102, 102, 0.2) 100%);
                        box-shadow: 0 0 15px rgba(255, 102, 102, 0.3);
                    `;
                }
            }
            // Маги в правой части
            else if (col === 5) {
                const wizard = wizards.find(w => w.position === row && w.hp > 0);
                if (wizard) {
                    const hpPercent = (wizard.hp / wizard.max_hp) * 100;
                    const hpColor = hpPercent > 50 ? '#4ade80' : hpPercent > 25 ? '#fbbf24' : '#ef4444';
                    cellContent = `
                        <div class="wizard-cell" style="position: relative; width: 100%; height: 100%;">
                            <div style="font-size: 36px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">🧙‍♂️</div>
                            <div style="
                                position: absolute;
                                bottom: 5px;
                                left: 5px;
                                right: 5px;
                                height: 4px;
                                background: rgba(0, 0, 0, 0.5);
                                border-radius: 2px;
                                overflow: hidden;
                            ">
                                <div style="
                                    width: ${hpPercent}%;
                                    height: 100%;
                                    background: ${hpColor};
                                    transition: width 0.3s;
                                    box-shadow: 0 0 5px ${hpColor};
                                "></div>
                            </div>
                        </div>
                    `;
                    cellStyle += `
                        background: linear-gradient(145deg, #3a5a9a 0%, #2a4a7a 100%);
                        box-shadow:
                            0 0 20px rgba(58, 90, 154, 0.5),
                            inset 0 0 15px rgba(255, 255, 255, 0.1),
                            0 3px 10px rgba(0, 0, 0, 0.4);
                        border: 2px solid rgba(100, 150, 255, 0.4);
                    `;
                    cellClass += ' wizard-cell';
                } else if (wizards.some(w => w.position === row && w.hp <= 0)) {
                    cellContent = '<div style="font-size: 24px; opacity: 0.3;">💀</div>';
                    cellStyle += ' background: rgba(50, 30, 30, 0.5);';
                }
            }

            fieldHTML += `<div class="${cellClass}" style="${cellStyle}" data-row="${row}" data-col="${col}">${cellContent}</div>`;
        }
    }

    field.innerHTML = fieldHTML;
}

// Создание частиц
function createParticles(x, y, color, count = 10) {
    const container = document.getElementById('demo-battle-field');
    if (!container) return;

    const rect = container.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / count;
        const distance = 30 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 6px;
            height: 6px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            box-shadow: 0 0 10px ${color};
            --tx: ${tx}px;
            --ty: ${ty}px;
            animation: particle-burst 0.8s ease-out forwards;
            z-index: 1000;
        `;

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

// Показать урон
function showDamage(cellElement, damage, isPlayer = false) {
    if (!cellElement) return;

    const rect = cellElement.getBoundingClientRect();
    const container = document.getElementById('demo-battle-field');
    const containerRect = container.getBoundingClientRect();

    const damageEl = document.createElement('div');
    const color = isPlayer ? '#ff4444' : '#4444ff';
    damageEl.style.cssText = `
        position: absolute;
        left: ${rect.left - containerRect.left + rect.width / 2}px;
        top: ${rect.top - containerRect.top + rect.height / 2}px;
        color: ${color};
        font-size: 28px;
        font-weight: 900;
        pointer-events: none;
        z-index: 1001;
        text-shadow:
            0 0 10px ${color},
            0 0 20px ${color},
            2px 2px 4px rgba(0, 0, 0, 0.8);
        animation: damage-number 1s ease-out forwards;
    `;
    damageEl.textContent = `-${damage}`;

    container.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 1000);

    // Эффект встряски
    cellElement.classList.add('damage-hit');
    setTimeout(() => cellElement.classList.remove('damage-hit'), 300);

    // Частицы
    createParticles(
        rect.left - containerRect.left + rect.width / 2,
        rect.top - containerRect.top + rect.height / 2,
        color,
        8
    );
}

// Создание эффекта заклинания
function createSpellEffect(fromCol, fromRow, toCol, toRow, spellType) {
    const container = document.getElementById('demo-battle-field');
    if (!container) return;

    const fromCell = container.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toCell = container.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);

    if (!fromCell || !toCell) return;

    const containerRect = container.getBoundingClientRect();
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();

    const startX = fromRect.left - containerRect.left + fromRect.width / 2;
    const startY = fromRect.top - containerRect.top + fromRect.height / 2;

    const spell = document.createElement('div');

    const spellConfigs = {
        'fire': {
            emoji: '🔥',
            animation: 'fireball',
            color: '#ff6600',
            shadow: '0 0 20px #ff6600'
        },
        'ice': {
            emoji: '❄️',
            animation: 'ice-shard',
            color: '#66ccff',
            shadow: '0 0 20px #66ccff'
        },
        'lightning': {
            emoji: '⚡',
            animation: 'lightning-strike',
            color: '#ffff00',
            shadow: '0 0 25px #ffff00'
        },
        'stone': {
            emoji: '🪨',
            animation: 'fireball',
            color: '#8b7355',
            shadow: '0 0 15px #8b7355'
        },
        'dragon-fire': {
            emoji: '🔥',
            animation: 'fire-breath',
            color: '#ff3300',
            shadow: '0 0 30px #ff3300'
        }
    };

    const config = spellConfigs[spellType] || spellConfigs['fire'];

    spell.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        font-size: 32px;
        pointer-events: none;
        z-index: 999;
        filter: drop-shadow(${config.shadow});
        animation: ${config.animation} 0.8s ease-out forwards;
    `;
    spell.textContent = config.emoji;

    container.appendChild(spell);
    setTimeout(() => spell.remove(), 800);
}

// Выполнение хода
function executeDemoTurn(dragon, wizards, turnNum) {
    const log = document.getElementById('demo-battle-log');
    const container = document.getElementById('demo-battle-field');

    // Ход магов
    const aliveWizards = wizards.filter(w => w.hp > 0);
    let wizardDelay = 0;

    aliveWizards.forEach((wizard, index) => {
        setTimeout(() => {
            const damage = Math.floor(wizard.damage.min + Math.random() * (wizard.damage.max - wizard.damage.min));
            dragon.hp = Math.max(0, dragon.hp - damage);

            const spells = [
                { name: 'Огненный шар', type: 'fire', color: '#ff6600' },
                { name: 'Ледяная стрела', type: 'ice', color: '#66ccff' },
                { name: 'Молния', type: 'lightning', color: '#ffff00' },
                { name: 'Каменный шип', type: 'stone', color: '#8b7355' }
            ];
            const spell = spells[Math.floor(Math.random() * spells.length)];

            // Эффект заклинания
            createSpellEffect(5, wizard.position, 1, 2, spell.type);

            // Через время показываем урон
            setTimeout(() => {
                const dragonCell = container.querySelector(`[data-row="2"][data-col="1"]`);
                showDamage(dragonCell, damage, false);
                updateDemoBattleUI(dragon, wizards);
            }, 400);

            log.innerHTML += `<div style="color: ${spell.color}; text-shadow: 0 0 5px ${spell.color};">🧙‍♂️ ${wizard.name} использует ${spell.name} → ${damage} урона</div>`;
            log.scrollTop = log.scrollHeight;
        }, wizardDelay);

        wizardDelay += 600;
    });

    // Ход дракона
    setTimeout(() => {
        if (dragon.hp > 0 && aliveWizards.length > 0) {
            const target = aliveWizards[Math.floor(Math.random() * aliveWizards.length)];
            const damage = Math.floor(DEMO_CONFIG.dragonDamage.min + Math.random() * (DEMO_CONFIG.dragonDamage.max - DEMO_CONFIG.dragonDamage.min));
            target.hp = Math.max(0, target.hp - damage);

            const attacks = [
                { name: 'Огненное дыхание', type: 'dragon-fire' },
                { name: 'Удар хвостом', type: 'fire' },
                { name: 'Укус', type: 'fire' },
                { name: 'Удар крылом', type: 'fire' }
            ];
            const attack = attacks[Math.floor(Math.random() * attacks.length)];

            // Эффект атаки дракона
            createSpellEffect(1, 2, 5, target.position, attack.type);

            // Через время показываем урон
            setTimeout(() => {
                const wizardCell = container.querySelector(`[data-row="${target.position}"][data-col="5"]`);
                showDamage(wizardCell, damage, true);
                updateDemoBattleUI(dragon, wizards);

                if (target.hp <= 0) {
                    log.innerHTML += `<div style="color: #ff4444; font-weight: bold; text-shadow: 0 0 5px #ff4444;">💀 ${target.name} повержен!</div>`;
                }
            }, 400);

            log.innerHTML += `<div style="color: #ff6666; font-weight: bold; text-shadow: 0 0 5px #ff6666;">🐉 Дракон использует ${attack.name} → ${damage} урона</div>`;
            log.scrollTop = log.scrollHeight;
        }
    }, wizardDelay + 300);
}

// Обновление UI
function updateDemoBattleUI(dragon, wizards) {
    // Обновляем HP дракона
    const hpBar = document.getElementById('dragon-hp-bar');
    if (hpBar) {
        const hpPercent = (dragon.hp / dragon.max_hp) * 100;
        hpBar.style.width = `${hpPercent}%`;
        hpBar.parentElement.querySelector('span').textContent = `${dragon.hp}/${dragon.max_hp}`;
    }
    
    // Перерисовываем поле
    renderDemoBattleField(dragon, wizards);
}

// Конец демо-боя
function endDemoBattle(winner) {
    const log = document.getElementById('demo-battle-log');
    const container = document.getElementById('demo-battle-container');

    if (winner === 'dragon') {
        log.innerHTML += `<div style="color: #ff6666; font-size: 18px; font-weight: bold; margin-top: 10px; text-shadow: 0 0 10px #ff6666;">🐉 ДРАКОН ПОБЕДИЛ! Маги пали в битве...</div>`;
        createDefeatEffect();
    } else {
        log.innerHTML += `<div style="color: #66ff66; font-size: 18px; font-weight: bold; margin-top: 10px; text-shadow: 0 0 10px #66ff66;">🎉 НЕВЕРОЯТНО! Маги одолели дракона!</div>`;
        createVictoryEffect();
    }

    setTimeout(() => {
        closeDemoBattle();
    }, 4000);
}

// Эффект победы
function createVictoryEffect() {
    const container = document.getElementById('demo-battle-overlay');
    if (!container) return;

    // Создаем конфетти
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;

            confetti.style.cssText = `
                position: fixed;
                left: ${left}%;
                top: -50px;
                width: 10px;
                height: 10px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 10px ${color};
                animation: victory-confetti ${duration}s ease-in forwards;
                animation-delay: ${delay}s;
            `;

            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), (duration + delay) * 1000);
        }, i * 30);
    }

    // Текст победы
    const victoryText = document.createElement('div');
    victoryText.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
        z-index: 10001;
        pointer-events: none;
        animation: victory-pop 0.6s ease-out forwards;
    `;
    victoryText.textContent = '🏆 ПОБЕДА! 🏆';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes victory-pop {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(-180deg);
                opacity: 0;
            }
            60% {
                transform: translate(-50%, -50%) scale(1.2) rotate(10deg);
            }
            100% {
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    container.appendChild(victoryText);
    setTimeout(() => {
        victoryText.style.animation = 'victory-pop 0.3s ease-in reverse forwards';
        setTimeout(() => victoryText.remove(), 300);
    }, 3000);
}

// Эффект поражения
function createDefeatEffect() {
    const container = document.getElementById('demo-battle-overlay');
    if (!container) return;

    // Затемнение с красным оттенком
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%);
        z-index: 10000;
        pointer-events: none;
        animation: defeat-fade 1s ease-out forwards;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes defeat-fade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes defeat-shake {
            0%, 100% { transform: translate(-50%, -50%) translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translate(-50%, -50%) translateX(10px); }
        }
    `;
    document.head.appendChild(style);

    container.appendChild(overlay);

    // Текст поражения
    const defeatText = document.createElement('div');
    defeatText.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 72px;
        font-weight: 900;
        color: #ff4444;
        text-shadow:
            0 0 30px rgba(255, 68, 68, 0.8),
            0 0 50px rgba(139, 0, 0, 0.6);
        z-index: 10001;
        pointer-events: none;
        animation: defeat-shake 0.5s ease-out;
    `;
    defeatText.textContent = '💀 ПОРАЖЕНИЕ';

    container.appendChild(defeatText);
    setTimeout(() => {
        defeatText.remove();
        overlay.remove();
    }, 3500);
}

// Пропустить демо
function skipDemoBattle() {
    if (window.demoBattleInterval) {
        clearInterval(window.demoBattleInterval);
    }
    closeDemoBattle();
}

// Ускорить демо
function speedUpDemo() {
    DEMO_CONFIG.battleSpeed = Math.max(300, DEMO_CONFIG.battleSpeed / 2);
    const btn = event.target;
    if (btn) {
        btn.textContent = '⚡⚡ Очень быстро!';
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }
}

// Закрыть демо
function closeDemoBattle() {
    const overlay = document.getElementById('demo-battle-overlay');
    if (overlay) {
        overlay.remove();
    }
    if (window.demoBattleInterval) {
        clearInterval(window.demoBattleInterval);
        window.demoBattleInterval = null;
    }
    
    // Показываем основную игру
    if (typeof window.showGameArea === 'function') {
        window.showGameArea();
    }
}

// Экспорт
window.startDemoBattle = startDemoBattle;
window.skipDemoBattle = skipDemoBattle;
window.speedUpDemo = speedUpDemo;
window.closeDemoBattle = closeDemoBattle;