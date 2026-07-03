import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useCart } from '../../cart/CartProvider';

export function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, role, signOut } = useAuth();
  const { totalQuantity } = useCart();

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
          {isAuthenticated && (
            <>
              {role === 'admin' && <Link to="/admin">Admin</Link>}
              {role === 'seller' && <Link to="/dashboard">Seller Dashboard</Link>}
              <Link to="/shop">Shop</Link>
              <Link to="/checkout">Корзина ({totalQuantity})</Link>
              <Link to="/profile">Profile</Link>
              <button type="button" onClick={handleLogout}>Выйти</button>
            </>
          )}
          {!isAuthenticated && <Link to="/login">Login</Link>}
        </nav>
      </header>

      {isAuthenticated && (
        <div className="role-strip">
          Пользователь: {profile?.email ?? '—'} · role: <strong>{role ?? '—'}</strong>
        </div>
      )}

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
