// construction-visual-clean.js - Патч для молоточков БЕЗ rotation (только landscape)
console.log('🔨 construction-visual-clean.js загружен');

(function() {
    // Хранилище для визуализаций
    if (!window.activeConstructionVisuals) {
        window.activeConstructionVisuals = new Map();
    }
    if (!window.activeUpgradeVisuals) {
        window.activeUpgradeVisuals = new Map();
    }
    
    // Ждем загрузки overlay системы
    const waitForSystems = setInterval(() => {
        if (!window.OverlayClickableZones) return;
        
        clearInterval(waitForSystems);
        console.log('✅ Инициализация чистой системы молотков (landscape only)');
        
        // === ПАТЧ: ВИЗУАЛИЗАЦИЯ МОЛОТКОВ (БЕЗ ROTATION) ===
        window.addConstructionVisualization = function(buildingId) {
            console.log('🔨 Создаем молоток для', buildingId);
            
            const faction = window.userData?.faction;
            const container = document.getElementById('city-background-container');
            if (!container || !faction) {
                console.error('❌ Нет контейнера или фракции');
                return;
            }
            
            // Координаты из системы зон
            const zonesConfig = window.OverlayClickableZones?.zones?.[faction];
            if (!zonesConfig || !zonesConfig[buildingId]) {
                console.error('❌ Нет конфигурации зоны для', buildingId);
                return;
            }
            
            const zone = zonesConfig[buildingId];
            
            // Получаем или создаем overlay контейнер
            let overlayContainer = document.getElementById('overlay-zones-container');
            if (!overlayContainer) {
                overlayContainer = document.createElement('div');
                overlayContainer.id = 'overlay-zones-container';
                overlayContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 500;
                `;
                container.appendChild(overlayContainer);
            }
            
            // Удаляем старый молоток если есть
            const oldConstruction = document.getElementById(`construction-${buildingId}`);
            if (oldConstruction) {
                oldConstruction.remove();
                window.activeConstructionVisuals.delete(buildingId);
            }
            
            // Создаем элемент молотка
            const constructionDiv = document.createElement('div');
            constructionDiv.id = `construction-${buildingId}`;
            constructionDiv.className = 'construction-visualization';
            constructionDiv.dataset.buildingId = buildingId;
            constructionDiv.dataset.x = zone.x;
            constructionDiv.dataset.y = zone.y;
            constructionDiv.dataset.w = zone.w;
            constructionDiv.dataset.h = zone.h;
            
            // Временный стиль (позиция обновится через updatePosition)
            constructionDiv.style.cssText = `
                position: absolute;
                cursor: pointer;
                pointer-events: auto;
                z-index: 600;
            `;
            
            // Найти конструкцию для получения времени
            const construction = window.userData?.constructions?.find(
                c => c.building_id === buildingId && !c.is_upgrade
            );
            
            const timeRemaining = construction ? construction.time_remaining : 0;
            
            // Молоток в 3 раза меньше (как было раньше)
            constructionDiv.innerHTML = `
                <div style="
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid #ffa500;
                    border-radius: 8px;
                    padding: 6px;
                    color: white;
                    text-align: center;
                    min-width: 60px;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 10px rgba(255,165,0,0.4);
                ">
                    <div style="font-size: 20px; animation: hammer 1s infinite;">🔨</div>
                    <div style="font-size: 10px; color: #ffa500; font-weight: bold; margin-top: 2px;">
                        ${window.formatTimeCurrency ? window.formatTimeCurrency(timeRemaining) : timeRemaining}
                    </div>
                </div>
            `;
            
            // Клик по молотку
            constructionDiv.onclick = (e) => {
                e.stopPropagation();
                console.log('🖱️ Клик по молотку:', buildingId);
                
                const constructionIndex = window.userData?.constructions?.findIndex(
                    c => c.building_id === buildingId && !c.is_upgrade
                );
                
                if (constructionIndex !== -1 && window.showConstructionModal) {
                    window.showConstructionModal(constructionIndex);
                }
            };
            
            overlayContainer.appendChild(constructionDiv);
            window.activeConstructionVisuals.set(buildingId, constructionDiv);
            
            // Обновляем позицию
            updateConstructionPosition(constructionDiv);
            
            console.log('✅ Молоток создан и добавлен');
        };
        
        // === ПАТЧ: ВИЗУАЛИЗАЦИЯ ШЕСТЕРЕНОК (БЕЗ ROTATION) ===
        window.addUpgradeVisualization = function(buildingId) {
            console.log('⚙️ Создаем шестеренку для', buildingId);
            
            const faction = window.userData?.faction;
            const container = document.getElementById('city-background-container');
            if (!container || !faction) return;
            
            const zonesConfig = window.OverlayClickableZones?.zones?.[faction];
            if (!zonesConfig || !zonesConfig[buildingId]) {
                console.error('❌ Нет конфигурации зоны для', buildingId);
                return;
            }
            
            const zone = zonesConfig[buildingId];
            
            let overlayContainer = document.getElementById('overlay-zones-container');
            if (!overlayContainer) {
                overlayContainer = document.createElement('div');
                overlayContainer.id = 'overlay-zones-container';
                overlayContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 500;
                `;
                container.appendChild(overlayContainer);
            }
            
            const oldUpgrade = document.getElementById(`upgrade-${buildingId}`);
            if (oldUpgrade) {
                oldUpgrade.remove();
                window.activeUpgradeVisuals.delete(buildingId);
            }
            
            const upgradeDiv = document.createElement('div');
            upgradeDiv.id = `upgrade-${buildingId}`;
            upgradeDiv.className = 'upgrade-visualization';
            upgradeDiv.dataset.buildingId = buildingId;
            upgradeDiv.dataset.x = zone.x;
            upgradeDiv.dataset.y = zone.y;
            upgradeDiv.dataset.w = zone.w;
            upgradeDiv.dataset.h = zone.h;
            
            upgradeDiv.style.cssText = `
                position: absolute;
                cursor: pointer;
                pointer-events: auto;
                z-index: 600;
            `;
            
            const construction = window.userData?.constructions?.find(
                c => c.building_id === buildingId && c.is_upgrade
            );
            
            const timeRemaining = construction ? construction.time_remaining : 0;
            
            upgradeDiv.innerHTML = `
                <div style="
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid #4CAF50;
                    border-radius: 8px;
                    padding: 6px;
                    color: white;
                    text-align: center;
                    min-width: 60px;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 10px rgba(76,175,80,0.4);
                ">
                    <div style="font-size: 20px; animation: rotate 2s linear infinite;">⚙️</div>
                    <div style="font-size: 10px; color: #4CAF50; font-weight: bold; margin-top: 2px;">
                        ${window.formatTimeCurrency ? window.formatTimeCurrency(timeRemaining) : timeRemaining}
                    </div>
                </div>
            `;
            
            upgradeDiv.onclick = (e) => {
                e.stopPropagation();
                console.log('🖱️ Клик по шестеренке:', buildingId);
                
                const constructionIndex = window.userData?.constructions?.findIndex(
                    c => c.building_id === buildingId && c.is_upgrade
                );
                
                if (constructionIndex !== -1 && window.showConstructionModal) {
                    window.showConstructionModal(constructionIndex);
                }
            };
            
            overlayContainer.appendChild(upgradeDiv);
            window.activeUpgradeVisuals.set(buildingId, upgradeDiv);
            
            updateConstructionPosition(upgradeDiv);
            
            console.log('✅ Шестеренка создана');
        };
        
        // === ФУНКЦИЯ ОБНОВЛЕНИЯ ПОЗИЦИИ (LANDSCAPE ONLY) ===
        function updateConstructionPosition(element) {
            const container = document.getElementById('city-background-container');
            if (!container) return;
            
            // Находим любое изображение города для масштаба
            const anyBuildingImg = container.querySelector('img.city-building') || 
                                  container.querySelector('.city-background-img');
            
            if (!anyBuildingImg) {
                console.log('⏳ Изображения еще не загружены');
                return;
            }
            
            const imgRect = anyBuildingImg.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Масштаб изображения (768x512 оригинал)
            const scaleX = imgRect.width / 768;
            const scaleY = imgRect.height / 512;
            
            // Смещение изображения
            const offsetX = imgRect.left - containerRect.left;
            const offsetY = imgRect.top - containerRect.top;
            
            // Координаты из dataset
            const x = parseInt(element.dataset.x);
            const y = parseInt(element.dataset.y);
            const w = parseInt(element.dataset.w);
            const h = parseInt(element.dataset.h);
            
            // Центр зоны
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            
            // Применяем масштаб и смещение
            const scaledX = (centerX * scaleX) + offsetX;
            const scaledY = (centerY * scaleY) + offsetY;
            
            // Позиционируем элемент по центру зоны
            element.style.left = scaledX + 'px';
            element.style.top = scaledY + 'px';
            element.style.transform = 'translate(-50%, -50%)';
        }
        
        // === ОБНОВЛЕНИЕ ВСЕХ ВИЗУАЛИЗАЦИЙ ===
        function updateAllConstructionPositions() {
            window.activeConstructionVisuals.forEach(element => {
                updateConstructionPosition(element);
            });
            window.activeUpgradeVisuals.forEach(element => {
                updateConstructionPosition(element);
            });
        }
        
        // Слушаем resize для обновления позиций
        window.addEventListener('resize', () => {
            setTimeout(updateAllConstructionPositions, 100);
        });
        
        // Периодическое обновление
        setInterval(updateAllConstructionPositions, 100);
        
        // === ПРОВЕРКА АКТИВНЫХ СТРОЕК ===
        window.checkActiveConstructions = function() {
            const constructions = window.userData?.constructions || [];
            
            constructions.forEach(construction => {
                if (construction.type === 'building' && construction.time_remaining > 0) {
                    if (!construction.is_upgrade) {
                        // Проверяем есть ли молоток
                        if (!window.activeConstructionVisuals.has(construction.building_id)) {
                            console.log('🔨 Восстанавливаем молоток для', construction.building_id);
                            window.addConstructionVisualization(construction.building_id);
                        }
                    } else {
                        // Проверяем есть ли шестеренка
                        if (!window.activeUpgradeVisuals.has(construction.building_id)) {
                            console.log('⚙️ Восстанавливаем шестеренку для', construction.building_id);
                            window.addUpgradeVisualization(construction.building_id);
                        }
                    }
                }
            });
        };
        
        // === ОБНОВЛЕНИЕ ТАЙМЕРОВ ===
        window.updateConstructionTimers = function() {
            // Обновляем таймеры в молотках
            window.activeConstructionVisuals.forEach((element, buildingId) => {
                const construction = window.userData?.constructions?.find(
                    c => c.building_id === buildingId && !c.is_upgrade
                );
                
                if (construction) {
                    const timerDiv = element.querySelector('div > div:last-child');
                    if (timerDiv && window.formatTimeCurrency) {
                        timerDiv.textContent = window.formatTimeCurrency(construction.time_remaining);
                    }
                }
            });
            
            // Обновляем таймеры в шестеренках
            window.activeUpgradeVisuals.forEach((element, buildingId) => {
                const construction = window.userData?.constructions?.find(
                    c => c.building_id === buildingId && c.is_upgrade
                );
                
                if (construction) {
                    const timerDiv = element.querySelector('div > div:last-child');
                    if (timerDiv && window.formatTimeCurrency) {
                        timerDiv.textContent = window.formatTimeCurrency(construction.time_remaining);
                    }
                }
            });
        };
        
        // Запускаем периодическое обновление таймеров
        setInterval(() => {
            if (window.updateConstructionTimers) {
                window.updateConstructionTimers();
            }
        }, 1000);
        
        // Запускаем проверку активных строек
        setTimeout(() => {
            if (window.checkActiveConstructions) {
                window.checkActiveConstructions();
            }
        }, 1000);
        
        // === CSS АНИМАЦИИ ===
        if (!document.getElementById('construction-animations-clean')) {
            const style = document.createElement('style');
            style.id = 'construction-animations-clean';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 1; }
                }
                
                @keyframes hammer {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-20deg); }
                    75% { transform: rotate(20deg); }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .construction-visualization,
                .upgrade-visualization {
                    user-select: none;
                    -webkit-user-select: none;
                    transition: none !important;
                    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('✅ construction-visual-clean активирован');
        console.log('📦 Функции:');
        console.log('  - Молотки и шестеренки для landscape режима');
        console.log('  - Автоматическая синхронизация с зонами');
        console.log('  - Обновление таймеров каждую секунду');
        console.log('  - Восстановление после перезагрузки');
    }, 100);
})();