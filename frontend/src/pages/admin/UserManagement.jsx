import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  RefreshCw,
  Mail,
} from 'lucide-react';

const USERS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setError('');
      setLoading(true);

      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset ke halaman pertama ketika search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, {
        role: newRole,
      });

      fetchUsers();
    } catch (err) {
      alert('Gagal mengubah role pengguna.');
    }
  };

  // Filter berdasarkan nama, email, atau role
  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) => {
      const name = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const role = user.role?.toLowerCase() || '';

      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        role.includes(keyword)
      );
    });
  }, [users, search]);

  // Pagination
  const totalPages = Math.ceil(
    filteredUsers.length / USERS_PER_PAGE
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const adminCount = users.filter(
    (user) => user.role === 'ADMIN'
  ).length;

  const userCount = users.filter(
    (user) => user.role !== 'ADMIN'
  ).length;

  const getInitials = (name, email) => {
    if (name) {
      return name
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();
    }

    return email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="space-y-6">

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
                Manajemen User
              </span>
            </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            Manajemen Pengguna
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Kelola pengguna dan hak akses dalam sistem.
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchUsers}
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

        {/* Total Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Total Pengguna
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {users.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Users size={19} />
            </div>
          </div>
        </div>

        {/* Admin */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Administrator
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {adminCount}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <ShieldCheck size={19} />
            </div>
          </div>
        </div>

        {/* Regular Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Pengguna
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {userCount}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
              <UserRound size={19} />
            </div>
          </div>
        </div>

      </div>

      {/* ==================== MAIN CARD ==================== */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

        {/* ==================== TOOLBAR ==================== */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-neutral-100">
              Daftar Pengguna
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
              {filteredUsers.length} pengguna ditampilkan
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
              placeholder="Cari pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
            />
          </div>

        </div>

        {/* ==================== TABLE ==================== */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">

            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-neutral-800 dark:bg-neutral-950/60">

                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Pengguna
                </th>

                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Email
                </th>

                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Role
                </th>

              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">

              {/* Loading */}
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">

                    <div className="flex flex-col items-center justify-center">

                      <RefreshCw
                        size={22}
                        className="animate-spin text-slate-400 dark:text-neutral-500"
                      />

                      <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                        Memuat data pengguna...
                      </p>

                    </div>

                  </td>
                </tr>

              ) : filteredUsers.length === 0 ? (

                /* Empty State */
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
                        <Users
                          size={21}
                          className="text-slate-400 dark:text-neutral-500"
                        />
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-neutral-300">
                        {search
                          ? 'Pengguna tidak ditemukan'
                          : 'Belum ada pengguna'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-neutral-500">
                        {search
                          ? 'Coba gunakan kata kunci lain.'
                          : 'Data pengguna akan muncul di sini.'}
                      </p>

                    </div>

                  </td>
                </tr>

              ) : (

                /* User Rows */
                paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-neutral-800/40"
                  >

                    {/* ================= USER ================= */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                          {getInitials(u.full_name, u.email)}
                        </div>

                        {/* Name */}
                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-neutral-100">
                            {u.full_name || 'Tanpa nama'}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-neutral-500">
                            ID #{u.id}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* ================= EMAIL ================= */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-neutral-100">

                        <Mail
                          size={15}
                          className="shrink-0 text-slate-400 dark:text-neutral-600"
                        />

                        {u.email}

                      </div>

                    </td>

                    {/* ================= ROLE ================= */}
                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-violet-500'
                              : 'bg-slate-400 dark:bg-neutral-500'
                          }`}
                        />

                        {u.role}

                      </span>

                    </td>

                  </tr>
                ))

              )}

            </tbody>

          </table>
        </div>

        {/* ==================== PAGINATION ==================== */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

            {/* Result Info */}
            <p className="text-xs text-slate-500 dark:text-neutral-500">

              Menampilkan{' '}

              <span className="font-medium text-slate-700 dark:text-neutral-300">
                {(currentPage - 1) * USERS_PER_PAGE + 1}
              </span>

              {' - '}

              <span className="font-medium text-slate-700 dark:text-neutral-300">
                {Math.min(
                  currentPage * USERS_PER_PAGE,
                  filteredUsers.length
                )}
              </span>

              {' dari '}

              <span className="font-medium text-slate-700 dark:text-neutral-300">
                {filteredUsers.length}
              </span>

              {' pengguna'}

            </p>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">

                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
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
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
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
    </div>
  );
};

export default UserManagement;