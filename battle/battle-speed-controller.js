// battle/battle-speed-controller.js - Единый контроллер скорости боя
// Управляет: скоростью фаз, анимациями, UI кнопки, паузой

class BattleSpeedController {
    constructor() {
        // Режимы скорости
        this.SPEEDS = {
            normal: { interval: 1700, multiplier: 1.0, icon: '▶', title: 'Ускорить', bg: 'rgba(85, 85, 85, 0.9)' },
            fast: { interval: 700, multiplier: 2.5, icon: '⚡', title: 'Замедлить', bg: '#FFD700' }
        };

        // Текущее состояние
        this.mode = 'normal';
        this.isPaused = false;
        this.isActive = false;

        // Таймеры
        this.battleInterval = null;
        this.battleCallback = null;

        // Слушаем событие закрытия
        window.addEventListener('beforeunload', () => this.cleanup());

        console.log('⚡ BattleSpeedController инициализирован');
    }

    // ═══════════════════════════════════════════════════════════════
    // ПУБЛИЧНЫЙ API
    // ═══════════════════════════════════════════════════════════════

    /**
     * Получить текущую скорость интервала в мс
     */
    getSpeed() {
        return this.SPEEDS[this.mode].interval;
    }

    /**
     * Получить множитель для анимаций
     * Нормальная скорость = 1.0, быстрая = 2.5
     */
    getAnimationMultiplier() {
        if (window.fastSimulation) return 5.0;
        return this.SPEEDS[this.mode].multiplier;
    }

    /**
     * Масштабировать длительность анимации
     * @param {number} baseDuration - базовая длительность в мс
     */
    scaleDuration(baseDuration) {
        if (window.fastSimulation) return 10;
        return Math.max(10, Math.round(baseDuration / this.getAnimationMultiplier()));
    }

    /**
     * Масштабировать скорость анимации PIXI
     * @param {number} baseSpeed - базовая скорость (0.1 - 0.3)
     */
    scaleAnimationSpeed(baseSpeed) {
        if (window.fastSimulation) return baseSpeed * 5;
        return baseSpeed * this.getAnimationMultiplier();
    }

    /**
     * Переключить режим скорости (normal ↔ fast)
     */
    toggle() {
        this.mode = this.mode === 'normal' ? 'fast' : 'normal';

        // Обновляем глобальные переменные для совместимости
        window.battleSpeed = this.getSpeed();
        window.battleSpeedMode = this.mode;

        // Обновляем UI кнопки
        this._updateSpeedButton();

        // Если бой активен и не на паузе - перезапускаем интервал
        if (this.battleInterval && this.isActive && !this.isPaused) {
            this._restartInterval();
        }

        // Обновляем скорости существующих анимаций
        this._updateExistingAnimations();

        console.log(`⚡ Скорость: ${this.mode} (${this.getSpeed()}ms, x${this.getAnimationMultiplier()})`);
    }

    /**
     * Установить конкретный режим
     * @param {'normal' | 'fast'} mode
     */
    setMode(mode) {
        if (this.mode !== mode && this.SPEEDS[mode]) {
            this.mode = mode;
            window.battleSpeed = this.getSpeed();
            window.battleSpeedMode = this.mode;
            this._updateSpeedButton();

            if (this.battleInterval && this.isActive && !this.isPaused) {
                this._restartInterval();
            }
            this._updateExistingAnimations();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // УПРАВЛЕНИЕ БОЕВЫМ ЦИКЛОМ
    // ═══════════════════════════════════════════════════════════════

    /**
     * Запустить боевой цикл
     * @param {Function} callback - функция фазы боя (executeBattlePhase)
     */
    startBattle(callback) {
        this.stopBattle();

        this.battleCallback = callback;
        this.isActive = true;
        this.isPaused = false;

        // Синхронизируем UI с текущим режимом
        this._updateSpeedButton();
        this._updatePauseButton();

        this._startInterval();

        console.log(`▶️ Боевой цикл запущен (${this.getSpeed()}ms)`);
    }

    /**
     * Остановить боевой цикл
     */
    stopBattle() {
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
        }
        this.battleCallback = null;
        this.isActive = false;
        this.isPaused = false;

        console.log('⏹️ Боевой цикл остановлен');
    }

    /**
     * Пауза / Продолжить
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        window.isPaused = this.isPaused;

        if (this.isPaused) {
            // Останавливаем интервал при паузе
            if (this.battleInterval) {
                clearInterval(this.battleInterval);
                this.battleInterval = null;
            }
        } else {
            // Возобновляем интервал
            if (this.isActive && this.battleCallback) {
                this._startInterval();
            }
        }

        this._updatePauseButton();

        console.log(this.isPaused ? '⏸️ Пауза' : '▶️ Продолжено');
    }

    /**
     * Полная очистка
     */
    cleanup() {
        this.stopBattle();
        console.log('🧹 BattleSpeedController очищен');
    }

    // ═══════════════════════════════════════════════════════════════
    // ПРИВАТНЫЕ МЕТОДЫ
    // ═══════════════════════════════════════════════════════════════

    _startInterval() {
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
        }

        const callback = this.battleCallback;
        this.battleInterval = setInterval(async () => {
            if (this.isActive && !this.isPaused && callback) {
                try {
                    await callback();
                } catch (error) {
                    console.error('❌ Ошибка в боевом цикле:', error);
                    this.stopBattle();
                }
            }
        }, this.getSpeed());
    }

