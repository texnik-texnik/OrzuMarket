import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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
            {theme === 'light' ? (
              <svg className="theme-toggle-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg className="theme-toggle-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
          
          {isAuthenticated ? (
            <div className="nav-links-desktop">
              {role === 'admin' && <NavLink to="/admin" end>{t('admin')}</NavLink>}
              {role === 'seller' && <NavLink to="/dashboard" end>{t('sellerDashboard')}</NavLink>}
              <NavLink to="/shop">{t('shop')}</NavLink>
              <NavLink to="/checkout">{t('cart')} ({totalQuantity})</NavLink>
              <NavLink to="/profile">{t('profile')}</NavLink>
              <button type="button" onClick={handleLogout} className="logout-btn">{t('logout')}</button>
            </div>
          ) : (
            <NavLink to="/login" className="login-link-btn">{t('login')}</NavLink>
          )}
        </nav>
      </header>

      {isAuthenticated && (
        <div className="role-strip">
          <div>
            {t('user')}: <strong>{profile?.email ?? '—'}</strong>
          </div>
          <div>
            {t('role')}: <strong>{t('role_' + role) || role ?? '—'}</strong>
          </div>
        </div>
      )}

      <main className="container">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && (
        <nav className="bottom-nav">
          <NavLink to="/shop" className="bottom-nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>{t('shop')}</span>
          </NavLink>
          <NavLink to="/checkout" className="bottom-nav-item">
            <div className="cart-icon-wrapper">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
            </div>
            <span>{t('cart')}</span>
          </NavLink>
          {role === 'seller' && (
            <NavLink to="/dashboard" className="bottom-nav-item" end>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <span>{t('mobileMenuSeller')}</span>
            </NavLink>
          )}
          {role === 'admin' && (
            <NavLink to="/admin" className="bottom-nav-item" end>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{t('mobileMenuAdmin')}</span>
            </NavLink>
          )}
          <NavLink to="/profile" className="bottom-nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{t('profile')}</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
