
// Инициализация
if (!window.activeWalls) window.activeWalls = [];
if (!window.activeEffectZones) window.activeEffectZones = [];

// --- Сброс всех стен ---
function resetWalls() {
    window.activeWalls = [];
    window.activeEffectZones = [];
    if (window.spellAnimations?.fire_tsunami?.clearAll) {
        window.spellAnimations.fire_tsunami.clearAll();
    }
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog('🧱 Все стены сброшены');
    }
}

// --- Создание/обновление ЗЕМЛЯНОЙ стены ---
function createOrUpdateEarthWallWithHP(casterId, casterType, wallColumn, wallRows, wallHP, level) {
    const wallId = `earth_wall_hp_${casterId}_${wallColumn}`;
    
    const existingWallIndex = window.activeWalls.findIndex(wall => 
        wall.id === wallId && wall.type === 'earth_wall_hp'
    );
    
    if (existingWallIndex !== -1) {
        const existingWall = window.activeWalls[existingWallIndex];
        existingWall.rows = [...wallRows];
        existingWall.hp = Math.min(existingWall.hp + wallHP, existingWall.maxHP);
        existingWall.level = level;
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🧱 Земляная стена усилена (${existingWall.hp}/${existingWall.maxHP} HP)`);
        }
    } else {
        const earthWall = {
            id: wallId,
            type: 'earth_wall_hp',
            casterId: casterId,
            casterType: casterType,
            column: wallColumn,
            rows: [...wallRows],
            hp: wallHP,
            maxHP: wallHP,
            level: level,
            createdAt: Date.now()
        };
        
        window.activeWalls.push(earthWall);
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🧱 Создана земляная стена (${wallHP} HP) в колонке ${wallColumn}`);
        }
    }
    
    return true;
}

// --- Нанесение урона земляной стене ---
function damageEarthWall(wallId, damage) {
    const wallIndex = window.activeWalls.findIndex(wall => 
        wall.id === wallId && wall.type === 'earth_wall_hp'
    );
    
    if (wallIndex === -1) return false;
    
    const wall = window.activeWalls[wallIndex];
    const oldHP = wall.hp;
    wall.hp = Math.max(0, wall.hp - damage);
    
    // Обновляем визуальное отображение HP
    if (window.spellAnimations?.earth_wall?.updateHP) {
        const visualWallId = `earth_wall_hp_${wall.casterType}_${wall.column}`;
        window.spellAnimations.earth_wall.updateHP(visualWallId, wall.hp, wall.maxHP);
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`💥 Земляная стена получает ${damage} урона (${wall.hp}/${wall.maxHP} HP)`);
    }
    
    if (wall.hp <= 0) {
        window.activeWalls.splice(wallIndex, 1);
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog('💥 Земляная стена разрушена!');
        }
        return true;
    }
    
    return false;
}

// --- Поиск земляной стены в позиции ---
function findEarthWallAt(column, row) {
    return window.activeWalls.find(wall => 
        wall.type === 'earth_wall_hp' && 
        wall.column === column && 
        wall.rows.includes(row) && 
        wall.hp > 0
    );
}

