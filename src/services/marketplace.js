import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const orderStatusLabels = {
  new: 'Новый',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const DEMO_PRODUCTS_KEY = 'orzu_demo_products_v1';
const DEMO_ORDERS_KEY = 'orzu_demo_orders_v1';
const DEMO_USERS_KEY = 'orzu_demo_users_v1';

export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'home',
  'beauty',
  'books',
  'sports',
  'groceries',
  'other',
];

const seedProducts = [
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

const seedUsers = [
  { id: 'demo-admin', email: 'admin@demo.test', full_name: 'Demo Admin', role: 'admin', phone: '+992900000001', is_blocked: false, created_at: new Date().toISOString() },
  { id: 'demo-seller', email: 'seller@demo.test', full_name: 'Demo Seller', role: 'seller', phone: '+992900000002', is_blocked: false, created_at: new Date().toISOString() },
  { id: 'demo-buyer', email: 'buyer@demo.test', full_name: 'Demo Buyer', role: 'buyer', phone: '+992900000003', is_blocked: false, created_at: new Date().toISOString() },
];

function readJson(key, fallback) {
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

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


function fileToDataUrl(file) {
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

function getFileExtension(file) {
  const fromName = file?.name?.split('.').pop();
  if (fromName) return fromName.toLowerCase();

  const fromType = file?.type?.split('/').pop();
  return fromType || 'jpg';
}

async function uploadProductPhoto({ sellerId, photoFile }) {
  if (!photoFile) return '';

  if (!isSupabaseConfigured) {
    return fileToDataUrl(photoFile);
  }

  const extension = getFileExtension(photoFile);
  const filePath = `${sellerId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('product-photos')
    .upload(filePath, photoFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: photoFile.type || 'image/jpeg',
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

function sortDemoProducts(products, sort) {
  const [column, direction] = sort.split('.');
  return [...products].sort((a, b) => {
    const left = a[column];
    const right = b[column];
    const result = typeof left === 'string' ? left.localeCompare(right) : Number(left) - Number(right);
    return direction === 'desc' ? -result : result;
  });
}

export async function fetchActiveProducts({ search = '', minPrice = '', maxPrice = '', sort = 'created_at.desc', category = '' } = {}) {
  if (!isSupabaseConfigured) {
    let products = readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((product) => product.is_active);
    if (search.trim()) products = products.filter((product) => product.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (minPrice !== '') products = products.filter((product) => Number(product.price) >= Number(minPrice));
    if (maxPrice !== '') products = products.filter((product) => Number(product.price) <= Number(maxPrice));
    if (category) products = products.filter((product) => (product.category || 'other') === category);
    return sortDemoProducts(products, sort);
  }

  let query = supabase
    .from('products')
    .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category')
    .eq('is_active', true);

  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  if (minPrice !== '') query = query.gte('price', Number(minPrice));
  if (maxPrice !== '') query = query.lte('price', Number(maxPrice));
  if (category) query = query.eq('category', category);

  const [column, direction] = sort.split('.');
  query = query.order(column, { ascending: direction !== 'desc' });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createOrdersFromCart({ buyerId, items }) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const orders = readJson(DEMO_ORDERS_KEY, []);
    const newOrders = items.map((item) => {
      const product = products.find((value) => value.id === item.id) ?? item;
      return {
        id: crypto.randomUUID(),
        buyer_id: buyerId,
        product_id: item.id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        unit_price: Number(product.price),
        total: item.quantity * Number(product.price),
        status: 'new',
        created_at: new Date().toISOString(),
        products: { id: product.id, name: product.name, photo_url: product.photo_url },
      };
    });
    writeJson(DEMO_ORDERS_KEY, [...newOrders, ...orders]);
    return newOrders;
  }

  const rows = items.map((item) => ({
    buyer_id: buyerId,
    product_id: item.id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { data, error } = await supabase
    .from('orders')
    .insert(rows)
    .select('id, status, quantity, total, created_at');

  if (error) throw error;
  return data ?? [];
}

export async function fetchMyOrders() {
  if (!isSupabaseConfigured) return readJson(DEMO_ORDERS_KEY, []);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, buyer_id, seller_id, product_id, quantity, unit_price, total, status, created_at,
      products ( id, name, photo_url )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchSellerProducts(sellerId) {
  if (!isSupabaseConfigured) {
    return readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((product) => product.seller_id === sellerId || sellerId === 'demo-seller');
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSellerProduct({ sellerId, name, price, description, photoFile, stock, category }) {
  const photoUrl = await uploadProductPhoto({ sellerId, photoFile });

  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const product = {
      id: crypto.randomUUID(),
      seller_id: sellerId,
      name,
      price: Number(price),
      description,
      photo_url: photoUrl,
      stock: Number(stock) || 0,
      is_active: true,
      category,
      created_at: new Date().toISOString(),
    };
    writeJson(DEMO_PRODUCTS_KEY, [product, ...products]);
    return product;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: sellerId,
      name,
      price: Number(price),
      description,
      photo_url: photoUrl,
      stock: Number(stock) || 0,
      is_active: true,
      category,
    })
    .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSellerOrders() {
  if (!isSupabaseConfigured) return readJson(DEMO_ORDERS_KEY, []);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, buyer_id, seller_id, product_id, quantity, unit_price, total, status, created_at,
      products ( id, name, photo_url ),
      buyer:profiles!orders_buyer_id_fkey ( id, email, full_name )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(orderId, status) {
  if (!isSupabaseConfigured) {
    const orders = readJson(DEMO_ORDERS_KEY, []);
    writeJson(DEMO_ORDERS_KEY, orders.map((order) => order.id === orderId ? { ...order, status } : order));
    return { id: orderId, status };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('id, status')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAdminUsers() {
  if (!isSupabaseConfigured) return readJson(DEMO_USERS_KEY, seedUsers);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, is_blocked, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(userId, role) {
  if (!isSupabaseConfigured) {
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    writeJson(DEMO_USERS_KEY, users.map((user) => user.id === userId ? { ...user, role } : user));
    return { id: userId, role };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id, role')
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserBlocked(userId, isBlocked) {
  if (!isSupabaseConfigured) {
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    writeJson(DEMO_USERS_KEY, users.map((user) => user.id === userId ? { ...user, is_blocked: isBlocked } : user));
    return { id: userId, is_blocked: isBlocked };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_blocked: isBlocked })
    .eq('id', userId)
    .select('id, is_blocked')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAdminProducts() {
  if (!isSupabaseConfigured) {
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    return readJson(DEMO_PRODUCTS_KEY, seedProducts).map((product) => ({
      ...product,
      seller: users.find((user) => user.id === product.seller_id) ?? seedUsers[1],
    }));
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category,
      seller:profiles!products_seller_id_fkey ( id, email, full_name )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function setProductActive(productId, isActive) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    writeJson(DEMO_PRODUCTS_KEY, products.map((product) => product.id === productId ? { ...product, is_active: isActive } : product));
    return { id: productId, is_active: isActive };
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select('id, is_active')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(productId) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    writeJson(DEMO_PRODUCTS_KEY, products.filter((product) => product.id !== productId));
    return;
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}
