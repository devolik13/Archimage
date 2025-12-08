// core/helpers.js - Общие вспомогательные функции

// === ФУНКЦИИ ДЛЯ ФРАКЦИЙ ===

window.getFactionName = function(faction) {
    const names = {
        'fire': 'Огонь',
        'water': 'Вода',
        'wind': 'Ветер',
        'earth': 'Земля',
        'nature': 'Природа',
        'poison': 'Яд'
    };
    return names[faction] || faction;
};

window.getFactionEmoji = function(faction) {
    const emojis = {
        'fire': '🔥',
        'water': '💧',
        'wind': '💨',
        'earth': '🪨',
        'nature': '🌿',
        'poison': '☠️'
    };
    return emojis[faction] || '⭐';
};

window.getFactionColor = function(faction) {
    const colors = {
        'fire': '#ff6b35',
        'water': '#4fc3f7',
        'wind': '#81c784',
        'earth': '#a1887f',
        'nature': '#66bb6a',
        'poison': '#ab47bc'
    };
    return colors[faction] || '#7289da';
};

// === ФУНКЦИИ ДЛЯ ШКОЛ МАГИИ ===

window.getSchoolColor = function(school) {
    const colors = {
        'fire': '#ff6b35',
        'water': '#4fc3f7',
        'wind': '#81c784',
        'earth': '#a1887f',
        'nature': '#66bb6a',
        'poison': '#ab47bc'
    };
    return colors[school] || '#7289da';
};

// === УВЕДОМЛЕНИЯ ===

window.showNotification = function(message, type = 'info', duration = 3000) {
    // Удаляем старое уведомление если есть
    const existing = document.getElementById('game-notification');
    if (existing) existing.remove();

    const colors = {
        'info': '#7289da',
        'success': '#4CAF50',
        'warning': '#ffa500',
        'error': '#f44336'
    };

    const notification = document.createElement('div');
    notification.id = 'game-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;

    // Добавляем анимацию если её нет
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes slideUp {
                from { opacity: 1; transform: translateX(-50%) translateY(0); }
                to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
};

// === МОДАЛЬНЫЕ ОКНА ===

window.closeAllModals = function() {
    // Сначала пробуем закрыть через новую систему Modal
    if (window.Modal && typeof window.Modal.closeAll === 'function') {
        window.Modal.closeAll();
    }

    // Закрываем все известные модальные окна по ID
    const modalIds = [
        'modal-overlay',
        'building-selection-screen',
        'building-selection-modal',
        'construction-modal-screen',
        'construction-modal',
        'building-info-modal',
        'time-generator-screen',
        'wizard-tower-screen',
        'arcane-lab-screen',
        'blessing-tower-screen',
        'pvp-arena-screen',
        'player-profile-screen',
        'library-screen',
        'spell-modal-overlay'
    ];

    modalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Удаляем все overlay-и по ID
    document.querySelectorAll('[id="modal-overlay"]').forEach(el => el.remove());

    // Удаляем модалки по классам (новая система)
    document.querySelectorAll('.modal-container, .modal-overlay').forEach(el => el.remove());

    // Очищаем currentModal
    window.currentModal = null;

    // Показываем аватар
    const avatar = document.getElementById('player-avatar-container');
    if (avatar) {
        avatar.style.display = 'flex';
    }
};

window.closeCurrentModal = function() {
    // Сначала пробуем закрыть через новую систему Modal
    if (window.Modal && typeof window.Modal.closeAll === 'function') {
        window.Modal.closeAll();
    }

    // Затем закрываем старые модалки по currentModal
    if (window.currentModal) {
        if (window.currentModal.modal) window.currentModal.modal.remove();
        if (window.currentModal.overlay) window.currentModal.overlay.remove();
        window.currentModal = null;
    }

    // Удаляем все overlay-и с id='modal-overlay'
    document.querySelectorAll('[id="modal-overlay"]').forEach(el => el.remove());

    // Удаляем construction-modal если остался
    const constructionModal = document.getElementById('construction-modal');
    if (constructionModal) constructionModal.remove();

    // Показываем аватар
    const avatar = document.getElementById('player-avatar-container');
    if (avatar) {
        avatar.style.display = 'flex';
    }
};

// Определение школы заклинания (резервная)
window.getSpellSchoolFallback = function(spellId) {
    // Используем функцию из spell-functions.js если есть
    return window.getSpellSchoolFromId?.(spellId) || null;
};

// Названия направлений
window.getDirectionNameSimple = function(direction) {
    const map = {
        'main': 'в цель',
        'up': 'вверх',
        'down': 'вниз',
        'right': 'вправо',
        'left': 'влево'
    };
    return map[direction] || direction;
};

// Выбор случайного заклинания
window.selectRandomSpell = function(wizard) {
    const spells = wizard.spells || [];
    const available = spells.filter(s => s != null);
    return available[Math.floor(Math.random() * available.length)] || null;
};

// Информация о заклинании
window.getSpellInfo = function(spellId) {
    const spellData = window.findSpellInUserData?.(spellId, window.userData?.spells);
    return {
        id: spellId,
        name: window.SPELL_NAMES?.[spellId] || spellId,
        level: spellData?.level || 1,
        school: window.getSpellSchoolFromId?.(spellId)
    };
};