// construction-visual-clean.js - Компактные значки активных процессов рядом с аватаром

(function() {
    // Хранилище для визуализаций (для совместимости)
    if (!window.activeConstructionVisuals) {
        window.activeConstructionVisuals = new Map();
    }
    if (!window.activeUpgradeVisuals) {
        window.activeUpgradeVisuals = new Map();
    }

    // Ждем загрузки систем
    const waitForSystems = setInterval(() => {
        if (!window.userData) return;

        clearInterval(waitForSystems);

        // === ОСНОВНАЯ ПАНЕЛЬ АКТИВНЫХ ПРОЦЕССОВ ===
        function createProcessPanel() {
            // Проверяем, не активен ли portrait blocker
            if (document.getElementById('portrait-blocker-overlay')) {
                return null;
            }

            // Удаляем старую панель если есть
            const oldPanel = document.getElementById('active-processes-panel');
            if (oldPanel) {
                oldPanel.remove();
            }

            // Вычисляем позицию относительно аватара
            const avatar = document.getElementById('player-avatar-container');
            let leftPos = '180px';
            let topPos = '10px';

            if (avatar) {
                const avatarRect = avatar.getBoundingClientRect();
                if (avatarRect.width > 0) {
                    leftPos = (avatarRect.right + 10) + 'px';
                    topPos = avatarRect.top + 'px';
                }
            }

            const panel = document.createElement('div');
            panel.id = 'active-processes-panel';
            panel.style.cssText = `
                position: fixed;
                top: ${topPos};
                left: ${leftPos};
                display: flex;
                flex-direction: column;
                gap: 4px;
                z-index: 10001;
            `;

            document.body.appendChild(panel);
            return panel;
        }

        // Получаем или создаем панель
        function getProcessPanel() {
            let panel = document.getElementById('active-processes-panel');
            if (!panel) {
                panel = createProcessPanel();
            }
            return panel;
        }

        // === ОБНОВЛЕНИЕ ПОЗИЦИИ ПАНЕЛИ ===
        function updatePanelPosition() {
            const panel = document.getElementById('active-processes-panel');
            const avatar = document.getElementById('player-avatar-container');

            if (panel && avatar) {
                const avatarRect = avatar.getBoundingClientRect();
                panel.style.left = (avatarRect.right + 10) + 'px';
                panel.style.top = avatarRect.top + 'px';
            }
        }

        // === СОЗДАНИЕ ЗНАЧКА ПРОЦЕССА ===
        function createProcessIcon(type, data) {
            const icon = document.createElement('div');
            icon.className = 'process-icon';
            icon.dataset.type = type;
            icon.dataset.id = data.id || '';

            let emoji, color, timeRemaining, clickHandler, useImage = false;

            // Иконка строительства для фракции
            const faction = window.userData?.faction || 'fire';
            const buildIconPath = `assets/icons/${faction}/${faction}_build.webp`;

            switch (type) {
                case 'building':
                    emoji = buildIconPath;
                    useImage = true;
                    color = '#ffa500';
                    timeRemaining = data.time_remaining;
                    clickHandler = () => {
                        const idx = window.userData?.constructions?.findIndex(
                            c => c.building_id === data.id && !c.is_upgrade
                        );
                        if (idx !== -1 && window.showConstructionModal) {
                            window.showConstructionModal(idx);
                        }
                    };
                    break;

                case 'upgrade':
                    emoji = '⚙️';
                    color = '#4CAF50';
                    timeRemaining = data.time_remaining;
                    clickHandler = () => {
                        const idx = window.userData?.constructions?.findIndex(
                            c => c.building_id === data.id && c.is_upgrade
                        );
                        if (idx !== -1 && window.showConstructionModal) {
                            window.showConstructionModal(idx);
                        }
                    };
                    break;

                case 'spell':
                    emoji = '📖';
                    color = '#7289da';
                    timeRemaining = data.time_remaining;
                    clickHandler = () => {
                        const idx = window.userData?.constructions?.findIndex(
                            c => c.type === 'spell'
                        );
                        if (idx !== -1 && window.showConstructionModal) {
                            window.showConstructionModal(idx);
                        }
                    };
                    break;

                case 'wizard':
                    emoji = '🧙';
                    color = '#9b59b6';
                    timeRemaining = data.time_remaining;
                    clickHandler = () => {
                        const idx = window.userData?.constructions?.findIndex(
                            c => c.type === 'wizard'
                        );
                        if (idx !== -1 && window.showConstructionModal) {
                            window.showConstructionModal(idx);
                        }
                    };
                    break;
            }

            icon.style.cssText = `
                background: rgba(0, 0, 0, 0.75);
                border: 2px solid ${color};
                border-radius: 8px;
                padding: 4px 8px;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                backdrop-filter: blur(5px);
                transition: all 0.2s;
                animation: pulse 2s infinite;
            `;

            // Формируем иконку (изображение для строительства, эмодзи для остального)
            const iconContent = useImage
                ? `<img src="${emoji}" alt="Строительство" style="width: 18px; height: 18px; object-fit: contain;">`
                : `<span style="font-size: 16px;">${emoji}</span>`;

            icon.innerHTML = `
                ${iconContent}
                <span class="process-timer" style="
                    font-size: 11px;
                    color: ${color};
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                ">${window.formatTimeCurrency ? window.formatTimeCurrency(timeRemaining) : timeRemaining}</span>
            `;

            icon.onclick = clickHandler;

            icon.onmouseover = () => {
                icon.style.transform = 'scale(1.1)';
                icon.style.boxShadow = `0 0 15px ${color}`;
            };
            icon.onmouseout = () => {
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = 'none';
            };

            return icon;
        }

        // === ОБНОВЛЕНИЕ ПАНЕЛИ ПРОЦЕССОВ ===
        function updateProcessPanel() {
            const panel = getProcessPanel();
            const avatar = document.getElementById('player-avatar-container');

            // Если аватар скрыт - скрываем и панель
            if (!avatar || avatar.style.display === 'none') {
                panel.style.display = 'none';
                return;
            }

            panel.style.display = 'flex';
            panel.innerHTML = ''; // Очищаем

            const constructions = window.userData?.constructions || [];

            constructions.forEach(construction => {
                if (construction.time_remaining <= 0) return;

                let icon;

                if (construction.type === 'building') {
                    if (construction.is_upgrade) {
                        icon = createProcessIcon('upgrade', {
                            id: construction.building_id,
                            time_remaining: construction.time_remaining
                        });
                    } else {
                        icon = createProcessIcon('building', {
                            id: construction.building_id,
                            time_remaining: construction.time_remaining
                        });
                    }
                } else if (construction.type === 'spell') {
                    icon = createProcessIcon('spell', {
                        id: construction.spell_id,
                        time_remaining: construction.time_remaining
                    });
                } else if (construction.type === 'wizard') {
                    icon = createProcessIcon('wizard', {
                        id: construction.wizard_index,
                        time_remaining: construction.time_remaining
                    });
                }

                if (icon) {
                    panel.appendChild(icon);
                }
            });

            // Обновляем позицию
            updatePanelPosition();
        }

        // === ОБНОВЛЕНИЕ ТАЙМЕРОВ ===
        function updateTimers() {
            const panel = document.getElementById('active-processes-panel');
            if (!panel) return;

            const icons = panel.querySelectorAll('.process-icon');
            const constructions = window.userData?.constructions || [];

            icons.forEach((icon, index) => {
                if (constructions[index]) {
                    const timer = icon.querySelector('.process-timer');
                    if (timer && window.formatTimeCurrency) {
                        timer.textContent = window.formatTimeCurrency(constructions[index].time_remaining);
                    }
                }
            });
        }

        // === ФУНКЦИИ ДЛЯ СОВМЕСТИМОСТИ (заглушки) ===
        // Эти функции вызываются из других мест, но теперь не создают элементы на здании
        window.addConstructionVisualization = function(buildingId) {
            console.log('🔨 Визуализация строительства:', buildingId, '(панель рядом с аватаром)');
            window.activeConstructionVisuals.set(buildingId, true);
            updateProcessPanel();
        };

        window.addUpgradeVisualization = function(buildingId) {
            console.log('⚙️ Визуализация улучшения:', buildingId, '(панель рядом с аватаром)');
            window.activeUpgradeVisuals.set(buildingId, true);
            updateProcessPanel();
        };

        window.addSpellResearchVisualization = function() {
            console.log('📖 Визуализация изучения заклинания (панель рядом с аватаром)');
            updateProcessPanel();
        };

        window.addWizardHireVisualization = function() {
            console.log('🧙 Визуализация найма мага (панель рядом с аватаром)');
            updateProcessPanel();
        };

        // === ОБНОВЛЕНИЕ ВСЕЙ ПАНЕЛИ ===
        window.updateProcessPanel = updateProcessPanel;
        window.updateConstructionTimers = updateTimers;

        // === ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ ===
        setInterval(() => {
            updateProcessPanel();
        }, 1000);

        // === СЛУШАТЕЛИ СОБЫТИЙ ===
        window.addEventListener('resize', updatePanelPosition);

        // === CSS АНИМАЦИИ ===
        if (!document.getElementById('process-panel-animations')) {
            const style = document.createElement('style');
            style.id = 'process-panel-animations';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 1; }
                }

                .process-icon {
                    user-select: none;
                    -webkit-user-select: none;
                }
            `;
            document.head.appendChild(style);
        }

        // Первоначальная инициализация
        setTimeout(() => {
            createProcessPanel();
            updateProcessPanel();
        }, 500);

        console.log('  - Компактные значки рядом с аватаром');
        console.log('  - 🔨 строительство, ⚙️ улучшение, 📖 заклинание, 🧙 маг');
        console.log('  - Автоматическое обновление таймеров');
    }, 100);
})();