// --- Создание/обновление ВЕТРЯНОЙ стены ---
function createOrUpdateWindWall(casterType, position, wallSize, weakenPercent, level) {
    const wallId = `wind_wall_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const duration = 4;
    
    const positions = [];
    if (wallSize === 1) {
        positions.push(position);
    } else if (wallSize === 3) {
        positions.push((position - 1 + 5) % 5);
        positions.push(position);
        positions.push((position + 1) % 5);
    } else {
        for (let i = 0; i < 5; i++) {
            positions.push(i);
        }
    }
    
    const windWall = {
        id: wallId,
        type: 'wind_wall',
        casterType: casterType,
        positions: positions,
        weakenPercent: weakenPercent,
        level: level,
        duration: duration,
        turnsLeft: duration
    };
    
    window.activeWalls.push(windWall);
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`💨 Создана ветряная стена (${wallSize} клеток, -${weakenPercent}% урона)`);
    }
    
    return windWall;
}
function findWindWallAt(column, row) {
    return window.activeWalls.find(wall => 
        wall.type === 'wind_wall' && 
        wall.positions && 
        wall.positions.includes(row) &&
        wall.turnsLeft > 0
    );
}
// --- Создание/обновление ОГНЕННОЙ стены ---
function createOrUpdateFireWall(casterId, casterType, casterFaction, centerPosition, baseDamage, level) {
    const wallId = `fire_wall_${casterId}`;
    
    // Удаляем старую стену этого мага (если есть)
    const existingWallIndex = window.activeEffectZones.findIndex(zone => 
        zone.id === wallId && zone.type === 'fire_wall'
    );
    
    if (existingWallIndex !== -1) {
        // Удаляем старую стену
        window.activeEffectZones.splice(existingWallIndex, 1);
        console.log('🔥 Старая огненная стена удалена');
    }
    
    // Определяем новые позиции на основе текущей цели
    const wallSize = level >= 5 ? 5 : 3;
    const positions = [];
    if (wallSize === 3) {
        positions.push((centerPosition - 1 + 5) % 5);
        positions.push(centerPosition);
        positions.push((centerPosition + 1) % 5);
    } else {
        for (let i = 0; i < 5; i++) {
            positions.push(i);
        }
    }
    
    // Всегда создаем новую стену
    const fireWall = {
        id: wallId,
        type: 'fire_wall',
        casterId: casterId,
        casterType: casterType,
        casterFaction: casterFaction,
        positions: positions,
        damage: baseDamage,
        level: level,
        isAOE: true,
        targetSide: casterType === 'player' ? 'enemy' : 'player'
    };
    
    window.activeEffectZones.push(fireWall);
    
    // Создаем визуализацию новой стены
    if (typeof window.createFireWallVisual === 'function') {
        window.createFireWallVisual(casterType, positions, baseDamage, level);
    }
    
    // Немедленный урон при создании
    applyFireWallInstantDamage(casterId, casterType, positions, baseDamage);
    
    return true;
}

// --- Немедленный урон от огненной стены ---
function applyFireWallInstantDamage(casterId, casterType, positions, damage) {
    const caster = findCaster(casterId, casterType);
    
    positions.forEach(pos => {
        let target = null;
        if (casterType === 'player') {
            target = window.enemyFormation[pos];
        } else {
            const wizardId = window.playerFormation[pos];
            if (wizardId) {
                target = window.playerWizards.find(w => w.id === wizardId);
            }
        }
        
        if (target && target.hp > 0) {
            const finalDamage = typeof window.applyFinalDamage === 'function' ?
                window.applyFinalDamage(caster, target, damage, 'fire_wall', 0, true) : damage;

            target.hp -= finalDamage;
            if (target.hp < 0) target.hp = 0;

            if (caster && caster.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                window.tryApplyEffect('burning', target, false);
            }

            if (typeof window.addToBattleLog === 'function') {
                // Многострочный лог как у Искры
                window.addToBattleLog(`🔥 Огненная стена → ${target.name} (${finalDamage} урона)`);
                const damageSteps = target._lastDamageSteps || [];
                if (damageSteps.length > 0) {
                    damageSteps.forEach(step => {
                        window.addToBattleLog(`    ├─ ${step}`);
                    });
                }
                window.addToBattleLog(`    └─ HP: ${target.hp}/${target.max_hp}`);
                delete target._lastDamageSteps;
            }
        }
    });
}

// --- Обработка огненных стен в ход мага ---
function processFireWallsForWizard(wizard, wizardType) {
    if (!window.activeEffectZones || window.activeEffectZones.length === 0) return;
    
    let wizardPosition = -1;
    if (wizardType === 'player') {
        wizardPosition = window.playerFormation.findIndex(id => id === wizard.id);
    } else {
        wizardPosition = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
    }
    
    if (wizardPosition === -1) return;
    
    window.activeEffectZones.forEach(zone => {
        if (zone.type === 'fire_wall') {
            const casterAlive = isCasterAlive(zone.casterId, zone.casterType);
            if (!casterAlive) return;
            
            if (zone.positions.includes(wizardPosition)) {
                const shouldTakeDamage = (zone.casterType === 'player' && wizardType === 'enemy') ||
                                       (zone.casterType === 'enemy' && wizardType === 'player');
                
                if (shouldTakeDamage) {
                    const caster = findCaster(zone.casterId, zone.casterType);
                    const finalDamage = typeof window.applyFinalDamage === 'function' ?
                        window.applyFinalDamage(caster, wizard, zone.damage, 'fire_wall', 0, true) : zone.damage;

                    wizard.hp -= finalDamage;
                    if (wizard.hp < 0) wizard.hp = 0;

                    if (caster && caster.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                        window.tryApplyEffect('burning', wizard, false);
                    }

                    if (typeof window.addToBattleLog === 'function') {
                        // Многострочный лог как у Искры
                        window.addToBattleLog(`🔥 Огненная стена (в ход) → ${wizard.name} (${finalDamage} урона)`);
                        const damageSteps = wizard._lastDamageSteps || [];
                        if (damageSteps.length > 0) {
                            damageSteps.forEach(step => {
                                window.addToBattleLog(`    ├─ ${step}`);
                            });
                        }
                        window.addToBattleLog(`    └─ HP: ${wizard.hp}/${wizard.max_hp}`);
                        delete wizard._lastDamageSteps;
                    }

                    // Логирование смерти от огненной стены
                    if (wizard.hp <= 0 && window.battleLogger) {
                        window.battleLogger.logDeath(wizard, wizardType, 'fire_wall');

                        // Обновляем HP бар и анимация смерти
                        const col = wizardType === 'player' ? 5 : 0;
                        const row = wizardPosition;

                        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                            const key = `${col}_${row}`;
                            window.pixiWizards.updateHP(key, 0, wizard.max_hp);
                        }

                        if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                            const key = `${col}_${row}`;
                            const container = window.wizardSprites?.[key];
                            if (container && !container.deathAnimationStarted) {
                                container.deathAnimationStarted = true;
                                window.pixiWizards.playDeath(col, row);
                                console.log(`🎬 Анимация смерти от огненной стены для ${wizard.name} на ${key}`);
                            }
                        }
                    }

		    if (typeof window.createFireWallDamageEffect === 'function') {
        		// Находим спрайт мага
        		const wizardCol = wizardType === 'player' ? 5 : 0;
        		const wizardSprite = window.wizardSprites?.[`${wizardCol}_${wizardPosition}`];
        		if (wizardSprite) {
        		    window.createFireWallDamageEffect(
        		        wizardSprite.x,
        		        wizardSprite.y,
        		        wizardSprite.hpBarScale || 1
        		    );
        		}
    		    }
                }
            }
        }
    });
}

// --- Вспомогательные функции ---
function isCasterAlive(casterId, casterType) {
    if (casterType === 'player') {
        const wizard = window.playerWizards.find(w => w.id === casterId);
        return wizard && wizard.hp > 0;
    } else {
        const wizard = window.enemyWizards.find(w => w.id === casterId);
        return wizard && wizard.hp > 0;
    }
}

function findCaster(casterId, casterType) {
    if (casterType === 'player') {
        return window.playerWizards.find(w => w.id === casterId);
    } else {
        return window.enemyWizards.find(w => w.id === casterId);
    }
}


// --- Создание зоны "Горящая земля" ---
function createFireGround(casterId, casterType, column, row, damage, duration = 1) {
    const zoneId = `fire_ground_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const fireGround = {
        id: zoneId,
        type: 'fire_ground',
        casterId: casterId,
        casterType: casterType,
        column: column,
        row: row, // можно и всю колонку — но пока по клеткам
        damage: damage,
        duration: duration,
        turnsLeft: duration,
        createdAt: Date.now()
    };
    
    if (!window.activeEffectZones) window.activeEffectZones = [];
    window.activeEffectZones.push(fireGround);
    
    return fireGround;
}

