// portrait-blocker.js - Блокировка portrait режима для мобильных устройств
(function() {
    console.log('🚫 portrait-blocker.js загружен');
    
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
    
    // Функция проверки ориентации
    function isPortraitMode() {
        const portrait = window.innerHeight > window.innerWidth;
        console.log(`📐 Размеры: ${window.innerWidth}x${window.innerHeight} | Portrait: ${portrait}`);
        return portrait;
    }
    
    // Создание overlay для блокировки
    function createBlockerOverlay() {
        // Удаляем старый overlay если есть
        const oldOverlay = document.getElementById('portrait-blocker-overlay');
        if (oldOverlay) {
            oldOverlay.remove();
        }
        
        // Создаем новый overlay
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
            console.log('✅ Overlay блокировки удален');
        }
    }
    
    // Скрытие/показ игрового контента
    function toggleGameContent(show) {
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = show ? 'block' : 'none';
            console.log(show ? '✅ Игровой контент показан' : '🚫 Игровой контент скрыт');
        }
    }
    
    // Переменная для отслеживания предыдущего состояния
    let wasPortrait = null;
    
    // Главная функция проверки
    function checkOrientation() {
        console.log('🔍 Проверка ориентации...');
        
        const isMobile = isMobileDevice();
        const isPortrait = isPortraitMode();
        
        // Определяем переход
        const transitionToLandscape = wasPortrait === true && !isPortrait;
        
        console.log(`📊 Было: ${wasPortrait === null ? 'первый запуск' : wasPortrait ? 'portrait' : 'landscape'} → Стало: ${isPortrait ? 'portrait' : 'landscape'}`);
        
        if (isMobile && isPortrait) {
            // Мобильный + вертикально = БЛОКИРОВКА
            console.log('🚫 БЛОКИРОВКА: Мобильное устройство в portrait режиме');
            createBlockerOverlay();
            toggleGameContent(false);
            wasPortrait = true;
        } else if (isMobile && transitionToLandscape) {
            // Переход portrait → landscape = RELOAD
            console.log('🔄 ПЕРЕХОД portrait → landscape: Перезагрузка страницы...');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            // Десктоп ИЛИ горизонтально = ОК
            console.log('✅ ОК: Можно играть');
            removeBlockerOverlay();
            toggleGameContent(true);
            wasPortrait = false;
        }
    }
    
    // Инициализация
    function init() {
        console.log('🎬 Инициализация portrait-blocker...');
        
        // Первая проверка сразу
        checkOrientation();
        
        // Слушаем изменения ориентации
        window.addEventListener('resize', () => {
            console.log('📐 resize event');
            setTimeout(checkOrientation, 100);
        });
        
        window.addEventListener('orientationchange', () => {
            console.log('📐 orientationchange event');
            setTimeout(checkOrientation, 300);
        });
        
        console.log('✅ portrait-blocker инициализирован');
    }
    
    // Запускаем когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();