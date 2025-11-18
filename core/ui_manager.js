// ui_manager.js - Управление основным UI...
console.log('✅ ui_manager.js загружен');

// --- Обновление интерфейса ---
function updateUI() {
    console.log("updateUI called");
    if (!window.userData) return;

    // Скрываем форму выбора фракции
    const factionSelection = document.getElementById('faction-selection');
    if (factionSelection) {
        factionSelection.style.display = 'none';
    }

    // Показываем игровую зону
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'block';
    }

    const factionElement = document.getElementById('faction');
    if (factionElement) {
        factionElement.textContent = window.userData.faction || 'Неизвестно';
    }

    // Обновляем фон
    if (window.userData.faction && typeof window.updateBackgroundByFaction === 'function') {
        window.updateBackgroundByFaction(window.userData.faction);
    }

    // ВАЖНО: Инициализируем системы UI в правильном порядке
    
    // 1. Инициализация аватара игрока (уровень)
    if (typeof window.createPlayerAvatarUI === 'function') {
        console.log('📊 Инициализация аватара игрока');
        window.createPlayerAvatarUI();
    }
    
    // 2. Инициализация временной валюты
    if (typeof window.initTimeCurrency === 'function') {
        console.log('⏰ Инициализация валюты времени');
        window.initTimeCurrency();
    }
    
    // 3. Инициализация системы строительства
    if (typeof window.initConstructionSystem === 'function') {
        console.log('🔨 Инициализация системы строительства');
        window.initConstructionSystem();
    }

    // 4. Обновляем сетки и списки
    if (typeof window.initCityViewSystem === 'function') {
    	window.initCityViewSystem();
    }
    if (typeof window.updateWizardsList === 'function') {
        window.updateWizardsList();
    }
}

// --- Обновление UI с ошибкой ---
function updateUIWithError(errorMessage) {
    const factionElement = document.getElementById('faction');
    if (factionElement) {
        factionElement.textContent = errorMessage;
    }
}

// --- Показ формы выбора фракции ---
function showFactionSelection() {
    console.log("Показ формы выбора фракции");

    // Скрываем игровую зону
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
        gameArea.style.display = 'none';
    }

    // Показываем форму выбора фракции
    const factionSelection = document.getElementById('faction-selection');
    if (factionSelection) {
        factionSelection.style.display = 'block';
    }

    const factionElement = document.getElementById('faction');
    if (factionElement) {
        factionElement.textContent = 'Выбор фракции...';
    }
}

// --- Загрузка данных пользователя ---
async function loadUserData() {
    if (!window.userId) {
        updateUIWithError('Нет ID пользователя');
        return;
    }

    try {
        console.log('📥 Загрузка данных пользователя...');

        // ИСПРАВЛЕНИЕ: Используем правильную инициализацию через game-db-integration
        console.log('✅ Используем Supabase для управления данными');
        if (typeof window.initGameWithDatabase === 'function') {
            await window.initGameWithDatabase();
        } else {
            console.error("❌ Функция initGameWithDatabase не найдена.");
            // Fallback - показываем выбор фракции только если функция не найдена
            if (typeof window.showFactionSelection === 'function') {
                window.showFactionSelection();
            }
        }
        return;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        updateUIWithError('Ошибка загрузки данных');
    }
}

// Делаем функцию доступной глобально
window.loadUserData = loadUserData;


// Вызываем инициализацию при загрузке страницы если данные уже есть
window.addEventListener('load', () => {
    if (window.userData) {
        if (typeof window.createPlayerAvatarUI === 'function') {
            window.createPlayerAvatarUI();
        }
        if (typeof window.initTimeCurrency === 'function') {
            window.initTimeCurrency();
        }
    }
});
// --- Закрытие всех модальных окон ---
let isClosingModals = false;

function closeAllModals() {
    if (isClosingModals) return;
    isClosingModals = true;
    
    try {
        console.log('Closing all modals via closeAllModals');
        
        // Use new closeAll method if available
        if (window.Modal && window.Modal.closeAll) {
            window.Modal.closeAll();
        } else if (typeof window.closeCurrentModal === 'function') {
            // Use closeCurrentModal as fallback
            window.closeCurrentModal();
        }
    } finally {
        setTimeout(() => {
            isClosingModals = false;
        }, 100);
    }
}

// Добавляем к экспортам внизу файла:
window.closeAllModals = closeAllModals;
window.loadUserData = loadUserData;
window.updateUI = updateUI;
window.updateUIWithError = updateUIWithError;
window.showFactionSelection = showFactionSelection;