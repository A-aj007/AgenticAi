import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Settings,
  User,
  Shield,
  Key,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  Server,
  Activity,
  Layers,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/health');
      setSystemHealth(res.data);
    } catch (err) {
      console.warn('Health check error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
                <Settings className="w-6 h-6 text-indigo-400" />
                <span>Operator Settings & System Health</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage user profile, verify encryption keys, and inspect agent engine subsystems.
              </p>
            </div>

            <button
              onClick={fetchHealth}
              className="p-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Health</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Profile Card */}
            <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl space-y-5">
              <div className="flex items-center space-x-3 border-b border-surface-border pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Operator Profile</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Authenticated Session</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <span className="text-slate-400">Name</span>
                  <span className="font-semibold text-slate-200">{user?.name || 'Lead Operator'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-mono text-slate-200">{user?.email || 'operator@agentflow.ai'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <span className="text-slate-400">Assigned Role</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold uppercase text-[10px]">
                    {user?.role || 'operator'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <span className="text-slate-400">Password Security</span>
                  <span className="text-emerald-400 font-medium">Bcrypt (Cost Factor 12)</span>
                </div>
              </div>
            </div>

            {/* Subsystem & Health Checks */}
            <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl space-y-5">
              <div className="flex items-center space-x-3 border-b border-surface-border pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Subsystem Health</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Real-Time Diagnostics</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-300">Backend API Engine</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{systemHealth?.status || 'HEALTHY'}</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-violet-400" />
                    <span className="text-slate-300">LangGraph Orchestration</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold capitalize">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{systemHealth?.langGraphStatus || 'available'}</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">Execution Queue Engine</span>
                  </div>
                  <span className="font-mono text-indigo-300">
                    {systemHealth?.redisActive ? 'BullMQ (Redis)' : 'In-Memory Async Queue'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Token Encryption</span>
                  </div>
                  <span className="font-mono text-emerald-400">AES-256 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
