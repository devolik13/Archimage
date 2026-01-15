// test/dlc-test-commands.js - Консольные команды для тестирования DLC Света и Тьмы

(function() {
    console.log('🧪 Загружены тестовые команды DLC Света и Тьмы');

    // Названия фракций
    const FACTION_NAMES = {
        fire: 'Огонь',
        water: 'Вода',
        earth: 'Земля',
        wind: 'Ветер',
        nature: 'Природа',
        poison: 'Яд',
        light: 'Свет',
        dark: 'Тьма'
    };

    // Заклинания по школам (все 5 уровня для тестирования)
    const SCHOOL_SPELLS = {
        light: {
            flash: { level: 5, name: 'Вспышка' },
            light_beam: { level: 5, name: 'Луч света' },
            rainbow_shield: { level: 5, name: 'Радужный щит' },
            sun_radiance: { level: 5, name: 'Сияние солнца' },
            dawn: { level: 5, name: 'Рассвет' }
        },
        dark: {
            dark_clot: { level: 5, name: 'Сгусток тьмы' },
            weakness: { level: 5, name: 'Слабость' },
            miasma: { level: 5, name: 'Миазма' },
            shadow_realm: { level: 5, name: 'Мир теней' },
            fading: { level: 5, name: 'Угасание' }
        }
    };

    /**
     * Применить смену фракции на Свет
     * Использование в консоли: activateLight()
     */
    window.activateLight = function() {
        applyDLCFaction('light');
    };

    /**
     * Применить смену фракции на Тьму
     * Использование в консоли: activateDark()
     */
    window.activateDark = function() {
        applyDLCFaction('dark');
    };

    /**
     * Общая функция смены фракции для DLC (только для тестирования боя)
     * НЕ меняет город, иконки и т.д. - только заклинания и спрайты магов
     */
    function applyDLCFaction(newFaction) {
        if (!window.userData) {
            console.error('❌ userData не найден');
            return;
        }

        console.log(`🔄 Активация DLC: ${FACTION_NAMES[newFaction]}`);

        // 1. Добавляем заклинания новой школы в userData.spells (для фильтров в UI мага)
        if (!window.userData.spells) {
            window.userData.spells = {};
        }
        window.userData.spells[newFaction] = SCHOOL_SPELLS[newFaction];
        console.log(`📚 Добавлены заклинания школы ${FACTION_NAMES[newFaction]}:`, Object.keys(SCHOOL_SPELLS[newFaction]));

        // 2. Обновляем ТОЛЬКО фракцию магов (для спрайтов) и добавляем изученные заклинания
        // НЕ меняем userData.faction чтобы город/иконки остались прежними
        if (window.userData.wizards && window.userData.wizards.length > 0) {
            window.userData.wizards.forEach(wizard => {
                // Меняем фракцию мага (влияет на спрайт в бою)
                wizard.faction = newFaction;

                // Добавляем изученные заклинания (без автоназначения в слоты)
                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
            });
            console.log(`🧙 Обновлена фракция у ${window.userData.wizards.length} магов (только для боя)`);
        }

        // 3. Обновляем playerWizards если они уже инициализированы (в бою)
        if (window.playerWizards && window.playerWizards.length > 0) {
            window.playerWizards.forEach(wizard => {
                wizard.faction = newFaction;

                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
            });
            console.log(`⚔️ Обновлены playerWizards`);

            // Обновляем спрайты если в бою
            if (window.pixiWizards?.refreshAllSprites) {
                window.pixiWizards.refreshAllSprites();
                console.log(`🎮 Спрайты обновлены`);
            }
        }

        console.log(`✅ DLC ${FACTION_NAMES[newFaction]} активирован!`);
        console.log('');
        console.log('📋 Теперь:');
        console.log('   - Откройте экран мага → выберите заклинания в слоты');
        console.log('   - Начните бой → увидите нового мага');
    }

    /**
     * Показать статус
     */
    window.showDLCStatus = function() {
        console.log('📋 Статус DLC:');
        console.log(`   Текущая фракция: ${FACTION_NAMES[window.userData?.faction] || 'не определена'}`);

        if (window.userData?.wizards) {
            console.log(`   Магов: ${window.userData.wizards.length}`);
            window.userData.wizards.forEach((w, i) => {
                console.log(`   ${i}: ${w.name} | Фракция: ${w.faction} | Уровень: ${w.level}`);
            });
        }

        if (window.userData?.spells) {
            console.log('   Изученные школы:', Object.keys(window.userData.spells));
        }
    };

    // Вывод справки
    console.log('');
    console.log('📖 Доступные команды:');
    console.log('   activateLight()   - Сменить фракцию на СВЕТ (все маги)');
    console.log('   activateDark()    - Сменить фракцию на ТЬМУ (все маги)');
    console.log('   showDLCStatus()   - Показать текущий статус');
    console.log('');
})();
