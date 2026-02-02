// main.js - Единая точка входа для Vite
// Этот файл импортирует все модули в правильном порядке

console.log('🚀 Vite main.js загружается...');

// ============================================
// 1. ЯДРО СИСТЕМЫ (Core)
// ============================================
import './core/utilities.js';
import './core/modal-system.js';
import './core/constants.js';
import './core/helpers.js';
import './core/state-manager.js';
import './core/ui_manager.js';
import './core/offline-notifications-system.js';
import './core/supabase-client.js';

// ============================================
// 2. БАЗА ДАННЫХ (Database)
// ============================================
import './database/telegram-validate.js';
import './database/db-manager.js';
import './database/event-save-manager.js';
import './database/avatar-manager.js';
import './database/game-db-integration.js';
import './database/constructions-init.js';
import './database/onboarding.js';
import './database/guild-manager.js';
import './database/referral-manager.js';
import './modals/guild-modal.js';
import './modals/airdrop-modal.js';
import './modals/shop-modal.js';
import './modals/knowledge-book-modal.js';
import './modals/hint-slider-modal.js';
import './modals/faction-selection-system.js';
import './modals/promo-event-modal.js';

// ============================================
// 3. КОНФИГУРАЦИЯ ЗАКЛИНАНИЙ (Spells Data)
// ============================================
import './spells/data/spell-tiers.js';
import './spells/data/school-config.js';
import './spells/data/spell-basic-data.js';
import './spells/data/spell-full-data.js';
import './spells/data/spell-functions.js';
import './spells/data/spell-types.js';
import './spells/data/index.js';
import './spells/data/spell-registry.js';

// ============================================
// 4. ГОРОД (City)
// ============================================
import './city/buildings-config.js';
import './city/building-descriptions.js';
import './city/city-view-core.js';
import './city/city-view-ui.js';
import './city/city-view-buildings.js';
import './city/city-clickable-system.js';
import './city/time-currency-system.js';
import './city/daily-login-rewards.js';
import './city/time-construction-system.js';
import './city/script_buildings.js';
import './arena/arena-core.js';
import './arena/arena-screens.js';
import './city/construction-visual-clean.js';
import './city/wizard-tower-modal-bg.js';
import './city/arcane-lab-modal-bg.js';
import './city/time-generator-modal-bg.js';
import './city/blessing-tower-modal-bg.js';

// ============================================
// 5. МАГИ (Wizards)
// ============================================
import './wizards/experience-system.js';
import './wizards/player-level-system.js';
import './wizards/blessing-tower-system.js';
import './wizards/skin-system.js';
import './wizards/skin-modal.js';
import './wizards/wizard-detail-screen.js';
import './wizards/script_wizards.js';
import './wizards/adventure/pve-chapter1-config.js';
import './wizards/adventure/adventure-map.js';
import './wizards/adventure/adventure-hub.js';
import './wizards/adventure/pve-ui.js';

// Мини-игры
import './minigames/training-dummy-config.js';
import './minigames/training-dummy-battle.js';
import './minigames/training-dummy-ui.js';

// ============================================
// 6. БИБЛИОТЕКА ЗАКЛИНАНИЙ (Spells UI)
// ============================================
import './spells/library_ui.js';
import './spells/script_spells_standard.js';

// ============================================
// 7. БОЕВАЯ СИСТЕМА - ЯДРО (Battle Core)
// ============================================
import './battle/weather.js';
import './battle/damage-system.js';
import './battle/effects-system.js';
import './battle/battle-energy-system.js';
import './battle/logger.js';
import './battle/battle-logger.js';
import './battle/targeting-utils.js';
import './battle/single-target-visual-system.js';
import './battle/multi-layer-protection.js';
import './battle/magic-resistance.js';

// ============================================
// 8. БОЕВАЯ СИСТЕМА - МЕХАНИКИ (Battle Mechanics)
// ============================================
import './battle/projectiles.js';
import './battle/summons-manager.js';
import './battle/walls.js';
import './battle/wall-blocking.js';

// ============================================
// 9. БОЕВАЯ СИСТЕМА - ГЛАВНАЯ ЛОГИКА (Battle Main)
// ============================================
import './battle/targeting.js';
import './battle/spells.js';
import './battle/core.js';
import './battle/rating-system.js';
import './battle/league-rewards.js';
import './battle/leaderboard.js';
import './battle/opponent-selection.js';
import './battle/battle-result-screen.js';
import './battle/ui.js';
import './battle/battle-speed-controller.js'; // Единый контроллер скорости боя
import './battle/demo-battle.js';
import './battle/script_battle_setup.js';

// ============================================
// 10. ЛОГИКА ЗАКЛИНАНИЙ ПО ШКОЛАМ (Spells Logic)
// ============================================
import './spells/logic/spells-fire.js';
import './spells/logic/spells-water.js';
import './spells/logic/spells-wind.js';
import './spells/logic/spells-earth.js';
import './spells/logic/spells-nature.js';
import './spells/logic/spells-poison.js';
import './spells/logic/spells-light.js';
import './spells/logic/spells-dark.js';

// ============================================
// 11. PIXI.JS РЕНДЕРИНГ (Renderer)
// Примечание: PIXI.js загружается как CDN в HTML
// ============================================
import './renderer/pixi-core.js';
import './renderer/pixi-wizards.js';
import './renderer/pixi-dragon.js';
import './renderer/animation-manager.js';
import './renderer/animations-config.js';
import './renderer/impact-detection.js';

