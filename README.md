# Supabase Role Frontend Skeleton

React + Vite frontend для маркетплейса Orzu с проверкой роли пользователя из таблицы `profiles` после логина.

Логотип маркетплейса находится в `public/orzu-logo.jpg` и используется в шапке, на странице входа и как favicon.

## Роуты и доступ

- `/admin/*` — только `role === 'admin'`
- `/dashboard/*` — только `role === 'seller'`
- `/shop`, `/checkout`, `/profile` — любой авторизованный пользователь
- заблокированный пользователь с `profiles.is_blocked = true` попадает на `/blocked`

После входа пользователь перенаправляется:

- `admin` → `/admin`
- `seller` → `/dashboard`
- `buyer` → `/shop`

## Реализовано

### Покупатель

- Главная страница `/shop` с сеткой товаров
- Фильтрация: поиск, цена от/до, сортировка
- Кнопка «Добавить в корзину»
- Корзина в `localStorage`
- `/checkout` создаёт заказы в таблице `orders`
- `/profile` показывает данные профиля и историю заказов

### Продавец

- `/dashboard/products` — таблица только его товаров
- Кнопка «Добавить товар»
- Модалка: название, цена, описание, загрузка фото, остаток
- Фото загружается в Supabase Storage bucket `product-photos`, а публичный URL сохраняется в `products.photo_url`
- `/dashboard/orders` — заказы, где фигурируют его товары
- Изменение статуса заказа, включая быстрый статус «В пути»

### Админ

- `/admin/users` — список пользователей
- Переключатель buyer/seller
- Переключатель блокировки пользователя
- `/admin/products` — все товары маркетплейса
- Кнопки «Скрыть/Показать» и «Удалить»

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Если `.env` ещё не заполнен, приложение запустится в demo mode без Supabase. На странице входа доступны тестовые аккаунты:

- `buyer@demo.test`
- `seller@demo.test`
- `admin@demo.test`

Пароль можно ввести любой.

Когда Supabase будет готов:

```bash
cp .env.example .env
# заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

## SQL

Если базовый `supabase_rls.sql` уже применён, дополнительно запустите из корня проекта:

```sql
-- supabase_frontend_features.sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
```

В репозитории есть полный файл: `../supabase_frontend_features.sql`.

Для загрузки фото товаров также запустите:

```sql
-- ../supabase_storage.sql
-- создаёт public bucket product-photos и storage policies,
-- чтобы seller мог загружать файлы только в свою папку {seller_id}/...
```

## Главные файлы

- `src/auth/AuthProvider.jsx` — сессия Supabase, загрузка профиля и роли из `profiles`
- `src/routes/ProtectedRoute.jsx` — защищённые роуты по ролям и блокировке
- `src/cart/CartProvider.jsx` — корзина в `localStorage`
- `src/services/marketplace.js` — запросы к Supabase
- `src/App.jsx` — конфигурация маршрутов
- `src/lib/supabase.js` — Supabase client
