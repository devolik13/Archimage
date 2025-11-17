// main.js - Entry point для Vite
console.log('🚀 Загрузка Archimage через Vite...');

// ============ СТИЛИ ============
import './style.css';
import './city/city-mobile.css';
import './wizards/wizard-detail.css';
import './battle/script_battle.css';
import './battle/modal-styles.css';

// ============ CORE СИСТЕМЫ ============
import './portrait-blocker.js';
import './core/utilities.js';
import './core/modal-system.js';
import './core/constants.js';
import './core/helpers.js';
import './core/state-manager.js';
import './core/ui_manager.js';
import './core/supabase-client.js';

// ============ DATABASE ============
import './database/db-manager.js';
import './database/event-save-manager.js';
import './database/game-db-integration.js';
import './database/constructions-init.js';
import './database/onboarding.js';

// ============ FACTION SELECTION ============
import './faction-selection-system.js';

// ============ SPELLS DATA ============
import './spells/data/spell-tiers.js';
import './spells/data/school-config.js';
import './spells/data/spell-basic-data.js';
import './spells/data/spell-full-data.js';
import './spells/data/spell-functions.js';
import './spells/data/spell-types.js';
import './spells/data/index.js';
import './spells/data/spell-registry.js';

// ============ SPELLS LOGIC ============
import './spells/logic/spells-fire.js';
import './spells/logic/spells-water.js';
import './spells/logic/spells-wind.js';
import './spells/logic/spells-earth.js';
import './spells/logic/spells-nature.js';
import './spells/logic/spells-poison.js';

// ============ SPELLS SYSTEM ============
import './spells/library_ui.js';

// ============ CITY SYSTEMS ============
import './city/buildings-config.js';
import './city/city-view-system.js';
import './city/city-clickable-system.js';
import './city/time-currency-system.js';
import './city/time-construction-system.js';
import './city/script_buildings.js';

// City positions
import './city/positions/fire-positions.js';
import './city/positions/water-positions.js';
import './city/positions/wind-positions.js';
import './city/positions/earth-positions.js';
import './city/positions/nature-positions.js';
import './city/positions/poison-positions.js';

// ============ WIZARDS ============
import './wizards/experience-system.js';
import './wizards/player-level-system.js';
import './wizards/script_wizards.js';
import './wizards/wizard-detail-screen.js';
import './wizards/blessing-tower-system.js';

// ============ BATTLE SYSTEMS ============
import './battle/rating-system.js';
import './battle/opponent-selection.js';
import './battle/leaderboard.js';
import './battle/pvp-arena.js';
import './battle/battle-logger.js';
import './battle/battle-timer-manager.js';
import './battle/battle-result-screen.js';
import './battle/core.js';
import './battle/spells.js';
import './battle/damage-manager.js';
import './battle/spell-resistances.js';
import './battle/walls.js';
import './battle/summons-manager.js';

// ============ BATTLE ANIMATIONS ============
import './battle/animations/animation-manager.js';
import './battle/animations/projectile-system.js';
import './battle/animations/spell-animations.js';

// Battle visuals (PixiJS)
import './battle/visuals/pixi-core.js';
import './battle/visuals/render-battlefield.js';
import './battle/visuals/render-wizard.js';
import './battle/visuals/render-health.js';
import './battle/visuals/render-spellbar.js';

// ============ TELEGRAM INTEGRATION ============
import './telegram-init.js';

// ============ CONSTRUCTION VISUAL ============
import './construction-visual-clean.js';

console.log('✅ Все модули Archimage загружены через Vite!');
