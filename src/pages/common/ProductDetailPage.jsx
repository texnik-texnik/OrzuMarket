import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../../cart/CartProvider';
import { useTranslation } from '../../localization/LanguageProvider';
import { fetchProductById, fetchSellerProfile } from '../../services/marketplace';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { getCategoryIcon } from './ShopPage';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { addItem } = useCart();
  const { t, lang } = useTranslation();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const prodData = await fetchProductById(productId);
        setProduct(prodData);
        
        // Also fetch enriched seller metrics (rating, review counts)
        if (prodData.seller_id) {
          const sellerData = await fetchSellerProfile(prodData.seller_id);
          setSeller(sellerData);
        }
      } catch (err) {
        setError(err.message ?? t('noProductFound'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, t]);

  const handleQuantityChange = (change) => {
    const nextQuantity = quantity + change;
    if (nextQuantity >= 1 && nextQuantity <= (product?.stock ?? 1)) {
      setQuantity(nextQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock < 1) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  if (loading) {
    return (
      <div className="product-detail-layout">
        <div className="back-btn-container">
          <div className="back-btn-link skeleton" style={{ width: '150px', height: '38px', borderRadius: 'var(--radius-sm)' }}></div>
        </div>
        <div className="product-detail-grid">
          <div className="product-detail-media skeleton" style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-xl)', height: '400px' }}></div>
          <div className="product-detail-info" style={{ gap: '16px' }}>
            <div className="skeleton" style={{ width: '70%', height: '40px', borderRadius: 'var(--radius-sm)' }}></div>
            <div className="skeleton" style={{ width: '30%', height: '24px', borderRadius: 'var(--radius-sm)' }}></div>
            <div className="skeleton" style={{ width: '40%', height: '48px', borderRadius: 'var(--radius-md)' }}></div>
            <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-md)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-layout" style={{ alignItems: 'center', padding: '60px 0' }}>
        <p className="error" style={{ fontSize: '18px', padding: '16px 24px' }}>{error || t('noProductFound')}</p>
        <Link to="/shop" className="back-btn-link">⬅ {t('backToShop')}</Link>
      </div>
    );
  }

  const formattedPrice = Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU');
  const hasStock = product.stock > 0;

  return (
    <div className="product-detail-layout">
      {/* Back button */}
      <div className="back-btn-container">
        <Link to="/shop" className="back-btn-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('backToShop')}
        </Link>
      </div>

      <div className="product-detail-grid">
        {/* Left Side: Product Image */}
        <div className="product-detail-media">
          <ProductImageWithFallback src={product.photo_url} alt={product.name} />
        </div>

        {/* Right Side: Product Info & Actions */}
        <div className="product-detail-info">
          {/* Header */}
          <div className="product-detail-header">
            <div className="product-detail-meta" style={{ marginBottom: '8px' }}>
              <span className="category-badge">
                {getCategoryIcon(product.category)} {t(`category_${product.category || 'other'}`)}
              </span>
              <div className="product-stock-status">
                {hasStock ? (
                  <span className="stock-tag in-stock">{t('inStock')}: {product.stock}</span>
                ) : (
                  <span className="stock-tag out-of-stock">{t('outOfStock') || 'Нет в наличии'}</span>
                )}
              </div>
            </div>
            <h1>{product.name}</h1>
          </div>

          {/* Price */}
          <div className="product-detail-price-section">
            <strong className="product-detail-price">{formattedPrice} {t('currency')}</strong>
          </div>

          {/* Add to Cart Actions */}
          {hasStock && (
            <div className="product-detail-section" style={{ borderTop: 'none', paddingTop: '0' }}>
              <div className="product-purchase-controls">
                <div className="quantity-selector-wrap">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    className="quantity-input"
                    value={quantity}
                    readOnly
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>

                <div className="action-buttons-wrap">
                  <button
                    type="button"
                    className="add-to-cart-large-btn"
                    onClick={handleAddToCart}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    {added ? t('addedSuccess') : t('addToCart')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="product-detail-section">
            <h2>{t('productDescriptionTitle')}</h2>
            <p>{product.description || t('noDescription')}</p>
          </div>

          {/* Seller Card */}
          {seller && (
            <div className="seller-info-block">
              <h2 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0', color: 'var(--text-muted)' }}>
                {t('sellerInfoTitle')}
              </h2>
              <div className="seller-info-main">
                <div className="seller-info-details">
                  <h3>{seller.full_name || seller.email}</h3>
                  <div className="seller-rating-wrap">
                    <span className="seller-rating-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < Math.round(seller.average_rating || 0) ? '★' : '☆'}</span>
                      ))}
                    </span>
                    <span>
                      {seller.average_rating ? seller.average_rating.toFixed(1) : '0.0'} ({seller.reviews_count} {t('reviewsCount')})
                    </span>
                  </div>
                </div>
                <Link to={`/seller-shop/${product.seller_id}`} className="seller-view-shop-btn">
                  {t('sellerProfileLink') || 'В магазин продавца'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
