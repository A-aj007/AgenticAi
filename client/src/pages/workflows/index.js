import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import {
  Workflow,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit,
  Search,
  Filter,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  Tag,
  Loader2,
} from 'lucide-react';

export default function WorkflowsIndexPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [runningId, setRunningId] = useState(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/workflows', {
        params: { search, status: selectedStatus },
      });
      setWorkflows(res.data.data || []);
    } catch (err) {
      console.warn('Error fetching workflows:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkflows();
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/api/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      alert('Failed to duplicate workflow: ' + err.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/api/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      alert('Failed to delete workflow: ' + err.message);
    }
  };

  const handleExecute = async (e, id) => {
    e.stopPropagation();
    setRunningId(id);
    try {
      const res = await api.post(`/api/workflows/${id}/execute`, { inputs: { source: 'dashboard_trigger' } });
      const executionId = res.data.data._id;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert('Failed to trigger execution: ' + err.message);
      setRunningId(null);
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
                <Workflow className="w-6 h-6 text-indigo-400" />
                <span>Workflow Operations Studio</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage, edit, version, and execute automated graph workflows.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-xs font-semibold text-violet-300 flex items-center space-x-2 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Prompt Builder</span>
              </Link>

              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/api/workflows', {
                      name: 'New Custom Automation',
                      description: 'Configure your custom trigger and action nodes on the canvas.',
                      nodes: [
                        {
                          id: 'node-1',
                          type: 'trigger',
                          position: { x: 100, y: 150 },
                          data: { label: 'Manual Trigger', category: 'trigger', provider: 'manual', action: 'start_run' },
                        },
                      ],
                      edges: [],
                    });
                    router.push(`/workflows/${res.data.data._id}`);
                  } catch (err) {
                    alert('Error creating workflow: ' + err.message);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Blank Workflow</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name, tag or description..."
                className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </form>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </span>
              {['all', 'active', 'draft', 'paused'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-surface-card text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Cards Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-400 mb-2" />
              <p className="text-xs font-medium">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-3xl border border-surface-border p-8">
              <Workflow className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-200">No workflows found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Generate an automation workflow from a prompt or create a new blank graph.
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <Link
                  href="/workflows/builder"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  Open Prompt Generator
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  onClick={() => router.push(`/workflows/${wf._id}`)}
                  className="p-5 rounded-3xl bg-surface hover:bg-surface-card/60 border border-surface-border hover:border-indigo-500/40 shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        v{wf.version || 1}.0
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          wf.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-1">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>

                    {/* Nodes & Trigger Info */}
                    <div className="mt-4 flex items-center space-x-4 text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{wf.nodes?.length || 0} nodes</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{wf.triggerConfig?.type || 'manual'}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {wf.tags && wf.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {wf.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-surface-card text-slate-300 px-2 py-0.5 rounded-md border border-surface-border/80"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-surface-border/60 flex items-center justify-between">
                    <button
                      onClick={(e) => handleExecute(e, wf._id)}
                      disabled={runningId === wf._id}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      {runningId === wf._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>Run Now</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDuplicate(e, wf._id)}
                        title="Duplicate workflow"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, wf._id)}
                        title="Delete workflow"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
