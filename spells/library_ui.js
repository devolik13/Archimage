// spells/library_ui.js - Полноэкранная библиотека v6.0 (с таймерами)

let currentLibrarySchool = null;
let libraryUpdateInterval = null;

// ========== ГЛАВНЫЙ ЭКРАН: 6 ШКОЛ ==========
function showLibrary() {
    console.log('📚 Открытие библиотеки');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    const cityView = document.getElementById('city-view');
    if (cityView) cityView.style.display = 'none';
    
    let libraryContainer = document.getElementById('library-fullscreen');
    if (!libraryContainer) {
        libraryContainer = document.createElement('div');
        libraryContainer.id = 'library-fullscreen';
        libraryContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1a1a2e;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;
        document.body.appendChild(libraryContainer);
    }
    
    showLibraryMainScreen();
}

function showLibraryMainScreen() {
    currentLibrarySchool = null;

    // Останавливаем автообновление
    if (libraryUpdateInterval) {
        clearInterval(libraryUpdateInterval);
        libraryUpdateInterval = null;
    }

    const libraryContainer = document.getElementById('library-fullscreen');
    if (!libraryContainer) return;
    
    libraryContainer.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img id="library-image" src="assets/ui/modals/library_template.webp" style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;" alt="Библиотека">
            <div id="library-clickable-zones" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
        </div>
    `;
    
    const img = document.getElementById('library-image');
    img.onload = () => setupLibraryClickableZones();
    if (img.complete) setupLibraryClickableZones();
}

function setupLibraryClickableZones() {
    const img = document.getElementById('library-image');
    const zonesContainer = document.getElementById('library-clickable-zones');
    if (!img || !zonesContainer) return;

    const originalWidth = 768, originalHeight = 512;
    const currentWidth = img.offsetWidth, currentHeight = img.offsetHeight;
    const scaleX = currentWidth / originalWidth, scaleY = currentHeight / originalHeight;

    zonesContainer.style.width = currentWidth + 'px';
    zonesContainer.style.height = currentHeight + 'px';
    zonesContainer.innerHTML = '';
    
    const zones = [
        { id: 'fire', coords: [55, 130, 220, 260], faction: 'fire' },
        { id: 'water', coords: [290, 130, 460, 255], faction: 'water' },
        { id: 'wind', coords: [535, 130, 700, 255], faction: 'wind' },
        { id: 'earth', coords: [55, 300, 220, 430], faction: 'earth' },
        { id: 'nature', coords: [290, 300, 460, 430], faction: 'nature' },
        { id: 'poison', coords: [535, 300, 700, 430], faction: 'poison' },
        { id: 'back', coords: [290, 440, 460, 500], faction: null }
    ];
    
    zones.forEach(zone => {
        const [x1, y1, x2, y2] = zone.coords;
        const zoneDiv = document.createElement('div');
        zoneDiv.style.cssText = `
            position: absolute;
            left: ${x1 * scaleX}px;
            top: ${y1 * scaleY}px;
            width: ${(x2 - x1) * scaleX}px;
            height: ${(y2 - y1) * scaleY}px;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Добавляем текст на каждую кнопку
        const fontSize = Math.max(14, 18 * Math.min(scaleX, scaleY));
        const schoolNames = {
            'fire': { name: 'Огонь', icon: '🔥', color: '#ff6b35' },
            'water': { name: 'Вода', icon: '💧', color: '#4da6ff' },
            'wind': { name: 'Ветер', icon: '💨', color: '#a0d8ef' },
            'earth': { name: 'Земля', icon: '🪨', color: '#8b7355' },
            'nature': { name: 'Природа', icon: '🌿', color: '#4ade80' },
            'poison': { name: 'Яд', icon: '☠️', color: '#9b59b6' },
            'back': { name: 'Назад', icon: '←', color: '#FFFFFF' }
        };

        const schoolInfo = schoolNames[zone.id];
        if (schoolInfo) {
            zoneDiv.innerHTML = `<div style="
                font-size: ${fontSize}px;
                color: ${schoolInfo.color};
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.8);
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                line-height: 1.2;
            ">${schoolInfo.name}</div>`;
        }

        // DEV: Подсветка кликабельных зон
        if (window.DEV_MODE) {
            zoneDiv.addEventListener('mouseenter', () => zoneDiv.style.background = 'rgba(114, 137, 218, 0.3)');
            zoneDiv.addEventListener('mouseleave', () => zoneDiv.style.background = 'transparent');
        }

        const clickHandler = () => {
            if (zone.faction) {
                openSchoolSpells(zone.faction);
            } else {
                closeLibrary();
            }
        };

        zoneDiv.addEventListener('click', clickHandler);
        zoneDiv.addEventListener('touchend', (e) => { e.preventDefault(); clickHandler(); });
        zonesContainer.appendChild(zoneDiv);
    });
}

