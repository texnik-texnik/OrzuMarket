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

  // Step state: 1 = Cart list review, 2 = Payment simulation form
  const [step, setStep] = useState(1);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleCardNumberChange = (e) => {
    // Format card number: xxxx xxxx xxxx xxxx
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e) => {
    // Format expiry date: MM/YY
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(value.slice(0, 2) + '/' + value.slice(2));
    } else {
      setCardExpiry(value);
    }
  };

  const handleProceedToPayment = () => {
    setError('');
    if (role !== 'buyer') {
      setError(t('checkoutErrorRole'));
      return;
    }
    setStep(2);
  };

  const handlePaymentAndCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (cardNumber.replace(/\s/g, '').length < 16 && paymentMethod === 'card') {
      setError(t('errorInvalidCard') || 'Введите корректный номер карты (16 цифр)');
      return;
    }
    if (cardExpiry.length < 5 && paymentMethod === 'card') {
      setError(t('errorInvalidExpiry') || 'Введите срок действия карты (ММ/ГГ)');
      return;
    }
    if (cardCvc.length < 3 && paymentMethod === 'card') {
      setError(t('errorInvalidCvc') || 'Введите код CVC (3 цифры)');
      return;
    }

    setSubmitting(true);
    // Simulate payment processing delay (1.5 seconds)
    setTimeout(async () => {
      try {
        await createOrdersFromCart({ buyerId: user.id, items });
        setPaymentSuccess(true);
        clearCart();
        
        // Show success animation/feedback, then navigate
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 1500);
      } catch (err) {
        setError(err.message ?? t('checkoutErrorFail'));
        setSubmitting(false);
      }
    }, 1500);
  };

  return (
    <section style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-head">
        <div>
          <h1>{t('checkoutTitle')}</h1>
          <p>{step === 1 ? t('checkoutNote') : t('paymentMethodLabel')}</p>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => (step === 2 ? setStep(1) : navigate('/shop'))}
        >
          {step === 2 ? '⬅ ' + t('backToShop') : t('backToShop')}
        </button>
      </div>

      {!items.length && !paymentSuccess ? (
        <section className="card empty-state" style={{ padding: '48px', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '16px', marginBottom: '16px' }}>{t('cartEmpty')}</p>
          <Link to="/shop" className="button">
            {t('goToProducts')}
          </Link>
        </section>
      ) : paymentSuccess ? (
        <section className="card text-center" style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '56px', animation: 'scaleUp 0.4s ease-out' }}>✅</div>
          <h2 style={{ color: 'var(--success)', margin: '0' }}>{t('paymentSuccessToast')}</h2>
          <p className="muted" style={{ margin: '0' }}>
            {t('redirectingToProfile') || 'Перенаправление в личный кабинет...'}
          </p>
        </section>
      ) : step === 1 ? (
        /* STEP 1: CART ITEMS REVIEW */
        <section className="card" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <ProductImageWithFallback src={item.photo_url} alt={item.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{item.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                    {Number(item.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="quantity-input"
                    type="number"
                    min="1"
                    max={item.stock || undefined}
                    value={item.quantity}
                    onChange={(event) => setQuantity(item.id, event.target.value)}
                    style={{ width: '60px', padding: '6px', textAlign: 'center' }}
                  />
                  <strong>
                    {(item.quantity * item.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
                  </strong>
                  <button
                    type="button"
                    className="danger-text-btn"
                    onClick={() => removeItem(item.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', boxShadow: 'none', padding: '6px' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '2px solid var(--border-color)' }}>
            <strong style={{ fontSize: '18px' }}>
              {t('totalAmount')}: {totalAmount.toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
            </strong>
            <button type="button" onClick={handleProceedToPayment}>
              {t('placeOrder')} ➡
            </button>
          </div>
          {error && <p className="error" style={{ marginTop: '16px' }}>{error}</p>}
        </section>
      ) : (
        /* STEP 2: SIMULATED PAYMENT FORM */
        <section className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '32px', animation: 'fadeIn 0.2s ease' }}>
          <form onSubmit={handlePaymentAndCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0' }}>{t('paymentMethodLabel')}</h2>
            
            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  flex: 1,
                  border: `2px solid ${paymentMethod === 'card' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'card' ? 'var(--primary-light)' : 'transparent',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '24px' }}>💳</span>
                <strong style={{ fontSize: '13px', color: paymentMethod === 'card' ? 'var(--primary)' : 'inherit' }}>
                  {t('paymentMethodCard')}
                </strong>
              </label>

              <label
                style={{
                  flex: 1,
                  border: `2px solid ${paymentMethod === 'wallet' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'wallet' ? 'var(--primary-light)' : 'transparent',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '24px' }}>📱</span>
                <strong style={{ fontSize: '13px', color: paymentMethod === 'wallet' ? 'var(--primary)' : 'inherit' }}>
                  {t('paymentMethodWallet')}
                </strong>
              </label>
            </div>

            {/* Input fields based on method */}
            {paymentMethod === 'card' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('cardNumberLabel')}</span>
                  <input
                    type="tel"
                    placeholder="4444 3333 2222 1111"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    style={{ letterSpacing: '0.08em', padding: '12px' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('cardExpiryLabel')}</span>
                    <input
                      type="tel"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      required
                      style={{ textAlign: 'center', padding: '12px' }}
                    />
                  </label>

                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('cardCvcLabel')}</span>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength="3"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ textAlign: 'center', padding: '12px' }}
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('cardHolderLabel')}</span>
                  <input
                    type="text"
                    placeholder="IVAN IVANOV"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    required
                    style={{ letterSpacing: '0.04em', padding: '12px' }}
                  />
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('phoneLabelDl') || 'Номер телефона'}</span>
                  <div className="phone-input-wrapper">
                    <span className="phone-prefix" style={{ padding: '0 8px 0 12px', fontSize: '14px' }}>+992</span>
                    <input
                      type="tel"
                      maxLength="9"
                      placeholder="901234567"
                      required
                      style={{ padding: '12px !important' }}
                    />
                  </div>
                </label>
                <p className="muted" style={{ fontSize: '12px', margin: '0' }}>
                  {t('walletPaymentNote') || 'После клика на кнопку «Оплатить», вам придет пуш-уведомление в приложение Alif Mobi или DC Wallet для подтверждения списания.'}
                </p>
              </div>
            )}

            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '16px' }}>
                <span>{t('totalAmount')}:</span>
                <strong>{totalAmount.toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</strong>
              </div>

              {error && <p className="error" style={{ marginBottom: '14px', padding: '10px 14px' }}>{error}</p>}

              <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
                {submitting ? t('processingPayment') : t('payAndOrderBtn')}
              </button>
            </div>
          </form>
        </section>
      )}
    </section>
  );
}
