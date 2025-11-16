// time-construction-system.js - Система строительства с временной валютой (БЕТА)
console.log('✅ time-construction-system.js загружен (БЕТА-РЕЖИМ)');


// Флаг для блокировки автоматического открытия модалки после программного закрытия
let blockConstructionModalReopen = false;


// Проверка активных строек
function hasActiveConstruction(type = 'building') {
    const constructions = window.userData.constructions || [];
    
    // Проверяем есть ли ЛЮБАЯ стройка или найм
    if (type === 'any_building_or_wizard') {
        return constructions.some(c => 
            (c.type === 'building' || c.type === 'wizard') && 
            !c.is_upgrade && // не считаем улучшения
            c.time_remaining > 0
        );
    }
    
    // Проверяем конкретный тип
    return constructions.some(c => c.type === type && c.time_remaining > 0);
}

// Начать строительство
async function startConstruction(buildingId, cellIndex, isUpgrade = false, targetLevel = 1) {
    // Проверяем, нет ли уже активной стройки ИЛИ найма
    if (hasActiveConstruction('any_building_or_wizard')) {
        // Определяем, что именно идет
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c => 
            (c.type === 'building' || c.type === 'wizard') && 
            c.time_remaining > 0
        );
        
        if (activeConstruction) {
            if (activeConstruction.type === 'wizard') {
                alert('⚠️ Нельзя строить пока идет найм мага!');
            } else if (activeConstruction.is_upgrade) {
                alert('⚠️ Нельзя строить пока идет улучшение другого здания!');
            } else {
                alert('⚠️ Можно строить только одно здание одновременно!');
            }
        }
        return false;
    }
   
    const timeRequired = isUpgrade ? 
        CONSTRUCTION_TIME.getUpgradeTime(buildingId, targetLevel) : 
        CONSTRUCTION_TIME[buildingId];
    
    const construction = {
        type: 'building',
        building_id: buildingId,
        cell_index: cellIndex,
        is_upgrade: isUpgrade,
        target_level: targetLevel,
        time_required: timeRequired,
        time_remaining: timeRequired,
        started_at: Date.now()
    };
    
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }
    window.userData.constructions.push(construction);
    
    // ============ НОВЫЙ КОД: ДОБАВЛЯЕМ ВИЗУАЛИЗАЦИЮ МОЛОТКА ============
    // Показываем молоток в правильной позиции на здании
    if (!isUpgrade && window.addConstructionVisualization) {
        console.log('🔨 Добавляем визуализацию молотка для', buildingId);
        setTimeout(() => {
            window.addConstructionVisualization(buildingId);
        }, 100); // Небольшая задержка чтобы UI успел обновиться
    } else if (isUpgrade && window.addUpgradeVisualization) {
        console.log('⚙️ Добавляем визуализацию улучшения для', buildingId);
        setTimeout(() => {
            window.addUpgradeVisualization(buildingId);
        }, 100);
    }
    // =====================================================================
    
    updateConstructionUI();
    await saveConstruction();
    return true;
}

// Начать изучение заклинания
async function startSpellLearning(spellId, faction, tier, currentLevel) {
    // Проверяем, нет ли уже активного изучения
    if (hasActiveConstruction('spell')) {
        alert('⚠️ Можно изучать только одно заклинание одновременно!');
        return false;
    }

    const timeRequired = SPELL_LEARNING_TIME.getLearnTime(tier, currentLevel, faction);
    
    const construction = {
        type: 'spell',
        spell_id: spellId,
        faction: faction,
        tier: tier,
        current_level: currentLevel,
        target_level: currentLevel + 1,
        time_required: timeRequired,
        time_remaining: timeRequired,
        started_at: Date.now()
    };
    
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }
    window.userData.constructions.push(construction);
    
    updateConstructionUI();
    await saveConstruction();
    return true;
}

