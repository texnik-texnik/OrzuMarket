import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../localization/LanguageProvider';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="card" style={{ padding: '80px 40px', textAlign: 'center', maxWidth: '580px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1 style={{ fontSize: '64px', margin: '0', fontWeight: '900', background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
      <h2 style={{ margin: '0', fontWeight: '800' }}>{t('notFoundTitle')}</h2>
      <p style={{ margin: '0 0 10px 0', maxWidth: '380px' }}>{t('notFoundSub')}</p>
      <Link className="button-link" to="/shop" style={{ minWidth: '200px' }}>
        {t('backToShop')}
      </Link>
    </section>
  );
}
