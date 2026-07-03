import { Link, Outlet } from 'react-router-dom';

export function SellerLayout() {
  return (
    <section className="card">
      <h1>Seller Dashboard</h1>
      <p>Доступ только для <code>role === 'seller'</code>.</p>
      <div className="subnav">
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/products">My Products</Link>
        <Link to="/dashboard/orders">Orders</Link>
      </div>
      <Outlet />
    </section>
  );
}