// ========== ЭКРАН ШКОЛЫ: С ТАЙМЕРАМИ ==========
function openSchoolSpells(faction) {
    console.log('📖 Открытие школы:', faction);
    currentLibrarySchool = faction;

    const libraryContainer = document.getElementById('library-fullscreen');
    if (!libraryContainer) return;

    const factionName = window.getFactionName ? window.getFactionName(faction) : faction;

    // Получаем цвет школы из конфига
    const schoolConfig = window.SCHOOL_CONFIG?.[faction];
    const schoolColor = schoolConfig?.color || '#1a1a2e';

    // Создаем градиент на основе цвета школы
    const gradientBackground = `radial-gradient(ellipse at center, ${schoolColor}33 0%, ${schoolColor}11 50%, #0a0a15 100%)`;

    // Определяем картинку для каждой школы
    const spellsImage = `assets/ui/modals/spells_${faction}.webp`;

    libraryContainer.innerHTML = `
        <div id="spells-background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${gradientBackground};">
            <img id="spells-image" src="${spellsImage}" style="position: absolute; max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;" alt="${factionName}">
            <div id="faction-name-overlay" style="position: absolute; top: 0; left: 0; right: 0;"></div>
            <div id="spells-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
        </div>
    `;

    const img = document.getElementById('spells-image');

    // Fallback: если картинка не загрузилась - скрываем img и оставляем только градиент
    img.onerror = () => {
        console.log(`💡 Картинка для ${faction} не найдена, используем тематический фон`);
        img.style.display = 'none';
        // Градиент уже установлен, просто продолжаем
        setupSpellsScreen(faction);
        startLibraryAutoUpdate();
    };

    img.onload = () => {
        // Картинка загрузилась - показываем её поверх градиента
        setupSpellsScreen(faction);
        startLibraryAutoUpdate();
    };

    if (img.complete) {
        setupSpellsScreen(faction);
        startLibraryAutoUpdate();
    }
}

// Запустить автообновление библиотеки (для таймеров)
function startLibraryAutoUpdate() {
    // Очистить предыдущий интервал
    if (libraryUpdateInterval) {
        clearInterval(libraryUpdateInterval);
    }

    // Обновлять каждые 2 секунды если есть активное изучение
    libraryUpdateInterval = setInterval(() => {
        if (currentLibrarySchool) {
            const constructions = window.userData?.constructions || [];
            const hasActiveSpellLearning = constructions.some(c =>
                c.type === 'spell' &&
                c.faction === currentLibrarySchool &&
                c.time_remaining > 0
            );

            if (hasActiveSpellLearning) {
                setupSpellsScreen(currentLibrarySchool);
            }
        }
    }, 2000);
}

