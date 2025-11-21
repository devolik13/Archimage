-- ============================================
-- ОТКАТ ROW LEVEL SECURITY
-- Выполните в Supabase SQL Editor
-- ============================================

-- 1. Удаляем все политики
DROP POLICY IF EXISTS "telegram_select_own" ON players;
DROP POLICY IF EXISTS "telegram_insert_own" ON players;
DROP POLICY IF EXISTS "telegram_update_own" ON players;
DROP POLICY IF EXISTS "telegram_no_delete" ON players;

-- Если были временные anon политики:
DROP POLICY IF EXISTS "anon_select_all" ON players;
DROP POLICY IF EXISTS "anon_insert_own" ON players;
DROP POLICY IF EXISTS "anon_update_own" ON players;

-- 2. Отключаем RLS
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- 3. Удаляем функцию
DROP FUNCTION IF EXISTS get_telegram_id();

-- ============================================
-- ГОТОВО! RLS полностью отключен
-- Теперь доступ к таблице players работает как раньше
-- ============================================
