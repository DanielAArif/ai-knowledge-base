import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Users,
  FolderOpen,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isUploading, setIsUploading] = useState(false);

  // =========================================================
  // DARK / LIGHT MODE
  // =========================================================
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // =========================================================
  // LOGOUT
  // =========================================================
  const handleLogout = () => {
    if (isUploading) return;

    logout();
    navigate('/login');
  };

  // =========================================================
  // NAVIGATION
  // =========================================================
  const navItems = [
    {
      label: 'Dashboard',
      description: 'Overview sistem',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Chatbot AI',
      description: 'AI assistant',
      path: '/admin/chatbot',
      icon: Bot,
    },
    {
      label: 'Manajemen User',
      description: 'Kelola pengguna',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Kategori',
      description: 'Organisasi dokumen',
      path: '/admin/categories',
      icon: FolderOpen,
    },
    {
      label: 'Dokumen',
      description: 'Knowledge base',
      path: '/admin/documents',
      icon: FileText,
    },
  ];

  const isChatbotPage = location.pathname === '/admin/chatbot';

  const initials = (
    user?.full_name ||
    user?.email ||
    '?'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-neutral-950 flex overflow-hidden relative transition-colors duration-200">

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside className="
        w-[260px]
        bg-white dark:bg-neutral-950
        border-r border-slate-200 dark:border-neutral-800
        flex flex-col
        flex-shrink-0
        h-full
        transition-colors duration-200
      ">

        {/* BRAND */}
        <div className="px-5 pt-6 pb-5">

          <div className="flex items-center gap-3">

            <div className="
              w-9 h-9
              rounded-xl
              bg-blue-600
              flex items-center justify-center
              shadow-sm shadow-blue-200 dark:shadow-none
            ">
              <ShieldCheck
                size={19}
                strokeWidth={2}
                className="text-white"
              />
            </div>

            <div className="min-w-0">

              <h1 className="
                text-[15px]
                font-bold
                tracking-tight
                text-slate-900 dark:text-white
              ">
                Knowledge Base
              </h1>

              <p className="
                text-[11px]
                text-slate-400 dark:text-slate-500
                mt-0.5
              ">
                Admin Workspace
              </p>

            </div>

          </div>

        </div>

        {/* NAVIGATION */}
        <div className="flex-1 px-3 overflow-y-auto">

          <p className="
            px-3 mb-2
            text-[10px]
            font-semibold
            uppercase
            tracking-widest
            text-slate-400 dark:text-slate-500
          ">
            Workspace
          </p>

          <nav className="space-y-1">

            {navItems.map((item) => {

              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={isUploading ? '#' : item.path}
                  onClick={(e) => {
                    if (isUploading) {
                      e.preventDefault();
                    }
                  }}
                  className={`
                    group relative
                    flex items-center gap-3
                    px-3 py-2.5
                    rounded-xl
                    transition-all duration-150

                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }

                    ${
                      isUploading
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }
                  `}
                >

                  {/* ACTIVE INDICATOR */}
                  {isActive && (
                    <div className="
                      absolute
                      left-0
                      top-2
                      bottom-2
                      w-1
                      rounded-r-full
                      bg-blue-600
                    " />
                  )}

                  {/* ICON */}
                  <div className={`
                    flex h-8 w-8
                    items-center justify-center
                    rounded-lg
                    transition-colors

                    ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }
                  `}>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.8}
                    />
                  </div>

                  {/* TEXT */}
                  <div className="flex-1 min-w-0">

                    <p className={`
                      text-[13px]
                      font-semibold
                      truncate

                      ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }
                    `}>
                      {item.label}
                    </p>

                    <p className={`
                      text-[10px]
                      truncate
                      mt-0.5

                      ${
                        isActive
                          ? 'text-blue-500 dark:text-blue-500'
                          : 'text-slate-400 dark:text-slate-500'
                      }
                    `}>
                      {item.description}
                    </p>

                  </div>

                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="text-blue-400 dark:text-blue-500"
                    />
                  )}

                </Link>
              );
            })}

          </nav>

        </div>

        {/* =========================================================
            BOTTOM SIDEBAR
        ========================================================= */}
        <div className="p-3">

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            disabled={isUploading}
            className="
              w-full
              mb-3
              flex items-center justify-between
              rounded-xl
              border border-slate-200 dark:border-neutral-800
              bg-slate-50 dark:bg-neutral-900/70
              px-3 py-2.5
              transition-all duration-200
              hover:bg-slate-100 dark:hover:bg-slate-800
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >

            <div className="flex items-center gap-2.5">

              <div className="
                h-7 w-7
                rounded-lg
                bg-white dark:bg-slate-700
                border border-slate-200 dark:border-slate-600
                flex items-center justify-center
              ">
                {isDarkMode ? (
                  <Moon
                    size={14}
                    className="text-blue-400"
                  />
                ) : (
                  <Sun
                    size={14}
                    className="text-amber-500"
                  />
                )}
              </div>

              <div className="text-left">

                <p className="
                  text-[11px]
                  font-semibold
                  text-slate-700 dark:text-slate-200
                ">
                  Tampilan
                </p>

                <p className="
                  text-[9px]
                  text-slate-400 dark:text-slate-500
                ">
                  {isDarkMode ? 'Mode gelap' : 'Mode terang'}
                </p>

              </div>

            </div>

            {/* SWITCH */}
            <div className={`
              relative
              w-9 h-5
              rounded-full
              transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-blue-600'
                  : 'bg-slate-300'
              }
            `}>

              <div className={`
                absolute
                top-0.5
                w-4 h-4
                rounded-full
                bg-white
                shadow-sm
                transition-transform duration-200
                ${
                  isDarkMode
                    ? 'translate-x-[18px]'
                    : 'translate-x-0.5'
                }
              `} />

            </div>

          </button>

          {/* USER CARD */}
          <div className="
            rounded-xl
            border border-slate-200 dark:border-neutral-800
            bg-slate-50 dark:bg-neutral-900/60
            p-3
            transition-colors duration-200
          ">

            <div className="flex items-center gap-3">

              {/* AVATAR */}
              <div className="relative flex-shrink-0">

                <div className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-blue-600
                  text-xs
                  font-bold
                  text-white
                ">
                  {initials}
                </div>

                <span className="
                  absolute
                  -right-0.5
                  -bottom-0.5
                  h-2.5
                  w-2.5
                  rounded-full
                  border-2
                  border-slate-50
                  dark:border-neutral-800
                  bg-emerald-500"
                />

              </div>

              {/* USER INFO */}
              <div className="min-w-0 flex-1">

                <p className="
                  text-xs
                  font-semibold
                  text-slate-800 dark:text-white
                  truncate
                ">
                  {user?.full_name || user?.email || 'Admin'}
                </p>

                <p className="
                  text-[10px]
                  text-slate-400 dark:text-slate-500
                  mt-0.5
                ">
                  Administrator
                </p>

              </div>

            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              disabled={isUploading}
              className="
                mt-3
                w-full
                flex items-center justify-center gap-2
                rounded-lg
                border border-slate-200 dark:border-neutral-800
                bg-white dark:bg-neutral-950/70
                px-3 py-2
                text-xs
                font-medium
                text-slate-500 dark:text-neutral-400
                transition-all
                hover:border-red-200 dark:hover:border-red-900/50
                hover:bg-red-50 dark:hover:bg-red-500/10
                hover:text-red-600 dark:hover:text-red-400
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <LogOut
                size={14}
                strokeWidth={1.8}
              />

              Keluar
            </button>

          </div>

          <p className="
            text-[9px]
            text-center
            text-slate-300 dark:text-slate-700
            mt-3
          ">
            AI Knowledge Base · Admin
          </p>

        </div>

      </aside>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main
        className={`
          flex-1
          h-full
          min-w-0
          bg-slate-50 dark:bg-neutral-950
          transition-colors duration-200

          ${
            isChatbotPage
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto p-4 sm:p-5 lg:p-6'
          }
        `}
      >

        <Outlet
          context={{
            onUploadingChange: setIsUploading,
          }}
        />

      </main>

      {/* =========================================================
          UPLOAD / PROCESSING OVERLAY
      ========================================================= */}
      {isUploading && (
        <div className="
          fixed
          inset-0
          z-[9999]
          bg-slate-950/50
          dark:bg-black/70
          backdrop-blur-sm
          flex items-center justify-center
          p-4
        ">

          <div className="
            w-full
            max-w-sm
            rounded-2xl
            border border-slate-200 dark:border-neutral-800
            bg-white dark:bg-neutral-950
            shadow-2xl
            p-6
          ">

            {/* SPINNER */}
            <div className="flex justify-center mb-5">

              <div className="relative">

                <div className="
                  h-12 w-12
                  rounded-full
                  border-4
                  border-slate-100
                  dark:border-neutral-800
                  border-t-blue-600
                  animate-spin
                " />

                <div className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                ">
                  <Bot
                    size={16}
                    className="text-blue-600"
                  />
                </div>

              </div>

            </div>

            {/* TEXT */}
            <div className="text-center">

              <h3 className="
                text-base
                font-bold
                text-slate-900 dark:text-white
              ">
                Memproses dokumen
              </h3>

              <p className="
                text-xs
                text-slate-500 dark:text-neutral-400
                mt-1.5
                leading-relaxed
              ">
                Dokumen sedang diproses dan ditambahkan
                ke knowledge base AI.
              </p>

            </div>

            {/* PROGRESS */}
            <div className="mt-5">

              <div className="flex items-center justify-between mb-1.5">

                <span className="
                  text-[10px]
                  font-medium
                  text-slate-400
                ">
                  Processing
                </span>

                <span className="
                  text-[10px]
                  font-semibold
                  text-blue-600
                ">
                  Please wait...
                </span>

              </div>

              <div className="
                h-1.5
                w-full
                rounded-full
                bg-slate-100 dark:bg-neutral-900
                overflow-hidden
              ">
                <div className="
                  h-full
                  w-2/3
                  rounded-full
                  bg-blue-600
                  animate-pulse"
                />
              </div>

            </div>

            {/* WARNING */}
            <div className="
              mt-5
              flex gap-2
              rounded-xl
              border border-amber-100 dark:border-amber-900/40
              bg-amber-50 dark:bg-amber-500/10
              p-3
            ">

              <span className="text-sm leading-none">
                ⚠️
              </span>

              <p className="
                text-[10px]
                leading-relaxed
                text-amber-700 dark:text-amber-400
              ">
                Jangan tutup browser atau berpindah halaman
                selama proses berlangsung.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminLayout;