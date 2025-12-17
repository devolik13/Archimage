// wizards/adventure/pve-ui.js

/**
 * Форматирует награду времени для отображения
 * @param {number} minutes - количество минут
 * @returns {string} - отформатированная строка
 */
function formatTimeReward(minutes) {
    if (minutes >= 1440) {
        // Показываем в днях для больших наград
        const days = Math.floor(minutes / 1440);
        const daysText = days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней');
        return `${days} ${daysText}`;
    } else if (minutes >= 60) {
        // Показываем в часах
        const hours = Math.floor(minutes / 60);
        const hoursText = hours === 1 ? 'час' : (hours < 5 ? 'часа' : 'часов');
        return `${hours} ${hoursText}`;
    } else {
        // Показываем в минутах
        const minutesText = minutes === 1 ? 'минуту' : (minutes < 5 ? 'минуты' : 'минут');
        return `${minutes} ${minutesText}`;
    }
}

/**
 * Показывает меню выбора глав PvE
 */
function showPvEChaptersMenu() {
    const progress = loadPvEProgress();

    const chaptersHTML = `
        <div style="padding: 20px; max-width: 600px; background: linear-gradient(135deg, rgba(44, 44, 61, 0.98), rgba(33, 33, 46, 0.98)); border-radius: 12px; color: white;">
            <h2 style="margin: 0 0 20px 0; color: #7289da; text-align: center; font-size: 24px;">
                ⚔️ Приключения
            </h2>

            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Глава 1 -->
                <div onclick="showChapter1Levels()" style="
                    padding: 20px;
                    background: linear-gradient(135deg, #4a4a6a, #3a3a5a);
                    border-radius: 10px;
                    cursor: pointer;
                    border: 2px solid #5a5a7a;
                    transition: all 0.3s;
                    position: relative;
                " onmouseover="this.style.borderColor='#7289da'; this.style.transform='scale(1.02)'"
                   onmouseout="this.style.borderColor='#5a5a7a'; this.style.transform='scale(1)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0 0 8px 0; color: #ff6b6b; font-size: 20px;">
                                🔥 Глава 1: Испытание Стихий
                            </h3>
                            <p style="margin: 0; color: #aaa; font-size: 14px;">
                                Пройдено уровней: ${progress.chapter1?.maxLevel || 0} / 50
                            </p>
                        </div>
                        <div style="font-size: 32px;">➡️</div>
                    </div>
                </div>

                <!-- Глава 2 (заблокирована) -->
                <div style="
                    padding: 20px;
                    background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
                    border-radius: 10px;
                    border: 2px solid #3a3a4a;
                    opacity: 0.5;
                    cursor: not-allowed;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0 0 8px 0; color: #666; font-size: 20px;">
                                🔒 Глава 2: ???
                            </h3>
                            <p style="margin: 0; color: #555; font-size: 14px;">
                                Доступно после прохождения Главы 1
                            </p>
                        </div>
                        <div style="font-size: 32px;">🔒</div>
                    </div>
                </div>

                <!-- Глава 3 (заблокирована) -->
                <div style="
                    padding: 20px;
                    background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
                    border-radius: 10px;
                    border: 2px solid #3a3a4a;
                    opacity: 0.5;
                    cursor: not-allowed;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0 0 8px 0; color: #666; font-size: 20px;">
                                🔒 Глава 3: ???
                            </h3>
                            <p style="margin: 0; color: #555; font-size: 14px;">
                                Доступно после прохождения Главы 2
                            </p>
                        </div>
                        <div style="font-size: 32px;">🔒</div>
                    </div>
                </div>
            </div>

            <button onclick="closePvEModal()" style="
                margin-top: 20px;
                padding: 12px 24px;
                width: 100%;
                background: linear-gradient(180deg, #dc3545, #a71d2a);
                color: white;
                border: 2px solid #ff6b6b;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                transition: background 0.3s;
            " onmouseover="this.style.background='linear-gradient(180deg, #e74c5c, #b72d3d)'" onmouseout="this.style.background='linear-gradient(180deg, #dc3545, #a71d2a)'">
                Назад
            </button>
        </div>
    `;

    showPvEModal(chaptersHTML);
}

