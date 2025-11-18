// battle/battle-energy-system.js - Система энергии боев (лимит 12 боев в сутки)
console.log('✅ battle-energy-system.js загружен');

// Инициализация энергии боев для нового игрока
function initBattleEnergy(userData) {
    if (!userData.battle_energy) {
        userData.battle_energy = {
            current: window.BATTLE_ENERGY.MAX,
            max: window.BATTLE_ENERGY.MAX,
            last_regen: Date.now()
        };
    }
    return userData.battle_energy;
}

// Регенерация энергии на основе прошедшего времени
function regenerateBattleEnergy() {
    if (!window.userData || !window.userData.battle_energy) {
        return;
    }

    const energy = window.userData.battle_energy;
    const now = Date.now();
    const timePassed = now - energy.last_regen;

    // Сколько энергии восстановилось
    const regenAmount = Math.floor(timePassed / window.BATTLE_ENERGY.REGEN_TIME_MS);

    if (regenAmount > 0 && energy.current < energy.max) {
        const oldEnergy = energy.current;
        energy.current = Math.min(energy.current + regenAmount, energy.max);
        energy.last_regen = now - (timePassed % window.BATTLE_ENERGY.REGEN_TIME_MS);

        console.log(`⚡ Энергия восстановлена: ${oldEnergy} → ${energy.current}`);

        // Сохраняем изменения
        if (window.eventSaveManager) {
            window.eventSaveManager.saveDebounced('battle_energy_regen', 2000);
        }

        // Обновляем UI
        updateBattleEnergyUI();
    }
}

// Проверка наличия энергии
function hasBattleEnergy() {
    if (!window.userData || !window.userData.battle_energy) {
        initBattleEnergy(window.userData);
    }

    regenerateBattleEnergy();
    return window.userData.battle_energy.current > 0;
}

// Получить текущее количество энергии
function getCurrentBattleEnergy() {
    if (!window.userData || !window.userData.battle_energy) {
        initBattleEnergy(window.userData);
    }

    regenerateBattleEnergy();
    return window.userData.battle_energy.current;
}

// Потратить энергию на бой
function consumeBattleEnergy() {
    if (!window.userData || !window.userData.battle_energy) {
        initBattleEnergy(window.userData);
    }

    regenerateBattleEnergy();

    if (window.userData.battle_energy.current <= 0) {
        console.error('❌ Нет энергии для боя!');
        return false;
    }

    window.userData.battle_energy.current--;
    console.log(`⚡ Энергия потрачена: осталось ${window.userData.battle_energy.current}/${window.userData.battle_energy.max}`);

    // Сохраняем изменения
    if (window.eventSaveManager) {
        window.eventSaveManager.saveDebounced('battle_energy_consumed', 1000);
    }

    updateBattleEnergyUI();
    return true;
}

// Время до следующей регенерации (в миллисекундах)
function getTimeToNextRegen() {
    if (!window.userData || !window.userData.battle_energy) {
        return 0;
    }

    const energy = window.userData.battle_energy;
    if (energy.current >= energy.max) {
        return 0; // Энергия полная
    }

    const now = Date.now();
    const timeSinceLastRegen = now - energy.last_regen;
    const timeToNext = window.BATTLE_ENERGY.REGEN_TIME_MS - timeSinceLastRegen;

    return Math.max(0, timeToNext);
}

// Форматирование времени до регенерации
function formatTimeToRegen(ms) {
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
}

// Обновление UI
function updateBattleEnergyUI() {
    const energyDisplay = document.getElementById('battle-energy-display');
    if (!energyDisplay) return;

    regenerateBattleEnergy();

    const current = getCurrentBattleEnergy();
    const max = window.BATTLE_ENERGY.MAX;
    const timeToNext = getTimeToNextRegen();

    let html = `⚡ Попытки боев: ${current}/${max}`;

    if (current < max && timeToNext > 0) {
        html += ` (след. через ${formatTimeToRegen(timeToNext)})`;
    }

    energyDisplay.innerHTML = html;
    energyDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
}

// Инициализация UI
function initBattleEnergyUI() {
    // Удаляем старый элемент если есть
    const old = document.getElementById('battle-energy-display');
    if (old) old.remove();

    // Создаем новый
    const display = document.createElement('div');
    display.id = 'battle-energy-display';
    document.body.appendChild(display);

    updateBattleEnergyUI();

    // Обновляем каждые 10 секунд
    setInterval(updateBattleEnergyUI, 10000);
}

// Проверка перед началом боя
function checkBattleEnergyBeforeFight() {
    regenerateBattleEnergy();

    if (!hasBattleEnergy()) {
        const timeToNext = getTimeToNextRegen();
        alert(`⚡ Недостаточно энергии для боя!\n\nВы можете провести максимум ${window.BATTLE_ENERGY.MAX} боев в сутки.\nСледующая попытка восстановится через ${formatTimeToRegen(timeToNext)}.`);
        return false;
    }

    return true;
}

// Экспорт
window.initBattleEnergy = initBattleEnergy;
window.regenerateBattleEnergy = regenerateBattleEnergy;
window.hasBattleEnergy = hasBattleEnergy;
window.getCurrentBattleEnergy = getCurrentBattleEnergy;
window.consumeBattleEnergy = consumeBattleEnergy;
window.getTimeToNextRegen = getTimeToNextRegen;
window.updateBattleEnergyUI = updateBattleEnergyUI;
window.initBattleEnergyUI = initBattleEnergyUI;
window.checkBattleEnergyBeforeFight = checkBattleEnergyBeforeFight;

console.log('⚡ Система энергии боев готова');
