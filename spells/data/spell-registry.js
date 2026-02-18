// battle/renderer/animations/spell-registry.js - Система регистрации анимаций заклинаний

// Реестр всех анимаций заклинаний
const SPELL_ANIMATIONS_REGISTRY = {
    // Огонь
    spark: 'fire/spark',
    firebolt: 'fire/firebolt',
    fire_wall: 'fire/fire-wall',
    fireball: 'fire/fireball',
    fire_tsunami: 'fire/fire-tsunami',
    
    // Вода
    icicle: 'water/icicle',
    frost_arrow: 'water/frost-arrow',
    ice_rain: 'water/ice-rain',
    blizzard: 'water/blizzard',
    absolute_zero: 'water/absolute-zero',
    
    // Ветер
    gust: 'wind/gust',
    wind_blade: 'wind/wind-blade',
    wind_wall: 'wind/wind-wall',
    storm_cloud: 'wind/storm-cloud',
    ball_lightning: 'wind/ball-lightning',
    
    // Земля
    pebble: 'earth/pebble',
    stone_spike: 'earth/stone-spike',
    earth_wall: 'earth/earth-wall',
    stone_grotto: 'earth/stone-grotto',
    meteor_shower: 'earth/meteor-shower',
    
    // Природа
    call_wolf: 'nature/call-wolf',
    bark_armor: 'nature/bark-armor',
    leaf_canopy: 'nature/leaf-canopy',
    ent: 'nature/ent',
    meteorokinesis: 'nature/meteorokinesis',
    
    // Яд
    poisoned_blade: 'poison/poisoned-blade',
    poisoned_glade: 'poison/poisoned-glade',
    foul_cloud: 'poison/foul-cloud',
    plague: 'poison/plague',
    epidemic: 'poison/epidemic',

    // Свет
    flash: 'light/flash',
    light_beam: 'light/light-beam',
    rainbow_shield: 'light/rainbow-shield',
    sun_radiance: 'light/sun-radiance',
    dawn: 'light/dawn',

    // Некромантия
    summon_skeleton: 'necromant/summon-skeleton',
    bone_spear: 'necromant/bone-spear',
    // death_shroud — пассивка, анимация не нужна (лог в начале боя)
    bone_cage: 'necromant/bone-cage',
    bone_dragon: 'necromant/bone-dragon'
};

// Хранилище загруженных модулей анимаций
window.spellAnimations = window.spellAnimations || {};

// Получить модуль анимации по ID заклинания
function getAnimationModule(spellId) {
    if (!window.spellAnimations[spellId]) {
        console.warn(`Анимация для ${spellId} не загружена`);
        return null;
    }
    return window.spellAnimations[spellId];
}

// Воспроизвести анимацию заклинания
function playSpellAnimation(spellId, params) {
    const module = getAnimationModule(spellId);
    
    if (!module) {
        console.warn(`❌ Модуль анимации ${spellId} не найден`);
        // Вызываем callback если есть
        if (params.onComplete) params.onComplete();
        return false;
    }
    
    if (!module.play) {
        console.warn(`❌ У модуля ${spellId} нет метода play`);
        if (params.onComplete) params.onComplete();
        return false;
    }
    
    console.log(`🎬 Запуск анимации ${spellId}`);
    
    // Добавляем проверку на существование контейнеров
    const effectsContainer = window.pixiCore?.getEffectsContainer();
    if (!effectsContainer) {
        console.warn('⚠️ effectsContainer не существует (бой не активен или ещё загружается)');
        if (params.onComplete) params.onComplete();
        return false;
    }
    
    // Запускаем анимацию
    try {
        module.play(params);
        return true;
    } catch (error) {
        console.error(`Ошибка при воспроизведении анимации ${spellId}:`, error);
        if (params.onComplete) params.onComplete();
        return false;
    }
}

// Проверить загружена ли анимация
function isAnimationLoaded(spellId) {
    return !!window.spellAnimations[spellId];
}

// Получить список всех загруженных анимаций
function getLoadedAnimations() {
    return Object.keys(window.spellAnimations);
}

// Универсальная функция для старой совместимости
function createProjectile(type, casterCol, casterRow, targetCol, targetRow, onComplete) {
    let spellId = null;
    
    // Определяем ID заклинания по типу
    switch(type) {
        case 'spark':
        case 'fire':
            spellId = 'spark';
            break;
        case 'icicle':
        case 'ice':
        case 'water':
            spellId = 'icicle';
            break;
        default:
            console.warn(`Неизвестный тип снаряда: ${type}`);
            if (onComplete) onComplete();
            return;
    }
    
    playSpellAnimation(spellId, {
        casterCol,
        casterRow,
        targetCol,
        targetRow,
        onComplete
    });
}

// API реестра
window.spellRegistry = {
    // Методы
    get: getAnimationModule,
    play: playSpellAnimation,
    isLoaded: isAnimationLoaded,
    getLoaded: getLoadedAnimations,
    
    // Для совместимости
    createProjectile: createProjectile
};

// Функции createSparkProjectile, createIcicleProjectile, createFireWallVisual
// определяются в animations/*.js (с полной PIXI реализацией)

console.log('📚 Реестр анимаций готов');