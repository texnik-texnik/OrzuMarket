import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { fetchMyOrders, updateUserProfile } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
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
        {/* Draw a line connecting the dots */}
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

              <dt>{t('fieldPhoto') || 'Фото профиля'}</dt>
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
                        onClick={() => setSelectedOrder(order)}
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

      {selectedOrder && (
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
          </div>
        </Modal>
      )}
    </section>
  );
}
