import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getDefaultPathByRole } from '../../routes/roleRedirect';

export function HomePage() {
  const { isAuthenticated, role, profile, loading } = useAuth();

  if (loading) return <div className="screen-center">Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profile?.is_blocked) return <Navigate to="/blocked" replace />;

  return <Navigate to={getDefaultPathByRole(role)} replace />;
}
