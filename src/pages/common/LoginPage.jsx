import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getDefaultPathByRole } from '../../routes/roleRedirect';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, profile, loading, isDemoMode, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="screen-center">Загрузка...</div>;

  if (isAuthenticated) {
    return <Navigate to={profile?.is_blocked ? '/blocked' : getDefaultPathByRole(role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { profile } = await signInWithPassword({ email, password });
      const target = location.state?.from?.pathname;
      const defaultTarget = getDefaultPathByRole(profile?.role);

      // После логина отправляем в запрошенный route, если он разрешён ProtectedRoute.
      // Иначе ProtectedRoute сам перекинет в интерфейс по роли.
      navigate(target || defaultTarget, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Ошибка входа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <div className="auth-logo-wrap">
        <img src="/orzu-logo.jpg" alt="Orzu" />
      </div>
      <h1>Вход в Orzu</h1>
      <p>После входа роль берётся из таблицы <code>profiles</code>.</p>

      {isDemoMode && (
        <div className="demo-box">
          <strong>Demo mode</strong>
          <span>Supabase ещё не настроен, поэтому можно войти тестовыми аккаунтами. Пароль — любой.</span>
          <div className="demo-buttons">
            <button type="button" className="secondary" onClick={() => { setEmail('buyer@demo.test'); setPassword('demo'); }}>Buyer</button>
            <button type="button" className="secondary" onClick={() => { setEmail('seller@demo.test'); setPassword('demo'); }}>Seller</button>
            <button type="button" className="secondary" onClick={() => { setEmail('admin@demo.test'); setPassword('demo'); }}>Admin</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seller@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </section>
  );
}
