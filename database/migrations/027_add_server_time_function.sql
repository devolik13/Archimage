-- ============================================
-- Функция получения серверного времени
-- Используется для синхронизации времени клиента
-- ============================================

CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT now();
$$;

COMMENT ON FUNCTION get_server_time IS 'Возвращает текущее серверное время для синхронизации с клиентом';
