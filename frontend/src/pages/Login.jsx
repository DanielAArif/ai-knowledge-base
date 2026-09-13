import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);

      const roleRaw =
        typeof userData?.role === 'string'
          ? userData.role
          : userData?.role?.value;

      const userRole = (roleRaw || '').toLowerCase();

      console.log('LOGIN SUCCESS!', { userData, userRole });

      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login Error:', err);

      const errorMsg =
        err.response?.data?.detail ||
        'Email atau kata sandi salah. Silakan coba lagi.';

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">

      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

          {/* =====================================================
              LEFT - BRAND PANEL
          ====================================================== */}
          <div className="hidden lg:flex bg-slate-900 text-white p-10 xl:p-12 flex-col justify-between min-h-[520px]">

            <div>
              {/* Logo */}
              <Link
                to="/"
                className="inline-flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-sm">
                    D
                  </span>
                </div>

                <span className="text-lg font-semibold tracking-tight">
                  DokuMind
                </span>
              </Link>

              {/* Main copy */}
              <div className="mt-16 max-w-sm">
                <p className="text-sm text-slate-400 mb-4">
                  Pusat Dokumen
                </p>

                <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
                  Kelola dokumen,
                  <br />
                  lebih mudah.
                </h2>

                <p className="mt-5 text-sm leading-6 text-slate-400">
                  Simpan, kelola, dan temukan informasi dari
                  dokumen Anda dengan lebih mudah.
                </p>
              </div>
            </div>

            {/* Bottom */}
            <div>

            </div>
          </div>

          {/* =====================================================
              RIGHT - LOGIN
          ====================================================== */}
          <div className="px-7 py-7 sm:px-10 sm:py-8 lg:px-12 xl:px-16 flex items-center">

            <div className="w-full max-w-sm mx-auto">

              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-10">
                <Link
                  to="/"
                  className="flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      D
                    </span>
                  </div>

                  <span className="text-xl font-semibold tracking-tight text-slate-900">
                    DokuMind
                  </span>
                </Link>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Selamat datang kembali
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Masuk ke akun Anda untuk melanjutkan.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>

                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoComplete="email"
                    className="
                      w-full
                      h-11
                      px-3.5
                      rounded-lg
                      border border-slate-300
                      bg-white
                      text-sm text-slate-900
                      placeholder:text-slate-400
                      outline-none
                      transition
                      hover:border-slate-400
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/10
                    "
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Kata sandi
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      required
                      autoComplete="current-password"
                      className="
                        w-full
                        h-11
                        px-3.5
                        pr-11
                        rounded-lg
                        border border-slate-300
                        bg-white
                        text-sm text-slate-900
                        placeholder:text-slate-400
                        outline-none
                        transition
                        hover:border-slate-400
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-500/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        hover:text-slate-700
                        transition
                      "
                    >
                      {showPassword ? (
                        /* Eye Off */
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.9 5.1A10.7 10.7 0 0112 4.9c5 0 8.5 3.5 9.8 7.1a11.8 11.8 0 01-2.3 3.8"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.1 6.1C4.3 7.4 3.1 9.2 2.2 12c1.3 3.6 4.8 7.1 9.8 7.1 1.5 0 2.9-.3 4.1-.8"
                          />
                        </svg>
                      ) : (
                        /* Eye */
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.2 12C3.5 8.4 7 4.9 12 4.9s8.5 3.5 9.8 7.1c-1.3 3.6-4.8 7.1-9.8 7.1S3.5 15.6 2.2 12z"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>

                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    h-11
                    rounded-lg
                    bg-blue-600
                    text-white
                    text-sm
                    font-medium
                    shadow-sm
                    transition-all
                    hover:bg-blue-700
                    hover:shadow
                    active:scale-[0.99]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </button>
              </form>

              {/* Register */}
              <div className="mt-7 text-center">
                <p className="text-sm text-slate-500">
                  Belum memiliki akun?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Daftar
                  </Link>
                </p>
              </div>

              {/* Footer */}
              <div className="mt-10 pt-5 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400">
                  © 2026 DokuMind
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;