// Начать найм мага - ИСПРАВЛЕННАЯ ВЕРСИЯ
async function startWizardHire(currentWizardCount) {
    // Проверяем активные стройки
    if (hasActiveConstruction('any_building_or_wizard')) {
        const constructions = window.userData.constructions || [];
        const activeConstruction = constructions.find(c => 
            (c.type === 'building' || c.type === 'wizard') && 
            c.time_remaining > 0
        );
        
        if (activeConstruction) {
            if (activeConstruction.type === 'wizard') {
                alert('⚠️ Уже идет найм другого мага!');
            } else if (activeConstruction.is_upgrade) {
                alert('⚠️ Нельзя нанимать мага пока идет улучшение здания!');
            } else {
                alert('⚠️ Нельзя нанимать мага пока идет строительство!');
            }
        }
        return false;
    }
    
    const timeRequired = WIZARD_HIRE_TIME.getHireTime(currentWizardCount);
    
    // ВАЖНО: даже для первого мага (время=0) создаем конструкцию!
    const construction = {
        type: 'wizard',
        wizard_index: currentWizardCount + 1,
        time_required: timeRequired,
        time_remaining: timeRequired,
        started_at: Date.now()
    };
    
    if (!window.userData.constructions) {
        window.userData.constructions = [];
    }
    window.userData.constructions.push(construction);
    
    updateConstructionUI();
    await saveConstruction();
    
    // Если время = 0 (первый маг), сразу завершаем
    if (timeRequired === 0) {
        console.log('⚡ Мгновенный найм первого мага');
        // Находим только что добавленную конструкцию
        const lastIndex = window.userData.constructions.length - 1;
        await completeConstruction(lastIndex);
    }
    
    return true;
}

