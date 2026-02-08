// daily-login-rewards.js - Система ежедневных наград

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
            last_reward_date: null,    // Последняя дата получения награды (ISO string)
            total_logins: 0            // Общее количество входов
        };
        console.log('🎁 Инициализированы данные ежедневных наград');
    }
    // Добавляем поле last_reward_date для старых пользователей
    if (!userData.daily_login.last_reward_date) {
        userData.daily_login.last_reward_date = userData.daily_login.last_login_date;
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

// Вычисление разницы в днях между датами
function getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Сбрасываем время для точного подсчета дней
    const dateOnly1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const dateOnly2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

    const diffMs = dateOnly2.getTime() - dateOnly1.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
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
    const now = new Date().toISOString();

    // Проверяем, получали ли уже награду сегодня
    if (!isNewDay(dailyData.last_reward_date)) {
        console.log(`🎁 Награда уже получена сегодня (день ${dailyData.day})`);
        return;
    }

    // Это новый день для получения награды
    console.log(`🎁 Новый день! Выдаём награду за день ${dailyData.day}`);

    // Проверяем, был ли пропуск дней (сброс стрика)
    if (dailyData.last_login_date && isNewDay(dailyData.last_login_date)) {
        const daysSinceLastLogin = getDaysDifference(dailyData.last_login_date, now);
        if (daysSinceLastLogin > 1) {
            // Пропустили день(и) - сбрасываем стрик
            console.log(`⚠️ Пропущено дней: ${daysSinceLastLogin - 1}. Стрик сброшен.`);
            dailyData.day = 1;
        } else {
            // Следующий день подряд - увеличиваем
            dailyData.day += 1;
        }
    }

    // Обновляем даты
    dailyData.last_login_date = now;
    dailyData.last_reward_date = now;

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

    // Начисляем airdrop очки за ежедневный вход
    if (typeof window.addAirdropPoints === 'function') {
        // Каждые 7 дней - streak бонус ВМЕСТО обычного
        // Формула: 25 × номер_недели (макс 13 недель = 91 день)
        // После 91 дня: фиксированно 325 BPM
        if (dailyData.day % 7 === 0) {
            const weekNumber = Math.min(Math.floor(dailyData.day / 7), 13);
            const streakBonus = 25 * weekNumber; // Макс 325 BPM
            await window.addAirdropPoints(streakBonus, 'Бонус за серию входов');
        } else {
            // Обычные дни - 20 BPM
            await window.addAirdropPoints(20, 'Ежедневный вход');
        }
    }

    // Сохраняем ВСЕ данные НЕМЕДЛЕННО (награда + daily_login метаданные)
    // Критично: сохраняем и время, и BPM, и daily_login в одном вызове
    try {
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            await window.dbManager.savePlayer(window.userData);
            console.log('✅ Ежедневная награда сохранена в БД');
        }
    } catch (err) {
        console.error('❌ Ошибка сохранения ежедневной награды:', err);
    }

    // Показываем модальное окно с наградой
    showDailyRewardModal(dailyData.day, hoursReward);
}

// Показ модального окна с наградой (с красивым фоном)
function showDailyRewardModal(day, hours) {
    // Удаляем старую модалку если есть
    const oldModal = document.getElementById('daily-reward-screen');
    if (oldModal) oldModal.remove();

    // Определяем сообщение
    let dayMessage = '';
    if (day <= DAILY_REWARD_CONFIG.MAX_DAY) {
        dayMessage = `День ${day}`;
    } else {
        dayMessage = `День ${day} (макс. награда)`;
    }

    // Фон по фракции игрока
    const faction = window.userData?.faction || 'fire';
    const backgroundPath = `assets/ui/window/tower_${faction}.webp`;

    // Создаём экран
    const screen = document.createElement('div');
    screen.id = 'daily-reward-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    screen.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        </style>
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div id="daily-reward-wrapper" style="position: relative; display: inline-block;">
                <img id="daily-reward-bg" src="${backgroundPath}" alt="Фон" style="
                    max-width: 100vw;
                    max-height: 100vh;
                    object-fit: contain;
                    display: block;
                ">
                <div id="daily-reward-overlay" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                    box-sizing: border-box;
                "></div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);

    // Ждём загрузку изображения для масштабирования
    const img = document.getElementById('daily-reward-bg');
    const setupUI = () => {
        const overlay = document.getElementById('daily-reward-overlay');
        if (!overlay || !img) return;

        const rect = img.getBoundingClientRect();
        const scaleX = rect.width / 768;
        const scaleY = rect.height / 512;
        const scale = Math.min(scaleX, scaleY);

        const titleSize = Math.max(18, 28 * scale);
        const subtitleSize = Math.max(14, 20 * scale);
        const textSize = Math.max(12, 16 * scale);
        const valueSize = Math.max(24, 36 * scale);
        const btnSize = Math.max(14, 18 * scale);
        const iconSize = Math.max(40, 60 * scale);

        // Overlay уже позиционирован поверх изображения через CSS
        // Просто добавляем анимацию
        overlay.style.animation = 'slideUp 0.5s ease';

        const hoursText = hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов';
        const tomorrowHours = day + 1;
        const tomorrowText = tomorrowHours === 1 ? 'час' : tomorrowHours < 5 ? 'часа' : 'часов';

        overlay.innerHTML = `
            <div style="font-size: ${iconSize}px; margin-bottom: ${10 * scale}px; animation: bounce 1s infinite;">🎁</div>
            <div style="font-size: ${titleSize}px; font-weight: bold; color: #ffd700; margin-bottom: ${5 * scale}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                Ежедневная награда!
            </div>
            <div style="font-size: ${subtitleSize}px; color: #fff; margin-bottom: ${15 * scale}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                ${dayMessage}
            </div>
            <div style="
                background: rgba(0,0,0,0.4);
                border: 2px solid rgba(255,165,0,0.6);
                border-radius: ${12 * scale}px;
                padding: ${15 * scale}px ${25 * scale}px;
                margin-bottom: ${15 * scale}px;
            ">
                <div style="font-size: ${iconSize * 0.8}px; margin-bottom: ${8 * scale}px;">⏰</div>
                <div style="font-size: ${valueSize}px; font-weight: bold; color: #ffa500; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    +${hours} ${hoursText}
                </div>
            </div>
            <div style="font-size: ${textSize}px; color: #aaa; margin-bottom: ${15 * scale}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                ${day < DAILY_REWARD_CONFIG.MAX_DAY
                    ? `Завтра получите ${tomorrowHours} ${tomorrowText}!`
                    : 'Максимальная награда достигнута!'}
            </div>
            <button onclick="document.getElementById('daily-reward-screen').remove()" style="
                background: linear-gradient(145deg, #667eea, #764ba2);
                border: none;
                padding: ${12 * scale}px ${35 * scale}px;
                border-radius: ${25 * scale}px;
                color: white;
                font-size: ${btnSize}px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
                box-shadow: 0 4px 15px rgba(102,126,234,0.4);
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Отлично! 🎉
            </button>
        `;
    };

    img.onload = setupUI;
    if (img.complete) setupUI();

}

// Экспорт функций
window.initDailyLoginData = initDailyLoginData;
window.checkDailyLoginReward = checkDailyLoginReward;
window.showDailyRewardModal = showDailyRewardModal;

