// player-level-system.js - Система общего уровня игрока
console.log('✅ player-level-system.js загружен');

// Конфигурация очков за достижения
const PLAYER_LEVEL_CONFIG = {
    SPELL_LEARNED: 1,      // За изученное заклинание
    BUILDING_BUILT: 1,     // За построенное здание  
    BUILDING_LEVEL: 1,     // За уровень здания
    WIZARD_HIRED: 10,      // За нанятого мага (изменил с 20 на 10 для баланса)
    ARMOR_CRAFTED: 5,      // За созданную броню (будущее)
    ARMOR_UPGRADED: 2      // За улучшение брони (будущее)
};

// Расчет общего уровня игрока
function calculatePlayerLevel() {
    let totalPoints = 0;
    
    // Очки за заклинания
    if (userData.spells) {
        ['fire', 'water', 'wind', 'earth', 'nature', 'poison'].forEach(faction => {
            if (userData.spells[faction]) {
                Object.values(userData.spells[faction]).forEach(spell => {
                    if (spell.level > 0) {
                        totalPoints += spell.level * PLAYER_LEVEL_CONFIG.SPELL_LEARNED;
                    }
                });
            }
        });
    }
    
    // Очки за здания
    if (userData.buildings) {
        Object.values(userData.buildings).forEach(building => {
            totalPoints += PLAYER_LEVEL_CONFIG.BUILDING_BUILT; // За само здание
            totalPoints += (building.level - 1) * PLAYER_LEVEL_CONFIG.BUILDING_LEVEL; // За улучшения
        });
    }
    
    // Очки за магов
    if (userData.wizards) {
        totalPoints += userData.wizards.length * PLAYER_LEVEL_CONFIG.WIZARD_HIRED;
    }
    
    return totalPoints;
}

// Создание UI элемента аватара
// Создание UI элемента аватара
function createPlayerAvatarUI() {
    const playerLevel = calculatePlayerLevel();
    
    const avatarHTML = `
        <div id="player-avatar-container" style="
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(44, 44, 61, 0.95);
            padding: 8px 12px;
            border-radius: 25px;
            border: 2px solid #7289da;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 100;
        " onclick="showPlayerProfile()">
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            ">
                👤
            </div>
            <div>
                <div style="color: white; font-size: 14px; font-weight: bold;">
                    ${userData.username || 'Игрок'}
                </div>
                <div style="color: #ffa500; font-size: 12px;">
                    ⭐ Уровень ${playerLevel}
                </div>
            </div>
        </div>
    `;
    
    // Удаляем старый если есть
    const oldAvatar = document.getElementById('player-avatar-container');
    if (oldAvatar) oldAvatar.remove();
    
    // Ищем контейнер - пробуем разные варианты
    let container = document.getElementById('city-view');
    if (!container) {
        container = document.getElementById('game-area');
    }
    if (!container) {
        container = document.querySelector('.game-container');
    }
    
    if (container) {
        container.insertAdjacentHTML('beforeend', avatarHTML);
        console.log('✅ Аватар игрока добавлен');
    } else {
        console.error('❌ Не найден контейнер для аватара');
    }
}

// Показать профиль игрока
function showPlayerProfile() {
    const level = calculatePlayerLevel();
    const breakdown = getPointsBreakdown();
    
    const modalContent = `
        <div style="padding: 20px; max-width: 400px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">👤 Профиль игрока</h3>
            
            <div style="text-align: center; margin: 20px 0;">
                <div style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    margin: 0 auto 10px;
                ">
                    👤
                </div>
                <h4 style="color: white; margin: 5px 0;">${userData.username || 'Игрок'}</h4>
                <div style="color: #ffa500; font-size: 20px;">⭐ Уровень ${level}</div>
            </div>
            
            <div style="background: #3d3d5c; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #7289da;">Источники очков:</h4>
                <div style="font-size: 14px; line-height: 1.8;">
                    <div>📖 Заклинания: <strong>${breakdown.spells}</strong> очков</div>
                    <div>🏛️ Здания: <strong>${breakdown.buildings}</strong> очков</div>
                    <div>🧙‍♂️ Маги: <strong>${breakdown.wizards}</strong> очков</div>
                    <hr style="border: 1px solid #555; margin: 10px 0;">
                    <div>📊 Всего: <strong style="color: #ffa500;">${level}</strong> очков</div>
                </div>
            </div>
            
            <button style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer;"
                    onclick="closeCurrentModal()">
                Закрыть
            </button>
        </div>
    `;
    
    // Показываем модалку
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }
    
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.padding = '20px';
    modal.style.borderRadius = '12px';
    modal.style.zIndex = '1000';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    window.currentModal = { modal, overlay };
}

// Получить разбивку очков
function getPointsBreakdown() {
    let spellPoints = 0;
    let buildingPoints = 0;
    let wizardPoints = 0;
    
    // Считаем заклинания
    if (userData.spells) {
        ['fire', 'water', 'wind', 'earth', 'nature', 'poison'].forEach(faction => {
            if (userData.spells[faction]) {
                Object.values(userData.spells[faction]).forEach(spell => {
                    if (spell.level > 0) {
                        spellPoints += spell.level * PLAYER_LEVEL_CONFIG.SPELL_LEARNED;
                    }
                });
            }
        });
    }
    
    // Считаем здания
    if (userData.buildings) {
        Object.values(userData.buildings).forEach(building => {
            buildingPoints += PLAYER_LEVEL_CONFIG.BUILDING_BUILT;
            buildingPoints += (building.level - 1) * PLAYER_LEVEL_CONFIG.BUILDING_LEVEL;
        });
    }
    
    // Считаем магов
    if (userData.wizards) {
        wizardPoints = userData.wizards.length * PLAYER_LEVEL_CONFIG.WIZARD_HIRED;
    }
    
    return {
        spells: spellPoints,
        buildings: buildingPoints,
        wizards: wizardPoints
    };
}

// Обновление уровня при изменениях
function updatePlayerLevel() {
    createPlayerAvatarUI();
}

// Экспорт
window.calculatePlayerLevel = calculatePlayerLevel;
window.createPlayerAvatarUI = createPlayerAvatarUI;
window.showPlayerProfile = showPlayerProfile;
window.updatePlayerLevel = updatePlayerLevel;
window.PLAYER_LEVEL_CONFIG = PLAYER_LEVEL_CONFIG;