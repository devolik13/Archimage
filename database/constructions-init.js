// constructions-init.js - Инициализация обработки constructions
console.log('✅ constructions-init.js загружен');

// Патчим функцию загрузки данных
const originalLoadUserData = window.loadUserData;
window.loadUserData = async function() {
    // Вызываем оригинальную функцию
    const result = originalLoadUserData ? await originalLoadUserData() : null;
    
    // После загрузки извлекаем constructions из buildings
    if (window.userData && window.userData.buildings && window.userData.buildings._active_constructions) {
        window.userData.constructions = window.userData.buildings._active_constructions;
        delete window.userData.buildings._active_constructions;
        console.log('📦 Активные стройки извлечены из buildings:', window.userData.constructions);
    }
    
    // Если constructions не определена, инициализируем
    if (window.userData && !window.userData.constructions) {
        window.userData.constructions = [];
        console.log('📦 Constructions инициализирована пустым массивом');
    }
    
    return result;
};

// Патчим функцию сохранения
const originalSavePlayer = window.dbManager?.savePlayer;
if (originalSavePlayer) {
    window.dbManager.savePlayer = async function(playerData) {
        // Перед сохранением помещаем constructions в buildings
        if (playerData.constructions && playerData.buildings) {
            console.log('💾 Сохраняем constructions внутри buildings');
            // Уже реализовано в db-manager.js
        }
        
        // Вызываем оригинальную функцию
        return originalSavePlayer.call(this, playerData);
    };
}

console.log('✅ Система обработки constructions инициализирована');