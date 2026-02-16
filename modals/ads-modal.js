// ads-modal.js - Экран рекламных заданий (вынесен из airdrop-modal.js)

/**
 * Показать модальное окно рекламных заданий
 */
function showAdsModal() {
    console.log('📢 Открытие окна Реклама');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Определяем фракцию игрока для фона
    const faction = window.userData?.faction || 'fire';
    const imagePath = `assets/ui/window/tower_${faction}.webp`;

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('ads-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем новый экран
    const screen = document.createElement('div');
    screen.id = 'ads-screen';

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img class="tower-bg-image" id="ads-bg" src="${imagePath}" alt="Реклама">
            <div class="tower-ui-overlay" id="ads-overlay"></div>
        </div>
    `;

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

    const img = document.getElementById('ads-bg');

    // Настройка UI после загрузки изображения
    img.onload = () => setupAdsUI();
    if (img.complete) setupAdsUI();

    // Обработка ошибки загрузки изображения
    img.onerror = () => {
        console.error('❌ Не удалось загрузить фон, используем стандартное окно');
        screen.remove();
        showAdsModalFallback();
    };
}

/**
 * Настройка UI экрана рекламных заданий
 */
function setupAdsUI() {
    const img = document.getElementById('ads-bg');
    const overlay = document.getElementById('ads-overlay');

    if (!img || !overlay) return;

    // Очищаем overlay перед добавлением контента
    overlay.innerHTML = '';

    const rect = img.getBoundingClientRect();

    // Устанавливаем размеры overlay по размеру изображения
    overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
    `;

    // Масштаб для координат (базовый размер 768x512)
    const scaleX = rect.width / 768;
    const scaleY = rect.height / 512;

    // Адаптивные размеры шрифтов
    const titleFontSize = Math.max(16, 22 * Math.min(scaleX, scaleY));
    const baseFontSize = Math.max(12, 14 * Math.min(scaleX, scaleY));
    const smallFontSize = Math.max(10, 12 * Math.min(scaleX, scaleY));

    // ЗОНЫ UI
    const headerArea = {
        x: 115 * scaleX,
        y: 20 * scaleY,
        width: (655 - 115) * scaleX,
        height: 50 * scaleY
    };

    const contentArea = {
        x: 115 * scaleX,
        y: 70 * scaleY,
        width: (655 - 115) * scaleX,
        height: (410 - 70) * scaleY
    };

    const footerArea = {
        x: 115 * scaleX,
        y: 420 * scaleY,
        width: (655 - 115) * scaleX,
        height: 60 * scaleY
    };

    // === ЗАГОЛОВОК ===
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        position: absolute;
        left: ${headerArea.x}px;
        top: ${headerArea.y}px;
        width: ${headerArea.width}px;
        height: ${headerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    headerContainer.innerHTML = `
        <div style="
            color: #ffd700;
            font-size: ${titleFontSize}px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            text-align: center;
        ">📢 ЗАДАНИЯ</div>
    `;
    overlay.appendChild(headerContainer);

    // === КОНТЕНТ ===
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: absolute;
        left: ${contentArea.x}px;
        top: ${contentArea.y}px;
        width: ${contentArea.width}px;
        height: ${contentArea.height}px;
        pointer-events: auto;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 10px;
        box-sizing: border-box;
    `;

    contentContainer.innerHTML = `
        <style>
            #ads-overlay .ads-content::-webkit-scrollbar {
                width: 8px;
            }
            #ads-overlay .ads-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
            }
            #ads-overlay .ads-content::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.6);
                border-radius: 4px;
            }
        </style>

        <!-- Описание -->
        <div style="
            background: rgba(0,0,0,0.4);
            border: 1px solid #ffd700;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 12px;
            text-align: center;
        ">
            <div style="font-size: ${baseFontSize}px; color: #ffd700; font-weight: bold;">
                Выполняй задания — получай BPM и время!
            </div>
        </div>

        <!-- Creaky Tasks -->
        <div id="ads-creaky-tasks" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(96, 165, 250, 0.1);
            border: 1px solid rgba(96, 165, 250, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📋 Creaky Tasks | Выполнить 3 любых задания
                </div>
                <div style="font-size: ${smallFontSize}px; color: #60a5fa; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.creaky_tasks ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openCreakyTasks()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #60a5fa, #3b82f6);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Выполнить</button>
            `}
        </div>

        <!-- Money Mining -->
        <div id="ads-money-mining" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(250, 204, 21, 0.1);
            border: 1px solid rgba(250, 204, 21, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    ⛏️ Присоединяйся к игре Money Mining
                </div>
                <div style="font-size: ${smallFontSize}px; color: #facc15; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.money_mining ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openMoneyMining()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #facc15, #eab308);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- PandaFiT -->
        <div id="ads-pandafit" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(74, 222, 128, 0.1);
            border: 1px solid rgba(74, 222, 128, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    🐼 PandaFiT: прокачай панду до 5 lvl и забирай награду
                </div>
                <div style="font-size: ${smallFontSize}px; color: #4ade80; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.pandafit ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openPandaFit()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- QuadRoyal -->
        <div id="ads-quadroyal" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(168, 85, 247, 0.1);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    🧩 Play QuadRoyal: Competitive Puzzle
                </div>
                <div style="font-size: ${smallFontSize}px; color: #a855f7; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.quadroyal ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openQuadRoyal()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- Betmode Luck -->
        <div id="ads-betmode-luck" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    🍀 Launch the Betmode Luck game!
                </div>
                <div style="font-size: ${smallFontSize}px; color: #fbbf24; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.betmode_luck ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openBetmodeLuck()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #fbbf24, #d97706);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- Gift Kombat -->
        <div id="ads-gift-kombat" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    🥊 Gift Kombat | Получи 2ур. и начни сражение за NFT подарки
                </div>
                <div style="font-size: ${smallFontSize}px; color: #ef4444; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.gift_kombat ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : (() => {
                let gkOpened = false;
                try { gkOpened = localStorage.getItem('gift_kombat_opened') === '1'; } catch(e) {}
                return gkOpened ? `
                <button onclick="window.checkGiftKombat()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Проверить</button>
            ` : `
                <button onclick="window.openGiftKombat()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Начать</button>
            `;
            })()}
        </div>

        <!-- Tinlake -->
        <div id="ads-tinlake" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📚 Tinlake | #1 EdTech TMA on Ton
                </div>
                <div style="font-size: ${smallFontSize}px; color: #38bdf8; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.tinlake ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openTinlake()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #38bdf8, #0284c7);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Начать</button>
            `}
        </div>

        <!-- Star Industry -->
        <div id="ads-star-industry" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(250, 204, 21, 0.1);
            border: 1px solid rgba(250, 204, 21, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    ⭐ Star Industry | Play & Claim Your Share of $4,000
                </div>
                <div style="font-size: ${smallFontSize}px; color: #facc15; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.star_industry ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openStarIndustry()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #facc15, #ca8a04);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- Diamond Dynasty -->
        <div id="ads-diamond-dynasty" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(250, 204, 21, 0.1);
            border: 1px solid rgba(250, 204, 21, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    💎 Diamond Dynasty | Экономическая игра с наградами в TON
                </div>
                <div style="font-size: ${smallFontSize}px; color: #facc15; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.diamond_dynasty ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openDiamondDynasty()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #facc15, #ca8a04);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Играть</button>
            `}
        </div>

        <!-- CryptoCyetaUA -->
        <div id="ads-cryptocyeta" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📢 Подписаться на CryptoCyetaUA
                </div>
                <div style="font-size: ${smallFontSize}px; color: #22c55e; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.cryptocyeta ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openCryptoCyeta()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Подписаться</button>
            `}
        </div>

        <!-- Крипто роботяги -->
        <div id="ads-cryptworks" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📢 Подписаться на Крипто роботяги
                </div>
                <div style="font-size: ${smallFontSize}px; color: #8b5cf6; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.cryptworks ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openCryptworks()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Подписаться</button>
            `}
        </div>

        <!-- CryptoHud -->
        <div id="ads-cryptohud" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📢 Подпишись CryptoHud
                </div>
                <div style="font-size: ${smallFontSize}px; color: #3b82f6; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.cryptohud ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openCryptoHud()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Подписаться</button>
            `}
        </div>

        <!-- dreamdares 18+ -->
        <div id="ads-dreamdares" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        ">
            <div style="flex: 1;">
                <div style="font-size: ${baseFontSize}px; color: #fff;">
                    📢 Подписаться на dreamdares 18+
                </div>
                <div style="font-size: ${smallFontSize}px; color: #f43f5e; margin-top: 4px;">
                    +100 BPM + ⏰ 2 часа
                </div>
            </div>
            ${window.userData?.completed_tasks?.dreamdares ? `
                <div style="
                    padding: 8px 16px;
                    background: #333;
                    border-radius: 8px;
                    color: #888;
                    font-size: ${smallFontSize}px;
                ">✓ Получено</div>
            ` : `
                <button onclick="window.openDreamdares()" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #f43f5e, #e11d48);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: ${smallFontSize}px;
                    font-weight: bold;
                    cursor: pointer;
                ">Подписаться</button>
            `}
        </div>
    `;
    contentContainer.className = 'ads-content';
    overlay.appendChild(contentContainer);

    // === КНОПКА ФУТЕРА ===
    const footerContainer = document.createElement('div');
    footerContainer.style.cssText = `
        position: absolute;
        left: ${footerArea.x}px;
        top: ${footerArea.y}px;
        width: ${footerArea.width}px;
        height: ${footerArea.height}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `;

    // Кнопка "Назад"
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '← Назад';
    closeBtn.style.cssText = `
        padding: 10px 25px;
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #ffd700;
        border-radius: 10px;
        color: #ffd700;
        font-size: ${baseFontSize}px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    `;
    closeBtn.onclick = closeAdsModal;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(255, 215, 0, 0.2)';
        closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.6)';
        closeBtn.style.transform = 'scale(1)';
    };

    footerContainer.appendChild(closeBtn);
    overlay.appendChild(footerContainer);
}

/**
 * Резервное модальное окно
 */
function showAdsModalFallback() {
    const modal = document.createElement('div');
    modal.id = 'ads-modal-fallback';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c2c3d;
        border: 2px solid #ffd700;
        border-radius: 15px;
        padding: 25px;
        z-index: 2000;
        max-width: 350px;
        color: white;
        text-align: center;
    `;

    modal.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 0;">📢 Задания</h3>
        <p style="color: #888; font-size: 14px;">Выполняй задания партнёров и получай BPM coin и время!</p>
        <button onclick="closeAdsModal()" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(145deg, #ffd700, #cc9900);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
        ">Закрыть</button>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'ads-overlay-fallback';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    overlay.onclick = closeAdsModal;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Закрыть модальное окно рекламных заданий
 */
function closeAdsModal() {
    // Удаляем основной экран
    const screen = document.getElementById('ads-screen');
    if (screen) screen.remove();

    // Удаляем fallback
    const modal = document.getElementById('ads-modal-fallback');
    if (modal) modal.remove();

    const overlay = document.getElementById('ads-overlay-fallback');
    if (overlay) overlay.remove();

    // Показываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'flex';
    }
}

// Экспорт функций
window.showAdsModal = showAdsModal;
window.closeAdsModal = closeAdsModal;
