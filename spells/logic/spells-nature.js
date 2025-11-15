// battle/spells/spells-nature.js - Заклинания школы Природа
console.log('✅ battle/spells/spells-nature.js загружен');

function castNatureSpell(wizard, spellId, spellData, position, casterType) {
    console.log(`🌿 Casting nature spell: ${spellId}`);
    
    switch (spellId) {
        case 'call_wolf':
            castCallWolf(wizard, spellData, position, casterType);
            break;
        case 'bark_armor':
            castBarkArmor(wizard, spellData, position, casterType);
            break;
        case 'leaf_canopy':
            // Не применяется в бою — только для UI
            console.log('🍃 Покров листвы — применяется автоматически в начале боя');
            break;
	case 'ent':
	    castEnt(wizard, spellData, position, casterType);
	    break;
	case 'meteorokinesis':
	    // НЕ применяется в бою — только в начале
	    console.log('🌿 Метеокинез — уже активен с начала боя');
	    break;
        default:
            console.log(`⚠️ Заклинание природы ${spellId} не реализовано`);
            if (typeof window.castBasicAttack === 'function') {
                window.castBasicAttack(wizard, position, casterType);
            }
    }
}

function castCallWolf(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // Используем менеджер призванных существ
    const wolf = window.createWolfSummon(wizard, casterType, position, level);
    
    if (!wolf) {
        console.error('Не удалось создать/восстановить волка');
        return;
    }
    
    // Волк атакует сразу после призыва/восстановления
    performWolfAttack(wolf, wizard);
    
    // Применяем бонус фракции
    applyNatureFactionBonus(wizard, casterType);
}

