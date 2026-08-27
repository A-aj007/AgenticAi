import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Sparkles,
  Workflow,
  PlayCircle,
  Plug,
  Settings,
  Shield,
  Activity,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Prompt Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Executions', href: '/executions', icon: PlayCircle },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col justify-between h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center">
                Agentflow<span className="text-indigo-400">_AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-mono">Agentic Console</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-surface-border bg-surface-card/30">
        <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
              {user?.name ? user.name[0] : 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Operator'}</p>
              <div className="flex items-center space-x-1">
                <Shield className="w-2.5 h-2.5 text-indigo-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{user?.role || 'operator'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
