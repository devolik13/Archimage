// faction-selection-system.js - Fullscreen система с rotation
console.log('✅ faction-selection-system.js загружен');

// Описания фракций с бонусами
const FACTION_DESCRIPTIONS = {
    fire: {
        name: "🔥 ОГОНЬ",
        description: "Разрушительная сила пламени. Маги огня специализируются на прямом уроне и сжигании врагов дотла. Агрессивный стиль боя без компромиссов.",
        bonus: "При любой огненной атаке 10% шанс поджечь врага. Горение наносит 10% от максимального HP цели (до 100 урона) каждый ход в течение 3 ходов."
    },
    water: {
        name: "💧 ВОДА",
        description: "Контроль через холод и лёд. Маги воды замедляют и замораживают противников, ослабляя их атаки и защиту. Тактический стиль ведения боя.",
        bonus: "При водных атаках уровней 1-4: 20% шанс охладить врага (-20% урона). На уровне 5: 50% шанс заморозить (-30% урона)."
    },
    wind: {
        name: "💨 ВЕТЕР",
        description: "Скорость и непредсказуемость бури. Маги ветра полагаются на быстрые атаки и молнии. Внезапные удары сокрушительной силы.",
        bonus: "При любой атаке ветра 5% шанс нанести двойной урон. Удар молнии пробивает любую защиту."
    },
    earth: {
        name: "🪨 ЗЕМЛЯ",
        description: "Несокрушимая мощь камня и стали. Маги земли создают непробиваемые стены и обрушивают на врагов тяжёлые валуны. Защита и разрушение.",
        bonus: "При атаках земли 10% шанс проигнорировать 20% брони противника. Удар камня пробивает защиту."
    },
    nature: {
        name: "🌱 ПРИРОДА",
        description: "Гармония с силами природы. Маги природы призывают существ, исцеляют союзников и усиливают стихийную магию. Баланс атаки и поддержки.",
        bonus: "После применения любого заклинания 5% шанс исцелить случайного союзника на 5% от его максимального здоровья."
    },
    poison: {
        name: "☠️ ЯД",
        description: "Медленная смерть через отравление. Маги яда накладывают смертельные токсины, которые разъедают врага изнутри. Терпение вознаграждается.",
        bonus: "При отравлении врага 5% шанс наложить дополнительный стак яда. Каждый стак наносит 5 урона в начале хода."
    }
};

