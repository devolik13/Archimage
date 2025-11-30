// avatar-manager.js - Управление аватарами игроков

// Конфигурация кэширования
const AVATAR_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 часа

// Получение аватара из Telegram WebApp
function getTelegramAvatarUrl() {
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;

            // Telegram WebApp предоставляет photo_url напрямую
            if (user.photo_url) {
                console.log('📸 Аватар получен из Telegram WebApp');
                return user.photo_url;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка получения аватара из Telegram:', error);
    }

    return null;
}

// Получение аватара из VK (для будущего)
async function getVKAvatarUrl(vkId) {
    // TODO: Реализовать когда будет VK интеграция
    // Потребуется VK API и access token
    console.log('ℹ️ VK аватары пока не реализованы');
    return null;
}

// Проверка нужно ли обновить аватар
function needsAvatarUpdate(userData) {
    if (!userData.avatar_updated_at) return true;

    const lastUpdate = new Date(userData.avatar_updated_at).getTime();
    const now = Date.now();

    return (now - lastUpdate) > AVATAR_CACHE_TIME;
}

// Обновление аватара игрока
async function updatePlayerAvatar(userData) {
    // Проверяем нужно ли обновление
    if (!needsAvatarUpdate(userData)) {
        console.log('📸 Аватар актуален, обновление не требуется');
        return userData.avatar_url;
    }

    let avatarUrl = null;

    // Определяем платформу и получаем аватар
    const platform = userData.platform || 'telegram';

    if (platform === 'telegram') {
        avatarUrl = getTelegramAvatarUrl();
    } else if (platform === 'vk' && userData.vk_id) {
        avatarUrl = await getVKAvatarUrl(userData.vk_id);
    }

    // Если получили новый URL - обновляем
    if (avatarUrl) {
        userData.avatar_url = avatarUrl;
        userData.avatar_updated_at = new Date().toISOString();

        console.log('📸 Аватар обновлен:', avatarUrl);

        // Сохраняем в БД
        if (typeof window.eventSaveManager?.saveDebounced === 'function') {
            window.eventSaveManager.saveDebounced('avatar_update');
        }

        // Обновляем UI аватара
        if (typeof window.createPlayerAvatarUI === 'function') {
            window.createPlayerAvatarUI();
        }
    } else {
        console.log('📸 Аватар не доступен, используем дефолтный');
    }

    return avatarUrl;
}

// Инициализация аватара при загрузке игры
async function initPlayerAvatar(userData) {
    if (!userData) {
        console.warn('⚠️ userData не загружена');
        return;
    }

    // Инициализируем платформу если не указана
    if (!userData.platform) {
        userData.platform = 'telegram'; // По умолчанию Telegram
    }

    // Пытаемся обновить аватар
    await updatePlayerAvatar(userData);
}

// Принудительное обновление аватара (по запросу игрока)
async function forceUpdateAvatar() {
    if (!window.userData) {
        console.warn('⚠️ userData не загружена');
        return;
    }

    // Сбрасываем время обновления
    window.userData.avatar_updated_at = null;

    // Обновляем
    await updatePlayerAvatar(window.userData);

    console.log('📸 Аватар принудительно обновлен');
}

// Экспорт функций
window.getTelegramAvatarUrl = getTelegramAvatarUrl;
window.getVKAvatarUrl = getVKAvatarUrl;
window.updatePlayerAvatar = updatePlayerAvatar;
window.initPlayerAvatar = initPlayerAvatar;
window.forceUpdateAvatar = forceUpdateAvatar;

