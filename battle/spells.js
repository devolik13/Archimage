// battle/spells.js - Система заклинаний для боя (адаптированная под новую структуру)


// --- БОСС-БОЙ: Async функция использования заклинаний (макс 2 для игрока, все для босса) ---
async function useWizardSpellsForBoss(wizard, position, casterType, maxSpells = 2) {
    const spells = wizard.spells || [];
    const availableSpells = spells.filter(spell => spell !== null && spell !== undefined);

    if (availableSpells.length === 0) {
        castBasicAttack(wizard, position, casterType);
        await delay(600);
        return;
    }

    // Ограничиваем количество заклинаний
    const spellsToUse = availableSpells.slice(0, maxSpells);

    for (let i = 0; i < spellsToUse.length; i++) {
        // Проверка что маг ещё жив
        if (wizard.hp <= 0) break;

        const spellId = spellsToUse[i];

        // Проверки на прерывание (Снежная буря)
        let interrupted = false;
        if (typeof window.isWizardInBlizzard === 'function') {
            const blizzard = window.isWizardInBlizzard(wizard, casterType);
            if (blizzard && Math.random() * 100 < blizzard.interruptChance) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Снежной бурей!`);
                }
                interrupted = true;
            }
        }

        // Проверка на Абсолютный Ноль
        if (!interrupted && typeof window.isWizardInAbsoluteZero === 'function') {
            const absoluteZero = window.isWizardInAbsoluteZero(wizard, casterType);
            if (absoluteZero && Math.random() * 100 < absoluteZero.interruptChance) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Абсолютным Нолём!`);
                }
                interrupted = true;
            }
        }

        // 👁️ Проверка на ослепление (Сияние солнца)
        // При ослеплении заклинание летит в случайную клетку (не прерывается!)
        if (!interrupted && wizard.effects && wizard.effects.blinded) {
            const isAffected = window.BLINDED_AFFECTED_SPELLS &&
                               window.BLINDED_AFFECTED_SPELLS.includes(spellId);

            if (isAffected) {
                const blinded = wizard.effects.blinded;
                const roll = Math.random() * 100;

                if (roll < blinded.missChance) {
                    // Выбираем случайную клетку на ВСЁМ поле (6 колонок × 5 рядов) - можно попасть по своим!
                    const randomCol = Math.floor(Math.random() * 6);
                    const randomRow = Math.floor(Math.random() * 5);
                    wizard._blindedTargetPosition = { col: randomCol, row: randomRow };

                    if (typeof window.addToBattleLog === 'function') {
                        const spellName = window.SPELL_NAMES?.[spellId] || spellId;
                        window.addToBattleLog(`👁️ ${wizard.name} ослеплён (${roll.toFixed(0)}/${blinded.missChance}) — ${spellName} летит в клетку [${randomCol},${randomRow + 1}]!`);
                    }
                } else {
                    delete wizard._blindedTargetPosition;
                }
            }
        }

        if (!interrupted) {
            // Ждём завершения анимации каста перед следующим заклинанием
            await castSpell(wizard, spellId, position, casterType);
        }

        // Сбрасываем флаг ослепления после каста
        delete wizard._blindedTargetPosition;
    }

    // Небольшая пауза после всех кастов мага
    await delay(300);
}

