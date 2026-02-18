// spells/library_ui.js - Полноэкранная библиотека v7.0 (ОПТИМИЗИРОВАННАЯ)

let currentLibrarySchool = null;
let libraryUpdateInterval = null;
let currentLibraryPage = 0; // 0 = основные школы, 1 = некромантия

// === КЭШИРОВАНИЕ для быстрого открытия ===
let libraryCache = {
    container: null,           // Главный контейнер
    mainScreen: null,          // Главный экран (8 школ)
    schoolScreens: {},         // Кэш экранов школ: { fire: element, water: element, ... }
    initialized: false
};

// Страницы библиотеки
const LIBRARY_PAGES = [
    { image: 'assets/ui/modals/library_template.webp' },
    { image: 'assets/ui/modals/library_template-2.webp' }
];

// ========== ГЛАВНЫЙ ЭКРАН: 8 ШКОЛ ==========
function showLibrary() {
    console.log('📚 Открытие библиотеки');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    const cityView = document.getElementById('city-view');
    if (cityView) cityView.style.display = 'none';

    // ОПТИМИЗАЦИЯ: Проверяем кэш
    let libraryContainer = document.getElementById('library-fullscreen');

    if (libraryContainer && libraryCache.initialized) {
        // Кэш есть - просто показываем
        console.log('🚀 Библиотека: используем кэш (быстрое открытие)');
        libraryContainer.style.display = 'flex';
        showLibraryMainScreen(0);
        return;
    }

    // Создаём контейнер если нет
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
        libraryCache.container = libraryContainer;
        libraryCache.initialized = true;
    }

    showLibraryMainScreen(0);
}

