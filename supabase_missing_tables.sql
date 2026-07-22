-- =====================================================================
-- ORZU MARKET - МИГРАЦИЯ НЕДОСТАЮЩИХ ТАБЛИЦ (PRODUCT_REVIEWS & DISPUTES)
-- =====================================================================
-- Скопируйте содержимое этого файла и выполните в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fghjvudfmwtwjwmxcgtq/sql

-- ---------------------------------------------------------------------
-- 1. ТАБЛИЦА ОТЗЫВОВ О ТОВАРАХ (PRODUCT_REVIEWS)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Разрешить чтение отзывов о товарах всем пользователям') THEN
    CREATE POLICY "Разрешить чтение отзывов о товарах всем пользователям" 
      ON public.product_reviews FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Разрешить добавление отзывов авторизованным покупателям') THEN
    CREATE POLICY "Разрешить добавление отзывов авторизованным покупателям" 
      ON public.product_reviews FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        buyer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer' AND is_blocked = false)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Администраторы могут удалять отзывы о товарах') THEN
    CREATE POLICY "Администраторы могут удалять отзывы о товарах" 
      ON public.product_reviews FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. ТАБЛИЦА СПОРОВ И ЖАЛОБ (DISPUTES)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved_buyer', 'resolved_seller', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Разрешить чтение споров участникам и админам') THEN
    CREATE POLICY "Разрешить чтение споров участникам и админам" 
      ON public.disputes FOR SELECT USING (
        auth.role() = 'authenticated' AND (
          buyer_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.orders WHERE orders.id = disputes.order_id AND orders.seller_id = auth.uid()) OR
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Разрешить создание споров покупателям') THEN
    CREATE POLICY "Разрешить создание споров покупателям" 
      ON public.disputes FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        buyer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer' AND is_blocked = false)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Разрешить админам обновление споров') THEN
    CREATE POLICY "Разрешить админам обновление споров" 
      ON public.disputes FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. ИНДЕКСЫ ОПТИМИЗАЦИИ
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer_id ON public.disputes(buyer_id);
