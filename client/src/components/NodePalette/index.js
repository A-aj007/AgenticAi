import { useState } from 'react';
import {
  Webhook,
  Play,
  Clock,
  Mail,
  Sparkles,
  Bot,
  MessageSquare,
  FileSpreadsheet,
  GitBranch,
  Search,
  Plus,
} from 'lucide-react';

export const paletteTemplates = [
  // Triggers
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'webhook',
    action: 'receive_payload',
    label: 'Webhook Trigger',
    icon: Webhook,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Triggers workflow via HTTP POST webhook',
    defaultConfig: { endpoint: '/api/v1/webhook', method: 'POST' },
  },
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'manual',
    action: 'start_run',
    label: 'Manual Trigger',
    icon: Play,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Run on demand from dashboard or API',
    defaultConfig: { triggerSource: 'dashboard' },
  },
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'schedule',
    action: 'run_cron',
    label: 'Cron Schedule',
    icon: Clock,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Execute periodically on cron schedule',
    defaultConfig: { cron: '0 9 * * 1-5' },
  },
  // AI Agents
  {
    type: 'ai_action',
    category: 'ai',
    provider: 'ai-model',
    action: 'summarize',
    label: 'AI Reasoning & LLM',
    icon: Sparkles,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Claude / Gemini LLM reasoning and synthesis',
    defaultConfig: { prompt: 'Analyze inputs and draft action summary', model: 'claude-3.5-sonnet' },
  },
  {
    type: 'ai_action',
    category: 'ai',
    provider: 'ai-model',
    action: 'classify',
    label: 'AI Classifier',
    icon: Bot,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Categorize sentiment, intent or urgency',
    defaultConfig: { categories: 'urgent, feature_request, general_inquiry' },
  },
  // Integrations
  {
    type: 'integration',
    category: 'integration',
    provider: 'gmail',
    action: 'send_email',
    label: 'Gmail Send Email',
    icon: Mail,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Send formatted email via OAuth',
    defaultConfig: { to: 'operator@agentflow.ai', subject: 'Workflow Notification' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'slack',
    action: 'post_message',
    label: 'Slack Notification',
    icon: MessageSquare,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    description: 'Post alert message to Slack channel',
    defaultConfig: { channel: '#ops-stream', message: 'Automation task completed.' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'discord',
    action: 'send_message',
    label: 'Discord Bot Alert',
    icon: Bot,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    description: 'Post notification to Discord server',
    defaultConfig: { channelId: 'general', message: '⚠️ Alert from Agentflow' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'google-sheets',
    action: 'append_row',
    label: 'Google Sheets Append',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Append row data to spreadsheet',
    defaultConfig: { spreadsheetId: 'spreadsheet_123', range: 'Sheet1!A1' },
  },
  // Logic
  {
    type: 'condition',
    category: 'logic',
    provider: 'condition',
    action: 'evaluate',
    label: 'Condition / Branch',
    icon: GitBranch,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    description: 'Evaluate true/false conditional branch',
    defaultConfig: { condition: '{{nodes.node-1.status}} === "success"' },
  },
];

export default function NodePalette({ onAddNode }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = paletteTemplates.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onDragStart = (event, nodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeTemplate));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-surface border-r border-surface-border flex flex-col h-full select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Node Palette</h3>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">
            Drag to Canvas
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes & actions..."
            className="w-full bg-surface-card border border-surface-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-1 text-[11px]">
          {['all', 'trigger', 'ai', 'integration', 'logic'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-surface-card text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onClick={() => onAddNode && onAddNode(item)}
              className={`p-3 rounded-xl bg-surface-card/60 hover:bg-surface-card border ${item.borderColor} hover:border-indigo-500/50 cursor-grab active:cursor-grabbing transition-all group shadow-sm flex items-start space-x-3`}
            >
              <div className={`p-2 rounded-lg ${item.bgColor} shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                    {item.label}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
