// shared/magic-resistance.js - ИСПРАВЛЕННАЯ система сопротивления магии

// Функция расчета сопротивления к школе магии
function calculateMagicResistance(wizard, spellSchool) {
    if (!spellSchool) return 0;

    // ИСПРАВЛЕНО: Для PvE врагов используем их кастомные сопротивления из конфига
    // Проверяем все флаги: isPvEEnemy, isAdventureEnemy, isElemental, isBoss, isFinalBoss, isTrainingDummy
    const isPvETarget = wizard && (wizard.isPvEEnemy || wizard.isAdventureEnemy || wizard.isElemental || wizard.isBoss || wizard.isFinalBoss || wizard.isTrainingDummy);
    if (isPvETarget) {
        // PvE враги используют только свои resistances или magicResistance (или 0 если не заданы)
        const resistances = wizard.resistances || wizard.magicResistance;
        return resistances ? (resistances[spellSchool] || 0) : 0;
    }

    // Для обычных магов считаем по изученным заклинаниям из userData
    const userSpells = window.userData?.spells;
    if (!userSpells) return 0;

    let resistance = 0;

    // Стандартные заклинания данной школы
    if (userSpells[spellSchool]) {
        for (const [spellId, spellData] of Object.entries(userSpells[spellSchool])) {
            if (spellData.level > 0) {
                resistance += spellData.level * 1.5;
            }
        }
    }

    // Гибридные заклинания
    if (userSpells.hybrid) {
        for (const [hybridId, spellData] of Object.entries(userSpells.hybrid)) {
            if (spellData.level > 0 && hybridContainsSchool(hybridId, spellSchool)) {
                resistance += spellData.level * 0.5;
            }
        }
    }

    return resistance;
}

// Проверка содержит ли гибридное заклинание определенную школу
function hybridContainsSchool(hybridId, school) {
    // Парсим ID гибридного заклинания вида "hybrid_fire_water_tier1"
    const parts = hybridId.split('_');
    if (parts.length < 3) return false;
    
    // Проверяем содержит ли ID название школы
    return hybridId.includes(`_${school}_`) || hybridId.includes(`${school}_`);
}

// Определение школы заклинания - ПОЛНЫЙ СПИСОК всех 8 школ
function getSpellSchool(spellId) {
    // Стандартные заклинания - ВСЕ 8 школ по 5 заклинаний каждая
    const schoolSpells = {
        fire: ['spark', 'firebolt', 'fire_wall', 'fireball', 'fire_tsunami'],
        water: ['icicle', 'frost_arrow', 'ice_rain', 'blizzard', 'absolute_zero'],
        wind: ['gust', 'wind_blade', 'wind_wall', 'storm_cloud', 'ball_lightning'],
        earth: ['pebble', 'stone_spike', 'earth_wall', 'stone_grotto', 'meteor_shower'],
        nature: ['call_wolf', 'bark_armor', 'leaf_canopy', 'ent', 'meteorokinesis'],
        poison: ['poisoned_blade', 'poisoned_glade', 'foul_cloud', 'plague', 'epidemic'],
        light: ['flash', 'light_beam', 'rainbow_shield', 'sun_radiance', 'dawn'],
        dark: ['dark_clot', 'weakness', 'miasma', 'shadow_realm', 'fading']
    };
    
    for (const [school, spells] of Object.entries(schoolSpells)) {
        if (spells.includes(spellId)) {
            return school;
        }
    }
    
    // Для гибридных заклинаний возвращаем массив школ
    if (spellId.startsWith('hybrid_')) {
        const schools = [];
        if (hybridContainsSchool(spellId, 'fire')) schools.push('fire');
        if (hybridContainsSchool(spellId, 'water')) schools.push('water');
        if (hybridContainsSchool(spellId, 'wind')) schools.push('wind');
        if (hybridContainsSchool(spellId, 'earth')) schools.push('earth');
        if (hybridContainsSchool(spellId, 'nature')) schools.push('nature');
        if (hybridContainsSchool(spellId, 'poison')) schools.push('poison');
        if (hybridContainsSchool(spellId, 'light')) schools.push('light');
        if (hybridContainsSchool(spellId, 'dark')) schools.push('dark');
        return schools;
    }
    // Эффекты зон
    if (spellId === 'fire_ground' || spellId === 'fire_wall' || spellId === 'fire_tsunami') {
    	return 'fire';
    }
    if (spellId === 'absolute_zero' || spellId === 'blizzard_zone') {
    	return 'water';
    }
    return null;
}

