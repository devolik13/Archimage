// modals/hint-slider-modal.js - Модалка с подсказками (слайдер картинок)

// Конфигурация подсказок
const HINT_IMAGES = [
    'assets/hints/hint1.png',
    'assets/hints/hint2.png',
    'assets/hints/hint3.png'
];

let currentHintIndex = 0;

/**
 * Показать модалку с подсказками
 */
function showHintSliderModal() {
    console.log('💡 Открытие модалки с подсказками');

    // Сбрасываем индекс
    currentHintIndex = 0;

    // Закрываем другие модалки
    if (typeof window.closeAllModals === 'function') {
        window.closeAllModals();
    }

    // Создаем модалку
    const modalHTML = `
        <div style="
            max-width: 90vw;
            max-height: 90vh;
            background: linear-gradient(135deg, rgba(44, 44, 61, 0.98), rgba(33, 33, 46, 0.98));
            border-radius: 12px;
            padding: 20px;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        ">
            <!-- Заголовок -->
            <h2 style="margin: 0 0 20px 0; color: #7289da; text-align: center;">
                💡 Подсказки
            </h2>

            <!-- Слайдер контейнер -->
            <div style="
                position: relative;
                width: 100%;
                max-width: 800px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            ">
                <!-- Левая стрелка -->
                <button id="hint-prev-btn" onclick="changeHintSlide(-1)" style="
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(114, 137, 218, 0.8);
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(114, 137, 218, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                   onmouseout="this.style.background='rgba(114, 137, 218, 0.8)'; this.style.transform='translateY(-50%) scale(1)'">
                    ←
                </button>

                <!-- Картинка -->
                <div style="
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 400px;
                ">
                    <img id="hint-slider-image"
                         src="${HINT_IMAGES[0]}"
                         alt="Подсказка"
                         style="
                            max-width: 100%;
                            max-height: 70vh;
                            border-radius: 8px;
                            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                         "
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%23333%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22>Картинка не найдена</text></svg>'"
                    />
                </div>

                <!-- Правая стрелка -->
                <button id="hint-next-btn" onclick="changeHintSlide(1)" style="
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(114, 137, 218, 0.8);
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(114, 137, 218, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                   onmouseout="this.style.background='rgba(114, 137, 218, 0.8)'; this.style.transform='translateY(-50%) scale(1)'">
                    →
                </button>
            </div>

            <!-- Индикатор страниц -->
            <div id="hint-dots-container" style="
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            ">
                ${HINT_IMAGES.map((_, index) => `
                    <div onclick="goToHintSlide(${index})" style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: ${index === 0 ? '#7289da' : 'rgba(114, 137, 218, 0.3)'};
                        cursor: pointer;
                        transition: all 0.3s;
                    " class="hint-dot" data-index="${index}"></div>
                `).join('')}
            </div>

            <!-- Кнопка назад -->
            <button onclick="if(typeof Modal !== 'undefined' && Modal.closeAll) { Modal.closeAll(); } else if(typeof closeCurrentModal === 'function') { closeCurrentModal(); }" style="
                padding: 12px 30px;
                background: transparent;
                border: 2px solid #7289da;
                border-radius: 8px;
                color: #7289da;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                min-width: 150px;
            " onmouseover="this.style.background='#7289da'; this.style.color='white'"
               onmouseout="this.style.background='transparent'; this.style.color='#7289da'">
                ← Назад
            </button>
        </div>
    `;

    // Показываем модалку
    if (window.Modal && window.Modal.show) {
        window.Modal.show(modalHTML);
    } else {
        console.error('❌ Modal система не найдена');
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
            dot.style.background = '#7289da';
            dot.style.transform = 'scale(1.2)';
        } else {
            dot.style.background = 'rgba(114, 137, 218, 0.3)';
            dot.style.transform = 'scale(1)';
        }
    });
}

// Экспорт функций
window.showHintSliderModal = showHintSliderModal;
window.changeHintSlide = changeHintSlide;
window.goToHintSlide = goToHintSlide;

console.log('💡 Hint Slider Modal загружен');
