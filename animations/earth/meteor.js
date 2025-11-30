// battle/renderer/animations/earth/meteor.js - Анимация метеорита


(function() {
    // Хранилище активных метеоритов
    const activeMeteors = [];
    
    function playMeteorAnimation(params) {
        const { targetCol, targetRow, onHit } = params;

        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Метеорит');
            if (onHit) onHit();
            return;
        }

        const effectsContainer = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!effectsContainer || !gridCells) {
            console.warn('Не могу создать метеорит - нет контейнера');
            if (onHit) onHit();
            return;
        }
        
        const targetCell = gridCells[targetCol]?.[targetRow];
        
        if (!targetCell) {
            console.warn('Не найдена целевая клетка для метеорита');
            if (onHit) onHit();
            return;
        }
        
        // Конечная точка - центр клетки
        const endX = targetCell.x + targetCell.width / 2;
        const endY = targetCell.y + targetCell.height / 2;
        
        // Стартовая точка - высоко над целевой колонкой
        const startX = endX - 150 * targetCell.cellScale; // Смещение по диагонали
        const startY = -200 * targetCell.cellScale; // Высоко за экраном
        
        // Загружаем текстуру метеорита
        const meteorTexturePath = 'images/spells/earth/meteor/meteor_sprite.png';
        
        PIXI.Assets.load(meteorTexturePath).then(texture => {
            if (!texture || !texture.valid) {
                console.warn('Не удалось загрузить текстуру метеорита');
                createFallbackMeteor();
                return;
            }
            
            // Создаем спрайт метеорита
            const meteorSprite = new PIXI.Sprite(texture);
            meteorSprite.x = startX;
            meteorSprite.y = startY;
            meteorSprite.anchor.set(0.5);
            
            // Масштабируем метеорит (крупнее камешка)
            const targetSize = targetCell.cellScale * 80; // Крупный метеорит
            const scale = targetSize / 768; // Исходный размер 768px
            meteorSprite.scale.set(scale * 0.3); // Начинаем с малого размера
            
            // Начальный поворот по направлению падения
            meteorSprite.rotation = Math.atan2(endY - startY, endX - startX) + Math.PI / 4;
            
            effectsContainer.addChild(meteorSprite);
            
            // Создаём огненный шлейф
            const trail = createFireTrail(effectsContainer, targetCell.cellScale);
            
            // Анимация падения
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            const duration = Math.max(600, distance * 2); // Медленнее камешка
            const startTime = Date.now();
            
            const rotationSpeed = 0.08; // Медленное вращение
            
            const animate = () => {
                if (!meteorSprite.parent) return;
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Прямая траектория с ускорением
                const easeProgress = progress * progress; // Квадратичное ускорение
                meteorSprite.x = startX + (endX - startX) * easeProgress;
                meteorSprite.y = startY + (endY - startY) * easeProgress;
                
                // Медленное вращение
                meteorSprite.rotation += rotationSpeed;
                
                // Увеличение при приближении
                const scaleFactor = 0.3 + progress * 0.7; // От 0.3 до 1.0
                meteorSprite.scale.set(scale * scaleFactor);
                
                // Обновляем след
                updateFireTrail(trail, meteorSprite.x, meteorSprite.y, progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Удаляем метеорит
                    if (meteorSprite.parent) {
                        effectsContainer.removeChild(meteorSprite);
                        meteorSprite.destroy();
                    }
                    
                    // Очищаем след
                    clearFireTrail(trail, effectsContainer);
                    
                    // Эффект взрыва
                    createExplosionEffect(endX, endY, targetCell.cellScale);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activeMeteors.push({ sprite: meteorSprite, trail: trail });
            
        }).catch(err => {
            console.warn('Ошибка загрузки текстуры метеорита:', err);
            createFallbackMeteor();
        });
        
        // Fallback - простая графика
        function createFallbackMeteor() {
            const meteor = new PIXI.Graphics();
            
            // Рисуем метеорит (камень + огонь)
            // Каменная часть
            meteor.beginFill(0x8B7355, 1);
            meteor.drawCircle(0, 0, 20);
            meteor.endFill();
            
            // Огненная часть
            meteor.beginFill(0xFF4500, 0.8);
            meteor.drawCircle(-8, -8, 12);
            meteor.endFill();
            
            meteor.beginFill(0xFFAA00, 0.6);
            meteor.drawCircle(-12, -12, 8);
            meteor.endFill();
            
            meteor.x = startX;
            meteor.y = startY;
            
            effectsContainer.addChild(meteor);
            
            // Анимация
            const duration = 700;
            const startTime = Date.now();
            const rotationSpeed = 0.1;
            
            const animate = () => {
                if (!window.pixiAnimUtils.isValid(meteor)) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Прямая траектория с ускорением
                const easeProgress = progress * progress;
                meteor.x = startX + (endX - startX) * easeProgress;
                meteor.y = startY + (endY - startY) * easeProgress;

                // Вращение
                meteor.rotation += rotationSpeed;

                // Увеличение
                const scaleFactor = 0.5 + progress * 0.5;
                meteor.scale.set(scaleFactor);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (meteor.parent) {
                        effectsContainer.removeChild(meteor);
                    }
                    
                    createExplosionEffect(endX, endY, 1);
                    
                    if (onHit) onHit();
                }
            };
            
            animate();
            activeMeteors.push({ sprite: meteor, trail: null });
        }
    }
    
    // Создание огненного следа
    function createFireTrail(container, scale) {
        const trail = [];
        const trailLength = 8;
        
        for (let i = 0; i < trailLength; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFF4500, 0.8 - i * 0.1);
            particle.drawCircle(0, 0, (8 - i) * scale);
            particle.endFill();
            particle.visible = false;
            container.addChild(particle);
            trail.push(particle);
        }
        
        return trail;
    }
    
    // Обновление следа
    function updateFireTrail(trail, x, y, progress) {
        if (!trail || trail.length === 0) return;
        
        trail.forEach((particle, index) => {
            if (progress > index * 0.05) {
                particle.visible = true;
                particle.x = x - (index + 1) * 15;
                particle.y = y - (index + 1) * 15;
                particle.alpha = (0.8 - index * 0.1) * (1 - progress * 0.5);
            }
        });
    }
    
    // Очистка следа
    function clearFireTrail(trail, container) {
        if (!trail) return;
        trail.forEach(particle => {
            if (particle.parent) {
                container.removeChild(particle);
            }
        });
    }
    
    // Эффект взрыва при попадании
    function createExplosionEffect(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        // Огненная вспышка
        const explosion = new PIXI.Graphics();
        explosion.beginFill(0xFF4500, 0.9);
        explosion.drawCircle(0, 0, 40 * scale);
        explosion.endFill();
        
        explosion.beginFill(0xFFAA00, 0.7);
        explosion.drawCircle(0, 0, 25 * scale);
        explosion.endFill();
        
        explosion.x = x;
        explosion.y = y;
        explosion.scale.set(0.1);
        
        effectsContainer.addChild(explosion);
        
        // Анимация взрыва
        const explosionStart = Date.now();
        const explosionDuration = 400;
        
        const animateExplosion = () => {
            const progress = Math.min((Date.now() - explosionStart) / explosionDuration, 1);
            
            // Расширение и затухание
            explosion.scale.set(0.1 + progress * 2);
            explosion.alpha = 0.9 * (1 - progress);
            
            if (progress < 1 && explosion.parent) {
                requestAnimationFrame(animateExplosion);
            } else {
                if (explosion.parent) effectsContainer.removeChild(explosion);
            }
        };
        animateExplosion();
        
        // Дым
        createSmoke(x, y, scale);
        
        // Осколки камня
        createRockFragments(x, y, scale, 12);
        
        // Огненные частицы
        createFireParticles(x, y, scale, 8);
    }
    
    // Дым от взрыва
    function createSmoke(x, y, scale) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < 3; i++) {
            const smoke = new PIXI.Graphics();
            smoke.beginFill(0x555555, 0.5);
            smoke.drawCircle(0, 0, 30 * scale);
            smoke.endFill();
            
            smoke.x = x + (Math.random() - 0.5) * 20;
            smoke.y = y + (Math.random() - 0.5) * 20;
            smoke.scale.set(0.1);
            
            effectsContainer.addChild(smoke);
            
            const startTime = Date.now();
            const duration = 600;
            const vx = (Math.random() - 0.5) * 2;
            const vy = -2 - Math.random() * 2;
            
            const animateSmoke = () => {
                const progress = Math.min((Date.now() - startTime) / duration, 1);
                
                smoke.x += vx;
                smoke.y += vy;
                smoke.scale.set(0.1 + progress * 1.5);
                smoke.alpha = 0.5 * (1 - progress);
                
                if (progress < 1 && smoke.parent) {
                    requestAnimationFrame(animateSmoke);
                } else {
                    if (smoke.parent) effectsContainer.removeChild(smoke);
                }
            };
            
            setTimeout(() => animateSmoke(), i * 100);
        }
    }
    
    // Каменные осколки
    function createRockFragments(x, y, scale, count = 12) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < count; i++) {
            const fragment = new PIXI.Graphics();
            fragment.beginFill(0x8B7355, 0.9);
            
            // Случайная форма осколка
            const size = 3 + Math.random() * 4;
            fragment.drawPolygon([0, 0, size, -size/2, size*0.8, size]);
            fragment.endFill();
            
            fragment.x = x;
            fragment.y = y;
            
            effectsContainer.addChild(fragment);
            
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
            const speed = 3 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 3; // Летят вверх
            
            const startTime = Date.now();
            const duration = 500;
            
            const animateFragment = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                fragment.x += vx * (1 - progress * 0.5);
                fragment.y += vy * (1 - progress * 0.5) + progress * 6; // Падение
                fragment.alpha = 0.9 * (1 - progress);
                fragment.rotation += 0.4;
                
                if (progress < 1 && fragment.parent) {
                    requestAnimationFrame(animateFragment);
                } else {
                    if (fragment.parent) effectsContainer.removeChild(fragment);
                }
            };
            animateFragment();
        }
    }
    
    // Огненные частицы
    function createFireParticles(x, y, scale, count = 8) {
        const effectsContainer = window.pixiCore?.getEffectsContainer();
        if (!effectsContainer) return;
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFF4500, 0.8);
            particle.drawCircle(0, 0, 4 * scale);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            
            effectsContainer.addChild(particle);
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            
            const startTime = Date.now();
            const duration = 400;
            
            const animateParticle = () => {
                const progress = Math.min((Date.now() - startTime) / duration, 1);
                
                particle.x += vx * (1 - progress);
                particle.y += vy * (1 - progress) + progress * 4;
                particle.alpha = 0.8 * (1 - progress);
                particle.scale.set(1 - progress * 0.5);
                
                if (progress < 1 && particle.parent) {
                    requestAnimationFrame(animateParticle);
                } else {
                    if (particle.parent) effectsContainer.removeChild(particle);
                }
            };
            animateParticle();
        }
    }
    
    // Очистка всех метеоритов
    function clearAll() {
        activeMeteors.forEach(meteor => {
            if (meteor.sprite && meteor.sprite.parent) {
                meteor.sprite.parent.removeChild(meteor.sprite);
                meteor.sprite.destroy && meteor.sprite.destroy();
            }
            
            if (meteor.trail) {
                meteor.trail.forEach(particle => {
                    if (particle && particle.parent) {
                        particle.parent.removeChild(particle);
                    }
                });
            }
        });
        activeMeteors.length = 0;
        console.log('☄️ Все метеориты очищены');
    }
    
    // Регистрация
    if (!window.spellAnimations) window.spellAnimations = {};
    window.spellAnimations.meteor = {
        play: playMeteorAnimation,
        clearAll: clearAll
    };
    
    console.log('☄️ Анимация "Метеорит" зарегистрирована');
})();