function setupSpellsScreen(faction) {
    const img = document.getElementById('spells-image');
    const overlay = document.getElementById('spells-overlay');
    const nameOverlay = document.getElementById('faction-name-overlay');
    const background = document.getElementById('spells-background');
    if (!overlay || !background) return;

    const originalWidth = 768, originalHeight = 512;

    // Используем размеры контейнера если картинка скрыта или не загружена
    let currentWidth, currentHeight;
    if (img && img.offsetWidth > 0 && img.offsetHeight > 0) {
        // Картинка есть и видна - используем её размеры
        currentWidth = img.offsetWidth;
        currentHeight = img.offsetHeight;
    } else {
        // Картинки нет - используем размеры контейнера
        const containerWidth = background.offsetWidth;
        const containerHeight = background.offsetHeight;

        // Вычисляем размеры с сохранением пропорций 768:512
        const aspectRatio = originalWidth / originalHeight;
        const containerRatio = containerWidth / containerHeight;

        if (containerRatio > aspectRatio) {
            // Контейнер шире - ограничиваемся по высоте
            currentHeight = containerHeight * 0.9; // 90% высоты
            currentWidth = currentHeight * aspectRatio;
        } else {
            // Контейнер выше - ограничиваемся по ширине
            currentWidth = containerWidth * 0.9; // 90% ширины
            currentHeight = currentWidth / aspectRatio;
        }
    }

    const scaleX = currentWidth / originalWidth;
    const scaleY = currentHeight / originalHeight;

    overlay.style.width = currentWidth + 'px';
    overlay.style.height = currentHeight + 'px';
    overlay.innerHTML = '';
    
    // Название школы
    const factionName = window.getFactionName ? window.getFactionName(faction) : faction;
    const factionColor = window.getFactionColor ? window.getFactionColor(faction) : '#7289da';
    nameOverlay.style.cssText = `
        position: absolute;
        top: ${30 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        font-size: ${32 * Math.min(scaleX, scaleY)}px;
        font-weight: bold;
        color: ${factionColor};
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    nameOverlay.textContent = factionName;
    
    // Получаем данные
    const factionSpells = (window.userData?.spells || {})[faction] || {};
    const spellIds = window.SPELL_TIERS ? window.SPELL_TIERS[faction] || [] : [];
    const constructions = window.userData?.constructions || [];
    
    // Находим активное изучение этой школы
    const activeSpellLearning = constructions.find(c => 
        c.type === 'spell' && 
        c.faction === faction && 
        c.time_remaining > 0
    );
    
    if (spellIds.length === 0) {
        overlay.innerHTML = '<div style="color: white; text-align: center;">Нет данных о заклинаниях</div>';
        return;
    }
    
    // === ЛОГИКА ПОСЛЕДОВАТЕЛЬНОСТИ (из старой версии) ===
    // Находим последнее изученное заклинание (с level > 0)
    let lastLearnedIndex = -1;
    for (let i = 0; i < spellIds.length; i++) {
        const spell = factionSpells[spellIds[i]];
        if (spell && spell.level > 0) {
            lastLearnedIndex = i;
        }
    }
    
    // Если ничего не изучено - начинаем с первого
    if (lastLearnedIndex === -1) {
        lastLearnedIndex = 0;
    }
    
    // Определяем активное заклинание
    const lastSpell = factionSpells[spellIds[lastLearnedIndex]];
    const isLastMaxLevel = lastSpell && lastSpell.level === 5;
    
    let activeIndex = lastLearnedIndex;
    if (isLastMaxLevel && lastLearnedIndex < spellIds.length - 1) {
        // Если текущее на макс уровне, следующее становится активным
        activeIndex = lastLearnedIndex + 1;
    }
    
    const nextIndex = activeIndex < spellIds.length - 1 ? activeIndex + 1 : -1;
    // === КОНЕЦ ЛОГИКИ ПОСЛЕДОВАТЕЛЬНОСТИ ===
    
    // Координаты 5 слотов
    const spellZones = [
        [30, 310, 145, 430],
        [178, 310, 290, 428],
        [325, 310, 440, 425],
        [480, 310, 590, 425],
        [625, 310, 740, 425]
    ];
    
    // Выводим все 5 заклинаний
    spellIds.forEach((spellId, tierIndex) => {
        if (tierIndex >= 5) return;
        
        const spell = factionSpells[spellId] || {
            name: window.getSpellNameById ? window.getSpellNameById(spellId) : spellId,
            level: 0,
            tier: tierIndex + 1
        };
        
        const [x1, y1, x2, y2] = spellZones[tierIndex];
        const fontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
        
        // Проверяем доступность:
        // - Активное (activeIndex) - всегда доступно
        // - Следующее (nextIndex) - показываем но недоступно
        // - Остальные - заблокированы
        const isActive = tierIndex === activeIndex;
        const isNext = tierIndex === nextIndex;
        const isAccessible = isActive || (isNext && spell.level > 0);
        const isLearning = activeSpellLearning && activeSpellLearning.spell_id === spellId;
        
        let status = '';
        let buttonHTML = '';
        
        if (isLearning) {
            // ИЗУЧАЕТСЯ
            status = '📖 Изучается...';
            const constructionIndex = constructions.indexOf(activeSpellLearning);
            buttonHTML = `
                <button 
                    style="
                        margin-top: 3px;
                        padding: ${3 * Math.min(scaleX, scaleY)}px ${6 * Math.min(scaleX, scaleY)}px;
                        border: none;
                        border-radius: 3px;
                        background: #555577;
                        color: white;
                        font-size: ${fontSize * 0.8}px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 85%;
                    "
                    onclick="showConstructionModal(${constructionIndex})"
                >⏱️ ${window.formatTimeCurrency ? window.formatTimeCurrency(activeSpellLearning.time_remaining) : activeSpellLearning.time_remaining}</button>
            `;
        } else if (tierIndex > activeIndex && !isLastMaxLevel) {
            // ЗАБЛОКИРОВАНО - не достигнут 5 уровень предыдущего
            status = '🔒 Заблокировано';
            buttonHTML = '<div style="font-size: ' + (fontSize * 0.7) + 'px; color: #777; margin-top: 3px;">Треб. Ур.5 предыдущего</div>';
        } else if (spell.level === 0 && isActive) {
            // НЕ ИЗУЧЕНО (активное)
            status = '🔒 Не изучено';
            const learnTime = window.SPELL_LEARNING_TIME?.getLearnTime ?
                window.SPELL_LEARNING_TIME.getLearnTime(tierIndex + 1, 0, faction) : 144;
            buttonHTML = `
                <button
                    style="
                        margin-top: 3px;
                        padding: ${12 * Math.min(scaleX, scaleY)}px ${6 * Math.min(scaleX, scaleY)}px;
                        border: none;
                        border-radius: 3px;
                        background: #7289da;
                        color: white;
                        font-size: ${fontSize * 0.75}px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 85%;
                    "
                    onclick="console.log('🔵 Клик Изучить:', '${spellId}', '${faction}'); showSpellInfoModal('${spellId}', '${faction}', ${spell.level || 0}, 'learn')"
                >Изучить (${window.formatTimeCurrency ? window.formatTimeCurrency(learnTime) : learnTime})</button>
            `;
        } else if (spell.level > 0 && spell.level < 5 && isActive) {
            // УЛУЧШИТЬ (активное)
            status = `Ур.${spell.level}/5`;
            const upgradeTime = window.SPELL_LEARNING_TIME?.getLearnTime ?
                window.SPELL_LEARNING_TIME.getLearnTime(tierIndex + 1, spell.level, faction) : 144;
            buttonHTML = `
                <button
                    style="
                        margin-top: 3px;
                        padding: ${12 * Math.min(scaleX, scaleY)}px ${6 * Math.min(scaleX, scaleY)}px;
                        border: none;
                        border-radius: 3px;
                        background: #ffa500;
                        color: white;
                        font-size: ${fontSize * 0.75}px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 85%;
                    "
                    onclick="console.log('🟠 Клик Улучшить:', '${spellId}', ${spell.level + 1}, '${faction}'); showSpellInfoModal('${spellId}', '${faction}', ${spell.level}, 'upgrade')"
                >Улучшить (${window.formatTimeCurrency ? window.formatTimeCurrency(upgradeTime) : upgradeTime})</button>
            `;
        } else if (spell.level === 5) {
            // МАКСИМАЛЬНЫЙ УРОВЕНЬ
            status = '✅ Макс. Ур.5';
            buttonHTML = '';
        } else if (spell.level > 0) {
            // ИЗУЧЕНО но неактивное
            status = `Ур.${spell.level}/5`;
            buttonHTML = '';
        } else {
            // НЕДОСТУПНО
            status = '🔒 Недоступно';
            buttonHTML = '';
        }
        
        const spellDiv = document.createElement('div');
        spellDiv.style.cssText = `
            position: absolute;
            left: ${x1 * scaleX}px;
            top: ${y1 * scaleY}px;
            width: ${(x2 - x1) * scaleX}px;
            height: ${(y2 - y1) * scaleY}px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            padding: 3px;
            box-sizing: border-box;
            opacity: ${(isActive || isLearning || spell.level === 5) ? '1' : '0.5'};
        `;
        
        spellDiv.innerHTML = `
            <div style="text-align: center; color: white; font-size: ${fontSize}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); line-height: 1.1; width: 100%;">
                <div style="font-weight: bold; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${spell.name}</div>
                <div style="font-size: ${fontSize * 0.85}px; color: #aaa; margin-bottom: 2px;">${status}</div>
                ${buttonHTML}
            </div>
        `;
        
        overlay.appendChild(spellDiv);
    });
    
    // Кнопка "Назад"
    const backZone = [290, 445, 480, 500];
    const [bx1, by1, bx2, by2] = backZone;
    const backDiv = document.createElement('div');
    backDiv.style.cssText = `
        position: absolute;
        left: ${bx1 * scaleX}px;
        top: ${by1 * scaleY}px;
        width: ${(bx2 - bx1) * scaleX}px;
        height: ${(by2 - by1) * scaleY}px;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${28 * Math.min(scaleX, scaleY)}px;
        font-weight: bold;
        color: #7289da;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;

    backDiv.textContent = 'Назад';

    // DEV: Подсветка кликабельной зоны
    if (window.DEV_MODE) {
        backDiv.addEventListener('mouseenter', () => {
            backDiv.style.background = 'rgba(114, 137, 218, 0.3)';
            backDiv.style.color = '#a0b5ff';
        });
        backDiv.addEventListener('mouseleave', () => {
            backDiv.style.background = 'transparent';
            backDiv.style.color = '#7289da';
        });
    }
    backDiv.addEventListener('click', showLibraryMainScreen);
    overlay.appendChild(backDiv);
}

