// core/state-manager.js - Централизованное управление состоянием игры
console.log('✅ core/state-manager.js загружен');

class StateManager {
    constructor() {
        this.state = {
            userId: null,
            userData: null,
            isLoading: false,
            lastSaved: null
        };
        
        this.listeners = [];
        this.saveQueue = null;
    }
    
    // Получить текущее состояние
    getState() {
        return this.state;
    }
    
    // Получить userData
    getUserData() {
        return this.state.userData;
    }
    
    // Установить userId
    setUserId(userId) {
        this.state.userId = userId;
        window.userId = userId; // для обратной совместимости
        this.notify('userId', userId);
    }
    
    // Установить userData (полная замена)
    setUserData(userData) {
        this.state.userData = userData;
        window.userData = userData; // для обратной совместимости
        this.notify('userData', userData);
        this.queueSave();
    }
    
    // Обновить часть userData
    updateUserData(path, value) {
        if (!this.state.userData) return;
        
        const keys = path.split('.');
        let current = this.state.userData;
        
        // Навигация до предпоследнего ключа
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        // Установка значения
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
        
        window.userData = this.state.userData; // синхронизация
        this.notify(path, value);
        this.queueSave();
    }
    
    // Получить значение по пути
    getValue(path) {
        if (!this.state.userData) return null;
        
        const keys = path.split('.');
        let current = this.state.userData;
        
        for (const key of keys) {
            if (current === null || current === undefined) return null;
            current = current[key];
        }
        
        return current;
    }
    
    // Подписка на изменения
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    // Уведомление подписчиков
    notify(path, value) {
        this.listeners.forEach(listener => {
            try {
                listener(path, value, this.state.userData);
            } catch (error) {
                console.error('Ошибка в listener:', error);
            }
        });
    }
    
    // Отложенное сохранение (debounce)
    queueSave() {
    	// ВРЕМЕННО ОТКЛЮЧАЕМ автосохранение
    	// пока не будет создан правильный endpoint на сервере
    	return;
    
    	/* Закомментировано до создания endpoint
    	if (this.saveQueue) {
    	    clearTimeout(this.saveQueue);
    	}
    
    	this.saveQueue = setTimeout(() => {
    	    this.save();
    	}, 2000);
    	*/
    }

    
    // Немедленное сохранение
    async save() {
    	// ВРЕМЕННО ОТКЛЮЧАЕМ
    	console.log('⚠️ Автосохранение временно отключено');
    	return;
    
    	/* Закомментировано до создания endpoint
    	if (!this.state.userId || !this.state.userData) return;
    
    	try {
    	    const response = await fetch(`${window.API_BASE_URL}/api/user/save`, {
    	        method: 'POST',
    	        headers: { 'Content-Type': 'application/json' },
    	        body: JSON.stringify({
    	            user_id: this.state.userId,
    	            userData: this.state.userData
    	        })
    	    });
        
    	    if (response.ok) {
    	        this.state.lastSaved = Date.now();
    	        console.log('💾 Состояние сохранено');
    	    }
    	} catch (error) {
    	    console.error('❌ Ошибка сохранения:', error);
    	}
    	*/
    }

    // Принудительное сохранение перед закрытием
    setupAutoSave() {
    	// ВРЕМЕННО ОТКЛЮЧАЕМ
    	console.log('⚠️ Автосохранение при закрытии отключено');
    	return;
    
    	/* Закомментировано
    	window.addEventListener('beforeunload', () => {
    	    if (this.saveQueue) {
    	        clearTimeout(this.saveQueue);
    	        navigator.sendBeacon(
    	            `${window.API_BASE_URL}/api/save`,
    	            JSON.stringify({
    	                user_id: this.state.userId,
    	                userData: this.state.userData
    	            })
    	        );
    	    }
    	});
    	*/
    }
}

// Создаём глобальный экземпляр
window.stateManager = new StateManager();
window.stateManager.setupAutoSave();

// Хелперы для обратной совместимости
window.getState = () => window.stateManager.getState();
window.getUserData = () => window.stateManager.getUserData();
window.updateState = (path, value) => window.stateManager.updateUserData(path, value);

console.log('🎯 State Manager инициализирован');