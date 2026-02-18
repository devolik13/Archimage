// modals/necromancer-promo-modal.js - Промо-попап новой фракции Некромантия

/**
 * Показать промо-попап некроманта при входе в игру.
 * Показывается один раз (localStorage).
 */
function showNecromancerPromoModal() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const storageKey = 'necromancer_promo_seen_date';
    if (localStorage.getItem(storageKey) === today) return;

    // Не показываем новым игрокам без фракции
    if (!window.userData?.faction) return;

    function closePromo() {
        localStorage.setItem(storageKey, today);
        const el = document.getElementById('necromancer-promo-overlay');
        if (el) {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }
    }

    function onBuyClick() {
        closePromo();
        // Показываем окно подтверждения перед покупкой
        showNecromancerConfirmDialog();
    }

    const overlay = document.createElement('div');
    overlay.id = 'necromancer-promo-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.90); z-index: 10003;
        display: flex; align-items: center; justify-content: center;
        overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 16px 0;
        opacity: 0; transition: opacity 0.3s ease;
    `;

    // Закрытие по клику на оверлей
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePromo();
    });

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1028 40%, #0d1a0d 100%);
            border: 2px solid rgba(100, 255, 150, 0.3);
            border-radius: 16px; padding: 24px 20px; text-align: center;
            color: white; width: 320px; max-width: 92vw;
            max-height: calc(100vh - 32px); overflow-y: auto;
            box-shadow: 0 0 60px rgba(80, 200, 120, 0.2), 0 0 120px rgba(100, 60, 180, 0.15);
            margin: auto; flex-shrink: 0;
        ">
            <!-- Анимированный спрайт некроманта -->
            <div id="necro-promo-sprite" style="
                width: 140px; height: 140px; margin: 0 auto 12px;
                background: url('images/wizards/necromant/idle.webp') 0% 0% / 500% 500% no-repeat;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 20px rgba(100, 200, 150, 0.5));
            "></div>

            <!-- Тег -->
            <div style="
                font-size: 10px; color: rgba(100, 255, 150, 0.7);
                letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px;
            ">Новая фракция</div>

            <!-- Заголовок -->
            <div style="
                font-size: 22px; font-weight: bold;
                background: linear-gradient(135deg, #b8ff9e, #7cffcb);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 6px;
            ">Некромантия</div>

            <!-- Подзаголовок -->
            <div style="
                font-size: 14px; color: #ccc; line-height: 1.5; margin-bottom: 16px;
            ">
                Встречайте <b style="color: #b8ff9e;">9-ю школу магии</b><br>
                Призывай скелетов, дракона и повелевай смертью
            </div>

            <!-- Будь первым -->
            <div style="
                background: rgba(100, 255, 150, 0.08);
                border: 1px solid rgba(100, 255, 150, 0.2);
                border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;
                font-size: 13px; line-height: 1.5;
            ">
                <div style="color: #7cffcb; font-weight: bold; font-size: 15px; margin-bottom: 4px;">
                    Будь первым!
                </div>
                <div style="color: #aaa;">
                    Получи ранний доступ и начни играть<br>за некроманта уже сейчас
                </div>
            </div>

            <!-- Дата выхода -->
            <div style="
                font-size: 12px; color: #888; margin-bottom: 16px;
            ">
                Официальный выход фракции — <b style="color: #b8ff9e;">28 февраля</b>
            </div>

            <!-- Кнопки -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="necro-promo-buy-btn" style="
                    background: linear-gradient(135deg, #2d8a4e, #4ade80);
                    border: none; color: white; padding: 12px 24px;
                    border-radius: 10px; font-size: 15px; font-weight: bold;
                    cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,0.4);
                    box-shadow: 0 4px 18px rgba(74, 222, 128, 0.35);
                    transition: transform 0.15s, box-shadow 0.15s;
                ">
                    Получить ранний доступ
                </button>
                <button id="necro-promo-close-btn" style="
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #888; padding: 8px 20px;
                    border-radius: 8px; font-size: 13px;
                    cursor: pointer; transition: color 0.15s;
                ">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Плавное появление
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
    });

    // Привязка кнопок
    document.getElementById('necro-promo-buy-btn').addEventListener('click', onBuyClick);
    document.getElementById('necro-promo-close-btn').addEventListener('click', closePromo);

    // Анимация спрайта (5×5 grid = 25 кадров)
    let frame = 0;
    const totalFrames = 25;
    const cols = 5;
    const spriteInterval = setInterval(() => {
        if (!document.getElementById('necro-promo-sprite')) {
            clearInterval(spriteInterval);
            return;
        }
        frame = (frame + 1) % totalFrames;
        const col = frame % cols;
        const row = Math.floor(frame / cols);
        const xPercent = (col / (cols - 1)) * 100;
        const yPercent = (row / (cols - 1)) * 100;
        document.getElementById('necro-promo-sprite').style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    }, 100);

    // Запоминаем что показали
    localStorage.setItem(storageKey, '1');
}

/**
 * Диалог подтверждения смены фракции на Некроманта.
 * Цена: 1500 Stars или эквивалент в TON.
 */
const NECRO_EARLY_ACCESS_PRICE_STARS = 1500;
const NECRO_EARLY_ACCESS_PRICE_USD = 19.50; // 1500 Stars × $0.013

async function showNecromancerConfirmDialog() {
    // Рассчитываем цену в TON
    let tonPrice = '...';
    if (typeof window.calculateTonPrice === 'function') {
        try {
            tonPrice = await window.calculateTonPrice(NECRO_EARLY_ACCESS_PRICE_USD);
        } catch (e) {
            console.warn('Не удалось рассчитать цену TON:', e);
            tonPrice = null;
        }
    }

    const overlay = document.createElement('div');
    overlay.id = 'necro-confirm-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10005;
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ffd700;
            border-radius: 20px; padding: 24px 20px; text-align: center;
            color: white; width: 340px; max-width: 92vw;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #ffd700;">
                Подтверждение
            </div>
            <div style="font-size: 14px; color: #ccc; line-height: 1.6; margin-bottom: 14px;">
                Вы точно хотите сменить фракцию<br>на <b style="color: #7cffcb;">Некромантию</b>?
            </div>
            <div style="
                background: rgba(0,0,0,0.3); border-radius: 8px;
                padding: 8px 12px; margin-bottom: 16px;
                font-size: 12px; color: #aaa; line-height: 1.5;
            ">
                Ваши маги будут заменены на магов-некромантов.<br>
                Заклинания и прогресс фракции сохранятся.
            </div>

            <div style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 14px;">
                Выберите способ оплаты:
            </div>

            <!-- Stars -->
            <button id="necro-pay-stars" style="
                width: 100%; padding: 14px; margin-bottom: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid #ffd700; border-radius: 12px;
                color: white; font-size: 17px; font-weight: bold;
                cursor: pointer; display: flex; align-items: center;
                justify-content: center; gap: 10px;
                transition: transform 0.15s, filter 0.15s;
            ">
                <span style="font-size: 22px;">⭐</span>
                <span>${NECRO_EARLY_ACCESS_PRICE_STARS} Stars</span>
            </button>

            <!-- TON -->
            ${tonPrice ? `
            <button id="necro-pay-ton" style="
                width: 100%; padding: 14px; margin-bottom: 14px;
                background: linear-gradient(135deg, #0088cc 0%, #0066cc 100%);
                border: 2px solid #0088cc; border-radius: 12px;
                color: white; font-size: 17px; font-weight: bold;
                cursor: pointer; display: flex; align-items: center;
                justify-content: center; gap: 10px;
                transition: transform 0.15s, filter 0.15s;
            ">
                <span style="font-size: 22px;">💎</span>
                <span>${tonPrice} TON</span>
                <span style="font-size: 11px; opacity: 0.8;">(~$${NECRO_EARLY_ACCESS_PRICE_USD})</span>
            </button>
            ` : ''}

            <!-- Отмена -->
            <button id="necro-confirm-cancel" style="
                width: 100%; padding: 10px;
                background: rgba(255,255,255,0.1);
                border: 1px solid #666; border-radius: 10px;
                color: #aaa; font-size: 14px; cursor: pointer;
            ">Отмена</button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('necro-confirm-cancel').addEventListener('click', () => overlay.remove());

    document.getElementById('necro-pay-stars').addEventListener('click', async () => {
        overlay.remove();
        await buyNecromancerWithStars();
    });

    const tonBtn = document.getElementById('necro-pay-ton');
    if (tonBtn && tonPrice) {
        tonBtn.addEventListener('click', async () => {
            overlay.remove();
            await buyNecromancerWithTon(tonPrice);
        });
    }
}

/**
 * Покупка некроманта через Telegram Stars.
 */
async function buyNecromancerWithStars() {
    if (!window.Telegram?.WebApp) {
        if (typeof window.Notification?.show === 'function') {
            window.Notification.show('Доступно только в Telegram', 'warning');
        }
        return;
    }

    try {
        if (typeof window.createStarsInvoice !== 'function') {
            console.error('createStarsInvoice не найден');
            return;
        }

        const invoiceUrl = await window.createStarsInvoice(
            { id: 'faction_change' },
            NECRO_EARLY_ACCESS_PRICE_STARS,
            'necromant'
        );

        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status) => {
            console.log('💳 Necromancer Stars payment status:', status);
            if (status === 'paid') {
                await onNecromancerPurchaseSuccess(NECRO_EARLY_ACCESS_PRICE_STARS);
            } else if (status === 'cancelled') {
                if (typeof window.Notification?.show === 'function') {
                    window.Notification.show('Покупка отменена', 'info');
                }
            }
        });
    } catch (error) {
        console.error('Ошибка покупки некроманта (Stars):', error);
        if (typeof window.Notification?.show === 'function') {
            window.Notification.show('Ошибка оплаты', 'error');
        }
    }
}

/**
 * Покупка некроманта через TON.
 */
const TON_RECEIVER_ADDRESS = 'UQAnElrwdRQf8-U0ERo5DAGwitB_ipMOF0plhyDox_HA3bFU';

async function buyNecromancerWithTon(tonPrice) {
    if (!window.tonConnectUI || !window.tonConnectUI.wallet) {
        if (typeof window.Notification?.show === 'function') {
            window.Notification.show('Сначала подключите TON кошелёк в разделе Airdrop', 'warning');
        }
        return;
    }

    try {
        console.log('💎 Покупка некроманта через TON:', tonPrice, 'TON');

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: TON_RECEIVER_ADDRESS,
                    amount: String(Math.floor(tonPrice * 1000000000))
                }
            ]
        };

        const result = await window.tonConnectUI.sendTransaction(transaction);
        console.log('✅ TON транзакция некроманта отправлена:', result);

        // Сохраняем платёж
        if (typeof window.saveTonPayment === 'function') {
            await window.saveTonPayment(
                { id: 'necromancer_early_access', name: 'Некромантия: Ранний доступ' },
                tonPrice,
                result
            );
        }

        await onNecromancerPurchaseSuccess(NECRO_EARLY_ACCESS_PRICE_STARS);

    } catch (error) {
        console.error('Ошибка покупки некроманта (TON):', error);
        if (typeof window.Notification?.show === 'function') {
            window.Notification.show('Ошибка оплаты TON', 'error');
        }
    }
}

/**
 * Общий обработчик успешной покупки некроманта.
 */
async function onNecromancerPurchaseSuccess(starsAmount) {
    // Airdrop очки
    if (typeof window.addAirdropPoints === 'function') {
        const airdropPoints = Math.floor(starsAmount / 10);
        if (airdropPoints > 0) {
            window.addAirdropPoints(airdropPoints, 'Покупка Telegram Stars');

            // Бонус рефереру
            const buyerTelegramId = window.dbManager?.currentPlayer?.telegram_id;
            if (buyerTelegramId && window.referralManager?.rewardReferrerForPurchase) {
                window.referralManager.rewardReferrerForPurchase(buyerTelegramId, airdropPoints);
            }
        }
    }

    // Применяем смену фракции
    if (typeof window.applyFactionChange === 'function') {
        await window.applyFactionChange('necromant');
    }

    // Сохраняем
    if (window.eventSaveManager?.saveImmediate) {
        await window.eventSaveManager.saveImmediate('necromancer_early_access');
    }

    if (typeof window.Notification?.show === 'function') {
        window.Notification.show('Добро пожаловать в Некромантию!', 'success', 4000);
    }
}

// Экспорт
window.showNecromancerPromoModal = showNecromancerPromoModal;
window.showNecromancerConfirmDialog = showNecromancerConfirmDialog;

console.log('💀 Necromancer Promo Modal загружен');