// --- Обработка зон "Горящая земля" ---
function processFireGroundZones() {
    if (!window.activeEffectZones) return;
    
    for (let i = window.activeEffectZones.length - 1; i >= 0; i--) {
        const zone = window.activeEffectZones[i];
        if (zone.type === 'fire_ground') {
            // Проверяем, есть ли маг в этой клетке
            let targetWizard = null;
            let targetType = null;
            
            // Проверяем магов игрока
            if (zone.column === 5) {
                const wizardId = window.playerFormation[zone.row];
                if (wizardId) {
                    targetWizard = window.playerWizards.find(w => w.id === wizardId);
                    targetType = 'player';
                }
            }
            // Проверяем магов противника
            else if (zone.column === 0) {
                targetWizard = window.enemyFormation[zone.row];
                targetType = 'enemy';
            }
            // Призванные — пока не обрабатываем (если нужно — добавим)
            
            if (targetWizard && targetWizard.hp > 0) {
                const caster = findCaster(zone.casterId, zone.casterType);
                const finalDamage = typeof window.applyFinalDamage === 'function' ?
                    window.applyFinalDamage(caster, targetWizard, zone.damage, 'fire_ground', 0, true) : zone.damage;

                targetWizard.hp -= finalDamage;
                if (targetWizard.hp < 0) targetWizard.hp = 0;

                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🔥 ${targetWizard.name} получает ${finalDamage} урона от Горящей земли (${targetWizard.hp}/${targetWizard.max_hp})`);
                }

                // Логирование смерти от горящей земли
                if (targetWizard.hp <= 0 && window.battleLogger) {
                    window.battleLogger.logDeath(targetWizard, targetType, 'fire_ground');

                    // Обновляем HP бар и анимация смерти
                    const col = zone.column;
                    const row = zone.row;

                    if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                        const key = `${col}_${row}`;
                        window.pixiWizards.updateHP(key, 0, targetWizard.max_hp);
                    }

                    if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                        const key = `${col}_${row}`;
                        const container = window.wizardSprites?.[key];
                        if (container && !container.deathAnimationStarted) {
                            container.deathAnimationStarted = true;
                            window.pixiWizards.playDeath(col, row);
                            console.log(`🎬 Анимация смерти от горящей земли для ${targetWizard.name} на ${key}`);
                        }
                    }
                }

                // Эффект горения от фракции Огонь
                if (caster && caster.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                    window.tryApplyEffect('burning', targetWizard, false);
                }
            }
            
            // Уменьшаем срок жизни
            zone.turnsLeft--;
            if (zone.turnsLeft <= 0) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌫️ Горящая земля в [${zone.row}][${zone.column}] исчезает`);
                }
                window.activeEffectZones.splice(i, 1);
            }
        }
    }
}

