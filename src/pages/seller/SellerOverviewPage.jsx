import { Link } from 'react-router-dom';

export function SellerOverviewPage() {
  return (
    <div className="stats-grid">
      <Link className="stat-card" to="/dashboard/products">
        <strong>Товары</strong>
        <span>Добавить товар и посмотреть список своих товаров.</span>
      </Link>
      <Link className="stat-card" to="/dashboard/orders">
        <strong>Заказы</strong>
        <span>Список заказов, где фигурируют ваши товары.</span>
      </Link>
    </div>
  );
}