// Модифицированная функция атаки волка
function performWolfAttack(wolf, caster) {
    if (!wolf || wolf.hp <= 0) return;
    
    const target = typeof window.findTarget === 'function' ? 
        window.findTarget(wolf.position, wolf.casterType) : null;
    
    if (target) {
        // Анимация атаки (если визуал есть)
        const visual = window.summonsManager?.visuals.get(wolf.id);
        if (visual) {
            const targetSprite = window.wizardSprites?.[`${target.column || 0}_${target.position}`];
            if (targetSprite) {
                window.summonsManager.playAttackAnimation(
                    wolf.id, 
                    targetSprite.x, 
                    targetSprite.y
                );
            }
        }
        
        // Применяем урон основной цели
        const finalDamage = typeof window.applyFinalDamage === 'function' ? 
            window.applyFinalDamage(caster, target.wizard, wolf.damage, 'wolf_attack', 0, false) : wolf.damage;
            
        target.wizard.hp -= finalDamage;
        if (target.wizard.hp < 0) target.wizard.hp = 0;
        
        // ✅ ОБНОВЛЯЕМ ВИЗУАЛЬНЫЙ HP БАР
        if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
            const targetCol = target.column !== undefined ? target.column : (wolf.casterType === 'player' ? 0 : 5);
            const targetRow = target.position;
            const key = `${targetCol}_${targetRow}`;
            window.pixiWizards.updateHP(key, target.wizard.hp, target.wizard.max_hp);
            console.log(`💚 Обновлен HP бар после атаки волка: ${key} → ${target.wizard.hp}/${target.wizard.max_hp}`);
        }
        
        // ✅ ПРОВЕРКА СМЕРТИ И АНИМАЦИЯ
        if (target.wizard.hp <= 0) {
            console.log(`💀 ${target.wizard.name} убит волком!`);
            
            // Запускаем анимацию смерти
            if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                const targetCol = target.column !== undefined ? target.column : (wolf.casterType === 'player' ? 0 : 5);
                const targetRow = target.position;
                const key = `${targetCol}_${targetRow}`;
                
                // Проверяем что анимация еще не запущена
                const container = window.wizardSprites?.[key];
                if (container && !container.deathAnimationStarted) {
                    container.deathAnimationStarted = true;
                    window.pixiWizards.playDeath(targetCol, targetRow);
                    console.log(`🎬 Запущена анимация смерти для ${target.wizard.name} на позиции ${key}`);
                }
            }
        }
        
        // Логирование основной атаки
        if (typeof window.logSpellHit === 'function') {
            const bonuses = [];
            if (wolf.level) bonuses.push(`Ур.${wolf.level}`);
            if (caster.name !== wolf.name) bonuses.push(`от ${caster.name}`);
            window.logSpellHit(wolf, target.wizard, finalDamage, 'Укус волка', bonuses);
        } else if (typeof window.addToBattleLogWithIndent === 'function') {
            window.addToBattleLogWithIndent(`🐺 Волк ${caster.name} кусает ${target.wizard.name} (${finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp} HP)`);
        } else if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🐺 Волк атакует ${target.wizard.name} (${finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp})`);
        }
        
        // Эффект 5 уровня: 80% урона по бокам
        if (wolf.level === 5) {
            const baseSplashDamage = Math.floor(wolf.damage * 0.8);
            
            const leftPos = (target.position - 1 + 5) % 5;
            const rightPos = (target.position + 1) % 5;
            
            // ===== АТАКА ПО ЛЕВОМУ СОСЕДУ =====
            const leftTarget = findTargetAtSimplePosition(leftPos, wolf.casterType);
            if (leftTarget) {
                const leftFinalDamage = typeof window.applyFinalDamage === 'function' ? 
                    window.applyFinalDamage(caster, leftTarget.wizard, baseSplashDamage, 'wolf_splash', 0, true) : baseSplashDamage;
                
                leftTarget.wizard.hp -= leftFinalDamage;
                if (leftTarget.wizard.hp < 0) leftTarget.wizard.hp = 0;
                
                // ✅ ОБНОВЛЯЕМ HP БАР ЛЕВОЙ ЦЕЛИ
                if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                    const leftCol = leftTarget.column !== undefined ? leftTarget.column : (wolf.casterType === 'player' ? 0 : 5);
                    const leftKey = `${leftCol}_${leftPos}`;
                    window.pixiWizards.updateHP(leftKey, leftTarget.wizard.hp, leftTarget.wizard.max_hp);
                    console.log(`💚 Обновлен HP бар после splash урона: ${leftKey} → ${leftTarget.wizard.hp}/${leftTarget.wizard.max_hp}`);
                }
                
                // ✅ ПРОВЕРКА СМЕРТИ И АНИМАЦИЯ
                if (leftTarget.wizard.hp <= 0) {
                    console.log(`💀 ${leftTarget.wizard.name} убит splash уроном волка!`);
                    
                    // Запускаем анимацию смерти
                    if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                        const leftCol = leftTarget.column !== undefined ? leftTarget.column : (wolf.casterType === 'player' ? 0 : 5);
                        const leftKey = `${leftCol}_${leftPos}`;
                        
                        const container = window.wizardSprites?.[leftKey];
                        if (container && !container.deathAnimationStarted) {
                            container.deathAnimationStarted = true;
                            window.pixiWizards.playDeath(leftCol, leftPos);
                            console.log(`🎬 Запущена анимация смерти для ${leftTarget.wizard.name} (splash)`);
                        }
                    }
                }
                
                // Логирование
                if (typeof window.logSpellHit === 'function') {
                    window.logSpellHit(wolf, leftTarget.wizard, leftFinalDamage, 'Боковой удар волка', ['АоЕ']);
                } else if (typeof window.addToBattleLogWithIndent === 'function') {
                    window.addToBattleLogWithIndent(`  ↗ Волк задевает ${leftTarget.wizard.name} (${leftFinalDamage} урона) (${leftTarget.wizard.hp}/${leftTarget.wizard.max_hp} HP)`);
                } else if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🐺 Волк наносит урон по бокам: ${leftTarget.wizard.name} (${leftFinalDamage} урона)`);
                }
            }
            
            // ===== АТАКА ПО ПРАВОМУ СОСЕДУ =====
            const rightTarget = findTargetAtSimplePosition(rightPos, wolf.casterType);
            if (rightTarget) {
                const rightFinalDamage = typeof window.applyFinalDamage === 'function' ? 
                    window.applyFinalDamage(caster, rightTarget.wizard, baseSplashDamage, 'wolf_splash', 0, true) : baseSplashDamage;
                
                rightTarget.wizard.hp -= rightFinalDamage;
                if (rightTarget.wizard.hp < 0) rightTarget.wizard.hp = 0;
                
                // ✅ ОБНОВЛЯЕМ HP БАР ПРАВОЙ ЦЕЛИ
                if (window.pixiWizards && typeof window.pixiWizards.updateHP === 'function') {
                    const rightCol = rightTarget.column !== undefined ? rightTarget.column : (wolf.casterType === 'player' ? 0 : 5);
                    const rightKey = `${rightCol}_${rightPos}`;
                    window.pixiWizards.updateHP(rightKey, rightTarget.wizard.hp, rightTarget.wizard.max_hp);
                    console.log(`💚 Обновлен HP бар после splash урона: ${rightKey} → ${rightTarget.wizard.hp}/${rightTarget.wizard.max_hp}`);
                }
                
                // ✅ ПРОВЕРКА СМЕРТИ И АНИМАЦИЯ
                if (rightTarget.wizard.hp <= 0) {
                    console.log(`💀 ${rightTarget.wizard.name} убит splash уроном волка!`);
                    
                    // Запускаем анимацию смерти
                    if (window.pixiWizards && typeof window.pixiWizards.playDeath === 'function') {
                        const rightCol = rightTarget.column !== undefined ? rightTarget.column : (wolf.casterType === 'player' ? 0 : 5);
                        const rightKey = `${rightCol}_${rightPos}`;
                        
                        const container = window.wizardSprites?.[rightKey];
                        if (container && !container.deathAnimationStarted) {
                            container.deathAnimationStarted = true;
                            window.pixiWizards.playDeath(rightCol, rightPos);
                            console.log(`🎬 Запущена анимация смерти для ${rightTarget.wizard.name} (splash)`);
                        }
                    }
                }
                
                // Логирование
                if (typeof window.logSpellHit === 'function') {
                    window.logSpellHit(wolf, rightTarget.wizard, rightFinalDamage, 'Боковой удар волка', ['АоЕ']);
                } else if (typeof window.addToBattleLogWithIndent === 'function') {
                    window.addToBattleLogWithIndent(`  ↘ Волк задевает ${rightTarget.wizard.name} (${rightFinalDamage} урона) (${rightTarget.wizard.hp}/${rightTarget.wizard.max_hp} HP)`);
                } else if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🐺 Волк наносит урон по бокам: ${rightTarget.wizard.name} (${rightFinalDamage} урона)`);
                }
            }
            
            // Логирование общего эффекта сплеша
            if ((leftTarget || rightTarget) && typeof window.addToBattleLogWithIndent === 'function') {
                window.addToBattleLogWithIndent(`  💥 Волк 5-го уровня атакует с размахом!`);
            }
        }
    }
}



// --- Древесная кора (Bark Armor) - Тир 2, Buff ---
function castBarkArmor(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // Бонус брони по уровням
    const armorBonus = [5, 10, 15, 20, 30];
    const bonus = armorBonus[Math.min(level, 5) - 1] || 5;
    
    // Проверяем, есть ли уже эффект коры
    const hadBarkBefore = wizard.armorBonuses?.bark_armor > 0;
    
    // Используем систему множественных источников бонусов
    if (!wizard.armorBonuses) wizard.armorBonuses = {};
    wizard.armorBonuses.bark_armor = bonus; // Обновляем только бонус от коры
    
    // Пересчитываем общий бонус
    wizard.armorBonus = 0;
    for (const source in wizard.armorBonuses) {
        wizard.armorBonus += wizard.armorBonuses[source];
    }
    
    // Рассчитываем текущую броню (для лога)
    const currentArmor = (wizard.armor || 0) + wizard.armorBonus;
    
    // Запускаем анимацию
    if (window.spellAnimations?.bark_armor?.play) {
        // Если эффект уже был - обновляем его визуально
        if (hadBarkBefore && window.spellAnimations.bark_armor.refresh) {
            window.spellAnimations.bark_armor.refresh(casterType, position, level);
        } else {
            // Новое наложение
            window.spellAnimations.bark_armor.play({
                casterType: casterType,
                casterPosition: position,
                targetWizard: wizard,
                level: level,
                onComplete: () => {
                    console.log('🌳 Анимация Древесной коры завершена');
                }
            });
        }
    }
    
    // Добавляем визуальный индикатор на мага
    if (!wizard.visualEffects) wizard.visualEffects = {};
    wizard.visualEffects.bark_armor = {
        level: level,
        bonus: bonus,
        active: true
    };
    
    if (typeof window.addToBattleLog === 'function') {
        if (hadBarkBefore) {
            window.addToBattleLog(`🛡️ ${wizard.name} обновляет Древесную кору! +${bonus} брони (итого: ${currentArmor})`);
        } else {
            window.addToBattleLog(`🛡️ ${wizard.name} покрывается Древесной корой! +${bonus} брони (итого: ${currentArmor})`);
        }
    }
    
    // Применяем бонус фракции
    applyNatureFactionBonus(wizard, casterType);
}

function applyBarkArmorAtStart(wizard, level, position, type) {
    const armorBonus = [5, 10, 15, 20, 30];
    const bonus = armorBonus[Math.min(level, 5) - 1] || 5;
    
    if (!wizard.armorBonuses) wizard.armorBonuses = {};
    wizard.armorBonuses.bark_armor = bonus;
    
    wizard.armorBonus = 0;
    for (const source in wizard.armorBonuses) {
        wizard.armorBonus += wizard.armorBonuses[source];
    }
    
    // Показываем анимацию один раз
    if (window.spellAnimations?.bark_armor?.play) {
        setTimeout(() => {
            window.spellAnimations.bark_armor.play({
                casterType: type,
                casterPosition: position,
                targetWizard: wizard,
                level: level
            });
        }, 500 + position * 100);
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🛡️ ${wizard.name} защищен Древесной корой (+${bonus} брони)`);
    }
}
// Дополнительная функция для удаления эффекта коры при смерти мага
function removeBarkArmorOnDeath(wizard, position, casterType) {
    if (wizard.visualEffects?.bark_armor) {
        // Удаляем визуальный эффект
        if (window.spellAnimations?.bark_armor?.remove) {
            const key = `${casterType}_${position}`;
            window.spellAnimations.bark_armor.remove(key);
        }
        
        // Очищаем данные
        delete wizard.visualEffects.bark_armor;
        if (wizard.armorBonuses?.bark_armor) {
            delete wizard.armorBonuses.bark_armor;
            
            // Пересчитываем общий бонус брони
            wizard.armorBonus = 0;
            for (const source in wizard.armorBonuses) {
                wizard.armorBonus += wizard.armorBonuses[source];
            }
        }
    }
}

