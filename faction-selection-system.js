// faction-selection-system.js - Fullscreen система с rotation
console.log('✅ faction-selection-system.js загружен');

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
            console.log('✅ Выбрана фракция:', factionId);
            
            const header = document.querySelector('header');
            if (header) {
                header.style.display = 'block';
            }
            
            // Удаляем rotation style
            const rotationStyle = document.getElementById('faction-rotation-style');
            if (rotationStyle) {
                rotationStyle.remove();
            }
            
            if (window.selectFaction) {
                window.selectFaction(factionId);
            }
        } else {
            console.log('⏳ Фракция в разработке:', factionId);
            alert(`🔒 Фракция "${factionId}" будет доступна в будущих обновлениях!`);
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