// Обновленное модальное окно с кнопкой разработчика
function showConstructionModal(constructionIndex) {
    // Проверяем флаг блокировки
    if (blockConstructionModalReopen) {
        console.log('🚫 Открытие модалки заблокировано (blockConstructionModalReopen = true)');
        return;
    }
    
    const construction = window.userData.constructions[constructionIndex];
    if (!construction) return;
    
    const timeRemaining = construction.time_remaining;
    const currentTimeCurrency = window.getTimeCurrency();
    const canAffordSpeedup = currentTimeCurrency >= timeRemaining;
    
    const itemName = construction.type === 'spell' ? 
        `Заклинание: ${construction.spell_id}` : 
        (construction.type === 'wizard' ? 
            `Маг ${construction.wizard_index}` : 
            getBuildingName(construction.building_id));
    
    let operationType = '';
    if (construction.type === 'spell') {
        operationType = '📖 Изучение заклинания';
    } else if (construction.type === 'wizard') {
        operationType = '🧙 Найм мага';
    } else if (construction.is_upgrade) {
        operationType = '🔧 Улучшение здания';
    } else {
        operationType = '🏗️ Строительство здания';
    }
    
    const modalContent = `
        <div style="padding: 20px; max-width: 400px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">
                ${operationType}
            </h3>
            
            <div style="background: #3d3d5c; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 16px; margin-bottom: 10px;">
                    <strong>${itemName}</strong>
                    ${construction.target_level ? ` → Уровень ${construction.target_level}` : ''}
                </div>
                
                <div style="margin: 10px 0;">
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 5px;">Осталось времени:</div>
                    <div style="font-size: 20px; color: #ffa500; font-weight: bold;">
                        ${formatTimeCurrency(timeRemaining)}
                    </div>
                </div>
                
                <div style="width: 100%; background: #2a2a3a; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                    <div style="
                        width: ${((construction.time_required - timeRemaining) / construction.time_required * 100)}%;
                        height: 100%;
                        background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
            
            ${DEV_MODE ? `
                <button onclick="devInstantComplete(${constructionIndex})" style="
                    width: 100%;
                    margin-bottom: 10px;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    background: linear-gradient(90deg, #9333ea 0%, #c026d3 100%);
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                ">
                    🚀 [DEV] Завершить мгновенно
                </button>
            ` : ''}
            
            <!-- Кнопка ускорения -->
            <button 
                onclick="speedupConstruction(${constructionIndex})" 
                style="
                    width: 100%;
                    margin-bottom: 10px;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    background: ${canAffordSpeedup ? 
                        'linear-gradient(90deg, #ffa500 0%, #ff8c00 100%)' : 
                        '#666'};
                    color: white;
                    cursor: ${canAffordSpeedup ? 'pointer' : 'not-allowed'};
                    font-weight: bold;
                    font-size: 16px;
                    opacity: ${canAffordSpeedup ? '1' : '0.5'};
                "
                ${!canAffordSpeedup ? 'disabled' : ''}
            >
                ⚡ Ускорить за ${formatTimeCurrency(timeRemaining)}
                <div style="font-size: 11px; margin-top: 3px;">
                    У вас: ${formatTimeCurrency(currentTimeCurrency)}
                </div>
            </button>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="cancelConstruction(${constructionIndex})" style="
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    background: #ff5252;
                    color: white;
                    cursor: pointer;
                ">
                    ❌ Отменить (вернет 50%)
                </button>
            </div>
            
            <button onclick="closeCurrentModal()" style="
                width: 100%;
                margin-top: 10px;
                padding: 8px;
                border: 1px solid #7289da;
                border-radius: 6px;
                background: transparent;
                color: #7289da;
                cursor: pointer;
            ">
                Закрыть
            </button>
        </div>
    `;
    
    showModal(modalContent);
}

// Добавьте новую функцию для ускорения
function speedupConstruction(constructionIndex) {
    const construction = window.userData.constructions[constructionIndex];
    if (!construction) return;
    
    const cost = construction.time_remaining;
    
    // БЛОКИРУЕМ повторное открытие модалки
    blockConstructionModalReopen = true;
    
    // Закрываем модалку СРАЗУ
    if (window.Modal && window.Modal.close) {
        window.Modal.close(false);
    }
    if (window.closeCurrentModal) {
        window.closeCurrentModal();
    }
    
    if (window.useTimeCurrency(cost, () => {
        completeConstruction(constructionIndex);
        updateConstructionUI();
        updateAllConstructionTimers();
        if (typeof window.showNotification === 'function') {
            window.showNotification(`⚡ Строительство ускорено за ${formatTimeCurrency(cost)}`);
        }
        
        // Разблокируем через 500ms
        setTimeout(() => {
            blockConstructionModalReopen = false;
        }, 500);
    })) {
        // Успешно ускорено
    } else {
        // Если не хватило ресурсов - разблокируем сразу
        blockConstructionModalReopen = false;
    }
}

async function devInstantComplete(constructionIndex) {
    const construction = window.userData.constructions[constructionIndex];
    if (!construction) return;
    
    // БЛОКИРУЕМ повторное открытие модалки
    blockConstructionModalReopen = true;
    
    // ВАЖНО: ПРИНУДИТЕЛЬНО закрываем модалку БЕЗ анимации
    if (window.Modal && window.Modal.close) {
        window.Modal.close(false); // false = без анимации, мгновенно
    }
    if (window.closeCurrentModal) {
        window.closeCurrentModal();
    }
    
    // Небольшая задержка чтобы закрытие успело выполниться
    await new Promise(resolve => setTimeout(resolve, 50));
    
    construction.time_remaining = 0;
    await completeConstruction(constructionIndex);
    updateConstructionUI();
    updateAllConstructionTimers();
    
    // Разблокируем через 500ms
    setTimeout(() => {
        blockConstructionModalReopen = false;
    }, 500);
}

// Обновление UI строительства
function updateConstructionUI() {

    const constructions = window.userData.constructions || [];

    

    // Сбрасываем все индикаторы

    document.querySelectorAll('.construction-timer').forEach(el => el.remove());

    

    constructions.forEach((construction, index) => {

        if (construction.time_remaining <= 0) return;

        

        if (construction.type === 'building' && !construction.is_upgrade) {

            // Показываем молоток с таймером на ячейке

            const cell = document.querySelector(`[data-index="${construction.cell_index}"]`);

            if (cell) {

                cell.classList.add('under-construction');

                cell.classList.remove('empty'); // Важно убрать класс empty

                cell.innerHTML = `

                    <div style="position: relative; width: 100%; height: 100%; cursor: pointer;" 

                         onclick="showConstructionModal(${index})">

                        <div style="font-size: 32px;">🔨</div>

                        <div class="construction-timer" style="

                            position: absolute;

                            bottom: 0;

                            left: 0;

                            right: 0;

                            background: rgba(0,0,0,0.8);

                            color: #ffa500;

                            font-size: 10px;

                            padding: 2px;

                            text-align: center;

                        ">

                            ${formatTimeCurrency(construction.time_remaining)}

                        </div>

                    </div>

                `;

            }

        }

    });

}

function updateAllConstructionTimers() {
    // Проверяем что userData существует
    if (!window.userData) return;
    
    const constructions = window.userData.constructions || [];
    let hasChanges = false;
    
    constructions.forEach((construction, index) => {
        if (construction.time_remaining > 0) {
            const elapsed = Math.floor((Date.now() - construction.started_at) / 60000);
            construction.time_remaining = Math.max(0, construction.time_required - elapsed);
            
            if (construction.time_remaining === 0) {
                completeConstruction(index);
                hasChanges = true;
            }
        }
    });
    
    if (hasChanges || constructions.some(c => c.time_remaining > 0)) {
        updateConstructionUI();
    }
}

// Завершение конструкции - добавить в time-construction-system.js
async function completeConstruction(constructionIndex) {
    const construction = window.userData.constructions[constructionIndex];
    if (!construction) {
        console.error('Конструкция не найдена');
        return;
    }
    
    // Удаляем конструкцию из списка
    window.userData.constructions.splice(constructionIndex, 1);
    
    if (construction.type === 'spell') {
        // Завершение изучения заклинания
        const { spell_id, faction, target_level, tier } = construction;
        
        if (!window.userData.spells) {
            window.userData.spells = {};
        }
        if (!window.userData.spells[faction]) {
            window.userData.spells[faction] = {};
        }
        
        // Обновляем уровень заклинания
        const spellName = window.getSpellNameById ? window.getSpellNameById(spell_id) : spell_id;
        if (!window.userData.spells[faction][spell_id]) {
            window.userData.spells[faction][spell_id] = {
                name: spellName,
                level: target_level,
                tier: tier
            };
        } else {
            window.userData.spells[faction][spell_id].level = target_level;
            window.userData.spells[faction][spell_id].name = spellName; // Обновляем название на случай если было на английском
        }
        
        // Добавляем в доступные заклинания если ещё нет
        if (!window.userData.available_spells) {
            window.userData.available_spells = [];
        }
        if (!window.userData.available_spells.includes(spell_id)) {
            window.userData.available_spells.push(spell_id);
        }
        
        // Разблокировка следующего заклинания при достижении 5 уровня
        if (target_level === 5) {
            const spellTiers = window.SPELL_TIERS?.[faction] || [];
            const currentIndex = spellTiers.indexOf(spell_id);
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < spellTiers.length) {
                const nextSpellId = spellTiers[nextIndex];
                const nextSpellName = window.getSpellNameById ? window.getSpellNameById(nextSpellId) : nextSpellId;
                const nextTier = nextIndex + 1;
                
                // Создаём запись для следующего заклинания с level: 0
                if (!window.userData.spells[faction][nextSpellId]) {
                    window.userData.spells[faction][nextSpellId] = {
                        name: nextSpellName,
                        level: 0,
                        tier: nextTier
                    };
                    
                    if (!window.userData.available_spells.includes(nextSpellId)) {
                        window.userData.available_spells.push(nextSpellId);
                    }
                    
                    console.log(`🔓 Разблокировано новое заклинание: ${nextSpellName} (Tier ${nextTier})`);
                }
            }
        }
        
        console.log(`✅ Заклинание ${spellName} улучшено до уровня ${target_level}`);

        // Обновляем UI библиотеки
        if (typeof window.renderLibraryUI === 'function') {
            window.renderLibraryUI();
        }

        // Триггер сохранения
        if (typeof window.onSpellLearned === 'function') {
            if (target_level === 1) {
                window.onSpellLearned(spell_id, target_level);
            } else {
                window.onSpellUpgraded(spell_id, target_level);
            }
        }

        // ВАЖНО: Закрываем ВСЕ модалки после завершения изучения
        if (window.Modal && window.Modal.closeAll) {
            window.Modal.closeAll();
        }

        if (typeof Notification !== 'undefined' && Notification.show) { Notification.show(`✅ Заклинание улучшено до уровня ${target_level}!`, 'success'); }
        
    } else if (construction.type === 'wizard') {
        // Создаем нового мага
        const newWizardId = `wizard_${Date.now()}`;
        const newWizard = {
            id: newWizardId,
            name: `Маг ${construction.wizard_index}`,
            faction: window.userData.faction,
            spells: [],
            hp: 100,
            armor: 100,
            max_hp: 100,
            max_armor: 100,
            level: 1
        };
        
        // ВАЖНО: добавляем в локальные данные
        if (!window.userData.wizards) {
            window.userData.wizards = [];
        }
        window.userData.wizards.push(newWizard);
        
        // Обновляем UI сразу
        if (typeof window.updateWizardsList === 'function') {
            window.updateWizardsList();
        }
        if (typeof window.updatePlayerLevel === 'function') {
            window.updatePlayerLevel();
        }
        
        console.log('✅ Маг добавлен локально:', newWizard);

        // Триггер сохранения
        if (typeof window.onWizardHired === 'function') {
            window.onWizardHired(newWizardId);
        }

        const panel = document.getElementById('bottom-control-panel');
        if (panel) {
            // Пересоздаем панель чтобы обновить слоты магов
            if (window.createBottomControlPanel) {
                window.createBottomControlPanel();
            }
        }

        // ВАЖНО: Закрываем ВСЕ модалки после найма мага
        if (window.Modal && window.Modal.closeAll) {
            window.Modal.closeAll();
        }

        if (typeof Notification !== 'undefined' && Notification.show) { Notification.show('✅ Маг нанят успешно!', 'success'); }
        
    } else if (construction.type === 'building') {
        // Завершение здания
        if (construction.is_upgrade) {
            if (!window.userData.buildings[construction.building_id]) {
                window.userData.buildings[construction.building_id] = {};
            }
            window.userData.buildings[construction.building_id].level = construction.target_level;
            
            // НЕ вызываем updateBuildingsGrid для улучшений!
            
            // Для Башни благословений блокируем переоткрытие модалки
            if (construction.building_id === 'blessing_tower' && typeof window.setBlockBlessingModalReopen === 'function') {
                window.setBlockBlessingModalReopen(true);
                // Снимаем блокировку через 500ms
                setTimeout(() => {
                    if (typeof window.setBlockBlessingModalReopen === 'function') {
                        window.setBlockBlessingModalReopen(false);
                    }
                }, 500);
            }
            const gear = document.getElementById(`upgrade-${construction.building_id}`);
            if (gear) {
                gear.remove();
                if (window.activeUpgradeVisuals) {
                    window.activeUpgradeVisuals.delete(construction.building_id);
                }
                console.log('⚙️ Шестеренка удалена');
            }

            // Триггер сохранения для улучшения
            if (typeof window.onBuildingUpgraded === 'function') {
                window.onBuildingUpgraded(construction.building_id, construction.target_level);
            }

            // ВАЖНО: Закрываем ВСЕ модалки после завершения улучшения
            if (window.Modal && window.Modal.closeAll) {
                window.Modal.closeAll();
            }

            // Просто показываем уведомление
            if (typeof Notification !== 'undefined' && Notification.show) { Notification.show('✅ Улучшение завершено!', 'success'); }
	
	    if (window.userData?.faction) {
	        const container = document.getElementById('city-background-container');
    		if (container && window.createBuildingClickZones) {
    		    window.createBuildingClickZones(window.userData.faction, container);
    		}
	    }
        } else {
            // Для новых зданий код остается как есть
            if (!window.userData.buildings) {
                window.userData.buildings = {};
            }
            window.userData.buildings[construction.building_id] = {
                level: 1,
                cell_index: construction.cell_index,
                building_id: construction.building_id
            };
            // ===== ДОБАВИТЬ ЗДЕСЬ: Загрузка изображения здания =====
            // Загружаем изображение здания
            const container = document.getElementById('city-background-container');
            if (container && window.loadBuildingImageNew) {
                const existingBuildings = container.querySelectorAll('.city-building');
                const newZIndex = existingBuildings.length + 1;
                console.log('🖼️ Загружаем изображение здания:', construction.building_id);
                window.loadBuildingImageNew(window.userData.faction, construction.building_id, container, newZIndex);
                
                // Удаляем молоток
                const hammer = document.getElementById(`construction-${construction.building_id}`);
                if (hammer) {
                    hammer.remove();
                    if (window.activeConstructionVisuals) {
                        window.activeConstructionVisuals.delete(construction.building_id);
                    }
                    console.log('🔨 Молоток удален');
                }
            }

            // Триггер сохранения для нового здания
            if (typeof window.onBuildingCompleted === 'function') {
                window.onBuildingCompleted(construction.building_id);
            }

            // ВАЖНО: Закрываем ВСЕ модалки после завершения строительства
            if (window.Modal && window.Modal.closeAll) {
                window.Modal.closeAll();
            }

            if (typeof Notification !== 'undefined' && Notification.show) { Notification.show('✅ Здание построено!', 'success'); }

	    if (window.userData?.faction && container && window.createBuildingClickZones) {
    		window.createBuildingClickZones(window.userData.faction, container);
	    }
        }
    }
    
    // Обновляем UI
    updateConstructionUI();
    updateAllConstructionTimers();
    
    // Отмечаем изменения для автосохранения
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    
    await saveConstructionsToServer();
}


