// battle/weather.js - Система погоды (адаптированная)

// Инициализация глобальной переменной погоды
window.currentWeather = null;

function initializeWeatherForBattle() {
    const weathers = ['drought', 'ice_fog', 'sandstorm', 'storm'];
    window.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
    if (typeof window.addToBattleLog === 'function') {
        const weatherNames = {
            'drought': 'Засуха (+15% огню)',
            'ice_fog': 'Ледяной туман (+15% воде)',
            'sandstorm': 'Песчаная буря (+15% земле)',
            'storm': 'Шторм (+15% ветру)'
        };
        window.addToBattleLog(`🌤️ Установлена погода: ${weatherNames[window.currentWeather]}`);
    }
}

function resetWeather() {
    window.currentWeather = null;
}

function applyWeatherBonus(spellFaction, baseDamage) {
    if (!window.currentWeather || window.currentWeather === 'clear') {
        return baseDamage; // При ясной погоде никто не получает бонусов
    }

    // Проверка на Метеокинез — отключаем погоду для врага на 4/5 уровне
    if (spellFaction !== 'nature' && window.activeMeteorokinesis) {
        const enemyEffect = window.activeMeteorokinesis.find(m =>
            m.isActive &&
            m.disableEnemyWeather &&
            (
                (m.casterType === 'player' && spellFaction !== 'nature') ||
                (m.casterType === 'enemy' && spellFaction !== 'nature')
            )
        );
        if (enemyEffect) {
            return baseDamage; // игнорируем погоду для врага
        }
    }

    const weatherToFaction = {
        'drought': 'fire',
        'ice_fog': 'water',
        'sandstorm': 'earth',
        'storm': 'wind'
    };

    if (weatherToFaction[window.currentWeather] === spellFaction) {
        const boostedDamage = Math.round(baseDamage * 1.15);
        console.log(`🌤️ Погода ${window.currentWeather}: +15% урона для ${spellFaction} (${baseDamage} → ${boostedDamage})`);
        return boostedDamage;
    }

    return baseDamage;
}

function getAllBonusesHTML() {
    if (!window.currentWeather) return '';
    const weatherNames = {
        'drought': '☀️ Засуха: +15% к огню',
        'ice_fog': '❄️ Ледяной туман: +15% к воде',
        'sandstorm': '🏜️ Песчаная буря: +15% к земле',
        'storm': '🌪️ Шторм: +15% к ветру'
    };
    return `<div style="background: #444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${weatherNames[window.currentWeather]}</div>`;
}

// Экспорт функций (window.currentWeather уже инициализирован в начале файла)
window.initializeWeatherForBattle = initializeWeatherForBattle;
window.resetWeather = resetWeather;
window.applyWeatherBonus = applyWeatherBonus;
window.getAllBonusesHTML = getAllBonusesHTML;