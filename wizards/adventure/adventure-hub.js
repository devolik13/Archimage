// wizards/adventure/adventure-hub.js - Главный экран выбора глав приключений

/**
 * Показать главный экран приключений с выбором глав
 */
function showAdventureHub() {
    // Закрываем предыдущие модалки
    if (typeof closeAllModals === 'function') {
        closeAllModals();
    }

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Удаляем старый экран если есть
    let screen = document.getElementById('adventure-hub-screen');
    if (screen) screen.remove();

    // Создаём экран
    screen = document.createElement('div');
    screen.id = 'adventure-hub-screen';

    const backgroundPath = 'assets/ui/adventure/adventure_hub.webp';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img id="adventure-hub-bg" src="${backgroundPath}" alt="Зал приключений" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            ">

            <!-- Контейнер для кнопок глав -->
            <div id="adventure-chapters-container" style="
                position: absolute;
                display: flex;
                flex-direction: column;
                gap: 20px;
                z-index: 10;
            "></div>

            <!-- Кнопка Назад -->
            <button onclick="closeAdventureHub()" style="
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

    const img = document.getElementById('adventure-hub-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupAdventureChapters();
    if (img.complete) setupAdventureChapters();
}

/**
 * Настройка кнопок глав
 */
function setupAdventureChapters() {
    const container = document.getElementById('adventure-chapters-container');
    if (!container) return;

    // Конфигурация глав
    const chapters = [
        {
            id: 'elemental-trials',
            title: 'Испытание стихий',
            subtitle: 'Уровни 1-50',
            available: true,
            onClick: () => {
                closeAdventureHub();
                setTimeout(() => {
                    if (typeof window.showAdventureMap === 'function') {
                        // Определяем диапазон карты на основе прогресса игрока
                        const maxLevel = window.userData?.pve_progress?.maxLevel || 1;
                        let mapRange = '1-10';

                        if (maxLevel >= 41) {
                            mapRange = '41-50';
                        } else if (maxLevel >= 31) {
                            mapRange = '31-40';
                        } else if (maxLevel >= 21) {
                            mapRange = '21-30';
                        } else if (maxLevel >= 11) {
                            mapRange = '11-20';
                        }

                        window.showAdventureMap(mapRange);
                    }
                }, 300);
            }
        },
        {
            id: 'chapter-2',
            title: 'Глава 2',
            subtitle: 'Скоро...',
            available: false,
            onClick: null
        },
        {
            id: 'chapter-3',
            title: 'Глава 3',
            subtitle: 'Скоро...',
            available: false,
            onClick: null
        }
    ];

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаём кнопки
    chapters.forEach((chapter, index) => {
        const button = document.createElement('div');
        button.className = 'adventure-chapter-button';

        const isAvailable = chapter.available;
        const bgColor = isAvailable ? 'rgba(255, 215, 0, 0.15)' : 'rgba(100, 100, 100, 0.15)';
        const borderColor = isAvailable ? 'rgba(255, 215, 0, 0.5)' : 'rgba(150, 150, 150, 0.3)';
        const textColor = isAvailable ? '#ffd700' : '#666';
        const cursor = isAvailable ? 'pointer' : 'not-allowed';

        button.style.cssText = `
            width: 350px;
            padding: 20px 30px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 10px;
            cursor: ${cursor};
            transition: all 0.3s;
            backdrop-filter: blur(5px);
        `;

        button.innerHTML = `
            <div style="
                font-size: 24px;
                font-weight: bold;
                color: ${textColor};
                margin-bottom: 5px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            ">${chapter.title}</div>
            <div style="
                font-size: 14px;
                color: ${isAvailable ? '#ffeb99' : '#888'};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            ">${chapter.subtitle}</div>
        `;

        // Интерактивность
        if (isAvailable && chapter.onClick) {
            button.onmouseover = () => {
                button.style.background = 'rgba(255, 215, 0, 0.3)';
                button.style.borderColor = 'rgba(255, 215, 0, 0.8)';
                button.style.transform = 'scale(1.05)';
            };
            button.onmouseout = () => {
                button.style.background = bgColor;
                button.style.borderColor = borderColor;
                button.style.transform = 'scale(1)';
            };
            button.onclick = chapter.onClick;
        }

        container.appendChild(button);
    });
}

/**
 * Закрыть экран выбора глав
 */
function closeAdventureHub() {
    const screen = document.getElementById('adventure-hub-screen');
    if (screen) {
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.3s';
        setTimeout(() => screen.remove(), 300);
    }

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'flex';
}

// Экспорт
window.showAdventureHub = showAdventureHub;
window.closeAdventureHub = closeAdventureHub;

console.log('🏰 Система выбора глав приключений загружена');
