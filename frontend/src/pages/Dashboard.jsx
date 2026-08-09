import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">Knowledge Base Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Keluar
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-slate-700">Halo, <span className="font-semibold">{user?.full_name || user?.email}</span>!</p>
          <p className="text-sm text-slate-500">Role Anda: <span className="uppercase font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{user?.role}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;