import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  details?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare readonly props: Readonly<{ children: React.ReactNode }>;
  state: ErrorBoundaryState;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'Terjadi kesalahan pada aplikasi.';
    let details: string | undefined;

    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.error && parsed.operationType) {
        message = `Akses database ditolak atau gagal (${parsed.operationType} pada ${parsed.path || 'koleksi'}).`;
        details = parsed.error;
      }
    } catch {
      // Standard non-JSON error
    }

    return { hasError: true, message, details };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-white">Gangguan Koneksi Aplikasi</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{this.state.message}</p>
            {this.state.details && (
              <p className="text-[11px] font-mono bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-rose-300 break-words">
                {this.state.details}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Aplikasi</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
