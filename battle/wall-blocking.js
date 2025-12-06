
// --- Локальная функция определения типа заклинания (без конфликтов) ---
function getSpellTypeForWalls(spellId) {
    const spellTypes = {
        // Single target - может блокироваться стенами
        'pebble': 'single_target',
        'spark': 'single_target',
        'icicle': 'single_target',
        'gust': 'single_target',
        'firebolt': 'single_target',
        'frost_arrow': 'single_target',
        'poisoned_blade': 'single_target',
        'call_wolf': 'single_target',
        
        // AOE - игнорируют стены
        'stone_spike': 'aoe',
        'ice_rain': 'aoe',
        'fire_wall': 'aoe',
        'wind_blade': 'aoe',
        'fireball': 'aoe',
        'fire_tsunami': 'aoe',
        'absolute_zero': 'aoe',
        'meteor_shower': 'aoe',
        'storm_cloud': 'aoe',
        'ball_lightning': 'aoe',
        'chain_lightning': 'aoe', // Обратная совместимость
        'blizzard': 'aoe',
        'poisoned_glade': 'aoe',
        'foul_cloud': 'aoe',
        'epidemic': 'aoe',
        
        // Utility - не наносят прямой урон
        'earth_wall': 'utility',
        'wind_wall': 'utility',
        'stone_grotto': 'utility',
        'bark_armor': 'utility',
        'leaf_canopy': 'utility',
        'meteorokinesis': 'utility',
        'plague': 'utility',
        'ent': 'utility'
    };
    
    return spellTypes[spellId] || 'single_target';
}

// --- Проверка блокировки стеной ---
function checkEarthWallBlockage(casterType, targetPosition, damage, spellId = null) {
    const spellType = spellId ? getSpellTypeForWalls(spellId) : 'single_target';
    
    // AOE и utility игнорируют стены
    if (spellType === 'aoe' || spellType === 'utility') {
        return { 
            blocked: false, 
            remainingDamage: damage,
            wallDamage: 0,
            message: `${spellType.toUpperCase()} заклинание игнорирует стены`
        };
    }
    
    // Определяем колонку стены
    let wallColumn;
    if (casterType === 'player') {
        wallColumn = 2; // Стена противника между колонками 1 и 2
    } else {
        wallColumn = 3; // Стена игрока между колонками 3 и 4
    }
    
    // Ищем стену
    const wall = typeof window.findEarthWallAt === 'function' ? 
        window.findEarthWallAt(wallColumn, targetPosition) : null;
    
    if (!wall || wall.hp <= 0) {
        return { 
            blocked: false, 
            remainingDamage: damage,
            wallDamage: 0,
            message: 'Стена не найдена или разрушена'
        };
    }
    
    // Стена блокирует ТОЛЬКО вражеские заклинания
    if (wall.casterType === casterType) {
        return { 
            blocked: false, 
            remainingDamage: damage,
            wallDamage: 0,
            message: 'Стена не блокирует заклинания своих магов'
        };
    }
    
    // Блокируем урон
    const damageToWall = Math.min(damage, wall.hp);
    const remainingDamage = Math.max(0, damage - wall.hp);
    
    // Наносим урон стене
    const wasDestroyed = typeof window.damageEarthWall === 'function' ? 
        window.damageEarthWall(wall.id, damageToWall) : false;
    
    let message = `🛡️ Стена поглощает ${damageToWall} урона`;
    if (remainingDamage > 0) {
        message += `, ${remainingDamage} проходит через`;
    }
    if (wasDestroyed) {
        message += ` (стена разрушена!)`;
    }
    
    return {
        blocked: true,
        remainingDamage: remainingDamage,
        wallDamage: damageToWall,
        wallDestroyed: wasDestroyed,
        message: message
    };
}

