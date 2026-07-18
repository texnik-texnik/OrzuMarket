import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { fetchSellerOrders, fetchSellerProducts } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { InteractiveChart } from '../../components/InteractiveChart';
import { StatusBadge } from '../../components/StatusBadge';

export function SellerOverviewPage() {
  const { user, profile } = useAuth();
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard detail tab state: 'orders' or 'products'
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [fetchedOrders, fetchedProducts] = await Promise.all([
          fetchSellerOrders(),
          fetchSellerProducts(user.id)
        ]);
        
        // Filter orders for the current seller
        const filteredOrders = fetchedOrders.filter(
          (o) => o.seller_id === user.id || o.seller_id === 'demo-seller'
        );

        setOrders(filteredOrders);
        setProducts(fetchedProducts);
      } catch (err) {
        setError(err.message ?? t('errorLoadOrdersSeller'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Aggregate stats
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalIncome = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrders = orders.length;
  const averageCheck = nonCancelledOrders.length > 0 ? totalIncome / nonCancelledOrders.length : 0;
  const totalProducts = products.length;

  // Process sales dynamics for the last 7 days
  const getSalesDynamics = () => {
    const dynamics = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dateLabel = date.toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU', {
        day: 'numeric',
        month: 'short',
      });
      const fullDate = date.toLocaleDateString(lang === 'tg' ? 'tg-TJ' : 'ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      dynamics.push({
        key: dateStr,
        dateLabel,
        fullDate,
        value: 0,
        count: 0,
      });
    }

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;

      const orderDate = new Date(order.created_at);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const orderDateStr = `${year}-${month}-${day}`;

      const dayData = dynamics.find((d) => d.key === orderDateStr);
      if (dayData) {
        dayData.value += Number(order.total || 0);
        dayData.count += 1;
      }
    });

    return dynamics;
  };

  // Get top selling products
  const getTopProducts = () => {
    const counts = {};
    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      const pid = order.product_id;
      if (!counts[pid]) {
        counts[pid] = {
          name: order.products?.name || pid,
          quantity: 0,
          revenue: 0,
        };
      }
      counts[pid].quantity += order.quantity;
      counts[pid].revenue += Number(order.total || 0);
    });

    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5
  };

  const chartData = getSalesDynamics();
  const topProducts = getTopProducts();
  const formatCurrency = (val) => {
    return Math.round(val).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU');
  };

  // Recent 4 orders
  const recentOrders = orders.slice(0, 4);

  if (loading) {
    return <div className="loading-state"><p className="muted">{t('loading')}</p></div>;
  }

  return (
    <div className="dashboard-layout">
      {/* Welcome header */}
      <div className="dashboard-welcome-banner">
        <h2>{t('dashboardWelcome', { name: profile?.full_name || profile?.email || 'Продавец' })}</h2>
        <p className="muted">{t('sellerOverviewTitle')}</p>
      </div>

      {error && <p className="error">{error}</p>}

      {/* KPI Cards Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card income">
          <div className="card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="card-info">
            <span>{t('statTotalIncome')}</span>
            <strong>{formatCurrency(totalIncome)} {t('currency')}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card orders">
          <div className="card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="card-info">
            <span>{t('statTotalOrders')}</span>
            <strong>{totalOrders}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card average-check">
          <div className="card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <div className="card-info">
            <span>{t('statAverageCheck')}</span>
            <strong>{formatCurrency(averageCheck)} {t('currency')}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card products">
          <div className="card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <div className="card-info">
            <span>{t('statTotalProducts')}</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="dashboard-chart-section">
        <InteractiveChart
          data={chartData}
          lang={lang}
          currency={t('currency')}
          t={t}
        />
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="dashboard-details-grid">
        {/* Tabbed view: Recent Orders / Top Products */}
        <div className="dashboard-detail-block flex-col">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', gap: '16px', width: '100%' }}>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '8px 4px',
                borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: '700',
                cursor: 'pointer',
                borderRadius: '0',
                transform: 'none !important'
              }}
            >
              {t('recentOrdersTab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '8px 4px',
                borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: '700',
                cursor: 'pointer',
                borderRadius: '0',
                transform: 'none !important'
              }}
            >
              {t('topProductsTab')}
            </button>
          </div>

          {activeTab === 'orders' ? (
            recentOrders.length === 0 ? (
              <p className="muted" style={{ padding: '16px 0' }}>{t('noOrders')}</p>
            ) : (
              <div className="dashboard-recent-orders-list" style={{ width: '100%' }}>
                {recentOrders.map((order) => (
                  <div key={order.id} className="dashboard-recent-order-item">
                    <div className="order-item-main">
                      <strong>{order.products?.name ?? order.product_id}</strong>
                      <span>{order.buyer?.email ?? order.buyer_id}</span>
                    </div>
                    <div className="order-item-meta">
                      <strong className="order-price">
                        {formatCurrency(order.total)} {t('currency')}
                      </strong>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            topProducts.length === 0 ? (
              <p className="muted" style={{ padding: '16px 0', width: '100%' }}>{t('noSalesYet')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {topProducts.map((p) => {
                  const maxQty = Math.max(...topProducts.map(item => item.quantity));
                  const percentage = maxQty > 0 ? (p.quantity / maxQty) * 100 : 0;
                  return (
                    <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '13px' }}>
                        <strong>{p.name}</strong>
                        <span className="muted" style={{ fontSize: '12px' }}>
                          {t('soldQtyLabel')}: <strong>{p.quantity}</strong> ({formatCurrency(p.revenue)} {t('currency')})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Quick Navigation Links */}
        <div className="dashboard-detail-block flex-col">
          <h3>{t('quickNavigation')}</h3>
          <div className="dashboard-quick-links">
            <Link className="quick-link-card" to="/dashboard/products">
              <div className="quick-link-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </div>
              <div className="quick-link-text">
                <strong>{t('sellerOverviewProductsTitle')}</strong>
                <span>{t('sellerOverviewProductsSub')}</span>
              </div>
            </Link>
            <Link className="quick-link-card" to="/dashboard/orders">
              <div className="quick-link-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div className="quick-link-text">
                <strong>{t('sellerOverviewOrdersTitle')}</strong>
                <span>{t('sellerOverviewOrdersSub')}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
