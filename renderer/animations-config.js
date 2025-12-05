// config/spells/animations-config.js - Конфигурация анимаций для PixiJS

const SPELL_ANIMATIONS = {
    // ===== ШКОЛА ОГНЯ =====
    fire: {
        spark: {
            type: 'projectile',
            sprite: '/images/spells/fire/spark/spark.webp',
            // Используем существующую реализацию из createSparkProjectile
            custom: true, // Флаг что у этого заклинания есть кастомная реализация
            frameWidth: 16,
            frameHeight: 16,
            frames: 1,
            animationSpeed: 0,
            scale: 1.0,
            color: 0xFFA500, // Оранжевый как в оригинале
            trail: {
                enabled: true,
                fadeSpeed: 0.1,
                color: 0xFFA500
            }
        },
        
        firebolt: {
            type: 'projectile',
            sprite: '/images/spells/fire/firebolt/firebolt.webp',
            frameWidth: 48,
            frameHeight: 48,
            frames: 6,
            animationSpeed: 0.25,
            scale: 1.2,
            blendMode: 'ADD',
            rotation: true, // Вращение в полете
            trail: {
                enabled: true,
                fadeSpeed: 0.15,
                color: 0xFF4500
            }
        },
        
        fire_wall: {
            type: 'area',
            // Используем существующую реализацию из createFireWallVisual
            custom: true, // Кастомная реализация
            sprites: {
                base: '/images/spells/fire/fire_wall/base.webp',
                flame: '/images/spells/fire/fire_wall/flame.webp'
            },
            frameWidth: 64,
            frameHeight: 128,
            frames: 8,
            animationSpeed: 0.15,
            scale: 1.0,
            blendMode: 'ADD',
            color: 0xFF4500, // Как в оригинале
            duration: 5000, // Время жизни в мс
            pattern: 'line', // Паттерн размещения
            segments: 5 // Количество сегментов стены
        },
        
        fireball: {
            type: 'projectile',
            sprite: '/images/spells/fire/fireball/fireball.webp',
            frameWidth: 64,
            frameHeight: 64,
            frames: 8,
            animationSpeed: 0.3,
            scale: 1.5,
            blendMode: 'ADD',
            explosion: {
                sprite: '/images/spells/fire/fireball/explosion.webp',
                frameWidth: 128,
                frameHeight: 128,
                frames: 12,
                animationSpeed: 0.5,
                scale: 2.0
            }
        },
        
        fire_tsunami: {
            type: 'wave',
            sprite: '/images/spells/fire/fire_tsunami/wave.webp',
            frameWidth: 256,
            frameHeight: 128,
            frames: 16,
            animationSpeed: 0.2,
            scale: 2.0,
            blendMode: 'ADD'
        }
    },
    
    // ===== ШКОЛА ВОДЫ =====
    water: {
        icicle: {
            type: 'projectile',
            sprite: '/images/spells/water/icicle/icicle.webp',
            // Используем существующую реализацию из createIcicleProjectile
            custom: true, // Кастомная реализация
            frameWidth: 24,
            frameHeight: 48,
            frames: 1,
            animationSpeed: 0,
            scale: 1.0,
            color: 0x00CCFF, // Голубой как в оригинале
            blendMode: 'NORMAL',
            rotation: false, // Ледышка летит прямо
            trail: {
                enabled: true,
                fadeSpeed: 0.05,
                color: 0x00CCFF,
                particles: true // Ледяные частицы
            }
        },
        
        frost_arrow: {
            type: 'projectile',
            sprite: '/images/spells/water/frost_arrow/arrow.webp',
            frameWidth: 48,
            frameHeight: 16,
            frames: 4,
            animationSpeed: 0.2,
            scale: 1.2,
            blendMode: 'NORMAL'
        },
        
        ice_rain: {
            type: 'area',
            sprite: '/images/spells/water/ice_rain/rain.webp',
            frameWidth: 32,
            frameHeight: 32,
            frames: 8,
            animationSpeed: 0.25,
            scale: 1.0,
            pattern: 'rain', // Падающий паттерн
            density: 20 // Количество падающих объектов
        },
        
        blizzard: {
            type: 'area',
            sprite: '/images/spells/water/blizzard/blizzard.webp',
            frameWidth: 256,
            frameHeight: 256,
            frames: 16,
            animationSpeed: 0.2,
            scale: 2.0,
            blendMode: 'SCREEN'
        },
        
        absolute_zero: {
            type: 'instant',
            sprite: '/images/spells/water/absolute_zero/freeze.webp',
            frameWidth: 128,
            frameHeight: 128,
            frames: 12,
            animationSpeed: 0.3,
            scale: 1.5,
            blendMode: 'ADD'
        }
    },
    
    // ===== ШКОЛА ВЕТРА =====
    wind: {
        gust: {
            type: 'projectile',
            sprite: '/images/spells/wind/gust/gust.webp',
            frameWidth: 48,
            frameHeight: 48,
            frames: 6,
            animationSpeed: 0.3,
            scale: 1.0,
            blendMode: 'SCREEN',
            opacity: 0.7
        },
        
        wind_blade: {
            type: 'projectile',
            sprite: '/images/spells/wind/wind_blade/blade.webp',
            frameWidth: 64,
            frameHeight: 16,
            frames: 4,
            animationSpeed: 0.4,
            scale: 1.3,
            rotation: true
        },
        
        wind_wall: {
            type: 'area',
            sprite: '/images/spells/wind/wind_wall/wall.webp',
            frameWidth: 64,
            frameHeight: 128,
            frames: 8,
            animationSpeed: 0.2,
            scale: 1.0,
            blendMode: 'SCREEN',
            opacity: 0.6
        },
        
        storm_cloud: {
            type: 'area',
            sprite: '/images/spells/wind/storm_cloud/cloud.webp',
            frameWidth: 128,
            frameHeight: 128,
            frames: 12,
            animationSpeed: 0.15,
            scale: 1.5,
            lightning: {
                sprite: '/images/spells/wind/storm_cloud/lightning.webp',
                frameWidth: 32,
                frameHeight: 256,
                frames: 6,
                animationSpeed: 0.5
            }
        },
        
        chain_lightning: {
            type: 'chain',
            sprite: '/images/spells/wind/chain_lightning/bolt.webp',
            frameWidth: 256,
            frameHeight: 32,
            frames: 8,
            animationSpeed: 0.5,
            scale: 1.0,
            blendMode: 'ADD'
        }
    },
    
    // ===== ШКОЛА ЗЕМЛИ =====
    earth: {
        pebble: {
            type: 'projectile',
            sprite: '/images/spells/earth/pebble/pebble.webp',
            frameWidth: 24,
            frameHeight: 24,
            frames: 4,
            animationSpeed: 0.1,
            scale: 1.0,
            rotation: true
        },
        
        stone_spike: {
            type: 'ground',
            sprite: '/images/spells/earth/stone_spike/spike.webp',
            frameWidth: 48,
            frameHeight: 64,
            frames: 6,
            animationSpeed: 0.3,
            scale: 1.2,
            emerge: true // Появляется из земли
        },
        
        earth_wall: {
            type: 'area',
            sprite: '/images/spells/earth/earth_wall/wall.webp',
            frameWidth: 64,
            frameHeight: 96,
            frames: 1, // Статичная стена
            animationSpeed: 0,
            scale: 1.0
        },
        
        stone_grotto: {
            type: 'summon',
            sprite: '/images/spells/earth/stone_grotto/golem.webp',
            frameWidth: 64,
            frameHeight: 64,
            frames: 8,
            animationSpeed: 0.2,
            scale: 1.5
        },
        
        meteor_shower: {
            type: 'area',
            sprite: '/images/spells/earth/meteor_shower/meteor.webp',
            frameWidth: 64,
            frameHeight: 64,
            frames: 8,
            animationSpeed: 0.3,
            scale: 1.5,
            pattern: 'rain',
            impact: {
                sprite: '/images/spells/earth/meteor_shower/impact.webp',
                frameWidth: 96,
                frameHeight: 96,
                frames: 8,
                animationSpeed: 0.4
            }
        }
    },
    
    // ===== ШКОЛА ПРИРОДЫ =====
    nature: {
        call_wolf: {
            type: 'summon',
            sprite: '/images/spells/nature/call_wolf/wolf.webp',
            frameWidth: 64,
            frameHeight: 48,
            frames: 8,
            animationSpeed: 0.2,
            scale: 1.0,
            idle: {
                frames: [0, 1, 2, 3],
                animationSpeed: 0.1
            },
            attack: {
                frames: [4, 5, 6, 7],
                animationSpeed: 0.3
            }
        },
        
        bark_armor: {
            type: 'buff',
            sprite: '/images/spells/nature/bark_armor/armor.webp',
            frameWidth: 64,
            frameHeight: 64,
            frames: 8,
            animationSpeed: 0.15,
            scale: 1.0,
            blendMode: 'MULTIPLY'
        },
        
        leaf_canopy: {
            type: 'area',
            sprite: '/images/spells/nature/leaf_canopy/leaves.webp',
            frameWidth: 128,
            frameHeight: 128,
            frames: 12,
            animationSpeed: 0.1,
            scale: 1.5,
            opacity: 0.8
        },
        
        ent: {
            type: 'summon',
            sprite: '/images/spells/nature/ent/ent.webp',
            frameWidth: 96,
            frameHeight: 128,
            frames: 8,
            animationSpeed: 0.15,
            scale: 1.8
        },
        
        meteorokinesis: {
            type: 'weather',
            sprites: {
                sun: '/images/spells/nature/meteorokinesis/sun.webp',
                rain: '/images/spells/nature/meteorokinesis/rain.webp',
                storm: '/images/spells/nature/meteorokinesis/storm.webp'
            },
            frameWidth: 256,
            frameHeight: 256,
            frames: 16,
            animationSpeed: 0.1,
            scale: 3.0,
            fullscreen: true
        }
    },
    
    // ===== ШКОЛА ЯДА =====
    poison: {
        poisoned_blade: {
            type: 'projectile',
            sprite: '/images/spells/poison/poisoned_blade/blade.webp',
            frameWidth: 32,
            frameHeight: 32,
            frames: 4,
            animationSpeed: 0.2,
            scale: 1.0,
            trail: {
                enabled: true,
                fadeSpeed: 0.08,
                color: 0x84CC16,
                drip: true // Эффект капающего яда
            }
        },
        
        poisoned_glade: {
            type: 'area',
            sprite: '/images/spells/poison/poisoned_glade/glade.webp',
            frameWidth: 128,
            frameHeight: 128,
            frames: 8,
            animationSpeed: 0.1,
            scale: 1.5,
            blendMode: 'MULTIPLY',
            opacity: 0.7,
            duration: 10000
        },
        
        foul_cloud: {
            type: 'area',
            sprite: '/images/spells/poison/foul_cloud/cloud.webp',
            frameWidth: 166,  // 500/3 = ~166
            frameHeight: 166, // 500/3 = ~166
            frames: 9,        // 3x3 = 9 кадров
            animationSpeed: 0.15,
            scale: 1.5,
            blendMode: 'MULTIPLY',
            opacity: 0.6,
            duration: 8000,
            pattern: 'spread', // Расползающийся паттерн
            particles: {
                enabled: true,
                sprite: '/images/spells/poison/foul_cloud/particle.webp',
                count: 30,
                speed: 0.5,
                lifespan: 2000,
                color: 0x669900
            }
        },
        
        plague: {
            type: 'debuff',
            sprite: '/images/spells/poison/plague/plague.webp',
            frameWidth: 48,
            frameHeight: 48,
            frames: 8,
            animationSpeed: 0.2,
            scale: 1.0,
            spread: {
                enabled: true,
                radius: 100,
                chance: 0.3
            }
        },
        
        epidemic: {
            type: 'area',
            sprite: '/images/spells/poison/epidemic/epidemic.webp',
            frameWidth: 256,
            frameHeight: 256,
            frames: 16,
            animationSpeed: 0.15,
            scale: 2.0,
            blendMode: 'MULTIPLY',
            waves: 3, // Волны распространения
            waveDelay: 1000
        }
    }
};

