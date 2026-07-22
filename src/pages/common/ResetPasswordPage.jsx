import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useTranslation } from '../../localization/LanguageProvider';

const validatePassword = (pwd) => {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Zа-яА-ЯёЁ]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  return hasLetter && hasNumber;
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const { updatePassword, isDemoMode } = useAuth();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const errorDesc = params.get('error_description');
      const errorCode = params.get('error_code');
      if (errorCode === 'otp_expired' || errorDesc?.includes('expired') || errorDesc?.includes('invalid')) {
        setError(t('otpExpiredError'));
      } else if (errorDesc) {
        setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      }
    }
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(newPassword)) {
      setError(t('errorWeakPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message ?? t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <div className="auth-logo-wrap">
        <img src="/orzu-logo.jpg" alt="Orzu Market" />
      </div>

      <h1>{t('resetPasswordTitle')}</h1>

      {isDemoMode && (
        <div className="demo-box" style={{ marginBottom: '16px' }}>
          <strong>{t('demoModeTitle')}</strong>
          <span>{emailFromUrl ? `Сброс пароля для ${emailFromUrl}` : t('demoModeRegNote')}</span>
        </div>
      )}

      {isSuccess ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div className="success-message" style={{ marginBottom: '20px', fontSize: '15px' }}>
            🎉 {t('passwordResetSuccessTitle')}
            <br />
            <span style={{ fontSize: '13px', opacity: 0.9 }}>{t('passwordResetSuccessSub')}</span>
          </div>
          <button type="button" className="primary" onClick={() => navigate('/login', { replace: true })}>
            {t('goToLoginBtn')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            {t('newPasswordLabel')}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            {t('confirmPasswordLabel')}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              autoComplete="new-password"
              required
            />
          </label>

          {error && (
            <div className="error-container" style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--danger-light, rgba(239,68,68,0.1))', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--danger, #ef4444)' }}>
              <p className="error" style={{ margin: 0, fontWeight: '500' }}>{error}</p>
              {error === t('otpExpiredError') && (
                <button
                  type="button"
                  className="primary"
                  style={{ marginTop: '12px', width: '100%', fontSize: '13px' }}
                  onClick={() => navigate('/login', { replace: true })}
                >
                  {t('requestNewLinkBtn')}
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={submitting || error === t('otpExpiredError')}>
            {submitting ? t('savingNewPassword') : t('saveNewPasswordBtn')}
          </button>
        </form>
      )}
    </section>
  );
}