/**
 * Показывает уровни Главы 1 - используем новую карту
 */
function showChapter1Levels() {
    // Используем новую систему карты приключений
    if (typeof showAdventureMap === 'function') {
        closePvEModal();

        // Определяем текущую карту по прогрессу игрока
        const progress = loadPvEProgress();
        const maxLevel = progress.chapter1?.maxLevel || 1;

        // Выбираем карту в зависимости от достигнутого уровня
        let mapRange = '1-10'; // По умолчанию первая карта

        if (maxLevel >= 41) {
            mapRange = '41-50'; // Царство Хаоса
        } else if (maxLevel >= 31) {
            mapRange = '31-40'; // Земные глубины
        } else if (maxLevel >= 21) {
            mapRange = '21-30'; // Грозовые равнины
        } else if (maxLevel >= 11) {
            mapRange = '11-20'; // Ледяные вершины
        }
        // else остаётся '1-10' (Огненные пещеры)

        console.log(`🗺️ Открытие карты приключений: ${mapRange} (maxLevel: ${maxLevel})`);
        showAdventureMap(mapRange);
        return;
    }

    // Fallback на старый UI если карта не загружена
    showChapter1LevelsFallback();
}

/**
 * Старый UI списка уровней (fallback)
 */
function showChapter1LevelsFallback() {
    const progress = loadPvEProgress();
    const maxUnlockedLevel = progress.chapter1?.maxLevel || 1;

    // Получаем все уровни из конфигурации
    const levels = window.CHAPTER_1_LEVELS || [];

    // Группируем уровни по 10 для удобного отображения
    let levelsHTML = '';

    for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const isUnlocked = level.id <= maxUnlockedLevel;
        const isCompleted = progress.chapter1?.completed?.[level.id] || false;
        const isBoss = level.type === "miniboss" || level.type === "finalboss";

        // Определяем иконку
        let icon = '⚔️';
        if (isBoss) {
            if (level.type === "finalboss") icon = '👑';
            else icon = '💀';
        }

        // Определяем цвет рамки
        let borderColor = '#3a3a4a';
        let bgColor = '#2a2a3a';
        if (isCompleted) {
            borderColor = '#4CAF50';
            bgColor = '#2a3a2a';
        } else if (isBoss) {
            borderColor = '#ff6b6b';
            bgColor = '#3a2a2a';
        } else if (isUnlocked) {
            borderColor = '#5a5a7a';
            bgColor = '#3a3a5a';
        }

        levelsHTML += `
            <div onclick="${isUnlocked ? `startPvELevel(${level.id})` : ''}" style="
                padding: 15px;
                background: ${bgColor};
                border-radius: 8px;
                border: 2px solid ${borderColor};
                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                opacity: ${isUnlocked ? 1 : 0.4};
                transition: all 0.3s;
                margin-bottom: 10px;
            " ${isUnlocked ? `onmouseover="this.style.transform='scale(1.02)'; this.style.borderColor='#7289da'" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='${borderColor}'"` : ''}>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">${icon}</span>
                            <div>
                                <strong style="font-size: 16px; color: ${isBoss ? '#ff6b6b' : 'white'};">
                                    ${level.name}
                                </strong>
                                ${isCompleted ? '<span style="color: #4CAF50; margin-left: 8px;">✓</span>' : ''}
                                ${!isUnlocked ? '<span style="color: #999; margin-left: 8px;">🔒</span>' : ''}
                                <div style="font-size: 12px; color: #aaa; margin-top: 4px;">
                                    ${level.enemies.length} ${level.enemies.length === 1 ? 'враг' : 'врагов'}
                                    ${level.reward ? ` • Награда: ⏰ +${formatTimeReward(level.reward)}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const modalContent = `
        <div style="padding: 20px; max-width: 700px; max-height: 80vh; background: linear-gradient(135deg, rgba(44, 44, 61, 0.98), rgba(33, 33, 46, 0.98)); border-radius: 12px; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #7289da; font-size: 22px;">
                    🔥 Глава 1: Испытание Стихий
                </h2>
                <button onclick="showPvEChaptersMenu()" style="
                    padding: 8px 16px;
                    background: #4a4a6a;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                " onmouseover="this.style.background='#5a5a7a'" onmouseout="this.style.background='#4a4a6a'">
                    ← Назад
                </button>
            </div>

            <div style="margin-bottom: 15px; padding: 12px; background: rgba(114, 137, 218, 0.1); border-radius: 8px; border-left: 4px solid #7289da;">
                <p style="margin: 0; font-size: 14px; color: #aaa;">
                    💡 Прогресс: <strong style="color: white;">${maxUnlockedLevel} / 50</strong> уровней доступно
                </p>
            </div>

            <div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
                ${levelsHTML}
            </div>

            <button onclick="closePvEModal()" style="
                margin-top: 20px;
                padding: 12px 24px;
                width: 100%;
                background: linear-gradient(180deg, #dc3545, #a71d2a);
                color: white;
                border: 2px solid #ff6b6b;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            " onmouseover="this.style.background='linear-gradient(180deg, #e74c5c, #b72d3d)'" onmouseout="this.style.background='linear-gradient(180deg, #dc3545, #a71d2a)'">
                Назад
            </button>
        </div>
    `;

    showPvEModal(modalContent);
}

/**
 * Показывает модальное окно PvE
 */
function showPvEModal(content) {
    closePvEModal(); // Закрываем предыдущее окно если есть

    const modal = document.createElement('div');
    modal.innerHTML = content;
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        animation: modalFadeIn 0.3s ease-out;
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        animation: overlayFadeIn 0.3s ease-out;
    `;
    overlay.onclick = closePvEModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    window.currentPvEModal = { modal, overlay };
}

/**
 * Закрывает модальное окно PvE
 */
function closePvEModal() {
    if (window.currentPvEModal) {
        const { modal, overlay } = window.currentPvEModal;

        modal.style.animation = 'modalFadeOut 0.3s ease-in';
        overlay.style.animation = 'overlayFadeOut 0.3s ease-in';

        setTimeout(() => {
            if (modal && modal.parentNode) modal.remove();
            if (overlay && overlay.parentNode) overlay.remove();
            document.body.classList.remove('modal-open');
        }, 300);

        window.currentPvEModal = null;
    }
}

/**
 * Загружает прогресс PvE из БД (через window.userData)
 */
function loadPvEProgress() {
    // Используем БД через window.userData вместо localStorage
    const progress = window.userData?.pve_progress;
    if (progress && Object.keys(progress).length > 0) {
        return progress;
    }
    return {
        chapter1: {
            maxLevel: 1, // максимальный доступный уровень
            completed: {} // объект с пройденными уровнями {1: true, 2: true, ...}
        }
    };
}

/**
 * Сохраняет прогресс PvE в БД
 */
async function savePvEProgress(progress) {
    // Сохраняем в userData и в БД
    if (window.userData) {
        window.userData.pve_progress = progress;

        // Сохраняем в БД (ждём завершения)
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            await window.dbManager.savePlayer(window.userData);
            console.log('✅ PvE прогресс сохранён в БД:', progress);
        }
    }
}

/**
 * Запускает уровень PvE
 */
function startPvELevel(levelId) {
    console.log(`🎮 Запуск уровня ${levelId}`);

    const level = window.CHAPTER_1_LEVELS?.find(l => l.id === levelId);
    if (!level) {
        console.error(`Уровень ${levelId} не найден`);
        return;
    }

    // Закрываем модальное окно
    closePvEModal();

    // ВАЖНО: Создаем КОПИИ данных игрока для PvE, чтобы не потерять оригинальные данные
    const originalWizards = window.userData?.wizards || [];
    const originalFormation = window.userData?.formation || [null, null, null, null, null];

    // Делаем глубокую копию магов
    window.playerWizards = originalWizards.map(wizard => ({...wizard}));
    window.playerFormation = [...originalFormation];

    console.log('  - playerFormation:', window.playerFormation);
    console.log('  - playerWizards:', window.playerWizards.map(w => ({id: w.id, name: w.name, hp: w.hp})));

    // Формируем врагов для боя
    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];

    level.enemies.forEach((enemy, index) => {
        if (index < 5) {
            const enemyWizard = {
                ...enemy,
                max_hp: enemy.hp,
                max_armor: enemy.armor,
                spells: enemy.spells || [], // заклинания для элементалей и боссов
                spell_levels: enemy.spell_levels || null, // уровни заклинаний
                isAdventureEnemy: true, // ИСПРАВЛЕНО: используем правильный флаг
                pveLevel: levelId
            };

            // Добавляем faction ТОЛЬКО если она есть в конфиге (для элементалей/боссов)
            if (enemy.faction) {
                enemyWizard.faction = enemy.faction;
            }

            // Для элементалей добавляем логирование
            if (enemy.isElemental) {
                console.log(`🔥 Создан элементаль: ${enemy.name}`);
                console.log(`   Фракция: ${enemy.faction}`);
                console.log(`   Заклинания:`, enemy.spells);
                console.log(`   Уровни заклинаний:`, enemy.spell_levels);
            }

            // Элементали и финального босса ставим в позицию 2 (центр), остальных по порядку
            const formationIndex = (enemy.isElemental || enemy.isFinalBoss) ? 2 : index;
            enemyWizard.position = formationIndex; // Устанавливаем позицию врага
            window.enemyFormation[formationIndex] = enemyWizard;
            window.enemyWizards.push(enemyWizard);

            // DEBUG: Логируем позицию элементаля
            if (enemy.isElemental) {
                console.log(`🔥 [DEBUG] Элементаль позиция: formationIndex=${formationIndex}, enemyWizard.position=${enemyWizard.position}`);
                console.log(`🔥 [DEBUG] enemyFormation[${formationIndex}] = ${window.enemyFormation[formationIndex]?.name}`);
            }
        }
    });

    // Сохраняем текущий PvE уровень и очищаем данные PvP
    window.currentPvELevel = levelId;
    window.isPvEBattle = true;
    window.selectedOpponent = null; // ВАЖНО: Очищаем выбранного противника из PvP

    console.log(`⚔️ Враги сформированы:`, window.enemyWizards);

    // Запускаем бой через showBattleField (открывает UI и запускает бой)
    if (typeof window.showBattleField === 'function') {
        window.showBattleField();
    } else {
        console.error('Функция showBattleField не найдена');
    }
}

