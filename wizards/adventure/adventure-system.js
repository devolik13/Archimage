// adventure/adventure-system.js

const ADVENTURE_LEVELS = [
    {
        id: 1,
        name: "Лесная поляна",
        enemies: [
            { name: "Волк", hp: 50, armor: 80, spells: ["gust"], faction: "wind" }
        ],
        reward: { exp: 20, crystals: 10 },
        unlocked: true
    },
    {
        id: 2,
        name: "Темная пещера",
        enemies: [
            { name: "Гоблин-маг", hp: 70, armor: 90, spells: ["spark"], faction: "fire" },
            { name: "Гоблин-воин", hp: 60, armor: 100, spells: ["pebble"], faction: "earth" }
        ],
        reward: { exp: 40, crystals: 20 },
        unlocked: false
    },
    {
        id: 3,
        name: "Ледяные горы",
        enemies: [
            { name: "Ледяной элементаль", hp: 100, armor: 110, spells: ["icicle", "frost_arrow"], faction: "water" }
        ],
        reward: { exp: 60, crystals: 30 },
        unlocked: false
    }
    // Добавить больше уровней
];

function loadAdventureProgress() {
    // Используем БД через window.userData вместо localStorage
    return window.userData?.pve_progress || {};
}

function saveAdventureProgress(progress) {
    // Сохраняем в userData и в БД
    if (window.userData) {
        window.userData.pve_progress = progress;

        // Сохраняем в БД
        if (window.dbManager && typeof window.dbManager.savePlayer === 'function') {
            window.dbManager.savePlayer(window.userData);
        }
    }
}

function startAdventure(levelId) {
    const level = ADVENTURE_LEVELS.find(l => l.id === levelId);
    if (!level) return;
    
    // Формируем противников
    window.enemyFormation = [null, null, null, null, null];
    window.enemyWizards = [];
    
    level.enemies.forEach((enemy, index) => {
        if (index < 5) {
            const enemyWizard = {
                id: `adventure_enemy_${index}`,
                name: enemy.name,
                hp: enemy.hp,
                max_hp: enemy.hp,
                armor: enemy.armor,
                max_armor: enemy.armor,
                faction: enemy.faction,
                spells: enemy.spells,
                level: levelId + 1, // Уровень врага зависит от уровня приключения
                isAdventureEnemy: true
            };
            window.enemyFormation[index] = enemyWizard;
            window.enemyWizards.push(enemyWizard);
        }
    });
    
    // Сохраняем текущий уровень
    window.currentAdventureLevel = levelId;
    
    // Запускаем бой
    if (typeof window.startBattle === 'function') {
        window.startBattle();
    }
}

// Экспорт
window.ADVENTURE_LEVELS = ADVENTURE_LEVELS;
window.loadAdventureProgress = loadAdventureProgress;
window.saveAdventureProgress = saveAdventureProgress;
window.startAdventure = startAdventure;