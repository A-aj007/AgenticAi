import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationDrawer from './NotificationDrawer';

export default function AppShell({ children }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        {/* Top Navbar */}
        <Navbar onOpenNotifications={() => setNotificationsOpen(true)} />

        {/* Dynamic Page Body */}
        <main className="flex-1 pt-16 p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
