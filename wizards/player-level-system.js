// player-level-system.js - Система общего уровня игрока

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

    // Проверяем, не активен ли portrait blocker
    if (document.getElementById('portrait-blocker-overlay')) {
        console.log('⏳ Portrait blocker активен, откладываем создание аватара');
        return;
    }

    const playerLevel = calculatePlayerLevel();

    // Вычисляем положение города
    const cityView = document.getElementById('city-view');
    const backgroundImg = cityView?.querySelector('.city-background-img');

    let leftPosition = '10px'; // Дефолт

    if (backgroundImg) {
        const imgRect = backgroundImg.getBoundingClientRect();
        // Проверяем что изображение видимо (имеет ширину)
        if (imgRect.width > 0 && imgRect.left >= 0) {
            leftPosition = `${imgRect.left + 10}px`;
            console.log(`📍 Аватар привязан к городу: left = ${leftPosition}`);
        } else {
            console.log('⚠️ Фон города скрыт, используем дефолтную позицию');
        }
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
            background: rgba(0, 0, 0, 0.4);
            padding: 8px 12px;
            border-radius: 25px;
            border: 1px solid rgba(114, 137, 218, 0.5);
            cursor: pointer;
            transition: all 0.3s;
            z-index: 5000;
            backdrop-filter: blur(5px);
        " onclick="showPlayerProfile()">
            ${avatarContent}
            <div>
                <div style="color: white; font-size: 14px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    ${typeof window.getCurrentPlayerDisplayName === 'function' ? window.getCurrentPlayerDisplayName() : (window.userData.username || 'Игрок')}
                </div>
                <div style="color: #ffa500; font-size: 12px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
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
}

