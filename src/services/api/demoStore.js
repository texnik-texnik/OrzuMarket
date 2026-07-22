import { isSupabaseConfigured } from '../../lib/supabase';

export const DEMO_PRODUCTS_KEY = 'orzu_demo_products_v1';
export const DEMO_ORDERS_KEY = 'orzu_demo_orders_v1';
export const DEMO_USERS_KEY = 'orzu_demo_users_v1';

export const seedProducts = [
  {
    id: 'demo-product-1',
    seller_id: 'demo-seller',
    name: 'Смартфон Orzu X1',
    description: 'Демо-товар для проверки витрины без Supabase.',
    price: 2499,
    stock: 8,
    is_active: true,
    category: 'electronics',
    photo_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-product-2',
    seller_id: 'demo-seller',
    name: 'Наушники Blue Green',
    description: 'Беспроводные наушники, пример карточки товара.',
    price: 399,
    stock: 15,
    is_active: true,
    category: 'electronics',
    photo_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-product-3',
    seller_id: 'demo-seller',
    name: 'Рюкзак для города',
    description: 'Практичный рюкзак для покупателя.',
    price: 799,
    stock: 4,
    is_active: true,
    category: 'clothing',
    photo_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const seedUsers = [
  { id: 'demo-admin', email: 'admin@demo.test', full_name: 'Demo Admin', role: 'admin', phone: '+992900000001', is_blocked: false, created_at: new Date().toISOString() },
  { id: 'demo-seller', email: 'seller@demo.test', full_name: 'Demo Seller', role: 'seller', phone: '+992900000002', is_blocked: false, created_at: new Date().toISOString() },
  { id: 'demo-buyer', email: 'buyer@demo.test', full_name: 'Demo Buyer', role: 'buyer', phone: '+992900000003', is_blocked: false, created_at: new Date().toISOString() },
];

export function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
