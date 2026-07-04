import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';
import { createOrdersFromCart } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { items, totalAmount, setQuantity, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { t, lang } = useTranslation();

  const handleCheckout = async () => {
    setError('');

    if (role !== 'buyer') {
      setError(t('checkoutErrorRole'));
      return;
    }

    setSubmitting(true);
    try {
      await createOrdersFromCart({ buyerId: user.id, items });
      clearCart();
      navigate('/profile?tab=orders', { replace: true });
    } catch (err) {
      setError(err.message ?? t('checkoutErrorFail'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{t('checkoutTitle')}</h1>
          <p>{t('checkoutNote')}</p>
        </div>
        <Link className="button-link secondary-link" to="/shop">{t('backToShop')}</Link>
      </div>

      {!items.length ? (
        <section className="card empty-state">
          {t('cartEmpty')} <Link to="/shop">{t('goToProducts')}</Link>
        </section>
      ) : (
        <section className="card">
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.id}>
                <ProductImageWithFallback src={item.photo_url} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted">
                    {Number(item.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {lang === 'tg' ? 'TJS' : '₽'} · stock: {item.stock}
                  </p>
                </div>
                <input
                  className="quantity-input"
                  type="number"
                  min="1"
                  max={item.stock || undefined}
                  value={item.quantity}
                  onChange={(event) => setQuantity(item.id, event.target.value)}
                />
                <strong>
                  {(item.quantity * item.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {lang === 'tg' ? 'TJS' : '₽'}
                </strong>
                <button type="button" className="danger" onClick={() => removeItem(item.id)}>{t('deleteBtn')}</button>
              </div>
            ))}
          </div>

          <div className="checkout-footer">
            <strong>{t('totalAmount')}: {totalAmount.toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {lang === 'tg' ? 'TJS' : '₽'}</strong>
            <button type="button" onClick={handleCheckout} disabled={submitting || !items.length}>
              {submitting ? t('placingOrder') : t('placeOrder')}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}
    </section>
  );
}
