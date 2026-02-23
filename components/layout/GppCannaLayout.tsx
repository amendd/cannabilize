'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLogoUrl } from '@/lib/public-config-context';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  FileStack,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GppCannaLayoutProps {
  children: React.ReactNode;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: Array<{ icon: React.ElementType; label: string; href: string; exact?: boolean }>;
  defaultOpen?: boolean;
}

export default function GppCannaLayout({ children }: GppCannaLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['dashboard', 'gestao']));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const menuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      items: [{ icon: LayoutDashboard, label: 'Visão geral', href: '/gpp-canna', exact: true }],
      defaultOpen: true,
    },
    {
      id: 'gestao',
      label: 'Gestão',
      icon: UserCircle,
      items: [
        { icon: UserCircle, label: 'Pacientes', href: '/gpp-canna/pacientes' },
        { icon: FileText, label: 'Prescrições', href: '/gpp-canna/prescricoes' },
        { icon: FileStack, label: 'Documentos (upload)', href: '/gpp-canna/documentos' },
      ],
      defaultOpen: true,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: ShieldCheck,
      items: [
        { icon: ShieldCheck, label: 'Consentimentos', href: '/gpp-canna/consentimentos' },
        { icon: History, label: 'Auditoria', href: '/gpp-canna/auditoria' },
      ],
    },
  ];

  useEffect(() => {
    const defaultOpen = new Set<string>();
    menuGroups.forEach((g) => {
      if (g.defaultOpen) defaultOpen.add(g.id);
    });
    setExpandedGroups(defaultOpen);
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Desktop — tema GPP (indigo) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow min-h-0 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white shadow-lg">
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-indigo-700">
            <Link href="/gpp-canna" className="flex items-center gap-3">
              <span className="bg-white/95 rounded-md px-2 py-1 shadow-sm">
                <LogoImage width={120} height={40} className="h-8 w-auto" alt="CannabiLize" />
              </span>
              <span className="text-xs font-semibold text-indigo-200 bg-indigo-800/50 px-2 py-0.5 rounded">
                GPP CANNA
              </span>
            </Link>
          </div>

          <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto">
            {menuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups.has(group.id);
              const hasActiveItem = group.items.some((item) => isActive(item.href, item.exact));

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      hasActiveItem ? 'bg-indigo-700/30 text-white' : 'text-indigo-100 hover:bg-indigo-700/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <GroupIcon size={18} className="mr-2.5" />
                      <span>{group.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 pl-2 border-l-2 border-indigo-700/30 space-y-1 mt-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href, item.exact);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  active ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-700/50 hover:text-white'
                                }`}
                              >
                                <Icon size={18} className="mr-2.5" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-indigo-700">
            <div className="flex items-center px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Usuário'}</p>
                <p className="text-xs text-indigo-200 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin"
                className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-indigo-100 rounded-lg hover:bg-indigo-700/50 transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/erp-canna"
                className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-indigo-100 rounded-lg hover:bg-indigo-700/50 transition-colors"
              >
                ERP CANNA
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center px-4 py-2 text-sm font-medium text-indigo-100 rounded-lg hover:bg-indigo-700/50 transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white lg:hidden"
            >
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-700 flex-shrink-0">
                  <span className="text-sm font-semibold text-indigo-200">GPP CANNA</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-indigo-700">
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto">
                  {menuGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const isExpanded = expandedGroups.has(group.id);
                    return (
                      <div key={group.id} className="space-y-1">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg text-indigo-100 hover:bg-indigo-700/30"
                        >
                          <div className="flex items-center">
                            <GroupIcon size={18} className="mr-2.5" />
                            <span>{group.label}</span>
                          </div>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        {isExpanded && (
                          <div className="ml-6 pl-2 border-l-2 border-indigo-700/30 space-y-1 mt-1">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className="flex items-center px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-700/50 rounded-lg"
                                >
                                  <Icon size={18} className="mr-2.5" />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">GPP CANNA</h1>
            <p className="text-xs text-slate-500">Gestão de Pacientes e Prescrições — LGPD e ANVISA</p>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
