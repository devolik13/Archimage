// main.js - Entry point для Vite
console.log('🚀 Загрузка Archimage через Vite...');

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
import './spells/script_spells_standard.js';
import './spells/script_spells_hybrid.js';
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
import './wizards/adventure/adventure-system.js';
import './wizards/adventure/adventure-ui.js';

// ============ BATTLE SYSTEMS ============
import './battle/rating-system.js';
import './battle/opponent-selection.js';
import './battle/leaderboard.js';
import './battle/battle-logger.js';
import './battle/logger.js';
import './battle/battle-timer-manager.js';
import './battle/battle-result-screen.js';
import './battle/script_battle_setup.js';
import './battle/demo-battle.js';
import './battle/ui.js';
import './battle/core.js';
import './battle/spells.js';
import './battle/damage-system.js';
import './battle/magic-resistance.js';
import './battle/walls.js';
import './battle/wall-blocking.js';
import './battle/weather.js';
import './battle/summons-manager.js';
import './battle/effects-system.js';
import './battle/targeting.js';
import './battle/targeting-utils.js';
import './battle/projectiles.js';
import './battle/multi-layer-protection.js';
import './battle/single-target-visual-system.js';

// ============ RENDERER (PixiJS) ============
import './renderer/pixi-core.js';
import './renderer/pixi-wizards.js';
import './renderer/pixi-dragon.js';
import './renderer/animation-manager.js';
import './renderer/animations-config.js';
import './renderer/impact-detection.js';

// ============ ANIMATIONS ============
import './animations/animation-utils.js';
import './animations/faction-speech-bubble.js';

// Fire animations
import './animations/fire/burning-effect.js';
import './animations/fire/burning-ground.js';
import './animations/fire/fire-tsunami.js';
import './animations/fire/fire-wall.js';
import './animations/fire/fireball.js';
import './animations/fire/firebolt.js';
import './animations/fire/spark.js';

// Water animations
import './animations/water/absolute_zero.js';
import './animations/water/blizzard.js';
import './animations/water/frost-arrow.js';
import './animations/water/ice-rain.js';
import './animations/water/icicle.js';

// Wind animations
import './animations/wind/chain-lightning.js';
import './animations/wind/gust.js';
import './animations/wind/storm-cloud.js';
import './animations/wind/wind-blade.js';
import './animations/wind/wind-wall.js';

// Earth animations
import './animations/earth/earth-wall.js';
import './animations/earth/meteor.js';
import './animations/earth/pebble.js';
import './animations/earth/stone-grotto.js';
import './animations/earth/stone-spike.js';

// Nature animations
import './animations/nature/bark-armor.js';
import './animations/nature/call-wolf.js';
import './animations/nature/ent-visual.js';
import './animations/nature/leaf-canopy.js';
import './animations/nature/meteorokinesis.js';

// Poison animations
import './animations/poison/epidemic.js';
import './animations/poison/foul-cloud.js';
import './animations/poison/plague.js';
import './animations/poison/poisoned_blade.js';
import './animations/poison/poisoned_glade.js';

// ============ CONSTRUCTION VISUAL ============
import './construction-visual-clean.js';

console.log('✅ Все модули Archimage загружены через Vite!');
