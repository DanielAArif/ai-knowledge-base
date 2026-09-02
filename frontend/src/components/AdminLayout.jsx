import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State global locking upload
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    if (isUploading) return;
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Ringkasan Dashboard', path: '/admin/dashboard' },
    { label: 'Chatbot AI', path: '/admin/chatbot' },
    { label: 'Manajemen User', path: '/admin/users' },
    { label: 'Manajemen Kategori', path: '/admin/categories' },
    { label: 'Manajemen Dokumen', path: '/admin/documents' },
  ];

  const isChatbotPage = location.pathname === '/admin/chatbot';

  return (
    <div className="h-screen w-screen bg-slate-100 flex overflow-hidden relative">
      {/* Sidebar Navigasi Utama Admin */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 flex-shrink-0 h-full">
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
                  to={isUploading ? '#' : item.path}
                  onClick={(e) => {
                    if (isUploading) e.preventDefault();
                  }}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400' : ''}`}
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
            disabled={isUploading}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors py-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className={`flex-1 h-full overflow-hidden ${isChatbotPage ? 'p-0' : 'p-8 overflow-y-auto'}`}>
        <Outlet context={{ onUploadingChange: setIsUploading }} />
      </main>

      {/* OVERLAY LOCK SCREEN & INDICATOR UPLOAD/PREPROCESSING */}
      {isUploading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center space-y-4">
            {/* Animated Loading Spinner */}
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Memproses Dokumen...</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mohon tunggu. Sistem sedang memproses dokumen.
              </p>
            </div>

            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-700">
              ⚠️ Jangan tutup browser atau berpindah halaman agar proses RAG tidak terputus.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;