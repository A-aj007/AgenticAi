import {
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react';

const agentConfig = {
  planner: {
    label: 'Planner Agent',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: Compass,
    dot: 'bg-purple-400 ring-purple-400/30',
  },
  execution: {
    label: 'Execution Agent',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: Zap,
    dot: 'bg-indigo-400 ring-indigo-400/30',
  },
  validation: {
    label: 'Validation Agent',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
    dot: 'bg-emerald-400 ring-emerald-400/30',
  },
  recovery: {
    label: 'Recovery Agent',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    dot: 'bg-amber-400 ring-amber-400/30',
  },
  monitoring: {
    label: 'Monitoring Agent',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: Activity,
    dot: 'bg-cyan-400 ring-cyan-400/30',
  },
};

export default function ExecutionTimeline({ logs = [], isRunning = false }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400 animate-pulse" />
        <p className="text-sm font-medium">Awaiting execution stream events...</p>
        <p className="text-xs text-slate-600 mt-1">Multi-agent logs will render sequentially as nodes execute.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-border">
      {logs.map((log, index) => {
        const agent = agentConfig[log.agent] || agentConfig.monitoring;
        const Icon = agent.icon;
        const isError = log.level === 'error';
        const isWarning = log.level === 'warning';
        const isSuccess = log.level === 'success';

        return (
          <div key={log._id || index} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background ring-4 ${agent.dot} flex items-center justify-center`}
            />

            {/* Event Card */}
            <div
              className={`p-4 rounded-2xl bg-surface-card border transition-all ${
                isError
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : isSuccess
                  ? 'border-emerald-500/30'
                  : 'border-surface-border'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${agent.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{agent.label}</span>
                  </span>

                  {log.nodeId && (
                    <span className="font-mono text-[10px] bg-surface text-slate-400 px-2 py-0.5 rounded-md border border-surface-border">
                      Node: {log.nodeId}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p
                className={`text-xs leading-relaxed ${
                  isError ? 'text-rose-300 font-medium' : isWarning ? 'text-amber-300' : 'text-slate-200'
                }`}
              >
                {log.message}
              </p>

              {/* Metadata Payload if present */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-3 p-2.5 rounded-xl bg-surface/80 border border-surface-border/80 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isRunning && (
        <div className="relative pl-0 flex items-center space-x-2 text-xs text-indigo-400 font-medium animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <span>Active agent processing next step...</span>
        </div>
      )}
    </div>
  );
}