// --- Обработка Цунами в ход кастера ---
function processTsunamisForCaster(caster, casterType) {
    if (!window.activeTsunamis) return;
    
    const tsunamis = window.activeTsunamis.filter(ts => 
        ts.casterId === caster.id && ts.isActive
    );
    
    tsunamis.forEach(tsunami => {
        // ДОБАВИТЬ: Пропускаем первый ход после создания
        if (tsunami.justCreated) {
            tsunami.justCreated = false;
            return; // Не двигаем в первый ход
        }
        
        // Если уровень 5 — создаём горящую землю ПЕРЕД движением
        if (tsunami.level === 5) {
            createFireGroundForTsunami(tsunami);
        }
        
        // Определяем следующую колонку
        let nextColumn;
        if (casterType === 'player') {
            nextColumn = tsunami.currentColumn === 0 ? 1 : (tsunami.currentColumn === 1 ? 2 : 0);
        } else {
            nextColumn = tsunami.currentColumn === 5 ? 4 : (tsunami.currentColumn === 4 ? 3 : 5);
        }
        
        // Сдвигаем волну
        tsunami.currentColumn = nextColumn;
        
        if (window.spellAnimations?.fire_tsunami?.move) {
            window.spellAnimations.fire_tsunami.move(tsunami.id, nextColumn);
        }
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌊 Цунами ${caster.name} перемещается в колонку ${nextColumn}`);
        }
        
        // Применяем урон в новой колонке
        applyTsunamiDamage(tsunami);
    });
}

// --- Нанесение урона Цунами в текущей колонке ---
function applyTsunamiDamage(tsunami) {
    const column = tsunami.currentColumn;
    const caster = findCaster(tsunami.casterId, tsunami.casterType);
    
    if (!caster) return;
    
    for (let row = 0; row < 5; row++) {
        let targetWizard = null;
        let isSummoned = false;
        
        // Маги
        if (column === 0 && tsunami.casterType === 'player') {
            targetWizard = window.enemyFormation[row];
        } else if (column === 5 && tsunami.casterType === 'enemy') {
            const wizardId = window.playerFormation[row];
            if (wizardId) {
                targetWizard = window.playerWizards.find(w => w.id === wizardId);
            }
        }
        // Призванные
        else if (column === 1 || column === 4) {
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(column, row);
                if (summoned && summoned.hp > 0) {
                    targetWizard = summoned;
                    isSummoned = true;
                }
            }
        }
        // Стены/эффекты — пока не цели
        
        if (targetWizard && targetWizard.hp > 0) {
            const finalDamage = typeof window.applyFinalDamage === 'function' ?
                window.applyFinalDamage(caster, targetWizard, tsunami.damage, 'fire_tsunami', 0, true) : tsunami.damage;

            targetWizard.hp -= finalDamage;
            if (targetWizard.hp < 0) targetWizard.hp = 0;

            if (typeof window.logSpellHit === 'function') {
                window.logSpellHit(caster, targetWizard, finalDamage, 'Огненное цунами');
            } else if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌊 ${targetWizard.name} получает ${finalDamage} урона от Цунами (${targetWizard.hp}/${targetWizard.max_hp})`);
            }

            // Логирование смерти от цунами
            if (targetWizard.hp <= 0 && window.battleLogger) {
                // Определяем тип для логирования
                const targetType = isSummoned ? 'summoned' : (column === 0 || column === 1 ? 'enemy' : 'player');
                window.battleLogger.logDeath(targetWizard, targetType, 'fire_tsunami');

                // Анимация смерти только для обычных магов (не призванных)
                if (!isSummoned) {
                    const col = column;
                    const wizardRow = row;

                    if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                        const key = `${col}_${wizardRow}`;
                        window.pixiWizards.updateHP(key, 0, targetWizard.max_hp);
                    }

                    if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                        const key = `${col}_${wizardRow}`;
                        const container = window.wizardSprites?.[key];
                        if (container && !container.deathAnimationStarted) {
                            container.deathAnimationStarted = true;
                            window.pixiWizards.playDeath(col, wizardRow);
                            console.log(`🎬 Анимация смерти от цунами для ${targetWizard.name} на ${key}`);
                        }
                    }
                }
            }

            // Эффект горения для фракции Огонь
            if (caster.faction === 'fire' && typeof window.tryApplyEffect === 'function') {
                window.tryApplyEffect('burning', targetWizard, false);
            }
        }
    }
}

