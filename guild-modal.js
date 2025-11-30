// guild-modal.js - UI модальное окно гильдии

// Текущий таб в модалке
let currentGuildTab = 'info';

// Открыть модалку гильдии
async function openGuildModal() {
    console.log('🏰 Открытие модалки гильдии');

    // Закрываем предыдущие модальные окна
    if (typeof closeCurrentModal === 'function') {
        closeCurrentModal();
    }

    // Скрываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = 'none';

    // Загружаем данные гильдии
    if (window.userData?.guild_id && window.guildManager) {
        await window.guildManager.loadPlayerGuild();
    }

    // Определяем фон по фракции
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/guild/guild_${faction}.webp`;

    // Создаём экран
    let screen = document.getElementById('guild-screen');
    if (screen) screen.remove();

    screen = document.createElement('div');
    screen.id = 'guild-screen';
    screen.className = 'guild-screen active';

    // Создаём HTML структуру по паттерну арены
    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="guild-bg-image" id="guild-bg-image" src="${imagePath}" alt="Гильдия">
            <div class="guild-ui-overlay" id="guild-ui-overlay"></div>
        </div>
    `;

    // Стили для экрана
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('guild-bg-image');

    // Настройка UI после загрузки изображения
    img.onload = () => setupGuildUI();
    if (img.complete) setupGuildUI();

    // Обработка ошибки загрузки изображения - используем fallback
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон гильдии, используем fallback');
        setupGuildUIFallback(screen);
    };
}

// Настройка UI гильдии поверх изображения
function setupGuildUI() {
    const img = document.getElementById('guild-bg-image');
    const overlay = document.getElementById('guild-ui-overlay');

    if (!img || !overlay) return;

    const rect = img.getBoundingClientRect();

    // Устанавливаем размеры overlay по размеру изображения
    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        overflow-y: auto;
        overflow-x: hidden;
    `;

    // Рендерим контент в overlay
    if (window.userData?.guild_id && window.guildManager?.currentGuild) {
        renderGuildView(overlay);
    } else {
        renderNoGuildView(overlay);
    }
}

// Fallback UI без фонового изображения
function setupGuildUIFallback(screen) {
    screen.innerHTML = '';
    screen.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

    const container = document.createElement('div');
    container.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    screen.appendChild(container);

    if (window.userData?.guild_id && window.guildManager?.currentGuild) {
        renderGuildView(container);
    } else {
        renderNoGuildView(container);
    }
}

// === ВИД КОГДА НЕТ ГИЛЬДИИ ===
function renderNoGuildView(container) {
    container.innerHTML = `
        <div style="padding: 20px; height: 100%; display: flex; flex-direction: column; pointer-events: auto;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #ffd700; font-size: 24px;">Гильдия</h2>
                <button onclick="closeGuildModal()" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px 15px;
                    border-radius: 8px;
                ">X</button>
            </div>

            <!-- Табы -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button onclick="showCreateGuildForm()" style="
                    flex: 1;
                    padding: 15px;
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                ">Создать гильдию</button>
                <button onclick="showSearchGuilds()" style="
                    flex: 1;
                    padding: 15px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                ">Найти гильдию</button>
            </div>

            <!-- Контент -->
            <div id="guild-no-guild-content" style="
                flex: 1;
                overflow-y: auto;
                background: rgba(0,0,0,0.3);
                border-radius: 15px;
                padding: 20px;
            ">
                <div style="text-align: center; color: #aaa; padding: 50px 20px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🏰</div>
                    <p style="font-size: 16px; margin-bottom: 10px;">Вы не состоите в гильдии</p>
                    <p style="font-size: 14px;">Создайте свою или вступите в существующую</p>
                </div>
            </div>
        </div>
    `;
}

// === ФОРМА СОЗДАНИЯ ГИЛЬДИИ ===
function showCreateGuildForm() {
    const content = document.getElementById('guild-no-guild-content');
    if (!content) return;

    content.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto;">
            <h3 style="color: #ffd700; margin-bottom: 20px; text-align: center;">Создание гильдии</h3>

            <div style="margin-bottom: 15px;">
                <label style="color: #aaa; display: block; margin-bottom: 5px;">Название гильдии</label>
                <input type="text" id="guild-name-input" maxlength="50" placeholder="Введите название..." style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #444;
                    border-radius: 8px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    font-size: 16px;
                    box-sizing: border-box;
                ">
                <small style="color: #666;">От 3 до 50 символов</small>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #aaa; display: block; margin-bottom: 5px;">Тег гильдии</label>
                <input type="text" id="guild-tag-input" maxlength="5" placeholder="TAG" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #444;
                    border-radius: 8px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    font-size: 16px;
                    text-transform: uppercase;
                    box-sizing: border-box;
                ">
                <small style="color: #666;">От 2 до 5 символов (отображается как [TAG])</small>
            </div>

            <div id="create-guild-error" style="color: #ef4444; margin-bottom: 15px; display: none;"></div>

            <button onclick="createGuild()" style="
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #4ade80, #22c55e);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
            ">Создать</button>
        </div>
    `;
}