// --- Покров листвы (Leaf Canopy) - Тир 3, Buff (применяется в core.js) ---
function castLeafCanopy(wizard, spellData, position, casterType) {
    // Не применяется в бою — только для UI
    console.log('🍃 Покров листвы — применяется автоматически в начале боя');
}

// --- Энт (Ent) - Тир 4, Защитный призыв, поглощающий урон за союзников ---
function castEnt(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    
    // Определяем связанных магов
    const linkedWizards = [wizard]; // Кастер всегда связан
    
    // Добавляем случайных союзных магов
    const allies = casterType === 'player' ? 
        window.playerWizards.filter(w => w.id !== wizard.id && w.hp > 0) :
        window.enemyWizards.filter(w => w.id !== wizard.id && w.hp > 0);
    
    const additionalCount = level - 1; // 0,1,2,3,4 для уровней 1-5
    const shuffledAllies = [...allies].sort(() => 0.5 - Math.random());
    const selectedAllies = shuffledAllies.slice(0, additionalCount);
    
    linkedWizards.push(...selectedAllies);
    
    // Создаем Энта через менеджер
    const ent = window.createEntSummon(wizard, casterType, position, level, linkedWizards);
    
    if (!ent) {
        console.error('Не удалось создать Энта');
        return;
    }
    
    // Применяем бонус фракции
    applyNatureFactionBonus(wizard, casterType);
}