// --- Создание горящей земли при уходе Цунами (только 5 уровень) ---
function createFireGroundForTsunami(tsunami) {
    const column = tsunami.currentColumn;
    const caster = findCaster(tsunami.casterId, tsunami.casterType);
    
    if (!caster) return;
    
    // Создаём зону в КАЖДОЙ клетке текущей колонки
    for (let row = 0; row < 5; row++) {
        // Игровая логика - зона урона
        window.createFireGround(tsunami.casterId, tsunami.casterType, column, row, 15, 1);
        
        // ДОБАВИТЬ: Визуальная анимация горящей земли
        if (window.burningGround?.create) {
            window.burningGround.create(column, row, 1);
        }
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌋 За Цунами остаётся Горящая земля в колонке ${column}`);
    }
}

function processFireGroundForWizard(wizard, wizardPosition, wizardType) {
    if (!window.activeEffectZones) return;

    const wizardColumn = wizardType === 'player' ? 5 : 0;

    const fireGround = window.activeEffectZones.find(zone =>
        zone.type === 'fire_ground' &&
        zone.column === wizardColumn &&
        zone.row === wizardPosition
    );

    if (fireGround) {
        const caster = findCaster(fireGround.casterId, fireGround.casterType);
        const finalDamage = typeof window.applyFinalDamage === 'function' ?
            window.applyFinalDamage(caster, wizard, fireGround.damage, 'fire_ground', 0, true) : fireGround.damage;

        wizard.hp -= finalDamage;
        if (wizard.hp < 0) wizard.hp = 0;

        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🔥 ${wizard.name} получает ${finalDamage} урона от Горящей земли в начале хода (${wizard.hp}/${wizard.max_hp})`);
        }

        // Логирование смерти от горящей земли
        if (wizard.hp <= 0 && window.battleLogger) {
            window.battleLogger.logDeath(wizard, wizardType, 'fire_ground');

            // Обновляем HP бар и анимация смерти
            const col = wizardColumn;
            const row = wizardPosition;

            if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                const key = `${col}_${row}`;
                window.pixiWizards.updateHP(key, 0, wizard.max_hp);
            }

            if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                const key = `${col}_${row}`;
                const container = window.wizardSprites?.[key];
                if (container && !container.deathAnimationStarted) {
                    container.deathAnimationStarted = true;
                    window.pixiWizards.playDeath(col, row);
                    console.log(`🎬 Анимация смерти от горящей земли для ${wizard.name} на ${key}`);
                }
            }
        }
    }
}

window.processFireGroundForWizard = processFireGroundForWizard;

// --- Создание зоны "Снежная буря" ---
function createBlizzardZone(casterId, casterType, centerRow, radius, interruptChance, level) {
    const zoneId = `blizzard_${casterId}_${Date.now()}`;
    
    // Определяем колонку — только колонка магов противника
    const targetColumn = casterType === 'player' ? 0 : 5;
    
    // Определяем затронутые ряды (кольцо 0–4)
    const affectedRows = [];
    if (radius === 1) {
        // 3 клетки: центр ±1
        affectedRows.push((centerRow - 1 + 5) % 5);
        affectedRows.push(centerRow);
        affectedRows.push((centerRow + 1) % 5);
    } else {
        // 5 клеток: все ряды
        for (let i = 0; i < 5; i++) affectedRows.push(i);
    }
    
    const blizzard = {
        id: zoneId,
        type: 'blizzard_zone',
        casterId: casterId,
        casterType: casterType,
        casterFaction: null, // заполним позже
        column: targetColumn,
        rows: affectedRows,
        interruptChance: interruptChance,
        level: level,
        isActive: true,
        createdAt: Date.now()
    };
    
    if (!window.activeEffectZones) window.activeEffectZones = [];
    window.activeEffectZones.push(blizzard);
    
    return blizzard;
}

