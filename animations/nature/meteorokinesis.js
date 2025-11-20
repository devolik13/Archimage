console.log('✅ meteorokinesis.js (улучшенный) загружен');

(function() {
    let activeMeteoEffect = null;
    let casterAuras = new Map(); // Ауры вокруг кастеров
    
    function showMeteorokinesisEffect(casterType, level, wizard) {
    	// КРИТИЧНО: При быстрой симуляции пропускаем анимацию
    	if (window.fastSimulation) {
    	    console.log('⚡ Быстрая симуляция: пропуск анимации Метеорокинез');
    	    return;
    	}

    	const container = window.pixiCore?.getEffectsContainer();
    	if (!container) return;
    
    	// Удаляем старый глобальный эффект
    	if (activeMeteoEffect) {
    	    container.removeChild(activeMeteoEffect);
    	    activeMeteoEffect.destroy({ children: true });
    	}
    
    	// === ГЛОБАЛЬНЫЙ ЭФФЕКТ НА ВСЁ ПОЛЕ ===
    	const weatherContainer = new PIXI.Container();
    	weatherContainer.alpha = 0;
    
    	// Полупрозрачное свечение на всё поле
    	const fullFieldGlow = new PIXI.Graphics();
    	fullFieldGlow.beginFill(0x4ade80, 0.08); // Зеленоватое свечение
    	fullFieldGlow.drawRect(0, 0, 800, 600); // Покрывает всё поле
    	fullFieldGlow.endFill();
    	weatherContainer.addChild(fullFieldGlow);
    
    	// Пульсирующие волны энергии по всему полю
    	const energyWaves = [];
    	for (let i = 0; i < 3; i++) {
    	    const wave = new PIXI.Graphics();
    	    wave.lineStyle(2, 0x4ade80, 0.3);
    	    wave.drawRect(50 + i * 20, 50 + i * 20, 700 - i * 40, 500 - i * 40);
    	    wave.alpha = 0.3 - i * 0.1;
    	    energyWaves.push(wave);
    	    weatherContainer.addChild(wave);
    	}
    	
    	// Природные частицы по всему полю
    	const particles = [];
    	for (let i = 0; i < 50; i++) { // Больше частиц
    	    const particle = new PIXI.Graphics();
    	    particle.beginFill(0x4ade80, 0.6);
    	    particle.drawCircle(0, 0, Math.random() * 3 + 1);
    	    particle.endFill();
    	    
    	    particle.x = Math.random() * 800;
    	    particle.y = Math.random() * 600; // По всей высоте
    	    
    	    particles.push({
    	        sprite: particle,
    	        speedX: (Math.random() - 0.5) * 2,
    	        speedY: (Math.random() - 0.5) * 2,
    	        phase: Math.random() * Math.PI * 2
    	    });
    	    
    	    weatherContainer.addChild(particle);
    	}
    	
    	// Текст уровня
    	const levelText = new PIXI.Text(`Метеокинез Ур.${level}`, {
    	    fontFamily: 'Arial',
    	    fontSize: 18,
    	    fontWeight: 'bold',
    	    fill: [0x4ade80, 0x22c55e],
    	    stroke: 0x000000,
    	    strokeThickness: 3,
    	    dropShadow: true,
    	    dropShadowColor: 0x000000,
    	    dropShadowBlur: 4,
    	    dropShadowDistance: 2
    	});
    	levelText.x = 350; // По центру
    	levelText.y = 10;
    	weatherContainer.addChild(levelText);
    	
    	container.addChild(weatherContainer);
    	activeMeteoEffect = weatherContainer;
    	
    	// Аура вокруг кастера (если передан)
    	if (wizard) {
    	    createCasterAura(wizard, casterType, level);
    	}
    	
    	// Плавное появление
    	const fadeIn = () => {
    	    weatherContainer.alpha += 0.02;
    	    if (weatherContainer.alpha < 0.4) { // Немного прозрачнее
    	        requestAnimationFrame(fadeIn);
    	    }
    	};
    	fadeIn();
    	
    	// Анимация
    	const animateEffect = () => {
    	    if (!window.pixiAnimUtils.isValid(weatherContainer)) return;
    	    
    	    const time = Date.now() * 0.001;
    	    
    	    // Пульсация свечения
    	    fullFieldGlow.alpha = 0.08 + Math.sin(time * 0.5) * 0.03;
    	    
    	    // Пульсация волн
    	    energyWaves.forEach((wave, i) => {
    	        wave.alpha = (0.3 - i * 0.1) + Math.sin(time + i * 0.5) * 0.1;
    	        wave.scale.set(1 + Math.sin(time * 0.5 + i) * 0.02);
    	    });
    	    
    	    // Движение частиц по всему полю
    	    particles.forEach(p => {
    	        p.sprite.x += p.speedX;
    	        p.sprite.y += p.speedY;
    	        
    	        // Зацикливание по всему полю
    	        if (p.sprite.x > 820) p.sprite.x = -20;
    	        if (p.sprite.x < -20) p.sprite.x = 820;
    	        if (p.sprite.y > 620) p.sprite.y = -20;
    	        if (p.sprite.y < -20) p.sprite.y = 620;
    	        
    	        // Мерцание
    	        p.sprite.alpha = 0.4 + Math.sin(time * 3 + p.phase) * 0.4;
    	    });
    	    
    	    // Пульсация текста
    	    levelText.scale.set(1 + Math.sin(time * 2) * 0.03);
    	    
    	    requestAnimationFrame(animateEffect);
    	};
    	animateEffect();
    }
    
    function createCasterAura(wizard, casterType, level) {
        // Находим спрайт мага
        const col = casterType === 'player' ? 5 : 0;
        let position = -1;
        
        if (casterType === 'player') {
            position = window.playerFormation.findIndex(id => id === wizard.id);
        } else {
            position = window.enemyFormation.findIndex(w => w && w.id === wizard.id);
        }
        
        if (position === -1) return;
        
        const wizardSprite = window.wizardSprites?.[`${col}_${position}`];
        if (!wizardSprite) return;
        
        const container = window.pixiCore?.getEffectsContainer();
        if (!container) return;
        
        // Удаляем старую ауру если есть
        const oldAura = casterAuras.get(wizard.id);
        if (oldAura) {
            container.removeChild(oldAura);
            oldAura.destroy({ children: true });
        }
        
        // Создаем контейнер ауры
        const auraContainer = new PIXI.Container();
        auraContainer.x = wizardSprite.x;
        auraContainer.y = wizardSprite.y;
        
        // Кольца энергии
        const rings = [];
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.lineStyle(2, 0x4ade80, 0.3);
            ring.drawCircle(0, 0, 30 + i * 15);
            ring.alpha = 0.3 - i * 0.1;
            rings.push({ sprite: ring, radius: 30 + i * 15 });
            auraContainer.addChild(ring);
        }
        
        // Вращающиеся руны природы
        const runes = [];
        for (let i = 0; i < 4; i++) {
            const rune = new PIXI.Text('🍃', {
                fontSize: 14 + level * 2,
                fill: 0x4ade80
            });
            rune.anchor.set(0.5);
            const angle = (Math.PI * 2 / 4) * i;
            rune.x = Math.cos(angle) * 40;
            rune.y = Math.sin(angle) * 40;
            runes.push({ sprite: rune, angle: angle });
            auraContainer.addChild(rune);
        }
        
        container.addChild(auraContainer);
        casterAuras.set(wizard.id, auraContainer);
        
        // Анимация ауры
        const animateAura = () => {
            if (!window.pixiAnimUtils.isValid(auraContainer)) {
                casterAuras.delete(wizard.id);
                return;
            }
            
            const time = Date.now() * 0.001;
            
            // Пульсация колец
            rings.forEach((r, i) => {
                r.sprite.scale.set(1 + Math.sin(time * 2 + i * 0.5) * 0.1);
                r.sprite.alpha = (0.3 - i * 0.1) + Math.sin(time * 3 + i) * 0.1;
            });
            
            // Вращение рун
            runes.forEach((r, i) => {
                r.angle += 0.02;
                r.sprite.x = Math.cos(r.angle) * 40;
                r.sprite.y = Math.sin(r.angle) * 40;
                r.sprite.rotation += 0.05;
            });
            
            requestAnimationFrame(animateAura);
        };
        animateAura();
    }
    
    function showBoostEffect(caster, target) {
        // Визуальный эффект при срабатывании усиления
        const container = window.pixiCore?.getEffectsContainer();
        if (!container) return;
        
        // Находим позиции
        const casterCol = caster.casterType === 'player' ? 5 : 0;
        let casterPos = -1;
        
        if (caster.casterType === 'player') {
            casterPos = window.playerFormation.findIndex(id => id === caster.id);
        } else {
            casterPos = window.enemyFormation.findIndex(w => w && w.id === caster.id);
        }
        
        if (casterPos === -1) return;
        
        const casterSprite = window.wizardSprites?.[`${casterCol}_${casterPos}`];
        if (!casterSprite) return;
        
        // Создаем волну природной энергии
        const wave = new PIXI.Graphics();
        wave.lineStyle(3, 0x4ade80, 0.8);
        wave.drawCircle(0, 0, 10);
        wave.x = casterSprite.x;
        wave.y = casterSprite.y;
        
        container.addChild(wave);
        
        // Анимация расширения волны
        const startTime = Date.now();
        const animate = () => {
            if (!window.pixiAnimUtils.isValid(wave)) return;

            const progress = Math.min((Date.now() - startTime) / 500, 1);
            wave.scale.set(1 + progress * 4);
            wave.alpha = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (wave.parent) container.removeChild(wave);
                wave.destroy();
            }
        };
        animate();
        
        // Текст усиления
        const boostText = new PIXI.Text('+УСИЛЕНИЕ', {
            fontSize: 12,
            fill: 0x4ade80,
            stroke: 0x000000,
            strokeThickness: 2
        });
        boostText.anchor.set(0.5);
        boostText.x = casterSprite.x;
        boostText.y = casterSprite.y - 40;
        
        container.addChild(boostText);
        
        // Анимация текста
        const textStartTime = Date.now();
        const animateText = () => {
            if (!window.pixiAnimUtils.isValid(boostText)) return;

            const progress = Math.min((Date.now() - textStartTime) / 1000, 1);
            boostText.y = casterSprite.y - 40 - progress * 20;
            boostText.alpha = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animateText);
            } else {
                if (boostText.parent) container.removeChild(boostText);
                boostText.destroy();
            }
        };
        animateText();
    }
    
    function weakenEffect() {
        // Визуальное ослабление при истечении блокировки погоды
        if (activeMeteoEffect) {
            const fadeOut = () => {
                activeMeteoEffect.alpha -= 0.02;
                if (activeMeteoEffect.alpha > 0.3) {
                    requestAnimationFrame(fadeOut);
                }
            };
            fadeOut();
        }
    }
    
    function clearMeteoEffect() {
        // Удаление всех эффектов
        if (activeMeteoEffect) {
            const fadeOut = () => {
                activeMeteoEffect.alpha -= 0.05;
                if (activeMeteoEffect.alpha > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    if (activeMeteoEffect.parent) {
                        activeMeteoEffect.parent.removeChild(activeMeteoEffect);
                    }
                    activeMeteoEffect.destroy({ children: true });
                    activeMeteoEffect = null;
                }
            };
            fadeOut();
        }
        
        // Удаляем все ауры
        casterAuras.forEach(aura => {
            if (aura.parent) {
                aura.parent.removeChild(aura);
            }
            aura.destroy({ children: true });
        });
        casterAuras.clear();
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.meteorokinesis = {
        show: showMeteorokinesisEffect,
        showBoost: showBoostEffect,
        weaken: weakenEffect,
        clear: clearMeteoEffect
    };
    
    console.log('🌿 Улучшенный эффект Метеокинеза зарегистрирован');
})();