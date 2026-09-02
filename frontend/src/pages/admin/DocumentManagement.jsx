import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';

// 1. Terima prop onUploadingChange dari parent layout
const DocumentManagement = () => {
  const { onUploadingChange } = useOutletContext() || {};
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [uploading, setUploading] = useState(false);

  // State untuk Modal Edit
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [updating, setUpdating] = useState(false);

  // Synchronize status uploading ke parent & cegah browser refresh/close
  useEffect(() => {
    if (onUploadingChange) {
      onUploadingChange(uploading);
    }

    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = ''; // Menampilkan konfirmasi bawaan browser
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading, onUploadingChange]);

  const fetchData = async () => {
    try {
      const [docsRes, catRes] = await Promise.all([
        api.get('/documents'),
        api.get('/categories'),
      ]);

      const docsData = Array.isArray(docsRes.data)
        ? docsRes.data
        : docsRes.data.items || docsRes.data.data || [];

      const catsData = Array.isArray(catRes.data)
        ? catRes.data
        : catRes.data.items || catRes.data.data || [];

      setDocuments(docsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Gagal mengambil data dokumen:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler Upload Dokumen Baru
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
      setCategoryId('');
      fetchData();
      alert('Dokumen berhasil diunggah dan diproses ke Vector Store!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  // Handler Hapus Dokumen
  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus dokumen.');
    }
  };

  // Handler Membuka Modal Edit
  const handleOpenEditModal = (doc) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title || doc.filename || doc.file_name || '');
    setEditCategoryId(doc.category_id || doc.categoryId || doc.category?.id || '');
  };

  // Handler Simpan Perubahan Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setUpdating(true);
    try {
      await api.put(`/documents/${selectedDoc.id}`, {
        title: editTitle,
        category_id: Number(editCategoryId),
      });

      alert('Dokumen berhasil diperbarui!');
      setSelectedDoc(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal memperbarui dokumen.');
    } finally {
      setUpdating(false);
    }
  };

  // Helpers
  const getDocumentName = (doc) => {
    return doc.filename || doc.file_name || doc.title || doc.name || 'Dokumen Tanpa Nama';
  };

  const getCategoryName = (doc) => {
    if (doc.category_name) return doc.category_name;
    if (doc.category && typeof doc.category === 'object') {
      return doc.category.name || doc.category.title || '-';
    }
    if (typeof doc.category === 'string') return doc.category;

    const targetCat = categories.find(
      (c) => String(c.id) === String(doc.category_id || doc.categoryId)
    );
    return targetCat ? targetCat.name : '-';
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
              disabled={uploading}
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="w-full text-xs text-slate-500 border border-slate-300 rounded-lg p-2 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kategori Dokumen</label>
            <select
              value={categoryId}
              disabled={uploading}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.title}
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
                  <td className="p-4 font-medium text-slate-800">
                    {getDocumentName(d)}
                  </td>
                  <td className="p-4 text-slate-600">
                    {getCategoryName(d)}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {d.status || 'Processed'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(d)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Edit
                    </button>
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

      {/* Modal Popup Edit Dokumen */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Edit Data Dokumen</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Judul / Nama Dokumen</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kategori Dokumen</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;