// database/referral-manager.js - Реферальная система

const REFERRAL_REWARD = 1440; // 1 день = 1440 минут time_currency

class ReferralManager {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // Получить реферальный параметр из Telegram
    getReferralParam() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
            if (startParam && startParam.startsWith('ref_')) {
                // Формат: ref_TELEGRAM_ID
                const referrerId = startParam.replace('ref_', '');
                console.log('🔗 Найден реферальный параметр:', referrerId);
                return referrerId;
            }
        }
        return null;
    }

    // Генерация реферальной ссылки для игрока
    generateReferralLink(telegramId) {
        // Базовый URL бота - нужно заменить на реальный
        const botUsername = window.TELEGRAM_BOT_USERNAME || 'YourBotName';
        const appName = window.TELEGRAM_APP_NAME || 'app';
        return `https://t.me/${botUsername}/${appName}?startapp=ref_${telegramId}`;
    }

    // Проверить, был ли уже обработан реферал
    async checkReferralProcessed(newPlayerId) {
        try {
            const { data, error } = await this.supabase
                .from('referrals')
                .select('id')
                .eq('referred_id', newPlayerId)
                .single();

            return !!data;
        } catch (error) {
            // Таблица может не существовать или запись не найдена
            return false;
        }
    }

    // Обработать реферал после регистрации
    async processReferral(newPlayerId, newPlayerTelegramId) {
        const referrerTelegramId = this.getReferralParam();

        if (!referrerTelegramId) {
            console.log('📝 Нет реферального параметра');
            return null;
        }

        // Нельзя пригласить самого себя
        if (referrerTelegramId === String(newPlayerTelegramId)) {
            console.log('⚠️ Попытка пригласить самого себя');
            return null;
        }

        try {
            // Проверяем, существует ли реферер
            const { data: referrer, error: referrerError } = await this.supabase
                .from('players')
                .select('id, telegram_id, time_currency, username')
                .eq('telegram_id', parseInt(referrerTelegramId))
                .single();

            if (referrerError || !referrer) {
                console.log('⚠️ Реферер не найден:', referrerTelegramId);
                return null;
            }

            // Проверяем, не обработан ли уже этот реферал
            const alreadyProcessed = await this.checkReferralProcessed(newPlayerId);
            if (alreadyProcessed) {
                console.log('⚠️ Реферал уже обработан');
                return null;
            }

            // Начисляем награду рефереру
            const { error: referrerUpdateError } = await this.supabase
                .from('players')
                .update({
                    time_currency: (referrer.time_currency || 0) + REFERRAL_REWARD
                })
                .eq('id', referrer.id);

            if (referrerUpdateError) {
                console.error('❌ Ошибка начисления награды рефереру:', referrerUpdateError);
                return null;
            }

            // Начисляем награду новому игроку (добавляем к стартовым 300)
            const { data: newPlayer, error: newPlayerError } = await this.supabase
                .from('players')
                .select('time_currency')
                .eq('id', newPlayerId)
                .single();

            if (!newPlayerError && newPlayer) {
                await this.supabase
                    .from('players')
                    .update({
                        time_currency: (newPlayer.time_currency || 0) + REFERRAL_REWARD
                    })
                    .eq('id', newPlayerId);

                // Обновляем локальные данные
                if (window.userData) {
                    window.userData.time_currency = (window.userData.time_currency || 0) + REFERRAL_REWARD;
                }
                if (window.dbManager && window.dbManager.currentPlayer) {
                    window.dbManager.currentPlayer.time_currency =
                        (window.dbManager.currentPlayer.time_currency || 0) + REFERRAL_REWARD;
                }
            }

            // Записываем реферал в таблицу (если она есть)
            try {
                await this.supabase
                    .from('referrals')
                    .insert([{
                        referrer_id: referrer.id,
                        referred_id: newPlayerId,
                        referrer_telegram_id: parseInt(referrerTelegramId),
                        referred_telegram_id: newPlayerTelegramId,
                        reward_amount: REFERRAL_REWARD,
                        created_at: new Date().toISOString()
                    }]);
            } catch (e) {
                // Таблица referrals может не существовать - это OK
                console.log('📝 Таблица referrals не найдена, пропускаем запись');
            }

            console.log(`✅ Реферал обработан! ${referrer.username} пригласил нового игрока. Оба получили ${REFERRAL_REWARD} минут`);

            return {
                referrerUsername: referrer.username,
                reward: REFERRAL_REWARD
            };

        } catch (error) {
            console.error('❌ Ошибка обработки реферала:', error);
            return null;
        }
    }

    // Показать UI реферальной ссылки
    showReferralUI() {
        if (!window.userData || !window.dbManager?.currentPlayer) {
            console.error('Данные игрока не загружены');
            return;
        }

        const telegramId = window.dbManager.currentPlayer.telegram_id;
        const referralLink = this.generateReferralLink(telegramId);

        const modalHTML = `
            <div style="padding: 20px; text-align: center; max-width: 350px;">
                <h3 style="color: #4ade80; margin-top: 0;">🎁 Пригласи друга!</h3>
                <p style="font-size: 13px; color: #ccc; margin: 15px 0;">
                    Поделись ссылкой с друзьями.<br>
                    Вы оба получите <span style="color: #4ade80; font-weight: bold;">1 день</span> игрового времени!
                </p>

                <div style="
                    background: #3d3d5c;
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 15px 0;
                    word-break: break-all;
                    font-size: 11px;
                    color: #aaa;
                " id="referral-link-text">${referralLink}</div>

                <button onclick="window.referralManager.copyReferralLink()" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-bottom: 10px;
                ">📋 Скопировать ссылку</button>

                <button onclick="window.referralManager.shareToTelegram()" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #0088cc, #0077b5);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-bottom: 10px;
                ">📤 Поделиться в Telegram</button>

                <button onclick="window.referralManager.closeReferralUI()" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(114, 137, 218, 0.9);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">← Назад</button>
            </div>
        `;

        // Всегда используем свою модалку с высоким z-index
        const overlay = document.createElement('div');
        overlay.id = 'referral-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #2c2c3d;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;
        modal.innerHTML = modalHTML;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // Закрыть окно реферальной ссылки
    closeReferralUI() {
        const overlay = document.getElementById('referral-modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Скопировать ссылку
    copyReferralLink() {
        const telegramId = window.dbManager?.currentPlayer?.telegram_id;
        if (!telegramId) return;

        const link = this.generateReferralLink(telegramId);

        navigator.clipboard.writeText(link).then(() => {
            if (typeof showInlineNotification === 'function') {
                showInlineNotification('✅ Ссылка скопирована!');
            } else {
                alert('Ссылка скопирована!');
            }
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            if (typeof showInlineNotification === 'function') {
                showInlineNotification('✅ Ссылка скопирована!');
            }
        });
    }

    // Поделиться в Telegram
    shareToTelegram() {
        const telegramId = window.dbManager?.currentPlayer?.telegram_id;
        if (!telegramId) return;

        const link = this.generateReferralLink(telegramId);
        const text = '🧙‍♂️ Присоединяйся к Archimage! Магическая стратегия с боями магов. Мы оба получим 1 день игрового времени!';

        // Используем Telegram WebApp для шаринга
        if (window.Telegram && window.Telegram.WebApp) {
            // Открываем Telegram share
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            // Fallback - открываем в новом окне
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
            window.open(shareUrl, '_blank');
        }
    }
}

// Создаём глобальный экземпляр
window.referralManager = new ReferralManager();

// Константы для настройки бота (замени на реальные)
window.TELEGRAM_BOT_USERNAME = 'ArchiMageBot'; // Имя бота
window.TELEGRAM_APP_NAME = 'app'; // Имя Mini App
