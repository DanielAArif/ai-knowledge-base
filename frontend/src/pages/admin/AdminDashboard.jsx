import { useEffect, useState } from 'react';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, categories: 0, documents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, catRes, docRes] = await Promise.all([
          api.get('/admin/users').catch(() => ({ data: [] })),
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/documents').catch(() => ({ data: [] })),
        ]);

        setStats({
          users: usersRes.data.length || 0,
          categories: catRes.data.length || 0,
          documents: docRes.data.length || 0,
        });
      } catch (err) {
        console.error('Failed fetching stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard Overview</h1>

      {loading ? (
        <p className="text-slate-500">Memuat statistik...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-sm font-medium text-slate-500">Total Pengguna</p>
            <p className="text-3xl font-bold text-slate-800">{stats.users}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-sm font-medium text-slate-500">Kategori Dokumen</p>
            <p className="text-3xl font-bold text-slate-800">{stats.categories}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-sm font-medium text-slate-500">Dokumen Terunggah</p>
            <p className="text-3xl font-bold text-slate-800">{stats.documents}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;