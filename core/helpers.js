// battle/utils/helpers.js - Минимальные вспомогательные функции для боя
console.log('✅ battle/utils/helpers.js загружен');

// Определение школы заклинания (резервная)
window.getSpellSchoolFallback = function(spellId) {
    // Используем функцию из spell-functions.js если есть
    return window.getSpellSchoolFromId?.(spellId) || null;
};

// Названия направлений
window.getDirectionNameSimple = function(direction) {
    const map = {
        'main': 'в цель',
        'up': 'вверх',
        'down': 'вниз',
        'right': 'вправо',
        'left': 'влево'
    };
    return map[direction] || direction;
};

// Выбор случайного заклинания
window.selectRandomSpell = function(wizard) {
    const spells = wizard.spells || [];
    const available = spells.filter(s => s != null);
    return available[Math.floor(Math.random() * available.length)] || null;
};

// Информация о заклинании
window.getSpellInfo = function(spellId) {
    const spellData = window.findSpellInUserData?.(spellId, window.userData?.spells);
    return {
        id: spellId,
        name: window.SPELL_NAMES?.[spellId] || spellId,
        level: spellData?.level || 1,
        school: window.getSpellSchoolFromId?.(spellId)
    };
};