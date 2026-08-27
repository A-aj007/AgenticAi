import { useState, useEffect } from 'react';
import { X, Trash2, Sliders, Info, Variable, Check } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode, setSelectedNode, nodes } = useWorkflowStore();

  const [label, setLabel] = useState('');
  const [action, setAction] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setAction(selectedNode.data?.action || '');
      setConfig(selectedNode.data?.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const { id, type, data = {} } = selectedNode;
  const provider = data.provider || type;
  const category = data.category || type;

  const handleConfigChange = (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateNodeData(id, { config: updated });
  };

  const handleLabelChange = (newLabel) => {
    setLabel(newLabel);
    updateNodeData(id, { label: newLabel });
  };

  const handleActionChange = (newAction) => {
    setAction(newAction);
    updateNodeData(id, { action: newAction });
  };

  const otherNodes = nodes.filter((n) => n.id !== id);

  return (
    <div className="w-80 bg-surface border-l border-surface-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-card/30">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Node Configuration</h3>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node ID & Provider */}
        <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Node Identifier</span>
            <span className="font-mono text-slate-300 font-semibold">{id}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase">
            {provider}
          </span>
        </div>

        {/* Step Label */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium">Display Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Action Select */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium">Operation Action</label>
          <select
            value={action}
            onChange={(e) => handleActionChange(e.target.value)}
            className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            {provider === 'gmail' && (
              <>
                <option value="send_email">Send Email (Gmail)</option>
                <option value="read_emails">Read Inbound Emails</option>
              </>
            )}
            {provider === 'slack' && (
              <>
                <option value="post_message">Post Message to Channel</option>
                <option value="send_notification">Direct Notification</option>
              </>
            )}
            {provider === 'discord' && (
              <>
                <option value="send_message">Send Discord Message</option>
                <option value="post_alert">Post Critical Alert</option>
              </>
            )}
            {provider === 'google-sheets' && (
              <>
                <option value="append_row">Append Row to Sheet</option>
                <option value="read_range">Read Spreadsheet Range</option>
              </>
            )}
            {(provider === 'ai-model' || category === 'ai') && (
              <>
                <option value="summarize">Reasoning & Synthesis</option>
                <option value="classify">Classification & Sentiment</option>
                <option value="extract_entities">Entity Extraction</option>
              </>
            )}
            {(provider === 'webhook' || category === 'trigger') && (
              <>
                <option value="receive_payload">Receive Inbound Event</option>
                <option value="start_run">Manual Trigger</option>
              </>
            )}
          </select>
        </div>

        {/* Provider Specific Parameters */}
        <div className="pt-2 border-t border-surface-border space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parameters & Payload</h4>

          {provider === 'gmail' && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400">Recipient (To:)</label>
                <input
                  type="text"
                  value={config.to || ''}
                  onChange={(e) => handleConfigChange('to', e.target.value)}
                  placeholder="operator@agentflow.ai or {{nodes.node-1.email}}"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Subject</label>
                <input
                  type="text"
                  value={config.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  placeholder="Workflow execution report"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Email Body</label>
                <textarea
                  rows={3}
                  value={config.body || ''}
                  onChange={(e) => handleConfigChange('body', e.target.value)}
                  placeholder="Automation summary: {{nodes.node-2.output}}"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </>
          )}

          {provider === 'slack' && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400">Channel Name</label>
                <input
                  type="text"
                  value={config.channel || ''}
                  onChange={(e) => handleConfigChange('channel', e.target.value)}
                  placeholder="#ops-stream"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Message Content</label>
                <textarea
                  rows={3}
                  value={config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  placeholder="Notification: {{nodes.node-2.summary}}"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </>
          )}

          {provider === 'discord' && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400">Channel ID or Name</label>
                <input
                  type="text"
                  value={config.channelId || ''}
                  onChange={(e) => handleConfigChange('channelId', e.target.value)}
                  placeholder="support-channel"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Message Text</label>
                <textarea
                  rows={3}
                  value={config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  placeholder="Alert payload: {{nodes.node-1.payload}}"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </>
          )}

          {provider === 'google-sheets' && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400">Spreadsheet ID</label>
                <input
                  type="text"
                  value={config.spreadsheetId || ''}
                  onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                  placeholder="finance_ledger_2026"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Sheet Range</label>
                <input
                  type="text"
                  value={config.range || ''}
                  onChange={(e) => handleConfigChange('range', e.target.value)}
                  placeholder="Sheet1!A1"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {(provider === 'ai-model' || category === 'ai') && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400">LLM Model</label>
                <select
                  value={config.model || 'claude-3.5-sonnet'}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                >
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                  <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Prompt / Instruction</label>
                <textarea
                  rows={4}
                  value={config.prompt || config.instruction || ''}
                  onChange={(e) => handleConfigChange('prompt', e.target.value)}
                  placeholder="Analyze data from: {{nodes.node-1.payload}} and summarize action points."
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </>
          )}

          {category === 'trigger' && (
            <div className="space-y-1">
              <label className="text-slate-400">Webhook Endpoint</label>
              <input
                type="text"
                value={config.endpoint || '/api/v1/webhook'}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
              />
            </div>
          )}
        </div>

        {/* Dynamic Variable Interpolator Reference */}
        {otherNodes.length > 0 && (
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-indigo-400">
              <Variable className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">Available Output Variables</span>
            </div>
            <p className="text-[10px] text-slate-400">Click to copy template tag:</p>
            <div className="space-y-1">
              {otherNodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => navigator.clipboard.writeText(`{{nodes.${n.id}.output}}`)}
                  className="px-2 py-1 rounded bg-surface-card hover:bg-slate-800 text-[10px] font-mono text-slate-300 cursor-pointer flex items-center justify-between transition"
                >
                  <span>{`{{nodes.${n.id}.output}}`}</span>
                  <span className="text-[9px] text-slate-500">{n.data?.label || n.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Delete */}
      <div className="p-4 border-t border-surface-border bg-surface-card/30">
        <button
          onClick={() => deleteNode(id)}
          className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium flex items-center justify-center space-x-2 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Node from Canvas</span>
        </button>
      </div>
    </div>
  );
}
