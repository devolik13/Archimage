// script_spells_standard.js - Стандартные заклинания
console.log('✅ script_spells_standard.js загружен');

// --- Изучить заклинание ---
async function learnSpell(spellId, faction) {
    // Получаем информацию о заклинании
    const currentSpell = window.userData.spells?.[faction]?.[spellId];
    const currentLevel = currentSpell?.level || 0;
    
    // Определяем tier заклинания
    const spellTiers = window.SPELL_TIERS?.[faction] || [];
    const tierIndex = spellTiers.indexOf(spellId);
    const tier = tierIndex >= 0 ? tierIndex + 1 : 1;
    
    // Проверяем, не изучается ли уже заклинание
    if (window.hasActiveConstruction && window.hasActiveConstruction('spell')) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Уже изучается другое заклинание!');
        } else {
            alert('⚠️ Уже изучается другое заклинание!');
        }
        return;
    }
    
    // Запускаем изучение через систему времени
    if (typeof window.startSpellLearning === 'function') {
        const success = await window.startSpellLearning(spellId, faction, tier, currentLevel);
        if (success) {
            if (typeof window.showNotification === 'function') {
                window.showNotification(`📖 Начато изучение заклинания "${window.getSpellNameById(spellId)}"`);
            }
            // Обновляем UI библиотеки
            if (typeof window.renderLibrary === 'function') {
                window.updateLibraryContent ? window.updateLibraryContent() : window.renderLibrary();
            }
        }
        return;
    }
    
    // Старый код мгновенного изучения (оставляем для обратной совместимости)
    try {
        console.log('📤 Отправка запроса на изучение заклинания:', { user_id: userId, spell_id: spellId, faction: faction });
        
        const response = await fetch(`${API_BASE_URL}/api/spells/learn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                spell_id: spellId,
                faction: faction
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка сервера:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📥 Ответ сервера:', result);

        if (result.success) {
            if (!userData.spells) userData.spells = {};
            if (!userData.spells[faction]) userData.spells[faction] = {};

            userData.spells = result.updated_spells;

            if (typeof window.updatePlayerLevel === 'function') {
                window.updatePlayerLevel();
            }

            alert(result.message);
            if (typeof window.renderLibrary === 'function') {
                window.updateLibraryContent ? window.updateLibraryContent() : window.renderLibrary();
            }
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при изучении заклинания:", error);
        alert("❌ Ошибка сети при изучении заклинания.");
    }
}

// --- Улучшить заклинание ---
async function upgradeSpell(spellId, targetLevel, faction) {
    // Получаем информацию о заклинании
    const currentSpell = window.userData.spells?.[faction]?.[spellId];
    const currentLevel = currentSpell?.level || 1;
    
    // Определяем tier
    const spellTiers = window.SPELL_TIERS?.[faction] || [];
    const tierIndex = spellTiers.indexOf(spellId);
    const tier = tierIndex >= 0 ? tierIndex + 1 : 1;
    
    // Проверяем, не изучается ли уже заклинание
    if (window.hasActiveConstruction && window.hasActiveConstruction('spell')) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Уже изучается другое заклинание!');
        } else {
            alert('⚠️ Уже изучается другое заклинание!');
        }
        return;
    }
    
    // Запускаем улучшение через систему времени
    if (typeof window.startSpellLearning === 'function') {
        const success = await window.startSpellLearning(spellId, faction, tier, currentLevel);
        if (success) {
            if (typeof window.showNotification === 'function') {
                window.showNotification(`📖 Начато улучшение заклинания "${window.getSpellNameById(spellId)}" до уровня ${targetLevel}`);
            }
            if (typeof window.renderLibrary === 'function') {
                window.updateLibraryContent ? window.updateLibraryContent() : window.renderLibrary();
            }
        }
        return;
    }
    
    // Старый код для обратной совместимости (мгновенное улучшение)
    try {
        const response = await fetch(`${API_BASE_URL}/api/spells/upgrade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                spell_id: spellId,
                faction: faction,
                target_level: targetLevel
            })
        });

        const result = await response.json();

        if (result.success) {
            // Обновляем локальные данные
            if (!userData.spells) userData.spells = {};
            if (!userData.spells[faction]) userData.spells[faction] = {};

            // Обновляем данные из ответа сервера
            userData.spells = result.updated_spells;

            // Обновляем уровень игрока
            if (typeof window.updatePlayerLevel === 'function') {
                window.updatePlayerLevel();
            }

            // Проверяем, были ли разблокированы гибридные заклинания
            if (result.unlocked_hybrids && result.unlocked_hybrids.length > 0) {
                alert(`${result.message}\n\n🔓 Разблокированы гибридные заклинания! Перейдите во вкладку "Гибридные" чтобы изучить.`);
            } else {
                alert(result.message);
            }

            if (typeof window.renderLibrary === 'function') {
                window.updateLibraryContent ? window.updateLibraryContent() : window.renderLibrary();
            }
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при улучшении заклинания:", error);
        alert("❌ Ошибка сети при улучшении заклинания.");
    }
}

// --- Открыть заклинание следующей ступени ---
async function unlockSpell(spellId, faction) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/spells/unlock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                spell_id: spellId,
                faction: faction
            })
        });

        const result = await response.json();

        if (result.success) {
            // Обновляем локальные данные
            if (!userData.spells) userData.spells = {};
            if (!userData.spells[faction]) userData.spells[faction] = {};

            // Обновляем данные из ответа сервера
            userData.spells = result.updated_spells;

            // Обновляем уровень игрока
            if (typeof window.updatePlayerLevel === 'function') {
                window.updatePlayerLevel();
            }

            alert(result.message);
            if (typeof window.renderLibrary === 'function') {
                window.updateLibraryContent ? window.updateLibraryContent() : window.renderLibrary();
            }
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при разблокировке заклинания:", error);
        alert("❌ Ошибка сети при разблокировке заклинания.");
    }
}

// --- Делаем функции доступными глобально ---
window.learnSpell = learnSpell;
window.upgradeSpell = upgradeSpell;
window.unlockSpell = unlockSpell;