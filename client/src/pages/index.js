import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  ArrowRight,
  Workflow,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  GitBranch,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="h-20 border-b border-surface-border/60 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">
              Agentflow<span className="text-indigo-400">_AI</span>
            </span>
            <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-mono">
              Agentic Automation Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            Launch Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Agentic Orchestration Engine (LangGraph Substrate)</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-[1.15]">
          Turn natural language prompts into{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            executable visual agent flows
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Describe your automation in plain English. Watch our AI synthesize nodes, edges, and schemas into a React Flow
          canvas, executed across a fixed chain of cooperating AI agents with full OAuth integrations and live event streaming.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <span>Open Operator Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-surface-card hover:bg-slate-800 text-slate-200 border border-surface-border font-semibold text-sm flex items-center justify-center space-x-2 transition"
          >
            <span>Register Operator Account</span>
          </Link>
        </div>

        {/* Multi-Agent Architecture Showcase */}
        <div className="mt-20 w-full">
          <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-6">
            Fixed 5-Stage Cooperating Agent Architecture
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-surface-card border border-purple-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Workflow className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">1. Planner Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Topological sort dependency resolver & confidence scoring.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-indigo-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">2. Execution Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Dispatches tools, LLMs, and variable interpolations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-emerald-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">3. Validation Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Schema verification & required output integrity checking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-amber-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <GitBranch className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">4. Recovery Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Failure classification & exponential backoff retry.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-cyan-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">5. Monitoring Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Live Socket.IO event broadcasting & audit logs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border/60 py-8 px-6 text-center text-xs text-slate-500">
        <p>Agentflow_AI — Autonomous Operations Automation &copy; 2026. Built with Next.js, Express, React Flow & LangGraph.</p>
      </footer>
    </div>
  );
}
