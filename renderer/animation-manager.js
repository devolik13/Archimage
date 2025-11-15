// battle/renderer/animation-manager.js - Улучшенная версия с защитой от ошибок
console.log('✅ animation-manager.js загружен');

class AnimationManager {
    constructor() {
        this.activeAnimations = new Map(); // Изменено на Map для лучшего контроля
        this.activeIntervals = new Set();
        this.activeTimeouts = new Set();
        this.rafCallbacks = new Map(); // Хранилище для RAF колбэков
    }
    
    // Безопасная обертка для анимационных функций
    createSafeAnimationWrapper(callback, pixiObject = null, animationId = null) {
        let cancelled = false;
        let rafId = null;
        
        const safeCallback = () => {
            // Проверяем, не отменена ли анимация
            if (cancelled) {
                return;
            }
            
            // Проверяем существование PIXI объекта если он передан
            if (pixiObject) {
                if (!pixiObject.transform || pixiObject.destroyed) {
                    console.log('🛑 Объект удален, останавливаем анимацию');
                    this.cancelAnimation(animationId || rafId);
                    return;
                }
            }
            
            // Безопасно вызываем колбэк
            try {
                callback();
            } catch (err) {
                console.warn('⚠️ Ошибка в анимации, останавливаем:', err.message);
                this.cancelAnimation(animationId || rafId);
            }
        };
        
        // Функция отмены
        safeCallback.cancel = () => {
            cancelled = true;
            if (rafId) {
                cancelAnimationFrame(rafId);
                this.rafCallbacks.delete(rafId);
            }
        };
        
        return safeCallback;
    }
    
    // Безопасный requestAnimationFrame с проверками
    safeRequestAnimationFrame(callback, pixiObject = null) {
        const animationId = Symbol('animation');
        const wrappedCallback = this.createSafeAnimationWrapper(callback, pixiObject, animationId);
        
        const rafWrapper = () => {
            if (!wrappedCallback.cancelled) {
                wrappedCallback();
            }
        };
        
        const rafId = requestAnimationFrame(rafWrapper);
        
        // Сохраняем информацию об анимации
        this.activeAnimations.set(animationId, {
            rafId: rafId,
            cancel: () => {
                cancelAnimationFrame(rafId);
                wrappedCallback.cancel();
            },
            pixiObject: pixiObject
        });
        
        this.rafCallbacks.set(rafId, wrappedCallback);
        
        return animationId;
    }
    
    // Отмена конкретной анимации
    cancelAnimation(animationId) {
        const animation = this.activeAnimations.get(animationId);
        if (animation) {
            animation.cancel();
            this.activeAnimations.delete(animationId);
        }
    }
    
    // Безопасное удаление PIXI объекта
    safeRemove(pixiObject) {
        if (!pixiObject) return;
        
        try {
            // Проверяем, что объект еще валиден
            if (!pixiObject.transform) {
                return; // Объект уже уничтожен
            }
            
            // Останавливаем анимацию для AnimatedSprite
            if (pixiObject instanceof PIXI.AnimatedSprite) {
                pixiObject.stop();
                // Очищаем обработчики
                pixiObject.onComplete = null;
                pixiObject.onFrameChange = null;
                pixiObject.onLoop = null;
            }
            
            // Удаляем из родителя
            if (pixiObject.parent) {
                pixiObject.parent.removeChild(pixiObject);
            }
            
            // Уничтожаем только если это безопасно
            if (pixiObject.destroy && pixiObject.transform) {
                // Для AnimatedSprite не уничтожаем текстуры из атласа
                if (pixiObject instanceof PIXI.AnimatedSprite) {
                    pixiObject.destroy({ 
                        children: true, 
                        texture: false,  // НЕ уничтожаем текстуры
                        baseTexture: false 
                    });
                } else {
                    pixiObject.destroy({ children: true, texture: false, baseTexture: false });
                }
            }
        } catch (err) {
            console.warn('Ошибка при удалении объекта:', err);
        }
    }
    
    // Очистка всех анимаций
    clearAll() {
        console.log('🧹 Очистка всех анимаций...');
        
        // Отменяем все RAF анимации
        this.activeAnimations.forEach((animation, id) => {
            try {
                animation.cancel();
            } catch (err) {
                console.warn('Ошибка отмены анимации:', err);
            }
        });
        this.activeAnimations.clear();
        this.rafCallbacks.clear();
        
        // Очищаем интервалы
        this.activeIntervals.forEach(id => clearInterval(id));
        this.activeIntervals.clear();
        
        // Очищаем таймауты
        this.activeTimeouts.forEach(id => clearTimeout(id));
        this.activeTimeouts.clear();
        
        // Очищаем все зарегистрированные анимации заклинаний
        if (window.spellAnimations) {
            Object.keys(window.spellAnimations).forEach(key => {
                if (window.spellAnimations[key]?.clearAll) {
                    try {
                        window.spellAnimations[key].clearAll();
                    } catch (err) {
                        console.warn(`Ошибка очистки ${key}:`, err);
                    }
                }
            });
        }
        
        // Очищаем менеджер призывов
        if (window.summonsManager) {
            try {
                // Безопасно удаляем все визуалы
                if (window.summonsManager.visuals) {
                    window.summonsManager.visuals.forEach((visual, id) => {
                        this.safeRemove(visual);
                    });
                    window.summonsManager.visuals.clear();
                }
                if (window.summonsManager.summons) {
                    window.summonsManager.summons.clear();
                }
            } catch (err) {
                console.warn('Ошибка очистки призывов:', err);
            }
        }
        
        // Очищаем контейнеры эффектов
        const effectsContainer = window.pixiCore?.getEffectsContainer?.();
        if (effectsContainer && effectsContainer.children) {
            // Копируем массив, так как будем модифицировать
            const children = [...effectsContainer.children];
            children.forEach(child => {
                this.safeRemove(child);
            });
        }
        
        console.log('✅ Очистка завершена');
    }
}

// Создаем глобальный экземпляр
window.animationManager = new AnimationManager();

// Создаем глобальную функцию для безопасных анимаций
window.safeAnimate = function(callback, pixiObject = null) {
    return window.animationManager.safeRequestAnimationFrame(callback, pixiObject);
};

// НЕ переопределяем глобальные функции, а предоставляем безопасные альтернативы
window.safeSetInterval = function(callback, delay, ...args) {
    const id = setInterval(callback, delay, ...args);
    window.animationManager.activeIntervals.add(id);
    return id;
};

window.safeSetTimeout = function(callback, delay, ...args) {
    const id = setTimeout(callback, delay, ...args);
    window.animationManager.activeTimeouts.add(id);
    return id;
};

// При закрытии боя вызывать
window.cleanupBattleAnimations = function() {
    if (window.animationManager) {
        window.animationManager.clearAll();
    }
};

console.log('✅ AnimationManager готов к работе');
console.log('💡 Используйте window.safeAnimate() для безопасных анимаций');