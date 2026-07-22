import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  DEMO_PRODUCTS_KEY,
  DEMO_ORDERS_KEY,
  DEMO_USERS_KEY,
  seedProducts,
  seedUsers,
  readJson,
  writeJson
} from './demoStore';

const DEMO_DISPUTES_KEY = 'orzu_demo_disputes_v1';
const seedDisputes = [];

export async function createDispute({ orderId, buyerId, reason, message }) {
  const newDispute = {
    id: isSupabaseConfigured ? undefined : crypto.randomUUID(),
    order_id: orderId,
    buyer_id: buyerId,
    reason,
    message,
    status: 'open',
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured) {
    const disputes = readJson(DEMO_DISPUTES_KEY, seedDisputes);
    writeJson(DEMO_DISPUTES_KEY, [newDispute, ...disputes]);
    return newDispute;
  }

  const { data, error } = await supabase
    .from('disputes')
    .insert(newDispute)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDisputes(filters = {}) {
  if (!isSupabaseConfigured) {
    let disputes = readJson(DEMO_DISPUTES_KEY, seedDisputes);
    const orders = readJson(DEMO_ORDERS_KEY, []);
    const products = readJson(DEMO_PRODUCTS_KEY, seedProducts);
    const users = readJson(DEMO_USERS_KEY, seedUsers);

    let enriched = disputes.map((d) => {
      const order = orders.find((o) => o.id === d.order_id) || {};
      const product = products.find((p) => p.id === order.product_id) || {};
      const buyer = users.find((u) => u.id === d.buyer_id) || {};
      const seller = users.find((u) => u.id === order.seller_id) || {};

      return {
        ...d,
        order: {
          ...order,
          products: product,
          buyer,
          seller
        }
      };
    });

    if (filters.buyerId) enriched = enriched.filter((d) => d.buyer_id === filters.buyerId);
    if (filters.sellerId) enriched = enriched.filter((d) => d.order?.seller_id === filters.sellerId);
    return enriched;
  }

  try {
    let query = supabase
      .from('disputes')
      .select(`
        id, order_id, buyer_id, reason, message, status, created_at,
        order:orders (
          id, quantity, total, status, created_at, unit_price,
          products:products ( id, name, photo_url ),
          buyer:profiles!orders_buyer_id_fkey ( id, email, full_name ),
          seller:profiles!orders_seller_id_fkey ( id, email, full_name )
        )
      `);

    if (filters.buyerId) query = query.eq('buyer_id', filters.buyerId);
    if (filters.sellerId) {
      query = query.eq('order.seller_id', filters.sellerId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn('fetchDisputes failed. Resolving with empty array.', error.message);
    return [];
  }
}

export async function resolveDispute(disputeId, resolutionStatus, orderId) {
  if (!isSupabaseConfigured) {
    const disputes = readJson(DEMO_DISPUTES_KEY, seedDisputes);
    const updatedDisputes = disputes.map((d) => d.id === disputeId ? { ...d, status: resolutionStatus } : d);
    writeJson(DEMO_DISPUTES_KEY, updatedDisputes);

    const orders = readJson(DEMO_ORDERS_KEY, []);
    const nextOrderStatus = resolutionStatus === 'resolved_buyer' ? 'cancelled' : 'completed';
    const updatedOrders = orders.map((o) => o.id === orderId ? { ...o, status: nextOrderStatus } : o);
    writeJson(DEMO_ORDERS_KEY, updatedOrders);
    return;
  }

  const { error: disputeError } = await supabase
    .from('disputes')
    .update({ status: resolutionStatus })
    .eq('id', disputeId);

  if (disputeError) throw disputeError;

  const nextOrderStatus = resolutionStatus === 'resolved_buyer' ? 'cancelled' : 'completed';
  const { error: orderError } = await supabase
    .from('orders')
    .update({ status: nextOrderStatus })
    .eq('id', orderId);

  if (orderError) throw orderError;
}
