-- Supabase SQL: profiles/products/orders + roles + RLS
-- Запускайте в Supabase SQL Editor.

-- 1) Типы ролей и статусов
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'buyer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.order_status AS ENUM ('new', 'paid', 'processing', 'shipped', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Таблицы
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  role public.app_role NOT NULL DEFAULT 'buyer',
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_seller_id_idx ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS products_is_active_idx ON public.products(is_active);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status public.order_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_buyer_not_seller CHECK (buyer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON public.orders(product_id);

-- 3) Вспомогательные функции для RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false)
$$;

CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'seller', false)
$$;

CREATE OR REPLACE FUNCTION public.is_buyer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'buyer', false)
$$;

-- 4) Триггеры
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Автоматически выставляет seller_id и unit_price заказа по товару,
-- чтобы buyer не мог подменить продавца или цену при INSERT.
CREATE OR REPLACE FUNCTION public.fill_order_from_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_price numeric(12,2);
  v_stock integer;
  v_is_active boolean;
BEGIN
  SELECT p.seller_id, p.price, p.stock, p.is_active
  INTO v_seller_id, v_price, v_stock, v_is_active
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Product is not active';
  END IF;

  IF v_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Not enough stock';
  END IF;

  NEW.seller_id := v_seller_id;
  NEW.unit_price := v_price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fill_order_from_product_before_insert ON public.orders;
CREATE TRIGGER fill_order_from_product_before_insert
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fill_order_from_product();

-- Не даём обычным пользователям менять ключевые поля заказа после создания.
-- Продавец сможет менять статус только своих заказов через RLS-политику ниже.
CREATE OR REPLACE FUNCTION public.prevent_order_core_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.unit_price IS DISTINCT FROM OLD.unit_price THEN
    RAISE EXCEPTION 'Only order status can be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_order_core_changes_before_update ON public.orders;
CREATE TRIGGER prevent_order_core_changes_before_update
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_order_core_changes();

-- 5) Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6) Grants. RLS всё равно ограничивает строки.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_seller() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_buyer() TO authenticated, anon;

-- 7) RLS policies: profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_as_buyer" ON public.profiles;
CREATE POLICY "profiles_insert_own_as_buyer"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() AND role = 'buyer');

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8) RLS policies: products
-- Публично видны только активные товары.
DROP POLICY IF EXISTS "products_public_select_active" ON public.products;
CREATE POLICY "products_public_select_active"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true OR seller_id = auth.uid() OR public.is_admin());

-- Создавать товар может seller только от своего seller_id; admin может любой.
DROP POLICY IF EXISTS "products_insert_seller_own_or_admin" ON public.products;
CREATE POLICY "products_insert_seller_own_or_admin"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
);

-- Главное правило: seller может менять только товары, где seller_id = auth.uid().
DROP POLICY IF EXISTS "products_update_seller_own_or_admin" ON public.products;
CREATE POLICY "products_update_seller_own_or_admin"
ON public.products
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
);

DROP POLICY IF EXISTS "products_delete_seller_own_or_admin" ON public.products;
CREATE POLICY "products_delete_seller_own_or_admin"
ON public.products
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
);

-- 9) RLS policies: orders
DROP POLICY IF EXISTS "orders_select_participants_or_admin" ON public.orders;
CREATE POLICY "orders_select_participants_or_admin"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR buyer_id = auth.uid()
  OR seller_id = auth.uid()
);

-- Buyer создаёт заказ только от своего buyer_id.
-- seller_id и unit_price автоматически выставляются триггером по product_id.
DROP POLICY IF EXISTS "orders_insert_buyer_own" ON public.orders;
CREATE POLICY "orders_insert_buyer_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_buyer()
  AND buyer_id = auth.uid()
);

-- Seller может обновлять только свои заказы; триггер выше разрешит менять только status.
DROP POLICY IF EXISTS "orders_update_seller_own_or_admin" ON public.orders;
CREATE POLICY "orders_update_seller_own_or_admin"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR (public.is_seller() AND seller_id = auth.uid())
);

DROP POLICY IF EXISTS "orders_delete_admin_only" ON public.orders;
CREATE POLICY "orders_delete_admin_only"
ON public.orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 10) Опционально: авто-создание profile при регистрации пользователя.
-- Если profile создаёте из backend/service role, этот блок можно не использовать.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'buyer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- После первого запуска назначьте первого администратора через SQL Editor/service role:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- Администратор сможет назначать seller/buyer/admin:
-- UPDATE public.profiles SET role = 'seller' WHERE email = 'seller@example.com';
