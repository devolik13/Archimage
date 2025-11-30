// city/building-descriptions.js - Описания зданий и их бонусов
console.log('✅ building-descriptions.js загружен');

/**
 * Конфигурация описаний зданий
 * Каждое здание имеет:
 * - name: Название
 * - emoji: Эмодзи
 * - baseDescription: Базовое описание
 * - getLevelDescription(currentLevel, targetLevel): Функция которая возвращает описание бонусов уровня
 */

const BUILDING_DESCRIPTIONS = {
    library: {
        name: 'Библиотека',
        emoji: '📚',
        baseDescription: 'Позволяет изучать заклинания вашей фракции',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Откроет возможность изучения заклинаний';
            }
            // Каждый уровень ускоряет изучение на 10%
            const bonus = targetLevel * 10;
            return `Ускорение изучения заклинаний на ${bonus}%`;
        }
    },

    wizard_tower: {
        name: 'Башня магов',
        emoji: '🏯',
        baseDescription: 'Позволяет нанимать новых магов в вашу армию',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Откроет возможность найма магов. +10% HP, +2% урона';
            }
            // Каждый уровень дает +10% HP и +2% урона
            const healthBonus = targetLevel * 10;
            const damageBonus = targetLevel * 2;

            // Проверяем, какой маг открывается на этом уровне
            const towerRequirements = { 0: 1, 1: 3, 2: 5, 3: 7, 4: 10 };
            let unlocksWizard = '';
            for (let wizardIndex in towerRequirements) {
                if (towerRequirements[wizardIndex] === targetLevel) {
                    const wizardNumber = parseInt(wizardIndex) + 1;
                    unlocksWizard = ` Откроет найм ${wizardNumber}-го мага.`;
                    break;
                }
            }

            return `+${healthBonus}% HP, +${damageBonus}% урона.${unlocksWizard}`;
        }
    },

    time_generator: {
        name: 'Генератор времени',
        emoji: '⏳',
        baseDescription: 'Производит временную валюту для ускорения строительства',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Базовое производство: 1 мин/минута';
            }
            // Каждый уровень увеличивает производство на 20%
            const bonus = (targetLevel - 1) * 20;
            return `Увеличение производства времени на ${bonus}%`;
        }
    },

    guild: {
        name: 'Гильдия',
        emoji: '🏰',
        baseDescription: 'Объединяйтесь с другими игроками для получения бонусов',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Откроет доступ к гильдиям: создание, вступление, бонусы';
            }
            return `Доступ к функциям гильдии уровня ${targetLevel}`;
        }
    },

    pvp_arena: {
        name: 'Арена',
        emoji: '⚔️',
        baseDescription: 'Позволяет сражаться с другими игроками в PvP',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Откроет возможность PvP сражений';
            }
            // Каждый уровень дает больше наград
            const bonusRewards = targetLevel * 10;
            return `Увеличение наград за PvP на ${bonusRewards}%`;
        }
    },

    blessing_tower: {
        name: 'Башня благословения',
        emoji: '🙏',
        baseDescription: 'Дает временные бонусы вашим магам',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Откроет доступ к благословениям';
            }
            return `Доступ к благословениям ${targetLevel} уровня`;
        }
    },

    arcane_lab: {
        name: 'Арканская лаборатория',
        emoji: '🔬',
        baseDescription: 'Ускоряет изучение заклинаний',
        getLevelDescription(currentLevel, targetLevel) {
            if (targetLevel === 1) {
                return 'Сокращение времени изучения на 2%';
            }
            // Каждый уровень дает -2% времени (максимум -30%)
            const bonus = Math.min(targetLevel * 2, 30);
            return `Сокращение времени изучения на ${bonus}%`;
        }
    }
};

/**
 * Получить полное описание здания для модального окна
 * @param {string} buildingId - ID здания
 * @param {number} currentLevel - Текущий уровень (0 если не построено)
 * @param {number} targetLevel - Целевой уровень
 * @param {boolean} isUpgrade - Это улучшение или новая постройка
 * @returns {Object} Объект с данными для модального окна
 */
