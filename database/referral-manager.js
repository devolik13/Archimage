// database/referral-manager.js - Реферальная система

const REFERRAL_REWARD = 1440; // 1 день = 1440 минут time_currency
const REFERRAL_PURCHASE_BONUS_PERCENT = 10; // 10% от BPM coin покупателя идёт рефереру

class ReferralManager {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // Получить реферальный параметр из Telegram или localStorage
    getReferralParam() {
        // Сначала пробуем взять из Telegram (свежий)
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
            if (startParam && startParam.startsWith('ref_')) {
                const referrerId = startParam.replace('ref_', '');
                console.log('🔗 Найден реферальный параметр из Telegram:', referrerId);
                return referrerId;
            }
        }

        // Если нет - пробуем из localStorage (сохраненный при первом входе)
        try {
            const savedParam = localStorage.getItem('archimage_referral_param');
            if (savedParam && savedParam.startsWith('ref_')) {
                const referrerId = savedParam.replace('ref_', '');
                console.log('🔗 Найден реферальный параметр из localStorage:', referrerId);
                return referrerId;
            }
        } catch (e) {
            console.error('❌ Ошибка чтения реферального параметра из localStorage:', e);
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
                    time_currency: (referrer.time_currency || 0) + REFERRAL_REWARD,
                    airdrop_points: (referrer.airdrop_points || 0) + 200
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
                        time_currency: (newPlayer.time_currency || 0) + REFERRAL_REWARD,
                        airdrop_points: (newPlayer.airdrop_points || 0) + 200
                    })
                    .eq('id', newPlayerId);

                // Обновляем локальные данные
                if (window.userData) {
                    window.userData.time_currency = (window.userData.time_currency || 0) + REFERRAL_REWARD;
                    window.userData.airdrop_points = (window.userData.airdrop_points || 0) + 200;
                }
                if (window.dbManager && window.dbManager.currentPlayer) {
                    window.dbManager.currentPlayer.time_currency =
                        (window.dbManager.currentPlayer.time_currency || 0) + REFERRAL_REWARD;
                    window.dbManager.currentPlayer.airdrop_points =
                        (window.dbManager.currentPlayer.airdrop_points || 0) + 200;
                }
            }

            // Записываем реферал в таблицу
            const { error: insertError } = await this.supabase
                .from('referrals')
                .insert([{
                    referrer_id: referrer.id,
                    referred_id: newPlayerId,
                    referrer_telegram_id: parseInt(referrerTelegramId),
                    referred_telegram_id: newPlayerTelegramId,
                    reward_amount: REFERRAL_REWARD,
                    reward_claimed: true,
                    total_purchase_bonus: 0
                }]);

            if (insertError) {
                console.error('❌ Ошибка записи реферала:', insertError);
                // Не прерываем - награды уже начислены
            }

            console.log(`✅ Реферал обработан! ${referrer.username} пригласил нового игрока. Оба получили ${REFERRAL_REWARD} минут`);

            // Очищаем сохраненный параметр чтобы не засчитать дважды
            try {
                localStorage.removeItem('archimage_referral_param');
                console.log('🧹 Реферальный параметр очищен из localStorage');
            } catch (e) {
                console.error('❌ Ошибка очистки реферального параметра:', e);
            }

            return {
                referrerUsername: referrer.username,
                reward: REFERRAL_REWARD
            };

        } catch (error) {
            console.error('❌ Ошибка обработки реферала:', error);
            return null;
        }
    }

    // Начислить бонус рефереру за покупку привлечённого игрока
    async rewardReferrerForPurchase(buyerTelegramId, airdropPointsEarned) {
        if (!airdropPointsEarned || airdropPointsEarned <= 0) return null;

        try {
            // Ищем реферера этого игрока в таблице referrals
            const { data: referralRecord, error: refError } = await this.supabase
                .from('referrals')
                .select('id, referrer_id, referrer_telegram_id, total_purchase_bonus')
                .eq('referred_telegram_id', buyerTelegramId)
                .single();

            if (refError || !referralRecord) {
                // Игрок не был приглашён никем - это нормально
                console.log('📝 Покупатель не имеет реферера');
                return null;
            }

            // Вычисляем бонус для реферера (10% от очков покупателя)
            const referrerBonus = Math.floor(airdropPointsEarned * REFERRAL_PURCHASE_BONUS_PERCENT / 100);
            if (referrerBonus <= 0) return null;

            // Получаем текущие очки реферера
            const { data: referrer, error: referrerError } = await this.supabase
                .from('players')
                .select('id, airdrop_points, username')
                .eq('telegram_id', referralRecord.referrer_telegram_id)
                .single();

            if (referrerError || !referrer) {
                console.warn('⚠️ Реферер не найден:', referralRecord.referrer_telegram_id);
                return null;
            }

            // Начисляем бонус рефереру
            const { error: updateError } = await this.supabase
                .from('players')
                .update({
                    airdrop_points: (referrer.airdrop_points || 0) + referrerBonus
                })
                .eq('id', referrer.id);

            if (updateError) {
                console.error('❌ Ошибка начисления бонуса рефереру:', updateError);
                return null;
            }

            // Обновляем статистику бонусов в таблице referrals
            await this.supabase
                .from('referrals')
                .update({
                    total_purchase_bonus: (referralRecord.total_purchase_bonus || 0) + referrerBonus
                })
                .eq('id', referralRecord.id);

            console.log(`🎁 Реферер ${referrer.username} получил +${referrerBonus} BPM coin за покупку приглашённого игрока`);

            return {
                referrerUsername: referrer.username,
                bonus: referrerBonus
            };

        } catch (error) {
            console.error('❌ Ошибка начисления реферального бонуса:', error);
            return null;
        }
    }

    // Получить количество приглашенных игроков
    async getReferralCount(playerId) {
        try {
            const { count, error } = await this.supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', playerId);

            if (error) {
                console.error('❌ Ошибка получения количества рефералов:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('❌ Ошибка получения количества рефералов:', error);
            return 0;
        }
    }

    // Получить полную статистику рефералов
    async getReferralStats(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('referrals')
                .select('reward_amount, total_purchase_bonus')
                .eq('referrer_id', playerId);

            if (error) {
                console.error('❌ Ошибка получения статистики рефералов:', error);
                return { count: 0, totalTime: 0, totalBonus: 0 };
            }

            const count = data?.length || 0;
            const totalTime = data?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;
            const totalBonus = data?.reduce((sum, r) => sum + (r.total_purchase_bonus || 0), 0) || 0;

            return { count, totalTime, totalBonus };
        } catch (error) {
            console.error('❌ Ошибка получения статистики рефералов:', error);
            return { count: 0, totalTime: 0, totalBonus: 0 };
        }
    }

    // Показать UI реферальной ссылки
    async showReferralUI() {
        if (!window.userData || !window.dbManager?.currentPlayer) {
            console.error('Данные игрока не загружены');
            return;
        }

        const telegramId = window.dbManager.currentPlayer.telegram_id;
        const playerId = window.dbManager.currentPlayer.id;
        const referralLink = this.generateReferralLink(telegramId);

        // Загружаем статистику
        const stats = await this.getReferralStats(playerId);
        const totalDays = Math.floor(stats.totalTime / 1440);

        // Формируем блок статистики
        let statsHtml = '';
        if (stats.count > 0) {
            statsHtml = `
                <div style="
                    background: rgba(74, 222, 128, 0.1);
                    border: 1px solid rgba(74, 222, 128, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin: 15px 0;
                    text-align: left;
                ">
                    <div style="font-size: 14px; color: #4ade80; margin-bottom: 8px; text-align: center;">
                        📊 Твоя статистика
                    </div>
                    <div style="font-size: 13px; color: #ccc; display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>👥 Приглашено друзей:</span>
                        <span style="color: #4ade80; font-weight: bold;">${stats.count}</span>
                    </div>
                    <div style="font-size: 13px; color: #ccc; display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>⏰ Получено времени:</span>
                        <span style="color: #4ade80; font-weight: bold;">${totalDays} дн.</span>
                    </div>
                    ${stats.totalBonus > 0 ? `
                    <div style="font-size: 13px; color: #ccc; display: flex; justify-content: space-between;">
                        <span>💎 Бонус от покупок:</span>
                        <span style="color: #ffd700; font-weight: bold;">+${stats.totalBonus} BPM</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        const modalHTML = `
            <div style="padding: 20px; text-align: center; max-width: 350px;">
                <h3 style="color: #4ade80; margin-top: 0;">🎁 Пригласи друга!</h3>
                <p style="font-size: 13px; color: #ccc; margin: 15px 0;">
                    Поделись ссылкой с друзьями.<br>
                    Вы оба получите <span style="color: #4ade80; font-weight: bold;">1 день</span> времени + <span style="color: #ffd700; font-weight: bold;">200 BPM coin</span>!
                </p>
                <p style="font-size: 11px; color: #888; margin: 10px 0;">
                    💎 Бонус: <span style="color: #ffd700;">+10%</span> BPM coin от покупок друга навсегда!
                </p>

                ${statsHtml}

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
        const text = '🧙‍♂️ Присоединяйся к Archimage! Магическая стратегия с боями магов. Мы оба получим 1 день времени + 200 BPM coin! 🪙';

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

// Константы для настройки бота
window.TELEGRAM_BOT_USERNAME = 'Archimage_bot'; // Имя бота
window.TELEGRAM_APP_NAME = 'app'; // Имя Mini App
