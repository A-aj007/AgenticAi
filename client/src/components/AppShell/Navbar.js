import { useState, useEffect } from 'react';
import { Bell, Cpu, Radio, Network, CheckCircle2 } from 'lucide-react';
import { getSocket } from '../../services/socket';
import api from '../../services/api';

export default function Navbar({ onOpenNotifications }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ langGraphStatus: 'available', status: 'HEALTHY' });

  useEffect(() => {
    // Initial fetch of unread count and health
    api
      .get('/api/notifications')
      .then((res) => setUnreadCount(res.data.unreadCount || 0))
      .catch(() => {});

    api
      .get('/api/health')
      .then((res) => setSystemHealth(res.data))
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);

      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      const onNewNotif = () => setUnreadCount((c) => c + 1);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('notification:new', onNewNotif);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('notification:new', onNewNotif);
      };
    }
  }, []);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-surface-border fixed top-0 right-0 left-64 z-30 px-6 flex items-center justify-between">
      {/* Left: Subtitle / Engine status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Multi-Agent Engine Active</span>
        </div>

        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5" />
          <span>LangGraph: {systemHealth.langGraphStatus || 'available'}</span>
        </div>
      </div>

      {/* Right: Status lights & Notification Drawer trigger */}
      <div className="flex items-center space-x-4">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Radio className={`w-3.5 h-3.5 ${socketConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline font-mono">{socketConnected ? 'LIVE STREAM' : 'OFFLINE'}</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-surface-card hover:bg-slate-800 text-slate-300 hover:text-white border border-surface-border transition shadow-sm"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
