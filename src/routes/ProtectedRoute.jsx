import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getDefaultPathByRole } from './roleRedirect';

export function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, role, profile, loading } = useAuth();

  if (loading) {
    return <div className="screen-center">Проверяем сессию и роль...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profile?.is_blocked && location.pathname !== '/blocked') {
    return <Navigate to="/blocked" replace />;
  }

  // Если allowedRoles не передан — маршрут доступен любому авторизованному пользователю.
  if (!allowedRoles?.length) {
    return <Outlet />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultPathByRole(role)} replace />;
  }

  return <Outlet />;
}
