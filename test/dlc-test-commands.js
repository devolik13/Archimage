// test/dlc-test-commands.js - Консольные команды для тестирования DLC Света и Тьмы
// ТОЛЬКО для боя - не меняет город, окна магов, иконки и т.д.

(function() {
    console.log('🧪 Загружены тестовые команды DLC Света и Тьмы');

    // Названия фракций
    const FACTION_NAMES = {
        light: 'Свет',
        dark: 'Тьма'
    };

    // Заклинания по школам (все 5 уровня для тестирования)
    const SCHOOL_SPELLS = {
        light: ['flash', 'light_beam', 'rainbow_shield', 'sun_radiance', 'dawn'],
        dark: ['dark_clot', 'weakness', 'miasma', 'shadow_realm', 'fading']
    };

    /**
     * Активировать магию Света для боя
     * Использование в консоли: activateLight()
     */
    window.activateLight = function() {
        applyDLCForBattle('light');
    };

    /**
     * Активировать магию Тьмы для боя
     * Использование в консоли: activateDark()
     */
    window.activateDark = function() {
        applyDLCForBattle('dark');
    };

    /**
     * Применить DLC ТОЛЬКО для текущего боя
     * Не трогает userData, окна магов, город - только playerWizards
     */
    function applyDLCForBattle(newFaction) {
        // Проверяем что мы в бою
        if (!window.playerWizards || window.playerWizards.length === 0) {
            console.error('❌ playerWizards не найден. Команда работает только в бою!');
            console.log('   Начните бой и введите команду снова.');
            return;
        }

        console.log(`🔄 Активация DLC ${FACTION_NAMES[newFaction]} для боя...`);

        // Обновляем ТОЛЬКО playerWizards (данные текущего боя)
        window.playerWizards.forEach(wizard => {
            // Меняем фракцию (влияет на спрайт)
            wizard.faction = newFaction;

            // Добавляем изученные заклинания
            if (!wizard.learnedSpells) wizard.learnedSpells = {};
            SCHOOL_SPELLS[newFaction].forEach(spellId => {
                wizard.learnedSpells[spellId] = 5;
            });

            // Устанавливаем заклинания в слоты
            wizard.spells = [
                { id: SCHOOL_SPELLS[newFaction][0], level: 5 },
                { id: SCHOOL_SPELLS[newFaction][1], level: 5 }
            ];
        });

        console.log(`🧙 Обновлено ${window.playerWizards.length} магов`);

        // Обновляем спрайты
        if (window.pixiWizards?.refreshAllSprites) {
            window.pixiWizards.refreshAllSprites();
            console.log(`🎮 Спрайты обновлены`);
        }

        console.log(`✅ DLC ${FACTION_NAMES[newFaction]} активирован!`);
        console.log('');
        console.log(`📋 Слоты: ${SCHOOL_SPELLS[newFaction][0]}, ${SCHOOL_SPELLS[newFaction][1]}`);
        console.log(`   Все заклинания: ${SCHOOL_SPELLS[newFaction].join(', ')}`);
    }

    /**
     * Показать статус боя
     */
    window.showDLCStatus = function() {
        if (!window.playerWizards || window.playerWizards.length === 0) {
            console.log('❌ Не в бою');
            return;
        }

        console.log('📋 Статус боя:');
        window.playerWizards.forEach((w, i) => {
            const spellIds = w.spells?.map(s => s.id || s).join(', ') || 'нет';
            console.log(`   ${i}: ${w.name} | Фракция: ${w.faction} | Слоты: ${spellIds}`);
        });
    };

    // Вывод справки
    console.log('');
    console.log('📖 Команды (работают ТОЛЬКО в бою):');
    console.log('   activateLight()   - Активировать СВЕТ');
    console.log('   activateDark()    - Активировать ТЬМУ');
    console.log('   showDLCStatus()   - Показать статус');
    console.log('');
})();
