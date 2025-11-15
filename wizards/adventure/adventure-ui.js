function showAdventureMenu() {
    const progress = loadAdventureProgress();
    
    let levelsHTML = '';
    ADVENTURE_LEVELS.forEach(level => {
        const isCompleted = progress[level.id]?.completed;
        const isUnlocked = level.id === 1 || progress[level.id - 1]?.completed;
        
        levelsHTML += `
            <div style="
                margin: 10px 0;
                padding: 15px;
                background: ${isUnlocked ? '#3d3d5c' : '#2a2a3a'};
                border-radius: 8px;
                opacity: ${isUnlocked ? 1 : 0.5};
                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                border: 2px solid ${isCompleted ? '#4CAF50' : '#555'};
            " onclick="${isUnlocked ? `startAdventureLevel(${level.id})` : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Уровень ${level.id}: ${level.name}</strong>
                        ${isCompleted ? '<span style="color: #4CAF50;"> ✓</span>' : ''}
                        ${!isUnlocked ? '<span style="color: #999;"> 🔒</span>' : ''}
                    </div>
                    <div style="font-size: 12px; color: #aaa;">
                        Награда: ${level.reward.exp} опыта, ${level.reward.crystals} 💎
                    </div>
                </div>
            </div>
        `;
    });
    
    const modalContent = `
        <div style="padding: 20px; max-width: 500px; background: #2c2c3d; border-radius: 10px; color: white;">
            <h3 style="margin-top: 0; color: #7289da;">🗺️ Приключения</h3>
            <div style="max-height: 400px; overflow-y: auto;">
                ${levelsHTML}
            </div>
            <button style="margin-top: 15px; padding: 10px 20px; width: 100%; background: #555; color: white; border: none; border-radius: 6px; cursor: pointer;"
                    onclick="closeCurrentModal()">
                Закрыть
            </button>
        </div>
    `;
    
    // Показываем модальное окно
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
    overlay.onclick = closeCurrentModal;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.currentModal = { modal, overlay };
}

function startAdventureLevel(levelId) {
    closeCurrentModal();
    startAdventure(levelId);
    if (typeof window.renderBattleField === 'function') {
        window.renderBattleField();
    }
}

window.showAdventureMenu = showAdventureMenu;
window.startAdventureLevel = startAdventureLevel;