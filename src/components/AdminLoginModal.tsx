import React, { useState } from 'react';
import { Lock, KeyRound, User, Eye, EyeOff, ShieldAlert, ArrowRight, X, Cloud, LogIn } from 'lucide-react';
import { signInWithGoogle, signOutFirebase, formatFirebaseAuthError } from '../firebase';
import { ensureUserProfileAndCheckAdmin } from '../services/firestoreSyncService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (isCloudAdmin?: boolean) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleAdminLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      const { isAdmin } = await ensureUserProfileAndCheckAdmin(user);
      if (isAdmin) {
        onLoginSuccess(true);
      } else {
        await signOutFirebase();
        setErrorMsg(
          `Akun Google (${user.email || 'tidak diketahui'}) belum terdaftar sebagai Administrator. Silakan masuk dengan akun Google panitia yang berwenang.`
        );
      }
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      if (formatted) {
        setErrorMsg(`Gagal login Google Admin: ${formatted}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const storedPassword = localStorage.getItem('simposium_admin_password') || 'admin123';
    const normalizedUser = username.trim().toLowerCase();

    const validUsers = ['admin', 'pranowo.tfc@gmail.com', 'admin@simposium.id', 'panitia'];

    setTimeout(() => {
      setIsLoading(false);
      const isUserValid = validUsers.includes(normalizedUser);
      const isPassValid = password === storedPassword;

      if (isUserValid && isPassValid) {
        onLoginSuccess(false);
      } else {
        setErrorMsg('Username atau password admin salah. Silakan coba kembali.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-emerald-100 w-full max-w-md rounded-3xl shadow-2xl shadow-emerald-950/15 overflow-hidden text-slate-800 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50/90 p-5 sm:p-6 border-b border-emerald-100 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-900 hover:bg-emerald-100/70 transition-colors cursor-pointer"
            title="Tutup dialog login"
            aria-label="Tutup dialog login"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/25">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <span className="uppercase tracking-wider">Akses Terbatas</span>
                <span className="text-emerald-300" aria-hidden="true">·</span>
                <span className="text-slate-500 font-semibold">Panitia &amp; Pengelola</span>
              </div>
              <h2 id="admin-login-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Login Admin Page
              </h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-white">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Cloud Database Google Admin Login (Primary) */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                Login Admin Cloud (Firebase)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Masuk dengan akun Google Administrator untuk mengelola jadwal, pembicara, ruangan, atau broadcast dan menyinkronkannya langsung ke database Firebase.
            </p>
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={isGoogleLoading}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isGoogleLoading ? 'Memverifikasi Akun Google...' : 'Masuk Admin dengan Google'}</span>
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Atau Login Panitia
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Username atau Email Admin</span>
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email admin"
                className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Password Admin</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl pl-3.5 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk Admin Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
