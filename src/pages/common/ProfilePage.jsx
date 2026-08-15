import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  fetchMyOrders,
  updateUserProfile,
  fetchDisputes,
  createDispute
} from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const { t, lang } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Order tracking states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('item_not_received');
  const [disputeMessage, setDisputeMessage] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const startEditing = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone ? profile.phone.replace(/^\+992/, '') : '');
    setSaveError('');
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setSaveError(t('error'));
      return;
    }
    if (phone.length !== 9) {
      setSaveError(t('errorInvalidPhone'));
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await updateUserProfile({
        userId: user.id,
        fullName: fullName.trim(),
        phone: '+992' + phone,
        photoFile
      });
      await refreshProfile();
      setPhotoFile(null);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message ?? t('errorUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    setLoadingOrders(true);
    setError('');
    try {
      const [ordersData, disputesData] = await Promise.all([
        fetchMyOrders(),
        fetchDisputes({ buyerId: user.id })
      ]);
      setOrders(ordersData);
      setDisputes(disputesData);
    } catch (err) {
      setError(err.message ?? t('errorLoadOrders'));
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleOpenDispute = async (e) => {
    e.preventDefault();
    if (!disputeMessage.trim()) return;

    setSubmittingDispute(true);
    setDisputeError('');
    setDisputeSuccess('');
    try {
      const newDispute = await createDispute({
        orderId: selectedOrder.id,
        buyerId: user.id,
        reason: disputeReason,
        message: disputeMessage
      });
      setDisputeSuccess(t('disputeSuccessMessage') || 'Жалоба отправлена! Админ рассмотрит спор.');
      setDisputes((current) => [newDispute, ...current]);
      setDisputeMessage('');
      setShowDisputeForm(false);
    } catch (err) {
      setDisputeError(err.message ?? t('error'));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const renderTrackingSteps = (status) => {
    const steps = [
      { key: 'new', label: t('orderStatusPlaced') },
      { key: 'paid', label: t('orderStatusPaid') },
      { key: 'processing', label: t('orderStatusProcessing') },
      { key: 'shipped', label: t('orderStatusShipped') },
      { key: 'completed', label: t('orderStatusCompleted') },
    ];

    if (status === 'cancelled') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginTop: '16px' }}>
          <span style={{ fontSize: '32px' }}>❌</span>
          <strong>{t('orderStatusCancelled')}</strong>
        </div>
      );
    }

    const statusIndices = {
      new: 0,
      paid: 1,
      processing: 2,
      shipped: 3,
      completed: 4
    };

    const currentIndex = statusIndices[status] ?? 0;

    return (
      <div className="tracking-stepper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '16px',
            bottom: '16px',
            width: '2px',
            background: 'var(--border-color)',
            zIndex: 1
          }}
        />

        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone ? 'var(--success)' : 'var(--bg-secondary)',
                  color: isDone ? 'white' : 'var(--text-muted)',
                  border: `2px solid ${isDone ? 'var(--success)' : 'var(--border-color)'}`,
                  fontWeight: '800',
                  fontSize: '14px',
                  boxShadow: isCurrent ? '0 0 0 4px var(--success-light)' : 'none'
                }}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: isDone ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '14px' }}>{step.label}</strong>
                {isCurrent && <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>{t('currentStatus') || 'Текущий статус'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="profile-grid">
      <div className="card">
        <h1>{t('profileTitle')}</h1>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'Avatar'}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '36px',
              textTransform: 'uppercase',
              border: '1px solid var(--border-color)'
            }}>
              {(profile?.full_name || user?.email || '?').charAt(0)}
            </div>
          )}
        </div>

        {!isEditing ? (
          <>
            <dl className="profile-list">
              <dt>{t('userIdLabel')}</dt>
              <dd>{user?.id}</dd>
              <dt>{t('emailLabelDl')}</dt>
              <dd>{profile?.email ?? user?.email}</dd>
              <dt>{t('fullNameLabelDl')}</dt>
              <dd>{profile?.full_name || '—'}</dd>
              <dt>{t('phoneLabelDl')}</dt>
              <dd>{profile?.phone ? (profile.phone.startsWith('+') ? profile.phone : `+992${profile.phone}`) : '—'}</dd>
              <dt>{t('roleLabelDl')}</dt>
              <dd>{t('role_' + profile?.role) || profile?.role}</dd>
              <dt>{t('statusLabelDl')}</dt>
              <dd>{profile?.is_blocked ? t('statusBlocked') : t('statusActive')}</dd>
            </dl>
            <button
              type="button"
              onClick={startEditing}
              style={{ width: '100%', marginTop: '20px' }}
            >
              {t('editProfileBtn')}
            </button>
          </>
        ) : (
          <form onSubmit={handleSave}>
            <dl className="profile-list">
              <dt>{t('userIdLabel')}</dt>
              <dd>{user?.id}</dd>
              <dt>{t('emailLabelDl')}</dt>
              <dd>{profile?.email ?? user?.email}</dd>
              
              <dt>{t('fullNameLabelDl')}</dt>
              <dd>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                />
              </dd>
              
              <dt>{t('phoneLabelDl')}</dt>
              <dd>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix" style={{ padding: '0 8px 0 12px', fontSize: '14px' }}>+992</span>
                  <input
                    type="tel"
                    maxLength="9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ padding: '8px 12px !important', fontSize: '14px' }}
                  />
                </div>
              </dd>

              <dt>{t('fieldAvatar') || 'Аватар профиля'}</dt>
              <dd>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '6px 0' }}
                />
              </dd>
              
              <dt>{t('roleLabelDl')}</dt>
              <dd>{t('role_' + profile?.role) || profile?.role}</dd>
              <dt>{t('statusLabelDl')}</dt>
              <dd>{profile?.is_blocked ? t('statusBlocked') : t('statusActive')}</dd>
            </dl>
            
            {saveError && <p className="error" style={{ marginTop: '12px' }}>{saveError}</p>}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? t('loading') : t('saveProfileBtn')}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={() => setIsEditing(false)}
                style={{ flex: 1 }}
              >
                {t('cancelBtn')}
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="danger"
          style={{ width: '100%', marginTop: '12px' }}
        >
          {t('logout')}
        </button>
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
                  <th>{t('tableHeaderAction') || 'Действие'}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      {order.products ? (
                        <Link to={`/product/${order.product_id}`} style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'underline' }}>
                          {order.products.name}
                        </Link>
                      ) : (
                        order.product_id
                      )}
                    </td>
                    <td>{order.quantity}</td>
                    <td>{Number(order.total).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{new Date(order.created_at).toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDisputeForm(false);
                          setDisputeMessage('');
                          setDisputeError('');
                          setDisputeSuccess('');
                        }}
                      >
                        {t('actionTrackOrder')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (() => {
        const orderDispute = disputes.find((d) => d.order_id === selectedOrder.id);
        return (
          <Modal title={t('orderDetailsTitle')} onClose={() => setSelectedOrder(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID:</span>
                <code style={{ fontSize: '12px', display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>{selectedOrder.id}</code>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px' }}>{selectedOrder.products?.name ?? selectedOrder.product_id}</strong>
                  <span className="muted" style={{ fontSize: '13px' }}>
                    {t('productQuantityTitle') || 'Количество'}: {selectedOrder.quantity}
                  </span>
                </div>
                <strong style={{ fontSize: '16px' }}>
                  {Number(selectedOrder.total).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}
                </strong>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 12px 0' }}>
                  {t('orderTrackingTitle')}
                </h3>
                {renderTrackingSteps(selectedOrder.status)}
              </div>

              {/* Disputes Section inside order details */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                {orderDispute ? (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--warning)' }}>⚠️ {t('disputeStatusLabel') || 'Спор открыт'}</strong>
                      <span className={`status-badge moderation-${orderDispute.status === 'open' ? 'pending' : 'approved'}`} style={{ fontSize: '9px' }}>
                        {orderDispute.status === 'open' ? t('moderation_status_pending') : t('status_completed') || 'Решен'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>{t('disputeReasonLabel') || 'Причина'}:</strong> {t(`dispute_reason_${orderDispute.reason}`) || orderDispute.reason}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic' }}>"{orderDispute.message}"</p>
                  </div>
                ) : showDisputeForm ? (
                  <form onSubmit={handleOpenDispute} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>
                      {t('openDisputeTitle') || 'Открыть спор / Жалоба'}
                    </h4>
                    
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('disputeReasonLabel') || 'Причина'}</span>
                      <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} required>
                        <option value="item_not_received">{t('dispute_reason_item_not_received') || 'Товар не получен'}</option>
                        <option value="item_damaged">{t('dispute_reason_item_damaged') || 'Товар поврежден / брак'}</option>
                        <option value="item_not_matching">{t('dispute_reason_item_not_matching') || 'Не соответствует описанию'}</option>
                        <option value="other">{t('dispute_reason_other') || 'Другая причина'}</option>
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('textLabel') || 'Описание проблемы'}</span>
                      <textarea
                        rows="3"
                        value={disputeMessage}
                        onChange={(e) => setDisputeMessage(e.target.value)}
                        placeholder={t('disputePlaceholder') || 'Опишите проблему подробно...'}
                        required
                      />
                    </label>

                    {disputeError && <p className="error" style={{ margin: 0, padding: '8px' }}>{disputeError}</p>}
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" disabled={submittingDispute} style={{ flex: 1, padding: '10px' }}>
                        {submittingDispute ? t('loading') : t('submitReview')}
                      </button>
                      <button type="button" className="secondary" onClick={() => setShowDisputeForm(false)} style={{ flex: 1, padding: '10px' }}>
                        {t('cancelBtn')}
                      </button>
                    </div>
                  </form>
                ) : (
                  selectedOrder.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setShowDisputeForm(true)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        color: 'var(--danger)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        boxShadow: 'none',
                        padding: '10px'
                      }}
                    >
                      ⚠️ {t('openDisputeBtn') || 'Открыть спор / Подать жалобу'}
                    </button>
                  )
                )}
                {disputeSuccess && <p className="success-message" style={{ marginTop: '8px', padding: '8px' }}>{disputeSuccess}</p>}
              </div>
            </div>
          </Modal>
        );
      })()}
    </section>
  );
}
