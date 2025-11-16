console.log('✅ battle/systems/effects-system.js загружен');

// Счетчики эффектов для отладки
let effectCounters = {
    burning: 0,
    chilled: 0,
    doubleDamage: 0,
    armorIgnored: 0
};

// --- Универсальный хелпер для применения эффектов ---
function tryApplyEffect(effectName, target, isHybrid = false, casterInfo = null) {
    const effectMap = {
        'burning': applyBurningEffect,
        'chill': applyChillEffect,
        'hoarFrost': applyHoarFrostEffect,
        'freeze': applyFreezeEffect
    };

    const effectFn = effectMap[effectName];
    if (typeof effectFn === 'function') {
        effectFn(target, isHybrid, casterInfo);
        return true;
    }
    return false;
}

// --- Эффект поджигания ---
function applyBurningEffect(targetWizard, isHybrid = false, casterInfo = null) {
    const chance = isHybrid ? 0.05 : 0.10;
    if (Math.random() < chance) {
        const maxDamage = Math.min(Math.floor(targetWizard.max_hp * 0.10), 100);

        if (targetWizard.effects && targetWizard.effects.burning) {
            targetWizard.effects.burning.duration = 3;
            targetWizard.effects.burning.damage = maxDamage;
        } else {
            if (!targetWizard.effects) targetWizard.effects = {};
            targetWizard.effects.burning = {
                duration: 3,
                damage: maxDamage,
                maxDamage: maxDamage
            };
            effectCounters.burning++;
        }
        if (window.spellAnimations?.burning?.show) {
            let position = -1;
            let casterType = '';

            position = window.playerFormation.findIndex(id => id === targetWizard.id);
            if (position !== -1) {
                casterType = 'player';
            } else {
                position = window.enemyFormation.findIndex(w => w && w.id === targetWizard.id);
                if (position !== -1) {
                    casterType = 'enemy';
                }
            }

            if (position !== -1 && casterType) {
                window.spellAnimations.burning.show(targetWizard, position, casterType);
            }
        }
        const logEntry = `🔥 ${targetWizard.name} подожжен! Получает ${maxDamage} урона в свой ход в течение 3 ходов.`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(logEntry);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(logEntry);
        }

        // Речевой пузырь для фракционного бонуса (если кастер фракции Огонь)
        if (casterInfo && casterInfo.faction === 'fire' && typeof window.showFactionSpeechBubble === 'function') {
            const col = casterInfo.casterType === 'player' ? 5 : 0;
            window.showFactionSpeechBubble('fire', col, casterInfo.position);
        }
    }
}

// --- Эффект охлаждения ---
function applyChillEffect(targetWizard, isHybrid = false, casterInfo = null) {
    const chance = isHybrid ? 0.10 : 0.20;
    if (Math.random() < chance) {
        if (targetWizard.effects && targetWizard.effects.chilled_caster) {
            targetWizard.effects.chilled_caster.spellsLeft = Math.max(targetWizard.effects.chilled_caster.spellsLeft, 2);
        } else {
            if (!targetWizard.effects) targetWizard.effects = {};
            targetWizard.effects.chilled_caster = {
                spellsLeft: 2,
                damageReduction: 0.20
            };
            effectCounters.chilled++;
        }

        const logEntry = `❄️ ${targetWizard.name} охлажден! Его следующие заклинания будут слабее.`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(logEntry);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(logEntry);
        }
    }
}

// --- Эффект инея ---
function applyHoarFrostEffect(targetWizard, isHybrid = false, casterInfo = null) {
    const chance = 0.30;
    if (Math.random() < chance) {
        if (!targetWizard.effects) targetWizard.effects = {};

        if (targetWizard.effects.chilled_caster) {
            if (targetWizard.effects.chilled_caster.damageReduction <= 0.10) {
                targetWizard.effects.chilled_caster.spellsLeft = 2;
                targetWizard.effects.chilled_caster.damageReduction = 0.10;
            }
        } else {
            targetWizard.effects.chilled_caster = {
                spellsLeft: 2,
                damageReduction: 0.10
            };
            effectCounters.chilled++;
        }

        const logEntry = `🧊 ${targetWizard.name} покрыт инеем! Его следующие заклинания будут слабее.`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(logEntry);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(logEntry);
        }
    }
}

