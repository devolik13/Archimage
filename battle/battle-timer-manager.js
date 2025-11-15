// battle-timer-manager.js - Централизованное управление таймерами боя
console.log('✅ battle-timer-manager.js загружен');

class BattleTimerManager {
    constructor() {
        this.battleInterval = null;
        this.activeTimeouts = new Set();
        this.animationTimeouts = new Map();
        this.isActive = false;
        this.battleSpeed = 2000;
        
        // Слушаем событие закрытия/перехода
        window.addEventListener('beforeunload', () => this.cleanup());
        
        console.log('⏱️ BattleTimerManager инициализирован');
    }
    
    // Запуск основного цикла боя
    startBattleLoop(callback, speed = 2000) {
        // ВСЕГДА очищаем старый интервал
        this.stopBattleLoop();
        
        this.battleSpeed = speed;
        this.isActive = true;
        
        // Создаем новый интервал
        this.battleInterval = setInterval(() => {
            if (this.isActive) {
                try {
                    callback();
                } catch (error) {
                    console.error('❌ Ошибка в боевом цикле:', error);
                    // При ошибке останавливаем бой
                    this.stopBattleLoop();
                }
            }
        }, speed);
        
        console.log(`▶️ Боевой цикл запущен (${speed}ms)`);
        return this.battleInterval;
    }
    
    // Остановка цикла боя
    stopBattleLoop() {
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
            this.isActive = false;
            console.log('⏹️ Боевой цикл остановлен');
        }
    }
    
    // Пауза (не очищает интервал)
    pause() {
        this.isActive = false;
        console.log('⏸️ Бой на паузе');
    }
    
    // Продолжение после паузы
    resume() {
        if (this.battleInterval) {
            this.isActive = true;
            console.log('▶️ Бой продолжен');
        }
    }
    
    // Изменение скорости
    changeSpeed(newSpeed) {
        if (this.battleInterval && this.isActive) {
            const callback = this.battleInterval._callback || window.executeBattlePhase;
            this.startBattleLoop(callback, newSpeed);
        }
        this.battleSpeed = newSpeed;
    }
    
    // Безопасный setTimeout для анимаций
    setTimeout(id, callback, delay) {
        // Отменяем старый таймаут с таким же id
        if (this.animationTimeouts.has(id)) {
            clearTimeout(this.animationTimeouts.get(id));
            this.animationTimeouts.delete(id);
        }
        
        const timeoutId = setTimeout(() => {
            this.animationTimeouts.delete(id);
            try {
                callback();
            } catch (error) {
                console.error(`❌ Ошибка в таймауте ${id}:`, error);
            }
        }, delay);
        
        this.animationTimeouts.set(id, timeoutId);
        return timeoutId;
    }
    
    // Отмена конкретного таймаута
    clearTimeout(id) {
        if (this.animationTimeouts.has(id)) {
            clearTimeout(this.animationTimeouts.get(id));
            this.animationTimeouts.delete(id);
        }
    }
    
    // Полная очистка всех таймеров
    cleanup() {
        console.log('🧹 Очистка всех таймеров боя...');
        
        // Останавливаем основной цикл
        this.stopBattleLoop();
        
        // Очищаем все таймауты анимаций
        this.animationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.animationTimeouts.clear();
        
        // Очищаем Set обычных таймаутов
        this.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.activeTimeouts.clear();
        
        console.log('✅ Все таймеры очищены');
    }
    
    // Статус для отладки
    getStatus() {
        return {
            isActive: this.isActive,
            hasBattleLoop: !!this.battleInterval,
            battleSpeed: this.battleSpeed,
            activeTimeouts: this.animationTimeouts.size,
            animationIds: Array.from(this.animationTimeouts.keys())
        };
    }
}

// Создаем глобальный экземпляр
window.battleTimerManager = new BattleTimerManager();

// ============ ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМ КОДОМ ============

// Переопределяем startBattle чтобы использовать менеджер
const originalStartBattle = window.startBattle;
window.startBattle = function() {
    console.log('🔧 Использую безопасный startBattle');
    
    // Очищаем все старые таймеры
    window.battleTimerManager.cleanup();
    
    // Вызываем оригинальную функцию
    if (originalStartBattle) {
        originalStartBattle.apply(this, arguments);
    }
    
    // Заменяем обычный setInterval на безопасный
    if (window.battleInterval) {
        clearInterval(window.battleInterval);
    }
    
    // Запускаем через менеджер
    window.battleTimerManager.startBattleLoop(
        window.executeBattlePhase, 
        window.battleSpeed || 2000
    );
};

// Переопределяем togglePause
const originalTogglePause = window.togglePause;
window.togglePause = function() {
    console.log('🔧 Использую безопасный togglePause');
    
    window.isPaused = !window.isPaused;
    
    if (window.isPaused) {
        window.battleTimerManager.pause();
    } else {
        window.battleTimerManager.resume();
    }
    
    // Обновляем UI
    const pauseButton = document.querySelector('#pause-button');
    if (pauseButton) {
        pauseButton.innerHTML = window.isPaused ? '▶️' : '⏸';
        pauseButton.title = window.isPaused ? 'Продолжить' : 'Пауза';
        pauseButton.style.background = window.isPaused ? '#4CAF50' : '#555';
    }
};

// Переопределяем toggleSpeed
const originalToggleSpeed = window.toggleSpeed;
window.toggleSpeed = function() {
    console.log('🔧 Использую безопасный toggleSpeed');
    
    const speedButton = document.querySelector('#speed-button');
    
    if (!window.battleSpeedMode || window.battleSpeedMode === 'normal') {
        window.battleSpeedMode = 'fast';
        window.battleSpeed = 1000;
        if (speedButton) {
            speedButton.innerHTML = '⚡⚡';
            speedButton.title = 'Очень быстро';
            speedButton.style.background = '#FFA500';
        }
    } else if (window.battleSpeedMode === 'fast') {
        window.battleSpeedMode = 'veryfast';
        window.battleSpeed = 500;
        if (speedButton) {
            speedButton.innerHTML = '⚡⚡⚡';
            speedButton.title = 'Замедлить';
            speedButton.style.background = '#FFD700';
        }
    } else {
        window.battleSpeedMode = 'normal';
        window.battleSpeed = 2000;
        if (speedButton) {
            speedButton.innerHTML = '▶';
            speedButton.title = 'Ускорить';
            speedButton.style.background = '#555';
        }
    }
    
    // Применяем новую скорость
    window.battleTimerManager.changeSpeed(window.battleSpeed);
    
    console.log(`⚡ Скорость боя: ${window.battleSpeedMode} (${window.battleSpeed}ms)`);
};

// Очистка при выходе из боя
const originalCloseBattle = window.closeBattle;
window.closeBattle = function() {
    console.log('🔧 Закрытие боя с очисткой таймеров');
    
    // Очищаем все таймеры
    window.battleTimerManager.cleanup();
    
    // Вызываем оригинальную функцию если есть
    if (originalCloseBattle) {
        originalCloseBattle.apply(this, arguments);
    }
};

// Добавляем команды для отладки
window.battleTimerStatus = function() {
    const status = window.battleTimerManager.getStatus();
    console.table(status);
    return status;
};

console.log('✅ Безопасная система таймеров активирована');
console.log('💡 Используйте battleTimerStatus() для проверки состояния');