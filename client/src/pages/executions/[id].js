import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import ExecutionTimeline from '../../components/ExecutionTimeline';
import api from '../../services/api';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import {
  Play,
  Pause,
  XCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Cpu,
  Layers,
  FileCode,
  Activity,
  Loader2,
  Terminal,
} from 'lucide-react';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'outputs' | 'snapshot'

  const fetchExecutionData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/api/executions/${id}`),
        api.get(`/api/executions/${id}/timeline`),
      ]);
      setExecution(execRes.data.data);
      setLogs(timelineRes.data.data || []);
    } catch (err) {
      console.warn('Execution fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExecutionData();
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleEvent = (event) => {
          setLogs((prev) => [...prev, event]);
          // Refresh execution details on completion or error
          if (event.agent === 'monitoring' && (event.level === 'success' || event.level === 'error')) {
            api.get(`/api/executions/${id}`).then((res) => setExecution(res.data.data));
          }
        };

        socket.on('execution:event', handleEvent);
        return () => {
          socket.off('execution:event', handleEvent);
          leaveExecutionRoom(id);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    try {
      await api.post(`/api/executions/${id}/pause`);
      fetchExecutionData();
    } catch (err) {
      alert('Pause error: ' + err.message);
    }
  };

  const handleResume = async () => {
    try {
      await api.post(`/api/executions/${id}/resume`);
      fetchExecutionData();
    } catch (err) {
      alert('Resume error: ' + err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this running execution?')) return;
    try {
      await api.post(`/api/executions/${id}/cancel`);
      fetchExecutionData();
    } catch (err) {
      alert('Cancel error: ' + err.message);
    }
  };

  const isRunning = execution?.status === 'RUNNING' || execution?.status === 'PENDING';
  const isPaused = execution?.status === 'PAUSED';

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/executions"
                className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl font-bold text-slate-100">
                    Execution #{id?.slice(-8)}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      execution?.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : execution?.status === 'RUNNING'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                        : execution?.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {execution?.status || 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Workflow: <span className="text-slate-200 font-semibold">{execution?.workflowSnapshot?.name}</span>
                </p>
              </div>
            </div>

            {/* Execution Controls (Pause / Resume / Cancel) */}
            <div className="flex items-center space-x-3">
              {isRunning && (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
              )}

              {isPaused && (
                <button
                  onClick={handleResume}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Run</span>
                </button>
              )}

              {(isRunning || isPaused) && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Execution</span>
                </button>
              )}

              <button
                onClick={fetchExecutionData}
                title="Refresh state"
                className="p-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-400 hover:text-white transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <span className="text-[11px] text-slate-400 uppercase font-mono block">Runtime Duration</span>
              <span className="text-lg font-bold font-mono text-slate-100">
                {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'Processing...'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <span className="text-[11px] text-slate-400 uppercase font-mono block">Retry Count</span>
              <span className="text-lg font-bold font-mono text-indigo-400">
                {execution?.retryCount || 0} / {execution?.maxRetries || 3}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <span className="text-[11px] text-slate-400 uppercase font-mono block">LangGraph Engine</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {execution?.langGraphStatus || 'available'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <span className="text-[11px] text-slate-400 uppercase font-mono block">Total Steps</span>
              <span className="text-lg font-bold font-mono text-slate-200">
                {execution?.workflowSnapshot?.nodes?.length || 0} nodes
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-surface-border pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-surface-card text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Multi-Agent Live Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('outputs')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'outputs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-surface-card text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Node Outputs & Error Context</span>
            </button>

            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'snapshot'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-surface-card text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Workflow Snapshot JSON</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-2xl min-h-[400px]">
            {activeTab === 'timeline' && (
              <ExecutionTimeline logs={logs} isRunning={isRunning} />
            )}

            {activeTab === 'outputs' && (
              <div className="space-y-4 text-xs font-mono">
                {execution?.error && (
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-rose-300">
                    <h4 className="font-bold text-sm mb-1 text-rose-400">Error Classification & Escalation</h4>
                    <p className="mb-2">{execution.error.message}</p>
                    <pre className="text-[11px] bg-black/40 p-3 rounded-xl overflow-x-auto text-rose-200">
                      {JSON.stringify(execution.error, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-slate-300 font-bold font-sans">Accumulated Step Outputs:</h4>
                  <pre className="p-4 rounded-2xl bg-surface-card border border-surface-border text-slate-200 overflow-x-auto">
                    {JSON.stringify(execution?.outputs || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'snapshot' && (
              <div className="text-xs font-mono">
                <pre className="p-4 rounded-2xl bg-surface-card border border-surface-border text-slate-300 overflow-x-auto">
                  {JSON.stringify(execution?.workflowSnapshot || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