window.FactionSelection = {
    circles: {
        fire:   { x: 437, y: 75,  radius: 50, active: true },
        earth:  { x: 557, y: 75,  radius: 50, active: true },
        water:  { x: 681, y: 75,  radius: 50, active: true },
        poison: { x: 430, y: 197, radius: 50, active: true },
        wind:   { x: 560, y: 195, radius: 50, active: true },
        nature: { x: 681, y: 197, radius: 50, active: true },
        light:  { x: 432, y: 317, radius: 50, active: false },
        dark:   { x: 560, y: 317, radius: 50, active: false }
    },

    init: function() {
    	console.log('🎨 Инициализация fullscreen выбора фракции');
    
    	const container = document.getElementById('faction-selection');
    	if (!container) return;

    	// СКРЫВАЕМ HEADER
    	const header = document.querySelector('header');
    	if (header) {
    	    header.style.display = 'none';
    	}

    	// Проверяем CSS rotation
    	const isRotated = window.cssRotationActive === true;
    	console.log('🔄 CSS Rotation активен:', isRotated);

    	container.style.cssText = `
    	    position: fixed;
    	    top: 0;
    	    left: 0;
    	    width: 100vw;
    	    height: 100vh;
    	    display: block;
    	    background: #000;
    	    z-index: 9999;
    	    overflow: hidden;
    	`;
	
    	container.innerHTML = '';

    	// Контейнер КАК У ГОРОДА
    	const bgContainer = document.createElement('div');
    	bgContainer.id = 'faction-bg-container';
    	bgContainer.style.cssText = `
    	    position: fixed;
    	    top: 0;
    	    left: 0;
    	    width: 100vw;
    	    height: 100vh;
    	`;

    	// ROTATION через style (как у города!)
    	if (isRotated) {
    	    const rotationStyle = document.getElementById('faction-rotation-style');
    	    if (rotationStyle) {
    	        rotationStyle.remove();
    	    }
    	    
    	    const style = document.createElement('style');
    	    style.id = 'faction-rotation-style';
    	    style.innerHTML = `
    	        #faction-bg-container {
    	            position: fixed !important;
    	            top: 50% !important;
    	            left: 50% !important;
    	            transform: translate(-50%, -50%) rotate(-90deg) !important;
    	            transform-origin: center center !important;
    	            width: 100vh !important;
    	            height: 100vw !important;
    	        }
    	    `;
    	    document.head.appendChild(style);
    	    console.log('✅ Rotation style применен (-90deg)');
    	}

    	// Фоновое изображение КАК У ГОРОДА (position: absolute!)
    	const bgImage = document.createElement('img');
    	bgImage.src = 'assets/faction-background.png';
    	bgImage.id = 'faction-bg-image';
    	bgImage.className = 'faction-background-img';
    	
    	// Масштабирование КАК У ГОРОДА
    	const screenHeight = window.innerHeight;
    	const imageHeight = 512;
    	const imageWidth = 768;
    	const aspectRatio = imageWidth / imageHeight;
    	
    	const scaledHeight = screenHeight;
    	const scaledWidth = scaledHeight * aspectRatio;
    	
    	bgImage.style.cssText = `
    	    position: absolute;
    	    top: 0;
    	    left: 50%;
    	    transform: translateX(-50%);
    	    width: ${scaledWidth}px;
    	    height: ${scaledHeight}px;
    	    z-index: 0;
    	`;
	
    	// Overlay
    	const overlay = document.createElement('div');
    	overlay.id = 'faction-zones-overlay';
    	overlay.style.cssText = `
    	    position: absolute;
    	    top: 0;
    	    left: 0;
    	    width: 100%;
    	    height: 100%;
    	    pointer-events: none;
    	    z-index: 1;
    	`;
	
    	bgContainer.appendChild(bgImage);
    	bgContainer.appendChild(overlay);
    	container.appendChild(bgContainer);
	
    	bgImage.onload = () => {
    	    console.log('✅ Фон загружен');
    	    this.createZones(overlay, bgImage);
    	    this.startTracking(overlay, bgImage);
    	};
	
	console.log('✅ Fullscreen фон создан (как у города)');
    },

    createZones: function(overlay, bgImage) {
        Object.keys(this.circles).forEach(factionId => {
            const circle = this.circles[factionId];
            const zone = this.createCircleZone(factionId, circle);
            overlay.appendChild(zone);
        });

        this.updateZonesPosition(overlay, bgImage);
    },

    createCircleZone: function(factionId, circle) {
        const zone = document.createElement('div');
        zone.className = 'faction-zone';
        zone.dataset.faction = factionId;
        zone.dataset.x = circle.x;
        zone.dataset.y = circle.y;
        zone.dataset.radius = circle.radius;

        zone.style.cssText = `
            position: absolute;
            border-radius: 50%;
            pointer-events: auto;
            cursor: ${circle.active ? 'pointer' : 'not-allowed'};
            background: ${circle.active ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'};
            border: 2px solid ${circle.active ? 'lime' : 'red'};
            transition: all 0.3s;
        `;

        // Подпись
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-shadow: 0 0 3px black;
            pointer-events: none;
        `;
        label.textContent = factionId.toUpperCase();
        zone.appendChild(label);

        // События
        zone.onclick = (e) => {
            e.stopPropagation();
            this.handleClick(factionId, circle.active);
        };

        zone.onmouseenter = () => {
            if (circle.active) {
                zone.style.background = 'rgba(255, 255, 0, 0.5)';
                zone.style.borderColor = 'yellow';
                zone.style.transform = 'scale(1.1)';
            }
        };

        zone.onmouseleave = () => {
            zone.style.background = circle.active ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            zone.style.borderColor = circle.active ? 'lime' : 'red';
            zone.style.transform = 'scale(1)';
        };

        return zone;
    },

    updateZonesPosition: function(overlay, bgImage) {
    	const imgRect = bgImage.getBoundingClientRect();
    	const containerRect = bgImage.parentElement.getBoundingClientRect();
    
    	// Масштаб изображения
    	const scaleX = imgRect.width / 768;
    	const scaleY = imgRect.height / 512;
    
    	// ВАЖНО: Смещение изображения относительно контейнера!
    	const offsetX = imgRect.left - containerRect.left;
    	const offsetY = imgRect.top - containerRect.top;

    	// Обновляем каждую зону
    	const zones = overlay.querySelectorAll('.faction-zone');
    	zones.forEach(zone => {
    	    const x = parseInt(zone.dataset.x);
    	    const y = parseInt(zone.dataset.y);
    	    const radius = parseInt(zone.dataset.radius);
	
    	    const scaledRadius = radius * Math.min(scaleX, scaleY);
    	    const size = scaledRadius * 2;
	
    	    const scaledX = x * scaleX;
    	    const scaledY = y * scaleY;

    	    // Добавляем смещение!
    	    zone.style.left = (scaledX - scaledRadius + offsetX) + 'px';
    	    zone.style.top = (scaledY - scaledRadius + offsetY) + 'px';
    	    zone.style.width = size + 'px';
    	    zone.style.height = size + 'px';
    	});
    },

    startTracking: function(overlay, bgImage) {
        window.addEventListener('resize', () => {
            this.updateZonesPosition(overlay, bgImage);
        });

        setInterval(() => {
            this.updateZonesPosition(overlay, bgImage);
        }, 100);
    },

    handleClick: function(factionId, isActive) {
        if (isActive) {
            console.log('✅ Клик на фракцию:', factionId);
            this.showFactionPanel(factionId);
        } else {
            console.log('⏳ Фракция в разработке:', factionId);
            alert(`🔒 Фракция "${factionId}" будет доступна в будущих обновлениях!`);
        }
    },

    showFactionPanel: function(factionId) {
        const factionData = FACTION_DESCRIPTIONS[factionId];
        if (!factionData) {
            console.error('❌ Описание фракции не найдено:', factionId);
            return;
        }

        // Удаляем старую панель если есть
        this.hideFactionPanel();

        // Создаем панель
        const panel = document.createElement('div');
        panel.id = 'faction-description-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: -50vw;
            width: 50vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            border-right: 2px solid #ffd700;
            z-index: 10000;
            padding: 40px;
            box-sizing: border-box;
            overflow-y: auto;
            transition: left 0.3s ease-out;
            color: white;
            font-family: Arial, sans-serif;
        `;

        // Содержимое панели
        panel.innerHTML = `
            <div style="position: relative;">
                <button id="close-faction-panel" style="
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px 10px;
                ">✕</button>

                <h1 style="
                    font-size: 36px;
                    margin-bottom: 30px;
                    color: #ffd700;
                ">${factionData.name}</h1>

                <div style="margin-bottom: 30px;">
                    <h3 style="
                        font-size: 18px;
                        color: #aaa;
                        margin-bottom: 10px;
                    ">ОПИСАНИЕ</h3>
                    <p style="
                        font-size: 16px;
                        line-height: 1.6;
                    ">${factionData.description}</p>
                </div>

                <hr style="
                    border: none;
                    border-top: 1px solid #444;
                    margin: 30px 0;
                ">

                <div style="margin-bottom: 40px;">
                    <h3 style="
                        font-size: 18px;
                        color: #ffd700;
                        margin-bottom: 10px;
                    ">ФРАКЦИОННЫЙ БОНУС</h3>
                    <p style="
                        font-size: 16px;
                        line-height: 1.6;
                        color: #90EE90;
                    ">${factionData.bonus}</p>
                </div>

                <div style="
                    display: flex;
                    gap: 20px;
                    margin-top: 50px;
                ">
                    <button id="cancel-faction-btn" style="
                        flex: 1;
                        padding: 15px 30px;
                        background: #666;
                        border: 2px solid #999;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        border-radius: 5px;
                        transition: all 0.2s;
                    ">Отмена</button>
                    <button id="select-faction-btn" data-faction="${factionId}" style="
                        flex: 2;
                        padding: 15px 30px;
                        background: linear-gradient(to bottom, #ffd700, #ffaa00);
                        border: 2px solid #ffd700;
                        color: #000;
                        font-size: 18px;
                        font-weight: bold;
                        cursor: pointer;
                        border-radius: 5px;
                        transition: all 0.2s;
                    ">Выбрать эту фракцию</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Анимация появления
        setTimeout(() => {
            panel.style.left = '0';
        }, 10);

        // Обработчики событий
        document.getElementById('close-faction-panel').onclick = () => {
            this.hideFactionPanel();
        };

        document.getElementById('cancel-faction-btn').onclick = () => {
            this.hideFactionPanel();
        };

        document.getElementById('select-faction-btn').onclick = () => {
            this.confirmFactionSelection(factionId);
        };

        // Закрытие по клику вне панели
        const handleOutsideClick = (e) => {
            if (!panel.contains(e.target) &&
                !e.target.closest('.faction-zone')) {
                this.hideFactionPanel();
            }
        };

        // Даем небольшую задержку чтобы не закрыть сразу после открытия
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
            panel._outsideClickHandler = handleOutsideClick;
        }, 100);
    },

    hideFactionPanel: function() {
        const panel = document.getElementById('faction-description-panel');
        if (panel) {
            // Удаляем обработчик клика вне области
            if (panel._outsideClickHandler) {
                document.removeEventListener('click', panel._outsideClickHandler);
            }

            // Анимация закрытия
            panel.style.left = '-50vw';
            setTimeout(() => {
                panel.remove();
            }, 300);
        }
    },

    confirmFactionSelection: function(factionId) {
        console.log('✅ Подтверждён выбор фракции:', factionId);

        // Закрываем панель
        this.hideFactionPanel();

        // Показываем header обратно
        const header = document.querySelector('header');
        if (header) {
            header.style.display = 'block';
        }

        // Удаляем rotation style
        const rotationStyle = document.getElementById('faction-rotation-style');
        if (rotationStyle) {
            rotationStyle.remove();
        }

        // Вызываем selectFaction
        if (window.selectFaction) {
            window.selectFaction(factionId);
        }
    }
};

// Переопределяем showFactionSelection
window.showFactionSelection = function() {
    console.log('🎨 Показываем fullscreen выбор фракции');
    
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'none';
    }
    
    window.FactionSelection.init();
};