// Вспомогательные функции для работы с анимациями
const AnimationHelper = {
    // Получить конфигурацию анимации для заклинания
    getAnimationConfig(spellId) {
        // Находим школу заклинания
        const school = window.SPELLS_MASTER_CONFIG?.getSpellSchool(spellId);
        if (!school) {
            console.warn(`Школа не найдена для заклинания: ${spellId}`);
            return null;
        }
        
        // Возвращаем конфигурацию анимации
        return SPELL_ANIMATIONS[school]?.[spellId] || null;
    },
    
    // Создать текстуру для спрайта
    async loadSpellTexture(spellId) {
        const config = this.getAnimationConfig(spellId);
        if (!config) return null;
        
        // Для заклинаний с несколькими спрайтами
        if (config.sprites) {
            const textures = {};
            for (const [key, path] of Object.entries(config.sprites)) {
                textures[key] = await PIXI.Assets.load(path);
            }
            return textures;
        }
        
        // Для заклинаний с одним спрайтом
        return await PIXI.Assets.load(config.sprite);
    },
    
    // Создать анимированный спрайт
    createAnimatedSprite(texture, config) {
        const frames = [];
        
        // Нарезаем текстуру на кадры
        for (let i = 0; i < config.frames; i++) {
            const x = (i % 4) * config.frameWidth; // 4 кадра в ряд
            const y = Math.floor(i / 4) * config.frameHeight;
            
            frames.push(new PIXI.Texture(
                texture,
                new PIXI.Rectangle(x, y, config.frameWidth, config.frameHeight)
            ));
        }
        
        const sprite = new PIXI.AnimatedSprite(frames);
        sprite.animationSpeed = config.animationSpeed;
        sprite.scale.set(config.scale);
        
        if (config.blendMode) {
            sprite.blendMode = PIXI.BLEND_MODES[config.blendMode];
        }
        
        if (config.opacity !== undefined) {
            sprite.alpha = config.opacity;
        }
        
        sprite.play();
        return sprite;
    },
    
    // Проверить тип анимации
    getAnimationType(spellId) {
        const config = this.getAnimationConfig(spellId);
        return config?.type || 'projectile';
    },
    
    // Специальная обработка для Мерзкого облака
    createFoulCloud(x, y, container) {
        const config = SPELL_ANIMATIONS.poison.foul_cloud;
        
        // Основное облако
        const cloudSprite = new PIXI.AnimatedSprite(/* текстуры */);
        cloudSprite.position.set(x, y);
        cloudSprite.scale.set(config.scale);
        cloudSprite.alpha = config.opacity;
        cloudSprite.blendMode = PIXI.BLEND_MODES[config.blendMode];
        
        // Добавляем частицы если включены
        if (config.particles?.enabled) {
            const particleContainer = new PIXI.Container();
            for (let i = 0; i < config.particles.count; i++) {
                const particle = new PIXI.Sprite(/* текстура частицы */);
                particle.tint = config.particles.color;
                // Случайное положение в радиусе облака
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 50;
                particle.x = Math.cos(angle) * radius;
                particle.y = Math.sin(angle) * radius;
                particleContainer.addChild(particle);
            }
            cloudSprite.addChild(particleContainer);
        }
        
        container.addChild(cloudSprite);
        
        // Удаляем через duration
        setTimeout(() => {
            container.removeChild(cloudSprite);
        }, config.duration);
        
        return cloudSprite;
    }
};

// Экспортируем в глобальную область
window.SPELL_ANIMATIONS = SPELL_ANIMATIONS;
window.AnimationHelper = AnimationHelper;

console.log('📊 Загружено анимаций:', 
    Object.values(SPELL_ANIMATIONS).reduce((acc, school) => acc + Object.keys(school).length, 0)
);