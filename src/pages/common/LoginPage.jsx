import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getDefaultPathByRole } from '../../routes/roleRedirect';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, profile, loading, isDemoMode, signInWithPassword, signUp } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelection, setRoleSelection] = useState('buyer'); // 'buyer' or 'seller'
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="screen-center">Загрузка...</div>;

  if (isAuthenticated) {
    return <Navigate to={profile?.is_blocked ? '/blocked' : getDefaultPathByRole(role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const { session } = await signUp({
          email,
          password,
          fullName,
          role: roleSelection,
        });

        if (!session && !isDemoMode) {
          setSuccessMessage(
            'Регистрация успешна! Мы отправили письмо с подтверждением на ваш email. Пожалуйста, перейдите по ссылке в письме перед входом.'
          );
          setFullName('');
          setEmail('');
          setPassword('');
          setIsRegister(false); // Switch to login mode
        } else {
          const target = location.state?.from?.pathname;
          const defaultTarget = getDefaultPathByRole(roleSelection);
          navigate(target || defaultTarget, { replace: true });
        }
      } else {
        const { profile: userProfile } = await signInWithPassword({ email, password });
        const target = location.state?.from?.pathname;
        const defaultTarget = getDefaultPathByRole(userProfile?.role);
        navigate(target || defaultTarget, { replace: true });
      }
    } catch (err) {
      setError(err.message ?? 'Произошла ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <div className="auth-logo-wrap">
        <img src="/orzu-logo.jpg" alt="Orzu" />
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(false);
            setError('');
            setSuccessMessage('');
          }}
        >
          Вход
        </button>
        <button
          type="button"
          className={`auth-tab ${isRegister ? 'active' : ''}`}
          onClick={() => {
            setIsRegister(true);
            setError('');
            setSuccessMessage('');
          }}
        >
          Регистрация
        </button>
      </div>

      <h1>{isRegister ? 'Регистрация в Orzu' : 'Вход в Orzu'}</h1>
      
      {!isRegister && <p>После входа роль берётся из таблицы <code>profiles</code>.</p>}

      {successMessage && <div className="success-message">{successMessage}</div>}

      {isDemoMode && (
        <div className="demo-box">
          <strong>Demo mode (Supabase не настроен)</strong>
          {isRegister ? (
            <span>В демонстрационном режиме вы можете создать любой аккаунт, и вход выполнится автоматически.</span>
          ) : (
            <>
              <span>Войдите тестовыми аккаунтами (пароль — любой):</span>
              <div className="demo-buttons">
                <button type="button" className="secondary" onClick={() => { setEmail('buyer@demo.test'); setPassword('demo'); }}>Buyer</button>
                <button type="button" className="secondary" onClick={() => { setEmail('seller@demo.test'); setPassword('demo'); }}>Seller</button>
                <button type="button" className="secondary" onClick={() => { setEmail('admin@demo.test'); setPassword('demo'); }}>Admin</button>
              </div>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <label>
            Имя и фамилия
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Иван Иванов"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isRegister ? "user@example.com" : "seller@example.com"}
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
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        </label>

        {isRegister && (
          <div>
            <span style={{ display: 'block', marginBottom: '6px', color: '#30446f', fontWeight: 600 }}>
              Тип аккаунта
            </span>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${roleSelection === 'buyer' ? 'active' : ''}`}
                onClick={() => setRoleSelection('buyer')}
              >
                🛍️ Покупатель
              </button>
              <button
                type="button"
                className={`role-btn ${roleSelection === 'seller' ? 'active' : ''}`}
                onClick={() => setRoleSelection('seller')}
              >
                💼 Продавец
              </button>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? (isRegister ? 'Регистрация...' : 'Входим...') : (isRegister ? 'Зарегистрироваться' : 'Войти')}
        </button>
      </form>
    </section>
  );
}
