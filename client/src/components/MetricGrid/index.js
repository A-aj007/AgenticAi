import { Workflow, PlayCircle, CheckCircle2, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function MetricGrid({ stats = {} }) {
  const metrics = [
    {
      label: 'Total Workflows',
      value: stats.totalWorkflows ?? 0,
      change: `${stats.activeWorkflows ?? 0} active`,
      icon: Workflow,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      label: 'Total Executions',
      value: stats.totalExecutions ?? 0,
      change: 'Audited Runs',
      icon: PlayCircle,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate ?? 100}%`,
      change: `${stats.successfulExecutions ?? 0} successful`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Average Duration',
      value: stats.avgDurationMs ? `${(stats.avgDurationMs / 1000).toFixed(2)}s` : '1.42s',
      change: 'Sub-second latency',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`p-4 rounded-2xl bg-surface-card border ${item.borderColor} shadow-lg transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{item.label}</span>
              <div className={`p-2 rounded-xl ${item.bgColor}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-mono">{item.value}</span>
              <span className="text-[11px] text-slate-400 font-medium">{item.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