// --- Проверка, находится ли маг в зоне Снежной бури ---
function isWizardInBlizzard(wizard, wizardType) {
    if (!window.activeEffectZones) return null;
    
    // Находим позицию мага
    let wizardPosition = -1;
    if (wizardType === 'player') {
        wizardPosition = window.playerFormation.findIndex(id => id === wizard.id);
    } else {
        wizardPosition = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
    }
    
    if (wizardPosition === -1) return null;
    
    // Ищем активную зону бури, которая накрывает эту позицию
    return window.activeEffectZones.find(zone => 
        zone.type === 'blizzard_zone' && 
        zone.isActive && 
        ((zone.casterType === 'player' && wizardType === 'enemy') || 
         (zone.casterType === 'enemy' && wizardType === 'player')) &&
        zone.column === (wizardType === 'enemy' ? 0 : 5) &&
        zone.rows.includes(wizardPosition)
    );
}

// --- Обработка Снежных бурь в ход кастера ---
function processBlizzardsForCaster(caster, casterType) {
    if (!window.activeEffectZones) return;
    
    const blizzards = window.activeEffectZones.filter(zone => 
        zone.type === 'blizzard_zone' && 
        zone.casterId === caster.id
    );
    
    blizzards.forEach(zone => {
        // Обновляем фракцию кастера (на случай, если изменилась)
        zone.casterFaction = caster.faction;
        
        // Если кастер мёртв — деактивируем зону
        if (caster.hp <= 0) {
            zone.isActive = false;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`❄️ Снежная буря ${caster.name} исчезает (кастер погиб)`);
            }
        }
    });
}

// --- Создание зоны "Абсолютный Ноль" ---
function createOrUpdateAbsoluteZeroZone(casterId, casterType, damage, interruptChance, level) {
    const zoneId = `absolute_zero_${casterId}`;
    
    // 🔥 КАК У ОГНЕННОЙ СТЕНЫ: Удаляем старую зону этого кастера
    const existingZoneIndex = window.activeEffectZones.findIndex(zone => 
        zone.id === zoneId && zone.type === 'absolute_zero_zone'
    );
    
    if (existingZoneIndex !== -1) {
        console.log(`❄️ Обновление существующей зоны Абсолютного Ноля: ${zoneId}`);
        
        // Удаляем старую визуализацию
        if (window.spellAnimations?.absolute_zero?.remove) {
            window.spellAnimations.absolute_zero.remove(casterId);
        }
        
        // Удаляем зону из массива
        window.activeEffectZones.splice(existingZoneIndex, 1);
    }
    
    // Определяем колонки территории противника
    const columns = casterType === 'player' ? [0, 1, 2] : [3, 4, 5];
    
    // Создаём НОВУЮ зону
    const absoluteZero = {
        id: zoneId,
        type: 'absolute_zero_zone',
        casterId: casterId,
        casterType: casterType,
        casterFaction: null, // заполним при первом использовании
        columns: columns,
        damage: damage,
        interruptChance: interruptChance,
        level: level,
        isActive: true,
        createdAt: Date.now()
    };
    
    if (!window.activeEffectZones) window.activeEffectZones = [];
    window.activeEffectZones.push(absoluteZero);
    
    console.log(`❄️ Создана зона Абсолютного Ноля: кастер ${casterId}, урон ${damage}, прерывание ${interruptChance}%`);
    
    return absoluteZero;
}


// --- Проверка, находится ли маг в зоне Абсолютного Ноля ---
function isWizardInAbsoluteZero(wizard, wizardType) {
    if (!window.activeEffectZones) return null;
    
    // Находим позицию мага
    let wizardPosition = -1;
    if (wizardType === 'player') {
        wizardPosition = window.playerFormation.findIndex(id => id === wizard.id);
    } else {
        wizardPosition = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
    }
    
    if (wizardPosition === -1) return null;
    
    // Ищем активную зону Абсолютного Ноля, которая накрывает эту позицию
    return window.activeEffectZones.find(zone => 
        zone.type === 'absolute_zero_zone' && 
        zone.isActive && 
        ((zone.casterType === 'player' && wizardType === 'enemy') || 
         (zone.casterType === 'enemy' && wizardType === 'player')) &&
        zone.columns.includes(wizardType === 'enemy' ? 0 : 5) // маги в 0 или 5
    );
}

