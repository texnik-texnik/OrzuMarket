import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { fetchWithCache, invalidateCache } from '../../lib/cache';
import {
  DEMO_USERS_KEY,
  DEMO_PRODUCTS_KEY,
  seedUsers,
  seedProducts,
  readJson,
  writeJson,
  fileToDataUrl
} from './demoStore';

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

const DEMO_PRODUCT_REVIEWS_KEY = 'orzu_demo_product_reviews_v1';
const seedProductReviews = [
  {
    id: 'demo-p-review-1',
    product_id: 'demo-product-1',
    buyer_id: 'demo-buyer',
    buyer_name: 'Алишер Содиқов',
    rating: 5,
    text: 'Отличный телефон! Очень шустрый и батарею держит долго.',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'demo-p-review-2',
    product_id: 'demo-product-1',
    buyer_id: 'demo-buyer-2',
    buyer_name: 'Мадина Воҳидова',
    rating: 4,
    text: 'Камера хорошая, но звук мог быть громче. В целом довольна.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

function getFileExtension(file) {
  const fromName = file?.name?.split('.').pop();
  if (fromName) return fromName.toLowerCase();
  const fromType = file?.type?.split('/').pop();
  return fromType || 'jpg';
}

export async function fetchAdminUsers() {
  return fetchWithCache('admin_users', () => uncachedFetchAdminUsers());
}

async function uncachedFetchAdminUsers() {
  if (!isSupabaseConfigured) return readJson(DEMO_USERS_KEY, seedUsers);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, is_blocked, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(userId, role) {
  invalidateCache('admin_users');
  invalidateCache('profile');
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
  invalidateCache('admin_users');
  invalidateCache('profile');
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
  if (!isSupabaseConfigured) return fileToDataUrl(photoFile);

  const extension = getFileExtension(photoFile);
  const filePath = `${userId}.${extension}`;

  // Пробуем сначала бакет 'avatars', а при отсутствии — 'product-photos'
  let bucketName = 'avatars';
  let { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, photoFile, {
      cacheControl: '3600',
      upsert: true,
      contentType: photoFile.type || 'image/jpeg',
    });

  if (uploadError) {
    bucketName = 'product-photos';
    const fallbackResult = await supabase.storage
      .from(bucketName)
      .upload(`avatars/${filePath}`, photoFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: photoFile.type || 'image/jpeg',
      });
    
    if (fallbackResult.error) {
      uploadError = fallbackResult.error;
    } else {
      uploadError = null;
    }
  }

  if (uploadError) {
    const msg = uploadError.message || '';
    if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level security')) {
      throw new Error(
        'Ошибка прав доступа Supabase Storage (RLS): Пожалуйста, выполните SQL-команду создания политик для Storage из файла supabase_setup.sql в Supabase SQL Editor.'
      );
    }
    throw new Error('Не удалось загрузить аватар: ' + msg);
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(bucketName === 'product-photos' ? `avatars/${filePath}` : filePath);

  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateUserProfile({ userId, fullName, phone, photoFile }) {
  invalidateCache('profile');
  invalidateCache('admin_users');
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
      if (avatarUrl) savedAuth.profile.avatar_url = avatarUrl;
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(savedAuth));
    }
    return { id: userId, full_name: fullName, phone, avatar_url: avatarUrl };
  }

  const updateFields = { full_name: fullName, phone };
  if (avatarUrl) updateFields.avatar_url = avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', userId)
    .select('id, email, full_name, role, phone, is_blocked, avatar_url')
    .maybeSingle();

  if (error) {
    if (error.message && (error.message.includes('avatar_url') || error.code === '42703')) {
      throw new Error(
        'В вашей таблице "profiles" в Supabase отсутствует колонка "avatar_url". Пожалуйста, выполните в Supabase SQL Editor команду: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
      );
    }
    throw error;
  }
  return data;
}

export async function fetchProductReviews(productId) {
  if (!isSupabaseConfigured) {
    const reviews = readJson(DEMO_PRODUCT_REVIEWS_KEY, seedProductReviews);
    return reviews.filter((r) => r.product_id === productId);
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, product_id, buyer_id, buyer_name, rating, text, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createProductReview({ productId, buyerId, buyerName, rating, text }) {
  const newReview = {
    id: isSupabaseConfigured ? undefined : crypto.randomUUID(),
    product_id: productId,
    buyer_id: buyerId,
    buyer_name: buyerName,
    rating: Number(rating),
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  try {
    if (!isSupabaseConfigured) throw new Error('Demo mode');
    const { data, error } = await supabase
      .from('product_reviews')
      .insert(newReview)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    const reviews = readJson(DEMO_PRODUCT_REVIEWS_KEY, seedProductReviews);
    const updated = [newReview, ...reviews];
    writeJson(DEMO_PRODUCT_REVIEWS_KEY, updated);
    return newReview;
  }
}

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
      profile = { id: sellerId, full_name: 'Seller', email: 'seller@example.com' };
    } else {
      profile = data;
    }
  }

  const reviews = await fetchSellerReviews(sellerId);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

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
