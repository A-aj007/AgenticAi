import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Webhook,
  Play,
  Clock,
  Sparkles,
  Bot,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  GitBranch,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const iconMap = {
  webhook: Webhook,
  manual: Play,
  schedule: Clock,
  'ai-model': Sparkles,
  ai_action: Sparkles,
  gmail: Mail,
  slack: MessageSquare,
  discord: Bot,
  'google-sheets': FileSpreadsheet,
  condition: GitBranch,
};

const categoryBadgeMap = {
  trigger: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  ai: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  integration: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  logic: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
};

function StandardCustomNode({ data, selected }) {
  const provider = data.provider || 'generic';
  const category = data.category || 'integration';
  const Icon = iconMap[provider] || Settings2;
  const badgeStyle = categoryBadgeMap[category] || categoryBadgeMap.integration;

  const nodeStatus = data.executionStatus; // 'idle' | 'running' | 'completed' | 'failed'

  return (
    <div
      className={`w-64 rounded-2xl bg-surface-card border transition-all duration-200 shadow-xl ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20'
          : 'border-surface-border hover:border-slate-600'
      }`}
    >
      {/* Incoming Connection Handle */}
      {category !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-indigo-500 !border-2 !border-surface-card"
        />
      )}

      {/* Node Header */}
      <div className="p-3.5 border-b border-surface-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg ${badgeStyle.bg} ${badgeStyle.border} border shrink-0`}>
            <Icon className={`w-4 h-4 ${badgeStyle.text}`} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-100 truncate block">
              {data.label || 'Action Step'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono capitalize block">
              {provider} • {data.action || 'run'}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        {nodeStatus === 'running' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
        {nodeStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        {nodeStatus === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
      </div>

      {/* Node Body / Config summary */}
      <div className="p-3 bg-surface/50 text-[11px] text-slate-400 rounded-b-2xl">
        {data.config?.channel && (
          <p className="truncate font-mono text-[10px] text-slate-300">Channel: {data.config.channel}</p>
        )}
        {data.config?.to && (
          <p className="truncate font-mono text-[10px] text-slate-300">To: {data.config.to}</p>
        )}
        {data.config?.spreadsheetId && (
          <p className="truncate font-mono text-[10px] text-slate-300">Sheet: {data.config.spreadsheetId}</p>
        )}
        {data.config?.prompt && (
          <p className="truncate text-slate-300 italic">"{data.config.prompt}"</p>
        )}
        {!data.config?.channel && !data.config?.to && !data.config?.spreadsheetId && !data.config?.prompt && (
          <p className="text-slate-500 italic">Click node to configure</p>
        )}
      </div>

      {/* Outgoing Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-surface-card"
      />
    </div>
  );
}

export const nodeTypes = {
  trigger: memo(StandardCustomNode),
  ai_action: memo(StandardCustomNode),
  integration: memo(StandardCustomNode),
  condition: memo(StandardCustomNode),
  logic: memo(StandardCustomNode),
};
