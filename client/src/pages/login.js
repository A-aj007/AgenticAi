import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please provide both email and password');
      return;
    }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  const autofillDemo = () => {
    setEmail('operator@agentflow.ai');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-500 to-accent-cyan flex items-center justify-center shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">Operator Authentication</h2>
        <p className="mt-1 text-xs text-slate-400">Sign in to your Agentflow_AI command console</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="p-8 bg-surface border border-surface-border rounded-3xl shadow-2xl shadow-black/40">
          {(error || localError) && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agentflow.ai"
                  className="w-full bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Button */}
          <div className="mt-6 pt-6 border-t border-surface-border">
            <button
              type="button"
              onClick={autofillDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border/80 text-indigo-300 text-xs font-medium flex items-center justify-center space-x-2 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autofill Demo Credentials (operator@agentflow.ai)</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an operator account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
