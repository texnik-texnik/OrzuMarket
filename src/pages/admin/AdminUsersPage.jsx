import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { fetchAdminUsers, updateUserBlocked, updateUserRole } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { t } = useTranslation();

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(err.message ?? t('errorLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchUser = (userId, patch) => {
    setUsers((current) => current.map((item) => item.id === userId ? { ...item, ...patch } : item));
  };

  const toggleSeller = async (target) => {
    const nextRole = target.role === 'seller' ? 'buyer' : 'seller';
    setUpdatingId(target.id);
    setError('');
    try {
      await updateUserRole(target.id, nextRole);
      patchUser(target.id, { role: nextRole });
    } catch (err) {
      setError(err.message ?? t('errorChangeRole'));
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBlocked = async (target) => {
    const nextValue = !target.is_blocked;
    setUpdatingId(target.id);
    setError('');
    try {
      await updateUserBlocked(target.id, nextValue);
      patchUser(target.id, { is_blocked: nextValue });
    } catch (err) {
      setError(err.message ?? t('errorChangeBlocked'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>{t('adminUsersTitle')}</h2>
        <button type="button" className="secondary" onClick={loadUsers}>{t('refreshBtn')}</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">{t('loading')}</p>}

      {!!users.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('tableHeaderEmail')}</th>
                <th>{t('tableHeaderName')}</th>
                <th>{t('phoneLabelDl')}</th>
                <th>{t('tableHeaderRole')}</th>
                <th>{t('tableHeaderMakeSeller')}</th>
                <th>{t('tableHeaderBlock')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((target) => {
                const isSelf = target.id === user.id;
                return (
                  <tr key={target.id} className={target.is_blocked ? 'row-muted' : ''}>
                    <td>{target.email ?? target.id}</td>
                    <td>{target.full_name || '—'}</td>
                    <td>{target.phone ? (target.phone.startsWith('+') ? target.phone : `+992${target.phone}`) : '—'}</td>
                    <td><span className="pill">{t('role_' + target.role) || target.role}</span></td>
                    <td>
                      <label className="switch-label">
                        <input
                          type="checkbox"
                          checked={target.role === 'seller'}
                          disabled={target.role === 'admin' || updatingId === target.id}
                          onChange={() => toggleSeller(target)}
                        />
                        <span>{target.role === 'seller' ? t('makeSellerCheck') : t('makeBuyerCheck')}</span>
                      </label>
                    </td>
                    <td>
                      <label className="switch-label">
                        <input
                          type="checkbox"
                          checked={Boolean(target.is_blocked)}
                          disabled={isSelf || target.role === 'admin' || updatingId === target.id}
                          onChange={() => toggleBlocked(target)}
                        />
                        <span>{target.is_blocked ? t('blockedCheck') : t('activeCheck')}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
