import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';
import { useWishlist } from '../../cart/WishlistProvider';
import { useTranslation } from '../../localization/LanguageProvider';
import {
  fetchProductById,
  fetchSellerProfile,
  fetchProductReviews,
  createProductReview
} from '../../services/marketplace';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { getCategoryIcon } from './ShopPage';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { user, profile: currentUserProfile, role } = useAuth();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, lang } = useTranslation();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [prodData, reviewsData] = await Promise.all([
          fetchProductById(productId),
          fetchProductReviews(productId)
        ]);
        setProduct(prodData);
        setReviews(reviewsData);
        
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (user.id === product.seller_id) {
      setReviewError(t('errorOwnProductReview'));
      return;
    }

    if (role !== 'buyer') {
      setReviewError(t('errorOnlyBuyersReview') || 'Только покупатели могут оставлять отзывы');
      return;
    }

    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const newReview = await createProductReview({
        productId,
        buyerId: user.id,
        buyerName: currentUserProfile?.full_name || user.email,
        rating,
        text: reviewText
      });
      setReviewText('');
      setRating(5);
      setReviewSuccess(t('productReviewSuccess'));
      setReviews((current) => [newReview, ...current]);
    } catch (err) {
      setReviewError(err.message ?? t('error'));
    } finally {
      setSubmittingReview(false);
    }
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

  // Aggregate product rating
  const totalProductRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageProductRating = reviews.length > 0 ? totalProductRating / reviews.length : 0;

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
            
            {/* Review Stars summary */}
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span style={{ color: '#f59e0b', fontSize: '16px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(averageProductRating) ? '★' : '☆'}</span>
                  ))}
                </span>
                <strong>{averageProductRating.toFixed(1)}</strong>
                <span>({reviews.length} {t('reviewsCount')})</span>
              </div>
            )}
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
                  <button
                    type="button"
                    className={`product-detail-heart-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product)}
                    aria-label="Toggle Wishlist"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
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

      {/* Product Reviews Section */}
      <div className="card" style={{ marginTop: '24px', padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 24px 0' }}>
          {t('productReviewsTitle')} ({reviews.length})
        </h2>

        <div className="product-reviews-grid">
          {/* Left Column: Review Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {role === 'buyer' && user?.id !== product.seller_id ? (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>
                  {t('addProductReviewTitle')}
                </h3>

                {/* Rating Selector */}
                <div>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {t('ratingLabel')}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          color: star <= rating ? '#f59e0b' : '#d1d5db',
                          fontSize: '24px',
                          transform: 'none !important'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Area */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('textLabel')}</span>
                  <textarea
                    rows="4"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t('reviewPlaceholder') || 'Напишите ваш отзыв...'}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </label>

                {reviewSuccess && <p className="success-message" style={{ margin: '0', padding: '10px 14px' }}>{reviewSuccess}</p>}
                {reviewError && <p className="error" style={{ margin: '0', padding: '10px 14px' }}>{reviewError}</p>}

                <button type="submit" disabled={submittingReview} style={{ width: '100%', padding: '12px' }}>
                  {submittingReview ? t('loading') : t('submitReview')}
                </button>
              </form>
            ) : (
              <p className="muted" style={{ fontSize: '14px', margin: '0' }}>
                {user?.id === product.seller_id ? t('errorOwnProductReview') : t('errorOnlyBuyersReview') || 'Только покупатели могут оставлять отзывы'}
              </p>
            )}
          </div>

          {/* Right Column: Reviews List */}
          <div>
            {!reviews.length ? (
              <p className="muted" style={{ padding: '24px 0', margin: '0', textAlign: 'center' }}>
                {t('noProductReviewsYet')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px' }}>{review.buyer_name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(review.created_at).toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div style={{ color: '#f59e0b', fontSize: '13px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>

                    <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
