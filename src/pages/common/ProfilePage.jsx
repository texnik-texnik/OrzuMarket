import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchMyOrders } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function ProfilePage() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const { t, lang } = useTranslation();

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      setError('');
      try {
        setOrders(await fetchMyOrders());
      } catch (err) {
        setError(err.message ?? t('errorLoadOrders'));
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="profile-grid">
      <div className="card">
        <h1>{t('profileTitle')}</h1>
        <dl className="profile-list">
          <dt>{t('userIdLabel')}</dt>
          <dd>{user?.id}</dd>
          <dt>{t('emailLabelDl')}</dt>
          <dd>{profile?.email ?? user?.email}</dd>
          <dt>{t('fullNameLabelDl')}</dt>
          <dd>{profile?.full_name || '—'}</dd>
          <dt>{t('roleLabelDl')}</dt>
          <dd>{profile?.role}</dd>
          <dt>{t('statusLabelDl')}</dt>
          <dd>{profile?.is_blocked ? t('statusBlocked') : t('statusActive')}</dd>
        </dl>
      </div>

      <div className="card" id="orders">
        <h2>{t('orderHistoryTitle')}</h2>
        {error && <p className="error">{error}</p>}
        {loadingOrders && <p className="muted">{t('loadingOrders')}</p>}
        {!loadingOrders && !orders.length && <p className="muted">{t('noOrders')}</p>}

        {!!orders.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('orderTableHeaderProduct')}</th>
                  <th>{t('orderTableHeaderQty')}</th>
                  <th>{t('orderTableHeaderAmount')}</th>
                  <th>{t('orderTableHeaderStatus')}</th>
                  <th>{t('orderTableHeaderDate')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.products?.name ?? order.product_id}</td>
                    <td>{order.quantity}</td>
                    <td>{Number(order.total).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {lang === 'tg' ? 'TJS' : '₽'}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{new Date(order.created_at).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')}</td>
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
