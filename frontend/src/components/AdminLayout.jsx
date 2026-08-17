import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Ringkasan Dashboard', path: '/admin/dashboard' },
    { label: 'Manajemen User', path: '/admin/users' },
    { label: 'Manajemen Kategori', path: '/admin/categories' },
    { label: 'Manajemen Dokumen', path: '/admin/documents' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Navigasi */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="px-2 pt-2">
            <h2 className="text-lg font-bold text-white tracking-wide">KB Admin Panel</h2>
            <p className="text-xs text-slate-400">Enterprise AI Portal</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Stats & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3 px-2">
          <div>
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.email}</p>
            <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
              ADMIN
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors py-1"
          >
            ← Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;