// modal-system.js - Централизованная система модальных окон
console.log('✅ modal-system.js загружен');

// ============ ОСНОВНОЙ КЛАСС МОДАЛЬНОЙ СИСТЕМЫ ============
class ModalSystem {
    constructor() {
        this.currentModal = null;
        this.modalQueue = [];
        this.styles = this.initStyles();
    }
    
    // Инициализация стилей
    initStyles() {
        if (!document.getElementById('modal-system-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-system-styles';
            style.textContent = `
                /* Анимации для модалок */
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes modalFadeOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to { opacity: 0; transform: translate(-50%, -52%) scale(0.95); }
                }
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes overlayFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                /* Анимации для уведомлений */
                @keyframes notificationSlideIn {
                    from { transform: translate(-50%, -120%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes notificationSlideOut {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, -120%); opacity: 0; }
                }
                
                /* Класс для блокировки скролла */
                .modal-open {
                    overflow: hidden;
                }
                
                /* Стили для загрузочного индикатора */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .modal-spinner {
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top: 4px solid #7289da;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
            `;
            document.head.appendChild(style);
        }
        
        return {
            modal: `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(44, 44, 61, 0.98), rgba(33, 33, 46, 0.98));
                padding: 24px;
                border-radius: 12px;
                z-index: 10001;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                max-height: 90vh;
                max-width: 95vw;
                overflow-y: auto;
                animation: modalFadeIn 0.3s ease;
                border: 1px solid rgba(114, 137, 218, 0.3);
                will-change: transform;
            `,
            overlay: `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(2px);
                z-index: 10000;
                animation: overlayFadeIn 0.3s ease;
            `,
            button: {
                primary: `
                    padding: 10px 20px;
                    background: #7289da;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.2s;
                `,
                secondary: `
                    padding: 10px 20px;
                    background: transparent;
                    color: #7289da;
                    border: 1px solid #7289da;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                `,
                danger: `
                    padding: 10px 20px;
                    background: #ff5252;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.2s;
                `
            }
        };
    }
    
    // ============ ОСНОВНЫЕ МЕТОДЫ ============
    
    // Показать простую модалку
    show(content, options = {}) {
        // КРИТИЧЕСКИ ВАЖНО: Удаляем ВСЕ старые модалки
        this.closeAll();
        
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = content;
        
        // Применяем ID если передан
        if (options.id) modal.id = options.id;
        
        // Стили модалки
        modal.style.cssText = options.modalStyle || this.styles.modal;
        
        // Создаём оверлей
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        if (options.overlayId) overlay.id = options.overlayId;
        
        overlay.style.cssText = options.overlayStyle || this.styles.overlay;
        
        // Закрытие по клику на оверлей
        if (options.closeOnOverlay !== false) {
            overlay.onclick = () => this.close();
        }
        
        // Закрытие по Escape
        if (options.closeOnEscape !== false) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
        
        // Добавляем в DOM
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        // Сохраняем ссылки
        this.currentModal = { modal, overlay, options };
        
        // Для обратной совместимости
        window.currentModal = this.currentModal;
        
        // Callback после показа
        if (options.onShow) {
            setTimeout(() => options.onShow(modal, overlay), 10);
        }
        
        return { modal, overlay };
    }
    
    // Закрыть текущую модалку
    close(animated = true) {
        if (!this.currentModal) return;
        
        const { modal, overlay, options } = this.currentModal;
        
        // Callback перед закрытием
        if (options && options.onClose) {
            options.onClose();
        }
        
        // Удаляем обработчик Escape
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        
        if (animated) {
            // Анимация закрытия
            modal.style.animation = 'modalFadeOut 0.3s ease';
            overlay.style.animation = 'overlayFadeOut 0.3s ease';
            
            setTimeout(() => {
                this.removeModal(modal, overlay);
            }, 280);
        } else {
            this.removeModal(modal, overlay);
        }
    }
    
    // Удалить модалку из DOM
    removeModal(modal, overlay) {
        if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
        
        document.body.classList.remove('modal-open');
        this.currentModal = null;
        window.currentModal = null;
    }
    
    // Закрыть ВСЕ модалки (включая старые)
    closeAll() {
        console.log('🧹 Закрываем все модальные окна');
        
        // 1. Закрываем модалку новой системы
        if (this.currentModal) {
            this.close(false);
        }
        
        // 2. Очищаем window.currentModal
        window.currentModal = null;
        
        // 3. Удаляем все элементы с классами модалок
        document.querySelectorAll('.modal-container, .modal-overlay').forEach(el => el.remove());
        
        // 4. Удаляем модалки по специфичным ID
        const modalIds = [
            'battle-setup-modal-container',
            'battle-setup-overlay',
            'pvp-arena-modal-container',
            'pvp-arena-overlay',
            'battle-field-modal',
            'battle-field-fullscreen-container',
            'wizard-hire-modal',
            'library-modal',
            'spell-library-modal',
            'blessing-tower-modal'
        ];
        
        modalIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // 5. Удаляем любые overlay элементы
        document.querySelectorAll('[id*="overlay"]').forEach(el => {
            if (el.style.position === 'fixed') el.remove();
        });
        
        // 6. Убираем класс блокировки скролла
        document.body.classList.remove('modal-open');
        
        console.log('✅ Все модалки закрыты');
    }
    
    // ============ СПЕЦИАЛИЗИРОВАННЫЕ МОДАЛКИ ============
    
    // Модалка подтверждения
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const content = `
                <div style="min-width: 300px; max-width: 400px; color: white;">
                    ${options.title ? `<h3 style="margin: 0 0 15px 0; color: #7289da;">${options.title}</h3>` : ''}
                    <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="modal-cancel" style="${this.styles.button.secondary}">
                            ${options.cancelText || 'Отмена'}
                        </button>
                        <button id="modal-confirm" style="${this.styles.button.primary}">
                            ${options.confirmText || 'Подтвердить'}
                        </button>
                    </div>
                </div>
            `;
            
            const { modal } = this.show(content, {
                closeOnOverlay: false,
                closeOnEscape: true,
                ...options
            });
            
            // Обработчики кнопок
            modal.querySelector('#modal-confirm').onclick = () => {
                this.close();
                resolve(true);
            };
            
            modal.querySelector('#modal-cancel').onclick = () => {
                this.close();
                resolve(false);
            };
        });
    }
    
    // Модалка с полем ввода
    prompt(message, options = {}) {
        return new Promise((resolve) => {
            const content = `
                <div style="min-width: 300px; max-width: 400px; color: white;">
                    ${options.title ? `<h3 style="margin: 0 0 15px 0; color: #7289da;">${options.title}</h3>` : ''}
                    <p style="margin: 0 0 15px 0;">${message}</p>
                    <input id="modal-input" type="${options.type || 'text'}" 
                           placeholder="${options.placeholder || ''}"
                           value="${options.defaultValue || ''}"
                           style="
                               width: 100%;
                               padding: 8px 12px;
                               background: rgba(255,255,255,0.1);
                               border: 1px solid rgba(114,137,218,0.5);
                               border-radius: 6px;
                               color: white;
                               margin-bottom: 20px;
                               box-sizing: border-box;
                           ">
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="modal-cancel" style="${this.styles.button.secondary}">
                            ${options.cancelText || 'Отмена'}
                        </button>
                        <button id="modal-ok" style="${this.styles.button.primary}">
                            ${options.okText || 'OK'}
                        </button>
                    </div>
                </div>
            `;
            
            const { modal } = this.show(content, {
                closeOnOverlay: false,
                ...options
            });
            
            // Фокус на поле ввода
            const input = modal.querySelector('#modal-input');
            setTimeout(() => input.focus(), 100);
            
            // Enter для подтверждения
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.close();
                    resolve(input.value);
                }
            };
            
            // Обработчики кнопок
            modal.querySelector('#modal-ok').onclick = () => {
                this.close();
                resolve(input.value);
            };
            
            modal.querySelector('#modal-cancel').onclick = () => {
                this.close();
                resolve(null);
            };
        });
    }
    
    // Модалка алерта
    alert(message, type = 'info', options = {}) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#4ade80',
            error: '#ff5252',
            warning: '#ffa500',
            info: '#7289da'
        };
        
        const content = `
            <div style="min-width: 250px; max-width: 400px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 15px;">${icons[type]}</div>
                ${options.title ? `<h3 style="margin: 0 0 10px 0; color: ${colors[type]};">${options.title}</h3>` : ''}
                <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
                <button id="modal-ok" style="${this.styles.button.primary}; width: 100%;">
                    ${options.okText || 'OK'}
                </button>
            </div>
        `;
        
        const { modal } = this.show(content, options);
        
        modal.querySelector('#modal-ok').onclick = () => this.close();
    }
    
    // Модалка загрузки
    loading(message = 'Загрузка...', options = {}) {
        const content = `
            <div style="min-width: 200px; text-align: center; color: white;">
                <div class="modal-spinner"></div>
                <p style="margin: 20px 0 0 0;">${message}</p>
            </div>
        `;
        
        return this.show(content, {
            closeOnOverlay: false,
            closeOnEscape: false,
            ...options
        });
    }
}