// ============================================
// 12. УТИЛИТЫ ДЛЯ АНИМАЦИЙ (Animation Utilities)
// ============================================
import './animations/animation-utils.js';
// animation-speed-manager.js - функции теперь в battle-speed-controller.js
import './animations/faction-speech-bubble.js';

// ============================================
// 13. АНИМАЦИИ ЗАКЛИНАНИЙ - ОГОНЬ (Fire)
// ============================================
import './animations/fire/spark.js';
import './animations/fire/firebolt.js';
import './animations/fire/fire-wall.js';
import './animations/fire/fireball.js';
import './animations/fire/fire-tsunami.js';
import './animations/fire/burning-effect.js';
import './animations/fire/burning-ground.js';

// ============================================
// 14. АНИМАЦИИ ЗАКЛИНАНИЙ - ВОДА (Water)
// ============================================
import './animations/water/icicle.js';
import './animations/water/frost-arrow.js';
import './animations/water/ice-rain.js';
import './animations/water/blizzard.js';
import './animations/water/absolute_zero.js';
import './animations/water/chilled-effect.js';

// ============================================
// 15. АНИМАЦИИ ЗАКЛИНАНИЙ - ВЕТЕР (Wind)
// ============================================
import './animations/wind/gust.js';
import './animations/wind/wind-blade.js';
import './animations/wind/wind-wall.js';
import './animations/wind/storm-cloud.js';
import './animations/wind/ball-lightning.js';

// ============================================
// 16. АНИМАЦИИ ЗАКЛИНАНИЙ - ЗЕМЛЯ (Earth)
// ============================================
import './animations/earth/pebble.js';
import './animations/earth/stone-spike.js';
import './animations/earth/earth-wall.js';
import './animations/earth/stone-grotto.js';
import './animations/earth/meteor.js';

// ============================================
// 17. АНИМАЦИИ ЗАКЛИНАНИЙ - ПРИРОДА (Nature)
// ============================================
import './animations/nature/call-wolf.js';
import './animations/nature/bark-armor.js';
import './animations/nature/leaf-canopy.js';
import './animations/nature/ent-visual.js';
import './animations/nature/meteorokinesis.js';

// ============================================
// 18. АНИМАЦИИ ЗАКЛИНАНИЙ - ЯД (Poison)
// ============================================
import './animations/poison/poisoned_blade.js';
import './animations/poison/poisoned_glade.js';
import './animations/poison/foul-cloud.js';
import './animations/poison/plague.js';
import './animations/poison/epidemic.js';

// ============================================
// 19. АНИМАЦИИ ЗАКЛИНАНИЙ - СВЕТ (Light)
// ============================================
import './animations/light/flash.js';
import './animations/light/light-beam.js';
import './animations/light/rainbow-shield.js';
import './animations/light/sun-radiance.js';
import './animations/light/dawn.js';
import './animations/light/blinded-effect.js';
import './animations/light/dawn-effect.js';

// ============================================
// 20. АНИМАЦИИ ЗАКЛИНАНИЙ - ТЬМА (Dark)
// ============================================
import './animations/dark/dark-clot.js';
import './animations/dark/weakened-effect.js';
import './animations/dark/weakness.js';
import './animations/dark/miasma.js';
import './animations/dark/miasma-effect.js';
import './animations/dark/shadow-realm.js';
import './animations/dark/fading.js';

// ============================================
// 21. ТЕСТОВЫЕ КОМАНДЫ DLC
// ============================================
import './test/dlc-test-commands.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================
console.log('✅ Все модули загружены через Vite');

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM загружен, запуск инициализации...");

    // Получаем userId из Telegram WebApp
    let userId = "test_user";
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        userId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        console.log("✅ Telegram user ID:", userId);
        console.log("👤 Telegram username:", window.Telegram.WebApp.initDataUnsafe.user.username);
    } else {
        console.warn("⚠️ Telegram WebApp не найден, используется тестовый ID");
    }

    window.userId = userId;
    window.API_BASE_URL = window.API_BASE_URL || "http://localhost:3000";
    window.userData = window.userData || null;
    window.currentModal = window.currentModal || null;

    console.log(`🆔 UserID: ${window.userId}`);
    console.log(`🌐 API Base URL: ${window.API_BASE_URL}`);
});

// Инициализация после полной загрузки всех ресурсов
window.addEventListener('load', async () => {
    console.log("📄 Все ресурсы загружены, запуск предзагрузки ассетов...");

    // Предзагружаем все игровые ассеты с экраном загрузки
    if (typeof window.preloadAllAssets === 'function') {
        await window.preloadAllAssets(true); // true = показать экран загрузки
        console.log("✅ Все ассеты предзагружены, запуск игры...");
    } else {
        console.warn("⚠️ Asset Preloader не найден, пропускаем предзагрузку");
    }

    // Загружаем данные игрока и запускаем игру
    if (typeof window.loadUserData === 'function') {
        window.loadUserData();
    } else {
        console.error("❌ Функция loadUserData не найдена.");
        if (typeof window.showFactionSelection === 'function') {
            console.log("ℹ️ Показ формы выбора фракции (резервный вариант).");
            window.showFactionSelection();
        }
    }

    // Принудительная инициализация валюты времени
    setTimeout(() => {
        if (window.userData && typeof window.initTimeCurrency === 'function') {
            window.initTimeCurrency();
            console.log('⏲️ Валюта времени инициализирована');
        }
    }, 1000);
});

console.log('🎮 main.js полностью выполнен');
