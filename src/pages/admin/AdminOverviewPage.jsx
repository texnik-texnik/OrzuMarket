import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../localization/LanguageProvider';

export function AdminOverviewPage() {
  const { t } = useTranslation();

  return (
    <div className="stats-grid">
      <Link className="stat-card" to="/admin/users">
        <strong>{t('adminOverviewUsersTitle')}</strong>
        <span>{t('adminOverviewUsersSub')}</span>
      </Link>
      <Link className="stat-card" to="/admin/products">
        <strong>{t('adminOverviewProductsTitle')}</strong>
        <span>{t('adminOverviewProductsSub')}</span>
      </Link>
    </div>
  );
}