// Инициализация при загрузке
window.addEventListener('load', () => {
    if (BETA_MODE) {
        console.log('⚠️ БЕТА-РЕЖИМ: Время ускорено в 10 раз!');
    }
    if (DEV_MODE) {
        console.log('🚀 DEV-РЕЖИМ: Доступны кнопки мгновенного завершения');
    }
    
    // НЕ запускаем обновление таймеров сразу - userData еще не загружен
    // Это будет вызвано из ui_manager.js после загрузки данных
});

// Запускаем обновление таймеров после инициализации userData
function initConstructionSystem() {
    updateAllConstructionTimers();
    // Запускаем обновление каждую минуту
    setInterval(updateAllConstructionTimers, 1000);
}

async function saveConstructionsToServer() {
    // Здания сохраняются автоматически через автосохранение каждые 30 секунд
    // Просто отмечаем что есть изменения
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    
    /* СТАРЫЙ КОД - ОТКЛЮЧЕН
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    // Здания сохраняются через автосохранение в savePlayer
    if (window.dbManager) {
        window.dbManager.markChanged();
    }
    }
    
    /* СТАРЫЙ КОД - ОТКЛЮЧЕН
    try {
        const response = await fetch(`${API_BASE_URL}/api/constructions/save`, {
            method: 'POST',
            ...
        });
    } catch (error) {
        console.error('Ошибка сети при сохранении конструкций:', error);
    }
    */
}