/**
 * Показывает красивое окно результата PvE боя
 */
function showPvEResult(result, levelId) {
    const isWin = result === 'win';
    const level = window.CHAPTER_1_LEVELS?.find(l => l.id === levelId);
    const levelName = level?.name || `Уровень ${levelId}`;
    const reward = level?.reward || 0;

    // Используем сохранённое значение из battle/core.js (ВАЖНО!)
    // Не загружаем прогресс заново, т.к. уровень уже помечен как пройденный
    const isFirstCompletion = window.lastPvEWasFirstCompletion ?? false;

    const bgColor = isWin
        ? 'linear-gradient(135deg, #1a3a1a 0%, #2d4a1d 100%)'
        : 'linear-gradient(135deg, #3a1a1a 0%, #4a1d1d 100%)';
    const borderColor = isWin ? '#4CAF50' : '#f44336';

    const overlay = document.createElement('div');
    overlay.id = 'pve-result-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
        <div style="
            background: ${bgColor};
            border: 3px solid ${borderColor};
            border-radius: 16px;
            padding: 24px 32px;
            text-align: center;
            color: white;
            min-width: 280px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            animation: scaleIn 0.3s ease-out;
        ">
            <div style="font-size: 56px; margin-bottom: 12px;">
                ${isWin ? '🏆' : '💀'}
            </div>
            <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px; color: ${borderColor};">
                ${isWin ? 'Победа!' : 'Поражение'}
            </div>
            <div style="font-size: 14px; color: #aaa; margin-bottom: 16px;">
                ${levelName}
            </div>
            ${isWin && reward > 0 && isFirstCompletion ? `
                <div style="
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 16px;
                ">
                    <span style="color: #ffd700;">⏰ +${formatTimeReward(reward)}</span>
                </div>
            ` : ''}
            ${isWin && reward > 0 && !isFirstCompletion ? `
                <div style="
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 16px;
                ">
                    <span style="color: #888;">ℹ️ Награда уже получена</span>
                </div>
            ` : ''}
            ${isWin && window.lastUnlockedSkin ? `
                <div style="
                    background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(168,85,247,0.2) 100%);
                    border: 2px solid #a855f7;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    animation: pulse 2s ease-in-out infinite;
                ">
                    <div style="font-size: 24px; margin-bottom: 5px;">✨</div>
                    <div style="color: #a855f7; font-weight: bold; font-size: 14px; margin-bottom: 3px;">
                        Разблокирован новый скин!
                    </div>
                    <div style="color: #d8b4fe; font-size: 12px;">
                        ${window.lastUnlockedSkin.name}
                    </div>
                </div>
            ` : ''}
            ${window.lastPvEWizardExpGained && window.lastPvEWizardExpGained.length > 0 ? `
                <div style="
                    background: rgba(255,165,0,0.1);
                    border: 1px solid rgba(255,165,0,0.3);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 16px;
                ">
                    <div style="font-size: 12px; color: #ffa500; margin-bottom: 8px; text-align: center;">Опыт магов</div>
                    ${window.lastPvEWizardExpGained.map(w => `
                        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0;">
                            <span style="color: #ddd;">${w.name}</span>
                            <span style="color: #ffa500; font-weight: bold;">
                                +${w.expGained} XP${w.levelGained > 0 ? ` <span style="color: #4CAF50;">⬆️ Ур.${w.newLevel}</span>` : ''}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div style="display: flex; gap: 10px; justify-content: center;">
                ${isWin ? `
                    <button onclick="closePvEResult(); showChapter1Levels();" style="
                        padding: 10px 20px;
                        background: #4a4a6a;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">К уровням</button>
                    ${levelId < 50 ? `
                        <button onclick="closePvEResult(); startPvELevel(${levelId + 1});" style="
                            padding: 10px 20px;
                            background: #4CAF50;
                            border: none;
                            border-radius: 8px;
                            color: white;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        ">Дальше ➡️</button>
                    ` : ''}
                ` : `
                    <button onclick="closePvEResult(); showChapter1Levels();" style="
                        padding: 10px 20px;
                        background: #4a4a6a;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">К уровням</button>
                    <button onclick="closePvEResult(); startPvELevel(${levelId});" style="
                        padding: 10px 20px;
                        background: #f44336;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">Ещё раз 🔄</button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function closePvEResult() {
    const overlay = document.getElementById('pve-result-overlay');
    if (overlay) {
        overlay.remove();
    }
    // Очищаем флаг первого прохождения
    window.lastPvEWasFirstCompletion = undefined;
    // Очищаем данные об опыте магов
    window.lastPvEWizardExpGained = undefined;
    // Возвращаемся в город
    if (typeof window.returnToCity === 'function') {
        window.returnToCity();
    }
}

// Экспорт функций
window.showPvEChaptersMenu = showPvEChaptersMenu;
window.showChapter1Levels = showChapter1Levels;
window.showPvEModal = showPvEModal;
window.closePvEModal = closePvEModal;
window.loadPvEProgress = loadPvEProgress;
window.savePvEProgress = savePvEProgress;
window.startPvELevel = startPvELevel;
window.showPvEResult = showPvEResult;
window.closePvEResult = closePvEResult;

