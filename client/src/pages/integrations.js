import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import api from '../services/api';
import {
  Plug,
  Mail,
  MessageSquare,
  Bot,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Plus,
  X,
  Loader2,
  Lock,
} from 'lucide-react';

const providerMeta = {
  gmail: {
    name: 'Gmail & Google Workspace',
    description: 'Send alerts, dispatch formatted emails, and read inbound operational messages.',
    icon: Mail,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  slack: {
    name: 'Slack Team Messaging',
    description: 'Post automated notifications and interactive message blocks to operational channels.',
    icon: MessageSquare,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
  },
  discord: {
    name: 'Discord Ops Bot',
    description: 'Post alerts and rich embeds to Discord incident response and server channels.',
    icon: Bot,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  'google-sheets': {
    name: 'Google Sheets Data Ledger',
    description: 'Append rows, log events, and read ranges from live Google spreadsheets.',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState(null);

  // Manual config modal state
  const [activeModalProvider, setActiveModalProvider] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const [listRes, statusRes] = await Promise.all([
        api.get('/api/integrations'),
        api.get('/api/integrations/status'),
      ]);
      setIntegrations(listRes.data.data || []);
      setHealthStatus(statusRes.data.data || {});
    } catch (err) {
      console.warn('Integrations fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleStartOAuth = async (provider) => {
    try {
      const res = await api.get(`/api/integrations/oauth/${provider}/start`);
      if (res.data.data?.authUrl) {
        window.location.href = res.data.data.authUrl;
      }
    } catch (err) {
      alert('OAuth start error: ' + err.message);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider}? Existing workflows using this integration will fail or fall back to simulation.`)) return;
    try {
      await api.delete(`/api/integrations/${provider}`);
      fetchIntegrations();
    } catch (err) {
      alert('Disconnect error: ' + err.message);
    }
  };

  const handleSaveManualConfig = async (e) => {
    e.preventDefault();
    if (!manualToken) return;

    setIsSubmitting(true);
    try {
      await api.post('/api/integrations', {
        provider: activeModalProvider,
        accessToken: manualToken,
        accountEmail: accountEmail || `${activeModalProvider}_operator@agentflow.ai`,
      });
      setActiveModalProvider(null);
      setManualToken('');
      setAccountEmail('');
      fetchIntegrations();
    } catch (err) {
      alert('Manual configuration failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256 Application-Level Encryption at Rest</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
                <Plug className="w-6 h-6 text-indigo-400" />
                <span>Integrations & Credential Vault</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Securely connect third-party platforms with OAuth 2.0. Sensitive tokens are encrypted at rest with{' '}
                <code className="text-indigo-300 font-mono">CREDENTIAL_ENCRYPTION_KEY</code>.
              </p>
            </div>

            <button
              onClick={fetchIntegrations}
              className="p-2.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Health</span>
            </button>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['gmail', 'slack', 'discord', 'google-sheets'].map((providerKey) => {
              const meta = providerMeta[providerKey];
              const item = integrations.find((i) => i.provider === providerKey);
              const health = healthStatus[providerKey];
              const isConnected = item?.isConnected || health?.connected;
              const Icon = meta.icon;

              return (
                <div
                  key={providerKey}
                  className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xl flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Top Status Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-3 rounded-2xl ${meta.bg} ${meta.border} border`}>
                          <Icon className={`w-6 h-6 ${meta.color}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">{meta.name}</h3>
                          <span className="text-[10px] text-slate-500 font-mono uppercase">
                            Provider: {providerKey}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isConnected ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>CONNECTED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
                            <AlertCircle className="w-3 h-3" />
                            <span>DISCONNECTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{meta.description}</p>

                    {/* Connection Info */}
                    {isConnected && (
                      <div className="p-3 rounded-2xl bg-surface-card border border-surface-border space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Connected Account:</span>
                          <span className="font-mono text-slate-200 font-medium">
                            {item?.accountEmail || health?.account || 'operator@agentflow.ai'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Encryption:</span>
                          <span className="font-mono text-emerald-400 flex items-center space-x-1">
                            <Lock className="w-3 h-3 inline" />
                            <span>AES-256 Encrypted</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-3">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleStartOAuth(providerKey)}
                          className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-xs font-semibold text-slate-200 transition"
                        >
                          Reconnect OAuth
                        </button>
                        <button
                          onClick={() => handleDisconnect(providerKey)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartOAuth(providerKey)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Connect with OAuth</span>
                        </button>

                        <button
                          onClick={() => setActiveModalProvider(providerKey)}
                          className="py-2.5 px-3.5 rounded-xl bg-surface-card hover:bg-slate-800 border border-surface-border text-slate-300 text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>Manual Token</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Credential Configuration Modal */}
          {activeModalProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md bg-surface border border-surface-border rounded-3xl shadow-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">
                      Configure {activeModalProvider} Credential
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveModalProvider(null)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveManualConfig} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Account Email / Identifier
                    </label>
                    <input
                      type="text"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="operator@workspace.com"
                      className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Access Token / Bot Secret / Webhook URL
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste your OAuth access token, Slack bot token (xoxb-...), or Discord webhook URL"
                      className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      This token will be encrypted using AES-256 before writing to MongoDB.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveModalProvider(null)}
                      className="px-4 py-2 rounded-xl bg-surface-card hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !manualToken}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Encrypt & Save</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
