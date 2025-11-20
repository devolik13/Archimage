// wizards/adventure/pve-ui.js
console.log('✅ pve-ui.js загружен');

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
                background: #555;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            " onmouseover="this.style.background='#666'" onmouseout="this.style.background='#555'">
                Закрыть
            </button>
        </div>
    `;

    showPvEModal(chaptersHTML);
}

/**
 * Показывает уровни Главы 1
 */
function showChapter1Levels() {
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
                                    ${level.reward ? ` • Награда: ⏰ +${level.reward} ${level.reward === 1 ? 'день' : (level.reward < 5 ? 'дня' : 'дней')}` : ''}
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
                background: #555;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='#666'" onmouseout="this.style.background='#555'">
                Закрыть
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
 * Загружает прогресс PvE из localStorage
 */
function loadPvEProgress() {
    const saved = localStorage.getItem('pveProgress');
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        chapter1: {
            maxLevel: 1, // максимальный доступный уровень
            completed: {} // объект с пройденными уровнями {1: true, 2: true, ...}
        }
    };
}

/**
 * Сохраняет прогресс PvE в localStorage
 */
function savePvEProgress(progress) {
    localStorage.setItem('pveProgress', JSON.stringify(progress));
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

    console.log('🎮 Формация игрока загружена для PvE (КОПИЯ):');
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

            window.enemyFormation[index] = enemyWizard;
            window.enemyWizards.push(enemyWizard);
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

// Экспорт функций
window.showPvEChaptersMenu = showPvEChaptersMenu;
window.showChapter1Levels = showChapter1Levels;
window.showPvEModal = showPvEModal;
window.closePvEModal = closePvEModal;
window.loadPvEProgress = loadPvEProgress;
window.savePvEProgress = savePvEProgress;
window.startPvELevel = startPvELevel;

console.log('✅ PvE UI система готова');
