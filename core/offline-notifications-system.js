// offline-notifications-system.js - Система уведомлений о завершенных событиях во время оффлайна
console.log('✅ offline-notifications-system.js загружен');

/**
 * Проверяет события которые завершились пока игрок был оффлайн
 * @param {string} oldLastLogin - ISO строка времени последнего входа
 * @returns {Promise<void>}
 */
async function checkOfflineEvents(oldLastLogin) {
    if (!oldLastLogin || !window.userData) {
        console.log('⏭️ Пропуск проверки оффлайн событий - нет данных о последнем входе');
        return;
    }

    const currentTime = Date.now();
    const lastLoginTime = new Date(oldLastLogin).getTime();
    const offlineTime = currentTime - lastLoginTime;

    // Если игрок был оффлайн меньше 1 минуты - не показываем уведомление
    if (offlineTime < 60000) {
        console.log('⏭️ Игрок был оффлайн меньше минуты - пропуск');
        return;
    }

    console.log(`📊 Игрок был оффлайн: ${formatOfflineTime(offlineTime)}`);

    // Собираем завершенные события
    const completedEvents = {
        offlineTime: offlineTime,
        buildings: [],
        spells: [],
        wizards: [],
        pvp: null
    };

    // 1. Проверяем завершенные конструкции
    if (window.userData.constructions && window.userData.constructions.length > 0) {
        const completed = collectCompletedConstructions(
            window.userData.constructions,
            lastLoginTime,
            currentTime
        );
        completedEvents.buildings = completed.buildings;
        completedEvents.spells = completed.spells;
        completedEvents.wizards = completed.wizards;
    }

    // 2. Получаем статистику PvP (пока заглушка)
    completedEvents.pvp = await getPvPStatistics(lastLoginTime);

    // 3. Проверяем есть ли что показать
    const hasEvents =
        completedEvents.buildings.length > 0 ||
        completedEvents.spells.length > 0 ||
        completedEvents.wizards.length > 0 ||
        (completedEvents.pvp && (completedEvents.pvp.wins > 0 || completedEvents.pvp.losses > 0));

    if (hasEvents) {
        console.log('📬 Найдены оффлайн события:', completedEvents);
        showOfflineNotificationModal(completedEvents);
    } else {
        console.log('📭 Нет завершенных событий во время оффлайна');
    }
}

/**
 * Собирает завершенные конструкции
 * @param {Array} constructions - массив активных конструкций
 * @param {number} offlineStart - время начала оффлайна (timestamp)
 * @param {number} offlineEnd - время окончания оффлайна (timestamp)
 * @returns {Object} объект с завершенными зданиями, заклинаниями и магами
 */
function collectCompletedConstructions(constructions, offlineStart, offlineEnd) {
    const completed = {
        buildings: [],
        spells: [],
        wizards: []
    };

    constructions.forEach(construction => {
        // Время завершения = started_at + time_required (в миллисекундах)
        const completionTime = construction.started_at + (construction.time_required * 60000);

        // Проверяем завершилось ли во время оффлайна
        if (completionTime >= offlineStart && completionTime <= offlineEnd) {
            if (construction.type === 'building') {
                const buildingName = window.getBuildingName
                    ? window.getBuildingName(construction.building_id)
                    : construction.building_id;

                completed.buildings.push({
                    name: buildingName,
                    level: construction.target_level,
                    isUpgrade: construction.is_upgrade
                });
            } else if (construction.type === 'spell') {
                const spellName = window.getSpellNameById
                    ? window.getSpellNameById(construction.spell_id)
                    : construction.spell_id;

                completed.spells.push({
                    name: spellName,
                    level: construction.target_level,
                    faction: construction.faction
                });
            } else if (construction.type === 'wizard') {
                completed.wizards.push({
                    index: construction.wizard_index
                });
            }
        }
    });

    return completed;
}

/**
 * Получает статистику PvP боев во время оффлайна
 * @param {number} offlineStart - время начала оффлайна (timestamp)
 * @returns {Promise<Object|null>} статистика PvP или null
 */
async function getPvPStatistics(offlineStart) {
    // TODO: Реализовать запрос к базе данных для получения боев за период
    // Пока возвращаем null (нет данных о PvP во время оффлайна)

    // Будущая реализация:
    // 1. Запрос к БД: SELECT * FROM battles WHERE defender_id = ? AND created_at > ?
    // 2. Подсчет побед/поражений
    // 3. Расчет изменения рейтинга

    console.log('⚔️ PvP статистика пока не реализована (TODO)');
    return null;
}

/**
 * Показывает модальное окно с оффлайн уведомлениями
 * @param {Object} events - объект с завершенными событиями
 */
