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
     * Общая функция смены фракции для DLC
     */
    function applyDLCFaction(newFaction) {
        if (!window.userData) {
            console.error('❌ userData не найден');
            return;
        }

        const oldFaction = window.userData.faction;
        console.log(`🔄 Смена фракции: ${FACTION_NAMES[oldFaction] || oldFaction} → ${FACTION_NAMES[newFaction]}`);

        // 1. Меняем фракцию игрока
        window.userData.faction = newFaction;

        // 2. Добавляем заклинания новой школы в userData.spells
        if (!window.userData.spells) {
            window.userData.spells = {};
        }
        window.userData.spells[newFaction] = SCHOOL_SPELLS[newFaction];
        console.log(`📚 Добавлены заклинания школы ${FACTION_NAMES[newFaction]}:`, Object.keys(SCHOOL_SPELLS[newFaction]));

        // 3. Обновляем фракцию и заклинания у всех магов
        if (window.userData.wizards && window.userData.wizards.length > 0) {
            window.userData.wizards.forEach(wizard => {
                // Меняем фракцию
                wizard.faction = newFaction;
                wizard.school = newFaction;

                // Добавляем изученные заклинания (без автоназначения в слоты)
                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
                // Слоты НЕ трогаем - игрок сам выберет комбинацию
            });
            console.log(`🧙 Обновлена фракция у ${window.userData.wizards.length} магов`);
        }

        // 4. Обновляем playerWizards если они инициализированы (для боя)
        if (window.playerWizards && window.playerWizards.length > 0) {
            window.playerWizards.forEach(wizard => {
                wizard.faction = newFaction;
                wizard.school = newFaction;

                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
                // Слоты не трогаем
            });
            console.log(`⚔️ Обновлены playerWizards для боя`);
        }

        // 5. Перезагружаем город если функция доступна
        if (typeof window.initCityView === 'function') {
            setTimeout(() => {
                window.initCityView();
                console.log(`🏰 Город перезагружен`);
            }, 100);
        }

        // 6. Обновляем спрайты если в бою
        if (window.pixiWizards?.refreshAllSprites) {
            window.pixiWizards.refreshAllSprites();
            console.log(`🎮 Спрайты обновлены`);
        }

        console.log(`✅ Фракция ${FACTION_NAMES[newFaction]} активирована!`);
        console.log('');
        console.log('📋 Для проверки:');
        console.log('   - Откройте экран мага, чтобы увидеть новые заклинания');
        console.log('   - Начните бой, чтобы увидеть нового мага');
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
