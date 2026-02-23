'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    setLoading(true);
    fetch('/api/notifications?limit=15')
      .then((res) => (res.ok ? res.json() : { notifications: [], unreadCount: 0 }))
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="p-2 rounded-lg hover:bg-green-50 relative"
        aria-label="Notificações"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 w-80 max-h-[400px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500">{unreadCount} não lida(s)</span>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500 text-sm">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifications.map((n) => (
                    <li key={n.id} className={n.readAt ? 'bg-gray-50/50' : ''}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => { if (!n.readAt) markAsRead(n.id); setOpen(false); }}
                          className="block px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              {n.message && (
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                          </div>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { if (!n.readAt) markAsRead(n.id); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          {n.message && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
