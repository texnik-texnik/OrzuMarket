import { Link, Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <section className="card">
      <h1>Admin Interface</h1>
      <p>Доступ только для <code>role === 'admin'</code>.</p>
      <div className="subnav">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/products">Products</Link>
      </div>
      <Outlet />
    </section>
  );
}