// Показать профиль игрока с фоном как у башни магов
function showPlayerProfile() {
    console.log('👤 Открытие профиля игрока с фоном');

    // Скрываем аватар игрока (сам себя)
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

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

    // Определяем фракцию игрока для фона
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    // Закрываем предыдущие модалки
    if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('player-profile-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем экран с фоном
    const screen = document.createElement('div');
    screen.id = 'player-profile-screen';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="profile-bg-image" id="profile-bg-image" src="${imagePath}" alt="Профиль" style="
                max-width: 90vw;
                max-height: 90vh;
                object-fit: contain;
            ">
            <div class="profile-ui-overlay" id="profile-ui-overlay"></div>
        </div>
    `;

    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('profile-bg-image');

    // Функция настройки UI после загрузки изображения
    const setupProfileUI = () => {
        const overlay = document.getElementById('profile-ui-overlay');
        if (!img || !overlay) return;

        const rect = img.getBoundingClientRect();

        overlay.style.cssText = `
            position: absolute;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
        `;

        // Масштаб для координат (базовый размер 768x512)
        const scaleX = rect.width / 768;
        const scaleY = rect.height / 512;

        // Контентная область (расширена для большего текста)
        const contentArea = {
            x: 115 * scaleX,
            y: 60 * scaleY,
            width: (655 - 115) * scaleX,
            height: (430 - 60) * scaleY
        };

        // Создаём контейнер для контента
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            left: ${contentArea.x}px;
            top: ${contentArea.y}px;
            width: ${contentArea.width}px;
            height: ${contentArea.height}px;
            overflow-y: auto;
            padding: 12px;
            box-sizing: border-box;
            pointer-events: auto;
            color: white;
        `;

        // Иконка фракции
        const factionIcon = faction === 'fire' ? '🔥' :
                            faction === 'water' ? '💧' :
                            faction === 'wind' ? '💨' :
                            faction === 'earth' ? '🪨' :
                            faction === 'nature' ? '🌿' :
                            faction === 'poison' ? '☠️' : '⭐';

        const factionName = faction === 'fire' ? 'Огонь' :
                            faction === 'water' ? 'Вода' :
                            faction === 'wind' ? 'Ветер' :
                            faction === 'earth' ? 'Земля' :
                            faction === 'nature' ? 'Природа' :
                            faction === 'poison' ? 'Яд' : faction;

        container.innerHTML = `
            <!-- Заголовок: имя и уровень -->
            <div style="text-align: center; margin-bottom: ${10 * scaleY}px;">
                <div style="color: white; font-size: ${Math.max(22, 29 * scaleY)}px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    ${typeof window.getCurrentPlayerDisplayName === 'function' ? window.getCurrentPlayerDisplayName() : (userData.username || 'Игрок')}
                </div>
                <div style="color: #ffa500; font-size: ${Math.max(17, 22 * scaleY)}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    ⭐ Уровень ${level} • ${factionIcon} ${factionName}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${10 * scaleX}px;">
                <!-- Левая колонка - Статистика боев -->
                <div style="padding: ${10 * scaleY}px;">
                    <h4 style="margin: 0 0 ${6 * scaleY}px 0; color: #7289da; font-size: ${Math.max(16, 19 * scaleY)}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">⚔️ Статистика боев</h4>
                    <div style="font-size: ${Math.max(14, 17 * scaleY)}px; line-height: 1.4; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                        <div>🎯 Рейтинг: <strong style="color: #ffa500;">${leagueInfo}</strong></div>
                        <div>📊 Боев: <strong>${totalBattles}</strong></div>
                        <div>🏆 <strong style="color: #4CAF50;">${wins}</strong> / 💀 <strong style="color: #f44336;">${losses}</strong></div>
                        <div>📈 Винрейт: <strong>${winRate}%</strong></div>
                    </div>
                </div>

                <!-- Правая колонка - Прогресс -->
                <div style="padding: ${10 * scaleY}px;">
                    <h4 style="margin: 0 0 ${6 * scaleY}px 0; color: #7289da; font-size: ${Math.max(16, 19 * scaleY)}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">📚 Прогресс</h4>
                    <div style="font-size: ${Math.max(14, 17 * scaleY)}px; line-height: 1.4; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                        <div>📖 Заклинания: <strong>${breakdown.spells}</strong></div>
                        <div>🏛️ Здания: <strong>${breakdown.buildings}</strong></div>
                        <div>🧙‍♂️ Маги: <strong>${breakdown.wizards}</strong></div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.3); margin-top: ${5 * scaleY}px; padding-top: ${5 * scaleY}px;">
                            📊 Всего: <strong style="color: #ffa500;">${level}</strong> очков
                        </div>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(container);

        // Кнопка реферальной ссылки - сразу копирует
        const referralBtn = document.createElement('button');
        referralBtn.innerHTML = '🎁 Пригласи друга - получи награду!';
        referralBtn.style.cssText = `
            position: absolute;
            left: ${115 * scaleX}px;
            top: ${430 * scaleY}px;
            width: ${((655 - 115) / 2 - 5) * scaleX}px;
            height: ${40 * scaleY}px;
            background: rgba(74, 222, 128, 0.9);
            border: none;
            border-radius: ${6 * Math.min(scaleX, scaleY)}px;
            color: white;
            font-size: ${Math.max(9, 11 * Math.min(scaleX, scaleY))}px;
            font-weight: bold;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.2s;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;

        referralBtn.onmouseover = () => {
            referralBtn.style.background = 'rgba(60, 200, 110, 0.95)';
            referralBtn.style.transform = 'scale(1.02)';
        };
        referralBtn.onmouseout = () => {
            referralBtn.style.background = 'rgba(74, 222, 128, 0.9)';
            referralBtn.style.transform = 'scale(1)';
        };
        referralBtn.onclick = () => {
            if (window.referralManager && typeof window.referralManager.showReferralUI === 'function') {
                window.referralManager.showReferralUI();
            } else {
                if (typeof showInlineNotification === 'function') {
                    showInlineNotification('❌ Реферальная система загружается...');
                }
            }
        };

        overlay.appendChild(referralBtn);

        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '← Закрыть';
        closeBtn.style.cssText = `
            position: absolute;
            left: ${(115 + (655 - 115) / 2 + 5) * scaleX}px;
            top: ${430 * scaleY}px;
            width: ${((655 - 115) / 2 - 5) * scaleX}px;
            height: ${40 * scaleY}px;
            background: rgba(114, 137, 218, 0.9);
            border: none;
            border-radius: ${6 * Math.min(scaleX, scaleY)}px;
            color: white;
            font-size: ${Math.max(11, 13 * Math.min(scaleX, scaleY))}px;
            font-weight: bold;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.2s;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;

        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(90, 110, 189, 0.95)';
            closeBtn.style.transform = 'scale(1.02)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'rgba(114, 137, 218, 0.9)';
            closeBtn.style.transform = 'scale(1)';
        };
        closeBtn.onclick = () => {
            screen.remove();
            // Показываем аватар игрока
            const avatar = document.getElementById('player-avatar-container');
            if (avatar) {
                avatar.style.display = 'flex';
            }
        };

        overlay.appendChild(closeBtn);
    };

    // Настройка UI после загрузки изображения
    img.onload = setupProfileUI;
    if (img.complete) setupProfileUI();

    // Обработка ошибки загрузки
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон профиля, используем fallback');
        screen.remove();
        // Показываем аватар при ошибке
        const avatar = document.getElementById('player-avatar-container');
        if (avatar) {
            avatar.style.display = 'flex';
        }
        showPlayerProfileFallback(level, breakdown, totalBattles, wins, losses, rating, winRate, leagueInfo);
    };

    // Закрытие по клику на фон
    screen.onclick = (e) => {
        if (e.target === screen || e.target === screen.firstElementChild) {
            screen.remove();
            // Показываем аватар игрока
            const avatar = document.getElementById('player-avatar-container');
            if (avatar) {
                avatar.style.display = 'flex';
            }
        }
    };

    window.currentModal = { modal: screen, overlay: screen };
}

// Fallback профиль без фона
function showPlayerProfileFallback(level, breakdown, totalBattles, wins, losses, rating, winRate, leagueInfo) {
    const faction = window.userData?.faction || 'fire';
    const factionIcon = faction === 'fire' ? '🔥' :
                        faction === 'water' ? '💧' :
                        faction === 'wind' ? '💨' :
                        faction === 'earth' ? '🪨' :
                        faction === 'nature' ? '🌿' :
                        faction === 'poison' ? '☠️' : '⭐';
    const factionName = faction === 'fire' ? 'Огонь' :
                        faction === 'water' ? 'Вода' :
                        faction === 'wind' ? 'Ветер' :
                        faction === 'earth' ? 'Земля' :
                        faction === 'nature' ? 'Природа' :
                        faction === 'poison' ? 'Яд' : faction;

    const modalContent = `
        <div style="padding: 15px; max-width: 90vw; width: 420px; background: #2c2c3d; border-radius: 10px; color: white;">
            <!-- Заголовок: имя и уровень -->
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="color: white; font-size: 22px; font-weight: bold;">${typeof window.getCurrentPlayerDisplayName === 'function' ? window.getCurrentPlayerDisplayName() : (userData.username || 'Игрок')}</div>
                <div style="color: #ffa500; font-size: 16px;">⭐ Уровень ${level} • ${factionIcon} ${factionName}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <!-- Левая колонка -->
                <div style="background: #3d3d5c; padding: 12px; border-radius: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #7289da; font-size: 15px;">⚔️ Статистика боев</h4>
                    <div style="font-size: 14px; line-height: 1.5;">
                        <div>🎯 Рейтинг: <strong style="color: #ffa500;">${leagueInfo}</strong></div>
                        <div>📊 Боев: <strong>${totalBattles}</strong></div>
                        <div>🏆 Побед: <strong style="color: #4CAF50;">${wins}</strong> / 💀 <strong style="color: #f44336;">${losses}</strong></div>
                        <div>📈 Винрейт: <strong>${winRate}%</strong></div>
                    </div>
                </div>
                <!-- Правая колонка -->
                <div style="background: #3d3d5c; padding: 12px; border-radius: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #7289da; font-size: 15px;">📚 Прогресс</h4>
                    <div style="font-size: 14px; line-height: 1.5;">
                        <div>📖 Заклинания: <strong>${breakdown.spells}</strong></div>
                        <div>🏛️ Здания: <strong>${breakdown.buildings}</strong></div>
                        <div>🧙‍♂️ Маги: <strong>${breakdown.wizards}</strong></div>
                        <div style="border-top: 1px solid #555; margin-top: 6px; padding-top: 6px;">📊 Всего: <strong style="color: #ffa500;">${level}</strong></div>
                    </div>
                </div>
            </div>
            <button style="width: 100%; padding: 10px; margin-top: 15px; border: none; border-radius: 6px; background: #7289da; color: white; cursor: pointer; font-size: 15px;"
                    onclick="this.parentElement.parentElement.remove(); document.getElementById('profile-fallback-overlay')?.remove();">
                Закрыть
            </button>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10002;';

    const overlay = document.createElement('div');
    overlay.id = 'profile-fallback-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10001;';
    overlay.onclick = () => { modal.remove(); overlay.remove(); };

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
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