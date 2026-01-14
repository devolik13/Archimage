// wizards/adventure/adventure-map.js - Система карты приключений с фоновыми изображениями

// Конфигурация координат точек для каждого диапазона уровней
const ADVENTURE_MAP_POINTS = {
    // Уровни 1-10 (Огненные пещеры)
    '1-10': {
        image: 'assets/ui/adventure/map_001_010.webp',
        points: [
            { level: 1, x: 150, y: 166 },
            { level: 2, x: 306, y: 154 },
            { level: 3, x: 357, y: 210 },
            { level: 4, x: 470, y: 279 },
            { level: 5, x: 275, y: 280 },
            { level: 6, x: 70, y: 365 },
            { level: 7, x: 435, y: 455 },
            { level: 8, x: 573, y: 356 },
            { level: 9, x: 670, y: 260 },
            { level: 10, x: 565, y: 100 }
        ]
    },
    // Уровни 11-20 (Ледяные вершины)
    '11-20': {
        image: 'assets/ui/adventure/map_011_020.webp',
        points: [
            { level: 11, x: 70, y: 90 },
            { level: 12, x: 193, y: 121 },
            { level: 13, x: 80, y: 335 },
            { level: 14, x: 310, y: 387 },
            { level: 15, x: 326, y: 58 },
            { level: 16, x: 500, y: 40 },
            { level: 17, x: 576, y: 109 },
            { level: 18, x: 540, y: 211 },
            { level: 19, x: 660, y: 293 },
            { level: 20, x: 573, y: 408 }
        ]
    },
    // Уровни 21-30 (Грозовые равнины)
    '21-30': {
        image: 'assets/ui/adventure/map_021_030.webp',
        points: [
            { level: 21, x: 160, y: 143 },
            { level: 22, x: 204, y: 227 },
            { level: 23, x: 88, y: 319 },
            { level: 24, x: 263, y: 410 },
            { level: 25, x: 409, y: 331 },
            { level: 26, x: 490, y: 300 },
            { level: 27, x: 590, y: 230 },
            { level: 28, x: 460, y: 160 },
            { level: 29, x: 487, y: 75 },
            { level: 30, x: 625, y: 90 }
        ]
    },
    // Уровни 31-40 (Земные глубины)
    '31-40': {
        image: 'assets/ui/adventure/map_031_040.webp',
        points: [
            { level: 31, x: 712, y: 287 },
            { level: 32, x: 533, y: 384 },
            { level: 33, x: 332, y: 459 },
            { level: 34, x: 200, y: 380 },
            { level: 35, x: 347, y: 286 },
            { level: 36, x: 193, y: 185 },
            { level: 37, x: 136, y: 94 },
            { level: 38, x: 294, y: 58 },
            { level: 39, x: 358, y: 114 },
            { level: 40, x: 600, y: 154 }
        ]
    },
    // Уровни 41-50 (Царство Хаоса)
    '41-50': {
        image: 'assets/ui/adventure/map_041_050.webp',
        points: [
            { level: 41, x: 608, y: 161 },
            { level: 42, x: 565, y: 246 },
            { level: 43, x: 554, y: 317 },
            { level: 44, x: 633, y: 411 },
            { level: 45, x: 535, y: 406 },
            { level: 46, x: 448, y: 382 },
            { level: 47, x: 372, y: 392 },
            { level: 48, x: 327, y: 340 },
            { level: 49, x: 254, y: 285 },
            { level: 50, x: 201, y: 209 }
        ]
    }
};

// Текущий отображаемый диапазон
let currentMapRange = '1-10';

/**
 * Показать карту приключений
 */
