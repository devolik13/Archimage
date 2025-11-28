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
    // Проверяем наличие userData
    if (!window.userData) {
        console.warn('⚠️ userData не загружена, уровень = 0');
        return 0;
    }

    let totalPoints = 0;

    // Очки за заклинания
    if (window.userData.spells) {
        ['fire', 'water', 'wind', 'earth', 'nature', 'poison'].forEach(faction => {
            if (window.userData.spells[faction]) {
                Object.values(window.userData.spells[faction]).forEach(spell => {
                    if (spell.level > 0) {
                        totalPoints += spell.level * PLAYER_LEVEL_CONFIG.SPELL_LEARNED;
                    }
                });
            }
        });
    }

    // Очки за здания
    if (window.userData.buildings) {
        Object.entries(window.userData.buildings).forEach(([key, building]) => {
            // Пропускаем специальные поля (массив строек)
            if (key === '_active_constructions') return;

            // Проверяем что это действительно здание с уровнем
            if (building && typeof building.level === 'number') {
                totalPoints += PLAYER_LEVEL_CONFIG.BUILDING_BUILT; // За само здание
                totalPoints += (building.level - 1) * PLAYER_LEVEL_CONFIG.BUILDING_LEVEL; // За улучшения
            }
        });
    }

    // Очки за магов
    if (window.userData.wizards) {
        totalPoints += window.userData.wizards.length * PLAYER_LEVEL_CONFIG.WIZARD_HIRED;
    }

    return totalPoints;
}

// Создание UI элемента аватара
function createPlayerAvatarUI() {
    if (!window.userData) {
        console.warn('⚠️ userData не загружена, аватар не создан');
        return;
    }

    const playerLevel = calculatePlayerLevel();

    // Вычисляем положение города
    const cityView = document.getElementById('city-view');
    const backgroundImg = cityView?.querySelector('.city-background-img');

    let leftPosition = '10px'; // Дефолт

    if (backgroundImg) {
        const imgRect = backgroundImg.getBoundingClientRect();
        leftPosition = `${imgRect.left + 10}px`;
        console.log(`📍 Аватар привязан к городу: left = ${leftPosition}`);
    }

    // Определяем аватар (реальное фото или дефолт)
    const avatarUrl = window.userData.avatar_url;
    let avatarContent = '';

    if (avatarUrl) {
        avatarContent = `
            <img src="${avatarUrl}"
                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            ">👤</div>
        `;
    } else {
        avatarContent = `
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            ">👤</div>
        `;
    }

    const avatarHTML = `
        <div id="player-avatar-container" style="
            position: fixed;
            top: 10px;
            left: ${leftPosition};
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(44, 44, 61, 0.95);
            padding: 8px 12px;
            border-radius: 25px;
            border: 2px solid #7289da;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 10001;
        " onclick="showPlayerProfile()">
            ${avatarContent}
            <div>
                <div style="color: white; font-size: 14px; font-weight: bold;">
                    ${window.userData.username || 'Игрок'}
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

    // Добавляем в body (fixed позиционирование)
    document.body.insertAdjacentHTML('beforeend', avatarHTML);
    console.log('✅ Аватар игрока добавлен');
}

// Показать профиль игрока
function showPlayerProfile() {
    const level = calculatePlayerLevel();
    const breakdown = getPointsBreakdown();

    // Статистика боев
    const totalBattles = userData.total_battles || 0;
    const wins = userData.wins || 0;
    const losses = userData.losses || 0;
    const rating = userData.rating || 1000;
    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;

    // Лига
    let leagueInfo = '🥉 Бронза';
    if (typeof window.formatRating === 'function') {
        leagueInfo = window.formatRating(rating);
    }

    const modalContent = `
        <div style="padding: 15px; max-width: 90vw; width: 600px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin: 0 0 15px 0; color: #7289da; text-align: center;">👤 Профиль игрока</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <!-- Левая колонка: Аватар + Имя + Статистика боев -->
                <div>
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 30px;
                            margin: 0 auto 8px;
                        ">
                            👤
                        </div>
                        <h4 style="color: white; margin: 5px 0; font-size: 14px;">${userData.username || 'Игрок'}</h4>
                        <div style="color: #ffa500; font-size: 16px;">⭐ Уровень ${level}</div>
                    </div>

                    <div style="background: #3d3d5c; padding: 10px; border-radius: 8px;">
                        <h4 style="margin: 0 0 8px 0; color: #7289da; font-size: 13px;">⚔️ Статистика боев:</h4>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <div>🎯 Рейтинг: <strong style="color: #ffa500;">${leagueInfo}</strong></div>
                            <div>📊 Всего: <strong>${totalBattles}</strong></div>
                            <div>🏆 Побед: <strong style="color: #4CAF50;">${wins}</strong></div>
                            <div>💀 Поражений: <strong style="color: #f44336;">${losses}</strong></div>
                            <div>📈 Винрейт: <strong>${winRate}%</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Правая колонка: Прогресс -->
                <div>
                    <div style="background: #3d3d5c; padding: 10px; border-radius: 8px;">
                        <h4 style="margin: 0 0 8px 0; color: #7289da; font-size: 13px;">📚 Прогресс:</h4>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <div>📖 Заклинания: <strong>${breakdown.spells}</strong> очков</div>
                            <div>🏛️ Здания: <strong>${breakdown.buildings}</strong> очков</div>
                            <div>🧙‍♂️ Маги: <strong>${breakdown.wizards}</strong> очков</div>
                            <hr style="border: 1px solid #555; margin: 8px 0;">
                            <div>📊 Всего: <strong style="color: #ffa500;">${level}</strong> очков</div>
                        </div>
                    </div>
                </div>
            </div>

            <button style="width: 100%; padding: 8px; margin-top: 15px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer; font-size: 13px;"
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
        Object.entries(userData.buildings).forEach(([key, building]) => {
            // Пропускаем специальные поля (массив строек)
            if (key === '_active_constructions') return;

            // Проверяем что это действительно здание с уровнем
            if (building && typeof building.level === 'number') {
                buildingPoints += PLAYER_LEVEL_CONFIG.BUILDING_BUILT;
                buildingPoints += (building.level - 1) * PLAYER_LEVEL_CONFIG.BUILDING_LEVEL;
            }
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