// Обновленная функция поиска защищающего Энта
function findProtectingEnt(target, casterType) {
    // Используем менеджер для поиска
    const ents = [];
    
    for (const [id, summon] of window.summonsManager.summons) {
        if (summon.type === 'nature_ent' && 
            summon.isAlive && 
            summon.special?.linkedWizards?.some(w => w.id === target.id)) {
            ents.push(summon);
        }
    }
    
    // Возвращаем первого найденного Энта (можно модифицировать логику)
    return ents[0] || null;
}

// Обновленная функция исцеления от Энта
function healWeakestAlly(casterType) {
    const allies = casterType === 'player' ? 
        window.playerWizards.filter(w => w.hp > 0) :
        window.enemyWizards.filter(w => w.hp > 0);
    
    if (allies.length === 0) return;
    
    // Находим самого слабого
    const weakest = allies.reduce((min, w) => 
        (w.hp / w.max_hp) < (min.hp / min.max_hp) ? w : min
    );
    
    const healAmount = Math.floor(weakest.max_hp * 0.10);
    weakest.hp = Math.min(weakest.hp + healAmount, weakest.max_hp);
    
    // Визуальный эффект исцеления для мага
    const wizardCol = casterType === 'player' ? 5 : 0;
    const wizardPos = casterType === 'player' ? 
        window.playerFormation.findIndex(id => id === weakest.id) :
        window.enemyFormation.findIndex(w => w && w.id === weakest.id);
    
    if (wizardPos !== -1) {
        const wizardSprite = window.wizardSprites?.[`${wizardCol}_${wizardPos}`];
        if (wizardSprite && window.summonsManager) {
            // Создаем эффект исцеления в позиции мага
            const container = window.pixiCore?.getEffectsContainer();
            if (container) {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const heal = new PIXI.Graphics();
                        heal.lineStyle(2, 0x00FF00, 0.6);
                        heal.drawCircle(0, 0, 10);
                        heal.x = wizardSprite.x;
                        heal.y = wizardSprite.y;
                        
                        container.addChild(heal);
                        
                        const startTime = Date.now();
                        const animate = () => {
                            const progress = Math.min((Date.now() - startTime) / 800, 1);
                            heal.scale.set(1 + progress * 2);
                            heal.alpha = 0.6 * (1 - progress);
                            heal.y -= 1;
                            
                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            } else {
                                if (heal.parent) container.removeChild(heal);
                            }
                        };
                        animate();
                    }, i * 150);
                }
            }
        }
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`💚 Энт исцеляет ${weakest.name} на ${healAmount} HP`);
    }
}