// --- Нанесение урона от Абсолютного Ноля в начале хода ---
function applyAbsoluteZeroDamage() {
    if (!window.activeEffectZones) return;
    
    window.activeEffectZones.forEach(zone => {
        if (zone.type !== 'absolute_zero_zone' || !zone.isActive) return;
        
        const caster = findCaster(zone.casterId, zone.casterType);
        if (!caster) return;
        
        // Обновляем фракцию
        zone.casterFaction = caster.faction;
        
        // Обрабатываем магов
        for (let row = 0; row < 5; row++) {
            // Маги противника
            if (zone.casterType === 'player') {
                const targetWizard = window.enemyFormation[row];
                if (targetWizard && targetWizard.hp > 0) {
                    applyAbsoluteZeroDamageToTarget(caster, targetWizard, zone, 'enemy', row);
                }
            } else {
                const wizardId = window.playerFormation[row];
                if (wizardId) {
                    const targetWizard = window.playerWizards.find(w => w.id === wizardId);
                    if (targetWizard && targetWizard.hp > 0) {
                        applyAbsoluteZeroDamageToTarget(caster, targetWizard, zone, 'player', row);
                    }
                }
            }

            // Призванные существа (колонки 1 и 4)
            const summonCol = zone.casterType === 'player' ? 1 : 4;
            if (typeof window.findSummonedCreatureAt === 'function') {
                const summoned = window.findSummonedCreatureAt(summonCol, row);
                if (summoned && summoned.hp > 0) {
                    applyAbsoluteZeroDamageToTarget(caster, summoned, zone, 'summon', row);
                }
            }
        }
    });
}

// --- Применение урона от Абсолютного Ноля к цели (переименовано во избежание конфликта с core.js) ---
function applyAbsoluteZeroDamageToTarget(caster, target, zone, targetType, row) {
    const finalDamage = typeof window.applyFinalDamage === 'function' ?
        window.applyFinalDamage(caster, target, zone.damage, 'absolute_zero', 0, true) : zone.damage;

    target.hp -= finalDamage;
    if (target.hp < 0) target.hp = 0;

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`❄️ ${target.name} получает ${finalDamage} урона от Абсолютного Ноля (${target.hp}/${target.max_hp})`);
    }

    // Логирование смерти от абсолютного ноля
    if (target.hp <= 0 && window.battleLogger) {
        window.battleLogger.logDeath(target, targetType, 'absolute_zero');

        // Анимация смерти только для обычных магов (не призванных)
        if (targetType === 'player' || targetType === 'enemy') {
            const col = targetType === 'player' ? 5 : 0;

            // Запускаем анимацию смерти напрямую (без проверки wizardSprites)
            if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                // Помечаем цель как мёртвую чтобы избежать повторной анимации
                if (!target.deathAnimationStarted) {
                    target.deathAnimationStarted = true;
                    window.pixiWizards.playDeath(col, row);
                    console.log(`🎬 Анимация смерти от Абсолютного Ноля: ${target.name} [${col},${row}]`);
                }
            }
        }
    }

    // Сохраняем зону в цели для последующей проверки перед кастом
    if (!target.affectedBy) target.affectedBy = [];
    if (!target.affectedBy.includes('absolute_zero')) {
        target.affectedBy.push('absolute_zero');
        target.absoluteZeroZone = zone; // ссылка на зону
    }
}

// --- Обработка Абсолютного Ноля для конкретного мага (вызывается в его ход) ---
function processAbsoluteZeroForWizard(wizard, position, wizardType) {
    if (!window.activeEffectZones) return { died: false };

    // Находим активную зону Абсолютного Ноля, которая накрывает этого мага
    const zone = window.activeEffectZones.find(z =>
        z.type === 'absolute_zero_zone' &&
        z.isActive &&
        ((z.casterType === 'player' && wizardType === 'enemy') ||
         (z.casterType === 'enemy' && wizardType === 'player'))
    );

    if (!zone) return { died: false };

    // Находим кастера
    const caster = findCaster(zone.casterId, zone.casterType);
    if (!caster || caster.hp <= 0) {
        zone.isActive = false;
        return { died: false };
    }

    // Наносим урон
    const finalDamage = typeof window.applyFinalDamage === 'function' ?
        window.applyFinalDamage(caster, wizard, zone.damage, 'absolute_zero', 0, true) : zone.damage;

    wizard.hp -= finalDamage;
    if (wizard.hp < 0) wizard.hp = 0;

    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`❄️ ${wizard.name} получает ${finalDamage} урона от Абсолютного Ноля (${wizard.hp}/${wizard.max_hp})`);
    }

    // Проверяем смерть
    if (wizard.hp <= 0) {
        if (window.battleLogger) {
            window.battleLogger.logDeath(wizard, wizardType, 'absolute_zero');
        }

        // Анимация смерти
        const col = wizardType === 'player' ? 5 : 0;
        if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
            if (!wizard.deathAnimationStarted) {
                wizard.deathAnimationStarted = true;
                window.pixiWizards.playDeath(col, position);
            }
        }

        return { died: true };
    }

    return { died: false, zone: zone };
}

