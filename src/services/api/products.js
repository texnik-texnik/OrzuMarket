import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  DEMO_PRODUCTS_KEY,
  DEMO_USERS_KEY,
  seedProducts,
  seedUsers,
  readJson,
  writeJson,
  fileToDataUrl
} from './demoStore';

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

function getFileExtension(file) {
  const fromName = file?.name?.split('.').pop();
  if (fromName) return fromName.toLowerCase();
  const fromType = file?.type?.split('/').pop();
  return fromType || 'jpg';
}

async function uploadProductPhoto({ sellerId, photoFile }) {
  if (!photoFile) return '';
  if (!isSupabaseConfigured) return fileToDataUrl(photoFile);

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
    let products = readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((product) => product.is_active && (product.moderation_status === 'approved' || !product.moderation_status));
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

  try {
    let query = supabase
      .from('products')
      .select(`
        id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category, moderation_status,
        seller:profiles!products_seller_id_fkey ( id, email, full_name )
      `)
      .eq('is_active', true)
      .eq('moderation_status', 'approved');

    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    if (minPrice !== '') query = query.gte('price', Number(minPrice));
    if (maxPrice !== '') query = query.lte('price', Number(maxPrice));
    if (category) query = query.eq('category', category);

    const [column, direction] = sort.split('.');
    query = query.order(column, { ascending: direction !== 'desc' });

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn('fetchActiveProducts with moderation_status failed. Retrying query without moderation check.', error.message);
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

    const { data, error: retryError } = await query;
    if (retryError) throw retryError;
    return (data ?? []).map((p) => ({ ...p, moderation_status: 'approved' }));
  }
}

export async function fetchProductById(productId) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Товар не найден');
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    const seller = users.find((u) => u.id === product.seller_id) ?? { full_name: 'Demo Seller', id: product.seller_id };
    return {
      ...product,
      seller,
    };
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category,
      seller:profiles!products_seller_id_fkey ( id, email, full_name )
    `)
    .eq('id', productId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Товар не найден');
  return data;
}

export async function fetchSellerProducts(sellerId) {
  if (!isSupabaseConfigured) {
    return readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((product) => product.seller_id === sellerId || sellerId === 'demo-seller');
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category, moderation_status')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn('fetchSellerProducts failed on moderation_status. Retrying without it.', error.message);
    const { data, error: retryError } = await supabase
      .from('products')
      .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (retryError) throw retryError;
    return (data ?? []).map((p) => ({ ...p, moderation_status: 'approved' }));
  }
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
      moderation_status: 'pending',
      category,
      created_at: new Date().toISOString(),
    };
    writeJson(DEMO_PRODUCTS_KEY, [product, ...products]);
    return product;
  }

  try {
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
        moderation_status: 'pending',
      })
      .select('id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category, moderation_status')
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('row-level security')) {
      throw new Error('Ошибка прав доступа (RLS): Убедитесь, что в Supabase Console добавлена политика разрешения вставки (INSERT) для продавцов.');
    }

    const { data, error: retryError } = await supabase
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

    if (retryError) throw retryError;
    return { ...data, category: category || 'other', moderation_status: 'approved' };
  }
}

export async function updateSellerProduct({ productId, sellerId, name, price, description, photoFile, stock, category }) {
  let photoUrl = null;
  if (photoFile) {
    try {
      photoUrl = await uploadProductPhoto({ sellerId, photoFile });
    } catch (err) {
      throw new Error('Ошибка хранилища: ' + (err.message ?? err));
    }
  }

  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          name: name ?? p.name,
          price: price !== undefined ? Number(price) : p.price,
          description: description ?? p.description,
          stock: stock !== undefined ? Number(stock) : p.stock,
          category: category ?? p.category,
          photo_url: photoUrl ?? p.photo_url,
        };
      }
      return p;
    });
    writeJson(DEMO_PRODUCTS_KEY, updated);
    return updated.find((p) => p.id === productId);
  }

  const updates = {
    name,
    price: Number(price),
    description,
    stock: Number(stock) || 0,
    category,
  };
  if (photoUrl) updates.photo_url = photoUrl;

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSellerProduct(productId) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts).filter((p) => p.id !== productId);
    writeJson(DEMO_PRODUCTS_KEY, products);
    return true;
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return true;
}

export async function fetchAdminProducts() {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const users = readJson(DEMO_USERS_KEY, seedUsers);
    return products.map((product) => ({
      ...product,
      seller: users.find((user) => user.id === product.seller_id) ?? { full_name: 'Demo Seller', email: 'seller@demo.test' },
      moderation_status: product.moderation_status || 'approved',
    }));
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category, moderation_status,
        seller:profiles!products_seller_id_fkey ( id, email, full_name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    const { data, error: retryError } = await supabase
      .from('products')
      .select(`
        id, seller_id, name, description, price, stock, is_active, photo_url, created_at, category,
        seller:profiles!products_seller_id_fkey ( id, email, full_name )
      `)
      .order('created_at', { ascending: false });

    if (retryError) throw retryError;
    return (data ?? []).map((p) => ({ ...p, moderation_status: 'approved' }));
  }
}

export async function updateProductVisibility({ productId, is_active }) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts).map((product) =>
      product.id === productId ? { ...product, is_active } : product
    );
    writeJson(DEMO_PRODUCTS_KEY, products);
    return products.find((product) => product.id === productId);
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active })
    .eq('id', productId)
    .select('id, is_active')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProductModerationStatus({ productId, moderation_status }) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts).map((product) =>
      product.id === productId ? { ...product, moderation_status } : product
    );
    writeJson(DEMO_PRODUCTS_KEY, products);
    return products.find((product) => product.id === productId);
  }

  const { data, error } = await supabase
    .from('products')
    .update({ moderation_status })
    .eq('id', productId)
    .select('id, moderation_status')
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Backward compatibility alias exports
export const deleteProduct = deleteSellerProduct;
export const setProductActive = (productId, is_active) => updateProductVisibility({ productId, is_active });
export const updateProductModeration = (productId, moderation_status) => updateProductModerationStatus({ productId, moderation_status });
