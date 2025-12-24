// database/referral-manager.js - Реферальная система

const REFERRAL_REWARD = 1440; // 1 день = 1440 минут time_currency
const REFERRAL_PURCHASE_BONUS_PERCENT = 10; // 10% от BPM coin покупателя идёт рефереру

class ReferralManager {
    constructor() {
        // Supabase клиент берём динамически, т.к. может быть не инициализирован при загрузке
        this.supabase = null;
    }

    // Получить supabase клиент (ленивая инициализация)
    getSupabase() {
        if (!this.supabase) {
            this.supabase = window.supabaseClient;
        }
        if (!this.supabase) {
            console.error('❌ Supabase клиент не инициализирован!');
        }
        return this.supabase;
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
        // Используем Main App (без short_name) - открывает напрямую с параметром
        const botUsername = window.TELEGRAM_BOT_USERNAME || 'Archimage_bot';
        return `https://t.me/${botUsername}?startapp=ref_${telegramId}`;
    }

    // Проверить, был ли уже обработан реферал
    async checkReferralProcessed(newPlayerTelegramId) {
        try {
            const supabase = this.getSupabase();
            if (!supabase) return false;

            const { data, error } = await supabase
                .from('referrals')
                .select('id')
                .eq('referred_telegram_id', newPlayerTelegramId)
                .single();

            return !!data;
        } catch (error) {
            // Таблица может не существовать или запись не найдена
            return false;
        }
    }

    // Обработать реферал после регистрации (использует RPC для обхода RLS)
    async processReferral(newPlayerId, newPlayerTelegramId) {
        console.log('🔗 processReferral вызван:', { newPlayerId, newPlayerTelegramId });

        const referrerTelegramId = this.getReferralParam();

        if (!referrerTelegramId) {
            console.log('📝 Нет реферального параметра');
            return null;
        }

        console.log('🔗 Реферер telegram_id:', referrerTelegramId, 'Новый игрок:', newPlayerTelegramId);

        // Нельзя пригласить самого себя
        if (referrerTelegramId === String(newPlayerTelegramId)) {
            console.log('⚠️ Попытка пригласить самого себя');
            return null;
        }

        try {
            const supabase = this.getSupabase();
            if (!supabase) {
                console.error('❌ Supabase не инициализирован в processReferral');
                return null;
            }

            // Используем RPC функцию для обработки реферала (обходит RLS)
            console.log('🔗 Вызываем RPC process_referral...');
            const { data: result, error: rpcError } = await supabase.rpc('process_referral', {
                p_referrer_telegram_id: parseInt(referrerTelegramId),
                p_referred_telegram_id: typeof newPlayerTelegramId === 'number' ? newPlayerTelegramId : parseInt(newPlayerTelegramId),
                p_reward_time: REFERRAL_REWARD,
                p_reward_points: 200
            });

            if (rpcError) {
                console.error('❌ Ошибка RPC process_referral:', rpcError);
                return null;
            }

            console.log('🔗 Результат RPC:', result);

            if (!result.success) {
                console.log('⚠️ Реферал не обработан:', result.error);
                return null;
            }

            console.log(`✅ Реферал обработан! ${result.referrer_username} пригласил нового игрока. Оба получили ${result.reward_time} минут и ${result.reward_points} BPM`);

            // Обновляем локальные данные нового игрока
            if (window.userData) {
                window.userData.time_currency = (window.userData.time_currency || 0) + REFERRAL_REWARD;

                // Используем addAirdropPoints для отслеживания в breakdown
                if (typeof window.addAirdropPoints === 'function') {
                    // addAirdropPoints сам обновит airdrop_points и breakdown
                    window.addAirdropPoints(200, 'Приглашение друга');
                } else {
                    // Fallback если функция недоступна
                    window.userData.airdrop_points = (window.userData.airdrop_points || 0) + 200;
                }
            }
            if (window.dbManager && window.dbManager.currentPlayer) {
                window.dbManager.currentPlayer.time_currency =
                    (window.dbManager.currentPlayer.time_currency || 0) + REFERRAL_REWARD;
                window.dbManager.currentPlayer.airdrop_points =
                    (window.dbManager.currentPlayer.airdrop_points || 0) + 200;
            }

            // Очищаем сохраненный параметр чтобы не засчитать дважды
            try {
                localStorage.removeItem('archimage_referral_param');
                console.log('🧹 Реферальный параметр очищен из localStorage');
            } catch (e) {
                console.error('❌ Ошибка очистки реферального параметра:', e);
            }

            return {
                referrerUsername: result.referrer_username,
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
            const supabase = this.getSupabase();
            if (!supabase) return null;

            const { data: referralRecord, error: refError } = await supabase
                .from('referrals')
                .select('id, referrer_telegram_id, total_purchase_bonus')
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
            const { data: referrer, error: referrerError } = await supabase
                .from('players')
                .select('id, airdrop_points, username')
                .eq('telegram_id', referralRecord.referrer_telegram_id)
                .single();

            if (referrerError || !referrer) {
                console.warn('⚠️ Реферер не найден:', referralRecord.referrer_telegram_id);
                return null;
            }

            // Начисляем бонус рефереру
            const { error: updateError } = await supabase
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
            await supabase
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

    // Получить количество приглашенных игроков (по telegram_id)
    async getReferralCount(telegramId) {
        try {
            const supabase = this.getSupabase();
            if (!supabase) return 0;

            const { count, error } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_telegram_id', telegramId);

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

    // Получить полную статистику рефералов (по telegram_id)
    async getReferralStats(telegramId) {
        try {
            const supabase = this.getSupabase();
            if (!supabase) return { count: 0, totalTime: 0, totalBonus: 0 };

            const { data, error } = await supabase
                .from('referrals')
                .select('reward_amount, total_purchase_bonus')
                .eq('referrer_telegram_id', telegramId);

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
        const referralLink = this.generateReferralLink(telegramId);

        // Загружаем статистику
        const stats = await this.getReferralStats(telegramId);
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

        // Более привлекательный текст для шеринга
        const text = `🔥 Попробуй Archimage - тактическую PvP игру в Telegram!

⚔️ Битвы с магами (6 фракций)
🏰 Строй свою академию
💰 Зарабатывай BPM coin

🎁 Бонус для нас обоих:
✅ +1 день времени
✅ +200 BPM coin

Играй бесплатно: ${link}`;

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
