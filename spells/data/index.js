// config/spells/index.js - Единая точка сборки всех данных заклинаний
console.log('✅ config/spells/index.js загружен');

// Создаем единый объект со всеми данными
// К этому моменту все файлы уже загружены и создали свои глобальные переменные
const SPELLS_MASTER_CONFIG = {
    // Порядок заклинаний по школам
    TIERS: window.SPELL_TIERS || {},
    
    // Конфигурация школ магии
    SCHOOLS: window.SCHOOL_CONFIG || {},
    
    // Базовые данные
    NAMES: window.SPELL_NAMES || {},
    BASE_DAMAGE: window.SPELL_BASE_DAMAGE || {},
    TYPES: window.SPELL_TYPE_CONFIG || {},
    
    // Полные данные заклинаний
    DATA: window.SPELL_FULL_DATA || {},
    
    // Вспомогательные функции
    getSpellById: function(spellId) {
        return this.DATA[spellId] || null;
    },
    
    getSpellName: function(spellId) {
        return this.NAMES[spellId] || spellId;
    },
    
    getSpellSchool: function(spellId) {
        // Проверяем в каждой школе
        for (const [school, spells] of Object.entries(this.TIERS)) {
            if (spells.includes(spellId)) {
                return school;
            }
        }
        return null;
    },
    
    getSpellTier: function(spellId) {
        const school = this.getSpellSchool(spellId);
        if (!school) return null;
        
        const index = this.TIERS[school].indexOf(spellId);
        return index >= 0 ? index + 1 : null;
    },
    
    getSchoolSpells: function(school) {
        return this.TIERS[school] || [];
    },
    
    getSpellDamage: function(spellId, level = 1) {
        const baseDamage = this.BASE_DAMAGE[spellId] || 0;
        const multiplier = [1, 1.5, 2, 2.5, 3][level - 1] || 1;
        return Math.floor(baseDamage * multiplier);
    }
};

// Экспортируем в глобальную область
window.SPELLS_MASTER_CONFIG = SPELLS_MASTER_CONFIG;

// Проверяем что все данные загружены
if (window.SPELL_TIERS && window.SPELL_NAMES && window.SPELL_BASE_DAMAGE) {
    console.log('✅ Все данные заклинаний успешно загружены');
    console.log('📊 Загружено школ:', Object.keys(window.SPELL_TIERS).length);
    console.log('📊 Загружено заклинаний:', Object.keys(window.SPELL_NAMES).length);
} else {
    console.error('❌ Не все данные заклинаний загружены!');
    if (!window.SPELL_TIERS) console.error('   - Отсутствует SPELL_TIERS');
    if (!window.SPELL_NAMES) console.error('   - Отсутствует SPELL_NAMES');
    if (!window.SPELL_BASE_DAMAGE) console.error('   - Отсутствует SPELL_BASE_DAMAGE');
}