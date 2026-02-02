// promo-event-modal.js - Система промо-акций с показом при входе в игру

// Конфигурация текущей акции
const PROMO_EVENT = {
    id: 'fire_elemental_challenge_2026_02',
    title: 'Испытание Огненного Элементаля',
    startDate: '2026-02-02T00:00:00Z',
    endDate: '2026-02-09T23:59:59Z',
    maxWinners: 10,
    reward: '5 TON',
    description: 'Пройди 10 уровень приключений и победи Огненного Элементаля!',
    tip: 'Не выбирай фракцию Огня — у Элементаля высокая сопротивляемость к огню!'
};

// Проверка: акция активна?
function isPromoActive() {
    const now = new Date();
    return now >= new Date(PROMO_EVENT.startDate) && now <= new Date(PROMO_EVENT.endDate);
}

// Проверка: показывали ли уже сегодня
function wasPromoShownToday() {
    if (!window.userData) return true;
    const lastShown = window.userData.promo_last_shown?.[PROMO_EVENT.id];
    if (!lastShown) return false;

    const last = new Date(lastShown);
    const now = new Date();
    return last.toDateString() === now.toDateString();
}

// Оставшееся время акции
function getPromoTimeLeft() {
    const now = new Date();
    const end = new Date(PROMO_EVENT.endDate);
    const diff = end - now;
    if (diff <= 0) return 'Акция завершена';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} дн. ${hours} ч.`;
    return `${hours} ч.`;
}

// Проверка и показ акции при входе
function checkPromoEvent() {
    if (!isPromoActive()) return;
    if (wasPromoShownToday()) return;

    // Показываем с задержкой после daily reward
    setTimeout(() => {
        showPromoEventModal();
    }, 2000);
}

// Показ модального окна акции
function showPromoEventModal() {
    const oldModal = document.getElementById('promo-event-screen');
    if (oldModal) oldModal.remove();

    // Отмечаем показ
    if (window.userData) {
        if (!window.userData.promo_last_shown) window.userData.promo_last_shown = {};
        window.userData.promo_last_shown[PROMO_EVENT.id] = new Date().toISOString();
        if (typeof window.eventSaveManager?.saveDebounced === 'function') {
            window.eventSaveManager.saveDebounced('promo_shown', 3000);
        }
    }

    const faction = window.userData?.faction || 'fire';
    const backgroundPath = `assets/ui/window/tower_${faction}.webp`;
    const timeLeft = getPromoTimeLeft();

    const screen = document.createElement('div');
    screen.id = 'promo-event-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: promoFadeIn 0.4s ease;
    `;

    screen.innerHTML = `
        <style>
            @keyframes promoFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes promoSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes promoPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            @keyframes promoGlow { 0%, 100% { box-shadow: 0 0 20px rgba(255,165,0,0.3); } 50% { box-shadow: 0 0 40px rgba(255,165,0,0.6); } }
        </style>
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div id="promo-event-wrapper" style="position: relative; display: inline-block;">
                <img id="promo-event-bg" src="${backgroundPath}" alt="Фон" style="
                    max-width: 100vw;
                    max-height: 100vh;
                    object-fit: contain;
                    display: block;
                ">
                <div id="promo-event-overlay" style="
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                    box-sizing: border-box;
                "></div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);

    const img = document.getElementById('promo-event-bg');
    const setupUI = () => {
        const overlay = document.getElementById('promo-event-overlay');
        if (!overlay || !img) return;

        const rect = img.getBoundingClientRect();
        const scale = Math.min(rect.width / 768, rect.height / 512);

        const titleSize = Math.max(16, 24 * scale);
        const subtitleSize = Math.max(13, 18 * scale);
        const textSize = Math.max(11, 14 * scale);
        const rewardSize = Math.max(20, 32 * scale);
        const btnSize = Math.max(13, 16 * scale);
        const iconSize = Math.max(36, 50 * scale);
        const gap = Math.max(6, 10 * scale);

        overlay.style.animation = 'promoSlideUp 0.5s ease';

        overlay.innerHTML = `
            <div style="font-size: ${iconSize}px; animation: promoPulse 2s infinite;">🔥</div>

            <div style="font-size: ${titleSize}px; font-weight: bold; color: #ff6b35; margin: ${gap}px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.9);">
                ${PROMO_EVENT.title}
            </div>

            <div style="font-size: ${textSize}px; color: #ddd; max-width: 80%; margin-bottom: ${gap}px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); line-height: 1.4;">
                ${PROMO_EVENT.description}
            </div>

            <div style="
                background: linear-gradient(145deg, rgba(255,165,0,0.15), rgba(255,69,0,0.15));
                border: 2px solid rgba(255,165,0,0.5);
                border-radius: ${12 * scale}px;
                padding: ${12 * scale}px ${20 * scale}px;
                margin: ${gap}px 0;
                animation: promoGlow 2s infinite;
            ">
                <div style="font-size: ${textSize}px; color: #aaa; margin-bottom: ${4 * scale}px;">Награда</div>
                <div style="font-size: ${rewardSize}px; font-weight: bold; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    💎 ${PROMO_EVENT.reward}
                </div>
                <div style="font-size: ${textSize * 0.85}px; color: #ff9800; margin-top: ${4 * scale}px;">
                    Только первые ${PROMO_EVENT.maxWinners} игроков!
                </div>
            </div>

            <div style="
                background: rgba(0,0,0,0.4);
                border: 1px solid rgba(100,200,255,0.3);
                border-radius: ${8 * scale}px;
                padding: ${8 * scale}px ${16 * scale}px;
                margin: ${gap}px 0;
            ">
                <div style="font-size: ${textSize}px; color: #64b5f6;">
                    💡 ${PROMO_EVENT.tip}
                </div>
            </div>

            <div style="font-size: ${textSize * 0.85}px; color: #888; margin: ${gap}px 0;">
                ⏳ Осталось: ${timeLeft}
            </div>

            <div style="display: flex; gap: ${10 * scale}px; flex-wrap: wrap; justify-content: center;">
                <button onclick="document.getElementById('promo-event-screen').remove()" style="
                    background: linear-gradient(145deg, #ff6b35, #ff4500);
                    border: none;
                    padding: ${10 * scale}px ${28 * scale}px;
                    border-radius: ${25 * scale}px;
                    color: white;
                    font-size: ${btnSize}px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 15px rgba(255,69,0,0.4);
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ⚔️ К приключениям!
                </button>
                <button onclick="document.getElementById('promo-event-screen').remove()" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: ${10 * scale}px ${20 * scale}px;
                    border-radius: ${25 * scale}px;
                    color: #aaa;
                    font-size: ${btnSize * 0.9}px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    Позже
                </button>
            </div>
        `;
    };

    img.onload = setupUI;
    if (img.complete) setupUI();
}

// Экспорт
window.checkPromoEvent = checkPromoEvent;
window.showPromoEventModal = showPromoEventModal;
