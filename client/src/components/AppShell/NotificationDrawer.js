import { useState, useEffect } from 'react';
import { X, CheckCheck, Bell, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {}
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failure':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'escalation':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-surface-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-card/40">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-100">Live Notifications</h2>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllRead}
                title="Mark all as read"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Loading activity feed...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">Execution alerts and system events will stream here live.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => markSingleRead(n._id || n.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    n.isRead
                      ? 'bg-surface-card/40 border-surface-border/60 text-slate-400'
                      : 'bg-surface-card border-indigo-500/30 text-slate-200 shadow-md shadow-indigo-950/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
