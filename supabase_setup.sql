-- =====================================================================
-- ORZU MARKET - НАСТРОЙКА БАЗЫ ДАННЫХ (SUPABASE SQL EDITOR)
-- =====================================================================
-- Скопируйте и выполните этот скрипт в SQL Editor вашей панели Supabase.
-- Скрипт создаст таблицы, настроит политики RLS и добавит безопасные транзакции.

-- ---------------------------------------------------------------------
-- 1. ТАБЛИЦЫ
-- ---------------------------------------------------------------------

-- ТАБЛИЦА ПРОФИЛЕЙ (PROFILES)
-- Связана с таблицей пользователей auth.users в Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  phone VARCHAR(50),
  is_blocked BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Автоматический триггер для синхронизации новых пользователей из auth.users в public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone, is_blocked)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Покупатель'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    NEW.raw_user_meta_data->>'phone',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ТАБЛИЦА ТОВАРОВ (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock INT DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN DEFAULT true,
  photo_url TEXT,
  category VARCHAR(100) DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ТАБЛИЦА ЗАКАЗОВ (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ТАБЛИЦА ОТЗЫВОВ О ПРОДАВЦАХ (SELLER_REVIEWS)
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_seller_buyer_review UNIQUE(seller_id, buyer_id)
);

-- ---------------------------------------------------------------------
-- 2. БЕЗОПАСНОСТЬ (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- Политики для профилей (Profiles)
CREATE POLICY "Профили доступны всем для чтения" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Пользователи могут обновлять свой профиль" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Политики для товаров (Products)
CREATE POLICY "Активные товары доступны всем для чтения" 
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Продавцы видят любые свои товары" 
  ON public.products FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Администраторы видят любые товары" 
  ON public.products FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Продавцы могут создавать свои товары" 
  ON public.products FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'seller' AND is_blocked = false)
  );

CREATE POLICY "Продавцы могут обновлять свои товары" 
  ON public.products FOR UPDATE USING (
    auth.uid() = seller_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'seller' AND is_blocked = false)
  );

CREATE POLICY "Продавцы могут удалять свои товары" 
  ON public.products FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Администраторы могут модерировать товары" 
  ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Политики для заказов (Orders)
CREATE POLICY "Покупатели видят свои заказы" 
  ON public.orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Продавцы видят заказы на свои товары" 
  ON public.orders FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Администраторы видят любые заказы" 
  ON public.orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Покупатели могут оформлять заказы" 
  ON public.orders FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer' AND is_blocked = false)
  );

CREATE POLICY "Продавцы могут менять статус заказов" 
  ON public.orders FOR UPDATE USING (
    auth.uid() = seller_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'seller' AND is_blocked = false)
  );

CREATE POLICY "Администраторы могут управлять заказами" 
  ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Политики для отзывов (Seller Reviews)
CREATE POLICY "Отзывы доступны всем для чтения" 
  ON public.seller_reviews FOR SELECT USING (true);

CREATE POLICY "Покупатели могут оставлять отзывы продавцам" 
  ON public.seller_reviews FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND 
    auth.uid() != seller_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer' AND is_blocked = false)
  );

CREATE POLICY "Администраторы могут удалять отзывы" 
  ON public.seller_reviews FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------
-- 3. БЕЗОПАСНАЯ ТРАНЗАКЦИОННАЯ СДЕЛКА (CHECKOUT RPC FUNCTION)
-- ---------------------------------------------------------------------
-- Эта функция выполняет проверку цен, списание остатков товара и создание заказов
-- атомарно в рамках одной транзакции на стороне СУБД (исключает Race Conditions).
-- Вызывается через Supabase JS: `const { data, error } = await supabase.rpc('process_checkout', { p_buyer_id: uid, p_items: [...] })`

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_buyer_id UUID,
  p_items JSONB
) RETURNS TABLE (
  id UUID,
  status VARCHAR,
  quantity INT,
  total NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  item RECORD;
  v_price NUMERIC;
  v_stock INT;
  v_seller_id UUID;
  v_order_id UUID;
BEGIN
  -- Цикл по всем позициям в заказе
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id UUID, quantity INT) LOOP
    -- Блокируем строку товара для предотвращения Race Condition (запрещает параллельное чтение и изменение)
    SELECT price, stock, seller_id INTO v_price, v_stock, v_seller_id
    FROM public.products
    WHERE public.products.id = item.id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Товар с ID % не найден в базе данных', item.id;
    END IF;
    
    -- Проверяем остаток
    IF v_stock < item.quantity THEN
      RAISE EXCEPTION 'Недостаточно товара на складе для ID %. Доступно: %, Запрошено: %', item.id, v_stock, item.quantity;
    END IF;
    
    -- Атомарно списываем остаток на складе
    UPDATE public.products
    SET stock = stock - item.quantity
    WHERE public.products.id = item.id;
    
    -- Создаем заказ с актуальной ценой из БД (предотвращает подмену цены пользователем)
    INSERT INTO public.orders (buyer_id, product_id, seller_id, quantity, unit_price)
    VALUES (p_buyer_id, item.id, v_seller_id, item.quantity, v_price)
    RETURNING public.orders.id, public.orders.status, public.orders.quantity, public.orders.total, public.orders.created_at
    INTO v_order_id, status, quantity, total, created_at;
    
    id := v_order_id;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ТАБЛИЦА ОТЗЫВОВ О ТОВАРАХ (PRODUCT_REVIEWS)
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

CREATE POLICY "Разрешить чтение отзывов о товарах всем пользователям"
  ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY "Разрешить добавление отзывов авторизованным покупателям"
  ON public.product_reviews FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    buyer_id = auth.uid()
  );
