import { useEffect, useState } from 'react';
import api from '../../api/axios';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [docsRes, catRes] = await Promise.all([
        api.get('/documents'),
        api.get('/categories'),
      ]);
      setDocuments(docsRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Gagal mengambil data dokumen.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !categoryId) {
      alert('Pilih file dan kategori terlebih dahulu!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category_id', categoryId);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      fetchData();
      alert('Dokumen berhasil diunggah!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus dokumen.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Manajemen Dokumen</h1>

      {/* Form Upload Dokumen */}
      <form onSubmit={handleUpload} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
        <h2 className="text-md font-semibold text-slate-800">Upload Dokumen Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Pilih File (PDF/TXT/DOCX)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="w-full text-xs text-slate-500 border border-slate-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kategori Dokumen</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? 'Mengunggah & Processing...' : 'Upload Dokumen'}
        </button>
      </form>

      {/* Tabel Daftar Dokumen */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="p-4">Nama File</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Status RAG</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-slate-500">Belum ada dokumen.</td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-800">{d.filename}</td>
                  <td className="p-4 text-slate-600">{d.category_name || '-'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Processed
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentManagement;