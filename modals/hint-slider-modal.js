// modals/hint-slider-modal.js - Полноэкранный слайдер подсказок

// Конфигурация подсказок (768x512 webp)
const HINT_IMAGES = [
    'assets/hints/hint1.webp',
    'assets/hints/hint2.webp',
    'assets/hints/hint3.webp'
];

let currentHintIndex = 0;

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
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

    overlay.innerHTML = `
        <!-- Кнопка закрытия -->
        <button id="hint-close-btn" onclick="closeHintSlider()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
        ">✕</button>

        <!-- Контейнер картинки -->
        <div style="
            flex: 1;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        ">
            <!-- Левая стрелка -->
            <button id="hint-prev-btn" onclick="changeHintSlide(-1)" style="
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 10;
            ">‹</button>

            <!-- Картинка на весь экран -->
            <img id="hint-slider-image"
                 src="${HINT_IMAGES[0]}"
                 alt="Подсказка"
                 style="
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                 "
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%23222%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>Картинка не найдена</text></svg>'"
            />

            <!-- Правая стрелка -->
            <button id="hint-next-btn" onclick="changeHintSlide(1)" style="
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 10;
            ">›</button>
        </div>

        <!-- Индикатор страниц (точки) -->
        <div id="hint-dots-container" style="
            padding: 20px;
            display: flex;
            gap: 12px;
        ">
            ${HINT_IMAGES.map((_, index) => `
                <div onclick="goToHintSlide(${index})" style="
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${index === 0 ? 'white' : 'rgba(255, 255, 255, 0.3)'};
                    cursor: pointer;
                    transition: all 0.3s;
                " class="hint-dot" data-index="${index}"></div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(overlay);

    // Закрытие по клику на фон (но не на элементы управления)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.tagName === 'IMG') {
            // Клик по картинке - следующий слайд
            if (e.target.tagName === 'IMG') {
                changeHintSlide(1);
            }
        }
    });

    // Закрытие по Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeHintSlider();
            document.removeEventListener('keydown', escHandler);
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
            dot.style.background = 'rgba(255, 255, 255, 0.3)';
            dot.style.transform = 'scale(1)';
        }
    });
}

// Экспорт функций
window.showHintSliderModal = showHintSliderModal;
window.closeHintSlider = closeHintSlider;
window.changeHintSlide = changeHintSlide;
window.goToHintSlide = goToHintSlide;

console.log('💡 Hint Slider Modal загружен (fullscreen)');
