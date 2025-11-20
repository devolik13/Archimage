// battle/renderer/pixi-wizards.js - Отображение магов с уникальными спрайтами для каждой фракции
console.log('✅ pixi-wizards.js загружен (версия с фракциями)');

(function() {
    // Хранилище спрайтов магов
    const wizardSprites = {};
    
    // Хранилище загруженных текстур по фракциям
    const factionTextures = {};
    
    // Хранилище активных анимаций
    const activeAnimations = new Set();
    const activeTimeouts = new Set();
    
    // Конфигурация спрайтов по фракциям
    const FACTION_SPRITES_CONFIG = {
        nature: {
            idle: 'images/wizards/nature/idle.png',
            cast: 'images/wizards/nature/cast.png',
            death: 'images/wizards/nature/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350 // Масштаб для спрайта 256x256
        },
        fire: {
            idle: 'images/wizards/fire/idle.png',
            cast: 'images/wizards/fire/cast.png',
            death: 'images/wizards/fire/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350
        },
        water: {
            idle: 'images/wizards/water/idle.png',
            cast: 'images/wizards/water/cast.png',
            death: 'images/wizards/water/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350
        },
        earth: {
            idle: 'images/wizards/earth/idle.png',
            cast: 'images/wizards/earth/cast.png',
            death: 'images/wizards/earth/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350
        },
        wind: {
            idle: 'images/wizards/wind/idle.png',
            cast: 'images/wizards/wind/cast.png',
            death: 'images/wizards/wind/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350
        },
        poison: {
            idle: 'images/wizards/poison/idle.png',
            cast: 'images/wizards/poison/cast.png',
            death: 'images/wizards/poison/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.350, // Масштаб для спрайта 256x256
            reverseOnDeath: true // Проигрывать анимацию смерти в обратном порядке
        },
        goblin: {
            idle: 'images/enemies/goblin/idle.png',
            cast: 'images/enemies/goblin/attack.png',
            death: 'images/enemies/goblin/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.245 // Уменьшено на 30% (0.350 * 0.7)
        },
        fire_elemental: {
            idle: 'images/enemies/fire_elemental/idle.png',
            cast: 'images/enemies/fire_elemental/cast.png',
            death: 'images/enemies/fire_elemental/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.700 // В 2 раза больше гоблина - занимает 4 клетки (2x2)
        },
        water_elemental: {
            idle: 'images/enemies/water_elemental/idle.png',
            cast: 'images/enemies/water_elemental/cast.png',
            death: 'images/enemies/water_elemental/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.700
        },
        wind_elemental: {
            idle: 'images/enemies/wind_elemental/idle.png',
            cast: 'images/enemies/wind_elemental/cast.png',
            death: 'images/enemies/wind_elemental/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.700
        },
        earth_elemental: {
            idle: 'images/enemies/earth_elemental/idle.png',
            cast: 'images/enemies/earth_elemental/cast.png',
            death: 'images/enemies/earth_elemental/death.png',
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 8,
            animationSpeed: 0.15,
            scale: 0.700
        }
    };
    
    // Ссылки на контейнеры и ресурсы
    let unitsContainer = null;
    let gridCells = null;
    let fireAtlas = null;
    let fireAttackAtlas = null;
    
    // Безопасная проверка спрайта
    function isSpriteValid(sprite) {
        return sprite && 
               sprite.transform && 
               !sprite.destroyed &&
               sprite.parent;
    }
    
    // Безопасный setTimeout
    function safeSetTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            activeTimeouts.delete(timeoutId);
            callback();
        }, delay);
        activeTimeouts.add(timeoutId);
        return timeoutId;
    }
    
    // Загрузка спрайт-листа и создание кадров
    async function loadSpriteSheet(path, frameWidth, frameHeight, frameCount) {
        try {
            console.log(`📥 Загружаем спрайт-лист: ${path}`);
            
            // Загружаем текстуру
            const texture = await PIXI.Assets.load(path);
            
            if (!texture || !texture.valid) {
                console.error(`❌ Не удалось загрузить текстуру: ${path}`);
                return null;
            }
            
            // Создаем массив кадров
            const frames = [];
            for (let i = 0; i < frameCount; i++) {
                const rect = new PIXI.Rectangle(
                    i * frameWidth,
                    0,
                    frameWidth,
                    frameHeight
                );
                const frame = new PIXI.Texture(texture.baseTexture, rect);
                frames.push(frame);
            }
            
            console.log(`✅ Загружено ${frames.length} кадров из ${path}`);
            return frames;
            
        } catch (error) {
            console.error(`❌ Ошибка загрузки спрайт-листа ${path}:`, error);
            return null;
        }
    }
    
    // Загрузка текстур для фракции
    async function loadFactionTextures(faction) {
        // Если уже загружены, возвращаем
        if (factionTextures[faction]) {
            return factionTextures[faction];
        }
        
        const config = FACTION_SPRITES_CONFIG[faction];
        if (!config || config.useAtlas) {
            return null; // Используем атлас для этой фракции
        }
        
        console.log(`🎨 Загружаем текстуры для фракции ${faction}`);
        
        const textures = {
            idle: null,
            cast: null,
            death: null
        };
        
        // Загружаем все спрайт-листы
        if (config.idle) {
            textures.idle = await loadSpriteSheet(
                config.idle,
                config.frameWidth,
                config.frameHeight,
                config.frameCount
            );
        }
        
        if (config.cast) {
            textures.cast = await loadSpriteSheet(
                config.cast,
                config.frameWidth,
                config.frameHeight,
                config.frameCount
            );
        }
        
        if (config.death) {
            textures.death = await loadSpriteSheet(
                config.death,
                config.frameWidth,
                config.frameHeight,
                config.frameCount
            );
        }
        
        // Сохраняем в кэш
        factionTextures[faction] = textures;
        
        console.log(`✅ Текстуры фракции ${faction} загружены:`, {
            idle: textures.idle?.length || 0,
            cast: textures.cast?.length || 0,
            death: textures.death?.length || 0
        });
        
        return textures;
    }
    
    // Определение фракции мага
    function getWizardFaction(col, row) {
        // Для врагов (col === 0)
        if (col === 0) {
            const enemy = window.enemyFormation?.[row];
            if (enemy) {
                const enemyWizard = window.enemyWizards?.find(w => w.id === enemy.id);

                // Если это элементаль-босс - используем специальные спрайты
                if (enemyWizard && enemyWizard.isElemental) {
                    const elementalType = `${enemyWizard.faction}_elemental`;
                    console.log(`🔥 Элементаль обнаружен: ${enemyWizard.name}, используем спрайты ${elementalType}`);
                    return elementalType;
                }

                // Если это обычный PVE враг - используем спрайты гоблинов/орков/троллей
                if (enemyWizard && enemyWizard.isAdventureEnemy) {
                    console.log(`🎯 PvE враг обнаружен: ${enemyWizard.name}, используем спрайты гоблина`);
                    return 'goblin';
                }

                // Иначе используем фракцию врага (PvP)
                if (enemy.faction) {
                    console.log(`🎯 PvP враг с фракцией: ${enemy.faction}`);
                    return enemy.faction;
                }
            }
        }

        // Для игроков (col === 5)
        if (col === 5) {
            const wizardId = window.playerFormation?.[row];
            if (wizardId) {
                const wizard = window.playerWizards?.find(w => w.id === wizardId);
                if (wizard && wizard.faction) {
                    return wizard.faction;
                }
            }
        }

        // По умолчанию используем фракцию игрока
        return window.userData?.faction || 'fire';
    }
    
    // Инициализация модуля
    function init() {
        // Всегда получаем свежие ссылки
        if (window.pixiCore) {
            unitsContainer = window.pixiCore.getUnitsContainer();
            gridCells = window.pixiCore.getGridCells();
            
            // Атласы для старой системы
            if (window.pixiCore.getAtlas) {
                fireAtlas = window.pixiCore.getAtlas('fire');
                fireAttackAtlas = window.pixiCore.getAtlas('fireAttack');
            }
        }
        
        if (!unitsContainer || !gridCells) {
            console.warn('⚠️ pixi-wizards: Не могу инициализировать - нет контейнеров');
            return false;
        }
        
        console.log('✅ pixi-wizards инициализирован');
        return true;
    }
    
    // Создание спрайта мага с учетом фракции
    async function createWizardSprite(type, col, row) {
        // Проверяем инициализацию
        if (!gridCells) {
            init();
            if (!gridCells) {
                console.error('gridCells не инициализирован');
                return null;
            }
        }
        
        const cellData = gridCells?.[col]?.[row];
        if (!cellData) {
            console.error(`Не найдена ячейка для позиции ${col}_${row}`);
            return null;
        }
        
        // Определяем фракцию мага
        const faction = getWizardFaction(col, row);
        const config = FACTION_SPRITES_CONFIG[faction];
        
        console.log(`🧙 Создаем мага фракции ${faction} на позиции ${col}_${row}`);
        
        const container = new PIXI.Container();
        const scale = cellData.cellScale || 1;
        
        // Создаем спрайт мага
        let sprite;
        
        // Проверяем, используем ли мы новую систему или атлас
        if (config && !config.useAtlas) {
            // Загружаем текстуры фракции
            const textures = await loadFactionTextures(faction);
            
            if (textures && textures.idle && textures.idle.length > 0) {
                // Создаем анимированный спрайт из загруженных кадров
                sprite = new PIXI.AnimatedSprite(textures.idle);
                sprite.animationSpeed = config.animationSpeed || 0.15;
                sprite.anchor.set(0.5);
                sprite.scale.set(scale * (config.scale || 0.5));
                sprite.loop = true; // Зацикливаем idle анимацию
                sprite.play();

                // ИСПРАВЛЕНО: Сохраняем базовый scale для возврата после анимаций
                sprite.baseScaleX = sprite.scale.x;
                sprite.baseScaleY = sprite.scale.y;

                // Зеркалим для игрока (смотрит влево)
                if (type === 'player') {
                    sprite.scale.x *= -1;
                    sprite.baseScaleX = sprite.scale.x; // Обновляем базовый scale после зеркалирования
                }

                // Дополнительное отражение для фракции fire (спрайты смотрят в другую сторону)
                if (faction === 'fire') {
                    sprite.scale.x *= -1;
                    sprite.baseScaleX = sprite.scale.x; // Обновляем базовый scale после зеркалирования
                }
                
                // Сохраняем кадры для анимаций
                container.idleFrames = textures.idle;
                container.attackFrames = textures.cast;
                container.deathFrames = textures.death;
                container.faction = faction;

                console.log(`✅ Создан маг ${faction} с анимациями:`, {
                    idle: textures.idle?.length || 0,
                    attack: textures.cast?.length || 0,
                    death: textures.death?.length || 0
                });
                console.log(`   🎬 Attack frames загружены из: ${config.cast}`);
            }
        } else if (fireAtlas) {
            // Используем старую систему с атласом для других фракций
            console.log('📦 Используем атлас для фракции', faction);
            
            const idleFrames = Object.keys(fireAtlas.textures)
                .filter(key => key.includes('IDLE'))
                .map(key => fireAtlas.textures[key]);
                
            if (idleFrames.length > 0) {
                sprite = new PIXI.AnimatedSprite(idleFrames);
                sprite.animationSpeed = 0.1;
                sprite.anchor.set(0.5);
                sprite.scale.set(scale * (config?.scale || 0.15));
                sprite.loop = true; // Зацикливаем idle анимацию
                sprite.play();

                // ИСПРАВЛЕНО: Сохраняем базовый scale для возврата после анимаций
                sprite.baseScaleX = sprite.scale.x;
                sprite.baseScaleY = sprite.scale.y;

                if (type === 'player') {
                    sprite.scale.x *= -1;
                    sprite.baseScaleX = sprite.scale.x; // Обновляем базовый scale после зеркалирования
                }

                container.idleFrames = idleFrames;
                
                if (fireAttackAtlas) {
                    const attackFrames = Object.keys(fireAttackAtlas.textures)
                        .filter(key => key.includes('ATTACK'))
                        .map(key => fireAttackAtlas.textures[key]);
                    
                    if (attackFrames.length > 0) {
                        container.attackFrames = attackFrames;
                    }
                }
            }
        }
        
        // Fallback на простую графику
        if (!sprite) {
            console.log('⚠️ Используем fallback спрайт');
            sprite = new PIXI.Graphics();
            
            // Цвет зависит от фракции
            const factionColors = {
                nature: 0x4ade80,
                fire: 0xff6b6b,
                water: 0x3b82f6,
                earth: 0x92400e,
                wind: 0x06b6d4,
                poison: 0xa855f7
            };
            
            const color = type === 'player' ? 
                (factionColors[faction] || 0x4ade80) : 
                0xef4444;
            
            sprite.beginFill(color);
            sprite.drawCircle(0, 0, 15 * scale);
            sprite.endFill();
            sprite.beginFill(0xffffff);
            sprite.drawCircle(-5 * scale, -5 * scale, 5 * scale);
            sprite.drawCircle(5 * scale, -5 * scale, 5 * scale);
            sprite.endFill();
        }
        
        sprite.x = cellData.x + cellData.width / 2;
        sprite.y = cellData.y + cellData.height / 2;
        
        container.sprite = sprite;
        
        // HP бар
        const hpBar = new PIXI.Container();
        const hpBarBg = new PIXI.Graphics();
        hpBarBg.beginFill(0x000000, 0.5);
        hpBarBg.drawRect(-20, 0, 40, 5);
        hpBarBg.endFill();
        
        const hpBarFill = new PIXI.Graphics();
        hpBarFill.beginFill(0x4ade80);
        hpBarFill.drawRect(-20, 0, 40, 5);
        hpBarFill.endFill();
        
        hpBar.addChild(hpBarBg);
        hpBar.addChild(hpBarFill);
        hpBar.x = sprite.x;
        hpBar.y = sprite.y + 25 * scale;
        
        container.hpBar = hpBar;
        container.hpBarFill = hpBarFill;
        
        // Добавляем в контейнер
        if (unitsContainer) {
            unitsContainer.addChild(sprite);
            unitsContainer.addChild(hpBar);
        }
        
        const key = `${col}_${row}`;
        wizardSprites[key] = container;
        
        console.log(`✅ Маг создан на позиции ${key}`);
        
        return container;
    }
    
    // Анимация атаки мага
    function playWizardAttackAnimation(wizardCol, wizardRow, callback) {
        console.log('⚔️⚔️⚔️ playWizardAttackAnimation ВЫЗВАНА для позиции:', wizardCol, wizardRow);
        console.log('   Все спрайты магов:', Object.keys(wizardSprites));

        const wizardKey = `${wizardCol}_${wizardRow}`;
        const container = wizardSprites[wizardKey];

        console.log(`   Ищем спрайт: ${wizardKey}`);
        console.log(`   Найден контейнер:`, !!container);
        console.log(`   Есть sprite в контейнере:`, !!container?.sprite);

        if (!container || !container.sprite) {
            console.warn(`⚠️ Маг не найден на позиции ${wizardCol}_${wizardRow}`);
            if (callback) callback();
            return;
        }
        
        const sprite = container.sprite;
        
        // Проверяем валидность спрайта
        if (!isSpriteValid(sprite)) {
            console.warn('⚠️ Спрайт невалиден');
            if (callback) callback();
            return;
        }
        
        // Если есть кадры атаки
        if (sprite instanceof PIXI.AnimatedSprite && container.attackFrames && container.attackFrames.length > 0) {
            console.log(`🎬 Запуск анимации атаки для ${container.faction || 'unknown'} (${container.attackFrames.length} кадров)`);
            console.log(`   Позиция: ${wizardCol}_${wizardRow}`);

            // Сохраняем текущее состояние
            const originalFrames = sprite.textures;
            const originalSpeed = sprite.animationSpeed;
            const originalLoop = sprite.loop;
            
            const animationId = Symbol('attack');
            activeAnimations.add(animationId);
            
            try {
                // Переключаем на атаку
                sprite.stop();
                sprite.textures = container.attackFrames;
                sprite.animationSpeed = 0.2; // Чуть быстрее для атаки
                sprite.loop = false;
                sprite.gotoAndPlay(0);
                
                // Обработчик завершения
                sprite.onComplete = () => {
                    if (!activeAnimations.has(animationId)) return;
                    activeAnimations.delete(animationId);
                    
                    console.log('✅ Анимация атаки завершена');
                    
                    if (!isSpriteValid(sprite)) {
                        if (callback) callback();
                        return;
                    }
                    
                    try {
                        sprite.stop();
                        sprite.onComplete = null;

                        // Возвращаем idle анимацию
                        if (container.idleFrames && container.idleFrames.length > 0) {
                            sprite.textures = container.idleFrames;
                            sprite.animationSpeed = originalSpeed;
                            sprite.loop = true;

                            // ИСПРАВЛЕНО: Сразу запускаем анимацию без задержки
                            sprite.gotoAndPlay(0);

                            console.log('✅ Маг вернулся к idle анимации');
                        }
                    } catch (err) {
                        console.error('Ошибка при возврате к idle:', err);
                    }
                    
                    if (callback) callback();
                };
            } catch (err) {
                console.error('Ошибка при запуске анимации атаки:', err);
                activeAnimations.delete(animationId);
                if (callback) callback();
            }
        } else {
            // Простая анимация масштабирования для fallback
            console.warn(`⚠️ Нет кадров атаки для ${wizardKey}, используем fallback`, {
                hasContainer: !!container,
                hasAttackFrames: !!container?.attackFrames,
                attackFramesLength: container?.attackFrames?.length || 0,
                faction: container?.faction
            });

            // ИСПРАВЛЕНО: Используем сохраненный baseScale вместо текущего
            const baseScaleX = sprite.baseScaleX || sprite.scale.x;
            const baseScaleY = sprite.baseScaleY || sprite.scale.y;

            try {
                sprite.scale.set(baseScaleX * 1.3, baseScaleY * 1.3);

                safeSetTimeout(() => {
                    if (isSpriteValid(sprite)) {
                        // Возвращаем к базовому scale, а не к текущему
                        sprite.scale.set(baseScaleX, baseScaleY);
                    }
                    if (callback) callback();
                }, 300);
            } catch (err) {
                console.error('Ошибка при масштабировании:', err);
                if (callback) callback();
            }
        }
    }
    
    // Анимация смерти мага
    function playWizardDeathAnimation(wizardCol, wizardRow, callback) {
        console.log('💀 Анимация смерти для позиции:', wizardCol, wizardRow);

        const wizardKey = `${wizardCol}_${wizardRow}`;
        const container = wizardSprites[wizardKey];
        
        if (!container || !container.sprite) {
            console.warn(`⚠️ Маг не найден на позиции ${wizardCol}_${wizardRow}`);
            if (callback) callback();
            return;
        }
        
        // Помечаем что маг мертв
        container.isDead = true;
        
        const sprite = container.sprite;
        
        if (!isSpriteValid(sprite)) {
            if (callback) callback();
            return;
        }
        
        // Если есть кадры смерти
        if (sprite instanceof PIXI.AnimatedSprite && container.deathFrames && container.deathFrames.length > 0) {
            console.log(`💀 Запуск анимации смерти (${container.deathFrames.length} кадров)`);
            
            const animationId = Symbol('death');
            activeAnimations.add(animationId);
            
            try {
                sprite.stop();
                
                // Для фракции яда проигрываем анимацию смерти в обратном порядке
                const config = FACTION_SPRITES_CONFIG[container.faction];
                const deathFrames = (config && config.reverseOnDeath) 
                    ? [...container.deathFrames].reverse() 
                    : container.deathFrames;
                
                sprite.textures = deathFrames;
                sprite.animationSpeed = 0.15;
                sprite.loop = false;
                sprite.gotoAndPlay(0);
                
                sprite.onComplete = () => {
                    if (!activeAnimations.has(animationId)) return;
                    activeAnimations.delete(animationId);
                    
                    console.log('✅ Анимация смерти завершена');
                    
                    // ВАЖНО: НЕ скрываем спрайт, оставляем на последнем кадре
                    if (isSpriteValid(sprite)) {
                        // Для реверсной анимации останавливаемся на последнем кадре массива
                        // (который является первым кадром оригинальной анимации)
                        sprite.gotoAndStop(sprite.textures.length - 1);
                    }
                    
                    // Скрываем только HP бар
                    if (container.hpBar) {
                        container.hpBar.visible = false;
                    }
                    
                    if (callback) callback();
                };
            } catch (err) {
                console.error('Ошибка при анимации смерти:', err);
                activeAnimations.delete(animationId);
                if (callback) callback();
            }
        } else {
            // Простая анимация исчезновения для fallback
            console.log('⚠️ Используем fade out для смерти');

            // Делаем полупрозрачным вместо полного исчезновения
            let alpha = 1;
            const fadeInterval = setInterval(() => {
                // ИСПРАВЛЕНО: Останавливаем интервал если спрайт уничтожен
                if (!isSpriteValid(sprite)) {
                    clearInterval(fadeInterval);
                    if (callback) callback();
                    return;
                }

                alpha -= 0.05;
                sprite.alpha = Math.max(0.3, alpha); // Минимум 0.3 вместо 0

                if (alpha <= 0.3) {
                    clearInterval(fadeInterval);
                    // НЕ скрываем спрайт
                    if (container.hpBar) container.hpBar.visible = false;
                    if (callback) callback();
                }
            }, 50);
        }
    }
    
    // Обновление магов
    let lastUpdateHash = '';

    function updateWizards() {
        const currentHash = JSON.stringify({
            enemy: window.enemyFormation?.map(e => e?.hp),
            player: window.playerFormation?.map((id, i) => {
                const w = window.playerWizards?.find(w => w.id === id);
                return w?.hp;
            })
        });

        if (currentHash === lastUpdateHash) {
            return;
        }
        lastUpdateHash = currentHash;

        // ИСПРАВЛЕНО: Разрешаем обновление когда battleState === 'finished' для запуска финальных анимаций смерти
        if (window.battleState !== 'active' && window.battleState !== 'finished') {
            console.log('⏸️ Бой не активен, пропускаем обновление');
            return;
        }

        if (!window.pixiCore) {
            return;
        }

        // Инициализация если нужно
        if (!init()) {
            console.warn('⚠️ Не могу обновить магов');
            return;
        }

        console.log('🧙 Обновляем магов');

        // Обновляем врагов
        if (window.enemyFormation) {
            window.enemyFormation.forEach((enemy, index) => {
                if (enemy) {
                    const key = `0_${index}`;

                    if (!wizardSprites[key]) {
                        createWizardSprite('enemy', 0, index);
                    } else {
                        const container = wizardSprites[key];

                        // Обновляем HP только для живых
                        if (!container.isDead) {
                            updateWizardHP(key, enemy.hp, enemy.max_hp || 100);

                            // Проверяем смерть и запускаем анимацию только один раз
                            if (enemy.hp <= 0 && !container.deathAnimationStarted) {
                                container.deathAnimationStarted = true;
                                playWizardDeathAnimation(0, index);
                            }
                        }
                    }
                }
            });
        }
        
        // Обновляем игроков
        if (window.playerFormation && window.playerWizards) {
            window.playerFormation.forEach((wizardId, index) => {
                if (wizardId) {
                    const wizard = window.playerWizards.find(w => w.id === wizardId);
                    if (wizard) {
                        const key = `5_${index}`;
                        
                        if (!wizardSprites[key]) {
                            createWizardSprite('player', 5, index);
                        } else {
                            const container = wizardSprites[key];
                            
                            // Обновляем HP только для живых
                            if (!container.isDead) {
                                updateWizardHP(key, wizard.hp, wizard.max_hp || 100);
                                
                                // Проверяем смерть и запускаем анимацию только один раз
                                if (wizard.hp <= 0 && !container.deathAnimationStarted) {
                                    container.deathAnimationStarted = true;
                                    playWizardDeathAnimation(5, index);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Обновление HP бара
    function updateWizardHP(key, hp, maxHp) {
        const container = wizardSprites[key];

        if (!container || !container.hpBarFill) {
            return;
        }

        // ИСПРАВЛЕНО: Проверяем что HP бар не уничтожен
        if (!window.pixiAnimUtils || !window.pixiAnimUtils.isValid(container.hpBarFill)) {
            return;
        }

        const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
        container.hpBarFill.clear();

        if (hp > 0) {
            const color = hpPercent > 0.5 ? 0x4ade80 : hpPercent > 0.25 ? 0xfbbf24 : 0xef4444;
            container.hpBarFill.beginFill(color);
            container.hpBarFill.drawRect(-20, 0, 40 * hpPercent, 5);
            container.hpBarFill.endFill();
        }

        if (container.hpBar && window.pixiAnimUtils.isValid(container.hpBar)) {
            container.hpBar.visible = hp > 0;
        }
    }
    
    // Очистка всех магов
    function clearWizards(forceFullClear = false) {
        console.log('🧹 Очистка магов...', forceFullClear ? '(полная)' : '(частичная)');
        
        // Если это не полная очистка и бой активен, оставляем мертвых магов
        if (!forceFullClear && window.battleState === 'active') {
            console.log('⚠️ Бой активен, оставляем мертвых магов');
            return;
        }
        
        // Отменяем все активные анимации
        activeAnimations.clear();
        
        // Отменяем все таймауты
        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts.clear();
        
        for (const key in wizardSprites) {
            const container = wizardSprites[key];
            if (container) {
                try {
                    if (container.sprite instanceof PIXI.AnimatedSprite) {
                        container.sprite.stop();
                        container.sprite.onComplete = null;
                    }
                    
                    if (container.sprite) {
                        if (container.sprite.parent) {
                            container.sprite.parent.removeChild(container.sprite);
                        }
                        if (container.sprite.destroy && !container.sprite.destroyed) {
                            container.sprite.destroy({
                                children: true,
                                texture: false,
                                baseTexture: false
                            });
                        }
                    }
                    
                    if (container.hpBar) {
                        if (container.hpBar.parent) {
                            container.hpBar.parent.removeChild(container.hpBar);
                        }
                        if (container.hpBar.destroy) {
                            container.hpBar.destroy({ children: true });
                        }
                    }

                    if (container.poisonIcon) {
                        if (container.poisonIcon.parent) {
                            container.poisonIcon.parent.removeChild(container.poisonIcon);
                        }
                        if (container.poisonIcon.destroy) {
                            container.poisonIcon.destroy({ children: true });
                        }
                    }
                } catch (e) {
                    console.error(`Ошибка при очистке спрайта ${key}:`, e);
                }
            }
        }
        
        // Очищаем объекты
        for (const key in wizardSprites) {
            delete wizardSprites[key];
        }
        
        // НЕ очищаем кэш текстур фракций - они могут пригодиться
        
        console.log('✅ Очистка магов завершена');
    }
    
    // Анимация каста для отдельного спрайта (для демо-боя)
    function playCastAnimation(sprite) {
        if (!sprite || !sprite.userData) {
            console.warn('⚠️ Нет данных спрайта для анимации каста');
            return;
        }

        const { castFrames, idleFrames } = sprite.userData;

        if (!castFrames || castFrames.length === 0) {
            console.warn('⚠️ Нет кадров каста');
            return;
        }

        const originalSpeed = sprite.animationSpeed;

        sprite.stop();
        sprite.textures = castFrames;
        sprite.animationSpeed = 0.15;
        sprite.loop = false;
        sprite.gotoAndPlay(0);

        sprite.onComplete = () => {
            // Возврат к idle
            sprite.stop();
            sprite.textures = idleFrames;
            sprite.animationSpeed = originalSpeed;
            sprite.loop = true;
            sprite.gotoAndPlay(0);
            sprite.onComplete = null;
        };
    }

    // Анимация смерти для отдельного спрайта (для демо-боя)
    function playDeathAnimation(sprite, callback) {
        if (!sprite || !sprite.userData) {
            console.warn('⚠️ Нет данных спрайта для анимации смерти');
            if (callback) callback();
            return;
        }

        const { deathFrames } = sprite.userData;

        if (!deathFrames || deathFrames.length === 0) {
            // Fallback - затемнение
            let alpha = 1;
            const fadeInterval = setInterval(() => {
                if (!window.pixiAnimUtils.isValid(sprite)) {
                    clearInterval(fadeInterval);
                    if (callback) callback();
                    return;
                }

                alpha -= 0.05;
                sprite.alpha = Math.max(0.3, alpha);

                if (alpha <= 0.3) {
                    clearInterval(fadeInterval);
                    if (callback) callback();
                }
            }, 50);
            return;
        }

        sprite.stop();
        sprite.textures = deathFrames;
        sprite.animationSpeed = 0.15;
        sprite.loop = false;
        sprite.gotoAndPlay(0);

        sprite.onComplete = () => {
            sprite.gotoAndStop(sprite.textures.length - 1);
            if (callback) callback();
        };
    }

    // Обновление HP для отдельного спрайта (для демо-боя)
    function updateSpriteHP(wizard, hp, maxHp) {
        if (!wizard || !wizard.hpBarFill) {
            console.warn('⚠️ Нет HP бара для обновления');
            return;
        }

        const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
        wizard.hpBarFill.clear();

        if (hp > 0) {
            const color = hpPercent > 0.5 ? 0x44ff44 : (hpPercent > 0.25 ? 0xffaa00 : 0xff4444);
            wizard.hpBarFill.beginFill(color);
            wizard.hpBarFill.drawRect(-25, 0, 50 * hpPercent, 5);
            wizard.hpBarFill.endFill();
        }

        if (wizard.hpBar) {
            wizard.hpBar.visible = hp > 0;
        }
    }

    // Функция создания мага для демо-боя (упрощённая)
    async function createDemoWizard(wizardData, col, row, type) {
        // Инициализируем если нужно
        if (!gridCells || !unitsContainer) {
            init();
        }

        if (!gridCells || !unitsContainer) {
            console.error('❌ Не могу создать мага - контейнеры не готовы');
            return null;
        }

        const cellData = gridCells?.[col]?.[row];
        if (!cellData) {
            console.error(`❌ Ячейка ${col}_${row} не найдена`);
            return null;
        }

        const faction = wizardData.faction || 'fire';
        const config = FACTION_SPRITES_CONFIG[faction];

        console.log(`🧙 Создаём демо-мага фракции ${faction} на ${col}_${row}`);

        const container = new PIXI.Container();
        const scale = cellData.cellScale || 1;

        let sprite;

        // Загружаем текстуры фракции
        const textures = await loadFactionTextures(faction);

        if (textures && textures.idle && textures.idle.length > 0) {
            sprite = new PIXI.AnimatedSprite(textures.idle);
            sprite.animationSpeed = config?.animationSpeed || 0.15;
            sprite.anchor.set(0.5);
            sprite.scale.set(scale * (config?.scale || 0.5));
            sprite.loop = true;
            sprite.play();

            // ИСПРАВЛЕНО: Сохраняем базовый scale для возврата после анимаций
            sprite.baseScaleX = sprite.scale.x;
            sprite.baseScaleY = sprite.scale.y;

            // Зеркалим для игрока (смотрит влево)
            if (type === 'player') {
                sprite.scale.x *= -1;
                sprite.baseScaleX = sprite.scale.x; // Обновляем базовый scale после зеркалирования
            }

            // Дополнительное отражение для фракции fire
            if (faction === 'fire') {
                sprite.scale.x *= -1;
                sprite.baseScaleX = sprite.scale.x; // Обновляем базовый scale после зеркалирования
            }

            sprite.x = cellData.x + cellData.width / 2;
            sprite.y = cellData.y + cellData.height / 2;

            // Сохраняем текстуры для анимаций
            sprite.userData = {
                idleFrames: textures.idle,
                castFrames: textures.cast,
                deathFrames: textures.death,
                faction: faction
            };

            // Создаём HP бар для мага
            const hpBarContainer = new PIXI.Container();

            // Фон HP бара
            const hpBarBg = new PIXI.Graphics();
            hpBarBg.beginFill(0x000000, 0.7);
            hpBarBg.drawRect(-25, 0, 50, 5);
            hpBarBg.endFill();

            // Заполнение HP бара
            const hpBarFill = new PIXI.Graphics();
            hpBarFill.beginFill(0x44ff44);
            hpBarFill.drawRect(-25, 0, 50, 5);
            hpBarFill.endFill();

            hpBarContainer.addChild(hpBarBg);
            hpBarContainer.addChild(hpBarFill);
            hpBarContainer.x = cellData.x + cellData.width / 2;
            hpBarContainer.y = cellData.y + cellData.height * 0.2; // Над головой

            container.addChild(sprite);
            unitsContainer.addChild(container);
            unitsContainer.addChild(hpBarContainer); // HP бар отдельно

            return {
                sprite,
                container,
                data: wizardData,
                hpBar: hpBarContainer,
                hpBarFill: hpBarFill
            };
        } else {
            console.error(`❌ Не удалось загрузить текстуры для ${faction}`);
            return null;
        }
    }

    // Обновление иконки яда (стаки)
    function updatePoisonIcon(key, stacks) {
        const container = wizardSprites[key];

        if (!container) {
            return;
        }

        // Удаляем старую иконку если есть
        if (container.poisonIcon) {
            if (container.poisonIcon.parent) {
                container.poisonIcon.parent.removeChild(container.poisonIcon);
            }
            if (container.poisonIcon.destroy) {
                container.poisonIcon.destroy({ children: true });
            }
            container.poisonIcon = null;
        }

        // Если стаков нет - ничего не показываем
        if (!stacks || stacks <= 0) {
            return;
        }

        // Создаем новую иконку с количеством стаков
        const poisonText = new PIXI.Text(`☠️${stacks}`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00ff00, // Зеленый цвет для яда
            stroke: 0x000000,
            strokeThickness: 3,
            fontWeight: 'bold'
        });

        poisonText.anchor.set(0.5, 1); // Центрируем по горизонтали, низ по вертикали

        // Позиционируем над HP баром
        if (container.hpBar) {
            poisonText.x = container.hpBar.x;
            poisonText.y = container.hpBar.y - 8; // Чуть выше HP бара
        } else if (container.sprite) {
            poisonText.x = container.sprite.x;
            poisonText.y = container.sprite.y + 18; // Чуть выше спрайта
        }

        container.poisonIcon = poisonText;

        // Добавляем в контейнер
        if (unitsContainer) {
            unitsContainer.addChild(poisonText);
        }
    }

    // Экспорт с поддержкой старого API
    window.pixiWizards = {
        init: init,
        update: updateWizards,        // Для совместимости с pixi-core.js
        updateWizards: updateWizards, // Новое название
        clear: () => clearWizards(true),  // Полная очистка для совместимости
        clearAll: () => clearWizards(true), // Полная очистка
        clearPartial: () => clearWizards(false), // Частичная очистка
        playAttack: playWizardAttackAnimation,
        playDeath: playWizardDeathAnimation,
        // Для демо-боя
        createWizard: createDemoWizard,
        playCastAnimation: playCastAnimation,
        playDeathAnimation: playDeathAnimation,
        updateWizardHP: updateSpriteHP,
        updatePoisonIcon: updatePoisonIcon // НОВОЕ: обновление иконки яда
    };

    // КРИТИЧЕСКИ ВАЖНО: Прямой экспорт для базовой атаки!
    window.playWizardAttackAnimation = playWizardAttackAnimation;

    console.log('✅ pixi-wizards готов (поддержка фракций)');
})();