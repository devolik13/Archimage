// battle/battle-energy-system.js - Система энергии боев (лимит 24 боя в сутки)

// Инициализация энергии боев для нового игрока
function initBattleEnergy(userData) {
    if (!userData.battle_energy) {
        userData.battle_energy = {
            current: window.BATTLE_ENERGY.MAX,
            max: window.BATTLE_ENERGY.MAX,
            last_regen: Date.now()
        };
    }

    // localStorage-бэкап: защита от потери данных при сбое сохранения в БД
    try {
        const saved = localStorage.getItem('battle_energy_backup');
        if (saved) {
            const backup = JSON.parse(saved);
            // Если сервер сбросил энергию (reset_gen изменился) — очищаем бэкап
            const serverGen = userData.battle_energy.reset_gen || 0;
            const backupGen = backup.reset_gen || 0;
            if (serverGen > backupGen) {
                localStorage.removeItem('battle_energy_backup');
                console.log(`⚡ Серверный сброс энергии (gen ${backupGen} → ${serverGen}), бэкап очищен`);
            } else if (typeof backup.current === 'number' && backup.current < userData.battle_energy.current) {
                // Используем бэкап если у него МЕНЬШЕ энергии (предотвращаем эксплойт)
                const now = Date.now();
                const timePassed = now - (backup.last_regen || now);
                const regenAmount = Math.floor(timePassed / window.BATTLE_ENERGY.REGEN_TIME_MS);
                const restoredCurrent = Math.min(backup.current + regenAmount, window.BATTLE_ENERGY.MAX);

                if (restoredCurrent < userData.battle_energy.current) {
                    console.log(`⚡ Восстановление из бэкапа: БД=${userData.battle_energy.current}, бэкап+реген=${restoredCurrent}`);
                    userData.battle_energy.current = restoredCurrent;
                    userData.battle_energy.last_regen = backup.last_regen || now;
                }
            }
        }
    } catch (e) { /* localStorage может быть недоступен */ }

    // Синхронизируем max с константой (для существующих игроков после изменения лимита)
    if (userData.battle_energy.max !== window.BATTLE_ENERGY.MAX) {
        const oldMax = userData.battle_energy.max;
        userData.battle_energy.max = window.BATTLE_ENERGY.MAX;
        // Если попытки были полные — обновляем current тоже
        if (userData.battle_energy.current === oldMax) {
            userData.battle_energy.current = window.BATTLE_ENERGY.MAX;
        }
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

    // localStorage-бэкап (мгновенно, не зависит от сети)
    _saveBattleEnergyBackup();

    // Сохраняем изменения НЕМЕДЛЕННО (критично для предотвращения эксплойтов)
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('battle_energy_consumed');
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

    let html = `⚡ Попытки: ${current}/${max}`;

    if (current < max && timeToNext > 0) {
        html += ` (${formatTimeToRegen(timeToNext)})`;
    }

    // Вычисляем положение правого края города
    const cityView = document.getElementById('city-view');
    const backgroundImg = cityView?.querySelector('.city-background-img');

    let rightPosition = '10px'; // Дефолт

    if (backgroundImg) {
        const imgRect = backgroundImg.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const cityRight = imgRect.right;
        rightPosition = `${screenWidth - cityRight + 10}px`;
        console.log(`📍 Энергия привязана к городу: right = ${rightPosition}`);
    }

    energyDisplay.innerHTML = html;
    energyDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        right: ${rightPosition};
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
}

// Инициализация UI
function initBattleEnergyUI() {
    // UI больше не отображается отдельно - энергия показывается в модальном окне арены
    console.log('⚡ Энергия боев отображается в модальном окне арены');

    // Удаляем старый элемент если остался
    const old = document.getElementById('battle-energy-display');
    if (old) old.remove();
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

// Восстановить все попытки (для тестирования/отладки)
function restoreBattleEnergy() {
    if (!window.userData) {
        console.warn('❌ userData не найден');
        return false;
    }

    if (!window.userData.battle_energy) {
        initBattleEnergy(window.userData);
    }

    window.userData.battle_energy.current = window.BATTLE_ENERGY.MAX;
    window.userData.battle_energy.last_regen = Date.now();

    console.log(`⚡ Попытки восстановлены: ${window.userData.battle_energy.current}/${window.userData.battle_energy.max}`);

    // Сохраняем изменения
    if (window.eventSaveManager) {
        window.eventSaveManager.saveImmediate('battle_energy_restored');
    }

    updateBattleEnergyUI();
    return true;
}

// localStorage-бэкап энергии (защита от сбоя сохранения в БД)
function _saveBattleEnergyBackup() {
    try {
        const energy = window.userData?.battle_energy;
        if (energy) {
            localStorage.setItem('battle_energy_backup', JSON.stringify({
                current: energy.current,
                max: energy.max,
                last_regen: energy.last_regen,
                reset_gen: energy.reset_gen || 0
            }));
        }
    } catch (e) { /* ignore */ }
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
window.restoreBattleEnergy = restoreBattleEnergy;

console.log('⚡ Система энергии боев готова');
