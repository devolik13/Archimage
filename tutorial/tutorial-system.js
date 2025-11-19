// tutorial/tutorial-system.js - Система обучения новых игроков
console.log('✅ tutorial-system.js загружен');

/**
 * Система обучения
 * Шаги:
 * 0 - 'not_started' - обучение не начато
 * 1 - 'build_library' - построй библиотеку
 * 2 - 'speedup_library' - ускорь строительство
 * 3 - 'learn_spell' - изучи заклинание
 * 4 - 'final_modal' - показать финальное модальное окно
 * 5 - 'completed' - обучение завершено
 */

class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.frozenConstruction = null; // ID конструкции с замороженным таймером
        this.overlay = null;
        this.hint = null;
    }

    /**
     * Запуск обучения
     */
    start() {
        if (!window.userData) {
            console.error('❌ userData не загружен');
            return;
        }

        // Проверяем не завершено ли обучение
        if (window.userData.tutorial_completed) {
            console.log('⏭️ Обучение уже завершено');
            return;
        }

        console.log('🎓 Запуск обучения');
        this.isActive = true;
        this.currentStep = 1;

        // Сохраняем шаг в userData
        window.userData.tutorial_step = this.currentStep;

        // Начинаем с шага 1: Построй библиотеку
        setTimeout(() => {
            this.step1_BuildLibrary();
        }, 1000); // Небольшая задержка чтобы город успел загрузиться
    }

    /**
     * Шаг 1: Построй библиотеку
     */
    step1_BuildLibrary() {
        console.log('📚 Шаг 1: Построй библиотеку');

        this.showOverlay();
        this.showBigHint('Открой меню строительства и построй библиотеку');
        this.startBuildButtonBlink();

        // Блокируем все кроме строительства библиотеки
        this.blockAllExceptLibraryBuild();
    }

    /**
     * Шаг 2: Ускорь строительство
     */
    step2_SpeedupLibrary() {
        console.log('⚡ Шаг 2: Ускорь строительство');

        this.currentStep = 2;
        window.userData.tutorial_step = 2;

        this.clearHint();
        this.showHint('Нажми на строящееся здание чтобы ускорить', 'speedup');

        // Замораживаем таймер библиотеки
        const libraryConstruction = window.userData.constructions?.find(c => c.building_id === 'library');
        if (libraryConstruction) {
            this.frozenConstruction = 'library';
            console.log('❄️ Таймер библиотеки заморожен');
        }
    }

    /**
     * Шаг 3: Изучи заклинание
     */
    step3_LearnSpell() {
        console.log('📖 Шаг 3: Изучи заклинание');

        this.currentStep = 3;
        window.userData.tutorial_step = 3;

        this.clearHint();
        this.showHint('Открой библиотеку и изучи любое заклинание', 'spell');
    }

    /**
     * Шаг 4: Финальное модальное окно
     */
    step4_FinalModal() {
        console.log('✅ Шаг 4: Финальное модальное окно');

        this.currentStep = 4;
        window.userData.tutorial_step = 4;

        this.clearHint();
        this.hideOverlay();

        // Показываем финальное модальное окно
        this.showFinalModal();
    }

    /**
     * Завершение обучения
     */
    complete() {
        console.log('🎉 Обучение завершено!');

        this.isActive = false;
        this.currentStep = 5;
        window.userData.tutorial_step = 5;
        window.userData.tutorial_completed = true;

        // Сохраняем в БД
        if (window.dbManager) {
            window.dbManager.markChanged();
        }

        this.clearHint();
        this.hideOverlay();

        // Убираем все блокировки
        this.unblockAll();
    }

    /**
     * Проверка: заморожен ли таймер конструкции
     */
    isFrozen(buildingId) {
        return this.isActive && this.frozenConstruction === buildingId;
    }

    /**
     * Обработчик: игрок начал строить библиотеку
     */
    onLibraryBuildStarted() {
        if (this.currentStep === 1) {
            this.stopBuildButtonBlink();
            this.step2_SpeedupLibrary();
        }
    }

    /**
     * Обработчик: игрок ускорил библиотеку
     */
    onLibrarySpedUp() {
        if (this.currentStep === 2) {
            // Размораживаем таймер
            this.frozenConstruction = null;
            console.log('🔥 Таймер библиотеки разморожен');

            // Переходим к следующему шагу
            setTimeout(() => {
                this.step3_LearnSpell();
            }, 500);
        }
    }

    /**
     * Обработчик: игрок начал изучение заклинания
     */
    onSpellLearningStarted() {
        if (this.currentStep === 3) {
            setTimeout(() => {
                this.step4_FinalModal();
            }, 500);
        }
    }

    /**
     * Показать оверлей (затемнение)
     */
    showOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);
    }

    /**
     * Скрыть оверлей
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * Показать подсказку
     */
    showHint(text, type) {
        this.clearHint();

        this.hint = document.createElement('div');
        this.hint.id = 'tutorial-hint';
        this.hint.innerHTML = `
            <div style="
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 9999;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                max-width: 90%;
                animation: pulse 2s infinite;
            ">
                ${text}
                <div style="
                    font-size: 40px;
                    margin-top: 10px;
                    animation: bounce 1s infinite;
                ">
                    👇
                </div>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.05); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        `;
        document.body.appendChild(this.hint);
    }

    /**
     * Убрать подсказку
     */
    clearHint() {
        if (this.hint) {
            this.hint.remove();
            this.hint = null;
        }
    }

    /**
     * Показать большую подсказку (без стрелки вниз)
     */
    showBigHint(text) {
        this.clearHint();

        this.hint = document.createElement('div');
        this.hint.id = 'tutorial-hint';
        this.hint.innerHTML = `
            <div style="
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 40px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                z-index: 9999;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                max-width: 90%;
                animation: pulse 2s infinite;
            ">
                ${text}
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.05); }
                }
            </style>
        `;
        document.body.appendChild(this.hint);
    }

    /**
     * Начать мигание кнопки строительства
     */
    startBuildButtonBlink() {
        // Останавливаем предыдущее мигание если есть
        this.stopBuildButtonBlink();

        // Находим кнопку строительства
        const buildBtn = document.getElementById('build-btn');
        if (!buildBtn) {
            console.warn('⚠️ Кнопка строительства не найдена');
            return;
        }

        // Добавляем класс для мигания
        buildBtn.classList.add('tutorial-blink');

        // Добавляем стили для мигания если их еще нет
        if (!document.getElementById('tutorial-blink-style')) {
            const style = document.createElement('style');
            style.id = 'tutorial-blink-style';
            style.innerHTML = `
                @keyframes tutorial-blink {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(255, 215, 0, 1);
                        transform: scale(1.1);
                    }
                }
                .tutorial-blink {
                    animation: tutorial-blink 1.5s infinite !important;
                    z-index: 10000 !important;
                }
            `;
            document.head.appendChild(style);
        }

        console.log('✨ Начало мигания кнопки строительства');
    }

    /**
     * Остановить мигание кнопки строительства
     */
    stopBuildButtonBlink() {
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn) {
            buildBtn.classList.remove('tutorial-blink');
        }
    }

    /**
     * Показать финальное модальное окно
     */
    showFinalModal() {
        const modalContent = `
            <div style="
                padding: 40px 30px;
                max-width: 500px;
                width: 90%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                color: white;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>

                <h2 style="
                    margin: 0 0 20px 0;
                    font-size: 28px;
                    color: #fff;
                ">
                    ВАЖНО!
                </h2>

                <div style="
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    font-size: 18px;
                    line-height: 1.6;
                ">
                    Одновременно можно строить<br>
                    только <strong>ОДНО здание</strong> и изучать<br>
                    только <strong>ОДНО заклинание</strong>.
                </div>

                <div style="
                    font-size: 20px;
                    margin: 20px 0;
                    color: #ffd700;
                    font-weight: bold;
                ">
                    Делай мудрый выбор, маг!
                </div>

                <button onclick="window.tutorialSystem.complete()" style="
                    width: 100%;
                    margin-top: 20px;
                    padding: 15px;
                    border: none;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 18px;
                    transition: all 0.3s;
                    border: 2px solid rgba(255,255,255,0.3);
                ">
                    ✓ Понятно
                </button>
            </div>
        `;

        if (typeof window.showModal === 'function') {
            window.showModal(modalContent);
        }
    }

    /**
     * Блокировать все кроме строительства библиотеки
     */
    blockAllExceptLibraryBuild() {
        // Эта функция будет проверяться при попытках действий
        console.log('🔒 Блокировка всех действий кроме строительства библиотеки');
    }

    /**
     * Разблокировать все
     */
    unblockAll() {
        console.log('🔓 Снятие всех блокировок');
    }

    /**
     * Проверка: можно ли строить здание
     */
    canBuildBuilding(buildingId) {
        if (!this.isActive) return true;

        if (this.currentStep === 1) {
            // Только библиотеку
            return buildingId === 'library';
        }

        return false; // Во время обучения блокируем все кроме библиотеки на шаге 1
    }

    /**
     * Проверка: можно ли открыть здание
     */
    canOpenBuilding(buildingId) {
        if (!this.isActive) return true;

        if (this.currentStep === 3) {
            // На шаге 3 можно открыть только библиотеку
            return buildingId === 'library';
        }

        if (this.currentStep < 3) {
            // До шага 3 нельзя открывать здания
            return false;
        }

        return false;
    }

    /**
     * Проверка: можно ли ускорить конструкцию
     */
    canSpeedupConstruction(buildingId) {
        if (!this.isActive) return true;

        if (this.currentStep === 2 && buildingId === 'library') {
            return true;
        }

        return false;
    }

    /**
     * Проверка: показывать ли замок на здании
     */
    shouldShowLock(buildingId) {
        if (!this.isActive) return false;

        if (this.currentStep === 1 && buildingId !== 'library') {
            return true; // Все кроме библиотеки заблокированы
        }

        return false;
    }
}

// Создаем глобальный экземпляр
window.tutorialSystem = new TutorialSystem();

// Экспортируем для удобства
window.startTutorial = () => window.tutorialSystem.start();

console.log('✅ Система обучения готова');
