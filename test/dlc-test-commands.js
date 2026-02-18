// test/dlc-test-commands.js - Консольные команды для тестирования DLC Света, Тьмы и Некромантии

(function() {
    console.log('🧪 Загружены тестовые команды DLC Света, Тьмы и Некромантии');

    // Названия фракций
    const FACTION_NAMES = {
        light: 'Свет',
        dark: 'Тьма',
        necromant: 'Некромантия'
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
        },
        necromant: {
            summon_skeleton: { level: 5, name: 'Призыв скелета' },
            bone_spear: { level: 5, name: 'Костяное копьё' },
            death_shroud: { level: 5, name: 'Покров смерти' },
            bone_cage: { level: 5, name: 'Костяная клетка' },
            bone_dragon: { level: 5, name: 'Костяной Дракон' }
        }
    };

    /**
     * Активировать магию Света
     * Использование в консоли: activateLight()
     */
    window.activateLight = function() {
        applyDLCFaction('light');
    };

    /**
     * Активировать магию Тьмы
     * Использование в консоли: activateDark()
     */
    window.activateDark = function() {
        applyDLCFaction('dark');
    };

    /**
     * Активировать Некромантию
     * Использование в консоли: activateNecromant()
     */
    window.activateNecromant = function() {
        applyDLCFaction('necromant');
    };

    /**
     * Применить DLC фракцию
     * Меняет: wizard.faction (спрайт), learnedSpells, userData.spells (для UI)
     * НЕ меняет: userData.faction (город остаётся прежним)
     */
    function applyDLCFaction(newFaction) {
        if (!window.userData) {
            console.error('❌ userData не найден');
            return;
        }

        console.log(`🔄 Активация DLC: ${FACTION_NAMES[newFaction]}`);

        // 1. Добавляем заклинания в userData.spells (для фильтров в окне мага)
        if (!window.userData.spells) {
            window.userData.spells = {};
        }
        window.userData.spells[newFaction] = SCHOOL_SPELLS[newFaction];
        console.log(`📚 Добавлены заклинания в userData.spells`);

        // 2. Обновляем магов в userData.wizards (для окна выбора заклинаний)
        if (window.userData.wizards && window.userData.wizards.length > 0) {
            window.userData.wizards.forEach(wizard => {
                // Меняем фракцию мага (для спрайта в бою)
                wizard.faction = newFaction;

                // Добавляем изученные заклинания
                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
            });
            console.log(`🧙 Обновлено ${window.userData.wizards.length} магов в userData.wizards`);
        }

        // 3. Обновляем playerWizards если в бою
        if (window.playerWizards && window.playerWizards.length > 0) {
            window.playerWizards.forEach(wizard => {
                wizard.faction = newFaction;

                if (!wizard.learnedSpells) wizard.learnedSpells = {};
                for (const [spellId, spellData] of Object.entries(SCHOOL_SPELLS[newFaction])) {
                    wizard.learnedSpells[spellId] = spellData.level;
                }
            });
            console.log(`⚔️ Обновлены playerWizards`);

            // Обновляем спрайты
            if (window.pixiWizards?.refreshAllSprites) {
                window.pixiWizards.refreshAllSprites();
                console.log(`🎮 Спрайты обновлены`);
            }
        }

        console.log(`✅ DLC ${FACTION_NAMES[newFaction]} активирован!`);
        console.log('');
        console.log('📋 Теперь откройте экран мага и выберите заклинания в слоты');
    }

    /**
     * Показать статус
     */
    window.showDLCStatus = function() {
        console.log('📋 Статус DLC:');

        if (window.userData?.wizards) {
            window.userData.wizards.forEach((w, i) => {
                const learned = w.learnedSpells ? Object.keys(w.learnedSpells).join(', ') : 'нет';
                console.log(`   ${i}: ${w.name} | Фракция: ${w.faction} | Изучено: ${learned}`);
            });
        }

        if (window.userData?.spells) {
            console.log('   Школы в spells:', Object.keys(window.userData.spells));
        }
    };

    // Вывод справки
    console.log('');
    console.log('📖 Доступные команды:');
    console.log('   activateLight()      - Активировать СВЕТ');
    console.log('   activateDark()       - Активировать ТЬМУ');
    console.log('   activateNecromant()  - Активировать НЕКРОМАНТИЮ');
    console.log('   showDLCStatus()      - Показать статус');
    console.log('');
})();
