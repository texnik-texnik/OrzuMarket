import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useTranslation } from '../../localization/LanguageProvider';

export function BlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <section className="card auth-card text-center">
      <h1>{t('blockedTitle')}</h1>
      <p>{t('blockedSub')} {t('contactSupport')}</p>
      <button type="button" onClick={handleSignOut}>{t('logout')}</button>
    </section>
  );
}
