import React from 'react';
import { useTranslation } from '../../localization/LanguageProvider';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="card text-center" style={{ padding: '60px 40px' }}>
      <h1 style={{ fontSize: '72px', margin: '0 0 10px 0' }}>404</h1>
      <h2>{t('notFoundTitle')}</h2>
      <p>{t('notFoundSub')}</p>
    </section>
  );
}