function showAdventureMap(range = '1-10') {
    currentMapRange = range;

    // Закрываем предыдущие модалки
    if (typeof closeAllModals === 'function') {
        closeAllModals();
    }

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Удаляем старый экран если есть
    let screen = document.getElementById('adventure-map-screen');
    if (screen) screen.remove();

    // Создаём экран
    screen = document.createElement('div');
    screen.id = 'adventure-map-screen';

    const mapConfig = ADVENTURE_MAP_POINTS[range];
    const imagePath = mapConfig?.image || 'assets/ui/adventure/map_001_010.webp';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="adventure-map-bg" id="adventure-map-bg" src="${imagePath}" alt="Карта приключений" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            ">
            <div id="adventure-map-overlay"></div>

            <!-- Стрелка влево -->
            <button id="adventure-nav-left" onclick="navigateAdventureMap('prev')" style="
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 80px;
                background: rgba(0, 0, 0, 0.6);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            ">◀</button>

            <!-- Стрелка вправо -->
            <button id="adventure-nav-right" onclick="navigateAdventureMap('next')" style="
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 80px;
                background: rgba(0, 0, 0, 0.6);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            ">▶</button>

            <!-- Кнопка Назад -->
            <button onclick="closeAdventureMap()" style="
                position: absolute;
                bottom: 15px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 30px;
                background: linear-gradient(180deg, #dc3545, #a71d2a);
                border: 2px solid #ff6b6b;
                border-radius: 8px;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                z-index: 100;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">Назад</button>

            <!-- Индикатор диапазона -->
            <div id="adventure-range-indicator" style="
                position: absolute;
                top: 15px;
                right: 65px;
                background: rgba(0, 0, 0, 0.7);
                padding: 8px 20px;
                border-radius: 20px;
                color: #ffd700;
                font-size: 16px;
                font-weight: bold;
                z-index: 100;
            ">Уровни ${range}</div>
        </div>
    `;

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

    const img = document.getElementById('adventure-map-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupAdventureMapUI(range);
    if (img.complete) setupAdventureMapUI(range);

    // Обновляем состояние стрелок навигации
    updateNavigationArrows(range);
}

/**
 * Настройка UI карты - размещение точек уровней
 */
function setupAdventureMapUI(range) {
    const img = document.getElementById('adventure-map-bg');
    const overlay = document.getElementById('adventure-map-overlay');

    if (!img || !overlay) return;

    const rect = img.getBoundingClientRect();
    const mapConfig = ADVENTURE_MAP_POINTS[range];

    if (!mapConfig) return;

    // Устанавливаем overlay поверх изображения
    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
    `;

    // Очищаем overlay
    overlay.innerHTML = '';

    // Масштаб для координат (базовый размер 768x512)
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;

    // Загружаем прогресс
    const progress = loadAdventureProgress();
    const maxUnlockedLevel = progress.chapter1?.maxLevel || 1;
    const completedLevels = progress.chapter1?.completed || {};

    // Создаём точки для каждого уровня
    mapConfig.points.forEach(point => {
        const isCompleted = completedLevels[point.level] === true;
        const isAvailable = point.level <= maxUnlockedLevel && !isCompleted;
        const isLocked = point.level > maxUnlockedLevel;

        // Проверяем является ли уровень боссом
        const bossLevels = [10, 20, 30, 40, 50];
        const isBoss = bossLevels.includes(point.level);

        // Определяем цвет точки (объёмный стиль)
        let bgColor, borderColor, textColor, boxShadow;
        if (isCompleted) {
            // Жёлтый - пройден
            bgColor = 'linear-gradient(145deg, #ffd700, #ffaa00)';
            borderColor = '#fff700';
            textColor = '#000';
            boxShadow = '0 4px 12px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)';
        } else if (isAvailable) {
            // Зелёный - доступен
            bgColor = 'linear-gradient(145deg, #4ade80, #22c55e)';
            borderColor = '#4ade80';
            textColor = '#fff';
            boxShadow = '0 4px 12px rgba(74, 222, 128, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)';
        } else {
            // Красный - заблокирован
            bgColor = 'linear-gradient(145deg, #ef4444, #dc2626)';
            borderColor = '#ef4444';
            textColor = '#fff';
            boxShadow = '0 4px 12px rgba(239, 68, 68, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)';
        }

        // Размер точки (боссы на 50% крупнее)
        const basePointSize = Math.max(28, 36 * Math.min(scaleX, scaleY));
        const pointSize = isBoss ? basePointSize * 1.5 : basePointSize;
        const baseFontSize = Math.max(12, 16 * Math.min(scaleX, scaleY));
        const fontSize = isBoss ? baseFontSize * 1.3 : baseFontSize;

        // Создаём элемент точки
        const pointEl = document.createElement('div');
        pointEl.className = 'adventure-point';
        pointEl.style.cssText = `
            position: absolute;
            left: ${point.x * scaleX - pointSize / 2}px;
            top: ${point.y * scaleY - pointSize / 2}px;
            width: ${pointSize}px;
            height: ${pointSize}px;
            background: ${bgColor};
            border: 3px solid ${borderColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
            font-size: ${fontSize}px;
            font-weight: bold;
            cursor: ${isLocked ? 'not-allowed' : 'pointer'};
            pointer-events: auto;
            box-shadow: ${boxShadow};
            transition: transform 0.2s, box-shadow 0.2s;
            z-index: 10;
        `;
        pointEl.textContent = point.level;

        // Добавляем интерактивность
        if (!isLocked) {
            pointEl.onmouseover = () => {
                pointEl.style.transform = 'scale(1.2)';
                // Усиленный объёмный эффект при hover
                const hoverShadow = boxShadow.replace('0 4px 12px', '0 8px 24px');
                pointEl.style.boxShadow = hoverShadow;
            };
            pointEl.onmouseout = () => {
                pointEl.style.transform = 'scale(1)';
                pointEl.style.boxShadow = boxShadow;
            };
            pointEl.onclick = () => {
                if (isAvailable) {
                    startPvELevel(point.level);
                } else if (isCompleted) {
                    // Можно переиграть пройденный уровень
                    startPvELevel(point.level);
                }
            };
        }

        // Добавляем иконку для боссов
        if (isBoss) {
            const bossIcon = document.createElement('div');
            bossIcon.style.cssText = `
                position: absolute;
                top: -12px;
                right: -8px;
                font-size: 16px;
                z-index: 11;
            `;
            bossIcon.textContent = point.level === 50 ? '👑' : '💀';
            pointEl.appendChild(bossIcon);
        }

        overlay.appendChild(pointEl);
    });
}

/**
 * Навигация между диапазонами карты
 */
function navigateAdventureMap(direction) {
    const ranges = Object.keys(ADVENTURE_MAP_POINTS);
    const currentIndex = ranges.indexOf(currentMapRange);

    let newIndex;
    if (direction === 'next') {
        newIndex = Math.min(currentIndex + 1, ranges.length - 1);
    } else {
        newIndex = Math.max(currentIndex - 1, 0);
    }

    if (newIndex !== currentIndex) {
        showAdventureMap(ranges[newIndex]);
    }
}

/**
 * Обновить состояние стрелок навигации
 */
function updateNavigationArrows(range) {
    const ranges = Object.keys(ADVENTURE_MAP_POINTS);
    const currentIndex = ranges.indexOf(range);

    const leftArrow = document.getElementById('adventure-nav-left');
    const rightArrow = document.getElementById('adventure-nav-right');

    // Проверяем прогресс для определения доступных карт
    const progress = loadAdventureProgress();
    const maxUnlockedLevel = progress.chapter1?.maxLevel || 1;

    if (leftArrow) {
        if (currentIndex === 0) {
            leftArrow.style.opacity = '0.3';
            leftArrow.style.cursor = 'not-allowed';
            leftArrow.onclick = null;
        } else {
            leftArrow.style.opacity = '1';
            leftArrow.style.cursor = 'pointer';
            leftArrow.onclick = () => navigateAdventureMap('prev');
        }
    }

    if (rightArrow) {
        // Просмотр карт доступен всегда, блокируется только последняя карта
        if (currentIndex >= ranges.length - 1) {
            rightArrow.style.opacity = '0.3';
            rightArrow.style.cursor = 'not-allowed';
            rightArrow.onclick = null;
        } else {
            rightArrow.style.opacity = '1';
            rightArrow.style.cursor = 'pointer';
            rightArrow.onclick = () => navigateAdventureMap('next');
        }
    }
}

/**
 * Закрыть карту приключений и вернуться к выбору главы
 */
function closeAdventureMap() {
    const screen = document.getElementById('adventure-map-screen');
    if (screen) {
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            screen.remove();
            // Возвращаемся к выбору главы (adventure-hub)
            if (typeof window.showAdventureHub === 'function') {
                window.showAdventureHub();
            }
        }, 300);
    } else {
        // Если экран уже удалён, просто открываем hub
        if (typeof window.showAdventureHub === 'function') {
            window.showAdventureHub();
        }
    }
}

/**
 * Загрузить прогресс PvE - используем глобальную функцию
 */
function loadAdventureProgress() {
    // Используем глобальную функцию если доступна
    if (typeof window.loadPvEProgress === 'function') {
        return window.loadPvEProgress();
    }
    return window.userData?.pve_progress || { chapter1: { maxLevel: 1, completed: {} } };
}

/**
 * Обновить UI карты без полной перерисовки
 */
function refreshAdventureMap() {
    const screen = document.getElementById('adventure-map-screen');
    if (!screen) return; // Карта не открыта

    // Перерисовываем UI с актуальным прогрессом
    setupAdventureMapUI(currentMapRange);
    console.log('🔄 Карта приключений обновлена');
}

// Экспорт
window.showAdventureMap = showAdventureMap;
window.closeAdventureMap = closeAdventureMap;
window.navigateAdventureMap = navigateAdventureMap;
window.refreshAdventureMap = refreshAdventureMap;
window.ADVENTURE_MAP_POINTS = ADVENTURE_MAP_POINTS;

console.log('🗺️ Система карты приключений загружена');
