import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from '../../localization/LanguageProvider';

export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <section className="card">
      <h1>{t('adminInterfaceTitle')}</h1>
      <p>{t('adminAccessOnly')}</p>
      <div className="subnav">
        <Link to="/admin">{t('adminOverview')}</Link>
        <Link to="/admin/users">{t('adminUsers')}</Link>
        <Link to="/admin/products">{t('adminProducts')}</Link>
      </div>
      <Outlet />
    </section>
  );
}
