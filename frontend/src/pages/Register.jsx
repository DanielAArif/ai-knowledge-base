import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.fullName
      );

      setSuccess(
        'Pendaftaran berhasil! Mengalihkan ke halaman masuk...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Gagal melakukan pendaftaran. Silakan coba lagi.';

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) => {
    if (visible) {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

          {/* LEFT - BRAND PANEL */}
          <div className="hidden lg:flex bg-slate-900 text-white p-10 xl:p-12 flex-col justify-between min-h-[540px]">
            <div>
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
                  Simpan, atur, dan temukan dokumen Anda
                  dalam satu tempat.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                
              </div>
            </div>
          </div>

          {/* RIGHT - REGISTER */}
          <div className="px-7 py-7 sm:px-10 sm:py-8 lg:px-12 xl:px-16 flex items-center">
            <div className="w-full max-w-sm mx-auto">

              {/* MOBILE LOGO */}
              <div className="lg:hidden flex justify-center mb-8">
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

              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Buat akun baru
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Daftar untuk mulai mengelola dokumen Anda.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
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

              {/* SUCCESS */}
              {success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-600">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12l4 4L19 6"
                    />
                  </svg>

                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* NAMA */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Nama lengkap
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nama lengkap"
                    required
                    autoComplete="name"
                    className="
                      w-full
                      h-10.5
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

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@perusahaan.com"
                    required
                    autoComplete="email"
                    className="
                      w-full
                      h-10.5
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

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Kata sandi
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimal 6 karakter"
                      required
                      autoComplete="new-password"
                      className="
                        w-full
                        h-10.5
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
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Konfirmasi kata sandi
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword ? 'text' : 'password'
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi kata sandi"
                      required
                      autoComplete="new-password"
                      className="
                        w-full
                        h-10.5
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
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
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                {/* SUBMIT */}
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
                      Mendaftarkan...
                    </span>
                  ) : (
                    'Buat akun'
                  )}
                </button>
              </form>

              {/* LOGIN LINK */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Sudah memiliki akun?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Masuk
                  </Link>
                </p>
              </div>

              {/* FOOTER */}
              <div className="mt-7 pt-4 border-t border-slate-100">
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

export default Register;