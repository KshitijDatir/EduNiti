import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="border-b border-surface-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-lg font-semibold text-primary-600">
          NeuraMach.AI
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-surface-800">{user?.name || user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-surface-200 px-3 py-1.5 text-sm font-medium text-surface-800 hover:bg-surface-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