function showLibraryMainScreen(page) {
    currentLibrarySchool = null;
    if (page !== undefined) currentLibraryPage = page;

    // Останавливаем автообновление
    if (libraryUpdateInterval) {
        clearInterval(libraryUpdateInterval);
        libraryUpdateInterval = null;
    }

    const libraryContainer = document.getElementById('library-fullscreen');
    if (!libraryContainer) return;

    const pageData = LIBRARY_PAGES[currentLibraryPage] || LIBRARY_PAGES[0];

    libraryContainer.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img id="library-image" src="${pageData.image}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;" alt="Библиотека">
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
    const btnScale = Math.min(scaleX, scaleY);

    zonesContainer.style.width = currentWidth + 'px';
    zonesContainer.style.height = currentHeight + 'px';
    zonesContainer.innerHTML = '';

    // === Кликабельные зоны зависят от страницы ===
    if (currentLibraryPage === 0) {
        // Страница 1: 8 основных школ
        const zones = [
            { id: 'fire', coords: [150, 70, 225, 225], faction: 'fire' },
            { id: 'water', coords: [255, 70, 340, 225], faction: 'water' },
            { id: 'earth', coords: [150, 230, 240, 360], faction: 'earth' },
            { id: 'wind', coords: [250, 235, 340, 350], faction: 'wind' },
            { id: 'nature', coords: [410, 70, 520, 230], faction: 'nature' },
            { id: 'poison', coords: [520, 70, 625, 225], faction: 'poison' },
            { id: 'light', coords: [410, 240, 515, 360], faction: 'light' },
            { id: 'dark', coords: [520, 240, 620, 360], faction: 'dark' }
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

            if (window.DEV_MODE) {
                zoneDiv.addEventListener('mouseenter', () => zoneDiv.style.background = 'rgba(114, 137, 218, 0.3)');
                zoneDiv.addEventListener('mouseleave', () => zoneDiv.style.background = 'transparent');
            }

            const clickHandler = () => openSchoolSpells(zone.faction);
            zoneDiv.addEventListener('click', clickHandler);
            zoneDiv.addEventListener('touchend', (e) => { e.preventDefault(); clickHandler(); });
            zonesContainer.appendChild(zoneDiv);
        });
    } else if (currentLibraryPage === 1) {
        // Страница 2: Некромантия — иконка черепа на левой странице
        const necroZone = document.createElement('div');
        necroZone.style.cssText = `
            position: absolute;
            left: ${170 * scaleX}px;
            top: ${100 * scaleY}px;
            width: ${140 * scaleX}px;
            height: ${220 * scaleY}px;
            cursor: pointer;
            transition: background 0.2s;
            border-radius: ${10 * btnScale}px;
        `;

        if (window.DEV_MODE) {
            necroZone.addEventListener('mouseenter', () => necroZone.style.background = 'rgba(112, 128, 144, 0.3)');
            necroZone.addEventListener('mouseleave', () => necroZone.style.background = 'transparent');
        }

        const openNecro = () => openSchoolSpells('necromant');
        necroZone.addEventListener('click', openNecro);
        necroZone.addEventListener('touchend', (e) => { e.preventDefault(); openNecro(); });
        zonesContainer.appendChild(necroZone);
    }

    // === Стрелки листания страниц (красные, крупные, жирные) ===
    const totalPages = LIBRARY_PAGES.length;

    // Индикатор страницы сверху (красный)
    const pageIndicator = document.createElement('div');
    pageIndicator.style.cssText = `
        position: absolute;
        top: ${12 * scaleY}px;
        left: 50%;
        transform: translateX(-50%);
        padding: ${4 * btnScale}px ${16 * btnScale}px;
        font-size: ${18 * btnScale}px;
        font-weight: bold;
        color: #ff4444;
        text-shadow: 0 0 8px rgba(255,50,50,0.5), 1px 1px 3px rgba(0,0,0,0.9);
        background: rgba(0,0,0,0.5);
        border: 1px solid rgba(255,50,50,0.5);
        border-radius: ${8 * btnScale}px;
        user-select: none;
        z-index: 10;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;
    pageIndicator.textContent = `Страница ${currentLibraryPage + 1}/${totalPages}`;
    zonesContainer.appendChild(pageIndicator);

    // Стрелка «влево» (предыдущая страница)
    if (currentLibraryPage > 0) {
        const leftArrow = document.createElement('div');
        leftArrow.style.cssText = `
            position: absolute;
            left: ${5 * scaleX}px;
            top: 50%;
            transform: translateY(-50%);
            width: ${60 * btnScale}px;
            height: ${100 * btnScale}px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${56 * btnScale}px;
            font-weight: 900;
            color: #ff4444;
            text-shadow: 0 0 12px rgba(255,50,50,0.7), 0 0 4px rgba(255,50,50,0.9), 2px 2px 4px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.45);
            border: 2px solid rgba(255,50,50,0.6);
            border-radius: ${10 * btnScale}px;
            user-select: none;
        `;
        leftArrow.textContent = '\u276E';
        const goLeft = () => showLibraryMainScreen(currentLibraryPage - 1);
        leftArrow.addEventListener('click', goLeft);
        leftArrow.addEventListener('touchend', (e) => { e.preventDefault(); goLeft(); });
        zonesContainer.appendChild(leftArrow);
    }

    // Стрелка «вправо» (следующая страница)
    if (currentLibraryPage < totalPages - 1) {
        const rightArrow = document.createElement('div');
        rightArrow.style.cssText = `
            position: absolute;
            right: ${5 * scaleX}px;
            top: 50%;
            transform: translateY(-50%);
            width: ${60 * btnScale}px;
            height: ${100 * btnScale}px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${56 * btnScale}px;
            font-weight: 900;
            color: #ff4444;
            text-shadow: 0 0 12px rgba(255,50,50,0.7), 0 0 4px rgba(255,50,50,0.9), 2px 2px 4px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.45);
            border: 2px solid rgba(255,50,50,0.6);
            border-radius: ${10 * btnScale}px;
            user-select: none;
        `;
        rightArrow.textContent = '\u276F';
        const goRight = () => showLibraryMainScreen(currentLibraryPage + 1);
        rightArrow.addEventListener('click', goRight);
        rightArrow.addEventListener('touchend', (e) => { e.preventDefault(); goRight(); });
        zonesContainer.appendChild(rightArrow);
    }

    // === Кнопка "Назад" ===
    const backBtn = document.createElement('div');
    backBtn.style.cssText = `
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: ${20 * scaleY}px;
        padding: ${10 * btnScale}px ${30 * btnScale}px;
        cursor: pointer;
        font-size: ${24 * btnScale}px;
        font-weight: bold;
        color: #7289da;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    backBtn.textContent = 'Назад';
    backBtn.addEventListener('click', closeLibrary);
    backBtn.addEventListener('touchend', (e) => { e.preventDefault(); closeLibrary(); });
    zonesContainer.appendChild(backBtn);
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

    // ОПТИМИЗАЦИЯ: Обновляем только таймеры, НЕ весь экран!
    libraryUpdateInterval = setInterval(() => {
        if (currentLibrarySchool) {
            const constructions = window.userData?.constructions || [];
            const activeSpellLearning = constructions.find(c =>
                c.type === 'spell' &&
                c.faction === currentLibrarySchool &&
                c.time_remaining > 0
            );

            if (activeSpellLearning) {
                // БЫСТРОЕ обновление - только текст таймера
                updateSpellTimerOnly(activeSpellLearning);
            } else {
                // Изучение завершено - нужно перерисовать чтобы показать кнопку "Улучшить"
                setupSpellsScreen(currentLibrarySchool);
                // Останавливаем интервал - больше нечего обновлять
                clearInterval(libraryUpdateInterval);
                libraryUpdateInterval = null;
            }
        }
    }, 1000); // Каждую секунду для более плавного таймера
}