function closeLibrary() {
    // Останавливаем автообновление
    if (libraryUpdateInterval) {
        clearInterval(libraryUpdateInterval);
        libraryUpdateInterval = null;
    }

    currentLibrarySchool = null;

    const libraryContainer = document.getElementById('library-fullscreen');
    if (libraryContainer) libraryContainer.remove();

    const cityView = document.getElementById('city-view');
    if (cityView) cityView.style.display = 'block';

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }

    // ВАЖНО: Показываем таймер исследования если есть активное изучение
    if (window.addSpellResearchVisualization) {
        setTimeout(() => {
            window.addSpellResearchVisualization();
        }, 300); // Задержка чтобы город успел отобразиться
    }
}

// Обновление контента библиотеки после изучения/улучшения
function updateLibraryContent() {
    
    // Если открыта школа - перерисовываем экран школы
    if (currentLibrarySchool) {
        openSchoolSpells(currentLibrarySchool);
    } else {
        // Если главный экран - перерисовываем его
        showLibraryMainScreen();
    }
}

function renderLibrary() {
    // Для совместимости со старым кодом
    if (currentLibrarySchool) {
        openSchoolSpells(currentLibrarySchool);
    } else {
        showLibrary();
    }
}

// ========== МОДАЛЬНОЕ ОКНО С ИНФОРМАЦИЕЙ О ЗАКЛИНАНИИ ==========
function showSpellInfoModal(spellId, faction, currentLevel, action) {
    // Получаем полную информацию о заклинании
    const spellData = window.SPELL_FULL_DATA?.[spellId];
    if (!spellData) {
        console.error('Данные заклинания не найдены:', spellId);
        // Fallback - вызываем старую функцию
        if (action === 'learn') {
            learnSpell(spellId, faction);
        } else {
            upgradeSpell(spellId, currentLevel + 1, faction);
        }
        return;
    }

    const targetLevel = action === 'learn' ? 1 : currentLevel + 1;
    const tierIndex = window.SPELL_TIERS?.[faction]?.indexOf(spellId) || 0;
    const tier = tierIndex + 1;

    // Рассчитываем время изучения
    const learnTime = window.SPELL_LEARNING_TIME?.getLearnTime ?
        window.SPELL_LEARNING_TIME.getLearnTime(tier, currentLevel, faction) : 144;

    // Рассчитываем урон на текущем и следующем уровне
    const currentDamage = currentLevel > 0 ? (window.getSpellDamage ? window.getSpellDamage(spellId, currentLevel) : 0) : 0;
    const nextDamage = window.getSpellDamage ? window.getSpellDamage(spellId, targetLevel) : 0;

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.id = 'spell-info-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: linear-gradient(145deg, #2c2c3d, #1a1a2e);
        border: 3px solid ${window.SCHOOL_CONFIG?.[faction]?.color || '#7289da'};
        border-radius: 15px;
        padding: 25px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: modalSlideIn 0.3s ease-out;
    `;

    modal.innerHTML = `
        <style>
            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>

        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${spellData.icon}</div>
            <h2 style="margin: 0; color: ${window.SCHOOL_CONFIG?.[faction]?.color || '#ffa500'};">
                ${spellData.name}
            </h2>
            <div style="color: #aaa; font-size: 14px; margin-top: 5px;">
                Школа: ${window.getFactionName ? window.getFactionName(faction) : faction} • Тир ${tier}
            </div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="color: #fff; font-size: 14px; line-height: 1.6;">
                ${spellData.description}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Тип</div>
                <div style="color: #fff; font-weight: bold;">${spellData.type === 'single_target' ? 'Одна цель' : spellData.type === 'aoe' ? 'Область' : 'Несколько целей'}</div>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Базовый урон</div>
                <div style="color: #ffa500; font-weight: bold; font-size: 18px;">${spellData.base_damage}💥</div>
            </div>
        </div>

        ${action === 'upgrade' && currentLevel > 0 ? `
            <div style="background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #ffa500; font-size: 13px; font-weight: bold; margin-bottom: 8px;">📈 При улучшении:</div>
                <div style="color: #fff; font-size: 14px;">
                    Урон: ${currentDamage}💥 → ${nextDamage}💥 (+${nextDamage - currentDamage})
                </div>
            </div>
        ` : ''}

        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="spell-cancel-btn" style="
                flex: 1;
                padding: 12px;
                background: #666;
                border: 2px solid #999;
                border-radius: 8px;
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            ">Отмена</button>

            <button id="spell-confirm-btn" style="
                flex: 2;
                padding: 12px;
                background: linear-gradient(to bottom, ${window.SCHOOL_CONFIG?.[faction]?.color || '#ffa500'}, ${window.SCHOOL_CONFIG?.[faction]?.color || '#ff8c00'});
                border: 2px solid ${window.SCHOOL_CONFIG?.[faction]?.color || '#ffa500'};
                border-radius: 8px;
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            ">${action === 'learn' ? '📖 Изучить' : '⬆️ Улучшить'} (${window.formatTimeCurrency ? window.formatTimeCurrency(learnTime) : learnTime})</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Обработчики кнопок
    document.getElementById('spell-cancel-btn').onclick = () => {
        console.log('🚫 Кнопка "Отмена" нажата, закрываем overlay');
        const overlayToRemove = document.getElementById('spell-info-overlay');
        if (overlayToRemove) {
            overlayToRemove.remove();
            console.log('✅ Overlay spell-info-overlay удалён');
        } else {
            console.error('❌ Не найден spell-info-overlay');
        }
    };

    document.getElementById('spell-confirm-btn').onclick = () => {
        overlay.remove();
        if (action === 'learn') {
            learnSpell(spellId, faction);
        } else {
            upgradeSpell(spellId, targetLevel, faction);
        }
    };

    // Закрытие по клику вне окна
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
}

// Экспорт
window.showLibrary = showLibrary;
window.closeLibrary = closeLibrary;
window.openSchoolSpells = openSchoolSpells;
window.updateLibraryContent = updateLibraryContent;
window.renderLibraryUI = updateLibraryContent; // Алиас для time-construction-system
window.renderLibrary = renderLibrary;
window.showSpellInfoModal = showSpellInfoModal;

