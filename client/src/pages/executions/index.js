import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Filter,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  PauseCircle,
  XCircle,
} from 'lucide-react';

export default function ExecutionsIndexPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchExecutions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/api/executions', {
        params: { status: statusFilter, page, limit: 15 },
      });
      setExecutions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.warn('Executions fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [statusFilter]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleExecutionUpdate = () => {
      fetchExecutions(pagination.page);
    };

    socket.on('execution:event', handleExecutionUpdate);
    return () => {
      socket.off('execution:event', handleExecutionUpdate);
    };
  }, [pagination.page]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <PauseCircle className="w-3 h-3" />
            <span>PAUSED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <XCircle className="w-3 h-3" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
                <PlayCircle className="w-6 h-6 text-indigo-400" />
                <span>Execution Runs & Audit Trail</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time multi-agent execution audit history and live step timelines.
              </p>
            </div>

            <button
              onClick={() => fetchExecutions(pagination.page)}
              className="p-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Status:</span>
              </span>
              {['all', 'COMPLETED', 'RUNNING', 'FAILED', 'PAUSED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-surface-card text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Total: {pagination.total} executions
            </span>
          </div>

          {/* Executions Table */}
          <div className="rounded-3xl bg-surface border border-surface-border overflow-hidden shadow-2xl">
            {loading ? (
              <div className="text-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-400 mb-2" />
                <p className="text-xs font-medium">Fetching execution records...</p>
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-20 p-6 text-slate-500">
                <PlayCircle className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-slate-200">No execution runs recorded</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Run an automation from the workflows studio to generate real-time execution logs.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-card/60 text-slate-400 border-b border-surface-border text-[11px] uppercase font-mono tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Workflow</th>
                      <th className="py-3.5 px-6">Execution ID</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Duration</th>
                      <th className="py-3.5 px-6">Triggered At</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {executions.map((exec) => (
                      <tr
                        key={exec._id}
                        className="hover:bg-surface-card/40 transition group cursor-pointer"
                        onClick={() => window.location.assign(`/executions/${exec._id}`)}
                      >
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-200 group-hover:text-indigo-300 transition block">
                            {exec.workflowId?.name || 'Automated Flow'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {exec.workflowSnapshot?.nodes?.length || 0} nodes
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-400">
                          #{exec._id.slice(-8)}
                        </td>

                        <td className="py-4 px-6">{getStatusBadge(exec.status)}</td>

                        <td className="py-4 px-6 font-mono text-slate-300">
                          {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'active'}
                        </td>

                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {new Date(exec.createdAt).toLocaleString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/executions/${exec._id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-indigo-600 text-slate-300 hover:text-white border border-surface-border transition font-medium"
                          >
                            <span>Live View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
