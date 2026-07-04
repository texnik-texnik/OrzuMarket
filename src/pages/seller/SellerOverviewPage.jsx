import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../localization/LanguageProvider';

export function SellerOverviewPage() {
  const { t } = useTranslation();

  return (
    <div className="stats-grid">
      <Link className="stat-card" to="/dashboard/products">
        <strong>{t('sellerOverviewProductsTitle')}</strong>
        <span>{t('sellerOverviewProductsSub')}</span>
      </Link>
      <Link className="stat-card" to="/dashboard/orders">
        <strong>{t('sellerOverviewOrdersTitle')}</strong>
        <span>{t('sellerOverviewOrdersSub')}</span>
      </Link>
    </div>
  );
}