// ОПТИМИЗАЦИЯ: Обновить только текст таймера (без пересоздания DOM)
function updateSpellTimerOnly(activeSpellLearning) {
    // Ищем кнопку с таймером по тексту ⏱️
    const overlay = document.getElementById('spells-overlay');
    if (!overlay) return;

    const timerButtons = overlay.querySelectorAll('button');
    for (const btn of timerButtons) {
        if (btn.textContent.includes('⏱️')) {
            // Нашли кнопку таймера - обновляем только текст
            const formattedTime = window.formatTimeCurrency ?
                window.formatTimeCurrency(activeSpellLearning.time_remaining) :
                activeSpellLearning.time_remaining;
            btn.textContent = `⏱️ ${formattedTime}`;
            return;
        }
    }
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
    nameOverlay.textContent = (faction === 'light' || faction === 'necromant') ? '' : factionName;
    
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
                        padding: ${12 * Math.min(scaleX, scaleY)}px ${6 * Math.min(scaleX, scaleY)}px;
                        border: none;
                        border-radius: 3px;
                        background: #555577;
                        color: white;
                        font-size: ${fontSize * 0.75}px;
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

        // Добавляем кнопку "Описание" для ВСЕХ заклинаний
        // Игроки должны видеть описание до изучения, чтобы решить куда тратить время
        const showInfoButton = true;
        const infoButtonHTML = showInfoButton ? `
            <button
                style="
                    margin-top: 4px;
                    padding: ${8 * Math.min(scaleX, scaleY)}px ${4 * Math.min(scaleX, scaleY)}px;
                    border: 1px solid #555;
                    border-radius: 3px;
                    background: rgba(50, 50, 70, 0.8);
                    color: #aaa;
                    font-size: ${fontSize * 0.65}px;
                    cursor: pointer;
                    width: 85%;
                "
                onclick="event.stopPropagation(); showSpellDescriptionModal('${spellId}', '${faction}')"
            >📋 Описание</button>
        ` : '';
        
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
                ${infoButtonHTML}
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
    backDiv.addEventListener('click', () => showLibraryMainScreen());
    overlay.appendChild(backDiv);
}

