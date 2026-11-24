import React, { useState } from 'react';
import { Lock, KeyRound, User, Eye, EyeOff, ShieldAlert, ArrowRight, X, Cloud, LogIn } from 'lucide-react';
import { signInWithGoogle, signOutFirebase } from '../firebase';
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
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
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
        sessionStorage.setItem('simposium_admin_auth', 'true');
        if (rememberMe) {
          localStorage.setItem('simposium_admin_auth', 'true');
        }
        onLoginSuccess(true);
      } else {
        await signOutFirebase();
        setErrorMsg(
          `Akun Google (${user.email || 'tidak diketahui'}) belum terdaftar sebagai Administrator. Silakan masuk dengan akun panitia (pranowo.tfc@gmail.com).`
        );
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(`Gagal login Google Admin: ${msg || 'Silakan coba kembali.'}`);
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
      const isUserValid = validUsers.includes(normalizedUser) || normalizedUser === 'admin';
      const isPassValid = password === storedPassword || password === 'admin123';

      if (isUserValid && isPassValid) {
        sessionStorage.setItem('simposium_admin_auth', 'true');
        if (rememberMe) {
          localStorage.setItem('simposium_admin_auth', 'true');
        }
        onLoginSuccess(false);
      } else {
        setErrorMsg('Username atau password admin salah. Silakan coba kembali.');
      }
    }, 300);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword(localStorage.getItem('simposium_admin_password') || 'admin123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup dialog login"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  AKSES TERBATAS
                </span>
                <span className="text-xs text-slate-400 font-medium">Panitia & Pengelola</span>
              </div>
              <h2 id="admin-login-title" className="text-lg font-black text-white mt-0.5">
                Login Administrator
              </h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cloud Database Google Admin Login (Primary) */}
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                Sinkronisasi Cloud Database (Firebase)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Masuk dengan akun Google Admin (<strong className="text-white">pranowo.tfc@gmail.com</strong>) agar setiap perubahan jadwal, pembicara, atau broadcast langsung tersimpan ke database dan tampil di semua HP peserta.
            </p>
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isGoogleLoading ? 'Memverifikasi Akun Google...' : 'Masuk Admin dengan Google (Cloud Sync)'}</span>
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Atau Mode Lokal Perangkat
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Username atau Email Admin</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: admin"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Password Admin</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Quick hint */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className="text-amber-400 hover:text-amber-300 font-bold hover:underline text-[11px]"
              >
                Gunakan Default
              </button>
            </div>

            {/* Credential Helper Box */}
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
              <div className="font-mono text-amber-300 flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                <span>User: <strong className="text-white font-bold">admin</strong></span>
                <span>Pass: <strong className="text-white font-bold">admin123</strong></span>
              </div>
              <p className="text-[10px] text-slate-400">
                *Login lokal hanya menyimpan perubahan di browser ini. Gunakan Login Google di atas untuk sinkronisasi ke database cloud.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk Mode Lokal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
