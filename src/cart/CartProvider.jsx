import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'marketplace_cart_v1';
const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    photo_url: product.photo_url ?? '',
    stock: product.stock ?? 0,
    seller_id: product.seller_id,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    const normalized = normalizeProduct(product);
    setItems((current) => {
      const existing = current.find((item) => item.id === normalized.id);
      if (!existing) return [...current, { ...normalized, quantity }];

      return current.map((item) => (
        item.id === normalized.id
          ? { ...item, quantity: Math.min((item.stock || 9999), item.quantity + quantity) }
          : item
      ));
    });
  };

  const setQuantity = (productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setItems((current) => current.map((item) => (
      item.id === productId ? { ...item, quantity: Math.min(item.stock || 9999, safeQuantity) } : item
    )));
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);

    return {
      items,
      totalQuantity,
      totalAmount,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
