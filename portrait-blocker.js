// portrait-blocker.js - Блокировка portrait режима для мобильных устройств
(function() {

    // Функция определения мобильного устройства
    function isMobileDevice() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    // Функция проверки ориентации
    function isPortraitMode() {
        return window.innerHeight > window.innerWidth;
    }

    // Создание overlay для блокировки
    function createBlockerOverlay() {
        if (document.getElementById('portrait-blocker-overlay')) {
            return;
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
    }

    // Удаление overlay
    function removeBlockerOverlay() {
        const overlay = document.getElementById('portrait-blocker-overlay');
        if (overlay) {
            overlay.remove();

            // Пересоздаём UI элементы которые зависят от позиции фона
            setTimeout(() => {
                if (typeof window.createPlayerAvatarUI === 'function') {
                    window.createPlayerAvatarUI();
                }
                if (typeof window.updateTimeCurrencyDisplay === 'function') {
                    window.updateTimeCurrencyDisplay();
                }
            }, 100);
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
            createBlockerOverlay();
            toggleGameContent(false);
        } else {
            removeBlockerOverlay();
            toggleGameContent(true);
        }
    }

    // Инициализация
    function init() {
        checkOrientation();

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