// --- Проверка прерывания каста от Абсолютного Ноля ---
function checkAbsoluteZeroInterrupt(wizard, wizardType) {
    if (!window.activeEffectZones) return false;

    // Находим активную зону Абсолютного Ноля
    const zone = window.activeEffectZones.find(z =>
        z.type === 'absolute_zero_zone' &&
        z.isActive &&
        ((z.casterType === 'player' && wizardType === 'enemy') ||
         (z.casterType === 'enemy' && wizardType === 'player'))
    );

    if (!zone) return false;

    // Проверяем шанс прерывания
    const roll = Math.random() * 100;
    if (roll < zone.interruptChance) {
        return true; // Прервано!
    }

    return false;
}

// --- Обработка всех стен ---
function processWalls() {
    processEffectZones();
    
    if (!window.activeWalls || window.activeWalls.length === 0) return;
    
    for (let i = window.activeWalls.length - 1; i >= 0; i--) {
        const wall = window.activeWalls[i];
        wall.turnsLeft--;
        if (wall.turnsLeft <= 0) {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🧱 ${wall.type} исчезает`);
            }
            window.activeWalls.splice(i, 1);
        }
    }
    
    cleanupDeadCasterWalls();
}

function processEffectZones() {
    // Абсолютный Ноль теперь обрабатывается в ход каждого мага (processAbsoluteZeroForWizard)

    if (!window.activeEffectZones || window.activeEffectZones.length === 0) return;
    
    for (let i = window.activeEffectZones.length - 1; i >= 0; i--) {
        const zone = window.activeEffectZones[i];
        
        // Пропускаем fire_ground — обрабатывается в processFireGroundZones
        if (zone.type === 'fire_ground') {
            continue;
        }
        
        // Обработка огненных стен
        if (zone.type === 'fire_wall') {
            const casterAlive = isCasterAlive(zone.casterId, zone.casterType);
            if (!casterAlive) {
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog('🔥 Огненная стена исчезает после смерти кастера');
                }
                window.activeEffectZones.splice(i, 1);
            }
        }
    }
}

function cleanupDeadCasterWalls() {
    if (!window.activeEffectZones) return;
    for (let i = window.activeEffectZones.length - 1; i >= 0; i--) {
        const zone = window.activeEffectZones[i];
        if (zone.type === 'fire_wall') {
            const casterAlive = isCasterAlive(zone.casterId, zone.casterType);
            if (!casterAlive) {
                window.activeEffectZones.splice(i, 1);
            }
        }
    }
}

// Экспорт
window.resetWalls = resetWalls;
window.createOrUpdateEarthWallWithHP = createOrUpdateEarthWallWithHP;
window.damageEarthWall = damageEarthWall;
window.findEarthWallAt = findEarthWallAt;
window.createOrUpdateWindWall = createOrUpdateWindWall;
window.createOrUpdateFireWall = createOrUpdateFireWall;
window.processFireWallsForWizard = processFireWallsForWizard;
window.processWalls = processWalls;
window.processEffectZones = processEffectZones;
window.cleanupDeadCasterWalls = cleanupDeadCasterWalls;
window.createFireGround = createFireGround;
window.processFireGroundZones = processFireGroundZones;
window.processTsunamisForCaster = processTsunamisForCaster;
window.applyTsunamiDamage = applyTsunamiDamage;
window.createFireGroundForTsunami = createFireGroundForTsunami;
window.createBlizzardZone = createBlizzardZone;
window.isWizardInBlizzard = isWizardInBlizzard;
window.processBlizzardsForCaster = processBlizzardsForCaster;
window.createOrUpdateAbsoluteZeroZone = createOrUpdateAbsoluteZeroZone;
window.isWizardInAbsoluteZero = isWizardInAbsoluteZero;
window.applyAbsoluteZeroDamage = applyAbsoluteZeroDamage;
window.applyAbsoluteZeroDamageToTarget = applyAbsoluteZeroDamageToTarget;
window.processAbsoluteZeroForWizard = processAbsoluteZeroForWizard;
window.checkAbsoluteZeroInterrupt = checkAbsoluteZeroInterrupt;
window.findWindWallAt = findWindWallAt;