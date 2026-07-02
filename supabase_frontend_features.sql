-- Дополнение к supabase_rls.sql для фронтенда маркетплейса.
-- Запускайте, если базовый SQL уже был применён.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS photo_url text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_blocked_idx ON public.profiles(is_blocked);

-- Если хотите, чтобы блокировка работала не только на фронтенде,
-- добавьте проверки NOT is_blocked в RLS policies или вынесите это в отдельную функцию.
-- Текущий фронтенд при is_blocked=true отправляет пользователя на /blocked.
