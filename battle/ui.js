// battle/ui.js - Интерфейс боя (полноэкранный для Telegram)...

console.log('✅ battle/ui.js загружен');

// Глобальные переменные для управления скоростью
window.battleSpeedMode = 'normal'; // 'normal' или 'fast'

// --- Отображение поля боя (ПОЛНОЭКРАННОЕ) ---
function renderBattleField() {
    console.log('🎨 Рендер полноэкранного поля боя');

    // Скрываем аватар игрока при входе в бой
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
        console.log('👤 Аватар скрыт на время боя');
    }

    if (!document.getElementById('battle-field-styles')) {
        console.warn('⚠️ Battle field styles not loaded, loading now...');
        addBattleFieldStyles();
    }
    
    const enemyFormation = window.enemyFormation || [];
    const playerFormation = window.playerFormation || [];
    const playerWizards = window.playerWizards || [];
    
    // Полноэкранный контейнер вместо модального окна
    const modalContent = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #1a1a2e;
            color: white;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        " id="battle-field-modal">
            
            <!-- Поле боя (занимает всё место) -->
            <div id="pixi-battle-container" style="
                flex: 1;
                width: 100%;
                position: relative;
                padding: 20px 0;
            "></div>
            
            <!-- НИЖНЯЯ панель с информацией (приподнята выше) -->
            <div style="
                position: absolute;
                bottom: 5px;
                left: 0;
                right: 0;
                padding: 8px 10px;
                background: rgba(40, 40, 60, 0.95);
                border-top: 2px solid #7289da;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div id="battle-info-top" style="display: flex; gap: 15px; align-items: center; font-size: 11px;">
                    <!-- Информация о бойцах будет здесь -->
                </div>
                
                <div id="weather-display" style="display: flex; align-items: center; gap: 5px;">
                    <div id="weather-icon" style="font-size: 20px;">❓</div>
                    <div id="weather-name" style="font-size: 11px;">Загрузка...</div>
                </div>
            </div>
            
            <!-- Кнопки управления (фиксированные справа) -->
            <div style="
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 20;
            ">
                <button style="
                    width: 50px;
                    height: 50px;
                    background: rgba(85, 85, 85, 0.9);
                    color: white;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                " onclick="toggleBattleLog()" title="Лог боя">📜</button>
                
                <button id="pause-button" style="
                    width: 50px;
                    height: 50px;
                    background: rgba(85, 85, 85, 0.9);
                    color: white;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                " onclick="togglePause()" title="Пауза">⏸</button>
                
                <button id="speed-button" style="
                    width: 50px;
                    height: 50px;
                    background: rgba(85, 85, 85, 0.9);
                    color: white;
                    border: 2px solid #7289da;
                    border-radius: 8px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                " onclick="toggleBattleSpeed()" title="Скорость">▶</button>
                
                <button style="
                    width: 50px;
                    height: 50px;
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    border: 2px solid #dc3545;
                    border-radius: 8px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                " onclick="closeBattleFieldModal()" title="Закрыть">❌</button>
            </div>
            
            <!-- Выезжающая панель логов -->
            <div id="battle-log-panel" style="
                position: absolute;
                right: -100%;
                top: 0;
                width: 80%;
                max-width: 400px;
                height: 100%;
                background: rgba(30, 30, 45, 0.98);
                transition: right 0.3s;
                padding: 15px;
                overflow-y: auto;
                border-left: 3px solid #7289da;
                display: none;
                z-index: 25;
                box-shadow: -4px 0 12px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="color: #7289da; font-size: 16px; margin: 0;">📜 Лог боя</h3>
                    <button onclick="toggleBattleLog()" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                    ">×</button>
                </div>
                <div id="battle-log" style="
                    font-size: 12px;
                    overflow-y: auto;
                    height: calc(100% - 40px);
                    line-height: 1.6;
                ">
                    ${(window.battleLog || []).length > 0 ? 
                        window.battleLog.map(log => `<div style="margin-bottom: 5px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 4px;">${log}</div>`).join('') : 
                        '<div style="color: #777;">Бой начался...</div>'}
                </div>
            </div>
        </div>
    `;
    
    // Вставляем напрямую в body
    const container = document.createElement('div');
    container.innerHTML = modalContent;
    container.id = 'battle-field-fullscreen-container';
    
    document.body.appendChild(container);
    window.currentModal = { container };
    
    // Добавляем информацию о бойцах
    createBattleInfoTop();
    
    // Устанавливаем отображение погоды
    setTimeout(() => {
        setWeatherDisplay();
    }, 100);

    // Инициализируем PixiJS
    if (window.initPixiBattle) {
        setTimeout(() => window.initPixiBattle(), 100);
    }

    const logElement = document.getElementById('battle-log');
    if (logElement) {
        logElement.scrollTop = logElement.scrollHeight;
    }
}

// Новая функция для верхней панели
function createBattleInfoTop() {
    const infoContainer = document.getElementById('battle-info-top');
    if (!infoContainer) {
        console.warn('⚠️ battle-info-top не найден');
        return;
    }
    
    const playerLevel = typeof window.calculatePlayerLevel === 'function' ? 
        window.calculatePlayerLevel() : 1;
    const enemyLevel = Math.floor(Math.random() * 5) + (playerLevel - 2);
    
    infoContainer.innerHTML = `
        <!-- Игрок -->
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 2px solid #4CAF50;
            ">👤</div>
            <div>
                <div style="font-size: 10px; color: #4CAF50; font-weight: bold;">${window.userData?.username || 'Игрок'}</div>
                <div style="font-size: 9px; color: #ffa500;">⭐ Ур. ${playerLevel}</div>
            </div>
        </div>
        
        <div style="font-size: 20px; color: #FFD700;">⚔️</div>
        
        <!-- Противник -->
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 2px solid #ff6b6b;
            ">🤖</div>
            <div>
                <div style="font-size: 10px; color: #ff6b6b; font-weight: bold;">Противник</div>
                <div style="font-size: 9px; color: #ffa500;">⭐ Ур. ${enemyLevel}</div>
            </div>
        </div>
    `;
}

// Функция установки отображения погоды
function setWeatherDisplay() {
    const weatherIcon = document.getElementById('weather-icon');
    const weatherName = document.getElementById('weather-name');
    
    if (!weatherIcon || !weatherName) return;
    
    const currentWeather = window.currentWeather;
    
    if (!currentWeather) {
        weatherIcon.innerHTML = '❓';
        weatherName.innerHTML = 'Не установлена';
        return;
    }
    
    const weatherInfo = {
        'drought': { icon: '☀️', name: 'Засуха' },
        'ice_fog': { icon: '❄️', name: 'Ледяной туман' },
        'sandstorm': { icon: '🏜️', name: 'Песчаная буря' },
        'storm': { icon: '🌪️', name: 'Шторм' }
    };
    
    const info = weatherInfo[currentWeather];
    if (info) {
        weatherIcon.innerHTML = info.icon;
        weatherName.innerHTML = info.name;
    }
}

// Функция переключения скорости боя
function toggleBattleSpeed() {
    const speedButton = document.querySelector('#speed-button');
    
    if (window.battleSpeedMode === 'normal') {
        window.battleSpeedMode = 'fast';
        window.battleSpeed = 1000;
        if (speedButton) {
            speedButton.innerHTML = '⚡';
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
    
    if (window.battleInterval) {
        clearInterval(window.battleInterval);
        if (!window.isPaused && window.battleState === 'active') {
            window.battleInterval = setInterval(window.executeBattlePhase, window.battleSpeed);
        }
    }
    
    console.log(`⚡ Скорость боя: ${window.battleSpeedMode} (${window.battleSpeed}ms)`);
}

// Улучшенная функция паузы
function togglePause() {
    const pauseButton = document.querySelector('#pause-button');
    
    window.isPaused = !window.isPaused;
    
    if (window.isPaused) {
        if (window.battleInterval) {
            clearInterval(window.battleInterval);
            window.battleInterval = null;
        }
        if (pauseButton) {
            pauseButton.innerHTML = '▶️';
            pauseButton.title = 'Продолжить';
            pauseButton.style.background = '#4CAF50';
        }
        console.log('⏸️ Бой на паузе');
    } else {
        if (window.battleInterval) {
            clearInterval(window.battleInterval);
        }
        window.battleInterval = setInterval(window.executeBattlePhase, window.battleSpeed);
        if (pauseButton) {
            pauseButton.innerHTML = '⏸';
            pauseButton.title = 'Пауза';
            pauseButton.style.background = '#555';
        }
        console.log('▶️ Бой продолжается');
    }
}

// Функция переключения лога
function toggleBattleLog() {
    const panel = document.getElementById('battle-log-panel');
    if (panel) {
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            setTimeout(() => {
                panel.style.right = '0';
            }, 10);
        } else {
            panel.style.right = '-100%';
            setTimeout(() => {
                panel.style.display = 'none';
            }, 300);
        }
    }
}

// --- Обновление интерфейса ---
function updateBattleField() {
    console.log('🔄 updateBattleField called');
    
    const battleLog = window.battleLog || [];
    
    // Обновляем лог боя
    const logElement = document.getElementById('battle-log');
    if (logElement) {
        // Показываем ВСЕ записи (было 20, потом 100)
        logElement.innerHTML = battleLog.length > 0 ?
            battleLog.map(log => `<div style="margin-bottom: 5px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 4px; white-space: pre-wrap; font-family: monospace;">${log}</div>`).join('') :
            '<div style="color: #777;">Бой начался...</div>';
        logElement.scrollTop = logElement.scrollHeight;
    }

    console.log('✅ updateBattleField completed');
}

// Управление модальным окном
function closeBattleFieldModal() {
    console.log("🚪 closeBattleFieldModal called");

    // КРИТИЧНО: Проверяем закрытие незавершенного PvP боя
    const isPvP = !window.isPvEBattle && window.selectedOpponent;
    const isBattleActive = window.battleState === 'active' || window.battleState === 'running';

    if (isPvP && isBattleActive) {
        console.warn('⚠️ Игрок закрывает незавершенный PvP бой - просчитываем до конца');

        // КРИТИЧНО: Останавливаем PIXI полностью ПЕРЕД симуляцией
        console.log('🛑 Останавливаем PIXI и анимации...');

        // Останавливаем интервалы боя
        if (window.battleInterval) {
            clearInterval(window.battleInterval);
            window.battleInterval = null;
        }

        // Останавливаем все анимации
        if (window.animationManager) {
            window.animationManager.clearAll();
        }

        // ВАЖНО: Полностью уничтожаем PIXI до симуляции (останавливает ticker)
        if (window.destroyPixiBattle) {
            window.destroyPixiBattle();
        }

        // Удаляем UI элементы боя
        const battleModal = document.getElementById("battle-field-modal");
        if (battleModal) {
            battleModal.remove();
            console.log("✅ battle-field-modal удален перед симуляцией");
        }

        const container = document.getElementById("battle-field-fullscreen-container");
        if (container) {
            container.remove();
        }

        const pixiContainer = document.getElementById("pixi-battle-container");
        if (pixiContainer) {
            pixiContainer.remove();
        }

        console.log('🤖 Симуляция боя до завершения без анимации...');

        // Устанавливаем флаги досрочного выхода и быстрой симуляции
        window.battleEarlyExit = true;
        window.fastSimulation = true; // КРИТИЧНО: отключает setTimeout в фазах боя

        console.log('⚡ Быстрая симуляция ВКЛЮЧЕНА (без анимаций)');

        // Функция быстрой симуляции боя до конца
        const simulateBattleToEnd = () => {
            const MAX_TURNS = 1000; // Защита от бесконечного цикла
            let turnCount = 0;
            let lastPlayerHP = 0;
            let lastEnemyHP = 0;

            // Запускаем симуляцию хода за ходом
            while (window.battleState === 'active' && turnCount < MAX_TURNS) {
                // Диагностика каждые 100 ходов
                if (turnCount % 100 === 0 && turnCount > 0) {
                    const playerHP = window.playerFormation.reduce((sum, wizardId) => {
                        if (wizardId) {
                            const wizard = window.playerWizards?.find(w => w.id === wizardId);
                            return sum + (wizard?.hp || 0);
                        }
                        return sum;
                    }, 0);

                    const enemyHP = window.enemyFormation.reduce((sum, wizard) => {
                        return sum + (wizard?.hp || 0);
                    }, 0);

                    console.log(`🔍 Ход ${turnCount}: Игрок HP=${playerHP}, Враг HP=${enemyHP}`);

                    // Если HP не меняется 200 ходов - принудительно завершаем
                    if (turnCount >= 200 && playerHP === lastPlayerHP && enemyHP === lastEnemyHP) {
                        console.warn('⚠️ HP не меняется - принудительное завершение боя');
                        // Побеждает тот, у кого больше HP
                        if (playerHP > enemyHP) {
                            window.enemyFormation.forEach(w => { if (w) w.hp = 0; });
                        } else {
                            window.playerFormation.forEach(wizardId => {
                                if (wizardId) {
                                    const wizard = window.playerWizards?.find(w => w.id === wizardId);
                                    if (wizard) wizard.hp = 0;
                                }
                            });
                        }
                        break;
                    }

                    lastPlayerHP = playerHP;
                    lastEnemyHP = enemyHP;
                }

                // Выполняем фазу боя без задержек
                if (typeof window.executeBattlePhase === 'function') {
                    window.executeBattlePhase();
                }

                turnCount++;

                // Если бой завершился, выходим из цикла
                if (window.battleState === 'finished') {
                    break;
                }
            }

            if (turnCount >= MAX_TURNS) {
                console.error('⚠️ Достигнут лимит ходов симуляции');
                // Принудительно завершаем и определяем победителя
                if (typeof window.checkBattleEnd === 'function') {
                    window.checkBattleEnd();
                }
            }

            console.log(`✅ Симуляция завершена за ${turnCount} ходов`);
        };

        // Запускаем симуляцию
        try {
            simulateBattleToEnd();
        } catch (error) {
            console.error('❌ Ошибка симуляции боя:', error);
        } finally {
            // ВАЖНО: Отключаем быструю симуляцию после завершения
            window.fastSimulation = false;
            console.log('⚡ Быстрая симуляция ВЫКЛЮЧЕНА');
        }

        // После симуляции checkBattleEnd уже вызвал onBattleCompleted и showBattleResult
        // Но нужно добавить earlyExit флаг к уже показанному результату
        // Подождем немного и если результат не показался, покажем вручную
        setTimeout(() => {
            const resultModal = document.getElementById('battle-result-modal');
            if (!resultModal) {
                console.warn('⚠️ Результат боя не показан после симуляции - принудительно показываем');
                // Определяем победителя
                const playerAlive = window.playerFormation?.some((wizardId) => {
                    if (wizardId) {
                        const wizard = window.playerWizards?.find(w => w.id === wizardId);
                        return wizard && wizard.hp > 0;
                    }
                    return false;
                });

                const battleResult = playerAlive ? 'win' : 'loss';
                const ratingChange = typeof window.calculateRatingChange === 'function' ?
                    window.calculateRatingChange(window.userData?.rating || 1000, window.selectedOpponent?.rating || 1000, battleResult) :
                    (battleResult === 'win' ? 25 : -25);

                if (typeof window.onBattleCompleted === 'function') {
                    window.onBattleCompleted(battleResult, { exp: 0 }, window.selectedOpponent?.level || 1, ratingChange);
                }

                if (typeof window.showBattleResult === 'function') {
                    const battleData = {
                        opponentName: window.selectedOpponent?.username || 'Противник',
                        opponentRating: window.selectedOpponent?.rating || 1000,
                        ratingChange: ratingChange,
                        rewards: { exp: 0 },
                        battleDuration: 0,
                        earlyExit: true
                    };
                    window.showBattleResult(battleResult, battleData);
                }
            }

            // Показываем город (ресурсы боя уже удалены выше)
            returnToCity();
        }, 500);

        return; // Не закрываем сразу - сначала покажем результат
    }

    // Для PvE или уже завершенных боев - обычное закрытие
    window.battleState = 'stopped';
    cleanupBattleResources();
    returnToCity();
}

// Вспомогательная функция очистки ресурсов боя
function cleanupBattleResources() {
    console.log('🧹 Очистка ресурсов боя');

    // Очищаем PixiJS
    if (window.destroyPixiBattle) {
        window.destroyPixiBattle();
    }

    if (window.battleInterval) {
        clearInterval(window.battleInterval);
        window.battleInterval = null;
    }

    if (window.animationManager) {
        window.animationManager.clearAll();
    }

    // Удаляем элементы UI боя
    const battleModal = document.getElementById("battle-field-modal");
    if (battleModal) {
        battleModal.remove();
        console.log("✅ battle-field-modal удален");
    }

    const container = document.getElementById("battle-field-fullscreen-container");
    if (container) {
        container.remove();
        console.log("✅ battle-field-fullscreen-container удален");
    }

    const pixiContainer = document.getElementById("pixi-battle-container");
    if (pixiContainer) {
        pixiContainer.remove();
        console.log("✅ pixi-battle-container удален");
    }

    if (window.currentModal) {
        window.currentModal = null;
    }
}

// Вспомогательная функция возврата в город
function returnToCity() {
    console.log("🏙️ Возврат в город");

    // Разблокируем скролл body
    document.body.style.overflow = '';

    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'block';
        gameArea.style.visibility = 'visible';
        console.log("✅ game-area показан");
    }

    const cityGrid = document.getElementById('city-grid');
    if (cityGrid) {
        cityGrid.style.display = 'block';
        cityGrid.style.visibility = 'visible';
        console.log("✅ city-grid показан");
    }

    const cityView = document.getElementById('city-view');
    if (cityView) {
        cityView.style.display = 'block';
        cityView.style.visibility = 'visible';
        console.log("✅ city-view показан");
    }

    // Перерисовываем город если нужно
    if (window.userData && window.userData.faction) {
        setTimeout(() => {
            if (typeof window.switchToCityView === 'function') {
                window.switchToCityView(window.userData.faction);
            } else if (typeof window.initCityViewSystem === 'function') {
                window.initCityViewSystem();
            }

            // Пересоздаём аватар игрока
            if (typeof window.createPlayerAvatarUI === 'function') {
                window.createPlayerAvatarUI();
            }
        }, 100);
    }

    console.log("✅ Возврат в город завершен");
}

// Поиск земляной стены в позиции (для совместимости)
function findEarthWallAtPosition(col, row) {
    if (!window.activeWalls) return null;
    return window.activeWalls.find(wall => 
        wall.type === 'earth_wall_hp' && 
        wall.column === col && 
        wall.rows.includes(row) && 
        wall.hp > 0
    );
}

// Поиск ветряной стены в позиции (для совместимости)
function findWindWallAtPosition(col, row) {
    if (!window.activeWalls) return null;
    if (col !== 2 && col !== 3) return null;
    
    return window.activeWalls.find(wall => 
        wall.type === 'wind_wall' && 
        wall.positions && 
        wall.positions.includes(row) &&
        wall.turnsLeft > 0
    );
}

// Обновление земляных стен (заглушка для совместимости)
function updateEarthWalls() {
    // Теперь стены обрабатываются в PixiJS
}

// Обновление ветряных стен (заглушка для совместимости)
function updateWindWalls() {
    // Теперь стены обрабатываются в PixiJS
}

// --- CSS стили ---
function addBattleFieldStyles() {
    if (document.getElementById('battle-field-styles')) return;
    const style = document.createElement('style');
    style.id = 'battle-field-styles';
    style.textContent = `
        /* Базовые стили для совместимости */
        .battle-cell {
            position: relative;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
            #battle-info-top {
                font-size: 10px;
            }
            
            #battle-info-top > div {
                gap: 5px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Экспорт
window.renderBattleField = renderBattleField;
window.closeBattleFieldModal = closeBattleFieldModal;
window.cleanupBattleResources = cleanupBattleResources;
window.returnToCity = returnToCity;
window.togglePause = togglePause;
window.toggleBattleSpeed = toggleBattleSpeed;
window.toggleBattleLog = toggleBattleLog;
window.updateBattleField = updateBattleField;
window.findEarthWallAtPosition = findEarthWallAtPosition;
window.findWindWallAtPosition = findWindWallAtPosition;
window.updateEarthWalls = updateEarthWalls;
window.updateWindWalls = updateWindWalls;
window.setWeatherDisplay = setWeatherDisplay;
window.createBattleInfoTop = createBattleInfoTop;

console.log('✅ UI (полноэкранный режим) готов');