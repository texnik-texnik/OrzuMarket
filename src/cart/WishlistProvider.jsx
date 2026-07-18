import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WISHLIST_KEY = 'marketplace_wishlist_v1';
const WishlistContext = createContext(null);

function readWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(readWishlist);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const exists = current.some((item) => item.id === product.id);
      if (exists) {
        return current.filter((item) => item.id !== product.id);
      } else {
        return [...current, product];
      }
    });
  };

  const clearWishlist = () => setWishlist([]);

  const value = useMemo(() => {
    return {
      wishlist,
      wishlistCount: wishlist.length,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    };
  }, [wishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
}