// === СОЗДАНИЕ ГИЛЬДИИ ===
async function createGuild() {
    const nameInput = document.getElementById('guild-name-input');
    const tagInput = document.getElementById('guild-tag-input');
    const errorDiv = document.getElementById('create-guild-error');

    const name = nameInput?.value?.trim();
    const tag = tagInput?.value?.trim();

    if (!name || !tag) {
        errorDiv.textContent = 'Заполните все поля';
        errorDiv.style.display = 'block';
        return;
    }

    if (!window.guildManager) {
        errorDiv.textContent = 'Система гильдий не загружена';
        errorDiv.style.display = 'block';
        return;
    }

    const result = await window.guildManager.createGuild(name, tag);

    if (result.success) {
        showNotification('Гильдия создана!');
        openGuildModal(); // Перезагружаем модалку
    } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
    }
}

// === ПОИСК ГИЛЬДИЙ ===
async function showSearchGuilds() {
    const content = document.getElementById('guild-no-guild-content');
    if (!content) return;

    content.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto;">
            <h3 style="color: #ffd700; margin-bottom: 20px; text-align: center;">Поиск гильдий</h3>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="guild-search-input" placeholder="Поиск по названию или тегу..." style="
                    flex: 1;
                    padding: 12px;
                    border: 2px solid #444;
                    border-radius: 8px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    font-size: 14px;
                ">
                <button onclick="searchGuilds()" style="
                    padding: 12px 20px;
                    background: #3b82f6;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                ">Найти</button>
            </div>

            <div id="guild-search-results" style="max-height: 400px; overflow-y: auto;">
                <p style="color: #aaa; text-align: center;">Введите запрос для поиска</p>
            </div>
        </div>
    `;

    // Автозагрузка топ гильдий
    searchGuilds();
}

async function searchGuilds() {
    const input = document.getElementById('guild-search-input');
    const results = document.getElementById('guild-search-results');
    const query = input?.value?.trim() || '';

    results.innerHTML = '<p style="color: #aaa; text-align: center;">Загрузка...</p>';

    if (!window.guildManager) {
        results.innerHTML = '<p style="color: #ef4444; text-align: center;">Система гильдий не загружена</p>';
        return;
    }

    const guilds = await window.guildManager.searchGuilds(query);

    if (guilds.length === 0) {
        results.innerHTML = '<p style="color: #aaa; text-align: center;">Гильдии не найдены</p>';
        return;
    }

    results.innerHTML = guilds.map(g => `
        <div style="
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <div>
                <div style="color: #ffd700; font-weight: bold;">[${g.tag}] ${g.name}</div>
                <div style="color: #aaa; font-size: 12px;">
                    Уровень ${g.level} | ${g.memberCount}/${g.capacity} участников
                </div>
            </div>
            <button onclick="joinGuild(${g.id})" style="
                padding: 8px 15px;
                background: #4ade80;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 12px;
            ">Вступить</button>
        </div>
    `).join('');
}

async function joinGuild(guildId) {
    if (!window.guildManager) return;

    const result = await window.guildManager.joinGuild(guildId);

    if (result.success) {
        showNotification(result.message);
        openGuildModal();
    } else {
        showNotification(result.error);
    }
}

// === ВИД ГИЛЬДИИ ===
function renderGuildView(container) {
    const guild = window.guildManager.currentGuild;
    const isLeader = window.guildManager.isLeader();
    const bonuses = window.guildManager.getGuildBonuses();
    const expToNext = window.getExpToNextLevel(guild.level);
    const expPercent = Math.min((guild.experience / expToNext) * 100, 100);

    container.innerHTML = `
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column; pointer-events: auto;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <h2 style="margin: 0; color: #ffd700; font-size: 18px;">[${guild.tag}] ${guild.name}</h2>
                    <div style="color: #aaa; font-size: 11px;">Уровень ${guild.level}</div>
                </div>
                <button onclick="closeGuildModal()" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px 10px;
                    border-radius: 8px;
                ">X</button>
            </div>

            <!-- Прогресс опыта -->
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; color: #aaa; font-size: 10px; margin-bottom: 2px;">
                    <span>Опыт</span>
                    <span>${guild.experience} / ${expToNext}</span>
                </div>
                <div style="background: rgba(0,0,0,0.5); border-radius: 8px; height: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #ffd700, #f59e0b); height: 100%; width: ${expPercent}%; transition: width 0.3s;"></div>
                </div>
            </div>

            <!-- Табы -->
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                <button onclick="switchGuildTab('info')" id="tab-info" class="guild-tab active" style="
                    flex: 1; padding: 8px; border: none; border-radius: 6px;
                    background: #3b82f6; color: white; cursor: pointer; font-size: 11px;
                ">Инфо</button>
                <button onclick="switchGuildTab('members')" id="tab-members" class="guild-tab" style="
                    flex: 1; padding: 8px; border: none; border-radius: 6px;
                    background: rgba(255,255,255,0.1); color: #aaa; cursor: pointer; font-size: 11px;
                ">Участники</button>
                <button onclick="switchGuildTab('research')" id="tab-research" class="guild-tab" style="
                    flex: 1; padding: 8px; border: none; border-radius: 6px;
                    background: rgba(255,255,255,0.1); color: #aaa; cursor: pointer; font-size: 11px;
                ">Исслед.</button>
                <button onclick="switchGuildTab('settings')" id="tab-settings" class="guild-tab" style="
                    padding: 8px 12px; border: none; border-radius: 6px;
                    background: rgba(255,255,255,0.1); color: #aaa; cursor: pointer; font-size: 11px;
                ">⚙️</button>
            </div>

            <!-- Контент -->
            <div id="guild-tab-content" style="
                flex: 1;
                overflow-y: auto;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                padding: 10px;
            "></div>

            <!-- Кнопка назад -->
            <button onclick="closeGuildModal()" style="
                margin-top: 8px;
                padding: 8px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
            ">← Назад</button>
        </div>
    `;

    switchGuildTab('info');
}

function switchGuildTab(tab) {
    currentGuildTab = tab;

    // Обновляем стили табов
    document.querySelectorAll('.guild-tab').forEach(btn => {
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.color = '#aaa';
    });
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeTab) {
        activeTab.style.background = '#3b82f6';
        activeTab.style.color = 'white';
    }

    const content = document.getElementById('guild-tab-content');
    if (!content) return;

    switch (tab) {
        case 'info': renderGuildInfo(content); break;
        case 'members': renderGuildMembers(content); break;
        case 'research': renderGuildResearch(content); break;
        case 'settings': renderGuildSettings(content); break;
    }
}

// === ТАБ ИНФОРМАЦИЯ ===
function renderGuildInfo(container) {
    const guild = window.guildManager.currentGuild;
    const bonuses = window.guildManager.getGuildBonuses();
    const capacity = window.getGuildCapacity(guild.level);

    const schoolNames = {
        fire: 'Огонь', water: 'Вода', earth: 'Земля', wind: 'Ветер', poison: 'Яд'
    };
    const schoolEmojis = {
        fire: '🔥', water: '💧', earth: '🪨', wind: '💨', poison: '☠️'
    };

    container.innerHTML = `
        <h4 style="color: #ffd700; margin: 0 0 15px 0;">Бонусы гильдии</h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background: rgba(74,222,128,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 24px; color: #4ade80; font-weight: bold;">+${bonuses.hpBonus}%</div>
                <div style="color: #aaa; font-size: 12px;">Здоровье</div>
            </div>
            <div style="background: rgba(239,68,68,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 24px; color: #ef4444; font-weight: bold;">+${bonuses.damageBonus}%</div>
                <div style="color: #aaa; font-size: 12px;">Урон</div>
            </div>
        </div>

        <h4 style="color: #ffd700; margin: 0 0 10px 0;">Сопротивления</h4>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px;">
            ${Object.entries(bonuses.resistances).map(([school, res]) => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px 5px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 20px;">${schoolEmojis[school]}</div>
                    <div style="color: ${res > 0 ? '#4ade80' : '#666'}; font-size: 14px; font-weight: bold;">${res}%</div>
                </div>
            `).join('')}
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #aaa;">Вместимость</span>
                <span style="color: white;">${window.guildManager.guildMembers.length} / ${capacity}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #aaa;">Режим вступления</span>
                <span style="color: white;">${guild.join_mode === 'free' ? 'Свободный' : 'По заявке'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #aaa;">Очков исследований</span>
                <span style="color: #ffd700; font-weight: bold;">${guild.bonus_points}</span>
            </div>
        </div>
    `;
}

// === ТАБ УЧАСТНИКИ ===
function renderGuildMembers(container) {
    const members = window.guildManager.guildMembers;
    const guild = window.guildManager.currentGuild;

    container.innerHTML = `
        <h4 style="color: #ffd700; margin: 0 0 15px 0;">Участники (${members.length})</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            ${members.map((m, i) => `
                <div style="
                    background: rgba(255,255,255,0.05);
                    padding: 12px;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    ${m.id === guild.leader_id ? 'border: 1px solid #ffd700;' : ''}
                ">
                    <div>
                        <div style="color: white; font-weight: ${m.id === guild.leader_id ? 'bold' : 'normal'};">
                            ${m.id === guild.leader_id ? '👑 ' : ''}${m.username}
                        </div>
                        <div style="color: #aaa; font-size: 11px;">
                            Ур. ${m.level} | Рейтинг: ${m.rating || 1000}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #ffd700; font-weight: bold;">${m.guild_contribution || 0}</div>
                        <div style="color: #666; font-size: 10px;">вклад</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// === ТАБ ИССЛЕДОВАНИЯ ===
function renderGuildResearch(container) {
    const guild = window.guildManager.currentGuild;
    const isLeader = window.guildManager.isLeader();
    const research = guild.research || {};

    const schoolNames = {
        fire: 'Огонь', water: 'Вода', earth: 'Земля', wind: 'Ветер', poison: 'Яд'
    };
    const schoolEmojis = {
        fire: '🔥', water: '💧', earth: '🪨', wind: '💨', poison: '☠️'
    };

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="color: #ffd700; margin: 0;">Исследования</h4>
            <div style="color: #ffd700; font-weight: bold;">
                Очков: ${guild.bonus_points}
            </div>
        </div>

        <p style="color: #aaa; font-size: 12px; margin-bottom: 15px;">
            Каждое очко даёт +0.5% сопротивления к выбранной школе магии.
            ${isLeader ? '' : 'Только глава гильдии может распределять очки.'}
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px;">
            ${Object.entries(schoolNames).map(([school, name]) => {
                const points = research[school] || 0;
                const resistance = points * 0.5;
                const maxPoints = 30;
                const percent = (points / maxPoints) * 100;

                return `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: white;">
                                ${schoolEmojis[school]} ${name}
                            </span>
                            <span style="color: #4ade80; font-weight: bold;">
                                ${resistance}% (${points}/${maxPoints})
                            </span>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div style="flex: 1; background: rgba(0,0,0,0.5); border-radius: 6px; height: 8px; overflow: hidden;">
                                <div style="background: #4ade80; height: 100%; width: ${percent}%;"></div>
                            </div>
                            ${isLeader && guild.bonus_points > 0 && points < maxPoints ? `
                                <button onclick="spendResearchPoint('${school}')" style="
                                    padding: 5px 12px;
                                    background: #3b82f6;
                                    border: none;
                                    border-radius: 6px;
                                    color: white;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">+1</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function spendResearchPoint(school) {
    if (!window.guildManager) return;

    const result = await window.guildManager.spendResearchPoint(school);

    if (result.success) {
        showNotification(`+0.5% сопротивления к ${school}`);
        renderGuildResearch(document.getElementById('guild-tab-content'));
    } else {
        showNotification(result.error);
    }
}

// === ТАБ НАСТРОЙКИ ===
function renderGuildSettings(container) {
    const guild = window.guildManager.currentGuild;
    const isLeader = window.guildManager.isLeader();
    const requests = guild.join_requests || [];

    let leaderSettingsHTML = '';
    if (isLeader) {
        leaderSettingsHTML = `
            <h4 style="color: #ffd700; margin: 0 0 15px 0;">Настройки гильдии</h4>

            <!-- Режим вступления -->
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <div style="color: white; margin-bottom: 10px;">Режим вступления</div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="setJoinMode('free')" style="
                        flex: 1; padding: 10px;
                        background: ${guild.join_mode === 'free' ? '#4ade80' : 'rgba(255,255,255,0.1)'};
                        border: none; border-radius: 8px;
                        color: ${guild.join_mode === 'free' ? 'white' : '#aaa'};
                        cursor: pointer;
                    ">Свободный</button>
                    <button onclick="setJoinMode('request')" style="
                        flex: 1; padding: 10px;
                        background: ${guild.join_mode === 'request' ? '#4ade80' : 'rgba(255,255,255,0.1)'};
                        border: none; border-radius: 8px;
                        color: ${guild.join_mode === 'request' ? 'white' : '#aaa'};
                        cursor: pointer;
                    ">По заявке</button>
                </div>
            </div>

            <!-- Заявки -->
            ${requests.length > 0 ? `
                <h4 style="color: #ffd700; margin: 0 0 10px 0;">Заявки (${requests.length})</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                    ${requests.map(r => `
                        <div style="
                            background: rgba(255,255,255,0.05);
                            padding: 12px;
                            border-radius: 10px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="color: white;">${r.username}</span>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="handleRequest(${r.player_id}, true)" style="
                                    padding: 6px 12px;
                                    background: #4ade80;
                                    border: none; border-radius: 6px;
                                    color: white; cursor: pointer;
                                ">Принять</button>
                                <button onclick="handleRequest(${r.player_id}, false)" style="
                                    padding: 6px 12px;
                                    background: #ef4444;
                                    border: none; border-radius: 6px;
                                    color: white; cursor: pointer;
                                ">Отклонить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    container.innerHTML = `
        ${leaderSettingsHTML}

        <!-- Кнопка выхода из гильдии -->
        <button onclick="confirmLeaveGuild()" style="
            width: 100%;
            padding: 12px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid #ef4444;
            border-radius: 8px;
            color: #ef4444;
            cursor: pointer;
            font-size: 14px;
            ${isLeader ? '' : 'margin-top: 0;'}
        ">🚪 Покинуть гильдию</button>
    `;
}

async function setJoinMode(mode) {
    if (!window.guildManager) return;

    const result = await window.guildManager.setJoinMode(mode);

    if (result.success) {
        showNotification(`Режим изменён: ${mode === 'free' ? 'Свободный' : 'По заявке'}`);
        renderGuildSettings(document.getElementById('guild-tab-content'));
    } else {
        showNotification(result.error);
    }
}

async function handleRequest(playerId, approve) {
    if (!window.guildManager) return;

    const result = await window.guildManager.handleJoinRequest(playerId, approve);

    if (result.success) {
        showNotification(approve ? 'Игрок принят' : 'Заявка отклонена');
        await window.guildManager.loadGuildMembers();
        renderGuildSettings(document.getElementById('guild-tab-content'));
    } else {
        showNotification(result.error);
    }
}

// === ВЫХОД ИЗ ГИЛЬДИИ ===
function confirmLeaveGuild() {
    const isLeader = window.guildManager?.isLeader();
    const message = isLeader
        ? 'Вы глава гильдии. При выходе лидерство перейдёт к самому активному участнику. Выйти?'
        : 'Вы уверены что хотите покинуть гильдию?';

    if (confirm(message)) {
        leaveGuild();
    }
}

async function leaveGuild() {
    if (!window.guildManager) return;

    const result = await window.guildManager.leaveGuild();

    if (result.success) {
        showNotification('Вы вышли из гильдии');
        openGuildModal();
    } else {
        showNotification(result.error);
    }
}

// === ЗАКРЫТИЕ МОДАЛКИ ===
function closeGuildModal() {
    const screen = document.getElementById('guild-screen');
    if (screen) screen.remove();

    // Показываем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) playerAvatar.style.display = '';
}

// Экспорт
window.openGuildModal = openGuildModal;
window.closeGuildModal = closeGuildModal;
window.showCreateGuildForm = showCreateGuildForm;
window.showSearchGuilds = showSearchGuilds;
window.createGuild = createGuild;
window.searchGuilds = searchGuilds;
window.joinGuild = joinGuild;
window.switchGuildTab = switchGuildTab;
window.spendResearchPoint = spendResearchPoint;
window.setJoinMode = setJoinMode;
window.handleRequest = handleRequest;
window.confirmLeaveGuild = confirmLeaveGuild;
window.leaveGuild = leaveGuild;

