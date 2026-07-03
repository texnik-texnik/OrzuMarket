import { Link } from 'react-router-dom';

export function AdminOverviewPage() {
  return (
    <div className="stats-grid">
      <Link className="stat-card" to="/admin/users">
        <strong>Пользователи</strong>
        <span>Переключить buyer/seller и заблокировать аккаунт.</span>
      </Link>
      <Link className="stat-card" to="/admin/products">
        <strong>Товары</strong>
        <span>Скрыть или удалить товар на маркетплейсе.</span>
      </Link>
    </div>
  );
}
