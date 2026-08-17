import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500 font-medium">Memuat data akses...</p>
      </div>
    );
  }

  // Ambil role dan ubah ke huruf kecil
  const roleRaw = typeof user?.role === 'string' ? user.role : user?.role?.value;
  const userRole = (roleRaw || '').toLowerCase();

  // Jika bukan 'admin', kunci dan lempar balik ke /dashboard biasa
  if (!user || userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminProtectedRoute;