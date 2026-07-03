import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchSellerOrders, orderStatusLabels, updateOrderStatus } from '../../services/marketplace';

const statuses = ['new', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];

export function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchSellerOrders());
    } catch (err) {
      setError(err.message ?? 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    setError('');
    try {
      await updateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
    } catch (err) {
      setError(err.message ?? 'Не удалось изменить статус');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Заказы по моим товарам</h2>
        <button type="button" className="secondary" onClick={loadOrders}>Обновить</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загружаем заказы...</p>}
      {!loading && !orders.length && <p className="muted">Заказов пока нет.</p>}

      {!!orders.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Покупатель</th>
                <th>Кол-во</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Изменить статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.products?.name ?? order.product_id}</td>
                  <td>{order.buyer?.email ?? order.buyer_id}</td>
                  <td>{order.quantity}</td>
                  <td>{Number(order.total).toLocaleString('ru-RU')} ₽</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{orderStatusLabels[status]}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="small"
                      disabled={updatingId === order.id || order.status === 'shipped'}
                      onClick={() => handleStatusChange(order.id, 'shipped')}
                    >
                      В пути
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
