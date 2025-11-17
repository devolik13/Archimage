// battle/spells.js - Система заклинаний для боя (адаптированная под новую структуру)

console.log('✅ battle/spells.js загружен');

// --- Главная функция использования заклинаний магом ---
function useWizardSpells(wizard, position, casterType) {
    console.log(`🧙‍♂️ ${wizard.name} (${casterType}) использует заклинания на позиции ${position}`);
    
    const spells = wizard.spells || [];
    const availableSpells = spells.filter(spell => spell !== null && spell !== undefined);
    
    if (availableSpells.length === 0) {
        console.log(`⚔️ ${wizard.name} не имеет заклинаний, использует базовую атаку`);
        castBasicAttack(wizard, position, casterType);
        return;
    }
    
    // Последовательное использование заклинаний с задержкой
    let spellIndex = 0;
    
    function castNextSpell() {
        if (spellIndex >= availableSpells.length) return;
        
        const spellId = availableSpells[spellIndex];
        console.log(`🎯 ${wizard.name} использует заклинание ${spellIndex + 1}/${availableSpells.length}: ${spellId}`);
        
        // Проверки на прерывание (Снежная буря и Абсолютный Ноль)
        if (typeof window.isWizardInBlizzard === 'function') {
            const blizzard = window.isWizardInBlizzard(wizard, casterType);
            if (blizzard) {
                if (Math.random() * 100 < blizzard.interruptChance) {
                    if (typeof window.addToBattleLog === 'function') {
                        window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Снежной бурей!`);
                    }
                    spellIndex++;
                    if (spellIndex < availableSpells.length) {
                        setTimeout(castNextSpell, 800);
                    }
                    return;
                }
                
                if (blizzard.level === 5 && Math.random() < 0.1) {
                    if (typeof window.tryApplyEffect === 'function') {
                        window.tryApplyEffect(blizzard.casterFaction === 'water' ? 'freeze' : 'hoarFrost', wizard);
                    }
                    if (typeof window.addToBattleLog === 'function') {
                        const effectName = blizzard.casterFaction === 'water' ? 'заморозку' : 'иней';
                        window.addToBattleLog(`❄️ ${wizard.name} поражён Снежной бурей — наложен ${effectName}!`);
                    }
                }
            }
            
            if (typeof window.isWizardInAbsoluteZero === 'function') {
                const absoluteZero = window.isWizardInAbsoluteZero(wizard, casterType);
                if (absoluteZero) {
                    if (Math.random() * 100 < absoluteZero.interruptChance) {
                        if (typeof window.addToBattleLog === 'function') {
                            window.addToBattleLog(`❄️ Заклинание ${wizard.name} прервано Абсолютным Нолём!`);
                        }
                        spellIndex++;
                        if (spellIndex < availableSpells.length) {
                            setTimeout(castNextSpell, 800);
                        }
                        return;
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
        }
        
        // Кастуем заклинание
        castSpell(wizard, spellId, position, casterType);
        
        spellIndex++;
        
        // Если есть еще заклинания, вызываем следующее через задержку
        if (spellIndex < availableSpells.length) {
            setTimeout(castNextSpell, 800); // 800мс между заклинаниями
        }
    }
    
    castNextSpell();
}

// --- Функция каста заклинания ---
function castSpell(wizard, spellId, position, casterType) {
    console.log(`⚡ DEBUG: castSpell called`);
    console.log(`   Wizard: ${wizard.name}`);
    console.log(`   Spell ID: ${spellId}`);
    console.log(`   Position: ${position}`);
    console.log(`   Caster Type: ${casterType}`);
    console.log(`   Wizard Faction: ${wizard.faction || 'none'}`);
    
    // 🎬 АНИМАЦИЯ АТАКИ - запускаем для ЛЮБОГО заклинания
    const col = casterType === 'player' ? 5 : 0;
    const wizardKey = `${col}_${position}`;
    
    console.log(`🎬 Запускаем анимацию атаки для ${wizardKey}`);
    
    // Проверяем наличие функции анимации
    if (typeof window.pixiWizards?.playAttack === 'function') {
    	window.pixiWizards.playAttack(col, position, () => {
    	    console.log(`✅ Анимация атаки завершена для ${wizard.name}`);
    	});
    } else {
    	console.warn('⚠️ playAttack недоступна');
    }
    
    if (!spellId) {
        console.log(`⚠️ ${wizard.name} пытается использовать пустое заклинание`);
        return;
    }

    // ИСПРАВЛЕНИЕ: Используем правильный источник данных для врагов и игрока
    let spellsSource = null;
    if (casterType === 'player') {
        spellsSource = window.userData?.spells;
    } else if (casterType === 'enemy') {
        spellsSource = window.selectedOpponent?.spells;
    }

    const spellData = window.findSpellInUserData ? window.findSpellInUserData(spellId, spellsSource) : null;
    console.log(`   Spell Data (from ${casterType}):`, spellData);

    if (!spellData) {
        console.log(`❌ Заклинание ${spellId} не найдено в данных ${casterType}, используем базовую атаку`);
        castBasicAttack(wizard, position, casterType);
        return;
    }

    const spellSchool = window.getSpellSchoolFallback ? window.getSpellSchoolFallback(spellId) : null;
    console.log(`   Spell School: ${spellSchool}`);

    switch (spellSchool) {
        case 'fire':
            if (typeof window.castFireSpell === 'function') {
                window.castFireSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castFireSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'water':
            if (typeof window.castWaterSpell === 'function') {
                window.castWaterSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castWaterSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'wind':
            if (typeof window.castWindSpell === 'function') {
                window.castWindSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castWindSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
        case 'earth':
            if (typeof window.castEarthSpell === 'function') {
                window.castEarthSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castEarthSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
	case 'nature':
            if (typeof window.castNatureSpell === 'function') {
                window.castNatureSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castNatureSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
	case 'poison':
            if (typeof window.castPoisonSpell === 'function') {
                window.castPoisonSpell(wizard, spellId, spellData, position, casterType);
            } else {
                console.error("Функция castPoisonSpell не найдена");
                castBasicAttack(wizard, position, casterType);
            }
            break;
        default:
            console.log(`⚠️ Неизвестная школа заклинания: ${spellSchool} для ${spellId}`);
            castBasicAttack(wizard, position, casterType);
    }
}

// --- Базовая атака если нет заклинаний ---
function castBasicAttack(wizard, position, casterType) {
    console.log(`⚔️ ${wizard.name} использует базовую атаку`);
    
    // 🎬 АНИМАЦИЯ для базовой атаки тоже!
    const col = casterType === 'player' ? 5 : 0;
    const wizardKey = `${col}_${position}`;
    
    console.log(`🎬 Запускаем анимацию базовой атаки для ${wizardKey}`);
    
    if (typeof window.playWizardAttackAnimation === 'function') {
    	window.playWizardAttackAnimation(col, position, () => {
    	    console.log(`✅ Анимация базовой атаки завершена для ${wizard.name}`);
    	});
    }
    const target = window.findTarget ? window.findTarget(position, casterType) : null;
    
    if (target) {
        const baseDamage = 15 + (wizard.level || 1) * 2;
        const finalDamage = window.applyFinalDamage ? 
            window.applyFinalDamage(wizard, target.wizard, baseDamage, 'basic_attack', 0, false) : baseDamage;
            
        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        
        if (typeof window.logSpellHit === 'function') {
            window.logSpellHit(wizard, target.wizard, finalDamage, 'Базовая атака');
        } else if (Array.isArray(window.battleLog)) {
            const logEntry = `⚔️ ${wizard.name} атакует ${target.wizard.name} (${finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp})`;
            window.battleLog.push(logEntry);
            console.log(logEntry);
        }
    } else {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⚔️ ${wizard.name} атакует, но цель не найдена`);
        } else if (Array.isArray(window.battleLog)) {
            const logEntry = `⚔️ ${wizard.name} атакует, но цель не найдена`;
            window.battleLog.push(logEntry);
            console.log(logEntry);
        }
    }
}

// --- Вспомогательные функции остаются без изменений ---
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
window.castSpell = castSpell;
window.castBasicAttack = castBasicAttack;
window.selectRandomSpell = selectRandomSpell;
window.getSpellInfo = getSpellInfo;