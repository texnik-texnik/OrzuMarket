import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  DEMO_ORDERS_KEY,
  DEMO_PRODUCTS_KEY,
  seedProducts,
  readJson,
  writeJson
} from './demoStore';

export const orderStatusLabels = {
  new: 'Новый',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export async function createOrdersFromCart({ buyerId, items }) {
  if (!isSupabaseConfigured) {
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const orders = readJson(DEMO_ORDERS_KEY, []);

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        throw new Error(`Товар не найден в базе данных`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Недостаточно товара "${product.name}" на складе (доступно: ${product.stock})`);
      }
    }

    const updatedProducts = products.map((prod) => {
      const cartItem = items.find((item) => item.id === prod.id);
      if (cartItem) {
        return { ...prod, stock: prod.stock - cartItem.quantity };
      }
      return prod;
    });
    writeJson(DEMO_PRODUCTS_KEY, updatedProducts);

    const newOrders = items.map((item) => {
      const product = products.find((value) => value.id === item.id);
      const price = Number(product.price);
      return {
        id: crypto.randomUUID(),
        buyer_id: buyerId,
        product_id: item.id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        unit_price: price,
        total: item.quantity * price,
        status: 'new',
        created_at: new Date().toISOString(),
        products: { id: product.id, name: product.name, photo_url: product.photo_url },
      };
    });
    writeJson(DEMO_ORDERS_KEY, [...newOrders, ...orders]);
    return newOrders;
  }

  const productIds = items.map((item) => item.id);
  const { data: dbProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, price, stock, seller_id')
    .in('id', productIds);

  if (fetchError) throw fetchError;

  for (const item of items) {
    const dbProduct = dbProducts.find((p) => p.id === item.id);
    if (!dbProduct) {
      throw new Error(`Товар "${item.name}" не найден в базе данных`);
    }
    if (dbProduct.stock < item.quantity) {
      throw new Error(`Недостаточно товара "${dbProduct.name}" на складе (доступно: ${dbProduct.stock})`);
    }
  }

  const rows = items.map((item) => {
    const dbProduct = dbProducts.find((p) => p.id === item.id);
    return {
      buyer_id: buyerId,
      product_id: item.id,
      seller_id: dbProduct.seller_id,
      quantity: item.quantity,
      unit_price: dbProduct.price,
    };
  });

  const { data, error } = await supabase
    .from('orders')
    .insert(rows)
    .select('id, status, quantity, total, created_at');

  if (error) throw error;

  try {
    await Promise.all(
      items.map(async (item) => {
        const dbProduct = dbProducts.find((p) => p.id === item.id);
        if (dbProduct) {
          const newStock = Math.max(0, dbProduct.stock - item.quantity);
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