// ИСПРАВЛЕНО: Функция применения сопротивления магии - используется в damage-system.js
function applyMagicResistance(target, spellId, damage) {
    if (!target || !spellId || damage <= 0) return damage;

    const spellSchool = getSpellSchool(spellId);
    let totalResistance = 0;

    // ИСПРАВЛЕНО: Проверяем кастомные сопротивления для PvE врагов
    // Используем все флаги: isPvEEnemy, isAdventureEnemy, isElemental, isBoss, isFinalBoss, isTrainingDummy
    const isPvETarget = target.isPvEEnemy || target.isAdventureEnemy || target.isElemental || target.isBoss || target.isFinalBoss || target.isTrainingDummy;

    if (isPvETarget) {
        // PvE враги: используем только их resistances или magicResistance (или 0 если не заданы)
        const resistances = target.resistances || target.magicResistance;
        if (resistances) {
            if (Array.isArray(spellSchool)) {
                let resistanceSum = 0;
                spellSchool.forEach(school => {
                    resistanceSum += (resistances[school] || 0);
                });
                totalResistance = resistanceSum / spellSchool.length;
            } else if (spellSchool) {
                totalResistance = resistances[spellSchool] || 0;
            }
        }
        // Если resistances не заданы - totalResistance остается 0
    } else {
        // Для обычных магов используем расчет по изученным заклинаниям
        if (Array.isArray(spellSchool)) {
            let resistanceSum = 0;
            spellSchool.forEach(school => {
                resistanceSum += calculateMagicResistance(target, school);
            });
            totalResistance = resistanceSum / spellSchool.length;
        } else if (spellSchool) {
            totalResistance = calculateMagicResistance(target, spellSchool);
        }
    }
    
    if (totalResistance > 0) {
        // Применяем сопротивление (максимум 75% для безопасности)
        const effectiveResistance = Math.min(totalResistance, 75) / 100;
        const finalDamage = Math.floor(damage * (1 - effectiveResistance));
        
        return Math.max(1, finalDamage); // Минимум 1 урон
    }
    
    return damage;
}

// Функция отображения сопротивлений мага - ВСЕ 8 ШКОЛ
function getWizardResistances(wizard) {
    return {
        fire: Math.floor(calculateMagicResistance(wizard, 'fire')),
        water: Math.floor(calculateMagicResistance(wizard, 'water')),
        wind: Math.floor(calculateMagicResistance(wizard, 'wind')),
        earth: Math.floor(calculateMagicResistance(wizard, 'earth')),
        nature: Math.floor(calculateMagicResistance(wizard, 'nature')),
        poison: Math.floor(calculateMagicResistance(wizard, 'poison')),
        light: Math.floor(calculateMagicResistance(wizard, 'light')),
        dark: Math.floor(calculateMagicResistance(wizard, 'dark'))
    };
}

// Функция для тестирования системы
function testMagicResistanceSystem() {
    console.log('🧪 Тестирование системы сопротивления магии...');

    // Тестируем все школы
    const testSchools = ['fire', 'water', 'wind', 'earth', 'nature', 'poison', 'light', 'dark'];
    testSchools.forEach(school => {
        const testSpellIds = window.SPELL_TIERS ? window.SPELL_TIERS[school] : [];
        if (testSpellIds && testSpellIds.length > 0) {
            const detectedSchool = getSpellSchool(testSpellIds[0]);
            console.log(`   ${school}: ${testSpellIds[0]} → ${detectedSchool}`);
        }
    });
    
    // Тестируем гибридное заклинание
    const hybridTest = getSpellSchool('hybrid_fire_water_tier1');
    console.log(`   hybrid: hybrid_fire_water_tier1 → ${hybridTest}`);
    
}

// Экспорт функций
window.calculateMagicResistance = calculateMagicResistance;
window.hybridContainsSchool = hybridContainsSchool;
window.getSpellSchool = getSpellSchool;
window.applyMagicResistance = applyMagicResistance; // ИСПРАВЛЕНО: экспортируем недостающую функцию
window.getWizardResistances = getWizardResistances;
window.testMagicResistanceSystem = testMagicResistanceSystem;

// Запускаем тест при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testMagicResistanceSystem, 1000);
});