function showOfflineNotificationModal(events) {
    const { offlineTime, buildings, spells, wizards, pvp } = events;

    let content = `
        <div style="padding: 20px; max-width: 500px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h2 style="margin-top: 0; color: #7289da; text-align: center;">
                🌙 Пока вас не было...
            </h2>

            <div style="background: #3d3d5c; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center;">
                <div style="font-size: 14px; color: #aaa;">Вы были оффлайн:</div>
                <div style="font-size: 18px; color: #ffa500; font-weight: bold; margin-top: 5px;">
                    ${formatOfflineTime(offlineTime)}
                </div>
            </div>
    `;

    // Завершенные здания
    if (buildings.length > 0) {
        content += `
            <div style="background: #3d3d5c; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #4ade80; margin-bottom: 8px;">
                    🏗️ Завершено строительство:
                </div>
        `;
        buildings.forEach(building => {
            const action = building.isUpgrade ? 'Улучшено до' : 'Построено';
            content += `
                <div style="padding: 6px 0; border-bottom: 1px solid #2c2c3d;">
                    ${building.name}${building.level ? ` - ${action} уровня ${building.level}` : ''}
                </div>
            `;
        });
        content += `</div>`;
    }

    // Завершенные заклинания
    if (spells.length > 0) {
        content += `
            <div style="background: #3d3d5c; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #a78bfa; margin-bottom: 8px;">
                    📖 Изучено заклинаний:
                </div>
        `;
        spells.forEach(spell => {
            content += `
                <div style="padding: 6px 0; border-bottom: 1px solid #2c2c3d;">
                    ${spell.name} - Уровень ${spell.level}
                </div>
            `;
        });
        content += `</div>`;
    }

    // Нанятые маги
    if (wizards.length > 0) {
        content += `
            <div style="background: #3d3d5c; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #60a5fa; margin-bottom: 8px;">
                    🧙 Нанято магов:
                </div>
        `;
        wizards.forEach(wizard => {
            content += `
                <div style="padding: 6px 0; border-bottom: 1px solid #2c2c3d;">
                    Маг ${wizard.index}
                </div>
            `;
        });
        content += `</div>`;
    }

    // PvP статистика
    if (pvp && (pvp.wins > 0 || pvp.losses > 0)) {
        const ratingChange = pvp.ratingChange || 0;
        const ratingSign = ratingChange >= 0 ? '+' : '';
        const ratingColor = ratingChange >= 0 ? '#4ade80' : '#ff5252';

        content += `
            <div style="background: #3d3d5c; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">
                    ⚔️ Статистика PvP:
                </div>
                <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 10px;">
                    <div>
                        <div style="font-size: 24px; color: #4ade80;">✓ ${pvp.wins}</div>
                        <div style="font-size: 12px; color: #aaa;">Побед</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; color: #ff5252;">✗ ${pvp.losses}</div>
                        <div style="font-size: 12px; color: #aaa;">Поражений</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; color: ${ratingColor};">${ratingSign}${ratingChange}</div>
                        <div style="font-size: 12px; color: #aaa;">Рейтинг</div>
                    </div>
                </div>
            </div>
        `;
    }

    content += `
            <button onclick="closeOfflineNotificationModal()" style="
                width: 100%;
                margin-top: 15px;
                padding: 12px;
                border: none;
                border-radius: 6px;
                background: linear-gradient(90deg, #7289da 0%, #5b6eae 100%);
                color: white;
                cursor: pointer;
                font-weight: bold;
                font-size: 16px;
            ">
                Продолжить игру
            </button>
        </div>
    `;

    // Показываем модальное окно
    if (typeof window.showModal === 'function') {
        window.showModal(content);
    } else {
        console.error('❌ Функция showModal не найдена');
        // Fallback - используем alert
        alert('Пока вас не было, завершились события!');
    }
}

/**
 * Закрывает модальное окно оффлайн уведомлений
 */
function closeOfflineNotificationModal() {
    if (window.Modal && window.Modal.close) {
        window.Modal.close();
    } else if (typeof window.closeCurrentModal === 'function') {
        window.closeCurrentModal();
    }
}

/**
 * Форматирует время оффлайна в читаемый формат
 * @param {number} ms - миллисекунды
 * @returns {string} отформатированная строка
 */
function formatOfflineTime(ms) {
    const totalMinutes = Math.floor(ms / 60000);

    if (totalMinutes < 60) {
        return `${totalMinutes} мин`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours < 24) {
        return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days < 7) {
        return remainingHours > 0 ? `${days} д ${remainingHours} ч` : `${days} д`;
    }

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    return remainingDays > 0 ? `${weeks} нед ${remainingDays} д` : `${weeks} нед`;
}

// Экспорт функций
window.checkOfflineEvents = checkOfflineEvents;
window.closeOfflineNotificationModal = closeOfflineNotificationModal;

console.log('✅ Система оффлайн уведомлений готова');