// --- Проверка блокировки ветряной стеной (ослабление урона) ---
function checkWindWallWeakening(casterType, targetPosition, damage, spellId = null) {
    const spellType = spellId ? getSpellTypeForWalls(spellId) : 'single_target';
    
    // AOE и utility игнорируют стены
    if (spellType === 'aoe' || spellType === 'utility') {
        return { 
            weakened: false, 
            finalDamage: damage,
            reduction: 0,
            message: `${spellType.toUpperCase()} заклинание игнорирует ветряные стены`
        };
    }
    
    // Определяем колонку ветряной стены (та же логика что у земляной)
    let wallColumn;
    if (casterType === 'player') {
        wallColumn = 2; // Стена противника
    } else {
        wallColumn = 3; // Стена игрока
    }
    
    // Ищем ветряную стену
    const windWall = typeof window.findWindWallAt === 'function' ? 
        window.findWindWallAt(wallColumn, targetPosition) : null;
    
    if (!windWall) {
        return { 
            weakened: false, 
            finalDamage: damage,
            reduction: 0,
            message: 'Ветряная стена не найдена'
        };
    }
    
    // Стена ослабляет ТОЛЬКО вражеские заклинания
    if (windWall.casterType === casterType) {
        return { 
            weakened: false, 
            finalDamage: damage,
            reduction: 0,
            message: 'Ветряная стена не влияет на заклинания своих магов'
        };
    }
    
    // Ослабляем урон
    const reductionPercent = windWall.weakenPercent || 30;
    const reduction = Math.floor(damage * reductionPercent / 100);
    const finalDamage = Math.max(1, damage - reduction);
    
    return {
        weakened: true,
        finalDamage: finalDamage,
        reduction: reduction,
        reductionPercent: reductionPercent,
        message: `💨 Ветряная стена ослабляет урон на ${reductionPercent}% (${damage} → ${finalDamage})`
    };
}

// --- Применить урон с учетом всех типов стен ---
function applyDamageWithWallBlocking(caster, target, damage, spellId, casterType, targetPosition) {
    let currentDamage = damage;
    let totalBlocked = 0;
    let messages = [];
    
    // 1. Сначала проверяем земляную стену (полная блокировка)
    const earthWallResult = checkEarthWallBlockage(casterType, targetPosition, currentDamage, spellId);
    
    if (earthWallResult.blocked) {
        messages.push(earthWallResult.message);
        currentDamage = earthWallResult.remainingDamage;
        totalBlocked += earthWallResult.wallDamage;
    }
    
    // 2. Если урон остался, проверяем ветряную стену (ослабление)
    if (currentDamage > 0) {
        const windWallResult = checkWindWallWeakening(casterType, targetPosition, currentDamage, spellId);
        
        if (windWallResult.weakened) {
            messages.push(windWallResult.message);
            currentDamage = windWallResult.finalDamage;
        }
    }
    
    // 3. Применяем финальный урон к цели
    if (currentDamage > 0) {
        target.hp -= currentDamage;
        if (target.hp < 0) target.hp = 0;
    }
    
    // 4. Логируем результаты
    if (messages.length > 0) {
        messages.forEach(message => {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(message);
            }
        });
    }
    
    if (currentDamage > 0 && totalBlocked === 0) {
        // Урон прошел без блокировки
    } else if (currentDamage === 0) {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🛡️ Стены полностью защитили ${target.name}!`);
        }
    } else {
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`⚔️ ${target.name} получает ${currentDamage} урона (после защиты стен)`);
        }
    }
    
    return {
        finalDamage: currentDamage,
        blockedDamage: totalBlocked,
        originalDamage: damage
    };
}

// --- Быстрая проверка: блокируется ли заклинание стенами ---
function isSpellBlockedByWalls(spellId) {
    const spellType = getSpellTypeForWalls(spellId);
    return spellType === 'single_target';
}

// Экспорт функций
window.getSpellTypeForWalls = getSpellTypeForWalls;
window.checkEarthWallBlockage = checkEarthWallBlockage;
window.checkWindWallWeakening = checkWindWallWeakening;
window.applyDamageWithWallBlocking = applyDamageWithWallBlocking;
window.isSpellBlockedByWalls = isSpellBlockedByWalls;

console.log('🎯 Система блокировки стен готова (без конфликтов SPELL_TYPES)');