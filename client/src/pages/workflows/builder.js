import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Sparkles,
  ArrowRight,
  Save,
  Play,
  Layers,
  Wand2,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Loader2,
  Sliders,
  Zap,
  Mail,
  MessageSquare,
  Bot,
  FileSpreadsheet,
  Webhook,
  Clock,
  ChevronRight,
  X,
  Search,
} from 'lucide-react';

const SUGGESTIONS_CATALOG = [
  // Finance & Invoicing
  {
    category: 'Finance',
    title: 'Automated Invoice Processing & Ledger',
    prompt: 'Extract invoice data from inbound webhook, append to Google Sheets, and notify finance channel on Slack',
    integrations: ['webhook', 'google-sheets', 'slack', 'ai'],
    badge: 'Popular',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    category: 'Finance',
    title: 'Payment Receipt Parsing & Alerting',
    prompt: 'When a payment receipt email arrives, parse billing amount with AI and log transaction to Google Sheets',
    integrations: ['gmail', 'google-sheets', 'ai'],
    badge: 'Finance',
    icon: Mail,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  {
    category: 'Finance',
    title: 'Executive Revenue Summary & Email Dispatch',
    prompt: 'Read monthly revenue range from Google Sheets, summarize metrics with Claude, and email report to approvals@company.com',
    integrations: ['google-sheets', 'ai', 'gmail'],
    badge: 'Executive',
    icon: Mail,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },

  // Customer Support & Feedback
  {
    category: 'Support',
    title: 'Support Ticket Sentiment & Urgency Routing',
    prompt: 'Analyze customer support ticket sentiment, classify urgency with AI, and post high priority alerts to Discord',
    integrations: ['webhook', 'ai', 'discord'],
    badge: 'Support',
    icon: Bot,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
  },
  {
    category: 'Support',
    title: 'Customer Bug Escalation & Slack Alert',
    prompt: 'Classify inbound user feedback, extract bug details with LLM, and alert the #engineering-ops Slack channel',
    integrations: ['webhook', 'ai', 'slack'],
    badge: 'DevOps',
    icon: MessageSquare,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
  },
  {
    category: 'Support',
    title: 'Automated Customer Inquiry AI Response',
    prompt: 'When customer inquiry arrives, generate personalized AI draft response, send via Gmail, and append ticket to Google Sheets',
    integrations: ['gmail', 'ai', 'google-sheets'],
    badge: 'Support',
    icon: Mail,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },

  // Sales & Growth
  {
    category: 'Sales',
    title: 'Inbound Lead Scoring & Outreach Email',
    prompt: 'Qualify inbound sales leads on a schedule, enrich with AI reasoning, and send intro email via Gmail',
    integrations: ['schedule', 'ai', 'gmail', 'slack'],
    badge: 'Growth',
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    category: 'Sales',
    title: 'New Signup Form Lead Qualification',
    prompt: 'When a new lead fills out a webhook form, draft customized outreach email, log to Google Sheets, and notify growth team on Slack',
    integrations: ['webhook', 'ai', 'google-sheets', 'slack'],
    badge: 'Sales',
    icon: Webhook,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },

  // DevOps & System Monitoring
  {
    category: 'DevOps',
    title: 'Server Crash Webhook & Discord Incident Alert',
    prompt: 'Inbound server alert webhook, analyze error stack trace with Gemini AI, and dispatch incident alert to Discord channel',
    integrations: ['webhook', 'ai', 'discord'],
    badge: 'Incident',
    icon: Bot,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  {
    category: 'DevOps',
    title: 'Scheduled System Health Check & Slack Digest',
    prompt: 'Scheduled cron job every morning, check system status with AI summary, and post daily operational digest to #ops-stream',
    integrations: ['schedule', 'ai', 'slack'],
    badge: 'Daily Cron',
    icon: Clock,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },

  // Operations & HR
  {
    category: 'Operations',
    title: 'Employee Onboarding Multi-Channel Sequence',
    prompt: 'Onboarding webhook trigger: create employee row in Google Sheets, dispatch welcome Gmail, and send introduction to Slack',
    integrations: ['webhook', 'google-sheets', 'gmail', 'slack'],
    badge: 'HR Ops',
    icon: Layers,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const { generateFromPrompt, isGenerating, generatedPreview, setNodes, setEdges } = useWorkflowStore();

  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (router.query.prompt) {
      const qPrompt = String(router.query.prompt);
      setPrompt(qPrompt);
      handleGenerate(qPrompt);
    }
  }, [router.query.prompt]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = async (customPrompt) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse || !textToUse.trim()) return;

    setIsDropdownOpen(false);

    try {
      const result = await generateFromPrompt(textToUse);
      if (result) {
        setNodes(result.nodes || []);
        setEdges(result.edges || []);
      }
    } catch (err) {
      alert('Error generating workflow: ' + err.message);
    }
  };

  const handleSelectSuggestion = (suggestion, autoSynthesize = false) => {
    setPrompt(suggestion.prompt);
    setIsDropdownOpen(false);
    if (autoSynthesize) {
      handleGenerate(suggestion.prompt);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        handleSelectSuggestion(filteredSuggestions[selectedIndex], true);
      } else {
        handleGenerate();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Filter suggestions based on typed prompt
  const filteredSuggestions = SUGGESTIONS_CATALOG.filter((item) => {
    if (!prompt.trim()) return true;
    const query = prompt.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.prompt.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.integrations.some((intg) => intg.toLowerCase().includes(query))
    );
  });

  const handleSaveToStudio = async () => {
    if (!generatedPreview) return;
    setIsSaving(true);
    try {
      const res = await api.post('/api/workflows', {
        name: generatedPreview.name || 'AI Generated Automation',
        description: generatedPreview.description || prompt,
        nodes: generatedPreview.nodes || [],
        edges: generatedPreview.edges || [],
        tags: generatedPreview.tags || ['AI Generated'],
        triggerConfig: { type: generatedPreview.triggerType || 'manual' },
      });

      const workflowId = res.data.data._id;
      router.push(`/workflows/${workflowId}`);
    } catch (err) {
      alert('Failed to save workflow: ' + err.message);
      setIsSaving(false);
    }
  };

  const handleExecuteDirectly = async () => {
    if (!generatedPreview) return;
    setIsSaving(true);
    try {
      const saveRes = await api.post('/api/workflows', {
        name: generatedPreview.name || 'AI Generated Automation',
        description: generatedPreview.description || prompt,
        nodes: generatedPreview.nodes || [],
        edges: generatedPreview.edges || [],
        tags: generatedPreview.tags || ['AI Generated'],
        triggerConfig: { type: generatedPreview.triggerType || 'manual' },
      });

      const workflowId = saveRes.data.data._id;

      const execRes = await api.post(`/api/workflows/${workflowId}/execute`, {
        inputs: { source: 'builder_direct_run', prompt },
      });

      router.push(`/executions/${execRes.data.data._id}`);
    } catch (err) {
      alert('Failed to execute generated workflow: ' + err.message);
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
          {/* Top Toolbar / Prompt Input Panel */}
          <div className="p-4 rounded-3xl bg-surface border border-surface-border shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 relative z-30">
            {/* Prompt Form & Auto-complete Container */}
            <div className="flex-1 flex items-center space-x-2 relative" ref={containerRef}>
              <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your automation (e.g. When an invoice webhook arrives, extract items, append to Google Sheets, and notify Slack)..."
                  className="w-full bg-surface-card border border-surface-border focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner pr-8"
                />

                {prompt && (
                  <button
                    onClick={() => {
                      setPrompt('');
                      setIsDropdownOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Real-Time Prompt Suggestions Dropdown Panel */}
                {isDropdownOpen && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-surface-border/50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 bg-surface-card/60 flex items-center justify-between text-[11px] text-slate-400 border-b border-surface-border/60">
                      <span className="font-semibold flex items-center space-x-1.5 text-indigo-300">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Prompt Suggestions ({filteredSuggestions.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ↑↓ Navigate • Enter to Synthesize • Click to Select
                      </span>
                    </div>

                    {filteredSuggestions.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = selectedIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(item, false)}
                          className={`p-3.5 hover:bg-surface-card transition cursor-pointer flex items-start justify-between gap-3 group ${
                            isSelected ? 'bg-indigo-600/15 border-l-4 border-indigo-500 pl-3' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-xl ${item.bgColor} ${item.borderColor} border shrink-0 mt-0.5`}>
                              <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition truncate">
                                  {item.title}
                                </span>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-card text-slate-400 border border-surface-border">
                                  {item.category}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                                {item.prompt}
                              </p>

                              {/* Integrations Chips */}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.integrations.map((intg, iIdx) => (
                                  <span
                                    key={iIdx}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface text-slate-400 border border-surface-border/60 uppercase"
                                  >
                                    {intg}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quick 1-Click Synthesize Button */}
                          <div className="flex items-center space-x-1.5 shrink-0 self-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSuggestion(item, true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Synthesize</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Graph</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions for generated graph */}
            {generatedPreview && (
              <div className="flex items-center space-x-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-border">
                <button
                  onClick={handleSaveToStudio}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-200 text-xs font-semibold flex items-center space-x-2 transition"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Open in Canvas Studio</span>
                </button>

                <button
                  onClick={handleExecuteDirectly}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Multi-Agent Run</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 rounded-3xl bg-surface border border-surface-border overflow-hidden shadow-2xl relative z-10">
            {generatedPreview && (
              <div className="absolute top-4 left-4 z-10 p-3.5 rounded-2xl bg-surface/90 backdrop-blur-md border border-surface-border max-w-sm space-y-1 shadow-lg pointer-events-none">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-100">{generatedPreview.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {generatedPreview.description}
                </p>
                <div className="pt-1 flex items-center space-x-3 text-[10px] text-indigo-400 font-mono">
                  <span>{generatedPreview.nodes?.length || 0} nodes</span>
                  <span>{generatedPreview.edges?.length || 0} edges</span>
                  <span className="text-slate-500 capitalize">via {generatedPreview.generatedBy || 'ai'}</span>
                </div>
              </div>
            )}

            {!generatedPreview && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-200">Natural Language Workflow Generator</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Click the prompt bar above or start typing keywords (e.g. <em>invoice, support, lead, discord, sheets</em>) to see smart automation templates.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mb-3">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Synthesizing workflow graph nodes & edges...</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">Applying topological schema constraints</p>
              </div>
            )}

            <WorkflowCanvas readOnly={false} />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
