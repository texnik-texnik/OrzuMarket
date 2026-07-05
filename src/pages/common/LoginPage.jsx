import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getDefaultPathByRole } from '../../routes/roleRedirect';
import { useTranslation } from '../../localization/LanguageProvider';

const validatePassword = (pwd) => {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Zа-яА-ЯёЁ]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  return hasLetter && hasNumber;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, profile, loading, isDemoMode, signInWithPassword, signUp } = useAuth();
  const { t } = useTranslation();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [roleSelection, setRoleSelection] = useState('buyer'); // 'buyer' or 'seller'
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="screen-center">{t('loading')}</div>;

  if (isAuthenticated) {
    return <Navigate to={profile?.is_blocked ? '/blocked' : getDefaultPathByRole(role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!validatePassword(password)) {
          setError(t('errorWeakPassword'));
          setSubmitting(false);
          return;
        }

        if (phone.length !== 9) {
          setError(t('errorInvalidPhone'));
          setSubmitting(false);
          return;
        }

        const { session } = await signUp({
          email,
          password,
          fullName,
          role: roleSelection,
          phone: '+992' + phone,
        });

        if (!session && !isDemoMode) {
          setSuccessMessage(t('registrationSuccess'));
          setFullName('');
          setEmail('');
          setPassword('');
          setPhone('');
          setIsRegister(false); // Switch to login mode
        } else {
          const target = location.state?.from?.pathname;
          const defaultTarget = getDefaultPathByRole(roleSelection);
          navigate(target || defaultTarget, { replace: true });
        }
      } else {
        const { profile: userProfile } = await signInWithPassword({ email, password });
        const target = location.state?.from?.pathname;
        const defaultTarget = getDefaultPathByRole(userProfile?.role);
        navigate(target || defaultTarget, { replace: true });
      }
    } catch (err) {
      setError(err.message ?? t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <div className="auth-logo-wrap">
        <img src="/orzu-logo.jpg" alt="Orzu" />
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(false);
            setError('');
            setSuccessMessage('');
          }}
        >
          {t('authTabsLogin')}
        </button>
        <button
          type="button"
          className={`auth-tab ${isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(true);
            setError('');
            setSuccessMessage('');
          }}
        >
          {t('authTabsRegister')}
        </button>
      </div>

      <h1>{isRegister ? t('registerTitle') : t('loginTitle')}</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}

      {isDemoMode && (
        <div className="demo-box">
          <strong>{t('demoModeTitle')}</strong>
          {isRegister ? (
            <span>{t('demoModeRegNote')}</span>
          ) : (
            <>
              <span>{t('demoModeLoginNote')}</span>
              <div className="demo-buttons">
                <button type="button" className="secondary" onClick={() => { setEmail('buyer@demo.test'); setPassword('demo'); }}>Buyer</button>
                <button type="button" className="secondary" onClick={() => { setEmail('seller@demo.test'); setPassword('demo'); }}>Seller</button>
                <button type="button" className="secondary" onClick={() => { setEmail('admin@demo.test'); setPassword('demo'); }}>Admin</button>
              </div>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <label>
            {t('fullNameLabel')}
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={t('fullNamePlaceholder')}
              required
            />
          </label>
        )}

        {isRegister && (
          <label>
            {t('phoneLabel')}
            <div className="phone-input-wrapper">
              <span className="phone-prefix">+992</span>
              <input
                type="tel"
                maxLength="9"
                placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </label>
        )}

        <label>
          {t('emailLabel')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isRegister ? t('emailPlaceholderRegister') : t('emailPlaceholderLogin')}
            autoComplete="email"
            required
          />
        </label>

        <label>
          {t('passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('passwordPlaceholder')}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        </label>

        {isRegister && (
          <div>
            <span style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
              {t('accountTypeLabel')}
            </span>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${roleSelection === 'buyer' ? 'active' : ''}`}
                onClick={() => setRoleSelection('buyer')}
              >
                {t('buyerRoleBtn')}
              </button>
              <button
                type="button"
                className={`role-btn ${roleSelection === 'seller' ? 'active' : ''}`}
                onClick={() => setRoleSelection('seller')}
              >
                {t('sellerRoleBtn')}
              </button>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? (isRegister ? t('registering') : t('loggingIn')) : (isRegister ? t('registerBtn') : t('loginBtn'))}
        </button>
      </form>
    </section>
  );
}
