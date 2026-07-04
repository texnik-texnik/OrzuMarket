import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';
import { useTranslation } from '../../localization/LanguageProvider';
import { LanguageSelector } from '../../components/LanguageSelector';

export function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, role, signOut } = useAuth();
  const { totalQuantity } = useCart();
  const { t } = useTranslation();

  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <header className="topbar">
        <Link className="brand" to="/">
          <img src="/orzu-logo.jpg" alt="Orzu" />
          <span>Orzu</span>
        </Link>
        <nav>
          <LanguageSelector />
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {isAuthenticated && (
            <>
              {role === 'admin' && <Link to="/admin">{t('admin')}</Link>}
              {role === 'seller' && <Link to="/dashboard">{t('sellerDashboard')}</Link>}
              <Link to="/shop">{t('shop')}</Link>
              <Link to="/checkout">{t('cart')} ({totalQuantity})</Link>
              <Link to="/profile">{t('profile')}</Link>
              <button type="button" onClick={handleLogout}>{t('logout')}</button>
            </>
          )}
          {!isAuthenticated && <Link to="/login">{t('login')}</Link>}
        </nav>
      </header>

      {isAuthenticated && (
        <div className="role-strip">
          <div>
            {t('user')}: <strong>{profile?.email ?? '—'}</strong>
          </div>
          <div>
            {t('role')}: <strong>{role ?? '—'}</strong>
          </div>
        </div>
      )}

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
