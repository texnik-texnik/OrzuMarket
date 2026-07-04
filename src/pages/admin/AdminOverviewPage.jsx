import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { fetchSellerOrders, fetchAdminProducts, fetchAdminUsers } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { InteractiveChart } from '../../components/InteractiveChart';
import { StatusBadge } from '../../components/StatusBadge';

export function AdminOverviewPage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [fetchedOrders, fetchedProducts, fetchedUsers] = await Promise.all([
          fetchSellerOrders(),
          fetchAdminProducts(),
          fetchAdminUsers()
        ]);

        setOrders(fetchedOrders);
        setProducts(fetchedProducts);
        setUsers(fetchedUsers);
      } catch (err) {
        setError(err.message ?? t('errorLoadOrdersSeller'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate stats
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalIncome = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrders = orders.length;
  const averageCheck = nonCancelledOrders.length > 0 ? totalIncome / nonCancelledOrders.length : 0;
  const totalProducts = products.length;
  const totalUsers = users.length;

  // Process sales dynamics for the last 7 days globally
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

  const chartData = getSalesDynamics();
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
        <h2>{t('adminInterfaceTitle')}</h2>
        <p className="muted">{t('adminOverview')}</p>
      </div>

      {error && <p className="error">{error}</p>}

      {/* KPI Cards Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card income">
          <div className="card-icon">💵</div>
          <div className="card-info">
            <span>{t('statTotalIncome')}</span>
            <strong>{formatCurrency(totalIncome)} {t('currency')}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card orders">
          <div className="card-icon">📦</div>
          <div className="card-info">
            <span>{t('statTotalOrders')}</span>
            <strong>{totalOrders}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card average-check">
          <div className="card-icon">📊</div>
          <div className="card-info">
            <span>{t('statAverageCheck')}</span>
            <strong>{formatCurrency(averageCheck)} {t('currency')}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card users">
          <div className="card-icon">👥</div>
          <div className="card-info">
            <span>{t('statTotalUsers')}</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card products">
          <div className="card-icon">🏷️</div>
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
        {/* Recent Orders List */}
        <div className="dashboard-detail-block">
          <h3>{t('recentOrders')}</h3>
          {recentOrders.length === 0 ? (
            <p className="muted" style={{ padding: '16px 0' }}>{t('noOrders')}</p>
          ) : (
            <div className="dashboard-recent-orders-list">
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
          )}
        </div>

        {/* Quick Navigation Links */}
        <div className="dashboard-detail-block flex-col">
          <h3>{t('quickNavigation')}</h3>
          <div className="dashboard-quick-links">
            <Link className="quick-link-card" to="/admin/users">
              <div className="quick-link-emoji">👥</div>
              <div className="quick-link-text">
                <strong>{t('adminOverviewUsersTitle')}</strong>
                <span>{t('adminOverviewUsersSub')}</span>
              </div>
            </Link>
            <Link className="quick-link-card" to="/admin/products">
              <div className="quick-link-emoji">🏷️</div>
              <div className="quick-link-text">
                <strong>{t('adminOverviewProductsTitle')}</strong>
                <span>{t('adminOverviewProductsSub')}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
