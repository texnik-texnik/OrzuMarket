import React, { useState } from 'react';
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

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? t('savingNewPassword') : t('saveNewPasswordBtn')}
          </button>
        </form>
      )}
    </section>
  );
}
