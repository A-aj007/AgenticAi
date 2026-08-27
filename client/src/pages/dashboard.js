import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import api from '../services/api';
import {
  Sparkles,
  Plus,
  Play,
  ArrowUpRight,
  Workflow,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/workflows/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">RUNNING</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">FAILED</span>;
      case 'PAUSED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">PAUSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-surface-card to-surface border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Autonomous Multi-Agent Orchestrator</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Operator Command Center</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Describe an automation or inspect live multi-agent graph executions across your workspace.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prompt Generator</span>
              </Link>
              <Link
                href="/workflows"
                className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-slate-800 text-slate-200 border border-surface-border text-xs font-semibold flex items-center space-x-2 transition"
              >
                <Workflow className="w-3.5 h-3.5 text-slate-400" />
                <span>All Workflows</span>
              </Link>
            </div>
          </div>

          {/* Metric Grid KPIs */}
          <MetricGrid stats={stats || {}} />

          {/* 2-Column Section: Recent Executions & Quick Automation Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Executions (2 Cols) */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-surface border border-surface-border shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Recent Agentic Executions</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live audit timeline and execution status</p>
                </div>
                <Link
                  href="/executions"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2">
                {!stats?.recentExecutions || stats.recentExecutions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No recent executions yet. Run an automation from the builder or workflow studio!
                  </div>
                ) : (
                  stats.recentExecutions.map((exec) => (
                    <Link
                      key={exec._id}
                      href={`/executions/${exec._id}`}
                      className="p-3 rounded-2xl bg-surface-card/60 hover:bg-surface-card border border-surface-border hover:border-indigo-500/40 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-xl bg-surface border border-surface-border text-slate-300">
                          <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate block">
                            {exec.workflowId?.name || 'Unnamed Workflow'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: #{exec._id.slice(-6)} • {new Date(exec.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'active'}
                        </span>
                        {getStatusBadge(exec.status)}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Automation Templates / AI Presets */}
            <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Prompt Generator Presets</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Click to generate complete visual graph</p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    title: 'Automate Invoice Processing',
                    desc: 'Extract invoice metadata, append to Google Sheets, alert Slack & Gmail.',
                    prompt: 'Extract invoice data from inbound webhook, append to Google Sheets, and notify finance channel on Slack',
                  },
                  {
                    title: 'Support Ticket Sentiment Routing',
                    desc: 'Analyze customer sentiment, classify priority, post alerts to Discord.',
                    prompt: 'Analyze customer ticket sentiment, classify urgency with AI, and post high priority alerts to Discord',
                  },
                  {
                    title: 'Lead Qualification & Email Outreach',
                    desc: 'Score incoming leads with Claude/Gemini and draft customized Gmail response.',
                    prompt: 'Qualify inbound sales leads on a schedule, enrich with AI reasoning, and send intro email via Gmail',
                  },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/workflows/builder?prompt=${encodeURIComponent(item.prompt)}`}
                    className="p-3.5 rounded-2xl bg-surface-card hover:bg-surface-card/80 border border-surface-border hover:border-violet-500/40 block transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-violet-300 transition">
                        {item.title}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 transition" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
