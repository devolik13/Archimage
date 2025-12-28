// arena/arena-core.js - Основная логика PvP арены

// Показать окно PvP арены с фоном
function showPvPArenaModalBg() {
    console.log('🎮 Открытие PvP арены с фоном');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Закрываем предыдущие модальные окна
    if (typeof closeCurrentModal === 'function') {
        closeCurrentModal();
    }
    
    // Арена теперь доступна сразу без постройки
    const hasArena = true;
    
    // Регенерируем энергию
    if (typeof window.regenerateBattleEnergy === 'function') {
        window.regenerateBattleEnergy();
    }
    
    // Определяем фракцию игрока
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/arena/arena_${faction}.webp`;
    
    // Создаем или обновляем экран арены
    let screen = document.getElementById('pvp-arena-screen');
    if (screen) {
        screen.remove();
    }
    
    screen = document.createElement('div');
    screen.id = 'pvp-arena-screen';
    screen.className = 'pvp-arena-screen active';
    
    // Создаем HTML структуру по паттерну окна мага
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="arena-bg-image" id="arena-bg-image" src="${imagePath}" alt="PvP Арена">
            <div class="arena-ui-overlay" id="arena-ui-overlay"></div>
        </div>
    `;
    
    // Стили для экрана
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(screen);
    
    const img = document.getElementById('arena-bg-image');
    
    // Настройка UI после загрузки изображения
    img.onload = () => setupArenaUI();
    if (img.complete) setupArenaUI();
    
    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон арены, используем стандартное окно');
        screen.remove();
        if (typeof showPvPArenaModal === 'function') {
            showPvPArenaModal();
        }
    };
}

