import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from '../../localization/LanguageProvider';

export function SellerLayout() {
  const { t } = useTranslation();

  return (
    <section className="card">
      <h1>{t('sellerOverviewTitle')}</h1>
      <p>{t('sellerAccessOnly')}</p>
      <div className="subnav">
        <Link to="/dashboard">{t('adminOverview')}</Link>
        <Link to="/dashboard/products">{t('sellerOverviewProductsTitle')}</Link>
        <Link to="/dashboard/orders">{t('sellerOverviewOrdersTitle')}</Link>
      </div>
      <Outlet />
    </section>
  );
}