// ============ СИСТЕМА УВЕДОМЛЕНИЙ ============
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }
    
    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 20000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = 3000, options = {}) {
        const colors = {
            success: 'linear-gradient(135deg, #4ade80, #22c55e)',
            error: 'linear-gradient(135deg, #ff5252, #ff3838)',
            warning: 'linear-gradient(135deg, #ffa500, #ff8c00)',
            info: 'linear-gradient(135deg, #7289da, #5865f2)'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: notificationSlideIn 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 200px;
            max-width: 400px;
        `;
        
        // Добавляем иконку и текст
        notification.innerHTML = `
            <span style="font-size: 18px;">${options.icon || icons[type]}</span>
            <span>${message}</span>
        `;
        
        // Клик для быстрого закрытия
        notification.onclick = () => this.remove(notification);
        
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }
        
        return notification;
    }
    
    remove(notification) {
        if (!notification || !document.body.contains(notification)) return;
        
        notification.style.animation = 'notificationSlideOut 0.3s ease';
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 280);
    }
    
    clear() {
        this.notifications.forEach(n => this.remove(n));
    }
}

// ============ СОЗДАЁМ ГЛОБАЛЬНЫЕ ЭКЗЕМПЛЯРЫ ============
const Modal = new ModalSystem();
const Notification = new NotificationSystem();

// ============ ЭКСПОРТ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ============

// Старые функции для обратной совместимости
function showModal(content, options = {}) {
    return Modal.show(content, options);
}

function closeCurrentModal() {
    Modal.closeAll();
}

function showNotification(message, type = 'info', duration = 3000) {
    return Notification.show(message, type, duration);
}

// Экспортируем в window
window.Modal = Modal;
window.Notification = Notification;
window.showModal = showModal;
window.closeCurrentModal = closeCurrentModal;
window.showNotification = showNotification;

console.log('🎭 Система модальных окон готова к использованию');