    _restartInterval() {
        if (this.battleCallback) {
            this._startInterval();
            console.log(`🔄 Интервал перезапущен (${this.getSpeed()}ms)`);
        }
    }

    _updateSpeedButton() {
        const btn = document.querySelector('#speed-button');
        if (!btn) return;

        const config = this.SPEEDS[this.mode];
        btn.innerHTML = config.icon;
        btn.title = config.title;
        btn.style.background = config.bg;
    }

    _updatePauseButton() {
        const btn = document.querySelector('#pause-button');
        if (!btn) return;

        if (this.isPaused) {
            btn.innerHTML = '▶️';
            btn.title = 'Продолжить';
            btn.style.background = '#4CAF50';
        } else {
            btn.innerHTML = '⏸';
            btn.title = 'Пауза';
            btn.style.background = 'rgba(85, 85, 85, 0.9)';
        }
    }

    _updateExistingAnimations() {
        const multiplier = this.getAnimationMultiplier();

        // Обновляем спрайты магов игрока
        if (window.playerWizardSprites) {
            Object.values(window.playerWizardSprites).forEach(container => {
                this._updateSpriteSpeed(container);
            });
        }

        // Обновляем спрайты врагов
        if (window.enemyWizardSprites) {
            Object.values(window.enemyWizardSprites).forEach(container => {
                this._updateSpriteSpeed(container);
            });
        }

        // Обновляем дракона
        if (window.pixiDragon) {
            const dragon = window.pixiDragon.get();
            if (dragon) {
                if (dragon.idleSprite?.animationSpeed !== undefined) {
                    if (!dragon.baseIdleSpeed) dragon.baseIdleSpeed = 0.12;
                    dragon.idleSprite.animationSpeed = dragon.baseIdleSpeed * multiplier;
                }
                if (dragon.castSprite?.animationSpeed !== undefined) {
                    if (!dragon.baseCastSpeed) dragon.baseCastSpeed = 0.15;
                    dragon.castSprite.animationSpeed = dragon.baseCastSpeed * multiplier;
                }
            }
        }

        console.log('🎬 Анимации обновлены');
    }

    _updateSpriteSpeed(container) {
        if (!container?.sprite?.animationSpeed) return;

        const sprite = container.sprite;

        // Сохраняем базовую скорость при первом обновлении
        if (!container.baseAnimationSpeed) {
            container.baseAnimationSpeed = sprite.animationSpeed / (this.SPEEDS.normal.multiplier);
            // Если уже была быстрая скорость, корректируем
            if (this.mode === 'fast') {
                container.baseAnimationSpeed = sprite.animationSpeed / this.SPEEDS.fast.multiplier;
            }
        }

        sprite.animationSpeed = container.baseAnimationSpeed * this.getAnimationMultiplier();
    }

    /**
     * Статус для отладки
     */
    getStatus() {
        return {
            mode: this.mode,
            speed: this.getSpeed(),
            multiplier: this.getAnimationMultiplier(),
            isActive: this.isActive,
            isPaused: this.isPaused,
            hasInterval: !!this.battleInterval
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════════════════════

// Создаём единственный экземпляр
window.battleSpeedController = new BattleSpeedController();

// Совместимость с существующим кодом - глобальные переменные
window.battleSpeed = window.battleSpeedController.getSpeed();
window.battleSpeedMode = window.battleSpeedController.mode;

// Совместимость с animation-speed-manager.js
window.getAnimationSpeedMultiplier = () => window.battleSpeedController.getAnimationMultiplier();
window.getScaledDuration = (base) => window.battleSpeedController.scaleDuration(base);
window.getScaledAnimationSpeed = (base) => window.battleSpeedController.scaleAnimationSpeed(base);

// Глобальные функции для кнопок (вызываются из HTML onclick)
window.toggleBattleSpeed = () => window.battleSpeedController.toggle();
window.togglePause = () => window.battleSpeedController.togglePause();

// ═══════════════════════════════════════════════════════════════
// ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМ КОДОМ
// ═══════════════════════════════════════════════════════════════

// Переопределяем startBattle чтобы использовать контроллер
const originalStartBattle = window.startBattle;
window.startBattle = function() {
    console.log('⚡ Использую BattleSpeedController для боя');

    // Останавливаем предыдущий бой
    window.battleSpeedController.stopBattle();

    // Вызываем оригинальную функцию
    if (originalStartBattle) {
        originalStartBattle.apply(this, arguments);
    }

    // Очищаем старый интервал если есть
    if (window.battleInterval) {
        clearInterval(window.battleInterval);
        window.battleInterval = null;
    }

    // Запускаем боевой цикл через контроллер
    window.battleSpeedController.startBattle(window.executeBattlePhase);
};

// Переопределяем closeBattle для очистки
const originalCloseBattle = window.closeBattle;
window.closeBattle = function() {
    console.log('⚡ Закрытие боя через BattleSpeedController');

    // Останавливаем контроллер
    window.battleSpeedController.stopBattle();

    // Вызываем оригинальную функцию если есть
    if (originalCloseBattle) {
        originalCloseBattle.apply(this, arguments);
    }
};

// Отладка
window.battleSpeedStatus = () => {
    const status = window.battleSpeedController.getStatus();
    console.table(status);
    return status;
};

console.log('✅ BattleSpeedController загружен. Используйте battleSpeedStatus() для отладки');
