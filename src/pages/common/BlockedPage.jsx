import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

export function BlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <section className="card auth-card">
      <h1>Аккаунт заблокирован</h1>
      <p>Администратор ограничил доступ к интерфейсам маркетплейса.</p>
      <button type="button" onClick={handleSignOut}>Выйти</button>
    </section>
  );
}