// --- Эффект заморозки ---
function applyFreezeEffect(targetWizard, isHybrid = false, casterInfo = null) {
    const chance = 0.50;
    if (Math.random() < chance) {
        if (!targetWizard.effects) targetWizard.effects = {};

        if (targetWizard.effects.chilled_caster) {
            if (targetWizard.effects.chilled_caster.damageReduction <= 0.30) {
                targetWizard.effects.chilled_caster.spellsLeft = 2;
                targetWizard.effects.chilled_caster.damageReduction = 0.30;
            }
        } else {
            targetWizard.effects.chilled_caster = {
                spellsLeft: 2,
                damageReduction: 0.30
            };
            effectCounters.chilled++;
        }

        const logEntry = `🧊 ${targetWizard.name} заморожен! Его следующие заклинания будут слабее.`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(logEntry);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(logEntry);
        }

        // Речевой пузырь для фракционного бонуса (если кастер фракции Вода)
        if (casterInfo && casterInfo.faction === 'water' && typeof window.showFactionSpeechBubble === 'function') {
            const col = casterInfo.casterType === 'player' ? 5 : 0;
            window.showFactionSpeechBubble('water', col, casterInfo.position);
        }
    }
}

function processBurningForWizard(wizard) {
    if (!wizard.effects || !wizard.effects.burning || wizard.hp <= 0) return;

    const burningEffect = wizard.effects.burning;
    wizard.hp -= burningEffect.damage;
    if (wizard.hp < 0) wizard.hp = 0;

    const logEntry = `🔥 ${wizard.name} горит! Получает ${burningEffect.damage} урона (${wizard.hp}/${wizard.max_hp})`;
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(logEntry);
    } else if (Array.isArray(window.battleLog)) {
        window.battleLog.push(logEntry);
    }

    // Логирование смерти от горения
    if (wizard.hp <= 0) {
        // Определяем тип кастера и позицию
        let casterType = '';
        let col = -1;
        let row = -1;

        const playerPos = window.playerFormation?.findIndex(id => id === wizard.id);
        if (playerPos !== -1) {
            casterType = 'player';
            col = 5;
            row = playerPos;
        } else {
            const enemyPos = window.enemyFormation?.findIndex(w => w && w.id === wizard.id);
            if (enemyPos !== -1) {
                casterType = 'enemy';
                col = 0;
                row = enemyPos;
            }
        }

        if (casterType && window.battleLogger) {
            window.battleLogger.logDeath(wizard, casterType, 'burning');
        }

        // Обновляем HP бар (скрываем)
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function' && col !== -1 && row !== -1) {
            const key = `${col}_${row}`;
            window.pixiWizards.updateHP(key, 0, wizard.max_hp);
        }

        // Запускаем анимацию смерти
        if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function' && col !== -1 && row !== -1) {
            const key = `${col}_${row}`;
            const container = window.wizardSprites?.[key];
            if (container && !container.deathAnimationStarted) {
                container.deathAnimationStarted = true;
                window.pixiWizards.playDeath(col, row);
                console.log(`🎬 Анимация смерти от горения для ${wizard.name} на ${key}`);
            }
        }

        return; // Маг мёртв, не продолжаем обработку
    }
    
    burningEffect.duration--;
    if (burningEffect.duration <= 0) {
        delete wizard.effects.burning;
        const endLog = `🔥 ${wizard.name} перестал гореть.`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(endLog);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(endLog);
        }
        
        // УДАЛЕНИЕ ЭФФЕКТА - ТОЛЬКО КОГДА ГОРЕНИЕ ЗАКОНЧИЛОСЬ
        if (window.spellAnimations?.burning?.remove) {
            let position = -1;
            let casterType = '';
            
            position = window.playerFormation.findIndex(id => id === wizard.id);
            if (position !== -1) {
                casterType = 'player';
            } else {
                position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
                if (position !== -1) {
                    casterType = 'enemy';
                }
            }
            
            if (position !== -1 && casterType) {
                window.spellAnimations.burning.remove(`${casterType}_${position}`);
            }
        }
    }
    
    // Обрабатываем яд (если есть)
    if (typeof processPoisonForWizard === 'function') {
        processPoisonForWizard(wizard);
    }
}

// --- Обработка регенерации для мага ---
function processRegenerationForWizard(wizard) {
    if (!wizard.effects || !wizard.effects.leaf_canopy || wizard.hp <= 0) return;
    
    const regenEffect = wizard.effects.leaf_canopy;
    const healAmount = regenEffect.amount || Math.floor(wizard.max_hp * 0.05);
    
    // Исцеляем мага через систему с учетом дебаффов
    const oldHP = wizard.hp;
    const finalHeal = typeof window.applyFinalHealing === 'function' ? 
    	window.applyFinalHealing(wizard, healAmount, 'leaf_canopy') : healAmount;
    
    if (wizard.hp > oldHP) {
    	const actualHeal = wizard.hp - oldHP;
    	const logEntry = `🍃 ${wizard.name} восстанавливает ${actualHeal} HP от Покрова листвы (${wizard.hp}/${wizard.max_hp})`;
    	if (typeof window.addToBattleLog === 'function') {
    	    window.addToBattleLog(logEntry);
    	}
    
        if (window.spellAnimations?.leaf_canopy?.pulse) {
            // Определяем позицию и тип мага
            let position = -1;
            let casterType = '';
            
            // Проверяем в игроках
            position = window.playerFormation.findIndex(id => id === wizard.id);
            if (position !== -1) {
                casterType = 'player';
            } else {
                // Проверяем во врагах
                position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
                if (position !== -1) {
                    casterType = 'enemy';
                }
            }
            
            if (position !== -1 && casterType) {
                console.log('🍃 Запускаем пульсацию для:', wizard.name, 'позиция:', position, 'тип:', casterType);
                window.spellAnimations.leaf_canopy.pulse(position, casterType);
            }
        }
    }
}