function closeLibrary() {
    // Останавливаем автообновление
    if (libraryUpdateInterval) {
        clearInterval(libraryUpdateInterval);
        libraryUpdateInterval = null;
    }

    currentLibrarySchool = null;

    // ОПТИМИЗАЦИЯ: Скрываем вместо удаления (для быстрого повторного открытия)
    const libraryContainer = document.getElementById('library-fullscreen');
    if (libraryContainer) {
        libraryContainer.style.display = 'none';
    }

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
        const overlayToRemove = document.getElementById('spell-info-overlay');
        if (overlayToRemove) {
            overlayToRemove.remove();
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

// ========== МОДАЛЬНОЕ ОКНО ОПИСАНИЯ ЗАКЛИНАНИЯ ==========
function showSpellDescriptionModal(spellId, faction) {
    const spellData = window.SPELL_FULL_DATA?.[spellId];
    if (!spellData) {
        console.error('Данные заклинания не найдены:', spellId);
        return;
    }

    const tierIndex = window.SPELL_TIERS?.[faction]?.indexOf(spellId) || 0;
    const tier = tierIndex + 1;
    const schoolColor = window.SCHOOL_CONFIG?.[faction]?.color || '#7289da';
    const factionName = window.getFactionName ? window.getFactionName(faction) : faction;

    // Получаем текущий уровень заклинания у игрока
    const userSpellData = window.userData?.spells?.[faction]?.[spellId];
    const currentLevel = userSpellData?.level || 0;

    // Рассчитываем урон для каждого уровня
    const damageByLevel = [];
    for (let lvl = 1; lvl <= 5; lvl++) {
        const damage = window.getSpellDamage ? window.getSpellDamage(spellId, lvl) : 0;
        damageByLevel.push(damage);
    }

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.id = 'spell-description-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: linear-gradient(145deg, #2c2c3d, #1a1a2e);
        border: 3px solid ${schoolColor};
        border-radius: 15px;
        padding: 20px;
        max-width: 420px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 30px ${schoolColor}33;
        animation: modalSlideIn 0.3s ease-out;
    `;

    // Определяем тип заклинания на русском
    const spellTypes = {
        'single_target': '🎯 Одна цель',
        'multi_target': '🎯🎯 Несколько целей',
        'aoe': '💥 Область'
    };
    const typeText = spellTypes[spellData.type] || spellData.type;

    // Генерируем таблицу урона по уровням
    let damageTableHTML = '';
    if (damageByLevel.some(d => d > 0)) {
        damageTableHTML = `
            <div style="margin-top: 15px;">
                <div style="color: #ffa500; font-weight: bold; margin-bottom: 10px; font-size: 14px;">⚔️ Урон по уровням:</div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;">
                    ${[1, 2, 3, 4, 5].map(lvl => {
                        const isCurrentLevel = lvl === currentLevel;
                        const isLearned = lvl <= currentLevel;
                        return `
                            <div style="
                                background: ${isCurrentLevel ? 'rgba(255, 165, 0, 0.3)' : 'rgba(0,0,0,0.3)'};
                                border: 2px solid ${isCurrentLevel ? '#ffa500' : (isLearned ? '#4ade80' : '#444')};
                                border-radius: 8px;
                                padding: 8px 4px;
                                text-align: center;
                            ">
                                <div style="color: #888; font-size: 11px;">Ур.${lvl}</div>
                                <div style="color: ${isLearned ? '#fff' : '#666'}; font-weight: bold; font-size: 16px;">
                                    ${damageByLevel[lvl - 1]}💥
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Генерируем HTML для эффектов
    let effectsHTML = '';
    if (spellData.effects) {
        effectsHTML = `
            <div style="margin-top: 15px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
                <div style="color: #9b59b6; font-weight: bold; margin-bottom: 8px; font-size: 14px;">✨ Эффекты:</div>
                <div style="color: #ccc; font-size: 13px; line-height: 1.5;">
                    ${spellData.effects}
                </div>
            </div>
        `;
    }

    modal.innerHTML = `
        <style>
            @keyframes modalSlideIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #spell-description-overlay::-webkit-scrollbar { width: 6px; }
            #spell-description-overlay::-webkit-scrollbar-thumb { background: ${schoolColor}; border-radius: 3px; }
        </style>

        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 56px; margin-bottom: 8px; filter: drop-shadow(0 0 10px ${schoolColor});">${spellData.icon}</div>
            <h2 style="margin: 0; color: ${schoolColor}; font-size: 22px;">
                ${spellData.name}
            </h2>
            <div style="color: #888; font-size: 13px; margin-top: 5px;">
                ${factionName} • Тир ${tier} • ${typeText}
            </div>
            ${currentLevel > 0 ? `
                <div style="margin-top: 8px; display: inline-block; background: rgba(74, 222, 128, 0.2); border: 1px solid #4ade80; padding: 4px 12px; border-radius: 12px; color: #4ade80; font-size: 12px;">
                    ✓ Изучено: Уровень ${currentLevel}/5
                </div>
            ` : `
                <div style="margin-top: 8px; display: inline-block; background: rgba(255, 107, 107, 0.2); border: 1px solid #ff6b6b; padding: 4px 12px; border-radius: 12px; color: #ff6b6b; font-size: 12px;">
                    ✗ Не изучено
                </div>
            `}
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="color: #fff; font-size: 14px; line-height: 1.6;">
                ${spellData.description}
            </div>
        </div>

        ${damageTableHTML}
        ${effectsHTML}

        <button id="spell-desc-close-btn" style="
            margin-top: 20px;
            width: 100%;
            padding: 14px;
            background: linear-gradient(to bottom, #555, #444);
            border: 2px solid #666;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        ">Закрыть</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Обработчик закрытия
    document.getElementById('spell-desc-close-btn').onclick = () => overlay.remove();

    // Закрытие по клику вне окна
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };

    // Закрытие по Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Экспорт
window.showLibrary = showLibrary;
window.closeLibrary = closeLibrary;
window.openSchoolSpells = openSchoolSpells;
window.updateLibraryContent = updateLibraryContent;
window.renderLibraryUI = updateLibraryContent; // Алиас для time-construction-system
window.renderLibrary = renderLibrary;
window.showSpellInfoModal = showSpellInfoModal;
window.showSpellDescriptionModal = showSpellDescriptionModal;

