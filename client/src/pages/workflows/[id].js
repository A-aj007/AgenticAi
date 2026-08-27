import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import NodePalette from '../../components/NodePalette';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Save,
  Play,
  ArrowLeft,
  Copy,
  Trash2,
  Sliders,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    activeWorkflow,
    fetchWorkflowById,
    saveActiveWorkflow,
    isSaving,
    isLoading,
    addNode,
    selectedNode,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkflowById(id)
        .then((wf) => {
          setWorkflowName(wf.name);
          setWorkflowDesc(wf.description || '');
        })
        .catch(() => {});
    }
  }, [id, fetchWorkflowById]);

  const handleSave = async () => {
    try {
      await saveActiveWorkflow({
        name: workflowName,
        description: workflowDesc,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Failed to save workflow: ' + err.message);
    }
  };

  const handleExecute = async () => {
    setIsRunning(true);
    try {
      // Auto save before running
      await saveActiveWorkflow({
        name: workflowName,
        description: workflowDesc,
      });

      const res = await api.post(`/api/workflows/${id}/execute`, {
        inputs: { source: 'studio_canvas_trigger' },
      });

      const executionId = res.data.data._id;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert('Execution trigger error: ' + err.message);
      setIsRunning(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-3">
          {/* Editor Header Bar */}
          <div className="px-5 py-3 rounded-2xl bg-surface border border-surface-border shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Link
                href="/workflows"
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Workflow Name"
                  className="bg-transparent text-sm font-bold text-slate-100 focus:outline-none focus:bg-surface-card px-2 py-1 rounded-lg border border-transparent focus:border-surface-border w-full transition"
                />
                <p className="text-[11px] text-slate-500 px-2 truncate">
                  v{activeWorkflow?.version || 1}.0 • {activeWorkflow?.nodes?.length || 0} nodes
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saveSuccess ? 'Saved!' : 'Save Graph'}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={isRunning || !activeWorkflow?.nodes?.length}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Execute Agent Flow</span>
              </button>
            </div>
          </div>

          {/* Canvas + Panels 3-Pane Layout */}
          <div className="flex-1 rounded-3xl bg-surface border border-surface-border overflow-hidden shadow-2xl flex">
            {/* Left Node Palette */}
            <NodePalette onAddNode={(item) => addNode(item)} />

            {/* Center Visual Canvas */}
            <div className="flex-1 h-full relative">
              <WorkflowCanvas readOnly={false} />
            </div>

            {/* Right Node Config Inspector */}
            {selectedNode && <NodeConfigPanel />}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
