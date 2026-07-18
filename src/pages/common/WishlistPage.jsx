import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../cart/WishlistProvider';
import { useCart } from '../../cart/CartProvider';
import { useTranslation } from '../../localization/LanguageProvider';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { getCategoryIcon } from './ShopPage';

export function WishlistPage() {
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { t, lang } = useTranslation();
  const [addedId, setAddedId] = useState(null);

  const handleAdd = (product) => {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{t('wishlistTitle')}</h1>
        </div>
      </div>

      {!wishlist.length ? (
        <div className="card text-center" style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '48px', color: 'var(--text-muted)', opacity: '0.4' }}>❤️</div>
          <p className="muted" style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>{t('wishlistEmpty')}</p>
          <Link to="/shop" className="button" style={{ marginTop: '8px' }}>
            {t('shop')}
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlist.map((product) => {
            const isFav = isInWishlist(product.id);
            const formattedPrice = Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU');

            return (
              <article className="product-card" key={product.id} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="product-image-container">
                  <Link to={`/product/${product.id}`} className="product-image-link" style={{ display: 'block', height: '100%' }}>
                    <ProductImageWithFallback src={product.photo_url} alt={product.name} />
                  </Link>
                  <button
                    type="button"
                    className={`wishlist-toggle-btn ${isFav ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product)}
                    aria-label="Toggle Wishlist"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
                <div className="product-body">
                  <div className="product-title-row">
                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ margin: 0 }}>{product.name}</h3>
                    </Link>
                    <strong style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {formattedPrice} {t('currency')}
                    </strong>
                  </div>
                  <p>{product.description || t('noDescription')}</p>
                  <div className="product-meta-row">
                    <span className="category-badge">
                      {getCategoryIcon(product.category)} {t(`category_${product.category || 'other'}`)}
                    </span>
                    <div className="muted">{t('inStock')}: {product.stock}</div>
                  </div>
                  <button type="button" disabled={product.stock < 1} onClick={() => handleAdd(product)}>
                    {addedId === product.id ? t('addedSuccess') : t('addToCart')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