function getBuildingModalData(buildingId, currentLevel, targetLevel, isUpgrade) {
    const config = BUILDING_DESCRIPTIONS[buildingId];

    if (!config) {
        console.warn(`⚠️ Описание для здания ${buildingId} не найдено`);
        return {
            name: buildingId,
            emoji: '🏗️',
            description: 'Информация отсутствует',
            levelInfo: '',
            actionText: isUpgrade ? 'Улучшить' : 'Построить'
        };
    }

    return {
        name: config.name,
        emoji: config.emoji,
        description: config.baseDescription,
        levelInfo: config.getLevelDescription(currentLevel, targetLevel),
        actionText: isUpgrade ? 'Улучшить' : 'Построить',
        currentLevel: currentLevel,
        targetLevel: targetLevel,
        isUpgrade: isUpgrade
    };
}

/**
 * Показать модальное окно информации о здании
 * @param {string} buildingId - ID здания
 * @param {number} currentLevel - Текущий уровень
 * @param {number} targetLevel - Целевой уровень
 * @param {boolean} isUpgrade - Это улучшение?
 * @param {number} timeCost - Стоимость в минутах
 * @param {Function} onConfirm - Callback при подтверждении
 */
function showBuildingInfoModal(buildingId, currentLevel, targetLevel, isUpgrade, timeCost, onConfirm) {
    const data = getBuildingModalData(buildingId, currentLevel, targetLevel, isUpgrade);

    const modalContent = `
        <div style="padding: 25px; max-width: 450px; background: #2c2c3d; border-radius: 15px; color: white;">
            <!-- Заголовок -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 50px; margin-bottom: 10px;">${data.emoji}</div>
                <h2 style="margin: 0; color: #7289da; font-size: 24px;">
                    ${data.name}
                </h2>
                ${isUpgrade ? `
                    <div style="color: #aaa; font-size: 14px; margin-top: 5px;">
                        Уровень ${currentLevel} → ${targetLevel}
                    </div>
                ` : ''}
            </div>

            <!-- Описание -->
            <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="font-size: 14px; color: #ccc; line-height: 1.6;">
                    ${data.description}
                </div>
            </div>

            <!-- Бонусы уровня -->
            <div style="background: #3d3d5c; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="
                    font-size: 12px;
                    color: #ffa500;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                ">
                    ${isUpgrade ? 'Новый бонус:' : 'Что даст:'}
                </div>
                <div style="font-size: 16px; color: #4ade80; font-weight: bold;">
                    ${data.levelInfo}
                </div>
            </div>

            <!-- Стоимость -->
            <div style="
                background: rgba(255, 165, 0, 0.1);
                border: 1px solid rgba(255, 165, 0, 0.3);
                padding: 12px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: center;
            ">
                <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                    Время ${isUpgrade ? 'улучшения' : 'строительства'}:
                </div>
                <div style="font-size: 20px; color: #ffa500; font-weight: bold;">
                    ${window.formatTimeCurrency ? window.formatTimeCurrency(timeCost) : timeCost + ' мин'}
                </div>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="window.closeCurrentModal()" style="
                    flex: 1;
                    padding: 12px;
                    border: 1px solid #7289da;
                    border-radius: 8px;
                    background: transparent;
                    color: #7289da;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ✗ Отмена
                </button>
                <button onclick="window.confirmBuildingAction()" style="
                    flex: 2;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ✓ ${data.actionText}
                </button>
            </div>
        </div>
    `;

    // Сохраняем callback для подтверждения
    window.confirmBuildingAction = () => {
        window.closeCurrentModal();
        if (onConfirm) {
            onConfirm();
        }
    };

    if (typeof window.showModal === 'function') {
        window.showModal(modalContent);
    } else {
        console.error('❌ Функция showModal не найдена');
    }
}

// Экспорт
window.BUILDING_DESCRIPTIONS = BUILDING_DESCRIPTIONS;
window.getBuildingModalData = getBuildingModalData;
window.showBuildingInfoModal = showBuildingInfoModal;

console.log('✅ Описания зданий загружены');