// Вспомогательная функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Главная функция использования заклинаний магом (async) ---
async function useWizardSpells(wizard, position, casterType) {
    const spells = wizard.spells || [];
    const availableSpells = spells.filter(spell => spell !== null && spell !== undefined);

    if (availableSpells.length === 0) {
        castBasicAttack(wizard, position, casterType);
        return;
    }

    // Последовательное использование заклинаний
    for (let i = 0; i < availableSpells.length; i++) {
        const spellId = availableSpells[i];
        let interrupted = false;

        // Проверки на прерывание (Снежная буря)
        if (typeof window.isWizardInBlizzard === 'function') {
            const blizzard = window.isWizardInBlizzard(wizard, casterType);
            if (blizzard) {
                if (Math.random() * 100 < blizzard.interruptChance) {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Снежной бурей!`);
                    }
                    interrupted = true;
                } else if (blizzard.level === 5 && Math.random() < 0.1) {
                    if (typeof window.tryApplyEffect === 'function') {
                        window.tryApplyEffect(blizzard.casterFaction === 'water' ? 'freeze' : 'hoarFrost', wizard);
                    }
                    if (typeof window.addToBattleLog === 'function') {
                        const effectName = blizzard.casterFaction === 'water' ? 'заморозку' : 'иней';
                        window.addToBattleLog(`❄️ ${wizard.name} поражён Снежной бурей — наложен ${effectName}!`);
                    }
                }
            }
        }

        // Проверка на Абсолютный Ноль
        if (!interrupted && typeof window.isWizardInAbsoluteZero === 'function') {
            const absoluteZero = window.isWizardInAbsoluteZero(wizard, casterType);
            if (absoluteZero) {
                if (Math.random() * 100 < absoluteZero.interruptChance) {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Абсолютным Нолём!`);
                    }
                    interrupted = true;
                } else {
                    if (typeof window.tryApplyEffect === 'function') {
                        window.tryApplyEffect(absoluteZero.casterFaction === 'water' ? 'freeze' : 'hoarFrost', wizard);
                    }
                    if (typeof window.addToBattleLog === 'function') {
                        const effectName = absoluteZero.casterFaction === 'water' ? 'заморозку' : 'иней';
                        window.addToBattleLog(`❄️ ${wizard.name} под Абсолютным Нолём — наложен ${effectName}!`);
                    }
                }
            }
        }

        // 👁️ Проверка на ослепление (Сияние солнца)
        // При ослеплении заклинание летит в случайную клетку (не прерывается!)
        if (!interrupted && wizard.effects && wizard.effects.blinded) {
            const isAffected = window.BLINDED_AFFECTED_SPELLS &&
                               window.BLINDED_AFFECTED_SPELLS.includes(spellId);

            if (isAffected) {
                const blinded = wizard.effects.blinded;
                const roll = Math.random() * 100;

                if (roll < blinded.missChance) {
                    // Выбираем случайную клетку на ВСЁМ поле (6 колонок × 5 рядов) - можно попасть по своим!
                    const randomCol = Math.floor(Math.random() * 6);
                    const randomRow = Math.floor(Math.random() * 5);
                    wizard._blindedTargetPosition = { col: randomCol, row: randomRow };

                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`👁️ ${wizard.name} ослеплён (${roll.toFixed(0)}/${blinded.missChance}) — заклинание летит в клетку [${randomCol},${randomRow + 1}]!`);
                    }
                } else {
                    // Попадает нормально - сбрасываем флаг
                    delete wizard._blindedTargetPosition;
                }
            }
        }

        // Кастуем заклинание и ждём завершения анимации каста
        if (!interrupted) {
            await castSpell(wizard, spellId, position, casterType);
        }

        // Сбрасываем флаг ослепления после каста
        delete wizard._blindedTargetPosition;
    }
}

