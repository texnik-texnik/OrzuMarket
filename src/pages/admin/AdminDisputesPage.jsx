import React, { useEffect, useState } from 'react';
import { fetchDisputes, resolveDispute } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { TableRowSkeleton } from '../../components/SkeletonLoaders';

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { t, lang } = useTranslation();

  const loadDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      setDisputes(await fetchDisputes());
    } catch (err) {
      setError(err.message ?? t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolve = async (dispute, resolution) => {
    const confirmMsg =
      resolution === 'resolved_buyer'
        ? (t('confirmRefundBuyer') || 'Отменить заказ и вернуть средства покупателю?')
        : resolution === 'resolved_seller'
        ? (t('confirmPaySeller') || 'Завершить заказ и перевести средства продавцу?')
        : (t('confirmDismissDispute') || 'Отклонить жалобу и оставить заказ как есть?');

    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    setUpdatingId(dispute.id);
    setError('');
    try {
      await resolveDispute(dispute.id, resolution, dispute.order_id);
      setDisputes((current) =>
        current.map((d) => (d.id === dispute.id ? { ...d, status: resolution } : d))
      );
    } catch (err) {
      setError(err.message ?? t('error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getDisputeStatusLabel = (status) => {
    switch (status) {
      case 'open':
        return <span className="status-badge moderation-pending">{t('moderation_status_pending')}</span>;
      case 'resolved_buyer':
        return <span className="status-badge moderation-rejected">{t('resolved_buyer_label')}</span>;
      case 'resolved_seller':
        return <span className="status-badge moderation-approved">{t('resolved_seller_label')}</span>;
      case 'dismissed':
        return <span className="status-badge" style={{ background: 'var(--border-color)', color: 'var(--text-muted)' }}>{t('dismissed_label')}</span>;
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>{t('adminDisputes') || 'Жалобы и Споры'}</h2>
        <button type="button" className="secondary" onClick={loadDisputes}>{t('refreshBtn')}</button>
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && !disputes.length && <p className="muted">{t('noDisputes')}</p>}

      {(loading || !!disputes.length) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('orderTableHeaderDate')}</th>
                <th>{t('tableHeaderBuyerSeller') || 'Покупатель / Продавец'}</th>
                <th>{t('tableHeaderProductAmount') || 'Товар / Сумма'}</th>
                <th>{t('disputeReasonLabel')}</th>
                <th>{t('tableHeaderProblemDescription') || 'Описание проблемы'}</th>
                <th>{t('orderTableHeaderStatus')}</th>
                <th>{t('tableHeaderArbitrationResolution') || 'Решение арбитража'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} columns={7} />
                ))
              ) : (
                disputes.map((dispute) => {
                  const order = dispute.order || {};
                  return (
                    <tr key={dispute.id} className={dispute.status !== 'open' ? 'row-muted' : ''}>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(dispute.created_at).toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div>👤 {order.buyer?.email ?? dispute.buyer_id}</div>
                        <div style={{ marginTop: '4px' }}>🏪 {order.seller?.email ?? order.seller_id}</div>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <strong>{order.products?.name ?? order.product_id}</strong>
                        <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                          {order.quantity} {t('qtyUnit') || 'шт.'} · {Number(order.total || 0).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', fontSize: '13px' }}>
                        {t(`dispute_reason_${dispute.reason}`) || dispute.reason}
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '240px', wordBreak: 'break-word', fontStyle: 'italic' }}>
                        "{dispute.message}"
                      </td>
                      <td>{getDisputeStatusLabel(dispute.status)}</td>
                      <td className="actions-cell">
                        {dispute.status === 'open' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              type="button"
                              className="danger"
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                              disabled={updatingId === dispute.id}
                              onClick={() => handleResolve(dispute, 'resolved_buyer')}
                            >
                              {t('resolved_buyer_label')}
                            </button>
                            <button
                              type="button"
                              className="success"
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success)', color: 'white', border: 'none' }}
                              disabled={updatingId === dispute.id}
                              onClick={() => handleResolve(dispute, 'resolved_seller')}
                            >
                              {t('resolved_seller_label')}
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={updatingId === dispute.id}
                              onClick={() => handleResolve(dispute, 'dismissed')}
                            >
                              {t('dismissed_label')}
                            </button>
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: '12px' }}>{t('disputeClosed') || 'Жалоба закрыта'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
