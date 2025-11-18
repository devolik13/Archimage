// daily-login-rewards.js - Система ежедневных наград
console.log('✅ daily-login-rewards.js загружен');

// Конфигурация наград
const DAILY_REWARD_CONFIG = {
    MAX_DAY: 24,              // Максимальный день (после 24-го всегда 24 часа)
    HOURS_PER_DAY: 1,         // Множитель: день N = N часов
    MAX_HOURS: 24             // Максимум 24 часа за вход
};

// Инициализация данных ежедневных наград
function initDailyLoginData(userData) {
    if (!userData.daily_login) {
        userData.daily_login = {
            day: 1,                    // Текущий день награды (1-24+)
            last_login_date: null,     // Последняя дата входа (ISO string)
            total_logins: 0            // Общее количество входов
        };
        console.log('🎁 Инициализированы данные ежедневных наград');
    }
}

// Проверка нового дня
function isNewDay(lastLoginDate) {
    if (!lastLoginDate) return true;

    const last = new Date(lastLoginDate);
    const now = new Date();

    // Сравниваем только даты (без времени)
    const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return nowDate.getTime() > lastDate.getTime();
}

// Получение награды текущего дня
function getCurrentDayReward(day) {
    // День 1-24: 1-24 часа
    // День 24+: всегда 24 часа
    const hours = Math.min(day, DAILY_REWARD_CONFIG.MAX_DAY) * DAILY_REWARD_CONFIG.HOURS_PER_DAY;
    return hours;
}

// Проверка и выдача ежедневной награды
async function checkDailyLoginReward() {
    if (!window.userData) {
        console.warn('⚠️ userData не загружена');
        return;
    }

    // Инициализируем если нет
    initDailyLoginData(window.userData);

    const dailyData = window.userData.daily_login;

    // Проверяем новый день
    if (isNewDay(dailyData.last_login_date)) {
        // Увеличиваем день награды
        dailyData.day += 1;

        // Обновляем дату последнего входа
        dailyData.last_login_date = new Date().toISOString();

        // Увеличиваем счетчик входов
        dailyData.total_logins += 1;

        // Вычисляем награду
        const hoursReward = getCurrentDayReward(dailyData.day);

        console.log(`🎁 День ${dailyData.day}: награда ${hoursReward} часов`);

        // Добавляем время
        if (typeof window.addTimeCurrency === 'function') {
            const minutesReward = hoursReward * 60;
            window.addTimeCurrency(minutesReward);
        }

        // Сохраняем
        if (typeof window.eventSaveManager?.saveDebounced === 'function') {
            window.eventSaveManager.saveDebounced('daily_login');
        }

        // Показываем модальное окно с наградой
        showDailyRewardModal(dailyData.day, hoursReward);
    } else {
        console.log(`🎁 Награда уже получена сегодня (день ${dailyData.day})`);
    }
}

// Показ модального окна с наградой
function showDailyRewardModal(day, hours) {
    // Удаляем старую модалку если есть
    const oldModal = document.getElementById('daily-reward-modal');
    if (oldModal) oldModal.remove();

    // Определяем сообщение
    let dayMessage = '';
    if (day <= DAILY_REWARD_CONFIG.MAX_DAY) {
        dayMessage = `День ${day}`;
    } else {
        dayMessage = `День ${day} (макс. награда)`;
    }

    const modalHTML = `
        <div id="daily-reward-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        ">
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 3px solid #ffa500;
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(255, 165, 0, 0.3);
                animation: slideIn 0.5s;
            ">
                <div style="font-size: 60px; margin-bottom: 20px; animation: bounce 1s infinite;">
                    🎁
                </div>
                <h2 style="color: #ffa500; margin-bottom: 10px; font-size: 28px;">
                    Ежедневная награда!
                </h2>
                <div style="color: #fff; font-size: 18px; margin-bottom: 20px;">
                    ${dayMessage}
                </div>
                <div style="
                    background: rgba(255, 165, 0, 0.2);
                    border: 2px solid #ffa500;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                ">
                    <div style="font-size: 48px; margin-bottom: 10px;">
                        ⏰
                    </div>
                    <div style="color: #ffa500; font-size: 32px; font-weight: bold;">
                        +${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}
                    </div>
                </div>
                <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">
                    ${day < DAILY_REWARD_CONFIG.MAX_DAY
                        ? `Завтра получите ${day + 1} ${day + 1 === 1 ? 'час' : day + 1 < 5 ? 'часа' : 'часов'}!`
                        : 'Максимальная награда достигнута!'}
                </div>
                <button onclick="document.getElementById('daily-reward-modal').remove();" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'"
                   onmouseout="this.style.transform='scale(1)'">
                    Отлично! 🎉
                </button>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Автозакрытие через 5 секунд
    setTimeout(() => {
        const modal = document.getElementById('daily-reward-modal');
        if (modal) modal.remove();
    }, 5000);
}

// Экспорт функций
window.initDailyLoginData = initDailyLoginData;
window.checkDailyLoginReward = checkDailyLoginReward;
window.showDailyRewardModal = showDailyRewardModal;

console.log('✅ Система ежедневных наград готова');