// Показать главное меню арены (основные кнопки)
function showArenaMainMenu() {
    const overlay = document.getElementById('arena-ui-overlay');
    if (!overlay) return;
    
    // Сбрасываем выбранного мага при возврате в меню
    window.arenaSelectedWizardId = null;

    // Арена теперь доступна сразу без постройки
    const hasArena = true;

    // Очищаем оверлей
    overlay.innerHTML = '';
    
    // Получаем масштаб из размеров оверлея
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = overlayRect.width / 768;
    const scaleY = overlayRect.height / 512;
    
    // ОБЛАСТЬ ИНФОРМАЦИИ О ПОПЫТКАХ (249,140 : 516,198)
    const energyArea = {
        x: 249 * scaleX,
        y: 140 * scaleY,
        width: (516 - 249) * scaleX,
        height: (198 - 140) * scaleY
    };
    
    // Получаем данные энергии
    let energyText = '';
    let energyColor = '#4ade80';
    let regenText = '';
    
    if (window.userData?.battle_energy) {
        if (typeof window.regenerateBattleEnergy === 'function') {
            window.regenerateBattleEnergy();
        }
        const current = window.userData.battle_energy.current;
        const max = window.userData.battle_energy.max;
        const timeToNext = typeof window.getTimeToNextRegen === 'function' ? window.getTimeToNextRegen() : 0;
        
        energyText = `⚡ Попытки: ${current}/${max}`;
        energyColor = current > 0 ? '#4ade80' : '#ff6b6b';
        
        if (current < max && timeToNext > 0) {
            const totalMinutes = Math.ceil(timeToNext / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            regenText = hours > 0 ? `След. через ${hours}ч ${minutes}м` : `След. через ${minutes}м`;
        }
    } else {
        energyText = '⚡ Попытки: 12/12';
    }
    
    // Создаем блок информации о попытках
    const energyDiv = document.createElement('div');
    energyDiv.style.cssText = `
        position: absolute;
        left: ${energyArea.x}px;
        top: ${energyArea.y}px;
        width: ${energyArea.width}px;
        height: ${energyArea.height}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        color: ${energyColor};
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    
    const fontSize = Math.max(14, 18 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(11, 14 * Math.min(scaleX, scaleY));
    
    energyDiv.innerHTML = `
        <div style="font-size: ${fontSize}px;">${energyText}</div>
        ${regenText ? `<div style="font-size: ${smallFontSize}px; color: #aaa; margin-top: 4px;">${regenText}</div>` : ''}
    `;
    
    overlay.appendChild(energyDiv);
    
    // ОБЛАСТЬ КНОПОК (122,186 : 647,384) - увеличено на 15% вверх
    const buttonsArea = {
        x: 122 * scaleX,
        y: 186 * scaleY,
        width: (647 - 122) * scaleX,
        height: (384 - 186) * scaleY
    };
    
    // Проверяем доступные награды за лиги
    const hasAvailableRewards = typeof window.getAvailableLeagueRewards === 'function' ?
        window.getAvailableLeagueRewards().length > 0 : false;

    // Массив кнопок главного меню (5 кнопок: 3 сверху, 2 снизу)
    const buttons = [
        {
            text: '🎯 Расставить войска',
            onClick: () => {
                showArenaFormation(); // Показываем расстановку в том же окне
            },
            enabled: true
        },
        {
            text: hasArena ? '⚔️ В бой (PvP)' : '⚔️ В бой 🔒',
            onClick: () => {
                if (!hasArena) {
                    alert('⚠️ Постройте Арену чтобы участвовать в PvP боях!');
                    return;
                }
                if (typeof checkFormationBeforeBattle === 'function' && !checkFormationBeforeBattle()) {
                    return;
                }
                showArenaOpponentSelection(); // Показываем выбор противника в том же окне
            },
            enabled: hasArena,
            highlight: hasArena
        },
        {
            text: hasAvailableRewards ? '🎁 Награды за лиги ✨' : '🏆 Рейтинг',
            onClick: () => {
                if (hasAvailableRewards && typeof window.showLeagueRewardsModal === 'function') {
                    closePvPArenaModalBg(); // Закрываем арену для модального окна наград
                    window.showLeagueRewardsModal();
                } else {
                    showArenaLeaderboard(); // Показываем рейтинг в том же окне
                }
            },
            enabled: true,
            gold: hasAvailableRewards ? false : true,
            orange: hasAvailableRewards // Новый цвет для доступных наград
        },
        {
            text: '⚔️ Испытание',
            onClick: () => {
                if (typeof window.showTrialMenuInArena === 'function') {
                    window.showTrialMenuInArena();
                } else {
                    alert('Система испытаний загружается...');
                }
            },
            enabled: true,
            purple: true // Фиолетовый цвет для испытания
        },
        {
            text: '🗺️ Приключения',
            onClick: () => {
                closePvPArenaModalBg(); // PvE закрывает окно арены
                if (typeof window.showAdventureHub === 'function') {
                    window.showAdventureHub();
                }
            },
            enabled: true,
            green: true
        }
    ];
    
    // Рисуем кнопки
    drawArenaButtons(buttons, buttonsArea, scaleX, scaleY, overlay);
    
    // КНОПКА НАЗАД (258,411 : 522,456)
    drawArenaBackButton(scaleX, scaleY, overlay, closePvPArenaModalBg, '← Закрыть');
}

// Утилита для рисования кнопок арены (поддержка 5 кнопок: 3+2)
function drawArenaButtons(buttons, buttonsArea, scaleX, scaleY, overlay) {
    const buttonFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
    const borderRadius = Math.max(4, 8 * Math.min(scaleX, scaleY));

    // Для 5 кнопок: 3 сверху, 2 снизу
    const totalButtons = buttons.length;
    const topRowCount = totalButtons <= 4 ? 2 : 3;
    const bottomRowCount = totalButtons - topRowCount;

    const buttonHeight = buttonsArea.height / 2;

    buttons.forEach((button, index) => {
        let buttonX, buttonY, buttonWidth;

        if (index < topRowCount) {
            // Верхний ряд
            buttonWidth = buttonsArea.width / topRowCount;
            buttonX = buttonsArea.x + index * buttonWidth;
            buttonY = buttonsArea.y;
        } else {
            // Нижний ряд (центрируем если меньше кнопок)
            const bottomIndex = index - topRowCount;
            buttonWidth = buttonsArea.width / bottomRowCount;
            const bottomRowWidth = buttonWidth * bottomRowCount;
            const bottomStartX = buttonsArea.x + (buttonsArea.width - bottomRowWidth) / 2;
            buttonX = bottomStartX + bottomIndex * buttonWidth;
            buttonY = buttonsArea.y + buttonHeight;
        }

        // Получаем цвета кнопки
        const bgColor = button.enabled ?
            (button.highlight ? 'rgba(114, 137, 218, 0.3)' :
             button.gold ? 'rgba(255, 215, 0, 0.2)' :
             button.orange ? 'rgba(255, 165, 0, 0.3)' :
             button.green ? 'rgba(76, 175, 80, 0.2)' :
             button.purple ? 'rgba(156, 39, 176, 0.3)' :
             'rgba(255, 255, 255, 0.1)') :
            'rgba(0, 0, 0, 0.3)';

        const borderColor = button.enabled ?
            (button.highlight ? '#7289da' :
             button.gold ? '#FFD700' :
             button.orange ? '#ffa500' :
             button.green ? '#4CAF50' :
             button.purple ? '#9c27b0' :
             'rgba(255, 255, 255, 0.3)') :
            'rgba(128, 128, 128, 0.3)';

        const textColor = button.enabled ?
            (button.gold ? '#FFD700' :
             button.orange ? '#ffa500' :
             button.green ? '#4CAF50' :
             button.purple ? '#ce93d8' :
             'white') :
            '#666';

        const btnElement = document.createElement('button');
        btnElement.style.cssText = `
            position: absolute;
            left: ${buttonX}px;
            top: ${buttonY}px;
            width: ${buttonWidth}px;
            height: ${buttonHeight}px;
            box-sizing: border-box;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            color: ${textColor};
            border-radius: ${borderRadius}px;
            font-size: ${buttonFontSize}px;
            font-weight: bold;
            cursor: ${button.enabled ? 'pointer' : 'not-allowed'};
            pointer-events: auto;
            transition: all 0.2s;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            opacity: ${button.enabled ? 1 : 0.5};
        `;

        btnElement.innerHTML = button.text;
        btnElement.onclick = button.onClick;

        if (button.enabled) {
            const hoverBg = button.highlight ? 'rgba(114, 137, 218, 0.5)' :
                           button.gold ? 'rgba(255, 215, 0, 0.4)' :
                           button.orange ? 'rgba(255, 165, 0, 0.5)' :
                           button.green ? 'rgba(76, 175, 80, 0.4)' :
                           button.purple ? 'rgba(156, 39, 176, 0.5)' :
                           'rgba(255, 255, 255, 0.2)';

            btnElement.onmouseover = () => {
                btnElement.style.background = hoverBg;
                btnElement.style.transform = 'scale(1.05)';
            };
            btnElement.onmouseout = () => {
                btnElement.style.background = bgColor;
                btnElement.style.transform = 'scale(1)';
            };
        }
        
        overlay.appendChild(btnElement);
    });
}

// Утилита для рисования кнопки "Назад"
function drawArenaBackButton(scaleX, scaleY, overlay, onClick, text = '← Назад') {
    const backX = 258 * scaleX;
    const backY = 411 * scaleY;
    const backWidth = (522 - 258) * scaleX;
    const backHeight = (456 - 411) * scaleY;
    
    const backFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
    const backBorderRadius = Math.max(4, 8 * Math.min(scaleX, scaleY));
    
    const backButton = document.createElement('button');
    backButton.style.cssText = `
        position: absolute;
        left: ${backX}px;
        top: ${backY}px;
        width: ${backWidth}px;
        height: ${backHeight}px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: ${backBorderRadius}px;
        font-size: ${backFontSize}px;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    
    backButton.innerHTML = text;
    backButton.onclick = onClick;
    
    backButton.onmouseover = () => {
        backButton.style.background = 'rgba(255, 0, 0, 0.2)';
        backButton.style.borderColor = 'rgba(255, 100, 100, 0.5)';
        backButton.style.transform = 'scale(1.05)';
    };
    
    backButton.onmouseout = () => {
        backButton.style.background = 'rgba(0, 0, 0, 0.3)';
        backButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        backButton.style.transform = 'scale(1)';
    };
    
    overlay.appendChild(backButton);
}

// Настройка UI арены с масштабированием (точный паттерн из city-clickable-system)
function setupArenaUI() {
    const img = document.getElementById('arena-bg-image');
    const overlay = document.getElementById('arena-ui-overlay');
    if (!img || !overlay) return;
    
    // Оригинальный размер фона
    const imageWidth = 768;
    const imageHeight = 512;
    
    // Определяем мобильное устройство
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
    
    // Размеры экрана
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Максимальный размер с учетом отступов (90% экрана)
    const maxWidth = screenWidth * 0.9;
    const maxHeight = screenHeight * 0.9;
    
    // Вычисляем масштаб с сохранением пропорций
    const scaleToFitWidth = maxWidth / imageWidth;
    const scaleToFitHeight = maxHeight / imageHeight;
    const scale = Math.min(scaleToFitWidth, scaleToFitHeight);
    
    // Применяем размеры к изображению
    const finalWidth = imageWidth * scale;
    const finalHeight = imageHeight * scale;
    
    img.style.width = `${finalWidth}px`;
    img.style.height = `${finalHeight}px`;
    
    // Получаем реальные размеры и позицию изображения после применения стилей
    const imgRect = img.getBoundingClientRect();
    
    // Рассчитываем масштаб и смещение для элементов UI
    const scaleX = imgRect.width / imageWidth;
    const scaleY = imgRect.height / imageHeight;
    const offsetX = imgRect.left;
    const offsetY = imgRect.top;
    
    // Настраиваем оверлей чтобы он покрывал изображение
    overlay.innerHTML = '';
    overlay.style.cssText = `
        position: fixed;
        top: ${offsetY}px;
        left: ${offsetX}px;
        width: ${imgRect.width}px;
        height: ${imgRect.height}px;
        pointer-events: none;
    `;
    
    // Показываем главное меню арены
    showArenaMainMenu();
}

// Закрыть окно PvP арены с фоном
function closePvPArenaModalBg() {
    // Сбрасываем выбранного мага при закрытии арены
    window.arenaSelectedWizardId = null;

    // Сбрасываем флаг показа результата (чтобы можно было показать результат следующего боя)
    window.arenaResultShown = false;
    window.battleResultShown = false;

    const screen = document.getElementById('pvp-arena-screen');
    if (screen) {
        screen.remove();
    }

    // Восстанавливаем видимость города если нужно
    const cityView = document.getElementById('city-view');
    if (cityView) {
        cityView.style.visibility = 'visible';
    }

    const bottomPanel = document.getElementById('bottom-control-panel');
    if (bottomPanel) {
        bottomPanel.style.visibility = 'visible';
    }

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    } else if (typeof window.createPlayerAvatarUI === 'function') {
        // Пересоздаём аватар если не существует
        window.createPlayerAvatarUI();
    }
}

// Заменяем стандартную функцию на новую с фоном
if (!window.originalShowPvPArenaModal) {
    window.originalShowPvPArenaModal = window.showPvPArenaModal;
}

window.showPvPArenaModal = function() {
    // Пробуем загрузить с фоном, если не получится - используем стандартную
    showPvPArenaModalBg();
};

// Показать расстановку войск внутри окна арены
// Глобальная переменная для выбранного мага (экспорт в window для доступа из arena-screens.js)
window.arenaSelectedWizardId = null;


// Экспорт функций
window.showPvPArenaModalBg = showPvPArenaModalBg;
window.closePvPArenaModalBg = closePvPArenaModalBg;
window.showArenaMainMenu = showArenaMainMenu;

console.log('🎮 Arena Core загружена');