// --- Функция применения эффекта заклинания (вызывается после анимации каста) ---
function executeSpellEffect(wizard, spellId, spellData, position, casterType) {
    if (!spellData) {
        castBasicAttack(wizard, position, casterType);
        return;
    }

    // 👁️ Устанавливаем текущего кастера и заклинание для проверки ослепления в findTarget
    window.currentSpellCaster = { wizard: wizard, type: casterType };
    window.currentCastingSpellId = spellId;

    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;

    switch (spellSchool) {
        case 'fire':
            if (typeof window.castFireSpell === 'function') {
                window.castFireSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'water':
            if (typeof window.castWaterSpell === 'function') {
                window.castWaterSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'wind':
            if (typeof window.castWindSpell === 'function') {
                window.castWindSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'earth':
            if (typeof window.castEarthSpell === 'function') {
                window.castEarthSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
	case 'nature':
            if (typeof window.castNatureSpell === 'function') {
                window.castNatureSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
	case 'poison':
            if (typeof window.castPoisonSpell === 'function') {
                window.castPoisonSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'light':
            if (typeof window.castLightSpell === 'function') {
                window.castLightSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'dark':
            if (typeof window.castDarkSpell === 'function') {
                window.castDarkSpell(wizard, spellId, spellData, position, casterType);
            } else {
                castBasicAttack(wizard, position, casterType);
            }
            break;
        default:
            castBasicAttack(wizard, position, casterType);
    }
}

// --- Функция каста заклинания (возвращает Promise) ---
function castSpell(wizard, spellId, position, casterType) {
    return new Promise((resolve) => {
        const col = casterType === 'player' ? 5 : 0;

        // Подготавливаем данные заклинания заранее
        let spellData = null;

        if (spellId) {
            if (casterType === 'player') {
                const spellsSource = window.userData?.spells;
                spellData = window.findSpellInUserData ? window.findSpellInUserData(spellId, spellsSource) : null;
            } else if (casterType === 'enemy') {
                // Для PvE врагов (элементалей) с spell_levels создаем spellData напрямую
                if (wizard.spell_levels && wizard.spell_levels[spellId]) {
                    const spellLevel = wizard.spell_levels[spellId];
                    const spellName = window.SPELL_NAMES?.[spellId] || spellId;
                    const baseDamage = window.SPELL_BASE_DAMAGE?.[spellId] || 10;
                    const spellType = window.getSpellType ? window.getSpellType(spellId) : 'single_target';
                    const damage = window.getSpellDamage ? window.getSpellDamage(spellId, spellLevel) : baseDamage;

                    spellData = {
                        id: spellId,
                        name: spellName,
                        level: spellLevel,
                        tier: Math.ceil(spellLevel / 1),
                        damage: damage,
                        type: spellType
                    };
                } else {
                    // Для PvP врагов используем стандартный путь
                    const spellsSource = window.selectedOpponent?.spells;
                    spellData = window.findSpellInUserData ? window.findSpellInUserData(spellId, spellsSource) : null;
                }
            }
        }

        // 🎬 Запускаем анимацию каста, эффект заклинания - в callback после её завершения
        if (typeof window.pixiWizards?.playAttack === 'function') {
            window.pixiWizards.playAttack(col, position, () => {
                // Эффект заклинания запускается ПОСЛЕ завершения анимации каста
                if (spellId) {
                    executeSpellEffect(wizard, spellId, spellData, position, casterType);
                }
                // Разрешаем следующий каст сразу после завершения анимации каста
                // (не ждём окончания анимации заклинания)
                resolve();
            });
        } else {
            // Fallback: если нет анимации, сразу применяем эффект
            if (spellId) {
                executeSpellEffect(wizard, spellId, spellData, position, casterType);
            }
            resolve();
        }
    });
}

// --- Базовая атака если нет заклинаний ---
function castBasicAttack(wizard, position, casterType) {
    const col = casterType === 'player' ? 5 : 0;

    if (typeof window.playWizardAttackAnimation === 'function') {
    	window.playWizardAttackAnimation(col, position, () => {});
    }

    const target = window.findTarget ? window.findTarget(position, casterType) : null;

    if (target) {
        const baseDamage = 5 + (wizard.level || 1) * 1;

        if (typeof window.applyDamageWithMultiLayerProtection === 'function') {
            const result = window.applyDamageWithMultiLayerProtection(wizard, target, baseDamage, 'basic_attack', casterType);

            if (result) {
                const attackName = `${wizard.name}: Атака`;
                if (typeof window.logSpellHit === 'function') {
                    window.logSpellHit(wizard, target.wizard, result.finalDamage, attackName);
                } else if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`⚔️ ${attackName} → ${target.wizard.name} (${result.finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp})`);
                }
            }
        } else {
            const finalDamage = window.applyFinalDamage ?
                window.applyFinalDamage(wizard, target.wizard, baseDamage, 'basic_attack', 0, false) : baseDamage;

            target.wizard.hp -= finalDamage;
            if (target.wizard.hp < 0) target.wizard.hp = 0;

            const attackName = `${wizard.name}: Атака`;
            if (typeof window.logSpellHit === 'function') {
                window.logSpellHit(wizard, target.wizard, finalDamage, attackName);
            } else if (Array.isArray(window.battleLog)) {
                window.battleLog.push(`⚔️ ${attackName} → ${target.wizard.name} (${finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp})`);
            }
        }
    } else {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⚔️ ${wizard.name} атакует, но цель не найдена`);
        }
    }
}

// --- Вспомогательные функции ---
function selectRandomSpell(wizard) {
    const spells = wizard.spells || [];
    const availableSpells = spells.filter(spell => spell !== null && spell !== undefined);
    if (availableSpells.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableSpells.length);
    return availableSpells[randomIndex];
}

function getSpellInfo(spellId) {
    if (!spellId) return null;
    const spellData = window.findSpellInUserData ?
        window.findSpellInUserData(spellId, window.userData?.spells) : null;
    if (!spellData) return null;
    return {
        id: spellId,
        name: spellData.name,
        level: spellData.level,
        tier: spellData.tier,
        school: window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null,
        damage: 0
    };
}

// Глобальный экспорт
window.useWizardSpells = useWizardSpells;
window.useWizardSpellsForBoss = useWizardSpellsForBoss;
window.castSpell = castSpell;
window.castBasicAttack = castBasicAttack;
window.selectRandomSpell = selectRandomSpell;
window.getSpellInfo = getSpellInfo;
