// pvp-arena-modal-bg.js - PvP арена с фоновым изображением

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
    
    // Проверяем построена ли арена
    const hasArena = window.userData?.buildings?.pvp_arena?.level > 0;
    
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
    arenaSelectedWizardId = null;

    const hasArena = window.userData?.buildings?.pvp_arena?.level > 0;
    
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
    
    // ОБЛАСТЬ КНОПОК (122,212 : 647,384)
    const buttonsArea = {
        x: 122 * scaleX,
        y: 212 * scaleY,
        width: (647 - 122) * scaleX,
        height: (384 - 212) * scaleY
    };
    
    // Массив кнопок главного меню
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
            text: '🏆 Рейтинг',
            onClick: () => {
                showArenaLeaderboard(); // Показываем рейтинг в том же окне
            },
            enabled: true,
            gold: true
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

// Утилита для рисования кнопок арены
function drawArenaButtons(buttons, buttonsArea, scaleX, scaleY, overlay) {
    const buttonCols = 2;
    const buttonRows = 2;
    const buttonWidth = buttonsArea.width / buttonCols;
    const buttonHeight = buttonsArea.height / buttonRows;
    
    const buttonFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
    const borderRadius = Math.max(4, 8 * Math.min(scaleX, scaleY));
    
    buttons.forEach((button, index) => {
        const col = index % buttonCols;
        const row = Math.floor(index / buttonCols);
        
        const buttonX = buttonsArea.x + col * buttonWidth;
        const buttonY = buttonsArea.y + row * buttonHeight;
        
        const btnElement = document.createElement('button');
        btnElement.style.cssText = `
            position: absolute;
            left: ${buttonX}px;
            top: ${buttonY}px;
            width: ${buttonWidth}px;
            height: ${buttonHeight}px;
            box-sizing: border-box;
            background: ${button.enabled ? 
                (button.highlight ? 'rgba(114, 137, 218, 0.3)' : 
                 button.gold ? 'rgba(255, 215, 0, 0.2)' :
                 button.green ? 'rgba(76, 175, 80, 0.2)' :
                 'rgba(255, 255, 255, 0.1)') : 
                'rgba(0, 0, 0, 0.3)'};
            border: 2px solid ${button.enabled ? 
                (button.highlight ? '#7289da' :
                 button.gold ? '#FFD700' :
                 button.green ? '#4CAF50' :
                 'rgba(255, 255, 255, 0.3)') : 
                'rgba(128, 128, 128, 0.3)'};
            color: ${button.enabled ? 
                (button.gold ? '#FFD700' :
                 button.green ? '#4CAF50' :
                 'white') : 
                '#666'};
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
            btnElement.onmouseover = () => {
                btnElement.style.background = button.highlight ? 'rgba(114, 137, 218, 0.5)' :
                                            button.gold ? 'rgba(255, 215, 0, 0.4)' :
                                            button.green ? 'rgba(76, 175, 80, 0.4)' :
                                            'rgba(255, 255, 255, 0.2)';
                btnElement.style.transform = 'scale(1.05)';
            };
            btnElement.onmouseout = () => {
                btnElement.style.background = button.highlight ? 'rgba(114, 137, 218, 0.3)' :
                                             button.gold ? 'rgba(255, 215, 0, 0.2)' :
                                             button.green ? 'rgba(76, 175, 80, 0.2)' :
                                             'rgba(255, 255, 255, 0.1)';
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
    arenaSelectedWizardId = null;

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
let arenaSelectedWizardId = null; // Глобальная переменная для выбранного мага

async function showArenaFormation() {
    const overlay = document.getElementById('arena-ui-overlay');
    if (!overlay) return;
    
    overlay.innerHTML = ''; // Очищаем текущий контент
    
    // Функция для расчета актуального HP мага (копия из wizard-detail-screen.js)
    function calculateActualHP(wizard) {
        const baseHP = wizard.original_max_hp || 100;
        const level = wizard.level || 1;
        const levelBonus = level === 20 ? 2.0 : (1 + (Math.max(0, level - 1) * 0.05));
        const healthMultiplier = window.applyWizardTowerHealthBonus ? 
            window.applyWizardTowerHealthBonus() : 1.0;
        
        // Проверяем благословения
        const activeBlessing = window.getActiveBlessing ? window.getActiveBlessing() : null;
        let blessingHealthBonus = 0;
        if (activeBlessing && activeBlessing.expires_at > Date.now()) {
            if (activeBlessing.effect.type === 'combined') {
                activeBlessing.effect.effects.forEach(effect => {
                    if (effect.type === 'health_bonus') {
                        blessingHealthBonus = effect.value;
                    }
                });
            } else if (activeBlessing.effect.type === 'health_bonus') {
                blessingHealthBonus = activeBlessing.effect.value;
            }
        }
        
        // Применяем все бонусы к HP (формула из wizard-detail-screen.js строка 120)
        return Math.floor(baseHP * levelBonus * healthMultiplier * (1 + blessingHealthBonus));
    }
    
    // Функция для расчета актуальной брони мага
    function calculateActualArmor(wizard) {
        const baseArmor = wizard.original_max_armor || wizard.max_armor || 100;
        
        // Проверяем благословения на бонус к броне
        const activeBlessing = window.getActiveBlessing ? window.getActiveBlessing() : null;
        let blessingArmorBonus = 0;
        if (activeBlessing && activeBlessing.expires_at > Date.now()) {
            if (activeBlessing.effect.type === 'combined') {
                activeBlessing.effect.effects.forEach(effect => {
                    if (effect.type === 'armor_bonus') {
                        blessingArmorBonus = effect.value;
                    }
                });
            } else if (activeBlessing.effect.type === 'armor_bonus') {
                blessingArmorBonus = activeBlessing.effect.value;
            }
        }
        
        return baseArmor + blessingArmorBonus;
    }
    
    // Функция для получения названий заклинаний из userData (как в wizard-detail-screen.js)
    function getSpellNames(wizard) {
        if (!wizard.spells || wizard.spells.length === 0) return '';
        
        const findSpellInUserData = window.findSpellInUserData || ((spellId, userSpells) => {
            if (!userSpells) return null;
            // Проверяем стандартные заклинания
            for (const faction in userSpells) {
                if (faction !== 'hybrid' && userSpells[faction] && userSpells[faction][spellId]) {
                    return userSpells[faction][spellId];
                }
            }
            // Проверяем гибридные заклинания
            if (userSpells.hybrid && userSpells.hybrid[spellId]) {
                return userSpells.hybrid[spellId];
            }
            return null;
        });
        
        // Берем названия заклинаний из userData
        const spellNames = wizard.spells.map(spellId => {
            const spellData = findSpellInUserData(spellId, window.userData?.spells);
            if (spellData && spellData.name) {
                return spellData.name;
            }
            return spellId; // Если не нашли - показываем ID
        });
        
        // Возвращаем строку с названиями
        return spellNames.join(', ');
    }
    
    // Функция для получения коротких названий для карточек (обрезаем если не помещается)
    function getShortSpellNames(wizard, maxLength = 25) {
        const fullNames = getSpellNames(wizard);
        if (!fullNames) return 'Без заклинаний';
        if (fullNames.length <= maxLength) {
            return fullNames;
        }
        // Обрезаем и добавляем многоточие
        return fullNames.substring(0, maxLength - 2) + '..';
    }
    
    // Функция для отображения заклинаний в два ряда
    function getSpellNamesInTwoRows(wizard) {
        if (!wizard.spells || wizard.spells.length === 0) return '';
        
        const findSpellInUserData = window.findSpellInUserData || ((spellId, userSpells) => {
            if (!userSpells) return null;
            for (const faction in userSpells) {
                if (faction !== 'hybrid' && userSpells[faction] && userSpells[faction][spellId]) {
                    return userSpells[faction][spellId];
                }
            }
            if (userSpells.hybrid && userSpells.hybrid[spellId]) {
                return userSpells.hybrid[spellId];
            }
            return null;
        });
        
        // Получаем первые 2 заклинания
        const spell1 = wizard.spells[0];
        const spell2 = wizard.spells[1];
        
        let row1 = '';
        let row2 = '';
        
        if (spell1) {
            const spellData1 = findSpellInUserData(spell1, window.userData?.spells);
            const name1 = spellData1?.name || spell1;
            // Обрезаем если слишком длинное
            row1 = name1.length > 18 ? name1.substring(0, 16) + '..' : name1;
        }
        
        if (spell2) {
            const spellData2 = findSpellInUserData(spell2, window.userData?.spells);
            const name2 = spellData2?.name || spell2;
            // Обрезаем если слишком длинное
            row2 = name2.length > 18 ? name2.substring(0, 16) + '..' : name2;
        }
        
        // Возвращаем в виде двух div'ов
        return `
            ${row1 ? `<div>${row1}</div>` : ''}
            ${row2 ? `<div>${row2}</div>` : ''}
        `;
    }
    
    // Создаем контейнер для расстановки
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        top: 5%;
        left: 5%;
        width: 90%;
        height: 85%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border: 2px solid rgba(114, 137, 218, 0.8);
        border-radius: 10px;
        padding: 15px;
        overflow-y: auto;
        color: white;
        pointer-events: auto;
        box-shadow: 0 0 20px rgba(114, 137, 218, 0.3);
    `;
    
    try {
        // Загружаем данные магов и расстановки
        if (!window.userData) {
            container.innerHTML = '<p style="color: #ff6b6b;">Данные не загружены</p>';
            overlay.appendChild(container);
            return;
        }
        
        const wizards = window.userData.wizards || [];
        const formation = window.userData.formation || [null, null, null, null, null];
        
        // Локальная функция для удаления из расстановки
        window.removeFromArenaFormation = function(position) {
            if (window.userData && window.userData.formation) {
                window.userData.formation[position] = null;
                showArenaFormation(); // Перерисовываем
            }
        };
        
        // Функция для добавления в расстановку
        window.addToArenaFormation = function(wizardId) {
            // Выбираем мага для размещения
            arenaSelectedWizardId = wizardId;
            showArenaFormation(); // Перерисовываем с выделением
        };
        
        // Функция для клика на позицию
        window.onPositionClick = function(position) {
            if (!window.userData || !window.userData.formation) return;
            
            if (arenaSelectedWizardId) {
                // Если есть выбранный маг - ставим его на позицию
                // Удаляем мага из других позиций если он уже есть
                const currentIndex = window.userData.formation.indexOf(arenaSelectedWizardId);
                if (currentIndex !== -1) {
                    window.userData.formation[currentIndex] = null;
                }
                // Ставим мага на новую позицию
                window.userData.formation[position] = arenaSelectedWizardId;
                arenaSelectedWizardId = null; // Сбрасываем выбор
                showArenaFormation(); // Перерисовываем
            } else if (window.userData.formation[position]) {
                // Если позиция занята и нет выбранного мага - убираем мага с позиции
                window.userData.formation[position] = null;
                showArenaFormation();
            }
        };
        
        // Генерируем HTML для позиций расстановки
        let formationHTML = '';
        for (let i = 0; i < 5; i++) {
            const wizardId = formation[i];
            const wizard = wizardId ? wizards.find(w => w.id === wizardId) : null;
            
            formationHTML += `
                <div style="
                    width: 100px;
                    height: 130px;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                    border: 2px solid rgba(114, 137, 218, 0.6);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                    ${arenaSelectedWizardId && !wizard ? 'border-color: #ffa500; box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);' : ''}
                " 
                onclick="onPositionClick(${i})"
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'"
                title="${wizard ? `Клик - убрать ${wizard.name}` : (arenaSelectedWizardId ? 'Клик - поставить выбранного мага сюда' : 'Сначала выберите мага снизу')}">
                    ${wizard ? `
                        <div style="text-align: center;">
                            <div style="font-weight: bold; font-size: 12px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${wizard.name}</div>
                            <div style="font-size: 10px; color: #aaa;">Ур.${wizard.level || 1}</div>
                            <div style="font-size: 10px; color: #4ade80;">
                                HP: ${calculateActualHP(wizard)}
                                ${wizard.level > 1 ? ` <span style="font-size: 8px; color: #4ade80;">(+${((wizard.level - 1) * 5)}%)</span>` : ''}
                            </div>
                            <div style="font-size: 10px; color: #7289da;">
                                AR: ${calculateActualArmor(wizard)}
                            </div>
                            ${wizard.spells && wizard.spells.length > 0 ? 
                                `<div style="font-size: 8px; color: #ffa500; margin-top: 2px; line-height: 1.2;">
                                    ${getSpellNamesInTwoRows(wizard)}
                                </div>` : 
                                '<div style="font-size: 8px; color: #777;">Нет заклинаний</div>'
                            }
                            <button style="
                                position: absolute;
                                top: 5px;
                                right: 5px;
                                background: rgba(255, 0, 0, 0.5);
                                border: none;
                                border-radius: 50%;
                                width: 20px;
                                height: 20px;
                                cursor: pointer;
                                color: white;
                                font-size: 12px;
                                line-height: 1;
                            " onclick="event.stopPropagation(); removeFromArenaFormation(${i})">×</button>
                        </div>
                    ` : `
                        <div style="color: #777; font-size: 12px;">Позиция ${i + 1}</div>
                    `}
                </div>
            `;
        }
        
        // Генерируем HTML для доступных магов
        let availableWizardsHTML = '';
        wizards.forEach(wizard => {
            const isAssigned = formation.includes(wizard.id);
            availableWizardsHTML += `
                <div style="
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                    border-radius: 8px;
                    padding: 6px;
                    cursor: ${isAssigned ? 'default' : 'pointer'};
                    border: 1px solid ${isAssigned ? 'rgba(85, 85, 85, 0.5)' : 'rgba(114, 137, 218, 0.7)'};
                    text-align: center;
                    width: 90px;
                    height: 100px;
                    opacity: ${isAssigned ? '0.5' : '1'};
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 4px;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                    ${arenaSelectedWizardId === wizard.id ? 'border-color: #ffa500; box-shadow: 0 0 10px rgba(255, 165, 0, 0.8);' : ''}
                " 
                onclick="${!isAssigned ? `addToArenaFormation('${wizard.id}')` : ''}"
                onmouseover="${!isAssigned ? `this.style.transform='scale(1.1)'` : ''}"
                onmouseout="${!isAssigned ? `this.style.transform='scale(1)'` : ''}"
                title="${wizard.name}${wizard.spells && wizard.spells.length > 0 ? ' - Заклинания: ' + getSpellNames(wizard) : ''}">
                    <div style="font-weight: bold; font-size: 10px; color: white;">${wizard.name}</div>
                    <div style="font-size: 9px; color: #aaa;">Ур.${wizard.level || 1}</div>
                    <div style="font-size: 9px; color: #4ade80;">HP: ${calculateActualHP(wizard)}</div>
                    <div style="font-size: 9px; color: #7289da;">AR: ${calculateActualArmor(wizard)}</div>
                    <div style="font-size: 8px; color: #ffa500; line-height: 1.1; margin-top: 2px;">
                        ${wizard.spells && wizard.spells.length > 0 ? getSpellNamesInTwoRows(wizard) : 'Без заклинаний'}
                    </div>
                    ${isAssigned ? '<div style="font-size: 8px; color: #7289da;">В строю</div>' : 
                      (arenaSelectedWizardId === wizard.id ? '<div style="font-size: 8px; color: #ffa500;">ВЫБРАН</div>' : '')}
                </div>
            `;
        });
        
        container.innerHTML = `
            <h3 style="margin-top: 0; color: #7289da;">⚔️ Расстановка войск</h3>
            <div style="font-size: 12px; color: #aaa; margin-bottom: 10px; text-align: center;">
                ${arenaSelectedWizardId ? 
                    '<span style="color: #ffa500;">🎯 Выберите позицию для выбранного мага</span>' : 
                    '<span>📍 Выберите мага снизу, затем позицию сверху</span>'
                }
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    ${formationHTML}
                </div>
            </div>
            
            <div>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                    ${availableWizardsHTML || '<p style="color: #777;">У вас нет магов</p>'}
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button style="
                    padding: 10px 20px;
                    background: #7289da;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 10px;
                " onclick="if(typeof saveBattleFormation === 'function') saveBattleFormation(); showArenaMainMenu();">
                    💾 Сохранить расстановку
                </button>
                <button style="
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid #ff6b6b;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="showArenaMainMenu()">
                    ← Назад к меню
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка при создании расстановки:', error);
        container.innerHTML = '<p style="color: #ff6b6b;">Ошибка загрузки расстановки</p>';
    }
    
    overlay.appendChild(container);
}

// Показать выбор противника внутри окна арены
async function showArenaOpponentSelection() {
    const overlay = document.getElementById('arena-ui-overlay');
    if (!overlay) return;
    
    overlay.innerHTML = ''; // Очищаем текущий контент
    
    // Создаем контейнер для выбора противника
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        top: 5%;
        left: 5%;
        width: 90%;
        height: 85%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border: 2px solid rgba(114, 137, 218, 0.8);
        border-radius: 10px;
        padding: 15px;
        overflow-y: auto;
        color: white;
        pointer-events: auto;
        box-shadow: 0 0 20px rgba(114, 137, 218, 0.3);
    `;
    
    // Показываем загрузку
    container.innerHTML = `
        <h3 style="margin-top: 0; color: #7289da;">⚔️ Выбор противника</h3>
        <div style="text-align: center; padding: 40px;">
            <p style="font-size: 18px; color: #7289da;">🔍 Поиск противников...</p>
            <p style="color: #aaa;">Подбираем достойных соперников</p>
        </div>
    `;
    
    overlay.appendChild(container);
    
    try {
        // Проверяем энергию
        if (window.userData?.battle_energy?.current === 0) {
            container.innerHTML = `
                <h3 style="margin-top: 0; color: #7289da;">⚔️ Выбор противника</h3>
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #ff6b6b; font-size: 18px;">⚡ Нет энергии для боя!</p>
                    <p style="color: #aaa;">Попытки восстанавливаются со временем</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button style="
                        padding: 10px 20px;
                        background: rgba(255, 0, 0, 0.2);
                        border: 1px solid #ff6b6b;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-weight: bold;
                    " onclick="showArenaMainMenu()">
                        ← Назад к меню
                    </button>
                </div>
            `;
            return;
        }
        
        // Получаем рейтинг игрока
        const playerRating = window.userData?.rating || 1200;
        
        // Загружаем противников из Supabase
        let opponents = [];
        if (typeof window.getOpponentsList === 'function') {
            opponents = await window.getOpponentsList(playerRating, 4);
        }
        
        if (opponents && opponents.length > 0) {
            // Сохраняем список для доступа по индексу
            window.currentOpponentsList = opponents;
            
            // Генерируем HTML для противников
            let opponentsHTML = '';
            opponents.forEach((opponent, index) => {
                const ratingDiff = opponent.rating - playerRating;
                const ratingChange = typeof window.calculateRatingChange === 'function'
                    ? window.calculateRatingChange(playerRating, opponent.rating, 'win')
                    : 25;
                    
                const diffColor = ratingDiff > 0 ? '#f44336' : ratingDiff < 0 ? '#4CAF50' : '#aaa';
                const diffText = ratingDiff > 0 ? `+${ratingDiff}` : ratingDiff;
                
                const leagueInfo = typeof window.formatRating === 'function'
                    ? window.formatRating(opponent.rating)
                    : `⭐ ${opponent.rating}`;
                
                opponentsHTML += `
                    <div style="
                        background: rgba(0, 0, 0, 0.3);
                        backdrop-filter: blur(3px);
                        -webkit-backdrop-filter: blur(3px);
                        border: 2px solid rgba(114, 137, 218, 0.6);
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    " 
                    onmouseover="this.style.background='rgba(114, 137, 218, 0.2)'; this.style.borderColor='#8ba0ff'; this.style.transform='scale(1.02)'"
                    onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.borderColor='rgba(114, 137, 218, 0.6)'; this.style.transform='scale(1)'"
                    onclick="if(typeof selectOpponent === 'function') { closePvPArenaModalBg(); selectOpponent(${index}); }">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                                    ${opponent.username || 'Безымянный маг'}
                                </div>
                                <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                    ${leagueInfo}
                                </div>
                                <div style="font-size: 12px;">
                                    <span style="color: #4CAF50;">${opponent.wins || 0}W</span> /
                                    <span style="color: #f44336;">${opponent.losses || 0}L</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 14px; color: ${diffColor}; font-weight: bold; margin-bottom: 5px;">
                                    ${diffText}
                                </div>
                                <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                                    Уровень: ${opponent.level || 1}
                                </div>
                                <div style="font-size: 14px; color: #ffa500; font-weight: bold;">
                                    ${ratingChange > 0 ? '+' : ''}${ratingChange} 🎯
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            <button style="
                                padding: 5px 15px;
                                background: #7289da;
                                border: none;
                                border-radius: 4px;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                            " onclick="event.stopPropagation(); if(typeof selectOpponent === 'function') { closePvPArenaModalBg(); selectOpponent(${index}); }">
                                ⚔️ В БОЙ!
                            </button>
                        </div>
                    </div>
                `;
            });
            
            // Обновляем контейнер с противниками
            container.innerHTML = `
                <h3 style="margin-top: 0; color: #7289da;">⚔️ Выбор противника</h3>
                
                <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 12px; color: #aaa;">Ваш рейтинг</div>
                            <div style="font-size: 20px; color: #ffa500; font-weight: bold;">${playerRating}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: #aaa;">Энергия</div>
                            <div style="font-size: 20px; color: #4ade80; font-weight: bold;">
                                ⚡ ${window.userData?.battle_energy?.current || 0}/${window.userData?.battle_energy?.max || 12}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    ${opponentsHTML}
                </div>
                
                <div style="text-align: center;">
                    <button style="
                        padding: 10px 20px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-weight: bold;
                        margin-right: 10px;
                    " onclick="showArenaOpponentSelection()">
                        🔄 Обновить список
                    </button>
                    <button style="
                        padding: 10px 20px;
                        background: rgba(255, 0, 0, 0.2);
                        border: 1px solid #ff6b6b;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-weight: bold;
                    " onclick="showArenaMainMenu()">
                        ← Назад к меню
                    </button>
                </div>
            `;
            
        } else {
            container.innerHTML = `
                <h3 style="margin-top: 0; color: #7289da;">⚔️ Выбор противника</h3>
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #ff6b6b; font-size: 18px;">❌ Противники не найдены</p>
                    <p style="color: #aaa;">Попробуйте обновить список</p>
                </div>
                <div style="text-align: center;">
                    <button style="
                        padding: 10px 20px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-weight: bold;
                        margin-right: 10px;
                    " onclick="showArenaOpponentSelection()">
                        🔄 Попробовать снова
                    </button>
                    <button style="
                        padding: 10px 20px;
                        background: rgba(255, 0, 0, 0.2);
                        border: 1px solid #ff6b6b;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-weight: bold;
                    " onclick="showArenaMainMenu()">
                        ← Назад к меню
                    </button>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки противников:', error);
        container.innerHTML = `
            <h3 style="margin-top: 0; color: #7289da;">⚔️ Выбор противника</h3>
            <div style="text-align: center; padding: 40px;">
                <p style="color: #ff6b6b; font-size: 18px;">❌ Ошибка загрузки</p>
                <p style="color: #aaa;">Не удалось загрузить список противников</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button style="
                    padding: 10px 20px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 10px;
                " onclick="showArenaOpponentSelection()">
                    🔄 Попробовать снова
                </button>
                <button style="
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid #ff6b6b;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="showArenaMainMenu()">
                    ← Назад к меню
                </button>
            </div>
        `;
    }
}

// Показать рейтинг внутри окна арены
async function showArenaLeaderboard() {
    const overlay = document.getElementById('arena-ui-overlay');
    if (!overlay) return;
    
    overlay.innerHTML = ''; // Очищаем текущий контент
    
    // Создаем контейнер для рейтинга
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        top: 5%;
        left: 5%;
        width: 90%;
        height: 85%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border: 2px solid rgba(255, 215, 0, 0.8);
        border-radius: 10px;
        padding: 15px;
        overflow-y: auto;
        color: white;
        pointer-events: auto;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
    `;
    
    // Показываем загрузку
    container.innerHTML = `
        <h3 style="margin-top: 0; color: #FFD700;">🏆 Рейтинг игроков</h3>
        <div style="text-align: center; padding: 40px;">
            <p style="font-size: 18px; color: #FFD700;">📊 Загрузка рейтинга...</p>
        </div>
    `;
    
    overlay.appendChild(container);
    
    try {
        // Данные игрока
        const playerRating = window.userData?.rating || 1000;
        const playerWins = window.userData?.wins || 0;
        const playerLosses = window.userData?.losses || 0;
        const playerTotalBattles = window.userData?.total_battles || 0;
        const playerWinRate = playerTotalBattles > 0 ? Math.round((playerWins / playerTotalBattles) * 100) : 0;
        
        // Лига игрока
        let playerLeagueInfo = '🔰 Адепт волшебства';
        if (typeof window.formatRating === 'function') {
            playerLeagueInfo = window.formatRating(playerRating);
        }
        
        // Загружаем топ игроков из Supabase
        let topPlayers = [];
        if (typeof window.getTopPlayers === 'function') {
            topPlayers = await window.getTopPlayers(10);
        }
        
        // Генерируем HTML для топ игроков
        let topPlayersHTML = '';
        if (topPlayers && topPlayers.length > 0) {
            topPlayersHTML = topPlayers.map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const leagueInfo = typeof window.formatRating === 'function'
                    ? window.formatRating(player.rating)
                    : `⭐ ${player.rating}`;
                    
                const winRate = player.total_battles > 0 
                    ? Math.round((player.wins / player.total_battles) * 100) 
                    : 0;
                
                const bgColor = index === 0 ? 'rgba(255, 215, 0, 0.1)' : 
                               index === 1 ? 'rgba(192, 192, 192, 0.1)' : 
                               index === 2 ? 'rgba(205, 127, 50, 0.1)' : 
                               'rgba(0, 0, 0, 0.3)';
                               
                const borderColor = index === 0 ? '#FFD700' : 
                                   index === 1 ? '#C0C0C0' : 
                                   index === 2 ? '#CD7F32' : 
                                   '#7289da';
                
                return `
                    <div style="
                        background: ${bgColor};
                        border: 2px solid ${borderColor};
                        border-radius: 8px;
                        padding: 10px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <div style="font-size: 20px; min-width: 30px; text-align: center;">${medal}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: white;">${player.username || 'Игрок'}</div>
                            <div style="font-size: 12px; color: #aaa;">${leagueInfo}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 14px; color: #FFD700; font-weight: bold;">${player.rating}</div>
                            <div style="font-size: 11px; color: #aaa;">
                                <span style="color: #4CAF50;">${player.wins}W</span> / 
                                <span style="color: #f44336;">${player.losses}L</span>
                                <span style="color: ${winRate >= 50 ? '#4CAF50' : '#ff6b6b'}; margin-left: 5px;">
                                    (${winRate}%)
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            topPlayersHTML = '<p style="color: #888; text-align: center; padding: 20px;">Пока нет других игроков</p>';
        }
        
        // Обновляем контейнер
        container.innerHTML = `
            <h3 style="margin-top: 0; color: #FFD700;">🏆 Рейтинг игроков</h3>
            
            <div style="display: flex; gap: 20px;">
                <!-- Левая колонка: Топ игроков -->
                <div style="flex: 2;">
                    <h4 style="color: #FFD700; font-size: 16px; margin-bottom: 15px;">🥇 Лучшие маги</h4>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${topPlayersHTML}
                    </div>
                </div>
                
                <!-- Правая колонка: Статистика игрока -->
                <div style="flex: 1;">
                    <h4 style="color: #7289da; font-size: 16px; margin-bottom: 15px;">📊 Ваша статистика</h4>
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12px; color: #aaa;">Рейтинг</div>
                            <div style="font-size: 24px; color: #ffa500; font-weight: bold;">${playerRating}</div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12px; color: #aaa;">Лига</div>
                            <div style="font-size: 14px; color: white;">${playerLeagueInfo}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                            <div>
                                <div style="font-size: 12px; color: #aaa;">Побед</div>
                                <div style="font-size: 18px; color: #4CAF50; font-weight: bold;">${playerWins}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #aaa;">Поражений</div>
                                <div style="font-size: 18px; color: #f44336; font-weight: bold;">${playerLosses}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #aaa;">Всего боёв</div>
                                <div style="font-size: 18px; color: white; font-weight: bold;">${playerTotalBattles}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #aaa;">Винрейт</div>
                                <div style="font-size: 18px; color: ${playerWinRate >= 50 ? '#4CAF50' : '#ff6b6b'}; font-weight: bold;">
                                    ${playerWinRate}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button style="
                    padding: 10px 20px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 10px;
                " onclick="showArenaLeaderboard()">
                    🔄 Обновить
                </button>
                <button style="
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid #ff6b6b;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="showArenaMainMenu()">
                    ← Назад к меню
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка загрузки рейтинга:', error);
        container.innerHTML = `
            <h3 style="margin-top: 0; color: #FFD700;">🏆 Рейтинг игроков</h3>
            <div style="text-align: center; padding: 40px;">
                <p style="color: #ff6b6b; font-size: 18px;">❌ Ошибка загрузки</p>
                <p style="color: #aaa;">Не удалось загрузить таблицу лидеров</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button style="
                    padding: 10px 20px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 10px;
                " onclick="showArenaLeaderboard()">
                    🔄 Попробовать снова
                </button>
                <button style="
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid #ff6b6b;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="showArenaMainMenu()">
                    ← Назад к меню
                </button>
            </div>
        `;
    }
}

// Показать результаты боя внутри окна арены
function showArenaResult(result, battleData = {}) {
    console.log('🏆 showArenaResult вызвана с фоном арены');
    console.log('   result:', result);
    console.log('   battleData:', battleData);

    const {
        opponentName = 'Противник',
        opponentRating = 1000,
        ratingChange = 0,
        rewards = {},
        battleDuration = 0,
        earlyExit = false
    } = battleData;

    const isWin = result === 'win';

    // Определяем цвета и иконки
    const titleColor = isWin ? '#4CAF50' : '#f44336';
    const titleIcon = isWin ? '🏆' : '💀';
    const titleText = isWin ? 'Вы выиграли!' : 'Вы проиграли!';

    // Форматируем изменение рейтинга
    const ratingChangeText = ratingChange > 0 ? `+${ratingChange}` : ratingChange;
    const ratingColor = ratingChange > 0 ? '#4CAF50' : ratingChange < 0 ? '#f44336' : '#aaa';

    // Новый рейтинг
    const currentRating = window.userData?.rating || 1000;
    const newRating = currentRating + ratingChange;

    // Лига
    let leagueInfo = `⭐ ${newRating}`;
    if (typeof window.formatRating === 'function') {
        leagueInfo = window.formatRating(newRating);
    }

    // Опыт для магов (если есть)
    const expGained = rewards.exp || 0;

    // Сначала открываем окно арены с фоном
    showPvPArenaModalBg();

    // Даём время на загрузку фона, потом показываем результат
    setTimeout(() => {
        const overlay = document.getElementById('arena-ui-overlay');
        if (!overlay) {
            console.error('❌ arena-ui-overlay не найден');
            return;
        }

        overlay.innerHTML = ''; // Очищаем

        // Создаем контейнер для результатов
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: 5%;
            left: 10%;
            width: 80%;
            height: 85%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 2px solid ${isWin ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'};
            border-radius: 15px;
            padding: 20px;
            overflow-y: auto;
            color: white;
            pointer-events: auto;
            box-shadow: 0 0 30px ${isWin ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'};
        `;

        container.innerHTML = `
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 56px; margin-bottom: 10px;">${titleIcon}</div>
                <h2 style="
                    margin: 0;
                    font-size: 28px;
                    color: ${titleColor};
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                ">${titleText}</h2>
            </div>

            <!-- Предупреждение о преждевременном выходе -->
            ${earlyExit ? `
                <div style="
                    background: rgba(255, 165, 0, 0.2);
                    border: 2px solid #ffa500;
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    text-align: center;
                ">
                    <div style="font-size: 14px; color: #ffa500; font-weight: bold; margin-bottom: 5px;">
                        ℹ️ Досрочный выход из боя
                    </div>
                    <div style="font-size: 12px; color: #ffd699; line-height: 1.4;">
                        Бой был просчитан до конца автоматически.
                    </div>
                </div>
            ` : ''}

            <!-- Информация о противнике -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 12px;
                border-radius: 10px;
                margin-bottom: 15px;
                text-align: center;
            ">
                <div style="font-size: 12px; color: #aaa; margin-bottom: 3px;">Противник</div>
                <div style="font-size: 18px; font-weight: bold; color: white;">${opponentName}</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 3px;">Рейтинг: ${opponentRating}</div>
            </div>

            <!-- Изменение рейтинга -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 15px;
            ">
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #aaa; margin-bottom: 3px;">Было</div>
                        <div style="font-size: 20px; color: #7289da; font-weight: bold;">${currentRating}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 28px; color: ${ratingColor}; font-weight: bold;">
                            ${ratingChangeText}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #aaa; margin-bottom: 3px;">Стало</div>
                        <div style="font-size: 20px; color: ${titleColor}; font-weight: bold;">${newRating}</div>
                    </div>
                </div>
                <div style="
                    text-align: center;
                    margin-top: 12px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                ">
                    <div style="font-size: 14px; color: #ffa500;">${leagueInfo}</div>
                </div>
            </div>

            ${expGained > 0 ? `
                <div style="
                    background: rgba(255, 165, 0, 0.15);
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    text-align: center;
                    border: 1px solid rgba(255, 165, 0, 0.4);
                ">
                    <div style="font-size: 12px; color: #ffa500; margin-bottom: 3px;">Опыт получен</div>
                    <div style="font-size: 20px; color: #ffa500; font-weight: bold;">+${expGained} XP</div>
                </div>
            ` : ''}

            <!-- Статистика -->
            <div style="
                background: rgba(0, 0, 0, 0.2);
                padding: 12px;
                border-radius: 10px;
                margin-bottom: 20px;
            ">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
                    <div>
                        <div style="font-size: 11px; color: #aaa;">Побед</div>
                        <div style="color: #4CAF50; font-size: 20px; font-weight: bold;">${window.userData?.wins || 0}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #aaa;">Поражений</div>
                        <div style="color: #f44336; font-size: 20px; font-weight: bold;">${window.userData?.losses || 0}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #aaa;">Всего боёв</div>
                        <div style="color: #7289da; font-size: 20px; font-weight: bold;">${window.userData?.total_battles || 0}</div>
                    </div>
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="arena-result-new-fight" style="
                    flex: 1;
                    max-width: 200px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    background: #7289da;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">
                    ⚔️ Новый бой
                </button>

                <button id="arena-result-return" style="
                    flex: 1;
                    max-width: 200px;
                    padding: 12px 20px;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.3);
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">
                    🏠 Вернуться
                </button>
            </div>
        `;

        overlay.appendChild(container);

        // Навешиваем обработчики на кнопки
        const newFightBtn = document.getElementById('arena-result-new-fight');
        const returnBtn = document.getElementById('arena-result-return');

        if (newFightBtn) {
            newFightBtn.onmouseover = () => {
                newFightBtn.style.background = '#5a6ebd';
                newFightBtn.style.transform = 'scale(1.05)';
            };
            newFightBtn.onmouseout = () => {
                newFightBtn.style.background = '#7289da';
                newFightBtn.style.transform = 'scale(1)';
            };
            newFightBtn.onclick = () => {
                console.log('🎮 Нажата кнопка "Новый бой" в окне арены');
                // Показываем выбор противника в том же окне арены
                showArenaOpponentSelection();
            };
        }

        if (returnBtn) {
            returnBtn.onmouseover = () => {
                returnBtn.style.background = 'rgba(255, 0, 0, 0.2)';
                returnBtn.style.borderColor = '#ff6b6b';
                returnBtn.style.transform = 'scale(1.05)';
            };
            returnBtn.onmouseout = () => {
                returnBtn.style.background = 'rgba(0, 0, 0, 0.3)';
                returnBtn.style.borderColor = '#7289da';
                returnBtn.style.transform = 'scale(1)';
            };
            returnBtn.onclick = () => {
                console.log('🏠 Нажата кнопка "Вернуться" в окне арены');
                closePvPArenaModalBg();
            };
        }

    }, 100);
}

// Экспортируем функции
window.showPvPArenaModalBg = showPvPArenaModalBg;
window.closePvPArenaModalBg = closePvPArenaModalBg;

console.log('🎮 PvP арена с фоном готова');

// Экспорт новых функций для глобального доступа
window.showArenaFormation = showArenaFormation;
window.showArenaOpponentSelection = showArenaOpponentSelection;
window.showArenaLeaderboard = showArenaLeaderboard;
window.showArenaMainMenu = showArenaMainMenu;
window.showArenaResult = showArenaResult;