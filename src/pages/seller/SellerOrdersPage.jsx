import React, { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchSellerOrders, updateOrderStatus } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

const statuses = ['new', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];

export function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { t, lang } = useTranslation();

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchSellerOrders());
    } catch (err) {
      setError(err.message ?? t('errorLoadOrdersSeller'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    setError('');
    try {
      await updateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
    } catch (err) {
      setError(err.message ?? t('errorChangeStatus'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>{t('sellerOrdersTitle')}</h2>
        <button type="button" className="secondary" onClick={loadOrders}>{t('refreshBtn')}</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">{t('loadingOrders')}</p>}
      {!loading && !orders.length && <p className="muted">{t('noOrders')}</p>}

      {!!orders.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('orderTableHeaderProduct')}</th>
                <th>{t('tableHeaderBuyer')}</th>
                <th>{t('orderTableHeaderQty')}</th>
                <th>{t('orderTableHeaderAmount')}</th>
                <th>{t('orderTableHeaderStatus')}</th>
                <th>{t('tableHeaderChangeStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.products?.name ?? order.product_id}</td>
                  <td>{order.buyer?.email ?? order.buyer_id}</td>
                  <td>{order.quantity}</td>
                  <td>{Number(order.total).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="actions-cell">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{t('status_' + status)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="small"
                      disabled={updatingId === order.id || order.status === 'shipped'}
                      onClick={() => handleStatusChange(order.id, 'shipped')}
                    >
                      {t('statusInTransitBtn')}
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
