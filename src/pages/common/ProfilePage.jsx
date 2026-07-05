import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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
        phone: '+992' + phone
      });
      await refreshProfile();
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

  return (
    <section className="profile-grid">
      <div className="card">
        <h1>{t('profileTitle')}</h1>
        
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
              <dd>{profile?.role}</dd>
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
              
              <dt>{t('roleLabelDl')}</dt>
              <dd>{profile?.role}</dd>
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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.products?.name ?? order.product_id}</td>
                    <td>{order.quantity}</td>
                    <td>{Number(order.total).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</td>
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
