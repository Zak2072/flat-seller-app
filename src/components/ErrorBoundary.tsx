import React from 'react';
import { AlertCircle, RefreshCcw, ShieldCheck } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred. Please try again later.";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.authInfo) {
            errorMessage = `Security Error: ${parsed.error}. Please check your permissions.`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy">Something went wrong</h1>
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 font-mono text-left break-words">
              {errorMessage}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCcw size={20} /> Reload App
            </button>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck size={14} /> Secure Vault Protection Active
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