// --- Метеокинез (Meteorokinesis) - Тир 5, Глобальный бафф на стихийные заклинания союзников Природы ---
function castMeteorokinesis(wizard, spellData, position, casterType) {
    const level = spellData.level || 1;
    const damageBonus = [5, 10, 15, 15, 15][level - 1] || 5;
    const disableEnemyWeather = level >= 4; // На 4 и 5 уровне отключаем погоду для врага
    
    // Создаём глобальный эффект
    const meteorokinesis = {
        id: `meteorokinesis_${wizard.id}`,
        casterId: wizard.id,
        casterType: casterType,
        level: level,
        damageBonus: damageBonus,
        disableEnemyWeather: disableEnemyWeather,
        isActive: true,
        turnsLeft: level === 4 ? 2 : Infinity // На 4 уровне — 2 хода, на 5 — до конца боя
    };
    
    // Инициализируем объект, если не существует
    if (!window.activeMeteorokinesis) window.activeMeteorokinesis = [];
    
    // Удаляем старый эффект от этого кастера (если есть)
    window.activeMeteorokinesis = window.activeMeteorokinesis.filter(m => m.casterId !== wizard.id);
    
    // Добавляем новый
    window.activeMeteorokinesis.push(meteorokinesis);
    	if (window.spellAnimations?.meteorokinesis?.show) {
    	window.spellAnimations.meteorokinesis.show(casterType, level);
    }
    
    if (typeof window.addToBattleLog === 'function') {
        const duration = level === 4 ? 'на 2 хода' : 'до конца боя';
        const enemyEffect = disableEnemyWeather ? ', отключает погоду для врага' : '';
        window.addToBattleLog(`🌿 ${wizard.name} использует Метеокинез! +${damageBonus}% к стихийным заклинаниям союзников Природы ${duration}${enemyEffect}`);
    }
    
    // Применяем бонус фракции
    applyNatureFactionBonus(wizard, casterType);
}

// --- Бонус фракции: Дар природы ---
function applyNatureFactionBonus(wizard, casterType) {
    if (Math.random() < 0.05) { // 5% шанс
        // Находим живых союзных магов (кроме себя, если есть другие)
        const allies = casterType === 'player' ? 
            window.playerWizards.filter(w => w.id !== wizard.id && w.hp > 0) :
            window.enemyWizards.filter(w => w.id !== wizard.id && w.hp > 0);
        
        let targetWizard = null;
        
        if (allies.length > 0) {
            targetWizard = allies[Math.floor(Math.random() * allies.length)];
        } else {
            // Если других нет — лечим себя
            targetWizard = wizard;
        }
        
        if (targetWizard) {
            const healAmount = Math.floor(targetWizard.max_hp * 0.05);
            targetWizard.hp = Math.min(targetWizard.hp + healAmount, targetWizard.max_hp);
            
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`💚 Природа исцеляет ${targetWizard.name} на ${healAmount} HP`);
            }
        }
    }
}

