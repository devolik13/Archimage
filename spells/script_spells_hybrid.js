// script_spells_hybrid.js - Гибридные заклинания (новая логика)

// --- Вкладка "Гибридные" ---
function renderHybridTab() {
    const hybridSpells = userData.spell?.hybrid || {};
    let spellsList = [];
    let unlockedCount = 0;

    // Собираем все гибридные заклинания
    for (const [spellId, spellData] of Object.entries(hybridSpells)) {
        // Показываем все заклинания, включая заблокированные
        const damage = spellData.level > 0 ? getHybridSpellDamage(spellId, spellData.level) : 0;
        spellsList.push({
            ...spellData,
            spellId: spellId,
            damage: damage,
            unlocked: spellData.level > 0 || spellData.unlocked === true
        });
        
        if (spellData.level > 0 || spellData.unlocked === true) {
            unlockedCount++;
        }
    }

    // Сортируем по ступени
    spellsList.sort((a, b) => a.tier - b.tier);

    if (unlockedCount === 0) {
        return `
            <div style="text-align: center; padding:30px; color: #aaa; background: #3d3d5c; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔮</div>
                <h3>Изучи 2 разных заклинания одной ступени 3+ уровня</h3>
                <p style="font-size: 14px; margin-top: 10px;">
                    Комбинируй заклинания разных школ, чтобы открыть новые мощные способности!
                </p>
                <div style="margin-top: 20px; font-size: 12px; color: #777;">
                    <p>🔥 + 💧 = Пылающий лед</p>
                    <p>🔥 + 🌪 = Грозовой порыв</p>
                    <p>💧 + 🌪 = Ледяной шторм</p>
                    <p>...</p>
                </div>
            </div>
        `;
    }

    let html = '';
    spellsList.forEach(spell => {
        if (spell.unlocked || spell.level > 0) {
            const maxLevel = 5;
            const canUpgrade = spell.level > 0 && spell.level < maxLevel;
            const isLocked = spell.level === 0;
            
            html += `
                <div style="background: #444466; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #ff6b6b;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 16px;">🔮 ${spell.name}</strong>
                            <div style="font-size: 12px; color: #aaa;">Ступень ${spell.tier}${spell.level > 0 ? `, Уровень ${spell.level}/${maxLevel}` : ''}</div>
                        </div>
                        <div style="font-size: 24px;">🔮</div>
                    </div>
                    ${spell.level > 0 ? `
                        <div style="margin-top: 10px; font-size: 14px; color: #7289da;">
                            ${spell.damage} ур. урона
                        </div>
                        ${canUpgrade ? `
                            <button style="margin-top: 10px; padding: 8px 15px; background: #7289da; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                    onclick="upgradeHybridSpell('${spell.spellId}', ${spell.level + 1})">
                                Улучшить (ур. ${spell.level + 1})
                            </button>
                        ` : `
                            <div style="margin-top: 10px; font-size: 12px; color: #777;">✅ Максимальный уровень</div>
                        `}
                    ` : `
                        <div style="margin-top: 10px; font-size: 14px; color: #7289da;">
                            🔒 Заблокировано
                        </div>
                        <button style="margin-top: 10px; padding: 8px 15px; background: #7289da; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                onclick="learnHybridSpell('${spell.spellId}')">
                            Изучить
                        </button>
                    `}
                </div>
            `;
        }
    });

    return html;
}

