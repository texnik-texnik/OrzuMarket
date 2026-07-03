import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';
import { createOrdersFromCart } from '../../services/marketplace';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { items, totalAmount, setQuantity, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setError('');

    if (role !== 'buyer') {
      setError('Оформление заказа разрешено только покупателям с role === buyer.');
      return;
    }

    setSubmitting(true);
    try {
      await createOrdersFromCart({ buyerId: user.id, items });
      clearCart();
      navigate('/profile?tab=orders', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Не удалось оформить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Оформление заказа</h1>
          <p>Корзина хранится в localStorage. При оформлении создаётся заказ в Supabase.</p>
        </div>
        <Link className="button-link secondary-link" to="/shop">Вернуться в магазин</Link>
      </div>

      {!items.length ? (
        <section className="card empty-state">
          Корзина пустая. <Link to="/shop">Перейти к товарам</Link>
        </section>
      ) : (
        <section className="card">
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.id}>
                <ProductImageWithFallback src={item.photo_url} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted">{Number(item.price).toLocaleString('ru-RU')} ₽ · stock: {item.stock}</p>
                </div>
                <input
                  className="quantity-input"
                  type="number"
                  min="1"
                  max={item.stock || undefined}
                  value={item.quantity}
                  onChange={(event) => setQuantity(item.id, event.target.value)}
                />
                <strong>{(item.quantity * item.price).toLocaleString('ru-RU')} ₽</strong>
                <button type="button" className="danger" onClick={() => removeItem(item.id)}>Удалить</button>
              </div>
            ))}
          </div>

          <div className="checkout-footer">
            <strong>Итого: {totalAmount.toLocaleString('ru-RU')} ₽</strong>
            <button type="button" onClick={handleCheckout} disabled={submitting || !items.length}>
              {submitting ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}
    </section>
  );
}
