import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import {
Search,
FolderOpen,
Plus,
RefreshCw,
Pencil,
Trash2,
FileText,
X,
} from 'lucide-react';

const CATEGORIES_PER_PAGE = 10;

const CategoryManagement = () => {
const [categories, setCategories] = useState([]);
const [name, setName] = useState('');
const [description, setDescription] = useState('');

const [loading, setLoading] = useState(true);
const [creating, setCreating] = useState(false);
const [error, setError] = useState('');

const [search, setSearch] = useState('');
const [currentPage, setCurrentPage] = useState(1);

// State untuk Modal Edit
const [selectedCategory, setSelectedCategory] = useState(null);
const [editName, setEditName] = useState('');
const [editDescription, setEditDescription] = useState('');
const [updating, setUpdating] = useState(false);

const fetchCategories = async () => {
try {
setError('');
setLoading(true);
  const response = await api.get('/categories');

  const data = Array.isArray(response.data)
    ? response.data
    : response.data.items || response.data.data || [];

  setCategories(data);
} catch (err) {
  console.error('Gagal memuat kategori:', err);
  setError('Gagal memuat daftar kategori.');
} finally {
  setLoading(false);
}

};

useEffect(() => {
fetchCategories();
}, []);

// Reset halaman ketika search berubah
useEffect(() => {
setCurrentPage(1);
}, [search]);

// ==================== CREATE ====================

const handleCreate = async (e) => {
e.preventDefault();

if (!name.trim()) return;

setCreating(true);

try {
  await api.post('/categories', {
    name: name.trim(),
    description: description.trim(),
  });

  setName('');
  setDescription('');

  await fetchCategories();
} catch (err) {
  alert(
    err.response?.data?.detail ||
      'Gagal membuat kategori.'
  );
} finally {
  setCreating(false);
}

};

// ==================== DELETE ====================

const handleDelete = async (id) => {
if (
!confirm(
'Apakah Anda yakin ingin menghapus kategori ini?'
)
) {
return;
}

try {
  await api.delete(`/categories/${id}`);
  await fetchCategories();
} catch (err) {
  alert('Gagal menghapus kategori.');
}

};

// ==================== EDIT ====================

const handleOpenEditModal = (category) => {
setSelectedCategory(category);
setEditName(category.name || '');
setEditDescription(category.description || '');
};

const handleCloseEditModal = () => {
if (updating) return;

setSelectedCategory(null);
setEditName('');
setEditDescription('');

};

const handleSaveEdit = async (e) => {
e.preventDefault();


if (!selectedCategory || !editName.trim()) return;

setUpdating(true);

try {
  await api.put(`/categories/${selectedCategory.id}`, {
    name: editName.trim(),
    description: editDescription.trim(),
  });

  setSelectedCategory(null);
  setEditName('');
  setEditDescription('');

  await fetchCategories();
} catch (err) {
  alert(
    err.response?.data?.detail ||
      'Gagal memperbarui kategori.'
  );
} finally {
  setUpdating(false);
}

};

// ==================== SEARCH ====================

const filteredCategories = useMemo(() => {
const keyword = search.toLowerCase().trim();


if (!keyword) return categories;

return categories.filter((category) => {
  const categoryName =
    category.name?.toLowerCase() || '';

  const description =
    category.description?.toLowerCase() || '';

  return (
    categoryName.includes(keyword) ||
    description.includes(keyword)
  );
});


}, [categories, search]);

// ==================== PAGINATION ====================

const totalPages = Math.ceil(
filteredCategories.length / CATEGORIES_PER_PAGE
);

const paginatedCategories = filteredCategories.slice(
(currentPage - 1) * CATEGORIES_PER_PAGE,
currentPage * CATEGORIES_PER_PAGE
);

// ==================== STATISTICS ====================

const totalCategories = categories.length;

const categoriesWithDescription = categories.filter(
(category) => category.description?.trim()
).length;

const categoriesWithoutDescription =
totalCategories - categoriesWithDescription;

// ==================== RENDER ====================

return ( <div className="space-y-6">


  {/* ==================== HEADER ==================== */}
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

    <div>
      {/* Breadcrumb */}
      <div className="
              flex
              items-center
              gap-2
              text-[11px]
              font-medium
              text-slate-400 dark:text-slate-500
              mb-1
            ">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-500 dark:text-slate-400">
                Manajemen Kategori
              </span>
            </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
        Manajemen Kategori Dokumen
      </h1>

      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Kelola kategori yang digunakan untuk mengorganisasi dokumen.
      </p>
    </div>

    {/* Refresh */}
    <button
      onClick={fetchCategories}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <RefreshCw
        size={16}
        className={loading ? 'animate-spin' : ''}
      />

      Refresh
    </button>

  </div>

  {/* ==================== ERROR ==================== */}
  {error && (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
      {error}
    </div>
  )}

  {/* ==================== STATISTICS ==================== */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

    {/* Total Categories */}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            Total Kategori
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            {totalCategories}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
          <FolderOpen size={19} />
        </div>

      </div>

    </div>

    {/* With Description */}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            Dengan Deskripsi
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            {categoriesWithDescription}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <FileText size={19} />
        </div>

      </div>

    </div>

    {/* Without Description */}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            Tanpa Deskripsi
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            {categoriesWithoutDescription}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
          <FolderOpen size={19} />
        </div>

      </div>

    </div>

  </div>

  {/* ==================== CREATE CATEGORY ==================== */}
  <form
    onSubmit={handleCreate}
    className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
  >

    <div className="border-b border-slate-200 px-6 py-4 dark:border-neutral-800">

      <div className="flex items-center gap-2">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
          <Plus size={17} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-neutral-100">
            Tambah Kategori
          </h2>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
            Tambahkan kategori baru untuk mengorganisasi dokumen.
          </p>
        </div>

      </div>

    </div>

    <div className="p-6">

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Name */}
        <div>

          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
            Nama Kategori
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Contoh: Finansial, HR, IT"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
          />

        </div>

        {/* Description */}
        <div>

          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
            Deskripsi Ringkas
          </label>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan kategori"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
          />

        </div>

      </div>

      <div className="mt-4 flex justify-end">

        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >

          {creating ? (
            <>
              <RefreshCw
                size={16}
                className="animate-spin"
              />
              Menyimpan...
            </>
          ) : (
            <>
              <Plus size={16} />
              Simpan Kategori
            </>
          )}

        </button>

      </div>

    </div>

  </form>

  {/* ==================== MAIN CARD ==================== */}
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

    {/* ==================== TOOLBAR ==================== */}
    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

      <div>

        <h2 className="font-semibold text-slate-900 dark:text-neutral-100">
          Daftar Kategori
        </h2>

        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
          {filteredCategories.length} kategori ditampilkan
        </p>

      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">

        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
        />

        <input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
        />

      </div>

    </div>

    {/* ==================== TABLE ==================== */}
    <div className="overflow-x-auto">

      <table className="w-full min-w-[750px] text-left">

        <thead>

          <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-neutral-800 dark:bg-neutral-950/60">

            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
              Kategori
            </th>

            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
              Deskripsi
            </th>

            <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">

          {/* Loading */}
          {loading ? (

            <tr>

              <td
                colSpan="3"
                className="px-6 py-12 text-center"
              >

                <div className="flex flex-col items-center justify-center">

                  <RefreshCw
                    size={22}
                    className="animate-spin text-slate-400 dark:text-neutral-500"
                  />

                  <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                    Memuat data kategori...
                  </p>

                </div>

              </td>

            </tr>

          ) : filteredCategories.length === 0 ? (

            /* Empty State */
            <tr>

              <td
                colSpan="3"
                className="px-6 py-12 text-center"
              >

                <div className="flex flex-col items-center justify-center">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">

                    <FolderOpen
                      size={21}
                      className="text-slate-400 dark:text-neutral-500"
                    />

                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-700 dark:text-neutral-300">
                    {search
                      ? 'Kategori tidak ditemukan'
                      : 'Belum ada kategori'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-neutral-500">
                    {search
                      ? 'Coba gunakan kata kunci lain.'
                      : 'Kategori yang dibuat akan muncul di sini.'}
                  </p>

                </div>

              </td>

            </tr>

          ) : (

            /* Category Rows */
            paginatedCategories.map((category) => (

              <tr
                key={category.id}
                className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-neutral-800/40"
              >

                {/* Category */}
                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                      <FolderOpen size={17} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-neutral-100">
                        {category.name}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-neutral-500">
                        ID #{category.id}
                      </p>

                    </div>

                  </div>

                </td>

                {/* Description */}
                <td className="px-6 py-4">

                  <p className="max-w-lg text-sm text-slate-600 dark:text-neutral-400">
                    {category.description || '-'}
                  </p>

                </td>

                {/* Actions */}
                <td className="px-6 py-4">

                  <div className="flex items-center justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEditModal(category)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(category.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

    {/* ==================== PAGINATION ==================== */}
    {!loading && filteredCategories.length > 0 && (

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

        {/* Result Info */}
        <p className="text-xs text-slate-500 dark:text-neutral-500">

          Menampilkan{' '}

          <span className="font-medium text-slate-700 dark:text-neutral-300">
            {(currentPage - 1) *
              CATEGORIES_PER_PAGE +
              1}
          </span>

          {' - '}

          <span className="font-medium text-slate-700 dark:text-neutral-300">
            {Math.min(
              currentPage * CATEGORIES_PER_PAGE,
              filteredCategories.length
            )}
          </span>

          {' dari '}

          <span className="font-medium text-slate-700 dark:text-neutral-300">
            {filteredCategories.length}
          </span>

          {' kategori'}

        </p>

        {/* Pagination Controls */}
        {totalPages > 1 && (

          <div className="flex items-center gap-1">

            {/* Previous */}
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Halaman sebelumnya"
            >
              ‹
            </button>

            {/* Page Numbers */}
            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (

              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                  currentPage === page
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {page}
              </button>

            ))}

            {/* Next */}
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    totalPages
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Halaman berikutnya"
            >
              ›
            </button>

          </div>

        )}

      </div>

    )}

  </div>

  {/* ==================== EDIT MODAL ==================== */}
  {selectedCategory && (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseEditModal();
        }
      }}
    >

      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/60">

          <div>

            <h3 className="font-semibold text-slate-900 dark:text-neutral-100">
              Edit Kategori
            </h3>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
              Perbarui informasi kategori dokumen.
            </p>

          </div>

          <button
            type="button"
            onClick={handleCloseEditModal}
            disabled={updating}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>

        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSaveEdit}
          className="space-y-4 p-6"
        >

          {/* Name */}
          <div>

            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
              Nama Kategori
            </label>

            <input
              type="text"
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value)
              }
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
            />

          </div>

          {/* Description */}
          <div>

            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
              Deskripsi Kategori
            </label>

            <textarea
              value={editDescription}
              onChange={(e) =>
                setEditDescription(e.target.value)
              }
              rows="4"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
            />

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800">

            <button
              type="button"
              onClick={handleCloseEditModal}
              disabled={updating}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {updating ? (
                <>
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Pencil size={14} />
                  Simpan Perubahan
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  )}

</div>
);
};

export default CategoryManagement;