// Вспомогательная функция: найти цель в позиции
function findTargetAtSimplePosition(col, casterType) {
    if (casterType === 'player') {
        const enemyWizard = window.enemyFormation[col];
        if (enemyWizard && enemyWizard.hp > 0) {
            return { wizard: enemyWizard, position: col };
        }
    } else {
        const wizardId = window.playerFormation[col];
        if (wizardId) {
            const playerWizard = window.playerWizards.find(w => w.id === wizardId);
            if (playerWizard && playerWizard.hp > 0) {
                return { wizard: playerWizard, position: col };
            }
        }
    }
    return null;
}
// --- Проверка, жив ли кастер Метеокинеза ---
function checkMeteorokinesisCasterAlive() {
    if (!window.activeMeteorokinesis) return;
    
    for (let i = window.activeMeteorokinesis.length - 1; i >= 0; i--) {
        const effect = window.activeMeteorokinesis[i];
        const caster = findCaster(effect.casterId, effect.casterType);
        
        if (!caster || caster.hp <= 0) {
            effect.isActive = false;
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌿 Эффект Метеокинеза от ${caster ? caster.name : 'неизвестного'} прекращён (кастер погиб)`);
            }
        }
        
        // На 4 уровне — уменьшаем счётчик ходов
        if (effect.turnsLeft !== Infinity) {
            effect.turnsLeft--;
            if (effect.turnsLeft <= 0) {
                effect.isActive = false;
                if (typeof window.addToBattleLog === 'function') {
                    window.addToBattleLog(`🌿 Эффект Метеокинеза истёк`);
                }
            }
        }
    }
}

// Вспомогательная функция для поиска кастера
function findCaster(casterId, casterType) {
    if (casterType === 'player') {
        return window.playerWizards.find(w => w.id === casterId);
    } else {
        return window.enemyWizards.find(w => w.id === casterId);
    }
}
// --- Поиск Энта, защищающего цель ---
function findProtectingEnt(target, casterType) {
    if (!window.activeSummons) return null;
    
    return window.activeSummons.find(summon => 
        summon.type === 'nature_ent' && 
        summon.isAlive && 
        summon.linkedWizards.some(w => w.id === target.id)
    );
}

// --- Исцеление самого слабого союзного мага ---
function healWeakestAlly(casterType) {
    const allies = casterType === 'player' ? 
        window.playerWizards.filter(w => w.hp > 0) :
        window.enemyWizards.filter(w => w.hp > 0);
    
    if (allies.length === 0) return;
    
    // Находим самого слабого (минимальное % HP)
    const weakest = allies.reduce((min, w) => 
        (w.hp / w.max_hp) < (min.hp / min.max_hp) ? w : min
    );
    
    const healAmount = Math.floor(weakest.max_hp * 0.10); // 10% от max HP
    weakest.hp = Math.min(weakest.hp + healAmount, weakest.max_hp);
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`💚 Энт исцеляет ${weakest.name} на ${healAmount} HP`);
    }
}
function removeDeadWolf(wolf) {
    if (window.spellAnimations?.call_wolf?.remove) {
        window.spellAnimations.call_wolf.remove(wolf.column, wolf.position);
    }
}

// Экспорт
window.castNatureSpell = castNatureSpell;  
window.castCallWolf = castCallWolf;
window.castBarkArmor = castBarkArmor;
window.castLeafCanopy = castLeafCanopy;
window.applyNatureFactionBonus = applyNatureFactionBonus;
window.castEnt = castEnt;
window.findProtectingEnt = findProtectingEnt;
window.healWeakestAlly = healWeakestAlly;
window.castMeteorokinesis = castMeteorokinesis;
window.checkMeteorokinesisCasterAlive = checkMeteorokinesisCasterAlive;
window.findCaster = findCaster;
window.performWolfAttack = performWolfAttack;
window.removeDeadWolf = removeDeadWolf;
window.removeBarkArmorOnDeath = removeBarkArmorOnDeath;
window.applyBarkArmorAtStart = applyBarkArmorAtStart;