// Отмена строительства (возврат 50% времени)
function cancelConstruction(constructionIndex) {
    const construction = window.userData.constructions[constructionIndex];
    if (!construction) return;
    
    // Возвращаем 50% потраченного времени
    const refund = Math.floor((construction.time_required - construction.time_remaining) * 0.5);
    if (refund > 0) {
        addTimeCurrency(refund);
    }
    
    // Удаляем из очереди
    window.userData.constructions.splice(constructionIndex, 1);
    
    closeCurrentModal();
    // updateBuildingsGrid();
    updateConstructionUI();
    saveConstructionsToServer();
    
    // Используем глобальную функцию showNotification из script_buildings.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(`Строительство отменено. Возвращено ${formatTimeCurrency(refund)}`);
    }
}
window.startWizardHire = startWizardHire;
window.WIZARD_HIRE_TIME = WIZARD_HIRE_TIME;
window.cancelConstruction = cancelConstruction;
window.saveConstruction = saveConstructionsToServer;
// formatTimeCurrency используется из utilities.js
window.showConstructionModal = showConstructionModal;
window.speedupConstruction = speedupConstruction;
window.startConstruction = startConstruction;
window.startSpellLearning = startSpellLearning;
window.devInstantComplete = devInstantComplete;
window.updateConstructionUI = updateConstructionUI;
window.hasActiveConstruction = hasActiveConstruction;
window.initConstructionSystem = initConstructionSystem;