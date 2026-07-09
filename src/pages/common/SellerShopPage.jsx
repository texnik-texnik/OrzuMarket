import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';
import { useTranslation } from '../../localization/LanguageProvider';
import {
  fetchSellerProfile,
  fetchSellerReviews,
  fetchSellerProducts,
  createSellerReview
} from '../../services/marketplace';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { getCategoryIcon } from './ShopPage';

export function SellerShopPage() {
  const { sellerId } = useParams();
  const { user, profile: currentUserProfile, role } = useAuth();
  const { addItem } = useCart();
  const { t, lang } = useTranslation();

  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab: 'products' or 'reviews'
  const [activeTab, setActiveTab] = useState('products');

  // Review Form States
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Cart animation state
  const [addedId, setAddedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, productsData, reviewsData] = await Promise.all([
        fetchSellerProfile(sellerId),
        fetchSellerProducts(sellerId),
        fetchSellerReviews(sellerId)
      ]);
      setSellerProfile(profileData);
      setProducts(productsData.filter(p => p.is_active));
      setReviews(reviewsData);
    } catch (err) {
      setError(err.message ?? t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const handleAdd = (product) => {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (user.id === sellerId) {
      setReviewError(t('errorOwnReview'));
      return;
    }

    if (role !== 'buyer') {
      setReviewError(t('errorOnlyBuyersReview'));
      return;
    }

    if (!reviewText.trim()) {
      return;
    }

    setSubmittingReview(true);
    try {
      await createSellerReview({
        sellerId,
        buyerId: user.id,
        buyerName: currentUserProfile?.full_name || user.email,
        rating,
        text: reviewText
      });
      setReviewText('');
      setRating(5);
      setReviewSuccess(t('successAddReview'));
      
      // Reload profile & reviews to update rating metrics
      const [updatedProfile, updatedReviews] = await Promise.all([
        fetchSellerProfile(sellerId),
        fetchSellerReviews(sellerId)
      ]);
      setSellerProfile(updatedProfile);
      setReviews(updatedReviews);
    } catch (err) {
      setReviewError(err.message ?? t('error'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="loading-state"><p className="muted">{t('loading')}</p></div>;
  }

  if (error) {
    return (
      <div className="card text-center" style={{ padding: '40px' }}>
        <p className="error">{error}</p>
        <Link className="button-link" to="/shop" style={{ marginTop: '20px' }}>{t('backToShop')}</Link>
      </div>
    );
  }

  const renderStars = (score) => {
    const filled = Math.round(score);
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < filled ? '#f59e0b' : '#d1d5db', fontSize: '18px' }}>
        ★
      </span>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Back button */}
      <div>
        <Link className="button-link secondary-link" to="/shop" style={{ padding: '8px 16px', gap: '4px' }}>
          ← {t('backToShop')}
        </Link>
      </div>

      {/* Profile Header Asymmetric Section */}
      <div className="profile-grid">
        {/* Left Side: Seller Info Block */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '24px',
              textTransform: 'uppercase'
            }}>
              {(sellerProfile?.full_name || sellerProfile?.email || '?').charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>
                {sellerProfile?.full_name || sellerProfile?.email}
              </h2>
              <span className="pill small">{t('tableHeaderSeller')}</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '4px 0' }} />

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('overallRating')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>
                  {sellerProfile?.average_rating ? sellerProfile.average_rating.toFixed(1) : '0.0'}
                </strong>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {renderStars(sellerProfile?.average_rating || 0)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('reviewsTab')}</span>
              <strong style={{ fontSize: '20px', marginTop: '4px' }}>
                {sellerProfile?.reviews_count || 0}
              </strong>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '4px 0' }} />

          {/* Contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            {sellerProfile?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="muted" style={{ width: '45px' }}>Email:</span>
                <strong>{sellerProfile.email}</strong>
              </div>
            )}
            {sellerProfile?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="muted" style={{ width: '45px' }}>{t('phoneLabelDl') || 'Тел'}:</span>
                <strong>{sellerProfile.phone}</strong>
              </div>
            )}
          </div>

          {/* Add review form - Rendered in Left Side for compact visual structure */}
          {role === 'buyer' && user?.id !== sellerId && (
            <form onSubmit={handleReviewSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>
                {t('addReviewTitle')}
              </h3>

              {/* Star selector */}
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
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

              {/* Review Text */}
              <label style={{ gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('textLabel')}</span>
                <textarea
                  rows="3"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('reviewPlaceholder')}
                  required
                  style={{ resize: 'vertical' }}
                />
              </label>

              {reviewSuccess && <p className="success-message" style={{ margin: '0', padding: '10px 14px' }}>{reviewSuccess}</p>}
              {reviewError && <p className="error" style={{ margin: '0', padding: '10px 14px' }}>{reviewError}</p>}

              <button type="submit" disabled={submittingReview} style={{ width: '100%', padding: '10px' }}>
                {submittingReview ? t('loading') : t('submitReview')}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Tab content (Products / Reviews) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Tabs header */}
          <div className="subnav" style={{ margin: '0' }}>
            <button
              type="button"
              className={`lang-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
              style={{ padding: '8px 24px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
            >
              {t('productsTab')} ({products.length})
            </button>
            <button
              type="button"
              className={`lang-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
              style={{ padding: '8px 24px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
            >
              {t('reviewsTab')} ({reviews.length})
            </button>
          </div>

          {/* Products Grid tab */}
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <div className="card text-center" style={{ padding: '48px 24px' }}>
                  <p className="muted">{t('noProductsFound')}</p>
                </div>
              ) : (
                <div className="products-grid">
                  {products.map((product) => (
                    <article className="product-card" key={product.id}>
                      <ProductImageWithFallback src={product.photo_url} alt={product.name} />
                      <div className="product-body">
                        <div className="product-title-row">
                          <h3>{product.name}</h3>
                          <strong>
                            {Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews list tab */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.length === 0 ? (
                <div className="card text-center" style={{ padding: '48px 24px' }}>
                  <p className="muted">{t('noOrders') || 'Отзывов пока нет'}</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div className="card" key={review.id} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{review.buyer_name}</strong>
                        <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
                          {new Date(review.created_at).toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {review.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