// --- Отображение вкладки "Гибридные" ---
function displayHybridTab() {
    const hybridSpells = userData.spells?.hybrid || {};
    let spellsList = [];
    let unlockedCount = 0;

    // Собираем все гибридные заклинания
    for (const [spellId, spellData] of Object.entries(hybridSpells)) {
        const damage = spellData.level > 0 ? getHybridSpellDamage(spellId, spellData.level) : 0;
        const isUnlocked = spellData.level > 0 || spellData.unlocked === true;
        
        spellsList.push({
            ...spellData,
            spellId: spellId,
            damage: damage,
            isUnlocked: isUnlocked
        });
        
        if (isUnlocked) {
            unlockedCount++;
        }
    }

    // Сортируем по ступени
    spellsList.sort((a, b) => a.tier - b.tier);

    if (unlockedCount === 0) {
        return `
            <div style="text-align: center; padding: 30px; color: #aaa; background: #3d3d5c; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔮</div>
                <h3>Изучи 2 разных заклинания одной ступени 3+ уровня</h3>
                <p style="font-size: 14px; margin-top: 10px;">
                    Комбинируй заклинания разных школ, чтобы открыть новые мощные способности!
                </p>
                <div style="margin-top: 20px; font-size: 12px; color: #777;">
                    <p>🔥 + 💧 = Пылающий лед</p>
                    <p>🔥 + 🌪 = Грозовой порыв</p>
                    <p>💧 + 🌪 = Ледяной шторм</p>
                </div>
            </div>
        `;
    }

    let html = '';
    spellsList.forEach(spell => {
        if (spell.isUnlocked) {
            const maxLevel = 5;
            const canUpgrade = spell.level > 0 && spell.level < maxLevel;
            const needToLearn = spell.level === 0;
            
            html += `
                <div style="background: #444466; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #ff6b6b;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 16px;">🔮 ${spell.name}</strong>
                            <div style="font-size: 12px; color: #aaa;">Ступень ${spell.tier}${spell.level > 0 ? `, Уровень ${spell.level}/${maxLevel}` : ''}</div>
                        </div>
                        <div style="font-size: 24px;">🔮</div>
                    </div>
                    ${spell.level > 0 ? `
                        <div style="margin-top: 10px; font-size: 14px; color: #7289da;">
                            ${spell.damage} ур. урона
                        </div>
                        ${canUpgrade ? `
                            <button style="margin-top: 10px; padding: 8px 15px; background: #7289da; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                    onclick="upgradeHybridSpell('${spell.spellId}', ${spell.level + 1})">
                                Улучшить (ур. ${spell.level + 1})
                            </button>
                        ` : `
                            <div style="margin-top: 10px; font-size: 12px; color: #777;">✅ Максимальный уровень</div>
                        `}
                    ` : `
                        <div style="margin-top: 10px; font-size: 14px; color: #7289da;">
                            🔒 Заблокировано - нужно изучить
                        </div>
                        <button style="margin-top: 10px; padding: 8px 15px; background: #7289da; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                onclick="learnHybridSpell('${spell.spellId}')">
                            Изучить
                        </button>
                    `}
                </div>
            `;
        }
    });

    return html;
}

// --- Изучить гибридное заклинание ---
async function learnHybridSpell(spellId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/spells/learn`, { // ИСПРАВЛЕНО: spells/learn
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                spell_id: spellId,
                faction: 'hybrid'
            })
        });

        const result = await response.json();

        if (result.success) {
            // Обновляем локальные данные
            if (!userData.spells) userData.spells = {};
            if (!userData.spells.hybrid) userData.spells.hybrid = {};
            if (!userData.available_spells) userData.available_spells = [];

            // Обновляем данные из ответа сервера
            userData.spells = result.updated_spells;
            userData.available_spells = result.updated_available_spells;

            alert(result.message);
            if (typeof window.renderLibrary === 'function') {
                window.renderLibrary();
            }
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при изучении гибридного заклинания:", error);
        alert("❌ Ошибка сети при изучении заклинания.");
    }
}

// --- Улучшить гибридное заклинание ---
async function upgradeHybridSpell(spellId, targetLevel) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/spells/upgrade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                spell_id: spellId,
                faction: 'hybrid',
                target_level: targetLevel
            })
        });

        const result = await response.json();

        if (result.success) {
            // Обновляем локальные данные
            if (!userData.spells) userData.spells = {};
            if (!userData.spells.hybrid) userData.spells.hybrid = {};

            // Обновляем данные из ответа сервера
            userData.spells = result.updated_spells;

            alert(result.message);
            if (typeof window.renderLibrary === 'function') {
                window.renderLibrary();
            }
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    } catch (error) {
        console.error("Ошибка при улучшении гибридного заклинания:", error);
        alert("❌ Ошибка сети при улучшении заклинания.");
    }
}


// --- Делаем функции доступными глобально ---
window.displayHybridTab = displayHybridTab;
window.upgradeHybridSpell = upgradeHybridSpell;
window.learnHybridSpell = learnHybridSpell;
window.getHybridSpellDamage = getHybridSpellDamage;
window.getFactionEmoji = getFactionEmoji;
window.getFactionName = getFactionName;