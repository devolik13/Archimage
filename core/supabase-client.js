// Подключение к Supabase
const SUPABASE_URL = 'https://legianiryweinxtsuqoh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ2lhbmlyeXdlaW54dHN1cW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTkzMzYsImV4cCI6MjA3NTUzNTMzNn0.eRUFRWr0z6Q3h5Sxbb3SQtt5x4cJeVW4u0UtDg0yrdA';

// Импортируем Supabase клиент (добавьте CDN в index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;

// ============================================
// СЕРВЕРНОЕ ВРЕМЯ
// ============================================

// Смещение между локальным и серверным временем (в мс)
let serverTimeOffset = 0;
let serverTimeSynced = false;

/**
 * Синхронизировать время с сервером
 * Вызывается при загрузке игры
 */
async function syncServerTime() {
    try {
        const localBefore = Date.now();

        // Запрашиваем текущее время с сервера
        const { data, error } = await supabase.rpc('get_server_time');

        if (error) {
            console.warn('⚠️ Не удалось получить серверное время:', error.message);
            // Fallback: создаём простой запрос для получения времени из заголовков
            const response = await fetch(SUPABASE_URL + '/rest/v1/', {
                method: 'HEAD',
                headers: { 'apikey': SUPABASE_KEY }
            });
            const serverDate = response.headers.get('date');
            if (serverDate) {
                const serverTime = new Date(serverDate).getTime();
                const localAfter = Date.now();
                const latency = (localAfter - localBefore) / 2;
                serverTimeOffset = serverTime - localAfter + latency;
                serverTimeSynced = true;
                console.log(`⏰ Серверное время синхронизировано (через headers), offset: ${serverTimeOffset}ms`);
            }
            return;
        }

        if (data) {
            const localAfter = Date.now();
            const latency = (localAfter - localBefore) / 2;
            const serverTime = new Date(data).getTime();
            serverTimeOffset = serverTime - localAfter + latency;
            serverTimeSynced = true;
            console.log(`⏰ Серверное время синхронизировано, offset: ${serverTimeOffset}ms`);
        }
    } catch (err) {
        console.warn('⚠️ Ошибка синхронизации времени:', err);
    }
}

/**
 * Получить текущее серверное время
 * @returns {Date} Серверное время (или локальное если не синхронизировано)
 */
function getServerTime() {
    return new Date(Date.now() + serverTimeOffset);
}

/**
 * Проверить, синхронизировано ли время
 */
function isServerTimeSynced() {
    return serverTimeSynced;
}

// Экспорт
window.syncServerTime = syncServerTime;
window.getServerTime = getServerTime;
window.isServerTimeSynced = isServerTimeSynced;

// Синхронизируем время при загрузке
setTimeout(syncServerTime, 1000);

console.log('✅ Supabase client загружен');
