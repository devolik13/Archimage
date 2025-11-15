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
    
    // Запускаем бой
    let turnCount = 0;
    let battleInterval = setInterval(() => {
        if (turnCount >= DEMO_CONFIG.maxTurns || dragon.hp <= 0) {
            clearInterval(battleInterval);
            endDemoBattle(dragon.hp > 0 ? 'dragon' : 'wizards');
            return;
        }
        
        executeDemoTurn(dragon, demoWizards, turnCount);
        turnCount++;
        updateDemoBattleUI(dragon, demoWizards);
        
    }, DEMO_CONFIG.battleSpeed);
    
    // Сохраняем интервал для возможности пропуска
    window.demoBattleInterval = battleInterval;
}

// Показать окно демо-боя
function showDemoBattleWindow(dragon, wizards, faction) {
    const demoHTML = `
        <div id="demo-battle-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div id="demo-battle-container" style="
                background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                border: 2px solid #4a4a6a;
            ">
                <h2 style="color: #ff6b6b; text-align: center; margin-bottom: 20px; font-size: 28px;">
                    ⚔️ Испытание Дракона ⚔️
                </h2>
                
                <div id="demo-battle-field" style="
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 5px;
                    margin: 20px 0;
                    padding: 20px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                ">
                    <!-- Поле боя 6x5 будет здесь -->
                </div>
                
                <div id="demo-dragon-health" style="
                    margin: 20px 0;
                    text-align: center;
                ">
                    <div style="color: #ff6b6b; font-size: 20px; margin-bottom: 10px;">
                        ${dragon.name}
                    </div>
                    <div style="
                        background: #333;
                        height: 30px;
                        border-radius: 15px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="dragon-hp-bar" style="
                            background: linear-gradient(90deg, #ff4444, #ff6666);
                            height: 100%;
                            width: 100%;
                            transition: width 0.5s;
                        "></div>
                        <span style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: white;
                            font-weight: bold;
                        ">${dragon.hp}/${dragon.max_hp}</span>
                    </div>
                </div>
                
                <div id="demo-battle-log" style="
                    background: rgba(0,0,0,0.4);
                    padding: 15px;
                    border-radius: 10px;
                    height: 150px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #ddd;
                ">
                    <div>🎭 Древний дракон пробудился!</div>
                    <div>🧙‍♂️ Маги ${faction} вступают в бой!</div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="skipDemoBattle()" style="
                        padding: 12px 30px;
                        background: linear-gradient(145deg, #7289da, #5e7bc7);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        margin: 0 10px;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        ⏩ Пропустить
                    </button>
                    <button onclick="speedUpDemo()" style="
                        padding: 12px 30px;
                        background: linear-gradient(145deg, #ffa500, #ff8c00);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        margin: 0 10px;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        ⚡ Ускорить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', demoHTML);
    renderDemoBattleField(dragon, wizards);
}

// Отрисовка поля боя
function renderDemoBattleField(dragon, wizards) {
    const field = document.getElementById('demo-battle-field');
    if (!field) return;
    
    let fieldHTML = '';
    
    for (let col = 0; col < 6; col++) {
        for (let row = 0; row < 5; row++) {
            let cellContent = '';
            let cellStyle = 'width: 60px; height: 60px; background: #2a2a3a; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 24px;';
            
            // Дракон занимает 3x3 в центре левой части
            if (col >= 0 && col <= 2 && row >= 1 && row <= 3) {
                if (col === 1 && row === 2) {
                    cellContent = '🐉';
                    cellStyle += ' background: radial-gradient(circle, #ff6666, #cc3333);';
                } else {
                    cellStyle += ' background: radial-gradient(circle, #ff9999, #ff6666);';
                }
            }
            // Маги в правой части
            else if (col === 5) {
                const wizard = wizards.find(w => w.position === row && w.hp > 0);
                if (wizard) {
                    cellContent = '🧙‍♂️';
                    cellStyle += ' background: #3a5a8a;';
                }
            }
            
            fieldHTML += `<div style="${cellStyle}">${cellContent}</div>`;
        }
    }
    
    field.innerHTML = fieldHTML;
}

// Выполнение хода
function executeDemoTurn(dragon, wizards, turnNum) {
    const log = document.getElementById('demo-battle-log');
    
    // Ход магов
    const aliveWizards = wizards.filter(w => w.hp > 0);
    aliveWizards.forEach(wizard => {
        const damage = Math.floor(wizard.damage.min + Math.random() * (wizard.damage.max - wizard.damage.min));
        dragon.hp = Math.max(0, dragon.hp - damage);
        
        const spellName = ['Огненный шар', 'Ледяная стрела', 'Молния', 'Каменный шип'][Math.floor(Math.random() * 4)];
        log.innerHTML += `<div>🧙‍♂️ ${wizard.name} использует ${spellName} (${damage} урона)</div>`;
    });
    
    // Ход дракона
    if (dragon.hp > 0 && aliveWizards.length > 0) {
        const target = aliveWizards[Math.floor(Math.random() * aliveWizards.length)];
        const damage = Math.floor(DEMO_CONFIG.dragonDamage.min + Math.random() * (DEMO_CONFIG.dragonDamage.max - DEMO_CONFIG.dragonDamage.min));
        target.hp = Math.max(0, target.hp - damage);
        
        const attackName = ['Огненное дыхание', 'Удар хвостом', 'Укус', 'Удар крылом'][Math.floor(Math.random() * 4)];
        log.innerHTML += `<div style="color: #ff6666;">🐉 Дракон использует ${attackName} на ${target.name} (${damage} урона)</div>`;
        
        if (target.hp <= 0) {
            log.innerHTML += `<div style="color: #ff4444;">💀 ${target.name} повержен!</div>`;
        }
    }
    
    log.scrollTop = log.scrollHeight;
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
    if (winner === 'dragon') {
        log.innerHTML += `<div style="color: #ff6666; font-size: 18px; margin-top: 10px;">🐉 ДРАКОН ПОБЕДИЛ! Маги пали в битве...</div>`;
    } else {
        log.innerHTML += `<div style="color: #66ff66; font-size: 18px; margin-top: 10px;">🎉 НЕВЕРОЯТНО! Маги одолели дракона!</div>`;
    }
    
    setTimeout(() => {
        closeDemoBattle();
    }, 3000);
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
    if (window.demoBattleInterval) {
        clearInterval(window.demoBattleInterval);
        DEMO_CONFIG.battleSpeed = 500;
        // Перезапуск с новой скоростью
        window.demoBattleInterval = setInterval(() => {
            // ... логика хода
        }, DEMO_CONFIG.battleSpeed);
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