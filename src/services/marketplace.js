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

  if (uploadError) {
    throw new Error('Не удалось загрузить изображение. Убедитесь, что в Supabase Console создан Storage-бакет "product-photos" с публичным доступом (Public). Ошибка: ' + uploadError.message);
  }

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
    
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    const enriched = products.map((product) => ({
      ...product,
      seller: users.find((user) => user.id === product.seller_id) ?? { full_name: 'Demo Seller', id: product.seller_id },
    }));
    return sortDemoProducts(enriched, sort);
  }

  let query = supabase
    .from('products')
    .select(`
      id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category,
      seller:profiles!products_seller_id_fkey ( id, email, full_name )
    `)
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
    
    // Decrement stock for local demo products
    const updatedProducts = products.map((prod) => {
      const cartItem = items.find((item) => item.id === prod.id);
      if (cartItem) {
        return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
      }
      return prod;
    });
    writeJson(DEMO_PRODUCTS_KEY, updatedProducts);

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

  // Decrement stock in Supabase database products table
  try {
    await Promise.all(
      items.map(async (item) => {
        const { data: prodData } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .maybeSingle();
        
        if (prodData) {
          const currentStock = prodData.stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
        }
      })
    );
  } catch (stockError) {
    console.error('Failed to update product stock:', stockError);
  }

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
  let photoUrl = '';
  try {
    photoUrl = await uploadProductPhoto({ sellerId, photoFile });
  } catch (err) {
    throw new Error('Ошибка хранилища: ' + (err.message ?? err));
  }

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

  // Attempt insert with category column
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
    .maybeSingle();

  if (error) {
    // Check if error is due to RLS policies
    if (error.message && error.message.toLowerCase().includes('row-level security')) {
      throw new Error('Ошибка прав доступа (RLS): Пожалуйста, отключите RLS для таблицы "products" в Supabase Console или добавьте политику разрешения вставки (INSERT) для продавцов.');
    }
    
    // Check if category column doesn't exist (self-healing retry)
    if (error.message && (error.message.includes('category') || error.code === '42703')) {
      console.warn('Column "category" does not exist in Supabase products table. Retrying insert without it.');
      const { data: retryData, error: retryError } = await supabase
        .from('products')
        .insert({
          seller_id: sellerId,
          name,
          price: Number(price),
          description,
          photo_url: photoUrl,
          stock: Number(stock) || 0,
          is_active: true,
        })
        .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at')
        .maybeSingle();

      if (retryError) {
        if (retryError.message && retryError.message.toLowerCase().includes('row-level security')) {
          throw new Error('Ошибка прав доступа (RLS): Пожалуйста, отключите RLS для таблицы "products" в Supabase Console или добавьте политику разрешения вставки (INSERT) для продавцов.');
        }
        throw retryError;
      }
      return { ...retryData, category: '' };
    }
    throw error;
  }
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

