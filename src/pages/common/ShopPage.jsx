import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useCart } from '../../cart/CartProvider';
import { fetchActiveProducts, PRODUCT_CATEGORIES } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { ProductCardSkeleton } from '../../components/SkeletonLoaders';

export function getCategoryIcon(cat) {
  switch (cat) {
    case 'electronics': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    );
    case 'clothing': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M20.38 3.46L16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l1.08 11.75a2 2 0 0 0 2 1.81h13.28a2 2 0 0 0 2-1.81l1.08-11.75a2 2 0 0 0-1.34-2.23z"></path>
      </svg>
    );
    case 'home': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    );
    case 'beauty': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
    );
    case 'books': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    );
    case 'sports': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M6 12A6 6 0 0 1 18 12"></path>
        <path d="M12 6A6 6 0 0 1 12 18"></path>
      </svg>
    );
    case 'groceries': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2v4M12 18v4"></path>
      </svg>
    );
    case 'other': return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      </svg>
    );
    default: return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      </svg>
    );
  }
}

export function ShopPage() {
  const { addItem, totalQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ search: '', minPrice: '', maxPrice: '', sort: 'created_at.desc', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedId, setAddedId] = useState(null);
  const { t, lang } = useTranslation();

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await fetchActiveProducts(filters));
    } catch (err) {
      setError(err.message ?? t('errorLoadProducts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const hasFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const handleAdd = (product) => {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{t('marketplaceTitle')}</h1>
          <p>{t('marketplaceSub')}</p>
        </div>
        <Link className="button-link" to="/checkout">{t('cart')} · {totalQuantity}</Link>
      </div>

      {/* Category Chips */}
      <div className="categories-tabs">
        <button
          type="button"
          className={`category-tab ${!filters.category ? 'active' : ''}`}
          onClick={() => setFilters((value) => ({ ...value, category: '' }))}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          {t('categoryAll')}
        </button>
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-tab ${filters.category === cat ? 'active' : ''}`}
            onClick={() => setFilters((value) => ({ ...value, category: cat }))}
          >
            {getCategoryIcon(cat)}
            <span>{t(`category_${cat}`)}</span>
          </button>
        ))}
      </div>

      <div className="card filters-card">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))}
        />
        <input
          type="number"
          min="0"
          placeholder={t('priceFromPlaceholder')}
          value={filters.minPrice}
          onChange={(event) => setFilters((value) => ({ ...value, minPrice: event.target.value }))}
        />
        <input
          type="number"
          min="0"
          placeholder={t('priceToPlaceholder')}
          value={filters.maxPrice}
          onChange={(event) => setFilters((value) => ({ ...value, maxPrice: event.target.value }))}
        />
        <select
          value={filters.sort}
          onChange={(event) => setFilters((value) => ({ ...value, sort: event.target.value }))}
        >
          <option value="created_at.desc">{t('sortNewest')}</option>
          <option value="price.asc">{t('sortCheapest')}</option>
          <option value="price.desc">{t('sortExpensive')}</option>
          <option value="name.asc">{t('sortByName')}</option>
        </select>
        {hasFilters && (
          <button type="button" className="secondary" onClick={() => setFilters({ search: '', minPrice: '', maxPrice: '', sort: 'created_at.desc', category: '' })}>
            {t('resetFilters')}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && !products.length && (
        <section className="card empty-state">{t('noProductsFound')}</section>
      )}

      <div className="products-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))
        ) : (
          products.map((product) => (
            <article className="product-card" key={product.id}>
              <Link to={`/product/${product.id}`} className="product-image-link" style={{ display: 'block', overflow: 'hidden' }}>
                <ProductImageWithFallback src={product.photo_url} alt={product.name} />
              </Link>
              <div className="product-body">
                <div className="product-title-row">
                  <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ margin: 0 }}>{product.name}</h3>
                  </Link>
                  <strong style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
                  </strong>
                </div>
                <p>{product.description || t('noDescription')}</p>
                <div style={{ marginBottom: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="text-muted">{t('seller')}:</span>
                  <Link to={`/seller-shop/${product.seller_id}`} style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'underline' }}>
                    {product.seller?.full_name || product.seller?.email || t('seller')}
                  </Link>
                </div>
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
          ))
        )}
      </div>
    </section>
  );
}
