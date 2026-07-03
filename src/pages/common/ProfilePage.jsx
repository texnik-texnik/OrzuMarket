import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchMyOrders } from '../../services/marketplace';

export function ProfilePage() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      setError('');
      try {
        setOrders(await fetchMyOrders());
      } catch (err) {
        setError(err.message ?? 'Не удалось загрузить историю заказов');
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <section className="profile-grid">
      <div className="card">
        <h1>Профиль</h1>
        <dl className="profile-list">
          <dt>User ID</dt>
          <dd>{user?.id}</dd>
          <dt>Email</dt>
          <dd>{profile?.email ?? user?.email}</dd>
          <dt>Full name</dt>
          <dd>{profile?.full_name || '—'}</dd>
          <dt>Role</dt>
          <dd>{profile?.role}</dd>
          <dt>Статус</dt>
          <dd>{profile?.is_blocked ? 'Заблокирован' : 'Активен'}</dd>
        </dl>
      </div>

      <div className="card" id="orders">
        <h2>История заказов</h2>
        {error && <p className="error">{error}</p>}
        {loadingOrders && <p className="muted">Загружаем заказы...</p>}
        {!loadingOrders && !orders.length && <p className="muted">Заказов пока нет.</p>}

        {!!orders.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.products?.name ?? order.product_id}</td>
                    <td>{order.quantity}</td>
                    <td>{Number(order.total).toLocaleString('ru-RU')} ₽</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{new Date(order.created_at).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
