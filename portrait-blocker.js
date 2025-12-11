// portrait-blocker.js - Блокировка portrait режима для мобильных устройств
(function() {

    // Функция определения мобильного устройства через Telegram
    function isMobileDevice() {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
            console.log('📱 Telegram WebApp не найден, используем fallback определение');
            return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        }

        const platform = tg.platform || 'unknown';
        const isMobile = ['ios', 'android', 'android_x'].includes(platform);
        console.log('📱 Платформа:', platform, '| Мобильный:', isMobile);
        return isMobile;
    }

    // Функция проверки ориентации - несколько методов для надёжности
    function isPortraitMode() {
        // Метод 1: screen.orientation API (самый надёжный)
        if (screen.orientation && screen.orientation.type) {
            const isPortrait = screen.orientation.type.includes('portrait');
            console.log(`📐 screen.orientation: ${screen.orientation.type} | Portrait: ${isPortrait}`);
            return isPortrait;
        }

        // Метод 2: window.orientation (deprecated но работает)
        if (typeof window.orientation !== 'undefined') {
            const isPortrait = window.orientation === 0 || window.orientation === 180;
            console.log(`📐 window.orientation: ${window.orientation} | Portrait: ${isPortrait}`);
            return isPortrait;
        }

        // Метод 3: screen dimensions
        if (screen.width && screen.height) {
            const isPortrait = screen.height > screen.width;
            console.log(`📐 screen: ${screen.width}x${screen.height} | Portrait: ${isPortrait}`);
            return isPortrait;
        }

        // Метод 4: fallback на window размеры
        const isPortrait = window.innerHeight > window.innerWidth;
        console.log(`📐 window: ${window.innerWidth}x${window.innerHeight} | Portrait: ${isPortrait}`);
        return isPortrait;
    }

    // Создание overlay для блокировки
    function createBlockerOverlay() {
        // Проверяем, уже есть ли overlay
        if (document.getElementById('portrait-blocker-overlay')) {
            return; // Уже есть, не создаём дубликат
        }

        const overlay = document.createElement('div');
        overlay.id = 'portrait-blocker-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: Arial, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 80px; margin-bottom: 20px; animation: rotate 2s ease-in-out infinite;">
                    📱
                </div>
                <h2 style="color: #fff; font-size: 24px; margin-bottom: 10px;">
                    Переверните устройство
                </h2>
                <p style="color: #aaa; font-size: 16px; max-width: 300px; margin: 0 auto;">
                    Игра работает только в горизонтальном режиме
                </p>
                <div style="margin-top: 30px; font-size: 40px;">
                    🔄
                </div>
            </div>

            <style>
                @keyframes rotate {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(90deg); }
                }
            </style>
        `;

        document.body.appendChild(overlay);
        console.log('🚫 Overlay блокировки создан');
    }

    // Удаление overlay
    function removeBlockerOverlay() {
        const overlay = document.getElementById('portrait-blocker-overlay');
        if (overlay) {
            overlay.remove();
            console.log('✅ Overlay блокировки удалён');
        }
    }

    // Скрытие/показ игрового контента
    function toggleGameContent(show) {
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = show ? 'block' : 'none';
        }
    }

    // Главная функция проверки
    function checkOrientation() {
        const isMobile = isMobileDevice();
        const isPortrait = isPortraitMode();

        if (isMobile && isPortrait) {
            // Мобильный + вертикально = БЛОКИРОВКА
            console.log('🚫 БЛОКИРОВКА: portrait режим');
            createBlockerOverlay();
            toggleGameContent(false);
        } else {
            // Десктоп ИЛИ горизонтально = ОК
            console.log('✅ OK: landscape или десктоп');
            removeBlockerOverlay();
            toggleGameContent(true);
        }
    }

    // Инициализация
    function init() {
        console.log('🎬 Инициализация portrait-blocker...');

        // Первая проверка
        checkOrientation();

        // Слушаем изменения ориентации - все возможные события
        window.addEventListener('resize', () => {
            setTimeout(checkOrientation, 100);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 300);
        });

        // screen.orientation API
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                console.log('📐 screen.orientation change event');
                setTimeout(checkOrientation, 100);
            });
        }

        // Периодическая проверка как fallback (каждые 500мс первые 5 секунд)
        let checkCount = 0;
        const intervalId = setInterval(() => {
            checkOrientation();
            checkCount++;
            if (checkCount >= 10) {
                clearInterval(intervalId);
                console.log('📐 Периодическая проверка завершена');
            }
        }, 500);
    }

    // Запускаем когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
