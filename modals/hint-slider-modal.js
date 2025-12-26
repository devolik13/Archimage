// modals/hint-slider-modal.js - Полноэкранный слайдер подсказок

// Конфигурация подсказок (768x512 webp)
const HINT_IMAGES = [
    'assets/hints/hint1.webp',
    'assets/hints/hint2.webp',
    'assets/hints/hint3.webp'
];

// Размеры оригинальных изображений
const HINT_IMAGE_WIDTH = 768;
const HINT_IMAGE_HEIGHT = 512;

let currentHintIndex = 0;

/**
 * Вычислить размеры картинки (85% высоты экрана, центрировано)
 */
function calculateHintImageSize() {
    const screenHeight = window.innerHeight;
    const imageAspect = HINT_IMAGE_WIDTH / HINT_IMAGE_HEIGHT;

    // 85% высоты экрана для картинки (оставляем место для кнопки внизу)
    const height = screenHeight * 0.85;
    const width = height * imageAspect;

    return { width, height };
}

/**
 * Показать полноэкранные подсказки
 */
function showHintSliderModal() {
    console.log('💡 Открытие полноэкранных подсказок');

    // Сбрасываем индекс
    currentHintIndex = 0;

    // Удаляем старый оверлей если есть
    const existingOverlay = document.getElementById('hint-fullscreen-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Вычисляем размеры картинки
    const { width, height } = calculateHintImageSize();

    // Создаём полноэкранный оверлей
    const overlay = document.createElement('div');
    overlay.id = 'hint-fullscreen-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 999999;
        overflow: hidden;
    `;

    overlay.innerHTML = `
        <!-- Картинка уменьшенная и центрированная -->
        <img id="hint-slider-image"
             src="${HINT_IMAGES[0]}"
             alt="Подсказка"
             style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -55%);
                width: ${width}px;
                height: ${height}px;
             "
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%23222%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>Картинка не найдена</text></svg>'"
        />

        <!-- Левая стрелка -->
        <button id="hint-prev-btn" onclick="changeHintSlide(-1)" style="
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            color: white;
            font-size: 28px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
        ">‹</button>

        <!-- Правая стрелка -->
        <button id="hint-next-btn" onclick="changeHintSlide(1)" style="
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            color: white;
            font-size: 28px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
        ">›</button>

        <!-- Нижняя панель: точки + кнопка закрыть -->
        <div style="
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            z-index: 10;
        ">
            <!-- Индикатор страниц (точки) -->
            <div id="hint-dots-container" style="
                display: flex;
                gap: 12px;
            ">
                ${HINT_IMAGES.map((_, index) => `
                    <div onclick="goToHintSlide(${index})" style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: ${index === 0 ? 'white' : 'rgba(255, 255, 255, 0.4)'};
                        border: 1px solid rgba(255, 255, 255, 0.5);
                        cursor: pointer;
                        transition: all 0.3s;
                    " class="hint-dot" data-index="${index}"></div>
                `).join('')}
            </div>

            <!-- Кнопка закрыть -->
            <button id="hint-close-btn" onclick="closeHintSlider()" style="
                background: rgba(0, 0, 0, 0.6);
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 8px;
                padding: 10px 30px;
                color: white;
                font-size: 16px;
                cursor: pointer;
            ">Закрыть</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Обработчик изменения размера окна
    const resizeHandler = () => {
        const { width, height } = calculateHintImageSize();
        const img = document.getElementById('hint-slider-image');
        if (img) {
            img.style.width = `${width}px`;
            img.style.height = `${height}px`;
        }
    };
    window.addEventListener('resize', resizeHandler);
    overlay.dataset.resizeHandler = 'true';

    // Клик по картинке - следующий слайд
    overlay.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            changeHintSlide(1);
        }
    });

    // Закрытие по Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeHintSlider();
            document.removeEventListener('keydown', escHandler);
            window.removeEventListener('resize', resizeHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Свайпы для мобильных
    let touchStartX = 0;
    overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    overlay.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                changeHintSlide(1); // Свайп влево - следующий
            } else {
                changeHintSlide(-1); // Свайп вправо - предыдущий
            }
        }
    });
}

/**
 * Закрыть слайдер подсказок
 */
function closeHintSlider() {
    const overlay = document.getElementById('hint-fullscreen-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Переключить слайд
 * @param {number} direction - направление (-1 или +1)
 */
function changeHintSlide(direction) {
    currentHintIndex += direction;

    // Зацикливание
    if (currentHintIndex < 0) {
        currentHintIndex = HINT_IMAGES.length - 1;
    } else if (currentHintIndex >= HINT_IMAGES.length) {
        currentHintIndex = 0;
    }

    updateHintSlide();
}

/**
 * Перейти к конкретному слайду
 * @param {number} index - индекс слайда
 */
function goToHintSlide(index) {
    currentHintIndex = index;
    updateHintSlide();
}

/**
 * Обновить отображение слайда
 */
function updateHintSlide() {
    // Обновляем картинку
    const img = document.getElementById('hint-slider-image');
    if (img) {
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = HINT_IMAGES[currentHintIndex];
            img.style.transition = 'opacity 0.3s';
            img.style.opacity = '1';
        }, 150);
    }

    // Обновляем индикаторы (точки)
    const dots = document.querySelectorAll('.hint-dot');
    dots.forEach((dot, index) => {
        if (index === currentHintIndex) {
            dot.style.background = 'white';
            dot.style.transform = 'scale(1.3)';
        } else {
            dot.style.background = 'rgba(255, 255, 255, 0.4)';
            dot.style.transform = 'scale(1)';
        }
    });
}

// Экспорт функций
window.showHintSliderModal = showHintSliderModal;
window.closeHintSlider = closeHintSlider;
window.changeHintSlide = changeHintSlide;
window.goToHintSlide = goToHintSlide;

console.log('💡 Hint Slider Modal загружен (fullscreen adaptive)');
