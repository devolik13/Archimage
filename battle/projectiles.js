
// Инициализация
if (!window.activeProjectiles) window.activeProjectiles = [];

// --- Сброс всех снарядов ---
function resetProjectiles() {
    window.activeProjectiles = [];
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog('🌀 Все снаряды сброшены');
    }
}

// --- Создание снаряда Ветрореза ---
function createWindBladeProjectile(caster, initialTarget, damage, rounds, casterType) {
    const totalMoves = rounds * 5;
    
    // ИСПРАВЛЯЕМ: берем позицию из initialTarget
    const startPosition = initialTarget ? (initialTarget.position !== undefined ? initialTarget.position : 0) : 0;
    
    const windBladeProjectile = {
        id: `windblade_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        casterId: caster.id,
        casterType: casterType,
        targetColumn: casterType === 'player' ? 0 : 5,
        currentPosition: startPosition, // БЫЛО: initialTarget ? initialTarget.position : 0
        movesLeft: totalMoves - 1,
        damage: damage,
        casterFaction: caster.faction || 'none'
    };
    
    window.activeProjectiles.push(windBladeProjectile);
    
    console.log('🔍 Создан снаряд Ветрореза:', {
        id: windBladeProjectile.id,
        targetColumn: windBladeProjectile.targetColumn,
        initialPosition: windBladeProjectile.currentPosition, // Теперь должно быть число
        movesLeft: windBladeProjectile.movesLeft
    });
    
    // Запуск анимации
    if (window.spellAnimations?.wind_blade?.play) {
        window.spellAnimations.wind_blade.play({
            projectileId: windBladeProjectile.id,
            casterType: casterType,
            targetColumn: windBladeProjectile.targetColumn,
            initialPosition: windBladeProjectile.currentPosition
        });
    } else {
        console.warn('❌ window.spellAnimations.wind_blade.play не найдена!');
    }
    
    if (typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌪️ Создан снаряд Ветрореза (колонка ${windBladeProjectile.targetColumn}, ${totalMoves} ходов)`);
    }
    
    return windBladeProjectile;
}

// --- Обработать активные снаряды ---
function processActiveProjectiles() {
    if (!window.activeProjectiles || window.activeProjectiles.length === 0) return;
    
    for (let i = window.activeProjectiles.length - 1; i >= 0; i--) {
        const projectile = window.activeProjectiles[i];
        
        if (projectile.movesLeft <= 0 || projectile.movesLeft > 100) {
            window.activeProjectiles.splice(i, 1);
            continue;
        }
        
        // Двигаемся по кругу в пределах ЦЕЛЕВОЙ КОЛОНКИ
        projectile.currentPosition = (projectile.currentPosition + 1) % 5;
        if (window.spellAnimations?.wind_blade?.updatePosition) {
    	    window.spellAnimations.wind_blade.updatePosition(
        	projectile.id,
        	projectile.currentPosition
    	    );
	}

        projectile.movesLeft--;
        
        if (typeof window.addToBattleLog === 'function') {
            window.addToBattleLog(`🌀 Снаряд двигается на позицию ${projectile.currentPosition} в колонке ${projectile.targetColumn}`);
        }
        
        // Ищем цель в текущей позиции ЦЕЛЕВОЙ КОЛОНКИ
        let target = null;
        let targetWizard = null;
        
        if (projectile.targetColumn === 0) {
            // Колонка противника
            targetWizard = window.enemyFormation[projectile.currentPosition];
            if (targetWizard && targetWizard.hp > 0) {
                target = { wizard: targetWizard, position: projectile.currentPosition };
            }
        } else {
            // Колонка игрока
            const wizardId = window.playerFormation[projectile.currentPosition];
            if (wizardId) {
                targetWizard = window.playerWizards.find(w => w.id === wizardId);
                if (targetWizard && targetWizard.hp > 0) {
                    target = { wizard: targetWizard, position: projectile.currentPosition };
                }
            }
        }
        
        // Если есть цель — наносим урон (AOE, игнорирует стены)
        if (target) {
            const caster = findCaster(projectile.casterId, projectile.casterType);
            const finalDamage = typeof window.applyFinalDamage === 'function' ? 
                window.applyFinalDamage(caster, target.wizard, projectile.damage, 'wind_blade', 0, true) : projectile.damage;
                
            target.wizard.hp -= finalDamage;
            if (target.wizard.hp < 0) target.wizard.hp = 0;
            
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌀 Снаряд → ${target.wizard.name} (${finalDamage} урона) (${target.wizard.hp}/${target.wizard.max_hp})`);
            }
        } else {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌀 Снаряд на позиции ${projectile.currentPosition} → пусто`);
            }
        }
        
        // Удаляем снаряд, если закончились ходы
        if (projectile.movesLeft <= 0) {
            if (typeof window.addToBattleLog === 'function') {
                window.addToBattleLog(`🌀 Снаряд ${projectile.id} завершил круг.`);
            }
	    if (window.spellAnimations?.wind_blade?.remove) {
    		window.spellAnimations.wind_blade.remove(projectile.id);
	    }
            window.activeProjectiles.splice(i, 1);
        }
    }
}

// --- Вспомогательная функция: найти кастера ---
function findCaster(casterId, casterType) {
    if (casterType === 'player') {
        return window.playerWizards.find(w => w.id === casterId);
    } else {
        return window.enemyWizards.find(w => w.id === casterId);
    }
}

// --- Очистка завершенных снарядов ---
function cleanupFinishedProjectiles() {
    if (!window.activeProjectiles) return;
    const initialCount = window.activeProjectiles.length;
    window.activeProjectiles = window.activeProjectiles.filter(p => p.movesLeft > 0);
    const removedCount = initialCount - window.activeProjectiles.length;
    if (removedCount > 0 && typeof window.addToBattleLog === 'function') {
        window.addToBattleLog(`🌀 Удалено ${removedCount} завершенных снарядов`);
    }
}

// --- Получить информацию о снарядах ---
function getActiveProjectilesInfo() {
    if (!window.activeProjectiles || window.activeProjectiles.length === 0) {
        return 'Активных снарядов нет';
    }
    const info = window.activeProjectiles.map(p => 
        `${p.id}: позиция ${p.currentPosition}, ходов осталось ${p.movesLeft}`
    ).join('\n');
    return `Активные снаряды (${window.activeProjectiles.length}):\n${info}`;
}

// Экспорт
window.resetProjectiles = resetProjectiles;
window.createWindBladeProjectile = createWindBladeProjectile;
window.processActiveProjectiles = processActiveProjectiles;
window.cleanupFinishedProjectiles = cleanupFinishedProjectiles;
window.getActiveProjectilesInfo = getActiveProjectilesInfo;