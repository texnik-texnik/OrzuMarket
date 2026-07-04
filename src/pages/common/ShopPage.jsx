import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useCart } from '../../cart/CartProvider';
import { fetchActiveProducts } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function ShopPage() {
  const { addItem, totalQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ search: '', minPrice: '', maxPrice: '', sort: 'created_at.desc' });
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
          <button type="button" className="secondary" onClick={() => setFilters({ search: '', minPrice: '', maxPrice: '', sort: 'created_at.desc' })}>
            {t('resetFilters')}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <div className="screen-center compact">{t('loadingProducts')}</div>}

      {!loading && !products.length && (
        <section className="card empty-state">{t('noProductsFound')}</section>
      )}

      <div className="products-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <ProductImageWithFallback src={product.photo_url} alt={product.name} />
            <div className="product-body">
              <div className="product-title-row">
                <h3>{product.name}</h3>
                <strong>{Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</strong>
              </div>
              <p>{product.description || t('noDescription')}</p>
              <div className="muted">{t('inStock')}: {product.stock}</div>
              <button type="button" disabled={product.stock < 1} onClick={() => handleAdd(product)}>
                {addedId === product.id ? t('addedSuccess') : t('addToCart')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