export async function uploadAvatarPhoto({ userId, photoFile }) {
  if (!photoFile) return '';

  if (!isSupabaseConfigured) {
    return fileToDataUrl(photoFile);
  }

  const extension = getFileExtension(photoFile);
  const filePath = `avatars/${userId}.${extension}`;

  // Reuse the product-photos bucket to ensure it doesn't fail if they don't have an "avatars" bucket
  const { error: uploadError } = await supabase.storage
    .from('product-photos')
    .upload(filePath, photoFile, {
      cacheControl: '3600',
      upsert: true, // Upsert replaces the file if it already exists
      contentType: photoFile.type || 'image/jpeg',
    });

  if (uploadError) {
    throw new Error('Не удалось загрузить аватар: ' + uploadError.message);
  }

  const { data } = supabase.storage
    .from('product-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function updateUserProfile({ userId, fullName, phone, photoFile }) {
  let avatarUrl = '';
  if (photoFile) {
    avatarUrl = await uploadAvatarPhoto({ userId, photoFile });
  }

  if (!isSupabaseConfigured) {
    const DEMO_AUTH_KEY = 'orzu_demo_auth_v1';
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, full_name: fullName, phone, avatar_url: avatarUrl || user.avatar_url } : user
    );
    writeJson(DEMO_USERS_KEY, updatedUsers);

    const savedAuth = JSON.parse(localStorage.getItem(DEMO_AUTH_KEY) ?? 'null');
    if (savedAuth && savedAuth.profile?.id === userId) {
      savedAuth.profile.full_name = fullName;
      savedAuth.profile.phone = phone;
      if (avatarUrl) {
        savedAuth.profile.avatar_url = avatarUrl;
      }
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(savedAuth));
    }
    return { id: userId, full_name: fullName, phone, avatar_url: avatarUrl };
  }

  const updateFields = { full_name: fullName, phone };
  if (avatarUrl) {
    updateFields.avatar_url = avatarUrl;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', userId)
    .select('id, email, full_name, role, phone, is_blocked, avatar_url')
    .maybeSingle();

  if (error) {
    // If the avatar_url column doesn't exist, retry update without it
    if (error.message && (error.message.includes('avatar_url') || error.code === '42703')) {
      console.warn('Column "avatar_url" does not exist in profiles table. Retrying update without it.');
      const { data: retryData, error: retryError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', userId)
        .select('id, email, full_name, role, phone, is_blocked')
        .maybeSingle();

      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
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

const DEMO_REVIEWS_KEY = 'orzu_demo_reviews_v1';

const seedReviews = [
  {
    id: 'demo-review-1',
    seller_id: 'demo-seller',
    buyer_id: 'demo-buyer',
    buyer_name: 'Алишер Содиқов',
    rating: 5,
    text: 'Аъло! Маҳсулотҳо хеле хубанд ва расонидани онҳо зуд буд.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'demo-review-2',
    seller_id: 'demo-seller',
    buyer_id: 'demo-buyer-2',
    buyer_name: 'Мадина Воҳидова',
    rating: 4,
    text: 'Хороший продавец, быстро отвечает и товар соответствует описанию.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export async function fetchSellerReviews(sellerId) {
  if (!isSupabaseConfigured) {
    const reviews = readJson(DEMO_REVIEWS_KEY, seedReviews);
    return reviews.filter((r) => r.seller_id === sellerId);
  }

  try {
    const { data, error } = await supabase
      .from('seller_reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('Supabase seller_reviews table query failed, falling back to local demo reviews.', err.message);
    const reviews = readJson(DEMO_REVIEWS_KEY, seedReviews);
    return reviews.filter((r) => r.seller_id === sellerId);
  }
}

export async function createSellerReview({ sellerId, buyerId, buyerName, rating, text }) {
  const newReview = {
    id: crypto.randomUUID(),
    seller_id: sellerId,
    buyer_id: buyerId,
    buyer_name: buyerName || 'Покупатель',
    rating: Number(rating),
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const reviews = readJson(DEMO_REVIEWS_KEY, seedReviews);
    const updated = [newReview, ...reviews];
    writeJson(DEMO_REVIEWS_KEY, updated);
    return newReview;
  }

  try {
    const { data, error } = await supabase
      .from('seller_reviews')
      .insert({
        seller_id: sellerId,
        buyer_id: buyerId,
        buyer_name: buyerName || 'Покупатель',
        rating: Number(rating),
        text: text.trim(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase seller_reviews insert failed, inserting to local demo reviews.', err.message);
    const reviews = readJson(DEMO_REVIEWS_KEY, seedReviews);
    const updated = [newReview, ...reviews];
    writeJson(DEMO_REVIEWS_KEY, updated);
    return newReview;
  }
}

export async function fetchSellerProfile(sellerId) {
  let profile = null;

  if (!isSupabaseConfigured) {
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    profile = users.find((u) => u.id === sellerId) || { id: sellerId, full_name: 'Demo Seller', email: 'seller@demo.test', phone: '+992900000002' };
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, is_blocked, created_at')
      .eq('id', sellerId)
      .single();
    
    if (error) {
      console.warn('Could not load profile from Supabase, loading fallback.');
      profile = { id: sellerId, full_name: 'Seller', email: 'seller@example.com' };
    } else {
      profile = data;
    }
  }

  // Load reviews to aggregate rating
  const reviews = await fetchSellerReviews(sellerId);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  // Load seller active products count
  let products = [];
  if (!isSupabaseConfigured) {
    products = readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((p) => p.seller_id === sellerId && p.is_active);
  } else {
    try {
      const { data } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('is_active', true);
      products = data ?? [];
    } catch {
      products = [];
    }
  }

  return {
    ...profile,
    average_rating: averageRating,
    reviews_count: reviews.length,
    products_count: products.length,
  };
}
