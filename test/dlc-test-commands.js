// test/dlc-test-commands.js - Консольные команды для тестирования DLC Света и Тьмы

(function() {
    console.log('🧪 Загружены тестовые команды DLC Света и Тьмы');

    // Заклинания Света (все 5 уровня)
    const LIGHT_SPELLS = {
        flash: { level: 5, slot: 0 },
        light_beam: { level: 5, slot: 1 },
        rainbow_shield: { level: 5, slot: 2 },
        sun_radiance: { level: 5, slot: 3 },
        dawn: { level: 5, slot: 4 }
    };

    // Заклинания Тьмы (все 5 уровня)
    const DARK_SPELLS = {
        dark_clot: { level: 5, slot: 0 },
        weakness: { level: 5, slot: 1 },
        miasma: { level: 5, slot: 2 },
        shadow_realm: { level: 5, slot: 3 },
        fading: { level: 5, slot: 4 }
    };

    /**
     * Активировать магию Света для первого мага игрока
     * Использование в консоли: activateLight()
     */
    window.activateLight = function(wizardIndex = 0) {
        const wizardId = window.playerFormation?.[wizardIndex];
        if (!wizardId) {
            console.error('❌ Маг не найден на позиции', wizardIndex);
            return;
        }

        const wizard = window.playerWizards?.find(w => w.id === wizardId);
        if (!wizard) {
            console.error('❌ Маг не найден в playerWizards');
            return;
        }

        // Меняем фракцию
        wizard.faction = 'light';
        wizard.school = 'light';

        // Добавляем все заклинания Света
        if (!wizard.spells) wizard.spells = [];
        wizard.spells = [
            { id: 'flash', level: 5 },
            { id: 'light_beam', level: 5 }
        ];

        // Добавляем изученные заклинания
        if (!wizard.learnedSpells) wizard.learnedSpells = {};
        wizard.learnedSpells = {
            flash: 5,
            light_beam: 5,
            rainbow_shield: 5,
            sun_radiance: 5,
            dawn: 5
        };

        // Обновляем userData.spells если нужно для UI
        if (window.userData && window.userData.spells) {
            if (!window.userData.spells.light) {
                window.userData.spells.light = {};
            }
            window.userData.spells.light = {
                flash: { level: 5, name: 'Вспышка' },
                light_beam: { level: 5, name: 'Луч света' },
                rainbow_shield: { level: 5, name: 'Радужный щит' },
                sun_radiance: { level: 5, name: 'Сияние солнца' },
                dawn: { level: 5, name: 'Рассвет' }
            };
        }

        // Обновляем спрайт на поле боя
        if (window.createPlayerWizardSprite) {
            window.createPlayerWizardSprite(wizardIndex, wizard);
        }

        console.log('✨ Магия СВЕТА активирована для', wizard.name);
        console.log('   Фракция:', wizard.faction);
        console.log('   Заклинания:', Object.keys(wizard.learnedSpells));

        // Обновляем отображение если в бою
        if (window.pixiWizards?.refreshAllSprites) {
            window.pixiWizards.refreshAllSprites();
        }

        return wizard;
    };

    /**
     * Активировать магию Тьмы для первого мага игрока
     * Использование в консоли: activateDark()
     */
    window.activateDark = function(wizardIndex = 0) {
        const wizardId = window.playerFormation?.[wizardIndex];
        if (!wizardId) {
            console.error('❌ Маг не найден на позиции', wizardIndex);
            return;
        }

        const wizard = window.playerWizards?.find(w => w.id === wizardId);
        if (!wizard) {
            console.error('❌ Маг не найден в playerWizards');
            return;
        }

        // Меняем фракцию
        wizard.faction = 'dark';
        wizard.school = 'dark';

        // Добавляем активные заклинания (слоты)
        if (!wizard.spells) wizard.spells = [];
        wizard.spells = [
            { id: 'dark_clot', level: 5 },
            { id: 'weakness', level: 5 }
        ];

        // Добавляем изученные заклинания
        if (!wizard.learnedSpells) wizard.learnedSpells = {};
        wizard.learnedSpells = {
            dark_clot: 5,
            weakness: 5,
            miasma: 5,
            shadow_realm: 5,
            fading: 5
        };

        // Обновляем userData.spells если нужно для UI
        if (window.userData && window.userData.spells) {
            if (!window.userData.spells.dark) {
                window.userData.spells.dark = {};
            }
            window.userData.spells.dark = {
                dark_clot: { level: 5, name: 'Сгусток тьмы' },
                weakness: { level: 5, name: 'Слабость' },
                miasma: { level: 5, name: 'Миазма' },
                shadow_realm: { level: 5, name: 'Мир теней' },
                fading: { level: 5, name: 'Угасание' }
            };
        }

        // Обновляем спрайт на поле боя
        if (window.createPlayerWizardSprite) {
            window.createPlayerWizardSprite(wizardIndex, wizard);
        }

        console.log('🌑 Магия ТЬМЫ активирована для', wizard.name);
        console.log('   Фракция:', wizard.faction);
        console.log('   Заклинания:', Object.keys(wizard.learnedSpells));

        // Обновляем отображение если в бою
        if (window.pixiWizards?.refreshAllSprites) {
            window.pixiWizards.refreshAllSprites();
        }

        return wizard;
    };

    /**
     * Показать статус всех магов
     * Использование в консоли: showWizards()
     */
    window.showWizards = function() {
        if (!window.playerWizards) {
            console.log('❌ playerWizards не найден');
            return;
        }

        console.log('📋 Маги игрока:');
        window.playerWizards.forEach((wizard, index) => {
            const inFormation = window.playerFormation?.includes(wizard.id);
            const pos = window.playerFormation?.indexOf(wizard.id);
            console.log(`  ${index}: ${wizard.name} | Фракция: ${wizard.faction || 'нет'} | HP: ${wizard.hp}/${wizard.max_hp} | Позиция: ${pos >= 0 ? pos : 'нет'}`);
            if (wizard.spells) {
                console.log(`     Слоты: ${wizard.spells.map(s => s.id).join(', ')}`);
            }
        });
    };

    /**
     * Быстрый тест: активировать Свет на позиции 0, Тьму на позиции 1
     * Использование в консоли: testLightDark()
     */
    window.testLightDark = function() {
        console.log('🧪 Тест: Свет на позиции 0, Тьма на позиции 1');
        activateLight(0);
        if (window.playerFormation?.length > 1) {
            activateDark(1);
        }
        showWizards();
    };

    // Вывод справки
    console.log('');
    console.log('📖 Доступные команды:');
    console.log('   activateLight(позиция) - Активировать магию Света');
    console.log('   activateDark(позиция)  - Активировать магию Тьмы');
    console.log('   showWizards()          - Показать всех магов');
    console.log('   testLightDark()        - Тест: Свет+Тьма');
    console.log('');
})();