// --- Обработка яда для мага ---
function processPoisonForWizard(wizard) {
    if (!wizard.effects || !wizard.effects.poison || wizard.hp <= 0) return;

    const poisonEffect = wizard.effects.poison;
    const damage = poisonEffect.stacks * (poisonEffect.damagePerStack || 5);

    // Наносим урон от яда
    const oldHP = wizard.hp;
    wizard.hp -= damage;
    if (wizard.hp < 0) wizard.hp = 0;

    if (wizard.hp < oldHP) {
        const actualDamage = oldHP - wizard.hp;
        const logEntry = `☠️ ${wizard.name} страдает от яда (${actualDamage} урона, ${poisonEffect.stacks} стаков) (${wizard.hp}/${wizard.max_hp})`;
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(logEntry);
        } else if (Array.isArray(window.battleLog)) {
            window.battleLog.push(logEntry);
        }
    }

    // Логирование смерти от яда
    if (wizard.hp <= 0) {
        // Определяем тип кастера и позицию
        let casterType = '';
        let col = -1;
        let row = -1;

        const playerPos = window.playerFormation?.findIndex(id => id === wizard.id);
        if (playerPos !== -1) {
            casterType = 'player';
            col = 5;
            row = playerPos;
        } else {
            const enemyPos = window.enemyFormation?.findIndex(w => w && w.id === wizard.id);
            if (enemyPos !== -1) {
                casterType = 'enemy';
                col = 0;
                row = enemyPos;
            }
        }

        if (casterType && window.battleLogger) {
            window.battleLogger.logDeath(wizard, casterType, 'poison');
        }

        // Обновляем HP бар (скрываем)
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function' && col !== -1 && row !== -1) {
            const key = `${col}_${row}`;
            window.pixiWizards.updateHP(key, 0, wizard.max_hp);
        }

        // Запускаем анимацию смерти
        if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function' && col !== -1 && row !== -1) {
            const key = `${col}_${row}`;
            const container = window.wizardSprites?.[key];
            if (container && !container.deathAnimationStarted) {
                container.deathAnimationStarted = true;
                window.pixiWizards.playDeath(col, row);
                console.log(`🎬 Анимация смерти от яда для ${wizard.name} на ${key}`);
            }
        }
    }
}

// --- Функции проверок ---
function checkCriticalHit(chancePercent = 5) {
    const clampedChance = Math.max(0, Math.min(100, chancePercent));
    const isCritical = Math.random() < (clampedChance / 100.0);
    if (isCritical) effectCounters.doubleDamage++;
    return isCritical;
}

function checkFactionDoubleDamage(wizardFaction, spellFaction) {
    if (wizardFaction !== spellFaction) return false;
    if (wizardFaction === 'wind') {
        const isDouble = Math.random() < 0.05;
        if (isDouble) effectCounters.doubleDamage++;
        return isDouble;
    }
    return false;
}

function checkDoubleDamage(isHybrid = false) {
    const chance = isHybrid ? 0.025 : 0.05;
    const isDouble = Math.random() < chance;
    if (isDouble) effectCounters.doubleDamage++;
    return isDouble;
}

function checkArmorIgnore(isHybrid = false) {
    const chance = isHybrid ? 0.05 : 0.10;
    const ignore = Math.random() < chance;
    if (ignore) effectCounters.armorIgnored++;
    return ignore ? 20 : 0;
}

// --- Устаревшая функция для совместимости ---
function processEffects() {
    console.log("🌀 Обработка эффектов (устаревшая функция)");
}

// Экспорт
window.processPoisonForWizard = processPoisonForWizard;
window.processRegenerationForWizard = processRegenerationForWizard;
window.tryApplyEffect = tryApplyEffect;
window.applyBurningEffect = applyBurningEffect;
window.applyChillEffect = applyChillEffect;
window.applyHoarFrostEffect = applyHoarFrostEffect;
window.applyFreezeEffect = applyFreezeEffect;
window.processBurningForWizard = processBurningForWizard;
window.checkCriticalHit = checkCriticalHit;
window.checkFactionDoubleDamage = checkFactionDoubleDamage;
window.checkDoubleDamage = checkDoubleDamage;
window.checkArmorIgnore = checkArmorIgnore;
window.processEffects = processEffects;
window.effectCounters = effectCounters;